import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody, mergePatch } from '../../lib/api/client'
import type { ChartOptions, ChartType, Visualization } from '../../lib/api/types'

const KEY = 'visualizations'

export interface VisualizationDraft {
  title: string
  description: string
  chartType: ChartType
  datasetId: number | null
  mapping: Record<string, string>
  colors: string[]
  options: ChartOptions
}

export function useVisualizations() {
  return useQuery({ queryKey: [KEY], queryFn: () => apiFetch<Visualization[]>('/visualizations') })
}

function toPayload(draft: VisualizationDraft) {
  const { datasetId, ...rest } = draft
  return { ...rest, dataset: datasetId === null ? null : `/api/datasets/${datasetId}` }
}

/** Creates the chart, or updates it when an id is given. */
export function useSaveVisualization(id: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (draft: VisualizationDraft) =>
      id === null
        ? apiFetch<Visualization>('/visualizations', jsonBody('POST', toPayload(draft)))
        : apiFetch<Visualization>(`/visualizations/${id}`, mergePatch(toPayload(draft))),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteVisualization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<null>(`/visualizations/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}
