import { describe, it, expect, vi } from 'vitest'

// El cliente se crea al importar el modulo y necesita las variables de entorno.
vi.stubEnv('VITE_SUPABASE_URL', 'https://ejemplo.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'clave-de-prueba')

const { dbChildToApp, dbObjectiveToApp, dbSessionToApp, dbUserToApp, dbEvolutionReportToApp } =
  await import('./supabase.js')

// Los mappers son el punto donde un campo nuevo se pierde en silencio: si falta
// una linea, la columna existe en la base, la interfaz la escribe y al releerla
// vuelve vacia sin un solo error.

describe('dbObjectiveToApp — escala GAS', () => {
  it('conserva el cero, que es la meta esperada y no "sin valor"', () => {
    // Es la trampa de este campo: con || en vez de ?? el nivel 0 — justo el que
    // significa "alcanzo la meta" — se guardaria como nulo.
    const o = dbObjectiveToApp({ id: 'o1', gas_baseline: 0, gas_target: 0, gas_current: 0 })
    expect(o).toMatchObject({ gasBaseline: 0, gasTarget: 0, gasCurrent: 0 })
  })

  it('conserva los negativos', () => {
    const o = dbObjectiveToApp({ id: 'o1', gas_baseline: -2, gas_current: -1 })
    expect(o.gasBaseline).toBe(-2)
    expect(o.gasCurrent).toBe(-1)
  })

  it('deja nulo lo que no está medido', () => {
    const o = dbObjectiveToApp({ id: 'o1' })
    expect(o.gasBaseline ?? null).toBeNull()
    expect(o.methodology ?? null).toBeNull()
  })
})

describe('dbSessionToApp — asistencia', () => {
  it('mapea el estado registrado', () => {
    expect(dbSessionToApp({ id: 's1', attendance: 'no_show' }).attendance).toBe('no_show')
  })

  it('las sesiones sin campo cuentan como asistidas', () => {
    // Las 438 importadas del calendario ya ocurrieron.
    expect(dbSessionToApp({ id: 's1' }).attendance).toBe('asistio')
  })
})

describe('dbChildToApp — campos del Historial Clínico', () => {
  it('mapea expediente, colegio, motivo de consulta y alta', () => {
    const c = dbChildToApp({
      id: 'c1', record_no: 'AIRA-0007', school: 'Colegio X',
      referral_reason: 'Motivo', discharge_date: '2026-01-01', discharge_reason: 'Alta',
      status: 'alta',
    })
    expect(c).toMatchObject({
      recordNo: 'AIRA-0007', school: 'Colegio X', referralReason: 'Motivo',
      dischargeDate: '2026-01-01', dischargeReason: 'Alta', status: 'alta',
    })
  })
})

describe('dbUserToApp — firma del reporte', () => {
  it('mapea el N° de idoneidad', () => {
    expect(dbUserToApp({ id: 'u1', license_no: 'IDON-4471' }).licenseNo).toBe('IDON-4471')
  })
})

describe('dbEvolutionReportToApp', () => {
  it('mapea el reporte guardado con su contenido', () => {
    const r = dbEvolutionReportToApp({
      id: 'er1', child_id: 'c1', specialty: 'OT', specialist_id: 'u1',
      from_date: '2026-01-01', to_date: '2026-03-31',
      generated_date: '2026-04-01', generated_by: 'u2',
      content: { logros: ['uno'] },
    })
    expect(r).toMatchObject({
      childId: 'c1', specialistId: 'u1', fromDate: '2026-01-01',
      toDate: '2026-03-31', generatedBy: 'u2',
    })
    expect(r.content.logros).toEqual(['uno'])
  })

  it('un contenido nulo se lee como objeto vacío, no revienta al acceder', () => {
    expect(dbEvolutionReportToApp({ id: 'er1', content: null }).content).toEqual({})
  })
})
