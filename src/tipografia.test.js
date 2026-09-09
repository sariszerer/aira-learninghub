import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Todo lo que sale del árbol se lleva la tipografía puesta.
//
// App fija fontFamily en su div raíz, y de ahí lo hereda la aplicación entera.
// Un createPortal a <body> se cuelga FUERA de ese div: lo que hay dentro deja de
// heredar y cae en la fuente por defecto del navegador.
//
// Pasaba en todos los modales, no solo en los últimos: cada texto que no
// declarara su propia fuente salía en otra letra. Se venía tapando poniendo
// fontFamily elemento por elemento — de ahí que unos campos sí y otros no.
//
// La regla es que el portal lo declare una vez en su contenedor. Esta prueba
// existe porque el fallo es invisible en el código y solo se ve mirando la
// pantalla con atención.

function jsx(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) jsx(p, acc)
    else if (e.name.endsWith('.jsx')) acc.push(p)
  }
  return acc
}

describe('portales fuera del árbol', () => {
  const conPortal = jsx('src').filter((f) =>
    fs.readFileSync(f, 'utf8').includes('createPortal'))

  it('hay portales que vigilar', () => {
    expect(conPortal.length).toBeGreaterThan(0)
  })

  it('cada uno declara la tipografía de la aplicación', () => {
    const sinFuente = conPortal
      .filter((f) => !fs.readFileSync(f, 'utf8').includes('fontFamily: T.font'))
      .map((f) => f.split(path.sep).join('/'))
    expect(sinFuente).toEqual([])
  })
})

// Los controles de formulario tampoco heredan.
//
// input, textarea y select NO heredan font-family del contenedor: los navegadores
// les dan la suya propia. Que el modal declare la tipografía arregla las
// etiquetas y el texto, pero no lo que se escribe dentro de los campos.
//
// Hoy están todos cubiertos, unos con inputStyle y otros a mano. Esta prueba
// existe para que el próximo campo que se añada no se quede fuera: es un fallo
// que no rompe nada, no sale en consola y solo se ve mirando la pantalla.
describe('controles de formulario', () => {
  // Un control que se pinta como icono o como archivo no lleva texto del usuario.
  const EXENTOS = [
    'fontFamily', 'inputStyle', 'campoTexto', 'areaTexto', 'estiloCampo',
    'type="file"', 'type="checkbox"', 'type="radio"', 'type="color"',
  ]

  // Recorre la etiqueta contando llaves: el ">" que la cierra es el primero a
  // profundidad cero. Con una expresión regular simple, style={{ ...inputStyle }}
  // engaña al lector y da falsos positivos.
  function atributos(src, desde) {
    let prof = 0
    for (let i = desde; i < src.length; i++) {
      const c = src[i]
      if (c === '{') prof++
      else if (c === '}') prof--
      else if (c === '>' && prof === 0) return src.slice(desde, i)
    }
    return src.slice(desde)
  }

  it('cada campo declara la tipografía de la aplicación', () => {
    const sinFuente = []
    for (const archivo of jsx('src')) {
      const src = fs.readFileSync(archivo, 'utf8')
      for (const m of src.matchAll(/<(input|textarea|select)\b/g)) {
        const at = atributos(src, m.index + m[0].length)
        if (EXENTOS.some((e) => at.includes(e))) continue
        const linea = src.slice(0, m.index).split('\n').length
        sinFuente.push(`${archivo.split(path.sep).join('/')}:${linea} <${m[1]}>`)
      }
    }
    expect(sinFuente).toEqual([])
  })
})
