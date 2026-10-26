/* Constructor de webs rápidas (pestaña Herramientas). Formulario → vista previa en vivo → enlace público.
   Guarda en Supabase (oficina_webs, solo staff) y sube las imágenes al bucket público oficina-webs.
   El enlace público es web.html?s=<slug>; la web se pinta desde webtpl.js (todo escapado). */
(function(){
'use strict';
var root=document.getElementById('wb-root');
if(!root||!window.WMWeb)return;
var BUCKET='oficina-webs';
var S={},editId=null,editSlug=null,preview=null,timer=null,desktop=true;
var DRAFT='wm.web.draft';

function $(s,r){return (r||root).querySelector(s)}
function h(tag,attrs,kids){
 var e=document.createElement(tag);
 if(attrs)Object.keys(attrs).forEach(function(k){
  if(k==='class')e.className=attrs[k];else if(k==='text')e.textContent=attrs[k];else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),attrs[k]);else if(attrs[k]!==undefined&&attrs[k]!==null)e.setAttribute(k,attrs[k]);
 });
 (kids||[]).forEach(function(c){if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c)});
 return e;
}
function sb(){return window.WM_SB&&window.WM_SB()}
function logged(){return !!(window.WM_DB&&window.WM_DB.ready)}
function msg(t,cls){var m=$('#wb-msg');m.textContent=t||'';m.className='hint '+(cls||'')}
function slugify(n){return String(n||'web').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'web'}
function rnd(n){var a=new Uint8Array(n),s='';(window.crypto||window.msCrypto).getRandomValues(a);for(var i=0;i<n;i++)s+=(a[i]%36).toString(36);return s}
function uid(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():rnd(16)}

/* ---------- estado ---------- */
function vacio(){return {nombre:'',sector:'',ciudad:'',direccion:'',telefono:'',whatsapp:'',email:'',horario:'',resenas_url:'',mapa:'',instagram:'',facebook:'',web_actual:'',
 logo:'',hero:'',sobre_img:'',galeria:[],color:'#2f7d7a',color2:'',eslogan1:'',eslogan2:'',subtitulo:'',descripcion:'',sobre:'',
 servicios:[{titulo:'',texto:'',img:''}],valoracion_nota:'',valoracion_total:'',resenas:[{autor:'',estrellas:5,texto:'',fecha:''}],faqs:[]}}
function saveDraft(){try{sessionStorage.setItem(DRAFT,JSON.stringify({S:S,editId:editId,editSlug:editSlug}))}catch(e){}}
function loadDraft(){try{var d=JSON.parse(sessionStorage.getItem(DRAFT)||'null');if(d&&d.S){S=Object.assign(vacio(),d.S);editId=d.editId||null;editSlug=d.editSlug||null;return true}}catch(e){}return false}

/* ---------- vista previa ---------- */
function base(){return encodeURI(new URL('./',location.href).href)}
function refresh(){
 clearTimeout(timer);
 timer=setTimeout(function(){
  saveDraft();
  if(preview)preview.srcdoc=WMWeb.documento(S,{base:base()});
 },300);
}

/* ---------- imágenes ---------- */
function loadBitmap(file){
 if(window.createImageBitmap)return createImageBitmap(file);
 return new Promise(function(ok,ko){var i=new Image();i.onload=function(){ok(i)};i.onerror=ko;i.src=URL.createObjectURL(file)});
}
function reduce(file,max,q){
 return loadBitmap(file).then(function(bm){
  var w=bm.width,hh=bm.height,k=Math.min(1,max/Math.max(w,hh));
  var c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(hh*k);
  c.getContext('2d').drawImage(bm,0,0,c.width,c.height);
  return new Promise(function(ok,ko){c.toBlob(function(b){b?ok({blob:b,canvas:c}):ko(new Error('No se pudo procesar la imagen'))},'image/webp',q||.82)});
 });
}
function subir(file,max){
 if(!logged())return Promise.reject(new Error('Inicia sesión en Ventas para subir imágenes.'));
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))return Promise.reject(new Error('Solo JPG, PNG o WebP.'));
 return reduce(file,max).then(function(r){
  if(r.blob.type!=='image/webp')throw new Error('Tu navegador no genera WebP; prueba con Chrome.');
  var path='w/'+uid()+'.webp';
  return sb().storage.from(BUCKET).upload(path,r.blob,{contentType:'image/webp',cacheControl:'31536000',upsert:false}).then(function(x){
   if(x.error)throw x.error;
   return {url:sb().storage.from(BUCKET).getPublicUrl(path).data.publicUrl,canvas:r.canvas};
  });
 });
}
/* color dominante del logo: el tono más repetido entre los píxeles con color (ni blancos, ni grises, ni casi negros) */
function dominante(canvas){
 var t=document.createElement('canvas'),s=48;t.width=t.height=s;var x=t.getContext('2d');x.drawImage(canvas,0,0,s,s);
 var d=x.getImageData(0,0,s,s).data,bins={},best=null,bn=0;
 for(var i=0;i<d.length;i+=4){
  if(d[i+3]<200)continue;
  var hsl=WMWeb.rgb2hsl(d[i],d[i+1],d[i+2]);
  if(hsl[1]<28||hsl[2]<14||hsl[2]>88)continue;
  var k=Math.round(hsl[0]/20);bins[k]=(bins[k]||0)+1;if(bins[k]>bn){bn=bins[k];best=k}
 }
 if(best===null)return null;
 var acc=[0,0,0,0];
 for(i=0;i<d.length;i+=4){if(d[i+3]<200)continue;var q=WMWeb.rgb2hsl(d[i],d[i+1],d[i+2]);if(q[1]<28||q[2]<14||q[2]>88||Math.round(q[0]/20)!==best)continue;acc[0]+=d[i];acc[1]+=d[i+1];acc[2]+=d[i+2];acc[3]++}
 var r=function(v){return Math.round(v/acc[3]).toString(16).padStart(2,'0')};
 return '#'+r(acc[0])+r(acc[1])+r(acc[2]);
}

/* ---------- campos ---------- */
function field(key,label,opt){
 opt=opt||{};
 var inp=opt.area?h('textarea',{rows:opt.rows||3,maxlength:opt.max||600,placeholder:opt.ph||''}):h('input',{type:opt.type||'text',maxlength:opt.max||200,placeholder:opt.ph||'',autocomplete:'off'});
 inp.value=S[key]||'';
 inp.addEventListener('input',function(){S[key]=inp.value;refresh()});
 var l=h('label',{class:opt.wide?'wb-wide':''},[label,inp]);
 if(opt.hint)l.appendChild(h('small',{text:opt.hint}));
 return l;
}
function filePick(key,label,max,opt){
 opt=opt||{};
 var st=h('span',{class:'wb-fs',text:S[key]?'Imagen cargada':'Sin imagen'});
 var thumb=h('img',{class:'wb-th',alt:'',width:44,height:44});if(S[key])thumb.src=S[key];else thumb.hidden=true;
 var inp=h('input',{type:'file',accept:'image/jpeg,image/png,image/webp'});
 inp.addEventListener('change',function(){
  var f=inp.files&&inp.files[0];if(!f)return;
  st.textContent='Subiendo…';
  subir(f,max).then(function(r){
   S[key]=r.url;thumb.src=r.url;thumb.hidden=false;st.textContent='Imagen cargada';
   if(key==='logo'){var c=dominante(r.canvas);if(c){S.color=c;var ci=$('#wb-color');if(ci)ci.value=c;msg('Color sacado del logo: '+c+'. Puedes cambiarlo.','ok')}}
   refresh();
  }).catch(function(e){st.textContent='Error';msg(e.message||String(e),'err')});
  inp.value='';
 });
 var rm=h('button',{type:'button',class:'btn ghost sm',text:'Quitar',onclick:function(){S[key]='';thumb.hidden=true;st.textContent='Sin imagen';refresh()}});
 return h('div',{class:'wb-file'},[h('span',{class:'wb-lbl',text:label}),h('div',{class:'wb-frow'},[thumb,inp,st,rm]),opt.hint?h('small',{text:opt.hint}):null]);
}

/* ---------- listas repetibles ---------- */
function repeater(key,titulo,vacioFn,rowFn,max,addTxt){
 var box=h('div',{class:'wb-rep'});
 function paint(){
  box.textContent='';
  S[key].forEach(function(it,i){
   var row=h('div',{class:'wb-row'},rowFn(it,i,function(){refresh()}));
   row.appendChild(h('button',{type:'button',class:'btn ghost sm wb-del',text:'Quitar',onclick:function(){S[key].splice(i,1);paint();refresh()}}));
   box.appendChild(row);
  });
  if(S[key].length<max)box.appendChild(h('button',{type:'button',class:'btn ghost sm',text:addTxt,onclick:function(){S[key].push(vacioFn());paint();refresh()}}));
 }
 paint();
 return box;
}
function mini(it,k,label,opt){
 opt=opt||{};
 var inp=opt.area?h('textarea',{rows:opt.rows||3,maxlength:opt.max||300,placeholder:opt.ph||''}):h('input',{type:'text',maxlength:opt.max||120,placeholder:opt.ph||''});
 inp.value=it[k]||'';inp.addEventListener('input',function(){it[k]=inp.value;refresh()});
 return h('label',{class:opt.wide?'wb-wide':''},[label,inp]);
}
function miniImg(it,k,label){
 var st=h('span',{class:'wb-fs',text:it[k]?'Foto cargada':'Sin foto'});
 var inp=h('input',{type:'file',accept:'image/jpeg,image/png,image/webp'});
 inp.addEventListener('change',function(){var f=inp.files&&inp.files[0];if(!f)return;st.textContent='Subiendo…';
  subir(f,1200).then(function(r){it[k]=r.url;st.textContent='Foto cargada';refresh()}).catch(function(e){st.textContent='Error';msg(e.message,'err')});inp.value=''});
 return h('div',{class:'wb-file wb-wide'},[h('span',{class:'wb-lbl',text:label}),h('div',{class:'wb-frow'},[inp,st])]);
}

function galeria(){
 var box=h('div',{class:'wb-gal'});
 var st=h('span',{class:'wb-fs'});
 function paint(){
  box.textContent='';
  S.galeria.forEach(function(u,i){
   var im=h('img',{src:u,alt:'',width:64,height:64,class:'wb-th'});
   box.appendChild(h('div',{class:'wb-gi'},[im,h('button',{type:'button',class:'btn ghost sm',text:'×','aria-label':'Quitar foto '+(i+1),onclick:function(){S.galeria.splice(i,1);paint();refresh()}})]));
  });
  st.textContent=S.galeria.length+' de 8 fotos';
 }
 var inp=h('input',{type:'file',accept:'image/jpeg,image/png,image/webp',multiple:'multiple'});
 inp.addEventListener('change',function(){
  var fs=[].slice.call(inp.files||[]).slice(0,8-S.galeria.length);if(!fs.length)return;
  st.textContent='Subiendo…';
  fs.reduce(function(p,f){return p.then(function(){return subir(f,1400).then(function(r){S.galeria.push(r.url)})})},Promise.resolve())
   .then(function(){paint();refresh()}).catch(function(e){msg(e.message,'err');paint()});
  inp.value='';
 });
 paint();
 return h('div',{class:'wb-file wb-wide'},[h('span',{class:'wb-lbl',text:'Galería (hasta 8 fotos)'}),h('div',{class:'wb-frow'},[inp,st]),box]);
}

/* ---------- construcción de la pantalla ---------- */
function sec(titulo,abierto,kids){var d=h('details',{class:'wb-sec'},[h('summary',{text:titulo})].concat(kids));if(abierto)d.open=true;return d}
function build(){
 root.textContent='';
 var form=h('div',{class:'wb-form'});

 form.appendChild(sec('1 · Datos del negocio',true,[h('div',{class:'wb-grid'},[
  field('nombre','Nombre del negocio *',{ph:'Clínica Sol'}),field('sector','Tipo de negocio',{ph:'Peluquería, fisioterapia, taller…'}),
  field('ciudad','Ciudad',{ph:'Majadahonda'}),field('direccion','Dirección',{ph:'Calle Madrid 9'}),
  field('telefono','Teléfono *',{type:'tel',ph:'600 000 000'}),field('whatsapp','WhatsApp (si es otro)',{type:'tel'}),
  field('email','Email',{type:'email'}),field('horario','Horario (una línea por tramo)',{area:1,rows:3,wide:1,ph:'L-V 9:30-20:00\nSábado 10:00-14:00'}),
  field('resenas_url','Enlace de la ficha de Google (para «ver todas las reseñas»)',{wide:1,ph:'https://g.page/…'}),
  field('mapa','Enlace de Google Maps (opcional)',{wide:1,ph:'https://maps.app.goo.gl/…'}),
  field('instagram','Instagram (URL)'),field('facebook','Facebook (URL)'),field('web_actual','Web actual (URL, opcional)',{wide:1})
 ])]));

 var colorIn=h('input',{type:'color',id:'wb-color',value:S.color||'#2f7d7a'});
 colorIn.addEventListener('input',function(){S.color=colorIn.value;refresh()});
 var c2=h('input',{type:'color',id:'wb-color2',value:S.color2||'#b4572f'});
 var c2auto=h('input',{type:'checkbox',id:'wb-c2auto'});c2auto.checked=!S.color2;
 c2.disabled=c2auto.checked;
 c2auto.addEventListener('change',function(){c2.disabled=c2auto.checked;S.color2=c2auto.checked?'':c2.value;refresh()});
 c2.addEventListener('input',function(){S.color2=c2.value;refresh()});
 form.appendChild(sec('2 · Logo, colores y fotos',false,[
  filePick('logo','Logo del negocio',512,{hint:'Al subirlo, el color principal se saca solo del logo.'}),
  h('div',{class:'wb-colors'},[h('label',null,['Color principal',colorIn]),h('label',null,['Color secundario',c2]),h('label',{class:'wb-chk'},[c2auto,'Automático'])]),
  h('small',{text:'Los colores se ajustan solos para que el texto se lea bien (contraste AA).'}),
  filePick('hero','Foto de portada',1920,{hint:'Mejor horizontal y con luz. Solo fotos del propio negocio o con su permiso.'}),
  filePick('sobre_img','Foto de «Sobre nosotros»',1400),
  galeria()
 ]));

 form.appendChild(sec('3 · Textos de portada',false,[h('div',{class:'wb-grid'},[
  field('eslogan1','Titular (línea 1)',{max:60,ph:'Tu pelo,'}),field('eslogan2','Titular (línea 2, en color)',{max:60,ph:'como lo imaginas.'}),
  field('subtitulo','Subtítulo',{wide:1,max:140}),field('descripcion','Descripción corta',{area:1,rows:3,wide:1,max:400}),
  field('sobre','Sobre nosotros (separa párrafos con una línea en blanco)',{area:1,rows:6,wide:1,max:4000})
 ])]));

 form.appendChild(sec('4 · Servicios',false,[repeater('servicios','Servicios',function(){return {titulo:'',texto:'',img:''}},function(it){
  return [mini(it,'titulo','Servicio',{max:80}),mini(it,'texto','Descripción',{area:1,rows:2,max:260,wide:1}),miniImg(it,'img','Foto (opcional)')]
 },9,'+ Añadir servicio')]));

 form.appendChild(sec('5 · Reseñas de Google',false,[
  h('p',{class:'hint',text:'Copia reseñas reales de la ficha del negocio. Se muestran con el nombre del autor y la marca «Google». No inventes ni edites el texto.'}),
  h('div',{class:'wb-grid'},[field('valoracion_nota','Nota de la ficha',{ph:'4,9',max:6}),field('valoracion_total','Nº de reseñas de la ficha',{ph:'120',max:10})]),
  repeater('resenas','Reseñas',function(){return {autor:'',estrellas:5,texto:'',fecha:''}},function(it){
   var sel=h('select',null,[1,2,3,4,5].map(function(n){var o=h('option',{value:n,text:n+' ★'});if(n===(parseInt(it.estrellas,10)||5))o.selected=true;return o}));
   sel.addEventListener('change',function(){it.estrellas=parseInt(sel.value,10);refresh()});
   return [mini(it,'autor','Autor',{max:60}),h('label',null,['Estrellas',sel]),mini(it,'fecha','Fecha (ej. hace 2 meses)',{max:30}),mini(it,'texto','Texto de la reseña',{area:1,rows:3,max:520,wide:1})]
  },9,'+ Añadir reseña')]));

 form.appendChild(sec('6 · Preguntas frecuentes (opcional)',false,[repeater('faqs','Preguntas',function(){return {p:'',r:''}},function(it){
  return [mini(it,'p','Pregunta',{max:160,wide:1}),mini(it,'r','Respuesta',{area:1,rows:2,max:600,wide:1})]
 },8,'+ Añadir pregunta')]));

 var acts=h('div',{class:'wb-acts'},[
  h('button',{type:'button',class:'btn',id:'wb-save',text:editId?'Guardar cambios':'Crear enlace',onclick:guardar}),
  h('button',{type:'button',class:'btn ghost',text:'Empezar de nuevo',onclick:function(){if(confirm('¿Vaciar el formulario?')){S=vacio();editId=editSlug=null;build();refresh()}}})
 ]);
 form.appendChild(acts);
 form.appendChild(h('p',{class:'hint',id:'wb-msg',role:'status'}));

 var sw=h('div',{class:'wb-sw'},[
  h('button',{type:'button',class:'btn ghost sm on',text:'Escritorio',onclick:function(e){desktop=true;setW(e.target)}}),
  h('button',{type:'button',class:'btn ghost sm',text:'Móvil',onclick:function(e){desktop=false;setW(e.target)}})
 ]);
 function setW(btn){[].forEach.call(sw.children,function(b){b.classList.toggle('on',b===btn)});frame.style.width=desktop?'100%':'390px'}
 preview=h('iframe',{class:'wb-frame',title:'Vista previa de la web',sandbox:'allow-scripts allow-popups'});
 var frame=preview;
 var pv=h('div',{class:'wb-prev'},[h('div',{class:'wb-pvh'},[h('strong',{text:'Vista previa'}),sw]),h('div',{class:'wb-frwrap'},[preview])]);

 root.appendChild(h('div',{class:'wb-cols'},[form,pv]));
 root.appendChild(h('div',{class:'panel wide wb-list',id:'wb-list'},[h('h2',{text:'Webs creadas'}),h('p',{class:'hint',text:'Inicia sesión en Ventas para ver y crear webs.'})]));
 refresh();
 listar();
}

/* ---------- guardar / listar ---------- */
function enlace(slug){return new URL('web.html?s='+encodeURIComponent(slug),location.href).href}
function guardar(){
 if(!logged()){msg('Inicia sesión en Ventas para crear el enlace.','err');return}
 var n=(S.nombre||'').trim(),t=WMWeb.tel(S.telefono);
 if(!n){msg('Falta el nombre del negocio.','err');return}
 if(!t){msg('Falta el teléfono.','err');return}
 var btn=$('#wb-save');btn.disabled=true;msg('Guardando…');
 var datos=JSON.parse(JSON.stringify(S));
 var p;
 if(editId){p=sb().from('oficina_webs').update({nombre:n,datos:datos}).eq('id',editId).select('id,slug').single()}
 else{var slug=slugify(n)+'-'+rnd(6);p=sb().from('oficina_webs').insert({slug:slug,nombre:n,datos:datos}).select('id,slug').single()}
 p.then(function(r){
  btn.disabled=false;
  if(r.error)throw r.error;
  editId=r.data.id;editSlug=r.data.slug;btn.textContent='Guardar cambios';saveDraft();
  var link=enlace(editSlug);
  msg('Guardado. Enlace: '+link,'ok');
  navigator.clipboard&&navigator.clipboard.writeText(link).catch(function(){});
  listar();
 }).catch(function(e){btn.disabled=false;msg('No se pudo guardar: '+(e.message||e),'err')});
}
function listar(){
 var box=$('#wb-list');if(!box)return;
 if(!logged())return;
 sb().from('oficina_webs').select('id,slug,nombre,activa,created_at,datos').order('created_at',{ascending:false}).limit(60).then(function(r){
  box.textContent='';box.appendChild(h('h2',{text:'Webs creadas'}));
  if(r.error){box.appendChild(h('p',{class:'hint err',text:'No se pudo leer la lista: '+r.error.message}));return}
  if(!r.data.length){box.appendChild(h('p',{class:'hint',text:'Aún no has creado ninguna.'}));return}
  r.data.forEach(function(w){
   var link=enlace(w.slug);
   var row=h('div',{class:'wb-li'},[
    h('div',null,[h('strong',{text:w.nombre}),h('small',{text:(w.activa?'Activa':'Desactivada')+' · '+new Date(w.created_at).toLocaleDateString('es-ES')})]),
    h('div',{class:'wb-lb'},[
     h('a',{class:'btn ghost sm',href:link,target:'_blank',rel:'noopener',text:'Abrir'}),
     h('button',{type:'button',class:'btn ghost sm',text:'Copiar enlace',onclick:function(){navigator.clipboard.writeText(link).then(function(){msg('Enlace copiado.','ok')})}}),
     h('button',{type:'button',class:'btn ghost sm',text:'Copiar mensaje',onclick:function(){navigator.clipboard.writeText('Hola, te he preparado una propuesta de web para '+w.nombre+': '+link).then(function(){msg('Mensaje para WhatsApp copiado.','ok')})}}),
     h('button',{type:'button',class:'btn ghost sm',text:'Editar',onclick:function(){S=Object.assign(vacio(),w.datos);editId=w.id;editSlug=w.slug;build();window.scrollTo({top:root.offsetTop-20,behavior:'smooth'})}}),
     h('button',{type:'button',class:'btn ghost sm',text:w.activa?'Desactivar':'Activar',onclick:function(){sb().from('oficina_webs').update({activa:!w.activa}).eq('id',w.id).then(function(x){if(x.error)msg(x.error.message,'err');listar()})}}),
     h('button',{type:'button',class:'btn ghost sm',text:'Borrar',onclick:function(){if(confirm('¿Borrar «'+w.nombre+'»? El enlace dejará de funcionar.'))sb().from('oficina_webs').delete().eq('id',w.id).then(function(x){if(x.error)msg(x.error.message,'err');if(editId===w.id){editId=editSlug=null}listar()})}})
    ])]);
   box.appendChild(row);
  });
 });
}

if(!loadDraft())S=vacio();
build();
document.addEventListener('wm-db-ready',listar);
document.addEventListener('wm-db-off',function(){var b=$('#wb-list');if(b){b.textContent='';b.appendChild(h('h2',{text:'Webs creadas'}));b.appendChild(h('p',{class:'hint',text:'Inicia sesión en Ventas para ver y crear webs.'}))}});
})();
