/* =====================================================================
   GÉNÉRATEURS — chapitre « Diffraction et interférences » (terminale PC)
   Même format que les autres générateurs :
     { enonce, type:'nombre'|'qcm', reponse, choix, explication, tolerance, media }
   Les réponses numériques sont acceptées à quelques pour cent près
   (tolerance absolue calculée à partir de la valeur exacte).
   ===================================================================== */
(function(){
"use strict";
const hasard=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const prendre=a=>a[Math.floor(Math.random()*a.length)];
const melanger=a=>{ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
function qcm(bonne,reserve,n){ const autres=melanger([...new Set(reserve)].filter(r=>r!==bonne)).slice(0,(n||4)-1); const choix=melanger([bonne,...autres]); return {type:'qcm',choix,reponse:choix.indexOf(bonne)}; }
/* nombre arrondi, écrit à la française : 6,5 · en LaTeX : 6{,}5 */
const fr=(v,d)=>String(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).replace('.',',');
const tex=(v,d)=>fr(v,d==null?3:d).replace(',','{,}');
/* réponse numérique : valeur arrondie, tolérance relative */
const num=(v,d,rel)=>({type:'nombre',reponse:fr(v,d),tolerance:Math.max(Math.abs(v)*(rel||0.03),0.5*Math.pow(10,-d))});

/* ----- 1. Reconnaître le phénomène ----- */
const SITUATIONS=[
  ['On entend la musique de la pièce voisine par la porte entrouverte, sans voir les musiciens.','diffraction','Le son ($\\lambda\\approx1$ m) est comparable à la largeur de la porte : il s\'étale derrière elle. La lumière ($\\lambda\\approx0{,}5$ µm) ne diffracte presque pas.'],
  ['Le faisceau d\'un laser s\'élargit après avoir traversé une fente très fine.','diffraction','Une seule onde traverse une petite ouverture et s\'étale : c\'est la diffraction.'],
  ['La houle pénètre par l\'entrée étroite d\'un port et s\'étale en arcs de cercle dans le bassin.','diffraction','L\'entrée du port est une ouverture de taille comparable à la longueur d\'onde de la houle.'],
  ['On capte une radio grandes ondes derrière une colline.','diffraction','Les ondes radio de grande longueur d\'onde (plusieurs centaines de mètres) contournent les obstacles.'],
  ['Une bulle de savon présente des reflets colorés.','interférences','Les ondes réfléchies sur les deux faces du film se superposent : selon l\'épaisseur, certaines couleurs sont renforcées, d\'autres éteintes.'],
  ['Un casque émet une onde sonore en opposition de phase avec le bruit extérieur.','interférences','Bruit et « anti-bruit » se superposent : interférences destructives.'],
  ['Deux haut-parleurs branchés sur le même générateur : en se déplaçant, on entend le son faiblir puis se renforcer.','interférences','Deux sources synchrones : selon la différence de marche, les ondes arrivent en phase ou en opposition de phase.'],
  ['Deux fentes très proches éclairées par un laser donnent des bandes brillantes et sombres régulières.','interférences','C\'est l\'expérience des fentes d\'Young : les deux ondes issues des fentes se superposent.'],
  ['Un crayon plongé dans un verre d\'eau paraît brisé.','ni l\'un ni l\'autre','C\'est la réfraction : la lumière change de direction en changeant de milieu. Ni diffraction, ni interférences.'],
];
function phenomene(){ const [s,rep,exp]=prendre(SITUATIONS);
  return Object.assign(qcm(rep,['diffraction','interférences','ni l\'un ni l\'autre'],3),{enonce:s+' Quel phénomène est en jeu ?',explication:exp}); }

/* ----- 2. Repères et unités ----- */
function reperes(){
  const t=hasard(0,4);
  if(t===0) return Object.assign(qcm('entre 400 et 800 nm',['entre 400 et 800 µm','entre 400 et 800 mm','entre 4 et 8 nm']),{enonce:'Quelles sont les longueurs d\'onde de la lumière visible ?',explication:'Du violet (environ 400 nm) au rouge (environ 800 nm), soit $4\\times10^{-7}$ à $8\\times10^{-7}$ m.'});
  if(t===1){ const f=prendre([170,340,680]); return Object.assign(qcm(fr(340/f,1)+' m',[fr(340/f/10,2)+' m',fr(340/f*10,0)+' m',fr(340*f,0)+' m']),{enonce:'Un son de fréquence '+f+' Hz se propage dans l\'air à 340 m/s. Quelle est sa longueur d\'onde ?',explication:'$\\lambda=\\dfrac{v}{f}=\\dfrac{340}{'+f+'}='+tex(340/f,1)+'$ m : du même ordre que la largeur d\'une porte, d\'où une diffraction marquée.'}); }
  if(t===2) return Object.assign(qcm('en radians',['en degrés','en mètres','sans unité, en %']),{enonce:'Dans la relation $\\theta=\\dfrac{\\lambda}{a}$, en quelle unité obtient-on $\\theta$ ?',explication:'$\\lambda$ et $a$ sont des longueurs dans la même unité : leur quotient donne un angle en radians. Pour des degrés, multiplier par $\\frac{180}{\\pi}$.'});
  if(t===3) return Object.assign(qcm('quand $a$ est de l\'ordre de $\\lambda$ ou plus petit',['quand $a$ est très grand devant $\\lambda$','seulement pour la lumière','quand $a$ vaut exactement $2\\lambda$']),{enonce:'Quand la diffraction par une ouverture de largeur $a$ est-elle la plus marquée ?',explication:'Plus $a$ est petit devant $\\lambda$, plus l\'onde s\'étale. Quand $a\\lesssim\\lambda$, elle repart dans toutes les directions.'});
  const [v,u,e]=prendre([['650 nm','6{,}5\\times10^{-7}','m'],['80 µm','8\\times10^{-5}','m'],['0,25 mm','2{,}5\\times10^{-4}','m'],['532 nm','5{,}32\\times10^{-7}','m']]);
  const faux=u.replace(/-(\d+)/,(m,k)=>'-'+(+k+3)), faux2=u.replace(/-(\d+)/,(m,k)=>'-'+(+k-3)), faux3=u.replace(/-(\d+)/,(m,k)=>'-'+(+k+1));
  return Object.assign(qcm('$'+u+'$ '+e,['$'+faux+'$ '+e,'$'+faux2+'$ '+e,'$'+faux3+'$ '+e]),{enonce:'Convertis '+v+' en mètres.',explication:'nm = $10^{-9}$ m, µm = $10^{-6}$ m, mm = $10^{-3}$ m. Donc '+v+' $='+u+'$ m.'});
}

/* ----- 3. Écart angulaire θ = λ/a ----- */
function ecartAngulaire(){
  const l=prendre([405,450,532,589,633,650]), a=prendre([40,50,60,80,100,120,150,200]);
  const th=l/a; // λ en nm / a en µm = θ en mrad
  return Object.assign(num(th,2),{enonce:'Une fente de largeur $a='+a+'$ µm est éclairée par un laser de longueur d\'onde $\\lambda='+l+'$ nm. Calcule l\'écart angulaire $\\theta$ en milliradians ($10^{-3}$ rad).',
    explication:'$\\theta=\\dfrac{\\lambda}{a}=\\dfrac{'+l+'\\times10^{-9}}{'+a+'\\times10^{-6}}='+tex(th,2)+'\\times10^{-3}$ rad. Attention aux puissances de 10 : nm et µm ne sont pas la même unité.'}); }

/* ----- 4. Largeur de la tache centrale L = 2λD/a ----- */
function tache(){
  const l=prendre([450,532,633,650]), a=prendre([50,80,100,120,150,200]), D=prendre([1,1.2,1.5,2,2.5]);
  const L=2*l*D/a; // mm
  return Object.assign(num(L,1),{enonce:'Laser $\\lambda='+l+'$ nm, fente $a='+a+'$ µm, écran à $D='+tex(D,1)+'$ m. Calcule la largeur $L$ de la tache centrale, en mm.',
    explication:'$\\theta=\\dfrac{\\lambda}{a}='+tex(l/a,2)+'\\times10^{-3}$ rad, puis $L=2D\\theta=2\\times'+tex(D,1)+'\\times'+tex(l/a,2)+'\\times10^{-3}='+tex(L,1)+'\\times10^{-3}$ m, soit '+fr(L,1)+' mm. Ne pas oublier le facteur 2 : $L$ est la largeur totale.'}); }

/* ----- 5. Remonter à λ ou à a ----- */
function inverse(){
  if(Math.random()<0.5){ // trouver λ
    const l=prendre([450,520,560,600,640,660]), a=prendre([50,80,100,120]), D=prendre([1.5,2]); const L=Math.round(2*l*D/a*10)/10, lv=L*a/(2*D);
    return Object.assign(num(lv,0,0.03),{enonce:'Avec une fente de $a='+a+'$ µm et un écran à $D='+tex(D,1)+'$ m, on mesure une tache centrale de $L='+tex(L,1)+'$ mm. Calcule $\\lambda$ en nm.',
      explication:'$\\theta=\\dfrac{L}{2D}=\\dfrac{'+tex(L,1)+'\\times10^{-3}}{2\\times'+tex(D,1)+'}$, puis $\\lambda=a\\,\\theta=\\dfrac{a\\,L}{2D}='+fr(lv,0)+'\\times10^{-9}$ m, soit environ '+fr(lv,0)+' nm.'}); }
  const l=prendre([532,650]), a=prendre([60,70,80,90,100]), D=prendre([1.5,2]); const L=Math.round(2*l*D/a), av=2*l*D/L;
  return Object.assign(num(av,0,0.04),{enonce:'On éclaire un cheveu avec un laser $\\lambda='+l+'$ nm. Sur un écran à $D='+tex(D,1)+'$ m, la tache centrale mesure $L='+L+'$ mm. Calcule le diamètre $a$ du cheveu, en µm.',
    explication:'Un fil donne la même figure qu\'une fente de même largeur. $\\theta=\\dfrac{L}{2D}$ et $a=\\dfrac{\\lambda}{\\theta}=\\dfrac{2\\lambda D}{L}='+fr(av,0)+'\\times10^{-6}$ m, soit environ '+fr(av,0)+' µm.'}); }

/* ----- 6. Comment évolue… ? ----- */
const EVOL=[
  ['On divise par 2 la largeur $a$ de la fente. La largeur $L$ de la tache centrale…','est multipliée par 2','$L=\\dfrac{2\\lambda D}{a}$ est inversement proportionnelle à $a$ : une fente deux fois plus fine donne une tache deux fois plus large.'],
  ['On double la distance $D$ entre la fente et l\'écran. La largeur $L$ de la tache centrale…','est multipliée par 2','$L=\\dfrac{2\\lambda D}{a}$ est proportionnelle à $D$.'],
  ['On double la distance $D$ entre la fente et l\'écran. L\'écart angulaire $\\theta$…','ne change pas','$\\theta=\\dfrac{\\lambda}{a}$ ne dépend pas de $D$ : seul l\'écran s\'éloigne, l\'angle reste le même (la tache s\'agrandit).'],
  ['On remplace un laser rouge par un laser vert, sans rien changer d\'autre. La tache centrale…','rétrécit','$\\lambda_{vert}&lt;\\lambda_{rouge}$ et $L$ est proportionnelle à $\\lambda$ : la tache est plus étroite.'],
  ['Fentes d\'Young : on écarte les deux fentes ($b$ doublé). L\'interfrange $i$…','est divisé par 2','$i=\\dfrac{\\lambda D}{b}$ est inversement proportionnel à $b$ : des fentes plus écartées donnent des franges plus serrées.'],
  ['Fentes d\'Young : on recule l\'écran ($D$ multiplié par 3). L\'interfrange $i$…','est multiplié par 3','$i=\\dfrac{\\lambda D}{b}$ est proportionnel à $D$.'],
  ['Fentes d\'Young : on passe d\'un laser bleu à un laser rouge. Les franges…','s\'écartent','$i$ est proportionnel à $\\lambda$, et $\\lambda_{rouge}&gt;\\lambda_{bleu}$.'],
  ['Fentes d\'Young : on bouche une des deux fentes. Les franges d\'interférences…','disparaissent','Il n\'y a plus qu\'une onde : pas de superposition, donc pas d\'interférences. Il reste la figure de diffraction de la fente ouverte.'],
];
function evolution(){ const [e,rep,exp]=prendre(EVOL);
  const genre=/divisée|multipliée|rétrécit|élargit/.test(rep)?['est multipliée par 2','est divisée par 2','ne change pas','rétrécit','s\'élargit','est multipliée par 4']:
    /divisé|multiplié/.test(rep)?['est multiplié par 2','est divisé par 2','est multiplié par 3','ne change pas','est divisé par 3']:
    rep==='ne change pas'?['ne change pas','est multiplié par 2','est divisé par 2']:['s\'écartent','se resserrent','disparaissent','sont inchangées'];
  return Object.assign(qcm(rep,genre),{enonce:e,explication:exp}); }

/* ----- 7. Constructives ou destructives ? ----- */
function conditions(){
  const son=Math.random()<0.35;
  const C='constructives', Dd='destructives', N='ni l\'un ni l\'autre';
  const m=prendre([0,1,2,3,0.5,1.5,2.5,0.25,1.25,0.75]);
  const verdict=Number.isInteger(m)?C:Number.isInteger(m-0.5)?Dd:N;
  if(son){ const f=prendre([340,680,850,1700]), lam=340/f, d1=prendre([1.5,2,2.5,3]), dl=m*lam, d2=d1+dl;
    return Object.assign(qcm(verdict,[C,Dd,N],3),{enonce:'Deux haut-parleurs synchrones émettent un son de '+f+' Hz ($v=340$ m/s). Un micro est à $d_1='+tex(d1,2)+'$ m de l\'un et $d_2='+tex(d2,3)+'$ m de l\'autre. Les interférences y sont…',
      explication:'$\\lambda=\\dfrac{v}{f}='+tex(lam,3)+'$ m et $\\delta=d_2-d_1='+tex(dl,3)+'$ m, donc $\\dfrac{\\delta}{\\lambda}='+tex(m,2)+'$. '+(verdict===C?'Nombre entier : ondes en phase.':verdict===Dd?'Demi-entier : ondes en opposition de phase.':'Ni entier ni demi-entier : situation intermédiaire.')}); }
  const lam=prendre([0.8,1,1.2,1.6,2]), d1=hasard(30,80)/10, dl=m*lam, d2=d1+dl;
  return Object.assign(qcm(verdict,[C,Dd,N],3),{enonce:'Cuve à ondes, deux sources synchrones, $\\lambda='+tex(lam,1)+'$ cm. Un point M est à $d_1='+tex(d1,1)+'$ cm et $d_2='+tex(d2,2)+'$ cm des sources. Les interférences en M sont…',
    explication:'$\\delta=d_2-d_1='+tex(dl,2)+'$ cm, donc $\\dfrac{\\delta}{\\lambda}='+tex(m,2)+'$. '+(verdict===C?'C\'est un entier : $\\delta=k\\lambda$, interférences constructives.':verdict===Dd?'C\'est un demi-entier : $\\delta=(k+\\frac12)\\lambda$, interférences destructives.':'Ni entier, ni demi-entier : ni constructif, ni destructif.')}); }

/* ----- 8. Interfrange i = λD/b ----- */
function interfrange(){
  const l=prendre([405,473,532,589,633,650]), b=prendre([0.2,0.25,0.3,0.4,0.5]), D=prendre([1,1.5,2,2.5]);
  const i=l*D/b/1000; // mm
  return Object.assign(num(i,2),{enonce:'Fentes d\'Young : $\\lambda='+l+'$ nm, $b='+tex(b,2)+'$ mm, $D='+tex(D,1)+'$ m. Calcule l\'interfrange $i$ en mm.',
    explication:'$i=\\dfrac{\\lambda D}{b}=\\dfrac{'+l+'\\times10^{-9}\\times'+tex(D,1)+'}{'+tex(b,2)+'\\times10^{-3}}='+tex(i,2)+'\\times10^{-3}$ m, soit '+fr(i,2)+' mm.'}); }

/* ----- 9. Lire une figure de franges et remonter à λ ----- */
function franges(n,i){ // bande de franges en SVG (couleurs par classes CSS), n interfranges repérés
  const W=320,H=92,px=W/((n+3)*i), x0=W/2-n*i/2*px;
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="franges-svg" role="img" aria-label="Franges d\'interférences, avec un repère couvrant plusieurs interfranges."><rect class="ecran-fond" x="0" y="0" width="'+W+'" height="52" rx="6"/>';
  for(let p=0;p<W;p+=2){ const x=(p+1-W/2)/px, v=Math.pow(Math.cos(Math.PI*x/i),2); if(v>0.04) s+='<rect class="frange" x="'+p+'" y="0" width="2.2" height="52" opacity="'+Math.sqrt(v).toFixed(2)+'"/>'; }
  const xa=x0, xb=x0+n*i*px;
  s+='<g class="trace t-v"><line x1="'+xa+'" y1="60" x2="'+xb+'" y2="60"/><line x1="'+xa+'" y1="54" x2="'+xa+'" y2="66"/><line x1="'+xb+'" y1="54" x2="'+xb+'" y2="66"/></g>';
  return s+'</svg>';
}
function youngInverse(){
  const l=prendre([450,473,532,543,594,633,650]), b=prendre([0.2,0.25,0.3,0.4]), D=prendre([1.5,2]), n=hasard(4,7);
  const i=l*D/b/1000, X=Math.round(n*i*10)/10, lv=X/n*b/D*1000;
  return Object.assign(num(lv,0,0.03),{enonce:'Sur la figure, le repère rose couvre plusieurs interfranges et mesure '+fr(X,1)+' mm. Avec $b='+tex(b,2)+'$ mm et $D='+tex(D,1)+'$ m, calcule $\\lambda$ en nm.',
    media:franges(n,i)+'<p class="discret">Compte les interfranges entre les deux traits (d\'un centre de frange brillante au suivant).</p>',
    explication:'On compte '+n+' interfranges : $i=\\dfrac{'+tex(X,1)+'}{'+n+'}='+tex(X/n,3)+'$ mm. Puis $\\lambda=\\dfrac{i\\,b}{D}=\\dfrac{'+tex(X/n,3)+'\\times10^{-3}\\times'+tex(b,2)+'\\times10^{-3}}{'+tex(D,1)+'}\\approx'+fr(lv,0)+'\\times10^{-9}$ m.'}); }

window.GENERATEURS=window.GENERATEURS||{};
window.GENERATEURS['ondes']={
  types:{'phenomene':phenomene,'reperes':reperes,'ecart-angulaire':ecartAngulaire,'tache':tache,'inverse':inverse,'evolution':evolution,'conditions':conditions,'interfrange':interfrange,'lecture-franges':youngInverse},
  categories:{'phenomene':'Reconnaître le phénomène','reperes':'Repères et unités','ecart-angulaire':'Écart angulaire θ = λ/a','tache':'Tache centrale','inverse':'Remonter à λ ou à a','evolution':'Prévoir une évolution','conditions':'Constructives ou destructives','interfrange':'Interfrange','lecture-franges':'Lire une figure de franges'},
  ordre:['phenomene','reperes','ecart-angulaire','tache','inverse','evolution','conditions','conditions','interfrange','lecture-franges'],
};
})();
