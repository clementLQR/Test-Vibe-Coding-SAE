import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'
import { Alert, Button, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import { isLocale } from '../../lib/i18n'
import { useCurrentUser, useRegister } from './useAuth'

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const register = useRegister()
  const [form, setForm] = useState({ displayName: '', email: '', password: '' })
  const errors = fieldErrorsOf(register.error)
  const hasFieldErrors = Object.keys(errors).length > 0

  if (user !== null && !register.isSuccess) return <Navigate to="/" replace />

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const locale = isLocale(i18n.language) ? i18n.language : 'fr'
    register.mutate({ ...form, locale }, { onSuccess: () => void navigate('/', { replace: true }) })
  }

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [name]: e.target.value }),
    error: errors[name],
  })

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="font-heading text-3xl font-bold">{t('auth.register.title')}</h1>
      <p>{t('auth.register.intro')}</p>
      {register.isError && !hasFieldErrors && <Alert>{errorMessageOf(register.error, t('common.error'))}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField label={t('auth.displayName')} autoComplete="nickname" required {...field('displayName')} />
        <TextField label={t('auth.email')} type="email" autoComplete="email" required {...field('email')} />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          required
          {...field('password')}
        />
        <Button type="submit" disabled={register.isPending} className="w-full">
          {register.isPending ? t('common.loading') : t('auth.register.submit')}
        </Button>
      </form>
      <p>
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="text-accent underline">
          {t('auth.login.title')}
        </Link>
      </p>
    </section>
  )
}
