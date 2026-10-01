import assert from 'node:assert/strict'
import { calcularPresupuesto, PRESUPUESTOS } from '../src/data/presupuestos.js'

const maastricht = calcularPresupuesto(PRESUPUESTOS['MAASTRICHT-NLHP-2027'])
assert.deepEqual(maastricht.mensual, { minimo: 1550, maximo: 1550 })
assert.deepEqual(maastricht.aporte, { minimo: 75, maximo: 75 })

const salford = calcularPresupuesto(PRESUPUESTOS['SALFORD-ICETEX-2027'], 'total')
assert.equal(Math.round(salford.aporte.minimo), 20778)
assert.equal(Math.round(salford.aporte.maximo), 28338)

const lund = calcularPresupuesto(PRESUPUESTOS['LUND-KAMPRAD-2026'], 'ambas')
assert.deepEqual(lund.aporte, { minimo: 2400, maximo: 69600 })

const incompleto = calcularPresupuesto(PRESUPUESTOS['LUND-GLOBAL-2026'])
assert.equal(incompleto.subtotal, null)
assert.equal(incompleto.aporte, null)

console.log('Presupuestos: descuentos limitados al componente, rangos y datos incompletos correctos.')
