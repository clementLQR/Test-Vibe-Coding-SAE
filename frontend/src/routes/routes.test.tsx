import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../lib/i18n'
import { renderRoute } from '../test/renderWithProviders'

describe('routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    changeLocale('fr')
  })

  it('shows the API version on the home page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 'ok', version: '0.1.0' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    changeLocale('fr')
    renderRoute('/')

    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenue sur Evently' })).toBeInTheDocument()
    expect(await screen.findByText('API connectée (version 0.1.0)')).toBeInTheDocument()
  })

  it('switches the interface to English', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    changeLocale('fr')
    renderRoute('/')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Langue' }), 'en')

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to Evently' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('renders the 404 page for unknown URLs', () => {
    vi.stubGlobal('fetch', vi.fn())
    changeLocale('fr')
    renderRoute('/does-not-exist')

    expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
  })
})
