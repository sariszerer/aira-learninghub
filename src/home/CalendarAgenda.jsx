import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { T, TODAY } from "../theme.js";
import { Card, EmptyNote, Eyebrow, Tabs } from "../ui/index.js";
import { useCalendarStore } from "../store/calendarStore.js";
import {
  agruparPorDia, diasDeMes, diasDeSemana, etiquetaMes, sumarDias, sumarMeses,
} from "../lib/semana.js";
import { contar, fmtDate } from "../lib/format.js";
import RejillaHoraria from "./RejillaHoraria.jsx";
import RejillaMes from "./RejillaMes.jsx";

// Agenda del centro, en tres vistas.
//
// Antes era una lista de un solo día. Sirve para trabajar el día de hoy y para
// nada más: no dice dónde está el hueco de mañana, ni qué se pisa, ni cómo va
// la semana. Ahora:
//
//   Día     rejilla horaria de ese día
//   Semana  las mismas horas en siete columnas; se pulsa un día y se baja a él
//   Mes     la forma del mes entero; se pulsa un día y se baja a él
//   Lista   la semana en filas, agrupada por día — es la que deja vincular
//
// El rango que se le pide a Google lo decide la vista, no esta pantalla.

const VISTAS = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "lista", label: "Lista" },
];

// Colores por especialista, deducidos del título del evento.
//
// Los eventos del calendario no traen quién atiende en un campo: lo llevan en
// el texto ("Haim - Sarita"). Es frágil pero es lo que hay, y da a la rejilla
// la única pista visual de quién tiene el día cargado.
const COLORES = {
  celilia: "#6E8FA6", idaira: "#7FA88A", neyma: "#A6779A",
  milagros: "#82A166", ingrid: "#9AA4C4", daniella: "#C79A6B",
  mavi: "#B58AC7", virginia: "#B58AC7", sarita: "#175FAF",
};
const colorDe = (titulo) => {
  const t = (titulo || "").toLowerCase();
  for (const [clave, c] of Object.entries(COLORES)) if (t.includes(clave)) return c;
  return "#8A9BAD";
};

function CalendarAgenda({ children, onOpenChild }) {
  const eventos = useCalendarStore((s) => s.events);
  const cargando = useCalendarStore((s) => s.loading);
  const error = useCalendarStore((s) => s.error);
  const fecha = useCalendarStore((s) => s.date);
  const vista = useCalendarStore((s) => s.vista);
  const setFecha = useCalendarStore((s) => s.setDate);
  const setVista = useCalendarStore((s) => s.setVista);

  // Los vínculos se guardan por id de evento, no por posición en la lista.
  // Con el índice, cambiar de día dejaba el vínculo apuntando a la cita que
  // ocupara ese puesto: el paciente de las 9:45 aparecía en la de las 11:30.
  const [vinculos, setVinculos] = useState({});
  const [vinculando, setVinculando] = useState(null);
  const [busca, setBusca] = useState("");
  const [elegido, setElegido] = useState(null);

  const esDia = vista === "dia";
  const esMes = vista === "mes";
  const dias = useMemo(
    () => (esDia ? [fecha] : esMes ? diasDeMes(fecha) : diasDeSemana(fecha)),
    [esDia, esMes, fecha]
  );
  const porDia = useMemo(() => agruparPorDia(eventos), [eventos]);

  // La flecha avanza lo que la vista abarca: un día, una semana, un mes.
  const saltar = (n) =>
    setFecha(esMes ? sumarMeses(fecha, n) : sumarDias(fecha, esDia ? n : n * 7));

  const irAlDia = (d) => { setFecha(d); setVista("dia"); setElegido(null); };

  const candidatos = children
    .filter((c) => `${c.name} ${c.lastName}`.toLowerCase().includes(busca.toLowerCase()))
    .slice(0, 8);

  const vincular = (idEvento, childId) => {
    setVinculos((v) => ({ ...v, [idEvento]: childId }));
    setVinculando(null);
    setBusca("");
  };
  const desvincular = (idEvento) =>
    setVinculos((v) => { const n = { ...v }; delete n[idEvento]; return n; });

  const detalle = elegido ? eventos.find((e) => e.id === elegido) : null;

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <Eyebrow>Agenda — Google Calendar</Eyebrow>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>
            {esDia ? fmtDate(fecha)
              : esMes ? etiquetaMes(fecha)
              : `${fmtDate(dias[0])} — ${fmtDate(dias[6])}`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {cargando && <Girando />}
          <Flecha hacia="atras" onClick={() => saltar(-1)} />
          <button
            type="button" onClick={() => setFecha(TODAY)}
            style={{
              padding: "6px 12px", borderRadius: 9, cursor: "pointer",
              border: `1px solid ${T.border}`, background: T.surface,
              fontFamily: T.font, fontSize: 12.5, fontWeight: 600, color: T.ink,
            }}
          >
            Hoy
          </button>
          <Flecha hacia="adelante" onClick={() => saltar(1)} />
          <input
            type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.ink, background: "#fff", outline: "none" }}
          />
        </div>
      </div>

      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>

      <Tabs tabs={VISTAS} activo={vista} onCambiar={(v) => { setVista(v); setElegido(null); }} />

      {/* El motivo se muestra entero. Un "no se pudo cargar" genérico obliga a
          adivinar si es permiso, sesión o configuración del servidor, y cada una
          se arregla en un sitio distinto y por una persona distinta. */}
      {error && (
        <div style={{ fontSize: 13, color: "#B56060", padding: "10px 14px", background: "#FFF0F0", borderRadius: 10, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* En mes la rejilla se dibuja igual sin citas: enseña la forma del mes y
          se puede navegar. Un aviso en su lugar dejaría la pantalla sin nada
          donde pulsar. */}
      {!error && eventos.length === 0 && !cargando && !esMes && (
        <EmptyNote
          text={esDia ? "No hay eventos en el calendario para este día." : "No hay eventos esta semana."}
          dentroDeCaja
        />
      )}

      {!error && esMes && (
        <RejillaMes
          dias={dias} mes={fecha} porDia={porDia} hoy={TODAY}
          color={colorDe} onElegirDia={irAlDia}
        />
      )}

      {!error && eventos.length > 0 && vista === "lista" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {dias.filter((d) => porDia.get(d)?.length).map((d) => (
            <div key={d}>
              <div style={{
                display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7,
                paddingBottom: 5, borderBottom: `1px solid ${T.borderSoft}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: d === TODAY ? T.brand : T.ink }}>
                  {fmtDate(d)}
                </span>
                <span style={{ fontSize: 11.5, color: T.inkFaint }}>
                  {contar(porDia.get(d).length, "cita", "citas")}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {porDia.get(d).map((ev) => (
                  <FilaEvento
                    key={ev.id} ev={ev} color={colorDe(ev.title)}
                    vinculado={children.find((c) => c.id === vinculos[ev.id])}
                    vinculando={vinculando === ev.id}
                    onAlternarVinculo={() => { setVinculando(vinculando === ev.id ? null : ev.id); setBusca(""); }}
                    onDesvincular={() => desvincular(ev.id)}
                    onAbrirNino={onOpenChild}
                    busca={busca} onBuscar={setBusca}
                    candidatos={candidatos} onElegir={(id) => vincular(ev.id, id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!error && eventos.length > 0 && !esMes && vista !== "lista" && (
        <>
          <RejillaHoraria
            dias={dias} eventos={eventos} hoy={TODAY} color={colorDe}
            seleccionado={elegido}
            onElegirDia={irAlDia}
            onElegirEvento={(e) => setElegido(elegido === e.id ? null : e.id)}
          />

          {/* Detalle de la cita pulsada. Vive fuera de la rejilla porque dentro
              del bloque no cabe: una cita de 45 minutos son 39 píxeles de alto. */}
          {detalle && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <FilaEvento
                ev={detalle} color={colorDe(detalle.title)}
                vinculado={children.find((c) => c.id === vinculos[detalle.id])}
                vinculando={vinculando === detalle.id}
                onAlternarVinculo={() => { setVinculando(vinculando === detalle.id ? null : detalle.id); setBusca(""); }}
                onDesvincular={() => desvincular(detalle.id)}
                onAbrirNino={onOpenChild}
                busca={busca} onBuscar={setBusca}
                candidatos={candidatos} onElegir={(id) => vincular(detalle.id, id)}
                mostrarFecha={!esDia}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// Una cita como fila, con su control de vínculo.
//
// A nivel de módulo y no dentro de CalendarAgenda: un componente definido en el
// cuerpo es un tipo nuevo en cada render, React desmonta el input de búsqueda y
// monta otro, y se pierde el foco a cada tecla.
function FilaEvento({
  ev, color, vinculado, vinculando, onAlternarVinculo, onDesvincular, onAbrirNino,
  busca, onBuscar, candidatos, onElegir, mostrarFecha = false,
}) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
        borderRadius: vinculando ? "11px 11px 0 0" : 11,
        background: vinculando ? T.bg : T.surfaceSunk,
        border: vinculando ? `1.5px solid ${T.brand}` : undefined,
      }}>
        <div style={{ minWidth: 58, textAlign: "right", flexShrink: 0 }}>
          {ev.diaCompleto ? (
            <div style={{ fontSize: 11, color: T.inkFaint }}>todo el día</div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{ev.time}</div>
              {ev.endTime && <div style={{ fontSize: 11, color: T.inkFaint, fontVariantNumeric: "tabular-nums" }}>{ev.endTime}</div>}
            </>
          )}
        </div>

        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, color: T.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            textDecoration: ev.cancelled ? "line-through" : "none",
            opacity: ev.cancelled ? 0.6 : 1,
          }}>
            {ev.title || ev.raw}
          </div>
          {mostrarFecha && (
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>{fmtDate(ev.fecha)}</div>
          )}
          {vinculado && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: vinculado.avatarBg, flexShrink: 0 }} />
              <span
                onClick={() => onAbrirNino(vinculado.id)}
                style={{ fontSize: 12, color: T.brand, fontWeight: 600, cursor: "pointer" }}
              >
                {vinculado.name} {vinculado.lastName}
              </span>
              <button onClick={onDesvincular} aria-label="Quitar vínculo" style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: "0 2px", lineHeight: 0 }}>
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onAlternarVinculo}
          style={{
            background: vinculando ? T.brand : "none",
            color: vinculando ? "#fff" : T.inkSoft,
            border: `1px solid ${vinculando ? T.brand : T.border}`,
            borderRadius: 8, padding: "4px 10px", fontSize: 11.5,
            fontFamily: T.font, cursor: "pointer", fontWeight: 600,
            whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          {vinculado ? "cambiar" : "vincular"}
        </button>
      </div>

      {vinculando && (
        <div style={{
          background: "#fff", border: `1.5px solid ${T.brand}`, borderTop: "none",
          borderRadius: "0 0 11px 11px", padding: "10px 14px",
        }}>
          <input
            autoFocus value={busca} onChange={(e) => onBuscar(e.target.value)}
            placeholder="Buscar paciente..."
            style={{
              width: "100%", boxSizing: "border-box", padding: "7px 10px",
              borderRadius: 8, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, color: T.ink, outline: "none",
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {candidatos.length === 0 ? (
              <span style={{ fontSize: 12, color: T.inkFaint }}>Ningún paciente coincide.</span>
            ) : candidatos.map((c) => (
              <button
                key={c.id} onClick={() => onElegir(c.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                  padding: "5px 10px", borderRadius: 999,
                  border: `1px solid ${T.border}`, background: T.surface,
                  fontFamily: T.font, fontSize: 12.5, color: T.ink,
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: 4, background: c.avatarBg }} />
                {c.name} {c.lastName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Flecha({ hacia, onClick }) {
  const Icono = hacia === "atras" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button" onClick={onClick}
      aria-label={hacia === "atras" ? "Anterior" : "Siguiente"}
      style={{
        width: 30, height: 30, borderRadius: 9, cursor: "pointer",
        border: `1px solid ${T.border}`, background: T.surface,
        display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSoft,
      }}
    >
      <Icono size={15} />
    </button>
  );
}

function Girando() {
  return (
    <span style={{ fontSize: 12, color: T.inkSoft, display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{
        display: "inline-block", width: 10, height: 10, borderRadius: "50%",
        border: `2px solid ${T.brand}`, borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite",
      }} />
      Cargando…
    </span>
  );
}

export default CalendarAgenda;
