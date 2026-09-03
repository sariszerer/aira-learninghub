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

// El alcance es independiente de los permisos: responde "qué pacientes", no
// "qué acciones". Un scope desconocido no ve nada — falla cerrado, igual que can().
export function visibleChildren(user, children) {
  if (!user || !Array.isArray(children)) return []
  switch (user.scope) {
    case 'todos':     return children
    case 'asignados': return children.filter(c => c.assignedSpecialists?.includes(user.id))
    case 'un_nino':   return user.assignedChildId != null
      ? children.filter(c => c.id === user.assignedChildId)
      : []
    default:          return []
  }
}

export function canSeeChild(user, child) {
  if (!child) return false
  return visibleChildren(user, [child]).length === 1
}

const TODAS_LAS_LECTURAS = [
  'patient:view', 'session:view', 'objective:view', 'document:view',
  'anamnesis:view', 'workplan:view', 'report:view', 'meeting:view',
]

// Los 4 roles actuales, derivados uno a uno de los checks de App.jsx.
// La Fase 2 los siembra como filas con es_sistema = true; hasta entonces esta
// es la única fuente. Cambiar algo aquí cambia permisos en producción.
//
// patient:renew_package se asigna a admin, dirección clínica y especialista
// porque el cableado (onRenewPackage) existe, pero hoy no tiene punto de uso
// en la interfaz: no hay botón en App.jsx que lo invoque y el estado
// confirmRenew está muerto. Nadie ejerce esta capacidad todavía.
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
      // sin tutorreport:create — el único punto de creación es TutorAiraHome,
      // que solo se monta para shadow
      'user:manage', 'role:manage',
    ],
  },

  clinical_director: {
    nombre: 'Dirección clínica', etiqueta: 'Dir. Clínica', color: 'brandBright',
    scope: 'todos', home: 'clinico', esClinico: true,
    permisos: [
      ...TODAS_LAS_LECTURAS,
      // tutorreport:view: hoy solo ClinicalDirectorHome muestra reportes de tutor
      'tutorreport:view',
      'patient:edit', 'patient:close', 'patient:renew_package',
      'session:create', 'session:edit:any',
      'objective:create', 'objective:edit:any',
      'document:create', 'document:edit:any',
      'anamnesis:edit', 'workplan:create',
      'report:generate', 'report:parent:generate',
      'meeting:create', 'guidelines:view',
      'gabinete:view', 'gabinete:session:create', 'school:create',
      // sin tutorreport:create — el único punto de creación es TutorAiraHome,
      // que solo se monta para shadow
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
    // Cambio de comportamiento aprobado: cierra el hueco de shadow, que hoy
    // podría ejercer 8 capacidades de escritura solo por ausencia de check en
    // App.jsx, no por diseño: cerrar procesos (patient:close), renovar
    // paquetes (patient:renew_package), generar reportes (report:generate,
    // report:parent:generate), subir o editar sus documentos (document:create,
    // document:edit:own — DocumentsSection:2661), crear plan de trabajo
    // (workplan:create — bypass del canAdd en PlanTrabajoTab:3763) y registrar
    // reuniones (meeting:create — InterdisciplinaryTab:3654). shadow queda
    // solo con las 8 lecturas de TODAS_LAS_LECTURAS más sus reportes de tutor.
    permisos: [
      ...TODAS_LAS_LECTURAS,
      'tutorreport:view', 'tutorreport:create',
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
    etiqueta: rol ? rol.etiqueta : null,
    color: rol ? rol.color : null,
  }
}
