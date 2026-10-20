/* Ventas · Scout: lectura de leads_web con login real (Supabase Auth, RLS authenticated).
   Clave publishable (pública por diseño). Sesión en sessionStorage, no en localStorage. */
(function(){
var URL='https://mlaqtniujnvfxcvcourm.supabase.co',KEY='sb_publishable_6no6BuOgiA_2nonTJntAuQ_DTqEgrcV';
var sb=null;
function $(i){return document.getElementById(i)}
function init(){
 if(sb||!window.supabase)return sb;
 sb=window.supabase.createClient(URL,KEY,{auth:{storage:window.sessionStorage,persistSession:true,autoRefreshToken:true}});
 return sb;
}
function msg(t){$('v-msg').textContent=t}
function esc(s){return String(s==null?'':s)}
function render(rows){
 var sin=rows.filter(function(r){return r.atendido!==true}).length;
 var pip=rows.filter(function(r){return r.pipeline_added===true}).length;
 var k=$('v-kpis');k.textContent='';
 [[rows.length,'Leads cargados'],[sin,'Sin atender'],[pip,'En pipeline']].forEach(function(x){
  var d=document.createElement('div');d.className='kpi';var s=document.createElement('span');s.textContent=x[0];var m=document.createElement('small');m.textContent=x[1];d.appendChild(s);d.appendChild(m);k.appendChild(d)});
 var l=$('v-list');l.textContent='';
 if(!rows.length){l.textContent='No hay leads todavía.';l.className='empty';return}
 l.className='queue';
 rows.forEach(function(r){
  var q=document.createElement('div');q.className='q'+(r.atendido===true?' done':'');
  var a=document.createElement('div');var b=document.createElement('b');b.textContent=esc(r.nombre)||'Sin nombre';
  var sp=document.createElement('span');sp.textContent=' · '+esc(r.sector||'sin sector')+' · '+esc(r.origen||'')+' · '+(r.created_at||'').slice(0,10);
  var p=document.createElement('div');p.style.cssText='color:#b8b8cc;font-size:13px';p.textContent=[r.telefono,r.interes,r.mensaje].filter(Boolean).join(' · ');
  a.appendChild(b);a.appendChild(sp);a.appendChild(p);q.appendChild(a);
  var btn=document.createElement('button');btn.type='button';btn.textContent=r.atendido===true?'Reabrir':'Marcar atendido';
  btn.addEventListener('click',function(){
   btn.disabled=true;
   init().from('leads_web').update({atendido:r.atendido!==true}).eq('id',r.id).then(function(res){
    if(res.error){msg('No se pudo actualizar: '+res.error.message);btn.disabled=false}else load();
   });
  });
  q.appendChild(btn);l.appendChild(q);
 });
}
function load(){
 init().from('leads_web').select('id,created_at,nombre,telefono,sector,interes,mensaje,origen,atendido,pipeline_added').order('created_at',{ascending:false}).limit(100).then(function(res){
  if(res.error){msg('Error al leer leads: '+res.error.message);return}
  render(res.data||[]);
 });
}
function show(on){$('v-login').hidden=on;$('v-app').hidden=!on}
function boot(){
 if(!init()){msg('No se pudo cargar Supabase (¿sin conexión?).');return}
 sb.auth.getSession().then(function(r){if(r.data&&r.data.session){show(true);load()}});
 $('v-form').addEventListener('submit',function(e){
  e.preventDefault();msg('Entrando…');
  sb.auth.signInWithPassword({email:$('v-email').value.trim(),password:$('v-pass').value}).then(function(r){
   $('v-pass').value='';
   if(r.error){msg('No se pudo iniciar sesión: '+r.error.message);return}
   msg('');show(true);load();
  });
 });
 $('v-reload').addEventListener('click',load);
 $('v-out').addEventListener('click',function(){sb.auth.signOut().then(function(){show(false);msg('Sesión cerrada.')})});
}
boot();
})();
