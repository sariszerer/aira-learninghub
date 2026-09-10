import { describe, it, expect } from 'vitest'
import { esAcudiente, pestanasDe, tienePestana, pideDatosDeNino, textoDeVinculo, TIPOS } from './expediente.js'

const nino = { id: 'c1', name: 'Asher', lastName: 'Btesh', tipo: 'nino' }
const madre = { id: 'a1', name: 'Sara', lastName: 'Levy', tipo: 'acudiente', acudienteDe: 'c1' }

describe('esAcudiente', () => {
  it('distingue los dos tipos', () => {
    expect(esAcudiente(madre)).toBe(true)
    expect(esAcudiente(nino)).toBe(false)
  })

  it('sin tipo se trata como niño', () => {
    // Los 44 pacientes que ya existen no tienen el campo puesto a mano: la
    // columna trae 'nino' por defecto, pero un objeto a medio construir en la
    // interfaz no debe convertirse en acudiente por accidente.
    expect(esAcudiente({ id: 'x' })).toBe(false)
    expect(esAcudiente(null)).toBe(false)
  })
})

describe('pestanasDe', () => {
  it('el acudiente tiene exactamente resumen, sesiones, objetivos y plan', () => {
    expect(pestanasDe(madre)).toEqual(['resumen', 'sesiones', 'objetivos', 'plan'])
  })

  it('el niño las tiene todas', () => {
    expect(pestanasDe(nino)).toContain('anamnesis')
    expect(pestanasDe(nino)).toContain('reportes')
    expect(pestanasDe(nino)).toContain('interdisciplinario')
  })

  it('al acudiente no se le ofrece anamnesis ni reporte para la familia', () => {
    // No es un hueco por llenar: a una madre no se le hace anamnesis del
    // desarrollo, y el reporte para la familia iría dirigido a ella misma.
    expect(tienePestana(madre, 'anamnesis')).toBe(false)
    expect(tienePestana(madre, 'reportes')).toBe(false)
    expect(tienePestana(madre, 'interdisciplinario')).toBe(false)
  })

  it('las de acudiente son un subconjunto de las del niño', () => {
    // Si dejan de serlo, hay una pestaña que solo existe en un tipo y el
    // componente que la pinta tendría que saberlo.
    for (const p of pestanasDe(madre)) expect(pestanasDe(nino)).toContain(p)
  })
})

describe('pideDatosDeNino', () => {
  it('a la madre no se le piden fecha de nacimiento ni colegio', () => {
    expect(pideDatosDeNino(madre)).toBe(false)
    expect(pideDatosDeNino(nino)).toBe(true)
  })
})

describe('textoDeVinculo', () => {
  it('nombra al hijo cuando es paciente del centro', () => {
    expect(textoDeVinculo(madre, [nino])).toBe('Madre o padre de Asher Btesh')
  })

  it('lo dice cuando el hijo no está en el centro', () => {
    // También se atiende a familias cuyo hijo no es paciente aquí.
    expect(textoDeVinculo({ ...madre, acudienteDe: null }, [nino]))
      .toBe('Sin hijo o hija en el centro')
  })

  it('un niño no tiene vínculo que mostrar', () => {
    expect(textoDeVinculo(nino, [])).toBeNull()
  })
})

describe('vocabulario', () => {
  it('cada tipo tiene su etiqueta', () => {
    for (const v of Object.values(TIPOS)) {
      expect(v.label).toBeTruthy()
      expect(v.plural).toBeTruthy()
    }
  })

  it('las claves coinciden con las que acepta la base', () => {
    // El CHECK de children.tipo. Si divergen, guardar falla en producción y no
    // en las pruebas.
    expect(Object.keys(TIPOS).sort()).toEqual(['acudiente', 'nino'])
  })
})
