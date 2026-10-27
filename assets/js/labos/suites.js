/* =====================================================================
   LABORATOIRES — SUITES NUMÉRIQUES (première spécialité)
     cible     viser trois points : choisir arithmétique ou géométrique, régler u₀ et la raison
     seuil     à partir de quel rang ? la boucle while qui tourne pas à pas
     escalier  u(n+1) = f(u(n)) sur le graphique : prédire, trouver la suite constante, deviner où elle va
   Les diagnostics nomment les erreurs de la liste du chapitre (décalage d'indice, raison d'un
   pourcentage, signe de la raison, valeur au lieu du rang, f(2) au lieu de f(u₁)…).
   Les outils généraux sont dans labos/commun.js.
   ===================================================================== */
(function(){
"use strict";
const {maths,css,id,nb,lire,carcasse,reglette,lier,puces,Toile,etiquette,reussi}=window.Labo;
const IND='₀₁₂₃₄₅₆₇₈₉';
const indice=n=>String(n).split('').map(c=>IND[+c]).join('');
/* un nombre lisible : 1 468,53 · 7 · −2,5 (deux décimales au plus, zéros inutiles retirés) */
function fmt(v,d){ if(!isFinite(v)) return '—'; d=d==null?2:d; let s=(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).toFixed(d); if(s.includes('.')) s=s.replace(/0+$/,'').replace(/\.$/,'');
  const [e,f]=s.replace('-','').split('.'); return (v<0&&Math.abs(v)>=0.5*Math.pow(10,-d)?'−':'')+e.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(f?','+f:''); }
const tx=v=>fmt(v).replace(',','{,}').replace(/ /g,'\\,').replace('−','-');
const egal=(a,b)=>Math.abs(a-b)<=1e-6*(1+Math.abs(b));
/* un pas de graduation « rond » (1, 2, 5, 10, 20…) pour environ n graduations */
function pasRond(etendue,n){ const brut=etendue/n, p=Math.pow(10,Math.floor(Math.log10(brut))); return [1,2,5,10].map(k=>k*p).find(k=>k>=brut)||10*p; }

/* le repère d'un nuage de points : n de 0 à nmax, valeurs de ymin à ymax */
function repere(c,W,H,nmax,ymin,ymax){
  const g=46,dr=18,h=16,b=30,ox=12; const X=n=>g+ox+n/nmax*(W-g-dr-ox), Y=v=>H-b-(v-ymin)/(ymax-ymin)*(H-b-h);
  const muted=css('--muted'), grid=css('--grid');
  c.save(); c.lineWidth=1; c.strokeStyle=grid; const py=pasRond(ymax-ymin,5);
  for(let v=Math.ceil(ymin/py)*py;v<=ymax;v+=py){ c.beginPath(); c.moveTo(g,Y(v)); c.lineTo(W-dr,Y(v)); c.stroke(); etiquette(c,fmt(v),g-6,Y(v),muted,{align:'right',taille:11,gras:false}); }
  const px=nmax>12?2:1; for(let n=0;n<=nmax;n+=px){ etiquette(c,String(n),X(n),H-b+14,muted,{align:'center',taille:11,gras:false}); }
  c.strokeStyle=muted; c.lineWidth=1.5; c.beginPath(); const y0=Math.min(Math.max(0,ymin),ymax); c.moveTo(g,Y(y0)); c.lineTo(W-dr,Y(y0)); c.moveTo(g,h); c.lineTo(g,H-b); c.stroke(); c.restore();
  etiquette(c,'n',W-dr,Y(Math.min(Math.max(0,ymin),ymax))-12,muted,{align:'right',taille:12});
  return {X,Y,dedans:v=>v>=ymin&&v<=ymax};
}
function disque(c,x,y,r,coul,plein){ c.save(); c.beginPath(); c.arc(x,y,r,0,7); if(plein===false){ c.strokeStyle=coul; c.lineWidth=2.5; c.stroke(); } else { c.fillStyle=coul; c.fill(); } c.restore(); }

/* =================================================================
   1. VISE LES POINTS
   ================================================================= */
const CIBLES=[
  {type:'a',u0:3,r:2,rangs:[2,5,8],plage:[-10,20,0.5]},
  {type:'g',u0:2,r:2,rangs:[1,3,4],plage:[0,20,0.5]},
  {type:'a',u0:12,r:-1.5,rangs:[2,4,6],plage:[-10,20,0.5]},
  {type:'g',u0:100,r:1.2,rangs:[1,2,3],plage:[0,250,5],taux:20,texte:'On place 100 € à 20 % par an (un taux de rêve). Les cibles sont le capital au bout de 1, 2 et 3 ans. Fais passer ta suite par elles, avec $u_0$ le capital de départ.'},
  {type:'g',u0:16,r:0.5,rangs:[1,2,4],plage:[0,20,0.5]},
  {type:'a',u0:-4,r:3,rangs:[3,6,9],plage:[-10,20,0.5]},
  {type:'g',u0:200,r:0.9,rangs:[2,5,8],plage:[0,250,5],taux:-10,texte:'Une colonie de 200 oiseaux perd 10 % de ses membres chaque année. Les cibles sont la population au bout de 2, 5 et 8 ans.'},
];
const terme=(t,u0,r,n)=>t==='a'?u0+n*r:u0*Math.pow(r,n);
/* u₀ + rn ou u₀ × qⁿ, sans « 0 + 1n » ni « 1 × » */
function formule(t,u0,r){ if(t==='g') return u0===0?'0':(u0===1?'':tx(u0)+'\\times')+(r<0?'('+tx(r)+')':tx(r))+'^n';
  const rn= r===0?'':(Math.abs(r)===1?'':tx(Math.abs(r)))+'n'; if(u0===0) return r===0?'0':(r<0?'-':'')+rn; return tx(u0)+(r===0?'':(r<0?'-':'+')+rn); }
function cible(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Vise les points',
    intro:'Trois cibles sont posées sur le graphique. Choisis le type de suite, règle le premier terme $u_0$ et la raison, puis vérifie : ta suite doit passer par les trois. Une suite arithmétique <strong>ajoute</strong> toujours le même nombre, une géométrique <strong>multiplie</strong> toujours par le même nombre.',
    gauche:'<canvas class="large" role="img" aria-label="Le nuage de points de ta suite, pour n de 0 à 10, et trois cibles à atteindre."></canvas><p class="discret lecture-cible"></p>'});
  d.innerHTML='<div class="champ defi"><span class="etiq">Défi</span><p class="enonce-defi"></p></div>'+
    '<div class="champ"><span class="etiq">Ma suite est</span><div class="puces type"></div></div>'+
    '<div class="zone-reglettes"></div><div class="releves"></div>'+
    '<div class="ligne"><button type="button" class="btn valider">Vérifier</button><button type="button" class="btn fantome autre">Autre défi</button></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={i:0,type:'a',u0:0,r:1,reussis:0};
  const cv=g.querySelector('canvas');
  const D=()=>CIBLES[st.i];
  const valeurCible=k=>terme(D().type,D().u0,D().r,k);
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H);
    const vals=D().rangs.map(valeurCible); const hi=Math.max(...vals,D().u0), lo=Math.min(0,...vals,D().u0);
    const m=(hi-lo)*0.18; const R=repere(c,W,H,10,lo-(lo<0?m:0),hi+m);
    D().rangs.forEach((k,j)=>{ const v=valeurCible(k); const touche=egal(terme(st.type,st.u0,st.r,k),v);
      disque(c,R.X(k),R.Y(v),touche?10:9,touche?css('--ok'):css('--pink'),false); etiquette(c,'ABC'[j],R.X(k)+12,R.Y(v)-12,css('--pink'),{taille:13}); });
    for(let n=0;n<=10;n++){ const v=terme(st.type,st.u0,st.r,n); if(R.dedans(v)) disque(c,R.X(n),R.Y(v),4.5,css('--mc')); }
  });
  function reglettes(){
    const [a,b,p]=D().plage;
    const rr= st.type==='a' ? reglette(u,'r','Raison r (on ajoute)',-5,5,0.5,st.r) : reglette(u,'r','Raison q (on multiplie)',0,3,0.05,st.r);
    q('.zone-reglettes').innerHTML=reglette(u,'u0','Premier terme u₀',a,b,p,st.u0)+rr;
    lier(q('.zone-reglettes'),st,{u0:v=>fmt(v),r:v=>fmt(v)},()=>{ releves(); T.redessiner(); });
  }
  function releves(){ const f='$u_n='+formule(st.type,st.u0,st.r)+'$';
    q('.releves').innerHTML='<span>Ma suite</span><b>'+f+'</b>'+D().rangs.map(k=>'<span>u'+indice(k)+'</span><b>'+fmt(terme(st.type,st.u0,st.r,k))+'</b>').join('');
    maths(q('.releves')); }
  function nouveau(){ const C=D(); const pts=C.rangs.map((k,j)=>'ABC'[j]+'('+k+' ; '+fmt(valeurCible(k))+')').join(', ');
    q('.enonce-defi').innerHTML=(C.texte?C.texte+' ':'Fais passer ta suite par ')+(C.texte?'<span class="discret">Cibles : '+pts+'.</span>':pts+'.');
    st.type='a'; st.u0=0; st.r=1; q('.type').querySelectorAll('.puce').forEach((b,k)=>b.setAttribute('aria-pressed',k===0));
    reglettes(); releves(); maths(q('.enonce-defi')); const v=q('.verdict'); v.className='verdict info';
    v.innerHTML='<span>Regarde d\'abord comment on passe d\'une cible à la suivante : en ajoutant, ou en multipliant ?</span>'; T.redessiner(); }
  puces(q('.type'),['arithmétique','géométrique'],0,i=>{ st.type=i?'g':'a'; st.r=1; reglettes(); releves(); T.redessiner(); });
  q('.valider').addEventListener('click',()=>{
    const C=D(), v=q('.verdict'); const touche=C.rangs.map(k=>egal(terme(st.type,st.u0,st.r,k),valeurCible(k))); const nb_=touche.filter(Boolean).length;
    const mien=k=>terme(st.type,st.u0,st.r,k);
    if(nb_===3){ st.reussis++; reussi(v); v.className='verdict ok';
      v.innerHTML='<strong>Les trois cibles sont touchées : $u_n='+formule(C.type,C.u0,C.r)+'$.</strong><span>'+
      (C.type==='a'?'Entre deux cibles, l\'écart en hauteur est proportionnel au nombre de rangs : c\'est la marque d\'une suite arithmétique, et ses points sont alignés.':'Entre deux cibles voisines, on multiplie toujours par le même nombre : c\'est une suite géométrique, et ses points se cambrent.')+
      (C.taux?' Une évolution de '+(C.taux>0?'+':'−')+Math.abs(C.taux)+' % par an, c\'est $q=1'+(C.taux>0?'+':'-')+'0{,}'+String(Math.abs(C.taux)).padStart(2,'0')+'='+tx(C.r)+'$.':'')+
      (st.reussis>=3?' Trois défis réussis : tu sais lire une suite sur un graphique.':' Autre défi ?')+'</span>'; maths(v); T.redessiner(); return; }
    v.className='verdict ko'; let msg='';
    if(C.rangs.every(k=>egal(mien(k-1),valeurCible(k)))) msg='<strong>Un rang de décalage : ta suite atteint chaque valeur un rang trop tôt.</strong><span>Tu as pris pour $u_0$ la valeur du rang 1. Le premier terme, c\'est celui du rang $0$ : remonte d\'un rang de plus.</span>';
    else if(C.rangs.every(k=>egal(mien(k+1),valeurCible(k)))) msg='<strong>Un rang de décalage : ta suite atteint chaque valeur un rang trop tard.</strong><span>Ton $u_0$ est la valeur que la suite des cibles prendrait au rang $-1$. Le premier terme, c\'est celui du rang $0$.</span>';
    else if(C.taux&&st.type==='g'&&egal(st.r,Math.abs(C.taux)/100)) msg='<strong>$q='+tx(st.r)+'$ fait fondre la suite.</strong><span>Une '+(C.taux>0?'hausse':'baisse')+' de '+Math.abs(C.taux)+' %, ce n\'est pas multiplier par $'+tx(Math.abs(C.taux)/100)+'$ : on garde les 100 % et on '+(C.taux>0?'ajoute':'retire')+' '+Math.abs(C.taux)+' %, soit $q='+tx(C.r)+'$.</span>';
    else if(C.taux&&st.type==='g'&&egal(st.r,1-C.taux/100)) msg='<strong>Ta suite '+(C.taux>0?'baisse':'monte')+' alors que la situation '+(C.taux>0?'monte':'baisse')+'.</strong><span>Avec $q='+tx(st.r)+'$, tu as fait une '+(C.taux>0?'baisse':'hausse')+' de '+Math.abs(C.taux)+' %. Une '+(C.taux>0?'hausse':'baisse')+' donne $q='+tx(C.r)+'$.</span>';
    else if(C.taux&&st.type==='a') msg='<strong>Un pourcentage ne s\'ajoute pas comme une quantité fixe.</strong><span>« '+(C.taux>0?'+':'−')+Math.abs(C.taux)+' % par an » : chaque année, on calcule le pourcentage sur une quantité qui a changé. On multiplie toujours par le même nombre : c\'est une suite géométrique.</span>';
    else if(st.type!==C.type) msg=nb_===2?'<strong>Deux cibles sur trois : il manque la troisième.</strong><span>'+(C.type==='g'?'Une suite arithmétique avance toujours du même pas, ses points sont alignés. Or les trois cibles ne le sont pas : les écarts grandissent (ou rapetissent). C\'est le rapport qui est constant.':'Les trois cibles sont alignées : une suite qui multiplie se cambre et ne peut pas passer par les trois. C\'est l\'écart qui est constant.')+'</span>'
      :'<strong>Ce type de suite ne peut pas passer par les trois cibles.</strong><span>'+(C.type==='g'?'Calcule l\'écart entre deux cibles voisines, rapporté au nombre de rangs : il change. Et le quotient ?':'Calcule le quotient de deux cibles voisines : il change. Et l\'écart, rapporté au nombre de rangs ?')+'</span>';
    else if(C.type==='a'&&egal(st.r,-C.r)) msg='<strong>Ta suite '+(st.r<0?'descend':'monte')+' alors que les cibles '+(C.r<0?'descendent':'montent')+'.</strong><span>Le signe de la raison : une suite arithmétique décroissante a une raison négative.</span>';
    else if(egal(st.u0,C.u0)) msg='<strong>Ton premier terme est bon, ta raison non.</strong><span>'+(C.type==='a'?'Entre deux cibles séparées de $k$ rangs, l\'écart en hauteur vaut $k\\times r$.':'Entre deux cibles séparées de $k$ rangs, le quotient vaut $q^k$.')+' Prends deux cibles et calcule.</span>';
    else if(egal(st.r,C.r)&&st.type===C.type) msg='<strong>La raison est bonne : tes points ont la bonne allure.</strong><span>Mais ils sont trop '+(mien(C.rangs[0])>valeurCible(C.rangs[0])?'hauts':'bas')+'. Règle $u_0$ : '+(C.type==='a'?'remonte la droite des cibles jusqu\'au rang $0$.':'divise la première cible par $q$ autant de fois que nécessaire pour revenir au rang $0$.')+'</span>';
    else msg='<strong>'+(nb_?nb_+' cible'+(nb_>1?'s':'')+' sur 3.':'Aucune cible touchée.')+'</strong><span>Commence par la raison : '+(C.type==='a'?'l\'écart entre deux cibles, divisé par le nombre de rangs qui les sépare.':'le quotient de deux cibles voisines, et combien de rangs les séparent.')+' Puis remonte jusqu\'à $u_0$.</span>';
    v.innerHTML=msg; maths(v); T.redessiner(); });
  q('.autre').addEventListener('click',()=>{ st.i=(st.i+1)%CIBLES.length; nouveau(); });
  cv.addEventListener('pointermove',e=>{ const r=cv.getBoundingClientRect(); const n=Math.round((e.clientX-r.left-46)/(r.width-64)*10); if(n<0||n>10) return;
    g.querySelector('.lecture-cible').textContent='Au rang '+n+', ta suite vaut '+fmt(terme(st.type,st.u0,st.r,n))+'.'; });
  nouveau();
}

/* =================================================================
   2. À PARTIR DE QUEL RANG ?
   ================================================================= */
const SITUATIONS=[
  {nom:'Le livret',texte:'On place 1 000 € à 3 % par an, intérêts composés. Au bout de combien d\'années le capital dépasse-t-il 1 500 € ?',u0:1000,f:u=>u*1.03,code:'u * 1.03',haut:true,S:1500,unite:'ans',combien:'d\'années',var:'u',
    arith:{pas:30,dire:'Tu as ajouté 30 € par an (3 % de 1 000 €). Mais chaque année, les 3 % portent sur un capital plus grand : les intérêts produisent des intérêts. C\'est une suite géométrique.'}},
  {nom:'La ville',texte:'Une ville de 20 000 habitants perd 2 % de sa population chaque année. Au bout de combien d\'années passe-t-elle sous 15 000 habitants ?',u0:20000,f:u=>u*0.98,code:'u * 0.98',haut:false,S:15000,unite:'ans',combien:'d\'années',var:'p',
    arith:{pas:-400,dire:'Tu as retiré 400 habitants par an (2 % de 20 000). Mais les 2 % portent chaque année sur une population plus petite : elle baisse de moins en moins vite. C\'est une suite géométrique.'}},
  {nom:'Le médicament',texte:'Il reste 80 mg d\'un médicament dans le sang ; l\'organisme en élimine 15 % par heure. Au bout de combien d\'heures en reste-t-il moins de 10 mg ?',u0:80,f:u=>u*0.85,code:'q * 0.85',haut:false,S:10,unite:'heures',combien:'d\'heures',var:'q',
    arith:{pas:-12,dire:'Tu as retiré 12 mg par heure (15 % de 80 mg). Mais l\'organisme élimine 15 % de ce qui <strong>reste</strong> : de moins en moins de milligrammes chaque heure. C\'est une suite géométrique.'}},
  {nom:'La citerne',texte:'Une citerne de 5 000 L perd 180 L par jour. Au bout de combien de jours contient-elle moins de 1 000 L ?',u0:5000,f:u=>u-180,code:'v - 180',haut:false,S:1000,unite:'jours',combien:'de jours',var:'v'},
  {nom:'Les bactéries',texte:'500 bactéries doublent toutes les 20 minutes. Au bout de combien de périodes de 20 minutes dépassent-elles un million ?',u0:500,f:u=>u*2,code:'b * 2',haut:true,S:1000000,unite:'périodes de 20 min',combien:'de périodes',var:'b',
    arith:{pas:500,dire:'Tu as ajouté 500 bactéries par période. Doubler, c\'est multiplier par 2 : à chaque période, on ajoute autant de bactéries qu\'il y en a déjà.'}},
];
function seuilLabo(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'À partir de quel rang ?',
    intro:'Une situation, un seuil à franchir. Cherche le rang, puis fais tourner la boucle <code>while</code> tour par tour pour vérifier : elle avance tant que le seuil <strong>n\'est pas</strong> franchi, et renvoie le rang où elle s\'arrête.',
    gauche:'<canvas class="large" role="img" aria-label="Les premiers termes de la suite et la droite du seuil."></canvas><pre class="code programme"></pre>'});
  d.innerHTML='<div class="champ"><span class="etiq">La situation</span><div class="puces situations"></div></div>'+
    '<p class="enonce-defi"></p>'+
    '<div class="champ"><label for="'+u+'rep">Ta réponse : le rang $n$ cherché</label><div class="ligne"><input type="text" id="'+u+'rep" inputmode="numeric" autocomplete="off"><button type="button" class="btn valider">Vérifier</button></div></div>'+
    '<div class="champ"><span class="etiq">La boucle</span><div class="ligne"><button type="button" class="btn fantome tour">Un tour de boucle</button><button type="button" class="btn fantome finir">Jusqu\'au bout</button><button type="button" class="btn fantome zero">Recommencer</button></div></div>'+
    '<div class="releves"></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={i:0,k:0,fini:false};
  const cv=g.querySelector('canvas');
  const S=()=>SITUATIONS[st.i];
  const franchi=(s,v)=>s.haut?v>s.S:v<s.S;
  function termes(s,N){ const t=[s.u0]; for(let n=1;n<=N;n++) t.push(s.f(t[n-1])); return t; }
  function rang(s){ let v=s.u0,n=0; while(!franchi(s,v)&&n<10000){ v=s.f(v); n++; } return n; }
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const s=S(); const N=rang(s); const nmax=N+2; const t=termes(s,nmax);
    const hi=Math.max(...t,s.S), lo=Math.min(0,...t); const R=repere(c,W,H,nmax,lo,hi*1.08);
    c.save(); c.setLineDash([6,5]); c.strokeStyle=css('--pink'); c.lineWidth=2; c.beginPath(); c.moveTo(R.X(0),R.Y(s.S)); c.lineTo(R.X(nmax),R.Y(s.S)); c.stroke(); c.restore();
    etiquette(c,'seuil '+fmt(s.S),R.X(nmax),R.Y(s.S)-12,css('--pink'),{align:'right',taille:12});
    const vus= Math.min(st.k,nmax);
    for(let n=0;n<=nmax;n++){ const montre= n<=vus || n<=3; if(!montre) continue; const v=t[n];
      disque(c,R.X(n),R.Y(v),n===st.k?6.5:4.5, franchi(s,v)?css('--ok'):css('--mc')); }
    if(st.k>3) etiquette(c,'n = '+st.k,R.X(Math.min(st.k,nmax)),R.Y(t[Math.min(st.k,nmax)])+(s.haut?18:-18),css('--ink'),{align:'center',taille:12});
  });
  function programme(){ const s=S(); q('.enonce-defi').innerHTML=s.texte;
    g.querySelector('.programme').textContent='def seuil():\n    n = 0\n    '+s.var+' = '+s.u0+'\n    while '+s.var+(s.haut?' <= ':' >= ')+s.S+':\n        n = n + 1\n        '+s.var+' = '+s.code+'\n    return n'; }
  function releves(){ const s=S(); const t=termes(s,st.k); const v=t[st.k]; const cond=!franchi(s,v);
    q('.releves').innerHTML='<span>n</span><b>'+st.k+'</b><span>'+s.var+'</span><b>'+fmt(v)+'</b><span>'+s.var+(s.haut?' ≤ ':' ≥ ')+fmt(s.S)+' ?</span><b>'+(cond?'oui : on continue':'non : on s\'arrête')+'</b>'+
      (st.fini?'<span>La fonction renvoie</span><b>'+st.k+'</b>':''); }
  function tour(){ const s=S(); const v=termes(s,st.k)[st.k]; if(franchi(s,v)){ st.fini=true; releves(); T.redessiner(); return; } st.k++; st.fini=franchi(s,termes(s,st.k)[st.k]); releves(); T.redessiner(); }
  function zero(){ st.k=0; st.fini=false; releves(); T.redessiner(); }
  puces(q('.situations'),SITUATIONS.map(s=>s.nom),0,i=>{ st.i=i; q('#'+u+'rep').value=''; programme(); zero(); const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>Écris le rang que tu trouves, en calculant ou avec la boucle.</span>'; });
  q('.tour').addEventListener('click',tour);
  q('.finir').addEventListener('click',()=>{ let garde=0; while(!st.fini&&garde++<10000) tour(); });
  q('.zero').addEventListener('click',zero);
  q('.valider').addEventListener('click',()=>{ const s=S(), v=q('.verdict'); const rep=lire(q('#'+u+'rep').value); const N=rang(s); const t=termes(s,N+1);
    if(!isFinite(rep)){ v.className='verdict info'; v.innerHTML='<span>Écris un nombre entier : le rang.</span>'; return; }
    if(rep===N){ reussi(v); v.className='verdict ok'; v.innerHTML='<strong>Juste : $n='+N+'$.</strong><span>$'+s.var+'_{'+(N-1)+'}\\approx'+tx(t[N-1])+'$ n\'a pas encore franchi le seuil, $'+s.var+'_{'+N+'}\\approx'+tx(t[N])+'$ l\'a franchi. Le seuil est franchi au bout de '+N+' '+s.unite+'.</span>'; maths(v); return; }
    v.className='verdict ko'; let m='';
    if(rep===N-1) m='<strong>Un rang trop tôt.</strong><span>$'+s.var+'_{'+(N-1)+'}\\approx'+tx(t[N-1])+'$ : le seuil n\'est pas encore franchi. On cherche le premier rang qui le franchit.</span>';
    else if(rep===N+1) m='<strong>Un rang trop tard.</strong><span>$'+s.var+'_{'+N+'}\\approx'+tx(t[N])+'$ a déjà franchi le seuil. On demande le <strong>premier</strong> rang où c\'est vrai.</span>';
    else if(rep>=2000&&rep<=2100&&N<100) m='<strong>C\'est une année, pas un rang.</strong><span>On demande un nombre '+s.combien+' : le rang $n$, compté à partir de $0$.</span>';
    else if(Math.abs(rep-s.S)<1e-9||(N<rep&&t.some(x=>Math.abs(x-rep)<=0.01*Math.abs(x)+0.5))) m='<strong>Tu as donné une valeur, pas un rang.</strong><span>On cherche $n$, le numéro du terme, pas $'+s.var+'_n$ ni le seuil. La fonction renvoie <code>n</code>, pas <code>'+s.var+'</code>.</span>';
    else if(s.arith){ const Na=Math.floor(Math.abs((s.S-s.u0)/s.arith.pas))+1; if(rep===Na||rep===Na-1) m='<strong>Tu as calculé comme une suite arithmétique.</strong><span>'+s.arith.dire+'</span>'; }
    if(!m){ const v_=termes(s,Math.max(0,Math.min(rep,10000)))[Math.max(0,Math.min(rep,10000))]; m= rep<N?'<strong>Trop tôt.</strong><span>Au rang '+rep+', $'+s.var+'\\approx'+tx(v_)+'$ : le seuil n\'est pas franchi. Fais tourner la boucle pour voir où elle s\'arrête.</span>':'<strong>Trop tard.</strong><span>Le seuil est franchi avant le rang '+rep+'. Fais tourner la boucle tour par tour.</span>'; }
    v.innerHTML=m; maths(v); });
  programme(); zero(); q('.verdict').innerHTML='<span>Lis la situation, cherche le rang, écris-le. La boucle est là pour vérifier.</span>';
}

/* =================================================================
   3. L'ESCALIER : u(n+1) = f(u(n))
   ================================================================= */
const FONCTIONS=[
  {nom:'$0{,}5x+2$',a:0.5,b:2,u0:0,fen:[0,6],pas:0.5,ctx:''},
  {nom:'$0{,}8x+40$',a:0.8,b:40,u0:40,fen:[0,260],pas:10,ctx:'Le médicament : 40 mg par jour, 20 % éliminés entre deux prises.'},
  {nom:'$-0{,}5x+6$',a:-0.5,b:6,u0:0,fen:[0,8],pas:0.5,ctx:''},
  {nom:'$1{,}5x-2$',a:1.5,b:-2,u0:5,fen:[0,12],pas:0.5,ctx:''},
];
function escalier(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'L\'escalier',
    intro:'Pour une suite définie par $u_{n+1}=f(u_n)$ : on part de $u_0$ sur l\'axe horizontal, on monte jusqu\'à la droite de $f$, on revient sur la droite $y=x$… et on recommence. Les termes se lisent en bas. Construis l\'escalier marche par marche, puis relève les défis.',
    gauche:'<canvas class="large" role="img" aria-label="La droite y égale x, la droite de f et l\'escalier des termes de la suite."></canvas>'});
  d.innerHTML='<div class="champ"><span class="etiq">La fonction f</span><div class="puces fonctions"></div><p class="discret contexte"></p></div>'+
    '<div class="zone-u0"></div>'+
    '<div class="ligne"><button type="button" class="btn fantome marche">Une marche de plus</button><button type="button" class="btn fantome effacer">Effacer</button></div>'+
    '<div class="releves"></div>'+
    '<div class="champ defi"><span class="etiq">Défi</span><div class="puces defis"></div><p class="enonce-defi"></p>'+
      '<div class="ligne saisie-defi"><input type="text" id="'+u+'rep" inputmode="decimal" autocomplete="off" aria-label="Ta réponse"><button type="button" class="btn valider">Vérifier</button></div>'+
      '<div class="ligne choix-constante" hidden><button type="button" class="btn verif-constante">Vérifier mon u₀</button></div>'+
      '<div class="puces choix-limite" hidden></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={i:0,u0:0,marches:0,defi:0};
  const cv=g.querySelector('canvas');
  const F=()=>FONCTIONS[st.i];
  const f=x=>F().a*x+F().b;
  const fixe=()=>F().b/(1-F().a);
  const suite=N=>{ const t=[st.u0]; for(let n=1;n<=N;n++) t.push(f(t[n-1])); return t; };
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const [lo,hi]=F().fen; const muted=css('--muted');
    const g0=40,dr=14,h=14,b=28; const X=x=>g0+(x-lo)/(hi-lo)*(W-g0-dr), Y=y=>H-b-(y-lo)/(hi-lo)*(H-b-h);
    c.save(); c.beginPath(); c.rect(g0,h-2,W-g0-dr,H-b-h+4); c.clip(); c.strokeStyle=css('--grid'); c.lineWidth=1; const p=pasRond(hi-lo,6);
    for(let v=Math.ceil(lo/p)*p;v<=hi;v+=p){ c.beginPath(); c.moveTo(X(v),h); c.lineTo(X(v),H-b); c.moveTo(g0,Y(v)); c.lineTo(W-dr,Y(v)); c.stroke(); }
    c.strokeStyle=muted; c.lineWidth=1.5; c.beginPath(); c.moveTo(g0,Y(lo)); c.lineTo(W-dr,Y(lo)); c.moveTo(X(lo),h); c.lineTo(X(lo),H-b); c.stroke();
    // y = x et y = f(x)
    c.lineWidth=2; c.strokeStyle=muted; c.beginPath(); c.moveTo(X(lo),Y(lo)); c.lineTo(X(hi),Y(hi)); c.stroke();
    c.strokeStyle=css('--mc'); c.lineWidth=2.6; c.beginPath(); c.moveTo(X(lo),Y(f(lo))); c.lineTo(X(hi),Y(f(hi))); c.stroke(); c.restore();
    for(let v=Math.ceil(lo/p)*p;v<=hi;v+=p){ etiquette(c,fmt(v),X(v),H-b+14,muted,{align:'center',taille:11,gras:false}); etiquette(c,fmt(v),g0-5,Y(v),muted,{align:'right',taille:11,gras:false}); }
    etiquette(c,'y = x',X(hi)-4,Y(hi)+14,muted,{align:'right',taille:12});
    const xf=Math.abs(f(hi)-hi)<Math.abs(f(lo)-lo)?hi*0.15+lo*0.85:hi*0.85+lo*0.15; etiquette(c,'y = f(x)',X(xf),Y(Math.max(lo,Math.min(hi,f(xf))))-14,css('--mc'),{align:'center',taille:12});
    // l'escalier
    const t=suite(st.marches); const dans=v=>v>=lo-(hi-lo)*0.05&&v<=hi+(hi-lo)*0.05; const cl=v=>Math.max(lo,Math.min(hi,v));
    c.save(); c.strokeStyle=css('--pink'); c.lineWidth=2.4; c.beginPath(); c.moveTo(X(cl(t[0])),Y(lo));
    for(let n=0;n<st.marches;n++){ if(!dans(t[n])||!dans(t[n+1])) break; c.lineTo(X(t[n]),Y(t[n+1])); c.lineTo(X(t[n+1]),Y(t[n+1])); }
    c.stroke(); c.setLineDash([4,4]); c.lineWidth=1.2; c.beginPath(); for(let n=1;n<=st.marches;n++){ if(!dans(t[n])) break; c.moveTo(X(t[n]),Y(t[n])); c.lineTo(X(t[n]),Y(lo)); } c.stroke(); c.restore();
    t.forEach((v,n)=>{ if(!dans(v)) return; disque(c,X(v),Y(lo),5,css('--pink')); if(n<=3) etiquette(c,'u'+indice(n),X(v),Y(lo)-14,css('--pink'),{align:'center',taille:13}); });
    if(1-F().a!==0&&fixe()>=lo&&fixe()<=hi) disque(c,X(fixe()),Y(fixe()),4,css('--ok'));
  });
  function releves(){ const t=suite(st.marches); q('.releves').innerHTML=t.slice(Math.max(0,t.length-6)).map((v,k)=>{ const n=Math.max(0,t.length-6)+k; return '<span>u'+indice(n)+'</span><b>'+fmt(v)+'</b>'; }).join(''); }
  function zoneU0(){ const [lo,hi]=F().fen; q('.zone-u0').innerHTML=reglette(u,'u0','Premier terme u₀',lo,hi,F().pas,st.u0); lier(q('.zone-u0'),st,{u0:v=>fmt(v)},()=>{ st.marches=0; releves(); texteDefi(); T.redessiner(); }); }
  const DEFIS=['Prédire u₂','Une suite constante','Où va-t-elle ?'];
  function texteDefi(){ q('.enonce-defi').innerHTML=[
      'Avec $u_0='+tx(st.u0)+'$ et $f(x)='+F().nom.replace(/\$/g,'')+'$, calcule $u_2$ <strong>avant</strong> de construire l\'escalier.',
      'Règle $u_0$ pour que la suite soit <strong>constante</strong> : tous ses termes égaux. Puis vérifie.',
      'Avec $u_0='+tx(st.u0)+'$ et cette fonction, que fait la suite quand $n$ devient grand ? Choisis, puis construis l\'escalier pour voir.'][st.defi];
    maths(q('.enonce-defi')); }
  function enonce(){ const v=q('.verdict'); v.className='verdict info'; q('#'+u+'rep').value='';
    q('.saisie-defi').hidden=st.defi!==0; q('.choix-constante').hidden=st.defi!==1; q('.choix-limite').hidden=st.defi!==2;
    q('.choix-limite').querySelectorAll('.puce').forEach(b=>b.setAttribute('aria-pressed','false'));
    texteDefi(); v.innerHTML='<span>'+['Deux marches : $u_1=f(u_0)$, puis $u_2=f(u_1)$.','La suite reste sur place quand $f(u_0)=u_0$.','Regarde si les marches rapetissent ou grandissent.'][st.defi]+'</span>'; maths(v); }
  function comportement(){ const t=suite(400); const z=fixe(); if(Math.abs(st.u0-z)<1e-9) return 3; const fin=t[400]; if(!isFinite(fin)||Math.abs(fin)>1e6) return fin>0?1:2; return Math.abs(fin-z)<1e-3?0:(fin>0?1:2); }
  function repondreLimite(i){ const v=q('.verdict'); const c=comportement(); const z=fixe();
    if(i===c){ reussi(v); v.className='verdict ok'; v.innerHTML='<strong>Juste.</strong><span>'+[
      'Les marches rapetissent : la suite se rapproche de $'+tx(z)+'$, l\'abscisse du point où la droite de $f$ coupe $y=x$. On conjecture que sa limite est $'+tx(z)+'$.'+(F().a<0?' Ici, elle tourne autour en spirale : un terme au-dessus, le suivant en dessous.':''),
      'Les marches grandissent et partent vers la droite : la suite tend vers $+\\infty$.',
      'Les marches grandissent et partent vers la gauche : la suite tend vers $-\\infty$.',
      '$u_0$ est l\'abscisse du point vert : $f(u_0)=u_0$, la suite ne bouge pas.'][c]+'</span>'; maths(v); return; }
    v.className='verdict ko';
    v.innerHTML= c===0?'<strong>Construis quelques marches.</strong><span>Elles rapetissent'+(F().a<0?' en tournant autour du point vert':'')+' : la suite se rapproche d\'un nombre, elle ne part pas à l\'infini.</span>'
      : c===3?'<strong>Calcule $u_1$.</strong><span>Avec ce $u_0$, $u_1=f(u_0)=u_0$ : la suite ne bouge pas du tout.</span>'
      : '<strong>Construis quelques marches.</strong><span>Ici, $|a|='+tx(Math.abs(F().a))+'&gt;1$ : chaque marche est plus grande que la précédente, la suite s\'éloigne du point vert'+(i===0?', elle ne s\'en rapproche pas.':'. Dans quel sens ?')+'</span>';
    maths(v); }
  q('.valider').addEventListener('click',()=>{ const v=q('.verdict'); const rep=lire(q('#'+u+'rep').value); const t=suite(2); const fa=F().a,fb=F().b;
    if(!isFinite(rep)){ v.className='verdict info'; v.innerHTML='<span>Écris un nombre.</span>'; return; }
    const tol=x=>Math.abs(rep-x)<=0.01*(1+Math.abs(x));
    if(tol(t[2])){ reussi(v); v.className='verdict ok'; v.innerHTML='<strong>Juste : $u_2='+tx(t[2])+'$.</strong><span>$u_1=f('+tx(t[0])+')='+tx(t[1])+'$, puis $u_2=f('+tx(t[1])+')='+tx(t[2])+'$. Construis deux marches : tu dois tomber dessus.</span>'; maths(v); return; }
    v.className='verdict ko';
    if(tol(fa*2+fb)) v.innerHTML='<strong>Tu as calculé $f(2)$.</strong><span>La suite est définie par récurrence : $u_2=f(u_1)$, pas $f(2)$. Le $2$ est un rang, pas l\'endroit où l\'on calcule $f$. Calcule d\'abord $u_1=f(u_0)$.</span>';
    else if(tol(t[1])) v.innerHTML='<strong>C\'est $u_1$.</strong><span>Il faut encore une marche : $u_2=f(u_1)=f('+tx(t[1])+')$.</span>';
    else if(tol(2*t[1])||tol(t[1]+1)) v.innerHTML='<strong>$u_2$ n\'est ni $2u_1$ ni $u_1+1$.</strong><span>On applique $f$ au terme précédent : $u_2=f(u_1)='+F().nom.replace(/\$/g,'').replace('x','\\times u_1')+'$.</span>';
    else v.innerHTML='<strong>Pas tout à fait.</strong><span>Calcule $u_1=f(u_0)$, puis applique $f$ une seconde fois.</span>';
    maths(v); });
  d.addEventListener('click',e=>{ if(!e.target.closest('.verif-constante')) return; const v=q('.verdict'); const z=fixe();
    if(Math.abs(st.u0-z)<1e-9){ reussi(v); v.className='verdict ok'; v.innerHTML='<strong>Juste : avec $u_0='+tx(z)+'$, $f(u_0)=u_0$.</strong><span>La droite de $f$ coupe $y=x$ en ce point : l\'escalier n\'a plus de marche, tous les termes valent $'+tx(z)+'$. On le trouve aussi par le calcul : $'+F().nom.replace(/\$/g,'').replace('x','\\ell')+'=\\ell$.</span>'; maths(v); return; }
    v.className='verdict ko';
    if(Math.abs(st.u0-F().b)<1e-9) v.innerHTML='<strong>$'+tx(F().b)+'$, c\'est l\'ordonnée à l\'origine de $f$.</strong><span>La suite constante se trouve là où la droite de $f$ coupe la droite $y=x$ : $f(u_0)=u_0$.</span>';
    else v.innerHTML='<strong>Ta suite bouge : $u_1='+tx(f(st.u0))+'\\ne u_0$.</strong><span>Cherche le point où la droite de $f$ coupe $y=x$ (le point vert), ou résous $f(\\ell)=\\ell$.</span>';
    maths(v); });
  puces(q('.fonctions'),FONCTIONS.map(F=>F.nom),0,i=>{ st.i=i; st.u0=FONCTIONS[i].u0; st.marches=0; q('.contexte').textContent=FONCTIONS[i].ctx; zoneU0(); releves(); enonce(); T.redessiner(); });
  maths(q('.fonctions'));
  puces(q('.defis'),DEFIS,0,i=>{ st.defi=i; enonce(); });
  puces(q('.choix-limite'),['elle se rapproche du point vert','elle tend vers +∞','elle tend vers −∞','elle est constante'],-1,i=>repondreLimite(i));
  q('.marche').addEventListener('click',()=>{ if(st.marches<12){ st.marches++; releves(); T.redessiner(); } });
  q('.effacer').addEventListener('click',()=>{ st.marches=0; releves(); T.redessiner(); });
  st.u0=F().u0; zoneU0(); releves(); enonce();
}

window.LABOS=window.LABOS||{};
window.LABOS.suites={cible,seuil:seuilLabo,escalier};
})();
