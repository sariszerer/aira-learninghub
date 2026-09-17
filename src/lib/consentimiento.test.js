import { describe, it, expect } from 'vitest'
import {
  documentoDeConsentimiento, estadoDeConsentimiento, estaFirmado,
  tieneFirma, nuevoToken, enlaceDeFirma, sinFirma, idDeConsentimiento,
} from './consentimiento.js'

const doc = (extra) => ({ childId: 'c-1', type: 'consentimiento', fields: {}, ...extra })

describe('documentoDeConsentimiento', () => {
  it('encuentra el documento propio', () => {
    const d = doc({ id: 'd-consent-c-1' })
    expect(documentoDeConsentimiento([d], 'c-1')).toBe(d)
  })

  it('si no hay, usa el que quedó firmado dentro de la anamnesis', () => {
    // Los cuatro firmados hasta hoy están ahí. No se migran a ciegas: una
    // firma es la prueba de que alguien autorizó algo.
    const viejo = { id: 'd-a', childId: 'c-1', type: 'anamnesis', fields: { firmaAcudienteImg: 'data:x' } }
    expect(documentoDeConsentimiento([viejo], 'c-1')).toBe(viejo)
  })

  it('una anamnesis SIN firma no cuenta como consentimiento', () => {
    const viejo = { id: 'd-a', childId: 'c-1', type: 'anamnesis', fields: { motivoConsulta: 'x' } }
    expect(documentoDeConsentimiento([viejo], 'c-1')).toBe(null)
  })

  it('el propio manda sobre el de la anamnesis', () => {
    const viejo = { id: 'd-a', childId: 'c-1', type: 'anamnesis', fields: { firmaAcudienteImg: 'data:x' } }
    const propio = doc({ id: 'd-consent-c-1' })
    expect(documentoDeConsentimiento([viejo, propio], 'c-1')).toBe(propio)
  })

  it('no se cruza con el expediente de al lado', () => {
    const otro = doc({ id: 'd-consent-c-9', childId: 'c-9' })
    expect(documentoDeConsentimiento([otro], 'c-1')).toBe(null)
  })

  it('sin documentos, no hay consentimiento', () => {
    expect(documentoDeConsentimiento([], 'c-1')).toBe(null)
    expect(documentoDeConsentimiento(undefined, 'c-1')).toBe(null)
  })
})

describe('estadoDeConsentimiento', () => {
  it('sin nada, está pendiente', () => {
    expect(estadoDeConsentimiento(null)).toBe('pendiente')
    expect(estadoDeConsentimiento(doc())).toBe('pendiente')
  })

  it('con enlace abierto y sin usar, se está esperando', () => {
    expect(estadoDeConsentimiento(doc({ fields: { consentToken: 'abc' } }))).toBe('esperando')
  })

  it('con rúbrica, firmado a distancia', () => {
    expect(estadoDeConsentimiento(doc({ fields: { firmaAcudienteImg: 'data:x' } })))
      .toBe('firmado_a_distancia')
  })

  it('con nombre, firmado en persona', () => {
    expect(estadoDeConsentimiento(doc({ fields: { firmaAcudiente: 'Adela Guindi' } })))
      .toBe('firmado_en_persona')
  })

  it('un nombre en blanco no es una firma', () => {
    expect(estadoDeConsentimiento(doc({ fields: { firmaAcudiente: '   ' } }))).toBe('pendiente')
  })

  it('la rúbrica manda sobre el token que quedó puesto', () => {
    // sign_consent deja la clave consentToken con valor null, no la borra.
    expect(estadoDeConsentimiento(doc({ fields: { firmaAcudienteImg: 'data:x', consentToken: null } })))
      .toBe('firmado_a_distancia')
  })

  it('estaFirmado solo con firma de verdad', () => {
    expect(estaFirmado(doc({ fields: { consentToken: 'abc' } }))).toBe(false)
    expect(estaFirmado(doc({ fields: { firmaAcudiente: 'Adela' } }))).toBe(true)
    expect(estaFirmado(null)).toBe(false)
  })
})

describe('tieneFirma', () => {
  it('no revienta sin documento', () => {
    expect(tieneFirma(null)).toBe(false)
    expect(tieneFirma({})).toBe(false)
  })
})

describe('nuevoToken', () => {
  it('usa el generador del navegador si lo hay', () => {
    expect(nuevoToken({ randomUUID: () => 'uuid-1' })).toBe('uuid-1')
  })

  it('sin él, sigue dando algo distinto cada vez', () => {
    const a = nuevoToken({}), b = nuevoToken({})
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThan(10)
  })
})

describe('enlaceDeFirma', () => {
  it('arma el enlace que se le pasa a la familia', () => {
    expect(enlaceDeFirma('t1', 'https://aira.app', '/')).toBe('https://aira.app/?firmar=t1')
  })
})

describe('sinFirma', () => {
  it('se lleva todos los rastros, no solo la imagen', () => {
    // Dejar la fecha sin la rúbrica da un documento que dice que alguien firmó
    // y no enseña la firma: peor que no tener nada.
    const limpio = sinFirma({
      firmaAcudienteImg: 'data:x', fechaFirmaAcudiente: '2026-01-01',
      firmaAcudiente: 'Adela', fechaFirma: '2026-01-01', consentToken: 'abc',
      motivoConsulta: 'se queda',
    })
    expect(limpio).toEqual({ motivoConsulta: 'se queda' })
  })
})

describe('idDeConsentimiento', () => {
  it('es estable por expediente: uno por niño, no uno por clic', () => {
    expect(idDeConsentimiento('c-1')).toBe('d-consent-c-1')
    expect(idDeConsentimiento('c-1')).toBe(idDeConsentimiento('c-1'))
  })
})
