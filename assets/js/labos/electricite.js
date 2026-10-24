/* =====================================================================
   LABORATOIRES — L'ÉLECTRICITÉ DANS L'HABITAT (première ST2S)
     oscillo   l'oscilloscope branché sur une source : régler, mesurer T et Umax
     tableau   le tableau électrique : surcharger une ligne, voir le disjoncteur couper
     fuite     un défaut d'isolement : avec ou sans terre, avec ou sans différentiel
   Les outils généraux sont dans labos/commun.js.
   ===================================================================== */
(function(){
"use strict";
const {maths,css,id,nb,hasard,lire,carcasse,reglette,lier,puces,Toile,etiquette}=window.Labo;
const P=()=>window.Pupitre;
const mil=v=>String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f');   // 1 800 W

/* =================================================================
   1. L'OSCILLOSCOPE
   ================================================================= */
const SOURCES=[
  {nom:'Prise (France)',Umax:325,f:50,continu:false,txt:'230 V efficaces, 50 Hz'},
  {nom:'Prise (Amérique du Nord)',Umax:170,f:60,continu:false,txt:'120 V efficaces, 60 Hz'},
  {nom:'Générateur du labo',Umax:6,f:100,continu:false,txt:'alternatif, basse tension'},
  {nom:'Pile plate',Umax:4.5,f:0,continu:true,txt:'4,5 V continus'},
  {nom:'Chargeur USB',Umax:5,f:0,continu:true,txt:'5 V continus'},
];
const BASES=[1,2,5,10], SENSIS=[1,2,5,50,100,200];
function oscillo(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'L\'oscilloscope branché sur le secteur',
    intro:'Un oscilloscope dessine la tension au cours du temps. Règle la <strong>base de temps</strong> et la <strong>sensibilité</strong> pour voir un motif entier, puis place les curseurs pour mesurer la période $T$ et la valeur maximale $U_{max}$. Le vérificateur compare à la vraie valeur.',
    gauche:'<canvas class="ecran" role="img" aria-label="Écran d\'oscilloscope : la tension au cours du temps, avec deux curseurs de temps et un curseur de niveau."></canvas><p class="discret">Glisse les curseurs roses (temps) et le curseur bleu (niveau), ou touche l\'écran pour amener le plus proche. Au clavier : flèches, Espace pour changer de curseur.</p>'});
  d.innerHTML='<div class="champ"><span class="etiq">La source</span><div class="puces sources"></div></div>'+
    '<div class="champ"><span class="etiq">Base de temps (ms par division)</span><div class="puces bases"></div></div>'+
    '<div class="champ"><span class="etiq">Sensibilité (V par division)</span><div class="puces sensis"></div></div>'+
    '<div class="releves"></div>'+
    '<div class="champ"><span class="etiq">Mesurer</span><div class="ligne"><button type="button" class="btn mesT">Valider ma mesure de T</button><button type="button" class="btn mesU">Valider U<sub>max</sub></button></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={s:0,ms:5,vd:100,c1:2,c2:6,niv:3.25,actif:0,okT:false,okU:false};
  const S=()=>SOURCES[st.s];
  const tension=t=>S().continu?S().Umax:S().Umax*Math.sin(2*Math.PI*S().f*t);   // t en secondes
  const cv=g.querySelector('canvas');
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const m={g:8,d:8,h:8,b:8}; const w=W-m.g-m.d,h=H-m.h-m.b; const dx=w/10,dy=h/8;
    c.save(); c.fillStyle=css('--card'); c.fillRect(m.g,m.h,w,h);
    c.strokeStyle=css('--line'); c.lineWidth=1; c.beginPath(); for(let i=0;i<=10;i++){ c.moveTo(m.g+i*dx+.5,m.h); c.lineTo(m.g+i*dx+.5,m.h+h); } for(let j=0;j<=8;j++){ c.moveTo(m.g,m.h+j*dy+.5); c.lineTo(m.g+w,m.h+j*dy+.5); } c.stroke();
    c.strokeStyle=css('--muted'); c.lineWidth=1.5; c.beginPath(); c.moveTo(m.g,m.h+4*dy); c.lineTo(m.g+w,m.h+4*dy); c.moveTo(m.g+5*dx,m.h); c.lineTo(m.g+5*dx,m.h+h); c.stroke(); c.restore();
    // la trace
    c.save(); c.beginPath(); c.strokeStyle=css('--mc'); c.lineWidth=2.6; c.lineJoin='round';
    for(let i=0;i<=w;i++){ const t=(i/dx)*st.ms/1000; const v=tension(t); const y=m.h+4*dy-v/st.vd*dy; const yy=Math.max(m.h-2,Math.min(m.h+h+2,y)); if(i===0) c.moveTo(m.g+i,yy); else c.lineTo(m.g+i,yy); }
    c.stroke(); c.restore();
    // curseurs
    const X=div=>m.g+div*dx, Y=div=>m.h+4*dy-div*dy;
    c.save(); c.setLineDash([6,5]); c.lineWidth=2;
    [st.c1,st.c2].forEach((cx,i)=>{ c.strokeStyle=css('--pink'); c.globalAlpha= st.actif===i?1:.6; c.beginPath(); c.moveTo(X(cx),m.h); c.lineTo(X(cx),m.h+h); c.stroke(); });
    c.strokeStyle=css('--blue'); c.globalAlpha= st.actif===2?1:.6; c.beginPath(); c.moveTo(m.g,Y(st.niv)); c.lineTo(m.g+w,Y(st.niv)); c.stroke(); c.restore();
    etiquette(c,'Δt',(X(st.c1)+X(st.c2))/2,m.h+h-14,css('--pink'),{align:'center',taille:13});
    etiquette(c,'niveau',m.g+w-10,Y(st.niv)-12,css('--blue'),{align:'right',taille:12});
    etiquette(c,st.ms+' ms/div · '+st.vd+' V/div',m.g+8,m.h+14,css('--muted'),{taille:12,gras:false});
  });
  function releves(){ const dt=Math.abs(st.c2-st.c1)*st.ms, niv=st.niv*st.vd;
    q('.releves').innerHTML='<span>Écart entre les curseurs</span><b>'+nb(Math.abs(st.c2-st.c1),2)+' div = '+nb(dt,1)+' ms</b><span>Niveau du curseur bleu</span><b>'+nb(st.niv,2)+' div = '+nb(niv,1)+' V</b>'; T.redessiner(); }
  function regler(k){ const v=q('.verdict'); v.className='verdict info'; st.okT=st.okU=false;
    v.innerHTML='<span>'+(S().continu?'Tension continue : la trace est une ligne horizontale, il n\'y a pas de période. Mesure seulement sa valeur avec le curseur bleu.':'Règle la base de temps pour voir un ou deux motifs complets, et la sensibilité pour que les sommets restent à l\'écran. Puis mesure.')+'</span>'; releves(); }
  puces(q('.sources'),SOURCES.map(s=>s.nom),0,i=>{ st.s=i; regler(); });
  puces(q('.bases'),BASES.map(b=>b+' ms'),2,i=>{ st.ms=BASES[i]; regler(); });
  puces(q('.sensis'),SENSIS.map(s=>s+' V'),4,i=>{ st.vd=SENSIS[i]; regler(); });
  // curseurs : souris, toucher, clavier
  const pos=e=>{ const r=cv.getBoundingClientRect(); const dx=(r.width-16)/10, dy=(r.height-16)/8; return {x:(e.clientX-r.left-8)/dx, y:4-(e.clientY-r.top-8)/dy}; };
  let glisse=null;
  cv.addEventListener('pointerdown',e=>{ const p=pos(e); const dist=[Math.abs(p.x-st.c1),Math.abs(p.x-st.c2),Math.abs(p.y-st.niv)*1.2]; st.actif=dist.indexOf(Math.min(...dist)); glisse=st.actif; cv.setPointerCapture(e.pointerId); bouger(p); });
  cv.addEventListener('pointermove',e=>{ if(glisse==null) return; bouger(pos(e)); });
  cv.addEventListener('pointerup',()=>{ glisse=null; }); cv.addEventListener('pointercancel',()=>{ glisse=null; });
  function bouger(p){ const r=v=>Math.round(v*20)/20; if(st.actif===0) st.c1=Math.max(0,Math.min(10,r(p.x))); else if(st.actif===1) st.c2=Math.max(0,Math.min(10,r(p.x))); else st.niv=Math.max(-4,Math.min(4,r(p.y))); releves(); }
  cv.tabIndex=0; cv.addEventListener('keydown',e=>{ const pas=e.shiftKey?.5:.05; let used=true;
    if(e.key===' '){ st.actif=(st.actif+1)%3; } else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ const s=(e.key==='ArrowRight'?1:-1)*pas; if(st.actif===0) st.c1=Math.max(0,Math.min(10,st.c1+s)); else if(st.actif===1) st.c2=Math.max(0,Math.min(10,st.c2+s)); else used=false; }
    else if(e.key==='ArrowUp'||e.key==='ArrowDown'){ if(st.actif===2) st.niv=Math.max(-4,Math.min(4,st.niv+(e.key==='ArrowUp'?1:-1)*pas)); else used=false; } else used=false;
    if(used){ e.preventDefault(); releves(); } });
  q('.mesT').addEventListener('click',()=>{ const v=q('.verdict'); const s=S();
    if(s.continu){ v.className='verdict ko'; v.innerHTML='<span>Cette tension est continue : elle n\'a pas de période.</span>'; return; }
    const dt=Math.abs(st.c2-st.c1)*st.ms, Tv=1000/s.f;
    if(dt<0.2){ v.className='verdict ko'; v.innerHTML='<span>Écarte les deux curseurs roses : place-les sur deux points identiques de deux motifs successifs (deux sommets, ou deux passages par zéro en montant).</span>'; return; }
    const k=dt/Tv, kr=Math.round(k);
    if(Math.abs(k-1)<=0.06){ st.okT=true; v.className='verdict ok'; v.innerHTML='<strong>T = '+nb(dt,1)+' ms. Juste.</strong><span>Donc $f=\\dfrac1T=\\dfrac{1}{'+nb(Tv/1000,4)+'}='+s.f+'$ Hz : '+s.f+' motifs par seconde.'+(st.okU?' Et $U_{eff}=\\dfrac{U_{max}}{\\sqrt2}='+nb(s.Umax/Math.SQRT2,0)+'$ V.':'')+'</span>'; maths(v); }
    else if(kr>=2&&Math.abs(k-kr)<=0.06*kr){ v.className='verdict ko'; v.innerHTML='<span>Tes curseurs couvrent '+kr+' motifs, pas un seul : $T=\\dfrac{'+nb(dt,1)+'}{'+kr+'}='+nb(dt/kr,1)+'$ ms. (Mesurer plusieurs motifs et diviser est d\'ailleurs une bonne méthode.)</span>'; maths(v); }
    else if(Math.abs(k-0.5)<=0.06){ v.className='verdict ko'; v.innerHTML='<span>Ce n\'est qu\'une demi-période : d\'un passage par zéro au suivant, la tension a seulement changé de signe. Le motif complet, c\'est une bosse <em>et</em> un creux.</span>'; }
    else { v.className='verdict ko'; v.innerHTML='<span>Ce n\'est pas une période ('+nb(dt,1)+' ms). Place un curseur sur un sommet et l\'autre sur le sommet suivant.</span>'; } });
  q('.mesU').addEventListener('click',()=>{ const v=q('.verdict'); const s=S(); const niv=st.niv*st.vd;
    if(Math.abs(niv-s.Umax)<=0.05*s.Umax+0.2){ st.okU=true; v.className='verdict ok'; v.innerHTML='<strong>U<sub>max</sub> = '+nb(niv,1)+' V. Juste.</strong><span>'+(s.continu?'Pour une tension continue, c\'est la valeur tout court : un voltmètre affiche '+nb(s.Umax,1)+' V.':'La valeur efficace vaut $\\dfrac{U_{max}}{\\sqrt2}='+nb(s.Umax/Math.SQRT2,0)+'$ V : c\'est elle qu\'affiche un voltmètre, et qu\'on lit sur les appareils.')+'</span>'; maths(v); }
    else if(Math.abs(niv+s.Umax)<=0.05*s.Umax+0.2){ v.className='verdict ko'; v.innerHTML='<span>Tu es sur le creux : c\'est $U_{min}=-U_{max}$. La valeur maximale est au sommet, au-dessus de l\'axe.</span>'; maths(v); }
    else if(!s.continu&&Math.abs(niv-s.Umax/Math.SQRT2)<=0.05*s.Umax){ v.className='verdict ko'; v.innerHTML='<span>'+nb(niv,0)+' V, c\'est la valeur efficace, pas la valeur maximale. Le sommet de la sinusoïde est plus haut.</span>'; }
    else if(st.vd*4<s.Umax){ v.className='verdict ko'; v.innerHTML='<span>Le sommet sort de l\'écran : augmente la sensibilité (plus de volts par division) pour le voir.</span>'; }
    else { v.className='verdict ko'; v.innerHTML='<span>Le curseur bleu n\'est pas sur le sommet ('+nb(niv,1)+' V). Monte-le ou descends-le jusqu\'à toucher le haut de la trace.</span>'; } });
  regler();
}

/* =================================================================
   2. LE TABLEAU ÉLECTRIQUE
   ================================================================= */
const APPAREILS=[['Lampe LED',10,'💡'],['Chargeur de téléphone',10,'🔌'],['Lit médicalisé',150,'🛏️'],['Concentrateur d\'oxygène',300,'🫁'],['Téléviseur',120,'📺'],['Micro-ondes',1000,'🍲'],['Sèche-cheveux',1800,'💨'],['Radiateur d\'appoint',2000,'🔥'],['Bouilloire',2200,'☕']];
function tableau(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Le tableau électrique et le disjoncteur',
    intro:'Tous les appareils d\'une ligne passent par le même disjoncteur. Branche-les un à un sur la multiprise : les intensités <strong>s\'ajoutent</strong>. Au-delà du calibre, le bilame chauffe et le disjoncteur coupe. Un court-circuit, lui, le fait sauter instantanément.',
    gauche:'<canvas class="large" role="img" aria-label="Le disjoncteur et l\'intensité totale de la ligne, avec les appareils branchés."></canvas>'});
  d.innerHTML='<div class="champ"><span class="etiq">Calibre du disjoncteur</span><div class="puces calibres"></div></div>'+
    '<div class="champ"><span class="etiq">Appareils branchés sur la ligne</span><div class="appareils pile"></div></div>'+
    '<div class="releves"></div>'+
    '<div class="ligne"><button type="button" class="btn fantome cc">Provoquer un court-circuit</button><button type="button" class="btn rearmer" hidden>Réarmer le disjoncteur</button></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const CALIBRES=[10,16,20];
  const st={cal:16,on:APPAREILS.map(()=>false),ferme:true,chauffe:0,cc:false,timer:null};
  const I=()=>st.on.reduce((s,o,i)=>s+(o?APPAREILS[i][1]/230:0),0);
  q('.appareils').innerHTML=APPAREILS.map((a,i)=>'<label class="case"><input type="checkbox" data-i="'+i+'"><span>'+a[2]+' '+a[0]+' <small class="discret">'+mil(a[1])+' W · '+nb(a[1]/230,2)+' A</small></span></label>').join('');
  const cv=g.querySelector('canvas');
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const ink=css('--ink'),muted=css('--muted');
    // le disjoncteur : un boîtier avec sa manette
    const bx=18,by=24,bw=Math.min(120,W*.28),bh=H-48;
    c.save(); c.fillStyle=css('--card'); c.strokeStyle=css('--line'); c.lineWidth=2; c.beginPath(); if(c.roundRect) c.roundRect(bx,by,bw,bh,12); else c.rect(bx,by,bw,bh); c.fill(); c.stroke();
    const mx=bx+bw/2, my=by+bh*.45; c.fillStyle= st.ferme?css('--ok'):css('--ko'); c.beginPath(); if(c.roundRect) c.roundRect(mx-16,my-(st.ferme?44:0),32,44,8); else c.rect(mx-16,my-(st.ferme?44:0),32,44); c.fill(); c.restore();
    etiquette(c,st.ferme?'ON':'OFF',mx,my+(st.ferme?-70:62),ink,{align:'center',taille:14});
    etiquette(c,st.cal+' A',mx,by+bh-14,muted,{align:'center',taille:13});
    etiquette(c,'disjoncteur',mx,by-8,muted,{align:'center',taille:12,gras:false});
    // la jauge d'intensité
    const gx=bx+bw+26, gw=W-gx-16, gy=H*.5, max=Math.max(2*st.cal,40);
    const X=i=>gx+Math.min(1,i/max)*gw;
    c.save(); c.fillStyle=css('--grid'); c.fillRect(gx,gy-14,gw,28);
    const i=st.cc?max:I(); c.fillStyle= i>st.cal?css('--ko'):css('--ok'); c.fillRect(gx,gy-14,X(i)-gx,28);
    c.strokeStyle=ink; c.lineWidth=2.5; c.beginPath(); c.moveTo(X(st.cal),gy-24); c.lineTo(X(st.cal),gy+24); c.stroke(); c.restore();
    etiquette(c,'calibre '+st.cal+' A',X(st.cal),gy-34,ink,{align:'center',taille:12});
    etiquette(c,'0',gx,gy+40,muted,{taille:12,gras:false}); etiquette(c,max+' A',gx+gw,gy+40,muted,{align:'right',taille:12,gras:false});
    etiquette(c,st.cc?'court-circuit !':'I = '+nb(i,1)+' A',gx+gw/2,gy+64,i>st.cal?css('--ko'):ink,{align:'center',taille:16});
    if(st.chauffe>0&&st.ferme) etiquette(c,'le bilame chauffe… '+'▮'.repeat(Math.ceil(st.chauffe*6)),gx+gw/2,gy-60,css('--ko'),{align:'center',taille:13});
    // les appareils allumés
    const on=st.on.map((o,k)=>o?APPAREILS[k][2]:null).filter(Boolean); if(on.length&&st.ferme) etiquette(c,on.join(' '),gx+gw/2,H-24,ink,{align:'center',taille:20,gras:false});
    if(!st.ferme) etiquette(c,'plus rien ne fonctionne sur cette ligne',gx+gw/2,H-24,muted,{align:'center',taille:13,gras:false});
  });
  function releves(){ const i=I(), p=st.on.reduce((s,o,k)=>s+(o?APPAREILS[k][1]:0),0); q('.releves').innerHTML='<span>Puissance totale</span><b>'+mil(p)+' W</b><span>Intensité totale (P ÷ 230 V)</span><b>'+nb(i,1)+' A</b><span>Calibre</span><b>'+st.cal+' A</b>'; }
  function couper(raison){ st.ferme=false; st.chauffe=0; clearInterval(st.timer); st.timer=null; q('.rearmer').hidden=false; const v=q('.verdict'); v.className='verdict ko';
    v.innerHTML= raison==='cc'?'<strong>Court-circuit : le disjoncteur a coupé instantanément.</strong><span>Phase et neutre se sont touchés : l\'intensité est montée à plusieurs centaines d\'ampères en une fraction de seconde. L\'électroaimant du disjoncteur a réagi en quelques millisecondes. Sans lui, les fils auraient fondu.</span>'
      :'<strong>Surcharge : le disjoncteur a coupé.</strong><span>L\'intensité dépassait '+st.cal+' A. Le bilame a chauffé, puis déclenché. Tous les appareils de la ligne sont à l\'arrêt, y compris le lit médicalisé et le concentrateur d\'oxygène : c\'est pour ça qu\'on ne met pas le matériel médical sur la même ligne que le chauffage.</span>'; T.redessiner(); }
  function maj(){ releves(); const i=I(); const v=q('.verdict');
    if(!st.ferme){ T.redessiner(); return; }
    if(i>st.cal){ if(!st.timer){ st.chauffe=0; st.timer=setInterval(()=>{ st.chauffe+=0.1*(i/st.cal); T.redessiner(); if(st.chauffe>=1) couper('surcharge'); },250); }
      v.className='verdict info'; v.innerHTML='<span>'+nb(i,1)+' A sur une ligne de '+st.cal+' A : <strong>surcharge</strong>. Le bilame chauffe, le disjoncteur va couper dans quelques secondes. Plus l\'écart est grand, plus c\'est rapide.</span>'; }
    else { clearInterval(st.timer); st.timer=null; st.chauffe=0;
      v.className=i>0.8*st.cal?'verdict info':'verdict ok'; v.innerHTML= i===0?'<span>Rien n\'est branché. Coche des appareils : les intensités s\'ajoutent.</span>':i>0.8*st.cal?'<span>'+nb(i,1)+' A : la ligne approche de son calibre. Un appareil qui chauffe en plus, et ça coupe.</span>':'<span>'+nb(i,1)+' A sur '+st.cal+' A : la ligne tient. Remarque que les appareils qui <strong>chauffent</strong> pèsent le plus.</span>'; }
    T.redessiner(); }
  puces(q('.calibres'),CALIBRES.map(c=>c+' A'),1,i=>{ st.cal=CALIBRES[i]; maj(); });
  q('.appareils').addEventListener('change',e=>{ const c=e.target.closest('[data-i]'); if(!c) return; st.on[+c.dataset.i]=c.checked; maj(); });
  q('.cc').addEventListener('click',()=>{ if(!st.ferme) return; st.cc=true; T.redessiner(); setTimeout(()=>{ st.cc=false; couper('cc'); },350); });
  q('.rearmer').addEventListener('click',()=>{ st.ferme=true; q('.rearmer').hidden=true; st.on=st.on.map(()=>false); q('.appareils').querySelectorAll('input').forEach(c=>c.checked=false); const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>Réarmé, tout est débranché. Avant de réarmer en vrai, on supprime la cause : moins d\'appareils, ou le câble en court-circuit.</span>'; releves(); T.redessiner(); });
  maj();
}

/* =================================================================
   3. LE DÉFAUT D'ISOLEMENT
   ================================================================= */
function fuite(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Défaut d\'isolement : la terre et le différentiel',
    intro:'Dans ce lave-linge, un fil de phase usé touche la carcasse métallique. Choisis l\'installation (terre ou non, différentiel ou non), l\'état de la peau, puis fais toucher l\'appareil par la personne. Le scénario se déroule milliseconde par milliseconde.',
    gauche:'<canvas class="large" role="img" aria-label="Un appareil en défaut, une personne, le sol, et le chemin du courant selon l\'installation."></canvas><div class="journal" aria-live="polite"></div>'});
  d.innerHTML='<div class="champ"><span class="etiq">L\'installation</span><div class="pile">'+
      '<label class="case"><input type="checkbox" data-k="defaut" checked><span>Défaut d\'isolement : la phase touche la carcasse</span></label>'+
      '<label class="case"><input type="checkbox" data-k="terre" checked><span>Carcasse reliée à la terre</span></label>'+
      '<label class="case"><input type="checkbox" data-k="diff" checked><span>Disjoncteur différentiel 30 mA</span></label></div></div>'+
    '<div class="champ"><span class="etiq">La personne</span><div class="puces peau"></div></div>'+
    '<div class="releves"></div>'+
    '<div class="ligne"><button type="button" class="btn toucher">La personne touche l\'appareil</button><button type="button" class="btn fantome reset" hidden>Recommencer</button></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={defaut:true,terre:true,diff:true,R:100000,phase:'avant',t:0,coupe:false,chemin:null,anim:null,dash:0};
  const Icorps=()=>230/st.R*1000;   // mA
  const cv=g.querySelector('canvas');
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const ink=css('--ink'),muted=css('--muted'); const sol=H-26;
    // le sol
    c.save(); c.strokeStyle=muted; c.lineWidth=2; c.beginPath(); c.moveTo(10,sol); c.lineTo(W-10,sol); for(let x=14;x<W-10;x+=18){ c.moveTo(x+10,sol); c.lineTo(x,sol+12); } c.stroke(); c.restore();
    // l'appareil
    const ax=W*.12, ay=sol-150, aw=Math.min(130,W*.3), ah=130;
    c.save(); c.fillStyle=css('--card'); c.strokeStyle= st.coupe?css('--line'):(st.defaut?css('--ko'):css('--line')); c.lineWidth=st.defaut&&!st.coupe?3:2; c.beginPath(); if(c.roundRect) c.roundRect(ax,ay,aw,ah,12); else c.rect(ax,ay,aw,ah); c.fill(); c.stroke();
    c.fillStyle=css('--grid'); c.beginPath(); c.arc(ax+aw/2,ay+ah*.58,aw*.26,0,7); c.fill(); c.restore();
    // les fils phase et neutre
    const fil=(x,coul,lab)=>{ c.save(); c.strokeStyle=coul; c.lineWidth=4; c.lineCap='round'; c.globalAlpha=st.coupe?.35:1; c.beginPath(); c.moveTo(x,20); c.lineTo(x,ay+18); c.stroke(); c.restore(); etiquette(c,lab,x,12,coul,{align:'center',taille:11,gras:false}); };
    fil(ax+22,css('--fil-phase'),'phase'); fil(ax+aw-22,css('--fil-neutre'),'neutre');
    if(st.defaut){ c.save(); c.strokeStyle=css('--fil-phase'); c.lineWidth=2.5; c.beginPath(); c.moveTo(ax+22,ay+18); c.quadraticCurveTo(ax+34,ay+34,ax+22,ay+48); c.stroke(); c.fillStyle=css('--chaud'); c.beginPath(); c.arc(ax+22,ay+50,5,0,7); c.fill(); c.restore(); etiquette(c,'défaut',ax+8,ay+ah-10,css('--ko'),{taille:11}); }
    if(st.terre){ c.save(); c.lineWidth=6; c.strokeStyle=css('--fil-terre'); c.beginPath(); c.moveTo(ax+aw-10,ay+ah); c.lineTo(ax+aw-10,sol-8); c.lineTo(ax+aw+16,sol-8); c.lineTo(ax+aw+16,sol); c.stroke(); c.strokeStyle=css('--fil-terre2'); c.setLineDash([8,8]); c.stroke(); c.setLineDash([]); c.strokeStyle=css('--fil-terre'); c.lineWidth=2.5; c.beginPath(); [[14,6],[9,12],[4,18]].forEach(([w,dy])=>{ c.moveTo(ax+aw+16-w,sol+dy); c.lineTo(ax+aw+16+w,sol+dy); }); c.stroke(); c.restore(); etiquette(c,'terre',ax+aw+22,sol-16,css('--fil-terre'),{taille:11}); }
    // le différentiel
    if(st.diff){ const dx=W*.52, dy=26; c.save(); c.fillStyle=st.coupe?css('--ko-soft'):css('--ok-soft'); c.strokeStyle=st.coupe?css('--ko'):css('--ok'); c.lineWidth=2; c.beginPath(); if(c.roundRect) c.roundRect(dx,dy,110,34,8); else c.rect(dx,dy,110,34); c.fill(); c.stroke(); c.restore(); etiquette(c,st.coupe?'différentiel : COUPÉ':'différentiel 30 mA',dx+55,dy+17,st.coupe?css('--ko'):css('--ok'),{align:'center',taille:11}); }
    // la personne
    const px=W*.72, py=sol; const contact= st.phase!=='avant';
    c.save(); c.strokeStyle=ink; c.lineWidth=2.5; c.lineCap='round'; c.beginPath(); c.arc(px,py-106,13,0,7); c.moveTo(px,py-93); c.lineTo(px,py-40); c.moveTo(px,py-40); c.lineTo(px-14,py); c.moveTo(px,py-40); c.lineTo(px+14,py); c.moveTo(px,py-78); c.lineTo(px+26,py-62);
    if(contact){ c.moveTo(px,py-78); c.lineTo(ax+aw+2,ay+ah*.5); } else { c.moveTo(px,py-78); c.lineTo(px-30,py-58); } c.stroke(); c.restore();
    etiquette(c,st.R>5000?'peau sèche':'peau mouillée',px,py-130,muted,{align:'center',taille:12,gras:false});
    // le chemin du courant
    if(st.chemin&&!st.coupe){ c.save(); c.strokeStyle=css('--chaud'); c.lineWidth=3; c.setLineDash([7,7]); c.lineDashOffset=-st.dash; c.beginPath();
      if(st.chemin==='terre'){ c.moveTo(ax+22,ay+50); c.lineTo(ax+aw-10,ay+ah-10); c.lineTo(ax+aw-10,sol-8); c.lineTo(ax+aw+16,sol); }
      else { c.moveTo(ax+22,ay+50); c.lineTo(ax+aw+2,ay+ah*.5); c.lineTo(px,py-78); c.lineTo(px,py-40); c.lineTo(px+14,py); }
      c.stroke(); c.restore(); }
  });
  function journal(lignes){ g.querySelector('.journal').innerHTML='<ol class="etapes journal-elec">'+lignes.map(l=>'<li><span><b class="m">'+l[0]+'</b> '+l[1]+'</span></li>').join('')+'</ol>'; }
  function releves(){ q('.releves').innerHTML='<span>Résistance du corps</span><b>'+mil(st.R)+' Ω</b><span>Courant qui traverserait le corps (230 V ÷ R)</span><b>'+nb(Icorps(),1)+' mA</b>'; }
  function animer(){ cancelAnimationFrame(st.anim); const pas=()=>{ st.dash+=1.2; T.redessiner(); st.anim=requestAnimationFrame(pas); }; pas(); }
  function stopAnim(){ cancelAnimationFrame(st.anim); st.anim=null; }
  function reset(){ stopAnim(); st.phase='avant'; st.coupe=false; st.chemin=null; q('.toucher').hidden=false; q('.reset').hidden=true; g.querySelector('.journal').innerHTML='';
    const v=q('.verdict'); v.className='verdict info';
    if(!st.defaut){ v.innerHTML='<span>Pas de défaut : la carcasse n\'est pas sous tension. Toucher l\'appareil ne fait rien. Coche le défaut pour voir ce que changent la terre et le différentiel.</span>'; }
    else if(st.terre&&st.diff){ st.chemin='terre'; animer(); v.innerHTML='<span>Dès que le défaut apparaît, un courant part de la carcasse vers le sol par le fil de terre. Le différentiel voit que $I_{phase}\\neq I_{neutre}$… regarde ce qui se passe avant même que quelqu\'un touche.</span>'; maths(v); setTimeout(()=>{ if(st.chemin==='terre'&&st.defaut&&st.terre&&st.diff&&st.phase==='avant'){ st.coupe=true; stopAnim(); T.redessiner(); journal([['0 ms','la phase touche la carcasse : un courant de fuite part par la terre'],['< 40 ms','le différentiel mesure une différence de plus de 30 mA entre phase et neutre : il coupe'],['ensuite','la carcasse n\'est plus sous tension. La personne peut toucher : elle ne sentira rien']]); v.className='verdict ok'; v.innerHTML='<strong>Coupé avant tout contact.</strong><span>C\'est le cas idéal : terre + différentiel. La personne ne saura même pas qu\'il y a eu un défaut, sauf que le différentiel est à réarmer et l\'appareil à réparer.</span>'; } },1600); }
    else if(st.terre&&!st.diff){ st.chemin='terre'; animer(); v.innerHTML='<span>Le courant de défaut part par la terre, mais rien ne le surveille. S\'il est très grand (défaut franc), le disjoncteur 16 A coupe ; s\'il est faible, la carcasse reste légèrement sous tension. Fais toucher la personne.</span>'; }
    else v.innerHTML='<span>Pas de terre : la carcasse est à 230 V, et rien ne se passe tant que personne ne la touche. Fais toucher la personne.</span>';
    releves(); T.redessiner(); }
  q('.toucher').addEventListener('click',()=>{ if(st.phase!=='avant') return; st.phase='contact'; q('.toucher').hidden=true; q('.reset').hidden=false; const v=q('.verdict'); const I=Icorps(); const mouille=st.R<5000;
   
    if(!st.defaut){ journal([['0 ms','la personne touche l\'appareil : aucune tension sur la carcasse, aucun courant']]); v.className='verdict ok'; v.innerHTML='<strong>Rien.</strong><span>Sans défaut, un appareil ne présente aucun danger au toucher. Tout le chapitre parle de ce qui arrive <em>quand</em> l\'isolement cède.</span>'; T.redessiner(); return; }
    if(st.terre){ if(st.diff){ journal([['0 ms','le différentiel avait déjà coupé : la personne touche une carcasse hors tension']]); v.className='verdict ok'; v.innerHTML='<strong>Rien.</strong><span>Le différentiel avait coupé avant.</span>'; st.coupe=true; stopAnim(); T.redessiner(); return; }
      st.chemin='terre'; journal([['0 ms','la phase touche la carcasse, le courant de défaut part par la terre'],['quelques ms','le défaut est franc : plusieurs dizaines d\'ampères. Le disjoncteur 16 A coupe par surintensité'],['contact','la personne touche une carcasse hors tension']]); st.coupe=true; stopAnim(); T.redessiner(); v.className='verdict ok'; v.innerHTML='<strong>Le disjoncteur a coupé, grâce à la terre.</strong><span>Sans différentiel, c\'est la surintensité du courant de défaut qui a fait réagir le disjoncteur. Mais si le défaut avait été plus faible (quelques centaines de milliampères, isolant humide), le disjoncteur n\'aurait rien vu : la carcasse serait restée sous tension. Seul le différentiel surveille les petits courants de fuite.</span>'; return; }
    // pas de terre : le courant passe par la personne
    st.chemin='corps'; animer(); releves();
    if(st.diff){ setTimeout(()=>{ st.coupe=true; stopAnim(); T.redessiner(); journal([['0 ms','la personne touche la carcasse : un courant de '+nb(I,1)+' mA la traverse, de la main aux pieds'],['< 40 ms','le différentiel voit la fuite ('+nb(I,1)+' mA > 30 mA) et coupe'],['ensuite',mouille?'une secousse violente, mais trop courte pour arrêter le cœur. La personne est choquée, pas électrocutée':'un picotement, puis plus rien']]);
        v.className= I>30?'verdict info':'verdict ok'; v.innerHTML='<strong>Sauvée par le différentiel.</strong><span>'+(I>30?nb(I,0)+' mA, c\'est au-dessus du seuil de fibrillation : sans la coupure en 40 ms, c\'était une électrocution. Le différentiel a limité la durée, pas l\'intensité. La terre aurait évité la secousse elle-même.':'Avec la peau sèche, le courant reste faible ('+nb(I,1)+' mA : picotement). Le différentiel coupe quand même dès que la fuite dépasse 30 mA… ici elle ne le dépasse pas, le différentiel ne réagit pas forcément. C\'est l\'humidité qui change tout.')+'</span>'; },900); return; }
    journal([['0 ms','la personne touche la carcasse : un courant de '+nb(I,1)+' mA la traverse, de la main aux pieds'],['1 s',mouille?'bien au-dessus de 75 mA : fibrillation ventriculaire, la personne ne peut plus lâcher':'environ 2 mA : picotement désagréable, la personne lâche'],['ensuite',mouille?'électrocution. Rien n\'a coupé : le disjoncteur 16 A ne voit pas 0,2 A':'plus de peur que de mal, mais l\'appareil reste dangereux : mains mouillées, c\'était mortel']]);
    v.className=mouille?'verdict ko':'verdict info'; v.innerHTML= mouille?'<strong>Électrocution.</strong><span>Sans terre et sans différentiel, rien ne coupe : '+nb(I,0)+' mA traversent le thorax tant que la personne reste en contact, et à cette intensité elle ne peut plus lâcher. C\'est l\'accident type dans une salle de bain d\'avant les normes.</span>':'<strong>Une secousse, cette fois.</strong><span>Peau sèche : '+nb(I,1)+' mA, désagréable mais sans gravité. Refais l\'expérience avec la peau mouillée pour voir pourquoi l\'eau est le vrai danger.</span>'; });
  q('.reset').addEventListener('click',reset);
  d.addEventListener('change',e=>{ const c=e.target.closest('[data-k]'); if(!c) return; st[c.dataset.k]=c.checked; reset(); });
  puces(q('.peau'),['Peau sèche (100 000 Ω)','Peau mouillée (1 000 Ω)'],0,i=>{ st.R= i?1000:100000; reset(); });
  reset();
}

window.LABOS=window.LABOS||{};
window.LABOS.electricite={oscillo,tableau,fuite};
})();
