// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import LimiteDeError from './LimiteDeError.jsx'

// Un error de render desmonta el árbol entero y deja una pantalla blanca. Desde
// fuera es indistinguible de "no pasó nada": costó dos rondas averiguar que el
// reporte para la familia lanzaba un ReferenceError, porque el único síntoma
// era el vacío.

function Revienta() {
  throw new Error('BloqueFirma is not defined')
}

let contenedor, raiz
beforeEach(() => {
  // React escribe el error en consola aunque lo capturemos; no es señal de nada.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  raiz = createRoot(contenedor)
})
afterEach(() => {
  act(() => raiz.unmount())
  contenedor.remove()
  vi.restoreAllMocks()
})

describe('LimiteDeError', () => {
  it('lo normal pasa de largo', () => {
    act(() => raiz.render(<LimiteDeError donde="x"><p>contenido</p></LimiteDeError>))
    expect(contenedor.textContent).toContain('contenido')
  })

  it('un error se convierte en un mensaje legible, no en una pantalla blanca', () => {
    act(() => raiz.render(<LimiteDeError donde="el reporte para la familia"><Revienta /></LimiteDeError>))
    const texto = contenedor.textContent
    expect(texto).toContain('Esto no se pudo mostrar')
    expect(texto).toContain('el reporte para la familia')
  })

  it('enseña el mensaje exacto, que es lo único que sirve para arreglarlo', () => {
    act(() => raiz.render(<LimiteDeError donde="x"><Revienta /></LimiteDeError>))
    expect(contenedor.textContent).toContain('BloqueFirma is not defined')
  })

  it('tranquiliza sobre lo guardado: el fallo es al dibujar', () => {
    act(() => raiz.render(<LimiteDeError donde="x"><Revienta /></LimiteDeError>))
    expect(contenedor.textContent).toMatch(/No se ha perdido/)
  })

  it('sin onCerrar no ofrece un botón que no lleva a ninguna parte', () => {
    act(() => raiz.render(<LimiteDeError donde="x"><Revienta /></LimiteDeError>))
    expect(contenedor.textContent).not.toContain('Volver')
  })

  it('con onCerrar sí, y funciona', () => {
    const cerrar = vi.fn()
    act(() => raiz.render(<LimiteDeError donde="x" onCerrar={cerrar}><Revienta /></LimiteDeError>))
    const volver = [...contenedor.querySelectorAll('button')].find((b) => b.textContent === 'Volver')
    expect(volver).toBeTruthy()
    act(() => volver.click())
    expect(cerrar).toHaveBeenCalled()
  })
})
