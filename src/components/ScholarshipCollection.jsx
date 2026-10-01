import { useRef } from 'react'
import { ArrowLeft, ArrowUpRight, GitCompareArrows, Heart, X } from 'lucide-react'
import { DESCONOCIDO, fechaCorta } from '../data/catalogo.js'
import { usePanelFocus } from '../hooks/usePanelFocus.js'

const show = (value) => value && value !== DESCONOCIDO ? value.replaceAll(';', ' · ') : DESCONOCIDO
const showDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? fechaCorta(value) : DESCONOCIDO

export function SavedPanel({ entries, byId, estadoDe, compareIds, onToggleFavorite, onToggleCompare, onOpenDetail, onOpenCompare, onClose }) {
  const panel = useRef(null)
  const closeButton = useRef(null)
  usePanelFocus(panel, closeButton, onClose)
  return <div className="detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside ref={panel} className="detail-panel collection-panel" role="dialog" aria-modal="true" aria-labelledby="saved-title">
      <div className="detail-topbar"><span>ATLAS / TU SELECCIÓN</span><button ref={closeButton} type="button" onClick={onClose} aria-label="Cerrar guardadas"><X size={21} /></button></div>
      <div className="detail-scroll">
        <header className="collection-hero"><span className="section-kicker">GUARDADAS EN ESTE NAVEGADOR</span><h2 id="saved-title">Tus becas <em>guardadas.</em></h2><p>Se conservan en este navegador, sin cuenta. Revisa siempre la convocatoria oficial antes de postular.</p></header>
        {entries.length ? <div className="saved-list">{entries.map((entry) => {
          const item = byId.get(entry.id)
          const selected = compareIds.includes(entry.id)
          return <article className="saved-entry" key={entry.id}>
            <div className="saved-entry-head"><span>{item?.pais_destino || entry.pais_destino}</span><span className={item ? `status status-${estadoDe(item).clave}` : 'saved-retired'}>{item ? <><i />{estadoDe(item).etiqueta}</> : 'Retirada de la base'}</span></div>
            <h3>{item?.nombre || entry.nombre}</h3>
            {item ? <p>Cierre publicado: {showDate(item.fecha_cierre)}</p> : <p>Este registro ya no aparece en el catálogo actual. Conservamos el nombre para que puedas identificarlo y quitarlo.</p>}
            <div className="saved-entry-actions">
              {item ? <><button type="button" onClick={() => onOpenDetail(item)}>Ver ficha <ArrowUpRight size={14} /></button><button type="button" aria-pressed={selected} disabled={!selected && compareIds.length >= 3} onClick={() => onToggleCompare(item)}>{selected ? 'Quitar comparación' : 'Comparar'}</button></> : null}
              <button type="button" onClick={() => onToggleFavorite(entry)}>Quitar guardada</button>
            </div>
          </article>
        })}</div> : <div className="collection-empty"><Heart size={30} /><h3>Aún no guardas becas.</h3><p>Usa «Guardar» en una ficha para reunir las que quieras revisar después.</p></div>}
      </div>
      <footer className="detail-footer"><button type="button" onClick={onClose}><ArrowLeft size={16} /> Volver a resultados</button><button className="collection-footer-cta" type="button" onClick={onOpenCompare} disabled={compareIds.length < 2}><GitCompareArrows size={16} /> Comparar {compareIds.length}/3</button></footer>
    </aside>
  </div>
}

const compareFields = [
  ['Estado', (item, estadoDe) => <span className={`status status-${estadoDe(item).clave}`}><i />{estadoDe(item).etiqueta}</span>],
  ['Destino', (item) => show(item.pais_destino)],
  ['Nivel', (item) => show(item.nivel)],
  ['Área', (item) => show(item.area_conocimiento)],
  ['Cobertura', (item) => show(item.cobertura)],
  ['Monto y moneda', (item) => show(item.monto_aproximado_y_moneda)],
  ['Idioma', (item) => show(item.idioma_requerido)],
  ['Requisitos', (item) => show(item.requisitos_clave)],
  ['Cierre', (item) => showDate(item.fecha_cierre)],
  ['Financiación', (item) => show(item.tipo_financiacion)],
  ['Verificación', (item) => showDate(item.fecha_ultima_verificacion)],
]

export function ComparePanel({ items, estadoDe, onRemove, onClose }) {
  const panel = useRef(null)
  const closeButton = useRef(null)
  usePanelFocus(panel, closeButton, onClose)
  return <div className="detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={panel} className="detail-panel compare-panel" role="dialog" aria-modal="true" aria-labelledby="compare-title">
      <div className="detail-topbar"><span>ATLAS / COMPARAR</span><button ref={closeButton} type="button" onClick={onClose} aria-label="Cerrar comparación"><X size={21} /></button></div>
      <div className="detail-scroll"><header className="collection-hero"><span className="section-kicker">DECIDE CON DATOS</span><h2 id="compare-title">Becas, <em>lado a lado.</em></h2><p>Compara hasta tres oportunidades. Los campos sin dato se muestran como «No verificado».</p></header>
        <p className="compare-hint">Desliza la tabla para ver las demás becas →</p>
        <div className="compare-scroll" tabIndex="0" aria-label="Tabla comparativa; desplázate horizontalmente si es necesario"><table className="compare-table"><thead><tr><th scope="col">CRITERIO</th>{items.map((item) => <th scope="col" key={item.id}><span>{item.nombre}</span><button type="button" onClick={() => onRemove(item.id)} aria-label={`Quitar ${item.nombre} de la comparación`}>Quitar <X size={13} /></button></th>)}</tr></thead><tbody>{compareFields.map(([label, getValue]) => <tr key={label}><th scope="row">{label}</th>{items.map((item) => <td key={item.id}>{getValue(item, estadoDe)}</td>)}</tr>)}<tr><th scope="row">Fuente oficial</th>{items.map((item) => <td key={item.id}><a href={item.url_oficial} data-beca-id={item.id} data-link-context="comparacion" target="_blank" rel="noopener noreferrer">Abrir convocatoria <ArrowUpRight size={13} /></a></td>)}</tr></tbody></table></div>
        <p className="detail-reminder">La comparación es una fotografía de la base. Las fechas y condiciones pueden cambiar; reconfírmalas en cada fuente oficial.</p>
      </div>
      <footer className="detail-footer"><button type="button" onClick={onClose}><ArrowLeft size={16} /> Volver a resultados</button><span>{items.length} de 3 becas</span></footer>
    </section>
  </div>
}
