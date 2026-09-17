// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import ReporteSesion from './ReporteSesion.jsx'

// El acta de UNA sesión. Los reportes que había cubren un período; el que la
// familia pide al salir y el que la escuela quiere ver se armaba a mano.

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

const NINO = { id: 'c-1', name: 'Isaac', lastName: 'Schachtel', recordNo: 'EX-1' }
const USUARIOS = [
  { id: 'u-celi', name: 'Celilia Miranda', specialty: 'Terapia Ocupacional', licenseNo: 'TO-123' },
  { id: 'u-mv', name: 'María Virginia Sierralta', specialty: 'Kids Club' },
]
const OBJETIVOS = [
  { id: 'o-1', name: 'Control postural y estabilidad', area: 'Terapia Ocupacional' },
  { id: 'o-2', name: 'Procesamiento propioceptivo', area: 'Terapia Ocupacional' },
]
const SESION = {
  id: 's-1', childId: 'c-1', specialistId: 'u-celi', specialty: 'Terapia Ocupacional',
  date: '2026-09-08', duration: 45, attendance: 'asistio',
  objectivesWorked: [{ objectiveId: 'o-1', status: 'proceso' }],
  activities: ['Circuito de obstáculos', 'Trabajo en plano inclinado'],
  observation: 'Respondió bien al circuito.',
  nextSteps: 'En casa: subir escaleras alternando pies.',
}

let contenedor = null
function pintar(sesion = SESION) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => {
    createRoot(contenedor).render(
      <ReporteSesion
        sesion={sesion} child={NINO} objectives={OBJETIVOS} users={USUARIOS}
        onClose={() => {}}
      />
    )
  })
  return document.body
}
afterEach(() => { document.body.innerHTML = ''; contenedor = null })

describe('reporte de sesión', () => {
  it('lleva las tres cosas que se pidieron', () => {
    const t = pintar().textContent
    expect(t).toContain('Control postural y estabilidad')          // objetivos
    expect(t).toContain('Circuito de obstáculos')                   // actividades
    expect(t).toContain('En casa: subir escaleras alternando pies.') // para casa
  })

  it('no saca objetivos de otras sesiones', () => {
    expect(pintar().textContent).not.toContain('Procesamiento propioceptivo')
  })

  it('un objetivo borrado desde entonces se descarta en vez de salir en blanco', () => {
    const t = pintar({ ...SESION, objectivesWorked: [{ objectiveId: 'o-borrado' }] }).textContent
    expect(t).toContain('No se marcaron objetivos')
  })

  it('el encabezado dice de quién y de qué área es', () => {
    const t = pintar().textContent
    expect(t).toContain('Celilia Miranda')
    expect(t).toContain('Terapia Ocupacional')
    expect(t).toContain('45 min')
  })

  it('si la dieron dos, se dice en el documento', () => {
    const t = pintar({ ...SESION, modalidad: 'Suplencia', conEspecialista: 'u-mv' }).textContent
    expect(t).toContain('Suplencia de María Virginia Sierralta')
  })

  it('lleva el bloque de firma del profesional', () => {
    const t = pintar().textContent
    expect(t).toContain('TO-123')
  })

  it('una sesión vacía no revienta ni miente', () => {
    // 438 de las sesiones del centro se importaron sin actividades ni notas.
    const t = pintar({
      ...SESION, objectivesWorked: [], activities: [], observation: '', nextSteps: '',
    }).textContent
    expect(t).toContain('No se marcaron objetivos')
    expect(t).toContain('Reporte de sesión')
  })

  it('es confidencial, como todo lo que sale con datos de un menor', () => {
    expect(pintar().textContent).toContain('Documento confidencial')
  })
})
