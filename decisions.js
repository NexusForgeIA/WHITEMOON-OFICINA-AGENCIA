/* Bandeja de decisiones: lo que los agentes no pueden decidir solos llega aquí, resumido por Luna.
   Con sesión de staff se guarda en Supabase (oficina_decisiones). Sin sesión, solo se ven ejemplos simulados y se marcan como tales. */
(function(){
function $(i){return document.getElementById(i)}
function h(t,c,x,p){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;if(p)p.appendChild(n);return n}
var rows=[],sims=[],simId=0;
var NAMES={luna:'Luna',sol:'Sol',vega:'Vega',atlas:'Atlas',eco:'Eco',alba:'Alba',abaco:'Ábaco',egida:'Égida',nova:'Nova',aura:'Aura',lira:'Lira',rigel:'Rigel'};

function pendientes(){return rows.filter(function(r){return r.estado==='pendiente'}).concat(sims.filter(function(r){return r.estado==='pendiente'}))}
function badge(){
 var n=pendientes().length,b=$('dec-n');
 if(b){b.hidden=!n;b.textContent=String(n)}
 window.WM_DEC_N=n;if(window.WMO)window.WMO.kpis();
}
function card(r,parent,done,send){
 var c=h('article','dec'+(r.sim?' sim':'')+(done?' done':''),null,parent);
 var top=h('div','dec-top',null,c);
 h('b','',r.asunto,top);
 h('small','',(NAMES[r.agente]||r.agente||'Agente')+(r.sim?' · EJEMPLO simulado':'')+(r.created_at?' · '+new Date(r.created_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''),top);
 if(r.contexto)h('p','dec-ctx',r.contexto,c);
 if(r.resumen_luna){var l=h('p','dec-luna',null,c);h('b','','Luna: ',l);l.appendChild(document.createTextNode(r.resumen_luna))}
 if(r.recomendacion){var rc=h('p','dec-rec',null,c);h('b','','Recomienda: ',rc);rc.appendChild(document.createTextNode(r.recomendacion))}
 var d=r.tarea&&r.tarea.datos,draft=r.tarea&&r.tarea.resultado;
 var tm=d&&d.telefono&&String(d.telefono).replace(/\D/g,'');if(tm&&tm.length===11&&tm.indexOf('34')===0)tm=tm.slice(2);
 if(d&&d.emails&&d.emails.length&&!(tm&&/^[67]\d{8}$/.test(tm)))draft=null;
 if(draft){
  var det=h('details','dec-draft',null,c);if(send)det.open=true;h('summary','',send?'Borrador para enviar (editable)':'Borrador preparado (no se ha enviado nada)',det);
  var ta=h('textarea','',null,det);ta.value=draft;ta.rows=send?10:9;ta.readOnly=!send;
  var rr=h('div','row',null,det);
  var cp=h('button','mini','Copiar',rr);cp.type='button';cp.addEventListener('click',function(){
   (navigator.clipboard?navigator.clipboard.writeText(ta.value):Promise.reject()).then(function(){cp.textContent='Copiado'}).catch(function(){ta.select();cp.textContent='Selecciona y copia'})});
  var tel=d&&d.telefono&&String(d.telefono).replace(/[^\d]/g,'');
  if(tel&&tel.length===11&&tel.indexOf('34')===0)tel=tel.slice(2);
  var movil=!!tel&&/^[67]\d{8}$/.test(tel);
  if(tel&&!movil){var fj=h('a','mini','Llamar (fijo, sin WhatsApp)',rr);fj.href='tel:+34'+tel;h('small','hint','Es un teléfono fijo: no se puede enviar por WhatsApp. Cópialo para email/llamada o busca su móvil.',det)}
  if(movil){tel='34'+tel;var wa=h('a','mini','Abrir en WhatsApp',rr);wa.href='https://wa.me/'+tel+'?text='+encodeURIComponent(ta.value);wa.target='_blank';wa.rel='noopener';wa.addEventListener('click',function(){wa.href='https://wa.me/'+tel+'?text='+encodeURIComponent(ta.value)})}else if(send)h('small','hint','Sin teléfono guardado: cópialo y envíalo por otro canal.',rr)
  h('small','hint','Revisa tú la señal en su web antes de enviar. Lo envías tú, desde tu móvil: la oficina no manda nada.',det);
 }
 if(d&&d.emails&&d.emails.length){
  var eb=h('details','dec-draft',null,c);if(send)eb.open=true;h('summary','','Correo para enviar (editable)',eb);
  var dest=h('p','dec-ctx','Para: '+d.emails.map(function(e){return e.email+(e.tipo==='personal'?' (parece personal: revisa antes)':'')}).join(' · '),eb);
  var as=h('input','',null,eb);as.type='text';as.value=d.email_asunto||'';as.setAttribute('aria-label','Asunto');
  var cu=h('textarea','',null,eb);cu.value=d.email_cuerpo||'';cu.rows=11;
  var er=h('div','row',null,eb);
  function cp(txt,b,l){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){b.textContent='Copiado'}).catch(function(){b.textContent='Selecciona y copia'});setTimeout(function(){b.textContent=l},1800)}
  var c1=h('button','mini','Copiar dirección',er);c1.type='button';c1.addEventListener('click',function(){cp(d.emails[0].email,c1,'Copiar dirección')});
  var c2=h('button','mini','Copiar asunto',er);c2.type='button';c2.addEventListener('click',function(){cp(as.value,c2,'Copiar asunto')});
  var c3=h('button','mini','Copiar cuerpo',er);c3.type='button';c3.addEventListener('click',function(){cp(cu.value,c3,'Copiar cuerpo')});
  var ml=h('a','mini','Abrir en mi correo',er);ml.href='#';ml.addEventListener('click',function(){ml.href='mailto:'+d.emails[0].email+'?subject='+encodeURIComponent(as.value)+'&body='+encodeURIComponent(cu.value)});
  h('small','hint','El correo termina en «Un saludo,». Antes de enviar, añade tu firma desde el menú Firmas del correo.',eb);
 }
 if(!draft&&d&&d.telefono){
  var t2=String(d.telefono).replace(/[^\d]/g,'');if(t2.length===11&&t2.indexOf('34')===0)t2=t2.slice(2);
  var rr2=h('div','row',null,c);
  if(/^[67]\d{8}$/.test(t2)){var w2=h('a','mini','Abrir en WhatsApp',rr2);w2.href='https://wa.me/34'+t2;w2.target='_blank';w2.rel='noopener'}
  var l2=h('a','mini','Llamar '+d.telefono,rr2);l2.href='tel:+34'+t2;
 }
 if(send){
  var sr=h('div','row',null,c);var env=h('button','btn',(draft||(d&&d.emails&&d.emails.length))?'Marcar como enviado':'Marcar como atendido',sr);env.type='button';
  env.addEventListener('click',function(){decide(r,(draft||(d&&d.emails&&d.emails.length))?'Enviado':'Atendido','')});return c;
 }
 if(done){
  h('p','dec-res','Decidido: '+(r.decision||'—')+(r.nota?' · '+r.nota:''),c);
  return c;
 }
 var nota=h('input','',null,c);nota.type='text';nota.placeholder='Nota para el equipo (opcional)';nota.setAttribute('aria-label','Nota opcional');
 var row=h('div','row',null,c);
 (r.opciones||[]).forEach(function(o,i){
  var b=h('button','btn'+(i?' ghost':''),o,row);b.type='button';
  b.addEventListener('click',function(){decide(r,o,nota.value)});
 });
 return c;
}
function decide(r,opt,nota){
 function after(){
  r.estado='decidida';r.decision=opt;r.nota=nota||null;
  if(window.WMO)window.WMO.log(null,'decidió «'+opt+'»: '+r.asunto,'ok');
  draw();
 }
 if(r.sim){after();return}
 window.WM_DB.decide(r.id,opt,nota).then(function(){
  after();
  if(r.tarea&&r.tarea.datos&&r.tarea.datos.lead_id&&/atendid/i.test(opt))window.WM_DB.markLead(r.tarea.datos.lead_id);
  if(r.tarea_id){window.WM_DB.setEstado(r.tarea_id,/descart/i.test(opt)?'descartada':(/aprob|enviado|atendid|lo contacto/i.test(opt)?'hecha':'revision'))}
 }).catch(function(e){alert('No se pudo guardar la decisión: '+(e.message||e))});
}
function canal(r){
 var d=r.tarea&&r.tarea.datos;if(!d)return null;
 var t=d.telefono&&String(d.telefono).replace(/\D/g,'');if(t&&t.length===11&&t.indexOf('34')===0)t=t.slice(2);
 var mov=!!t&&/^[67]\d{8}$/.test(t),em=d.emails&&d.emails.length;
 if(em&&!mov)return 'mail';
 if(mov)return 'wa';
 if(t||d.lead_id||d.prospecto_id)return 'tel';
 return null;
}
function draw(){
 var p=$('dec-pend'),d=$('dec-done');if(!p)return;p.textContent='';d.textContent='';
 var cols={tel:$('dec-tel'),wa:$('dec-wa'),mail:$('dec-mail')},cnt={tel:0,wa:0,mail:0};
 for(var k in cols)cols[k].textContent='';
 var sends=rows.filter(function(r){return r.estado==='decidida'&&/^(aprob|lo contacto)/i.test(r.decision||'')});
 var otras=[];
 sends.forEach(function(r){var c=canal(r)||'tel';cnt[c]++;card(r,cols[c],false,true)});
 pendientes().forEach(function(r){var c=r.sim?null:canal(r);if(c){cnt[c]++;card(r,cols[c],false)}else otras.push(r)});
 for(var k in cols){if(!cnt[k])h('p','empty','Nada por ahora.',cols[k]);var n=$('dc-'+k);if(n)n.textContent=String(cnt[k])}
 if(!otras.length)h('p','empty','Nada pendiente. Cuando un agente no pueda decidir solo, aparecerá aquí.',p);
 otras.forEach(function(r){card(r,p,false)});
 var dn=rows.concat(sims).filter(function(r){return r.estado==='decidida'&&!/^(aprob|lo contacto)/i.test(r.decision||'')});
 if(!dn.length)h('p','empty','Todavía no has decidido nada.',d);
 dn.slice(0,20).forEach(function(r){card(r,d,true)});
 badge();
}
function safeDraw(){
 var a=document.activeElement,v=$('decisiones');
 if(a&&/^(TEXTAREA|INPUT)$/.test(a.tagName)&&v&&v.contains(a)){a.addEventListener('blur',function(){draw()},{once:true});badge();return}
 draw();
}
function load(){
 if(!window.WM_DB||!window.WM_DB.ready)return Promise.resolve();
 return window.WM_DB.loadDecisiones().then(function(r){rows=r;safeDraw()}).catch(function(e){console.warn('decisiones:',e.message||e)});
}
/* API para radar.js */
window.WM_DEC={
 reload:load,
 pendingReal:function(){return rows.filter(function(r){return r.estado==='pendiente'}).length},
 knownLeads:function(){var o={};rows.forEach(function(r){var d=r.tarea&&r.tarea.datos;if(d&&d.lead_id)o[d.lead_id]=1});return o},
 knownProspects:function(){var o={};rows.forEach(function(r){var d=r.tarea&&r.tarea.datos;if(d&&d.prospecto_id)o[d.prospecto_id]=1});return o}
};
document.addEventListener('wm-db-ready',function(){sims=[];load()});
window.addEventListener('hashchange',function(){if(location.hash==='#decisiones')load()});
document.addEventListener('wm-auth',function(){if(!window.WM_AUTH){rows=[];draw()}});
/* Decisiones simuladas que Luna escala en la simulación (se marcan siempre como ejemplo y no se guardan) */
document.addEventListener('wm-sim-decision',function(ev){
 var d=ev.detail;if(sims.filter(function(s){return s.estado==='pendiente'}).length>=3)return;
 sims.unshift({sim:true,id:'s'+(++simId),estado:'pendiente',agente:d.agente,asunto:d.asunto,contexto:d.contexto,resumen_luna:d.resumen,recomendacion:d.rec,opciones:d.opciones,created_at:new Date().toISOString()});
 draw();
});
draw();
})();
