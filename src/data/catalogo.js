import scholarships from './becas.json'
import places from './geocodigos.json'
import metadata from './corte.json'

export const BECAS = scholarships
export const GEOCODIGOS = places
export const CORTE = metadata.fecha_corte_verificado
export const ULTIMA_CONSULTA = metadata.fecha_ultima_consulta
export const PENDIENTES_REVISION = metadata.pendientes_revision
export const IDS_PENDIENTES_REVISION = metadata.ids_pendientes_revision || []
export const DESCONOCIDO = 'No verificado'

export const NIVELES = ['pregrado', 'maestría', 'doctorado', 'postdoctorado', 'idiomas', 'curso corto', 'intercambio']
export const AREAS = [
  { value: 'todas', label: 'Todas las áreas' },
  { value: 'ciencias-sociales', label: 'Ciencias sociales y gestión' },
  { value: 'ciencias-tecnologia', label: 'Ciencia y tecnología' },
  { value: 'salud', label: 'Salud' },
  { value: 'arte-diseno', label: 'Arte y diseño' },
  { value: 'idiomas', label: 'Idiomas' },
  { value: 'multidisciplinar', label: 'Multidisciplinar / sin área' },
]
export const COBERTURAS = [
  { value: 'todas', label: 'Toda cobertura' },
  { value: 'matricula', label: 'Matrícula' },
  { value: 'manutencion', label: 'Manutención' },
  { value: 'pasaje', label: 'Pasaje o traslado' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'total', label: 'Integral verificada' },
  { value: 'parcial', label: 'Parcial' },
]

export const PAISES = [...new Set(BECAS.map((item) => item.pais_destino))]
  .sort((a, b) => a.localeCompare(b, 'es'))

const INTEGRALES = new Set(['CHEVENING-CO-2027', 'ERASMUS-MUNDUS-JM-2027', 'MOFCOM-CSC-2026'])

export function normalizar(value = '') {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function categoriaArea(item) {
  const area = normalizar(item.area_conocimiento)
  if (area.includes('idioma') || area.includes('aleman')) return 'idiomas'
  if (area.includes('social') || area.includes('politic') || area.includes('gobierno') || area.includes('negocio') || area.includes('desarrollo') || area.includes('administracion') || area.includes('comercio')) return 'ciencias-sociales'
  if (area.includes('salud') || area.includes('medicina')) return 'salud'
  if (area.includes('arte') || area.includes('diseno') || area.includes('musica') || area.includes('cinema')) return 'arte-diseno'
  if (area.includes('ciencia') || area.includes('tecnolog') || area.includes('ingenier') || area.includes('matematic') || area.includes('informatica') || area.includes('inteligencia artificial') || area.includes('stem')) return 'ciencias-tecnologia'
  return 'multidisciplinar'
}

export function tieneCobertura(item, tipo) {
  if (tipo === 'todas') return true
  const value = normalizar(item.cobertura)
  if (tipo === 'total') return INTEGRALES.has(item.id)
  if (tipo === 'parcial') return value.includes('parcial') || value.includes('descuento') || value.includes('hasta ') || /\b(?:[1-9]?\d)\s*%/.test(value)
  if (tipo === 'matricula') return value.includes('matricula') || value.includes('costos universitarios') || value.includes('curso')
  if (tipo === 'manutencion') return value.includes('manutencion') || value.includes('sostenimiento') || value.includes('estipendio') || value.includes('alojamiento') || value.includes('viatico')
  if (tipo === 'pasaje') return value.includes('pasaje') || value.includes('tiquete') || value.includes('viaje') || value.includes('traslado') || value.includes('movilidad')
  if (tipo === 'seguro') return value.includes('seguro')
  return false
}

export function filtrarBecas(items, filters, estadoDe) {
  const query = normalizar(filters.busqueda.trim())
  return items.filter((item) => {
    if (filters.pais !== 'todos' && item.pais_destino !== filters.pais) return false
    if (filters.nivel !== 'todos' && !item.nivel.split(';').map((n) => n.trim()).includes(filters.nivel)) return false
    if (filters.area !== 'todas' && categoriaArea(item) !== filters.area) return false
    if (!tieneCobertura(item, filters.cobertura)) return false
    if (filters.estado !== 'todos' && (estadoDe ? estadoDe(item).clave : item.estado_convocatoria) !== filters.estado) return false
    if (filters.mes !== 'todos' && (!/^\d{4}-\d{2}-\d{2}$/.test(item.fecha_cierre) || item.fecha_cierre.slice(5, 7) !== filters.mes)) return false
    if (query && !normalizar([item.nombre, item.entidad_oferente, item.pais_destino, item.area_conocimiento, item.universidad].join(' ')).includes(query)) return false
    return true
  })
}

export function fechaCorta(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Por confirmar'
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

export function textoCobertura(value) {
  return value === DESCONOCIDO ? 'Cobertura por verificar' : value.replaceAll(';', ' · ')
}

export function resumenPais(items) {
  const counter = new Map()
  for (const item of items) counter.set(item.pais_destino, (counter.get(item.pais_destino) || 0) + 1)
  return [...counter.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
}
