import { useId, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, TextField } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import { useUploadMedia } from './useMedia'

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp'

export function MediaUploadForm() {
  const { t } = useTranslation()
  const fileId = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const upload = useUploadMedia()
  const [file, setFile] = useState<File | null>(null)
  const [altFr, setAltFr] = useState('')
  const [altEn, setAltEn] = useState('')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (file === null) return
    upload.mutate(
      { file, altFr, altEn },
      {
        onSuccess: () => {
          setFile(null)
          setAltFr('')
          setAltEn('')
          if (fileInput.current) fileInput.current.value = ''
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-block bg-block p-4 text-block-ink">
      <h2 className="font-heading text-xl font-semibold">{t('media.upload.title')}</h2>
      <div className="flex flex-col gap-1">
        <label htmlFor={fileId} className="font-medium">
          {t('media.upload.file')}
        </label>
        <input
          ref={fileInput}
          id={fileId}
          type="file"
          accept={ACCEPTED_TYPES}
          aria-describedby={`${fileId}-hint`}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="min-h-11"
        />
        <p id={`${fileId}-hint`} className="text-sm text-muted">
          {t('media.upload.hint')}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t('media.altFr')} value={altFr} onChange={(e) => setAltFr(e.target.value)} />
        <TextField label={t('media.altEn')} value={altEn} onChange={(e) => setAltEn(e.target.value)} />
      </div>
      {upload.isError && <Alert>{errorMessageOf(upload.error, t('common.error'))}</Alert>}
      {upload.isSuccess && <Alert tone="success">{t('media.upload.done')}</Alert>}
      <Button type="submit" disabled={file === null || upload.isPending}>
        {upload.isPending ? t('media.upload.sending') : t('media.upload.submit')}
      </Button>
    </form>
  )
}
