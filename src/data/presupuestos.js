// Piloto: cada importe procede de la URL oficial indicada junto al componente.
export const FECHA_PRECIOS = '2026-10-01'

const maastricht = 'https://www.maastrichtuniversity.nl/studeren/toelating-inschrijving/financing-your-studies/scholarships/maastricht-university-nl-high'
const salford = 'https://www.salford.ac.uk/askus/money/living-in-salford-and-manchester'
const lund = 'https://www.lunduniversity.lu.se/node/79'

// Un rango siempre corresponde a una misma moneda. null significa No verificado.
export const PRESUPUESTOS = {
  'MAASTRICHT-NLHP-2027': {
    ciudad: 'Maastricht', moneda: 'EUR', duracion: 13,
    supuesto: 'Máster de un año: la beca publica 13 meses. El programa específico y su matrícula deben confirmarse.',
    mensual: [
      { nombre: 'Vivienda', minimo: 960, maximo: 960, fuente: maastricht },
      { nombre: 'Alimentación e higiene', minimo: 160, maximo: 160, fuente: maastricht },
      { nombre: 'Transporte local', minimo: 100, maximo: 100, fuente: maastricht },
      { nombre: 'Teléfono, libros y otros', minimo: 330, maximo: 330, fuente: maastricht },
    ],
    unaVez: [
      { nombre: 'Seguro médico y responsabilidad', minimo: 700, maximo: 700, fuente: maastricht, clave: 'seguro' },
      { nombre: 'Permiso y visado', minimo: 254, maximo: 254, fuente: 'https://www.maastrichtuniversity.nl/studeren/toelating-inschrijving/visa-legal-residence', clave: 'visa' },
      { nombre: 'Limpieza inicial de vivienda', minimo: 75, maximo: 75, fuente: maastricht },
    ],
    faltantes: ['Pasaje Colombia–Países Bajos', 'Matrícula exacta del máster (cubierta a costo por la beca)', 'Posible tasa de admisión del programa'],
    opciones: [{ id: 'beca', nombre: 'Beca concedida', cobertura: { manutencion: 20150, seguro: 700, visa: 254, matricula: 'total' }, fuente: maastricht }],
    nota: 'La limpieza (€75) y el pasaje son personales. La asignación mensual oficial suma €1.550; no se proyecta el segundo año porque la vivienda cambia.',
  },
  'SALFORD-ICETEX-2027': {
    ciudad: 'Salford', moneda: 'GBP', duracion: 12,
    supuesto: 'Máster de un año. Renta privada de estudiante individual; servicios aparte. La matrícula exacta depende del programa.',
    mensual: [
      { nombre: 'Vivienda', minimo: 1100, maximo: 1300, fuente: salford },
      { nombre: 'Servicios', minimo: 80, maximo: 250, fuente: salford },
      { nombre: 'Alimentación', minimo: 100, maximo: 250, fuente: salford },
      { nombre: 'Transporte local', minimo: 63.3, maximo: 63.3, fuente: salford },
      { nombre: 'Libros, ropa, lavandería, móvil y ocio', minimo: 277, maximo: 387, fuente: salford },
    ],
    unaVez: [
      { nombre: 'Matrícula internacional 2027/28', minimo: 16920, maximo: 22140, fuente: 'https://www.salford.ac.uk/international/fees-and-funding', clave: 'matricula' },
      { nombre: 'Visa de estudiante', minimo: 558, maximo: 558, fuente: 'https://www.gov.uk/government/publications/visa-regulations-revised-table/home-office-immigration-and-nationality-fees-8-april-2026' },
      { nombre: 'Recargo de salud: referencia 1 año', minimo: 776, maximo: 776, fuente: 'https://www.gov.uk/healthcare-immigration-application/how-much-pay' },
    ],
    faltantes: ['Pasaje Colombia–Reino Unido', 'Depósito de vivienda', 'Recargo de salud adicional si la visa dura más de un año'],
    opciones: [
      { id: 'descuento', nombre: 'Descuento de £5.000 concedido', cobertura: { matricula: 5000 }, fuente: 'https://web.icetex.gov.co/es/-/descuentos-maestrias-university-salford' },
      { id: 'total', nombre: 'Exención total concedida', cobertura: { matricula: 'total' }, fuente: 'https://web.icetex.gov.co/es/-/descuentos-maestrias-university-salford' },
    ],
    nota: 'La tarifa publicada abarca varios cursos y niveles: pide la del máster elegido. El depósito universitario de £5.500 se descuenta de matrícula, por eso no se suma otra vez. El recargo de salud real depende de la duración de la visa.',
  },
  'LUND-KAMPRAD-2026': {
    ciudad: 'Lund', moneda: 'SEK', duracion: 24,
    supuesto: 'Máster de Diseño Industrial de dos años. Se mantienen los precios mensuales actuales durante 24 meses, sin inflación.',
    mensual: [
      { nombre: 'Vivienda', minimo: 4000, maximo: 8000, fuente: lund },
      { nombre: 'Alimentación', minimo: 3000, maximo: 3000, fuente: lund },
      { nombre: 'Libros', minimo: 400, maximo: 1000, fuente: lund },
      { nombre: 'Otros gastos', minimo: 1500, maximo: 1500, fuente: lund },
    ],
    unaVez: [
      { nombre: 'Matrícula: programa completo', minimo: 540000, maximo: 540000, fuente: 'https://www.lunduniversity.lu.se/study/industrial-design-masters-programme-TAIDE', clave: 'matricula' },
      { nombre: 'Permiso de residencia', minimo: 1500, maximo: 1500, fuente: 'https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html' },
      { nombre: 'Solicitud de admisión', minimo: 900, maximo: 900, fuente: 'https://www.universityadmissions.se/en/fees-scholarships-residence-permit/terms-and-conditions/' },
    ],
    faltantes: ['Pasaje Colombia–Suecia', 'Depósito y equipamiento inicial de vivienda', 'Seguro adicional: FAS+ universitario, alcance personal por confirmar'],
    opciones: [
      { id: 'matricula', nombre: 'Solo apoyo de matrícula', cobertura: { matricula: 540000 }, fuente: 'https://www.lunduniversity.lu.se/node/9667' },
      { id: 'manutencion', nombre: 'Solo apoyo de manutención', cobertura: { manutencion: 256800 }, fuente: 'https://www.lunduniversity.lu.se/node/9667' },
      { id: 'ambas', nombre: 'Ambos apoyos concedidos', cobertura: { matricula: 540000, manutencion: 256800 }, fuente: 'https://www.lunduniversity.lu.se/node/9667' },
    ],
    nota: 'Las dos modalidades se adjudican por separado; poder solicitarlas no garantiza recibir ambas. El presupuesto mensual de Lund no desglosa transporte: no se inventa una tarifa.',
  },
  'LUND-GLOBAL-2026': {
    ciudad: 'Lund', moneda: 'SEK', duracion: null,
    supuesto: 'La duración y matrícula dependen del programa admitido. El porcentaje de exención se comunica al beneficiario.',
    mensual: [
      { nombre: 'Vivienda', minimo: 4000, maximo: 8000, fuente: lund },
      { nombre: 'Alimentación', minimo: 3000, maximo: 3000, fuente: lund },
      { nombre: 'Libros', minimo: 400, maximo: 1000, fuente: lund },
      { nombre: 'Otros gastos', minimo: 1500, maximo: 1500, fuente: lund },
    ],
    unaVez: [],
    faltantes: ['Duración del programa', 'Matrícula y porcentaje concedido', 'Pasaje Colombia–Suecia', 'Visa, seguro y gastos iniciales según situación'],
    opciones: [],
    nota: 'La beca cubre matrícula parcial o total, pero sin carta de adjudicación no hay descuento cuantificable ni aporte personal calculable.',
  },
}

const sumar = (items, lado) => items.reduce((total, item) => total + item[lado], 0)

export function calcularPresupuesto(presupuesto, opcionId) {
  const mensual = { minimo: sumar(presupuesto.mensual, 'minimo'), maximo: sumar(presupuesto.mensual, 'maximo') }
  if (!presupuesto.duracion) return { mensual, subtotal: null, aporte: null, opcion: null }
  const opcion = presupuesto.opciones.find((item) => item.id === opcionId) ?? presupuesto.opciones[0] ?? null
  const calcularLado = (lado) => {
    const vida = mensual[lado] * presupuesto.duracion
    const otros = sumar(presupuesto.unaVez.filter((item) => item.clave !== 'matricula'), lado)
    const matricula = sumar(presupuesto.unaVez.filter((item) => item.clave === 'matricula'), lado)
    const total = vida + otros + matricula
    if (!opcion) return { total, personal: null }
    const apoyo = opcion.cobertura
    const descuentoVida = Math.min(vida, apoyo.manutencion ?? 0)
    const descuentoMatricula = Math.min(matricula, apoyo.matricula === 'total' ? matricula : apoyo.matricula ?? 0)
    const descuentoOtros = presupuesto.unaVez.filter((item) => item.clave !== 'matricula').reduce((sum, item) => sum + Math.min(item[lado], apoyo[item.clave] ?? 0), 0)
    return { total, personal: Math.max(0, total - descuentoVida - descuentoMatricula - descuentoOtros) }
  }
  const minimo = calcularLado('minimo')
  const maximo = calcularLado('maximo')
  return { mensual, subtotal: { minimo: minimo.total, maximo: maximo.total }, aporte: opcion ? { minimo: minimo.personal, maximo: maximo.personal } : null, opcion }
}
