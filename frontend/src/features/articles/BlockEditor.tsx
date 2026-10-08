import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '../../components/Dialog'
import { Button, SelectField, TextAreaField, TextField } from '../../components/ui'
import type { BlockType, Media, Visualization } from '../../lib/api/types'
import { useVisualizations } from '../charts/useVisualizations'
import { VisualizationEditor } from '../charts/VisualizationEditor'
import { MediaLibrary } from '../media/MediaLibrary'

/** Block being edited; `key` is local, `id` exists once the block is saved. */
export interface EditorBlock {
  key: string
  id?: number
  type: BlockType
  headingLevel: number
  text: string
  media: Media | null
  visualization: Visualization | null
}

interface BlockEditorProps {
  block: EditorBlock
  index: number
  count: number
  errors: Record<string, string>
  onChange: (change: Partial<EditorBlock>) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

export function BlockEditor({ block, index, count, errors, onChange, onMove, onRemove }: BlockEditorProps) {
  const { t } = useTranslation()
  const position = index + 1
  const typeName = t(`articles.blockTypes.${block.type}`)
  const error = (field: string) => errors[`blocks[${index}].${field}`]
  const blockError = errors[`blocks[${index}]`]

  return (
    <section
      aria-labelledby={`block-${block.key}-title`}
      className="space-y-3 rounded-block border border-black/15 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`block-${block.key}-title`} className="font-heading font-semibold" tabIndex={-1}>
          {t('articles.blockTitle', { position, type: typeName })}
        </h3>
        <div className="flex flex-wrap gap-1">
          <Button
            id={`block-${block.key}-up`}
            variant="secondary"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={t('articles.moveUp', { position })}
          >
            ↑
          </Button>
          <Button
            id={`block-${block.key}-down`}
            variant="secondary"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            aria-label={t('articles.moveDown', { position })}
          >
            ↓
          </Button>
          <Button variant="danger" onClick={onRemove} aria-label={t('articles.removeBlock', { position })}>
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {blockError && <p className="text-sm text-red-700">{blockError}</p>}

      {block.type === 'heading' && (
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <SelectField
            label={t('articles.headingLevel')}
            value={block.headingLevel}
            onChange={(e) => onChange({ headingLevel: Number(e.target.value) })}
          >
            {[2, 3, 4].map((level) => (
              <option key={level} value={level}>
                {t('articles.level', { level })}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t('articles.headingText')}
            value={block.text}
            onChange={(e) => onChange({ text: e.target.value })}
            error={error('text')}
          />
        </div>
      )}

      {block.type === 'text' && (
        <TextAreaField
          label={t('articles.text')}
          hint={t('articles.markdownHint')}
          rows={6}
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          error={error('text')}
        />
      )}

      {block.type === 'image' && <ImageFields block={block} error={error('mediaId')} onChange={onChange} />}
      {block.type === 'visualization' && (
        <ChartFields block={block} error={error('visualizationId')} onChange={onChange} />
      )}
    </section>
  )
}

function ImageFields({
  block,
  error,
  onChange,
}: {
  block: EditorBlock
  error?: string
  onChange: BlockEditorProps['onChange']
}) {
  const { t, i18n } = useTranslation()
  const [picking, setPicking] = useState(false)

  return (
    <div className="space-y-3">
      {block.media ? (
        <img
          src={block.media.thumbnailUrl}
          alt={i18n.language === 'en' ? block.media.altEn : block.media.altFr}
          className="max-h-48 rounded-block"
        />
      ) : (
        <p className="text-muted">{t('articles.noImage')}</p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button variant="secondary" onClick={() => setPicking(true)}>
        {block.media ? t('articles.changeImage') : t('articles.chooseImage')}
      </Button>
      <TextField
        label={t('articles.caption')}
        hint={t('common.optional')}
        value={block.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />
      <Dialog open={picking} title={t('articles.chooseImage')} onClose={() => setPicking(false)}>
        <MediaLibrary
          onSelect={(media) => {
            onChange({ media })
            setPicking(false)
          }}
        />
      </Dialog>
    </div>
  )
}

function ChartFields({
  block,
  error,
  onChange,
}: {
  block: EditorBlock
  error?: string
  onChange: BlockEditorProps['onChange']
}) {
  const { t } = useTranslation()
  const charts = useVisualizations()
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-3">
      <SelectField
        label={t('articles.chart')}
        value={block.visualization?.id ?? ''}
        error={error}
        onChange={(e) => onChange({ visualization: charts.data?.find((c) => c.id === Number(e.target.value)) ?? null })}
      >
        <option value="">{t('charts.editor.choose')}</option>
        {charts.data?.map((chart) => (
          <option key={chart.id} value={chart.id}>
            {chart.title}
          </option>
        ))}
      </SelectField>
      <Button variant="secondary" onClick={() => setCreating(true)}>
        {t('articles.newChart')}
      </Button>
      <Dialog open={creating} title={t('articles.newChart')} onClose={() => setCreating(false)}>
        <VisualizationEditor
          onCancel={() => setCreating(false)}
          onSaved={(visualization) => {
            onChange({ visualization })
            setCreating(false)
          }}
        />
      </Dialog>
    </div>
  )
}
