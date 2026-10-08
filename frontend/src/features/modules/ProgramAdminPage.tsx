import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '../../components/Dialog'
import { Alert, Button, Loading, SelectField, TextAreaField, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import type { Locale, ProgramSlot, Venue } from '../../lib/api/types'
import { formatDay, splitLocalTime, useProgram, useResourceMutations, useVenues } from './useModules'

/** /admin-app/program — venues and program slots (editors). */
export function ProgramAdminPage() {
  const { t, i18n } = useTranslation()
  const [locale, setLocale] = useState<Locale>(i18n.language === 'en' ? 'en' : 'fr')
  const venues = useVenues()
  const program = useProgram(locale)
  const venueMutations = useResourceMutations<Venue>('/venues')
  const slotMutations = useResourceMutations<ProgramSlot>('/program_slots')
  const [editingVenue, setEditingVenue] = useState<Venue | 'new' | null>(null)
  const [editingSlot, setEditingSlot] = useState<ProgramSlot | 'new' | null>(null)
  const deleteError = venueMutations.remove.error ?? slotMutations.remove.error

  return (
    <section className="space-y-8">
      <h1 className="font-heading text-3xl font-bold">{t('admin.nav.program')}</h1>
      {deleteError && <Alert>{errorMessageOf(deleteError, t('common.error'))}</Alert>}

      <section className="space-y-3" aria-labelledby="venues-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="venues-title" className="font-heading text-xl font-semibold">
            {t('modules.admin.venues')}
          </h2>
          <Button variant="secondary" onClick={() => setEditingVenue('new')}>
            {t('modules.admin.newVenue')}
          </Button>
        </div>
        {venues.isPending && <Loading label={t('common.loading')} />}
        <ul className="flex flex-wrap gap-2">
          {venues.data?.map((venue) => (
            <li key={venue.id} className="flex items-center gap-2 rounded-block border border-black/15 py-1 pr-1 pl-3">
              <span aria-hidden="true" className="size-3 rounded-full" style={{ background: venue.color }} />
              {venue.name}
              <Button variant="secondary" className="min-h-9 px-2 py-1 text-sm" onClick={() => setEditingVenue(venue)}>
                {t('media.edit')}
              </Button>
              <Button
                variant="danger"
                className="min-h-9 px-2 py-1 text-sm"
                onClick={() =>
                  window.confirm(t('modules.admin.confirmDelete', { name: venue.name })) &&
                  venueMutations.remove.mutate(venue.id)
                }
              >
                {t('common.delete')}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="slots-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="slots-title" className="font-heading text-xl font-semibold">
            {t('modules.admin.slots')}
          </h2>
          <div className="flex flex-wrap items-end gap-2">
            <SelectField
              label={t('articles.locale')}
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              <option value="fr">{t('language.fr')}</option>
              <option value="en">{t('language.en')}</option>
            </SelectField>
            <Button onClick={() => setEditingSlot('new')}>{t('modules.admin.newSlot')}</Button>
          </div>
        </div>
        {program.isPending && <Loading label={t('common.loading')} />}
        {program.data?.length === 0 && <p>{t('modules.program.empty')}</p>}
        <ul className="space-y-2">
          {program.data?.map((slot) => {
            const start = splitLocalTime(slot.startsAt)
            return (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-block bg-block p-3 text-block-ink"
              >
                <div>
                  <p className="font-semibold">{slot.title}</p>
                  <p className="text-sm text-muted">
                    {formatDay(start.day, i18n.language)} · {start.time}–{splitLocalTime(slot.endsAt).time}
                    {slot.venue && ` · ${slot.venue.name}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditingSlot(slot)}>
                    {t('media.edit')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      window.confirm(t('modules.admin.confirmDelete', { name: slot.title })) &&
                      slotMutations.remove.mutate(slot.id)
                    }
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <Dialog open={editingVenue !== null} title={t('modules.admin.venue')} onClose={() => setEditingVenue(null)}>
        {editingVenue !== null && (
          <VenueForm
            key={editingVenue === 'new' ? 'new' : editingVenue.id}
            venue={editingVenue === 'new' ? null : editingVenue}
            onDone={() => setEditingVenue(null)}
          />
        )}
      </Dialog>
      <Dialog open={editingSlot !== null} title={t('modules.admin.slot')} onClose={() => setEditingSlot(null)}>
        {editingSlot !== null && (
          <SlotForm
            key={editingSlot === 'new' ? 'new' : editingSlot.id}
            slot={editingSlot === 'new' ? null : editingSlot}
            locale={locale}
            venues={venues.data ?? []}
            onDone={() => setEditingSlot(null)}
          />
        )}
      </Dialog>
    </section>
  )
}

function VenueForm({ venue, onDone }: { venue: Venue | null; onDone: () => void }) {
  const { t } = useTranslation()
  const { save } = useResourceMutations<Venue>('/venues')
  const [form, setForm] = useState({
    name: venue?.name ?? '',
    description: venue?.description ?? '',
    color: venue?.color ?? '#1d4ed8',
    position: venue?.position ?? 0,
  })
  const errors = fieldErrorsOf(save.error)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate({ id: venue?.id ?? null, input: form }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <TextField
        label={t('modules.admin.name')}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name}
        required
      />
      <TextAreaField
        label={t('datasets.description')}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
      />
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 font-medium">
          {t('modules.admin.color')}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-11 w-16 rounded border border-black/30"
          />
        </label>
        <TextField
          label={t('pages.menuOrder')}
          type="number"
          min={0}
          max={999}
          value={form.position}
          onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
          className="w-32"
        />
      </div>
      {save.isError && Object.keys(errors).length === 0 && (
        <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>
      )}
      <Button type="submit" disabled={save.isPending}>
        {t('common.save')}
      </Button>
    </form>
  )
}

function SlotForm({
  slot,
  locale,
  venues,
  onDone,
}: {
  slot: ProgramSlot | null
  locale: Locale
  venues: Venue[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { save } = useResourceMutations<ProgramSlot, Record<string, unknown>>('/program_slots')
  const [form, setForm] = useState({
    title: slot?.title ?? '',
    description: slot?.description ?? '',
    startsAt: slot?.startsAt ?? '',
    endsAt: slot?.endsAt ?? '',
    venueId: slot?.venue?.id ?? null,
    speakers: slot?.speakers ?? '',
    category: slot?.category ?? '',
  })
  const errors = fieldErrorsOf(save.error)
  const field = (name: 'title' | 'speakers' | 'category') => ({
    value: form[name],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [name]: e.target.value }),
    error: errors[name],
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const { venueId, ...rest } = form
    save.mutate(
      {
        id: slot?.id ?? null,
        input: { ...rest, venue: venueId === null ? null : `/api/venues/${venueId}`, locale: slot?.locale ?? locale },
      },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <TextField label={t('modules.admin.slotTitle')} required {...field('title')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('modules.admin.startsAt')}
          type="datetime-local"
          value={form.startsAt}
          onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          error={errors.startsAt}
          required
        />
        <TextField
          label={t('modules.admin.endsAt')}
          type="datetime-local"
          value={form.endsAt}
          onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          error={errors.endsAt}
          required
        />
      </div>
      <SelectField
        label={t('modules.program.venue')}
        value={form.venueId ?? ''}
        onChange={(e) => setForm({ ...form, venueId: e.target.value === '' ? null : Number(e.target.value) })}
      >
        <option value="">{t('charts.editor.none')}</option>
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t('modules.admin.speakers')} hint={t('common.optional')} {...field('speakers')} />
        <TextField label={t('modules.program.category')} hint={t('common.optional')} {...field('category')} />
      </div>
      <TextAreaField
        label={t('datasets.description')}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={3}
      />
      {save.isError && Object.keys(errors).length === 0 && (
        <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>
      )}
      <Button type="submit" disabled={save.isPending}>
        {t('common.save')}
      </Button>
    </form>
  )
}
