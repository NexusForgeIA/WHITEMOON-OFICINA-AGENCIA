/* Ver todo: historial real de lo que hacen los agentes (oficina_tareas), con filtros y resultados. Solo lectura. */
(function(){
function $(i){return document.getElementById(i)}
function h(t,c,x,p){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;if(p)p.appendChild(n);return n}
var rows=[],flt='todos',NAMES={luna:'Luna',sol:'Sol',vega:'Vega',atlas:'Atlas',eco:'Eco',alba:'Alba',abaco:'Ábaco',egida:'Égida',nova:'Nova',aura:'Aura',lira:'Lira',rigel:'Rigel'};
function ready(){return window.WM_DB&&window.WM_DB.ready}
function hora(s){return new Date(s).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function draw(){
 var off=$('t-off'),app=$('t-app');if(!off)return;
 var on=!!ready();off.hidden=on;app.hidden=!on;if(!on)return;
 var hoy=new Date();hoy.setHours(0,0,0,0);
 var hot=rows.filter(function(r){return r.datos&&r.datos.triage==='posible_venta'}).length;
 var des=rows.filter(function(r){return r.datos&&r.datos.triage==='descartado'}).length;
 var dh=rows.filter(function(r){return new Date(r.created_at)>=hoy}).length;
 var k=$('t-kpis');k.textContent='';
 [[dh,'Registros hoy'],[hot,'Posibles ventas pasadas a Cris'],[des,'Descartados por Sol (con motivo)'],[rows.length,'Últimos registros']].forEach(function(x){var d=h('div','kpi',null,k);h('span','',String(x[0]),d);h('small','',x[1],d)});
 var ch=$('t-chips');ch.textContent='';
 [['todos','Todos'],['ventas','Posibles ventas'],['descartados','Descartados']].concat(Object.keys(NAMES).map(function(a){return [a,NAMES[a]]})).forEach(function(f){
  var b=h('button','chip-f'+(flt===f[0]?' on':''),f[1],ch);b.type='button';b.addEventListener('click',function(){flt=f[0];draw()});
 });
 var l=$('t-list');l.textContent='';
 var vis=rows.filter(function(r){
  if(flt==='todos')return true;
  if(flt==='ventas')return r.datos&&r.datos.triage==='posible_venta';
  if(flt==='descartados')return r.datos&&r.datos.triage==='descartado';
  return r.agente===flt;
 });
 if(!vis.length)h('p','empty','Nada con este filtro todavía.',l);
 vis.slice(0,120).forEach(function(r){
  var q=h('div','q',null,l);
  var top=h('div','',null,q);h('b','',r.titulo||'(sin título)',top);
  var tg=r.datos&&r.datos.triage==='posible_venta'?' · posible venta':(r.datos&&r.datos.triage==='descartado'?' · descartado':'');
  var s=h('span','',' '+(NAMES[r.agente]||r.agente)+' · '+hora(r.created_at)+tg+(r.datos&&r.datos.hallazgos?' · con hallazgos':''),top);
  if(tg.indexOf('venta')>0)s.className='tag-v';
  if(r.resultado){var dt=h('details','',null,q);h('summary','','Ver detalle',dt);h('pre','',r.resultado,dt)}
 });
}
function load(){
 if(!ready()){draw();return}
 window.WM_DB.loadTodo().then(function(r){rows=r;draw()}).catch(function(e){console.warn('todo:',e.message||e)});
}
document.addEventListener('wm-db-ready',function(){setTimeout(load,1500)});
document.addEventListener('wm-db-off',function(){rows=[];draw()});
window.addEventListener('hashchange',function(){if(location.hash==='#todo')load()});
setInterval(function(){if(location.hash==='#todo')load()},30000);
if(location.hash==='#todo')setTimeout(load,1500);
draw();
})();
