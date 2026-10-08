import { useTranslation } from 'react-i18next'
import { Loading } from './ui'

/** Placeholder while a lazily loaded page is downloaded. */
export function PageLoading() {
  const { t } = useTranslation()
  return <Loading label={t('common.loading')} />
}
