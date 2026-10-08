import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../../test/mockApi'
import { changeLocale } from '../i18n'
import { ApiError, apiCollection, apiFetch, errorMessageOf, fieldErrorsOf } from './client'

function mockFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    changeLocale('fr')
  })

  it('returns the parsed JSON body and sends the interface language', async () => {
    changeLocale('en')
    const fetchMock = mockFetch(jsonResponse({ status: 'ok', version: '0.1.0' }))

    await expect(apiFetch('/health')).resolves.toEqual({ status: 'ok', version: '0.1.0' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/health')
    expect(init.credentials).toBe('same-origin')
    expect(new Headers(init.headers).get('Accept-Language')).toBe('en')
  })

  it('throws an ApiError carrying status and body on failure', async () => {
    mockFetch(jsonResponse({ detail: 'invalid' }, 422))

    const error = await apiFetch('/articles').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, body: { detail: 'invalid' } })
  })

  it('reads JSON-LD collections', async () => {
    const fetchMock = mockFetch(jsonResponse({ member: [{ id: 1 }], totalItems: 30 }))

    await expect(apiCollection('/media?page=2')).resolves.toEqual({ items: [{ id: 1 }], total: 30 })
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new Headers(init.headers).get('Accept')).toBe('application/ld+json')
  })
})

describe('error helpers', () => {
  it('maps Symfony and API Platform violations by field, first message wins', () => {
    const error = new ApiError(422, {
      violations: [
        { propertyPath: 'email', title: 'Invalid email.' },
        { propertyPath: 'email', title: 'Second message.' },
        { propertyPath: 'altFr', message: 'Too long.' },
      ],
    })

    expect(fieldErrorsOf(error)).toEqual({ email: 'Invalid email.', altFr: 'Too long.' })
    expect(fieldErrorsOf(new Error('network'))).toEqual({})
  })

  it('prefers message, then detail, then the fallback', () => {
    expect(errorMessageOf(new ApiError(401, { message: 'Wrong password.' }), 'fallback')).toBe('Wrong password.')
    expect(errorMessageOf(new ApiError(422, { detail: 'Last admin.' }), 'fallback')).toBe('Last admin.')
    expect(errorMessageOf(new ApiError(500, '<html>'), 'fallback')).toBe('fallback')
  })
})
