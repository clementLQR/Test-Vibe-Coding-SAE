import { Fragment, type ReactNode } from 'react'

/**
 * Restricted Markdown for text blocks: paragraphs, line breaks, "- " lists,
 * **bold**, *italic* and [links](https://...). Output is React elements only
 * (never raw HTML), so author text cannot inject markup or scripts.
 */
export function renderMarkdown(source: string): ReactNode {
  const blocks = source
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n{2,}/)

  return blocks.map((block, i) => {
    const lines = block.split('\n')
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      return (
        <ul key={i} className="list-disc space-y-1 pl-6">
          {lines.map((line, j) => (
            <li key={j}>{inline(line.replace(/^\s*[-*]\s+/, ''))}</li>
          ))}
        </ul>
      )
    }
    return (
      <p key={i}>
        {lines.map((line, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {inline(line)}
          </Fragment>
        ))}
      </p>
    )
  })
}

const TOKEN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g

function safeHref(url: string): string | null {
  return /^(https?:\/\/|mailto:|\/(?!\/))/i.test(url) ? url : null
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0
    if (index > last) nodes.push(text.slice(last, index))
    const [whole, bold, italic, label, url] = match
    if (bold !== undefined) {
      nodes.push(<strong key={index}>{inline(bold)}</strong>)
    } else if (italic !== undefined) {
      nodes.push(<em key={index}>{inline(italic)}</em>)
    } else {
      const href = safeHref(url)
      const external = href !== null && /^https?:/i.test(href)
      nodes.push(
        href === null ? (
          whole
        ) : (
          <a
            key={index}
            href={href}
            className="text-accent underline"
            {...(external ? { rel: 'noopener noreferrer' } : {})}
          >
            {label}
          </a>
        ),
      )
    }
    last = index + whole.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}
