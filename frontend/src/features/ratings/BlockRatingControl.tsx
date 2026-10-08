import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { errorMessageOf } from '../../lib/api/client'
import { useCurrentUser } from '../auth/useAuth'
import { useRateBlock, type BlockRating } from './useRatings'

const SCORES = [0, 1, 2, 3, 4, 5]

interface BlockRatingControlProps {
  articleId: number
  blockId: number
  rating: BlockRating | undefined
}

/**
 * Average rating of a block and, for logged-in users, a 0-5 star rating made of
 * native radio buttons (keyboard and screen reader friendly).
 */
export function BlockRatingControl({ articleId, blockId, rating }: BlockRatingControlProps) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user } = useCurrentUser()
  const rate = useRateBlock(articleId)
  const mine = rating?.mine ?? null
  const name = `rating-${blockId}`

  const summary =
    rating && rating.count > 0
      ? t('ratings.average', { average: rating.average.toLocaleString(i18n.language), count: rating.count })
      : t('ratings.none')

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/10 pt-2 text-sm">
      <p className="text-muted">{summary}</p>
      {user === null ? (
        <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="text-accent underline">
          {t('ratings.loginToRate')}
        </Link>
      ) : (
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">{t('ratings.legend')}</legend>
          <span aria-hidden="true" className="text-muted">
            {t('ratings.yourRating')}
          </span>
          <div className="flex">
            {SCORES.map((score) => (
              <label key={score} className="relative flex min-h-11 min-w-8 cursor-pointer items-center justify-center">
                <input
                  type="radio"
                  name={name}
                  value={score}
                  checked={mine === score}
                  disabled={rate.isPending}
                  onChange={() => rate.mutate({ blockId, score })}
                  className="peer absolute inset-0 cursor-pointer opacity-0"
                />
                <span
                  aria-hidden="true"
                  className="rounded px-0.5 text-xl leading-none peer-focus-visible:outline-3 peer-focus-visible:outline-accent"
                >
                  {score === 0 ? (mine === 0 ? '⊘' : '○') : mine !== null && score <= mine ? '★' : '☆'}
                </span>
                <span className="sr-only">{t('ratings.stars', { count: score })}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {rate.isError && (
        <p role="alert" className="text-red-700">
          {errorMessageOf(rate.error, t('common.error'))}
        </p>
      )}
    </div>
  )
}
