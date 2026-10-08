import type { Block, BlockInput } from '../../lib/api/types'
import type { EditorBlock } from './BlockEditor'

let nextKey = 0
/** Local key of a block in the editor (stable across moves). */
export const newBlockKey = () => `b${++nextKey}`

/** Server blocks → editable blocks (each gets a local key). */
export function toEditorBlocks(blocks: Block[]): EditorBlock[] {
  return blocks.map((b) => ({
    key: newBlockKey(),
    id: b.id,
    type: b.type,
    headingLevel: b.headingLevel ?? 2,
    text: b.text ?? '',
    media: b.media,
    visualization: b.visualization,
  }))
}

/** Editable blocks → API payload, in display order (blocks with an id are updated in place). */
export function toBlockInputs(blocks: EditorBlock[]): BlockInput[] {
  return blocks.map((b) => ({
    ...(b.id !== undefined ? { id: b.id } : {}),
    type: b.type,
    ...(b.type === 'heading' ? { headingLevel: b.headingLevel, text: b.text } : {}),
    ...(b.type === 'text' ? { text: b.text } : {}),
    ...(b.type === 'image' ? { mediaId: b.media?.id, text: b.text } : {}),
    ...(b.type === 'visualization' ? { visualizationId: b.visualization?.id } : {}),
  }))
}

/** After a save, new blocks receive their server ids so the next save updates them instead of recreating them. */
export function withServerIds(blocks: EditorBlock[], saved: Block[]): EditorBlock[] {
  return blocks.map((block, i) => ({ ...block, id: saved[i]?.id ?? block.id }))
}
