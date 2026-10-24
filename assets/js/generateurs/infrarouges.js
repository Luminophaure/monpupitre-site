/* =====================================================================
   GÉNÉRATEURS — chapitre « Infrarouges et détection » (première ST2S)
   Même format que les autres générateurs :
     { enonce, type:'nombre'|'qcm', reponse, choix, explication, tolerance, media }
   Au programme : situer une onde dans le spectre, convertir (nm, µm, m ; °C, K),
   exploiter la loi de Wien (calcul et lecture graphique), le corps humain,
   les détecteurs infrarouges.
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
const mil=v=>String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const WIEN=2.90e-3;
/* écriture scientifique en LaTeX : 9,4 × 10⁻⁶ */
function sci(v,d){ const e=Math.floor(Math.log10(Math.abs(v))); const m=v/Math.pow(10,e); return tex(m,d==null?2:d)+'\\times10^{'+e+'}'; }

/* ----- 1. Situer une onde dans le spectre ----- */
const DOMAINES=['rayons γ','rayons X','ultraviolet','visible','infrarouge','micro-ondes','ondes radio'];
const ONDES=[
  ['une télécommande de téléviseur','940 nm',9.4e-7,'infrarouge','940 nm, c\'est au-delà de 800 nm : infrarouge proche. Invisible, mais le capteur d\'un téléphone le voit.'],
  ['le rayonnement émis par la peau','9,4 µm',9.4e-6,'infrarouge','9,4 µm = 9 400 nm, entre 800 nm et 1 mm : infrarouge thermique.'],
  ['un four à micro-ondes','12 cm',0.12,'micro-ondes','12 cm, c\'est entre 1 mm et 10 cm environ : micro-ondes, comme le Wi-Fi.'],
  ['une radio FM','3 m',3,'ondes radio','Plusieurs mètres : ondes radio.'],
  ['une radiographie du thorax','0,1 nm',1e-10,'rayons X','0,1 nm, bien en dessous de 10 nm : rayons X, qui traversent les tissus mous.'],
  ['le laser rouge d\'une caisse de supermarché','650 nm',6.5e-7,'visible','650 nm est entre 400 et 800 nm : visible, rouge.'],
  ['une lampe de bronzage','350 nm',3.5e-7,'ultraviolet','350 nm, juste en dessous de 400 nm : ultraviolet proche (UVA).'],
  ['un radiateur à 60 °C','8,7 µm',8.7e-6,'infrarouge','8,7 µm : infrarouge thermique, comme tous les objets de la vie courante.'],
  ['le maximum d\'émission du Soleil','500 nm',5e-7,'visible','500 nm : visible, vert. Nos yeux sont adaptés à cette lumière.'],
  ['un téléphone en 4G','15 cm',0.15,'micro-ondes','Une quinzaine de centimètres : micro-ondes.'],
  ['une lampe germicide (désinfection)','254 nm',2.54e-7,'ultraviolet','254 nm : ultraviolet (UVC), qui détruit l\'ADN des microbes, et abîme aussi la peau et les yeux.'],
  ['une lampe chauffante de kinésithérapie','2,4 µm',2.4e-6,'infrarouge','2,4 µm : infrarouge. On la sent, on ne la voit presque pas.'],
  ['un traitement de radiothérapie','1 pm',1e-12,'rayons γ','1 pm = 10⁻¹² m : rayons γ, les plus énergétiques.'],
  ['une lumière violette','410 nm',4.1e-7,'visible','410 nm est encore dans le visible, à sa limite violette.'],
];
function situer(){ const cas=hasard(0,3);
  if(cas<2){ const [obj,lt,l,dom,exp]=prendre(ONDES); return Object.assign(qcm(dom,DOMAINES),{enonce:'La longueur d\'onde de '+obj+' est '+lt+'. Dans quel domaine du spectre est-elle ?',explication:exp}); }
  if(cas===2) return Object.assign(qcm('de 400 nm à 800 nm',['de 400 nm à 800 nm','de 400 µm à 800 µm','de 800 nm à 1 mm','de 4 nm à 8 nm','de 400 m à 800 m']),{enonce:'Le domaine visible s\'étend…',explication:'De 400 nm (violet) à 800 nm (rouge). L\'infrarouge commence à 800 nm et va jusqu\'à 1 mm.'});
  const paires=[['l\'infrarouge','le visible','plus grande'],['l\'ultraviolet','le visible','plus petite'],['les micro-ondes','l\'infrarouge','plus grande'],['les rayons X','l\'ultraviolet','plus petite'],['les ondes radio','les micro-ondes','plus grande'],['le rouge','le violet','plus grande']]; const [a,b,r]=prendre(paires);
  return Object.assign(qcm(r,['plus grande','plus petite','la même'],3),{enonce:'Par rapport à '+b+', la longueur d\'onde de '+a+' est…',explication:'Dans l\'ordre des longueurs d\'onde croissantes : γ, X, UV, visible (violet → rouge), IR, micro-ondes, radio. '+a[0].toUpperCase()+a.slice(1)+' a donc une longueur d\'onde '+r+'.'}); }

/* ----- 2. Convertir des longueurs d'onde ----- */
function convertir(){ const cas=hasard(0,3);
  if(cas===0){ const nm=prendre([550,940,780,400,650,1200,2400,9400,10600]); return Object.assign(num(nm/1000,nm<1000?2:1,0.01),{enonce:'Convertir $'+mil(nm)+'$ nm en µm.',explication:'$1$ µm $=1\\,000$ nm, donc on divise par 1 000 : $'+mil(nm)+'$ nm $='+tex(nm/1000,nm<1000?2:1)+'$ µm.'}); }
  if(cas===1){ const um=prendre([9.4,2.9,0.5,10.6,6.1,1.07,0.94,8.7]); return Object.assign(num(um*1000,0,0.01),{enonce:'Convertir $'+tex(um,2)+'$ µm en nm.',explication:'On multiplie par 1 000 : $'+tex(um,2)+'$ µm $='+mil(um*1000)+'$ nm.'}); }
  if(cas===2){ const um=prendre([9.4,2.9,6.1,10.6,1.1,0.5]); return Object.assign(qcm(sci(um*1e-6)+'\\ \\text{m}',[sci(um*1e-6)+'\\ \\text{m}',sci(um*1e-9)+'\\ \\text{m}',sci(um*1e-3)+'\\ \\text{m}',sci(um*1e-7)+'\\ \\text{m}'].map(x=>'$'+x+'$')),{enonce:'Écrire $'+tex(um,1)+'$ µm en mètres, en écriture scientifique.',explication:'$1$ µm $=10^{-6}$ m, donc $'+tex(um,1)+'$ µm $='+sci(um*1e-6)+'$ m. C\'est sous cette forme qu\'on l\'utilise dans la loi de Wien.'}); }
  const m=prendre([9.4e-6,5e-7,2.9e-6,6.1e-6,9.4e-7,1.2e-1]); const txt= m>=1e-3?fr(m*100,0)+' cm':m>=1e-6?fr(m*1e6,1)+' µm':fr(m*1e9,0)+' nm';
  return Object.assign(qcm(txt,['9,4 µm','500 nm','2,9 µm','6,1 µm','940 nm','12 cm','9,4 nm','5 µm','290 nm','61 µm','9,4 mm']),{enonce:'Que vaut $'+sci(m)+'$ m dans une unité adaptée ?',explication:'$'+sci(m)+'$ m $='+txt+'$. Repère l\'exposant : $10^{-6}$ pour les micromètres, $10^{-9}$ pour les nanomètres.'}); }

/* ----- 3. Degrés Celsius et kelvins ----- */
function kelvin(){ const cas=hasard(0,2);
  if(cas===0){ const th=prendre([20,37,100,-18,0,60,200,38.5,-5,450,1500]); return Object.assign(num(th+273,th%1?1:0,0.005),{enonce:'Convertir $'+tex(th,1)+'$ °C en kelvins.',explication:'$T=\\theta+273='+tex(th,1)+'+273='+tex(th+273,1)+'$ K.'+(th<0?' Un nombre positif : il n\'y a pas de température négative en kelvins.':'')}); }
  if(cas===1){ const K=prendre([273,310,293,373,255,5800,1000,2700,500,333]); return Object.assign(num(K-273,0,0.005),{enonce:'Convertir $'+mil(K)+'$ K en degrés Celsius.',explication:'$\\theta=T-273='+mil(K)+'-273='+mil(K-273)+'$ °C.'}); }
  return Object.assign(qcm('1 K',['1 K','274 K','273 K','0,5 K']),{enonce:'Un écart de température de 1 °C correspond à un écart de…',explication:'Les deux échelles ont la même graduation : seule l\'origine diffère (0 °C = 273 K). Un écart de 1 °C vaut un écart de 1 K.'}); }

/* ----- 4. La loi de Wien par le calcul ----- */
const CORPS=[['le corps humain',310],['un glaçon',273],['une pièce à 20 °C',293],['de l\'eau bouillante',373],['une plaque chauffante',500],['une braise',1000],['le filament d\'une lampe',2700],['le Soleil',5800],['un four à 200 °C',473],['un radiateur à 60 °C',333],['une étoile bleue',12000]];
function wien(){ const cas=hasard(0,3);
  if(cas<2){ const [nom,T]=prendre(CORPS); const lm=WIEN/T; const um=lm*1e6; return Object.assign(num(um,um<1?2:1,0.03),{enonce:'La température de '+nom+' est $'+mil(T)+'$ K. Calculer la longueur d\'onde de son maximum d\'émission, en µm.',explication:'$\\lambda_{max}=\\dfrac{2{,}90\\times10^{-3}}{'+mil(T)+'}='+sci(lm)+'$ m $='+tex(um,um<1?2:1)+'$ µm'+(um>=0.8&&um<1000?' : infrarouge.':um<0.8&&um>=0.4?' : visible.':um<0.4?' : ultraviolet.':'.')}); }
  if(cas===2){ const [nom,T]=prendre(CORPS.filter(c=>c[1]<=6000)); const lm=WIEN/T; const um=Math.round(lm*1e6*100)/100; return Object.assign(num(WIEN/(um*1e-6),0,0.03),{enonce:'Le maximum d\'émission d\'un corps est à $\\lambda_{max}='+tex(um,2)+'$ µm. Calculer sa température, en kelvins.',explication:'$T=\\dfrac{2{,}90\\times10^{-3}}{\\lambda_{max}}=\\dfrac{2{,}90\\times10^{-3}}{'+tex(um,2)+'\\times10^{-6}}\\approx'+mil(WIEN/(um*1e-6))+'$ K'+(Math.abs(WIEN/(um*1e-6)-T)<T*0.03?' : c\'est '+nom+'.':'.')}); }
  const [nom,T]=prendre(CORPS.filter(c=>c[1]<=1000&&c[1]>=273)); const th=T-273; const lm=WIEN/T; const um=lm*1e6;
  return Object.assign(num(um,1,0.03),{enonce:'La température de '+nom+' est $'+mil(th)+'$ °C. Calculer $\\lambda_{max}$ en µm. (Attention aux unités.)',explication:'D\'abord en kelvins : $T='+mil(th)+'+273='+mil(T)+'$ K. Puis $\\lambda_{max}=\\dfrac{2{,}90\\times10^{-3}}{'+mil(T)+'}='+sci(lm)+'$ m $='+tex(um,1)+'$ µm. Avec '+mil(th)+' au lieu de '+mil(T)+', on aurait trouvé '+tex(WIEN/Math.max(th,1)*1e6,0)+' µm : faux.'}); }

/* ----- 5. Lecture graphique de Wien ----- */
function grapheWien(T){ // λmax (µm) en fonction de T (K), de 200 à 1 000 K, lecture pour T en pointillés
  const W=360,H=250,x0=46,x1=W-14,y0=16,y1=H-40; const X=t=>x0+(t-200)/800*(x1-x0), Y=l=>y1-l/12*(y1-y0);
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="wien-svg" role="img" aria-label="Graphique de la loi de Wien, longueur d\'onde du maximum en micromètres en fonction de la température en kelvins, de 200 à 1 000 K'+(T?', avec une lecture en pointillés pour '+T+' K':'')+'.">';
  s+='<g class="quadrillage">'; for(let t=300;t<=1000;t+=100) s+='<line x1="'+X(t).toFixed(1)+'" y1="'+y0+'" x2="'+X(t).toFixed(1)+'" y2="'+y1+'"/>'; for(let l=1;l<=12;l++) s+='<line x1="'+x0+'" y1="'+Y(l).toFixed(1)+'" x2="'+x1+'" y2="'+Y(l).toFixed(1)+'"/>'; s+='</g>';
  s+='<g class="trace t-n fin"><line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'"/><line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'"/></g>';
  for(let t=300;t<=1000;t+=100) s+='<text class="petit" x="'+X(t).toFixed(1)+'" y="'+(y1+16)+'" text-anchor="middle">'+t+'</text>';
  for(let l=2;l<=12;l+=2) s+='<text class="petit" x="'+(x0-5)+'" y="'+(Y(l)+4).toFixed(1)+'" text-anchor="end">'+l+'</text>';
  s+='<text class="petit" x="'+x1+'" y="'+(y1+32)+'" text-anchor="end">T (K)</text><text class="petit" x="'+(x0+4)+'" y="'+(y0+10)+'">λmax (µm)</text>';
  let p=''; for(let k=0;k<=200;k++){ const t=242+(1000-242)*k/200; const l=Math.min(12,WIEN/t*1e6); p+=(k?' L':'M')+X(t).toFixed(1)+' '+Y(l).toFixed(1); }
  s+='<g class="trace t-chaud"><path d="'+p+'"/></g>';
  if(T){ const l=WIEN/T*1e6; s+='<g class="trace t-v pointille fin"><line x1="'+X(T).toFixed(1)+'" y1="'+y1+'" x2="'+X(T).toFixed(1)+'" y2="'+Y(l).toFixed(1)+'"/><line x1="'+x0+'" y1="'+Y(l).toFixed(1)+'" x2="'+X(T).toFixed(1)+'" y2="'+Y(l).toFixed(1)+'"/></g><circle class="pt pt-v" cx="'+X(T).toFixed(1)+'" cy="'+Y(l).toFixed(1)+'" r="4.5"/>'; }
  return s+'</svg>';
}
function lecture(){ const cas=hasard(0,2);
  if(cas<2){ const T=prendre([300,310,350,400,450,500,600,700,800,900,1000,330,370]); const lm=WIEN/T*1e6; return Object.assign(num(lm,1,0.06),{enonce:'À l\'aide du graphique, lire la longueur d\'onde du maximum d\'émission d\'un corps à $'+T+'$ K, en µm.',media:grapheWien(T)+'<p class="discret">Les pointillés montrent la lecture : on part de T, on monte jusqu\'à la courbe, on lit à gauche.</p>',explication:'On lit environ '+tex(lm,1)+' µm. Par le calcul : $\\lambda_{max}=\\dfrac{2{,}90\\times10^{-3}}{'+T+'}='+sci(lm*1e-6)+'$ m.'}); }
  const l=prendre([3,4,5,6,7,8,9,10]); const T=WIEN/(l*1e-6); return Object.assign(num(T,0,0.06),{enonce:'Le maximum d\'émission d\'un corps est à $'+l+'$ µm. Lire sa température sur le graphique, en kelvins.',media:grapheWien(null)+'<p class="discret">Pars de '+l+' µm sur l\'axe vertical, va jusqu\'à la courbe, puis descends.</p>',explication:'On lit environ '+mil(T)+' K. Par le calcul : $T=\\dfrac{2{,}90\\times10^{-3}}{'+l+'\\times10^{-6}}\\approx'+mil(T)+'$ K, soit '+mil(T-273)+' °C.'}); }

/* ----- 6. Le corps humain et l'émission ----- */
const CONCEPTS=[
  ['Le corps humain émet surtout…','de l\'infrarouge, vers 9 à 10 µm',['de la lumière visible, très faible','des ultraviolets','rien, sauf s\'il est éclairé','des micro-ondes'],'À 310 K, la loi de Wien donne $\\lambda_{max}\\approx9{,}4$ µm : infrarouge thermique, émis en permanence, même dans le noir.'],
  ['Quand la température d\'un corps augmente, la longueur d\'onde de son maximum d\'émission…','diminue',['augmente','ne change pas','devient nulle'],'$\\lambda_{max}=2{,}90\\times10^{-3}/T$ : si $T$ augmente, $\\lambda_{max}$ diminue. Le maximum glisse vers le visible : le corps rougeoie, puis blanchit.'],
  ['Un objet à température ambiante est invisible dans le noir parce que…','il n\'émet que de l\'infrarouge, que l\'œil ne voit pas',['il n\'émet rien du tout','il émet des ultraviolets','il absorbe toute la lumière'],'Il émet bien un rayonnement, vers 10 µm, mais l\'œil ne voit que de 400 à 800 nm. Une caméra thermique, elle, le voit.'],
  ['Une braise à 1 000 K rougeoie parce que…','une partie de son rayonnement entre dans le visible, côté rouge',['son maximum d\'émission est dans le rouge','elle émet des ultraviolets','elle réfléchit la lumière du feu'],'Son maximum est à 2,9 µm, dans l\'infrarouge. Mais la courbe d\'émission est large : sa queue atteint le rouge (vers 700–800 nm), la première couleur visible.'],
  ['Un enfant a de la fièvre. Par rapport à d\'habitude, sa peau…','émet plus d\'infrarouge, à une longueur d\'onde presque identique',['émet à une longueur d\'onde très différente','émet de la lumière visible','n\'émet plus rien'],'De 37 à 39,5 °C, $\\lambda_{max}$ passe de 9,35 à 9,28 µm : presque rien. Ce qui change nettement, c\'est la quantité émise. C\'est elle que mesure le thermomètre.'],
  ['Un glaçon à 0 °C…','émet un rayonnement infrarouge, moins intense qu\'un corps chaud',['n\'émet aucun rayonnement','émet de la lumière bleue','émet des micro-ondes'],'273 K, c\'est une température comme une autre : $\\lambda_{max}=2{,}90\\times10^{-3}/273\\approx10{,}6$ µm. Il émet simplement moins qu\'un objet plus chaud.'],
  ['Le Soleil nous paraît blanc-jaune parce que…','son maximum d\'émission, à 500 nm, est au milieu du visible',['il émet uniquement du jaune','il émet surtout de l\'infrarouge','il est très loin'],'À 5 800 K, $\\lambda_{max}=500$ nm : en plein visible. Il émet toutes les couleurs à la fois, ce que l\'œil perçoit comme du blanc.'],
  ['Quelle grandeur la loi de Wien relie-t-elle à la température d\'un corps ?','la longueur d\'onde de son maximum d\'émission',['la vitesse de la lumière qu\'il émet','sa masse','la distance à laquelle on le détecte'],'$\\lambda_{max}\\times T=2{,}90\\times10^{-3}$ m·K. Plus c\'est chaud, plus $\\lambda_{max}$ est courte.'],
];
function corps(){ const [q,b,autres,exp]=prendre(CONCEPTS); return Object.assign(qcm(b,[b,...autres]),{enonce:q,explication:exp}); }

/* ----- 7. Les détecteurs ----- */
const DETECTEURS=[
  ['Aux urgences, on prend la température d\'un bébé sans le toucher, en deux secondes.','un thermomètre infrarouge','Il capte l\'infrarouge émis par le front et convertit l\'intensité reçue en température. Sans contact, sans réveiller l\'enfant.'],
  ['Dans un local enfumé, le pompier voit une silhouette là où ses yeux ne voient rien.','une caméra thermique','Elle affiche point par point le rayonnement infrarouge émis par les objets : la fumée ne l\'arrête pas, et une personne à 310 K ressort nettement.'],
  ['La lumière du couloir s\'allume toute seule quand un résident passe.','un détecteur de présence infrarouge','Il compare le rayonnement reçu par deux zones : un corps chaud qui passe de l\'une à l\'autre fait varier le signal, et c\'est cette variation qui déclenche.'],
  ['Un diagnostic montre, en fausses couleurs, par où la chaleur s\'échappe d\'un bâtiment.','une caméra thermique','Chaque pixel est une température : les ponts thermiques apparaissent plus chauds vus de l\'extérieur.'],
  ['Une pince au bout du doigt affiche la saturation du sang en oxygène.','un oxymètre de pouls','Il envoie une lumière rouge et une infrarouge à travers le doigt ; leur absorption dépend de l\'oxygénation du sang. Ici, l\'infrarouge est émis par l\'appareil.'],
  ['On change de chaîne depuis le canapé.','une télécommande infrarouge','Une diode émet de l\'infrarouge proche (940 nm) selon un code ; le téléviseur le décode. C\'est l\'appareil qui émet, pas la personne.'],
  ['En kinésithérapie, une lampe chauffe un muscle en profondeur sans contact.','une lampe infrarouge','Son filament à 1 200 K environ émet surtout de l\'infrarouge, que les tissus absorbent et transforment en chaleur.'],
];
function detecteurs(){ const cas=hasard(0,4);
  if(cas<3){ const [s,rep,exp]=prendre(DETECTEURS); return Object.assign(qcm(rep,DETECTEURS.map(d=>d[1])),{enonce:s+' De quel appareil s\'agit-il ?',explication:exp}); }
  if(cas===3) return Object.assign(qcm('le rayonnement infrarouge reçu varie rapidement',['le rayonnement infrarouge reçu varie rapidement','la température de la pièce dépasse 20 °C','il reçoit de la lumière visible','quelqu\'un fait du bruit']),{enonce:'Un détecteur de présence infrarouge se déclenche quand…',explication:'Il réagit à une variation : un corps chaud qui passe d\'une zone à l\'autre. Immobile, on finit par éteindre la lumière, même en restant dans la pièce.'});
  return Object.assign(qcm('en captant l\'infrarouge émis par le front',['en captant l\'infrarouge émis par le front','en envoyant un rayon qui chauffe le front','en mesurant la couleur de la peau','par contact avec la peau']),{enonce:'Comment un thermomètre frontal mesure-t-il la température ?',explication:'Il ne fait que recevoir : plus le front est chaud, plus il émet d\'infrarouge, et le capteur traduit cette intensité en température. Le point rouge de certains modèles sert seulement à viser.'}); }

/* ----- 8. Vrai ou faux : les pièges ----- */
const AFFIRMATIONS=[
  ['L\'infrarouge est une lumière rouge très sombre.','faux','L\'infrarouge est invisible : il est au-delà du rouge, au-delà de ce que l\'œil perçoit.'],
  ['Une caméra thermique voit à travers une vitre.','faux','Le verre est opaque à l\'infrarouge thermique : la caméra affiche la température de la vitre.'],
  ['Une caméra thermique fonctionne dans le noir complet.','vrai','Elle capte ce que les objets émettent eux-mêmes, pas la lumière qu\'ils réfléchissent. Aucun éclairage n\'est nécessaire.'],
  ['Dans la loi de Wien, la température s\'exprime en degrés Celsius.','faux','En kelvins. Avec 37 au lieu de 310, on trouve 78 µm au lieu de 9,4 µm.'],
  ['Un corps froid n\'émet aucun rayonnement.','faux','Tout corps émet, quelle que soit sa température. Un glaçon émet vers 10,6 µm, simplement moins intensément qu\'un corps chaud.'],
  ['Plus un corps est chaud, plus la longueur d\'onde de son maximum d\'émission est courte.','vrai','C\'est la loi de Wien : $\\lambda_{max}$ est inversement proportionnelle à $T$.'],
  ['Le thermomètre frontal envoie un rayon infrarouge sur le front.','faux','Il reçoit l\'infrarouge émis par le front. Il n\'émet rien de mesurable.'],
  ['Un détecteur de présence détecte une personne immobile.','faux','Il réagit aux variations du rayonnement reçu. Immobile, la personne émet toujours, mais rien ne varie : au bout de la temporisation, la lumière s\'éteint.'],
  ['Toutes les ondes électromagnétiques ont la même vitesse dans le vide.','vrai','$c=3{,}00\\times10^{8}$ m/s pour toutes, des rayons γ aux ondes radio. Elles diffèrent par leur longueur d\'onde.'],
  ['Le corps humain émet des ultraviolets.','faux','À 310 K, il émet de l\'infrarouge vers 9,4 µm. Les UV viennent du Soleil ou des lampes, ils sont reçus, pas émis.'],
  ['Un thermomètre frontal donne une valeur trop basse si l\'on arrive du froid.','vrai','La peau refroidie émet moins ; l\'appareil sous-estime. Il faut attendre quelques minutes au chaud.'],
  ['Le four à micro-ondes chauffe avec des infrarouges.','faux','12 cm de longueur d\'onde : ce sont des micro-ondes, cent mille fois plus longues que l\'infrarouge thermique. Le gril, lui, chauffe par infrarouge.'],
];
function vraiFaux(){ const [s,rep,exp]=prendre(AFFIRMATIONS); return Object.assign(qcm(rep,['vrai','faux'],2),{enonce:'Vrai ou faux : « '+s+' »',explication:exp}); }

window.GENERATEURS=window.GENERATEURS||{};
window.GENERATEURS['infrarouges']={
  types:{'situer':situer,'convertir':convertir,'kelvin':kelvin,'wien':wien,'lecture':lecture,'corps':corps,'detecteurs':detecteurs,'vrai-faux':vraiFaux},
  categories:{'situer':'Situer dans le spectre','convertir':'Convertir les longueurs d\'onde','kelvin':'Degrés et kelvins','wien':'La loi de Wien','lecture':'Lire le graphique de Wien','corps':'Ce qu\'émettent les corps','detecteurs':'Reconnaître un détecteur','vrai-faux':'Vrai ou faux'},
  ordre:['situer','situer','convertir','kelvin','wien','wien','lecture','corps','detecteurs','vrai-faux'],
};
})();
