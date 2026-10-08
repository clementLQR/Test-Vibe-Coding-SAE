import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { hasAnyRole, STAFF_ROLES, useCurrentUser, useLogout } from '../features/auth/useAuth'
import { useSiteSettings } from '../features/install/useSite'
import { LanguageSwitcher } from './LanguageSwitcher'

export function PublicLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const settings = useSiteSettings()
  const { user } = useCurrentUser()
  const logout = useLogout()
  const siteName = settings.data?.siteName ?? 'Evently'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded px-2 hover:underline ${isActive ? 'underline underline-offset-4' : ''}`

  const onLogout = () => logout.mutate(undefined, { onSuccess: () => void navigate('/') })

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
      >
        {t('app.skipToContent')}
      </a>

      <header className="bg-header text-header-ink">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <NavLink to="/" className="font-heading text-xl font-bold">
            {siteName}
          </NavLink>
          <nav aria-label={t('app.mainNav')} className="flex flex-wrap items-center gap-x-2">
            <NavLink to="/" end className={linkClass}>
              {t('nav.home')}
            </NavLink>
            {hasAnyRole(user, STAFF_ROLES) && (
              <NavLink to="/admin-app" className={linkClass}>
                {t('nav.admin')}
              </NavLink>
            )}
            {user === null ? (
              <>
                <NavLink to="/login" className={linkClass}>
                  {t('auth.login.title')}
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  {t('auth.register.title')}
                </NavLink>
              </>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-11 items-center rounded px-2 hover:underline"
              >
                {t('auth.logout', { name: user.displayName })}
              </button>
            )}
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-black/10 px-4 py-6 text-center text-sm text-muted">
        {t('app.poweredBy')}
      </footer>
    </div>
  )
}
