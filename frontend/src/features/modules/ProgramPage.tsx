import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Alert, Button, Loading, SelectField } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { isLocale } from '../../lib/i18n'
import type { ProgramSlot } from '../../lib/api/types'
import { formatDay, splitLocalTime, useProgram } from './useModules'

const FAVORITES_KEY = 'evently.favorites'

function readFavorites(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : []
  } catch {
    return []
  }
}

/** Favourites stay in this browser only (no account needed). */
function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(readFavorites)
  const toggle = (id: number) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]
    setFavorites(next)
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    } catch {
      // Storage unavailable: favourites last until the page is closed
    }
  }
  return { favorites, toggle }
}

/** /programme — slots by day, filterable by venue, category and favourites. */
export function ProgramPage() {
  const { t, i18n } = useTranslation()
  const program = useProgram(isLocale(i18n.language) ? i18n.language : 'fr')
  const { favorites, toggle } = useFavorites()
  // ?venue=<id> comes from the map ("program of this venue")
  const [searchParams] = useSearchParams()
  const [venue, setVenue] = useState(searchParams.get('venue') ?? '')
  const [category, setCategory] = useState('')
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  const slots = useMemo(() => program.data ?? [], [program.data])
  const venues = useMemo(
    () => [...new Map(slots.filter((s) => s.venue).map((s) => [s.venue!.id, s.venue!])).values()],
    [slots],
  )
  const categories = useMemo(() => [...new Set(slots.map((s) => s.category).filter(Boolean))] as string[], [slots])

  const visible = slots.filter(
    (s) =>
      (venue === '' || String(s.venue?.id) === venue) &&
      (category === '' || s.category === category) &&
      (!onlyFavorites || favorites.includes(s.id)),
  )
  const days = [...new Set(visible.map((s) => splitLocalTime(s.startsAt).day))]

  return (
    <section className="space-y-6">
      <title>{t('modules.program.title')}</title>
      <h1 className="ev-title font-heading font-bold">{t('modules.program.title')}</h1>

      {program.isPending && <Loading label={t('common.loading')} />}
      {program.isError && <Alert>{errorMessageOf(program.error, t('common.error'))}</Alert>}
      {program.isSuccess && slots.length === 0 && <p>{t('modules.program.empty')}</p>}

      {slots.length > 0 && (
        <div className="flex flex-wrap items-end gap-4">
          <SelectField label={t('modules.program.venue')} value={venue} onChange={(e) => setVenue(e.target.value)}>
            <option value="">{t('modules.program.allVenues')}</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </SelectField>
          {categories.length > 0 && (
            <SelectField
              label={t('modules.program.category')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t('modules.program.allCategories')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
          )}
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              className="size-5"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
            />
            {t('modules.program.onlyFavorites', { count: favorites.length })}
          </label>
        </div>
      )}

      {slots.length > 0 && (
        <output className="block text-sm text-muted">{t('modules.program.count', { count: visible.length })}</output>
      )}

      {days.map((day) => (
        <section key={day} aria-labelledby={`day-${day}`} className="space-y-3">
          <h2 id={`day-${day}`} className="font-heading text-2xl font-semibold first-letter:uppercase">
            {formatDay(day, i18n.language)}
          </h2>
          <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visible
              .filter((s) => splitLocalTime(s.startsAt).day === day)
              .map((slot) => (
                <li key={slot.id}>
                  <SlotCard
                    slot={slot}
                    favorite={favorites.includes(slot.id)}
                    onToggleFavorite={() => toggle(slot.id)}
                  />
                </li>
              ))}
          </ol>
        </section>
      ))}
    </section>
  )
}

function SlotCard({
  slot,
  favorite,
  onToggleFavorite,
}: {
  slot: ProgramSlot
  favorite: boolean
  onToggleFavorite: () => void
}) {
  const { t } = useTranslation()
  const start = splitLocalTime(slot.startsAt)
  const end = splitLocalTime(slot.endsAt)

  return (
    <article
      className="flex h-full flex-col gap-2 rounded-block border-l-4 bg-block p-4 text-block-ink"
      style={{ borderLeftColor: slot.venue?.color ?? 'transparent' }}
    >
      <p className="font-semibold">
        <time dateTime={slot.startsAt}>{start.time}</time> – <time dateTime={slot.endsAt}>{end.time}</time>
        {start.day !== end.day && <span className="text-sm font-normal"> ({t('modules.program.nextDay')})</span>}
      </p>
      <h3 className="font-heading text-lg font-semibold">{slot.title}</h3>
      {(slot.venue || slot.category) && (
        <p className="text-sm text-muted">{[slot.venue?.name, slot.category].filter(Boolean).join(' · ')}</p>
      )}
      {slot.speakers && <p className="text-sm">{slot.speakers}</p>}
      {slot.description && <p className="text-sm">{slot.description}</p>}
      <Button
        variant="secondary"
        className="mt-auto self-start"
        aria-pressed={favorite}
        onClick={onToggleFavorite}
        aria-label={t(favorite ? 'modules.program.unfavorite' : 'modules.program.favorite', { title: slot.title })}
      >
        <span aria-hidden="true">{favorite ? '★' : '☆'}</span>&nbsp;{t('modules.program.favoriteShort')}
      </Button>
    </article>
  )
}
