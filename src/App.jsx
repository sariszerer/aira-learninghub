import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { db, auth, getAppUser } from "./supabase.js";
import { can, visibleChildren, ROLES } from "./permissions.js";
import { signInToGoogle, fetchCalendarEvents as gcalFetch, getStoredToken, clearToken } from "./googleCalendar.js";
import Login from "./Login.jsx";
import { T, FONTS, STATUS, SPECIALIST_COLORS, CHILD_AVATAR_COLORS, inputStyle, TODAY, MobileStyles } from "./theme.js";
import { AIRA_MARK_URI, AIRA_LOGO_FULL_URI } from "./brand.js";
import { fmtDate, fmtDateShort, readableTextOn, slugifyName, daysAgoISO } from "./lib/format.js";
import { sessionsSinceLastParentReport, buildParentReportText } from "./lib/reports.js";
import { ACTIVITY_CATALOG, DOC_TYPES, MEETING_TYPES } from "./constants.js";
import { seedUsers, seedChildren, seedObjectives, seedSessions, seedDocuments, seedMeetings,
         seedParentReports, seedTutors, seedSchools, seedGabineteSessions, seedTutorReports } from "./data/seed.js";

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
function Logo({ size = 28 }) {
  return (
    <img
      src={AIRA_MARK_URI}
      alt="AIRA"
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}

function Eyebrow({ children, tone = "amber", style }) {
  const color = tone === "amber" ? T.amberDeep : tone === "faint" ? T.inkFaint : T.brand;
  return (
    <div style={{
      fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 500,
      fontSize: 15, color, letterSpacing: "0.005em", marginBottom: 14, ...style,
    }}>
      {children}
    </div>
  );
}

function StatusPill({ status, size = "sm" }) {
  const s = STATUS[status];
  if (!s) return null;
  const pad = size === "sm" ? "3px 9px" : "5px 12px";
  const font = size === "sm" ? 12 : 13;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.tint, color: s.color, borderRadius: 999,
      padding: pad, fontSize: font, fontWeight: 600, fontFamily: "Inter, sans-serif",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function StatusRing({ status, size = 34 }) {
  const s = STATUS[status] || STATUS.proceso;
  const frac = status === "logrado" ? 1 : status === "proceso" ? 0.6 : 0.28;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={T.border} strokeWidth="3.5" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={s.color} strokeWidth="3.5" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - frac)} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function Avatar({ name, bg, size = 44 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const fg = readableTextOn(bg || T.brand);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg || T.brand,
      color: fg, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: size * 0.4, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", icon: Icon, disabled, full }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "Inter, sans-serif", fontWeight: 600, cursor: disabled ? "default" : "pointer",
    border: "none", borderRadius: 12, transition: "all .15s ease",
    opacity: disabled ? 0.45 : 1, width: full ? "100%" : "auto",
  };
  const sizes = {
    md: { padding: "11px 18px", fontSize: 14 },
    lg: { padding: "15px 24px", fontSize: 15.5 },
    sm: { padding: "7px 13px", fontSize: 13 },
  };
  const variants = {
    primary: { background: T.brand, color: "#fff" },
    amber: { background: T.amber, color: T.brandDeep },
    ghost: { background: "transparent", color: T.brand, border: `1.5px solid ${T.border}` },
    subtle: { background: T.brandTint, color: T.brand },
    danger: { background: T.apoyoTint, color: T.apoyo },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.94)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
    >
      {Icon && <Icon size={size === "lg" ? 18 : 16} />}
      {children}
    </button>
  );
}

function Chip({ label, selected, onClick, tone = "brand" }) {
  const activeColors = tone === "brand"
    ? { bg: T.brand, fg: "#fff", border: T.brand }
    : { bg: T.amberTint, fg: T.amberDeep, border: T.amber };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "9px 15px", borderRadius: 11, fontSize: 14, fontWeight: 600,
        fontFamily: "Inter, sans-serif", cursor: "pointer",
        border: `1.5px solid ${selected ? activeColors.border : T.border}`,
        background: selected ? activeColors.bg : "#fff",
        color: selected ? activeColors.fg : T.inkSoft,
        transition: "all .12s ease",
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${selected ? activeColors.fg : T.border}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        background: selected ? "rgba(255,255,255,0.15)" : "transparent",
      }}>
        {selected && <Check size={11} strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`,
        boxShadow: T.shadow, cursor: onClick ? "pointer" : "default",
        transition: "box-shadow .18s ease, transform .18s ease",
        ...style,
      }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(32,48,46,0.09)"; e.currentTarget.style.transform = "translateY(-1px)"; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = "translateY(0)"; } : undefined}
    >
      {children}
    </div>
  );
}

/* ============================================================
   APP SHELL (top bar)
============================================================ */
function DriveSaveBar({ status, onSave }) {
  if (status === "idle") return null;
  const conf = {
    saving: { bg: "#FFF8E1", color: T.amberDeep, text: "Guardando en Drive..." },
    saved:  { bg: "#E8F5E9", color: "#2E7D32", text: "✓ Guardado en Google Drive" },
    error:  { bg: "#FFEBEE", color: "#C62828", text: "⚠ Error al guardar — reintenta" },
  }[status] || {};
  return (
    <div style={{ background: conf.bg, color: conf.color, fontSize: 12.5, fontWeight: 600, textAlign: "center", padding: "6px 20px", borderBottom: `1px solid ${conf.color}22`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      {conf.text}
      {status === "error" && <button onClick={onSave} style={{ background: conf.color, color: "#fff", border: "none", borderRadius: 6, padding: "2px 10px", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Reintentar</button>}
    </div>
  );
}

function TopBar({ user, onBack, backLabel, onLogout, onHome, showGabinete, onGabinete, gabineteActive, onSave }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 30, background: "rgba(248,246,240,0.92)",
      backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.borderSoft}`,
    }}>
      <div style={{
        maxWidth: 1060, margin: "0 auto", padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div onClick={onHome} style={{ cursor: "pointer" }}><Logo size={24} /></div>
          {onBack && (
            <button onClick={onBack} style={{
              display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
              color: T.inkSoft, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "Fraunces, serif", fontStyle: "italic",
            }}>
              <ChevronLeft size={15} /> {backLabel || "Volver"}
            </button>
          )}
          {showGabinete && !onBack && (
            <button onClick={onGabinete} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
              border: `1.5px solid ${gabineteActive ? T.brand : T.border}`,
              background: gabineteActive ? T.brand : "transparent",
              color: gabineteActive ? "#fff" : T.inkSoft,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              🏫 Gabinete externo
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{user.name}</div>
            <div style={{ fontSize: 11.5, color: T.inkFaint }}>{user.home === "admin" || user.home === "clinico" ? user.title || user.specialty : user.home === "tutor" ? `Tutor AIRA · ${user.school}` : user.specialty}</div>
          </div>
          <Avatar name={user.name} bg={user.avatarBg} size={36} />
          {onSave && (
            <button onClick={onSave} title="Guardar en Drive" style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft,
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              💾 Guardar
            </button>
          )}
          <button onClick={onLogout} title="Cerrar sesión" style={{
            width: 34, height: 34, borderRadius: 10, border: "none", background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.inkFaint,
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.inkSoft)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.inkFaint)}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SPECIALIST HOME — "Mis Pacientes"
============================================================ */
function ChildCard({ child, users, sessions, onOpen }) {
  const specialists = child.assignedSpecialists.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  return (
    <Card onClick={onOpen} style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        height: 58, background: `linear-gradient(135deg, ${child.avatarBg}26, ${child.avatarBg}08)`,
        position: "relative",
      }} />
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "inline-block", borderRadius: "50%", boxShadow: "0 0 0 4px #fff" }}>
          <Avatar name={child.name + " " + child.lastName} bg={child.avatarBg} size={58} />
        </div>
        <div style={{ marginTop: -34, paddingLeft: 68 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600, color: T.ink, marginTop: 6 }}>
            {child.name} {child.lastName}
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>
            {child.status === "inactivo" && <span style={{color:"#B56060",fontWeight:600,marginRight:4}}>INACTIVO · </span>}{child.age != null ? `${child.age} años · ` : ""}{child.specialties.join(" · ")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.inkFaint, fontSize: 12.5 }}>
            <Calendar size={13} />
            {child.nextSession ? fmtDate(child.nextSession) : "Sin sesión programada"}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.brand, fontSize: 13, fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 500 }}>
            Ver perfil <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Card>
  );
}

function TodaySchedule({ childrenToday, onOpenChild }) {
  if (childrenToday.length === 0) {
    return (
      <Card style={{ padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: T.surfaceSunk, color: T.inkFaint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Calendar size={16} />
        </div>
        <div style={{ fontSize: 13.5, color: T.inkSoft }}>No tienes sesiones programadas para hoy.</div>
      </Card>
    );
  }
  return (
    <Card style={{ padding: "8px 6px", marginBottom: 28 }}>
      <div style={{ padding: "12px 14px 6px" }}>
        <Eyebrow style={{ marginBottom: 0 }}>
          Hoy — {childrenToday.length} sesión{childrenToday.length !== 1 ? "es" : ""}
        </Eyebrow>
      </div>
      {childrenToday.map((c, i) => (
        <button key={c.id} onClick={() => onOpenChild(c.id)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "11px 14px",
          border: "none", borderTop: i > 0 ? `1px solid ${T.borderSoft}` : "none",
          background: "transparent", cursor: "pointer", textAlign: "left",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceSunk)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Avatar name={c.name + " " + c.lastName} bg={c.avatarBg} size={34} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5, color: T.ink }}>{c.name} {c.lastName}</div>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: T.brand }}>
            <Clock size={12} /> {c.nextSessionTime || "Sin horario"}
          </span>
        </button>
      ))}
    </Card>
  );
}

function SpecialistHome({ user, children, users, sessions, onOpenChild, calendarEvents, calendarLoading, calendarError, calendarDate, onCalendarDateChange }) {
  const [query, setQuery] = useState("");
  const myChildren = visibleChildren(user, children);
  const filtered = myChildren.filter((c) =>
    (c.name + " " + c.lastName).toLowerCase().includes(query.toLowerCase())
  );
  const childrenToday = myChildren
    .filter((c) => c.nextSession === TODAY)
    .sort((a, b) => (a.nextSessionTime || "").localeCompare(b.nextSessionTime || ""));

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 20px 60px" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em" }}>
          Hola, {user.name.split(" ")[0]}
        </div>
        <div style={{ color: T.inkSoft, fontSize: 14.5, marginTop: 5 }}>
          {myChildren.length} paciente{myChildren.length !== 1 ? "s" : ""} asignado{myChildren.length !== 1 ? "s" : ""}
        </div>
      </div>

      <CalendarAgenda
        events={calendarEvents} loading={calendarLoading} error={calendarError}
        date={calendarDate} onDateChange={onCalendarDateChange}
        children={myChildren} onOpenChild={onOpenChild} onConnectGcal={() => {}}
      />
      <TodaySchedule childrenToday={childrenToday} onOpenChild={onOpenChild} />

      <div style={{ position: "relative", marginBottom: 28 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: 13, color: T.inkFaint }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre..."
          style={{
            width: "100%", padding: "11px 14px 11px 40px", borderRadius: 13,
            border: `1px solid ${T.border}`, fontSize: 14.5, fontFamily: "Inter, sans-serif",
            background: "#fff", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      <Eyebrow>Mis pacientes</Eyebrow>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: T.inkFaint }}>
          No se encontraron pacientes con ese nombre.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((c) => (
            <ChildCard key={c.id} child={c} users={users} sessions={sessions} onOpen={() => onOpenChild(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CALENDAR AGENDA WIDGET
============================================================ */
function CalendarAgenda({ events, loading, error, date, onDateChange, children, onOpenChild, onConnectGcal }) {
  const [links, setLinks] = useState({}); // eventIndex -> childId
  const [linking, setLinking] = useState(null); // index of event being linked
  const [search, setSearch] = useState("");

  const SPECIALIST_COLORS = {
    "celilia": "#6E8FA6", "idaira": "#7FA88A", "neyma": "#A6779A",
    "milagros": "#82A166", "ingrid": "#9AA4C4", "daniella": "#C79A6B",
    "mavi": "#B58AC7", "virginia": "#B58AC7", "sarita": "#175FAF",
  };

  const getSpColor = (title) => {
    const t = (title || "").toLowerCase();
    for (const [key, color] of Object.entries(SPECIALIST_COLORS)) {
      if (t.includes(key)) return color;
    }
    return "#8A9BAD";
  };

  const filteredChildren = children.filter((c) =>
    (c.name + " " + c.lastName).toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const handleLink = (evIdx, childId) => {
    setLinks((prev) => ({ ...prev, [evIdx]: childId }));
    setLinking(null);
    setSearch("");
  };

  const handleUnlink = (evIdx) => {
    setLinks((prev) => { const n = { ...prev }; delete n[evIdx]; return n; });
  };

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <Eyebrow>Agenda del día — Google Calendar</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "Inter, sans-serif", color: T.ink, background: "#fff", outline: "none" }}
          />
          {loading && (
            <span style={{ fontSize: 12, color: T.inkSoft, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: `2px solid ${T.brand}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              Cargando...
            </span>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {error === "conectar" ? (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 14 }}>Conecta Google Calendar para ver la agenda de AIRA</div>
          <button onClick={onConnectGcal} style={{ background: T.brand, color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "inline-flex", alignItems: "center", gap: 8 }}>
            📅 Conectar Google Calendar
          </button>
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: "#B56060", padding: "10px 14px", background: "#FFF0F0", borderRadius: 10, marginBottom: 12 }}>⚠ {error}</div>
      ) : null}

      {!loading && !error && events.length === 0 && (
        <div style={{ fontSize: 13.5, color: T.inkFaint, textAlign: "center", padding: "24px 0" }}>No hay eventos en el calendario para este día.</div>
      )}

      {events.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {events.map((ev, i) => {
            const linkedId = links[i];
            const linkedChild = linkedId ? children.find((c) => c.id === linkedId) : null;
            const spColor = getSpColor(ev.title || "");
            const isLinking = linking === i;

            return (
              <div key={i}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  borderRadius: isLinking ? "11px 11px 0 0" : 11,
                  background: isLinking ? T.bg : T.surfaceSunk,
                  borderLeft: `3px solid ${spColor}`,
                  border: isLinking ? `1.5px solid ${T.brand}` : undefined,
                }}>
                  {/* Time */}
                  <div style={{ minWidth: 58, textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{ev.time}</div>
                    {ev.endTime && <div style={{ fontSize: 11, color: T.inkFaint }}>{ev.endTime}</div>}
                  </div>

                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: spColor, flexShrink: 0 }} />

                  {/* Title */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ev.title || ev.raw}
                    </div>
                    {linkedChild ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: linkedChild.avatarBg, flexShrink: 0 }} />
                        <span
                          onClick={() => onOpenChild(linkedChild.id)}
                          style={{ fontSize: 12, color: T.brand, fontWeight: 600, cursor: "pointer" }}
                        >
                          {linkedChild.name} {linkedChild.lastName}
                        </span>
                        <button onClick={() => handleUnlink(i)} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, fontSize: 11, padding: "0 2px" }}>✕</button>
                      </div>
                    ) : (
                      ev.specialist && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 1 }}>{ev.specialist}</div>
                    )}
                  </div>

                  {/* Link button */}
                  <button
                    onClick={() => { setLinking(isLinking ? null : i); setSearch(""); }}
                    style={{
                      background: isLinking ? T.brand : "none",
                      color: isLinking ? "#fff" : T.inkSoft,
                      border: `1px solid ${isLinking ? T.brand : T.border}`,
                      borderRadius: 8, padding: "4px 10px", fontSize: 11.5,
                      fontFamily: "Inter, sans-serif", cursor: "pointer", fontWeight: 600,
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}
                  >
                    {linkedChild ? "✎ cambiar" : "+ vincular"}
                  </button>
                </div>

                {/* Inline patient picker */}
                {isLinking && (
                  <div style={{
                    background: "#fff", border: `1.5px solid ${T.brand}`, borderTop: "none",
                    borderRadius: "0 0 11px 11px", padding: "10px 14px",
                  }}>
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar paciente..."
                      style={{
                        width: "100%", padding: "7px 10px", borderRadius: 8,
                        border: `1px solid ${T.border}`, fontSize: 13.5,
                        fontFamily: "Inter, sans-serif", outline: "none", marginBottom: 8, boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {filteredChildren.map((c) => (
                        <div key={c.id} onClick={() => handleLink(i, c.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                            borderRadius: 8, cursor: "pointer", transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceSunk}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: c.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {c.name[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{c.name} {c.lastName}</div>
                            <div style={{ fontSize: 11.5, color: T.inkSoft }}>{c.specialties.join(" · ")}</div>
                          </div>
                        </div>
                      ))}
                      {filteredChildren.length === 0 && (
                        <div style={{ fontSize: 13, color: T.inkFaint, padding: "6px 8px" }}>Sin resultados</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   CLINICAL DIRECTOR HOME
============================================================ */
function ClinicalDirectorHome({ user, children, users, sessions, objectives, tutors, tutorReports, onOpenChild, calendarEvents, calendarLoading, calendarError, calendarDate, onCalendarDateChange, activityLog, onMarkSeen, onConnectGcal }) {
  const [query, setQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("Todos");
  const [alertTab, setAlertTab] = useState("inactivos");

  const allSpecialties = ["Todos", ...Array.from(new Set(children.flatMap((c) => c.specialties))).sort()];
  const filtered = children.filter((c) => {
    const matchQ = (c.name + " " + c.lastName).toLowerCase().includes(query.toLowerCase());
    const matchS = filterSpecialty === "Todos" || c.specialties.includes(filterSpecialty);
    return matchQ && matchS;
  });

  const misPacientesAsignados = children.filter((c) => c.assignedSpecialists.includes(user.id));
  const myToday = misPacientesAsignados.filter((c) => c.nextSession === TODAY)
    .sort((a, b) => (a.nextSessionTime || "").localeCompare(b.nextSessionTime || ""));

  const allSpecialistsAndDir = users.filter((u) => ROLES[u.role]?.esClinico);

  // ── Alert calculations ─────────────────────────────────────────────────────

  // 1. Sin sesión 14+ días — agrupados por especialista
  const inactivosPorEsp = allSpecialistsAndDir.map((sp) => {
    const spChildren = children.filter((c) => c.assignedSpecialists.includes(sp.id));
    const inactive = spChildren.filter((c) => {
      const last = sessions.filter((s) => s.childId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!last) return true;
      return Math.floor((new Date(TODAY) - new Date(last.date)) / 86400000) >= 14;
    }).map((c) => {
      const last = sessions.filter((s) => s.childId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      const days = last ? Math.floor((new Date(TODAY) - new Date(last.date)) / 86400000) : null;
      return { ...c, daysSince: days };
    }).sort((a, b) => (b.daysSince || 999) - (a.daysSince || 999));
    return { sp, inactive };
  }).filter((x) => x.inactive.length > 0);

  // 2. Pacientes con paquete activo — todos los que tienen sesiones, con progreso X/8, X/12
  const PAQUETE_SIZE = 8;
  const conPaquete = children.map((c) => {
    const allSessions = sessions.filter((s) => s.childId === c.id);
    const count = allSessions.length;
    if (count === 0) return null;
    const packageStart = c.packageStart || null;
    const sessionsInPkg = packageStart
      ? allSessions.filter((s) => s.date >= packageStart).length
      : count;
    const currentInPackage = sessionsInPkg > 0 ? ((sessionsInPkg - 1) % PAQUETE_SIZE) + 1 : 0;
    const paqueteNum = c.packageNum || 1;
    const porVencer = currentInPackage >= 6;
    return { ...c, sessionCount: count, enPaquete: currentInPackage, paqueteNum, porVencer };
  }).filter(Boolean);
  const proximosPaquete = conPaquete.filter((c) => c.porVencer).sort((a,b) => b.enPaquete - a.enPaquete);
  const todosConPaquete = conPaquete.sort((a,b) => b.sessionCount - a.sessionCount);

  // 3. 8+ sesiones sin reporte para padres
  const sinReportePadres = children.filter((c) => {
    const childSessions = sessions.filter((s) => s.childId === c.id);
    if (childSessions.length < 8) return false;
    // Check if sessions since last parent report >= 8
    // (simplified: any child with 8+ sessions and no parent report in objectives data)
    return childSessions.length % 8 === 0 || childSessions.length > 8;
  }).slice(0, 10);

  // 4. Sin objetivos definidos
  const sinObjetivos = children.filter((c) => !objectives.some((o) => o.childId === c.id));

  // 5. Objetivo estancado (mismo estado en 3+ sesiones consecutivas sin avance)
  const objetivosEstancados = objectives.filter((o) => {
    const childSessions = sessions
      .filter((s) => s.childId === o.childId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
    if (childSessions.length < 3) return false;
    const statuses = childSessions
      .map((s) => (s.objectivesWorked || []).find((ow) => ow.objectiveId === o.id)?.status)
      .filter(Boolean);
    return statuses.length >= 3 && statuses.every((st) => st === "apoyo");
  });

  // Tutor AIRA: reportes vencidos (15+ días sin reporte)
  const tutorsVencidos = tutors.map((sh) => {
    const childObj = children.find((c) => c.id === sh.assignedChildId);
    const lastReport = tutorReports.filter((r) => r.shadowId === sh.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    const days = lastReport ? Math.floor((new Date(TODAY) - new Date(lastReport.date)) / 86400000) : null;
    const overdue = days === null || days >= 15;
    return { sh, childObj, daysSince: days, overdue };
  }).filter((x) => x.overdue);

  const totalAlertas = inactivosPorEsp.reduce((a, x) => a + x.inactive.length, 0)
    + proximosPaquete.length + sinObjetivos.length + objetivosEstancados.length + tutorsVencidos.length;

  const ALERT_TABS = [
    { key: "inactivos", label: "Sin sesión", count: inactivosPorEsp.reduce((a, x) => a + x.inactive.length, 0) },
    { key: "paquete", label: "Paquetes", count: todosConPaquete.length },
    { key: "reportes", label: "Reportes", count: sinReportePadres.length },
    { key: "objetivos", label: "Sin objetivos", count: sinObjetivos.length },
    { key: "estancados", label: "Estancados", count: objetivosEstancados.length },
    { key: "tutors", label: "Tutores AIRA", count: tutorsVencidos.length },
  ];

  // ── Shared mini row ────────────────────────────────────────────────────────
  const AlertRow = ({ child, sub, subColor }) => (
    <div onClick={() => onOpenChild(child.id)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", cursor: "pointer", borderBottom: `1px solid ${T.borderSoft}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: child.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
        {child.name[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{child.name} {child.lastName}</div>
        {sub && <div style={{ fontSize: 11.5, color: subColor || T.amberDeep }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 20px 60px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em" }}>
          Hola, {user.name.split(" ")[0]}
        </div>
        <div style={{ color: T.inkSoft, fontSize: 14, marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            background: `${T.brandBright}22`, color: T.brandBright, fontSize: 11.5, fontWeight: 600,
            padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em", textTransform: "uppercase",
          }}>Directora Clínica</span>
          <span style={{ color: T.borderSoft }}>·</span>
          <span>{user.specialty}</span>
        </div>
      </div>

      {/* Stat strip */}
      <Card style={{ padding: 0, marginBottom: 28, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
          {[
            { label: "Pacientes activos", value: children.length, sub: `${allSpecialistsAndDir.length} especialistas`, tab: null },
            { label: "Sesiones este mes", value: sessions.filter(s => s.date && s.date.slice(0,7) === TODAY.slice(0,7)).length, sub: `${sessions.length} en total`, tab: null },
            { label: "Inactivos +14 días", value: inactivosPorEsp.reduce((a,x)=>a+x.inactive.length,0), warn: inactivosPorEsp.reduce((a,x)=>a+x.inactive.length,0)>0, tab: "inactivos" },
            { label: "Paquetes por vencer", value: proximosPaquete.length, warn: proximosPaquete.length>0, tab: "paquete" },
            { label: "Sin objetivos", value: sinObjetivos.length, warn: sinObjetivos.length>0, tab: "objetivos" },
          ].map((it, i) => (
            <div key={it.label}
              onClick={it.tab ? () => setAlertTab(it.tab) : undefined}
              style={{
                padding: "18px 20px", cursor: it.tab ? "pointer" : "default",
                borderLeft: i > 0 ? `1px solid ${T.borderSoft}` : "none",
                background: it.warn ? `${T.amber}10` : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={it.tab ? (e) => { e.currentTarget.style.background = it.warn ? `${T.amber}20` : T.surfaceSunk; } : undefined}
              onMouseLeave={it.tab ? (e) => { e.currentTarget.style.background = it.warn ? `${T.amber}10` : "transparent"; } : undefined}
            >
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500, color: it.warn ? T.amberDeep : T.ink, lineHeight: 1 }}>{it.value}</div>
              <div style={{ fontSize: 12, color: it.warn ? T.amberDeep : T.inkSoft, marginTop: 5, fontWeight: it.warn ? 600 : 400 }}>{it.label}</div>
              {it.sub && <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{it.sub}</div>}
              {it.tab && it.value > 0 && <div style={{ fontSize: 10.5, color: T.brand, marginTop: 4, fontWeight: 600 }}>Ver alertas →</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Live calendar */}
      <CalendarAgenda
        events={calendarEvents} loading={calendarLoading} error={calendarError}
        date={calendarDate} onDateChange={onCalendarDateChange}
        children={children} onOpenChild={onOpenChild} onConnectGcal={onConnectGcal}
      />
      <ActivityFeed activityLog={activityLog} users={users} onMarkSeen={onMarkSeen} />

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 24, alignItems: "start" }}>

        {/* Left: all patients */}
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: "absolute", left: 13, top: 12, color: T.inkFaint }} />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar paciente..."
                style={{
                  width: "100%", padding: "10px 14px 10px 38px", borderRadius: 12,
                  border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif",
                  background: "#fff", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <select
              value={filterSpecialty} onChange={(e) => setFilterSpecialty(e.target.value)}
              style={{
                padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.border}`,
                fontSize: 13.5, fontFamily: "Inter, sans-serif", background: "#fff",
                color: T.ink, outline: "none", cursor: "pointer",
              }}
            >
              {allSpecialties.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <Eyebrow>Todos los pacientes ({filtered.length})</Eyebrow>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: T.inkFaint }}>No se encontraron pacientes.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filtered.map((c) => (
                <ChildCard key={c.id} child={c} users={users} sessions={sessions} onOpen={() => onOpenChild(c.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* My sessions today */}
          {myToday.length > 0 && (
            <Card>
              <Eyebrow style={{ marginBottom: 12 }}>Mis sesiones hoy</Eyebrow>
              {myToday.map((c) => (
                <div key={c.id} onClick={() => onOpenChild(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderBottom: `1px solid ${T.borderSoft}` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: c.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{c.name} {c.lastName}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{c.nextSessionTime}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Alertas clínicas con tabs */}
          <Card style={{ borderLeft: `4px solid ${T.amber}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Eyebrow>Alertas clínicas</Eyebrow>
              <span style={{
                background: T.amberDeep, color: "#fff", fontSize: 11, fontWeight: 700,
                padding: "2px 8px", borderRadius: 20,
              }}>{totalAlertas}</span>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
              {ALERT_TABS.map((t) => (
                <button key={t.key} onClick={() => setAlertTab(t.key)}
                  style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                    border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
                    background: alertTab === t.key ? T.amberDeep : T.bg,
                    color: alertTab === t.key ? "#fff" : T.inkSoft,
                    outline: "none",
                  }}>
                  {t.label} {t.count > 0 && <span style={{ opacity: 0.8 }}>({t.count})</span>}
                </button>
              ))}
            </div>

            {/* Tab content */}

            {alertTab === "inactivos" && (
              inactivosPorEsp.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Todos activos</div>
                : inactivosPorEsp.map(({ sp, inactive }) => (
                  <div key={sp.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                      {sp.name.split(" ")[0]}
                    </div>
                    {inactive.map((c) => (
                      <AlertRow key={c.id} child={c}
                        sub={c.daysSince !== null ? `Hace ${c.daysSince} días` : "Sin sesiones registradas"} />
                    ))}
                  </div>
                ))
            )}

            {alertTab === "paquete" && (
              <div>
                {proximosPaquete.length > 0 && (
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.amberDeep, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>⚠ Por vencer</div>
                )}
                {todosConPaquete.length === 0
                  ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Sin paquetes activos</div>
                  : todosConPaquete.map((c) => {
                    const pct = (c.enPaquete / PAQUETE_SIZE) * 100;
                    const barColor = c.enPaquete >= 6 ? T.amberDeep : c.enPaquete >= 4 ? T.amber : "#81C784";
                    return (
                      <div key={c.id} onClick={() => onOpenChild(c.id)}
                        style={{ padding: "9px 0", cursor: "pointer", borderBottom: `1px solid ${T.borderSoft}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{c.name} {c.lastName}</div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: barColor }}>{c.enPaquete}/{PAQUETE_SIZE}</div>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: T.borderSoft, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 0.3s" }} />
                        </div>
                        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 3 }}>
                          Paquete {c.paqueteNum} · {c.sessionCount} sesiones en total
                          {c.enPaquete >= 6 && <span style={{ color: T.amberDeep, fontWeight: 600 }}> — renovar o cerrar</span>}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {alertTab === "reportes" && (
              sinReportePadres.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Al día</div>
                : sinReportePadres.map((c) => {
                  const count = sessions.filter((s) => s.childId === c.id).length;
                  return (
                    <AlertRow key={c.id} child={c}
                      sub={`${count} sesiones — generar reporte para padres`}
                      subColor="#9A6B9A" />
                  );
                })
            )}

            {alertTab === "objetivos" && (
              sinObjetivos.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Todos tienen objetivos</div>
                : sinObjetivos.map((c) => (
                  <AlertRow key={c.id} child={c} sub="Sin objetivos definidos" subColor={T.amberDeep} />
                ))
            )}

            {alertTab === "estancados" && (
              objetivosEstancados.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Sin objetivos estancados</div>
                : objetivosEstancados.map((o) => {
                  const child = children.find((c) => c.id === o.childId);
                  if (!child) return null;
                  return (
                    <div key={o.id} onClick={() => onOpenChild(child.id)}
                      style={{ padding: "7px 0", cursor: "pointer", borderBottom: `1px solid ${T.borderSoft}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{child.name} {child.lastName}</div>
                      <div style={{ fontSize: 11.5, color: "#B56060" }}>"{o.name}" — sin avance en últimas sesiones</div>
                    </div>
                  );
                })
            )}

            {alertTab === "tutors" && (
              tutorsVencidos.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Todos los tutors al día</div>
                : tutorsVencidos.map(({ sh, childObj, daysSince }) => (
                  <div key={sh.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{sh.name}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{childObj ? `${childObj.name} ${childObj.lastName}` : "—"} · {sh.school}</div>
                    <div style={{ fontSize: 11.5, color: T.amberDeep, marginTop: 2 }}>
                      {daysSince !== null ? `Último reporte hace ${daysSince} días` : "Sin reportes aún"}
                    </div>
                  </div>
                ))
            )}
          </Card>

          {/* Equipo clínico */}
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>Equipo clínico</Eyebrow>
            {allSpecialistsAndDir.map((sp) => {
              const count = children.filter((c) => c.assignedSpecialists.includes(sp.id)).length;
              return (
                <div key={sp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: sp.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {sp.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{sp.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 11.5, color: T.inkSoft }}>{sp.specialty.split("·")[0].trim()}</div>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.inkSoft }}>{count}</div>
                </div>
              );
            })}
          </Card>

        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SHADOW HOME — reporte quincenal
============================================================ */
function TutorAiraHome({ user, children, users, objectives, tutorReports, onOpenChild, onAddTutorReport }) {
  const child = children.find((c) => c.id === user.assignedChildId);
  const myReports = tutorReports.filter((r) => r.shadowId === user.id).sort((a, b) => b.date.localeCompare(a.date));
  const lastReport = myReports[0];
  const daysSince = lastReport ? Math.floor((new Date(TODAY) - new Date(lastReport.date)) / 86400000) : null;
  const dueAlert = daysSince === null || daysSince >= 15;

  const childObjectives = objectives.filter((o) => o.childId === user.assignedChildId);
  const [form, setForm] = useState(null);
  const [sent, setSent] = useState(false);

  const emptyForm = () => ({
    logros: "", dificultades: "", solicitudes: "",
    objetivoStatus: Object.fromEntries(childObjectives.map((o) => [o.id, "proceso"])),
  });

  const handleSubmit = () => {
    const report = {
      id: `sr-${Date.now()}`, shadowId: user.id, childId: user.assignedChildId,
      date: TODAY, school: user.school,
      logros: form.logros, dificultades: form.dificultades, solicitudes: form.solicitudes,
      objetivoStatus: form.objetivoStatus,
    };
    onAddTutorReport(report);
    setForm(null);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const STATUS_OPTS = [
    { val: "logrado", label: "✅ Logrado" },
    { val: "proceso", label: "🟡 En proceso" },
    { val: "apoyo", label: "🔴 Necesita apoyo" },
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, color: T.ink }}>
          Hola, {user.name.split(" ")[0]}
        </div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4 }}>
          Tutor AIRA · {user.school}
        </div>
      </div>

      {/* Child card */}
      {child && (
        <Card style={{ marginBottom: 22, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
          onClick={() => onOpenChild(child.id)}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: child.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {child.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, color: T.ink }}>{child.name} {child.lastName}</div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>{child.specialties.join(" · ")}</div>
          </div>
          <div style={{ fontSize: 12.5, color: T.brand, fontWeight: 600 }}>Ver expediente →</div>
        </Card>
      )}

      {/* Due alert */}
      {dueAlert && !form && (
        <div style={{
          background: `${T.amber}18`, border: `1.5px solid ${T.amber}`, borderRadius: 14,
          padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.amberDeep }}>
              {daysSince === null ? "Aún no has enviado ningún reporte" : `Reporte vencido — hace ${daysSince} días`}
            </div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>El reporte quincenal está pendiente</div>
          </div>
          <button onClick={() => setForm(emptyForm())} style={{
            background: T.amberDeep, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap",
          }}>Llenar ahora</button>
        </div>
      )}

      {sent && (
        <div style={{ background: "#E8F5E9", border: "1.5px solid #81C784", borderRadius: 14, padding: "14px 20px", marginBottom: 20, color: "#2E7D32", fontWeight: 600, fontSize: 14 }}>
          ✓ Reporte enviado correctamente. Gracias.
        </div>
      )}

      {/* Report form */}
      {form && (
        <Card style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, color: T.ink, marginBottom: 20 }}>
            Reporte quincenal — {fmtDate(TODAY)}
          </div>

          {childObjectives.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado de objetivos</div>
              {childObjectives.map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13.5, color: T.ink, flex: 1, minWidth: 180 }}>{o.name}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {STATUS_OPTS.map((s) => (
                      <button key={s.val} onClick={() => setForm({ ...form, objetivoStatus: { ...form.objetivoStatus, [o.id]: s.val } })}
                        style={{
                          padding: "5px 10px", borderRadius: 20, fontSize: 11.5, border: "none", cursor: "pointer",
                          fontFamily: "Inter, sans-serif", fontWeight: 600,
                          background: form.objetivoStatus[o.id] === s.val ? T.brand : T.bg,
                          color: form.objetivoStatus[o.id] === s.val ? "#fff" : T.inkSoft,
                        }}>{s.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {[
            { key: "logros", label: "Logros observados en el período", placeholder: "Describe los avances y comportamientos positivos..." },
            { key: "dificultades", label: "Dificultades observadas", placeholder: "Describe los retos que presentó en el aula o recreo..." },
            { key: "solicitudes", label: "Solicitudes al equipo AIRA", placeholder: "¿Qué necesitas del equipo terapéutico? Estrategias, materiales, coordinación..." },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              <textarea
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.border}`,
                  fontSize: 14, fontFamily: "Inter, sans-serif", resize: "vertical", boxSizing: "border-box",
                  outline: "none", color: T.ink, background: "#fff",
                }}
              />
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setForm(null)} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 14, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleSubmit} disabled={!form.logros.trim()} style={{
              padding: "10px 22px", borderRadius: 10, border: "none", background: T.brand, color: "#fff",
              fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer",
              opacity: !form.logros.trim() ? 0.5 : 1,
            }}>Enviar reporte</button>
          </div>
        </Card>
      )}

      {/* Button to open form if not due */}
      {!dueAlert && !form && (
        <div style={{ marginBottom: 22 }}>
          <button onClick={() => setForm(emptyForm())} style={{
            background: T.brand, color: "#fff", border: "none", borderRadius: 12, padding: "11px 20px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>+ Nuevo reporte quincenal</button>
        </div>
      )}

      {/* History */}
      {myReports.length > 0 && (
        <div>
          <Eyebrow style={{ marginBottom: 14 }}>Reportes anteriores</Eyebrow>
          {myReports.map((r) => (
            <Card key={r.id} style={{ marginBottom: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{fmtDate(r.date)}</div>
                <div style={{ fontSize: 12, color: T.inkSoft }}>{r.school}</div>
              </div>
              {r.logros && <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 6 }}><b style={{ color: T.ink }}>Logros:</b> {r.logros}</div>}
              {r.dificultades && <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 6 }}><b style={{ color: T.ink }}>Dificultades:</b> {r.dificultades}</div>}
              {r.solicitudes && <div style={{ fontSize: 13.5, color: T.inkSoft }}><b style={{ color: T.ink }}>Solicitudes:</b> {r.solicitudes}</div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   GABINETE EXTERNO
============================================================ */
function GabinetePanel({ schools, users, gabineteSessions, onAddSession, onAddSchool }) {
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [addingSchool, setAddingSchool] = useState(false);
  const [sessionForm, setSessionForm] = useState(null);
  const [newSchool, setNewSchool] = useState({ name: "", contact: "", phone: "", email: "", contractStart: "", contractEnd: "", specialty: "", assignedSpecialists: [], notes: "" });

  const school = schools.find((s) => s.id === selectedSchool) || schools[0] || null;
  const schoolSessions = school ? gabineteSessions.filter((s) => s.schoolId === school.id).sort((a, b) => b.date.localeCompare(a.date)) : [];

  const allSpecialists = users.filter((u) => ROLES[u.role]?.esClinico);

  const emptySession = () => ({ specialistId: "", specialty: "", date: TODAY, participants: "", duration: 60, area: "", notes: "" });

  const handleSaveSession = () => {
    onAddSession({ id: `gs-${Date.now()}`, schoolId: school.id, ...sessionForm });
    setSessionForm(null);
  };

  const handleSaveSchool = () => {
    onAddSchool({ id: `sch-${Date.now()}`, ...newSchool, students: [] });
    setAddingSchool(false);
    setNewSchool({ name: "", contact: "", phone: "", email: "", contractStart: "", contractEnd: "", specialty: "", assignedSpecialists: [], notes: "" });
  };

  const Field2 = ({ label, value, onChange, type = "text" }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", boxSizing: "border-box", outline: "none" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500, color: T.ink }}>Gabinete Externo</div>
          <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4 }}>{schools.length} escuela{schools.length !== 1 ? "s" : ""} con contrato activo</div>
        </div>
        <button onClick={() => setAddingSchool(true)} style={{
          background: T.brand, color: "#fff", border: "none", borderRadius: 12, padding: "11px 20px",
          fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
        }}>+ Agregar escuela</button>
      </div>

      {/* Add school modal */}
      {addingSchool && (
        <Card style={{ marginBottom: 24, borderLeft: `4px solid ${T.brand}` }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.ink, marginBottom: 18 }}>Nueva escuela</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Field2 label="Nombre del colegio" value={newSchool.name} onChange={(v) => setNewSchool({ ...newSchool, name: v })} />
            <Field2 label="Contacto" value={newSchool.contact} onChange={(v) => setNewSchool({ ...newSchool, contact: v })} />
            <Field2 label="Teléfono" value={newSchool.phone} onChange={(v) => setNewSchool({ ...newSchool, phone: v })} />
            <Field2 label="Email" value={newSchool.email} onChange={(v) => setNewSchool({ ...newSchool, email: v })} type="email" />
            <Field2 label="Inicio de contrato" value={newSchool.contractStart} onChange={(v) => setNewSchool({ ...newSchool, contractStart: v })} type="date" />
            <Field2 label="Fin de contrato" value={newSchool.contractEnd} onChange={(v) => setNewSchool({ ...newSchool, contractEnd: v })} type="date" />
          </div>
          <Field2 label="Especialidades contratadas" value={newSchool.specialty} onChange={(v) => setNewSchool({ ...newSchool, specialty: v })} />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Especialistas asignados</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allSpecialists.map((sp) => {
                const sel = newSchool.assignedSpecialists.includes(sp.id);
                return (
                  <button key={sp.id} onClick={() => setNewSchool({ ...newSchool, assignedSpecialists: sel ? newSchool.assignedSpecialists.filter((x) => x !== sp.id) : [...newSchool.assignedSpecialists, sp.id] })}
                    style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600, background: sel ? T.brand : T.bg, color: sel ? "#fff" : T.inkSoft }}>
                    {sp.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notas del contrato</div>
            <textarea value={newSchool.notes} onChange={(e) => setNewSchool({ ...newSchool, notes: e.target.value })} rows={2}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setAddingSchool(false)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 13.5, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleSaveSchool} disabled={!newSchool.name.trim()} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: T.brand, color: "#fff", fontSize: 13.5, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", opacity: !newSchool.name.trim() ? 0.5 : 1 }}>Guardar escuela</button>
          </div>
        </Card>
      )}

      {schools.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: T.inkFaint }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏫</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.inkSoft, marginBottom: 8 }}>Ninguna escuela registrada aún</div>
          <div style={{ fontSize: 13.5 }}>Agrega la primera escuela con el botón de arriba</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>
          {/* School list */}
          <div>
            <Eyebrow style={{ marginBottom: 10 }}>Escuelas</Eyebrow>
            {schools.map((s) => (
              <div key={s.id} onClick={() => setSelectedSchool(s.id)}
                style={{
                  padding: "14px 16px", borderRadius: 13, marginBottom: 8, cursor: "pointer",
                  background: (school && school.id === s.id) ? T.brand : "#fff",
                  border: `1px solid ${(school && school.id === s.id) ? T.brand : T.border}`,
                  boxShadow: T.shadow,
                }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: (school && school.id === s.id) ? "#fff" : T.ink }}>{s.name}</div>
                <div style={{ fontSize: 12, color: (school && school.id === s.id) ? "rgba(255,255,255,0.75)" : T.inkSoft, marginTop: 3 }}>{s.specialty || "Sin especialidad definida"}</div>
              </div>
            ))}
          </div>

          {/* School detail */}
          {school && (
            <div>
              <Card style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color: T.ink }}>{school.name}</div>
                    <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>{school.contact}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {school.phone && <a href={`tel:${school.phone}`} style={{ fontSize: 12.5, color: T.brand, textDecoration: "none", fontWeight: 600 }}>📞 {school.phone}</a>}
                    {school.email && <a href={`mailto:${school.email}`} style={{ fontSize: 12.5, color: T.brand, textDecoration: "none", fontWeight: 600 }}>✉ {school.email}</a>}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
                  {[
                    { label: "Contrato desde", value: school.contractStart ? fmtDate(school.contractStart) : "—" },
                    { label: "Contrato hasta", value: school.contractEnd ? fmtDate(school.contractEnd) : "—" },
                    { label: "Sesiones realizadas", value: gabineteSessions.filter((s) => s.schoolId === school.id).length },
                  ].map((it) => (
                    <div key={it.label} style={{ background: T.surfaceSunk, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 4 }}>{it.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>{it.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Especialistas asignados</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(school.assignedSpecialists || []).map((sid) => {
                      const sp = users.find((u) => u.id === sid);
                      if (!sp) return null;
                      return (
                        <span key={sid} style={{ display: "flex", alignItems: "center", gap: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 13 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: sp.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{sp.name[0]}</div>
                          {sp.name.split(" ")[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {school.notes && <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 10, fontStyle: "italic" }}>{school.notes}</div>}
              </Card>

              {/* Sessions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <Eyebrow>Sesiones de gabinete</Eyebrow>
                <button onClick={() => setSessionForm(emptySession())} style={{
                  background: T.brand, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>+ Registrar sesión</button>
              </div>

              {sessionForm && (
                <Card style={{ marginBottom: 16, borderLeft: `3px solid ${T.brand}` }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ink, marginBottom: 16 }}>Nueva sesión — {school.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha</div>
                      <input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", boxSizing: "border-box", outline: "none" }} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Especialista</div>
                      <select value={sessionForm.specialistId} onChange={(e) => setSessionForm({ ...sessionForm, specialistId: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", boxSizing: "border-box", outline: "none" }}>
                        <option value="">Seleccionar...</option>
                        {allSpecialists.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Participantes / grupo</div>
                    <input value={sessionForm.participants} onChange={(e) => setSessionForm({ ...sessionForm, participants: e.target.value })} placeholder="Ej: Grupo 3ro primaria, 12 niños"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Área trabajada</div>
                    <input value={sessionForm.area} onChange={(e) => setSessionForm({ ...sessionForm, area: e.target.value })} placeholder="Ej: Regulación emocional, Habilidades sociales..."
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Observaciones</div>
                    <textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={3} placeholder="Notas, resultados, próximos pasos..."
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => setSessionForm(null)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 13.5, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>Cancelar</button>
                    <button onClick={handleSaveSession} disabled={!sessionForm.date || !sessionForm.specialistId} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: T.brand, color: "#fff", fontSize: 13.5, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", opacity: (!sessionForm.date || !sessionForm.specialistId) ? 0.5 : 1 }}>Guardar sesión</button>
                  </div>
                </Card>
              )}

              {schoolSessions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: T.inkFaint, fontSize: 13.5 }}>Ninguna sesión registrada aún</div>
              ) : (
                schoolSessions.map((s) => {
                  const sp = users.find((u) => u.id === s.specialistId);
                  return (
                    <Card key={s.id} style={{ marginBottom: 10, padding: "14px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: s.notes ? 8 : 0 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{fmtDate(s.date)}</div>
                          <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{sp ? sp.name : "—"} · {s.area || "Sin área especificada"}</div>
                          {s.participants && <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 1 }}>{s.participants}</div>}
                        </div>
                      </div>
                      {s.notes && <div style={{ fontSize: 13.5, color: T.inkSoft }}>{s.notes}</div>}
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ACTIVITY FEED — alertas en tiempo real para Sarita e Idaira
============================================================ */
function ActivityFeed({ activityLog, users, onMarkSeen }) {
  const recent = activityLog.slice(0, 20);
  const unseen = activityLog.filter(a => !a.seen).length;

  const TYPE_ICON = { session: "🗒", document: "📄", objective: "🎯", meeting: "🤝" };

  const timeAgo = (ts) => {
    const mins = Math.floor((new Date() - new Date(ts)) / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs/24)}d`;
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Eyebrow>Actividad reciente</Eyebrow>
          {unseen > 0 && (
            <span style={{ background:T.brand, color:"#fff", fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:20 }}>{unseen}</span>
          )}
        </div>
        {unseen > 0 && (
          <button onClick={onMarkSeen} style={{ background:"none", border:"none", fontSize:12, color:T.brand, cursor:"pointer", fontFamily:"Inter, sans-serif", fontWeight:600 }}>
            Marcar todo como visto
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div style={{ fontSize:13, color:T.inkFaint, padding:"12px 0", textAlign:"center" }}>Sin actividad reciente</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column" }}>
          {recent.map((act, i) => {
            const sp = users.find(u => u.id === act.specialistId);
            return (
              <div key={act.id} style={{
                display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0",
                borderBottom: i < recent.length-1 ? `1px solid ${T.borderSoft}` : "none",
                opacity: act.seen ? 0.6 : 1,
              }}>
                <div style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{TYPE_ICON[act.type] || "📌"}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>
                    {act.childName}
                    {!act.seen && <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.brand, marginLeft:6, verticalAlign:"middle" }} />}
                  </div>
                  <div style={{ fontSize:12, color:T.inkSoft, marginTop:1 }}>
                    {act.description} · {sp ? sp.name.split(" ")[0] : "—"}
                  </div>
                </div>
                <div style={{ fontSize:11, color:T.inkFaint, flexShrink:0, whiteSpace:"nowrap" }}>{timeAgo(act.timestamp)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   ADMIN DASHBOARD
============================================================ */
function StatStrip({ items }) {
  return (
    <Card style={{ padding: 0, marginBottom: 28, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((it, i) => (
          <div key={it.label} style={{
            padding: "20px 22px", borderLeft: i > 0 ? `1px solid ${T.borderSoft}` : "none",
          }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, color: T.ink, lineHeight: 1 }}>{it.value}</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 7 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminDashboard({ children, users, sessions, objectives, parentReports, onOpenChild, calendarEvents, calendarLoading, calendarError, calendarDate, onCalendarDateChange, activityLog, onMarkSeen, onConnectGcal, currentUser, onAddChild }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const specialists = users.filter((u) => ROLES[u.role]?.esClinico);
  const today = TODAY;
  const sessionsToday = sessions.filter((s) => s.date === today).length;
  const childrenNoRecentSession = children.filter((c) => {
    const last = sessions.filter((s) => s.childId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!last) return true;
    const daysDiff = (new Date(today) - new Date(last.date)) / 86400000;
    return daysDiff > 7;
  });
  const scheduledToday = children
    .filter((c) => c.nextSession === today)
    .sort((a, b) => (a.nextSessionTime || "").localeCompare(b.nextSessionTime || ""));

  const childrenReadyForParentReport = children.filter((c) => {
    const sinceLast = sessionsSinceLastParentReport(c.id, sessions, parentReports);
    return sinceLast.length >= 8;
  });

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 20px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em" }}>
          Panel administrativo
        </div>
        <div style={{ color: T.inkSoft, fontSize: 14.5, marginTop: 5 }}>
          Vista general de AIRA Learning Hub
        </div>
      </div>

      <StatStrip items={[
        { label: "Pacientes activos", value: children.length },
        { label: "Especialistas", value: specialists.length },
        { label: "Sesiones hoy", value: scheduledToday.length },
        { label: "Sesiones registradas", value: sessions.length },
      ]} />

      <CalendarAgenda
        events={calendarEvents} loading={calendarLoading} error={calendarError}
        date={calendarDate} onDateChange={onCalendarDateChange}
        children={children} onOpenChild={onOpenChild} onConnectGcal={onConnectGcal}
      />

      {sessions.length > 0 && (childrenNoRecentSession.length > 0 || childrenReadyForParentReport.length > 0) && (
        <Card style={{ padding: 18, marginBottom: 28, borderColor: T.apoyoTint, background: T.apoyoTint }}>
          <button onClick={() => setAlertsOpen(a => !a)} style={{ display: "flex", alignItems: "center", gap: 8, color: T.apoyo, fontWeight: 700, fontSize: 13.5, marginBottom: alertsOpen ? 10 : 0, background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
            <AlertTriangle size={16} />
            Alertas
            <span style={{ fontSize: 12, background: T.apoyo, color: "#fff", borderRadius: 10, padding: "1px 7px", marginLeft: 2 }}>{childrenNoRecentSession.length + childrenReadyForParentReport.length}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: T.apoyo }}>{alertsOpen ? "▲ Minimizar" : "▼ Ver"}</span>
          </button>
          {alertsOpen && (
            <div style={{ fontSize: 14, color: T.ink }}>
              {childrenNoRecentSession.map((c) => (
                <div key={c.id} style={{ padding: "6px 0" }}>
                  <b>{c.name} {c.lastName}</b> no tiene sesiones registradas en los últimos 7 días.
                </div>
              ))}
              {childrenReadyForParentReport.map((c) => (
                <div key={c.id} style={{ padding: "6px 0" }}>
                  <b>{c.name} {c.lastName}</b> acumuló 8 sesiones desde el último reporte a padres — listo para generar uno nuevo.
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {scheduledToday.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <Eyebrow>Agenda de hoy</Eyebrow>
          <Card style={{ padding: 6 }}>
            {scheduledToday.map((c, i) => {
              const specs = c.assignedSpecialists.map((id) => users.find((u) => u.id === id)?.name.split(" ")[0]).join(", ");
              return (
                <button key={c.id} onClick={() => onOpenChild(c.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
                  border: "none", borderTop: i > 0 ? `1px solid ${T.border}` : "none", background: "transparent",
                  cursor: "pointer", textAlign: "left",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceSunk)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar name={c.name + " " + c.lastName} bg={c.avatarBg} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{c.name} {c.lastName}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{specs}</div>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: T.brand }}>
                    <Clock size={12} /> {c.nextSessionTime || "Sin horario"}
                  </span>
                </button>
              );
            })}
          </Card>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Eyebrow style={{ margin: 0 }}>Todos los pacientes</Eyebrow>
            {onAddChild && (
              <Btn variant="amber" size="sm" icon={Plus} onClick={() => setShowAddPatient(true)}>Agregar paciente</Btn>
            )}
          </div>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              type="text" placeholder="Buscar paciente..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", color: T.ink, background: "#fff" }}
              onFocus={(e) => e.target.style.borderColor = T.brand}
              onBlur={(e) => e.target.style.borderColor = T.border}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.inkFaint, fontSize: 15, pointerEvents: "none" }}>🔍</span>
          </div>
          <Card style={{ padding: 6 }}>
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q ? children.filter(c =>
                (c.name + " " + c.lastName).toLowerCase().includes(q) ||
                c.lastName.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q)
              ) : children;
              if (filtered.length === 0) return <div style={{ padding: "16px 12px", color: T.inkFaint, fontSize: 13.5 }}>Sin resultados para "{searchQuery}"</div>;
              return filtered.map((c, i) => {
                const specs = c.assignedSpecialists.map((id) => users.find((u) => u.id === id)?.name.split(" ")[0]).join(", ");
                return (
                  <button key={c.id} onClick={() => onOpenChild(c.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
                    border: "none", borderTop: i > 0 ? `1px solid ${T.borderSoft}` : "none", background: "transparent",
                    cursor: "pointer", textAlign: "left",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceSunk)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Avatar name={c.name + " " + c.lastName} bg={c.avatarBg} size={38} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: T.ink }}>{c.name} {c.lastName}</div>
                      <div style={{ fontSize: 12, color: T.inkFaint }}>{specs}</div>
                    </div>
                    <ChevronRight size={16} color={T.inkFaint} />
                  </button>
                );
              });
            })()}
          </Card>
        </div>
        <div>
          <Eyebrow>Especialistas</Eyebrow>
          <Card style={{ padding: 6 }}>
            {specialists.map((u, i) => (
              <div key={u.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
                borderTop: i > 0 ? `1px solid ${T.borderSoft}` : "none",
              }}>
                <Avatar name={u.name} bg={u.avatarBg} size={38} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: T.ink }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: T.inkFaint }}>{u.specialty}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {showAddPatient && onAddChild && (
        <AddPatientWizard
          users={users}
          currentUser={currentUser}
          onClose={() => setShowAddPatient(false)}
          onCreate={(child, anamnesisDoc) => {
            onAddChild(child, anamnesisDoc);
            setShowAddPatient(false);
            onOpenChild(child.id);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   DAILY REPORT (auto-generated from a session)
============================================================ */
function DailyReport({ session, child, specialist, objectives, printable }) {
  const worked = session.objectivesWorked.map((ow) => ({
    ...ow,
    objective: objectives.find((o) => o.id === ow.objectiveId),
  })).filter((w) => w.objective);

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {!printable && (
        <div style={{
          fontSize: 11.5, fontWeight: 700, color: T.amberDeep, background: T.amberTint,
          display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
          borderRadius: 999, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          <Sparkles size={12} /> Generado automáticamente
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", marginBottom: 20 }}>
        <Field label="Paciente" value={`${child.name} ${child.lastName}`} />
        <Field label="Fecha" value={fmtDate(session.date)} />
        <Field label="Especialista" value={specialist?.name || "—"} />
        <Field label="Especialidad" value={session.specialty} />
      </div>

      <Section title="Objetivos trabajados">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {worked.map((w) => (
            <span key={w.objectiveId} style={{
              fontSize: 13, fontWeight: 600, color: T.brand, background: T.brandTint,
              padding: "5px 11px", borderRadius: 999,
            }}>{w.objective.name}</span>
          ))}
        </div>
      </Section>

      <Section title="Actividades realizadas">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {session.activities.map((a) => (
            <span key={a} style={{
              fontSize: 13, fontWeight: 600, color: T.inkSoft, background: T.surfaceSunk,
              padding: "5px 11px", borderRadius: 999,
            }}>{a}</span>
          ))}
        </div>
      </Section>

      <Section title="Desempeño">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {worked.map((w) => (
            <div key={w.objectiveId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, color: T.ink }}>{w.objective.name}</span>
              <StatusPill status={w.status} />
            </div>
          ))}
        </div>
      </Section>

      {session.observation && (
        <Section title="Observaciones">
          <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.6, margin: 0 }}>{session.observation}</p>
        </Section>
      )}

      {session.nextSteps && (
        <Section title="Continuar trabajando" last>
          <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>{session.nextSteps}</p>
        </Section>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ fontSize: 11.5, color: T.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 14.5, color: T.ink, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Section({ title, children, last }) {
  return (
    <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 9 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   MODAL wrapper
============================================================ */
function Modal({ children, onClose, width = 560 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(21,47,54,0.45)", zIndex: 100,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "40px 20px", overflowY: "auto",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: width,
          boxShadow: "0 20px 60px rgba(21,47,54,0.25)", overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "20px 24px", borderBottom: `1px solid ${T.border}`,
    }}>
      <div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600, color: T.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{
        border: "none", background: T.surfaceSunk, borderRadius: 10, width: 32, height: 32,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.inkSoft, flexShrink: 0,
      }}>
        <X size={16} />
      </button>
    </div>
  );
}

function DailyReportModal({ session, child, specialist, objectives, onClose }) {
  return (
    <Modal onClose={onClose} width={600}>
      <ModalHeader title="Reporte diario" subtitle={fmtDate(session.date)} onClose={onClose} />
      <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
        <DailyReport session={session} child={child} specialist={specialist} objectives={objectives} />
      </div>
    </Modal>
  );
}

/* ============================================================
   CHILD PROFILE
============================================================ */
function ObjectivesList({ objectives, compact, onUpdate, onAdd, onDelete, defaultArea }) {
  const [editing, setEditing] = useState(null); // obj id being edited
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState(defaultArea || "");

  const STATUS_OPTS = [
    { val: "logrado", label: "✅ Logrado" },
    { val: "proceso", label: "🟡 En proceso" },
    { val: "apoyo", label: "🔴 Necesita apoyo" },
  ];

  const startEdit = (o) => { setEditing(o.id); setEditName(o.name); };
  const saveEdit = (o) => { if (onUpdate && editName.trim()) onUpdate({ ...o, name: editName.trim() }); setEditing(null); };

  const handleAdd = () => {
    if (onAdd && newName.trim()) {
      onAdd({ name: newName.trim(), area: newArea.trim() || "General" });
      setNewName(""); setNewArea(""); setAdding(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 0 }}>
        {objectives.map((o, i) => (
          <div key={o.id} style={{
            display: "flex", alignItems: "center", gap: 13, padding: compact ? "6px 0" : "13px 0",
            borderTop: !compact && i > 0 ? `1px solid ${T.border}` : "none",
          }}>
            <StatusRing status={o.status} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing === o.id ? (
                <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(o); if (e.key === "Escape") setEditing(null); }}
                  style={{ width: "100%", padding: "4px 8px", borderRadius: 7, border: `1.5px solid ${T.brand}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                />
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: T.ink }}>{o.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft }}>{o.area}</div>
                </>
              )}
            </div>

            {/* Status selector */}
            {onUpdate && !compact && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {STATUS_OPTS.map((s) => (
                  <button key={s.val} onClick={() => onUpdate({ ...o, status: s.val })}
                    title={s.label}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: "none", cursor: "pointer",
                      background: o.status === s.val ? (s.val === "logrado" ? "#81C784" : s.val === "proceso" ? T.amber : "#E57373") : T.bg,
                      fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      outline: o.status === s.val ? `2px solid ${s.val === "logrado" ? "#43A047" : s.val === "proceso" ? T.amberDeep : "#C62828"}` : "none",
                    }}>
                    {s.val === "logrado" ? "✅" : s.val === "proceso" ? "🟡" : "🔴"}
                  </button>
                ))}
              </div>
            )}

            {!compact && onUpdate && (
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {editing === o.id ? (
                  <>
                    <button onClick={() => saveEdit(o)} style={{ background: T.brand, color: "#fff", border: "none", borderRadius: 7, padding: "3px 8px", fontSize: 11.5, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✓</button>
                    <button onClick={() => setEditing(null)} style={{ background: T.bg, color: T.inkSoft, border: `1px solid ${T.border}`, borderRadius: 7, padding: "3px 8px", fontSize: 11.5, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✕</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(o)} style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Editar nombre">✎</button>
                    {onDelete && <button onClick={() => onDelete(o.id)} style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Eliminar">🗑</button>}
                  </>
                )}
              </div>
            )}

            {compact && <StatusPill status={o.status} />}
          </div>
        ))}
      </div>

      {/* Add objective */}
      {onAdd && !compact && (
        <div style={{ marginTop: 14 }}>
          {adding ? (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 180 }}>
                <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 3 }}>Nombre del objetivo</div>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Regulación emocional"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${T.brand}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 3 }}>Área</div>
                <input value={newArea} onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Ej: Psicología"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleAdd} disabled={!newName.trim()} style={{ background: T.brand, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", opacity: !newName.trim() ? 0.5 : 1 }}>Agregar</button>
                <button onClick={() => { setAdding(false); setNewName(""); setNewArea(""); }} style={{ background: T.bg, color: T.inkSoft, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ background: "none", border: `1.5px dashed ${T.border}`, borderRadius: 10, padding: "8px 16px", fontSize: 13, color: T.inkSoft, cursor: "pointer", fontFamily: "Inter, sans-serif", width: "100%", textAlign: "center" }}>
              + Agregar objetivo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ResumenTab({ child, objectives, sessions, users, onRenewPackage, onCloseProcess, currentUser }) {
  const PAQUETE = 8;
  const childObjectives = objectives.filter((o) => o.childId === child.id);
  const childSessions = sessions.filter((s) => s.childId === child.id).sort((a, b) => b.date.localeCompare(a.date));
  const totalSessions = childSessions.length;
  const last = childSessions[0];
  const lastSpecialist = last && users.find((u) => u.id === last.specialistId);
  const lastObjective = last && objectives.find((o) => o.id === last.objectivesWorked[0]?.objectiveId);

  // Package progress: count sessions since packageStart
  const packageStart = child.packageStart || null;
  const packageNum = child.packageNum || 1;
  const sessionsInPackage = packageStart
    ? childSessions.filter((s) => s.date >= packageStart).length
    : totalSessions;
  const enPaquete = sessionsInPackage % PAQUETE || (sessionsInPackage > 0 && sessionsInPackage % PAQUETE === 0 ? PAQUETE : sessionsInPackage % PAQUETE);
  const currentInPackage = sessionsInPackage > 0 ? ((sessionsInPackage - 1) % PAQUETE) + 1 : 0;
  const pct = (currentInPackage / PAQUETE) * 100;
  const barColor = currentInPackage >= 7 ? "#E53935" : currentInPackage >= 5 ? T.amberDeep : currentInPackage >= 3 ? T.amber : "#81C784";
  const [confirmRenew, setConfirmRenew] = useState(false);
  const [showCloseProcess, setShowCloseProcess] = useState(false);
  const [closeNote, setCloseNote] = useState("");

  return (
    <div>
      {/* Sessions by specialty */}
      {totalSessions > 0 && (() => {
        const AREA_COLORS = {"Terapia Ocupacional":"#175FAF","Fonoaudiologia":"#7A9E7E","Funciones Ejecutivas":"#C79A6B","Psicologia":"#A6779A","Psicologia Clinica":"#A6779A","Desarrollo (DVLP)":"#B8860B","Kids Club":"#82A166"};
        const bySpec = {};
        childSessions.forEach(s => {
          const spec = users.find(u => u.id === s.specialistId);
          const area = s.specialty || spec?.specialty || "General";
          if (!bySpec[area]) bySpec[area] = 0;
          bySpec[area]++;
        });
        const specList = Object.entries(bySpec).sort((a,b) => b[1]-a[1]);
        return (
          <Card style={{ marginBottom: 22, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Sesiones</div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {specList.map(([area, count]) => {
                    const color = AREA_COLORS[area] || T.inkSoft;
                    return (
                      <div key={area} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 500, color }}>{count}</div>
                        <div style={{ fontSize: 11.5, color, fontWeight: 600 }}>{area}</div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 20, borderLeft: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 500, color: T.inkSoft }}>{totalSessions}</div>
                    <div style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 600 }}>Total</div>
                  </div>
                </div>
              </div>
              {onCloseProcess && (
                <button onClick={() => setShowCloseProcess(true)} style={{
                  background: "none", border: `1px solid ${T.apoyo}`, borderRadius: 10, color: T.apoyo,
                  padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600, flexShrink: 0,
                }}>
                  Cerrar proceso
                </button>
              )}
            </div>
          </Card>
        );
      })()}

      {/* Cerrar proceso modal */}
      {showCloseProcess && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", borderRadius:20, padding:"32px", maxWidth:520, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontFamily:"Fraunces, serif", fontSize:22, fontWeight:500, color:T.ink, marginBottom:6 }}>
              Objetivos Alcanzados 🎓
            </div>
            <div style={{ fontSize:13.5, color:T.inkSoft, marginBottom:20 }}>
              {child.name} {child.lastName} · {totalSessions} sesiones
            </div>

            {childObjectives.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.inkSoft, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Objetivos trabajados</div>
                {childObjectives.map((o) => (
                  <div key={o.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:`1px solid ${T.borderSoft}` }}>
                    <span style={{ fontSize:16 }}>{o.status === "logrado" ? "✅" : o.status === "apoyo" ? "🔴" : "🟡"}</span>
                    <span style={{ fontSize:13, color: o.status === "logrado" ? "#2E7D32" : T.ink, fontWeight: o.status === "logrado" ? 600 : 400 }}>{o.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.inkSoft, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Nota de cierre</div>
              <textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Describe los logros alcanzados, recomendaciones y motivo de cierre del proceso..."
                rows={4}
                style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontSize:13.5, fontFamily:"Inter, sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}
                onFocus={(e) => e.target.style.borderColor = T.brand}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => { setShowCloseProcess(false); setCloseNote(""); }} style={{ padding:"10px 18px", borderRadius:10, border:`1px solid ${T.border}`, background:"#fff", color:T.inkSoft, fontSize:14, fontFamily:"Inter, sans-serif", cursor:"pointer" }}>
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onCloseProcess) onCloseProcess(child.id, closeNote, childObjectives, totalSessions);
                  setShowCloseProcess(false);
                  setCloseNote("");
                }}
                style={{ padding:"10px 22px", borderRadius:10, border:"none", background:"#4CAF50", color:"#fff", fontSize:14, fontWeight:600, fontFamily:"Inter, sans-serif", cursor:"pointer" }}
              >
                Generar Reporte de Logros
              </button>
            </div>
          </div>
        </div>
      )}

      {last ? (
        <Card style={{ padding: 18, marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Última sesión</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <Field label="Fecha" value={fmtDate(last.date)} />
            <Field label="Especialista" value={lastSpecialist?.name || "—"} />
            <Field label="Último objetivo" value={lastObjective?.name || "—"} />
          </div>
        </Card>
      ) : (
        <div style={{ color: T.inkFaint, fontSize: 14, textAlign: "center", padding: 30 }}>Aún no hay sesiones registradas.</div>
      )}
    </div>
  );
}

function EditSessionModal({ session, objectives, users, onClose, onSave }) {
  const specialist = users.find(u => u.id === session.specialistId);
  const objs = (session.objectivesWorked || []).map(ow => {
    const obj = objectives.find(o => o.id === ow.objectiveId);
    return obj ? { ...ow, name: obj.name } : null;
  }).filter(Boolean);
  const [observation, setObservation] = useState(session.observation || "");
  const [nextSteps, setNextSteps] = useState(session.nextSteps || "");
  const activities = Array.isArray(session.activities) ? session.activities : [];

  return (
    <Modal onClose={onClose} width={580}>
      <ModalHeader title="Editar registro de sesión" onClose={onClose} />
      <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Fixed fields - read only */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: "14px 16px", background: T.surfaceSunk, borderRadius: 10 }}>
          <Field label="Fecha" value={fmtDate(session.date)} />
          <Field label="Especialista" value={specialist?.name || "—"} />
          <Field label="Especialidad" value={session.specialty || "—"} />
          <Field label="Duración" value={session.duration ? `${session.duration} min` : "—"} />
        </div>
        {objs.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Objetivos trabajados</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {objs.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 20, fontSize: 13 }}>
                  <span>{o.status === "logrado" ? "✅" : o.status === "apoyo" ? "🔴" : "🟡"}</span>
                  <span style={{ color: T.ink }}>{o.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activities.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Actividades realizadas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {activities.map((a, i) => (
                <div key={i} style={{ padding: "4px 10px", background: T.amberTint, color: T.amberDeep, borderRadius: 20, fontSize: 13, fontWeight: 500 }}>{a}</div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Observaciones clínicas</div>
          <textarea value={observation} onChange={e => setObservation(e.target.value)} rows={5}
            placeholder="Observaciones de la sesión, evolución del paciente..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = T.brand}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Recomendaciones para casa / escuela</div>
          <textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={3}
            placeholder="Recomendaciones para el hogar o para el equipo escolar..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = T.brand}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={() => { onSave({ ...session, observation, nextSteps }); onClose(); }}>Guardar</Btn>
      </div>
    </Modal>
  );
}

function HistorialTab({ child, sessions, objectives, users, onViewReport, onUpdateSession, currentUser }) {
  const childSessions = sessions.filter((s) => s.childId === child.id).sort((a, b) => b.date.localeCompare(a.date));
  const [editingSession, setEditingSession] = useState(null);

  if (childSessions.length === 0) {
    return <div style={{ color: T.inkFaint, fontSize: 14, textAlign: "center", padding: 40 }}>Aún no hay sesiones registradas para este paciente.</div>;
  }

  const canEdit = (s) => can(currentUser, "session:edit", s);
  const AREA_COLORS = {"Terapia Ocupacional":"#175FAF","Fonoaudiologia":"#7A9E7E","Funciones Ejecutivas":"#C79A6B","Psicologia":"#A6779A","Psicologia Clinica":"#A6779A","Desarrollo (DVLP)":"#B8860B","Kids Club":"#82A166"};

  return (
    <>
      {editingSession && (
        <EditSessionModal
          session={editingSession}
          objectives={objectives}
          users={users}
          onClose={() => setEditingSession(null)}
          onSave={(updated) => { if (onUpdateSession) onUpdateSession(updated); setEditingSession(null); }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {childSessions.map((s) => {
          const specialist = users.find((u) => u.id === s.specialistId);
          const objs = (s.objectivesWorked || []).map((ow) => objectives.find((o) => o.id === ow.objectiveId)?.name).filter(Boolean);
          const color = AREA_COLORS[s.specialty] || T.inkSoft;
          const activities = Array.isArray(s.activities) ? s.activities : [];
          return (
            <Card key={s.id} style={{ padding: 18, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep, letterSpacing: "0.04em" }}>{fmtDateShort(s.date)}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{s.specialty}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{specialist?.name.split(" ")[0]}</div>
                    {s.duration && <div style={{ fontSize: 11, color: T.inkFaint }}>{s.duration} min</div>}
                  </div>
                  {objs.length > 0 && (
                    <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>Objetivos: </span>{objs.join(" · ")}
                    </div>
                  )}
                  {activities.length > 0 && (
                    <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>Actividades: </span>{activities.join(" · ")}
                    </div>
                  )}
                  {s.observation && <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5, marginTop: 6, whiteSpace: "pre-wrap" }}>{s.observation}</div>}
                  {s.nextSteps && <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4, fontStyle: "italic" }}>→ {s.nextSteps}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {canEdit(s) && <Btn variant="ghost" size="sm" onClick={() => setEditingSession(s)}>Editar</Btn>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function ReportCard({ icon: Icon, tone, title, description, action, actionLabel, badge }) {
  const tones = {
    brand: { bg: T.brandTint, fg: T.brand },
    amber: { bg: T.amberTint, fg: T.amberDeep },
  }[tone];
  return (
    <Card style={{ padding: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: tones.bg, color: tones.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.ink }}>{title}</div>
            {badge}
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3, maxWidth: 380 }}>{description}</div>
        </div>
      </div>
      <Btn variant={tone === "amber" ? "amber" : "primary"} onClick={action}>{actionLabel}</Btn>
    </Card>
  );
}

function DocumentsSection({ type, documents, users, onAdd, onUpdateDocument, currentUser }) {
  const meta = DOC_TYPES[type];
  const docs = documents.filter((d) => d.type === type).sort((a, b) => b.date.localeCompare(a.date));
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const startEdit = (d) => { setEditingId(d.id); setEditNotes(d.notes || ""); setExpandedId(d.id); };
  const saveEdit = (d) => { if (onUpdateDocument) onUpdateDocument({ ...d, notes: editNotes }); setEditingId(null); };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <Eyebrow style={{ marginBottom: 0 }}>{meta.plural}</Eyebrow>
        <Btn variant="ghost" size="sm" icon={Plus} onClick={onAdd}>Agregar</Btn>
      </div>
      {docs.length === 0 ? (
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: T.inkFaint }}>Todavía no hay {meta.plural.toLowerCase()} registradas.</div>
        </Card>
      ) : (
        <Card style={{ padding: 6 }}>
          {docs.map((d, i) => {
            const author = users.find((u) => u.id === d.authorId);
            const isEditing = editingId === d.id;
            const isExpanded = expandedId === d.id;
            const isPdf = d.fields?.pdfUrl || d.fields?.pdfData;
            const canEdit = can(currentUser, "document:edit", d);
            return (
              <div key={d.id} style={{ padding: "13px 14px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isPdf && <span style={{ fontSize: 11, background: "#FFEBEE", color: "#C62828", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>PDF</span>}
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{d.title}</div>
                    </div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{author?.name || "—"} · {fmtDateShort(d.date)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {isPdf && (
                      <a href={d.fields.pdfUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: T.brand, textDecoration: "none", padding: "4px 8px", border: `1px solid ${T.border}`, borderRadius: 6 }}>
                        Ver PDF
                      </a>
                    )}
                    {canEdit && !isEditing && (
                      <button onClick={() => startEdit(d)} style={{ fontSize: 12, color: T.inkSoft, background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Editar</button>
                    )}
                    {d.notes && !isEditing && (
                      <button onClick={() => setExpandedId(isExpanded ? null : d.id)} style={{ fontSize: 12, color: T.brand, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                        {isExpanded ? "▲ Cerrar" : "▼ Ver"}
                      </button>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <div style={{ marginTop: 10 }}>
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={8}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${T.brand}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6, whiteSpace: "pre-wrap" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => saveEdit(d)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: T.brand, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>Guardar</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 13, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>Cancelar</button>
                    </div>
                  </div>
                ) : isExpanded && d.notes ? (
                  <div style={{ fontSize: 13.5, color: T.ink, marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: "10px 12px", background: T.surfaceSunk, borderRadius: 8 }}>{d.notes}</div>
                ) : null}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function AddDocumentModal({ type, onClose, onSave }) {
  const meta = DOC_TYPES[type] || { label: type, plural: type };
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(TODAY);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("text"); // "text" | "pdf"
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const fileRef = useRef();

  const handlePdf = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);
    if (!title) setTitle(file.name.replace(/\.pdf$/i, ""));
    const reader = new FileReader();
    reader.onload = (ev) => setPdfData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const fields = mode === "pdf" && pdfData ? { pdfData, pdfName: pdfFile?.name } : {};
    onSave({ type, title: title.trim(), date, notes: notes.trim(), fields });
  };

  return (
    <Modal onClose={onClose} width={520}>
      <ModalHeader title={`Agregar ${meta.label.toLowerCase()}`} onClose={onClose} />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <button onClick={() => setMode("text")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${mode === "text" ? T.brand : T.border}`, background: mode === "text" ? `${T.brand}10` : "#fff", color: mode === "text" ? T.brand : T.inkSoft, fontSize: 13, fontWeight: mode === "text" ? 600 : 400, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
            ✏️ Texto / Notas
          </button>
          <button onClick={() => setMode("pdf")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${mode === "pdf" ? T.brand : T.border}`, background: mode === "pdf" ? `${T.brand}10` : "#fff", color: mode === "pdf" ? T.brand : T.inkSoft, fontSize: 13, fontWeight: mode === "pdf" ? 600 : 400, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
            📄 Subir PDF
          </button>
        </div>
        <div>
          <FieldLabel>Título</FieldLabel>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Ej: ${meta.label} inicial`} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div>
          <FieldLabel>Fecha</FieldLabel>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        </div>
        {mode === "text" ? (
          <div>
            <FieldLabel>Contenido</FieldLabel>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6}
              placeholder="Escribe el contenido, hallazgos u observaciones..."
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6, whiteSpace: "pre-wrap" }} />
          </div>
        ) : (
          <div>
            <FieldLabel>Archivo PDF</FieldLabel>
            <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${pdfFile ? T.brand : T.border}`, borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer", background: pdfFile ? `${T.brand}06` : "#fafafa" }}>
              {pdfFile ? (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.brand }}>{pdfFile.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{(pdfFile.size / 1024).toFixed(0)} KB · Listo para subir</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>📤</div>
                  <div style={{ fontSize: 14, color: T.inkSoft }}>Haz clic para seleccionar un PDF</div>
                  <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>Evaluaciones, informes, reportes</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePdf} />
            {pdfFile && (
              <div style={{ marginTop: 10 }}>
                <FieldLabel>Notas adicionales (opcional)</FieldLabel>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Observaciones sobre el documento..."
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" disabled={!title.trim() || (mode === "pdf" && !pdfFile)} onClick={handleSave}>Guardar</Btn>
      </div>
    </Modal>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{children}</div>;
}

function AnamnesisTab({ child, documents, users, currentUser, onAddDocument, onUpdateDocument }) {
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: child.name + " " + child.lastName,
    fechaNacimiento: child.birthDate || "",
    edad: "",
    gradoColegio: "",
    acompanante: "",
    telefono: "",
    correo: "",
    motivoConsulta: "",
    antecedentes: "",
    saludActual: "",
    terapiasPrevias: "",
    composicionFamiliar: "",
    hermanos: "",
    situacionPadres: "",
    dinamicaFamiliar: "",
    fortalezas: "",
    dificultades: "",
    relacionPares: "",
    estadoEmocional: "",
    rendimientoAcademico: "",
    areasDificultad: "",
    relacionMaestros: "",
    observaciones: "",
    consentimiento: false,
    firmaAcudiente: "",
    firmaProfesional: "",
    fechaFirma: TODAY,
  });

  const anamnesisDoc = documents.find(d => d.childId === child.id && d.type === "anamnesis" && d.fields?.isForm);
  const canEdit = can(currentUser, "anamnesis:edit");
  const [signLink, setSignLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const generateSignLink = () => {
    const token = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const baseFields = anamnesisDoc?.fields || { isForm: true, ...form };
    const doc = {
      id: anamnesisDoc?.id || `d-anamnesis-${child.id}`,
      childId: child.id,
      type: "anamnesis",
      title: `Anamnesis — ${child.name} ${child.lastName}`,
      date: anamnesisDoc?.date || TODAY,
      authorId: anamnesisDoc?.authorId || currentUser.id,
      notes: anamnesisDoc?.notes || "",
      fields: { ...baseFields, isForm: true, consentToken: token, consentChildName: `${child.name} ${child.lastName}` },
    };
    if (anamnesisDoc && onUpdateDocument) onUpdateDocument(doc);
    else if (onAddDocument) onAddDocument(doc);
    setLinkCopied(false);
    setSignLink(`${window.location.origin}${window.location.pathname}?firmar=${token}`);
  };

  const copySignLink = () => {
    if (!signLink) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(signLink).then(() => setLinkCopied(true));
    } else {
      setLinkCopied(true);
    }
  };

  const F = ({ label, name, multiline, rows = 3 }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>{label}</div>
      {multiline ? (
        <textarea value={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.value}))} rows={rows}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = T.brand} onBlur={e => e.target.style.borderColor = T.border}
        />
      ) : (
        <input value={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.value}))}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = T.brand} onBlur={e => e.target.style.borderColor = T.border}
        />
      )}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 500, color: T.brand, borderBottom: `1.5px solid ${T.brand}30`, paddingBottom: 6, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );

  const saveForm = () => {
    const notes = Object.entries(form).filter(([k,v]) => v && k !== "consentimiento").map(([k,v]) => `${k}: ${v}`).join("\n");
    const doc = {
      id: anamnesisDoc?.id || `d-anamnesis-${child.id}`,
      childId: child.id,
      type: "anamnesis",
      title: `Anamnesis — ${child.name} ${child.lastName}`,
      date: TODAY,
      authorId: currentUser.id,
      notes,
      fields: { isForm: true, ...form },
    };
    if (anamnesisDoc && onUpdateDocument) {
      onUpdateDocument(doc);
    } else if (onAddDocument) {
      onAddDocument(doc);
    }
    setShowForm(false);
  };

  // If form data exists, show it filled; else show empty form or existing docs
  const existingDocs = documents.filter(d => d.childId === child.id && d.type === "anamnesis");

  return (
    <div>
      {!showForm && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          {canEdit && (
            <Btn variant="amber" icon={Plus} onClick={() => {
              if (anamnesisDoc?.fields) setForm(f => ({...f, ...anamnesisDoc.fields}));
              setShowForm(true);
            }}>
              {anamnesisDoc ? "Editar anamnesis" : "Completar anamnesis"}
            </Btn>
          )}
        </div>
      )}

      {showForm ? (
        <Card style={{ padding: "20px 24px" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, color: T.ink, marginBottom: 24 }}>
            Anamnesis Breve — {child.name} {child.lastName}
          </div>

          <Section title="Datos generales">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Nombre completo" name="nombre" />
              <F label="Fecha de nacimiento" name="fechaNacimiento" />
              <F label="Edad" name="edad" />
              <F label="Grado escolar / Colegio" name="gradoColegio" />
            </div>
            <F label="Persona acompañante (nombre y parentesco)" name="acompanante" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Teléfono de contacto" name="telefono" />
              <F label="Correo" name="correo" />
            </div>
          </Section>

          <Section title="Motivo de consulta">
            <F label="" name="motivoConsulta" multiline rows={3} />
          </Section>

          <Section title="Antecedentes relevantes">
            <F label="Embarazo, parto y desarrollo temprano (complicaciones, retrasos)" name="antecedentes" multiline rows={3} />
            <F label="Salud actual (enfermedades, alergias, medicamentos)" name="saludActual" multiline rows={2} />
            <F label="Evaluaciones o terapias previas" name="terapiasPrevias" multiline rows={2} />
          </Section>

          <Section title="Información familiar">
            <F label="Composición familiar (con quién vive)" name="composicionFamiliar" multiline rows={2} />
            <F label="Hermanos (nombres y edades)" name="hermanos" />
            <F label="Situación de los padres" name="situacionPadres" />
            <F label="Dinámica familiar relevante" name="dinamicaFamiliar" multiline rows={2} />
          </Section>

          <Section title="Desarrollo y funcionamiento actual">
            <F label="Fortalezas" name="fortalezas" multiline rows={2} />
            <F label="Dificultades observadas (aprendizaje, conducta, social, emocional)" name="dificultades" multiline rows={3} />
            <F label="Relación con pares y adultos" name="relacionPares" multiline rows={2} />
            <F label="Estado emocional (miedos, ánimo, conducta)" name="estadoEmocional" multiline rows={2} />
          </Section>

          <Section title="Escolaridad">
            <F label="Rendimiento académico general" name="rendimientoAcademico" multiline rows={2} />
            <F label="Áreas con mayor dificultad" name="areasDificultad" />
            <F label="Relación con maestros y compañeros" name="relacionMaestros" multiline rows={2} />
          </Section>

          <Section title="Observaciones adicionales">
            <F label="" name="observaciones" multiline rows={3} />
          </Section>

          <Section title="Consentimiento informado">
            <div style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>
              Yo, en calidad de representante legal de <b>{child.name} {child.lastName}</b>, autorizo la evaluación y acompañamiento psicopedagógico/psicosocial.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <F label="Firma acudiente (si firma en persona)" name="firmaAcudiente" />
              <F label="Firma profesional" name="firmaProfesional" />
              <F label="Fecha" name="fechaFirma" />
            </div>
            <div style={{ marginTop: 6, padding: 14, background: T.surfaceSunk, borderRadius: 10 }}>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
                ¿El acudiente no está presente? Genera un link para que firme a distancia desde su celular — la firma queda registrada aquí automáticamente.
              </div>
              <Btn variant="ghost" size="sm" onClick={generateSignLink}>Generar link para firma</Btn>
              {signLink && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input readOnly value={signLink} onFocus={(e) => e.target.select()}
                    style={{ flex: 1, minWidth: 200, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12.5, fontFamily: "monospace", color: T.ink, background: "#fff" }}
                  />
                  <Btn variant="subtle" size="sm" onClick={copySignLink}>{linkCopied ? "¡Copiado!" : "Copiar"}</Btn>
                </div>
              )}
            </div>
          </Section>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={saveForm}>Guardar anamnesis</Btn>
          </div>
        </Card>
      ) : (
        <div>
          {anamnesisDoc?.fields?.isForm && (
            <Card style={{ padding: "20px 24px" }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 500, color: T.ink, marginBottom: 16 }}>
                Anamnesis — {child.name} {child.lastName}
              </div>
              {[
                ["Motivo de consulta", anamnesisDoc.fields.motivoConsulta],
                ["Antecedentes", anamnesisDoc.fields.antecedentes],
                ["Salud actual", anamnesisDoc.fields.saludActual],
                ["Composición familiar", anamnesisDoc.fields.composicionFamiliar],
                ["Fortalezas", anamnesisDoc.fields.fortalezas],
                ["Dificultades", anamnesisDoc.fields.dificultades],
                ["Estado emocional", anamnesisDoc.fields.estadoEmocional],
                ["Escolaridad", anamnesisDoc.fields.rendimientoAcademico],
                ["Observaciones", anamnesisDoc.fields.observaciones],
              ].filter(([,v]) => v).map(([label, value]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{value}</div>
                </div>
              ))}

              <div style={{ marginTop: 10, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Consentimiento informado</div>
                {anamnesisDoc.fields.firmaAcudienteImg ? (
                  <div>
                    <img src={anamnesisDoc.fields.firmaAcudienteImg} alt="Firma del acudiente" style={{ maxWidth: 300, height: "auto", border: `1px solid ${T.border}`, borderRadius: 8, background: "#fff" }} />
                    <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 6 }}>
                      Firmado a distancia {anamnesisDoc.fields.fechaFirmaAcudiente ? `el ${fmtDateShort(anamnesisDoc.fields.fechaFirmaAcudiente.slice(0,10))}` : ""}
                    </div>
                  </div>
                ) : anamnesisDoc.fields.firmaAcudiente ? (
                  <div style={{ fontSize: 13.5, color: T.ink }}>Firmado en persona por: <b>{anamnesisDoc.fields.firmaAcudiente}</b> ({anamnesisDoc.fields.fechaFirma})</div>
                ) : (
                  <div style={{ fontSize: 13.5, color: T.inkFaint }}>Aún no se ha registrado la firma del acudiente.</div>
                )}
                {canEdit && !anamnesisDoc.fields.firmaAcudienteImg && (
                  <div style={{ marginTop: 10 }}>
                    <Btn variant="ghost" size="sm" onClick={generateSignLink}>Generar link para firma</Btn>
                    {signLink && (
                      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <input readOnly value={signLink} onFocus={(e) => e.target.select()}
                          style={{ flex: 1, minWidth: 200, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12.5, fontFamily: "monospace", color: T.ink, background: "#fff" }}
                        />
                        <Btn variant="subtle" size="sm" onClick={copySignLink}>{linkCopied ? "¡Copiado!" : "Copiar"}</Btn>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
          {existingDocs.filter(d => !d.fields?.isForm).map((d, i) => {
            const author = users.find(u => u.id === d.authorId);
            return (
              <Card key={d.id} style={{ padding: "14px 18px", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 8 }}>{author?.name} · {fmtDateShort(d.date)}</div>
                {d.notes && <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{d.notes}</div>}
              </Card>
            );
          })}
          {existingDocs.length === 0 && !anamnesisDoc && (
            <Card style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 13.5, color: T.inkFaint }}>Anamnesis no completada aún.</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ADD PATIENT WIZARD (datos → anamnesis → especialistas)
============================================================ */

function AddPatientWizard({ users, currentUser, onClose, onCreate }) {
  const [step, setStep] = useState(1);

  // Step 1 — datos básicos
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [admissionDate, setAdmissionDate] = useState(TODAY);
  const [acompanante, setAcompanante] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  // Step 2 — anamnesis breve (los mismos campos clínicos que la ficha de Anamnesis)
  const [form, setForm] = useState({
    motivoConsulta: "", antecedentes: "", saludActual: "", terapiasPrevias: "",
    composicionFamiliar: "", hermanos: "", dinamicaFamiliar: "",
    fortalezas: "", dificultades: "", estadoEmocional: "",
    rendimientoAcademico: "", areasDificultad: "", observaciones: "",
  });
  const setField = (name) => (v) => setForm((f) => ({ ...f, [name]: v }));

  // Step 3 — especialistas
  const [assignedSpecialists, setAssignedSpecialists] = useState([]);
  const specialists = users.filter((u) => ROLES[u.role]?.esClinico);
  const toggleSpecialist = (id) => {
    setAssignedSpecialists((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const nombreCompleto = `${nombre} ${apellido}`.trim();
  const step1Valid = nombre.trim() && apellido.trim();

  const F = ({ label, value, onChange, multiline, rows = 3, placeholder, type }) => (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>{label}</div>}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
        />
      ) : (
        <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
        />
      )}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 500, color: T.brand, borderBottom: `1.5px solid ${T.brand}30`, paddingBottom: 6, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );

  const finish = () => {
    const newId = `c-${slugifyName(nombre + apellido)}-${Date.now().toString(36).slice(-5)}`;
    const specialtiesSet = Array.from(new Set(
      assignedSpecialists.map((id) => users.find((u) => u.id === id)?.specialty).filter(Boolean)
    ));
    const child = {
      id: newId, name: nombre.trim(), lastName: apellido.trim(),
      birthDate: birthDate || null, admissionDate: admissionDate || TODAY,
      specialties: specialtiesSet, assignedSpecialists,
      avatarBg: CHILD_AVATAR_COLORS[Math.floor(Math.random() * CHILD_AVATAR_COLORS.length)],
      nextSession: null, nextSessionTime: null,
      parentContact: { name: acompanante, phone: telefono, email: correo },
      packageStart: null, packageNum: 1,
    };
    const fullFields = {
      isForm: true, nombre: nombreCompleto, fechaNacimiento: birthDate, edad: "",
      gradoColegio: "", acompanante, telefono, correo, ...form,
      relacionPares: "", relacionMaestros: "", situacionPadres: "",
      consentimiento: false, firmaAcudiente: "", firmaProfesional: "", fechaFirma: TODAY,
    };
    const notes = Object.entries(fullFields).filter(([k, v]) => v && k !== "consentimiento" && k !== "isForm")
      .map(([k, v]) => `${k}: ${v}`).join("\n");
    const anamnesisDoc = {
      id: `d-anamnesis-${newId}`, childId: newId, type: "anamnesis",
      title: `Anamnesis — ${nombreCompleto}`, date: TODAY, authorId: currentUser.id, notes,
      fields: fullFields,
    };
    onCreate(child, anamnesisDoc);
  };

  return (
    <Modal onClose={onClose} width={640}>
      <ModalHeader
        title="Agregar paciente"
        subtitle={`Paso ${step} de 3 — ${step === 1 ? "Datos del paciente" : step === 2 ? "Anamnesis" : "Asignar especialistas"}`}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "60vh", overflowY: "auto" }}>

        {step === 1 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Nombre" value={nombre} onChange={setNombre} placeholder="Nombre" />
              <F label="Apellido" value={apellido} onChange={setApellido} placeholder="Apellido" />
              <F label="Fecha de nacimiento" value={birthDate} onChange={setBirthDate} type="date" />
              <F label="Fecha de admisión" value={admissionDate} onChange={setAdmissionDate} type="date" />
            </div>
            <F label="Persona acompañante (nombre y parentesco)" value={acompanante} onChange={setAcompanante} placeholder="Ej: María Pérez, madre" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Teléfono de contacto" value={telefono} onChange={setTelefono} />
              <F label="Correo" value={correo} onChange={setCorreo} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 16 }}>
              Ficha de anamnesis breve para <b>{nombreCompleto || "el paciente"}</b>. Puedes completar el resto más adelante desde la ficha del paciente.
            </div>
            <Section title="Motivo de consulta">
              <F value={form.motivoConsulta} onChange={setField("motivoConsulta")} multiline rows={3} />
            </Section>
            <Section title="Antecedentes relevantes">
              <F label="Embarazo, parto y desarrollo temprano" value={form.antecedentes} onChange={setField("antecedentes")} multiline rows={2} />
              <F label="Salud actual (enfermedades, alergias, medicamentos)" value={form.saludActual} onChange={setField("saludActual")} multiline rows={2} />
              <F label="Evaluaciones o terapias previas" value={form.terapiasPrevias} onChange={setField("terapiasPrevias")} multiline rows={2} />
            </Section>
            <Section title="Información familiar">
              <F label="Composición familiar (con quién vive)" value={form.composicionFamiliar} onChange={setField("composicionFamiliar")} multiline rows={2} />
              <F label="Hermanos (nombres y edades)" value={form.hermanos} onChange={setField("hermanos")} />
              <F label="Dinámica familiar relevante" value={form.dinamicaFamiliar} onChange={setField("dinamicaFamiliar")} multiline rows={2} />
            </Section>
            <Section title="Desarrollo y funcionamiento actual">
              <F label="Fortalezas" value={form.fortalezas} onChange={setField("fortalezas")} multiline rows={2} />
              <F label="Dificultades observadas" value={form.dificultades} onChange={setField("dificultades")} multiline rows={2} />
              <F label="Estado emocional" value={form.estadoEmocional} onChange={setField("estadoEmocional")} multiline rows={2} />
            </Section>
            <Section title="Escolaridad">
              <F label="Rendimiento académico general" value={form.rendimientoAcademico} onChange={setField("rendimientoAcademico")} multiline rows={2} />
              <F label="Áreas con mayor dificultad" value={form.areasDificultad} onChange={setField("areasDificultad")} />
            </Section>
            <Section title="Observaciones adicionales">
              <F value={form.observaciones} onChange={setField("observaciones")} multiline rows={2} />
            </Section>
            <div style={{ fontSize: 12.5, color: T.inkFaint, background: T.surfaceSunk, borderRadius: 10, padding: 12 }}>
              El consentimiento informado y la firma del acudiente se completan después, desde la pestaña de Anamnesis del paciente — ahí puedes generar un link para que el acudiente firme desde su celular, aunque no esté presente.
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 14 }}>
              ¿Qué especialistas atenderán a <b>{nombreCompleto || "el paciente"}</b>?
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {specialists.map((u) => (
                <Chip key={u.id} label={`${u.name} · ${u.specialty}`} selected={assignedSpecialists.includes(u.id)} onClick={() => toggleSpecialist(u.id)} />
              ))}
            </div>
            {specialists.length === 0 && (
              <div style={{ fontSize: 13.5, color: T.inkFaint }}>No hay especialistas registrados todavía.</div>
            )}
          </div>
        )}

      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", padding: "16px 24px", borderTop: `1px solid ${T.border}` }}>
        <Btn variant="ghost" onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}>
          {step === 1 ? "Cancelar" : "Atrás"}
        </Btn>
        {step < 3 ? (
          <Btn variant="primary" disabled={step === 1 && !step1Valid} onClick={() => setStep((s) => s + 1)}>Siguiente</Btn>
        ) : (
          <Btn variant="primary" onClick={finish}>Guardar paciente</Btn>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
   FIRMA DIGITAL — signature pad + public (no login) consent page
============================================================ */
function SignaturePad({ onChange, width = 500, height = 160 }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#152F36";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.stroke();
    if (onChange) onChange(canvasRef.current.toDataURL("image/png"));
  };
  const end = () => { drawingRef.current = false; };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    if (onChange) onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef} width={width} height={height}
        style={{ width: "100%", maxWidth: width, height, border: `1.5px dashed ${T.border}`, borderRadius: 10, touchAction: "none", background: "#fff", display: "block" }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button onClick={clear} type="button" style={{ marginTop: 8, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12.5, color: T.inkSoft, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
        Borrar firma
      </button>
    </div>
  );
}

function FirmaConsentimientoPublic({ token }) {
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | saving | done | error
  const [doc, setDoc] = useState(null);
  const [signatureData, setSignatureData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await db.getDocumentByConsentToken(token);
        if (cancelled) return;
        if (!found) { setStatus("notfound"); return; }
        setDoc(found);
        setStatus("ready");
      } catch (e) {
        console.error("Load consent doc:", e);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSave = async () => {
    if (!signatureData || !doc) return;
    setStatus("saving");
    try {
      await db.saveConsentSignature(token, signatureData);
      setStatus("done");
    } catch (e) {
      console.error("Save signature:", e);
      setStatus("error");
    }
  };

  const childName = doc?.fields?.consentChildName || doc?.fields?.nombre || "";

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF2", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{FONTS}</style>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 560, width: "100%", padding: "28px 26px", boxShadow: "0 20px 60px rgba(21,47,54,0.15)", boxSizing: "border-box" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 500, color: "#175FAF", marginBottom: 4 }}>AIRA Learning Hub</div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 20 }}>Consentimiento informado</div>

        {status === "loading" && <div style={{ fontSize: 14, color: T.inkSoft }}>Cargando…</div>}

        {status === "notfound" && (
          <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
            Este link ya no está disponible — puede que ya haya sido usado o que no sea válido. Si necesitas firmar, pide un nuevo link al centro.
          </div>
        )}

        {status === "error" && (
          <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
            Ocurrió un problema al cargar. Intenta de nuevo en unos minutos o pide un nuevo link al centro.
          </div>
        )}

        {status === "done" && (
          <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>✅ ¡Gracias! Tu firma quedó registrada correctamente.</div>
        )}

        {(status === "ready" || status === "saving") && doc && (
          <div>
            <div style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6, marginBottom: 18 }}>
              Yo, en calidad de representante legal de <b>{childName}</b>, autorizo la evaluación y acompañamiento psicopedagógico/psicosocial en AIRA Learning Hub.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              Firma del acudiente (dibuja con el dedo o el mouse)
            </div>
            <SignaturePad onChange={setSignatureData} />
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <Btn variant="primary" disabled={!signatureData || status === "saving"} onClick={handleSave}>
                {status === "saving" ? "Guardando…" : "Guardar firma"}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportesTab({ child, documents, users, sessions, parentReports, currentUser, onAddDocument, onUpdateDocument, onGenerateFull, onGenerateEvolution, onGenerateParentReport }) {
  const [addingType, setAddingType] = useState(null);
  const sinceLast = sessionsSinceLastParentReport(child.id, sessions, parentReports);
  const readyForParentReport = sinceLast.length >= 8;
  // Only this child's documents — otherwise every patient's Reportes tab shows every other patient's evaluations/reports too.
  const childDocuments = documents.filter((d) => d.childId === child.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ReportCard
          icon={FileText} tone="brand" title="Historial completo"
          description="Documento cronológico con todas las sesiones, objetivos y observaciones registradas."
          action={onGenerateFull} actionLabel="Generar historial"
        />
        <ReportCard
          icon={TrendingUp} tone="amber" title="Reporte de evolución"
          description="Avances, dificultades frecuentes y recomendaciones, eligiendo desde qué fecha tomar la información."
          action={onGenerateEvolution} actionLabel="Generar evolución"
        />
        <ReportCard
          icon={Users} tone={readyForParentReport ? "amber" : "brand"} title="Reporte para padres"
          description="Resumen en lenguaje sencillo basado en los reportes diarios, listo para enviar por correo o WhatsApp."
          action={onGenerateParentReport} actionLabel="Generar reporte"
          badge={
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
              color: readyForParentReport ? T.amberDeep : T.inkSoft,
              background: readyForParentReport ? T.amberTint : T.surfaceSunk,
            }}>
              {sinceLast.length}/8 sesiones
            </span>
          }
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {Object.keys(DOC_TYPES).filter(type => type !== "anamnesis").map((type) => (
          <DocumentsSection key={type} type={type} documents={childDocuments} users={users}
            onAdd={() => setAddingType(type)} onUpdateDocument={onUpdateDocument} currentUser={currentUser} />
        ))}
      </div>

      {addingType && (
        <AddDocumentModal
          type={addingType}
          onClose={() => setAddingType(null)}
          onSave={(doc) => { onAddDocument({ ...doc, childId: child.id, authorId: currentUser.id }); setAddingType(null); }}
        />
      )}
    </div>
  );
}

function MeetingCard({ meeting, users }) {
  const author = users.find((u) => u.id === meeting.createdBy);
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep, letterSpacing: "0.04em" }}>{fmtDateShort(meeting.date)}</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 16.5, fontWeight: 600, color: T.ink, marginTop: 4 }}>{meeting.type}</div>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: T.brand, background: T.brandTint, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
          Registrada por {author?.name.split(" ")[0] || "—"}
        </span>
      </div>
      <Field label="Participantes" value={meeting.participants} />
      <div style={{ marginTop: 10 }}>
        <FieldLabel>Resumen</FieldLabel>
        <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>{meeting.summary}</p>
      </div>
      {meeting.agreements && (
        <div style={{ marginTop: 10 }}>
          <FieldLabel>Acuerdos</FieldLabel>
          <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.6, fontWeight: 600 }}>{meeting.agreements}</p>
        </div>
      )}
    </Card>
  );
}

function AddMeetingModal({ onClose, onSave }) {
  const [date, setDate] = useState(TODAY);
  const [type, setType] = useState(MEETING_TYPES[0]);
  const [participants, setParticipants] = useState("");
  const [summary, setSummary] = useState("");
  const [agreements, setAgreements] = useState("");
  return (
    <Modal onClose={onClose} width={520}>
      <ModalHeader title="Registrar minuta" subtitle="Comunicación interdisciplinaria" onClose={onClose} />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <FieldLabel>Fecha</FieldLabel>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MEETING_TYPES.map((t) => (
                <Chip key={t} label={t} selected={type === t} onClick={() => setType(t)} />
              ))}
            </div>
          </div>
        </div>
        <div>
          <FieldLabel>Participantes</FieldLabel>
          <input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Ej: María López (TO), maestra guía..." style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div>
          <FieldLabel>Resumen</FieldLabel>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="¿De qué se habló?" style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        </div>
        <div>
          <FieldLabel>Acuerdos</FieldLabel>
          <textarea value={agreements} onChange={(e) => setAgreements(e.target.value)} rows={2} placeholder="¿Qué se acordó?" style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" disabled={!summary.trim() || !participants.trim()} onClick={() => onSave({ date, type, participants: participants.trim(), summary: summary.trim(), agreements: agreements.trim() })}>Guardar minuta</Btn>
      </div>
    </Modal>
  );
}

function InterdisciplinaryTab({ child, meetings, users, onAddMeeting, currentUser, documents, onAddDocument }) {
  const [adding, setAdding] = useState(false);
  const [addingPautas, setAddingPautas] = useState(false);
  const [pautasNote, setPautasNote] = useState("");
  const [pautasDate, setPautasDate] = useState(TODAY);
  const childMeetings = meetings.filter((m) => m.childId === child.id).sort((a, b) => b.date.localeCompare(a.date));

  // Pautas de Crianza sessions — visible a quien tenga el permiso guidelines:view
  const canSeePautas = can(currentUser, "guidelines:view");
  const pautasSessions = (documents || []).filter(d => d.childId === child.id && d.type === "pautas_crianza").sort((a, b) => b.date.localeCompare(a.date));

  const savePautas = () => {
    if (!pautasNote.trim()) return;
    const doc = {
      id: `d-pautas-${Date.now()}`,
      childId: child.id,
      type: "pautas_crianza",
      title: `Pautas de Crianza - ${fmtDate(pautasDate)}`,
      date: pautasDate,
      authorId: currentUser.id,
      notes: pautasNote.trim(),
      fields: {},
    };
    if (onAddDocument) onAddDocument(doc);
    setPautasNote("");
    setAddingPautas(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Pautas de Crianza — restricted */}
      {canSeePautas && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Pautas de Crianza</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>Sesiones con padres · Confidencial — solo visible para Sarita e Idaira</div>
            </div>
            <Btn variant="amber" icon={Plus} onClick={() => setAddingPautas(true)}>Registrar sesión</Btn>
          </div>
          {addingPautas && (
            <Card style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <input type="date" value={pautasDate} onChange={e => setPautasDate(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "Inter, sans-serif" }} />
              </div>
              <textarea value={pautasNote} onChange={e => setPautasNote(e.target.value)}
                placeholder="Resumen de la sesión con padres, temas trabajados, acuerdos..."
                rows={4}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setAddingPautas(false)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 13, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>Cancelar</button>
                <button onClick={savePautas} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: T.brand, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>Guardar</button>
              </div>
            </Card>
          )}
          {pautasSessions.length === 0 && !addingPautas ? (
            <div style={{ color: T.inkFaint, fontSize: 13.5, padding: "12px 0" }}>Aún no hay sesiones de Pautas de Crianza registradas.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pautasSessions.map(d => (
                <Card key={d.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.brand }}>{fmtDate(d.date)}</div>
                    <div style={{ fontSize: 12, color: T.inkFaint }}>Sarita Szerer</div>
                  </div>
                  <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{d.notes}</div>
                </Card>
              ))}
            </div>
          )}
          <div style={{ borderBottom: `1px solid ${T.border}`, margin: "8px 0 0" }} />
        </div>
      )}

      {/* Interdisciplinary minutes */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Minutas interdisciplinarias</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>
              Comunicación con escuela, especialistas externos u otros actores.
            </div>
          </div>
          <Btn variant="amber" icon={Plus} onClick={() => setAdding(true)}>Registrar minuta</Btn>
        </div>
        {childMeetings.length === 0 ? (
          <div style={{ color: T.inkFaint, fontSize: 14, textAlign: "center", padding: 24 }}>Aún no hay minutas registradas.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {childMeetings.map((m) => <MeetingCard key={m.id} meeting={m} users={users} />)}
          </div>
        )}
        {adding && (
          <AddMeetingModal onClose={() => setAdding(false)} onSave={(m) => { onAddMeeting(m); setAdding(false); }} />
        )}
      </div>
    </div>
  );
}

function SesionesTab({ child, sessions, objectives, users, currentUser, onUpdateSession }) {
  const AREA_COLORS = {"Terapia Ocupacional":"#175FAF","Fonoaudiologia":"#7A9E7E","Funciones Ejecutivas":"#C79A6B","Psicologia":"#A6779A","Psicologia Clinica":"#A6779A","Pautas de Crianza":"#C79A6B","Desarrollo (DVLP)":"#B8860B","Kids Club":"#82A166"};
  const [editingSession, setEditingSession] = useState(null);
  const [filterSpec, setFilterSpec] = useState(null);

  const childSessions = sessions.filter(s => s.childId === child.id).sort((a,b) => b.date.localeCompare(a.date));
  const specs = [...new Set(childSessions.map(s => s.specialty))].filter(Boolean);
  const canEdit = (s) => can(currentUser, "session:edit", s);
  const filtered = filterSpec ? childSessions.filter(s => s.specialty === filterSpec) : childSessions;
  const getSessionColor = (s) => SPECIALIST_COLORS[s.specialistId] || "#888";

  return (
    <div>
      {editingSession && (
        <EditSessionModal
          session={editingSession} objectives={objectives} users={users}
          onClose={() => setEditingSession(null)}
          onSave={(updated) => { if (onUpdateSession) onUpdateSession(updated); setEditingSession(null); }}
        />
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setFilterSpec(null)}
          style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${filterSpec === null ? T.ink : T.border}`, background: filterSpec === null ? T.ink : "#fff", color: filterSpec === null ? "#fff" : T.inkSoft, fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
          Todas ({childSessions.length})
        </button>
        {specs.map(sp => {
          // Get the specialist for this specialty to use their color
          const specForColor = childSessions.find(s => s.specialty === sp);
          const color = SPECIALIST_COLORS[specForColor?.specialistId] || AREA_COLORS[sp] || T.inkSoft;
          const count = childSessions.filter(s => s.specialty === sp).length;
          const active = filterSpec === sp;
          return (
            <button key={sp} onClick={() => setFilterSpec(active ? null : sp)}
              style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${active ? color : T.border}`, background: active ? color : "#fff", color: active ? "#fff" : color, fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
              {sp} ({count})
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(s => {
          const specialist = users.find(u => u.id === s.specialistId);
          const color = getSessionColor(s);
          const objs = (s.objectivesWorked || []).map(ow => objectives.find(o => o.id === ow.objectiveId)?.name).filter(Boolean);
          const acts = Array.isArray(s.activities) ? s.activities : [];
          return (
            <Card key={s.id} style={{ padding: "14px 16px", borderLeft: `3px solid ${color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep }}>{fmtDateShort(s.date)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{s.specialty}</span>
                    <span style={{ fontSize: 12, color, opacity: 0.8 }}>{specialist?.name?.split(" ")[0]}</span>
                    {s.duration && <span style={{ fontSize: 11, color: T.inkFaint }}>{s.duration} min</span>}
                  </div>
                  {objs.length > 0 && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 3 }}><b>Objetivos:</b> {objs.join(" · ")}</div>}
                  {acts.length > 0 && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 3 }}><b>Actividades:</b> {acts.join(" · ")}</div>}
                  {s.observation && <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, marginTop: 5, whiteSpace: "pre-wrap" }}>{s.observation}</div>}
                  {s.nextSteps && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4, fontStyle: "italic" }}>→ {s.nextSteps}</div>}
                </div>
                {canEdit(s) && (
                  <button onClick={() => setEditingSession(s)}
                    style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: `0.5px solid ${T.border}`, background: "#fff", color: T.inkSoft, cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
                    Editar
                  </button>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <div style={{ color: T.inkFaint, fontSize: 14, textAlign: "center", padding: 32 }}>Sin sesiones registradas.</div>}
      </div>
    </div>
  );
}

function PlanTrabajoTab({ child, documents, users, currentUser, onAddDocument, onUpdateDocument }) {
  const [adding, setAdding] = useState(false);
  const canAdd = can(currentUser, "workplan:create");
  const planDocs = documents.filter(d => d.childId === child.id && d.type === "plan_trabajo");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13.5, color: T.inkSoft }}>Plan terapéutico por disciplina — objetivos, metodología y metas del proceso.</div>
        {canAdd && <Btn variant="amber" icon={Plus} onClick={() => setAdding(true)}>Agregar plan</Btn>}
      </div>
      {adding && (
        <AddDocumentModal type="plan_trabajo" onClose={() => setAdding(false)}
          onSave={(d) => { onAddDocument({ ...d, childId: child.id, authorId: currentUser.id, id: `d-plan-${Date.now()}` }); setAdding(false); }}
        />
      )}
      <DocumentsSection type="plan_trabajo" documents={planDocs} users={users}
        onAdd={() => setAdding(true)} onUpdateDocument={onUpdateDocument} currentUser={currentUser} />
    </div>
  );
}

// Tab ids double as the ?tab= URL slug, so they are module-level: the router needs
// to validate an incoming ?tab= value before ChildProfile renders.
const CHILD_TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "sesiones", label: "Sesiones" },
  { id: "objetivos", label: "Objetivos" },
  { id: "plan", label: "Plan de Trabajo" },
  { id: "anamnesis", label: "Anamnesis" },
  { id: "reportes", label: "Reportes" },
  { id: "interdisciplinario", label: "Interdisciplinario" },
];
const DEFAULT_CHILD_TAB = "resumen";

function ChildProfile({ child, users, sessions, objectives, documents, meetings, parentReports, currentUser, onOpenSessionForm, onViewReport, onGenerateFull, onGenerateEvolution, onGenerateParentReport, onAddDocument, onAddMeeting, onUpdateObjective, onAddObjective, onDeleteObjective, onRenewPackage, onUpdateChild, onCloseProcess, onUpdateSession, onUpdateDocument }) {
  // Active tab lives in the URL (?tab=sesiones) so profile views are shareable.
  // An unknown or missing slug falls back to Resumen instead of rendering nothing.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = CHILD_TABS.some((t) => t.id === tabParam) ? tabParam : DEFAULT_CHILD_TAB;
  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    // Resumen is the default view, so it stays out of the URL.
    if (id === DEFAULT_CHILD_TAB) next.delete("tab");
    else next.set("tab", id);
    // replace: Back returns to the patient list rather than walking back through tabs.
    setSearchParams(next, { replace: true });
  };
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: child.name, lastName: child.lastName,
    birthDate: child.birthDate || "", admissionDate: child.admissionDate || "",
    parentName: child.parentContact?.name || "",
    parentPhone: child.parentContact?.phone || "",
    parentEmail: child.parentContact?.email || "",
  });

  const handleSaveProfile = () => {
    onUpdateChild(child.id, {
      name: editForm.name.trim(),
      lastName: editForm.lastName.trim(),
      birthDate: editForm.birthDate || null,
      admissionDate: editForm.admissionDate || null,
      parentContact: { name: editForm.parentName, phone: editForm.parentPhone, email: editForm.parentEmail },
    });
    setEditingProfile(false);
  };

  const specialistIdsFromSessions = [...new Set(
    sessions.filter(s => s.childId === child.id).map(s => s.specialistId).filter(Boolean)
  )];
  const specialists = specialistIdsFromSessions.length > 0
    ? specialistIdsFromSessions.map(id => users.find(u => u.id === id)).filter(Boolean)
    : child.assignedSpecialists.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const tabs = CHILD_TABS;

  return (
    <div className="aira-profile" style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 60px" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 30 }}>
        <Avatar name={child.name + " " + child.lastName} bg={child.avatarBg} size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 31, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em" }}>
            {child.name} {child.lastName}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px", marginTop: 7, fontSize: 13.5, color: T.inkSoft }}>
            {child.age != null && <span>{child.age} años</span>}
            {child.birthDate ? <span>Nació el {fmtDate(child.birthDate)}</span> : <span style={{color:T.muted}}>Fecha nacimiento pendiente</span>}
            {child.admissionDate ? <span>Ingresó el {fmtDate(child.admissionDate)}</span> : <span style={{color:T.muted}}>Fecha ingreso pendiente</span>}
          </div>
          <div style={{ fontSize: 13, color: T.inkFaint, marginTop: 8 }}>
            {child.specialties.join(" · ")}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {specialists.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar name={s.name} bg={SPECIALIST_COLORS[s.id] || s.avatarBg} size={22} />
                <span style={{ fontSize: 12.5, color: SPECIALIST_COLORS[s.id] || T.inkSoft, fontWeight: 500 }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {can(currentUser, "session:create") && child.assignedSpecialists.includes(currentUser.id) && (
            <Btn variant="amber" size="lg" icon={Plus} onClick={onOpenSessionForm}>Registrar sesión</Btn>
          )}
          {can(currentUser, "patient:edit") && (
            <button onClick={() => setEditingProfile(true)} style={{
              display: "flex", alignItems: "center", gap: 6, background: "none",
              border: `1px solid ${T.border}`, borderRadius: 10, padding: "7px 14px",
              fontSize: 13, color: T.inkSoft, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              ✎ Editar perfil
            </button>
          )}
        </div>
      </div>

      {/* Edit profile modal */}
      {editingProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color: T.ink, marginBottom: 24 }}>
              Editar perfil
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                { label: "Nombre", key: "name" },
                { label: "Apellido", key: "lastName" },
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                { label: "Fecha de nacimiento", key: "birthDate", type: "date" },
                { label: "Fecha de ingreso", key: "admissionDate", type: "date" },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input type={type} value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre del padre/madre</div>
              <input value={editForm.parentName} onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = T.brand}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 24 }}>
              {[
                { label: "Teléfono", key: "parentPhone" },
                { label: "Email", key: "parentEmail" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingProfile(false)} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 14, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleSaveProfile} disabled={!editForm.name.trim() || !editForm.lastName.trim()} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: T.brand, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", opacity: (!editForm.name.trim() || !editForm.lastName.trim()) ? 0.5 : 1 }}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.borderSoft}`, marginBottom: 26 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "8px 2px",
            marginRight: 26, fontSize: 15.5, fontFamily: "Fraunces, serif",
            fontWeight: tab === t.id ? 600 : 500,
            fontStyle: tab === t.id ? "normal" : "italic",
            color: tab === t.id ? T.ink : T.inkFaint,
            borderBottom: tab === t.id ? `2px solid ${T.amber}` : "2px solid transparent",
            transition: "color .15s ease",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <ResumenTab child={child} objectives={objectives} sessions={sessions} users={users} onRenewPackage={onRenewPackage} onCloseProcess={onCloseProcess} currentUser={currentUser} />}
      {tab === "sesiones" && <SesionesTab child={child} sessions={sessions} objectives={objectives} users={users} currentUser={currentUser} onUpdateSession={onUpdateSession} />}
      {tab === "objetivos" && (() => {
        const childObjs = objectives.filter((o) => o.childId === child.id);
        const groups = {};
        childObjs.forEach((o) => {
          const specId = o.specialistId || "sin-especialista";
          const area = o.area || "General";
          const key = `${specId}__${area}`;
          if (!groups[key]) groups[key] = { specId, area, objs: [] };
          groups[key].objs.push(o);
        });
        const groupList = Object.values(groups).sort((a, b) => a.area.localeCompare(b.area));
        const canEdit = (specId) => can(currentUser, "objective:edit", { specialistId: specId });
        const AREA_COLORS = {
          "Terapia Ocupacional": "#175FAF",
          "Fonoaudiologia": "#7A9E7E",
          "Fonoaudiología": "#7A9E7E",
          "Funciones Ejecutivas": "#C79A6B",
          "Psicologia": "#A6779A",
          "Psicología": "#A6779A",
          "Psicologia Clinica": "#A6779A",
          "Psicología Clínica": "#A6779A",
          "Desarrollo (DVLP)": "#B8860B",
          "Kids Club": "#82A166",
          "General": T.inkSoft,
        };
        const AREA_BG = {
          "Terapia Ocupacional": "#E6F1FB",
          "Fonoaudiologia": "#F0F5F0",
          "Funciones Ejecutivas": "#FAF0E6",
          "Psicologia": "#F5EEF8",
          "Psicologia Clinica": "#F5EEF8",
          "Desarrollo (DVLP)": "#FEFDE7",
          "Kids Club": "#EEF5EE",
          "General": T.surfaceSunk,
        };

        // Show specialists who have sessions with this child but no objectives
        const specsFromSessions = [...new Set(
          sessions.filter(s => s.childId === child.id).map(s => s.specialistId).filter(Boolean)
        )];
        const specsWithNoObjs = specsFromSessions.filter(sid => !Object.keys(groups).some(k => k.startsWith(sid)));

        return (
          <div>
            {/* Column grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(groupList.length + specsWithNoObjs.length, 3)}, 1fr)`, gap: 12, marginBottom: 16 }}>
              {groupList.map(({ specId, area, objs }) => {
                const spec = users.find(u => u.id === specId);
                const canEditThis = canEdit(specId);
                const logrados = objs.filter(o => o.status === "logrado").length;
                const color = AREA_COLORS[area] || T.inkSoft;
                const bg = AREA_BG[area] || T.surfaceSunk;
                const pct = objs.length > 0 ? (logrados / objs.length) * 100 : 0;
                return (
                  <div key={`${specId}__${area}`} style={{ background: "#fff", border: `0.5px solid ${T.border}`, borderTop: `3px solid ${color}`, borderRadius: "0 0 12px 12px" }}>
                    {/* Column header */}
                    <div style={{ padding: "12px 14px 10px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>{area}</div>
                      <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>{spec ? spec.name : "—"}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                        <span style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color }}>{logrados}</span>
                        <span style={{ fontSize: 13, color: T.inkSoft }}>/ {objs.length} logrados</span>
                      </div>
                      <div style={{ height: 4, background: T.borderSoft, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
                      </div>
                    </div>
                    {/* Objectives */}
                    <div style={{ borderTop: `0.5px solid ${T.border}`, padding: "6px 14px 10px" }}>
                      {objs.map((o) => (
                        <div key={o.id} style={{ padding: "7px 0", borderBottom: `0.5px solid ${T.borderSoft}` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{o.status === "logrado" ? "✅" : o.status === "apoyo" ? "🔴" : "🟡"}</span>
                            <span style={{ fontSize: 12.5, color: o.status === "logrado" ? "#2E7D32" : T.ink, lineHeight: 1.4, flex: 1 }}>{o.name}</span>
                          </div>
                          {canEditThis && (
                            <div style={{ display: "flex", gap: 4, marginTop: 5, marginLeft: 22 }}>
                              {["logrado","proceso","apoyo"].map(st => (
                                <button key={st} onClick={() => { if(onUpdateObjective) onUpdateObjective({...o, status: st}); }}
                                  style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "Inter, sans-serif",
                                    border: o.status === st ? "none" : `0.5px solid ${T.border}`,
                                    background: o.status === st ? (st === "logrado" ? "#E8F5E9" : st === "apoyo" ? "#FFEBEE" : "#FFF8E1") : "#fff",
                                    color: o.status === st ? (st === "logrado" ? "#2E7D32" : st === "apoyo" ? "#C62828" : "#F57F17") : T.inkSoft,
                                    fontWeight: o.status === st ? 600 : 400,
                                  }}>
                                  {st === "logrado" ? "✅ Logrado" : st === "proceso" ? "🟡 En proceso" : "🔴 Apoyo"}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {canEditThis && (
                        <ObjectivesList
                          objectives={[]}
                          onUpdate={onUpdateObjective}
                          onAdd={(data) => onAddObjective({ ...data, childId: child.id, specialistId: specId, area, createdDate: TODAY, status: "proceso" })}
                          onDelete={onDeleteObjective}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Specialists with no objectives yet */}
              {specsWithNoObjs.map(sid => {
                const spec = users.find(u => u.id === sid);
                if (!spec) return null;
                const area = spec.specialty || "General";
                const color = AREA_COLORS[area] || T.inkSoft;
                const canEditThis = canEdit(sid);
                return (
                  <div key={`empty-${sid}`} style={{ background: "#fff", border: `0.5px solid ${T.border}`, borderTop: `3px solid ${color}40`, borderRadius: "0 0 12px 12px" }}>
                    <div style={{ padding: "12px 14px 10px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: `${color}90`, marginBottom: 2 }}>{area}</div>
                      <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>{spec.name}</div>
                      <div style={{ fontSize: 12, color: T.inkFaint, fontStyle: "italic", padding: "8px 0" }}>Sin objetivos definidos.</div>
                    </div>
              {canEditThis && (
                      <div style={{ borderTop: `0.5px solid ${T.border}`, padding: "6px 14px 10px" }}>
                        <ObjectivesList
                          objectives={[]}
                          defaultArea={area}
                          onAdd={(data) => onAddObjective({ ...data, childId: child.id, specialistId: sid, area: data.area || area, createdDate: TODAY, status: "proceso" })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Full edit view below columns — only for can-edit specialists */}
            {groupList.filter(({ specId }) => canEdit(specId)).map(({ specId, area, objs }) => {
              const color = AREA_COLORS[area] || T.inkSoft;
              const spec = users.find(u => u.id === specId);
              return (
                <details key={`edit-${specId}__${area}`} style={{ marginBottom: 10 }}>
                  <summary style={{ fontSize: 12.5, color, cursor: "pointer", padding: "6px 0", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-edit" style={{ fontSize: 14 }} />
                    Editar objetivos de {area} ({spec?.name})
                  </summary>
                  <Card style={{ padding: "6px 18px 14px", marginTop: 6 }}>
                    <ObjectivesList
                      objectives={objs}
                      onUpdate={onUpdateObjective}
                      onAdd={(data) => onAddObjective({ ...data, childId: child.id, specialistId: specId, area, createdDate: TODAY, status: "proceso" })}
                      onDelete={onDeleteObjective}
                    />
                  </Card>
                </details>
              );
            })}
          </div>
        );
      })()}
      {tab === "plan" && <PlanTrabajoTab child={child} documents={documents} users={users} currentUser={currentUser} onAddDocument={onAddDocument} onUpdateDocument={onUpdateDocument} />}

      {tab === "anamnesis" && (
        <AnamnesisTab
          child={child} documents={documents} users={users} currentUser={currentUser}
          onAddDocument={onAddDocument}
        />
      )}
      {tab === "reportes" && (
        <ReportesTab
          child={child} documents={documents} users={users} sessions={sessions} parentReports={parentReports}
          currentUser={currentUser} onUpdateDocument={onUpdateDocument}
          onAddDocument={onAddDocument} onGenerateFull={onGenerateFull} onGenerateEvolution={onGenerateEvolution}
          onGenerateParentReport={onGenerateParentReport}
        />
      )}
      {tab === "interdisciplinario" && (
        <InterdisciplinaryTab child={child} meetings={meetings} users={users} onAddMeeting={onAddMeeting} currentUser={currentUser} documents={documents} onAddDocument={onAddDocument} />
      )}
    </div>
  );
}

/* ============================================================
   SESSION WIZARD — "Registrar sesión" (6 steps)
============================================================ */
function StepDots({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 20 : 7, height: 7, borderRadius: 999,
          background: i <= step ? T.amber : T.border, transition: "all .2s ease",
        }} />
      ))}
    </div>
  );
}

function SessionWizard({ child, currentUser, objectives, onClose, onSave }) {
  const [date, setDate] = useState(TODAY);
  const [duration, setDuration] = useState(45);
  const [selectedObjIds, setSelectedObjIds] = useState([]);
  const [customObjText, setCustomObjText] = useState("");
  const [activities, setActivities] = useState("");
  const [observation, setObservation] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  // Only show this specialist's objectives for this child
  const myObjectives = objectives.filter(o => 
    o.childId === child.id && 
    can(currentUser, "objective:edit", o)
  );

  // Session number for this specialist + child
  const toggleObj = (id) => setSelectedObjIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = () => {
    if (!date) return;
    onSave({
      childId: child.id,
      specialistId: currentUser.id,
      specialty: currentUser.specialty,
      date,
      duration,
      objectivesWorked: selectedObjIds.map(id => ({ objectiveId: id, status: "proceso" })),
      activities: activities.split("\n").map(a => a.trim()).filter(Boolean),
      observation: observation.trim(),
      nextSteps: nextSteps.trim(),
    });
  };

  const AREA_COLORS = {"Terapia Ocupacional":"#175FAF","Fonoaudiologia":"#7A9E7E","Funciones Ejecutivas":"#C79A6B","Psicologia":"#A6779A","Desarrollo (DVLP)":"#B8860B","Kids Club":"#82A166"};
  const color = AREA_COLORS[currentUser.specialty] || "#888";

  return (
    <Modal onClose={onClose} width={600}>
      <ModalHeader title="Registro de sesión" subtitle={`${child.name} ${child.lastName} · ${currentUser.specialty}`} onClose={onClose} />
      <div style={{ padding: 24, maxHeight: "72vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Fecha + Duración */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Fecha</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Duración</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[30, 40, 45, 60].map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${duration === d ? color : "#ddd"}`,
                  background: duration === d ? `${color}15` : "#fff", color: duration === d ? color : "#888",
                  fontSize: 12, fontWeight: duration === d ? 700 : 400, fontFamily: "Inter, sans-serif", cursor: "pointer"
                }}>{d}m</button>
              ))}
            </div>
          </div>
        </div>

        {/* Objetivos trabajados */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Objetivos de la sesión</div>
          {myObjectives.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {myObjectives.map(o => {
                const selected = selectedObjIds.includes(o.id);
                return (
                  <button key={o.id} onClick={() => toggleObj(o.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 8, border: `1.5px solid ${selected ? color : "#ddd"}`,
                    background: selected ? `${color}10` : "#fff", cursor: "pointer", textAlign: "left",
                    fontFamily: "Inter, sans-serif"
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? color : "#ccc"}`,
                      background: selected ? color : "#fff", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {selected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: selected ? color : "#333", fontWeight: selected ? 600 : 400 }}>{o.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#aaa", padding: "8px 0" }}>No hay objetivos definidos para esta disciplina aún.</div>
          )}
          <div style={{ marginTop: 8 }}>
            <input value={customObjText} onChange={e => setCustomObjText(e.target.value)}
              placeholder="Agregar objetivo puntual de esta sesión..."
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontSize: 13 }} />
          </div>
        </div>

        {/* Actividades realizadas */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Actividades realizadas</div>
          <textarea value={activities} onChange={e => setActivities(e.target.value)} rows={3}
            placeholder={"Una por línea, ej:\nColor Code\nJuego de turnos\nMasilla"}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </div>

        {/* Observaciones */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Observaciones clínicas</div>
          <textarea value={observation} onChange={e => setObservation(e.target.value)} rows={4}
            placeholder="Cómo estuvo el paciente, avances, dificultades observadas..."
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </div>

        {/* Recomendaciones */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Recomendaciones para casa / escuela</div>
          <textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={3}
            placeholder="Indicaciones para los padres o el equipo escolar..."
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </div>

      </div>
      <div style={{ padding: "14px 24px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#aaa" }}>{currentUser.name} · {currentUser.specialty}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" disabled={!date} onClick={handleSave}>Guardar sesión</Btn>
        </div>
      </div>
    </Modal>
  );
}

function SavedToast() {
  return (
    <div style={{
      position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 200,
      background: T.brandDeep, color: "#fff", padding: "13px 22px", borderRadius: 14,
      display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600,
      boxShadow: "0 10px 30px rgba(21,47,54,0.35)", fontFamily: "Inter, sans-serif",
    }}>
      <span style={{ width: 22, height: 22, borderRadius: 999, background: T.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={13} strokeWidth={3} />
      </span>
      Sesión guardada · reporte diario generado automáticamente
    </div>
  );
}

/* ============================================================
   FULL HISTORY generator (admin) — chronological compiled document
============================================================ */
function FullHistoryModal({ child, sessions, objectives, users, onClose }) {
  const [filterSpecialty, setFilterSpecialty] = useState("Todas");
  const [fromDate, setFromDate] = useState(child.admissionDate || "2025-01-01");
  const presets = [
    { label: "Desde el ingreso", value: child.admissionDate },
    { label: "Últimos 30 días", value: daysAgoISO(30) },
    { label: "Últimos 90 días", value: daysAgoISO(90) },
  ];
  const childSessions = sessions
    .filter((s) => s.childId === child.id && s.date >= fromDate)
    .filter((s) => filterSpecialty === "Todas" || s.specialty === filterSpecialty)
    .sort((a, b) => b.date.localeCompare(a.date));
  const childObjectives = objectives.filter((o) => o.childId === child.id);
  const specialistsInvolved = child.assignedSpecialists.map((id) => users.find((u) => u.id === id)).filter(Boolean);

  return (
    <Modal onClose={onClose} width={680}>
      <ModalHeader title="Historial completo" subtitle={`${child.name} ${child.lastName}`} onClose={onClose} />
      <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <Filter size={14} color={T.inkFaint} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Todas", ...child.specialties].map((sp) => (
            <Chip key={sp} label={sp} selected={filterSpecialty === sp} onClick={() => setFilterSpecialty(sp)} />
          ))}
        </div>
      </div>
      <DateRangeBar fromDate={fromDate} setFromDate={setFromDate} minDate={child.admissionDate} presets={presets} />
      <div style={{ padding: 24, maxHeight: "56vh", overflowY: "auto" }}>
        <Section title="Información del paciente">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
            <Field label="Nombre" value={`${child.name} ${child.lastName}`} />
            <Field label="Edad" value={child.age != null ? `${child.age} años` : "Pendiente"} />
            <Field label="Fecha de nacimiento" value={child.birthDate ? fmtDate(child.birthDate) : "Pendiente"} />
            <Field label="Fecha de ingreso" value={child.admissionDate ? fmtDate(child.admissionDate) : "Pendiente"} />
            <Field label="Especialidades" value={child.specialties.join(", ")} />
            <Field label="Especialistas" value={specialistsInvolved.map((s) => s.name).join(", ")} />
          </div>
        </Section>

        <Section title="Objetivos">
          <ObjectivesList objectives={childObjectives} compact />
        </Section>

        <Eyebrow style={{ marginBottom: 14 }}>
          Historial cronológico ({childSessions.length} sesión{childSessions.length !== 1 ? "es" : ""})
        </Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {childSessions.map((s) => {
            const specialist = users.find((u) => u.id === s.specialistId);
            return (
              <div key={s.id} style={{ border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep }}>{fmtDate(s.date)} — {s.specialty}</div>
                <DailyReport session={s} child={child} specialist={specialist} objectives={objectives} printable />
              </div>
            );
          })}
          {childSessions.length === 0 && <div style={{ color: T.inkFaint, textAlign: "center", padding: 20 }}>No hay sesiones para este filtro.</div>}
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="ghost" icon={Printer} onClick={() => window.print()}>Imprimir / Exportar</Btn>
      </div>
    </Modal>
  );
}

/* ============================================================
   EVOLUTION REPORT generator — derived strictly from recorded data
============================================================ */
function DateRangeBar({ fromDate, setFromDate, minDate, presets }) {
  return (
    <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FieldLabel style={{ margin: 0 }}>Desde</FieldLabel>
        <input
          type="date" value={fromDate} min={minDate} max={TODAY}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ ...inputStyle, padding: "7px 10px", fontSize: 13 }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map((p) => (
          <button key={p.label} onClick={() => setFromDate(p.value)} style={{
            fontSize: 12.5, fontWeight: 600, color: T.brand, background: T.brandTint,
            border: "none", borderRadius: 999, padding: "6px 12px", cursor: "pointer",
          }}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}

function EvolutionReportModal({ child, sessions, objectives, users, onClose }) {
  const [fromDate, setFromDate] = useState(child.admissionDate || "2025-01-01");
  const childSessions = sessions.filter((s) => s.childId === child.id && s.date >= fromDate);
  const childObjectives = objectives.filter((o) => o.childId === child.id);

  const presets = [
    { label: "Desde el ingreso", value: child.admissionDate },
    { label: "Últimos 30 días", value: daysAgoISO(30) },
    { label: "Últimos 90 días", value: daysAgoISO(90) },
  ];

  const analysis = useMemo(() => {
    return childObjectives.map((obj) => {
      const entries = childSessions
        .flatMap((s) => s.objectivesWorked.filter((ow) => ow.objectiveId === obj.id).map((ow) => ({ ...ow, session: s })))
        .sort((a, b) => a.session.date.localeCompare(b.session.date));
      return { objective: obj, entries, timesWorked: entries.length, currentStatus: obj.status };
    });
  }, [childObjectives, childSessions]);

  const logrados = analysis.filter((a) => a.currentStatus === "logrado");
  const enProceso = analysis.filter((a) => a.currentStatus === "proceso");
  const necesitanApoyo = analysis.filter((a) => a.currentStatus === "apoyo");
  const recommendations = Array.from(new Set(childSessions.map((s) => s.nextSteps).filter(Boolean)));
  const observationsWithFriction = childSessions.filter((s) => /frustra|dificult|distrae|apoyo|costó/i.test(s.observation || ""));

  return (
    <Modal onClose={onClose} width={640}>
      <ModalHeader title="Reporte de evolución" subtitle={`${child.name} ${child.lastName} · basado en ${childSessions.length} sesión(es) desde ${fmtDate(fromDate)}`} onClose={onClose} />
      <DateRangeBar fromDate={fromDate} setFromDate={setFromDate} minDate={child.admissionDate} presets={presets} />
      <div style={{ padding: 24, maxHeight: "62vh", overflowY: "auto" }}>
        {childSessions.length === 0 ? (
          <div style={{ color: T.inkFaint, textAlign: "center", padding: 30 }}>
            No hay sesiones registradas en el rango de fechas seleccionado.
          </div>
        ) : (
          <>
            <Section title="Objetivos trabajados">
              <div style={{ fontSize: 14, color: T.ink }}>{analysis.length} objetivo(s), trabajados en {childSessions.length} sesión(es) en total.</div>
            </Section>

            <Section title={`Objetivos logrados (${logrados.length})`}>
              {logrados.length ? <ObjectivesList objectives={logrados.map((a) => a.objective)} compact /> : <EmptyNote text="Ningún objetivo marcado como logrado todavía." />}
            </Section>

            <Section title={`En proceso (${enProceso.length})`}>
              {enProceso.length ? <ObjectivesList objectives={enProceso.map((a) => a.objective)} compact /> : <EmptyNote text="Ningún objetivo en proceso." />}
            </Section>

            <Section title={`Necesitan apoyo (${necesitanApoyo.length})`}>
              {necesitanApoyo.length ? <ObjectivesList objectives={necesitanApoyo.map((a) => a.objective)} compact /> : <EmptyNote text="Ningún objetivo marcado como necesita apoyo." />}
            </Section>

            <Section title="Dificultades frecuentes observadas">
              {observationsWithFriction.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {observationsWithFriction.map((s) => (
                    <div key={s.id} style={{ fontSize: 13.5, color: T.ink, background: T.apoyoTint, padding: "9px 12px", borderRadius: 10 }}>
                      <span style={{ color: T.apoyo, fontWeight: 700 }}>{fmtDateShort(s.date)}: </span>{s.observation}
                    </div>
                  ))}
                </div>
              ) : <EmptyNote text="No se registraron dificultades relevantes en las observaciones." />}
            </Section>

            <Section title="Recomendaciones registradas" last>
              {recommendations.length ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: T.ink, lineHeight: 1.8 }}>
                  {recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              ) : <EmptyNote text="No hay recomendaciones registradas aún." />}
            </Section>

            <div style={{ fontSize: 12, color: T.inkFaint, fontStyle: "italic", marginTop: 4 }}>
              Este reporte se genera únicamente a partir de la información registrada por las especialistas. No incluye interpretaciones adicionales.
            </div>
          </>
        )}
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="ghost" icon={Printer} onClick={() => window.print()}>Imprimir / Exportar</Btn>
      </div>
    </Modal>
  );
}

function EmptyNote({ text }) {
  return <div style={{ fontSize: 13, color: T.inkFaint, fontStyle: "italic" }}>{text}</div>;
}

/* ============================================================
   PARENT PROGRESS REPORT — every ~8 sessions, plain language,
   exportable by email or WhatsApp
============================================================ */

function ParentReportModal({ child, sessions, objectives, parentReports, onClose, onGenerated }) {
  const sinceLastSessions = useMemo(
    () => sessionsSinceLastParentReport(child.id, sessions, parentReports).sort((a, b) => a.date.localeCompare(b.date)),
    [child.id, sessions, parentReports]
  );
  const defaultFrom = sinceLastSessions[0]?.date || child.admissionDate;
  const [fromDate, setFromDate] = useState(defaultFrom);
  const rangeSessions = sessions.filter((s) => s.childId === child.id && s.date >= fromDate).sort((a, b) => a.date.localeCompare(b.date));
  const presets = [
    { label: "Desde el último reporte", value: defaultFrom },
    { label: "Últimas 8 sesiones", value: sessions.filter((s) => s.childId === child.id).sort((a, b) => b.date.localeCompare(a.date))[7]?.date || child.admissionDate },
    { label: "Desde el ingreso", value: child.admissionDate },
  ];

  const reportText = useMemo(() => buildParentReportText(child, rangeSessions, objectives), [child, rangeSessions, objectives]);
  const contact = child.parentContact || {};

  function handleSend(channel) {
    if (channel === "email") {
      const subject = encodeURIComponent(`Reporte de progreso — ${child.name} ${child.lastName}`);
      const body = encodeURIComponent(reportText);
      window.open(`mailto:${contact.email || ""}?subject=${subject}&body=${body}`, "_blank");
    } else {
      const text = encodeURIComponent(reportText);
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
    onGenerated({ childId: child.id, generatedDate: TODAY, fromDate, toDate: TODAY, sessionCount: rangeSessions.length });
  }

  return (
    <Modal onClose={onClose} width={560}>
      <ModalHeader title="Reporte para padres" subtitle={`${child.name} ${child.lastName} · ${rangeSessions.length} sesión(es) en el periodo`} onClose={onClose} />
      <DateRangeBar fromDate={fromDate} setFromDate={setFromDate} minDate={child.admissionDate} presets={presets} />
      <div style={{ padding: 24, maxHeight: "50vh", overflowY: "auto" }}>
        {rangeSessions.length === 0 ? (
          <div style={{ color: T.inkFaint, textAlign: "center", padding: 30 }}>No hay sesiones en el rango seleccionado.</div>
        ) : (
          <div style={{
            background: T.surfaceSunk, borderRadius: 14, padding: 18, fontSize: 13.5,
            color: T.ink, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif",
          }}>
            {reportText}
          </div>
        )}
        {contact.name && (
          <div style={{ marginTop: 14, fontSize: 12.5, color: T.inkSoft }}>
            Se enviará a <b>{contact.name}</b> {contact.email ? `· ${contact.email}` : ""} {contact.phone ? `· ${contact.phone}` : ""}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" icon={Printer} onClick={() => window.print()}>Imprimir</Btn>
        <Btn variant="ghost" onClick={() => handleSend("email")}>Enviar por correo</Btn>
        <Btn variant="amber" onClick={() => handleSend("whatsapp")}>Enviar por WhatsApp</Btn>
      </div>
    </Modal>
  );
}

/* ============================================================
   ROOT APP
============================================================ */
// Shown while a cold deep link to /paciente/:id waits for the first Supabase load.
function RouteLoading() {
  return (
    <div style={{ padding: "80px 20px", textAlign: "center", fontSize: 14, color: T.inkFaint }}>
      Cargando…
    </div>
  );
}

// Reached when /paciente/:id names a patient this user cannot see — either the id is
// wrong, or it belongs to someone outside their caseload. Both look the same on purpose.
function RouteNotFound({ onHome }) {
  return (
    <div style={{ padding: "80px 20px", textAlign: "center", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 500, color: T.ink, marginBottom: 10 }}>
        Paciente no encontrado
      </div>
      <div style={{ fontSize: 14, color: T.inkFaint, marginBottom: 24 }}>
        El enlace no corresponde a un paciente de tu lista.
      </div>
      <Btn onClick={onHome}>Volver al inicio</Btn>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
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

  const [children, setChildren] = useState(seedChildren);
  const [users] = useState(seedUsers);
  const [objectives, setObjectives] = useState(seedObjectives);
  const [sessions, setSessions] = useState(seedSessions);
  const [documents, setDocuments] = useState(seedDocuments);
  const [meetings, setMeetings] = useState(seedMeetings);
  const [parentReports, setParentReports] = useState(seedParentReports);
  const [tutors, setTutors] = useState(seedTutors);
  const [schools, setSchools] = useState(seedSchools);
  const [gabineteSessions, setGabineteSessions] = useState(seedGabineteSessions);
  const [tutorReports, setTutorReports] = useState(seedTutorReports);
  const [activityLog, setActivityLog] = useState([]);

  // ── Google Calendar live agenda ─────────────────────────────────────────────
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [gcalConnected, setGcalConnected] = useState(!!localStorage.getItem("gcal_token"));
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [calendarDate, setCalendarDate] = useState(TODAY);

  // ── Loading state ────────────────────────────────────────────────────────
  const [appLoading, setAppLoading] = useState(false);
  // Distinct from appLoading: stays false until the first Supabase load settles.
  // /paciente/:id needs it to tell "patient not found" from "data hasn't arrived
  // yet", since `children` starts out holding seed data on a cold deep link.
  const [dataLoaded, setDataLoaded] = useState(false);
  const [driveStatus, setDriveStatus] = useState("idle"); // reuse for save status UI

  // ── Supabase: load all data on login ─────────────────────────────────────
  const loadFromSupabase = useCallback(async (role, userId) => {
    setAppLoading(true);
    try {
      const [
        dbChildren, dbObjectives, dbSessions, dbDocuments,
        dbMeetings, dbSchools, dbGabineteSessions, dbTutorReports,
      ] = await Promise.all([
        // Pass role/id so specialists only receive their own assigned patients.
        db.getChildren(role, userId), db.getObjectives(), db.getSessions(), db.getDocuments(),
        db.getMeetings(), db.getSchools(), db.getGabineteSessions(), db.getTutorReports(),
      ]);
      // Unconditional, unlike the rows below: now that getChildren filters by role,
      // an empty result is a real answer ("this specialist has no patients"). Falling
      // back to seed data there would show them every demo patient instead of none.
      setChildren(dbChildren);
      if (dbObjectives.length > 0) setObjectives(dbObjectives);
      if (dbSessions.length > 0) setSessions(dbSessions);
      if (dbDocuments.length > 0) setDocuments(dbDocuments);
      if (dbMeetings.length > 0) setMeetings(dbMeetings);
      if (dbSchools.length > 0) setSchools(dbSchools);
      if (dbGabineteSessions.length > 0) setGabineteSessions(dbGabineteSessions);
      if (dbTutorReports.length > 0) setTutorReports(dbTutorReports);
    } catch(e) {
      console.error("Supabase load error:", e);
    } finally {
      setAppLoading(false);
      setDataLoaded(true);
    }
  }, []);

  const saveToDrive = () => {}; // kept for UI compatibility — Supabase saves are instant

  // Load from Supabase on login
  useEffect(() => {
    if (currentUser && currentUser.home !== "tutor") {
      loadFromSupabase(currentUser.role, currentUser.id);
    } else if (currentUser) {
      // Shadow tutors run entirely off seed data — nothing to wait for.
      setDataLoaded(true);
    }
  }, [currentUser, loadFromSupabase]);

  const fetchCalendarEvents = async (date) => {
    // Only load if we already have a token
    const token = getStoredToken();
    if (!token) {
      setGcalConnected(false);
      setCalendarError("conectar");
      setCalendarLoading(false);
      return;
    }
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const events = await gcalFetch(date);
      setCalendarEvents(events);
      setGcalConnected(true);
    } catch (e) {
      if (e.message === "NOT_AUTHENTICATED") {
        setGcalConnected(false);
        setCalendarError("conectar");
      } else {
        setCalendarError("No se pudo cargar el calendario");
      }
      setCalendarEvents([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleConnectGcal = async () => {
    try {
      await signInToGoogle();
      setGcalConnected(true);
      fetchCalendarEvents(calendarDate);
    } catch(e) {
      setCalendarError("No se pudo conectar con Google");
    }
  };

  // Fetch on login for admin/clinical_director, and when date changes
  React.useEffect(() => {
    if (currentUser && currentUser.home !== "tutor") {
      fetchCalendarEvents(calendarDate);
    }
  }, [currentUser, calendarDate]);

    const [wizardOpen, setWizardOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [fullHistoryOpen, setFullHistoryOpen] = useState(false);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [parentReportOpen, setParentReportOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  function handleSaveSession(payload) {
    const newObjectives = (payload._newObjectiveNames || []).map((name, i) => ({
      id: `obj-${Date.now()}-${i}`,
      childId: payload.childId,
      name,
      area: payload.specialty,
      createdDate: payload.date,
      specialistId: payload.specialistId,
      status: "proceso",
    }));
    let updatedObjectives = objectives;
    if (newObjectives.length) {
      updatedObjectives = [...objectives, ...newObjectives];
      setObjectives(updatedObjectives);
    }
    // remap any "new-i" temp ids in objectivesWorked to the real new objective ids
    const remappedObjectivesWorked = payload.objectivesWorked.map((ow) => {
      if (String(ow.objectiveId).startsWith("new-")) {
        const idx = parseInt(String(ow.objectiveId).split("-")[1], 10);
        return { ...ow, objectiveId: newObjectives[idx]?.id || ow.objectiveId };
      }
      return ow;
    });
    // apply the performance status back onto the objective records
    setObjectives((prev) => prev.map((o) => {
      const match = remappedObjectivesWorked.find((ow) => ow.objectiveId === o.id);
      return match ? { ...o, status: match.status } : o;
    }));

    const newSession = {
      id: `s-${Date.now()}`,
      childId: payload.childId,
      specialistId: payload.specialistId,
      specialty: payload.specialty,
      date: payload.date,
      duration: payload.duration,
      objectivesWorked: remappedObjectivesWorked,
      activities: payload.activities,
      observation: payload.observation,
      nextSteps: payload.nextSteps,
      createdAt: new Date().toISOString(),
    };
    setSessions((prev) => [...prev, newSession]);
    setWizardOpen(false);
    const child = children.find(c => c.id === newSession.childId);
    setActivityLog(prev => [{
      id: `act-${Date.now()}`, type: "session", timestamp: new Date().toISOString(),
      specialistId: newSession.specialistId, childId: newSession.childId,
      childName: child ? `${child.name} ${child.lastName}` : "Paciente",
      description: `Sesión registrada`,
      seen: false,
    }, ...prev]);
    try { db.insertSession(newSession); } catch(e) { console.error("Save session:", e); }
    setToast(true);
    setTimeout(() => setToast(false), 3200);
  }

  async function handleUpdateChild(childId, updates) {
    setChildren((prev) => prev.map((c) => {
      if (c.id !== childId) return c;
      const updated = { ...c, ...updates };
      if (updates.parentContact) updated.parentContact = updates.parentContact;
      return updated;
    }));
    try { await db.updateChild(childId, updates); } catch(e) { console.error("Update child:", e); }
  }

  async function handleUpdateSession(session) {
    setSessions(prev => prev.map(s => s.id === session.id ? session : s));
    try { await db.updateSession(session); } catch(e) { console.error("Update session:", e); }
  }

  async function handleUpdateDocument(doc) {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    try { await db.updateDocument(doc); } catch(e) { console.error("Update document:", e); }
  }

  async function handleCloseProcess(childId, note, objectives, totalSessions) {
    const child = children.find(c => c.id === childId);
    if (!child) return;
    // Create a closure document (Reporte de Logros)
    const doc = {
      id: `d-close-${Date.now()}`,
      childId,
      type: "reporte",
      title: "Reporte de Logros - Cierre de Proceso",
      date: TODAY,
      authorId: currentUser.id,
      notes: note || "Proceso cerrado con objetivos alcanzados.",
      fields: {
        totalSessions,
        objectives: objectives.map(o => ({ name: o.name, status: o.status })),
        closedBy: currentUser.name,
        closedDate: TODAY,
      }
    };
    setDocuments(prev => [doc, ...prev]);
    setActivityLog(prev => [{
      id: `act-${Date.now()}`, type: "document", timestamp: new Date().toISOString(),
      specialistId: currentUser.id, childId,
      childName: `${child.name} ${child.lastName}`,
      description: "Reporte de Logros generado - Cierre de proceso",
      seen: false,
    }, ...prev]);
    try { await db.insertDocument(doc); } catch(e) { console.error("Close process:", e); }
  }

  async function handleRenewPackage(childId) {
    const today = TODAY;
    setChildren((prev) => prev.map((c) => {
      if (c.id !== childId) return c;
      const newPkg = (c.packageNum || 1) + 1;
      return { ...c, packageStart: today, packageNum: newPkg };
    }));
    const child = children.find(c => c.id === childId);
    if (child) {
      try { await db.updateChild(childId, { packageStart: today, packageNum: (child.packageNum || 1) + 1 }); }
      catch(e) { console.error("Renew package:", e); }
    }
  }
  async function handleUpdateObjective(updated) {
    setObjectives((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    try { await db.upsertObjective(updated); } catch(e) { console.error("Update objective:", e); }
  }
  async function handleAddObjective(obj) {
    const newObj = { id: `o-${Date.now()}`, ...obj };
    setObjectives((prev) => [...prev, newObj]);
    try { await db.upsertObjective(newObj); } catch(e) { console.error("Add objective:", e); }
  }
  async function handleDeleteObjective(id) {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
    try { await db.deleteObjective(id); } catch(e) { console.error("Delete objective:", e); }
  }
  function handleAddDocument(doc) {
    setDocuments((prev) => [...prev, { id: `doc-${Date.now()}`, childId: selectedChildId, authorId: currentUser.id, ...doc }]);
  }

  function handleAddMeeting(meeting) {
    setMeetings((prev) => [...prev, { id: `mtg-${Date.now()}`, childId: selectedChildId, createdBy: currentUser.id, ...meeting }]);
  }

  async function handleAddTutorReport(report) {
    setTutorReports((prev) => [...prev, report]);
    try { await db.insertTutorReport(report); } catch(e) { console.error("Add tutor report:", e); }
  }

  async function handleAddGabineteSession(session) {
    setGabineteSessions((prev) => [...prev, session]);
    try { await db.insertGabineteSession(session); } catch(e) { console.error("Add gabinete session:", e); }
  }

  async function handleAddSchool(school) {
    setSchools((prev) => [...prev, school]);
    try { await db.insertSchool(school); } catch(e) { console.error("Add school:", e); }
  }

  async function handleAddChild(child, anamnesisDoc) {
    setChildren((prev) => [...prev, child]);
    try { await db.insertChild(child); } catch(e) { console.error("Add child:", e); }
    if (anamnesisDoc) {
      setDocuments((prev) => [...prev, anamnesisDoc]);
      try { await db.insertDocument(anamnesisDoc); } catch(e) { console.error("Add anamnesis doc:", e); }
    }
  }

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
            <TutorAiraHome
              user={currentUser} children={children} users={users} objectives={objectives}
              tutorReports={tutorReports}
              onOpenChild={openChild}
              onAddTutorReport={handleAddTutorReport}
            />
          ) : currentUser.home === "especialista" ? (
            <SpecialistHome
              user={currentUser} children={children} users={users} sessions={sessions}
              calendarEvents={calendarEvents} calendarLoading={calendarLoading} calendarError={calendarError}
              calendarDate={calendarDate} onCalendarDateChange={(d) => { setCalendarDate(d); fetchCalendarEvents(d); }}
              onOpenChild={openChild}
            />
          ) : currentUser.home === "clinico" ? (
            <ClinicalDirectorHome
              user={currentUser} children={children} users={users} sessions={sessions} objectives={objectives}
              tutors={tutors} tutorReports={tutorReports}
              calendarEvents={calendarEvents} calendarLoading={calendarLoading} calendarError={calendarError}
              calendarDate={calendarDate} onCalendarDateChange={(d) => { setCalendarDate(d); fetchCalendarEvents(d); }}
              activityLog={activityLog} onMarkSeen={() => setActivityLog(prev => prev.map(a => ({...a, seen:true})))}
              onOpenChild={openChild}
              onConnectGcal={handleConnectGcal}
            />
          ) : currentUser.home === "admin" ? (
            <AdminDashboard
              children={children} users={users} sessions={sessions} objectives={objectives} parentReports={parentReports}
              calendarEvents={calendarEvents} calendarLoading={calendarLoading} calendarError={calendarError}
              calendarDate={calendarDate} onCalendarDateChange={(d) => { setCalendarDate(d); fetchCalendarEvents(d); }}
              activityLog={activityLog} onMarkSeen={() => setActivityLog(prev => prev.map(a => ({...a, seen:true})))}
              onOpenChild={openChild}
              onConnectGcal={handleConnectGcal}
              currentUser={currentUser}
              onAddChild={handleAddChild}
            />
          ) : null
        } />

        <Route path="/gabinete" element={
          can(currentUser, "gabinete:view") ? (
            <GabinetePanel
              schools={schools} users={users} gabineteSessions={gabineteSessions}
              onAddSession={handleAddGabineteSession}
              onAddSchool={handleAddSchool}
            />
          ) : <Navigate to="/" replace />
        } />

        <Route path="/paciente/:childId" element={
          !dataLoaded ? (
            <RouteLoading />
          ) : selectedChild ? (
            <ChildProfile
              child={selectedChild} users={users} sessions={sessions} objectives={objectives}
              documents={documents} meetings={meetings} parentReports={parentReports}
              currentUser={currentUser}
              onUpdateObjective={handleUpdateObjective}
              onAddObjective={handleAddObjective}
              onDeleteObjective={handleDeleteObjective}
              onRenewPackage={handleRenewPackage}
              onUpdateChild={handleUpdateChild}
              onCloseProcess={handleCloseProcess}
              onUpdateSession={handleUpdateSession}
              onUpdateDocument={handleUpdateDocument}
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