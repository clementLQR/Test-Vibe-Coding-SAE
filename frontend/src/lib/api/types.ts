/** Shapes of the Symfony API responses. */

import type { Locale } from '../i18n'
import type { ThemeTokens } from '../theme'

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

export type DatasetStatus = 'pending' | 'validated'
export type VariableType = 'categorical' | 'numerical'

export interface DatasetVariable {
  id: number
  columnIndex: number
  /** Column header in the CSV: stable reference used by charts. */
  name: string
  label: string
  type: VariableType
  detectedType: VariableType
}

export interface Dataset {
  id: number
  name: string
  description: string | null
  sourceType: 'file' | 'url'
  sourceUrl: string | null
  delimiter: string
  status: DatasetStatus
  rowCount: number | null
  providerId: number | null
  providerName: string | null
  variables: DatasetVariable[]
  createdAt: string
  validatedAt: string | null
}

export interface ColumnStats {
  filled: number
  empty: number
  distinct: number
  numeric: number
  min: number | null
  max: number | null
  mean: number | null
  examples: string[]
}

/** GET /api/datasets/{id}/preview */
export interface DatasetPreview {
  rowCount: number
  columns: { index: number; name: string; detectedType: VariableType; stats: ColumnStats }[]
  rows: string[][]
}

/** GET /api/datasets/{id}/data: rows in variable order, numbers for numerical variables. */
export interface DatasetData {
  variables: { name: string; label: string; type: VariableType }[]
  rows: (string | number | null)[][]
}

/** GET /api/chart-types: roles accept a variable type (null = any). */
export interface ChartTypeDefinition {
  name: ChartType
  roles: { name: string; variableType: VariableType | null; required: boolean }[]
  options: {
    name: string
    default: string | number | boolean
    values?: (string | boolean)[]
    min?: number
    max?: number
  }[]
}

export type ChartType = 'bar' | 'line' | 'pie' | 'histogram' | 'scatter' | 'heatmap' | 'treemap'

export type ChartOptions = Record<string, string | number | boolean>

export interface Visualization {
  id: number
  title: string
  description: string
  chartType: ChartType
  /** IRI of the data set, e.g. "/api/datasets/3" */
  dataset: string
  datasetId: number
  /** chart role => variable name (CSV column) */
  mapping: Record<string, string>
  colors: string[]
  options: ChartOptions
  createdById: number | null
  createdAt: string
  updatedAt: string
}

export type ArticleType = 'classic' | 'dashboard'
export type ArticleStatus = 'draft' | 'published' | 'hidden'
export type BlockType = 'heading' | 'text' | 'image' | 'visualization'

export interface Block {
  id: number
  position: number
  type: BlockType
  headingLevel: number | null
  /** Heading text, Markdown text, or image caption */
  text: string | null
  media: Media | null
  visualization: Visualization | null
}

export interface Article {
  id: number
  title: string
  slug: string
  summary: string
  type: ArticleType
  status: ArticleStatus
  locale: Locale
  authorId: number | null
  authorName: string | null
  blocks: Block[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  /** Shared by the language versions of the same article */
  translationKey: string | null
}

/** GET /api/articles/by-slug/{slug}: the article and its published versions in other languages. */
export interface PublicArticle extends Article {
  translations: { locale: Locale; slug: string; title: string }[]
}

/** Block as sent to POST/PUT /api/articles: blocks with an id are updated in place. */
export interface BlockInput {
  id?: number
  type: BlockType
  headingLevel?: number
  text?: string
  mediaId?: number
  visualizationId?: number
}

export interface ArticleInput {
  title: string
  summary: string
  type: ArticleType
  status: ArticleStatus
  locale: Locale
  blocks: BlockInput[]
  /** Id of the same article in the other language (omitted: unchanged) */
  translationOfId?: number
}

export type PageTemplate = 'blank' | 'contact'

export interface Page {
  id: number
  title: string
  slug: string
  template: PageTemplate
  status: ArticleStatus
  showInMenu: boolean
  menuOrder: number
  locale: Locale
  blocks: Block[]
  updatedAt: string
}

export interface PageInput {
  title: string
  template: PageTemplate
  status: ArticleStatus
  showInMenu: boolean
  menuOrder: number
  locale: Locale
  blocks: BlockInput[]
}

export interface MenuItem {
  title: string
  slug: string
}

export type ThemeScope = 'site' | 'page' | 'article'
export type ThemeStatus = 'proposed' | 'active' | 'rejected' | 'archived'

export interface Theme {
  id: number
  name: string
  scope: ThemeScope
  /** IRIs of the target */
  page: string | null
  article: string | null
  pageId: number | null
  articleId: number | null
  targetTitle: string | null
  tokens: ThemeTokens
  status: ThemeStatus
  proposedById: number | null
  proposedByName: string | null
  reviewComment: string | null
  updatedAt: string
}

export interface Venue {
  id: number
  name: string
  description: string | null
  color: string
  position: number
}

/** Times are the event's local time "YYYY-MM-DDTHH:MM" (no time zone). */
export interface ProgramSlot {
  id: number
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  venue: Pick<Venue, 'id' | 'name' | 'color'> | null
  speakers: string | null
  category: string | null
  locale: Locale
}

/** [lat, lng] on a real map, [y, x] on an image plan. */
export type MapPosition = [number, number]

export interface MapItem {
  id: number
  label: string
  description: string | null
  kind: 'point' | 'zone'
  coordinates: MapPosition[]
  color: string
  venue: Pick<Venue, 'id' | 'name' | 'color'> | null
}

export interface MapConfig {
  mode: 'osm' | 'image'
  centerLat: number
  centerLng: number
  zoom: number
  background: { mediaId: number; url: string; width: number; height: number; altFr: string; altEn: string } | null
}

export type TicketAvailability = 'available' | 'soon' | 'sold_out'

export interface TicketOffer {
  id: number
  name: string
  description: string | null
  priceCents: number
  currency: string
  externalUrl: string | null
  availability: TicketAvailability
  position: number
  locale: Locale
}
