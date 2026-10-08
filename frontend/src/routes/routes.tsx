import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import type { RouteObject } from 'react-router'
import { PublicLayout } from '../components/PublicLayout'
import { PageLoading } from '../components/PageLoading'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { RequireRole } from '../features/auth/RequireRole'
import { MEDIA_ROLES, STAFF_ROLES } from '../features/auth/useAuth'
import { HomePage } from '../features/home/HomePage'
import { InstallGate, INSTALLER_PATH } from '../features/install/InstallGate'
import { ArticlePage } from '../features/public/ArticlePage'
import { ArticlesListPage } from '../features/public/ArticlesListPage'
import { PagePage } from '../features/public/PagePage'
import type { Role } from '../lib/api/types'
import { NotFoundPage } from './NotFoundPage'

/**
 * Code splitting (eco-design): the public pages visitors read most are in the main bundle;
 * the installer, the event modules and the whole admin are downloaded only when opened.
 */
function lazyNamed<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((module) => ({ default: module[name] })))
}

const InstallerPage = lazyNamed(() => import('../features/install/InstallerPage'), 'InstallerPage')
const ProgramPage = lazyNamed(() => import('../features/modules/ProgramPage'), 'ProgramPage')
const MapPage = lazyNamed(() => import('../features/modules/MapPage'), 'MapPage')
const TicketsPage = lazyNamed(() => import('../features/modules/TicketsPage'), 'TicketsPage')
const AdminLayout = lazyNamed(() => import('../features/admin/AdminLayout'), 'AdminLayout')
const AdminHomePage = lazyNamed(() => import('../features/admin/AdminHomePage'), 'AdminHomePage')
const ArticlesPage = lazyNamed(() => import('../features/articles/ArticlesPage'), 'ArticlesPage')
const ArticleEditorPage = lazyNamed(() => import('../features/articles/ArticleEditorPage'), 'ArticleEditorPage')
const ChartsPage = lazyNamed(() => import('../features/charts/ChartsPage'), 'ChartsPage')
const PagesPage = lazyNamed(() => import('../features/pages/PagesPage'), 'PagesPage')
const PageEditorPage = lazyNamed(() => import('../features/pages/PageEditorPage'), 'PageEditorPage')
const ThemesPage = lazyNamed(() => import('../features/themes/ThemesPage'), 'ThemesPage')
const ProgramAdminPage = lazyNamed(() => import('../features/modules/ProgramAdminPage'), 'ProgramAdminPage')
const MapAdminPage = lazyNamed(() => import('../features/modules/MapAdminPage'), 'MapAdminPage')
const TicketsAdminPage = lazyNamed(() => import('../features/modules/TicketsAdminPage'), 'TicketsAdminPage')
const DatasetsPage = lazyNamed(() => import('../features/datasets/DatasetsPage'), 'DatasetsPage')
const DatasetDetailPage = lazyNamed(() => import('../features/datasets/DatasetDetailPage'), 'DatasetDetailPage')
const MediaPage = lazyNamed(() => import('../features/media/MediaPage'), 'MediaPage')
const UsersPage = lazyNamed(() => import('../features/users/UsersPage'), 'UsersPage')

const page = (node: ReactNode) => <Suspense fallback={<PageLoading />}>{node}</Suspense>
const forRoles = (roles: Role[], node: ReactNode) => <RequireRole roles={roles}>{page(node)}</RequireRole>

export const routes: RouteObject[] = [
  {
    element: <InstallGate />,
    children: [
      { path: INSTALLER_PATH, element: page(<InstallerPage />) },
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'articles', element: <ArticlesListPage /> },
          { path: 'articles/:slug', element: <ArticlePage /> },
          { path: 'pages/:slug', element: <PagePage /> },
          { path: 'programme', element: page(<ProgramPage />) },
          { path: 'plan', element: page(<MapPage />) },
          { path: 'billetterie', element: page(<TicketsPage />) },
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          {
            path: 'admin-app',
            element: forRoles(STAFF_ROLES, <AdminLayout />),
            children: [
              { index: true, element: page(<AdminHomePage />) },
              { path: 'articles', element: forRoles(['ROLE_AUTHOR'], <ArticlesPage />) },
              { path: 'articles/new', element: forRoles(['ROLE_AUTHOR'], <ArticleEditorPage />) },
              { path: 'articles/:id', element: forRoles(['ROLE_AUTHOR'], <ArticleEditorPage />) },
              { path: 'charts', element: forRoles(['ROLE_AUTHOR'], <ChartsPage />) },
              { path: 'pages', element: forRoles(['ROLE_EDITOR'], <PagesPage />) },
              { path: 'pages/new', element: forRoles(['ROLE_EDITOR'], <PageEditorPage />) },
              { path: 'pages/:id', element: forRoles(['ROLE_EDITOR'], <PageEditorPage />) },
              { path: 'themes', element: forRoles(['ROLE_DESIGNER'], <ThemesPage />) },
              { path: 'program', element: forRoles(['ROLE_EDITOR'], <ProgramAdminPage />) },
              { path: 'map', element: forRoles(['ROLE_EDITOR'], <MapAdminPage />) },
              { path: 'tickets', element: forRoles(['ROLE_EDITOR'], <TicketsAdminPage />) },
              { path: 'datasets', element: forRoles(['ROLE_DATA_PROVIDER', 'ROLE_AUTHOR'], <DatasetsPage />) },
              { path: 'datasets/:id', element: forRoles(['ROLE_DATA_PROVIDER', 'ROLE_AUTHOR'], <DatasetDetailPage />) },
              { path: 'media', element: forRoles(MEDIA_ROLES, <MediaPage />) },
              { path: 'users', element: forRoles(['ROLE_ADMIN'], <UsersPage />) },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
