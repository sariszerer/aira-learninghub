import { create } from 'zustand'
import { signInToGoogle, fetchCalendarEvents as gcalFetch, getStoredToken } from '../googleCalendar.js'
import { TODAY } from '../theme.js'

// Agenda de Google Calendar. Store propio porque depende de un servicio externo
// que puede fallar por su cuenta: su estado de error y de conexion no tiene nada
// que ver con el de los datos clinicos.
export const useCalendarStore = create((set, get) => ({
  events: [],
  connected: !!localStorage.getItem('gcal_token'),
  loading: false,
  error: null,
  date: TODAY,

  setDate: (date) => set({ date }),

  fetchEvents: async (date) => {
    // Solo carga si ya hay un token guardado.
    const token = getStoredToken()
    if (!token) {
      set({ connected: false, error: 'conectar', loading: false })
      return
    }
    set({ loading: true, error: null })
    try {
      const events = await gcalFetch(date)
      set({ events, connected: true })
    } catch (e) {
      if (e.message === 'NOT_AUTHENTICATED') {
        set({ connected: false, error: 'conectar' })
      } else {
        set({ error: 'No se pudo cargar el calendario' })
      }
      set({ events: [] })
    } finally {
      set({ loading: false })
    }
  },

  connect: async () => {
    try {
      await signInToGoogle()
      set({ connected: true })
      get().fetchEvents(get().date)
    } catch (e) {
      set({ error: 'No se pudo conectar con Google' })
    }
  },
}))
