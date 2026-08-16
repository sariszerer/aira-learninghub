# AIRA Learning Hub — Guía técnica para Sarita

## La app está en internet

**URL:** https://aira-learninghub.vercel.app

Cualquier persona del equipo puede abrir esta dirección desde su teléfono, tablet o computadora — sin instalar nada. Es la app clínica de AIRA.

---

## Cómo está construido todo

Hay tres piezas que trabajan juntas:

### 1. GitHub — donde vive el código
**Dirección:** https://github.com/sariszerer/aira-learninghub
**Cuenta:** sariszerer (sszerer@gmail.com)

GitHub es el archivo donde se guarda el código de la app. Cada vez que se hace un cambio en el código, se guarda aquí. Piénsalo como el Google Drive del código — guarda el historial completo de todo lo que ha cambiado y cuándo.

### 2. Vercel — quien pone la app en internet
**Dirección:** https://vercel.com
**Cuenta:** sszerer@gmail.com

Vercel está conectado a GitHub. En el momento en que GitHub recibe un cambio nuevo en el código, Vercel lo detecta automáticamente y actualiza la app en internet en menos de 2 minutos. No hay que hacer nada manual — el proceso es completamente automático.

### 3. Supabase — donde se guardan los datos
**Dirección:** https://supabase.com
**Cuenta:** sszerer@gmail.com
**Proyecto:** https://wxsxtevvxepgjfxphdxt.supabase.co

Supabase es la base de datos real de AIRA. Aquí se guardan permanentemente todas las sesiones que registran las especialistas, los objetivos de los pacientes, los documentos, las minutas, los reportes para padres, y todo lo demás. Los datos nunca se pierden aunque alguien recargue la página o cierre el browser.

---

## El flujo de un cambio

Cuando Sarita quiere cambiar algo en la app — una nueva funcionalidad, un ajuste de diseño, un campo nuevo — el proceso es:

```
Sarita le pide el cambio a Claude
        ↓
Claude modifica el código directamente en GitHub
        ↓
Vercel detecta el cambio automáticamente
        ↓
En 2 minutos la app en internet está actualizada
```

No hay pasos manuales. No hay que descargar ni instalar nada. El cambio aparece solo.

---

## Cómo Claude hace los cambios

Claude tiene acceso directo a GitHub mediante un token de autorización. Cuando Sarita describe un cambio que quiere — ya sea en esta conversación o en una nueva — Claude puede modificar el código en GitHub en tiempo real. El cambio llega a internet en minutos.

Para conectar Claude con GitHub de forma permanente en el futuro, se puede configurar un **GitHub MCP** en Claude.ai que mantenga la conexión activa entre sesiones, de modo que Claude pueda hacer cambios directamente sin que Sarita tenga que proporcionar credenciales cada vez.

---

## Cuentas y credenciales

| Servicio | URL | Email | Para qué |
|---|---|---|---|
| GitHub | github.com | sszerer@gmail.com | Guarda el código |
| Vercel | vercel.com | sszerer@gmail.com | Publica en internet |
| Supabase | supabase.com | sszerer@gmail.com | Guarda los datos |

**Importante:** Guardar estas credenciales en un lugar seguro. Son el acceso a toda la infraestructura de AIRA.

---

## Qué hacer si algo falla

**La app no carga:** Revisar https://vercel.com — puede ser un error en un deploy reciente. En ese caso, contactar a Claude con una captura de pantalla del error.

**Los datos no se guardan:** Revisar https://supabase.com — el proyecto puede estar pausado si no ha habido actividad (el plan gratuito pausa proyectos inactivos). Entrar a Supabase y presionar "Resume project".

**Quiero un cambio en la app:** Abrir Claude, describir el cambio, y Claude lo hace directamente en GitHub. En minutos aparece en internet.

---

## Estado actual de los datos

La app arranca con los 51 pacientes reales de AIRA ya cargados, con sus especialistas asignados y los expedientes documentados del Lote 1. El equipo puede empezar a registrar sesiones desde hoy — cada sesión queda guardada permanentemente en Supabase.

Cuando llegue el Excel con los datos completos de los pacientes (fechas de nacimiento, contactos de padres, etc.), Claude los migra directamente a la base de datos.

---

*Documento generado el 15 de agosto de 2026*
*App desarrollada con Claude (Anthropic) · Infraestructura: GitHub + Vercel + Supabase*
