import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wxsxtevvxepgjfxphdxt.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_Onhfm9YSu_nGuePJK0dXmg_mspQYt6E'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── helpers: map DB rows → app format ────────────────────────────────────────

export function dbUserToApp(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    specialty: u.specialty,
    title: u.title,
    avatarBg: u.avatar_bg,
    school: u.school,
    assignedChildId: u.assigned_child_id,
  }
}

export function dbChildToApp(c) {
  return {
    id: c.id,
    name: c.name,
    lastName: c.last_name,
    birthDate: c.birth_date,
    admissionDate: c.admission_date,
    specialties: c.specialties || [],
    assignedSpecialists: c.assigned_specialists || [],
    avatarBg: c.avatar_bg,
    nextSession: c.next_session,
    nextSessionTime: c.next_session_time,
    parentContact: c.parent_contact || {},
    packageStart: c.package_start,
    packageNum: c.package_num || 1,
    age: c.birth_date
      ? Math.floor((new Date() - new Date(c.birth_date)) / (365.25 * 86400000))
      : null,
  }
}

export function dbObjectiveToApp(o) {
  return {
    id: o.id,
    childId: o.child_id,
    name: o.name,
    area: o.area,
    status: o.status,
    specialistId: o.specialist_id,
    createdDate: o.created_date,
  }
}

export function dbSessionToApp(s) {
  return {
    id: s.id,
    childId: s.child_id,
    specialistId: s.specialist_id,
    specialty: s.specialty,
    date: s.date,
    duration: s.duration,
    objectivesWorked: s.objectives_worked || [],
    activities: s.activities || [],
    observation: s.observation,
    nextSteps: s.next_steps,
    createdAt: s.created_at,
  }
}

export function dbDocumentToApp(d) {
  return {
    id: d.id,
    childId: d.child_id,
    type: d.type,
    title: d.title,
    date: d.date,
    authorId: d.author_id,
    notes: d.notes,
    fields: d.fields || {},
  }
}

export function dbMeetingToApp(m) {
  return {
    id: m.id,
    childId: m.child_id,
    date: m.date,
    type: m.type,
    participants: m.participants,
    summary: m.summary,
    agreements: m.agreements,
    createdBy: m.created_by,
  }
}

export function dbSchoolToApp(s) {
  return {
    id: s.id,
    name: s.name,
    contact: s.contact,
    phone: s.phone,
    email: s.email,
    contractStart: s.contract_start,
    contractEnd: s.contract_end,
    assignedSpecialists: s.assigned_specialists || [],
    specialty: s.specialty,
    students: s.students || [],
    notes: s.notes,
  }
}

export function dbGabineteSessionToApp(s) {
  return {
    id: s.id,
    schoolId: s.school_id,
    specialistId: s.specialist_id,
    specialty: s.specialty,
    date: s.date,
    participants: s.participants,
    duration: s.duration,
    area: s.area,
    notes: s.notes,
  }
}

export function dbTutorReportToApp(r) {
  return {
    id: r.id,
    tutorId: r.tutor_id,
    childId: r.child_id,
    date: r.date,
    school: r.school,
    logros: r.logros,
    dificultades: r.dificultades,
    solicitudes: r.solicitudes,
    objetivoStatus: r.objetivo_status || {},
  }
}

// ── API functions ─────────────────────────────────────────────────────────────

export const db = {
  // Users
  async getUsers() {
    const { data, error } = await supabase.from('users').select('*').order('name')
    if (error) throw error
    return data.map(dbUserToApp)
  },

  // Children
  async getChildren() {
    const { data, error } = await supabase.from('children').select('*').order('name')
    if (error) throw error
    return data.map(dbChildToApp)
  },
  async updateChild(id, updates) {
    const dbUpdates = {}
    if ('packageStart' in updates) dbUpdates.package_start = updates.packageStart
    if ('packageNum' in updates) dbUpdates.package_num = updates.packageNum
    if ('nextSession' in updates) dbUpdates.next_session = updates.nextSession
    if ('nextSessionTime' in updates) dbUpdates.next_session_time = updates.nextSessionTime
    if ('birthDate' in updates) dbUpdates.birth_date = updates.birthDate
    if ('admissionDate' in updates) dbUpdates.admission_date = updates.admissionDate
    if ('parentContact' in updates) dbUpdates.parent_contact = updates.parentContact
    const { error } = await supabase.from('children').update(dbUpdates).eq('id', id)
    if (error) throw error
  },
  async insertChild(child) {
    const { error } = await supabase.from('children').insert({
      id: child.id, name: child.name, last_name: child.lastName,
      birth_date: child.birthDate, admission_date: child.admissionDate,
      specialties: child.specialties, assigned_specialists: child.assignedSpecialists,
      avatar_bg: child.avatarBg, next_session: child.nextSession,
      next_session_time: child.nextSessionTime, parent_contact: child.parentContact,
      package_start: child.packageStart, package_num: child.packageNum || 1,
    })
    if (error) throw error
  },

  // Objectives
  async getObjectives() {
    const { data, error } = await supabase.from('objectives').select('*').order('created_at')
    if (error) throw error
    return data.map(dbObjectiveToApp)
  },
  async upsertObjective(obj) {
    const { error } = await supabase.from('objectives').upsert({
      id: obj.id, child_id: obj.childId, name: obj.name, area: obj.area,
      status: obj.status, specialist_id: obj.specialistId, created_date: obj.createdDate,
    })
    if (error) throw error
  },
  async deleteObjective(id) {
    const { error } = await supabase.from('objectives').delete().eq('id', id)
    if (error) throw error
  },

  // Sessions
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

  // Documents
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

  // Meetings
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

  // Schools
  async getSchools() {
    const { data, error } = await supabase.from('schools').select('*').order('name')
    if (error) throw error
    return data.map(dbSchoolToApp)
  },
  async insertSchool(s) {
    const { error } = await supabase.from('schools').insert({
      id: s.id, name: s.name, contact: s.contact, phone: s.phone,
      email: s.email, contract_start: s.contractStart, contract_end: s.contractEnd,
      assigned_specialists: s.assignedSpecialists, specialty: s.specialty,
      students: s.students || [], notes: s.notes,
    })
    if (error) throw error
  },

  // Gabinete sessions
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

  // Tutor reports
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
}
