import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLocale } from '../../lib/i18n'
import type { MapConfig, MapItem, MapPosition, ProgramSlot, TicketOffer } from '../../lib/api/types'
import { installedSite, jsonResponse, userWith } from '../../test/mockApi'
import { renderRoute } from '../../test/renderWithProviders'

// Leaflet cannot run in jsdom: a stand-in exposes a button that simulates a click on the map
vi.mock('./LeafletMap', () => ({
  default: ({ label, onPick }: { label: string; onPick?: (p: MapPosition) => void }) => (
    <section aria-label={label}>
      {onPick && (
        <button type="button" onClick={() => onPick([47.123456789, 0.5])}>
          pick
        </button>
      )}
    </section>
  ),
}))

const STAGE = { id: 1, name: 'Grande scène', color: '#14213d' }
const SLOTS: ProgramSlot[] = [
  {
    id: 10,
    title: 'Ouverture',
    description: null,
    startsAt: '2027-07-09T20:30',
    endsAt: '2027-07-09T22:00',
    venue: STAGE,
    speakers: 'Fanfare',
    category: 'Concert',
    locale: 'fr',
  },
  {
    id: 11,
    title: 'Atelier',
    description: null,
    startsAt: '2027-07-10T14:00',
    endsAt: '2027-07-10T15:00',
    venue: { id: 2, name: 'Chapiteau', color: '#fca311' },
    speakers: null,
    category: 'Atelier',
    locale: 'fr',
  },
  {
    id: 12,
    title: 'Nuit électro',
    description: null,
    startsAt: '2027-07-10T23:00',
    endsAt: '2027-07-11T02:00',
    venue: STAGE,
    speakers: null,
    category: 'Concert',
    locale: 'fr',
  },
]
const CONFIG: MapConfig = { mode: 'osm', centerLat: 47.39, centerLng: 0.68, zoom: 15, background: null }

describe('event modules', () => {
  beforeEach(() => {
    changeLocale('fr')
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows the program by day in local event time, filtered by the venue of the URL', async () => {
    installedSite(null, { 'GET /api/program_slots': SLOTS })
    renderRoute('/programme?venue=1')

    expect(await screen.findByRole('heading', { level: 2, name: 'vendredi 9 juillet' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'samedi 10 juillet' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Atelier' })).not.toBeInTheDocument()
    expect(screen.getByText('2 créneaux')).toBeInTheDocument()
    const night = screen.getByRole('heading', { name: 'Nuit électro' }).closest('article') as HTMLElement
    expect(night).toHaveTextContent('23:00 – 02:00 (le lendemain)')
  })

  it('keeps favourites in the browser', async () => {
    installedSite(null, { 'GET /api/program_slots': SLOTS })
    const { unmount } = renderRoute('/programme')

    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter « Atelier » à mes favoris' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Seulement mes favoris (1)' }))
    expect(screen.getByText('1 créneau')).toBeInTheDocument()
    unmount()

    renderRoute('/programme')
    expect(await screen.findByRole('button', { name: 'Retirer « Atelier » de mes favoris' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('lists ticket offers with local prices and external purchase links', async () => {
    const offers: TicketOffer[] = [
      {
        id: 1,
        name: 'Pass 3 jours',
        description: null,
        priceCents: 11900,
        currency: 'EUR',
        externalUrl: 'https://tickets.example.org',
        availability: 'available',
        position: 0,
        locale: 'fr',
      },
      {
        id: 2,
        name: 'Billet 1 jour',
        description: null,
        priceCents: 4900,
        currency: 'EUR',
        externalUrl: 'https://tickets.example.org/1',
        availability: 'sold_out',
        position: 1,
        locale: 'fr',
      },
    ]
    installedSite(null, { 'GET /api/ticket_offers': offers })
    renderRoute('/billetterie')

    expect(await screen.findByText(/^119,00\s€$/)).toBeInTheDocument()
    const buy = screen.getByRole('link', { name: /Acheter : Pass 3 jours/ })
    expect(buy).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: /Billet 1 jour/ })).not.toBeInTheDocument()
    expect(screen.getByText('Complet')).toBeInTheDocument()
  })

  it('gives a text version of the map, linked to the program', async () => {
    const items: MapItem[] = [
      {
        id: 1,
        label: 'Grande scène',
        description: 'Face au lac',
        kind: 'point',
        coordinates: [[47.39, 0.68]],
        color: '#14213d',
        venue: STAGE,
      },
    ]
    installedSite(null, { 'GET /api/map-config': CONFIG, 'GET /api/map_items': items })
    renderRoute('/plan')

    expect(await screen.findByRole('region', { name: 'Plan du site' })).toBeInTheDocument()
    const list = screen.getByRole('region', { name: 'Lieux et services' })
    expect(within(list).getByText('Face au lac')).toBeInTheDocument()
    expect(within(list).getByRole('link', { name: 'Programme : Grande scène' })).toHaveAttribute(
      'href',
      '/programme?venue=1',
    )
  })

  it('lets an editor place a point by clicking or typing', async () => {
    let sent: Record<string, unknown> | undefined
    installedSite(userWith(['ROLE_EDITOR', 'ROLE_AUTHOR']), {
      'GET /api/map-config': CONFIG,
      'GET /api/map_items': [],
      'GET /api/venues': [STAGE],
      'POST /api/map_items': (init: RequestInit | undefined) => {
        sent = JSON.parse(String(init?.body)) as Record<string, unknown>
        return jsonResponse({}, 201)
      },
    })
    renderRoute('/admin-app/map')

    await userEvent.click(await screen.findByRole('button', { name: 'Nouveau point' }))
    const editor = within((await screen.findByRole('heading', { level: 2, name: 'Nouveau point' })).closest('form')!)
    await userEvent.click(editor.getByRole('button', { name: 'pick' }))
    const longitude = editor.getByLabelText('Longitude')
    await userEvent.clear(longitude)
    await userEvent.type(longitude, '0.6849')
    await userEvent.type(editor.getByLabelText('Nom'), 'Infirmerie')
    await userEvent.selectOptions(editor.getByLabelText('Lieu'), 'Grande scène')
    await userEvent.click(editor.getByRole('button', { name: 'Enregistrer' }))

    await vi.waitFor(() => expect(sent).toBeDefined())
    expect(sent).toMatchObject({
      label: 'Infirmerie',
      kind: 'point',
      coordinates: [[47.123457, 0.6849]],
      venue: '/api/venues/1',
    })
  })
})
