import React, { useEffect, useCallback, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { auth, getAppUser } from "./supabase.js";
import { can } from "./permissions.js";
import Login from "./Login.jsx";
import { T, FONTS, MobileStyles } from "./theme.js";
import { useAuthStore } from "./store/authStore.js";
import { useDataStore } from "./store/dataStore.js";
import { useCalendarStore } from "./store/calendarStore.js";
import Sidebar, { RIEL, PANEL } from "./shell/Sidebar.jsx";
import { SpecialistHome, ClinicalDirectorHome, TutorAiraHome, AdminDashboard } from "./home/index.js";
import PatientRoute from "./patient/PatientRoute.jsx";
import PatientsList from "./patients/PatientsList.jsx";
import SpecialistsList from "./team/SpecialistsList.jsx";
import GabinetePanel from "./gabinete/GabinetePanel.jsx";
import FirmaConsentimientoPublic from "./consent/FirmaConsentimientoPublic.jsx";

// Raiz de la aplicacion: sesion, enrutado y cascaron. Nada mas.
// Los datos viven en los stores y cada pantalla lee lo que necesita; el estado
// efimero vive en el componente que lo abre.
export default function App() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const authLoading = useAuthStore((s) => s.authLoading);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);

  const loadAll = useDataStore((s) => s.loadAll);
  const markLoaded = useDataStore((s) => s.markLoaded);
  const addGabineteSession = useDataStore((s) => s.addGabineteSession);

  const calendarDate = useCalendarStore((s) => s.date);
  const setCalendarDate = useCalendarStore((s) => s.setDate);
  const fetchCalendarEvents = useCalendarStore((s) => s.fetchEvents);
  const connectGcal = useCalendarStore((s) => s.connect);

  // La navegacion vive en la URL: / · /gabinete · /paciente/:childId?tab=slug
  const navigate = useNavigate();
  const location = useLocation();
  const goHome = useCallback(() => navigate("/"), [navigate]);
  const openChild = useCallback((id) => navigate(`/paciente/${encodeURIComponent(id)}`), [navigate]);

  // Enlace publico para que un padre firme el consentimiento, sin sesion.
  const consentToken = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("firmar")
    : null;

  useEffect(() => {
    // Tiempo limite por si Supabase no responde.
    const timeout = setTimeout(() => setAuthLoading(false), 3000);
    auth.getSession().then(async (session) => {
      clearTimeout(timeout);
      if (session) {
        const appUser = await getAppUser(session.user.id);
        if (appUser) setCurrentUser(appUser);
      }
      setAuthLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setAuthLoading(false);
    });
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const appUser = await getAppUser(session.user.id);
        if (appUser) setCurrentUser(appUser);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        goHome();
      }
    });
    return () => subscription.unsubscribe();
  }, [goHome, setCurrentUser, setAuthLoading]);

  // Los tutores sombra trabajan sobre datos semilla y no consultan la base.
  useEffect(() => {
    if (currentUser && currentUser.home !== "tutor") {
      loadAll(currentUser.role, currentUser.id);
    } else if (currentUser) {
      markLoaded();
    }
  }, [currentUser, loadAll, markLoaded]);

  useEffect(() => {
    if (currentUser && currentUser.home !== "tutor") {
      fetchCalendarEvents(calendarDate);
    }
  }, [currentUser, calendarDate, fetchCalendarEvents]);

  const onCalendarDateChange = (d) => { setCalendarDate(d); fetchCalendarEvents(d); };

  // El plegado del menu vive aqui porque el area de trabajo necesita el ancho
  // para su margen: si viviera dentro del Sidebar, App no podria seguirlo.
  const [menuAbierto, setMenuAbierto] = useState(true);

  if (consentToken) {
    return <FirmaConsentimientoPublic token={consentToken} />;
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
        <div style={{ fontFamily: T.font, fontSize: 21, fontWeight: 700, color: T.brand, letterSpacing: "-0.02em" }}>AIRA</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <style>{FONTS}</style>
        <MobileStyles />
        <Login />
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.ink }}>
      <style>{FONTS}</style>
      <MobileStyles />

      <Sidebar abierto={menuAbierto} onAlternar={() => setMenuAbierto((a) => !a)} />

      <main style={{
        marginLeft: menuAbierto ? RIEL + PANEL : RIEL,
        minHeight: "100vh",
        transition: "margin-left .18s ease",
      }}>
      <Routes>
        <Route path="/" element={
          currentUser.home === "tutor" ? (
            <TutorAiraHome user={currentUser} onOpenChild={openChild} />
          ) : currentUser.home === "especialista" ? (
            <SpecialistHome user={currentUser} onCalendarDateChange={onCalendarDateChange} onOpenChild={openChild} />
          ) : currentUser.home === "clinico" ? (
            <ClinicalDirectorHome user={currentUser} onCalendarDateChange={onCalendarDateChange} onOpenChild={openChild} onConnectGcal={connectGcal} />
          ) : currentUser.home === "admin" ? (
            <AdminDashboard onCalendarDateChange={onCalendarDateChange} onOpenChild={openChild} onConnectGcal={connectGcal} />
          ) : null
        } />

        <Route path="/gabinete" element={
          can(currentUser, "gabinete:view")
            ? <GabinetePanel onAddSession={addGabineteSession} />
            : <Navigate to="/" replace />
        } />

        <Route path="/paciente/:childId" element={<PatientRoute />} />

        <Route path="/pacientes" element={<PatientsList onOpenChild={openChild} />} />

        <Route path="/especialistas" element={
          can(currentUser, "user:manage")
            ? <SpecialistsList />
            : <Navigate to="/" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
