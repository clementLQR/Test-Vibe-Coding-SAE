/** Shapes of the Symfony API responses. */

import type { Locale } from '../i18n'

export type { Locale }

export type Role =
  'ROLE_SUBSCRIBER' | 'ROLE_AUTHOR' | 'ROLE_EDITOR' | 'ROLE_DESIGNER' | 'ROLE_DATA_PROVIDER' | 'ROLE_ADMIN'

/** Roles an administrator can grant (subscriber is implicit). */
export const ASSIGNABLE_ROLES: Role[] = [
  'ROLE_AUTHOR',
  'ROLE_EDITOR',
  'ROLE_DESIGNER',
  'ROLE_DATA_PROVIDER',
  'ROLE_ADMIN',
]

export interface Collection<T> {
  items: T[]
  total: number
}

/** GET /api/health */
export interface HealthResponse {
  status: 'ok'
  version: string
}

/** Current user (GET /api/me). `roles` are effective roles: the hierarchy is already expanded. */
export interface CurrentUser {
  id: number
  email: string
  displayName: string
  locale: Locale
  roles: Role[]
}

export interface MeResponse {
  user: CurrentUser | null
}

/** Item of GET /api/users (admin). `roles` are the assigned roles plus ROLE_SUBSCRIBER. */
export interface UserSummary {
  id: number
  email: string
  displayName: string
  locale: Locale
  roles: Role[]
  createdAt: string
}

export interface InstallStatus {
  installed: boolean
}

export interface SiteSettings {
  siteName: string
  tagline: string | null
  eventStart: string | null
  eventEnd: string | null
  location: string | null
  defaultLocale: Locale
}

export interface Media {
  id: number
  originalName: string
  mimeType: string
  size: number
  width: number
  height: number
  altFr: string
  altEn: string
  altComplete: boolean
  uploadedByName: string | null
  createdAt: string
  url: string
  thumbnailUrl: string
}
