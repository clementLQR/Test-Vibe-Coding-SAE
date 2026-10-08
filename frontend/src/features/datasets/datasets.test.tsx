import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import type { Dataset, DatasetPreview } from '../../lib/api/types'
import { installedSite, jsonResponse, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'

const PROVIDER = { ...userWith(['ROLE_DATA_PROVIDER'], 'Pia'), id: 5 }

const DATASET: Dataset = {
  id: 9,
  name: 'Résultats du trail',
  description: null,
  sourceType: 'file',
  sourceUrl: null,
  delimiter: ';',
  status: 'pending',
  rowCount: 190,
  providerId: 5,
  providerName: 'Pia',
  createdAt: '2026-10-08T10:00:00+02:00',
  validatedAt: null,
  variables: [
    { id: 1, columnIndex: 0, name: 'Dossard', label: 'Dossard', type: 'numerical', detectedType: 'numerical' },
    { id: 2, columnIndex: 1, name: 'Course', label: 'Course', type: 'categorical', detectedType: 'categorical' },
  ],
}

const PREVIEW: DatasetPreview = {
  rowCount: 190,
  columns: [
    {
      index: 0,
      name: 'Dossard',
      detectedType: 'numerical',
      stats: { filled: 190, empty: 0, distinct: 190, numeric: 190, min: 1, max: 190, mean: 95.5, examples: ['1', '2'] },
    },
    {
      index: 1,
      name: 'Course',
      detectedType: 'categorical',
      stats: {
        filled: 190,
        empty: 0,
        distinct: 3,
        numeric: 0,
        min: null,
        max: null,
        mean: null,
        examples: ['Trail du Lac'],
      },
    },
  ],
  rows: [
    ['1', 'Trail des Crêtes'],
    ['2', ''],
  ],
}

describe('datasets', () => {
  beforeEach(() => changeLocale('fr'))
  afterEach(() => vi.unstubAllGlobals())

  it('imports a CSV and opens it', async () => {
    let sent: FormData | undefined
    installedSite(PROVIDER, {
      'GET /api/datasets': [],
      'POST /api/datasets': (init: RequestInit | undefined) => {
        sent = init?.body as FormData
        return jsonResponse(DATASET, 201)
      },
      'GET /api/datasets/9': DATASET,
      'GET /api/datasets/9/preview': PREVIEW,
    })
    renderRoute('/admin-app/datasets')

    await userEvent.type(await screen.findByLabelText('Nom du jeu de données'), 'Résultats du trail')
    await userEvent.upload(
      screen.getByLabelText('Fichier CSV', { selector: 'input[type=file]' }),
      new File(['a;b'], 'trail.csv'),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Importer et analyser' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Résultats du trail' })).toBeInTheDocument()
    expect(sent?.get('name')).toBe('Résultats du trail')
    expect(sent?.get('file')).toBeInstanceOf(File)
    expect(await screen.findByRole('table', { name: '2 premières lignes sur 190' })).toBeInTheDocument()
    expect(screen.getByText('(vide)')).toBeInTheDocument()
  })

  it('shows the reason why a file was refused next to the file field', async () => {
    installedSite(PROVIDER, {
      'GET /api/datasets': [],
      'POST /api/datasets': jsonResponse(
        { violations: [{ propertyPath: 'file', message: 'Ligne 3 : 1 valeurs au lieu de 2.' }] },
        422,
      ),
    })
    renderRoute('/admin-app/datasets')

    await userEvent.type(await screen.findByLabelText('Nom du jeu de données'), 'Cassé')
    await userEvent.upload(
      screen.getByLabelText('Fichier CSV', { selector: 'input[type=file]' }),
      new File(['x'], 'x.csv'),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Importer et analyser' }))

    const input = await screen.findByLabelText('Fichier CSV', { selector: 'input[type=file]' })
    await vi.waitFor(() => expect(input).toHaveAccessibleDescription('Ligne 3 : 1 valeurs au lieu de 2.'))
  })

  it('lets the provider fix a type and validate', async () => {
    const calls: string[] = []
    let savedVariables: unknown
    installedSite(PROVIDER, {
      'GET /api/datasets/9': DATASET,
      'GET /api/datasets/9/preview': PREVIEW,
      'PUT /api/datasets/9/variables': (init: RequestInit | undefined) => {
        calls.push('save')
        savedVariables = JSON.parse(String(init?.body))
        return DATASET
      },
      'POST /api/datasets/9/validate': () => {
        calls.push('validate')
        return { ...DATASET, status: 'validated', validatedAt: '2026-10-08T11:00:00+02:00' }
      },
    })
    renderRoute('/admin-app/datasets/9')

    const bibCard = (await screen.findByText('Dossard', { selector: 'p' })).closest('div') as HTMLElement
    expect(within(bibCard).getByText('Type détecté : Numérique')).toBeInTheDocument()
    expect(await within(bibCard).findByText('1 / 190 / 95,5')).toBeInTheDocument()

    await userEvent.click(within(bibCard).getByRole('radio', { name: 'Catégorielle' }))
    await userEvent.click(screen.getByRole('button', { name: 'Valider le jeu de données' }))

    expect(
      await screen.findByText('Jeu de données validé : il peut maintenant être utilisé dans des graphiques.'),
    ).toBeInTheDocument()
    expect(calls).toEqual(['save', 'validate'])
    expect(savedVariables).toEqual({
      variables: [
        { id: 1, label: 'Dossard', type: 'categorical' },
        { id: 2, label: 'Course', type: 'categorical' },
      ],
    })
  })

  it('shows validation errors on the variable concerned', async () => {
    installedSite(PROVIDER, {
      'GET /api/datasets/9': DATASET,
      'GET /api/datasets/9/preview': PREVIEW,
      'PUT /api/datasets/9/variables': DATASET,
      'POST /api/datasets/9/validate': jsonResponse(
        { violations: [{ propertyPath: 'variables[1].type', message: '« Course » ne contient aucun nombre.' }] },
        422,
      ),
    })
    renderRoute('/admin-app/datasets/9')

    await userEvent.click(await screen.findByRole('button', { name: 'Valider le jeu de données' }))

    const group = await screen.findByRole('group', {
      name: 'Type',
      description: '« Course » ne contient aucun nombre.',
    })
    expect(within(group).getByRole('radio', { name: 'Numérique' })).toBeInTheDocument()
    expect(screen.getByText('Corrigez les erreurs signalées sur les variables.')).toBeInTheDocument()
  })

  it('locks the types of a validated data set', async () => {
    installedSite(PROVIDER, {
      'GET /api/datasets/9': { ...DATASET, status: 'validated', validatedAt: '2026-10-08T11:00:00+02:00' },
      'GET /api/datasets/9/preview': PREVIEW,
    })
    renderRoute('/admin-app/datasets/9')

    expect(await screen.findByText('Validé')).toBeInTheDocument()
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Valider le jeu de données' })).not.toBeInTheDocument()
  })
})
