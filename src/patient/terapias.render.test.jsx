// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import EditProfileModal from './EditProfileModal.jsx'
import { useDataStore } from '../store/dataStore.js'
import { useAuthStore } from '../store/authStore.js'

// Las terapias del paciente se derivaban de quien lo atiende, y la lista solo
// CRECÍA. No había forma de declarar una disciplina sin asignar antes a una
// especialista de ella — que es al revés de como se trabaja — ni de quitar una
// puesta por error: "Kids Club" se quedó en la ficha de Isaac y de Samson.

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

const NINO = {
  id: 'c-1', name: 'Eliahu', lastName: 'Guindi Zayat',
  specialties: ['Terapia Ocupacional'], assignedSpecialists: ['u-celi'],
  parentContact: {}, status: 'activo',
}
const EQUIPO = [
  { id: 'u-celi', name: 'Celilia Miranda', specialty: 'Terapia Ocupacional', activo: true, role: 'specialist' },
  { id: 'u-ingrid', name: 'Ingrid Villa', specialty: 'Fonoaudiología', activo: true, role: 'specialist' },
]

let guardado
let contenedor = null

beforeEach(() => {
  guardado = vi.fn()
  useDataStore.setState({ users: EQUIPO, updateChild: guardado })
  useAuthStore.setState({
    currentUser: {
      id: 'u-admin', name: 'Sarita',
      permissions: new Set(['patient:edit', 'patient:assign']),
    },
  })
})
afterEach(() => { document.body.innerHTML = ''; contenedor = null })

function pintar() {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => {
    createRoot(contenedor).render(<EditProfileModal child={NINO} onClose={() => {}} />)
  })
  return document.body
}
function pulsar(texto, exacto = false) {
  const b = [...document.querySelectorAll('button')]
    .find((x) => (exacto ? x.textContent.trim() === texto : x.textContent.includes(texto)))
  expect(b, `no hay botón "${texto}"`).toBeTruthy()
  act(() => { b.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
}
function guardar() { pulsar('Guardar') }

describe('terapias del paciente', () => {
  it('hay un campo para marcarlas', () => {
    const c = pintar()
    expect(c.textContent).toContain('Terapias que recibe')
    // Y ofrece las disciplinas que el centro ya conoce.
    expect(c.textContent).toContain('Fonoaudiología')
  })

  it('se puede añadir una sin asignar especialista', () => {
    // Es lo que pedía Sarita: el paciente va a trabajar interdisciplinario y
    // la terapeuta de esa disciplina todavía no está decidida.
    pintar()
    pulsar('Fonoaudiología', true)
    guardar()
    expect(guardado.mock.calls[0][1].specialties).toEqual(
      expect.arrayContaining(['Terapia Ocupacional', 'Fonoaudiología'])
    )
    // Sin tocar quién la atiende.
    expect(guardado.mock.calls[0][1].assignedSpecialists).toEqual(['u-celi'])
  })

  it('se puede QUITAR una puesta por error', () => {
    // Antes la lista solo crecía: concat sobre las que ya había.
    pintar()
    pulsar('Terapia Ocupacional', true)
    guardar()
    expect(guardado.mock.calls[0][1].specialties).toEqual([])
  })

  it('asignar a alguien propone su disciplina', () => {
    pintar()
    pulsar('Ingrid Villa · Fonoaudiología')
    guardar()
    const { specialties, assignedSpecialists } = guardado.mock.calls[0][1]
    expect(specialties).toEqual(expect.arrayContaining(['Fonoaudiología']))
    expect(assignedSpecialists).toEqual(expect.arrayContaining(['u-celi', 'u-ingrid']))
  })

  it('quitar a la especialista NO le quita la terapia al paciente', () => {
    // Un paciente sigue en terapia ocupacional mientras se le cambia de
    // terapeuta; vaciarle la ficha al soltar la asignación sería peor.
    pintar()
    pulsar('Celilia Miranda · Terapia Ocupacional')
    guardar()
    const { specialties, assignedSpecialists } = guardado.mock.calls[0][1]
    expect(specialties).toEqual(['Terapia Ocupacional'])
    expect(assignedSpecialists).toEqual([])
  })

  it('una terapia que el centro aún no tiene en ningún perfil se escribe', () => {
    const c = pintar()
    const caja = [...c.querySelectorAll('input')].find((i) => i.placeholder === 'Otra terapia')
    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
        .set.call(caja, 'Musicoterapia')
      caja.dispatchEvent(new Event('input', { bubbles: true }))
    })
    pulsar('Añadir')
    guardar()
    expect(guardado.mock.calls[0][1].specialties).toEqual(
      expect.arrayContaining(['Musicoterapia'])
    )
  })

  it('quien no puede editar el perfil no ve el campo', () => {
    useAuthStore.setState({
      currentUser: { id: 'u-x', name: 'X', permissions: new Set(['patient:view']) },
    })
    expect(pintar().textContent).not.toContain('Terapias que recibe')
  })
})
