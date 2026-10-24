/* =====================================================================
   OUTILS COMMUNS DES LABORATOIRES
   Chargé par site.js avant les fichiers labos/*.js. Tout est rangé dans
   window.Labo ; un fichier de labo commence par
     const {carcasse, reglette, lier, puces, Toile, etiquette, nb, ...} = window.Labo;
   Contenu :
     carcasse(el,{titre,intro,gauche})  en-tête + colonne de dessin + colonne de réglages
     reglette(u,cle,label,min,max,pas,val,classe)  une réglette (HTML)
     lier(d,st,formats,change)          relie les réglettes à l'état st
     puces(cont,liste,actif,surChoix)   une rangée de boutons à choix unique
     Toile(canvas,dessiner)             taille, écran Retina, thème, redessin
     etiquette(ctx,texte,x,y,couleur,o) texte lisible sur n'importe quel fond
     nb(v,d) nombre à la française ; lire(s) l'inverse ; hasard(a,b) entier au hasard
   ===================================================================== */
(function(){
"use strict";
const maths=el=>{ if(window.Site&&Site.maths) Site.maths(el); };
const css=n=>getComputedStyle(document.body).getPropertyValue(n).trim();
const reduit=matchMedia('(prefers-reduced-motion: reduce)').matches;
const id=()=>'l'+Math.random().toString(36).slice(2,8);
const nb=(v,d)=>isFinite(v)?v.toFixed(d==null?2:d).replace('.',',').replace('-','−'):'—';
const hasard=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const lire=s=>parseFloat(String(s).trim().replace('−','-').replace(/\s/g,'').replace(',','.'));
const POLICE='"Atkinson Hyperlegible", system-ui, sans-serif';

/* ---------- carcasse et réglages communs ---------- */
function carcasse(el,o){
  el.innerHTML='<div class="labo-tete"><span class="badge">Laboratoire</span><h3>'+o.titre+'</h3>'+(o.intro?'<p>'+o.intro+'</p>':'')+'</div>'+
    '<div class="labo-corps"><div class="labo-gauche">'+o.gauche+'</div><div class="labo-droite reglages"></div></div>';
  return {g:el.querySelector('.labo-gauche'),d:el.querySelector('.labo-droite')};
}
/* une réglette : <input type=range data-r="cle"> et sa valeur affichée <span data-v="cle"> */
function reglette(u,cle,label,min,max,pas,val,classe){
  return '<div class="champ"><div class="ligne-val"><label for="'+u+cle+'">'+label+'</label><span class="valeur" data-v="'+cle+'"></span></div>'+
    '<input type="range" id="'+u+cle+'" data-r="'+cle+'" min="'+min+'" max="'+max+'" step="'+pas+'" value="'+val+'"'+(classe?' class="'+classe+'"':'')+'></div>';
}
function lier(d,st,formats,change){
  const affiche=k=>{ const s=d.querySelector('[data-v="'+k+'"]'); if(s) s.textContent=formats[k]?formats[k](st[k]):st[k]; };
  d.querySelectorAll('input[data-r]').forEach(r=>{ const k=r.dataset.r; st[k]=+r.value; affiche(k);
    r.addEventListener('input',()=>{ st[k]=+r.value; affiche(k); change(k); }); });
  return {regler(k,v){ st[k]=v; const r=d.querySelector('[data-r="'+k+'"]'); if(r) r.value=v; affiche(k); }, affiche};
}
function puces(cont,liste,actif,surChoix){
  cont.innerHTML=liste.map((p,i)=>'<button type="button" class="puce" data-i="'+i+'" aria-pressed="'+(i===actif)+'">'+p+'</button>').join('');
  cont.addEventListener('click',e=>{ const b=e.target.closest('.puce'); if(!b||b.disabled) return; cont.querySelectorAll('.puce').forEach(x=>x.setAttribute('aria-pressed',x===b)); surChoix(+b.dataset.i); });
}

/* ---------- une zone de dessin : taille, écran Retina, thème ---------- */
function Toile(cv,dessiner){
  const T={ctx:cv.getContext('2d'),W:0,H:0,r:1};
  T.taille=()=>{ const w=cv.clientWidth,h=cv.clientHeight; if(!w||!h) return false; const r=Math.min(2,window.devicePixelRatio||1);
    if(cv.width!==Math.round(w*r)||cv.height!==Math.round(h*r)){ cv.width=Math.round(w*r); cv.height=Math.round(h*r); }
    T.ctx.setTransform(r,0,0,r,0,0); T.W=w; T.H=h; T.r=r; return true; };
  let prevu=false;
  T.redessiner=()=>{ if(prevu) return; prevu=true; requestAnimationFrame(()=>{ prevu=false; if(T.taille()) dessiner(T); }); };
  T.maintenant=()=>{ if(T.taille()) dessiner(T); };
  if(window.ResizeObserver) new ResizeObserver(T.redessiner).observe(cv); else addEventListener('resize',T.redessiner);
  new MutationObserver(T.redessiner).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const mq=matchMedia('(prefers-color-scheme: dark)'); if(mq.addEventListener) mq.addEventListener('change',T.redessiner);
  return T;
}
/* texte lisible sur n'importe quel fond : un liseré de la couleur du papier */
function etiquette(c,t,x,y,coul,o){ o=o||{}; c.save(); c.font=(o.italique?'italic ':'')+(o.gras===false?'600 ':'700 ')+(o.taille||15)+'px '+POLICE;
  c.textAlign=o.align||'left'; c.textBaseline='middle'; c.lineJoin='round'; c.lineWidth=4; c.strokeStyle=o.halo||css('--feuille'); c.strokeText(t,x,y); c.fillStyle=coul; c.fillText(t,x,y); c.restore(); }


window.Labo={maths,css,reduit,id,nb,hasard,lire,POLICE,carcasse,reglette,lier,puces,Toile,etiquette};
})();
