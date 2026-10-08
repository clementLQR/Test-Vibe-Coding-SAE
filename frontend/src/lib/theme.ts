/**
 * Theme tokens (see backend App\Theme\ThemeTokens) and their CSS variables.
 * A theme is a partial set of tokens; unset tokens keep the base design.
 */

export interface ThemeTokens {
  headerBg?: string
  headerFg?: string
  pageBg?: string
  pageFg?: string
  accent?: string
  accentFg?: string
  titleColor?: string
  blockBg?: string
  blockFg?: string
  /** rem, 1.5 to 3.5 */
  titleSize?: number
  /** rem, 0 to 2 */
  blockRadius?: number
  /** px, 14 to 20 */
  fontSizeBase?: number
  fontBody?: FontName
  fontHeading?: FontName
  chartPalette?: string[]
}

export type FontName = 'system' | 'serif' | 'rounded' | 'mono'

/** Local font stacks only: nothing is downloaded (eco-design). */
export const FONT_STACKS: Record<FontName, string> = {
  system: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif",
  rounded: "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, 'Arial Rounded MT Bold', sans-serif",
  mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
}

/** Values of the base design (src/index.css), used for previews and contrast checks. */
export const BASE_TOKENS: Required<Omit<ThemeTokens, 'chartPalette'>> = {
  headerBg: '#111111',
  headerFg: '#ffffff',
  pageBg: '#ffffff',
  pageFg: '#1a1a1a',
  accent: '#1d4ed8',
  accentFg: '#ffffff',
  titleColor: '#1a1a1a',
  blockBg: '#f5f5f5',
  blockFg: '#1a1a1a',
  titleSize: 2.25,
  blockRadius: 0.5,
  fontSizeBase: 16,
  fontBody: 'system',
  fontHeading: 'system',
}

export const COLOR_TOKENS = [
  'headerBg',
  'headerFg',
  'pageBg',
  'pageFg',
  'accent',
  'accentFg',
  'titleColor',
  'blockBg',
  'blockFg',
] as const

/** CSS custom properties of a set of tokens (only the tokens that are set). */
export function tokensToCssVariables(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {}
  const set = (name: string, value: string | undefined) => {
    if (value !== undefined) vars[`--ev-${name}`] = value
  }
  set('header-bg', tokens.headerBg)
  set('header-fg', tokens.headerFg)
  set('page-bg', tokens.pageBg)
  set('page-fg', tokens.pageFg)
  set('accent', tokens.accent)
  set('accent-fg', tokens.accentFg)
  set('title-color', tokens.titleColor)
  set('block-bg', tokens.blockBg)
  set('block-fg', tokens.blockFg)
  set('title-size', tokens.titleSize === undefined ? undefined : `${tokens.titleSize}rem`)
  set('block-radius', tokens.blockRadius === undefined ? undefined : `${tokens.blockRadius}rem`)
  set('font-size-base', tokens.fontSizeBase === undefined ? undefined : `${tokens.fontSizeBase}px`)
  set('font-body', tokens.fontBody && FONT_STACKS[tokens.fontBody])
  set('font-heading', tokens.fontHeading && FONT_STACKS[tokens.fontHeading])
  return vars
}

export interface ActiveTheme {
  scope: 'site' | 'page' | 'article'
  pageId: number | null
  articleId: number | null
  tokens: ThemeTokens
}

/** Cascade: article > page > site. */
export function resolveTheme(themes: ActiveTheme[], target: { pageId?: number; articleId?: number }): ThemeTokens {
  const site = themes.find((t) => t.scope === 'site')
  const page =
    target.pageId === undefined ? undefined : themes.find((t) => t.scope === 'page' && t.pageId === target.pageId)
  const article =
    target.articleId === undefined
      ? undefined
      : themes.find((t) => t.scope === 'article' && t.articleId === target.articleId)
  return { ...site?.tokens, ...page?.tokens, ...article?.tokens }
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 contrast ratio between two "#rrggbb" colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Text / background pairs checked against WCAG AA (4.5:1). */
export const CONTRAST_PAIRS = [
  ['headerFg', 'headerBg'],
  ['pageFg', 'pageBg'],
  ['titleColor', 'pageBg'],
  ['blockFg', 'blockBg'],
  ['accentFg', 'accent'],
  ['accent', 'pageBg'],
] as const

export const AA_RATIO = 4.5

/** Pairs below AA once the theme is applied on top of the base design. */
export function contrastProblems(tokens: ThemeTokens): { fg: string; bg: string; ratio: number }[] {
  const full = { ...BASE_TOKENS, ...tokens }
  return CONTRAST_PAIRS.map(([fg, bg]) => ({ fg, bg, ratio: contrastRatio(full[fg], full[bg]) })).filter(
    (pair) => pair.ratio < AA_RATIO,
  )
}
