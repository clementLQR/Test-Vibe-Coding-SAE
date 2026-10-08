import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import { useInstallStatus } from './useSite'

export const INSTALLER_PATH = '/installer'

/**
 * Root route element: sends every page to the installer until the site is installed,
 * and closes the installer afterwards.
 */
export function InstallGate() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const status = useInstallStatus()

  if (status.isPending) return <Loading label={t('common.loading')} />
  if (status.isError) {
    return (
      <div className="p-4">
        <Alert>{t('common.apiUnreachable')}</Alert>
      </div>
    )
  }

  const onInstaller = pathname === INSTALLER_PATH
  if (!status.data.installed && !onInstaller) return <Navigate to={INSTALLER_PATH} replace />
  if (status.data.installed && onInstaller) return <Navigate to="/" replace />

  return <Outlet />
}
