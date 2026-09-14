import { describe, it, expect } from 'vitest'
import { objetivosDeTexto } from './objetivosEnLote.js'

describe('objetivosDeTexto', () => {
  it('uno por línea', () => {
    expect(objetivosDeTexto('Sostener el lápiz\nRecortar en línea recta'))
      .toEqual(['Sostener el lápiz', 'Recortar en línea recta'])
  })

  it('quita la numeración que arrastra un plan en PDF', () => {
    expect(objetivosDeTexto('1. Sostener el lápiz\n2) Recortar\n3 - Atender 10 min'))
      .toEqual(['Sostener el lápiz', 'Recortar', 'Atender 10 min'])
  })

  it('quita viñetas de todas las formas', () => {
    // Con texto realista: un objetivo de tres letras no existe, y el filtro de
    // longitud lo descartaría por otro motivo, escondiendo si la viñeta se
    // quitó o no.
    expect(objetivosDeTexto(
      '- Sostener el lápiz\n• Recortar recto\n* Atender diez minutos\n– Seguir dos consignas'
    )).toEqual([
      'Sostener el lápiz', 'Recortar recto', 'Atender diez minutos', 'Seguir dos consignas',
    ])
  })

  it('quita la numeración con letra', () => {
    expect(objetivosDeTexto('a) Primer objetivo\nb. Segundo objetivo'))
      .toEqual(['Primer objetivo', 'Segundo objetivo'])
  })

  it('NO parte un objetivo que lleva números dentro', () => {
    // "Atender 10 minutos" tiene un número y no es una viñeta.
    expect(objetivosDeTexto('Mantener la atención 10 minutos en la tarea'))
      .toEqual(['Mantener la atención 10 minutos en la tarea'])
  })

  it('descarta líneas demasiado cortas', () => {
    // Números de página y restos de maquetación.
    expect(objetivosDeTexto('Sostener el lápiz\n3\n\nPág\nRecortar bien'))
      .toEqual(['Sostener el lápiz', 'Recortar bien'])
  })

  it('no repite: el encabezado de un PDF sale en cada página', () => {
    expect(objetivosDeTexto('Plan de trabajo\nSostener el lápiz\nPlan de trabajo\nRecortar bien'))
      .toEqual(['Plan de trabajo', 'Sostener el lápiz', 'Recortar bien'])
  })

  it('ignora mayúsculas al comparar repetidos', () => {
    expect(objetivosDeTexto('Sostener el lápiz\nSOSTENER EL LÁPIZ'))
      .toEqual(['Sostener el lápiz'])
  })

  it('colapsa los espacios raros de un copiado', () => {
    expect(objetivosDeTexto('Sostener   el\tlápiz')).toEqual(['Sostener el lápiz'])
  })

  it('texto vacío no crea nada', () => {
    expect(objetivosDeTexto('')).toEqual([])
    expect(objetivosDeTexto('\n\n  \n')).toEqual([])
    expect(objetivosDeTexto()).toEqual([])
  })
})
