import { describe, it, expect } from 'vitest'
import fs from 'node:fs'

// Escrituras que nadie invoca.
//
// `db.insertMeeting` llevaba desde la migracion escrito, probado a mano y sin
// un solo llamante: `addMeeting` en el store solo hacia `set(...)`. Registrar
// una minuta funcionaba — aparecia en la ficha, se veia el PDF — y al recargar
// no quedaba nada. La tabla meetings estaba vacia en produccion con el centro
// llevando meses de reuniones.
//
// Es el mismo fallo silencioso que la escuela que no se guardaba: compila, no
// avisa, y solo se descubre cuando alguien busca algo que creia registrado.
// Una funcion que habla con la base y que nadie llama no es codigo muerto
// inofensivo: es la mitad que falta de una funcionalidad que parece completa.

const FUENTE = fs.readFileSync('src/supabase.js', 'utf8')
const RESTO = fs.readdirSync('src', { recursive: true })
  .filter((f) => /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f) && f !== 'supabase.js' && f !== 'aira-app.js')
  .map((f) => fs.readFileSync(`src/${f}`, 'utf8'))
  .join('\n')

// Sabidas y aceptadas. Cada una con el motivo por el que no tiene llamante;
// si alguna deja de tenerlo, se quita de aqui y no se anade otra sin explicar
// por que. Una lista que crece sin razones deja de ser una excepcion y pasa a
// ser la regla.
const CONOCIDAS = {
  // Borrar un reporte de evolucion ya generado no existe como accion en
  // ninguna pantalla, y no se ha pedido: un reporte firmado y entregado a la
  // familia no se borra, se corrige generando otro. La funcion se dejo escrita
  // al migrar la tabla. No pierde datos — solo no hace nada.
  deleteEvolutionReport: 'no hay accion de borrar reportes en ninguna pantalla',
}

// Las que escriben. Una lectura sin llamantes molesta; una escritura sin
// llamantes es un dato que el centro cree tener y no tiene.
const ESCRIBEN = /^\s{2}async (insert|update|delete|upsert)(\w+)\s*\(/gm

describe('todo lo que escribe en la base tiene quien lo llame', () => {
  const metodos = [...FUENTE.matchAll(ESCRIBEN)].map((m) => m[1] + m[2])

  it('hay escrituras que revisar', () => {
    expect(metodos.length).toBeGreaterThan(10)
  })

  it.each(metodos)('db.%s se usa desde alguna parte', (metodo) => {
    if (CONOCIDAS[metodo]) {
      // Sigue comprobandose al reves: el dia que alguien la llame, hay que
      // sacarla de la lista para que vuelva a estar vigilada.
      expect(RESTO, `ya tiene llamante: quitar de CONOCIDAS`).not.toContain(`${metodo}(`)
      return
    }
    expect(RESTO).toContain(`${metodo}(`)
  })
})

// Identificadores que nacen solo del reloj.
//
// `o-${Date.now()}` parece unico y no lo es: "Pegar varios" crea los objetivos
// en un bucle apretado, los ocho caen en el mismo milisegundo y los ocho
// reciben el mismo id. En pantalla salen los ocho; en la base, upsert por id
// deja uno. Sarita pego una lista del plan de trabajo y al recargar quedaban
// dos. nuevoId() lleva un contador dentro del milisegundo.
describe('ningún identificador nace solo del reloj', () => {
  const FUENTES = fs.readdirSync('src', { recursive: true })
    .filter((f) => /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f) && f !== 'aira-app.js')
    .filter((f) => !f.endsWith('identificador.js') && !f.endsWith('avisosStore.js'))
    .map((f) => ({ f, src: fs.readFileSync(`src/${f}`, 'utf8') }))

  it.each(FUENTES.map((x) => x.f))('%s', (nombre) => {
    const { src } = FUENTES.find((x) => x.f === nombre)
    const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    // `algo-${Date.now()}` sin nada detrás que lo distinga.
    expect(codigo).not.toMatch(/`[\w-]*-\$\{Date\.now\(\)\}`/)
  })
})

// El otro sentido: una accion que cambia datos y no los escribe.
//
// La guarda de arriba pilla la escritura huerfana (existe y nadie la llama).
// Esta pilla lo contrario y es el fallo que de verdad ocurrio dos veces:
// addMeeting y addParentReport hacian `set(...)` y nada mas. En pantalla
// quedaba todo bien; al recargar no habia nada. La minuta se perdio asi, y la
// lista de reportes a la familia — de la que cuelga la alerta "van N sesiones
// desde el ultimo" — arrancaba vacia cada vez, asi que el contador nunca
// sabia que ya se habia mandado uno.
describe('lo que cambia datos, los guarda', () => {
  const STORE = fs.readFileSync('src/store/dataStore.js', 'utf8')

  // Acciones que cambian estado a proposito sin tocar la base, con el motivo.
  const SIN_BASE = {
    loadAll: 'es la carga inicial: lee',
    cargarUltimosAccesos: 'lee',
    recargarUsuarios: 'lee',
    cargarRoles: 'lee',
    markLoaded: 'bandera de la interfaz, no es un dato del centro',
    markActivitySeen: 'el muro de novedades vive en la pestana; no hay tabla',
  }

  const acciones = [...STORE.matchAll(/^ {2}(\w+):\s*(?:async\s*)?\(/gm)]
    .map((m, i, todas) => {
      const fin = todas[i + 1] ? todas[i + 1].index : STORE.length
      return { nombre: m[1], cuerpo: STORE.slice(m.index, fin) }
    })
    .filter((a) => a.cuerpo.includes('set('))

  it('hay acciones que revisar', () => {
    expect(acciones.length).toBeGreaterThan(20)
  })

  it.each(acciones.map((a) => a.nombre))('%s', (nombre) => {
    const { cuerpo } = acciones.find((a) => a.nombre === nombre)
    if (SIN_BASE[nombre]) {
      expect(cuerpo).not.toMatch(/db\.(insert|update|delete|upsert)/)
      return
    }
    expect(cuerpo, `${nombre} cambia datos y no los escribe en la base`)
      .toMatch(/db\.(insert|update|delete|upsert)/)
  })
})

// Un UPDATE que RLS rechaza devuelve cero filas y ningún error.
//
// Es la forma más callada de perder un cambio: el store ya puso el dato nuevo
// en pantalla, no salta ningún aviso, y al recargar vuelve el viejo. Las seis
// tablas con política de UPDATE piden .select('id') para poder distinguir
// "se guardó" de "no tocó nada".
describe('ningún update se da por bueno sin comprobarlo', () => {
  const llamadas = [...FUENTE.matchAll(/await supabase\s*\n?\s*\.?from\('(\w+)'\)\s*\n?\s*\.update\(/g)]

  it('hay updates que revisar', () => {
    expect(llamadas.length).toBeGreaterThanOrEqual(6)
  })

  it('todos piden las filas afectadas', () => {
    // Cada .update( va seguido, antes del siguiente await, de un .select(
    for (const m of llamadas) {
      const desde = m.index
      const hasta = FUENTE.indexOf('await', desde + 10)
      const trozo = FUENTE.slice(desde, hasta === -1 ? FUENTE.length : hasta)
      expect(trozo, `el update de ${m[1]} no comprueba si tocó alguna fila`).toContain(".select('id')")
    }
  })

})
