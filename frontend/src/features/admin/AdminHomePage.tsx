import { useTranslation } from 'react-i18next'

export function AdminHomePage() {
  const { t } = useTranslation()

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-3xl font-bold">{t('admin.title')}</h1>
      <p>{t('admin.comingSoon')}</p>
    </section>
  )
}
