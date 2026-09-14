// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import InterdisciplinaryTab from './tabs/InterdisciplinaryTab.jsx'

// Las dos secciones estaban una debajo de la otra. Funcionaba mientras
// estuvieran vacías: con una minuta de veinte líneas dentro, Pautas de Crianza
// quedaba a pantalla y media de scroll y dejaba de existir.

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

const NINO = { id: 'c-1', name: 'Eliauh', lastName: 'Guindi' }
const USUARIOS = [
  { id: 'u-admin', name: 'Sarita Szerer' },
  { id: 'u-celi', name: 'Celilia Miranda' },
]
const MINUTA = {
  id: 'mtg-1', childId: 'c-1', date: '2026-09-14', type: ['Escuela'],
  participants: 'Cristina Ramos\nMeli Benamu', summary: 'Observaciones en el aula.',
  agreements: '', createdBy: 'u-admin',
}
const PAUTAS = {
  id: 'd-1', childId: 'c-1', type: 'pautas_crianza', date: '2026-09-10',
  title: 'Pautas', notes: 'Trabajo con la madre.', authorId: 'u-celi', fields: {},
}
const CON_TODO = { permissions: new Set(['guidelines:view', 'meeting:view']), id: 'u-admin' }
const SIN_PAUTAS = { permissions: new Set(['meeting:view']), id: 'u-celi' }

let contenedor = null
function pintar(currentUser, documents = [PAUTAS]) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => {
    createRoot(contenedor).render(
      <InterdisciplinaryTab
        child={NINO} meetings={[MINUTA]} users={USUARIOS} documents={documents}
        currentUser={currentUser} onAddMeeting={() => {}} onAddDocument={() => {}}
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

describe('pestañas del interdisciplinario', () => {
  it('abre en minutas y no muestra Pautas hasta que se pide', () => {
    const c = pintar(CON_TODO)
    expect(c.textContent).toContain('Observaciones en el aula.')
    expect(c.textContent).not.toContain('Trabajo con la madre.')
  })

  it('la pestaña lleva el recuento, para no tener que entrar a mirar', () => {
    const c = pintar(CON_TODO)
    expect(c.textContent).toContain('Minutas · 1')
    expect(c.textContent).toContain('Pautas de Crianza · 1')
  })

  it('cambiar de pestaña cambia lo que se ve', () => {
    pintar(CON_TODO)
    pulsar('Pautas de Crianza')
    expect(document.body.textContent).toContain('Trabajo con la madre.')
    expect(document.body.textContent).not.toContain('Observaciones en el aula.')
  })

  it('quien no puede ver Pautas no ve ni el riel de pestañas', () => {
    // Un control para elegir entre una sola cosa es ruido.
    const c = pintar(SIN_PAUTAS)
    expect(c.textContent).not.toContain('Pautas de Crianza')
    expect(c.textContent).toContain('Observaciones en el aula.')
  })

  it('sin contenido la pestaña no inventa un recuento', () => {
    const c = pintar(CON_TODO, [])
    expect(c.textContent).toContain('Minutas · 1')
    expect(c.textContent).toContain('Pautas de Crianza')
    expect(c.textContent).not.toContain('Pautas de Crianza · 0')
  })

  it('el autor de la sesión sale del registro, no escrito a mano', () => {
    // Decía "Sarita Szerer" en todas, estuviera escrita por quien estuviera.
    pintar(CON_TODO)
    pulsar('Pautas de Crianza')
    expect(document.body.textContent).toContain('Celilia Miranda')
  })
})
