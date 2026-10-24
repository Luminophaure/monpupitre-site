/* =====================================================================
   LABORATOIRES — chapitre « Calcul littéral » (quatrième)
   Utilisation dans une page :
     <div class="labo" data-labo="litteral" data-outil="motifs"></div>
   Outils (tous tournés vers la modélisation) :
     motifs      compter les éléments d'un motif qui grandit, trouver la formule,
                 comparer plusieurs façons de voir
     programme   programmes de calcul : essayer des nombres, conjecturer, prouver avec x
     forfaits    écrire le prix de deux tarifs en fonction de n, puis les comparer
     rectangles  la distributivité vue comme une aire (simple et double)
     egalites    une égalité est-elle vraie pour tous les nombres ? (contre-exemple)
   Les outils généraux sont dans labos/commun.js.
   ===================================================================== */
(function(){
"use strict";
const {maths,css,id,nb,hasard,lire,carcasse,reglette,lier,puces,Toile,etiquette}=window.Labo;
const G=window.Graphe;

/* nombre écrit simplement : 6 ; 2,5 ; −3 */
const nbs=v=>{ if(!isFinite(v)) return '—'; const r=Math.round(v*1000)/1000; return String(r).replace('.',',').replace('-','−'); };
const texN=v=>nbs(v).replace('−','-').replace(',','{,}');
/* lit une formule écrite par l'élève avec UNE lettre (n, x, a…) ; renvoie une fonction ou null */
function formule(src){
  src=String(src||'').trim(); if(!src) return null;
  const lettres=[...new Set((src.match(/[a-zA-Z]/g)||[]))];
  if(lettres.length>1) return null;
  if(lettres.length===1) src=src.replace(new RegExp(lettres[0],'g'),'x');
  try{ const f=G.compiler(src); f(1.7); return f; }catch(e){ return null; }
}
const egaux=(a,b)=>Math.abs(a-b)<1e-6*Math.max(1,Math.abs(a),Math.abs(b));

/* ---------- petits polynômes [c0, c1, c2] en x : pour réduire et afficher ---------- */
const P={
  plus:(p,q)=>[0,1,2].map(i=>(p[i]||0)+(q[i]||0)),
  fois:(p,k)=>p.map(c=>c*k),
  produit:(p,q)=>{ const r=[0,0,0,0,0]; p.forEach((a,i)=>q.forEach((b,j)=>{ r[i+j]+=a*b; })); return r.slice(0,3); },
  val:(p,x)=>p.reduce((s,c,i)=>s+c*Math.pow(x,i),0),
  tex(p,l){ l=l||'x'; const t=[]; for(let i=p.length-1;i>=0;i--){ const c=Math.round((p[i]||0)*1000)/1000; if(!c) continue;
      const lettre=i===0?'':i===1?l:l+'^'+i, abs=Math.abs(c), coef=(abs===1&&i>0)?'':texN(abs);
      t.push((c<0?'-':(t.length?'+':''))+coef+lettre); }
    return t.length?t.join(''):'0'; }
};

/* =================================================================
   1. LES MOTIFS QUI GRANDISSENT
   Chaque motif fournit ses éléments pour un rang n, et plusieurs « regards » :
   une façon de grouper les éléments (couleurs) et l'expression qui va avec.
   ================================================================= */
const BOIS='#C98B4B', TETE='#D7372B';
const MOTIFS=[
  { nom:'Rangée de carrés', unite:'allumettes', min:1, f:n=>3*n+1, allumettes:true,
    elements(n){ const e=[]; for(let i=0;i<=n;i++) e.push({a:[i,0],b:[i,1],k:'v',i}); for(let i=0;i<n;i++){ e.push({a:[i,1],b:[i+1,1],k:'h',i}); e.push({a:[i,0],b:[i+1,0],k:'h',i}); } return e; },
    regards:[
      {tex:'1+3n', txt:'une allumette au début, puis 3 par carré', g:e=>e.k==='v'&&e.i===0?0:1+((e.k==='v'?e.i-1:e.i)%2)},
      {tex:'4+3(n-1)', txt:'un premier carré complet, puis 3 allumettes pour chacun des n − 1 autres', g:e=>(e.k==='v'?(e.i<=1?0:e.i-1):e.i)===0?0:1+(((e.k==='v'?e.i-1:e.i))%2)},
      {tex:'(n+1)+2n', txt:'n + 1 allumettes verticales, et 2n horizontales', g:e=>e.k==='v'?1:2},
    ]},
  { nom:'Frise de triangles', unite:'allumettes', min:1, f:n=>2*n+1, allumettes:true,
    elements(n){ const e=[], h=0.87, B=k=>[k,0], T=k=>[k+0.5,h];
      for(let t=0;t<=n;t++){ const k=Math.floor(t/2); e.push(t%2===0?{a:B(k),b:T(k),k:'o',i:t}:{a:T(k),b:B(k+1),k:'o',i:t}); }
      for(let t=0;t<n;t++){ const k=Math.floor(t/2); e.push(t%2===0?{a:B(k),b:B(k+1),k:'h',i:t}:{a:T(k),b:T(k+1),k:'h',i:t}); }
      return e; },
    regards:[
      {tex:'1+2n', txt:'une allumette au début, puis 2 par triangle', g:e=>e.k==='o'&&e.i===0?0:1+((e.k==='o'?e.i-1:e.i)%2)},
      {tex:'3+2(n-1)', txt:'un premier triangle complet, puis 2 allumettes par triangle ajouté', g:e=>{ const t=e.k==='o'?Math.max(0,e.i-1):e.i; return t===0?0:1+(t%2); }},
      {tex:'(n+1)+n', txt:'n + 1 allumettes obliques et n horizontales', g:e=>e.k==='o'?1:2},
    ]},
  { nom:'Le carré bordé', unite:'carreaux de bordure', min:2, f:n=>4*n-4,
    elements(n){ const e=[]; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const bord=i===0||j===0||i===n-1||j===n-1; e.push({c:[i,j],bord,n}); } return e; },
    regards:[
      {tex:'4n-4', txt:'4 côtés de n carreaux, mais les 4 coins sont comptés deux fois', g:e=>{ const {c:[i,j],n}=e; const coin=(i===0||i===n-1)&&(j===0||j===n-1); return coin?0:(j===n-1||j===0)?1:2; }},
      {tex:'4(n-1)', txt:'4 bandes identiques de n − 1 carreaux, qui tournent', g:e=>{ const {c:[i,j],n}=e; if(j===n-1&&i<n-1) return 1; if(i===n-1&&j>0) return 2; if(j===0&&i>0) return 1; return 2; }},
      {tex:'2n+2(n-2)', txt:'2 rangées complètes de n, et 2 colonnes sans les coins', g:e=>{ const {c:[,j],n}=e; return (j===0||j===n-1)?1:2; }},
    ]},
  { nom:'La croix', unite:'carreaux', min:1, f:n=>4*n+1,
    elements(n){ const e=[{c:[0,0],bras:-1}]; for(let k=1;k<=n;k++){ e.push({c:[k,0],bras:0},{c:[-k,0],bras:1},{c:[0,k],bras:2},{c:[0,-k],bras:3}); } return e; },
    regards:[
      {tex:'4n+1', txt:'le carreau du centre, et 4 bras de n carreaux', g:e=>e.bras<0?0:1+(e.bras%2)},
      {tex:'(2n+1)+2n', txt:'une barre horizontale de 2n + 1 carreaux, et 2 bras verticaux', g:e=>e.bras<2?1:2},
      {tex:'2(2n+1)-1', txt:'deux barres de 2n + 1 carreaux, mais le centre est compté deux fois', g:e=>e.bras<0?0:e.bras<2?1:2},
    ]},
];
function motifs(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Les motifs qui grandissent',
    intro:'Un motif grandit étape par étape. Combien faut-il d\'éléments à l\'étape $n$ ? Trouve une <strong>formule</strong> qui marche pour toutes les étapes : avec elle, tu calcules l\'étape 100 sans la dessiner.',
    gauche:'<canvas class="large" role="img" aria-label="Le motif à l\'étape n."></canvas><div class="regard-txt discret" aria-live="polite"></div>'});
  d.innerHTML='<div class="champ"><span class="etiq">Le motif</span><div class="puces choix-motif"></div></div>'+
    reglette(u,'n','Étape n',1,8,1,3)+
    '<label class="case"><input type="checkbox" class="compter"><span>Afficher le nombre d\'éléments</span></label>'+
    '<div class="champ"><label for="'+u+'f">Ma formule, en fonction de n</label><input type="text" id="'+u+'f" class="formule" placeholder="ex. 5n + 2" autocomplete="off" autocapitalize="off" spellcheck="false"></div>'+
    '<button type="button" class="btn tester">Tester ma formule</button>'+
    '<div class="verdict info" aria-live="polite"></div>'+
    '<div class="defile"><table class="mini-table essais" hidden></table></div>'+
    '<div class="champ"><span class="etiq">D\'autres façons de voir</span><div class="puces regards"></div></div>';
  const q=s=>d.querySelector(s);
  const st={m:0,regard:-1,compter:false};
  const T=Toile(g.querySelector('canvas'),T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const M=MOTIFS[st.m], n=st.n, E=M.elements(n);
    const COUL=[css('--muted'),css('--mc'),css('--pink')];
    const coul=e=>st.regard<0?null:COUL[M.regards[st.regard].g(e)];
    if(M.allumettes){
      const xs=E.flatMap(e=>[e.a[0],e.b[0]]), ys=E.flatMap(e=>[e.a[1],e.b[1]]);
      const x0=Math.min(...xs),x1=Math.max(...xs),y1=Math.max(...ys);
      const s=Math.min((W-40)/Math.max(x1-x0,4),(H-40)/Math.max(y1,1),90), ox=(W-(x1-x0)*s)/2-x0*s, oy=H/2+y1*s/2;
      const X=x=>ox+x*s, Y=y=>oy-y*s;
      E.forEach(e=>{ const k=coul(e); const ax=X(e.a[0]),ay=Y(e.a[1]),bx=X(e.b[0]),by=Y(e.b[1]), L=Math.hypot(bx-ax,by-ay), ux=(bx-ax)/L, uy=(by-ay)/L, r=Math.min(6,s*0.07);
        c.save(); c.lineCap='round'; c.strokeStyle=k||BOIS; c.lineWidth=Math.max(4,s*0.08);
        c.beginPath(); c.moveTo(ax+ux*r*1.6,ay+uy*r*1.6); c.lineTo(bx-ux*r*1.2,by-uy*r*1.2); c.stroke();
        c.fillStyle=k||TETE; c.beginPath(); c.arc(bx-ux*r*1.6,by-uy*r*1.6,r*1.1,0,7); c.fill(); c.restore(); });
    } else {
      const xs=E.map(e=>e.c[0]), ys=E.map(e=>e.c[1]); const x0=Math.min(...xs),x1=Math.max(...xs)+1,y0=Math.min(...ys),y1=Math.max(...ys)+1;
      const s=Math.min((W-30)/Math.max(x1-x0,3),(H-30)/Math.max(y1-y0,3),60), ox=(W-(x1-x0)*s)/2-x0*s, oy=(H-(y1-y0)*s)/2-y0*s;
      E.forEach(e=>{ const k=coul(e); const x=ox+e.c[0]*s, y=oy+e.c[1]*s;
        c.fillStyle= e.bord===false ? css('--grid') : (k||css('--b-ex')); c.globalAlpha=e.bord===false?0.6:1;
        c.fillRect(x+1.5,y+1.5,s-3,s-3); c.globalAlpha=1; c.strokeStyle=css('--card'); c.lineWidth=1.5; c.strokeRect(x+1.5,y+1.5,s-3,s-3); });
    }
    etiquette(c,'Étape '+n,10,16,css('--muted'),{taille:14});
    if(st.compter) etiquette(c,M.f(n)+' '+M.unite,W-10,16,css('--ink'),{align:'right',taille:15});
  });
  function choisirMotif(i){
    st.m=i; st.regard=-1; const M=MOTIFS[i]; const r=d.querySelector('[data-r="n"]'); r.min=M.min; if(st.n<M.min){ r.value=M.min; st.n=M.min; d.querySelector('[data-v="n"]').textContent=M.min; }
    const zr=q('.regards'); zr.replaceWith(zr.cloneNode(false)); // repart d'une rangée vide (sans anciens écouteurs)
    puces(q('.regards'),M.regards.map(R=>'$'+R.tex+'$'),-1,k=>{ st.regard=k; regardTexte(); T.redessiner(); }); maths(q('.regards'));
    q('.verdict').className='verdict info'; q('.verdict').innerHTML='<span>Fais varier l\'étape et compte les '+M.unite+'. Qu\'ajoute-t-on à chaque étape ?</span>';
    q('.essais').hidden=true; g.querySelector('.regard-txt').textContent=''; T.redessiner();
  }
  function regardTexte(){ const M=MOTIFS[st.m], R=M.regards[st.regard]; const z=g.querySelector('.regard-txt');
    z.innerHTML='<strong>$'+R.tex+'$</strong> : '+R.txt+'. Toutes ces expressions sont égales : réduis-les, tu trouves $'+P.tex([M.f(0),M.f(1)-M.f(0)],'n')+'$.'; maths(z); }
  function tester(){
    const M=MOTIFS[st.m], f=formule(q('.formule').value), v=q('.verdict'), t=q('.essais');
    if(!f){ v.className='verdict ko'; v.innerHTML='<strong>Je ne comprends pas cette formule.</strong><span>Écris-la avec la lettre n, par exemple <code>5n + 2</code> ou <code>4(n - 1)</code>.</span>'; t.hidden=true; return; }
    const ns=[]; for(let n=M.min;n<M.min+8;n++) ns.push(n);
    t.hidden=false; t.innerHTML='<thead><tr><th>étape n</th>'+ns.map(n=>'<th>'+n+'</th>').join('')+'</tr></thead><tbody><tr><th>motif</th>'+ns.map(n=>'<td>'+M.f(n)+'</td>').join('')+'</tr><tr><th>formule</th>'+ns.map(n=>{ const y=f(n); return '<td class="'+(egaux(y,M.f(n))?'juste':'faux')+'">'+nbs(y)+'</td>'; }).join('')+'</tr></tbody>';
    const faux=ns.concat([20,50,100]).find(n=>!egaux(f(n),M.f(n)));
    if(faux==null){ v.className='verdict ok'; v.innerHTML='<strong>Ta formule marche à toutes les étapes testées.</strong><span>À l\'étape 100, il faudra $'+nbs(f(100))+'$ '+M.unite+'. Regarde maintenant « d\'autres façons de voir » : d\'autres formules, toutes égales à la tienne.</span>'; }
    else { v.className='verdict ko'; const ok=ns.filter(n=>egaux(f(n),M.f(n)));
      v.innerHTML='<strong>Ta formule ne marche pas à l\'étape '+faux+'</strong><span>Elle donne '+nbs(f(faux))+' au lieu de '+M.f(faux)+'.'+(ok.length?' Elle marche pour n = '+ok.join(', ')+' : un exemple qui marche ne suffit pas.':'')+' Indice : de combien augmente le nombre d\'éléments d\'une étape à la suivante ?</span>'; }
    maths(v);
  }
  q('.tester').addEventListener('click',tester);
  q('.formule').addEventListener('keydown',e=>{ if(e.key==='Enter') tester(); });
  q('.compter').addEventListener('change',e=>{ st.compter=e.target.checked; T.redessiner(); });
  puces(q('.choix-motif'),MOTIFS.map(M=>M.nom),0,choisirMotif);
  lier(d,st,{},()=>T.redessiner());
  choisirMotif(0); maths(el);
}

/* =================================================================
   2. LES PROGRAMMES DE CALCUL
   Une étape agit à la fois sur un nombre, sur un polynôme (pour réduire)
   et sur une écriture non réduite (pour montrer la mise en équation).
   ================================================================= */
const PROGS=[
  { nom:'Programme A', etapes:[['+',3],['*',2],['-x',2]], conclusion:'Le résultat est toujours $6$, quel que soit le nombre de départ.' },
  { nom:'Programme B', etapes:[['*',4],['+',8],['/',4],['-x',1]], conclusion:'Le résultat est toujours $2$.' },
  { nom:'Programme C', etapes:[['+',5],['*',3],['-',15]], conclusion:'Le résultat est toujours le <strong>triple</strong> du nombre de départ.' },
  { nom:'Programme D', etapes:[['+',1],['*x'],['-x2']], conclusion:'Le résultat est toujours le <strong>nombre de départ</strong> lui-même.' },
];
const PHRASE={'+':k=>'Ajouter '+k,'-':k=>'Soustraire '+k,'*':k=>'Multiplier par '+k,'/':k=>'Diviser par '+k,'-x':k=>k===1?'Soustraire le nombre de départ':k===2?'Soustraire le double du nombre de départ':'Soustraire '+k+' fois le nombre de départ','*x':()=>'Multiplier par le nombre de départ','-x2':()=>'Soustraire le carré du nombre de départ'};
function etape(e,v,x){ const [o,k]=e; return o==='+'?v+k:o==='-'?v-k:o==='*'?v*k:o==='/'?v/k:o==='-x'?v-k*x:o==='*x'?v*x:v-x*x; }
function etapePoly(e,p){ const [o,k]=e; return o==='+'?P.plus(p,[k]):o==='-'?P.plus(p,[-k]):o==='*'?P.fois(p,k):o==='/'?P.fois(p,1/k):o==='-x'?P.plus(p,[0,-k]):o==='*x'?P.produit(p,[0,1]):P.plus(p,[0,0,-1]); }
function etapeTex(e,t){ // t = {s: écriture, somme: vrai si c'est une somme (il faudra des parenthèses)}
  const [o,k]=e;
  if(o==='+') return {s:t.s+'+'+k,somme:true}; if(o==='-') return {s:t.s+'-'+k,somme:true};
  if(o==='*') return {s:k+(t.somme?'('+t.s+')':t.s==='x'?'x':'\\times '+t.s),somme:false};
  if(o==='/') return {s:'\\dfrac{'+t.s+'}{'+k+'}',somme:false};
  if(o==='-x') return {s:t.s+'-'+(k===1?'':k)+'x',somme:true};
  if(o==='*x') return {s:'x'+(t.somme?'('+t.s+')':'\\times '+t.s),somme:false};
  return {s:t.s+'-x^2',somme:true};
}
function programme(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Les programmes de calcul',
    intro:'Choisis un programme, essaie-le avec plusieurs nombres, et cherche ce qui se passe. Puis <strong>prouve-le</strong> : avec une lettre, on fait le calcul pour tous les nombres à la fois.',
    gauche:'<div class="defile"><table class="mini-table prog"></table></div><div class="preuve pile" hidden></div>'});
  d.innerHTML='<div class="champ"><span class="etiq">Le programme</span><div class="puces choix-prog"></div></div>'+
    '<div class="champ"><label for="'+u+'x">Nombre de départ</label><input type="text" id="'+u+'x" class="depart" inputmode="decimal" value="5"></div>'+
    '<div class="ligne"><button type="button" class="btn essayer">Essayer ce nombre</button><button type="button" class="btn fantome hasard">Un nombre au hasard</button></div>'+
    '<div class="champ"><span class="etiq">Mes essais</span><div class="historique discret">Aucun essai pour l\'instant.</div></div>'+
    '<div class="verdict info" aria-live="polite"></div>'+
    '<button type="button" class="btn fantome prouver">Prouver avec une lettre</button>';
  const q=s=>d.querySelector(s);
  const st={p:0,essais:[],preuve:false};
  function tableau(x){
    const Pg=PROGS[st.p]; let v=x, t={s:'x',somme:false}; const lignes=[];
    lignes.push(['Choisir un nombre',x==null?'':nbs(x),'x']);
    Pg.etapes.forEach(e=>{ if(x!=null) v=etape(e,v,x); t=etapeTex(e,t); lignes.push([PHRASE[e[0]](e[1]),x==null?'':nbs(v),t.s]); });
    g.querySelector('.prog').innerHTML='<thead><tr><th>Étape</th><th>Avec ton nombre</th>'+(st.preuve?'<th>Avec x</th>':'')+'</tr></thead><tbody>'+
      lignes.map((l,i)=>'<tr><td>'+l[0]+'</td><td>'+l[1]+'</td>'+(st.preuve?'<td>$'+l[2]+'$</td>':'')+'</tr>').join('')+'</tbody>';
    maths(g.querySelector('.prog'));
    return t;
  }
  function essayer(x){
    if(!isFinite(x)){ const v=q('.verdict'); v.className='verdict ko'; v.innerHTML='<span>Écris un nombre, par exemple 7, −3 ou 2,5.</span>'; return; }
    const Pg=PROGS[st.p]; let v=x; Pg.etapes.forEach(e=>{ v=etape(e,v,x); });
    tableau(x); st.essais.push([x,v]); if(st.essais.length>6) st.essais.shift();
    q('.historique').innerHTML=st.essais.map(([a,b])=>nbs(a)+' → <strong>'+nbs(b)+'</strong>').join(' &nbsp;·&nbsp; ');
    const vv=q('.verdict'); vv.className='verdict info';
    vv.innerHTML= st.essais.length<3 ? '<span>Essaie encore avec d\'autres nombres, y compris négatifs ou décimaux.</span>' : '<strong>Que remarques-tu ?</strong><span>Écris ta conjecture. Elle semble vraie pour tes essais… mais quelques essais ne prouvent rien : il faudrait essayer tous les nombres. Clique sur « Prouver avec une lettre ».</span>';
  }
  function prouver(){
    st.preuve=true; const Pg=PROGS[st.p]; const x0=st.essais.length?st.essais[st.essais.length-1][0]:null; const t=tableau(x0);
    let p=[0,1]; Pg.etapes.forEach(e=>{ p=etapePoly(e,p); });
    const z=g.querySelector('.preuve'); z.hidden=false;
    z.innerHTML='<div class="bloc methode" data-titre="La preuve"><p>On appelle $x$ le nombre de départ. Le programme donne $'+t.s+'$.</p><p>On développe et on réduit : $'+t.s+'='+P.tex(p)+'$.</p><p><strong>'+Pg.conclusion+'</strong> C\'est prouvé pour tous les nombres, pas seulement ceux que tu as essayés.</p></div>';
    maths(z); if(window.Site&&Site.blocs) Site.blocs(z);
  }
  puces(q('.choix-prog'),PROGS.map(p=>p.nom),0,i=>{ st.p=i; st.essais=[]; st.preuve=false; g.querySelector('.preuve').hidden=true; q('.historique').textContent='Aucun essai pour l\'instant.'; tableau(null); const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>Essaie le programme avec au moins trois nombres.</span>'; });
  q('.essayer').addEventListener('click',()=>essayer(lire(q('.depart').value)));
  q('.depart').addEventListener('keydown',e=>{ if(e.key==='Enter') essayer(lire(q('.depart').value)); });
  q('.hasard').addEventListener('click',()=>{ const x=hasard(-20,40); q('.depart').value=nbs(x); essayer(x); });
  q('.prouver').addEventListener('click',prouver);
  tableau(null); const v=q('.verdict'); v.innerHTML='<span>Essaie le programme avec au moins trois nombres.</span>'; maths(el);
}

/* =================================================================
   3. QUEL TARIF CHOISIR ?
   ================================================================= */
const SCENARIOS=[
  {nom:'La piscine', n:'entrées', A:{txt:'4,50 € l\'entrée', p:[0,4.5]}, B:{txt:'une carte à 20 € par an, puis 2,50 € l\'entrée', p:[20,2.5]}, max:20},
  {nom:'Le vélo', n:'heures de location', A:{txt:'3 € l\'heure', p:[0,3]}, B:{txt:'12 € pour le casque et l\'antivol, puis 1 € l\'heure', p:[12,1]}, max:12},
  {nom:'Le cinéma', n:'séances', A:{txt:'9 € la place', p:[0,9]}, B:{txt:'abonnement de 18 €, puis 6 € la place', p:[18,6]}, max:12},
  {nom:'Le taxi', n:'kilomètres', A:{txt:'4 € de prise en charge, puis 2 € le kilomètre', p:[4,2]}, B:{txt:'2,50 € le kilomètre, sans prise en charge', p:[0,2.5]}, max:16},
];
function forfaits(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Quel tarif choisir ?',
    intro:'Deux tarifs, et une question de la vie courante : lequel coûte le moins cher ? <strong>Modélise</strong> chaque prix par une expression en fonction de $n$, puis compare.',
    gauche:'<canvas class="large" role="img" aria-label="Prix des deux tarifs en fonction de n."></canvas><div class="defile"><table class="mini-table valeurs-tarifs"></table></div>'});
  d.innerHTML='<div class="champ"><span class="etiq">La situation</span><div class="puces choix-sc"></div></div>'+
    '<div class="enonce-sc pile"></div>'+
    '<div class="champ"><label for="'+u+'a">Prix avec le tarif A (en €)</label><input type="text" id="'+u+'a" class="formule fa" placeholder="en fonction de n" autocomplete="off" autocapitalize="off" spellcheck="false"></div>'+
    '<div class="champ"><label for="'+u+'b">Prix avec le tarif B (en €)</label><input type="text" id="'+u+'b" class="formule fb" placeholder="en fonction de n" autocomplete="off" autocapitalize="off" spellcheck="false"></div>'+
    '<div class="ligne"><button type="button" class="btn verifier">Vérifier mes expressions</button><button type="button" class="btn fantome solution">Voir la réponse</button></div>'+
    '<div class="verdict info" aria-live="polite"></div>'+
    '<div class="zone-n pile" hidden>'+reglette(u,'n','Nombre n','0','20','1','5')+'<div class="releves"></div></div>';
  const q=s=>d.querySelector(s);
  const st={s:0,ok:false};
  const T=Toile(g.querySelector('canvas'),T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const S=SCENARIOS[st.s];
    if(!st.ok){ ['Le graphique apparaîtra','quand tes deux expressions','seront justes.'].forEach((l,i)=>etiquette(c,l,W/2,H/2+(i-1)*20,css('--muted'),{align:'center',taille:W<420?13:15,gras:false})); return; }
    const m={g:46,d:14,h:16,b:34}, N=S.max, ymax=Math.max(P.val(S.A.p,N),P.val(S.B.p,N))*1.1;
    const X=n=>m.g+n/N*(W-m.g-m.d), Y=y=>H-m.b-y/ymax*(H-m.h-m.b);
    const pasY=[1,2,5,10,20,50].find(p=>ymax/p<=7);
    c.save(); c.strokeStyle=css('--grid'); c.lineWidth=1; c.beginPath(); for(let y=pasY;y<ymax;y+=pasY){ c.moveTo(X(0),Y(y)+.5); c.lineTo(X(N),Y(y)+.5); } c.stroke();
    c.strokeStyle=css('--ink'); c.lineWidth=1.5; c.beginPath(); c.moveTo(X(0),Y(0)); c.lineTo(X(N),Y(0)); c.moveTo(X(0),Y(0)); c.lineTo(X(0),Y(ymax)); c.stroke(); c.restore();
    for(let y=pasY;y<ymax;y+=pasY) etiquette(c,nbs(y),X(0)-6,Y(y),css('--muted'),{align:'right',taille:12,gras:false});
    for(let n=0;n<=N;n+=N>12?2:1) etiquette(c,String(n),X(n),Y(0)+14,css('--muted'),{align:'center',taille:12,gras:false});
    etiquette(c,'n',X(N),Y(0)+28,css('--muted'),{align:'right',taille:12}); etiquette(c,'prix (€)',X(0)+6,m.h,css('--muted'),{taille:12});
    c.save(); c.strokeStyle=css('--muted'); c.setLineDash([4,4]); c.beginPath(); c.moveTo(X(st.n),Y(0)); c.lineTo(X(st.n),Y(ymax)); c.stroke(); c.restore();
    [[S.A.p,css('--mc'),'A'],[S.B.p,css('--pink'),'B']].forEach(([p,k,nom])=>{ c.fillStyle=k; for(let n=0;n<=N;n++){ c.beginPath(); c.arc(X(n),Y(P.val(p,n)),n===st.n?6:3.5,0,7); c.fill(); }
      etiquette(c,nom,X(N)+0,Y(P.val(p,N))-12,k,{align:'right'}); });
  });
  function enonce(){ const S=SCENARIOS[st.s]; q('.enonce-sc').innerHTML='<p><strong>Tarif A :</strong> '+S.A.txt+'.<br><strong>Tarif B :</strong> '+S.B.txt+'.<br>On note $n$ le nombre de '+S.n+'.</p>'; maths(q('.enonce-sc')); }
  function comparer(){
    const S=SCENARIOS[st.s], a=P.val(S.A.p,st.n), b=P.val(S.B.p,st.n);
    q('.releves').innerHTML='<span>Tarif A pour n = '+st.n+'</span><b>'+nb(a,2)+' €</b><span>Tarif B pour n = '+st.n+'</span><b>'+nb(b,2)+' €</b><span>Le moins cher</span><b>'+(egaux(a,b)?'égalité':a<b?'A':'B')+'</b>';
    let egal=null; for(let n=0;n<=S.max;n++) if(egaux(P.val(S.A.p,n),P.val(S.B.p,n))) egal=n;
    g.querySelector('.valeurs-tarifs').innerHTML='<thead><tr><th>n</th>'+Array.from({length:S.max+1},(_,n)=>'<th>'+n+'</th>').join('')+'</tr></thead><tbody><tr><th>A</th>'+Array.from({length:S.max+1},(_,n)=>'<td>'+nbs(P.val(S.A.p,n))+'</td>').join('')+'</tr><tr><th>B</th>'+Array.from({length:S.max+1},(_,n)=>'<td>'+nbs(P.val(S.B.p,n))+'</td>').join('')+'</tr></tbody>';
    const moinsA=P.val(S.A.p,0)<P.val(S.B.p,0);
    const v=q('.verdict'); v.className='verdict ok'; v.innerHTML='<strong>Les deux tarifs coûtent pareil pour n = '+egal+'.</strong><span>En dessous, le tarif '+(moinsA?'A':'B')+' est le moins cher ; au-dessus, c\'est le tarif '+(moinsA?'B':'A')+'. Un abonnement devient intéressant quand on s\'en sert souvent.</span>';
    T.redessiner();
  }
  function verifier(montrer){
    const S=SCENARIOS[st.s], v=q('.verdict');
    if(montrer){ q('.fa').value=P.tex(S.A.p,'n').replace(/{,}/g,','); q('.fb').value=P.tex(S.B.p,'n').replace(/{,}/g,','); }
    const res=[['fa',S.A],['fb',S.B]].map(([cl,T])=>{ const f=formule(q('.'+cl).value.replace(/{,}/g,',')); return !!f&&[0,1,2,3,7,10].every(n=>egaux(f(n),P.val(T.p,n))); });
    q('.fa').classList.toggle('juste',res[0]); q('.fb').classList.toggle('juste',res[1]);
    if(res[0]&&res[1]){ st.ok=true; q('.zone-n').hidden=false; const r=d.querySelector('[data-r="n"]'); r.max=S.max; if(st.n>S.max){ r.value=S.max; st.n=S.max; } d.querySelector('[data-v="n"]').textContent=st.n; comparer(); return; }
    st.ok=false; q('.zone-n').hidden=true; T.redessiner();
    v.className='verdict ko'; v.innerHTML='<strong>'+(res[0]?'Le tarif A est juste, pas encore le B.':res[1]?'Le tarif B est juste, pas encore le A.':'Pas encore.')+'</strong><span>Teste ton expression : pour n = 1, puis n = 2, retrouves-tu le prix calculé à la main ? Une partie fixe s\'ajoute une seule fois ; un prix par unité se multiplie par n.</span>';
  }
  puces(q('.choix-sc'),SCENARIOS.map(S=>S.nom),0,i=>{ st.s=i; st.ok=false; q('.fa').value=''; q('.fb').value=''; q('.fa').classList.remove('juste'); q('.fb').classList.remove('juste'); q('.zone-n').hidden=true; g.querySelector('.valeurs-tarifs').innerHTML=''; const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>Écris les deux expressions avec la lettre n (par exemple <code>3n + 5</code>).</span>'; enonce(); T.redessiner(); });
  q('.verifier').addEventListener('click',()=>verifier(false));
  q('.solution').addEventListener('click',()=>verifier(true));
  lier(d,st,{},()=>{ if(st.ok) comparer(); });
  enonce(); q('.verdict').innerHTML='<span>Écris les deux expressions avec la lettre n (par exemple <code>3n + 5</code>).</span>'; T.redessiner(); maths(el);
}

/* =================================================================
   4. LA DISTRIBUTIVITÉ EN RECTANGLES
   ================================================================= */
function rectangles(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'La distributivité en rectangles',
    intro:'L\'aire d\'un grand rectangle est la somme des aires de ses morceaux. C\'est exactement ce que dit la distributivité. Fais varier les longueurs : l\'égalité reste vraie.',
    gauche:'<canvas class="large" role="img" aria-label="Un rectangle découpé en morceaux, avec l\'aire de chaque morceau."></canvas>'});
  d.innerHTML='<div class="champ"><span class="etiq">Le calcul</span><div class="puces mode"></div></div>'+
    reglette(u,'x','Longueur x',1,6,0.5,3)+reglette(u,'k','k',1,5,1,3,'rose')+reglette(u,'a','a',1,5,1,2,'rose')+'<div class="champ-b">'+reglette(u,'b','b',1,5,1,4,'rose')+'</div>'+
    '<label class="case"><input type="checkbox" class="erreur"><span>Montrer l\'erreur classique</span></label>'+
    '<div class="calcul egalite" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={mode:0,erreur:false};
  const T=Toile(g.querySelector('canvas'),T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H);
    const x=st.x, a=st.a, b=st.b, k=st.k;
    const largeur=x+a, hauteur=st.mode?x+b:k;
    const s=Math.min((W-80)/largeur,(H-70)/hauteur), ox=(W-largeur*s)/2+10, oy=(H-hauteur*s)/2+10;
    const F=[css('--b-def-bg'),css('--b-meth-bg'),css('--b-ex-bg'),css('--b-prop-bg')], ink=css('--ink');
    // morceaux : [x0, y0, largeur, hauteur, aire en lettres, valeur]
    const m= st.mode===0 ? [[0,0,x,k,k+'x',k*x],[x,0,a,k,String(k*a),k*a]] :
      [[0,0,x,x,'x²',x*x],[x,0,a,x,a+'x',a*x],[0,x,x,b,b+'x',b*x],[x,x,a,b,String(a*b),a*b]];
    m.forEach((p,i)=>{ c.fillStyle=F[i]; c.fillRect(ox+p[0]*s,oy+p[1]*s,p[2]*s,p[3]*s); c.strokeStyle=ink; c.lineWidth=2; c.strokeRect(ox+p[0]*s,oy+p[1]*s,p[2]*s,p[3]*s);
      etiquette(c,p[4],ox+(p[0]+p[2]/2)*s,oy+(p[1]+p[3]/2)*s,ink,{align:'center',taille:Math.max(14,Math.min(22,s*0.45)),italique:false,halo:F[i]}); });
    // quadrillage d'unités, discret
    c.save(); c.strokeStyle=ink; c.globalAlpha=.12; c.lineWidth=1; c.beginPath();
    for(let i=1;i<largeur;i++){ c.moveTo(ox+i*s,oy); c.lineTo(ox+i*s,oy+hauteur*s); } for(let j=1;j<hauteur;j++){ c.moveTo(ox,oy+j*s); c.lineTo(ox+largeur*s,oy+j*s); } c.stroke(); c.restore();
    if(st.erreur){ // ce que l'erreur oublie, hachuré en rouge
      const oubli= st.mode===0 ? [[x,1,a,k-1]] : [[x,0,a,x],[0,x,x,b]];
      c.save(); c.strokeStyle=css('--ko'); c.lineWidth=2;
      oubli.forEach(r=>{ if(r[2]<=0||r[3]<=0) return; c.save(); c.beginPath(); c.rect(ox+r[0]*s,oy+r[1]*s,r[2]*s,r[3]*s); c.clip(); c.globalAlpha=.75;
        for(let t=-H;t<W;t+=10){ c.beginPath(); c.moveTo(t,0); c.lineTo(t+H,H); c.stroke(); } c.restore(); c.strokeRect(ox+r[0]*s,oy+r[1]*s,r[2]*s,r[3]*s); });
      c.restore(); }
    // cotes
    const mu=css('--muted');
    etiquette(c,'x',ox+x*s/2,oy-12,mu,{align:'center',italique:true,taille:17}); etiquette(c,String(a),ox+(x+a/2)*s,oy-12,mu,{align:'center',taille:17});
    if(st.mode===0) etiquette(c,String(k),ox-12,oy+k*s/2,mu,{align:'right',taille:17});
    else { etiquette(c,'x',ox-12,oy+x*s/2,mu,{align:'right',italique:true,taille:17}); etiquette(c,String(b),ox-12,oy+(x+b/2)*s,mu,{align:'right',taille:17}); }
  });
  function maj(){
    const x=st.x,a=st.a,b=st.b,k=st.k, z=q('.egalite');
    q('.champ-b').hidden=st.mode===0; d.querySelector('[data-r="k"]').closest('.champ').hidden=st.mode===1;
    if(st.mode===0){ const gauche=k*(x+a), droite=k*x+k*a;
      z.innerHTML='<p>$'+k+'(x+'+a+')='+k+'x+'+(k*a)+'$</p><p class="discret">Pour $x='+texN(x)+'$ : $'+k+'\\times('+texN(x)+'+'+a+')='+texN(gauche)+'$ et $'+k+'\\times'+texN(x)+'+'+(k*a)+'='+texN(droite)+'$.</p>'+
        (st.erreur?'<p class="ko">Erreur classique : écrire $'+k+'x+'+a+'$. On oublie de multiplier $'+a+'$ par $'+k+'$ : il manque la partie hachurée, soit $'+(k*a-a)+'$ unités d\'aire.</p>':''); }
    else { const gauche=(x+a)*(x+b), droite=x*x+(a+b)*x+a*b;
      z.innerHTML='<p>$(x+'+a+')(x+'+b+')=x^2+'+a+'x+'+b+'x+'+(a*b)+'=x^2+'+(a+b)+'x+'+(a*b)+'$</p><p class="discret">Pour $x='+texN(x)+'$ : $('+texN(x)+'+'+a+')\\times('+texN(x)+'+'+b+')='+texN(gauche)+'$ et $'+texN(x)+'^2+'+(a+b)+'\\times'+texN(x)+'+'+(a*b)+'='+texN(droite)+'$.</p>'+
        (st.erreur?'<p class="ko">Erreur classique : écrire $x^2+'+(a*b)+'$. On oublie les deux rectangles hachurés, $'+a+'x$ et $'+b+'x$.</p>':''); }
    maths(z); T.redessiner();
  }
  puces(q('.mode'),['$k(x+a)$','$(x+a)(x+b)$'],0,i=>{ st.mode=i; maj(); }); maths(q('.mode'));
  q('.erreur').addEventListener('change',e=>{ st.erreur=e.target.checked; maj(); });
  lier(d,st,{x:v=>nbs(v),k:v=>v,a:v=>v,b:v=>v},maj);
  maj(); maths(el);
}

/* =================================================================
   5. VRAI POUR TOUS LES NOMBRES ?
   ================================================================= */
const PAIRES=[
  {A:'2(x+3)',B:'2x+6',pourquoi:'C\'est la distributivité : $2(x+3)=2\\times x+2\\times3=2x+6$.'},
  {A:'2(x+3)',B:'2x+3',pourquoi:'On a oublié de multiplier le $3$ par $2$.'},
  {A:'x+x',B:'x^2',pourquoi:'$x+x=2x$ (deux fois $x$), alors que $x^2=x\\times x$.'},
  {A:'x\\times x',B:'x^2',pourquoi:'C\'est la définition : $x^2$ veut dire $x\\times x$.'},
  {A:'5x-3x',B:'2x',pourquoi:'On réduit : $5x-3x=(5-3)x=2x$.'},
  {A:'x^2',B:'2x',pourquoi:'Ces expressions sont égales pour $x=0$ et $x=2$… et pour aucun autre nombre. Deux exemples ne prouvent rien.'},
  {A:'(x+1)^2',B:'x^2+1',pourquoi:'$(x+1)^2=(x+1)(x+1)=x^2+2x+1$ : il manque $2x$.'},
  {A:'(x+2)(x+3)',B:'x^2+5x+6',pourquoi:'Double distributivité : $x^2+3x+2x+6=x^2+5x+6$.'},
  {A:'3-(x-1)',B:'4-x',pourquoi:'Le signe $-$ devant la parenthèse change tous les signes : $3-x+1=4-x$.'},
  {A:'3-(x-1)',B:'2-x',pourquoi:'Le signe $-$ change aussi le signe du $-1$ : $3-(x-1)=3-x+1=4-x$.'},
];
const versCalcul=s=>s.replace(/\\times/g,'*');
function egalites(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Vrai pour tous les nombres ?',
    intro:'Deux expressions sont égales si elles donnent le même résultat <strong>pour tous les nombres</strong>. Un seul nombre qui donne deux résultats différents, un <strong>contre-exemple</strong>, suffit à montrer qu\'elles ne sont pas égales.',
    gauche:'<div class="calcul paire" aria-live="polite"></div><div class="defile"><table class="mini-table tests"></table></div>'});
  d.innerHTML='<div class="champ"><span class="etiq">L\'égalité à tester</span><div class="puces choix-paire"></div></div>'+
    '<div class="champ"><label for="'+u+'a">Ou écris la tienne : expression A</label><input type="text" id="'+u+'a" class="formule ea" autocomplete="off" autocapitalize="off" spellcheck="false"></div>'+
    '<div class="champ"><label for="'+u+'b">expression B</label><input type="text" id="'+u+'b" class="formule eb" autocomplete="off" autocapitalize="off" spellcheck="false"></div>'+
    reglette(u,'x','Essaie un nombre x',-5,5,0.5,2)+
    '<div class="ligne"><button type="button" class="btn cent">Tester 100 nombres au hasard</button></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={p:0,fa:null,fb:null,ta:'',tb:'',pourquoi:''};
  const affiche=t=>t.replace(/\*/g,'\\times ').replace(/\^(\d)/g,'^$1');
  function charger(i){ const Pp=PAIRES[i]; st.fa=formule(versCalcul(Pp.A)); st.fb=formule(versCalcul(Pp.B)); st.ta=Pp.A; st.tb=Pp.B; st.pourquoi=Pp.pourquoi; q('.ea').value=''; q('.eb').value=''; maj(true); }
  function lireSaisies(){ const a=q('.ea').value, b=q('.eb').value; if(!a||!b) return;
    const fa=formule(a), fb=formule(b); if(!fa||!fb){ const v=q('.verdict'); v.className='verdict ko'; v.innerHTML='<span>Écris deux expressions avec la même lettre, par exemple <code>3(x - 2)</code> et <code>3x - 6</code>.</span>'; return; }
    st.fa=fa; st.fb=fb; st.ta=affiche(a.replace(/[a-zA-Z]/g,'x')); st.tb=affiche(b.replace(/[a-zA-Z]/g,'x')); st.pourquoi=''; q('.choix-paire').querySelectorAll('.puce').forEach(p=>p.setAttribute('aria-pressed','false')); maj(true); }
  function maj(nouveau){
    const x=st.x, A=st.fa(x), B=st.fb(x), z=g.querySelector('.paire');
    z.innerHTML='<p>$A='+st.ta+'$ &nbsp; et &nbsp; $B='+st.tb+'$</p><p>Pour $x='+texN(x)+'$ : $A='+texN(A)+'$ et $B='+texN(B)+'$ '+(egaux(A,B)?'<span class="juste">égaux</span>':'<span class="ko"><strong>différents</strong></span>')+'</p>';
    const xs=[-3,-2,-1,0,1,2,3];
    g.querySelector('.tests').innerHTML='<thead><tr><th>x</th>'+xs.map(v=>'<th>'+nbs(v)+'</th>').join('')+'</tr></thead><tbody><tr><th>A</th>'+xs.map(v=>'<td>'+nbs(st.fa(v))+'</td>').join('')+'</tr><tr><th>B</th>'+xs.map(v=>'<td class="'+(egaux(st.fa(v),st.fb(v))?'juste':'faux')+'">'+nbs(st.fb(v))+'</td>').join('')+'</tr></tbody>';
    maths(z);
    if(nouveau){ const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>Regarde le tableau, essaie d\'autres nombres, puis décide : égalité toujours vraie, ou pas ?</span>'; }
  }
  q('.cent').addEventListener('click',()=>{
    const v=q('.verdict'); let contre=null;
    // d'abord des entiers simples (un contre-exemple facile à vérifier à la main), puis des nombres au hasard
    [1,2,3,0,-1,-2,-3,4,5,10].forEach(x=>{ if(contre==null&&!egaux(st.fa(x),st.fb(x))) contre=x; });
    for(let i=0;i<100&&contre==null;i++){ const x=Math.round((Math.random()*40-20)*10)/10; if(!egaux(st.fa(x),st.fb(x))) contre=x; }
    if(contre==null){ v.className='verdict ok'; v.innerHTML='<strong>Égales pour les 100 nombres testés.</strong><span>C\'est un très bon indice, mais pas encore une preuve : on ne peut pas tester tous les nombres. La preuve se fait par le calcul littéral. '+st.pourquoi+'</span>'; }
    else { v.className='verdict ko'; v.innerHTML='<strong>Contre-exemple : $x='+texN(contre)+'$.</strong><span>$A='+texN(st.fa(contre))+'$ mais $B='+texN(st.fb(contre))+'$. Un seul contre-exemple suffit : l\'égalité n\'est pas vraie pour tous les nombres. '+st.pourquoi+'</span>'; }
    maths(v); });
  ['.ea','.eb'].forEach(s=>q(s).addEventListener('change',lireSaisies));
  puces(q('.choix-paire'),PAIRES.map(Pp=>'$'+Pp.A+'='+Pp.B+'$'),0,charger); maths(q('.choix-paire'));
  lier(d,st,{x:v=>nbs(v)},()=>maj(false));
  charger(0); maths(el);
}

window.LABOS=window.LABOS||{};
window.LABOS.litteral={motifs,programme,forfaits,rectangles,egalites};
})();
