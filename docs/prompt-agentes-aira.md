# Prompt para arrancar el proyecto de agentes de AIRA

Copia todo lo que hay debajo de la línea y pégalo como primer mensaje en una
sesión nueva de Claude Code, en una carpeta nueva (no dentro de
`aira-learninghub`).

---

Vas a construir una capa de agentes sobre un sistema clínico que ya está en
producción. Lee esto entero antes de escribir nada, y antes de decidir la
arquitectura dime qué vas a hacer con los cuatro problemas difíciles que marco
al final: tres de ellos pueden hundir el proyecto si se resuelven tarde.

## Qué existe hoy

**AIRA Learning Hub** — centro de terapias infantiles en Ciudad de Panamá.
En producción, en uso diario.

- Repo: `github.com/sariszerer/aira-learninghub`. React 18 + Vite, sin
  TypeScript, estilos en línea con un objeto de tokens `T`, estado en Zustand.
- Base: Supabase, proyecto `wxsxtevvxepgjfxphdxt`. Postgres con RLS en todas
  las tablas; los permisos se resuelven con funciones `SECURITY DEFINER`
  (`has_perm`, `can_see_child`, `app_user_id`) y un catálogo de permisos en
  `permissions` / `role_permissions`.
- Edge Functions en Deno con `service_role`: `crear-especialista`,
  `cambiar-correo`, `enviar-invitacion`, `calendario`.
- Despliegue en Vercel, rama `main`.
- Escala real: 48 pacientes, ~460 sesiones, 11 cuentas de personal.

Tablas que te importan: `children`, `sessions`, `objectives`, `documents`,
`meetings`, `users`, `roles`, `permissions`, `role_permissions`,
`evolution_reports`, `parent_reports`.

Una sesión lleva: `child_id`, `specialist_id`, `specialty`, `date`, `duration`,
`attendance`, `objectives_worked` (jsonb), `activities` (array), `observation`,
`next_steps`, `modalidad`, `con_especialista`.

**No modifiques el repo existente.** Construye aparte y habla con la base por
API. Si necesitas columnas nuevas, propón la migración y pídemela antes.

## Qué hay que construir

Cinco cosas. Son independientes: entrégalas de una en una, funcionando, no las
cinco a medias.

### 1. Recordatorios de registro de sesión

De una a tres avisos por WhatsApp a la terapeuta que no ha subido el reporte de
una sesión que ya ocurrió. Escalonados, no los tres juntos.

El dato está en la base: una cita en el calendario sin su fila en `sessions`, o
una sesión con `observation` vacía. Mira primero cuál de los dos es la señal
real — hay 438 sesiones importadas sin observación que no son deudas de nadie.

### 2. Agente de cumplimiento

El que se asegura de que los registros entren. Empieza por WhatsApp, y sube a
correo y a llamada telefónica solo si no hay respuesta. Escala por tiempo, no
por número de intentos.

Necesita saber cuándo parar: una terapeuta de vacaciones no es una morosa.

### 3. Agente clínico de sugerencias

Lee lo que ya está grabado —sesiones, objetivos, avance GAS, minutas— y propone:
terapias a considerar, recomendaciones desde el punto de vista terapéutico,
ajustes al plan.

Va a un panel de sugerencias donde la directora clínica las ve una a una y con
un clic las mete en el plan de trabajo del paciente. **Nunca escribe sola en el
expediente.** Una sugerencia aceptada tiene que quedar marcada como tal: dentro
de seis meses alguien va a preguntar quién decidió esto.

### 4. Agente de oportunidades

Investiga y propone oportunidades de relaciones públicas para el centro:
medios, charlas, colegios, alianzas. Panel para aprobar una a una y seguimiento
de en qué va cada una.

Este no toca datos clínicos. Sepáralo del resto desde el principio — distinta
base de datos o al menos distinto esquema. Es la pieza que más tienta a
conectar con todo y la que menos lo necesita.

### 5. Agente de contenido formativo

Lee y analiza material de **Good Inside** (Dr. Becky Kennedy), lo trae
sintetizado, y lo traduce al español con la voz de Sarita y de AIRA Learning
Hub, orientado a **Conscious Discipline**.

Lee la sección de licencias abajo antes de escribir una línea de esto.

## Los cuatro problemas difíciles

Resuélvelos antes de la arquitectura, no después.

### WhatsApp no deja mandar lo que quieras cuando quieras

La API de WhatsApp Business (es la parte de Meta de este proyecto) solo permite
iniciar conversación con **plantillas aprobadas por Meta**, y hay que pedir la
aprobación de cada una. Fuera de la ventana de 24 horas desde el último mensaje
de la persona, solo pasan plantillas. Y hace falta consentimiento previo de
cada terapeuta para recibirlos.

Esto condiciona el diseño entero del agente de cumplimiento: el texto no puede
ser libre en el primer mensaje. Diséñalo con esa restricción desde el principio
en vez de descubrirla cuando esté construido.

Las llamadas telefónicas **no** salen de Meta. Hace falta otro proveedor.

### Son datos clínicos de menores

Toda sugerencia del agente clínico implica mandar historia clínica de un niño a
un modelo. Antes de construirlo, decide y escríbeme:

- qué sale del centro exactamente (¿el texto de las observaciones? ¿solo los
  nombres de los objetivos y su estado?),
- si va identificado o seudonimizado,
- qué proveedor y bajo qué acuerdo de tratamiento de datos,
- qué se registra de cada consulta para poder auditarla después.

Panamá tiene ley de protección de datos personales (Ley 81 de 2019) y los datos
de salud son categoría sensible. No soy abogado y tú tampoco: lo que te pido es
que la decisión esté escrita y sea de la directora, no un efecto colateral de
una llamada a una API.

### Good Inside es contenido de pago y con derechos

Es una suscripción. Raspar su material, traducirlo y publicarlo —aunque sea
dentro de una app privada del centro— es redistribuir obra ajena. "Es para uso
interno" no lo arregla, y "lo reescribe una IA" tampoco.

Caminos que sí funcionan, en orden de preferencia:

1. Licenciarlo. Hablar con ellos. Puede que exista una vía para centros.
2. Usarlo solo como lectura del profesional: la agente resume para Sarita, que
   escribe su propio material. Nada de Good Inside sale hacia las familias.
3. Cambiar la fuente por material de Conscious Discipline con licencia abierta,
   o por fuentes académicas citables.

Dime cuál antes de construirlo. Si la respuesta es la 1, el proyecto espera a
esa conversación; construye las otras cuatro cosas mientras tanto.

### La capa de agentes no puede saltarse RLS

Todo el control de acceso del sistema vive en políticas de Postgres. Un agente
con `service_role` las esquiva todas. Si lo usas por comodidad, el día que un
agente tenga un fallo de lógica va a leer o escribir expedientes que no le
tocan, y no habrá nada que lo frene.

Haz que cada agente actúe con una identidad propia y permisos propios, y que se
le apliquen las mismas políticas que a una persona.

## Cómo quiero que trabajes

Esto no es una app nueva en una pizarra en blanco: se enchufa a un sistema del
que depende el trabajo diario de once personas.

- **Mide antes de diseñar.** Los datos reales están ahí. Cuántas sesiones se
  registran tarde y cuánto, quién, en qué días. Si construyes el agente de
  recordatorios sin mirar eso, vas a resolver un problema que no existe.
- **Falla ruidosamente.** El sistema al que te enchufas tuvo tres fallos
  silenciosos graves: minutas que nunca se guardaban, objetivos que se pisaban
  entre sí, y un aviso que decía "el navegador bloqueó la ventana" cuando nadie
  había bloqueado nada. Un agente que falla callado es peor: nadie lo mira.
- **Un agente que molesta se apaga.** Tres mensajes de WhatsApp mal calibrados y
  las terapeutas silencian el número. La métrica no es cuántos avisos mandas,
  es cuántos registros entran.
- **Escribe el porqué, no el qué.** En el repo existente los comentarios
  explican la decisión y el fallo que la motivó, en español. Mantén esa
  costumbre.
- **Pruebas de lo que puede romper callado.** Lo demás es opcional.

Empieza por preguntarme lo que te falte y por proponerme un orden de entrega.
No escribas código hasta que estemos de acuerdo en los cuatro problemas de
arriba.
