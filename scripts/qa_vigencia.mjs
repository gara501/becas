import assert from 'node:assert/strict'
import { cierraPronto, estadoVigente, ordenarBecas } from '../src/data/vigencia.js'
const hoy = '2026-09-30'
const item = (overrides = {}) => ({ id: 'A', nombre: 'A', pais_destino: 'Alemania', nivel: 'maestría', estado_convocatoria: 'abierta', fecha_apertura: '2026-09-01', fecha_cierre: '2026-10-12', fecha_ultima_verificacion: hoy, ...overrides })
assert.equal(estadoVigente(item(), [], hoy).clave, 'abierta')
assert.equal(cierraPronto(item(), [], hoy), true)
assert.equal(estadoVigente(item({ fecha_cierre: '2026-09-29' }), [], hoy).clave, 'cerrada')
assert.equal(estadoVigente(item({ fecha_apertura: '2026-10-01' }), [], hoy).clave, 'proxima')
assert.equal(estadoVigente(item({ estado_convocatoria: 'recurrente', fecha_cierre: '2026-02-01' }), [], hoy).clave, 'recurrente')
assert.equal(estadoVigente(item({ estado_convocatoria: 'recurrente', fecha_apertura: '2026-10-01', fecha_cierre: '2027-02-01' }), [], '2026-10-01').clave, 'abierta')
assert.equal(estadoVigente(item({ estado_convocatoria: 'recurrente', fecha_apertura: '2026-10-05', fecha_cierre: '2026-11-15' }), [], '2026-10-01').clave, 'recurrente')
assert.equal(estadoVigente(item(), ['A'], hoy).clave, 'pendiente')
assert.equal(estadoVigente(item({ fecha_ultima_verificacion: '2026-08-01' }), [], hoy).clave, 'pendiente')
assert.equal(cierraPronto(item({ fecha_cierre: '2026-11-01' }), [], hoy), false)
assert.deepEqual(ordenarBecas([item({ id: 'B', fecha_cierre: 'No verificado', nombre: 'B' }), item()], 'cierre').map(({ id }) => id), ['A', 'B'])
console.log('Vigencia, revisión, plazo y orden: OK')
