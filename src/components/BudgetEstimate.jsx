import { useState } from 'react'
import { ArrowUpRight, Info } from 'lucide-react'
import { calcularPresupuesto, FECHA_PRECIOS, PRESUPUESTOS } from '../data/presupuestos.js'

const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${FECHA_PRECIOS}T12:00:00Z`))

function importe(valor, moneda) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: moneda, maximumFractionDigits: valor % 1 ? 2 : 0 }).format(valor)
}

function rango(minimo, maximo, moneda) {
  return minimo === maximo ? importe(minimo, moneda) : `${importe(minimo, moneda)}–${importe(maximo, moneda)}`
}

function Fila({ componente, moneda, sufijo = '' }) {
  return <li><span>{componente.nombre} <a href={componente.fuente} target="_blank" rel="noopener noreferrer" aria-label={`Fuente oficial de ${componente.nombre}`} title="Fuente oficial"><ArrowUpRight size={13} /></a></span><strong>{rango(componente.minimo, componente.maximo, moneda)}{sufijo}</strong></li>
}

export default function BudgetEstimate({ item }) {
  const presupuesto = PRESUPUESTOS[item.id]
  const [opcionId, setOpcionId] = useState(null)
  if (!presupuesto) return null
  const calculo = calcularPresupuesto(presupuesto, opcionId)
  const moneda = presupuesto.moneda

  return <section className="detail-section budget-section" aria-labelledby="budget-title">
    <div className="budget-heading"><div><span className="budget-kicker">PILOTO · {presupuesto.ciudad} · {moneda}</span><h3 id="budget-title">Presupuesto orientativo</h3></div><span className="budget-date">Precios consultados: {fecha}</span></div>
    <p className="budget-intro">{presupuesto.supuesto}</p>
    <div className="budget-monthly"><span>Costo de vida mensual documentado</span><strong>{rango(calculo.mensual.minimo, calculo.mensual.maximo, moneda)}</strong><small>Vivienda incluida · moneda local</small></div>
    <h4>Gastos mensuales</h4><ul className="budget-lines">{presupuesto.mensual.map((parte) => <Fila key={parte.nombre} componente={parte} moneda={moneda} sufijo=" / mes" />)}</ul>
    {presupuesto.unaVez.length ? <><h4>Costos de referencia adicionales</h4><ul className="budget-lines">{presupuesto.unaVez.map((parte) => <Fila key={parte.nombre} componente={parte} moneda={moneda} />)}</ul></> : null}
    {presupuesto.opciones.length > 1 ? <label className="budget-choice">Si te adjudican el apoyo<select value={calculo.opcion?.id ?? ''} onChange={(event) => setOpcionId(event.target.value)}>{presupuesto.opciones.map((opcion) => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}</select></label> : null}
    {calculo.opcion ? <p className="budget-coverage">Descuento aplicado solo a cobertura confirmada: <a href={calculo.opcion.fuente} target="_blank" rel="noopener noreferrer">ver condiciones de {calculo.opcion.nombre.toLowerCase()} <ArrowUpRight size={13} /></a>. Se supone adjudicación; no está garantizada.</p> : null}
    <div className="budget-totals"><div><span>Subtotal documentado {presupuesto.duracion ? `· ${presupuesto.duracion} meses` : ''}</span><strong>{calculo.subtotal ? rango(calculo.subtotal.minimo, calculo.subtotal.maximo, moneda) : 'No verificado'}</strong></div><div className="budget-personal"><span>Aporte personal documentado</span><strong>{calculo.aporte ? rango(calculo.aporte.minimo, calculo.aporte.maximo, moneda) : 'No verificado'}</strong></div></div>
    <div className="budget-caveat"><Info size={16} /><div><strong>Costo total completo: No verificado.</strong><p>Faltan importes comparables para {presupuesto.faltantes.join('; ')}. El subtotal y el aporte documentado no son el dinero total que necesitarás.</p></div></div>
    <p className="budget-note">{presupuesto.nota}</p>
    <small className="budget-review">Revisar precios, tasas y coberturas antes de postular. Sin conversión a COP: no se usa un tipo de cambio desactualizado.</small>
  </section>
}
