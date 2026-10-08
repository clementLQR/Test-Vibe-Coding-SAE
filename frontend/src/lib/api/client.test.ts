import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
      ),
  )
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed JSON body', async () => {
    mockFetch(200, { status: 'ok', version: '0.1.0' })

    await expect(apiFetch('/health')).resolves.toEqual({ status: 'ok', version: '0.1.0' })
    expect(fetch).toHaveBeenCalledWith('/api/health', expect.objectContaining({ credentials: 'same-origin' }))
  })

  it('throws an ApiError carrying status and body on failure', async () => {
    mockFetch(422, { detail: 'invalid' })

    const error = await apiFetch('/articles').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, body: { detail: 'invalid' } })
  })
})
