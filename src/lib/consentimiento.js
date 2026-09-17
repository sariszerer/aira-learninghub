// El consentimiento informado, separado de la anamnesis.
//
// Vivía dentro del formulario de anamnesis: el enlace de firma solo se podía
// generar desde ahí, así que un expediente cuya anamnesis llegó en PDF —o en
// notas sueltas, que son la mayoría— no tenía manera de pedirlo. De 45
// expedientes hay 4 con consentimiento firmado.
//
// Como documento propio se puede pedir siempre, se ve en su pestaña quién lo
// tiene, y deja de depender de cómo se recogió la anamnesis.

export const TIPO = "consentimiento";

export function idDeConsentimiento(childId) {
  return `d-consent-${childId}`;
}

// El consentimiento de este expediente.
//
// Busca primero el documento propio y, si no hay, el que quedó dentro de la
// anamnesis: los cuatro firmados hasta hoy están ahí y no se van a migrar a
// ciegas — una firma es la prueba de que alguien autorizó algo, y moverla de
// fila por comodidad es justo lo que no se hace con una prueba.
export function documentoDeConsentimiento(documents = [], childId) {
  const propio = documents.find((d) => d.childId === childId && d.type === TIPO);
  if (propio) return propio;
  return documents.find(
    (d) => d.childId === childId && d.type === "anamnesis" && tieneFirma(d)
  ) || null;
}

export function tieneFirma(doc) {
  const f = doc?.fields || {};
  return !!(f.firmaAcudienteImg || String(f.firmaAcudiente || "").trim());
}

// Qué enseñar del estado de la firma.
//
//  - 'firmado_a_distancia' → llegó la rúbrica desde el enlace
//  - 'firmado_en_persona'  → se anotó el nombre de quien firmó delante
//  - 'esperando'           → hay un enlace abierto y nadie lo ha usado
//  - 'pendiente'           → no se ha pedido
export function estadoDeConsentimiento(doc) {
  const f = doc?.fields || {};
  if (f.firmaAcudienteImg) return "firmado_a_distancia";
  if (String(f.firmaAcudiente || "").trim()) return "firmado_en_persona";
  if (String(f.consentToken || "").trim()) return "esperando";
  return "pendiente";
}

export function estaFirmado(doc) {
  return estadoDeConsentimiento(doc).startsWith("firmado");
}

// Un token no adivinable. El enlace de firma es la única credencial que se le
// da a la familia: si se puede enumerar, se pueden leer los consentimientos
// pendientes de otros pacientes.
export function nuevoToken(azar = globalThis.crypto) {
  if (azar?.randomUUID) return azar.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function enlaceDeFirma(token, origen = "", ruta = "") {
  return `${origen}${ruta}?firmar=${token}`;
}

// Al quitar una firma se van TODOS sus rastros.
//
// Dejar la fecha o el nombre sin la rúbrica deja un documento que dice que
// alguien firmó y no enseña la firma, que es peor que no tener nada.
export function sinFirma(fields = {}) {
  const { firmaAcudienteImg, fechaFirmaAcudiente, firmaAcudiente, fechaFirma, consentToken, ...resto } = fields;
  return resto;
}
