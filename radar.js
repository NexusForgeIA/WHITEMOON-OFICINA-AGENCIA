/* Radar de prospectos para Sol. Lee prospectos_radar (solo staff) y, con tu visto bueno, prepara el primer contacto.
   Nunca envía nada: cada borrador pasa por Luna y llega a Decisiones para que lo apruebes tú. */
(function(){
function $(i){return document.getElementById(i)}
function h(t,c,x,p){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;if(p)p.appendChild(n);return n}
var list=[],busy=false,autoDone=0,CAP=5,AUTO=3;
function sb(){return window.WM_SB&&window.WM_SB()}
function ready(){return window.WM_DB&&window.WM_DB.ready}
function msg(t){var m=$('r-msg');if(m)m.textContent=t||''}

/* sector libre del Radar -> repo de demo (clave en MAYÚSCULAS como en demos.js) */
var DEMO_BY=[[/electric|reform|fontaner/,'WHITEMOON-REFORMAS-ELECTRICIDAD'],[/peluquer/,'WHITEMOON-PELUQUERIAS'],[/barber/,'WHITEMOON-BARBERIAS'],[/estetic|uñas|unas|belleza/,'WHITEMOON-ESTETICA'],[/dental|dentist/,'WHITEMOON-CLINICAS-DENTALES'],[/fisio/,'WHITEMOON-FISIO'],[/podolog/,'WHITEMOON-PODOLOGOS'],[/veterin/,'WHITEMOON-VETERINARIOS'],[/taller|mecanic|automovil|recambio/,'WHITEMOON-TALLERES-COCHES'],[/mudanz|transporte/,'WHITEMOON-MUDANZAS'],[/abogad/,'WHITEMOON-ABOGADOS'],[/inmobil/,'WHITEMOON-INMOBILIARIAS'],[/restaur/,'WHITEMOON-RESTAURANTE-DEMO']];
var CITA=/peluquer|barber|estetic|uñas|unas|dental|dentist|fisio|podolog|taller|clinic|veterin/;
function esMovil(t){var x=String(t||'').replace(/\D/g,'');if(x.length===11&&x.indexOf('34')===0)x=x.slice(2);return /^[67]\d{8}$/.test(x)}
function nm(p){return String(p.nombre||'').replace(/\s+(S\.?L\.?U?\.?|S\.?A\.?|S\.?C\.?)\s*$/i,'').trim().slice(0,70)}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function demoFor(p){
 var s=norm(p.sector),D=window.WM_DEMOS||[];
 for(var i=0;i<DEMO_BY.length;i++){if(DEMO_BY[i][0].test(s)){
  for(var j=0;j<D.length;j++){if(D[j].repo.toUpperCase()===DEMO_BY[i][1])return D[j]}
 }}
 return null;
}
function producto(p){
 var s=norm(p.sector);
 if(!p.web)return {n:'Core Spark Web',u:'https://whitemoon.es/core/',why:'no tiene web propia'};
 if(CITA.test(s))return {n:'Agente IA Citas',u:'https://whitemoon.es/agente-ia-citas/',why:'negocio de cita previa'};
 return {n:'Spark',u:'https://whitemoon.es/spark/',why:'ya tiene web: se le instala el agente'};
}
function senalesTxt(p){
 var s=p.senales||{},o=[];
 if(s.sin_chatbot)o.push('no vi un asistente que atienda a quien escribe fuera de horario');
 if(s.sin_ssl)o.push('el navegador marca la web como no segura');
 return o;
}
function draft(p,pr,dm){
 var o=senalesTxt(p),n=nm(p);
 var t='Hola, soy Cristóbal, de WhiteMoon (agencia de IA en Majadahonda). ';
 if(!p.web)t+='Buscando '+(p.sector||'negocios como el vuestro')+(p.zona?' en '+p.zona:'')+' no he encontrado una web activa de '+n+'. ';
 else t+='Estuve mirando la web de '+n+(o.length?' y '+o.join('; ')+'. ':'. ');
 t+=pr.n==='Core Spark Web'?'Os podemos montar una web nueva con el asistente ya dentro. ':pr.n==='Agente IA Citas'?'Podemos dejaros un agente que reserve las citas solo, por enlace o QR, sin llamadas. ':'Podemos instalaros un asistente de IA en la web que ya tenéis. ';
 if(dm)t+='Os he dejado un ejemplo de cómo quedaría en un negocio parecido (es una demo): '+dm.url+' ';
 t+='Más info: '+pr.u+' · Sin permanencia. Si os interesa, me contáis y lo vemos; si no, no os molesto más. WhatsApp: 643 199 580.';
 return t;
}
function rec(p,dm,tel){
 if(!esMovil(tel))return ['Posponer','Sin móvil: no hay WhatsApp posible.'];
 if(!dm)return ['Descartar prospecto','No hay demo de su sector. Antes de contactar habría que crear una.'];
 if((p.dolor||0)>=80)return ['Aprobar para enviar','Alta oportunidad ('+p.dolor+'/100), tiene teléfono y hay demo de su sector.'];
 return ['Posponer','Oportunidad media: mejor tras los de más dolor.'];
}
function prepare(p){
 var dm=demoFor(p),pr=producto(p),tel=p.telefono,r=rec(p,dm,tel),d=draft(p,pr,dm);
 var datos={prospecto_id:p.id,nombre:p.nombre,sector:p.sector,zona:p.zona,telefono:tel||null,dolor:p.dolor,producto:pr.n,demo:dm?dm.url:null};
 return window.WM_DB.createTarea({agente:'sol',titulo:'Primer contacto: '+nm(p),resultado:d,estado:'revision',requiere_revision:true,datos:datos}).then(function(tid){
  return window.WM_DB.createDecision({tarea_id:tid,agente:'sol',asunto:'¿Enviar primer contacto a '+nm(p)+'?',
   contexto:(p.sector||'')+' · '+(p.zona||'')+' · dolor '+(p.dolor||0)+'/100 · '+pr.n+' ('+pr.why+')'+(dm?' · demo: '+dm.label:' · sin demo de su sector'),
   resumen_luna:'Sol ha preparado el borrador con señales del Radar (automáticas, sin verificar a mano). Cumple las reglas: sin precios, sin cifras de rendimiento, con salida clara. Enviarlo sale de la oficina, así que lo decides tú.',
   recomendacion:r[0]+'. '+r[1],opciones:['Aprobar para enviar','Descartar prospecto','Posponer']});
 });
}
function viaSol(p){
 var W=window.WMO,n=nm(p);
 if(!W||!W.isReal())return prepare(p);
 return W.work('sol','Preparando el primer contacto para '+n,function(){return prepare(p).then(function(){W.log(W.BY.luna,'recibe de Sol el borrador de '+n+' y lo manda a Decisiones','rev');return{titulo:'Borrador de '+n+' entregado a Luna',resultado:'Pendiente de tu decisión en Decisiones.',persist:false}})},{accion:'radar'});
}
function load(){
 if(!ready())return Promise.resolve();
 msg('Cargando Radar…');
 return (window.WM_DEC?window.WM_DEC.reload():Promise.resolve()).then(function(){return sb().from('prospectos_radar').select('id,nombre,sector,zona,web,telefono,rating,n_resenas,score_auditoria,senales,dolor').eq('estado','analizado').order('dolor',{ascending:false,nullsFirst:false}).limit(120)}).then(function(r){
  if(r.error)throw r.error;
  list=r.data||[];return window.WM_DB.worked();
 }).then(function(w){
  var done={};w.forEach(function(x){if(x.datos&&x.datos.prospecto_id)done[x.datos.prospecto_id]=1});
  var k=window.WM_DEC&&window.WM_DEC.knownProspects()||{};Object.keys(k).forEach(function(i){done[i]=1});
  list.forEach(function(p){p._done=!!done[p.id]});
  msg('');draw();auto();
 }).catch(function(e){msg('No se pudo leer el Radar: '+(e.message||e))});
}
function pick(n){return list.filter(function(p){return !p._done&&esMovil(p.telefono)}).slice(0,n)}
function run(n,manual){
 if(busy||!ready())return;
 var room=CAP-(window.WM_DEC?window.WM_DEC.pendingReal():0);
 if(room<=0){msg('Ya tienes '+CAP+' decisiones pendientes: resuélvelas y Sol seguirá.');return}
 var todo=pick(Math.min(n,room));
 if(!todo.length){msg('No quedan prospectos con móvil sin trabajar.');return}
 busy=true;var i=0;
 (function next(){
  if(i>=todo.length){busy=false;msg('Sol ha preparado '+todo.length+' borrador(es). Míralos en Decisiones.');if(window.WM_DEC)window.WM_DEC.reload();draw();return}
  var p=todo[i++];
  viaSol(p).then(function(){p._done=true;next()}).catch(function(e){busy=false;msg('Error al preparar: '+(e.message||e))});
 })();
}
function auto(){
 if(autoDone||!window.WM_DEMOS||!window.WM_DEMOS.length)return;
 autoDone=1;setTimeout(function(){run(AUTO,false)},1500);
}
function draw(){
 var off=$('r-off'),app=$('r-app');if(!off)return;
 var on=!!ready();off.hidden=on;app.hidden=!on;if(!on)return;
 var k=$('r-kpis');k.textContent='';
 var tel=list.filter(function(p){return esMovil(p.telefono)}).length,hechos=list.filter(function(p){return p._done}).length;
 [[list.length,'Analizados (los 120 con más dolor)'],[tel,'Con móvil (WhatsApp)'],[hechos,'Ya trabajados por Sol'],[window.WM_DEC?window.WM_DEC.pendingReal():0,'Esperan tu decisión']].forEach(function(x){var d=h('div','kpi',null,k);h('span','',String(x[0]),d);h('small','',x[1],d)});
 var l=$('r-list');l.textContent='';
 if(!list.length)h('p','empty','No hay prospectos analizados.',l);
 list.slice(0,60).forEach(function(p){
  var q=h('div','q'+(p._done?' done':''),null,l);
  var w=h('div','',null,q);h('b','',nm(p),w);
  var dm=demoFor(p);
  h('span','',' '+(p.sector||'')+' · '+(p.zona||'')+' · dolor '+(p.dolor==null?'—':p.dolor)+(p.telefono?(esMovil(p.telefono)?' · móvil':' · fijo (sin WhatsApp)'):' · sin teléfono')+(dm?' · demo: '+dm.label:' · sin demo'),w);
  if(p._done)h('span','',' · trabajado',q);
  else if(esMovil(p.telefono)){var b=h('button','',"Pedir a Sol",q);b.type='button';b.addEventListener('click',function(){
   if(busy)return;busy=true;b.disabled=true;
   viaSol(p).then(function(){p._done=true;busy=false;if(window.WM_DEC)window.WM_DEC.reload();draw()}).catch(function(e){busy=false;b.disabled=false;msg('Error: '+(e.message||e))});
  })}
 });
}
document.addEventListener('wm-db-ready',function(){setTimeout(load,800)});
document.addEventListener('wm-auth',function(){if(!window.WM_AUTH){list=[];autoDone=0;draw()}});
var rl=$('r-reload');if(rl)rl.addEventListener('click',function(){load()});
draw();
})();
