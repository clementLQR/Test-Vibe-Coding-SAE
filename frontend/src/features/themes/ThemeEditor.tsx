import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, SelectField, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import type { Theme, ThemeScope } from '../../lib/api/types'
import {
  BASE_TOKENS,
  COLOR_TOKENS,
  contrastProblems,
  FONT_STACKS,
  type FontName,
  type ThemeTokens,
} from '../../lib/theme'
import { useArticles } from '../articles/useArticles'
import { DEFAULT_PALETTE } from '../charts/buildChart'
import { usePages } from '../pages/usePages'
import { ThemePreview } from './ThemePreview'
import { useSaveTheme, type ThemeDraft } from './useThemes'

const NUMBER_TOKENS = [
  { name: 'titleSize', min: 1.5, max: 3.5, step: 0.25, unit: 'rem' },
  { name: 'blockRadius', min: 0, max: 2, step: 0.25, unit: 'rem' },
  { name: 'fontSizeBase', min: 14, max: 20, step: 1, unit: 'px' },
] as const

interface ThemeEditorProps {
  theme?: Theme
  onSaved: () => void
  onCancel: () => void
}

/**
 * Form of a theme with a live preview. Only the settings the designer changes are stored;
 * the others keep the base design. Contrast problems are reported while editing.
 */
export function ThemeEditor({ theme, onSaved, onCancel }: ThemeEditorProps) {
  const { t } = useTranslation()
  const save = useSaveTheme(theme?.id ?? null)
  const pages = usePages()
  const articles = useArticles()
  const [draft, setDraft] = useState<ThemeDraft>(
    theme
      ? { name: theme.name, scope: theme.scope, pageId: theme.pageId, articleId: theme.articleId, tokens: theme.tokens }
      : { name: '', scope: 'site', pageId: null, articleId: null, tokens: {} },
  )
  const errors = fieldErrorsOf(save.error)
  const problems = contrastProblems(draft.tokens)

  const update = (change: Partial<ThemeDraft>) => setDraft((current) => ({ ...current, ...change }))
  const setToken = <K extends keyof ThemeTokens>(name: K, value: ThemeTokens[K] | undefined) => {
    const tokens = { ...draft.tokens }
    if (value === undefined) delete tokens[name]
    else tokens[name] = value
    update({ tokens })
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(draft, { onSuccess: onSaved })
  }

  const palette = draft.tokens.chartPalette

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_20rem]" noValidate>
      <div className="space-y-5">
        <TextField
          label={t('themes.name')}
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          error={errors.name}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t('themes.scope')}
            value={draft.scope}
            onChange={(e) => update({ scope: e.target.value as ThemeScope })}
          >
            {(['site', 'page', 'article'] as const).map((scope) => (
              <option key={scope} value={scope}>
                {t(`themes.scopes.${scope}`)}
              </option>
            ))}
          </SelectField>
          {draft.scope === 'page' && (
            <SelectField
              label={t('themes.targetPage')}
              value={draft.pageId ?? ''}
              onChange={(e) => update({ pageId: e.target.value === '' ? null : Number(e.target.value) })}
              error={errors.page}
            >
              <option value="">{t('charts.editor.choose')}</option>
              {pages.data?.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </SelectField>
          )}
          {draft.scope === 'article' && (
            <SelectField
              label={t('themes.targetArticle')}
              value={draft.articleId ?? ''}
              onChange={(e) => update({ articleId: e.target.value === '' ? null : Number(e.target.value) })}
              error={errors.article}
            >
              <option value="">{t('charts.editor.choose')}</option>
              {articles.data?.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </SelectField>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="font-heading text-lg font-semibold">{t('themes.colors')}</legend>
          <p className="text-sm text-muted">{t('themes.colorsHint')}</p>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {COLOR_TOKENS.map((name) => {
              const value = draft.tokens[name]
              return (
                <div key={name} className="flex min-h-11 items-center gap-3">
                  <input
                    id={`token-${name}`}
                    type="color"
                    value={value ?? BASE_TOKENS[name]}
                    onChange={(e) => setToken(name, e.target.value)}
                    className="h-11 w-11 shrink-0 cursor-pointer rounded border border-black/30"
                    aria-describedby={
                      [
                        value === undefined ? `token-${name}-default` : '',
                        errors[`tokens[${name}]`] ? `token-${name}-error` : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor={`token-${name}`}>{t(`themes.tokens.${name}`)}</label>
                    {value === undefined && (
                      <span id={`token-${name}-default`} className="block text-xs text-muted">
                        {t('themes.default')}
                      </span>
                    )}
                  </div>
                  {value !== undefined && (
                    <Button
                      variant="secondary"
                      className="min-h-9 px-2 py-1 text-sm"
                      onClick={() => setToken(name, undefined)}
                    >
                      {t('themes.reset')}
                    </Button>
                  )}
                  {errors[`tokens[${name}]`] && (
                    <p id={`token-${name}-error`} className="text-sm text-red-700">
                      {errors[`tokens[${name}]`]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>

        {problems.length > 0 && (
          <Alert tone="info">
            <p className="font-semibold">{t('themes.contrastWarning')}</p>
            <ul className="list-disc pl-5">
              {problems.map((p) => (
                <li key={`${p.fg}-${p.bg}`}>
                  {t('themes.contrastPair', {
                    fg: t(`themes.tokens.${p.fg}`),
                    bg: t(`themes.tokens.${p.bg}`),
                    ratio: p.ratio.toFixed(1),
                  })}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        <fieldset className="space-y-3">
          <legend className="font-heading text-lg font-semibold">{t('themes.typography')}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['fontBody', 'fontHeading'] as const).map((name) => (
              <SelectField
                key={name}
                label={t(`themes.tokens.${name}`)}
                value={draft.tokens[name] ?? ''}
                onChange={(e) => setToken(name, e.target.value === '' ? undefined : (e.target.value as FontName))}
              >
                <option value="">{t('themes.default')}</option>
                {(Object.keys(FONT_STACKS) as FontName[]).map((font) => (
                  <option key={font} value={font}>
                    {t(`themes.fonts.${font}`)}
                  </option>
                ))}
              </SelectField>
            ))}
            {NUMBER_TOKENS.map(({ name, min, max, step, unit }) => (
              <TextField
                key={name}
                type="number"
                label={`${t(`themes.tokens.${name}`)} (${unit})`}
                min={min}
                max={max}
                step={step}
                placeholder={String(BASE_TOKENS[name])}
                value={draft.tokens[name] ?? ''}
                onChange={(e) => setToken(name, e.target.value === '' ? undefined : Number(e.target.value))}
                error={errors[`tokens[${name}]`]}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-heading text-lg font-semibold">{t('themes.tokens.chartPalette')}</legend>
          <p className="text-sm text-muted">{t('themes.paletteHint')}</p>
          <div className="flex flex-wrap items-center gap-2">
            {(palette ?? DEFAULT_PALETTE.slice(0, 6)).map((color, i) => (
              <label key={i}>
                <span className="sr-only">{t('charts.editor.color', { index: i + 1 })}</span>
                <input
                  type="color"
                  value={color}
                  className="h-11 w-11 cursor-pointer rounded border border-black/30"
                  onChange={(e) =>
                    setToken(
                      'chartPalette',
                      (palette ?? DEFAULT_PALETTE.slice(0, 6)).map((c, j) => (j === i ? e.target.value : c)),
                    )
                  }
                />
              </label>
            ))}
            {palette && (
              <Button variant="secondary" onClick={() => setToken('chartPalette', undefined)}>
                {t('themes.reset')}
              </Button>
            )}
          </div>
        </fieldset>

        {save.isError && Object.keys(errors).length === 0 && (
          <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>
        )}
        {Object.keys(errors).length > 0 && <Alert>{t('articles.fixErrors')}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>
            {t('themes.submit')}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>

      <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
        <h3 className="font-heading text-lg font-semibold">{t('themes.preview')}</h3>
        <ThemePreview tokens={draft.tokens} />
      </div>
    </form>
  )
}
