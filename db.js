/* Persistencia de la oficina en Supabase (tablas oficina_*, RLS solo para staff de oficina_staff).
   Solo se activa con sesión iniciada en Ventas. Sin sesión, todo sigue siendo simulación local. */
(function(){
var DB={ready:false};window.WM_DB=DB;
function sb(){return window.WM_SB&&window.WM_SB()}
function pill(t,cls){var c=document.getElementById('conn');if(!c)return;c.textContent=t;c.className='conn '+(cls||'')}
DB.saveBrief=function(texto,items){
 var s=sb();
 return s.from('oficina_briefs').insert({texto:texto,plan:items.map(function(i){return{agente:i.agent,titulo:i.title}})}).select('id').single().then(function(r){
  if(r.error)throw r.error;
  var rows=items.map(function(i){return{brief_id:r.data.id,agente:i.agent,titulo:i.title,estado:'en_curso',requiere_revision:!!i.review}});
  return s.from('oficina_tareas').insert(rows).select('id,agente');
 }).then(function(r){if(r.error)throw r.error;return r.data});
};
DB.createTarea=function(row){return sb().from('oficina_tareas').insert(row).select('id').single().then(function(r){if(r.error)throw r.error;return r.data.id})};
DB.createDecision=function(row){return sb().from('oficina_decisiones').insert(row).select('id').single().then(function(r){if(r.error)throw r.error;return r.data.id})};
DB.loadDecisiones=function(){return sb().from('oficina_decisiones').select('*, tarea:oficina_tareas(id,datos,resultado)').order('created_at',{ascending:false}).limit(60).then(function(r){if(r.error)throw r.error;return r.data||[]})};
DB.decide=function(id,decision,nota){return sb().from('oficina_decisiones').update({estado:'decidida',decision:decision,nota:nota||null,decidido_at:new Date().toISOString()}).eq('id',id).then(function(r){if(r.error)throw r.error})};
DB.worked=function(){return sb().from('oficina_tareas').select('datos,estado').not('datos','is',null).in('estado',['revision','hecha']).then(function(r){if(r.error)throw r.error;return r.data||[]})};
DB.agente=function(body){return sb().functions.invoke('oficina-agente',{body:body}).then(function(r){
 var data=r.data;
 if(r.error&&r.error.context&&r.error.context.json){return r.error.context.json().then(function(j){throw new Error(j&&j.error||r.error.message)},function(){throw new Error(r.error.message)})}
 if(r.error)throw new Error(r.error.message);
 if(!data||data.ok!==true)throw new Error(data&&data.error||'Respuesta no válida');
 return data})};
DB.saveBriefOnly=function(texto,plan){return sb().from('oficina_briefs').insert({texto:texto,plan:plan}).select('id').single().then(function(r){if(r.error)throw r.error;return r.data.id})};
DB.lastIA=function(){var since=new Date(Date.now()-86400000).toISOString();return sb().from('oficina_tareas').select('agente,created_at,datos').gte('created_at',since).not('datos','is',null).then(function(r){if(r.error)throw r.error;return (r.data||[]).filter(function(x){return x.datos&&x.datos.ia})})};
DB.setEstado=function(id,estado){
 if(!DB.ready||!id)return;
 sb().from('oficina_tareas').update({estado:estado}).eq('id',id).then(function(r){if(r.error)console.warn('oficina: no se pudo guardar',r.error.message)});
};
function open(){
 sb().from('oficina_tareas').select('id,agente,titulo,resultado,estado,requiere_revision,datos').in('estado',['en_curso','revision']).order('created_at',{ascending:true}).limit(40).then(function(r){
  if(r.error){console.warn('oficina:',r.error.message);return}
  document.dispatchEvent(new CustomEvent('wm-db-open',{detail:r.data||[]}));
 });
}
function check(){
 if(!window.WM_AUTH){DB.ready=false;pill('Supabase: sin sesión','');document.dispatchEvent(new CustomEvent('wm-db-off'));return}
 sb().rpc('oficina_es_staff').then(function(r){
  if(r.error||r.data!==true){DB.ready=false;pill('Supabase: sesión sin acceso a la oficina','warn');document.dispatchEvent(new CustomEvent('wm-db-off'));return}
  DB.ready=true;pill('Supabase conectado','ok');open();document.dispatchEvent(new CustomEvent('wm-db-ready'));
 });
}
document.addEventListener('wm-auth',check);
})();
