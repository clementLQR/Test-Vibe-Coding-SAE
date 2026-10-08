import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

function html(source: string): string {
  return render(<div>{renderMarkdown(source)}</div>).container.innerHTML
}

describe('renderMarkdown', () => {
  it('renders paragraphs, line breaks, bold, italic and lists', () => {
    expect(html('Une **belle** *édition*.\nSuite\n\n- un\n- deux')).toBe(
      '<div><p>Une <strong>belle</strong> <em>édition</em>.<br>Suite</p><ul class="list-disc space-y-1 pl-6"><li>un</li><li>deux</li></ul></div>',
    )
  })

  it('renders safe links only', () => {
    expect(html('[Programme](/programme) et [site](https://example.org)')).toContain('<a href="/programme"')
    expect(html('[site](https://example.org)')).toContain('rel="noopener noreferrer"')
    expect(html('[piège](javascript:alert(1))')).not.toContain('<a')
    expect(html('[piège](//evil.example)')).not.toContain('<a')
  })

  it('never interprets HTML', () => {
    const output = html('<img src=x onerror=alert(1)> <script>alert(1)</script>')

    expect(output).not.toContain('<img')
    expect(output).not.toContain('<script')
    expect(output).toContain('&lt;img')
  })
})
