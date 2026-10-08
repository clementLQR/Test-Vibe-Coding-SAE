import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { MapConfig, MapItem, MapPosition } from '../../lib/api/types'

export interface LeafletMapProps {
  config: MapConfig
  items: MapItem[]
  /** Accessible name of the map region. */
  label: string
  /** Shape being drawn in the editor, shown dashed. */
  draft?: { kind: MapItem['kind']; coordinates: MapPosition[]; color: string }
  /** Click on the map (editor): [lat, lng] or [y, x] on an image plan. */
  onPick?: (position: MapPosition) => void
}

function popupContent(item: MapItem): HTMLElement {
  // Built with text nodes only: labels typed by editors are never interpreted as HTML
  const box = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = item.label
  box.append(title)
  for (const text of [item.description, item.venue?.name]) {
    if (!text) continue
    const line = document.createElement('p')
    line.textContent = text
    box.append(line)
  }
  return box
}

function drawItem(item: Pick<MapItem, 'kind' | 'coordinates' | 'color'>, dashed = false): L.Layer {
  const style = { color: item.color, weight: 3, dashArray: dashed ? '6 6' : undefined }
  if (item.kind === 'point' || item.coordinates.length < 3) {
    return L.layerGroup(
      item.coordinates.map((position) =>
        L.circleMarker(position, { ...style, radius: 10, fillColor: item.color, fillOpacity: 0.8 }),
      ),
    )
  }
  return L.polygon(item.coordinates, { ...style, fillColor: item.color, fillOpacity: 0.25 })
}

/**
 * Interactive map: OpenStreetMap tiles around the event, or the venue plan image
 * (simple pixel coordinates). Loaded on demand (eco-design: only on map pages).
 */
export default function LeafletMap({ config, items, label, draft, onPick }: LeafletMapProps) {
  const container = useRef<HTMLElement>(null)
  const itemsLayer = useRef(L.layerGroup())
  const draftLayer = useRef(L.layerGroup())
  const pickRef = useRef(onPick)
  useEffect(() => {
    pickRef.current = onPick
  })

  // Background: rebuilt when the configuration changes
  useEffect(() => {
    const element = container.current
    if (!element) return
    const background = config.background
    const map =
      config.mode === 'image' && background
        ? L.map(element, { crs: L.CRS.Simple, minZoom: -3, attributionControl: false })
        : L.map(element).setView([config.centerLat, config.centerLng], config.zoom)

    if (config.mode === 'image' && background) {
      const bounds: L.LatLngBoundsExpression = [
        [0, 0],
        [background.height, background.width],
      ]
      L.imageOverlay(background.url, bounds, { alt: background.altFr }).addTo(map)
      map.fitBounds(bounds)
    } else {
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
    }
    itemsLayer.current.addTo(map)
    draftLayer.current.addTo(map)
    map.on('click', (event: L.LeafletMouseEvent) => pickRef.current?.([event.latlng.lat, event.latlng.lng]))

    return () => {
      map.remove()
    }
  }, [config])

  useEffect(() => {
    const layer = itemsLayer.current
    layer.clearLayers()
    for (const item of items) {
      const shape = drawItem(item)
      if (shape instanceof L.LayerGroup) shape.eachLayer((l) => (l as L.CircleMarker).bindPopup(popupContent(item)))
      else (shape as L.Polygon).bindPopup(popupContent(item))
      layer.addLayer(shape)
    }
  }, [items])

  useEffect(() => {
    const layer = draftLayer.current
    layer.clearLayers()
    if (draft && draft.coordinates.length > 0) layer.addLayer(drawItem(draft, true))
  }, [draft])

  return (
    <section
      ref={container}
      aria-label={label}
      className={`h-[60vh] min-h-80 w-full rounded-block border border-black/15 ${onPick ? 'cursor-crosshair' : ''}`}
    />
  )
}
