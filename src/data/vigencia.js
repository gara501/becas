const ISO = /^\d{4}-\d{2}-\d{2}$/

export function fechaHoyColombia(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function estadoVigente(item, pendientes = [], hoy = fechaHoyColombia()) {
  const pendiente = pendientes.includes(item.id)
  const cierre = ISO.test(item.fecha_cierre) ? item.fecha_cierre : null
  const apertura = ISO.test(item.fecha_apertura) ? item.fecha_apertura : null
  const verificacion = ISO.test(item.fecha_ultima_verificacion) ? item.fecha_ultima_verificacion : null
  const diasDesdeVerificacion = verificacion ? Math.floor((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${verificacion}T12:00:00Z`)) / 86400000) : Infinity
  if (item.estado_convocatoria === 'cerrada') return { clave: 'cerrada', etiqueta: 'Cerrada', pendiente, motivo: null }
  if (item.estado_convocatoria === 'recurrente') return { clave: 'recurrente', etiqueta: 'Recurrente', pendiente, motivo: cierre && cierre < hoy ? 'El plazo mostrado corresponde a una edición anterior.' : null }
  if (cierre && cierre < hoy) return { clave: 'cerrada', etiqueta: 'Cerrada', pendiente, motivo: 'Plazo vencido según la fecha publicada.' }
  if (apertura && apertura > hoy) return { clave: 'proxima', etiqueta: 'Próxima apertura', pendiente, motivo: null }
  if (pendiente || !cierre || diasDesdeVerificacion > 30) return { clave: 'pendiente', etiqueta: 'Por confirmar', pendiente: true, motivo: 'La apertura de esta edición necesita una nueva confirmación.' }
  return { clave: 'abierta', etiqueta: 'Abierta ahora', pendiente: false, motivo: null }
}

export function cierraPronto(item, pendientes = [], hoy = fechaHoyColombia()) {
  if (estadoVigente(item, pendientes, hoy).clave !== 'abierta') return false
  const limite = new Date(`${hoy}T12:00:00Z`)
  limite.setUTCDate(limite.getUTCDate() + 30)
  return item.fecha_cierre <= limite.toISOString().slice(0, 10)
}

export function ordenarBecas(items, orden = 'nombre') {
  const collator = new Intl.Collator('es', { sensitivity: 'base' })
  return [...items].sort((a, b) => {
    if (orden === 'cierre') return (ISO.test(a.fecha_cierre) ? a.fecha_cierre : '9999-99-99').localeCompare(ISO.test(b.fecha_cierre) ? b.fecha_cierre : '9999-99-99') || collator.compare(a.nombre, b.nombre)
    if (orden === 'pais') return collator.compare(a.pais_destino, b.pais_destino) || collator.compare(a.nombre, b.nombre)
    if (orden === 'nivel') return collator.compare(a.nivel.split(';')[0], b.nivel.split(';')[0]) || collator.compare(a.nombre, b.nombre)
    return collator.compare(a.nombre, b.nombre)
  })
}
