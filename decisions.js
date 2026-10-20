/* Bandeja de decisiones: lo que los agentes no pueden decidir solos llega aquí, resumido por Luna.
   Con sesión de staff se guarda en Supabase (oficina_decisiones). Sin sesión, solo se ven ejemplos simulados y se marcan como tales. */
(function(){
function $(i){return document.getElementById(i)}
function h(t,c,x,p){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;if(p)p.appendChild(n);return n}
var rows=[],sims=[],simId=0;
var NAMES={luna:'Luna',sol:'Sol',vega:'Vega',atlas:'Atlas',eco:'Eco',alba:'Alba',abaco:'Ábaco',egida:'Égida'};

function pendientes(){return rows.filter(function(r){return r.estado==='pendiente'}).concat(sims.filter(function(r){return r.estado==='pendiente'}))}
function badge(){
 var n=pendientes().length,b=$('dec-n');
 if(b){b.hidden=!n;b.textContent=String(n)}
 window.WM_DEC_N=n;if(window.WMO)window.WMO.kpis();
}
function card(r,parent,done){
 var c=h('article','dec'+(r.sim?' sim':'')+(done?' done':''),null,parent);
 var top=h('div','dec-top',null,c);
 h('b','',r.asunto,top);
 h('small','',(NAMES[r.agente]||r.agente||'Agente')+(r.sim?' · EJEMPLO simulado':'')+(r.created_at?' · '+new Date(r.created_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''),top);
 if(r.contexto)h('p','dec-ctx',r.contexto,c);
 if(r.resumen_luna){var l=h('p','dec-luna',null,c);h('b','','Luna: ',l);l.appendChild(document.createTextNode(r.resumen_luna))}
 if(r.recomendacion){var rc=h('p','dec-rec',null,c);h('b','','Recomienda: ',rc);rc.appendChild(document.createTextNode(r.recomendacion))}
 var d=r.tarea&&r.tarea.datos,draft=r.tarea&&r.tarea.resultado;
 if(draft){
  var det=h('details','dec-draft',null,c);h('summary','','Borrador preparado (no se ha enviado nada)',det);
  var ta=h('textarea','',null,det);ta.value=draft;ta.rows=9;ta.readOnly=true;
  var rr=h('div','row',null,det);
  var cp=h('button','mini','Copiar',rr);cp.type='button';cp.addEventListener('click',function(){
   (navigator.clipboard?navigator.clipboard.writeText(draft):Promise.reject()).then(function(){cp.textContent='Copiado'}).catch(function(){ta.select();cp.textContent='Selecciona y copia'})});
  var tel=d&&d.telefono&&String(d.telefono).replace(/[^\d]/g,'');
  if(tel){if(tel.length===9)tel='34'+tel;var wa=h('a','mini','Abrir en WhatsApp',rr);wa.href='https://wa.me/'+tel+'?text='+encodeURIComponent(draft);wa.target='_blank';wa.rel='noopener'}
  h('small','hint','Revisa tú la señal en su web antes de enviar. Lo envías tú, desde tu móvil: la oficina no manda nada.',det);
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
  if(r.tarea_id){window.WM_DB.setEstado(r.tarea_id,/descart/i.test(opt)?'descartada':(/aprob/i.test(opt)?'hecha':'revision'))}
 }).catch(function(e){alert('No se pudo guardar la decisión: '+(e.message||e))});
}
function draw(){
 var p=$('dec-pend'),d=$('dec-done');if(!p)return;p.textContent='';d.textContent='';
 var pend=pendientes();
 if(!pend.length)h('p','empty','Nada pendiente. Cuando un agente no pueda decidir solo, aparecerá aquí.',p);
 pend.forEach(function(r){card(r,p,false)});
 var dn=rows.concat(sims).filter(function(r){return r.estado==='decidida'});
 if(!dn.length)h('p','empty','Todavía no has decidido nada.',d);
 dn.slice(0,20).forEach(function(r){card(r,d,true)});
 badge();
}
function load(){
 if(!window.WM_DB||!window.WM_DB.ready)return Promise.resolve();
 return window.WM_DB.loadDecisiones().then(function(r){rows=r;draw()}).catch(function(e){console.warn('decisiones:',e.message||e)});
}
/* API para radar.js */
window.WM_DEC={
 reload:load,
 pendingReal:function(){return rows.filter(function(r){return r.estado==='pendiente'}).length},
 knownProspects:function(){var o={};rows.forEach(function(r){var d=r.tarea&&r.tarea.datos;if(d&&d.prospecto_id)o[d.prospecto_id]=1});return o}
};
document.addEventListener('wm-db-ready',function(){sims=[];load()});
document.addEventListener('wm-auth',function(){if(!window.WM_AUTH){rows=[];draw()}});
/* Decisiones simuladas que Luna escala en la simulación (se marcan siempre como ejemplo y no se guardan) */
document.addEventListener('wm-sim-decision',function(ev){
 var d=ev.detail;if(sims.filter(function(s){return s.estado==='pendiente'}).length>=3)return;
 sims.unshift({sim:true,id:'s'+(++simId),estado:'pendiente',agente:d.agente,asunto:d.asunto,contexto:d.contexto,resumen_luna:d.resumen,recomendacion:d.rec,opciones:d.opciones,created_at:new Date().toISOString()});
 draw();
});
draw();
})();
