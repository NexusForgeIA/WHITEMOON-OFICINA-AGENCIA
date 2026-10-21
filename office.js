(function(){
'use strict';
var NS='http://www.w3.org/2000/svg';
function $(i){return document.getElementById(i)}
function el(tag,attrs,parent,text){
 var n=document.createElementNS(NS,tag);
 for(var k in attrs){n.setAttribute(k,attrs[k])}
 if(text!=null)n.textContent=text;
 if(parent)parent.appendChild(n);return n;
}
function h(tag,cls,text,parent){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;if(parent)parent.appendChild(n);return n}
var REDUCED=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- AGENTES ---------- */
var AGENTS=[
{id:'luna',name:'Luna',role:'Directora de oficina',c:'#f5c842',g:'L',x:500,y:112,
 mission:'Recibe tu brief, lo divide en tareas, las asigna al especialista adecuado, vigila los límites y te pide aprobación antes de que nada salga de la oficina.',
 does:['Convierte un objetivo en tareas concretas','Reparte el trabajo y evita duplicados','Resume la jornada y avisa de bloqueos','Manda a tu bandeja todo lo que requiere decisión'],
 doesnt:['No envía nada sin tu aprobación','No gasta dinero ni contrata servicios','No decide precios ni condiciones comerciales'],
 inputs:['Tu brief en lenguaje natural','Estado de la cola de cada agente'],outputs:['Plan de tareas','Resumen diario','Peticiones de revisión'],
 tools:['Claude Haiku (previsto)','Supabase: tabla de tareas (prevista)'],
 real:['Reparto por palabras clave en esta maqueta'],
 next:'Edge Function de director con Claude Haiku que devuelva el plan en JSON, y tabla de tareas con RLS solo para usuarios autenticados.',
 work:[['Asignando tareas del día','Reparto listo',false],['Revisando la cola de aprobaciones','Cola revisada',false],['Preparando el resumen de la jornada','Resumen preparado',false]]},
{id:'sol',name:'Sol',role:'Ventas: belleza',c:'#00d4aa',g:'S',x:150,y:330,sales:true,
 mission:'Prospecta peluquerías, barberías, centros de estética y uñas en las ciudades de España, prepara el primer contacto con la demo del sector y lo deja en cola para que lo envíes tú.',
 does:['Elige producto según el sector y si el negocio ya tiene web','Redacta el borrador con la demo adecuada','Incluye siempre una forma clara de darse de baja','Ordena la cola de contactos pendientes'],
 doesnt:['No envía correos por su cuenta','No promete resultados ni usa cifras inventadas','No menciona precios ni productos retirados'],
 inputs:['Leads (previsto: tabla leads_web)','Demos por sector'],outputs:['Borradores de correo','Cola de seguimiento'],
 tools:['Claude Haiku (previsto)','Supabase leads_web (previsto)'],
 real:['Generador de borradores por plantilla: funciona en la pestaña Herramientas'],
 next:'Leer leads_web con RLS, redactar con Haiku y guardar el borrador; el envío queda siempre en manos de una persona.',
 work:[['Redactando borrador para una peluquería','Borrador listo para tu aprobación',true],['Eligiendo la demo para un taller','Demo elegida',false],['Ordenando contactos pendientes','Contactos ordenados',false],['Redactando borrador para un restaurante','Borrador listo para tu aprobación',true]]},
{id:'nova',name:'Nova',role:'Ventas: salud',c:'#34d399',g:'N',x:150,y:330,sales:true,
 mission:'Prospecta clínicas dentales, fisioterapia, podología y veterinarias en las ciudades de España y prepara el primer contacto con la demo de su sector para que lo envíes tú.',
 does:['Busca clínicas dentales, fisioterapia, podología y veterinarias en las ciudades de España que le tocan','Elige producto según el sector y si el negocio ya tiene web','Redacta el borrador con la demo adecuada','Incluye siempre una forma clara de darse de baja'],
 doesnt:['No envía correos ni mensajes por su cuenta','No promete resultados ni usa cifras inventadas','No menciona precios ni productos retirados','No prospecta sectores de sus compañeros de ventas'],
 inputs:['Radar de prospectos (Supabase)','Demos por sector'],outputs:['Borradores de contacto','Búsquedas nuevas por ciudad'],
 tools:['Google Places (vía radar-places)','Supabase prospectos_radar y oficina_cobertura'],
 real:['Con sesión de staff: cada pulsación de «Prospectar» busca su siguiente ciudad, guarda los negocios en el Radar y deja el resto a la cola de Decisiones'],
 next:'Prospección programada por ciudad (sin que nadie pulse) cuando se decida un tope de búsquedas al mes.',
 work:[
  ['Buscando clínicas dentales en una ciudad nueva','Búsqueda terminada',false],
  ['Redactando borrador para una clínica de fisioterapia','Borrador listo para tu aprobación',true],
  ['Eligiendo la demo para una veterinaria','Demo elegida',false]]},
{id:'aura',name:'Aura',role:'Ventas: motor',c:'#5eead4',g:'A',x:150,y:330,sales:true,
 mission:'Prospecta talleres de coches, mudanzas y autoescuelas en las ciudades de España y prepara el primer contacto con la demo de su sector para que lo envíes tú.',
 does:['Busca talleres de coches, mudanzas y autoescuelas en las ciudades de España que le tocan','Elige producto según el sector y si el negocio ya tiene web','Redacta el borrador con la demo adecuada','Incluye siempre una forma clara de darse de baja'],
 doesnt:['No envía correos ni mensajes por su cuenta','No promete resultados ni usa cifras inventadas','No menciona precios ni productos retirados','No prospecta sectores de sus compañeros de ventas'],
 inputs:['Radar de prospectos (Supabase)','Demos por sector'],outputs:['Borradores de contacto','Búsquedas nuevas por ciudad'],
 tools:['Google Places (vía radar-places)','Supabase prospectos_radar y oficina_cobertura'],
 real:['Con sesión de staff: cada pulsación de «Prospectar» busca su siguiente ciudad, guarda los negocios en el Radar y deja el resto a la cola de Decisiones'],
 next:'Prospección programada por ciudad (sin que nadie pulse) cuando se decida un tope de búsquedas al mes.',
 work:[
  ['Buscando talleres en una ciudad nueva','Búsqueda terminada',false],
  ['Redactando borrador para un taller','Borrador listo para tu aprobación',true],
  ['Ordenando contactos de mudanzas','Contactos ordenados',false]]},
{id:'lira',name:'Lira',role:'Ventas: hogar y obras',c:'#22c1c3',g:'L',x:150,y:330,sales:true,
 mission:'Prospecta electricistas, fontaneros, reformas y cerrajeros en las ciudades de España y prepara el primer contacto con la demo de su sector para que lo envíes tú.',
 does:['Busca electricistas, fontaneros, reformas y cerrajeros en las ciudades de España que le tocan','Elige producto según el sector y si el negocio ya tiene web','Redacta el borrador con la demo adecuada','Incluye siempre una forma clara de darse de baja'],
 doesnt:['No envía correos ni mensajes por su cuenta','No promete resultados ni usa cifras inventadas','No menciona precios ni productos retirados','No prospecta sectores de sus compañeros de ventas'],
 inputs:['Radar de prospectos (Supabase)','Demos por sector'],outputs:['Borradores de contacto','Búsquedas nuevas por ciudad'],
 tools:['Google Places (vía radar-places)','Supabase prospectos_radar y oficina_cobertura'],
 real:['Con sesión de staff: cada pulsación de «Prospectar» busca su siguiente ciudad, guarda los negocios en el Radar y deja el resto a la cola de Decisiones'],
 next:'Prospección programada por ciudad (sin que nadie pulse) cuando se decida un tope de búsquedas al mes.',
 work:[
  ['Buscando electricistas en una ciudad nueva','Búsqueda terminada',false],
  ['Redactando borrador para una empresa de reformas','Borrador listo para tu aprobación',true],
  ['Eligiendo la demo para un fontanero','Demo elegida',false]]},
{id:'rigel',name:'Rigel',role:'Ventas: servicios',c:'#7ee0a8',g:'R',x:150,y:330,sales:true,
 mission:'Prospecta despachos de abogados, gestorías, inmobiliarias y restaurantes en las ciudades de España y prepara el primer contacto con la demo de su sector para que lo envíes tú.',
 does:['Busca abogados, gestorías, inmobiliarias y restaurantes en las ciudades de España que le tocan','Elige producto según el sector y si el negocio ya tiene web','Redacta el borrador con la demo adecuada','Incluye siempre una forma clara de darse de baja'],
 doesnt:['No envía correos ni mensajes por su cuenta','No promete resultados ni usa cifras inventadas','No menciona precios ni productos retirados','No prospecta sectores de sus compañeros de ventas'],
 inputs:['Radar de prospectos (Supabase)','Demos por sector'],outputs:['Borradores de contacto','Búsquedas nuevas por ciudad'],
 tools:['Google Places (vía radar-places)','Supabase prospectos_radar y oficina_cobertura'],
 real:['Con sesión de staff: cada pulsación de «Prospectar» busca su siguiente ciudad, guarda los negocios en el Radar y deja el resto a la cola de Decisiones'],
 next:'Prospección programada por ciudad (sin que nadie pulse) cuando se decida un tope de búsquedas al mes.',
 work:[
  ['Buscando abogados en una ciudad nueva','Búsqueda terminada',false],
  ['Redactando borrador para una gestoría','Borrador listo para tu aprobación',true],
  ['Eligiendo la demo para un restaurante','Demo elegida',false]]},
{id:'vega',name:'Vega',role:'Marketing y contenido',c:'#9d70ff',g:'V',x:390,y:330,
 mission:'Convierte las demos en contenido: ideas, títulos con palabra clave y guiones para el canal y las redes.',
 does:['Propone ideas y títulos pensando en lo que busca el dueño del negocio','Escribe el esqueleto del guion con aviso de IA','Revisa subtítulos y descripciones'],
 doesnt:['No inventa casos, testimonios ni resultados','No publica por su cuenta','No usa búsquedas que prometan algo que el producto no hace'],
 inputs:['Demos grabadas','Datos de palabras clave (vidIQ)'],outputs:['Esqueletos de guion','Títulos y descripciones'],
 tools:['vidIQ (consulta)','Claude Haiku (previsto)'],
 real:['Generador de esqueleto de guion por plantilla en Herramientas'],
 next:'Conectar la investigación de palabras clave y generar el guion completo con Haiku, siempre con revisión humana.',
 work:[['Esbozando un guion de demo para restaurantes','Guion listo para tu revisión',true],['Preparando títulos con palabra clave','Títulos preparados',false],['Revisando subtítulos de un vídeo','Subtítulos revisados',false]]},
{id:'atlas',name:'Atlas',role:'SEO y GEO',c:'#4da3ff',g:'A',x:630,y:330,
 mission:'Cuida que las webs se encuentren en Google y en los asistentes de IA: metas, datos estructurados y ficheros para IA.',
 does:['Revisa títulos, descripciones y canonical','Comprueba el schema (FAQ, breadcrumbs, LocalBusiness)','Mantiene llms.txt y robots al día','Propone cambios como un PR pequeño'],
 doesnt:['No despliega nada por su cuenta','No promete posiciones ni "ser el número 1"','No toca clientes sin que lo apruebes'],
 inputs:['Código de las webs','Resultados de comprobaciones'],outputs:['Lista de mejoras','Propuestas de cambio'],
 tools:['SEO Guardian (existente)','GitHub (previsto)'],
 real:['Nada conectado aún en esta maqueta'],
 next:'Ejecutar el Guardian sobre un repo y abrir un PR por cada mejora, uno por tema.',
 work:[['Revisando meta descriptions de una demo','Metas revisadas',false],['Comprobando el schema de preguntas frecuentes','Schema comprobado',false],['Actualizando llms.txt','llms.txt al día',false]]},
{id:'eco',name:'Eco',role:'Atención al cliente',c:'#ff7ab6',g:'E',x:850,y:330,
 mission:'Atiende las consultas que llegan a los chatbots de las webs, recoge nombre y teléfono y avisa de cada lead.',
 does:['Responde en pocas frases y una pregunta cada vez','Se identifica siempre como asistente de IA','Recoge nombre y teléfono para pasar el lead a una persona'],
 doesnt:['No inventa datos fiscales, legales ni horarios','No promete lo que el producto no hace','No da honorarios ni precios cerrados'],
 inputs:['Conversaciones del chatbot','Datos del negocio del cliente'],outputs:['Leads con sector y mensaje','Avisos por Telegram'],
 tools:['Chatbots del CDN (existentes)','Supabase leads_web'],
 real:['Los chatbots ya existen fuera de este panel; aquí aún no se ven sus conversaciones'],
 next:'Mostrar en el panel las conversaciones y leads que ya guardan los chatbots, solo para usuarios autenticados.',
 work:[['Respondiendo una consulta de ejemplo','Consulta respondida',false],['Recogiendo nombre y teléfono de un lead de prueba','Lead de prueba recogido',false],['Derivando una consulta a una persona','Consulta derivada',false]]},
{id:'alba',name:'Alba',role:'Alta de clientes',c:'#ffa94d',g:'B',x:270,y:515,
 mission:'Sigue el procedimiento de alta de un cliente nuevo: que el chatbot quede bien configurado y comprobado antes de activarlo.',
 does:['Prepara la ficha del cliente con estado «pendiente»','Marca lo que falta por completar en el prompt','Pide un lead de prueba y comprueba el aviso','Recuerda la checklist legal de entrega'],
 doesnt:['No activa el chatbot de un cliente sin tu confirmación','No cambia el dominio del cliente sin avisar','No toca datos de otros clientes'],
 inputs:['Datos del cliente','Plantilla del sector'],outputs:['Ficha lista para activar','Informe de entrega'],
 tools:['Panel del CDN (existente)','Supabase onboarding_clientes'],
 real:['Nada conectado aún en esta maqueta'],
 next:'Guiar el alta paso a paso leyendo y escribiendo la ficha del cliente con permisos de usuario autenticado.',
 work:[['Preparando la ficha de un cliente nuevo','Ficha preparada',false],['Buscando campos pendientes de completar','Campos revisados',false],['Probando un lead de prueba','Lead de prueba verificado',false]]},
{id:'abaco',name:'Ábaco',role:'Contabilidad',c:'#8be9fd',g:'Á',x:500,y:515,
 mission:'Ordena y resume movimientos para que tu gestor trabaje más rápido. No da consejo fiscal.',
 does:['Ordena movimientos y detecta duplicados','Prepara un resumen mensual para el gestor','Señala lo que falta justificar'],
 doesnt:['No calcula impuestos ni presenta nada','No da consejo fiscal ni legal','No ve datos que no le des'],
 inputs:['Un export de facturas o gastos (por definir)'],outputs:['Resumen mensual','Lista de pendientes'],
 tools:['Hoja de cálculo o export (por definir)'],
 real:['Sin datos conectados'],
 next:'Definir de dónde salen los datos y quién puede verlos antes de construir nada.',
 work:[['Ordenando movimientos de una muestra','Muestra ordenada',false],['Buscando duplicados en un export de ejemplo','Duplicados revisados',false]]},
{id:'egida',name:'Égida',role:'Ciberseguridad',c:'#ff6b6b',g:'É',x:730,y:515,
 mission:'Revisa de forma defensiva los sistemas propios de WhiteMoon y te avisa de lo que haya que corregir.',
 does:['Revisa RLS y vistas con security_invoker','Busca claves expuestas en el código del cliente','Controla caducidad de certificados y dominios','Recuerda la verificación en dos pasos'],
 doesnt:['Nada ofensivo ni contra sistemas ajenos','No cambia configuraciones sin tu aprobación','No guarda ni pide contraseñas'],
 inputs:['Avisos de Supabase','Código de los repos'],outputs:['Informe de hallazgos','Lista de correcciones'],
 tools:['Supabase advisors (previsto)'],
 real:['Checklist manual funcionando en Herramientas'],
 next:'Leer los avisos de seguridad de Supabase y abrir una tarea por cada hallazgo, con prioridad.',
 work:[['Revisando la lista de RLS','RLS revisado',false],['Comprobando caducidad de certificados','Certificados al día',false],['Buscando claves en el código del cliente','Sin claves a la vista',false]]}
];
var BY={};AGENTS.forEach(function(a){BY[a.id]=a});

/* ---------- ESTADO ---------- */
var state={real:false,lastRes:{},urlLast:{},vegaN:0,consultas:0,speed:1,done:0,approved:0,tasks:[],feed:[],nextId:1,tick:0,sel:'luna'};
AGENTS.forEach(function(a){a.st='idle';a.t=0;a.q=[];a.task=null;a.away=0;a.hist=[];a.t0=1;a.at=''});

/* ---------- NAV ---------- */
var TITLES={oficina:'Oficina',equipo:'Equipo',decisiones:'Decisiones',todo:'Todo lo que hace la oficina',radar:'Radar de prospectos',demos:'Sala de demos',ventas:'Ventas · Scout',tablon:'Tablón de tareas',herramientas:'Herramientas'};
function route(){
 var v=(location.hash||'#oficina').slice(1);if(!TITLES[v])v='oficina';
 document.querySelectorAll('.view').forEach(function(s){s.hidden=s.id!==v});
 document.querySelectorAll('#nav a').forEach(function(a){a.classList.toggle('on',a.dataset.view===v)});
 $('title').textContent=TITLES[v];document.title=TITLES[v]+' · Oficina WhiteMoon';
}
window.addEventListener('hashchange',route);route();
document.querySelectorAll('.speed button').forEach(function(b){
 b.addEventListener('click',function(){
  state.speed=+b.dataset.sp;
  document.querySelectorAll('.speed button').forEach(function(x){x.classList.toggle('on',x===b)});
 });
});

/* ---------- MAPA ---------- */
var svg=$('map'),gCg={},gAv={},gDesk={},gBub={},gDot={};
/* ---------- PERSONAJES v2 (SVG propio, originales) ---------- */
var AV={};
var LOOKS={
 luna:{skin:'#f3cdb0',hair:'#2b1646',eye:'#6b3fd6',style:'long',x:['lapel','brows','lash']},
 sol:{skin:'#9a6240',hair:'#15100d',eye:'#3a2414',style:'curly',x:['tie','brows']},
 vega:{skin:'#e8b690',hair:'#b24a1e',eye:'#2f7d5b',style:'bun',x:['glasses','phones','pocket','brows','lash']},
 atlas:{skin:'#c98d66',hair:'#1a1a1f',eye:'#2a2a2a',style:'short',x:['glassesSq','beard','lanyard','brows']},
 eco:{skin:'#f6d8bd',hair:'#4a2d1d',eye:'#2d6fb3',style:'ponytail',x:['headset','polo','brows','lash']},
 alba:{skin:'#e8b690',hair:'#e0a93f',eye:'#8a5a2b',style:'bob',x:['buttons','brows','lash']},
 abaco:{skin:'#f3cdb0',hair:'#c9c9d6',eye:'#4a5a7a',style:'bald',x:['glasses','tie','brows']},
 egida:{skin:'#c98d66',hair:'#101015',eye:'#111',style:'hood',x:['shades','shield']},
 nova:{skin:'#f0c4a0',hair:'#6b3a1d',eye:'#2a5a8a',style:'short',x:['tie','brows']},
 aura:{skin:'#b9805a',hair:'#1d1d2a',eye:'#3a2414',style:'ponytail',x:['pocket','brows','lash']},
 lira:{skin:'#f1cfb2',hair:'#8a4a1c',eye:'#4a6b3a',style:'curly',x:['glassesSq','tie','brows']},
 rigel:{skin:'#e3b08a',hair:'#8c8c96',eye:'#2d4f7a',style:'short',x:['glasses','tie','brows']}
};
function shade(hex,k){var n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;function f(v){return Math.max(0,Math.min(255,Math.round(v*k)))}return '#'+((1<<24)+(f(r)<<16)+(f(g)<<8)+f(b)).toString(16).slice(1)}
function lite(hex,k){var n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;function f(v){return Math.max(0,Math.min(255,Math.round(v+(255-v)*k)))}return '#'+((1<<24)+(f(r)<<16)+(f(g)<<8)+f(b)).toString(16).slice(1)}
function buildDefs(){
 if(document.getElementById('wm-defs'))return;
 var s=document.createElementNS(NS,'svg');s.setAttribute('id','wm-defs');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
 var d=el('defs',{},s);
 AGENTS.forEach(function(a){
  var L=LOOKS[a.id];
  var sk=el('radialGradient',{id:'sk-'+a.id,cx:'.38',cy:'.32',r:'.85'},d);el('stop',{offset:0,'stop-color':lite(L.skin,.28)},sk);el('stop',{offset:.55,'stop-color':L.skin},sk);el('stop',{offset:1,'stop-color':shade(L.skin,.78)},sk);
  var hr=el('linearGradient',{id:'hr-'+a.id,x1:0,y1:0,x2:0,y2:1},d);el('stop',{offset:0,'stop-color':lite(L.hair,.22)},hr);el('stop',{offset:.5,'stop-color':L.hair},hr);el('stop',{offset:1,'stop-color':shade(L.hair,.6)},hr);
  var ot=el('linearGradient',{id:'ot-'+a.id,x1:0,y1:0,x2:1,y2:1},d);el('stop',{offset:0,'stop-color':lite(a.c,.25)},ot);el('stop',{offset:.5,'stop-color':a.c},ot);el('stop',{offset:1,'stop-color':shade(a.c,.55)},ot);
 });
 document.body.appendChild(s);
}
function buildChar(a,p,full){
 var L=LOOKS[a.id],c=a.c,dark=shade(c,.6),id=a.id,has=function(x){return L.x.indexOf(x)>=0};
 var SK='url(#sk-'+id+')',HR='url(#hr-'+id+')',OT='url(#ot-'+id+')',lin=shade(L.skin,.6);
 var root=el('g',{class:'char'},p);
 if(full)el('ellipse',{cx:0,cy:30,rx:19,ry:5,class:'shadow'},root);
 if(full){
  var legs=el('g',{class:'legs'},root);
  var l1=el('g',{class:'leg legL'},legs),l2=el('g',{class:'leg legR'},legs);
  [[l1,-10],[l2,2]].forEach(function(q){el('rect',{x:q[1],y:4,width:8,height:21,rx:4,fill:'#20203a'},q[0]);el('path',{d:'M'+(q[1]-1.5)+',24 h11 q1,5 -2,6 h-9 q-2,-1 0,-6z',fill:'#f4f4fa'},q[0]);el('rect',{x:q[1]-1.5,y:28,width:11,height:2,rx:1,fill:c},q[0])});
 }
 // pelo trasero
 if(L.style==='long')el('path',{d:'M-20,-50 Q-22,-70 0,-70 Q22,-70 20,-50 L22,-14 Q22,-6 14,-8 L-14,-8 Q-22,-6 -22,-14 Z',fill:HR},root);
 if(L.style==='bob')el('path',{d:'M-20,-50 Q-22,-70 0,-70 Q22,-70 20,-50 L21,-30 Q21,-24 14,-26 L-14,-26 Q-21,-24 -21,-30 Z',fill:HR},root);
 if(L.style==='ponytail'){el('path',{d:'M16,-56 Q34,-52 30,-26 Q27,-14 22,-20 Q26,-36 15,-44 Z',fill:HR},root);el('circle',{cx:17,cy:-52,r:3.2,fill:c},root)}
 if(L.style==='hood')el('ellipse',{cx:0,cy:-47,rx:23,ry:24,fill:'#14141d'},root);
 // brazos
 var aL=el('g',{class:'arm armL'},root),aR=el('g',{class:'arm armR'},root);
 [[aL,-21],[aR,13]].forEach(function(q){el('rect',{x:q[1],y:-26,width:8,height:27,rx:4,fill:OT},q[0]);el('rect',{x:q[1],y:-26,width:3,height:27,rx:1.5,fill:'rgba(255,255,255,.18)'},q[0]);el('circle',{cx:q[1]+4,cy:3,r:4.2,fill:SK},q[0])});
 // torso
 el('path',{d:'M-14,-24 Q-14,-30 -8,-30 L8,-30 Q14,-30 14,-24 L15,2 Q15,8 9,8 L-9,8 Q-15,8 -15,2 Z',fill:OT},root);
 el('path',{d:'M-14,-24 Q-14,-30 -8,-30 L-6,-30 L-8,6 L-10,8 Q-15,8 -15,2Z',fill:'rgba(255,255,255,.16)'},root);
 el('rect',{x:-15,y:3,width:30,height:3,fill:'rgba(0,0,0,.25)'},root);
 if(has('lapel')){el('path',{d:'M-6,-30 L0,-12 L-12,-4 L-10,-24 Z',fill:'#fff',opacity:.95},root);el('path',{d:'M6,-30 L0,-12 L12,-4 L10,-24 Z',fill:'#fff',opacity:.95},root);el('circle',{cx:0,cy:-4,r:1.6,fill:'#f5c842'},root)}
 if(has('tie')){el('path',{d:'M-6,-30 L0,-24 L6,-30 Z',fill:'#f4f4fa'},root);el('path',{d:'M-2.6,-26 L2.6,-26 L3.4,-8 L0,-3 L-3.4,-8 Z',fill:shade(c,.4)},root)}
 if(has('polo')){el('path',{d:'M-7,-30 L0,-22 L7,-30 L4,-31 L0,-26 L-4,-31 Z',fill:'#fff'},root)}
 if(has('pocket')){el('path',{d:'M-8,-4 L8,-4 L10,6 L-10,6 Z',fill:'rgba(0,0,0,.22)'},root);el('line',{x1:-3,y1:-28,x2:-4,y2:-16,stroke:'#fff','stroke-width':1.2,'stroke-linecap':'round'},root);el('line',{x1:3,y1:-28,x2:4,y2:-16,stroke:'#fff','stroke-width':1.2,'stroke-linecap':'round'},root)}
 if(has('buttons')){[-22,-14,-6].forEach(function(y){el('circle',{cx:0,cy:y,r:1.4,fill:'#fff6e0'},root)});el('path',{d:'M-6,-30 L0,-24 L6,-30',fill:'none',stroke:'#fff6e0','stroke-width':2},root)}
 if(has('lanyard')){el('path',{d:'M-6,-30 L-1,-6 M6,-30 L1,-6',stroke:'#4da3ff','stroke-width':1.6,fill:'none'},root);el('rect',{x:-4.5,y:-8,width:9,height:11,rx:1.5,fill:'#fff'},root);el('rect',{x:-3,y:-6,width:6,height:3,fill:'#4da3ff'},root)}
 if(has('shield')){el('path',{d:'M0,-20 L7,-17 Q7,-8 0,-4 Q-7,-8 -7,-17 Z',fill:'#fff',opacity:.92},root);el('path',{d:'M0,-17 L3.5,-15.5 Q3.5,-10 0,-8 Q-3.5,-10 -3.5,-15.5 Z',fill:c},root)}
 if(L.style==='hood'){el('path',{d:'M-13,-30 Q0,-20 13,-30 Q16,-24 8,-22 Q0,-14 -8,-22 Q-16,-24 -13,-30Z',fill:'#14141d'},root)}
 // cuello y orejas
 el('rect',{x:-4.5,y:-33,width:9,height:8,rx:3,fill:shade(L.skin,.82)},root);
 el('ellipse',{cx:-17.5,cy:-45,rx:3,ry:4.4,fill:SK},root);el('ellipse',{cx:17.5,cy:-45,rx:3,ry:4.4,fill:SK},root);
 // cabeza
 el('ellipse',{cx:0,cy:-46,rx:17.5,ry:18.5,fill:SK},root);
 el('ellipse',{cx:-6,cy:-56,rx:7,ry:4,fill:'rgba(255,255,255,.18)'},root);
 // pelo frontal
 var fringe='M-18.5,-45 Q-20,-69 0,-69 Q20,-69 18.5,-45 Q14,-57 5,-58 Q0,-50 -9,-56 Q-15,-53 -18.5,-45 Z';
 if(L.style==='long'||L.style==='bob'||L.style==='ponytail'||L.style==='short'||L.style==='bun'){
  el('path',{d:fringe,fill:HR},root);
  el('path',{d:'M-11,-65 Q0,-70 11,-65',fill:'none',stroke:'rgba(255,255,255,.4)','stroke-width':2.4,'stroke-linecap':'round'},root);
 }
 if(L.style==='short'){el('path',{d:'M-6,-69 Q4,-76 14,-68 Q8,-66 4,-62Z',fill:HR},root)}
 if(L.style==='bun'){el('circle',{cx:0,cy:-75,r:8.5,fill:HR},root);el('path',{d:'M-5,-78 Q0,-81 5,-78',fill:'none',stroke:'rgba(255,255,255,.4)','stroke-width':2,'stroke-linecap':'round'},root)}
 if(L.style==='curly'){[[-13,-62],[-5,-69],[5,-69],[13,-62],[-18,-50],[18,-50],[0,-63]].forEach(function(q){el('circle',{cx:q[0],cy:q[1],r:8,fill:HR},root)});el('path',{d:'M-10,-68 Q0,-73 10,-68',fill:'none',stroke:'rgba(255,255,255,.3)','stroke-width':2.4,'stroke-linecap':'round'},root)}
 if(L.style==='bald'){el('ellipse',{cx:-17,cy:-47,rx:3.4,ry:7,fill:HR},root);el('ellipse',{cx:17,cy:-47,rx:3.4,ry:7,fill:HR},root);el('ellipse',{cx:-5,cy:-60,rx:6,ry:3,fill:'rgba(255,255,255,.35)'},root)}
 if(L.style==='hood'){el('path',{d:'M-19,-45 Q-20,-70 0,-70 Q20,-70 19,-45 Q14,-56 0,-56 Q-14,-56 -19,-45Z',fill:'#14141d'},root);el('path',{d:'M-19,-45 Q-20,-70 0,-70',fill:'none',stroke:c,'stroke-width':1.2,opacity:.6},root)}
 // cara
 if(has('brows')){var bc=shade(L.hair,.9);el('path',{d:'M-11,-52 Q-6.5,-55 -2.5,-52',fill:'none',stroke:bc,'stroke-width':2,'stroke-linecap':'round'},root);el('path',{d:'M2.5,-52 Q6.5,-55 11,-52',fill:'none',stroke:bc,'stroke-width':2,'stroke-linecap':'round'},root)}
 var eyes=el('g',{class:'eyes'},root);
 if(!has('shades')){
  [-6.6,6.6].forEach(function(x){
   el('ellipse',{cx:x,cy:-44,rx:4.3,ry:4.9,fill:'#fff'},eyes);
   el('circle',{cx:x,cy:-43.6,r:3.1,fill:L.eye},eyes);
   el('circle',{cx:x,cy:-43.6,r:1.6,fill:'#0b0b10'},eyes);
   el('circle',{cx:x-1.1,cy:-45,r:1.1,fill:'#fff'},eyes);el('circle',{cx:x+1.2,cy:-42.2,r:.6,fill:'#fff',opacity:.8},eyes);
   if(has('lash'))el('path',{d:'M'+(x-4.4)+',-45 Q'+x+',-50 '+(x+4.4)+',-45',fill:'none',stroke:'#14141c','stroke-width':1.3,'stroke-linecap':'round'},eyes);
  });
 }
 el('path',{d:'M-1.2,-40 Q0.6,-37.5 1.8,-39.6',fill:'none',stroke:lin,'stroke-width':1.1,'stroke-linecap':'round'},root);
 el('ellipse',{cx:-11.5,cy:-37.5,rx:3.2,ry:2,fill:'rgba(255,110,120,.32)'},root);el('ellipse',{cx:11.5,cy:-37.5,rx:3.2,ry:2,fill:'rgba(255,110,120,.32)'},root);
 el('path',{class:'smile',d:'M-4.6,-34.6 Q0,-30.4 4.6,-34.6',fill:'none',stroke:shade(L.skin,.42),'stroke-width':1.7,'stroke-linecap':'round'},root);
 el('ellipse',{class:'mouth',cx:0,cy:-33,rx:3.4,ry:2.8,fill:'#6b1d2c'},root);
 if(has('beard')){el('path',{d:'M-15,-44 Q-16,-30 0,-27 Q16,-30 15,-44 Q12,-35 6,-35.5 Q0,-33 -6,-35.5 Q-12,-35 -15,-44Z',fill:HR,opacity:.95},root);el('path',{d:'M-4.6,-35 Q0,-32 4.6,-35',fill:'none',stroke:'#e9b9a0','stroke-width':1.4,'stroke-linecap':'round'},root)}
 if(has('glasses')){[-6.6,6.6].forEach(function(x){el('circle',{cx:x,cy:-44,r:6.4,fill:'rgba(170,215,255,.14)',stroke:'#eef0ff','stroke-width':1.5},root);el('path',{d:'M'+(x-4)+',-47 Q'+(x-1)+',-49 '+(x+1)+',-48',fill:'none',stroke:'rgba(255,255,255,.7)','stroke-width':1,'stroke-linecap':'round'},root)});el('line',{x1:-0.3,y1:-44,x2:0.3,y2:-44,stroke:'#eef0ff','stroke-width':1.5},root)}
 if(has('glassesSq')){[[-12.8],[1.8]].forEach(function(q){el('rect',{x:q[0],y:-49,width:11,height:9,rx:2.4,fill:'rgba(170,215,255,.14)',stroke:'#eef0ff','stroke-width':1.5},root)});el('line',{x1:-1.8,y1:-45,x2:1.8,y2:-45,stroke:'#eef0ff','stroke-width':1.5},root)}
 if(has('shades')){el('path',{d:'M-15,-50 L15,-50 Q16,-41 9,-39.5 Q4,-39 2,-44 L-2,-44 Q-4,-39 -9,-39.5 Q-16,-41 -15,-50Z',fill:'#08080c',stroke:c,'stroke-width':.9},root);el('path',{d:'M-12,-48 L-7,-48 M5,-48 L10,-48',stroke:'rgba(255,255,255,.6)','stroke-width':1.2,'stroke-linecap':'round'},root)}
 if(has('phones')){el('path',{d:'M-18,-48 Q0,-78 18,-48',fill:'none',stroke:'#1e1e2e','stroke-width':3.4,'stroke-linecap':'round'},root);[-21,15].forEach(function(x){el('rect',{x:x,y:-54,width:6,height:14,rx:3,fill:'#9d70ff',stroke:'#1e1e2e','stroke-width':1},root)})}
 if(has('headset')){el('path',{d:'M-18,-48 Q0,-76 18,-48',fill:'none',stroke:'#1e1e2e','stroke-width':3,'stroke-linecap':'round'},root);el('rect',{x:-21,y:-54,width:6,height:13,rx:3,fill:'#1e1e2e'},root);el('path',{d:'M-17,-41 Q-16,-31 -6,-32',fill:'none',stroke:'#1e1e2e','stroke-width':2},root);el('circle',{cx:-5.5,cy:-32,r:2.4,fill:'#ff7ab6'},root)}
 return root;
}
function portrait(cls,a,sz){
 var d=h('span',cls,null);d.style.setProperty('--c',a.c);
 if(AV[a.id]){var im=document.createElement('img');im.src='assets/avatars/'+a.id+'.webp';im.alt='';im.className='pimg';d.appendChild(im);return d}
 var s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','-26 -76 52 66');s.setAttribute('aria-hidden','true');
 var g=el('g',{},s);buildChar(a,g,false);d.appendChild(s);return d;
}

var LAYOUT={luna:[500,118,'Dirección'],sol:[77,290,'Ventas'],nova:[187,290,'Ventas'],aura:[297,290,'Ventas'],lira:[132,500,'Ventas'],rigel:[242,500,'Ventas'],vega:[735,290,'Marketing y SEO'],atlas:[905,290,'Marketing y SEO'],eco:[100,685,'Clientes'],alba:[270,685,'Clientes'],abaco:[735,515,'Finanzas'],egida:[905,515,'Seguridad']};
AGENTS.forEach(function(a){var l=LAYOUT[a.id];a.x=l[0];a.y=l[1];a.dept=l[2]});
var PLACES={demos:[500,312,'Sala de demos'],datos:[120,176,'Sala de datos'],aprob:[880,172,'Aprobaciones'],meet:[500,595,'Sala de reuniones']};
var AGENT_LOC={sol:'demos',nova:'demos',aura:'demos',lira:'demos',rigel:'demos',vega:'datos',atlas:'datos',eco:'datos',alba:'datos',abaco:'datos',egida:'datos'};
function spot(key){
 var p=PLACES[key];
 if(key==='meet'){var ang=Math.random()*6.283;return [p[0]+Math.cos(ang)*72,p[1]+Math.sin(ang)*60]}
 return [p[0]+(Math.random()*70-35),p[1]+(Math.random()*16-8)];
}
function buildMap(){
 buildDefs();
 var defs=el('defs',{},svg);
 var gl=el('filter',{id:'glow',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);
 el('feGaussianBlur',{stdDeviation:'6',result:'b'},gl);
 var mg=el('feMerge',{},gl);el('feMergeNode',{in:'b'},mg);el('feMergeNode',{in:'SourceGraphic'},mg);
 el('rect',{x:10,y:10,width:980,height:810,rx:18,class:'floor'},svg);
 for(var i=1;i<10;i++){el('line',{x1:10+i*98,y1:10,x2:10+i*98,y2:820,class:'grid'},svg)}
 for(var j=1;j<9;j++){el('line',{x1:10,y1:10+j*90,x2:990,y2:10+j*90,class:'grid'},svg)}
 function room(x,y,w,hh,label,cls,color){
  var g=el('g',{class:'room '+(cls||''),style:'--c:'+(color||'#7c4dff')},svg);
  el('rect',{x:x,y:y,width:w,height:hh,rx:14,class:'rbox'},g);
  el('circle',{cx:x+18,cy:y+20,r:4,class:'rdot'},g);
  el('text',{x:x+30,y:y+24,class:'zone'},g,label);
  return g;
 }
 // dirección
 room(330,20,340,178,'DIRECCIÓN','glass','#f5c842');
 // datos
 var dg=room(20,20,200,130,'DATOS · SUPABASE','','#00d4aa');
 for(var s=0;s<3;s++){el('rect',{x:42+s*58,y:62,width:44,height:62,rx:6,class:'rack'},dg);el('circle',{cx:64+s*58,cy:76,r:3,class:'led l'+s},dg)}
 // aprobaciones
 var ag=room(780,20,200,130,'TÚ · APROBACIONES','human','#f5c842');
 var me=el('g',{transform:'translate(880,86)'},ag);
 el('circle',{r:22,class:'me'},me);el('text',{y:6,'text-anchor':'middle',class:'glyph'},me,'TÚ');
 el('text',{x:880,y:128,'text-anchor':'middle',class:'sm'},ag,'Cris');
 // departamentos
 room(20,200,335,400,'VENTAS','','#00d4aa');
 room(655,200,325,220,'MARKETING Y SEO','','#9d70ff');
 room(20,610,335,200,'CLIENTES','','#ff7ab6');
 room(655,440,160,370,'FINANZAS','','#8be9fd');
 room(825,440,155,370,'SEGURIDAD','','#ff6b6b');
 // sala de demos
 var dm=room(375,200,250,160,'SALA DE DEMOS','','#4da3ff');
 for(var k=0;k<5;k++){el('rect',{x:392+k*44,y:232,width:34,height:44,rx:4,class:'shelf'},dm);el('rect',{x:398+k*44,y:240,width:22,height:4,rx:2,class:'shelf2'},dm)}
 // sala de reuniones
 var rm=room(375,380,250,430,'SALA DE REUNIONES','','#7c4dff');
 el('ellipse',{cx:500,cy:605,rx:62,ry:44,class:'table'},rm);
 AGENTS.forEach(function(a){
  var d=el('g',{class:'desk','data-id':a.id},svg);gDesk[a.id]=d;
  el('rect',{x:a.x-52,y:a.y+22,width:104,height:42,rx:8,class:'dk'},d);
  el('rect',{x:a.x-30,y:a.y+28,width:60,height:24,rx:4,class:'scr',style:'--c:'+a.c},d);
  el('text',{x:a.x,y:a.y+80,'text-anchor':'middle',class:'nm'},d,a.name);
  el('text',{x:a.x,y:a.y+94,'text-anchor':'middle',class:'rl'},d,a.role);
 });
 AGENTS.forEach(function(a){
  var g=el('g',{class:'av',tabindex:'0',role:'button','aria-label':'Ver qué hace '+a.name+', '+a.role,'data-id':a.id,style:'--c:'+a.c},svg);
  gAv[a.id]=g;
  el('ellipse',{cx:0,cy:36,rx:28,ry:8,class:'selring'},g);
  el('ellipse',{cx:0,cy:-14,rx:36,ry:62,class:'halo',filter:'url(#glow)'},g);
  var cg=el('g',{transform:'scale(1.1)'},g);buildChar(a,cg,true);gCg[a.id]=cg;
  gDot[a.id]=el('circle',{cx:24,cy:-78,r:5.5,class:'dot'},g);
  var b=el('g',{class:'bub',transform:'translate(0,-100)'},g);
  gBub[a.id]={g:b,r:el('rect',{x:-80,y:-18,width:160,height:24,rx:12},b),t:el('text',{y:-2,'text-anchor':'middle'},b,'')};
  place(a,a.x,a.y-16,true);
  g.addEventListener('click',function(){select(a.id)});
  g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(a.id)}});
  gDesk[a.id].addEventListener('click',function(){select(a.id)});
 });
}
function place(a,x,y,instant){
 var g=gAv[a.id];g.style.transition=(instant||REDUCED)?'none':'transform 1.4s cubic-bezier(.5,0,.2,1)';
 g.style.transform='translate('+x+'px,'+y+'px)';
 if(!instant&&!REDUCED&&(Math.abs((a.px||0)-x)>6||Math.abs((a.py||0)-y)>6)){g.classList.add('walking');clearTimeout(a.wt);a.wt=setTimeout(function(){g.classList.remove('walking')},1450)}
 a.px=x;a.py=y;
}
function bubble(a,txt){
 var b=gBub[a.id];
 if(!txt){b.g.classList.remove('on');gAv[a.id].classList.remove('talk');return}
 gAv[a.id].classList.add('talk');
 var short=txt.length>34?txt.slice(0,33)+'…':txt;
 b.t.textContent=short;
 var w=Math.max(70,Math.min(230,short.length*6.4+28));
 b.r.setAttribute('x',-w/2);b.r.setAttribute('width',w);
 b.g.classList.add('on');
}
function pulse(from,to,color){
 if(REDUCED)return;
 var p=el('path',{d:'M'+from[0]+','+from[1]+' C'+from[0]+','+((from[1]+to[1])/2)+' '+to[0]+','+((from[1]+to[1])/2)+' '+to[0]+','+to[1],class:'pulse',style:'stroke:'+color},svg);
 setTimeout(function(){if(p.parentNode)p.parentNode.removeChild(p)},1500);
}

/* ---------- FEED ---------- */
function stamp(){var d=new Date();return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2)}
function log(a,txt,kind){
 var ul=$('feed'),li=h('li',kind||'');li.style.setProperty('--c',a?a.c:'#888');
 h('time','',stamp(),li);var b=h('b','',a?a.name:'Tú',li);h('span','',' '+txt,li);
 ul.insertBefore(li,ul.firstChild);while(ul.children.length>40)ul.removeChild(ul.lastChild);
}

/* ---------- TABLON ---------- */
var COLS=[['curso','En curso'],['revision','Para tu revisión'],['hecho','Hecho']];
function drawBoard(){
 var b=$('board');b.textContent='';
 COLS.forEach(function(c){
  var col=h('div','col',null,b);h('h3','',c[1],col);
  var list=state.tasks.filter(function(t){return t.col===c[0]}).slice(c[0]==='hecho'?-8:0);
  var cnt=h('span','n',String(list.length),col.firstChild);
  list.forEach(function(t){
   var a=BY[t.agent],card=h('div','card',null,col);card.style.setProperty('--c',a.c);
   h('b','',t.col==='curso'?t.title:(t.done||t.title),card);h('small','',a.name+' · '+a.role+(t.dbId?' · guardada':'')+(t.real?'':(state.real?'':' · ejemplo'))+(t.flag?' · con hallazgos':''),card);
   if(t.result){var dt=h('details','res',null,card);h('summary','','Ver resultado',dt);h('pre','',t.result,dt)}
   if(c[0]==='revision'){
    var r=h('div','row',null,card);
    var ok=h('button','mini ok','Aprobar',r),no=h('button','mini','Descartar',r);
    ok.addEventListener('click',function(){t.col='hecho';if(t.dbId&&window.WM_DB)window.WM_DB.setEstado(t.dbId,'hecha');state.approved++;log(null,'aprobó: '+t.done,'ok');drawBoard();kpis()});
    no.addEventListener('click',function(){if(t.dbId&&window.WM_DB)window.WM_DB.setEstado(t.dbId,'descartada');state.tasks=state.tasks.filter(function(x){return x!==t});log(null,'descartó: '+t.done);drawBoard();kpis()});
   }
  });
 });
 // limpiar hechos antiguos
 var hs=state.tasks.filter(function(t){return t.col==='hecho'});
 if(hs.length>30){state.tasks=state.tasks.filter(function(t){return t.col!=='hecho'||hs.indexOf(t)>=hs.length-30})}
}
function kpis(){
 var k=$('kpis');k.textContent='';
 var cur=state.tasks.filter(function(t){return t.col==='curso'}).length;
 var rev=state.tasks.filter(function(t){return t.col==='revision'}).length;
 [['Agentes en oficina',AGENTS.length],['Tareas en curso',cur],['Para tu revisión',rev],['Consultas a Dirección',state.consultas],['Esperan tu decisión',window.WM_DEC_N||0],[state.real?'Tareas hechas':'Tareas simuladas hechas',state.done]].forEach(function(x){
  var d=h('div','kpi',null,k);h('span','',String(x[1]),d);h('small','',x[0],d);
 });
}

/* ---------- ROLES Y AUTORIDAD ---------- */
/* solo = lo hace sin preguntar · luna = lo consulta con Dirección · cris = lo decides tú */
var AUTH={
 luna:{solo:['Priorizar y repartir tareas','Resolver dudas de los agentes dentro de las reglas'],luna:[],cris:['Cualquier cosa que salga de la oficina','Gasto, precios, clientes y cambios en producción']},
 sol:{solo:['Elegir prospecto del Radar y demo del sector','Redactar borradores de primer contacto'],luna:['Qué producto ofrecer si no está claro','Sector sin demo'],cris:['Enviar cualquier mensaje a un prospecto','Crear una demo nueva']},
 nova:{solo:['Buscar su grupo de sectores en las ciudades que le tocan','Elegir prospecto del Radar y demo del sector','Redactar borradores de primer contacto'],luna:['Qué producto ofrecer si no está claro','Sector sin demo'],cris:['Enviar cualquier mensaje a un prospecto','Crear una demo nueva']},
 aura:{solo:['Buscar su grupo de sectores en las ciudades que le tocan','Elegir prospecto del Radar y demo del sector','Redactar borradores de primer contacto'],luna:['Qué producto ofrecer si no está claro','Sector sin demo'],cris:['Enviar cualquier mensaje a un prospecto','Crear una demo nueva']},
 lira:{solo:['Buscar su grupo de sectores en las ciudades que le tocan','Elegir prospecto del Radar y demo del sector','Redactar borradores de primer contacto'],luna:['Qué producto ofrecer si no está claro','Sector sin demo'],cris:['Enviar cualquier mensaje a un prospecto','Crear una demo nueva']},
 rigel:{solo:['Buscar su grupo de sectores en las ciudades que le tocan','Elegir prospecto del Radar y demo del sector','Redactar borradores de primer contacto'],luna:['Qué producto ofrecer si no está claro','Sector sin demo'],cris:['Enviar cualquier mensaje a un prospecto','Crear una demo nueva']},
 vega:{solo:['Ideas, títulos y guiones en borrador'],luna:['Encaje en el calendario de contenidos'],cris:['Publicar en redes o en el canal']},
 atlas:{solo:['Revisar metas, datos estructurados y ficheros para IA'],luna:['Prioridad entre varias mejoras SEO'],cris:['Cambiar texto o código de una web pública']},
 eco:{solo:['Atender consultas y recoger nombre y teléfono'],luna:['Lead dudoso o incompleto'],cris:['Prometer algo fuera del catálogo']},
 alba:{solo:['Seguir el procedimiento de alta y marcar lo que falta'],luna:['Falta un dato del cliente'],cris:['Activar el token de un cliente']},
 abaco:{solo:['Ordenar y resumir movimientos'],luna:['Movimiento sin categoría clara'],cris:['Todo lo fiscal: pasa a tu gestor']},
 egida:{solo:['Revisión defensiva de sistemas propios'],luna:['Hallazgo menor'],cris:['Cambiar políticas de acceso o claves']}
};
/* Temas de ejemplo para las consultas simuladas: r = quién resuelve */
var CONSULTAS={
 sol:[['¿Spark o Core Spark Web para este prospecto?','luna'],['Prospecto de un sector sin demo: ¿se crea una?','cris']],
 nova:[['¿Spark o Agente IA Citas para esta clínica?','luna'],['Sector de salud sin demo: ¿se crea una?','cris']],
 aura:[['¿Spark o Core Spark Web para este taller?','luna'],['Autoescuelas: ¿se crea una demo?','cris']],
 lira:[['Empresa sin web: ¿Core Spark Web o Web?','luna'],['Cerrajeros: ¿se crea una demo?','cris']],
 rigel:[['¿Spark o Core Spark Web para este despacho?','luna'],['Inmobiliarias sin demo: ¿se crea una?','cris']],
 vega:[['¿Entra este guion en la semana?','luna'],['Hay un post listo para publicar','cris']],
 atlas:[['¿Metas primero o datos estructurados?','luna'],['Cambiar un título de una página pública','cris']],
 eco:[['Lead sin teléfono: ¿se reclama?','luna'],['Un cliente pide algo fuera de catálogo','cris']],
 alba:[['Falta el horario de un cliente nuevo','luna'],['El chatbot de prueba está listo: ¿se activa?','cris']],
 abaco:[['Movimiento sin categoría clara','luna'],['Pregunta fiscal de un movimiento','cris']],
 egida:[['Cabecera menor sin configurar','luna'],['Propuesta de cambiar una política de acceso','cris']]
};
function consulta(){
 var cand=AGENTS.filter(function(a){return a.id!=='luna'&&a.st==='idle'&&!a.away});
 if(!cand.length||BY.luna.away)return;
 var a=cand[Math.floor(Math.random()*cand.length)],c=CONSULTAS[a.id];if(!c)return;
 var q=c[Math.floor(Math.random()*c.length)];
 var p=[BY.luna.x+74,BY.luna.y+40];
 a.away=4;a.at='Dirección';place(a,p[0],p[1]);bubble(a,'Consulta a Luna');
 log(a,'consulta a Luna: '+q[0].charAt(0).toLowerCase()+q[0].slice(1));
 state.consultas++;
 setTimeout(function(){
  if(q[1]==='luna'){bubble(BY.luna,'Resuelto: adelante');log(BY.luna,'resuelve a '+a.name+' dentro de las reglas','ok')}
  else{
   bubble(BY.luna,'Esto lo decide Cris');log(BY.luna,'te pasa a ti la duda de '+a.name+' (ejemplo)','rev');
   pulse([BY.luna.x,BY.luna.y+30],[880,100],'#f5c842');
   document.dispatchEvent(new CustomEvent('wm-sim-decision',{detail:{agente:a.id,asunto:q[0],contexto:'Consulta simulada de '+a.name+' ('+a.role+'). Es un ejemplo de cómo llegaría una decisión real.',resumen:'No entra en lo que '+a.name+' puede decidir solo y tampoco en mi margen: saca a WhiteMoon de la oficina o la compromete.',rec:'Decide con tu criterio; ejemplo sin efecto real.',opciones:['Aprobar','Rechazar','Pedir más información']}}));
  }
  setTimeout(function(){bubble(BY.luna,'')},3500);
 },1800);
}

/* ---------- MODO REAL ---------- */
/* Con sesión de staff la oficina deja de simular: cada tarea es una llamada real (Edge Function oficina-agente
   o lectura real de Supabase) y su resultado se guarda en oficina_tareas. Nada sale de la oficina. */
var ATLAS_URLS=[['inicio','https://whitemoon.es/'],['Spark','https://whitemoon.es/spark/'],['Core Spark Web','https://whitemoon.es/core/'],['Agente IA Citas','https://whitemoon.es/agente-ia-citas/'],['Precios','https://whitemoon.es/precios/'],['Diseño web','https://whitemoon.es/diseno-web/']];
var H=3600e3;
function rname(t){return t.charAt(0).toLowerCase()+t.slice(1)}
function oldestUrl(){
 var best=ATLAS_URLS[0],bt=Infinity;
 ATLAS_URLS.forEach(function(u){var t=state.urlLast[u[1]]||0;if(t<bt){bt=t;best=u}});
 return best;
}
var M=60e3;
var ROUT={
 atlas:{every:6*M,make:function(){var u=oldestUrl();state.urlLast[u[1]]=Date.now();return{title:'Auditando el SEO de '+u[0],accion:'atlas',url:u[1],fn:function(){return window.WM_DB.agente({accion:'atlas',url:u[1]})}}}},
 egida:{every:30*M,make:function(){return{title:'Comprobando cabeceras de seguridad',accion:'egida',fn:function(){return window.WM_DB.agente({accion:'egida'})}}}},
 eco:{every:5*M,make:function(){return{title:'Vigilando los leads de los chatbots',accion:'eco',fn:function(){return window.WM_DB.agente({accion:'eco'})}}}},
 alba:{every:10*M,make:function(){return{title:'Revisando las altas de clientes en curso',accion:'alba',fn:function(){return window.WM_DB.agente({accion:'alba'})}}}},
 abaco:{every:10*M,make:function(){return{title:'Ordenando la cartera de clientes',accion:'abaco',fn:function(){return window.WM_DB.agente({accion:'abaco'})}}}},
 luna:{every:15*M,make:function(){return{title:'Preparando el informe de la jornada',accion:'luna',fn:function(){return window.WM_DB.agente({accion:'luna'})}}}},
 vega:{every:90*M,make:function(){
  var D=window.WM_DEMOS||[];if(!D.length)return null;
  var d=D[state.vegaN++%D.length];
  var ins='Prepara 3 ideas de vídeo corto (Reel) para enseñar esta demo de WhiteMoon: «'+d.label+'» ('+d.url+'). Para cada idea: gancho de 1 frase, guion de 4 pasos y llamada a la acción. Recuerda que es una demo, no un cliente real: no cuentes resultados ni casos.';
  return{title:'Ideando contenido para la demo de '+d.label,accion:'vega',fn:function(){return window.WM_DB.agente({accion:'tarea',agente:'vega',titulo:'3 ideas de vídeo: demo de '+d.label,instruccion:ins})}}}}
};
function realRun(a,it){
 var t={id:state.nextId++,agent:a.id,title:it.title,done:it.title,review:false,col:'curso',t0:Date.now(),dbId:null,real:true};
 state.tasks.push(t);a.task=t;a.st='work';a.t=a.t0=1e6;
 var loc=AGENT_LOC[a.id];
 if(loc){var p=spot(loc);place(a,p[0],p[1]);a.at=PLACES[loc][2]}else{a.at=a.dept;place(a,a.x,a.y-16)}
 gDesk[a.id].classList.add('work');gAv[a.id].classList.add('work');bubble(a,it.title);
 log(a,rname(it.title)+'…');drawBoard();kpis();renderAgent();
 Promise.resolve().then(it.fn).then(function(res){realDone(a,t,it,res)}).catch(function(e){realFail(a,t,it,e)});
}
function unwork(a){a.task=null;a.st='idle';a.t=0;gDesk[a.id].classList.remove('work');gAv[a.id].classList.remove('work');bubble(a,'')}
function realDone(a,t,it,res){
 unwork(a);state.done++;
 t.done=res.titulo||it.title;t.result=res.resultado||'';t.review=false;t.col='hecho';t.flag=!!res.revisar&&res.persist!==false;
 var key=a.id+'|'+(it.url||it.accion||'')+'|'+t.result;
 if(res.persist!==false&&window.WM_DB&&window.WM_DB.ready&&state.lastRes[a.id+'|'+(it.url||it.accion||'')]!==key){
  state.lastRes[a.id+'|'+(it.url||it.accion||'')]=key;
  window.WM_DB.createTarea({agente:a.id,titulo:t.done,resultado:t.result,estado:'hecha',requiere_revision:false,brief_id:it.briefId||null,datos:{ia:res.ia||'det',accion:it.accion||null,url:it.url||null,hallazgos:!!res.revisar}})
   .then(function(id){t.dbId=id;drawBoard()}).catch(function(e){console.warn('oficina: no se pudo guardar la tarea',e.message||e)});
 }
 a.hist.unshift({time:stamp(),text:t.done,review:false});if(a.hist.length>8)a.hist.pop();
 log(a,t.done,t.flag?'rev':'');place(a,a.x,a.y-16);a.at=a.dept;
 if(it.res)it.res(res);
 drawBoard();kpis();renderAgent();
}
function realFail(a,t,it,e){
 unwork(a);state.tasks=state.tasks.filter(function(x){return x!==t});
 a.nextAt=Date.now()+30*60e3;
 log(a,'no pudo completar «'+it.title+'»: '+((e&&e.message)||'error'),'rev');
 place(a,a.x,a.y-16);a.at=a.dept;
 if(it.rej)it.rej(e);
 drawBoard();kpis();renderAgent();
}
function pump(a){
 if(a.rq&&a.rq.length){realRun(a,a.rq.shift());return}
 var r=ROUT[a.id];if(!r||Date.now()<(a.nextAt||0))return;
 var it=r.make();a.nextAt=Date.now()+r.every;
 if(it)realRun(a,it);
}
/* Un agente trabaja en algo real: devuelve una promesa con el resultado */
function work(id,title,fn,extra){
 var a=BY[id];if(!a)return Promise.reject(new Error('Agente desconocido'));
 return new Promise(function(res,rej){
  var it=Object.assign({title:title,fn:fn,res:res,rej:rej},extra||{});
  (a.rq=a.rq||[]).push(it);
  if(a.st==='idle'&&!a.away&&state.real)pump(a);
 });
}
function setMode(on){
 state.real=on;
 var b=$('mode-badge'),n=$('mode-note');
 if(b){b.textContent=on?'OFICINA REAL':'SIMULACIÓN';b.classList.toggle('real',on)}
 if(n)n.innerHTML=on?'<b>Oficina real.</b> Cada tarea es una comprobación o un borrador de verdad. Los agentes preparan; nada sale de la oficina sin que tú lo decidas.':'<b>Simulación.</b> Los agentes de esta oficina trabajan con tareas de ejemplo. No hay datos reales de clientes ni se envía nada.';
}
document.addEventListener('wm-db-ready',function(){
 setMode(true);
 state.tasks=[];
 AGENTS.forEach(function(a,i){
  if(a.task||a.st==='work')unwork(a);
  a.q=[];a.hist=[];a.away=0;a.rq=[];a.nextAt=Date.now()+5000+i*6000;place(a,a.x,a.y-16);a.at=a.dept;bubble(a,'');
 });
 if(window.WM_DB&&window.WM_DB.lastIA)window.WM_DB.lastIA().then(function(rows){
  var last={};
  rows.forEach(function(r){var t=new Date(r.created_at).getTime();if(!last[r.agente]||t>last[r.agente])last[r.agente]=t;if(r.datos&&r.datos.url&&(!state.urlLast[r.datos.url]||t>state.urlLast[r.datos.url]))state.urlLast[r.datos.url]=t});
  AGENTS.forEach(function(a){if(ROUT[a.id]&&last[a.id])a.nextAt=Math.max(last[a.id]+ROUT[a.id].every,Date.now()+5000)});
 }).catch(function(){});
 drawBoard();kpis();renderAgent();log(BY.luna,'oficina real activada: a partir de ahora cada tarea es de verdad.','ok');
});
document.addEventListener('wm-db-off',function(){if(state.real){setMode(false);log(null,'Sesión cerrada: vuelve la simulación.')}});

var REAL_HINT={luna:'Hace el informe de la jornada y planifica tus briefs con IA.',sol:'Evalúa prospectos del Radar de belleza y bienestar y los leads entrantes. Solo te pasa lo que parece una venta.',nova:'Evalúa prospectos del Radar de salud. Solo te pasa lo que parece una venta.',aura:'Evalúa prospectos del Radar de motor y transporte. Solo te pasa lo que parece una venta.',lira:'Evalúa prospectos del Radar de hogar y obras. Solo te pasa lo que parece una venta.',rigel:'Evalúa prospectos del Radar de servicios y hostelería. Solo te pasa lo que parece una venta.',abaco:'Ordena la cartera de clientes. Sin datos contables conectados: no calcula importes.',vega:'Prepara ideas de vídeo a partir de las demos.',atlas:'Audita las páginas de whitemoon.es una a una.',eco:'Vigila los leads de los chatbots.',alba:'Revisa las altas de clientes en curso.',egida:'Comprueba las cabeceras de seguridad públicas.'};
/* ---------- MOTOR ---------- */
function start(a,task,fromDirector){
 var def=task||a.work[Math.floor(Math.random()*a.work.length)];
 var D=window.WM_DEMOS||[];
 if(!task&&a.sales&&D.length&&Math.random()<0.6){
  var dm=D[Math.floor(Math.random()*D.length)];
  def=['Eligiendo la demo de '+dm.label+' para un prospecto','Demo «'+dm.label+'» elegida para un borrador',true];
 }
 var t={id:state.nextId++,agent:a.id,title:def[0],done:def[1],review:def[2],col:'curso',t0:Date.now(),dbId:def[3]||null};
 state.tasks.push(t);a.task=t;a.st='work';a.t=a.t0=3+Math.floor(Math.random()*4);
 var loc=AGENT_LOC[a.id];
 if(loc&&Math.random()<0.7){var p=spot(loc);place(a,p[0],p[1]);a.at=PLACES[loc][2]}else{a.at=a.dept;place(a,a.x,a.y-16)}
 gDesk[a.id].classList.add('work');gAv[a.id].classList.add('work');
 bubble(a,def[0]);
 if(fromDirector&&a.id!=='luna'){pulse([BY.luna.x,BY.luna.y+30],[a.x,a.y-30],a.c)}
 log(a,def[0].charAt(0).toLowerCase()+def[0].slice(1)+'…');
 drawBoard();kpis();renderAgent();
}
function finish(a){
 var t=a.task;a.task=null;a.st='idle';
 gDesk[a.id].classList.remove('work');gAv[a.id].classList.remove('work');bubble(a,'');
 if(t){
  state.done++;
  if(t.dbId&&window.WM_DB)window.WM_DB.setEstado(t.dbId,t.review?'revision':'hecha');
  a.hist.unshift({time:stamp(),text:t.done,review:t.review});if(a.hist.length>8)a.hist.pop();
  if(t.review){t.col='revision';log(a,t.done,'rev');pulse([a.x,a.y-30],[880,100],'#f5c842');var p=spot('aprob');place(a,p[0],p[1]);a.away=3;a.at=PLACES.aprob[2];bubble(a,'Te lo dejo para revisión')}
  else{t.col='hecho';log(a,t.done);place(a,a.x,a.y-16);a.at=a.dept}
 }
 drawBoard();kpis();renderAgent();
}
function meeting(){
 var cand=AGENTS.filter(function(a){return a.id!=='luna'&&a.st==='idle'&&!a.away});
 if(cand.length<1)return;
 var a=cand[Math.floor(Math.random()*cand.length)];
 var p=spot('meet');a.away=4;a.at=PLACES.meet[2];place(a,p[0],p[1]);bubble(a,'Reunión con Luna');
 var lp=spot('meet');place(BY.luna,lp[0],lp[1]);BY.luna.away=4;
 log(BY.luna,'se reúne con '+a.name+' en la sala de reuniones');
}
function step(){
 state.tick++;
 AGENTS.forEach(function(a){
  if(a.away>0){a.away--;if(a.away===0){place(a,a.x,a.y-16);bubble(a,'');a.at=a.dept}return}
  if(state.real){if(a.st==='idle')pump(a);return}
  if(a.st==='work'){a.t--;if(a.t<=0)finish(a);return}
  if(a.q.length){start(a,a.q.shift(),true);return}
  if(Math.random()<0.28)start(a,null,false);
 });
 if(!state.real){if(state.tick%9===0)meeting();
 if(state.tick%11===5)consulta()}
 renderAgent();
}
function loop(){
 var wait=state.speed===0?400:(state.speed===2?600:1300);
 if(state.speed>0)step();
 setTimeout(loop,wait);
}

/* ---------- BRIEF ---------- */
var ROUTES=[
 ['nova',/cl[ií]nica|dental|dentist|fisio|podolog|veterin/i,['Preparando prospección de salud para el brief','Borrador listo para tu aprobación',true]],
 ['aura',/taller|mudanz|autoescuela|coche|veh[ií]culo/i,['Preparando prospección de motor para el brief','Borrador listo para tu aprobación',true]],
 ['lira',/electric|fontaner|reforma|cerraj|obras?\b/i,['Preparando prospección de hogar para el brief','Borrador listo para tu aprobación',true]],
 ['rigel',/abogad|gestor[ií]a|inmobiliari|restaurante|asesor/i,['Preparando prospección de servicios para el brief','Borrador listo para tu aprobación',true]],
 ['sol',/venta|correo|mail|cliente nuevo|prospect|demo|peluquer|barber|est[ée]tica|u[ñn]as/i,['Redactando borrador para el brief','Borrador listo para tu aprobación',true]],
 ['vega',/v[ií]deo|reel|youtube|canal|redes|guion|contenido|marketing|instagram/i,['Esbozando contenido para el brief','Contenido listo para tu revisión',true]],
 ['atlas',/seo|google|web|meta|posici|geo|llms/i,['Revisando SEO para el brief','Revisión SEO terminada',false]],
 ['eco',/chat|atenci|consulta|lead|whatsapp|telegram/i,['Preparando respuestas para el brief','Respuestas preparadas',false]],
 ['alba',/alta|onboarding|nuevo cliente|activar|token/i,['Preparando alta para el brief','Alta preparada',false]],
 ['abaco',/factura|gasto|contab|gestor|mes/i,['Ordenando datos para el brief','Datos ordenados',false]],
 ['egida',/segur|rls|clave|contrase|certificado|ciber|supabase/i,['Revisando seguridad para el brief','Revisión de seguridad terminada',false]]
];
function realBrief(txt,plan){
 pulse([880,100],[BY.luna.x,BY.luna.y],'#f5c842');
 h('p','hint','Luna está planificando el brief con IA…',plan);
 work('luna','Planificando tu brief',function(){return window.WM_DB.agente({accion:'plan',texto:txt})},{accion:'plan'}).then(function(res){
  plan.textContent='';h('p','hint','Plan de Luna ('+res.tareas.length+' tarea'+(res.tareas.length>1?'s':'')+'):',plan);
  window.WM_DB.saveBriefOnly(txt,res.tareas.map(function(x){return{agente:x.agente,titulo:x.titulo}})).catch(function(){return null}).then(function(bid){
   res.tareas.forEach(function(x){
    var a=BY[x.agente];if(!a)return;
    var chip=h('span','chip',a.name+' · '+x.titulo,plan);chip.style.setProperty('--c',a.c);
    pulse([BY.luna.x,BY.luna.y+30],[a.x,a.y-30],a.c);
    work(x.agente,x.titulo,function(){return window.WM_DB.agente({accion:'tarea',agente:x.agente,titulo:x.titulo,instruccion:x.instruccion})},{accion:'brief',briefId:bid||null}).catch(function(){});
   });
  });
 }).catch(function(e){plan.textContent='';h('p','hint','Luna no pudo planificar: '+(e.message||e)+'. Inténtalo de nuevo.',plan)});
}
$('brief').addEventListener('submit',function(e){
 e.preventDefault();
 var txt=$('brief-t').value.trim();if(!txt)return;
 var plan=$('plan');plan.textContent='';
 var hits=ROUTES.filter(function(r){return r[1].test(txt)});
 if(!hits.length)hits=[ROUTES[0],ROUTES[1]];
 log(BY.luna,'recibe un brief: «'+(txt.length>60?txt.slice(0,59)+'…':txt)+'»');
 if(state.real){realBrief(txt,plan);$('brief-t').value='';return}
 pulse([880,100],[BY.luna.x,BY.luna.y],'#f5c842');
 h('p','hint','Plan de Luna ('+hits.length+' tarea'+(hits.length>1?'s':'')+'):',plan);
 var defs=hits.map(function(r){return r[2].slice(0,3)});
 function enqueue(ids){
  hits.forEach(function(r,i){
   var a=BY[r[0]];if(ids&&ids[i])defs[i][3]=ids[i];
   a.q.push(defs[i]);
   var chip=h('span','chip',a.name+' · '+a.role,plan);chip.style.setProperty('--c',a.c);
  });
 }
 if(window.WM_DB&&window.WM_DB.ready){
  window.WM_DB.saveBrief(txt,hits.map(function(r){return{agent:r[0],title:r[2][0],review:r[2][2]}})).then(function(rows){
   var ids=hits.map(function(r,i){return rows[i]&&rows[i].id});
   enqueue(ids);h('p','hint','Brief y tareas guardados en Supabase.',plan);
  }).catch(function(err){enqueue();h('p','hint','No se pudo guardar en Supabase ('+(err&&err.message||'error')+'). Sigue en local.',plan)});
 }else enqueue();
 $('brief-t').value='';
});
document.addEventListener('wm-db-open',function(ev){
 var seen={};state.tasks.forEach(function(t){if(t.dbId)seen[t.dbId]=1});
 BY.luna&&AGENTS.forEach(function(a){a.q.forEach(function(d){if(d[3])seen[d[3]]=1})});
 (ev.detail||[]).forEach(function(r){
  if(seen[r.id]||!BY[r.agente])return;
  if(r.datos&&r.datos.prospecto_id)return;
  if(r.estado==='revision'){state.tasks.push({id:state.nextId++,agent:r.agente,title:r.titulo,done:r.titulo,result:r.resultado||'',real:true,review:true,col:'revision',dbId:r.id})}
  else if(!state.real)BY[r.agente].q.push([r.titulo,'Completada',r.requiere_revision,r.id]);
 });
 drawBoard();kpis();log(null,'Supabase conectado: tareas pendientes cargadas.');
});

/* ---------- AGENTE SELECCIONADO ---------- */
function select(id){
 state.sel=id;
 Object.keys(gAv).forEach(function(k){gAv[k].classList.toggle('sel',k===id)});
 renderAgent();
}
function renderAgent(){
 var a=BY[state.sel],p=$('agent-panel');if(!p||!a)return;
 p.textContent='';p.style.setProperty('--c',a.c);
 var top=h('div','ap-top',null,p);top.appendChild(portrait('tav',a));
 var w=h('div','',null,top);h('b','',a.name,w);h('small','',a.role+' · '+a.dept,w);
 var stt=h('span','ap-st '+(a.st==='work'?'on':''),a.st==='work'?'Trabajando':(a.away>0?'En desplazamiento':'Libre'),top);
 h('h3','',"Ahora mismo",p);
 if(a.task){
  h('p','ap-task',a.task.title,p);
  var bar=h('div','bar',null,p),sp=h('span','',null,bar);sp.style.width=Math.round(((a.t0-a.t)/a.t0)*100)+'%';
  h('small','ap-loc','En: '+(a.at||a.dept),p);
 }else h('p','hint',a.away>0?'Va de camino a '+(a.at||'otra sala')+'.':(state.real?(REAL_HINT[a.id]||'Esperando su próxima tarea.')+(ROUT[a.id]&&a.nextAt?' Próxima comprobación en '+Math.max(1,Math.ceil((a.nextAt-Date.now())/60000))+' min.':''):'Sin tarea en este momento. Coge la siguiente de su cola o del plan de Luna.'),p);
 h('h3','',"Cola ("+a.q.length+")",p);
 if(a.q.length){var u=h('ul','ap-list',null,p);a.q.forEach(function(q){h('li','',q[0],u)})}else h('p','hint','Cola vacía.',p);
 h('h3','',"Últimas tareas",p);
 if(a.hist.length){var u2=h('ul','ap-list',null,p);a.hist.slice(0,5).forEach(function(x){var li=h('li','',null,u2);h('time','',x.time+' ',li);h('span','',x.text+(x.review?' · pasó a tu revisión':''),li)})}else h('p','hint','Todavía nada: espera unos segundos.',p);
 var r=h('div','row',null,p);
 var f=h('button','btn','Ficha completa',r);f.type='button';f.addEventListener('click',function(){openFicha(a.id)});
 if(a.sales){var d=h('a','btn ghost','Ver demos',r);d.href='#demos'}
}

/* ---------- FICHAS ---------- */
function openFicha(id){
 var a=BY[id],d=$('ficha'),fc=$('fc');fc.textContent='';fc.style.setProperty('--c',a.c);
 var top=h('div','fh',null,fc);
 var av=portrait('fav',a);top.appendChild(av);
 var tt=h('div','',null,top);var n=h('h2','',a.name,tt);n.id='f-name';h('p','',a.role,tt);
 var x=h('button','fx','Cerrar',top);x.type='button';x.addEventListener('click',function(){d.close()});
 h('p','fm',a.mission,fc);
 function blk(title,arr,cls){
  var s=h('div','fb '+(cls||''),null,fc);h('h3','',title,s);var u=h('ul','',null,s);
  arr.forEach(function(t){h('li','',t,u)});
 }
 blk('Qué hace',a.does);
 blk('Qué no hace',a.doesnt,'no');
 var two=h('div','two',null,fc);
 var l=h('div','',null,two),r=h('div','',null,two);
 function blk2(p,title,arr){var s=h('div','fb',null,p);h('h3','',title,s);var u=h('ul','',null,s);arr.forEach(function(t){h('li','',t,u)})}
 blk2(l,'Entradas',a.inputs);blk2(r,'Salidas',a.outputs);
 blk('Herramientas',a.tools);
 var au=AUTH[a.id];
 if(au){
  var ab=h('div','fb auth',null,fc);h('h3','',"Quién decide qué",ab);
  [['Lo hace solo',au.solo,'solo'],['Lo consulta con Luna',au.luna,'luna'],['Lo decide Cris',au.cris,'cris']].forEach(function(g){
   if(!g[1].length)return;var r=h('div','au '+g[2],null,ab);h('b','',g[0],r);var u=h('ul','',null,r);g[1].forEach(function(t){h('li','',t,u)});
  });
 }
 var st=h('div','fb real',null,fc);h('h3','',"Estado real hoy",st);
 var u=h('ul','',null,st);a.real.forEach(function(t){h('li','',t,u)});
 var nx=h('div','fb next',null,fc);h('h3','',"Para hacerlo real",nx);h('p','',a.next,nx);
 if(a.sales||a.id==='vega'||a.id==='egida'){
  var go=h('a','btn','Abrir su herramienta',fc);go.href=(a.sales?'#ventas':'#herramientas');
  go.addEventListener('click',function(){
   d.close();
   var map={vega:'t-marketing',egida:'t-ciber'};
   var b=document.querySelector('#tools-nav button[data-tool="'+(a.sales?'t-ventas':map[a.id])+'"]');if(b)b.click();
  });
 }
 if(!d.open)d.showModal();
}
$('ficha').addEventListener('click',function(e){if(e.target===this)this.close()});

/* ---------- EQUIPO ---------- */
function buildTeam(){
 var t=$('team');
 AGENTS.forEach(function(a){
  var b=h('button','tc',null,t);b.type='button';b.style.setProperty('--c',a.c);
  var top=h('div','tt',null,b);top.appendChild(portrait('tav',a));var w=h('div','',null,top);h('b','',a.name,w);h('small','',a.role,w);
  h('p','',a.mission,b);
  h('span','tag',a.real[0].indexOf('Sin datos')===0||a.real[0].indexOf('Nada')===0?'Solo simulado':'Con parte real',b);
  b.addEventListener('click',function(){openFicha(a.id)});
 });
}


/* ---------- AVATARES 3D (imágenes en assets/avatars, listadas en avatars.json) ---------- */
function swapAvatars(){
 var ids=Object.keys(AV).filter(function(k){return AV[k]&&BY[k]});if(!ids.length)return;
 var pending=ids.length;
 ids.forEach(function(id){
  var im=new Image();
  im.onload=function(){
   var cg=gCg[id];if(cg){
    cg.textContent='';
    var H=122,W=H*im.naturalWidth/im.naturalHeight;
    var g=el('g',{class:'char imgchar'},cg);
    el('ellipse',{cx:0,cy:30,rx:W*.34,ry:5,class:'shadow'},g);
    var i=el('image',{href:im.src,x:-W/2,y:34-H,width:W,height:H,preserveAspectRatio:'xMidYMax meet'},g);
   }
   if(--pending===0){$('team').textContent='';buildTeam();renderAgent()}
  };
  im.onerror=function(){delete AV[id];if(--pending===0){$('team').textContent='';buildTeam();renderAgent()}};
  im.src='assets/avatars/'+id+'.webp';
 });
}
fetch('avatars.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():{}}).then(function(j){AV=j||{};swapAvatars()}).catch(function(){});

window.WMO={AGENTS:AGENTS,BY:BY,log:log,pulse:pulse,kpis:kpis,work:work,isReal:function(){return state.real},
 queue:function(id,def){var a=BY[id];if(a)a.q.push(def)}};
buildMap();buildTeam();drawBoard();kpis();select('luna');
loop();
log(BY.luna,'abre la oficina. Todo lo que ves son tareas de ejemplo.');
})();
