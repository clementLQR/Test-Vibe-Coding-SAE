import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api/client'
import type { Article, ArticleType, Locale, MenuItem, Page } from '../../lib/api/types'

/** Published articles of a language, newest first (the public site never shows drafts, even to editors). */
export function usePublishedArticles(locale: Locale, type: ArticleType | null = null) {
  return useQuery({
    queryKey: ['public-articles', locale, type],
    queryFn: () => {
      const params = new URLSearchParams({ status: 'published', locale })
      if (type) params.set('type', type)
      return apiFetch<Article[]>(`/articles?${params.toString()}`)
    },
  })
}

export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: ['article-by-slug', slug],
    queryFn: () => apiFetch<Article>(`/articles/by-slug/${encodeURIComponent(slug)}`),
    retry: false,
  })
}

export function usePageBySlug(slug: string) {
  return useQuery({
    queryKey: ['page-by-slug', slug],
    queryFn: () => apiFetch<Page>(`/pages/by-slug/${encodeURIComponent(slug)}`),
    retry: false,
  })
}

export function useMenu(locale: Locale) {
  return useQuery({
    queryKey: ['menu', locale],
    queryFn: () => apiFetch<MenuItem[]>(`/menu?locale=${locale}`),
    staleTime: 5 * 60_000,
  })
}
