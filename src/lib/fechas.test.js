import { describe, it, expect } from 'vitest'
import { fecha } from './fechas.js'

describe('fecha', () => {
  it('convierte el campo vacío en null', () => {
    // El caso que costó la primera escuela de gabinete: Postgres responde
    // 22007 invalid input syntax for type date ante "".
    expect(fecha('')).toBeNull()
    expect(fecha('   ')).toBeNull()
  })

  it('deja pasar una fecha real', () => {
    expect(fecha('2026-08-15')).toBe('2026-08-15')
  })

  it('null y undefined siguen siendo null', () => {
    expect(fecha(null)).toBeNull()
    expect(fecha(undefined)).toBeNull()
  })

  it('recorta los espacios que deja un pegado', () => {
    expect(fecha(' 2026-08-15 ')).toBe('2026-08-15')
  })
})
