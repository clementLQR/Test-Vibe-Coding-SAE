import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { Alert, Button, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { useCurrentUser } from '../auth/useAuth'
import { PreviewTable } from './PreviewTable'
import { StatusBadge } from './StatusBadge'
import { canManageDataset, useDataset, useDatasetPreview, useDeleteDataset } from './useDatasets'
import { VariablesForm } from './VariablesForm'

export function DatasetDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const id = Number(useParams().id)
  const { user } = useCurrentUser()
  const dataset = useDataset(id)
  const canManage = dataset.isSuccess && canManageDataset(user, dataset.data)
  const preview = useDatasetPreview(id, canManage)
  const remove = useDeleteDataset()

  if (dataset.isPending) return <Loading label={t('common.loading')} />
  if (dataset.isError) return <Alert>{errorMessageOf(dataset.error, t('common.error'))}</Alert>

  const data = dataset.data
  const onDelete = () => {
    if (window.confirm(t('datasets.confirmDelete', { name: data.name }))) {
      remove.mutate(data.id, { onSuccess: () => void navigate('/admin-app/datasets') })
    }
  }

  return (
    <section className="space-y-6">
      <Link to="/admin-app/datasets" className="text-accent underline">
        {t('datasets.back')}
      </Link>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-bold">{data.name}</h1>
          <StatusBadge status={data.status} />
        </div>
        {data.description && <p>{data.description}</p>}
        <p className="text-sm text-muted break-all">
          {data.sourceUrl ? t('datasets.sourceUrl', { url: data.sourceUrl }) : t('datasets.sourceFile')}
        </p>
      </header>

      {canManage ? (
        <>
          {preview.isError && <Alert>{errorMessageOf(preview.error, t('common.error'))}</Alert>}
          <VariablesForm dataset={data} preview={preview.data} />
          <h2 className="font-heading text-xl font-semibold">{t('datasets.preview.title')}</h2>
          {preview.isPending && <Loading label={t('common.loading')} />}
          {preview.isSuccess && <PreviewTable preview={preview.data} />}
          {remove.isError && <Alert>{errorMessageOf(remove.error, t('common.error'))}</Alert>}
          <Button variant="danger" onClick={onDelete} disabled={remove.isPending}>
            {t('datasets.delete')}
          </Button>
        </>
      ) : (
        <ul className="space-y-1">
          {data.variables.map((variable) => (
            <li key={variable.id}>
              {variable.label} — {t(`datasets.type.${variable.type}`)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
