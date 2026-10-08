import { useTranslation } from 'react-i18next'
import { Alert, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { isLocale } from '../../lib/i18n'
import type { TicketAvailability } from '../../lib/api/types'
import { formatPrice, useTicketOffers } from './useModules'

const BADGES: Record<TicketAvailability, string> = {
  available: 'border-green-800 bg-green-50 text-green-900',
  soon: 'border-amber-800 bg-amber-50 text-amber-900',
  sold_out: 'border-red-800 bg-red-50 text-red-900',
}

/** /billetterie — the offers; buying happens on the organiser's ticketing service. */
export function TicketsPage() {
  const { t, i18n } = useTranslation()
  const offers = useTicketOffers(isLocale(i18n.language) ? i18n.language : 'fr')

  return (
    <section className="space-y-6">
      <title>{t('modules.tickets.title')}</title>
      <h1 className="ev-title font-heading font-bold">{t('modules.tickets.title')}</h1>
      {offers.isPending && <Loading label={t('common.loading')} />}
      {offers.isError && <Alert>{errorMessageOf(offers.error, t('common.error'))}</Alert>}
      {offers.isSuccess && offers.data.length === 0 && <p>{t('modules.tickets.empty')}</p>}
      {offers.isSuccess && offers.data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.data.map((offer) => (
            <li key={offer.id}>
              <article className="flex h-full flex-col gap-3 rounded-block bg-block p-5 text-block-ink">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-heading text-xl font-semibold">{offer.name}</h2>
                  <span className={`rounded border px-2 py-0.5 text-sm font-medium ${BADGES[offer.availability]}`}>
                    {t(`modules.tickets.availability.${offer.availability}`)}
                  </span>
                </div>
                <p className="text-3xl font-bold">{formatPrice(offer.priceCents, offer.currency, i18n.language)}</p>
                {offer.description && <p>{offer.description}</p>}
                {offer.externalUrl && offer.availability === 'available' && (
                  <a
                    href={offer.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex min-h-11 items-center justify-center rounded bg-accent px-4 font-medium text-accent-ink"
                  >
                    {t('modules.tickets.buy', { name: offer.name })}
                    <span className="sr-only"> {t('common.newTab')}</span>
                  </a>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted">{t('modules.tickets.notice')}</p>
    </section>
  )
}
