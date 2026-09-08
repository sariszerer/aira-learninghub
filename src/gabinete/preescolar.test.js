import { describe, it, expect } from 'vitest'
import { faltaExpediente, resumenDeNivel, RUTAS, RESULTADOS, NIVELES } from './preescolar.js'

const est = (o) => ({ id: 'e1', ruta: 'sin_evaluar', childId: null, ...o })

describe('faltaExpediente', () => {
  it('señala al derivado que no tiene expediente clínico', () => {
    // Es el hueco que el programa no puede permitirse: alguien decidió que el
    // niño necesita atención en el centro y nadie abrió su expediente.
    expect(faltaExpediente(est({ ruta: 'centro' }))).toBe(true)
    expect(faltaExpediente(est({ ruta: 'ambas' }))).toBe(true)
  })

  it('no señala al derivado que ya lo tiene', () => {
    expect(faltaExpediente(est({ ruta: 'centro', childId: 'c-asher' }))).toBe(false)
  })

  it('no señala a quien se queda en la escuela', () => {
    // Atención en la escuela NO exige expediente en el centro: es paciente del
    // programa, que es cosa distinta.
    expect(faltaExpediente(est({ ruta: 'escuela' }))).toBe(false)
    expect(faltaExpediente(est({ ruta: 'observacion' }))).toBe(false)
    expect(faltaExpediente(est({ ruta: 'sin_evaluar' }))).toBe(false)
  })
})

describe('resumenDeNivel', () => {
  it('cuenta derivados sumando centro y ambas', () => {
    const r = resumenDeNivel([
      est({ ruta: 'centro' }), est({ ruta: 'ambas' }), est({ ruta: 'escuela' }),
    ])
    expect(r.derivados).toBe(2)
  })

  it('cuenta los derivados que siguen sin expediente', () => {
    const r = resumenDeNivel([
      est({ ruta: 'centro' }),
      est({ ruta: 'centro', childId: 'c-1' }),
      est({ ruta: 'ambas' }),
    ])
    expect(r.pendientesDeExpediente).toBe(2)
  })

  it('un nivel vacío no rompe ni inventa cifras', () => {
    expect(resumenDeNivel([])).toMatchObject({
      total: 0, sinEvaluar: 0, derivados: 0, pendientesDeExpediente: 0,
    })
  })
})

describe('vocabulario', () => {
  it('los cinco niveles del preescolar', () => {
    expect(NIVELES).toEqual(['PK1', 'PK2', 'PK3', 'PK4', 'PK5'])
  })

  it('cada ruta y cada resultado tiene etiqueta y tono', () => {
    // Sin esto, un valor nuevo en la base se pinta como su clave cruda.
    for (const v of Object.values(RUTAS)) {
      expect(v.label).toBeTruthy()
      expect(v.tono).toBeTruthy()
    }
    for (const v of Object.values(RESULTADOS)) {
      expect(v.label).toBeTruthy()
      expect(v.tono).toBeTruthy()
    }
  })

  it('las claves coinciden con las que acepta la base', () => {
    // El CHECK de gabinete_estudiantes.ruta y el de tamizajes.resultado. Si
    // divergen, guardar falla en producción y no en las pruebas.
    expect(Object.keys(RUTAS).sort()).toEqual(
      ['alta', 'ambas', 'centro', 'escuela', 'observacion', 'sin_evaluar'])
    expect(Object.keys(RESULTADOS).sort()).toEqual(
      ['derivar', 'pendiente', 'seguimiento', 'sin_hallazgos'])
  })
})

describe('todos los tipos tienen formato', () => {
  it('cada tipo que una pantalla ofrece se puede abrir', async () => {
    // Sin esto, un tipo listado en el expediente pero sin formato revienta al
    // pulsar "Nuevo": formato.titulo sobre undefined.
    const { FORMATOS_TUTOR } = await import('./formatosTutor.js')
    const ofrecidos = [
      'plan_trabajo_tutor', 'supervision', 'tutor_quincenal',
      'plan_preescolar', 'seguimiento_caso', 'informe_familia',
    ]
    for (const t of ofrecidos) {
      expect(FORMATOS_TUTOR[t], t).toBeTruthy()
      expect(FORMATOS_TUTOR[t].titulo, t).toBeTruthy()
      expect(Array.isArray(FORMATOS_TUTOR[t].secciones), t).toBe(true)
    }
  })
})
