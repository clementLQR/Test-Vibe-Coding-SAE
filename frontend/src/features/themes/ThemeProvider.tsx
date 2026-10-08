import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { resolveTheme, tokensToCssVariables } from '../../lib/theme'
import { ChartPaletteContext, ThemeTargetSetterContext, useActiveThemes, type ThemeTarget } from './themeContext'

/**
 * Applies the active theme (site, then page, then article) as CSS variables on <html>,
 * so the header and the whole page follow it. Disabled in the admin, which keeps the base design.
 */
export function ThemeProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const themes = useActiveThemes()
  const [target, setTarget] = useState<ThemeTarget>({})
  const tokens = useMemo(
    () => (enabled && themes.data ? resolveTheme(themes.data, target) : {}),
    [enabled, themes.data, target],
  )

  useEffect(() => {
    const style = document.documentElement.style
    const variables = tokensToCssVariables(tokens)
    for (const [name, value] of Object.entries(variables)) style.setProperty(name, value)
    return () => {
      for (const name of Object.keys(variables)) style.removeProperty(name)
    }
  }, [tokens])

  return (
    <ThemeTargetSetterContext value={setTarget}>
      <ChartPaletteContext value={tokens.chartPalette}>{children}</ChartPaletteContext>
    </ThemeTargetSetterContext>
  )
}
