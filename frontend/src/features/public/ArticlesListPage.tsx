import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { isLocale } from '../../lib/i18n'
import type { ArticleType } from '../../lib/api/types'
import { ArticleCard } from './ArticleCard'
import { usePublishedArticles } from './usePublicContent'

const FILTERS: (ArticleType | null)[] = [null, 'dashboard', 'classic']

/** /articles: published articles of the current language, filterable by type. */
export function ArticlesListPage() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const typeParam = params.get('type')
  const type = typeParam === 'classic' || typeParam === 'dashboard' ? typeParam : null
  const articles = usePublishedArticles(isLocale(i18n.language) ? i18n.language : 'fr', type)

  return (
    <section className="space-y-6">
      <title>{t('public.articles.title')}</title>
      <h1 className="ev-title font-heading font-bold">{t('public.articles.title')}</h1>

      <fieldset>
        <legend className="mb-2 font-medium">{t('public.articles.filter')}</legend>
        <div className="flex flex-wrap gap-x-5">
          {FILTERS.map((value) => (
            <label key={value ?? 'all'} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="type"
                className="size-5"
                checked={type === value}
                onChange={() => setParams(value ? { type: value } : {})}
              />
              {value ? t(`articles.types.${value}.name`) : t('public.articles.all')}
            </label>
          ))}
        </div>
      </fieldset>

      {articles.isPending && <Loading label={t('common.loading')} />}
      {articles.isError && <Alert>{errorMessageOf(articles.error, t('common.error'))}</Alert>}
      {articles.isSuccess && articles.data.length === 0 && <p>{t('public.articles.empty')}</p>}
      {articles.isSuccess && articles.data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {articles.data.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
