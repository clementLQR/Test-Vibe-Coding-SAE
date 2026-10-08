import { describe, expect, it } from 'vitest'
import en from './en/common.json'
import fr from './fr/common.json'

/** Dotted keys of a translation tree; plural suffixes are folded so "x_one" and "x_other" count as "x". */
function keys(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix + key.replace(/_(zero|one|other)$/, '')
    return value !== null && typeof value === 'object' ? keys(value as object, `${path}.`) : [path]
  })
}

describe('translations', () => {
  it('have the same keys in French and English', () => {
    const frKeys = new Set(keys(fr))
    const enKeys = new Set(keys(en))

    expect([...frKeys].filter((k) => !enKeys.has(k))).toEqual([])
    expect([...enKeys].filter((k) => !frKeys.has(k))).toEqual([])
  })

  it('have no empty text', () => {
    const empty = (tree: object): string[] =>
      Object.entries(tree).flatMap(([key, value]) =>
        typeof value === 'object' ? empty(value as object).map((k) => `${key}.${k}`) : value === '' ? [key] : [],
      )

    expect([...empty(fr), ...empty(en)]).toEqual([])
  })
})
