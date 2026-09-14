// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import DocumentoAira, { CONTACTO_AIRA, lineaDeContacto } from './DocumentoAira.jsx'
import { AIRA_TRAZO_URI, AIRA_LOGO_FULL_URI } from '../brand.js'

// El membrete solo se ve cuando alguien manda un documento a un colegio, y
// para entonces ya salio. Estas pruebas fijan lo que no se puede comprobar
// mirando la aplicacion.

let contenedor = null
function pintar(elemento) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  const raiz = createRoot(contenedor)
  act(() => { raiz.render(elemento) })
  return contenedor
}
afterEach(() => { contenedor?.remove(); contenedor = null })

describe('membrete del documento', () => {
  it('lleva el trazo de la hoja oficial y el bloque de marca completo', () => {
    const c = pintar(<DocumentoAira titulo="Minuta"><p>cuerpo</p></DocumentoAira>)
    const fuentes = [...c.querySelectorAll('img')].map((i) => i.getAttribute('src'))
    expect(fuentes).toContain(AIRA_TRAZO_URI)
    // El logo corto dice solo "Aira"; en un documento que sale del centro
    // tiene que leerse "Aira Learning Hub".
    expect(fuentes).toContain(AIRA_LOGO_FULL_URI)
  })

  it('el trazo va recortado en su propia caja, no en la raíz del documento', () => {
    // Es mas ancho que la hoja a proposito. Si se recortara en .doc-imprimible
    // el PDF dejaria de paginar y el expediente se cortaria en la pagina uno.
    const c = pintar(<DocumentoAira titulo="Minuta"><p>cuerpo</p></DocumentoAira>)
    const raiz = c.querySelector('.doc-imprimible')
    expect(raiz.style.overflow).toBe('')

    const trazo = [...c.querySelectorAll('img')].find((i) => i.src === AIRA_TRAZO_URI)
    const caja = trazo.parentElement
    expect(caja.style.overflow).toBe('hidden')
    expect(caja.style.position).toBe('absolute')
    expect(parseFloat(trazo.style.width)).toBeGreaterThan(100)
  })

  it('el trazo termina donde termina la hoja', () => {
    // Con un alto propio, una minuta de media pagina lo sacaba por debajo del
    // pie: en pantalla se pintaba sobre el fondo oscuro del visor y en el PDF
    // se metia en el margen inferior.
    const c = pintar(<DocumentoAira titulo="Minuta"><p>corto</p></DocumentoAira>)
    const caja = [...c.querySelectorAll('img')].find((i) => i.src === AIRA_TRAZO_URI).parentElement
    expect(caja.style.bottom).toBe('0px')
    expect(caja.style.height).toBe('')
    // Y solo puede terminar ahi si la raiz es su bloque contenedor.
    expect(c.querySelector('.doc-imprimible').style.position).toBe('relative')
  })

  it('el trazo queda detrás del texto y no se puede borrar al corregir', () => {
    // El visor deja editar el documento a mano antes de firmarlo; un retroceso
    // mal puesto no debe llevarse el fondo.
    const c = pintar(<DocumentoAira titulo="Minuta"><p>cuerpo</p></DocumentoAira>)
    const caja = [...c.querySelectorAll('img')].find((i) => i.src === AIRA_TRAZO_URI).parentElement
    expect(caja.getAttribute('contenteditable')).toBe('false')
    expect(caja.getAttribute('aria-hidden')).toBe('true')
    expect(caja.style.pointerEvents).toBe('none')
    expect(Number(caja.style.zIndex)).toBeLessThan(
      Number(c.querySelector('header').parentElement.style.zIndex)
    )
  })

  it('el fondo no aporta texto al mensaje que se envía a la familia', () => {
    // ReporteFamilia arma el WhatsApp leyendo el documento entero.
    const c = pintar(<DocumentoAira titulo="Minuta"><p>cuerpo</p></DocumentoAira>)
    const trazo = [...c.querySelectorAll('img')].find((i) => i.src === AIRA_TRAZO_URI)
    expect(trazo.getAttribute('alt')).toBe('')
  })
})

describe('datos de contacto', () => {
  it('no inventa teléfono ni correo', () => {
    // Estuvieron puestos como "+507 6000-0000" e "info@airalearninghub.com", y
    // eso salia impreso en cada documento que iba a un colegio.
    expect(CONTACTO_AIRA.telefono).toBe('')
    expect(CONTACTO_AIRA.correo).toBe('')
  })

  it('el pie solo une los datos que existen', () => {
    expect(lineaDeContacto({ nombre: 'AIRA', ciudad: 'Panamá', telefono: '', correo: '' }))
      .toBe('AIRA · Panamá')
    expect(lineaDeContacto({ nombre: 'AIRA', ciudad: 'Panamá', telefono: '+507 1', correo: 'a@b.c' }))
      .toBe('AIRA · Panamá · +507 1 · a@b.c')
  })

  it('no deja separadores sueltos en el documento impreso', () => {
    const c = pintar(<DocumentoAira titulo="Minuta"><p>cuerpo</p></DocumentoAira>)
    const pie = c.querySelector('footer').textContent
    expect(pie).toContain('AIRA Learning Hub')
    expect(pie.trim()).not.toMatch(/·\s*$/)
    expect(pie).not.toContain('· ·')
  })
})
