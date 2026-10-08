import { BarChart, HeatmapChart, LineChart, PieChart, ScatterChart, TreemapChart } from 'echarts/charts'
import {
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { init, use as registerModules, type EChartsCoreOption } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { useEffect, useRef } from 'react'

// Only the modules Evently uses are bundled (eco-design), in a chunk loaded with the first chart
registerModules([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
  SVGRenderer,
])

interface EChartProps {
  option: EChartsCoreOption
  locale: string
}

/** Thin ECharts wrapper: SVG renderer, follows the container size, no animation if the user prefers less motion. */
export default function EChart({ option, locale }: EChartProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = container.current
    if (!element) return
    const chart = init(element, undefined, { renderer: 'svg', locale: locale === 'en' ? 'EN' : 'FR' })
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    chart.setOption({ ...option, animation: !reducedMotion }, true)

    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(element)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [option, locale])

  return <div ref={container} className="h-80 w-full sm:h-96" />
}
