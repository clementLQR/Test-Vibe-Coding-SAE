import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { useCurrentUser } from '../auth/useAuth'
import { canEditArticle, useArticles } from './useArticles'

export function ArticlesPage() {
  const { t, i18n } = useTranslation()
  const { user } = useCurrentUser()
  const articles = useArticles()

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t('admin.nav.articles')}</h1>
        <Link
          to="/admin-app/articles/new"
          className="inline-flex min-h-11 items-center rounded bg-accent px-4 font-medium text-accent-ink"
        >
          {t('articles.new')}
        </Link>
      </div>
      {articles.isPending && <Loading label={t('common.loading')} />}
      {articles.isError && <Alert>{errorMessageOf(articles.error, t('common.error'))}</Alert>}
      {articles.isSuccess && articles.data.length === 0 && <p>{t('articles.empty')}</p>}
      {articles.isSuccess && articles.data.length > 0 && (
        <ul className="space-y-3">
          {articles.data.map((article) => (
            <li key={article.id} className="rounded-block bg-block p-4 text-block-ink">
              <p className="font-semibold">
                {canEditArticle(user, article) ? (
                  <Link to={`/admin-app/articles/${article.id}`} className="text-accent underline">
                    {article.title}
                  </Link>
                ) : (
                  article.title
                )}
              </p>
              <p className="text-sm text-muted">
                {t('articles.summaryLine', {
                  status: t(`articles.statuses.${article.status}`),
                  type: t(`articles.types.${article.type}.name`),
                  author: article.authorName ?? '—',
                  date: new Date(article.updatedAt).toLocaleDateString(i18n.language),
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
