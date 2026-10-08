import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import type { Page, PublicArticle } from '../../lib/api/types'
import { article } from '../../test/contentFixtures'
import { installedSite, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'

vi.mock('../charts/EChart', () => ({ default: () => <div data-testid="echart" /> }))

const PUBLISHED: PublicArticle = {
  translations: [],
  ...article({
    status: 'published',
    type: 'classic',
    slug: 'bilan',
    publishedAt: '2027-07-13T10:00:00+02:00',
    blocks: [
      { id: 101, position: 0, type: 'heading', headingLevel: 2, text: 'Affluence', media: null, visualization: null },
      {
        id: 102,
        position: 1,
        type: 'text',
        headingLevel: null,
        text: 'Merci à tous.',
        media: null,
        visualization: null,
      },
    ],
  }),
}

describe('public site', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute('style')
  })

  it('shows the latest articles and the menu pages', async () => {
    const fetchMock = installedSite(null, {
      'GET /api/articles': [PUBLISHED],
      'GET /api/menu': [{ title: 'Infos pratiques', slug: 'infos' }],
    })
    renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Bilan' })).toHaveAttribute('href', '/articles/bilan')
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' })
    expect(await within(nav).findByRole('link', { name: 'Infos pratiques' })).toHaveAttribute('href', '/pages/infos')
    const urls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(urls).toContain('/api/articles?status=published&locale=fr')
    expect(urls).toContain('/api/menu?locale=fr')
  })

  it('shows ratings to visitors and invites them to log in', async () => {
    installedSite(null, {
      'GET /api/articles/by-slug/bilan': PUBLISHED,
      'GET /api/articles/21/ratings': { blocks: { 102: { average: 4.5, count: 2, mine: null } } },
    })
    renderRoute('/articles/bilan')

    expect(await screen.findByRole('heading', { level: 1, name: 'Bilan' })).toBeInTheDocument()
    expect(await screen.findByText('Note moyenne : 4,5 / 5 (2 avis)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Connectez-vous pour noter' })).toHaveAttribute(
      'href',
      '/login?redirect=%2Farticles%2Fbilan',
    )
    expect(document.title).toBe('Bilan · Festival des Lumières')
  })

  it('lets a subscriber rate a block with the keyboard', async () => {
    let sent: unknown
    installedSite(userWith([]), {
      'GET /api/articles/by-slug/bilan': PUBLISHED,
      'GET /api/articles/21/ratings': { blocks: {} },
      'PUT /api/blocks/102/rating': (init: RequestInit | undefined) => {
        sent = JSON.parse(String(init?.body))
        return { average: 4, count: 1, mine: 4 }
      },
    })
    renderRoute('/articles/bilan')

    const group = await screen.findByRole('group', { name: 'Votre note pour ce bloc' })
    await userEvent.click(within(group).getByRole('radio', { name: '4 étoiles' }))

    expect(await screen.findByText('Note moyenne : 4 / 5 (1 avis)')).toBeInTheDocument()
    expect(sent).toEqual({ score: 4 })
    expect(within(group).getByRole('radio', { name: '4 étoiles' })).toBeChecked()
  })

  it('links to the published version in the other language', async () => {
    installedSite(null, {
      'GET /api/articles/by-slug/bilan': {
        ...PUBLISHED,
        translations: [{ locale: 'en', slug: 'review', title: 'Review' }],
      },
      'GET /api/articles/21/ratings': { blocks: {} },
    })
    renderRoute('/articles/bilan')

    const link = await screen.findByRole('link', { name: 'Read in English' })
    expect(link).toHaveAttribute('href', '/articles/review')
    expect(link).toHaveAttribute('lang', 'en')
  })

  it('collapses the main menu behind a button on small screens', async () => {
    installedSite(null)
    renderRoute('/')

    const button = await screen.findByRole('button', { name: /Menu/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById('main-nav')).toHaveClass('hidden')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('main-nav')).not.toHaveClass('hidden')
  })

  it('shows the 404 page for an unknown or unpublished article', async () => {
    installedSite(null)
    renderRoute('/articles/inconnu')

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
  })

  it('applies the site theme, overridden by the article theme, but not in the admin', async () => {
    installedSite(userWith(['ROLE_AUTHOR']), {
      'GET /api/active-themes': [
        { scope: 'site', pageId: null, articleId: null, tokens: { headerBg: '#14213d', accent: '#fca311' } },
        { scope: 'article', pageId: null, articleId: 21, tokens: { accent: '#e63946' } },
      ],
      'GET /api/articles/by-slug/bilan': PUBLISHED,
      'GET /api/articles/21/ratings': { blocks: {} },
      'GET /api/articles': [],
    })
    const { unmount } = renderRoute('/articles/bilan')

    await screen.findByRole('heading', { level: 1, name: 'Bilan' })
    const style = document.documentElement.style
    await vi.waitFor(() => expect(style.getPropertyValue('--ev-accent')).toBe('#e63946'))
    expect(style.getPropertyValue('--ev-header-bg')).toBe('#14213d')
    unmount()

    renderRoute('/admin-app')
    await screen.findByRole('heading', { name: 'Administration' })
    expect(style.getPropertyValue('--ev-header-bg')).toBe('')
  })

  it('adds the event information to contact pages', async () => {
    const contact: Page = {
      id: 4,
      title: 'Contact',
      slug: 'contact',
      template: 'contact',
      status: 'published',
      showInMenu: true,
      menuOrder: 0,
      locale: 'fr',
      blocks: [
        {
          id: 1,
          position: 0,
          type: 'text',
          headingLevel: null,
          text: 'Écrivez-nous.',
          media: null,
          visualization: null,
        },
      ],
      updatedAt: '2026-10-08T10:00:00+02:00',
    }
    installedSite(null, { 'GET /api/pages/by-slug/contact': contact })
    renderRoute('/pages/contact')

    expect(await screen.findByRole('heading', { name: 'Informations pratiques' })).toBeInTheDocument()
    expect(screen.getByText('Écrivez-nous.')).toBeInTheDocument()
    expect(screen.getByText('Tours')).toBeInTheDocument()
  })
})
