/* =====================================================================
   GÉNÉRATEURS — chapitre « L'électricité dans l'habitat » (première ST2S)
   Même format que les autres générateurs :
     { enonce, type:'nombre'|'qcm', reponse, choix, explication, tolerance, media }
   Au programme : exploiter un oscillogramme (T, f, Umax, Ueff), les fils, les
   risques pour le corps, les protections, les règles de sécurité, I = P/U.
   ===================================================================== */
(function(){
"use strict";
const hasard=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const prendre=a=>a[Math.floor(Math.random()*a.length)];
const melanger=a=>{ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
function qcm(bonne,reserve,n){ const autres=melanger([...new Set(reserve)].filter(r=>r!==bonne)).slice(0,(n||4)-1); const choix=melanger([bonne,...autres]); return {type:'qcm',choix,reponse:choix.indexOf(bonne)}; }
const fr=(v,d)=>String(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).replace('.',',');
const tex=(v,d)=>fr(v,d==null?3:d).replace(',','{,}');
const num=(v,d,rel)=>({type:'nombre',reponse:fr(v,d),tolerance:Math.max(Math.abs(v)*(rel||0.03),0.5*Math.pow(10,-d))});
/* « 1 800 W » : espace fine entre les milliers */
const mil=v=>String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f');

/* ----- un oscillogramme en SVG : 10 divisions × 8, une sinusoïde ----- */
function oscillogramme(msdiv,vdiv,Umax,f,continu){
  const W=340,H=272,m=10,w=W-2*m,h=H-2*m,dx=w/10,dy=h/8;
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="oscillo-svg" role="img" aria-label="Oscillogramme : '+(continu?'une ligne horizontale':'une sinusoïde')+' sur un écran de 10 divisions sur 8. Base de temps '+fr(msdiv,0)+' ms par division, sensibilité '+fr(vdiv,0)+' V par division.">';
  s+='<rect class="fond-carte" x="'+m+'" y="'+m+'" width="'+w+'" height="'+h+'" rx="6"/><g class="quadrillage">';
  for(let i=1;i<10;i++) s+='<line x1="'+(m+i*dx).toFixed(1)+'" y1="'+m+'" x2="'+(m+i*dx).toFixed(1)+'" y2="'+(m+h)+'"/>';
  for(let j=1;j<8;j++) s+='<line x1="'+m+'" y1="'+(m+j*dy).toFixed(1)+'" x2="'+(m+w)+'" y2="'+(m+j*dy).toFixed(1)+'"/>';
  s+='</g><g class="trace t-n"><line x1="'+m+'" y1="'+(m+4*dy)+'" x2="'+(m+w)+'" y2="'+(m+4*dy)+'"/><line x1="'+(m+5*dx)+'" y1="'+m+'" x2="'+(m+5*dx)+'" y2="'+(m+h)+'"/></g>';
  let p='';
  for(let i=0;i<=200;i++){ const t=(i/200)*10*msdiv/1000; const v=continu?Umax:Umax*Math.sin(2*Math.PI*f*t); const x=m+i/200*w, y=m+4*dy-v/vdiv*dy; p+=(i?' L':'M')+x.toFixed(1)+' '+y.toFixed(1); }
  s+='<g class="trace t-u"><path d="'+p+'"/></g>';
  s+='<text class="petit" x="'+(m+6)+'" y="'+(m+16)+'">'+fr(msdiv,0)+' ms/div · '+fr(vdiv,0)+' V/div</text></svg>';
  return s;
}
/* réglages qui donnent un ou deux motifs entiers et des sommets lisibles */
const RESEAUX=[
  {nom:'une prise française',U:230,f:50},{nom:'une prise française',U:230,f:50},{nom:'une prise aux États-Unis',U:120,f:60},
  {nom:'une prise au Japon (région de Tokyo)',U:100,f:50},{nom:'le générateur du labo',U:6,f:50},{nom:'le générateur du labo',U:12,f:100},{nom:'le générateur du labo',U:4,f:250}];
function reglages(r){ const Umax=r.U*Math.SQRT2; const T=1000/r.f;
  const ms=prendre([1,2,5,10,20].filter(b=>{ const n=10*b/T; return n>=1&&n<=2.6; })) || T/5;
  const vd=prendre([1,2,5,10,20,50,100,200].filter(v=>Umax/v>=1.6&&Umax/v<=3.9)) || Umax/3;
  return {ms,vd,Umax,T}; }

/* ----- 1. Lire un oscillogramme ----- */
function lireOscillogramme(){
  const r=prendre(RESEAUX), g=reglages(r), media=oscillogramme(g.ms,g.vd,g.Umax,r.f,false);
  const quoi=prendre(['T','T','f','Umax','Umax','Ueff']);
  const nT=g.T/g.ms, nU=g.Umax/g.vd;
  const lecT='Un motif complet occupe '+tex(nT,1)+' divisions : $T='+tex(nT,1)+'\\times'+fr(g.ms,0)+'='+tex(g.T,1)+'$ ms.';
  const lecU='Le sommet est à '+tex(nU,1)+' divisions au-dessus de l\'axe : $U_{max}='+tex(nU,1)+'\\times'+fr(g.vd,0)+'\\approx'+fr(g.Umax,0)+'$ V.';
  if(quoi==='T') return Object.assign(num(g.T,1,0.06),{enonce:'Cet oscillogramme est celui de '+r.nom+'. Base de temps : '+fr(g.ms,0)+' ms par division. Quelle est la période $T$, en ms ?',media,explication:lecT+' La période, c\'est la durée d\'un motif : d\'un sommet au sommet suivant, pas d\'un passage par zéro au suivant (ce serait la demi-période).'});
  if(quoi==='f') return Object.assign(num(r.f,0,0.06),{enonce:'Cet oscillogramme est celui de '+r.nom+' ('+fr(g.ms,0)+' ms par division). Quelle est la fréquence $f$, en Hz ?',media,explication:lecT+' Puis $f=\\dfrac1T=\\dfrac{1}{'+tex(g.T/1000,4)+'}='+r.f+'$ Hz, en mettant $T$ en secondes.'});
  if(quoi==='Umax') return Object.assign(num(g.Umax,0,0.06),{enonce:'Cet oscillogramme est celui de '+r.nom+'. Sensibilité : '+fr(g.vd,0)+' V par division. Quelle est la tension maximale $U_{max}$, en V ?',media,explication:lecU});
  return Object.assign(num(r.U,0,0.06),{enonce:'Cet oscillogramme est celui de '+r.nom+' ('+fr(g.vd,0)+' V par division). Quelle valeur efficace, en V, afficherait un voltmètre ?',media,explication:lecU+' Puis $U_{eff}=\\dfrac{U_{max}}{\\sqrt2}=\\dfrac{'+fr(g.Umax,0)+'}{1{,}41}\\approx'+r.U+'$ V.'});
}

/* ----- 2. Période et fréquence ----- */
function frequence(){
  const cas=hasard(0,3);
  if(cas===0){ const T=prendre([20,10,16.7,5,4,2,50,100]); const f=1000/T; return Object.assign(num(f,f<1?2:(f<20?1:0),0.03),{enonce:'Une tension alternative a une période $T='+tex(T,1)+'$ ms. Quelle est sa fréquence, en Hz ?',explication:'$f=\\dfrac1T$ avec $T$ en secondes : $f=\\dfrac{1}{'+tex(T/1000,4)+'}\\approx'+fr(f,1)+'$ Hz. Une fréquence, c\'est un nombre de motifs par seconde.'}); }
  if(cas===1){ const f=prendre([50,60,100,25,200,400,1000]); const T=1000/f; return Object.assign(num(T,T<5?2:1,0.03),{enonce:'Une tension alternative a une fréquence $f='+f+'$ Hz. Quelle est sa période, en ms ?',explication:'$T=\\dfrac1f=\\dfrac{1}{'+f+'}='+tex(T/1000,4)+'$ s $='+tex(T,T<5?2:1)+'$ ms. En une seconde, il y a '+f+' motifs, donc chacun dure $1/'+f+'$ s.'}); }
  if(cas===2){ const n=prendre([2,3,4,5,10]); const f=prendre([50,60]); const d=n*1000/f; return Object.assign(num(d,0,0.03),{enonce:'Le secteur a une fréquence de '+f+' Hz. Combien de temps durent '+n+' périodes, en ms ?',explication:'Une période dure $T=1/'+f+'='+tex(1000/f,1)+'$ ms, donc '+n+' périodes durent $'+n+'\\times'+tex(1000/f,1)+'='+fr(d,0)+'$ ms. (Un différentiel qui coupe en 40 ms coupe en deux périodes.)'}); }
  return Object.assign(qcm('50 fois',['50 fois','100 fois','230 fois','une fois','20 fois']),{enonce:'En France, combien de fois par seconde la tension du secteur décrit-elle un motif complet (une bosse et un creux) ?',explication:'La fréquence du secteur est 50 Hz : 50 motifs par seconde, chacun durant 20 ms. La tension s\'annule donc 100 fois par seconde (deux fois par motif).'});
}

/* ----- 3. Valeur maximale, valeur efficace ----- */
function valeurs(){
  const cas=hasard(0,3);
  if(cas===0){ const U=prendre([230,120,100,240,12,6,24]); const Um=U*Math.SQRT2; return Object.assign(num(Um,0,0.03),{enonce:'Un voltmètre affiche $U_{eff}='+U+'$ V aux bornes d\'une prise. Quelle est la tension maximale $U_{max}$, en V ?',explication:'$U_{max}=U_{eff}\\times\\sqrt2='+U+'\\times1{,}41\\approx'+fr(Um,0)+'$ V. La tension efficace est celle affichée et écrite sur les appareils ; la tension maximale est le sommet de la sinusoïde, plus haut.'}); }
  if(cas===1){ const Um=prendre([325,170,141,339,17,8.5,34]); const U=Um/Math.SQRT2; return Object.assign(num(U,0,0.03),{enonce:'Sur un oscillogramme, la tension maximale vaut $U_{max}='+fr(Um,1)+'$ V. Quelle est la valeur efficace, en V ?',explication:'$U_{eff}=\\dfrac{U_{max}}{\\sqrt2}=\\dfrac{'+fr(Um,1)+'}{1{,}41}\\approx'+fr(U,0)+'$ V. C\'est la valeur « utile » : une tension continue de '+fr(U,0)+' V chaufferait autant un radiateur.'}); }
  if(cas===2) return Object.assign(qcm('la valeur efficace, 230 V',['la valeur efficace, 230 V','la valeur maximale, 325 V','la valeur moyenne, 0 V','la valeur minimale, −325 V']),{enonce:'Sur une prise française, un voltmètre en mode alternatif affiche « 230 V ». De quelle valeur s\'agit-il ?',explication:'Un voltmètre affiche la valeur efficace. La sinusoïde monte en réalité jusqu\'à 325 V et descend à −325 V, et sa moyenne est nulle : « 230 V » est la valeur efficace, celle qui compte pour l\'énergie.'});
  return Object.assign(qcm('Umax = Ueff × √2',['Umax = Ueff × √2','Umax = Ueff × 2','Umax = Ueff ÷ √2','Umax = Ueff']),{enonce:'Quelle relation lie la tension maximale et la tension efficace d\'une tension sinusoïdale ?',explication:'$U_{max}=U_{eff}\\sqrt2$, soit $U_{eff}=U_{max}/\\sqrt2$. Pour 230 V efficaces : $U_{max}\\approx325$ V.'});
}

/* ----- 4. Les trois fils ----- */
const FILS=[['phase','rouge, marron ou noir','apporte le courant : il est sous tension, 230 V par rapport à la terre'],['neutre','bleu','ferme le circuit : le courant revient par lui, il est au potentiel de la terre'],['terre','vert et jaune','relie la carcasse métallique au sol : il évacue le courant en cas de défaut']];
function fils(){
  const cas=hasard(0,3), [nom,coul,role]=prendre(FILS);
  if(cas===0) return Object.assign(qcm(coul,FILS.map(f=>f[1]).concat(['blanc'])),{enonce:'De quelle couleur est le fil de <strong>'+nom+'</strong> dans une installation française ?',explication:'Le fil de '+nom+' est '+coul+'. Phase : rouge, marron ou noir ; neutre : bleu ; terre : vert et jaune. Ces couleurs sont imposées pour qu\'un électricien ne se trompe jamais.'});
  if(cas===1) return Object.assign(qcm(nom,FILS.map(f=>f[0])),{enonce:'Un fil '+coul+' : lequel est-ce ?',explication:'Le fil '+coul+', c\'est le fil de '+nom+' : il '+role+'.'});
  if(cas===2) return Object.assign(qcm(nom,FILS.map(f=>f[0])),{enonce:'Quel fil '+role+' ?',explication:'C\'est le fil de '+nom+' ('+coul+').'});
  return Object.assign(qcm('la phase',['la phase','le neutre','la terre','aucun des trois']),{enonce:'Un seul des trois fils est dangereux à toucher dans une installation en bon état. Lequel ?',explication:'La phase est à 230 V par rapport à la terre : la toucher pieds au sol, c\'est se mettre en travers des 230 V. Le neutre et la terre sont au potentiel du sol : les toucher ne fait rien (en bon état… ne le vérifiez pas).'});
}

/* ----- 5. Reconnaître le risque ----- */
const RISQUES=[
  ['Une aide-soignante reçoit une secousse en débranchant un appareil : sa main se contracte, puis elle lâche. Elle est choquée mais indemne.','une électrisation','Le courant a traversé le corps sans tuer : c\'est une électrisation. Elle doit être examinée (le cœur peut réagir plus tard).'],
  ['Un courant traverse le thorax d\'une personne pendant plusieurs secondes ; son cœur se met à battre de façon anarchique et s\'arrête.','une électrocution','Fibrillation puis arrêt cardiaque : quand l\'électrisation est mortelle, on parle d\'électrocution.'],
  ['Un fil trop fin alimente un radiateur : il chauffe, l\'isolant fond, le mur noircit.','un incendie d\'origine électrique','Effet Joule : trop de courant dans un fil le fait chauffer. C\'est la cause d\'incendie que le disjoncteur doit empêcher.'],
  ['Un enfant met une pièce de monnaie dans une prise : une étincelle, et un point noir sur ses doigts.','une brûlure électrique','L\'arc électrique au point de contact brûle la peau ; le courant n\'a pas forcément traversé le corps.'],
  ['Une personne touche une rallonge dénudée les mains mouillées dans la salle de bain et ne peut plus lâcher.','une électrocution','Mains mouillées, la résistance du corps chute à environ 1 000 Ω : plus de 200 mA. Au-dessus de 10 mA on ne peut plus lâcher ; c\'est mortel en quelques secondes si rien ne coupe.'],
  ['Trois radiateurs et une bouilloire sur la même multiprise : la multiprise devient brûlante.','un incendie d\'origine électrique','La multiprise est traversée par bien plus que les 16 A prévus : surcharge, chauffe, risque d\'incendie.'],
];
function risques(){ const cas=hasard(0,2);
  if(cas<2){ const [s,rep,exp]=prendre(RISQUES); return Object.assign(qcm(rep,RISQUES.map(r=>r[1])),{enonce:s+' Comment nomme-t-on cet accident ?',explication:exp}); }
  return Object.assign(qcm('le passage du courant par le cœur',['le passage du courant par le cœur','la tension seule','la durée seule','la chaleur dégagée']),{enonce:'Qu\'est-ce qui rend un trajet main-main ou main-pied particulièrement dangereux ?',explication:'Ce qui tue, c\'est le courant qui traverse le thorax : il peut déclencher une fibrillation ventriculaire. Un trajet main-main ou main-pied passe par le cœur. Ensuite comptent l\'intensité et la durée.'}); }

/* ----- 6. Seuils d'intensité ----- */
function seuils(){
  const cas=hasard(0,3);
  if(cas===0){ const R=prendre([1000,1000,2000,100000,50000]); const I=230/R*1000; return Object.assign(num(I,I<1?2:(I<10?1:0),0.03),{enonce:'Une personne touche la phase (230 V), pieds au sol. La résistance de son corps vaut '+mil(R)+' Ω'+(R<=2000?' (peau mouillée)':' (peau sèche)')+'. Quelle intensité la traverse, en mA ?',explication:'$I=\\dfrac UR=\\dfrac{230}{'+mil(R)+'}='+tex(230/R,4)+'$ A $='+fr(I,1)+'$ mA. '+(I>75?'Bien au-dessus de 30 mA : fibrillation possible, probable au-delà de 75 mA. Mortel si rien ne coupe.':I>10?'Au-dessus de 10 mA : contraction, impossible de lâcher. Dangereux si cela dure.':'Quelques milliampères : une secousse, désagréable mais sans gravité. Avec la peau mouillée, ce serait tout autre chose.')}); }
  if(cas===1) return Object.assign(qcm('30 mA',['30 mA','16 A','230 V','1 mA','10 A']),{enonce:'À partir de quelle intensité un courant traversant le corps est-il considéré comme dangereux (risque de fibrillation) ? C\'est aussi le seuil des différentiels domestiques.',explication:'30 mA. C\'est pour cela que les disjoncteurs différentiels des habitations sont calibrés à 30 mA : ils coupent dès que ce courant s\'échappe du circuit.'});
  if(cas===2) return Object.assign(qcm('environ 10 mA',['environ 10 mA','environ 1 mA','environ 1 A','environ 16 A']),{enonce:'À partir de quelle intensité les muscles se contractent au point qu\'on ne peut plus lâcher le conducteur ?',explication:'Vers 10 mA, les muscles de la main se tétanisent : la victime ne peut plus lâcher, et le courant continue de passer. C\'est ce qui rend l\'accident grave : la durée s\'allonge.'});
  return Object.assign(qcm('l\'intensité du courant et la durée du passage',['l\'intensité du courant et la durée du passage','la tension seulement','la puissance de l\'appareil','la couleur du fil touché']),{enonce:'De quoi dépendent surtout les effets d\'un courant sur le corps humain ?',explication:'Intensité, durée, et trajet. La tension n\'agit qu\'à travers l\'intensité qu\'elle impose ($I=U/R$) : 230 V avec la peau sèche donnent quelques mA ; avec la peau mouillée, plus de 200 mA.'});
}

/* ----- 7. Qui protège quoi ----- */
const PROTECTIONS=[
  ['le disjoncteur (ou le fusible)','une surintensité : surcharge ou court-circuit','les fils et les appareils, contre l\'incendie'],
  ['le disjoncteur différentiel 30 mA','un courant de fuite : une différence entre le courant de la phase et celui du neutre','les personnes, contre l\'électrisation'],
  ['la mise à la terre','un défaut d\'isolement : elle évacue le courant de fuite de la carcasse vers le sol','les personnes, en empêchant la carcasse de rester sous tension'],
];
function protection(){
  const cas=hasard(0,4), [nom,detecte,protege]=prendre(PROTECTIONS);
  if(cas===0) return Object.assign(qcm(detecte,PROTECTIONS.map(p=>p[1])),{enonce:'Que détecte <strong>'+nom+'</strong> ?',explication:nom[0].toUpperCase()+nom.slice(1)+' réagit à '+detecte+'. Il protège '+protege+'.'});
  if(cas===1) return Object.assign(qcm(nom,PROTECTIONS.map(p=>p[0])),{enonce:'Quel dispositif protège '+protege+' ?',explication:'C\'est '+nom+' : il réagit à '+detecte+'.'});
  if(cas===2){ const S=[['Six radiateurs branchés sur la même ligne : l\'intensité monte à 26 A.','le disjoncteur (ou le fusible)','Surcharge : une surintensité. Le disjoncteur coupe ; le différentiel ne voit aucune fuite, puisque tout le courant revient par le neutre.'],
    ['Une personne touche un fil dénudé : 150 mA la traversent vers le sol.','le disjoncteur différentiel 30 mA','Le courant qui part par la phase ne revient pas tout par le neutre : différence de 150 mA, bien plus que 30 mA. Le différentiel coupe en moins de 40 ms. Le disjoncteur 16 A, lui, ne voit rien : 0,15 A, c\'est cent fois trop peu.'],
    ['Phase et neutre se touchent dans une prise écrasée : plusieurs centaines d\'ampères.','le disjoncteur (ou le fusible)','Court-circuit : surintensité brutale. Le disjoncteur coupe instantanément (électroaimant).'],
    ['La phase d\'un lave-linge touche sa carcasse métallique, reliée au sol.','la mise à la terre','La terre évacue le courant de défaut vers le sol : la carcasse ne reste pas à 230 V. Ce courant de fuite fait ensuite réagir le différentiel.']]; const [s,rep,exp]=prendre(S);
    return Object.assign(qcm(rep,PROTECTIONS.map(p=>p[0]).concat(['le compteur'])),{enonce:s+' Quel dispositif réagit (ou agit) en premier ?',explication:exp}); }
  if(cas===3) return Object.assign(qcm('Non : 150 mA, c\'est cent fois moins que 16 A',['Non : 150 mA, c\'est cent fois moins que 16 A','Oui, dès que le courant dépasse 30 mA','Oui, car toute électrisation déclenche le disjoncteur','Oui, si la personne est pieds nus']),{enonce:'Une personne est traversée par 150 mA. Un disjoncteur 16 A va-t-il couper ?',explication:'Non. Le disjoncteur 16 A coupe au-delà de 16 A = 16 000 mA. 150 mA ne le font pas réagir : il protège les fils, pas les personnes. Seul le différentiel 30 mA repère ce courant de fuite.'});
  return Object.assign(qcm('moins de 40 ms',['moins de 40 ms','environ 1 s','environ 10 s','environ 1 min']),{enonce:'En combien de temps un disjoncteur différentiel 30 mA doit-il couper quand il détecte une fuite ?',explication:'Moins de 40 millisecondes, soit deux périodes du secteur. Assez court pour qu\'un courant même important ne déclenche pas de fibrillation.'});
}

/* ----- 8. Règles de sécurité ----- */
const REGLES=[
  ['Débrancher un appareil en tirant sur le câble plutôt que sur la fiche.','dangereux','Le câble s\'arrache à la fiche, un fil se dénude : le prochain qui le touche prend 230 V. On tire sur la fiche.'],
  ['Utiliser un sèche-cheveux les pieds dans l\'eau du bain.','dangereux','Peau mouillée, pieds dans l\'eau : la résistance du corps s\'effondre. Le moindre défaut est mortel.'],
  ['Couper le disjoncteur général avant de changer une ampoule difficile d\'accès.','sûr','Hors tension, plus de risque. C\'est le bon réflexe, même pour une simple ampoule.'],
  ['Brancher un radiateur de 2 000 W sur une rallonge enroulée.','dangereux','Une rallonge enroulée ne refroidit pas : à 8,7 A, elle chauffe jusqu\'à fondre. On la déroule, ou on branche sur une prise murale.'],
  ['Remplacer une prise sans terre par une prise avec terre, reliée au tableau.','sûr','La terre est une des trois protections. La rajouter, c\'est protéger les personnes.'],
  ['Couper l\'alimentation avant de toucher une personne électrisée qui ne peut pas lâcher.','sûr','Toucher la victime encore sous tension, c\'est devenir la deuxième victime. On coupe d\'abord (disjoncteur, ou fiche), puis on secourt.'],
  ['Tester le différentiel chaque mois avec son bouton « test ».','sûr','Un différentiel peut se bloquer avec le temps. Le bouton test simule une fuite : s\'il coupe, il fonctionne.'],
  ['Réparer un câble dénudé avec du ruban adhésif ordinaire.','dangereux','Le ruban adhésif n\'isole pas durablement : il se décolle, et le fil de phase se retrouve à l\'air. On remplace le câble.'],
  ['Mettre une multiprise sur une multiprise pour brancher plus d\'appareils.','dangereux','L\'intensité totale passe par la première multiprise, prévue pour 16 A. On dépasse facilement : chauffe et incendie.'],
  ['Utiliser une prise munie d\'un volet (obturateur) dans une chambre d\'enfant.','sûr','Les obturateurs empêchent d\'enfoncer un objet dans un seul trou. Toutes les prises neuves en sont équipées.'],
  ['Changer une ampoule sans éteindre, « parce que ça va vite ».','dangereux','La douille est alimentée : un doigt au mauvais endroit, c\'est 230 V. Éteindre ne suffit d\'ailleurs pas toujours (interrupteur sur le neutre) : couper le disjoncteur est plus sûr.'],
  ['Tirer un appareil de classe II (double isolation) sur une prise sans terre.','sûr','Les appareils à double isolation (carré dans un carré) n\'ont pas de carcasse métallique accessible : ils n\'ont pas besoin de terre.'],
];
function regles(){ const cas=hasard(0,3);
  if(cas<3){ const [s,rep,exp]=prendre(REGLES); return Object.assign(qcm(rep,['dangereux','sûr'],2),{enonce:'« '+s+' » Ce geste est-il sûr ou dangereux ?',explication:exp}); }
  const ORDRE=['couper le courant (disjoncteur ou fiche)','ne pas toucher la victime tant qu\'elle est sous tension','appeler les secours (15, 18 ou 112)','surveiller la victime, même si elle semble aller bien'];
  return Object.assign(qcm('couper le courant (disjoncteur ou fiche)',ORDRE.concat(['verser de l\'eau sur la victime','tirer la victime par la main'])),{enonce:'Une personne est électrisée et ne peut pas lâcher le conducteur. Quel est le <strong>premier</strong> geste ?',explication:'Couper le courant d\'abord, sans toucher la victime : au disjoncteur, ou en débranchant la fiche. Sinon on devient la deuxième victime. Ensuite : appeler les secours, et surveiller la victime, car le cœur peut réagir plusieurs heures après.'}); }

/* ----- 9. Intensité et calibre : I = P / U ----- */
const APPAREILS=[['une lampe LED',10],['un chargeur de téléphone',10],['un téléviseur',120],['un lit médicalisé (moteur)',150],['un concentrateur d\'oxygène',300],['un ordinateur portable',60],['un micro-ondes',1000],['un sèche-cheveux',1800],['un radiateur d\'appoint',2000],['une bouilloire',2200],['un lave-linge en chauffe',2500],['un fer à repasser',2400]];
function intensite(){
  const cas=hasard(0,3);
  if(cas===0){ const [nom,P]=prendre(APPAREILS); const I=P/230; return Object.assign(num(I,I<1?2:1,0.03),{enonce:'Sur l\'étiquette de '+nom+' on lit « '+mil(P)+' W ». Quelle intensité absorbe-t-il sous 230 V, en A ?',explication:'$I=\\dfrac{P}{U}=\\dfrac{'+mil(P)+'}{230}\\approx'+fr(I,I<1?2:1)+'$ A. '+(P>=1500?'Un appareil qui chauffe tire beaucoup de courant : à lui seul, il occupe la moitié d\'une ligne de 16 A.':'Un petit courant : ce sont les appareils qui chauffent qui pèsent sur une ligne.')}); }
  if(cas===1){ const cal=prendre([10,16,20]); let liste=[],P=0; const base=melanger(APPAREILS.slice()); for(const a of base){ if(liste.length>=4) break; if(hasard(0,1)||liste.length<2){ liste.push(a); P+=a[1]; } }
    const I=P/230, coupe=I>cal; return Object.assign(qcm(coupe?'oui : l\'intensité dépasse le calibre':'non : l\'intensité reste sous le calibre',['oui : l\'intensité dépasse le calibre','non : l\'intensité reste sous le calibre'],2),{enonce:'Sur une ligne protégée par un disjoncteur de '+cal+' A, on branche en même temps '+liste.map(a=>a[0]+' ('+mil(a[1])+' W)').join(', ')+'. Le disjoncteur coupe-t-il ?',explication:'Puissance totale : '+liste.map(a=>mil(a[1])).join(' + ')+' = '+mil(P)+' W. $I=\\dfrac{'+mil(P)+'}{230}\\approx'+fr(I,1)+'$ A, '+(coupe?'plus que '+cal+' A : surcharge, le disjoncteur coupe (après quelques secondes de chauffe du bilame).':'moins que '+cal+' A : la ligne tient.'+(I>0.8*cal?' De justesse : un appareil de plus et ça coupe.':''))}); }
  if(cas===2){ const cal=prendre([10,16,20]); const Pmax=cal*230; return Object.assign(num(Pmax,0,0.03),{enonce:'Une ligne est protégée par un disjoncteur de '+cal+' A sous 230 V. Quelle puissance totale maximale, en W, peut-on y brancher sans qu\'il coupe ?',explication:'$P=U\\times I=230\\times'+cal+'='+mil(Pmax)+'$ W. Au-delà, le disjoncteur coupe : c\'est pour cela qu\'une multiprise 16 A ne supporte pas deux radiateurs.'}); }
  return Object.assign(qcm('ceux qui chauffent : radiateur, bouilloire, sèche-cheveux',['ceux qui chauffent : radiateur, bouilloire, sèche-cheveux','ceux qui éclairent : lampes','ceux qui calculent : ordinateur, téléphone','ceux qui ont un moteur : lit médicalisé']),{enonce:'Quels appareils tirent le plus de courant dans une habitation ?',explication:'Chauffer demande beaucoup de puissance : 2 000 W, soit presque 9 A pour un seul radiateur. Une lampe LED ou un chargeur ne tirent que 0,04 A. C\'est pourquoi on ne met pas de chauffage sur la ligne du matériel médical.'});
}

window.GENERATEURS=window.GENERATEURS||{};
window.GENERATEURS['electricite']={
  types:{'lire-oscillogramme':lireOscillogramme,'frequence':frequence,'valeurs':valeurs,'fils':fils,'risques':risques,'seuils':seuils,'protection':protection,'regles':regles,'intensite':intensite},
  categories:{'lire-oscillogramme':'Lire un oscillogramme','frequence':'Période et fréquence','valeurs':'Tension maximale, tension efficace','fils':'Phase, neutre, terre','risques':'Reconnaître le risque','seuils':'Le courant et le corps','protection':'Qui protège quoi','regles':'Les bons gestes','intensite':'Intensité et calibre'},
  ordre:['lire-oscillogramme','lire-oscillogramme','frequence','valeurs','fils','risques','seuils','protection','protection','regles','intensite'],
};
})();
