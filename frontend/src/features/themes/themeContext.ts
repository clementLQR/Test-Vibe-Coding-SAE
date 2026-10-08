import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect } from 'react'
import { apiFetch } from '../../lib/api/client'
import type { ActiveTheme } from '../../lib/theme'

export interface ThemeTarget {
  pageId?: number
  articleId?: number
}

export const ThemeTargetSetterContext = createContext<(target: ThemeTarget) => void>(() => {})

/** Palette of the current theme, used by charts that have no colours of their own. */
export const ChartPaletteContext = createContext<string[] | undefined>(undefined)

export function useActiveThemes() {
  return useQuery({
    queryKey: ['active-themes'],
    queryFn: () => apiFetch<ActiveTheme[]>('/active-themes'),
    staleTime: 60_000,
  })
}

/** Declares the page or article being displayed, so its own theme applies. */
export function useThemeTarget(target: ThemeTarget) {
  const setTarget = useContext(ThemeTargetSetterContext)
  const { pageId, articleId } = target
  useEffect(() => {
    setTarget({ pageId, articleId })
    return () => setTarget({})
  }, [setTarget, pageId, articleId])
}
