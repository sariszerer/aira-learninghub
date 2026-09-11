import { describe, it, expect } from 'vitest'
import {
  MINIMO, problemaConContrasena, fuerzaDeContrasena, esEnlaceDeContrasena,
  mensajeDeGuardarContrasena,
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
    expect(fuerzaDeContrasena('Aira2026!x').nivel).toBe(2)
  })

  it('lo justo y monótono es débil', () => {
    expect(fuerzaDeContrasena('aaaaaaaaaa').nivel).toBe(1)
  })

  it('por debajo del mínimo no puntúa: no se puede guardar', () => {
    // Los ejemplos de arriba tenían ocho caracteres, que era el mínimo viejo.
    // Con el de verdad —el que exige el servidor— ya no se pueden guardar.
    expect(fuerzaDeContrasena('Aira26!x').nivel).toBe(0)
    expect(fuerzaDeContrasena('aaaaaaaa').nivel).toBe(0)
  })
})

describe('MINIMO', () => {
  it('es el que exige Supabase al guardar, no uno más flojo', () => {
    // Estaba en 8 y el servidor rechazaba con 422 "Password should be at
    // least 10 characters": la pantalla daba por buena una contraseña que
    // nunca llegaba a guardarse, y la persona se quedaba con la vieja
    // creyendo que la había cambiado.
    //
    // Si alguien sube el mínimo en el panel de Supabase, esta prueba no puede
    // enterarse — pero deja dicho que los dos números son el mismo número.
    expect(MINIMO).toBe(10)
  })

  it('el aviso de "muy corta" nombra el mínimo de verdad', () => {
    expect(problemaConContrasena('123456789', '123456789')).toContain('10')
  })
})

describe('mensajeDeGuardarContrasena', () => {
  it('la contraseña corta se explica en español y dice cuántos faltan', () => {
    const m = mensajeDeGuardarContrasena({ message: 'Password should be at least 10 characters.' })
    expect(m.titulo).toBe('La contraseña es muy corta')
    expect(m.detalle).toContain('10')
  })

  it('toma el número del servidor, no el suyo', () => {
    // Si el panel sube el mínimo a 12, el aviso tiene que decir 12 aunque el
    // código siga pensando que son 10.
    const m = mensajeDeGuardarContrasena({ message: 'Password should be at least 12 characters.' })
    expect(m.detalle).toContain('12')
  })

  it('el enlace caducado se distingue del resto', () => {
    const m = mensajeDeGuardarContrasena({ message: 'Email link is invalid or has expired' })
    expect(m.titulo).toBe('El enlace ya caducó')
  })

  it('un fallo de red no se cuenta como culpa de la contraseña', () => {
    // Mandar a cambiarla no arregla que no haya conexión.
    const m = mensajeDeGuardarContrasena({ message: 'Failed to fetch' })
    expect(m.titulo).toBe('Sin conexión con el servidor')
  })

  it('lo que no se reconoce no se inventa', () => {
    const m = mensajeDeGuardarContrasena({ message: 'algo raro del servidor' })
    expect(m.titulo).toBe('No se pudo guardar la contraseña')
    expect(m.detalle).toBe('algo raro del servidor')
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
