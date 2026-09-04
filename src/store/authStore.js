import { create } from 'zustand'

// Sesion del usuario. Vive aparte de los datos clinicos porque cambia por otra
// razon: iniciar y cerrar sesion, no operar sobre expedientes.
//
// El efecto que escucha a Supabase se queda en App.jsx: necesita `navigate` del
// router para volver al inicio al cerrar sesion.
export const useAuthStore = create((set) => ({
  currentUser: null,
  authLoading: true,

  setCurrentUser: (currentUser) => set({ currentUser }),
  setAuthLoading: (authLoading) => set({ authLoading }),
}))
