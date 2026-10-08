import type { ReactNode } from 'react'
import type { RouteObject } from 'react-router'
import { PublicLayout } from '../components/PublicLayout'
import { AdminHomePage } from '../features/admin/AdminHomePage'
import { ArticleEditorPage } from '../features/articles/ArticleEditorPage'
import { ArticlesPage } from '../features/articles/ArticlesPage'
import { ChartsPage } from '../features/charts/ChartsPage'
import { AdminLayout } from '../features/admin/AdminLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { RequireRole } from '../features/auth/RequireRole'
import { MEDIA_ROLES, STAFF_ROLES } from '../features/auth/useAuth'
import { DatasetDetailPage } from '../features/datasets/DatasetDetailPage'
import { DatasetsPage } from '../features/datasets/DatasetsPage'
import { HomePage } from '../features/home/HomePage'
import { MapAdminPage } from '../features/modules/MapAdminPage'
import { MapPage } from '../features/modules/MapPage'
import { ProgramAdminPage } from '../features/modules/ProgramAdminPage'
import { ProgramPage } from '../features/modules/ProgramPage'
import { TicketsAdminPage } from '../features/modules/TicketsAdminPage'
import { TicketsPage } from '../features/modules/TicketsPage'
import { PageEditorPage } from '../features/pages/PageEditorPage'
import { PagesPage } from '../features/pages/PagesPage'
import { ArticlePage } from '../features/public/ArticlePage'
import { ArticlesListPage } from '../features/public/ArticlesListPage'
import { PagePage } from '../features/public/PagePage'
import { ThemesPage } from '../features/themes/ThemesPage'
import type { Role } from '../lib/api/types'
import { InstallerPage } from '../features/install/InstallerPage'
import { InstallGate, INSTALLER_PATH } from '../features/install/InstallGate'
import { MediaPage } from '../features/media/MediaPage'
import { UsersPage } from '../features/users/UsersPage'
import { NotFoundPage } from './NotFoundPage'

const forRoles = (roles: Role[], page: ReactNode) => <RequireRole roles={roles}>{page}</RequireRole>
const forAuthors = (page: ReactNode) => forRoles(['ROLE_AUTHOR'], page)

export const routes: RouteObject[] = [
  {
    element: <InstallGate />,
    children: [
      { path: INSTALLER_PATH, element: <InstallerPage /> },
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'articles', element: <ArticlesListPage /> },
          { path: 'articles/:slug', element: <ArticlePage /> },
          { path: 'pages/:slug', element: <PagePage /> },
          { path: 'programme', element: <ProgramPage /> },
          { path: 'plan', element: <MapPage /> },
          { path: 'billetterie', element: <TicketsPage /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          {
            path: 'admin-app',
            element: (
              <RequireRole roles={STAFF_ROLES}>
                <AdminLayout />
              </RequireRole>
            ),
            children: [
              { index: true, element: <AdminHomePage /> },
              { path: 'articles', element: forAuthors(<ArticlesPage />) },
              { path: 'articles/new', element: forAuthors(<ArticleEditorPage />) },
              { path: 'articles/:id', element: forAuthors(<ArticleEditorPage />) },
              { path: 'charts', element: forAuthors(<ChartsPage />) },
              { path: 'pages', element: forRoles(['ROLE_EDITOR'], <PagesPage />) },
              { path: 'pages/new', element: forRoles(['ROLE_EDITOR'], <PageEditorPage />) },
              { path: 'pages/:id', element: forRoles(['ROLE_EDITOR'], <PageEditorPage />) },
              { path: 'themes', element: forRoles(['ROLE_DESIGNER'], <ThemesPage />) },
              { path: 'program', element: forRoles(['ROLE_EDITOR'], <ProgramAdminPage />) },
              { path: 'map', element: forRoles(['ROLE_EDITOR'], <MapAdminPage />) },
              { path: 'tickets', element: forRoles(['ROLE_EDITOR'], <TicketsAdminPage />) },
              {
                path: 'datasets',
                element: (
                  <RequireRole roles={['ROLE_DATA_PROVIDER', 'ROLE_AUTHOR']}>
                    <DatasetsPage />
                  </RequireRole>
                ),
              },
              {
                path: 'datasets/:id',
                element: (
                  <RequireRole roles={['ROLE_DATA_PROVIDER', 'ROLE_AUTHOR']}>
                    <DatasetDetailPage />
                  </RequireRole>
                ),
              },
              {
                path: 'media',
                element: (
                  <RequireRole roles={MEDIA_ROLES}>
                    <MediaPage />
                  </RequireRole>
                ),
              },
              {
                path: 'users',
                element: (
                  <RequireRole roles={['ROLE_ADMIN']}>
                    <UsersPage />
                  </RequireRole>
                ),
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
