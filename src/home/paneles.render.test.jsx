// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { AdminDashboard, ClinicalDirectorHome, SpecialistHome, TutorAiraHome } from './index.js'
import { useDataStore } from '../store/dataStore.js'
import { useAuthStore } from '../store/authStore.js'
import { ROLES } from '../permissions.js'

// La pantalla de inicio es lo primero que ve cada rol. Si revienta, esa
// persona no entra a la aplicación — no es una sección rota, es la puerta.
//
// Pasó: ClinicalDirectorHome leía seis stores del estado y le faltaba
// parentReports, pero lo usaba treinta líneas más abajo. Claudia e Idaira
// vieron una pantalla en blanco durante días y el único síntoma era el vacío.
// Ningún test lo tocaba: los cuatro paneles nunca se habían montado.
//
// Esto los monta los cuatro, con datos y sin ellos.

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

const NINOS = [
  {
    id: 'c-1', name: 'Isaac', lastName: 'Schachtel', avatarBg: '#1E79E2',
    specialties: ['Terapia Ocupacional'], assignedSpecialists: ['u-celi'],
    status: 'activo', nextSession: '2026-10-07', nextSessionTime: '09:00',
    packageStart: '2026-09-01', packageNum: 1, admissionDate: '2026-01-10',
    parentContact: { name: 'Adela', phone: '6000', email: 'a@b.c' },
  },
  {
    id: 'c-2', name: 'Edy', lastName: 'Antebi', avatarBg: '#7A9E7E',
    specialties: ['Desarrollo (DVLP)'], assignedSpecialists: ['u-mv'],
    status: 'activo', admissionDate: '2025-05-02', parentContact: {},
  },
]

const EQUIPO = [
  { id: 'u-celi', name: 'Celilia Miranda', specialty: 'Terapia Ocupacional', role: 'specialist', activo: true },
  { id: 'u-mv', name: 'María Virginia Sierralta', specialty: 'Kids Club', role: 'specialist', activo: true },
  { id: 'u-idaira', name: 'Idaira Castillo', specialty: 'Psicopedagogía', role: 'clinical_director', activo: true },
  { id: 'u-admin', name: 'Sarita Szerer', specialty: 'Pautas de Crianza', role: 'admin', activo: true },
  { id: 'u-shadow', name: 'Tutora Ana', role: 'shadow', activo: true },
]

const SESIONES = [
  {
    id: 's-1', childId: 'c-1', specialistId: 'u-celi', specialty: 'Terapia Ocupacional',
    date: '2026-09-30', duration: 45, attendance: 'asistio',
    objectivesWorked: [{ objectiveId: 'o-1', status: 'proceso' }],
    activities: ['Circuito motor'], observation: 'Bien.', nextSteps: '',
  },
  {
    id: 's-2', childId: 'c-2', specialistId: 'u-mv', specialty: 'Desarrollo (DVLP)',
    date: '2026-09-10', duration: 45, attendance: 'cancelo',
    objectivesWorked: [], activities: [], observation: '', nextSteps: '',
  },
]

const OBJETIVOS = [
  { id: 'o-1', childId: 'c-1', name: 'Control postural', area: 'Terapia Ocupacional', specialistId: 'u-celi', status: 'proceso', createdDate: '2026-02-01' },
  { id: 'o-2', childId: 'c-2', name: 'Lenguaje expresivo', area: 'Desarrollo (DVLP)', specialistId: 'u-mv', status: 'logrado', createdDate: '2026-02-01' },
]

const TUTORES = [{ id: 't-1', name: 'Tutora Ana', userId: 'u-shadow', assignedChildId: 'c-1', activo: true }]

// El usuario tal como lo arma buildUser: con sus permisos y su alcance reales.
function comoUsuario(id, rol, extra = {}) {
  const r = ROLES[rol]
  return {
    ...EQUIPO.find((u) => u.id === id),
    permissions: new Set(r.permisos), scope: r.scope, home: r.home,
    esClinico: r.esClinico, etiqueta: r.etiqueta, color: r.color, ...extra,
  }
}

const LLENO = {
  children: NINOS, users: EQUIPO, sessions: SESIONES, objectives: OBJETIVOS,
  tutors: TUTORES, tutorReports: [], parentReports: [], evolutionReports: [],
  documents: [], meetings: [], activityLog: [], schools: [],
  estudiantesGabinete: [], tamizajes: [], gabineteSessions: [],
}
// Un centro recién abierto, o una carga que todavía no ha llegado. Es el
// estado en el que más fácil se cuela un .map sobre undefined.
const VACIO = Object.fromEntries(Object.keys(LLENO).map((k) => [k, []]))

let contenedor = null
function montar(elemento) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => { createRoot(contenedor).render(elemento) })
  return document.body
}
beforeEach(() => { useDataStore.setState(LLENO) })
afterEach(() => { document.body.innerHTML = ''; contenedor = null })

const PANELES = [
  ['Administración', AdminDashboard, () => comoUsuario('u-admin', 'admin')],
  ['Dirección clínica', ClinicalDirectorHome, () => comoUsuario('u-idaira', 'clinical_director')],
  ['Especialista', SpecialistHome, () => comoUsuario('u-celi', 'specialist')],
  ['Tutor AIRA', TutorAiraHome, () => comoUsuario('u-shadow', 'shadow', { assignedChildId: 'c-1' })],
]

describe('las cuatro pantallas de inicio se pintan', () => {
  it.each(PANELES.map(([n]) => n))('%s, con datos', (nombre) => {
    const [, Panel, hacerUsuario] = PANELES.find(([n]) => n === nombre)
    const user = hacerUsuario()
    useAuthStore.setState({ currentUser: user })
    const c = montar(<Panel user={user} onOpenChild={() => {}} />)
    // Algo pintó. Una pantalla en blanco es indistinguible de "no hay datos",
    // que es exactamente lo que hizo invisible el fallo de dirección clínica.
    expect(c.textContent.trim().length).toBeGreaterThan(0)
  })

  it.each(PANELES.map(([n]) => n))('%s, sin ningún dato', (nombre) => {
    const [, Panel, hacerUsuario] = PANELES.find(([n]) => n === nombre)
    useDataStore.setState(VACIO)
    const user = hacerUsuario()
    useAuthStore.setState({ currentUser: user })
    const c = montar(<Panel user={user} onOpenChild={() => {}} />)
    expect(c.textContent.trim().length).toBeGreaterThan(0)
  })
})

describe('cada rol ve lo suyo', () => {
  it('la especialista ve a su paciente y no al de la otra', () => {
    const user = comoUsuario('u-celi', 'specialist')
    useAuthStore.setState({ currentUser: user })
    const c = montar(<SpecialistHome user={user} onOpenChild={() => {}} />)
    expect(c.textContent).toContain('Isaac')
    expect(c.textContent).not.toContain('Edy')
  })

  it('dirección clínica los ve a todos', () => {
    // Es el panel que estuvo caído. Que pinte no basta: tiene que traer los
    // pacientes, que es lo que computeClinicalAlerts recorre.
    const user = comoUsuario('u-idaira', 'clinical_director')
    useAuthStore.setState({ currentUser: user })
    const c = montar(<ClinicalDirectorHome user={user} onOpenChild={() => {}} />)
    expect(c.textContent).toContain('Isaac')
    expect(c.textContent).toContain('Edy')
  })

  it('la tutora solo ve a su estudiante', () => {
    const user = comoUsuario('u-shadow', 'shadow', { assignedChildId: 'c-1' })
    useAuthStore.setState({ currentUser: user })
    const c = montar(<TutorAiraHome user={user} onOpenChild={() => {}} />)
    expect(c.textContent).not.toContain('Edy')
  })
})
