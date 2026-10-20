# WHITEMOON · Oficina de agentes

Panel público (GitHub Pages) con la agencia de IA de WhiteMoon: directora de oficina (Luna) y siete especialistas. HTML/CSS/JS vanilla, sin build.

- **Oficina / Equipo / Tablón:** simulación con tareas de ejemplo (rotulada como tal). Cada ficha indica qué es real hoy.
- **Ventas · Scout:** lee `leads_web` de Supabase con login real (Supabase Auth, RLS `authenticated`). Sin sesión no hay datos. La sesión vive en `sessionStorage`. Scout CRM completo sigue en su repo.
- **Sala de demos:** lee en directo los repos públicos de la organización (API de GitHub, sin token). Públicas solo las demos sectoriales de una lista blanca; clientes, prospectos y el resto, solo con sesión. Vista previa, copiar enlace y «usar en borradores» (alimenta a Sol). `WHITEMOON-360-DEMO` se oculta: producto retirado.
- **Oficina:** plano por departamentos (Dirección, Ventas, Marketing y SEO, Clientes, Finanzas, Seguridad, salas de demos, datos, reuniones y aprobaciones). Pulsa un agente para ver su tarea actual, cola e historial.
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
