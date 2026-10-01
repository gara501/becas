import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import { GeoJSON, MapContainer, useMap, ZoomControl } from 'react-leaflet'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-50m.json'
import { DESCONOCIDO, fechaCorta } from '../data/catalogo.js'
import { GEOCODIGOS } from '../data/catalogo.js'

const COUNTRY_POINTS = new Map(GEOCODIGOS.filter((place) => place.nivel === 'pais').map((place) => [place.pais_destino, [Number(place.latitud), Number(place.longitud)]]))
const INITIAL_CENTER = [18, 4]
const INITIAL_ZOOM = 2
function splitDateLineRing(ring) {
  const pieces = [[ring[0]]]
  for (let i = 1; i < ring.length; i += 1) {
    const previous = ring[i - 1]
    const next = ring[i]
    if (Math.abs(next[0] - previous[0]) > 180) {
      const side = previous[0] > 0 ? 180 : -180
      const latitude = (previous[1] + next[1]) / 2
      pieces[pieces.length - 1].push([side, latitude])
      pieces.push([[-side, latitude], next])
    } else {
      pieces[pieces.length - 1].push(next)
    }
  }
  if (pieces.length === 1) return pieces
  pieces[0] = [...pieces[pieces.length - 1].slice(0, -1), ...pieces[0]]
  pieces.pop()
  return pieces.map((piece) => [...piece, piece[0]])
}

function prepareWorld() {
  const source = feature(world, world.objects.countries)
  return {
    ...source,
    features: source.features.filter((country) => country.properties.name !== 'Antarctica').map((country) => {
      if (!['Russia', 'Fiji'].includes(country.properties.name)) return country
      const polygons = country.geometry.type === 'Polygon' ? [country.geometry.coordinates] : country.geometry.coordinates
      const split = polygons.flatMap((polygon) => splitDateLineRing(polygon[0]).map((ring) => [ring]))
      return { ...country, geometry: { type: 'MultiPolygon', coordinates: split } }
    }),
  }
}
const WORLD = prepareWorld()
const MAP_NAMES = {
  Alemania: 'Germany', Australia: 'Australia', Canadá: 'Canada', Chile: 'Chile', China: 'China', Colombia: 'Colombia',
  'Corea del Sur': 'South Korea', España: 'Spain', 'Estados Unidos': 'United States of America', Francia: 'France',
  India: 'India', Japón: 'Japan', México: 'Mexico', 'Países Bajos': 'Netherlands', 'Reino Unido': 'United Kingdom',
  Singapur: 'Singapore', Suecia: 'Sweden',
}

function bubbleIcon(count, kind = 'country') {
  return L.divIcon({
    className: `atlas-marker atlas-marker-${kind}`,
    html: `<span>${count}</span>`,
    iconSize: kind === 'country' ? [48, 48] : [32, 32],
    iconAnchor: kind === 'country' ? [24, 24] : [16, 16],
  })
}

function clusterIcon(cluster) {
  const count = cluster.getAllChildMarkers().reduce((sum, marker) => sum + (marker.options.scholarshipCount || 1), 0)
  return L.divIcon({ className: 'atlas-cluster', html: `<span>${count}</span>`, iconSize: [58, 58], iconAnchor: [29, 29] })
}

function popupContent(item, estado, onDetails) {
  const wrap = document.createElement('div')
  wrap.className = 'atlas-popup'
  const eyebrow = document.createElement('div')
  eyebrow.className = 'popup-eyebrow'
  eyebrow.textContent = `${item.pais_destino} / ${estado.etiqueta.toUpperCase()}`
  const heading = document.createElement('h3')
  heading.textContent = item.nombre
  const description = document.createElement('p')
  description.textContent = `${item.nivel} · ${item.entidad_oferente}`
  const cover = document.createElement('p')
  cover.className = 'popup-cover'
  cover.textContent = item.cobertura === DESCONOCIDO ? 'Cobertura por verificar' : item.cobertura.replaceAll(';', ' · ')
  const date = document.createElement('div')
  date.className = 'popup-date'
  date.textContent = `Cierre: ${fechaCorta(item.fecha_cierre)}`
  const link = document.createElement('a')
  link.href = item.url_oficial
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = 'VER CONVOCATORIA OFICIAL ↗'
  const verified = document.createElement('p')
  verified.textContent = `Verificada: ${fechaCorta(item.fecha_ultima_verificacion)}`
  wrap.append(eyebrow, heading, description, cover, date, verified)
  if (estado.pendiente) { const warning = document.createElement('p'); warning.className = 'popup-warning'; warning.textContent = 'Revisión pendiente: confirma el plazo en la fuente oficial.'; wrap.append(warning) }
  const details = document.createElement('button')
  details.type = 'button'
  details.className = 'popup-details'
  details.textContent = 'VER FICHA COMPLETA'
  details.addEventListener('click', () => onDetails(item, details))
  wrap.append(details, link)
  return wrap
}

function MapSizeSync() {
  const map = useMap()
  useEffect(() => {
    const element = map.getContainer()
    const observer = new ResizeObserver(() => { if (element.offsetWidth && element.offsetHeight) map.invalidateSize({ pan: false }) })
    observer.observe(element)
    return () => observer.disconnect()
  }, [map])
  return null
}

function MapContent({ items, selectedCountry, selectedId, onCountrySelect, onScholarshipSelect, onDetails, estadoDe }) {
  const map = useMap()
  const layers = useRef(null)
  const markers = useRef(new Map())

  useEffect(() => {
    const point = COUNTRY_POINTS.get(selectedCountry)
    if (point) {
      const zoom = selectedCountry === 'Singapur' ? 10 : selectedCountry === 'Países Bajos' ? 6 : 5
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.setView(point, zoom, { animate: false })
      else map.flyTo(point, zoom, { duration: 0.7 })
    } else {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.setView(INITIAL_CENTER, INITIAL_ZOOM, { animate: false })
      else map.flyTo(INITIAL_CENTER, INITIAL_ZOOM, { duration: 0.7 })
    }
  }, [map, selectedCountry])

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 55,
      iconCreateFunction: clusterIcon,
    })
    const nextMarkers = new Map()
    if (selectedCountry) {
      for (const item of items) {
        if (item.latitud === DESCONOCIDO || item.longitud === DESCONOCIDO) continue
        const marker = L.marker([Number(item.latitud), Number(item.longitud)], {
          icon: bubbleIcon('•', 'scholarship'), scholarshipCount: 1, title: item.nombre,
        })
        marker.bindPopup(popupContent(item, estadoDe(item), onDetails), { maxWidth: 310, minWidth: 255, autoPanPadding: [24, 24] })
        marker.on('click', () => onScholarshipSelect(item.id))
        group.addLayer(marker)
        nextMarkers.set(item.id, marker)
      }
    } else {
      const countryCounts = new Map()
      for (const item of items) {
        if (item.pais_destino === 'Varios') continue
        countryCounts.set(item.pais_destino, (countryCounts.get(item.pais_destino) || 0) + 1)
      }
      for (const [country, count] of countryCounts) {
        const point = COUNTRY_POINTS.get(country)
        if (!point) continue
        const marker = L.marker(point, { icon: bubbleIcon(count), scholarshipCount: count, title: `${country}: ${count} becas` })
        marker.bindTooltip(`${country} · ${count} ${count === 1 ? 'beca' : 'becas'}`, { direction: 'top', offset: [0, -18] })
        marker.on('click', () => onCountrySelect(country))
        group.addLayer(marker)
      }
    }
    group.addTo(map)
    layers.current = group
    markers.current = nextMarkers
    return () => {
      map.removeLayer(group)
      layers.current = null
      markers.current = new Map()
    }
  }, [map, items, selectedCountry, onCountrySelect, onScholarshipSelect, onDetails, estadoDe])

  useEffect(() => {
    if (!selectedId || !selectedCountry || !layers.current) return
    const marker = markers.current.get(selectedId)
    if (marker) layers.current.zoomToShowLayer(marker, () => marker.openPopup())
  }, [selectedId, selectedCountry, items])

  return null
}

export default function MapView({ items, selectedCountry, selectedId, onCountrySelect, onScholarshipSelect, onDetails, estadoDe }) {
  const offMapCount = useMemo(() => items.filter((item) => item.latitud === DESCONOCIDO).length, [items])
  const mapCounts = useMemo(() => {
    const counts = new Map()
    for (const item of items) {
      const name = MAP_NAMES[item.pais_destino]
      if (name) counts.set(name, (counts.get(name) || 0) + 1)
    }
    return counts
  }, [items])
  const countryStyle = (shape) => {
    const count = mapCounts.get(shape.properties.name) || 0
    return { color: '#91a492', weight: 0.8, fillColor: count >= 5 ? '#aec6ac' : count >= 2 ? '#c4d4be' : count ? '#d5dfca' : '#f4f1e7', fillOpacity: 1, interactive: false }
  }
  return (
    <div className="map-shell">
      <MapContainer center={INITIAL_CENTER} zoom={INITIAL_ZOOM} minZoom={2} maxZoom={10} zoomControl={false} scrollWheelZoom={false} className="map-canvas" preferCanvas>
        <MapSizeSync />
        <GeoJSON data={WORLD} style={countryStyle} attribution={'Límites: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · Coordenadas: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'} />
        <ZoomControl position="bottomright" />
        <MapContent items={items} selectedCountry={selectedCountry} selectedId={selectedId} onCountrySelect={onCountrySelect} onScholarshipSelect={onScholarshipSelect} onDetails={onDetails} estadoDe={estadoDe} />
      </MapContainer>
      {items.length === 0 ? <div className="map-empty" role="status">Sin becas para estos filtros. Ajusta la búsqueda para ver destinos.</div> : null}
      <div className="map-topbar"><span className="map-live-dot" /> {selectedCountry ? `VISTA · ${selectedCountry.toUpperCase()}` : 'VISTA MUNDIAL · PAÍSES'}</div>
      {offMapCount > 0 ? <div className="map-unplaced">{offMapCount} {offMapCount === 1 ? 'beca sin punto único' : 'becas sin punto único'} · visibles en la lista</div> : null}
      <div className="map-legend" aria-label="Leyenda del mapa">
        <span><i className="legend-one" /> 1 beca</span>
        <span><i className="legend-mid" /> 2–4</span>
        <span><i className="legend-high" /> 5 o más</span>
        <span><i className="legend-cluster" /> Grupo</span>
      </div>
    </div>
  )
}
