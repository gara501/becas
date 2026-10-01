import assert from 'node:assert/strict'
import { cierreConfirmado, crearIcs } from '../src/data/calendario.js'

const item = { id: 'TEST-1', nombre: 'Beca, ciencia; investigación áéíóú y oportunidades internacionales de larga duración', fecha_cierre: '2026-10-12', fecha_ultima_verificacion: '2026-09-30', estado_convocatoria: 'abierta', url_oficial: 'https://example.org/convocatoria' }
assert.equal(cierreConfirmado(item, [], '2026-10-01'), true)
assert.equal(cierreConfirmado(item, ['TEST-1'], '2026-10-01'), false)
assert.equal(cierreConfirmado({ ...item, fecha_cierre: 'No verificado' }, [], '2026-10-01'), false)
assert.equal(cierreConfirmado({ ...item, fecha_cierre: '2026-02-30' }, [], '2026-01-01'), false)
assert.equal(cierreConfirmado({ ...item, fecha_cierre: '2026-09-29' }, [], '2026-10-01'), false)
assert.equal(cierreConfirmado({ ...item, fecha_ultima_verificacion: '2026-08-01' }, [], '2026-10-01'), false)
assert.equal(cierreConfirmado({ ...item, estado_convocatoria: 'cerrada' }, [], '2026-10-01'), false)
const ics = crearIcs(item, new Date('2026-10-01T12:34:56Z'))
const unfolded = ics.replaceAll('\r\n ', '')
assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'))
assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
assert.match(unfolded, /DTSTART;VALUE=DATE:20261012\r\nDTEND;VALUE=DATE:20261013/)
assert.match(unfolded, /SUMMARY:Cierre de postulación: Beca\\, ciencia\\; investigación/)
assert.match(unfolded, /URL:https:\/\/example.org\/convocatoria/)
assert.match(unfolded, /Comprueba el plazo y los requisitos/)
assert.match(unfolded, /DTSTAMP:20261001T123456Z/)
assert.ok(ics.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75))
console.log('Criterios de cierre e ICS de día completo: OK')
