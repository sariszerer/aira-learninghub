import { describe, it, expect } from 'vitest'
import { terapeutasDeColegio, aQuienAcompana } from './terapeutas.js'

const tutor = (o) => ({ id: 't1', name: 'Karelis Bishop', activo: true, schoolId: 'sch-1', ...o })
const est = (o) => ({ id: 'e1', name: 'Asher', lastName: 'Btesh', schoolId: 'sch-1', tutorId: 't1', ...o })

describe('terapeutasDeColegio', () => {
  it('lista a cada terapeuta con el niño que acompaña', () => {
    const [t] = terapeutasDeColegio([tutor()], [est()], 'sch-1')
    expect(t.name).toBe('Karelis Bishop')
    expect(t.acompana.map((e) => e.name)).toEqual(['Asher'])
  })

  it('incluye a quien acompaña a un estudiante aunque su ficha no tenga colegio', () => {
    // Pasa de verdad: al crear la tutora desde el alta de un estudiante, su fila
    // puede quedar sin schoolId. Filtrando solo por schoolId desaparecía de la
    // única pantalla donde se la administra.
    const t = terapeutasDeColegio([tutor({ schoolId: null })], [est()], 'sch-1')
    expect(t).toHaveLength(1)
  })

  it('la contratada que aún no acompaña a nadie también sale', () => {
    const [t] = terapeutasDeColegio([tutor()], [], 'sch-1')
    expect(t.acompana).toEqual([])
  })

  it('no mezcla terapeutas de otro colegio', () => {
    const otros = [tutor({ id: 't2', name: 'Ana', schoolId: 'sch-2' })]
    expect(terapeutasDeColegio([tutor(), ...otros], [est()], 'sch-1').map((t) => t.id)).toEqual(['t1'])
  })

  it('deja fuera a quien ya no está activa', () => {
    expect(terapeutasDeColegio([tutor({ activo: false })], [est()], 'sch-1')).toEqual([])
  })

  it('una terapeuta puede acompañar a más de un niño', () => {
    const [t] = terapeutasDeColegio([tutor()], [est(), est({ id: 'e2', name: 'Sara' })], 'sch-1')
    expect(t.acompana).toHaveLength(2)
  })

  it('ordena por nombre, que es como se busca en una lista', () => {
    const lista = [tutor({ id: 't2', name: 'Zoe' }), tutor({ id: 't3', name: 'Ana' })]
    expect(terapeutasDeColegio(lista, [], 'sch-1').map((t) => t.name)).toEqual(['Ana', 'Zoe'])
  })
})

describe('aQuienAcompana', () => {
  it('nombra al niño', () => {
    expect(aQuienAcompana([{ name: 'Asher', lastName: 'Btesh' }])).toBe('Asher Btesh')
  })

  it('separa varios', () => {
    expect(aQuienAcompana([{ name: 'Asher', lastName: 'Btesh' }, { name: 'Sara', lastName: 'Levy' }]))
      .toBe('Asher Btesh · Sara Levy')
  })

  it('dice que no tiene, en vez de dejar un hueco', () => {
    // Una terapeuta contratada sin estudiante es algo que alguien tiene que
    // resolver; un espacio en blanco se lee como un fallo de la pantalla.
    expect(aQuienAcompana([])).toBe('Sin estudiante asignado')
  })
})
