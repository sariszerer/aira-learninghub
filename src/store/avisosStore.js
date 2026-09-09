import { create } from 'zustand'

// Canal único de avisos de la aplicación.
//
// Vive aparte de dataStore porque no es dato clínico: es lo que la interfaz le
// dice al usuario. Y vive en un store y no en cada formulario porque el aviso
// tiene que sobrevivir al cierre del modal que lo provocó — si el error se
// pinta dentro del formulario y el formulario se cierra, el error se va con él
// y el usuario se queda creyendo que guardó.
//
// Los errores NO se desvanecen solos. Un toast de tres segundos sirve para
// confirmar; para avisar de que algo falló, no: el usuario puede estar mirando
// otro campo cuando pasa. Se van cuando él los descarta.
export const useAvisosStore = create((set, get) => ({
  avisos: [],

  // `que` es la acción que falló, en lenguaje del usuario ("Guardar colegio").
  // `detalle` es el porqué. Se separan para que el aviso se lea sin tener que
  // descifrar un mensaje de Postgres.
  avisarError: (que, detalle) => {
    const texto = detalle instanceof Error ? detalle.message : detalle ? String(detalle) : null
    if (detalle instanceof Error) console.error(`${que}:`, detalle)
    return get()._publicar({ tono: 'error', que, detalle: texto })
  },

  avisarExito: (que) => get()._publicar({ tono: 'exito', que, detalle: null }),

  _publicar: (aviso) => {
    // Dos veces el mismo error seguido es un reintento, no dos problemas: se
    // refresca el que ya está en vez de apilar copias.
    const repetido = get().avisos.find((a) => a.que === aviso.que && a.detalle === aviso.detalle)
    if (repetido) {
      set((s) => ({ avisos: s.avisos.map((a) => (a.id === repetido.id ? { ...a, en: Date.now() } : a)) }))
      return repetido.id
    }
    const id = `av-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => ({ avisos: [...s.avisos, { id, en: Date.now(), ...aviso }] }))
    return id
  },

  descartar: (id) => set((s) => ({ avisos: s.avisos.filter((a) => a.id !== id) })),
  descartarTodos: () => set({ avisos: [] }),
}))

// Para usarlo fuera de React — el store de datos publica desde sus acciones.
export const avisar = {
  error: (que, detalle) => useAvisosStore.getState().avisarError(que, detalle),
  exito: (que) => useAvisosStore.getState().avisarExito(que),
}
