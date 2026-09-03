import React, { useState } from "react";
import { Search } from "lucide-react";
import { T, TODAY } from "../theme.js";
import { visibleChildren } from "../permissions.js";
import { Eyebrow } from "../ui/index.js";
import TodaySchedule from "./TodaySchedule.jsx";
import CalendarAgenda from "./CalendarAgenda.jsx";
import ChildCard from "./ChildCard.jsx";

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

export default SpecialistHome;
