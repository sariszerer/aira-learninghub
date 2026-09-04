import { describe, it, expect } from 'vitest'
import { readableTextOn, contrasteWCAG } from './format.js'
import { SPECIALIST_COLORS } from '../theme.js'

// Referencias verificables contra la formula WCAG 2.1, no contra la salida de
// esta implementacion: si alguien la reescribe mal, estas fallan.
describe('contrasteWCAG', () => {
  it('da 21 entre negro y blanco y 1 contra si mismo', () => {
    expect(contrasteWCAG('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrasteWCAG('#1E79E2', '#1E79E2')).toBeCloseTo(1, 5)
  })

  it('es simetrico', () => {
    expect(contrasteWCAG('#597990', '#FFFFFF')).toBeCloseTo(contrasteWCAG('#FFFFFF', '#597990'), 10)
  })

  it('lineariza el canal en vez de usar el sRGB crudo', () => {
    // El gris medio #808080 da 3.95 contra blanco con la formula WCAG. Con
    // brillo percibido daria ~2.1: es el error que hacia fallar readableTextOn.
    expect(contrasteWCAG('#808080', '#FFFFFF')).toBeCloseTo(3.95, 2)
  })
})

describe('readableTextOn', () => {
  it('elige siempre la tinta que mas contrasta, no la de un umbral fijo', () => {
    // #7FA88A era el caso roto: devolvia blanco (2.67) teniendo oscuro a 6.65.
    for (const bg of ['#7FA88A', '#E07A3A', '#9AA4C4', '#C79A6B', '#D4A843', '#C0392B', '#175FAF']) {
      const elegida = readableTextOn(bg)
      const otra = elegida === '#fff' ? '#1B2A3A' : '#FFFFFF'
      expect(contrasteWCAG(elegida === '#fff' ? '#FFFFFF' : elegida, bg))
        .toBeGreaterThanOrEqual(contrasteWCAG(otra, bg))
    }
  })

  it('mantiene blanco sobre el azul de marca', () => {
    // Si el criterio se volviera mas agresivo, los avatares de marca pasarian a
    // texto oscuro y la interfaz quedaria con dos tintas mezcladas.
    expect(readableTextOn('#1E79E2')).toBe('#fff')
  })

  it('acepta la forma corta de tres digitos', () => {
    expect(readableTextOn('#fff')).toBe('#1B2A3A')
    expect(readableTextOn('#000')).toBe('#fff')
  })

  it('cae a blanco con entrada invalida en vez de romper', () => {
    for (const malo of [null, undefined, '', 'rojo', 'rgb(1,2,3)']) {
      expect(readableTextOn(malo)).toBe('#fff')
    }
  })
})

describe('SPECIALIST_COLORS', () => {
  it('todos son legibles en blanco a nivel AA', () => {
    // Contrato de la paleta: sin esto, anadir un color claro a mano vuelve a
    // producir el avatar ilegible que motivo el cambio.
    const flojos = Object.entries(SPECIALIST_COLORS)
      .map(([id, hex]) => [id, hex, +contrasteWCAG('#FFFFFF', hex).toFixed(2)])
      .filter(([, , c]) => c < 4.5)
    expect(flojos).toEqual([])
  })

  it('readableTextOn devuelve blanco para toda la paleta', () => {
    for (const hex of Object.values(SPECIALIST_COLORS)) {
      expect(readableTextOn(hex)).toBe('#fff')
    }
  })
})
