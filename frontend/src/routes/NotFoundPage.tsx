import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-3xl font-bold">{t('notFound.title')}</h1>
      <p>{t('notFound.text')}</p>
      <Link to="/" className="text-accent underline">
        {t('notFound.back')}
      </Link>
    </section>
  )
}
