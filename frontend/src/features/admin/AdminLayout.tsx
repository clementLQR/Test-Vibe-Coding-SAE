import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'
import { hasAnyRole, useCurrentUser } from '../auth/useAuth'
import { ADMIN_LINKS } from './adminLinks'

export function AdminLayout() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const links = ADMIN_LINKS.filter((link) => hasAnyRole(user, link.roles))

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block whitespace-nowrap rounded px-3 py-2 hover:bg-black/5 ${isActive ? 'bg-black/10 font-semibold' : ''}`

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <nav aria-label={t('admin.nav.label')} className="md:w-56 md:shrink-0">
        <ul className="flex gap-1 overflow-x-auto md:flex-col">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end} className={linkClass}>
                {t(link.labelKey)}
              </NavLink>
            </li>
          ))}
          {hasAnyRole(user, ['ROLE_ADMIN']) && (
            <li>
              {/* Symfony page: full page load on purpose */}
              <a href="/admin" className={linkClass({ isActive: false })}>
                {t('admin.nav.backOffice')}
              </a>
            </li>
          )}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
