import { describe, it, expect } from 'vitest'
import { especialistasSinObjetivos } from './ObjetivosTab.jsx'

const paciente = (extra = {}) => ({ id: 'c-1', assignedSpecialists: [], ...extra })

describe('especialistasSinObjetivos — de quién hay columna para definir objetivos', () => {
  it('un expediente recién creado ofrece columna a su especialista asignado', () => {
    // El caso que dejaba la pestaña en blanco: sin sesiones y sin objetivos,
    // no había forma de agregar el primer objetivo.
    const child = paciente({ assignedSpecialists: ['u-admin'] })
    expect(especialistasSinObjetivos({ child, sessions: [], grupos: {} })).toEqual(['u-admin'])
  })

  it('también entra quien ya tiene sesión aunque no esté asignado', () => {
    const child = paciente()
    const sessions = [{ childId: 'c-1', specialistId: 'u-laura' }]
    expect(especialistasSinObjetivos({ child, sessions, grupos: {} })).toEqual(['u-laura'])
  })

  it('no repite a quien está asignado y además tiene sesión', () => {
    const child = paciente({ assignedSpecialists: ['u-laura'] })
    const sessions = [{ childId: 'c-1', specialistId: 'u-laura' }, { childId: 'c-1', specialistId: 'u-laura' }]
    expect(especialistasSinObjetivos({ child, sessions, grupos: {} })).toEqual(['u-laura'])
  })

  it('quien ya tiene objetivos no repite columna: ya la tiene arriba', () => {
    const child = paciente({ assignedSpecialists: ['u-admin'] })
    const grupos = { 'u-admin__Pautas de Crianza': { specId: 'u-admin', area: 'Pautas de Crianza', objs: [{}] } }
    expect(especialistasSinObjetivos({ child, sessions: [], grupos })).toEqual([])
  })

  it('un especialista con objetivos en un área sigue sin columna suelta en otra', () => {
    // Las claves son `${specId}__${area}`: el prefijo basta para saber que ya
    // tiene columna propia, sin depender del área.
    const child = paciente({ assignedSpecialists: ['u-admin'] })
    const grupos = { 'u-admin__General': { specId: 'u-admin', area: 'General', objs: [{}] } }
    expect(especialistasSinObjetivos({ child, sessions: [], grupos })).toEqual([])
  })

  it('ignora sesiones de otros pacientes y especialistas vacíos', () => {
    const child = paciente()
    const sessions = [
      { childId: 'c-otro', specialistId: 'u-laura' },
      { childId: 'c-1', specialistId: null },
    ]
    expect(especialistasSinObjetivos({ child, sessions, grupos: {} })).toEqual([])
  })

  it('un expediente sin asignados ni sesiones no ofrece ninguna columna', () => {
    expect(especialistasSinObjetivos({ child: paciente(), sessions: [], grupos: {} })).toEqual([])
    expect(especialistasSinObjetivos({ child: { id: 'c-1' } })).toEqual([])
  })
})
