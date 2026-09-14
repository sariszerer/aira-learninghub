// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import ReportesTab from './tabs/ReportesTab.jsx'
import ReporteEvolucionGuardado from '../reports/ReporteEvolucionGuardado.jsx'

// Los reportes se guardaban y no se veían en ninguna parte: el de evolución
// sólo aparecía DENTRO del historial clínico completo — que hay que generar
// para verlo — y el de la familia en ningún sitio.

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: false, media: consulta,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))

const NINO = { id: 'c-1', name: 'Eliauh', lastName: 'Guindi', recordNo: 'EX-1' }
const USUARIOS = [{ id: 'u-celi', name: 'Celilia Miranda' }]
const EVOLUCION = {
  id: 'er-1', childId: 'c-1', specialty: 'Terapia Ocupacional',
  specialistId: 'u-celi', generatedBy: 'u-celi',
  fromDate: '2026-05-01', toDate: '2026-08-31', generatedDate: '2026-09-01',
  content: {
    asistencia: { total: 12, asistidas: 10, canceladas: 1, ausencias: 1 },
    objetivos: [{ nombre: 'Control postural', estado: 'proceso', gas: { actual: -1 }, vecesTrabajado: 7 }],
    logros: ['Sostiene el lápiz en pinza trípode'],
    areasDeAtencion: ['Tolerancia a la frustración'],
    ajustes: 'Se amplía el trabajo propioceptivo.',
    recomendaciones: 'Continuar en casa con pausas de movimiento.',
  },
}
const FAMILIA = {
  id: 'pr-1', childId: 'c-1', fromDate: '2026-05-01', toDate: '2026-08-31',
  generatedDate: '2026-09-02', sessionCount: 8,
}
const USUARIO = {
  id: 'u-celi',
  permissions: new Set(['report:view', 'document:view', 'report:evolution:generate']),
}

let contenedor = null
function pintar(extra = {}) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  act(() => {
    createRoot(contenedor).render(
      <ReportesTab
        child={NINO} documents={[]} users={USUARIOS} sessions={[]}
        parentReports={[FAMILIA]} evolutionReports={[EVOLUCION]}
        currentUser={USUARIO} onAddDocument={() => {}} onUpdateDocument={() => {}}
        onGenerateFull={() => {}} onGenerateEvolution={() => {}} onGenerateParentReport={() => {}}
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

describe('lo generado aparece junto a lo guardado', () => {
  it('hay una pestaña por cada tipo de reporte, con su recuento', () => {
    const c = pintar()
    expect(c.textContent).toContain('Evolución (1)')
    expect(c.textContent).toContain('A la familia (1)')
  })

  it('la de evolución lista el período y quién lo generó', () => {
    pintar()
    pulsar('Evolución (1)')
    const t = document.body.textContent
    expect(t).toContain('Terapia Ocupacional')
    expect(t).toContain('Celilia Miranda')
  })

  it('el reporte para la familia dice que guarda el acuse, no el texto', () => {
    // Ofrecer un "Ver" abriría un documento recompuesto con datos de hoy, que
    // no es el que se le mandó a la familia. Se dice en vez de fingirlo.
    pintar()
    pulsar('A la familia (1)')
    expect(document.body.textContent).toContain('no el texto')
    expect(document.body.textContent).toContain('8 sesiones')
  })

  it('sin nada generado lo dice en vez de quedarse en blanco', () => {
    const c = pintar({ evolutionReports: [], parentReports: [] })
    expect(c.textContent).toContain('Evolución')
    expect(c.textContent).not.toContain('Evolución (0)')
    pulsar('Evolución')
    expect(document.body.textContent).toContain('Aún no se ha generado')
  })
})

describe('un reporte de evolución guardado', () => {
  it('se pinta con lo que quedó guardado, no recalculado', () => {
    contenedor = document.createElement('div')
    document.body.appendChild(contenedor)
    act(() => {
      createRoot(contenedor).render(
        <ReporteEvolucionGuardado
          reporte={EVOLUCION} child={NINO} users={USUARIOS} onClose={() => {}}
        />
      )
    })
    const t = document.body.textContent
    expect(t).toContain('Control postural')
    expect(t).toContain('Sostiene el lápiz en pinza trípode')
    expect(t).toContain('Tolerancia a la frustración')
    expect(t).toContain('Continuar en casa con pausas de movimiento.')
    // Y se dice que es una instantánea: el reporte de mayo decía lo de mayo.
    expect(t).toContain('no se recalcula con datos posteriores')
  })

  it('un reporte antiguo sin contenido no revienta', () => {
    contenedor = document.createElement('div')
    document.body.appendChild(contenedor)
    act(() => {
      createRoot(contenedor).render(
        <ReporteEvolucionGuardado
          reporte={{ ...EVOLUCION, content: null }} child={NINO} users={USUARIOS} onClose={() => {}}
        />
      )
    })
    expect(document.body.textContent).toContain('Reporte de evolución')
  })
})
