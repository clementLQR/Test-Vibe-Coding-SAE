import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { Alert, Button, Loading, SelectField, TextField } from '../../components/ui'
import { errorMessageOf, fieldErrorsOf } from '../../lib/api/client'
import { isLocale } from '../../lib/i18n'
import type { ArticleStatus, Locale, Page, PageTemplate } from '../../lib/api/types'
import { ArticleView } from '../articles/ArticleView'
import type { EditorBlock } from '../articles/BlockEditor'
import { BlockListEditor } from '../articles/BlockListEditor'
import { toBlockInputs, toEditorBlocks, withServerIds } from '../articles/blockDraft'
import { useDeletePage, usePage, useSavePage } from './usePages'

interface Draft {
  title: string
  template: PageTemplate
  status: ArticleStatus
  showInMenu: boolean
  menuOrder: number
  locale: Locale
  blocks: EditorBlock[]
}

/** /admin-app/pages/new and /admin-app/pages/:id */
export function PageEditorPage() {
  const { t } = useTranslation()
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const page = usePage(id)

  if (id !== null && page.isPending) return <Loading label={t('common.loading')} />
  if (page.isError) return <Alert>{errorMessageOf(page.error, t('common.error'))}</Alert>
  return <PageEditor key={page.data?.id ?? 'new'} page={page.data ?? null} />
}

function PageEditor({ page }: { page: Page | null }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const save = useSavePage(page?.id ?? null)
  const remove = useDeletePage()
  const [preview, setPreview] = useState(false)
  const [draft, setDraft] = useState<Draft>(
    page
      ? { ...page, blocks: toEditorBlocks(page.blocks) }
      : {
          title: '',
          template: 'blank',
          status: 'draft',
          showInMenu: true,
          menuOrder: 0,
          locale: isLocale(i18n.language) ? i18n.language : 'fr',
          blocks: [],
        },
  )
  const errors = fieldErrorsOf(save.error)
  const update = (change: Partial<Draft>) => setDraft((current) => ({ ...current, ...change }))

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const { title, template, status, showInMenu, menuOrder, locale } = draft
    save.mutate(
      { title, template, status, showInMenu, menuOrder, locale, blocks: toBlockInputs(draft.blocks) },
      {
        onSuccess: (saved) => {
          if (!page) void navigate(`/admin-app/pages/${saved.id}`, { replace: true })
          else setDraft((current) => ({ ...current, blocks: withServerIds(current.blocks, saved.blocks) }))
        },
      },
    )
  }

  const onDelete = () => {
    if (page && window.confirm(t('pages.confirmDelete', { title: page.title }))) {
      remove.mutate(page.id, { onSuccess: () => void navigate('/admin-app/pages') })
    }
  }

  return (
    <section className="space-y-6">
      <Link to="/admin-app/pages" className="text-accent underline">
        {t('pages.back')}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{page ? t('pages.edit') : t('pages.new')}</h1>
        <Button variant="secondary" onClick={() => setPreview(!preview)} aria-pressed={preview}>
          {t('articles.preview')}
        </Button>
      </div>

      {preview ? (
        <ArticleView article={{ title: draft.title, summary: '', blocks: draft.blocks }} />
      ) : (
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <TextField
            label={t('articles.title')}
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            error={errors.title}
            required
          />
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label={t('pages.template')}
              value={draft.template}
              onChange={(e) => update({ template: e.target.value as PageTemplate })}
              hint={t(`pages.templates.${draft.template}.help`)}
            >
              {(['blank', 'contact'] as const).map((template) => (
                <option key={template} value={template}>
                  {t(`pages.templates.${template}.name`)}
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
          <div className="flex flex-wrap items-end gap-6">
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                className="size-5"
                checked={draft.showInMenu}
                onChange={(e) => update({ showInMenu: e.target.checked })}
              />
              {t('pages.showInMenu')}
            </label>
            <TextField
              label={t('pages.menuOrder')}
              type="number"
              min={0}
              max={999}
              value={draft.menuOrder}
              onChange={(e) => update({ menuOrder: Number(e.target.value) })}
              error={errors.menuOrder}
              className="w-32"
            />
          </div>

          <BlockListEditor
            blocks={draft.blocks}
            onChange={(blocks) => update({ blocks })}
            errors={errors}
            chartsAllowed
          />

          {save.isError && Object.keys(errors).length === 0 && (
            <Alert>{errorMessageOf(save.error, t('common.error'))}</Alert>
          )}
          {Object.keys(errors).length > 0 && <Alert>{t('articles.fixErrors')}</Alert>}
          {save.isSuccess && <Alert tone="success">{t('pages.saved')}</Alert>}
          {remove.isError && <Alert>{errorMessageOf(remove.error, t('common.error'))}</Alert>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending}>
              {t('common.save')}
            </Button>
            {page && (
              <Button variant="danger" onClick={onDelete} disabled={remove.isPending}>
                {t('pages.delete')}
              </Button>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
