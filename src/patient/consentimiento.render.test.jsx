// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import BloqueConsentimiento from './BloqueConsentimiento.jsx'
import { DOC_TYPES } from '../constants.js'

// El consentimiento vivía dentro del formulario de anamnesis: solo se podía
// pedir si la anamnesis se llenaba EN la plataforma. De 45 expedientes hay 4
// firmados, y los demás no tenían ni dónde pedirlo.

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

const NINO = { id: 'c-1', name: 'Isaac', lastName: 'Schachtel', tipo: 'nino' }
const USUARIO = { id: 'u-admin', name: 'Sarita' }

let contenedor = null
function pintar(documents, extra = {}) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => {
    createRoot(contenedor).render(
      <BloqueConsentimiento
        child={NINO} documents={documents} currentUser={USUARIO} puedeEditar
        onAddDocument={() => {}} onUpdateDocument={() => {}}
        {...extra}
      />
    )
  })
  return document.body
}
function pulsar(texto) {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(texto))
  act(() => { b.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
}
afterEach(() => { document.body.innerHTML = ''; contenedor = null })

describe('estado del consentimiento', () => {
  it('sin nada, lo dice en rojo y explica que se puede pedir igual', () => {
    const c = pintar([])
    expect(c.textContent).toContain('Sin consentimiento')
    expect(c.textContent).toContain('aunque la anamnesis esté en PDF')
  })

  it('se puede pedir aunque la anamnesis sea un PDF', () => {
    // Es el caso de Sarita: la anamnesis escaneada no daba acceso al enlace.
    const pdf = { id: 'd-1', childId: 'c-1', type: 'anamnesis', fields: { pdfData: 'data:application/pdf;base64,QQ==' } }
    const c = pintar([pdf])
    expect(c.textContent).toContain('Sin consentimiento')
    expect([...c.querySelectorAll('button')].some((b) => b.textContent.includes('Generar enlace'))).toBe(true)
  })

  it('con enlace abierto avisa de que nadie lo ha usado', () => {
    const d = { id: 'd-consent-c-1', childId: 'c-1', type: 'consentimiento', fields: { consentToken: 'abc' } }
    expect(pintar([d]).textContent).toContain('sin firmar')
  })

  it('firmado a distancia enseña la rúbrica', () => {
    const d = { id: 'd-consent-c-1', childId: 'c-1', type: 'consentimiento', fields: { firmaAcudienteImg: 'data:image/png;base64,QQ==' } }
    const c = pintar([d])
    expect(c.textContent).toContain('Firmado')
    expect(c.querySelector('img')).toBeTruthy()
  })

  it('reconoce el firmado viejo que quedó dentro de la anamnesis', () => {
    // Los cuatro que hay no se migran: una firma es la prueba de que alguien
    // autorizó algo, y moverla de fila por comodidad no se hace.
    const viejo = { id: 'd-a', childId: 'c-1', type: 'anamnesis', fields: { firmaAcudiente: 'Adela Guindi', fechaFirma: '2026-03-01' } }
    const c = pintar([viejo])
    expect(c.textContent).toContain('Firmado')
    expect(c.textContent).toContain('Adela Guindi')
  })
})

describe('pedir la firma', () => {
  it('el enlace se crea sobre un documento propio, no sobre la anamnesis', () => {
    const guardado = vi.fn()
    pintar([], { onAddDocument: guardado })
    pulsar('Generar enlace')
    expect(guardado).toHaveBeenCalledTimes(1)
    const doc = guardado.mock.calls[0][0]
    expect(doc.type).toBe('consentimiento')
    expect(doc.childId).toBe('c-1')
    expect(doc.fields.consentToken).toBeTruthy()
  })

  it('el texto firmado viaja con el documento', () => {
    // La pantalla de firma solo ve el documento. Adivinar el texto ahí fue lo
    // que le pidió a una madre que autorizara como representante legal.
    const guardado = vi.fn()
    pintar([], { onAddDocument: guardado })
    pulsar('Generar enlace')
    const { fields } = guardado.mock.calls[0][0]
    expect(fields.consentTitulo).toBeTruthy()
    expect(fields.consentTexto).toBeTruthy()
    expect(fields.consentChildName).toBe('Isaac Schachtel')
  })

  it('firmar en persona pide el nombre antes de registrar', () => {
    const guardado = vi.fn()
    pintar([], { onAddDocument: guardado })
    pulsar('Firmó en persona')
    pulsar('Registrar')
    expect(guardado).not.toHaveBeenCalled()
  })

  it('quien no puede editar no ve ningún botón', () => {
    const c = pintar([], { puedeEditar: false })
    expect(c.textContent).toContain('Sin consentimiento')
    expect([...c.querySelectorAll('button')]).toHaveLength(0)
  })
})

describe('tipos de documento nuevos', () => {
  it('Formularios y Consentimientos tienen su pestaña', () => {
    // Los formatos en papel acababan de "Informe", que es otra cosa.
    expect(DOC_TYPES.formulario.plural).toBe('Formularios')
    expect(DOC_TYPES.consentimiento.plural).toBe('Consentimientos')
  })
})
