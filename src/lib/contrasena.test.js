import { describe, it, expect } from 'vitest'
import {
  MINIMO, problemaConContrasena, fuerzaDeContrasena, esEnlaceDeContrasena,
} from './contrasena.js'

describe('problemaConContrasena', () => {
  it('acepta una contraseña larga y repetida bien', () => {
    expect(problemaConContrasena('caballo verde 4', 'caballo verde 4')).toBeNull()
  })

  it('pide algo escrito', () => {
    expect(problemaConContrasena('', '')).toMatch(/Escribe/)
  })

  it('exige la longitud mínima', () => {
    expect(problemaConContrasena('corta1', 'corta1')).toContain(String(MINIMO))
  })

  it('avisa cuando las dos no coinciden', () => {
    expect(problemaConContrasena('caballoverde', 'caballoverdd')).toMatch(/no coinciden/)
  })

  it('rechaza espacios al principio o al final', () => {
    // Se pierden al copiar y pegar, y la persona queda fuera de su cuenta sin
    // entender por qué: la escribió bien.
    expect(problemaConContrasena(' caballoverde', ' caballoverde')).toMatch(/espacios/)
    expect(problemaConContrasena('caballoverde ', 'caballoverde ')).toMatch(/espacios/)
  })

  it('permite espacios en medio', () => {
    // Una frase es más fácil de recordar y más difícil de adivinar.
    expect(problemaConContrasena('caballo verde salta', 'caballo verde salta')).toBeNull()
  })

  it('sin repetida solo valida la primera', () => {
    expect(problemaConContrasena('caballoverde')).toBeNull()
  })
})

describe('fuerzaDeContrasena', () => {
  it('lo demasiado corto no puntúa', () => {
    expect(fuerzaDeContrasena('abc').nivel).toBe(0)
  })

  it('una frase larga puntúa alto aunque no lleve símbolos', () => {
    // Es el punto de la medida: la longitud pesa más que la variedad.
    expect(fuerzaDeContrasena('caballo verde salta alto').nivel).toBe(3)
  })

  it('lo corto con variedad se queda a medias', () => {
    expect(fuerzaDeContrasena('Aira26!x').nivel).toBe(2)
  })

  it('lo justo y monótono es débil', () => {
    expect(fuerzaDeContrasena('aaaaaaaa').nivel).toBe(1)
  })
})

describe('esEnlaceDeContrasena', () => {
  it('reconoce el enlace de recuperación por el fragmento', () => {
    // Supabase devuelve los datos en el # y no en la query, así que mirar
    // location.search no encuentra nada.
    expect(esEnlaceDeContrasena(
      'https://aira-learninghub.vercel.app/#access_token=abc&type=recovery'
    )).toBe(true)
  })

  it('reconoce también el de invitación', () => {
    expect(esEnlaceDeContrasena('https://x.app/#access_token=abc&type=invite')).toBe(true)
  })

  it('lo tolera en la query, por si el redirector lo mueve', () => {
    expect(esEnlaceDeContrasena('https://x.app/?type=recovery')).toBe(true)
  })

  it('una carga normal no lo es', () => {
    expect(esEnlaceDeContrasena('https://aira-learninghub.vercel.app/')).toBe(false)
    expect(esEnlaceDeContrasena('https://aira-learninghub.vercel.app/gabinete')).toBe(false)
  })

  it('no se confunde con un parámetro que lo contenga', () => {
    expect(esEnlaceDeContrasena('https://x.app/#tipo=recovery_x')).toBe(false)
    expect(esEnlaceDeContrasena('https://x.app/?nota=type=recovery2')).toBe(false)
  })
})
