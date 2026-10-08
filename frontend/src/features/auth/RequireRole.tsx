import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import type { Role } from '../../lib/api/types'
import { hasAnyRole, useCurrentUser } from './useAuth'

/**
 * Shows its children only to users having at least one of the roles.
 * Visitors are sent to the login page. The API enforces the same rules:
 * this guard only avoids showing screens that would fail.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, isPending } = useCurrentUser()

  if (isPending) return <Loading label={t('common.loading')} />
  if (user === null) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (!hasAnyRole(user, roles)) {
    return <Alert>{t('auth.forbidden')}</Alert>
  }
  return children
}
