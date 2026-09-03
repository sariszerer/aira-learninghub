// Tokens de diseno de AIRA Learning Hub.
// Paleta: estudio al amanecer. Verde azulado profundo para la estructura,
// amarillo calido como unico punto de energia, y salvia y coral reservados
// al sistema de semaforo de estado, para que el estado se lea igual en todas
// partes.

import { useEffect } from "react";

export const T = {
  bg: "#FFFBF2",
  surface: "#FFFFFF",
  surfaceSunk: "#F5F0E2",
  ink: "#20302E",
  inkSoft: "#63716D",
  inkFaint: "#9CA79E",
  border: "#EDE6D4",
  borderSoft: "#F3EEDF",
  brand: "#175FAF",
  brandBright: "#2378D6",
  brandDeep: "#0F4A8A",
  brandTint: "#E9F2FC",
  amber: "#F5C93E",
  amberTint: "#FDF2D2",
  amberDeep: "#8A6410",
  pink: "#DCAAFA",
  pinkTint: "#F6EBFC",
  pinkDeep: "#8A3FC0",
  logrado: "#4C8F6A",
  logradoTint: "#E4F1E8",
  proceso: "#DFA53B",
  procesoTint: "#FBF1DC",
  apoyo: "#D5715C",
  apoyoTint: "#FAE7E1",
  radius: 22,
  shadow: "0 2px 10px rgba(32,48,46,0.05)",
};

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap');
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
  fontFamily: "Inter, sans-serif",
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
