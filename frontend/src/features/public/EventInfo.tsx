import { useTranslation } from 'react-i18next'
import type { SiteSettings } from '../../lib/api/types'

function formatDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`))
}

/** When and where the event takes place (home page, contact pages). */
export function EventInfo({ settings }: { settings: SiteSettings }) {
  const { t, i18n } = useTranslation()

  const dates =
    settings.eventStart && settings.eventEnd && settings.eventStart !== settings.eventEnd
      ? t('home.dateRange', {
          start: formatDate(settings.eventStart, i18n.language),
          end: formatDate(settings.eventEnd, i18n.language),
        })
      : settings.eventStart
        ? formatDate(settings.eventStart, i18n.language)
        : null

  if (!dates && !settings.location) return null

  return (
    <dl className="grid max-w-md gap-2 rounded-block bg-block p-4 text-block-ink sm:grid-cols-[auto_1fr] sm:gap-x-4">
      {dates && (
        <>
          <dt className="font-semibold">{t('home.when')}</dt>
          <dd>{dates}</dd>
        </>
      )}
      {settings.location && (
        <>
          <dt className="font-semibold">{t('home.where')}</dt>
          <dd>{settings.location}</dd>
        </>
      )}
    </dl>
  )
}
