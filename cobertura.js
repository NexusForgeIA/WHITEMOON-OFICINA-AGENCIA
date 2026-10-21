/* Equipo de ventas: 5 agentes, cada uno con su grupo de sectores, prospectando ciudad a ciudad por toda España.
   - Cobertura = qué sector se ha buscado en qué ciudad (tabla oficina_cobertura + lo que ya hay en prospectos_radar).
   - «Prospectar» hace UNA búsqueda (sector × ciudad) por pulsación: radar-places (Google Places) -> radar-worker «encolar».
     Cada búsqueda de Google Places tiene coste, así que no hay modo automático: lo lanzas tú.
   - Máximo 20 negocios por búsqueda (límite de radar-places). Nada se envía: los borradores pasan por Decisiones. */
(function(){
'use strict';
function $(i){return document.getElementById(i)}
function h(t,c,x,p){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;if(p)p.appendChild(n);return n}
function sb(){return window.WM_SB&&window.WM_SB()}
function ready(){return window.WM_DB&&window.WM_DB.ready}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim()}
/* clave de ciudad: minúsculas sin tildes, conservando la ñ (como ya está guardado en prospectos_radar.zona) */
function ckey(s){return String(s||'').toLowerCase().replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i').replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/\s+/g,' ').trim()}
/* para comparar «electricista» con «electricistas» */
function skey(s){return norm(s).split(' ').map(function(w){return w.replace(/(es|s)$/,'')}).join(' ')}

/* ---------- GRUPOS DE SECTORES (uno por agente; sin solapes) ---------- */
var GRUPOS={
 sol:{label:'Belleza y bienestar',sectores:['peluquerias','barberias','estetica','uñas'],re:/peluquer|barber|estetic|uñas|unas|belleza|masaje|spa\b/},
 nova:{label:'Salud',sectores:['clinica dental','fisioterapia','podologia','veterinarios'],re:/dental|dentist|clinic|fisio|podolog|veterin|medic|psicolog|optic/},
 aura:{label:'Motor y transporte',sectores:['talleres coches','mudanzas','autoescuelas'],re:/taller|coche|mudanz|autoescuela|transport|neumatic|grua/},
 lira:{label:'Hogar y obras',sectores:['electricistas','fontaneros','reformas','cerrajeros'],re:/electric|fontaner|reform|cerraj|obra|pintor|carpint|climatiz/},
 rigel:{label:'Servicios y hostelería',sectores:['abogados','gestorias','inmobiliarias','restaurantes'],re:/abogad|gestor|inmobiliar|restaur|asesor|cafeter|hotel/}
};
var ORDEN=['sol','nova','aura','lira','rigel'];

/* ---------- CIUDADES (por población aproximada; lista editable) ---------- */
var CIUDADES=['Madrid','Barcelona','Valencia','Sevilla','Zaragoza','Málaga','Murcia','Palma','Las Palmas de Gran Canaria','Bilbao','Alicante','Córdoba','Valladolid','Vigo','Gijón','Hospitalet de Llobregat','Vitoria','A Coruña','Elche','Granada','Terrassa','Badalona','Oviedo','Sabadell','Cartagena','Móstoles','Jerez de la Frontera','Santa Cruz de Tenerife','Pamplona','Almería','Alcalá de Henares','Fuenlabrada','Leganés','San Sebastián','Getafe','Burgos','Albacete','Santander','Castellón de la Plana','Alcorcón','Logroño','Badajoz','Salamanca','Huelva','Marbella','Lleida','Tarragona','León','Cádiz','Jaén','Ourense','Girona','Lugo','Cáceres','Toledo','Guadalajara','Pontevedra','Palencia','Ciudad Real','Zamora','Ávila','Cuenca','Huesca','Segovia','Soria','Teruel','Ceuta','Melilla','Majadahonda','Las Rozas','Pozuelo de Alarcón','Alcobendas','Torrejón de Ardoz','Parla','Getafe','Rivas-Vaciamadrid','Boadilla del Monte','Torrelodones'].filter(function(c,i,a){return a.indexOf(c)===i}).map(function(c){return {txt:c,key:ckey(c)}});

function agentFor(p){
 var s=norm(p&&p.sector);
 for(var i=0;i<ORDEN.length;i++){if(GRUPOS[ORDEN[i]].re.test(s))return ORDEN[i]}
 return 'sol';
}
window.WM_SALES={GRUPOS:GRUPOS,ORDEN:ORDEN,CIUDADES:CIUDADES,agentFor:agentFor};

/* ---------- COBERTURA ---------- */
var cov={},last={},pend=0,busy=false,openId=null,hoy=[],rr=0,autoErr=false;
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var auto=lsGet('wm.auto','0')==='1',cap=Math.max(1,Math.min(200,parseInt(lsGet('wm.cap','20'),10)||20));
function inicioHoy(){var d=new Date();d.setHours(0,0,0,0);return d.toISOString()}
function ck(sector,ciudad){return skey(sector)+'|'+ckey(ciudad)}
function covered(sector,ciudad){return !!cov[ck(sector,ciudad)]}
function nextFor(id){
 var g=GRUPOS[id];
 for(var i=0;i<CIUDADES.length;i++){
  for(var j=0;j<g.sectores.length;j++){
   if(!covered(g.sectores[j],CIUDADES[i].key))return {sector:g.sectores[j],ciudad:CIUDADES[i]};
  }
 }
 return null;
}
function stats(id){
 var g=GRUPOS[id],tot=g.sectores.length*CIUDADES.length,done=0;
 CIUDADES.forEach(function(c){g.sectores.forEach(function(s){if(covered(s,c.key))done++})});
 return {tot:tot,done:done};
}
function fetchAll(table,cols,limit){
 var out=[];
 function page(from){
  return sb().from(table).select(cols).range(from,from+999).then(function(r){
   if(r.error)throw r.error;
   out=out.concat(r.data||[]);
   if((r.data||[]).length===1000&&out.length<limit)return page(from+1000);
   return out;
  });
 }
 return page(0);
}
function load(){
 if(!ready())return Promise.resolve();
 return Promise.all([
  fetchAll('prospectos_radar','sector,zona',6000),
  sb().from('oficina_cobertura').select('agente,sector,ciudad,encontrados,nuevos,sin_web,duplicados,created_at').order('created_at',{ascending:false}).limit(500),
  sb().from('prospectos_radar').select('id',{count:'exact',head:true}).eq('estado','pendiente')
 ]).then(function(x){
  cov={};
  x[0].forEach(function(r){if(r.sector&&r.zona)cov[ck(r.sector,r.zona)]=1});
  var rows=x[1].data||[];
  last={};
  rows.forEach(function(r){cov[ck(r.sector,r.ciudad)]=1;if(!last[r.agente])last[r.agente]=r});
  pend=x[2].count||0;
  return sb().from('oficina_cobertura').select('agente,sector,ciudad,encontrados,nuevos,sin_web,duplicados,created_at').gte('created_at',inicioHoy()).order('created_at',{ascending:false}).limit(500).then(function(h){
   hoy=h.data||[];draw();
  });
 }).catch(function(e){var m=$('r-msg');if(m)m.textContent='No se pudo leer la cobertura: '+(e.message||e)});
}

/* ---------- PROSPECTAR (una búsqueda) ---------- */
function unwrap(r){
 if(r.error&&r.error.context&&r.error.context.json){return r.error.context.json().then(function(j){throw new Error(j&&(j.error||j.details&&JSON.stringify(j.details).slice(0,120))||r.error.message)},function(){throw new Error(r.error.message)})}
 if(r.error)throw new Error(r.error.message);
 return r.data;
}
/* radar-places y radar-worker solo admiten la cabecera content-type (CORS): se llaman con fetch simple, no con supabase-js */
var FN='https://mlaqtniujnvfxcvcourm.supabase.co/functions/v1/';
function llamar(fn,body){
 return fetch(FN+fn,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){
  return r.json().catch(function(){return {}}).then(function(j){
   if(!r.ok)throw new Error((j&&(j.error||(j.details&&JSON.stringify(j.details).slice(0,160))))||('HTTP '+r.status));
   return j;
  });
 });
}
function buscar(id,t){
 return llamar('radar-places',{sector:t.sector,zona:t.ciudad.key,max:20}).then(function(d){
  if(!d||d.ok!==true)throw new Error((d&&d.error)||'Respuesta no válida de radar-places');
  var neg=d.negocios||[];
  var enc=neg.length?llamar('radar-worker',{action:'encolar',sector:t.sector,zona:t.ciudad.key,negocios:neg}):Promise.resolve({ok:true,nuevos:0,sin_web:0,duplicados:0});
  return enc.then(function(e){
   if(!e||e.ok!==true)throw new Error((e&&e.error)||'Respuesta no válida de radar-worker');
   return sb().from('oficina_cobertura').upsert({agente:id,sector:t.sector,ciudad:t.ciudad.key,encontrados:neg.length,nuevos:e.nuevos||0,sin_web:e.sin_web||0,duplicados:e.duplicados||0},{onConflict:'sector,ciudad'}).then(function(r){
    if(r.error)console.warn('cobertura:',r.error.message);
    cov[ck(t.sector,t.ciudad.key)]=1;
    return {encontrados:neg.length,nuevos:e.nuevos||0,sin_web:e.sin_web||0,duplicados:e.duplicados||0};
   });
  });
 });
}
function prospectar(id){
 var t=nextFor(id);
 if(!t)return Promise.resolve(null);
 var W=window.WMO,name=W&&W.BY[id]?W.BY[id].name:id;
 var titulo='Buscando '+t.sector+' en '+t.ciudad.txt;
 function fin(r){
  return {titulo:name+': '+t.sector+' en '+t.ciudad.txt+' · '+r.nuevos+' nuevos',
   resultado:r.encontrados+' negocios encontrados, '+r.nuevos+' nuevos ('+r.sin_web+' sin web) y '+r.duplicados+' ya conocidos. Los que tienen web se analizan después; Sol y su equipo los evalúan desde el Radar.'};
 }
 if(!W||!W.isReal())return buscar(id,t).then(fin);
 return W.work(id,titulo,function(){return buscar(id,t).then(fin)},{accion:'prospectar'});
}
function tras(){
 document.dispatchEvent(new CustomEvent('wm-cov-done'));
 return load();
}
function uno(id){
 if(busy||!ready())return;
 busy=true;msg('Buscando…');draw();
 prospectar(id).then(function(r){msg(r?'Búsqueda terminada.':'Cobertura completa para este agente.')}).catch(function(e){msg('Error: '+(e.message||e))}).then(function(){busy=false;return tras()});
}
function todos(){
 if(busy||!ready())return;
 busy=true;draw();
 var chain=Promise.resolve();
 ORDEN.forEach(function(id){chain=chain.then(function(){msg('Buscando con '+(window.WMO&&window.WMO.BY[id]?window.WMO.BY[id].name:id)+'…');return prospectar(id)})});
 chain.then(function(){msg('Ronda terminada: una búsqueda por agente.')}).catch(function(e){msg('Error: '+(e.message||e))}).then(function(){busy=false;return tras()});
}
function analizar(){
 if(busy||!ready())return;
 busy=true;msg('Analizando las webs pendientes (puede tardar un minuto)…');draw();
 llamar('radar-worker',{action:'procesar',max:2}).then(function(d){
  msg(d&&d.procesados?('Analizados '+d.procesados+'.'):'No había pendientes.');
 }).catch(function(e){msg('Error al analizar: '+(e.message||e))}).then(function(){busy=false;return tras()});
}
/* Piloto automático: mientras la oficina esté abierta con sesión de staff, cada 3 min un agente (por turnos) hace una búsqueda
   y se analizan webs pendientes. Tope diario de búsquedas configurable. Si algo falla se pausa solo, para no gastar en bucle. */
function tick(){
 if(!auto||busy||autoErr||!ready()||!window.WMO||!window.WMO.isReal())return;
 if(hoy.length>=cap){msg('Piloto automático: tope de hoy alcanzado ('+hoy.length+'/'+cap+').');return}
 var id=null;
 for(var k=0;k<ORDEN.length;k++){var c=ORDEN[(rr+k)%ORDEN.length];if(nextFor(c)){id=c;rr=(rr+k+1)%ORDEN.length;break}}
 busy=true;draw();
 var p=id?prospectar(id):Promise.resolve(null);
 p.then(function(){return pend>0?llamar('radar-worker',{action:'procesar',max:2}).catch(function(e){console.warn('procesar:',e.message||e)}):null})
  .catch(function(e){autoErr=true;auto=false;lsSet('wm.auto','0');msg('Piloto automático pausado por un error: '+(e.message||e))})
  .then(function(){busy=false;return tras()});
}
setInterval(tick,3*60e3);
function msg(t){var m=$('r-msg');if(m)m.textContent=t||''}

/* ---------- PANEL ---------- */
function draw(){
 var box=$('r-cov');if(!box)return;
 box.textContent='';
 if(!ready())return;
 var W=window.WMO,pan=h('div','panel cov',null,box);
 h('h3','',"Equipo de ventas · cobertura de España",pan);
 h('p','hint',"Cinco agentes, cinco grupos de sectores distintos, las mismas "+CIUDADES.length+" ciudades. Cada pulsación hace una búsqueda (un sector en una ciudad, hasta 20 negocios) y tiene un pequeño coste en Google Places, por eso la lanzas tú.",pan);
 var grid=h('div','cov-grid',null,pan);
 ORDEN.forEach(function(id){
  var g=GRUPOS[id],a=W&&W.BY[id],st=stats(id),nx=nextFor(id);
  var c=h('div','cov-card',null,grid);
  if(a)c.style.setProperty('--c',a.c);
  var top=h('div','cov-top',null,c);
  h('b','',(a?a.name:id),top);h('span','cov-grp',g.label,top);
  var chips=h('div','cov-chips',null,c);g.sectores.forEach(function(s){h('span','cov-chip',s,chips)});
  var bar=h('div','cov-bar',null,c);var fill=h('span','',null,bar);fill.style.width=Math.round(100*st.done/st.tot)+'%';
  h('small','',st.done+' de '+st.tot+' búsquedas (sector × ciudad)',c);
  var l=last[id];
  h('small','cov-last',l?('Última: '+l.sector+' en '+l.ciudad+' · '+l.nuevos+' nuevos'):'Aún sin búsquedas desde la oficina',c);
  var row=h('div','cov-row',null,c);
  var b=h('button','btn'+(nx?'':' ghost'),nx?('Prospectar: '+nx.sector+' · '+nx.ciudad.txt):'Cobertura completa',row);b.type='button';b.disabled=busy||!nx;
  b.addEventListener('click',function(){uno(id)});
  var d=h('button','btn ghost',openId===id?'Ocultar ciudades':'Ver ciudades',row);d.type='button';
  d.addEventListener('click',function(){openId=openId===id?null:id;draw()});
  if(openId===id){
   var ul=h('div','cov-cities',null,c);
   CIUDADES.forEach(function(ci){
    var n=g.sectores.filter(function(s){return covered(s,ci.key)}).length;
    var chip=h('span','cov-city'+(n===g.sectores.length?' full':n?' part':''),ci.txt+' '+n+'/'+g.sectores.length,ul);
    chip.title=n+' de '+g.sectores.length+' sectores buscados en '+ci.txt;
   });
  }
 });
 var au=h('div','row cov-auto',null,pan);au.style.marginTop='14px';
 var lab=h('label','',null,au);var cb=h('input','',null,lab);cb.type='checkbox';cb.checked=auto;
 h('span','',' Piloto automático (una búsqueda cada 3 min, un agente por turno, mientras esta pestaña esté abierta)',lab);
 cb.addEventListener('change',function(){auto=cb.checked;autoErr=false;lsSet('wm.auto',auto?'1':'0');if(auto)setTimeout(tick,500);draw()});
 var l2=h('label','',' Tope diario ',au);var ci=h('input','',null,l2);ci.type='number';ci.min=1;ci.max=200;ci.value=cap;ci.style.width='64px';
 ci.addEventListener('change',function(){cap=Math.max(1,Math.min(200,parseInt(ci.value,10)||20));lsSet('wm.cap',String(cap));draw()});
 h('span','hint',' búsquedas/día · hoy van '+hoy.length,au);
 if(hoy.length){
  var rs=h('div','cov-res',null,pan);h('h4','',"Resultados de hoy",rs);
  ORDEN.forEach(function(id){
   var m=hoy.filter(function(r){return r.agente===id});if(!m.length)return;
   var nu=0,sw=0,du=0;m.forEach(function(r){nu+=r.nuevos;sw+=r.sin_web;du+=r.duplicados});
   var a=W&&W.BY[id];
   h('p','',(a?a.name:id)+': '+m.length+' búsquedas · '+nu+' negocios nuevos ('+sw+' sin web) · '+du+' ya conocidos. Última: '+m[0].sector+' en '+m[0].ciudad+'.',rs);
  });
  h('small','',"Los que tienen web se analizan y los evalúan los agentes: lo que parezca una venta llega a Decisiones.",rs);
 }
 var act=h('div','row',null,pan);act.style.marginTop='14px';
 var all=h('button','btn','Una búsqueda por agente (los 5)',act);all.type='button';all.disabled=busy;all.addEventListener('click',todos);
 var an=h('button','btn ghost','Analizar webs pendientes ('+pend+')',act);an.type='button';an.disabled=busy||!pend;an.addEventListener('click',analizar);
}
document.addEventListener('wm-db-ready',function(){setTimeout(load,1000)});
document.addEventListener('wm-auth',function(){if(!window.WM_AUTH){cov={};last={};draw()}});
})();
