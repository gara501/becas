import { useCallback, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Compass, ExternalLink, Globe2, Info, MapPinned, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import FilterPanel from './components/FilterPanel.jsx'
import MapView from './components/MapView.jsx'
import ScholarshipCard from './components/ScholarshipCard.jsx'
import { BECAS, CORTE, DESCONOCIDO, PENDIENTES_REVISION, ULTIMA_CONSULTA, filtrarBecas, fechaCorta, resumenPais } from './data/catalogo.js'

const DEFAULT_FILTERS = { busqueda: '', pais: 'todos', nivel: 'todos', area: 'todas', cobertura: 'todas', estado: 'todos', mes: 'todos' }
const EXCLUSIONES = [
  { name: 'Australia Awards', reason: 'Colombia no figura entre los países participantes.', url: 'https://www.dfat.gov.au/people-to-people/australia-awards/participating-countries' },
  { name: 'GREAT Scholarships 2026/27', reason: 'La lista de países de esta edición no incluye Colombia.', url: 'https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships' },
  { name: 'Study in Canada Scholarships 2026/27', reason: 'EduCanada no incluye a Colombia en la lista de nacionalidades elegibles.', url: 'https://www.educanada.ca/scholarships-bourses/can/institutions/study-in-canada-sep-etudes-au-canada-pct.aspx?lang=eng' },
  { name: 'Utrecht Excellence Scholarships', reason: 'No acepta nuevas solicitudes desde el ciclo 2026/27.', url: 'https://www.uu.nl/en/bachelors/utrecht-excellence-scholarships' },
]

function Header() {
  return (
    <header className="site-header">
      <div className="page-container header-inner">
        <NavLink to="/" className="brand" aria-label="Atlas de Becas, inicio"><span className="brand-mark"><Compass size={22} strokeWidth={1.9} /></span><span>ATLAS<span className="brand-slash">/</span>BECAS<small>COLOMBIA · MUNDO</small></span></NavLink>
        <nav className="site-nav" aria-label="Navegación principal">
          <NavLink end to="/">Explorar</NavLink>
          <NavLink to="/fuentes">Fuentes</NavLink>
          <NavLink to="/metodo">Método</NavLink>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer"><div className="page-container footer-inner">
      <span>ATLAS/BECAS <b>·</b> Una guía de oportunidades verificadas para Colombia.</span>
      <span>Corte de datos: {fechaCorta(CORTE)} <b>·</b> Límites © Natural Earth · coordenadas © OpenStreetMap</span>
    </div></footer>
  )
}

function AtlasPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState(null)
  const filtered = useMemo(() => filtrarBecas(BECAS, filters), [filters])
  const selectedCountry = filters.pais === 'todos' ? null : filters.pais
  const countrySummary = useMemo(() => resumenPais(BECAS).filter(([country]) => country !== 'Varios'), [])
  const activeCount = Object.entries(filters).filter(([key, value]) => value !== DEFAULT_FILTERS[key]).length
  const openTotal = BECAS.filter((item) => item.estado_convocatoria === 'abierta').length
  const changeFilters = useCallback((updater) => { setFilters(updater); setSelectedId(null) }, [])
  const resetFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setSelectedId(null) }, [])
  const chooseCountry = useCallback((country) => {
    setFilters((current) => ({ ...current, pais: country }))
    setSelectedId(null)
  }, [])
  const locateScholarship = useCallback((item) => {
    setFilters((current) => ({ ...current, pais: item.pais_destino }))
    setSelectedId(item.id)
    if (window.innerWidth < 900) document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <>
      <section className="hero"><div className="page-container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> UNA RUTA HACIA MÁS POSIBILIDADES <span className="edition">ED. 01 / 2026</span></div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }}>El mundo como <em>próxima aula.</em></motion.h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>Becas y apoyos académicos para personas colombianas. Cada oportunidad tiene una fuente oficial, una fecha de consulta y un destino claro.</motion.p>
          <a className="hero-jump" href="#mapa">EXPLORAR EL MAPA <ArrowRight size={17} /></a>
        </div>
        <div className="hero-aside" aria-label="Resumen de la base de datos">
          <div className="aside-head"><Globe2 size={18} /> PANORAMA / {CORTE.replaceAll('-', '.')}</div>
          <div className="big-stat"><strong>{BECAS.length}</strong><span>OPORTUNIDADES<br />DOCUMENTADAS</span></div>
          <div className="stat-row"><span><b>{countrySummary.length}</b> países de destino</span><span><b>{openTotal}</b> abiertas al corte</span></div>
          <div className="aside-bottom">DATOS CON TRAZABILIDAD <ShieldCheck size={16} /></div>
        </div>
      </div></section>

      <main className="page-container main-content">
        <FilterPanel filters={filters} onChange={changeFilters} onReset={resetFilters} activeCount={activeCount} />
        <div className="results-heading"><div><span className="section-kicker">01 / EXPLORAR</span><h2>{selectedCountry ? `Becas en ${selectedCountry}` : 'Oportunidades sin fronteras'}</h2></div><div className="results-indicator"><strong>{filtered.length}</strong><span>{filtered.length === 1 ? 'resultado' : 'resultados'} con tus filtros</span></div></div>
        <div className="explorer-grid">
          <section className="results-list" aria-label="Resultados de becas">
            <div className="list-head"><span>CONVOCATORIAS</span><span>{String(filtered.length).padStart(2, '0')} EN VISTA</span></div>
            {filtered.length ? <div className="card-stack">{filtered.map((item, index) => <ScholarshipCard key={item.id} item={item} index={index} selected={selectedId === item.id} onLocate={locateScholarship} />)}</div> : <div className="empty-state"><MapPinned size={34} strokeWidth={1.4} /><h3>Sin coincidencias</h3><p>Prueba otra combinación de país, nivel o cobertura.</p><button type="button" onClick={resetFilters}>Limpiar filtros <ArrowRight size={15} /></button></div>}
          </section>
          <section id="mapa" className="map-panel" aria-label="Mapa interactivo de becas">
            <MapView items={filtered} selectedCountry={selectedCountry} selectedId={selectedId} onCountrySelect={chooseCountry} onScholarshipSelect={setSelectedId} />
            {selectedCountry ? <button className="map-back" type="button" onClick={() => chooseCountry('todos')}><ArrowLeft size={15} /> VER TODOS LOS PAÍSES</button> : null}
          </section>
        </div>
        <section className="destinations"><div className="destinations-head"><span className="section-kicker">02 / DESTINOS</span><h2>Elige una dirección.</h2><p>El conteo corresponde a convocatorias únicas, no al número de plazas disponibles.</p></div><div className="destination-list">{countrySummary.map(([country, count], index) => <button type="button" key={country} onClick={() => { chooseCountry(country); document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><span className="destination-index">{String(index + 1).padStart(2, '0')}</span><span>{country}</span><b>{count}</b><ArrowRight size={17} /></button>)}</div></section>
        <div className="data-note"><Info size={16} /><span>Corte de verificación más antiguo: {fechaCorta(CORTE)}. Última consulta automatizada: {fechaCorta(ULTIMA_CONSULTA)}.{PENDIENTES_REVISION ? ` ${PENDIENTES_REVISION} fichas requieren revisión manual.` : ''} “Recurrente” indica un programa periódico; confirma el plazo de cada edición en la fuente oficial. Dos programas de destino múltiple no tienen punto único en el mapa.</span></div>
      </main>
    </>
  )
}

function SourcesPage() {
  const sources = [...BECAS].sort((a, b) => a.entidad_oferente.localeCompare(b.entidad_oferente, 'es') || a.nombre.localeCompare(b.nombre, 'es'))
  return <main className="page-container subpage"><div className="subpage-top"><span className="section-kicker">03 / PROCEDENCIA</span><h1>Fuentes que puedes <em>comprobar.</em></h1><p>Cada convocatoria enlaza directamente con la institución oferente o con el portal oficial que publica la oferta para Colombia. Consulta los términos vigentes antes de postular.</p></div><div className="source-header"><span>{sources.length} REGISTROS · FUENTES OFICIALES</span><span>VERIFICADAS EL {fechaCorta(CORTE).toUpperCase()}</span></div><div className="source-list">{sources.map((item, index) => <a key={item.id} href={item.url_oficial} target="_blank" rel="noopener noreferrer"><span className="source-index">{String(index + 1).padStart(2, '0')}</span><span className="source-main"><b>{item.nombre}</b><small>{item.entidad_oferente}</small></span><span className="source-country">{item.pais_destino}</span><ExternalLink size={17} /></a>)}</div></main>
}

function MethodPage() {
  return <main className="page-container subpage"><div className="subpage-top"><span className="section-kicker">04 / MÉTODO</span><h1>Una base clara, <em>con sus límites.</em></h1><p>Reunimos convocatorias con elegibilidad comprobada para personas colombianas y conservamos el enlace donde se verificó cada dato.</p></div><div className="method-grid"><article><span>01 / SELECCIÓN</span><h2>Fuentes primero.</h2><p>Priorizamos portales de gobiernos, universidades y organismos oficiales. Los agregadores no son evidencia suficiente de elegibilidad. Un campo sin sustento se marca “No verificado”.</p></article><article><span>02 / CONVOCATORIAS</span><h2>Un programa, un registro.</h2><p>Las modalidades de una misma convocatoria se consolidaron. Los programas relacionados con solicitudes distintas siguen separados y sus posibles solapamientos se documentaron durante la depuración.</p></article><article><span>03 / MAPA</span><h2>Precisión visible.</h2><p>Las coordenadas de OpenStreetMap indican país, ciudad o universidad según la evidencia. Los límites provienen de Natural Earth. Los programas multinacionales figuran en la lista sin un punto arbitrario.</p></article><article><span>04 / FECHAS</span><h2>Una fotografía del tiempo.</h2><p>Los estados abierta, cerrada y recurrente corresponden al {fechaCorta(CORTE)}. Los plazos cambian por edición y algunos dependen de la institución o del curso.</p></article></div><section className="method-limits"><div><span className="section-kicker">EXCLUSIONES DOCUMENTADAS</span><h2>Popular no siempre significa elegible.</h2><p>Estos programas se omitieron tras revisar las condiciones publicadas.</p></div><div>{EXCLUSIONES.map((item) => <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"><b>{item.name}</b><span>{item.reason}</span><ExternalLink size={16} /></a>)}</div></section></main>
}

export default function App() {
  return <div className="app-shell"><Header /><Routes><Route path="/" element={<AtlasPage />} /><Route path="/fuentes" element={<SourcesPage />} /><Route path="/metodo" element={<MethodPage />} /><Route path="*" element={<AtlasPage />} /></Routes><Footer /></div>
}
