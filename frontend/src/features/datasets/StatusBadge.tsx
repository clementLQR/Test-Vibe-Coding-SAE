import { useTranslation } from 'react-i18next'
import type { DatasetStatus } from '../../lib/api/types'

export function StatusBadge({ status }: { status: DatasetStatus }) {
  const { t } = useTranslation()
  const style =
    status === 'validated'
      ? 'border-green-800 text-green-900 bg-green-50'
      : 'border-amber-800 text-amber-900 bg-amber-50'

  return (
    <span className={`rounded border px-2 py-0.5 text-sm font-medium ${style}`}>{t(`datasets.status.${status}`)}</span>
  )
}
