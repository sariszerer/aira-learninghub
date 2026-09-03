// Tokens de diseno de AIRA Learning Hub.
//
// Lenguaje visual: panel de gestion moderno. Violeta como color de marca, cian
// como acento, y todo sobre un gris muy claro con tarjetas blancas de borde
// suave. Sin serif: una sola familia sans en toda la aplicacion.
//
// Los NOMBRES de los tokens se conservan del tema anterior a proposito: asi el
// cambio de paleta se propaga a los 75 archivos sin tocar ni uno.

import { useEffect } from "react";

export const T = {
  // superficies
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceSunk: "#F1F3F7",

  // texto
  ink: "#111827",
  inkSoft: "#6B7280",
  inkFaint: "#9CA3AF",

  // bordes
  border: "#E5E7EB",
  borderSoft: "#F1F3F7",

  // marca: violeta
  brand: "#7C3AED",
  brandBright: "#8B5CF6",
  brandDeep: "#6D28D9",
  brandTint: "#F3EEFF",

  // acento: cian (ocupa el lugar del ambar del tema anterior)
  amber: "#06B6D4",
  amberTint: "#E0F7FB",
  amberDeep: "#0E7490",

  // terciario: violeta claro
  pink: "#A78BFA",
  pinkTint: "#EDE9FE",
  pinkDeep: "#6D28D9",

  // semaforo de estado
  logrado: "#10B981",
  logradoTint: "#D1FAE5",
  proceso: "#F59E0B",
  procesoTint: "#FEF3C7",
  apoyo: "#EF4444",
  apoyoTint: "#FEE2E2",

  // forma
  radius: 14,
  radiusSm: 10,
  shadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
  shadowLift: "0 4px 12px rgba(16,24,40,0.08)",

  // tipografia: una sola familia. fontDisplay existe para los sitios que antes
  // usaban serif; hoy apunta a la misma sans con otro peso de uso.
  font: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
  fontDisplay: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
};


export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
`;

export const STATUS = {
  logrado: { label: "Logrado", color: T.logrado, tint: T.logradoTint, dot: "●" },
  proceso: { label: "En proceso", color: T.proceso, tint: T.procesoTint, dot: "●" },
  apoyo: { label: "Necesita apoyo", color: T.apoyo, tint: T.apoyoTint, dot: "●" },
};

export const inputStyle = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14,
  fontFamily: T.font,
  outline: "none",
  color: "#333",
  background: "#fff",
};

export const SPECIALIST_COLORS = {
  "u-admin":        "#7FA88A",  // Sarita — verde sage
  "u-idaira":       "#C0392B",  // Idaira — rojo
  "u-celilia":      "#9B7EC8",  // Celilia — lila
  "u-neyma":        "#D4A843",  // Neyma — amarillo
  "u-milagros":     "#4A90B8",  // Milagros — azul
  "u-ingrid":       "#E07A3A",  // Ingrid — naranja
  "u-daniella":     "#7B5EA7",  // Daniella — morado
  "u-mariavirginia":"#E8856A",  // Mavi — salmon
  "u-laura":        "#9B6B9B",  // Laura — lila
  "u-claudia":      "#C0392B",  // Claudia — rojo
};

export const TODAY = new Date().toISOString().slice(0, 10);

export const CHILD_AVATAR_COLORS = [T.brand, T.brandBright, T.amber, T.pink];

export function MobileStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 640px) {
        /* Child profile padding */
        .aira-profile { padding: 16px 12px 60px !important; }
        /* Tabs scroll horizontal */
        .aira-tabs { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; white-space: nowrap !important; flex-wrap: nowrap !important; padding-bottom: 2px; }
        .aira-tabs button { flex-shrink: 0 !important; }
        /* Objective columns stack */
        .aira-obj-grid { grid-template-columns: 1fr !important; }
        /* Session resumen grid stack */
        .aira-session-grid { grid-template-columns: 1fr 1fr !important; }
        /* Modal - slide from bottom */
        .aira-modal-overlay { align-items: flex-end !important; padding: 0 !important; }
        .aira-modal-box { border-radius: 20px 20px 0 0 !important; max-height: 90vh !important; width: 100% !important; max-width: 100% !important; }
        /* Header stack */
        .aira-header { flex-direction: column !important; gap: 12px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
}
