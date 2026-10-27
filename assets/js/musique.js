/* =====================================================================
   MUSIQUE DE CONCENTRATION — un petit lecteur dans le coin de l'écran.

   Les ambiances sont GÉNÉRÉES par le navigateur (Web Audio) : aucun
   fichier audio, aucune question de droits, rien n'est téléchargé.
     lofi    : accords feutrés, rythme lent, craquements de vinyle
     piano   : notes douces, lentes, avec de la réverbération
     nappes  : accords très longs, ni rythme ni mélodie
     pluie   : averse continue et gouttes
     vagues  : ressac lent, vagues qui cassent de loin en loin
     feu     : souffle grave et crépitements par rafales
     rose    : bruit rose (−3 dB/octave)
     brun    : bruit brun, grave et régulier
     ronron  : un chat qui ronronne, au rythme de sa respiration
     silence : rien, seulement le minuteur
   AUCUNE NE TOURNE EN ROND : les deux ambiances musicales changent de grille
   d'accords toutes les huit mesures et transposent par moments ; les ambiances
   de bruit respirent sous des oscillateurs lents de périodes incommensurables.
   C'est la répétition, pas le manque de choix, qui finit par déranger.
   `tests/musique_test.py` mesure les deux : le niveau sonore de chacune, et le
   renouvellement réel des notes sur deux minutes.
   Règles (cahier des charges) : coupée par défaut, ne démarre jamais
   seule, se coupe pendant une vidéo et pendant un contrôle blanc ;
   réglages gardés sur l'appareil seulement ; utilisable au clavier.
   Le minuteur 25 / 5 remplace le rappel de pause des 45 minutes.
   ===================================================================== */
(function(){
"use strict";
const P=window.Pupitre; if(!P) return;
/* Les ambiances, rangées en deux familles : celles qui ont des notes, et celles qui n'en
   ont pas. Un élève que la mélodie distrait descend d'un cran dans la liste ; un élève que
   le souffle endort remonte. Ajouter une ambiance = une ligne ici + une fonction qui rend
   un objet {stop()} + une ligne dans demarrer(). */
const GROUPES=[
  ['Avec des notes',[['lofi','Lo-fi','accords feutrés, rythme lent'],['piano','Piano calme','notes douces, lentes'],['nappes','Nappes','accords longs, sans rythme']]],
  ['Sans notes',[['pluie','Pluie','averse et gouttes'],['vagues','Vagues','ressac lent'],['feu','Feu de bois','crépitements'],['rose','Bruit rose','souffle équilibré'],['brun','Bruit brun','grave et régulier'],['ronron','Ronron','un chat qui ronronne']]],
  ['',[['silence','Silence','seulement le minuteur']]]
];
const AMBIANCES=GROUPES.reduce(function(a,g){ return a.concat(g[1]); },[]);
const etat=Object.assign({ambiance:'lofi',volume:.5,joue:false,minuteur:{actif:false,travail:25,pause:5,debut:0,phase:'travail'}},P.lire('musique',{}));
const sauver=()=>P.ecrire('musique',etat);

/* ---------- le moteur sonore ---------- */
let ctx=null, master=null, courant=null, raisonPause=null;
const silence={controle:false,video:false};   // même musique coupée : la caresse du compagnon se tait aussi
function contexte(){ if(ctx) return ctx; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; ctx=new AC(); master=ctx.createGain(); master.gain.value=etat.volume*.6; master.connect(ctx.destination); return ctx; }
function bruit(secondes,type){ const n=Math.floor(ctx.sampleRate*secondes), b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0); let last=0;
  // bruit rose : filtre de Paul Kellet, −3 dB par octave. Entre le blanc (sifflant) et le
  // brun (sourd), c'est celui que les études sur l'attention citent le plus souvent.
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for(let i=0;i<n;i++){ const w=Math.random()*2-1;
    if(type==='brun'){ last=(last+.02*w)/1.02; d[i]=last*3.5; }
    else if(type==='rose'){ b0=.99886*b0+w*.0555179; b1=.99332*b1+w*.0750759; b2=.96900*b2+w*.1538520;
      b3=.86650*b3+w*.3104856; b4=.55000*b4+w*.5329522; b5=-.7616*b5-w*.0168980;
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11; b6=w*.115926; }
    else d[i]=w; } return b; }
function reverb(duree){ const n=Math.floor(ctx.sampleRate*duree), b=ctx.createBuffer(2,n,ctx.sampleRate);
  for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2); }
  const cv=ctx.createConvolver(); cv.buffer=b; return cv; }
const freq=m=>440*Math.pow(2,(m-69)/12);

/* une note douce : deux oscillateurs, enveloppe, filtre */
function note(midi,t,duree,opts){ opts=opts||{}; const o1=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
  o1.type=opts.type||'sine'; o2.type='triangle'; o1.frequency.value=freq(midi); o2.frequency.value=freq(midi)*(opts.detune||2.003);
  f.type='lowpass'; f.frequency.value=opts.filtre||1800; const v=opts.vol||.18;
  /* L'attaque peut être longue (les nappes montent en plusieurs secondes) : le point de
     décroissance doit rester APRÈS elle, sinon les rampes sont désordonnées dans le temps
     et l'enveloppe part en vrille. */
  const tA=t+(opts.attaque||.02), tD=Math.min(Math.max(tA+.05,t+Math.min(duree*.5,1.2)),t+duree*.92);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,tA); g.gain.exponentialRampToValueAtTime(v*.35,tD); g.gain.exponentialRampToValueAtTime(.0005,t+duree);
  const o2g=ctx.createGain(); o2g.gain.value=opts.harm||.25;
  o1.connect(f); o2.connect(o2g); o2g.connect(f); f.connect(g); g.connect(opts.sortie||master);
  o1.start(t); o2.start(t); o1.stop(t+duree+.05); o2.stop(t+duree+.05); }
function percussion(type,t,sortie){ const g=ctx.createGain(); g.connect(sortie);
  if(type==='kick'){ const o=ctx.createOscillator(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+.25); g.gain.setValueAtTime(.5,t); g.gain.exponentialRampToValueAtTime(.001,t+.3); o.connect(g); o.start(t); o.stop(t+.32); return; }
  const s=ctx.createBufferSource(); s.buffer=bruitBlanc; const f=ctx.createBiquadFilter();
  if(type==='caisse'){ f.type='bandpass'; f.frequency.value=1900; f.Q.value=.7; g.gain.setValueAtTime(.16,t); g.gain.exponentialRampToValueAtTime(.001,t+.16); }
  else { f.type='highpass'; f.frequency.value=7000; g.gain.setValueAtTime(type==='hatO'?.06:.035,t); g.gain.exponentialRampToValueAtTime(.001,t+(type==='hatO'?.12:.04)); }
  s.connect(f); f.connect(g); s.start(t); s.stop(t+.3); }
let bruitBlanc=null;

/* --- générateur harmonique partagé par « piano » et « lofi » --- */
function musicien(style){
  const rev=reverb(style==='piano'?2.8:1.6); const revG=ctx.createGain(); revG.gain.value=style==='piano'?.5:.3; rev.connect(revG); revG.connect(master);
  const sec=ctx.createGain(); sec.gain.value=1; sec.connect(master); sec.connect(rev);
  /* ------------------------------------------------------------------
     NE PAS TOURNER EN ROND. Une seule grille de quatre accords rejouée
     indéfiniment s'entend au bout de trois minutes, et c'est exactement ce
     qui finit par déranger. On change donc de grille toutes les huit
     mesures, on transpose de temps en temps, et la densité varie : une
     section sans mélodie, une autre plus fournie. Tout reste diatonique à
     do majeur avant transposition, donc la gamme de la mélodie suit sans
     qu'on ait à la redéclarer.
     Les variations sont LENTES et discrètes : une musique de fond qui
     surprend ne fait plus son travail.
     ------------------------------------------------------------------ */
  const GRILLES= style==='piano' ? [
      [[48,55,60,64,67],[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62]],   // I–vi–IV–V
      [[48,55,60,64,67],[43,50,55,59,62],[45,52,57,60,64],[41,48,53,57,60]],   // I–V–vi–IV
      [[45,52,57,60,64],[41,48,53,57,60],[48,55,60,64,67],[43,50,55,59,62]],   // vi–IV–I–V
      [[48,55,60,64,67],[52,59,64,67,71],[41,48,53,57,60],[50,57,62,65,69]] ]  // I–iii–IV–ii
    : [
      [[38,50,53,57,60],[43,50,53,55,59],[36,48,52,55,59],[45,48,52,55,60]],   // ii–V–I–vi
      [[36,48,52,55,59],[45,48,52,55,60],[38,50,53,57,60],[43,50,53,55,59]],   // I–vi–ii–V
      [[40,52,55,59,62],[45,48,52,55,60],[38,50,53,57,60],[43,50,53,55,59]],   // iii–vi–ii–V
      [[41,53,57,60,64],[40,52,55,59,62],[45,48,52,55,60],[43,50,53,55,59]] ]; // IV–iii–vi–V
  const TRANSPO=[-5,-4,-2,0,2,3];             // un pas de côté, du même pas que la section
  const LONGUEURS=[6,8,8,12];                 // la section elle-même n'a pas de durée fixe
  let bpm= style==='piano'?58:72, temps=60/bpm;
  const gamme= style==='piano' ? [60,62,64,67,69,72,74,76,79] : [60,62,64,65,67,69,71,72,74,76];
  let grille=GRILLES[Math.floor(Math.random()*GRILLES.length)], transpo=0, densite=1, batterie=true;
  let mesure=0, temps_i=0, prochain=ctx.currentTime+.1, derniere=67, nappe=null, finSection=8;

  function nouvelleSection(){
    // on ne retombe ni sur la grille ni sur la tonalité qu'on vient de quitter
    let g; do { g=GRILLES[Math.floor(Math.random()*GRILLES.length)]; } while(GRILLES.length>1&&g===grille);
    grille=g;
    if(Math.random()<.7){ let v; do { v=TRANSPO[Math.floor(Math.random()*TRANSPO.length)]; } while(v===transpo); transpo=v; }
    densite= [0,.55,1,1,1.35][Math.floor(Math.random()*5)];   // parfois aucune mélodie du tout
    if(style==='lofi') batterie= Math.random()<.78;            // des passages sans batterie
    bpm= (style==='piano'?58:72) + (Math.random()*6-3); temps=60/bpm;
    finSection= mesure + LONGUEURS[Math.floor(Math.random()*LONGUEURS.length)];
  }

  function pas(){
    if(mesure&&temps_i===0&&mesure>=finSection) nouvelleSection();
    const acc=grille[(mesure>>0)%grille.length].map(m=>m+transpo), t=prochain;
    if(temps_i===0){ // nouvel accord : basse + nappe
      note(acc[0],t,temps*3.6,{type:'sine',vol:style==='piano'?.14:.2,filtre:500,harm:.1,sortie:sec});
      if(style==='lofi'){ acc.slice(1).forEach((m,i)=>note(m,t+.02*i,temps*3.8,{type:'sine',vol:.07,filtre:1100,harm:.5,detune:2.002,attaque:.08,sortie:sec})); }
      else if(Math.random()<.7){ acc.slice(1,4).forEach((m,i)=>note(m,t+.03*i,temps*3.5,{vol:.07,filtre:1500,attaque:.05,sortie:sec})); }
    }
    // mélodie clairsemée : marche aléatoire sur la gamme, plus ou moins fournie selon la section
    const p= (style==='piano'?.55:.35)*densite;
    if(Math.random()<p){ const i=gamme.indexOf(derniere); let j=(i<0?3:i)+(Math.random()<.5?-1:1)*(Math.random()<.7?1:2); j=Math.max(0,Math.min(gamme.length-1,j)); derniere=gamme[j];
      note(derniere+transpo,t+(style==='lofi'&&temps_i%2?temps*.08:0),temps*(Math.random()<.3?2:1.1),{vol:style==='piano'?.16:.11,filtre:style==='piano'?2400:1600,sortie:sec}); }
    if(style==='lofi'&&batterie){ // batterie feutrée, charleston en croches avec swing
      if(temps_i===0||(temps_i===2&&Math.random()<.85)) percussion('kick',t,master);
      if(temps_i===1||temps_i===3) percussion('caisse',t,master);
      if(temps_i===3&&Math.random()<.12) percussion('caisse',t+temps*.5,master);   // petite relance
      percussion('hat',t,master); percussion(Math.random()<.15?'hatO':'hat',t+temps*.56,master);
    }
    temps_i=(temps_i+1)%4; if(temps_i===0) mesure++; prochain+=temps;
  }
  let timer=setInterval(()=>{ while(prochain<ctx.currentTime+.4) pas(); },100);
  // lofi : fond de vinyle
  let vinyle=null; if(style==='lofi'){ vinyle=ctx.createBufferSource(); vinyle.buffer=bruitBlanc; vinyle.loop=true; const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900; const g=ctx.createGain(); g.gain.value=.012; vinyle.connect(f); f.connect(g); g.connect(master); vinyle.start();
    nappe=setInterval(()=>{ if(Math.random()<.5){ const t=ctx.currentTime; const s=ctx.createBufferSource(); s.buffer=bruitBlanc; const f=ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=3000; const g=ctx.createGain(); g.gain.setValueAtTime(.05,t); g.gain.exponentialRampToValueAtTime(.001,t+.02); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+.03); } },180); }
  return {stop(){ clearInterval(timer); if(nappe) clearInterval(nappe); if(vinyle){ try{ vinyle.stop(); }catch(e){} } setTimeout(()=>{ try{ sec.disconnect(); revG.disconnect(); }catch(e){} },3000); }};
}
function pluie(){
  const s=ctx.createBufferSource(); s.buffer=bruitBlanc; s.loop=true; const f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1400; f.Q.value=.6;
  const g=ctx.createGain(); g.gain.value=.22; const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=.07; lg.gain.value=.05; lfo.connect(lg); lg.connect(g.gain);
  const grave=ctx.createBufferSource(); grave.buffer=bruitBlanc; grave.loop=true; const fg=ctx.createBiquadFilter(); fg.type='lowpass'; fg.frequency.value=220; const gg=ctx.createGain(); gg.gain.value=.12;
  s.connect(f); f.connect(g); g.connect(master); grave.connect(fg); fg.connect(gg); gg.connect(master); s.start(); grave.start(); lfo.start();
  const gouttes=setInterval(()=>{ const t=ctx.currentTime; const d=ctx.createBufferSource(); d.buffer=bruitBlanc; const hf=ctx.createBiquadFilter(); hf.type='highpass'; hf.frequency.value=2500+Math.random()*4000; const dg=ctx.createGain(); dg.gain.setValueAtTime(.08+Math.random()*.1,t); dg.gain.exponentialRampToValueAtTime(.001,t+.03+Math.random()*.05); d.connect(hf); hf.connect(dg); dg.connect(master); d.start(t); d.stop(t+.1); },90);
  return {stop(){ clearInterval(gouttes); [s,grave,lfo].forEach(x=>{ try{ x.stop(); }catch(e){} }); }};
}
function brun(){ const s=ctx.createBufferSource(); s.buffer=bruit(8,'brun'); s.loop=true; const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380; const g=ctx.createGain(); g.gain.value=.5; s.connect(f); f.connect(g); g.connect(master); s.start(); return {stop(){ try{ s.stop(); }catch(e){} }}; }

/* Bruit rose : entre le blanc, sifflant, et le brun, sourd. C'est le souffle le plus
   souvent cité pour l'attention. Le filtre dérive très lentement pour que la boucle du
   tampon ne s'entende pas comme une texture qui revient. */
function rose(){ const s=ctx.createBufferSource(); s.buffer=bruit(12,'rose'); s.loop=true;
  const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=2600; f.Q.value=.3;
  const g=ctx.createGain(); g.gain.value=.58;
  const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=.013; lg.gain.value=700; lfo.connect(lg); lg.connect(f.frequency);
  s.connect(f); f.connect(g); g.connect(master); s.start(); lfo.start();
  return {stop(){ [s,lfo].forEach(x=>{ try{ x.stop(); }catch(e){} }); }}; }

/* Vagues : trois oscillations lentes de périodes volontairement incommensurables, pour
   que le ressac ne revienne jamais au même point, plus le souffle d'une vague qui casse
   de loin en loin. */
function vagues(){
  const s=ctx.createBufferSource(); s.buffer=bruitBlanc; s.loop=true;
  const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=700; f.Q.value=.4;
  const g=ctx.createGain(); g.gain.value=.22;
  const fond=ctx.createBufferSource(); fond.buffer=bruit(8,'brun'); fond.loop=true;
  const ff=ctx.createBiquadFilter(); ff.type='lowpass'; ff.frequency.value=160; const fg=ctx.createGain(); fg.gain.value=.38;
  s.connect(f); f.connect(g); g.connect(master); fond.connect(ff); ff.connect(fg); fg.connect(master);
  const lfos=[[.055,.075,520],[.031,.05,300],[.0173,.03,170]].map(function(c){
    const o=ctx.createOscillator(), a=ctx.createGain(), b=ctx.createGain();
    o.frequency.value=c[0]; a.gain.value=c[1]; b.gain.value=c[2];
    o.connect(a); a.connect(g.gain); o.connect(b); b.connect(f.frequency); o.start(); return o; });
  s.start(); fond.start();
  const casse=setInterval(function(){ if(Math.random()>.35) return;   // une vague qui se brise
    const t=ctx.currentTime, v=ctx.createBufferSource(); v.buffer=bruitBlanc;
    const vf=ctx.createBiquadFilter(); vf.type='bandpass'; vf.frequency.value=900+Math.random()*1400; vf.Q.value=.5;
    const vg=ctx.createGain(); const d=2.5+Math.random()*2.5;
    vg.gain.setValueAtTime(.0005,t); vg.gain.linearRampToValueAtTime(.09+Math.random()*.05,t+d*.35); vg.gain.exponentialRampToValueAtTime(.0005,t+d);
    v.connect(vf); vf.connect(vg); vg.connect(master); v.start(t); v.stop(t+d+.1); },4000);
  return {stop(){ clearInterval(casse); [s,fond].concat(lfos).forEach(x=>{ try{ x.stop(); }catch(e){} }); }}; }

/* Feu de bois : un souffle grave, et des crépitements qui arrivent par petites rafales
   plutôt qu'à intervalle régulier — c'est l'irrégularité qui fait le feu. */
function feu(){
  const s=ctx.createBufferSource(); s.buffer=bruit(10,'brun'); s.loop=true;
  const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=240; const g=ctx.createGain(); g.gain.value=.5;
  const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=.09; lg.gain.value=.08; lfo.connect(lg); lg.connect(g.gain);
  s.connect(f); f.connect(g); g.connect(master); s.start(); lfo.start();
  let rafale=0;
  const crepite=setInterval(function(){
    if(rafale<=0){ if(Math.random()<.3) rafale=1+Math.floor(Math.random()*5); else return; }
    rafale--;
    const t=ctx.currentTime+Math.random()*.08, c=ctx.createBufferSource(); c.buffer=bruitBlanc;
    const cf=ctx.createBiquadFilter(); cf.type='bandpass'; cf.frequency.value=1200+Math.random()*4500; cf.Q.value=1.2+Math.random()*2;
    const cg=ctx.createGain(); const d=.02+Math.random()*.06;
    cg.gain.setValueAtTime(.07+Math.random()*.16,t); cg.gain.exponentialRampToValueAtTime(.0005,t+d);
    c.connect(cf); cf.connect(cg); cg.connect(master); c.start(t); c.stop(t+d+.05); },110);
  return {stop(){ clearInterval(crepite); [s,lfo].forEach(x=>{ try{ x.stop(); }catch(e){} }); }}; }

/* Nappes : des accords très longs qui se fondent les uns dans les autres. Ni rythme ni
   mélodie — pour qui est distrait par l'un comme par l'autre. La suite d'accords ne se
   répète pas : on avance d'un ou deux crans au hasard dans une boucle de six. */
function nappes(){
  const rev=reverb(4.5), revG=ctx.createGain(); revG.gain.value=.85; rev.connect(revG); revG.connect(master);
  const sec=ctx.createGain(); sec.gain.value=.85; sec.connect(master); sec.connect(rev);
  const ACCORDS=[[48,55,62,64],[45,52,59,64],[41,48,55,60],[43,50,57,62],[50,57,64,69],[40,47,55,59]];
  let i=Math.floor(Math.random()*ACCORDS.length), transpo=0, timer=null, vivant=true;
  function poser(){
    const t=ctx.currentTime+.05, duree=15+Math.random()*8, acc=ACCORDS[i];
    acc.forEach(function(m,k){ note(m+transpo,t+k*.7,duree,{type:'sine',vol:.085,filtre:800+Math.random()*600,harm:.45,detune:2.004,attaque:3.5+Math.random()*2,sortie:sec}); });
    if(Math.random()<.5) note(acc[acc.length-1]+12+transpo,t+2,duree*.7,{vol:.03,filtre:2800,attaque:4,sortie:sec});
    i=(i+1+Math.floor(Math.random()*2))%ACCORDS.length;
    if(Math.random()<.25) transpo=[0,0,0,-2,2,3,-5][Math.floor(Math.random()*7)];
    return duree;
  }
  (function boucle(){ if(!vivant) return; const d=poser(); timer=setTimeout(boucle,d*620); })();
  return {stop(){ vivant=false; clearTimeout(timer); setTimeout(function(){ try{ sec.disconnect(); revG.disconnect(); }catch(e){} },8000); }}; }

/* Ronron : un chat qui ronronne contre toi. La vibration est un train d'impulsions vers 25 Hz
   (le larynx du chat), riche en harmoniques graves, et un souffle filtré passe au même rythme.
   Le chat ronronne en respirant : l'inspiration plus douce et un peu plus lente, l'expiration
   plus forte, des durées tirées à chaque souffle et, de loin en loin, un temps d'arrêt. Deux
   oscillations lentes de périodes incommensurables font dériver le timbre et la force : la même
   respiration ne revient jamais. La caresse du compagnon reprend la même voix, deux souffles. */
let ondeRonron=null;
function voixRonron(sortie){
  // une vibration ronde : peu d'harmoniques, qui décroissent vite — des impulsions arrondies, pas des clics
  if(!ondeRonron){ const n=16, re=new Float32Array(n), im=new Float32Array(n); for(let k=1;k<n;k++) re[k]=Math.pow(.77,k); ondeRonron=ctx.createPeriodicWave(re,im); }
  const vib=ctx.createOscillator(); vib.setPeriodicWave(ondeRonron); vib.frequency.value=23;
  // le timbre : la poitrine du chat, grave et chaude ; deux passe-bas à la suite pour qu'il ne grésille pas
  const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=270; lp.Q.value=.5;
  const lp2=ctx.createBiquadFilter(); lp2.type='lowpass'; lp2.frequency.value=380; lp2.Q.value=.4;
  const corps=ctx.createBiquadFilter(); corps.type='peaking'; corps.frequency.value=95; corps.Q.value=.9; corps.gain.value=7;
  const voix=ctx.createGain(); voix.gain.value=.27;
  vib.connect(lp); lp.connect(lp2); lp2.connect(corps); corps.connect(voix);
  // un souffle discret et grave, au même rythme
  const s=ctx.createBufferSource(); s.buffer=bruit(5,'brun'); s.loop=true;
  const sf=ctx.createBiquadFilter(); sf.type='lowpass'; sf.frequency.value=400; sf.Q.value=.3;
  const am=ctx.createGain(); am.gain.value=0; const prof=ctx.createGain(); prof.gain.value=.5; vib.connect(prof); prof.connect(am.gain);
  const grain=ctx.createGain(); grain.gain.value=1.6;
  s.connect(sf); sf.connect(am); am.connect(grain); grain.connect(voix);
  const souffle=ctx.createGain(); souffle.gain.value=.0001; voix.connect(souffle); souffle.connect(sortie);
  vib.start(); s.start();
  return {vib:vib,lp:lp,voix:voix,souffle:souffle,stop:function(t){ t=Math.max(t||0,ctx.currentTime); [vib,s].forEach(x=>{ try{ x.stop(t+.05); }catch(e){} });
    setTimeout(()=>{ try{ souffle.disconnect(); }catch(e){} },(t-ctx.currentTime)*1000+400); }};
}
/* un souffle : l'inspiration, un petit arrêt, l'expiration, en courbes douces (pas de rampes
   droites, qui s'entendent comme des bords) ; rend l'instant où il finit */
function souffleRonron(v,t,force){ force=force||1; const g=v.souffle.gain, f=v.vib.frequency;
  const ins=.95+Math.random()*.55, exp=1.15+Math.random()*.7, arret=.08+Math.random()*.16;
  const a1=(.45+Math.random()*.15)*force, a2=(.85+Math.random()*.15)*force;
  f.setValueAtTime(20+Math.random()*2,t);
  g.setValueAtTime(.0001,t); g.setTargetAtTime(a1,t,.13); g.setTargetAtTime(a1*.8,t+ins*.55,.25); g.setTargetAtTime(.0001,t+ins-.2,.08);
  const t2=t+ins+arret; f.setValueAtTime(22.5+Math.random()*2.5,t2);
  g.setValueAtTime(.0001,t2); g.setTargetAtTime(a2,t2,.11); g.setTargetAtTime(a2*.75,t2+exp*.55,.3); g.setTargetAtTime(.0001,t2+exp-.22,.09);
  return t2+exp; }
function ronron(){
  const v=voixRonron(master);
  const lfos=[[.019,90,v.lp.frequency],[.0123,.07,v.voix.gain]].map(function(c){ const o=ctx.createOscillator(), a=ctx.createGain(); o.frequency.value=c[0]; a.gain.value=c[1]; o.connect(a); a.connect(c[2]); o.start(); return o; });
  let suite=ctx.currentTime+.1, vivant=true, timer=null;
  (function respirer(){ if(!vivant) return;
    while(suite<ctx.currentTime+2.5){ let fin=souffleRonron(v,Math.max(suite,ctx.currentTime+.05)); fin+=.12+Math.random()*.3;
      if(Math.random()<.07) fin+=.8+Math.random()*1.6;   // de loin en loin, le chat s'arrête un instant
      suite=fin; }
    timer=setTimeout(respirer,700); })();
  return {stop(){ vivant=false; clearTimeout(timer); const t=ctx.currentTime; v.souffle.gain.cancelScheduledValues(t); v.souffle.gain.setTargetAtTime(.0001,t,.08); v.stop(t+.5);
    lfos.forEach(o=>{ try{ o.stop(); }catch(e){} }); }}; }

/* La caresse du compagnon (bureau.js) : un son doux et bref, seulement au clic de l'élève,
   jamais tout seul ; muet pendant un contrôle blanc ou une vidéo ; réglé par le volume de la
   musique, et plus bas qu'elle (sous 0,05 efficace, mesuré par tests/musique_test.py). Un son
   par famille d'animal : les chats et le lionceau ronronnent, la perruche pépie, le chien
   gémit de contentement, le lapin, le renard et le panda couinent, le dinosaure et le dragon
   grognent tout doux, les peluches font « pouic ». */
const SONS_COMPAGNON={chaton:'ronron','chat-tigre':'ronron','chat-noir':'ronron','chat-gris':'ronron',lionceau:'ronron',
  perruche:'pepie',chien:'gemit',lapin:'couine',renard:'couine',panda:'couine',dinosaure:'grogne',dragon:'grogne',
  'peluche-elephant':'pouic','peluche-girafe':'pouic','peluche-tigre':'pouic'};
function caresse(quoi){
  if(silence.controle||silence.video||!contexte()) return null;
  if(!bruitBlanc) bruitBlanc=bruit(4,'blanc');
  try{ ctx.resume(); }catch(e){}
  const type=SONS_COMPAGNON[quoi]||quoi||'ronron', sortie=ctx.createGain(); sortie.gain.value=.55; sortie.connect(master);
  const t=ctx.currentTime+.04;
  // les sons aigus et brefs portent mieux à l'oreille que le ronron grave : un peu plus forts
  const glisse=(f1,f2,t0,d,v,forme)=>{ v*=1.8; const o=ctx.createOscillator(), g=ctx.createGain(); o.type=forme||'sine';
    o.frequency.setValueAtTime(f1,t0); o.frequency.exponentialRampToValueAtTime(f2,t0+d*.7);
    g.gain.setValueAtTime(.0001,t0); g.gain.linearRampToValueAtTime(v,t0+Math.min(.03,d*.25)); g.gain.exponentialRampToValueAtTime(.0005,t0+d);
    o.connect(g); g.connect(sortie); o.start(t0); o.stop(t0+d+.05); return o; };
  let fin=t+1;
  if(type==='ronron'){ const v=voixRonron(sortie); fin=souffleRonron(v,t,.9); fin=souffleRonron(v,fin+.12,.7); v.stop(fin); }
  else if(type==='pepie'){ let u=t; const n=3+Math.floor(Math.random()*2); for(let i=0;i<n;i++){ const f=2600+Math.random()*900; glisse(f,f*1.35,u,.07+Math.random()*.03,.09); u+=.11+Math.random()*.07; } fin=u+.1; }
  else if(type==='couine'){ glisse(820,1150,t,.16,.08); glisse(900,1300,t+.24,.2,.07); fin=t+.5; }
  else if(type==='gemit'){ const o=glisse(520,760,t,.55,.06,'triangle'), vb=ctx.createOscillator(), vg=ctx.createGain(); vb.frequency.value=6; vg.gain.value=18; vb.connect(vg); vg.connect(o.frequency); vb.start(t); vb.stop(t+.6); fin=t+.7; }
  else if(type==='grogne'){ const o=ctx.createOscillator(), f=ctx.createBiquadFilter(), g=ctx.createGain(), tr=ctx.createOscillator(), tg=ctx.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(62,t); o.frequency.linearRampToValueAtTime(55,t+.5); o.frequency.linearRampToValueAtTime(78,t+.85);
    f.type='lowpass'; f.frequency.value=260; g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.16,t+.12); g.gain.linearRampToValueAtTime(.11,t+.6); g.gain.exponentialRampToValueAtTime(.0005,t+.95);
    tr.frequency.value=22; tg.gain.value=.06; tr.connect(tg); tg.connect(g.gain);
    o.connect(f); f.connect(g); g.connect(sortie); o.start(t); tr.start(t); o.stop(t+1); tr.stop(t+1); fin=t+1; }
  else if(type==='pouic'){ glisse(1400,1900,t,.09,.06,'triangle'); glisse(1900,1300,t+.11,.12,.05,'triangle'); fin=t+.3; }
  setTimeout(()=>{ try{ sortie.disconnect(); }catch(e){} },(fin-ctx.currentTime)*1000+600);
  return type; }
window.Musique=Object.assign(window.Musique||{},{caresse:caresse,SONS_COMPAGNON:SONS_COMPAGNON});

function demarrer(){ if(!contexte()) return false; if(!bruitBlanc) bruitBlanc=bruit(4,'blanc'); arreterMoteur();
  if(etat.ambiance==='silence') return true;
  const MOTEURS={pluie:pluie,vagues:vagues,feu:feu,rose:rose,brun:brun,nappes:nappes,ronron:ronron};
  const f=MOTEURS[etat.ambiance];
  courant= f ? f() : musicien(etat.ambiance); return true; }
function arreterMoteur(){ if(courant){ courant.stop(); courant=null; } }

/* ---------- lecture, pause, règles ---------- */
let enAttenteGeste=false;
async function jouer(parGeste){ etat.joue=true; sauver(); raisonPause=null;
  if(!contexte()){ peindre(); return; }
  try{ await ctx.resume(); }catch(e){}
  if(ctx.state!=='running'){ enAttenteGeste=true; peindre(); const une=()=>{ document.removeEventListener('pointerdown',une); document.removeEventListener('keydown',une); if(etat.joue) jouer(true); }; document.addEventListener('pointerdown',une); document.addEventListener('keydown',une); return; }
  enAttenteGeste=false; if(!minuteurEnPause()) demarrer(); peindre(); }
function couper(){ etat.joue=false; sauver(); arreterMoteur(); peindre(); }
function pauser(raison){ if(!etat.joue) return; raisonPause=raison; arreterMoteur(); peindre(); }
function reprendre(raison){ if(raisonPause!==raison) return; raisonPause=null; if(etat.joue&&ctx&&ctx.state==='running'&&!minuteurEnPause()) demarrer(); peindre(); }
P.on('video',d=>{ silence.video=!!(d&&d.lecture); if(silence.video) pauser('video'); else reprendre('video'); });
P.on('controle',d=>{ silence.controle=!!(d&&d.debut); if(silence.controle) pauser('controle'); else reprendre('controle'); });
document.addEventListener('play',e=>{ if(e.target.tagName==='VIDEO'){ silence.video=true; pauser('video'); } },true);
document.addEventListener('pause',e=>{ if(e.target.tagName==='VIDEO'){ silence.video=false; reprendre('video'); } },true);
document.addEventListener('click',e=>{ if(e.target.closest('.video .lancer')) pauser('video'); });

/* ---------- le minuteur 25 / 5 ---------- */
const M=()=>etat.minuteur;
function minuteurEnPause(){ return M().actif&&M().phase==='pause'; }
function minuteurReste(){ const m=M(); if(!m.actif) return 0; const duree=(m.phase==='travail'?m.travail:m.pause)*60e3; return Math.max(0,duree-(Date.now()-m.debut)); }
function tic(){ const m=M(); if(!m.actif) return; if(minuteurReste()>0) return;
  if(m.phase==='travail'){ m.phase='pause'; m.debut=Date.now(); sauver(); arreterMoteur(); window.Bureau&&Bureau.toast('<span aria-hidden="true">☕</span><strong>Pause de '+m.pause+' minutes.</strong><span>Lève-toi, regarde au loin. La musique reprendra toute seule.</span>',8000); }
  else { m.phase='travail'; m.debut=Date.now(); sauver(); if(etat.joue&&ctx&&ctx.state==='running') demarrer(); window.Bureau&&Bureau.toast('<span aria-hidden="true">▶</span><strong>C\'est reparti pour '+m.travail+' minutes.</strong>',5000); P.pauseFaite(); }
  peindre(); }
function minuteurBasculer(){ const m=M(); m.actif=!m.actif; m.phase='travail'; m.debut=Date.now(); sauver(); if(!m.actif&&etat.joue&&!courant&&ctx&&ctx.state==='running') demarrer(); peindre(); }
setInterval(()=>{ tic(); if(M().actif) peindreMinuteur(); },1000);
const mmss=ms=>{ const s=Math.ceil(ms/1000); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };

/* ---------- l'interface ---------- */
const zone=document.getElementById('pastille-musique'); if(!zone) return;
const bouton=zone.querySelector('button');
const panneau=document.createElement('div'); panneau.id='panneau-musique'; panneau.hidden=true; panneau.setAttribute('role','dialog'); panneau.setAttribute('aria-label','Musique de concentration');
zone.appendChild(panneau);
function peindre(){
  const e=bouton.querySelector('.etat');
  bouton.classList.toggle('joue',etat.joue&&!raisonPause&&!enAttenteGeste);
  e.textContent= enAttenteGeste?'Clique pour reprendre' : raisonPause?'En pause ('+(raisonPause==='video'?'vidéo':'contrôle')+')' : etat.joue?(minuteurEnPause()?'Pause du minuteur':nomAmbiance()) : 'Musique coupée';
  bouton.setAttribute('aria-label','Musique de concentration : '+e.textContent);
  if(panneau.hidden) return;
  panneau.innerHTML='<h3>Musique de concentration</h3>'+
    GROUPES.map(g=>'<div class="groupe-amb" role="group" aria-label="'+(g[0]||'Ambiance')+'">'+
        (g[0]?'<span class="etiq-amb">'+g[0]+'</span>':'')+
        '<div class="ambiances">'+g[1].map(a=>'<button type="button" class="puce" data-ambiance="'+a[0]+'" aria-pressed="'+(etat.ambiance===a[0])+'" title="'+a[2]+'">'+a[1]+'</button>').join('')+'</div></div>').join('')+
    '<div class="ligne"><button type="button" class="btn" data-lecture>'+(etat.joue?'⏸ Couper':'▶ Écouter')+'</button><label><span class="sr">Volume</span><span aria-hidden="true">🔈</span><input type="range" min="0" max="1" step="0.05" value="'+etat.volume+'" data-volume aria-label="Volume"></label></div>'+
    '<div class="ligne"><label class="interrupteur"><input type="checkbox" data-minuteur'+(M().actif?' checked':'')+'><span class="piste" aria-hidden="true"></span>Minuteur 25 / 5</label><span class="minuteur-aff" aria-live="off"></span></div>'+
    '<p class="discret">Ambiances générées par ton navigateur, sans paroles : elles ne se répètent jamais à l\'identique. Coupée par défaut, la musique ne démarre jamais seule et se tait pendant une vidéo ou un contrôle blanc. Ton réglage reste sur cet appareil.</p>';
  peindreMinuteur();
}
function nomAmbiance(){ const a=AMBIANCES.find(x=>x[0]===etat.ambiance); return a?a[1]:''; }
function peindreMinuteur(){ const aff=panneau.querySelector('.minuteur-aff'); const m=M();
  if(aff) aff.textContent= m.actif ? (m.phase==='travail'?'travail ':'pause ')+mmss(minuteurReste()) : '';
  if(m.actif&&!panneau.hidden){ /* rien d'autre */ }
  const pause=document.querySelector('#pastille-pause .etat'); if(pause&&m.actif) pause.textContent=(m.phase==='travail'?'Travail · ':'Pause · ')+mmss(minuteurReste()); }
bouton.addEventListener('click',()=>{ panneau.hidden=!panneau.hidden; bouton.setAttribute('aria-expanded',!panneau.hidden); peindre(); if(!panneau.hidden){ const b=panneau.querySelector('[data-lecture]'); b&&b.focus(); } });
document.addEventListener('click',e=>{ if(!zone.contains(e.target)&&!panneau.hidden){ panneau.hidden=true; bouton.setAttribute('aria-expanded','false'); } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!panneau.hidden){ panneau.hidden=true; bouton.setAttribute('aria-expanded','false'); bouton.focus(); } });
panneau.addEventListener('click',e=>{ e.stopPropagation();
  const a=e.target.closest('[data-ambiance]'); if(a){ etat.ambiance=a.dataset.ambiance; sauver(); if(etat.joue&&ctx&&ctx.state==='running'&&!raisonPause&&!minuteurEnPause()) demarrer(); peindre(); return; }
  if(e.target.closest('[data-lecture]')){ if(etat.joue) couper(); else jouer(true); } });
panneau.addEventListener('input',e=>{ if(e.target.matches('[data-volume]')){ etat.volume=+e.target.value; sauver(); if(master) master.gain.value=etat.volume*.6; } });
panneau.addEventListener('change',e=>{ if(e.target.matches('[data-minuteur]')) minuteurBasculer(); });
Object.assign(window.Musique,{minuteurActif:()=>M().actif,pauser,reprendre,jouer,couper});
peindre();
// reprise d'une page à l'autre : si la musique jouait, on retente (le navigateur peut demander un geste)
if(etat.joue) jouer(false);
})();
