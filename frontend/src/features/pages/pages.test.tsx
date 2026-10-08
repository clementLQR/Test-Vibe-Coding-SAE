import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import type { Page, PageInput } from '../../lib/api/types'
import { installedSite, jsonResponse, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'

const EDITOR = userWith(['ROLE_EDITOR', 'ROLE_AUTHOR'])

describe('pages admin', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => vi.unstubAllGlobals())

  it('creates a contact page shown in the menu', async () => {
    let sent: PageInput | undefined
    const saved: Page = {
      id: 4,
      title: 'Contact',
      slug: 'contact',
      template: 'contact',
      status: 'published',
      showInMenu: true,
      menuOrder: 3,
      locale: 'fr',
      blocks: [],
      updatedAt: '2026-10-08T10:00:00+02:00',
    }
    installedSite(EDITOR, {
      'POST /api/pages': (init: RequestInit | undefined) => {
        sent = JSON.parse(String(init?.body)) as PageInput
        return jsonResponse(saved, 201)
      },
      'GET /api/pages/4': saved,
    })
    renderRoute('/admin-app/pages/new')

    await userEvent.type(await screen.findByLabelText('Titre'), 'Contact')
    await userEvent.selectOptions(screen.getByLabelText('Modèle'), 'Contact')
    await userEvent.selectOptions(screen.getByLabelText('Statut'), 'Publié')
    await userEvent.clear(screen.getByLabelText('Ordre dans le menu'))
    await userEvent.type(screen.getByLabelText('Ordre dans le menu'), '3')
    await userEvent.click(screen.getByRole('button', { name: '+ Texte' }))
    await userEvent.type(screen.getAllByLabelText('Texte').at(-1)!, 'Écrivez-nous.')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByRole('heading', { name: 'Modifier la page' })).toBeInTheDocument()
    expect(sent).toEqual({
      title: 'Contact',
      template: 'contact',
      status: 'published',
      showInMenu: true,
      menuOrder: 3,
      locale: 'fr',
      blocks: [{ type: 'text', text: 'Écrivez-nous.' }],
    })
  })

  it('is reserved to editors', async () => {
    installedSite(userWith(['ROLE_AUTHOR']))
    renderRoute('/admin-app/pages')

    expect(await screen.findByRole('alert')).toHaveTextContent("Vous n'avez pas accès à cette page.")
  })
})
