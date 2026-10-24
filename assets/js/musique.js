/* =====================================================================
   MUSIQUE DE CONCENTRATION — un petit lecteur dans le coin de l'écran.

   Les ambiances sont GÉNÉRÉES par le navigateur (Web Audio) : aucun
   fichier audio, aucune question de droits, rien n'est téléchargé.
     lofi    : accords feutrés, rythme lent, craquements de vinyle
     piano   : notes douces, lentes, avec de la réverbération
     pluie   : averse continue et gouttes
     brun    : bruit brun, grave et régulier
     silence : rien, seulement le minuteur
   Règles (cahier des charges) : coupée par défaut, ne démarre jamais
   seule, se coupe pendant une vidéo et pendant un contrôle blanc ;
   réglages gardés sur l'appareil seulement ; utilisable au clavier.
   Le minuteur 25 / 5 remplace le rappel de pause des 45 minutes.
   ===================================================================== */
(function(){
"use strict";
const P=window.Pupitre; if(!P) return;
const AMBIANCES=[['lofi','Lo-fi','accords feutrés, rythme lent'],['piano','Piano calme','notes douces, lentes'],['pluie','Pluie','averse et gouttes'],['brun','Bruit brun','grave et régulier'],['silence','Silence','seulement le minuteur']];
const etat=Object.assign({ambiance:'lofi',volume:.5,joue:false,minuteur:{actif:false,travail:25,pause:5,debut:0,phase:'travail'}},P.lire('musique',{}));
const sauver=()=>P.ecrire('musique',etat);

/* ---------- le moteur sonore ---------- */
let ctx=null, master=null, courant=null, raisonPause=null;
function contexte(){ if(ctx) return ctx; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; ctx=new AC(); master=ctx.createGain(); master.gain.value=etat.volume*.6; master.connect(ctx.destination); return ctx; }
function bruit(secondes,type){ const n=Math.floor(ctx.sampleRate*secondes), b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0); let last=0;
  for(let i=0;i<n;i++){ const w=Math.random()*2-1; if(type==='brun'){ last=(last+.02*w)/1.02; d[i]=last*3.5; } else d[i]=w; } return b; }
function reverb(duree){ const n=Math.floor(ctx.sampleRate*duree), b=ctx.createBuffer(2,n,ctx.sampleRate);
  for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2); }
  const cv=ctx.createConvolver(); cv.buffer=b; return cv; }
const freq=m=>440*Math.pow(2,(m-69)/12);

/* une note douce : deux oscillateurs, enveloppe, filtre */
function note(midi,t,duree,opts){ opts=opts||{}; const o1=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
  o1.type=opts.type||'sine'; o2.type='triangle'; o1.frequency.value=freq(midi); o2.frequency.value=freq(midi)*(opts.detune||2.003);
  f.type='lowpass'; f.frequency.value=opts.filtre||1800; const v=opts.vol||.18;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+(opts.attaque||.02)); g.gain.exponentialRampToValueAtTime(v*.35,t+Math.min(duree*.5,1.2)); g.gain.exponentialRampToValueAtTime(.0005,t+duree);
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
  const bpm= style==='piano'?58:72, temps=60/bpm;
  // accords (notes MIDI) : piano en do majeur, lofi en ii–V–I–vi avec septièmes
  const grille= style==='piano' ? [[48,55,60,64,67],[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62]] : [[38,50,53,57,60],[43,50,53,55,59],[36,48,52,55,59],[45,48,52,55,60]];
  const gamme= style==='piano' ? [60,62,64,67,69,72,74,76,79] : [60,62,64,65,67,69,71,72,74,76];
  let mesure=0, temps_i=0, prochain=ctx.currentTime+.1, derniere=67, nappe=null;
  function pas(){
    const acc=grille[mesure%grille.length], t=prochain;
    if(temps_i===0){ // nouvel accord : basse + nappe
      note(acc[0],t,temps*3.6,{type:'sine',vol:style==='piano'?.14:.2,filtre:500,harm:.1,sortie:sec});
      if(style==='lofi'){ acc.slice(1).forEach((m,i)=>note(m,t+.02*i,temps*3.8,{type:'sine',vol:.07,filtre:1100,harm:.5,detune:2.002,attaque:.08,sortie:sec})); }
      else if(Math.random()<.7){ acc.slice(1,4).forEach((m,i)=>note(m,t+.03*i,temps*3.5,{vol:.07,filtre:1500,attaque:.05,sortie:sec})); }
    }
    // mélodie clairsemée : marche aléatoire sur la gamme
    const p= style==='piano'?.55:.35;
    if(Math.random()<p){ const i=gamme.indexOf(derniere); let j=(i<0?3:i)+(Math.random()<.5?-1:1)*(Math.random()<.7?1:2); j=Math.max(0,Math.min(gamme.length-1,j)); derniere=gamme[j];
      note(derniere,t+(style==='lofi'&&temps_i%2?temps*.08:0),temps*(Math.random()<.3?2:1.1),{vol:style==='piano'?.16:.11,filtre:style==='piano'?2400:1600,sortie:sec}); }
    if(style==='lofi'){ // batterie feutrée, charleston en croches avec swing
      if(temps_i===0||temps_i===2) percussion('kick',t,master); if(temps_i===1||temps_i===3) percussion('caisse',t,master);
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

function demarrer(){ if(!contexte()) return false; if(!bruitBlanc) bruitBlanc=bruit(4,'blanc'); arreterMoteur();
  if(etat.ambiance==='silence') return true;
  courant= etat.ambiance==='pluie'?pluie() : etat.ambiance==='brun'?brun() : musicien(etat.ambiance); return true; }
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
P.on('video',d=>{ if(d&&d.lecture) pauser('video'); else reprendre('video'); });
P.on('controle',d=>{ if(d&&d.debut) pauser('controle'); else reprendre('controle'); });
document.addEventListener('play',e=>{ if(e.target.tagName==='VIDEO') pauser('video'); },true);
document.addEventListener('pause',e=>{ if(e.target.tagName==='VIDEO') reprendre('video'); },true);
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
    '<div class="ambiances" role="group" aria-label="Ambiance">'+AMBIANCES.map(a=>'<button type="button" class="puce" data-ambiance="'+a[0]+'" aria-pressed="'+(etat.ambiance===a[0])+'" title="'+a[2]+'">'+a[1]+'</button>').join('')+'</div>'+
    '<div class="ligne"><button type="button" class="btn" data-lecture>'+(etat.joue?'⏸ Couper':'▶ Écouter')+'</button><label><span class="sr">Volume</span><span aria-hidden="true">🔈</span><input type="range" min="0" max="1" step="0.05" value="'+etat.volume+'" data-volume aria-label="Volume"></label></div>'+
    '<div class="ligne"><label class="interrupteur"><input type="checkbox" data-minuteur'+(M().actif?' checked':'')+'><span class="piste" aria-hidden="true"></span>Minuteur 25 / 5</label><span class="minuteur-aff" aria-live="off"></span></div>'+
    '<p class="discret">Ambiances générées par ton navigateur, sans paroles. Coupée par défaut, elle ne démarre jamais seule et se tait pendant une vidéo ou un contrôle blanc. Ton réglage reste sur cet appareil.</p>';
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
window.Musique={minuteurActif:()=>M().actif,pauser,reprendre,jouer,couper};
peindre();
// reprise d'une page à l'autre : si la musique jouait, on retente (le navigateur peut demander un geste)
if(etat.joue) jouer(false);
})();
