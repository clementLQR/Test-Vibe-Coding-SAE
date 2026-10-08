import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody, mergePatch } from '../../lib/api/client'
import type { CurrentUser, Dataset, DatasetPreview, VariableType } from '../../lib/api/types'
import { hasAnyRole } from '../auth/useAuth'

const DATASETS_KEY = 'datasets'

/** Mirrors DatasetVoter::MANAGE: its provider or an admin. */
export function canManageDataset(user: CurrentUser | null, dataset: Dataset): boolean {
  return (
    hasAnyRole(user, ['ROLE_ADMIN']) ||
    (hasAnyRole(user, ['ROLE_DATA_PROVIDER']) && user !== null && dataset.providerId === user.id)
  )
}

export function useDatasets() {
  return useQuery({ queryKey: [DATASETS_KEY], queryFn: () => apiFetch<Dataset[]>('/datasets') })
}

export function useDataset(id: number) {
  return useQuery({ queryKey: [DATASETS_KEY, id], queryFn: () => apiFetch<Dataset>(`/datasets/${id}`) })
}

export function useDatasetPreview(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [DATASETS_KEY, id, 'preview'],
    queryFn: () => apiFetch<DatasetPreview>(`/datasets/${id}/preview`),
    enabled,
    retry: false,
  })
}

export type DatasetSourceInput = { kind: 'file'; file: File | null } | { kind: 'url'; url: string }

export interface CreateDatasetInput {
  name: string
  description: string
  source: DatasetSourceInput
}

export function useCreateDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, description, source }: CreateDatasetInput) => {
      const body = new FormData()
      body.append('name', name)
      body.append('description', description)
      if (source.kind === 'file' && source.file) body.append('file', source.file)
      if (source.kind === 'url') body.append('url', source.url)
      return apiFetch<Dataset>('/datasets', { method: 'POST', body })
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [DATASETS_KEY] }),
  })
}

export interface VariableInput {
  id: number
  label: string
  type: VariableType
}

/** Saves the dataset description and its variables, then optionally validates it. */
export function useSaveDataset(id: number) {
  const queryClient = useQueryClient()
  const onSuccess = (dataset: Dataset) => {
    queryClient.setQueryData([DATASETS_KEY, id], dataset)
    void queryClient.invalidateQueries({ queryKey: [DATASETS_KEY], exact: true })
  }

  const saveVariables = useMutation({
    mutationFn: (variables: VariableInput[]) =>
      apiFetch<Dataset>(`/datasets/${id}/variables`, jsonBody('PUT', { variables })),
    onSuccess,
  })
  const validate = useMutation({
    mutationFn: () => apiFetch<Dataset>(`/datasets/${id}/validate`, { method: 'POST' }),
    onSuccess,
  })
  const rename = useMutation({
    mutationFn: (input: { name: string; description: string }) =>
      apiFetch<Dataset>(`/datasets/${id}`, mergePatch(input)),
    onSuccess,
  })
  return { saveVariables, validate, rename }
}

export function useDeleteDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<null>(`/datasets/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [DATASETS_KEY] }),
  })
}
