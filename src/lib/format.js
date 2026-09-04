// Utilidades de formato y color. Funciones puras, sin dependencias de React.

import { TODAY } from "../theme.js";

export function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export function fmtDateShort(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "").toUpperCase();
}

export function readableTextOn(hex) {
  if (!hex || hex[0] !== "#") return "#fff";
  const h = hex.length === 4
    ? "#" + [...hex.slice(1)].map((c) => c + c).join("")
    : hex;
  // Antes decidia con brillo percibido (0.299/0.587/0.114) y un umbral de 0.62.
  // Ese umbral elegia BLANCO sobre colores medios donde el oscuro contrastaba el
  // doble: sobre #7FA88A daba 2.67 pudiendo dar 6.65. Ahora se calcula el
  // contraste WCAG real contra las dos tintas y gana la mayor — sin umbral que
  // ajustar, y ningun color puede volver a recibir la peor de las dos.
  return contrasteWCAG("#FFFFFF", h) >= contrasteWCAG(TINTA_OSCURA, h)
    ? "#fff"
    : TINTA_OSCURA;
}

const TINTA_OSCURA = "#1B2A3A";

// Luminancia relativa WCAG 2.1: linealiza cada canal antes de ponderar. Es lo
// que distingue esta cuenta de la del brillo percibido, que pondera el valor
// sRGB crudo y por eso sobreestima los tonos medios.
function luminancia(h) {
  const canal = (v) => {
    const c = parseInt(v, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(h.slice(1, 3)) + 0.7152 * canal(h.slice(3, 5)) + 0.0722 * canal(h.slice(5, 7));
}

export function contrasteWCAG(a, b) {
  const [alta, baja] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (alta + 0.05) / (baja + 0.05);
}

export function slugifyName(s) {
  return (s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 14) || "paciente";
}

export function daysAgoISO(n) {
  const d = new Date(TODAY + "T00:00:00");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
