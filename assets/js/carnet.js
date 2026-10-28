/* =====================================================================
   LE CARNET DES PROFESSEURS

   L'élève n'a pas de professeur par défaut : il travaille seul, lié ou non
   à un compte parent. Un professeur — en classe ou particulier — lui donne
   un lien ; en le suivant, l'élève rejoint la « classe » de ce professeur.
   Tout ce que ses professeurs lui envoient arrive ici, dans UNE rubrique
   par professeur. L'élève ne voit rien du groupe : ni les autres élèves,
   ni leur travail. Seulement ce qui vient du professeur.

   Ce qu'un professeur peut envoyer (et rien d'autre) :
     exercice   un exercice précis d'un chapitre, à conseiller
     cours      un point précis du cours (une section), à revoir
     echeance   un contrôle, un rendu, un oral… avec une date
     devoir     une séance ou un devoir maison composé dans la banque
                d'exercices (devoirs.js) : sa liste de fiches, ses réglages,
                son échéance ; il s'ouvre sur devoir.html
     message    un message PRÉFAIT, choisi dans le catalogue ci-dessous
   Il n'y a de texte libre nulle part : c'est voulu. Pas de messagerie,
   pas de mot déplacé possible, et le parent voit tout le carnet en lecture.

   Ce fichier est le seul endroit où ces règles vivent. Il est chargé sur
   toutes les pages du bureau (site.js) et utilisé par :
     portes.js    la carte du bureau, la page carnet.html, « Mon compte »
     espaces.js   ce que le professeur publie, ce que le parent lit
   Le prototype n'a pas de serveur : un professeur « publie » dans le
   navigateur, et l'élève du même navigateur le lit. Le lien de classe
   porte donc le nom du professeur, sa matière et sa classe.
   ===================================================================== */
(function(){
"use strict";
const P=()=>window.Pupitre;
const echap=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- le catalogue ---------- */
/* Les messages préfaits. Un professeur en choisit un, il ne l'écrit pas.
   Ils tutoient l'élève, encouragent sans juger, et ne parlent jamais de note.
   À relire par le professeur : c'est du contenu, pas du code. */
const MESSAGES=[
  ['bravo',      'Bon travail cette semaine, continue comme ça.'],
  ['progres',    'Tu progresses, ça se voit. Garde le rythme.'],
  ['revoir',     'Pense à revoir le cours avant le prochain contrôle.'],
  ['niveau1',    'Refais les exercices de niveau 1 avant de passer au niveau 2.'],
  ['methode',    'Relis la méthode, puis refais l\'exercice sans regarder la correction.'],
  ['sans-indice','Essaie d\'abord sans indice : tu sais plus de choses que tu ne crois.'],
  ['correction', 'Prends le temps de lire la correction en entier, pas seulement le résultat.'],
  ['controle-blanc','Fais le contrôle blanc du chapitre en conditions réelles.'],
  ['labo',       'Passe par les labos du chapitre : manipuler aide à comprendre.'],
  ['voir',       'Viens me voir si tu bloques, c\'est fait pour ça.'],
  ['pause',      'N\'oublie pas les pauses : 25 minutes de travail, 5 de repos.'],
  ['regulier',   'Dix minutes chaque jour valent mieux qu\'une heure la veille.'],
];
const NATURES=[['controle','Contrôle'],['devoir','Devoir à rendre'],['oral','Évaluation orale'],['blanc','Épreuve blanche'],['tp','TP noté'],['rattrapage','Rattrapage']];
const TYPES={exercice:'Exercice conseillé',cours:'Point de cours',echeance:'Échéance',devoir:'Devoir',message:'Message'};
const ICONES={exercice:'✎',cours:'📖',echeance:'📅',devoir:'📝',message:'💬'};
const D=()=>window.Devoirs;

/* ---------- le catalogue des chapitres (pour nommer et relier) ---------- */
function matieres(){ return window.MATIERES||[]; }
function chapitre(id){
  for(const m of matieres()) for(const n of (m.niveaux||[])) for(const c of n.chapitres) if(c.id===id) return Object.assign({matiere:m,niveau:n},c);
  return null;
}
function matiere(id){ return matieres().find(m=>m.id===id)||null; }
function lienChapitre(id,ancre){ const c=chapitre(id); if(!c||!c.fichier) return null; const R=(window.Site&&window.Site.racine)||''; return R+c.fichier+(ancre?'#'+ancre:''); }

/* ---------- le stockage ---------- */
const lire=(k,d)=>P()?P().lire(k,d):d, ecrire=(k,v)=>{ if(P()) P().ecrire(k,v); };
const CLASSES='classes-rejointes', FAIT='carnet-fait';
const cleCarnet=code=>'carnet:'+String(code||'').toUpperCase();

function profs(){ return lire(CLASSES,[]); }
function rejoindre(c){
  const l=profs().filter(x=>x.code!==c.code);
  l.push({code:c.code,prof:c.prof,matiere:c.matiere,classe:c.classe||'',niveau:c.niveau||'',depuis:aujourdhui()});
  ecrire(CLASSES,l); return l;
}
function quitter(code){ ecrire(CLASSES,profs().filter(x=>x.code!==code)); }
function items(code){ return lire(cleCarnet(code),[]); }
function publier(code,item){ const l=items(code); l.push(Object.assign({id:'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),date:aujourdhui()},item)); ecrire(cleCarnet(code),l); return l; }
function retirer(code,id){ ecrire(cleCarnet(code),items(code).filter(x=>x.id!==id)); }
function faits(){ return new Set(lire(FAIT,[])); }
function setFait(id,oui){ const f=faits(); if(oui) f.add(id); else f.delete(id); ecrire(FAIT,[...f]); }

/* tout ce que l'élève voit : une rubrique par professeur, les échéances d'abord */
function tout(){
  return profs().map(pr=>({prof:pr,items:trier(items(pr.code))}));
}
function trier(l){
  const rang={echeance:0,devoir:0,exercice:1,cours:2,message:3};
  return l.slice().sort((a,b)=>{
    if(rang[a.type]===0&&rang[b.type]===0) return (a.echeance||'').localeCompare(b.echeance||'');
    if(rang[a.type]!==rang[b.type]) return rang[a.type]-rang[b.type];
    return (b.date||'').localeCompare(a.date||'');
  });
}
function echeancesAVenir(){
  const auj=aujourdhui();
  return tout().flatMap(r=>r.items.filter(i=>(i.type==='echeance'||i.type==='devoir')&&(i.echeance||'')>=auj).map(i=>Object.assign({prof:r.prof},i)))
             .sort((a,b)=>a.echeance.localeCompare(b.echeance));
}

/* ---------- dates ---------- */
function aujourdhui(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function dateFr(iso,avecJour){ if(!iso) return ''; const [a,m,j]=iso.split('-').map(Number); const d=new Date(a,m-1,j);
  return d.toLocaleDateString('fr-FR',avecJour?{weekday:'long',day:'numeric',month:'long'}:{day:'numeric',month:'long'}); }
function dansCombien(iso){ const [a,m,j]=iso.split('-').map(Number); const n=Math.round((new Date(a,m-1,j)-new Date(aujourdhui().split('-')[0],aujourdhui().split('-')[1]-1,aujourdhui().split('-')[2]))/864e5);
  return n<0?'passé':n===0?'aujourd\'hui':n===1?'demain':'dans '+n+' jours'; }

/* ---------- le lien de classe ---------- */
/* Pas de serveur : le lien porte lui-même ce que l'élève doit savoir du
   professeur. compte.html le lit et propose de rejoindre. */
function lienRejoindre(c){
  const R=(window.Site&&window.Site.racine)||'';
  const q=new URLSearchParams({rejoindre:c.code,p:c.prof,m:c.matiere,c:c.classe||'',n:c.niveau||''});
  // la racine est une adresse complète (lue sur celle du script) : on la résout, on ne la colle pas
  const base=location.href.split('?')[0].split('#')[0].replace(/[^/]*$/,'');
  return new URL(R+'compte.html?'+q.toString(),base).href;
}
function decoderLien(search){
  const q=new URLSearchParams(search||location.search);
  const code=(q.get('rejoindre')||'').trim().toUpperCase(); if(!code) return null;
  return {code,prof:(q.get('p')||'Un professeur').slice(0,60),matiere:q.get('m')||'',classe:(q.get('c')||'').slice(0,40),niveau:(q.get('n')||'').slice(0,40)};
}

/* ---------- le rendu ---------- */
function libelleCible(it){
  const c=chapitre(it.chapitre);
  if(it.type==='exercice') return (it.exercice&&it.exercice.titre?it.exercice.titre:'Un exercice')+(c?' · '+c.titre:'');
  if(it.type==='cours') return (it.section&&it.section.titre?it.section.titre:'Un point du cours')+(c?' · '+c.titre:'');
  if(it.type==='echeance'){ const n=(NATURES.find(x=>x[0]===it.nature)||['','Échéance'])[1]; const chs=(it.chapitres||[]).map(id=>{ const x=chapitre(id); return x?x.titre:id; }); return n+(chs.length?' · '+chs.join(', '):''); }
  if(it.type==='message'){ const m=MESSAGES.find(x=>x[0]===it.message); return m?m[1]:''; }
  // un devoir : son titre composé (« Devoir maison noté · Suites numériques »), la date à part
  if(it.type==='devoir') return D()&&it.devoir ? D().titre(Object.assign({},it.devoir,{echeance:''})) : 'Un devoir';
  return '';
}
/* l'étiquette d'un envoi : sa sorte (une seule source, aussi pour la carte du bureau) */
function etiquette(it){ return TYPES[it.type]||it.type; }
function lienCible(it){
  if(it.type==='exercice') return lienChapitre(it.chapitre,it.exercice&&it.exercice.id);
  if(it.type==='cours') return lienChapitre(it.chapitre,it.section&&it.section.id);
  if(it.type==='echeance'&&it.chapitres&&it.chapitres.length===1) return lienChapitre(it.chapitres[0],'entrainement');
  if(it.type==='devoir'&&D()&&it.devoir){ const R=(window.Site&&window.Site.racine)||''; return R+D().chemin(it.devoir); }
  return null;
}
function messageJoint(it){ if(it.type==='message'||!it.message) return ''; const m=MESSAGES.find(x=>x[0]===it.message); return m?'<span class="mot">« '+echap(m[1])+' »</span>':''; }

/* un item, dans la rubrique d'un professeur.
   opts.lecture : vrai pour le parent (pas de case « fait »)
   opts.retirer : vrai pour le professeur (bouton pour retirer) */
function rendreItem(it,opts){ opts=opts||{}; const f=faits(); const url=lienCible(it); const fait=f.has(it.id);
  const quand= (it.type==='echeance'||it.type==='devoir')&&it.echeance ? '<b class="quand">'+echap(dateFr(it.echeance,true))+'</b><span class="discret"> · '+echap(dansCombien(it.echeance))+(it.type==='devoir'&&D()?' · '+echap(D().resume(it.devoir)):'')+'</span>' : '<span class="discret">'+echap(dateFr(it.date))+'</span>';
  const titre= url ? '<a href="'+echap(url)+'">'+echap(libelleCible(it))+'</a>' : '<span>'+echap(libelleCible(it))+'</span>';
  return '<li class="carnet-item type-'+echap(it.type)+(fait?' fait':'')+'" data-item="'+echap(it.id)+'">'+
    '<span class="ico" aria-hidden="true">'+ICONES[it.type]+'</span>'+
    '<div class="corps"><span class="etiq">'+echap(etiquette(it))+'</span>'+titre+messageJoint(it)+'<span class="meta">'+quand+'</span></div>'+
    (opts.retirer?'<button type="button" class="btn fantome petit" data-retirer="'+echap(it.id)+'" aria-label="Retirer cet envoi">Retirer</button>':
     opts.lecture||it.type==='message'||it.type==='echeance'?'':'<label class="case-fait"><input type="checkbox" data-fait="'+echap(it.id)+'"'+(fait?' checked':'')+'><span>fait</span></label>')+
    '</li>';
}
/* la rubrique d'un professeur */
function rendreRubrique(r,opts){ opts=opts||{}; const pr=r.prof, m=matiere(pr.matiere);
  const couleur=m?(m.couleur||'neutre'):'neutre';
  const tete='<header class="rubrique-tete" data-couleur="'+echap(couleur)+'"><span class="pastille" aria-hidden="true"></span><div><strong>'+echap(pr.prof)+'</strong><span class="discret">'+echap(m?m.nom:pr.matiere)+(pr.classe?' · '+echap(pr.classe):'')+'</span></div>'+
    (opts.quitter?'<button type="button" class="btn fantome petit" data-quitter="'+echap(pr.code)+'">Quitter cette classe</button>':'')+'</header>';
  const corps= r.items.length ? '<ul class="carnet-liste">'+r.items.map(it=>rendreItem(it,opts)).join('')+'</ul>'
             : '<p class="discret vide">Rien pour l\'instant. '+echap(pr.prof)+' n\'a encore rien envoyé.</p>';
  return '<section class="rubrique-prof" data-code="'+echap(pr.code)+'">'+tete+corps+'</section>';
}
/* ce que fait le carnet quand on coche, quitte, retire : à brancher une fois sur le conteneur */
function brancher(el,opts){ opts=opts||{};
  el.addEventListener('change',e=>{ const c=e.target.closest('[data-fait]'); if(!c) return; setFait(c.dataset.fait,c.checked); const li=c.closest('.carnet-item'); if(li) li.classList.toggle('fait',c.checked); });
  el.addEventListener('click',e=>{
    const q=e.target.closest('[data-quitter]'); if(q){ if(q.dataset.confirme){ quitter(q.dataset.quitter); if(opts.apres) opts.apres(); } else { q.dataset.confirme='1'; q.textContent='Confirmer : quitter'; q.classList.remove('fantome'); } return; }
    const r=e.target.closest('[data-retirer]'); if(r&&opts.code){ retirer(opts.code,r.dataset.retirer); if(opts.apres) opts.apres(); }
  });
}

/* ---------- ce que l'on dit à l'élève du dispositif ---------- */
const EXPLICATION='<ul class="transparence-liste"><li><span class="oui">✓</span> un professeur te propose des exercices, des devoirs, des points de cours, des dates — jamais de note, sauf celle d\'un devoir maison qu\'il a choisi de noter</li><li><span class="oui">✓</span> tu vois exactement ce qu\'il voit de toi, dans « Mon compte »</li><li><span class="oui">✓</span> tu peux quitter sa classe à tout moment</li><li><span class="non">✗</span> tu ne vois rien des autres élèves de la classe, et eux rien de toi</li><li><span class="non">✗</span> pas de messagerie : les messages sont choisis dans une liste, personne ne t\'écrit librement</li></ul>';

window.Carnet={MESSAGES,NATURES,TYPES,ICONES,EXPLICATION,
  chapitre,matiere,lienChapitre,profs,rejoindre,quitter,items,publier,retirer,faits,setFait,tout,trier,echeancesAVenir,
  aujourdhui,dateFr,dansCombien,lienRejoindre,decoderLien,libelleCible,etiquette,lienCible,rendreItem,rendreRubrique,brancher,echap};
})();
