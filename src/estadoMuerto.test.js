import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Interruptores que solo se pueden apagar.
//
// El asistente de alta de pacientes llevaba semanas montado en el panel de
// inicio con su estado y su modal, y nada lo abría. El botón se perdió en un
// refactor y el resto se quedó: crear un paciente era imposible para todo el
// mundo, incluida la administración. Compila, no da error, y leyendo el
// código parece completo.
//
// La primera versión de esta prueba comprobaba que el setter se usara "alguna
// vez", y NO habría atrapado el fallo: `setShowAddPatient(false)` sí existía,
// en el onClose del propio modal. Lo que faltaba era el `true`.
//
// Así que la regla es más fina: un estado booleano que arranca en false y cuyo
// setter nunca recibe `true` no se puede encender. Lo que depende de él es
// inalcanzable.

function fuentes(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) fuentes(p, acc)
    else if (/\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name) && e.name !== 'aira-app.js') {
      acc.push(p)
    }
  }
  return acc
}

// Quita comentarios: un setter nombrado en prosa no es una llamada.
function soloCodigo(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

function interruptoresMuertos(codigo) {
  const muertos = []
  for (const m of codigo.matchAll(/const\s*\[\s*(\w+)\s*,\s*(set\w+)\s*\]\s*=\s*useState\(\s*false\s*\)/g)) {
    const [, estado, setter] = m
    const usos = [...codigo.matchAll(new RegExp(`\\b${setter}\\s*\\(([^)]*)\\)`, 'g'))]
      .map((u) => u[1].trim())

    // La forma funcional — setX(v => !v) — puede encender; no se juzga.
    const funcional = usos.some((a) => a.includes('=>'))
    const enciende = usos.some((a) => a !== 'false' && a !== '')

    if (!funcional && !enciende) {
      muertos.push(`${estado}: ${setter} nunca recibe true — lo que depende de él es inalcanzable`)
    }
  }
  return muertos
}

describe('estado inalcanzable', () => {
  const archivos = fuentes('src')

  it('encuentra archivos que revisar', () => {
    expect(archivos.length).toBeGreaterThan(20)
  })

  it('la regla detecta el caso que se escapó', () => {
    // El código exacto que estuvo semanas en producción: el modal montado, el
    // setter llamado solo para cerrar, y ningún sitio que lo abriera.
    const comoEstaba = `
      const [showAddPatient, setShowAddPatient] = useState(false);
      return showAddPatient && <Wizard onClose={() => setShowAddPatient(false)} />;
    `
    expect(interruptoresMuertos(comoEstaba)).toHaveLength(1)
  })

  it('no se queja de un interruptor que sí se enciende', () => {
    const sano = `
      const [abierto, setAbierto] = useState(false);
      <button onClick={() => setAbierto(true)} />
      <Modal onClose={() => setAbierto(false)} />
    `
    expect(interruptoresMuertos(sano)).toEqual([])
  })

  it('respeta la forma funcional, que también enciende', () => {
    const alterna = `
      const [abierto, setAbierto] = useState(false);
      <button onClick={() => setAbierto((a) => !a)} />
    `
    expect(interruptoresMuertos(alterna)).toEqual([])
  })

  it('ninguna pantalla tiene un interruptor que solo se apaga', () => {
    const muertos = []
    for (const archivo of archivos) {
      const codigo = soloCodigo(fs.readFileSync(archivo, 'utf8'))
      for (const m of interruptoresMuertos(codigo)) {
        muertos.push(`${archivo.split(path.sep).join('/')}: ${m}`)
      }
    }
    expect(muertos).toEqual([])
  })
})
