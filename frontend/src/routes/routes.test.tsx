import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../lib/i18n'
import { installedSite, mockApi, userWith } from '../test/mockApi'
import { renderRoute } from '../test/renderWithProviders'

describe('routes', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => vi.unstubAllGlobals())

  it('sends every page to the installer until the site is installed', async () => {
    mockApi({ 'GET /api/install/status': { installed: false } })
    renderRoute('/admin-app')

    expect(await screen.findByRole('heading', { name: 'Installation de votre site' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: "Nom du site ou de l'événement" })).toBeInTheDocument()
  })

  it('closes the installer once the site is installed', async () => {
    installedSite(null)
    renderRoute('/installer')

    expect(await screen.findByRole('heading', { level: 1, name: 'Festival des Lumières' })).toBeInTheDocument()
  })

  it('shows the event information on the home page', async () => {
    installedSite(null)
    renderRoute('/')

    expect(await screen.findByText('Du 10 juillet 2027 au 12 juillet 2027')).toBeInTheDocument()
    expect(screen.getByText('Tours')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Se connecter' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument()
  })

  it('switches the interface to English', async () => {
    installedSite(null)
    renderRoute('/')

    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Langue' }), 'en')

    expect(await screen.findByText('From July 10, 2027 to July 12, 2027')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('renders the 404 page for unknown URLs', async () => {
    installedSite(null)
    renderRoute('/does-not-exist')

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
  })

  it('sends visitors of the admin to the login page', async () => {
    installedSite(null)
    renderRoute('/admin-app/media')

    expect(await screen.findByRole('heading', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('refuses the admin to subscribers', async () => {
    installedSite(userWith([]))
    renderRoute('/admin-app')

    expect(await screen.findByRole('alert')).toHaveTextContent("Vous n'avez pas accès à cette page.")
  })

  it('shows each role only the admin sections it may use', async () => {
    installedSite(userWith(['ROLE_AUTHOR']))
    const { unmount } = renderRoute('/admin-app')

    const menu = await screen.findByRole('navigation', { name: "Menu de l'administration" })
    expect(menu).toHaveTextContent('Médiathèque')
    expect(menu).not.toHaveTextContent('Utilisateurs')
    unmount()

    installedSite(userWith(['ROLE_ADMIN', 'ROLE_EDITOR', 'ROLE_AUTHOR', 'ROLE_DESIGNER', 'ROLE_DATA_PROVIDER']))
    renderRoute('/admin-app')
    const adminMenu = await screen.findByRole('navigation', { name: "Menu de l'administration" })
    expect(adminMenu).toHaveTextContent('Utilisateurs')
    expect(screen.getByRole('link', { name: 'Back-office technique' })).toHaveAttribute('href', '/admin')
  })
})
