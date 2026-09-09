import { create } from 'zustand'
import { fetchCalendarEvents as gcalFetch } from '../googleCalendar.js'
import { TODAY } from '../theme.js'
import { rangoDeVista } from '../lib/semana.js'

// Agenda de Google Calendar. Store propio porque depende de un servicio externo
// que puede fallar por su cuenta: su estado de error no tiene nada que ver con
// el de los datos clinicos.
//
// No hay estado "conectado" ni accion de conectar. El calendario es el del
// centro y lo lee el servidor: o se tiene permiso para verlo o no, y eso no es
// algo que el usuario pueda arreglar pulsando un boton.

// Cada peticion lleva numero. Solo la ultima escribe en el store.
//
// Cambiar de dia y de vista a la vez lanzaba dos peticiones de rangos
// distintos, y se pintaba la que llegara ultima: bajar de Mes a Dia podia
// dejar el mes entero cargado. Un mes tarda mas que un dia, asi que la
// equivocada ganaba a menudo.
let ultimaPeticion = 0

export const useCalendarStore = create((set, get) => ({
  events: [],
  loading: false,
  error: null,
  date: TODAY,
  // 'dia' | 'semana' | 'mes' | 'lista'. Semana y lista comparten rango — de
  // lunes a domingo — y se diferencian solo en como se dibuja.
  vista: 'dia',

  setDate: (date) => get().cargar({ date }),
  setVista: (vista) => get().cargar({ vista }),

  // Cambiar dia y vista de una vez, con UNA sola peticion. Es lo que hace
  // pulsar un dia en la rejilla del mes o en la cabecera de la semana.
  verDia: (date) => get().cargar({ date, vista: 'dia' }),

  cargar: async ({ date, vista } = {}) => {
    const siguiente = {
      date: date ?? get().date,
      vista: vista ?? get().vista,
    }
    set({ ...siguiente, loading: true, error: null })

    const mia = ++ultimaPeticion
    try {
      const eventos = await gcalFetch(rangoDeVista(siguiente.vista, siguiente.date))
      if (mia !== ultimaPeticion) return
      set({ events: eventos })
    } catch (e) {
      if (mia !== ultimaPeticion) return
      // El mensaje de la funcion llega tal cual: distingue "no tienes permiso"
      // de "el calendario no esta compartido con la cuenta de servicio", y esa
      // diferencia es la que dice a quien hay que ir a buscar.
      set({ error: e.message || 'No se pudo cargar la agenda', events: [] })
    } finally {
      if (mia === ultimaPeticion) set({ loading: false })
    }
  },

  // La carga inicial, desde App.
  fetchEvents: () => get().cargar(),
}))
