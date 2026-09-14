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
