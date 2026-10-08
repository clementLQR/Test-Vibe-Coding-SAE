import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, Button, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import { useCreateDataset } from './useDatasets'

type SourceKind = 'file' | 'url'

/** Import of a CSV, uploaded or from a URL. On success, opens the dataset to check its variables. */
export function DatasetImportForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const fileId = useId()
  const create = useCreateDataset()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<SourceKind>('file')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const errors = fieldErrorsOf(create.error)
  const hasFieldErrors = Object.keys(errors).length > 0

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const source = kind === 'file' ? { kind, file } : { kind, url }
    create.mutate(
      { name, description, source },
      { onSuccess: (dataset) => void navigate(`/admin-app/datasets/${dataset.id}`) },
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-block bg-block p-4 text-block-ink" noValidate>
      <h2 className="font-heading text-xl font-semibold">{t('datasets.import.title')}</h2>
      <p className="text-sm">{t('datasets.import.format')}</p>

      <TextField
        label={t('datasets.name')}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <TextField
        label={t('datasets.description')}
        hint={t('common.optional')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <fieldset className="space-y-2">
        <legend className="font-medium">{t('datasets.import.source')}</legend>
        <div className="flex flex-wrap gap-x-6">
          {(['file', 'url'] as const).map((value) => (
            <label key={value} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="source"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                className="size-5"
              />
              {t(`datasets.import.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {kind === 'file' ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={fileId} className="font-medium">
            {t('datasets.import.fileLabel')}
          </label>
          <input
            id={fileId}
            type="file"
            accept=".csv,.txt,text/csv"
            aria-invalid={errors.file ? true : undefined}
            aria-describedby={errors.file ? `${fileId}-error` : `${fileId}-hint`}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="min-h-11"
          />
          {errors.file ? (
            <p id={`${fileId}-error`} className="text-sm text-red-700">
              {errors.file}
            </p>
          ) : (
            <p id={`${fileId}-hint`} className="text-sm text-muted">
              {t('datasets.import.fileHint')}
            </p>
          )}
        </div>
      ) : (
        <TextField
          label={t('datasets.import.urlLabel')}
          type="url"
          inputMode="url"
          placeholder="https://"
          hint={t('datasets.import.urlHint')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errors.url}
        />
      )}

      {create.isError && !hasFieldErrors && <Alert>{errorMessageOf(create.error, t('common.error'))}</Alert>}
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? t('datasets.import.reading') : t('datasets.import.submit')}
      </Button>
    </form>
  )
}
