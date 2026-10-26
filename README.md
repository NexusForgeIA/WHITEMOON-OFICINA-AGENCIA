# WHITEMOON · Oficina de agentes

Panel público (GitHub Pages) con la agencia de IA de WhiteMoon: directora de oficina (Luna) y once especialistas (cinco de ventas, cada una con su grupo de sectores). HTML/CSS/JS vanilla, sin build.

- **Oficina / Equipo / Tablón:** simulación con tareas de ejemplo (rotulada como tal). Cada ficha indica qué es real hoy.
- **Ventas · Scout:** lee `leads_web` de Supabase con login real (Supabase Auth, RLS `authenticated`). Sin sesión no hay datos. La sesión vive en `sessionStorage`. Scout CRM completo sigue en su repo.
- **Sala de demos:** lee en directo los repos públicos de la organización (API de GitHub, sin token). Públicas solo las demos sectoriales de una lista blanca; clientes, prospectos y el resto, solo con sesión. Vista previa, copiar enlace y «usar en borradores» (alimenta a Sol). `WHITEMOON-360-DEMO` se oculta: producto retirado.
- **Oficina:** plano por departamentos (Dirección, Ventas, Marketing y SEO, Clientes, Finanzas, Seguridad, salas de demos, datos, reuniones y aprobaciones). Pulsa un agente para ver su tarea actual, cola e historial.
- **Oficina 3D (`office3d.js`):** vista isométrica con Three.js 0.160 (CDN jsDelivr, sin build) sincronizada con la simulación de `office.js` (`window.WMO`): agentes que caminan, trabajan y consultan, salas con decorado animado y paquetes de datos de Luna a quien trabaja. Selector 3D / Plano (se recuerda en este navegador); arrastrar gira, Ctrl + rueda acerca, doble clic recoloca, clic en un agente lo selecciona. Sin WebGL se queda el plano; con `prefers-reduced-motion` se para el movimiento decorativo.
- **Herramientas:** borradores de venta, guion de vídeo, demos y checklist de seguridad. Solo borradores; el envío lo haces tú.

Prueba local: `python3 -m http.server` en esta carpeta.
No hay claves secretas en el cliente (solo la publishable de Supabase).

## Supabase (proyecto compartido, tablas con prefijo `oficina_*`)
- `oficina_staff` (quién puede usar la oficina), `oficina_briefs`, `oficina_tareas`. RLS: solo usuarios de `oficina_staff` (comprobado con SQL: anon y otros usuarios autenticados, bloqueados).
- Con sesión iniciada en Ventas, los briefs a Luna y sus tareas se guardan, y las aprobaciones/descartes también. Sin sesión, todo es simulación local.
- Los resultados de las tareas siguen sin generarse con IA: es el siguiente paso (Edge Function con Claude Haiku, clave en Supabase Secrets).

## Roles, Decisiones y Radar
- **Quién decide qué:** cada ficha de agente muestra lo que hace solo, lo que consulta con Luna y lo que decide Cris.
- **Consultas a Dirección (simuladas):** los agentes van al despacho de Luna; ella resuelve lo que cae en las reglas y escala el resto. Lo escalado en la simulación aparece en Decisiones como *ejemplo* y no se guarda.
- **Decisiones (`decisions.js`):** bandeja de lo que decides tú (tabla `oficina_decisiones`, solo staff). Aprobar/Descartar/Posponer, nota opcional.
- **Radar (`radar.js`):** con sesión de staff, Sol lee `prospectos_radar` (analizados, por dolor), elige la demo del sector y el producto, y deja un borrador en Decisiones. Máximo 5 pendientes; no envía nada, el envío lo haces tú (copiar o enlace de WhatsApp). Las señales del Radar son automáticas: verifica en su web antes de enviar.

## Envío de correos
Los correos preparados por Sol terminan en «Un saludo,» sin firma. La firma no se pone sola: al abrir cada correo hay que pulsarla en el menú Firmas del correo. Regla de Cris: nunca se envía un correo sin su firma; si no se puede añadir, no se envía.

## Equipo de ventas (5 agentes) y cobertura de España
- **Cinco agentes, cinco grupos de sectores sin solapes** (`cobertura.js`): Sol (belleza y bienestar), Nova (salud), Aura (motor y transporte), Lira (hogar y obras) y Rigel (servicios y hostelería). Todos prospectan las mismas ciudades (77, lista editable en `CIUDADES`).
- **Radar:** cada prospecto va al agente de su sector (`WM_SALES.agentFor`); sector desconocido, a Sol. Los leads entrantes de los chatbots siguen siendo de Sol.
- **Prospectar:** en el Radar, cada agente tiene su botón «Prospectar» = una búsqueda (sector × ciudad, hasta 20 negocios) con `radar-places` + `radar-worker` (`encolar`). Cuesta una consulta de Google Places por pulsación, por eso no hay modo automático. «Analizar webs pendientes» lanza `procesar` (2 por pulsación).
- **Cobertura:** tabla `oficina_cobertura` (RLS solo staff, única por sector+ciudad, guarda también las búsquedas sin resultados) más lo que ya hay en `prospectos_radar`.
- Migración: `agente` de `oficina_tareas` y `oficina_decisiones` admite `nova`, `aura`, `lira`, `rigel`.
- Nada se envía: los borradores siguen pasando por Decisiones y los envías tú.
- **Piloto automático:** casilla en el panel de cobertura. Mientras la oficina esté abierta con sesión de staff, cada 3 min un agente (por turnos) hace una búsqueda y se analizan 2 webs pendientes, hasta un tope diario de búsquedas (por defecto 20; guardado en este navegador). Si una búsqueda falla se pausa solo. Los resultados del día salen en el mismo panel y las posibles ventas llegan a Decisiones. Es cliente: con la pestaña cerrada no corre; una versión en servidor (pg_cron + Edge Function) queda como paso siguiente.
- El triaje del Radar ya no se detiene si un prospecto falla: lo anota con su nombre y sigue (3 fallos seguidos lo paran).

- **Constructor de webs** (Herramientas): formulario + reseñas de Google + logo/fotos → vista previa en vivo y enlace público `web.html?s=…` (noindex, con aviso «propuesta de diseño»). Datos en `oficina_webs`, imágenes en el bucket `oficina-webs`.
