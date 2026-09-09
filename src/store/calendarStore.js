import { create } from 'zustand'
import { fetchCalendarEvents as gcalFetch } from '../googleCalendar.js'
import { TODAY } from '../theme.js'

// Agenda de Google Calendar. Store propio porque depende de un servicio externo
// que puede fallar por su cuenta: su estado de error no tiene nada que ver con
// el de los datos clinicos.
//
// Ya no hay estado "conectado" ni accion de conectar. El calendario es el del
// centro y lo lee el servidor: o se tiene permiso para verlo o no, y eso no es
// algo que el usuario pueda arreglar pulsando un boton.
export const useCalendarStore = create((set) => ({
  events: [],
  loading: false,
  error: null,
  date: TODAY,

  setDate: (date) => set({ date }),

  fetchEvents: async (date) => {
    set({ loading: true, error: null })
    try {
      set({ events: await gcalFetch(date) })
    } catch (e) {
      // El mensaje de la funcion llega tal cual: distingue "no tienes permiso"
      // de "el calendario no esta compartido con la cuenta de servicio", y esa
      // diferencia es la que dice a quien hay que ir a buscar.
      set({ error: e.message || 'No se pudo cargar la agenda', events: [] })
    } finally {
      set({ loading: false })
    }
  },
}))
