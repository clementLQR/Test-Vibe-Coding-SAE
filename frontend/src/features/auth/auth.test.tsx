import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import { installedSite, jsonResponse, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'
import { safeRedirect } from './redirect'

describe('safeRedirect', () => {
  it.each([
    ['/admin-app/media', '/admin-app/media'],
    [null, '/'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
  ])('%s → %s', (target, expected) => {
    expect(safeRedirect(target)).toBe(expected)
  })
})

describe('login and registration', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => vi.unstubAllGlobals())

  it('logs in and goes back to the requested page', async () => {
    const author = userWith(['ROLE_AUTHOR'], 'Ana')
    const fetchMock = installedSite(null, { 'POST /api/login': { user: author } })
    renderRoute('/login?redirect=%2Fadmin-app')

    await userEvent.type(await screen.findByLabelText('Adresse e-mail'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('Bonjour Ana !')).toBeInTheDocument()
    const [, init] = fetchMock.mock.calls.find(([url]) => String(url) === '/api/login') ?? []
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'ana@example.com', password: 'secret-password' })
  })

  it('shows the API error message when the login fails', async () => {
    installedSite(null, {
      'POST /api/login': jsonResponse({ message: 'E-mail ou mot de passe incorrect.' }, 401),
    })
    renderRoute('/login')

    await userEvent.type(await screen.findByLabelText('Adresse e-mail'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou mot de passe incorrect.')
  })

  it('shows validation errors next to the registration fields', async () => {
    installedSite(null, {
      'POST /api/register': jsonResponse(
        { violations: [{ propertyPath: 'email', title: 'Cette adresse e-mail est déjà utilisée.' }] },
        422,
      ),
    })
    renderRoute('/register')

    await userEvent.type(await screen.findByLabelText('Adresse e-mail'), 'taken@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    const email = await screen.findByLabelText('Adresse e-mail')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Cette adresse e-mail est déjà utilisée.')
  })

  it('logs out from the header', async () => {
    installedSite(userWith([], 'Sam'), { 'POST /api/logout': new Response(null, { status: 204 }) })
    renderRoute('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Se déconnecter (Sam)' }))

    expect(await screen.findByRole('link', { name: 'Se connecter' })).toBeInTheDocument()
  })
})
