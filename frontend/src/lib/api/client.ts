import i18n from '../i18n'
import type { Collection } from './types'

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
 * Typed fetch against the Symfony API (same origin, session cookie).
 * The caller declares the expected response type. Plain objects are sent as JSON,
 * FormData as multipart. Errors come back in the current interface language.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  headers.set('Accept-Language', i18n.language)
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
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

/** JSON body helper: `apiFetch(path, jsonBody('POST', data))`. */
export function jsonBody(method: string, data: unknown): RequestInit {
  return { method, body: JSON.stringify(data) }
}

/** Partial update of an API Platform resource. */
export function mergePatch(data: unknown): RequestInit {
  return {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/merge-patch+json' },
  }
}

interface JsonLdCollection<T> {
  member: T[]
  totalItems: number
}

/** Paginated API Platform collection (JSON-LD gives the total count). */
export async function apiCollection<T>(path: string): Promise<Collection<T>> {
  const data = await apiFetch<JsonLdCollection<T>>(path, { headers: { Accept: 'application/ld+json' } })
  return { items: data.member, total: data.totalItems }
}

interface Violation {
  propertyPath: string
  message?: string
  title?: string
}

function bodyOf(error: unknown): Record<string, unknown> | null {
  if (!(error instanceof ApiError) || typeof error.body !== 'object' || error.body === null) return null
  return error.body as Record<string, unknown>
}

/** Validation errors by field (Symfony and API Platform formats). */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  const violations = bodyOf(error)?.violations
  if (!Array.isArray(violations)) return {}

  const errors: Record<string, string> = {}
  for (const violation of violations as Violation[]) {
    errors[violation.propertyPath] ??= violation.message ?? violation.title ?? ''
  }
  return errors
}

/** Human-readable message of an API error, or the fallback. */
export function errorMessageOf(error: unknown, fallback: string): string {
  const body = bodyOf(error)
  const message = body?.message ?? body?.detail
  return typeof message === 'string' && message !== '' ? message : fallback
}
