import { ArrowUpRight, CalendarDays, LocateFixed, MapPin } from 'lucide-react'
import { DESCONOCIDO, fechaCorta, textoCobertura } from '../data/catalogo.js'

const STATUS = { abierta: 'Abierta', cerrada: 'Cerrada', recurrente: 'Recurrente' }

export default function ScholarshipCard({ item, index, onLocate, selected }) {
  const location = item.ciudad !== DESCONOCIDO ? `${item.ciudad}, ${item.pais_destino}` : item.pais_destino
  const hasPoint = item.latitud !== DESCONOCIDO
  return (
    <article className={`scholar-card ${selected ? 'is-selected' : ''}`}>
      <div className="card-topline">
        <span className="card-number">{String(index + 1).padStart(2, '0')} / BECAS</span>
        <span className={`status status-${item.estado_convocatoria}`}><i />{STATUS[item.estado_convocatoria]}</span>
      </div>
      <h3>{item.nombre}</h3>
      <p className="card-entity">{item.entidad_oferente}</p>
      <div className="card-location"><MapPin size={14} strokeWidth={1.8} />{location}</div>
      <div className="card-tags">
        {item.nivel.split(';').map((level) => <span key={level}>{level.trim()}</span>)}
      </div>
      <p className="card-coverage">{textoCobertura(item.cobertura)}</p>
      <div className="card-foot">
        <span className="closing"><CalendarDays size={14} /> Cierre: {fechaCorta(item.fecha_cierre)}</span>
        <div className="card-actions">
          {hasPoint ? <button type="button" onClick={() => onLocate(item)} title="Ubicar en el mapa" aria-label={`Ubicar ${item.nombre} en el mapa`}><LocateFixed size={17} /></button> : null}
          <a href={item.url_oficial} target="_blank" rel="noopener noreferrer" title="Abrir fuente oficial" aria-label={`Abrir fuente oficial de ${item.nombre}`}><ArrowUpRight size={18} /></a>
        </div>
      </div>
    </article>
  )
}
