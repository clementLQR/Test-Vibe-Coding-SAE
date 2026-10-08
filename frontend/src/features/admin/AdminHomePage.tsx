import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { hasAnyRole, useCurrentUser } from '../auth/useAuth'
import { ADMIN_LINKS } from './adminLinks'

export function AdminHomePage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const shortcuts = ADMIN_LINKS.filter((link) => !link.end && hasAnyRole(user, link.roles))
  const roles = user?.roles.filter((role) => role !== 'ROLE_SUBSCRIBER') ?? []

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">{t('admin.title')}</h1>
      <p>{t('admin.welcome', { name: user?.displayName ?? '' })}</p>
      <p>
        {t('admin.yourRoles')} {roles.map((role) => t(`roles.${role}`)).join(', ')}
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="block rounded-block bg-block p-4 text-block-ink hover:underline">
              <span className="font-heading text-lg font-semibold">{t(link.labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
