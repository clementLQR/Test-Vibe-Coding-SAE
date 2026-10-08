import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody } from '../../lib/api/client'
import type { Article, ArticleInput, CurrentUser } from '../../lib/api/types'
import { hasAnyRole } from '../auth/useAuth'

const KEY = 'articles'

/** Mirrors ArticleVoter::EDIT: editors on every article, authors on their own. */
export function canEditArticle(user: CurrentUser | null, article: Article): boolean {
  return hasAnyRole(user, ['ROLE_EDITOR']) || (hasAnyRole(user, ['ROLE_AUTHOR']) && article.authorId === user?.id)
}

export function useArticles() {
  return useQuery({ queryKey: [KEY], queryFn: () => apiFetch<Article[]>('/articles') })
}

export function useArticle(id: number | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => apiFetch<Article>(`/articles/${id}`),
    enabled: id !== null,
  })
}

/** Creates the article (POST) or replaces it with its blocks (PUT). */
export function useSaveArticle(id: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ArticleInput) =>
      apiFetch<Article>(id === null ? '/articles' : `/articles/${id}`, jsonBody(id === null ? 'POST' : 'PUT', input)),
    onSuccess: (article) => {
      queryClient.setQueryData([KEY, article.id], article)
      void queryClient.invalidateQueries({ queryKey: [KEY], exact: true })
    },
  })
}

export function useDeleteArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<null>(`/articles/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}
