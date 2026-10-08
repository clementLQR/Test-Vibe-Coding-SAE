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
  { to: '/admin-app/media', labelKey: 'admin.nav.media', roles: MEDIA_ROLES },
  { to: '/admin-app/users', labelKey: 'admin.nav.users', roles: ['ROLE_ADMIN'] },
]
