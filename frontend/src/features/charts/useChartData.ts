import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api/client'
import type { ChartTypeDefinition, DatasetData } from '../../lib/api/types'

export function useChartTypes() {
  return useQuery({
    queryKey: ['chart-types'],
    queryFn: () => apiFetch<ChartTypeDefinition[]>('/chart-types'),
    staleTime: Infinity,
  })
}

/** Typed rows of a data set (shared by every chart of the page using it). */
export function useDatasetData(datasetId: number | null) {
  return useQuery({
    queryKey: ['datasets', datasetId, 'data'],
    queryFn: () => apiFetch<DatasetData>(`/datasets/${datasetId}/data`),
    enabled: datasetId !== null,
    staleTime: 5 * 60_000,
  })
}
