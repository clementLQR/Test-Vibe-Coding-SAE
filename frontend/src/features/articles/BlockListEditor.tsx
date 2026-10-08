import { useTranslation } from 'react-i18next'
import { Alert, Button } from '../../components/ui'
import type { BlockType } from '../../lib/api/types'
import { newBlockKey } from './blockDraft'
import { BlockEditor, type EditorBlock } from './BlockEditor'

const BLOCK_TYPES: BlockType[] = ['heading', 'text', 'image', 'visualization']

interface BlockListEditorProps {
  blocks: EditorBlock[]
  onChange: (blocks: EditorBlock[]) => void
  errors: Record<string, string>
  chartsAllowed: boolean
  /** Explains why charts are unavailable (shown when they are not allowed). */
  chartsHint?: string
}

/** Ordered list of blocks: add, edit, move (keyboard friendly) and remove. Shared by articles and pages. */
export function BlockListEditor({ blocks, onChange, errors, chartsAllowed, chartsHint }: BlockListEditorProps) {
  const { t } = useTranslation()

  const addBlock = (type: BlockType) => {
    const block: EditorBlock = { key: newBlockKey(), type, headingLevel: 2, text: '', media: null, visualization: null }
    onChange([...blocks, block])
    requestAnimationFrame(() => document.getElementById(`block-${block.key}-title`)?.focus())
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    const next = [...blocks]
    const [moved] = next.splice(index, 1)
    next.splice(index + direction, 0, moved)
    onChange(next)
    // Keep the keyboard focus on the moved block
    requestAnimationFrame(() => document.getElementById(`block-${moved.key}-${direction < 0 ? 'up' : 'down'}`)?.focus())
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">{t('articles.blocks')}</h2>
      {errors.blocks && <Alert>{errors.blocks}</Alert>}
      {blocks.length === 0 && <p className="text-muted">{t('articles.noBlocks')}</p>}
      <ol className="space-y-4">
        {blocks.map((block, index) => (
          <li key={block.key}>
            <BlockEditor
              block={block}
              index={index}
              count={blocks.length}
              errors={errors}
              onChange={(change) => onChange(blocks.map((b, i) => (i === index ? { ...b, ...change } : b)))}
              onMove={(direction) => moveBlock(index, direction)}
              onRemove={() => onChange(blocks.filter((_, i) => i !== index))}
            />
          </li>
        ))}
      </ol>

      <fieldset className="space-y-2">
        <legend className="font-medium">{t('articles.addBlock')}</legend>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((type) => (
            <Button
              key={type}
              variant="secondary"
              onClick={() => addBlock(type)}
              disabled={type === 'visualization' && !chartsAllowed}
            >
              + {t(`articles.blockTypes.${type}`)}
            </Button>
          ))}
        </div>
        {!chartsAllowed && chartsHint && <p className="text-sm text-muted">{chartsHint}</p>}
      </fieldset>
    </div>
  )
}
