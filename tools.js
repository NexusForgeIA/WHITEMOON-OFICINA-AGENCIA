(function(){
'use strict';
var SECTORS=[
 {id:'restaurante',n:'Restaurante',cita:false,pain:'reservas sin tener que atender el teléfono en pleno servicio'},
 {id:'peluqueria',n:'Peluquería y estética',cita:true,pain:'citas sin llamadas ni mensajes sueltos'},
 {id:'taller',n:'Taller de coches',cita:true,pain:'citas de revisión y presupuestos sin interrumpir el trabajo'},
 {id:'clinica',n:'Clínica dental o fisio',cita:true,pain:'citas ordenadas y recordatorios sin saturar la recepción'},
 {id:'reformas',n:'Reformas',cita:false,pain:'recoger solicitudes de presupuesto con los datos que necesitas'},
 {id:'fontaneria',n:'Fontanería y electricidad',cita:false,pain:'avisos y solicitudes de visita recogidos aunque estés en una obra'},
 {id:'inmobiliaria',n:'Inmobiliaria',cita:false,pain:'responder a interesados y agendar visitas'},
 {id:'optica',n:'Óptica',cita:true,pain:'citas de revisión y consultas frecuentes'},
 {id:'carpinteria',n:'Carpintería y madera',cita:false,pain:'presupuestos y consultas de clientes recogidos de forma ordenada'},
 {id:'tienda',n:'Tienda online',cita:false,pain:'consultas de clientes respondidas fuera de horario'}
];
function $(i){return document.getElementById(i)}
function load(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function secById(id){return SECTORS.filter(function(s){return s.id===id})[0]}

/* nav */

document.querySelectorAll('#tools-nav button').forEach(function(btn){
 btn.addEventListener('click',function(){
  document.querySelectorAll('#tools-nav button').forEach(function(x){x.classList.toggle('on',x===btn)});
  document.querySelectorAll('.tool').forEach(function(t){t.hidden=t.id!==btn.dataset.tool});
 });
});


/* selects */
['v-sec','m-sec'].forEach(function(id){
 var s=$(id);SECTORS.forEach(function(x){var o=document.createElement('option');o.value=x.id;o.textContent=x.n;s.appendChild(o)});
});

/* demos */
var demos=load('wm_demos',{});
function demoList(){
 var box=$('demo-list');box.textContent='';
 SECTORS.forEach(function(s){
  var r=document.createElement('div');r.className='demo';
  var b=document.createElement('b');b.textContent=s.n;
  var i=document.createElement('input');i.type='url';i.placeholder='https://…';i.value=demos[s.id]||'';i.setAttribute('aria-label','Enlace de la demo de '+s.n);
  i.addEventListener('change',function(){demos[s.id]=i.value.trim();save('wm_demos',demos)});
  var c=document.createElement('button');c.type='button';c.textContent='Copiar';
  c.addEventListener('click',function(){copy(i.value)});
  r.appendChild(b);r.appendChild(i);r.appendChild(c);box.appendChild(r);
 });
}
demoList();
function copy(t){
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).catch(function(){})}
}

/* ventas */
function product(sec,web){
 if(sec.cita)return {n:'Agente IA Citas',d:'un agente de reservas: tus clientes piden cita solos, por QR o con un enlace, sin llamadas'};
 if(web)return {n:'Spark',d:'un agente de IA conversacional instalado en la web que ya tienes'};
 return {n:'Core Spark Web',d:'una web nueva con el agente de IA incluido, para que tu negocio se vea y atienda desde el primer día'};
}
function updProd(){
 var p=product(secById($('v-sec').value),$('v-web').checked);
 $('v-prod').textContent='Producto sugerido: '+p.n;
}
$('v-sec').addEventListener('change',updProd);$('v-web').addEventListener('change',updProd);updProd();

function makeDraft(){
 var sec=secById($('v-sec').value),p=product(sec,$('v-web').checked);
 var neg=$('v-neg').value.trim(),cont=$('v-cont').value.trim();
 var url=demos[sec.id]?demos[sec.id]:'[ENLACE DE LA DEMO]';
 $('d-sub').value=neg+': '+sec.pain.split(' ').slice(0,6).join(' ')+'…';
 $('d-body').value=
 'Hola'+(cont?' '+cont:'')+',\n\n'+
 'Soy Cristóbal, de WhiteMoon Agencia IA (Majadahonda). Trabajo con negocios como '+neg+' para conseguir '+sec.pain+'.\n\n'+
 'Te propongo '+p.n+': '+p.d+'.\n\n'+
 'He preparado una demo de ejemplo para tu sector, con datos ficticios, para que veas cómo funciona: '+url+'\n\n'+
 'Sin permanencia (30 días de aviso para cancelar). Si te encaja, lo vemos en una llamada corta y te cuento las condiciones.\n\n'+
 'Puedes escribirme por WhatsApp al 643 199 580 o responder a este correo.\n\n'+
 'Un saludo,\nCristóbal Martínez\nWhiteMoon Agencia IA · whitemoon.es\n\n'+
 'Si prefieres no recibir más mensajes nuestros, responde con la palabra BAJA y no volveremos a escribirte.';
 mailto();
}
function mailto(){
 var to=$('v-mail').value.trim();
 $('b-mail').href='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent($('d-sub').value)+'&body='+encodeURIComponent($('d-body').value);
}
$('f-venta').addEventListener('submit',function(e){e.preventDefault();makeDraft();$('d-msg').textContent='Borrador listo. Revísalo antes de enviarlo.'});
$('d-sub').addEventListener('input',mailto);$('d-body').addEventListener('input',mailto);$('v-mail').addEventListener('input',mailto);
$('b-copy').addEventListener('click',function(){copy($('d-sub').value+'\n\n'+$('d-body').value);$('d-msg').textContent='Copiado.'});

var queue=load('wm_queue',[]);
function drawQueue(){
 var q=$('queue');q.textContent='';
 if(!queue.length){var p=document.createElement('p');p.className='empty';p.textContent='Aún no hay borradores guardados.';q.appendChild(p);return}
 queue.forEach(function(it,ix){
  var r=document.createElement('div');r.className='q'+(it.sent?' done':'');
  var t=document.createElement('div');
  var b=document.createElement('b');b.textContent=it.neg;
  var s=document.createElement('span');s.textContent=' · '+it.sector+' · '+(it.sent?'enviado a mano':'borrador');
  t.appendChild(b);t.appendChild(s);
  var act=document.createElement('div');act.className='row';
  var o=document.createElement('button');o.textContent='Cargar';o.addEventListener('click',function(){$('d-sub').value=it.sub;$('d-body').value=it.body;$('v-mail').value=it.mail||'';mailto()});
  var m=document.createElement('button');m.textContent=it.sent?'Reabrir':'Marcar enviado';m.addEventListener('click',function(){it.sent=!it.sent;save('wm_queue',queue);drawQueue()});
  var d=document.createElement('button');d.textContent='Borrar';d.addEventListener('click',function(){queue.splice(ix,1);save('wm_queue',queue);drawQueue()});
  act.appendChild(o);act.appendChild(m);act.appendChild(d);
  r.appendChild(t);r.appendChild(act);q.appendChild(r);
 });
}
$('b-save').addEventListener('click',function(){
 if(!$('d-body').value.trim()){$('d-msg').textContent='Genera primero un borrador.';return}
 queue.unshift({neg:$('v-neg').value.trim()||'Sin nombre',sector:secById($('v-sec').value).n,sub:$('d-sub').value,body:$('d-body').value,sent:false});
 save('wm_queue',queue);drawQueue();$('d-msg').textContent='Guardado en la cola.';
});
drawQueue();

/* marketing */
$('f-mk').addEventListener('submit',function(e){
 e.preventDefault();
 var sec=secById($('m-sec').value),short=$('m-for').value==='short';
 $('k-t').value=short?('Agentes IA para '+sec.n.toLowerCase()+': qué hacen y qué no'):('Agentes IA para '+sec.n.toLowerCase()+': qué hacen y qué no hacen');
 $('k-b').value=
 (short?'GANCHO (3 s): ':'GANCHO (5 s): ')+'Pregunta sobre el problema: '+sec.pain+'.\n'+
 'AVISO (3 s): "Soy una presentadora de IA. La demo que vas a ver usa datos ficticios."\n'+
 'DEMO'+(short?' (10-15 s)':' (30-40 s)')+': grabación REAL de pantalla de la demo de '+sec.n.toLowerCase()+'. Pantalla completa; la avatar solo comenta en off.\n'+
 'QUÉ HACE Y QUÉ NO (10 s): una limitación honesta del producto.\n'+
 'CIERRE (5 s): enlace en la descripción a WhatsApp / Cal.com.\n\n'+
 'REVISAR ANTES DE PUBLICAR: sin precios, sin cifras de resultados, sin productos retirados, subtítulos corregidos, etiqueta de contenido sintético activada.';
});
$('k-copy').addEventListener('click',function(){copy($('k-t').value+'\n\n'+$('k-b').value)});

/* ciber */
var ITEMS=[
 'RLS activado en todas las tablas nuevas de Supabase',
 'Toda VIEW creada con security_invoker = on',
 'Ningún panel protegido solo con un gate en JavaScript (login real con Supabase Auth)',
 'Ninguna API key ni secreto en el JS del cliente',
 'Edge Functions públicas desplegadas con --no-verify-jwt y CORS correcto',
 'Ningún token ni PAT guardado en localStorage',
 'Verificación en dos pasos en GitHub, Supabase, Vercel, IONOS y Google',
 'Revisados los avisos de seguridad (advisors) de Supabase este mes',
 'Certificados SSL y dominios con caducidad controlada',
 'Copia de seguridad de la base de datos comprobada'
];
var done=load('wm_sec',{});
function drawSec(){
 var ul=$('sec');ul.textContent='';var n=0;
 ITEMS.forEach(function(t,ix){
  var li=document.createElement('li'),l=document.createElement('label'),c=document.createElement('input');
  c.type='checkbox';c.checked=!!done[ix];if(c.checked)n++;
  c.addEventListener('change',function(){done[ix]=c.checked;save('wm_sec',done);drawSec()});
  l.appendChild(c);l.appendChild(document.createTextNode(' '+t));li.appendChild(l);ul.appendChild(li);
 });
 $('sec-bar').style.width=(n/ITEMS.length*100)+'%';
 $('sec-txt').textContent=n+' de '+ITEMS.length+' comprobados. Es una lista manual: marca solo lo que hayas verificado de verdad.';
}
drawSec();
})();
