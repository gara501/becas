import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { AREAS, COBERTURAS, NIVELES, PAISES } from '../data/catalogo.js'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  )
}

export default function FilterPanel({ filters, onChange, onReset, activeCount }) {
  const change = (key) => (value) => onChange((current) => ({ ...current, [key]: value }))
  return (
    <section className="filter-panel" aria-label="Filtros de becas">
      <div className="filter-head">
        <div className="flex items-center gap-2"><SlidersHorizontal size={16} strokeWidth={2} /><span>AFINA TU BÚSQUEDA</span></div>
        <button className="reset-button" onClick={onReset} type="button" disabled={!activeCount}>
          <RotateCcw size={14} /> Limpiar {activeCount ? `(${activeCount})` : ''}
        </button>
      </div>
      <div className="filter-grid">
        <label className="filter-field search-field">
          <span>BUSCAR</span>
          <div className="search-wrap"><Search size={16} /><input type="search" placeholder="Beca, entidad o universidad" value={filters.busqueda} onChange={(event) => change('busqueda')(event.target.value)} /></div>
        </label>
        <SelectField label="DESTINO" value={filters.pais} onChange={change('pais')}>
          <option value="todos">Todos los países</option>
          {PAISES.map((country) => <option key={country} value={country}>{country}</option>)}
        </SelectField>
        <SelectField label="NIVEL" value={filters.nivel} onChange={change('nivel')}>
          <option value="todos">Todos los niveles</option>
          {NIVELES.map((level) => <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>)}
        </SelectField>
        <SelectField label="ÁREA" value={filters.area} onChange={change('area')}>
          {AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
        </SelectField>
        <SelectField label="COBERTURA" value={filters.cobertura} onChange={change('cobertura')}>
          {COBERTURAS.map((coverage) => <option key={coverage.value} value={coverage.value}>{coverage.label}</option>)}
        </SelectField>
        <SelectField label="ESTADO" value={filters.estado} onChange={change('estado')}>
          <option value="todos">Todos los estados</option>
          <option value="abierta">Abierta</option>
          <option value="cerrada">Cerrada</option>
          <option value="recurrente">Recurrente</option>
          <option value="proxima">Próxima apertura</option>
          <option value="pendiente">Por confirmar</option>
        </SelectField>
        <SelectField label="CIERRE" value={filters.mes} onChange={change('mes')}>
          <option value="todos">Todos los meses</option>
          {MESES.map((month, index) => <option key={month} value={String(index + 1).padStart(2, '0')}>{month}</option>)}
        </SelectField>
      </div>
    </section>
  )
}
