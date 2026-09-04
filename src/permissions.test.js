import { describe, it, expect } from 'vitest'
import { PERMISSIONS, can, visibleChildren, canSeeChild, ROLES, buildUser } from './permissions.js'

const usuario = (perms, extra = {}) => ({
  id: 'u-1', permissions: new Set(perms), scope: 'asignados', assignedChildId: null, ...extra,
})

describe('PERMISSIONS', () => {
  it('tiene 35 claves únicas', () => {
    const keys = PERMISSIONS.map(p => p.key)
    expect(keys).toHaveLength(35)
    expect(new Set(keys).size).toBe(35)
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

describe('ROLES — matriz semilla', () => {
  it('define exactamente los 4 roles actuales', () => {
    expect(Object.keys(ROLES).sort()).toEqual(
      ['admin', 'clinical_director', 'shadow', 'specialist']
    )
  })

  it('todo permiso listado existe en el catálogo, sin duplicados y sin roles vacíos', () => {
    const validas = new Set(PERMISSIONS.map(p => p.key))
    for (const [id, r] of Object.entries(ROLES)) {
      expect(r.permisos.length, `${id} no debe tener permisos vacíos`).toBeGreaterThan(0)
      expect(new Set(r.permisos).size, `${id} no debe declarar duplicados`).toBe(r.permisos.length)
      for (const key of r.permisos) {
        expect(validas.has(key), `${id} declara ${key}`).toBe(true)
      }
    }
  })

  it('cada rol declara sus cuatro atributos', () => {
    for (const [id, r] of Object.entries(ROLES)) {
      expect(['todos', 'asignados', 'un_nino'], id).toContain(r.scope)
      expect(['admin', 'clinico', 'especialista', 'tutor'], id).toContain(r.home)
      expect(typeof r.esClinico, id).toBe('boolean')
      expect(r.etiqueta, id).toBeTruthy()
    }
  })

  // Contratos que preservan el comportamiento actual, derivados de los checks de App.jsx
  it('admin NO registra sesiones (App.jsx:3850 lo excluye)', () => {
    expect(ROLES.admin.permisos).not.toContain('session:create')
  })

  it('solo admin da de alta pacientes (onAddChild solo en AdminDashboard)', () => {
    expect(ROLES.admin.permisos).toContain('patient:create')
    expect(ROLES.clinical_director.permisos).not.toContain('patient:create')
    expect(ROLES.specialist.permisos).not.toContain('patient:create')
  })

  it('solo admin administra usuarios y roles', () => {
    for (const id of ['clinical_director', 'specialist', 'shadow']) {
      expect(ROLES[id].permisos, id).not.toContain('role:manage')
      expect(ROLES[id].permisos, id).not.toContain('user:manage')
    }
  })

  it('admin y dirección clínica editan cualquier sesión; especialista solo las propias', () => {
    expect(ROLES.admin.permisos).toContain('session:edit:any')
    expect(ROLES.clinical_director.permisos).toContain('session:edit:any')
    expect(ROLES.specialist.permisos).toContain('session:edit:own')
    expect(ROLES.specialist.permisos).not.toContain('session:edit:any')
  })

  it('gabinete solo para admin y dirección clínica (App.jsx:5012)', () => {
    expect(ROLES.specialist.permisos).not.toContain('gabinete:view')
    expect(ROLES.shadow.permisos).not.toContain('gabinete:view')
  })

  it('guidelines:view reemplaza el id u-admin incrustado', () => {
    expect(ROLES.admin.permisos).toContain('guidelines:view')
    expect(ROLES.clinical_director.permisos).toContain('guidelines:view')
    expect(ROLES.specialist.permisos).not.toContain('guidelines:view')
  })

  // Cambio de comportamiento aprobado: se cierra el hueco del tutor sombra.
  // Las 8 capacidades de escritura que shadow tenía solo por ausencia de
  // check en App.jsx (no por diseño): cerrar procesos, renovar paquetes,
  // generar reportes, subir/editar documentos, crear plan de trabajo y
  // registrar reuniones.
  it('shadow NO cierra procesos, ni renueva paquetes, ni genera reportes, ni sube documentos, ni crea planes o reuniones', () => {
    for (const key of [
      'patient:close', 'patient:renew_package',
      'report:evolution:generate', 'report:history:generate', 'report:parent:generate',
      'document:create', 'document:edit:own',
      'workplan:create', 'meeting:create',
    ]) {
      expect(ROLES.shadow.permisos, key).not.toContain(key)
    }
  })

  it('shadow conserva lectura y sus reportes de tutor', () => {
    expect(ROLES.shadow.permisos).toContain('tutorreport:view')
    expect(ROLES.shadow.permisos).toContain('tutorreport:create')
    expect(ROLES.shadow.permisos).toContain('patient:view')
    expect(ROLES.shadow.scope).toBe('un_nino')
  })

  it('solo especialista y dirección clínica son clínicos (aparecen en selectores de terapeuta)', () => {
    expect(ROLES.specialist.esClinico).toBe(true)
    expect(ROLES.clinical_director.esClinico).toBe(true)
    expect(ROLES.admin.esClinico).toBe(false)
    expect(ROLES.shadow.esClinico).toBe(false)
  })

  it('tutorreport:create solo lo tiene shadow — único punto de creación es TutorAiraHome', () => {
    for (const id of ['admin', 'clinical_director', 'specialist']) {
      expect(ROLES[id].permisos, id).not.toContain('tutorreport:create')
    }
    expect(ROLES.shadow.permisos).toContain('tutorreport:create')
  })

  it('tutorreport:view solo lo tienen dirección clínica y shadow', () => {
    for (const id of ['admin', 'specialist']) {
      expect(ROLES[id].permisos, id).not.toContain('tutorreport:view')
    }
    expect(ROLES.clinical_director.permisos).toContain('tutorreport:view')
    expect(ROLES.shadow.permisos).toContain('tutorreport:view')
  })

  // Contrato completo: fija el conjunto exacto de permisos por rol para que
  // agregar o quitar una sola clave rompa la prueba, no solo los checks puntuales.
  it('admin tiene exactamente este conjunto de permisos', () => {
    expect([...ROLES.admin.permisos].sort()).toEqual([
      'anamnesis:edit', 'anamnesis:view',
      'document:create', 'document:edit:any', 'document:view',
      'gabinete:session:create', 'gabinete:view',
      'guidelines:view',
      'meeting:create', 'meeting:view',
      'objective:create', 'objective:edit:any', 'objective:view',
      'patient:close', 'patient:create', 'patient:edit', 'patient:renew_package', 'patient:view',
      'report:evolution:generate', 'report:history:generate', 'report:parent:generate', 'report:view',
      'role:manage',
      'school:create',
      'session:edit:any', 'session:view',
      'user:manage',
      'workplan:create', 'workplan:view',
    ].sort())
  })

  it('clinical_director tiene exactamente este conjunto de permisos', () => {
    expect([...ROLES.clinical_director.permisos].sort()).toEqual([
      'anamnesis:edit', 'anamnesis:view',
      'document:create', 'document:edit:any', 'document:view',
      'gabinete:session:create', 'gabinete:view',
      'guidelines:view',
      'meeting:create', 'meeting:view',
      'objective:create', 'objective:edit:any', 'objective:view',
      'patient:close', 'patient:edit', 'patient:renew_package', 'patient:view',
      'report:evolution:generate', 'report:history:generate', 'report:parent:generate', 'report:view',
      'school:create',
      'session:create', 'session:edit:any', 'session:view',
      'tutorreport:view',
      'workplan:create', 'workplan:view',
    ].sort())
  })

  it('specialist tiene exactamente este conjunto de permisos', () => {
    expect([...ROLES.specialist.permisos].sort()).toEqual([
      'anamnesis:edit', 'anamnesis:view',
      'document:create', 'document:edit:own', 'document:view',
      'meeting:create', 'meeting:view',
      'objective:create', 'objective:edit:own', 'objective:view',
      'patient:close', 'patient:renew_package', 'patient:view',
      'report:evolution:generate', 'report:parent:generate', 'report:view',
      'session:create', 'session:edit:own', 'session:view',
      'workplan:create', 'workplan:view',
    ].sort())
  })

  it('shadow tiene exactamente este conjunto de permisos', () => {
    expect([...ROLES.shadow.permisos].sort()).toEqual([
      'anamnesis:view',
      'document:view',
      'meeting:view',
      'objective:view',
      'patient:view',
      'report:view',
      'session:view',
      'tutorreport:create', 'tutorreport:view',
      'workplan:view',
    ].sort())
  })
})

describe('buildUser', () => {
  it('adjunta permisos como Set y los atributos del rol', () => {
    const u = buildUser({ id: 'u-1', name: 'Ana', role: 'specialist', assignedChildId: null })
    expect(u.permissions).toBeInstanceOf(Set)
    expect(u.permissions.has('session:edit:own')).toBe(true)
    expect(u.scope).toBe('asignados')
    expect(u.home).toBe('especialista')
    expect(u.name).toBe('Ana')
  })

  it('un rol desconocido produce un usuario sin permisos ni alcance', () => {
    const u = buildUser({ id: 'u-9', role: 'inventado' })
    expect(u.permissions.size).toBe(0)
    expect(u.scope).toBeNull()
    expect(visibleChildren(u, [{ id: 'c-1', assignedSpecialists: ['u-9'] }])).toEqual([])
  })

  it('buildUser(null) no truena y falla cerrado', () => {
    const u = buildUser(null)
    expect(u.permissions.size).toBe(0)
    expect(u.scope).toBeNull()
    expect(u.home).toBeNull()
    expect(u.etiqueta).toBeNull()
    expect(u.color).toBeNull()
  })
})

describe('buildUser con rol desde la base', () => {
  const filaRol = {
    id: 'suplente', nombre: 'Terapeuta suplente', scope: 'asignados',
    home: 'especialista', es_clinico: true, etiqueta: 'Suplente', color: '#06B6D4',
    role_permissions: [
      { permission_key: 'patient:view' },
      { permission_key: 'session:create' },
      { permission_key: 'session:edit:own' },
    ],
  }

  it('la fila de la base manda sobre la matriz del codigo', () => {
    // `role` dice specialist, que en codigo trae 21 permisos; la fila trae 3.
    const u = buildUser({ id: 'u-1', role: 'specialist' }, filaRol)
    expect(u.permissions.size).toBe(3)
    expect(u.etiqueta).toBe('Suplente')
    expect(u.esClinico).toBe(true)
  })

  it('permite roles que no existen en el codigo', () => {
    const u = buildUser({ id: 'u-1', role: 'suplente' }, filaRol)
    expect(can(u, 'session:edit', { specialistId: 'u-1' })).toBe(true)
    expect(can(u, 'session:edit', { specialistId: 'u-9' })).toBe(false)
    expect(can(u, 'gabinete:view')).toBe(false)
  })

  it('sin fila cae a la matriz del codigo, para usuarios aun sin role_id', () => {
    const u = buildUser({ id: 'u-1', role: 'specialist' }, null)
    expect(u.permissions.size).toBe(ROLES.specialist.permisos.length)
  })

  it('un rol sin permisos en la base deja al usuario sin ninguno', () => {
    const u = buildUser({ id: 'u-1', role: 'x' }, { ...filaRol, role_permissions: [] })
    expect(u.permissions.size).toBe(0)
    expect(can(u, 'patient:view')).toBe(false)
  })
})
