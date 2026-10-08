import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import { ApiError, errorMessageOf } from '../../lib/api/client'
import { NotFoundPage } from '../../routes/NotFoundPage'
import { ArticleView } from '../articles/ArticleView'
import { useSiteSettings } from '../install/useSite'
import { useThemeTarget } from '../themes/themeContext'
import { EventInfo } from './EventInfo'
import { usePageBySlug } from './usePublicContent'

/** /pages/:slug — a page of the site; the "contact" template adds the event information. */
export function PagePage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const page = usePageBySlug(slug)
  const settings = useSiteSettings()
  useThemeTarget({ pageId: page.data?.id })

  if (page.isPending) return <Loading label={t('common.loading')} />
  if (page.error instanceof ApiError && [401, 403, 404].includes(page.error.status)) return <NotFoundPage />
  if (page.isError) return <Alert>{errorMessageOf(page.error, t('common.error'))}</Alert>

  return (
    <>
      <title>{`${page.data.title} · ${settings.data?.siteName ?? 'Evently'}`}</title>
      <ArticleView article={{ title: page.data.title, summary: '', blocks: page.data.blocks }}>
        {page.data.template === 'contact' && settings.data && (
          <section className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold">{t('public.practicalInfo')}</h2>
            <EventInfo settings={settings.data} />
          </section>
        )}
      </ArticleView>
    </>
  )
}
