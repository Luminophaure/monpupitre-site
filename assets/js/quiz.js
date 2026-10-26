/* =====================================================================
   QUIZ ET JEUX

   1) QUIZ ÉCRIT À LA MAIN — <div class="quiz" data-titre="...">
      Chaque question est un <div class="question"> :
        • QCM : une liste <ul class="choix"> ; la bonne réponse a class="bon"
        • Réponse à taper : data-reponse="5"  (plusieurs réponses acceptées :
          data-reponse="0,5|1/2"  ;  texte accepté aussi : data-reponse="vrai")
        • L'explication (montrée après la réponse) : <div class="explication">
      data-melanger="non" sur la question garde l'ordre des choix.

   2) JEU À QUESTIONS ALÉATOIRES — <div class="jeu" data-generateurs="fonctions">
      data-questions="10"  nombre de questions par partie
      data-types="calc lecture-image"  (facultatif) ne garder que ces types
      Les générateurs sont dans assets/js/generateurs/<nom>.js
   ===================================================================== */
(function(){
"use strict";
const site=()=>window.Site||{maths(){},chapitre:''};
const melanger=a=>{ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
function enNombre(s){ s=String(s).trim().replace(/−/g,'-').replace(/\s/g,'').replace(',','.'); if(/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(s)){ const [a,b]=s.split('/').map(Number); return a/b; } return /^-?\d*\.?\d+$/.test(s)?parseFloat(s):NaN; }
function normaliser(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,''); }
function bonneSaisie(saisie,attendu,tol){
  return String(attendu).split('|').some(a=>{ const na=enNombre(a), ns=enNombre(saisie);
    if(!isNaN(na)) return !isNaN(ns) && Math.abs(ns-na)<=(tol||1e-9);
    return normaliser(saisie)===normaliser(a); });
}
function lireStockage(k){ try{ const v=localStorage.getItem(k); return v===null?null:JSON.parse(v);}catch(e){return null;} }
function ecrireStockage(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

/* ---------- Une question (commun au quiz et au jeu) ---------- */
function construireQuestion(conteneur,q,surReponse,opts){ opts=opts||{};
  // q : {categorie, enonce, type:'nombre'|'qcm', reponse, choix, explication, tolerance, graphe, grapheApres, media}
  let h='<div class="question">';
  if(q.categorie) h+='<span class="categorie">'+q.categorie+'</span>';
  h+='<div class="enonce">'+q.enonce+'</div>';
  if(q.graphe) h+='<div class="media"><canvas role="img" aria-label="Courbe"></canvas></div>';
  if(q.media) h+='<div class="media">'+q.media+'</div>';
  const id='r'+Math.random().toString(36).slice(2,8);
  if(q.type==='qcm') h+='<ul class="choix">'+q.choix.map((c,i)=>'<li><button type="button" data-i="'+i+'">'+c+'</button></li>').join('')+'</ul>';
  else h+='<form class="saisie"><label class="discret" for="'+id+'">Ta réponse :</label><input id="'+id+'" type="text" autocomplete="off" inputmode="text"><button class="btn" type="submit">Valider</button></form>';
  /* aria-live : le verdict et l'explication sont injectés ici sans que le focus bouge.
     Sans région live, un élève au lecteur d'écran répond et n'apprend rien — or le
     verdict est tout le travail pédagogique du quiz. */
  h+='<div class="zone-retour" role="status" aria-live="polite"></div></div>';
  conteneur.innerHTML=h;
  const el=conteneur.firstElementChild; site().maths(el);
  let reg=null;
  if(q.graphe&&window.Graphe){ const cv=el.querySelector('canvas'); let o=q.graphe; reg=Graphe.enregistrer(cv,()=>o); el._changerGraphe=n=>{o=n;Graphe.dessiner(cv,o);}; }
  let fini=false;
  function conclure(ok,montrer,saisie){
    if(fini) return; fini=true;
    el.querySelectorAll('button,input').forEach(b=>{ if(!b.closest('.zone-retour')) b.disabled=true; });
    const z=el.querySelector('.zone-retour');
    if(opts.controle){ z.innerHTML='<div class="retour neutre"><span class="verdict">Réponse enregistrée. La correction arrive à la fin.</span></div>'; surReponse(ok,el,{attendu:montrer,saisie}); return; }
    z.innerHTML='<div class="retour '+(ok?'bon':'mauvais')+'"><span class="verdict">'+(ok?'Bravo !':'Pas tout à fait. La réponse attendue : '+montrer+'.')+'</span>'+(q.explication?'<div>'+q.explication+'</div>':'')+'</div>';
    site().maths(z);
    if(q.grapheApres&&el._changerGraphe) el._changerGraphe(q.grapheApres);
    surReponse(ok,el);
  }
  if(q.type==='qcm'){
    el.querySelectorAll('.choix button').forEach(b=>b.addEventListener('click',()=>{
      const i=+b.dataset.i, ok=i===q.reponse;
      if(!opts.controle){ el.querySelectorAll('.choix button').forEach(x=>{ if(+x.dataset.i===q.reponse) x.classList.add('bon'); }); if(!ok) b.classList.add('mauvais'); }
      else b.classList.add('choisi');
      conclure(ok,q.choix[q.reponse],q.choix[i]);
    }));
  } else {
    const f=el.querySelector('form'), inp=el.querySelector('input');
    f.addEventListener('submit',e=>{ e.preventDefault(); const v=inp.value.trim(); if(!v) return;
      const attendu=String(q.reponse); const numerique=!isNaN(enNombre(attendu.split('|')[0]));
      if(numerique&&isNaN(enNombre(v))){ el.querySelector('.zone-retour').innerHTML='<p class="discret">Écris un nombre, par exemple −3, 2,5 ou 1/3.</p>'; return; }
      conclure(bonneSaisie(v,attendu,q.tolerance), attendu.split('|')[0].replace('-','−'), v); });
  }
  return {el,detruire(){ if(reg) Graphe.oublier(reg); }};
}

/* ---------- 1) Quiz écrit à la main ---------- */
function initQuiz(bloc){
  if(bloc._pret) return; bloc._pret=true;
  const questions=[...bloc.querySelectorAll(':scope > .question')].map(qd=>{
    const exp=qd.querySelector('.explication'); const explication=exp?exp.innerHTML:'';
    if(exp) exp.remove();
    const ul=qd.querySelector('ul.choix');
    if(ul){ let lis=[...ul.children]; if(qd.dataset.melanger!=='non') lis=melanger(lis);
      const choix=lis.map(li=>li.innerHTML), rep=lis.findIndex(li=>li.classList.contains('bon')); ul.remove();
      return {enonce:qd.innerHTML,type:'qcm',choix,reponse:rep,explication}; }
    return {enonce:qd.innerHTML,type:'nombre',reponse:qd.dataset.reponse||'',tolerance:enNombre(qd.dataset.tolerance||'0')||0,explication};
  });
  const titre=bloc.dataset.titre||'Quiz';
  bloc.innerHTML='<div class="quiz-tete"><h3>'+titre+'</h3><div class="stats"><span>Score <b class="sc">0</b> / '+questions.length+'</span></div></div><div class="liste"></div><div class="fin"></div>';
  const liste=bloc.querySelector('.liste'); let score=0, faits=0;
  function lancer(){ score=0; faits=0; bloc.querySelector('.sc').textContent='0'; bloc.querySelector('.fin').innerHTML=''; liste.innerHTML='';
    questions.forEach(q=>{ const d=document.createElement('div'); liste.appendChild(d);
      construireQuestion(d,q,ok=>{ if(ok) score++; faits++; bloc.querySelector('.sc').textContent=score;
        if(faits===questions.length) { if(window.Pupitre&&Pupitre.travail) Pupitre.travail(); bloc.querySelector('.fin').innerHTML='<div class="retour '+(score===questions.length?'bon':'mauvais')+'"><span class="verdict">Résultat : '+score+' / '+questions.length+'</span><div><button class="btn fantome" type="button">Recommencer</button></div></div>'; bloc.querySelector('.fin button').addEventListener('click',lancer); } }); }); }
  lancer();
}

/* ---------- 2) Jeu à questions aléatoires ---------- */
function initJeu(bloc){
  if(bloc._pret) return; bloc._pret=true;
  const noms=(bloc.dataset.generateurs||'').split(/\s+/).filter(Boolean);
  const gens=noms.map(n=>(window.GENERATEURS||{})[n]).filter(Boolean);
  if(!gens.length){ bloc.innerHTML='<p class="retour mauvais">Jeu : générateur « '+noms.join(' ')+' » introuvable. Vérifie le fichier assets/js/generateurs/'+(noms[0]||'?')+'.js</p>'; return; }
  const types={}, cats={}; gens.forEach(g=>{ Object.assign(types,g.types); Object.assign(cats,g.categories||{}); });
  let choisis=(bloc.dataset.types||'').split(/\s+/).filter(t=>types[t]);
  if(!choisis.length) choisis=gens.flatMap(g=>g.ordre||Object.keys(g.types));
  const N=parseInt(bloc.dataset.questions||'10',10);
  const controle=bloc.dataset.mode==='controle', minutes=parseInt(bloc.dataset.minutes||'0',10);
  const cle='jeu:'+(site().chapitre||location.pathname)+':'+noms.join('+');
  const titre=bloc.dataset.titre||'Jeu';
  bloc.innerHTML='<div class="jeu-tete"><h3>'+titre+'</h3><div class="stats"><span class="qn"></span>'+(controle?'<span class="chrono" aria-live="off"></span>':'<span>Score <b class="sc">0</b></span><span>Série <b class="se">0</b></span><span>Record <b class="re">–</b></span>')+'</div></div><div class="progression"><i></i></div><div class="corps"></div>';
  const $=s=>bloc.querySelector(s);
  const G={i:0,score:0,serie:0,res:[],qs:[],courant:null,record:lireStockage(cle),fin:0,timer:null};
  function hud(){ $('.qn').textContent= G.i<N ? 'Question '+(G.i+1)+' / '+N : 'Terminé'; if(!controle){ $('.sc').textContent=G.score; $('.se').textContent=G.serie; $('.re').textContent=G.record==null?'–':G.record+' / '+N; } $('.progression i').style.setProperty('--p',(Math.min(G.i,N)/N*100)+'%'); }
  function chrono(){ if(!minutes) return; const r=Math.max(0,G.fin-Date.now()); const s=Math.ceil(r/1000); $('.chrono').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); if(r<=0){ clearInterval(G.timer); bilan(true); } }
  function nouvellePartie(){
    const pioche=[]; while(pioche.length<N) pioche.push(...melanger(choisis.slice()));
    G.qs=pioche.slice(0,N); G.i=0; G.score=0; G.serie=0; G.res=[];
    if(controle){ if(window.Pupitre) Pupitre.emettre('controle',{debut:true}); if(minutes){ G.fin=Date.now()+minutes*60e3; clearInterval(G.timer); G.timer=setInterval(chrono,500); chrono(); } }
    question(); }
  function question(){
    hud(); if(G.courant) G.courant.detruire();
    const type=G.qs[G.i]; const q=types[type](); q.categorie=q.categorie||cats[type]||'';
    const d=$('.corps'); d.innerHTML='';
    G.courant=construireQuestion(d,q,(ok,el,detail)=>{
      if(ok){G.score++;G.serie++;} else G.serie=0; G.res.push({cat:q.categorie,ok,enonce:q.enonce,explication:q.explication||'',attendu:detail&&detail.attendu,saisie:detail&&detail.saisie}); hud();
      const b=document.createElement('div'); b.className='suite-question';
      b.innerHTML='<button class="btn" type="button">'+(G.i<N-1?'Question suivante':'Voir mon bilan')+'</button>';
      el.appendChild(b); const bt=b.querySelector('button');
      bt.addEventListener('click',()=>{ G.i++; if(G.i<N) question(); else bilan(); });
      try{ bt.focus({preventScroll:true}); }catch(e){}
    },{controle});
  }
  function bilan(tempsEcoule){
    if(G.courant){ G.courant.detruire(); G.courant=null; }
    if(controle){ clearInterval(G.timer); if(window.Pupitre){ Pupitre.emettre('controle',{debut:false}); Pupitre.etape(site().chapitreId,'controle'); Pupitre.succes.debloquer('controle-blanc'); Pupitre.jourActif(); }
      const n=G.res.length; const par={}; G.res.forEach(r=>{ par[r.cat]=par[r.cat]||{n:0,ok:0}; par[r.cat].n++; if(r.ok) par[r.cat].ok++; });
      $('.corps').innerHTML='<div class="question"><h3>'+G.score+' / '+n+(tempsEcoule?' · temps écoulé':'')+'</h3><p>'+(G.score>=0.8*n?'Tu es prêt. Relis quand même les questions ratées.':G.score>=0.5*n?'Pas mal. Les notions à reprendre sont listées en rouge.':'Reprends le cours et les méthodes des notions en rouge avant le vrai contrôle.')+'</p>'+
        '<div class="bilan">'+Object.keys(par).map(k=>'<div class="rangee"><span>'+k+'</span><span class="m '+(par[k].ok===par[k].n?'ok':'ko')+'">'+par[k].ok+' / '+par[k].n+'</span></div>').join('')+'</div>'+
        '<h4>Question par question</h4><div class="bilan-controle">'+G.res.map((r,i)=>'<div class="q '+(r.ok?'ok':'ko')+'"><span class="categorie">'+(i+1)+' · '+r.cat+'</span><div>'+r.enonce+'</div><div class="discret">Ta réponse : '+(r.saisie!=null?r.saisie:'—')+(r.ok?' ✓':' · attendu : '+r.attendu)+'</div>'+(r.explication&&!r.ok?'<div class="explication">'+r.explication+'</div>':'')+'</div>').join('')+'</div>'+
        '<div><button class="btn" type="button">Refaire un contrôle blanc</button></div></div>';
      site().maths($('.corps')); if(window.Graphe&&Graphe.init) Graphe.init($('.corps')); $('.corps > .question > div > button').addEventListener('click',nouvellePartie); hud(); return; }
    if(window.Pupitre&&Pupitre.travail) Pupitre.travail();   // un jeu mené au bout est un jour de travail, quel que soit le score
    if(G.record==null||G.score>G.record){ G.record=G.score; ecrireStockage(cle,G.score); }
    if(window.Pupitre&&G.score>=0.7*N){ Pupitre.etape(site().chapitreId,'entrainer'); }
    hud();
    const par={}; G.res.forEach(r=>{ par[r.cat]=par[r.cat]||{n:0,ok:0}; par[r.cat].n++; if(r.ok) par[r.cat].ok++; });
    const faibles=Object.keys(par).filter(k=>par[k].ok<par[k].n);
    const msg= G.score===N ? 'Parfait. Relance une partie pour vérifier que ce n\'était pas de la chance.' : G.score>=0.7*N ? 'Solide. Revois les catégories en rouge, puis relance.' : 'Relis le cours et les méthodes, puis retente une partie.';
    $('.corps').innerHTML='<div class="question"><h3>'+G.score+' / '+N+'</h3><p>'+msg+'</p><div class="bilan">'+Object.keys(par).map(k=>'<div class="rangee"><span>'+k+'</span><span class="m '+(par[k].ok===par[k].n?'ok':'ko')+'">'+par[k].ok+' / '+par[k].n+'</span></div>').join('')+'</div>'+(faibles.length?'<p class="discret">À retravailler : '+faibles.join(', ')+'.</p>':'')+'<div><button class="btn" type="button">Nouvelle partie</button></div></div>';
    $('.corps button').addEventListener('click',nouvellePartie);
  }
  nouvellePartie();
}

window.Quiz={init(r){ r=r||document; r.querySelectorAll('.quiz').forEach(initQuiz); r.querySelectorAll('.jeu').forEach(initJeu); }, construireQuestion, bonneSaisie};
})();
