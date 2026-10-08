import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { isLocale } from '../lib/i18n'
import { hasAnyRole, STAFF_ROLES, useCurrentUser, useLogout } from '../features/auth/useAuth'
import { useSiteSettings } from '../features/install/useSite'
import { useMenu } from '../features/public/usePublicContent'
import { ThemeProvider } from '../features/themes/ThemeProvider'
import { LanguageSwitcher } from './LanguageSwitcher'

export function PublicLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const settings = useSiteSettings()
  const menu = useMenu(isLocale(i18n.language) ? i18n.language : 'fr')
  const { user } = useCurrentUser()
  const logout = useLogout()
  const siteName = settings.data?.siteName ?? 'Evently'
  const inAdmin = pathname.startsWith('/admin-app')

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded px-2 hover:underline ${isActive ? 'underline underline-offset-4' : ''}`

  const onLogout = () => logout.mutate(undefined, { onSuccess: () => void navigate('/') })

  return (
    <ThemeProvider enabled={!inAdmin}>
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
              <NavLink to="/articles" className={linkClass}>
                {t('nav.articles')}
              </NavLink>
              {menu.data?.map((item) => (
                <NavLink key={item.slug} to={`/pages/${item.slug}`} className={linkClass}>
                  {item.title}
                </NavLink>
              ))}
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
          <p>
            {siteName} · {t('app.poweredBy')}
          </p>
        </footer>
      </div>
    </ThemeProvider>
  )
}
