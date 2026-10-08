import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useArticles } from '../articles/useArticles'
import { hasAnyRole, useCurrentUser } from '../auth/useAuth'
import { useDatasets } from '../datasets/useDatasets'
import { usePages } from '../pages/usePages'
import { useThemes } from '../themes/useThemes'

/** Admin home: what is waiting for me, depending on my roles. */
export function AdminHomePage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  const roles = user?.roles.filter((role) => role !== 'ROLE_SUBSCRIBER') ?? []

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">{t('admin.title')}</h1>
      <p>{t('admin.welcome', { name: user?.displayName ?? '' })}</p>
      <p>
        {t('admin.yourRoles')} {roles.map((role) => t(`roles.${role}`)).join(', ')}
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {hasAnyRole(user, ['ROLE_AUTHOR']) && <DraftsCard userId={user?.id ?? 0} />}
        {hasAnyRole(user, ['ROLE_DATA_PROVIDER']) && <PendingDatasetsCard />}
        {hasAnyRole(user, ['ROLE_DESIGNER']) && <ProposedThemesCard />}
        {hasAnyRole(user, ['ROLE_EDITOR']) && <PagesCard />}
      </ul>
    </section>
  )
}

function Card({ to, title, value }: { to: string; title: string; value: string }) {
  return (
    <li>
      <Link to={to} className="block h-full rounded-block bg-block p-4 text-block-ink hover:underline">
        <span className="block font-heading text-lg font-semibold">{title}</span>
        <span className="block text-sm">{value}</span>
      </Link>
    </li>
  )
}

function DraftsCard({ userId }: { userId: number }) {
  const { t } = useTranslation()
  const articles = useArticles()
  const drafts = articles.data?.filter((a) => a.status === 'draft' && a.authorId === userId).length
  return (
    <Card
      to="/admin-app/articles"
      title={t('admin.nav.articles')}
      value={drafts === undefined ? '…' : t('admin.cards.drafts', { count: drafts })}
    />
  )
}

function PendingDatasetsCard() {
  const { t } = useTranslation()
  const datasets = useDatasets()
  const pending = datasets.data?.filter((d) => d.status === 'pending').length
  return (
    <Card
      to="/admin-app/datasets"
      title={t('admin.nav.datasets')}
      value={pending === undefined ? '…' : t('admin.cards.pendingDatasets', { count: pending })}
    />
  )
}

function ProposedThemesCard() {
  const { t } = useTranslation()
  const themes = useThemes()
  const proposed = themes.data?.filter((theme) => theme.status === 'proposed').length
  return (
    <Card
      to="/admin-app/themes"
      title={t('admin.nav.themes')}
      value={proposed === undefined ? '…' : t('admin.cards.proposedThemes', { count: proposed })}
    />
  )
}

function PagesCard() {
  const { t } = useTranslation()
  const pages = usePages()
  return (
    <Card
      to="/admin-app/pages"
      title={t('admin.nav.pages')}
      value={pages.data === undefined ? '…' : t('admin.cards.pages', { count: pages.data.length })}
    />
  )
}
