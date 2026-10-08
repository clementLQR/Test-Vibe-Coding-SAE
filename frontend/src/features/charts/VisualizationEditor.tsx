import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Loading, SelectField, TextAreaField, TextField } from '../../components/ui'
import { apiFetch, errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import type { ChartOptions, ChartType, ChartTypeDefinition, Dataset, Visualization } from '../../lib/api/types'
import { DEFAULT_PALETTE } from './buildChart'
import { ChartFigure } from './ChartFigure'
import { useChartTypes } from './useChartData'
import { useSaveVisualization, type VisualizationDraft } from './useVisualizations'

const PALETTE_SIZE = 6

function defaultOptions(definition: ChartTypeDefinition | undefined): ChartOptions {
  return Object.fromEntries((definition?.options ?? []).map((o) => [o.name, o.default]))
}

function fromVisualization(v: Visualization): VisualizationDraft {
  const { title, description, chartType, datasetId, mapping, colors, options } = v
  return { title, description, chartType, datasetId, mapping, colors, options }
}

interface VisualizationEditorProps {
  visualization?: Visualization
  onSaved: (visualization: Visualization) => void
  onCancel?: () => void
}

/**
 * Chart builder: data set, chart type, variables per role (only compatible variables are offered,
 * from the server chart-type registry), options and colours, with a live preview.
 */
export function VisualizationEditor({ visualization, onSaved, onCancel }: VisualizationEditorProps) {
  const { t } = useTranslation()
  const chartTypes = useChartTypes()
  const datasets = useQuery({
    queryKey: ['datasets', 'validated'],
    queryFn: () => apiFetch<Dataset[]>('/datasets?status=validated'),
  })
  const save = useSaveVisualization(visualization?.id ?? null)
  const [draft, setDraft] = useState<VisualizationDraft>(
    visualization
      ? fromVisualization(visualization)
      : {
          title: '',
          description: '',
          chartType: 'bar',
          datasetId: null,
          mapping: {},
          colors: [],
          options: { aggregation: 'sum', horizontal: false, stacked: false },
        },
  )
  const errors = fieldErrorsOf(save.error)

  if (chartTypes.isPending || datasets.isPending) return <Loading label={t('common.loading')} />
  if (chartTypes.isError || datasets.isError) {
    return <Alert>{errorMessageOf(chartTypes.error ?? datasets.error, t('common.error'))}</Alert>
  }

  const definition = chartTypes.data.find((d) => d.name === draft.chartType)
  const dataset = datasets.data.find((d) => d.id === draft.datasetId)
  const update = (change: Partial<VisualizationDraft>) => setDraft((current) => ({ ...current, ...change }))

  const changeType = (chartType: ChartType) => {
    const next = chartTypes.data.find((d) => d.name === chartType)
    // Keep the variables that still fit a role of the new chart type
    const mapping = Object.fromEntries(
      Object.entries(draft.mapping).filter(([role, name]) => {
        const target = next?.roles.find((r) => r.name === role)
        const variable = dataset?.variables.find((v) => v.name === name)
        return target && variable && (target.variableType === null || target.variableType === variable.type)
      }),
    )
    update({ chartType, mapping, options: defaultOptions(next) })
  }

  const ready = dataset !== undefined && definition?.roles.every((role) => !role.required || draft.mapping[role.name])
  const colors = draft.colors.length > 0 ? draft.colors : DEFAULT_PALETTE.slice(0, PALETTE_SIZE)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(draft, { onSuccess: onSaved })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2" noValidate>
      <div className="space-y-4">
        <TextField
          label={t('charts.editor.title')}
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          error={errors.title}
          required
        />
        <TextAreaField
          label={t('charts.editor.description')}
          hint={t('charts.editor.descriptionHint')}
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          error={errors.description}
          rows={3}
          required
        />

        <SelectField
          label={t('charts.editor.dataset')}
          value={draft.datasetId ?? ''}
          onChange={(e) => update({ datasetId: e.target.value === '' ? null : Number(e.target.value), mapping: {} })}
          error={errors.dataset}
          hint={datasets.data.length === 0 ? t('charts.editor.noDataset') : undefined}
          required
        >
          <option value="">{t('charts.editor.choose')}</option>
          {datasets.data.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label={t('charts.editor.type')}
          value={draft.chartType}
          onChange={(e) => changeType(e.target.value as ChartType)}
          hint={t(`charts.types.${draft.chartType}.help`)}
          error={errors.chartType}
        >
          {chartTypes.data.map((d) => (
            <option key={d.name} value={d.name}>
              {t(`charts.types.${d.name}.name`)}
            </option>
          ))}
        </SelectField>

        {dataset && definition && (
          <fieldset className="space-y-3">
            <legend className="font-heading text-lg font-semibold">{t('charts.editor.variables')}</legend>
            {definition.roles.map((role) => {
              const compatible = dataset.variables.filter(
                (v) => role.variableType === null || v.type === role.variableType,
              )
              return (
                <SelectField
                  key={role.name}
                  label={t(`charts.roles.${draft.chartType}.${role.name}`)}
                  value={draft.mapping[role.name] ?? ''}
                  onChange={(e) => update({ mapping: { ...draft.mapping, [role.name]: e.target.value } })}
                  hint={role.variableType ? t(`charts.editor.expects.${role.variableType}`) : undefined}
                  error={errors[`mapping[${role.name}]`]}
                  required={role.required}
                >
                  <option value="">{role.required ? t('charts.editor.choose') : t('charts.editor.none')}</option>
                  {compatible.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.label}
                    </option>
                  ))}
                </SelectField>
              )
            })}
          </fieldset>
        )}

        {definition && definition.options.length > 0 && (
          <fieldset className="space-y-3">
            <legend className="font-heading text-lg font-semibold">{t('charts.editor.options')}</legend>
            {definition.options.map((option) =>
              typeof option.default === 'boolean' ? (
                <label key={option.name} className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-5"
                    checked={draft.options[option.name] === true}
                    onChange={(e) => update({ options: { ...draft.options, [option.name]: e.target.checked } })}
                  />
                  {t(`charts.options.${option.name}`)}
                </label>
              ) : typeof option.default === 'number' ? (
                <TextField
                  key={option.name}
                  type="number"
                  label={t(`charts.options.${option.name}`)}
                  min={option.min}
                  max={option.max}
                  value={Number(draft.options[option.name] ?? option.default)}
                  onChange={(e) => update({ options: { ...draft.options, [option.name]: Number(e.target.value) } })}
                  error={errors[`options[${option.name}]`]}
                />
              ) : (
                <SelectField
                  key={option.name}
                  label={t(`charts.options.${option.name}`)}
                  value={String(draft.options[option.name] ?? option.default)}
                  onChange={(e) => update({ options: { ...draft.options, [option.name]: e.target.value } })}
                >
                  {(option.values ?? []).map((value) => (
                    <option key={String(value)} value={String(value)}>
                      {t(`charts.options.values.${String(value)}`)}
                    </option>
                  ))}
                </SelectField>
              ),
            )}
          </fieldset>
        )}

        <fieldset>
          <legend className="font-heading text-lg font-semibold">{t('charts.editor.colors')}</legend>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {colors.map((color, i) => (
              <label key={i} className="flex items-center gap-1 text-sm">
                <input
                  type="color"
                  value={color}
                  className="h-11 w-11 cursor-pointer rounded border border-black/30"
                  onChange={(e) => update({ colors: colors.map((c, j) => (j === i ? e.target.value : c)) })}
                />
                <span className="sr-only">{t('charts.editor.color', { index: i + 1 })}</span>
              </label>
            ))}
            {draft.colors.length > 0 && (
              <Button variant="secondary" onClick={() => update({ colors: [] })}>
                {t('charts.editor.resetColors')}
              </Button>
            )}
          </div>
          {errors.colors && <p className="text-sm text-red-700">{errors.colors}</p>}
        </fieldset>

        {save.isError && Object.keys(errors).length === 0 && (
          <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>
            {t('charts.editor.save')}
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </div>

      <section aria-label={t('charts.editor.preview')} className="space-y-2">
        <h3 className="font-heading text-lg font-semibold">{t('charts.editor.preview')}</h3>
        {ready ? (
          <ChartFigure
            title={draft.title || t('charts.editor.untitled')}
            description={draft.description}
            datasetId={draft.datasetId}
            chartType={draft.chartType}
            mapping={draft.mapping}
            options={draft.options}
            colors={draft.colors}
          />
        ) : (
          <p className="text-muted">{t('charts.editor.previewHint')}</p>
        )}
      </section>
    </form>
  )
}
