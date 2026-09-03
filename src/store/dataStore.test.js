import { describe, it, expect, beforeEach, vi } from 'vitest'

// El store persiste contra Supabase. Aqui se sustituye por espias: lo que se
// verifica es la transicion de estado, no la red.
vi.mock('../supabase.js', () => ({
  db: {
    getChildren: vi.fn(async () => []),
    getObjectives: vi.fn(async () => []),
    getSessions: vi.fn(async () => []),
    getDocuments: vi.fn(async () => []),
    getMeetings: vi.fn(async () => []),
    getSchools: vi.fn(async () => []),
    getGabineteSessions: vi.fn(async () => []),
    getTutorReports: vi.fn(async () => []),
    insertChild: vi.fn(async () => {}),
    updateChild: vi.fn(async () => {}),
    insertSession: vi.fn(async () => {}),
    updateSession: vi.fn(async () => {}),
    insertDocument: vi.fn(async () => {}),
    updateDocument: vi.fn(async () => {}),
    upsertObjective: vi.fn(async () => {}),
    deleteObjective: vi.fn(async () => {}),
    insertTutorReport: vi.fn(async () => {}),
    insertGabineteSession: vi.fn(async () => {}),
    insertSchool: vi.fn(async () => {}),
  },
}))

const { db } = await import('../supabase.js')
const { useDataStore } = await import('./dataStore.js')
const { useAuthStore } = await import('./authStore.js')

const inicial = useDataStore.getState()

beforeEach(() => {
  useDataStore.setState(inicial, true)
  useAuthStore.setState({ currentUser: { id: 'u-1', name: 'Ana' }, authLoading: false })
  vi.clearAllMocks()
})

describe('loadAll', () => {
  it('deja dataLoaded en true aunque Supabase falle', async () => {
    db.getChildren.mockRejectedValueOnce(new Error('sin red'))
    await useDataStore.getState().loadAll('admin', 'u-1')
    expect(useDataStore.getState().dataLoaded).toBe(true)
    expect(useDataStore.getState().appLoading).toBe(false)
  })

  it('vacia children con resultado vacio, en vez de caer a datos semilla', async () => {
    expect(inicial.children.length).toBeGreaterThan(0)
    await useDataStore.getState().loadAll('specialist', 'u-sin-pacientes')
    expect(useDataStore.getState().children).toEqual([])
  })

  it('conserva los datos semilla de las demas colecciones con resultado vacio', async () => {
    await useDataStore.getState().loadAll('admin', 'u-1')
    expect(useDataStore.getState().objectives).toEqual(inicial.objectives)
  })

  it('pasa rol e id a getChildren para el filtrado por rol', async () => {
    await useDataStore.getState().loadAll('specialist', 'u-7')
    expect(db.getChildren).toHaveBeenCalledWith('specialist', 'u-7')
  })
})

describe('renewPackage', () => {
  it('escribe el mismo numero de paquete en el estado y en la base', async () => {
    const id = inicial.children[0].id
    const previo = inicial.children[0].packageNum || 1
    await useDataStore.getState().renewPackage(id)
    const enEstado = useDataStore.getState().children.find((c) => c.id === id).packageNum
    expect(enEstado).toBe(previo + 1)
    expect(db.updateChild).toHaveBeenCalledWith(id, expect.objectContaining({ packageNum: previo + 1 }))
  })

  it('no hace nada con un paciente inexistente', async () => {
    await useDataStore.getState().renewPackage('c-no-existe')
    expect(db.updateChild).not.toHaveBeenCalled()
  })
})

describe('saveSession', () => {
  const payload = {
    childId: 'c-noha', specialistId: 'u-1', specialty: 'Fonoaudiología',
    date: '2026-09-03', duration: 45, objectivesWorked: [], activities: [],
    observation: '', nextSteps: '',
  }

  it('agrega la sesion y registra la actividad', () => {
    const antes = useDataStore.getState().sessions.length
    useDataStore.getState().saveSession(payload)
    const s = useDataStore.getState()
    expect(s.sessions).toHaveLength(antes + 1)
    expect(s.activityLog[0].type).toBe('session')
    expect(s.activityLog[0].seen).toBe(false)
    expect(db.insertSession).toHaveBeenCalledTimes(1)
  })

  it('remapea los ids temporales de objetivos nuevos a los reales', () => {
    useDataStore.getState().saveSession({
      ...payload,
      _newObjectiveNames: ['Objetivo nuevo'],
      objectivesWorked: [{ objectiveId: 'new-0', status: 'logrado' }],
    })
    const s = useDataStore.getState()
    const creado = s.objectives.find((o) => o.name === 'Objetivo nuevo')
    expect(creado).toBeTruthy()
    const guardada = s.sessions[s.sessions.length - 1]
    expect(guardada.objectivesWorked[0].objectiveId).toBe(creado.id)
    // el estado de desempeno se vuelca sobre el objetivo
    expect(creado.status).toBe('logrado')
  })
})

describe('addDocument y addMeeting', () => {
  it('usan el childId que reciben, no uno implicito', () => {
    useDataStore.getState().addDocument('c-mili', { type: 'reporte', title: 'X' })
    const doc = useDataStore.getState().documents.slice(-1)[0]
    expect(doc.childId).toBe('c-mili')
    expect(doc.authorId).toBe('u-1')
  })

  it('addMeeting registra al autor desde la sesion activa', () => {
    useDataStore.getState().addMeeting('c-mili', { type: 'seguimiento' })
    const m = useDataStore.getState().meetings.slice(-1)[0]
    expect(m.childId).toBe('c-mili')
    expect(m.createdBy).toBe('u-1')
  })
})

describe('markActivitySeen', () => {
  it('marca como vistas todas las entradas', () => {
    useDataStore.setState({ activityLog: [{ id: 'a', seen: false }, { id: 'b', seen: false }] })
    useDataStore.getState().markActivitySeen()
    expect(useDataStore.getState().activityLog.every((a) => a.seen)).toBe(true)
  })
})
