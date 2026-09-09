// Reglas de la firma digital en los reportes.
//
// Vive aparte de la pantalla porque la decisión de "quién puede estampar esta
// firma" no es de presentación, y porque tenerla en una función pura permite
// probarla sin montar un documento entero.

export const PESO_MAXIMO_FIRMA = 300 * 1024; // 300 KB
export const TIPOS_FIRMA = ["image/png", "image/jpeg", "image/webp"];

// Una firma solo la estampa su dueño.
//
// Es la regla que impide que el sistema fabrique documentos firmados por
// alguien que no los vio: la firma queda guardada en el perfil del especialista
// y cualquiera con permiso de reportes podría generar un informe a nombre de
// otro. Que aparezca en pantalla al revisar el documento es correcto — es el
// expediente — pero estamparla es un acto del profesional, no del sistema.
//
// `firmante` es quien tiene la sesión abierta; `responsable`, el especialista
// que encabeza el reporte.
export function puedeFirmar(firmante, responsable) {
  if (!firmante || !responsable) return false;
  return firmante.id === responsable.id;
}

// Qué mostrar en el bloque de firma.
//
//  - 'firmada'   → la rúbrica del responsable, ya guardada y aplicada
//  - 'puede'     → es su propio reporte y tiene rúbrica: se le ofrece firmar
//  - 'sin_firma' → es su propio reporte y aún no ha subido rúbrica
//  - 'linea'     → de nadie más: línea en blanco para firmar a mano
//
// El caso 'linea' es el que evita el problema real. Sin él, un reporte de otra
// especialista se imprimiría sin espacio donde firmar, y el documento saldría
// del centro sin validar.
export function estadoDeFirma({ firmante, responsable, aplicada }) {
  if (aplicada) return "firmada";
  if (!puedeFirmar(firmante, responsable)) return "linea";
  return responsable.firma ? "puede" : "sin_firma";
}

export function validarArchivoDeFirma(archivo) {
  if (!archivo) return "No se eligió ningún archivo.";
  if (!TIPOS_FIRMA.includes(archivo.type)) return "La firma tiene que ser PNG, JPG o WEBP.";
  if (archivo.size > PESO_MAXIMO_FIRMA) return "La imagen pesa más de 300 KB. Usa una más pequeña.";
  return null;
}
