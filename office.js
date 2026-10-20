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
{id:'sol',name:'Sol',role:'Agente de ventas',c:'#00d4aa',g:'S',x:150,y:330,
 mission:'Prepara correos de prospección con la demo del sector que corresponde y los deja en cola para que los envíes tú.',
 does:['Elige producto según el sector y si el negocio ya tiene web','Redacta el borrador con la demo adecuada','Incluye siempre una forma clara de darse de baja','Ordena la cola de contactos pendientes'],
 doesnt:['No envía correos por su cuenta','No promete resultados ni usa cifras inventadas','No menciona precios ni productos retirados'],
 inputs:['Leads (previsto: tabla leads_web)','Demos por sector'],outputs:['Borradores de correo','Cola de seguimiento'],
 tools:['Claude Haiku (previsto)','Supabase leads_web (previsto)'],
 real:['Generador de borradores por plantilla: funciona en la pestaña Herramientas'],
 next:'Leer leads_web con RLS, redactar con Haiku y guardar el borrador; el envío queda siempre en manos de una persona.',
 work:[['Redactando borrador para una peluquería','Borrador listo para tu aprobación',true],['Eligiendo la demo para un taller','Demo elegida',false],['Ordenando contactos pendientes','Contactos ordenados',false],['Redactando borrador para un restaurante','Borrador listo para tu aprobación',true]]},
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
var state={speed:1,done:0,approved:0,tasks:[],feed:[],nextId:1,tick:0};
AGENTS.forEach(function(a){a.st='idle';a.t=0;a.q=[];a.task=null;a.away=0});

/* ---------- NAV ---------- */
var TITLES={oficina:'Oficina',equipo:'Equipo',ventas:'Ventas · Scout',tablon:'Tablón de tareas',herramientas:'Herramientas'};
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
var svg=$('map'),gAv={},gDesk={},gBub={},gDot={};
function buildMap(){
 var defs=el('defs',{},svg);
 var gl=el('filter',{id:'glow',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);
 el('feGaussianBlur',{stdDeviation:'6',result:'b'},gl);
 var mg=el('feMerge',{},gl);el('feMergeNode',{in:'b'},mg);el('feMergeNode',{in:'SourceGraphic'},mg);
 // suelo
 el('rect',{x:10,y:10,width:980,height:600,rx:20,class:'floor'},svg);
 for(var i=1;i<10;i++){el('line',{x1:10+i*98,y1:10,x2:10+i*98,y2:610,class:'grid'},svg)}
 for(var j=1;j<6;j++){el('line',{x1:10,y1:10+j*100,x2:990,y2:10+j*100,class:'grid'},svg)}
 // zonas
 el('rect',{x:330,y:34,width:340,height:176,rx:16,class:'glass'},svg);
 el('text',{x:346,y:56,class:'zone'},svg,'DIRECCIÓN');
 el('rect',{x:34,y:40,width:200,height:118,rx:14,class:'zonebox'},svg);
 el('text',{x:50,y:62,class:'zone'},svg,'DATOS · SUPABASE');
 for(var s=0;s<3;s++){el('rect',{x:52+s*58,y:84,width:44,height:56,rx:6,class:'rack'},svg);el('circle',{cx:74+s*58,cy:98,r:3,class:'led l'+s},svg)}
 el('rect',{x:766,y:40,width:200,height:118,rx:14,class:'zonebox human'},svg);
 el('text',{x:782,y:62,class:'zone'},svg,'TÚ · APROBACIONES');
 var me=el('g',{transform:'translate(866,112)'},svg);
 el('circle',{r:22,class:'me'},me);el('text',{y:6,'text-anchor':'middle',class:'glyph'},me,'TÚ');
 el('text',{x:866,y:150,'text-anchor':'middle',class:'sm'},svg,'Cris');
 // pasillo
 el('text',{x:34,y:258,class:'zone'},svg,'ESPECIALISTAS');
 el('line',{x1:34,y1:268,x2:966,y2:268,class:'rule'},svg);
 AGENTS.forEach(function(a){
  var d=el('g',{class:'desk','data-id':a.id},svg);gDesk[a.id]=d;
  var bx=a.id==='luna'?a.x:a.x, by=a.y;
  el('rect',{x:bx-52,y:by+22,width:104,height:42,rx:8,class:'dk'},d);
  el('rect',{x:bx-30,y:by+28,width:60,height:24,rx:4,class:'scr',style:'--c:'+a.c},d);
  el('text',{x:bx,y:by+84,'text-anchor':'middle',class:'nm'},d,a.name);
  el('text',{x:bx,y:by+98,'text-anchor':'middle',class:'rl'},d,a.role);
 });
 AGENTS.forEach(function(a){
  var g=el('g',{class:'av',tabindex:'0',role:'button','aria-label':'Ficha de '+a.name+', '+a.role,'data-id':a.id,style:'--c:'+a.c},svg);
  gAv[a.id]=g;
  el('circle',{r:26,class:'halo',filter:'url(#glow)'},g);
  el('circle',{r:21,class:'body'},g);
  el('text',{y:6,'text-anchor':'middle',class:'glyph'},g,a.g);
  gDot[a.id]=el('circle',{cx:16,cy:-16,r:5,class:'dot'},g);
  var b=el('g',{class:'bub',transform:'translate(0,-44)'},g);
  gBub[a.id]={g:b,r:el('rect',{x:-80,y:-18,width:160,height:24,rx:12},b),t:el('text',{y:-2,'text-anchor':'middle'},b,'')};
  place(a,a.x,a.y-16,true);
  g.addEventListener('click',function(){openFicha(a.id)});
  g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openFicha(a.id)}});
 });
 gDesk.luna&&AGENTS.forEach(function(a){gDesk[a.id].addEventListener('click',function(){openFicha(a.id)})});
}
function place(a,x,y,instant){
 var g=gAv[a.id];g.style.transition=(instant||REDUCED)?'none':'transform 1.4s cubic-bezier(.5,0,.2,1)';
 g.style.transform='translate('+x+'px,'+y+'px)';a.px=x;a.py=y;
}
function bubble(a,txt){
 var b=gBub[a.id];
 if(!txt){b.g.classList.remove('on');return}
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
   h('b','',t.title,card);h('small','',a.name+' · '+a.role,card);
   if(c[0]==='revision'){
    var r=h('div','row',null,card);
    var ok=h('button','mini ok','Aprobar',r),no=h('button','mini','Descartar',r);
    ok.addEventListener('click',function(){t.col='hecho';state.approved++;log(null,'aprobó: '+t.done,'ok');drawBoard();kpis()});
    no.addEventListener('click',function(){state.tasks=state.tasks.filter(function(x){return x!==t});log(null,'descartó: '+t.done);drawBoard();kpis()});
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
 [['Agentes en oficina',AGENTS.length],['Tareas en curso',cur],['Para tu revisión',rev],['Tareas simuladas hechas',state.done]].forEach(function(x){
  var d=h('div','kpi',null,k);h('span','',String(x[1]),d);h('small','',x[0],d);
 });
}

/* ---------- MOTOR ---------- */
function start(a,task,fromDirector){
 var def=task||a.work[Math.floor(Math.random()*a.work.length)];
 var t={id:state.nextId++,agent:a.id,title:def[0],done:def[1],review:def[2],col:'curso'};
 state.tasks.push(t);a.task=t;a.st='work';a.t=3+Math.floor(Math.random()*4);
 gDesk[a.id].classList.add('work');gAv[a.id].classList.add('work');
 bubble(a,def[0]);
 if(fromDirector&&a.id!=='luna'){pulse([BY.luna.x,BY.luna.y+30],[a.x,a.y-30],a.c)}
 log(a,def[0].charAt(0).toLowerCase()+def[0].slice(1)+'…');
 drawBoard();kpis();
}
function finish(a){
 var t=a.task;a.task=null;a.st='idle';
 gDesk[a.id].classList.remove('work');gAv[a.id].classList.remove('work');bubble(a,'');
 if(t){
  state.done++;
  if(t.review){t.col='revision';log(a,t.done,'rev');pulse([a.x,a.y-30],[866,120],'#f5c842')}
  else{t.col='hecho';log(a,t.done)}
 }
 drawBoard();kpis();
}
function meeting(){
 var cand=AGENTS.filter(function(a){return a.id!=='luna'&&a.st==='idle'&&!a.away});
 if(cand.length<1)return;
 var a=cand[Math.floor(Math.random()*cand.length)];
 a.away=4;place(a,500+(Math.random()*60-30),195);bubble(a,'Reunión rápida con Luna');
 log(BY.luna,'tiene una reunión rápida con '+a.name);
}
function step(){
 state.tick++;
 AGENTS.forEach(function(a){
  if(a.away>0){a.away--;if(a.away===0){place(a,a.x,a.y-16);bubble(a,'')}return}
  if(a.st==='work'){a.t--;if(a.t<=0)finish(a);return}
  if(a.q.length){start(a,a.q.shift(),true);return}
  if(Math.random()<0.28)start(a,null,false);
 });
 if(state.tick%9===0)meeting();
}
function loop(){
 var wait=state.speed===0?400:(state.speed===2?600:1300);
 if(state.speed>0)step();
 setTimeout(loop,wait);
}

/* ---------- BRIEF ---------- */
var ROUTES=[
 ['sol',/venta|correo|mail|cliente nuevo|prospect|demo|peluquer|restaurante|taller|cl[ií]nica|reforma/i,['Redactando borrador para el brief','Borrador listo para tu aprobación',true]],
 ['vega',/v[ií]deo|reel|youtube|canal|redes|guion|contenido|marketing|instagram/i,['Esbozando contenido para el brief','Contenido listo para tu revisión',true]],
 ['atlas',/seo|google|web|meta|posici|geo|llms/i,['Revisando SEO para el brief','Revisión SEO terminada',false]],
 ['eco',/chat|atenci|consulta|lead|whatsapp|telegram/i,['Preparando respuestas para el brief','Respuestas preparadas',false]],
 ['alba',/alta|onboarding|nuevo cliente|activar|token/i,['Preparando alta para el brief','Alta preparada',false]],
 ['abaco',/factura|gasto|contab|gestor|mes/i,['Ordenando datos para el brief','Datos ordenados',false]],
 ['egida',/segur|rls|clave|contrase|certificado|ciber|supabase/i,['Revisando seguridad para el brief','Revisión de seguridad terminada',false]]
];
$('brief').addEventListener('submit',function(e){
 e.preventDefault();
 var txt=$('brief-t').value.trim();if(!txt)return;
 var plan=$('plan');plan.textContent='';
 var hits=ROUTES.filter(function(r){return r[1].test(txt)});
 if(!hits.length)hits=[ROUTES[0],ROUTES[1]];
 log(BY.luna,'recibe un brief: «'+(txt.length>60?txt.slice(0,59)+'…':txt)+'»');
 pulse([866,120],[BY.luna.x,BY.luna.y],'#f5c842');
 h('p','hint','Plan de Luna ('+hits.length+' tarea'+(hits.length>1?'s':'')+'):',plan);
 hits.forEach(function(r){
  var a=BY[r[0]];a.q.push(r[2]);
  var chip=h('span','chip',a.name+' · '+a.role,plan);chip.style.setProperty('--c',a.c);
 });
 $('brief-t').value='';
});

/* ---------- FICHAS ---------- */
function openFicha(id){
 var a=BY[id],d=$('ficha'),fc=$('fc');fc.textContent='';fc.style.setProperty('--c',a.c);
 var top=h('div','fh',null,fc);
 var av=h('div','fav',a.g,top);
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
 var st=h('div','fb real',null,fc);h('h3','',"Estado real hoy",st);
 var u=h('ul','',null,st);a.real.forEach(function(t){h('li','',t,u)});
 var nx=h('div','fb next',null,fc);h('h3','',"Para hacerlo real",nx);h('p','',a.next,nx);
 if(a.id==='sol'||a.id==='vega'||a.id==='egida'){
  var go=h('a','btn','Abrir su herramienta',fc);go.href=(a.id==='sol'?'#ventas':'#herramientas');
  go.addEventListener('click',function(){
   d.close();
   var map={sol:'t-ventas',vega:'t-marketing',egida:'t-ciber'};
   var b=document.querySelector('#tools-nav button[data-tool="'+map[a.id]+'"]');if(b)b.click();
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
  var top=h('div','tt',null,b);h('span','tav',a.g,top);var w=h('div','',null,top);h('b','',a.name,w);h('small','',a.role,w);
  h('p','',a.mission,b);
  h('span','tag',a.real[0].indexOf('Sin datos')===0||a.real[0].indexOf('Nada')===0?'Solo simulado':'Con parte real',b);
  b.addEventListener('click',function(){openFicha(a.id)});
 });
}

buildMap();buildTeam();drawBoard();kpis();
loop();
log(BY.luna,'abre la oficina. Todo lo que ves son tareas de ejemplo.');
})();
