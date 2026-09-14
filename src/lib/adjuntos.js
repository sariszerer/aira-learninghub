// Abrir el PDF que alguien adjuntó a un documento.
//
// Dos nombres para lo mismo: los documentos del paciente guardan el archivo en
// `fields.pdfData` y los formatos del gabinete en `fields.pdfDatos`. Salieron
// de pantallas distintas y nadie los unificó. Aquí se aceptan los dos, porque
// hay expedientes reales guardados con cada uno.
//
// El enlace de "Ver PDF" apuntaba a `fields.pdfUrl`, que NO lo escribe ninguna
// pantalla: siempre valía undefined. El botón estaba ahí, se podía pulsar, y no
// hacía nada — Celilia subió un plan de trabajo y no había forma de volver a
// verlo.

export function datosDelPdf(fields = {}) {
  return fields.pdfData || fields.pdfDatos || fields.pdfUrl || null;
}

export function nombreDelPdf(fields = {}) {
  return fields.pdfName || fields.pdfNombre || "documento.pdf";
}

export function tienePdf(fields) {
  return !!datosDelPdf(fields);
}

// Convierte la data URL en un Blob.
//
// No se abre la data URL directamente: Chrome y Safari bloquean la navegación
// de nivel superior hacia `data:` desde hace años — por eso un <a href="data:…"
// target="_blank"> no hace nada y no avisa. Un blob: sí se abre, y además la
// pestaña muestra un nombre en vez de dos megas de base64 en la barra.
export function pdfComoBlob(datos) {
  if (!datos) return null;
  if (!datos.startsWith("data:")) return null;   // ya es una URL normal
  const [cabecera, base64] = datos.split(",");
  const tipo = cabecera.match(/data:([^;]+)/)?.[1] || "application/pdf";
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

// Abre el adjunto en otra pestaña. Devuelve false si no había nada que abrir,
// para que quien llama pueda decirlo en vez de quedarse callado.
export function abrirPdf(fields, { alFallar } = {}) {
  const datos = datosDelPdf(fields);
  if (!datos) {
    alFallar?.("Este documento no tiene ningún PDF adjunto.");
    return false;
  }
  if (!datos.startsWith("data:")) {
    window.open(datos, "_blank", "noopener");
    return true;
  }
  const blob = pdfComoBlob(datos);
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, "_blank", "noopener");
  if (!ventana) {
    URL.revokeObjectURL(url);
    alFallar?.("El navegador bloqueó la ventana. Permite las ventanas emergentes de este sitio.");
    return false;
  }
  // Se libera con holgura: revocarla de inmediato deja la pestaña en blanco
  // porque el navegador aún no ha terminado de leerla.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
