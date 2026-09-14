import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { esAcudiente, pestanasDe, tienePestana, pideDatosDeNino, textoDeVinculo, TIPOS, ANAMNESIS_ACUDIENTE, resumenAnamnesisAcudiente, textoRecomendaciones, textoConsentimiento, partesConsentimiento, sinFirmaDelAcudiente } from './expediente.js'

const nino = { id: 'c1', name: 'Asher', lastName: 'Btesh', tipo: 'nino' }
const madre = { id: 'a1', name: 'Sara', lastName: 'Levy', tipo: 'acudiente', acudienteDe: 'c1' }

describe('esAcudiente', () => {
  it('distingue los dos tipos', () => {
    expect(esAcudiente(madre)).toBe(true)
    expect(esAcudiente(nino)).toBe(false)
  })

  it('sin tipo se trata como niño', () => {
    // Los 44 pacientes que ya existen no tienen el campo puesto a mano: la
    // columna trae 'nino' por defecto, pero un objeto a medio construir en la
    // interfaz no debe convertirse en acudiente por accidente.
    expect(esAcudiente({ id: 'x' })).toBe(false)
    expect(esAcudiente(null)).toBe(false)
  })
})

describe('pestanasDe', () => {
  it('el acudiente tiene resumen, sesiones, objetivos, plan y anamnesis', () => {
    expect(pestanasDe(madre)).toEqual(['resumen', 'sesiones', 'objetivos', 'plan', 'anamnesis'])
  })

  it('el niño las tiene todas', () => {
    expect(pestanasDe(nino)).toContain('anamnesis')
    expect(pestanasDe(nino)).toContain('reportes')
    expect(pestanasDe(nino)).toContain('interdisciplinario')
  })

  it('al acudiente no se le ofrece reporte para la familia ni interdisciplinario', () => {
    // No es un hueco por llenar: el reporte para la familia iría dirigido a
    // ella misma, y la reunión interdisciplinaria es sobre el caso de un niño.
    expect(tienePestana(madre, 'reportes')).toBe(false)
    expect(tienePestana(madre, 'interdisciplinario')).toBe(false)
  })

  it('el acudiente sí tiene anamnesis, con sus propios campos', () => {
    // Cambió respecto al diseño inicial, que se la negaba: la directora la
    // pidió para registrar motivo de consulta, situación familiar y
    // dificultades de crianza. Lo que no lleva es la del desarrollo — eso lo
    // garantizan las pruebas de ANAMNESIS_ACUDIENTE.
    expect(tienePestana(madre, 'anamnesis')).toBe(true)
  })

  it('las de acudiente son un subconjunto de las del niño', () => {
    // Si dejan de serlo, hay una pestaña que solo existe en un tipo y el
    // componente que la pinta tendría que saberlo.
    for (const p of pestanasDe(madre)) expect(pestanasDe(nino)).toContain(p)
  })
})

describe('pideDatosDeNino', () => {
  it('a la madre no se le piden fecha de nacimiento ni colegio', () => {
    expect(pideDatosDeNino(madre)).toBe(false)
    expect(pideDatosDeNino(nino)).toBe(true)
  })
})

describe('textoDeVinculo', () => {
  it('nombra al hijo cuando es paciente del centro', () => {
    expect(textoDeVinculo(madre, [nino])).toBe('Madre o padre de Asher Btesh')
  })

  it('lo dice cuando el hijo no está en el centro', () => {
    // También se atiende a familias cuyo hijo no es paciente aquí.
    expect(textoDeVinculo({ ...madre, acudienteDe: null }, [nino]))
      .toBe('Sin hijo o hija en el centro')
  })

  it('un niño no tiene vínculo que mostrar', () => {
    expect(textoDeVinculo(nino, [])).toBeNull()
  })
})

describe('vocabulario', () => {
  it('cada tipo tiene su etiqueta', () => {
    for (const v of Object.values(TIPOS)) {
      expect(v.label).toBeTruthy()
      expect(v.plural).toBeTruthy()
    }
  })

  it('las claves coinciden con las que acepta la base', () => {
    // El CHECK de children.tipo. Si divergen, guardar falla en producción y no
    // en las pruebas.
    expect(Object.keys(TIPOS).sort()).toEqual(['acudiente', 'nino'])
  })
})

describe('ANAMNESIS_ACUDIENTE', () => {
  const campos = ANAMNESIS_ACUDIENTE.flatMap((s) => s.filas.flat())
  const nombres = campos.map((c) => c.name)

  it('no pregunta nada que sea del niño y no de ella', () => {
    // El motivo de existir de esta lista: en el expediente de una madre,
    // preguntar por el embarazo o el rendimiento académico es preguntar por su
    // hijo. Si alguno de estos reaparece, la anamnesis volvió a ser la del
    // desarrollo.
    for (const fuera of [
      'antecedentes', 'saludActual', 'relacionPares',
      'rendimientoAcademico', 'areasDificultad', 'relacionMaestros',
      'fechaNacimiento', 'edad', 'gradoColegio', 'acompanante',
    ]) {
      expect(nombres, fuera).not.toContain(fuera)
    }
  })

  it('cubre lo que la directora pidió registrar', () => {
    for (const dentro of [
      'motivoConsulta', 'composicionFamiliar', 'dinamicaFamiliar',
      'fortalezas', 'dificultades', 'estadoEmocional', 'observaciones',
    ]) {
      expect(nombres, dentro).toContain(dentro)
    }
  })

  it('reutiliza los nombres de campo de la anamnesis del niño', () => {
    // Misma forma de documento guardado, aunque la etiqueta cambie. Si esto se
    // rompe hace falta una migración, y los reportes dejan de leer el dato.
    const porNombre = Object.fromEntries(campos.map((c) => [c.name, c.label]))
    expect(porNombre.hermanos).toBe('Hijos (nombres y edades)')
    expect(porNombre.situacionPadres).toBe('Situación de pareja / coparentalidad')
    expect(porNombre.terapiasPrevias).toBe('Acompañamientos o terapias previas')
  })

  it('ningún campo se repite y todos tienen nombre', () => {
    expect(new Set(nombres).size).toBe(nombres.length)
    for (const c of campos) expect(typeof c.name, JSON.stringify(c)).toBe('string')
  })

  it('las filas llevan uno o dos campos — dos se dibujan en dos columnas', () => {
    for (const seccion of ANAMNESIS_ACUDIENTE) {
      expect(seccion.titulo).toBeTruthy()
      expect(seccion.filas.length).toBeGreaterThan(0)
      for (const fila of seccion.filas) {
        expect(fila.length, seccion.titulo).toBeGreaterThan(0)
        expect(fila.length, seccion.titulo).toBeLessThanOrEqual(2)
      }
    }
  })
})

describe('resumenAnamnesisAcudiente', () => {
  it('muestra solo lo que se llenó, en el orden del formulario', () => {
    const filas = resumenAnamnesisAcudiente({
      motivoConsulta: 'Límites en casa',
      dificultades: 'Rabietas a la hora de dormir',
      observaciones: 'Asiste con su pareja',
    })
    expect(filas.map(([l]) => l)).toEqual([
      '¿Por qué llega a Pautas de Crianza?',
      'Principales dificultades en la crianza',
      'Observaciones adicionales',
    ])
    expect(filas[1][1]).toBe('Rabietas a la hora de dormir')
  })

  it('deja fuera los datos de identidad, que ya están en el encabezado', () => {
    const filas = resumenAnamnesisAcudiente({ nombre: 'Sara Levy', telefono: '300', correo: 'a@b.c' })
    expect(filas).toEqual([])
  })

  it('una anamnesis vacía no muestra nada', () => {
    expect(resumenAnamnesisAcudiente({})).toEqual([])
    expect(resumenAnamnesisAcudiente()).toEqual([])
  })

  it('el campo sin etiqueta se rotula con el título de su sección', () => {
    const filas = resumenAnamnesisAcudiente({ observaciones: 'algo' })
    expect(filas).toEqual([['Observaciones adicionales', 'algo']])
  })
})

describe('textoRecomendaciones', () => {
  it('a la madre no se le manda nada a la escuela', () => {
    expect(textoRecomendaciones(madre).titulo).toBe('Pautas y recomendaciones')
    expect(textoRecomendaciones(madre).placeholder).toContain('casa')
  })

  it('el niño conserva el reparto casa / escuela', () => {
    expect(textoRecomendaciones(nino).titulo).toBe('Recomendaciones para casa / escuela')
  })
})

describe('textoConsentimiento', () => {
  it('la madre acepta participar, no autoriza a un tercero', () => {
    const c = textoConsentimiento(madre)
    expect(c.titulo).toBe('Consentimiento informado Pautas de Crianza')
    expect(c.texto).toContain('Acepto participar voluntariamente')
    expect(c.texto).toContain('la confidencialidad podrá limitarse')
  })

  it('en el de la madre no aparece la fórmula de representante legal', () => {
    // Era el fallo que se vio en la página de firma: a una madre de Pautas de
    // Crianza se le pedía autorizar su propio expediente como si fuera de otro.
    expect(textoConsentimiento(madre).texto).not.toContain('representante legal')
  })

  it('el del niño autoriza evaluación y/o acompañamiento, no ambos por fuerza', () => {
    // "y/o" es deliberado: no todos los pacientes reciben los dos servicios.
    const c = textoConsentimiento(nino)
    expect(c.titulo).toBe('Consentimiento informado')
    expect(c.texto).toContain('evaluación y/o acompañamiento terapéutico')
    expect(c.texto).toContain('{nombre}')
  })

  it('los dos textos acotan la confidencialidad', () => {
    // Riesgo o requerimiento legal: es el límite que la dirección quiso
    // dejar dicho en ambos, y es lo que hace que el consentimiento sea
    // informado y no una firma en blanco.
    for (const p of [nino, madre]) {
      expect(textoConsentimiento(p).texto, p.tipo).toMatch(/riesgo/)
      expect(textoConsentimiento(p).texto, p.tipo).toMatch(/requerimiento legal/)
    }
  })
})

describe('partesConsentimiento', () => {
  it('pone el nombre en negrita donde va {nombre}', () => {
    const partes = partesConsentimiento(textoConsentimiento(nino).texto, 'Asher Btesh')
    expect(partes).toHaveLength(3)
    expect(partes[0].t).toBe('Yo, en calidad de representante legal de ')
    expect(partes[1]).toEqual({ t: 'Asher Btesh', negrita: true })
    expect(partes[2].t).toMatch(/^, autorizo su evaluación/)
  })

  it('el de la madre no lleva hueco, y sale de una pieza', () => {
    const partes = partesConsentimiento(textoConsentimiento(madre).texto, 'Sara Levy')
    expect(partes).toHaveLength(1)
    expect(partes[0].negrita).toBeUndefined()
  })

  it('sin texto no pinta nada, y sin nombre no deja un hueco raro', () => {
    expect(partesConsentimiento(null, 'Sara')).toEqual([])
    expect(partesConsentimiento('Hola {nombre}', '')).toEqual([{ t: 'Hola ' }])
  })
})

describe('el consentimiento se escribe en un solo sitio', () => {
  it('ninguna pantalla repite el texto de Pautas de Crianza', () => {
    // Tenerlo dos veces fue justo el fallo: la ficha decía una cosa y la
    // página de firma a distancia otra. Si hace falta cambiarlo, se cambia en
    // expediente.js y las dos pantallas lo siguen.
    for (const f of [
      'src/patient/tabs/AnamnesisTab.jsx',
      'src/consent/FirmaConsentimientoPublic.jsx',
    ]) {
      const src = fs.readFileSync(f, 'utf8')
      expect(src, f).not.toContain('Acepto participar voluntariamente')
      expect(src, f).not.toContain('en calidad de representante legal')
    }
  })

  it('la página de firma toma el texto del documento, no lo inventa', () => {
    // Solo tiene el documento: ni el paciente ni su tipo. Si lo decidiera
    // ella, volvería a equivocarse con las madres.
    const p = fs.readFileSync('src/consent/FirmaConsentimientoPublic.jsx', 'utf8')
    expect(p).toMatch(/doc\?\.fields\?\.consentTexto/)
    expect(p).toMatch(/doc\?\.fields\?\.consentTitulo/)
  })
})

describe('sinFirmaDelAcudiente', () => {
  const firmado = {
    consentTitulo: 'Consentimiento informado Pautas de Crianza',
    consentTexto: 'Acepto participar…',
    consentToken: null,
    firmaAcudienteImg: 'data:image/png;base64,AAAA',
    fechaFirmaAcudiente: '2026-09-11 01:11:39+00',
    firmaAcudiente: 'Sara Levy',
    fechaFirma: '2026-09-11',
    firmaProfesional: 'Sarita Szerer',
    motivoConsulta: 'Límites en casa',
  }

  it('se lleva las dos formas de firmar y sus fechas', () => {
    // La remota y la escrita en persona: si solo se fuera una, la ficha
    // seguiría diciendo "firmado" por el otro camino.
    const r = sinFirmaDelAcudiente(firmado)
    expect(r.firmaAcudienteImg).toBeUndefined()
    expect(r.fechaFirmaAcudiente).toBeUndefined()
    expect(r.firmaAcudiente).toBe('')
    expect(r.fechaFirma).toBe('')
  })

  it('no toca la firma del profesional', () => {
    // Es otra persona la que firma. Quitar la del acudiente no deshace que el
    // profesional firmara.
    expect(sinFirmaDelAcudiente(firmado).firmaProfesional).toBe('Sarita Szerer')
  })

  it('conserva el texto congelado y el resto de la anamnesis', () => {
    // El texto es la constancia de qué se presentó, y la anamnesis no tiene
    // nada que ver con la firma.
    const r = sinFirmaDelAcudiente(firmado)
    expect(r.consentTitulo).toBe('Consentimiento informado Pautas de Crianza')
    expect(r.consentTexto).toBe('Acepto participar…')
    expect(r.motivoConsulta).toBe('Límites en casa')
  })

  it('sobre un documento sin firma no rompe nada', () => {
    expect(sinFirmaDelAcudiente({})).toEqual({ firmaAcudiente: '', fechaFirma: '' })
    expect(sinFirmaDelAcudiente()).toEqual({ firmaAcudiente: '', fechaFirma: '' })
  })
})
