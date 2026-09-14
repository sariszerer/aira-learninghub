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

// Ya no hay "abrirPdf". El adjunto se muestra dentro de la aplicacion, con
// VisorPdf, y no en una pestana nueva.
//
// Lo que habia antes daba un diagnostico falso: window.open(url, "_blank",
// "noopener") devuelve null SIEMPRE — noopener corta el enlace con la ventana
// nueva, asi que no hay nada que devolver — y el codigo leia ese null como
// "el navegador la bloqueo". Salia el aviso "permite las ventanas emergentes"
// sin que nadie hubiera bloqueado nada, y de paso revocaba el blob, que es lo
// que dejaba en blanco la pestana cuando si se abria.
//
// Un <iframe> no se bloquea, funciona en el telefono y deja el PDF al lado del
// expediente.
