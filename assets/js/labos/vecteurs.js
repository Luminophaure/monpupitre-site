/* =====================================================================
   LABORATOIRES — chapitre « Vecteurs » (seconde)
   Utilisation dans une page :
     <div class="labo" data-labo="vecteurs" data-outil="egalite"></div>
   Outils : egalite · somme · chemin · produit
   Les vecteurs se déplacent à la souris ou au doigt : par le milieu de la
   flèche pour la faire glisser, par la pointe pour la changer. Au clavier :
   Tab pour choisir une flèche, flèches du clavier pour la faire glisser,
   Maj + flèches pour déplacer sa pointe.
   ===================================================================== */
(function(){
"use strict";
const maths=el=>{ if(window.Site&&Site.maths) Site.maths(el); };
const css=n=>getComputedStyle(document.body).getPropertyValue(n).trim();
const hasard=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const egal=(p,q)=>p[0]===q[0]&&p[1]===q[1];
const vec=v=>[v.b[0]-v.a[0],v.b[1]-v.a[1]];
const plus=(p,d,k)=>[p[0]+(k==null?1:k)*d[0],p[1]+(k==null?1:k)*d[1]];
const ROLES={u:'--mc',v:'--pink',w:'--ok',n:'--muted'};

/* =================================================================
   LE PLATEAU : un quadrillage avec des flèches qu'on attrape
   ================================================================= */
function Plateau(canvas,o){
  const P={cols:o.cols||16,rows:o.rows||10,vecteurs:[],points:[],formes:[],extras:null,surChange:o.surChange||(()=>{}),sel:null};
  const ctx=canvas.getContext('2d'); let W=0,H=0,u=30,ox=0,oy=0;
  const X=x=>ox+x*u, Y=y=>oy+(P.rows-y)*u;
  function taille(){ const w=canvas.clientWidth; if(!w) return false; u=Math.floor(Math.min(w/(P.cols+0.6),56)); const h=Math.round(u*(P.rows+0.6));
    canvas.style.setProperty('--hauteur',h+'px'); const r=Math.min(2,window.devicePixelRatio||1);
    if(canvas.width!==Math.round(w*r)||canvas.height!==Math.round(h*r)){ canvas.width=Math.round(w*r); canvas.height=Math.round(h*r); }
    ctx.setTransform(r,0,0,r,0,0); W=w; H=h; ox=(w-P.cols*u)/2; oy=0.3*u; return true; }
  const coul=role=>css(ROLES[role]||'--ink');
  function fleche(a,b,c,ep,tirets){ const x1=X(a[0]),y1=Y(a[1]),x2=X(b[0]),y2=Y(b[1]); const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy); if(l<1) return;
    const ux=dx/l,uy=dy/l,t=Math.min(15,l*0.45);
    ctx.save(); ctx.strokeStyle=c; ctx.fillStyle=c; ctx.lineWidth=ep||4; ctx.lineCap='round'; if(tirets) ctx.setLineDash(tirets);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2-ux*t*.6,y2-uy*t*.6); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-ux*t-uy*t*.45,y2-uy*t+ux*t*.45); ctx.lineTo(x2-ux*t+uy*t*.45,y2-uy*t-ux*t*.45); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function texte(x,y,t,c,gras,italique){ ctx.save(); ctx.font=(italique?'italic ':'')+(gras?'700 ':'600 ')+'17px "Atkinson Hyperlegible", system-ui, sans-serif'; ctx.textBaseline='middle';
    const w=ctx.measureText(t).width; x=Math.max(2,Math.min(W-w-2,x)); y=Math.max(10,Math.min(H-10,y));
    ctx.lineWidth=4; ctx.strokeStyle=css('--feuille'); ctx.strokeText(t,x,y); ctx.fillStyle=c; ctx.fillText(t,x,y); ctx.restore(); }
  P.dessiner=()=>{ if(!taille()) return; ctx.clearRect(0,0,W,H);
    ctx.save(); ctx.strokeStyle=css('--grid'); ctx.lineWidth=1.2;
    for(let i=0;i<=P.cols;i++){ ctx.beginPath(); ctx.moveTo(X(i)+.5,Y(0)); ctx.lineTo(X(i)+.5,Y(P.rows)); ctx.stroke(); }
    for(let j=0;j<=P.rows;j++){ ctx.beginPath(); ctx.moveTo(X(0),Y(j)+.5); ctx.lineTo(X(P.cols),Y(j)+.5); ctx.stroke(); }
    ctx.restore();
    P.formes.forEach(f=>{ ctx.save(); ctx.beginPath(); f.pts.forEach((p,i)=>{ if(i) ctx.lineTo(X(p[0]),Y(p[1])); else ctx.moveTo(X(p[0]),Y(p[1])); }); ctx.closePath();
      ctx.fillStyle=css(f.fond||'--b-def-bg'); ctx.globalAlpha=f.opacite||0.9; ctx.fill(); ctx.globalAlpha=1; ctx.strokeStyle=css(f.trait||'--ink'); ctx.lineWidth=1.6; if(f.tirets) ctx.setLineDash(f.tirets); ctx.stroke(); ctx.restore(); });
    if(P.extras) P.extras({fleche,texte,X,Y,u,coul,ctx});
    P.vecteurs.filter(v=>!v.cache).forEach(v=>{ const c=coul(v.role);
      if(P.sel===v){ ctx.save(); ctx.strokeStyle=css('--jaune'); ctx.globalAlpha=.7; ctx.lineWidth=12; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(X(v.a[0]),Y(v.a[1])); ctx.lineTo(X(v.b[0]),Y(v.b[1])); ctx.stroke(); ctx.restore(); }
      fleche(v.a,v.b,c,v.ep||4,v.tirets);
      if(v.pointe!==false&&v.deplacable){ ctx.save(); ctx.strokeStyle=c; ctx.lineWidth=2; ctx.fillStyle=css('--card'); ctx.beginPath(); ctx.arc(X(v.b[0]),Y(v.b[1]),7,0,7); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if(v.nom){ const mx=(X(v.a[0])+X(v.b[0]))/2, my=(Y(v.a[1])+Y(v.b[1]))/2; const dx=X(v.b[0])-X(v.a[0]), dy=Y(v.b[1])-Y(v.a[1]), l=Math.hypot(dx,dy)||1;
        texte(mx-dy/l*18-6,my+dx/l*18,v.nom,c,true,true); } });
    P.points.forEach(p=>{ ctx.save(); ctx.fillStyle=css(p.coul||'--ink'); ctx.beginPath(); ctx.arc(X(p.p[0]),Y(p.p[1]),5,0,7); ctx.fill(); ctx.restore(); if(p.nom) texte(X(p.p[0])+(p.dx==null?-18:p.dx),Y(p.p[1])+(p.dy==null?14:p.dy),p.nom,css('--ink'),true); });
  };
  /* --- attraper --- */
  function grille(e){ const r=canvas.getBoundingClientRect(); return [(e.clientX-r.left-ox)/u,P.rows-(e.clientY-r.top-oy)/u]; }
  function distSeg(p,a,b){ const dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy; let t=l2?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l2:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy); }
  function trouver(g){ const prises=P.vecteurs.filter(v=>v.deplacable&&!v.cache);
    // tolérances en pixels, assez larges pour un doigt même quand les carreaux sont petits
    const rp=Math.max(0.45,22/u), rc=Math.max(0.4,16/u);
    for(const v of prises){ if(v.pointe!==false&&Math.hypot(g[0]-v.b[0],g[1]-v.b[1])<rp) return {v,mode:'pointe'}; }
    for(const v of prises){ if(v.deplacable==='tout'&&distSeg(g,v.a,v.b)<rc) return {v,mode:'tout'}; }
    return null; }
  let prise=null;
  const borne=p=>[Math.max(0,Math.min(P.cols,p[0])),Math.max(0,Math.min(P.rows,p[1]))];
  function deplacer(v,mode,d){ if(mode==='pointe'){ const b=borne(plus(v.b,d)); if(!egal(b,v.a)) v.b=b; }
    else { const a=plus(v.a,d), b=plus(v.b,d); if(a[0]<0||b[0]<0||a[1]<0||b[1]<0||a[0]>P.cols||b[0]>P.cols||a[1]>P.rows||b[1]>P.rows) return; v.a=a; v.b=b; }
    P.surChange(v); P.dessiner(); }
  canvas.addEventListener('pointerdown',e=>{ const g=grille(e), t=trouver(g); if(!t) return; e.preventDefault(); prise=Object.assign(t,{dep:[Math.round(g[0]),Math.round(g[1])]}); P.sel=t.v; try{canvas.setPointerCapture(e.pointerId);}catch(err){} canvas.classList.add('saisi'); P.dessiner(); });
  canvas.addEventListener('pointermove',e=>{ const g=grille(e);
    if(!prise){ canvas.classList.toggle('prenable',!!trouver(g)); return; }
    const q=[Math.round(g[0]),Math.round(g[1])]; const d=[q[0]-prise.dep[0],q[1]-prise.dep[1]]; if(!d[0]&&!d[1]) return;
    deplacer(prise.v,prise.mode,d); prise.dep=q; });
  const lacher=()=>{ prise=null; canvas.classList.remove('saisi'); }; canvas.addEventListener('pointerup',lacher); canvas.addEventListener('pointercancel',lacher);
  canvas.tabIndex=0;
  canvas.addEventListener('keydown',e=>{ const prises=P.vecteurs.filter(v=>v.deplacable&&!v.cache); if(!prises.length) return;
    if(e.key==='Tab'&&!e.shiftKey&&P.sel!==prises[prises.length-1]){ e.preventDefault(); P.sel=prises[(prises.indexOf(P.sel)+1)%prises.length]; P.dessiner(); return; }
    const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key]; if(!d) return; e.preventDefault();
    if(!P.sel) P.sel=prises[0];
    deplacer(P.sel, e.shiftKey||P.sel.deplacable!=='tout'?'pointe':'tout', d); });
  if(window.ResizeObserver) new ResizeObserver(()=>P.dessiner()).observe(canvas); else addEventListener('resize',P.dessiner);
  new MutationObserver(()=>P.dessiner()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  return P;
}

/* ---------- carcasse commune ---------- */
function carcasse(el,o){
  el.innerHTML='<div class="labo-tete"><span class="badge">Laboratoire</span><h3>'+o.titre+'</h3>'+(o.intro?'<p>'+o.intro+'</p>':'')+'</div>'+
    '<div class="labo-corps"><div class="labo-gauche"><canvas class="plateau" role="img" aria-label="'+o.aria+'"></canvas>'+(o.aide===false?'':'<p class="discret">'+(o.aide||'Attrape une flèche par le milieu pour la faire glisser, par sa pointe ronde pour la changer. Au clavier : Tab, puis les flèches (Maj + flèches pour la pointe).')+'</p>')+'</div>'+
    '<div class="labo-droite reglages"></div></div>';
  return {cv:el.querySelector('canvas'),d:el.querySelector('.labo-droite')};
}
const coche=(ok,txt)=>'<li class="'+(ok?'ok':'ko')+'">'+(ok?'✓ ':'✗ ')+txt+'</li>';
const longueur2=d=>d[0]*d[0]+d[1]*d[1];
const memeDirection=(d,e)=>d[0]*e[1]-d[1]*e[0]===0;

/* =================================================================
   1. VECTEURS ÉGAUX ET TRANSLATION
   ================================================================= */
function egalite(el){
  const {cv,d}=carcasse(el,{titre:'Vecteurs égaux et translation',aria:'Quadrillage avec deux vecteurs AB et CD à déplacer',
    intro:'Deux flèches représentent le même vecteur quand elles ont la même direction, le même sens et la même longueur. Déplace $\\overrightarrow{CD}$ jusqu\'à ce qu\'il soit égal à $\\overrightarrow{AB}$, et regarde le quadrilatère $ABDC$.'});
  d.innerHTML='<div class="champ"><span class="etiq">Les trois critères</span><ul class="criteres"></ul></div>'+
    '<div class="verdict info" aria-live="polite"></div>'+
    '<label class="case"><input type="checkbox" class="voir-triangle"><span>Montrer l\'image d\'un triangle par la translation de vecteur $\\overrightarrow{AB}$</span></label>'+
    '<div class="ligne"><button type="button" class="btn defi">Défi : place D</button><span class="discret score"></span></div>';
  const q=s=>d.querySelector(s);
  const AB={a:[2,2],b:[6,4],role:'u',deplacable:'tout'}, CD={a:[3,6],b:[5,9],role:'v',deplacable:'tout'};
  const st={defi:false,reussis:0,triangle:false};
  const T=[[1,6],[3,6],[1,8]];
  const P=Plateau(cv,{cols:16,rows:10,surChange:()=>maj()}); P.vecteurs=[AB,CD];
  function maj(){
    const u=vec(AB), v=vec(CD); const dir=memeDirection(u,v), sens=dir&&(u[0]*v[0]+u[1]*v[1])>0, lg=longueur2(u)===longueur2(v);
    q('.criteres').innerHTML=coche(dir,'même direction (flèches parallèles)')+coche(sens,'même sens')+coche(lg,'même longueur');
    const eg=dir&&sens&&lg, op=dir&&!sens&&lg;
    P.formes = eg ? [{pts:[AB.a,AB.b,CD.b,CD.a],fond:'--b-meth-bg'}] : [];
    if(st.triangle){ const t=vec(AB); P.formes.push({pts:T,fond:'--b-def-bg'},{pts:T.map(p=>plus(p,t)),fond:'--b-meth-bg'}); }
    P.points=[{p:AB.a,nom:'A'},{p:AB.b,nom:'B',dx:6},{p:CD.a,nom:'C'},{p:CD.b,nom:'D',dx:6}];
    const v_=q('.verdict');
    if(eg){ v_.className='verdict ok'; v_.innerHTML='<strong>$\\overrightarrow{AB}=\\overrightarrow{CD}$</strong><span>Le quadrilatère $ABDC$ (en couleur) est un parallélogramme'+(egal(AB.a,CD.a)?', ici aplati : les deux flèches sont superposées':'')+'. $D$ est l\'image de $C$ par la translation de vecteur $\\overrightarrow{AB}$.</span>';
      if(st.defi){ st.defi=false; st.reussis++; q('.score').textContent=st.reussis+' défi'+(st.reussis>1?'s':'')+' réussi'+(st.reussis>1?'s':''); CD.deplacable='tout'; AB.deplacable='tout'; v_.innerHTML+='<span>Défi réussi !</span>'; } }
    else if(op){ v_.className='verdict info'; v_.innerHTML='<strong>Vecteurs opposés</strong><span>$\\overrightarrow{CD}=-\\overrightarrow{AB}$ : même direction, même longueur, mais sens contraire.</span>'; }
    else { v_.className='verdict info'; v_.innerHTML='<span>'+(st.defi?'Déplace seulement la pointe $D$ : quel trajet faut-il faire depuis $C$ ?':'Pas encore égaux : il manque '+[!dir&&'la direction',dir&&!sens&&'le sens',!lg&&'la longueur'].filter(Boolean).join(', ')+'.')+'</span>'; }
    maths(v_);
  }
  q('.voir-triangle').addEventListener('change',e=>{ st.triangle=e.target.checked; maj(); P.dessiner(); });
  q('.defi').addEventListener('click',()=>{ AB.a=[hasard(1,4),hasard(1,4)]; do{ AB.b=[AB.a[0]+hasard(-3,4),AB.a[1]+hasard(-2,4)]; } while(egal(AB.a,AB.b)||AB.b[1]<0||AB.b[1]>9);
    const t=vec(AB); do{ CD.a=[hasard(1,12),hasard(1,8)]; } while(plus(CD.a,t)[0]<0||plus(CD.a,t)[0]>16||plus(CD.a,t)[1]<0||plus(CD.a,t)[1]>10||Math.abs(CD.a[0]-AB.a[0])+Math.abs(CD.a[1]-AB.a[1])<3);
    CD.b=[CD.a[0]+1,CD.a[1]]; if(egal(CD.b,plus(CD.a,t))) CD.b=[CD.a[0],CD.a[1]+1];
    CD.deplacable='pointe'; AB.deplacable=false; st.defi=true; P.sel=CD; maj(); P.dessiner(); });
  maj(); maths(el);
}

/* =================================================================
   2. RECONSTITUER UNE SOMME
   ================================================================= */
function somme(el){
  const {cv,d}=carcasse(el,{titre:'Reconstituer une somme',aria:'Quadrillage avec les vecteurs u et v à déplacer',
    intro:'Pour ajouter $\\vec u$ et $\\vec v$, fais glisser $\\vec v$ pour qu\'il <strong>commence au bout</strong> de $\\vec u$. Essaie aussi de le faire partir du même point que $\\vec u$ : c\'est la règle du parallélogramme.'});
  d.innerHTML='<div class="verdict info" aria-live="polite"></div>'+
    '<div class="ligne"><button type="button" class="btn defi">Défi : atteins la cible</button><button type="button" class="btn fantome reprendre">Recommencer</button></div>'+
    '<p class="discret consigne-defi" hidden>La flèche en pointillés est $\\vec w$. Change la pointe de $\\vec v$, puis place-le au bout de $\\vec u$, pour que $\\vec u+\\vec v=\\vec w$.</p>';
  const q=s=>d.querySelector(s);
  const U={a:[2,2],b:[6,4],role:'u',nom:'u',deplacable:'tout'}, V={a:[10,2],b:[12,6],role:'v',nom:'v',deplacable:'tout'};
  const st={cible:null};
  const P=Plateau(cv,{cols:16,rows:10,surChange:()=>maj()}); P.vecteurs=[U,V];
  function maj(){
    const v=q('.verdict'); P.formes=[]; P.extras=null;
    const cible=st.cible;
    let somme=null, mode='';
    if(egal(V.a,U.b)){ somme=[U.a,V.b]; mode='chasles'; }
    else if(egal(V.a,U.a)){ somme=[U.a,plus(U.b,vec(V))]; mode='para'; P.formes=[{pts:[U.a,U.b,somme[1],V.b],fond:'--b-meth-bg',tirets:[5,5]}]; }
    P.extras=s=>{ if(cible) s.fleche(cible.a,cible.b,s.coul('n'),3,[8,7]); if(somme) s.fleche(somme[0],somme[1],s.coul('w'),4.5); if(somme){ const m=[(somme[0][0]+somme[1][0])/2,(somme[0][1]+somme[1][1])/2]; s.texte(s.X(m[0])+10,s.Y(m[1])-14,'u + v',s.coul('w'),true,true); } };
    if(somme){ const ok=cible&&egal(vec({a:somme[0],b:somme[1]}),vec(cible));
      v.className='verdict ok'; v.innerHTML= mode==='chasles' ? '<strong>Bout à bout</strong><span>$\\vec v$ commence où $\\vec u$ s\'arrête : la flèche verte, du début de $\\vec u$ à la fin de $\\vec v$, est $\\vec u+\\vec v$.</span>' : '<strong>Même point de départ</strong><span>$\\vec u+\\vec v$ est la diagonale du parallélogramme construit sur $\\vec u$ et $\\vec v$.</span>';
      if(cible) v.innerHTML+= ok ? '<span><strong>Défi réussi :</strong> $\\vec u+\\vec v=\\vec w$.</span>' : '<span>La somme n\'est pas encore égale à $\\vec w$ : ajuste la pointe de $\\vec v$.</span>'; }
    else { v.className='verdict info'; v.innerHTML='<span>Fais glisser $\\vec v$ (par son milieu) pour qu\'il parte du bout de $\\vec u$, ou du même point que $\\vec u$.</span>'; }
    maths(v);
  }
  q('.defi').addEventListener('click',()=>{ const a=[hasard(1,4),hasard(1,3)]; let w; do{ w=[hasard(3,8),hasard(2,6)]; } while(w[0]+a[0]>15||w[1]+a[1]>9);
    U.a=a; U.b=[a[0]+hasard(1,w[0]-1),a[1]+hasard(-1,2)]; st.cible={a:[a[0],a[1]],b:[a[0]+w[0],a[1]+w[1]]};
    V.a=[12,1]; V.b=[13,2]; q('.consigne-defi').hidden=false; maj(); P.dessiner(); });
  q('.reprendre').addEventListener('click',()=>{ st.cible=null; U.a=[2,2]; U.b=[6,4]; V.a=[10,2]; V.b=[12,6]; q('.consigne-defi').hidden=true; maj(); P.dessiner(); });
  maj(); maths(el);
}

/* =================================================================
   3. LE CHEMIN DE CHASLES
   ================================================================= */
function chemin(el){
  const {cv,d}=carcasse(el,{titre:'Le chemin de Chasles',aide:'Ajoute les vecteurs avec les boutons : chacun part du bout du précédent.',aria:'Quadrillage : un chemin de vecteurs bout à bout part de A et doit atteindre B',
    intro:'Pars de $A$ et atteins $B$ en mettant des vecteurs bout à bout. Chaque nouveau vecteur commence là où le précédent s\'arrête : à la fin, $\\overrightarrow{AB}$ est la somme de tout le chemin.'});
  d.innerHTML='<div class="champ"><span class="etiq">Ajouter un vecteur</span><div class="puces tuiles"></div></div>'+
    '<div class="calcul expression" aria-live="polite"></div><div class="verdict info" aria-live="polite"></div>'+
    '<div class="ligne"><button type="button" class="btn fantome annuler">Annuler le dernier</button><button type="button" class="btn nouveau">Nouveau défi</button></div>';
  const q=s=>d.querySelector(s);
  const BASE={u:[2,1],v:[-1,2],w:[3,-1]};
  const TUILES=[['u',1],['v',1],['w',1],['u',-1],['v',-1],['w',-1]];
  const st={A:[2,2],B:null,pas:[],min:0};
  const P=Plateau(cv,{cols:16,rows:10});
  q('.tuiles').innerHTML=TUILES.map(([n,s],i)=>'<button type="button" class="puce" data-i="'+i+'">'+(s<0?'$-\\vec '+n+'$':'$+\\vec '+n+'$')+'</button>').join('');
  q('.tuiles').addEventListener('click',e=>{ const b=e.target.closest('[data-i]'); if(!b) return; const [n,s]=TUILES[+b.dataset.i]; const fin=bout(); const nf=plus(fin,BASE[n],s);
    if(nf[0]<0||nf[0]>16||nf[1]<0||nf[1]>10){ q('.verdict').className='verdict ko'; q('.verdict').innerHTML='<span>Ce vecteur sortirait du quadrillage.</span>'; return; }
    st.pas.push([n,s]); maj(); });
  q('.annuler').addEventListener('click',()=>{ st.pas.pop(); maj(); });
  q('.nouveau').addEventListener('click',nouveau);
  function bout(){ return st.pas.reduce((p,[n,s])=>plus(p,BASE[n],s),st.A); }
  function nouveau(){ for(;;){ const c={u:hasard(-1,2),v:hasard(-1,2),w:hasard(-1,1)}; const n=Math.abs(c.u)+Math.abs(c.v)+Math.abs(c.w); if(n<2||n>4) continue;
      st.A=[hasard(3,8),hasard(2,5)]; const B=['u','v','w'].reduce((p,k)=>plus(p,BASE[k],c[k]),st.A); if(B[0]<1||B[0]>15||B[1]<1||B[1]>9||egal(B,st.A)) continue;
      st.B=B; st.min=minimum(); st.pas=[]; break; } maj(); }
  function minimum(){ const D=[st.B[0]-st.A[0],st.B[1]-st.A[1]]; let m=99; for(let a=-4;a<=4;a++) for(let b=-4;b<=4;b++) for(let c=-4;c<=4;c++){ if(a*2-b+3*c===D[0]&&a+2*b-c===D[1]) m=Math.min(m,Math.abs(a)+Math.abs(b)+Math.abs(c)); } return m; }
  function ecrire(){ if(!st.pas.length) return '\\vec 0'; const c={}; st.pas.forEach(([n,s])=>c[n]=(c[n]||0)+s); let t='';
    ['u','v','w'].forEach(n=>{ const k=c[n]; if(!k) return; t+=(k<0?'-':(t?'+':''))+(Math.abs(k)===1?'':Math.abs(k))+'\\vec '+n; }); return t||'\\vec 0'; }
  function maj(){
    const fin=bout(); let p=st.A; const fl=st.pas.map(([n,s])=>{ const a=p; p=plus(p,BASE[n],s); return {a,b:p,role:n,nom:(s<0?'−':'')+n}; });
    P.vecteurs=fl; P.points=[{p:st.A,nom:'A'},{p:st.B,nom:'B',dx:8,dy:-12}];
    P.extras=s=>{ s.fleche(st.A,st.B,s.coul('n'),2.5,[8,7]); };
    const brut=st.pas.map(([n,s])=>(s<0?'-':'+')+'\\vec '+n).join('').replace(/^\+/,'')||'\\vec 0';
    q('.expression').innerHTML='<p>Chemin : $'+brut+'$</p><p>En regroupant : $'+ecrire()+'$</p>';
    const v=q('.verdict');
    if(egal(fin,st.B)&&st.pas.length){ v.className='verdict ok'; v.innerHTML='<strong>Arrivé en B !</strong><span>$\\overrightarrow{AB}='+ecrire()+'$, en '+st.pas.length+' vecteur'+(st.pas.length>1?'s':'')+'.'+(st.pas.length>st.min?' On peut le faire en '+st.min+'. Tu trouves comment ?':' C\'est le chemin le plus court possible.')+'</span>'; }
    else { v.className='verdict info'; v.innerHTML='<span>'+(st.pas.length?'Tu es en route : il reste à aller jusqu\'à $B$.':'Choisis le premier vecteur du chemin.')+'</span>'; }
    maths(q('.expression')); maths(v); P.dessiner();
  }
  nouveau(); maths(el);
}

/* =================================================================
   4. MULTIPLIER UN VECTEUR PAR UN NOMBRE
   ================================================================= */
function produit(el){
  const {cv,d}=carcasse(el,{titre:'Multiplier un vecteur par un nombre',aide:'Attrape la pointe ronde de u pour le changer (au clavier : Tab puis les flèches).',aria:'Le vecteur u et le vecteur k fois u sur un quadrillage',
    intro:'Change la pointe de $\\vec u$ et fais varier $k$. Le vecteur $k\\vec u$ garde toujours la direction de $\\vec u$ : regarde ce qui arrive au sens et à la longueur.'});
  const id='k'+Math.random().toString(36).slice(2,7);
  d.innerHTML='<div class="champ"><div class="ligne-val"><label for="'+id+'">Le nombre $k$</label><span class="valeur"></span></div><input type="range" id="'+id+'" min="-3" max="3" step="0.5" value="2"></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const U={a:[1,1],b:[3,2],role:'u',nom:'u',deplacable:'pointe'};
  const st={k:2}; const O=[8,5];
  const P=Plateau(cv,{cols:16,rows:10,surChange:()=>maj()}); P.vecteurs=[U];
  function maj(){
    const k=st.k, t=vec(U), fin=plus(O,t,k);
    q('.valeur').textContent=String(k).replace('.',',').replace('-','−');
    P.points=[{p:O,nom:'',coul:'--muted'}];
    P.extras=s=>{ const n=Math.abs(k);
      // u reporté depuis le même point (en pointillés), et un trait à chaque copie de u : on voit « combien de fois u »
      s.fleche(O,plus(O,t),s.coul('u'),2.5,[6,5]);
      const L=Math.hypot(t[0],t[1])||1, px=-t[1]/L, py=t[0]/L;
      for(let i=1;i<=Math.floor(n);i++){ const m=plus(O,t,Math.sign(k)*i); s.ctx.save(); s.ctx.strokeStyle=s.coul('w'); s.ctx.lineWidth=2.5; s.ctx.beginPath();
        s.ctx.moveTo(s.X(m[0])+px*9,s.Y(m[1])-py*9); s.ctx.lineTo(s.X(m[0])-px*9,s.Y(m[1])+py*9); s.ctx.stroke(); s.ctx.restore(); }
      if(k!==0) s.fleche(O,fin,s.coul('w'),5); const m=plus(O,t,k/2); if(k!==0) s.texte(s.X(m[0])+12,s.Y(m[1])+16,(k===1?'':k===-1?'−':String(k).replace('.',',').replace('-','−'))+'u',s.coul('w'),true,true); };
    const v=q('.verdict'); const n=Math.abs(k), fois=String(n).replace('.',',');
    if(k===0){ v.className='verdict info'; v.innerHTML='<strong>$0\\vec u=\\vec 0$</strong><span>Multiplier par zéro, c\'est ne plus bouger du tout.</span>'; }
    else { v.className='verdict info'; v.innerHTML='<strong>$k='+String(k).replace('.','{,}')+'$</strong><span>Même direction que $\\vec u$, '+(k>0?'<strong>même sens</strong>':'<strong>sens contraire</strong> (car $k$ est négatif)')+', et '+(n===1?'<strong>même longueur</strong>.':'une longueur <strong>'+(n<1?'divisée par '+String(1/n).replace('.',','):'multipliée par '+fois)+'</strong>.')+' Les petits traits marquent chaque longueur de $\\vec u$ ; $\\vec u$ est reporté en pointillés.</span>'; }
    maths(v);
  }
  q('#'+id).addEventListener('input',e=>{ st.k=+e.target.value; maj(); P.dessiner(); });
  maj(); maths(el);
}

window.LABOS=window.LABOS||{};
window.LABOS.vecteurs={egalite,somme,chemin,produit};
})();
