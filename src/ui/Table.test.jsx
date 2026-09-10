import { describe, it, expect } from 'vitest'
import fs from 'node:fs'

// La tabla en pantalla estrecha.
//
// Seis columnas en 390px no son una tabla: son seis tiras de dos caracteres.
// En móvil se dejan las esenciales en la rejilla y el resto se pliega debajo,
// con su título delante — sin él, un "20" suelto no dice si son pacientes o
// sesiones.
//
// Se comprueba leyendo el código porque el proyecto no monta React en las
// pruebas. Lo que se fija aquí es que las tres piezas de la regla sigan
// existiendo: el reparto, el plegado y la etiqueta.

const src = fs.readFileSync('src/ui/Table.jsx', 'utf8')

describe('Table en móvil', () => {
  it('reparte las columnas entre visibles y plegadas', () => {
    expect(src).toMatch(/const visibles = esMovil/)
    expect(src).toMatch(/const plegadas = esMovil/)
  })

  it('la primera columna nunca se pliega', () => {
    // Es el nombre: sin él la fila no se puede identificar.
    expect(src).toMatch(/c\.clave === columnas\[0\]\.clave/)
  })

  it('lo plegado se pinta con su título', () => {
    expect(src).toMatch(/plegadas\.map/)
    expect(src).toMatch(/\{c\.titulo\}/)
  })

  it('la rejilla usa las visibles, no todas las columnas', () => {
    // El fallo fácil: filtrar la cabecera y olvidar las celdas, o al revés, y
    // que dejen de cuadrar.
    const porColumnas = src.match(/\bcolumnas\.map\(/g) || []
    const porVisibles = src.match(/\bvisibles\.map\(/g) || []
    // visibles: la rejilla de móvil, la cabecera y las celdas.
    expect(porVisibles.length).toBe(3)
    // columnas: solo la rejilla de escritorio.
    expect(porColumnas.length).toBe(1)
  })
})

describe('columnas esenciales declaradas', () => {
  it('las pantallas con tabla marcan qué sobrevive en móvil', () => {
    // Sin `esencial` en ninguna columna, en móvil solo quedaría el nombre y
    // habría que desplegar todo para cualquier cosa.
    const lista = fs.readFileSync('src/team/SpecialistsList.jsx', 'utf8')
    expect(lista).toMatch(/esencial: true/)
  })
})
