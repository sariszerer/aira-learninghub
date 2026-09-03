import { describe, it, expect } from 'vitest'
import { PERMISSIONS, can, visibleChildren, canSeeChild } from './permissions.js'

const usuario = (perms, extra = {}) => ({
  id: 'u-1', permissions: new Set(perms), scope: 'asignados', assignedChildId: null, ...extra,
})

describe('PERMISSIONS', () => {
  it('tiene 34 claves únicas', () => {
    const keys = PERMISSIONS.map(p => p.key)
    expect(keys).toHaveLength(34)
    expect(new Set(keys).size).toBe(34)
  })

  it('cada permiso declara grupo y descripción no vacíos', () => {
    for (const p of PERMISSIONS) {
      expect(p.grupo, p.key).toBeTruthy()
      expect(p.descripcion, p.key).toBeTruthy()
    }
  })

  it('no expone objective:delete — borrar usa objective:edit', () => {
    expect(PERMISSIONS.map(p => p.key)).not.toContain('objective:delete')
  })
})

describe('can — falla cerrado', () => {
  it('devuelve false sin usuario', () => {
    expect(can(null, 'gabinete:view')).toBe(false)
  })

  it('devuelve false si los permisos aún no cargaron', () => {
    expect(can({ id: 'u-1' }, 'gabinete:view')).toBe(false)
  })

  it('devuelve false para un permiso que el usuario no tiene', () => {
    expect(can(usuario([]), 'gabinete:view')).toBe(false)
  })
})

describe('can — permisos simples', () => {
  it('concede cuando el permiso está presente', () => {
    expect(can(usuario(['gabinete:view']), 'gabinete:view')).toBe(true)
  })
})

describe('can — pares own/any', () => {
  const sesionPropia = { id: 's-1', specialistId: 'u-1' }
  const sesionAjena = { id: 's-2', specialistId: 'u-9' }

  it('any concede sobre recurso ajeno', () => {
    expect(can(usuario(['session:edit:any']), 'session:edit', sesionAjena)).toBe(true)
  })

  it('own concede sobre recurso propio', () => {
    expect(can(usuario(['session:edit:own']), 'session:edit', sesionPropia)).toBe(true)
  })

  it('own NO concede sobre recurso ajeno', () => {
    expect(can(usuario(['session:edit:own']), 'session:edit', sesionAjena)).toBe(false)
  })

  it('own sin recurso no concede', () => {
    expect(can(usuario(['session:edit:own']), 'session:edit')).toBe(false)
  })

  it('documentos usan authorId como campo dueño', () => {
    expect(can(usuario(['document:edit:own']), 'document:edit', { authorId: 'u-1' })).toBe(true)
    expect(can(usuario(['document:edit:own']), 'document:edit', { authorId: 'u-9' })).toBe(false)
  })

  it('objetivos usan specialistId como campo dueño', () => {
    expect(can(usuario(['objective:edit:own']), 'objective:edit', { specialistId: 'u-1' })).toBe(true)
  })

  it('un recurso sin campo dueño conocido no concede por own', () => {
    expect(can(usuario(['meeting:edit:own']), 'meeting:edit', { id: 'm-1' })).toBe(false)
  })
})

describe('visibleChildren', () => {
  const ninos = [
    { id: 'c-1', assignedSpecialists: ['u-1'] },
    { id: 'c-2', assignedSpecialists: ['u-9'] },
    { id: 'c-3', assignedSpecialists: [] },
  ]

  it('scope todos devuelve la lista completa', () => {
    const u = { id: 'u-1', permissions: new Set(), scope: 'todos' }
    expect(visibleChildren(u, ninos)).toHaveLength(3)
  })

  it('scope asignados filtra por assignedSpecialists', () => {
    const u = { id: 'u-1', permissions: new Set(), scope: 'asignados' }
    expect(visibleChildren(u, ninos).map(c => c.id)).toEqual(['c-1'])
  })

  it('scope un_nino devuelve solo el niño asignado', () => {
    const u = { id: 'u-1', permissions: new Set(), scope: 'un_nino', assignedChildId: 'c-2' }
    expect(visibleChildren(u, ninos).map(c => c.id)).toEqual(['c-2'])
  })

  it('scope un_nino con assignedChildId nulo no devuelve nada, ni contra un child con id undefined', () => {
    const u = { id: 'u-1', permissions: new Set(), scope: 'un_nino', assignedChildId: null }
    const ninosConIdIndefinido = [...ninos, { id: undefined, assignedSpecialists: [] }]
    expect(visibleChildren(u, ninosConIdIndefinido)).toEqual([])
  })

  it('scope un_nino con assignedChildId ausente no devuelve nada, ni contra un child con id undefined', () => {
    const u = { id: 'u-1', permissions: new Set(), scope: 'un_nino' }
    const ninosConIdIndefinido = [...ninos, { id: undefined, assignedSpecialists: [] }]
    expect(visibleChildren(u, ninosConIdIndefinido)).toEqual([])
  })

  it('scope desconocido no devuelve nada', () => {
    const u = { id: 'u-1', permissions: new Set(), scope: 'inventado' }
    expect(visibleChildren(u, ninos)).toEqual([])
  })

  it('sin usuario no devuelve nada', () => {
    expect(visibleChildren(null, ninos)).toEqual([])
  })
})

describe('canSeeChild', () => {
  it('es consistente con visibleChildren', () => {
    const u = { id: 'u-1', permissions: new Set(), scope: 'asignados' }
    expect(canSeeChild(u, { id: 'c-1', assignedSpecialists: ['u-1'] })).toBe(true)
    expect(canSeeChild(u, { id: 'c-2', assignedSpecialists: ['u-9'] })).toBe(false)
  })

  it('sin niño devuelve false', () => {
    const u = { id: 'u-1', permissions: new Set(), scope: 'todos' }
    expect(canSeeChild(u, null)).toBe(false)
  })
})
