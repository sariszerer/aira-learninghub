import { describe, it, expect } from 'vitest'
import { generarClaveTemporal, mensajeDeAcceso } from './claveTemporal.js'
import { problemaConContrasena } from './contrasena.js'

describe('generarClaveTemporal', () => {
  it('la que genera pasa las reglas de la propia aplicación', () => {
    // Sin esto se podría generar una clave que el formulario de cambio rechaza
    // después, y la persona quedaría atrapada.
    for (let i = 0; i < 200; i++) {
      const c = generarClaveTemporal()
      expect(problemaConContrasena(c, c), c).toBeNull()
    }
  })

  it('son tres palabras y un número, separados por guiones', () => {
    expect(generarClaveTemporal()).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d{2}$/)
  })

  it('no repite palabra', () => {
    // "verde-verde-luna" se dicta mal y aporta menos.
    for (let i = 0; i < 200; i++) {
      const partes = generarClaveTemporal().split('-').slice(0, 3)
      expect(new Set(partes).size, partes.join('-')).toBe(3)
    }
  })

  it('no lleva tildes, ñ ni mayúsculas: se teclea igual en cualquier móvil', () => {
    for (let i = 0; i < 200; i++) {
      expect(generarClaveTemporal()).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('no genera siempre la misma', () => {
    const vistas = new Set()
    for (let i = 0; i < 50; i++) vistas.add(generarClaveTemporal())
    expect(vistas.size).toBeGreaterThan(40)
  })

  it('con un azar fijo es reproducible, que es lo que la hace comprobable', () => {
    const fijo = () => 0
    expect(generarClaveTemporal(fijo)).toBe(generarClaveTemporal(fijo))
  })
})

describe('mensajeDeAcceso', () => {
  const m = mensajeDeAcceso({
    nombre: 'María Virginia Sierralta',
    email: 'airalh.mavi@gmail.com',
    clave: 'salta-nube-verde-47',
    url: 'https://aira-learninghub.vercel.app',
  })

  it('saluda por el nombre de pila', () => {
    expect(m).toContain('Hola María:')
  })

  it('lleva el correo Y la contraseña', () => {
    // Varias del equipo tienen una cuenta personal distinta de la del centro:
    // solo con la contraseña tendrían que adivinar con cuál entran.
    expect(m).toContain('airalh.mavi@gmail.com')
    expect(m).toContain('salta-nube-verde-47')
  })

  it('lleva la dirección de la aplicación', () => {
    expect(m).toContain('https://aira-learninghub.vercel.app')
  })

  it('avisa de que habrá que cambiarla', () => {
    expect(m).toMatch(/cambies/)
  })
})
