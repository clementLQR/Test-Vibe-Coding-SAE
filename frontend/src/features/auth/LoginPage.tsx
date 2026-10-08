import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Alert, Button, TextField } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { isServerPage, safeRedirect } from './redirect'
import { useCurrentUser, useLogin } from './useAuth'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirect'))
  const { user } = useCurrentUser()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (user !== null && !login.isSuccess) return <Navigate to="/" replace />

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          if (isServerPage(redirectTo)) window.location.assign(redirectTo)
          else void navigate(redirectTo, { replace: true })
        },
      },
    )
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="font-heading text-3xl font-bold">{t('auth.login.title')}</h1>
      {login.isError && <Alert>{errorMessageOf(login.error, t('common.error'))}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={login.isPending} className="w-full">
          {login.isPending ? t('common.loading') : t('auth.login.submit')}
        </Button>
      </form>
      <p>
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="text-accent underline">
          {t('auth.register.title')}
        </Link>
      </p>
    </section>
  )
}
