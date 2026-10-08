import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'
import { LanguageSwitcher } from './LanguageSwitcher'

export function PublicLayout() {
  const { t } = useTranslation()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded px-2 py-1 hover:underline ${isActive ? 'underline underline-offset-4' : ''}`

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
      >
        {t('app.skipToContent')}
      </a>

      <header className="bg-header text-header-ink">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="font-heading text-xl font-bold">
            Evently
          </NavLink>
          <nav aria-label={t('app.mainNav')} className="flex items-center gap-2">
            <NavLink to="/" end className={linkClass}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/admin-app" className={linkClass}>
              {t('nav.admin')}
            </NavLink>
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
