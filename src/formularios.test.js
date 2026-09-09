import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Guarda contra el error mudo.
//
// El patrón que había en diez formularios era desactivar el botón cuando faltaba
// un campo: el usuario rellena, pulsa Guardar y no pasa nada, sin una palabra de
// por qué. En un formulario largo, con el campo que falta fuera de la pantalla,
// eso es indistinguible de que la aplicación se haya colgado.
//
// La regla es: un botón se desactiva por ESTADO (ya se está guardando, no hay
// permiso, no aplica), nunca por VALIDACIÓN. Lo que falta se dice con queFalta()
// y sale por el canal de avisos.

const EXCEPCIONES = {
  // Confirmación destructiva: la instrucción ("escribe el nombre") está justo
  // encima del campo, y habilitar el botón para luego decir "no coincide" sería
  // peor. Aquí el botón apagado ES el mensaje.
  'src/patient/BorrarPacienteModal.jsx': ['!confirmado'],
  // No son validaciones sino "no aplica": sin correo no hay a dónde invitar, y
  // sin pacientes no hay carga que repartir.
  'src/team/SpecialistsList.jsx': ['!carga(u.id).pacientes', '!u.email'],
}

function jsx(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) jsx(p, acc)
    else if (e.name.endsWith('.jsx')) acc.push(p)
  }
  return acc
}

describe('ningún formulario falla en silencio', () => {
  it('no se desactiva un botón por validación', () => {
    const culpables = []
    for (const archivo of jsx('src')) {
      const rel = archivo.split(path.sep).join('/')
      const src = fs.readFileSync(archivo, 'utf8')
      // disabled={!algo...} — la forma en que se escribía la validación.
      for (const m of src.matchAll(/disabled=\{([^}]*)\}/g)) {
        const cond = m[1].trim()
        if (!cond.includes('!')) continue
        // Un `disabled={guardando}` o `{enviando === u.id}` es estado, no validación.
        const permitido = (EXCEPCIONES[rel] || []).some((e) => cond.includes(e))
        if (!permitido) culpables.push(`${rel}: disabled={${cond}}`)
      }
    }
    expect(culpables).toEqual([])
  })

  it('las excepciones declaradas siguen existiendo', () => {
    // Si un archivo de la lista desaparece o deja de usar ese patrón, la
    // excepción sobra y hay que quitarla en vez de dejarla cubriendo de más.
    for (const [archivo, condiciones] of Object.entries(EXCEPCIONES)) {
      const src = fs.readFileSync(archivo, 'utf8')
      for (const c of condiciones) expect(src, `${archivo} · ${c}`).toContain(c)
    }
  })
})
