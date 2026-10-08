import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody } from '../../lib/api/client'
import type { Page, PageInput } from '../../lib/api/types'

const KEY = 'pages'

export function usePages() {
  return useQuery({ queryKey: [KEY], queryFn: () => apiFetch<Page[]>('/pages') })
}

export function usePage(id: number | null) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => apiFetch<Page>(`/pages/${id}`), enabled: id !== null })
}

export function useSavePage(id: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PageInput) =>
      apiFetch<Page>(id === null ? '/pages' : `/pages/${id}`, jsonBody(id === null ? 'POST' : 'PUT', input)),
    onSuccess: (page) => {
      queryClient.setQueryData([KEY, page.id], page)
      void queryClient.invalidateQueries({ queryKey: [KEY], exact: true })
      void queryClient.invalidateQueries({ queryKey: ['menu'] })
    },
  })
}

export function useDeletePage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<null>(`/pages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] })
      void queryClient.invalidateQueries({ queryKey: ['menu'] })
    },
  })
}
