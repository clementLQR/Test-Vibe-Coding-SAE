import { lazy, Suspense, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '../../components/Dialog'
import { Alert, Button, Loading, SelectField, TextAreaField, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import type { MapConfig, MapItem, MapPosition, Venue } from '../../lib/api/types'
import { MediaLibrary } from '../media/MediaLibrary'
import { useMapConfig, useMapItems, useResourceMutations, useSaveMapConfig, useVenues } from './useModules'

const LeafletMap = lazy(() => import('./LeafletMap'))

type Editing = { item: MapItem | null; kind: MapItem['kind'] } | null

/** /admin-app/map — map background and elements (editors). */
export function MapAdminPage() {
  const { t } = useTranslation()
  const config = useMapConfig()
  const items = useMapItems()
  const venues = useVenues()
  const { remove } = useResourceMutations<MapItem>('/map_items')
  const [editing, setEditing] = useState<Editing>(null)

  if (config.isPending || items.isPending) return <Loading label={t('common.loading')} />
  if (config.isError || items.isError)
    return <Alert>{errorMessageOf(config.error ?? items.error, t('common.error'))}</Alert>

  return (
    <section className="space-y-8">
      <h1 className="font-heading text-3xl font-bold">{t('admin.nav.map')}</h1>
      <ConfigForm key={JSON.stringify(config.data)} config={config.data} />

      {editing ? (
        <ItemEditor
          key={editing.item?.id ?? `new-${editing.kind}`}
          config={config.data}
          others={items.data.filter((i) => i.id !== editing.item?.id)}
          item={editing.item}
          kind={editing.kind}
          venues={venues.data ?? []}
          onDone={() => setEditing(null)}
        />
      ) : (
        <section className="space-y-3" aria-labelledby="items-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="items-title" className="font-heading text-xl font-semibold">
              {t('modules.admin.mapItems')}
            </h2>
            <div className="flex gap-2">
              <Button onClick={() => setEditing({ item: null, kind: 'point' })}>{t('modules.admin.newPoint')}</Button>
              <Button onClick={() => setEditing({ item: null, kind: 'zone' })}>{t('modules.admin.newZone')}</Button>
            </div>
          </div>
          <Suspense fallback={<Loading label={t('common.loading')} />}>
            <LeafletMap config={config.data} items={items.data} label={t('modules.map.title')} />
          </Suspense>
          {remove.isError && <Alert>{errorMessageOf(remove.error, t('common.error'))}</Alert>}
          <ul className="space-y-2">
            {items.data.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-block bg-block p-3 text-block-ink"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-3 rounded-full" style={{ background: item.color }} />
                  {item.label} <span className="text-sm text-muted">({t(`modules.map.kinds.${item.kind}`)})</span>
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditing({ item, kind: item.kind })}>
                    {t('media.edit')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      window.confirm(t('modules.admin.confirmDelete', { name: item.label })) && remove.mutate(item.id)
                    }
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}

function ConfigForm({ config }: { config: MapConfig }) {
  const { t, i18n } = useTranslation()
  const save = useSaveMapConfig()
  const [form, setForm] = useState({
    mode: config.mode,
    centerLat: String(config.centerLat),
    centerLng: String(config.centerLng),
    zoom: config.zoom,
    background: config.background,
  })
  const [picking, setPicking] = useState(false)
  const errors = fieldErrorsOf(save.error)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate({
      mode: form.mode,
      centerLat: Number(form.centerLat),
      centerLng: Number(form.centerLng),
      zoom: form.zoom,
      backgroundMediaId: form.background?.mediaId ?? null,
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-block bg-block p-4 text-block-ink" noValidate>
      <h2 className="font-heading text-xl font-semibold">{t('modules.admin.background')}</h2>
      <fieldset>
        <legend className="sr-only">{t('modules.admin.background')}</legend>
        <div className="flex flex-wrap gap-x-6">
          {(['osm', 'image'] as const).map((mode) => (
            <label key={mode} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="map-mode"
                className="size-5"
                checked={form.mode === mode}
                onChange={() => setForm({ ...form, mode })}
              />
              {t(`modules.admin.modes.${mode}`)}
            </label>
          ))}
        </div>
      </fieldset>
      {form.mode === 'osm' ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label={t('modules.admin.latitude')}
            inputMode="decimal"
            value={form.centerLat}
            onChange={(e) => setForm({ ...form, centerLat: e.target.value })}
            error={errors.centerLat}
          />
          <TextField
            label={t('modules.admin.longitude')}
            inputMode="decimal"
            value={form.centerLng}
            onChange={(e) => setForm({ ...form, centerLng: e.target.value })}
          />
          <TextField
            label={t('modules.admin.zoom')}
            type="number"
            min={1}
            max={19}
            value={form.zoom}
            onChange={(e) => setForm({ ...form, zoom: Number(e.target.value) })}
            error={errors.zoom}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {form.background ? (
            <img
              src={form.background.url}
              alt={i18n.language === 'en' ? form.background.altEn : form.background.altFr}
              className="max-h-40 rounded-block"
            />
          ) : (
            <p className="text-muted">{t('articles.noImage')}</p>
          )}
          {errors.backgroundMediaId && <p className="text-sm text-red-700">{errors.backgroundMediaId}</p>}
          <Button variant="secondary" onClick={() => setPicking(true)}>
            {t('articles.chooseImage')}
          </Button>
        </div>
      )}
      {save.isSuccess && <Alert tone="success">{t('modules.admin.saved')}</Alert>}
      {save.isError && Object.keys(errors).length === 0 && (
        <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>
      )}
      <Button type="submit" disabled={save.isPending}>
        {t('common.save')}
      </Button>
      <Dialog open={picking} title={t('articles.chooseImage')} onClose={() => setPicking(false)}>
        <MediaLibrary
          onSelect={(media) => {
            setForm({
              ...form,
              background: {
                mediaId: media.id,
                url: media.url,
                width: media.width,
                height: media.height,
                altFr: media.altFr,
                altEn: media.altEn,
              },
            })
            setPicking(false)
          }}
        />
      </Dialog>
    </form>
  )
}

interface ItemEditorProps {
  config: MapConfig
  others: MapItem[]
  item: MapItem | null
  kind: MapItem['kind']
  venues: Venue[]
  onDone: () => void
}

function ItemEditor({ config, others, item, kind, venues, onDone }: ItemEditorProps) {
  const { t } = useTranslation()
  const { save } = useResourceMutations<MapItem, Record<string, unknown>>('/map_items')
  const [form, setForm] = useState({
    label: item?.label ?? '',
    description: item?.description ?? '',
    color: item?.color ?? '#dc2626',
    venueId: item?.venue?.id ?? null,
    // Kept as typed text: converting on every keystroke would swallow the decimal separator ("0." → 0)
    coordinates: (item?.coordinates ?? []).map(([a, b]) => [String(a), String(b)] as [string, string]),
  })
  const errors = fieldErrorsOf(save.error)
  const round = (n: number) => String(Math.round(n * 1e6) / 1e6)
  const toNumber = (value: string) => Number(value.replace(',', '.'))
  const positions: MapPosition[] = form.coordinates
    .map(([a, b]): MapPosition => [toNumber(a), toNumber(b)])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))

  const onPick = ([a, b]: MapPosition) => {
    const position: [string, string] = [round(a), round(b)]
    setForm((f) => ({ ...f, coordinates: kind === 'point' ? [position] : [...f.coordinates, position] }))
  }
  const setCoordinate = (index: number, axis: 0 | 1, value: string) =>
    setForm((f) => ({
      ...f,
      coordinates: f.coordinates.map((p, i) => (i === index ? (axis === 0 ? [value, p[1]] : [p[0], value]) : p)),
    }))

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const { venueId, coordinates, ...rest } = form
    save.mutate(
      {
        id: item?.id ?? null,
        input: {
          ...rest,
          kind,
          // Invalid numbers are sent as typed so the server explains the problem
          coordinates: coordinates.map(([a, b]) =>
            [toNumber(a), toNumber(b)].map((n, i) => (Number.isFinite(n) ? n : [a, b][i])),
          ),
          venue: venueId === null ? null : `/api/venues/${venueId}`,
        },
      },
      { onSuccess: onDone },
    )
  }

  const axes =
    config.mode === 'image'
      ? [t('modules.admin.y'), t('modules.admin.x')]
      : [t('modules.admin.latitude'), t('modules.admin.longitude')]

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h2 className="font-heading text-xl font-semibold">
        {item
          ? t('modules.admin.editItem', { label: item.label })
          : t(kind === 'point' ? 'modules.admin.newPoint' : 'modules.admin.newZone')}
      </h2>
      <p>{t(kind === 'point' ? 'modules.admin.pickPoint' : 'modules.admin.pickZone')}</p>
      <Suspense fallback={<Loading label={t('common.loading')} />}>
        <LeafletMap
          config={config}
          items={others}
          label={t('modules.map.title')}
          draft={{ kind, coordinates: positions, color: form.color }}
          onPick={onPick}
        />
      </Suspense>

      <fieldset className="space-y-2">
        <legend className="font-medium">{t('modules.admin.coordinates')}</legend>
        {form.coordinates.length === 0 && <p className="text-sm text-muted">{t('modules.admin.noCoordinates')}</p>}
        <ol className="space-y-2">
          {form.coordinates.map((position, index) => (
            <li key={index} className="flex flex-wrap items-end gap-2">
              {[0, 1].map((axis) => (
                <TextField
                  key={axis}
                  label={`${axes[axis]} ${kind === 'zone' ? index + 1 : ''}`.trim()}
                  inputMode="decimal"
                  value={position[axis]}
                  onChange={(e) => setCoordinate(index, axis as 0 | 1, e.target.value)}
                  className="w-40"
                />
              ))}
              <Button
                variant="secondary"
                onClick={() => setForm((f) => ({ ...f, coordinates: f.coordinates.filter((_, i) => i !== index) }))}
                aria-label={t('modules.admin.removeCorner', { index: index + 1 })}
              >
                {t('common.delete')}
              </Button>
            </li>
          ))}
        </ol>
        {errors.coordinates && <p className="text-sm text-red-700">{errors.coordinates}</p>}
      </fieldset>

      <TextField
        label={t('modules.admin.name')}
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        error={errors.label}
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
      </div>
      {save.isError && Object.keys(errors).length === 0 && (
        <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>
          {t('common.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
