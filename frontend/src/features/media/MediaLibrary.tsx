import { useDeferredValue, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Loading } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import type { Media } from '../../lib/api/types'
import { MediaCard } from './MediaCard'
import { MEDIA_PAGE_SIZE, useMediaList } from './useMedia'

/** Searchable, paginated grid of the media library. */
export function MediaLibrary({ onSelect }: { onSelect?: (media: Media) => void }) {
  const { t } = useTranslation()
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(search.trim())
  const list = useMediaList(deferredSearch, page)
  const pageCount = list.data ? Math.max(1, Math.ceil(list.data.total / MEDIA_PAGE_SIZE)) : 1

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:max-w-sm">
        <label htmlFor={searchId} className="font-medium">
          {t('media.search')}
        </label>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="min-h-11 rounded border border-black/30 bg-white px-3 py-2 text-black"
        />
      </div>

      {list.isPending && <Loading label={t('common.loading')} />}
      {list.isError && <Alert>{errorMessageOf(list.error, t('common.error'))}</Alert>}
      {list.isSuccess && (
        <>
          <output className="block text-sm text-muted">{t('media.count', { count: list.data.total })}</output>
          {list.data.items.length > 0 && (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.data.items.map((media) => (
                <li key={media.id}>
                  <MediaCard media={media} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          )}
          {pageCount > 1 && (
            <nav aria-label={t('common.pagination')} className="flex items-center justify-center gap-4">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t('common.previous')}
              </Button>
              <span>{t('common.pageOf', { page, count: pageCount })}</span>
              <Button variant="secondary" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
                {t('common.next')}
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
