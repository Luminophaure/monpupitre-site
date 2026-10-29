/* =====================================================================
   LABORATOIRES — SUITES : TERME GÉNÉRAL ET SOMMES (terminale technologique)
     tirelire  des versements réguliers qui grossissent : calculer une valeur acquise,
               puis régler le versement qui atteint un objectif
     offres    linéaire ou exponentielle : à partir de quel rang l'une dépasse l'autre,
               et quel taux suffit pour rattraper
     machine   la somme Σ terme à terme, à côté de la boucle Python qui la calcule ;
               ce que renvoie une fonction, et la ligne fausse d'un programme
   Les diagnostics nomment les erreurs de la liste du chapitre (un terme oublié, le dernier
   versement qu'on fait rapporter, le taux pris pour la raison, n termes au lieu de n + 1,
   range(n) qui s'arrête à n − 1, l'accumulateur remis à 0…), proposées au professeur le
   27 octobre 2026, à reprendre d'après ce qu'il observe en classe.
   Les outils généraux sont dans labos/commun.js.
   ===================================================================== */
(function(){
"use strict";
const {maths,css,id,lire,carcasse,reglette,lier,puces,Toile,etiquette,reussi}=window.Labo;
const IND='₀₁₂₃₄₅₆₇₈₉';
const indice=n=>String(n).split('').map(c=>IND[+c]).join('');
/* un nombre lisible : 13 756,66 · 7 · −2,5 (d décimales au plus, zéros inutiles retirés) */
function fmt(v,d){ if(!isFinite(v)) return '—'; d=d==null?2:d; let s=(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).toFixed(d); if(s.includes('.')) s=s.replace(/0+$/,'').replace(/\.$/,'');
  const [e,f]=s.replace('-','').split('.'); return (v<0&&Math.abs(v)>=0.5*Math.pow(10,-d)?'−':'')+e.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(f?','+f:''); }
/* un montant : toujours deux décimales s'il y en a */
function euros(v){ const r=Math.round(v*100)/100; return Number.isInteger(r)?fmt(r,0):fmt(r,2).replace(/,(\d)$/,(m,a)=>','+a+'0'); }
const tx=(v,d)=>fmt(v,d).replace(',','{,}').replace(/ /g,'\\,').replace('−','-');
const proche=(a,b,tol)=>Math.abs(a-b)<=tol;
function pasRond(etendue,n){ const brut=etendue/n, p=Math.pow(10,Math.floor(Math.log10(brut))); return [1,2,5,10].map(k=>k*p).find(k=>k>=brut)||10*p; }
function disque(c,x,y,r,coul,plein){ c.save(); c.beginPath(); c.arc(x,y,r,0,7); if(plein===false){ c.strokeStyle=coul; c.lineWidth=2.5; c.stroke(); } else { c.fillStyle=coul; c.fill(); } c.restore(); }
function losange(c,x,y,r,coul){ c.save(); c.beginPath(); c.moveTo(x,y-r); c.lineTo(x+r,y); c.lineTo(x,y+r); c.lineTo(x-r,y); c.closePath(); c.fillStyle=coul; c.fill(); c.restore(); }
/* un repère pour des valeurs positives : graduations rondes, axe des n en bas */
function repere(c,W,H,nmax,ymin,ymax,o){ o=o||{};
  const g=o.gauche||58,dr=16,h=o.haut||18,b=30; const X=n=>g+10+n/nmax*(W-g-dr-10), Y=v=>H-b-(v-ymin)/(ymax-ymin)*(H-b-h);
  const muted=css('--muted'), grid=css('--grid');
  c.save(); c.lineWidth=1; c.strokeStyle=grid; const py=pasRond(ymax-ymin,5);
  for(let v=Math.ceil(ymin/py)*py;v<=ymax+1e-9;v+=py){ c.beginPath(); c.moveTo(g,Y(v)); c.lineTo(W-dr,Y(v)); c.stroke(); etiquette(c,fmt(v,0),g-6,Y(v),muted,{align:'right',taille:11,gras:false}); }
  const px=pasRond(nmax,10); for(let n=0;n<=nmax;n+=px) etiquette(c,String(n),X(n),H-b+14,muted,{align:'center',taille:11,gras:false});
  c.strokeStyle=muted; c.lineWidth=1.5; c.beginPath(); c.moveTo(g,H-b); c.lineTo(W-dr,H-b); c.moveTo(g,h); c.lineTo(g,H-b); c.stroke(); c.restore();
  etiquette(c,'n',W-dr,H-b-12,muted,{align:'right',taille:12});
  return {X,Y};
}
const verdict=(v,classe,html)=>{ v.className='verdict '+classe; v.innerHTML=html; maths(v); };

/* =================================================================
   1. LA TIRELIRE QUI GROSSIT
   ================================================================= */
const valeur=(V,t,n)=>{ const q=1+t/100; return t===0?n*V:V*(Math.pow(q,n)-1)/(q-1); };
const SCENARIOS=[
  {V:1200,t:3,n:10,per:'année',texte:'Lina verse 1 200 € chaque 1<sup>er</sup> janvier sur un plan d\'épargne à 3 % par an.'},
  {V:600,t:2.5,n:8,per:'année',texte:'Tom verse 600 € chaque 1<sup>er</sup> janvier sur un livret à 2,5 % par an.'},
  {V:250,t:0.5,n:12,per:'mois',texte:'Une association met de côté 250 € au début de chaque mois, sur un compte à 0,5 % par mois.'},
  {V:2000,t:2,n:5,per:'année',texte:'Une PME verse 2 000 € au début de chaque année sur un compte rémunéré à 2 % par an.'},
  {V:400,t:1,n:8,per:'trimestre',texte:'Un club sportif verse 400 € au début de chaque trimestre, à 1 % par trimestre.'},
  {V:150,t:0.5,n:24,per:'mois',texte:'Sami verse 150 € au début de chaque mois, à 0,5 % par mois.'},
  {V:1000,t:4,n:15,per:'année',texte:'Une famille verse 1 000 € au début de chaque année sur un placement à 4 % par an.'},
  {V:1200,t:3,n:10,per:'année',apres:true,texte:'Lina verse 1 200 € chaque 1<sup>er</sup> janvier sur un plan à 3 % par an. Après son 10<sup>e</sup> versement, elle arrête.'},
  {V:500,t:2,n:6,per:'année',apres:true,texte:'Une entreprise verse 500 € au début de chaque année, à 2 % par an. Après le 6<sup>e</sup> versement, elle arrête.'},
];
const OBJECTIFS=[
  {X:10000,t:2,n:8,texte:'Avoir 10 000 € juste après le 8<sup>e</sup> versement annuel, sur un livret à 2 % par an.'},
  {X:5000,t:3,n:4,texte:'Réunir 5 000 € juste après le 4<sup>e</sup> versement annuel, à 3 % par an.'},
  {X:3000,t:1,n:12,texte:'Épargner 3 000 € en 12 versements mensuels, à 1 % par mois : la somme doit être là juste après le 12<sup>e</sup>.'},
  {X:20000,t:2.5,n:10,texte:'Disposer de 20 000 € juste après le 10<sup>e</sup> versement annuel, à 2,5 % par an.'},
  {X:12000,t:4,n:6,texte:'Financer une machine de 12 000 €, payée juste après le 6<sup>e</sup> versement annuel, à 4 % par an.'},
];
function tirelire(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'La tirelire qui grossit',
    intro:'On verse la même somme $V$ au début de chaque période, à intérêts composés. Chaque barre est un versement : en bas ce qui a été versé, au-dessus ce qu\'il a rapporté jusqu\'à la date choisie. Explore, puis relève les deux défis : calculer une valeur acquise, puis trouver le versement qui atteint un objectif.',
    gauche:'<canvas class="large" role="img" aria-label="Un diagramme en barres : une barre par versement, la partie versée et la partie des intérêts."></canvas><p class="discret lecture-barre"></p>'});
  d.innerHTML='<div class="champ"><span class="etiq">Que veux-tu faire ?</span><div class="puces modes"></div></div>'+
    '<p class="enonce-defi"></p>'+
    '<div class="zone-reglettes"></div>'+
    '<div class="pile"><label class="case"><input type="checkbox" class="plus-tard"><span>Regarder une période après le dernier versement, sans nouveau versement</span></label></div>'+
    '<div class="releves"></div>'+
    '<div class="champ saisie-defi" hidden><label for="'+u+'rep">Ta réponse : la valeur acquise, en €</label><div class="ligne"><input type="text" id="'+u+'rep" inputmode="decimal" autocomplete="off"><button type="button" class="btn valider">Vérifier</button></div></div>'+
    '<div class="ligne boutons-defi" hidden><button type="button" class="btn verifier-objectif">Vérifier mon versement</button><button type="button" class="btn fantome autre">Autre défi</button></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={mode:0,V:1200,t:3,n:10,plusTard:false,i:-1,j:-1,resolu:false};
  const cv=g.querySelector('canvas');
  const coef=()=>1+st.t/100;
  const acquise=()=>valeur(st.V,st.t,st.n)*(st.plusTard?coef():1);
  const cache=()=>st.mode===1&&!st.resolu;
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const qq=coef(), n=st.n, ink=css('--ink'), muted=css('--muted');
    const barres=[]; for(let k=1;k<=n;k++) barres.push(st.V*Math.pow(qq,n-k+(st.plusTard?1:0)));
    const haut=Math.max(...barres)*1.18;
    const g0=58,dr=12,h0=54,b=30; const Y=v=>H-b-v/haut*(H-b-h0); const larg=(W-g0-dr)/n; const X=k=>g0+(k-1)*larg;
    c.save(); c.lineWidth=1; c.strokeStyle=css('--grid'); const p=pasRond(haut,5);
    for(let v=0;v<=haut;v+=p){ c.beginPath(); c.moveTo(g0,Y(v)); c.lineTo(W-dr,Y(v)); c.stroke(); etiquette(c,fmt(v,0),g0-6,Y(v),muted,{align:'right',taille:11,gras:false}); }
    c.restore();
    const cV=css('--mc'), cI=css('--ok');
    barres.forEach((v,j)=>{ const k=j+1, x=X(k)+larg*0.12, w=larg*0.76;
      c.fillStyle=cV; c.fillRect(x,Y(st.V),w,Y(0)-Y(st.V));
      if(v>st.V+1e-9){ c.fillStyle=cI; c.fillRect(x,Y(v),w,Y(st.V)-Y(v)); }
      const pas=n<=12?1:n<=24?2:5; if(k===1||k===n||k%pas===0) etiquette(c,String(k),x+w/2,H-b+14,muted,{align:'center',taille:11,gras:false}); });
    c.save(); c.strokeStyle=muted; c.lineWidth=1.5; c.beginPath(); c.moveTo(g0,Y(0)); c.lineTo(W-dr,Y(0)); c.stroke(); c.restore();
    etiquette(c,'versement n°',W-dr,H-6,muted,{align:'right',taille:11,gras:false});
    // la légende et le total
    c.fillStyle=cV; c.fillRect(g0,10,12,12); etiquette(c,'versé',g0+17,16,ink,{taille:12,gras:false});
    c.fillStyle=cI; c.fillRect(g0+70,10,12,12); etiquette(c,'intérêts',g0+87,16,ink,{taille:12,gras:false});
    etiquette(c,(st.plusTard?'une période après : ':'juste après le '+n+(n===1?'ᵉʳ':'ᵉ')+' : ')+(cache()?'? €':euros(acquise())+' €'),W-dr,16,ink,{align:'right',taille:13});
    if(!st.plusTard){ const xd=X(n)+larg/2; etiquette(c,'dernier versement : pas encore d\'intérêts',W-dr,36,muted,{align:'right',taille:11,gras:false});
      c.save(); c.strokeStyle=muted; c.lineWidth=1; c.setLineDash([3,3]); c.beginPath(); c.moveTo(xd,44); c.lineTo(xd,Y(barres[n-1])-4); c.stroke(); c.restore(); }
  });
  function reglettes(){
    const objectif=st.mode===2;
    q('.zone-reglettes').innerHTML=reglette(u,'V','Versement V (€)',objectif?10:50,objectif?3000:2000,objectif?10:50,st.V)+
      reglette(u,'t','Taux par période (%)',0,8,0.5,st.t)+reglette(u,'n','Nombre de versements n',1,30,1,st.n);
    lier(q('.zone-reglettes'),st,{V:v=>fmt(v,0)+' €',t:v=>fmt(v,1)+' %',n:v=>String(v)},()=>{ if(st.mode===2) q('.verdict').className='verdict info'; releves(); T.redessiner(); });
    q('.zone-reglettes').querySelectorAll('input').forEach(r=>{ r.disabled= st.mode===1 || (st.mode===2&&r.dataset.r!=='V'); });
  }
  function releves(){ const A=acquise(), tot=st.n*st.V;
    q('.releves').innerHTML='<span>Raison q = 1 + t/100</span><b>'+fmt(coef(),4)+'</b><span>Total versé n × V</span><b>'+euros(tot)+' €</b>'+
      '<span>Valeur acquise</span><b>'+(cache()?'?':euros(A)+' €')+'</b><span>Dont intérêts</span><b>'+(cache()?'?':euros(A-tot)+' €')+'</b>';
    g.querySelector('.lecture-barre').innerHTML= cache()?'':st.t===0?'Sans intérêts, chaque barre reste égale à V : la valeur acquise est n × V.':
      'Le 1<sup>er</sup> versement vaut '+euros(st.V*Math.pow(coef(),st.n-1+(st.plusTard?1:0)))+' € : il a rapporté pendant '+(st.n-1+(st.plusTard?1:0))+' période'+((st.n-1+(st.plusTard?1:0))>1?'s':'')+'. Le dernier vaut '+euros(st.V*(st.plusTard?coef():1))+' €.'; }
  function mode(m){ st.mode=m; st.resolu=false; q('.saisie-defi').hidden=m!==1; q('.boutons-defi').hidden=m===0; q('.verifier-objectif').hidden=m!==2;
    q('.plus-tard').disabled=m!==0; q('#'+u+'rep').value='';
    if(m===0){ q('.enonce-defi').innerHTML=''; verdict(q('.verdict'),'info','<span>Fais varier le versement, le taux et le nombre de versements. Regarde surtout la dernière barre : le versement qu\'on vient de faire n\'a encore rien rapporté. Puis coche « une période après » : tout grossit encore d\'un cran.</span>'); }
    else nouveau();
    reglettes(); releves(); T.redessiner(); }
  function nouveau(){ const v=q('.verdict'); st.resolu=false; q('#'+u+'rep').value='';
    if(st.mode===1){ let i; do{ i=Math.floor(Math.random()*SCENARIOS.length); }while(i===st.i&&SCENARIOS.length>1); st.i=i; const S=SCENARIOS[i];
      Object.assign(st,{V:S.V,t:S.t,n:S.n,plusTard:!!S.apres}); q('.plus-tard').checked=!!S.apres;
      q('.enonce-defi').innerHTML='<strong>Défi.</strong> '+S.texte+' '+(S.apres?'Que vaut son placement une '+S.per+' après le '+S.n+'<sup>e</sup> versement ?':'Que vaut son placement juste après le '+S.n+'<sup>e</sup> versement ?')+' <span class="discret">Calculatrice permise.</span>';
      verdict(v,'info','<span>Le graphique montre les barres, mais pas leur total. Combien de termes ? Quel est le premier ? le dernier ?</span>'); }
    else { let j; do{ j=Math.floor(Math.random()*OBJECTIFS.length); }while(j===st.j&&OBJECTIFS.length>1); st.j=j; const O=OBJECTIFS[j];
      Object.assign(st,{V:10,t:O.t,n:O.n,plusTard:false}); q('.plus-tard').checked=false;
      q('.enonce-defi').innerHTML='<strong>Défi.</strong> '+O.texte+' Règle le versement $V$ <strong>au plus juste</strong> : le plus petit, par pas de 10 €, qui atteint '+fmt(O.X,0)+' €.';
      verdict(v,'info','<span>Fais glisser le versement, ou calcule-le : $V\\times\\dfrac{q^n-1}{q-1}$ doit atteindre l\'objectif.</span>'); }
    maths(q('.enonce-defi')); reglettes(); releves(); T.redessiner(); }
  /* défi 1 : la valeur acquise tapée */
  q('.valider').addEventListener('click',()=>{ const v=q('.verdict'), S=SCENARIOS[st.i]; if(!S) return; const rep=lire(q('#'+u+'rep').value);
    if(!isFinite(rep)){ verdict(v,'info','<span>Écris un nombre, en euros : par exemple 1 234,56.</span>'); return; }
    const qq=1+S.t/100, p=S.t/100, n=S.n, V=S.V, apres=!!S.apres, fin=apres?qq:1;
    const A=valeur(V,S.t,n)*fin, tol=Math.max(0.6,A*2e-4), est=x=>proche(rep,x,Math.max(tol,Math.abs(x)*2e-4));
    if(est(A)){ st.resolu=true; reussi(v); releves(); T.redessiner();
      verdict(v,'ok','<strong>Juste : '+euros(A)+' €.</strong><span>'+n+' versements, donc '+n+' termes, du dernier ($'+tx(V)+'$) au premier ($'+tx(V)+'\\times'+tx(qq,4)+'^{'+(n-1)+'}$) : $'+tx(V)+'\\times\\dfrac{'+tx(qq,4)+'^{'+n+'}-1}{'+tx(p,4)+'}\\approx'+tx(valeur(V,S.t,n))+'$'+(apres?', puis une '+S.per+' de plus : $\\times'+tx(qq,4)+'$.':'.')+' Les intérêts valent '+euros(A-n*V)+' €.</span>'); return; }
    let m='';
    if(est(apres?valeur(V,S.t,n):valeur(V,S.t,n)*qq)) m= apres?'<strong>C\'est la valeur juste après le dernier versement.</strong><span>Mais l\'énoncé demande une '+S.per+' plus tard : cette fois, même le dernier versement a rapporté. Multiplie encore par $q='+tx(qq,4)+'$.</span>'
      :'<strong>Tu as fait rapporter le dernier versement.</strong><span>Il vient d\'être fait : il vaut '+euros(V)+' €, pas $'+tx(V)+'\\times'+tx(qq,4)+'$. Ton résultat est la valeur une '+S.per+' plus tard. Le premier terme de la somme est $V$.</span>';
    else if(est(valeur(V,S.t,n-1)*fin)) m='<strong>Un versement oublié : tu as additionné '+(n-1)+' termes.</strong><span>Il y a '+n+' versements, donc '+n+' termes : de $V$ (le dernier) à $V\\times q^{'+(n-1)+'}$ (le premier). L\'exposant de la formule est le nombre de termes, '+n+'.</span>';
    else if(est(valeur(V,S.t,n+1)*fin)) m='<strong>Un versement de trop : tu as additionné '+(n+1)+' termes.</strong><span>Compte-les : un terme par versement, et il y en a '+n+'.</span>';
    else if(!apres&&est(valeur(V,S.t,n-1)*qq)) m='<strong>Deux décalages à la fois.</strong><span>Tu as commencé à $V\\times q$, comme si le dernier versement avait déjà rapporté, et tu n\'as compté que '+(n-1)+' termes. Le dernier versement vaut $V$, et il y a '+n+' termes.</span>';
    else if(est(n*V)) m='<strong>C\'est ce qui a été versé : $'+n+'\\times'+tx(V)+'$.</strong><span>Il manque les intérêts. Chaque versement a grossi, sauf le dernier : le premier vaut $V\\times q^{'+(n-1)+'}$.</span>';
    else if(est(n*V+V*p*n*(n-1)/2*(apres?1:1))||est((n*V+V*p*n*(n-1)/2)*fin)) m='<strong>Tu as calculé des intérêts simples.</strong><span>Tu as compté '+fmt(S.t,1)+' % de '+euros(V)+' € pour chaque période. Mais les intérêts rapportent à leur tour : chaque versement est multiplié par $q$ à chaque période. C\'est une somme géométrique.</span>';
    else if(est(V*(1-Math.pow(p,n))/(1-p)*fin)||est(V*(Math.pow(p,n)-1)/(p-1)*fin)) m='<strong>$q='+tx(p,4)+'$ : tu as pris le taux pour la raison.</strong><span>Augmenter de '+fmt(S.t,1)+' %, c\'est multiplier par $1+\\dfrac{'+fmt(S.t,1).replace(',','{,}')+'}{100}='+tx(qq,4)+'$. Avec $'+tx(p,4)+'$, chaque versement fondrait au lieu de grossir.</span>';
    else if(est(V*Math.pow(qq,n)*fin)||est(V*Math.pow(qq,n-1)*fin)) m='<strong>C\'est comme si tu n\'avais versé qu\'une seule fois.</strong><span>$V\\times q^n$ est la valeur d\'un seul versement. Ici, il y en a '+n+' : il faut additionner leurs valeurs, une par versement.</span>';
    else m='<strong>Pas tout à fait : tu es à '+euros(rep)+' €.</strong><span>Compte d\'abord ce qui a été versé, '+euros(n*V)+' € : la réponse est un peu au-dessus. Puis écris la somme : $V+V\\,q+\\dots+V\\,q^{'+(n-1)+'}$.</span>';
    verdict(v,'ko',m); });
  /* défi 2 : le versement au plus juste */
  q('.verifier-objectif').addEventListener('click',()=>{ const v=q('.verdict'), O=OBJECTIFS[st.j]; if(!O) return; const qq=1+O.t/100, F=(Math.pow(qq,O.n)-1)/(qq-1);
    const Vmin=O.X/F, cible=Math.ceil(Vmin/10-1e-9)*10, A=st.V*F;
    if(st.V===cible){ st.resolu=true; reussi(v); verdict(v,'ok','<strong>Au plus juste : '+fmt(st.V,0)+' € par versement.</strong><span>Avec '+fmt(st.V,0)+' €, on atteint '+euros(A)+' € ; avec '+fmt(st.V-10,0)+' €, seulement '+euros((st.V-10)*F)+' €. Par le calcul : $V\\times'+tx(F,4)+'\\ge'+tx(O.X,0)+'$ donne $V\\ge'+tx(Vmin)+'$. Sans les intérêts, il aurait fallu verser '+euros(O.X/O.n)+' € à chaque fois.</span>'); return; }
    let m='';
    if(Math.abs(st.V-O.X/O.n)<=10) m='<strong>Tu as divisé l\'objectif par '+O.n+'.</strong><span>C\'est ce qu\'il faudrait verser sans aucun intérêt. Mais les intérêts font une partie du chemin : avec '+fmt(st.V,0)+' €, tu arrives à '+euros(A)+' €, plus que nécessaire. Tu peux verser moins.</span>';
    else if(A<O.X&&Math.abs(st.V-Math.ceil(O.X/(F*qq)/10-1e-9)*10)<=0.5) m='<strong>Il manque '+euros(O.X-A)+' €.</strong><span>Tu sembles avoir fait rapporter le dernier versement. Juste après le '+O.n+'<sup>e</sup>, il n\'a encore rien rapporté : la valeur acquise est $V\\times\\dfrac{q^n-1}{q-1}$, sans facteur $q$ en plus.</span>';
    else if(A<O.X) m='<strong>Il manque '+euros(O.X-A)+' € : l\'objectif n\'est pas atteint.</strong><span>Augmente le versement.</span>';
    else if(Math.abs(st.V-Math.ceil(O.X*(qq-1)/(Math.pow(qq,O.n-1)-1)/10-1e-9)*10)<=0.5) m='<strong>Objectif atteint, mais tu verses trop.</strong><span>Tu sembles avoir compté '+(O.n-1)+' versements : il y en a '+O.n+', donc '+O.n+' termes dans la somme. Avec moins, tu y arrives aussi.</span>';
    else m='<strong>Objectif atteint ('+euros(A)+' €), mais pas au plus juste.</strong><span>Avec '+fmt(st.V-10,0)+' €, tu aurais '+euros((st.V-10)*F)+' € : '+((st.V-10)*F>=O.X?'c\'est encore assez. Baisse le versement.':'ce ne serait plus assez… Vérifie : c\'est que tu y es presque.')+'</span>';
    verdict(v,'ko',m); });
  q('.autre').addEventListener('click',nouveau);
  q('.plus-tard').addEventListener('change',e=>{ st.plusTard=e.target.checked; releves(); T.redessiner();
    verdict(q('.verdict'),'info','<span>'+(st.plusTard?'Une période plus tard, sans nouveau versement : chaque barre est multipliée par $q$, y compris la dernière. La valeur acquise aussi : $\\times'+tx(coef(),4)+'$.':'Juste après le dernier versement : la dernière barre n\'a pas encore d\'intérêts.')+'</span>'); });
  puces(q('.modes'),['Explorer','Calculer une valeur acquise','Atteindre un objectif'],0,mode);
  mode(0);
}

/* =================================================================
   2. LINÉAIRE OU EXPONENTIELLE ?
   ================================================================= */
const DUELS=[
  {A0:30000,a:1000,B0:28000,t:4,unite:'€',texte:'Deux offres d\'emploi. A : 30 000 € la première année ($n=0$), puis 1 000 € de plus chaque année. B : 28 000 €, puis une hausse de 4 % par an.'},
  {A0:5000,a:200,B0:5000,t:3.5,unite:'€',texte:'5 000 € placés de deux façons. A : intérêts simples, 200 € par an (4 % de 5 000 €, toujours). B : intérêts composés à 3,5 % par an.'},
  {A0:12000,a:200,B0:10000,t:3,unite:'habitants',texte:'Deux villes voisines. A : 12 000 habitants, 200 de plus chaque année. B : 10 000 habitants, puis +3 % par an.'},
  {A0:2000,a:100,B0:1500,t:6,unite:'unités',texte:'Les ventes mensuelles de deux produits. A : 2 000 unités, puis 100 de plus chaque mois. B : 1 500 unités, puis +6 % par mois.'},
  {A0:32000,a:1200,B0:28000,t:5,unite:'€',texte:'Deux contrats de commerciale. A : 32 000 € la première année ($n=0$), puis 1 200 € de plus par an. B : 28 000 €, puis +5 % par an.'},
];
const BUTS=[20,10,6,5,3];   // « B doit dépasser A au plus tard au rang … »
function croisement(A0,a,B0,t){ if(B0>A0) return 0; for(let n=0;n<=400;n++){ if(B0*Math.pow(1+t/100,n)>A0+a*n) return n; } return null; }
function offres(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Linéaire ou exponentielle ?',
    intro:'L\'offre A ajoute toujours la même quantité : $A_n=A_0+a\\,n$, des points alignés. L\'offre B augmente toujours du même pourcentage : $B_n=B_0\\times q^n$, des points qui se cambrent. Même partie plus bas, B finit par passer devant. À partir de quel rang ?',
    gauche:'<canvas class="large" role="img" aria-label="Deux nuages de points : l\'offre A, des disques alignés, et l\'offre B, des losanges qui se cambrent."></canvas><p class="discret lecture-offres"></p>'});
  d.innerHTML='<div class="champ"><span class="etiq">Que veux-tu faire ?</span><div class="puces modes"></div></div>'+
    '<p class="enonce-defi"></p>'+
    '<div class="zone-reglettes"></div>'+
    '<div class="releves"></div>'+
    '<div class="ligne montrer" hidden><button type="button" class="btn fantome rang-plus">Afficher un rang de plus</button><button type="button" class="btn fantome cacher">Cacher</button></div>'+
    '<div class="champ saisie-defi" hidden><label for="'+u+'rep">Ta réponse : le premier rang $n$ où B dépasse A</label><div class="ligne"><input type="text" id="'+u+'rep" inputmode="numeric" autocomplete="off"><button type="button" class="btn valider">Vérifier</button></div></div>'+
    '<div class="ligne boutons-defi" hidden><button type="button" class="btn verifier-taux">Vérifier mon taux</button><button type="button" class="btn fantome autre">Autre défi</button></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={mode:0,A0:30000,a:1000,B0:28000,t:4,vus:2,i:-1,but:-1,resolu:false};
  const cv=g.querySelector('canvas');
  const A=n=>st.A0+st.a*n, B=n=>st.B0*Math.pow(1+st.t/100,n);
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H);
    const N=croisement(st.A0,st.a,st.B0,st.t); const nmax= st.mode===1 ? Math.max(12,Math.min(40,(N==null?20:N)+4)) : Math.max(10,Math.min(40,N==null?20:N+4));
    const montres= st.mode===1&&!st.resolu ? Math.min(st.vus,nmax) : nmax;
    let hi=0,lo=Infinity; for(let n=0;n<=nmax;n++){ hi=Math.max(hi,A(n),B(n)); lo=Math.min(lo,A(n),B(n)); }
    const ymin=Math.max(0,lo-(hi-lo)*0.12), R=repere(c,W,H,nmax,ymin,hi*1.04+1,{haut:28});
    if(N!=null&&N>0&&(st.mode!==1||st.resolu)){ c.save(); c.setLineDash([5,5]); c.strokeStyle=css('--muted'); c.lineWidth=1.5; c.beginPath(); c.moveTo(R.X(N),R.Y(ymin)); c.lineTo(R.X(N),28); c.stroke(); c.restore();
      etiquette(c,'rang '+N,R.X(N)+4,36,css('--ink'),{taille:12}); }
    for(let n=0;n<=montres;n++){ disque(c,R.X(n),R.Y(A(n)),4.5,css('--mc')); losange(c,R.X(n),R.Y(B(n)),6,css('--pink')); }
    disque(c,70,12,4.5,css('--mc')); etiquette(c,'A, linéaire',80,12,css('--ink'),{taille:12,gras:false});
    losange(c,180,12,6,css('--pink')); etiquette(c,'B, exponentielle',190,12,css('--ink'),{taille:12,gras:false});
  });
  function reglettes(){ const z=q('.zone-reglettes');
    if(st.mode===1){ z.innerHTML=''; return; }
    z.innerHTML=(st.mode===0?reglette(u,'A0','A₀ : départ de A',0,50000,500,st.A0)+reglette(u,'a','a : ce que A ajoute par rang',0,3000,50,st.a)+reglette(u,'B0','B₀ : départ de B',0,50000,500,st.B0):'')+reglette(u,'t','t : le pourcentage de B (%)',0,10,0.5,st.t);
    lier(z,st,{A0:v=>fmt(v,0),a:v=>fmt(v,0),B0:v=>fmt(v,0),t:v=>fmt(v,1)+' %'},()=>{ if(st.mode===0) commenter(); else q('.verdict').className='verdict info'; releves(); T.redessiner(); }); }
  function releves(){ const N=croisement(st.A0,st.a,st.B0,st.t); const voir=st.mode!==1||st.resolu;
    q('.releves').innerHTML='<span>Offre A</span><b>$A_n='+tx(st.A0,0)+(st.a?'+'+tx(st.a,0)+'\\,n':'')+'$</b><span>Offre B</span><b>$B_n='+tx(st.B0,0)+'\\times'+tx(1+st.t/100,4)+'^n$</b>'+
      (st.mode===1&&!st.resolu?'<span>Rang affiché</span><b>'+st.vus+' : $A_{'+st.vus+'}='+tx(A(st.vus))+'$ et $B_{'+st.vus+'}\\approx'+tx(B(st.vus))+'$</b>':'')+
      '<span>B dépasse A</span><b>'+(!voir?'?':N==null?'jamais (sur 400 rangs)':N===0?'dès le départ':'à partir du rang '+N)+'</b>';
    maths(q('.releves')); }
  function commenter(){ const N=croisement(st.A0,st.a,st.B0,st.t), v=q('.verdict');
    const m= st.t===0?'Avec $t=0$, B est constante : elle ne rattrape jamais A'+(st.a>0?', qui grandit.':'.')
      : N===0?'B part devant : rien à rattraper. Baisse $B_0$ pour voir la course.'
      : N==null?'B finira par passer devant, mais au-delà de 400 rangs : augmente le pourcentage.'
      : 'B passe devant au rang '+N+'. Au premier rang, A gagne '+fmt(st.a,0)+' et B '+fmt(st.B0*st.t/100,0)+(st.B0*st.t/100<st.a?' seulement':'')+' ; mais les gains de B grossissent à chaque rang, ceux de A jamais'+(st.B0*st.t/100>=st.a?'. B part plus bas : il lui faut du temps pour combler l\'écart.':'.');
    verdict(v,'info','<span>'+m+'</span>'); }
  function mode(m){ st.mode=m; st.resolu=false; q('.montrer').hidden=m!==1; q('.saisie-defi').hidden=m!==1; q('.boutons-defi').hidden=m===0; q('.verifier-taux').hidden=m!==2; q('#'+u+'rep').value='';
    if(m===0){ q('.enonce-defi').innerHTML=''; reglettes(); releves(); commenter(); T.redessiner(); } else nouveau(); }
  function nouveau(){ const v=q('.verdict'); st.resolu=false; q('#'+u+'rep').value='';
    if(st.mode===1){ let i; do{ i=Math.floor(Math.random()*DUELS.length); }while(i===st.i); st.i=i; const D=DUELS[i]; Object.assign(st,{A0:D.A0,a:D.a,B0:D.B0,t:D.t,vus:2});
      q('.enonce-defi').innerHTML='<strong>Défi.</strong> '+D.texte+' À partir de quel rang $n$ B dépasse-t-elle A ? <span class="discret">Tu peux afficher les rangs un par un, comme un tableau de valeurs.</span>';
      verdict(v,'info','<span>Écris d\'abord $A_n$ et $B_n$. Puis compare-les rang par rang : c\'est le premier rang où $B_n&gt;A_n$ qui compte.</span>'); }
    else { let b; do{ b=Math.floor(Math.random()*BUTS.length); }while(b===st.but); st.but=b; Object.assign(st,{A0:30000,a:1000,B0:28000,t:0.5});
      q('.enonce-defi').innerHTML='<strong>Défi.</strong> A : 30 000 € puis 1 000 € de plus par an. B part de 28 000 €. Règle le <strong>plus petit</strong> pourcentage $t$ (par pas de 0,5) pour que B dépasse A <strong>au plus tard au rang '+BUTS[b]+'</strong>.';
      verdict(v,'info','<span>Augmente $t$ et regarde où le rang de croisement tombe. Un demi-point de pourcentage change beaucoup de choses.</span>'); }
    maths(q('.enonce-defi')); reglettes(); releves(); T.redessiner(); }
  q('.rang-plus').addEventListener('click',()=>{ if(st.vus<40){ st.vus++; releves(); T.redessiner(); } });
  q('.cacher').addEventListener('click',()=>{ st.vus=2; releves(); T.redessiner(); });
  q('.valider').addEventListener('click',()=>{ const v=q('.verdict'), D=DUELS[st.i]; if(!D) return; const rep=lire(q('#'+u+'rep').value); const N=croisement(D.A0,D.a,D.B0,D.t);
    if(!isFinite(rep)){ verdict(v,'info','<span>Écris un nombre entier : le rang.</span>'); return; }
    const An=n=>D.A0+D.a*n, Bn=n=>D.B0*Math.pow(1+D.t/100,n);
    if(rep===N){ st.resolu=true; reussi(v); releves(); T.redessiner(); verdict(v,'ok','<strong>Juste : au rang '+N+'.</strong><span>$A_{'+(N-1)+'}='+tx(An(N-1))+'$ et $B_{'+(N-1)+'}\\approx'+tx(Bn(N-1))+'$ : A est encore devant. $A_{'+N+'}='+tx(An(N))+'$ et $B_{'+N+'}\\approx'+tx(Bn(N))+'$ : B est passée devant, et elle y restera.</span>'); return; }
    let m='';
    if(rep===N-1) m='<strong>Un rang trop tôt.</strong><span>Au rang '+(N-1)+', $A='+tx(An(N-1))+'$ et $B\\approx'+tx(Bn(N-1))+'$ : A est encore devant. On cherche le premier rang où B dépasse A.</span>';
    else if(rep===N+1) m='<strong>Un rang trop tard.</strong><span>Au rang '+N+', B est déjà devant : $B_{'+N+'}\\approx'+tx(Bn(N))+'$ contre $A_{'+N+'}='+tx(An(N))+'$.</span>';
    else if(rep>=2000&&rep<=2100) m='<strong>C\'est une année, pas un rang.</strong><span>On demande le rang $n$, compté à partir de 0.</span>';
    else if(rep>=100&&(proche(rep,An(N),Math.abs(An(N))*0.02+1)||proche(rep,Bn(N),Math.abs(Bn(N))*0.02+1))) m='<strong>C\'est une valeur, pas un rang.</strong><span>On demande $n$, le numéro du rang, pas la valeur de $A_n$ ou de $B_n$.</span>';
    else { const lin=croisement(D.A0,D.a,D.B0,0)===null?(()=>{ for(let n=0;n<=400;n++){ if(D.B0+D.B0*D.t/100*n>An(n)) return n; } return null; })():null;
      if(lin!=null&&rep===lin) m='<strong>Tu as fait de B une suite arithmétique.</strong><span>Tu as ajouté chaque fois '+fmt(D.t,1)+' % de $B_0$, soit '+fmt(D.B0*D.t/100,0)+'. Mais le pourcentage s\'applique à une valeur qui grandit : B est multipliée par $'+tx(1+D.t/100,4)+'$ à chaque rang, et passe devant bien plus tôt.</span>';
      else if(rep<N){ m='<strong>Trop tôt.</strong><span>Au rang '+rep+', $A='+tx(An(rep))+'$ et $B\\approx'+tx(Bn(Math.max(0,rep)))+'$ : A est encore devant. Affiche les rangs suivants.</span>'; }
      else m='<strong>Trop tard.</strong><span>B passe devant avant le rang '+rep+'. Affiche les rangs un par un, ou calcule $B_n$ à la calculatrice.</span>'; }
    verdict(v,'ko',m); });
  q('.verifier-taux').addEventListener('click',()=>{ const v=q('.verdict'), but=BUTS[st.but]; if(but==null) return; const N=croisement(st.A0,st.a,st.B0,st.t), Nm=croisement(st.A0,st.a,st.B0,st.t-0.5);
    if(N!=null&&N<=but&&!(st.t-0.5>0&&Nm!=null&&Nm<=but)){ st.resolu=true; reussi(v); verdict(v,'ok','<strong>Juste : $t='+tx(st.t,1)+'$ %.</strong><span>B passe devant au rang '+N+'. Avec '+fmt(st.t-0.5,1)+' %, il faudrait attendre '+(Nm==null?'plus de 400 rangs':'le rang '+Nm)+'. Un demi-point de pourcentage, et le croisement recule de '+(Nm==null?'beaucoup':(Nm-N)+' rang'+(Nm-N>1?'s':''))+' : c\'est la sensibilité de l\'exponentielle.</span>'); return; }
    if(N==null||N>but) verdict(v,'ko','<strong>Trop faible : B ne passe devant '+(N==null?'qu\'au-delà de 400 rangs':'qu\'au rang '+N)+'.</strong><span>Il faut qu\'elle dépasse A au plus tard au rang '+but+'. Augmente le pourcentage.</span>');
    else verdict(v,'ko','<strong>Ça marche, mais tu peux faire moins.</strong><span>Avec '+fmt(st.t-0.5,1)+' %, B passe déjà devant au rang '+Nm+', avant le rang '+but+'. On cherche le plus petit pourcentage qui suffit.</span>'); });
  q('.autre').addEventListener('click',nouveau);
  puces(q('.modes'),['Explorer','Le croisement','Le bon pourcentage'],0,mode);
  mode(0);
}

/* =================================================================
   3. LA MACHINE À SOMMER
   ================================================================= */
const TERMES=[
  {nom:'k',tex:'k',py:'k',f:k=>k},
  {nom:'k²',tex:'k^2',py:'k**2',f:k=>k*k},
  {nom:'k³',tex:'k^3',py:'k**3',f:k=>k*k*k},
  {nom:'1/k',tex:'\\frac1k',py:'1 / k',f:k=>1/k,frac:true},
  {nom:'2k + 1',tex:'(2k+1)',py:'2*k + 1',f:k=>2*k+1},
  {nom:'3 × 2ᵏ',tex:'3\\times2^k',py:'3 * 2**k',f:k=>3*Math.pow(2,k)},
];
const valTerme=(T,k)=>T.frac?(k===0?NaN:1/k):T.f(k);
const ecrireTerme=(T,k)=>T.frac?(k===1?'1':'\\frac1{'+k+'}'):tx(T.f(k),0);
const somme=(T,p,n)=>{ let s=0; for(let k=p;k<=n;k++) s+=valTerme(T,k); return s; };
function code(lignes,actives){ return lignes.map((l,i)=>'<span class="code-ligne'+((actives||[]).includes(i)?' ligne-active':'')+'">'+l.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span>').join('\n'); }
/* les programmes faux : ce que la fonction devait calculer, ses lignes, la ligne fausse (index),
   le rôle de cette ligne, ce que la fonction renvoie pour n = 3, et l'explication */
const BUGS=[
  {tex:'\\sum_{k=1}^{n}k^2',lignes:['def somme(n):','    s = 1','    for k in range(1, n + 1):','        s = s + k**2','    return s'],faute:1,role:'l\'initialisation',renvoie:'15',attendu:'14',
    dire:'L\'accumulateur doit partir de 0 : avec <code>s = 1</code>, tout le total est faussé de 1.'},
  {tex:'\\sum_{k=1}^{n}k^2',lignes:['def somme(n):','    s = 0','    for k in range(n):','        s = s + k**2','    return s'],faute:2,role:'le compteur',renvoie:'5',attendu:'14',
    dire:'<code>range(n)</code> donne $k=0,1,\\dots,n-1$ : le dernier terme, $n^2$, n\'est jamais ajouté. Il faut <code>range(1, n + 1)</code>.'},
  {tex:'\\sum_{k=1}^{n}k^2',lignes:['def somme(n):','    s = 0','    for k in range(1, n + 1):','        s = k**2','    return s'],faute:3,role:'l\'accumulateur',renvoie:'9',attendu:'14',
    dire:'<code>s = k**2</code> remplace le total au lieu d\'y ajouter : il ne reste que le dernier terme. Il faut <code>s = s + k**2</code>.'},
  {tex:'\\sum_{k=1}^{n}k^2',lignes:['def somme(n):','    s = 0','    for k in range(1, n + 1):','        s = s + k**2','        return s'],faute:4,role:'la sortie de boucle',renvoie:'1',attendu:'14',
    dire:'Le <code>return</code> est dans la boucle : la fonction s\'arrête dès le premier tour. Il doit être aligné sous le <code>for</code>, après la boucle.'},
  {tex:'\\sum_{k=1}^{n}k^3',lignes:['def somme(n):','    for k in range(1, n + 1):','        s = 0','        s = s + k**3','    return s'],faute:2,role:'l\'initialisation',renvoie:'27',attendu:'36',
    dire:'<code>s = 0</code> est dans la boucle : le total repart de 0 à chaque tour, et la fonction renvoie seulement le dernier terme. Il doit être écrit avant le <code>for</code>.'},
  {tex:'\\sum_{k=1}^{n}\\frac1k',lignes:['def somme(n):','    s = 0','    for k in range(0, n + 1):','        s = s + 1 / k','    return s'],faute:2,role:'le compteur',renvoie:'une erreur : <code>ZeroDivisionError</code>',attendu:'$\\frac{11}{6}\\approx1{,}833$',
    dire:'Le compteur commence à 0, et dès le premier tour Python doit calculer $\\frac10$ : le programme s\'arrête sur une erreur. Il faut <code>range(1, n + 1)</code>.'},
  {tex:'\\sum_{k=1}^{n}k^2',lignes:['def somme(n):','    s = 0','    for k in range(1, n + 1):','        s = s + k*2','    return s'],faute:3,role:'le terme ajouté',renvoie:'12',attendu:'14',
    dire:'<code>k*2</code> calcule le double de $k$, pas son carré. Le carré s\'écrit <code>k**2</code>.'},
  {tex:'\\sum_{k=1}^{n}k^3',lignes:['def somme(n):','    s = 0','    for k in range(1, n):','        s = s + k**3','    return s'],faute:2,role:'le compteur',renvoie:'9',attendu:'36',
    dire:'<code>range(1, n)</code> s\'arrête à $n-1$ : le dernier cube manque. Il faut <code>range(1, n + 1)</code>.'},
];
const ROLES=['la définition de la fonction','l\'initialisation','le compteur','l\'accumulateur','la sortie'];
function machine(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'La machine à sommer',
    intro:'À gauche, une somme écrite avec $\\Sigma$ et la fonction Python qui la calcule. Fais tourner la boucle tour par tour : $k$ est le compteur, <code>s</code> l\'accumulateur qui part de 0. Puis relève les défis : dire ce que renvoie une fonction, trouver la ligne fausse d\'un programme.',
    gauche:'<div class="sigma"></div><pre class="code programme"></pre><div class="defile"><table class="simple tours"><thead><tr><th>tour</th><th>k</th><th>terme ajouté</th><th>s après le tour</th></tr></thead><tbody></tbody></table></div>'});
  g.classList.add('pile');
  d.innerHTML='<div class="champ"><span class="etiq">Que veux-tu faire ?</span><div class="puces modes"></div></div>'+
    '<p class="enonce-defi"></p>'+
    '<div class="zone-pas"><div class="champ"><span class="etiq">Le terme</span><div class="puces termes"></div></div>'+
      '<div class="champ"><span class="etiq">Le compteur commence à</span><div class="puces depart"></div></div><div class="zone-n"></div>'+
      '<div class="ligne"><button type="button" class="btn fantome tour">Un tour de boucle</button><button type="button" class="btn fantome finir">Jusqu\'au bout</button><button type="button" class="btn fantome zero">Recommencer</button></div></div>'+
    '<div class="champ saisie-defi" hidden><label for="'+u+'rep">Ta réponse : ce que renvoie la fonction</label><div class="ligne"><input type="text" id="'+u+'rep" inputmode="decimal" autocomplete="off"><button type="button" class="btn valider">Vérifier</button></div></div>'+
    '<div class="champ choix-ligne" hidden><span class="etiq">La ligne fausse est la…</span><div class="puces lignes"></div></div>'+
    '<div class="ligne boutons-defi" hidden><button type="button" class="btn fantome autre">Autre défi</button></div>'+
    '<div class="releves"></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={mode:0,ti:1,p:1,n:5,tours:0,erreur:false,defi:null,bug:-1,resolu:false};
  const Tm=()=>TERMES[st.ti];
  const lignesPas=()=>['def somme(n):','    s = 0','    for k in range('+st.p+', n + 1):','        s = s + '+Tm().py,'    return s'];
  function fmtS(v){ return Tm().frac?(Number.isInteger(v)?fmt(v,0):'≈ '+fmt(v,3)):fmt(v,0); }
  function dessinerPas(){ const T=Tm(), p=st.p, n=st.n, faits=st.tours, total=n-p+1;
    let act=[1]; if(faits>0&&faits<total) act=[2,3]; if(faits>=total) act=[4]; if(st.erreur) act=[3];
    g.querySelector('.programme').innerHTML=code(lignesPas(),act)+'\n\n<span class="discret"># appel : somme('+n+')</span>';
    const termes=[]; for(let k=p;k<=n;k++) termes.push(ecrireTerme(T,k));
    const deja=termes.slice(0,faits), s=somme(T,p,Math.min(n,p+faits-1));
    g.querySelector('.sigma').innerHTML='$$\\sum_{k='+p+'}^{'+n+'}'+T.tex+'='+(faits?deja.join('+')+(faits<total?'+\\dots':''):'\\dots')+(faits>=total&&!st.erreur?'='+(T.frac?'\\approx'+tx(s,3):tx(s,0)):'')+'$$';
    const rows=[]; let cumul=0; for(let j=0;j<Math.min(faits,total);j++){ const k=p+j; const v=valTerme(T,k); cumul+=v; rows.push('<tr><td>'+(j+1)+'</td><td>'+k+'</td><td>'+(T.frac?(k===1?'1':'1/'+k):fmt(v,0))+'</td><td>'+fmtS(cumul)+'</td></tr>'); }
    g.querySelector('.tours tbody').innerHTML=rows.join('')||'<tr><td colspan="4" class="discret">Avant le premier tour : s = 0.</td></tr>';
    q('.releves').innerHTML='<span>Nombre de termes</span><b>'+n+' − '+p+' + 1 = '+total+'</b><span>Tours faits</span><b>'+Math.min(faits,total)+' sur '+total+'</b><span>s</span><b>'+(st.erreur?'erreur':fmtS(s))+'</b>';
    maths(g.querySelector('.sigma')); }
  function tour(){ const T=Tm(), total=st.n-st.p+1, v=q('.verdict'); if(st.erreur) return;
    if(st.tours>=total){ verdict(v,'info','<span>La boucle est finie : $k$ a parcouru toutes les valeurs de '+st.p+' à '+st.n+'. La fonction renvoie <code>s</code>.</span>'); return; }
    const k=st.p+st.tours;
    if(T.frac&&k===0){ st.erreur=true; dessinerPas(); verdict(v,'ko','<strong>Erreur : <code>ZeroDivisionError</code>.</strong><span>Au premier tour, $k=0$ et Python doit calculer $\\frac10$. Pour une somme d\'inverses, le compteur commence à 1.</span>'); return; }
    const avant=somme(T,st.p,k-1), apres=avant+valTerme(T,k); st.tours++; dessinerPas();
    verdict(v,'info','<span>Tour '+st.tours+' : $k='+k+'$, on ajoute '+(T.frac?'$'+ecrireTerme(T,k)+'$':fmt(valTerme(T,k),0))+', et <code>s</code> passe de '+fmtS(avant)+' à '+fmtS(apres)+'.'+(st.tours===total?' C\'était le dernier tour : <code>range('+st.p+', '+st.n+' + 1)</code> s\'arrête à '+st.n+'.':'')+'</span>'); }
  function zoneN(){ q('.zone-n').innerHTML=reglette(u,'n','n, la borne du haut',1,12,1,st.n); lier(q('.zone-n'),st,{n:v=>String(v)},()=>{ st.tours=0; st.erreur=false; dessinerPas(); }); }
  /* défi « que renvoie-t-elle ? » */
  function nouveauRenvoie(){ const ti=[0,1,2,3,4,5][Math.floor(Math.random()*6)], T=TERMES[ti];
    const p=T.frac?1:(Math.random()<0.5?0:1), nmax=ti===5?4:ti===2?4:6, n=3+Math.floor(Math.random()*(nmax-2)), arret=Math.random()<0.35?'n':'n + 1';
    st.defi={T,p,n,arret}; const fin=arret==='n'?n-1:n;
    g.querySelector('.programme').innerHTML=code(['def somme(n):','    s = 0','    for k in range('+p+', '+arret+'):','        s = s + '+T.py,'    return s'])+'\n\nsomme('+n+')';
    g.querySelector('.sigma').innerHTML=''; g.querySelector('.tours tbody').innerHTML='<tr><td colspan="4" class="discret">Fais tourner la boucle à la main.</td></tr>'; q('.releves').innerHTML='';
    q('.enonce-defi').innerHTML='<strong>Défi.</strong> Que renvoie <code>somme('+n+')</code> ?'+(T.frac?' <span class="discret">Une fraction ou un décimal à 0,01 près.</span>':'');
    st.defi.attendu=somme(T,p,fin); verdict(q('.verdict'),'info','<span>Repère les valeurs que prend $k$ : où commence <code>range</code>, et où s\'arrête-t-il ?</span>'); }
  function verifierRenvoie(){ const D=st.defi, v=q('.verdict'); if(!D) return; const rep=lire(q('#'+u+'rep').value.replace(/^\s*(-?\d+)\s*\/\s*(\d+)\s*$/,(m,a,b)=>String(a/b)));
    if(!isFinite(rep)){ verdict(v,'info','<span>Écris un nombre'+(D.T.frac?', ou une fraction comme 11/6':'')+'.</span>'); return; }
    const fin=D.arret==='n'?D.n-1:D.n, tol=D.T.frac?0.01:0.5, est=x=>isFinite(x)&&Math.abs(rep-x)<=tol;
    const ks=[]; for(let k=D.p;k<=fin;k++) ks.push(k);
    if(est(D.attendu)){ st.resolu=true; reussi(v); verdict(v,'ok','<strong>Juste : '+(D.T.frac?'$'+tx(D.attendu,3)+'$':fmt(D.attendu,0))+'.</strong><span>$k$ prend les valeurs '+ks.join(', ')+' : <code>range('+D.p+', '+D.arret+')</code> '+(D.arret==='n'?'s\'arrête juste avant $n$, à '+fin+'.':'va jusqu\'à $n$ compris.')+' Avec $\\Sigma$ : $\\displaystyle\\sum_{k='+D.p+'}^{'+fin+'}'+D.T.tex+'$.</span>'); return; }
    let m='';
    if(D.arret==='n'&&est(somme(D.T,D.p,D.n))) m='<strong>Tu es allé un tour trop loin.</strong><span><code>range('+D.p+', n)</code> s\'arrête juste avant $n$ : le dernier tour est pour $k='+(D.n-1)+'$, pas '+D.n+'.</span>';
    else if(D.arret!=='n'&&est(somme(D.T,D.p,D.n-1))) m='<strong>Il manque le dernier tour.</strong><span><code>range('+D.p+', n + 1)</code> va jusqu\'à $n='+D.n+'$ compris : le terme pour $k='+D.n+'$ compte.</span>';
    else if(D.p===1&&!D.T.frac&&est(somme(D.T,0,fin))) m='<strong>Le compteur commence à 1, pas à 0.</strong><span><code>range(1, …)</code> : le premier tour est pour $k=1$. Tu as ajouté le terme $k=0$, qui vaut '+fmt(valTerme(D.T,0),0)+'.</span>';
    else if(D.p===0&&est(somme(D.T,1,fin))) m='<strong>Il manque le premier tour, $k=0$.</strong><span><code>range(0, …)</code> commence à 0, et ici le terme $k=0$ vaut '+fmt(valTerme(D.T,0),0)+' : il compte.</span>';
    else if(est(valTerme(D.T,fin))) m='<strong>C\'est seulement le dernier terme.</strong><span>L\'accumulateur <code>s = s + …</code> garde le total des tours précédents : il faut tout additionner.</span>';
    else if(est(fin-D.p+1)) m='<strong>C\'est le nombre de tours, pas la somme.</strong><span>Il y a bien '+(fin-D.p+1)+' tours ; à chaque tour, on ajoute un terme à <code>s</code>.</span>';
    else m='<strong>Pas tout à fait.</strong><span>Fais un tableau : une ligne par tour, avec $k$, le terme, et <code>s</code>. Le premier tour est pour $k='+D.p+'$.</span>';
    verdict(v,'ko',m); }
  /* défi « trouve la ligne fausse » */
  function nouveauBug(){ let b; do{ b=Math.floor(Math.random()*BUGS.length); }while(b===st.bug); st.bug=b; const B=BUGS[b];
    g.querySelector('.programme').innerHTML=code(B.lignes.map((l,i)=>(i+1)+'  '+l));
    g.querySelector('.sigma').innerHTML='$$'+B.tex+'$$'; maths(g.querySelector('.sigma'));
    g.querySelector('.tours tbody').innerHTML='<tr><td colspan="4" class="discret">Teste à la main avec n = 3.</td></tr>'; q('.releves').innerHTML='';
    q('.enonce-defi').innerHTML='<strong>Défi.</strong> Cette fonction devrait calculer la somme ci-contre, mais elle se trompe. Quelle ligne est fausse ?';
    q('.lignes').querySelectorAll('.puce').forEach(x=>x.setAttribute('aria-pressed','false'));
    verdict(q('.verdict'),'info','<span>Fais tourner le programme pour $n=3$, tour par tour, et compare à ce qu\'il devrait renvoyer.</span>'); }
  function choisirLigne(L){ const B=BUGS[st.bug], v=q('.verdict');   // L : l'index de la ligne dans le programme (1 = la ligne 2)
    if(L===B.faute){ st.resolu=true; reussi(v); g.querySelector('.programme').innerHTML=code(B.lignes.map((l,j)=>(j+1)+'  '+l),[L]);
      verdict(v,'ok','<strong>Oui, la ligne '+(L+1)+' : '+B.role+'.</strong><span>'+B.dire+' Pour $n=3$, la fonction renvoie '+B.renvoie+' au lieu de '+B.attendu+'.</span>'); return; }
    const l=B.lignes[L]; const role= /return/.test(l)?'la sortie : elle renvoie le total après la boucle':/^\s*for/.test(l)?'le compteur : il fait parcourir à $k$ les valeurs voulues':/s = 0/.test(l)?'l\'initialisation de l\'accumulateur':/s = s/.test(l)?'l\'accumulation : on ajoute le terme au total':ROLES[Math.min(L,4)];
    verdict(v,'ko','<strong>La ligne '+(L+1)+' est correcte.</strong><span>C\'est '+role+'. Fais tourner le programme pour $n=3$ : à quel moment s\'écarte-t-il de ce qu\'il devrait faire ?</span>'); }
  function mode(m){ st.mode=m; st.resolu=false; q('.zone-pas').hidden=m!==0; q('.saisie-defi').hidden=m!==1; q('.choix-ligne').hidden=m!==2; q('.boutons-defi').hidden=m===0; q('#'+u+'rep').value='';
    if(m===0){ q('.enonce-defi').innerHTML=''; st.tours=0; st.erreur=false; dessinerPas(); verdict(q('.verdict'),'info','<span>Choisis un terme et la borne $n$, puis fais tourner la boucle. Essaie aussi « 1/k » en commençant à 0.</span>'); }
    else if(m===1) nouveauRenvoie(); else nouveauBug(); }
  puces(q('.termes'),TERMES.map(T=>T.nom),st.ti,i=>{ st.ti=i; st.tours=0; st.erreur=false; dessinerPas(); });
  puces(q('.depart'),['0','1'],1,i=>{ st.p=i; st.tours=0; st.erreur=false; dessinerPas(); });
  puces(q('.lignes'),['ligne 2','ligne 3','ligne 4','ligne 5'],-1,i=>choisirLigne(i+1));
  puces(q('.modes'),['Pas à pas','Que renvoie-t-elle ?','Trouve la ligne fausse'],0,mode);
  q('.tour').addEventListener('click',tour);
  q('.finir').addEventListener('click',()=>{ let garde=0; while(st.tours<st.n-st.p+1&&!st.erreur&&garde++<100) tour(); });
  q('.zero').addEventListener('click',()=>{ st.tours=0; st.erreur=false; dessinerPas(); verdict(q('.verdict'),'info','<span>Avant le premier tour, <code>s</code> vaut 0 : c\'est l\'initialisation.</span>'); });
  q('.valider').addEventListener('click',verifierRenvoie);
  q('.autre').addEventListener('click',()=>{ q('#'+u+'rep').value=''; if(st.mode===1) nouveauRenvoie(); else nouveauBug(); });
  zoneN(); mode(0);
}

window.LABOS=window.LABOS||{};
window.LABOS['suites-tt']={tirelire,offres,machine};
})();
