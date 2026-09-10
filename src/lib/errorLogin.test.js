import { describe, it, expect } from 'vitest'
import { mensajeDeLogin } from './errorLogin.js'

describe('mensajeDeLogin', () => {
  it('credenciales malas: un solo mensaje, sin decir cuál de los dos falla', () => {
    // Distinguir "ese correo no existe" de "esa contraseña no es" le confirma a
    // quien sondea que la cuenta existe.
    const a = mensajeDeLogin({ code: 'invalid_credentials', message: 'Invalid login credentials' })
    expect(a.titulo).toMatch(/Correo o contraseña/)
  })

  it('el bloqueo por intentos NO se disfraza de contraseña mala', () => {
    // Es el que más daño hace: la persona tiene la contraseña bien y la app le
    // dice que está mal, así que la cambia, y sigue bloqueada.
    const r = mensajeDeLogin({ status: 429, message: 'Request rate limit reached' })
    expect(r.titulo).toMatch(/Demasiados intentos/)
    expect(r.detalle).toMatch(/puede estar bien/)
  })

  it('el correo sin confirmar se nombra', () => {
    const r = mensajeDeLogin({ code: 'email_not_confirmed', message: 'Email not confirmed' })
    expect(r.titulo).toMatch(/confirmar el correo/)
  })

  it('la cuenta suspendida se nombra', () => {
    expect(mensajeDeLogin({ message: 'User is banned' }).titulo).toMatch(/suspendida/)
  })

  it('un fallo de red no manda a cambiar la contraseña', () => {
    const r = mensajeDeLogin({ message: 'Failed to fetch' })
    expect(r.titulo).toMatch(/Sin conexión/)
  })

  it('lo desconocido se muestra tal cual en vez de inventar una causa', () => {
    const r = mensajeDeLogin({ message: 'algo raro del servidor' })
    expect(r.detalle).toBe('algo raro del servidor')
  })

  it('sin error tampoco revienta', () => {
    expect(mensajeDeLogin(undefined).titulo).toBeTruthy()
    expect(mensajeDeLogin(null).titulo).toBeTruthy()
  })

  it('todos los casos traen título y detalle', () => {
    const casos = [
      { status: 429 }, { code: 'email_not_confirmed' }, { message: 'User is banned' },
      { message: 'Failed to fetch' }, { code: 'invalid_credentials' }, {},
    ]
    for (const c of casos) {
      const r = mensajeDeLogin(c)
      expect(r.titulo, JSON.stringify(c)).toBeTruthy()
      expect(r.detalle, JSON.stringify(c)).toBeTruthy()
    }
  })
})
