import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { Alert, Button, Loading, SelectField, TextAreaField, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import { isLocale } from '../../lib/i18n'
import type { Article, ArticleInput, ArticleStatus, ArticleType, BlockType, Locale } from '../../lib/api/types'
import { useCurrentUser } from '../auth/useAuth'
import { ArticleView } from './ArticleView'
import { BlockEditor, type EditorBlock } from './BlockEditor'
import { canEditArticle, useArticle, useDeleteArticle, useSaveArticle } from './useArticles'

const BLOCK_TYPES: BlockType[] = ['heading', 'text', 'image', 'visualization']

let nextKey = 0
const newKey = () => `b${++nextKey}`

interface Draft {
  title: string
  summary: string
  type: ArticleType
  status: ArticleStatus
  locale: Locale
  blocks: EditorBlock[]
}

function toDraft(article: Article): Draft {
  return {
    title: article.title,
    summary: article.summary,
    type: article.type,
    status: article.status,
    locale: article.locale,
    blocks: article.blocks.map((b) => ({
      key: newKey(),
      id: b.id,
      type: b.type,
      headingLevel: b.headingLevel ?? 2,
      text: b.text ?? '',
      media: b.media,
      visualization: b.visualization,
    })),
  }
}

function toInput(draft: Draft): ArticleInput {
  return {
    title: draft.title,
    summary: draft.summary,
    type: draft.type,
    status: draft.status,
    locale: draft.locale,
    blocks: draft.blocks.map((b) => ({
      ...(b.id !== undefined ? { id: b.id } : {}),
      type: b.type,
      ...(b.type === 'heading' ? { headingLevel: b.headingLevel, text: b.text } : {}),
      ...(b.type === 'text' ? { text: b.text } : {}),
      ...(b.type === 'image' ? { mediaId: b.media?.id, text: b.text } : {}),
      ...(b.type === 'visualization' ? { visualizationId: b.visualization?.id } : {}),
    })),
  }
}

/** /admin-app/articles/new and /admin-app/articles/:id */
export function ArticleEditorPage() {
  const { t } = useTranslation()
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const article = useArticle(id)
  const { user } = useCurrentUser()

  if (id !== null && article.isPending) return <Loading label={t('common.loading')} />
  if (article.isError) return <Alert>{errorMessageOf(article.error, t('common.error'))}</Alert>
  if (article.data && !canEditArticle(user, article.data)) return <Alert>{t('auth.forbidden')}</Alert>

  // key: switching from "new" to the saved article restarts the editor from the server data
  return <ArticleEditor key={article.data?.id ?? 'new'} article={article.data ?? null} />
}

function ArticleEditor({ article }: { article: Article | null }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const save = useSaveArticle(article?.id ?? null)
  const remove = useDeleteArticle()
  const [preview, setPreview] = useState(false)
  const [draft, setDraft] = useState<Draft>(
    article
      ? toDraft(article)
      : {
          title: '',
          summary: '',
          type: 'classic',
          status: 'draft',
          locale: isLocale(i18n.language) ? i18n.language : 'fr',
          blocks: [],
        },
  )
  const errors = fieldErrorsOf(save.error)
  const update = (change: Partial<Draft>) => setDraft((current) => ({ ...current, ...change }))
  const setBlocks = (blocks: EditorBlock[]) => update({ blocks })

  const addBlock = (type: BlockType) => {
    const block: EditorBlock = { key: newKey(), type, headingLevel: 2, text: '', media: null, visualization: null }
    setBlocks([...draft.blocks, block])
    requestAnimationFrame(() => document.getElementById(`block-${block.key}-title`)?.focus())
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    const blocks = [...draft.blocks]
    const [moved] = blocks.splice(index, 1)
    blocks.splice(index + direction, 0, moved)
    setBlocks(blocks)
    // Keep the keyboard focus on the moved block
    requestAnimationFrame(() => document.getElementById(`block-${moved.key}-${direction < 0 ? 'up' : 'down'}`)?.focus())
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(toInput(draft), {
      onSuccess: (saved) => {
        if (!article) {
          void navigate(`/admin-app/articles/${saved.id}`, { replace: true })
          return
        }
        // New blocks now have server ids: the next save must update them, not recreate them
        setDraft((current) => ({
          ...current,
          blocks: current.blocks.map((block, i) => ({ ...block, id: saved.blocks[i]?.id ?? block.id })),
        }))
      },
    })
  }

  const onDelete = () => {
    if (article && window.confirm(t('articles.confirmDelete', { title: article.title }))) {
      remove.mutate(article.id, { onSuccess: () => void navigate('/admin-app/articles') })
    }
  }

  return (
    <section className="space-y-6">
      <Link to="/admin-app/articles" className="text-accent underline">
        {t('articles.back')}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{article ? t('articles.edit') : t('articles.new')}</h1>
        <Button variant="secondary" onClick={() => setPreview(!preview)} aria-pressed={preview}>
          {t('articles.preview')}
        </Button>
      </div>

      {preview ? (
        <ArticleView
          article={{
            title: draft.title,
            summary: draft.summary,
            blocks: draft.blocks.map((b) => ({ ...b, headingLevel: b.headingLevel, text: b.text })),
          }}
        />
      ) : (
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label={t('articles.type')}
              value={draft.type}
              onChange={(e) => update({ type: e.target.value as ArticleType })}
              hint={t(`articles.types.${draft.type}.help`)}
            >
              {(['classic', 'dashboard'] as const).map((type) => (
                <option key={type} value={type}>
                  {t(`articles.types.${type}.name`)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t('articles.status')}
              value={draft.status}
              onChange={(e) => update({ status: e.target.value as ArticleStatus })}
            >
              {(['draft', 'published', 'hidden'] as const).map((status) => (
                <option key={status} value={status}>
                  {t(`articles.statuses.${status}`)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t('articles.locale')}
              value={draft.locale}
              onChange={(e) => update({ locale: e.target.value as Locale })}
            >
              <option value="fr">{t('language.fr')}</option>
              <option value="en">{t('language.en')}</option>
            </SelectField>
          </div>

          <TextField
            label={t('articles.title')}
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            error={errors.title}
            required
          />
          <TextAreaField
            label={t('articles.summary')}
            rows={3}
            value={draft.summary}
            onChange={(e) => update({ summary: e.target.value })}
            error={errors.summary}
          />

          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">{t('articles.blocks')}</h2>
            {errors.blocks && <Alert>{errors.blocks}</Alert>}
            {draft.blocks.length === 0 && <p className="text-muted">{t('articles.noBlocks')}</p>}
            <ol className="space-y-4">
              {draft.blocks.map((block, index) => (
                <li key={block.key}>
                  <BlockEditor
                    block={block}
                    index={index}
                    count={draft.blocks.length}
                    errors={errors}
                    onChange={(change) =>
                      setBlocks(draft.blocks.map((b, i) => (i === index ? { ...b, ...change } : b)))
                    }
                    onMove={(direction) => moveBlock(index, direction)}
                    onRemove={() => setBlocks(draft.blocks.filter((_, i) => i !== index))}
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
                    disabled={type === 'visualization' && draft.type !== 'dashboard'}
                  >
                    + {t(`articles.blockTypes.${type}`)}
                  </Button>
                ))}
              </div>
              {draft.type !== 'dashboard' && <p className="text-sm text-muted">{t('articles.chartsInDashboards')}</p>}
            </fieldset>
          </div>

          {save.isError && Object.keys(errors).length === 0 && (
            <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>
          )}
          {Object.keys(errors).length > 0 && <Alert>{t('articles.fixErrors')}</Alert>}
          {save.isSuccess && <Alert tone="success">{t('articles.saved')}</Alert>}
          {remove.isError && <Alert>{errorMessageOf(remove.error, t('common.error'))}</Alert>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending}>
              {t('common.save')}
            </Button>
            {article && (
              <Button variant="danger" onClick={onDelete} disabled={remove.isPending}>
                {t('articles.delete')}
              </Button>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
