/* =====================================================================
   LES ESPACES PARENT ET PROFESSEUR — parent.html et prof.html
   Même disposition que le classeur de l'élève : la colonne de gauche
   porte les enfants (parent) ou les classes (professeur), puis les
   rubriques. Les données de la famille et de la classe sont FICTIVES ;
   seule la progression de Léa, l'élève qui teste, vient de la mémoire
   locale du navigateur. Ce que chacun voit est affiché noir sur blanc.
   ===================================================================== */
(function(){
"use strict";
const P=()=>window.Pupitre, S=()=>window.Site, B=()=>window.Bureau;
const echap=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const lien=p=>S().racine+p;
const JOURS=['L','M','M','J','V','S','D'];
const h=m=>m>=60?Math.floor(m/60)+' h '+(m%60?String(m%60).padStart(2,'0'):''):m+' min';

/* ---------- les données de démonstration ---------- */
const ENFANTS={
  lea:{prenom:'Léa',niveau:'Seconde',classe:'2de 4',prof:'Mme Roux',minutes:[35,0,50,25,0,0,0],
    chapitre:{titre:'Notion de fonction',simple:'Une fonction, c\'est une machine qui transforme un nombre en un autre. Léa apprend à lire sur une courbe quel nombre entre, quel nombre sort, et à retrouver l\'un à partir de l\'autre.',lien:'maths/seconde/fonctions.html'},
    matieres:[['Mathématiques',68,'progres','en progrès'],['Physique-chimie',54,'stable','stable'],['SVT',41,'soutenir','à soutenir']],
    echeances:[['Vendredi','DS de mathématiques','chapitres « Notion de fonction » et « Vecteurs » · annoncé par Mme Roux'],['Mardi prochain','TP de physique-chimie','mesure de longueur d\'onde · M. Diallo'],['Dans deux semaines','Contrôle de SVT','la cellule · Mme Perrin']],
    conseils:[['Demande-lui d\'expliquer','« C\'est quoi, un antécédent ? » Expliquer avec ses mots, c\'est ancrer. Pas besoin de connaître la réponse.'],['Samedi matin est libre','Un contrôle blanc de 30 minutes, sans téléphone à côté, y trouverait sa place. Le site en fabrique un en deux clics.'],['Encourage l\'effort, pas la note','« Tu as cherché seule avant de demander un indice » vaut plus que « tu as eu 14 ». L\'indicateur d\'autonomie est là pour ça.']]},
  tom:{prenom:'Tom',niveau:'Quatrième',classe:'4e B',prof:'M. Lopez',minutes:[20,15,0,30,10,0,0],
    chapitre:{titre:'Calcul littéral',simple:'Tom apprend à écrire des formules avec des lettres, pour calculer un prix ou un nombre d\'allumettes sans refaire le calcul à chaque fois. Le plus dur : réduire une expression sans se tromper de signe.',lien:'maths/quatrieme/calcul-litteral.html'},
    matieres:[['Mathématiques',72,'progres','en progrès'],['Français',60,'stable','stable'],['Histoire-géographie',58,'progres','en progrès']],
    echeances:[['Jeudi','Interrogation de maths','réduire et développer · M. Lopez'],['Lundi prochain','Dictée','Mme Garnier']],
    conseils:[['Dix minutes, pas une heure','En quatrième, quatre séances courtes valent mieux qu\'une longue. Le minuteur 25 / 5 du site l\'aide à s\'arrêter.'],['Le labo des allumettes','Demande-lui de te montrer le labo « Les motifs qui grandissent » : expliquer un motif, c\'est comprendre la formule.'],['Le signe moins','Son erreur la plus fréquente est un signe oublié devant une parenthèse. Le tuteur la repère ; toi, tu peux juste demander « et le signe ? ».']]},
};
const CLASSES={
  '2de4':{nom:'2de 4',code:'4K7P',niveau:'Seconde',n:26,actifs:19,reussite:64,temps:100,controle:'DS vendredi · fonctions et vecteurs',matiere:'maths',chapitres:['fonctions','vecteurs'],
    lacunes:[['Image et antécédent sur une courbe','fonctions/c-lire',46,'confondre l\'axe des abscisses et celui des ordonnées','Lire une image et un antécédent'],['Somme de vecteurs','vecteurs/c-somme',31,'placer le second vecteur à l\'origine du premier au lieu de bout à bout','Reconstituer une somme (labo)'],['Résoudre f(x) = k','fonctions/c-antecedents',27,'oublier de changer le signe en changeant de membre','Antécédent avec le tuteur']],
    coup:[['Nadia, Yanis, Inès','bloqués sur « image et antécédent » depuis deux séances'],['Hugo, Clara','aucune activité depuis 5 jours'],['Léa','beaucoup d\'indices demandés cette semaine : encourage-la à attendre un peu avant de cliquer']],
    eleves:['Adam','Amina','Clara','Elias','Hugo','Inès','Jade','Léa','Louis','Maël','Nadia','Yanis'],
    competences:['Image','Antécédent','Courbe','Somme de vecteurs','Produit par un réel']},
  'tle':{nom:'Terminale spé 2',code:'7MQ2',niveau:'Terminale',n:31,actifs:24,reussite:58,temps:140,controle:'Bac blanc dans 3 semaines',matiere:'maths',chapitres:['espace-vecteurs','limites-comp'],
    lacunes:[['Vecteurs coplanaires','espace-vecteurs/c-coplanaires',38,'conclure « coplanaires » dès que deux vecteurs sont colinéaires','Coplanaires ou base ? (labo)'],['Représentation paramétrique','espace-vecteurs/c-param',29,'confondre le point et le vecteur directeur','La droite en marche (labo)'],['Limite par comparaison','limites-comp/c-comparaison',24,'majorer au lieu de minorer','Les gendarmes (labo)']],
    coup:[['Sarah, Bilal','bloqués sur « coplanaires » depuis la semaine dernière'],['Théo','aucune activité depuis 8 jours'],['Lina','beaucoup d\'indices sur les représentations paramétriques']],
    eleves:['Anna','Bilal','Chloé','Enzo','Gabriel','Lina','Manon','Noah','Rayan','Sarah','Théo','Zoé'],
    competences:['Coplanaires','Paramétrique','Droite et plan','Limite d\'une suite','Comparaison']},
};

/* ---------- le carnet, côté parent : tout, en lecture ----------
   Le parent voit exactement ce que l'élève reçoit de ses professeurs — une rubrique par
   professeur — sans pouvoir rien cocher ni rien répondre. Pour Léa, ce sont les vraies
   données locales ; pour Tom, l'espace est fictif, comme le reste. */
function carnetParent(E,local){ const K=window.Carnet;
  if(!local||!K) return '<section id="echeances"><h2>Carnet des professeurs</h2><ul class="conseils">'+E.echeances.map(e=>'<li><b>'+echap(e[0])+' · '+echap(e[1])+'</b><span>'+echap(e[2])+'</span></li>').join('')+'</ul><p class="discret">Ce que les professeurs de '+echap(E.prenom)+' lui envoient, en lecture. Jamais de note.</p></section>';
  const rub=K.tout();
  return '<section id="echeances"><h2>Carnet des professeurs <span class="discret">· en lecture, le même que celui de '+echap(E.prenom)+'</span></h2>'+
    (rub.length?rub.map(r=>K.rendreRubrique(r,{lecture:true})).join(''):'<p class="discret">'+echap(E.prenom)+' n\'a rejoint aucune classe pour l\'instant. Un professeur ne peut rien lui envoyer sans qu\'il ait accepté son lien de classe.</p>')+
    '<p class="discret">Les professeurs n\'écrivent pas librement : ils désignent un exercice, un point de cours, une date, ou choisissent un message dans une liste. Jamais de note.</p></section>';
}

/* ---------- l'espace parent ---------- */
function Parent(body){ const p=P(), m=body.querySelector('#espace'); if(!m) return; let enfant='lea';
  function peindre(){ const E=ENFANTS[enfant]; const local= enfant==='lea';
    const jours= JOURS.map((j,i)=>({jour:j,actif:E.minutes[i]>0||(local&&p.joursSemaine()[i].actif),futur:local&&p.joursSemaine()[i].futur}));
    const minutes=E.minutes.slice(); if(local){ const a=p.lire('activite',{minutes:0}); const i=(new Date().getDay()+6)%7; minutes[i]=Math.max(minutes[i],Math.round(a.minutes)); }
    const total=minutes.reduce((a,b)=>a+b,0); const auto=local?p.autonomie():{taux:null}; const d=local?p.dernierePage():null;
    const titre=document.getElementById('titre-parent'); if(titre) titre.textContent=E.prenom+', cette semaine';
    // la prochaine échéance : celle du carnet pour Léa (données locales), fictive pour Tom
    const proch=(()=>{ if(local&&window.Carnet){ const e=window.Carnet.echeancesAVenir()[0]; return e?[window.Carnet.dateFr(e.echeance),window.Carnet.libelleCible(e)]:['—','aucune échéance annoncée']; } return [E.echeances[0][0],E.echeances[0][1]]; })();
    m.innerHTML='<section id="ensemble"><h2>Vue d\'ensemble</h2><div class="chiffres">'+
      '<div class="chiffre"><b>'+jours.filter(j=>j.actif).length+'</b><small>jours actifs cette semaine</small></div><div class="chiffre"><b>'+h(total)+'</b><small>de travail cette semaine</small></div><div class="chiffre"><b>'+(auto.taux==null?'—':auto.taux+' %')+'</b><small>réussite sans aide (exercices guidés)</small></div><div class="chiffre"><b>'+echap(proch[0])+'</b><small>'+echap(proch[1])+'</small></div></div>'+
      '<div class="colonnes"><div class="carte"><h3>Le temps de travail, jour par jour</h3><div class="barres-jours">'+minutes.map((mn,i)=>'<div class="b'+(mn?'':' vide')+'" title="'+mn+' min"><i style="--h:'+Math.max(4,mn/Math.max(60,...minutes)*100)+'%"></i><small>'+JOURS[i]+'</small></div>').join('')+'</div><p class="discret">Le temps est une indication, pas un objectif : un jour manqué ne fait rien perdre, et aucune récompense n\'est liée au temps passé.</p></div>'+
      '<div class="carte"><h3>Le chapitre en cours</h3><strong>'+echap(d?d.titre:E.chapitre.titre)+'</strong><p>'+echap(E.chapitre.simple)+'</p><p><a href="'+lien(E.chapitre.lien)+'">Voir le chapitre tel que '+echap(E.prenom)+' le voit</a></p></div></div>'+
      '<div class="colonnes"><div class="carte"><h3>Réussite et tendance par matière</h3><ul class="tendances">'+E.matieres.map(x=>'<li><span>'+echap(x[0])+'</span><span class="jauge"><i style="--p:'+x[1]+'%"></i></span><span class="tendance '+(x[2]==='progres'?'plus':x[2]==='soutenir'?'moins':'')+'">'+x[1]+' % · '+echap(x[3])+'</span></li>').join('')+'</ul><p class="discret">Toujours comparé à '+echap(E.prenom)+' lui-même, jamais aux autres élèves.</p></div>'+
      '<div class="carte"><h3>Trois conseils pour accompagner</h3><ul class="conseils">'+E.conseils.map(c=>'<li><b>'+echap(c[0])+'</b><span>'+echap(c[1])+'</span></li>').join('')+'</ul></div></div></section>'+
      carnetParent(E,local)+
      '<section id="reglages"><h2>Réglages de suivi</h2><div class="reglages-liste">'+
        '<div class="reglage"><div><strong>Résumé par mail, le dimanche</strong><small>Jours actifs, chapitre en cours, échéances de la semaine suivante. Jamais de note ni de réponse. Coupé par défaut, se désactive en un clic depuis le mail.</small></div><label class="interrupteur"><input type="checkbox" data-mail '+(p.lire('mail-parent',false)?'checked':'')+'><span class="piste" aria-hidden="true"></span><span class="sr">Résumé par mail</span></label></div>'+
        '<div class="reglage"><div><strong>IA du tuteur</strong><small>Avec IA, le tuteur pose des questions et donne des indices adaptés. Sans IA, il continue avec les indices du vérificateur. '+echap(E.prenom)+' voit ce réglage sur son interrupteur, avec l\'explication.</small></div><label class="interrupteur"><input type="checkbox" data-ia '+(!p.lire('ia-parent',false)?'checked':'')+'><span class="piste" aria-hidden="true"></span><span class="sr">IA du tuteur autorisée</span></label></div>'+
        '<div class="reglage"><div><strong>Matières suivies</strong><small>Tu peux ne garder qu\'un résumé d\'une ligne, ou ne pas suivre une matière.</small></div><div class="ligne">'+E.matieres.map(x=>'<label class="interrupteur leger"><input type="checkbox" checked><span class="piste" aria-hidden="true"></span>'+echap(x[0])+'</label>').join('')+'</div></div>'+
        '<div class="reglage"><div><strong>« L\'IA et votre enfant »</strong><small>Ce qui est autorisé, ce qui aide, ce qui nuit, comment en parler à la maison. Page traduite comme le reste de l\'espace parent.</small></div><span class="discret">à venir</span></div></div></section>'+
      '<section class="transparence" id="transparence"><h2>Ce que je vois de mon enfant</h2><p>Affiché noir sur blanc, de ton côté comme du sien. '+echap(E.prenom)+' voit cet écran en permanence.</p><ul><li><span class="oui">✓</span> le temps de travail, jour par jour</li><li><span class="oui">✓</span> le chapitre en cours et la progression</li><li><span class="oui">✓</span> la réussite par matière, sa tendance, l\'indicateur d\'autonomie</li><li><span class="oui">✓</span> tout le carnet des professeurs, en lecture : échéances, exercices conseillés, points de cours, messages</li><li><span class="non">✗</span> les réponses détaillées</li><li><span class="non">✗</span> les échanges avec le tuteur</li><li><span class="non">✗</span> les brouillons</li><li><span class="non">✗</span> la musique, l\'avatar, les succès (sauf si '+echap(E.prenom)+' choisit de les montrer)</li></ul></section>';
    m.querySelector('[data-ia]').addEventListener('change',e=>{ p.ecrire('ia-parent',!e.target.checked); B().toast(e.target.checked?'<strong>IA du tuteur autorisée.</strong><span>'+echap(E.prenom)+' le voit sur son interrupteur.</span>':'<strong>IA du tuteur coupée.</strong><span>'+echap(E.prenom)+' voit l\'interrupteur grisé, avec l\'explication. Le tuteur continue sans IA.</span>'); });
    m.querySelector('[data-mail]').addEventListener('change',e=>{ p.ecrire('mail-parent',e.target.checked); });
    if(location.hash){ const t=document.getElementById(location.hash.slice(1)); if(t) setTimeout(()=>t.scrollIntoView({block:'start'}),50); } }
  document.addEventListener('click',e=>{ const a=e.target.closest('[data-enfant]'); if(!a) return; e.preventDefault(); enfant=a.dataset.enfant; document.querySelectorAll('[data-enfant]').forEach(x=>{ x.classList.toggle('courant',x===a); x.setAttribute('aria-current',x===a?'page':'false'); }); peindre(); window.scrollTo({top:0,behavior:'smooth'}); });
  peindre(); }

/* ---------- le carnet, côté professeur ----------
   Ce que le professeur envoie à ses élèves. Quatre formes, et pas de texte libre : un
   exercice précis, un point de cours précis, une échéance datée, un message choisi dans
   le catalogue de carnet.js. Les cibles (sections, exercices) sont lues dans la page du
   chapitre elle-même, au moment où le professeur la choisit. */
function chapitresDe(matiereId){ const mm=(window.MATIERES||[]).find(x=>x.id===matiereId); if(!mm) return []; return (mm.niveaux||[]).flatMap(n=>n.chapitres.filter(c=>c.fichier).map(c=>Object.assign({niveau:n.nom},c))); }
function carnetProf(C){ const K=window.Carnet, Dv=window.Devoirs; if(!K) return '';
  const comps=Dv?Dv.compositions().filter(c=>c.fiches&&c.fiches.length):[];
  const envois=K.trier(K.items(C.code));
  const chs=chapitresDe(C.matiere);
  const optChap=chs.map(c=>'<option value="'+echap(c.id)+'">'+echap(c.titre)+' · '+echap(c.niveau)+'</option>').join('');
  return '<section id="carnet-prof"><h2>Carnet des élèves <span class="discret">· ce qu\'ils reçoivent de toi, à sens unique</span></h2>'+
    '<p class="discret">Chaque élève de la classe le voit dans son carnet, sous ton nom. Pas de texte libre : tu désignes un exercice, un point du cours, une date, un devoir composé dans la banque, ou tu choisis un message dans la liste. C\'est ce qui rend le carnet sûr pour des mineurs, et lisible par leurs parents.</p>'+
    '<form class="carte publier" data-envoi><h3>Envoyer</h3>'+
      '<label>Quoi<br><select name="type" class="champ-saisie"><option value="exercice">Un exercice conseillé</option><option value="cours">Un point de cours à revoir</option><option value="echeance">Une échéance (contrôle, rendu, oral…)</option><option value="devoir">Un devoir de la banque (séance ou DM)</option><option value="message">Un message de la liste</option></select></label>'+
      '<div data-si="exercice cours"><label>Chapitre<br><select name="chapitre" class="champ-saisie"><option value="">— choisir —</option>'+optChap+'</select></label>'+
        '<label data-si="exercice">Exercice<br><select name="exercice" class="champ-saisie" disabled><option value="">— choisis d\'abord un chapitre —</option></select></label>'+
        '<label data-si="cours">Section du cours<br><select name="section" class="champ-saisie" disabled><option value="">— choisis d\'abord un chapitre —</option></select></label></div>'+
      '<div data-si="echeance"><div class="colonnes"><label>Nature<br><select name="nature" class="champ-saisie">'+K.NATURES.map(n=>'<option value="'+n[0]+'">'+echap(n[1])+'</option>').join('')+'</select></label><label>Date<br><input type="date" name="echeance" min="'+K.aujourdhui()+'" class="champ-saisie"></label></div>'+
        '<fieldset class="chapitres-coches"><legend>Chapitres concernés</legend>'+chs.map(c=>'<label><input type="checkbox" name="chapitres" value="'+echap(c.id)+'">'+echap(c.titre)+'</label>').join('')+'</fieldset></div>'+
      '<div data-si="devoir">'+(comps.length?'<div class="colonnes"><label>Composition<br><select name="composition" class="champ-saisie"><option value="">— choisir —</option>'+comps.map(c=>'<option value="'+echap(c.id)+'">'+echap(Dv.titre(Object.assign({},c,{echeance:''})))+' · '+c.fiches.length+' exercice'+(c.fiches.length>1?'s':'')+'</option>').join('')+'</select></label>'+
          '<label>Pour le<br><input type="date" name="echeance-devoir" min="'+K.aujourdhui()+'" class="champ-saisie"></label></div>':
          '<p class="discret">Aucune composition enregistrée pour l\'instant.</p>')+
        '<p class="discret">Les élèves reçoivent la liste des exercices et tes réglages ; le lien ne dit rien d\'eux. <a href="'+lien('banque.html')+'">Composer dans la banque d\'exercices</a></p></div>'+
      '<label data-si="exercice cours devoir message">'+'<span data-si="message">Message</span><span data-si="exercice cours devoir">Un mot pour accompagner <span class="discret">(facultatif)</span></span><br><select name="message" class="champ-saisie"><option value="">— aucun —</option>'+K.MESSAGES.map(x=>'<option value="'+x[0]+'">'+echap(x[1])+'</option>').join('')+'</select></label>'+
      '<div class="ligne"><button class="btn" type="submit">Envoyer à la classe</button><span class="discret">Visible par chaque élève et, en lecture, par ses parents.</span></div></form>'+
    '<h3 class="titre-suite">Déjà envoyé <span class="discret">· '+envois.length+'</span></h3>'+
    (envois.length?'<ul class="carnet-liste" data-code="'+echap(C.code)+'">'+envois.map(it=>K.rendreItem(it,{retirer:true})).join('')+'</ul>':'<p class="discret">Rien encore. Ce que tu envoies apparaît ici, et tu peux le retirer.</p>')+
    '</section>';
}
function brancherCarnetProf(m,C,peindre){ const K=window.Carnet; if(!K) return;
  const f=m.querySelector('[data-envoi]'); if(!f) return;
  const montrer=()=>{ const type=f.type.value; f.querySelectorAll('[data-si]').forEach(el=>{ el.hidden=!el.dataset.si.split(' ').includes(type); }); };
  f.type.addEventListener('change',montrer); montrer();
  const voulue=new URLSearchParams(location.search).get('composition');
  if(voulue&&f.composition&&[...f.composition.options].some(o=>o.value===voulue)&&!f.dataset.prerempli){ f.dataset.prerempli='1';
    try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){}   // une fois : l'envoi suivant repart d'un formulaire vierge
    f.type.value='devoir'; montrer(); f.composition.value=voulue; const c=window.Devoirs.composition(voulue); if(c&&c.echeance&&c.echeance>=K.aujourdhui()) f['echeance-devoir'].value=c.echeance; }
  if(f.composition) f.composition.addEventListener('change',()=>{ const c=window.Devoirs.composition(f.composition.value); if(c&&c.echeance&&c.echeance>=K.aujourdhui()) f['echeance-devoir'].value=c.echeance; });
  // au choix d'un chapitre, on lit sa page pour proposer ses exercices et ses sections
  f.chapitre.addEventListener('change',async()=>{ const id=f.chapitre.value; const ch=chapitresDe(C.matiere).find(c=>c.id===id);
    const ex=f.exercice, se=f.section; ex.innerHTML='<option value="">— lecture du chapitre… —</option>'; se.innerHTML=ex.innerHTML; ex.disabled=se.disabled=true;
    if(!ch) return;
    try{ const html=await (await fetch(lien(ch.fichier))).text(); const doc=new DOMParser().parseFromString(html,'text/html');
      const slug=s=>'ex-'+s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      const exos=[...doc.querySelectorAll('article.exercice')].map((a,i)=>({id:a.id||slug(a.dataset.titre||'exercice-'+(i+1)),titre:(a.dataset.titre||'Exercice '+(i+1))+(a.dataset.niveau?' · niveau '+a.dataset.niveau:'')}));
      const secs=[...doc.querySelectorAll('#cours h3[id^="c-"]')].map(h=>({id:h.id,titre:h.textContent.replace(/\s+/g,' ').trim()}));
      ex.innerHTML='<option value="">— choisir —</option>'+exos.map(x=>'<option value="'+echap(x.id)+'">'+echap(x.titre)+'</option>').join('');
      se.innerHTML='<option value="">— choisir —</option>'+secs.map(x=>'<option value="'+echap(x.id)+'">'+echap(x.titre)+'</option>').join('');
      ex.disabled=!exos.length; se.disabled=!secs.length;
    }catch(e){ ex.innerHTML=se.innerHTML='<option value="">— chapitre illisible —</option>'; } });
  f.addEventListener('submit',e=>{ e.preventDefault(); const type=f.type.value; const item={type};
    const titreDe=sel=>{ const o=sel.options[sel.selectedIndex]; return o?o.textContent.replace(/ · niveau \d$/,''):''; };
    if(type==='exercice'){ if(!f.chapitre.value||!f.exercice.value) return B().toast('<strong>Il manque le chapitre ou l\'exercice.</strong>'); item.chapitre=f.chapitre.value; item.exercice={id:f.exercice.value,titre:titreDe(f.exercice)}; }
    if(type==='cours'){ if(!f.chapitre.value||!f.section.value) return B().toast('<strong>Il manque le chapitre ou la section.</strong>'); item.chapitre=f.chapitre.value; item.section={id:f.section.value,titre:titreDe(f.section)}; }
    if(type==='echeance'){ if(!f.echeance.value) return B().toast('<strong>Il manque la date.</strong>'); item.nature=f.nature.value; item.echeance=f.echeance.value; item.chapitres=[...f.querySelectorAll('[name=chapitres]:checked')].map(c=>c.value); }
    if(type==='devoir'){ const Dv=window.Devoirs, c=Dv&&f.composition&&Dv.composition(f.composition.value);
      if(!c) return B().toast('<strong>Choisis une composition.</strong><span>Elle se prépare dans la banque d\'exercices.</span>');
      const date=f['echeance-devoir'].value; if(!date) return B().toast('<strong>Il manque la date.</strong><span>Un devoir du carnet a toujours son échéance.</span>');
      item.devoir=Dv.normaliser(Object.assign({},c,{echeance:date})); item.echeance=date; item.chapitres=Dv.chapitres(item.devoir); }
    if(type==='message'){ if(!f.message.value) return B().toast('<strong>Choisis un message dans la liste.</strong>'); }
    if(f.message.value) item.message=f.message.value;
    K.publier(C.code,item);
    B().toast('<strong>Envoyé.</strong><span>Chaque élève de '+echap(C.nom)+' le voit dans son carnet.</span>');
    peindre(); const s=document.getElementById('carnet-prof'); if(s) s.scrollIntoView({block:'start'}); });
  if(m.dataset.carnetBranche) return; m.dataset.carnetBranche='1';
  m.addEventListener('click',e=>{ const r=e.target.closest('[data-retirer]'); if(r){ K.retirer(r.closest('[data-code]')?r.closest('[data-code]').dataset.code:C.code,r.dataset.retirer); peindre(); const s=document.getElementById('carnet-prof'); if(s) s.scrollIntoView({block:'start'}); return; }
    const cp=e.target.closest('[data-copier]'); if(cp){ const inp=m.querySelector('[data-lien-classe]'); inp.select(); try{ navigator.clipboard.writeText(inp.value); B().toast('<strong>Lien copié.</strong><span>Donne-le à tes élèves : ils confirment, et c\'est tout.</span>'); }catch(err){ document.execCommand&&document.execCommand('copy'); } } });
}

/* ---------- l'espace professeur ---------- */
function Prof(body){ const p=P(), m=body.querySelector('#espace'); if(!m) return; let classe='2de4';
  const tous=()=>(window.MATIERES||[]).flatMap(mm=>(mm.niveaux||[]).flatMap(n=>n.chapitres.map(c=>Object.assign({niveau:n.nom},c))));
  function parcoursListe(){ return p.lire('parcours-prof',[{id:1,classe:'2de4',titre:'Lire une image et un antécédent',chapitre:'fonctions',pour:'toute la classe',avancement:62,echeance:'jeudi'},{id:2,classe:'2de4',titre:'Somme de vecteurs : trois labos puis le jeu',chapitre:'vecteurs',pour:'8 élèves',avancement:25,echeance:'vendredi'},{id:3,classe:'tle',titre:'Représentations paramétriques',chapitre:'espace-vecteurs',pour:'toute la classe',avancement:40,echeance:'lundi'}]); }
  function peindre(){ const C=CLASSES[classe]; const local= classe==='2de4';
    const titre=document.getElementById('titre-prof'); if(titre) titre.textContent=C.nom+' · vue d\'ensemble';
    const nc=p.lire('non-compris',[]); const signal=(id)=>{ const base={'fonctions/c-lire':9,'vecteurs/c-somme':5,'fonctions/c-antecedents':4,'espace-vecteurs/c-coplanaires':7,'espace-vecteurs/c-param':3,'limites-comp/c-comparaison':2}[id]||0; return base+(local&&nc.some(x=>x.startsWith(id.split('/')[0]))?1:0); };
    const pl=parcoursListe().filter(x=>x.classe===classe);
    const autoLea=p.autonomie();
    const lienClasse=window.Carnet?window.Carnet.lienRejoindre({code:C.code,prof:P().PROF.nom,matiere:C.matiere,classe:C.nom,niveau:C.niveau||''}):'';
    m.innerHTML='<section id="ensemble"><h2>Vue d\'ensemble · '+echap(C.nom)+'</h2>'+
      '<div class="carte lien-classe"><span class="surtitre">Lien de classe</span><p>Les élèves rejoignent ta classe en suivant ce lien. Ils voient ton nom, ta matière et le nom de la classe, puis confirment. Rien ne se passe sans leur clic, et ils peuvent quitter à tout moment.</p><div class="ligne"><input type="text" readonly value="'+echap(lienClasse)+'" data-lien-classe aria-label="Lien de classe"><button type="button" class="btn" data-copier>Copier le lien</button></div><p class="discret">Ce qu\'ils ne voient pas : les autres élèves de la classe, ni rien de ce que tu vois d\'eux. Code court, pour le dire à l\'oral : <code>'+C.code+'</code>.</p></div>'+
      '<div class="carte carte-banque"><span class="surtitre">Banque d\'exercices</span><p>Compose une séance ou un devoir maison avec les exercices corrigés des chapitres, puis donne-le sur papier, par un lien ou dans le carnet de la classe.</p><div class="ligne"><a class="btn" href="'+lien('banque.html')+'">Ouvrir la banque</a><span class="discret">'+(()=>{ const n=window.Devoirs?window.Devoirs.compositions().length:0; return n?n+' composition'+(n>1?'s':'')+' enregistrée'+(n>1?'s':''):'aucune composition pour l\'instant'; })()+'</span></div></div>'+
      '<div class="chiffres"><div class="chiffre"><b>'+C.actifs+' / '+C.n+'</b><small>élèves actifs cette semaine</small></div><div class="chiffre"><b>'+C.reussite+' %</b><small>réussite moyenne</small></div><div class="chiffre"><b>'+h(C.temps)+'</b><small>temps moyen par semaine</small></div><div class="chiffre"><b>'+echap(C.controle.split(' · ')[0])+'</b><small>'+echap(C.controle.split(' · ')[1]||'prochain contrôle')+'</small></div></div>'+
      '<div class="colonnes"><div class="pile"><h3>Les lacunes de la classe</h3><div class="lacunes">'+C.lacunes.map((l,i)=>{ const n=signal(l[1]); return '<div class="lacune"><strong>'+echap(l[0])+'</strong><span class="discret">'+l[2]+' % bloquent</span><span class="jauge"><i class="rose" style="--p:'+l[2]+'%"></i></span><span class="erreur">Erreur la plus fréquente : <b>'+echap(l[3])+'</b>'+(n>=3?' · <span title="Bouton « Je n\'ai pas compris », anonyme">🙋 '+n+' élèves ont signalé ne pas comprendre</span>':'')+'</span><div><button class="btn fantome" type="button" data-remediation="'+i+'">Proposer une remédiation</button></div></div>'; }).join('')+'</div></div>'+
      '<div class="pile"><h3>Parcours en cours</h3><div class="parcours-liste">'+(pl.length?pl.map(x=>'<div class="parcours-carte"><strong>'+echap(x.titre)+'</strong><span class="meta"><span>'+echap(x.pour)+'</span><span>pour '+echap(x.echeance)+'</span></span><div class="jauge"><i style="--p:'+x.avancement+'%"></i></div><span class="discret">'+x.avancement+' % des élèves concernés l\'ont terminé</span></div>').join(''):'<p class="discret">Aucun parcours en cours.</p>')+'</div>'+
      '<div class="coup-de-main"><strong>Un coup de main ? <span class="discret">visible par toi seul · jamais de classement</span></strong><ul>'+C.coup.map(c=>'<li><span><b>'+echap(c[0])+'</b> : '+echap(c[1])+'</span></li>').join('')+'</ul></div></div></div></section>'+
      '<section id="eleves"><h2>Élèves <span class="discret">· ceux qui ont rejoint la classe, par ordre alphabétique</span></h2><div class="tableau-eleves"><table><thead><tr><th>Élève</th>'+C.competences.map(c=>'<th>'+echap(c)+'</th>').join('')+'<th>Sans aide</th><th>Actif</th></tr></thead><tbody>'+
        C.eleves.map((e,i)=>{ const g=k=>{ const v=((i*7+k*3)%10); return v>=6?['✓','ok']:v>=3?['~','moyen']:['✗','ko']; }; const auto= (e==='Léa'&&local&&autoLea.taux!=null)?autoLea.taux:40+((i*13)%55); const actif= (e==='Léa'&&local)?p.joursSemaine().filter(j=>j.actif).length:((i*5)%6);
          return '<tr><td>'+echap(e)+(e==='Léa'&&local?' <span class="discret">(données locales)</span>':'')+'</td>'+C.competences.map((c,k)=>{ const r=g(k); return '<td class="c '+r[1]+'">'+r[0]+'</td>'; }).join('')+'<td class="auto">'+auto+' %</td><td class="auto">'+actif+' j</td></tr>'; }).join('')+'</tbody></table></div><p class="discret">✓ maîtrisé · ~ en cours · ✗ à travailler. « Sans aide » : la part d\'exercices guidés réussis sans indice, comparée à l\'élève lui-même. Aucun classement, aucune moyenne de classe affichée aux élèves.</p></section>'+
      '<section id="parcours"><h2>Parcours</h2><p class="discret">Un parcours assemble des éléments existants (cours, labos, exercices, jeu) pour toute la classe ou pour quelques élèves. L\'élève le voit dans son classeur ; il reste libre de l\'ordre.</p><form class="carte publier" data-nouveau-parcours><h3>Créer un parcours</h3><label>Titre<br><input type="text" name="titre" required placeholder="Par exemple : revoir les antécédents avant le DS" class="champ-saisie"></label><div class="colonnes"><label>Chapitre<br><select name="chapitre" class="champ-saisie">'+tous().filter(c=>c.fichier).map(c=>'<option value="'+c.id+'">'+echap(c.titre)+' · '+echap(c.niveau)+'</option>').join('')+'</select></label><label>Pour<br><select name="pour" class="champ-saisie"><option>toute la classe</option><option>les élèves bloqués</option><option>3 élèves choisis</option></select></label><label>Échéance<br><input type="text" name="echeance" placeholder="vendredi" class="champ-saisie"></label></div><div class="ligne"><label class="interrupteur"><input type="checkbox" checked><span class="piste" aria-hidden="true"></span>Cours</label><label class="interrupteur"><input type="checkbox" checked><span class="piste" aria-hidden="true"></span>Labos</label><label class="interrupteur"><input type="checkbox" checked><span class="piste" aria-hidden="true"></span>Exercices guidés</label><label class="interrupteur"><input type="checkbox"><span class="piste" aria-hidden="true"></span>Jeu</label></div><div><button class="btn" type="submit">Proposer ce parcours</button></div></form></section>'+
      carnetProf(C)+
      '<section id="mode-classe" class="mode-classe"><h2>Mode classe <span class="discret">· pour le vidéoprojecteur, sans aucune donnée d\'élève</span></h2><div class="outils"><div class="carte"><h3>Une question au hasard</h3><p class="discret">Tirée des générateurs du chapitre, à projeter ; la correction s\'affiche quand tu le décides.</p><label>Chapitre<br><select data-chap-proj class="champ-saisie">'+[['fonctions','Notion de fonction'],['vecteurs','Vecteurs (seconde)'],['calcul-litteral-4','Calcul littéral (4e)'],['espace-vecteurs','Vecteurs de l\'espace'],['limites-comp','Limites'],['diffraction-interferences','Diffraction et interférences']].map(c=>'<option value="'+c[0]+'">'+c[1]+'</option>').join('')+'</select></label><div><button class="btn" type="button" data-tirer>Tirer une question</button></div></div>'+
        '<div class="carte"><h3>Un minuteur visible par tous</h3><div class="chrono" data-chrono>05:00</div><div class="ligne"><button class="btn fantome" type="button" data-min="3">3 min</button><button class="btn fantome" type="button" data-min="5">5 min</button><button class="btn fantome" type="button" data-min="10">10 min</button><button class="btn" type="button" data-lancer>Lancer</button></div></div>'+
        '<div class="carte"><h3>Les labos en grand</h3><p class="discret">Chaque labo s\'ouvre dans le chapitre, manipulable au tableau.</p><p><a href="'+lien('maths/seconde/vecteurs.html#explorer')+'">Vecteurs : les quatre labos</a><br><a href="'+lien('maths/seconde/fonctions.html#cours')+'">Fonctions : le graphe interactif</a><br><a href="'+lien('physique-chimie/terminale/diffraction-interferences.html#explorer')+'">Diffraction : la cuve à ondes</a></p></div>'+
        '<div class="carte"><h3>« Corrige l\'IA » à l\'oral</h3><p class="discret">Une solution rédigée comme par une IA, avec une erreur à trouver ensemble.</p><blockquote class="copie-ia">« On développe et on réduit $3(x+5)-2(x-4)$. On obtient $3x+15-2x-8$, donc le résultat est $x+7$. »</blockquote><details><summary>Où est l\'erreur ?</summary><p>$-2\\times(-4)=+8$, pas $-8$. Le bon résultat est $x+23$.</p></details></div></div>'+
        '<div class="projection" data-projection aria-live="polite"><span class="surtitre sur-inverse">Projection</span><p>Choisis un chapitre et tire une question : elle s\'affiche ici, en grand, sans nom d\'élève.</p></div></section>'+
      '<section class="transparence" id="transparence"><h2>Ce que voient mes élèves de moi</h2><ul><li><span class="oui">✓</span> mon nom, ma matière, le nom de la classe</li><li><span class="oui">✓</span> ce que j\'envoie dans leur carnet : exercices conseillés, points de cours, échéances, devoirs composés dans la banque, messages choisis dans une liste — jamais de texte libre, et jamais de note, sauf celle d\'un devoir maison que je choisis de noter</li><li><span class="oui">✓</span> les parcours que je propose</li><li><span class="oui">✓</span> exactement ce que je vois d\'eux, avant même de rejoindre la classe</li><li><span class="non">✗</span> je n\'ai aucun droit sur leur compte : ni le créer, ni le modifier, ni changer un mot de passe</li><li><span class="non">✗</span> je ne vois jamais la classe d\'un autre professeur, ni un élève qui n\'a pas rejoint la mienne</li></ul></section>';
    S().maths(m);
    m.addEventListener('click',e=>{ const r=e.target.closest('[data-remediation]'); if(r){ const l=C.lacunes[+r.dataset.remediation]; const liste=parcoursListe(); liste.push({id:Date.now(),classe,titre:'Remédiation : '+l[4],chapitre:l[1].split('/')[0],pour:'les élèves bloqués ('+Math.round(C.n*l[2]/100)+')',avancement:0,echeance:'la semaine prochaine'}); p.ecrire('parcours-prof',liste); B().toast('<strong>Parcours proposé</strong><span>'+echap(l[4])+' · aux élèves bloqués. Ils le voient dans leur classeur.</span>'); peindre(); document.getElementById('ensemble').scrollIntoView({block:'start'}); } });
    m.querySelector('[data-nouveau-parcours]').addEventListener('submit',e=>{ e.preventDefault(); const f=e.target; const liste=parcoursListe(); const ch=tous().find(c=>c.id===f.chapitre.value); liste.push({id:Date.now(),classe,titre:f.titre.value.trim(),chapitre:f.chapitre.value,pour:f.pour.value,avancement:0,echeance:f.echeance.value||'sans échéance'}); p.ecrire('parcours-prof',liste); B().toast('<strong>Parcours créé</strong><span>'+echap(f.titre.value)+' · '+echap(ch?ch.titre:'')+'</span>'); peindre(); document.getElementById('ensemble').scrollIntoView({block:'start'}); });
    brancherCarnetProf(m,C,peindre);
    // minuteur
    let fin=0, timer=null, minutes=5; const aff=m.querySelector('[data-chrono]');
    m.querySelectorAll('[data-min]').forEach(b=>b.addEventListener('click',()=>{ minutes=+b.dataset.min; fin=0; clearInterval(timer); aff.textContent=String(minutes).padStart(2,'0')+':00'; }));
    m.querySelector('[data-lancer]').addEventListener('click',()=>{ fin=Date.now()+minutes*60e3; clearInterval(timer); timer=setInterval(()=>{ const r=Math.max(0,fin-Date.now()); const s=Math.ceil(r/1000); aff.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); if(r<=0){ clearInterval(timer); aff.textContent='Temps écoulé'; } },250); });
    // question au hasard
    m.querySelector('[data-tirer]').addEventListener('click',async()=>{ const id=m.querySelector('[data-chap-proj]').value; const gen={'fonctions':'fonctions','vecteurs':'vecteurs','calcul-litteral-4':'litteral','espace-vecteurs':'espace','limites-comp':'limites','diffraction-interferences':'ondes'}[id]; const proj=m.querySelector('[data-projection]');
      try{ await S().charger(S().racine+'assets/js/graphe.js'); await S().charger(S().racine+'assets/js/quiz.js'); await S().charger(S().racine+'assets/js/generateurs/'+gen+'.js'); }catch(err){ proj.innerHTML='<p>Générateur indisponible.</p>'; return; }
      const G=window.GENERATEURS[gen]; const types=G.ordre||Object.keys(G.types); const t=types[Math.floor(Math.random()*types.length)]; const q=G.types[t](); q.categorie=q.categorie||(G.categories||{})[t]||'';
      proj.innerHTML='<div class="corps-proj"></div><div class="ligne"><button class="btn fantome" type="button" data-correction>Afficher la correction</button><button class="btn fantome" type="button" data-tirer2>Autre question</button></div>';
      const d=proj.querySelector('.corps-proj'); window.Quiz.construireQuestion(d,q,()=>{});
      proj.querySelector('[data-correction]').addEventListener('click',()=>{ const rep= q.type==='qcm'?q.choix[q.reponse]:String(q.reponse).split('|')[0]; proj.querySelector('.corps-proj').insertAdjacentHTML('beforeend','<div class="retour bon"><span class="verdict">Réponse : '+rep+'</span>'+(q.explication?'<div>'+q.explication+'</div>':'')+'</div>'); S().maths(proj); });
      proj.querySelector('[data-tirer2]').addEventListener('click',()=>m.querySelector('[data-tirer]').click());
      S().maths(proj); if(window.Graphe) Graphe.init(proj); proj.scrollIntoView({block:'start',behavior:'smooth'}); });
    if(location.hash){ const t=document.getElementById(location.hash.slice(1)); if(t) setTimeout(()=>t.scrollIntoView({block:'start'}),50); } }
  document.addEventListener('click',e=>{ const a=e.target.closest('[data-classe]'); if(!a) return; e.preventDefault(); classe=a.dataset.classe; document.querySelectorAll('[data-classe]').forEach(x=>{ x.classList.toggle('courant',x===a); x.setAttribute('aria-current',x===a?'page':'false'); }); peindre(); window.scrollTo({top:0,behavior:'smooth'}); });
  peindre(); }

window.Pages=Object.assign(window.Pages||{},{parent:Parent,prof:Prof});
})();
