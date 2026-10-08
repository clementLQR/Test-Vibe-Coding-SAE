import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '../../components/Dialog'
import { Alert, Button, Loading, SelectField, TextAreaField, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import type { Locale, TicketAvailability, TicketOffer } from '../../lib/api/types'
import { formatPrice, useResourceMutations, useTicketOffers } from './useModules'

const AVAILABILITIES: TicketAvailability[] = ['available', 'soon', 'sold_out']
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF']

/** /admin-app/tickets — ticket offers (editors). */
export function TicketsAdminPage() {
  const { t, i18n } = useTranslation()
  const [locale, setLocale] = useState<Locale>(i18n.language === 'en' ? 'en' : 'fr')
  const offers = useTicketOffers(locale)
  const { remove } = useResourceMutations<TicketOffer>('/ticket_offers')
  const [editing, setEditing] = useState<TicketOffer | 'new' | null>(null)

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t('admin.nav.tickets')}</h1>
        <div className="flex flex-wrap items-end gap-2">
          <SelectField
            label={t('articles.locale')}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <option value="fr">{t('language.fr')}</option>
            <option value="en">{t('language.en')}</option>
          </SelectField>
          <Button onClick={() => setEditing('new')}>{t('modules.admin.newOffer')}</Button>
        </div>
      </div>
      <p>{t('modules.tickets.notice')}</p>
      {offers.isPending && <Loading label={t('common.loading')} />}
      {remove.isError && <Alert>{errorMessageOf(remove.error, t('common.error'))}</Alert>}
      {offers.data?.length === 0 && <p>{t('modules.tickets.empty')}</p>}
      <ul className="space-y-2">
        {offers.data?.map((offer) => (
          <li
            key={offer.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-block bg-block p-3 text-block-ink"
          >
            <div>
              <p className="font-semibold">{offer.name}</p>
              <p className="text-sm text-muted">
                {formatPrice(offer.priceCents, offer.currency, i18n.language)} ·{' '}
                {t(`modules.tickets.availability.${offer.availability}`)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(offer)}>
                {t('media.edit')}
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  window.confirm(t('modules.admin.confirmDelete', { name: offer.name })) && remove.mutate(offer.id)
                }
              >
                {t('common.delete')}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={editing !== null} title={t('modules.admin.offer')} onClose={() => setEditing(null)}>
        {editing !== null && (
          <OfferForm
            key={editing === 'new' ? 'new' : editing.id}
            offer={editing === 'new' ? null : editing}
            locale={locale}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
    </section>
  )
}

function OfferForm({ offer, locale, onDone }: { offer: TicketOffer | null; locale: Locale; onDone: () => void }) {
  const { t } = useTranslation()
  const { save } = useResourceMutations<TicketOffer>('/ticket_offers')
  const [form, setForm] = useState({
    name: offer?.name ?? '',
    description: offer?.description ?? '',
    price: offer ? String(offer.priceCents / 100) : '',
    currency: offer?.currency ?? 'EUR',
    externalUrl: offer?.externalUrl ?? '',
    availability: offer?.availability ?? ('available' as TicketAvailability),
    position: offer?.position ?? 0,
  })
  const errors = fieldErrorsOf(save.error)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const { price, ...rest } = form
    // Prices are stored in cents: no float rounding on money
    const priceCents = Math.round(Number(price.replace(',', '.')) * 100)
    save.mutate(
      { id: offer?.id ?? null, input: { ...rest, priceCents, locale: offer?.locale ?? locale } },
      { onSuccess: onDone },
    )
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
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('modules.admin.price')}
          inputMode="decimal"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          error={errors.priceCents}
          required
        />
        <SelectField
          label={t('modules.admin.currency')}
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
        >
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
      </div>
      <TextField
        label={t('modules.admin.externalUrl')}
        type="url"
        placeholder="https://"
        hint={t('modules.admin.externalUrlHint')}
        value={form.externalUrl}
        onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
        error={errors.externalUrl}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t('modules.admin.availability')}
          value={form.availability}
          onChange={(e) => setForm({ ...form, availability: e.target.value as TicketAvailability })}
        >
          {AVAILABILITIES.map((a) => (
            <option key={a} value={a}>
              {t(`modules.tickets.availability.${a}`)}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('pages.menuOrder')}
          type="number"
          min={0}
          max={999}
          value={form.position}
          onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
        />
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
