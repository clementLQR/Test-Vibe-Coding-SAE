import { describe, expect, it } from 'vitest'
import { contrastProblems, contrastRatio, resolveTheme, tokensToCssVariables, type ActiveTheme } from './theme'

describe('theme', () => {
  it('turns tokens into CSS variables, units and font stacks included', () => {
    expect(
      tokensToCssVariables({ headerBg: '#14213d', titleSize: 2.5, fontSizeBase: 18, fontHeading: 'serif' }),
    ).toEqual({
      '--ev-header-bg': '#14213d',
      '--ev-title-size': '2.5rem',
      '--ev-font-size-base': '18px',
      '--ev-font-heading': expect.stringContaining('serif'),
    })
  })

  it('cascades article over page over site', () => {
    const themes: ActiveTheme[] = [
      { scope: 'site', pageId: null, articleId: null, tokens: { pageBg: '#ffffff', accent: '#111111' } },
      { scope: 'article', pageId: null, articleId: 7, tokens: { accent: '#ff0000' } },
      { scope: 'article', pageId: null, articleId: 8, tokens: { pageBg: '#000000' } },
      { scope: 'page', pageId: 3, articleId: null, tokens: { pageBg: '#eeeeee' } },
    ]

    expect(resolveTheme(themes, { articleId: 7 })).toEqual({ pageBg: '#ffffff', accent: '#ff0000' })
    expect(resolveTheme(themes, { pageId: 3 })).toEqual({ pageBg: '#eeeeee', accent: '#111111' })
    expect(resolveTheme(themes, {})).toEqual({ pageBg: '#ffffff', accent: '#111111' })
  })

  it('computes WCAG contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
  })

  it('reports text and background pairs below AA', () => {
    expect(contrastProblems({})).toEqual([])
    expect(contrastProblems({ pageFg: '#999999' }).map((p) => p.fg)).toEqual(['pageFg'])
  })
})
