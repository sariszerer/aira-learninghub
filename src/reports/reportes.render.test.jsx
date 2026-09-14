// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'

// Los tres reportes se MONTAN de verdad.
//
// Hasta ahora todas las pruebas de este proyecto leían código o probaban
// funciones puras. Eso deja fuera una familia entera de fallos: el componente
// que compila, pasa el guardia de imports y revienta al pintarse. Ya van tres
// esta semana, y el único modo de verlos era abrir la aplicación.
//
// El caso que se prueba es el que falla en la clínica: un paciente SIN
// SESIONES. Asher Btesh tiene cero, y es justo donde se dijo que el reporte
// "sale en blanco".

vi.mock('../supabase.js', () => ({
  supabase: { auth: { getUser: async () => ({ data: { user: null } }) } },
  db: {},
}))

const { useDataStore } = await import('../store/dataStore.js')
const { useAuthStore } = await import('../store/authStore.js')
const ReporteEvolucion = (await import('./ReporteEvolucion.jsx')).default
const HistorialClinico = (await import('./HistorialClinico.jsx')).default
const ReporteFamilia = (await import('./ReporteFamilia.jsx')).default

const NINO = {
  id: 'c-asher', name: 'Asher', lastName: 'Btesh', tipo: 'nino',
  birthDate: '2020-02-10', admissionDate: null, specialties: ['Terapia Ocupacional'],
  assignedSpecialists: ['u-idaira'], parentContact: {}, status: 'activo',
}
const USUARIOS = [{ id: 'u-idaira', name: 'Idaira Castillo', specialty: 'Terapia Ocupacional' }]
const ACTUAL = { id: 'u-sarita', name: 'Sarita Szerer', permissions: new Set(), scope: 'todos' }

let contenedor
let raiz

beforeEach(() => {
  useAuthStore.setState({ currentUser: ACTUAL, authLoading: false })
  useDataStore.setState({ users: USUARIOS, children: [NINO] })
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  raiz = createRoot(contenedor)
})

afterEach(() => {
  act(() => raiz.unmount())
  contenedor.remove()
})

// Monta y devuelve el texto que se ve. Si el componente lanza, la excepción
// sale por aquí y la prueba lo dice con su mensaje.
function montar(elemento) {
  act(() => raiz.render(elemento))
  // El visor se monta con portal a <body>, así que el contenido no está dentro
  // del contenedor: se lee del documento entero.
  return document.body.textContent || ''
}

const COMUN = {
  child: NINO, sessions: [], objectives: [], users: USUARIOS,
  documents: [], meetings: [], parentReports: [], evolutionReports: [],
  currentUser: ACTUAL, onClose: () => {},
}

describe('los tres reportes se pintan con un paciente sin sesiones', () => {
  it('Reporte de evolución', () => {
    const texto = montar(<ReporteEvolucion {...COMUN} onGuardar={() => {}} />)
    expect(texto).toContain('Asher')
  })

  it('Historial clínico completo', () => {
    const texto = montar(<HistorialClinico {...COMUN} />)
    expect(texto).toContain('Asher')
  })

  it('Reporte para la familia', () => {
    const texto = montar(<ReporteFamilia {...COMUN} onGenerated={() => {}} />)
    expect(texto).toContain('Asher')
  })
})

describe('y con datos reales del expediente', () => {
  const sesiones = [
    { id: 's1', childId: 'c-asher', specialistId: 'u-idaira', specialty: 'Terapia Ocupacional',
      date: '2026-08-18', duration: 45, attendance: 'asistio', objectivesWorked: [],
      activities: ['Circuito motor'], observation: 'Buena disposición' },
  ]
  const objetivos = [
    { id: 'o1', childId: 'c-asher', name: 'Sostener el lápiz', area: 'Terapia Ocupacional',
      status: 'proceso', specialistId: 'u-idaira', createdDate: '2026-08-01' },
  ]

  it('Reporte de evolución', () => {
    const texto = montar(
      <ReporteEvolucion {...COMUN} sessions={sesiones} objectives={objetivos} onGuardar={() => {}} />
    )
    expect(texto).toContain('Asher')
    expect(texto).toContain('Sostener el lápiz')
  })

  it('Historial clínico completo', () => {
    const texto = montar(<HistorialClinico {...COMUN} sessions={sesiones} objectives={objetivos} />)
    expect(texto).toContain('Asher')
  })

  it('Reporte para la familia', () => {
    const texto = montar(
      <ReporteFamilia {...COMUN} sessions={sesiones} objectives={objetivos} onGenerated={() => {}} />
    )
    expect(texto).toContain('Asher')
  })
})

describe('la minuta como documento', () => {
  const MINUTA = {
    id: 'm1', childId: 'c-asher', date: '2026-09-14',
    type: ['Escuela', 'Familia'],
    participants: 'María López, Terapeuta Ocupacional\nMaestra guía\nMadre',
    summary: 'Se habló de la adaptación al aula.',
    agreements: 'Reforzar pautas en casa\nRevisar en un mes',
    createdBy: 'u-idaira',
  }

  it('se pinta con sus participantes en lista', async () => {
    const { default: Minuta } = await import('./MinutaDocumento.jsx')
    const texto = montar(
      <Minuta minuta={MINUTA} child={NINO} users={USUARIOS} onClose={() => {}} />
    )
    expect(texto).toContain('Asher')
    expect(texto).toContain('María López, Terapeuta Ocupacional')
    expect(texto).toContain('Maestra guía')
  })

  it('los dos tipos salen juntos, no solo el primero', async () => {
    const { default: Minuta } = await import('./MinutaDocumento.jsx')
    const texto = montar(
      <Minuta minuta={MINUTA} child={NINO} users={USUARIOS} onClose={() => {}} />
    )
    expect(texto).toContain('Escuela y Familia')
  })

  it('una minuta sin acuerdos no revienta', async () => {
    const { default: Minuta } = await import('./MinutaDocumento.jsx')
    const texto = montar(
      <Minuta minuta={{ ...MINUTA, agreements: '' }} child={NINO} users={USUARIOS} onClose={() => {}} />
    )
    expect(texto).toContain('Asher')
  })
})
