import { describe, it, expect, beforeEach, vi } from 'vitest'

// La red se sustituye por un espía: lo que se verifica es qué respuesta acaba
// en el store, no cómo se pide.
vi.mock('../googleCalendar.js', () => ({
  fetchCalendarEvents: vi.fn(async () => []),
}))

const { fetchCalendarEvents } = await import('../googleCalendar.js')
const { useCalendarStore } = await import('./calendarStore.js')

const inicial = useCalendarStore.getState()
beforeEach(() => {
  useCalendarStore.setState({ ...inicial, events: [], error: null, loading: false }, true)
  vi.clearAllMocks()
})

const tarda = (ms, valor) => new Promise((r) => setTimeout(() => r(valor), ms))

describe('rango según la vista', () => {
  it('el día pide un día', async () => {
    await useCalendarStore.getState().cargar({ date: '2026-09-09', vista: 'dia' })
    expect(fetchCalendarEvents).toHaveBeenCalledWith({
      desde: '2026-09-09T00:00:00-05:00',
      hasta: '2026-09-09T23:59:59-05:00',
    })
  })

  it('el mes pide la rejilla entera, con los días prestados', async () => {
    await useCalendarStore.getState().cargar({ date: '2026-09-09', vista: 'mes' })
    expect(fetchCalendarEvents).toHaveBeenCalledWith({
      desde: '2026-08-31T00:00:00-05:00',
      hasta: '2026-10-04T23:59:59-05:00',
    })
  })

  it('verDia cambia fecha y vista con UNA sola petición', async () => {
    // Hacerlo en dos pasos lanzaba dos rangos distintos.
    await useCalendarStore.getState().verDia('2026-09-14')
    expect(fetchCalendarEvents).toHaveBeenCalledTimes(1)
    expect(useCalendarStore.getState()).toMatchObject({ date: '2026-09-14', vista: 'dia' })
  })
})

describe('respuestas que llegan tarde', () => {
  it('la petición vieja no pisa a la nueva', async () => {
    // El caso real: bajar de Mes a Día. El mes tarda más — son 317 eventos
    // contra 18 — así que su respuesta llegaba después y dejaba el mes entero
    // cargado en la vista de día.
    fetchCalendarEvents
      .mockImplementationOnce(() => tarda(30, [{ id: 'del-mes' }]))
      .mockImplementationOnce(() => tarda(5, [{ id: 'del-dia' }]))

    const mes = useCalendarStore.getState().cargar({ date: '2026-09-09', vista: 'mes' })
    const dia = useCalendarStore.getState().verDia('2026-09-09')
    await Promise.all([mes, dia])

    expect(useCalendarStore.getState().events).toEqual([{ id: 'del-dia' }])
  })

  it('un error viejo tampoco pisa a la respuesta buena', async () => {
    fetchCalendarEvents
      .mockImplementationOnce(async () => { await tarda(30); throw new Error('sin red') })
      .mockImplementationOnce(() => tarda(5, [{ id: 'bueno' }]))

    const vieja = useCalendarStore.getState().cargar({ date: '2026-09-01' })
    const nueva = useCalendarStore.getState().cargar({ date: '2026-09-02' })
    await Promise.all([vieja, nueva])

    expect(useCalendarStore.getState().error).toBeNull()
    expect(useCalendarStore.getState().events).toEqual([{ id: 'bueno' }])
  })

  it('el indicador de carga lo apaga la última, no la primera en volver', async () => {
    fetchCalendarEvents
      .mockImplementationOnce(() => tarda(30, []))
      .mockImplementationOnce(() => tarda(5, []))

    const vieja = useCalendarStore.getState().cargar({ date: '2026-09-01' })
    const nueva = useCalendarStore.getState().cargar({ date: '2026-09-02' })
    await nueva
    expect(useCalendarStore.getState().loading).toBe(false)
    await vieja
    // La vieja no vuelve a encenderlo ni lo deja colgado.
    expect(useCalendarStore.getState().loading).toBe(false)
  })
})

describe('errores', () => {
  it('el motivo llega tal cual: dice a quién hay que ir a buscar', async () => {
    fetchCalendarEvents.mockRejectedValueOnce(
      new Error('El calendario airalearninghub@gmail.com no está compartido con la cuenta de servicio')
    )
    await useCalendarStore.getState().cargar({ date: '2026-09-09' })
    expect(useCalendarStore.getState().error).toContain('no está compartido')
    expect(useCalendarStore.getState().events).toEqual([])
  })
})
