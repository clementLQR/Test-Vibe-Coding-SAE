import type { RouteObject } from 'react-router'
import { PublicLayout } from '../components/PublicLayout'
import { AdminHomePage } from '../features/admin/AdminHomePage'
import { HomePage } from '../features/home/HomePage'
import { NotFoundPage } from './NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'admin-app', element: <AdminHomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
