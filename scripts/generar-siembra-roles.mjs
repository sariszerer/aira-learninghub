import { PERMISSIONS, ROLES } from '../src/permissions.js'
const esc = (s) => String(s).replace(/'/g, "''")
const L = []
L.push('-- Catalogo de permisos. Generado desde src/permissions.js.')
L.push('insert into public.permissions (key, grupo, descripcion) values')
L.push(PERMISSIONS.map(p => `  ('${esc(p.key)}', '${esc(p.grupo)}', '${esc(p.descripcion)}')`).join(',\n') +
  '\non conflict (key) do update set grupo = excluded.grupo, descripcion = excluded.descripcion;')
L.push('')
L.push('-- Los 4 roles actuales, como filas de sistema.')
L.push('insert into public.roles (id, nombre, scope, home, es_clinico, etiqueta, color, es_sistema) values')
L.push(Object.entries(ROLES).map(([id, r]) =>
  `  ('${esc(id)}', '${esc(r.nombre)}', '${esc(r.scope)}', '${esc(r.home)}', ${r.esClinico}, '${esc(r.etiqueta)}', ${r.color ? `'${esc(r.color)}'` : 'null'}, true)`).join(',\n') +
  '\non conflict (id) do update set nombre = excluded.nombre, scope = excluded.scope,\n  home = excluded.home, es_clinico = excluded.es_clinico, etiqueta = excluded.etiqueta,\n  color = excluded.color;')
L.push('')
const pares = []
for (const [id, r] of Object.entries(ROLES)) for (const k of r.permisos) pares.push(`  ('${esc(id)}', '${esc(k)}')`)
L.push(`-- ${pares.length} concesiones, tomadas una a una de la matriz del codigo.`)
L.push('insert into public.role_permissions (role_id, permission_key) values')
L.push(pares.join(',\n') + '\non conflict do nothing;')
console.log(L.join('\n'))
console.error(`permisos: ${PERMISSIONS.length}`)
for (const [id, r] of Object.entries(ROLES)) console.error(`  ${id}: ${r.permisos.length}`)
