import { describe, expect, it } from 'vitest'
import type { DatasetData } from '../../lib/api/types'
import { buildChart, ChartBuildError, DEFAULT_PALETTE, type ChartSpec } from './buildChart'

const DATA: DatasetData = {
  variables: [
    { name: 'Jour', label: 'Jour', type: 'categorical' },
    { name: 'Scène', label: 'Scène', type: 'categorical' },
    { name: 'Spectateurs', label: 'Public', type: 'numerical' },
    { name: 'Heure', label: 'Heure', type: 'numerical' },
  ],
  rows: [
    ['Vendredi', 'Grande scène', 1000, 20],
    ['Vendredi', 'Chapiteau', 400, 18],
    ['Samedi', 'Grande scène', 1500, 22],
    ['Samedi', 'Chapiteau', null, 16],
    ['Samedi', 'Chapiteau', 600, 20],
  ],
}

function spec(
  chartType: ChartSpec['chartType'],
  mapping: Record<string, string>,
  options = {},
  colors: string[] = [],
): ChartSpec {
  return { chartType, mapping, options, colors }
}

describe('buildChart', () => {
  it('sums a numerical variable per category, ignoring empty cells', () => {
    const { option, table } = buildChart(spec('bar', { x: 'Scène', y: 'Spectateurs' }), DATA, 'fr')

    expect(table).toEqual({
      columns: ['Scène', 'Public'],
      rows: [
        ['Grande scène', 2500],
        ['Chapiteau', 1000],
      ],
    })
    expect(option).toMatchObject({ color: DEFAULT_PALETTE, xAxis: { type: 'category' }, yAxis: { type: 'value' } })
  })

  it('computes means and counts', () => {
    const mean = buildChart(spec('bar', { x: 'Scène', y: 'Spectateurs' }, { aggregation: 'mean' }), DATA, 'fr')
    expect(mean.table.rows).toEqual([
      ['Grande scène', 1250],
      ['Chapiteau', 500],
    ])

    const count = buildChart(spec('bar', { x: 'Jour' }), DATA, 'fr', 'Nombre')
    expect(count.table).toEqual({
      columns: ['Jour', 'Nombre'],
      rows: [
        ['Vendredi', 2],
        ['Samedi', 3],
      ],
    })
  })

  it('splits bars into series and supports horizontal stacked bars', () => {
    const { option, table } = buildChart(
      spec('bar', { x: 'Jour', y: 'Spectateurs', series: 'Scène' }, { horizontal: true, stacked: true }, ['#111111']),
      DATA,
      'fr',
    )

    expect(table.columns).toEqual(['Jour', 'Grande scène', 'Chapiteau'])
    expect(table.rows).toEqual([
      ['Vendredi', 1000, 400],
      ['Samedi', 1500, 600],
    ])
    expect(option).toMatchObject({ color: ['#111111'], xAxis: { type: 'value' }, yAxis: { type: 'category' } })
    expect((option.series as { stack?: string }[]).map((s) => s.stack)).toEqual(['total', 'total'])
  })

  it('sorts a numerical x axis on line charts and enables zoom', () => {
    const { option, table } = buildChart(spec('line', { x: 'Heure', y: 'Spectateurs' }), DATA, 'fr')

    expect(table.rows.map((r) => r[0])).toEqual(['16', '18', '20', '22'])
    expect(table.rows.find((r) => r[0] === '16')?.[1]).toBe('') // only an empty cell at 16 h
    expect(option.dataZoom).toBeDefined()
  })

  it('builds pie shares sorted from the largest, as a donut on demand', () => {
    const { option, table } = buildChart(
      spec('pie', { category: 'Jour', value: 'Spectateurs' }, { donut: true }),
      DATA,
      'fr',
    )

    expect(table.rows).toEqual([
      ['Samedi', 2100],
      ['Vendredi', 1400],
    ])
    expect((option.series as { radius: unknown }[])[0].radius).toEqual(['40%', '70%'])
  })

  it('counts values into equal-width bins', () => {
    const { table } = buildChart(spec('histogram', { value: 'Spectateurs' }, { bins: 2 }), DATA, 'en')

    expect(table.rows).toEqual([
      ['400 – 950', 2],
      ['950 – 1,500', 2],
    ])
  })

  it('draws scatter points coloured by category, skipping incomplete rows', () => {
    const { option, table } = buildChart(spec('scatter', { x: 'Heure', y: 'Spectateurs', color: 'Scène' }), DATA, 'fr')

    expect((option.series as { name: string }[]).map((s) => s.name)).toEqual(['Grande scène', 'Chapiteau'])
    expect(table.rows).toHaveLength(4)
  })

  it('crosses two categories in a heatmap', () => {
    const { table } = buildChart(spec('heatmap', { x: 'Jour', y: 'Scène', value: 'Spectateurs' }), DATA, 'fr')

    expect(table).toEqual({
      columns: ['Scène \\ Jour', 'Vendredi', 'Samedi'],
      rows: [
        ['Grande scène', 1000, 1500],
        ['Chapiteau', 400, 600],
      ],
    })
  })

  it('reports a variable missing from the data', () => {
    expect(() => buildChart(spec('pie', { category: 'Disparue' }), DATA, 'fr')).toThrow(ChartBuildError)
  })
})
