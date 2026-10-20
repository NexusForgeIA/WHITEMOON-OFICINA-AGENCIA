/* Sala de demos: lee en directo los repos públicos de la organización (API de GitHub, sin token).
   Públicas: solo demos sectoriales de la lista blanca. Clientes/prospectos y el resto: solo con sesión. */
(function(){
var USER='NexusForgeIA',API='https://api.github.com/users/'+USER+'/repos?per_page=100&sort=pushed',PAGES='https://'+USER.toLowerCase()+'.github.io/';
function $(i){return document.getElementById(i)}
function h(t,c,x,p){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;if(p)p.appendChild(n);return n}
/* repo (mayúsculas) -> [etiqueta, id de sector en tools.js o '' ] */
var PUBLIC={
 'WHITEMOON-ESTETICA':['Estética','peluqueria'],'WHITEMOON-NAILS-ESTETICA':['Uñas y estética','peluqueria'],'WHITEMOON-BEAUTYANDCHIC':['Estética (Beauty and Chic)','peluqueria'],
 'WHITEMOON-PELUQUERIAS':['Peluquería','peluqueria'],'WHITEMOON-BARBERIAS':['Barbería','peluqueria'],
 'WHITEMOON-TALLERES-COCHES':['Taller de coches','taller'],'WHITEMOON-CLINICAS-DENTALES':['Clínica dental','clinica'],'WHITEMOON-FISIO':['Fisioterapia','clinica'],
 'WHITEMOON-PODOLOGOS':['Podología','clinica'],'WHITEMOON-VETERINARIOS':['Veterinaria',''],'WHITEMOON-AUTOESCUELAS':['Autoescuela',''],
 'WHITEMOON-RESTAURANTE-DEMO':['Restaurante','restaurante'],'WHITEMOON-TATUAJES-DEMO':['Tatuajes',''],'WHITEMOON-GESTORIAS-DEMO':['Gestoría',''],
 'WHITEMOON-ABOGADOS':['Abogados',''],'WHITEMOON-INMOBILIARIAS':['Inmobiliaria','inmobiliaria'],'WHITEMOON-FINCAS-DEMO':['Administración de fincas',''],
 'WHITEMOON-LOGISTICA-DEMO':['Logística',''],'WHITEMOON-MUDANZAS':['Mudanzas',''],'WHITEMOON-YOGA-PILATES':['Yoga y pilates',''],'WHITEMOON-REFORMAS-ELECTRICIDAD':['Reformas y electricidad','reformas'],
 'WHITEMOON-FONTANERIA-GENERAL':['Fontanería','fontaneria'],'WHITEMOON-TIENDA':['Tienda online','tienda']
};
var HIDDEN={'WHITEMOON-360-DEMO':1};/* producto retirado: no se ofrece */
var sess=null;
function getList(force){
 return new Promise(function(res,rej){
  try{var c=JSON.parse(sessionStorage.getItem('wm_repos')||'null');if(!force&&c&&Date.now()-c.t<600000)return res(c.d)}catch(e){}
  fetch(API,{headers:{Accept:'application/vnd.github+json'}}).then(function(r){
   if(!r.ok)throw new Error('GitHub respondió '+r.status);return r.json();
  }).then(function(d){
   var out=d.map(function(r){return{name:r.name,url:r.html_url,pages:!!r.has_pages,pushed:r.pushed_at,desc:r.description||'',archived:r.archived}});
   try{sessionStorage.setItem('wm_repos',JSON.stringify({t:Date.now(),d:out}))}catch(e){}
   res(out);
  }).catch(rej);
 });
}
function copy(t,btn){
 var done=function(){var o=btn.textContent;btn.textContent='Copiado';setTimeout(function(){btn.textContent=o},1400)};
 if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});else done();
}
function preview(title,url){
 $('d-prev-t').textContent=title;$('d-prev-o').href=url;$('d-prev-f').src=url;
 var d=$('d-prev');if(!d.open)d.showModal();
}
function card(r,info,parent){
 var up=r.name.toUpperCase(),label=info?info[0]:r.name,sector=info?info[1]:'';
 var c=h('div','tc',null,parent);c.style.setProperty('--c','#4da3ff');c.style.cursor='default';
 var tt=h('div','tt',null,c);h('span','tav','D',tt);var w=h('div','',null,tt);h('b','',label,w);h('small','',r.name,w);
 var url=PAGES+r.name+'/';
 h('p','',r.pages?('Actualizado '+(r.pushed||'').slice(0,10)):'Sin GitHub Pages: no hay enlace para enseñar.',c);
 var row=h('div','row',null,c);
 if(r.pages){
  var v=h('button','btn','Vista previa',row);v.type='button';v.addEventListener('click',function(){preview(label,url)});
  var cp=h('button','btn ghost','Copiar enlace',row);cp.type='button';cp.addEventListener('click',function(){copy(url,cp)});
  if(sector){var u=h('button','btn ghost','Usar en borradores',row);u.type='button';u.addEventListener('click',function(){
   try{var d=JSON.parse(localStorage.getItem('wm_demos')||'{}');d[sector]=url;localStorage.setItem('wm_demos',JSON.stringify(d));u.textContent='Guardada para ventas'}catch(e){u.textContent='No se pudo guardar'}
  })}
 }
 var g=h('a','btn ghost','Repo',row);g.href=r.url;g.target='_blank';g.rel='noopener';
}
function render(list){
 var g=$('d-grid'),g2=$('d-grid2');g.textContent='';g2.textContent='';
 var pub=[],rest=[];
 list.forEach(function(r){
  var up=r.name.toUpperCase();if(HIDDEN[up]||r.archived)return;
  if(PUBLIC[up])pub.push(r);else rest.push(r);
 });
 pub.sort(function(a,b){return PUBLIC[a.name.toUpperCase()][0].localeCompare(PUBLIC[b.name.toUpperCase()][0],'es')});
 pub.forEach(function(r){card(r,PUBLIC[r.name.toUpperCase()],g)});
 window.WM_DEMOS=pub.filter(function(r){return r.pages}).map(function(r){return{repo:r.name,label:PUBLIC[r.name.toUpperCase()][0],url:PAGES+r.name+'/'}});
 $('d-msg').textContent=pub.length+' demos de sector disponibles.';
 var authed=!!window.WM_AUTH;$('d-priv').hidden=!authed;
 if(authed)rest.forEach(function(r){card(r,null,g2)});
}
var last=[];
function load(force){
 $('d-msg').textContent='Cargando…';
 getList(force).then(function(l){last=l;render(l)}).catch(function(e){$('d-msg').textContent='No se pudo leer GitHub ('+e.message+'). Se reintenta al actualizar.'});
}
$('d-reload').addEventListener('click',function(){load(true)});
$('d-prev-x').addEventListener('click',function(){var d=$('d-prev');d.close()});
$('d-prev').addEventListener('close',function(){$('d-prev-f').src='about:blank'});
document.addEventListener('wm-auth',function(){if(last.length)render(last)});
load(false);
})();
