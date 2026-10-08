import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '../../components/Dialog'
import { Alert, Button, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import type { Visualization } from '../../lib/api/types'
import { hasAnyRole, useCurrentUser } from '../auth/useAuth'
import { useDeleteVisualization, useVisualizations } from './useVisualizations'
import { VisualizationEditor } from './VisualizationEditor'

/** Library of charts, reusable in every dashboard article. */
export function ChartsPage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const charts = useVisualizations()
  const remove = useDeleteVisualization()
  const [editing, setEditing] = useState<Visualization | 'new' | null>(null)
  const canEdit = (chart: Visualization) => hasAnyRole(user, ['ROLE_EDITOR']) || chart.createdById === user?.id

  const onDelete = (chart: Visualization) => {
    if (window.confirm(t('charts.confirmDelete', { title: chart.title }))) remove.mutate(chart.id)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t('admin.nav.charts')}</h1>
        <Button onClick={() => setEditing('new')}>{t('articles.newChart')}</Button>
      </div>
      <p>{t('charts.intro')}</p>
      {charts.isPending && <Loading label={t('common.loading')} />}
      {charts.isError && <Alert>{errorMessageOf(charts.error, t('common.error'))}</Alert>}
      {remove.isError && <Alert>{errorMessageOf(remove.error, t('common.error'))}</Alert>}
      {charts.isSuccess && charts.data.length === 0 && <p>{t('charts.empty')}</p>}
      {charts.isSuccess && charts.data.length > 0 && (
        <ul className="space-y-3">
          {charts.data.map((chart) => (
            <li
              key={chart.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-block bg-block p-4 text-block-ink"
            >
              <div>
                <p className="font-semibold">{chart.title}</p>
                <p className="text-sm text-muted">{t(`charts.types.${chart.chartType}.name`)}</p>
              </div>
              {canEdit(chart) && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditing(chart)}>
                    {t('media.edit')}
                  </Button>
                  <Button variant="danger" onClick={() => onDelete(chart)} disabled={remove.isPending}>
                    {t('common.delete')}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        title={editing === 'new' ? t('articles.newChart') : t('charts.editTitle')}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <VisualizationEditor
            key={editing === 'new' ? 'new' : editing.id}
            visualization={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        )}
      </Dialog>
    </section>
  )
}
