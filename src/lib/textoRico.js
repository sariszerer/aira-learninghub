// Negrita, cursiva y subrayado en los textos que salen del centro.
//
// Una minuta va al colegio y al especialista externo. Poder resaltar el
// acuerdo que importa, o el nombre de quien se hace cargo, es la diferencia
// entre un muro de texto y un documento que alguien lee.
//
// Se guarda como HTML, así que hay que tratarlo como lo que es: texto escrito
// por una persona que después se pinta en la pantalla de otra. Sin limpiarlo,
// cualquiera con permiso de escribir una minuta podría dejar un <script> en el
// expediente. Por eso no se confía en lo que llega de la base ni en lo que
// sale del editor: se limpia en el momento de pintarlo.

// Lo único que puede sobrevivir. Sin atributos: ni style, ni class, ni href,
// ni los on* que son el vector obvio. Una lista blanca corta y sin excepciones
// es la que se puede revisar de un vistazo.
const PERMITIDAS = new Set(["B", "STRONG", "I", "EM", "U", "BR", "DIV", "P", "UL", "OL", "LI", "SPAN"]);

export function limpiarHtml(valor) {
  const html = String(valor || "");
  if (!html.trim()) return "";
  // Fuera del navegador no hay DOMParser. Se devuelve el texto escapado, que
  // es lo seguro: mejor ver las etiquetas que ejecutarlas.
  if (typeof DOMParser === "undefined") return escapar(html);

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  limpiarNodo(doc.body);
  return doc.body.innerHTML;
}

function limpiarNodo(nodo) {
  for (const hijo of [...nodo.childNodes]) {
    if (hijo.nodeType === 3) continue;              // texto: se queda
    if (hijo.nodeType !== 1) { hijo.remove(); continue; }  // comentarios y demás

    if (!PERMITIDAS.has(hijo.tagName)) {
      // Se desenvuelve en vez de borrarse: un <font> o un <span style> pegado
      // desde Word no debe llevarse por delante el texto que contiene.
      // <script> y <style> sí se van enteros: su contenido no es texto a leer.
      if (hijo.tagName === "SCRIPT" || hijo.tagName === "STYLE") { hijo.remove(); continue; }
      const padre = hijo.parentNode;
      while (hijo.firstChild) padre.insertBefore(hijo.firstChild, hijo);
      hijo.remove();
      continue;
    }
    for (const attr of [...hijo.attributes]) hijo.removeAttribute(attr.name);
    limpiarNodo(hijo);
  }
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ¿Esto ya es HTML, o es el texto plano de antes del editor?
//
// Hace falta porque hay minutas guardadas como texto con saltos de línea, y
// pintarlas tal cual dentro de un contenedor HTML las dejaría en un párrafo
// corrido: los saltos desaparecen y el resumen se vuelve ilegible.
export function esHtml(valor) {
  return /<(b|strong|i|em|u|br|div|p|ul|ol|li|span)\b[^>]*>/i.test(String(valor || ""));
}

export function textoAHtml(valor) {
  const texto = String(valor || "");
  if (!texto.trim()) return "";
  if (esHtml(texto)) return limpiarHtml(texto);
  return texto.split(/\r?\n/).map((l) => `<div>${escapar(l) || "<br>"}</div>`).join("");
}

// El camino de vuelta: lo que se manda por WhatsApp o correo no lleva formato.
//
// Los bloques tienen que dejar salto de línea. Sin esto, un resumen de doce
// líneas llegaba al padre como una sola frase interminable.
export function htmlATexto(valor) {
  const html = String(valor || "");
  if (!html.trim()) return "";
  if (!esHtml(html)) return html;
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]*>/g, "");

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const lineas = [];
  const recorrer = (nodo, acumulado) => {
    for (const hijo of nodo.childNodes) {
      if (hijo.nodeType === 3) { acumulado.push(hijo.nodeValue); continue; }
      if (hijo.nodeType !== 1) continue;
      if (hijo.tagName === "BR") { lineas.push(acumulado.join("")); acumulado.length = 0; continue; }
      if (["DIV", "P", "LI"].includes(hijo.tagName)) {
        if (acumulado.length) { lineas.push(acumulado.join("")); acumulado.length = 0; }
        const propio = [];
        recorrer(hijo, propio);
        lineas.push((hijo.tagName === "LI" ? "• " : "") + propio.join(""));
        continue;
      }
      recorrer(hijo, acumulado);
    }
  };
  const suelto = [];
  recorrer(doc.body, suelto);
  if (suelto.length) lineas.push(suelto.join(""));
  return lineas.map((l) => l.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
