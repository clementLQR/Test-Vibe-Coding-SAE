import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Article } from '../../lib/api/types'

export function ArticleCard({ article }: { article: Article }) {
  const { t, i18n } = useTranslation()
  const date = article.publishedAt ?? article.updatedAt

  return (
    <article className="flex h-full flex-col gap-2 rounded-block bg-block p-4 text-block-ink">
      <p className="text-sm text-muted">
        {t(`articles.types.${article.type}.name`)} ·{' '}
        <time dateTime={date}>{new Date(date).toLocaleDateString(i18n.language, { dateStyle: 'long' })}</time>
      </p>
      <h3 className="font-heading text-lg font-semibold">
        <Link to={`/articles/${article.slug}`} className="hover:underline">
          {article.title}
        </Link>
      </h3>
      {article.summary && <p className="text-sm">{article.summary}</p>}
    </article>
  )
}
