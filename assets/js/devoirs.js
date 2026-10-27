/* =====================================================================
   LES DEVOIRS — ce qu'un professeur compose avec la banque d'exercices

   Une composition est une séance (une série à faire en classe ou en
   autonomie) ou un devoir maison (DM). Elle ne contient que des
   IDENTIFIANTS de fiches (« suites/calculer-des-termes ») et des réglages
   pris dans des listes fermées : pas un mot de texte libre, donc rien
   qu'un adulte puisse écrire à un élève. Son titre se compose tout seul
   (nature, chapitres, date), avec un intitulé facultatif pris dans une
   liste.

   Ce fichier est le modèle, partagé par tout ce qui touche à un devoir :
     banque-outil.js   l'outil du professeur (banque.html)
     fiches.js         le devoir de l'élève (devoir.html), la planche (planche.html)
     carnet.js         l'envoi « devoir » du carnet, et son rendu
     espaces.js        le formulaire du carnet, côté professeur
   Il est chargé avec carnet.js sur toutes les pages du bureau (site.js).

   Le lien d'un devoir porte la composition elle-même, et rien d'autre :
     devoir.html?v=1&n=dm&f=suites/calculer-des-termes,suites/de-proche-en-proche
                &a=1&c=apres&e=2026-11-04&b=4,6&i=revision
   n nature · f fiches, dans l'ordre · a coups de pouce (1/0) · c correction
   (immediate, apres, echeance) · e échéance · b barème d'un DM noté (sa
   présence dit que le DM est noté) · i intitulé. Aucun nom, aucune classe,
   aucun compte : n'importe qui peut l'ouvrir, et personne n'y apprend rien
   sur personne. Tout ce qui arrive par un lien est revalidé (normaliser).

   Sans serveur, les résultats ne remontent pas au professeur : l'élève
   garde les siens sur son appareil (clé « devoirs-faits »).
   ===================================================================== */
(function(){
"use strict";
const P=()=>window.Pupitre;
const echap=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- les listes fermées ---------- */
const NATURES=[['seance','Séance d\'exercices'],['dm','Devoir maison']];
const CORRECTIONS=[
  ['immediate','tout de suite','La correction est là dès le début, repliée.'],
  ['apres','après sa réponse','La correction s\'ouvre quand l\'élève dit avoir fini l\'exercice.'],
  ['echeance','après l\'échéance','La correction reste fermée jusqu\'à la date du devoir.']];
/* Les intitulés, pour qui veut mieux qu'« Séance d'exercices » : du contenu, à relire par le
   professeur avant d'en ajouter. Ils ne disent jamais rien d'un élève. */
const INTITULES=[
  ['revision','Révisions avant le contrôle'],
  ['gamme','Gamme d\'exercices'],
  ['planche','Planche de révision'],
  ['remise','Remise à niveau'],
  ['approfondir','Pour aller plus loin'],
  ['vacances','Pour les vacances'],
  ['examen','Entraînement à l\'examen']];
const MAX_FICHES=30, MAX_POINTS=40;
const RE_FICHE=/^[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9]+(-[a-z0-9]+)*$/;
const RE_DATE=/^\d{4}-\d{2}-\d{2}$/;
const libelle=(liste,cle)=>{ const x=liste.find(l=>l[0]===cle); return x?x[1]:''; };

/* ---------- une composition, toujours propre ----------
   Tout ce qui entre (formulaire, mémoire, lien) passe par ici : les valeurs inconnues
   tombent, les fiches en double aussi, le barème suit la liste des fiches. */
function normaliser(d){ d=d||{};
  const vues=new Set();
  const fiches=(Array.isArray(d.fiches)?d.fiches:[]).map(String).filter(f=>RE_FICHE.test(f)&&!vues.has(f)&&vues.add(f)).slice(0,MAX_FICHES);
  const nature=NATURES.some(n=>n[0]===d.nature)?d.nature:'seance';
  const echeance=RE_DATE.test(d.echeance||'')?d.echeance:'';
  let correction=CORRECTIONS.some(c=>c[0]===d.correction)?d.correction:'immediate';
  if(correction==='echeance'&&!echeance) correction='apres';
  const note= nature==='dm' && !!d.note;
  const points=v=>{ const n=Math.round(2*Number(String(v).replace(',','.')))/2; return isFinite(n)&&n>=0?Math.min(n,MAX_POINTS):0; };
  const bareme= note ? fiches.map((f,i)=>points((d.bareme||[])[i]||0)) : [];
  const intitule=INTITULES.some(t=>t[0]===d.intitule)?d.intitule:'';
  return {nature,fiches,aides:d.aides!==false,correction,echeance,note,bareme,intitule};
}

/* ---------- le titre : il se compose tout seul ---------- */
function chapitreDe(id){ return String(id).split('/')[0]; }
function chapitres(d){ const l=[]; (d.fiches||[]).forEach(f=>{ const c=chapitreDe(f); if(!l.includes(c)) l.push(c); }); return l; }
function nomChapitre(id){
  for(const m of (window.MATIERES||[])) for(const n of (m.niveaux||[])) for(const c of n.chapitres) if(c.id===id) return c.titre;
  return id; }
function natureLibelle(d){ return d.nature==='dm' ? (d.note?'Devoir maison noté':'Devoir maison') : libelle(NATURES,'seance'); }
function dateFr(iso,avecJour){ if(!iso) return ''; const [a,m,j]=iso.split('-').map(Number);
  return new Date(a,m-1,j).toLocaleDateString('fr-FR',avecJour?{weekday:'long',day:'numeric',month:'long'}:{day:'numeric',month:'long'}); }
function titreChapitres(d){ const cs=chapitres(d).map(nomChapitre);
  return cs.length<=2 ? cs.join(', ') : cs.slice(0,2).join(', ')+' et '+(cs.length-2)+' autre'+(cs.length>3?'s':''); }
/* « Devoir maison noté · Suites numériques · pour le mardi 4 novembre » ; sansNature : le titre
   d'une page qui dit déjà la nature au-dessus (« Suites numériques · pour le mardi 4 novembre ») */
function titre(d,sansNature){ d=normaliser(d);
  const tete=d.intitule?libelle(INTITULES,d.intitule):sansNature?'':natureLibelle(d);
  return [tete,titreChapitres(d)||'aucun exercice',d.echeance?'pour le '+dateFr(d.echeance,true):''].filter(Boolean).join(' · '); }

/* ---------- le lien ---------- */
function requete(d){ d=normaliser(d);
  const q=new URLSearchParams({v:'1',n:d.nature,f:d.fiches.join(','),a:d.aides?'1':'0',c:d.correction});
  if(d.echeance) q.set('e',d.echeance);
  if(d.note) q.set('b',d.bareme.map(String).join(','));
  if(d.intitule) q.set('i',d.intitule);
  return q.toString().replace(/%2F/gi,'/').replace(/%2C/gi,',');
}
function decoder(search){
  const q=new URLSearchParams(search==null?location.search:search);
  if(!q.get('f')) return null;
  const b=q.get('b');
  return normaliser({nature:q.get('n'),fiches:(q.get('f')||'').split(','),aides:q.get('a')!=='0',correction:q.get('c'),
    echeance:q.get('e')||'',note:b!=null,bareme:(b||'').split(','),intitule:q.get('i')||''});
}
/* le chemin d'un devoir depuis la racine du site (pour un lien dans la page) */
function chemin(d,page){ return (page||'devoir.html')+'?'+requete(d); }
/* le lien complet, à copier et à donner (le dossier du site, où qu'il soit servi) */
function lien(d,page){ const R=(window.Site&&window.Site.racine)||'';
  const base=location.href.split('?')[0].split('#')[0].replace(/[^/]*$/,'');
  return new URL(R+chemin(d,page),base).href; }

/* ---------- ce qu'on sait d'une composition grâce à l'index de la banque ---------- */
function fiche(id){ const B=window.BANQUE; return B&&B.fiches?B.fiches.find(f=>f.id===id)||null:null; }
function duree(d){ return (normaliser(d).fiches).reduce((s,id)=>{ const f=fiche(id); return s+(f?f.duree:0); },0); }
function total(d){ d=normaliser(d); return d.bareme.reduce((a,b)=>a+b,0); }
const minutes=m=>m>=60?Math.floor(m/60)+' h'+(m%60?' '+String(m%60).padStart(2,'0'):''):m+' min';
const nombre=n=>String(n).replace('.',',');
/* « 4 exercices · environ 55 min » */
function resume(d){ d=normaliser(d); const n=d.fiches.length, m=duree(d);
  return n+' exercice'+(n>1?'s':'')+(m?' · environ '+minutes(m):''); }
/* les réglages, dits à l'élève avec des mots simples */
function reglagesTexte(d){ d=normaliser(d);
  const cor={immediate:'tu peux l\'ouvrir quand tu veux, mais cherche d\'abord',apres:'elle s\'ouvre quand tu as fini l\'exercice',echeance:'elle s\'ouvrira '+(d.echeance?'le '+dateFr(d.echeance,true):'après l\'échéance')}[d.correction];
  return [['Coups de pouce',d.aides?'autorisés, dans l\'ordre, quand tu bloques':'pas pour ce devoir : cherche avec ton cours'],['Correction',cor]]; }

/* ---------- les compositions du professeur (une mémoire par compte) ---------- */
const CLE_COMP='compositions';
function compositions(){ const l=P()?P().lire(CLE_COMP,[]):[]; return Array.isArray(l)?l:[]; }
function enregistrer(c){ const l=compositions(); const auj=aujourdhui();
  const propre=Object.assign({id:c.id||'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),cree:c.cree||auj,maj:auj},normaliser(c));
  const i=l.findIndex(x=>x.id===propre.id); if(i>=0) l[i]=propre; else l.unshift(propre);
  if(P()) P().ecrire(CLE_COMP,l.slice(0,200)); return propre; }
function supprimer(id){ if(P()) P().ecrire(CLE_COMP,compositions().filter(x=>x.id!==id)); }
function composition(id){ return compositions().find(x=>x.id===id)||null; }
function dupliquer(id){ const c=composition(id); if(!c) return null; const x=Object.assign({},c); delete x.id; delete x.cree; return enregistrer(x); }

/* ---------- ce que l'élève garde de son devoir (sur son appareil seulement) ----------
   Une entrée par devoir (la clé vient du lien), et pour chaque fiche : les coups de pouce
   ouverts, « j'ai fini », la correction lue, et ce que l'élève dit lui-même de sa réussite.
   Jamais de note : la seule note possible est celle que le professeur donnera à un DM noté. */
const CLE_FAITS='devoirs-faits';
const BILANS=[['seul','Réussi seul'],['aide','Réussi avec un coup de pouce'],['pas-encore','Pas encore']];
function cle(d){ const s=requete(d); let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))>>>0; return 'd'+h.toString(36); }
function faits(){ const o=P()?P().lire(CLE_FAITS,{}):{}; return o&&typeof o==='object'?o:{}; }
function suivi(d){ return (faits()[cle(d)]||{fiches:{}}); }
function noter(d,id,patch){ const o=faits(), k=cle(d); const e=o[k]||{titre:titre(d),debut:aujourdhui(),fiches:{}};
  e.fiches[id]=Object.assign({},e.fiches[id]||{},patch); o[k]=e;
  const cles=Object.keys(o); if(cles.length>60) cles.slice(0,cles.length-60).forEach(x=>delete o[x]);
  if(P()) P().ecrire(CLE_FAITS,o); return e.fiches[id]; }

function aujourdhui(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function echeancePassee(d){ return !!d.echeance && aujourdhui()>=d.echeance; }

window.Devoirs={NATURES,CORRECTIONS,INTITULES,BILANS,MAX_FICHES,MAX_POINTS,
  normaliser,titre,natureLibelle,titreChapitres,chapitres,nomChapitre,dateFr,requete,decoder,chemin,lien,
  fiche,duree,total,resume,minutes,nombre,reglagesTexte,libelle,
  compositions,enregistrer,supprimer,composition,dupliquer,
  cle,suivi,noter,aujourdhui,echeancePassee,echap};
})();
