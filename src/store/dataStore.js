import { create } from 'zustand'
import { db } from '../supabase.js'
import { TODAY } from '../theme.js'
import { useAuthStore } from './authStore.js'
import {
  seedUsers, seedChildren, seedObjectives, seedSessions, seedDocuments, seedMeetings,
  seedParentReports, seedTutors, seedSchools, seedGabineteSessions, seedTutorReports,
} from '../data/seed.js'

// Datos clinicos y sus mutaciones.
//
// Cada mutacion actualiza el estado primero y persiste despues, tragandose el
// error de red: es el comportamiento que ya tenia la app y se conserva tal cual.
// Si Supabase falla, la interfaz queda adelantada respecto a la base — esta
// anotado como deuda conocida, no se corrige en este refactor.
//
// El id del usuario actual se lee del store de sesion cuando hace falta.
// Zustand permite ese acceso puntual fuera de React; Context no.
export const useDataStore = create((set, get) => ({
  children: seedChildren,
  users: seedUsers,
  objectives: seedObjectives,
  sessions: seedSessions,
  documents: seedDocuments,
  meetings: seedMeetings,
  parentReports: seedParentReports,
  // Sin semilla: los reportes de evolucion guardados son historia real del
  // expediente y no hay version de demostracion que tenga sentido inventar.
  evolutionReports: [],
  tutors: seedTutors,
  schools: seedSchools,
  gabineteSessions: seedGabineteSessions,
  tutorReports: seedTutorReports,
  activityLog: [],
  rolesDisponibles: [],

  appLoading: false,
  // Distinto de appLoading: sigue en false hasta que la primera carga termina.
  // /paciente/:id lo necesita para distinguir "paciente no encontrado" de "los
  // datos aun no llegan", porque `children` arranca con datos semilla.
  dataLoaded: false,

  loadAll: async (role, userId) => {
    set({ appLoading: true })
    try {
      const [
        dbChildren, dbObjectives, dbSessions, dbDocuments,
        dbMeetings, dbSchools, dbGabineteSessions, dbTutorReports,
        dbEvolutionReports,
      ] = await Promise.all([
        db.getChildren(), db.getObjectives(), db.getSessions(), db.getDocuments(),
        db.getMeetings(), db.getSchools(), db.getGabineteSessions(), db.getTutorReports(),
        db.getEvolutionReports(),
      ])
      // Incondicional, a diferencia de las demas: ahora que RLS aplica el
      // alcance del rol, un resultado vacio es una respuesta real ("este
      // especialista no tiene pacientes"). Caer a datos semilla ahi le
      // mostraria todos los de demostracion en vez de ninguno.
      set({ children: dbChildren })
      if (dbObjectives.length > 0) set({ objectives: dbObjectives })
      if (dbSessions.length > 0) set({ sessions: dbSessions })
      if (dbDocuments.length > 0) set({ documents: dbDocuments })
      if (dbMeetings.length > 0) set({ meetings: dbMeetings })
      if (dbSchools.length > 0) set({ schools: dbSchools })
      if (dbGabineteSessions.length > 0) set({ gabineteSessions: dbGabineteSessions })
      if (dbTutorReports.length > 0) set({ tutorReports: dbTutorReports })
      // Incondicional: sin semilla, un resultado vacio es la verdad.
      set({ evolutionReports: dbEvolutionReports })
    } catch (e) {
      console.error('Supabase load error:', e)
    } finally {
      set({ appLoading: false, dataLoaded: true })
    }
  },

  // Los tutores sombra trabajan sobre datos semilla: no hay nada que esperar.
  markLoaded: () => set({ dataLoaded: true }),

  markActivitySeen: () => set((s) => ({ activityLog: s.activityLog.map((a) => ({ ...a, seen: true })) })),

  // Devuelve la sesion creada para que quien la llame decida que hacer con la
  // interfaz (cerrar el asistente, mostrar el aviso). El store no sabe de eso.
  saveSession: (payload) => {
    const { objectives, children } = get()
    const newObjectives = (payload._newObjectiveNames || []).map((name, i) => ({
      id: `obj-${Date.now()}-${i}`,
      childId: payload.childId,
      name,
      area: payload.specialty,
      createdDate: payload.date,
      specialistId: payload.specialistId,
      status: 'proceso',
    }))
    if (newObjectives.length) set({ objectives: [...objectives, ...newObjectives] })

    // Remapea los ids temporales "new-i" de objectivesWorked a los ids reales.
    const remappedObjectivesWorked = payload.objectivesWorked.map((ow) => {
      if (String(ow.objectiveId).startsWith('new-')) {
        const idx = parseInt(String(ow.objectiveId).split('-')[1], 10)
        return { ...ow, objectiveId: newObjectives[idx]?.id || ow.objectiveId }
      }
      return ow
    })
    // Vuelca el estado de desempeno sobre los registros de objetivo.
    set((s) => ({
      objectives: s.objectives.map((o) => {
        const match = remappedObjectivesWorked.find((ow) => ow.objectiveId === o.id)
        return match ? { ...o, status: match.status } : o
      }),
    }))

    const newSession = {
      id: `s-${Date.now()}`,
      childId: payload.childId,
      specialistId: payload.specialistId,
      specialty: payload.specialty,
      date: payload.date,
      duration: payload.duration,
      objectivesWorked: remappedObjectivesWorked,
      activities: payload.activities,
      observation: payload.observation,
      nextSteps: payload.nextSteps,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ sessions: [...s.sessions, newSession] }))

    const child = children.find((c) => c.id === newSession.childId)
    set((s) => ({
      activityLog: [{
        id: `act-${Date.now()}`, type: 'session', timestamp: new Date().toISOString(),
        specialistId: newSession.specialistId, childId: newSession.childId,
        childName: child ? `${child.name} ${child.lastName}` : 'Paciente',
        description: 'Sesión registrada',
        seen: false,
      }, ...s.activityLog],
    }))
    try { db.insertSession(newSession) } catch (e) { console.error('Save session:', e) }
    return newSession
  },

  updateChild: async (childId, updates) => {
    set((s) => ({
      children: s.children.map((c) => {
        if (c.id !== childId) return c
        const updated = { ...c, ...updates }
        if (updates.parentContact) updated.parentContact = updates.parentContact
        return updated
      }),
    }))
    try { await db.updateChild(childId, updates) } catch (e) { console.error('Update child:', e) }
  },

  updateSession: async (session) => {
    set((s) => ({ sessions: s.sessions.map((x) => (x.id === session.id ? session : x)) }))
    try { await db.updateSession(session) } catch (e) { console.error('Update session:', e) }
  },

  updateDocument: async (doc) => {
    set((s) => ({ documents: s.documents.map((d) => (d.id === doc.id ? doc : d)) }))
    try { await db.updateDocument(doc) } catch (e) { console.error('Update document:', e) }
  },

  closeProcess: async (childId, note, objectives, totalSessions) => {
    const currentUser = useAuthStore.getState().currentUser
    const child = get().children.find((c) => c.id === childId)
    if (!child) return
    // Crea el documento de cierre (Reporte de Logros).
    const doc = {
      id: `d-close-${Date.now()}`,
      childId,
      type: 'reporte',
      title: 'Reporte de Logros - Cierre de Proceso',
      date: TODAY,
      authorId: currentUser.id,
      notes: note || 'Proceso cerrado con objetivos alcanzados.',
      fields: {
        totalSessions,
        objectives: objectives.map((o) => ({ name: o.name, status: o.status })),
        closedBy: currentUser.name,
        closedDate: TODAY,
      },
    }
    set((s) => ({ documents: [doc, ...s.documents] }))
    set((s) => ({
      activityLog: [{
        id: `act-${Date.now()}`, type: 'document', timestamp: new Date().toISOString(),
        specialistId: currentUser.id, childId,
        childName: `${child.name} ${child.lastName}`,
        description: 'Reporte de Logros generado - Cierre de proceso',
        seen: false,
      }, ...s.activityLog],
    }))
    try { await db.insertDocument(doc) } catch (e) { console.error('Close process:', e) }
  },

  renewPackage: async (childId) => {
    const today = TODAY
    // Se calcula ANTES del set para que el numero que va al estado y el que va a
    // la base salgan del mismo valor. La version anterior leia el estado previo
    // desde el closure del render y sumaba uno por separado en cada sitio:
    // coincidian, pero por casualidad de orden, no por construccion.
    const child = get().children.find((c) => c.id === childId)
    if (!child) return
    const packageNum = (child.packageNum || 1) + 1
    set((s) => ({
      children: s.children.map((c) => (c.id === childId ? { ...c, packageStart: today, packageNum } : c)),
    }))
    try { await db.updateChild(childId, { packageStart: today, packageNum }) } catch (e) { console.error('Renew package:', e) }
  },

  updateObjective: async (updated) => {
    set((s) => ({ objectives: s.objectives.map((o) => (o.id === updated.id ? updated : o)) }))
    try { await db.upsertObjective(updated) } catch (e) { console.error('Update objective:', e) }
  },

  addObjective: async (obj) => {
    const newObj = { id: `o-${Date.now()}`, ...obj }
    set((s) => ({ objectives: [...s.objectives, newObj] }))
    try { await db.upsertObjective(newObj) } catch (e) { console.error('Add objective:', e) }
  },

  deleteObjective: async (id) => {
    set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id) }))
    try { await db.deleteObjective(id) } catch (e) { console.error('Delete objective:', e) }
  },

  // childId llega explicito: antes se leia de `selectedChildId` en el scope de
  // App(), que ya no existe una vez repartidos los componentes.
  addDocument: (childId, doc) => {
    const currentUser = useAuthStore.getState().currentUser
    set((s) => ({ documents: [...s.documents, { id: `doc-${Date.now()}`, childId, authorId: currentUser.id, ...doc }] }))
  },

  addMeeting: (childId, meeting) => {
    const currentUser = useAuthStore.getState().currentUser
    set((s) => ({ meetings: [...s.meetings, { id: `mtg-${Date.now()}`, childId, createdBy: currentUser.id, ...meeting }] }))
  },

  // La tabla parent_reports no la consume supabase.js todavia: el reporte se
  // genera y se guarda solo en memoria, igual que antes del refactor.
  // Guarda el reporte de evolucion en el expediente. El Historial Clinico pide
  // el listado de los generados, asi que si no se persiste esa seccion nunca
  // tendria contenido.
  guardarReporteEvolucion: async (reporte) => {
    const fila = { id: `er-${Date.now()}`, ...reporte }
    set((s) => ({ evolutionReports: [fila, ...s.evolutionReports] }))
    try { await db.insertEvolutionReport(fila) }
    catch (e) { console.error('Guardar reporte de evolucion:', e) }
    return fila
  },

  addParentReport: (report) => {
    set((s) => ({ parentReports: [...s.parentReports, { id: `pr-${Date.now()}`, ...report }] }))
  },

  // Los especialistas son filas de la misma tabla `users` que ya se carga al
  // inicio, asi que la pantalla de gestion recarga esa lista tras cada cambio.
  recargarUsuarios: async () => {
    try { set({ users: await db.getUsers() }) } catch (e) { console.error('Reload users:', e) }
  },

  updateUser: async (id, updates) => {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)) }))
    try { await db.updateUser(id, updates) } catch (e) {
      console.error('Update user:', e)
      // A diferencia de las demas mutaciones, aqui se revierte: un cambio de rol
      // que la base rechazo y la interfaz muestra como aplicado es enganoso.
      await get().recargarUsuarios()
      throw e
    }
  },

  crearEspecialista: async (datos) => {
    const res = await db.crearEspecialista(datos)
    await get().recargarUsuarios()
    return res
  },

  // ── Roles ──────────────────────────────────────────────────────────────
  // Se cargan bajo demanda: solo los necesita la pantalla de administracion,
  // y meterlos en loadAll haria una consulta mas en cada inicio de sesion.
  cargarRoles: async () => {
    try { set({ rolesDisponibles: await db.getRoles() }) }
    catch (e) { console.error('Load roles:', e); throw e }
  },

  guardarRol: async (rol, esNuevo) => {
    if (esNuevo) await db.insertRole(rol)
    else await db.updateRole(rol.id, rol)
    await db.setRolePermissions(rol.id, rol.permisos)
    await get().cargarRoles()
  },

  borrarRol: async (id) => {
    await db.deleteRole(id)
    await get().cargarRoles()
  },

  addTutorReport: async (report) => {
    set((s) => ({ tutorReports: [...s.tutorReports, report] }))
    try { await db.insertTutorReport(report) } catch (e) { console.error('Add tutor report:', e) }
  },

  addGabineteSession: async (session) => {
    set((s) => ({ gabineteSessions: [...s.gabineteSessions, session] }))
    try { await db.insertGabineteSession(session) } catch (e) { console.error('Add gabinete session:', e) }
  },

  addSchool: async (school) => {
    set((s) => ({ schools: [...s.schools, school] }))
    try { await db.insertSchool(school) } catch (e) { console.error('Add school:', e) }
  },

  addChild: async (child, anamnesisDoc) => {
    set((s) => ({ children: [...s.children, child] }))
    try { await db.insertChild(child) } catch (e) { console.error('Add child:', e) }
    if (anamnesisDoc) {
      set((s) => ({ documents: [...s.documents, anamnesisDoc] }))
      try { await db.insertDocument(anamnesisDoc) } catch (e) { console.error('Add anamnesis doc:', e) }
    }
  },
}))
