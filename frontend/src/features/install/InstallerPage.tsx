import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { Alert, Button, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import { isLocale } from '../../lib/i18n'
import { useInstall, type InstallInput } from './useSite'

type FormState = Omit<InstallInput, 'locale'>

const EMPTY_FORM: FormState = {
  siteName: '',
  tagline: '',
  eventStart: '',
  eventEnd: '',
  location: '',
  adminDisplayName: '',
  adminEmail: '',
  adminPassword: '',
}

/** WordPress-like first-run wizard: site information and administrator account. */
export function InstallerPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const install = useInstall()
  const [form, setForm] = useState(EMPTY_FORM)
  const errors = fieldErrorsOf(install.error)
  const hasFieldErrors = Object.keys(errors).length > 0

  const field = (name: keyof FormState) => ({
    value: form[name],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [name]: e.target.value }),
    error: errors[name],
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const locale = isLocale(i18n.language) ? i18n.language : 'fr'
    install.mutate({ ...form, locale }, { onSuccess: () => void navigate('/admin-app', { replace: true }) })
  }

  return (
    <main id="main" className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Evently</p>
          <h1 className="font-heading text-3xl font-bold">{t('install.title')}</h1>
        </div>
        <LanguageSwitcher />
      </header>
      <p>{t('install.intro')}</p>

      {install.isError && !hasFieldErrors && <Alert>{errorMessageOf(install.error, t('common.error'))}</Alert>}

      <form onSubmit={onSubmit} className="space-y-8" noValidate>
        <fieldset className="space-y-4">
          <legend className="mb-2 font-heading text-xl font-semibold">{t('install.siteSection')}</legend>
          <TextField label={t('install.siteName')} required {...field('siteName')} />
          <TextField label={t('install.tagline')} hint={t('common.optional')} {...field('tagline')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t('install.eventStart')} type="date" {...field('eventStart')} />
            <TextField label={t('install.eventEnd')} type="date" {...field('eventEnd')} />
          </div>
          <TextField label={t('install.location')} hint={t('common.optional')} {...field('location')} />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 font-heading text-xl font-semibold">{t('install.adminSection')}</legend>
          <TextField label={t('auth.displayName')} autoComplete="nickname" required {...field('adminDisplayName')} />
          <TextField label={t('auth.email')} type="email" autoComplete="email" required {...field('adminEmail')} />
          <TextField
            label={t('auth.password')}
            type="password"
            autoComplete="new-password"
            hint={t('auth.passwordHint')}
            required
            {...field('adminPassword')}
          />
        </fieldset>

        <Button type="submit" disabled={install.isPending} className="w-full sm:w-auto">
          {install.isPending ? t('common.loading') : t('install.submit')}
        </Button>
      </form>
    </main>
  )
}
