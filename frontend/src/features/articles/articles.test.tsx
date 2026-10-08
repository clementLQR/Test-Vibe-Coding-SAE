import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import type { ArticleInput } from '../../lib/api/types'
import { AFFLUENCE_DATA, article, CHART } from '../../test/contentFixtures'
import { installedSite, jsonResponse, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'

// ECharts cannot draw in jsdom: the chart builder has its own unit tests
vi.mock('../charts/EChart', () => ({ default: () => <div data-testid="echart" /> }))

const AUTHOR = userWith(['ROLE_AUTHOR'], 'Alex')

function bodyOf(init: RequestInit | undefined): ArticleInput {
  return JSON.parse(String(init?.body)) as ArticleInput
}

describe('article editor', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => vi.unstubAllGlobals())

  it('writes a new classic article and opens it', async () => {
    let sent: ArticleInput | undefined
    const saved = article({ type: 'classic', blocks: [] })
    installedSite(AUTHOR, {
      'POST /api/articles': (init: RequestInit | undefined) => {
        sent = bodyOf(init)
        return jsonResponse(saved, 201)
      },
      'GET /api/articles/21': saved,
    })
    renderRoute('/admin-app/articles/new')

    await userEvent.type(await screen.findByLabelText('Titre'), 'Le festival en images')
    await userEvent.click(screen.getByRole('button', { name: '+ Titre' }))
    await userEvent.type(screen.getByLabelText('Texte du titre'), 'Ambiance')
    await userEvent.click(screen.getByRole('button', { name: '+ Texte' }))
    await userEvent.type(screen.getAllByLabelText('Texte').at(-1)!, 'Une belle édition.')
    expect(screen.getByRole('button', { name: '+ Graphique' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByRole('heading', { name: 'Modifier l’article' })).toBeInTheDocument()
    expect(sent).toEqual({
      title: 'Le festival en images',
      summary: '',
      type: 'classic',
      status: 'draft',
      locale: 'fr',
      blocks: [
        { type: 'heading', headingLevel: 2, text: 'Ambiance' },
        { type: 'text', text: 'Une belle édition.' },
      ],
    })
  })

  it('reorders blocks with the keyboard and keeps their ids', async () => {
    let sent: ArticleInput | undefined
    installedSite(AUTHOR, {
      'GET /api/articles/21': article(),
      'GET /api/visualizations': [CHART],
      'PUT /api/articles/21': (init: RequestInit | undefined) => {
        sent = bodyOf(init)
        return article()
      },
    })
    renderRoute('/admin-app/articles/21')

    const moveDown = await screen.findByRole('button', { name: 'Descendre le bloc 1' })
    moveDown.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: 'Bloc 1 : Texte' })).toBeInTheDocument()
    await vi.waitFor(() => expect(document.activeElement).toHaveAccessibleName('Descendre le bloc 2'))

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer le bloc 3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('Article enregistré.')).toBeInTheDocument()
    expect(sent?.blocks).toEqual([
      { id: 102, type: 'text', text: 'Une **belle** édition.' },
      { id: 101, type: 'heading', headingLevel: 2, text: 'Affluence' },
    ])
  })

  it('shows server errors on the blocks concerned', async () => {
    installedSite(AUTHOR, {
      'GET /api/articles/21': article(),
      'GET /api/visualizations': [CHART],
      'PUT /api/articles/21': jsonResponse(
        {
          violations: [
            { propertyPath: 'blocks[1].text', message: 'Ce bloc est vide.' },
            {
              propertyPath: 'blocks',
              message: 'Un article de type tableau de bord doit contenir au moins un graphique.',
            },
          ],
        },
        422,
      ),
    })
    renderRoute('/admin-app/articles/21')

    await userEvent.click(await screen.findByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByLabelText('Texte')).toHaveAccessibleDescription(
      expect.stringContaining('Ce bloc est vide.'),
    )
    expect(
      screen.getByText('Un article de type tableau de bord doit contenir au moins un graphique.'),
    ).toBeInTheDocument()
  })

  it('previews the article with formatted text and an accessible chart', async () => {
    installedSite(AUTHOR, {
      'GET /api/articles/21': article(),
      'GET /api/visualizations': [CHART],
      'GET /api/datasets/3/data': AFFLUENCE_DATA,
    })
    renderRoute('/admin-app/articles/21')

    await userEvent.click(await screen.findByRole('button', { name: 'Aperçu' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Bilan' })).toBeInTheDocument()
    expect(screen.getByText('belle', { selector: 'strong' })).toBeInTheDocument()
    const figure = await screen.findByRole('figure', { name: /Public par scène/ })
    expect(await within(figure).findByTestId('echart')).toBeInTheDocument()

    await userEvent.click(within(figure).getByRole('button', { name: 'Voir les données' }))
    const table = within(figure).getByRole('table', { name: 'Données du graphique « Public par scène »' })
    expect(within(table).getByRole('rowheader', { name: 'Grande scène' })).toBeInTheDocument()
    // French uses a narrow no-break space as thousands separator
    expect(within(table).getByRole('cell', { name: /^1\s200$/ })).toBeInTheDocument()
  })
})
