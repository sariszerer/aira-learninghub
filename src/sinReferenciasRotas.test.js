import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import path from 'node:path'

// Un ReferenceError no lo ve nadie hasta que alguien abre esa pantalla.
//
// Han llegado tres a producción. `BloqueFirma` en el reporte para la familia:
// el import se insertó mal y la pantalla salía en blanco. `parentReports` en
// el inicio de dirección clínica: se leían seis stores y ese faltaba, así que
// Claudia e Idaira no podían entrar. Y `setSelectedSchool` al borrar un
// colegio: el error caía en el catch de al lado y avisaba "No se pudo
// eliminar el colegio" DESPUÉS de haberlo eliminado — decía que había fallado
// algo que sí hizo.
//
// Los tres compilan. El empaquetador no protesta. Ninguna prueba de funciones
// puras los toca, y una prueba de render solo cubre lo que se monta en ella.
// no-undef los encuentra los tres en un segundo, así que corre aquí y no solo
// en un script que alguien tiene que acordarse de ejecutar.

describe('no quedan referencias a cosas que no existen', () => {
  it('eslint no encuentra ningún error en src', async () => {
    const eslint = new ESLint()
    const resultados = await eslint.lintFiles(['src'])

    const problemas = resultados
      .filter((r) => r.errorCount > 0)
      .flatMap((r) => r.messages
        .filter((m) => m.severity === 2)
        .map((m) => `${path.relative(process.cwd(), r.filePath)}:${m.line}  ${m.message}`))

    expect(problemas, `\n${problemas.join('\n')}\n`).toEqual([])
  }, 60_000)
})
