import { describe, it, expect } from 'vitest'
import { nuevoId } from './identificador.js'

describe('nuevoId', () => {
  it('no repite aunque se llame mil veces seguidas', () => {
    // Es el caso real: "Pegar varios" crea los objetivos en un bucle, todos
    // dentro del mismo milisegundo. Con `o-${Date.now()}` los mil tenian el
    // mismo id y la base se quedaba con uno.
    const ids = Array.from({ length: 1000 }, () => nuevoId('o'))
    expect(new Set(ids).size).toBe(1000)
  })

  it('lleva el prefijo que se le pide', () => {
    expect(nuevoId('mtg')).toMatch(/^mtg-\d+-\d+$/)
  })

  it('dos prefijos distintos no se pisan', () => {
    expect(nuevoId('o')).not.toBe(nuevoId('doc'))
  })
})
