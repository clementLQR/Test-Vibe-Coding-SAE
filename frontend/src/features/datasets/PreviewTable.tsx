import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { DatasetPreview } from '../../lib/api/types'

/** First rows of the CSV as an accessible table, scrollable on small screens. */
export function PreviewTable({ preview }: { preview: DatasetPreview }) {
  const { t } = useTranslation()
  const captionId = useId()

  return (
    // A scrollable region must be focusable so keyboard users can scroll it (axe: scrollable-region-focusable)
    <section
      aria-labelledby={captionId}
      tabIndex={0}
      className="max-h-[32rem] overflow-auto rounded-block border border-black/15"
    >
      <table className="min-w-full border-collapse text-sm">
        <caption id={captionId} className="p-2 text-left font-medium">
          {t('datasets.preview.caption', { shown: preview.rows.length, total: preview.rowCount })}
        </caption>
        <thead className="sticky top-0 bg-block text-block-ink">
          <tr>
            {preview.columns.map((column) => (
              <th
                key={column.index}
                scope="col"
                className="border-b border-black/15 px-3 py-2 text-left whitespace-nowrap"
              >
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="odd:bg-black/[0.03]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-1.5 whitespace-nowrap">
                  {cell === '' ? <span className="text-muted">{t('datasets.preview.empty')}</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
