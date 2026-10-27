/* =====================================================================
   LES FICHES — lire un exercice dans la page de son chapitre, et le montrer

   Une fiche de la banque n'est écrite qu'à un endroit : la page de son
   chapitre. Pour la montrer ailleurs (l'aperçu de la banque, un devoir,
   une planche à imprimer), on lit cette page (fetch + DOMParser, comme le
   choix d'exercice du carnet) et on CLONE l'article, puis on le présente
   comme dans le chapitre (Site.preparerExercice). Une correction faite
   dans le chapitre est donc aussitôt dans tous les devoirs.

   Trois présentations :
     apercu   ce que voit le professeur : tout, correction repliée
     eleve    le devoir (devoir.html) : coups de pouce et correction selon
              les réglages ; l'élève dit lui-même s'il a réussi
     papier   la planche A4 (planche.html) : les énoncés, puis le corrigé
              sur des pages séparées

   Chargé sur banque.html, devoir.html et planche.html (site.js), après
   banque.js (l'index) et devoirs.js (le modèle).
   ===================================================================== */
(function(){
"use strict";
const S=()=>window.Site, D=()=>window.Devoirs, P=()=>window.Pupitre, B=()=>window.Bureau;
const echap=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- lire une fiche dans sa page ---------- */
const pages=new Map();   // chemin → Promise<Document> : une page n'est lue qu'une fois
function lirePage(chemin){
  if(!pages.has(chemin)) pages.set(chemin, fetch(S().racine+chemin).then(r=>{ if(!r.ok) throw new Error('Page '+chemin+' : '+r.status); return r.text(); })
    .then(t=>new DOMParser().parseFromString(t,'text/html')));
  return pages.get(chemin); }
/* où vit une fiche : l'index de la banque d'abord ; sinon le catalogue (une fiche absente de
   l'index, mais dont le chapitre existe, se cherche quand même à son ancre) */
function adresse(id){
  const f=D().fiche(id); if(f) return {page:f.page,ancre:f.ancre,fiche:f};
  const [ch,nom]=String(id).split('/'); const c=window.Carnet&&window.Carnet.chapitre(ch);
  return c&&c.fichier&&nom ? {page:c.fichier,ancre:'ex-'+nom,fiche:null} : null; }
/* les liens et les images de la fiche pointaient depuis la page du chapitre : on les recale */
function rebaser(el,chemin){ const base=new URL(S().racine+chemin,location.href);
  el.querySelectorAll('[href],[src]').forEach(n=>['href','src'].forEach(at=>{ const v=n.getAttribute(at);
    if(v==null||/^(data:|https?:|mailto:|javascript:)/i.test(v)) return; n.setAttribute(at,new URL(v,base).href); })); }
/* la fiche, clonée : {id, article, fiche, page}, ou null si elle est introuvable */
async function charger(id){ const o=adresse(id); if(!o) return null;
  try{ const doc=await lirePage(o.page); const a=doc.getElementById(o.ancre);
    if(!a||!a.matches('article.exercice')) return null;
    const c=document.importNode(a,true); rebaser(c,o.page);
    /* deux chapitres peuvent avoir le même id local (« ex-corrige-l-ia ») : dans un devoir,
       l'article prend l'identifiant global, qui est unique */
    c.id='f-'+id.replace('/','--'); c.dataset.fiche=id;
    return {id,article:c,fiche:o.fiche||{id,titre:a.dataset.titre||'',duree:+a.dataset.duree||0,difficulte:+a.dataset.niveau||0,calculatrice:a.dataset.calculatrice==='oui'},page:o.page};
  }catch(e){ console.warn(e); return null; } }
function chargerTout(ids){ return Promise.all(ids.map(charger)); }

/* ---------- présenter ---------- */
/* la ligne sous le titre : durée, calculatrice, points d'un DM noté */
function meta(f,points){ const l=[];
  if(f&&f.duree) l.push('environ '+D().minutes(f.duree));
  if(f) l.push(f.calculatrice?'calculatrice autorisée':'sans calculatrice');
  if(points!=null) l.push('<b>'+D().nombre(points)+' point'+(points>1?'s':'')+'</b>');
  return '<p class="fiche-meta discret">'+l.join(' · ')+'</p>'; }
function preparer(it,numero,points){ const a=it.article;
  S().preparerExercice(a,numero);
  a.querySelector(':scope > header').insertAdjacentHTML('afterend',meta(it.fiche,points)); return a; }
/* ce que le JavaScript du site doit faire sur une fiche ajoutée : formules, graphes, tuteur */
async function habiller(el){
  S().maths(el);
  try{
    if(el.querySelector('figure.graphe')){ await S().charger(S().racine+'assets/js/graphe.js'); window.Graphe.init(el); }
    if(el.querySelector('.tuteur')){ await S().charger(S().racine+'assets/js/tuteur.js'); window.Tuteur.init(el); }
  }catch(e){ console.warn(e); } }
function introuvable(id,numero){ return '<article class="exercice introuvable"><header><span class="num-ex">Exercice '+numero+'</span></header><p>Cet exercice est introuvable : il a peut-être été retiré de la banque, ou le lien est abîmé (<code>'+echap(id)+'</code>).</p></article>'; }

/* ---------- l'aperçu du professeur : la fiche telle que l'élève la verra ---------- */
async function apercu(id,cont){
  cont.innerHTML='<p class="discret">Lecture de la fiche dans son chapitre…</p>';
  const it=await charger(id);
  if(!it){ cont.innerHTML=introuvable(id,1); return null; }
  cont.innerHTML=''; cont.appendChild(preparer(it,1)); await habiller(cont); return it; }

/* =====================================================================
   LE DEVOIR DE L'ÉLÈVE — devoir.html?…
   Les exercices dans l'ordre, présentés comme dans le chapitre. La
   correction suit le réglage du professeur ; l'élève dit lui-même s'il a
   réussi seul, avec un coup de pouce, ou pas encore. Tout reste sur son
   appareil : le professeur n'en voit rien tant qu'il n'y a pas de serveur.
   ===================================================================== */
async function pageDevoir(body){
  const m=body.querySelector('#devoir'); if(!m) return;
  const d=D().decoder();
  if(!d||!d.fiches.length){
    m.innerHTML='<section class="devoir-tete"><h2>Ce lien de devoir est incomplet</h2><p>Il ne contient aucun exercice. Demande à ton professeur de te le redonner, ou ouvre-le depuis ton carnet.</p><p><a href="'+S().racine+'carnet.html">Ouvrir mon carnet</a></p></section>'; return; }
  const titre=D().titre(d), nom=(window.SITE||{}).nom||'';
  document.title=titre+' · '+nom;
  const h1=document.getElementById('titre-devoir'); if(h1) h1.textContent=D().titre(d,true);
  const sur=document.getElementById('nature-devoir'); if(sur) sur.textContent=D().natureLibelle(d);
  const s=D().suivi(d);
  m.innerHTML='<section class="devoir-tete">'+
      '<div class="chiffres"><div class="chiffre"><b>'+d.fiches.length+'</b><small>exercice'+(d.fiches.length>1?'s':'')+'</small></div>'+
        '<div class="chiffre"><b>'+(D().duree(d)?D().minutes(D().duree(d)):'—')+'</b><small>de travail, environ</small></div>'+
        (d.echeance?'<div class="chiffre"><b>'+echap(D().dateFr(d.echeance))+'</b><small>l\'échéance</small></div>':'')+
        (d.note?'<div class="chiffre"><b>'+D().nombre(D().total(d))+' points</b><small>noté par ton professeur</small></div>':'')+'</div>'+
      '<ul class="conseils">'+D().reglagesTexte(d).map(r=>'<li><b>'+echap(r[0])+'</b><span>'+echap(r[1])+'</span></li>').join('')+'</ul>'+
      (d.note?'<p class="note-dm">Ce devoir est noté par ton professeur, et lui seul : le site ne calcule aucune note. Rends ta copie comme il te l\'a demandé.</p>':'')+
      '<p class="discret">Ce que tu coches ici reste sur cet appareil. Ton professeur ne le voit pas : le site n\'a pas encore de serveur.</p>'+
      '<nav class="devoir-sommaire" aria-label="Les exercices du devoir"><ol class="liste-nue rangee">'+d.fiches.map((id,i)=>'<li><a href="#f-'+echap(id.replace('/','--'))+'" data-pastille="'+echap(id)+'"><span>'+(i+1)+'</span></a></li>').join('')+'</ol></nav>'+
    '</section><div class="devoir-fiches pile ecart-4"><p class="discret">Lecture des exercices dans leurs chapitres…</p></div>'+
    '<section class="devoir-bilan" aria-live="polite"></section>';
  const liste=m.querySelector('.devoir-fiches');
  const items=await chargerTout(d.fiches);
  liste.innerHTML='';
  items.forEach((it,i)=>{ const id=d.fiches[i];
    if(!it){ liste.insertAdjacentHTML('beforeend',introuvable(id,i+1)); return; }
    preparer(it,i+1,d.note?d.bareme[i]:null);
    liste.appendChild(it.article);
    brancherEleve(it,d,s.fiches[id]||{},()=>peindreBilan(m,d)); });
  await habiller(liste);
  peindreBilan(m,d);
  if(location.hash){ const t=document.getElementById(location.hash.slice(1)); if(t) setTimeout(()=>t.scrollIntoView({block:'start'}),60); }
}

/* une fiche du devoir : les réglages appliqués, et ce que l'élève en dit */
function brancherEleve(it,d,etat,apres){ const a=it.article, id=it.id;
  // les coups de pouce : retirés si le professeur ne les veut pas, comptés sinon
  const pouces=[...a.querySelectorAll(':scope > details.indice')];
  if(!d.aides) pouces.forEach(x=>x.remove());
  else pouces.forEach(x=>{ x.addEventListener('toggle',()=>{ if(!x.open) return; const n=pouces.filter(y=>y.open).length; if(n>(etat.aides||0)){ etat=D().noter(d,id,{aides:n}); outils(); } }); });
  // la correction : hors de la page tant qu'elle n'est pas permise (rien à lire en douce)
  const cor=a.querySelector(':scope > details.correction'); if(cor) cor.remove();
  const permise=()=>d.correction==='immediate'||(d.correction==='apres'&&etat.repondu)||(d.correction==='echeance'&&D().echeancePassee(d));
  const zone=document.createElement('div'); zone.className='devoir-outils'; a.appendChild(zone);
  function poserCorrection(ouvrir){ if(!cor||cor.isConnected) return; zone.before(cor); if(ouvrir) cor.open=true; S().maths(cor);
    cor.addEventListener('toggle',()=>{ if(cor.open&&!etat.vu){ etat=D().noter(d,id,{vu:true}); outils(); } }); }
  function outils(){
    if(permise()) poserCorrection(d.correction==='apres');
    const vue=!!etat.vu||(cor&&cor.open);
    let h='';
    if(!etat.repondu) h+='<div class="ligne"><button type="button" class="btn" data-fini>'+(d.correction==='apres'?'J\'ai fini cet exercice : voir la correction':'J\'ai fini cet exercice')+'</button></div>';
    if(!permise()&&d.correction==='echeance') h+='<p class="discret verrou">La correction s\'ouvrira le '+echap(D().dateFr(d.echeance,true))+'.</p>';
    if(permise()&&vue){ const avecAide=(etat.aides||0)>0;
      h+='<div class="bilan-fiche"><span class="discret">Compare avec la correction. Tu as réussi :</span><div class="rangee" role="group" aria-label="Ma réussite à cet exercice">'+
        D().BILANS.filter(b=>!(b[0]==='seul'&&avecAide)).map(b=>'<button type="button" class="filtre" data-bilan="'+b[0]+'" aria-pressed="'+(etat.bilan===b[0])+'">'+echap(b[1])+'</button>').join('')+'</div>'+
        (avecAide?'<span class="discret">Tu as ouvert un coup de pouce : c\'est réussi avec de l\'aide, et c\'est très bien.</span>':'')+'</div>'; }
    else if(permise()&&cor&&!vue) h+='<p class="discret">Cherche d\'abord seul, puis ouvre la correction pour comparer.</p>';
    zone.innerHTML=h;
    a.classList.toggle('reussie',etat.bilan==='seul'||etat.bilan==='aide');
    const pastille=document.querySelector('[data-pastille="'+id+'"]'); if(pastille){ pastille.dataset.etat=etat.bilan||(etat.repondu?'fini':''); pastille.setAttribute('aria-label','Exercice '+pastille.textContent+(etat.bilan?' : '+D().libelle(D().BILANS,etat.bilan).toLowerCase():etat.repondu?' : fini':'')); }
    apres&&apres(); }
  zone.addEventListener('click',e=>{
    if(e.target.closest('[data-fini]')){ etat=D().noter(d,id,{repondu:true}); if(P()&&P().gagne) P().gagne.travail(); outils();
      if(cor&&cor.isConnected&&d.correction==='apres') cor.querySelector('summary').focus(); return; }
    const b=e.target.closest('[data-bilan]'); if(b){ etat=D().noter(d,id,{bilan:b.dataset.bilan,repondu:true}); outils(); } });
  outils(); }

function peindreBilan(m,d){ const z=m.querySelector('.devoir-bilan'); if(!z) return; const s=D().suivi(d).fiches;
  const n=k=>d.fiches.filter(id=>s[id]&&s[id].bilan===k).length, finis=d.fiches.filter(id=>s[id]&&(s[id].repondu||s[id].bilan)).length;
  if(!finis){ z.innerHTML=''; return; }
  z.innerHTML='<h2>Où tu en es</h2><p>'+finis+' exercice'+(finis>1?'s':'')+' fini'+(finis>1?'s':'')+' sur '+d.fiches.length+' · '+
    n('seul')+' réussi'+(n('seul')>1?'s':'')+' seul · '+n('aide')+' avec un coup de pouce · '+n('pas-encore')+' pas encore.</p>'+
    '<p class="discret">Pas de note : ce qui compte, c\'est ce que tu sais faire seul, comparé à toi-même.'+(d.note?' La note de ce devoir viendra de ton professeur.':'')+'</p>'; }

/* =====================================================================
   LA PLANCHE À IMPRIMER — planche.html?…
   Une feuille A4 : les énoncés, puis (si le professeur les autorise) les
   coups de pouce, puis le corrigé, chacun sur des pages séparées. La
   feuille d'impression (bureau.css, « La banque d'exercices ») retire
   tout le reste de l'écran.
   ===================================================================== */
async function pagePlanche(body){
  const m=body.querySelector('#planche'); if(!m) return;
  const d=D().decoder();
  if(!d||!d.fiches.length){ m.innerHTML='<p>Cette planche ne contient aucun exercice. Compose-la dans la <a href="'+S().racine+'banque.html">banque d\'exercices</a>.</p>'; return; }
  const titre=D().titre(d); document.title=titre+' · planche';
  const items=await chargerTout(d.fiches);
  const pts=i=>d.note?d.bareme[i]:null;
  m.innerHTML='<div class="planche-outils ligne"><button type="button" class="btn" data-imprimer>Imprimer la planche</button><a class="btn fantome" href="'+S().racine+'banque.html">Retour à la banque</a><span class="discret">Format A4 : les énoncés, puis le corrigé sur des pages séparées.</span></div>'+
    '<article class="planche">'+
      '<header class="planche-tete"><span class="surtitre">'+echap(D().natureLibelle(d))+'</span><h2>'+echap(titre)+'</h2>'+
        '<p class="planche-nom"><span>Nom :</span><span>Classe :</span></p>'+
        '<p class="discret">'+echap(D().resume(d))+(d.note?' · noté sur '+D().nombre(D().total(d))+' points':'')+'</p></header>'+
      '<section class="planche-enonces pile ecart-4"></section>'+
      '<section class="planche-pouces pile ecart-3" hidden><h2>Coups de pouce</h2><p class="discret">À donner à qui en a besoin, dans l\'ordre.</p></section>'+
      '<section class="planche-corrige pile ecart-4"><header class="planche-tete"><span class="surtitre">Corrigé</span><h2>'+echap(titre)+'</h2></header></section>'+
    '</article>';
  const en=m.querySelector('.planche-enonces'), po=m.querySelector('.planche-pouces'), co=m.querySelector('.planche-corrige');
  items.forEach((it,i)=>{
    if(!it){ en.insertAdjacentHTML('beforeend',introuvable(d.fiches[i],i+1)); return; }
    const original=it.article.cloneNode(true);
    // l'énoncé : sans coups de pouce ni correction
    preparer(it,i+1,pts(i)); it.article.querySelectorAll(':scope > details').forEach(x=>x.remove()); en.appendChild(it.article);
    // les coups de pouce, s'il y en a et s'ils sont permis
    const pouces=[...original.querySelectorAll(':scope > details.indice')];
    if(d.aides&&pouces.length){ po.hidden=false; po.insertAdjacentHTML('beforeend','<div class="planche-pouce"><h3>Exercice '+(i+1)+'</h3>'+pouces.map(x=>'<div>'+x.innerHTML.replace(/<summary[\s\S]*?<\/summary>/,'')+'</div>').join('')+'</div>'); }
    // le corrigé : l'en-tête de l'exercice et le contenu de sa correction
    const c=original.querySelector(':scope > details.correction');
    const art=document.createElement('article'); art.className='exercice corrige';
    art.innerHTML='<header><span class="num-ex">Exercice '+(i+1)+'</span><span class="titre-ex">'+echap(it.fiche.titre||original.dataset.titre||'')+'</span>'+(pts(i)!=null?'<span class="discret">'+D().nombre(pts(i))+' pt'+(pts(i)>1?'s':'')+'</span>':'')+'</header>';
    if(c){ const z=document.createElement('div'); z.className='contenu'; [...c.childNodes].forEach(n=>{ if(n.nodeName!=='SUMMARY') z.appendChild(n); }); art.appendChild(z); }
    co.appendChild(art); });
  await habiller(m);
  m.querySelector('[data-imprimer]').addEventListener('click',()=>window.print());
  /* l'impression se fait toujours en thème clair : de l'encre sombre sur du papier blanc,
     même si l'écran est en thème sombre (Ctrl+P compris) */
  let avant=null;
  addEventListener('beforeprint',()=>{ const r=document.documentElement; avant=r.getAttribute('data-theme'); r.setAttribute('data-theme','light'); });
  addEventListener('afterprint',()=>{ const r=document.documentElement; if(avant) r.setAttribute('data-theme',avant); else r.removeAttribute('data-theme'); });
}

window.Fiches={charger,chargerTout,apercu,preparer,habiller,adresse,introuvable};
window.Pages=Object.assign(window.Pages||{},{devoir:pageDevoir,planche:pagePlanche});
})();
