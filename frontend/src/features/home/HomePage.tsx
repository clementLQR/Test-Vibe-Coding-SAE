import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { isLocale } from '../../lib/i18n'
import { useSiteSettings } from '../install/useSite'
import { ArticleCard } from '../public/ArticleCard'
import { EventInfo } from '../public/EventInfo'
import { usePublishedArticles } from '../public/usePublicContent'

const LATEST = 4

/** Public home page of the event: name, tagline, dates and place, latest articles. */
export function HomePage() {
  const { t, i18n } = useTranslation()
  const { data: settings } = useSiteSettings()
  const articles = usePublishedArticles(isLocale(i18n.language) ? i18n.language : 'fr')
  const latest = articles.data?.slice(0, LATEST) ?? []

  return (
    <div className="space-y-10">
      <title>{settings?.siteName ?? 'Evently'}</title>
      {settings?.tagline && <meta name="description" content={settings.tagline} />}

      <section className="space-y-4">
        <h1 className="ev-title font-heading font-bold">{settings?.siteName ?? t('home.title')}</h1>
        {settings?.tagline && <p className="max-w-prose text-lg">{settings.tagline}</p>}
        {settings && <EventInfo settings={settings} />}
      </section>

      <nav aria-label={t('public.modules')}>
        <ul className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ['/programme', 'nav.program', 'public.moduleHints.program'],
              ['/plan', 'nav.map', 'public.moduleHints.map'],
              ['/billetterie', 'nav.tickets', 'public.moduleHints.tickets'],
            ] as const
          ).map(([to, label, hint]) => (
            <li key={to}>
              <Link to={to} className="block h-full rounded-block bg-block p-4 text-block-ink hover:underline">
                <span className="block font-heading text-lg font-semibold">{t(label)}</span>
                <span className="block text-sm">{t(hint)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {latest.length > 0 && (
        <section className="space-y-4" aria-labelledby="latest-articles">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="latest-articles" className="font-heading text-2xl font-semibold">
              {t('public.latest')}
            </h2>
            <Link to="/articles" className="text-accent underline">
              {t('public.allArticles')}
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {latest.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
