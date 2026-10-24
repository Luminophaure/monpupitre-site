/* =====================================================================
   LABORATOIRES — SOLUTIONS, CONCENTRATIONS ET pH (première ST2S)
     dissolution  peser un soluté, choisir la fiole : Cm, n, C, saturation
     dilution     pipette + fiole : Cfille, facteur de dilution, défi
     ph           l'échelle de pH, [H3O+], l'indicateur coloré, la dilution ×10
     securite     des étiquettes de produits ménagers, et ce qu'on peut mélanger
   Les outils généraux sont dans labos/commun.js.
   ===================================================================== */
(function(){
"use strict";
const {maths,css,id,nb,hasard,lire,carcasse,reglette,lier,puces,Toile,etiquette}=window.Labo;
const mil=v=>String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f');
/* un nombre avec le bon nombre de chiffres : 0,0770 → « 0,077 » ; 1234 → « 1 234 » */
function chiffres(v,n){ if(v===0) return '0'; const e=Math.floor(Math.log10(Math.abs(v))); const d=Math.max(0,(n||3)-1-e); return nb(v,d); }
/* mélange de deux couleurs CSS (hex) selon t */
function mel(a,b,t){ const h=x=>[parseInt(x.slice(1,3),16),parseInt(x.slice(3,5),16),parseInt(x.slice(5,7),16)]; const A=h(a),B=h(b); return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'; }
const le=n=>(/^[aeiouyéèh]/i.test(n)?'l\'':'le ')+n.toLowerCase();
const hex=v=>{ const s=css(v).trim(); return s[0]==='#'?s:'#7FB8EA'; };

/* ---------- la verrerie dessinée sur un canvas ---------- */
function fioleCanvas(c,x,y,h,niveau,coul,trait,o){ o=o||{}; const r=h*.3, ytrait=y-h+14, cy=y-r, sj=Math.sqrt(r*r-49), yj=cy-sj;
  c.save(); c.beginPath(); c.arc(x,cy,r,0,7); c.rect(x-7,y-h,14,h-r); c.clip();
  if(niveau>0){ const yniv= niveau<=0.72? y-(2*r)*niveau/0.72 : ytrait+(y-2*r-ytrait)*(1-(niveau-0.72)/0.28); c.fillStyle=coul; c.globalAlpha=.9; c.fillRect(x-r-2,yniv,2*r+4,y-yniv+2); c.globalAlpha=1; }
  if(o.depot){ c.fillStyle=css('--ink'); for(let i=0;i<o.depot;i++){ c.beginPath(); c.arc(x-r*.6+(i*37%Math.round(r*1.2)),y-6-(i*13%9),2.2,0,7); c.fill(); } }
  c.restore();
  c.save(); c.strokeStyle=css('--verre'); c.lineWidth=2; c.lineJoin='round'; c.beginPath(); c.moveTo(x-7,y-h); c.lineTo(x-7,yj); c.arc(x,cy,r,Math.atan2(-sj,-7),Math.atan2(-sj,7),true); c.lineTo(x+7,y-h); c.moveTo(x-7,y-h); c.lineTo(x+7,y-h); c.stroke();
  if(trait){ c.strokeStyle=css('--pink'); c.lineWidth=2.5; c.beginPath(); c.moveTo(x-11,ytrait); c.lineTo(x+11,ytrait); c.stroke(); }
  c.restore(); }
function becherCanvas(c,x,y,w,h,niveau,coul){ c.save(); if(niveau>0){ c.fillStyle=coul; c.globalAlpha=.9; c.fillRect(x+3,y-h*niveau,w-6,h*niveau-2); c.globalAlpha=1; }
  c.strokeStyle=css('--verre'); c.lineWidth=2; c.beginPath(); c.moveTo(x,y-h); c.lineTo(x,y-6); c.quadraticCurveTo(x,y,x+6,y); c.lineTo(x+w-6,y); c.quadraticCurveTo(x+w,y,x+w,y-6); c.lineTo(x+w,y-h); c.stroke(); c.restore(); }
function pipetteCanvas(c,x,y,h,coul,frac){ c.save(); if(frac>0){ c.fillStyle=coul; c.globalAlpha=.9; c.fillRect(x-3,y-h+22+(h-34)*(1-frac),6,(h-34)*frac); c.beginPath(); c.ellipse(x,y-h*.5,8,21,0,0,7); c.fill(); c.globalAlpha=1; }
  c.strokeStyle=css('--verre'); c.lineWidth=2; c.beginPath(); c.moveTo(x-4,y-h); c.lineTo(x+4,y-h); c.lineTo(x+4,y-14); c.lineTo(x+1,y); c.lineTo(x-1,y); c.lineTo(x-4,y-14); c.closePath(); c.stroke(); c.beginPath(); c.ellipse(x,y-h*.5,9,22,0,0,7); c.stroke();
  c.strokeStyle=css('--pink'); c.lineWidth=2.5; c.beginPath(); c.moveTo(x-8,y-h+22); c.lineTo(x+8,y-h+22); c.stroke(); c.restore(); }

/* =================================================================
   1. DISSOLUTION
   ================================================================= */
const SOLUTES=[
  {nom:'Chlorure de sodium',formule:'NaCl',M:58.5,sat:360,usage:'sérum physiologique : 9,0 g/L'},
  {nom:'Glucose',formule:'C₆H₁₂O₆',M:180.0,sat:900,usage:'soluté de perfusion à 5 % : 50 g/L'},
  {nom:'Chlorure de potassium',formule:'KCl',M:74.6,sat:340,usage:'apport de potassium'},
  {nom:'Hydrogénocarbonate de sodium',formule:'NaHCO₃',M:84.0,sat:96,usage:'bicarbonate, antiacide'},
  {nom:'Saccharose',formule:'C₁₂H₂₂O₁₁',M:342.0,sat:2000,usage:'sirop'},
];
const FIOLES=[50,100,250,500,1000];
function dissolution(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Préparer une solution par dissolution',
    intro:'Choisis un soluté, pèse une masse, choisis la fiole jaugée. Le laboratoire calcule les deux concentrations et surveille la saturation. Puis relève le défi : préparer une solution de concentration donnée.',
    gauche:'<canvas class="large" role="img" aria-label="Une balance avec la masse pesée, et une fiole jaugée dont la teinte suit la concentration."></canvas>'});
  d.innerHTML='<div class="champ"><span class="etiq">Le soluté</span><div class="puces solutes"></div></div>'+
    '<div class="reglages"></div>'+
    '<div class="champ"><span class="etiq">La fiole jaugée</span><div class="puces fioles"></div></div>'+
    '<div class="releves"></div>'+
    '<div class="champ defi"><span class="etiq">Défi</span><p class="enonce-defi"></p><div class="ligne"><button type="button" class="btn valider">Vérifier ma préparation</button><button type="button" class="btn fantome autre">Autre défi</button></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={s:0,m:4.5,V:500,defi:null};
  const S=()=>SOLUTES[st.s]; const Cm=()=>st.m/(st.V/1000); const n=()=>st.m/S().M; const C=()=>n()/(st.V/1000); const sature=()=>Cm()>S().sat;
  const cv=g.querySelector('canvas');
  const T=Toile(cv,T=>{ const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const ink=css('--ink'),muted=css('--muted');
    // la balance
    const bx=W*.08,by=H*.62; c.save(); c.fillStyle=css('--card'); c.strokeStyle=css('--line'); c.lineWidth=1.5; c.beginPath(); if(c.roundRect) c.roundRect(bx,by,W*.3,26,6); else c.rect(bx,by,W*.3,26); c.fill(); c.stroke(); c.fillStyle=css('--inverse'); c.fillRect(bx+10,by+5,W*.3-20,16); c.restore();
    etiquette(c,nb(st.m,2)+' g',bx+W*.3-14,by+13,css('--inverse-ink'),{align:'right',taille:13});
    c.save(); c.strokeStyle=css('--verre'); c.lineWidth=2; c.beginPath(); c.moveTo(bx+W*.08,by-22); c.quadraticCurveTo(bx+W*.15,by-4,bx+W*.22,by-22); c.stroke(); c.fillStyle=ink; const grains=Math.min(40,Math.round(st.m*2)); for(let i=0;i<grains;i++){ c.beginPath(); c.arc(bx+W*.15+((i*53)%37-18)*W*.0035,by-14-((i*29)%14),2.2,0,7); c.fill(); } c.restore();
    etiquette(c,S().formule+' · M = '+nb(S().M,1)+' g/mol',bx+W*.15,by+46,muted,{align:'center',taille:12,gras:false});
    etiquette(c,'balance',bx+W*.15,by-40,muted,{align:'center',taille:11,gras:false});
    // la fiole, teintée selon la concentration
    const fx=W*.68, fy=H*.86, fh=H*.7; const t=Math.min(1,Cm()/Math.min(S().sat,400)); const coul=mel(hex('--sol-0'),hex('--sol-2'),t);
    fioleCanvas(c,fx,fy,fh,1,coul,true,{depot:sature()?10:0});
    etiquette(c,'fiole jaugée '+mil(st.V)+' mL',fx,fy+18,muted,{align:'center',taille:12,gras:false});
    etiquette(c,sature()?'saturée : dépôt au fond':nb(Cm(),1)+' g/L',fx,fy-fh-12,sature()?css('--ko'):ink,{align:'center',taille:13});
    // flèche du geste
    c.save(); c.strokeStyle=muted; c.lineWidth=2; c.setLineDash([5,5]); c.beginPath(); c.moveTo(bx+W*.3+10,by-10); c.quadraticCurveTo(W*.5,H*.2,fx-14,fy-fh+4); c.stroke(); c.restore();
  });
  d.querySelector('.reglages').innerHTML=reglette(u,'m','Masse pesée m (g)',0,50,0.05,4.5);
  const L=lier(d,st,{m:v=>nb(v,2)+' g'},()=>releves());
  function releves(){ const s=S();
    q('.releves').innerHTML='<span>Volume V</span><b>'+mil(st.V)+' mL = '+nb(st.V/1000,3)+' L</b><span>C<sub>m</sub> = m ÷ V</span><b>'+nb(Cm(),1)+' g/L</b><span>n = m ÷ M</span><b>'+chiffres(n(),3)+' mol</b><span>C = n ÷ V</span><b>'+chiffres(C(),3)+' mol/L</b><span>Vérification C<sub>m</sub> = C × M</span><b>'+nb(C()*s.M,1)+' g/L</b>';
    const v=q('.verdict'); if(!v.dataset.fige){ v.className=sature()?'verdict ko':'verdict info'; v.innerHTML= sature()?'<span>Au-delà de '+mil(s.sat)+' g/L, '+le(s.nom)+' ne se dissout plus : la solution est <strong>saturée</strong> et le solide se dépose. Réduis la masse ou prends une fiole plus grande.</span>':'<span>'+s.nom+' ('+s.formule+') : '+s.usage+'. Change la masse ou la fiole et regarde les deux concentrations suivre.</span>'; }
    T.redessiner(); }
  puces(q('.solutes'),SOLUTES.map(s=>s.nom),0,i=>{ st.s=i; delete q('.verdict').dataset.fige; releves(); });
  puces(q('.fioles'),FIOLES.map(v=>v+' mL'),3,i=>{ st.V=FIOLES[i]; delete q('.verdict').dataset.fige; releves(); });
  function defi(){ const choix=[[0,9.0,500,'500 mL de sérum physiologique (NaCl à 9,0 g/L)'],[0,9.0,250,'250 mL de sérum physiologique (NaCl à 9,0 g/L)'],[1,50,250,'250 mL de soluté de glucose à 5 % (50 g/L)'],[1,50,100,'100 mL de soluté de glucose à 50 g/L'],[2,7.46,100,'100 mL de KCl à 0,10 mol/L (M = 74,6 g/mol)'],[0,5.85,250,'250 mL de NaCl à 0,10 mol/L (M = 58,5 g/mol)'],[3,8.4,500,'500 mL de NaHCO₃ à 0,10 mol/L (M = 84,0 g/mol)'],[1,18,500,'500 mL de glucose à 0,10 mol/L (M = 180 g/mol)']];
    let c; do{ c=choix[hasard(0,choix.length-1)]; }while(st.defi&&c[3]===st.defi[3]); st.defi=c; q('.enonce-defi').innerHTML='Prépare <strong>'+c[3]+'</strong> : choisis le soluté, la fiole, et pèse la bonne masse.'; }
  q('.valider').addEventListener('click',()=>{ const [si,cm,V,txt]=st.defi; const v=q('.verdict'); v.dataset.fige='1'; const mCible=cm*V/1000;
    if(st.s!==si){ v.className='verdict ko'; v.innerHTML='<span>Ce n\'est pas le bon soluté : il faut '+(/^[aeiouyéèh]/i.test(SOLUTES[si].nom)?'de l\'':'du ')+SOLUTES[si].nom.toLowerCase()+' ('+SOLUTES[si].formule+').</span>'; return; }
    if(st.V!==V){ v.className='verdict ko'; v.innerHTML='<span>La fiole ne convient pas : le volume demandé est '+mil(V)+' mL, et le volume d\'une solution est celui de la fiole jaugée, pas un volume qu\'on ajuste après.</span>'; return; }
    const r=st.m/mCible;
    if(Math.abs(r-1)<=0.02){ v.className='verdict ok'; v.innerHTML='<strong>Juste : '+nb(mCible,2)+' g dans la fiole de '+mil(V)+' mL.</strong><span>$m=C_m\\times V='+nb(cm,2).replace(',','{,}')+'\\times'+nb(V/1000,3).replace(',','{,}')+'='+nb(mCible,2).replace(',','{,}')+'$ g. Ensuite : entonnoir, eau aux deux tiers, dissoudre, compléter au trait, homogénéiser.</span>'; maths(v); }
    else if(Math.abs(r-1000)<50||Math.abs(r-0.001)<0.0005){ v.className='verdict ko'; v.innerHTML='<span>Un facteur 1 000 : tu as confondu millilitres et litres. $V='+mil(V)+'$ mL $='+nb(V/1000,3).replace(',','{,}')+'$ L.</span>'; maths(v); }
    else if(Math.abs(r-1/ (V/1000))<0.05*r||Math.abs(st.m-cm)<0.02*cm){ v.className='verdict ko'; v.innerHTML='<span>Tu as pesé la concentration ('+nb(cm,2)+' g) : c\'est la masse <em>par litre</em>. Pour '+mil(V)+' mL, il faut $m=C_m\\times V$.</span>'; maths(v); }
    else { v.className='verdict ko'; v.innerHTML='<span>'+nb(st.m,2)+' g dans '+mil(V)+' mL donnent '+nb(Cm(),1)+' g/L, pas '+nb(cm,1)+' g/L. Calcule $m=C_m\\times V$ avec $V$ en litres.</span>'; maths(v); } });
  q('.autre').addEventListener('click',()=>{ defi(); delete q('.verdict').dataset.fige; releves(); });
  defi(); releves();
}

/* =================================================================
   2. DILUTION
   ================================================================= */
const PIPETTES=[1,2,5,10,20,25,50], MERES=[1.0,0.50,0.20,0.10];
function dilution(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Diluer sans se tromper',
    intro:'Une solution mère, une pipette jaugée, une fiole jaugée : la concentration fille se déduit de $C_{mère}V_{mère}=C_{fille}V_{fille}$. Choisis la pipette et la fiole, puis relève le défi : obtenir une concentration donnée.',
    gauche:'<canvas class="large" role="img" aria-label="Le bécher de solution mère, la pipette jaugée, la fiole jaugée ; la teinte de la fiole suit la concentration fille."></canvas>'});
  d.innerHTML='<div class="champ"><span class="etiq">Solution mère C<sub>mère</sub> (mol/L)</span><div class="puces meres"></div></div>'+
    '<div class="champ"><span class="etiq">Pipette jaugée (V<sub>mère</sub> prélevé)</span><div class="puces pipettes"></div></div>'+
    '<div class="champ"><span class="etiq">Fiole jaugée (V<sub>fille</sub>)</span><div class="puces fioles"></div></div>'+
    '<div class="releves"></div>'+
    '<div class="champ defi"><span class="etiq">Défi</span><p class="enonce-defi"></p><div class="ligne"><button type="button" class="btn valider">Vérifier</button><button type="button" class="btn fantome autre">Autre défi</button></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={C0:0.10,Vm:10,Vf:100,defi:null};
  const F=()=>st.Vf/st.Vm, Cf=()=>st.C0/F();
  const cv=g.querySelector('canvas');
  const T=Toile(cv,T=>{ const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const ink=css('--ink'),muted=css('--muted'); const y=H*.82;
    const cm=mel(hex('--sol-0'),hex('--sol-2'),Math.min(1,st.C0)); const cf=mel(hex('--sol-0'),hex('--sol-2'),Math.min(1,Cf()));
    becherCanvas(c,W*.06,y,W*.2,H*.42,0.55,cm); etiquette(c,'mère '+nb(st.C0,2)+' mol/L',W*.16,y+18,muted,{align:'center',taille:11,gras:false});
    pipetteCanvas(c,W*.38,y-20,H*.6,cm,1); etiquette(c,'pipette '+st.Vm+' mL',W*.38,y+18,muted,{align:'center',taille:11,gras:false});
    const ok=st.Vm<st.Vf;
    fioleCanvas(c,W*.72,y,H*.62,ok?1:0,cf,true); etiquette(c,'fiole '+mil(st.Vf)+' mL',W*.72,y+18,muted,{align:'center',taille:11,gras:false});
    etiquette(c,ok?'fille '+chiffres(Cf(),2)+' mol/L':'impossible : V prélevé ≥ V fiole',W*.72,y-H*.62-14,ok?ink:css('--ko'),{align:'center',taille:12});
    c.save(); c.strokeStyle=muted; c.lineWidth=2; c.setLineDash([5,5]); c.beginPath(); c.moveTo(W*.42,y-H*.55); c.quadraticCurveTo(W*.55,y-H*.7,W*.68,y-H*.62); c.stroke(); c.restore();
    etiquette(c,'+ eau jusqu\'au trait',W*.55,y-H*.74,muted,{align:'center',taille:11,gras:false});
  });
  function releves(){ const ok=st.Vm<st.Vf;
    q('.releves').innerHTML='<span>F = V<sub>fille</sub> ÷ V<sub>mère</sub></span><b>'+(ok?nb(F(),F()%1?1:0):'—')+'</b><span>C<sub>fille</sub> = C<sub>mère</sub> ÷ F</span><b>'+(ok?chiffres(Cf(),2)+' mol/L':'—')+'</b><span>n prélevée = C<sub>mère</sub> × V<sub>mère</sub></span><b>'+chiffres(st.C0*st.Vm/1000,2)+' mol</b><span>n dans la fiole = C<sub>fille</sub> × V<sub>fille</sub></span><b>'+(ok?chiffres(Cf()*st.Vf/1000,2)+' mol':'—')+'</b>';
    const v=q('.verdict'); if(!v.dataset.fige){ v.className=ok?'verdict info':'verdict ko'; v.innerHTML= ok?'<span>On prélève '+st.Vm+' mL à '+nb(st.C0,2)+' mol/L, on complète à '+mil(st.Vf)+' mL : la même quantité de soluté dans '+nb(F(),F()%1?1:0)+' fois plus de volume, donc une concentration '+nb(F(),F()%1?1:0)+' fois plus petite.</span>':'<span>Le volume prélevé doit être plus petit que la fiole : on ajoute de l\'eau, on n\'en retire pas.</span>'; }
    T.redessiner(); }
  puces(q('.meres'),MERES.map(c=>nb(c,2)),3,i=>{ st.C0=MERES[i]; delete q('.verdict').dataset.fige; releves(); });
  puces(q('.pipettes'),PIPETTES.map(p=>p+' mL'),3,i=>{ st.Vm=PIPETTES[i]; delete q('.verdict').dataset.fige; releves(); });
  puces(q('.fioles'),FIOLES.map(v=>v+' mL'),1,i=>{ st.Vf=FIOLES[i]; delete q('.verdict').dataset.fige; releves(); });
  function defi(){ const choix=[[0.10,0.010,100,'100 mL à 0,010 mol/L'],[0.10,0.020,250,'250 mL à 0,020 mol/L'],[0.50,0.050,100,'100 mL à 0,050 mol/L'],[1.0,0.10,50,'50 mL à 0,10 mol/L'],[0.20,0.010,500,'500 mL à 0,010 mol/L'],[0.10,0.0050,100,'100 mL à 0,0050 mol/L'],[0.50,0.025,500,'500 mL à 0,025 mol/L'],[1.0,0.040,250,'250 mL à 0,040 mol/L'],[0.20,0.020,250,'250 mL à 0,020 mol/L']];
    let c; do{ c=choix[hasard(0,choix.length-1)]; }while(st.defi&&c[3]===st.defi[3]&&c[0]===st.defi[0]); st.defi=c; q('.enonce-defi').innerHTML='À partir de la solution mère à <strong>'+nb(c[0],2)+' mol/L</strong>, prépare <strong>'+c[3]+'</strong>.'; }
  q('.valider').addEventListener('click',()=>{ const [C0,Cc,Vf]=st.defi; const v=q('.verdict'); v.dataset.fige='1'; const Fc=C0/Cc, Vm=Vf/Fc;
    if(st.C0!==C0){ v.className='verdict ko'; v.innerHTML='<span>Choisis la bonne solution mère : '+nb(C0,2)+' mol/L.</span>'; return; }
    if(st.Vf!==Vf){ v.className='verdict ko'; v.innerHTML='<span>Le volume de solution fille est celui de la fiole jaugée : il faut la fiole de '+mil(Vf)+' mL.</span>'; return; }
    if(st.Vm===Vm){ v.className='verdict ok'; v.innerHTML='<strong>Juste : pipette de '+Vm+' mL, fiole de '+mil(Vf)+' mL.</strong><span>$F=\\dfrac{'+nb(C0,2).replace(',','{,}')+'}{'+chiffres(Cc,2).replace(',','{,}')+'}='+nb(Fc,0)+'$, donc $V_{mère}=\\dfrac{'+mil(Vf)+'}{'+nb(Fc,0)+'}='+Vm+'$ mL. Vérification : $'+nb(C0,2).replace(',','{,}')+'\\times'+Vm+'='+chiffres(Cc,2).replace(',','{,}')+'\\times'+mil(Vf)+'$.</span>'; maths(v); }
    else if(st.Vm===Vf/ (Fc-1)||Math.abs(st.Vm-Vf/(C0-Cc))<0.01){ v.className='verdict ko'; v.innerHTML='<span>Le facteur de dilution est un rapport, $F=C_{mère}/C_{fille}='+nb(Fc,0)+'$, pas une différence.</span>'; maths(v); }
    else { v.className='verdict ko'; v.innerHTML='<span>Avec '+st.Vm+' mL dans '+mil(Vf)+' mL, on obtient '+chiffres(Cf(),2)+' mol/L. Il faut diviser la concentration par '+nb(Fc,0)+' : $V_{mère}=V_{fille}/F$.</span>'; maths(v); } });
  q('.autre').addEventListener('click',()=>{ defi(); delete q('.verdict').dataset.fige; releves(); });
  defi(); releves();
}

/* =================================================================
   3. L'ÉCHELLE DE pH
   ================================================================= */
const PRODUITS_PH=[[1.5,'suc gastrique'],[2.4,'jus de citron'],[2.5,'soda au cola'],[3,'vinaigre'],[4.5,'tomate'],[5,'café'],[5.5,'pluie'],[6.5,'lait'],[7,'eau pure'],[7.4,'sang'],[8.2,'eau de mer'],[8.4,'bicarbonate'],[9.5,'savon'],[11,'ammoniaque'],[12.5,'eau de Javel'],[13.5,'soude'],[14,'déboucheur']];
function ph(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'L\'échelle de pH',
    intro:'Déplace le curseur : la concentration en ions oxonium suit $[\\mathrm{H_3O^+}]=10^{-\\mathrm{pH}}$, l\'indicateur change de couleur, et les produits proches s\'affichent. Dilue dix fois un acide fort pour voir ce que fait le pH.',
    gauche:'<canvas class="large" role="img" aria-label="L\'échelle de pH de 0 à 14 avec un curseur, le tube avec l\'indicateur coloré, et un diagramme de la concentration en ions oxonium."></canvas>'});
  d.innerHTML='<div class="reglages"></div>'+
    '<div class="champ"><span class="etiq">Un produit</span><div class="puces produits"></div></div>'+
    '<div class="releves"></div>'+
    '<div class="champ"><span class="etiq">Expérience</span><div class="ligne"><button type="button" class="btn diluer">Diluer 10 fois (acide fort)</button><button type="button" class="btn fantome comparer">Comparer deux pH</button></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={pH:7,memo:null};
  const conc=p=>Math.pow(10,-p);
  const nature=p=>p<6.5?'acide':p>7.5?'basique':p===7?'neutre':'presque neutre';
  const bbt=p=>p<6?'#F2C230':p>7.6?'#2B5BD7':'#2E9E4E';
  function concTex(p){ const e=-p; if(Number.isInteger(e)) return '10^{'+e+'}'; const E=Math.floor(e); const m=Math.pow(10,e-E); return nb(m,1).replace(',','{,}')+'\\times10^{'+E+'}'; }
  function concTxt(p){ const e=-p; if(Number.isInteger(e)) return '10<sup>'+e+'</sup>'; const E=Math.floor(e); const m=Math.pow(10,e-E); return nb(m,1)+' × 10<sup>'+E+'</sup>'; }
  const cv=g.querySelector('canvas');
  const T=Toile(cv,T=>{ const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const ink=css('--ink'),muted=css('--muted');
    const x0=24,x1=W-24,y=H*.14,h=H*.14; const X=p=>x0+p/14*(x1-x0);
    const gr=c.createLinearGradient(x0,0,x1,0); [['#D7263D',0],['#F28C28',.25],['#F2C230',.45],['#2E9E4E',.5],['#2B5BD7',.65],['#5B2A86',1]].forEach(([k,o])=>gr.addColorStop(o,k)); c.save(); c.fillStyle=gr; c.beginPath(); if(c.roundRect) c.roundRect(x0,y,x1-x0,h,8); else c.rect(x0,y,x1-x0,h); c.fill(); c.restore();
    for(let p=0;p<=14;p++) etiquette(c,String(p),X(p)+(p===0?6:p===14?-8:0),y+h/2,'#fff',{align:'center',taille:12,halo:'rgba(0,0,0,.35)'});
    etiquette(c,'acide',X(2.5),y-12,ink,{align:'center',taille:12}); etiquette(c,'neutre',X(7),y-12,ink,{align:'center',taille:12}); etiquette(c,'basique',X(11.5),y-12,ink,{align:'center',taille:12});
    // curseur
    const xc=X(st.pH); c.save(); c.fillStyle=css('--pink'); c.beginPath(); c.moveTo(xc-9,y+h+14); c.lineTo(xc+9,y+h+14); c.lineTo(xc,y+h+2); c.closePath(); c.fill(); c.restore();
    etiquette(c,'pH '+nb(st.pH,1),xc,y+h+28,css('--pink'),{align:xc<W*.15?'left':xc>W*.85?'right':'center',taille:14});
    if(st.memo!=null){ const xm=X(st.memo); c.save(); c.strokeStyle=muted; c.setLineDash([4,4]); c.lineWidth=2; c.beginPath(); c.moveTo(xm,y-4); c.lineTo(xm,y+h+16); c.stroke(); c.restore(); etiquette(c,'repère '+nb(st.memo,1),xm,y+h+44,muted,{align:'center',taille:11,gras:false}); }
    // le tube à essai avec l'indicateur
    const tx=W*.14, ty=H*.48, th=H*.3; c.save(); c.fillStyle=bbt(st.pH); c.globalAlpha=.85; c.beginPath(); c.rect(tx-14,ty+th*.25,28,th*.75-14); c.arc(tx,ty+th-14,14,0,Math.PI); c.fill(); c.globalAlpha=1; c.strokeStyle=css('--verre'); c.lineWidth=2; c.beginPath(); c.moveTo(tx-14,ty); c.lineTo(tx-14,ty+th-14); c.arc(tx,ty+th-14,14,Math.PI,0,true); c.lineTo(tx+14,ty); c.stroke(); c.restore();
    etiquette(c,'bleu de bromothymol',tx,ty+th+16,muted,{align:'center',taille:11,gras:false}); etiquette(c,st.pH<6?'jaune : acide':st.pH>7.6?'bleu : basique':'vert : vers le neutre',tx,ty+th+32,ink,{align:'center',taille:11});
    // le diagramme [H3O+] en barres logarithmiques
    const dx0=W*.34,dx1=W-20,dy1=H*.9,dy0=H*.48; c.save(); c.strokeStyle=muted; c.lineWidth=1.5; c.beginPath(); c.moveTo(dx0,dy1); c.lineTo(dx1,dy1); c.moveTo(dx0,dy0); c.lineTo(dx0,dy1); c.stroke(); c.restore();
    for(let p=0;p<=14;p+=2){ const yy=dy1-(14-p)/14*(dy1-dy0); etiquette(c,'10⁻'+String(p).replace(/\d/g,ch=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+ch]),dx0-4,yy,muted,{align:'right',taille:10,gras:false}); }
    const barH=(14-st.pH)/14*(dy1-dy0); c.save(); c.fillStyle=css('--pink'); c.globalAlpha=.8; c.fillRect(dx0+30,dy1-barH,34,barH); c.globalAlpha=1; c.restore();
    if(st.memo!=null){ const bm=(14-st.memo)/14*(dy1-dy0); c.save(); c.fillStyle=muted; c.globalAlpha=.6; c.fillRect(dx0+80,dy1-bm,34,bm); c.globalAlpha=1; c.restore(); etiquette(c,'repère',dx0+97,dy1+14,muted,{align:'center',taille:10,gras:false}); }
    etiquette(c,'[H₃O⁺] en mol/L (échelle log)',dx1,dy0-8,muted,{align:'right',taille:11,gras:false}); etiquette(c,'pH '+nb(st.pH,1),dx0+47,dy1+14,css('--pink'),{align:'center',taille:11});
    etiquette(c,'chaque graduation : ×100',dx1,dy1+14,muted,{align:'right',taille:10,gras:false});
  });
  d.querySelector('.reglages').innerHTML=reglette(u,'pH','pH',0,14,0.1,7);
  const L=lier(d,st,{pH:v=>nb(v,1)},()=>{ releves(); });
  function releves(){ const p=st.pH; const proches=PRODUITS_PH.filter(x=>Math.abs(x[0]-p)<=0.6).map(x=>x[1]);
    q('.releves').innerHTML='<span>[H₃O⁺] = 10<sup>−pH</sup></span><b>'+concTxt(p)+' mol/L</b><span>Nature</span><b>'+nature(p)+'</b><span>Produits voisins</span><b>'+(proches.length?proches.join(', '):'—')+'</b>'; T.redessiner(); }
  puces(q('.produits'),['Citron','Vinaigre','Café','Eau pure','Sang','Savon','Eau de Javel'],3,i=>{ const p=[2.4,3,5,7,7.4,9.5,12.5][i]; L.regler('pH',p); releves(); const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>pH '+nb(p,1)+' : $[\\mathrm{H_3O^+}]=10^{-'+nb(p,1).replace(',','{,}')+'}\\approx'+concTex(p)+'$ mol/L, solution '+nature(p)+'.</span>'; maths(v); });
  q('.diluer').addEventListener('click',()=>{ const v=q('.verdict'); if(st.pH>=6.5){ v.className='verdict ko'; v.innerHTML='<span>Mets d\'abord le curseur sur un acide (pH nettement inférieur à 7). Diluer de l\'eau pure ne change rien : on obtient… de l\'eau pure.</span>'; return; }
    st.memo=st.pH; const p=Math.min(7,Math.round((st.pH+1)*10)/10); L.regler('pH',p); releves(); v.className='verdict ok'; v.innerHTML='<strong>Dilué 10 fois : le pH passe de '+nb(st.memo,1)+' à '+nb(p,1)+'.</strong><span>La concentration en $\\mathrm{H_3O^+}$ est divisée par 10, et le pH monte d\'<strong>une unité</strong>, pas de dix. Sur le diagramme, la barre descend d\'une demi-graduation (une graduation vaut ×100). Dilue encore : chaque fois, +1.'+(p>=7?' Arrivé à 7, on ne peut plus monter par dilution : on s\'approche de l\'eau pure.':'')+'</span>'; maths(v); });
  q('.comparer').addEventListener('click',()=>{ const v=q('.verdict'); if(st.memo==null){ st.memo=st.pH; releves(); v.className='verdict info'; v.innerHTML='<span>Repère posé à pH '+nb(st.pH,1)+'. Déplace le curseur, puis clique de nouveau pour comparer.</span>'; return; }
    const a=st.memo,b=st.pH; if(a===b){ v.className='verdict info'; v.innerHTML='<span>Même pH, même concentration. Déplace le curseur.</span>'; return; }
    const r=Math.pow(10,Math.abs(a-b)); v.className='verdict ok'; v.innerHTML='<strong>Entre pH '+nb(Math.min(a,b),1)+' et pH '+nb(Math.max(a,b),1)+' : '+(r>=1e4?'10<sup>'+nb(Math.abs(a-b),1)+'</sup>':mil(r))+' fois plus d\'ions oxonium à pH '+nb(Math.min(a,b),1)+'.</strong><span>'+nb(Math.abs(a-b),1)+' unité(s) de pH, c\'est $10^{'+nb(Math.abs(a-b),1).replace(',','{,}')+'}$ sur la concentration. Un pH deux fois plus petit n\'est pas « deux fois plus acide ».</span>'; maths(v); st.memo=null; releves(); });
  releves(); q('.verdict').innerHTML='<span>Déplace le curseur ou choisis un produit. Le bleu de bromothymol : jaune en dessous de 6, bleu au-dessus de 7,6, vert entre.</span>';
}

/* =================================================================
   4. ÉTIQUETTES ET MÉLANGES
   ================================================================= */
const PRODUITS=[
  {nom:'Eau de Javel',soluté:'hypochlorite de sodium NaClO',nature:'base, oxydant',pictos:['corrosif','environnement'],mentions:['Provoque des brûlures de la peau et des lésions oculaires graves','Très toxique pour les organismes aquatiques'],epi:['gants','lunettes'],ph:'12,5',famille:'javel'},
  {nom:'Détartrant WC',soluté:'acide chlorhydrique HCl à 10 %',nature:'acide fort',pictos:['corrosif'],mentions:['Provoque des brûlures de la peau et des lésions oculaires graves'],epi:['gants','lunettes'],ph:'0,5',famille:'acide'},
  {nom:'Vinaigre blanc',soluté:'acide éthanoïque CH₃COOH à 8 %',nature:'acide faible',pictos:['irritant'],mentions:['Provoque une irritation des yeux'],epi:['lunettes si projection'],ph:'2,5',famille:'acide'},
  {nom:'Ammoniaque',soluté:'ammoniac NH₃ en solution',nature:'base faible',pictos:['corrosif','irritant','environnement'],mentions:['Provoque des brûlures','Peut irriter les voies respiratoires'],epi:['gants','lunettes','aération'],ph:'11,5',famille:'ammoniac'},
  {nom:'Déboucheur',soluté:'hydroxyde de sodium NaOH (soude)',nature:'base forte',pictos:['corrosif'],mentions:['Provoque des brûlures de la peau et des lésions oculaires graves'],epi:['gants épais','lunettes'],ph:'14',famille:'base'},
  {nom:'Alcool à 70°',soluté:'éthanol C₂H₆O à 70 %',nature:'neutre',pictos:['inflammable','irritant'],mentions:['Liquide et vapeurs très inflammables','Provoque une sévère irritation des yeux'],epi:['loin des flammes'],ph:'7',famille:'alcool'},
  {nom:'Eau oxygénée',soluté:'peroxyde d\'hydrogène H₂O₂ à 3 %',nature:'oxydant',pictos:['irritant'],mentions:['Provoque une irritation des yeux'],epi:['lunettes si projection'],ph:'5',famille:'oxydant'},
  {nom:'Bicarbonate',soluté:'hydrogénocarbonate de sodium NaHCO₃',nature:'base faible',pictos:[],mentions:['Aucune mention de danger'],epi:[],ph:'8,4',famille:'bicarbonate'},
];
const PICTO_NOM={corrosif:'corrosif',irritant:'irritant, nocif',inflammable:'inflammable',environnement:'dangereux pour le milieu aquatique',toxique:'toxique',sante:'danger pour la santé'};
const PICTO_SVG={
  corrosif:'<path d="M-16,-14 l-6,14 h12 z M4,-14 l-6,14 h12 z"/><path class="trait" d="M-10,0 q0,8 -4,12 M10,0 q0,8 4,12"/><rect x="-18" y="12" width="14" height="6"/><path d="M4,14 q6,-6 12,0 l2,6 h-16 z"/>',
  irritant:'<rect x="-3" y="-18" width="6" height="22" rx="2"/><circle cx="0" cy="12" r="3.5"/>',
  inflammable:'<path d="M0,-18 q10,10 4,20 q8,-4 6,-12 q10,14 -4,24 h-12 q-12,-10 -2,-22 q-2,8 4,10 q-6,-12 4,-20 z"/><rect x="-12" y="14" width="24" height="3"/>',
  environnement:'<path d="M-14,-18 l8,12 h-5 l7,10 h-20 l7,-10 h-5 z"/><rect x="-15" y="4" width="3" height="8"/><path d="M4,8 q6,-8 14,0 q-6,8 -14,0 z M-2,8 l6,-4 v8 z"/><path class="trait" d="M-20,18 h40"/>',
  toxique:'<circle cx="0" cy="-5" r="9"/><rect x="-4" y="2" width="8" height="5"/><path class="trait" d="M-12,8 l24,10 M12,8 l-24,10"/>',
  sante:'<circle cx="0" cy="-13" r="5"/><path d="M-9,-6 h18 l-3,14 h-12 z"/><path d="M0,10 l3,8 h8 l-6,5 l2,8 l-7,-5 l-7,5 l2,-8 l-6,-5 h8 z"/>',
};
function pictoSVG(nom,taille){ taille=taille||48; return '<svg viewBox="-32 -32 64 64" width="'+taille+'" height="'+taille+'" role="img" aria-label="pictogramme '+PICTO_NOM[nom]+'"><polygon class="picto-cadre" points="0,-30 30,0 0,30 -30,0"/><g class="picto-symbole">'+PICTO_SVG[nom]+'</g></svg>'; }
const MELANGES={
  'javel+acide':['ko','Dichlore Cl₂, gaz toxique : toux, brûlure des voies respiratoires, œdème. C\'est l\'accident type du nettoyage des toilettes : détartrant puis Javel sans rincer.'],
  'javel+ammoniac':['ko','Chloramines, gaz toxiques et irritants. Même dans une pièce aérée, on ne mélange jamais Javel et ammoniaque.'],
  'javel+alcool':['ko','Chloroforme et autres composés chlorés toxiques. Deux désinfectants ne font pas un meilleur désinfectant.'],
  'javel+oxydant':['ko','Dégagement de dioxygène et de chaleur, projections de Javel corrosive.'],
  'acide+base':['attention','Neutralisation violente : dégagement de chaleur, projections de solution encore corrosive. Les deux produits sont dangereux séparément ; ensemble, ils chauffent.'],
  'acide+bicarbonate':['ok','Mousse de dioxyde de carbone CO₂, sans danger. C\'est le volcan des petits chimistes : mais les deux se neutralisent, et le mélange ne nettoie plus rien.'],
  'acide+ammoniac':['attention','Neutralisation, chaleur et vapeurs d\'ammoniac irritantes.'],
  'acide+oxydant':['attention','Avec l\'acide chlorhydrique, l\'eau oxygénée peut libérer du dichlore. À éviter.'],
  'acide+alcool':['ok','Pas de réaction notable à ces concentrations. Mais chacun garde ses dangers propres.'],
  'base+ammoniac':['attention','Chaleur et vapeurs d\'ammoniac. Inutile et irritant.'],
  'base+alcool':['ok','Pas de réaction dangereuse. L\'alcool reste inflammable.'],
  'base+bicarbonate':['ok','Rien de notable : deux bases.'],
  'base+oxydant':['attention','La soude décompose l\'eau oxygénée : dégagement de dioxygène, chaleur, projections.'],
  'ammoniac+alcool':['ok','Pas de réaction dangereuse, mais des vapeurs d\'ammoniac dans une pièce fermée restent irritantes.'],
  'ammoniac+bicarbonate':['ok','Rien de notable.'],
  'ammoniac+oxydant':['attention','Décomposition de l\'eau oxygénée, chaleur et vapeurs.'],
  'alcool+bicarbonate':['ok','Rien de notable.'],
  'alcool+oxydant':['ok','Rien de notable à 3 %. L\'alcool reste inflammable.'],
  'bicarbonate+oxydant':['ok','Rien de notable.'],
  'javel+bicarbonate':['ok','Rien de notable.'],
};
function securite(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Étiquettes, pictogrammes et mélanges',
    intro:'Huit produits de la maison ou de l\'établissement. Clique sur un produit pour lire son étiquette : soluté, nature, pictogrammes, protections. Puis choisis-en deux et regarde ce que donne le mélange… avant de le faire pour de vrai.',
    gauche:'<div class="etiquette-produit"></div><div class="melange-resultat"></div>'});
  d.innerHTML='<div class="champ"><span class="etiq">Un produit</span><div class="puces produits"></div></div>'+
    '<div class="champ"><span class="etiq">Mélanger avec…</span><div class="puces avec"></div></div>'+
    '<div class="ligne"><button type="button" class="btn melanger">Que se passe-t-il ?</button><button type="button" class="btn fantome quiz-picto">Quiz : ce pictogramme ?</button></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={a:0,b:1,quiz:null};
  function etiquette_(p){ return '<div class="etiquette-carte"><div class="etiquette-tete"><div><strong>'+p.nom+'</strong><br><span class="discret">'+p.soluté+'</span></div><div class="pictos">'+(p.pictos.length?p.pictos.map(x=>pictoSVG(x,52)).join(''):'<span class="discret">aucun pictogramme</span>')+'</div></div>'+
    '<ul class="mentions">'+p.mentions.map(m=>'<li>'+m+'</li>').join('')+'</ul>'+
    '<div class="etiquette-pied"><span>Nature : <b>'+p.nature+'</b></span><span>pH ≈ <b>'+p.ph+'</b></span><span>Protection : <b>'+(p.epi.length?p.epi.join(', '):'aucune particulière')+'</b></span></div>'+
    (p.pictos.length?'<p class="discret">Pictogrammes : '+p.pictos.map(x=>PICTO_NOM[x]).join(' · ')+'.</p>':'')+'</div>'; }
  function montrer(){ g.querySelector('.etiquette-produit').innerHTML=etiquette_(PRODUITS[st.a]); }
  puces(q('.produits'),PRODUITS.map(p=>p.nom),0,i=>{ st.a=i; montrer(); g.querySelector('.melange-resultat').innerHTML=''; const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>'+PRODUITS[i].nom+' : '+PRODUITS[i].nature+'. '+(PRODUITS[i].pictos.includes('corrosif')?'Corrosif : gants et lunettes obligatoires.':PRODUITS[i].pictos.includes('inflammable')?'Inflammable : loin de toute flamme.':PRODUITS[i].pictos.length?'À manipuler avec précaution.':'Sans danger particulier.')+'</span>'; });
  puces(q('.avec'),PRODUITS.map(p=>p.nom),1,i=>{ st.b=i; });
  q('.melanger').addEventListener('click',()=>{ const A=PRODUITS[st.a],B=PRODUITS[st.b]; const v=q('.verdict'); const r=g.querySelector('.melange-resultat');
    if(st.a===st.b){ v.className='verdict info'; v.innerHTML='<span>Un produit avec lui-même : rien de neuf. Choisis-en deux différents.</span>'; return; }
    let res=MELANGES[A.famille+'+'+B.famille]||MELANGES[B.famille+'+'+A.famille]; if(A.famille===B.famille) res=['ok','Deux produits de même nature : pas de réaction entre eux.'];
    if(!res) res=['ok','Rien de notable.'];
    const [niv,txt]=res; v.className='verdict '+(niv==='ko'?'ko':niv==='attention'?'info':'ok');
    v.innerHTML='<strong>'+A.nom+' + '+B.nom+' : '+(niv==='ko'?'DANGER, gaz toxique.':niv==='attention'?'à éviter.':'sans danger particulier.')+'</strong><span>'+txt+'</span>';
    r.innerHTML='<div class="melange '+niv+'"><span>'+A.nom+'</span><span class="plus">+</span><span>'+B.nom+'</span><span class="fleche">→</span><span class="issue">'+(niv==='ko'?'☠ gaz toxique':niv==='attention'?'⚠ chaleur, projections':'✓ rien de grave')+'</span></div>'; });
  q('.quiz-picto').addEventListener('click',()=>{ const v=q('.verdict'); const noms=Object.keys(PICTO_SVG); if(!st.quiz){ st.quiz=noms[hasard(0,noms.length-1)]; v.className='verdict info';
      v.innerHTML='<span>Que signifie ce pictogramme ?</span><div class="pictos">'+pictoSVG(st.quiz,64)+'</div><div class="ligne quiz-choix">'+noms.map(n=>'<button type="button" class="puce" data-p="'+n+'">'+PICTO_NOM[n]+'</button>').join('')+'</div>';
      v.querySelector('.quiz-choix').addEventListener('click',e=>{ const b=e.target.closest('[data-p]'); if(!b) return; const juste=b.dataset.p===st.quiz; v.className='verdict '+(juste?'ok':'ko'); v.innerHTML='<strong>'+(juste?'Juste : ':'Non, c\'est : ')+PICTO_NOM[st.quiz]+'.</strong><span>'+({corrosif:'Détruit les tissus vivants et attaque les métaux : acides forts, soude, Javel concentrée. Gants et lunettes.',irritant:'Irrite la peau, les yeux ou les voies respiratoires ; ou nocif en cas d\'ingestion. Le moins grave des losanges, mais pas anodin.',inflammable:'Prend feu facilement : alcool, acétone, aérosols. Loin des flammes et des sources de chaleur.',environnement:'Toxique pour les poissons et les organismes aquatiques : ne pas jeter à l\'évier.',toxique:'Mortel ou toxique même à petite dose : pesticides, méthanol. Jamais sans protection.',sante:'Danger grave à long terme : cancérogène, toxique pour la reproduction, ou allergisant respiratoire.'})[st.quiz]+' Encore un ?</span>'; st.quiz=null; }); } });
  montrer(); q('.verdict').innerHTML='<span>Eau de Javel : base et oxydant, corrosive. Lis l\'étiquette, puis mélange-la (virtuellement) avec le détartrant.</span>';
}

window.LABOS=window.LABOS||{};
window.LABOS.solutions={dissolution,dilution,ph,securite};
})();
