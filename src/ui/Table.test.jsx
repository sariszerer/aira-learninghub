import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { siguienteOrden } from './Table.jsx'

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

describe('siguienteOrden', () => {
  it('tres clics en la misma columna: asc, desc, y sin orden', () => {
    const uno = siguienteOrden(null, 'nombre')
    expect(uno).toEqual({ clave: 'nombre', dir: 'asc' })
    const dos = siguienteOrden(uno, 'nombre')
    expect(dos).toEqual({ clave: 'nombre', dir: 'desc' })
    expect(siguienteOrden(dos, 'nombre')).toBe(null)
  })

  it('pulsar otra columna empieza su ciclo de cero', () => {
    // Y no hereda el sentido de la anterior: venir de "desc" en Nombre no
    // puede dejar Sesiones ordenada al revés de lo que muestra su flecha.
    const enNombre = { clave: 'nombre', dir: 'desc' }
    expect(siguienteOrden(enNombre, 'sesiones')).toEqual({ clave: 'sesiones', dir: 'asc' })
  })
})

describe('orden controlado desde la pantalla', () => {
  it('si llega `orden`, la tabla no guarda uno propio', () => {
    // Con dos estados, el atajo marcado y la flecha del encabezado acaban
    // diciendo cosas distintas.
    expect(src).toMatch(/const controlada = ordenDeFuera !== undefined/)
    expect(src).toMatch(/const orden = controlada \? ordenDeFuera : ordenPropio/)
    expect(src).toMatch(/if \(!controlada\) setOrdenPropio\(o\)/)
  })
})

describe('atajos de orden de la lista de pacientes', () => {
  const fuente = fs.readFileSync('src/patients/PatientsList.jsx', 'utf8')

  it('cada atajo ordena por una columna que existe en la tabla', () => {
    // Un atajo que apunta a una clave inexistente no ordena nada y falla en
    // silencio: la tabla devuelve las filas tal cual.
    const claves = [...fuente.matchAll(/clave: "(\w+)", dir:/g)].map((m) => m[1])
    const columnas = [...fuente.matchAll(/clave: "(\w+)", titulo:/g)].map((m) => m[1])
    expect(claves.length).toBeGreaterThan(0)
    for (const c of claves) expect(columnas, c).toContain(c)
  })

  it('ofrece el orden por fecha de alta, que es el que no había', () => {
    expect(fuente).toMatch(/label: "Creados más recientes", clave: "admissionDate", dir: "desc"/)
  })
})
