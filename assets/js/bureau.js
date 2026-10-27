/* =====================================================================
   LE BUREAU — la coque commune à toutes les pages, et la mémoire locale.

   1. Pupitre : la mémoire du prototype (localStorage, clés « mp: »).
      Progression de l'élève, réglages, verrou parental, succès…
      Rien ne quitte le navigateur.
   2. La coque : bandeau du haut (nom du site, interrupteur « Tuteur avec
      IA », Personnalisation, aide, « Mon compte »), colonne de gauche
      (les intercalaires du classeur : niveaux → matières → chapitres,
      puis carte des notions, Apprendre à apprendre, Aller plus loin,
      et le lien « J'ai besoin de parler à quelqu'un »), coin bas droit
      (musique, pause), pied de page.
   Chargé par site.js avant tout le reste. Rien à modifier pour ajouter
   un chapitre : tout vient de chapitres.js.
   ===================================================================== */
(function(){
"use strict";
const echap=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ---------- 1. La mémoire locale ----------
   Sans compte (le visiteur, et la démonstration de Léa), les clés sont « mp:<clé> », comme
   depuis le début. Connecté à un compte du prototype, chacun a sa propre mémoire :
   « mp:@<id du compte>:<clé> » — deux élèves sur le même ordinateur ne mélangent rien.
   Quelques clés sont celles de l'appareil, communes à tous : la liste des comptes, la
   session, les tentatives de connexion, et ce qui tient lieu de serveur dans le prototype
   (le carnet publié par un professeur, les mails et les jetons simulés). Voir comptes.js. */
const COMMUNES=/^(comptes|session|tentatives|boite|jetons)$|^carnet:/;
let SESSION;   // l'id du compte connecté (null : personne), lu une fois par page
function brut(k){ try{ const v=localStorage.getItem('mp:'+k); return v===null?null:JSON.parse(v); }catch(e){ return null; } }
function session(){ if(SESSION===undefined){ const s=brut('session'), c=brut('comptes')||{}; SESSION= s&&s.id&&c[s.id] ? s.id : null; } return SESSION; }
const espace=()=>session()?'mp:@'+session()+':':'mp:';
const cleDe=k=>(COMMUNES.test(k)?'mp:':espace())+k;
function lire(k,def){ try{ const v=localStorage.getItem(cleDe(k)); return v===null?def:JSON.parse(v); }catch(e){ return def; } }
function ecrire(k,v){ try{ localStorage.setItem(cleDe(k),JSON.stringify(v)); }catch(e){} }
function supprimer(k){ try{ localStorage.removeItem(cleDe(k)); }catch(e){} }
/* les clés de la mémoire courante, telles que le navigateur les range (export, effacement) :
   celles du compte connecté ; sans compte, celles du visiteur (et les records des jeux, « jeu: »),
   jamais les comptes ni la mémoire des autres */
function clesCourantes(){ const l=[]; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!k) continue;
  if(session()){ if(k.startsWith(espace())) l.push(k); }
  else if(k.startsWith('jeu:')||(k.startsWith('mp:')&&!k.startsWith('mp:@')&&!/^(comptes|session|tentatives|boite|jetons)$/.test(k.slice(3)))) l.push(k); } }catch(e){} return l; }
/* qui est là : le compte connecté, ou les personnages de la démonstration (Léa, ses parents, Mme Roux) */
const compteCourant=()=>{ const id=session(); return id ? (brut('comptes')||{})[id]||null : null; };
const nomClasse=id=>{ const c=(window.CLASSES||[]).find(x=>x.id===id||x.filieres.some(f=>f.id===id||Object.keys(f.niveaux).includes(id))); return c?c.nom:''; };
function identiteEleve(){ const c=compteCourant(); if(!c) return ELEVE;
  return {prenom:c.nom,pseudo:c.identifiant||'',niveau:c.niveau||'',filiere:c.filiere||'',niveauNom:nomClasse(c.filiere||c.niveau)}; }
function identiteProf(){ const c=compteCourant(); if(!c||c.role!=='prof') return PROF;
  const m=(window.MATIERES||[]).find(x=>x.id===c.matiere); return {nom:c.nom,matiere:c.matiere||'',matiereNom:m?m.nom.toLowerCase():''}; }
const auditeurs={};
function on(ev,fn){ (auditeurs[ev]=auditeurs[ev]||[]).push(fn); }
function emettre(ev,d){ (auditeurs[ev]||[]).forEach(f=>{ try{ f(d); }catch(e){ console.error(e); } }); }
const aujourdhui=()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const semaineDe=d=>{ const x=new Date(d); const j=(x.getDay()+6)%7; x.setDate(x.getDate()-j); x.setHours(0,0,0,0); return x.getTime(); };

/* la famille de démonstration : une élève, ses parents, sa professeure */
/* L'élève n'appartient à aucune classe par défaut : il travaille seul, lié ou non à un
   compte parent. Ses professeurs s'ajoutent par un lien (voir carnet.js) et vivent dans
   « classes-rejointes », pas ici. PROF est la persona de démonstration de l'espace
   professeur, c'est tout. */
const ELEVE={prenom:'Léa',pseudo:'lea.m',niveau:'seconde',niveauNom:'Seconde'};
const PROF={nom:'Mme Roux',matiere:'maths',matiereNom:'mathématiques'};

const ETAPES=[['comprendre','Comprendre','cours','Lire le cours'],['explorer','Explorer','explorer','Manipuler un labo'],['calculer','Calculer','exercices','Faire un exercice guidé'],['comparer','Comparer','methodes','Suivre une méthode pas à pas'],['entrainer','S\'entraîner','entrainement','Réussir le jeu'],['controle','Contrôle blanc','controle','Un sujet en conditions réelles']];

const SUCCES={
  'premiere-ligne':{nom:'Première ligne juste',fam:'Autonomie',txt:'Une étape vérifiée juste, sans indice.'},
  'dix-sans-indice':{nom:'Dix sans indice',fam:'Autonomie',txt:'10 exercices guidés réussis sans aucune aide.'},
  'erreur-corrigee':{nom:'Erreur corrigée',fam:'Persévérance',txt:'Une erreur trouvée et corrigée après un seul indice.'},
  'tous-les-labos':{nom:'Explorateur',fam:'Exploration',txt:'Tous les labos d\'un chapitre manipulés.'},
  'porte-nouvelle':{nom:'Nouvelle porte',fam:'Exploration',txt:'Une porte d\'entrée jamais utilisée.'},
  'cours-lu':{nom:'Cours lu',fam:'Cours',txt:'Un cours lu jusqu\'au bout, puis son quiz réussi.'},
  'semaine-active':{nom:'Semaine régulière',fam:'Méthode',txt:'Quatre jours de travail dans la même semaine.'},
  'corrige-ia':{nom:'Œil critique',fam:'Esprit critique',txt:'Une erreur trouvée dans « Corrige l\'IA ».'},
  'controle-blanc':{nom:'En conditions réelles',fam:'Méthode',txt:'Un contrôle blanc mené jusqu\'au bout.'},
};

/* le bureau personnel : ce qui se gagne (cahier des charges, « Avatar, succès et bureau
   personnel » ; choix du professeur, 26 octobre). Une trace calme du travail accompli : chaque
   objet est inscrit à part, avec sa date (mp:bureau-gagne), et n'en repart jamais — les jours
   actifs ne sont gardés que 120 jours, une plante calculée dessus finirait par rapetisser. Rien
   ne récompense le temps passé ni les connexions : la plante compte des semaines de TRAVAIL,
   c'est-à-dire au moins deux jours où l'élève a répondu à quelque chose (exercice guidé, jeu,
   quiz, défi de labo, méthode déroulée, contrôle blanc) ; ouvrir le site, lire ou faire
   défiler ne comptent pas. */
const GAGNE={
  seuils:[1,4,12],     // le géranium : une pousse, une jeune plante, en fleurs (semaines de travail cumulées, pas d'affilée)
  jours:2,             // une semaine de travail : deux jours de travail au moins
  etapes:['comprendre','explorer','calculer','comparer','entrainer'],   // un chapitre terminé, un livre : les cinq premières étapes (le contrôle blanc reste au choix)
  travail:['calculer','comparer','entrainer','controle'],               // les étapes qui sont du travail (lire le cours ou toucher un labo n'en sont pas)
  instruments:{maths:'maths','physique-chimie':'pc',svt:'svt',snt:'snt'}, // le premier défi de labo réussi d'une matière pose son instrument sur l'appui
  familles:{'Autonomie':'autonomie','Méthode':'methode','Persévérance':'perseverance','Exploration':'exploration','Esprit critique':'esprit-critique','Cours':'cours','Classe':'classe'}   // la médaille de chaque succès
};
const cleJour=ms=>{ const d=new Date(ms); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
function chapitreCatalogue(id){ for(const m of (window.MATIERES||[])) for(const n of (m.niveaux||[])) for(const c of (n.chapitres||[])) if(c.id===id) return {matiere:m,niveau:n,chapitre:c}; return null; }

const Pupitre={
  lire,ecrire,supprimer,on,emettre,echap,ETAPES,SUCCES,GAGNE,chapitreCatalogue,
  get ELEVE(){ return identiteEleve(); },
  get PROF(){ return identiteProf(); },
  /* --- la session : un compte du prototype ouvert dans ce navigateur (voir comptes.js) --- */
  session:{
    id:()=>session(),
    compte:()=>compteCourant(),
    ouvrir(id){ localStorage.setItem('mp:session',JSON.stringify({id,depuis:Date.now()})); SESSION=undefined; },
    fermer(){ try{ localStorage.removeItem('mp:session'); }catch(e){} SESSION=undefined; },
    /* le préfixe des clés rangées par compte, pour un script qui écrit hors de « mp: » (les
       records des jeux) : '' sans compte, la mémoire du visiteur restant telle qu'elle était */
    espace:()=>session()?espace():'',
    cles:()=>clesCourantes()
  },
  role(){ const c=compteCourant(); return c ? c.role : lire('role','eleve'); },
  setRole(r){ ecrire('role',r); },
  /* --- l'interrupteur du tuteur --- */
  ia:{
    actif(){ return lire('ia',true) && !Pupitre.ia.bloque(); },
    bloque(){
      if(lire('ia-parent',false)) return {par:'parent',message:'Tes parents ont coupé l\'IA du tuteur depuis leur espace. Le tuteur continue avec les indices du vérificateur.'};
      const n=document.body.dataset.niveau||''; if(/cm|ce|cp|sixieme|cinquieme/.test(n)) return {par:'niveau',message:'Avant la quatrième, le tuteur fonctionne sans IA, conformément au cadre ministériel.'};
      const q=lire('ia-quota',{jour:'',n:0}); if(q.jour===aujourdhui()&&q.n>=60) return {par:'quota',message:'Tu as atteint le nombre d\'échanges avec l\'IA pour aujourd\'hui (60). Le tuteur continue avec les indices du vérificateur.'};
      return null; },
    basculer(){ const v=!lire('ia',true); ecrire('ia',v); emettre('ia',v); return v; },
    compter(){ const q=lire('ia-quota',{jour:'',n:0}); if(q.jour!==aujourdhui()){ q.jour=aujourdhui(); q.n=0; } q.n++; ecrire('ia-quota',q); }
  },
  /* --- affichage Essentiel / Complet et éléments masqués --- */
  affichage(){ return lire('affichage','complet'); },
  setAffichage(v){ ecrire('affichage',v); },
  masque(id){ return Pupitre.affichage()==='essentiel' ? !['travail','suivi'].includes(id) : (lire('masques',[])||[]).includes(id); },
  setMasque(id,oui){ const m=new Set(lire('masques',[])); if(oui) m.add(id); else m.delete(id); ecrire('masques',[...m]); },
  /* --- la barre de parcours d'un chapitre --- */
  parcours(ch){ return lire('parcours:'+ch,{}); },
  etape(ch,nom,fait){ if(!ch) return; if(fait!==false&&GAGNE.travail.includes(nom)) Pupitre.gagne.travail();
    const p=lire('parcours:'+ch,{}); if(p[nom]===(fait!==false)) return; p[nom]=fait!==false; ecrire('parcours:'+ch,p); emettre('etape',{chapitre:ch,etape:nom,fait:p[nom]}); Pupitre.jourActif(); Pupitre.gagne.chapitre(ch); },
  pourcentage(ch){ const p=Pupitre.parcours(ch); return Math.round(100*ETAPES.filter(e=>p[e[0]]).length/ETAPES.length); },
  /* --- exercices guidés : niveau d'aide utilisé, pour l'indicateur d'autonomie --- */
  exercice(e){ const l=lire('exos',[]); l.push(Object.assign({date:Date.now()},e)); ecrire('exos',l.slice(-400)); Pupitre.jourActif(); Pupitre.gagne.travail();
    const sans=l.filter(x=>x.ok&&x.aide===0).length; if(sans>=1) Pupitre.succes.debloquer('premiere-ligne'); if(sans>=10) Pupitre.succes.debloquer('dix-sans-indice');
    if(e.ok&&e.aide===1) Pupitre.succes.debloquer('erreur-corrigee'); emettre('exercice',e); },
  autonomie(){ const l=lire('exos',[]); const s0=semaineDe(Date.now()), s1=s0-7*864e5;
    const f=(a,b)=>l.filter(x=>x.ok!==undefined&&x.date>=a&&x.date<b); const c=f(s0,Infinity), p=f(s1,s0);
    const taux=t=>t.length?Math.round(100*t.filter(x=>x.ok&&x.aide===0).length/t.length):null;
    return {total:c.length,sans:c.filter(x=>x.ok&&x.aide===0).length,taux:taux(c),precedent:taux(p)}; },
  /* --- jours actifs de la semaine (une semaine active, pas une série) : les visites, ce qui
     pousse à revenir sans dire comment travailler (choix du professeur, 27 octobre). Les jours
     de travail, eux, sont dans le registre du bureau personnel (gagne.travail) : la plante et
     « Semaine régulière » ne comptent qu'eux. mp:jours garde les 120 derniers. --- */
  jourActif(){ const j=lire('jours',[]); const d=aujourdhui(); if(!j.includes(d)){ j.push(d); ecrire('jours',j.slice(-120)); } },
  joursSemaine(){ const j=new Set(lire('jours',[])); const s=new Date(semaineDe(Date.now())); return [0,1,2,3,4,5,6].map(i=>{ const d=new Date(s); d.setDate(s.getDate()+i); const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); return {jour:'LMMJVSD'[i],date:k,actif:j.has(k),futur:d>new Date()}; }); },
  /* --- succès --- */
  succes:{
    liste(){ return lire('succes',[]); },
    debloquer(id){ const l=lire('succes',[]); if(l.some(s=>s.id===id)||!SUCCES[id]) return false; l.push({id,date:Date.now()}); ecrire('succes',l); emettre('succes',Object.assign({id},SUCCES[id])); return true; },
    dernier(){ const l=lire('succes',[]); const d=l[l.length-1]; return d?Object.assign({},d,SUCCES[d.id]):null; }
  },
  /* --- le bureau personnel (voir GAGNE) : la plante, les livres, les instruments ; les
     médailles, elles, sont les succès --- */
  gagne:{
    etat(){ const e=lire('bureau-gagne',null)||{}; return {semaine:e.semaine||'',jours:e.jours||[],semaines:e.semaines||[],plante:e.plante||null,
      livres:e.livres||[],instruments:e.instruments||{},vus:e.vus||[],rattrape:!!e.rattrape}; },
    stade(n){ return GAGNE.seuils.filter(s=>n>=s).length; },   // 0 rien, 1 une pousse, 2 une jeune plante, 3 en fleurs
    _plante(e){ const st=Pupitre.gagne.stade(e.semaines.length); if(st<=((e.plante&&e.plante.stade)||0)) return null;
      e.plante={stade:st,date:Date.now()}; return {quoi:'plante',stade:st,semaines:e.semaines.length}; },
    /* un jour de travail : l'élève a répondu à quelque chose (pas une lecture, pas une connexion) */
    travail(){ Pupitre.jourActif(); const e=Pupitre.gagne.etat(), s=cleJour(semaineDe(Date.now())), d=aujourdhui(), avant=e.semaine+e.jours.join();
      if(e.semaine!==s){ e.semaine=s; e.jours=[]; }
      if(!e.jours.includes(d)) e.jours.push(d);
      let gain=null; if(e.jours.length>=GAGNE.jours&&!e.semaines.includes(s)){ e.semaines.push(s); gain=Pupitre.gagne._plante(e); }
      if(avant!==e.semaine+e.jours.join()||gain) ecrire('bureau-gagne',e);
      if(gain) emettre('gagne',gain);
      if(e.jours.length>=4) Pupitre.succes.debloquer('semaine-active'); },
    /* un chapitre terminé : un livre à la couleur de sa matière, sur l'étagère de gauche */
    chapitre(ch){ const p=lire('parcours:'+ch,{}); if(!GAGNE.etapes.every(k=>p[k])) return;
      const e=Pupitre.gagne.etat(); if(e.livres.some(l=>l.ch===ch)) return; const c=chapitreCatalogue(ch); if(!c) return;
      e.livres.push({ch,couleur:c.matiere.couleur||'neutre',date:Date.now()}); ecrire('bureau-gagne',e);
      emettre('gagne',{quoi:'livre',ch,titre:c.chapitre.titre}); },
    /* le premier défi de labo réussi d'une matière : son instrument, sur l'appui de la fenêtre */
    labo(ch){ const c=chapitreCatalogue(ch), k=c&&GAGNE.instruments[c.matiere.id]; if(!k) return;
      const e=Pupitre.gagne.etat(); if(e.instruments[k]) return;
      e.instruments[k]={date:Date.now(),ch}; ecrire('bureau-gagne',e);
      emettre('gagne',{quoi:'instrument',cle:k,matiere:c.matiere.nom,titre:c.chapitre.titre}); },
    /* ce qu'un navigateur avait déjà fait avant le bureau personnel : les chapitres terminés, et
       les semaines de travail qu'on peut encore lire dans les exercices guidés datés. Une fois,
       sans message (les jours actifs, eux, comptent les visites : ils ne servent pas ici). */
    rattraper(){ const e=Pupitre.gagne.etat(); if(e.rattrape) return; e.rattrape=true;
      try{ const pre=espace()+'parcours:'; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!k||!k.startsWith(pre)) continue;
        const ch=k.slice(pre.length), p=lire('parcours:'+ch,{}), c=chapitreCatalogue(ch);
        if(c&&GAGNE.etapes.every(x=>p[x])&&!e.livres.some(l=>l.ch===ch)){ e.livres.push({ch,couleur:c.matiere.couleur||'neutre',date:Date.now()}); e.vus.push('livre:'+ch); } } }catch(err){}
      const parSemaine={}; lire('exos',[]).forEach(x=>{ if(!x.date) return; const s=cleJour(semaineDe(x.date)); (parSemaine[s]=parSemaine[s]||new Set()).add(cleJour(x.date)); });
      Object.keys(parSemaine).forEach(s=>{ if(parSemaine[s].size>=GAGNE.jours&&!e.semaines.includes(s)) e.semaines.push(s); });
      if(Pupitre.gagne._plante(e)) e.vus.push('plante:'+e.plante.stade);
      ecrire('bureau-gagne',e); },
    /* ce que l'élève a déjà vu apparaître : le reste arrive en fondu, une fois */
    voir(cles){ const e=Pupitre.gagne.etat(), n=cles.filter(k=>!e.vus.includes(k)); if(!n.length) return; e.vus=e.vus.concat(n); ecrire('bureau-gagne',e); }
  },
  /* un jour de travail sans étape à cocher (un jeu fini, un quiz terminé) */
  travail(){ Pupitre.gagne.travail(); },
  /* un défi de labo réussi : du travail, et l'instrument de la matière la première fois */
  laboReussi(ch){ Pupitre.gagne.travail(); if(ch) Pupitre.gagne.labo(ch); },
  /* --- « Je n'ai pas compris », anonyme --- */
  nonCompris(id){ const l=lire('non-compris',[]); if(!l.includes(id)){ l.push(id); ecrire('non-compris',l); } },
  estNonCompris(id){ return lire('non-compris',[]).includes(id); },
  /* --- où j'en étais --- */
  memoriserPage(titre,sous){ const h=location.href.split('?')[0].split('#')[0]; const rel= RACINE&&h.startsWith(RACINE) ? h.slice(RACINE.length) : h.split('/').slice(-3).join('/'); ecrire('derniere',{url:rel+location.hash,titre,sous,date:Date.now()}); },   // chemin relatif à la racine du site, où qu'il soit hébergé
  dernierePage(){ return lire('derniere',null); },
  portes(){ return lire('portes',[]); },
  porte(id){ const p=lire('portes',[]); if(!p.includes(id)){ p.push(id); ecrire('portes',p); if(p.length>=3) Pupitre.succes.debloquer('porte-nouvelle'); } },
  /* --- page de classe publiée par la professeure (démo) --- */
  /* --- temps d'écran, pour le rappel de pause --- */
  activite(){ const a=lire('activite',{depuis:0,minutes:0,dernier:0}); const t=Date.now(); if(t-a.dernier>5*60e3){ a.depuis=t; a.minutes=0; } else a.minutes+= (t-a.dernier)/60e3; a.dernier=t; ecrire('activite',a); return a; },
  pauseFaite(){ ecrire('activite',{depuis:Date.now(),minutes:0,dernier:Date.now()}); },
  /* tout ce que la mémoire courante garde : celle du compte connecté (avec sa fiche, sans les
     empreintes du mot de passe et du code de secours), ou celle du visiteur */
  exporter(){ const o={}; try{ clesCourantes().forEach(k=>{ o[k]=localStorage.getItem(k); });
    const c=compteCourant(); if(c){ const f=Object.assign({},c); delete f.mdp; delete f.secours; o['compte']=JSON.stringify(f); } }catch(e){} return o; },
  toutEffacer(){ try{ clesCourantes().forEach(k=>localStorage.removeItem(k)); }catch(e){} },
  /* --- la démonstration : un bureau déjà rempli, pour voir le prototype « en vitesse de croisière » --- */
  demo:{
    active(){ return lire('demo',false); },
    charger(){
      const J=864e5, t=Date.now(), lundi=semaineDe(t), idx=Math.min(6,Math.floor((t-lundi)/J));   // idx : 0 lundi … 6 dimanche
      const cle=ms=>{ const d=new Date(ms); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
      const quand=(sem,i,h)=>Math.min(t-5*60e3,lundi-7*J*sem+i*J+h*36e5);   // sem : 0 cette semaine, 1 la semaine dernière
      // jours actifs : cette semaine jusqu'à aujourd'hui (un jour sauté quand la semaine est avancée), et quatre jours la semaine dernière
      const cette=[]; for(let i=0;i<=idx;i++){ if(i===1&&idx>=3) continue; cette.push(i); }
      ecrire('jours',[...[0,1,3,4].map(i=>cle(lundi-7*J+i*J)),...cette.map(i=>cle(lundi+i*J))]);
      // exercices guidés : cette semaine, surtout sans aide ; la semaine dernière, avec plus d'indices
      const c=k=>cette[Math.min(k,cette.length-1)];
      const ex=(sem,i,h,o)=>Object.assign({date:quand(sem,i,h),chapitre:'fonctions',ok:true},o);
      const exos=[ex(0,c(0),9,{id:'antecedent-1',aide:0,erreurs:0}),ex(0,c(0),9.5,{id:'antecedent-2',aide:0,erreurs:1}),ex(0,c(1),10,{id:'antecedent-3',aide:1,erreurs:1}),ex(0,c(2),11,{id:'antecedent-1',aide:0,erreurs:0}),ex(0,c(2),11.5,{id:'reduire-1',chapitre:'calcul-litteral-4',aide:0,erreurs:0}),ex(0,c(cette.length-1),9,{id:'developper-1',chapitre:'calcul-litteral-4',aide:2,erreurs:2}),
        ex(1,0,17,{id:'antecedent-1',aide:2,erreurs:2}),ex(1,0,17.5,{id:'antecedent-2',aide:1,erreurs:1}),ex(1,1,18,{id:'reduire-1',chapitre:'calcul-litteral-4',aide:0,erreurs:0}),ex(1,1,18.5,{id:'developper-1',chapitre:'calcul-litteral-4',aide:3,erreurs:2}),ex(1,3,17,{id:'double-1',chapitre:'calcul-litteral-4',aide:1,erreurs:1}),ex(1,3,17.5,{id:'factoriser-1',chapitre:'calcul-litteral-4',aide:0,erreurs:0}),ex(1,4,18,{id:'antecedent-3',aide:2,erreurs:1}),ex(1,4,18.5,{id:'reduire-1',chapitre:'calcul-litteral-4',aide:1,erreurs:0})];
      ecrire('exos',exos.sort((a,b)=>a.date-b.date));
      ecrire('parcours:fonctions',{comprendre:true,explorer:true,calculer:true,comparer:true,entrainer:true});
      ecrire('parcours:solutions-ph',{comprendre:true,explorer:true,calculer:true,comparer:true,entrainer:true});
      ecrire('parcours:vecteurs',{comprendre:true,explorer:true});
      ecrire('parcours:calcul-litteral-4',{comprendre:true,explorer:true,calculer:true,comparer:true,entrainer:true,controle:true});
      ecrire('succes',[{id:'premiere-ligne',date:quand(1,0,17)},{id:'tous-les-labos',date:quand(1,1,18)},{id:'erreur-corrigee',date:quand(1,3,17)},{id:'controle-blanc',date:quand(1,4,18)},{id:'semaine-active',date:quand(0,c(cette.length-1),9)}]);
      ecrire('portes',['maths:chapitre','maths:controle','maths:carte','maths:labos']);
      ecrire('derniere',{url:'maths/seconde/fonctions.html#exercices',titre:'Notion de fonction',sous:'Mathématiques · Seconde',date:t-2*36e5});
      ecrire('non-compris',['fonctions/c-pieges']);
      ecrire('plan:maths',[{t:'Relire la fiche « image et antécédent » (cours, partie 2)',d:'10 min',u:'maths/seconde/fonctions.html#cours',fait:true},{t:'Refaire deux exercices guidés d\'antécédent avec le tuteur',d:'20 min',u:'maths/seconde/fonctions.html#exercices',fait:true},{t:'Manipuler le labo « Reconstituer une somme »',d:'10 min',u:'maths/seconde/vecteurs.html#explorer',fait:false},{t:'Contrôle blanc en conditions réelles',d:'30 min',u:'#fabrique',fait:false}]);
      ecrire('avatar',{peau:'#E0AC7E',cheveux:'#8B5A2B',coupe:'long',haut:'#B5524A',acc:'aucun'});
      ecrire('activite',{depuis:t-28*60e3,minutes:28,dernier:t});
      // la démo lie Léa à la classe de Mme Roux et remplit son carnet : une échéance, deux
      // conseils, un point de cours, un message préfait. Les cibles sont de vrais ancrages.
      const vendredi=(()=>{ const d=new Date(t); d.setDate(d.getDate()+((5-d.getDay()+7)%7||7)); return cle(d.getTime()); })();
      const j=n=>cle(t-n*J);
      ecrire('classes-rejointes',[{code:'4K7P',prof:'Mme Roux',matiere:'maths',classe:'2de 4',niveau:'Seconde',depuis:j(21)}]);
      ecrire('carnet:4K7P',[
        {id:'d1',type:'echeance',date:j(4),nature:'controle',echeance:vendredi,chapitres:['fonctions','vecteurs']},
        {id:'d2',type:'exercice',date:j(3),chapitre:'fonctions',exercice:{id:'ex-lecture-graphique',titre:'Lecture graphique'},message:'sans-indice'},
        {id:'d3',type:'cours',date:j(3),chapitre:'fonctions',section:{id:'c-vocabulaire',titre:'Le vocabulaire : ce qui entre, ce qui sort'}},
        {id:'d4',type:'exercice',date:j(1),chapitre:'vecteurs',exercice:{id:'ex-chasles-en-serie',titre:'Chasles en série'}},
        {id:'d5',type:'message',date:j(0),message:'progres'}]);
      ecrire('carnet-fait',['d3']);
      // le bureau personnel : une jeune plante (cinq semaines de travail), trois livres, deux instruments
      const sem=k=>cle(lundi-7*J*k);
      ecrire('bureau-gagne',{semaine:cle(lundi),jours:[],semaines:[5,4,3,2,1].map(sem),plante:{stade:2,date:quand(1,3,17)},
        livres:[{ch:'calcul-litteral-4',couleur:'maths',date:quand(2,2,18)},{ch:'solutions-ph',couleur:'pc',date:quand(1,1,18)},{ch:'fonctions',couleur:'maths',date:quand(0,c(0),10)}],
        instruments:{maths:{date:quand(2,1,17),ch:'calcul-litteral-4'},pc:{date:quand(1,0,18),ch:'solutions-ph'}},
        vus:['plante:1','plante:2','livre:calcul-litteral-4','livre:solutions-ph','livre:fonctions','instrument:maths','instrument:pc','vitrine'].concat(['premiere-ligne','tous-les-labos','erreur-corrigee','controle-blanc','semaine-active'].map(x=>'medaille:'+x)),rattrape:true});
      ecrire('demo',true);
    },
    effacer(){ Pupitre.toutEffacer(); }
  },
};
window.Pupitre=Pupitre;

/* ---------- 2. La coque ---------- */
let RACINE='', SITE={nom:'Monpupitre'}, MATIERES=[];
const lien=p=>window.AUTONOME?'#':RACINE+p;
/* Le clair est le défaut : sans choix enregistré, on est en clair, quel que soit le
   réglage du système. Consulter prefers-color-scheme ici ferait croire à la bascule
   qu'elle part du sombre sur une machine en sombre, et le premier clic ne ferait rien. */
const theme={ sombre(){ return document.documentElement.dataset.theme==='dark'; },
  basculer(){ const n=theme.sombre()?'light':'dark'; document.documentElement.setAttribute('data-theme',n); try{ localStorage.setItem('theme',n); }catch(e){} } };

/* La mention de licence du pied de page, lue dans window.SITE (voir chapitres.js).
   Dans un fichier élève autonome, le lien vers Creative Commons serait mort hors ligne :
   on garde alors le texte seul. Le même helper existe dans site.js, qui bâtit le pied
   de ces fichiers-là sans passer par ici. */
function mentionLicence(){
  const S=window.SITE||{}, l=S.licence;
  const c='© '+(S.annee||new Date().getFullYear())+(S.auteur?' '+echap(S.auteur):'');
  if(!l) return '<span>'+c+'</span>';
  const m=window.AUTONOME ? echap(l.nom)
        : '<a rel="license noopener" target="_blank" href="'+l.url+'">'+echap(l.nom)+'</a>';
  return '<span>'+c+' · Contenu sous '+m+'</span>';
}

/* l'avatar, dans l'esprit du bureau lofi (27 octobre) : un buste peint en aplats doux, éclairé
   par la fenêtre le jour, par la lampe la nuit (jetons --av-* de variables.css). Mêmes réglages
   qu'avant : peau, cheveux, coupe, haut, accessoire. Les couleurs de l'ancienne palette, trop vives
   pour le décor, sont lues comme leur équivalent lofi : un avatar déjà composé garde son allure. */
const AVATAR_DEFAUT={peau:'#F1C9A5',cheveux:'#3B2A1A',coupe:'court',haut:'#4A5A8A',acc:'aucun'};
/* Les palettes et les couleurs choisies sont des DONNÉES (l'élève les enregistre) : elles restent
   ici. Tout le reste du dessin — l'œil, la joue, les accessoires, la lumière — est dans bureau.css
   (section « L'avatar »), en classes qui lisent les jetons --av-* de variables.css. Le script ne
   pose sur le <svg> que des variables : les couleurs choisies et leurs ombres calculées. */
const AVATAR_ANCIENNES={'#000000':'#14110F','#B22222':'#B5452B','#6B6B6B':'#8A8A8A','#FFFFFF':'#EDE6DA',
  '#2B5BD7':'#4A5A8A','#C4186A':'#B5524A','#1F8A45':'#7E9C7A','#7B3FD1':'#7A4E6E','#0B7C86':'#3F6E7A','#2A140B':'#3B3346','#FFD166':'#D9A441'};
function avatarReglages(role){ role=role||lire('role','eleve');
  const a= role==='eleve' ? Object.assign({},AVATAR_DEFAUT,lire('avatar',{})) : role==='parent' ? {peau:'#E0AC7E',cheveux:'#8A8A8A',coupe:'court',haut:'#6B4A33',acc:'aucun'} : {peau:'#F1C9A5',cheveux:'#8B5A2B',coupe:'chignon',haut:'#4A5A8A',acc:'lunettes'};
  ['peau','cheveux','haut'].forEach(k=>{ const c=String(a[k]||'').toUpperCase(); if(AVATAR_ANCIENNES[c]) a[k]=AVATAR_ANCIENNES[c]; });
  return a; }
const AVATAR_COUPES={   // un calque derrière la tête, un calque devant, un reflet
  court:['','<path d="M37 55C34 33 46 21 61 21C77 21 87 33 83 55C81 47 78 42 73 39C66 44 54 45 44 42C41 46 39 50 37 55Z"/>','M50 27C56 24 66 24 72 28'],
  long:['<path d="M33 52C31 29 45 18 60 18C76 18 90 29 87 52L90 96Q81 102 73 96L72 66L48 66L47 96Q39 102 30 96Z"/>','<path d="M36 58C33 33 46 20 60 20C75 20 87 33 84 58C82 49 79 43 74 38C70 44 64 46 60 40C56 46 50 45 46 38C41 43 38 50 36 58Z"/>','M47 27C53 23 63 22 70 26'],
  boucle:['<circle cx="40" cy="34" r="11"/><circle cx="52" cy="24" r="12"/><circle cx="67" cy="23" r="12"/><circle cx="80" cy="33" r="11"/><circle cx="35" cy="47" r="10"/><circle cx="85" cy="47" r="10"/><circle cx="36" cy="60" r="8"/><circle cx="84" cy="60" r="8"/>','<circle cx="44" cy="36" r="8"/><circle cx="54" cy="31" r="8"/><circle cx="65" cy="31" r="8"/><circle cx="75" cy="36" r="8"/><circle cx="39" cy="45" r="6"/><circle cx="81" cy="45" r="6"/>','M47 25C52 21 58 20 63 21'],
  chignon:['<circle cx="60" cy="17" r="11"/>','<path d="M37 54C35 33 46 23 60 23C74 23 85 33 83 54C80 45 76 39 70 36C64 38 56 38 50 36C44 39 40 45 37 54Z"/>','M53 13C57 10 63 10 66 13'],
  ras:['','<path d="M38 50C37 34 47 25 60 25C73 25 83 34 82 50C79 42 72 37 60 37C48 37 41 42 38 50Z" opacity=".92"/>','']};
const AVATAR_ACC={
  lunettes:'<g class="av-verres" stroke-width="1.8"><circle cx="51" cy="56" r="6.5"/><circle cx="69" cy="56" r="6.5"/></g><path class="av-branches" d="M57.5 56h5M44.5 55l-6-2M75.5 55l6-2" stroke-width="1.6" stroke-linecap="round"/>',
  casque:'<path class="av-arceau" d="M34 56C32 30 46 17 60 17C74 17 88 30 86 56" stroke-width="5" stroke-linecap="round"/><path class="av-arceau-reflet" d="M35 50C35 31 47 20 60 20" stroke-width="1.6" stroke-linecap="round"/><rect class="av-casque" x="28" y="47" width="12" height="19" rx="5"/><rect class="av-casque" x="80" y="47" width="12" height="19" rx="5"/><rect class="av-coussin" x="33" y="49" width="7" height="15" rx="3"/><rect class="av-coussin" x="80" y="49" width="7" height="15" rx="3"/>',
  bonnet:'<path class="av-bonnet" d="M35 48C35 29 46 19 60 19C74 19 85 29 85 48Z"/><path class="av-bonnet-cotes" d="M44 24v22M52 21v25M60 20v26M68 21v25M76 24v22" stroke-width="1.4" opacity=".7"/><rect class="av-bonnet-revers" x="32" y="44" width="56" height="10" rx="5"/><path class="av-bonnet-mailles" d="M38 46v6M44 46v6M50 46v6M56 46v6M62 46v6M68 46v6M74 46v6M80 46v6" stroke-width="1.3"/><circle class="av-pompon" cx="60" cy="17" r="6"/>'};
const AVATAR_SOUS_BONNET={   // ce qui dépasse du bonnet, selon la coupe
  long:'<path d="M36 52C36 66 37 84 33 94Q40 99 46 94C45 82 44 66 43 52Z"/><path d="M84 52C84 66 83 84 87 94Q80 99 74 94C75 82 76 66 77 52Z"/>',
  court:'<path d="M37 52C37 58 38 62 40 64L43 52Z"/><path d="M83 52C83 58 82 62 80 64L77 52Z"/>',
  boucle:'<circle cx="36" cy="56" r="6"/><circle cx="84" cy="56" r="6"/><circle cx="37" cy="66" r="5"/><circle cx="83" cy="66" r="5"/>'};
AVATAR_SOUS_BONNET.chignon=AVATAR_SOUS_BONNET.court;
let avatarN=0, avatarMel=null;
/* les deux teintes vers lesquelles on fonce ou on éclaircit une couleur choisie : des jetons de
   variables.css, lus une fois */
function avatarMelanges(){ if(avatarMel) return avatarMel; const st=getComputedStyle(document.documentElement);
  const m={ombre:st.getPropertyValue('--av-melange-ombre').trim(),lumiere:st.getPropertyValue('--av-melange-lumiere').trim()};
  if(m.ombre&&m.lumiere) avatarMel=m; return m; }
function avatarTeinte(c,vers,k){ const h=x=>{ x=String(x||'#888').replace('#',''); if(x.length===3) x=x.replace(/./g,'$&$&'); return [0,2,4].map(i=>parseInt(x.substr(i,2),16)||0); };
  const a=h(c), b=h(vers); return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*k).toString(16).padStart(2,'0')).join(''); }
/* taille en px ; role pour les avatars du parent et du professeur ; reglages pour dessiner une
   variante (les vignettes de Personnalisation) sans toucher à ce qui est enregistré */
function avatarSVG(taille,role,reglages){
  const a=Object.assign({},AVATAR_DEFAUT,reglages||avatarReglages(role)), id='av'+(++avatarN), t=taille||32, petit=t<56;
  const m=avatarMelanges(), fonce=(c,k)=>avatarTeinte(c,m.ombre,k), clair=(c,k)=>avatarTeinte(c,m.lumiere,k);
  const vars={'--av-peau':a.peau,'--av-peau-o':fonce(a.peau,.22),'--av-peau-t':fonce(a.peau,.38),
    '--av-cheveux':a.cheveux,'--av-cheveux-o':fonce(a.cheveux,.25),'--av-cheveux-c':clair(a.cheveux,.35),
    '--av-haut':a.haut,'--av-haut-o':fonce(a.haut,.25),'--av-haut-c':clair(a.haut,.18)};
  const cp=AVATAR_COUPES[a.coupe]||AVATAR_COUPES.court, bonnet=a.acc==='bonnet';
  return '<svg class="avatar avatar-lofi" viewBox="0 0 120 120" width="'+t+'" height="'+t+'" aria-hidden="true" style="'+Object.entries(vars).map(([k,v])=>k+':'+v).join(';')+'">'+
    '<defs><clipPath id="'+id+'c"><circle cx="60" cy="60" r="60"/></clipPath>'+
    '<linearGradient id="'+id+'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="av-s-fond-haut"/><stop offset="1" class="av-s-fond-bas"/></linearGradient>'+
    '<radialGradient id="'+id+'l" cx=".28" cy=".22" r=".55"><stop offset="0" class="av-s-lueur"/><stop offset="1" class="av-s-lueur av-s-transparent"/></radialGradient>'+
    '<linearGradient id="'+id+'v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="av-s-peau"/><stop offset=".72" class="av-s-peau"/><stop offset="1" class="av-s-peau-o"/></linearGradient>'+
    '<linearGradient id="'+id+'h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="av-s-haut-c"/><stop offset=".55" class="av-s-haut"/><stop offset="1" class="av-s-haut-o"/></linearGradient>'+
    '<linearGradient id="'+id+'e" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="av-s-eclair-g"/><stop offset=".5" class="av-s-eclair-g av-s-transparent"/><stop offset=".62" class="av-s-eclair-d av-s-transparent"/><stop offset="1" class="av-s-eclair-d"/></linearGradient>'+
    (petit?'':'<filter id="'+id+'g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 .05  0 0 0 .5 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>')+
    '</defs><g clip-path="url(#'+id+'c)">'+
    '<rect width="120" height="120" fill="url(#'+id+'f)"/><rect width="120" height="120" fill="url(#'+id+'l)"/>'+
    (petit?'':'<path class="av-plateau" d="M0 104h120v16H0z"/>')+
    (bonnet?'':'<g class="av-cheveux-dos">'+cp[0]+'</g>')+                                             // les cheveux derrière
    '<path d="M12 124C14 103 28 93 45 90L75 90C92 93 106 103 108 124Z" fill="url(#'+id+'h)"/>'+          // le pull
    '<path class="av-pli" d="M30 124C31 112 33 104 36 98M90 124C89 112 87 104 84 98" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>'+
    '<path class="av-peau-o" d="M52 72h16v18c-3 3-13 3-16 0z"/><path class="av-haut-o" d="M47 90C50 97 70 97 73 90L70 88C66 92 54 92 50 88Z"/>'+   // le cou, le col
    '<ellipse class="av-peau-o" cx="38.5" cy="57" rx="4.5" ry="6"/><ellipse class="av-peau-o" cx="81.5" cy="57" rx="4.5" ry="6"/>'+
    '<path d="M39 52C39 35 48 27 60 27C72 27 81 35 81 52C81 67 71 79 60 79C49 79 39 67 39 52Z" fill="url(#'+id+'v)"/>'+
    (petit?'':'<path class="av-front" d="M41 47C48 50 70 50 79 47L79 51C70 54 50 54 41 51Z" opacity=".25"/><path class="av-lisere" d="M41 56C41 66 47 75 55 78" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>')+
    '<ellipse class="av-joue" cx="47" cy="64" rx="4.6" ry="2.6" opacity=".32"/><ellipse class="av-joue" cx="73" cy="64" rx="4.6" ry="2.6" opacity=".32"/>'+
    '<ellipse class="av-oeil" cx="51" cy="57" rx="2.3" ry="2.9"/><ellipse class="av-oeil" cx="69" cy="57" rx="2.3" ry="2.9"/>'+
    (petit?'':'<circle class="av-reflet-oeil" cx="51.8" cy="56" r=".8"/><circle class="av-reflet-oeil" cx="69.8" cy="56" r=".8"/>')+
    '<path class="av-sourcil" d="M46.5 50.5q4.5-2.4 9 0M64.5 50.5q4.5-2.4 9 0" stroke-width="1.5" stroke-linecap="round"/>'+
    '<path class="av-nez" d="M60 60q-1.4 3.4.6 4.4" stroke-width="1.3" stroke-linecap="round"/><path class="av-bouche" d="M55.5 69.5q4.5 3.4 9 0" stroke-width="1.6" stroke-linecap="round"/>'+
    (bonnet ? '<g class="av-cheveux">'+(AVATAR_SOUS_BONNET[a.coupe]||'')+'</g>'
            : '<g class="av-cheveux">'+cp[1]+'</g>'+(cp[2]&&!petit?'<path class="av-reflet" d="'+cp[2]+'" stroke-width="2" stroke-linecap="round" opacity=".7"/>':''))+
    (AVATAR_ACC[a.acc]||'')+
    // la lumière : la fenêtre à gauche le jour ; la nuit, le froid à gauche et la lampe à droite
    '<rect class="av-eclair" width="120" height="120" fill="url(#'+id+'e)"/><rect class="av-voile" width="120" height="120"/>'+
    (petit?'':'<rect width="120" height="120" filter="url(#'+id+'g)" opacity=".35"/>')+
    '</g></svg>';
}

/* -- le bandeau -- */
function bandeau(role,info){
  const b=document.createElement('header'); b.className='bandeau gutter'; b.setAttribute('role','banner');
  const eleve=role==='eleve';
  const nomRole={eleve:'',parent:'Espace parent',prof:'Espace professeur'}[role];
  const interrupteur= eleve ? '<div class="ia-zone"><button class="ia" type="button" role="switch" aria-checked="true"><span class="piste" aria-hidden="true"><span class="pouce"></span></span><span class="ia-txt">Tuteur avec IA</span></button><div class="bulle" role="status" hidden></div></div>' : '<span class="badge-role">'+nomRole+'</span>';
  b.innerHTML='<div class="bandeau-in">'+
    '<button class="ouvrir-classeur" type="button" aria-label="Ouvrir le classeur" aria-expanded="false" aria-controls="classeur-col"><span></span><span></span><span></span></button>'+
    '<a class="marque" href="'+lien(eleve?(SITE.accueil||'index.html'):role+'.html')+'"><span class="logo" aria-hidden="true">'+LOGO+'</span><span class="nom">'+echap(SITE.nom)+'</span></a>'+
    interrupteur+
    '<nav class="actions" aria-label="Compte et réglages">'+
      (eleve?'<a class="action" href="'+lien('personnalisation.html')+'"><span class="ico" aria-hidden="true">🎨</span><span>Personnalisation</span></a>':'')+
      '<a class="action aide" href="'+lien('aide.html')+'" aria-label="Aide et tutoriels"><span class="ico" aria-hidden="true">?</span><span class="sr">Aide</span></a>'+
      '<button class="action btn-theme" type="button" aria-label="Changer de thème clair ou sombre"><span class="ico" aria-hidden="true">◐</span></button>'+
      (compteCourant()?'':'<a class="action se-connecter" href="'+lien('connexion.html')+'">Se connecter</a>')+
      '<details class="compte"><summary aria-label="Mon compte">'+avatarSVG(30)+'<span class="prenom">'+echap(quiEstLa(role).court)+'</span><span class="chev" aria-hidden="true">▾</span></summary>'+menuCompte(role)+'</details>'+
    '</nav></div>';
  b.querySelector('.btn-theme').addEventListener('click',theme.basculer);
  const ia=b.querySelector('.ia');
  if(ia){
    const bulle=b.querySelector('.bulle');
    function peindre(){ const bloque=Pupitre.ia.bloque(), on=Pupitre.ia.actif();
      ia.setAttribute('aria-checked',on); ia.classList.toggle('bloque',!!bloque); ia.querySelector('.ia-txt').textContent= bloque?'Tuteur sans IA':(on?'Tuteur avec IA':'Tuteur sans IA');
      ia.title= bloque?bloque.message:(on?'L\'IA pose des questions et donne des indices. Clique pour la couper.':'Le tuteur donne les indices du vérificateur. Clique pour activer l\'IA.'); }
    ia.addEventListener('click',()=>{ const bloque=Pupitre.ia.bloque();
      if(bloque){ bulle.innerHTML='<strong>L\'IA est coupée.</strong> '+echap(bloque.message)+(bloque.par==='parent'?' <a href="'+lien('compte.html#parents')+'">Ce que voient mes parents</a>':''); bulle.hidden=false; clearTimeout(bulle._t); bulle._t=setTimeout(()=>bulle.hidden=true,7000); return; }
      const v=Pupitre.ia.basculer(); peindre();
      bulle.innerHTML= v?'<strong>IA activée.</strong> Elle guide par des questions, ne calcule jamais seule, et ne donne jamais la réponse.':'<strong>IA coupée.</strong> Le tuteur continue avec les indices du vérificateur : rien n\'est perdu.';
      bulle.hidden=false; clearTimeout(bulle._t); bulle._t=setTimeout(()=>bulle.hidden=true,4500); });
    document.addEventListener('click',e=>{ if(!e.target.closest('.ia-zone')) bulle.hidden=true; });
    peindre(); on('ia',peindre);
  }
  // menu compte : fermer en cliquant ailleurs ou avec Échap
  const compte=b.querySelector('details.compte');
  document.addEventListener('click',e=>{ if(!compte.contains(e.target)) compte.open=false; });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') compte.open=false; });
  compte.addEventListener('click',e=>{ if(e.target.closest('[data-theme-menu]')){ e.preventDefault(); theme.basculer(); return; }
    if(e.target.closest('a[data-deconnexion]')){ e.preventDefault(); Pupitre.session.fermer(); location.href=lien(SITE.accueil||'index.html'); return; }
    const r=e.target.closest('a[data-role]'); if(r){ e.preventDefault(); Pupitre.setRole(r.dataset.role); location.href=lien(r.dataset.role==='eleve'?(SITE.accueil||'index.html'):r.dataset.role+'.html'); }
    const a=e.target.closest('button[data-affichage]'); if(a){ e.preventDefault(); Pupitre.setAffichage(a.dataset.affichage); location.reload(); }
    const dm=e.target.closest('[data-demo]'); if(dm){ e.preventDefault(); demoAction(dm.dataset.demo); } });
  return b;
}
/* charger ou effacer la démonstration, puis revenir sur le bureau */
function demoAction(quoi){ if(quoi==='charger'){ Pupitre.demo.charger(); location.href=lien((SITE.accueil)||'index.html'); } else { Pupitre.demo.effacer(); location.href=lien((SITE.accueil)||'index.html'); } }
const LOGO='<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><rect x="4" y="12" width="32" height="7" rx="2.5" fill="currentColor"/><path d="M8 19h24l-2 14H10z" fill="currentColor" opacity=".85"/><rect x="13" y="7" width="14" height="4" rx="2" fill="currentColor" opacity=".6"/></svg>';
/* qui est là : le compte connecté, sinon le personnage de la démonstration pour cet espace */
function quiEstLa(role){ const c=compteCourant();
  if(c){ const E=identiteEleve(), P=identiteProf();
    const statut= c.role==='eleve'&&c.statut==='decouverte' ? ' · mode découverte' : c.role==='prof'&&!c.verifie ? ' · en attente de vérification' : '';
    return {court:c.nom,
      titre: c.role==='eleve' ? c.nom+(E.niveauNom?' · '+E.niveauNom:'') : c.role==='prof' ? c.nom+(P.matiereNom?' · '+P.matiereNom:'') : c.nom,
      sous: {eleve:'identifiant : '+c.identifiant,parent:'compte parent',prof:'compte enseignant'}[c.role]+statut}; }
  return role==='eleve' ? {court:ELEVE.prenom,titre:ELEVE.prenom+' · '+ELEVE.niveauNom,sous:'pseudonyme : '+ELEVE.pseudo}
       : role==='parent' ? {court:'Parents de Léa',titre:'Parents de Léa et Tom',sous:'compte parent'}
       : {court:PROF.nom,titre:PROF.nom+' · '+PROF.matiereNom,sous:'compte enseignant vérifié'}; }
function menuCompte(role){
  const aff=Pupitre.affichage(), c=compteCourant(), q=quiEstLa(role);
  const r= c ? c.role : role;   // connecté, le menu suit le compte ; sinon l'espace de la démonstration
  const l=[];
  if(r==='eleve'){ l.push(['compte.html','Mon compte'],['carnet.html','Carnet des professeurs'],['personnalisation.html','Personnalisation'],['compte.html#parents','Ce que voient mes parents']); }
  if(r==='parent'){ l.push(['compte.html','Mon compte'],['parent.html','Espace parent'],['parent.html#transparence','Ce que je vois de mon enfant']); }
  if(r==='prof'){ l.push(['compte.html','Mon compte'],['prof.html','Espace professeur'],['banque.html','Banque d\'exercices'],['prof.html#transparence','Ce que voient mes élèves de moi']); }
  l.push(['lire-le-cours.html','Comment lire un cours'],['aide.html','Aide et tutoriels'],['compte.html#donnees','Exporter mes données']);
  return '<div class="menu" role="menu">'+
    '<div class="menu-tete">'+avatarSVG(44)+'<div><strong>'+echap(q.titre)+'</strong><span class="discret">'+echap(q.sous)+'</span></div></div>'+
    '<div class="menu-aff"><span class="discret">Affichage</span><div class="bascule"><button type="button" data-affichage="essentiel" aria-pressed="'+(aff==='essentiel')+'">Essentiel</button><button type="button" data-affichage="complet" aria-pressed="'+(aff==='complet')+'">Complet</button></div></div>'+
    (c?'':'<a role="menuitem" class="se-connecter" href="'+lien('connexion.html')+'">Se connecter ou créer un compte</a>')+
    l.map(x=>'<a role="menuitem" href="'+lien(x[0])+'">'+x[1]+'</a>').join('')+'<a role="menuitem" href="#" data-theme-menu>Thème clair / sombre</a>'+
    (c ? '<a role="menuitem" href="'+lien('connexion.html')+'">Changer de compte</a><a role="menuitem" class="deconnexion" href="#" data-deconnexion>Se déconnecter</a>'
       : '<div class="menu-demo"><span class="discret">Prototype · voir comme :</span><a href="#" data-role="eleve" aria-current="'+(role==='eleve')+'">Élève</a><a href="#" data-role="parent" aria-current="'+(role==='parent')+'">Parent</a><a href="#" data-role="prof" aria-current="'+(role==='prof')+'">Professeur</a></div>'+
         '<div class="menu-demo"><span class="discret">Données :</span>'+(Pupitre.demo.active()?'<a href="#" data-demo="effacer">Effacer la démo</a>':'<a href="#" data-demo="charger">Charger une démo</a>')+'</div>')+
    '</div>';
}

/* -- la colonne de gauche : les intercalaires du classeur --
   L'élève se repère d'abord par son cycle (collège, lycée), sa classe, sa filière, puis
   par matière : la colonne range donc cycle → classe → filière → matière → chapitre
   (décisions du 25 octobre). Le cycle n'est qu'un titre repliable, sans décalage.
   Toutes les Premières sont dans le même intercalaire « Première », qui contient
   « Générale » et « ST2S » ; une classe sans filière nommée (collège, Seconde) montre ses
   matières directement. Classes et filières viennent de window.CLASSES (catalogue).
   Par défaut tout est replié, sauf la classe et la filière de l'élève (celles de son
   compte) ; les matières, même là, restent fermées. Une filière seule dans sa classe est
   dépliée d'office : un intercalaire à un seul choix ne ferait qu'ajouter un clic.
   Seule exception : sur une page de chapitre, le chemin qui y mène est déplié, pour que
   l'élève voie où il est. Rien de ce qu'on ouvre ou ferme n'est rejoué à la page
   suivante. 'matiere-ouverte' se mémorise encore, mais ne sert plus qu'à savoir quelle
   matière l'élève regarde (la pile de cahiers, la porte « matière »). */

/* les classes, leurs filières et leurs matières, pour les matières suivies */
function classesDuClasseur(matieres){
  const parNiveau=new Map();     // id de niveau → [{matiere, niveau}]
  matieres.forEach(m=>(m.niveaux||[]).forEach(n=>{
    if(!parNiveau.has(n.id)) parNiveau.set(n.id,[]);
    parNiveau.get(n.id).push({matiere:m,niveau:n});
  }));
  const ranges=new Set();
  const filiere=(f)=>{
    const parMat=new Map();
    Object.keys(f.niveaux).forEach(nid=>{ ranges.add(nid);
      (parNiveau.get(nid)||[]).forEach(({matiere,niveau})=>{
        if(!parMat.has(matiere.id)) parMat.set(matiere.id,{matiere,niveaux:[]});
        parMat.get(matiere.id).niveaux.push({niveau,option:f.niveaux[nid]||niveau.nom});
      }); });
    const mats=matieres.filter(m=>parMat.has(m.id)).map(m=>parMat.get(m.id));
    return {id:f.id,nom:f.nom||'',niveauIds:Object.keys(f.niveaux),matieres:mats};
  };
  const classes=(window.CLASSES||[]).map(c=>({id:c.id,nom:c.nom,cycle:c.cycle||'',filieres:c.filieres.map(filiere).filter(f=>f.matieres.length)}));
  // les niveaux que les classes n'ont pas prévus : chacun devient une classe à lui seul
  parNiveau.forEach((liste,nid)=>{ if(ranges.has(nid)) return;
    classes.push({id:nid,nom:liste[0].niveau.nom,filieres:[filiere({id:nid,nom:'',niveaux:{[nid]:''}})]}); });
  classes.forEach(c=>c.niveauIds=c.filieres.flatMap(f=>f.niveauIds));
  return classes.filter(c=>c.filieres.length);
}

function colonneEleve(info){
  const courant=info&&info.courant, mat=info&&info.matiere;
  const suivies=lire('matieres-suivies',null);
  const ouvertes=MATIERES.filter(m=>m.ouverte&&(!suivies||suivies.includes(m.id))), bientot=MATIERES.filter(m=>!m.ouverte);
  const classes=classesDuClasseur(ouvertes);
  const niveauChapitre= courant ? courant.niveauId : null;
  // un même programme peut servir plusieurs filières (les maths du tronc commun techno) :
  // on ne déplie que la filière de l'élève, ou à défaut la première qui mène au chapitre
  const filieres=classes.flatMap(c=>c.filieres);
  const E=identiteEleve(), filEleve=filieres.find(f=>f.id===E.filiere)||filieres.find(f=>f.niveauIds.includes(E.niveau));
  const filChemin=niveauChapitre ? (filEleve&&filEleve.niveauIds.includes(niveauChapitre) ? filEleve : filieres.find(f=>f.niveauIds.includes(niveauChapitre))) : null;
  const compte=mats=>{ let f=0,t=0; mats.forEach(x=>x.niveaux.forEach(({niveau:n})=>{ f+=n.chapitres.filter(c=>c.fichier).length; t+=n.chapitres.length; })); return '<small>'+f+' / '+t+'</small>'; };
  const chapitres=n=>'<div class="chaps">'+n.chapitres.map((c,i)=>{ const pc=c.fichier?Pupitre.pourcentage(c.id):0; const cls='chap'+(c.fichier?'':' a-venir')+(courant&&courant.id===c.id?' courant':'');
      return c.fichier?'<a class="'+cls+'" href="'+lien(c.fichier)+'"'+(courant&&courant.id===c.id?' aria-current="page"':'')+'><span class="n">'+(i+1)+'</span><span class="t">'+echap(c.titre)+'</span>'+(pc?'<span class="pc" title="Parcours : '+pc+' %"><i style="--p:'+pc+'%"></i></span>':'')+'</a>'
                      :'<span class="'+cls+'" title="À venir"><span class="n">'+(i+1)+'</span><span class="t">'+echap(c.titre)+'</span><span class="sr">(à venir)</span></span>'; }).join('')+'</div>';
  const matiere=f=>({matiere:m,niveaux})=>{
    // une matière n'est dépliée que si elle mène au chapitre affiché
    const ouverteM= f===filChemin&&mat&&m.id===mat.id&&niveaux.some(x=>x.niveau.id===niveauChapitre);
    const corps= niveaux.length===1 ? chapitres(niveaux[0].niveau)
      : niveaux.map(({niveau,option})=>'<p class="sous-niv">'+echap(option)+'</p>'+chapitres(niveau)).join('');
    const nomP=m.nom.toLowerCase()==='svt'||m.nom.toLowerCase()==='snt'?m.nom:m.nom.toLowerCase();
    return '<details class="mat" data-couleur="'+echap(m.couleur||'neutre')+'" data-matiere-id="'+echap(m.id)+'"'+(ouverteM?' open':'')+'><summary><span class="onglet-mat">'+echap(m.nom)+'</span>'+compte([{niveaux}])+'</summary>'+corps+
      '<a class="portes-lien" href="'+lien('matiere.html?m='+encodeURIComponent(m.id))+'">Les portes d\'entrée de '+echap(nomP)+' →</a></details>';
  };

  let h='<span class="surtitre col-titre">Mon classeur</span><nav class="intercalaires" aria-label="Classes, filières, matières et chapitres">';
  const classe=cl=>{
    const ouvertC= cl.filieres.some(f=>f===filEleve||f===filChemin) || classes.length===1;
    let c='<details class="niv"'+(ouvertC?' open':'')+'><summary><span class="onglet-niv">'+echap(cl.nom)+'</span>'+compte(cl.filieres.flatMap(f=>f.matieres))+'</summary><div class="matieres-col">';
    cl.filieres.forEach(f=>{
      if(!f.nom){ c+=f.matieres.map(matiere(f)).join(''); return; }
      const ouvertF= f===filEleve || f===filChemin || cl.filieres.length===1;
      c+='<details class="filiere"'+(ouvertF?' open':'')+'><summary><span class="onglet-filiere">'+echap(f.nom)+'</span>'+compte(f.matieres)+'</summary><div class="matieres-col">'+f.matieres.map(matiere(f)).join('')+'</div></details>';
    });
    return c+'</div></details>';
  };
  // les cycles (Collège, Lycée) : de simples titres repliables, sans décalage, pour ne
  // pas voler de largeur aux chapitres. Celui de l'élève est ouvert, l'autre fermé.
  const cycles=(window.CYCLES||[]).map(cy=>({cy,classes:classes.filter(c=>c.cycle===cy.id)})).filter(x=>x.classes.length);
  cycles.forEach(({cy,classes:cs})=>{
    const ouvert= cs.some(cl=>cl.filieres.some(f=>f===filEleve||f===filChemin)) || cycles.length===1;
    h+='<details class="cycle"'+(ouvert?' open':'')+'><summary><span>'+echap(cy.nom)+'</span>'+compte(cs.flatMap(cl=>cl.filieres.flatMap(f=>f.matieres)))+'</summary><div class="classes-cycle">'+cs.map(classe).join('')+'</div></details>';
  });
  h+=classes.filter(c=>!cycles.some(x=>x.cy.id===c.cycle)).map(classe).join('');
  if(bientot.length) h+='<p class="bientot-col"><span class="discret">Bientôt :</span> '+bientot.map(m=>'<span data-couleur="'+echap(m.couleur)+'"><i class="pastille"></i>'+echap(m.nom)+'</span>').join('')+'</p>';
  h+='</nav><nav class="rubriques" aria-label="Rubriques"><a href="'+lien('matiere.html?m='+(mat?mat.id:'maths')+'#carte')+'"><span class="ico" aria-hidden="true">🗺</span>Carte des notions</a><a href="'+lien('apprendre.html')+'"><span class="ico" aria-hidden="true">💡</span>Apprendre à apprendre</a><a href="'+lien('aller-plus-loin.html')+'"><span class="ico" aria-hidden="true">🔭</span>Aller plus loin</a></nav>';
  return h;
}
function colonnePersonnes(role){
  if(role==='parent') return '<span class="surtitre col-titre">Mes enfants</span><nav class="intercalaires personnes" aria-label="Enfants"><a class="personne courant" href="#" data-enfant="lea" aria-current="page"><span class="pastille-p" data-couleur="maths"></span><span><strong>Léa</strong><small>Seconde · 2de 4</small></span></a><a class="personne" href="#" data-enfant="tom"><span class="pastille-p" data-couleur="svt"></span><span><strong>Tom</strong><small>Quatrième · 4e B</small></span></a></nav>'+
    '<nav class="rubriques" aria-label="Rubriques"><a href="#ensemble"><span class="ico" aria-hidden="true">👀</span>Vue d\'ensemble</a><a href="#echeances"><span class="ico" aria-hidden="true">📅</span>Échéances</a><a href="#reglages"><span class="ico" aria-hidden="true">⚙️</span>Réglages de suivi</a><a href="#transparence"><span class="ico" aria-hidden="true">🔎</span>Ce que je vois</a></nav>';
  /* la banque d'exercices (banque.html, planche.html) garde la colonne du professeur : ses
     classes et ses rubriques mènent alors à l'espace professeur */
  const ici=document.body.dataset.page==='prof', r=a=>ici?a:lien('prof.html'+a);
  const classe=(id,nom,detail,courant)=>'<a class="personne'+(courant&&ici?' courant':'')+'" href="'+(ici?'#':lien('prof.html'))+'"'+(ici?' data-classe="'+id+'"'+(courant?' aria-current="page"':''):'')+'><span class="pastille-p" data-couleur="maths"></span><span><strong>'+nom+'</strong><small>'+detail+'</small></span></a>';
  const banque=['banque','planche'].includes(document.body.dataset.page);
  return '<span class="surtitre col-titre">Mes classes</span><nav class="intercalaires personnes" aria-label="Classes">'+classe('2de4','2de 4','26 élèves · code <code>4K7P</code>',true)+classe('tle','Terminale spé 2','31 élèves · code <code>7MQ2</code>',false)+'</nav>'+
    '<nav class="rubriques" aria-label="Rubriques"><a href="'+r('#ensemble')+'"><span class="ico" aria-hidden="true">👀</span>Vue d\'ensemble</a><a href="'+r('#eleves')+'"><span class="ico" aria-hidden="true">🧑‍🎓</span>Élèves</a><a href="'+r('#parcours')+'"><span class="ico" aria-hidden="true">🧭</span>Parcours</a><a href="'+r('#carnet-prof')+'"><span class="ico" aria-hidden="true">📌</span>Carnet des élèves</a>'+
    '<a href="'+lien('banque.html')+'"'+(banque?' aria-current="page"':'')+'><span class="ico" aria-hidden="true">📚</span>Banque d\'exercices</a><a href="'+r('#mode-classe')+'"><span class="ico" aria-hidden="true">📽</span>Mode classe</a></nav>';
}
function colonne(role,info){
  const a=document.createElement('aside'); a.className='classeur-col'; a.id='classeur-col'; a.setAttribute('aria-label','Classeur');
  a.innerHTML='<div class="col-in">'+(role==='eleve'?colonneEleve(info):colonnePersonnes(role))+
    (role==='eleve'?'<a class="parler" href="'+lien('aide.html#parler')+'"><span aria-hidden="true">💬</span> J\'ai besoin de parler à quelqu\'un</a>':'<a class="parler" href="'+lien('aide.html#parler')+'"><span aria-hidden="true">💬</span> Numéros d\'aide pour un jeune en difficulté</a>')+'</div>';
  a.addEventListener('toggle',e=>{ const d=e.target;   // retient la matière regardée, sans la rouvrir ensuite
    if(d.classList&&d.classList.contains('mat')&&d.open&&d.dataset.matiereId) ecrire('matiere-ouverte',d.dataset.matiereId); },true);
  return a;
}

/* -- le coin bas droit : musique et pause -- */
function coin(role){
  if(role!=='eleve'||Pupitre.affichage()==='essentiel') return null;
  const c=document.createElement('div'); c.className='coin'; c.setAttribute('aria-label','Musique et pause');
  if(!Pupitre.masque('musique')) c.innerHTML+='<div class="pastille-musique" id="pastille-musique"><button type="button" class="bouton-coin" aria-label="Musique de concentration" aria-expanded="false" aria-controls="panneau-musique"><span aria-hidden="true">🎧</span><span class="etat"></span></button></div>';
  if(!Pupitre.masque('pause')) c.innerHTML+='<div class="pastille-pause" id="pastille-pause"><button type="button" class="bouton-coin" aria-label="Rappel de pause"><span aria-hidden="true">☕</span><span class="etat">Pause dans 45 min</span></button></div>';
  return c;
}

/* -- assemblage -- */
function coque(info,opts){
  RACINE=opts.racine||''; SITE=window.SITE||SITE; MATIERES=window.MATIERES||[];
  const body=document.body; const role=body.dataset.espace||'eleve';
  body.dataset.role=role; body.dataset.affichage=Pupitre.affichage();
  if(window.AUTONOME){ body.classList.add('sans-coque'); return; }
  const decor=lire('decor','fenetre'); body.dataset.decor= decor==='heure' ? decorHeure() : decor;
  body.dataset.coque='1';
  const bur=document.createElement('div'); bur.className='bureau gutter';
  const zone=document.createElement('div'); zone.className='zone'; zone.id='contenu';
  [...body.children].forEach(ch=>{ if(ch.tagName!=='SCRIPT') zone.appendChild(ch); });
  const col=colonne(role,info);
  const fond=document.createElement('div'); fond.className='voile'; fond.hidden=true;
  bur.appendChild(col); bur.appendChild(zone);
  body.appendChild(bandeau(role,info)); body.appendChild(bur); body.appendChild(fond);
  const ci=coin(role); if(ci) body.appendChild(ci);
  const p=document.createElement('footer'); p.className='pied gutter';
  p.innerHTML='<div class="in"><span>'+echap(SITE.nom)+' · '+echap(SITE.accroche||'')+'</span>'+
    mentionLicence()+
    '<span><a href="'+lien(((window.SITE||{}).accueil)||'index.html')+'">Accueil</a> · <a href="'+lien('aide.html')+'">Aide</a> · <a href="'+lien('confidentialite.html')+'">Données et confidentialité</a> · <a href="'+lien('guide.html')+'">Mode d\'emploi</a></span></div>';
  body.appendChild(p);
  // tiroir sur mobile
  const btn=document.querySelector('.ouvrir-classeur');
  function ouvrir(o){ col.classList.toggle('ouverte',o); fond.hidden=!o; btn.setAttribute('aria-expanded',o); body.classList.toggle('tiroir-ouvert',o); if(o) col.querySelector('a,summary,button').focus(); }
  btn.addEventListener('click',()=>ouvrir(!col.classList.contains('ouverte')));
  fond.addEventListener('click',()=>ouvrir(false));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&col.classList.contains('ouverte')) ouvrir(false); });
  // fermer le tiroir quand on choisit un chapitre sur mobile
  col.addEventListener('click',e=>{ if(e.target.closest('a[href]')&&matchMedia('(max-width:999px)').matches) ouvrir(false); });
  // activité, rappel de pause, succès
  Pupitre.activite(); ['click','keydown','pointerdown'].forEach(ev=>document.addEventListener(ev,()=>{ clearTimeout(window._mpAct); window._mpAct=setTimeout(()=>Pupitre.activite(),2000); },{passive:true}));
  if(role==='eleve'){ Pupitre.jourActif(); Pupitre.gagne.rattraper(); }
  on('succes',s=>{ toast('<span class="ico" aria-hidden="true">🏅</span><strong>Succès : '+echap(s.nom)+'</strong><span>'+echap(s.txt)+'</span>'); redessinerGagnes(); });
  // ce qui se gagne sur le bureau : un mot discret, et le décor se repeint (l'objet arrive en fondu)
  on('gagne',g=>{ const m=messageGagne(g); if(m) toast('<span class="ico" aria-hidden="true">'+m[0]+'</span><strong>'+echap(m[1])+'</strong><span>'+echap(m[2])+'</span>'); redessinerGagnes(); });
  if(ci) rappelDePause(ci);
  if(ci&&ci.querySelector('#pastille-musique')) chargerMusique();
  decorSuivant(decor);
  fondBureau();
  return {role,zone,colonne:col};
}

/* -- le bureau dessiné : la scène derrière la page, les objets-commandes dans les marges --
   Tout le dessin est dans assets/js/fond-bureau.js (fabriqué par outils/fond_bureau.py) :
   deux vues, les objets et leurs styles, les palettes. Ici on lit les réglages de l'élève
   (clé mp:bureau), on pose la scène, on la mesure, et on branche les objets sur ce qui
   existe déjà : la lampe bascule le thème, le casque ouvre le panneau musique de la
   pastille, la tasse suit la pastille de pause, la pile de cahiers mène aux portes de la
   matière ouverte. « Le décor illustré » décoché dans Personnalisation = pas de scène. */
const BUREAU_DEFAUT={vue:'peint',lampe:'articulee',lampeCouleur:'vert',pot:'ceramique',potCouleur:'creme',crayons:'site',tasse:'creme',plante:'rosette',casque:'bleu',etagere:'simple',bois:'chene',livres:'site'};
const FOND_GEOMETRIE={jonction:268,largeur:1280,hauteur:900};   // de quoi mesurer avant que fond-bureau.js soit là
/* Chaque enregistrement recopie la vue avec le reste. Un réglage d'avant le bureau lofi porte
   donc « marquee » (le défaut d'alors), « douce », ou « peint » enregistré le 26 octobre au
   matin : sans ce tri, un navigateur qui a déjà réglé son bureau ne verrait jamais le bureau
   lofi. Une vue dessinée n'est gardée que si elle a été choisie depuis (v:3, posé à chaque
   enregistrement) ; une ambiance, toujours choisie exprès, reste. Ce qu'on enregistre ne
   passe jamais par la vue forcée de secours. */
const BUREAU_VERSION=4;
const AMBIANCES_LOFI=['futuriste','medieval','annees-70','annees-30'];   // les ambiances dessinées qui ont leur version lofi (mêmes clés)
function reglagesEnregistres(){ const brut=lire('bureau',{})||{}, r=Object.assign({},BUREAU_DEFAUT,brut);
  if((brut.v||0)<3&&(r.vue==='marquee'||r.vue==='douce')) r.vue=BUREAU_DEFAUT.vue;
  // depuis la version 4, les ambiances sont peintes : une ambiance dessinée choisie avant devient la même, en lofi
  if((brut.v||0)<4&&AMBIANCES_LOFI.includes(r.vue)){ r.peint=Object.assign({},r.peint||{},{ambiance:r.vue}); r.vue='peint'; }
  return r; }
function reglagesBureau(){ const r=reglagesEnregistres(); if(window._mpVueForcee&&r.vue==='peint') r.vue=window._mpVueForcee; return r; }
function enregistrerBureau(maj){ ecrire('bureau',Object.assign(reglagesEnregistres(),maj,{v:BUREAU_VERSION})); return reglagesBureau(); }

/* le bureau lofi (vue « peint », le décor de l'atelier d'images) : ses réglages vivent sous
   mp:bureau.peint. Les valeurs doivent exister dans pack-bureau.js ; une valeur inconnue (un
   réglage du bureau peint d'essai, par exemple) retombe sur la première. */
const PEINT_DEFAUT={ambiance:'base',lumiere:'heure',paysage:'ville',lampe:'articulee',lampeCouleur:'vert-sapin',casque:'arceau',casqueCouleur:'bleu-nuit',
  tasse:'mug',tasseCouleur:'creme',plante:'pothos',livres:'classique',pot:'ceramique',potCouleur:'creme',compagnon:'chaton',
  etagereG:'livres-classique',etagereD:'globe'};   // choix du professeur (26 octobre) : le chaton sur le rebord, des livres à gauche et le globe à droite
function reglagesPeint(){ return Object.assign({},PEINT_DEFAUT,reglagesBureau().peint||{}); }

/* un script du site, avec son numéro de version quand le site est publié (Site.versionnee, dans site.js) */
const urlScript=nom=>{ const u=RACINE+'assets/js/'+nom; return window.Site&&Site.versionnee?Site.versionnee(u):u; };
/* charger un script une seule fois, et rappeler tous ceux qui l'attendaient */
function chargerScript(nom,glob,apres){ if(window[glob]){ apres(); return; }
  const cle='_mpCharge_'+glob; if(window[cle]){ window[cle].push(apres); return; } window[cle]=[apres];
  const s=document.createElement('script'); s.src=urlScript(nom); s.defer=true;
  s.onload=()=>{ const l=window[cle]; window[cle]=null; l.forEach(f=>f()); };
  s.onerror=()=>{ window[cle]=null; if(glob==='PACK_BUREAU') secoursPeint(); };
  document.head.appendChild(s); }
/* le bureau peint introuvable (fichier absent, réseau coupé) : le bureau dessiné prend le
   relais pour cette page, sans toucher au réglage de l'élève */
function secoursPeint(){ if(window._mpSecours) return; window._mpSecours=true;
  window._mpVueForcee='marquee';
  chargerSvg(()=>{ appliquerBureau(); monterFond(); mesurerFond(); }); }
const chargerPack=apres=>chargerScript('pack-bureau.js','PACK_BUREAU',apres);
const chargerSvg=apres=>chargerScript('fond-bureau.js','FOND_BUREAU',apres);

function fondBureau(){
  if(Pupitre.masque('decor')){ document.body.classList.add('sans-decor'); return; }   // le bois uni d'avant, fenêtre en arche dans la zone
  document.body.dataset.fond='bureau';
  mesurerFond();   // tout de suite, avant que la page ne défile vers son #hash : le contenu est déjà poussé sous la fenêtre
  if(reglagesBureau().vue==='peint') chargerPack(monterFond);
  else chargerSvg(()=>{ appliquerBureau(); monterFond(); });
}
/* les couleurs choisies, posées sur :root en jour / nuit : variables.css les reprend
   dans --fb-abatjour, --fb-pot… selon le thème, sans que rien ne bouge ici au changement */
function appliquerBureau(){
  const F=window.FOND_BUREAU; if(!F) return;
  const r=reglagesBureau(), st=document.documentElement.style, P=F.palettes;
  const pose=(nom,paire)=>{ st.setProperty('--fb-'+nom+'-jour',paire[0]); st.setProperty('--fb-'+nom+'-nuit',paire[1]||paire[0]); };
  const L=P.lampe[r.lampeCouleur]||P.lampe.vert; pose('abatjour',L.base); pose('abatjour-h',L.haut);
  const Po=P.pot[r.potCouleur]||P.pot.creme; pose('pot',Po.base); pose('pot-o',Po.bord);
  const T=P.tasse[r.tasse]||P.tasse.creme; pose('tasse',T.base); pose('tasse-o',T.bord);
  const C=P.casque[r.casque]||P.casque.bleu; pose('coussin',C.base);
  const B=P.bois[r.bois]||P.bois.chene; pose('etagere',B.base); pose('etagere-ombre',B.ombre);
  (P.livres[r.livres]||P.livres.site).tons.forEach((c,i)=>st.setProperty('--fb-livre-'+(i+1)+'-choix',c));
  (P.crayons[r.crayons]||P.crayons.site).tons.forEach((c,i)=>st.setProperty('--fb-crayon-'+(i+1)+'-choix',c));
  document.body.dataset.fbEtagere=r.etagere; document.body.dataset.fbVue=r.vue;
  // une ambiance a son sous-main ; une vue ordinaire reprend celui du site
  const A=window.FOND_AMBIANCES, amb=F.vues[r.vue]&&F.vues[r.vue].ambiance&&A&&A.ambiances[r.vue];
  if(amb){ const [j,n]=amb.sousmain; st.setProperty('--fb-sousmain-jour',j[0]); st.setProperty('--fb-sousmain-b-jour',j[1]); st.setProperty('--fb-sousmain-nuit',n[0]); st.setProperty('--fb-sousmain-b-nuit',n[1]); document.body.dataset.fbAmbiance=r.vue; }
  else { ['--fb-sousmain-jour','--fb-sousmain-b-jour','--fb-sousmain-nuit','--fb-sousmain-b-nuit'].forEach(k=>st.removeProperty(k)); delete document.body.dataset.fbAmbiance; }
}
/* les ambiances sont dans un second fichier, lourd : on ne le charge que si l'élève en a choisi une */
function chargerAmbiances(apres){ if(window.FOND_AMBIANCES){ apres(); return; }
  if(window._mpAmbiancesEnCours){ window._mpAmbiancesEnCours.push(apres); return; }
  window._mpAmbiancesEnCours=[apres];
  const s=document.createElement('script'); s.src=urlScript('fond-ambiances.js'); s.defer=true;
  s.onload=()=>{ const l=window._mpAmbiancesEnCours; window._mpAmbiancesEnCours=null; l.forEach(f=>f()); }; document.head.appendChild(s); }
function monterFond(){
  const r=reglagesBureau();
  if(r.vue==='peint'){ if(window.PACK_BUREAU) monterPeint(); else chargerPack(monterFond); return; }
  const F=window.FOND_BUREAU; if(!F){ chargerSvg(()=>{ appliquerBureau(); monterFond(); }); return; }
  mentionDecor(false);
  const body=document.body;
  const vue=F.vues[r.vue]||F.vues.douce;
  if(vue.ambiance&&!window.FOND_AMBIANCES){ chargerAmbiances(()=>{ appliquerBureau(); monterFond(); }); return; }
  const amb= vue.ambiance ? window.FOND_AMBIANCES.ambiances[r.vue] : null;
  const ancien=document.querySelector('.fond-bureau'); if(ancien) ancien.remove();
  const f=document.createElement('div'); f.className='fond-bureau'; f.setAttribute('aria-hidden','true');
  const scene= amb ? window.FOND_AMBIANCES.scenes[r.vue] : (F.scenes[r.vue]||F.scenes.douce);
  f.innerHTML=scene+'<div class="fb-fenetre"></div><div class="fb-lumiere">'+(amb?amb.objets.lumiere:F.objets.lumiere)+'</div>';
  const dessin=(nom)=>{ if(amb) return amb.objets[nom]; const o=F.objets[nom]; return typeof o==='string' ? o : (o[r[nom]]||Object.values(o)[0]); };
  const objets=[['lampe','button','Thème clair ou sombre (la lampe)'],['tasse','button','Rappel de pause (la tasse)'],['casque','button','Musique de concentration (le casque)'],
                ['pot','div',''],['livres','a','Les portes d\'entrée de ma matière (la pile de cahiers)'],['plante','div','']];
  objets.forEach(([nom,tag,label])=>{ const el=document.createElement(tag); el.className='fb-objet'; el.dataset.objet=nom;
    if(label){ el.setAttribute('aria-label',label); if(!BULLES[nom]) el.title=label; }
    if(tag==='a') el.href=lien('matiere.html?m='+encodeURIComponent(lire('matiere-ouverte','maths')));
    if(tag==='button') el.type='button';
    el.innerHTML=dessin(nom); f.appendChild(el); });
  body.insertBefore(f,body.firstChild);
  brancherObjets(f);
}
/* les objets-commandes, quelle que soit la vue : la lampe bascule le thème, le casque ouvre
   le panneau musique de la pastille, la tasse suit la pastille de pause, les info-bulles */
function brancherObjets(f){
  f.querySelector('[data-objet="lampe"]').addEventListener('click',theme.basculer);
  f.querySelector('[data-objet="casque"]').addEventListener('click',e=>{ e.stopPropagation();   // sinon le clic « hors panneau » le referme aussitôt
    const b=document.querySelector('#pastille-musique button'); if(b) b.click(); else location.href=lien('personnalisation.html#musique'); });
  const tasse=f.querySelector('[data-objet="tasse"]');
  tasse.addEventListener('click',()=>{ const b=document.querySelector('#pastille-pause button'); if(b) b.click(); else location.href=lien('personnalisation.html#pause'); });
  function etatTasse(){ const e=document.querySelector('#pastille-pause .etat'); if(e&&e.textContent) tasse.setAttribute('aria-label','Rappel de pause · '+e.textContent); }
  etatTasse(); clearInterval(window._mpTasse); window._mpTasse=setInterval(etatTasse,30e3);
  const js=Pupitre.joursSemaine().filter(j=>j.actif).length;
  f.querySelector('[data-objet="plante"]').title=js+' jour'+(js>1?'s':'')+' actif'+(js>1?'s':'')+' cette semaine';
  Object.keys(BULLES).forEach(nom=>{ const el=f.querySelector('[data-objet="'+nom+'"]'); if(el) brancherBulle(el,nom); });
  mesurerFond(); if(!window._mpFondEcoute){ window._mpFondEcoute=true; addEventListener('resize',mesurerFond); }
}

/* -- le bureau lofi (pack-bureau.js, fabriqué par outils/atelier_lofi.py) --
   Le décor peint par l'atelier d'images, un par moment (matin, midi, soir, nuit), la vue
   choisie posée dans la vitre, les décorations sur les étagères : tout cela dans le « cadre »
   2048 × 1152, à l'échelle de l'écran, remonté de « decalage » pour que le haut de l'arche
   passe sous le bandeau. Les objets-commandes, eux, sont posés dans les marges (placerPeint),
   comme ceux du bureau dessiné, avec leur ombre de contact. Les objets sont peints au midi ;
   matin, soir et nuit leur viennent d'un filtre de teinte (feColorMatrix) ajusté sur le décor
   — la nuit, plus froide à gauche, plus chaude à droite près de la lampe. La lampe a sa
   version allumée, et sa lueur ; un chat, sa version endormie. Le compagnon choisi est assis
   sur l'appui de la fenêtre, dans le cadre. La nuit vient du thème sombre ; le jour suit
   l'heure ou le réglage « lumière ». */
function momentPeint(r){
  if(document.documentElement.dataset.theme==='dark') return 'nuit';
  if(r.lumiere&&r.lumiere!=='heure') return r.lumiere;
  const h=new Date().getHours(); return h>=6&&h<11?'matin':h>=11&&h<17?'midi':'soir';
}
/* la pièce d'un objet : style, puis couleur, avec retombée sur ce qui existe */
function piecePeinte(P,cat,style,couleur){ const c=P.objets[cat]||{}; const s=c[style]||c[Object.keys(c)[0]]; if(!s) return null;
  return s[couleur]||s.unique||s[Object.keys(s)[0]]; }
const IMG_BUREAU='assets/img/lofi/';
function filtresPeint(P){ const t=P.teintes||{};
  const valeurs=m=>m.map(l=>l[0]+' '+l[1]+' '+l[2]+' 0 '+l[3]).join(' ')+' 0 0 0 1 0';
  return '<svg class="fb-filtres" width="0" height="0" aria-hidden="true" focusable="false"><defs>'+Object.keys(t).map(m=>'<filter id="fb-teinte-'+m+'" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="'+valeurs(t[m])+'"/></filter>').join('')+'</defs></svg>'; }
/* le filtre d'un objet : aucun à midi ni pour une lampe allumée ; la nuit, selon son côté */
/* la teinte d'un objet peint selon le moment : des classes ; les filtres eux-mêmes sont posés par
   bureau.css (.fb-peint[data-moment] .fb-teinte), sur les filtres SVG de filtresPeint */
function teintePeinte(moment,cote){ return moment==='midi'?'':' fb-teinte fb-teinte-'+(cote||'d'); }
/* la scène du bureau lofi : celle de base, ou celle de l'ambiance choisie (même cadre, mêmes
   places ; ses propres décors, vues, teintes, objets et étagères) */
function scenePeinte(P,r){ const A=r.ambiance&&r.ambiance!=='base'&&P.ambiances&&P.ambiances[r.ambiance];
  if(A) return Object.assign({cle:r.ambiance},A);
  return {cle:'base',nom:'Lofi',decors:P.decors,vues:P.vues,planches:P.planches,teintes:P.teintes,bords:P.bords,
    propre:{cle:'ville',nom:(P.noms||{}).ville||'La ville'},noms:P.noms||{}}; }
/* la pièce d'un objet : celle de l'ambiance, sinon le style et la couleur choisis */
function pieceScene(P,S,cat,style,couleur){ return S.objets?S.objets[cat]||null:piecePeinte(P,cat,style,couleur); }
/* l'image et la boîte d'une pièce au moment donné (la lampe a sa nuit à elle) */
function vuePiece(e,nuit){ const n=nuit&&e.images.nuit;
  return {src:n?e.images.nuit:e.images.midi, boite:n&&e.nuit_boite?e.nuit_boite:e.boite, appui:n&&e.nuit_appui?e.nuit_appui:e.appui,
          contact:n&&e.nuit_contact?e.nuit_contact:e.contact, allumee:!!n}; }
/* l'ombre de contact sous un objet posé : une ellipse floue, de la largeur de ce qui touche */
function ombrePiece(v){ const [w,h]=[v.boite[2],v.boite[3]], c=v.contact||[w*.2,w*.8], l=c[1]-c[0];
  return '<i class="fb-ombre" style="--x:'+(100*(c[0]-l*.12)/w).toFixed(2)+'%;--l:'+(100*l*1.24/w).toFixed(2)+'%;--y:'+(100*v.appui[1]/h).toFixed(2)+'%"></i>'; }
function monterPeint(){
  const P=window.PACK_BUREAU, r=reglagesPeint(), body=document.body, st=document.documentElement.style, S=scenePeinte(P,r);
  const moment=momentPeint(r), nuit=moment==='nuit', [W,H]=P.cadre, dec=P.geometrie.decalage||0;
  const focus=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.fb-objet');
  const garderFocus=focus?focus.dataset.objet:null;
  const ancien=document.querySelector('.fond-bureau'); if(ancien) ancien.remove();
  ['--fb-sousmain-jour','--fb-sousmain-b-jour','--fb-sousmain-nuit','--fb-sousmain-b-nuit'].forEach(k=>st.removeProperty(k));
  delete body.dataset.fbAmbiance; body.dataset.fbVue='peint';
  const f=document.createElement('div'); f.className='fond-bureau fb-peint'; f.dataset.moment=moment;
  f.style.setProperty('--fbp-w',W+'px'); f.style.setProperty('--fbp-h',H+'px'); f.style.setProperty('--fbp-dy',dec+'px');
  f.dataset.ambiance=S.cle;
  const b=S.bords&&S.bords[moment]; if(b){ f.style.setProperty('--fbp-mur',b.mur); f.style.setProperty('--fbp-plateau',b.plateau); }
  const pc=(v,t)=>(100*v/t).toFixed(3)+'%';
  // une image du décor ; sa place (--x, --y, --l, --h) est une variable, que la classe fb-pose lit
  const img=(src,cls,place)=>'<img class="'+cls+(place?' fb-pose':'')+'" src="'+RACINE+IMG_BUREAU+src+'" alt="" decoding="async" draggable="false"'+(place?' style="'+place+'"':'')+'>';
  let cadre='<div class="fb-cadre" aria-hidden="true">'+img(S.decors[moment],'fb-decor');
  const vue=(S.vues||{})[r.paysage]; if(vue&&vue[moment]){ const v=P.vues_boite; cadre+=img(vue[moment],'fb-vue','--x:'+pc(v[0],W)+';--y:'+pc(v[1],H)+';--l:'+pc(v[2]-v[0],W)+';--h:'+pc(v[3]-v[1],H)); }
  // le bureau personnel : ce que l'élève a gagné (livres, vitrine, plante, instruments)
  const Gn=gagnesPeints(P,moment,pc,img);
  // les décorations sont peintes pour l'étagère de droite (la lumière de la fenêtre à leur
  // gauche) ; sur celle de gauche, elles sont retournées en miroir. Dès le premier livre,
  // l'étagère de gauche est celle des chapitres ; celle de droite ne cède que si elle déborde.
  const E=P.geometrie.etageres, decale=((E.gauche.x1+E.gauche.x2)-(E.droite.x1+E.droite.x2))/2;
  cadre+=Gn.mur;
  [['etagereD',0,'d'],['etagereG',decale,'g']].forEach(([cle,dx,cote])=>{ if(Gn.occupe[cote]) return; const e=S.etageres?S.etageres[cote]:P.etageres[r[cle]]; if(!e) return;
    const bx=e.boite;
    cadre+=img(e.images.midi,'fb-deco'+teintePeinte(moment,cote)+(cote==='g'?' fb-miroir':''),'--x:'+pc(bx[0]+dx,W)+';--y:'+pc(bx[1],H)+';--l:'+pc(bx[2],W)); });
  // le compagnon, sur l'appui de la fenêtre ; un chat dort la nuit, et respire lentement
  const C=(P.compagnons||{})[r.compagnon]; if(C){ const v=vuePiece(C,nuit), bx=v.boite, ct=v.contact||[bx[2]*.2,bx[2]*.8], l=ct[1]-ct[0];
    cadre+='<i class="fb-ombre fb-ombre-c" style="--x:'+pc(bx[0]+ct[0]-l*.12,W)+';--l:'+pc(l*1.24,W)+';--y:'+pc(bx[1]+v.appui[1],H)+'"></i>';
    cadre+=img(v.src,'fb-compagnon'+(v.allumee?' fb-dort':teintePeinte(moment,'g')),'--x:'+pc(bx[0],W)+';--y:'+pc(bx[1],H)+';--l:'+pc(bx[2],W)); }
  // on peut le caresser : une zone pour le pointeur, comme les objets gagnés (caresser())
  const vC=C&&vuePiece(C,nuit), toucheC=vC?'<button type="button" class="fb-touche fb-caresse" tabindex="-1" data-compagnon="'+echap(r.compagnon)+'" style="--x:'+pc(vC.boite[0],W)+';--y:'+pc(vC.boite[1],H)+';--l:'+pc(vC.boite[2],W)+';--h:'+pc(vC.boite[3],H)+'"></button>':'';
  cadre+=Gn.appui;
  f.innerHTML=filtresPeint(S)+cadre+'</div>'+(!toucheC?Gn.touches:Gn.touches?Gn.touches.replace(/<\/div>$/,toucheC+'</div>'):'<div class="fb-touches" aria-hidden="true">'+toucheC+'</div>');
  f._vitrine=Gn.vitrine||null;   // placerPeint écarte le pot du mode « haut » de la vitrine
  // les objets-commandes et les objets décoratifs, posés dans les marges par placerPeint
  const objets=[['lampe','button','Thème clair ou sombre (la lampe)',r.lampe,r.lampeCouleur],['tasse','button','Rappel de pause (la tasse)',r.tasse,r.tasseCouleur],
    ['casque','button','Musique de concentration (le casque)',r.casque,r.casqueCouleur],['pot','div','',r.pot,r.potCouleur],
    ['livres','a','Les portes d\'entrée de ma matière (la pile de livres)',r.livres,''],['plante','div','',r.plante,'']];
  objets.forEach(([nom,tag,label,style,couleur])=>{ const e=pieceScene(P,S,nom,style,couleur); const el=document.createElement(tag);
    el.className='fb-objet'; el.dataset.objet=nom;
    if(label) el.setAttribute('aria-label',label); else el.setAttribute('aria-hidden','true');
    if(tag==='a') el.href=lien('matiere.html?m='+encodeURIComponent(lire('matiere-ouverte','maths')));
    if(tag==='button') el.type='button';
    if(e){ const v=vuePiece(e,nuit), bx=v.boite;
      el._pose={w:bx[2],h:bx[3],ax:v.appui[0],ay:v.appui[1]};
      el.innerHTML=ombrePiece(v)+img(v.src,'fb-dessin'+(v.allumee?'':teintePeinte(moment,e.cote)));
      // la lueur de la lampe allumée, posée sur l'ampoule, en mélange « screen »
      if(nom==='lampe'&&v.allumee&&e.lueur){ const l=document.createElement('div'); l.className='fb-lueur'; l.setAttribute('aria-hidden','true');
        l._pose={x:e.lueur[0],y:e.lueur[1],r:Math.max(bx[2],bx[3])*1.15}; f.appendChild(l); el._lueur=l; } }
    f.appendChild(el); });
  body.insertBefore(f,body.firstChild);
  brancherObjets(f);
  f.querySelectorAll('.fb-touche').forEach(t=>{ const b=Gn.bulles[t.dataset.gagne]; if(b) brancherBulle(t,b); });
  const tc=f.querySelector('.fb-caresse'); if(tc){ brancherBulle(tc,()=>bulleCompagnon(P,r.compagnon,!!(vC&&vC.allumee))); tc.addEventListener('click',()=>caresser(f,r.compagnon)); }
  if(Gn.nouveaux.length) Pupitre.gagne.voir(Gn.nouveaux);
  mentionDecor(true); surveillerMoment();
  if(garderFocus){ const n=f.querySelector('[data-objet="'+garderFocus+'"]'); if(n) n.focus(); }
  // la nuit (ou le jour) suivante est prête avant le clic sur la lampe
  clearTimeout(window._mpPrechargeT); window._mpPrechargeT=setTimeout(()=>{ const autre=nuit?(r.lumiere&&r.lumiere!=='heure'?r.lumiere:'midi'):'nuit';
    [S.decors[autre]].concat((()=>{ const e=pieceScene(P,S,'lampe',r.lampe,r.lampeCouleur); return e?[e.images[autre==='nuit'?'nuit':'midi']]:[]; })())
      .filter(Boolean).forEach(s=>{ const i=new Image(); i.src=RACINE+IMG_BUREAU+s; }); },2500);
}
/* le bureau personnel dans le cadre (voir GAGNE et Pupitre.gagne) : les livres des chapitres
   terminés debout sur l'étagère de gauche, depuis le côté fenêtre (celui qu'on voit encore sur
   un portable), puis sur celle de droite si elle déborde ; la vitrine des succès sous l'étagère
   de gauche, une médaille par succès, plus serrées à mesure qu'elles arrivent ; le géranium et
   les instruments sur l'appui de la fenêtre, à leur place fixe. Mêmes places et mêmes images
   dans toutes les ambiances (la disposition y est la même), teintées par leur lumière. Ce qui
   n'a pas encore été vu arrive en fondu, une fois. Les zones de survol (aria-hidden, hors de
   la tabulation) mènent à Personnalisation, qui en est la version lisible au clavier. */
function formatLivre(ch){ let h=0; for(const c of ch) h=(h*31+c.charCodeAt(0))%997; return h%5<3?'a':'b'; }
function gagnesPeints(P,moment,pc,img){
  const G=P.gagnes, R={mur:'',appui:'',touches:'',occupe:{},bulles:{},nouveaux:[]};
  if(!G||Pupitre.masque('bureau-perso')&&Pupitre.masque('succes')) return R;
  const [W,H]=P.cadre, e=Pupitre.gagne.etat(), vus=new Set(e.vus), E=P.geometrie.etageres, voirG=!Pupitre.masque('bureau-perso');
  const neuf=k=>{ if(vus.has(k)) return ''; R.nouveaux.push(k); return ' fb-nouveau'; };
  const boite=b=>'--x:'+pc(b[0],W)+';--y:'+pc(b[1],H)+';--l:'+pc(b[2],W);   // la place, en variables (classe fb-pose)
  const zones=[];   // [clé, x, y, l, h, lien]
  const date=ms=>{ try{ return new Date(ms).toLocaleDateString('fr-FR',{day:'numeric',month:'long'}); }catch(err){ return ''; } };
  // les livres
  if(voirG&&e.livres.length&&G.livres){ let xg=E.gauche.x2-6, xd=E.droite.x1+6, x1=W, x2=0, y1=H; const titres=[];
    e.livres.forEach(l=>{ const p=(G.livres[l.couleur]||G.livres.neutre||{})[formatLivre(l.ch)]; if(!p) return;
      const w=p.boite[2], h=p.boite[3]; let cote='g';
      if(xg-w<E.gauche.x1+4){ cote='d'; if(xd+w>E.droite.x2-4) return; }   // les deux étagères pleines : la liste complète reste dans Personnalisation
      const sh=cote==='g'?E.gauche:E.droite, x=cote==='g'?xg-w:xd, y=sh.y+2-p.appui[1];
      if(cote==='g') xg-=w+1; else xd+=w+1;
      R.occupe[cote]=true; x1=Math.min(x1,x); x2=Math.max(x2,x+w); y1=Math.min(y1,y);
      const c=chapitreCatalogue(l.ch); if(c) titres.push(c.chapitre.titre);
      R.mur+=img(p.images.midi,'fb-livre'+neuf('livre:'+l.ch)+teintePeinte(moment,cote)+(cote==='d'?' fb-miroir':''),boite([x,y,w,h])); });
    if(titres.length){ zones.push(['livres',x1,y1,x2-x1,E.gauche.y+2-y1,'personnalisation.html#objets']);
      R.bulles.livres=()=>['Tes chapitres terminés',titres.length===1?'« '+titres[0]+' ».':'« '+titres.slice(-2).reverse().join(' », « ')+' »'+(titres.length>2?' et '+(titres.length-2)+' autre'+(titres.length>3?'s':'')+'.':'.'),
        titres.length+' chapitre'+(titres.length>1?'s':'')+' · un livre chacun']; } }
  // la vitrine des succès et ses médailles
  const succes=Pupitre.succes.liste();
  if(!Pupitre.masque('succes')&&succes.length&&G.vitrine){ const V=G.vitrine, vb=V.boite; R.vitrine=vb;
    R.mur+=img(V.images.midi,'fb-vitrine'+neuf('vitrine')+teintePeinte(moment,'g'),boite(vb));
    const [ix,iy,iw,ih]=V.interieur, n=succes.length, rangs=n<=5?1:n<=12?2:3, parRang=Math.ceil(n/rangs);
    const mh=Math.min(ih*.86/rangs-(rangs>1?ih*.04:0),iw/parRang*1.9), pasX=iw/parRang, pasY=ih/rangs;
    succes.forEach((x,i)=>{ const fam=GAGNE.familles[(SUCCES[x.id]||{}).fam]||'autonomie', m=G.medailles&&(G.medailles[fam]||G.medailles.autonomie); if(!m) return;
      const k=mh/m.boite[3], mw=m.boite[2]*k, ri=Math.floor(i/parRang), ci=i%parRang, dansRang=ri<rangs-1?parRang:n-parRang*(rangs-1);
      const cx=vb[0]+ix+(iw-dansRang*pasX)/2+(ci+.5)*pasX, cy=vb[1]+iy+(ri+.5)*pasY;
      R.mur+=img(m.images.midi,'fb-medaille'+neuf('medaille:'+x.id)+teintePeinte(moment,'g'),boite([cx-mw/2,cy-mh/2,mw,mh])); });
    zones.push(['vitrine',vb[0],vb[1],vb[2],vb[3],'personnalisation.html#objets']);
    const d=Pupitre.succes.dernier();
    R.bulles.vitrine=()=>['La vitrine · tes succès','Une médaille par succès, visible par toi seul.'+(d?' Le dernier : '+d.nom+'.':''),n+' succès']; }
  // le géranium, sur l'appui
  const st=e.plante&&e.plante.stade;
  if(voirG&&st&&G.plante&&G.plante[st-1]){ const p=G.plante[st-1], b=p.boite;
    R.appui+=ombreAppui(p,pc,W,H)+img(p.images.midi,'fb-plante'+neuf('plante:'+st)+teintePeinte(moment,'g'),boite(b));
    zones.push(['plante',b[0],b[1],b[2],b[3],'personnalisation.html#objets']);
    const n=e.semaines.length;
    R.bulles.plante=()=>['Le géranium · ta régularité','Il pousse avec tes semaines de travail : deux jours dans la semaine où tu as répondu à quelque chose. Il ne perd jamais ce qu\'il a pris.',n+' semaine'+(n>1?'s':'')+' de travail']; }
  // les instruments, sur l'appui, chacun à sa place
  if(voirG&&G.instruments) Object.keys(G.instruments).forEach(k=>{ const g=e.instruments[k], p=G.instruments[k]; if(!g||!p) return; const b=p.boite, i=INSTRUMENTS[k]||['','',''];
    R.appui+=ombreAppui(p,pc,W,H)+img(p.images.midi,'fb-instrument'+neuf('instrument:'+k)+teintePeinte(moment,'g'),boite(b));
    zones.push(['instrument-'+k,b[0],b[1],b[2],b[3],'personnalisation.html#objets']);
    const c=chapitreCatalogue(g.ch);
    R.bulles['instrument-'+k]=()=>[i[1]+' · '+i[2],'Ton premier défi de labo réussi dans cette matière'+(g.date?', le '+date(g.date):'')+'.',c?'« '+c.chapitre.titre+' »':'']; });
  R.touches='<div class="fb-touches" aria-hidden="true">'+zones.map(z=>'<a class="fb-touche" tabindex="-1" data-gagne="'+z[0]+'" href="'+lien(z[5])+'" style="'+boite([z[1],z[2],z[3],z[4]])+';--h:'+pc(z[4],H)+'"></a>').join('')+'</div>';
  return R; }
/* la caresse du compagnon (27 octobre, demande du professeur) : un son doux et bref, joué par
   musique.js (Musique.caresse : un son par famille d'animal, réglé par le volume de la musique,
   muet pendant un contrôle blanc ou une vidéo), un petit mouvement et trois cœurs qui montent.
   Seulement au clic, jamais tout seul ; rien ne bouge sous « réduire les animations ». Ce n'est
   pas une récompense : rien ne se compte, rien ne change d'une caresse à l'autre. */
const PHRASES_COMPAGNON={ronron:'Caresse-le : il ronronne.',pepie:'Caresse-la : elle pépie.',gemit:'Caresse-le : il est tout content.',
  couine:'Caresse-le : il couine de plaisir.',grogne:'Caresse-le : il grogne tout doux.',pouic:'Appuie dessus : elle fait « pouic ».'};
function bulleCompagnon(P,k,dort){ const type=(window.Musique&&Musique.SONS_COMPAGNON||{})[k]||'ronron';
  return [((P.noms||{})[k]||'Ton compagnon')+' · ton compagnon', dort?'Il dort. Caresse-le doucement : il ronronne sans se réveiller.':PHRASES_COMPAGNON[type]||PHRASES_COMPAGNON.ronron,'Le son suit le volume de la musique']; }
function caresser(f,k){
  if(window.Musique&&Musique.caresse) Musique.caresse(k);
  const im=f.querySelector('.fb-compagnon'), t=f.querySelector('.fb-caresse'); if(!im||!t||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  im.classList.remove('fb-caresse-joue'); void im.offsetWidth; im.classList.add('fb-caresse-joue');
  clearTimeout(im._caresse); im._caresse=setTimeout(()=>im.classList.remove('fb-caresse-joue'),1500);
  [.3,.55,.78].forEach((x,i)=>{ const c=document.createElement('i'); c.className='fb-coeur'; c.setAttribute('aria-hidden','true');
    const v=k=>t.style.getPropertyValue(k);
    c.style.setProperty('--x','calc('+v('--x')+' + '+v('--l')+' * '+x+')'); c.style.setProperty('--y','calc('+v('--y')+' + '+v('--h')+' * .15)'); c.style.setProperty('--delai',(i*.2)+'s');
    t.parentNode.appendChild(c); setTimeout(()=>c.remove(),2400); }); }
/* l'ombre d'un objet posé sur l'appui de la fenêtre (comme celle du compagnon) */
function ombreAppui(p,pc,W,H){ const b=p.boite, c=p.contact||[b[2]*.2,b[2]*.8], l=c[1]-c[0];
  return '<i class="fb-ombre fb-ombre-c" style="--x:'+pc(b[0]+c[0]-l*.12,W)+';--l:'+pc(l*1.24,W)+';--y:'+pc(b[1]+p.appui[1],H)+'"></i>'; }
/* les objets dans les marges : leur point d'appui (le bas, au centre) à une place relative à
   la marge et à la profondeur du plateau, à l'échelle de la scène, sans jamais déborder sur
   la page. En mode « haut » (portable), la lampe et le pot seuls, au bord du plateau. */
function placerPeint(s,J,vw,vh,marge){
  const f=document.querySelector('.fond-bureau.fb-peint'); if(!f) return;
  const mode=document.body.dataset.fbObjets, P=vh-J;
  const base=s*Math.min(1,Math.max(.62,marge/330)), R=vw-marge/2, L=marge/2;
  const places={lampe:[R+marge*.04,J+.30*P],tasse:[R-marge*.10,J+.62*P],casque:[R+marge*.04,vh-.06*P],
                pot:[L+marge*.08,J+.27*P],livres:[L-marge*.02,J+.56*P],plante:[L+marge*.02,vh-.04*P]};
  f.querySelectorAll('.fb-objet').forEach(el=>{ const p=el._pose; if(!p) return;
    let k=Math.min(base,marge*.86/p.w), x, y;
    if(mode==='haut'){ const nom=el.dataset.objet;
      if(nom==='lampe'){ k=Math.min(s,150/p.h); x=vw-p.w*k/2-6; y=J+14; }
      else if(nom==='pot'){ k=Math.min(s,112/p.h); x=p.w*k/2+10; y=J+12;
        // sous la vitrine des succès, le pot descend un peu sur le plateau plutôt que de la cacher
        const v=f._vitrine; if(v){ const dy=(window.PACK_BUREAU.geometrie.decalage||0), ox=(vw-window.PACK_BUREAU.cadre[0]*s)/2, bas=(v[1]+v[3]-dy)*s, droite=ox+(v[0]+v[2])*s;
          if(x-p.w*k/2<droite) y=Math.max(y,bas+8+p.h*k); } }
      else return; }
    else { const q=places[el.dataset.objet]; if(!q) return; x=q[0]; y=q[1]; }
    const gx=x-p.ax*k, gy=y-p.ay*k;
    el.style.setProperty('--x',gx.toFixed(1)+'px'); el.style.setProperty('--y',gy.toFixed(1)+'px'); el.style.setProperty('--l',(p.w*k).toFixed(1)+'px');
    const l=el._lueur;
    if(l){ const r=l._pose.r*k; l.style.setProperty('--x',(gx+l._pose.x*k-r).toFixed(1)+'px'); l.style.setProperty('--y',(gy+l._pose.y*k-r).toFixed(1)+'px'); l.style.setProperty('--l',(2*r).toFixed(1)+'px'); } });
}
/* la mention du décor provisoire, au pied de chaque page tant que le bureau lofi est affiché */
function mentionDecor(oui){ const p=document.querySelector('footer.pied .in'); if(!p) return;
  let m=p.querySelector('.mention-decor');
  if(oui&&!m){ m=document.createElement('span'); m.className='mention-decor'; m.innerHTML='<a href="'+lien('aide.html#decor-provisoire')+'">Décor provisoire</a>, généré avec une IA'; p.appendChild(m); }
  if(!oui&&m) m.remove(); }
/* la nuit tombe avec le thème, le jour change avec l'heure : on repeint si le moment change */
function surveillerMoment(){ if(window._mpMomentEcoute) return; window._mpMomentEcoute=true;
  const verifier=()=>{ if(document.body.dataset.fond!=='bureau'||reglagesBureau().vue!=='peint'||!window.PACK_BUREAU) return;
    const f=document.querySelector('.fond-bureau.fb-peint'); if(!f||f.dataset.moment!==momentPeint(reglagesPeint())) monterPeint(); };
  new MutationObserver(verifier).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  setInterval(verifier,5*60e3); }

/* -- les info-bulles des objets-commandes : au survol (ou au clavier), ce que fait l'objet,
   puis son état du moment, relu à chaque affichage. Une seule bulle pour toute la page,
   posée du côté de l'écran où il y a la place. -- */
const BULLES={
  lampe:()=>document.documentElement.dataset.theme==='dark'
    ? ['La lampe · le thème','Éteins-la pour revenir au thème clair.','']
    : ['La lampe · le thème','Allume-la pour passer au thème sombre, plus doux le soir.',''],
  casque:()=>{ const e=document.querySelector('#pastille-musique .etat');
    return ['Le casque · la musique','Ouvre la musique de concentration : dix ambiances et le minuteur 25 / 5.',e&&e.textContent?e.textContent:'']; },
  tasse:()=>{ const e=document.querySelector('#pastille-pause .etat');
    return ['La tasse · la pause','Règle le rappel qui te propose une pause pendant que tu travailles.',e&&e.textContent?e.textContent:'']; },
  livres:()=>{ const id=lire('matiere-ouverte','maths'), m=(window.MATIERES||[]).find(x=>x.id===id);
    return ['Les cahiers · les portes d\'entrée','Mène aux portes d\'entrée'+(m?' de '+m.nom.toLowerCase():' de ta matière')+' : par chapitre, par thème, préparer un contrôle…','']; }
};
let bulleEl=null, bulleMinuteur=0;
function brancherBulle(el,nom){
  const montrer=()=>{ clearTimeout(bulleMinuteur); bulleMinuteur=setTimeout(()=>afficherBulle(el,nom),200); };
  const cacher=()=>{ clearTimeout(bulleMinuteur); if(bulleEl) bulleEl.classList.remove('visible'); };
  el.addEventListener('pointerenter',montrer); el.addEventListener('focus',montrer);
  el.addEventListener('pointerleave',cacher); el.addEventListener('blur',cacher);
  // après un clic, l'état a changé (lampe allumée, panneau ouvert) : la bulle se relit
  el.addEventListener('click',()=>{ cacher(); if(nom==='lampe'&&el.matches(':hover')) montrer(); });
}
function afficherBulle(el,nom){
  if(!bulleEl){ bulleEl=document.createElement('div'); bulleEl.className='fb-bulle'; bulleEl.id='fb-bulle'; bulleEl.setAttribute('role','tooltip'); document.body.appendChild(bulleEl); }
  const [titre,texte,etat]=(typeof nom==='function'?nom:BULLES[nom])();
  bulleEl.innerHTML='<strong>'+echap(titre)+'</strong>'+echap(texte)+(etat?'<span class="etat">'+echap(etat)+'</span>':'');
  el.setAttribute('aria-describedby','fb-bulle');
  const r=el.getBoundingClientRect(), b=bulleEl.getBoundingClientRect(), vw=innerWidth, vh=innerHeight;
  // l'objet est dans une marge : la bulle part vers le centre de l'écran
  const aGauche= r.left+r.width/2 > vw/2;
  const x= aGauche ? Math.max(8,r.left-b.width-14) : Math.min(vw-b.width-8,r.right+14);
  const centre=r.top+r.height/2, y=Math.min(vh-b.height-8,Math.max(8,centre-b.height/2));
  bulleEl.dataset.cote= aGauche?'gauche':'droite';
  bulleEl.style.setProperty('--x',Math.round(x)+'px'); bulleEl.style.setProperty('--y',Math.round(y)+'px');
  bulleEl.style.setProperty('--fleche',Math.round(Math.min(b.height-16,Math.max(10,centre-y-6)))+'px');
  bulleEl.classList.add('visible');
}
function mesurerFond(){
  const F=window.FOND_BUREAU, r=reglagesBureau(), peint=r.vue==='peint', P=window.PACK_BUREAU;
  // le bureau lofi : un cadre 2048 × 1152 (16/9), remonté de son décalage (le haut de l'arche
  // passe sous le bandeau) ; la page commence au bord du plateau
  const dec=P?(P.geometrie.decalage||0):40;
  const Gp= peint ? {jonction:(P?P.geometrie.jonction:465)-dec,largeur:P?P.cadre[0]:2048,hauteur:(P?P.cadre[1]:1152)-dec} : null;
  const G=Gp||(F&&F.vues[r.vue])||FOND_GEOMETRIE, largeur=Gp?Gp.largeur:(F||FOND_GEOMETRIE).largeur, hauteur=Gp?Gp.hauteur:(F||FOND_GEOMETRIE).hauteur;
  const vw=innerWidth, vh=innerHeight, st=document.documentElement.style;
  const boite=Math.min(vw,vh*(Gp?largeur/hauteur:1.42));   // la scène ne grossit pas avec un écran large
  const s=Math.max(boite/largeur,vh/hauteur);            // « slice » : le plus grand des deux rapports
  const ox=(vw-largeur*s)/2, jonction=G.jonction*s, fk=G.fk||.76;
  const bandeau=document.querySelector('.bandeau'); const hb=bandeau?bandeau.offsetHeight:58;
  const haut=Math.max(24,Math.round(jonction-hb-12));
  const bur=document.querySelector('.bureau'); const marge=bur?Math.max(0,(vw-bur.offsetWidth)/2+16):0;
  const k=Math.min(1,Math.max(.6,marge/320));
  st.setProperty('--fb-s',s.toFixed(4)); st.setProperty('--fb-ox',ox.toFixed(1)+'px'); st.setProperty('--fb-jonction',jonction.toFixed(1)+'px');
  st.setProperty('--fb-haut',haut+'px'); st.setProperty('--fb-marge',Math.round(marge)+'px'); st.setProperty('--fb-k',k.toFixed(3));
  // la fenêtre : le décor en arche (720×300, l'arche centrée en x=430) à l'échelle fk de la vue
  st.setProperty('--fb-fen-l',(ox+(640-430*fk)*s).toFixed(1)+'px'); st.setProperty('--fb-fen-t',((G.jonction-6-300*fk)*s).toFixed(1)+'px');
  st.setProperty('--fb-fen-w',(720*fk*s).toFixed(1)+'px'); st.setProperty('--fb-fen-h',(300*fk*s).toFixed(1)+'px');
  // les objets : dans les marges s'il y a la place ; sinon, sur un écran assez large, la lampe
  // et le pot seuls, debout au bord du plateau de part et d'autre de la fenêtre
  if(marge>=220) document.body.dataset.fbObjets='marges'; else if(vw>=1100) document.body.dataset.fbObjets='haut'; else delete document.body.dataset.fbObjets;
  if(largeur*s<vw-2) document.body.dataset.fbLarge=''; else delete document.body.dataset.fbLarge;
  if(peint) placerPeint(s,jonction,vw,vh,marge);
}
/* pour Personnalisation : relire les réglages et redessiner sur place */
function rafraichirBureau(maj){ if(maj) enregistrerBureau(maj); if(document.body.dataset.fond!=='bureau') return;
  if(reglagesBureau().vue==='peint'){ mesurerFond(); monterFond(); return; }
  chargerSvg(()=>{ appliquerBureau(); monterFond(); mesurerFond(); }); }

function decorHeure(){ const h=new Date().getHours(); return h<6?'ville':h<10?'montagne':h<18?'fenetre':h<21?'plage':'ville'; }
function decorSuivant(d){ if(d!=='heure') return; setInterval(()=>{ document.body.dataset.decor=decorHeure(); },60e3); }

/* -- ce qui se gagne : le mot qui l'accompagne, et le décor repeint (l'objet arrive en fondu) -- */
const INSTRUMENTS={maths:['📐','Un compas et une équerre','les mathématiques'],pc:['⚗️','Un ballon de chimie','la physique-chimie'],
  svt:['🔬','Un microscope','les SVT'],snt:['💾','Une carte électronique','la SNT']};
function messageGagne(g){
  if(g.quoi==='plante') return ['🪴',['','Une pousse sur l\'appui de ta fenêtre','Ta plante a grandi','Ton géranium est en fleurs'][g.stade]||'Ta plante a grandi',
    g.semaines+' semaine'+(g.semaines>1?'s':'')+' de travail. Elle ne perd jamais ce qu\'elle a pris.'];
  if(g.quoi==='livre') return ['📗','Un livre de plus sur ton étagère','« '+g.titre+' » : chapitre terminé.'];
  if(g.quoi==='instrument'){ const i=INSTRUMENTS[g.cle]; return i?[i[0],i[1]+' sur l\'appui de ta fenêtre','Ton premier défi de labo réussi en '+i[2]+'.']:null; }
  return null; }
function redessinerGagnes(){ if(document.body.dataset.fond==='bureau'&&reglagesBureau().vue==='peint'&&window.PACK_BUREAU&&document.querySelector('.fond-bureau.fb-peint')) monterPeint(); }

/* -- petit message en bas de l'écran (succès, pause) -- */
let toastEl=null;
const toastFile=[];   // deux messages à la fois (un succès et la plante qui pousse) : le second attend son tour
function toast(html,duree){ if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='toast'; toastEl.setAttribute('role','status'); document.body.appendChild(toastEl); }
  if(toastEl.classList.contains('visible')){ toastFile.push([html,duree]); return; }
  toastEl.innerHTML=html; toastEl.classList.add('visible'); clearTimeout(toastEl._t);
  toastEl._t=setTimeout(()=>{ toastEl.classList.remove('visible'); const n=toastFile.shift(); if(n) setTimeout(()=>toast(n[0],n[1]),450); },duree||6000); }

/* -- le rappel de pause : après 45 minutes, une carte, jamais un blocage -- */
function rappelDePause(ci){
  const el=ci.querySelector('#pastille-pause'); if(!el) return;
  const etat=el.querySelector('.etat'); const regl=lire('pause',{actif:true,minutes:45});
  if(!regl.actif){ etat.textContent='Rappel de pause coupé'; return; }
  let carte=null, repousse=0;
  function maj(){ const a=lire('activite',{minutes:0}); if(window.Musique&&Musique.minuteurActif&&Musique.minuteurActif()){ etat.textContent='Minuteur 25 / 5 en cours'; return; }
    const reste=Math.max(0,Math.round(regl.minutes+repousse-a.minutes)); etat.textContent= reste>0?'Pause dans '+reste+' min':'C\'est l\'heure d\'une pause';
    if(reste<=0&&!carte){ carte=document.createElement('div'); carte.className='carte-pause'; carte.setAttribute('role','dialog'); carte.setAttribute('aria-label','Rappel de pause');
      carte.innerHTML='<strong>Tu travailles depuis '+Math.round(a.minutes)+' minutes.</strong><p>Cinq minutes loin de l\'écran, et tu reviens plus efficace. Rien ne se perd.</p><div class="ligne"><button class="btn" type="button" data-pause>Je fais une pause</button><button class="btn fantome" type="button" data-encore>Encore 10 min</button></div>';
      document.body.appendChild(carte);
      carte.querySelector('[data-pause]').addEventListener('click',()=>{ Pupitre.pauseFaite(); repousse=0; carte.remove(); carte=null; toast('<span aria-hidden="true">☕</span><strong>Bonne pause.</strong><span>Lève-toi, regarde au loin, bois un verre d\'eau.</span>',8000); maj(); });
      carte.querySelector('[data-encore]').addEventListener('click',()=>{ repousse+=10; carte.remove(); carte=null; maj(); }); } }
  maj(); setInterval(maj,30e3);
  el.querySelector('button').addEventListener('click',()=>{ location.href=lien('personnalisation.html#pause'); });
}
function chargerMusique(){ const s=document.createElement('script'); s.src=urlScript('musique.js'); s.defer=true; document.head.appendChild(s); }

/* une session ouverte ou fermée sans changer de page (l'inscription) : le bandeau suit */
function rafraichirCompte(){ const b=document.querySelector('.bandeau'), d=b&&b.querySelector('details.compte'); if(!d) return;
  const role=document.body.dataset.role||'eleve', c=compteCourant(), se=b.querySelector('a.action.se-connecter');
  d.querySelector('.prenom').textContent=quiEstLa(role).court;
  const av=d.querySelector('summary svg'); if(av) av.outerHTML=avatarSVG(30);
  d.querySelector('.menu').outerHTML=menuCompte(role);
  if(c&&se) se.remove(); }
window.Bureau={coque,toast,rafraichirCompte,avatarSVG,avatarReglages,theme,lien:p=>lien(p),decorHeure,demoAction,
  bureau:{reglages:reglagesBureau,enregistrer:enregistrerBureau,rafraichir:rafraichirBureau,chargerAmbiances,DEFAUT:BUREAU_DEFAUT,
    chargerPack,chargerSvg,peint:{reglages:reglagesPeint,DEFAUT:PEINT_DEFAUT,moment:momentPeint,piece:piecePeinte,filtres:filtresPeint,teinte:teintePeinte,vue:vuePiece,ombre:ombrePiece,scene:scenePeinte,pieceScene,IMG:IMG_BUREAU}}};
})();
