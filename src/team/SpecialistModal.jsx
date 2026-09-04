import React, { useState } from "react";
import { T } from "../theme.js";
import { ROLES } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { Btn, Chip } from "../ui/index.js";

// Alta y edicion de un miembro del equipo.
//
// Alta y edicion no comparten camino: crear pasa por la Edge Function, que
// tambien crea el usuario de auth; editar va directo a la tabla. Por eso el
// correo y el rol solo se piden al crear — cambiar el correo de alguien que ya
// entra requiere mover tambien su cuenta de auth, y eso es otra operacion.

// Colores de avatar. Se eligen a mano y no de los tokens porque tienen que
// distinguirse ENTRE SI de un vistazo: son la forma de reconocer a una persona
// en una lista, no de comunicar marca.
// Todos con contraste >= 4.6 contra texto blanco (WCAG AA). El selector no
// puede ofrecer un color que produzca un avatar ilegible: los anteriores
// (#06B6D4, #F59E0B, #10B981) daban 2.4, 2.1 y 2.5.
const PALETA = ["#1C74DA", "#048096", "#5564F6", "#0C855D", "#A26807", "#E81414", "#0E7490", "#7C3AED"];

const ROLES_ASIGNABLES = ["specialist", "clinical_director", "admin"];

export default function SpecialistModal({ usuario, onClose }) {
  const crearEspecialista = useDataStore((s) => s.crearEspecialista);
  const updateUser = useDataStore((s) => s.updateUser);
  const cambiarCorreo = useDataStore((s) => s.cambiarCorreo);
  const currentUser = useAuthStore((s) => s.currentUser);

  const esNuevo = !usuario;
  const esUnoMismo = usuario?.id === currentUser?.id;

  const [form, setForm] = useState({
    name: usuario?.name || "",
    email: usuario?.email || "",
    role: usuario?.role || "specialist",
    specialty: usuario?.specialty || "",
    title: usuario?.title || "",
    licenseNo: usuario?.licenseNo || "",
    avatarBg: usuario?.avatarBg || PALETA[0],
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const correoCambia = !esNuevo && form.email.trim().toLowerCase() !== (usuario?.email || "").toLowerCase();
  const valido = form.name.trim()
    && (!esNuevo || CORREO.test(form.email.trim()))
    && (!correoCambia || CORREO.test(form.email.trim()));

  const guardar = async () => {
    setError(null); setAviso(null); setGuardando(true);
    try {
      if (esNuevo) {
        const res = await crearEspecialista({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          specialty: form.specialty.trim() || null,
          title: form.title.trim() || null,
          licenseNo: form.licenseNo.trim() || null,
          avatarBg: form.avatarBg,
        });
        if (res?.aviso) { setAviso(res.aviso); setGuardando(false); return; }
      } else {
        const cambios = {
          name: form.name.trim(),
          specialty: form.specialty.trim() || null,
          title: form.title.trim() || null,
          licenseNo: form.licenseNo.trim() || null,
          avatarBg: form.avatarBg,
        };
        // El rol solo viaja si de verdad cambio, y nunca el propio: la base lo
        // rechaza con un trigger y es mejor no ofrecerlo que fallar despues.
        if (!esUnoMismo && form.role !== usuario.role) cambios.role = form.role;
        await updateUser(usuario.id, cambios);
        // Va aparte y despues: pasa por una funcion edge porque toca auth.users.
        // Si fallara, el resto del perfil ya quedo guardado y el correo sigue
        // siendo el de antes — que es el estado seguro, nadie pierde el acceso.
        if (correoCambia) {
          const res = await cambiarCorreo(usuario.id, form.email.trim());
          if (res?.aviso) { setAviso(res.aviso); setGuardando(false); return; }
        }
      }
      onClose();
    } catch (e) {
      setError(e.message || "No se pudo guardar.");
      setGuardando(false);
    }
  };

  const campo = (etiqueta, k, opciones = {}) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5,
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {etiqueta}
      </div>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        disabled={opciones.disabled}
        placeholder={opciones.placeholder}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: T.radiusSm,
          border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font,
          outline: "none", boxSizing: "border-box",
          background: opciones.disabled ? T.surfaceSunk : T.surface,
          color: opciones.disabled ? T.inkFaint : T.ink,
        }}
      />
      {opciones.nota && (
        <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 4 }}>{opciones.nota}</div>
      )}
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surface, borderRadius: T.radius, padding: 26,
          width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(17,24,39,0.25)", fontFamily: T.font,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 20 }}>
          {esNuevo ? "Nuevo especialista" : "Editar especialista"}
        </div>

        {campo("Nombre completo", "name")}

        {esNuevo
          ? campo("Correo", "email", {
              placeholder: "nombre@airalearninghub.com",
              nota: "Recibirá una invitación para fijar su contraseña.",
            })
          : campo("Correo", "email", {
              // Ya es editable: una funcion edge mueve a la vez public.users y
              // auth.users. Antes estaba bloqueado porque cambiar solo el
              // primero dejaba la pantalla diciendo una cosa y el acceso
              // funcionando con otra.
              nota: correoCambia
                ? `Es su usuario de acceso: a partir de guardar entrará con ${form.email.trim()}. La contraseña no cambia.`
                : "Es también su usuario de acceso.",
            })}

        {campo("Especialidad", "specialty", { placeholder: "Fonoaudiología" })}
        {campo("Título", "title", { placeholder: "Terapeuta ocupacional" })}
        {/* Firma del Reporte de Evolución: el documento pide "N° de
            licencia/idoneidad" junto al nombre y la especialidad. */}
        {campo("N° de idoneidad", "licenseNo", { placeholder: "Aparece en la firma de los reportes" })}

        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            Rol
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ROLES_ASIGNABLES.map((r) => (
              <Chip
                key={r}
                label={ROLES[r]?.etiqueta || r}
                selected={form.role === r}
                onClick={() => { if (!esUnoMismo) set("role", r); }}
              />
            ))}
          </div>
          {esUnoMismo && (
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 5 }}>
              No puedes cambiar tu propio rol. Tiene que hacerlo otro administrador.
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 6,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            Color
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {PALETA.map((c) => (
              <button
                key={c}
                onClick={() => set("avatarBg", c)}
                style={{
                  width: 26, height: 26, borderRadius: "50%", background: c,
                  cursor: "pointer",
                  border: form.avatarBg === c ? `2px solid ${T.ink}` : "2px solid transparent",
                  outline: form.avatarBg === c ? `2px solid ${T.surface}` : "none",
                  outlineOffset: -4,
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: T.apoyoTint, color: T.apoyo, borderRadius: T.radiusSm,
            padding: "9px 12px", fontSize: 13, marginBottom: 14,
          }}>
            {error}
          </div>
        )}
        {aviso && (
          <div style={{
            background: T.procesoTint, color: T.amberDeep, borderRadius: T.radiusSm,
            padding: "9px 12px", fontSize: 13, marginBottom: 14,
          }}>
            {aviso}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="secondary" size="md" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={guardar} disabled={!valido || guardando}>{guardando ? "Guardando…" : esNuevo ? "Crear e invitar" : "Guardar"}</Btn>
        </div>
      </div>
    </div>
  );
}
