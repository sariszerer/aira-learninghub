import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { db, auth, getAppUser } from "./supabase.js";
import { can, visibleChildren, ROLES } from "./permissions.js";
import Login from "./Login.jsx";
import { T, FONTS, STATUS, SPECIALIST_COLORS, CHILD_AVATAR_COLORS, inputStyle, TODAY, MobileStyles } from "./theme.js";
import { AIRA_MARK_URI, AIRA_LOGO_FULL_URI } from "./brand.js";
import { useAuthStore } from "./store/authStore.js";
import { useDataStore } from "./store/dataStore.js";
import { useCalendarStore } from "./store/calendarStore.js";
import { fmtDate, fmtDateShort, readableTextOn, slugifyName, daysAgoISO } from "./lib/format.js";
import { sessionsSinceLastParentReport, buildParentReportText } from "./lib/reports.js";
import { ACTIVITY_CATALOG, DOC_TYPES, MEETING_TYPES } from "./constants.js";
import { Logo, Eyebrow, StatusPill, StatusRing, Avatar, Btn, Chip, Card, Modal, ModalHeader,
         Field, Section, FieldLabel, StepDots, EmptyNote, SavedToast, StatStrip, DateRangeBar,
         ReportCard } from "./ui/index.js";
import { TopBar, DriveSaveBar, RouteLoading, RouteNotFound } from "./shell/index.js";
import { SpecialistHome, ClinicalDirectorHome, TutorAiraHome, AdminDashboard } from "./home/index.js";
import ChildProfile from "./patient/ChildProfile.jsx";
import SessionWizard from "./patient/modals/SessionWizard.jsx";
import { DailyReportModal } from "./patient/modals/DailyReport.jsx";
import FullHistoryModal from "./patient/modals/FullHistoryModal.jsx";
import EvolutionReportModal from "./patient/modals/EvolutionReportModal.jsx";
import ParentReportModal from "./patient/modals/ParentReportModal.jsx";
import GabinetePanel from "./gabinete/GabinetePanel.jsx";
import FirmaConsentimientoPublic from "./consent/FirmaConsentimientoPublic.jsx";

import {
  Search, ChevronRight, ChevronLeft, X, Plus, Check,
  Calendar, Clock, User, Users, FileText, LayoutGrid,
  ClipboardList, TrendingUp, AlertTriangle, LogOut,
  Sparkles, ArrowRight, Printer, Filter, ChevronDown,
} from "lucide-react";

/* ============================================================
   SEED DATA
============================================================ */

/* ============================================================
   SMALL PRIMITIVES
============================================================ */

/* ============================================================
   APP SHELL (top bar)
============================================================ */

/* ============================================================
   SPECIALIST HOME — "Mis Pacientes"
============================================================ */

/* ============================================================
   CALENDAR AGENDA WIDGET
============================================================ */

/* ============================================================
   CLINICAL DIRECTOR HOME
============================================================ */

/* ============================================================
   SHADOW HOME — reporte quincenal
============================================================ */

/* ============================================================
   GABINETE EXTERNO
============================================================ */

/* ============================================================
   ACTIVITY FEED — alertas en tiempo real para Sarita e Idaira
============================================================ */

/* ============================================================
   ADMIN DASHBOARD
============================================================ */

/* ============================================================
   DAILY REPORT (auto-generated from a session)
============================================================ */

/* ============================================================
   MODAL wrapper
============================================================ */

/* ============================================================
   CHILD PROFILE
============================================================ */

/* ============================================================
   ADD PATIENT WIZARD (datos → anamnesis → especialistas)
============================================================ */

/* ============================================================
   FIRMA DIGITAL — signature pad + public (no login) consent page
============================================================ */

/* ============================================================
   SESSION WIZARD — "Registrar sesión" (6 steps)
============================================================ */

/* ============================================================
   FULL HISTORY generator (admin) — chronological compiled document
============================================================ */

/* ============================================================
   EVOLUTION REPORT generator — derived strictly from recorded data
============================================================ */

/* ============================================================
   PARENT PROGRESS REPORT — every ~8 sessions, plain language,
   exportable by email or WhatsApp
============================================================ */

/* ============================================================
   ROOT APP
============================================================ */

export default function App() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const authLoading = useAuthStore((s) => s.authLoading);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const consentToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("firmar") : null;

  // Navigation lives in the URL: / (home) · /gabinete · /paciente/:childId?tab=slug
  // Declared before the auth effect below, which navigates home on sign-out.
  const navigate = useNavigate();
  const location = useLocation();
  const childRouteMatch = location.pathname.match(/^\/paciente\/([^/?#]+)/);
  const selectedChildId = childRouteMatch ? decodeURIComponent(childRouteMatch[1]) : null;
  const isGabinete = location.pathname === "/gabinete";
  const isChildRoute = selectedChildId !== null;
  const goHome = useCallback(() => navigate("/"), [navigate]);
  const openChild = useCallback((id) => navigate(`/paciente/${encodeURIComponent(id)}`), [navigate]);

  // Listen to Supabase auth state
  useEffect(() => {
    // Add timeout in case Supabase doesn't respond
    const timeout = setTimeout(() => setAuthLoading(false), 3000);
    auth.getSession().then(async (session) => {
      clearTimeout(timeout);
      if (session) {
        const appUser = await getAppUser(session.user.id)
        if (appUser) setCurrentUser(appUser)
      }
      setAuthLoading(false)
    }).catch(() => {
      clearTimeout(timeout);
      setAuthLoading(false);
    })
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const appUser = await getAppUser(session.user.id)
        if (appUser) setCurrentUser(appUser)
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null)
        goHome()
      }
    })
    return () => subscription.unsubscribe()
  }, [goHome]);

  // ── Estado global: datos clinicos y agenda ──────────────────────────────────
  const children = useDataStore((s) => s.children);
  const users = useDataStore((s) => s.users);
  const objectives = useDataStore((s) => s.objectives);
  const sessions = useDataStore((s) => s.sessions);
  const documents = useDataStore((s) => s.documents);
  const meetings = useDataStore((s) => s.meetings);
  const parentReports = useDataStore((s) => s.parentReports);
  const tutors = useDataStore((s) => s.tutors);
  const schools = useDataStore((s) => s.schools);
  const gabineteSessions = useDataStore((s) => s.gabineteSessions);
  const tutorReports = useDataStore((s) => s.tutorReports);
  const activityLog = useDataStore((s) => s.activityLog);
  const dataLoaded = useDataStore((s) => s.dataLoaded);
  const loadAll = useDataStore((s) => s.loadAll);
  const markLoaded = useDataStore((s) => s.markLoaded);
  const markActivitySeen = useDataStore((s) => s.markActivitySeen);

  const calendarEvents = useCalendarStore((s) => s.events);
  const calendarLoading = useCalendarStore((s) => s.loading);
  const calendarError = useCalendarStore((s) => s.error);
  const calendarDate = useCalendarStore((s) => s.date);
  const setCalendarDate = useCalendarStore((s) => s.setDate);
  const fetchCalendarEvents = useCalendarStore((s) => s.fetchEvents);
  const handleConnectGcal = useCalendarStore((s) => s.connect);

  const driveStatus = "idle"; // barra de guardado: Supabase persiste al instante
  const saveToDrive = () => {}; // se conserva por compatibilidad de la barra

  // Carga los datos al iniciar sesion. Los tutores sombra trabajan sobre datos
  // semilla y no consultan la base.
  useEffect(() => {
    if (currentUser && currentUser.home !== "tutor") {
      loadAll(currentUser.role, currentUser.id);
    } else if (currentUser) {
      markLoaded();
    }
  }, [currentUser, loadAll, markLoaded]);

  // Carga la agenda al iniciar sesion y cada vez que cambia la fecha.
  useEffect(() => {
    if (currentUser && currentUser.home !== "tutor") {
      fetchCalendarEvents(calendarDate);
    }
  }, [currentUser, calendarDate, fetchCalendarEvents]);

  // Estado efimero de pantalla: no va a los stores porque es de la vista, no de
  // la aplicacion. La tarea 8 lo baja a ChildProfile, que es donde se usa.
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [fullHistoryOpen, setFullHistoryOpen] = useState(false);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [parentReportOpen, setParentReportOpen] = useState(false);
  const [toast, setToast] = useState(false);

  // ── Acciones del store ──────────────────────────────────────────────────────
  const saveSession = useDataStore((s) => s.saveSession);
  const handleUpdateChild = useDataStore((s) => s.updateChild);
  const handleUpdateSession = useDataStore((s) => s.updateSession);
  const handleUpdateDocument = useDataStore((s) => s.updateDocument);
  const handleCloseProcess = useDataStore((s) => s.closeProcess);
  const handleRenewPackage = useDataStore((s) => s.renewPackage);
  const handleUpdateObjective = useDataStore((s) => s.updateObjective);
  const handleAddObjective = useDataStore((s) => s.addObjective);
  const handleDeleteObjective = useDataStore((s) => s.deleteObjective);
  const handleAddTutorReport = useDataStore((s) => s.addTutorReport);
  const handleAddGabineteSession = useDataStore((s) => s.addGabineteSession);
  const handleAddSchool = useDataStore((s) => s.addSchool);
  const handleAddChild = useDataStore((s) => s.addChild);
  const addDocument = useDataStore((s) => s.addDocument);
  const addMeeting = useDataStore((s) => s.addMeeting);

  // El store hace el trabajo de datos; el cierre del asistente y el aviso de
  // guardado son de la vista y se quedan aqui.
  const handleSaveSession = (payload) => {
    saveSession(payload);
    setWizardOpen(false);
    setToast(true);
    setTimeout(() => setToast(false), 3200);
  };

  // El childId llega explicito porque el store no conoce la ruta activa.
  const handleAddDocument = (doc) => addDocument(selectedChildId, doc);
  const handleAddMeeting = (meeting) => addMeeting(selectedChildId, meeting);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // Public link for a parent to sign the informed-consent form — no login needed.
  if (consentToken) {
    return <FirmaConsentimientoPublic token={consentToken} />;
  }

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#FFFBF2" }}>
        <div style={{ fontFamily:"Fraunces, serif", fontSize:36, fontWeight:500, color:"#175FAF", letterSpacing:"-0.02em" }}>AIRA</div>
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
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Inter, sans-serif", color: T.ink }}>
      <style>{FONTS}</style>

      <DriveSaveBar status={driveStatus} onSave={saveToDrive} />
      <TopBar
        user={currentUser}
        onHome={goHome}
        onBack={isChildRoute ? goHome : null}
        backLabel={currentUser.home === "admin" ? "Panel administrativo" : currentUser.home === "clinico" ? "Panel clínico" : "Mis pacientes"}
        onLogout={async () => { await auth.signOut(); setCurrentUser(null); goHome(); }}
        showGabinete={can(currentUser, "gabinete:view")}
        onGabinete={() => navigate("/gabinete")}
        gabineteActive={isGabinete}
        onSave={null}
      />

      <Routes>
        <Route path="/" element={
          currentUser.home === "tutor" ? (
            <TutorAiraHome user={currentUser} onOpenChild={openChild} />
          ) : currentUser.home === "especialista" ? (
            <SpecialistHome
              user={currentUser}
              onCalendarDateChange={(d) => { setCalendarDate(d); fetchCalendarEvents(d); }}
              onOpenChild={openChild}
            />
          ) : currentUser.home === "clinico" ? (
            <ClinicalDirectorHome
              user={currentUser}
              onCalendarDateChange={(d) => { setCalendarDate(d); fetchCalendarEvents(d); }}
              onOpenChild={openChild}
              onConnectGcal={handleConnectGcal}
            />
          ) : currentUser.home === "admin" ? (
            <AdminDashboard
              onCalendarDateChange={(d) => { setCalendarDate(d); fetchCalendarEvents(d); }}
              onOpenChild={openChild}
              onConnectGcal={handleConnectGcal}
            />
          ) : null
        } />

        <Route path="/gabinete" element={
          can(currentUser, "gabinete:view") ? (
            <GabinetePanel onAddSession={handleAddGabineteSession} />
          ) : <Navigate to="/" replace />
        } />

        <Route path="/paciente/:childId" element={
          !dataLoaded ? (
            <RouteLoading />
          ) : selectedChild ? (
            <ChildProfile
              child={selectedChild}
              onOpenSessionForm={() => setWizardOpen(true)}
              onViewReport={(s) => setViewingReport(s)}
              onGenerateFull={() => setFullHistoryOpen(true)}
              onGenerateEvolution={() => setEvolutionOpen(true)}
              onGenerateParentReport={() => setParentReportOpen(true)}
              onAddDocument={handleAddDocument}
              onAddMeeting={handleAddMeeting}
            />
          ) : (
            <RouteNotFound onHome={goHome} />
          )
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {wizardOpen && selectedChild && (
        <SessionWizard
          child={selectedChild} currentUser={currentUser} objectives={objectives}
          onClose={() => setWizardOpen(false)} onSave={handleSaveSession}
        />
      )}

      {viewingReport && selectedChild && (
        <DailyReportModal
          session={viewingReport} child={selectedChild}
          specialist={users.find((u) => u.id === viewingReport.specialistId)}
          objectives={objectives} onClose={() => setViewingReport(null)}
        />
      )}

      {fullHistoryOpen && selectedChild && (
        <FullHistoryModal
          child={selectedChild} sessions={sessions} objectives={objectives} users={users}
          onClose={() => setFullHistoryOpen(false)}
        />
      )}

      {evolutionOpen && selectedChild && (
        <EvolutionReportModal
          child={selectedChild} sessions={sessions} objectives={objectives} users={users}
          onClose={() => setEvolutionOpen(false)}
        />
      )}

      {parentReportOpen && selectedChild && (
        <ParentReportModal
          child={selectedChild} sessions={sessions} objectives={objectives} parentReports={parentReports}
          onClose={() => setParentReportOpen(false)}
          onGenerated={(report) => setParentReports((prev) => [...prev, { id: `pr-${Date.now()}`, ...report }])}
        />
      )}

      {toast && <SavedToast />}
    </div>
  );
}