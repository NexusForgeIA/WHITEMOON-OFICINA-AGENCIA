/* Plantilla de web rápida (diseño "blanco hueso" de WHITEMOON-FISIO, para cualquier negocio local).
   WMWeb.documento(datos, {base}) devuelve un documento HTML completo y autocontenido.
   Se usa igual en la vista previa del constructor (iframe srcdoc) y en el enlace público (web.html).
   Seguridad: TODO texto se escapa y toda URL se valida (https). Ningún dato entra como HTML. */
(function(){
'use strict';

/* ---------- utilidades ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function txt(s,max){s=String(s==null?'':s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim();return max?s.slice(0,max):s}
function url(u){u=txt(u,600);return /^https:\/\/[^\s"'<>]+$/i.test(u)?u:''}
function digits(t){return String(t||'').replace(/[^\d+]/g,'').replace(/^\+/,'')}
function tel(t){var d=digits(t);if(d.length===9)d='34'+d;return d}
function paras(s){return txt(s,4000).split(/\n{2,}/).map(function(p){return p.trim()}).filter(Boolean)}
function lines(s){return txt(s,600).split(/\n/).map(function(p){return p.trim()}).filter(Boolean)}
function hex(c,def){c=String(c||'').trim();return /^#[0-9a-f]{6}$/i.test(c)?c.toLowerCase():def}

/* ---------- color ---------- */
function h2r(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,s=0,l=(mx+mn)/2;
 if(mx!==mn){var d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);
  if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60}
 return [h,s*100,l*100]}
function hsl2hex(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s))/100;l=Math.max(0,Math.min(100,l))/100;
 var a=s*Math.min(l,1-l);function f(n){var k=(n+h/30)%12,c=l-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(255*c).toString(16).padStart(2,'0')}
 return '#'+f(0)+f(8)+f(4)}
function lum(hx){var c=h2r(hx).map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function contrast(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
/* oscurece hasta cumplir contraste AA (4.5) sobre blanco: el color se usa para texto y botones */
function aa(h,s,l){var c=hsl2hex(h,s,l),g=0;while(contrast(c,'#ffffff')<4.5&&l>8&&g++<80){l-=1;c=hsl2hex(h,s,l)}return c}

function paleta(color,color2){
 var base=hex(color,'#2f7d7a'),p=rgb2hsl.apply(null,h2r(base));
 var h=p[0],s=Math.min(Math.max(p[1],28),78);
 var c1=aa(h,s,Math.min(p[2],46)),c1d=aa(h,s,Math.max(Math.min(p[2],46)-11,10));
 var acc=hex(color2,null),a;
 if(acc){a=rgb2hsl.apply(null,h2r(acc))}else{a=[h+165,Math.max(s,48),44]}
 var c2=aa(a[0],Math.min(Math.max(a[1],35),80),Math.min(a[2],46)),c2d=aa(a[0],Math.min(Math.max(a[1],35),80),Math.max(Math.min(a[2],46)-11,10));
 var gris=p[1]<12;
 return {
  p:c1,pd:c1d,pl:hsl2hex(h,s*.75,74),pc:hsl2hex(h,s*.6,94),
  a:c2,ad:c2d,al:hsl2hex(a[0],Math.min(a[1],70),76),ac:hsl2hex(a[0],Math.min(a[1],60),94),
  ink:hsl2hex(h,gris?8:38,14),ink2:hsl2hex(h,gris?6:24,27),muted:hsl2hex(h,gris?5:12,38),
  bone:hsl2hex(h,gris?10:38,97),line:hsl2hex(h,gris?8:26,91),line2:hsl2hex(h,gris?8:22,85)
 }}

/* ---------- iconos (SVG de trazo, 24x24) ---------- */
var IC={
 phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
 wa:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
 pin:'<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
 clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
 arrow:'<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
 ig:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
 fb:'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
 globe:'<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
 spark:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
 menu:'<line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>',
 close:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
 g:'<path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a6 6 0 0 1-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path d="M6.4 14a6 6 0 0 1 0-4V7.4H3.1a10 10 0 0 0 0 9.2z"/><path d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10A6 6 0 0 1 12 6z"/>'
};
function ico(n,cls){return '<svg class="ic'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>'}

/* ---------- CSS ---------- */

/* ---- capa holográfica (misma del diseño FISIO): teléfono, paneles, arcos, escáner, mapa e hilo de luz ---- */
function holo(P){
 var m=function(c,n){return 'color-mix(in srgb,'+c+' '+n+'%,transparent)'};
 var p=P.p,a=P.a,pl=P.pl,al=P.al;
 return ''+
 '.hl{display:none}'+
 '@media(min-width:980px){'+
 '.hero{min-height:660px;display:flex;align-items:center}.hero .wrap{width:100%}.hero h1{font-size:clamp(40px,5.2vw,76px)}.hero .sub,.hero .lead{max-width:min(36ch,46%)}.hero h1{max-width:min(13ch,52%)}'+
 '.hl{display:block;position:absolute;z-index:3;right:max(2vw,calc((100vw - 1180px)/2 - 8px));top:50%;width:clamp(380px,36vw,540px);height:560px;margin-top:-250px;pointer-events:none;contain:layout}'+
 '.hl *{animation-play-state:paused}.hl.hl-on *{animation-play-state:running}'+
 '.hl-suelo{position:absolute;left:50%;bottom:6px;width:340px;height:70px;margin-left:-170px;border-radius:50%;border:1px solid '+m(p,32)+';background:radial-gradient(ellipse at center,'+m(pl,70)+','+m(al,30)+' 55%,transparent 72%);box-shadow:0 0 38px '+m(pl,70)+'}'+
 '.hl-suelo::after{content:"";position:absolute;inset:14px 46px;border-radius:50%;border:1px solid '+m(p,32)+';animation:hl-pulso 3.6s ease-in-out infinite}'+
 '.hl-arco{position:absolute;left:50%;top:50%;border-radius:50%;border:1px solid '+m(p,20)+'}'+
 '.hl-arco--a{width:500px;height:500px;margin:-250px 0 0 -250px;border-color:'+m(pl,80)+' transparent transparent '+m(al,70)+';animation:hl-gira 22s linear infinite}'+
 '.hl-arco--b{width:410px;height:410px;margin:-205px 0 0 -205px;border-color:transparent '+m(p,28)+' '+m(pl,60)+' transparent;animation:hl-gira 30s linear infinite reverse}'+
 '.hl-tel{position:absolute;right:6%;top:30px;width:236px;height:476px;border-radius:40px;padding:12px;background:linear-gradient(160deg,rgba(255,255,255,.92),'+m(pl,45)+' 55%,'+m(pl,55)+');border:1px solid '+m(p,34)+';box-shadow:0 0 0 6px rgba(255,255,255,.55),0 30px 70px -22px '+m(p,55)+',0 0 54px '+m(pl,60)+',inset 0 0 28px '+m(pl,35)+';animation:hl-flota 7s ease-in-out infinite;will-change:transform}'+
 '.hl-tel::before{content:"";position:absolute;left:50%;top:18px;width:74px;height:20px;margin-left:-37px;border-radius:12px;background:'+P.ink+';opacity:.86;z-index:2}'+
 '.hl-pant{position:relative;width:100%;height:100%;border-radius:30px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.95),'+m(pl,35)+');border:1px solid '+m(p,14)+';padding:52px 14px 14px;display:flex;flex-direction:column;gap:10px}'+
 '.hl-pant::before{content:"Asistente IA";position:absolute;left:0;right:0;top:14px;padding-top:26px;text-align:center;font:700 .66rem/1 var(--display);letter-spacing:.06em;color:'+p+';text-transform:uppercase}'+
 '.hl-pant::after{content:"";position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(180deg,transparent,'+m(pl,50)+' 50%,transparent);transform:translateY(-100%);animation:hl-barre 5.6s ease-in-out infinite}'+
 '.hl-m{height:34px;border-radius:14px;border:1px solid '+m(p,16)+';background:rgba(255,255,255,.88);width:78%;box-shadow:0 6px 16px -10px '+m(p,40)+'}'+
 '.hl-m i{display:block;height:5px;border-radius:3px;background:'+m(p,34)+';margin:9px 12px 0;width:62%}.hl-m i+i{width:38%;margin-top:5px;background:'+m(p,20)+'}'+
 '.hl-m--u{align-self:flex-end;background:linear-gradient(135deg,'+m(pl,70)+','+m(al,60)+');border-color:'+m(p,22)+'}.hl-m--u i{background:'+m(P.ink,42)+'}'+
 '.hl-m--t{height:24px;width:34%}.hl-m--t b{display:inline-block;width:6px;height:6px;border-radius:50%;background:'+p+';margin:9px 0 0 12px;box-shadow:12px 0 0 '+m(p,55)+',24px 0 0 '+m(p,30)+';animation:hl-parp 1.6s ease-in-out infinite}'+
 '.hl-cita{margin-top:auto;height:62px;border-radius:16px;border:1px solid '+m(p,40)+';background:linear-gradient(135deg,'+m(pl,60)+',rgba(255,255,255,.9));box-shadow:0 0 22px '+m(al,60)+';position:relative}'+
 '.hl-cita::before{content:"";position:absolute;left:14px;top:50%;width:26px;height:26px;margin-top:-13px;border-radius:50%;background:'+a+';opacity:.9}'+
 '.hl-cita::after{content:"Reserva";position:absolute;left:52px;top:14px;font:700 .72rem/1 var(--display);color:'+P.pd+';letter-spacing:.04em;text-transform:uppercase}'+
 '.hl-cita i{position:absolute;left:52px;top:34px;height:5px;width:46%;border-radius:3px;background:'+m(p,30)+'}'+
 '.hl-graf{position:absolute;z-index:2;left:0;bottom:78px;width:228px;height:196px;border-radius:18px;padding:14px;background:linear-gradient(150deg,rgba(255,255,255,.93),'+m(pl,45)+');border:1px solid '+m(p,30)+';box-shadow:0 24px 54px -22px '+m(p,55)+',0 0 42px '+m(pl,55)+',inset 0 0 22px '+m(pl,30)+';transform:rotate(-3deg);animation:hl-flota2 8s ease-in-out infinite;will-change:transform}'+
 '.hl-graf::before{content:"Más clientes";position:absolute;left:14px;top:12px;font:700 .64rem/1 var(--display);letter-spacing:.07em;text-transform:uppercase;color:'+p+'}'+
 '.hl-bars{position:absolute;left:14px;right:14px;top:56px;height:56px;display:flex;align-items:flex-end;gap:7px}'+
 '.hl-bars i{flex:1;border-radius:4px 4px 0 0;background:linear-gradient(180deg,'+al+','+pl+');border:1px solid '+m(p,20)+';border-bottom:0;transform-origin:50% 100%;transform:scaleY(.2);transition:transform 1.1s cubic-bezier(.2,.8,.2,1)}.hl-on .hl-bars i{transform:scaleY(1)}'+
 '.hl-bars i:nth-child(1){height:30%}.hl-bars i:nth-child(2){height:48%;transition-delay:.08s}.hl-bars i:nth-child(3){height:42%;transition-delay:.16s}.hl-bars i:nth-child(4){height:70%;transition-delay:.24s}.hl-bars i:nth-child(5){height:100%;transition-delay:.32s}'+
 '.hl-linea{position:absolute;left:14px;right:14px;bottom:12px;height:46px}.hl-linea svg{width:100%;height:100%;overflow:visible}'+
 '.hl-linea path{fill:none;stroke:'+a+';stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.6s .4s ease}.hl-on .hl-linea path{stroke-dashoffset:0}.hl-linea circle{fill:#fff;stroke:'+a+';stroke-width:1.6}'+
 '.hl-mini{position:absolute;left:34px;top:34px;width:116px;height:54px;border-radius:14px;border:1px solid '+m(p,26)+';background:linear-gradient(140deg,rgba(255,255,255,.92),'+m(pl,50)+');box-shadow:0 14px 34px -16px '+m(p,50)+',0 0 26px '+m(al,55)+';animation:hl-flota2 6.4s ease-in-out infinite reverse}'+
 '.hl-mini::before{content:"24/7";position:absolute;left:14px;top:11px;font:800 1.05rem/1 var(--display);color:'+P.pd+';letter-spacing:-.02em}'+
 '.hl-mini::after{content:"";position:absolute;left:14px;right:14px;bottom:11px;height:5px;border-radius:3px;background:linear-gradient(90deg,'+al+','+pl+')}'+
 '.hl-nota{position:absolute;left:0;bottom:-18px;width:240px;font:600 .62rem/1 var(--display);letter-spacing:.07em;text-transform:uppercase;color:var(--muted);opacity:.85}.hl-nota::before{content:"Ilustración, no datos reales"}'+
 '}'+
 '@keyframes hl-flota{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes hl-flota2{0%,100%{transform:rotate(-3deg) translateY(0)}50%{transform:rotate(-3deg) translateY(10px)}}'+
 '@keyframes hl-gira{to{transform:rotate(360deg)}}@keyframes hl-pulso{0%,100%{opacity:.35;transform:scale(.92)}50%{opacity:1;transform:scale(1.04)}}'+
 '@keyframes hl-barre{0%{transform:translateY(-100%)}60%,100%{transform:translateY(230%)}}@keyframes hl-parp{0%,100%{opacity:.4}50%{opacity:1}}'+
 '@keyframes hl-hilo2{from{background-position:-40% 0}to{background-position:140% 0}}@keyframes hl-radar{0%{transform:scale(1);opacity:.9}100%{transform:scale(5.2);opacity:0}}'+
 /* tarjetas: brillo al pasar el ratón */
 '.card:hover{box-shadow:0 0 0 1px '+m(pl,80)+',0 22px 46px -22px '+m(p,50)+',0 0 34px '+m(pl,60)+'}'+
 '.card-img::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(-120%);transition:transform .9s cubic-bezier(.16,1,.3,1)}.card:hover .card-img::before{transform:translateX(120%)}'+
 /* foto de Sobre nosotros: marco HUD + barrido */
 '.about-img{position:relative}.hl-sc{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}'+
 '.hl-sc i{position:absolute;width:26px;height:26px;border:2px solid rgba(255,255,255,.92);filter:drop-shadow(0 0 6px '+m(pl,90)+')}'+
 '.hl-sc i:nth-child(1){left:16px;top:16px;border-right:0;border-bottom:0;border-radius:8px 0 0 0}.hl-sc i:nth-child(2){right:16px;top:16px;border-left:0;border-bottom:0;border-radius:0 8px 0 0}'+
 '.hl-sc i:nth-child(3){left:16px;bottom:16px;border-right:0;border-top:0;border-radius:0 0 0 8px}.hl-sc i:nth-child(4){right:16px;bottom:16px;border-left:0;border-top:0;border-radius:0 0 8px 0}'+
 '.hl-sc b{position:absolute;left:0;right:0;top:0;height:34%;background:linear-gradient(180deg,transparent,transparent 20%,'+m(pl,70)+' 92%,rgba(255,255,255,.85) 100%);border-bottom:1px solid rgba(255,255,255,.9);transform:translateY(-100%);animation:hl-barre 5.2s ease-in-out infinite;animation-play-state:paused}'+
 '.about-img.hl-on .hl-sc b{animation-play-state:running}'+
 /* hilo de luz en el pie */
 'footer{position:relative}footer::before{content:"";position:absolute;left:0;right:0;top:-1px;height:2px;background:linear-gradient(90deg,transparent 0,'+pl+' 50%,'+al+' 58%,transparent 100%) 0 0/40% 100% no-repeat;box-shadow:0 0 14px '+m(pl,70)+';animation:hl-hilo2 7s linear infinite;animation-play-state:paused}footer.hl-on::before{animation-play-state:running}'+
 /* mapa holográfico (ilustración) */
 '.hl-map{position:relative;margin-top:30px;height:150px;border-radius:18px;overflow:hidden;border:1px solid '+m(p,26)+';background:radial-gradient(circle at 62% 52%,'+m(pl,55)+',transparent 60%),repeating-linear-gradient(0deg,'+m(p,12)+' 0 1px,transparent 1px 22px),repeating-linear-gradient(90deg,'+m(p,12)+' 0 1px,transparent 1px 22px),linear-gradient(160deg,#fff,'+P.pc+');box-shadow:0 20px 44px -24px '+m(p,50)+',inset 0 0 30px '+m(pl,30)+'}'+
 '.hl-map::after{content:"Ilustración, no es un mapa real";position:absolute;left:16px;bottom:12px;font:600 .58rem/1 var(--display);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}'+
 '.hl-map b{position:absolute;left:16px;top:14px;font:700 .64rem/1 var(--display);letter-spacing:.08em;text-transform:uppercase;color:'+p+'}'+
 '.hl-pin{position:absolute;left:62%;top:52%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:'+a+';box-shadow:0 0 0 4px rgba(255,255,255,.9),0 0 18px '+m(a,70)+'}'+
 '.hl-pin::before,.hl-pin::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid '+m(a,55)+';animation:hl-radar 3s ease-out infinite;animation-play-state:paused}.hl-pin::after{animation-delay:1.5s}'+
 '.hl-map.hl-on .hl-pin::before,.hl-map.hl-on .hl-pin::after{animation-play-state:running}'+
 '@media(prefers-reduced-motion:reduce){.hl *,.hl-sc b,footer::before,.hl-pin::before,.hl-pin::after{animation:none!important}.hl-bars i{transform:none!important;transition:none!important}.hl-linea path{stroke-dashoffset:0!important;transition:none!important}}';
}

function css(P,base){
 var f=function(n){return base+'assets/web/'+n};
 return '@font-face{font-family:"Inter var";src:url('+f('inter-var.woff2')+') format("woff2");font-weight:400 600;font-display:swap}'+
 '@font-face{font-family:"Jakarta var";src:url('+f('jakarta-var.woff2')+') format("woff2");font-weight:600 800;font-display:swap}'+
 ':root{--white:#fff;--bone:'+P.bone+';--ink:'+P.ink+';--ink2:'+P.ink2+';--muted:'+P.muted+';--p:'+P.p+';--pd:'+P.pd+';--pl:'+P.pl+';--pc:'+P.pc+';--a:'+P.a+';--ad:'+P.ad+';--al:'+P.al+';--ac:'+P.ac+';--line:'+P.line+';--line2:'+P.line2+';'+
 '--sh1:0 1px 2px rgba(20,30,30,.05),0 2px 8px rgba(20,30,30,.04);--sh2:0 2px 6px rgba(20,30,30,.05),0 12px 28px -12px rgba(20,30,30,.16);--sh3:0 4px 12px rgba(20,30,30,.06),0 26px 60px -26px '+P.p+'88;'+
 '--display:"Jakarta var",system-ui,-apple-system,sans-serif;--body:"Inter var",system-ui,-apple-system,sans-serif;--nav:72px}'+
 '*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:88px;-webkit-text-size-adjust:100%}'+
 'body{background:#fff;color:var(--ink2);font:400 16px/1.65 var(--body);overflow-x:hidden;-webkit-font-smoothing:antialiased}'+
 'a{color:inherit;text-decoration:none}img{max-width:100%;display:block}h1,h2,h3{font-family:var(--display);color:var(--ink);line-height:1.08;letter-spacing:-.022em;font-weight:800}'+
 '.ic{width:20px;height:20px;flex:none}.wrap{max-width:1180px;margin:0 auto;padding:0 24px}'+
 '.demo-bar{background:var(--ink);color:#fff;font-size:13px;text-align:center;padding:9px 16px;line-height:1.4}.demo-bar a{text-decoration:underline;text-underline-offset:2px}'+
 /* nav */
 '.nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}'+
 '.nav .wrap{display:flex;align-items:center;gap:20px;height:var(--nav)}.brand{display:flex;align-items:center;gap:12px;min-width:0}'+
 '.logo{width:46px;height:46px;border-radius:12px;background:var(--pc);border:1px solid var(--line);display:grid;place-items:center;overflow:hidden;flex:none;font:800 18px var(--display);color:var(--p)}.logo img{width:100%;height:100%;object-fit:contain;padding:4px}'+
 '.brand b{display:block;font:800 17px/1.15 var(--display);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:26ch}.brand small{display:block;font:600 10.5px/1.3 var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--p)}'+
 '.links{display:flex;gap:4px;margin-left:auto}.links a{padding:8px 12px;font-weight:500;font-size:15px;color:var(--ink2);border-radius:8px}.links a:hover{color:var(--ink);background:var(--pc)}'+
 '.btn{display:inline-flex;align-items:center;gap:10px;justify-content:center;padding:14px 24px;border-radius:12px;font:700 15px/1 var(--display);border:1.5px solid var(--p);background:var(--p);color:#fff;cursor:pointer;transition:transform .2s,background .2s,box-shadow .2s;box-shadow:var(--sh2)}'+
 '.btn:hover{background:var(--pd);border-color:var(--pd);transform:translateY(-1px)}.btn.alt{background:#fff;color:var(--p);box-shadow:none}.btn.alt:hover{background:var(--pc)}.btn.wa{background:var(--ink);border-color:var(--ink)}.btn.wa:hover{background:var(--ink2);border-color:var(--ink2)}'+
 '.btn:focus-visible,.links a:focus-visible,a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--al);outline-offset:2px}'+
 '.burger{display:none;margin-left:auto;background:none;border:1.5px solid var(--line2);border-radius:10px;width:44px;height:44px;color:var(--ink);cursor:pointer;place-items:center}'+
 '.mm{display:none;position:fixed;inset:var(--nav) 0 auto 0;background:#fff;border-bottom:1px solid var(--line);padding:12px 24px 20px;z-index:49;box-shadow:var(--sh2)}.mm a{display:block;padding:13px 0;border-bottom:1px solid var(--line);font-weight:600;color:var(--ink)}.mm.on{display:block}'+
 /* hero */
 '.hero{position:relative;padding:72px 0 80px;overflow:hidden;background:linear-gradient(180deg,#fff,var(--bone))}'+
 '.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.55}.hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#fff 8%,rgba(255,255,255,.86) 42%,rgba(255,255,255,.25) 100%)}'+
 '.hero-art{position:absolute;inset:0;background:radial-gradient(520px 380px at 88% 18%,var(--pl)66,transparent 70%),radial-gradient(460px 340px at 70% 92%,var(--al)55,transparent 70%),radial-gradient(var(--line2) 1px,transparent 1.2px) 0 0/22px 22px;opacity:.9}'+
 '.hero .wrap{position:relative}.hero h1{font-size:clamp(40px,7vw,84px);max-width:13ch}.hero h1 span{display:block;color:var(--p)}'+
 '.sub{margin-top:22px;font:600 clamp(18px,2.2vw,24px)/1.35 var(--display);color:var(--ink2);max-width:36ch}.sub em{font-style:normal;color:var(--a)}'+
 '.lead{margin-top:16px;max-width:56ch;font-size:17px;color:var(--ink2)}.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}'+
 '.chips{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:26px}.chip{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:15px;color:var(--ink)}.chip .ic{color:var(--p)}'+
 '.rate{display:inline-flex;align-items:center;gap:10px;margin-top:22px;background:#fff;border:1px solid var(--line2);border-radius:999px;padding:8px 16px 8px 12px;box-shadow:var(--sh1);font-weight:600;color:var(--ink);font-size:14px}.rate .ic{color:var(--a)}.rate .st{color:var(--a);letter-spacing:2px}'+
 /* marquee */
 '.mq{background:var(--p);color:#fff;overflow:hidden;white-space:nowrap;padding:14px 0}.mq-t{display:inline-flex;gap:44px;animation:mq 38s linear infinite;padding-left:44px}.mq span{font:700 14px var(--display);letter-spacing:.14em;text-transform:uppercase;display:inline-flex;align-items:center;gap:44px}.mq span:after{content:"\\2726";opacity:.6}'+
 '@keyframes mq{to{transform:translateX(-50%)}}'+
 /* secciones */
 '.sec{padding:96px 0}.sec.bone{background:var(--bone)}.eyebrow{display:flex;align-items:center;gap:12px;font:700 12px var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--a);margin-bottom:18px}.eyebrow:before{content:"";width:28px;height:2px;background:var(--a);opacity:.7}'+
 '.sec h2{font-size:clamp(32px,4.6vw,56px);max-width:18ch}.sec h2 em{font-style:normal;color:var(--p)}.intro{margin-top:18px;max-width:60ch;font-size:17px;color:var(--muted)}'+
 '.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-top:46px}'+
 '.card{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--sh1);transition:transform .25s,box-shadow .25s;display:flex;flex-direction:column}.card:hover{transform:translateY(-4px);box-shadow:var(--sh3)}'+
 '.card-img{aspect-ratio:4/3;background:linear-gradient(135deg,var(--pc),var(--ac));position:relative;display:grid;place-items:center;overflow:hidden}.card-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.card-img .n{font:800 56px var(--display);color:var(--p);opacity:.28}'+
 '.card-body{padding:22px 24px 26px}.card h3{font-size:21px;margin-bottom:8px}.card p{color:var(--muted);font-size:15.5px}'+
 /* sobre */
 '.about{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}.about p{margin-top:16px;font-size:17px}.about-img{border-radius:24px;overflow:hidden;box-shadow:var(--sh3);aspect-ratio:5/4;background:linear-gradient(135deg,var(--pc),var(--ac))}.about-img img{width:100%;height:100%;object-fit:cover}'+
 /* galeria */
 '.gal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:40px}.gal button{border:0;padding:0;background:var(--pc);border-radius:16px;overflow:hidden;aspect-ratio:1;cursor:zoom-in;box-shadow:var(--sh1)}.gal img{width:100%;height:100%;object-fit:cover;transition:transform .4s}.gal button:hover img{transform:scale(1.05)}'+
 '.lb{position:fixed;inset:0;background:rgba(10,15,15,.88);display:none;place-items:center;z-index:100;padding:24px;cursor:zoom-out}.lb.on{display:grid}.lb img{max-height:90vh;max-width:94vw;border-radius:12px}'+
 /* reseñas */
 '.rv{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-top:46px}.rvc{background:#fff;border:1px solid var(--line);border-radius:18px;padding:26px;box-shadow:var(--sh1);display:flex;flex-direction:column;gap:14px}'+
 '.stars{color:var(--a);letter-spacing:3px;font-size:18px}.rvc p{color:var(--ink2);font-size:15.5px;flex:1}.rv-by{display:flex;align-items:center;gap:10px;font-weight:700;color:var(--ink);font-size:14.5px}.rv-by small{display:flex;align-items:center;gap:6px;font-weight:500;color:var(--muted);font-size:12.5px}.rv-by .ic{width:14px;height:14px}.av{width:38px;height:38px;border-radius:50%;background:var(--pc);color:var(--p);display:grid;place-items:center;font:800 15px var(--display);flex:none}'+
 '.rv-foot{margin-top:28px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;color:var(--muted);font-size:13.5px}'+
 /* faq */
 '.faq{margin-top:40px;max-width:820px;display:grid;gap:12px}details{background:#fff;border:1px solid var(--line);border-radius:14px}summary{cursor:pointer;list-style:none;padding:18px 22px;font:700 17px var(--display);color:var(--ink);display:flex;justify-content:space-between;gap:16px}summary::-webkit-details-marker{display:none}summary:after{content:"+";color:var(--p);font-size:24px;line-height:1}details[open] summary:after{content:"\\2212"}details div{padding:0 22px 20px;color:var(--ink2)}'+
 /* contacto */
 '.contact{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:start}.info{display:grid;gap:22px;margin-top:30px}.info div{display:flex;gap:14px;align-items:flex-start}.info .ic{color:var(--p);margin-top:3px}.info b{display:block;font:700 12px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:3px}.info span,.info a{font-size:17px;color:var(--ink);font-weight:500}.info a:hover{color:var(--p)}'+
 '.cta-card{background:#fff;border:1px solid var(--line);border-radius:24px;padding:34px;box-shadow:var(--sh3)}.cta-card h3{font-size:28px}.cta-card p{margin:10px 0 22px;color:var(--muted)}.cta-card .btn{width:100%;margin-top:12px}'+
 '.soc{display:flex;gap:10px;margin-top:6px}.soc a{width:44px;height:44px;border:1.5px solid var(--line2);border-radius:12px;display:grid;place-items:center;color:var(--ink)}.soc a:hover{background:var(--pc);color:var(--p)}'+
 /* footer */
 'footer{background:var(--bone);border-top:1px solid var(--line);padding:56px 0 34px}.fg{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px}footer h4{font:700 12px var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--p);margin-bottom:14px}footer li{list-style:none;margin:9px 0;font-size:15px}footer li a:hover{color:var(--p)}footer p{color:var(--muted);font-size:15px;margin-top:14px;max-width:36ch}'+
 '.fb{margin-top:38px;padding-top:22px;border-top:1px solid var(--line2);display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between;color:var(--muted);font-size:13px}.fb a{text-decoration:underline;text-underline-offset:2px}'+
 '.fab{position:fixed;right:18px;bottom:18px;z-index:60;display:inline-flex;align-items:center;gap:10px;background:#1fa855;color:#fff;border-radius:999px;padding:14px 20px;font:700 15px var(--display);box-shadow:0 10px 28px -8px rgba(31,168,85,.7)}.fab:hover{background:#188a45}'+
 '.js .rev{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}.js .rev.in{opacity:1;transform:none}'+
 '@media(max-width:1000px){.grid,.rv{grid-template-columns:repeat(2,minmax(0,1fr))}.about,.contact{grid-template-columns:1fr;gap:34px}.gal{grid-template-columns:repeat(3,minmax(0,1fr))}}'+
 '@media(max-width:860px){.links{display:none}.burger{display:grid}.nav .btn.nv{display:none}}'+
 '@media(max-width:600px){.wrap{padding:0 18px}.sec{padding:64px 0}.hero{padding:44px 0 56px}.grid,.rv{grid-template-columns:1fr}.gal{grid-template-columns:repeat(2,minmax(0,1fr))}.fg{grid-template-columns:1fr}.cta .btn{width:100%}.fab span{display:none}.fab{padding:15px}.cta-card{padding:24px}.hero-bg::after{background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.7))}}'+
 '@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}.rev{opacity:1;transform:none}}';
}

/* ---------- HTML ---------- */
function documento(d,opts){
 var cred='';(function(){var c=(d.creditos||[]).filter(function(u){return /^[A-Za-z0-9_.-]{1,40}$/.test(u)}).slice(0,30);if(c.length)cred='<div class="fb"><span>Imágenes ilustrativas de Unsplash, no del negocio. Fotografías: '+c.map(function(u){return '<a href="https://unsplash.com/@'+u+'" target="_blank" rel="noopener">@'+u+'</a>'}).join(', ')+'.</span></div>'})();
 d=d||{};opts=opts||{};
 var base=opts.base||'';
 var nombre=txt(d.nombre,120)||'Tu negocio',sector=txt(d.sector,60),ciudad=txt(d.ciudad,60);
 var P=paleta(d.color,d.color2);
 var telD=tel(d.telefono),waD=tel(d.whatsapp||d.telefono),mail=txt(d.email,120);
 var mailOk=/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(mail)?mail:'';
 var logo=url(d.logo),hero=url(d.hero);
 var gal=(d.galeria||[]).map(url).filter(Boolean).slice(0,8);
 var serv=(d.servicios||[]).filter(function(s){return s&&txt(s.titulo)}).slice(0,9);
 var rev=(d.resenas||[]).filter(function(r){return r&&txt(r.texto)}).slice(0,9);
 var faqs=(d.faqs||[]).filter(function(q){return q&&txt(q.p)&&txt(q.r)}).slice(0,8);
 var horario=lines(d.horario).slice(0,8),dir=txt(d.direccion,200);
 var mapa=url(d.mapa)||('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((nombre+' '+dir+' '+ciudad).trim()));
 var fichaG=url(d.resenas_url);
 var ig=url(d.instagram),fbk=url(d.facebook),web=url(d.web_actual);
 var ini=nombre.split(/\s+/).filter(Boolean).slice(0,2).map(function(w){return w[0]}).join('').toUpperCase();
 var e1=txt(d.eslogan1,60)||nombre,e2=txt(d.eslogan2,60);
 var waMsg='https://wa.me/'+waD+'?text='+encodeURIComponent('Hola, os escribo desde vuestra web. ');
 var subtxt=[sector,ciudad].filter(Boolean).join(' · ');

 function a(href,cls,inner,ext){return '<a href="'+esc(href)+'" class="'+cls+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+inner+'</a>'}
 var btnLlamar=telD?a('tel:+'+telD,'btn',ico('phone')+'Llamar'):'';
 var btnWa=waD?a(waMsg,'btn wa',ico('wa')+'WhatsApp',1):'';

 var nav='<header class="nav"><div class="wrap"><a class="brand" href="#top" aria-label="'+esc(nombre)+', inicio"><span class="logo">'+(logo?'<img src="'+esc(logo)+'" alt="" width="46" height="46">':esc(ini))+'</span><span style="min-width:0"><b>'+esc(nombre)+'</b>'+(subtxt?'<small>'+esc(subtxt)+'</small>':'')+'</span></a>'+
  '<nav class="links" aria-label="Principal"><a href="#top">Inicio</a>'+(serv.length?'<a href="#servicios">Servicios</a>':'')+(d.sobre?'<a href="#nosotros">Nosotros</a>':'')+(gal.length?'<a href="#galeria">Galería</a>':'')+(rev.length?'<a href="#opiniones">Opiniones</a>':'')+(faqs.length?'<a href="#preguntas">Preguntas</a>':'')+'<a href="#contacto">Contacto</a></nav>'+
  (telD?a('tel:+'+telD,'btn nv',ico('phone')+'Llamar'):'')+
  '<button class="burger" id="bg" type="button" aria-label="Abrir menú" aria-expanded="false">'+ico('menu')+'</button></div></header>'+
  '<div class="mm" id="mm"><a href="#top">Inicio</a>'+(serv.length?'<a href="#servicios">Servicios</a>':'')+(d.sobre?'<a href="#nosotros">Nosotros</a>':'')+(rev.length?'<a href="#opiniones">Opiniones</a>':'')+'<a href="#contacto">Contacto</a></div>';

 var rate='';
 var nota=txt(d.valoracion_nota,6),tot=txt(d.valoracion_total,10);
 if(nota&&tot)rate='<div class="rate" title="Dato de la ficha de Google del negocio">'+ico('g')+'<span class="st" aria-hidden="true">★</span><span>'+esc(nota)+' · '+esc(tot)+' reseñas en Google</span></div>';

 var heroH='<section class="hero" id="top">'+(hero?'<div class="hero-bg" style="background-image:url(\''+esc(hero)+'\')"></div>':'<div class="hero-art"></div>')+
  '<div class="hl" aria-hidden="true"><div class="hl-arco hl-arco--a"></div><div class="hl-arco hl-arco--b"></div><div class="hl-suelo"></div><div class="hl-mini"></div><div class="hl-graf"><div class="hl-bars"><i></i><i></i><i></i><i></i><i></i></div><div class="hl-linea"><svg viewBox="0 0 200 46" preserveAspectRatio="none"><path pathLength="1" d="M2 40 L45 30 L90 34 L140 14 L196 6"/><circle cx="45" cy="30" r="3"/><circle cx="90" cy="34" r="3"/><circle cx="140" cy="14" r="3"/><circle cx="196" cy="6" r="3"/></svg></div></div><div class="hl-tel"><div class="hl-pant"><div class="hl-m hl-m--u"><i></i><i></i></div><div class="hl-m"><i></i><i></i></div><div class="hl-m hl-m--t"><b></b></div><div class="hl-cita"><i></i></div></div></div><div class="hl-nota"></div></div>'+
  '<div class="wrap"><h1>'+esc(e1)+(e2?'<span>'+esc(e2)+'</span>':'')+'</h1>'+
  (d.subtitulo?'<p class="sub">'+esc(txt(d.subtitulo,140))+'</p>':'')+
  (d.descripcion?'<p class="lead">'+esc(txt(d.descripcion,400))+'</p>':'')+
  '<div class="cta">'+btnLlamar+btnWa+(serv.length?a('#servicios','btn alt','Ver servicios'+ico('arrow')):'')+'</div>'+rate+
  '<div class="chips">'+(dir?'<span class="chip">'+ico('pin')+esc(dir)+'</span>':'')+(horario[0]?'<span class="chip">'+ico('clock')+esc(horario[0])+'</span>':'')+'</div></div></section>';

 var mq='';
 if(serv.length>1){var it=serv.map(function(s){return '<span>'+esc(txt(s.titulo,40))+'</span>'}).join('');mq='<div class="mq" aria-hidden="true"><div class="mq-t">'+it+it+it+it+'</div></div>'}

 var servH='';
 if(serv.length)servH='<section class="sec bone" id="servicios"><div class="wrap"><div class="eyebrow">Servicios</div><h2>'+esc(txt(d.t_servicios,60)||'Lo que hacemos por ti')+'</h2>'+(d.i_servicios?'<p class="intro">'+esc(txt(d.i_servicios,300))+'</p>':'')+'<div class="grid">'+
  serv.map(function(s,i){var im=url(s.img);return '<article class="card rev"><div class="card-img">'+(im?'<img src="'+esc(im)+'" alt="'+esc(txt(s.titulo,80))+'" loading="lazy" width="600" height="450">':'<span class="n">'+String(i+1).padStart(2,'0')+'</span>')+'</div><div class="card-body"><h3>'+esc(txt(s.titulo,80))+'</h3>'+(s.texto?'<p>'+esc(txt(s.texto,260))+'</p>':'')+'</div></article>'}).join('')+'</div></div></section>';

 var sobreH='';
 var ps=paras(d.sobre),aimg=url(d.sobre_img);
 if(ps.length)sobreH='<section class="sec" id="nosotros"><div class="wrap about"><div class="rev"><div class="eyebrow">Sobre nosotros</div><h2>'+esc(txt(d.t_sobre,60)||'Un negocio cercano')+'</h2>'+ps.slice(0,4).map(function(p){return '<p>'+esc(p)+'</p>'}).join('')+'</div>'+(aimg?'<div class="about-img rev"><img src="'+esc(aimg)+'" alt="'+esc(nombre)+'" loading="lazy" width="800" height="640"><div class="hl-sc" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></div></div>':'')+'</div></section>';
 if(ps.length&&!aimg)sobreH=sobreH.replace('class="wrap about"><div class="rev">','class="wrap"><div class="rev" style="max-width:740px">');

 var galH='';
 if(gal.length)galH='<section class="sec bone" id="galeria"><div class="wrap"><div class="eyebrow">Galería</div><h2>'+esc(txt(d.t_galeria,60)||'Así trabajamos')+'</h2><div class="gal">'+gal.map(function(g,i){return '<button type="button" data-lb="'+esc(g)+'" aria-label="Ampliar foto '+(i+1)+'"><img src="'+esc(g)+'" alt="Foto de '+esc(nombre)+' '+(i+1)+'" loading="lazy" width="400" height="400"></button>'}).join('')+'</div></div></section>';

 var revH='';
 if(rev.length)revH='<section class="sec" id="opiniones"><div class="wrap"><div class="eyebrow">Opiniones</div><h2>Lo que dicen <em>nuestros clientes</em></h2><div class="rv">'+
  rev.map(function(r){var n=Math.max(1,Math.min(5,parseInt(r.estrellas,10)||5)),au=txt(r.autor,60)||'Cliente';
   return '<article class="rvc rev"><div class="stars" role="img" aria-label="'+n+' de 5 estrellas">'+'★'.repeat(n)+'<span style="opacity:.28">'+'★'.repeat(5-n)+'</span></div><p>'+esc(txt(r.texto,520))+'</p><div class="rv-by"><span class="av" aria-hidden="true">'+esc(au[0].toUpperCase())+'</span><span>'+esc(au)+'<small>'+ico('g')+'Reseña de Google'+(r.fecha?' · '+esc(txt(r.fecha,30)):'')+'</small></span></div></article>'}).join('')+'</div>'+
  '<div class="rv-foot">'+(fichaG?a(fichaG,'btn alt','Ver todas las reseñas en Google'+ico('arrow'),1):'')+'<span>Reseñas publicadas por clientes en la ficha de Google del negocio.</span></div></div></section>';

 var faqH='';
 if(faqs.length)faqH='<section class="sec bone" id="preguntas"><div class="wrap"><div class="eyebrow">Preguntas</div><h2>Preguntas frecuentes</h2><div class="faq">'+faqs.map(function(q){return '<details><summary>'+esc(txt(q.p,160))+'</summary><div>'+esc(txt(q.r,600))+'</div></details>'}).join('')+'</div></div></section>';

 var info='';
 if(dir||ciudad)info+='<div>'+ico('pin')+'<p><b>Dirección</b><span>'+esc([dir,ciudad].filter(Boolean).join(', '))+'</span></p></div>';
 if(horario.length)info+='<div>'+ico('clock')+'<p><b>Horario</b><span>'+horario.map(esc).join('<br>')+'</span></p></div>';
 if(telD)info+='<div>'+ico('phone')+'<p><b>Teléfono</b>'+a('tel:+'+telD,'','+'+esc(telD.replace(/^34(\d{3})(\d{3})(\d{3})$/,'34 $1 $2 $3')))+'</p></div>';
 if(mailOk)info+='<div>'+ico('mail')+'<p><b>Email</b>'+a('mailto:'+mailOk,'',esc(mailOk))+'</p></div>';
 var soc=(ig?a(ig,'','' + ico('ig'),1).replace('<a ','<a aria-label="Instagram" '):'')+(fbk?a(fbk,'',ico('fb'),1).replace('<a ','<a aria-label="Facebook" '):'')+(web?a(web,'',ico('globe'),1).replace('<a ','<a aria-label="Web" '):'');
 var contH='<section class="sec" id="contacto"><div class="wrap contact"><div class="rev"><div class="eyebrow">Contacto</div><h2>'+esc(txt(d.t_contacto,60)||'Hablemos')+'</h2><div class="info">'+info+(soc?'<div>'+ico('spark')+'<p><b>Síguenos</b></p></div><div class="soc" style="margin-left:34px">'+soc+'</div>':'')+'</div><div class="hl-map" aria-hidden="true"><b>'+esc(txt(ciudad,40))+'</b><span class="hl-pin"></span></div></div>'+
  '<aside class="cta-card rev"><h3>¿Te llamamos?</h3><p>Escríbenos o llámanos y te respondemos lo antes posible.</p>'+(waD?a(waMsg,'btn',ico('wa')+'Escribir por WhatsApp',1):'')+(telD?a('tel:+'+telD,'btn alt',ico('phone')+'Llamar ahora'):'')+a(mapa,'btn alt',ico('pin')+'Cómo llegar',1)+'</aside></div></section>';

 var foot='<footer><div class="wrap"><div class="fg"><div><a class="brand" href="#top"><span class="logo">'+(logo?'<img src="'+esc(logo)+'" alt="" width="46" height="46">':esc(ini))+'</span><span><b>'+esc(nombre)+'</b>'+(subtxt?'<small>'+esc(subtxt)+'</small>':'')+'</span></a>'+(d.descripcion?'<p>'+esc(txt(d.descripcion,160))+'</p>':'')+'</div>'+
  '<div><h4>Navegación</h4><ul><li><a href="#top">Inicio</a></li>'+(serv.length?'<li><a href="#servicios">Servicios</a></li>':'')+(rev.length?'<li><a href="#opiniones">Opiniones</a></li>':'')+'<li><a href="#contacto">Contacto</a></li></ul></div>'+
  '<div><h4>Contacto</h4><ul>'+(telD?'<li>'+a('tel:+'+telD,'','+'+esc(telD))+'</li>':'')+(mailOk?'<li>'+a('mailto:'+mailOk,'',esc(mailOk))+'</li>':'')+(dir?'<li>'+esc(dir)+'</li>':'')+'</ul></div></div>'+
  '<div class="fb"><span>© <span id="yr">2026</span> '+esc(nombre)+'</span><span>Propuesta de diseño creada por <a href="https://whitemoon.es" target="_blank" rel="noopener">WhiteMoon Agencia IA</a> · no es la web oficial del negocio</span></div>'+cred+'</div></footer>';

 var fab=waD?'<a class="fab" href="'+esc(waMsg)+'" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">'+ico('wa')+'<span>WhatsApp</span></a>':'';
 var demo='<div class="demo-bar">Propuesta de web para <b>'+esc(nombre)+'</b>, creada por <a href="https://whitemoon.es" target="_blank" rel="noopener">WhiteMoon Agencia IA</a>. Es una vista previa: aún no es la web oficial.</div>';

 var js='(function(){var b=document.getElementById("bg"),m=document.getElementById("mm");if(b&&m){b.addEventListener("click",function(){var o=m.classList.toggle("on");b.setAttribute("aria-expanded",o)});m.addEventListener("click",function(e){if(e.target.tagName==="A"){m.classList.remove("on");b.setAttribute("aria-expanded","false")}})}'+
  'var hs=document.querySelectorAll(".hl,.about-img,.hl-map,footer");if("IntersectionObserver"in window){var ho=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("hl-on",e.isIntersecting)})},{threshold:.15});hs.forEach(function(e){ho.observe(e)})}else{hs.forEach(function(e){e.classList.add("hl-on")})}'+
  'var y=document.getElementById("yr");if(y)y.textContent=new Date().getFullYear();'+
  'document.documentElement.classList.add("js");var els=document.querySelectorAll(".rev");setTimeout(function(){els.forEach(function(e){e.classList.add("in")})},2000);if("IntersectionObserver"in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.12});els.forEach(function(e){io.observe(e)})}else{els.forEach(function(e){e.classList.add("in")})}'+
  'var lb=document.getElementById("lb"),li=lb&&lb.querySelector("img");document.querySelectorAll("[data-lb]").forEach(function(x){x.addEventListener("click",function(){li.src=x.getAttribute("data-lb");lb.classList.add("on")})});if(lb){lb.addEventListener("click",function(){lb.classList.remove("on")});document.addEventListener("keydown",function(e){if(e.key==="Escape")lb.classList.remove("on")})}})();';

 var tIt=nombre+(subtxt?' · '+subtxt:'');
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>'+esc(tIt)+'</title><meta name="robots" content="noindex,nofollow"><meta name="description" content="'+esc(txt(d.subtitulo||d.descripcion,150))+'"><meta name="theme-color" content="'+esc(P.p)+'">'+
  '<style>'+css(P,base)+holo(P)+'</style></head><body>'+demo+nav+heroH+mq+servH+sobreH+galH+revH+faqH+contH+foot+fab+'<div class="lb" id="lb" role="dialog" aria-label="Foto ampliada"><img alt=""></div><script>'+js+'<\/script></body></html>';
}

window.WMWeb={documento:documento,paleta:paleta,esc:esc,url:url,tel:tel,contrast:contrast,hex:hex,rgb2hsl:rgb2hsl,h2r:h2r};
})();
