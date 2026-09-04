import React, { useState } from "react";
import { T, TODAY } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { Eyebrow, Card, Btn } from "../ui/index.js";
import { useDataStore } from "../store/dataStore.js";
import { Plus } from "lucide-react";

function TutorAiraHome({ user, onOpenChild }) {
  const children = useDataStore((s) => s.children);
  const users = useDataStore((s) => s.users);
  const objectives = useDataStore((s) => s.objectives);
  const tutorReports = useDataStore((s) => s.tutorReports);
  const onAddTutorReport = useDataStore((s) => s.addTutorReport);
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
        <div style={{ fontFamily: T.font, fontSize: 21, fontWeight: 700, color: T.ink }}>
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
            <div style={{ fontFamily: T.font, fontSize: 18, fontWeight: 600, color: T.ink }}>{child.name} {child.lastName}</div>
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
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
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
          <div style={{ fontFamily: T.font, fontSize: 20, fontWeight: 500, color: T.ink, marginBottom: 20 }}>
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
                          fontFamily: T.font, fontWeight: 600,
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
                  fontSize: 14, fontFamily: T.font, resize: "vertical", boxSizing: "border-box",
                  outline: "none", color: T.ink, background: "#fff",
                }}
              />
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setForm(null)} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 14, fontFamily: T.font, cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleSubmit} disabled={!form.logros.trim()} style={{
              padding: "10px 22px", borderRadius: 10, border: "none", background: T.brand, color: "#fff",
              fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer",
              opacity: !form.logros.trim() ? 0.5 : 1,
            }}>Enviar reporte</button>
          </div>
        </Card>
      )}

      {/* Button to open form if not due */}
      {!dueAlert && !form && (
        <div style={{ marginBottom: 22 }}>
          <Btn icon={Plus} onClick={() => setForm(emptyForm())}>Nuevo reporte quincenal</Btn>
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

export default TutorAiraHome;
