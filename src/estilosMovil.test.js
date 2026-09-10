import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Ningún gancho de CSS apunta al vacío.
//
// MobileStyles tenía siete reglas `.aira-*` y SEIS de ellas apuntaban a clases
// que los refactores habían borrado. La aplicación llevaba meses sin ser
// responsiva y nadie lo vio, porque una regla CSS cuyo selector no existe no
// da error, no sale en consola y no rompe nada: simplemente no hace nada.
//
// Es el mismo tipo de fallo silencioso que el import que falta, y se ataja
// igual: comprobándolo.

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

describe('estilos de móvil', () => {
  const tema = fs.readFileSync('src/theme.js', 'utf8')
  const clases = [...new Set(
    [...tema.matchAll(/\.(aira-[a-z0-9-]+)/g)].map((m) => m[1])
  )]

  const usadas = new Set()
  for (const archivo of fuentes('src')) {
    if (archivo.endsWith(`theme.js`)) continue
    const src = fs.readFileSync(archivo, 'utf8')
    for (const c of clases) if (src.includes(c)) usadas.add(c)
  }

  it('hay ganchos que comprobar', () => {
    expect(clases.length).toBeGreaterThan(0)
  })

  it('cada clase del CSS existe en algún componente', () => {
    expect(clases.filter((c) => !usadas.has(c))).toEqual([])
  })
})

describe('márgenes de pantalla', () => {
  it('ninguna pantalla escribe el margen a mano', () => {
    // Estaba literal en las diez, así que cambiarlo significaba acordarse de
    // las diez — y en móvil eran 56px de 390, el 14% del ancho en aire.
    const culpables = fuentes('src')
      .filter((f) => fs.readFileSync(f, 'utf8').includes('"24px 28px 48px"'))
      .filter((f) => !f.endsWith('pantalla.js'))
      .map((f) => f.split(path.sep).join('/'))
    expect(culpables).toEqual([])
  })
})

describe('lo que se adapta lo declara', () => {
  it('las pantallas de página usan el hook, no un ancho fijo', () => {
    // Si una pantalla nueva copia el patrón viejo, esto lo dice.
    const paginas = [
      'src/home/AdminDashboard.jsx', 'src/home/ClinicalDirectorHome.jsx',
      'src/home/SpecialistHome.jsx', 'src/patients/PatientsList.jsx',
      'src/gabinete/GabinetePanel.jsx', 'src/gabinete/EscuelaDetalle.jsx',
    ]
    for (const p of paginas) {
      expect(fs.readFileSync(p, 'utf8'), p).toMatch(/paddingPagina\(esMovil\)/)
    }
  })
})
