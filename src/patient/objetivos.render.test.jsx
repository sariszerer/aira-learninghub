// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import ObjetivosTab from './tabs/ObjetivosTab.jsx'
import { useDataStore } from '../store/dataStore.js'
import { useAuthStore } from '../store/authStore.js'

// La pestaña de objetivos se reordenó: editar y ver el progreso pasaron de una
// sección aparte al pie a la propia fila del objetivo. Un error al pintarla
// deja la pantalla en blanco, y desde fuera eso es indistinguible de que no
// haya objetivos.

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

const NINO = { id: 'c-1', name: 'Abraham', lastName: 'L', assignedSpecialists: ['u-celi'] }
const OBJETIVOS = [
  { id: 'o-1', childId: 'c-1', name: 'Control postural y estabilidad',
    area: 'Terapia Ocupacional', specialistId: 'u-celi', status: 'proceso',
    gasBaseline: -2, gasTarget: 0, gasCurrent: -1 },
  { id: 'o-2', childId: 'c-1', name: 'Procesamiento propioceptivo',
    area: 'Terapia Ocupacional', specialistId: 'u-celi', status: 'proceso' },
]

let contenedor = null
function pintar() {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => { createRoot(contenedor).render(<ObjetivosTab child={NINO} />) })
  return contenedor
}

beforeEach(() => {
  useDataStore.setState({
    objectives: OBJETIVOS, sessions: [],
    users: [{ id: 'u-celi', name: 'Celilia Miranda', specialty: 'Terapia Ocupacional' }],
  })
  useAuthStore.setState({
    currentUser: {
      id: 'u-celi', name: 'Celilia Miranda', scope: 'asignados',
      permissions: new Set(['objective:view', 'objective:create', 'objective:edit:own']),
    },
  })
})
afterEach(() => { document.body.innerHTML = ''; contenedor = null })

describe('pestaña de objetivos', () => {
  it('se pinta con los objetivos del paciente', () => {
    const c = pintar()
    expect(c.textContent).toContain('Control postural y estabilidad')
    expect(c.textContent).toContain('Procesamiento propioceptivo')
    expect(c.textContent).toContain('Terapia Ocupacional')
  })

  it('cada objetivo trae su propio botón de editar', () => {
    // Antes la edición vivía en una sección "Editar objetivos" al pie: se
    // veían los objetivos arriba y no había forma de entrar en ellos desde
    // donde se estaban mirando. Es lo que reportó Sarita.
    const c = pintar()
    const editar = [...c.querySelectorAll('button[title="Editar objetivo"]')]
    expect(editar).toHaveLength(OBJETIVOS.length)
    const borrar = [...c.querySelectorAll('button[title="Eliminar objetivo"]')]
    expect(borrar).toHaveLength(OBJETIVOS.length)
  })

  it('ya no queda la sección separada del pie', () => {
    expect(pintar().textContent).not.toContain('Editar objetivos')
  })

  it('el progreso se ve junto al objetivo que lo tiene', () => {
    const c = pintar()
    // o-1 lleva escala GAS y o-2 no: una sola, no un hueco en cada fila.
    expect(c.textContent).toContain('Control postural y estabilidad')
    expect(c.querySelectorAll('svg').length).toBeGreaterThan(0)
  })

  it('quien no puede editar no ve los botones', () => {
    useAuthStore.setState({
      currentUser: {
        id: 'u-otra', name: 'Otra', scope: 'asignados',
        permissions: new Set(['objective:view']),
      },
    })
    const c = pintar()
    expect(c.textContent).toContain('Control postural y estabilidad')
    expect(c.querySelectorAll('button[title="Editar objetivo"]')).toHaveLength(0)
  })

  it('la rejilla se apila en pantalla estrecha', () => {
    // Con tres columnas fijas, en el teléfono cada una quedaba de 90px y el
    // nombre del objetivo salía una letra por línea.
    const rejilla = [...pintar().querySelectorAll('div')]
      .find((d) => d.style.display === 'grid' && d.style.gridTemplateColumns.includes('auto-fit'))
    expect(rejilla).toBeTruthy()
    expect(rejilla.style.gridTemplateColumns).toContain('minmax')
  })
})
