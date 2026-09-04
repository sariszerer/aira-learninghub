import { describe, it, expect } from 'vitest'
import {
  resumenAsistencia, progresoParaFamilia, etiquetaGas,
  avancePorObjetivo, logrosDestacados, areasDeAtencion,
  especialistasInvolucrados, evaluacionesIniciales, planesPorDisciplina,
  estadoDelPaciente, textoRango, sesionesEnRango, especialidadesDelPaciente,
  especialidadPrincipal,
} from './reportes.js'

const ses = (o) => ({ childId: 'c1', date: '2026-01-01', attendance: 'asistio', objectivesWorked: [], ...o })

describe('resumenAsistencia', () => {
  it('cuenta cada estado por separado', () => {
    const r = resumenAsistencia([
      ses({ attendance: 'asistio' }), ses({ attendance: 'asistio' }),
      ses({ attendance: 'cancelo' }), ses({ attendance: 'no_show' }),
      ses({ attendance: 'reprogramada' }),
    ])
    expect(r).toMatchObject({ programadas: 5, asistidas: 2, canceladas: 1, ausencias: 1, reprogramadas: 1 })
  })

  it('excluye las reprogramadas del porcentaje', () => {
    // Una sesion movida de fecha no es una falta: contarla castigaria a quien
    // aviso y reagendo. 2 de 3 (no de 4) = 67%.
    const r = resumenAsistencia([
      ses({ attendance: 'asistio' }), ses({ attendance: 'asistio' }),
      ses({ attendance: 'no_show' }), ses({ attendance: 'reprogramada' }),
    ])
    expect(r.porcentaje).toBe(67)
  })

  it('trata la asistencia ausente como asistio', () => {
    // Las 438 sesiones importadas del calendario no traian el campo.
    expect(resumenAsistencia([{ }, { }]).asistidas).toBe(2)
  })

  it('devuelve porcentaje nulo sin sesiones, no 0%', () => {
    // 0% dice "no vino nunca"; nulo dice "no hay nada que medir".
    expect(resumenAsistencia([]).porcentaje).toBeNull()
    expect(resumenAsistencia([ses({ attendance: 'reprogramada' })]).porcentaje).toBeNull()
  })

  it('ignora un estado desconocido en vez de romper', () => {
    expect(resumenAsistencia([ses({ attendance: 'inventado' })]).programadas).toBe(1)
  })
})

describe('progresoParaFamilia', () => {
  it('traduce el nivel GAS a las tres palabras del documento', () => {
    expect(progresoParaFamilia({ gasCurrent: 2 })).toBe('Logrado')
    expect(progresoParaFamilia({ gasCurrent: 0 })).toBe('Logrado')   // 0 es la meta esperada
    expect(progresoParaFamilia({ gasCurrent: -1 })).toBe('En progreso')
    expect(progresoParaFamilia({ gasCurrent: -2 })).toBe('Iniciando')
  })

  it('cae al semaforo cuando no hay GAS', () => {
    expect(progresoParaFamilia({ status: 'logrado' })).toBe('Logrado')
    expect(progresoParaFamilia({ status: 'apoyo' })).toBe('Iniciando')
  })

  it('el GAS manda sobre el semaforo si estan en desacuerdo', () => {
    expect(progresoParaFamilia({ gasCurrent: -2, status: 'logrado' })).toBe('Iniciando')
  })

  it('nunca deja al reporte de la familia sin texto', () => {
    expect(progresoParaFamilia({})).toBe('En progreso')
    expect(progresoParaFamilia(null)).toBe('En progreso')
  })
})

describe('etiquetaGas', () => {
  it('nombra los cinco niveles y nada mas', () => {
    expect(etiquetaGas(0)).toBe('Meta esperada')
    expect(etiquetaGas(-2)).toBe('Mucho menos de lo esperado')
    expect(etiquetaGas(7)).toBeNull()
    expect(etiquetaGas(null)).toBeNull()
  })
})

describe('avancePorObjetivo', () => {
  const objetivos = [{ id: 'o1', name: 'A', gasBaseline: -1, gasTarget: 0, gasCurrent: 0 }]
  const sesiones = [
    ses({ id: 's1', date: '2026-01-02', observation: 'Buena sesión', objectivesWorked: [{ objectiveId: 'o1', status: 'proceso' }] }),
    ses({ id: 's2', date: '2026-01-01', observation: '  ', objectivesWorked: [{ objectiveId: 'o1', status: 'logrado' }] }),
    ses({ id: 's3', date: '2026-01-03', observation: 'De otro objetivo', objectivesWorked: [{ objectiveId: 'otro', status: 'proceso' }] }),
  ]

  it('cuenta las veces trabajado solo de ese objetivo', () => {
    expect(avancePorObjetivo(objetivos, sesiones)[0].vecesTrabajado).toBe(2)
  })

  it('la evidencia excluye observaciones vacias y las de otros objetivos', () => {
    const ev = avancePorObjetivo(objetivos, sesiones)[0].evidencia
    expect(ev).toEqual([{ fecha: '2026-01-02', texto: 'Buena sesión' }])
  })

  it('marca la meta alcanzada comparando actual con meta', () => {
    expect(avancePorObjetivo(objetivos, sesiones)[0].gas.alcanzada).toBe(true)
    expect(avancePorObjetivo([{ id: 'o1', gasTarget: 0, gasCurrent: -1 }], [])[0].gas.alcanzada).toBe(false)
  })

  it('deja alcanzada en nulo si falta actual o meta, en vez de fingir una medicion', () => {
    expect(avancePorObjetivo([{ id: 'o1', gasTarget: 0 }], [])[0].gas.alcanzada).toBeNull()
    expect(avancePorObjetivo([{ id: 'o1', gasCurrent: 0 }], [])[0].gas.alcanzada).toBeNull()
  })

  it('no rompe con una sesion sin objectivesWorked', () => {
    expect(avancePorObjetivo(objetivos, [{ date: '2026-01-01' }])[0].vecesTrabajado).toBe(0)
  })
})

describe('logrosDestacados y areasDeAtencion', () => {
  const objetivos = [
    { id: 'o1', status: 'logrado' },
    { id: 'o2', status: 'apoyo' },
    { id: 'o3', status: 'logrado' },      // logrado pero no trabajado en el periodo
    { id: 'o4', gasCurrent: 1, status: 'proceso' },
  ]
  const sesiones = [ses({ objectivesWorked: [{ objectiveId: 'o1' }, { objectiveId: 'o2' }, { objectiveId: 'o4' }] })]

  it('solo destaca lo logrado que ademas se trabajo en el periodo', () => {
    // o3 esta logrado pero de un periodo anterior: destacarlo seria atribuir a
    // este corte un avance que no ocurrio en el.
    expect(logrosDestacados(objetivos, sesiones).map((o) => o.id)).toEqual(['o1', 'o4'])
  })

  it('las areas de atencion no dependen del periodo', () => {
    expect(areasDeAtencion(objetivos).map((o) => o.id)).toEqual(['o2'])
  })
})

describe('especialistasInvolucrados', () => {
  const usuarios = [{ id: 'u1', name: 'Ana', specialty: 'OT' }, { id: 'u2', name: 'Luis', specialty: 'Lenguaje' }]

  it('deriva el periodo de atencion de las sesiones reales', () => {
    const r = especialistasInvolucrados([
      ses({ specialistId: 'u1', date: '2026-03-01', specialty: 'OT' }),
      ses({ specialistId: 'u1', date: '2026-01-01', specialty: 'OT' }),
    ], usuarios)
    expect(r[0]).toMatchObject({ nombre: 'Ana', desde: '2026-01-01', hasta: '2026-03-01', sesiones: 2 })
  })

  it('incluye a quien atendio aunque ya no este asignado', () => {
    const r = especialistasInvolucrados([ses({ specialistId: 'u2', date: '2026-01-01' })], usuarios, [])
    expect(r.map((x) => x.nombre)).toContain('Luis')
  })

  it('incluye a quien esta asignado pero nunca atendio, sin periodo', () => {
    const r = especialistasInvolucrados([], usuarios, ['u1'])
    expect(r[0]).toMatchObject({ nombre: 'Ana', desde: null, hasta: null, sesiones: 0 })
  })

  it('ordena cronologicamente y deja al final a los que no atendieron', () => {
    const r = especialistasInvolucrados([ses({ specialistId: 'u2', date: '2026-05-01' })], usuarios, ['u1'])
    expect(r.map((x) => x.nombre)).toEqual(['Luis', 'Ana'])
  })
})

describe('evaluacionesIniciales', () => {
  it('toma solo evaluaciones y anamnesis, en orden cronologico', () => {
    const docs = [
      { id: 'd1', type: 'reporte', date: '2026-01-01' },
      { id: 'd2', type: 'evaluacion', date: '2026-03-01' },
      { id: 'd3', type: 'anamnesis', date: '2026-02-01' },
    ]
    expect(evaluacionesIniciales(docs).map((d) => d.id)).toEqual(['d3', 'd2'])
  })
})

describe('planesPorDisciplina', () => {
  it('agrupa por area y fecha con el objetivo mas antiguo', () => {
    const r = planesPorDisciplina([
      { id: 'o1', area: 'OT', createdDate: '2026-02-01', specialistId: 'u1' },
      { id: 'o2', area: 'OT', createdDate: '2026-01-01', specialistId: 'u1' },
      { id: 'o3', area: 'Lenguaje', createdDate: '2026-03-01', specialistId: 'u2' },
    ], [{ id: 'u1', name: 'Ana' }, { id: 'u2', name: 'Luis' }])
    expect(r.map((p) => [p.area, p.inicio])).toEqual([['OT', '2026-01-01'], ['Lenguaje', '2026-03-01']])
    expect(r[0].especialistas).toEqual(['Ana'])
  })

  it('agrupa los objetivos sin area bajo una etiqueta explicita', () => {
    expect(planesPorDisciplina([{ id: 'o1' }])[0].area).toBe('Sin disciplina')
  })
})

describe('estadoDelPaciente', () => {
  it('traduce los cuatro estados', () => {
    expect(estadoDelPaciente({ status: 'pausa' })).toBe('En pausa')
    expect(estadoDelPaciente({ status: 'alta' })).toBe('De alta')
    expect(estadoDelPaciente({ status: 'inactivo' })).toBe('Inactivo')
  })

  it('sin estado asume activo', () => {
    expect(estadoDelPaciente({})).toBe('Activo')
    expect(estadoDelPaciente(null)).toBe('Activo')
  })
})

describe('sesionesEnRango y textoRango', () => {
  const sesiones = [
    ses({ id: 'a', date: '2026-01-01' }),
    ses({ id: 'b', date: '2026-06-01' }),
    ses({ id: 'c', date: '2026-12-01' }),
    ses({ id: 'd', date: '2026-06-01', childId: 'otro' }),
  ]

  it('filtra por paciente y por rango, con ambos extremos incluidos', () => {
    expect(sesionesEnRango(sesiones, 'c1', '2026-01-01', '2026-06-01').map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('sin rango devuelve todo lo del paciente, ordenado', () => {
    expect(sesionesEnRango(sesiones, 'c1').map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('describe el rango en texto', () => {
    expect(textoRango(null, null)).toBe('Todo el historial')
    expect(textoRango('2026-01-01', null)).toMatch(/^Desde /)
    expect(textoRango(null, '2026-01-01')).toMatch(/^Hasta /)
    expect(textoRango('2026-01-01', '2026-06-01')).toContain('—')
  })
})

describe('especialidadesDelPaciente', () => {
  const child = { id: 'c1', specialties: ['Terapia Ocupacional'] }

  it('incluye disciplinas que solo aparecen en las sesiones', () => {
    // Caso real: la ficha de un paciente declaraba una sola disciplina y tenía
    // sesiones de tres. El reporte arrancaba filtrado por la declarada y dejaba
    // fuera un tercio del expediente.
    const r = especialidadesDelPaciente(child, [
      ses({ specialty: 'Funciones Ejecutivas' }),
      ses({ specialty: 'Fonoaudiología' }),
    ])
    expect(r).toEqual(['Fonoaudiología', 'Funciones Ejecutivas', 'Terapia Ocupacional'])
  })

  it('incluye áreas que solo aparecen en los objetivos', () => {
    const r = especialidadesDelPaciente(child, [], [{ childId: 'c1', area: 'Psicología' }])
    expect(r).toContain('Psicología')
  })

  it('no mezcla datos de otros pacientes', () => {
    const r = especialidadesDelPaciente(child,
      [ses({ childId: 'otro', specialty: 'Kids Club' })],
      [{ childId: 'otro', area: 'Kids Club' }])
    expect(r).toEqual(['Terapia Ocupacional'])
  })

  it('no repite ni deja huecos', () => {
    const r = especialidadesDelPaciente(
      { id: 'c1', specialties: ['A', null, 'A'] },
      [ses({ specialty: 'A' }), ses({ specialty: null })]
    )
    expect(r).toEqual(['A'])
  })

  it('con una ficha vacía devuelve lista vacía en vez de romper', () => {
    expect(especialidadesDelPaciente(null)).toEqual([])
    expect(especialidadesDelPaciente({ id: 'c1' })).toEqual([])
  })
})

describe('especialidadPrincipal', () => {
  const child = { id: 'c1', specialties: ['Terapia Ocupacional'] }

  it('elige la de más sesiones, no la primera alfabéticamente', () => {
    // Caso real: 27 sesiones de Terapia Ocupacional, 11 de Funciones Ejecutivas
    // y 2 de Fonoaudiología. El reporte abría en la última, la de menos
    // contenido, solo porque su nombre empieza por F.
    const sesiones = [
      ...Array(27).fill(0).map(() => ses({ specialty: 'Terapia Ocupacional' })),
      ...Array(11).fill(0).map(() => ses({ specialty: 'Funciones Ejecutivas' })),
      ...Array(2).fill(0).map(() => ses({ specialty: 'Fonoaudiología' })),
    ]
    expect(especialidadPrincipal(child, sesiones)).toBe('Terapia Ocupacional')
  })

  it('a igualdad de sesiones desempata por número de objetivos', () => {
    const sesiones = [ses({ specialty: 'A' }), ses({ specialty: 'B' })]
    const objetivos = [{ childId: 'c1', area: 'B' }, { childId: 'c1', area: 'B' }]
    expect(especialidadPrincipal({ id: 'c1' }, sesiones, objetivos)).toBe('B')
  })

  it('con una sola disciplina la devuelve', () => {
    expect(especialidadPrincipal(child, [])).toBe('Terapia Ocupacional')
  })

  it('sin ninguna cae a "Todas" en vez de dejar el filtro indefinido', () => {
    expect(especialidadPrincipal({ id: 'c1' }, [], [])).toBe('Todas')
  })
})
