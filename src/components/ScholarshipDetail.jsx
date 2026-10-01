import { useRef } from 'react'
import { AlertTriangle, ArrowLeft, ArrowUpRight, CalendarDays, Download, GitCompareArrows, Globe2, Heart, MapPin, ShieldCheck, X } from 'lucide-react'
import { DESCONOCIDO, fechaCorta } from '../data/catalogo.js'
import { usePanelFocus } from '../hooks/usePanelFocus.js'

const value = (text) => text && text !== DESCONOCIDO ? text.replaceAll(';', ' · ') : DESCONOCIDO
const dateValue = (text) => text && text !== DESCONOCIDO ? fechaCorta(text) : DESCONOCIDO

function locationNote(item) {
  if (item.precision_ubicacion === 'país') return 'El punto indica el país de destino; no representa una sede o universidad concreta.'
  if (item.precision_ubicacion === 'ciudad') return 'El punto indica la ciudad publicada, no una dirección exacta.'
  if (item.precision_ubicacion === 'universidad') return 'El punto indica la universidad anfitriona.'
  if (item.precision_ubicacion === 'sin ubicación única') return 'La convocatoria cubre varios destinos y no tiene un punto único en el mapa.'
  return 'La precisión del marcador no está verificada.'
}

function Field({ label, children, wide = false }) {
  return <div className={`detail-field${wide ? ' detail-field-wide' : ''}`}><dt>{label}</dt><dd>{children}</dd></div>
}

export default function ScholarshipDetail({ item, estado, onClose, favorite, compared, compareFull, onToggleFavorite, onToggleCompare, calendarEligible, onCalendar }) {
  const panel = useRef(null)
  const closeButton = useRef(null)
  usePanelFocus(panel, closeButton, onClose)

  return <div className="detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside ref={panel} className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title" aria-describedby="detail-intro">
      <div className="detail-topbar"><span>ATLAS / FICHA DE BECA</span><button ref={closeButton} type="button" onClick={onClose} aria-label="Cerrar ficha"><X size={21} /></button></div>
      <div className="detail-scroll">
        <header className="detail-hero"><div className="detail-overline"><span>{item.pais_destino}</span><span className={`status status-${estado.clave}`}><i />{estado.etiqueta}</span></div><h2 id="detail-title">{item.nombre}</h2><p id="detail-intro">{item.entidad_oferente}</p></header>
        {estado.pendiente || estado.motivo ? <div className="detail-alert"><AlertTriangle size={17} /><span>{estado.pendiente ? 'Esta ficha requiere revisión manual. Confirma el plazo en la convocatoria oficial.' : estado.motivo}</span></div> : null}
        <div className="detail-tools"><button type="button" aria-pressed={favorite} onClick={() => onToggleFavorite(item)}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Guardada' : 'Guardar'}</button><button type="button" aria-pressed={compared} disabled={!compared && compareFull} onClick={() => onToggleCompare(item)}><GitCompareArrows size={16} /> {compared ? 'Quitar de comparación' : 'Comparar'}</button></div>
        <section className="detail-section"><h3>La oportunidad</h3><dl className="detail-fields">
          <Field label="Destino">{value(item.pais_destino)}</Field><Field label="Nivel">{value(item.nivel)}</Field>
          <Field label="Área">{value(item.area_conocimiento)}</Field><Field label="Tipo de apoyo">{value(item.tipo_financiacion)}</Field>
          <Field label="Cobertura" wide>{value(item.cobertura)}</Field><Field label="Monto y moneda" wide>{value(item.monto_aproximado_y_moneda)}</Field>
        </dl></section>
        <section className="detail-section"><h3>Antes de postular</h3><dl className="detail-fields">
          <Field label="Requisitos clave" wide>{value(item.requisitos_clave)}</Field><Field label="Idioma requerido">{value(item.idioma_requerido)}</Field><Field label="Nacionalidad elegible">{value(item.nacionalidad_elegible)}</Field>
          <Field label="Apertura"><CalendarDays size={14} /> {dateValue(item.fecha_apertura)}</Field><Field label="Cierre"><CalendarDays size={14} /> {dateValue(item.fecha_cierre)}</Field>
          <Field label="Periodicidad">{value(item.periodicidad)}</Field><Field label="Fechas sujetas a cambio">{value(item.fechas_sujetas_a_cambio)}</Field>
        </dl><div className="detail-calendar">{calendarEligible ? <button type="button" onClick={() => onCalendar(item)}><Download size={17} /> Añadir cierre al calendario</button> : <p>El calendario estará disponible cuando exista un cierre futuro confirmado y verificado recientemente.</p>}<small>Evento de día completo. Confirma el plazo en la fuente oficial.</small></div></section>
        <section className="detail-section"><h3>Fuente y lugar</h3><dl className="detail-fields">
          <Field label="Universidad">{value(item.universidad)}</Field><Field label="Ciudad">{value(item.ciudad)}</Field>
          <Field label="Precisión del marcador" wide><MapPin size={14} /> {locationNote(item)}</Field>
          <Field label="Última verificación"><ShieldCheck size={14} /> {dateValue(item.fecha_ultima_verificacion)}</Field><Field label="Confianza">{value(item.nivel_de_confianza)}</Field>
          <Field label="Fuente de verificación" wide><Globe2 size={14} /> <span className="detail-source">{value(item.fuente_de_verificacion)}</span></Field>
          <Field label="Notas" wide>{value(item.notas)}</Field>
        </dl></section>
        <p className="detail-reminder">Los plazos pueden cambiar por edición. Revisa las condiciones vigentes antes de enviar tu solicitud.</p>
      </div>
      <footer className="detail-footer"><button type="button" onClick={onClose}><ArrowLeft size={16} /> Volver a resultados</button><a href={item.url_oficial} data-beca-id={item.id} data-link-context="ficha" target="_blank" rel="noopener noreferrer">Ver convocatoria oficial <ArrowUpRight size={17} /></a></footer>
    </aside>
  </div>
}
