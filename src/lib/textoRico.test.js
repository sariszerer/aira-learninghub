// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { limpiarHtml, esHtml, textoAHtml, htmlATexto } from './textoRico.js'

describe('limpiarHtml', () => {
  it('deja pasar negrita, cursiva y subrayado', () => {
    expect(limpiarHtml('<b>Acuerdo</b> e <i>idea</i> y <u>fecha</u>'))
      .toBe('<b>Acuerdo</b> e <i>idea</i> y <u>fecha</u>')
  })

  it('se lleva el script entero, contenido incluido', () => {
    // Quien puede escribir una minuta no puede dejar código en el expediente
    // de un menor para que se ejecute en la pantalla de otra persona.
    expect(limpiarHtml('Hola<script>robar()</script>')).toBe('Hola')
  })

  it('quita los atributos, incluidos los on*', () => {
    expect(limpiarHtml('<b onclick="robar()" style="color:red">x</b>')).toBe('<b>x</b>')
    expect(limpiarHtml('<div onmouseover="x()">y</div>')).toBe('<div>y</div>')
  })

  it('una imagen con onerror no sobrevive', () => {
    // El vector clásico: <img> no está en la lista, así que se desenvuelve y
    // no queda nada que dispare el evento.
    expect(limpiarHtml('<img src=x onerror="robar()">')).toBe('')
  })

  it('desenvuelve lo que pega Word sin perder el texto', () => {
    // Pegar de Word arrastra <font> y <o:p>. Borrarlos enteros se llevaría por
    // delante el texto del acuerdo.
    expect(limpiarHtml('<font face="Calibri">Se acuerda <b>revisar</b></font>'))
      .toBe('Se acuerda <b>revisar</b>')
  })

  it('un enlace pierde el href pero conserva lo que dice', () => {
    expect(limpiarHtml('ver <a href="javascript:robar()">aquí</a>')).toBe('ver aquí')
  })

  it('vacío es vacío', () => {
    expect(limpiarHtml('')).toBe('')
    expect(limpiarHtml(null)).toBe('')
    expect(limpiarHtml(undefined)).toBe('')
  })
})

describe('esHtml y textoAHtml', () => {
  it('distingue una minuta vieja en texto plano de una con formato', () => {
    expect(esHtml('Se habló del apoyo en el aula.')).toBe(false)
    expect(esHtml('Se habló del <b>apoyo</b>.')).toBe(true)
  })

  it('el texto plano conserva sus saltos de línea al pasar a HTML', () => {
    // Sin esto, un resumen de doce líneas se pinta como un párrafo corrido.
    expect(textoAHtml('Primera\nSegunda')).toBe('<div>Primera</div><div>Segunda</div>')
  })

  it('una línea en blanco sigue siendo una línea en blanco', () => {
    expect(textoAHtml('A\n\nB')).toBe('<div>A</div><div><br></div><div>B</div>')
  })

  it('el texto plano se escapa, no se interpreta', () => {
    expect(textoAHtml('1 < 2 & 3 > 2')).toBe('<div>1 &lt; 2 &amp; 3 &gt; 2</div>')
  })

  it('si ya es HTML lo limpia en vez de escaparlo', () => {
    expect(textoAHtml('<b>hola</b><script>x()</script>')).toBe('<b>hola</b>')
  })
})

describe('htmlATexto', () => {
  it('lo que se manda por WhatsApp va sin etiquetas', () => {
    expect(htmlATexto('<div>Hola <b>Ana</b></div><div>Adiós</div>')).toBe('Hola Ana\nAdiós')
  })

  it('cada bloque deja su salto de línea', () => {
    // Antes llegaba al padre como una sola frase interminable.
    expect(htmlATexto('<div>Uno</div><div>Dos</div><div>Tres</div>')).toBe('Uno\nDos\nTres')
  })

  it('las viñetas se marcan, que si no se pierde que era una lista', () => {
    expect(htmlATexto('<ul><li>Sentarlo adelante</li><li>Avisar antes</li></ul>'))
      .toBe('• Sentarlo adelante\n• Avisar antes')
  })

  it('un <br> corta la línea', () => {
    expect(htmlATexto('<div>Uno<br>Dos</div>')).toBe('Uno\nDos')
  })

  it('el texto plano pasa tal cual', () => {
    expect(htmlATexto('Sin formato')).toBe('Sin formato')
  })
})
