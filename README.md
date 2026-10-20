# WHITEMOON · Oficina de agentes

Panel público (GitHub Pages) con la agencia de IA de WhiteMoon: directora de oficina (Luna) y siete especialistas. HTML/CSS/JS vanilla, sin build.

- **Oficina / Equipo / Tablón:** simulación con tareas de ejemplo (rotulada como tal). Cada ficha indica qué es real hoy.
- **Ventas · Scout:** lee `leads_web` de Supabase con login real (Supabase Auth, RLS `authenticated`). Sin sesión no hay datos. La sesión vive en `sessionStorage`. Scout CRM completo sigue en su repo.
- **Sala de demos:** lee en directo los repos públicos de la organización (API de GitHub, sin token). Públicas solo las demos sectoriales de una lista blanca; clientes, prospectos y el resto, solo con sesión. Vista previa, copiar enlace y «usar en borradores» (alimenta a Sol). `WHITEMOON-360-DEMO` se oculta: producto retirado.
- **Oficina:** plano por departamentos (Dirección, Ventas, Marketing y SEO, Clientes, Finanzas, Seguridad, salas de demos, datos, reuniones y aprobaciones). Pulsa un agente para ver su tarea actual, cola e historial.
- **Herramientas:** borradores de venta, guion de vídeo, demos y checklist de seguridad. Solo borradores; el envío lo haces tú.

Prueba local: `python3 -m http.server` en esta carpeta.
No hay claves secretas en el cliente (solo la publishable de Supabase).
