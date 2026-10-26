/* =====================================================================
   LABORATOIRES — NOTION DE FONCTION (seconde)
     machine   la machine à nombres : un nombre entre, un nombre sort,
               et le défi inverse (trouver un antécédent en tâtonnant)
     courbe    lire une image ou des antécédents sur une courbe, sans
               formule : des défis de lecture graphique
     trois     formule, tableau et courbe changent ensemble
   Les outils généraux sont dans labos/commun.js ; les courbes sont
   tracées par graphe.js.
   ===================================================================== */
(function(){
"use strict";
const {maths,css,id,nb,hasard,lire,carcasse,reglette,lier,puces,Toile,etiquette,reussi}=window.Labo;
const G=window.Graphe;
const fmt=G.fmt;
const egaux=(a,b,eps)=>Math.abs(a-b)<(eps||1e-9);

/* ---------- les fonctions de la machine : formule, nom, et le calcul écrit étape par étape ---------- */
const texN=v=>fmt(v).replace('−','-').replace(',','{,}');
const parT=v=>v<0?'('+texN(v)+')':texN(v);
const FONCTIONS=[
  {nom:'f',src:'x^2 - 2x - 3',tex:'x^2-2x-3',f:x=>x*x-2*x-3,min:-4,max:6,
    etapes:x=>['('+texN(x)+')^2-2\\times'+parT(x)+'-3',texN(x*x)+(2*x<0?'+':'-')+texN(Math.abs(2*x))+'-3',texN(x*x-2*x-3)]},
  {nom:'g',src:'3x - 5',tex:'3x-5',f:x=>3*x-5,min:-4,max:6,
    etapes:x=>['3\\times'+parT(x)+'-5',texN(3*x)+'-5',texN(3*x-5)]},
  {nom:'h',src:'-x^2 + 4',tex:'-x^2+4',f:x=>-x*x+4,min:-4,max:4,
    etapes:x=>['-('+texN(x)+')^2+4','-'+texN(x*x)+'+4',texN(-x*x+4)]},
  {nom:'k',src:'0.5x + 2',tex:'0{,}5x+2',f:x=>.5*x+2,min:-6,max:6,
    etapes:x=>['0{,}5\\times'+parT(x)+'+2',texN(.5*x)+'+2',texN(.5*x+2)]},
];

/* =================================================================
   1. LA MACHINE À NOMBRES
   ================================================================= */
function machine(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'La machine à nombres',
    intro:'Une fonction, c\'est une machine : un nombre entre, <strong>un seul</strong> nombre sort. Choisis la machine, fais entrer un nombre, regarde le calcul. Puis le défi inverse : trouver quel nombre faire entrer pour obtenir une sortie donnée.',
    gauche:'<canvas class="large" role="img" aria-label="La machine : le nombre qui entre, la fonction, le nombre qui sort."></canvas><div class="calcul calcul-machine" aria-live="polite"></div>'});
  d.innerHTML='<div class="champ"><span class="etiq">La machine</span><div class="puces choix-f"></div></div>'+
    reglette(u,'x','Le nombre qui entre : x','-4','6','0.5','2')+
    '<div class="phrases phrases-machine"></div>'+
    '<div class="champ"><span class="etiq">Défi inverse</span><div class="defi pile"><p class="enonce-defi"></p><div class="verdict info" aria-live="polite"></div><div class="ligne"><button type="button" class="btn fantome nouveau">Nouveau défi</button></div></div></div>';
  const q=s=>d.querySelector(s);
  const st={i:0,x:2,defi:null,essais:0,trouves:[]};
  const F=()=>FONCTIONS[st.i];
  const T=Toile(g.querySelector('canvas'),T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const f=F(), y=f.f(st.x);
    const bleu=css('--blue'), rose=css('--pink'), ink=css('--ink'), muted=css('--muted'), card=css('--card'), mc=css('--mc');
    const cy=H/2, r=Math.min(30,W*.07), bw=Math.min(190,W*.36), bh=Math.min(92,H*.5);
    const xIn=W*.14, xBox=W/2, xOut=W*.86;
    // le tapis
    c.save(); c.strokeStyle=css('--line'); c.lineWidth=6; c.lineCap='round'; c.beginPath(); c.moveTo(xIn+r,cy); c.lineTo(xBox-bw/2,cy); c.moveTo(xBox+bw/2,cy); c.lineTo(xOut-r,cy); c.stroke(); c.restore();
    // flèches
    const fleche=(x,coul)=>{ c.save(); c.fillStyle=coul; c.beginPath(); c.moveTo(x,cy-7); c.lineTo(x+12,cy); c.lineTo(x,cy+7); c.closePath(); c.fill(); c.restore(); };
    fleche((xIn+r+xBox-bw/2)/2-6,bleu); fleche((xBox+bw/2+xOut-r)/2-6,rose);
    // la boîte
    c.save(); c.fillStyle=mc; c.shadowColor='rgba(0,0,0,.18)'; c.shadowBlur=14; c.shadowOffsetY=6; c.beginPath(); if(c.roundRect) c.roundRect(xBox-bw/2,cy-bh/2,bw,bh,18); else c.rect(xBox-bw/2,cy-bh/2,bw,bh); c.fill(); c.restore();
    etiquette(c,f.nom,xBox,cy-bh/2+22,css('--sur-accent'),{align:'center',taille:22,halo:mc});
    etiquette(c,f.nom+'(x) = '+G.afficher(f.src).replace(/<[^>]+>/g,''),xBox,cy+bh/2-22,css('--sur-accent'),{align:'center',taille:W<460?12:14,gras:false,halo:mc});
    // les jetons
    const jeton=(x,v,coul,legende)=>{ c.save(); c.fillStyle=card; c.strokeStyle=coul; c.lineWidth=4; c.beginPath(); c.arc(x,cy,r,0,7); c.fill(); c.stroke(); c.restore();
      etiquette(c,fmt(v),x,cy,coul,{align:'center',taille:r>24?18:15,halo:card}); etiquette(c,legende,x,cy+r+16,muted,{align:'center',taille:12,gras:false}); };
    jeton(xIn,st.x,bleu,'x entre'); jeton(xOut,y,rose,f.nom+'(x) sort');
    etiquette(c,'antécédent',xIn,cy-r-14,bleu,{align:'center',taille:12}); etiquette(c,'image',xOut,cy-r-14,rose,{align:'center',taille:12});
  });
  function maj(){
    const f=F(), y=f.f(st.x), e=f.etapes(st.x);
    g.querySelector('.calcul-machine').innerHTML='$'+f.nom+'(\\htmlClass{vx}{'+texN(st.x)+'}) = '+e[0]+' = '+e[1]+' = \\htmlClass{vy}{'+e[2]+'}$';
    q('.phrases-machine').innerHTML='<p>L\'image de <span class="vx">'+fmt(st.x)+'</span> par '+f.nom+' est <span class="vy">'+fmt(y)+'</span>.</p><p><span class="vx">'+fmt(st.x)+'</span> est un antécédent de <span class="vy">'+fmt(y)+'</span>.</p>';
    maths(g.querySelector('.calcul-machine')); T.redessiner();
    if(st.defi!=null) verifierDefi(y);
  }
  const L=lier(d,st,{x:v=>fmt(v)},()=>{ st.essais++; maj(); });
  function nouveauDefi(){ const f=F(); const xs=[]; for(let x=f.min;x<=f.max;x+=.5) xs.push(x);
    const x0=xs[hasard(0,xs.length-1)]; st.defi=f.f(x0); st.essais=0; st.trouves=[];
    const nbAnt=xs.filter(x=>egaux(f.f(x),st.defi,1e-9)).length;
    q('.enonce-defi').innerHTML='Trouve un nombre qui donne <span class="vy">'+fmt(st.defi)+'</span> en sortie : bouge le curseur jusqu\'à ce que '+f.nom+'(x) = '+fmt(st.defi)+'.'+(nbAnt>1?' <span class="discret">Il y en a '+nbAnt+'.</span>':'');
    const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>Tu cherches un <strong>antécédent</strong> de '+fmt(st.defi)+' : le chemin inverse de la machine.</span>'; }
  function verifierDefi(y){ const f=F(); const v=q('.verdict');
    if(!egaux(y,st.defi,1e-9)){ const sens= y<st.defi?'trop petit':'trop grand'; v.className='verdict info'; v.innerHTML='<span>'+f.nom+'('+fmt(st.x)+') = '+fmt(y)+' : '+sens+'. '+(st.essais>6?'Indice : regarde comment la sortie varie quand tu bouges le curseur.':'Continue.')+'</span>'; return; }
    if(!st.trouves.includes(st.x)) st.trouves.push(st.x);
    const xs=[]; for(let x=f.min;x<=f.max;x+=.5) if(egaux(f.f(x),st.defi,1e-9)) xs.push(x);
    const reste=xs.filter(x=>!st.trouves.includes(x));
    reussi(v); v.className='verdict ok'; v.innerHTML='<strong>'+f.nom+'('+fmt(st.x)+') = '+fmt(st.defi)+'.</strong><span>'+fmt(st.x)+' est un antécédent de '+fmt(st.defi)+'. '+(reste.length?'Il en existe '+(reste.length>1?reste.length+' autres':'un autre')+' : à toi de le trouver.':(xs.length>1?'Tu as trouvé les '+xs.length+' antécédents : une image est unique, mais un nombre peut avoir plusieurs antécédents.':'Et c\'est le seul.'))+'</span>'; }
  puces(q('.choix-f'),FONCTIONS.map(f=>'$'+f.nom+'(x)='+f.tex+'$'),0,i=>{ st.i=i; const f=F(); const r=d.querySelector('[data-r=x]'); r.min=f.min; r.max=f.max; st.x=Math.max(f.min,Math.min(f.max,st.x)); L.regler('x',st.x); nouveauDefi(); maj(); });
  maths(q('.choix-f'));
  q('.nouveau').addEventListener('click',()=>{ nouveauDefi(); maj(); });
  nouveauDefi(); maj();
}

/* =================================================================
   2. LIRE SUR LA COURBE
   Une courbe donnée par des points (pas de formule) : il faut LIRE.
   ================================================================= */
const COURBES=[
  {nom:'g',noeuds:[[-4,3],[-3,1],[-2,-1],[-1,-2],[0,-1],[1,1],[2,3],[3,2],[4,0],[5,-1]],fen:[-5,6,-3,4]},
  {nom:'h',noeuds:[[-5,-2],[-4,0],[-3,2],[-2,3],[-1,2],[0,0],[1,-1],[2,0],[3,2],[4,3]],fen:[-6,5,-3,4]},
  {nom:'p',noeuds:[[-3,4],[-2,2],[-1,1],[0,0],[1,1],[2,2],[3,1],[4,-1],[5,-2]],fen:[-4,6,-3,5]},
];
function valeurNoeuds(nd,x){ for(let i=0;i<nd.length-1;i++){ const [x0,y0]=nd[i],[x1,y1]=nd[i+1]; if(x>=x0-1e-12&&x<=x1+1e-12) return y0+(y1-y0)*(x-x0)/(x1-x0); } return NaN; }
function courbe(el){
  const {g,d}=carcasse(el,{titre:'Lire sur la courbe',
    intro:'Ici, pas de formule : seulement la courbe. Lire une <span class="vy">image</span>, c\'est partir de l\'axe horizontal et monter jusqu\'à la courbe. Lire des <span class="vx">antécédents</span>, c\'est partir de l\'axe vertical et chercher <em>tous</em> les points de la courbe à cette hauteur.',
    gauche:'<figure class="graphe panoramique"></figure>'});
  d.innerHTML='<div class="champ"><span class="etiq">Défi de lecture</span><p class="enonce-lecture"></p></div>'+
    '<form class="champ reponse-lecture"><label for="'+id()+'r">Ta réponse</label><div class="ligne"><input type="text" id="r" autocomplete="off" inputmode="decimal" placeholder="par exemple -1 ; 2"><button class="btn" type="submit">Vérifier</button></div><span class="discret">Plusieurs valeurs : sépare-les par un point-virgule.</span></form>'+
    '<div class="verdict info" aria-live="polite"></div>'+
    '<div class="ligne"><button type="button" class="btn fantome aide">Montrer le tracé</button><button type="button" class="btn fantome autre">Autre question</button></div>'+
    '<div class="releves"></div>';
  const q=s=>d.querySelector(s); const fig=g.querySelector('figure'); const input=q('input'); input.id=q('label').htmlFor;
  const cv=document.createElement('canvas'); cv.setAttribute('role','img'); fig.appendChild(cv);
  const st={c:0,type:'img',x:0,k:0,aide:false,sans:0,avec:0,fait:false};
  const C=()=>COURBES[st.c];
  function opts(){ const c=C(); const o={noeuds:c.noeuds,nomNoeuds:c.nom,xmin:c.fen[0],xmax:c.fen[1],ymin:c.fen[2],ymax:c.fen[3],fonctions:[]};
    if(st.aide||st.fait){ if(st.type==='img') o.point={x:st.x,y:valeurNoeuds(c.noeuds,st.x),nom:''}; else { o.horizontale=st.k; o.racines=G.racinesNoeuds(c.noeuds,st.k); } }
    return o; }
  const reg=G.enregistrer(cv,opts);
  function question(){ const c=C(); st.aide=false; st.fait=false; st.type= Math.random()<.5?'img':'ant';
    if(st.type==='img'){ const xs=c.noeuds.map(p=>p[0]); st.x=xs[hasard(0,xs.length-1)]; q('.enonce-lecture').innerHTML='Lis l\'<span class="vy">image</span> de <span class="vx">'+fmt(st.x)+'</span> par '+c.nom+'.'; }
    else { const ys=[...new Set(c.noeuds.map(p=>p[1]))]; st.k=ys[hasard(0,ys.length-1)]; q('.enonce-lecture').innerHTML='Lis <strong>tous</strong> les <span class="vx">antécédents</span> de <span class="vy">'+fmt(st.k)+'</span> par '+c.nom+'.'; }
    input.value=''; const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>'+(st.type==='img'?'Pars de '+fmt(st.x)+' sur l\'axe horizontal, monte ou descends jusqu\'à la courbe, puis lis à gauche.':'Repère '+fmt(st.k)+' sur l\'axe vertical, imagine la droite horizontale, et compte les points de la courbe qu\'elle touche.')+'</span>';
    q('.aide').textContent='Montrer le tracé'; q('.aide').disabled=false; G.dessiner(cv,opts()); input.focus({preventScroll:true}); }
  function releves(){ q('.releves').innerHTML='<span>Lectures justes sans tracé</span><b>'+st.sans+'</b><span>Avec le tracé</span><b>'+st.avec+'</b>'; }
  q('form').addEventListener('submit',e=>{ e.preventDefault(); if(st.fait) return; const c=C(); const v=q('.verdict');
    const vals=input.value.split(/[;,]|\bet\b/).map(s=>lire(s)).filter(x=>isFinite(x)); if(!vals.length){ v.className='verdict ko'; v.innerHTML='<span>Écris un nombre, ou plusieurs séparés par « ; ».</span>'; return; }
    let ok, attendu;
    if(st.type==='img'){ attendu=[valeurNoeuds(c.noeuds,st.x)]; ok= vals.length===1&&egaux(vals[0],attendu[0],.3); }
    else { attendu=G.racinesNoeuds(c.noeuds,st.k); const tri=a=>a.slice().sort((p,r)=>p-r); const A=tri(attendu), V=tri(vals); ok= A.length===V.length&&A.every((a,i)=>egaux(a,V[i],.35)); }
    if(ok){ st.fait=true; if(st.aide) st.avec++; else st.sans++; releves(); reussi(v); v.className='verdict ok'; v.innerHTML='<strong>Juste.</strong><span>'+(st.type==='img'?c.nom+'('+fmt(st.x)+') = '+fmt(attendu[0])+'. Le point ('+fmt(st.x)+' ; '+fmt(attendu[0])+') est sur la courbe.':fmt(st.k)+' a '+(attendu.length===1?'un seul antécédent':attendu.length+' antécédents')+' : '+attendu.map(fmt).join(' ; ')+'. Une image est unique, les antécédents non.')+'</span>'; G.dessiner(cv,opts()); }
    else { v.className='verdict ko'; v.innerHTML='<strong>Pas tout à fait.</strong><span>'+(st.type==='img'?'Une image est un seul nombre, lu sur l\'axe vertical.':vals.length<attendu.length?'Il en manque : la droite horizontale coupe la courbe en '+attendu.length+' points.':vals.length>attendu.length?'Il y en a trop : compte seulement les points où la courbe est à la hauteur '+fmt(st.k)+'.':'Vérifie les abscisses : on les lit sur l\'axe horizontal.')+' Tu peux afficher le tracé pour vérifier.</span>'; } });
  q('.aide').addEventListener('click',()=>{ st.aide=true; q('.aide').textContent='Tracé affiché'; q('.aide').disabled=true; G.dessiner(cv,opts()); });
  q('.autre').addEventListener('click',()=>{ if(Math.random()<.3) st.c=(st.c+1)%COURBES.length; question(); });
  releves(); question();
}

/* =================================================================
   3. TROIS REPRÉSENTATIONS : formule, tableau et courbe ensemble
   ================================================================= */
function trois(el){
  const {g}=carcasse(el,{titre:'Formule, tableau, courbe : la même fonction',
    intro:'Bouge le curseur, clique sur la courbe ou dans le tableau : les trois représentations changent ensemble. Cherche d\'abord une image, puis des antécédents.',
    gauche:'<figure class="graphe" data-f="x^2 - 2x - 3" data-nom="f" data-fenetre="-3 5 -5 7" data-interactif="les-deux" data-tableau="-2 4"></figure>'});
  el.querySelector('.labo-corps').classList.add('pleine'); el.querySelector('.labo-droite').remove();
  G.init(el);
}

window.LABOS=window.LABOS||{};
window.LABOS.fonctions={machine,courbe,trois};
})();
