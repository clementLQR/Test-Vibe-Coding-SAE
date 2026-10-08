import type { EChartsCoreOption } from 'echarts/core'
import type { ChartOptions, ChartType, DatasetData } from '../../lib/api/types'

/** Neutral default palette (colour-blind friendly), replaced by the visualization colours or the theme. */
export const DEFAULT_PALETTE = ['#1d4ed8', '#f59e0b', '#059669', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

export interface ChartSpec {
  chartType: ChartType
  mapping: Record<string, string>
  options: ChartOptions
  colors: string[]
}

/** Accessible alternative of the chart: the values actually drawn. */
export interface DataTable {
  columns: string[]
  rows: (string | number)[][]
}

export interface BuiltChart {
  option: EChartsCoreOption
  table: DataTable
}

type Cell = string | number | null
type Aggregation = 'sum' | 'mean' | 'count'

/** Thrown when the mapping does not fit the data (e.g. column removed from the source). */
export class ChartBuildError extends Error {}

class Columns {
  private readonly index = new Map<string, number>()

  private readonly data: DatasetData

  constructor(data: DatasetData) {
    this.data = data
    data.variables.forEach((variable, i) => this.index.set(variable.name, i))
  }

  /** Column accessor for a chart role, or null when the role is not mapped. */
  get(spec: ChartSpec, role: string): ((row: Cell[]) => Cell) | null {
    const name = spec.mapping[role]
    if (!name) return null
    const i = this.index.get(name)
    if (i === undefined) throw new ChartBuildError(`Unknown variable "${name}"`)
    return (row) => row[i]
  }

  label(spec: ChartSpec, role: string): string {
    const name = spec.mapping[role]
    return this.data.variables.find((v) => v.name === name)?.label ?? name ?? ''
  }

  isNumerical(spec: ChartSpec, role: string): boolean {
    return this.data.variables.find((v) => v.name === spec.mapping[role])?.type === 'numerical'
  }
}

function key(value: Cell): string {
  return value === null ? '—' : String(value)
}

/** Distinct keys in order of appearance, or sorted numerically when every key is a number. */
function orderedKeys(values: Cell[], numericSort = false): string[] {
  const keys = [...new Set(values.map(key))]
  return numericSort ? keys.sort((a, b) => Number(a) - Number(b)) : keys
}

/** Groups rows by one or two keys and aggregates the value (or counts rows when there is no value). */
function aggregate(
  rows: Cell[][],
  keyOf: (row: Cell[]) => string,
  valueOf: ((row: Cell[]) => Cell) | null,
  aggregation: Aggregation,
): Map<string, number> {
  const sums = new Map<string, number>()
  const counts = new Map<string, number>()
  for (const row of rows) {
    const k = keyOf(row)
    const raw = valueOf ? valueOf(row) : 1
    if (valueOf && typeof raw !== 'number') continue // empty or invalid cell: ignored, not counted as 0
    counts.set(k, (counts.get(k) ?? 0) + 1)
    sums.set(k, (sums.get(k) ?? 0) + (raw as number))
  }
  const result = new Map<string, number>()
  for (const [k, count] of counts) {
    const value =
      !valueOf || aggregation === 'count' ? count : aggregation === 'mean' ? sums.get(k)! / count : sums.get(k)!
    result.set(k, Math.round(value * 100) / 100)
  }
  return result
}

function common(spec: ChartSpec, locale: string) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  return {
    color: spec.colors.length > 0 ? spec.colors : DEFAULT_PALETTE,
    aria: { enabled: true },
    animationDuration: 400,
    tooltip: { valueFormatter: (value: unknown) => (typeof value === 'number' ? number.format(value) : String(value)) },
    toolbox: { right: 8, feature: { saveAsImage: { title: '' } } },
  }
}

const AXIS_LABEL = { hideOverlap: true }

function categoryChart(
  spec: ChartSpec,
  data: DatasetData,
  cols: Columns,
  locale: string,
  countLabel: string,
): BuiltChart {
  const x = cols.get(spec, 'x')!
  const y = cols.get(spec, 'y')
  const series = cols.get(spec, 'series')
  const aggregation = (spec.options.aggregation as Aggregation | undefined) ?? 'sum'
  const isLine = spec.chartType === 'line'
  const categories = orderedKeys(data.rows.map(x), isLine && cols.isNumerical(spec, 'x'))
  const groups = series ? orderedKeys(data.rows.map(series)) : ['']
  const valueLabel = y ? cols.label(spec, 'y') : countLabel

  const values = aggregate(data.rows, (row) => `${key(x(row))}\u0000${series ? key(series(row)) : ''}`, y, aggregation)
  const seriesData = groups.map((group) =>
    categories.map((category) => values.get(`${category}\u0000${group}`) ?? null),
  )

  const horizontal = !isLine && spec.options.horizontal === true
  const categoryAxis = { type: 'category', data: categories, name: cols.label(spec, 'x'), axisLabel: AXIS_LABEL }
  const valueAxis = { type: 'value', name: valueLabel }

  const option: EChartsCoreOption = {
    ...common(spec, locale),
    tooltip: { ...common(spec, locale).tooltip, trigger: 'axis' },
    legend: series ? { type: 'scroll', top: 0 } : undefined,
    grid: { containLabel: true, left: 8, right: 16, top: series ? 40 : 24, bottom: isLine ? 48 : 8 },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    dataZoom: isLine ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 8 }] : undefined,
    series: groups.map((group, i) => ({
      name: series ? group : valueLabel,
      type: isLine ? 'line' : 'bar',
      data: seriesData[i],
      stack: spec.options.stacked === true ? 'total' : undefined,
      areaStyle: isLine && spec.options.area === true ? {} : undefined,
      emphasis: { focus: 'series' },
      connectNulls: isLine,
    })),
  }

  return {
    option,
    table: {
      columns: [cols.label(spec, 'x'), ...groups.map((g) => (series ? g : valueLabel))],
      rows: categories.map((category, c) => [category, ...seriesData.map((s) => s[c] ?? '')]),
    },
  }
}

function proportionChart(
  spec: ChartSpec,
  data: DatasetData,
  cols: Columns,
  locale: string,
  countLabel: string,
): BuiltChart {
  const category = cols.get(spec, 'category')!
  const value = cols.get(spec, 'value')
  const aggregation = (spec.options.aggregation as Aggregation | undefined) ?? 'sum'
  const values = aggregate(data.rows, (row) => key(category(row)), value, aggregation)
  const items = [...values].map(([name, v]) => ({ name, value: v })).sort((a, b) => b.value - a.value)
  const valueLabel = value ? cols.label(spec, 'value') : countLabel

  const series =
    spec.chartType === 'pie'
      ? {
          type: 'pie',
          radius: spec.options.donut === true ? ['40%', '70%'] : '70%',
          data: items,
          label: { formatter: '{b} ({d} %)' },
          emphasis: { scaleSize: 6 },
        }
      : { type: 'treemap', data: items, roam: false, nodeClick: false, breadcrumb: { show: false } }

  return {
    option: {
      ...common(spec, locale),
      tooltip: { ...common(spec, locale).tooltip, trigger: 'item' },
      legend: spec.chartType === 'pie' ? { type: 'scroll', bottom: 0 } : undefined,
      series: [series],
    },
    table: { columns: [cols.label(spec, 'category'), valueLabel], rows: items.map((i) => [i.name, i.value]) },
  }
}

function histogram(spec: ChartSpec, data: DatasetData, cols: Columns, locale: string, countLabel: string): BuiltChart {
  const value = cols.get(spec, 'value')!
  const numbers = data.rows.map(value).filter((v): v is number => typeof v === 'number')
  const bins = Math.max(1, Number(spec.options.bins ?? 10))
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const min = numbers.length ? Math.min(...numbers) : 0
  const max = numbers.length ? Math.max(...numbers) : 0
  const width = (max - min) / bins || 1
  const counts = Array.from({ length: bins }, () => 0)
  for (const n of numbers) counts[Math.min(bins - 1, Math.floor((n - min) / width))]++
  const labels = counts.map((_, i) => `${format.format(min + i * width)} – ${format.format(min + (i + 1) * width)}`)
  const label = cols.label(spec, 'value')

  return {
    option: {
      ...common(spec, locale),
      tooltip: { ...common(spec, locale).tooltip, trigger: 'axis' },
      grid: { containLabel: true, left: 8, right: 16, top: 24, bottom: 8 },
      xAxis: { type: 'category', data: labels, name: label, axisLabel: AXIS_LABEL },
      yAxis: { type: 'value', name: countLabel, minInterval: 1 },
      series: [{ name: label, type: 'bar', data: counts, barCategoryGap: '2%' }],
    },
    table: { columns: [label, countLabel], rows: labels.map((l, i) => [l, counts[i]]) },
  }
}

function scatter(spec: ChartSpec, data: DatasetData, cols: Columns, locale: string): BuiltChart {
  const x = cols.get(spec, 'x')!
  const y = cols.get(spec, 'y')!
  const color = cols.get(spec, 'color')
  const size = cols.get(spec, 'size')
  const rows = data.rows.filter((row) => typeof x(row) === 'number' && typeof y(row) === 'number')
  const sizes = size ? rows.map(size).filter((v): v is number => typeof v === 'number') : []
  const [sizeMin, sizeMax] = [Math.min(...sizes), Math.max(...sizes)]
  const symbolSize = (v: Cell) =>
    typeof v === 'number' && sizeMax > sizeMin ? 6 + ((v - sizeMin) / (sizeMax - sizeMin)) * 24 : 10
  const groups = color ? orderedKeys(rows.map(color)) : ['']
  const xLabel = cols.label(spec, 'x')
  const yLabel = cols.label(spec, 'y')

  return {
    option: {
      ...common(spec, locale),
      tooltip: { trigger: 'item' },
      legend: color ? { type: 'scroll', top: 0 } : undefined,
      grid: { containLabel: true, left: 8, right: 24, top: color ? 40 : 24, bottom: 48 },
      xAxis: { type: 'value', name: xLabel, scale: true },
      yAxis: { type: 'value', name: yLabel, scale: true },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'inside', yAxisIndex: 0 },
        { type: 'slider', height: 18, bottom: 8 },
      ],
      series: groups.map((group) => ({
        name: color ? group : `${xLabel} × ${yLabel}`,
        type: 'scatter',
        data: rows
          .filter((row) => !color || key(color(row)) === group)
          .map((row) => ({ value: [x(row), y(row)], symbolSize: size ? symbolSize(size(row)) : 10 })),
        emphasis: { focus: 'series' },
      })),
    },
    table: {
      columns: [
        xLabel,
        yLabel,
        ...(color ? [cols.label(spec, 'color')] : []),
        ...(size ? [cols.label(spec, 'size')] : []),
      ],
      rows: rows.map((row) =>
        [x(row), y(row), ...(color ? [color(row)] : []), ...(size ? [size(row)] : [])].map((v) => v ?? ''),
      ),
    },
  }
}

function heatmap(spec: ChartSpec, data: DatasetData, cols: Columns, locale: string): BuiltChart {
  const x = cols.get(spec, 'x')!
  const y = cols.get(spec, 'y')!
  const value = cols.get(spec, 'value')
  const aggregation = (spec.options.aggregation as Aggregation | undefined) ?? 'sum'
  const xs = orderedKeys(data.rows.map(x))
  const ys = orderedKeys(data.rows.map(y))
  const values = aggregate(data.rows, (row) => `${key(x(row))}\u0000${key(y(row))}`, value, aggregation)
  const cells = xs.flatMap((xk, i) => ys.map((yk, j) => [i, j, values.get(`${xk}\u0000${yk}`) ?? null]))
  const numbers = [...values.values()]
  const base = common(spec, locale)

  return {
    option: {
      ...base,
      tooltip: { ...base.tooltip, trigger: 'item' },
      grid: { containLabel: true, left: 8, right: 16, top: 24, bottom: 56 },
      xAxis: { type: 'category', data: xs, name: cols.label(spec, 'x'), axisLabel: AXIS_LABEL },
      yAxis: { type: 'category', data: ys, name: cols.label(spec, 'y') },
      visualMap: {
        min: numbers.length ? Math.min(...numbers) : 0,
        max: numbers.length ? Math.max(...numbers) : 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: ['#f8fafc', base.color[0]] },
      },
      series: [
        {
          type: 'heatmap',
          data: cells,
          label: { show: xs.length * ys.length <= 60 },
          emphasis: { itemStyle: { borderColor: '#000', borderWidth: 1 } },
        },
      ],
    },
    table: {
      columns: [`${cols.label(spec, 'y')} \\ ${cols.label(spec, 'x')}`, ...xs],
      rows: ys.map((yk) => [yk, ...xs.map((xk) => values.get(`${xk}\u0000${yk}`) ?? '')]),
    },
  }
}

/**
 * ECharts option and data table of a visualization. Aggregations ignore empty cells.
 * `countLabel` names the axis when rows are counted (translated by the caller).
 */
export function buildChart(spec: ChartSpec, data: DatasetData, locale: string, countLabel = 'Count'): BuiltChart {
  const cols = new Columns(data)
  switch (spec.chartType) {
    case 'bar':
    case 'line':
      return categoryChart(spec, data, cols, locale, countLabel)
    case 'pie':
    case 'treemap':
      return proportionChart(spec, data, cols, locale, countLabel)
    case 'histogram':
      return histogram(spec, data, cols, locale, countLabel)
    case 'scatter':
      return scatter(spec, data, cols, locale)
    case 'heatmap':
      return heatmap(spec, data, cols, locale)
  }
}
