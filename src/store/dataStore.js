import { create } from 'zustand'
import { db } from '../supabase.js'
import { TODAY } from '../theme.js'
import { useAuthStore } from './authStore.js'
import { avisar } from './avisosStore.js'
// Sin datos semilla. La aplicacion arranca vacia y se llena con lo que hay en
// la base.
//
// Se retiraron porque presentaban informacion inventada como si fuera del
// expediente: el panel de gabinete mostraba un "Colegio Ejemplo" que nadie
// podia borrar porque no existia, y la lista de especialistas mostraba al
// equipo SIN CORREO — los nombres de la semilla coinciden con los reales, pero
// la semilla no trae direcciones, asi que el boton de enviar acceso salia
// desactivado para todo el mundo.
//
// En un sistema con expedientes clinicos de menores, un dato de demostracion
// indistinguible de uno real no es una comodidad de desarrollo: es un riesgo.

// Datos clinicos y sus mutaciones.
//
// Cada mutacion actualiza el estado primero y persiste despues. Cuando la
// escritura falla se AVISA: el fallo sale por avisosStore, el mismo canal que
// usan los formularios, y la aplicacion lo muestra en un toast que no se va
// solo hasta que el usuario lo descarta.
//
// Antes se tragaba el error con un console.error y la pantalla seguia mostrando
// el dato recien creado. Asi se perdio la primera escuela de gabinete con su
// estudiante: todo el trabajo parecia guardado y al refrescar no existia nada.
// Una interfaz adelantada respecto a la base no es un desfase tecnico, es
// decirle al usuario que su trabajo esta a salvo cuando no lo esta.
//
// El id del usuario actual se lee del store de sesion cuando hace falta.
// Zustand permite ese acceso puntual fuera de React; Context no.
export const useDataStore = create((set, get) => ({
  children: [],
  users: [],
  objectives: [],
  sessions: [],
  documents: [],
  meetings: [],
  parentReports: [],
  // Sin semilla: los reportes de evolucion guardados son historia real del
  // expediente y no hay version de demostracion que tenga sentido inventar.
  evolutionReports: [],
  estudiantesGabinete: [],
  tutores: [],
  tamizajes: [],
  tutors: [],
  schools: [],
  gabineteSessions: [],
  tutorReports: [],
  activityLog: [],
  rolesDisponibles: [],

  // Una escritura que la base rechazo va al canal de avisos, el mismo por el
  // que los formularios sacan sus errores de validacion: para el usuario es el
  // mismo hecho — algo no se guardo — y verlo en dos sitios distintos segun de
  // donde venga el fallo no ayuda a nadie.
  avisarFallo: (que, e) => avisar.error(que, e instanceof Error ? e : new Error(String(e))),

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
        dbEvolutionReports, dbEstudiantes, dbTutores, dbTamizajes, dbUsers,
      ] = await Promise.all([
        db.getChildren(), db.getObjectives(), db.getSessions(), db.getDocuments(),
        db.getMeetings(), db.getSchools(), db.getGabineteSessions(), db.getTutorReports(),
        db.getEvolutionReports(), db.getEstudiantesGabinete(), db.getTutores(),
        db.getTamizajes(), db.getUsers(),
      ])
      // Incondicional, a diferencia de las demas: ahora que RLS aplica el
      // alcance del rol, un resultado vacio es una respuesta real ("este
      // especialista no tiene pacientes"). Caer a datos semilla ahi le
      // mostraria todos los de demostracion en vez de ninguno.
      set({ children: dbChildren })
      // Los usuarios no se cargaban aqui: la pantalla de especialistas mostraba
      // la semilla, que no trae correo, y por eso el equipo entero salia "sin
      // correo" con el boton de enviar acceso desactivado.
      set({
        users: dbUsers,
        objectives: dbObjectives,
        sessions: dbSessions,
        documents: dbDocuments,
        meetings: dbMeetings,
        schools: dbSchools,
        gabineteSessions: dbGabineteSessions,
        tutorReports: dbTutorReports,
      })
      // Incondicional: sin semilla, un resultado vacio es la verdad.
      set({
        evolutionReports: dbEvolutionReports,
        estudiantesGabinete: dbEstudiantes,
        tutores: dbTutores,
        tamizajes: dbTamizajes,
      })
    } catch (e) { get().avisarFallo('Supabase load error', e) } finally {
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
      attendance: payload.attendance || 'asistio',
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
    try { db.insertSession(newSession) } catch (e) { get().avisarFallo('Save session', e) }
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
    try { await db.updateChild(childId, updates) } catch (e) { get().avisarFallo('Update child', e) }
  },

  updateSession: async (session) => {
    set((s) => ({ sessions: s.sessions.map((x) => (x.id === session.id ? session : x)) }))
    try { await db.updateSession(session) } catch (e) { get().avisarFallo('Update session', e) }
  },

  updateDocument: async (doc) => {
    set((s) => ({ documents: s.documents.map((d) => (d.id === doc.id ? doc : d)) }))
    try { await db.updateDocument(doc) } catch (e) { get().avisarFallo('Update document', e) }
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
    try { await db.insertDocument(doc) } catch (e) { get().avisarFallo('Close process', e) }
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
    try { await db.updateChild(childId, { packageStart: today, packageNum }) } catch (e) { get().avisarFallo('Renew package', e) }
  },

  updateObjective: async (updated) => {
    set((s) => ({ objectives: s.objectives.map((o) => (o.id === updated.id ? updated : o)) }))
    try { await db.upsertObjective(updated) } catch (e) { get().avisarFallo('Update objective', e) }
  },

  addObjective: async (obj) => {
    const newObj = { id: `o-${Date.now()}`, ...obj }
    set((s) => ({ objectives: [...s.objectives, newObj] }))
    try { await db.upsertObjective(newObj) } catch (e) { get().avisarFallo('Add objective', e) }
  },

  deleteObjective: async (id) => {
    set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id) }))
    try { await db.deleteObjective(id) } catch (e) { get().avisarFallo('Delete objective', e) }
  },

  // childId llega explicito: antes se leia de `selectedChildId` en el scope de
  // App(), que ya no existe una vez repartidos los componentes.
  // Documento del expediente de un paciente: anamnesis, plan de trabajo, lo que
  // se suba a Documentos.
  //
  // Solo escribia en memoria. Era la unica alta de documento que no llamaba a
  // la base — sus tres hermanas de gabinete si lo hacian — asi que todo lo que
  // se llenaba desde la ficha se veia guardado y desaparecia en la siguiente
  // carga. Los ocho documentos de anamnesis que hay en la base entraron por
  // addChild, que persiste por su cuenta; nada de lo escrito despues sobrevivia.
  addDocument: async (childId, doc) => {
    const currentUser = useAuthStore.getState().currentUser
    const fila = { id: `doc-${Date.now()}`, childId, authorId: currentUser.id, ...doc }
    set((s) => ({ documents: [...s.documents, fila] }))
    try { await db.insertDocument(fila) }
    catch (e) { get().avisarFallo('Guardar documento', e) }
    return fila
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
    catch (e) { get().avisarFallo('Guardar reporte de evolucion', e) }
    return fila
  },

  addParentReport: (report) => {
    set((s) => ({ parentReports: [...s.parentReports, { id: `pr-${Date.now()}`, ...report }] }))
  },

  // Los especialistas son filas de la misma tabla `users` que ya se carga al
  // inicio, asi que la pantalla de gestion recarga esa lista tras cada cambio.
  recargarUsuarios: async () => {
    try { set({ users: await db.getUsers() }) } catch (e) { get().avisarFallo('Reload users', e) }
  },

  updateUser: async (id, updates) => {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)) }))
    try { await db.updateUser(id, updates) } catch (e) {
      get().avisarFallo('Actualizar usuario', e)
      // A diferencia de las demas mutaciones, aqui se revierte: un cambio de rol
      // que la base rechazo y la interfaz muestra como aplicado es enganoso.
      await get().recargarUsuarios()
      throw e
    }
  },

  enviarInvitacion: async (id, opciones) => {
    const res = await db.enviarInvitacion(id, opciones)
    // La marca de "debe cambiarla" cambia en la base; sin recargar, la lista
    // seguiria diciendo lo de antes hasta el proximo refresco.
    if (opciones?.claveTemporal) await get().recargarUsuarios()
    return res
  },

  cambiarCorreo: async (id, email) => {
    const res = await db.cambiarCorreo(id, email)
    await get().recargarUsuarios()
    return res
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
    try { await db.insertTutorReport(report) } catch (e) { get().avisarFallo('Add tutor report', e) }
  },

  addGabineteSession: async (session) => {
    set((s) => ({ gabineteSessions: [...s.gabineteSessions, session] }))
    try { await db.insertGabineteSession(session) } catch (e) { get().avisarFallo('Add gabinete session', e) }
  },

  guardarEstudianteGabinete: async (est) => {
    const fila = { id: est.id || `ge-${Date.now()}`, ...est }
    set((s) => ({
      estudiantesGabinete: s.estudiantesGabinete.some((x) => x.id === fila.id)
        ? s.estudiantesGabinete.map((x) => (x.id === fila.id ? fila : x))
        : [...s.estudiantesGabinete, fila],
    }))
    try { await db.upsertEstudianteGabinete(fila) } catch (e) { get().avisarFallo('Guardar estudiante de gabinete', e); throw e }
    return fila
  },

  borrarEstudianteGabinete: async (id) => {
    set((s) => ({
      estudiantesGabinete: s.estudiantesGabinete.filter((x) => x.id !== id),
      documents: s.documents.filter((x) => x.studentId !== id),
    }))
    try { await db.deleteEstudianteGabinete(id) } catch (e) { get().avisarFallo('Borrar estudiante de gabinete', e); throw e }
  },

  guardarTamizaje: async (t) => {
    const fila = { id: t.id || `tz-${Date.now()}`, ...t }
    set((s) => ({
      tamizajes: s.tamizajes.some((x) => x.id === fila.id)
        ? s.tamizajes.map((x) => (x.id === fila.id ? fila : x))
        : [fila, ...s.tamizajes],
    }))
    try { await db.upsertTamizaje(fila) } catch (e) { get().avisarFallo('Guardar tamizaje', e); throw e }
    return fila
  },

  // Abre el expediente clinico de un estudiante derivado y los enlaza.
  //
  // Es la accion que cierra el punto 4 del programa: sin ella, "derivado al
  // centro" es una etiqueta que alguien tiene que recordar convertir en un alta
  // de paciente, y el aviso de "derivados sin expediente" no tendria como
  // resolverse desde la pantalla donde aparece.
  abrirExpedienteDeEstudiante: async (studentId) => {
    const est = get().estudiantesGabinete.find((e) => e.id === studentId)
    if (!est) throw new Error('No se encontró el estudiante')
    if (est.childId) return est.childId

    const id = `c-${Date.now().toString(36)}`
    const paciente = {
      id, name: est.name, lastName: est.lastName || '',
      birthDate: null, admissionDate: new Date().toISOString().slice(0, 10),
      specialties: [], assignedSpecialists: [], status: 'activo',
      parentContact: {}, packageNum: 1,
      // Queda escrito de donde viene: en el expediente clinico importa saber
      // que el caso entro por el tamizaje del colegio y no por consulta directa.
      referralReason: `Derivado desde el programa de preescolar${est.nivel ? ` (${est.nivel})` : ''}.`,
    }
    set((s) => ({ children: [...s.children, paciente] }))
    try { await db.insertChild(paciente) } catch (e) { get().avisarFallo('Abrir expediente del estudiante', e); throw e }
    await get().guardarEstudianteGabinete({ ...est, childId: id })
    return id
  },

  guardarTutor: async (t) => {
    const fila = { id: t.id || `tu-${Date.now()}`, ...t }
    set((s) => ({
      tutores: s.tutores.some((x) => x.id === fila.id)
        ? s.tutores.map((x) => (x.id === fila.id ? fila : x))
        : [...s.tutores, fila],
    }))
    try { await db.upsertTutor(fila) } catch (e) { get().avisarFallo('Guardar tutor', e); throw e }
    return fila
  },

  // Documento que cuelga de una terapeuta y no de un colegio ni de un
  // estudiante: su contrato es suyo, y con varias terapeutas por centro un
  // contrato guardado contra el colegio no dice de quien es.
  agregarDocumentoDeTerapeuta: async (tutorId, doc) => {
    const autor = useAuthStore.getState().currentUser?.id || null
    const fila = { id: `d-${Date.now()}`, tutorId, childId: null, schoolId: null, studentId: null, authorId: autor, ...doc }
    set((s) => ({ documents: [fila, ...s.documents] }))
    try { await db.insertDocument(fila) }
    catch (e) { get().avisarFallo('Guardar el contrato de la terapeuta', e); throw e }
    return fila
  },

  // Documento del expediente de un estudiante de gabinete.
  agregarDocumentoDeEstudiante: async (studentId, doc) => {
    const autor = useAuthStore.getState().currentUser?.id || null
    const fila = { id: `d-${Date.now()}`, studentId, childId: null, schoolId: null, authorId: autor, ...doc }
    set((s) => ({ documents: [fila, ...s.documents] }))
    try { await db.insertDocument(fila) }
    catch (e) { get().avisarFallo('Documento de estudiante', e) }
    return fila
  },

  borrarColegio: async (id) => {
    set((s) => ({
      schools: s.schools.filter((x) => x.id !== id),
      gabineteSessions: s.gabineteSessions.filter((x) => x.schoolId !== id),
      estudiantesGabinete: s.estudiantesGabinete.filter((x) => x.schoolId !== id),
      documents: s.documents.filter((x) => x.schoolId !== id),
    }))
    try { await db.deleteSchool(id) } catch (e) { get().avisarFallo('Borrar colegio', e); throw e }
  },

  // Documento que cuelga de un colegio y no de un paciente. addDocument exige
  // childId y le pone el autor de la sesion; aqui el dueño es el colegio.
  agregarDocumentoDeColegio: async (schoolId, doc) => {
    const autor = useAuthStore.getState().currentUser?.id || null
    const fila = { id: `d-${Date.now()}`, schoolId, childId: null, authorId: autor, ...doc }
    set((s) => ({ documents: [fila, ...s.documents] }))
    try { await db.insertDocument(fila) }
    catch (e) { get().avisarFallo('Documento de colegio', e) }
    return fila
  },

  // Propaga el fallo ademas de avisarlo. Quien llama necesita saberlo: el panel
  // confirma "escuela guardada" y adjunta el contrato despues, y las dos cosas
  // estarian mintiendo si el insert se hubiera perdido por el camino.
  addSchool: async (school) => {
    set((s) => ({ schools: [...s.schools, school] }))
    try { await db.insertSchool(school) }
    catch (e) { get().avisarFallo('Guardar colegio', e); throw e }
  },

  // Borrar paciente. El estado local se limpia igual que la cascada de la base:
  // si se quitara solo de `children`, las sesiones y objetivos del paciente
  // borrado seguirian contando en los totales de la pantalla hasta recargar.
  borrarPaciente: async (id) => {
    set((s) => ({
      children: s.children.filter((x) => x.id !== id),
      sessions: s.sessions.filter((x) => x.childId !== id),
      objectives: s.objectives.filter((x) => x.childId !== id),
      documents: s.documents.filter((x) => x.childId !== id),
      meetings: s.meetings.filter((x) => x.childId !== id),
      evolutionReports: s.evolutionReports.filter((x) => x.childId !== id),
      tutorReports: s.tutorReports.filter((x) => x.childId !== id),
      estudiantesGabinete: s.estudiantesGabinete.map((x) =>
        x.childId === id ? { ...x, childId: null } : x),
    }))
    try { await db.deleteChild(id) } catch (e) { get().avisarFallo('Borrar paciente', e); throw e }
  },

  addChild: async (child, anamnesisDoc) => {
    set((s) => ({ children: [...s.children, child] }))
    try { await db.insertChild(child) } catch (e) { get().avisarFallo('Add child', e) }
    if (anamnesisDoc) {
      set((s) => ({ documents: [...s.documents, anamnesisDoc] }))
      try { await db.insertDocument(anamnesisDoc) } catch (e) { get().avisarFallo('Add anamnesis doc', e) }
    }
  },
}))
