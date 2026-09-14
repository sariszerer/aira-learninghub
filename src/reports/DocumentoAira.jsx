import React from "react";
import { T } from "../theme.js";
import { Logo } from "../ui/index.js";
import { AIRA_TRAZO_URI } from "../brand.js";

// Marco de marca compartido por los documentos que salen del centro.
//
// El documento lo pide explicito: "Los tres formatos comparten el mismo
// encabezado (logo Aira) y pie de pagina (paleta azul, datos de contacto)". Que
// viva en un solo componente es lo que hace que se cumpla: tres cabeceras
// copiadas divergen a la primera correccion. La minuta se sumo despues y
// heredo el membrete sin tocar nada.
//
// Reproduce MEMBRETE.docx, la hoja oficial: el bloque de marca completo arriba
// a la izquierda, saliendose un poco hacia el margen, y el trazo pastel de
// fondo ocupando el cuerpo de la primera pagina. Las medidas de abajo son las
// del .docx pasadas a proporcion de la columna de texto, para que se vean
// iguales en pantalla y en el PDF aunque la hoja mida distinto en cada sitio.
//
// La clase doc-imprimible es la que EstilosImpresion usa para aislar esto del
// resto de la aplicacion al imprimir.

// Del .docx: pagina carta con margenes de 1.25 pulgadas, o sea columna de 6".
// El logo mide 3.22" (54% de la columna) y sale 0.69" hacia el margen (-11.5%).
//
// El trazo alli mide 8.5" — la hoja entera — y arranca 1.22" a la izquierda de
// la columna: sangra hasta el borde del papel. Aqui no puede: al imprimir, el
// navegador no pinta nada fuera de la caja de margenes de @page, asi que un
// 141% se recortaria un 15% por cada lado y partiria la lazada. Se deja una
// sangria corta — 8% por lado — que conserva el gesto sin comerse el dibujo.
//
// La caja llega hasta el final del documento (bottom: 0) en vez de medir un
// alto propio. Asi el trazo termina donde termina la hoja: con un alto fijo,
// una minuta de media pagina lo sacaba por debajo del pie y lo pintaba sobre
// el fondo oscuro del visor, y al imprimir se metia en el margen inferior.
const TRAZO = { ancho: "116%", izquierda: "-8%", desdeArriba: 145 };
const LOGO = { ancho: "54%", maximo: 268, fuera: -11 };

// Los datos de contacto del centro. El membrete no los lleva impresos, asi que
// hasta que el centro de los suyos el pie solo dice quien emite y desde donde:
// un telefono inventado en un documento que va a un colegio es peor que no
// ponerlo. Se pintan los que esten rellenos y nada mas.
export const CONTACTO_AIRA = {
  nombre: "AIRA Learning Hub",
  telefono: "",
  correo: "",
  ciudad: "Ciudad de Panamá, Panamá",
};

// Se exporta porque ReporteFamilia arma con esto el pie del mensaje de correo o
// WhatsApp, donde no hay maquetacion y hay que unir lo que haya con separador.
export function lineaDeContacto(contacto = CONTACTO_AIRA) {
  return [contacto.nombre, contacto.ciudad, contacto.telefono, contacto.correo]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" · ");
}

export default function DocumentoAira({
  titulo,
  subtitulo,
  meta = [],
  confidencial = false,
  children,
}) {
  const datosPie = [CONTACTO_AIRA.telefono, CONTACTO_AIRA.correo]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="doc-imprimible"
      style={{
        position: "relative",
        background: "#fff",
        color: T.ink,
        fontFamily: T.font,
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      {/* El trazo del membrete.
          Va en su propia caja fuera de flujo y con overflow oculto: el dibujo
          es mas ancho que la hoja a proposito — asi sangra por los lados, como
          en el .docx — y sin recortarlo ensancharia el documento y el PDF
          saldria partido en dos columnas. Recortar AQUI y no en la raiz es lo
          que deja intacta la paginacion: un overflow:hidden en .doc-imprimible
          corta el expediente al final de la primera pagina.
          contentEditable en false porque el visor permite corregir el texto del
          documento a mano, y el fondo no debe poder borrarse de un retroceso. */}
      <div
        aria-hidden="true"
        contentEditable={false}
        style={{
          position: "absolute", left: 0, right: 0,
          top: TRAZO.desdeArriba, bottom: 0,
          overflow: "hidden", pointerEvents: "none", zIndex: 0,
        }}
      >
        <img
          src={AIRA_TRAZO_URI}
          alt=""
          style={{
            position: "absolute", top: 0,
            left: TRAZO.izquierda, width: TRAZO.ancho, height: "auto",
          }}
        />
      </div>

      {/* Todo lo demas por encima del trazo. */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <header style={{ paddingBottom: 14, borderBottom: `2.5px solid ${T.brand}` }}>
          <div style={{ marginLeft: LOGO.fuera, maxWidth: LOGO.maximo, width: LOGO.ancho }}>
            <Logo completo width="100%" />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: T.brand, letterSpacing: "-0.01em" }}>
              {titulo}
            </div>
            {subtitulo && (
              <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>{subtitulo}</div>
            )}
          </div>
        </header>

        {confidencial && (
          // "Debe incluir siempre un aviso de confidencialidad de datos de salud
          // en el encabezado o pie del documento."
          <div
            style={{
              marginTop: 12, padding: "8px 12px", borderRadius: 6,
              background: T.brandTint, color: T.brandDeep,
              fontSize: 11.5, fontWeight: 600, letterSpacing: "0.01em",
            }}
          >
            Documento confidencial · Contiene datos de salud de un menor. Su
            divulgación está restringida al personal autorizado y a los tutores legales.
          </div>
        )}

        {meta.length > 0 && (
          <div
            // La rejilla de datos se lee bien en un documento y fatal en un
            // WhatsApp, donde queda como una lista de etiquetas sueltas.
            className="no-mensaje"
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px 20px", marginTop: 14, padding: "12px 14px",
              background: T.surfaceSunk, borderRadius: 8,
            }}
          >
            {meta.filter((m) => m).map((m) => (
              <div key={m.etiqueta}>
                <div style={{
                  fontSize: 9.5, fontWeight: 700, color: T.inkFaint,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {m.etiqueta}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>
                  {m.valor || "—"}
                </div>
              </div>
            ))}
          </div>
        )}

        <main style={{ marginTop: 18 }}>{children}</main>

        <footer
          style={{
            marginTop: 26, paddingTop: 12, borderTop: `2.5px solid ${T.brand}`,
            display: "flex", justifyContent: "space-between", gap: 16,
            fontSize: 10.5, color: T.inkSoft,
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: T.brand }}>{CONTACTO_AIRA.nombre}</span>
            {CONTACTO_AIRA.ciudad ? ` · ${CONTACTO_AIRA.ciudad}` : ""}
          </div>
          {datosPie && <div>{datosPie}</div>}
        </footer>
      </div>
    </div>
  );
}
