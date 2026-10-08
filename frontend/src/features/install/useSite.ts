import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody } from '../../lib/api/client'
import type { InstallStatus, Locale, MeResponse, SiteSettings } from '../../lib/api/types'
import { ME_KEY } from '../auth/useAuth'

export const INSTALL_STATUS_KEY = ['install-status'] as const
export const SETTINGS_KEY = ['settings'] as const

export function useInstallStatus() {
  return useQuery({
    queryKey: INSTALL_STATUS_KEY,
    queryFn: () => apiFetch<InstallStatus>('/install/status'),
    staleTime: Infinity,
  })
}

/** Public site settings; null before installation. */
export function useSiteSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => apiFetch<SiteSettings>('/settings'),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export interface InstallInput {
  locale: Locale
  siteName: string
  tagline: string
  eventStart: string
  eventEnd: string
  location: string
  adminDisplayName: string
  adminEmail: string
  adminPassword: string
  /** Fill the new site with the demo event */
  demo: boolean
}

export function useInstall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: InstallInput) =>
      apiFetch<MeResponse>(
        '/install',
        jsonBody('POST', {
          ...input,
          // Empty optional fields are sent as null
          tagline: input.tagline || null,
          eventStart: input.eventStart || null,
          eventEnd: input.eventEnd || null,
          location: input.location || null,
        }),
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_KEY, data)
      queryClient.setQueryData(INSTALL_STATUS_KEY, { installed: true })
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEY })
    },
  })
}
