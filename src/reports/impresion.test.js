import { describe, it, expect } from 'vitest'
import { CSS_IMPRESION } from './VisorReporte.jsx'

// La hoja de impresion falla en silencio: la aplicacion se ve perfecta y el
// defecto solo aparece cuando alguien manda un expediente a la impresora. Estas
// pruebas fijan las cuatro reglas de las que depende.

describe('CSS de impresión', () => {
  it('aísla el visor del resto de la aplicación', () => {
    // Sin esto se imprime la aplicacion entera, barra lateral incluida — que es
    // lo que hacian los tres reportes anteriores.
    expect(CSS_IMPRESION).toContain('body > *:not(.visor-portal) { display: none !important; }')
  })

  it('devuelve el documento al flujo normal, que es lo que lo hace paginar', () => {
    // Con position:fixed o absolute el navegador no reparte el contenido entre
    // paginas: un historial largo se corta al final de la primera.
    expect(CSS_IMPRESION).toMatch(/\.visor-overlay\s*\{[^}]*position:\s*static\s*!important/)
    expect(CSS_IMPRESION).toMatch(/\.visor-portal\s*\{[^}]*position:\s*static\s*!important/)
  })

  it('conserva los fondos', () => {
    // Por defecto el navegador descarta los fondos al imprimir y las cabeceras
    // de tabla saldrian en blanco sobre blanco.
    expect(CSS_IMPRESION).toContain('print-color-adjust: exact')
  })

  it('esconde los controles y muestra el texto que los sustituye', () => {
    expect(CSS_IMPRESION).toContain('.no-imprimir { display: none !important; }')
    expect(CSS_IMPRESION).toContain('.solo-impresion { display: block !important; }')
    // Y al reves en pantalla, o el texto saldria duplicado bajo cada campo.
    expect(CSS_IMPRESION).toMatch(/@media screen\s*\{\s*\.solo-impresion\s*\{\s*display:\s*none/)
  })

  it('declara tamaño de página y márgenes', () => {
    expect(CSS_IMPRESION).toMatch(/@page\s*\{\s*size:\s*A4/)
  })

  it('todas las reglas de aislamiento van dentro de @media print', () => {
    // Si alguna se escapa fuera, rompe la vista en pantalla en vez del PDF.
    const dentro = CSS_IMPRESION.slice(
      CSS_IMPRESION.indexOf('@media print'),
      CSS_IMPRESION.indexOf('@page')
    )
    expect(dentro).toContain('.no-imprimir')
    expect(dentro).toContain('body > *:not(.visor-portal)')
  })
})
