// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import VisorPdf from './VisorPdf.jsx'

// El adjunto se muestra dentro de la aplicación. Antes salía por window.open y
// el aviso decía "el navegador bloqueó la ventana" cuando nadie la había
// bloqueado: con "noopener", window.open devuelve null siempre.

URL.createObjectURL = vi.fn(() => 'blob:prueba')
URL.revokeObjectURL = vi.fn()

let contenedor = null
function pintar(elemento) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => { createRoot(contenedor).render(elemento) })
  return document.body
}
afterEach(() => { document.body.innerHTML = ''; contenedor = null })

const CON_PDF = { pdfData: 'data:application/pdf;base64,QUFB', pdfName: 'PT- ELIAHU.pdf' }

describe('VisorPdf', () => {
  it('muestra el PDF en un iframe, no en una ventana nueva', () => {
    const abrir = vi.fn()
    vi.stubGlobal('open', abrir)
    const c = pintar(<VisorPdf fields={CON_PDF} titulo="PT- ELIAHU" onClose={() => {}} />)
    const marco = c.querySelector('iframe')
    expect(marco).toBeTruthy()
    expect(marco.getAttribute('src')).toBe('blob:prueba')
    expect(abrir).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('pasa la data URL por un blob', () => {
    // Navegar a data: lo bloquean Chrome y Safari desde hace años, sin avisar.
    pintar(<VisorPdf fields={CON_PDF} onClose={() => {}} />)
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(document.querySelector('iframe').src).not.toContain('data:')
  })

  it('ofrece descargarlo con su nombre', () => {
    const c = pintar(<VisorPdf fields={CON_PDF} onClose={() => {}} />)
    const enlace = [...c.querySelectorAll('a')].find((a) => a.hasAttribute('download'))
    expect(enlace.getAttribute('download')).toBe('PT- ELIAHU.pdf')
  })

  it('un documento sin adjunto lo dice, no se queda en blanco', () => {
    const c = pintar(<VisorPdf fields={{}} onClose={() => {}} />)
    expect(c.querySelector('iframe')).toBeNull()
    expect(c.textContent).toContain('no tiene ningún PDF adjunto')
  })

  it('suelta el blob al cerrarse', () => {
    URL.revokeObjectURL.mockClear()
    const c = document.createElement('div')
    document.body.appendChild(c)
    const raiz = createRoot(c)
    act(() => { raiz.render(<VisorPdf fields={CON_PDF} onClose={() => {}} />) })
    act(() => { raiz.unmount() })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:prueba')
  })
})
