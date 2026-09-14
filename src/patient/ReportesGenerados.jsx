import React from "react";
import { Eye } from "lucide-react";
import { T } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { Card, EmptyNote } from "../ui/index.js";

// Los reportes que ya se generaron.
//
// Se guardaban y no se veían en ninguna parte: el de evolución sólo aparecía
// listado DENTRO del historial clínico completo, que hay que generar para
// verlo, y el de la familia en ningún sitio. Desde la pestaña de Reportes uno
// veía tres botones de generar y nada de lo generado, así que no había forma
// de saber si ya se le había mandado algo a la familia el mes pasado.

function Fila({ titulo, periodo, pie, onVer }) {
  return (
    <Card style={{ padding: "13px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{titulo}</div>
          <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{periodo}</div>
          {pie && (
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 4, lineHeight: 1.5 }}>{pie}</div>
          )}
        </div>
        {onVer && (
          <button
            onClick={onVer}
            style={{
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              padding: "5px 11px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.surface, fontFamily: T.font, fontSize: 12.5,
              fontWeight: 600, color: T.brand, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <Eye size={13} /> Ver
          </button>
        )}
      </div>
    </Card>
  );
}

export function EvolucionesGuardadas({ reportes, users, onVer }) {
  if (reportes.length === 0) {
    return <EmptyNote text="Aún no se ha generado ningún reporte de evolución." />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {reportes.map((r) => {
        const quien = users.find((u) => u.id === r.generatedBy);
        return (
          <Fila
            key={r.id}
            titulo={r.specialty || "Todas las áreas"}
            periodo={`${fmtDate(r.fromDate)} – ${fmtDate(r.toDate)}`}
            pie={`Generado el ${fmtDate(r.generatedDate)}${quien ? ` por ${quien.name}` : ""}`}
            onVer={() => onVer(r)}
          />
        );
      })}
    </div>
  );
}

export function FamiliaGuardados({ reportes }) {
  if (reportes.length === 0) {
    return <EmptyNote text="Aún no se ha generado ningún reporte para la familia." />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* De estos se guarda el acuse, no el texto: qué período se cubrió y
          con cuántas sesiones. Es lo que alimenta el aviso "van N sesiones
          desde el último reporte". Se dice aquí en vez de ofrecer un "Ver"
          que abriría un documento recompuesto con datos de hoy — que no es el
          que se le mandó a la familia. */}
      <div style={{
        fontSize: 11.5, color: T.inkSoft, lineHeight: 1.6,
        padding: "9px 12px", background: T.surfaceSunk, borderRadius: 9,
      }}>
        De estos se conserva el registro de que se hicieron y el período que
        cubrían, no el texto: cada uno se redacta y se envía en el momento.
      </div>
      {reportes.map((r) => (
        <Fila
          key={r.id}
          titulo={`Reporte enviado a la familia`}
          periodo={`${fmtDate(r.fromDate)} – ${fmtDate(r.toDate)}`}
          pie={`${r.sessionCount ?? 0} ${r.sessionCount === 1 ? "sesión" : "sesiones"} en el período · generado el ${fmtDate(r.generatedDate)}`}
        />
      ))}
    </div>
  );
}
