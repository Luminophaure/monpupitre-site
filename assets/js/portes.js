/* =====================================================================
   LES PAGES DU BUREAU DE L'ÉLÈVE
     index.html            le bureau : question du jour, semaine, autonomie
     matiere.html?m=maths  les sept portes d'entrée d'une matière
     apprendre.html        Apprendre à apprendre : les fiches de méthode
     aller-plus-loin.html  ressources extérieures validées
     aide.html             aide, tutoriels, « parler à quelqu'un »
     compte.html           Mon compte
     personnalisation.html décor, avatar, bureau personnel, musique, pause
   Chaque page déclare <body data-page="…"> ; site.js charge ce fichier
   et appelle Pages[nom]. Tout le contenu vient du catalogue
   (chapitres.js), de la carte des notions (notions.js) et de la mémoire
   locale (Pupitre). Rien n'est envoyé nulle part.
   ===================================================================== */
(function(){
"use strict";
const P=()=>window.Pupitre, S=()=>window.Site, B=()=>window.Bureau;
const echap=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const lien=p=>S().racine+p;
const matieres=()=>(window.MATIERES||[]).filter(m=>m.ouverte);
function chapitresPublies(m){ const l=[]; (m.niveaux||[]).forEach(n=>n.chapitres.forEach(c=>{ if(c.fichier) l.push(Object.assign({niveau:n.nom,niveauId:n.id},c)); })); return l; }
function tousLesChapitres(){ return matieres().flatMap(m=>chapitresPublies(m).map(c=>Object.assign({matiere:m},c))); }

/* --- le manifeste des labos et des générateurs : ce que contiennent les chapitres publiés --- */
const LABOS={
  'calcul-litteral-4':[['motifs','Les motifs qui grandissent'],['programme','Les programmes de calcul'],['forfaits','Quel tarif choisir ?'],['rectangles','La distributivité en rectangles'],['egalites','Vrai pour tous les nombres ?']],
  'vecteurs':[['egalite','Vecteurs égaux et translation'],['somme','Reconstituer une somme'],['chemin','Le chemin de Chasles'],['produit','Multiplier un vecteur par un nombre']],
  'espace-vecteurs':[['droites','Deux droites dans l\'espace'],['coplanaires','Coplanaires ou base ?'],['parametre','La droite en marche'],['droitePlan','Une droite et un plan']],
  'limites-comp':[['microscope','Le microscope à limites'],['geometrique','Le curseur q'],['infini','Le zoom vers l\'infini'],['machine','La machine des opérations'],['dominant','Qui domine ?'],['gendarmes','Les gendarmes']],
  'fonctions':[['machine','La machine à nombres'],['courbe','Lire sur la courbe'],['trois','Formule, tableau, courbe : la même fonction']],
  'diffraction-interferences':[['diffraction','La diffraction dans la cuve à ondes'],['mesure','TP : mesurer λ par diffraction'],['superposition','Deux ondes qui s\'ajoutent'],['cuve','Interférences dans la cuve'],['young','Les fentes d\'Young']],
  'electricite-habitat':[['oscillo','L\'oscilloscope branché sur le secteur'],['tableau','Le tableau électrique et le disjoncteur'],['fuite','Défaut d\'isolement : la terre et le différentiel']],
  'infrarouges':[['spectre','Le spectre électromagnétique'],['wien','Chaud, plus chaud : la loi de Wien'],['camera','La caméra thermique']],
  'solutions-ph':[['dissolution','Préparer une solution par dissolution'],['dilution','Diluer sans se tromper'],['ph','L\'échelle de pH'],['securite','Étiquettes, pictogrammes et mélanges']],
};
const GENERATEURS={'calcul-litteral-4':'litteral','vecteurs':'vecteurs','espace-vecteurs':'espace','limites-comp':'limites','fonctions':'fonctions','diffraction-interferences':'ondes','electricite-habitat':'electricite','infrarouges':'infrarouges','solutions-ph':'solutions'};
const THEMES={
  maths:[['Calculer avec des lettres','réduire, développer, factoriser, prouver',['calcul-litteral-4','calcul']],['Résoudre une équation','du premier degré, puis f(x) = k',['equations-4','fonctions','equations']],['Lire et tracer une courbe','image, antécédent, tableau de valeurs',['fonctions','variations']],['Modéliser une situation','traduire un énoncé en formule',['calcul-litteral-4','fonctions','limites-comp']],['Vecteurs et géométrie','translation, somme, colinéarité, espace',['vecteurs','vecteurs-coord','espace-vecteurs']],['Calculer une limite','opérations, comparaison, gendarmes',['limites-comp','limites']]],
  'physique-chimie':[['Mesurer et estimer une incertitude','un TP, des relevés, une régression',['diffraction-interferences']],['Les ondes','période, longueur d\'onde, spectre, diffraction, interférences',['son','ondes-1','infrarouges','diffraction-interferences']],['Exploiter un schéma ou un graphique','montage, oscillogramme, courbe',['electricite-habitat','infrarouges','diffraction-interferences','lumiere']],['Calculer avec des unités','concentrations, conversions, puissances de 10',['solutions-ph','infrarouges','electricite-habitat']],['Sécurité et prévention','pictogrammes, risques, protections',['solutions-ph','electricite-habitat','oxydoreduction']]],
};

/* ---------- 0. Le bureau : index.html ---------- */
function Index(body){
  const p=P(), m=body.querySelector('#bureau'); if(!m) return;
  const prenom=p.ELEVE.prenom, h=new Date().getHours(), salut= h<5?'Bonne nuit':h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir';
  // la scène : titre + avatar
  const tete=body.querySelector('.accueil-tete .in'); if(tete) tete.innerHTML='<span class="surtitre">Mon bureau</span><h1>'+salut+', '+echap(prenom)+'.</h1><p>'+echap((window.SITE||{}).accroche||'')+' Ici, tu cherches d\'abord seul ; l\'aide est là quand tu bloques.</p>';
  if(!p.masque('decor')&&!p.masque('avatar')){ const sc=body.querySelector('.accueil-tete'); const a=document.createElement('div'); a.className='avatar-scene'; const js=p.joursSemaine().filter(j=>j.actif).length; a.innerHTML=B().avatarSVG(96)+'<span class="legende">'+js+' jour'+(js>1?'s':'')+' actif'+(js>1?'s':'')+' cette semaine</span>'; sc.appendChild(a); }
  if(p.masque('decor')) body.classList.add('sans-decor');
  const d=p.dernierePage(); const auto=p.autonomie(); const succes=p.succes.dernier(); const jours=p.joursSemaine();
  const cartes=[];
  // reprendre
  if(d) cartes.push('<a class="reprendre" href="'+lien(d.url)+'"><small>Reprendre où j\'en étais</small><strong>'+echap(d.titre)+'</strong><span>'+echap(d.sous||'')+'</span></a>');
  else cartes.push('<a class="reprendre" href="'+lien('maths/seconde/fonctions.html')+'"><small>Commencer</small><strong>Notion de fonction</strong><span>Mathématiques · Seconde · le chapitre en cours en classe</span></a>');
  // la semaine
  cartes.push('<div class="carte"><span class="surtitre">Ta semaine</span><div class="semaine">'+jours.map(j=>'<span class="jour'+(j.actif?' actif':'')+(j.futur?' futur':'')+'" title="'+j.date+'"><i></i>'+j.jour+'</span>').join('')+'</div><p>'+(jours.filter(j=>j.actif).length?'<strong>'+jours.filter(j=>j.actif).length+' jour'+(jours.filter(j=>j.actif).length>1?'s':'')+' actif'+(jours.filter(j=>j.actif).length>1?'s':'')+'</strong> cette semaine. Un jour manqué ne fait rien perdre.':'Première visite cette semaine. Un point par jour travaillé, sans série à tenir.')+'</p>'+
    (!p.masque('succes')&&succes?'<div class="succes-carte"><span class="medaille" aria-hidden="true">🏅</span><div><strong>Dernier succès : '+echap(succes.nom)+'</strong><div class="discret">'+echap(succes.txt)+'</div></div></div>':'')+'</div>');
  // autonomie
  if(!p.masque('stats')) cartes.push('<div class="carte"><span class="surtitre">Ton autonomie cette semaine</span>'+(auto.total?'<div class="autonomie-chiffre"><b>'+auto.taux+' %</b><span>d\'exercices guidés réussis sans aide ('+auto.sans+' sur '+auto.total+')</span></div><div class="jauge"><i style="--p:'+auto.taux+'%"></i></div><p class="tendance '+(auto.precedent==null?'':auto.taux>=auto.precedent?'plus':'moins')+'">'+(auto.precedent==null?'Comparé à toi-même, jamais aux autres : la semaine prochaine, tu verras ton écart.':(auto.taux>=auto.precedent?'+':'')+(auto.taux-auto.precedent)+' points par rapport à la semaine dernière ('+auto.precedent+' %). Comparé à toi-même, jamais aux autres.')+'</p>':'<p>Pas encore d\'exercice guidé cette semaine. L\'indicateur compte la réussite <strong>sans aide</strong> : c\'est lui qui montre que tu progresses.</p><p><a class="btn" href="'+lien('maths/seconde/fonctions.html#exercices')+'">Faire un exercice guidé</a></p>')+'</div>');
  // le carnet des professeurs : un résumé, la page complète est carnet.html
  if(!p.masque('carnet')&&window.Carnet){ const C=window.Carnet, rub=C.tout();
    if(!rub.length) cartes.push('<div class="carte carte-carnet vide"><span class="surtitre">Carnet des professeurs</span><p>Tu travailles seul pour l\'instant — c\'est très bien ainsi. Si un professeur te donne un lien de classe, ce qu\'il te propose arrivera ici.</p><p><a href="'+lien('carnet.html')+'">Comment ça marche</a></p></div>');
    else { // la prochaine échéance d'abord, puis les envois les plus récents
      const plats=rub.flatMap(r=>r.items.map(i=>Object.assign({prof:r.prof},i)));
      const prochaine=C.echeancesAVenir()[0];
      const recents=plats.filter(i=>i.type!=='echeance').sort((x,y)=>(y.date||'').localeCompare(x.date||''));
      const derniers=(prochaine?[prochaine]:[]).concat(recents).slice(0,3);
      cartes.push('<div class="carte carte-carnet"><span class="surtitre">Carnet des professeurs</span><ul class="carnet-liste compacte">'+derniers.map(i=>{ const u=C.lienCible(i); const l=echap(C.libelleCible(i)); return '<li class="carnet-item type-'+echap(i.type)+(C.faits().has(i.id)?' fait':'')+'"><span class="ico" aria-hidden="true">'+C.ICONES[i.type]+'</span><div class="corps"><span class="etiq">'+echap(i.prof.prof)+' · '+echap(C.TYPES[i.type])+'</span>'+(u?'<a href="'+echap(u)+'">'+l+'</a>':'<span>'+l+'</span>')+(i.type==='echeance'?'<span class="meta"><b class="quand">'+echap(C.dateFr(i.echeance,true))+'</b></span>':'')+'</div></li>'; }).join('')+'</ul><p><a href="'+lien('carnet.html')+'">Tout le carnet</a> · '+rub.length+' professeur'+(rub.length>1?'s':'')+'</p></div>'); } }
  m.innerHTML='<div class="cartes-bureau">'+cartes.join('')+'</div>'+
    '<section class="pile"><h2>Comment veux-tu avancer aujourd\'hui ?</h2><p class="discret">Choisis une matière : ses portes d\'entrée (par chapitre, par thème, pour un contrôle, pour l\'examen, par la méthode, par la carte des notions, par les labos) mènent toutes au même contenu. Choisir son chemin fait partie de l\'autonomie.</p>'+
    '<div class="matieres-bureau">'+matieres().filter(mm=>{ const s=p.lire('matieres-suivies',null); return !s||s.includes(mm.id); }).map(mm=>{ const cs=chapitresPublies(mm); const pcs=cs.map(c=>p.pourcentage(c.id)); const enCours=cs.filter((c,i)=>pcs[i]>0&&pcs[i]<100).length;
      return '<a class="matiere-mini" data-couleur="'+echap(mm.couleur||'neutre')+'" href="'+lien('matiere.html?m='+encodeURIComponent(mm.id))+'"><strong>'+echap(mm.nom)+'</strong><span class="discret">'+cs.length+' chapitre'+(cs.length>1?'s':'')+' en ligne'+(enCours?' · '+enCours+' en cours':'')+'</span></a>'; }).join('')+'</div></section>'+
    (p.masque('decor')||!window.Carnet||!window.Carnet.echeancesAVenir().length?'':(()=>{ const C=window.Carnet, e=C.echeancesAVenir()[0]; return '<div class="post-it">'+echap(C.libelleCible(e))+' · '+echap(C.dateFr(e.echeance,true))+'.<small>— '+echap(e.prof.prof)+', carnet des professeurs</small></div>'; })())+
    '<p class="note-proto discret">Prototype : ce bureau se remplit avec ton vrai travail dans les chapitres, gardé dans ce navigateur. '+(p.demo.active()?'Il affiche en ce moment une démonstration (deux semaines de travail fictif). <a href="#" data-demo="effacer">Effacer la démo</a> pour repartir de zéro.':'Pour le voir déjà rempli, <a href="#" data-demo="charger">charge une démo</a> : deux semaines de travail fictif, effaçables en un clic.')+'</p>';
  m.addEventListener('click',e=>{ const d=e.target.closest('[data-demo]'); if(d){ e.preventDefault(); B().demoAction(d.dataset.demo); } });
}

/* ---------- 1. Les portes d'entrée d'une matière ---------- */
const PORTES=[
  ['chapitre','📚','Par chapitre','suivre le programme dans l\'ordre'],
  ['theme','🧩','Par thème d\'exercice','un savoir-faire qui revient partout'],
  ['controle','📝','Préparer un contrôle','un contrôle annoncé'],
  ['examen','🎓','Préparer l\'examen','une épreuve nationale'],
  ['methode','💡','Méthodologie','ne pas savoir par où commencer'],
  ['carte','🗺','Carte des notions','comprendre ce qui mène à quoi'],
  ['labos','🔬','Labos et jeux','manipuler, s\'entraîner vite'],
];
async function Matiere(body){
  try{ await S().charger(S().racine+'assets/js/notions.js'); }catch(e){}
  const p=P(), info=S().info, m=info&&info.matiere, cont=body.querySelector('#page-matiere'); if(!m||!cont) return;
  const cs=chapitresPublies(m); const enCours=cs.find(c=>p.pourcentage(c.id)>0&&p.pourcentage(c.id)<100)||cs[0];
  const etats={chapitre: enCours?echap(enCours.titre)+' · '+p.pourcentage(enCours.id)+' %':cs.length+' chapitres',
    theme:(THEMES[m.id]||[]).length?(THEMES[m.id].length+' thèmes'):'à venir',
    controle: m.id==='maths'?'DS vendredi · plan de révision prêt':'aucun contrôle annoncé',
    examen: m.id==='maths'?'bac et épreuve anticipée':'à venir',
    methode:'6 fiches courtes', carte:(window.NOTIONS&&window.NOTIONS[m.id])?(window.NOTIONS[m.id].notions.length+' notions'):'à venir',
    labos:cs.reduce((n,c)=>n+(LABOS[c.id]||[]).length,0)+' labos · '+cs.filter(c=>GENERATEURS[c.id]).length+' jeux'};
  cont.innerHTML='<section class="accueil-tete gutter"><div class="in"><span class="surtitre">'+echap(m.nomLong||m.nom)+'</span><h1>Comment veux-tu avancer aujourd\'hui ?</h1><p>Toutes les portes mènent au même contenu de <strong>'+echap(m.nom.toLowerCase()==='svt'||m.nom.toLowerCase()==='snt'?m.nom:m.nom.toLowerCase())+'</strong>. Choisir son chemin fait partie de l\'autonomie.</p></div></section>'+
    '<div class="bureau-eleve"><nav class="portes" aria-label="Portes d\'entrée">'+PORTES.filter(x=>!p.masque('porte-'+x[0])).map(x=>'<button type="button" class="porte" data-porte="'+x[0]+'"><span class="ico" aria-hidden="true">'+x[1]+'</span><strong>'+x[2]+'</strong><span class="pour">'+x[3]+'</span><span class="ou">'+etats[x[0]]+'</span></button>').join('')+'</nav><div class="porte-panneau" id="panneau" aria-live="polite"></div></div>';
  const panneau=cont.querySelector('#panneau');
  function ouvrir(id,sansAdresse){ cont.querySelectorAll('.porte').forEach(b=>b.setAttribute('aria-current',b.dataset.porte===id)); p.porte(m.id+':'+id);
    const f={chapitre:porteChapitre,theme:porteTheme,controle:porteControle,examen:porteExamen,methode:porteMethode,carte:porteCarte,labos:porteLabos}[id]; panneau.innerHTML=''; if(f) f(panneau,m,cs); S().maths(panneau);
    if(!sansAdresse){ try{ history.replaceState(null,'','#'+id); }catch(e){} } }
  cont.addEventListener('click',e=>{ const b=e.target.closest('.porte'); if(b){ ouvrir(b.dataset.porte); panneau.scrollIntoView({block:'start',behavior:'smooth'}); } });
  const depart=location.hash.slice(1); ouvrir(PORTES.some(x=>x[0]===depart)?depart:'chapitre',true);
  addEventListener('hashchange',()=>{ const h=location.hash.slice(1); if(PORTES.some(x=>x[0]===h)) ouvrir(h,true); });
}
function porteChapitre(el,m,cs){ const p=P();
  el.innerHTML='<h2><span class="ico" aria-hidden="true">📚</span>Par chapitre</h2><p class="discret">Le programme dans l\'ordre. La barre montre ton parcours dans chaque chapitre.</p><div class="niveaux" style="padding:0;max-width:none;margin:0;width:100%">'+(m.niveaux||[]).map(n=>{ const pub=n.chapitres.filter(c=>c.fichier).length;
    return '<div class="niveau-col"><h2>'+echap(n.nom)+' <span class="compteur-niveau">'+pub+' / '+n.chapitres.length+' en ligne</span></h2>'+n.chapitres.map((c,i)=> c.fichier
      ? '<a class="chap-lien" href="'+lien(c.fichier)+'"><span class="n">'+(i+1)+'</span><span>'+echap(c.titre)+(p.pourcentage(c.id)?'<span class="jauge" style="margin-top:6px;max-width:160px"><i style="--p:'+p.pourcentage(c.id)+'%"></i></span>':'')+'</span><span class="etat">'+(p.pourcentage(c.id)?p.pourcentage(c.id)+' %':'ouvrir →')+'</span></a>'
      : '<span class="chap-lien a-venir"><span class="n">'+(i+1)+'</span><span>'+echap(c.titre)+'</span><span class="etat">à venir</span></span>').join('')+'</div>'; }).join('')+'</div>'; }
function porteTheme(el,m,cs){ const th=THEMES[m.id]||[]; const tous=tousLesChapitres();
  el.innerHTML='<h2><span class="ico" aria-hidden="true">🧩</span>Par thème d\'exercice</h2><p class="discret">Un même savoir-faire traverse plusieurs chapitres. Chaque thème rassemble les exercices qui le travaillent, avec leurs étiquettes (difficulté ★ à ★★★, type, durée). <em>Prototype : les étiquettes détaillées arrivent avec la base d\'exercices.</em></p>'+
    (th.length?'<div class="themes">'+th.map(t=>{ const liens=t[2].map(id=>tous.find(c=>c.id===id)).filter(Boolean); const avenir=t[2].length-liens.length;
      return '<div class="theme-carte"><strong>'+echap(t[0])+'</strong><span class="discret">'+echap(t[1])+'</span><div class="liens">'+liens.map(c=>'<a href="'+lien(c.fichier)+'#exercices">'+echap(c.titre)+' <small>('+echap(c.niveau)+')</small></a>').join('')+(avenir?'<span class="discret">+ '+avenir+' chapitre'+(avenir>1?'s':'')+' à venir</span>':'')+'</div></div>'; }).join('')+'</div>':'<p>Les thèmes de cette matière arrivent avec ses premiers chapitres.</p>'); }
function porteControle(el,m,cs){ const p=P();
  const plan=p.lire('plan:'+m.id,null)||[{t:'Relire la fiche « image et antécédent » (cours, partie 2)',d:'10 min',u:'maths/seconde/fonctions.html#cours'},{t:'Refaire deux exercices guidés d\'antécédent avec le tuteur',d:'20 min',u:'maths/seconde/fonctions.html#exercices'},{t:'Manipuler le labo « Reconstituer une somme »',d:'10 min',u:'maths/seconde/vecteurs.html#explorer'},{t:'Contrôle blanc en conditions réelles',d:'30 min',u:'#fabrique'}].map(x=>Object.assign({fait:false},x));
  const notions=[['Image et antécédent','fonctions'],['Lire une courbe','fonctions'],['Résoudre f(x) = k','fonctions'],['Somme de vecteurs','vecteurs'],['Produit par un réel','vecteurs']];
  const exos=p.lire('exos',[]).filter(x=>x.erreurs>0).slice(-4);
  const annonce=(()=>{ if(!window.Carnet) return ''; const C=window.Carnet; const e=C.echeancesAVenir().find(x=>x.prof.matiere===m.id);
    return e ? '<div class="carte"><span class="surtitre">Échéance annoncée</span><h3>'+echap(C.libelleCible(e))+'</h3><p>'+echap(C.dateFr(e.echeance,true))+' · '+echap(C.dansCombien(e.echeance))+' · annoncé par '+echap(e.prof.prof)+' dans ton <a href="'+lien('carnet.html')+'">carnet des professeurs</a>.</p></div>'
             : '<div class="carte"><span class="surtitre">Aucune échéance annoncée</span><p>Aucun professeur n\'a annoncé de contrôle en '+echap(m.nom.toLowerCase())+'. Tu peux préparer le tien avec le plan ci-dessous et la fabrique.</p></div>'; })();
  el.innerHTML='<h2><span class="ico" aria-hidden="true">📝</span>Préparer un contrôle</h2>'+(m.id==='maths'?
    annonce+
    '<div class="colonnes"><div class="carte"><h3>Les notions qui tombent</h3><ul class="tendances">'+notions.map(n=>{ const pc=p.pourcentage(n[1]); const etat=pc>=60?['maîtrisée','ok']:pc>0?['en cours','moyen']:['pas commencée','ko']; return '<li><span>'+n[0]+'</span><span class="jauge"><i style="--p:'+pc+'%"></i></span><span class="'+etat[1]+'" style="font:600 var(--t-xs) var(--f-mono)">'+etat[0]+'</span></li>'; }).join('')+'</ul></div>'+
    '<div class="carte"><h3>Plan de révision <span class="discret">(modifiable)</span></h3><ul class="plan">'+plan.map((x,i)=>'<li class="'+(x.fait?'fait':'')+'"><input type="checkbox" data-plan="'+i+'" '+(x.fait?'checked':'')+' aria-label="Fait"><span>'+(x.u&&x.u!=='#fabrique'?'<a href="'+lien(x.u)+'">'+echap(x.t)+'</a>':echap(x.t))+'</span><span class="duree">'+echap(x.d)+'</span></li>').join('')+'</ul><form class="ligne" data-ajout><input type="text" placeholder="Ajouter une étape…" aria-label="Nouvelle étape" style="flex:1;min-width:0;height:40px;border:2px solid var(--line);border-radius:var(--r-m);padding:0 10px;background:var(--feuille);color:var(--ink)"><button class="btn fantome" type="submit">Ajouter</button></form></div></div>'+
    (exos.length?'<div class="carte"><h3>Les erreurs à revoir</h3><p class="discret">Tes derniers exercices guidés où tu as corrigé une erreur en route : refais-les sans aide.</p><ul class="tendances">'+exos.map(x=>'<li><span>'+echap(x.chapitre)+' · '+echap(x.id)+'</span><span></span><span class="discret">'+x.erreurs+' erreur'+(x.erreurs>1?'s':'')+' · aide '+x.aide+'</span></li>').join('')+'</ul></div>':''):'<p>Aucun contrôle annoncé dans cette matière. Tu peux quand même fabriquer un entraînement ci-dessous.</p>')+
    '<div class="carte" id="fabrique"><span class="surtitre">Fabrique ton entraînement</span><h3>Un sujet sur mesure</h3>'+fabriqueHTML(cs)+'</div>';
  el.addEventListener('change',e=>{ const c=e.target.closest('[data-plan]'); if(c){ plan[+c.dataset.plan].fait=c.checked; c.closest('li').classList.toggle('fait',c.checked); p.ecrire('plan:'+m.id,plan); } });
  const f=el.querySelector('[data-ajout]'); if(f) f.addEventListener('submit',e=>{ e.preventDefault(); const v=f.querySelector('input').value.trim(); if(!v) return; plan.push({t:v,d:'',fait:false}); p.ecrire('plan:'+m.id,plan); porteControle(el,m,cs); });
  brancherFabrique(el,cs); }
function fabriqueHTML(cs){ const avec=cs.filter(c=>GENERATEURS[c.id]);
  return '<form class="fabrique"><fieldset><legend>Chapitres</legend><div class="choix-chapitres">'+avec.map((c,i)=>'<label class="case"><input type="checkbox" name="ch" value="'+c.id+'" '+(i<2?'checked':'')+'>'+echap(c.titre)+' <small class="discret">('+echap(c.niveau)+')</small></label>').join('')+'</div></fieldset>'+
    '<div class="colonnes"><fieldset><legend>Durée</legend><div class="bascule" role="group">'+[15,30,45,60].map((d,i)=>'<button type="button" data-duree="'+d+'" aria-pressed="'+(i===0)+'">'+d+' min</button>').join('')+'</div></fieldset>'+
    '<fieldset><legend>Conditions</legend><label class="interrupteur"><input type="checkbox" name="reel" checked><span class="piste" aria-hidden="true"></span>Conditions réelles : chrono, sans indice ni correction avant la fin, musique coupée</label></fieldset></div>'+
    '<div><button class="btn" type="submit">Générer mon sujet</button></div></form><div class="sujet"></div>'; }
function brancherFabrique(el,cs){ const f=el.querySelector('.fabrique'); if(!f) return; let duree=15;
  f.addEventListener('click',e=>{ const b=e.target.closest('[data-duree]'); if(!b) return; duree=+b.dataset.duree; f.querySelectorAll('[data-duree]').forEach(x=>x.setAttribute('aria-pressed',x===b)); });
  f.addEventListener('submit',async e=>{ e.preventDefault(); const ids=[...f.querySelectorAll('input[name=ch]:checked')].map(x=>x.value); if(!ids.length){ el.querySelector('.sujet').innerHTML='<p class="retour mauvais">Choisis au moins un chapitre.</p>'; return; }
    const gens=[...new Set(ids.map(id=>GENERATEURS[id]))]; const reel=f.querySelector('input[name=reel]').checked; const n=Math.max(6,Math.round(duree/1.5));
    const zone=el.querySelector('.sujet'); zone.innerHTML='<p class="discret">Préparation du sujet…</p>';
    try{ await S().charger(S().racine+'assets/js/graphe.js'); await S().charger(S().racine+'assets/js/quiz.js'); for(const g of gens) await S().charger(S().racine+'assets/js/generateurs/'+g+'.js'); }catch(err){ zone.innerHTML='<p class="retour mauvais">Impossible de charger les générateurs.</p>'; return; }
    zone.innerHTML=''; const j=document.createElement('div'); j.className='jeu'; j.dataset.generateurs=gens.join(' '); j.dataset.questions=String(n); j.dataset.titre=(reel?'Contrôle blanc':'Entraînement')+' · '+duree+' min'; if(reel){ j.dataset.mode='controle'; j.dataset.minutes=String(duree); }
    zone.appendChild(j); if(window.Graphe) Graphe.init(zone); Quiz.init(zone); j.scrollIntoView({block:'start',behavior:'smooth'}); }); }
function porteExamen(el,m,cs){
  el.innerHTML='<h2><span class="ico" aria-hidden="true">🎓</span>Préparer l\'examen</h2><p class="discret">Les sujets officiels ne sont pas recopiés : la plateforme renvoie vers les sources, et propose ses propres sujets d\'entraînement, construits sur les mêmes exercices que les chapitres.</p>'+
    (m.id==='maths'?'<div class="examen-cartes"><div class="carte"><span class="surtitre">Première</span><h3>Épreuve anticipée de mathématiques</h3><p>Les compétences attendues, chapitre par chapitre, et des sujets blancs chronométrés. <em>Contenu à venir avec les chapitres de première.</em></p></div><div class="carte"><span class="surtitre">Terminale</span><h3>Bac · spécialité mathématiques</h3><p>Deux chapitres déjà prototypés : <a href="'+lien('maths/terminale/vecteurs-droites-plans.html')+'">vecteurs, droites et plans de l\'espace</a> et <a href="'+lien('maths/terminale-comp/limites.html')+'">limites</a>. Les sujets d\'entraînement se fabriquent dans « Préparer un contrôle ».</p></div><div class="carte"><span class="surtitre">Terminale</span><h3>Grand oral</h3><p>Choisir une question, construire un plan, s\'entraîner à parler : fiches de méthode à venir dans « Apprendre à apprendre ».</p></div></div>':
     m.id==='physique-chimie'?'<div class="examen-cartes"><div class="carte"><span class="surtitre">Terminale</span><h3>Bac · spécialité physique-chimie</h3><p>Le chapitre <a href="'+lien('physique-chimie/terminale/diffraction-interferences.html')+'">diffraction et interférences</a> est prototypé, avec un TP de mesure. Les autres chapitres arrivent.</p></div><div class="carte"><span class="surtitre">Première ST2S</span><h3>Physique-chimie pour la santé</h3><p>Évaluée en contrôle continu en première. Trois chapitres prototypés : <a href="'+lien('physique-chimie/premiere-st2s/solutions-ph.html')+'">solutions et pH</a>, <a href="'+lien('physique-chimie/premiere-st2s/electricite-habitat.html')+'">électricité dans l\'habitat</a>, <a href="'+lien('physique-chimie/premiere-st2s/infrarouges.html')+'">infrarouges</a>. Les contrôles blancs se fabriquent dans « Préparer un contrôle ».</p></div></div>':'<p>Cette matière n\'a pas encore de porte « examen ».</p>'); }
function porteMethode(el){
  el.innerHTML='<h2><span class="ico" aria-hidden="true">💡</span>Méthodologie</h2><p class="discret">Des fiches courtes : une méthode par fiche, son format, sa durée, un exercice d\'application à la fin.</p><div class="colonnes">'+FICHES.map(f=>'<a class="fiche-metho" href="'+lien('apprendre.html#'+f.id)+'" style="text-decoration:none;color:inherit"><strong>'+echap(f.titre)+'</strong><span class="meta"><span>'+echap(f.format)+'</span><span>'+echap(f.duree)+'</span></span><span class="discret">'+echap(f.resume)+'</span></a>').join('')+'</div>'; }
function porteLabos(el,m,cs){ const tous=cs.filter(c=>LABOS[c.id]||GENERATEURS[c.id]);
  el.innerHTML='<h2><span class="ico" aria-hidden="true">🔬</span>Labos et jeux</h2><p class="discret">Tous les laboratoires et jeux de la matière, pour manipuler et s\'entraîner vite.</p>'+(tous.length?tous.map(c=>'<h3>'+echap(c.titre)+' <small class="discret">'+echap(c.niveau)+'</small></h3><div class="labos-liste">'+(LABOS[c.id]||[]).map(l=>'<a href="'+lien(c.fichier)+'#explorer"><strong>'+echap(l[1])+'</strong><small>laboratoire</small></a>').join('')+(GENERATEURS[c.id]?'<a href="'+lien(c.fichier)+'#entrainement"><strong>Le jeu du chapitre</strong><small>10 questions aléatoires, record gardé ici</small></a>':'')+'</div>').join(''):'<p>Les labos de cette matière arrivent avec ses premiers chapitres.</p>'); }

/* ---------- 2. La carte des notions ---------- */
function etatNotion(n){ const p=P(); const tous=tousLesChapitres(); const c=tous.find(x=>x.id===n.chapitre); if(!c) return 'neutre';
  const exos=p.lire('exos',[]).filter(x=>x.chapitre===n.chapitre); const pc=p.pourcentage(n.chapitre);
  if(exos.some(x=>x.erreurs>=2)&&pc<80) return 'revoir'; if(pc>=50||exos.some(x=>x.ok&&x.aide===0)) return 'maitrise'; if(pc>0) return 'encours'; return 'neutre'; }
function porteCarte(el,m){ const N=window.NOTIONS&&window.NOTIONS[m.id]; const p=P();
  if(!N){ el.innerHTML='<h2><span class="ico" aria-hidden="true">🗺</span>Carte des notions</h2><p>La carte de cette matière sera tracée avec ses premiers chapitres.</p>'; return; }
  const tous=tousLesChapitres(); const W=900, colW=210, rowH=96; const parRangee={}; N.notions.forEach(n=>{ (parRangee[n.niveau]=parRangee[n.niveau]||[]).push(n); });
  const pos={}; N.rangees.forEach((r,ri)=>{ (parRangee[r[0]]||[]).forEach((n,i)=>{ pos[n.id]={x:120+i*colW,y:40+ri*rowH}; }); });
  const H=40+N.rangees.length*rowH; const etats={}; N.notions.forEach(n=>etats[n.id]=etatNotion(n));
  const prochaine=N.notions.find(n=>etats[n.id]!=='maitrise'&&N.liens.filter(l=>l[1]===n.id).every(l=>etats[l[0]]==='maitrise'))||N.notions[0];
  const svg='<svg viewBox="0 0 '+Math.max(W,120+Math.max(...Object.values(parRangee).map(r=>r.length))*colW)+' '+H+'" role="img" aria-label="Carte des notions"><defs><marker id="fleche-notion" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>'+
    N.rangees.map((r,ri)=>'<text class="rangee-titre" x="12" y="'+(40+ri*rowH+34)+'">'+echap(r[1])+'</text>').join('')+
    N.liens.map(l=>{ const a=pos[l[0]],b=pos[l[1]]; if(!a||!b) return ''; const x1=a.x+90,y1=a.y+28,x2=b.x+90,y2=b.y+28; const dy=y2-y1; const c=dy===0?' L':' C'+(x1)+' '+(y1+40)+' '+(x2)+' '+(y2-40)+' '; return dy===0?'<path class="lien" d="M'+(x1+95)+' '+y1+' L'+(x2-95)+' '+y2+'"/>':'<path class="lien" d="M'+x1+' '+(y1+28)+c+x2+' '+(y2-30)+'"/>'; }).join('')+
    N.notions.map(n=>{ const q=pos[n.id]; return '<g class="notion '+etats[n.id]+(n.id===prochaine.id?' choisie':'')+'" data-notion="'+n.id+'" tabindex="0" role="button" aria-label="'+echap(n.nom)+'"><rect x="'+q.x+'" y="'+q.y+'" width="180" height="56" rx="14"/><text x="'+(q.x+90)+'" y="'+(q.y+33)+'" text-anchor="middle">'+echap(n.nom)+'</text></g>'; }).join('')+'</svg>';
  el.innerHTML='<h2><span class="ico" aria-hidden="true">🗺</span>Carte des notions · '+echap(m.nom)+'</h2><p class="discret">Les flèches « sert à comprendre » sont tracées à la main par le pédagogue, jamais générées. Les couleurs viennent de ton travail dans les chapitres.</p>'+
    '<div class="carte-notions"><div class="legende"><span><i style="background:var(--ok)"></i>maîtrisée</span><span><i style="background:var(--blue)"></i>en cours</span><span><i style="background:var(--pink)"></i>à revoir</span><span><i style="background:var(--line)"></i>pas commencée</span><span>bord épais : prochaine étape conseillée</span></div><div class="defile">'+svg+'</div><div class="detail" id="detail-notion"></div></div>';
  function detail(id){ const n=N.notions.find(x=>x.id===id); const c=tous.find(x=>x.id===n.chapitre); const e=etats[id]; const nom={maitrise:'maîtrisée',encours:'en cours',revoir:'à revoir',neutre:'pas commencée'}[e];
    const suiv=N.liens.filter(l=>l[0]===id).map(l=>N.notions.find(x=>x.id===l[1]).nom); const prec=N.liens.filter(l=>l[1]===id).map(l=>N.notions.find(x=>x.id===l[0]).nom);
    el.querySelector('#detail-notion').innerHTML='<span class="etat-notion '+e+'">'+nom+(n.id===prochaine.id?' · prochaine étape conseillée':'')+'</span><h3>'+echap(n.nom)+'</h3><p><strong>Dans la vraie vie :</strong> '+echap(n.vie)+'</p>'+(prec.length?'<p class="discret">Repose sur : '+prec.map(echap).join(', ')+'.</p>':'')+(suiv.length?'<p class="discret">Sert à comprendre : '+suiv.map(echap).join(', ')+'.</p>':'')+(c?'<p><a class="btn" href="'+lien(c.fichier)+'">Ouvrir « '+echap(c.titre)+' »</a></p>':'<p class="discret">Chapitre à venir.</p>');
    el.querySelectorAll('.notion').forEach(g=>g.classList.toggle('choisie',g.dataset.notion===id)); }
  el.addEventListener('click',e=>{ const g=e.target.closest('.notion'); if(g) detail(g.dataset.notion); });
  el.addEventListener('keydown',e=>{ const g=e.target.closest('.notion'); if(g&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); detail(g.dataset.notion); } });
  detail(prochaine.id); }

/* ---------- 3. Apprendre à apprendre ---------- */
const FICHES=[
  {id:'revision-espacee',titre:'La révision espacée',format:'fiche + planning',duree:'5 min à lire',resume:'Revoir une notion à J+1, J+3, J+7, J+21 : c\'est ainsi qu\'elle reste.',corps:'<p>Ton cerveau oublie vite ce qu\'il n\'a vu qu\'une fois, et retient longtemps ce qu\'il a retrouvé plusieurs fois, à des moments espacés. Relire dix fois le même soir sert moins que relire quatre fois sur trois semaines.</p><ol class="etapes"><li><span>Le jour même : relis le cours et refais <em>sans regarder</em> un exemple vu en classe.</span></li><li><span>Le lendemain (J+1) : cache le cours, écris de mémoire les définitions, puis vérifie.</span></li><li><span>J+3 et J+7 : deux exercices guidés, sans indice si possible.</span></li><li><span>J+21 : le jeu du chapitre ou un contrôle blanc court.</span></li></ol><p>Le site te le proposera dans ton plan de travail. Pour l\'instant, note les dates dans ton agenda.</p>',application:'Choisis le chapitre en cours et place ses quatre dates de révision dans ton agenda. Première date : demain.'},
  {id:'relire-copie',titre:'Relire sa copie et corriger seul',format:'méthode en 5 pas',duree:'15 à 30 min',resume:'Une erreur trouvée par toi vaut dix corrections lues.',corps:'<p>Après un contrôle, la note est la partie la moins utile. L\'utile, c\'est de savoir <em>pourquoi</em> tu as perdu des points, et de ranger chaque erreur dans une famille.</p><ol class="etapes"><li><span>Pour chaque question ratée, recopie ta réponse telle quelle.</span></li><li><span>Cherche l\'erreur seul, sans le corrigé. Demande un indice seulement si tu bloques.</span></li><li><span>Classe-la : calcul, méthode, cours pas su, énoncé mal lu, manque de temps.</span></li><li><span>Pour chaque famille, un remède : « énoncé mal lu » → souligner les données ; « cours pas su » → fiche de révision espacée.</span></li><li><span>Refais l\'exercice en entier, de mémoire, le lendemain.</span></li></ol>',application:'Prends ton dernier contrôle et classe chaque erreur dans une des cinq familles. Quelle famille revient le plus ?'},
  {id:'planifier',titre:'Planifier sa semaine',format:'gabarit',duree:'10 min le dimanche',resume:'Des créneaux courts et fixes, plutôt qu\'une longue soirée la veille.',corps:'<p>Un créneau de 25 minutes bien choisi vaut mieux qu\'une heure de « je vais réviser » qui n\'arrive jamais. Le secret : décider <em>quand</em> et <em>quoi</em> à l\'avance.</p><ol class="etapes"><li><span>Place d\'abord l\'obligatoire : cours, sport, trajets, repas, sommeil (8 h).</span></li><li><span>Repère quatre créneaux de 25 min dans la semaine, toujours aux mêmes moments.</span></li><li><span>Donne un nom à chacun : « lundi 18 h : exercices guidés fonctions », pas « maths ».</span></li><li><span>Garde un créneau vide pour l\'imprévu.</span></li><li><span>Le dimanche, dix minutes pour cocher ce qui a été fait et déplacer le reste, sans culpabilité.</span></li></ol>',application:'Écris tes quatre créneaux de la semaine prochaine, avec leur nom. Lequel est le plus fragile ? Pourquoi ?'},
  {id:'notes',titre:'Prendre des notes qui servent',format:'méthode',duree:'5 min',resume:'Noter pour réutiliser, pas pour recopier.',corps:'<p>Une bonne note est une note que tu peux relire dans un mois et comprendre seul. Elle contient des exemples, des flèches, tes questions.</p><ul><li>Une page par notion, le titre en haut, la date.</li><li>Les définitions en bleu, les méthodes en vert, les pièges en rouge : la même convention que le site.</li><li>Un exemple complet pour chaque méthode, avec le calcul écrit en entier.</li><li>Dans la marge : « ? » quand tu n\'as pas compris, à poser au professeur ou à signaler sur le site.</li><li>En bas : « ce que je dois savoir refaire », en une phrase.</li></ul>',application:'Reprends la dernière notion du chapitre en cours et écris sa page de notes avec les quatre couleurs.'},
  {id:'ia',titre:'Bien utiliser l\'IA pour apprendre',format:'fiche + exercice « Corrige l\'IA »',duree:'8 min',resume:'L\'IA aide à chercher, jamais à répondre à ta place.',corps:'<p>Une IA généraliste donne la réponse en trois secondes. Si tu la recopies, tu as un devoir juste et rien dans la tête : le jour du contrôle, il n\'y a pas d\'IA. Elle se trompe aussi, avec beaucoup d\'assurance.</p><p><strong>Ce qui aide :</strong> lui demander une question plutôt qu\'une réponse (« pose-moi une question pour vérifier que j\'ai compris »), un exemple <em>voisin</em>, une reformulation d\'un énoncé obscur, ou de relire ton raisonnement pour trouver l\'erreur, pas la corriger.</p><p><strong>Ce qui nuit :</strong> coller l\'énoncé et recopier ; croire un calcul sans le vérifier ; l\'utiliser à la place du cours.</p><p>Sur ce site, le tuteur applique cette règle : il questionne, il indique, il ne répond jamais. Et l\'exercice « Corrige l\'IA », dans chaque chapitre, t\'entraîne à repérer ses erreurs.</p>',application:'Prends une solution d\'exercice produite par une IA et trouve au moins une étape à vérifier. Était-elle juste ?'},
  {id:'neuromythes',titre:'Les neuromythes : ce qui ne marche pas',format:'fiche',duree:'5 min',resume:'Relire en surlignant, « être visuel », travailler en musique à paroles : des croyances à oublier.',corps:'<ul><li><strong>« Je suis visuel / auditif. »</strong> Les études ne trouvent aucun bénéfice à adapter l\'enseignement à un « style ». Ce qui compte : varier les formats et se tester.</li><li><strong>« Relire et surligner suffit. »</strong> La relecture donne une impression de familiarité, pas de la mémoire. Se tester (cacher, réciter, refaire) marche bien mieux.</li><li><strong>« On n\'utilise que 10 % de son cerveau. »</strong> Faux, tout simplement.</li><li><strong>« La musique aide toujours à se concentrer. »</strong> Les paroles se mélangent à la lecture. Un fond sans paroles aide certains, pas tous : d\'où le lecteur optionnel du site.</li><li><strong>« Une bonne nuit avant le contrôle, ça se rattrape. »</strong> Le sommeil consolide ce que tu as appris : les nuits <em>de la semaine</em> comptent.</li></ul>',application:'Parmi ces cinq idées, laquelle avais-tu ? Qu\'est-ce que tu changes dès cette semaine ?'},
];
/* Les sources des fiches. Une entrée = une étude ou un texte officiel, avec ce qu'il
   montre, dit en une phrase pour un élève. Les références partagées sont écrites une
   fois dans REFS et citées par leur clé ; `note` porte ce qu'on ne cite PAS, et
   pourquoi. Tout a été vérifié (titre, revue, année, DOI) le 25 octobre 2026 ; une
   relecture par une personne formée en sciences cognitives reste à faire. */
const REFS={
  cepeda2006:{ref:'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T. & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. <i>Psychological Bulletin</i>, 132(3), 354–380.',url:'https://doi.org/10.1037/0033-2909.132.3.354'},
  cepeda2008:{ref:'Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T. & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. <i>Psychological Science</i>, 19(11), 1095–1102.',url:'https://doi.org/10.1111/j.1467-9280.2008.02209.x'},
  roediger2006:{ref:'Roediger, H. L. & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. <i>Psychological Science</i>, 17(3), 249–255.',url:'https://doi.org/10.1111/j.1467-9280.2006.01693.x'},
  kornell2009:{ref:'Kornell, N., Hays, M. J. & Bjork, R. A. (2009). Unsuccessful retrieval attempts enhance subsequent learning. <i>Journal of Experimental Psychology: Learning, Memory, and Cognition</i>, 35(4), 989–998.',url:'https://doi.org/10.1037/a0015729'},
  metcalfe2017:{ref:'Metcalfe, J. (2017). Learning from errors. <i>Annual Review of Psychology</i>, 68, 465–489.',url:'https://doi.org/10.1146/annurev-psych-010416-044022'},
  hattie2007:{ref:'Hattie, J. & Timperley, H. (2007). The power of feedback. <i>Review of Educational Research</i>, 77(1), 81–112.',url:'https://doi.org/10.3102/003465430298487'},
  gollwitzer1999:{ref:'Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. <i>American Psychologist</i>, 54(7), 493–503.',url:'https://doi.org/10.1037/0003-066X.54.7.493'},
  gollwitzer2006:{ref:'Gollwitzer, P. M. & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. <i>Advances in Experimental Social Psychology</i>, 38, 69–119.',url:'https://doi.org/10.1016/S0065-2601(06)38002-1'},
  paruthi2016:{ref:'Paruthi, S. et al. (2016). Recommended amount of sleep for pediatric populations: A consensus statement of the American Academy of Sleep Medicine. <i>Journal of Clinical Sleep Medicine</i>, 12(6), 785–786.',url:'https://doi.org/10.5664/jcsm.5866'},
  fiorella2015:{ref:'Fiorella, L. & Mayer, R. E. (2015). <i>Learning as a Generative Activity: Eight Learning Strategies that Promote Understanding</i>. Cambridge University Press.',url:''},
  dunlosky2013:{ref:'Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J. & Willingham, D. T. (2013). Improving students\' learning with effective learning techniques: Promising directions from cognitive and educational psychology. <i>Psychological Science in the Public Interest</i>, 14(1), 4–58.',url:'https://doi.org/10.1177/1529100612453266'},
  bastani2025:{ref:'Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö. & Mariman, R. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. <i>Proceedings of the National Academy of Sciences</i>, 122(26), e2422633122.',url:'https://doi.org/10.1073/pnas.2422633122'},
  ji2023:{ref:'Ji, Z. et al. (2023). Survey of hallucination in natural language generation. <i>ACM Computing Surveys</i>, 55(12), article 248.',url:'https://doi.org/10.1145/3571730'},
  cadreia2025:{ref:'Ministère de l\'Éducation nationale (2025). <i>Cadre d\'usage de l\'intelligence artificielle en éducation</i>.',url:'https://www.education.gouv.fr/publication-du-cadre-d-usage-de-l-intelligence-artificielle-en-education-462936'},
  pashler2008:{ref:'Pashler, H., McDaniel, M., Rohrer, D. & Bjork, R. (2008). Learning styles: Concepts and evidence. <i>Psychological Science in the Public Interest</i>, 9(3), 105–119.',url:'https://doi.org/10.1111/j.1539-6053.2009.01038.x'},
  karpicke2009:{ref:'Karpicke, J. D., Butler, A. C. & Roediger, H. L. (2009). Metacognitive strategies in student learning: Do students practise retrieval when they study on their own? <i>Memory</i>, 17(4), 471–479.',url:'https://doi.org/10.1080/09658210802647009'},
  dekker2012:{ref:'Dekker, S., Lee, N. C., Howard-Jones, P. & Jolles, J. (2012). Neuromyths in education: Prevalence and predictors of misconceptions among teachers. <i>Frontiers in Psychology</i>, 3, 429.',url:'https://doi.org/10.3389/fpsyg.2012.00429'},
  vasilev2018:{ref:'Vasilev, M. R., Kirkby, J. A. & Angele, B. (2018). Auditory distraction during reading: A Bayesian meta-analysis of a continuing controversy. <i>Perspectives on Psychological Science</i>, 13(5), 567–597.',url:'https://doi.org/10.1177/1745691617747398'},
  rasch2013:{ref:'Rasch, B. & Born, J. (2013). About sleep\'s role in memory. <i>Physiological Reviews</i>, 93(2), 681–766.',url:'https://doi.org/10.1152/physrev.00032.2012'},
  gillen2013:{ref:'Gillen-O\'Neel, C., Huynh, V. W. & Fuligni, A. J. (2013). To study or to sleep? The academic costs of extra studying at the expense of sleep. <i>Child Development</i>, 84(1), 133–142.',url:'https://doi.org/10.1111/j.1467-8624.2012.01834.x'},
  dehaene2018:{ref:'Dehaene, S. (2018). <i>Apprendre ! Les talents du cerveau, le défi des machines</i>. Odile Jacob.',url:''},
};
const SOURCES_FICHES={
  'revision-espacee':{liste:[
    ['cepeda2006','317 expériences passées en revue : à temps de travail égal, espacer les révisions fait retenir plus longtemps que les grouper.'],
    ['roediger2006','Se tester (écrire de mémoire, puis vérifier) fait retenir une semaine plus tard bien mieux que relire — alors que relire paraît plus efficace sur le moment.'],
    ['cepeda2008','L\'écart idéal entre deux révisions dépend de la date du contrôle : plus il est loin, plus on espace. Les dates J+1, J+3, J+7, J+21 sont un repère commode, pas une loi.']]},
  'relire-copie':{liste:[
    ['metcalfe2017','Faire une erreur puis la corriger soi-même, avec un retour, apprend plus qu\'éviter l\'erreur ; les erreurs commises avec assurance sont même celles qu\'on corrige le mieux.'],
    ['kornell2009','Chercher la réponse soi-même, même sans la trouver, prépare à mieux retenir la correction qui vient ensuite.'],
    ['hattie2007','Un retour utile dit où est l\'écart et comment le réduire ; la note seule n\'apprend presque rien.']],
    note:'« Une erreur trouvée par toi vaut dix corrections lues » est une façon de parler : les études disent « mieux », pas « dix fois mieux ».'},
  'planifier':{liste:[
    ['gollwitzer1999','Décider à l\'avance quand, où et quoi (« lundi 18 h : exercices guidés ») augmente nettement les chances de passer à l\'acte, comparé à une simple intention.'],
    ['gollwitzer2006','94 études réunies : l\'effet est net et se retrouve dans tous les domaines, les études comprises.'],
    ['cepeda2006','Plusieurs séances courtes et espacées font retenir plus longtemps qu\'une seule longue soirée.'],
    ['paruthi2016','De 13 à 18 ans : 8 à 10 heures de sommeil par nuit, selon le consensus des médecins du sommeil.']],
    note:'Les 25 minutes viennent de la technique Pomodoro (Francesco Cirillo, années 1980) : une habitude pratique qui convient à beaucoup, pas un résultat d\'étude.'},
  'notes':{liste:[
    ['fiorella2015','Reformuler, schématiser, s\'expliquer la notion à soi-même : ce qui aide, c\'est de produire quelque chose avec le cours, pas de le recopier.'],
    ['dunlosky2013','Résumer un cours n\'aide que si on a appris à le faire ; se tester et espacer sont les deux techniques les mieux établies.']],
    note:'Nous ne citons pas l\'étude souvent reprise selon laquelle écrire à la main vaudrait mieux que taper (Mueller & Oppenheimer, 2014) : refaite à plus grande échelle (Morehead, Dunlosky & Rawson, 2019), elle n\'a pas été confirmée.'},
  'ia':{liste:[
    ['bastani2025','Près de 1 000 lycéens : avec une IA qui donne les réponses, les exercices d\'entraînement sont bien mieux réussis (+48 %), mais le contrôle passé sans IA est moins bien réussi (−17 %) qu\'en ayant travaillé sans aide. Avec une IA réglée pour n\'indiquer que des pistes, jamais la réponse, cette perte disparaît. C\'est la règle du tuteur de ce site.'],
    ['ji2023','Les modèles de langage produisent des affirmations fausses mais fluides et assurées ; le phénomène est connu, mesuré, et pas résolu.'],
    ['cadreia2025','Utiliser l\'IA pour un devoir sans autorisation ni travail personnel est une fraude ; l\'usage autonome est admis à partir de la 4ᵉ.']]},
  'neuromythes':{liste:[
    ['pashler2008','Aucune étude rigoureuse ne montre qu\'enseigner selon le « style » d\'un élève (visuel, auditif…) le fait mieux apprendre.'],
    ['dunlosky2013','Relire et surligner : utilité faible. Se tester et espacer ses révisions : utilité élevée.'],
    ['karpicke2009','La plupart des étudiants relisent plutôt que de se tester, parce que la relecture donne une impression de maîtrise.'],
    ['dekker2012','Le « 10 % du cerveau » et les styles d\'apprentissage sont parmi les idées fausses les plus répandues, y compris chez les enseignants.'],
    ['vasilev2018','65 études : la parole et la musique avec paroles gênent le plus la lecture ; le bruit et la musique sans paroles gênent un peu, chez les enfants comme chez les adultes.'],
    ['rasch2013','Pendant le sommeil, le cerveau rejoue et consolide ce qui a été appris dans la journée.'],
    ['gillen2013','535 lycéens suivis pendant trois ans : un soir de révision pris sur le sommeil est suivi, le lendemain, de plus de difficultés en classe et aux contrôles.']]},
};
function lienRef(k){ const r=REFS[k]; return '<cite>'+r.ref+'</cite>'+(r.url?' <a href="'+r.url+'" rel="noopener" target="_blank">'+echap(r.url.replace(/^https?:\/\/(doi\.org\/)?/,''))+'</a>':''); }
function sourcesHTML(id){ const s=SOURCES_FICHES[id]; if(!s) return '';
  return '<details class="sources"><summary>D\'où ça vient</summary><ul>'+s.liste.map(x=>'<li><span class="dit">'+x[1]+'</span>'+lienRef(x[0])+'</li>').join('')+'</ul>'+(s.note?'<p class="note">'+s.note+'</p>':'')+'</details>'; }
function biblioHTML(){ const cles=['dehaene2018','dunlosky2013',...new Set(Object.values(SOURCES_FICHES).flatMap(s=>s.liste.map(x=>x[0])))];
  const uniques=[...new Set(cles)].sort((a,b)=>REFS[a].ref.localeCompare(REFS[b].ref,'fr'));
  return '<section class="biblio" id="sources"><h2>Les sources</h2><p>Ces fiches s\'appuient sur les quatre piliers de l\'apprentissage décrits par Stanislas Dehaene et sur les synthèses qui comparent les méthodes de travail entre elles. Chaque fiche dit d\'où elle vient (« D\'où ça vient ») et, quand une idée répandue n\'est pas confirmée, elle le dit aussi.</p><ol>'+uniques.map(k=>'<li>'+lienRef(k)+'</li>').join('')+'</ol><p class="discret">Références vérifiées le 25 octobre 2026. Les fiches n\'ont pas encore été relues par une personne formée en sciences cognitives : c\'est prévu avant qu\'elles quittent le prototype.</p></section>'; }
function Apprendre(body){ const m=body.querySelector('#fiches'); if(!m) return;
  m.innerHTML=FICHES.map(f=>'<article class="fiche-metho" id="'+f.id+'"><span class="meta"><span>'+echap(f.format)+'</span><span>'+echap(f.duree)+'</span></span><h2>'+echap(f.titre)+'</h2><p><strong>'+echap(f.resume)+'</strong></p>'+f.corps+'<details><summary>Exercice d\'application</summary><p>'+echap(f.application)+'</p></details>'+sourcesHTML(f.id)+'</article>').join('')+biblioHTML();
  if(location.hash){ const t=document.getElementById(location.hash.slice(1)); if(t) setTimeout(()=>t.scrollIntoView({block:'start'}),100); } }

/* ---------- 4. Aller plus loin ---------- */
const RESSOURCES=[
  ['Mathématiques',[['Mickaël Launay (Micmaths)','vidéos','des idées de maths racontées avec clarté','https://www.youtube.com/@Micmaths'],['Images des mathématiques (CNRS)','articles','la recherche expliquée au grand public','https://images.math.cnrs.fr/'],['Sésamath','manuels et exercices libres','un classique, gratuit','https://www.sesamath.net/']]],
  ['Physique-chimie',[['Culture Sciences Physique (ENS Lyon)','articles','des ressources relues par des enseignants','https://culturesciencesphysique.ens-lyon.fr/'],['ScienceEtonnante','vidéos','la physique et les sciences, sans jargon inutile','https://www.youtube.com/@ScienceEtonnante']]],
  ['Esprit critique',[['Hygiène Mentale','vidéos','apprendre à douter avec méthode','https://www.youtube.com/@HygieneMentale'],['Cogito','site','auto-défense intellectuelle pour les lycéens','https://cogito.fr'],['La Tronche en Biais','vidéos','les biais qui nous trompent tous','https://www.youtube.com/@TroncheEnBiais']]],
  ['Orientation',[['Onisep','fiches métiers','où servent les notions que tu apprends','https://www.onisep.fr']]],
];
function PlusLoin(body){ const m=body.querySelector('#ressources'); if(!m) return;
  m.innerHTML=RESSOURCES.map(r=>'<section class="pile"><h2>'+echap(r[0])+'</h2><div class="colonnes">'+r[1].map(x=>'<a class="carte" href="'+x[3]+'" rel="noopener" target="_blank" style="text-decoration:none;color:inherit"><strong>'+echap(x[0])+'</strong><span class="surtitre">'+echap(x[1])+' · validée</span><span class="discret">'+echap(x[2])+'</span></a>').join('')+'</div></section>').join(''); }

/* ---------- 5. Aide ---------- */
function Aide(body){ if(location.hash==='#parler'){ const t=document.getElementById('parler'); if(t) setTimeout(()=>t.scrollIntoView({block:'start'}),100); }
  // une question de la FAQ visée par le lien (le pied de page mène à « Qui a peint le bureau ? ») : ouverte
  const q=location.hash&&document.getElementById(location.hash.slice(1)); if(q&&q.tagName==='DETAILS'){ q.open=true; setTimeout(()=>q.scrollIntoView({block:'center'}),100); } }

/* ---------- 6. Mon compte ---------- */
const MASQUABLES=[['decor','Le décor du bureau (peint ou dessiné)'],['avatar','L\'avatar'],['succes','Les succès'],['musique','Le lecteur de musique'],['pause','Le rappel de pause'],['stats','Les statistiques (autonomie)'],['carnet','Le carnet des professeurs sur le bureau'],['porte-theme','Porte « Par thème »'],['porte-examen','Porte « Préparer l\'examen »'],['porte-carte','Porte « Carte des notions »'],['porte-labos','Porte « Labos et jeux »']];
/* « Mes professeurs » : la liste des classes rejointes, et l'invitation portée par un lien
   compte.html?rejoindre=CODE&p=…&m=… (voir carnet.js). Sans serveur, c'est le lien qui dit
   qui est le professeur ; l'élève confirme, et rien ne se passe sans ce clic. */
function sectionProfs(){ const C=window.Carnet; if(!C) return '';
  const inv=C.decoderLien(); const profs=C.profs(); const deja=inv&&profs.some(x=>x.code===inv.code);
  const mat=inv?C.matiere(inv.matiere):null;
  const invitation= inv ? '<div class="invitation" data-couleur="'+echap(mat?mat.couleur||'neutre':'neutre')+'">'+(deja?'<p><strong>Tu fais déjà partie de cette classe.</strong></p>':
      '<p class="surtitre">Invitation</p><p><strong>'+echap(inv.prof)+'</strong> te propose de rejoindre sa classe'+(inv.classe?' <strong>'+echap(inv.classe)+'</strong>':'')+(mat?' en '+echap(mat.nom.toLowerCase()):'')+'.</p>'+C.EXPLICATION+
      '<div class="ligne"><button type="button" class="btn" data-rejoindre>Rejoindre cette classe</button><a class="btn fantome" href="'+lien('compte.html')+'">Non merci</a></div>')+'</div>' : '';
  const liste= profs.length ? '<ul class="profs-liste">'+profs.map(x=>{ const mm=C.matiere(x.matiere); return '<li data-couleur="'+echap(mm?mm.couleur||'neutre':'neutre')+'"><span class="pastille" aria-hidden="true"></span><div><strong>'+echap(x.prof)+'</strong><span class="discret">'+echap(mm?mm.nom:x.matiere)+(x.classe?' · '+echap(x.classe):'')+' · depuis le '+echap(C.dateFr(x.depuis))+'</span></div><button type="button" class="btn fantome petit" data-quitter="'+echap(x.code)+'">Quitter</button></li>'; }).join('')+'</ul>'
             : '<p class="discret">Aucun professeur pour l\'instant. Tu peux utiliser tout le site sans en avoir : un professeur ne sert qu\'à te proposer des choses et à suivre ta progression, si tu l\'acceptes.</p>';
  return '<section class="carte" id="profs"><span class="surtitre">Mes professeurs</span><h2>Les classes que j\'ai rejointes</h2>'+invitation+liste+'<p class="discret">Pour rejoindre une classe, il te faut le lien que ton professeur te donne. Ce que chaque professeur t\'envoie se trouve dans ton <a href="'+lien('carnet.html')+'">carnet des professeurs</a>.</p></section>';
}
function Compte(body){ const p=P(), m=body.querySelector('#compte'); if(!m) return; const E=p.ELEVE; const aff=p.affichage(); const suivies=p.lire('matieres-suivies',null);
  m.innerHTML='<div class="colonnes">'+
    '<section class="carte"><span class="surtitre">Identité</span><div class="ligne">'+B().avatarSVG(56)+'<div><strong>'+echap(E.prenom)+'</strong><br><span class="discret">pseudonyme : '+echap(E.pseudo)+' · '+echap(E.niveauNom)+'</span></div></div><p class="discret">Ton identifiant peut être un pseudonyme. Tu n\'appartiens à aucune classe par défaut : ce sont tes professeurs qui te proposent de rejoindre la leur, et tu peux la quitter quand tu veux.</p><p><a class="btn fantome" href="'+lien('personnalisation.html')+'">Modifier mon avatar</a></p></section>'+
    '<section class="carte" id="affichage"><span class="surtitre">Affichage</span><h2>Essentiel ou Complet</h2><div class="bascule"><button type="button" data-affichage="essentiel" aria-pressed="'+(aff==='essentiel')+'">Essentiel</button><button type="button" data-affichage="complet" aria-pressed="'+(aff==='complet')+'">Complet</button></div><p class="discret">Essentiel : le travail et le suivi, rien d\'autre. Complet : tout, puis tu ajustes élément par élément ci-dessous. Deux choses ne se masquent jamais : le lien « J\'ai besoin de parler à quelqu\'un » et l\'indication du tuteur avec ou sans IA.</p>'+
    '<div class="masquables">'+MASQUABLES.map(x=>'<label><input type="checkbox" data-masque="'+x[0]+'" '+(!p.masque(x[0])?'checked':'')+(aff==='essentiel'?' disabled':'')+'>'+echap(x[1])+'</label>').join('')+'<label class="fixe"><input type="checkbox" checked disabled>« J\'ai besoin de parler à quelqu\'un » (toujours visible)</label><label class="fixe"><input type="checkbox" checked disabled>Tuteur avec ou sans IA (toujours indiqué)</label></div>'+
    '<h3 style="margin-top:8px">Matières suivies</h3><div class="masquables">'+matieres().map(mm=>'<label><input type="checkbox" data-matiere="'+mm.id+'" '+(!suivies||suivies.includes(mm.id)?'checked':'')+'>'+echap(mm.nom)+'</label>').join('')+'</div></section>'+
    sectionProfs()+
    '<section class="transparence" id="parents"><h2>Ce que voient mes parents</h2><p>Affiché noir sur blanc, de ton côté comme du leur.</p><ul><li><span class="oui">✓</span> le temps de travail, jour par jour</li><li><span class="oui">✓</span> le chapitre en cours et ta progression</li><li><span class="oui">✓</span> la réussite par matière et sa tendance</li><li><span class="oui">✓</span> tout ton carnet des professeurs, en lecture : échéances, exercices conseillés, points de cours, messages</li><li><span class="non">✗</span> tes réponses détaillées</li><li><span class="non">✗</span> tes échanges avec le tuteur</li><li><span class="non">✗</span> tes brouillons</li><li><span class="non">✗</span> ta musique, ton avatar, tes succès (sauf si tu choisis de les montrer)</li></ul><p class="discret">Tes parents peuvent couper l\'IA du tuteur ; tu le vois alors sur l\'interrupteur, avec l\'explication.</p></section>'+
    '<section class="carte" id="donnees"><span class="surtitre">Mes données</span><h2>Exporter, effacer</h2><p class="discret">Tout ce que ce prototype garde est dans ton navigateur : progression, réglages, succès. Rien n\'est envoyé. Tu peux tout télécharger ou tout effacer. Le détail, et ce qui changera avec les comptes : <a href="'+lien('confidentialite.html')+'">Données et confidentialité</a>.</p><div class="ligne"><button class="btn fantome" type="button" data-export>Télécharger mes données (JSON)</button><button class="btn fantome" type="button" data-effacer>Tout effacer</button></div></section>'+
    '<section class="carte"><span class="surtitre">Aide</span><h2>Tutoriels et déconnexion</h2><p><a href="'+lien('aide.html')+'">Aide et tutoriels</a> · <a href="'+lien('guide.html')+'">Mode d\'emploi pour l\'enseignant</a></p><p><a class="btn fantome" href="'+lien(((window.SITE||{}).accueil)||'index.html')+'">Se déconnecter</a></p></section></div>';
  m.addEventListener('click',e=>{ const a=e.target.closest('button[data-affichage]'); if(a){ p.setAffichage(a.dataset.affichage); location.reload(); }
    const rj=e.target.closest('[data-rejoindre]'); if(rj&&window.Carnet){ const inv=window.Carnet.decoderLien(); if(inv){ window.Carnet.rejoindre(inv); B().toast('<strong>Classe rejointe.</strong><span>Ce que '+echap(inv.prof)+' t\'envoie arrivera dans ton carnet.</span>'); location.href=lien('carnet.html'); } return; }
    const qt=e.target.closest('[data-quitter]'); if(qt&&window.Carnet){ if(qt.dataset.confirme){ window.Carnet.quitter(qt.dataset.quitter); location.href=lien('compte.html#profs'); } else { qt.dataset.confirme='1'; qt.textContent='Confirmer : quitter'; qt.classList.remove('fantome'); } return; }
    if(e.target.closest('[data-export]')){ const blob=new Blob([JSON.stringify(p.exporter(),null,2)],{type:'application/json'}); const u=URL.createObjectURL(blob); const l=document.createElement('a'); l.href=u; l.download='monpupitre-donnees.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); }
    const ef=e.target.closest('[data-effacer]'); if(ef){ if(ef.dataset.confirme){ p.toutEffacer(); location.href=lien(((window.SITE||{}).accueil)||'index.html'); } else { ef.dataset.confirme='1'; ef.textContent='Confirmer : tout effacer de ce navigateur'; ef.classList.remove('fantome'); } } });
  m.addEventListener('change',e=>{ const c=e.target.closest('[data-masque]'); if(c) p.setMasque(c.dataset.masque,!c.checked);
    const mm=e.target.closest('input[data-matiere]'); if(mm){ const l=[...m.querySelectorAll('[data-matiere]:checked')].map(x=>x.dataset.matiere); p.ecrire('matieres-suivies',l.length===matieres().length?null:l); } }); }

/* ---------- 6 bis. Le carnet des professeurs ---------- */
function CarnetPage(body){ const p=P(), m=body.querySelector('#carnet'); if(!m||!window.Carnet) return; const C=window.Carnet;
  function peindre(){ const rub=C.tout();
    const aVenir=C.echeancesAVenir();
    m.innerHTML=(rub.length?
        (aVenir.length?'<section class="carte prochaines"><span class="surtitre">Prochaines échéances</span><ul class="carnet-liste compacte">'+aVenir.slice(0,4).map(e=>'<li class="carnet-item type-echeance"><span class="ico" aria-hidden="true">📅</span><div class="corps"><span class="etiq">'+echap(e.prof.prof)+'</span><span>'+echap(C.libelleCible(e))+'</span><span class="meta"><b class="quand">'+echap(C.dateFr(e.echeance,true))+'</b><span class="discret"> · '+echap(C.dansCombien(e.echeance))+'</span></span></div></li>').join('')+'</ul></section>':'')+
        rub.map(r=>C.rendreRubrique(r,{quitter:true})).join('')
      : '<section class="carte vide-carnet"><h2>Tu travailles seul, et c\'est très bien ainsi</h2><p>Ce carnet se remplit si un professeur — en classe ou particulier — te donne un <strong>lien de classe</strong>. En le suivant, tu rejoins sa classe ; ce qu\'il te propose arrive ici.</p>'+C.EXPLICATION+'<p class="discret">Tout le site reste utilisable sans professeur. Celui-ci ne sert qu\'à te proposer des choses et à suivre ta progression, si tu l\'acceptes.</p></section>')+
      '<section class="transparence" id="transparence"><h2>Ce que mes professeurs voient de moi</h2><p>Affiché noir sur blanc, de ton côté comme du leur. Un professeur ne voit rien de toi tant que tu n\'as pas rejoint sa classe.</p><ul><li><span class="oui">✓</span> ton prénom ou ton pseudonyme</li><li><span class="oui">✓</span> le chapitre en cours et ta progression dans ses chapitres</li><li><span class="oui">✓</span> ton indicateur d\'autonomie (sans aide / avec indice / avec guidage), comparé à toi-même</li><li><span class="oui">✓</span> si tu as coché « fait » sur ce qu\'il t\'a proposé</li><li><span class="non">✗</span> tes réponses détaillées, tes brouillons, tes échanges avec le tuteur</li><li><span class="non">✗</span> ta musique, ton avatar, tes succès</li><li><span class="non">✗</span> ce que tes autres professeurs t\'envoient</li></ul><p class="discret">Pour rejoindre ou quitter une classe : <a href="'+lien('compte.html#profs')+'">Mon compte</a>.</p></section>';
    S().maths(m);
  }
  peindre();
  C.brancher(m,{apres:peindre});
}

/* ---------- 7. Personnalisation ---------- */
/* « Le décor » : la vue par la fenêtre et la lumière du bureau lofi, en vignettes peintes.
   Le bureau dessiné (vues Douce, Marquée, ou décor masqué) garde sa fenêtre en arche : elle
   suit la vue la plus proche (DECOR_DESSINE), sans choix à part. */
const DECOR_DESSINE={ville:'fenetre',plage:'plage',montagne:'montagne',foret:'fenetre',jardin:'fenetre'};
function decorLofi(el){ if(!el) return; const BB=B().bureau;
  BB.chargerPack(()=>{ const PK=window.PACK_BUREAU, BP=BB.peint, r=BP.reglages(), S=BP.scene(PK,r), V=S.vignettes||{}, N=S.noms||{};
    const sombre=document.documentElement.dataset.theme==='dark', moment=BP.moment(r);
    const img=(s,cls)=>'<img src="'+lien(BP.IMG+s)+'" alt="" loading="lazy"'+(cls?' class="'+cls+'"':'')+'>';
    const carte=(attr,v,presse,images,titre,sous)=>'<button type="button" class="decor-choix" data-'+attr+'="'+v+'" aria-pressed="'+presse+'"><span class="apercu-lofi" aria-hidden="true">'+images+'</span><strong>'+echap(titre)+'</strong>'+(sous?'<span class="discret">'+echap(sous)+'</span>':'')+'</button>';
    const propre=S.propre.cle, vues=[propre].concat(Object.keys(S.vues||{})).filter(k=>V[k]);
    const pays=(S.vues||{})[r.paysage]?r.paysage:propre, W=V[pays];
    // les ambiances : le bureau de base, puis chacune, dans la lumière du moment
    const ambiances=[['base','Lofi',PK.apercus,'']].concat(Object.entries(PK.ambiances||{}).map(([k,a])=>[k,a.nom,a.apercus,'']));
    const lum=[['heure','Selon l\'heure','matin, midi, puis soir'],['matin','Matin',''],['midi','Midi',''],['soir','Soir',''],['nuit','La nuit','le thème sombre, la lampe allumée']];
    el.innerHTML=(ambiances.length>1?'<div><span class="discret">L\'ambiance</span><div class="decors">'+ambiances.filter(a=>a[2]).map(([k,t,ap,sous])=>carte('ambiance',k,S.cle===k,img(ap[moment]),t,sous)).join('')+'</div></div>':'')+
      '<div><span class="discret">Par la fenêtre</span><div class="decors">'+vues.map(k=>carte('paysage',k,pays===k,img(V[k][moment]),N[k]||k,'')).join('')+'</div></div>'+
      '<div><span class="discret">La lumière</span><div class="decors">'+lum.map(([k,t,sous])=>{ const presse= k==='nuit'?sombre:(!sombre&&(r.lumiere||'heure')===k);
        const images= k==='heure'?'<span class="tranches">'+['matin','midi','soir'].map(m=>img(W[m])).join('')+'</span>':img(W[k]);
        return carte('lumiere',k,presse,images,t,sous); }).join('')+'</div></div>'+
      (BB.reglages().vue!=='peint'?'<p class="discret">Ton bureau est en décor dessiné : sa fenêtre en arche suit la vue la plus proche. Le bureau lofi se choisit dans « Mon bureau », juste en dessous.</p>':'')+
      (P().masque('decor')?'<p class="discret">Le décor du bureau est masqué (dans « Mon compte », rubrique Affichage) : ces choix s\'appliqueront quand tu le réafficheras.</p>':'');
    el.onclick=e=>{ const b=e.target.closest('.decor-choix'); if(!b) return; let cle, v;
      const peint=()=>Object.assign({},BB.reglages().peint||{});
      if(b.dataset.ambiance){ cle='ambiance'; v=b.dataset.ambiance; BB.rafraichir({peint:Object.assign(peint(),{ambiance:v})});
        const at=document.getElementById('bureau-atelier'); if(at&&at._construire){ at._construire(); } }
      else if(b.dataset.paysage){ cle='paysage'; v=b.dataset.paysage; BB.rafraichir({peint:Object.assign(peint(),{paysage:v})});
        const d=DECOR_DESSINE[v]||'fenetre'; P().ecrire('decor',d); document.body.dataset.decor=d; }
      else { cle='lumiere'; v=b.dataset.lumiere; const nuit=document.documentElement.dataset.theme==='dark';
        if(v==='nuit'){ if(!nuit) B().theme.basculer(); }
        else { if(nuit) B().theme.basculer(); BB.rafraichir({peint:Object.assign(peint(),{lumiere:v})}); } }
      decorLofi(el); setTimeout(()=>{ const n=el.querySelector('[data-'+cle+'="'+v+'"]'); if(n) n.focus({preventScroll:true}); },0);
      const ap=document.getElementById('apercu-bureau'); if(ap) apercuBureau(ap); }; }); }
const AVATAR={peau:['#F1C9A5','#E0AC7E','#C68642','#8D5524','#5C3A1E','#F7E0CF'],cheveux:['#3B2A1A','#000000','#8B5A2B','#D9A441','#B22222','#6B6B6B','#FFFFFF'],coupe:[['court','Courts'],['long','Longs'],['boucle','Bouclés'],['chignon','Chignon'],['ras','Ras']],haut:['#2B5BD7','#C4186A','#1F8A45','#7B3FD1','#0B7C86','#2A140B','#FFD166'],acc:[['aucun','Aucun'],['lunettes','Lunettes'],['casque','Casque'],['bonnet','Bonnet']]};
function Personnalisation(body){ const p=P(), m=body.querySelector('#perso'); if(!m) return;
  const decor=p.lire('decor','fenetre'); const av=Object.assign({peau:'#F1C9A5',cheveux:'#3B2A1A',coupe:'court',haut:'#2B5BD7',acc:'aucun'},p.lire('avatar',{}));
  const mus=Object.assign({ambiance:'lofi',volume:.5},p.lire('musique',{})); const pause=p.lire('pause',{actif:true,minutes:45});
  const jours=p.lire('jours',[]).length, chapitresFinis=tousLesChapitres().filter(c=>p.pourcentage(c.id)>=100).length, labosPC=p.lire('parcours:diffraction-interferences',{}).explorer;
  const objets=[['🪴','La plante','pousse avec les semaines actives',jours>=3,'3 jours actifs'],['📚','Un livre par chapitre terminé','sur l\'étagère',chapitresFinis>=1,'un parcours à 100 %'],['🔬','Le microscope','après le premier labo de sciences',!!labosPC,'un labo de physique-chimie'],['💡','La lampe','après un mois de révisions espacées',false,'phase 4'],['🏅','La vitrine des succès','tes succès, visibles par toi seul',p.succes.liste().length>0,'un premier succès']];
  m.innerHTML='<section class="carte" id="decor"><span class="surtitre">Le décor</span><h2>Ton bureau, dans la lumière que tu veux</h2><p class="discret">Ce que tu vois par la fenêtre, et la lumière de la pièce. Le décor ne change jamais le contenu. La nuit, c\'est le thème sombre : la lampe s\'allume.</p><div id="decor-lofi"><p class="discret">Chargement du décor…</p></div></section>'+
    '<section class="carte" id="bureau"><span class="surtitre">Mon bureau</span><h2>Ton bureau, à ta façon</h2><p class="discret">La lampe, la tasse, le casque, le pot à crayons, les livres, la plante, les étagères. Rien de tout cela ne change le contenu. Sur un grand écran, les objets servent : la lampe allume le thème sombre, le casque ouvre la musique, la tasse suit le rappel de pause.</p><div class="bureau-atelier" id="bureau-atelier"><p class="discret">Chargement du bureau…</p></div></section>'+
    '<section class="carte" id="avatar"><span class="surtitre">L\'avatar</span><h2>Te représenter, jamais une photo</h2><div class="avatar-atelier"><div class="grand" id="avatar-grand">'+B().avatarSVG(140)+'</div><div class="options">'+
      '<div><span class="discret">Peau</span><div class="pastilles" data-cle="peau">'+AVATAR.peau.map(c=>'<button type="button" style="background:'+c+'" data-v="'+c+'" aria-pressed="'+(av.peau===c)+'" aria-label="peau '+c+'"></button>').join('')+'</div></div>'+
      '<div><span class="discret">Cheveux</span><div class="pastilles" data-cle="cheveux">'+AVATAR.cheveux.map(c=>'<button type="button" style="background:'+c+'" data-v="'+c+'" aria-pressed="'+(av.cheveux===c)+'" aria-label="cheveux '+c+'"></button>').join('')+'</div></div>'+
      '<div><span class="discret">Coupe</span><div class="bascule" data-cle="coupe">'+AVATAR.coupe.map(c=>'<button type="button" data-v="'+c[0]+'" aria-pressed="'+(av.coupe===c[0])+'">'+c[1]+'</button>').join('')+'</div></div>'+
      '<div><span class="discret">Haut</span><div class="pastilles" data-cle="haut">'+AVATAR.haut.map(c=>'<button type="button" style="background:'+c+'" data-v="'+c+'" aria-pressed="'+(av.haut===c)+'" aria-label="haut '+c+'"></button>').join('')+'</div></div>'+
      '<div><span class="discret">Accessoire</span><div class="bascule" data-cle="acc">'+AVATAR.acc.map(c=>'<button type="button" data-v="'+c[0]+'" aria-pressed="'+(av.acc===c[0])+'">'+c[1]+'</button>').join('')+'</div></div></div></div><p class="discret">De nouveaux éléments se débloquent avec les succès. L\'avatar est décoratif : il ne donne aucun avantage dans les exercices.</p></section>'+
    '<section class="carte" id="objets"><span class="surtitre">Le bureau personnel</span><h2>Une trace calme du travail accompli</h2><p class="discret">Les objets apparaissent au fil de l\'année et ne se perdent jamais. Visibles par toi seul.</p><div class="objets-bureau">'+objets.map(o=>'<div class="objet'+(o[3]?'':' verrou')+'"><span class="ico'+(o[3]?'':' gris')+'" aria-hidden="true">'+o[0]+'</span><strong>'+echap(o[1])+'</strong><span class="discret">'+echap(o[2])+'</span><span class="surtitre">'+(o[3]?'débloqué':'après : '+echap(o[4]))+'</span></div>').join('')+'</div></section>'+
    '<section class="carte" id="musique"><span class="surtitre">L\'ambiance</span><h2>Musique de concentration</h2><p class="discret">Coupée par défaut, sans paroles, générée par ton navigateur. Le réglage reste sur cet appareil.</p><div class="bascule" data-cle="ambiance">'+[['lofi','Lo-fi'],['piano','Piano calme'],['pluie','Pluie'],['brun','Bruit brun'],['silence','Silence + minuteur']].map(a=>'<button type="button" data-v="'+a[0]+'" aria-pressed="'+(mus.ambiance===a[0])+'">'+a[1]+'</button>').join('')+'</div><label class="ligne" style="margin-top:8px"><span>Volume</span><input type="range" min="0" max="1" step="0.05" value="'+mus.volume+'" data-volume style="flex:1"></label></section>'+
    '<section class="carte" id="lecture"><span class="surtitre">La lecture du cours</span><h2>Les méthodes, repliées ou dépliées</h2><div class="reglages-liste"><div class="reglage"><div><strong>Déplier les méthodes d\'office</strong><small>Dans le cours, les blocs « Méthode » sont repliés pour alléger la lecture : on les ouvre quand on en a besoin. Coche pour les voir toujours ouverts.</small></div><label class="interrupteur"><input type="checkbox" data-methodes '+(p.lire('methodes','pliees')==='depliees'?'checked':'')+'><span class="piste" aria-hidden="true"></span><span class="sr">Déplier les méthodes d\'office</span></label></div><div class="reglage"><div><strong>Le code couleur des blocs</strong><small>Définition, propriété, méthode, piège, exemple, remarque : à quoi sert chaque couleur, et dans quel ordre aborder un chapitre.</small></div><a class="btn fantome" href="'+lien('lire-le-cours.html')+'">Lire le guide</a></div></div></section>'+
    '<section class="carte" id="pause"><span class="surtitre">Le rappel de pause</span><h2>S\'arrêter, pas rester connecté</h2><div class="reglages-liste"><div class="reglage"><div><strong>Rappel après 45 minutes</strong><small>Une carte propose cinq minutes loin de l\'écran. Elle ne bloque rien.</small></div><label class="interrupteur"><input type="checkbox" data-pause '+(pause.actif?'checked':'')+'><span class="piste" aria-hidden="true"></span><span class="sr">Rappel de pause</span></label></div><div class="reglage"><div><strong>Minuteur 25 / 5</strong><small>Des cycles de travail et de pause, depuis le lecteur de musique. Il remplace alors le rappel des 45 minutes.</small></div><span class="discret">dans le lecteur 🎧</span></div></div></section>';
  atelierBureau(m.querySelector('#bureau-atelier'));
  function majAvatar(){ p.ecrire('avatar',av); m.querySelector('#avatar-grand').innerHTML=B().avatarSVG(140); document.querySelectorAll('.compte summary .avatar').forEach(a=>a.outerHTML=B().avatarSVG(30)); }
  decorLofi(m.querySelector('#decor-lofi'));
  m.addEventListener('click',e=>{
    const bb=e.target.closest('[data-bureau] [data-v]'); if(bb){ const g=bb.closest('[data-bureau]'), cle=g.dataset.bureau; g.querySelectorAll('[data-v]').forEach(x=>x.setAttribute('aria-pressed',x===bb));
      // les réglages du bureau peint vivent sous mp:bureau.peint (clés « peint.<nom> »)
      const maj= cle.startsWith('peint.') ? {peint:Object.assign({},B().bureau.reglages().peint||{},{[cle.slice(6)]:bb.dataset.v})} : {[cle]:bb.dataset.v};
      B().bureau.rafraichir(maj);
      const at=m.querySelector('#bureau-atelier');
      // changer de vue ou de style d'objet change les choix proposés (couleurs, options) : on reconstruit
      if((cle==='vue'||/^peint\.(lampe|casque|tasse|pot)$/.test(cle))&&at&&at._construire){ const y=scrollY; at._construire(); scrollTo(0,y); const n=at.querySelector('[data-bureau="'+cle+'"] [data-v="'+bb.dataset.v+'"]'); if(n) n.focus({preventScroll:true}); return; }
      apercuBureau(m.querySelector('#apercu-bureau')); return; }
    const b=e.target.closest('[data-v]'); if(!b) return; const g=b.closest('[data-cle]'); if(!g) return; const cle=g.dataset.cle; g.querySelectorAll('[data-v]').forEach(x=>x.setAttribute('aria-pressed',x===b));
    if(cle==='ambiance'){ mus.ambiance=b.dataset.v; p.ecrire('musique',Object.assign(p.lire('musique',{}),{ambiance:mus.ambiance})); return; }
    av[cle]=b.dataset.v; majAvatar(); });
  m.addEventListener('input',e=>{ if(e.target.matches('[data-volume]')){ p.ecrire('musique',Object.assign(p.lire('musique',{}),{volume:+e.target.value})); } });
  m.addEventListener('change',e=>{ if(e.target.matches('[data-pause]')) p.ecrire('pause',{actif:e.target.checked,minutes:45}); if(e.target.matches('[data-methodes]')) p.ecrire('methodes',e.target.checked?'depliees':'pliees'); });
  if(location.hash){ const t=document.getElementById(location.hash.slice(1)); if(t) setTimeout(()=>t.scrollIntoView({block:'start'}),100); } }

/* l'atelier du bureau : les choix, et un aperçu qui se redessine à chaque clic. Les listes
   (vues, styles, palettes) viennent de fond-bureau.js, chargé ici s'il ne l'est pas encore
   (le décor peut être masqué : on propose quand même les réglages, ils serviront). */
function atelierBureau(el){ if(!el) return;
  function construire(){ const F=window.FOND_BUREAU, r=B().bureau.reglages(), PAL=F.palettes;
    if(r.vue==='peint'&&window.PACK_BUREAU) return construirePeint();
    const bascule=(cle,liste)=>'<div class="bascule" data-bureau="'+cle+'">'+liste.map(x=>'<button type="button" data-v="'+x[0]+'" aria-pressed="'+(r[cle]===x[0])+'">'+echap(x[1])+'</button>').join('')+'</div>';
    const teintes=(cle,pal,champ)=>'<div class="pastilles" data-bureau="'+cle+'">'+Object.entries(pal).map(([k,d])=>'<button type="button" style="background:'+(d[champ]||d.base)[0]+'" data-v="'+k+'" aria-pressed="'+(r[cle]===k)+'" aria-label="'+echap(d.nom)+'" title="'+echap(d.nom)+'"></button>').join('')+'</div>';
    const palettes=(cle,pal)=>'<div class="pastilles" data-bureau="'+cle+'">'+Object.entries(pal).map(([k,d])=>{ const n=d.tons.length, deg=d.tons.map((c,i)=>c+' '+(100*i/n).toFixed(0)+'% '+(100*(i+1)/n).toFixed(0)+'%').join(','); return '<button type="button" style="background:linear-gradient(90deg,'+deg+')" data-v="'+k+'" aria-pressed="'+(r[cle]===k)+'" aria-label="'+echap(d.nom)+'" title="'+echap(d.nom)+'"></button>'; }).join('')+'</div>';
    const vueBtns=boutonsVues(F,r);
    const ambiance=!!(F.vues[r.vue]&&F.vues[r.vue].ambiance);
    el.innerHTML='<div class="apercu-bureau" id="apercu-bureau" aria-hidden="true"></div><div class="options">'+
      '<div><span class="discret">La vue ou l\'ambiance</span>'+vueBtns+'<span class="discret note-ambiance"'+(ambiance?'':' hidden')+'>Dans une ambiance, la fenêtre, le mobilier et les objets sont ceux de l\'ambiance : les choix ci-dessous reviendront avec une vue « Douce » ou « Marquée ».</span></div>'+
      '<div class="options-objets"'+(ambiance?' hidden':'')+'>'+
      '<div><span class="discret">La lampe</span>'+bascule('lampe',F.styles.lampe)+teintes('lampeCouleur',PAL.lampe)+'</div>'+
      '<div><span class="discret">Le pot à crayons</span>'+bascule('pot',F.styles.pot)+teintes('potCouleur',PAL.pot)+'</div>'+
      '<div><span class="discret">Les crayons</span>'+palettes('crayons',PAL.crayons)+'</div>'+
      '<div><span class="discret">La tasse</span>'+teintes('tasse',PAL.tasse)+'</div>'+
      '<div><span class="discret">La plante</span>'+bascule('plante',F.styles.plante)+'</div>'+
      '<div><span class="discret">Le casque</span>'+teintes('casque',PAL.casque)+'</div>'+
      '<div><span class="discret">Les étagères</span>'+bascule('etagere',F.styles.etagere)+teintes('bois',PAL.bois)+'</div>'+
      '<div><span class="discret">Les livres des étagères</span>'+palettes('livres',PAL.livres)+'</div></div>'+
      '<div><button type="button" class="btn fantome petit" data-bureau-defaut>Revenir au bureau d\'origine</button></div></div>'+
      (P().masque('decor')?'<p class="discret pleine-largeur">Le décor du bureau est masqué (dans « Mon compte », rubrique Affichage) : ces choix s\'appliqueront quand tu le réafficheras.</p>':'');
    apercuBureau(el.querySelector('#apercu-bureau'));
    el.querySelector('[data-bureau-defaut]').addEventListener('click',()=>{ P().ecrire('bureau',{}); B().bureau.rafraichir(); construire(); }); }
  /* le bureau peint : des vignettes pour les styles et les compagnons, des pastilles pour
     les couleurs. Tout vient de pack-bureau.js ; une valeur absente retombe sur la première. */
  function construirePeint(){ const F=window.FOND_BUREAU, PK=window.PACK_BUREAU, BP=B().bureau.peint, r=BP.reglages(), N=PK.noms||{};
    const nom=k=>N[k]||k, src=s=>lien(BP.IMG+s);
    const bascule=(cle,liste)=>'<div class="bascule" data-bureau="peint.'+cle+'">'+liste.map(([k,t])=>'<button type="button" data-v="'+k+'" aria-pressed="'+(r[cle]===k)+'">'+echap(t)+'</button>').join('')+'</div>';
    const vignettes=(cle,liste)=>'<div class="vignettes" data-bureau="peint.'+cle+'">'+liste.map(([k,t,image])=>'<button type="button" data-v="'+k+'" aria-pressed="'+(r[cle]===k)+'" title="'+echap(t)+'">'+(image?'<img src="'+src(image)+'" alt="" loading="lazy">':'<span class="aucun" aria-hidden="true">∅</span>')+'<span>'+echap(t)+'</span></button>').join('')+'</div>';
    const teintes=(cle,ids)=>'<div class="pastilles" data-bureau="peint.'+cle+'">'+ids.map(k=>'<button type="button" style="background:'+((PK.couleurs||{})[k]||'#999')+'" data-v="'+k+'" aria-pressed="'+(r[cle]===k)+'" aria-label="'+echap(nom(k))+'" title="'+echap(nom(k))+'"></button>').join('')+'</div>';
    // un objet : ses styles en vignettes (dans la couleur choisie si elle existe), puis ses couleurs
    const objet=(cat,cleStyle,cleCouleur,titre)=>{ const O=PK.objets[cat]||{}; const styles=Object.keys(O); if(!styles.length) return '';
      const st=O[r[cleStyle]]?r[cleStyle]:styles[0];
      const v=vignettes(cleStyle,styles.map(s=>{ const e=BP.piece(PK,cat,s,cleCouleur?r[cleCouleur]:''); return [s,nom(s),e&&e.images.midi]; }));
      const couleurs=cleCouleur?Object.keys(O[st]).filter(k=>k!=='unique'):[];
      return '<div><span class="discret">'+titre+'</span>'+v+(couleurs.length>1?teintes(cleCouleur,couleurs):'')+'</div>'; };
    const compagnons=Object.keys(PK.compagnons||{}).length?[['aucun','Aucun',null]].concat(Object.entries(PK.compagnons).map(([k,e])=>[k,nom(k),e.images.midi])):null;
    const decos=[['aucune','Rien',null]].concat(Object.entries(PK.etageres).map(([k,e])=>[k,nom(k),e.images.midi]));
    const S=BP.scene(PK,r), amb=S.cle!=='base';
    el.innerHTML='<div class="apercu-bureau ap-peint" id="apercu-bureau" aria-hidden="true"></div><div class="options">'+
      '<div><span class="discret">Le style du décor</span>'+boutonsVues(F,B().bureau.reglages())+'</div>'+
      '<p class="discret">L\'ambiance, la vue par la fenêtre et la lumière se choisissent dans <a href="#decor">« Le décor »</a>, juste au-dessus.</p>'+
      (amb?'<p class="discret">Dans l\'ambiance « '+echap(S.nom)+' », la lampe, la tasse, le casque, les livres, le pot, la plante et les étagères sont ceux de l\'ambiance. Pour choisir les tiens, reviens à l\'ambiance « Lofi ».</p>':
      objet('lampe','lampe','lampeCouleur','La lampe')+objet('casque','casque','casqueCouleur','Le casque')+objet('tasse','tasse','tasseCouleur','La tasse')+
      objet('pot','pot','potCouleur','Le pot à crayons')+objet('livres','livres','','Les livres')+objet('plante','plante','','La plante'))+
      (compagnons?'<div><span class="discret">Le compagnon, sur le rebord de la fenêtre (la nuit, les chats dorment)</span>'+vignettes('compagnon',compagnons)+'</div>':'')+
      (amb?'':'<div><span class="discret">L\'étagère de gauche</span>'+vignettes('etagereG',decos)+'</div>'+
      '<div><span class="discret">L\'étagère de droite</span>'+vignettes('etagereD',decos)+'</div>')+
      '<div><button type="button" class="btn fantome petit" data-bureau-defaut>Revenir au bureau d\'origine</button></div></div>'+
      '<p class="discret pleine-largeur mention-provisoire"><strong>Décor provisoire.</strong> Ce bureau lofi a été généré avec une IA (les modèles d\'image d\'OpenAI) pour le prototype, puis mis à l\'échelle et teinté ; il sera remplacé par une illustration faite à la main avant l\'ouverture du site. Les vues « Douce » et « Marquée » sont le décor dessiné d\'avant.</p>'+
      (P().masque('decor')?'<p class="discret pleine-largeur">Le décor du bureau est masqué (dans « Mon compte », rubrique Affichage) : ces choix s\'appliqueront quand tu le réafficheras.</p>':'');
    apercuBureau(el.querySelector('#apercu-bureau'));
    el.querySelector('[data-bureau-defaut]').addEventListener('click',()=>{ P().ecrire('bureau',{}); B().bureau.rafraichir(); construire(); }); }
  el._construire=()=>{ if(B().bureau.reglages().vue==='peint') B().bureau.chargerPack(construire); else B().bureau.chargerSvg(construire); };
  // les deux fichiers servent : fond-bureau.js pour la liste des vues, pack-bureau.js pour le bureau peint
  B().bureau.chargerSvg(()=>B().bureau.chargerPack(construire)); }
/* l'aperçu du bureau lofi : la scène entière du moment, les décorations sur leurs étagères,
   les objets à la place qu'ils ont sur un écran de 1920 px, une feuille pour le classeur */
function apercuPeint(el){ const PK=window.PACK_BUREAU, BP=B().bureau.peint, r=BP.reglages(), S=BP.scene(PK,r), moment=BP.moment(r), nuit=moment==='nuit', [W,H]=PK.cadre;
  const pc=(v,t)=>(100*v/t).toFixed(3)+'%';
  const img=(s,cls,style)=>'<img class="'+cls+'" src="'+lien(BP.IMG+s)+'" alt="" style="'+style+'">';
  let h=BP.filtres(S)+img(S.decors[moment],'ap-decor','');
  const vue=(S.vues||{})[r.paysage]; if(vue&&vue[moment]){ const v=PK.vues_boite; h+=img(vue[moment],'','left:'+pc(v[0],W)+';top:'+pc(v[1],H)+';width:'+pc(v[2]-v[0],W)); }
  const E=PK.geometrie.etageres, decale=((E.gauche.x1+E.gauche.x2)-(E.droite.x1+E.droite.x2))/2;
  [['etagereD',0,'d'],['etagereG',decale,'g']].forEach(([cle,dx,cote])=>{ const e=S.etageres?S.etageres[cote]:PK.etageres[r[cle]]; if(!e) return; const b=e.boite;
    h+=img(e.images.midi,'','left:'+pc(b[0]+dx,W)+';top:'+pc(b[1],H)+';width:'+pc(b[2],W)+';'+BP.teinte(moment,cote)+(cote==='g'?';transform:scaleX(-1)':'')); });
  const C=(PK.compagnons||{})[r.compagnon]; if(C){ const v=BP.vue(C,nuit), b=v.boite;
    h+=img(v.src,v.allumee?'fb-dort':'','left:'+pc(b[0],W)+';top:'+pc(b[1],H)+';width:'+pc(b[2],W)+';'+(v.allumee?'':BP.teinte(moment,'g'))); }
  [['lampe',r.lampe,r.lampeCouleur],['tasse',r.tasse,r.tasseCouleur],['casque',r.casque,r.casqueCouleur],['pot',r.pot,r.potCouleur],['livres',r.livres,''],['plante',r.plante,'']]
    .forEach(([cat,st,c])=>{ const e=BP.pieceScene(PK,S,cat,st,c); if(!e) return; const v=BP.vue(e,nuit), b=v.boite, cont=v.contact||[b[2]*.2,b[2]*.8], l=cont[1]-cont[0];
      h+='<i class="ap-ombre" style="left:'+pc(b[0]+cont[0]-l*.12,W)+';width:'+pc(l*1.24,W)+';top:'+pc(b[1]+v.appui[1],H)+'"></i>';
      h+=img(v.src,'','left:'+pc(b[0],W)+';top:'+pc(b[1],H)+';width:'+pc(b[2],W)+';'+(v.allumee?'':BP.teinte(moment,e.cote)));
      if(v.allumee&&e.lueur){ const rr=Math.max(b[2],b[3])*1.15; h+='<i class="ap-lueur" style="left:'+pc(b[0]+e.lueur[0]-rr,W)+';top:'+pc(b[1]+e.lueur[1]-rr,H)+';width:'+pc(2*rr,W)+';height:'+pc(2*rr,H)+'"></i>'; } });
  h+='<div class="ap-feuille" style="top:'+pc(PK.geometrie.jonction+20,H)+'"><i></i><i></i><i></i></div>';
  el.classList.add('ap-peint','fb-peint'); el.dataset.moment=moment; el.innerHTML=h; }
/* la rangée des vues : le bureau lofi d'abord, puis les vues dessinées et les ambiances */
function boutonsVues(F,r){
  return '<div class="bascule" data-bureau="vue"><button type="button" data-v="peint" aria-pressed="'+(r.vue==='peint')+'" title="Le bureau peint, style lofi (décor provisoire)">Lofi</button>'+
    Object.entries(F.vues).filter(([k,d])=>!d.ambiance||!(window.PACK_BUREAU&&window.PACK_BUREAU.ambiances&&window.PACK_BUREAU.ambiances[k])).map(([k,d])=>'<button type="button" data-v="'+k+'" aria-pressed="'+(r.vue===k)+'"'+(d.legende?' title="'+echap(d.legende)+'"':'')+'>'+echap(d.nom)+'</button>').join('')+'</div>'; }
/* l'aperçu : la scène de la vue choisie, une feuille pour figurer le classeur, et les objets
   aux places qu'ils ont sur un grand écran. Les couleurs suivent les jetons, donc le thème. */
function apercuBureau(el){ if(el&&B().bureau.reglages().vue==='peint'){ if(window.PACK_BUREAU) apercuPeint(el); else B().bureau.chargerPack(()=>apercuBureau(el)); return; }
  const F=window.FOND_BUREAU; if(!el||!F) return;
  el.classList.remove('ap-peint','fb-peint');
  const r=B().bureau.reglages(), G=F.vues[r.vue]||F.vues.douce, J=G.jonction, fk=G.fk;
  if(G.ambiance&&!window.FOND_AMBIANCES){ B().bureau.chargerAmbiances(()=>apercuBureau(el)); return; }
  const amb= G.ambiance ? window.FOND_AMBIANCES.ambiances[r.vue] : null;
  const pc=(x,tot)=>(100*x/tot).toFixed(2)+'%';
  const dessin=nom=>{ if(amb) return amb.objets[nom]; const o=F.objets[nom]; return typeof o==='string'?o:(o[r[nom]]||Object.values(o)[0]); };
  const obj=(nom,style)=>'<div class="ap-obj" data-objet="'+nom+'" style="'+style+'">'+dessin(nom)+'</div>';
  el.innerHTML=(amb?window.FOND_AMBIANCES.scenes[r.vue]:(F.scenes[r.vue]||F.scenes.douce))+
    (amb?'':'<div class="fb-fenetre" style="left:'+pc(640-430*fk,1280)+';top:'+pc(J-6-300*fk,800)+';width:'+pc(720*fk,1280)+';height:'+pc(300*fk,800)+'"></div>')+
    '<div class="ap-sousmain" style="top:'+pc(J-4,800)+'"></div><div class="ap-feuille" style="top:'+pc(J+10,800)+'"><i></i><i></i><i></i></div>'+
    obj('lampe','right:1%;top:'+pc(J-150,800)+';width:22%')+obj('pot','left:7%;top:'+pc(J-120,800)+';width:9%')+
    obj('livres','left:3%;top:52%;width:15%')+obj('plante','left:1%;bottom:-4%;width:21%')+
    obj('tasse','right:10%;top:58%;width:12%')+obj('casque','right:3%;bottom:0;width:17%');
  el.dataset.fbEtagere=r.etagere; }

window.Pages={index:Index,matiere:Matiere,apprendre:Apprendre,plusloin:PlusLoin,aide:Aide,compte:Compte,carnet:CarnetPage,personnalisation:Personnalisation};
})();
