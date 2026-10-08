import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '../../components/Dialog'
import { Alert, Button, Loading, TextAreaField } from '../../components/ui'
import { errorMessageOf } from '../../lib/api/client'
import type { Theme, ThemeStatus } from '../../lib/api/types'
import { hasAnyRole, useCurrentUser } from '../auth/useAuth'
import { ThemeEditor } from './ThemeEditor'
import { ThemePreview } from './ThemePreview'
import { useReviewTheme, useThemes } from './useThemes'

const STATUS_STYLES: Record<ThemeStatus, string> = {
  proposed: 'border-amber-800 bg-amber-50 text-amber-900',
  active: 'border-green-800 bg-green-50 text-green-900',
  rejected: 'border-red-800 bg-red-50 text-red-900',
  archived: 'border-black/40 bg-black/5 text-ink',
}

/** Designers propose themes; administrators approve (apply) or reject them. */
export function ThemesPage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const themes = useThemes()
  const review = useReviewTheme()
  const [editing, setEditing] = useState<Theme | 'new' | null>(null)
  const [rejecting, setRejecting] = useState<Theme | null>(null)
  const [comment, setComment] = useState('')
  const isAdmin = hasAnyRole(user, ['ROLE_ADMIN'])
  const reviewError = review.approve.error ?? review.reject.error ?? review.remove.error

  const canEdit = (theme: Theme) =>
    isAdmin || (theme.proposedById === user?.id && (theme.status === 'proposed' || theme.status === 'rejected'))

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">{t('admin.nav.themes')}</h1>
        <Button onClick={() => setEditing('new')}>{t('themes.new')}</Button>
      </div>
      <p>{isAdmin ? t('themes.introAdmin') : t('themes.introDesigner')}</p>

      {themes.isPending && <Loading label={t('common.loading')} />}
      {themes.isError && <Alert>{errorMessageOf(themes.error, t('common.error'))}</Alert>}
      {reviewError && <Alert>{errorMessageOf(reviewError, t('common.error'))}</Alert>}
      {themes.isSuccess && themes.data.length === 0 && <p>{t('themes.empty')}</p>}

      {themes.isSuccess && themes.data.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {themes.data.map((theme) => (
            <li key={theme.id} className="space-y-3 rounded-block border border-black/15 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold">{theme.name}</h2>
                <span className={`rounded border px-2 py-0.5 text-sm font-medium ${STATUS_STYLES[theme.status]}`}>
                  {t(`themes.statuses.${theme.status}`)}
                </span>
              </div>
              <p className="text-sm text-muted">
                {t(`themes.scopes.${theme.scope}`)}
                {theme.targetTitle && ` · ${theme.targetTitle}`} · {theme.proposedByName ?? '—'}
              </p>
              {theme.reviewComment && (
                <p className="text-sm">
                  <span className="font-semibold">{t('themes.reviewComment')}</span> {theme.reviewComment}
                </p>
              )}
              <ThemePreview tokens={theme.tokens} />
              <div className="flex flex-wrap gap-2">
                {isAdmin && theme.status !== 'active' && (
                  <Button onClick={() => review.approve.mutate(theme.id)} disabled={review.approve.isPending}>
                    {t('themes.approve')}
                  </Button>
                )}
                {isAdmin && theme.status !== 'rejected' && (
                  <Button variant="secondary" onClick={() => setRejecting(theme)}>
                    {theme.status === 'active' ? t('themes.withdraw') : t('themes.reject')}
                  </Button>
                )}
                {canEdit(theme) && (
                  <Button variant="secondary" onClick={() => setEditing(theme)}>
                    {t('media.edit')}
                  </Button>
                )}
                {canEdit(theme) && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(t('themes.confirmDelete', { name: theme.name })))
                        review.remove.mutate(theme.id)
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        title={editing === 'new' ? t('themes.new') : t('themes.edit')}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <ThemeEditor
            key={editing === 'new' ? 'new' : editing.id}
            theme={editing === 'new' ? undefined : editing}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>

      <Dialog open={rejecting !== null} title={t('themes.rejectTitle')} onClose={() => setRejecting(null)}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!rejecting) return
            review.reject.mutate(
              { id: rejecting.id, comment },
              {
                onSuccess: () => {
                  setRejecting(null)
                  setComment('')
                },
              },
            )
          }}
        >
          <TextAreaField
            label={t('themes.reviewComment')}
            hint={t('themes.reviewHint')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" disabled={review.reject.isPending}>
            {t('themes.reject')}
          </Button>
        </form>
      </Dialog>
    </section>
  )
}
