/* versions des fichiers publiés (outils/publication.py) */
window.VERSIONS={"assets/js/banque-outil.js":"1a63c4585e","assets/js/banque.js":"5ca2a464d4","assets/js/bureau.js":"618aa10c7a","assets/js/carnet.js":"5c589cd309","assets/js/chapitres.js":"c153a46fff","assets/js/comptes.js":"07f9ddf9be","assets/js/devoirs.js":"a1b282a8dd","assets/js/espaces.js":"f319eaea9c","assets/js/fiches.js":"3b76e15f0b","assets/js/fond-ambiances.js":"bd0feb1112","assets/js/fond-bureau.js":"dd10ee1138","assets/js/generateurs/electricite.js":"5d10a8c8df","assets/js/generateurs/espace.js":"b690005da4","assets/js/generateurs/fonctions.js":"5a2261ec58","assets/js/generateurs/infrarouges.js":"074c302643","assets/js/generateurs/limites.js":"ab052b43fc","assets/js/generateurs/litteral.js":"7e56253c58","assets/js/generateurs/ondes.js":"0ad2b511c6","assets/js/generateurs/solutions.js":"3294d765e0","assets/js/generateurs/suites-tt.js":"019f889d28","assets/js/generateurs/suites.js":"3165d7e12f","assets/js/generateurs/vecteurs.js":"4def1f5cec","assets/js/graphe.js":"b784063975","assets/js/labos/commun.js":"535121b8b4","assets/js/labos/electricite.js":"dbb8ad7892","assets/js/labos/espace.js":"5329b0d5ea","assets/js/labos/fonctions.js":"4e9e20648c","assets/js/labos/infrarouges.js":"9583395f76","assets/js/labos/limites.js":"eb3b038c49","assets/js/labos/litteral.js":"539e64544a","assets/js/labos/ondes.js":"015123fa3c","assets/js/labos/solutions.js":"3772f7a0f2","assets/js/labos/suites-tt.js":"076e5e7342","assets/js/labos/suites.js":"6ab5c20a8d","assets/js/labos/vecteurs.js":"929b40bac1","assets/js/musique.js":"a0be3adf72","assets/js/notions.js":"3b16de4108","assets/js/pack-bureau.js":"9e78aa7141","assets/js/portes.js":"279ae38887","assets/js/quiz.js":"7a8f34b811","assets/js/tuteur.js":"96fe8a29e6","assets/vendor/katex/auto-render.min.js":"82dca94048","assets/vendor/katex/katex.min.css":"43459d515f","assets/vendor/katex/katex.min.js":"6d481709e3"};
/* =====================================================================
   SCRIPT PRINCIPAL — à inclure une seule fois dans chaque page :
     <script src="../assets/js/site.js" defer></script>
   Il ajoute automatiquement :
     la coque du bureau (bureau.js : bandeau, colonne du classeur, coin
     musique), la barre de parcours, le sommaire ou les onglets, les liens
     précédent/suivant, formules (KaTeX), graphes, quiz, jeux, vidéos,
     numéros d'exercices, filtres, boutons « Copier », tuteur pas à pas.
   Rien à modifier ici pour ajouter un chapitre.
   ===================================================================== */
(function(){
"use strict";
const scriptCourant=document.currentScript;
const RACINE=scriptCourant ? scriptCourant.src.replace(/assets\/js\/site\.js.*$/,'') : '';
const KATEX=RACINE+'assets/vendor/katex/';   // KaTeX est livré avec le site : formules lisibles même hors ligne
/* le site publié donne à chaque script un numéro tiré de son contenu (?v=…) : un fichier modifié est
   rechargé, un fichier inchangé reste en cache. La table window.VERSIONS est posée en tête de ce
   fichier par la publication (outils/publication.py) ; dans les sources, elle n'existe pas. */
const versionnee=u=>{ const v=window.VERSIONS&&u.startsWith(RACINE)&&window.VERSIONS[u.slice(RACINE.length)]; return v?u+'?v='+v:u; };

/* ---------- thème (avant tout, pour éviter un flash) ---------- */
/* Le thème : CLAIR PAR DÉFAUT. Le sombre ne s'active plus tout seul avec la préférence
   du système — c'est un choix de l'élève, fait avec le bouton ◐, et retenu d'une visite à
   l'autre. La couleur de la barre du navigateur (sur téléphone) suit le thème affiché. */
try{ const t=localStorage.getItem('theme'); if(t) document.documentElement.setAttribute('data-theme',t); }catch(e){}
function couleurNavigateur(){
  const metas=[...document.querySelectorAll('meta[name="theme-color"]')];
  metas.slice(1).forEach(m=>m.remove());
  const m=metas[0]||document.head.appendChild(Object.assign(document.createElement('meta'),{name:'theme-color'}));
  // la couleur vient du thème (jeton --barre-navigateur de variables.css), pas du script
  m.removeAttribute('media'); m.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--barre-navigateur').trim());
}
new MutationObserver(couleurNavigateur).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(document.head) couleurNavigateur(); else addEventListener('DOMContentLoaded',couleurNavigateur);

function charger(src){ if(window.MODULES_INCLUS&&window.MODULES_INCLUS[src.replace(RACINE,'')]) return Promise.resolve(); return new Promise((ok,ko)=>{ const s=document.createElement('script'); s.src=versionnee(src); s.onload=ok; s.onerror=()=>ko(new Error('Impossible de charger '+src)); document.head.appendChild(s); }); }
function feuille(href){ if(window.MODULES_INCLUS&&window.MODULES_INCLUS[href.replace(RACINE,'')]) return; const l=document.createElement('link'); l.rel='stylesheet'; l.href=versionnee(href); document.head.appendChild(l); }
const echap=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ---------- formules ---------- */
let katexPret=false; const enAttente=[];
const OPTIONS_KATEX={
  delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false}],
  ignoredTags:['script','noscript','style','textarea','pre','code','option'],
  ignoredClasses:['code-bloc','pas-de-maths'],
  throwOnError:false, trust:c=>c.command==='\\htmlClass',
  macros:{'\\ant':'\\htmlClass{vx}{#1}','\\img':'\\htmlClass{vy}{#1}','\\R':'\\mathbb{R}','\\N':'\\mathbb{N}','\\Z':'\\mathbb{Z}','\\Q':'\\mathbb{Q}','\\D':'\\mathbb{D}'}
};
function maths(el){ if(!el) return; if(katexPret) window.renderMathInElement(el,OPTIONS_KATEX); else enAttente.push(el); }

/* ---------- catalogue ---------- */
const matieres=()=>window.MATIERES||[];
const trouverMatiere=id=>matieres().find(m=>m.id===id)||null;
const lienMatiere=m=>window.AUTONOME?'#':RACINE+'matiere.html?m='+encodeURIComponent(m.id);
function trouverChapitre(matiereId,id){
  const m=trouverMatiere(matiereId); if(!m) return null;
  const plats=[]; (m.niveaux||[]).forEach(n=>n.chapitres.forEach(c=>plats.push(Object.assign({niveau:n.nom,niveauId:n.id},c))));
  const publies=plats.filter(c=>c.fichier); const i=publies.findIndex(c=>c.id===id);
  return {matiere:m, courant:publies[i]||plats.find(c=>c.id===id)||null, prec:i>0?publies[i-1]:null, suiv:i>=0&&i<publies.length-1?publies[i+1]:null};
}

/* ---------- barre du haut + pied (fichier élève autonome seulement) ---------- */
function barre(info){
  const S=window.SITE||{nom:'Maths'};
  const b=document.createElement('header'); b.className='barre gutter';
  let fil='';
  const dernier=t=>'<span class="sep">/</span><span class="fil-courant">'+echap(t)+'</span>';
  if(info&&info.matiere){
    fil='<span class="sep">/</span><a href="'+lienMatiere(info.matiere)+'">'+echap(info.matiere.nom)+'</a>';
    if(info.courant) fil+='<span class="sep">/</span><span>'+echap(info.courant.niveau)+'</span>'+dernier(info.courant.titre);
  }
  else if(document.body.dataset.titrePage) fil=dernier(document.body.dataset.titrePage);
  b.innerHTML='<div class="barre-in"><a class="marque" href="'+(window.AUTONOME?'#':RACINE+'index.html')+'"><span class="logo">f(x)</span><span>'+echap(S.nom)+'</span></a><nav class="fil" aria-label="Fil d\'Ariane">'+fil+'</nav><button class="btn-theme" type="button" aria-label="Changer de thème">◐ Thème</button></div>';
  document.body.prepend(b);
  b.querySelector('.btn-theme').addEventListener('click',()=>{
    /* clair par défaut : sans choix enregistré, on part du clair (voir bureau.js) */
    const r=document.documentElement, sombre= r.dataset.theme==='dark';
    const n= sombre?'light':'dark'; r.setAttribute('data-theme',n); try{localStorage.setItem('theme',n);}catch(e){} });
  const p=document.createElement('footer'); p.className='pied gutter';
  /* © et licence : hors ligne le lien vers Creative Commons serait mort, on garde le
     texte seul. Même mention que dans bureau.js, qui bâtit le pied des autres pages. */
  const l=S.licence, c='© '+(S.annee||new Date().getFullYear())+(S.auteur?' '+echap(S.auteur):'');
  const mention='<span>'+c+(l?' · Contenu sous '+(window.AUTONOME?echap(l.nom)
      :'<a rel="license noopener" target="_blank" href="'+l.url+'">'+echap(l.nom)+'</a>'):'')+'</span>';
  p.innerHTML='<div class="in"><span>'+echap(S.nom)+'</span>'+mention+(window.AUTONOME?'':'<span><a href="'+RACINE+'index.html">Accueil</a> · <a href="'+RACINE+'confidentialite.html">Données et confidentialité</a> · <a href="'+RACINE+'guide.html">Mode d\'emploi</a></span>')+'</div>';
  document.body.appendChild(p);
}

/* ---------- gabarit de chapitre : sommaire + précédent/suivant ---------- */
function gabarit(main,info){
  const page=sceneEtPage(main);
  const sections=[...main.querySelectorAll(':scope > section')];
  if(sections.length>1){
    page.classList.add('avec-sommaire');
    const nav=document.createElement('nav'); nav.className='sommaire'; nav.setAttribute('aria-label','Sommaire');
    nav.innerHTML='<span class="titre surtitre">Sommaire</span>';
    sections.forEach(s=>{ const h=s.querySelector(':scope > h2'); if(!h) return;
      if(!s.id) s.id=identifiant(h.textContent);
      const a=document.createElement('a'); a.href='#'+s.id; a.textContent=h.textContent; nav.appendChild(a); });
    page.appendChild(nav);
    const liens=[...nav.querySelectorAll('a')];
    if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ liens.forEach(a=>a.classList.toggle('actif',a.getAttribute('href')==='#'+e.target.id)); } }); },{rootMargin:'-20% 0px -70% 0px'}); sections.forEach(s=>io.observe(s)); }
  }
  page.appendChild(main);
  suiteChapitres(page,info);
}
/* identifiant lisible tiré d'un titre : « Calculer avec… » → calculer-avec */
function identifiant(t){ return t.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
/* l'en-tête du chapitre passe dans la scène illustrée ; la feuille va dans .page */
function sceneEtPage(main){
  const tete=main.querySelector(':scope > header.chap-tete');
  const scene=document.createElement('div'); scene.className='scene gutter';
  main.before(scene);
  if(tete) scene.appendChild(tete);
  const page=document.createElement('div'); page.className='page gutter';
  scene.after(page);
  return page;
}
/* liens vers le chapitre précédent et le suivant */
function suiteChapitres(page,info){
  if(!info||!(info.prec||info.suiv)) return;
  const s=document.createElement('nav'); s.className='suite'; s.setAttribute('aria-label','Autres chapitres');
  s.innerHTML=(info.prec?'<a href="'+RACINE+info.prec.fichier+'"><small>← Chapitre précédent</small>'+echap(info.prec.titre)+'</a>':'')+
              (info.suiv?'<a class="suivant" href="'+RACINE+info.suiv.fichier+'"><small>Chapitre suivant →</small>'+echap(info.suiv.titre)+'</a>':'');
  page.appendChild(s);
}

/* ---------- mise en page « classeur » : en-tête illustré + parties en onglets ----------
   Activée par <body data-mise-en-page="classeur"> (styles : assets/css/mise-en-page.css).
   Chaque <section> de premier niveau devient un onglet du classeur.               */
function classeur(main,info){
  const page=sceneEtPage(main);
  const sections=[...main.querySelectorAll(':scope > section')].filter(s=>s.querySelector(':scope > h2'));
  const nav=document.createElement('div'); nav.className='onglets'; nav.setAttribute('role','tablist'); nav.setAttribute('aria-label','Parties du chapitre');
  if(window.Pupitre&&!window.AUTONOME&&info&&info.courant) page.appendChild(barreParcours(main,info));
  page.appendChild(nav); page.appendChild(main);
  const ids=sections.map((s,i)=>{ const h=s.querySelector(':scope > h2');
    if(!s.id) s.id=identifiant(h.textContent);
    const b=document.createElement('button'); b.type='button'; b.setAttribute('role','tab'); b.id='onglet-'+s.id; b.setAttribute('aria-controls',s.id);
    b.innerHTML='<span class="n">'+(i+1)+'</span>'+echap(s.dataset.onglet||h.textContent.trim()); nav.appendChild(b);
    s.setAttribute('role','tabpanel'); s.setAttribute('aria-labelledby',b.id); s.tabIndex=-1;
    return s.id; });
  // sous-sommaire des parties du cours (titres h3 avec un id)
  sections.forEach(s=>{ const h3=[...s.querySelectorAll(':scope > h3[id]')]; if(h3.length<3) return;
    const d=document.createElement('nav'); d.className='dans-ce-cours'; d.setAttribute('aria-label','Dans cette partie');
    d.innerHTML='<span>Aller à :</span>'+h3.map(h=>'<a href="#'+h.id+'">'+echap(h.textContent.replace(/^\d+\.\s*/,''))+'</a>').join('')+(s.id==='cours'&&!window.AUTONOME?'<a class="lire-guide" href="'+RACINE+'lire-le-cours.html" title="Le code couleur des blocs, et comment aborder un chapitre">Comment lire ce cours ?</a>':'');
    s.querySelector(':scope > h2').after(d); });
  // bas de chaque partie : précédente / suivante
  sections.forEach((s,i)=>{ const b=document.createElement('div'); b.className='suite-partie';
    b.innerHTML=(i>0?'<button type="button" data-aller="'+ids[i-1]+'">← '+echap(sections[i-1].querySelector('h2').textContent)+'</button>':'')+
      (i<sections.length-1?'<button type="button" class="suivante" data-aller="'+ids[i+1]+'">Partie suivante : '+echap(sections[i+1].querySelector('h2').textContent)+' →</button>':'');
    s.appendChild(b); });
  function activer(id,cible,sansAdresse){
    sections.forEach(s=>{ const on=s.id===id; s.hidden=!on; const b=document.getElementById('onglet-'+s.id); b.setAttribute('aria-selected',on); b.tabIndex=on?0:-1; });
    if(!sansAdresse){ try{ history.replaceState(null,'','#'+(cible&&cible.id||id)); }catch(e){} }
    window.dispatchEvent(new Event('resize')); if(window.Graphe&&Graphe.toutRedessiner) setTimeout(()=>Graphe.toutRedessiner(),30);
  }
  function aller(cible,defiler){ if(!cible) return false; const s=sections.find(x=>x===cible||x.contains(cible)); if(!s) return false;
    activer(s.id,cible===s?null:cible); deplier(cible);
    if(defiler) requestAnimationFrame(()=>{ (cible===s?page:cible).scrollIntoView({block:'start'}); });
    return true; }
  nav.addEventListener('click',e=>{ const b=e.target.closest('[role=tab]'); if(!b) return; activer(b.getAttribute('aria-controls')); });
  nav.addEventListener('keydown',e=>{ const tabs=[...nav.querySelectorAll('[role=tab]')], i=tabs.indexOf(document.activeElement); if(i<0) return;
    let j=null; if(e.key==='ArrowRight') j=(i+1)%tabs.length; else if(e.key==='ArrowLeft') j=(i-1+tabs.length)%tabs.length; else if(e.key==='Home') j=0; else if(e.key==='End') j=tabs.length-1;
    if(j==null) return; e.preventDefault(); tabs[j].focus(); activer(tabs[j].getAttribute('aria-controls')); });
  main.addEventListener('click',e=>{ const b=e.target.closest('[data-aller]'); if(!b) return; aller(document.getElementById(b.dataset.aller),true); const t=document.getElementById('onglet-'+b.dataset.aller); if(t) t.focus({preventScroll:true}); });
  document.addEventListener('click',e=>{ const a=e.target.closest('a[href^="#"]'); if(!a) return; const c=document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); if(c&&aller(c,true)) e.preventDefault(); });
  addEventListener('hashchange',()=>aller(document.getElementById(location.hash.slice(1)),true));
  const depart=location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if(!aller(depart,!!depart)) activer(ids[0],null,true);
  suiteChapitres(page,info);
  main._aller=aller;
}

/* ---------- la barre de parcours : six étapes, cochées au fil du travail ----------
   comprendre → cours · explorer → labos · calculer → exercice guidé · comparer → méthode
   s'entraîner → jeu · contrôle blanc → sujet en conditions réelles                */
function barreParcours(main,info){
  const ch=info.courant.id, P=window.Pupitre;
  const b=document.createElement('nav'); b.className='parcours'; b.setAttribute('aria-label','Barre de parcours');
  function cible(nom){
    const sec=id=>main.querySelector('#'+id);
    if(nom==='comprendre') return sec('cours');
    if(nom==='explorer') return sec('explorer')||sec('cours');
    if(nom==='calculer') return main.querySelector('.tuteur')||sec('exercices');
    if(nom==='comparer') return main.querySelector('.deroule')||sec('methodes')||sec('cours');
    if(nom==='entrainer') return main.querySelector('.jeu')||sec('entrainement');
    if(nom==='controle') return main.querySelector('.controle-blanc')||sec('entrainement')||sec('exercices');
    return null; }
  function peindre(){ const p=P.parcours(ch), faits=P.ETAPES.filter(e=>p[e[0]]).length, pct=Math.round(100*faits/P.ETAPES.length);
    const cinq=P.ETAPES.slice(0,5).filter(e=>p[e[0]]).length;
    b.innerHTML='<div class="pct"><b>'+pct+' %</b><small>du parcours</small></div><ol>'+P.ETAPES.map((e,i)=>'<li class="'+(p[e[0]]?'fait':'')+(e[0]==='controle'&&!p.controle&&cinq>=4?' conseille':'')+'"><button type="button" data-etape="'+e[0]+'" title="'+echap(e[3])+'"><span class="coche" aria-hidden="true">'+(p[e[0]]?'✓':(i+1))+'</span><span>'+echap(e[1])+'</span></button></li>').join('')+'</ol>'; }
  b.addEventListener('click',e=>{ const bt=e.target.closest('[data-etape]'); if(!bt) return; const c=cible(bt.dataset.etape); if(c&&main._aller) main._aller(c,true); });
  P.on('etape',d=>{ if(d.chapitre===ch) peindre(); });
  peindre();
  // comprendre : le bas du cours a été atteint
  const cours=main.querySelector('#cours'); if(cours&&'IntersectionObserver' in window){ const fin=cours.querySelector('.suite-partie')||cours.lastElementChild; const io=new IntersectionObserver(es=>{ if(es.some(x=>x.isIntersecting)){ P.etape(ch,'comprendre'); io.disconnect(); } }); setTimeout(()=>io.observe(fin),500); }
  // explorer : un labo manipulé ; tous les labos → succès
  const labos=[...main.querySelectorAll('.labo')]; const touches=new Set();
  labos.forEach((l,i)=>['input','click','pointerdown'].forEach(ev=>l.addEventListener(ev,()=>{ P.etape(ch,'explorer'); touches.add(i); if(touches.size===labos.length&&labos.length>1) P.succes.debloquer('tous-les-labos'); },{passive:true})));
  // un défi de labo réussi (Labo.reussi) : un jour de travail, et la première fois dans une
  // matière, son instrument sur l'appui de la fenêtre. Une fois par labo et par visite.
  labos.forEach(l=>l.addEventListener('labo-reussi',()=>{ if(l._reussi||!P.laboReussi) return; l._reussi=true; P.laboReussi(ch); }));
  // comparer : une méthode déroulée jusqu'au bout
  main.addEventListener('click',e=>{ const d=e.target.closest('.deroule'); if(!d) return; setTimeout(()=>{ const lis=[...d.querySelectorAll('ol.pas > li')]; if(lis.length&&lis.every(li=>!li.classList.contains('cache'))) P.etape(ch,'comparer'); },50); });
  // calculer (chapitre sans exercice guidé) : deux corrections ouvertes
  if(!main.querySelector('.tuteur')){ let n=0; main.addEventListener('toggle',e=>{ if(e.target.matches&&e.target.matches('details.correction')&&e.target.open){ n++; if(n>=2) P.etape(ch,'calculer'); } },true); }
  return b;
}

/* ---------- le contrôle blanc : le jeu du chapitre en conditions réelles ----------
   12 questions, 15 minutes, aucune correction avant la fin, musique coupée. */
function controleBlanc(body){
  if(window.AUTONOME||!window.Pupitre) return;
  const jeu=body.querySelector('.jeu[data-generateurs]'); if(!jeu||body.querySelector('.controle-blanc')) return;
  const c=document.createElement('div'); c.className='controle-blanc carte'; c.id='controle-blanc';
  c.innerHTML='<span class="surtitre">Contrôle blanc</span><h3>Comme le jour J : 12 questions, 15 minutes, sans indice</h3><p>Aucune correction avant la fin, la musique se coupe, le chrono tourne. Conseillé quand la barre de parcours dépasse 80 %, mais c\'est toi qui décides.</p><div><button class="btn" type="button">Commencer le contrôle blanc</button></div>';
  jeu.after(c);
  c.querySelector('button').addEventListener('click',()=>{
    const j=document.createElement('div'); j.className='jeu'; j.dataset.generateurs=jeu.dataset.generateurs; j.dataset.questions='12'; j.dataset.mode='controle'; j.dataset.minutes='15'; j.dataset.titre='Contrôle blanc · '+(document.querySelector('h1')?document.querySelector('h1').textContent:'');
    c.innerHTML=''; c.appendChild(j); Quiz.init(c); j.scrollIntoView({block:'start',behavior:'smooth'}); });
}

/* ---------- « Je n'ai pas compris » : un bouton anonyme sous chaque notion du cours ---------- */
function pasCompris(main,info){
  if(!window.Pupitre||window.AUTONOME||!info||!info.courant) return;
  const P=window.Pupitre, ch=info.courant.id;
  main.querySelectorAll('#cours > h3[id]').forEach(h=>{
    const id=ch+'/'+h.id; const b=document.createElement('button'); b.type='button'; b.className='pas-compris';
    const fait=P.estNonCompris(id); b.setAttribute('aria-pressed',fait); b.innerHTML=fait?'✓ Signalé, merci. Ton professeur verra seulement un nombre.':'<span aria-hidden="true">🙋</span> Je n\'ai pas compris';
    b.title='Anonyme : ton professeur voit seulement combien d\'élèves bloquent ici, jamais qui.';
    b.addEventListener('click',()=>{ if(P.estNonCompris(id)) return; P.nonCompris(id); b.setAttribute('aria-pressed','true'); b.textContent='✓ Signalé, merci. Ton professeur verra seulement un nombre.'; });
    // sous le dernier bloc de la notion : juste avant le h3 suivant
    let fin=h; while(fin.nextElementSibling&&!fin.nextElementSibling.matches('h3,.suite-partie')) fin=fin.nextElementSibling;
    fin.after(b); });
}

/* ---------- « Signaler une erreur » : en bas de chaque partie d'un chapitre ----------
   Type + une phrase ; le signalement part (ici : reste dans le navigateur) chez le
   professeur contributeur de la matière, ou chez le technicien support s'il est technique. */
function signalements(main,info){
  if(!window.Pupitre||window.AUTONOME||!info||!info.courant) return;
  const P=window.Pupitre, ch=info.courant.id;
  const TYPES=[['calcul','Erreur de calcul'],['faute','Faute de frappe ou d\'orthographe'],['lien','Lien mort ou affichage cassé'],['confus','Explication confuse'],['inapproprie','Contenu inapproprié']];
  main.querySelectorAll(':scope > section').forEach(s=>{ if(s.querySelector('.signaler')) return;
    const z=document.createElement('div'); z.className='signaler';
    z.innerHTML='<button type="button" class="ouvrir-signal"><span aria-hidden="true">⚑</span> Signaler une erreur dans cette partie</button>'+
      '<form class="form-signal" hidden><label>Quel type d\'erreur ?<select name="type">'+TYPES.map(t=>'<option value="'+t[0]+'">'+t[1]+'</option>').join('')+'</select></label><label>Où, et quoi ? <span class="discret">(une phrase suffit)</span><input type="text" name="texte" maxlength="200" placeholder="Par exemple : exercice 3, le résultat devrait être 12"></label><div class="ligne"><button class="btn" type="submit">Envoyer</button><button class="btn fantome" type="button" data-annuler>Annuler</button></div><p class="discret">Anonyme. Une erreur de contenu part chez le professeur contributeur de la matière, un problème technique chez le technicien support. Tu seras prévenu quand c\'est corrigé.</p></form>';
    const sp=s.querySelector(':scope > .suite-partie'); if(sp) sp.before(z); else s.appendChild(z);
    const b=z.querySelector('.ouvrir-signal'), f=z.querySelector('form');
    b.addEventListener('click',()=>{ f.hidden=false; b.hidden=true; f.querySelector('select').focus(); });
    z.querySelector('[data-annuler]').addEventListener('click',()=>{ f.hidden=true; b.hidden=false; });
    f.addEventListener('submit',e=>{ e.preventDefault(); const type=f.type.value, texte=f.texte.value.trim();
      const l=P.lire('signalements',[]); l.push({chapitre:ch,partie:s.id,type,texte,date:Date.now()}); P.ecrire('signalements',l);
      f.hidden=true; b.hidden=false; f.reset();
      const dest= type==='lien'?'le technicien support':'le professeur contributeur de '+echap(info.matiere.nom.toLowerCase()==='svt'||info.matiere.nom.toLowerCase()==='snt'?info.matiere.nom:info.matiere.nom.toLowerCase());
      if(window.Bureau) Bureau.toast('<span aria-hidden="true">⚑</span><strong>Merci, c\'est noté.</strong><span>Signalement transmis '+(dest.startsWith('le ')?'au '+dest.slice(3):'à '+dest)+'. Tu seras prévenu quand c\'est corrigé.</span>',7000); });
  });
}

/* ---------- méthode déroulée : <div class="deroule"> … <ol class="pas"> ----------
   Les étapes se dévoilent une par une : l'élève cherche d'abord seul.            */
function deroules(r){
  r.querySelectorAll('.deroule').forEach(d=>{ if(d._pret) return; d._pret=true;
    const ol=d.querySelector('ol.pas'); if(!ol) return; const lis=[...ol.children]; const n=lis.length; let k=0;
    ol.setAttribute('aria-live','polite');
    const c=document.createElement('div'); c.className='commandes';
    c.innerHTML='<span class="discret">Cherche d\'abord seul, puis dévoile la solution étape par étape.</span><button type="button" class="avancer"></button><button type="button" class="tout">Tout afficher</button>';
    ol.after(c);
    const av=c.querySelector('.avancer'), tout=c.querySelector('.tout');
    function maj(){ lis.forEach((li,i)=>li.classList.toggle('cache',i>=k));
      av.textContent= k===0 ? 'Voir l\'étape 1' : k<n ? 'Étape suivante ('+(k+1)+' / '+n+')' : 'Cacher et recommencer';
      tout.hidden= k>=n; }
    av.addEventListener('click',()=>{ if(k>=n){ k=0; } else { k++; const li=lis[k-1]; li.classList.add('nouveau'); setTimeout(()=>li.classList.remove('nouveau'),400); } maj(); });
    tout.addEventListener('click',()=>{ k=n; maj(); });
    maj();
  });
}

/* ---------- blocs de cours ---------- */
const ETIQ={definition:'Définition',propriete:'Propriété',methode:'Méthode',piege:'Attention, piège',exemple:'Exemple',remarque:'Remarque',theoreme:'Théorème'};
function blocs(r){
  r.querySelectorAll('.bloc').forEach(b=>{ if(b.dataset.etiquette) return;
    const t=Object.keys(ETIQ).find(k=>b.classList.contains(k)); let e=t?ETIQ[t]:'';
    if(b.dataset.titre) e+=(e?' · ':'')+b.dataset.titre; b.setAttribute('data-etiquette',e); });
  pliables(r);
}

/* ---------- blocs « Méthode » repliés ----------
   À la première lecture, une méthode ne montre que son titre : l'élève la déplie quand il en a
   besoin (un exercice, une étape du parcours). Le réglage « méthodes toujours dépliées » de la
   page Personnalisation (clé mp:methodes) les ouvre d'office. Un bloc portant data-ouvert reste
   ouvert quoi qu'il arrive.                                                                       */
function methodesDepliees(){ try{ return window.Pupitre ? Pupitre.lire('methodes','pliees')==='depliees' : localStorage.getItem('mp:methodes')==='"depliees"'; }catch(e){ return false; } }
function pliables(r){
  const ouvertes=methodesDepliees();
  r.querySelectorAll('.bloc.methode').forEach(b=>{ if(b._pliable||b.hasAttribute('data-ouvert')) return; b._pliable=true;
    b.classList.add('pliable'); const bt=document.createElement('button'); bt.type='button'; bt.className='bloc-plier';
    const etat=ouvert=>{ b.classList.toggle('plie',!ouvert); bt.setAttribute('aria-expanded',ouvert); bt.innerHTML=ouvert?'Replier <span aria-hidden="true">▴</span>':'Voir la méthode <span aria-hidden="true">▾</span>'; };
    bt.addEventListener('click',e=>{ e.stopPropagation(); etat(b.classList.contains('plie')); if(window.Graphe&&Graphe.toutRedessiner) setTimeout(()=>Graphe.toutRedessiner(),30); });
    b.addEventListener('click',e=>{ if(b.classList.contains('plie')&&!e.target.closest('a')){ etat(true); if(window.Graphe&&Graphe.toutRedessiner) setTimeout(()=>Graphe.toutRedessiner(),30); } });
    b.prepend(bt); etat(ouvertes); });
}
/* déplie les méthodes qui contiennent el (avant de défiler jusqu'à lui) */
function deplier(el){ if(!el) return; for(let b=el.closest('.bloc.plie');b;b=b.parentElement&&b.parentElement.closest('.bloc.plie')){ const bt=b.querySelector(':scope > .bloc-plier'); if(bt) bt.click(); else b.classList.remove('plie'); } }

/* ---------- exercices : numéros, étoiles, filtres ---------- */
/* une fiche d'exercice telle que l'élève la voit : numéro, étoiles, titre, et les volets
   « coup de pouce » et « correction » avec leur intitulé. Une seule façon de présenter un
   exercice : les chapitres l'appellent ici, la banque et les devoirs (fiches.js) aussi,
   par Site.preparerExercice. */
function preparerExercice(ex,numero){ if(ex.querySelector(':scope > header')) return;
  /* chaque exercice est une fiche de la banque : son id est écrit dans la page
     (id="ex-…", format dans CLAUDE.md) et ne change jamais, même si le titre change.
     C'est ce qu'un lien du carnet ou un devoir retient. Le repli sur le titre ne sert
     qu'à une page qui n'aurait pas encore ses identifiants. */
  if(!ex.id) ex.id='ex-'+(ex.dataset.titre||'exercice-'+numero).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const niv=parseInt(ex.dataset.niveau||'0',10);
  const h=document.createElement('header');
  h.innerHTML='<span class="num-ex">Exercice '+numero+'</span>'+(niv?'<span class="etoiles" title="Difficulté '+niv+' sur 3" aria-label="Difficulté '+niv+' sur 3">'+'★'.repeat(niv)+'<span class="etoiles-vides">'+'★'.repeat(Math.max(0,3-niv))+'</span></span>':'')+(ex.dataset.titre?'<span class="titre-ex">'+echap(ex.dataset.titre)+'</span>':'');
  ex.prepend(h);
  let coup=0;
  ex.querySelectorAll(':scope > details.correction, :scope > details.indice').forEach(d=>{ if(!d.querySelector('summary')){ const s=document.createElement('summary'); s.textContent=d.classList.contains('indice')?'Un coup de pouce'+(ex.querySelectorAll(':scope > details.indice').length>1?' ('+(++coup)+')':''):'Voir la correction'; d.prepend(s); }
    if(!d.querySelector(':scope > .contenu')){ const c=document.createElement('div'); c.className='contenu'; [...d.childNodes].forEach(n=>{ if(n.nodeName!=='SUMMARY') c.appendChild(n); }); d.appendChild(c); } });
}
function exercices(r){
  const tous=[...r.querySelectorAll('article.exercice')];
  tous.forEach((ex,i)=>preparerExercice(ex,i+1));
  // une barre d'outils par section qui contient des exercices
  const sections=new Set(tous.map(ex=>ex.closest('section')).filter(Boolean));
  sections.forEach(sec=>{ if(sec.querySelector('.outils-ex')) return;
    const exs=[...sec.querySelectorAll('article.exercice')]; const niveaux=[...new Set(exs.map(e=>e.dataset.niveau).filter(Boolean))].sort();
    const bar=document.createElement('div'); bar.className='outils-ex';
    bar.innerHTML=(niveaux.length>1?'<span class="discret">Difficulté :</span><button class="filtre" type="button" data-n="" aria-pressed="true">Tous</button>'+niveaux.map(n=>'<button class="filtre" type="button" data-n="'+n+'" aria-pressed="false">'+'★'.repeat(+n)+'</button>').join(''):'')+
      '<button class="filtre" type="button" data-tout aria-pressed="false">Ouvrir toutes les corrections</button>';
    const premier=exs[0]; const h2=sec.querySelector(':scope > h2'); const ancre=sec.querySelector('#ex-corriges'); (ancre||(h2&&h2.nextElementSibling&&!h2.nextElementSibling.matches('article.exercice')?h2.nextElementSibling:h2||premier)).after(bar);
    bar.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return;
      if(b.hasAttribute('data-tout')){ const ouvrir=b.getAttribute('aria-pressed')!=='true'; b.setAttribute('aria-pressed',ouvrir); b.textContent=ouvrir?'Fermer toutes les corrections':'Ouvrir toutes les corrections'; exs.forEach(x=>x.querySelectorAll('details.correction').forEach(d=>d.open=ouvrir)); return; }
      bar.querySelectorAll('button[data-n]').forEach(x=>x.setAttribute('aria-pressed',x===b)); exs.forEach(x=>x.hidden= b.dataset.n && x.dataset.niveau!==b.dataset.n); });
  });
}

/* ---------- vidéos ---------- */
function videos(r){
  r.querySelectorAll('.video').forEach(v=>{ if(v._pret) return; v._pret=true;
    const titre=v.dataset.titre||''; const yt=(v.dataset.youtube||'').trim(); const src=(v.dataset.src||'').trim();
    const legende=v.innerHTML.trim();
    let ecran;
    if(yt){ const id=yt.replace(/^.*(?:v=|youtu\.be\/|embed\/)/,'').replace(/[?&].*$/,'');
      ecran='<div class="ecran"><button class="lancer" type="button" aria-label="Lire la vidéo '+echap(titre)+'" style="--vignette:url(https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg)"><span>▶</span></button></div>';
      v.innerHTML=ecran;
      v.querySelector('.lancer').addEventListener('click',()=>{ v.querySelector('.ecran').innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0" title="'+echap(titre)+'" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'; });
    } else if(src){ v.innerHTML='<div class="ecran"><video controls preload="metadata" src="'+echap(src)+'"></video></div>'; }
    else { v.classList.add('a-venir'); v.innerHTML='<div class="ecran">vidéo à venir</div>'; }
    if(titre) v.insertAdjacentHTML('beforeend','<span class="titre-video">'+echap(titre)+'</span>');
    if(legende) v.insertAdjacentHTML('beforeend','<div class="discret">'+legende+'</div>');
  });
}

/* ---------- blocs de code (mode d'emploi) ---------- */
function codes(r){
  // .demo : affiche le rendu ET le code HTML à copier (code capturé avant toute transformation)
  r.querySelectorAll('.demo').forEach(d=>{ if(d._pret) return; d._pret=true;
    const src=d.innerHTML.replace(/^\n+|\s+$/g,''); const lignes=src.split('\n'); const ind=Math.min(...lignes.filter(l=>l.trim()).map(l=>l.match(/^\s*/)[0].length));
    const propre=lignes.map(l=>l.slice(ind)).join('\n');
    d.innerHTML='<div class="demo-rendu">'+src+'</div><div class="code-bloc"><button class="copier" type="button">Copier</button><pre class="code"></pre></div>';
    d.querySelector('pre').textContent=propre; });
  r.querySelectorAll('pre.code').forEach(pre=>{ if(pre.parentElement.classList.contains('code-bloc')) return;
    const w=document.createElement('div'); w.className='code-bloc'; pre.before(w); w.appendChild(pre); w.insertAdjacentHTML('afterbegin','<button class="copier" type="button">Copier</button>'); });
  r.addEventListener('click',e=>{ const b=e.target.closest('.copier'); if(!b) return; const pre=b.parentElement.querySelector('pre');
    const ok=()=>{b.textContent='Copié';setTimeout(()=>b.textContent='Copier',1500);};
    const repli=()=>{ const s=getSelection(), rg=document.createRange(); rg.selectNodeContents(pre); s.removeAllRanges(); s.addRange(rg); b.textContent='Sélectionné : Ctrl+C'; };
    try{ navigator.clipboard.writeText(pre.textContent).then(ok,repli); }catch(err){ repli(); } });
}

/* ---------- accueil : la grille des matières ---------- */
function compte(m){ let t=0,p=0; (m.niveaux||[]).forEach(n=>n.chapitres.forEach(c=>{t++; if(c.fichier) p++;})); return {t,p}; }
function accueil(cont){
  const ouvertes=matieres().filter(m=>m.ouverte), bientot=matieres().filter(m=>!m.ouverte);
  cont.innerHTML='<div class="grille-matieres">'+ouvertes.map(m=>{ const k=compte(m);
    return '<a class="carte-matiere" data-couleur="'+echap(m.couleur||'neutre')+'" href="'+lienMatiere(m)+'"><span class="pastille" aria-hidden="true"></span><span class="nom-matiere">'+echap(m.nom)+'</span>'+(m.nomLong?'<span class="discret">'+echap(m.nomLong)+'</span>':'')+(m.accroche?'<span class="accroche">'+echap(m.accroche)+'</span>':'')+'<span class="compteur">'+k.p+' chapitre'+(k.p>1?'s':'')+' en ligne sur '+k.t+'</span></a>'; }).join('')+'</div>'+
    (bientot.length?'<h2 class="titre-bientot">Bientôt</h2><div class="grille-bientot">'+bientot.map(m=>'<span class="carte-bientot" data-couleur="'+echap(m.couleur||'neutre')+'"><span class="pastille" aria-hidden="true"></span>'+echap(m.nom)+'</span>').join('')+'</div>':'');
}
/* ---------- page d'une matière : matiere.html?m=svt ---------- */
function pageMatiere(cont){
  let id=''; try{ id=new URLSearchParams(location.search).get('m')||''; }catch(e){}
  if(!id){ const h=location.hash.slice(1); if(h&&h.includes('.')){ id=h.split('.')[0]; try{ history.replaceState(null,'','#'+h.split('.')[1]); }catch(e){} } }
  if(!id){ try{ id=(window.Pupitre?Pupitre.lire('matiere-ouverte',null):JSON.parse(localStorage.getItem('mp:matiere-ouverte')))||'maths'; }catch(e){ id='maths'; } }
  const m=trouverMatiere(id);
  if(!m||!m.ouverte){ cont.innerHTML='<div class="accueil-tete gutter"><div class="in"><h1>Matière introuvable</h1><p>Cette matière n\'existe pas encore sur le site. <a href="'+RACINE+'index.html">Retour à l\'accueil</a></p></div></div>'; return null; }
  document.title=m.nom+' · '+((window.SITE||{}).nom||'');
  document.body.dataset.matiere=m.id;
  if(document.body.dataset.page==='matiere') return {matiere:m};   // portes.js dessine la page
  cont.innerHTML='<section class="accueil-tete gutter"><div class="in"><span class="surtitre">'+echap(m.nomLong||'Matière')+'</span><h1>'+echap(m.nom)+'</h1>'+(m.accroche?'<p>'+echap(m.accroche)+'</p>':'')+'</div></section>'+
    '<div class="niveaux gutter">'+(m.niveaux||[]).map(n=>{ const p=n.chapitres.filter(c=>c.fichier).length;
      return '<div class="niveau-col"><h2>'+echap(n.nom)+' <span class="compteur-niveau">'+p+' / '+n.chapitres.length+' en ligne</span></h2>'+
        n.chapitres.map((c,i)=> c.fichier
          ? '<a class="chap-lien" href="'+RACINE+c.fichier+'"><span class="n">'+(i+1)+'</span><span>'+echap(c.titre)+'</span><span class="etat">ouvrir →</span></a>'
          : '<span class="chap-lien a-venir"><span class="n">'+(i+1)+'</span><span>'+echap(c.titre)+'</span><span class="etat">à venir</span></span>').join('')+'</div>'; }).join('')+'</div>';
  return {matiere:m};
}

/* ---------- démarrage ---------- */
async function demarrer(){
  const body=document.body;
  codes(body);                                   // en premier : capture le code des démos
  try{ await charger(RACINE+'assets/js/chapitres.js'); }catch(e){ console.warn(e); }
  if(!window.AUTONOME){ try{ await charger(RACINE+'assets/js/bureau.js'); }catch(e){ console.warn(e); } }
  const id=body.dataset.chapitre; let info=id?trouverChapitre(body.dataset.matiere,id):null;
  const pm=document.querySelector('#page-matiere'); if(pm) info=pageMatiere(pm);
  if(info&&info.courant) body.dataset.niveau=info.courant.niveauId||'';
  if(info&&info.matiere) body.dataset.couleur=info.matiere.couleur||'neutre';
  else if(body.dataset.matiere){ const m=trouverMatiere(body.dataset.matiere); if(m) body.dataset.couleur=m.couleur||'neutre'; }
  window.Site={deplier,preparerExercice,racine:RACINE,versionnee,chapitre:(body.dataset.matiere?body.dataset.matiere+'/':'')+(id||''),chapitreId:id||'',info,maths,blocs,echap,charger,trouverMatiere,trouverChapitre,matieres,lienMatiere};   // blocs : étiquettes des blocs ajoutés par un labo
  if(window.Bureau&&!window.AUTONOME) Bureau.coque(info,{racine:RACINE}); else barre(info);
  /* les exercices reçoivent leur id AVANT que les onglets lisent le #hash : sinon un lien
     du carnet vers un exercice (chapitre.html#ex-…) ne trouve rien et retombe sur le cours */
  blocs(body); exercices(body);
  const main=document.querySelector('main.chapitre'); if(main){ if(body.dataset.miseEnPage==='classeur') classeur(main,info); else gabarit(main,info); if(info&&info.courant){ pasCompris(main,info); signalements(main,info); } }
  const acc=document.querySelector('#liste-matieres'); if(acc) accueil(acc);
  if(info&&info.courant&&window.Pupitre&&!window.AUTONOME) Pupitre.memoriserPage(info.courant.titre,info.matiere.nom+' · '+info.courant.niveau);
  videos(body); deroules(body);
  // formules
  feuille(KATEX+'katex.min.css');
  charger(KATEX+'katex.min.js').then(()=>charger(KATEX+'auto-render.min.js')).then(()=>{ katexPret=true; maths(body); enAttente.splice(0).forEach(maths); }).catch(e=>console.warn('Formules indisponibles (hors ligne ?)',e));
  // composants interactifs
  const besoinGraphe=body.querySelector('figure.graphe,.jeu,.quiz,[data-labo]'), besoinQuiz=body.querySelector('.quiz,.jeu');
  try{
    if(besoinGraphe) await charger(RACINE+'assets/js/graphe.js');
    if(besoinGraphe) Graphe.init(body);
    // laboratoires : <div class="labo" data-labo="limites" data-outil="microscope"> charge assets/js/labos/limites.js
    const labos=new Set([...body.querySelectorAll('[data-labo]')].map(l=>l.dataset.labo));
    if(labos.size){ try{ await charger(RACINE+'assets/js/labos/commun.js'); }catch(e){ console.warn(e); } }   // outils partagés par tous les labos
    for(const nom of labos){
      try{ await charger(RACINE+'assets/js/labos/'+nom+'.js'); }catch(e){ console.warn(e); }
      body.querySelectorAll('[data-labo="'+nom+'"]').forEach(el=>{
        const L=(window.LABOS||{})[nom], outil=L&&L[el.dataset.outil];
        if(!outil){ el.innerHTML='<p class="retour mauvais">Laboratoire « '+echap(nom)+' / '+echap(el.dataset.outil||'?')+' » introuvable.</p>'; return; }
        try{ outil(el); maths(el); }catch(e){ console.error(e); el.innerHTML='<p class="retour mauvais">Ce laboratoire n\'a pas pu démarrer.</p>'; }
      });
    }
    if(besoinQuiz){
      await charger(RACINE+'assets/js/quiz.js');
      const gens=new Set(); body.querySelectorAll('.jeu').forEach(j=>(j.dataset.generateurs||'').split(/\s+/).filter(Boolean).forEach(g=>gens.add(g)));
      for(const g of gens){ try{ await charger(RACINE+'assets/js/generateurs/'+g+'.js'); }catch(e){ console.warn(e); } }
      Quiz.init(body);
      controleBlanc(body);
    }
    // le tuteur pas à pas : <div class="tuteur" data-tuteur="expression" data-depart="3x+5-x+2">
    if(body.querySelector('.tuteur')){ await charger(RACINE+'assets/js/tuteur.js'); Tuteur.init(body); }
    // pages du bureau (accueil, portes d'entrée, espaces parent et professeur, réglages)
    const pageBureau=body.dataset.page; if(pageBureau&&!window.AUTONOME){
      // le carnet des professeurs est lu par le bureau, la page carnet, « Mon compte », et les espaces parent et professeur
      try{ await charger(RACINE+'assets/js/carnet.js'); await charger(RACINE+'assets/js/devoirs.js'); }catch(e){ console.warn(e); }
      // les comptes du prototype : la page de connexion, et la carte du compte dans « Mon compte »
      if(pageBureau==='connexion'||pageBureau==='compte'){ try{ await charger(RACINE+'assets/js/comptes.js'); }catch(e){ console.warn(e); } }
      // la banque d'exercices : l'outil du professeur, le devoir de l'élève, la planche à imprimer
      const BANQUE={banque:['banque','fiches','banque-outil'],devoir:['banque','fiches'],planche:['banque','fiches']}[pageBureau];
      if(BANQUE){ for(const s of BANQUE) await charger(RACINE+'assets/js/'+s+'.js'); }
      else if(pageBureau!=='connexion') await charger(RACINE+'assets/js/'+(pageBureau==='parent'||pageBureau==='prof'?'espaces':'portes')+'.js');
      if(window.Pages&&Pages[pageBureau]) await Pages[pageBureau](body); }
  }catch(e){ console.error(e); }
  if(location.hash&&body.dataset.miseEnPage!=='classeur'){ const t=document.getElementById(location.hash.slice(1)); if(t) setTimeout(()=>t.scrollIntoView(),50); }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',demarrer); else demarrer();
})();
