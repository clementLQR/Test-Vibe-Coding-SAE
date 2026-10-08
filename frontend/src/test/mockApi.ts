import { vi } from 'vitest'
import type { CurrentUser, Role, SiteSettings } from '../lib/api/types'

type Handler = unknown | ((init: RequestInit | undefined) => Response | unknown)

/**
 * Replaces fetch with a fake API. Keys are "METHOD /api/path" (query string ignored);
 * values are JSON bodies, Response objects, or functions returning either.
 * Unknown routes answer 404.
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input), 'http://localhost')
    const key = `${init?.method ?? 'GET'} ${url.pathname}`
    if (!(key in routes)) return new Response(null, { status: 404 })

    const handler = routes[key]
    const result = typeof handler === 'function' ? (handler as (i?: RequestInit) => unknown)(init) : handler
    if (result instanceof Response) return result
    return jsonResponse(result)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export const SETTINGS: SiteSettings = {
  siteName: 'Festival des Lumières',
  tagline: 'Trois jours de musique',
  eventStart: '2027-07-10',
  eventEnd: '2027-07-12',
  location: 'Tours',
  defaultLocale: 'fr',
}

export function userWith(roles: Role[], displayName = 'Alex'): CurrentUser {
  return { id: 1, email: 'alex@example.com', displayName, locale: 'fr', roles: ['ROLE_SUBSCRIBER', ...roles] }
}

/** Routes of an installed site, with the given visitor (null = anonymous). */
export function installedSite(user: CurrentUser | null, extra: Record<string, Handler> = {}) {
  return mockApi({
    'GET /api/install/status': { installed: true },
    'GET /api/settings': SETTINGS,
    'GET /api/me': { user },
    ...extra,
  })
}
