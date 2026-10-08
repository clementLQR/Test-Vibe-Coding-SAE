import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import type { ColumnStats, Dataset, DatasetPreview, VariableType } from '../../lib/api/types'
import { useSaveDataset, type VariableInput } from './useDatasets'

const TYPES: VariableType[] = ['categorical', 'numerical']

interface VariablesFormProps {
  dataset: Dataset
  preview: DatasetPreview | undefined
}

/**
 * The provider checks what the system understood: one card per variable with its
 * detected type and statistics, then confirms types and labels and validates.
 */
export function VariablesForm({ dataset, preview }: VariablesFormProps) {
  const { t } = useTranslation()
  const { saveVariables, validate } = useSaveDataset(dataset.id)
  const [variables, setVariables] = useState<VariableInput[]>(
    dataset.variables.map(({ id, label, type }) => ({ id, label, type })),
  )
  const locked = dataset.status === 'validated'
  const error = saveVariables.error ?? validate.error
  const errors = fieldErrorsOf(error)
  const busy = saveVariables.isPending || validate.isPending

  const update = (index: number, change: Partial<VariableInput>) =>
    setVariables((current) => current.map((v, i) => (i === index ? { ...v, ...change } : v)))

  const onSave = (event: FormEvent) => {
    event.preventDefault()
    validate.reset()
    saveVariables.mutate(variables)
  }

  const onValidate = async () => {
    saveVariables.reset()
    validate.reset()
    try {
      await saveVariables.mutateAsync(variables)
      await validate.mutateAsync()
    } catch {
      // Errors are displayed from the mutation state
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">{t('datasets.variables.title')}</h2>
      <p>{locked ? t('datasets.variables.lockedIntro') : t('datasets.variables.intro')}</p>

      <ol className="grid gap-4 md:grid-cols-2">
        {dataset.variables.map((variable, index) => (
          <li key={variable.id}>
            <VariableCard
              name={variable.name}
              detectedType={variable.detectedType}
              value={variables[index]}
              stats={preview?.columns.find((c) => c.name === variable.name)?.stats}
              locked={locked}
              error={errors[`variables[${index}].type`]}
              onChange={(change) => update(index, change)}
            />
          </li>
        ))}
      </ol>

      {error && Object.keys(errors).length === 0 && <Alert>{errorMessageOf(error, t('common.error'))}</Alert>}
      {Object.keys(errors).length > 0 && <Alert>{t('datasets.variables.fixErrors')}</Alert>}
      {saveVariables.isSuccess && !validate.isPending && !validate.isSuccess && (
        <Alert tone="success">{t('datasets.variables.saved')}</Alert>
      )}
      {validate.isSuccess && <Alert tone="success">{t('datasets.variables.validated')}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" disabled={busy}>
          {t('datasets.variables.save')}
        </Button>
        {!locked && (
          <Button onClick={() => void onValidate()} disabled={busy}>
            {t('datasets.variables.validate')}
          </Button>
        )}
      </div>
    </form>
  )
}

interface VariableCardProps {
  name: string
  detectedType: VariableType
  value: VariableInput
  stats: ColumnStats | undefined
  locked: boolean
  error: string | undefined
  onChange: (change: Partial<VariableInput>) => void
}

function VariableCard({ name, detectedType, value, stats, locked, error, onChange }: VariableCardProps) {
  const { t, i18n } = useTranslation()
  const errorId = useId()
  const number = (n: number | null) => (n === null ? '—' : n.toLocaleString(i18n.language))

  return (
    <div className="space-y-3 rounded-block bg-block p-4 text-block-ink">
      <p className="font-mono text-sm break-all">{name}</p>
      <TextField
        label={t('datasets.variables.label')}
        value={value.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />

      <fieldset aria-describedby={error ? errorId : undefined}>
        <legend className="font-medium">{t('datasets.variables.type')}</legend>
        <div className="flex flex-wrap gap-x-4">
          {TYPES.map((type) => (
            <label key={type} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name={`type-${name}`}
                value={type}
                checked={value.type === type}
                disabled={locked}
                onChange={() => onChange({ type })}
                className="size-5"
              />
              {t(`datasets.type.${type}`)}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted">
          {t('datasets.variables.detected', { type: t(`datasets.type.${detectedType}`) })}
        </p>
        {error && (
          <p id={errorId} className="text-sm text-red-700">
            {error}
          </p>
        )}
      </fieldset>

      {stats && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
          <dt className="text-muted">{t('datasets.stats.filled')}</dt>
          <dd>{t('datasets.stats.filledValue', { filled: stats.filled, empty: stats.empty })}</dd>
          <dt className="text-muted">{t('datasets.stats.distinct')}</dt>
          <dd>{stats.distinct}</dd>
          {stats.numeric > 0 && (
            <>
              <dt className="text-muted">{t('datasets.stats.range')}</dt>
              <dd>
                {t('datasets.stats.rangeValue', {
                  min: number(stats.min),
                  max: number(stats.max),
                  mean: number(stats.mean),
                })}
              </dd>
            </>
          )}
          {stats.numeric > 0 && stats.numeric < stats.filled && (
            <>
              <dt className="text-muted">{t('datasets.stats.notNumbers')}</dt>
              <dd>{stats.filled - stats.numeric}</dd>
            </>
          )}
          <dt className="text-muted">{t('datasets.stats.examples')}</dt>
          <dd className="break-words">{stats.examples.join(' · ')}</dd>
        </dl>
      )}
    </div>
  )
}
