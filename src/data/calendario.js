import { fechaHoyColombia } from './vigencia.js'

const ISO = /^\d{4}-\d{2}-\d{2}$/
const MAX_AGE_DAYS = 30
const validDate = (value) => {
  if (!ISO.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function cierreConfirmado(item, pendientes = [], hoy = fechaHoyColombia()) {
  if (!validDate(item.fecha_cierre) || item.fecha_cierre < hoy || pendientes.includes(item.id)) return false
  if (!validDate(item.fecha_ultima_verificacion) || !item.url_oficial?.startsWith('https://')) return false
  if (item.estado_convocatoria === 'cerrada') return false
  const age = Math.floor((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${item.fecha_ultima_verificacion}T12:00:00Z`)) / 86400000)
  return age >= 0 && age <= MAX_AGE_DAYS
}

const escapeText = (value) => String(value).replaceAll('\\', '\\\\').replace(/\r\n|\n|\r/g, '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;')

function foldLine(line) {
  const encoder = new TextEncoder()
  const parts = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > 75) { parts.push(current); current = ' '; bytes = 1 }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n')
}

export function crearIcs(item, now = new Date()) {
  if (!validDate(item.fecha_cierre)) throw new Error('La beca no tiene fecha de cierre válida')
  const date = new Date(`${item.fecha_cierre}T12:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== item.fecha_cierre) throw new Error('Fecha de cierre inválida')
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + 1)
  const basic = (value) => value.replaceAll('-', '')
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const description = `Comprueba el plazo y los requisitos en la convocatoria oficial antes de postular. Las fechas pueden cambiar por edición.\nFuente: ${item.url_oficial}`
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Atlas Becas//Cierres verificados//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${item.id}-${basic(item.fecha_cierre)}@gara501.github.io`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${basic(item.fecha_cierre)}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replaceAll('-', '')}`,
    `SUMMARY:${escapeText(`Cierre de postulación: ${item.nombre}`)}`, `DESCRIPTION:${escapeText(description)}`,
    `URL:${item.url_oficial}`, 'TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR',
  ]
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

export function descargarIcs(item) {
  const blob = new Blob([crearIcs(item)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cierre-${item.id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.ics`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
