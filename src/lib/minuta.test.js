import { describe, it, expect } from 'vitest'
import {
  participantesDe, participantesATexto, tiposDe, textoDeTipos,
  tituloDeMinuta, faltaEnMinuta,
} from './minuta.js'

describe('participantesDe', () => {
  it('uno por línea', () => {
    expect(participantesDe('María López (TO)\nMaestra guía\nPapá'))
      .toEqual(['María López (TO)', 'Maestra guía', 'Papá'])
  })

  it('también acepta punto y coma, que es como los escribe mucha gente', () => {
    expect(participantesDe('Ana; Luis')).toEqual(['Ana', 'Luis'])
  })

  it('descarta líneas en blanco y espacios sueltos', () => {
    expect(participantesDe('  Ana  \n\n\n  Luis \n ')).toEqual(['Ana', 'Luis'])
  })

  it('NO parte por comas', () => {
    // "María López, Terapeuta Ocupacional" es UNA persona con su cargo. Partir
    // por comas la convertía en dos participantes inventados.
    expect(participantesDe('María López, Terapeuta Ocupacional'))
      .toEqual(['María López, Terapeuta Ocupacional'])
  })

  it('vacío da lista vacía', () => {
    expect(participantesDe('')).toEqual([])
    expect(participantesDe()).toEqual([])
  })

  it('ida y vuelta conserva la lista', () => {
    const lista = ['Ana', 'Luis']
    expect(participantesDe(participantesATexto(lista))).toEqual(lista)
  })
})

describe('tiposDe', () => {
  it('acepta la lista nueva', () => {
    expect(tiposDe(['Escuela', 'Familia'])).toEqual(['Escuela', 'Familia'])
  })

  it('acepta el valor antiguo de una sola cadena', () => {
    // Puede venir de una fila guardada antes del cambio de columna.
    expect(tiposDe('Escuela')).toEqual(['Escuela'])
  })

  it('vacío o nulo da lista vacía', () => {
    expect(tiposDe(null)).toEqual([])
    expect(tiposDe('')).toEqual([])
    expect(tiposDe([])).toEqual([])
  })
})

describe('textoDeTipos', () => {
  it('uno solo', () => {
    expect(textoDeTipos(['Escuela'])).toBe('Escuela')
  })

  it('dos se unen con "y"', () => {
    expect(textoDeTipos(['Escuela', 'Familia'])).toBe('Escuela y Familia')
  })

  it('tres llevan comas y la última con "y"', () => {
    expect(textoDeTipos(['Escuela', 'Familia', 'Otro'])).toBe('Escuela, Familia y Otro')
  })

  it('sin tipo lo dice en vez de quedarse en blanco', () => {
    expect(textoDeTipos([])).toBe('Sin clasificar')
  })
})

describe('tituloDeMinuta', () => {
  it('lleva el nombre del niño: la minuta sale del centro', () => {
    // Quien la recibe — un colegio, un especialista externo — puede tener
    // varios casos abiertos.
    expect(tituloDeMinuta({}, { name: 'Asher', lastName: 'Btesh' }))
      .toBe('Minuta — Asher Btesh')
  })

  it('sin niño no deja el guion colgando', () => {
    expect(tituloDeMinuta({}, null)).toBe('Minuta interdisciplinaria')
  })
})

describe('faltaEnMinuta', () => {
  it('pide participantes y resumen', () => {
    expect(faltaEnMinuta({})).toEqual(['los participantes', 'el resumen'])
  })

  it('una minuta completa no falta nada', () => {
    expect(faltaEnMinuta({ participants: 'Ana', summary: 'Se habló del caso' })).toEqual([])
  })

  it('los acuerdos son opcionales: una reunión puede no cerrar nada', () => {
    expect(faltaEnMinuta({ participants: 'Ana', summary: 'x', agreements: '' })).toEqual([])
  })
})
