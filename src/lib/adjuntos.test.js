import { describe, it, expect, vi } from 'vitest'
import { datosDelPdf, nombreDelPdf, tienePdf, abrirPdf } from './adjuntos.js'

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

describe('abrirPdf', () => {
  it('avisa en vez de callarse cuando no hay nada que abrir', () => {
    const alFallar = vi.fn()
    expect(abrirPdf({}, { alFallar })).toBe(false)
    expect(alFallar).toHaveBeenCalledWith(expect.stringContaining('no tiene'))
  })

  it('una URL normal se abre tal cual', () => {
    const abrir = vi.fn(() => ({}))
    vi.stubGlobal('window', { open: abrir })
    expect(abrirPdf({ pdfUrl: 'https://x.test/plan.pdf' })).toBe(true)
    expect(abrir).toHaveBeenCalledWith('https://x.test/plan.pdf', '_blank', 'noopener')
    vi.unstubAllGlobals()
  })

  it('una data URL NO se navega directamente', () => {
    // Chrome y Safari bloquean la navegación de nivel superior hacia data:
    // desde hace años, sin avisar. Tiene que convertirse en blob.
    const abrir = vi.fn(() => ({}))
    const crear = vi.fn(() => 'blob:x')
    vi.stubGlobal('window', { open: abrir })
    vi.stubGlobal('URL', { createObjectURL: crear, revokeObjectURL: vi.fn() })
    vi.stubGlobal('Blob', class { constructor() {} })
    vi.stubGlobal('atob', () => 'PDF')

    abrirPdf({ pdfData: 'data:application/pdf;base64,QUFB' })

    expect(crear).toHaveBeenCalled()
    expect(abrir.mock.calls[0][0]).toBe('blob:x')
    vi.unstubAllGlobals()
  })

  it('avisa si el navegador bloquea la ventana', () => {
    const alFallar = vi.fn()
    vi.stubGlobal('window', { open: () => null })
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() })
    vi.stubGlobal('Blob', class { constructor() {} })
    vi.stubGlobal('atob', () => 'PDF')

    expect(abrirPdf({ pdfData: 'data:application/pdf;base64,QUFB' }, { alFallar })).toBe(false)
    expect(alFallar).toHaveBeenCalledWith(expect.stringContaining('emergentes'))
    vi.unstubAllGlobals()
  })
})
