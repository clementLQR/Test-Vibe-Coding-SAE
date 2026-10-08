import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { useMapConfig, useMapItems } from './useModules'

// Leaflet is only downloaded on the map pages
const LeafletMap = lazy(() => import('./LeafletMap'))

/** /plan — the interactive map, followed by the same information as an accessible list. */
export function MapPage() {
  const { t } = useTranslation()
  const config = useMapConfig()
  const items = useMapItems()
  const error = config.error ?? items.error

  return (
    <section className="space-y-6">
      <title>{t('modules.map.title')}</title>
      <h1 className="ev-title font-heading font-bold">{t('modules.map.title')}</h1>
      {(config.isPending || items.isPending) && <Loading label={t('common.loading')} />}
      {error && <Alert>{errorMessageOf(error, t('common.error'))}</Alert>}

      {config.data && items.data && (
        <>
          <p>
            <a href="#map-list" className="text-accent underline">
              {t('modules.map.skipToList')}
            </a>
          </p>
          <Suspense fallback={<Loading label={t('common.loading')} />}>
            <LeafletMap config={config.data} items={items.data} label={t('modules.map.title')} />
          </Suspense>

          <section id="map-list" aria-labelledby="map-list-title" className="space-y-3">
            <h2 id="map-list-title" className="font-heading text-2xl font-semibold">
              {t('modules.map.list')}
            </h2>
            {items.data.length === 0 && <p>{t('modules.map.empty')}</p>}
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.data.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-block bg-block p-3 text-block-ink">
                  <span
                    aria-hidden="true"
                    className={`mt-1 size-4 shrink-0 ${item.kind === 'point' ? 'rounded-full' : 'rounded-sm'}`}
                    style={{ background: item.color }}
                  />
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-muted">{t(`modules.map.kinds.${item.kind}`)}</p>
                    {item.description && <p className="text-sm">{item.description}</p>}
                    {item.venue && (
                      <Link to={`/programme?venue=${item.venue.id}`} className="text-sm text-accent underline">
                        {t('modules.map.programOf', { venue: item.venue.name })}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </section>
  )
}
