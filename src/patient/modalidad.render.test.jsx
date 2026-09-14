// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import SesionesTab from './tabs/SesionesTab.jsx'
import { componerSesion } from './modals/EditSessionModal.jsx'

// Cuando María Virginia acompaña a la terapeuta, la sesión se guardaba con la
// especialidad de ELLA — "Kids Club" — y esa área acababa en el expediente de
// un niño que no la recibe.

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

const NINO = { id: 'c-1', name: 'Isaac', lastName: 'Schachtel' }
const USUARIOS = [
  { id: 'u-mv', name: 'María Virginia Sierralta', specialty: 'Kids Club' },
  { id: 'u-celi', name: 'Celilia Miranda', specialty: 'Terapia Ocupacional' },
]
const BASE = {
  id: 's-1', childId: 'c-1', specialistId: 'u-mv', specialty: 'Terapia Ocupacional',
  date: '2026-09-08', duration: 45, attendance: 'asistio',
  objectivesWorked: [], activities: [], observation: '', nextSteps: '',
}

let contenedor = null
function pintar(sesion) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => {
    createRoot(contenedor).render(
      <SesionesTab
        child={NINO} sessions={[sesion]} objectives={[]} users={USUARIOS}
        currentUser={{ id: 'u-mv', permissions: new Set(['session:view']) }}
        onUpdateSession={() => {}}
      />
    )
  })
  return document.body
}
afterEach(() => { document.body.innerHTML = ''; contenedor = null })

describe('cómo se dio la sesión, en la ficha', () => {
  it('un acompañamiento dice con quién', () => {
    const c = pintar({ ...BASE, modalidad: 'Acompañamiento', conEspecialista: 'u-celi' })
    expect(c.textContent).toContain('Acompañamiento con Celilia Miranda')
    // Y la disciplina sigue siendo la real, no la de quien acompaña.
    expect(c.textContent).toContain('Terapia Ocupacional')
    expect(c.textContent).not.toContain('Kids Club')
  })

  it('una suplencia dice DE quién, que es al revés', () => {
    const c = pintar({ ...BASE, modalidad: 'Suplencia', conEspecialista: 'u-celi' })
    expect(c.textContent).toContain('Suplencia de Celilia Miranda')
  })

  it('una sesión normal no añade nada', () => {
    const c = pintar({ ...BASE })
    expect(c.textContent).not.toContain('Acompañamiento')
    expect(c.textContent).not.toContain('Suplencia')
  })

  it('las sesiones de antes de este campo no revientan', () => {
    // 446 sesiones en producción no tienen modalidad.
    const { modalidad, conEspecialista, ...vieja } = { ...BASE }
    expect(modalidad).toBeUndefined()
    expect(conEspecialista).toBeUndefined()
    const c = pintar(vieja)
    expect(c.textContent).toContain('Terapia Ocupacional')
  })
})

describe('corregir cómo se dio una sesión ya registrada', () => {
  it('guarda la figura y con quién', () => {
    const r = componerSesion(BASE, {
      trabajados: {}, huerfanas: [], actividades: '', observation: '', nextSteps: '',
      attendance: 'asistio', modalidad: 'Suplencia', conEspecialista: 'u-celi',
    })
    expect(r.modalidad).toBe('Suplencia')
    expect(r.conEspecialista).toBe('u-celi')
  })

  it('quitar la figura suelta también al especialista', () => {
    // Si no, volver a marcar "Acompañamiento" resucitaría a alguien que ya se
    // había quitado.
    const r = componerSesion(
      { ...BASE, modalidad: 'Suplencia', conEspecialista: 'u-celi' },
      { trabajados: {}, huerfanas: [], actividades: '', observation: '', nextSteps: '',
        attendance: 'asistio', modalidad: '', conEspecialista: 'u-celi' }
    )
    expect(r.modalidad).toBe('')
    expect(r.conEspecialista).toBe(null)
  })

  it('no toca la especialidad: son dos preguntas distintas', () => {
    const r = componerSesion(BASE, {
      trabajados: {}, huerfanas: [], actividades: '', observation: '', nextSteps: '',
      attendance: 'asistio', modalidad: 'Acompañamiento', conEspecialista: 'u-celi',
    })
    expect(r.specialty).toBe('Terapia Ocupacional')
    expect(r.specialistId).toBe('u-mv')
  })
})
