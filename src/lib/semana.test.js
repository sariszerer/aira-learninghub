import { describe, it, expect } from 'vitest'
import {
  inicioDeSemana, sumarDias, diasDeSemana, rangoDeVista,
  agruparPorDia, repartirSolapes, franjaHoraria,
  diasDeMes, esDelMes, sumarMeses, etiquetaMes,
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

describe('diasDeMes', () => {
  it('empieza en lunes y termina en domingo', () => {
    const d = diasDeMes('2026-09-15')
    expect(inicioDeSemana(d[0])).toBe(d[0])
    expect(d.length % 7).toBe(0)
  })

  it('incluye los días del mes vecino que completan la semana', () => {
    // Septiembre de 2026 empieza en martes, así que la primera fila arranca el
    // lunes 31 de agosto. Sin esos días la fila saldría medio vacía y sin sus
    // citas, que sí existen.
    const d = diasDeMes('2026-09-15')
    expect(d[0]).toBe('2026-08-31')
    expect(d).toContain('2026-09-01')
  })

  it('cubre el mes entero', () => {
    const d = diasDeMes('2026-09-15')
    expect(d).toContain('2026-09-01')
    expect(d).toContain('2026-09-30')
  })

  it('no fija seis filas: usa las que hagan falta', () => {
    // Febrero de 2027 tiene 28 días y empieza en lunes: cabe exacto en 4.
    expect(diasDeMes('2027-02-10')).toHaveLength(28)
  })

  it('un mes largo que empieza en domingo necesita seis', () => {
    // Agosto de 2026 empieza en sábado y tiene 31 días.
    expect(diasDeMes('2026-08-10').length).toBe(42)
  })

  it('cruza el fin de año', () => {
    const d = diasDeMes('2026-12-15')
    expect(d).toContain('2026-12-31')
    expect(d[d.length - 1] > '2026-12-31').toBe(true)
  })
})

describe('esDelMes', () => {
  it('distingue los días prestados del mes vecino', () => {
    expect(esDelMes('2026-09-01', '2026-09-15')).toBe(true)
    expect(esDelMes('2026-08-31', '2026-09-15')).toBe(false)
  })
})

describe('sumarMeses', () => {
  it('avanza y retrocede', () => {
    expect(sumarMeses('2026-09-15', 1)).toBe('2026-10-15')
    expect(sumarMeses('2026-09-15', -1)).toBe('2026-08-15')
  })

  it('recorta el día cuando el mes destino es más corto', () => {
    // Sin recortar daría "2026-02-31", que Date lee como 3 de marzo: una sola
    // pulsación saltaría dos meses.
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28')
  })

  it('respeta el año bisiesto al recortar', () => {
    expect(sumarMeses('2028-01-31', 1)).toBe('2028-02-29')
  })

  it('cruza el año en los dos sentidos', () => {
    expect(sumarMeses('2026-12-10', 1)).toBe('2027-01-10')
    expect(sumarMeses('2026-01-10', -1)).toBe('2025-12-10')
  })
})

describe('rangoDeVista — mes', () => {
  it('pide desde el primer día de la rejilla hasta el último', () => {
    // Incluye los prestados: son celdas visibles y tienen que traer sus citas.
    expect(rangoDeVista('mes', '2026-09-15')).toEqual({
      desde: '2026-08-31T00:00:00-05:00',
      hasta: '2026-10-04T23:59:59-05:00',
    })
  })
})

describe('etiquetaMes', () => {
  it('nombra el mes en español, sin abreviar', () => {
    expect(etiquetaMes('2026-09-15')).toBe('septiembre de 2026')
    expect(etiquetaMes('2026-01-01')).toBe('enero de 2026')
    expect(etiquetaMes('2026-12-31')).toBe('diciembre de 2026')
  })
})

describe('repartirSolapes — cada día por su cuenta', () => {
  const enDia = (fecha, inicioMin, finMin, id) => ({ id, fecha, inicioMin, finMin })

  it('la misma hora en días distintos NO es un solape', () => {
    // El fallo que hacía ilegible la semana: se comparaban solo las horas, así
    // que una semana con una cita diaria a las 4 partía cada día en cinco
    // columnas y los bloques salían a un quinto de ancho.
    const r = repartirSolapes([
      enDia('2026-09-07', 960, 1005, 'a'),
      enDia('2026-09-08', 960, 1005, 'b'),
      enDia('2026-09-09', 960, 1005, 'c'),
      enDia('2026-09-10', 960, 1005, 'd'),
      enDia('2026-09-11', 960, 1005, 'e'),
    ])
    expect(r.every((e) => e.columnas === 1)).toBe(true)
  })

  it('dentro de un mismo día sí se reparten', () => {
    const r = repartirSolapes([
      enDia('2026-09-09', 885, 930, 'a'),
      enDia('2026-09-09', 885, 930, 'b'),
      enDia('2026-09-10', 885, 930, 'c'),
    ])
    const porId = Object.fromEntries(r.map((e) => [e.id, e]))
    expect(porId.a.columnas).toBe(2)
    expect(porId.b.columnas).toBe(2)
    expect(porId.c.columnas).toBe(1)
  })

  it('no pierde ni duplica citas al repartir por día', () => {
    const entrada = [
      enDia('2026-09-07', 600, 660, 'a'), enDia('2026-09-07', 610, 700, 'b'),
      enDia('2026-09-08', 600, 660, 'c'),
    ]
    const r = repartirSolapes(entrada)
    expect(r).toHaveLength(3)
    expect(new Set(r.map((e) => e.id)).size).toBe(3)
  })

  it('un mes entero no se reparte como si fuera un solo día', () => {
    // Al bajar de Mes a Día, el store todavía tiene el mes cargado mientras
    // llega la petición del día. Si el reparto ignora la fecha, ese instante se
    // dibuja con las 300 citas del mes apiladas en una jornada.
    const mes = []
    for (let d = 1; d <= 20; d++) {
      const f = `2026-09-${String(d).padStart(2, '0')}`
      mes.push(enDia(f, 960, 1005, `x${d}`))
    }
    expect(repartirSolapes(mes).every((e) => e.columnas === 1)).toBe(true)
  })
})
