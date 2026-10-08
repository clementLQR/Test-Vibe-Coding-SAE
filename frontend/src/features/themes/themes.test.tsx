import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import type { Theme } from '../../lib/api/types'
import { installedSite, jsonResponse, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'

const PROPOSED: Theme = {
  id: 5,
  name: 'Nuit d’été',
  scope: 'site',
  page: null,
  article: null,
  pageId: null,
  articleId: null,
  targetTitle: null,
  tokens: { headerBg: '#14213d' },
  status: 'proposed',
  proposedById: 1,
  proposedByName: 'Dina',
  reviewComment: null,
  updatedAt: '2026-10-08T10:00:00+02:00',
}

describe('themes', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => vi.unstubAllGlobals())

  it('lets a designer propose a theme, warning about weak contrast', async () => {
    let sent: Record<string, unknown> | undefined
    installedSite(userWith(['ROLE_DESIGNER'], 'Dina'), {
      'GET /api/themes': [],
      'GET /api/pages': [],
      'GET /api/articles': [],
      'POST /api/themes': (init: RequestInit | undefined) => {
        sent = JSON.parse(String(init?.body)) as Record<string, unknown>
        return jsonResponse({ ...PROPOSED, id: 6 }, 201)
      },
    })
    renderRoute('/admin-app/themes')

    await userEvent.click(await screen.findByRole('button', { name: 'Proposer un thème' }))
    const dialog = await screen.findByRole('dialog', { name: 'Proposer un thème' })
    await userEvent.type(within(dialog).getByLabelText('Nom du thème'), 'Pastel')
    fireEvent.change(within(dialog).getByLabelText('Texte'), { target: { value: '#bbbbbb' } })

    expect(within(dialog).getByText('Texte sur Fond de page : 1.9:1')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Envoyer pour validation' }))
    await vi.waitFor(() => expect(sent).toBeDefined())
    expect(sent).toEqual({ name: 'Pastel', scope: 'site', page: null, article: null, tokens: { pageFg: '#bbbbbb' } })
  })

  it('lets an administrator approve or reject with a comment', async () => {
    const calls: { url: string; body?: unknown }[] = []
    installedSite(userWith(['ROLE_ADMIN', 'ROLE_DESIGNER', 'ROLE_EDITOR', 'ROLE_AUTHOR', 'ROLE_DATA_PROVIDER']), {
      'GET /api/themes': [PROPOSED],
      'POST /api/themes/5/approve': () => {
        calls.push({ url: 'approve' })
        return { ...PROPOSED, status: 'active' }
      },
      'POST /api/themes/5/reject': (init: RequestInit | undefined) => {
        calls.push({ url: 'reject', body: JSON.parse(String(init?.body)) })
        return { ...PROPOSED, status: 'rejected' }
      },
    })
    renderRoute('/admin-app/themes')

    await userEvent.click(await screen.findByRole('button', { name: 'Approuver et appliquer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Refuser' }))
    const dialog = await screen.findByRole('dialog', { name: 'Refuser le thème' })
    await userEvent.type(within(dialog).getByLabelText('Commentaire :'), 'Trop sombre.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refuser' }))

    await vi.waitFor(() => expect(calls).toHaveLength(2))
    expect(calls).toEqual([{ url: 'approve' }, { url: 'reject', body: { comment: 'Trop sombre.' } }])
  })
})
