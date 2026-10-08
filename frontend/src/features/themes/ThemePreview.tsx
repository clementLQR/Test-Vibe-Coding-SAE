import { useTranslation } from 'react-i18next'
import { tokensToCssVariables, type ThemeTokens } from '../../lib/theme'
import { DEFAULT_PALETTE } from '../charts/buildChart'

/**
 * Miniature of the public site with the theme applied (its CSS variables scoped to this box).
 * Decorative: the settings themselves and the contrast warnings are available as text.
 */
export function ThemePreview({ tokens }: { tokens: ThemeTokens }) {
  const { t } = useTranslation()
  const palette = tokens.chartPalette?.length ? tokens.chartPalette : DEFAULT_PALETTE

  return (
    <div
      style={tokensToCssVariables(tokens)}
      className="overflow-hidden rounded-block border border-black/15 bg-page text-ink"
      aria-hidden="true"
    >
      <div className="bg-header px-4 py-3 font-heading font-bold text-header-ink">{t('themes.sample.site')}</div>
      <div className="space-y-3 p-4 font-body" style={{ fontSize: 'var(--ev-font-size-base)' }}>
        <p className="ev-title font-heading font-bold">{t('themes.sample.title')}</p>
        <p>
          {t('themes.sample.text')} <span className="text-accent underline">{t('themes.sample.link')}</span>
        </p>
        <div className="rounded-block bg-block p-3 text-block-ink">{t('themes.sample.block')}</div>
        <span className="inline-flex rounded bg-accent px-3 py-1 text-accent-ink">{t('themes.sample.button')}</span>
        <div className="flex gap-1" aria-hidden="true">
          {palette.map((color, i) => (
            <span key={i} className="h-6 w-6 rounded" style={{ background: color }} />
          ))}
        </div>
      </div>
    </div>
  )
}
