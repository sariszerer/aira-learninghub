import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAvisosStore, avisar } from './avisosStore.js'

const inicial = useAvisosStore.getState()
beforeEach(() => {
  useAvisosStore.setState({ ...inicial, avisos: [] }, true)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('avisos', () => {
  it('publica un error con su causa', () => {
    avisar.error('Guardar colegio', new Error('invalid input syntax for type date: ""'))
    const [a] = useAvisosStore.getState().avisos
    expect(a.tono).toBe('error')
    expect(a.que).toBe('Guardar colegio')
    expect(a.detalle).toContain('invalid input syntax')
  })

  it('acepta un texto sin excepción, que es lo que da una validación', () => {
    avisar.error('Falta el nombre del colegio')
    const [a] = useAvisosStore.getState().avisos
    expect(a.detalle).toBeNull()
    expect(a.que).toBe('Falta el nombre del colegio')
  })

  it('reintentar lo mismo refresca el aviso, no lo duplica', () => {
    // Sin esto, pulsar tres veces Guardar deja tres avisos idénticos apilados y
    // el usuario cree que fallaron tres cosas distintas.
    avisar.error('Guardar colegio', 'sin red')
    avisar.error('Guardar colegio', 'sin red')
    expect(useAvisosStore.getState().avisos).toHaveLength(1)
  })

  it('dos errores distintos sí se apilan', () => {
    avisar.error('Guardar colegio', 'sin red')
    avisar.error('Guardar estudiante', 'sin permiso')
    expect(useAvisosStore.getState().avisos).toHaveLength(2)
  })

  it('se descarta uno sin tocar los demás', () => {
    const id = avisar.error('A')
    avisar.error('B')
    useAvisosStore.getState().descartar(id)
    expect(useAvisosStore.getState().avisos.map((a) => a.que)).toEqual(['B'])
  })

  it('el éxito se marca como tal', () => {
    avisar.exito('Escuela guardada')
    expect(useAvisosStore.getState().avisos[0].tono).toBe('exito')
  })
})
