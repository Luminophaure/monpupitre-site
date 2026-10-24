/* =====================================================================
   LABORATOIRES — chapitre « Vecteurs, droites et plans de l'espace »
   Utilisation dans une page :
     <div class="labo" data-labo="espace" data-outil="droites"></div>
   Outils : droites · coplanaires · parametre · droitePlan
   Toutes les scènes sont en 3D : on les fait tourner au doigt, à la souris,
   ou au clavier (flèches) quand la scène a le focus.
   ===================================================================== */
(function(){
"use strict";
const maths=el=>{ if(window.Site&&Site.maths) Site.maths(el); };
const css=n=>getComputedStyle(document.body).getPropertyValue(n).trim();
const id=()=>'e'+Math.random().toString(36).slice(2,8);
const reduit=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- petite algèbre ---------- */
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(k,a)=>[k*a[0],k*a[1],k*a[2]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norme=a=>Math.sqrt(dot(a,a));
const det=(a,b,c)=>dot(a,cross(b,c));
const EPS=1e-9;
/* couleur CSS (#rrggbb ou #rgb) avec transparence, pour le canvas */
function alpha(c,a){ c=String(c).trim(); let m=c.match(/^#([0-9a-f]{3})$/i); if(m) c='#'+m[1].split('').map(x=>x+x).join('');
  m=c.match(/^#([0-9a-f]{6})$/i); if(!m) return c; const n=parseInt(m[1],16); return 'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
/* nombre lisible : 2 · −1,5 · 0,33 */
function nb(v,d){ if(Math.abs(v)<1e-9) v=0; const k=Math.pow(10,d==null?2:d); return (Math.round(v*k)/k).toString().replace('.',',').replace('-','−'); }
/* fraction simple si possible : 1/2, −3/4 ; sinon décimal */
function frac(v){ if(Math.abs(v-Math.round(v))<1e-9) return nb(Math.round(v),0);
  for(let q=2;q<=12;q++){ const p=v*q; if(Math.abs(p-Math.round(p))<1e-9){ const P=Math.round(p); return (P<0?'-':'')+'\\frac{'+Math.abs(P)+'}{'+q+'}'; } } return nb(v); }
const texN=v=>frac(v).replace('−','-').replace(',','{,}');
const col=v=>'\\begin{pmatrix}'+v.map(texN).join('\\\\')+'\\end{pmatrix}';
const coords=v=>'('+v.map(texN).join('\\,;')+')';

/* =================================================================
   LE MOTEUR 3D : une scène qu'on fait tourner
   ================================================================= */
function Scene(canvas,o){
  const S={az:o.az!=null?o.az:-0.62, el:o.el!=null?o.el:0.42, L:o.L||4, dessin:null, cible:null};
  const ctx=canvas.getContext('2d');
  let W=0,H=0,ech=1,cx=0,cy=0;
  function proj(p){
    const ca=Math.cos(S.az), sa=Math.sin(S.az), ce=Math.cos(S.el), se=Math.sin(S.el);
    const x1=p[0]*ca-p[1]*sa, y1=p[0]*sa+p[1]*ca, z1=p[2];
    const haut=z1*ce+y1*se, prof=y1*ce-z1*se;
    const D=S.L*7, f=D/(D+prof);
    return {x:cx+ech*x1*f, y:cy-ech*haut*f, prof};
  }
  S.proj=proj;
  function taille(){ const w=canvas.clientWidth, h=canvas.clientHeight; if(!w||!h) return false;
    const r=Math.min(2,window.devicePixelRatio||1); if(canvas.width!==Math.round(w*r)||canvas.height!==Math.round(h*r)){ canvas.width=Math.round(w*r); canvas.height=Math.round(h*r); }
    ctx.setTransform(r,0,0,r,0,0); W=w; H=h; cx=w/2; cy=h/2+h*0.02; ech=Math.min(w,h)/(S.L*2.6); return true; }
  const C=()=>({ink:css('--ink'),muted:css('--muted'),line:css('--line'),grid:css('--grid'),card:css('--card'),mc:css('--mc')||css('--blue'),pink:css('--pink'),ok:css('--ok'),ko:css('--ko'),blue:css('--blue')});
  let couleurs=null;
  S.c=()=>couleurs||(couleurs=C());
  /* --- primitives --- */
  S.segment=(a,b,coul,ep,tirets)=>{ const A=proj(a),B=proj(b); ctx.save(); ctx.strokeStyle=coul; ctx.lineWidth=ep||2; ctx.lineCap='round'; if(tirets) ctx.setLineDash(tirets); ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke(); ctx.restore(); };
  S.fleche=(a,b,coul,ep)=>{ const A=proj(a),B=proj(b); const dx=B.x-A.x, dy=B.y-A.y, l=Math.hypot(dx,dy); if(l<2) return; const ux=dx/l, uy=dy/l, t=Math.min(12,l*0.4);
    ctx.save(); ctx.strokeStyle=coul; ctx.fillStyle=coul; ctx.lineWidth=ep||2.6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x-ux*t*0.7,B.y-uy*t*0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(B.x,B.y); ctx.lineTo(B.x-ux*t-uy*t*0.45,B.y-uy*t+ux*t*0.45); ctx.lineTo(B.x-ux*t+uy*t*0.45,B.y-uy*t-ux*t*0.45); ctx.closePath(); ctx.fill(); ctx.restore(); };
  S.point=(p,coul,r)=>{ const P=proj(p); ctx.save(); ctx.fillStyle=coul; ctx.strokeStyle=S.c().card; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(P.x,P.y,r||5.5,0,7); ctx.fill(); ctx.stroke(); ctx.restore(); };
  S.texte=(p,t,coul,dx,dy,gras)=>{ const P=proj(p); ctx.save(); ctx.font=(gras?'700 ':'600 ')+'15px "Atkinson Hyperlegible", system-ui, sans-serif'; ctx.textBaseline='middle';
    const w=ctx.measureText(t).width; let x=P.x+(dx==null?8:dx), y=P.y+(dy==null?-10:dy); x=Math.max(2,Math.min(W-w-2,x)); y=Math.max(10,Math.min(H-10,y));
    ctx.lineWidth=4; ctx.strokeStyle=S.c().card; ctx.strokeText(t,x,y); ctx.fillStyle=coul; ctx.fillText(t,x,y); ctx.restore(); };
  S.poly=(pts,remp,trait)=>{ if(pts.length<3) return; ctx.save(); ctx.beginPath(); pts.forEach((p,i)=>{ const P=proj(p); if(i) ctx.lineTo(P.x,P.y); else ctx.moveTo(P.x,P.y); }); ctx.closePath(); if(remp){ ctx.fillStyle=remp; ctx.fill(); } if(trait){ ctx.strokeStyle=trait; ctx.lineWidth=1.2; ctx.stroke(); } ctx.restore(); };
  /* droite infinie coupée par la boîte [-L ; L]^3 */
  S.couper=(A,u)=>{ let t0=-1e9,t1=1e9; const L=S.L;
    for(let i=0;i<3;i++){ if(Math.abs(u[i])<EPS){ if(Math.abs(A[i])>L) return null; continue; } let a=(-L-A[i])/u[i], b=(L-A[i])/u[i]; if(a>b){const z=a;a=b;b=z;} t0=Math.max(t0,a); t1=Math.min(t1,b); }
    return t0<t1?[add(A,mul(t0,u)),add(A,mul(t1,u))]:null; };
  S.droite=(A,u,coul,ep,tirets)=>{ const s=S.couper(A,u); if(s) S.segment(s[0],s[1],coul,ep||3,tirets); return s; };
  /* plan (point + vecteur normal) coupé par la boîte : un polygone convexe */
  S.morceauPlan=(A,n)=>{ const L=S.L, pts=[]; const som=[]; for(const x of [-L,L]) for(const y of [-L,L]) for(const z of [-L,L]) som.push([x,y,z]);
    const ar=[]; for(let i=0;i<8;i++) for(let j=i+1;j<8;j++){ const d=sub(som[i],som[j]); if(Math.abs(norme(d)-2*L)<1e-9) ar.push([som[i],som[j]]); }
    ar.forEach(([p,q])=>{ const fp=dot(n,sub(p,A)), fq=dot(n,sub(q,A)); if((fp<=0&&fq>=0)||(fp>=0&&fq<=0)){ if(Math.abs(fp-fq)<EPS) return; const t=fp/(fp-fq); pts.push(add(p,mul(t,sub(q,p)))); } });
    if(pts.length<3) return [];
    const g=mul(1/pts.length,pts.reduce(add,[0,0,0])); const e1=(()=>{ for(const p of pts){ const d=sub(p,g); if(norme(d)>1e-6) return mul(1/norme(d),d);} return [1,0,0]; })(); const e2=cross(n,e1);
    return pts.map(p=>({p,a:Math.atan2(dot(sub(p,g),e2),dot(sub(p,g),e1))})).sort((a,b)=>a.a-b.a).map(o=>o.p); };
  S.plan=(A,n,remp,trait)=>{ const pts=S.morceauPlan(A,n); S.poly(pts,remp,trait); return pts; };
  S.axes=()=>{ const c=S.c(), L=S.L;
    // quadrillage du sol z = 0
    ctx.save(); ctx.globalAlpha=0.75; for(let k=-L;k<=L;k++){ S.segment([k,-L,0],[k,L,0],c.grid,1); S.segment([-L,k,0],[L,k,0],c.grid,1); } ctx.restore();
    [[[L+0.6,0,0],'x'],[[0,L+0.6,0],'y'],[[0,0,L+0.6],'z']].forEach(([p,n])=>{ S.fleche([0,0,0],p,c.muted,1.5); S.texte(p,n,c.muted,4,-8,true); });
  };
  S.dessiner=()=>{ if(!taille()) return; couleurs=null; ctx.clearRect(0,0,W,H); if(S.dessin) S.dessin(S); };
  /* --- interaction : tourner --- */
  let glisse=null;
  canvas.addEventListener('pointerdown',e=>{ glisse={x:e.clientX,y:e.clientY}; try{canvas.setPointerCapture(e.pointerId);}catch(err){} S.arreter(); });
  canvas.addEventListener('pointermove',e=>{ if(!glisse) return; S.az-=(e.clientX-glisse.x)*0.01; S.el=Math.max(-0.2,Math.min(1.5,S.el+(e.clientY-glisse.y)*0.01)); glisse={x:e.clientX,y:e.clientY}; S.dessiner(); });
  const fin=()=>{ glisse=null; }; canvas.addEventListener('pointerup',fin); canvas.addEventListener('pointercancel',fin);
  canvas.tabIndex=0;
  canvas.addEventListener('keydown',e=>{ const k={ArrowLeft:[0.12,0],ArrowRight:[-0.12,0],ArrowUp:[0,0.08],ArrowDown:[0,-0.08]}[e.key]; if(!k) return; e.preventDefault(); S.az+=k[0]; S.el=Math.max(-0.2,Math.min(1.5,S.el+k[1])); S.dessiner(); });
  /* vues prédéfinies, animées */
  let anim=null;
  S.arreter=()=>{ if(anim){ cancelAnimationFrame(anim); anim=null; } };
  S.vue=(az,el)=>{ S.arreter(); if(reduit){ S.az=az; S.el=el; S.dessiner(); return; }
    let d=az-S.az; d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI; const a0=S.az, e0=S.el, t0=performance.now();
    const pas=t=>{ const k=Math.min(1,(t-t0)/600), s=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; S.az=a0+d*s; S.el=e0+(el-e0)*s; S.dessiner(); if(k<1) anim=requestAnimationFrame(pas); else anim=null; }; anim=requestAnimationFrame(pas); };
  if(window.ResizeObserver) new ResizeObserver(()=>S.dessiner()).observe(canvas); else addEventListener('resize',S.dessiner);
  // changement de thème clair / sombre
  new MutationObserver(()=>S.dessiner()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  return S;
}

/* ---------- carcasse commune ---------- */
function carcasse(el,o){
  el.innerHTML='<div class="labo-tete"><span class="badge">Labo 3D</span><h3>'+o.titre+'</h3>'+(o.intro?'<p>'+o.intro+'</p>':'')+'</div>'+
    '<div class="labo-corps"><div class="labo-gauche"><canvas class="scene3d" role="img" aria-label="'+(o.aria||'Scène en trois dimensions')+'"></canvas>'+
    '<div class="vues"><span class="discret">Glisse pour tourner.</span><button type="button" class="puce" data-v="3d">Vue 3D</button><button type="button" class="puce" data-v="dessus">'+(o.dessus||'Vue de dessus')+'</button><button type="button" class="puce" data-v="face">Vue de face</button></div></div>'+
    '<div class="labo-droite reglages"></div></div>';
  const cv=el.querySelector('canvas'); const S=Scene(cv,o);
  el.querySelector('.vues').addEventListener('click',e=>{ const b=e.target.closest('[data-v]'); if(!b) return; const v=b.dataset.v;
    if(v==='3d') S.vue(-0.62,0.42); else if(v==='dessus') S.vue(0,Math.PI/2-0.001); else S.vue(0,0); });
  return {S,d:el.querySelector('.labo-droite')};
}
function puces(cont,liste,actif,surChoix){
  cont.innerHTML=liste.map((p,i)=>'<button type="button" class="puce" data-i="'+i+'" aria-pressed="'+(i===actif)+'">'+p+'</button>').join('');
  cont.addEventListener('click',e=>{ const b=e.target.closest('.puce'); if(!b) return; cont.querySelectorAll('.puce').forEach(x=>x.setAttribute('aria-pressed',x===b)); surChoix(+b.dataset.i); });
  maths(cont);
}
function curseur(u,etiq,min,max,pas,val,classe){
  return '<div class="champ"><div class="ligne-val"><label for="'+u+'">'+etiq+'</label><span class="valeur" data-pour="'+u+'"></span></div><input type="range" id="'+u+'" min="'+min+'" max="'+max+'" step="'+pas+'" value="'+val+'"'+(classe?' class="'+classe+'"':'')+'></div>';
}

/* =================================================================
   1. DEUX DROITES DANS L'ESPACE
   ================================================================= */
function droites(el){
  const {S,d}=carcasse(el,{titre:'Deux droites dans l\'espace',dessus:'Vue radar (dessus)',aria:'Deux droites d et d prime dans l\'espace',
    intro:'Vues de dessus, comme sur un écran radar, deux trajectoires qui ne sont pas parallèles semblent toujours se croiser. Fais monter ou tourner $d\'$ : les deux droites se coupent-elles vraiment ?'});
  const u=id();
  d.innerHTML=
    curseur(u+'h','Hauteur de $d\'$',-3,3,0.5,1.5,'rose')+
    curseur(u+'a','Rotation de $d\'$',-90,90,15,60,'rose')+
    '<div class="champ"><span class="etiq">Ton pronostic</span><div class="puces prono"></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={h:1.5,a:60,prono:null};
  const P0=[0,0,0.5], U=[2,1,0.5];
  const CHOIX=['Sécantes','Parallèles','Confondues','Non coplanaires'];
  const pr=q('.prono');
  puces(pr,CHOIX,-1,i=>{ st.prono=i; maj(); });
  function modele(){ const a=st.a*Math.PI/180; const V=[U[0]*Math.cos(a)-U[1]*Math.sin(a),U[0]*Math.sin(a)+U[1]*Math.cos(a),U[2]]; const B=add(P0,[0,0,st.h]); return {V,B}; }
  function etude(){ const {V,B}=modele(); const n=cross(U,V);
    if(norme(n)<1e-9){ const conf=norme(cross(sub(B,P0),U))<1e-9; return {cas:conf?2:1,V,B}; }
    const dt=det(U,V,sub(B,P0));
    // points les plus proches : P0 + t U et B + s V
    const w=sub(P0,B), a=dot(U,U), b=dot(U,V), c=dot(V,V), dd=dot(U,w), e=dot(V,w), den=a*c-b*b;
    const t=(b*e-c*dd)/den, s=(a*e-b*dd)/den; const M1=add(P0,mul(t,U)), M2=add(B,mul(s,V));
    return Math.abs(dt)<1e-9 ? {cas:0,V,B,K:M1} : {cas:3,V,B,M1,M2,ecart:norme(sub(M1,M2))}; }
  S.dessin=s=>{ const c=s.c(), r=etude(); s.axes();
    s.droite(P0,U,c.mc,3.2); s.droite(r.B,r.V,c.pink,3.2,r.cas===2?[10,8]:null);
    if(r.cas===3){ s.segment(r.M1,r.M2,c.ink,1.6,[4,4]); s.point(r.M1,c.mc,4); s.point(r.M2,c.pink,4); }
    if(r.cas===0) s.point(r.K,c.ok,7);
    const e1=s.couper(P0,U), e2=s.couper(r.B,r.V);
    if(e1) s.texte(e1[1],'d',c.mc,6,-12,true); if(e2) s.texte(e2[0],'d′',c.pink,6,-12,true);
  };
  function maj(){
    q('[data-pour="'+u+'h"]').textContent=nb(st.h); q('[data-pour="'+u+'a"]').textContent=nb(st.a,0)+'°';
    const r=etude(); const v=q('.verdict');
    const texte=[
      '<strong>Sécantes.</strong> Les droites se coupent en un point (en vert). Elles sont dans un même plan.',
      '<strong>Parallèles, strictement.</strong> Même direction, aucun point commun. Elles sont dans un même plan.',
      '<strong>Confondues.</strong> Même direction et un point commun : c\'est la même droite.',
      '<strong>Non coplanaires.</strong> Pas la même direction, et pourtant aucun point commun : l\'écart le plus court entre elles mesure environ '+nb(r.ecart||0,1)+' (en pointillés). En vue radar, elles semblent pourtant se croiser.'][r.cas];
    if(st.prono==null){ v.className='verdict info'; v.innerHTML='<span>Choisis ton pronostic pour voir le verdict. Tourne la scène pour t\'aider.</span>'; }
    else { const bon=st.prono===r.cas; v.className='verdict '+(bon?'ok':'ko'); v.innerHTML=(bon?'<span>Bien vu !</span>':'<span>Pas tout à fait.</span>')+'<span>'+texte+'</span>'; }
    S.dessiner();
  }
  q('#'+u+'h').addEventListener('input',e=>{ st.h=+e.target.value; st.prono=null; pr.querySelectorAll('.puce').forEach(x=>x.setAttribute('aria-pressed','false')); maj(); });
  q('#'+u+'a').addEventListener('input',e=>{ st.a=+e.target.value; st.prono=null; pr.querySelectorAll('.puce').forEach(x=>x.setAttribute('aria-pressed','false')); maj(); });
  maj(); maths(el);
}

/* =================================================================
   2. COPLANAIRES OU BASE ?
   ================================================================= */
function coplanaires(el){
  const {S,d}=carcasse(el,{titre:'Coplanaires ou base ?',aria:'Les vecteurs u, v et w dessinés depuis l\'origine, avec le plan dirigé par u et v',L:3.5,
    intro:'Le plan coloré est dirigé par $\\vec u\\begin{pmatrix}1\\\\1\\\\0\\end{pmatrix}$ et $\\vec v\\begin{pmatrix}0\\\\1\\\\2\\end{pmatrix}$. Règle les coordonnées de $\\vec w$ : quand $\\vec w$ reste dans le plan, les trois vecteurs sont coplanaires. Sinon, ils forment une base.'});
  const u=id();
  d.innerHTML='<div class="champ"><span class="etiq">Exemples</span><div class="puces ex"></div></div>'+
    curseur(u+'x','$x$ de $\\vec w$',-3,3,1,1)+curseur(u+'y','$y$ de $\\vec w$',-3,3,1,2)+curseur(u+'z','$z$ de $\\vec w$',-3,3,1,0)+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const U=[1,1,0], V=[0,1,2], N=cross(U,V);
  const st={w:[1,2,0]};
  const EX=[['$\\vec u+\\vec v$',[1,2,2]],['$2\\vec u-\\vec v$',[2,1,-2]],['$\\vec k$',[0,0,1]],['$(1\\,;-1\\,;0)$',[1,-1,0]]];
  puces(q('.ex'),EX.map(e=>e[0]),-1,i=>{ st.w=EX[i][1].slice(); ['x','y','z'].forEach((k,j)=>q('#'+u+k).value=st.w[j]); maj(); });
  S.dessin=s=>{ const c=s.c(); s.axes(); const w=st.w, cop=Math.abs(det(U,V,w))<1e-9;
    s.plan([0,0,0],N,alpha(c.mc,0.16),alpha(c.mc,0.45));
    if(cop){ const ab=decomp(w); if(ab){ const P=mul(ab[0],U); s.segment([0,0,0],P,c.mc,1.6,[5,5]); s.segment(P,w,c.ink,1.6,[5,5]); } }
    else { // le parallélépipède construit sur u, v, w
      const O=[0,0,0], pts=[O,U,V,w,add(U,V),add(U,w),add(V,w),add(add(U,V),w)];
      [[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]].forEach(([i,j])=>s.segment(pts[i],pts[j],c.muted,1,[3,4])); }
    s.fleche([0,0,0],U,c.mc,3); s.fleche([0,0,0],V,c.mc,3); s.fleche([0,0,0],w,cop?c.ok:c.pink,3.4);
    s.texte(U,'u',c.mc,6,-10,true); s.texte(V,'v',c.mc,6,-10,true); s.texte(w,'w',cop?c.ok:c.pink,6,-10,true);
  };
  function decomp(w){ // w = a u + b v  (moindres carrés, exact si coplanaire)
    const a11=dot(U,U), a12=dot(U,V), a22=dot(V,V), b1=dot(U,w), b2=dot(V,w), D=a11*a22-a12*a12; if(Math.abs(D)<1e-12) return null;
    return [(b1*a22-b2*a12)/D,(a11*b2-a12*b1)/D]; }
  function maj(){
    ['x','y','z'].forEach((k,j)=>q('[data-pour="'+u+k+'"]').textContent=nb(st.w[j],0));
    const w=st.w, v=q('.verdict'), D=det(U,V,w);
    if(norme(w)<1e-9){ v.className='verdict info'; v.innerHTML='<span>$\\vec w=\\vec 0$ : le vecteur nul est coplanaire avec n\'importe quels vecteurs.</span>'; }
    else if(Math.abs(D)<1e-9){ const [a,b]=decomp(w); v.className='verdict ok';
      const cf=(x,signe)=>{ const t=texN(x); const c= t==='1'?'':t==='-1'?'-':t; return (signe&&x>0?'+':'')+c; };
      v.innerHTML='<strong>Coplanaires.</strong><span>$\\vec w='+cf(a)+'\\vec u'+cf(b,true)+'\\vec v$ : en pointillés, le chemin « $'+cf(a)+'\\vec u$ puis $'+cf(b)+'\\vec v$ ». $\\vec w$ reste dans le plan.</span>'; }
    else { v.className='verdict ko'; v.innerHTML='<strong>Base de l\'espace.</strong><span>Aucun couple $(a\\,;b)$ ne donne $\\vec w=a\\vec u+b\\vec v$ : $\\vec w$ sort du plan. Les trois vecteurs construisent une « boîte » (en pointillés) qui n\'est pas aplatie.</span>'; }
    maths(v); S.dessiner();
  }
  ['x','y','z'].forEach((k,j)=>q('#'+u+k).addEventListener('input',e=>{ st.w[j]=+e.target.value; q('.ex').querySelectorAll('.puce').forEach(x=>x.setAttribute('aria-pressed','false')); maj(); }));
  maj(); maths(el);
}

/* =================================================================
   3. LA DROITE EN MARCHE : représentation paramétrique
   ================================================================= */
function parametre(el){
  const {S,d}=carcasse(el,{titre:'La droite en marche',aria:'Un point M qui se déplace sur une droite ou un plan selon le paramètre',
    intro:'Chaque valeur du paramètre donne un point. Fais varier $t$ : le point $M$ parcourt toute la droite. En mode plan, deux paramètres font balayer tout un plan.'});
  const u=id();
  d.innerHTML='<div class="champ"><span class="etiq">Objet</span><div class="puces mode"></div></div>'+
    curseur(u+'t','Paramètre $t$',-3,3,0.1,0.5)+
    '<div class="champ bloc-plan" hidden>'+curseur(u+'s','Paramètre $s$',-3,3,0.1,1).replace('<div class="champ">','<div>')+'</div>'+
    '<div class="calcul systeme" aria-live="polite"></div>'+
    '<button type="button" class="btn fantome trace">Effacer la trace</button>';
  const q=s=>d.querySelector(s);
  const A=[1,-1,1], U=[1,1,-0.5], V=[-1,0.5,0.5];
  const st={mode:0,t:0.5,s:1,trace:[]};
  puces(q('.mode'),['Une droite','Un plan'],0,i=>{ st.mode=i; q('.bloc-plan').hidden=i===0; st.trace=[]; maj(); });
  function M(){ return st.mode===0 ? add(A,mul(st.t,U)) : add(add(A,mul(st.t,U)),mul(st.s,V)); }
  S.dessin=s=>{ const c=s.c(); s.axes();
    if(st.mode===0) s.droite(A,U,c.mc,2,[6,6]);
    else { s.plan(A,cross(U,V),alpha(c.mc,0.14),alpha(c.mc,0.4));
      for(let k=-3;k<=3;k++){ s.segment(add(A,add(mul(k,U),mul(-3,V))),add(A,add(mul(k,U),mul(3,V))),c.line,0.8); s.segment(add(A,add(mul(-3,U),mul(k,V))),add(A,add(mul(3,U),mul(k,V))),c.line,0.8); } }
    st.trace.forEach(p=>s.point(p,alpha(c.pink,0.45),2.6));
    const P1=add(A,mul(st.t,U));
    s.fleche(A,P1,c.mc,3); if(st.mode===1) s.fleche(P1,M(),c.blue,3);
    s.point(A,c.ink,5); s.texte(A,'A',c.ink,-18,-10,true);
    s.point(M(),c.pink,6.5); s.texte(M(),'M',c.pink,8,-12,true);
  };
  function maj(){
    q('[data-pour="'+u+'t"]').textContent=nb(st.t,1); q('[data-pour="'+u+'s"]').textContent=nb(st.s,1);
    const m=M(); const lettres=['x','y','z'];
    let h;
    if(st.mode===0) h='<p>$\\overrightarrow{AM}=t\\,\\vec u$ avec $A'+coords(A)+'$ et $\\vec u'+col(U)+'$</p>'+
      lettres.map((l,i)=>'<p>$'+l+'='+texN(A[i])+(U[i]<0?'':'+')+texN(U[i])+'\\times'+(st.t<0?'('+texN(st.t)+')':texN(st.t))+'='+texN(Math.round(m[i]*100)/100)+'$</p>').join('');
    else h='<p>$\\overrightarrow{AM}=t\\,\\vec u+s\\,\\vec v$ avec $\\vec u'+col(U)+'$ et $\\vec v'+col(V)+'$</p><p>$M'+coords(m.map(x=>Math.round(x*100)/100))+'$</p>';
    q('.systeme').innerHTML=h; maths(q('.systeme'));
    st.trace.push(m); if(st.trace.length>160) st.trace.shift();
    S.dessiner();
  }
  q('#'+u+'t').addEventListener('input',e=>{ st.t=+e.target.value; maj(); });
  q('#'+u+'s').addEventListener('input',e=>{ st.s=+e.target.value; maj(); });
  q('.trace').addEventListener('click',()=>{ st.trace=[]; S.dessiner(); });
  maj(); maths(el);
}

/* =================================================================
   4. UNE DROITE ET UN PLAN
   ================================================================= */
function droitePlan(el){
  const {S,d}=carcasse(el,{titre:'Une droite et un plan',aria:'Une droite d et un plan P',
    intro:'Le plan $\\mathcal P$ monte en pente douce. Incline la droite $d$ et déplace-la : quand coupe-t-elle le plan, et quand ne le touche-t-elle jamais ?'});
  const u=id();
  d.innerHTML=curseur(u+'a','Inclinaison de $d$',-80,80,5,-20)+curseur(u+'c','Hauteur de $d$',-3,3,0.5,1,'rose')+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  // plan P : passe par A(-2;0;-1), monte de 30° dans la direction de x
  const T=Math.tan(Math.PI/6), A=[-2,0,-1], PU=[1,0,T], PV=[0,1,0], N=cross(PU,PV);
  const st={a:-20,c:1};
  function modele(){ const a=st.a*Math.PI/180; return {B:[-2,1,st.c-1],W:[Math.cos(a),0,Math.sin(a)]}; }
  function etude(){ const {B,W}=modele(); const den=dot(N,W);
    if(Math.abs(den)<1e-9){ const dans=Math.abs(dot(N,sub(B,A)))<1e-9; return {cas:dans?2:1,B,W}; }
    const t=dot(N,sub(A,B))/den; return {cas:0,B,W,I:add(B,mul(t,W))}; }
  S.dessin=s=>{ const c=s.c(), r=etude(); s.axes();
    s.plan(A,N,alpha(c.mc,0.18),alpha(c.mc,0.5));
    s.droite(r.B,r.W,c.pink,3.2); if(r.cas===0) s.point(r.I,c.ok,7);
    const e=s.couper(r.B,r.W); if(e) s.texte(e[1],'d',c.pink,6,-12,true);
    const pts=s.morceauPlan(A,N); if(pts.length){ const h=pts.reduce((m,p)=>s.proj(p).y<s.proj(m).y?p:m); s.texte(h,'P',c.mc,-24,14,true); }
  };
  function maj(){
    q('[data-pour="'+u+'a"]').textContent=nb(st.a,0)+'°'; q('[data-pour="'+u+'c"]').textContent=nb(st.c);
    const r=etude(), v=q('.verdict');
    if(r.cas===0){ v.className='verdict info'; v.innerHTML='<strong>Sécants.</strong><span>Un seul point commun, en vert : $'+coords(r.I.map(x=>Math.round(x*100)/100))+'$'+(r.I.some(x=>Math.abs(x)>S.L)?' (en dehors de la boîte affichée)':'')+'. La direction de $d$ n\'est pas une direction du plan.</span>'; }
    else if(r.cas===1){ v.className='verdict ok'; v.innerHTML='<strong>Parallèles, strictement.</strong><span>À 30°, $d$ suit exactement la pente du plan : son vecteur directeur est une direction du plan. $d$ ne le coupe jamais.</span>'; }
    else { v.className='verdict ok'; v.innerHTML='<strong>$d$ est contenue dans $\\mathcal P$.</strong><span>Même direction que le plan, et un point dans le plan : toute la droite y est.</span>'; }
    maths(v); S.dessiner();
  }
  q('#'+u+'a').addEventListener('input',e=>{ st.a=+e.target.value; maj(); });
  q('#'+u+'c').addEventListener('input',e=>{ st.c=+e.target.value; maj(); });
  maj(); maths(el);
}

window.LABOS=window.LABOS||{};
window.LABOS.espace={droites,coplanaires,parametre,droitePlan};
})();
