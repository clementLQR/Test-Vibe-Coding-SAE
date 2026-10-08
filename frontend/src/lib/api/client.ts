/** Error thrown for any non-2xx API response. */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const API_BASE = '/api'

/**
 * Typed JSON fetch against the Symfony API (same origin, session cookie).
 * The caller declares the expected response type.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'same-origin',
  })

  const isJson = response.headers.get('Content-Type')?.includes('json') ?? false
  const body: unknown = response.status === 204 ? null : isJson ? await response.json() : await response.text()

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }
  return body as T
}
