import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import { AFFLUENCE, AFFLUENCE_DATA, CHART, CHART_TYPES } from '../../test/contentFixtures'
import { installedSite, jsonResponse, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'

vi.mock('./EChart', () => ({ default: () => <div data-testid="echart" /> }))

const AUTHOR = userWith(['ROLE_AUTHOR'], 'Alex')

describe('chart editor', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => vi.unstubAllGlobals())

  it('only offers variables compatible with each role and previews the chart', async () => {
    let sent: Record<string, unknown> | undefined
    installedSite(AUTHOR, {
      'GET /api/visualizations': [],
      'GET /api/chart-types': CHART_TYPES,
      'GET /api/datasets': [AFFLUENCE],
      'GET /api/datasets/3/data': AFFLUENCE_DATA,
      'POST /api/visualizations': (init: RequestInit | undefined) => {
        sent = JSON.parse(String(init?.body)) as Record<string, unknown>
        return jsonResponse(CHART, 201)
      },
    })
    renderRoute('/admin-app/charts')

    await userEvent.click(await screen.findByRole('button', { name: 'Nouveau graphique' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nouveau graphique' })
    await userEvent.type(within(dialog).getByLabelText('Titre du graphique'), 'Part des scènes')
    await userEvent.type(within(dialog).getByLabelText('Description'), 'La grande scène domine.')
    await userEvent.selectOptions(within(dialog).getByLabelText('Jeu de données'), 'Affluence')
    await userEvent.selectOptions(within(dialog).getByLabelText('Type de graphique'), 'Camembert')

    const parts = within(dialog).getByLabelText('Parts')
    expect(
      within(parts)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Choisir…', 'Scène'])
    const value = within(dialog).getByLabelText('Valeur (sinon : nombre de lignes)')
    expect(
      within(value)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Aucune', 'Public'])

    await userEvent.selectOptions(parts, 'Scène')
    await userEvent.selectOptions(value, 'Public')
    expect(await within(dialog).findByTestId('echart')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer le graphique' }))
    await vi.waitFor(() => expect(sent).toBeDefined())
    expect(sent).toMatchObject({
      title: 'Part des scènes',
      chartType: 'pie',
      dataset: '/api/datasets/3',
      mapping: { category: 'Scène', value: 'Spectateurs' },
      options: { aggregation: 'sum', donut: false },
    })
  })

  it('shows the server explanation next to the role concerned', async () => {
    installedSite(AUTHOR, {
      'GET /api/visualizations': [CHART],
      'GET /api/chart-types': CHART_TYPES,
      'GET /api/datasets': [AFFLUENCE],
      'GET /api/datasets/3/data': AFFLUENCE_DATA,
      'PATCH /api/visualizations/11': jsonResponse(
        {
          violations: [
            {
              propertyPath: 'mapping[x]',
              message: '« Public » est numérique : ce rôle attend une variable catégorielle.',
            },
          ],
        },
        422,
      ),
    })
    renderRoute('/admin-app/charts')

    await userEvent.click(await screen.findByRole('button', { name: 'Modifier' }))
    const dialog = await screen.findByRole('dialog', { name: 'Modifier le graphique' })
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Enregistrer le graphique' }))

    expect(await within(dialog).findByLabelText('Catégories')).toHaveAccessibleDescription(
      expect.stringContaining('ce rôle attend une variable catégorielle'),
    )
  })
})
