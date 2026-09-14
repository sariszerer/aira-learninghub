// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import AddMeetingModal from './modals/AddMeetingModal.jsx'
import MeetingCard from './MeetingCard.jsx'

// Montar de verdad. Un ReferenceError o un .join sobre una cadena no los ve el
// compilador ni una prueba de funciones puras: la pantalla sale en blanco y
// desde fuera es indistinguible de "no pasó nada".

// jsdom no trae matchMedia, y Modal se apoya en useEsMovil para decidir si es
// una hoja a pantalla completa o un cuadro centrado.
window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

let contenedor = null
// Modal cuelga de <body> con un portal, asi que lo pintado no esta dentro del
// div de montaje: se busca en body.
function pintar(elemento) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => { createRoot(contenedor).render(elemento) })
  return document.body
}
afterEach(() => { document.body.innerHTML = ''; contenedor = null })

// Tal como la devuelve la base: participantes en UNA cadena, tipos en lista.
const MINUTA = {
  id: 'mtg-1', childId: 'c-1', date: '2026-09-10',
  type: ['Con la escuela', 'Con la familia'],
  participants: 'María López, Terapeuta Ocupacional\nMaestra guía de 1°\nMadre',
  summary: 'Se habló del apoyo en el aula.',
  agreements: 'Sentarlo adelante\nAvisar antes de los cambios',
  createdBy: 'u-1',
}
const USUARIOS = [{ id: 'u-1', name: 'Celilia Miranda' }]

describe('editar una minuta ya registrada', () => {
  it('el formulario abre relleno con lo que hay guardado', () => {
    // participants llega como CADENA. participantesATexto hacia .join sobre
    // ella y el modal reventaba en el primer intento de editar.
    const c = pintar(<AddMeetingModal minuta={MINUTA} onClose={() => {}} onSave={() => {}} />)
    const areas = [...c.querySelectorAll('textarea')].map((t) => t.value)
    expect(areas[0]).toContain('María López, Terapeuta Ocupacional')
    expect(areas[0]).toContain('Madre')
    expect(areas[1]).toBe('Se habló del apoyo en el aula.')
    expect(c.querySelector('input[type="date"]').value).toBe('2026-09-10')
    expect(c.textContent).toContain('Editar minuta')
    expect(c.textContent).toContain('Guardar cambios')
  })

  it('conserva id, paciente y quien la registró', () => {
    // Que otra persona corrija una minuta no la convierte en suya.
    const guardado = vi.fn()
    const c = pintar(<AddMeetingModal minuta={MINUTA} onClose={() => {}} onSave={guardado} />)
    const boton = [...c.querySelectorAll('button')].find((b) => b.textContent.includes('Guardar cambios'))
    act(() => { boton.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
    expect(guardado).toHaveBeenCalledTimes(1)
    expect(guardado.mock.calls[0][0]).toMatchObject({
      id: 'mtg-1', childId: 'c-1', createdBy: 'u-1',
    })
  })

  it('sin minuta es el formulario de registrar, no el de editar', () => {
    const c = pintar(<AddMeetingModal onClose={() => {}} onSave={() => {}} />)
    expect(c.textContent).toContain('Registrar minuta')
    expect(c.textContent).not.toContain('Guardar cambios')
    expect([...c.querySelectorAll('textarea')][0].value).toBe('')
  })
})

describe('la ficha de la minuta', () => {
  it('ofrece Editar solo cuando quien mira puede', () => {
    const conPermiso = pintar(<MeetingCard meeting={MINUTA} users={USUARIOS} onEditar={() => {}} />)
    expect(conPermiso.textContent).toContain('Editar')
    document.body.innerHTML = ''

    const sinPermiso = pintar(<MeetingCard meeting={MINUTA} users={USUARIOS} onEditar={null} />)
    expect(sinPermiso.textContent).not.toContain('Editar')
  })

  it('los dos tipos y los participantes salen en la ficha', () => {
    const c = pintar(<MeetingCard meeting={MINUTA} users={USUARIOS} />)
    expect(c.textContent).toContain('Con la escuela')
    expect(c.textContent).toContain('Con la familia')
    expect(c.querySelectorAll('ul li').length).toBeGreaterThanOrEqual(3)
  })
})
