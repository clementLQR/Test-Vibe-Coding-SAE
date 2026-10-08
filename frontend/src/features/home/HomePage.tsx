import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../../lib/api/client'
import type { HealthResponse } from '../../lib/api/types'

export function HomePage() {
  const { t } = useTranslation()
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthResponse>('/health'),
  })

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">{t('home.title')}</h1>
      <p className="max-w-prose text-lg">{t('home.intro')}</p>

      <div className="rounded-block bg-block p-4 text-block-ink">
        <h2 className="font-heading text-lg font-semibold">{t('home.apiStatus')}</h2>
        <output className="block">
          {health.isPending && t('home.loading')}
          {health.isError && t('home.apiError')}
          {health.isSuccess && t('home.apiOk', { version: health.data.version })}
        </output>
      </div>
    </section>
  )
}
