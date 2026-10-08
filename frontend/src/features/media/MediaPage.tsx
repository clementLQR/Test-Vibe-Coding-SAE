import { useTranslation } from 'react-i18next'
import { MediaLibrary } from './MediaLibrary'
import { MediaUploadForm } from './MediaUploadForm'

export function MediaPage() {
  const { t } = useTranslation()

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">{t('admin.nav.media')}</h1>
      <p>{t('media.intro')}</p>
      <MediaUploadForm />
      <MediaLibrary />
    </section>
  )
}
