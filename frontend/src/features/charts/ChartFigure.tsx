import { lazy, Suspense, useContext, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { ChartPaletteContext } from '../themes/themeContext'
import { buildChart, ChartBuildError, type ChartSpec } from './buildChart'
import { useDatasetData } from './useChartData'

// ECharts is only downloaded when a page actually shows a chart
const EChart = lazy(() => import('./EChart'))

export interface ChartFigureProps extends ChartSpec {
  title: string
  description: string
  datasetId: number | null
}

/**
 * A chart with its title, its text description and a "show the data" table:
 * every chart stays understandable without seeing it (accessibility).
 */
export function ChartFigure({ title, description, datasetId, ...spec }: ChartFigureProps) {
  const { t, i18n } = useTranslation()
  const tableId = useId()
  const titleId = useId()
  const [showTable, setShowTable] = useState(false)
  const data = useDatasetData(datasetId)
  const themePalette = useContext(ChartPaletteContext)

  // The spec object is recreated on every render: its JSON form is the stable memo key.
  // Charts without colours of their own follow the theme palette.
  const specKey = JSON.stringify({ ...spec, colors: spec.colors.length > 0 ? spec.colors : (themePalette ?? []) })
  const built = useMemo(() => {
    if (!data.data) return null
    try {
      return buildChart(JSON.parse(specKey) as ChartSpec, data.data, i18n.language, t('charts.count'))
    } catch (error) {
      if (error instanceof ChartBuildError) return error
      throw error
    }
  }, [data.data, specKey, i18n.language, t])

  const option = useMemo(() => {
    if (!built || built instanceof ChartBuildError) return null
    const base = built.option as { toolbox?: { feature?: Record<string, object> } }
    return {
      ...built.option,
      toolbox: { ...base.toolbox, feature: { saveAsImage: { title: t('charts.download'), name: title || 'chart' } } },
    }
  }, [built, t, title])

  return (
    <figure aria-labelledby={titleId} className="space-y-3 rounded-block bg-block p-4 text-block-ink">
      <figcaption className="space-y-1">
        <span id={titleId} className="block font-heading text-lg font-semibold">
          {title}
        </span>
        <span className="block text-sm">{description}</span>
      </figcaption>

      {data.isPending && datasetId !== null && <Loading label={t('common.loading')} />}
      {data.isError && <Alert>{errorMessageOf(data.error, t('charts.dataError'))}</Alert>}
      {built instanceof ChartBuildError && <Alert>{t('charts.mappingError')}</Alert>}
      {option && built && !(built instanceof ChartBuildError) && (
        <>
          <Suspense fallback={<Loading label={t('common.loading')} />}>
            <EChart option={option} locale={i18n.language} />
          </Suspense>
          <button
            type="button"
            className="min-h-11 text-accent underline"
            aria-expanded={showTable}
            aria-controls={tableId}
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? t('charts.hideData') : t('charts.showData')}
          </button>
          <div id={tableId} hidden={!showTable} className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <caption className="sr-only">{t('charts.tableCaption', { title })}</caption>
              <thead>
                <tr>
                  {built.table.columns.map((column, i) => (
                    <th key={i} scope="col" className="border-b border-black/15 px-2 py-1 text-left">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {built.table.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th key={c} scope="row" className="px-2 py-1 text-left font-normal">
                          {cell}
                        </th>
                      ) : (
                        <td key={c} className="px-2 py-1">
                          {typeof cell === 'number' ? cell.toLocaleString(i18n.language) : cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </figure>
  )
}
