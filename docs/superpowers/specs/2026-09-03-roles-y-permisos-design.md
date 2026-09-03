# Roles y permisos configurables — AIRA Learning Hub

**Fecha:** 2026-09-03
**Estado:** aprobado, pendiente de plan de implementación

## Problema

La autorización vive en 52 comprobaciones dispersas por `src/App.jsx` (5000 líneas):
30 comparaciones contra `currentUser.role` y 12 contra pertenencia
(`assignedSpecialists.includes`). Tres consecuencias:

1. **No se pueden crear roles.** Un rol nuevo exigiría tocar los 52 sitios, porque
   cada uno nombra roles literalmente (`role === "clinical_director"`).
2. **El campo `role` hace tres trabajos a la vez** y los confunde: qué permisos
   tiene, qué pacientes alcanza, y atributos de presentación (a qué panel entra,
   si aparece en los selectores de terapeuta, con qué etiqueta se muestra).
3. **Hay un id de usuario incrustado en un check de autorización.**
   `App.jsx:3576`: `canSeePautas = ... || currentUser.id === "u-admin"`. Si esa
   cuenta se renombra o se recrea, el acceso se pierde en silencio.

La capa de base de datos ya está bien construida: RLS activo, políticas por rol,
y una función `current_app_user()` correcta (`STABLE SECURITY DEFINER` con
`search_path` fijo). Este trabajo la generaliza, no la reemplaza.

## Alcance

Permisos aplicados en **dos capas**: el cliente decide qué se ve, Postgres decide
qué se puede hacer. Las dos son necesarias y cumplen papeles distintos —
ver "Riesgo de divergencia" al final.

Fuera de alcance: autenticación, gestión de sesiones, auditoría de accesos.

## Modelo

### Permisos: catálogo cerrado

Los permisos son una lista fija en código (35 claves). Los roles son datos y se
crean desde la app combinándolos. La alternativa —permisos también creables— se
descartó: un permiso que el código no verifica no protege nada, y da sensación de
control sin control real.

| Grupo | Claves |
|---|---|
| Pacientes | `patient:view` `patient:create` `patient:edit` `patient:close` `patient:renew_package` |
| Sesiones | `session:view` `session:create` `session:edit:own` `session:edit:any` |
| Objetivos | `objective:view` `objective:create` `objective:edit:own` `objective:edit:any` `objective:delete` |
| Documentos | `document:view` `document:create` `document:edit:own` `document:edit:any` |
| Clínico | `anamnesis:view` `anamnesis:edit` `workplan:view` `workplan:create` |
| Reportes | `report:view` `report:generate` `report:parent:generate` |
| Interdisciplinario | `meeting:view` `meeting:create` `guidelines:view` |
| Gabinete | `gabinete:view` `gabinete:session:create` `school:create` |
| Tutores | `tutorreport:view` `tutorreport:create` |
| Administración | `user:manage` `role:manage` |

`guidelines:view` reemplaza el `currentUser.id === "u-admin"` incrustado.

El par `:own` / `:any` traduce el patrón existente: un especialista edita **su**
sesión, dirección clínica edita **cualquiera**.

### Roles: datos, con cuatro atributos que no son permisos

```
scope:      todos | asignados | un_nino    -- qué pacientes alcanza
home:       cuál panel al iniciar sesión
es_clinico: aparece en selectores de terapeuta
etiqueta + color: presentación
```

Estos cuatro no son deducibles para un rol nuevo. Hoy están implícitos en el
nombre del rol; al hacerlos datos, un rol creado desde la app puede declararlos.

Los 4 roles actuales (`admin`, `clinical_director`, `specialist`, `shadow`) se
siembran como filas con `es_sistema = true`. **La migración no cambia el
comportamiento de nadie.**

## Datos

```sql
create table public.permissions (          -- catálogo, semilla, no editable
  key text primary key, grupo text not null, descripcion text not null
);

create table public.roles (
  id text primary key,
  nombre text not null,
  scope text not null check (scope in ('todos','asignados','un_nino')),
  home text not null check (home in ('admin','clinico','especialista','tutor')),
  es_clinico boolean not null default false,
  etiqueta text not null,
  color text,
  es_sistema boolean not null default false,
  created_at timestamptz default now()
);

create table public.role_permissions (
  role_id text references public.roles(id) on delete cascade,
  permission_key text references public.permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

alter table public.users add column role_id text references public.roles(id);
```

**`users.role` no se elimina en este cambio.** Se rellena `role_id` desde `role` y
conviven. Es la ruta de rollback: revertir el cliente basta, sin migración inversa
de datos. Se elimina en un cambio posterior, cuando el esquema nuevo lleve semanas
estable.

Índices: `users(auth_id)` único; **GIN sobre `children.assigned_specialists`** —
sin él el operador `@>` hace scan completo en cada verificación de alcance.

## Capa cliente — `src/permissions.js`

Tres responsabilidades: el catálogo, `can()`, y el alcance.

```js
export function can(user, action, resource) {
  if (!user?.permissions) return false;        // falla cerrado
  const p = user.permissions;
  if (p.has(action)) return true;              // simple: 'gabinete:view'
  if (p.has(`${action}:any`)) return true;
  if (p.has(`${action}:own`) && isOwner(user, action, resource)) return true;
  return false;
}

const OWNER_FIELD = { session:'specialistId', document:'authorId', objective:'specialistId' };

function isOwner(user, action, resource) {
  if (!resource) return false;
  const field = OWNER_FIELD[action.split(':')[0]];
  return field ? resource[field] === user.id : false;
}

export function visibleChildren(user, children) {
  switch (user.scope) {
    case 'todos':     return children;
    case 'asignados': return children.filter(c => c.assignedSpecialists.includes(user.id));
    case 'un_nino':   return children.filter(c => c.id === user.assignedChildId);
    default:          return [];               // rol mal configurado: no ve nada
  }
}
```

Una sola función resuelve permisos simples y pares `:own`/`:any`, sin ramas en los
llamadores. Devuelve `false` mientras los permisos no hayan cargado: la UI oculta
acciones hasta saber, en vez de mostrarlas y retirarlas.

`getAppUser` trae rol y permisos en la misma consulta
(`.select('*, roles(*, role_permissions(permission_key))')`) y devuelve
`{ ...usuario, permissions: Set, scope, home, esClinico, etiqueta, color }`.

### Traducción de los 52 checks

| Hoy | Después |
|---|---|
| `admin \|\| clinical_director \|\| currentUser.id === s.specialistId` ×4 | `can(u,'session:edit',s)` / `can(u,'objective:edit',o)` |
| `admin \|\| clinical_director \|\| role === 'specialist'` ×2 | `can(u,'anamnesis:edit')`, `can(u,'workplan:create')` |
| `... \|\| currentUser.id === "u-admin"` | `can(u,'guidelines:view')` |
| `children.filter(assignedSpecialists.includes(id))` ×4 | `visibleChildren(u, children)` |
| `users.filter(role === 'specialist' \|\| 'clinical_director')` ×4 | `users.filter(u => u.esClinico)` |
| Switch de 4 ramas por rol en `<Routes>` | `<HomeFor home={u.home} />` |
| Etiquetas `"Admin"` / `"Dir. Clínica"` ×3 | `u.etiqueta` / `u.color` |

Ninguna llamada resultante menciona un rol por nombre. Ahí es donde crear un rol
pasa de imposible a trivial.

## Capa RLS

**No se modifica `current_app_user()`.** Postgres no permite cambiar el
`RETURNS TABLE` de una función existente, y forzarlo exigiría eliminar antes todas
las políticas que la usan. Se agregan funciones nuevas al lado; las políticas
viejas siguen funcionando durante toda la migración.

Cuatro helpers **escalares**, porque no dependen de la fila:

```sql
public.app_user_id()        returns text
public.app_scope()          returns text
public.app_assigned_child() returns text
public.has_perm(p text)     returns boolean
```

Todas `STABLE SECURITY DEFINER SET search_path TO 'public'`. `security definer` es
obligatorio, no una optimización: una política sobre `users` que consulte `users`
recursa infinito, y la función corta la recursión al saltar RLS internamente.
`search_path` fijo cierra un escalamiento de privilegios vía esquema falso.

Se invocan envueltas — `(select public.has_perm('x'))` — para que Postgres las
evalúe **una vez por consulta** en vez de una por fila. Sobre 438 sesiones es la
diferencia entre 1 y 438 llamadas. Como `AND` corta en corto, un usuario sin el
permiso nunca llega a evaluar el alcance.

Resolvedor de alcance, con atajo y fallo cerrado:

```sql
create or replace function public.can_see_child(cid text) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select case (select r.scope from public.users u
                 join public.roles r on r.id = u.role_id
                where u.auth_id = auth.uid())
    when 'todos'     then true
    when 'asignados' then exists (select 1 from public.children c
                                   where c.id = cid
                                     and (select public.app_user_id()) = any (c.assigned_specialists))
    when 'un_nino'   then cid = (select public.app_assigned_child())
    else false
  end
$$;
```

Tres patrones cubren las 11 tablas con políticas:

```sql
-- lectura con alcance
using ( (select public.has_perm('session:view')) and public.can_see_child(child_id) )

-- escritura simple
with check ( (select public.has_perm('patient:create')) )

-- edición con :own / :any
using (
  public.can_see_child(child_id)
  and (   (select public.has_perm('session:edit:any'))
       or ((select public.has_perm('session:edit:own')) and specialist_id = (select public.app_user_id())) )
)
```

### Guardas contra escalada de privilegios

Roles editables significa que quien tenga `role:manage` puede concederse cualquier
permiso. Es inherente al RBAC administrable; sin frenos es escalada de un clic.

**1. Nadie cambia su propio rol.** Trigger, no política — la política no distingue
qué columna cambió:

```sql
create or replace function public.block_self_role_change() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.role_id is distinct from old.role_id and old.id = public.app_user_id() then
    raise exception 'No puedes cambiar tu propio rol';
  end if;
  return new;
end $$;
```

Sin esto, cualquiera con `user:manage` se asciende solo. Con esto hacen falta dos
personas.

**2. Roles semilla inmutables.** `es_sistema = true` en los 4 actuales; las
políticas los rechazan para UPDATE y DELETE. Siempre queda un rol admin completo,
aunque alguien destroce los demás.

**3. `permissions` es de solo lectura desde la app.** El catálogo lo siembra la
migración.

**RLS de las tablas nuevas:** lectura para cualquier autenticado (el catálogo y las
etiquetas no son secretos y el cliente los necesita); escritura solo con
`role:manage`, nunca sobre filas `es_sistema`.

## UI de administración

```
/roles              lista
/roles/nuevo        crear
/roles/:roleId      editar
```

Detrás de `can(u,'role:manage')`, siguiendo el patrón de URL de `/paciente/:id`.

**Lista:** nombre, etiqueta con color, alcance, y **cuántos usuarios lo tienen** —
ese contador convierte editar un rol en decisión informada. Los `es_sistema` van
en solo lectura con botón **Duplicar**, que es como se crea un rol nuevo en la
práctica: partiendo de uno existente.

**Editor:** atributos arriba, permisos abajo agrupados por los 10 grupos.

Los pares `:own`/`:any` **no van como dos casillas** — permitirían marcar `:any`
sin `:own`, un estado sin significado que un administrador producirá por
accidente. Van como selector de tres estados:

```
Editar sesiones     ( ) Ninguna   (•) Solo las propias   ( ) Todas
```

El estado sin sentido deja de ser representable.

**Dos avisos visibles:**
- Marcar `role:manage` advierte que el rol podrá modificar permisos de otros.
- Cambiar el alcance de un rol con usuarios avisa a cuántos afecta y en qué
  dirección.

**Borrar** un rol con usuarios asignados está bloqueado — primero se reasignan.
Evita usuarios sin `role_id`, que con el `else false` del resolvedor quedarían sin
ver nada.

**Visual:** reutiliza el sistema existente (tokens `T`, Fraunces/Inter, `Card`,
`Chip`, `Btn`, `Modal`). No introduce lenguaje visual nuevo.

## Orden de migración

| # | Paso | ¿Afecta la app? |
|---|---|---|
| 1 | Crear tablas + sembrar catálogo y 4 roles | No |
| 2 | Añadir `role_id` + backfill desde `role` | No |
| 3 | Crear helpers y trigger | No |
| 4 | Crear políticas nuevas con nombres propios | No |
| 5 | **Corte:** eliminar políticas viejas, desplegar cliente | Sí |
| 6 | Semanas después: eliminar `users.role` y `current_app_user()` | No |

Solo el paso 5 toca comportamiento, y es una transacción única: entran todas las
políticas o ninguna.

**El orden de despliegue importa en una dirección.** El cliente nuevo funciona
contra las políticas viejas (los permisos son un superconjunto compatible), pero
el cliente viejo **no** funciona contra las nuevas: leería `users.role` mientras
la base decide por `role_id`. Base primero, cliente después. Nunca al revés.

**Rollback:** reaplicar las definiciones viejas, capturadas textualmente de
`pg_policies` antes del corte. Posible porque `current_app_user()` y `users.role`
sobreviven intactos.

Aplicar con respaldo y fuera de horario de consulta. Es una base de producción con
expedientes clínicos.

## Riesgo de divergencia

`permissions.js` y las políticas RLS son **dos implementaciones de la misma
regla** y pueden separarse con el tiempo. La disciplina que lo contiene: el
cliente es solo experiencia de usuario —decide qué botón se ve— y la base es la
que manda.

Si `can()` se equivoca hacia permisivo, RLS rechaza y sale un error: feo, no es
brecha. Al revés no se sostiene: si `can()` fuera lo único, volvemos al problema
de hoy, donde los permisos son `&&` en JSX que cualquiera evade con la API REST.

## Verificación

No hay tests en el repo ni runner configurado. Como mínimo, antes del paso 5:

- Por cada rol semilla, confirmar que el conjunto de permisos sembrado reproduce
  exactamente lo que hoy permiten los 52 checks. Es la prueba de que la migración
  no cambia comportamiento.
- Con un token de cada rol, `curl` directo a la API REST intentando leer un
  paciente fuera de alcance. Debe devolver vacío. Es la comprobación de que RLS
  obliga de verdad, que era el objetivo del trabajo.
- Probar el trigger: intentar cambiarse el rol a uno mismo debe fallar.
- Probar el fallo cerrado: un usuario con `role_id` nulo no debe ver nada.
