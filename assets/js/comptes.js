/* =====================================================================
   LES COMPTES DU PROTOTYPE — connexion.html, et la carte du compte dans « Mon compte ».

   Ce que dit le cahier des charges (« Les comptes ») et que ce fichier joue pour de vrai :
     - un élève s'inscrit seul avec son année de naissance : à 15 ans et plus, un compte
       complet ; en dessous, le « mode découverte », qu'un parent valide d'un clic ;
     - un parent crée son compte avec son adresse mail, puis celui de son enfant (un
       identifiant, un pseudonyme possible, jamais d'adresse mail) : l'accord est donné là ;
       ou il relie un compte existant avec le code à usage unique que l'enfant lui donne ;
     - un professeur s'inscrit avec son adresse (académique de préférence), et son compte
       est vérifié avant activation ;
     - retrouver l'accès : par le mail du compte, par le mail du parent relié, ou par le
       code de secours que l'élève autonome reçoit à l'inscription.

   CE QUI EST SIMULÉ, ET DIT COMME TEL À L'ÉCRAN : il n'y a pas de serveur. Les comptes
   vivent dans ce navigateur (clé « mp:comptes », commune à l'appareil) ; chaque compte a sa
   propre mémoire (« mp:@<id>:… », voir bureau.js) ; les mails ne partent pas : le mail qui
   partirait s'affiche, avec son lien, et reste dans « la boîte aux lettres du prototype »
   (« mp:boite »). Les mots de passe et les codes de secours ne sont jamais gardés en clair :
   seulement une empreinte PBKDF2-SHA256 salée (le serveur, lui, utilisera Argon2). Cinq
   essais manqués bloquent un identifiant une minute.

   Le questionnaire de première connexion (la classe, l'affichage…) viendra se brancher sur
   « premiere » : vrai tant que le compte ne l'a pas rempli.
   ===================================================================== */
(function(){
"use strict";
const P=()=>window.Pupitre, S=()=>window.Site;
const echap=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const lien=p=>((S()&&S().racine)||'')+p;
const accueil=()=>lien(((window.SITE||{}).accueil)||'index.html');
const MDP_MIN=8, ITER=200000, ESSAIS=5, BLOCAGE=60e3, JOUR=864e5;

/* ---------- le registre des comptes (commun à l'appareil) ---------- */
const tous=()=>P().lire('comptes',{});
const compte=id=>tous()[id]||null;
function enregistrer(c){ const t=tous(); t[c.id]=c; P().ecrire('comptes',t); return c; }
const norm=x=>String(x||'').trim().toLowerCase();
const trouver=x=>{ x=norm(x); if(!x) return null; return Object.values(tous()).find(c=>norm(c.identifiant)===x||(c.email&&norm(c.email)===x))||null; };
const identifiantPris=x=>!!Object.values(tous()).find(c=>norm(c.identifiant)===norm(x));
const emailPris=x=>!!Object.values(tous()).find(c=>c.email&&norm(c.email)===norm(x));
const OK_IDENT=/^[a-z0-9][a-z0-9._-]{2,23}$/;
const OK_EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ACADEMIQUE=/@(ac-[a-z-]+\.fr|education\.gouv\.fr)$/i;

/* ---------- le hasard et les empreintes ---------- */
const enHex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const deHex=h=>new Uint8Array(h.match(/../g).map(x=>parseInt(x,16)));
const aleaHex=n=>enHex(crypto.getRandomValues(new Uint8Array(n)));
const LETTRES='ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // ni O ni 0, ni I ni 1 : un code qui se recopie sans erreur
const aleaCode=n=>[...crypto.getRandomValues(new Uint8Array(n))].map(x=>LETTRES[x%LETTRES.length]).join('');
const codeSecours=()=>aleaCode(12).replace(/(.{4})(?=.)/g,'$1-');
const securise=()=>!!(window.crypto&&crypto.subtle);
async function empreinte(texte,sel,iter){
  const cle=await crypto.subtle.importKey('raw',new TextEncoder().encode(texte),'PBKDF2',false,['deriveBits']);
  return enHex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:deHex(sel),iterations:iter,hash:'SHA-256'},cle,256)); }
async function proteger(texte){ const sel=aleaHex(16); return {sel,iter:ITER,h:await empreinte(texte,sel,ITER)}; }
async function verifier(texte,p){ return !!p && (await empreinte(texte,p.sel,p.iter))===p.h; }
const normCode=x=>String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

/* ---------- les essais de connexion ---------- */
function bloque(qui){ const t=P().lire('tentatives',{})[norm(qui)]; return t&&t.jusqu>Date.now() ? Math.ceil((t.jusqu-Date.now())/1000) : 0; }
function rate(qui){ const all=P().lire('tentatives',{}), k=norm(qui), t=all[k]||{n:0,jusqu:0}; t.n++; if(t.n>=ESSAIS){ t.jusqu=Date.now()+BLOCAGE; t.n=0; } all[k]=t; P().ecrire('tentatives',all); }
function reussi(qui){ const all=P().lire('tentatives',{}); delete all[norm(qui)]; P().ecrire('tentatives',all); }

/* ---------- les jetons (liens des mails, codes d'invitation) : ce que le serveur garderait ---------- */
function jeton(type,o,duree){ const j=P().lire('jetons',{}); const code= type==='parent' ? aleaCode(6) : aleaHex(16);
  j[code]=Object.assign({type,cree:Date.now(),expire:Date.now()+(duree||7*JOUR)},o); P().ecrire('jetons',j); return code; }
function lireJeton(code,type){ const j=P().lire('jetons',{}), x=j[code]||j[normCode(code)]; if(!x||(type&&x.type!==type)) return null; if(x.expire<Date.now()) return null; return x; }
function useJeton(code){ const j=P().lire('jetons',{}); delete j[code]; delete j[normCode(code)]; P().ecrire('jetons',j); }

/* ---------- la boîte aux lettres du prototype : le mail qui partirait ---------- */
function envoyer(m){ const b=P().lire('boite',[]); m=Object.assign({id:aleaHex(4),date:Date.now()},m); b.unshift(m); P().ecrire('boite',b.slice(0,20)); return m; }
function mailHTML(m){ return '<div class="mail-simule" role="note"><p class="surtitre">Le mail qui partirait · prototype : aucun mail n\'est envoyé</p>'+
  '<p class="entete">À : '+echap(m.a)+'<br>Objet : '+echap(m.objet)+'</p>'+m.texte.map(t=>'<p>'+echap(t)+'</p>').join('')+
  (m.lien?'<p><a class="btn" href="'+echap(m.lien.url)+'">'+echap(m.lien.texte)+'</a></p>':'')+'</div>'; }
const urlJeton=(code,vue)=>lien('connexion.html')+'?jeton='+encodeURIComponent(code)+(vue?'#'+vue:'');

/* ---------- créer, relier, connecter ---------- */
function nouvelId(){ let id; do{ id='c'+aleaHex(5); }while(compte(id)); return id; }
async function creer(o,mdp){ const c=Object.assign({id:nouvelId(),cree:Date.now(),premiere:true},o); c.mdp=await proteger(mdp); return enregistrer(c); }
function ouvrirSession(c){ reussi(c.identifiant||c.email); P().session.ouvrir(c.id); if(window.Bureau&&Bureau.rafraichirCompte) Bureau.rafraichirCompte(); }
const chezSoi=c=>c.role==='parent'?lien('parent.html'):c.role==='prof'?lien('prof.html'):accueil();
/* relier un parent et un enfant : l'accord du parent valide le mode découverte */
function relier(parentId,enfantId){ const t=tous(), p=t[parentId], e=t[enfantId]; if(!p||!e) return false;
  p.enfants=[...new Set([...(p.enfants||[]),enfantId])]; e.parents=[...new Set([...(e.parents||[]),parentId])];
  if(e.statut==='decouverte'){ e.statut='complet'; e.accordParent=Date.now(); }
  P().ecrire('comptes',t); return true; }
/* l'âge, à l'année près : l'année seule ne tranche pas pour qui a 15 ans cette année */
const anneeCourante=()=>new Date().getFullYear();
function quinzeAns(annee,dejaFetes){ const d=anneeCourante()-annee; return d>=16 || (d===15&&dejaFetes===true); }

/* ---------- les morceaux de formulaire ---------- */
const champ=(nom,label,type,attrs,aide)=>'<label>'+label+'<input class="champ-saisie" name="'+nom+'" type="'+(type||'text')+'" '+(attrs||'')+'>'+(aide?'<span class="discret">'+aide+'</span>':'')+'</label>';
const mdpChamps=(quoi)=>champ('mdp',quoi||'Mot de passe','password','autocomplete="new-password" minlength="'+MDP_MIN+'" required','Au moins '+MDP_MIN+' caractères. Une petite phrase est plus facile à retenir qu\'un mot compliqué.')+
  champ('mdp2','Le même, encore une fois','password','autocomplete="new-password" required')+
  '<label class="case-ligne"><input type="checkbox" data-voir-mdp> Afficher le mot de passe</label>';
function anneesOptions(min,max){ let o='<option value="">— choisir —</option>'; for(let a=max;a>=min;a--) o+='<option value="'+a+'">'+a+'</option>'; return o; }
const NOTE_PROTO='<p class="discret">Prototype : ton compte vit dans ce navigateur, sur cet appareil seulement. Rien n\'est envoyé sur internet, et aucun mail ne part. Le détail : <a href="'+lien('confidentialite.html#aujourdhui')+'">Données et confidentialité</a>.</p>';
function erreur(f,msg){ let e=f.querySelector('.retour.mauvais'); if(!msg){ if(e) e.remove(); return; }
  if(!e){ e=document.createElement('div'); e.className='retour mauvais'; e.setAttribute('role','alert'); f.querySelector('.envoi').before(e); }
  e.innerHTML='<span>'+msg+'</span>'; e.scrollIntoView({block:'nearest'}); }
function controleMdp(f){ const a=f.mdp.value, b=f.mdp2.value;
  if(a.length<MDP_MIN) return 'Ton mot de passe doit faire au moins '+MDP_MIN+' caractères.';
  if(a!==b) return 'Les deux mots de passe ne sont pas les mêmes.'; return ''; }
function controleIdent(x){ x=norm(x);
  if(!OK_IDENT.test(x)) return 'Ton identifiant : de 3 à 24 caractères, des lettres sans accent, des chiffres, et . _ - (pas d\'espace).';
  if(identifiantPris(x)) return 'Cet identifiant est déjà pris. Essaie une variante.'; return ''; }
/* un identifiant proposé à partir du prénom : « Léa » → « lea42 » */
function proposer(nom){ const b=String(nom||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'').slice(0,16)||'eleve';
  let x; do{ x=(b.length<3?b+'.eleve':b)+Math.floor(10+Math.random()*90); }while(identifiantPris(x)); return x; }
/* ce que le site garde : la version courte, présentée à l'inscription (cahier des charges) */
const CE_QUE_JE_GARDE={
  eleve:['ton identifiant (un pseudonyme suffit) et ce que tu veux qu\'on t\'affiche comme prénom','ton année de naissance, pas ta date : elle sert seulement à la règle des 15 ans','ce que tu fais sur le site : chapitres, exercices, aides utilisées, réglages','une adresse mail seulement si tu as 15 ans ou plus et si tu le veux'],
  parent:['ton adresse mail, pour te connecter et retrouver ton compte','le prénom que tu choisis d\'afficher','les comptes de tes enfants, reliés au tien : tu vois leur progression, jamais leurs réponses'],
  prof:['ton adresse mail et le nom que tes élèves verront','ta matière','tes classes, et seulement les élèves qui les ont rejointes']};
const garde=role=>'<details class="sous-carte"><summary>Ce que Monpupitre garde de toi</summary><ul>'+CE_QUE_JE_GARDE[role].map(x=>'<li>'+x+'</li>').join('')+'</ul><p class="discret">Pas de photo, pas de publicité, rien de revendu. Tu peux tout télécharger ou tout effacer depuis « Mon compte ». La version complète : <a href="'+lien('confidentialite.html')+'">Données et confidentialité</a>.</p></details>';

/* =================================================================
   LA PAGE connexion.html : une vue par adresse (#creer, #creer-eleve, #oubli…)
   ================================================================= */
function Connexion(body){
  const m=body.querySelector('#connexion'); if(!m) return;
  const titre=body.querySelector('.accueil-tete h1'), chapeau=body.querySelector('.accueil-tete p');
  const params=new URLSearchParams(location.search); let jetonUrl=params.get('jeton');
  const tete=(h,p)=>{ if(titre) titre.textContent=h; if(chapeau) chapeau.textContent=p; document.title=h+' · '+((window.SITE||{}).nom||''); };
  if(!securise()){ m.innerHTML='<section class="carte"><h2>Une connexion sécurisée est nécessaire</h2><p>Les comptes demandent une page ouverte en https : ouvre le site depuis son adresse en ligne.</p></section>'; return; }
  const VUES={'':vueConnexion,connexion:vueConnexion,creer:vueChoix,'creer-eleve':vueEleve,'creer-parent':vueParent,'creer-prof':vueProf,'ajouter-enfant':vueEnfant,oubli:vueOubli};
  function afficher(){ const v=location.hash.slice(1);
    if(jetonUrl&&!['creer-parent','connexion'].includes(v)&&vueJeton()) return;
    (VUES[v]||vueConnexion)();
    const f=m.querySelector('form input:not([type=hidden])'); if(f&&location.hash) f.focus({preventScroll:true}); }
  addEventListener('hashchange',afficher);
  brancherVoir(m);
  afficher();

  /* ---------- se connecter ---------- */
  function vueConnexion(){ const c=P().session.compte();
    tete('Se connecter','Avec ton identifiant, ou ton adresse mail pour un compte parent ou professeur.');
    m.innerHTML=(c?'<section class="retour neutre"><span>Tu es connecté comme <strong>'+echap(c.nom)+'</strong>. Te connecter ici changera de compte.</span></section>':'')+
      '<section class="carte connexion-carte"><form class="formulaire" data-form="connexion" novalidate>'+
      champ('qui','Identifiant ou adresse mail','text','autocomplete="username" autocapitalize="off" spellcheck="false" required')+
      champ('mdp','Mot de passe','password','autocomplete="current-password" required')+
      '<label class="case-ligne"><input type="checkbox" data-voir-mdp> Afficher le mot de passe</label>'+
      '<div class="ligne envoi"><button class="btn" type="submit">Se connecter</button><a href="#oubli">Mot de passe oublié ?</a></div></form></section>'+
      '<section class="carte"><h2>Pas encore de compte ?</h2><p>Élève, parent ou professeur : deux minutes, et sans adresse mail pour un élève.</p><p><a class="btn fantome" href="#creer">Créer un compte</a></p>'+
      '<p class="discret">Sans compte, tout le site reste ouvert : ce que tu fais reste dans ce navigateur. <a href="'+accueil()+'">Continuer sans compte</a></p></section>'+
      NOTE_PROTO+boiteHTML();
    const f=m.querySelector('form');
    f.addEventListener('submit',async e=>{ e.preventDefault(); const qui=f.qui.value, mdp=f.mdp.value;
      if(!qui.trim()||!mdp) return erreur(f,'Écris ton identifiant (ou ton adresse mail) et ton mot de passe.');
      const s=bloque(qui); if(s) return erreur(f,'Trop d\'essais pour cet identifiant. Attends '+s+' secondes, puis réessaie. Si tu as oublié ton mot de passe : <a href="#oubli">le retrouver</a>.');
      const c=trouver(qui), btn=f.querySelector('button'); btn.disabled=true;
      const bon= c ? await verifier(mdp,c.mdp) : (await empreinte(mdp,aleaHex(16),ITER),false);   // même durée qu'un compte existe ou non
      btn.disabled=false;
      if(!bon){ rate(qui); const b=bloque(qui); return erreur(f,b?'Identifiant ou mot de passe incorrect, cinq fois de suite : cet identifiant est bloqué '+b+' secondes (trop d\'essais). Si tu as oublié ton mot de passe : <a href="#oubli">le retrouver</a>.':'Identifiant ou mot de passe incorrect.'); }
      ouvrirSession(c); location.href=params.get('suite')?lien(params.get('suite')):chezSoi(c); }); }

  /* ---------- créer un compte : qui es-tu ? ---------- */
  function vueChoix(){ tete('Créer un compte','Choisis ce qui te ressemble : chacun a son espace, et ne voit que ce dont il a besoin.');
    m.innerHTML='<div class="colonnes choix-role">'+
      [['creer-eleve','🎒','Je suis élève','De la sixième à la terminale. Un pseudonyme suffit, et pas besoin d\'adresse mail.'],
       ['creer-parent','🏡','Je suis parent','Tu crées ton compte, puis celui de ton enfant, ou tu relies le sien avec son code.'],
       ['creer-prof','📚','Je suis professeur','En établissement ou particulier : tes élèves te rejoignent par un lien. Compte vérifié avant activation.']]
      .map(([v,ico,t,p])=>'<a class="carte lien-bloc carte-role" href="#'+v+'"><span class="ico" aria-hidden="true">'+ico+'</span><strong>'+t+'</strong><span class="discret">'+p+'</span></a>').join('')+'</div>'+
      '<p><a href="#connexion">J\'ai déjà un compte : me connecter</a></p>'+NOTE_PROTO; }

  /* ---------- l'élève, seul ---------- */
  function vueEleve(){ tete('Créer mon compte élève','Ton année de naissance, un prénom ou un surnom, un identifiant, un mot de passe : c\'est tout.');
    const A=anneeCourante();
    m.innerHTML='<section class="carte"><form class="formulaire" data-form="eleve" novalidate>'+
      '<label>Ton année de naissance<select class="champ-saisie" name="annee" required>'+anneesOptions(A-25,A-8)+'</select><span class="discret">L\'année seule, pas ta date : elle sert à une règle de la loi, celle des 15 ans.</span></label>'+
      '<fieldset class="quinze" hidden><legend>As-tu déjà fêté tes 15 ans ?</legend><div class="ligne"><label class="case-ligne"><input type="radio" name="quinze" value="oui"> Oui</label><label class="case-ligne"><input type="radio" name="quinze" value="non"> Pas encore</label></div></fieldset>'+
      '<div class="regle-age" hidden></div>'+
      champ('nom','Comment veux-tu qu\'on t\'appelle ?','text','maxlength="30" autocomplete="nickname" required','Ton prénom ou un surnom : c\'est ce que tu verras sur ton bureau.')+
      champ('identifiant','Ton identifiant, pour te connecter','text','maxlength="24" autocapitalize="off" spellcheck="false" autocomplete="username" required','Un pseudonyme, c\'est très bien. Des lettres sans accent, des chiffres, et . _ -')+
      mdpChamps()+
      '<div class="email-15" hidden>'+champ('email','Une adresse mail (facultatif)','email','autocomplete="email"','Elle sert seulement à retrouver ton compte. Sans elle, tu auras un code de secours.')+'</div>'+
      garde('eleve')+
      '<label class="case-ligne"><input type="checkbox" name="accord" required> J\'ai lu ce que Monpupitre garde de moi, et je suis d\'accord.</label>'+
      '<div class="ligne envoi"><button class="btn" type="submit">Créer mon compte</button><a href="#creer">Revenir</a></div></form></section>'+NOTE_PROTO;
    const f=m.querySelector('form'); let identTouche=false;
    const age=()=>{ const a=+f.annee.value; if(!a) return null; const q=f.querySelector('input[name=quinze]:checked'); return {annee:a,quinze:quinzeAns(a,q?q.value==='oui':null),douteux:anneeCourante()-a===15&&!q}; };
    function majAge(){ const a=+f.annee.value, d=a?anneeCourante()-a:0, x=age();
      f.querySelector('.quinze').hidden= d!==15;
      const r=f.querySelector('.regle-age'), em=f.querySelector('.email-15');
      if(!x||x.douteux){ r.hidden=true; em.hidden=true; return; }
      r.hidden=false; em.hidden=!x.quinze;
      r.className='regle-age retour '+(x.quinze?'bon':'neutre');
      r.innerHTML= x.quinze ? '<span><strong>Compte complet.</strong> Tu pourras inviter un parent plus tard, si tu le veux.</span>'
        : '<span><strong>Mode découverte.</strong> Tout le site marche, tout de suite. Avant 15 ans, la loi demande qu\'un parent soit d\'accord pour que ta progression soit enregistrée en ligne : tu pourras l\'inviter juste après, ou plus tard.</span>'; }
    f.annee.addEventListener('change',majAge); f.querySelectorAll('input[name=quinze]').forEach(x=>x.addEventListener('change',majAge));
    f.nom.addEventListener('input',()=>{ if(!identTouche) f.identifiant.value=f.nom.value.trim()?proposer(f.nom.value):''; });
    f.identifiant.addEventListener('input',()=>{ identTouche=true; });
    f.addEventListener('submit',async e=>{ e.preventDefault(); const x=age();
      if(!x) return erreur(f,'Choisis ton année de naissance.');
      if(x.douteux) return erreur(f,'Dis-nous si tu as déjà fêté tes 15 ans.');
      if(!f.nom.value.trim()) return erreur(f,'Écris un prénom ou un surnom.');
      const ei=controleIdent(f.identifiant.value); if(ei) return erreur(f,ei);
      const em=controleMdp(f); if(em) return erreur(f,em);
      const mail=x.quinze?f.email.value.trim():'';
      if(mail&&!OK_EMAIL.test(mail)) return erreur(f,'Cette adresse mail ne semble pas complète.');
      if(mail&&emailPris(mail)) return erreur(f,'Cette adresse mail est déjà utilisée par un autre compte.');
      if(!f.accord.checked) return erreur(f,'Coche la case : c\'est ton accord, il est nécessaire.');
      erreur(f,''); f.querySelector('button').disabled=true;
      const code=codeSecours();
      const c=await creer({role:'eleve',nom:f.nom.value.trim(),identifiant:norm(f.identifiant.value),annee:x.annee,statut:x.quinze?'complet':'decouverte',email:mail?norm(mail):undefined,accord:Date.now()},f.mdp.value);
      c.secours=await proteger(normCode(code)); enregistrer(c);
      ouvrirSession(c); bienvenueEleve(c,code); }); }
  function bienvenueEleve(c,code){ tete('Ton compte est prêt','Bienvenue, '+c.nom+'.');
    m.innerHTML='<section class="carte"><span class="surtitre">À garder</span><h2>Ton code de secours</h2>'+
      '<p>Si tu oublies ton mot de passe, ce code te permettra d\'en choisir un nouveau'+(c.email?' (ton adresse mail aussi)':'')+'. Note-le sur papier, ou imprime cette page, et range-le avec tes affaires.</p>'+
      '<p class="code-secours" aria-label="Code de secours">'+echap(code)+'</p>'+
      '<p class="discret">Ton identifiant : <strong>'+echap(c.identifiant)+'</strong>. Ce code ne s\'affichera plus : tu pourras en demander un nouveau dans « Mon compte ».</p>'+
      '<div class="ligne"><button type="button" class="btn fantome" data-imprimer>Imprimer</button></div>'+
      '<label class="case-ligne"><input type="checkbox" data-note> J\'ai noté mon code de secours.</label></section>'+
      (c.statut==='decouverte'?inviterHTML(c):'')+
      '<p><a class="btn" href="'+accueil()+'" data-suite aria-disabled="true">Aller à mon bureau</a></p>'+NOTE_PROTO;
    const suite=m.querySelector('[data-suite]');
    suite.addEventListener('click',e=>{ if(suite.getAttribute('aria-disabled')==='true'){ e.preventDefault(); m.querySelector('[data-note]').focus(); } });
    m.querySelector('[data-note]').addEventListener('change',e=>suite.setAttribute('aria-disabled',String(!e.target.checked)));
    m.querySelector('[data-imprimer]').addEventListener('click',()=>print());
    brancherInviter(m,c); }

  /* ---------- le parent ---------- */
  function vueParent(){ tete('Créer mon compte parent','Ton adresse mail et un mot de passe ; ensuite, le compte de ton enfant.');
    const j=jetonUrl&&lireJeton(jetonUrl,'parent'), enfant=j&&compte(j.compte);
    m.innerHTML=(enfant?'<section class="retour neutre"><span><strong>'+echap(enfant.nom)+'</strong> t\'invite à relier ton compte au sien. Crée ton compte : le lien se fera tout seul.</span></section>':'')+
      '<section class="carte"><form class="formulaire" data-form="parent" novalidate>'+
      champ('email','Ton adresse mail','email','autocomplete="email" required','Pour te connecter, et pour retrouver ton compte ou celui de ton enfant.')+
      champ('nom','Le prénom à afficher (facultatif)','text','maxlength="30" autocomplete="given-name"','Ton enfant le verra dans « Ce que voient mes parents ».')+
      mdpChamps()+garde('parent')+
      '<label class="case-ligne"><input type="checkbox" name="accord" required> J\'ai lu ce que Monpupitre garde de moi, et je suis d\'accord.</label>'+
      '<div class="ligne envoi"><button class="btn" type="submit">Créer mon compte</button><a href="#creer">Revenir</a></div></form></section>'+NOTE_PROTO;
    const f=m.querySelector('form');
    f.addEventListener('submit',async e=>{ e.preventDefault(); const mail=f.email.value.trim();
      if(!OK_EMAIL.test(mail)) return erreur(f,'Écris une adresse mail complète.');
      if(emailPris(mail)) return erreur(f,'Cette adresse a déjà un compte. <a href="#connexion">Te connecter</a>');
      const em=controleMdp(f); if(em) return erreur(f,em);
      if(!f.accord.checked) return erreur(f,'Coche la case : c\'est ton accord, il est nécessaire.');
      erreur(f,''); f.querySelector('button').disabled=true;
      const c=await creer({role:'parent',nom:f.nom.value.trim()||'Parent',identifiant:norm(mail),email:norm(mail),enfants:[],accord:Date.now()},f.mdp.value);
      ouvrirSession(c);
      if(enfant&&relier(c.id,enfant.id)){ useJeton(jetonUrl); jetonUrl=null; history.replaceState(null,'',lien('connexion.html')+'#ajouter-enfant'); toast('<strong>Ton compte est relié à celui de '+echap(enfant.nom)+'.</strong>'); }
      else location.hash='ajouter-enfant';
      vueEnfant(); }); }
  /* le compte de l'enfant, créé par le parent connecté — ou relié par son code */
  function vueEnfant(){ const p=P().session.compte();
    if(!p||p.role!=='parent'){ location.hash='creer-parent'; return; }
    tete('Le compte de ton enfant','Tu le crées pour lui : il se connectera avec un identifiant, sans adresse mail.');
    const enfants=(p.enfants||[]).map(compte).filter(Boolean), A=anneeCourante();
    m.innerHTML=(enfants.length?'<section class="carte"><span class="surtitre">Déjà reliés</span><ul class="liste-nue pile ecart-1">'+enfants.map(e=>'<li><strong>'+echap(e.nom)+'</strong> · identifiant <code>'+echap(e.identifiant)+'</code></li>').join('')+'</ul></section>':'')+
      '<section class="carte"><h2>Créer le compte de ton enfant</h2><form class="formulaire" data-form="enfant" novalidate>'+
      champ('nom','Son prénom ou un surnom','text','maxlength="30" required','C\'est ce qu\'il verra sur son bureau.')+
      champ('identifiant','Son identifiant','text','maxlength="24" autocapitalize="off" spellcheck="false" required','Un pseudonyme convient très bien. Des lettres sans accent, des chiffres, et . _ -')+
      '<label>Son année de naissance<select class="champ-saisie" name="annee" required>'+anneesOptions(A-25,A-6)+'</select></label>'+
      mdpChamps('Son mot de passe')+
      '<p class="discret">Donne-lui ce mot de passe : il pourra le changer dans « Mon compte ». S\'il l\'oublie, la demande arrivera sur ton adresse.</p>'+
      garde('eleve')+
      '<label class="case-ligne"><input type="checkbox" name="accord" required> J\'autorise mon enfant à utiliser Monpupitre, et j\'ai lu ce que le site garde de lui.</label>'+
      '<div class="ligne envoi"><button class="btn" type="submit">Créer son compte</button></div></form></section>'+
      '<section class="carte"><h2>Il a déjà un compte ?</h2><p>Demande-lui le <strong>code d\'invitation</strong> qu\'il trouve dans « Mon compte » : il est à usage unique, et c\'est lui qui décide de te le donner.</p>'+
      '<form class="formulaire" data-form="code" novalidate>'+champ('code','Le code d\'invitation','text','maxlength="9" autocapitalize="characters" spellcheck="false" required')+
      '<div class="ligne envoi"><button class="btn fantome" type="submit">Relier son compte</button></div></form></section>'+
      '<p><a class="btn fantome" href="'+lien('parent.html')+'">'+(enfants.length?'Aller à mon espace parent':'Plus tard : aller à mon espace parent')+'</a></p>'+NOTE_PROTO;
    const f=m.querySelector('form[data-form=enfant]'), fc=m.querySelector('form[data-form=code]'); let identTouche=false;
    f.nom.addEventListener('input',()=>{ if(!identTouche) f.identifiant.value=f.nom.value.trim()?proposer(f.nom.value):''; });
    f.identifiant.addEventListener('input',()=>{ identTouche=true; });
    f.addEventListener('submit',async e=>{ e.preventDefault();
      if(!f.nom.value.trim()) return erreur(f,'Écris son prénom ou un surnom.');
      const ei=controleIdent(f.identifiant.value); if(ei) return erreur(f,ei.replace('Ton identifiant','Son identifiant'));
      if(!+f.annee.value) return erreur(f,'Choisis son année de naissance.');
      const em=controleMdp(f); if(em) return erreur(f,em.replace('Ton mot de passe','Son mot de passe'));
      if(!f.accord.checked) return erreur(f,'Coche la case : c\'est ton accord, il est nécessaire.');
      erreur(f,''); f.querySelector('button').disabled=true;
      const e2=await creer({role:'eleve',nom:f.nom.value.trim(),identifiant:norm(f.identifiant.value),annee:+f.annee.value,statut:'complet',creePar:p.id,parents:[],accordParent:Date.now()},f.mdp.value);
      relier(p.id,e2.id); toast('<strong>Le compte de '+echap(e2.nom)+' est prêt.</strong><span>Identifiant : '+echap(e2.identifiant)+'</span>'); vueEnfant(); });
    fc.addEventListener('submit',e=>{ e.preventDefault(); const code=normCode(fc.code.value), j=lireJeton(code,'parent'), en=j&&compte(j.compte);
      if(!en) return erreur(fc,'Ce code n\'est pas (ou plus) valable. Demande-lui d\'en générer un nouveau.');
      relier(p.id,en.id); useJeton(code); toast('<strong>Ton compte est relié à celui de '+echap(en.nom)+'.</strong>'); vueEnfant(); }); }

  /* ---------- le professeur ---------- */
  function vueProf(){ tete('Créer mon compte professeur','Ton nom tel que tes élèves le verront, ton adresse, ta matière.');
    const mats=(window.MATIERES||[]);
    m.innerHTML='<section class="carte"><form class="formulaire" data-form="prof" novalidate>'+
      champ('nom','Ton nom, tel que tes élèves le verront','text','maxlength="40" required placeholder="Mme Roux, M. Martin…"')+
      champ('email','Ton adresse mail','email','autocomplete="email" required','Une adresse académique (prenom.nom@ac-….fr) est vérifiée tout de suite ; une autre, à la main par l\'équipe.')+
      '<label>Ta matière<select class="champ-saisie" name="matiere" required><option value="">— choisir —</option>'+mats.map(x=>'<option value="'+x.id+'">'+echap(x.nom)+'</option>').join('')+'</select></label>'+
      mdpChamps()+garde('prof')+
      '<label class="case-ligne"><input type="checkbox" name="accord" required> J\'ai lu ce que Monpupitre garde de moi, et je suis d\'accord.</label>'+
      '<div class="ligne envoi"><button class="btn" type="submit">Créer mon compte</button><a href="#creer">Revenir</a></div></form></section>'+NOTE_PROTO;
    const f=m.querySelector('form');
    f.addEventListener('submit',async e=>{ e.preventDefault(); const mail=f.email.value.trim();
      if(!f.nom.value.trim()) return erreur(f,'Écris ton nom tel que tes élèves le verront.');
      if(!OK_EMAIL.test(mail)) return erreur(f,'Écris une adresse mail complète.');
      if(emailPris(mail)) return erreur(f,'Cette adresse a déjà un compte. <a href="#connexion">Te connecter</a>');
      if(!f.matiere.value) return erreur(f,'Choisis ta matière.');
      const em=controleMdp(f); if(em) return erreur(f,em);
      if(!f.accord.checked) return erreur(f,'Coche la case : c\'est ton accord, il est nécessaire.');
      erreur(f,''); f.querySelector('button').disabled=true;
      const c=await creer({role:'prof',nom:f.nom.value.trim(),identifiant:norm(mail),email:norm(mail),matiere:f.matiere.value,verifie:false,accord:Date.now()},f.mdp.value);
      ouvrirSession(c); bienvenueProf(c); }); }
  function bienvenueProf(c){ tete('Ton compte est créé','Il reste une vérification avant d\'ouvrir tes classes.');
    const acad=ACADEMIQUE.test(c.email);
    const mail= acad ? envoyer({a:c.email,objet:'Confirme ton adresse sur Monpupitre',texte:['Bonjour '+c.nom+',','Pour activer ton compte professeur, confirme ton adresse académique en suivant ce lien (valable 7 jours).'],lien:{texte:'Confirmer mon adresse',url:urlJeton(jeton('verif-prof',{compte:c.id}))}}) : null;
    m.innerHTML='<section class="carte"><h2>'+(acad?'Une adresse académique : confirme-la':'Une validation à la main')+'</h2>'+
      (acad?'<p>Un mail de confirmation vient de partir vers <strong>'+echap(c.email)+'</strong>. Suis son lien : ton compte sera activé aussitôt.</p>'+mailHTML(mail)
           :'<p>Ton adresse n\'est pas académique : un membre de l\'équipe vérifiera que tu enseignes avant d\'activer ton compte (une attestation peut t\'être demandée). En attendant, tu peux découvrir l\'espace professeur, avec des données fictives.</p>'+
            '<p class="discret">Prototype : il n\'y a pas d\'équipe derrière. Tu peux jouer son rôle :</p><p><button type="button" class="btn fantome" data-valider-prof>Simuler la validation par l\'équipe</button></p>')+
      '</section><p><a class="btn" href="'+lien('prof.html')+'">Aller à mon espace professeur</a></p>'+
      '<p class="discret">Avec les vrais comptes, la double authentification sera demandée à chaque professeur.</p>'+NOTE_PROTO;
    const b=m.querySelector('[data-valider-prof]'); if(b) b.addEventListener('click',()=>{ const x=compte(c.id); x.verifie=true; x.verifiePar='equipe'; enregistrer(x); toast('<strong>Compte vérifié.</strong><span>Tes classes peuvent s\'ouvrir.</span>'); b.disabled=true; b.textContent='Compte vérifié'; }); }

  /* ---------- mot de passe oublié ---------- */
  function vueOubli(){ tete('Mot de passe oublié','Ça arrive. Donne ton identifiant ou ton adresse : on te dit comment faire.');
    m.innerHTML='<section class="carte"><form class="formulaire" data-form="oubli" novalidate>'+
      champ('qui','Ton identifiant ou ton adresse mail','text','autocomplete="username" autocapitalize="off" spellcheck="false" required')+
      '<div class="ligne envoi"><button class="btn" type="submit">Continuer</button><a href="#connexion">Revenir</a></div></form></section><div class="suite-oubli"></div>'+NOTE_PROTO;
    const f=m.querySelector('form'), suite=m.querySelector('.suite-oubli');
    f.addEventListener('submit',e=>{ e.preventDefault(); const c=trouver(f.qui.value); erreur(f,'');
      if(!f.qui.value.trim()) return erreur(f,'Écris ton identifiant ou ton adresse mail.');
      if(!c){ suite.innerHTML='<section class="retour neutre"><span>Si ce compte existe, les instructions sont parties sur son adresse. Un élève sans adresse : vérifie ton identifiant, ou utilise ton code de secours.</span></section>'; return; }
      const parent=c.role==='eleve'&&!c.email&&(c.parents||[]).map(compte).find(x=>x&&x.email);
      if(c.email||parent){ const a=c.email||parent.email;
        const mail=envoyer({a,objet:'Choisir un nouveau mot de passe sur Monpupitre',texte:parent?['Bonjour,',c.nom+' (identifiant '+c.identifiant+') a oublié son mot de passe. Ce lien permet d\'en choisir un nouveau pour lui ; il est valable une heure.','Si personne ne l\'a demandé, ignore ce mail : rien ne change.']:['Bonjour,','Ce lien permet de choisir un nouveau mot de passe ; il est valable une heure.','Si tu ne l\'as pas demandé, ignore ce mail : rien ne change.'],
          lien:{texte:'Choisir un nouveau mot de passe',url:urlJeton(jeton('reinit',{compte:c.id},36e5))}});
        suite.innerHTML='<section class="carte"><p>'+(parent?'La demande est partie sur l\'adresse de ton parent.':'Un lien est parti sur ton adresse.')+'</p>'+mailHTML(mail)+'</section>'; return; }
      // l'élève autonome, sans adresse : le code de secours
      suite.innerHTML='<section class="carte"><h2>Avec ton code de secours</h2><p>Tu l\'as reçu en créant ton compte (douze lettres et chiffres).</p><form class="formulaire" data-form="secours" novalidate>'+
        champ('code','Ton code de secours','text','autocapitalize="characters" spellcheck="false" required placeholder="XXXX-XXXX-XXXX"')+
        mdpChamps('Ton nouveau mot de passe')+'<div class="ligne envoi"><button class="btn" type="submit">Changer mon mot de passe</button></div></form>'+
        '<p class="discret">Plus de code ? Sans adresse ni parent relié, le support pourra t\'aider avec les vrais comptes. Dans ce prototype, il faudra créer un nouveau compte.</p></section>';
      const fs=suite.querySelector('form');
      fs.addEventListener('submit',async ev=>{ ev.preventDefault(); const s=bloque(c.identifiant); if(s) return erreur(fs,'Trop d\'essais. Attends '+s+' secondes.');
        const em=controleMdp(fs); if(em) return erreur(fs,em);
        if(!(await verifier(normCode(fs.code.value),c.secours))){ rate(c.identifiant); return erreur(fs,'Ce code ne correspond pas. Vérifie chaque caractère.'); }
        const x=compte(c.id), nouveau=codeSecours(); x.mdp=await proteger(fs.mdp.value); x.secours=await proteger(normCode(nouveau)); enregistrer(x);
        ouvrirSession(x);
        suite.innerHTML='<section class="carte"><h2>C\'est fait</h2><p>Ton mot de passe est changé, et ton ancien code de secours ne marche plus. Voici le nouveau : note-le.</p><p class="code-secours">'+echap(nouveau)+'</p><p><a class="btn" href="'+chezSoi(x)+'">Aller à mon bureau</a></p></section>'; }); }); }

  /* ---------- les liens des mails ---------- */
  function vueJeton(){ const j=lireJeton(jetonUrl);
    if(!j){ tete('Lien expiré','Ce lien n\'est plus valable.'); m.innerHTML='<section class="carte"><p>Ce lien a déjà servi, ou il a expiré. Recommence la demande.</p><p><a class="btn" href="'+lien('connexion.html')+'">Se connecter</a></p></section>'; return true; }
    const c=compte(j.compte);
    if(!c){ tete('Compte introuvable',''); m.innerHTML='<section class="carte"><p>Ce compte n\'existe plus.</p></section>'; return true; }
    if(j.type==='verif-prof'){ c.verifie=true; c.verifiePar='adresse'; enregistrer(c); useJeton(jetonUrl); jetonUrl=null;
      tete('Adresse confirmée','Ton compte professeur est activé.'); m.innerHTML='<section class="retour bon"><span><strong>Merci, '+echap(c.nom)+'.</strong> Ton compte est vérifié : tes classes peuvent s\'ouvrir.</span></section><p><a class="btn" href="'+lien('prof.html')+'">Aller à mon espace professeur</a></p>'; return true; }
    if(j.type==='reinit'){ tete('Nouveau mot de passe','Pour le compte '+(c.role==='eleve'?'de '+c.nom:c.email)+'.');
      m.innerHTML='<section class="carte"><form class="formulaire" data-form="reinit" novalidate>'+mdpChamps('Le nouveau mot de passe')+'<div class="ligne envoi"><button class="btn" type="submit">Enregistrer</button></div></form></section>';
      const f=m.querySelector('form');
      f.addEventListener('submit',async e=>{ e.preventDefault(); const em=controleMdp(f); if(em) return erreur(f,em);
        const x=compte(c.id); x.mdp=await proteger(f.mdp.value); enregistrer(x); useJeton(jetonUrl); jetonUrl=null; reussi(x.identifiant);
        m.innerHTML='<section class="retour bon"><span><strong>Mot de passe changé.</strong> '+(x.role==='eleve'&&!x.email?'Donne-le à '+echap(x.nom)+' : il se connecte avec l\'identifiant '+echap(x.identifiant)+'.':'Tu peux te connecter.')+'</span></section><p><a class="btn" href="'+lien('connexion.html')+'">Se connecter</a></p>'; });
      return true; }
    if(j.type==='parent'){ const p=P().session.compte();
      if(p&&p.role==='parent'){ relier(p.id,c.id); useJeton(jetonUrl); jetonUrl=null;
        tete('Comptes reliés','Tu suis maintenant '+c.nom+'.'); m.innerHTML='<section class="retour bon"><span><strong>Ton compte est relié à celui de '+echap(c.nom)+'.</strong> Son mode découverte est levé : sa progression peut être enregistrée.</span></section><p><a class="btn" href="'+lien('parent.html')+'">Aller à mon espace parent</a></p>'; return true; }
      tete('Une invitation de '+c.nom,'Pour suivre son travail et donner ton accord, connecte-toi ou crée ton compte parent.');
      m.innerHTML='<section class="carte"><p><strong>'+echap(c.nom)+'</strong> t\'invite à relier ton compte parent au sien. Ton accord lèvera son mode découverte : sa progression pourra être enregistrée.</p>'+
        '<div class="ligne"><a class="btn" href="'+urlJeton(jetonUrl,'creer-parent')+'">Créer mon compte parent</a><a class="btn fantome" href="'+lien('connexion.html')+'?suite='+encodeURIComponent('connexion.html?jeton='+jetonUrl)+'#connexion">J\'ai déjà un compte</a></div></section>'+NOTE_PROTO;
      return true; }
    return false; }
}

/* ---------- ce qui sert aussi à « Mon compte » ---------- */
/* « Afficher le mot de passe » : une case par formulaire, branchée une fois sur le conteneur */
function brancherVoir(racine){ racine.addEventListener('change',e=>{ const c=e.target.closest('[data-voir-mdp]'); if(!c) return;
  c.closest('form').querySelectorAll('input[name^=mdp],input[name=actuel]').forEach(i=>{ i.type=c.checked?'text':'password'; }); }); }
function toast(h){ if(window.Bureau&&Bureau.toast) Bureau.toast(h); }
function boiteHTML(){ const b=P().lire('boite',[]); if(!b.length) return '';
  return '<details class="carte sous-carte boite-proto"><summary>La boîte aux lettres du prototype ('+b.length+')</summary><p class="discret">Les mails que les vrais comptes enverraient. Ici, ils restent dans ce navigateur, avec leurs liens.</p>'+b.slice(0,5).map(mailHTML).join('')+'</details>'; }
/* inviter un parent : un code à usage unique, et le mail qu'il recevrait */
function inviterHTML(c){ return '<section class="carte inviter-parent"><span class="surtitre">'+(c.statut==='decouverte'?'Mode découverte':'Un parent')+'</span><h2>Inviter un parent</h2>'+
  '<p>'+(c.statut==='decouverte'?'Avant 15 ans, ta progression ne s\'enregistre en ligne qu\'avec l\'accord d\'un parent. Tout le site marche en attendant.':'Il suivra ton travail en lecture seule : jamais tes réponses ni tes échanges avec le tuteur.')+'</p>'+
  '<form class="formulaire" data-form="inviter" novalidate>'+champ('email','Son adresse mail (facultatif)','email','autocomplete="off"','Sans adresse : un code à lui donner, qui sert une seule fois pendant 7 jours.')+
  '<div class="ligne envoi"><button class="btn fantome" type="submit">Inviter un parent</button></div></form><div class="resultat-invitation"></div></section>'; }
function brancherInviter(racine,c){ const f=racine.querySelector('form[data-form=inviter]'); if(!f) return;
  f.addEventListener('submit',e=>{ e.preventDefault(); const mail=f.email.value.trim();
    if(mail&&!OK_EMAIL.test(mail)) return erreur(f,'Cette adresse ne semble pas complète.'); erreur(f,'');
    const code=jeton('parent',{compte:c.id});
    const out=racine.querySelector('.resultat-invitation');
    out.innerHTML='<p>Le code à donner à ton parent : <span class="code-secours petit">'+code+'</span> <span class="discret">valable 7 jours, une seule fois.</span></p>'+
      (mail?mailHTML(envoyer({a:mail,objet:c.nom+' t\'invite sur Monpupitre',texte:['Bonjour,',c.nom+' utilise Monpupitre, un site pour apprendre à travailler seul, et t\'invite à suivre son travail en lecture seule (jamais ses réponses).',(c.statut==='decouverte'?'Avant 15 ans, ton accord est nécessaire pour que sa progression soit enregistrée. ':'')+'Ce lien est valable 7 jours.'],lien:{texte:'Relier mon compte parent',url:urlJeton(code)}})):''); }); }

/* la carte du compte, en tête de « Mon compte » */
function carte(racine){ const c=P().session.compte(); const s=document.createElement('section'); s.className='carte compte-connecte'; s.id='mon-compte';
  if(!c){ s.innerHTML='<span class="surtitre">Ton compte</span><h2>Tu n\'es pas connecté</h2><p>Sans compte, tout le site marche : ce que tu fais reste dans ce navigateur. Un compte te donne ta propre mémoire, même si quelqu\'un d\'autre utilise cet ordinateur.</p><div class="ligne"><a class="btn" href="'+lien('connexion.html')+'">Se connecter</a><a class="btn fantome" href="'+lien('connexion.html#creer')+'">Créer un compte</a></div>';
    racine.prepend(s); return; }
  const enfants=(c.enfants||[]).map(compte).filter(Boolean), parents=(c.parents||[]).map(compte).filter(Boolean);
  const statut= c.role==='eleve' ? (c.statut==='decouverte'?'<span class="badge-role">Mode découverte</span>':'<span class="badge-role ok">Compte complet</span>')
              : c.role==='prof' ? (c.verifie?'<span class="badge-role ok">Compte vérifié</span>':'<span class="badge-role">En attente de vérification</span>') : '';
  s.innerHTML='<span class="surtitre">Ton compte</span><h2>'+echap(c.nom)+' '+statut+'</h2>'+
    '<p class="discret">'+{eleve:'Compte élève · identifiant <code>'+echap(c.identifiant)+'</code>'+(c.email?' · '+echap(c.email):''),parent:'Compte parent · '+echap(c.email),prof:'Compte professeur · '+echap(c.email)}[c.role]+'</p>'+
    (c.role==='eleve'?'<p>'+(parents.length?'Parents reliés : '+parents.map(x=>'<strong>'+echap(x.nom)+'</strong>').join(', ')+'.':'Aucun parent relié.')+'</p>':'')+
    (c.role==='parent'?'<p>'+(enfants.length?'Tes enfants : '+enfants.map(x=>'<strong>'+echap(x.nom)+'</strong> (<code>'+echap(x.identifiant)+'</code>)').join(', ')+'.':'Aucun enfant relié pour l\'instant.')+' <a href="'+lien('connexion.html#ajouter-enfant')+'">Ajouter ou relier un enfant</a></p>':'')+
    (c.role==='prof'&&!c.verifie?'<p class="discret">Un membre de l\'équipe vérifiera que tu enseignes. Prototype : <button type="button" class="btn fantome" data-valider-prof>Simuler la validation</button></p>':'')+
    '<details class="sous-carte"><summary>Changer mon mot de passe</summary><form class="formulaire" data-form="mdp" novalidate>'+champ('actuel','Mot de passe actuel','password','autocomplete="current-password" required')+mdpChamps('Nouveau mot de passe')+'<div class="ligne envoi"><button class="btn" type="submit">Changer</button></div></form></details>'+
    (c.role==='eleve'&&c.secours?'<details class="sous-carte"><summary>Un nouveau code de secours</summary><form class="formulaire" data-form="secours" novalidate>'+champ('actuel','Ton mot de passe','password','autocomplete="current-password" required')+'<p class="discret">L\'ancien code ne marchera plus.</p><div class="ligne envoi"><button class="btn fantome" type="submit">Générer un nouveau code</button></div></form><div class="nouveau-code"></div></details>':'')+
    '<details class="sous-carte"><summary>Supprimer mon compte</summary><form class="formulaire" data-form="supprimer" novalidate><p>Ta fiche, ta progression et tes réglages disparaissent de ce navigateur, et les liens avec '+(c.role==='parent'?'tes enfants':c.role==='eleve'?'tes parents':'tes classes')+' sont défaits. '+(c.role==='parent'?'Les comptes de tes enfants restent à eux. ':'')+'Pense à exporter tes données avant.</p>'+champ('actuel','Ton mot de passe, pour confirmer','password','autocomplete="current-password" required')+'<div class="ligne envoi"><button class="btn" type="submit">Supprimer définitivement</button></div></form></details>'+
    '<div class="ligne"><button type="button" class="btn fantome" data-deconnexion>Se déconnecter</button></div>';
  racine.prepend(s);
  s.querySelector('form[data-form=supprimer]').addEventListener('submit',async e=>{ const f=e.target; e.preventDefault();
    if(!(await verifier(f.actuel.value,compte(c.id).mdp))) return erreur(f,'Ton mot de passe ne correspond pas.');
    supprimerCompte(); location.href=accueil(); });
  if(c.role==='eleve'){ const d=document.createElement('div'); d.innerHTML=inviterHTML(c); const inv=d.firstChild; s.after(inv); brancherInviter(inv,c); }
  brancherVoir(s);
  s.addEventListener('click',e=>{ if(e.target.closest('[data-deconnexion]')){ P().session.fermer(); location.href=accueil(); }
    const v=e.target.closest('[data-valider-prof]'); if(v){ const x=compte(c.id); x.verifie=true; x.verifiePar='equipe'; enregistrer(x); location.reload(); } });
  s.querySelector('form[data-form=mdp]').addEventListener('submit',async e=>{ const f=e.target; e.preventDefault();
    if(!(await verifier(f.actuel.value,compte(c.id).mdp))) return erreur(f,'Ton mot de passe actuel ne correspond pas.');
    const em=controleMdp(f); if(em) return erreur(f,em);
    const x=compte(c.id); x.mdp=await proteger(f.mdp.value); enregistrer(x); f.reset(); erreur(f,''); toast('<strong>Mot de passe changé.</strong>'); });
  const fs=s.querySelector('form[data-form=secours]');
  if(fs) fs.addEventListener('submit',async e=>{ e.preventDefault();
    if(!(await verifier(fs.actuel.value,compte(c.id).mdp))) return erreur(fs,'Ton mot de passe ne correspond pas.');
    const code=codeSecours(), x=compte(c.id); x.secours=await proteger(normCode(code)); enregistrer(x); fs.reset(); erreur(fs,'');
    s.querySelector('.nouveau-code').innerHTML='<p class="code-secours">'+echap(code)+'</p><p class="discret">Note-le : il ne s\'affichera plus.</p>'; }); }

/* supprimer le compte connecté : sa mémoire, sa fiche, ses liens */
function supprimerCompte(){ const c=P().session.compte(); if(!c) return;
  P().toutEffacer(); const t=tous(); delete t[c.id];
  Object.values(t).forEach(x=>{ if(x.enfants) x.enfants=x.enfants.filter(i=>i!==c.id); if(x.parents) x.parents=x.parents.filter(i=>i!==c.id); });
  P().ecrire('comptes',t); const j=P().lire('jetons',{}); Object.keys(j).forEach(k=>{ if(j[k].compte===c.id) delete j[k]; }); P().ecrire('jetons',j);
  P().session.fermer(); }

window.Comptes={carte,supprimerCompte,quinzeAns,proposer,MDP_MIN};
window.Pages=window.Pages||{};
window.Pages.connexion=Connexion;
})();
