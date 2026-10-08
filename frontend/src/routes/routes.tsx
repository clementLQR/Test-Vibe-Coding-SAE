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
import { InstallerPage } from '../features/install/InstallerPage'
import { InstallGate, INSTALLER_PATH } from '../features/install/InstallGate'
import { MediaPage } from '../features/media/MediaPage'
import { UsersPage } from '../features/users/UsersPage'
import { NotFoundPage } from './NotFoundPage'

const forAuthors = (page: ReactNode) => <RequireRole roles={['ROLE_AUTHOR']}>{page}</RequireRole>

export const routes: RouteObject[] = [
  {
    element: <InstallGate />,
    children: [
      { path: INSTALLER_PATH, element: <InstallerPage /> },
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
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
