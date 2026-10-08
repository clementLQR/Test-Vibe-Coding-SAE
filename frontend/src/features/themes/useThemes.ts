import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody, mergePatch } from '../../lib/api/client'
import type { Theme, ThemeScope } from '../../lib/api/types'
import type { ThemeTokens } from '../../lib/theme'

const KEY = 'themes'

export interface ThemeDraft {
  name: string
  scope: ThemeScope
  pageId: number | null
  articleId: number | null
  tokens: ThemeTokens
}

export function useThemes() {
  return useQuery({ queryKey: [KEY], queryFn: () => apiFetch<Theme[]>('/themes') })
}

function toPayload(draft: ThemeDraft) {
  return {
    name: draft.name,
    scope: draft.scope,
    page: draft.scope === 'page' && draft.pageId !== null ? `/api/pages/${draft.pageId}` : null,
    article: draft.scope === 'article' && draft.articleId !== null ? `/api/articles/${draft.articleId}` : null,
    tokens: draft.tokens,
  }
}

export function useSaveTheme(id: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (draft: ThemeDraft) =>
      id === null
        ? apiFetch<Theme>('/themes', jsonBody('POST', toPayload(draft)))
        : apiFetch<Theme>(`/themes/${id}`, mergePatch(toPayload(draft))),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

/** Administrator decisions; approval applies the theme on the public site. */
export function useReviewTheme() {
  const queryClient = useQueryClient()
  const onSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: [KEY] })
    void queryClient.invalidateQueries({ queryKey: ['active-themes'] })
  }
  return {
    approve: useMutation({
      mutationFn: (id: number) => apiFetch<Theme>(`/themes/${id}/approve`, { method: 'POST' }),
      onSuccess,
    }),
    reject: useMutation({
      mutationFn: ({ id, comment }: { id: number; comment: string }) =>
        apiFetch<Theme>(`/themes/${id}/reject`, jsonBody('POST', { comment })),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: number) => apiFetch<null>(`/themes/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  }
}
