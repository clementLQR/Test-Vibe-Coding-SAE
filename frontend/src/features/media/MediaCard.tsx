import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, TextField } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import type { Media } from '../../lib/api/types'
import { useDeleteMedia, useUpdateMediaAlt } from './useMedia'

interface MediaCardProps {
  media: Media
  /** Selection mode (article editor): the card offers "choose" instead of editing. */
  onSelect?: (media: Media) => void
}

function formatSize(bytes: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'unit', unit: 'kilobyte', maximumFractionDigits: 0 }).format(
    Math.max(1, bytes / 1024),
  )
}

export function MediaCard({ media, onSelect }: MediaCardProps) {
  const { t, i18n } = useTranslation()
  const alt = i18n.language === 'en' ? media.altEn : media.altFr
  const update = useUpdateMediaAlt()
  const remove = useDeleteMedia()
  const [altFr, setAltFr] = useState(media.altFr)
  const [altEn, setAltEn] = useState(media.altEn)

  const onSave = (event: FormEvent) => {
    event.preventDefault()
    update.mutate({ id: media.id, altFr, altEn })
  }

  const onDelete = () => {
    if (window.confirm(t('media.confirmDelete', { name: media.originalName }))) remove.mutate(media.id)
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-block bg-block text-block-ink">
      <img
        src={media.thumbnailUrl}
        alt={alt}
        width={400}
        height={Math.round((400 * media.height) / media.width)}
        loading="lazy"
        className="aspect-[4/3] w-full bg-black/5 object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-3 text-sm">
        <p className="font-semibold break-all">{media.originalName}</p>
        <p className="text-muted">
          {media.width} × {media.height} px · {formatSize(media.size, i18n.language)}
        </p>
        {!media.altComplete && <p className="font-medium text-red-700">{t('media.altMissing')}</p>}

        {onSelect ? (
          <Button
            onClick={() => onSelect(media)}
            disabled={!media.altComplete}
            className="mt-auto"
            aria-label={t('media.selectNamed', { name: media.originalName })}
          >
            {t('media.select')}
          </Button>
        ) : (
          <details className="mt-auto">
            <summary className="min-h-11 cursor-pointer py-2 font-medium">{t('media.edit')}</summary>
            <form onSubmit={onSave} className="space-y-3 pt-2">
              <TextField label={t('media.altFr')} value={altFr} onChange={(e) => setAltFr(e.target.value)} />
              <TextField label={t('media.altEn')} value={altEn} onChange={(e) => setAltEn(e.target.value)} />
              {update.isError && <Alert>{errorMessageOf(update.error, t('common.error'))}</Alert>}
              {remove.isError && <Alert>{errorMessageOf(remove.error, t('common.error'))}</Alert>}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={update.isPending}>
                  {t('common.save')}
                </Button>
                <Button variant="danger" onClick={onDelete} disabled={remove.isPending}>
                  {t('common.delete')}
                </Button>
              </div>
            </form>
          </details>
        )}
      </div>
    </article>
  )
}
