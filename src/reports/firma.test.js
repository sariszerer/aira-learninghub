import { describe, it, expect } from 'vitest'
import { puedeFirmar, estadoDeFirma, validarArchivoDeFirma } from './firma.js'

const ana  = { id: 'u-ana', firma: 'data:image/png;base64,AAA' }
const sara = { id: 'u-sara', firma: 'data:image/png;base64,BBB' }
const sinRubrica = { id: 'u-neyma', firma: null }

describe('puedeFirmar', () => {
  it('solo el responsable firma su propio reporte', () => {
    expect(puedeFirmar(ana, ana)).toBe(true)
  })

  it('nadie firma por otro, ni teniendo su rúbrica guardada', () => {
    // Es el punto de la regla: la rúbrica está en la base y cualquiera con
    // permiso de reportes podría estampar la de otra persona.
    expect(puedeFirmar(sara, ana)).toBe(false)
  })

  it('falla cerrado sin usuario o sin responsable', () => {
    expect(puedeFirmar(null, ana)).toBe(false)
    expect(puedeFirmar(ana, null)).toBe(false)
  })
})

describe('estadoDeFirma', () => {
  it('ya aplicada se muestra firmada', () => {
    expect(estadoDeFirma({ firmante: ana, responsable: ana, aplicada: true })).toBe('firmada')
  })

  it('su propio reporte con rúbrica: se le ofrece firmar', () => {
    expect(estadoDeFirma({ firmante: ana, responsable: ana, aplicada: false })).toBe('puede')
  })

  it('su propio reporte sin rúbrica: se le pide subirla', () => {
    expect(estadoDeFirma({ firmante: sinRubrica, responsable: sinRubrica, aplicada: false })).toBe('sin_firma')
  })

  it('reporte de otra: línea en blanco, no botón', () => {
    // Sin este caso el documento saldría del centro sin espacio donde firmar.
    expect(estadoDeFirma({ firmante: sara, responsable: ana, aplicada: false })).toBe('linea')
  })
})

describe('validarArchivoDeFirma', () => {
  it('acepta un PNG pequeño', () => {
    expect(validarArchivoDeFirma({ type: 'image/png', size: 12000 })).toBeNull()
  })

  it('rechaza un PDF', () => {
    expect(validarArchivoDeFirma({ type: 'application/pdf', size: 1000 })).toMatch(/PNG/)
  })

  it('rechaza una imagen enorme', () => {
    // Va incrustada como data URL en la fila del usuario y viaja en cada carga.
    expect(validarArchivoDeFirma({ type: 'image/png', size: 900 * 1024 })).toMatch(/300 KB/)
  })
})
