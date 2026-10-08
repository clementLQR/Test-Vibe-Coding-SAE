import type { Role } from '../../lib/api/types'
import { MEDIA_ROLES, STAFF_ROLES } from '../auth/useAuth'

export interface AdminLink {
  to: string
  labelKey: string
  roles: Role[]
  end?: boolean
}

/** Admin sections; each one is shown only to the roles allowed by the API. */
export const ADMIN_LINKS: AdminLink[] = [
  { to: '/admin-app', labelKey: 'admin.nav.dashboard', roles: STAFF_ROLES, end: true },
  { to: '/admin-app/articles', labelKey: 'admin.nav.articles', roles: ['ROLE_AUTHOR'] },
  { to: '/admin-app/charts', labelKey: 'admin.nav.charts', roles: ['ROLE_AUTHOR'] },
  { to: '/admin-app/datasets', labelKey: 'admin.nav.datasets', roles: ['ROLE_DATA_PROVIDER'] },
  { to: '/admin-app/media', labelKey: 'admin.nav.media', roles: MEDIA_ROLES },
  { to: '/admin-app/pages', labelKey: 'admin.nav.pages', roles: ['ROLE_EDITOR'] },
  { to: '/admin-app/themes', labelKey: 'admin.nav.themes', roles: ['ROLE_DESIGNER'] },
  { to: '/admin-app/users', labelKey: 'admin.nav.users', roles: ['ROLE_ADMIN'] },
]
