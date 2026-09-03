# Roles y permisos — Fase 1: capa cliente

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralizar las 52 comprobaciones de autorización dispersas en `App.jsx` en un módulo único `src/permissions.js`, sin tocar la base de datos.

**Architecture:** Un catálogo cerrado de 34 permisos y una matriz de los 4 roles actuales viven en código. `can(user, action, resource)` resuelve permisos simples y pares `:own`/`:any`. `visibleChildren()` resuelve el alcance. Los llamadores dejan de nombrar roles literalmente, lo que habilita las fases siguientes.

**Tech Stack:** React 18, Vite 5, Vitest (se agrega en la Tarea 1), Supabase JS.

**Spec:** `docs/superpowers/specs/2026-09-03-roles-y-permisos-design.md`

## Global Constraints

- **No se toca la base de datos en esta fase.** Ni esquema, ni políticas, ni datos. La matriz de roles vive en código y se migra a tablas en la Fase 2.
- **Comportamiento idéntico al actual, con una excepción aprobada:** el rol `shadow` pierde `patient:close`, `patient:renew_package`, `report:generate` y `report:parent:generate`. Hoy los tiene por ausencia de check, no por diseño.
- **`can()` falla cerrado.** Sin `user.permissions` cargado devuelve `false`.
- Nombres de permisos en inglés (`session:edit:own`), texto de interfaz en español.
- El módulo nuevo sigue el estilo del repo: sin TypeScript, ES modules, comillas dobles en JSX y simples en JS plano.
- No se introduce lenguaje visual nuevo: se reutilizan `T`, `Btn`, `Card`, `Chip`, `Modal`.

- **Los números de línea son pistas, no direcciones.** Cada edición en `App.jsx` desplaza
  las siguientes. Localizar siempre por el fragmento citado en "Antes:", nunca por el número.

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/permissions.js` (nuevo) | Catálogo, matriz de roles semilla, `can()`, `visibleChildren()`, `canSeeChild()` |
| `src/permissions.test.js` (nuevo) | Pruebas unitarias del módulo |
| `src/supabase.js` (modificar) | `getAppUser` adjunta `permissions`, `scope`, `home`, `esClinico`, `etiqueta` |
| `src/App.jsx` (modificar) | Reemplazar los 52 checks por llamadas a `can()` / `visibleChildren()` |
| `package.json` (modificar) | Dependencia y scripts de Vitest |

`permissions.js` es archivo aparte y no código dentro de `App.jsx` por dos razones: `App.jsx` ya tiene 5000 líneas, y el módulo debe ser importable desde pruebas sin arrastrar React.

---

### Task 1: Infraestructura de pruebas

El repo no tiene runner de pruebas. `can()` es una función pura que decide accesos a expedientes clínicos: es exactamente el código que merece pruebas.

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: nada
- Produces: comando `npm test` que ejecuta Vitest una vez y sale

- [ ] **Step 1: Instalar Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Agregar los scripts**

En `package.json`, dentro de `"scripts"`, junto a `dev`/`build`/`preview`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Verificar que el runner arranca**

Run: `npm test`
Expected: sale sin error indicando que no encontró archivos de prueba ("No test files found"). Si falla con otro mensaje, el runner no quedó bien instalado.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: agregar vitest como runner de pruebas"
```

---

### Task 2: Catálogo de permisos y `can()`

**Files:**
- Create: `src/permissions.js`
- Create: `src/permissions.test.js`

**Interfaces:**
- Consumes: nada
- Produces:
  - `PERMISSIONS`: array de `{ key: string, grupo: string, descripcion: string }`, 34 entradas
  - `can(user, action, resource?) => boolean`
  - `user` tiene la forma `{ id: string, permissions: Set<string>, scope: string, assignedChildId: string|null }`

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `src/permissions.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { PERMISSIONS, can } from './permissions.js'

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
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `npm test`
Expected: FAIL — no existe `./permissions.js`.

- [ ] **Step 3: Implementar el módulo**

Crear `src/permissions.js`:

```js
// Catálogo cerrado de permisos. El código solo puede verificar capacidades que
// conoce por nombre, así que esta lista vive aquí y no en la base: la Fase 2 la
// siembra en la tabla `permissions`, pero esta sigue siendo la fuente.
export const PERMISSIONS = [
  { key: 'patient:view',            grupo: 'Pacientes',          descripcion: 'Ver fichas de pacientes' },
  { key: 'patient:create',          grupo: 'Pacientes',          descripcion: 'Dar de alta pacientes' },
  { key: 'patient:edit',            grupo: 'Pacientes',          descripcion: 'Editar datos del paciente' },
  { key: 'patient:close',           grupo: 'Pacientes',          descripcion: 'Cerrar proceso clínico' },
  { key: 'patient:renew_package',   grupo: 'Pacientes',          descripcion: 'Renovar paquete de sesiones' },

  { key: 'session:view',            grupo: 'Sesiones',           descripcion: 'Ver sesiones' },
  { key: 'session:create',          grupo: 'Sesiones',           descripcion: 'Registrar sesiones' },
  { key: 'session:edit:own',        grupo: 'Sesiones',           descripcion: 'Editar sus propias sesiones' },
  { key: 'session:edit:any',        grupo: 'Sesiones',           descripcion: 'Editar sesiones de cualquiera' },

  { key: 'objective:view',          grupo: 'Objetivos',          descripcion: 'Ver objetivos' },
  { key: 'objective:create',        grupo: 'Objetivos',          descripcion: 'Crear objetivos' },
  { key: 'objective:edit:own',      grupo: 'Objetivos',          descripcion: 'Editar y borrar sus objetivos' },
  { key: 'objective:edit:any',      grupo: 'Objetivos',          descripcion: 'Editar y borrar objetivos de cualquiera' },

  { key: 'document:view',           grupo: 'Documentos',         descripcion: 'Ver documentos' },
  { key: 'document:create',         grupo: 'Documentos',         descripcion: 'Subir documentos' },
  { key: 'document:edit:own',       grupo: 'Documentos',         descripcion: 'Editar sus propios documentos' },
  { key: 'document:edit:any',       grupo: 'Documentos',         descripcion: 'Editar documentos de cualquiera' },

  { key: 'anamnesis:view',          grupo: 'Clínico',            descripcion: 'Ver anamnesis' },
  { key: 'anamnesis:edit',          grupo: 'Clínico',            descripcion: 'Editar anamnesis' },
  { key: 'workplan:view',           grupo: 'Clínico',            descripcion: 'Ver plan de trabajo' },
  { key: 'workplan:create',         grupo: 'Clínico',            descripcion: 'Crear plan de trabajo' },

  { key: 'report:view',             grupo: 'Reportes',           descripcion: 'Ver reportes' },
  { key: 'report:generate',         grupo: 'Reportes',           descripcion: 'Generar historial y evolución' },
  { key: 'report:parent:generate',  grupo: 'Reportes',           descripcion: 'Generar reporte para padres' },

  { key: 'meeting:view',            grupo: 'Interdisciplinario', descripcion: 'Ver reuniones' },
  { key: 'meeting:create',          grupo: 'Interdisciplinario', descripcion: 'Registrar reuniones' },
  { key: 'guidelines:view',         grupo: 'Interdisciplinario', descripcion: 'Ver pautas interdisciplinarias' },

  { key: 'gabinete:view',           grupo: 'Gabinete',           descripcion: 'Acceder al panel de gabinete' },
  { key: 'gabinete:session:create', grupo: 'Gabinete',           descripcion: 'Registrar sesiones de gabinete' },
  { key: 'school:create',           grupo: 'Gabinete',           descripcion: 'Dar de alta colegios' },

  { key: 'tutorreport:view',        grupo: 'Tutores',            descripcion: 'Ver reportes de tutor' },
  { key: 'tutorreport:create',      grupo: 'Tutores',            descripcion: 'Crear reportes de tutor' },

  { key: 'user:manage',             grupo: 'Administración',     descripcion: 'Gestionar usuarios' },
  { key: 'role:manage',             grupo: 'Administración',     descripcion: 'Crear y modificar roles' },
]

// Qué campo identifica al dueño, por tipo de recurso. El tipo se deduce del
// prefijo del permiso: 'session:edit' -> 'session'.
const OWNER_FIELD = {
  session: 'specialistId',
  document: 'authorId',
  objective: 'specialistId',
}

function isOwner(user, action, resource) {
  if (!resource) return false
  const field = OWNER_FIELD[action.split(':')[0]]
  return field ? resource[field] === user.id : false
}

// Punto de entrada único de autorización en el cliente.
// Resuelve tanto permisos simples ('gabinete:view') como pares own/any
// ('session:edit' -> session:edit:any | session:edit:own + propiedad).
export function can(user, action, resource) {
  if (!user?.permissions) return false
  const p = user.permissions
  if (p.has(action)) return true
  if (p.has(`${action}:any`)) return true
  if (p.has(`${action}:own`) && isOwner(user, action, resource)) return true
  return false
}
```

- [ ] **Step 4: Correr las pruebas para verificar que pasan**

Run: `npm test`
Expected: PASS, 14 pruebas.

- [ ] **Step 5: Commit**

```bash
git add src/permissions.js src/permissions.test.js
git commit -m "feat: catálogo de permisos y can() con soporte own/any"
```

---

### Task 3: Alcance de pacientes

**Files:**
- Modify: `src/permissions.js`
- Modify: `src/permissions.test.js`

**Interfaces:**
- Consumes: forma de `user` de la Tarea 2
- Produces:
  - `visibleChildren(user, children) => Array`
  - `canSeeChild(user, child) => boolean`
  - `children` son objetos con `{ id, assignedSpecialists: string[] }`

- [ ] **Step 1: Escribir las pruebas que fallan**

Agregar a `src/permissions.test.js`. Los imports van **al inicio del archivo**, junto a los existentes, no al pie del bloque nuevo:

```js
// (subir esta línea al bloque de imports del inicio)
import { visibleChildren, canSeeChild } from './permissions.js'

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
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `npm test`
Expected: FAIL — `visibleChildren` no está exportada.

- [ ] **Step 3: Implementar**

Agregar a `src/permissions.js`:

```js
// El alcance es independiente de los permisos: responde "qué pacientes", no
// "qué acciones". Un scope desconocido no ve nada — falla cerrado, igual que can().
export function visibleChildren(user, children) {
  if (!user || !Array.isArray(children)) return []
  switch (user.scope) {
    case 'todos':     return children
    case 'asignados': return children.filter(c => c.assignedSpecialists?.includes(user.id))
    case 'un_nino':   return children.filter(c => c.id === user.assignedChildId)
    default:          return []
  }
}

export function canSeeChild(user, child) {
  if (!child) return false
  return visibleChildren(user, [child]).length === 1
}
```

- [ ] **Step 4: Correr las pruebas para verificar que pasan**

Run: `npm test`
Expected: PASS, 21 pruebas.

- [ ] **Step 5: Commit**

```bash
git add src/permissions.js src/permissions.test.js
git commit -m "feat: resolución de alcance de pacientes por rol"
```

---

### Task 4: Matriz de los 4 roles semilla

Es la tarea de mayor riesgo del plan: si la matriz se equivoca, alguien pierde acceso o gana uno que no debía. Las pruebas fijan la matriz como contrato.

**Files:**
- Modify: `src/permissions.js`
- Modify: `src/permissions.test.js`

**Interfaces:**
- Consumes: `PERMISSIONS` de la Tarea 2
- Produces:
  - `ROLES`: objeto indexado por id de rol → `{ nombre, scope, home, esClinico, etiqueta, color, permisos: string[] }`
  - `buildUser(dbUser) => user` que adjunta `permissions: Set` y los atributos del rol

- [ ] **Step 1: Escribir las pruebas que fallan**

Agregar a `src/permissions.test.js`. Consolidar en el bloque de imports del inicio, no al pie:

```js
// (subir esta línea al bloque de imports del inicio)
import { ROLES, buildUser, PERMISSIONS as CAT } from './permissions.js'

describe('ROLES — matriz semilla', () => {
  it('define exactamente los 4 roles actuales', () => {
    expect(Object.keys(ROLES).sort()).toEqual(
      ['admin', 'clinical_director', 'shadow', 'specialist']
    )
  })

  it('todo permiso listado existe en el catálogo', () => {
    const validas = new Set(CAT.map(p => p.key))
    for (const [id, r] of Object.entries(ROLES)) {
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

  // Cambio de comportamiento aprobado: se cierra el hueco del tutor sombra
  it('shadow NO cierra procesos, ni renueva paquetes, ni genera reportes', () => {
    for (const key of ['patient:close', 'patient:renew_package', 'report:generate', 'report:parent:generate']) {
      expect(ROLES.shadow.permisos, key).not.toContain(key)
    }
  })

  it('shadow conserva lectura y sus reportes de tutor', () => {
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
    expect(visibleChildren(u, [{ id: 'c-1', assignedSpecialists: ['u-9'] }])).toEqual([])
  })
})
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `npm test`
Expected: FAIL — `ROLES` no está exportada.

- [ ] **Step 3: Implementar la matriz**

Agregar a `src/permissions.js`:

```js
const TODAS_LAS_LECTURAS = [
  'patient:view', 'session:view', 'objective:view', 'document:view',
  'anamnesis:view', 'workplan:view', 'report:view', 'meeting:view', 'tutorreport:view',
]

// Los 4 roles actuales, derivados uno a uno de los checks de App.jsx.
// La Fase 2 los siembra como filas con es_sistema = true; hasta entonces esta
// es la única fuente. Cambiar algo aquí cambia permisos en producción.
export const ROLES = {
  admin: {
    nombre: 'Administración', etiqueta: 'Admin', color: 'amberDeep',
    scope: 'todos', home: 'admin', esClinico: false,
    permisos: [
      ...TODAS_LAS_LECTURAS,
      'patient:create', 'patient:edit', 'patient:close', 'patient:renew_package',
      // sin session:create — App.jsx:3850 excluye a admin del botón "Registrar sesión"
      'session:edit:any',
      'objective:create', 'objective:edit:any',
      'document:create', 'document:edit:any',
      'anamnesis:edit', 'workplan:create',
      'report:generate', 'report:parent:generate',
      'meeting:create', 'guidelines:view',
      'gabinete:view', 'gabinete:session:create', 'school:create',
      'tutorreport:create',
      'user:manage', 'role:manage',
    ],
  },

  clinical_director: {
    nombre: 'Dirección clínica', etiqueta: 'Dir. Clínica', color: 'brandBright',
    scope: 'todos', home: 'clinico', esClinico: true,
    permisos: [
      ...TODAS_LAS_LECTURAS,
      'patient:edit', 'patient:close', 'patient:renew_package',
      'session:create', 'session:edit:any',
      'objective:create', 'objective:edit:any',
      'document:create', 'document:edit:any',
      'anamnesis:edit', 'workplan:create',
      'report:generate', 'report:parent:generate',
      'meeting:create', 'guidelines:view',
      'gabinete:view', 'gabinete:session:create', 'school:create',
      'tutorreport:create',
    ],
  },

  specialist: {
    nombre: 'Especialista', etiqueta: 'Especialista', color: 'inkFaint',
    scope: 'asignados', home: 'especialista', esClinico: true,
    permisos: [
      ...TODAS_LAS_LECTURAS,
      'patient:close', 'patient:renew_package',
      'session:create', 'session:edit:own',
      'objective:create', 'objective:edit:own',
      'document:create', 'document:edit:own',
      'anamnesis:edit', 'workplan:create',
      'report:generate', 'report:parent:generate',
      'meeting:create',
    ],
  },

  shadow: {
    nombre: 'Tutor AIRA', etiqueta: 'Tutor AIRA', color: 'inkFaint',
    scope: 'un_nino', home: 'tutor', esClinico: false,
    // Cambio de comportamiento aprobado: hoy podría cerrar procesos y generar
    // reportes por ausencia de check, no por diseño. Se cierra el hueco.
    permisos: [
      ...TODAS_LAS_LECTURAS,
      'tutorreport:create',
    ],
  },
}

// Convierte la fila de public.users en el objeto que consume can()/visibleChildren().
// Un rol desconocido produce un usuario sin permisos ni alcance: falla cerrado.
export function buildUser(dbUser) {
  const rol = ROLES[dbUser?.role]
  return {
    ...dbUser,
    permissions: new Set(rol ? rol.permisos : []),
    scope: rol ? rol.scope : null,
    home: rol ? rol.home : null,
    esClinico: rol ? rol.esClinico : false,
    etiqueta: rol ? rol.etiqueta : '',
    color: rol ? rol.color : null,
  }
}
```

- [ ] **Step 4: Correr las pruebas para verificar que pasan**

Run: `npm test`
Expected: PASS, 37 pruebas.

- [ ] **Step 5: Commit**

```bash
git add src/permissions.js src/permissions.test.js
git commit -m "feat: matriz de los 4 roles semilla con contratos en pruebas"
```

---

### Task 5: Conectar `getAppUser`

**Files:**
- Modify: `src/supabase.js:27-43`

**Interfaces:**
- Consumes: `buildUser` de la Tarea 4
- Produces: `getAppUser` devuelve un usuario con `permissions`, `scope`, `home`, `esClinico`, `etiqueta`, `color`

- [ ] **Step 1: Modificar `getAppUser`**

En `src/supabase.js`, agregar el import arriba:

```js
import { buildUser } from './permissions.js'
```

Y cambiar el retorno de `getAppUser` (hoy `return dbUserToApp(data)`):

```js
  if (error) return null
  // buildUser adjunta permisos y alcance desde la matriz en código. En la Fase 2
  // esto pasa a leerse de las tablas roles/role_permissions.
  return buildUser(dbUserToApp(data))
```

- [ ] **Step 2: Verificar que compila**

Run: `npx vite build`
Expected: build correcto, sin errores de importación.

- [ ] **Step 3: Verificar que las pruebas siguen pasando**

Run: `npm test`
Expected: PASS, 37 pruebas.

- [ ] **Step 4: Commit**

```bash
git add src/supabase.js
git commit -m "feat: getAppUser adjunta permisos y alcance al usuario"
```

---

### Task 6: Reemplazar los checks de edición

Los cuatro sitios donde vive `admin || clinical_director || currentUser.id === <dueño>`.

**Files:**
- Modify: `src/App.jsx:2569` (HistorialTab), `:2675` (DocumentsSection), `:3678` (SesionesTab), `:3966` y `:4073` (ObjectivesList)

**Interfaces:**
- Consumes: `can` de la Tarea 2
- Produces: ninguna interfaz nueva

- [ ] **Step 1: Importar el módulo en App.jsx**

Junto a los imports existentes al inicio de `src/App.jsx`:

```js
import { can } from "./permissions.js";
```

- [ ] **Step 2: Reemplazar el check de sesiones en HistorialTab (línea 2569)**

Antes:
```js
const canEdit = (s) => currentUser && (currentUser.role === "admin" || currentUser.role === "clinical_director" || currentUser.id === s.specialistId);
```
Después:
```js
const canEdit = (s) => can(currentUser, "session:edit", s);
```

- [ ] **Step 3: Reemplazar el mismo check en SesionesTab (línea 3678)**

Antes:
```js
const canEdit = (s) => currentUser && (currentUser.role === "admin" || currentUser.role === "clinical_director" || currentUser.id === s.specialistId);
```
Después:
```js
const canEdit = (s) => can(currentUser, "session:edit", s);
```

- [ ] **Step 4: Reemplazar el check de documentos (línea 2675)**

Antes:
```js
const canEdit = currentUser && (currentUser.role === "admin" || currentUser.role === "clinical_director" || currentUser.id === d.authorId);
```
Después:
```js
const canEdit = can(currentUser, "document:edit", d);
```

- [ ] **Step 5: Reemplazar los checks de objetivos (líneas 3966 y 4073)**

Línea 3966, antes:
```js
const canEdit = (specId) => currentUser.role === "admin" || currentUser.role === "clinical_director" || currentUser.id === specId;
```
Después:
```js
const canEdit = (specId) => can(currentUser, "objective:edit", { specialistId: specId });
```

Línea 4073, antes:
```js
{(canEditThis || currentUser?.role === "admin" || currentUser?.role === "clinical_director") && (
```
Después:
```js
{canEditThis && (
```
(`canEditThis` ya viene de `canEdit(...)`, que ahora cubre el caso `:any`.)

- [ ] **Step 6: Verificar que no quedan checks de edición por rol**

Run: `grep -n 'role === "admin" || currentUser.role === "clinical_director" || currentUser.id' src/App.jsx`
Expected: sin resultados.

- [ ] **Step 7: Verificar build y pruebas**

Run: `npx vite build && npm test`
Expected: build correcto, 34 pruebas pasando.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: checks de edición usan can() en vez de nombres de rol"
```

---

### Task 7: Reemplazar los checks de acción y el id incrustado

**Files:**
- Modify: `src/App.jsx:2854` (AnamnesisTab), `:3576` (InterdisciplinaryTab), `:3749` (PlanTrabajoTab), `:3850` y `:3853` (ChildProfile), `:5012` y `:5059` (TopBar y ruta /gabinete)

**Interfaces:**
- Consumes: `can` de la Tarea 2
- Produces: ninguna interfaz nueva

- [ ] **Step 1: AnamnesisTab (línea 2854)**

Antes:
```js
const canEdit = currentUser && (currentUser.role === "admin" || currentUser.role === "clinical_director" || currentUser.role === "specialist");
```
Después:
```js
const canEdit = can(currentUser, "anamnesis:edit");
```

- [ ] **Step 2: PlanTrabajoTab (línea 3749)**

Antes:
```js
const canAdd = currentUser && (currentUser.role === "admin" || currentUser.role === "clinical_director" || currentUser.role === "specialist");
```
Después:
```js
const canAdd = can(currentUser, "workplan:create");
```

- [ ] **Step 3: Eliminar el id de usuario incrustado (línea 3576)**

Antes:
```js
const canSeePautas = currentUser && (currentUser.role === "admin" || currentUser.role === "clinical_director" || currentUser.id === "u-admin");
```
Después:
```js
const canSeePautas = can(currentUser, "guidelines:view");
```

- [ ] **Step 4: Botón "Registrar sesión" (línea 3850)**

Antes:
```js
{(currentUser.role === "specialist" || currentUser.role === "clinical_director") && child.assignedSpecialists.includes(currentUser.id) && (
```
Después:
```js
{can(currentUser, "session:create") && child.assignedSpecialists.includes(currentUser.id) && (
```
(La condición de asignación se conserva: es alcance sobre este niño concreto, no permiso.)

- [ ] **Step 5: Botón "Editar perfil" (línea 3853)**

Antes:
```js
{(currentUser.role === "admin" || currentUser.role === "clinical_director") && (
```
Después:
```js
{can(currentUser, "patient:edit") && (
```

- [ ] **Step 6: Acceso al gabinete (líneas 5012 y 5059)**

Línea 5012, antes:
```js
showGabinete={(currentUser.role === "admin" || currentUser.role === "clinical_director")}
```
Después:
```js
showGabinete={can(currentUser, "gabinete:view")}
```

Línea 5059, antes:
```js
(currentUser.role === "admin" || currentUser.role === "clinical_director") ? (
```
Después:
```js
can(currentUser, "gabinete:view") ? (
```

- [ ] **Step 7: Verificar que el id incrustado desapareció**

Run: `grep -n 'u-admin' src/App.jsx`
Expected: sin resultados en contexto de autorización. Si aparece en datos semilla (`seedUsers`), es correcto y se deja.

- [ ] **Step 8: Verificar build y pruebas**

Run: `npx vite build && npm test`
Expected: build correcto, 34 pruebas pasando.

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: checks de acción usan can(); elimina el id u-admin incrustado"
```

---

### Task 8: Reemplazar filtros de alcance y atributos de rol

**Files:**
- Modify: `src/App.jsx:759` y `:1014` (filtros "mis pacientes"), `:1018`, `:1582`, `:1892`, `:3143` (selectores de clínicos), `:5010` (etiqueta de retorno), `:5020-5059` (switch de paneles)

**Interfaces:**
- Consumes: `visibleChildren` de la Tarea 3, atributos de rol de la Tarea 4
- Produces: ninguna interfaz nueva

- [ ] **Step 1: Filtro de alcance en SpecialistHome (línea 759)**

Antes:
```js
const myChildren = children.filter((c) => c.assignedSpecialists.includes(user.id));
```
Después:
```js
const myChildren = visibleChildren(user, children);
```

- [ ] **Step 2: NO convertir el filtro de ClinicalDirectorHome (línea 1014) — solo renombrarlo**

Este es idéntico al anterior pero significa otra cosa, y confundirlos rompe la
pantalla. En `SpecialistHome` el filtro es **alcance**: son los únicos pacientes
que puede ver. En `ClinicalDirectorHome` es un **filtro personal**: dirección
clínica ve los 44 pacientes en el resto de su panel, y esa sección concreta
muestra "los míos". Como su `scope` es `todos`, sustituirlo por
`visibleChildren()` haría que esa sección liste los 44.

Se conserva la lógica y se renombra para que la diferencia quede escrita:

```js
const misPacientesAsignados = children.filter((c) => c.assignedSpecialists.includes(user.id));
```

Actualizar los usos de `myChildren` dentro de `ClinicalDirectorHome` al nombre nuevo.

- [ ] **Step 3: Selectores de clínicos (líneas 1018, 1582, 1892, 3143)**

Antes (las cuatro son idénticas salvo el nombre de la variable):
```js
users.filter((u) => u.role === "specialist" || u.role === "clinical_director")
```
Después:
```js
users.filter((u) => ROLES[u.role]?.esClinico)
```

- [ ] **Step 4: Etiqueta del botón de retorno (línea 5010)**

Antes:
```js
backLabel={currentUser.role === "admin" ? "Panel administrativo" : currentUser.role === "clinical_director" ? "Panel clínico" : "Mis pacientes"}
```
Después:
```js
backLabel={currentUser.home === "admin" ? "Panel administrativo" : currentUser.home === "clinico" ? "Panel clínico" : "Mis pacientes"}
```

- [ ] **Step 5: Switch de paneles en la ruta raíz (líneas 5020-5051)**

Reemplazar las cuatro ramas `currentUser.role === "..."` por `currentUser.home === "..."`, con esta correspondencia exacta:

```
role === "shadow"            ->  home === "tutor"
role === "specialist"        ->  home === "especialista"
role === "clinical_director" ->  home === "clinico"
role === "admin"             ->  home === "admin"
```

El resto de cada rama (componente y props) no cambia.

- [ ] **Step 6: Verificar build y pruebas**

Run: `npx vite build && npm test`
Expected: build correcto, 34 pruebas pasando.

- [ ] **Step 7: Verificación manual con los 4 roles**

Levantar `npm run dev` y entrar con una cuenta de cada rol. Confirmar, por rol:

| Rol | Debe ver | No debe ver |
|---|---|---|
| admin | Panel administrativo, botón Gabinete, alta de paciente, editar perfil | Botón "Registrar sesión" |
| clinical_director | Panel clínico, Gabinete, registrar sesión, pautas | Alta de paciente |
| specialist | Sus pacientes, registrar sesión en los asignados | Gabinete, pautas, editar perfil |
| shadow | Su niño, crear reporte de tutor | Cerrar proceso, renovar paquete, generar reportes |

La última fila es el cambio de comportamiento aprobado.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: alcance y atributos de rol desde el módulo de permisos"
```

---

---

### Task 9: Sitios restantes y verificación final

Cuatro sitios con literales de rol que el resto del plan no cubre. Se detectaron en
el escaneo previo a la ejecución; sin esta tarea la verificación de "no quedan
comparaciones de rol" no puede pasar.

**Files:**
- Modify: `src/App.jsx` — eliminar `LoginScreen`; `TopBar` (etiqueta de rol);
  `SessionWizard` (filtro de objetivos); las dos guardas de carga desde Supabase

**Interfaces:**
- Consumes: `can` (Tarea 2), atributo `home` de `buildUser` (Tarea 4)
- Produces: ninguna interfaz nueva

- [ ] **Step 1: Confirmar que `LoginScreen` es código muerto**

Run: `grep -n "LoginScreen" src/App.jsx`
Expected: una sola línea, la de su definición (`function LoginScreen(`). Si aparece
renderizado en algún sitio, **detenerse y reportar** — el resto de esta tarea asume
que no se usa.

- [ ] **Step 2: Eliminar `LoginScreen`**

Borrar la función `LoginScreen` completa (desde `function LoginScreen({ users, tutors, onLogin }) {`
hasta su llave de cierre, unas 80 líneas). La app autentica con `<Login />` de
`Login.jsx`; este componente quedó de una versión anterior y contiene lógica con
forma de autorización que nadie ejecuta. En un refactor de permisos eso es un riesgo:
si alguien lo revive, reintroduce literales de rol que ya nadie audita.

- [ ] **Step 3: Etiqueta de rol en TopBar**

Antes:
```js
<div style={{ fontSize: 11.5, color: T.inkFaint }}>{user.role === "admin" || user.role === "clinical_director" ? user.title || user.specialty : user.role === "shadow" ? `Tutor AIRA · ${user.school}` : user.specialty}</div>
```
Después:
```js
<div style={{ fontSize: 11.5, color: T.inkFaint }}>{user.home === "admin" || user.home === "clinico" ? user.title || user.specialty : user.home === "tutor" ? `Tutor AIRA · ${user.school}` : user.specialty}</div>
```

- [ ] **Step 4: Filtro de objetivos en SessionWizard**

Este tiene forma de autorización y se le escapó a la Tarea 6.

Antes:
```js
    (currentUser.role === "admin" || currentUser.role === "clinical_director" || o.specialistId === currentUser.id)
```
Después:
```js
    can(currentUser, "objective:edit", o)
```

- [ ] **Step 5: Guardas de carga desde Supabase (dos sitios idénticos)**

Los tutores sombra trabajan sobre datos semilla y no cargan de la base.

Antes (en los dos sitios):
```js
    if (currentUser && currentUser.role !== "shadow") {
```
Después:
```js
    if (currentUser && currentUser.home !== "tutor") {
```

- [ ] **Step 6: Verificar que no quedan comparaciones de rol**

Run: `grep -n 'role === "' src/App.jsx`
Expected: solo líneas dentro de `seedUsers` y `seedTutors` (datos semilla, correcto).
No debe quedar ninguna en lógica de decisión.

Run: `grep -n 'role !== "' src/App.jsx`
Expected: sin resultados.

- [ ] **Step 7: Verificar que el id incrustado desapareció de la autorización**

Run: `grep -n 'u-admin' src/App.jsx`
Expected: solo apariciones dentro de `seedUsers`. Ninguna en un condicional.

- [ ] **Step 8: Verificar build y pruebas**

Run: `npx vite build && npm test`
Expected: build correcto, 34 pruebas pasando.

- [ ] **Step 9: Verificación manual del login**

Levantar `npm run dev` y confirmar que la pantalla de inicio de sesión carga y
permite entrar. Es la comprobación de que borrar `LoginScreen` no rompió nada.

- [ ] **Step 10: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: elimina LoginScreen muerto y los literales de rol restantes"
```


## Definición de terminado

- `grep -n 'role === "' src/App.jsx` no devuelve nada fuera de datos semilla (Tarea 9).
- `grep -n 'role !== "' src/App.jsx` no devuelve nada (Tarea 9).
- `grep -n 'u-admin' src/App.jsx` no devuelve nada en contexto de autorización.
- `npm test` pasa con 37 pruebas.
- `npx vite build` compila.
- Verificación manual de la Tarea 8 completada con los 4 roles.

Al terminar esta fase la app se comporta igual que hoy (salvo el hueco cerrado del tutor sombra), pero ninguna decisión de autorización menciona un rol por su nombre. Eso es lo que habilita la Fase 2.

## Fuera de alcance — fases siguientes

- **Fase 2:** tablas `permissions` / `roles` / `role_permissions`, `users.role_id`, siembra desde `ROLES`, y `buildUser` leyendo de la base en vez del mapa en código.
- **Fase 3:** helpers RLS, trigger anti-autoascenso, políticas nuevas y el corte.
- **Fase 4:** UI de administración de roles en `/roles`.

Cada una lleva su propio plan, escrito cuando la anterior esté en producción.
