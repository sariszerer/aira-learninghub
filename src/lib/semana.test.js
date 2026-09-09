import { describe, it, expect } from 'vitest'
import {
  inicioDeSemana, sumarDias, diasDeSemana, rangoDeVista,
  agruparPorDia, repartirSolapes, franjaHoraria,
} from './semana.js'

describe('inicioDeSemana', () => {
  it('devuelve el lunes de esa semana', () => {
    // 2026-09-09 es miércoles.
    expect(inicioDeSemana('2026-09-09')).toBe('2026-09-07')
  })

  it('un lunes es su propio inicio', () => {
    expect(inicioDeSemana('2026-09-07')).toBe('2026-09-07')
  })

  it('el domingo cierra la semana, no la abre', () => {
    // Date.getDay() cuenta desde domingo; sin el ajuste, el domingo saltaría a
    // la semana siguiente y la vista mostraría los seis días equivocados.
    expect(inicioDeSemana('2026-09-13')).toBe('2026-09-07')
  })

  it('cruza el cambio de mes', () => {
    expect(inicioDeSemana('2026-10-01')).toBe('2026-09-28')
  })

  it('cruza el cambio de año', () => {
    expect(inicioDeSemana('2027-01-01')).toBe('2026-12-28')
  })
})

describe('sumarDias', () => {
  it('cruza fin de mes', () => {
    expect(sumarDias('2026-09-30', 1)).toBe('2026-10-01')
  })

  it('resta', () => {
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('acierta en año bisiesto', () => {
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('diasDeSemana', () => {
  it('siete días, de lunes a domingo', () => {
    expect(diasDeSemana('2026-09-09')).toEqual([
      '2026-09-07', '2026-09-08', '2026-09-09',
      '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13',
    ])
  })
})

describe('rangoDeVista', () => {
  it('el día pide solo ese día', () => {
    expect(rangoDeVista('dia', '2026-09-09')).toEqual({
      desde: '2026-09-09T00:00:00-05:00',
      hasta: '2026-09-09T23:59:59-05:00',
    })
  })

  it('la semana pide de lunes a domingo', () => {
    expect(rangoDeVista('semana', '2026-09-09')).toEqual({
      desde: '2026-09-07T00:00:00-05:00',
      hasta: '2026-09-13T23:59:59-05:00',
    })
  })

  it('el huso va fijo: Panamá no tiene horario de verano', () => {
    expect(rangoDeVista('dia', '2026-01-15').desde).toContain('-05:00')
    expect(rangoDeVista('dia', '2026-07-15').desde).toContain('-05:00')
  })
})

describe('agruparPorDia', () => {
  it('reparte por fecha conservando el orden', () => {
    const m = agruparPorDia([
      { id: 'a', fecha: '2026-09-09' },
      { id: 'b', fecha: '2026-09-10' },
      { id: 'c', fecha: '2026-09-09' },
    ])
    expect(m.get('2026-09-09').map((e) => e.id)).toEqual(['a', 'c'])
    expect(m.get('2026-09-10').map((e) => e.id)).toEqual(['b'])
  })
})

describe('repartirSolapes', () => {
  const ev = (id, inicioMin, finMin) => ({ id, inicioMin, finMin })

  it('una cita sola ocupa todo el ancho', () => {
    const [r] = repartirSolapes([ev('a', 600, 645)])
    expect(r).toMatchObject({ columna: 0, columnas: 1 })
  })

  it('dos citas a la misma hora se ponen lado a lado', () => {
    // El caso real del 9 de septiembre: dos citas a las 2:45 con especialistas
    // distintas. Dibujadas encima, la segunda desaparece.
    const r = repartirSolapes([ev('haim-sarita', 885, 930), ev('haim-ingrid', 885, 930)])
    expect(r.map((e) => e.columna)).toEqual([0, 1])
    expect(r.every((e) => e.columnas === 2)).toBe(true)
  })

  it('dos citas seguidas comparten columna: no se pisan', () => {
    const r = repartirSolapes([ev('a', 600, 645), ev('b', 645, 690)])
    expect(r.map((e) => e.columnas)).toEqual([1, 1])
  })

  it('reutiliza la columna que ya quedó libre', () => {
    // a y b se pisan; c empieza cuando a terminó, así que cabe en su columna y
    // el racimo no se ensancha a tres.
    const r = repartirSolapes([ev('a', 600, 660), ev('b', 610, 700), ev('c', 660, 720)])
    const porId = Object.fromEntries(r.map((e) => [e.id, e]))
    expect(porId.c.columna).toBe(0)
    expect(porId.c.columnas).toBe(2)
  })

  it('el ancho lo fija el racimo, no cada cita', () => {
    // Si el ancho se calculara por cita, a saldría a ancho completo y taparía
    // a las otras dos justo donde el día está más cargado.
    const r = repartirSolapes([ev('a', 600, 780), ev('b', 610, 650), ev('c', 620, 660)])
    expect(new Set(r.map((e) => e.columnas))).toEqual(new Set([3]))
  })

  it('deja fuera los eventos de día completo', () => {
    // No tienen hora: en la rejilla no hay dónde ponerlos, van en su propia
    // banda arriba.
    expect(repartirSolapes([{ id: 'vacaciones', inicioMin: null, finMin: null }])).toEqual([])
  })

  it('sin eventos no revienta', () => {
    expect(repartirSolapes([])).toEqual([])
    expect(repartirSolapes()).toEqual([])
  })
})

describe('franjaHoraria', () => {
  it('se ajusta a lo que hay, con una hora de margen', () => {
    expect(franjaHoraria([{ inicioMin: 585, finMin: 630 }])).toEqual({ desde: 8, hasta: 12 })
  })

  it('un día vacío cae a la jornada habitual', () => {
    // Sin esto la rejilla saldría de altura cero.
    expect(franjaHoraria([])).toEqual({ desde: 7, hasta: 19 })
  })

  it('no se sale del día', () => {
    expect(franjaHoraria([{ inicioMin: 5, finMin: 1435 }])).toEqual({ desde: 0, hasta: 24 })
  })

  it('ignora los de día completo al calcular la franja', () => {
    expect(franjaHoraria([{ inicioMin: null, finMin: null }, { inicioMin: 600, finMin: 660 }]))
      .toEqual({ desde: 9, hasta: 12 })
  })
})
