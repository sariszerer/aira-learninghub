import { describe, it, expect } from 'vitest'
import { textoDeConexion } from './conexion.js'

const AHORA = new Date('2026-09-14T18:00:00Z').getTime()
const hace = (ms) => new Date(AHORA - ms).toISOString()
const MIN = 60e3, HORA = 60 * MIN, DIA = 24 * HORA

describe('textoDeConexion', () => {
  it('quien nunca entró se marca como pendiente, no como vacío', () => {
    // Es una tarea de la administración — hay que mandarle su acceso — y ocho
    // de once cuentas estaban así sin que se pudiera ver desde la aplicación.
    expect(textoDeConexion(null, AHORA)).toEqual({ texto: 'Nunca ha entrado', tono: 'pendiente' })
  })

  it('lo de hace un momento', () => {
    expect(textoDeConexion(hace(30e3), AHORA).texto).toBe('Ahora mismo')
    expect(textoDeConexion(hace(20 * MIN), AHORA).texto).toBe('Hace 20 min')
  })

  it('horas y días', () => {
    expect(textoDeConexion(hace(5 * HORA), AHORA).texto).toBe('Hace 5 h')
    expect(textoDeConexion(hace(DIA), AHORA).texto).toBe('Ayer')
    expect(textoDeConexion(hace(9 * DIA), AHORA).texto).toBe('Hace 9 días')
  })

  it('a partir del mes se redondea', () => {
    expect(textoDeConexion(hace(40 * DIA), AHORA).texto).toBe('Hace un mes')
    expect(textoDeConexion(hace(100 * DIA), AHORA).texto).toBe('Hace 3 meses')
  })

  it('un reloj adelantado no produce "en 3 horas"', () => {
    // El móvil de quien mira puede ir por delante del servidor.
    expect(textoDeConexion(new Date(AHORA + 3 * HORA).toISOString(), AHORA).texto)
      .toBe('Ahora mismo')
  })

  it('una fecha rota no revienta la lista entera', () => {
    expect(textoDeConexion('no-es-fecha', AHORA)).toEqual({ texto: '—', tono: 'neutro' })
  })

  it('el tono distingue pendiente de simplemente antiguo', () => {
    expect(textoDeConexion(null, AHORA).tono).toBe('pendiente')
    expect(textoDeConexion(hace(100 * DIA), AHORA).tono).toBe('lejano')
  })
})
