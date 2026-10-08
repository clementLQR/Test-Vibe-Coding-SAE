import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import { ApiError, errorMessageOf } from '../../lib/api/client'
import { NotFoundPage } from '../../routes/NotFoundPage'
import { ArticleView } from '../articles/ArticleView'
import { useSiteSettings } from '../install/useSite'
import { BlockRatingControl } from '../ratings/BlockRatingControl'
import { useArticleRatings } from '../ratings/useRatings'
import { useThemeTarget } from '../themes/themeContext'
import { useArticleBySlug } from './usePublicContent'

/** /articles/:slug — the article with its theme and the rating of each block. */
export function ArticlePage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const article = useArticleBySlug(slug)
  const settings = useSiteSettings()
  useThemeTarget({ articleId: article.data?.id })
  const ratings = useArticleRatings(article.data?.id ?? 0, article.isSuccess)

  if (article.isPending) return <Loading label={t('common.loading')} />
  if (article.error instanceof ApiError && [401, 403, 404].includes(article.error.status)) return <NotFoundPage />
  if (article.isError) return <Alert>{errorMessageOf(article.error, t('common.error'))}</Alert>

  const data = article.data
  const siteName = settings.data?.siteName ?? 'Evently'

  return (
    <>
      <title>{`${data.title} · ${siteName}`}</title>
      {data.summary && <meta name="description" content={data.summary} />}
      <meta property="og:title" content={data.title} />
      <meta property="og:type" content="article" />
      {data.translations.map((tr) => (
        <link key={tr.locale} rel="alternate" hrefLang={tr.locale} href={`/articles/${tr.slug}`} />
      ))}
      {data.translations.length > 0 && (
        <p className="mx-auto mb-4 max-w-3xl">
          {data.translations.map((tr) => (
            <Link
              key={tr.locale}
              to={`/articles/${tr.slug}`}
              hrefLang={tr.locale}
              lang={tr.locale}
              className="text-accent underline"
            >
              {t('public.readIn', { language: t(`language.in.${tr.locale}`, { lng: tr.locale }), lng: tr.locale })}
            </Link>
          ))}
        </p>
      )}
      <ArticleView
        article={data}
        blockFooter={(block) =>
          block.id !== undefined && block.type !== 'heading' ? (
            <BlockRatingControl articleId={data.id} blockId={block.id} rating={ratings.data?.[block.id]} />
          ) : null
        }
      />
    </>
  )
}
