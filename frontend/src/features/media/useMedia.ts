import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiCollection, apiFetch, mergePatch } from '../../lib/api/client'
import type { Media } from '../../lib/api/types'

export const MEDIA_PAGE_SIZE = 24
const MEDIA_KEY = 'media'

export function useMediaList(search: string, page: number) {
  return useQuery({
    queryKey: [MEDIA_KEY, search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) })
      if (search !== '') params.set('q', search)
      return apiCollection<Media>(`/media?${params.toString()}`)
    },
    placeholderData: keepPreviousData,
  })
}

export interface UploadInput {
  file: File
  altFr: string
  altEn: string
}

export function useUploadMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, altFr, altEn }: UploadInput) => {
      const body = new FormData()
      body.append('file', file)
      body.append('altFr', altFr)
      body.append('altEn', altEn)
      return apiFetch<Media>('/media', { method: 'POST', body })
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [MEDIA_KEY] }),
  })
}

export function useUpdateMediaAlt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, altFr, altEn }: { id: number; altFr: string; altEn: string }) =>
      apiFetch<Media>(`/media/${id}`, mergePatch({ altFr, altEn })),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [MEDIA_KEY] }),
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<null>(`/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [MEDIA_KEY] }),
  })
}
