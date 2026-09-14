import { describe, it, expect, vi } from 'vitest'
import { datosDelPdf, nombreDelPdf, tienePdf, pdfComoBlob } from './adjuntos.js'

describe('datosDelPdf', () => {
  it('acepta los dos nombres que conviven en la base', () => {
    // Los documentos del paciente guardan pdfData; los formatos del gabinete,
    // pdfDatos. Hay expedientes reales con cada uno.
    expect(datosDelPdf({ pdfData: 'data:application/pdf;base64,AAA' })).toContain('AAA')
    expect(datosDelPdf({ pdfDatos: 'data:application/pdf;base64,BBB' })).toContain('BBB')
  })

  it('sin adjunto devuelve null, no undefined', () => {
    expect(datosDelPdf({})).toBeNull()
    expect(datosDelPdf()).toBeNull()
  })
})

describe('nombreDelPdf', () => {
  it('acepta los dos nombres', () => {
    expect(nombreDelPdf({ pdfName: 'plan.pdf' })).toBe('plan.pdf')
    expect(nombreDelPdf({ pdfNombre: 'acta.pdf' })).toBe('acta.pdf')
  })

  it('cae a un nombre genérico en vez de quedarse vacío', () => {
    expect(nombreDelPdf({})).toBe('documento.pdf')
  })
})

describe('tienePdf', () => {
  it('es falso cuando solo está el campo fantasma', () => {
    // pdfUrl no lo escribe ninguna pantalla: el enlace apuntaba ahí y siempre
    // valía undefined, así que "Ver PDF" no hacía nada.
    expect(tienePdf({ pdfUrl: undefined })).toBe(false)
    expect(tienePdf({ pdfData: 'data:application/pdf;base64,AAA' })).toBe(true)
  })
})

describe('pdfComoBlob', () => {
  it('convierte la data URL en un blob del tipo correcto', () => {
    // Chrome y Safari bloquean navegar a data: desde hace anos, sin avisar,
    // asi que el adjunto tiene que pasar por un blob para poder mostrarse.
    const blob = pdfComoBlob('data:application/pdf;base64,QUFB')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
  })

  it('una URL normal se deja como esta', () => {
    expect(pdfComoBlob('https://x.test/plan.pdf')).toBe(null)
  })

  it('sin datos no inventa un blob', () => {
    expect(pdfComoBlob(null)).toBe(null)
    expect(pdfComoBlob('')).toBe(null)
  })
})

// Ya no existe abrirPdf.
//
// Abria el adjunto con window.open(url, "_blank", "noopener") y comprobaba si
// devolvia null para saber si el navegador habia bloqueado la ventana. Esa
// comprobacion era falsa: con "noopener" window.open devuelve null SIEMPRE,
// por especificacion, porque no hay handle que devolver. Asi que el aviso
// "permite las ventanas emergentes" salia sin que nadie hubiera bloqueado
// nada, y de paso se revocaba el blob, que dejaba en blanco la pestana que si
// se habia abierto. La prueba de entonces daba por buena esa lectura porque
// simulaba window.open a mano.
//
// Lo sustituye VisorPdf, que lo muestra en un <iframe> dentro de la
// aplicacion: no hay ventana que bloquear.
describe('no queda rastro de abrirPdf', () => {
  it('la funcion ya no se exporta', async () => {
    const modulo = await import('./adjuntos.js')
    expect(modulo.abrirPdf).toBeUndefined()
  })
})
