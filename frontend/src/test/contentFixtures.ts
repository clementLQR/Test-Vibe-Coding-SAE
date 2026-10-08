import type { Article, ChartTypeDefinition, Dataset, DatasetData, Visualization } from '../lib/api/types'

/** Same shape as GET /api/chart-types (subset). */
export const CHART_TYPES: ChartTypeDefinition[] = [
  {
    name: 'bar',
    roles: [
      { name: 'x', variableType: 'categorical', required: true },
      { name: 'y', variableType: 'numerical', required: false },
      { name: 'series', variableType: 'categorical', required: false },
    ],
    options: [
      { name: 'aggregation', default: 'sum', values: ['sum', 'mean', 'count'] },
      { name: 'horizontal', default: false, values: [true, false] },
      { name: 'stacked', default: false, values: [true, false] },
    ],
  },
  {
    name: 'pie',
    roles: [
      { name: 'category', variableType: 'categorical', required: true },
      { name: 'value', variableType: 'numerical', required: false },
    ],
    options: [
      { name: 'aggregation', default: 'sum', values: ['sum', 'mean', 'count'] },
      { name: 'donut', default: false, values: [true, false] },
    ],
  },
]

export const AFFLUENCE: Dataset = {
  id: 3,
  name: 'Affluence',
  description: null,
  sourceType: 'file',
  sourceUrl: null,
  delimiter: ';',
  status: 'validated',
  rowCount: 2,
  providerId: 9,
  providerName: 'Pia',
  createdAt: '2026-10-08T10:00:00+02:00',
  validatedAt: '2026-10-08T10:00:00+02:00',
  variables: [
    { id: 1, columnIndex: 0, name: 'Scène', label: 'Scène', type: 'categorical', detectedType: 'categorical' },
    { id: 2, columnIndex: 1, name: 'Spectateurs', label: 'Public', type: 'numerical', detectedType: 'numerical' },
  ],
}

export const AFFLUENCE_DATA: DatasetData = {
  variables: [
    { name: 'Scène', label: 'Scène', type: 'categorical' },
    { name: 'Spectateurs', label: 'Public', type: 'numerical' },
  ],
  rows: [
    ['Grande scène', 1200],
    ['Chapiteau', 800],
  ],
}

export const CHART: Visualization = {
  id: 11,
  title: 'Public par scène',
  description: 'La grande scène attire le plus de monde.',
  chartType: 'bar',
  dataset: '/api/datasets/3',
  datasetId: 3,
  mapping: { x: 'Scène', y: 'Spectateurs' },
  colors: [],
  options: { aggregation: 'sum' },
  createdById: 1,
  createdAt: '2026-10-08T10:00:00+02:00',
  updatedAt: '2026-10-08T10:00:00+02:00',
}

export function article(overrides: Partial<Article> = {}): Article {
  return {
    id: 21,
    title: 'Bilan',
    slug: 'bilan',
    summary: '',
    type: 'dashboard',
    status: 'draft',
    locale: 'fr',
    authorId: 1,
    authorName: 'Alex',
    blocks: [
      { id: 101, position: 0, type: 'heading', headingLevel: 2, text: 'Affluence', media: null, visualization: null },
      {
        id: 102,
        position: 1,
        type: 'text',
        headingLevel: null,
        text: 'Une **belle** édition.',
        media: null,
        visualization: null,
      },
      {
        id: 103,
        position: 2,
        type: 'visualization',
        headingLevel: null,
        text: null,
        media: null,
        visualization: CHART,
      },
    ],
    createdAt: '2026-10-08T10:00:00+02:00',
    updatedAt: '2026-10-08T10:00:00+02:00',
    publishedAt: null,
    ...overrides,
  }
}
