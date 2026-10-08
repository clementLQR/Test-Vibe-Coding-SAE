import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, jsonBody, mergePatch } from '../../lib/api/client'
import type { Locale, MapConfig, MapItem, ProgramSlot, TicketOffer, Venue } from '../../lib/api/types'

/** Plain list resources of the event modules (API Platform collections without pagination). */
export function useResourceList<T>(path: string) {
  return useQuery({ queryKey: [path], queryFn: () => apiFetch<T[]>(path) })
}

/** Create (no id), update (merge-patch) and delete for a list resource; refreshes every list of the resource. */
export function useResourceMutations<T extends { id: number }, Input = Partial<T>>(resource: string) {
  const queryClient = useQueryClient()
  const onSuccess = () =>
    void queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith(resource) })
  return {
    save: useMutation({
      mutationFn: ({ id, input }: { id: number | null; input: Input }) =>
        id === null
          ? apiFetch<T>(resource, jsonBody('POST', input))
          : apiFetch<T>(`${resource}/${id}`, mergePatch(input)),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: number) => apiFetch<null>(`${resource}/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  }
}

export const useVenues = () => useResourceList<Venue>('/venues')
export const useProgram = (locale: Locale) => useResourceList<ProgramSlot>(`/program_slots?locale=${locale}`)
export const useMapItems = () => useResourceList<MapItem>('/map_items')
export const useTicketOffers = (locale: Locale) => useResourceList<TicketOffer>(`/ticket_offers?locale=${locale}`)

export function useMapConfig() {
  return useQuery({ queryKey: ['/map-config'], queryFn: () => apiFetch<MapConfig>('/map-config') })
}

export interface MapConfigInput {
  mode: MapConfig['mode']
  centerLat: number
  centerLng: number
  zoom: number
  backgroundMediaId: number | null
}

export function useSaveMapConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MapConfigInput) => apiFetch<MapConfig>('/map-config', jsonBody('PUT', input)),
    onSuccess: (config) => queryClient.setQueryData(['/map-config'], config),
  })
}

/** "2027-07-09T20:30" → day key "2027-07-09" and time "20:30" (event local time, no time zone conversion). */
export function splitLocalTime(value: string): { day: string; time: string } {
  const [day, time = ''] = value.split('T')
  return { day, time: time.slice(0, 5) }
}

/** Long day label, computed at noon UTC so the date never shifts across time zones. */
export function formatDay(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${day}T12:00:00Z`),
  )
}

export function formatPrice(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}
