import { describe, it, expect } from 'vitest'
import { queFalta } from './validacion.js'

describe('queFalta', () => {
  it('no dice nada cuando está todo', () => {
    expect(queFalta([[true, 'el nombre'], [true, 'la fecha']])).toBeNull()
  })

  it('un solo campo va en singular', () => {
    expect(queFalta([[false, 'el nombre del colegio'], [true, 'la fecha']]))
      .toBe('Falta el nombre del colegio.')
  })

  it('dos campos se unen con "y", no con coma', () => {
    expect(queFalta([[false, 'el nombre'], [false, 'la fecha']]))
      .toBe('Faltan el nombre y la fecha.')
  })

  it('tres o más: comas y la última con "y"', () => {
    expect(queFalta([[false, 'el nombre'], [false, 'la fecha'], [false, 'la especialidad']]))
      .toBe('Faltan el nombre, la fecha y la especialidad.')
  })

  it('una lista vacía no bloquea nada', () => {
    expect(queFalta([])).toBeNull()
    expect(queFalta()).toBeNull()
  })

  it('respeta el orden de los campos, que es el de la pantalla', () => {
    // Importa: el usuario busca el primero que se le menciona y espera que sea
    // el de más arriba del formulario.
    expect(queFalta([[true, 'a'], [false, 'b'], [false, 'c']])).toBe('Faltan b y c.')
  })
})
