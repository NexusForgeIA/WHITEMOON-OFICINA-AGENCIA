/* Radar de prospectos para Sol. Lee prospectos_radar (solo staff) y, con tu visto bueno, prepara el primer contacto.
   Nunca envía nada: cada borrador pasa por Luna y llega a Decisiones para que lo apruebes tú. */
(function(){
function $(i){return document.getElementById(i)}
function h(t,c,x,p){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;if(p)p.appendChild(n);return n}
var list=[],busy=false;
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
function emailDraft(p,pr,dm){
 var n=nm(p),o=senalesTxt(p);
 var b='Hola,\n\nSoy Cristóbal Martínez, de WhiteMoon Agencia IA (Majadahonda). ';
 b+=p.web?('He estado mirando la web de '+n+(o.length?' y '+o.join('; ')+'.':'.')):('Buscando '+(p.sector||'negocios como el vuestro')+(p.zona?' en '+p.zona:'')+' no he encontrado una web activa de '+n+'.');
 b+='\n\n'+(pr.n==='Core Spark Web'?'Os podemos montar una web nueva con el asistente de IA ya dentro.':pr.n==='Agente IA Citas'?'Podemos dejaros un agente que reserve las citas solo, por enlace o QR, sin llamadas.':'Podemos instalaros un asistente de IA en la web que ya tenéis.');
 if(dm)b+='\n\nPodéis ver un ejemplo aquí (es una demo, no un cliente real): '+dm.url;
 b+='\n\nMás información: '+pr.u+' · Sin permanencia.\n\nSi os interesa, respondedme a este correo o escribidme por WhatsApp al 643 199 580. Si preferís que no os escriba más, decídmelo y no vuelvo a contactaros.\n\nUn saludo,';
 return {asunto:'Una idea para '+n,cuerpo:b};
}
function rec(p,dm,tel,ems){
 if(!esMovil(tel)&&!(ems&&ems.length))return ['Posponer','Sin móvil ni correo: no hay canal directo.'];
 if(!dm)return ['Descartar prospecto','No hay demo de su sector. Antes de contactar habría que crear una.'];
 if((p.dolor||0)>=80)return ['Aprobar para enviar','Alta oportunidad ('+p.dolor+'/100), canal: '+(esMovil(tel)?'WhatsApp':'')+(esMovil(tel)&&ems&&ems.length?' y ':'')+(ems&&ems.length?'correo':'')+(dm?' y hay demo de su sector.':'.')];
 return ['Posponer','Oportunidad media: mejor tras los de más dolor.'];
}
function prepare(p,ems){
 ems=ems||[];
 var dm=demoFor(p),pr=producto(p),tel=p.telefono,r=rec(p,dm,tel,ems),ed=ems.length?emailDraft(p,pr,dm):null;
 var d=esMovil(tel)?draft(p,pr,dm):(ed?ed.cuerpo:draft(p,pr,dm));
 var datos={prospecto_id:p.id,nombre:p.nombre,sector:p.sector,zona:p.zona,telefono:tel||null,dolor:p.dolor,producto:pr.n,demo:dm?dm.url:null,triage:'posible_venta'};
 if(ems.length){datos.emails=ems;datos.email_asunto=ed.asunto;datos.email_cuerpo=ed.cuerpo}
 if(p.web)datos.fc=1;
 return window.WM_DB.createTarea({agente:'sol',titulo:'Primer contacto: '+nm(p),resultado:d,estado:'revision',requiere_revision:true,datos:datos}).then(function(tid){
  return window.WM_DB.createDecision({tarea_id:tid,agente:'sol',asunto:'¿Enviar primer contacto a '+nm(p)+'?',
   contexto:(p.sector||'')+' · '+(p.zona||'')+' · dolor '+(p.dolor||0)+'/100 · '+pr.n+' ('+pr.why+')'+(dm?' · demo: '+dm.label:' · sin demo de su sector'),
   resumen_luna:'Sol lo ha evaluado y cree que es una posible venta: oportunidad alta, canal de contacto (móvil y/o correo de su web) y demo de su sector. Las señales del Radar son automáticas y sin verificar a mano. El borrador no lleva precios ni cifras de rendimiento y tiene salida clara. Enviarlo sale de la oficina, así que lo decides tú.',
   recomendacion:r[0]+'. '+r[1],opciones:['Aprobar para enviar','Descartar prospecto','Posponer']});
 });
}
function viaSol(p){
 var W=window.WMO,n=nm(p);
 if(!W||!W.isReal())return prepare(p);
 return W.work('sol','Preparando el primer contacto para '+n,function(){return prepare(p).then(function(){if(window.WM_DEC)window.WM_DEC.reload();W.log(W.BY.luna,'recibe de Sol el borrador de '+n+' y lo manda a Decisiones','rev');return{titulo:'Borrador de '+n+' entregado a Luna',resultado:'Pendiente de tu decisión en Decisiones.',persist:false}})},{accion:'radar'});
}
function load(){
 if(!ready())return Promise.resolve();
 msg('Cargando Radar…');
 return (window.WM_DEC?window.WM_DEC.reload():Promise.resolve()).then(function(){return sb().from('prospectos_radar').select('id,nombre,sector,zona,web,telefono,rating,n_resenas,score_auditoria,senales,dolor').eq('estado','analizado').order('dolor',{ascending:false,nullsFirst:false}).limit(120)}).then(function(r){
  if(r.error)throw r.error;
  list=r.data||[];
  /* descartados en Scout sin web y con móvil: los de más oportunidad (se leen, no se modifican) */
  return sb().from('prospectos_radar').select('id,nombre,sector,zona,web,telefono,rating,n_resenas,score_auditoria,senales,dolor').eq('estado','descartado').is('web',null).order('n_resenas',{ascending:false,nullsFirst:false}).limit(200);
 }).then(function(r2){
  if(r2.error)throw r2.error;
  var seen={};list.forEach(function(p){seen[p.id]=1});
  (r2.data||[]).forEach(function(p){if(!seen[p.id]&&esMovil(p.telefono)){p._rec=true;list.push(p)}});
  list.sort(function(a,b){return (b.dolor||0)-(a.dolor||0)||(b.n_resenas||0)-(a.n_resenas||0)});
  return window.WM_DB.worked();
 }).then(function(w){
  var done={};w.forEach(function(x){if(x.datos&&x.datos.prospecto_id)done[x.datos.prospecto_id]=1});
  var k=window.WM_DEC&&window.WM_DEC.knownProspects()||{};Object.keys(k).forEach(function(i){done[i]=1});
  list.forEach(function(p){p._done=!!done[p.id]});
  msg('');draw();startTriage();leads();
 }).catch(function(e){msg('No se pudo leer el Radar: '+(e.message||e))});
}
var tri=false,TRIAGE_MAX=40,delay=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
function motivoBase(p,dm){
 if((p.dolor||0)<80)return 'oportunidad media ('+(p.dolor==null?'sin dato':p.dolor+'/100')+')';
 if(!dm&&p.web)return 'no hay demo de su sector ('+(p.sector||'sin sector')+')';
 if(!p.web&&!esMovil(p.telefono))return p.telefono?'sin web y con teléfono fijo: sin canal':'sin web ni teléfono: sin canal';
 return null;
}
/* Sol evalúa un prospecto: revisa su web (Firecrawl) para encontrar correo; si hay canal, prepara borrador y se lo pasa a Cris; si no, lo descarta con motivo */
function evaluar(p){
 var W=window.WMO,n=nm(p),dm=demoFor(p),m=motivoBase(p,dm);
 return W.work('sol',(p.web&&!m?'Revisando la web de ':'Evaluando a ')+n,function(){
  function descarta(mm){return window.WM_DB.createTarea({agente:'sol',titulo:'Descartado por Sol: '+n,resultado:'Motivo: '+mm+'.',estado:'descartada',requiere_revision:false,datos:{prospecto_id:p.id,nombre:p.nombre,sector:p.sector,zona:p.zona,telefono:p.telefono||null,dolor:p.dolor,triage:'descartado',motivo:mm,fc:p.web&&!m?1:undefined}}).then(function(){return{titulo:'Descartado: '+n+' ('+mm+')',resultado:'',persist:false}})}
  if(m)return delay(2500).then(function(){return descarta(m)});
  var ep=p.web?window.WM_DB.correos(p.web).then(function(x){return x.emails||[]}).catch(function(e){console.warn('correos:',e.message||e);return []}):Promise.resolve([]);
  return Promise.all([ep,delay(3200)]).then(function(x){
   var ems=x[0];
   if(!esMovil(p.telefono)&&!ems.length)return descarta(p.telefono?'teléfono fijo y no encontré correo en su web':'sin móvil y no encontré correo en su web');
   return prepare(p,ems).then(function(){if(window.WM_DEC)window.WM_DEC.reload();W.log(W.BY.luna,'recibe de Sol una posible venta: '+n+(ems.length?' (con correo)':''),'rev');return{titulo:'Posible venta: '+n+(ems.length?' · '+ems[0].email:''),resultado:'Pendiente de tu decisión.',persist:false}});
  });
 },{accion:'triaje'}).then(function(){p._done=true});
}
function startTriage(){
 if(tri||!ready()||!window.WMO||!window.WMO.isReal()||!window.WM_DEMOS||!window.WM_DEMOS.length)return;
 var cola=list.filter(function(p){return !p._done}).slice(0,TRIAGE_MAX);
 if(!cola.length)return;
 tri=true;var i=0;
 (function next(){
  if(i>=cola.length||!ready()){tri=false;draw();return}
  evaluar(cola[i++]).then(function(){if(i%5===0)draw();next()}).catch(function(e){tri=false;msg('Error al evaluar: '+(e.message||e))});
 })();
}
/* Leads que llegan por los chatbots: la venta más caliente, directos a Cris */
var leadsBusy=false;
function leads(){
 if(leadsBusy||!ready()||!window.WMO||!window.WMO.isReal())return;
 leadsBusy=true;
 Promise.all([window.WM_DB.leadsPendientes(),window.WM_DB.worked()]).then(function(x){
  var known={};x[1].forEach(function(t){if(t.datos&&t.datos.lead_id)known[t.datos.lead_id]=1});
  var k=window.WM_DEC&&window.WM_DEC.knownLeads?window.WM_DEC.knownLeads():{};Object.keys(k).forEach(function(i){known[i]=1});
  var nuevos=x[0].filter(function(l){return !known[l.id]}).slice(0,5);
  var chain=Promise.resolve();
  nuevos.forEach(function(l){
   chain=chain.then(function(){return window.WMO.work('sol','Revisando el lead de '+(l.nombre||'un chatbot'),function(){
    return window.WM_DB.createTarea({agente:'sol',titulo:'Lead entrante: '+(l.nombre||'sin nombre'),resultado:l.mensaje||'',estado:'revision',requiere_revision:true,datos:{lead_id:l.id,nombre:l.nombre,sector:l.sector,telefono:l.telefono||null,triage:'posible_venta',entrante:true}}).then(function(tid){
     return window.WM_DB.createDecision({tarea_id:tid,agente:'sol',asunto:'Lead entrante: '+(l.nombre||'sin nombre')+(l.sector?' ('+l.sector+')':''),
      contexto:'Ha escrito en un chatbot de WhiteMoon'+(l.origen?' ('+l.origen+')':'')+' el '+String(l.created_at||'').slice(0,10)+(l.mensaje?'. Mensaje: '+String(l.mensaje).slice(0,300):'.'),
      resumen_luna:'Es una persona que ha dejado sus datos por iniciativa propia: es la venta más caliente que hay. Conviene responder en minutos.',
      recomendacion:'Contactar hoy mismo'+(l.telefono?' por WhatsApp o llamada.':'; no dejó teléfono.'),opciones:['Lo contacto yo','Ya atendido','Descartar']});
    }).then(function(){window.WMO.log(window.WMO.BY.luna,'recibe de Sol un lead entrante: '+(l.nombre||'sin nombre'),'rev');return{titulo:'Lead entrante pasado a Cris: '+(l.nombre||'sin nombre'),resultado:'',persist:false}});
   },{accion:'lead'})});
  });
  return chain;
 }).catch(function(e){console.warn('leads:',e.message||e)}).then(function(){leadsBusy=false;if(window.WM_DEC)window.WM_DEC.reload()});
}
function draw(){
 var off=$('r-off'),app=$('r-app');if(!off)return;
 var on=!!ready();off.hidden=on;app.hidden=!on;if(!on)return;
 var k=$('r-kpis');k.textContent='';
 var tel=list.filter(function(p){return esMovil(p.telefono)}).length,hechos=list.filter(function(p){return p._done}).length;
 [[list.length,'Prospectos cargados (analizados + sin web con móvil)'],[tel,'Con móvil (WhatsApp)'],[hechos,'Ya trabajados por Sol'],[window.WM_DEC?window.WM_DEC.pendingReal():0,'Esperan tu decisión']].forEach(function(x){var d=h('div','kpi',null,k);h('span','',String(x[0]),d);h('small','',x[1],d)});
 var l=$('r-list');l.textContent='';
 if(!list.length)h('p','empty','No hay prospectos cargados.',l);
 list.filter(function(p){return !p._done}).slice(0,60).concat(list.filter(function(p){return p._done}).slice(0,10)).forEach(function(p){
  var q=h('div','q'+(p._done?' done':''),null,l);
  var w=h('div','',null,q);h('b','',nm(p),w);
  var dm=demoFor(p);
  h('span','',' '+(p.sector||'')+' · '+(p.zona||'')+' · dolor '+(p.dolor==null?'—':p.dolor)+(p.telefono?(esMovil(p.telefono)?' · móvil':' · fijo (sin WhatsApp)'):' · sin teléfono')+(p._rec?' · sin web, descartado en Scout':(!p.web?' · sin web':''))+(dm?' · demo: '+dm.label:' · sin demo'),w);
  if(p._done)h('span','',' · trabajado',q);
  else if(esMovil(p.telefono)){var b=h('button','',"Pedir a Sol",q);b.type='button';b.addEventListener('click',function(){
   if(busy)return;busy=true;b.disabled=true;
   viaSol(p).then(function(){p._done=true;busy=false;if(window.WM_DEC)window.WM_DEC.reload();draw()}).catch(function(e){busy=false;b.disabled=false;msg('Error: '+(e.message||e))});
  })}
 });
}
document.addEventListener('wm-db-ready',function(){setTimeout(load,800)});
document.addEventListener('wm-auth',function(){if(!window.WM_AUTH){list=[];draw()}});
setInterval(function(){if(ready()&&window.WMO&&window.WMO.isReal()&&!tri){load()}},10*60e3);
setInterval(function(){leads()},4*60e3);
var rl=$('r-reload');if(rl)rl.addEventListener('click',function(){load()});
draw();
})();
