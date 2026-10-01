import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Compass, ExternalLink, GitCompareArrows, Globe2, Heart, Info, List, Map as MapIcon, MapPinned, ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import FilterPanel from './components/FilterPanel.jsx'
import AnalyticsConsent from './components/AnalyticsConsent.jsx'
import { analyticsChoice, startAnalytics, trackEvent, trackPageView } from './analytics.js'
import MapView from './components/MapView.jsx'
import ScholarshipCard from './components/ScholarshipCard.jsx'
import ScholarshipDetail from './components/ScholarshipDetail.jsx'
import { SavedPanel, ComparePanel } from './components/ScholarshipCollection.jsx'
import { useFavoritas } from './hooks/useFavoritas.js'
import { cierreConfirmado, descargarIcs } from './data/calendario.js'
import { BECAS, CORTE, DESCONOCIDO, IDS_PENDIENTES_REVISION, PENDIENTES_REVISION, ULTIMA_CONSULTA, filtrarBecas, fechaCorta, resumenPais } from './data/catalogo.js'
import { cierraPronto, estadoVigente, fechaHoyColombia, ordenarBecas } from './data/vigencia.js'

const BECAS_BY_ID = new Map(BECAS.map((item) => [item.id, item]))
const DEFAULT_FILTERS = { busqueda: '', pais: 'todos', nivel: 'todos', area: 'todas', cobertura: 'todas', estado: 'todos', mes: 'todos', vista: 'todas' }
const VISTAS = [{ key: 'todas', label: 'Todas' }, { key: 'abiertas', label: 'Abiertas ahora' }, { key: 'pronto', label: 'Cierran pronto' }, { key: 'recurrentes', label: 'Recurrentes' }]
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
      <NavLink to="/privacidad">Privacidad</NavLink><AnalyticsConsent />
    </div></footer>
  )
}

function AtlasPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState(null)
  const [orden, setOrden] = useState('nombre')
  const [mobileView, setMobileView] = useState('lista')
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches)
  useEffect(() => { const query = window.matchMedia('(max-width: 900px)'); const update = () => setIsMobile(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update) }, [])
  const [detailId, setDetailId] = useState(null)
  const [collectionPanel, setCollectionPanel] = useState(null)
  const [favoritas, toggleFavorite] = useFavoritas()
  const [compareIds, setCompareIds] = useState([])
  const favoriteIds = useMemo(() => new Set(favoritas.map((entry) => entry.id)), [favoritas])
  const compareFull = compareIds.length >= 3
  const detailOpener = useRef(null)
  const collectionOpener = useRef(null)
  const savedTrigger = useRef(null)
  const compareTrigger = useRef(null)
  const reduceMotion = useReducedMotion()
  const hoy = fechaHoyColombia()
  const estadoDe = useCallback((item) => estadoVigente(item, IDS_PENDIENTES_REVISION, hoy), [hoy])
  const estadoVisual = useCallback((item) => {
    const estado = estadoDe(item)
    return cierraPronto(item, IDS_PENDIENTES_REVISION, hoy)
      ? { ...estado, clave: 'pronto', etiqueta: 'Cierra pronto' }
      : estado
  }, [estadoDe, hoy])
  const filtered = useMemo(() => {
    const vistaEstado = filters.vista === 'abiertas' ? 'abierta' : filters.vista === 'recurrentes' ? 'recurrente' : filters.vista
    const visibles = filtrarBecas(BECAS, filters, estadoVisual)
      .filter((item) => filters.vista === 'todas' || estadoVisual(item).clave === vistaEstado)
    return ordenarBecas(visibles, orden)
  }, [filters, estadoVisual, orden])
  useEffect(() => {
    if (!Object.entries(filters).some(([key, value]) => value !== DEFAULT_FILTERS[key])) return undefined
    const timer = window.setTimeout(() => {
      const parameters = {
        destination: filters.pais, study_level: filters.nivel, study_area: filters.area,
        coverage: filters.cobertura, application_status: filters.estado,
        closing_month: filters.mes, quick_view: filters.vista,
        has_search: Boolean(filters.busqueda.trim()), results_count: filtered.length,
      }
      trackEvent('explore_filters', parameters)
      if (filtered.length === 0) trackEvent('no_results', parameters)
    }, 700)
    return () => window.clearTimeout(timer)
  }, [filters, filtered.length])
  const detailItem = BECAS_BY_ID.get(detailId)
  const compareItems = compareIds.map((id) => BECAS_BY_ID.get(id)).filter(Boolean)
  const selectedCountry = filters.pais === 'todos' ? null : filters.pais
  const countrySummary = useMemo(() => resumenPais(BECAS).filter(([country]) => country !== 'Varios'), [])
  const activeCount = Object.entries(filters).filter(([key, value]) => value !== DEFAULT_FILTERS[key]).length
  const openTotal = BECAS.filter((item) => estadoVisual(item).clave === 'abierta').length
  const changeFilters = useCallback((updater) => { setFilters(updater); setSelectedId(null) }, [])
  const resetFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setOrden('nombre'); setSelectedId(null) }, [])
  const chooseCountry = useCallback((country) => {
    setFilters((current) => ({ ...current, pais: country }))
    setSelectedId(null)
  }, [])
  const openDetails = useCallback((item, opener) => { detailOpener.current = opener; setDetailId(item.id) }, [])
  const closeDetails = useCallback(() => { setDetailId(null) }, [])
  const returnDetailFocus = useCallback(() => {
    requestAnimationFrame(() => (detailOpener.current?.isConnected ? detailOpener.current : savedTrigger.current)?.focus())
  }, [])
  const closeCollection = useCallback(() => { setCollectionPanel(null); requestAnimationFrame(() => (collectionOpener.current?.isConnected && !collectionOpener.current.disabled ? collectionOpener.current : savedTrigger.current)?.focus()) }, [])
  const toggleCompare = useCallback((item) => { setCompareIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : current.length < 3 ? [...current, item.id] : current) }, [])
  const openDetailsFromSaved = useCallback((item) => { detailOpener.current = savedTrigger.current; setCollectionPanel(null); setDetailId(item.id) }, [])
  const openCompareFromSaved = useCallback(() => { collectionOpener.current = savedTrigger.current; setCollectionPanel('compare') }, [])
  const removeCompared = useCallback((id) => { setCompareIds((current) => current.filter((value) => value !== id)); if (compareIds.length <= 2) closeCollection() }, [compareIds.length, closeCollection])
  const showMap = useCallback(() => { setMobileView('mapa'); requestAnimationFrame(() => document.getElementById('mapa')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })) }, [])
  const locateScholarship = useCallback((item) => {
    setFilters((current) => ({ ...current, pais: item.pais_destino }))
    setSelectedId(item.id)
    if (window.innerWidth < 900) showMap()
  }, [showMap])

  return (
    <>
      <section className="hero"><div className="page-container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> UNA RUTA HACIA MÁS POSIBILIDADES <span className="edition">ED. 01 / 2026</span></div>
          <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }}>El mundo como <em>próxima aula.</em></motion.h1>
          <motion.p initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>Becas y apoyos académicos para personas colombianas. Cada oportunidad tiene una fuente oficial, una fecha de consulta y un destino claro.</motion.p>
          <button className="hero-jump" type="button" onClick={showMap}>EXPLORAR EL MAPA <ArrowRight size={17} /></button>
        </div>
        <div className="hero-aside" aria-label="Resumen de la base de datos">
          <div className="aside-head"><Globe2 size={18} /> PANORAMA / {CORTE.replaceAll('-', '.')}</div>
          <div className="big-stat"><strong>{BECAS.length}</strong><span>OPORTUNIDADES<br />DOCUMENTADAS</span></div>
          <div className="stat-row"><span><b>{countrySummary.length}</b> países de destino</span><span><b>{openTotal}</b> abiertas ahora</span></div>
          <div className="aside-bottom">DATOS CON TRAZABILIDAD <ShieldCheck size={16} /></div>
        </div>
      </div></section>

      <main id="contenido" className="page-container main-content">
        <FilterPanel filters={filters} onChange={changeFilters} onReset={resetFilters} activeCount={activeCount} />
        <div className="discovery-bar"><div className="quick-views" role="group" aria-label="Vistas rápidas">{VISTAS.map((vista) => <button key={vista.key} type="button" className={`vista-${vista.key}${filters.vista === vista.key ? ' active' : ''}`} aria-pressed={filters.vista === vista.key} onClick={() => changeFilters((current) => ({ ...current, vista: vista.key }))}>{vista.label}</button>)}</div><label className="sort-field">ORDENAR POR <select aria-label="Ordenar resultados" value={orden} onChange={(event) => setOrden(event.target.value)}><option value="nombre">Nombre</option><option value="cierre">Cierre más próximo</option><option value="pais">País</option><option value="nivel">Nivel</option></select></label></div>
        <div className="collection-toolbar" role="group" aria-label="Tu selección"><button ref={savedTrigger} type="button" onClick={(event) => { collectionOpener.current = event.currentTarget; setCollectionPanel('saved') }}><Heart size={17} /> Guardadas <b>{favoritas.length}</b></button><button ref={compareTrigger} type="button" disabled={compareIds.length < 2} onClick={(event) => { collectionOpener.current = event.currentTarget; setCollectionPanel('compare') }}><GitCompareArrows size={17} /> Comparar <b>{compareIds.length}/3</b></button><span>Guarda oportunidades en este navegador y compara hasta tres.</span></div>
        <div className="results-heading"><div><span className="section-kicker">01 / EXPLORAR</span><h2>{selectedCountry ? `Becas en ${selectedCountry}` : 'Oportunidades sin fronteras'}</h2></div><div className="results-indicator" role="status" aria-live="polite" aria-atomic="true"><strong>{filtered.length}</strong><span>{filtered.length === 1 ? 'resultado' : 'resultados'} con tus filtros</span></div></div>
        <div className="mobile-view-switch" role="group" aria-label="Vista de resultados"><button type="button" aria-pressed={mobileView === 'lista'} className={mobileView === 'lista' ? 'active' : ''} onClick={() => setMobileView('lista')}><List size={16} /> Lista</button><button type="button" aria-pressed={mobileView === 'mapa'} className={mobileView === 'mapa' ? 'active' : ''} onClick={() => setMobileView('mapa')}><MapIcon size={16} /> Mapa</button></div>
        <div className={`explorer-grid mobile-view-${mobileView}`}>

          <section className="results-list" aria-label="Resultados de becas">
            <div className="list-head"><span>CONVOCATORIAS</span><span>{String(filtered.length).padStart(2, '0')} EN VISTA</span></div>
            {filtered.length ? <div className="card-stack">{filtered.map((item, index) => <ScholarshipCard key={item.id} item={item} index={index} selected={selectedId === item.id} onLocate={locateScholarship} onDetails={openDetails} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onCalendar={descargarIcs} favorite={favoriteIds.has(item.id)} compared={compareIds.includes(item.id)} compareFull={compareFull} calendarEligible={cierreConfirmado(item, IDS_PENDIENTES_REVISION, hoy)} estado={estadoVisual(item)} />)}</div> : <div className="empty-state"><MapPinned size={34} strokeWidth={1.4} /><h3>{filters.vista === 'abiertas' ? 'Sin aperturas confirmadas' : filters.vista === 'pronto' ? 'Ningún cierre próximo' : 'Sin coincidencias'}</h3><p>{filters.vista === 'abiertas' || filters.vista === 'pronto' ? 'Prueba otro país o consulta las convocatorias recurrentes. Los plazos se confirman en la fuente oficial.' : 'Prueba otra combinación de país, nivel o cobertura.'}</p><button type="button" onClick={resetFilters}>Limpiar filtros <ArrowRight size={15} /></button></div>}
          </section>
          <section id="mapa" className="map-panel" aria-label="Mapa interactivo de becas">
            {(!isMobile || mobileView === 'mapa') ? <MapView items={filtered} selectedCountry={selectedCountry} selectedId={selectedId} onCountrySelect={chooseCountry} onScholarshipSelect={setSelectedId} onDetails={openDetails} estadoDe={estadoVisual} /> : null}
            {selectedCountry ? <button className="map-back" type="button" onClick={() => chooseCountry('todos')}><ArrowLeft size={15} /> VER TODOS LOS PAÍSES</button> : null}
          </section>
        </div>
        <section className="destinations"><div className="destinations-head"><span className="section-kicker">02 / DESTINOS</span><h2>Elige una dirección.</h2><p>El conteo corresponde a convocatorias únicas, no al número de plazas disponibles.</p></div><div className="destination-list">{countrySummary.map(([country, count], index) => <button type="button" key={country} onClick={() => { chooseCountry(country); showMap() }}><span className="destination-index">{String(index + 1).padStart(2, '0')}</span><span>{country}</span><b>{count}</b><ArrowRight size={17} /></button>)}</div></section>
        <div className="data-note"><Info size={16} /><span>Corte de verificación más antiguo: {fechaCorta(CORTE)}. Última consulta automatizada: {fechaCorta(ULTIMA_CONSULTA)}.{PENDIENTES_REVISION ? ` ${PENDIENTES_REVISION} fichas requieren revisión manual.` : ''} «Abiertas ahora» excluye las que cierran en los próximos 30 días; aparecen en «Cierran pronto». Ambas vistas exigen un plazo vigente y verificación reciente. “Recurrente” indica un programa periódico; confirma el plazo de cada edición en la fuente oficial. Dos programas de destino múltiple no tienen punto único en el mapa.</span></div>
      </main>
      <AnimatePresence onExitComplete={returnDetailFocus}>{detailItem ? <ScholarshipDetail key={detailItem.id} item={detailItem} estado={estadoVisual(detailItem)} onClose={closeDetails} favorite={favoriteIds.has(detailItem.id)} compared={compareIds.includes(detailItem.id)} compareFull={compareFull} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} calendarEligible={cierreConfirmado(detailItem, IDS_PENDIENTES_REVISION, hoy)} onCalendar={descargarIcs} /> : null}</AnimatePresence>
      {collectionPanel === 'saved' ? <SavedPanel entries={favoritas} byId={BECAS_BY_ID} estadoDe={estadoVisual} compareIds={compareIds} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onOpenDetail={openDetailsFromSaved} onOpenCompare={openCompareFromSaved} onClose={closeCollection} /> : null}
      {collectionPanel === 'compare' ? <ComparePanel items={compareItems} estadoDe={estadoVisual} onRemove={removeCompared} onClose={closeCollection} /> : null}
    </>
  )
}

function SourcesPage() {
  const sources = [...BECAS].sort((a, b) => a.entidad_oferente.localeCompare(b.entidad_oferente, 'es') || a.nombre.localeCompare(b.nombre, 'es'))
  return <main id="contenido" className="page-container subpage"><div className="subpage-top"><span className="section-kicker">03 / PROCEDENCIA</span><h1>Fuentes que puedes <em>comprobar.</em></h1><p>Cada convocatoria enlaza directamente con la institución oferente o con el portal oficial que publica la oferta para Colombia. Consulta los términos vigentes antes de postular.</p></div><div className="source-header"><span>{sources.length} REGISTROS · FUENTES OFICIALES</span><span>VERIFICADAS EL {fechaCorta(CORTE).toUpperCase()}</span></div><div className="source-list">{sources.map((item, index) => <a key={item.id} href={item.url_oficial} data-beca-id={item.id} data-link-context="fuentes" target="_blank" rel="noopener noreferrer"><span className="source-index">{String(index + 1).padStart(2, '0')}</span><span className="source-main"><b>{item.nombre}</b><small>{item.entidad_oferente}</small></span><span className="source-country">{item.pais_destino}</span><ExternalLink size={17} /></a>)}</div></main>
}

function MethodPage() {
  return <main id="contenido" className="page-container subpage"><div className="subpage-top"><span className="section-kicker">04 / MÉTODO</span><h1>Una base clara, <em>con sus límites.</em></h1><p>Reunimos convocatorias con elegibilidad comprobada para personas colombianas y conservamos el enlace donde se verificó cada dato.</p></div><div className="method-grid"><article><span>01 / SELECCIÓN</span><h2>Fuentes primero.</h2><p>Priorizamos portales de gobiernos, universidades y organismos oficiales. Los agregadores no son evidencia suficiente de elegibilidad. Un campo sin sustento se marca “No verificado”.</p></article><article><span>02 / CONVOCATORIAS</span><h2>Un programa, un registro.</h2><p>Las modalidades de una misma convocatoria se consolidaron. Los programas relacionados con solicitudes distintas siguen separados y sus posibles solapamientos se documentaron durante la depuración.</p></article><article><span>03 / MAPA</span><h2>Precisión visible.</h2><p>Las coordenadas de OpenStreetMap indican país, ciudad o universidad según la evidencia. Los límites provienen de Natural Earth. Los programas multinacionales figuran en la lista sin un punto arbitrario.</p></article><article><span>04 / FECHAS</span><h2>Una fotografía del tiempo.</h2><p>Los estados abierta, cerrada y recurrente corresponden al {fechaCorta(CORTE)}. Los plazos cambian por edición y algunos dependen de la institución o del curso.</p></article></div><section className="method-limits"><div><span className="section-kicker">EXCLUSIONES DOCUMENTADAS</span><h2>Popular no siempre significa elegible.</h2><p>Estos programas se omitieron tras revisar las condiciones publicadas.</p></div><div>{EXCLUSIONES.map((item) => <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"><b>{item.name}</b><span>{item.reason}</span><ExternalLink size={16} /></a>)}</div></section></main>
}

function PrivacyPage() {
  return <main id="contenido" className="page-container subpage privacy-page"><div className="subpage-top"><span className="section-kicker">05 / PRIVACIDAD</span><h1>Datos para mejorar, <em>con tu permiso.</em></h1><p>La navegación por el atlas, los filtros y la apertura de fuentes oficiales funcionan sin analítica.</p></div><div className="method-grid"><article><span>01 / MEDICIÓN OPCIONAL</span><h2>Qué medimos.</h2><p>Con tu permiso usamos Google Analytics 4 para contar vistas de las páginas, categorías de filtros, búsquedas sin resultados y clics que llevan a una convocatoria oficial. Un clic no significa que hayas postulado.</p></article><article><span>02 / DATOS QUE OMITIMOS</span><h2>Sin tu texto de búsqueda.</h2><p>No enviamos lo que escribes en el buscador, tu lista de becas guardadas, ni los datos de un formulario personal. Los eventos usan categorías y el identificador público de la beca.</p></article><article><span>03 / TU ELECCIÓN</span><h2>Puedes cambiarla.</h2><p>La elección se guarda en este navegador. Puedes usar “Preferencias de analítica” en el pie de página para permitirla o rechazarla más adelante. Al retirarla, la página se recarga para detener la medición.</p></article><article><span>04 / PROVEEDOR</span><h2>Google Analytics.</h2><p>Cuando permites la medición, el navegador carga la etiqueta de Google. Puedes consultar su <a href="https://policies.google.com/privacy?hl=es" target="_blank" rel="noopener noreferrer">política de privacidad</a>. Si el sitio no tiene un ID de medición configurado, no carga la etiqueta.</p></article></div></main>
}

function RouteAnalytics() {
  const location = useLocation()
  useEffect(() => {
    if (analyticsChoice() === 'accepted') {
      startAnalytics()
      trackPageView(location.pathname)
    }
  }, [location.pathname])
  return null
}

export default function App() {
  useEffect(() => {
    const onOfficialLink = (event) => {
      const anchor = event.target.closest?.('a[data-beca-id]')
      if (!anchor) return
      const item = BECAS_BY_ID.get(anchor.dataset.becaId)
      if (item) trackEvent('official_link_click', {
        scholarship_id: item.id, destination: item.pais_destino,
        link_context: anchor.dataset.linkContext || 'otro',
      })
    }
    document.addEventListener('click', onOfficialLink)
    return () => document.removeEventListener('click', onOfficialLink)
  }, [])
  return <div className="app-shell"><RouteAnalytics /><a className="skip-link" href="#contenido">Saltar al contenido</a><Header /><Routes><Route path="/" element={<AtlasPage />} /><Route path="/fuentes" element={<SourcesPage />} /><Route path="/metodo" element={<MethodPage />} /><Route path="/privacidad" element={<PrivacyPage />} /><Route path="*" element={<AtlasPage />} /></Routes><Footer /></div>
}
