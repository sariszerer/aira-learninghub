import { describe, it, expect } from 'vitest'
import { horaDe, estaCancelada, filaDeEvento, filasDeEventos, fechaDe, minutosDe } from './agenda.js'

describe('horaDe', () => {
  it('formatea en la hora de Panamá', () => {
    // El centro está en Panamá; el navegador de quien mira puede no estarlo.
    expect(horaDe('2026-09-09T14:30:00-05:00')).toBe('2:30 PM')
  })

  it('un evento de día completo no tiene hora y no se le inventa una', () => {
    expect(horaDe('2026-09-09')).toBe('')
  })

  it('no revienta con una fecha vacía o rota', () => {
    expect(horaDe('')).toBe('')
    expect(horaDe(null)).toBe('')
    expect(horaDe('no-es-fecha T')).toBe('')
  })
})

describe('estaCancelada', () => {
  it('detecta la que Google marcó cancelada', () => {
    expect(estaCancelada({ status: 'cancelled' })).toBe(true)
  })

  it('detecta al especialista que respondió que no asiste', () => {
    expect(estaCancelada({ organizer: { responseStatus: 'declined' } })).toBe(true)
  })

  it('detecta el aviso escrito en la descripción', () => {
    expect(estaCancelada({ description: 'CANCELADA, avisó la mamá' })).toBe(true)
  })

  it('también lo detecta en el título', () => {
    // Antes solo se miraba la descripción: un evento titulado "CANCELADA —
    // Asher" salía en la agenda del día como una cita normal.
    expect(estaCancelada({ summary: 'CANCELADA — Asher Btesh' })).toBe(true)
  })

  it('una cita normal no se marca', () => {
    expect(estaCancelada({ summary: 'Asher Btesh — TO', description: 'Sesión 4' })).toBe(false)
    expect(estaCancelada({})).toBe(false)
  })
})

describe('filaDeEvento', () => {
  it('arma la fila que consume la agenda', () => {
    expect(filaDeEvento({
      id: 'ev1', summary: 'Asher Btesh — TO',
      start: { dateTime: '2026-09-09T09:00:00-05:00' },
      end: { dateTime: '2026-09-09T09:45:00-05:00' },
    })).toMatchObject({
      id: 'ev1', title: 'Asher Btesh — TO',
      time: '9:00 AM', endTime: '9:45 AM', cancelled: false,
    })
  })

  it('un evento sin título se muestra, no se esconde', () => {
    // Ocupa un hueco de la agenda igual: omitirlo haría creer que la hora está
    // libre.
    expect(filaDeEvento({ id: 'ev2' }).title).toBe('Sin título')
  })

  it('una lista vacía da una lista vacía', () => {
    expect(filasDeEventos([])).toEqual([])
    expect(filasDeEventos()).toEqual([])
  })
})

describe('fechaDe y minutosDe', () => {
  it('sitúan la cita en el día y la hora de Panamá', () => {
    // Se leen del desfase del propio ISO, no de un Date en la zona de quien
    // mira: desde España, una cita de las 8 de la noche en Panamá se iría al
    // día siguiente y la agenda mostraría el día equivocado.
    expect(fechaDe('2026-09-09T20:00:00-05:00')).toBe('2026-09-09')
    expect(minutosDe('2026-09-09T20:00:00-05:00')).toBe(20 * 60)
  })

  it('un evento de día completo tiene fecha pero no minutos', () => {
    expect(fechaDe('2026-09-09')).toBe('2026-09-09')
    expect(minutosDe('2026-09-09')).toBeNull()
  })

  it('no revientan con basura', () => {
    expect(fechaDe('')).toBe('')
    expect(minutosDe(null)).toBeNull()
  })
})

describe('filaDeEvento — datos para la rejilla', () => {
  it('trae fecha, minutos y si ocupa el día entero', () => {
    expect(filaDeEvento({
      id: 'e1', summary: 'Haim - Sarita',
      start: { dateTime: '2026-09-09T14:45:00-05:00' },
      end: { dateTime: '2026-09-09T15:30:00-05:00' },
    })).toMatchObject({
      fecha: '2026-09-09', inicioMin: 885, finMin: 930, diaCompleto: false,
    })
  })

  it('marca los de día completo', () => {
    expect(filaDeEvento({
      id: 'e2', summary: 'NEYMA OUT VACACIONES', start: { date: '2026-09-09' },
    })).toMatchObject({ diaCompleto: true, inicioMin: null })
  })
})
