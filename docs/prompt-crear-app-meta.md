# Prompt para crear la app de AIRA en Meta

Para pegarlo en Claude con control del navegador. Él va clicando en
`developers.facebook.com`; tú apruebas lo que te pida.

---

Vas a crear y configurar una app de WhatsApp Business en el panel de
desarrolladores de Meta, clicando tú en el navegador. Es para **AIRA Learning
Hub**, un centro de terapias infantiles en Ciudad de Panamá.

Hoy no existe ninguna app para esto. En la cuenta hay dos apps de otros
proyectos (**Atendara** y **Vianova Conector**) — **no las toques**, ni sus
números ni sus plantillas.

## Para qué sirve

Para avisar por WhatsApp a las terapeutas del centro cuando no han registrado
el reporte de una sesión que ya dieron. Son once personas, no clientes: los
mensajes van al equipo interno, nunca a las familias de los pacientes.

Más adelante una aplicación llamará a esta API por su cuenta. Tu trabajo ahora
es dejar la app creada, configurada y con las plantillas enviadas a aprobación,
y entregarme las credenciales al final.

## Qué tienes que hacer

Ve paso a paso y enséñame cada pantalla antes de confirmar algo que cueste
dinero, verifique un negocio o publique la app.

1. **Crear la app.** Tipo *Business*. Nómbrala `AIRA Learning Hub`. Dime a qué
   Business Manager la vas a asociar antes de hacerlo — hay varios en la cuenta
   y elegir mal obliga a rehacerlo.

2. **Añadir el producto WhatsApp** y entrar en su configuración.

3. **El número de teléfono.** Aquí para y pregúntame. Hay dos caminos y la
   diferencia importa:
   - el número de pruebas que regala Meta, que solo escribe a cinco
     destinatarios dados de alta a mano;
   - un número propio del centro, que hay que verificar y que **no puede estar
     activo en la app normal de WhatsApp**.

   Dime qué implica cada uno en mi caso y espera mi respuesta. No verifiques
   ningún número sin que yo lo confirme.

4. **Las tres plantillas de mensaje.** Son el centro del trabajo. Fuera de las
   24 horas siguientes al último mensaje de la persona, WhatsApp **solo** deja
   enviar plantillas aprobadas por Meta, así que sin esto la app no sirve para
   nada.

   Créalas con categoría **Utility**, no Marketing. Marketing se aprueba peor,
   se puede bloquear por límites de frecuencia, y esto no es publicidad: es un
   recordatorio operativo a una empleada.

   Idioma: **español**. Nombres sugeridos y contenido, en orden de insistencia:

   - `recordatorio_sesion_1` — suave, el mismo día.
     > Hola {{1}}, queda pendiente el registro de tu sesión del {{2}}. Puedes
     > completarlo en AIRA Learning Hub cuando puedas.

   - `recordatorio_sesion_2` — a los dos días.
     > Hola {{1}}, te recordamos que la sesión del {{2}} sigue sin registrar.
     > El expediente del paciente queda incompleto hasta que se cargue.

   - `recordatorio_sesion_3` — última, con dirección en copia.
     > Hola {{1}}, la sesión del {{2}} lleva varios días sin registrar y
     > dirección ya está al tanto. Si hubo algún problema, respóndenos por aquí.

   Ajusta la redacción si Meta rechaza algo, y dime qué cambiaste y por qué.

   **Antes de crearlas, plantéame esto:** las variables que propongo son el
   nombre de la terapeuta y la fecha. Deliberadamente **no** va el nombre del
   niño: es un dato clínico de un menor viajando por WhatsApp, y la fecha basta
   para identificar la sesión. Si crees que no basta, dímelo y lo decido yo —
   no lo añadas por tu cuenta.

5. **El webhook.** Déjalo configurado para recibir las respuestas de las
   terapeutas (campo `messages`). Si todavía no hay servidor donde apuntarlo,
   dímelo y lo dejamos para después, pero avísame explícitamente de que queda
   pendiente en vez de inventarte una URL.

6. **Permisos.** Comprueba qué hace falta para enviar mensajes
   (`whatsapp_business_messaging`, `whatsapp_business_management`) y dime cuáles
   necesitan revisión de app y cuáles no.

## Qué me tienes que entregar al final

Escríbemelo junto, en un bloque, para poder copiarlo:

- App ID y App Secret
- WhatsApp Business Account ID (WABA ID)
- Phone Number ID y el número asociado
- El token de acceso, y **de qué tipo es**: si es temporal, dime cuándo caduca
  y cómo se saca uno permanente
- El estado de cada plantilla: aprobada, en revisión o rechazada
- Qué quedó pendiente

## Cómo quiero que trabajes

- **Pregunta antes de lo irreversible.** Verificar un negocio, verificar un
  número, publicar la app, o cualquier cosa que cobre. Nada de eso lo decides
  tú.
- **Enséñame lo que vas a enviar.** Sobre todo las plantillas: una vez enviadas
  a revisión, corregirlas cuesta días de espera.
- **No toques Atendara ni Vianova Conector.** Son de otros proyectos en
  producción.
- **Si una pantalla no es lo que esperabas, para y enséñamela.** Meta cambia
  este panel a menudo; prefiero una pregunta a que adivines dónde hacer clic.
- **No me pidas que te dicte tokens ni contraseñas por chat.** Si algo necesita
  credenciales que no están ya en el navegador, dímelo y lo pongo yo.

Empieza enseñándome la pantalla de crear app y diciéndome a qué Business
Manager piensas asociarla.
