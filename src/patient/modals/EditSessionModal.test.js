import { describe, it, expect } from 'vitest'
import { repartirObjetivos, componerSesion } from './EditSessionModal.jsx'

const sesion = {
  id: 's1', childId: 'c1', specialistId: 'u-1', specialty: 'Fonoaudiologia',
  date: '2026-08-18', duration: 45,
}

// Un ciclo completo abrir → guardar sin tocar nada debe devolver los mismos
// datos. Es la garantia que faltaba: el modal duplicaba la entrada huerfana en
// cada guardado y la pantalla se veia perfecta.
function ciclo(session, idsExistentes) {
  const { editables, huerfanas } = repartirObjetivos(session.objectivesWorked, idsExistentes)
  return componerSesion(session, {
    trabajados: editables,
    huerfanas,
    actividades: (session.activities || []).join('\n'),
    observation: session.observation || '',
    nextSteps: session.nextSteps || '',
  })
}

describe('repartirObjetivos', () => {
  it('separa lo editable de lo huerfano sin perder nada', () => {
    const r = repartirObjetivos(
      [{ objectiveId: 'o1', status: 'logrado' }, { objectiveId: 'borrado', status: 'apoyo' }],
      ['o1', 'o2']
    )
    expect(r.editables).toEqual({ o1: 'logrado' })
    expect(r.huerfanas).toEqual([{ objectiveId: 'borrado', status: 'apoyo' }])
  })

  it('una huerfana nunca entra al estado editable', () => {
    // Si entrara, saldria dos veces al guardar: una por el estado y otra por la
    // lista que se reanexa.
    const r = repartirObjetivos([{ objectiveId: 'x', status: 'proceso' }], [])
    expect(r.editables).toEqual({})
    expect(r.huerfanas).toHaveLength(1)
  })

  it('completa el estado ausente con "proceso" en vez de dejarlo indefinido', () => {
    expect(repartirObjetivos([{ objectiveId: 'o1' }], ['o1']).editables).toEqual({ o1: 'proceso' })
  })

  it('acepta objectivesWorked nulo', () => {
    expect(repartirObjetivos(null, ['o1'])).toEqual({ editables: {}, huerfanas: [] })
  })

  it('acepta un Set igual que una lista', () => {
    const conLista = repartirObjetivos([{ objectiveId: 'o1', status: 'apoyo' }], ['o1'])
    const conSet = repartirObjetivos([{ objectiveId: 'o1', status: 'apoyo' }], new Set(['o1']))
    expect(conSet).toEqual(conLista)
  })
})

describe('componerSesion', () => {
  it('parte las actividades por linea, recorta y descarta las vacias', () => {
    const s = componerSesion(sesion, {
      trabajados: {}, huerfanas: [],
      actividades: '  Color Code  \n\n Juego de turnos \n   \n',
      observation: '  nota  ', nextSteps: '',
    })
    expect(s.activities).toEqual(['Color Code', 'Juego de turnos'])
    expect(s.observation).toBe('nota')
  })

  it('conserva los campos de cabecera que el modal no edita', () => {
    const s = componerSesion(sesion, {
      trabajados: {}, huerfanas: [], actividades: '', observation: '', nextSteps: '',
    })
    expect(s).toMatchObject({
      id: 's1', childId: 'c1', specialistId: 'u-1',
      specialty: 'Fonoaudiologia', date: '2026-08-18', duration: 45,
    })
  })
})

describe('abrir y guardar sin cambios', () => {
  it('no duplica ni pierde objetivos, ni con huerfanas', () => {
    const original = {
      ...sesion,
      objectivesWorked: [
        { objectiveId: 'o1', status: 'logrado' },
        { objectiveId: 'borrado-99', status: 'proceso' },
      ],
      activities: ['Color Code'],
      observation: 'Agenda General 2026',
      nextSteps: '',
    }
    const guardada = ciclo(original, ['o1', 'o2'])
    expect(guardada.objectivesWorked).toEqual(original.objectivesWorked)
    expect(guardada.activities).toEqual(original.activities)
  })

  it('sigue siendo estable tras varios ciclos seguidos', () => {
    // El bug crecia: cada guardado anadia otra copia de la huerfana.
    let s = {
      ...sesion,
      objectivesWorked: [{ objectiveId: 'huerfana', status: 'proceso' }],
      activities: [], observation: '', nextSteps: '',
    }
    for (let i = 0; i < 4; i++) s = ciclo(s, ['o1'])
    expect(s.objectivesWorked).toEqual([{ objectiveId: 'huerfana', status: 'proceso' }])
  })
})
