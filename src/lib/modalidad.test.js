import { describe, it, expect } from 'vitest'
import { esAcompanada, textoDeModalidad, faltaEnModalidad, MODALIDADES } from './modalidad.js'

describe('esAcompanada', () => {
  it('sin modalidad, la dio una sola persona', () => {
    expect(esAcompanada("")).toBe(false)
    expect(esAcompanada(null)).toBe(false)
    expect(esAcompanada(undefined)).toBe(false)
    expect(esAcompanada("   ")).toBe(false)
  })

  it('con modalidad, estuvieron dos', () => {
    expect(esAcompanada("Acompañamiento")).toBe(true)
    expect(esAcompanada("Suplencia")).toBe(true)
  })
})

describe('textoDeModalidad', () => {
  it('acompañar es CON la otra persona', () => {
    expect(textoDeModalidad("Acompañamiento", "Celilia Miranda"))
      .toBe("Acompañamiento con Celilia Miranda")
  })

  it('suplir es DE la otra persona', () => {
    // No es un detalle de estilo: "suplencia a Celilia" se entiende al revés.
    // Quien suple y quien es suplida se invierten.
    expect(textoDeModalidad("Suplencia", "Celilia Miranda"))
      .toBe("Suplencia de Celilia Miranda")
  })

  it('una figura que invente el centro también se lee', () => {
    expect(textoDeModalidad("Entrenamiento", "Celilia Miranda"))
      .toBe("Entrenamiento con Celilia Miranda")
  })

  it('sin la otra persona, al menos se dice la figura', () => {
    expect(textoDeModalidad("Suplencia", "")).toBe("Suplencia")
    expect(textoDeModalidad("Suplencia", null)).toBe("Suplencia")
  })

  it('una sesión normal no dice nada', () => {
    expect(textoDeModalidad("", "Celilia")).toBe(null)
    expect(textoDeModalidad(null, null)).toBe(null)
  })
})

describe('faltaEnModalidad', () => {
  it('una sesión normal no pide nada', () => {
    expect(faltaEnModalidad({ modalidad: "", conEspecialista: null })).toEqual([])
  })

  it('una suplencia sin decir a quién no sirve', () => {
    expect(faltaEnModalidad({ modalidad: "Suplencia" })).toEqual(["con qué especialista"])
  })

  it('con la otra persona ya está completa', () => {
    expect(faltaEnModalidad({ modalidad: "Suplencia", conEspecialista: "u-celi" })).toEqual([])
  })
})

describe('MODALIDADES', () => {
  it('trae las figuras que usa el centro', () => {
    expect(MODALIDADES).toContain("Acompañamiento")
    expect(MODALIDADES).toContain("Suplencia")
  })
})
