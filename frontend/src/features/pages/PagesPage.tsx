import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { usePages } from './usePages'

export function PagesPage() {
  const { t } = useTranslation()
  const pages = usePages()

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t('admin.nav.pages')}</h1>
        <Link
          to="/admin-app/pages/new"
          className="inline-flex min-h-11 items-center rounded bg-accent px-4 font-medium text-accent-ink"
        >
          {t('pages.new')}
        </Link>
      </div>
      <p>{t('pages.intro')}</p>
      {pages.isPending && <Loading label={t('common.loading')} />}
      {pages.isError && <Alert>{errorMessageOf(pages.error, t('common.error'))}</Alert>}
      {pages.isSuccess && pages.data.length === 0 && <p>{t('pages.empty')}</p>}
      {pages.isSuccess && pages.data.length > 0 && (
        <ul className="space-y-3">
          {pages.data.map((page) => (
            <li key={page.id} className="rounded-block bg-block p-4 text-block-ink">
              <Link to={`/admin-app/pages/${page.id}`} className="font-semibold text-accent underline">
                {page.title}
              </Link>
              <p className="text-sm text-muted">
                {t('pages.summaryLine', {
                  status: t(`articles.statuses.${page.status}`),
                  locale: t(`language.${page.locale}`),
                  menu: page.showInMenu ? t('pages.inMenu', { order: page.menuOrder }) : t('pages.notInMenu'),
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
