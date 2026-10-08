import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { hasAnyRole, useCurrentUser } from '../auth/useAuth'
import { DatasetImportForm } from './DatasetImportForm'
import { StatusBadge } from './StatusBadge'
import { useDatasets } from './useDatasets'

export function DatasetsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useCurrentUser()
  const datasets = useDatasets()

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">{t('admin.nav.datasets')}</h1>
      <p>{t('datasets.intro')}</p>

      {hasAnyRole(user, ['ROLE_DATA_PROVIDER']) && <DatasetImportForm />}

      <h2 className="font-heading text-xl font-semibold">{t('datasets.listTitle')}</h2>
      {datasets.isPending && <Loading label={t('common.loading')} />}
      {datasets.isError && <Alert>{errorMessageOf(datasets.error, t('common.error'))}</Alert>}
      {datasets.isSuccess && datasets.data.length === 0 && <p>{t('datasets.empty')}</p>}
      {datasets.isSuccess && datasets.data.length > 0 && (
        <ul className="space-y-3">
          {datasets.data.map((dataset) => (
            <li key={dataset.id} className="rounded-block bg-block p-4 text-block-ink">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link to={`/admin-app/datasets/${dataset.id}`} className="font-semibold text-accent underline">
                  {dataset.name}
                </Link>
                <StatusBadge status={dataset.status} />
              </div>
              <p className="text-sm text-muted">
                {t('datasets.summary', {
                  rows: dataset.rowCount ?? 0,
                  variables: dataset.variables.length,
                  provider: dataset.providerName ?? '—',
                  date: new Date(dataset.createdAt).toLocaleDateString(i18n.language),
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
