import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import type { Media, UserSummary } from '../../lib/api/types'
import { installedSite, jsonResponse, mockApi, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'

const ADMIN = userWith(['ROLE_ADMIN', 'ROLE_EDITOR', 'ROLE_AUTHOR', 'ROLE_DESIGNER', 'ROLE_DATA_PROVIDER'])

const SAM: UserSummary = {
  id: 7,
  email: 'sam@example.com',
  displayName: 'Sam',
  locale: 'fr',
  roles: ['ROLE_SUBSCRIBER'],
  createdAt: '2026-10-01T10:00:00+02:00',
}

const PHOTO: Media = {
  id: 3,
  originalName: 'scene.jpg',
  mimeType: 'image/webp',
  size: 48_000,
  width: 1600,
  height: 900,
  altFr: '',
  altEn: '',
  altComplete: false,
  uploadedByName: 'Alex',
  createdAt: '2026-10-08T10:00:00+02:00',
  url: '/uploads/media/abc.webp',
  thumbnailUrl: '/uploads/media/abc-thumb.webp',
}

describe('admin', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => vi.unstubAllGlobals())

  it('lets an admin grant roles', async () => {
    const fetchMock = installedSite(ADMIN, {
      'GET /api/users': [SAM],
      'PATCH /api/users/7': { ...SAM, roles: ['ROLE_SUBSCRIBER', 'ROLE_AUTHOR'] },
    })
    renderRoute('/admin-app/users')

    const roles = await screen.findByRole('group', { name: 'Rôles de Sam' })
    await userEvent.click(within(roles).getByRole('checkbox', { name: 'Auteur·rice' }))
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer les rôles' }))

    expect(await screen.findByText('Rôles enregistrés.')).toBeInTheDocument()
    const [, init] = fetchMock.mock.calls.find(([, i]) => i?.method === 'PATCH') ?? []
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/merge-patch+json')
    expect(JSON.parse(String(init?.body))).toEqual({ roles: ['ROLE_AUTHOR'] })
  })

  it('lists media, flags missing alt texts and searches', async () => {
    const fetchMock = installedSite(userWith(['ROLE_AUTHOR']), {
      'GET /api/media': { member: [PHOTO], totalItems: 1 },
    })
    renderRoute('/admin-app/media')

    expect(await screen.findByText('1 image')).toBeInTheDocument()
    expect(screen.getByText('scene.jpg')).toBeInTheDocument()
    expect(screen.getByText('Texte alternatif à compléter avant utilisation.')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher une image' }), 'plan')
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes('q=plan'))).toBe(true))
  })

  it('uploads an image as multipart form data', async () => {
    let sent: FormData | undefined
    mockApi({
      'GET /api/install/status': { installed: true },
      'GET /api/me': { user: userWith(['ROLE_DESIGNER']) },
      'GET /api/media': { member: [], totalItems: 0 },
      'POST /api/media': (init: RequestInit | undefined) => {
        sent = init?.body as FormData
        return jsonResponse(PHOTO, 201)
      },
    })
    renderRoute('/admin-app/media')

    const file = new File(['x'], 'scene.jpg', { type: 'image/jpeg' })
    await userEvent.upload(await screen.findByLabelText('Fichier image'), file)
    await userEvent.type(screen.getAllByLabelText('Texte alternatif (français)')[0], 'Scène')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }))

    expect(await screen.findByText('Image ajoutée à la médiathèque.')).toBeInTheDocument()
    expect(sent?.get('file')).toBeInstanceOf(File)
    expect(sent?.get('altFr')).toBe('Scène')
  })
})
