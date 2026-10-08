import { useTranslation } from 'react-i18next'
import { useSiteSettings } from '../install/useSite'

function formatDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`))
}

/** Public home page of the event (enriched with articles and modules in sprint 4). */
export function HomePage() {
  const { t, i18n } = useTranslation()
  const { data: settings } = useSiteSettings()

  const dates =
    settings?.eventStart && settings.eventEnd && settings.eventStart !== settings.eventEnd
      ? t('home.dateRange', {
          start: formatDate(settings.eventStart, i18n.language),
          end: formatDate(settings.eventEnd, i18n.language),
        })
      : settings?.eventStart
        ? formatDate(settings.eventStart, i18n.language)
        : null

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">{settings?.siteName ?? t('home.title')}</h1>
      {settings?.tagline && <p className="max-w-prose text-lg">{settings.tagline}</p>}
      {(dates || settings?.location) && (
        <dl className="grid max-w-md gap-2 rounded-block bg-block p-4 text-block-ink sm:grid-cols-[auto_1fr] sm:gap-x-4">
          {dates && (
            <>
              <dt className="font-semibold">{t('home.when')}</dt>
              <dd>{dates}</dd>
            </>
          )}
          {settings?.location && (
            <>
              <dt className="font-semibold">{t('home.where')}</dt>
              <dd>{settings.location}</dd>
            </>
          )}
        </dl>
      )}
    </section>
  )
}
