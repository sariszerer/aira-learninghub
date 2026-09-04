import { createClient } from '@supabase/supabase-js'
import { buildUser } from './permissions.js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wxsxtevvxepgjfxphdxt.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4c3h0ZXZ2eGVwZ2pmeHBoZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzQ5NDcsImV4cCI6MjEwMjQxMDk0N30.AlyZM8R9wMCYBaTvYV6QfDSJC5Y5l2m46OZ43P2Im0Y'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const auth = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

export async function getAppUser(authUserId) {
  // Trae el rol y sus permisos en la misma consulta. Si la fila no tiene
  // role_id todavia, buildUser cae a la matriz del codigo: durante la
  // transicion las dos fuentes conviven y la de codigo es el respaldo.
  const { data, error } = await supabase
    .from('users')
    .select('*, roles(*, role_permissions(permission_key))')
    .eq('auth_id', authUserId)
    .single()
  if (error) return null
  // buildUser adjunta permisos y alcance desde la matriz en código. En la Fase 2
  // esto pasa a leerse de las tablas roles/role_permissions.
  return buildUser(dbUserToApp(data), data.roles)
}

export function dbUserToApp(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    specialty: u.specialty, title: u.title, avatarBg: u.avatar_bg,
    school: u.school, assignedChildId: u.assigned_child_id, authId: u.auth_id,
    activo: u.activo !== false,
  }
}
export function dbRoleToApp(r) {
  return {
    id: r.id, nombre: r.nombre, scope: r.scope, home: r.home,
    esClinico: !!r.es_clinico, etiqueta: r.etiqueta, color: r.color,
    esSistema: !!r.es_sistema,
    permisos: (r.role_permissions || []).map((rp) => rp.permission_key),
  }
}
export function dbChildToApp(c) {
  return {
    id: c.id, name: c.name, lastName: c.last_name, birthDate: c.birth_date,
    admissionDate: c.admission_date, specialties: c.specialties || [],
    assignedSpecialists: c.assigned_specialists || [], avatarBg: c.avatar_bg,
    // La columna existe desde siempre y nunca se mapeaba: la app trataba a los
    // 44 pacientes como si no tuvieran estado.
    status: c.status,
    nextSession: c.next_session, nextSessionTime: c.next_session_time,
    parentContact: c.parent_contact || {}, packageStart: c.package_start,
    packageNum: c.package_num || 1,
    age: c.birth_date ? Math.floor((new Date() - new Date(c.birth_date)) / (365.25*86400000)) : null,
  }
}
export function dbObjectiveToApp(o) {
  return { id: o.id, childId: o.child_id, name: o.name, area: o.area,
    status: o.status, specialistId: o.specialist_id, createdDate: o.created_date }
}
export function dbSessionToApp(s) {
  return { id: s.id, childId: s.child_id, specialistId: s.specialist_id,
    specialty: s.specialty, date: s.date, duration: s.duration,
    objectivesWorked: s.objectives_worked || [], activities: s.activities || [],
    observation: s.observation, nextSteps: s.next_steps, createdAt: s.created_at }
}
export function dbDocumentToApp(d) {
  return { id: d.id, childId: d.child_id, type: d.type, title: d.title,
    date: d.date, authorId: d.author_id, notes: d.notes, fields: d.fields || {} }
}
export function dbMeetingToApp(m) {
  return { id: m.id, childId: m.child_id, date: m.date, type: m.type,
    participants: m.participants, summary: m.summary, agreements: m.agreements, createdBy: m.created_by }
}
export function dbSchoolToApp(s) {
  return { id: s.id, name: s.name, contact: s.contact, phone: s.phone, email: s.email,
    contractStart: s.contract_start, contractEnd: s.contract_end,
    assignedSpecialists: s.assigned_specialists || [], specialty: s.specialty,
    students: s.students || [], notes: s.notes }
}
export function dbGabineteSessionToApp(s) {
  return { id: s.id, schoolId: s.school_id, specialistId: s.specialist_id,
    specialty: s.specialty, date: s.date, participants: s.participants,
    duration: s.duration, area: s.area, notes: s.notes }
}
export function dbTutorReportToApp(r) {
  return { id: r.id, tutorId: r.tutor_id, childId: r.child_id, date: r.date,
    school: r.school, logros: r.logros, dificultades: r.dificultades,
    solicitudes: r.solicitudes, objetivoStatus: r.objetivo_status || {} }
}

export const db = {
  async getUsers() {
    const { data, error } = await supabase.from('users').select('*').order('name')
    if (error) throw error
    return data.map(dbUserToApp)
  },
  async updateUser(id, updates) {
    const m = {}
    if ('name' in updates) m.name = updates.name
    if ('email' in updates) m.email = updates.email
    if ('role' in updates) m.role = updates.role
    if ('specialty' in updates) m.specialty = updates.specialty
    if ('title' in updates) m.title = updates.title
    if ('avatarBg' in updates) m.avatar_bg = updates.avatarBg
    if ('school' in updates) m.school = updates.school
    if ('assignedChildId' in updates) m.assigned_child_id = updates.assignedChildId
    if ('activo' in updates) m.activo = updates.activo
    const { error } = await supabase.from('users').update(m).eq('id', id)
    if (error) throw error
  },
  // ── Roles ────────────────────────────────────────────────────────────────
  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*, role_permissions(permission_key)')
      .order('es_sistema', { ascending: false })
      .order('nombre')
    if (error) throw error
    return data.map(dbRoleToApp)
  },

  async insertRole(rol) {
    const { error } = await supabase.from('roles').insert({
      id: rol.id, nombre: rol.nombre, scope: rol.scope, home: rol.home,
      es_clinico: rol.esClinico, etiqueta: rol.etiqueta, color: rol.color,
      es_sistema: false,
    })
    if (error) throw error
  },

  async updateRole(id, rol) {
    const { error } = await supabase.from('roles').update({
      nombre: rol.nombre, scope: rol.scope, home: rol.home,
      es_clinico: rol.esClinico, etiqueta: rol.etiqueta, color: rol.color,
    }).eq('id', id)
    if (error) throw error
  },

  async deleteRole(id) {
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error) throw error
  },

  // Reemplaza el conjunto entero en vez de calcular altas y bajas: son 34
  // claves como maximo y asi no hay forma de que el estado quede a medias si
  // una de las dos operaciones falla.
  async setRolePermissions(roleId, claves) {
    const { error: errBorrar } = await supabase
      .from('role_permissions').delete().eq('role_id', roleId)
    if (errBorrar) throw errBorrar
    if (!claves.length) return
    const { error } = await supabase.from('role_permissions')
      .insert(claves.map((k) => ({ role_id: roleId, permission_key: k })))
    if (error) throw error
  },

  // El alta pasa por una Edge Function porque crear el usuario de auth exige la
  // clave service_role, que no puede estar en el navegador.
  async crearEspecialista(datos) {
    const { data, error } = await supabase.functions.invoke('crear-especialista', { body: datos })
    if (error) {
      // El cuerpo del error trae el mensaje util; el de supabase-js es generico.
      let detalle = null
      try { detalle = (await error.context?.json())?.error } catch { /* sin cuerpo */ }
      throw new Error(detalle || error.message)
    }
    return data
  },
  // Sin filtro por rol: desde la fase 3 el alcance lo aplica RLS del lado del
  // servidor, para cualquier rol y no solo para el que se llama 'specialist'.
  // El filtro que habia aqui solo miraba ese nombre, asi que un rol nuevo con
  // alcance 'asignados' no lo activaba — y era evadible con un curl.
  async getChildren() {
    const { data, error } = await supabase.from('children').select('*').order('name')
    if (error) throw error
    return data.map(dbChildToApp)
  },
  async updateChild(id, updates) {
    const m = {}
    if ('name' in updates) m.name = updates.name
    if ('lastName' in updates) m.last_name = updates.lastName
    if ('packageStart' in updates) m.package_start = updates.packageStart
    if ('packageNum' in updates) m.package_num = updates.packageNum
    if ('nextSession' in updates) m.next_session = updates.nextSession
    if ('birthDate' in updates) m.birth_date = updates.birthDate
    if ('admissionDate' in updates) m.admission_date = updates.admissionDate
    if ('parentContact' in updates) m.parent_contact = updates.parentContact
    const { error } = await supabase.from('children').update(m).eq('id', id)
    if (error) throw error
  },
  async insertChild(c) {
    const { error } = await supabase.from('children').insert({
      id: c.id, name: c.name, last_name: c.lastName, birth_date: c.birthDate,
      admission_date: c.admissionDate, specialties: c.specialties,
      assigned_specialists: c.assignedSpecialists, avatar_bg: c.avatarBg,
      next_session: c.nextSession, next_session_time: c.nextSessionTime,
      parent_contact: c.parentContact, package_start: c.packageStart, package_num: c.packageNum || 1,
    })
    if (error) throw error
  },
  async getObjectives() {
    const { data, error } = await supabase.from('objectives').select('*').order('created_at')
    if (error) throw error
    return data.map(dbObjectiveToApp)
  },
  async upsertObjective(o) {
    const { error } = await supabase.from('objectives').upsert({
      id: o.id, child_id: o.childId, name: o.name, area: o.area,
      status: o.status, specialist_id: o.specialistId, created_date: o.createdDate,
    })
    if (error) throw error
  },
  async deleteObjective(id) {
    const { error } = await supabase.from('objectives').delete().eq('id', id)
    if (error) throw error
  },
  async getSessions() {
    const { data, error } = await supabase.from('sessions').select('*').order('date', { ascending: false })
    if (error) throw error
    return data.map(dbSessionToApp)
  },
  async insertSession(s) {
    const { error } = await supabase.from('sessions').insert({
      id: s.id, child_id: s.childId, specialist_id: s.specialistId,
      specialty: s.specialty, date: s.date, duration: s.duration,
      objectives_worked: s.objectivesWorked, activities: s.activities,
      observation: s.observation, next_steps: s.nextSteps,
    })
    if (error) throw error
  },
  async updateSession(s) {
    const { error } = await supabase.from('sessions').update({
      child_id: s.childId, specialist_id: s.specialistId,
      specialty: s.specialty, date: s.date, duration: s.duration,
      objectives_worked: s.objectivesWorked, activities: s.activities,
      observation: s.observation, next_steps: s.nextSteps,
    }).eq('id', s.id)
    if (error) throw error
  },
  async getDocuments() {
    const { data, error } = await supabase.from('documents').select('*').order('date', { ascending: false })
    if (error) throw error
    return data.map(dbDocumentToApp)
  },
  async insertDocument(d) {
    const { error } = await supabase.from('documents').insert({
      id: d.id, child_id: d.childId, type: d.type, title: d.title,
      date: d.date, author_id: d.authorId, notes: d.notes, fields: d.fields || {},
    })
    if (error) throw error
  },
  async updateDocument(d) {
    const { error } = await supabase.from('documents').update({
      child_id: d.childId, type: d.type, title: d.title,
      date: d.date, author_id: d.authorId, notes: d.notes, fields: d.fields || {},
    }).eq('id', d.id)
    if (error) throw error
  },
  async getMeetings() {
    const { data, error } = await supabase.from('meetings').select('*').order('date', { ascending: false })
    if (error) throw error
    return data.map(dbMeetingToApp)
  },
  async insertMeeting(m) {
    const { error } = await supabase.from('meetings').insert({
      id: m.id, child_id: m.childId, date: m.date, type: m.type,
      participants: m.participants, summary: m.summary,
      agreements: m.agreements, created_by: m.createdBy,
    })
    if (error) throw error
  },
  async getSchools() {
    const { data, error } = await supabase.from('schools').select('*').order('name')
    if (error) throw error
    return data.map(dbSchoolToApp)
  },
  async insertSchool(s) {
    const { error } = await supabase.from('schools').insert({
      id: s.id, name: s.name, contact: s.contact, phone: s.phone, email: s.email,
      contract_start: s.contractStart, contract_end: s.contractEnd,
      assigned_specialists: s.assignedSpecialists, specialty: s.specialty,
      students: s.students || [], notes: s.notes,
    })
    if (error) throw error
  },
  async getGabineteSessions() {
    const { data, error } = await supabase.from('gabinete_sessions').select('*').order('date', { ascending: false })
    if (error) throw error
    return data.map(dbGabineteSessionToApp)
  },
  async insertGabineteSession(s) {
    const { error } = await supabase.from('gabinete_sessions').insert({
      id: s.id, school_id: s.schoolId, specialist_id: s.specialistId,
      specialty: s.specialty, date: s.date, participants: s.participants,
      duration: s.duration, area: s.area, notes: s.notes,
    })
    if (error) throw error
  },
  async getTutorReports() {
    const { data, error } = await supabase.from('tutor_reports').select('*').order('date', { ascending: false })
    if (error) throw error
    return data.map(dbTutorReportToApp)
  },
  async insertTutorReport(r) {
    const { error } = await supabase.from('tutor_reports').insert({
      id: r.id, tutor_id: r.tutorId, child_id: r.childId, date: r.date,
      school: r.school, logros: r.logros, dificultades: r.dificultades,
      solicitudes: r.solicitudes, objetivo_status: r.objetivoStatus || {},
    })
    if (error) throw error
  },
  // Public (no login) consent-signature flow: a specialist generates a one-time
  // link with a random token stored inside the anamnesis document's fields;
  // the parent opens that link (no account needed) and signs there.
  async getDocumentByConsentToken(token) {
    // Security-definer RPC rather than a direct select: the previous public RLS
    // policy matched every document with a consentToken, not just this one, so
    // any anonymous caller could read all pending consent forms. The RPC narrows
    // it to the exact token presented.
    const { data, error } = await supabase.rpc('get_consent_by_token', { p_token: token })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    return row ? dbDocumentToApp(row) : null
  },
  async saveConsentSignature(token, signatureDataUrl) {
    // Runs through a security-definer RPC (not a direct table update): once the
    // token is cleared, the row is no longer visible under the public RLS
    // policy, and Postgres blocks a direct UPDATE from writing a row it can no
    // longer see back to the caller. The RPC does the lookup+update internally
    // with elevated privileges, sidestepping that restriction safely.
    const { data, error } = await supabase.rpc('sign_consent', { p_token: token, p_signature_data: signatureDataUrl })
    if (error) throw error
    if (data === false) throw new Error('Token inválido o ya usado')
  },
}
