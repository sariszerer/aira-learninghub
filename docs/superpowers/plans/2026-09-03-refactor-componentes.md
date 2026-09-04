# Refactor de `App.jsx` a componentes — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partir `src/App.jsx` (5058 líneas, 89 definiciones) en ~40 archivos enfocados, moviendo el estado global a Zustand, **sin cambiar comportamiento**.

**Architecture:** Extracción mecánica en capas, de las hojas hacia la raíz: tema y utilidades primero, luego primitivas de interfaz, luego los stores, luego las pantallas, y al final `App.jsx` queda como router y providers. Tres stores de Zustand (`auth`, `data`, `calendar`) reemplazan el estado que hoy vive en `App()` y baja por props.

**Tech Stack:** React 18, Vite 5, Zustand 5, react-router-dom 7, Vitest, Supabase JS.

**Spec:** No hay documento de spec aparte. En un refactor sin cambio de comportamiento, este plan es el diseño; la sección "Arquitectura" de abajo cumple ese papel, y el contrato es que la app se comporte igual.

## Global Constraints

- **Cero cambio de comportamiento.** Esto es mover código, no mejorarlo. Si encuentras un bug, **no lo arregles** — anótalo en el reporte. Un refactor que también corrige cosas es imposible de revisar.
- **Nada de reescribir mientras mueves.** Las funciones se mueven verbatim. Se permiten exactamente tres ajustes: añadir `import`, añadir `export`, y cambiar props por lectura del store donde el plan lo indique explícitamente.
- **No se toca `src/permissions.js` ni `src/permissions.test.js`.** Las 44 pruebas deben seguir pasando tras cada tarea.
- **No se toca la base de datos.**
- Sin TypeScript. ES modules. Comillas dobles en JSX, simples en JS plano.
- Ningún archivo nuevo debe pasar de ~350 líneas. Si al mover algo se pasa, pártelo por responsabilidad y dilo en el reporte.
- Tras **cada** tarea: `npx vite build` y `npm test` (44 pruebas). Ambos deben pasar antes de commitear.

## Arquitectura

### Estructura destino

```
src/
  main.jsx                      sin cambios (BrowserRouter)
  App.jsx                       router + providers            ~80 líneas
  theme.js                      T, FONTS, STATUS, MobileStyles
  brand.js                      los dos data URI base64
  constants.js                  ACTIVITY_CATALOG, DOC_TYPES, MEETING_TYPES
  permissions.js                ya existe, no se toca
  supabase.js                   ya existe
  googleCalendar.js             ya existe
  Login.jsx                     ya existe
  lib/
    format.js                   fmtDate, fmtDateShort, readableTextOn, slugifyName, daysAgoISO
    reports.js                  sessionsSinceLastParentReport, buildParentReportText
  data/
    seed.js                     todos los seed*
  store/
    authStore.js                currentUser, authLoading
    dataStore.js                las 12 colecciones + carga + mutaciones
    calendarStore.js            eventos de Google Calendar
  ui/                           primitivas sin lógica de dominio
  shell/                        TopBar, DriveSaveBar, estados de ruta
  home/                         los 4 paneles por rol + agenda + calendario
  patient/
    ChildProfile.jsx
    tabs/                       los 7 tabs
    modals/                     wizards y modales de la ficha
  gabinete/  consent/  patients/
```

### Los tres stores

Se separan porque cambian por razones distintas: la sesión cambia al iniciar y cerrar sesión, los datos cambian con cada operación clínica, y el calendario depende de un servicio externo que puede fallar solo.

```js
// store/authStore.js
useAuthStore  ->  { currentUser, authLoading, setCurrentUser, setAuthLoading }

// store/dataStore.js
useDataStore  ->  {
  children, users, objectives, sessions, documents, meetings,
  parentReports, tutors, schools, gabineteSessions, tutorReports, activityLog,
  appLoading, dataLoaded,
  loadAll(role, userId),
  addChild, updateChild, closeProcess, renewPackage,
  addSession, updateSession,
  addObjective, updateObjective, deleteObjective,
  addDocument, updateDocument,
  addMeeting, addSchool, addGabineteSession, addTutorReport,
  markActivitySeen,
}

// store/calendarStore.js
useCalendarStore -> { events, connected, loading, error, date, fetchEvents(date), connect() }
```

`dataStore` necesita el rol para filtrar pacientes. Lee del otro store cuando lo requiere:
`useAuthStore.getState().currentUser` — acceso puntual fuera de React, que es lo que Zustand permite y Context no.

**El estado efímero de pantalla NO va a los stores.** `wizardOpen`, `viewingReport`, `fullHistoryOpen`, `evolutionOpen`, `parentReportOpen`, `editingProfile` y demás siguen siendo `useState` local del componente que los abre. Son de la vista, no de la aplicación.

### Orden de extracción

De las hojas hacia la raíz, para que nada importe algo que aún no existe:

```
1  theme + brand      (sin dependencias)
2  lib/               (funciones puras)
3  data/seed.js       (depende de theme)
3b constants.js       (catálogos de dominio)
4  ui/                (depende de theme)
5  store/             (depende de supabase, googleCalendar, permissions)
6  shell/             (depende de ui, store)
7  home/              (depende de ui, store, lib)
8  patient/           (lo más grande)
9  gabinete/ consent/ patients/
10 App.jsx adelgaza   (queda router + providers)
```

---

### Task 1: Tema y assets de marca

131 KB de base64 viven hoy en 2 líneas de `App.jsx`. Ensucian todos los diffs del archivo.

**Files:**
- Create: `src/theme.js`, `src/brand.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: nada
- Produces: `theme.js` exporta `T`, `FONTS`, `STATUS`, `SPECIALIST_COLORS`, `MobileStyles`, `TODAY`. `brand.js` exporta `AIRA_MARK_URI` y el otro data URI que haya.

- [ ] **Step 1: Crear `src/brand.js`**

Mueve verbatim `AIRA_MARK_URI` y `AIRA_LOGO_FULL_URI` — las dos constantes con `data:image/...;base64,`. Confírmalas con `grep -n "base64" src/App.jsx`. Expórtalas con `export const`.

- [ ] **Step 2: Crear `src/theme.js`**

Mueve verbatim, en este orden: `T`, `FONTS`, `STATUS`, `SPECIALIST_COLORS`, `CHILD_AVATAR_COLORS`, `inputStyle`, `TODAY`, y la función `MobileStyles`. Expórtalas todas. `inputStyle` es un objeto de estilo compartido por varios formularios y `CHILD_AVATAR_COLORS` una paleta: los dos son tema, no lógica. `MobileStyles` es un componente React, así que el archivo necesita `import React from "react"`.

Si alguna de esas constantes referencia un data URI, importa desde `./brand.js`.

- [ ] **Step 3: Importar en App.jsx**

Borra las definiciones movidas y añade arriba:
```js
import { T, FONTS, STATUS, SPECIALIST_COLORS, CHILD_AVATAR_COLORS, inputStyle, TODAY, MobileStyles } from "./theme.js";
```
Ajusta si algún nombre no existe: usa `grep -n "SPECIALIST_COLORS\|const TODAY" src/App.jsx` para confirmar cuáles hay antes de moverlos.

- [ ] **Step 4: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas pasando.

Run: `grep -c "base64" src/App.jsx`
Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add src/theme.js src/brand.js src/App.jsx
git commit -m "refactor: extrae tema y assets de marca de App.jsx"
```

---

### Task 2: Utilidades puras

**Files:**
- Create: `src/lib/format.js`, `src/lib/reports.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: nada (`format.js`); `format.js` (`reports.js`)
- Produces:
  - `format.js`: `fmtDate(iso)`, `fmtDateShort(iso)`, `readableTextOn(hex)`, `slugifyName(s)`, `daysAgoISO(n)`
  - `reports.js`: `sessionsSinceLastParentReport(childId, sessions, parentReports)`, `buildParentReportText(child, rangeSessions, objectives)`

- [ ] **Step 1: Crear `src/lib/format.js`**

Mueve verbatim las 5 funciones listadas arriba y expórtalas. Son puras, sin dependencias de React.

- [ ] **Step 2: Crear `src/lib/reports.js`**

Mueve verbatim `sessionsSinceLastParentReport` y `buildParentReportText`. Si usan `fmtDate`, importa desde `./format.js`.

- [ ] **Step 3: Importar en App.jsx y borrar las definiciones**

- [ ] **Step 4: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

- [ ] **Step 5: Commit**

```bash
git add src/lib src/App.jsx
git commit -m "refactor: extrae utilidades de formato y reportes"
```

---

### Task 3: Datos semilla

**Files:**
- Create: `src/data/seed.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `theme.js` (los `avatarBg` referencian `T`)
- Produces: `seedChildren`, `seedUsers`, `seedObjectives`, `seedSessions`, `seedDocuments`, `seedMeetings`, `seedParentReports`, `seedTutors`, `seedSchools`, `seedGabineteSessions`, `seedTutorReports`

- [ ] **Step 1: Listar qué hay**

Run: `grep -n "^const seed" src/App.jsx`
Anota los nombres exactos. Mueve todos los que aparezcan, aunque el listado de arriba difiera.

- [ ] **Step 2: Crear `src/data/seed.js`**

Mueve verbatim, con `import { T } from "../theme.js"` arriba. Exporta cada uno.

- [ ] **Step 3: Importar en App.jsx y borrar las definiciones**

- [ ] **Step 4: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

- [ ] **Step 5: Commit**

```bash
git add src/data src/App.jsx
git commit -m "refactor: extrae datos semilla"
```

---

### Task 3b: Catálogos de dominio

Tres constantes que no son tema ni datos semilla: son vocabulario del dominio clínico, y varias pantallas las comparten.

**Files:**
- Create: `src/constants.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `theme.js` si alguna referencia colores
- Produces: `ACTIVITY_CATALOG`, `DOC_TYPES`, `MEETING_TYPES`

- [ ] **Step 1: Crear `src/constants.js`**

Mueve verbatim `ACTIVITY_CATALOG` (tipos de evento del registro de actividad), `DOC_TYPES` (tipos de documento clínico) y `MEETING_TYPES` (tipos de reunión interdisciplinaria). Expórtalas.

Si alguna referencia `T`, importa desde `./theme.js`.

- [ ] **Step 2: Importar en App.jsx y borrar las definiciones**

- [ ] **Step 3: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

- [ ] **Step 4: Commit**

```bash
git add src/constants.js src/App.jsx
git commit -m "refactor: extrae catálogos de dominio"
```

---

### Task 4: Primitivas de interfaz

**Files:**
- Create: `src/ui/` con un archivo por componente
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `theme.js`, `lib/format.js`
- Produces: un `export default` por archivo

Componentes a mover, uno por archivo: `Logo`, `Eyebrow`, `StatusPill`, `StatusRing`, `Avatar`, `Btn`, `Chip`, `Card`, `Modal`, `ModalHeader`, `Field`, `Section`, `FieldLabel`, `StepDots`, `EmptyNote`, `SavedToast`, `StatStrip`, `DateRangeBar`, `ReportCard`.

`Avatar` usa `readableTextOn`; `StatusPill` y `StatusRing` usan `STATUS`. Importa lo que cada uno necesite.

- [ ] **Step 1: Crear `src/ui/index.js` como barril**

Para que `App.jsx` haga un solo import en vez de 19:
```js
export { default as Btn } from './Btn.jsx'
export { default as Card } from './Card.jsx'
// ...una línea por componente
```

- [ ] **Step 2: Mover los 19 componentes, uno por archivo**

Verbatim. Cada archivo termina en `export default NombreDelComponente`.

- [ ] **Step 3: Importar en App.jsx y borrar las definiciones**

```js
import { Logo, Eyebrow, StatusPill, StatusRing, Avatar, Btn, Chip, Card, Modal,
         ModalHeader, Field, Section, FieldLabel, StepDots, EmptyNote, SavedToast,
         StatStrip, DateRangeBar, ReportCard } from "./ui/index.js";
```

- [ ] **Step 4: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

Run: `wc -l src/ui/*.jsx | sort -rn | head -3`
Expected: ninguno por encima de 350 líneas.

- [ ] **Step 5: Commit**

```bash
git add src/ui src/App.jsx
git commit -m "refactor: extrae primitivas de interfaz a src/ui"
```

---

### Task 5: Los tres stores de Zustand

La tarea de mayor riesgo: mueve estado, no solo código. Hazla completa antes de tocar pantallas.

**Files:**
- Create: `src/store/authStore.js`, `src/store/dataStore.js`, `src/store/calendarStore.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `supabase.js`, `googleCalendar.js`, `data/seed.js`
- Produces: los tres hooks descritos en la sección Arquitectura

- [ ] **Step 1: `src/store/authStore.js`**

```js
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  currentUser: null,
  authLoading: true,
  setCurrentUser: (currentUser) => set({ currentUser }),
  setAuthLoading: (authLoading) => set({ authLoading }),
}))
```

El efecto que escucha a Supabase (`auth.getSession`, `auth.onAuthStateChange`) **se queda en `App.jsx`** por ahora: necesita `navigate` del router. Solo llama a `setCurrentUser` en vez de al `useState`.

- [ ] **Step 2: `src/store/dataStore.js`**

Mueve las 12 colecciones con sus valores semilla iniciales, el `loadFromSupabase` (renombrado `loadAll`), y todos los `handle*` de `App()`, renombrados sin el prefijo (`handleAddChild` → `addChild`).

Patrón para cada mutación, conservando la semántica actual de actualizar el estado primero y persistir después:
```js
addChild: async (child, anamnesisDoc) => {
  set((s) => ({ children: [...s.children, child] }))
  try { await db.insertChild(child) } catch (e) { console.error('Add child:', e) }
  if (anamnesisDoc) {
    set((s) => ({ documents: [...s.documents, anamnesisDoc] }))
    try { await db.insertDocument(anamnesisDoc) } catch (e) { console.error('Add anamnesis doc:', e) }
  }
},
```

`loadAll` conserva íntegro el trato especial de `children`, que **no** cae a datos semilla con resultado vacío:
```js
set({ children: dbChildren })
if (dbObjectives.length > 0) set({ objectives: dbObjectives })
// ...el resto con su guarda de longitud, como está hoy
```
y termina con `set({ appLoading: false, dataLoaded: true })`.

- [ ] **Step 3: `src/store/calendarStore.js`**

Mueve `calendarEvents`, `gcalConnected`, `calendarLoading`, `calendarError`, `calendarDate`, la función `fetchCalendarEvents` y `handleConnectGcal`.

- [ ] **Step 4: Cablear `App.jsx` a los stores**

Reemplaza los `useState` correspondientes por lecturas del store. Las props que `App` pasa a las pantallas **se mantienen por ahora** — las pantallas se conectan en sus propias tareas. Esta tarea solo cambia de dónde salen los valores dentro de `App`.

- [ ] **Step 5: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

- [ ] **Step 6: Verificación manual — es obligatoria en esta tarea**

Levanta `npm run dev`, entra con `test@local.dev` (rol admin) y confirma: carga la lista de pacientes, abre una ficha, cambia de tab, y el panel de gabinete abre. Mover estado es donde se rompen cosas que el build no ve.

- [ ] **Step 7: Commit**

```bash
git add src/store src/App.jsx
git commit -m "refactor: mueve el estado global a stores de Zustand"
```

---

### Task 6: Shell de la aplicación

**Files:**
- Create: `src/shell/TopBar.jsx`, `src/shell/DriveSaveBar.jsx`, `src/shell/RouteStates.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `ui/`, `theme.js`, `store/authStore.js`
- Produces: `TopBar`, `DriveSaveBar`, y desde `RouteStates.jsx` los dos `RouteLoading` y `RouteNotFound`

- [ ] **Step 1: Mover los cuatro componentes**

`TopBar` lee `currentUser` del store en vez de recibirlo por prop. Los callbacks de navegación (`onHome`, `onBack`, `onGabinete`, `onLogout`) **siguen llegando por prop**: dependen del router, que vive en `App`.

- [ ] **Step 2: Importar en App.jsx y borrar las definiciones**

- [ ] **Step 3: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

- [ ] **Step 4: Commit**

```bash
git add src/shell src/App.jsx
git commit -m "refactor: extrae el shell de la aplicación"
```

---

### Task 7: Paneles de inicio

**Files:**
- Create: `src/home/SpecialistHome.jsx`, `ClinicalDirectorHome.jsx`, `TutorAiraHome.jsx`, `AdminDashboard.jsx`, `TodaySchedule.jsx`, `CalendarAgenda.jsx`, `ChildCard.jsx`, `ActivityFeed.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `ui/`, `store/dataStore.js`, `store/authStore.js`, `store/calendarStore.js`, `permissions.js`, `lib/`
- Produces: un `export default` por archivo

`ClinicalDirectorHome` son 390 líneas; si al moverla pasa de 350, sepárale `ActivityFeed` y los bloques de listado que ya sean componentes propios, y dilo en el reporte.

- [ ] **Step 1: Mover los 8 componentes**

Cada uno lee del store lo que hoy recibe por prop: `children`, `users`, `sessions`, `objectives`, `tutorReports`, `activityLog`, y el estado de calendario. **`onOpenChild` sigue llegando por prop** — depende del router.

Conserva la distinción entre los dos filtros que parecen iguales: `SpecialistHome` usa `visibleChildren(user, children)` (alcance) y `ClinicalDirectorHome` usa `misPacientesAsignados` (filtro personal). No las unifiques.

- [ ] **Step 2: Importar en App.jsx y borrar las definiciones**

- [ ] **Step 3: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

Run: `wc -l src/home/*.jsx | sort -rn | head -3`
Expected: ninguno por encima de 350.

- [ ] **Step 4: Commit**

```bash
git add src/home src/App.jsx
git commit -m "refactor: extrae los paneles de inicio por rol"
```

---

### Task 8: Ficha del paciente

La más grande: `ChildProfile` (354 líneas) más 7 tabs y sus modales.

**Files:**
- Create: `src/patient/ChildProfile.jsx`; `src/patient/tabs/` con `ResumenTab.jsx`, `SesionesTab.jsx`, `HistorialTab.jsx`, `ObjetivosTab.jsx` (contiene `ObjectivesList`), `PlanTrabajoTab.jsx`, `AnamnesisTab.jsx`, `ReportesTab.jsx`, `InterdisciplinaryTab.jsx`; `src/patient/modals/` con `SessionWizard.jsx`, `EditSessionModal.jsx`, `DailyReport.jsx` (contiene `DailyReport` y `DailyReportModal`), `AddDocumentModal.jsx`, `AddMeetingModal.jsx`, `FullHistoryModal.jsx`, `EvolutionReportModal.jsx`, `ParentReportModal.jsx`; `src/patient/DocumentsSection.jsx`, `src/patient/MeetingCard.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `ui/`, stores, `permissions.js`, `lib/`
- Produces: `export default ChildProfile` y los demás por archivo

`AnamnesisTab` son 292 líneas y es el tab más grande; si al moverlo pasa de 350, sepárale el formulario y dilo en el reporte.

- [ ] **Step 1: Mover los tabs y sus modales**

Cada tab lee del store lo que hoy recibe: `sessions`, `objectives`, `documents`, `users`, `meetings`, `parentReports`, `currentUser`, y las mutaciones. **`child` sigue llegando por prop** desde `ChildProfile`, que lo resuelve del parámetro de ruta.

`ChildProfile` conserva su `useSearchParams` para el tab activo — es estado de URL, no de store. Mueve con él `CHILD_TABS` y `DEFAULT_CHILD_TAB`, que hoy están en el scope de módulo de `App.jsx`: pertenecen a este archivo.

- [ ] **Step 2: Mover `ChildProfile`**

Los `useState` de modales (`wizardOpen`, `viewingReport`, `fullHistoryOpen`, `evolutionOpen`, `parentReportOpen`, `editingProfile`) se quedan como estado local aquí. Hoy varios viven en `App()`; **bájalos a `ChildProfile`**, que es donde se usan. Es el único cambio estructural permitido en esta tarea, y lo permito porque mantenerlos en `App` obligaría a pasarlos por props a través de la frontera de archivos que estamos creando.

- [ ] **Step 3: Importar en App.jsx y borrar las definiciones**

- [ ] **Step 4: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

- [ ] **Step 5: Verificación manual — obligatoria**

Con `test@local.dev`: abre una ficha, recorre los 7 tabs, abre el asistente de sesión, abre un reporte diario, y verifica que `?tab=` sigue cambiando en la URL y que recargar la página mantiene el tab.

- [ ] **Step 6: Commit**

```bash
git add src/patient src/App.jsx
git commit -m "refactor: extrae la ficha del paciente, sus tabs y modales"
```

---

### Task 9: Gabinete, consentimiento y alta de pacientes

**Files:**
- Create: `src/gabinete/GabinetePanel.jsx`; `src/consent/FirmaConsentimientoPublic.jsx` y `src/consent/SignaturePad.jsx`; `src/patients/AddPatientWizard.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `ui/`, stores, `supabase.js`
- Produces: un `export default` por archivo

- [ ] **Step 1: Mover los cuatro componentes**

`GabinetePanel` (232 líneas) lee `schools`, `users`, `gabineteSessions` y sus mutaciones del store.

`FirmaConsentimientoPublic` **no usa stores**: es la ruta pública sin sesión iniciada, y habla directo con `supabase.js`. Déjala así.

- [ ] **Step 2: Importar en App.jsx y borrar las definiciones**

- [ ] **Step 3: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

- [ ] **Step 4: Commit**

```bash
git add src/gabinete src/consent src/patients src/App.jsx
git commit -m "refactor: extrae gabinete, consentimiento y alta de pacientes"
```

---

### Task 10: Adelgazar `App.jsx`

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: todo lo anterior
- Produces: un `App` que solo enruta y provee

- [ ] **Step 1: Revisar qué quedó**

Run: `grep -n "^function \|^const [A-Z]" src/App.jsx`
Expected: nada, o solo componentes de ruta muy pequeños. Si queda algo grande sin mover, muévelo a la carpeta que le corresponda y dilo en el reporte.

- [ ] **Step 2: Dejar en App.jsx solo esto**

El efecto de autenticación de Supabase, la ruta pública de `?firmar=`, las guardas de carga y de sesión, el `<Routes>` con sus rutas, y el efecto que dispara `loadAll` al iniciar sesión. Nada más.

- [ ] **Step 3: Verificar tamaño**

Run: `wc -l src/App.jsx`
Expected: por debajo de 150 líneas.

Run: `wc -l src/**/*.jsx src/*.jsx | sort -rn | head -5`
Expected: ningún archivo por encima de 350 líneas.

- [ ] **Step 4: Verificar**

Run: `npx vite build && npm test`
Expected: build correcto, 44 pruebas.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: App.jsx queda como router y providers"
```

---

## Definición de terminado

- `wc -l src/App.jsx` por debajo de 150.
- Ningún archivo de `src/` por encima de 350 líneas.
- `npm test` pasa con 44 pruebas.
- `npx vite build` compila.
- Repaso manual completo: iniciar sesión, los 4 paneles por rol, abrir una ficha y recorrer sus 7 tabs, el asistente de sesión, el panel de gabinete, y el enlace público de consentimiento.
- `grep -c "base64" src/App.jsx` devuelve `0`.

## Fuera de alcance

- **Cualquier cambio visual.** El rediseño viene después, sobre esta estructura.
- Arreglar bugs encontrados al mover. Se anotan, no se tocan.
- Las fases 2 a 4 de roles y permisos.
- Pruebas de interfaz.
