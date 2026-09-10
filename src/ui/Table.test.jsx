import { describe, it, expect } from 'vitest'
import fs from 'node:fs'

// La tabla en pantalla estrecha.
//
// Seis columnas en 390px no son una tabla: son seis tiras de dos caracteres.
// En móvil cada fila pasa a ser una ficha en tres alturas — nombre, datos con
// su etiqueta, y botones en su propia línea.
//
// Los botones abajo y no arriba porque compartir fila con el nombre le dejaba
// 140px de los 390 y el correo se metía por debajo de ellos.
//
// Se comprueba leyendo el código porque el proyecto no monta React en las
// pruebas. Lo que se fija es que las piezas de la regla sigan existiendo.

const src = fs.readFileSync('src/ui/Table.jsx', 'utf8')

describe('Table en móvil', () => {
  it('la fila se parte en tres: nombre, datos y acciones', () => {
    expect(src).toMatch(/const primera = columnas\[0\]/)
    expect(src).toMatch(/const acciones = columnas\.filter\(\(c\) => c\.accion\)/)
    expect(src).toMatch(/const datos = columnas\.filter/)
  })

  it('los datos llevan su etiqueta delante', () => {
    // Un "20" suelto no dice si son pacientes o sesiones.
    expect(src).toMatch(/datos\.map/)
    expect(src).toMatch(/\{c\.titulo\}/)
  })

  it('las acciones van en su propia línea', () => {
    expect(src).toMatch(/acciones\.map/)
  })

  it('la celda se pinta con una sola función', () => {
    // Tenerlo dos veces — tabla y ficha — era garantía de que se separaran.
    expect(src).toMatch(/function celdaDe\(/)
    expect((src.match(/celdaDe\(/g) || []).length).toBeGreaterThanOrEqual(4)
  })
})

describe('columnas de acción declaradas', () => {
  it('las tablas con botones los marcan como acción', () => {
    // Sin la marca, los botones se quedan en la fila del nombre y lo aplastan.
    for (const f of ['src/team/SpecialistsList.jsx', 'src/team/RolesList.jsx']) {
      expect(fs.readFileSync(f, 'utf8'), f).toMatch(/accion: true/)
    }
  })
})
