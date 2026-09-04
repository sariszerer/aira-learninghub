import React, { useState } from "react";
import { Calendar, X } from "lucide-react";
import { T, SPECIALIST_COLORS } from "../theme.js";
import { Eyebrow, Card, Btn } from "../ui/index.js";

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
            style={{ padding: "5px 10px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.ink, background: "#fff", outline: "none" }}
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
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          padding: "14px 0",
        }}>
          <span style={{ fontSize: 13, color: T.inkSoft }}>
            Conecta Google Calendar para ver la agenda
          </span>
          <Btn size="sm" onClick={onConnectGcal}>Conectar</Btn>
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: "#B56060", padding: "10px 14px", background: "#FFF0F0", borderRadius: 10, marginBottom: 12 }}>{error}</div>
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
                        <button onClick={() => handleUnlink(i)} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, fontSize: 11, padding: "0 2px" }}><X size={12} /></button>
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
                      fontFamily: T.font, cursor: "pointer", fontWeight: 600,
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}
                  >
                    {linkedChild ? "cambiar" : "vincular"}
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
                        fontFamily: T.font, outline: "none", marginBottom: 8, boxSizing: "border-box",
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

export default CalendarAgenda;
