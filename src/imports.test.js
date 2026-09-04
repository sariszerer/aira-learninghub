import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Guarda contra el fallo que costo una sesion de depuracion durante el refactor:
// al mover `readableTextOn` a lib/format.js se quedo referenciando `T` sin
// importarlo. Vite compila eso sin una sola queja — una referencia libre es
// sintaxis valida — y truena como ReferenceError recien al renderizar.
//
// Mientras se sigan moviendo componentes entre archivos, esta prueba es la unica
// red que atrapa un import olvidado sin tener que abrir el navegador.

// Nombres que el refactor repartio en modulos. Si un archivo los usa, tiene que
// importarlos o definirlos.
const CONOCIDOS = [
  'T', 'STATUS', 'FONTS', 'SPECIALIST_COLORS', 'CHILD_AVATAR_COLORS', 'inputStyle',
  'TODAY', 'MobileStyles',
  'AIRA_MARK_URI', 'AIRA_LOGO_FULL_URI',
  'ACTIVITY_CATALOG', 'DOC_TYPES', 'MEETING_TYPES',
  'fmtDate', 'fmtDateShort', 'readableTextOn', 'slugifyName', 'daysAgoISO',
  'sessionsSinceLastParentReport',
  'seedUsers', 'seedChildren', 'seedObjectives', 'seedSessions', 'seedDocuments',
  'seedMeetings', 'seedParentReports', 'seedTutors', 'seedSchools',
  'seedGabineteSessions', 'seedTutorReports',
  'can', 'visibleChildren', 'canSeeChild', 'ROLES', 'PERMISSIONS', 'buildUser',
  'useAuthStore', 'useDataStore', 'useCalendarStore',
  'db', 'auth', 'getAppUser', 'supabase',
  'useState', 'useEffect', 'useMemo', 'useRef', 'useCallback',
  'Logo', 'Eyebrow', 'StatusPill', 'StatusRing', 'Avatar', 'Btn', 'Chip', 'Card',
  'Modal', 'ModalHeader', 'Field', 'Section', 'FieldLabel', 'StepDots', 'EmptyNote',
  'SavedToast', 'StatStrip', 'DateRangeBar', 'ReportCard',
  'Search', 'ChevronRight', 'ChevronLeft', 'Plus', 'Check', 'Calendar', 'Clock',
  'User', 'Users', 'FileText', 'LayoutGrid', 'ClipboardList', 'TrendingUp',
  'AlertTriangle', 'LogOut', 'Sparkles', 'ArrowRight', 'Printer', 'Filter',
  'ChevronDown',
  'signInToGoogle', 'getStoredToken', 'clearToken',
  'useNavigate', 'useLocation', 'useSearchParams', 'useParams', 'Navigate',
  'Routes', 'Route', 'Login', 'create',
]

// aira-app.js es el bundle de produccion generado por el postbuild, no fuente.
const IGNORAR = ['aira-app.js']

function archivosFuente(dir, acc = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entrada.name)
    if (entrada.isDirectory()) archivosFuente(p, acc)
    else if (/\.jsx?$/.test(entrada.name) && !/\.test\.jsx?$/.test(entrada.name)
             && !IGNORAR.includes(entrada.name)) acc.push(p)
  }
  return acc
}

// Quita comentarios y cadenas: una mencion en prosa no es un uso.
//
// Las plantillas se tratan aparte. Borrarlas enteras dejaba ciego al guardia
// justo donde mas codigo hay en este repositorio: lo de dentro de ${...} es
// codigo, no texto. Asi paso inadvertido que lib/reports.js usaba TODAY sin
// importarlo dentro de una interpolacion — un ReferenceError en cuanto el rango
// de fechas venia vacio.
function soloCodigo(src) {
  return sinTextoDePlantillas(src)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
}

// Vacia el texto literal de cada plantilla y conserva el contenido de cada
// ${...}, contando llaves para soportar anidamiento.
function sinTextoDePlantillas(src) {
  let salida = ''
  let i = 0
  while (i < src.length) {
    if (src[i] === '\\') { salida += src.slice(i, i + 2); i += 2; continue }
    if (src[i] !== '`') { salida += src[i]; i++; continue }
    i++
    salida += '`'
    while (i < src.length && src[i] !== '`') {
      if (src[i] === '\\') { i += 2; continue }
      if (src[i] === '$' && src[i + 1] === '{') {
        i += 2
        const desde = i
        let prof = 1
        while (i < src.length && prof > 0) {
          if (src[i] === '{') prof++
          else if (src[i] === '}') prof--
          if (prof > 0) i++
        }
        salida += ' ' + sinTextoDePlantillas(src.slice(desde, i)) + ' '
        i++
        continue
      }
      i++
    }
    salida += '`'
    i++
  }
  return salida
}

function importadoODefinido(src, nombre) {
  const e = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [
    new RegExp(`import[^;]*\\b${e}\\b[^;]*from`),
    new RegExp(`\\b(?:const|let|var|function|class)\\s+${e}\\b`),
    new RegExp(`\\bas\\s+${e}\\b`),
  ].some((r) => r.test(src))
}

describe('imports entre modulos', () => {
  const archivos = archivosFuente('src')

  it('encuentra los archivos fuente', () => {
    expect(archivos.length).toBeGreaterThan(20)
  })

  it('ningun archivo usa un identificador compartido sin importarlo', () => {
    const libres = []
    for (const archivo of archivos) {
      const crudo = fs.readFileSync(archivo, 'utf8')
      const codigo = soloCodigo(crudo)
      for (const nombre of CONOCIDOS) {
        const usado = new RegExp(`(?<![A-Za-z0-9_$.])${nombre}(?![A-Za-z0-9_$])`).test(codigo)
        if (usado && !importadoODefinido(crudo, nombre)) {
          libres.push(`${archivo.replace(/\\/g, '/')} usa ${nombre} sin importarlo`)
        }
      }
    }
    expect(libres).toEqual([])
  })
})
