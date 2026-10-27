/* =====================================================================
   LA BANQUE D'EXERCICES — l'outil du professeur (banque.html)

   Chercher : les fiches de assets/js/banque.js (l'index fabriqué par
   outils/banque.py), filtrées par matière, niveau, chapitre, notion,
   difficulté, type, durée et calculatrice. Chaque fiche se déplie telle que
   l'élève la verra, clonée depuis la page de son chapitre (fiches.js).

   Composer : une séance ou un devoir maison, dans l'ordre voulu, avec ses
   réglages (coups de pouce, correction) et, pour un DM noté, un barème.
   Le titre se compose tout seul (devoirs.js) : pas de texte libre.

   Diffuser : une planche A4 (planche.html), un lien (devoir.html), ou un
   envoi « devoir » dans le carnet d'une classe (prof.html, le formulaire
   du carnet, qui reste le seul endroit d'où l'on envoie).

   Ses compositions, le professeur les retrouve, les duplique, les
   réutilise : clé « compositions » de Pupitre (une mémoire par compte), et
   « banque-brouillon » pour celle en cours. Sans serveur, les résultats des
   élèves ne remontent pas : l'écran le dit, et la saisie des notes d'un DM
   attend les comptes reliés.
   ===================================================================== */
(function(){
"use strict";
const S=()=>window.Site, D=()=>window.Devoirs, P=()=>window.Pupitre, B=()=>window.Bureau, F=()=>window.Fiches;
const echap=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TYPES=[['application','Application du cours'],['probleme','Problème'],['raisonnement','Raisonnement'],['corrige-ia','Corrige l\'IA'],['guide','Exercice guidé']];
const DUREES=[['10','10 min au plus'],['15','15 min au plus'],['20','20 min au plus'],['30','30 min au plus']];
const BROUILLON='banque-brouillon';
const etoiles=n=>'<span class="etoiles" aria-label="Difficulté '+n+' sur 3">'+'★'.repeat(n)+'<span class="etoiles-vides">'+'★'.repeat(Math.max(0,3-n))+'</span></span>';
const option=(v,t,sel)=>'<option value="'+echap(v)+'"'+(sel?' selected':'')+'>'+echap(t)+'</option>';

/* ---------- l'index, relu avec le catalogue ---------- */
function fiches(){ return (window.BANQUE&&window.BANQUE.fiches)||[]; }
function chap(id){ return window.Carnet?window.Carnet.chapitre(id):null; }
function niveauDe(f){ const c=chap(f.chapitre); return c&&c.niveau?{id:c.niveau.id,nom:c.niveau.nom}:{id:f.niveau,nom:f.niveau}; }
function nomNotion(matiere,id){ const N=(window.NOTIONS||{})[matiere]; const n=N&&N.notions.find(x=>x.id===id); return n?n.nom:id; }
function nomType(t){ return D().libelle(TYPES,t)||t; }

function Banque(body){
  const m=body.querySelector('#banque'); if(!m) return;
  const filtre={matiere:'',niveau:'',chapitre:'',notion:'',difficulte:'',type:'',duree:'',calculatrice:''};
  // la composition en cours : celle qu'on ouvre par ?composition=…, sinon le brouillon
  let comp=null;
  const q=new URLSearchParams(location.search);
  if(q.get('composition')) comp=D().composition(q.get('composition'));
  if(!comp){ const b=P().lire(BROUILLON,null); comp=b&&typeof b==='object'?b:{}; }
  comp=Object.assign({id:comp.id||'',modifie:!!comp.modifie},D().normaliser(comp));
  const garder=()=>P().ecrire(BROUILLON,comp);
  const changer=patch=>{ Object.assign(comp,patch,{modifie:true}); Object.assign(comp,D().normaliser(comp)); garder(); peindreComposition(); peindreResultats(); };

  m.innerHTML=
    '<div class="banque-plan"><section id="chercher"><h2>Chercher <span class="discret" data-compte></span></h2><p class="vers-compo discret"><a href="#composer" data-vers-compo></a></p>'+
      '<form class="banque-filtres" data-filtres aria-label="Filtrer les fiches">'+
        '<label>Matière<select name="matiere" class="champ-saisie"></select></label>'+
        '<label>Niveau<select name="niveau" class="champ-saisie"></select></label>'+
        '<label>Chapitre<select name="chapitre" class="champ-saisie"></select></label>'+
        '<label>Notion<select name="notion" class="champ-saisie"></select></label>'+
        '<label>Difficulté<select name="difficulte" class="champ-saisie">'+option('','Toutes')+[1,2,3].map(n=>option(n,'★'.repeat(n)+' · niveau '+n)).join('')+'</select></label>'+
        '<label>Type<select name="type" class="champ-saisie">'+option('','Tous')+TYPES.map(t=>option(t[0],t[1])).join('')+'</select></label>'+
        '<label>Durée<select name="duree" class="champ-saisie">'+option('','Toutes')+DUREES.map(t=>option(t[0],t[1])).join('')+'</select></label>'+
        '<label>Calculatrice<select name="calculatrice" class="champ-saisie">'+option('','Peu importe')+option('non','Sans calculatrice')+option('oui','Avec calculatrice')+'</select></label>'+
        '<div class="ligne pleine-largeur"><button type="reset" class="btn fantome petit">Tout effacer</button></div>'+
      '</form>'+
      '<ul class="banque-resultats liste-nue pile ecart-2" aria-live="polite"></ul></section>'+
    '<section id="composer"><h2>Composer <span class="discret" data-resume></span></h2>'+
      '<div class="titre-compose"><span class="surtitre">Le titre, composé tout seul</span><strong data-titre-compose></strong></div>'+
      '<div class="reglages-devoir">'+
        '<fieldset class="choix-nature"><legend>Nature</legend><div class="rangee">'+D().NATURES.map(n=>'<label class="case-ligne"><input type="radio" name="nature" value="'+n[0]+'">'+echap(n[1])+'</label>').join('')+'</div></fieldset>'+
        '<label>Intitulé <span class="discret">(facultatif, pris dans la liste)</span><select name="intitule" class="champ-saisie">'+option('','— aucun : la nature suffit —')+D().INTITULES.map(t=>option(t[0],t[1])).join('')+'</select></label>'+
        '<label>Échéance <span class="discret" data-echeance-aide>(facultative)</span><input type="date" name="echeance" class="champ-saisie"></label>'+
      '</div>'+
      '<fieldset class="ce-que-voit"><legend>Ce que l\'élève a le droit de voir</legend>'+
        '<label class="interrupteur"><input type="checkbox" name="aides"><span class="piste" aria-hidden="true"></span>Les coups de pouce de chaque fiche</label>'+
        '<label>La correction<select name="correction" class="champ-saisie">'+D().CORRECTIONS.map(c=>option(c[0],c[1].charAt(0).toUpperCase()+c[1].slice(1))).join('')+'</select></label>'+
        '<p class="discret" data-correction-aide></p></fieldset>'+
      '<div class="note-choix" data-si-dm><label class="interrupteur"><input type="checkbox" name="note"><span class="piste" aria-hidden="true"></span>Noter ce devoir maison</label>'+
        '<p class="discret">La seule note du site, et c\'est la tienne : tu fixes un barème, la plateforme ne calcule jamais de note. Ni moyenne de classe, ni classement.</p></div>'+
      '<ol class="composition liste-nue pile ecart-2" aria-label="Les exercices, dans l\'ordre"></ol>'+
      '<p class="discret" data-vide>Aucun exercice pour l\'instant : ajoute des fiches depuis la recherche.</p>'+
      '<div class="carte notes-dm" data-si-note><h3>Les notes <span class="discret" data-total></span></h3>'+
        '<p>La saisie des notes attend les comptes reliés. Sans serveur, les copies et les réponses de tes élèves ne te parviennent pas : tu noteras leur copie, sur papier ou ici quand les comptes seront là.</p>'+
        '<p class="discret">À ce moment-là, tu verras pour chaque élève ce qu\'il a réussi et ses réponses, et c\'est toi qui fixeras la note. Lui et toi seuls la verrez.</p>'+
        '<div><button type="button" class="btn fantome" disabled>Saisir les notes · avec les comptes</button></div></div>'+
      '<div class="ligne"><button type="button" class="btn" data-enregistrer>Enregistrer</button><button type="button" class="btn fantome" data-nouvelle>Nouvelle composition</button><span class="discret" data-etat></span></div>'+
    '</section></div>'+
    '<section id="diffuser"><h2>Diffuser</h2>'+
      '<div class="colonnes">'+
        '<div class="carte"><h3>Sur papier</h3><p>Une planche au format A4 : les énoncés, puis le corrigé sur des pages séparées.</p><div><a class="btn fantome" data-planche target="_blank" rel="noopener">Ouvrir la planche à imprimer</a></div></div>'+
        '<div class="carte"><h3>Par un lien</h3><p>Le lien contient la liste des exercices et tes réglages, rien d\'autre : ni ton nom, ni celui d\'un élève.</p>'+
          '<div class="ligne"><input type="text" readonly class="champ-saisie en-ligne mono-xs" data-lien aria-label="Lien du devoir"><button type="button" class="btn" data-copier>Copier</button></div>'+
          '<a data-eleve target="_blank" rel="noopener">Ouvrir comme un élève</a></div>'+
        '<div class="carte"><h3>Dans le carnet d\'une classe</h3><p>Un envoi « devoir », daté, dans le carnet de chaque élève de la classe ; ses parents le voient en lecture.</p><div><button type="button" class="btn fantome" data-carnet>Choisir la classe et la date</button></div></div>'+
      '</div>'+
      '<p class="avertissement">Sans serveur, les résultats ne te reviennent pas : chaque élève garde les siens sur son appareil (ce qu\'il a fini, ce qu\'il a réussi seul ou avec un coup de pouce). Avec les comptes reliés, tu verras pour chaque exercice la part d\'élèves qui réussissent seuls, avec de l\'aide, ou qui bloquent.</p>'+
    '</section>'+
    '<section id="mes-compositions"><h2>Mes compositions <span class="discret">· rangées dans ton compte, sur cet appareil</span></h2><ul class="compos-sauvees liste-nue pile ecart-2"></ul></section>'+
    '<section class="transparence" id="transparence"><h2>Ce que voient mes élèves d\'un devoir</h2><ul>'+
      '<li><span class="oui">✓</span> les exercices, dans l\'ordre, tels qu\'ils sont dans leur chapitre</li>'+
      '<li><span class="oui">✓</span> le titre composé, l\'échéance, tes réglages, et le barème d\'un DM noté</li>'+
      '<li><span class="non">✗</span> aucun texte libre : rien que tu puisses écrire à un élève</li>'+
      '<li><span class="non">✗</span> aucune note calculée par le site, ni moyenne, ni classement</li>'+
      '<li><span class="non">✗</span> leurs résultats ne te reviennent pas tant qu\'il n\'y a pas de serveur</li></ul></section>';

  const fF=m.querySelector('[data-filtres]'), liste=m.querySelector('.banque-resultats'), compo=m.querySelector('#composer');

  /* ---------- chercher ---------- */
  const uniques=(l,cle)=>{ const vus=new Map(); l.forEach(x=>{ const k=cle(x); if(k&&!vus.has(k[0])) vus.set(k[0],k[1]); }); return [...vus]; };
  function remplirFiltres(){
    const tout=fiches();
    const mats=uniques(tout,f=>{ const mm=(window.MATIERES||[]).find(x=>x.id===f.matiere); return [f.matiere,mm?mm.nom:f.matiere]; });
    const dansM=tout.filter(f=>!filtre.matiere||f.matiere===filtre.matiere);
    const nivs=uniques(dansM,f=>{ const n=niveauDe(f); return [n.id,n.nom]; });
    const dansN=dansM.filter(f=>!filtre.niveau||niveauDe(f).id===filtre.niveau);
    const chs=uniques(dansN,f=>{ const c=chap(f.chapitre); return [f.chapitre,c?c.titre:f.chapitre]; });
    const nots=filtre.matiere?uniques(dansN.flatMap(f=>f.notions.map(n=>({n,m:f.matiere}))),x=>[x.n,nomNotion(x.m,x.n)]):[];
    fF.matiere.innerHTML=option('','Toutes')+mats.map(x=>option(x[0],x[1],x[0]===filtre.matiere)).join('');
    fF.niveau.innerHTML=option('','Tous')+nivs.map(x=>option(x[0],x[1],x[0]===filtre.niveau)).join('');
    fF.chapitre.innerHTML=option('','Tous')+chs.map(x=>option(x[0],x[1],x[0]===filtre.chapitre)).join('');
    fF.notion.innerHTML=option('',filtre.matiere?'Toutes':'— choisis une matière —')+nots.map(x=>option(x[0],x[1],x[0]===filtre.notion)).join('');
    fF.notion.disabled=!filtre.matiere;
  }
  function trouvees(){ return fiches().filter(f=>(!filtre.matiere||f.matiere===filtre.matiere)&&(!filtre.niveau||niveauDe(f).id===filtre.niveau)&&
    (!filtre.chapitre||f.chapitre===filtre.chapitre)&&(!filtre.notion||f.notions.includes(filtre.notion))&&(!filtre.difficulte||String(f.difficulte)===filtre.difficulte)&&
    (!filtre.type||f.type===filtre.type)&&(!filtre.duree||f.duree<=+filtre.duree)&&(!filtre.calculatrice||(f.calculatrice?'oui':'non')===filtre.calculatrice)); }
  function ligne(f){ const c=chap(f.chapitre), dedans=comp.fiches.includes(f.id), aid='apercu-'+f.id.replace('/','--');
    return '<li class="fiche-ligne" data-fiche="'+echap(f.id)+'"><div class="fiche-resume"><strong>'+echap(f.titre)+'</strong>'+
      '<span class="discret">'+echap(c?c.titre:f.chapitre)+' · '+echap(niveauDe(f).nom)+'</span>'+
      '<span class="fiche-etiquettes">'+etoiles(f.difficulte)+'<span>'+D().minutes(f.duree)+'</span><span>'+echap(nomType(f.type))+'</span><span>'+(f.calculatrice?'calculatrice':'sans calculatrice')+'</span>'+(f.aides?'<span>'+f.aides+' coup'+(f.aides>1?'s':'')+' de pouce</span>':'')+
        f.notions.map(n=>'<span class="notion">'+echap(nomNotion(f.matiere,n))+'</span>').join('')+'</span></div>'+
      '<div class="rangee fiche-boutons"><button type="button" class="btn fantome petit" data-voir aria-expanded="false" aria-controls="'+aid+'">Voir la fiche</button>'+
        '<button type="button" class="btn petit'+(dedans?' fantome':'')+'" data-ajouter aria-pressed="'+dedans+'">'+(dedans?'✓ Ajoutée · retirer':'Ajouter')+'</button></div>'+
      '<div class="fiche-apercu" id="'+aid+'" hidden></div></li>'; }
  function peindreResultats(){ const l=trouvees();
    m.querySelector('[data-compte]').textContent='· '+l.length+' fiche'+(l.length>1?'s':'')+' sur '+fiches().length;
    // on garde les aperçus ouverts : seuls les boutons « Ajouter » changent quand la composition bouge
    const deja=new Map([...liste.children].map(li=>[li.dataset.fiche,li]));
    const memes=deja.size===l.length&&l.every(f=>deja.has(f.id));
    if(memes){ l.forEach(f=>{ const b=deja.get(f.id).querySelector('[data-ajouter]'), dedans=comp.fiches.includes(f.id);
      b.setAttribute('aria-pressed',dedans); b.classList.toggle('fantome',dedans); b.textContent=dedans?'✓ Ajoutée · retirer':'Ajouter'; }); return; }
    liste.innerHTML=l.length?l.map(ligne).join(''):'<li class="discret">Aucune fiche ne répond à ces critères. Desserre un filtre.</li>'; }
  fF.addEventListener('change',e=>{ const n=e.target.name; if(!(n in filtre)) return; filtre[n]=e.target.value;
    if(n==='matiere'){ filtre.niveau=filtre.chapitre=filtre.notion=''; }
    if(n==='niveau'){ filtre.chapitre=''; }
    remplirFiltres(); peindreResultats(); });
  fF.addEventListener('reset',()=>{ setTimeout(()=>{ Object.keys(filtre).forEach(k=>filtre[k]=''); remplirFiltres(); peindreResultats(); },0); });
  liste.addEventListener('click',async e=>{ const li=e.target.closest('.fiche-ligne'); if(!li) return; const id=li.dataset.fiche;
    const v=e.target.closest('[data-voir]');
    if(v){ const ap=li.querySelector('.fiche-apercu'), ouvrir=ap.hidden; ap.hidden=!ouvrir; v.setAttribute('aria-expanded',ouvrir); v.textContent=ouvrir?'Replier la fiche':'Voir la fiche';
      if(ouvrir&&!ap.dataset.lu){ ap.dataset.lu='1'; await F().apercu(id,ap); } return; }
    if(e.target.closest('[data-ajouter]')){ const l=comp.fiches.slice(), i=l.indexOf(id);
      if(i>=0){ l.splice(i,1); const b=comp.bareme.slice(); b.splice(i,1); changer({fiches:l,bareme:b}); }
      else { if(l.length>=D().MAX_FICHES) return B().toast('<strong>'+D().MAX_FICHES+' exercices au plus</strong><span>Une composition plus longue se découpe en deux.</span>');
        l.push(id); changer({fiches:l,bareme:comp.bareme.concat([0])}); B().toast('<strong>Ajouté à la composition.</strong><span>'+echap(D().resume(comp))+'</span>',2500); }
      const b=li.querySelector('[data-ajouter]'); if(b) b.focus(); } });

  /* ---------- composer ---------- */
  const olc=compo.querySelector('.composition');
  function peindreComposition(){
    const d=D().normaliser(comp);
    compo.querySelector('[data-titre-compose]').textContent=D().titre(d);
    compo.querySelector('[data-resume]').textContent='· '+D().resume(d);
    m.querySelector('[data-vers-compo]').textContent='Ta composition : '+D().resume(d)+' ↓';
    compo.querySelectorAll('[name=nature]').forEach(r=>r.checked=r.value===d.nature);
    compo.querySelector('[name=intitule]').value=d.intitule;
    compo.querySelector('[name=echeance]').value=d.echeance;
    compo.querySelector('[name=aides]').checked=d.aides;
    compo.querySelector('[name=correction]').value=comp.correction;
    compo.querySelector('[name=note]').checked=d.note;
    compo.querySelector('[data-si-dm]').hidden=d.nature!=='dm';
    compo.querySelector('[data-si-note]').hidden=!d.note;
    compo.querySelector('[data-total]').textContent='· barème sur '+D().nombre(D().total(d))+' point'+(D().total(d)>1?'s':'');
    compo.querySelector('[data-correction-aide]').textContent=(D().CORRECTIONS.find(c=>c[0]===d.correction)||[])[2]||'';
    compo.querySelector('[data-echeance-aide]').textContent=d.nature==='dm'||comp.correction==='echeance'?'(conseillée)':'(facultative)';
    compo.querySelector('[data-vide]').hidden=d.fiches.length>0;
    olc.innerHTML=d.fiches.map((id,i)=>{ const f=D().fiche(id), c=chap(id.split('/')[0]), t=f?f.titre:id;
      return '<li class="compo-ligne" data-fiche="'+echap(id)+'"><span class="compo-num" aria-hidden="true">'+(i+1)+'</span>'+
        '<div class="compo-corps"><strong>'+echap(t)+'</strong><span class="discret">'+echap(c?c.titre:id.split('/')[0])+(f?' · '+D().minutes(f.duree)+' · '+'★'.repeat(f.difficulte):'')+'</span></div>'+
        (d.note?'<label class="compo-points">Points<input type="number" min="0" max="'+D().MAX_POINTS+'" step="0.5" inputmode="decimal" class="champ-saisie" data-points="'+i+'" value="'+d.bareme[i]+'"></label>':'')+
        '<div class="rangee compo-boutons"><button type="button" class="btn fantome petit" data-monter="'+i+'" aria-label="Monter « '+echap(t)+' »"'+(i===0?' disabled':'')+'>↑</button>'+
          '<button type="button" class="btn fantome petit" data-descendre="'+i+'" aria-label="Descendre « '+echap(t)+' »"'+(i===d.fiches.length-1?' disabled':'')+'>↓</button>'+
          '<button type="button" class="btn fantome petit" data-enlever="'+i+'" aria-label="Retirer « '+echap(t)+' »">✕</button></div></li>'; }).join('');
    // ce qui se diffuse
    const vide=!d.fiches.length;
    const pl=m.querySelector('[data-planche]'), el=m.querySelector('[data-eleve]');
    pl.href=S().racine+D().chemin(d,'planche.html'); el.href=S().racine+D().chemin(d);
    [pl,el].forEach(a=>{ a.setAttribute('aria-disabled',vide); a.tabIndex=vide?-1:0; });
    m.querySelector('[data-lien]').value=vide?'':D().lien(d);
    m.querySelectorAll('[data-copier],[data-carnet],[data-enregistrer]').forEach(b=>b.disabled=vide);
    m.querySelector('[data-etat]').textContent=comp.id?(comp.modifie?'Modifications non enregistrées':'Enregistrée'):(vide?'':'Pas encore enregistrée');
    peindreSauvees(); }
  compo.addEventListener('change',e=>{ const t=e.target;
    if(t.name==='nature') changer({nature:t.value});
    else if(t.name==='intitule') changer({intitule:t.value});
    else if(t.name==='echeance') changer({echeance:t.value});
    else if(t.name==='aides') changer({aides:t.checked});
    else if(t.name==='correction'){ if(t.value==='echeance'&&!comp.echeance){ B().toast('<strong>Choisis d\'abord une échéance.</strong><span>La correction s\'ouvrira ce jour-là.</span>'); t.value=comp.correction; compo.querySelector('[name=echeance]').focus(); return; } changer({correction:t.value}); }
    else if(t.name==='note') changer({note:t.checked,bareme:comp.fiches.map((f,i)=>comp.bareme[i]||0)});
    else if(t.dataset.points!=null){ const b=comp.bareme.slice(); b[+t.dataset.points]=t.value; changer({bareme:b}); } });
  compo.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return;
    const deplacer=(i,j,quoi)=>{ const f=comp.fiches.slice(), p=comp.bareme.slice(); [f[i],f[j]]=[f[j],f[i]]; if(p.length) [p[i],p[j]]=[p[j],p[i]]; changer({fiches:f,bareme:p});
      const cible=olc.querySelector('[data-'+quoi+'="'+j+'"]'); (cible&&!cible.disabled?cible:olc.querySelector('[data-fiche="'+f[j]+'"] button:not([disabled])')).focus(); };
    if(b.dataset.monter!=null){ const i=+b.dataset.monter; if(i>0) deplacer(i,i-1,'monter'); return; }
    if(b.dataset.descendre!=null){ const i=+b.dataset.descendre; if(i<comp.fiches.length-1) deplacer(i,i+1,'descendre'); return; }
    if(b.dataset.enlever!=null){ const i=+b.dataset.enlever, f=comp.fiches.slice(), p=comp.bareme.slice(); f.splice(i,1); p.splice(i,1); changer({fiches:f,bareme:p});
      const suiv=olc.querySelectorAll('[data-enlever]')[Math.min(i,f.length-1)]; if(suiv) suiv.focus(); return; }
    if(b.hasAttribute('data-enregistrer')){ enregistrer(); B().toast('<strong>Composition enregistrée.</strong><span>Tu la retrouves dans « Mes compositions ».</span>'); return; }
    if(b.hasAttribute('data-nouvelle')){ comp={id:'',modifie:false,...D().normaliser({})}; garder(); peindreComposition(); peindreResultats(); compo.querySelector('h2').scrollIntoView({block:'start'}); return; } });
  function enregistrer(){ const c=D().enregistrer(comp); comp=Object.assign({},c,{modifie:false}); garder(); peindreComposition(); return c; }

  /* ---------- diffuser ---------- */
  const zDiff=m.querySelector('#diffuser');
  zDiff.addEventListener('click',e=>{
    const a=e.target.closest('a[aria-disabled="true"]'); if(a){ e.preventDefault(); return; }
    if(e.target.closest('[data-copier]')){ const inp=zDiff.querySelector('[data-lien]'); inp.select();
      try{ navigator.clipboard.writeText(inp.value).then(()=>B().toast('<strong>Lien copié.</strong><span>Donne-le à tes élèves : il ne contient que les exercices et tes réglages.</span>'),()=>{}); }catch(err){ try{ document.execCommand('copy'); }catch(e2){} } return; }
    if(e.target.closest('[data-carnet]')){ const c=enregistrer(); location.href=S().racine+'prof.html?composition='+encodeURIComponent(c.id)+'#carnet-prof'; } });

  /* ---------- mes compositions ---------- */
  const zSauv=m.querySelector('.compos-sauvees');
  function peindreSauvees(){ const l=D().compositions();
    zSauv.innerHTML=l.length?l.map(c=>'<li class="compo-sauvee'+(c.id===comp.id?' courante':'')+'" data-compo="'+echap(c.id)+'"><div class="compo-corps"><strong>'+echap(D().titre(c))+'</strong><span class="discret">'+echap(D().resume(c))+' · modifiée le '+echap(D().dateFr(c.maj))+(c.id===comp.id?' · ouverte':'')+'</span></div>'+
      '<div class="rangee"><button type="button" class="btn fantome petit" data-ouvrir>Ouvrir</button><button type="button" class="btn fantome petit" data-dupliquer>Dupliquer</button><button type="button" class="btn fantome petit" data-supprimer>Supprimer</button></div></li>').join('')
      :'<li class="discret">Aucune composition enregistrée. Celle que tu composes est gardée en brouillon tant que tu ne l\'enregistres pas.</li>'; }
  zSauv.addEventListener('click',e=>{ const li=e.target.closest('[data-compo]'); if(!li) return; const id=li.dataset.compo;
    if(e.target.closest('[data-ouvrir]')){ const c=D().composition(id); if(!c) return; comp=Object.assign({},c,{modifie:false}); garder(); peindreComposition(); peindreResultats(); compo.querySelector('h2').scrollIntoView({block:'start'}); return; }
    if(e.target.closest('[data-dupliquer]')){ const c=D().dupliquer(id); if(!c) return; comp=Object.assign({},c,{modifie:false}); garder(); peindreComposition(); peindreResultats(); B().toast('<strong>Copie créée et ouverte.</strong><span>L\'original n\'a pas bougé.</span>'); return; }
    const s=e.target.closest('[data-supprimer]'); if(s){ if(!s.dataset.confirme){ s.dataset.confirme='1'; s.textContent='Confirmer'; s.classList.remove('fantome'); return; }
      D().supprimer(id); if(comp.id===id){ comp.id=''; comp.modifie=true; garder(); } peindreComposition(); } });

  remplirFiltres(); peindreResultats(); peindreComposition();
  if(location.hash){ const t=document.getElementById(location.hash.slice(1)); if(t) setTimeout(()=>t.scrollIntoView({block:'start'}),60); }
}

/* la carte des notions sert aux filtres : chargée avant de peindre */
async function page(body){ try{ await S().charger(S().racine+'assets/js/notions.js'); }catch(e){ console.warn(e); } Banque(body); }
window.Pages=Object.assign(window.Pages||{},{banque:page});
})();
