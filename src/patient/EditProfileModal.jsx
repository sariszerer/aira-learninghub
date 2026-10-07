import React, { useMemo, useState } from "react";
import { T, inputStyle } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn, Chip, Modal, ModalHeader } from "../ui/index.js";
import { atiendePacientes, can } from "../permissions.js";
import { useAuthStore } from "../store/authStore.js";
import { avisar } from "../store/avisosStore.js";
import { queFalta } from "../lib/validacion.js";

// Modal de edicion del perfil del paciente.
//
// Se reescribio sobre las primitivas compartidas (Modal, ModalHeader, Btn): la
// version anterior dibujaba a mano su propio fondo y sus propios botones, y el
// de Cancelar llamaba a setEditingProfile — un setter que existia cuando esto
// vivia dentro de ChildProfile y que aqui no esta definido. Pulsarlo lanzaba un
// ReferenceError en vez de cerrar.
//
// Los campos nuevos son los que pide Formatos_Reportes_AIRA.docx en el
// encabezado de los tres reportes y en "Datos de identificacion" y "Estado
// actual" del Historial Clinico.

const ESTADOS = [
  { valor: "activo", label: "Activo" },
  { valor: "pausa", label: "En pausa" },
  { valor: "alta", label: "De alta" },
];

export default function EditProfileModal({ child, onClose }) {
  const onUpdateChild = useDataStore((s) => s.updateChild);
  const users = useDataStore((s) => s.users);
  const currentUser = useAuthStore((s) => s.currentUser);

  // Asignar especialistas es de dirección. La base lo impide con un trigger
  // aunque esta pantalla mienta; aquí solo se evita ofrecer un control que va a
  // ser rechazado.
  const puedeAsignar = can(currentUser, "patient:assign");
  // Declarar que terapias recibe un paciente es editar su ficha, no decidir
  // quien entra a su expediente: va con patient:edit y no con patient:assign.
  const puedeEditar = can(currentUser, "patient:edit");

  // Solo quien atiende. Los roles clinicos los declara la matriz de permisos,
  // no una lista de nombres de rol repetida aqui.
  const clinicos = useMemo(
    () => users
      .filter((u) => u.activo !== false && atiendePacientes(u))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );
  // Las disciplinas que conoce el centro, para no escribirlas a mano cada vez
  // ni inventar variantes: "Fonoaudiologia" y "Fonoaudiología" ya conviven en
  // la base de tanto teclearlas.
  const disciplinas = useMemo(() => {
    const set = new Set();
    for (const u of users) if (u.specialty) set.add(u.specialty);
    for (const e of child.specialties || []) if (e) set.add(e);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [users, child.specialties]);

  const [otraTerapia, setOtraTerapia] = useState("");

  const [f, setF] = useState({
    name: child.name || "",
    lastName: child.lastName || "",
    recordNo: child.recordNo || "",
    birthDate: child.birthDate || "",
    admissionDate: child.admissionDate || "",
    school: child.school || "",
    referralReason: child.referralReason || "",
    status: child.status === "inactivo" ? "pausa" : child.status || "activo",
    dischargeDate: child.dischargeDate || "",
    dischargeReason: child.dischargeReason || "",
    parentName: child.parentContact?.name || "",
    parentPhone: child.parentContact?.phone || "",
    parentEmail: child.parentContact?.email || "",
    assignedSpecialists: child.assignedSpecialists || [],
    specialties: child.specialties || [],
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const anadirOtra = () => {
    const nombre = otraTerapia.trim();
    if (!nombre) return;
    // Sin distinguir mayusculas: "Fonoaudiologia" y "fonoaudiologia" en la
    // misma ficha son dos terapias distintas para los filtros y los reportes.
    const yaEsta = f.specialties.some((x) => x.toLowerCase() === nombre.toLowerCase());
    if (!yaEsta) set("specialties", [...f.specialties, nombre]);
    setOtraTerapia("");
  };

  const guardar = () => {
    const falta = queFalta([
      [!!f.name.trim(), "el nombre"],
      [!!f.lastName.trim(), "el apellido"],
    ]);
    if (falta) { avisar.error(falta); return; }
    onUpdateChild(child.id, {
      name: f.name.trim(),
      lastName: f.lastName.trim(),
      recordNo: f.recordNo.trim() || null,
      birthDate: f.birthDate || null,
      admissionDate: f.admissionDate || null,
      school: f.school.trim() || null,
      referralReason: f.referralReason.trim() || null,
      status: f.status,
      // Los campos de alta solo se guardan si el estado es "de alta": dejar una
      // fecha de alta en un paciente activo saldria en el Historial como una
      // contradiccion.
      dischargeDate: f.status === "alta" ? f.dischargeDate || null : null,
      dischargeReason: f.status === "alta" ? f.dischargeReason.trim() || null : null,
      parentContact: { name: f.parentName, phone: f.parentPhone, email: f.parentEmail },
      // Sin permiso, el campo NO viaja. Mandarlo igual — aunque fuera el mismo
      // valor — deja el guardado a merced de que los arrays coincidan hasta en
      // el orden, y un cambio ajeno entre medias haría fallar todo el formulario.
      // Las terapias se editan a mano. Se derivaban de quien atendia al
      // paciente y la lista solo CRECIA — concat sobre las que ya habia — asi
      // que no habia forma de anadir una disciplina sin asignar antes a una
      // especialista de ella, ni de quitar una puesta por error: "Kids Club"
      // se quedo en la ficha de Isaac y de Samson, que no la reciben.
      //
      // Asignar a alguien sigue proponiendo su disciplina; lo que cambia es
      // que ahora se puede desmarcar.
      ...(puedeEditar ? { specialties: f.specialties } : {}),
      ...(puedeAsignar ? { assignedSpecialists: f.assignedSpecialists } : {}),
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} width={620}>
      <ModalHeader
        title="Editar perfil"
        subtitle={`${child.name} ${child.lastName}`}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <Grupo>
          <Campo etiqueta="Nombre">
            <Texto valor={f.name} onChange={(v) => set("name", v)} />
          </Campo>
          <Campo etiqueta="Apellido">
            <Texto valor={f.lastName} onChange={(v) => set("lastName", v)} />
          </Campo>
        </Grupo>

        <Grupo>
          <Campo etiqueta="N° de expediente" ayuda="Aparece en el encabezado de los tres reportes">
            <Texto valor={f.recordNo} onChange={(v) => set("recordNo", v)} placeholder="AIRA-0000" />
          </Campo>
          <Campo etiqueta="Colegio">
            <Texto valor={f.school} onChange={(v) => set("school", v)} />
          </Campo>
        </Grupo>

        <Grupo>
          <Campo etiqueta="Fecha de nacimiento">
            <Texto tipo="date" valor={f.birthDate} onChange={(v) => set("birthDate", v)} />
          </Campo>
          <Campo etiqueta="Fecha de ingreso">
            <Texto tipo="date" valor={f.admissionDate} onChange={(v) => set("admissionDate", v)} />
          </Campo>
        </Grupo>

        <Campo etiqueta="Motivo de consulta inicial" ayuda="Por qué llegó a AIRA. Va en el Historial Clínico.">
          <textarea
            value={f.referralReason} onChange={(e) => set("referralReason", e.target.value)} rows={2}
            placeholder="Ej: retraso en la adquisición del lenguaje expresivo reportado por el colegio."
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
          />
        </Campo>

        <Campo etiqueta="Estado del proceso">
          <div style={{ display: "flex", gap: 6 }}>
            {ESTADOS.map((e) => {
              const sel = f.status === e.valor;
              return (
                <button
                  key={e.valor} type="button" onClick={() => set("status", e.valor)}
                  style={{
                    flex: 1, padding: "9px 6px", borderRadius: 8, cursor: "pointer",
                    fontFamily: T.font, fontSize: 12.5, fontWeight: sel ? 700 : 400,
                    border: `1.5px solid ${sel ? T.brand : T.border}`,
                    background: sel ? T.brandTint : T.surface,
                    color: sel ? T.brand : T.inkSoft,
                  }}
                >
                  {e.label}
                </button>
              );
            })}
          </div>
        </Campo>

        {f.status === "alta" && (
          <>
            <Campo etiqueta="Fecha de alta">
              <Texto tipo="date" valor={f.dischargeDate} onChange={(v) => set("dischargeDate", v)} />
            </Campo>
            <Campo etiqueta="Motivo del alta y seguimiento">
              <textarea
                value={f.dischargeReason} onChange={(e) => set("dischargeReason", e.target.value)} rows={2}
                placeholder="Motivo del alta y recomendaciones de seguimiento."
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
              />
            </Campo>
          </>
        )}

        {puedeEditar && (
          <Campo
            etiqueta="Terapias que recibe"
            ayuda="Lo que aparece bajo el nombre del paciente. Se marca aunque todavía no haya especialista asignada."
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {disciplinas.map((d) => (
                <Chip
                  key={d} label={d}
                  selected={f.specialties.includes(d)}
                  onClick={() => set(
                    "specialties",
                    f.specialties.includes(d)
                      ? f.specialties.filter((x) => x !== d)
                      : [...f.specialties, d]
                  )}
                />
              ))}
            </div>
            {/* Una disciplina que el centro aun no tiene en ningun perfil.
                Sin esto habria que crear antes a la especialista para poder
                declarar la terapia, que es al reves de como se trabaja. */}
            <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
              <input
                value={otraTerapia}
                onChange={(e) => setOtraTerapia(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); anadirOtra(); } }}
                placeholder="Otra terapia"
                style={{ ...inputStyle, flex: 1, minWidth: 180 }}
              />
              <Btn variant="subtle" size="sm" onClick={anadirOtra}>Añadir</Btn>
            </div>
          </Campo>
        )}

        {puedeAsignar ? (
        <Campo
          etiqueta="Especialistas asignados"
          ayuda="Quien esté marcado podrá ver y editar este expediente."
        >
          {clinicos.length === 0 ? (
            <div style={{ fontSize: 12.5, color: T.inkFaint }}>
              No hay especialistas activos registrados.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {clinicos.map((u) => (
                <Chip
                  key={u.id}
                  label={u.specialty ? `${u.name} · ${u.specialty}` : u.name}
                  selected={f.assignedSpecialists.includes(u.id)}
                  // Asignar a alguien PROPONE su disciplina; quitarlo no la
                  // retira. Un paciente puede seguir en terapia ocupacional
                  // mientras se le cambia de terapeuta, y borrarle la terapia
                  // al soltar la asignacion le vaciaria la ficha.
                  onClick={() => setF((x) => {
                    const estaba = x.assignedSpecialists.includes(u.id);
                    return {
                      ...x,
                      assignedSpecialists: estaba
                        ? x.assignedSpecialists.filter((y) => y !== u.id)
                        : [...x.assignedSpecialists, u.id],
                      specialties: !estaba && u.specialty && !x.specialties.includes(u.specialty)
                        ? [...x.specialties, u.specialty]
                        : x.specialties,
                    };
                  })}
                />
              ))}
            </div>
          )}
        </Campo>
        ) : (
          // Se dice quién lo atiende y quién puede cambiarlo. Un hueco donde
          // antes había una sección se lee como un fallo, no como una regla.
          <Campo etiqueta="Especialistas asignados">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 6 }}>
              {clinicos
                .filter((u) => f.assignedSpecialists.includes(u.id))
                .map((u) => (
                  <span key={u.id} style={{
                    fontSize: 12.5, padding: "5px 11px", borderRadius: 999,
                    background: T.surfaceSunk, color: T.ink, border: `1px solid ${T.border}`,
                  }}>
                    {u.specialty ? `${u.name} · ${u.specialty}` : u.name}
                  </span>
                ))}
            </div>
            <div style={{ fontSize: 11.5, color: T.inkFaint }}>
              La asignación la cambia la dirección del centro.
            </div>
          </Campo>
        )}

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <Campo etiqueta="Nombre del padre / madre / tutor">
            <Texto valor={f.parentName} onChange={(v) => set("parentName", v)} />
          </Campo>
          <div style={{ height: 14 }} />
          <Grupo>
            <Campo etiqueta="Teléfono">
              <Texto valor={f.parentPhone} onChange={(v) => set("parentPhone", v)} />
            </Campo>
            <Campo etiqueta="Correo">
              <Texto tipo="email" valor={f.parentEmail} onChange={(v) => set("parentEmail", v)} />
            </Campo>
          </Grupo>
        </div>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar}>Guardar cambios</Btn>
      </div>
    </Modal>
  );
}

function Grupo({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}

function Campo({ etiqueta, ayuda, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: T.inkFaint,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5,
      }}>
        {etiqueta}
      </div>
      {ayuda && <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 5 }}>{ayuda}</div>}
      {children}
    </div>
  );
}

function Texto({ valor, onChange, tipo = "text", placeholder }) {
  return (
    <input
      type={tipo} value={valor} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
    />
  );
}
