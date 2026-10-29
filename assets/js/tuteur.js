/* =====================================================================
   LE TUTEUR PAS À PAS — un exercice guidé qui ne donne jamais la réponse.

   Dans une page :
     <div class="tuteur" data-tuteur="expression" data-depart="3x+5-x+2"
          data-consigne="Réduis l'expression." data-id="reduire-1"></div>
     data-tuteur : expression (réduire, développer) · factoriser · equation
     data-lettre : la lettre utilisée (x par défaut)

   Principe (cahier des charges) : l'élève écrit chaque étape ; un
   VÉRIFICATEUR générique (calcul formel polynomial, dans le navigateur)
   dit si la ligne est équivalente à la précédente, si elle avance, et
   reconnaît les erreurs typiques. L'aide est graduée et se retire :
     0  le tuteur attend ;  1  une question ;  2  un indice ;
     3  une étape sur un exemple voisin. Jamais la réponse finale.
   Avec IA : les messages prennent la forme de questions (ici, une banque
   de formulations ; un vrai modèle les remplacera, nourri du même
   diagnostic). Sans IA : les indices secs du vérificateur. Le niveau
   d'aide utilisé est enregistré pour l'indicateur d'autonomie.
   ===================================================================== */
(function(){
"use strict";
const P=()=>window.Pupitre, site=()=>window.Site||{maths(){},echap:s=>s};
const echap=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ---------- 1. Lecture d'une expression : texte → arbre ---------- */
function lexer(src,lettre){
  const s=src.replace(/−|–/g,'-').replace(/×|·|\*\*/g,'*').replace(/÷|:/g,'/').replace(/²/g,'^2').replace(/³/g,'^3').replace(/,/g,'.').replace(/\s+/g,'');
  const toks=[]; let i=0;
  while(i<s.length){ const c=s[i];
    if(/[0-9.]/.test(c)){ let j=i; while(j<s.length&&/[0-9.]/.test(s[j])) j++; const v=s.slice(i,j); if((v.match(/\./g)||[]).length>1||v==='.') throw new Error('nombre illisible « '+v+' »'); toks.push({t:'num',v:parseFloat(v)}); i=j; continue; }
    if(c===lettre){ toks.push({t:'var'}); i++; continue; }
    if(/[a-zA-Z]/.test(c)) throw new Error('la lettre « '+c+' » n\'est pas dans cet exercice (utilise '+lettre+')');
    if('+-*/^()='.includes(c)){ toks.push({t:c}); i++; continue; }
    throw new Error('caractère inconnu « '+c+' »'); }
  return toks;
}
function parser(src,lettre){
  const toks=lexer(src,lettre); let k=0;
  const voir=()=>toks[k], prendre=()=>toks[k++];
  function expr(){ let a=terme(); while(voir()&&(voir().t==='+'||voir().t==='-')){ const op=prendre().t; const b=terme(); a={t:op==='+'?'add':'sub',a,b}; } return a; }
  function terme(){ let a=unaire();
    while(voir()){ const v=voir();
      if(v.t==='*'||v.t==='/'){ prendre(); const b=unaire(); a={t:v.t==='*'?'mul':'div',a,b}; continue; }
      if(v.t==='var'||v.t==='('){ const b=unaire(); a={t:'mul',a,b,implicite:true}; continue; }       // 2x, 2(x+1), x(x+3), (x+1)(x+2)
      if(v.t==='num'&&(a.t==='var'||a.t==='pow')) throw new Error('« '+lettre+v.v+' » : écris plutôt '+v.v+lettre+' ou '+lettre+'^'+v.v);
      break; }
    return a; }
  function unaire(){ const v=voir(); if(!v) throw new Error('il manque quelque chose à la fin'); if(v.t==='-'){ prendre(); return {t:'neg',a:unaire()}; } if(v.t==='+'){ prendre(); return unaire(); } return puissance(); }
  function puissance(){ const a=atome(); if(voir()&&voir().t==='^'){ prendre(); const e=unaire(); if(e.t!=='num'||e.v<0||e.v%1) throw new Error('exposant attendu : un entier positif'); return {t:'pow',a,n:e.v}; } return a; }
  function atome(){ const v=prendre(); if(!v) throw new Error('il manque quelque chose');
    if(v.t==='num') return {t:'num',v:v.v}; if(v.t==='var') return {t:'var'};
    if(v.t==='('){ const e=expr(); const f=prendre(); if(!f||f.t!==')') throw new Error('parenthèse non fermée'); return {t:'par',a:e}; }
    if(v.t===')') throw new Error('parenthèse fermée sans ouverture'); throw new Error('« '+v.t+' » inattendu'); }
  const r=expr(); if(k<toks.length) throw new Error('« '+(toks[k].t==='num'?toks[k].v:toks[k].t)+' » inattendu'); return r;
}

/* ---------- 2. Calcul formel : arbre → polynôme [c0, c1, c2…] ---------- */
const Poly={
  norm(p){ const q=p.slice(); while(q.length>1&&Math.abs(q[q.length-1])<1e-9) q.pop(); return q.map(c=>Math.abs(c)<1e-9?0:c); },
  add(a,b){ const r=[]; for(let i=0;i<Math.max(a.length,b.length);i++) r[i]=(a[i]||0)+(b[i]||0); return Poly.norm(r); },
  sub(a,b){ return Poly.add(a,Poly.neg(b)); }, neg(a){ return a.map(c=>-c); },
  mul(a,b){ const r=new Array(a.length+b.length-1).fill(0); a.forEach((x,i)=>b.forEach((y,j)=>{ r[i+j]+=x*y; })); return Poly.norm(r); },
  pow(a,n){ let r=[1]; for(let i=0;i<n;i++) r=Poly.mul(r,a); return r; },
  egal(a,b){ a=Poly.norm(a); b=Poly.norm(b); if(a.length!==b.length) return false; return a.every((c,i)=>Math.abs(c-b[i])<1e-7*(1+Math.abs(c))); },
  prop(a,b){ a=Poly.norm(a); b=Poly.norm(b); if(a.length!==b.length) return 0; const i=a.length-1; if(Math.abs(a[i])<1e-9||Math.abs(b[i])<1e-9) return 0; const k=a[i]/b[i]; return a.every((c,j)=>Math.abs(c-k*b[j])<1e-7*(1+Math.abs(c)))?k:0; },
  deg(a){ a=Poly.norm(a); return a.length-1; },
  eval(a,x){ return a.reduce((s,c,i)=>s+c*Math.pow(x,i),0); },
  tex(a,lettre){ const L=lettre||'x'; a=Poly.norm(a); const t=[]; for(let i=a.length-1;i>=0;i--){ const c=a[i]; if(!c) continue; const coef=(Math.abs(c)===1&&i>0)?'':nombre(Math.abs(c)); t.push((c<0?'-':(t.length?'+':''))+coef+(i===0?'':i===1?L:L+'^{'+i+'}')); } return t.length?t.join(''):'0'; },
};
function nombre(v){ const r=Math.round(v*1e6)/1e6; return String(r).replace('.','{,}'); }
function poly(n){ // renvoie null si ce n'est pas un polynôme (division par une expression en x)
  switch(n.t){
    case 'num': return [n.v]; case 'var': return [0,1]; case 'par': return poly(n.a); case 'neg': { const a=poly(n.a); return a&&Poly.neg(a); }
    case 'add': { const a=poly(n.a),b=poly(n.b); return a&&b&&Poly.add(a,b); } case 'sub': { const a=poly(n.a),b=poly(n.b); return a&&b&&Poly.sub(a,b); }
    case 'mul': { const a=poly(n.a),b=poly(n.b); return a&&b&&Poly.mul(a,b); } case 'pow': { const a=poly(n.a); return a&&Poly.pow(a,n.n); }
    case 'div': { const a=poly(n.a),b=poly(n.b); if(!a||!b||Poly.deg(b)>0||Math.abs(b[0])<1e-12) return null; return Poly.norm(a.map(c=>c/b[0])); }
  } return null; }
function evaluer(n,x){ switch(n.t){ case 'num': return n.v; case 'var': return x; case 'par': return evaluer(n.a,x); case 'neg': return -evaluer(n.a,x);
  case 'add': return evaluer(n.a,x)+evaluer(n.b,x); case 'sub': return evaluer(n.a,x)-evaluer(n.b,x); case 'mul': return evaluer(n.a,x)*evaluer(n.b,x); case 'div': return evaluer(n.a,x)/evaluer(n.b,x); case 'pow': return Math.pow(evaluer(n.a,x),n.n); } }
function taille(n){ if(!n) return 0; return 1+taille(n.a)+taille(n.b); }
function tex(n,lettre){ const L=lettre||'x'; const t=m=>tex(m,L);
  switch(n.t){ case 'num': return nombre(n.v); case 'var': return L; case 'par': return '('+t(n.a)+')'; case 'neg': return '-'+t(n.a);
    case 'add': return t(n.a)+'+'+t(n.b); case 'sub': return t(n.a)+'-'+t(n.b);
    case 'mul': { const a=t(n.a), b=t(n.b); if(n.b.t==='num'||(n.a.t==='num'&&n.b.t==='num')) return a+'\\times '+b; return a+b; }
    case 'div': return '\\dfrac{'+t(n.a)+'}{'+t(n.b)+'}'; case 'pow': return t(n.a)+'^{'+n.n+'}'; } return ''; }

/* les termes de premier niveau : 3x + 5 − x + 2 → [3x, 5, −x, 2] (avec leur signe) */
function termes(n,signe){ signe=signe===undefined?1:signe;
  if(n.t==='add') return termes(n.a,signe).concat(termes(n.b,signe));
  if(n.t==='sub') return termes(n.a,signe).concat(termes(n.b,-signe));
  if(n.t==='neg') return termes(n.a,-signe);
  return [{n,signe}]; }
function estMonome(n){ // nombre, x, x^k, nombre×x, nombre×x^k, ou divisé par un nombre
  if(n.t==='num'||n.t==='var') return true; if(n.t==='pow') return n.a.t==='var';
  if(n.t==='neg') return estMonome(n.a);
  if(n.t==='mul') return (n.a.t==='num'||(n.a.t==='neg'&&n.a.a.t==='num'))&&(n.b.t==='var'||(n.b.t==='pow'&&n.b.a.t==='var'));   // 2x, et -4n (lu comme (-4)×n)
  if(n.t==='div') return n.b.t==='num'&&estMonome(n.a); return false; }
function estReduite(n){ const ts=termes(n); if(!ts.every(t=>estMonome(t.n))) return false;
  const exps=ts.map(t=>{ const p=poly(t.n); return p?Poly.deg(p):-1; }); return new Set(exps).size===exps.length; }
function facteurs(n){ if(n.t==='mul') return facteurs(n.a).concat(facteurs(n.b)); if(n.t==='neg') return facteurs(n.a); return [n]; }
function estFactorisee(n){ const f=facteurs(n); if(n.t==='add'||n.t==='sub') return false; if(f.length<2) return false;
  const nonConst=f.filter(x=>{ const p=poly(x); return !p||Poly.deg(p)>0; }); return nonConst.length>=2 || (nonConst.length===1&&f.some(x=>x.t==='num')&&nonConst[0].t==='par'); }

/* ---------- 3. Le diagnostic des erreurs typiques ---------- */
function remplacer(n,cible,par){ if(n===cible) return par; if(!n||typeof n!=='object') return n; const c=Object.assign({},n); if(n.a) c.a=remplacer(n.a,cible,par); if(n.b) c.b=remplacer(n.b,cible,par); return c; }
function parcourir(n,f){ if(!n||typeof n!=='object') return; f(n); parcourir(n.a,f); parcourir(n.b,f); }
function sommeDe(n){ return n.t==='par'&&(n.a.t==='add'||n.a.t==='sub')?n.a:null; }
function diagnostiquer(prec,sv,lettre){ // prec, sv : {ast, poly} ; renvoie {code, indice, question, exemple}
  const L=lettre, pP=prec.poly, pS=sv.poly, D=pS&&pP?Poly.sub(pS,pP):null;
  const t=n=>'$'+tex(n,L)+'$';
  // 0) équations : un seul membre divisé (ou multiplié)
  if(prec.pL&&sv.pL){ const cands=[prec.pL,prec.pR].flatMap(p=>p&&Poly.deg(p)>=1?[p[Poly.deg(p)]]:[]).filter(k=>k&&Math.abs(k-1)>1e-9);
    for(const k of cands){ const div=p=>Poly.norm(p.map(c=>c/k));
      if((Poly.egal(div(prec.pL),sv.pL)&&Poly.egal(prec.pR,sv.pR))||(Poly.egal(prec.pL,sv.pL)&&Poly.egal(div(prec.pR),sv.pR))) return {code:'un-cote',
        question:'Tu as divisé par $'+nombre(k)+'$… d\'un seul côté ? Que devient l\'égalité si on ne fait pas la même chose aux deux membres ?',
        indice:'Une équation reste vraie seulement si on fait la MÊME opération aux deux membres. Si tu divises le membre de gauche par $'+nombre(k)+'$, divise aussi le membre de droite.',
        exemple:'Sur $4x=20$ : on divise les deux membres par 4, $x=20\\div 4=5$.'}; } }
  // b) distributivité incomplète : k(a+b) → ka + b
  for(const n of noeuds(prec.ast)){ if(n.t==='mul'){ const k=n.a, s=sommeDe(n.b); if(!s||k.t==='par') continue;
      const faux=remplacer(prec.ast,n,{t:s.t,a:{t:'mul',a:k,b:s.a},b:s.b}); const pf=poly(faux);
      if(pf&&pS&&Poly.egal(pf,pS)) return {code:'distrib',question:'Le facteur '+t(k)+' multiplie combien de termes dans la parenthèse ?',
        indice:'Le facteur devant une parenthèse multiplie CHAQUE terme de la parenthèse : $k(a+b)=ka+kb$. Ici '+t(k)+' doit aussi multiplier '+t(s.b)+'.',
        exemple:'Sur $3(x+5)$ : $3\\times x+3\\times 5=3x+15$, pas $3x+5$.'}; } }
  // c) un « − » devant une parenthèse appliqué au premier terme seulement
  for(const n of noeuds(prec.ast)){ if(n.t==='sub'){ const s=sommeDe(n.b); if(!s) continue;
      const faux=remplacer(prec.ast,n,{t:s.t,a:{t:'sub',a:n.a,b:s.a},b:s.b}); const pf=poly(faux);
      if(pf&&pS&&Poly.egal(pf,pS)) return {code:'moins-par',question:'Que fait le signe « − » devant '+t(n.b)+' au deuxième terme de la parenthèse ?',
        indice:'Soustraire une parenthèse, c\'est soustraire chacun de ses termes : $a-(b+c)=a-b-c$ et $a-(b-c)=a-b+c$.',
        exemple:'Sur $7-(x-2)$ : $7-x+2=9-x$.'}; } }
  // a) un signe oublié : la différence vaut le double d'un terme
  if(D){ const cands=termes(sv.ast).concat(termes(prec.ast)); for(const c of cands){ const p=poly(c.n); if(!p) continue; const v=Poly.norm(p.map(x=>x*c.signe));
      if(Poly.egal(D,Poly.mul([2],v))||Poly.egal(D,Poly.mul([-2],v))) return {code:'signe',terme:c,
        question:'Regarde le terme '+t(c.n)+' : es-tu sûr de son signe ? D\'où vient-il ?',
        indice:'Le signe du terme '+t(c.n)+' est faux. Un signe « − » devant une parenthèse, ou un terme qui change de membre, change TOUS les signes concernés.',
        exemple:'Sur $-(x-4)$ : le « − » s\'applique à $x$ ET à $-4$, ce qui donne $-x+4$.'}; } }
  // d) termes non semblables additionnés : 2x + 7 → 9x ou 9
  if(pP&&pS&&Poly.deg(pP)>=1){ const somme=pP.reduce((a,b)=>a+b,0); for(let k=0;k<=Poly.deg(pP);k++){ const faux=[]; faux[k]=somme; if(Poly.egal(Poly.norm(faux),pS)) return {code:'semblables',
      question:'Peut-on additionner un nombre de $'+L+'$ et un nombre tout seul ? Que vaut $2'+L+'+7$ si $'+L+'=10$ ?',
      indice:'On ne regroupe que les termes SEMBLABLES : les $'+L+'$ avec les $'+L+'$, les nombres avec les nombres. $2'+L+'+7$ ne se simplifie pas.',
      exemple:'Sur $3'+L+'+4+2'+L+'-1$ : les $'+L+'$ donnent $5'+L+'$, les nombres donnent $3$, résultat $5'+L+'+3$.'}; } }
  // e) x·x confondu avec 2x
  if(pP&&pS&&Poly.deg(pP)>=2&&pP[2]){ const faux=pP.slice(); faux[1]=(faux[1]||0)+2*faux[2]; faux[2]=0; const faux2=pP.slice(); faux2[1]=(faux2[1]||0)+faux2[2]; faux2[2]=0;
    if(Poly.egal(Poly.norm(faux),pS)||Poly.egal(Poly.norm(faux2),pS)) return {code:'carre',question:'Que vaut $'+L+'\\times '+L+'$ quand $'+L+'=3$ ? Et $2'+L+'$ ?',
      indice:'$'+L+'\\times '+L+'='+L+'^2$ (un produit), alors que $2'+L+'='+L+'+'+L+'$ (une somme). Ce n\'est pas la même chose.',
      exemple:'Sur $x(x+3)$ : $x\\times x+x\\times 3=x^2+3x$.'}; }
  // f) double distributivité sans les produits croisés
  for(const n of noeuds(prec.ast)){ if(n.t==='mul'){ const s1=sommeDe(n.a), s2=sommeDe(n.b); if(!s1||!s2) continue;
      const faux=remplacer(prec.ast,n,{t:'add',a:{t:'mul',a:s1.a,b:s2.a},b:{t:'mul',a:{t:s1.t==='sub'?'neg':'par',a:s1.b},b:{t:s2.t==='sub'?'neg':'par',a:s2.b}}}); const pf=poly(faux);
      if(pf&&pS&&Poly.egal(pf,pS)) return {code:'double',question:'Dans $(a+b)(c+d)$, combien de produits faut-il écrire ?',
        indice:'Chaque terme de la première parenthèse multiplie chaque terme de la seconde : $(a+b)(c+d)=ac+ad+bc+bd$. Il manque les produits croisés.',
        exemple:'Sur $(x+2)(x+3)$ : $x^2+3x+2x+6=x^2+5x+6$.'}; } }
  return null;
}
function noeuds(n){ const l=[]; parcourir(n,x=>l.push(x)); return l; }
/* les messages sont écrits en x ; dans un exercice en n (une suite), l'exemple voisin doit parler
   de n lui aussi. On ne change la lettre que dans les formules ($…$) : le texte contient des x
   (« deux », « exemple ») et \times n'en contient pas. */
function enLettre(s,L){ return L==='x'||!s ? s : String(s).replace(/\$[^$]*\$/g,m=>m.replace(/x/g,L)); }

/* ---------- 4. L'exercice guidé ---------- */
const ENCOURAGEMENTS=['Juste. Continue.','Bien vu.','C\'est ça.','Exact, tu avances.','Oui. Étape suivante ?'];
const prendre=a=>a[Math.floor(Math.random()*a.length)];

function initTuteur(el){
  if(el._pret) return; el._pret=true;
  const mode=el.dataset.tuteur||'expression', lettre=el.dataset.lettre||'x', depart=el.dataset.depart||'', id=el.dataset.id||('t'+Math.random().toString(36).slice(2,7));
  const consigne=el.dataset.consigne||(mode==='equation'?'Résous l\'équation.':mode==='factoriser'?'Factorise l\'expression.':'Réduis l\'expression.');
  const chapitre=site().chapitreId||''; const prenom=(P()&&P().ELEVE.prenom)||'';
  const E={lignes:[],aide:0,erreurs:0,fini:false,tentativesDepuisErreur:0,dernierDiag:null};
  function lireLigne(txt){ // → {ast, poly, L, R} ou lève une erreur lisible
    if(mode==='equation'){ const parts=txt.split('='); if(parts.length!==2) throw new Error(parts.length<2?'Une équation a deux membres séparés par un signe « = ».':'Un seul signe « = » par ligne.');
      const L=parser(parts[0],lettre), R=parser(parts[1],lettre); const pl=poly(L), pr=poly(R); return {L,R,pL:pl,pR:pr,poly:pl&&pr?Poly.sub(pl,pr):null,ast:{t:'sub',a:L,b:R}}; }
    const ast=parser(txt,lettre); return {ast,poly:poly(ast)}; }
  const L0=lireLigne(depart); E.lignes.push(Object.assign({txt:depart,depart:true},L0));
  const iaOn=()=>P()&&P().ia.actif();
  const texLigne=l=> mode==='equation' ? tex(l.L,lettre)+' = '+tex(l.R,lettre) : tex(l.ast,lettre);

  el.innerHTML='<div class="tuteur-tete"><span class="etiquette">Exercice guidé</span><span class="mode-ia"></span></div>'+
    '<p class="consigne">'+echap(consigne)+' $'+texLigne(L0)+'$</p>'+
    '<ol class="lignes" aria-label="Ton brouillon"></ol>'+
    '<form class="saisie-tuteur"><label for="'+id+'-in">'+(mode==='equation'?'Ligne suivante (les deux membres, avec =)':'Ligne suivante')+'</label><div class="ligne"><input id="'+id+'-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text" placeholder="'+(mode==='equation'?'par exemple 3'+lettre+' = 15':'par exemple 2'+lettre+' + 7')+'"><button class="btn" type="submit">Vérifier cette étape</button></div></form>'+
    '<div class="clavier" aria-label="Symboles">'+[lettre,'²','(',')','×','/',mode==='equation'?'=':'−'].map(s=>'<button type="button" class="puce" data-touche="'+s+'">'+s+'</button>').join('')+'</div>'+
    '<div class="retour-tuteur" aria-live="polite"></div>'+
    '<div class="aide-tuteur"><button type="button" class="btn fantome" data-aide>Je bloque, un indice ?</button><span class="niveau-aide discret">Aide utilisée : aucune</span><button type="button" class="btn fantome" data-recommencer hidden>Recommencer</button></div>';
  const $=s=>el.querySelector(s); const lignesEl=$('.lignes'), input=$('input'), retour=$('.retour-tuteur'), modeEl=$('.mode-ia'), niveauEl=$('.niveau-aide'), bAide=$('[data-aide]');
  function peindreMode(){ const on=iaOn(); modeEl.textContent= on?'Tuteur avec IA':'Tuteur sans IA'; modeEl.className='mode-ia '+(on?'on':'off'); modeEl.title= on?'Les questions viennent d\'une banque de formulations (prototype) ; un modèle les remplacera, nourri du même vérificateur.':'Les indices viennent du vérificateur.'; }
  peindreMode(); if(P()) P().on('ia',peindreMode);
  function peindreLignes(){ lignesEl.innerHTML=E.lignes.map((l,i)=>'<li class="'+(l.depart?'depart':l.ok?'ok':'ko')+'"><span class="num">'+(i===0?'départ':i)+'</span><span class="formule">$'+texLigne(l)+'$</span>'+(l.depart?'':'<span class="verdict-ligne" aria-label="'+(l.ok?'juste':'à revoir')+'">'+(l.ok?'✓':'✗')+'</span>')+'</li>').join(''); site().maths(lignesEl); }
  function dire(html,cls){ retour.innerHTML='<div class="retour '+(cls||'')+'">'+html+'</div>'; site().maths(retour); }
  function niveau(){ niveauEl.textContent='Aide utilisée : '+['aucune','une question','un indice','un exemple voisin'][E.aide]; }
  peindreLignes(); niveau(); site().maths(el.querySelector('.consigne'));
  // le petit clavier
  el.querySelector('.clavier').addEventListener('click',e=>{ const b=e.target.closest('[data-touche]'); if(!b) return; const t=b.dataset.touche;
    const s=input.selectionStart||input.value.length; input.value=input.value.slice(0,s)+t+input.value.slice(s); input.focus(); input.setSelectionRange(s+t.length,s+t.length); });

  function butAtteint(l){ if(mode==='equation'){ const estVar=n=>n.t==='var'; const constante=n=>{ const p=poly(n); return p&&Poly.deg(p)===0; };
      if((estVar(l.L)&&constante(l.R))||(estVar(l.R)&&constante(l.L))){ const c=estVar(l.L)?l.R:l.L; const simple= c.t==='num'||(c.t==='neg'&&c.a.t==='num')||(c.t==='div'&&c.a.t==='num'&&c.b.t==='num'&&Number.isInteger(c.a.v)&&Number.isInteger(c.b.v)&&pgcd(c.a.v,c.b.v)===1&&c.b.v!==1)||(c.t==='neg'&&c.a.t==='div'&&c.a.a.t==='num'&&c.a.b.t==='num'&&pgcd(c.a.a.v,c.a.b.v)===1);
        return simple?'oui':'simplifier'; } return ''; }
    if(mode==='factoriser') return estFactorisee(l.ast)?'oui':'';
    return estReduite(l.ast)?'oui':''; }
  function pgcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }

  $('form').addEventListener('submit',e=>{ e.preventDefault(); if(E.fini) return; const txt=input.value.trim(); if(!txt) return;
    let l; try{ l=lireLigne(txt); }catch(err){ dire('<strong>Je n\'arrive pas à lire cette ligne.</strong> '+echap(err.message)+'.','info'); return; }
    const prec=[...E.lignes].reverse().find(x=>x.depart||x.ok);   // la dernière ligne juste
    if(txt.replace(/\s/g,'')===prec.txt.replace(/\s/g,'')){ dire('Tu as recopié la ligne précédente. Écris l\'étape suivante.','info'); return; }
    l.txt=txt;
    const equiv= mode==='equation' ? (l.poly&&prec.poly ? (Poly.deg(prec.poly)===0 ? Poly.egal(l.poly,prec.poly) : !!Poly.prop(l.poly,prec.poly)) : memeValeurs(l,prec)) : (l.poly&&prec.poly ? Poly.egal(l.poly,prec.poly) : memeValeurs(l,prec));
    l.ok=equiv; E.lignes.push(l); peindreLignes(); input.value='';
    if(!equiv){ E.erreurs++; E.tentativesDepuisErreur=0; E.dernierDiag=diagnostiquer(prec,l,lettre)||generique(prec,l);
      // niveau 0 : le tuteur attend. Il dit seulement que la ligne n'est pas équivalente.
      dire((iaOn()?'<strong>'+(prenom?prenom+', c':'C')+'ette ligne ne dit pas la même chose que la précédente.</strong> Relis-la : où le calcul a-t-il changé de valeur ?':'<strong>Ligne non équivalente à la précédente.</strong> Cherche l\'erreur, puis réessaie.')+' <span class="discret">Un indice ? Le bouton est là, mais essaie d\'abord seul.</span>','mauvais');
      return; }
    E.dernierDiag=null;
    const but=butAtteint(l);
    if(but==='oui'){ finir(); return; }
    if(but==='simplifier'){ dire('<strong>C\'est juste.</strong> Tu peux encore simplifier le nombre.','bon'); return; }
    const avance= mode==='equation' ? scoreEquation(l)<scoreEquation(prec) : taille(l.ast)<taille(prec.ast);
    if(avance) dire('<strong>'+prendre(ENCOURAGEMENTS)+'</strong>','bon'); else dire('<strong>C\'est juste, mais tu n\'as pas avancé.</strong> '+(mode==='equation'?'Objectif : $'+lettre+'$ tout seul d\'un côté.':mode==='factoriser'?'Objectif : un produit de facteurs.':'Objectif : le moins de termes possible, sans parenthèse.'),'info'); });
  function xDunSeulCote(l){ return Poly.deg(l.pL||[0])===0||Poly.deg(l.pR||[0])===0; }
  /* plus le score est bas, plus l'équation est proche de « x = nombre » */
  function scoreEquation(l){ const tL=termes(l.L), tR=termes(l.R); const degT=t=>{ const p=poly(t.n); return p?Poly.deg(p):1; };
    const xL=tL.some(t=>degT(t)>0), xR=tR.some(t=>degT(t)>0); const cL=tL.some(t=>degT(t)===0), cR=tR.some(t=>degT(t)===0);
    return tL.length+tR.length+(xL&&xR?2:0)+((xL&&cL)||(xR&&cR)?1:0); }
  function memeValeurs(a,b){ return [1.3,2,-1.7,5].every(x=>{ const va=evaluer(a.ast,x), vb=evaluer(b.ast,x); return isFinite(va)&&isFinite(vb)&&Math.abs(va-vb)<1e-6*(1+Math.abs(vb)); }); }
  function generique(prec,l){ // l'indice universel du vérificateur : une valeur numérique
    if(mode==='equation'&&prec.poly&&Poly.deg(prec.poly)===1){ const x0=-prec.poly[0]/prec.poly[1]; const g=evaluer(l.L,x0), d=evaluer(l.R,x0);
      return {code:'valeur',question:'Si tu remplaces $'+lettre+'$ par la solution de la ligne précédente, les deux membres de ta ligne sont-ils égaux ?',
        indice:'La ligne précédente a pour solution $'+lettre+'='+nombre(x0)+'$. Dans ta ligne, pour $'+lettre+'='+nombre(x0)+'$, le membre de gauche vaut $'+nombre(g)+'$ et le droit $'+nombre(d)+'$ : ta ligne n\'a pas la même solution.',
        exemple:'Pour transformer une équation sans changer sa solution : ajouter, soustraire, multiplier ou diviser les DEUX membres par la même chose.'}; }
    const x0=2; const a=evaluer(prec.ast,x0), b=evaluer(l.ast,x0);
    return {code:'valeur',question:'Si $'+lettre+'=2$, que vaut la ligne précédente ? Et la tienne ?',
      indice:'Pour $'+lettre+'=2$ : la ligne précédente vaut $'+nombre(a)+'$, la tienne vaut $'+nombre(b)+'$. Deux expressions égales doivent donner la même valeur pour tout $'+lettre+'$.',
      exemple:'Vérifie chaque transformation avec une valeur : si $'+lettre+'=2$, $3(x+5)=21$ et $3x+15=21$ aussi.'}; }
  // le départ : questions pour démarrer, sans erreur préalable
  function aideDepart(){ if(mode==='equation') return {question:'Ton but : avoir $'+lettre+'$ tout seul d\'un côté. Quel terme t\'en empêche pour l\'instant ?',indice:'Fais passer les nombres d\'un côté et les $'+lettre+'$ de l\'autre, en changeant leur signe quand ils changent de membre. Puis divise les deux membres par le nombre devant $'+lettre+'$.',exemple:'Sur $2x+3=11$ : $2x=11-3$, donc $2x=8$, puis $x=8\\div 2=4$.'};
    if(mode==='factoriser') return {question:'Quel facteur retrouves-tu dans chaque terme ?',indice:'Cherche un facteur commun à tous les termes (un nombre, une lettre, ou une parenthèse), puis écris $k\\times(\\ldots)$ : ce qui reste de chaque terme va dans la parenthèse.',exemple:'Sur $6x+9$ : $3$ est commun, $6x=3\\times 2x$ et $9=3\\times 3$, donc $3(2x+3)$.'};
    return {question:'Quels termes vont ensemble ? Repère les termes en $'+lettre+'$ et les nombres tout seuls.',indice:'Regroupe les termes semblables : d\'abord tous les $'+lettre+'$ ensemble, puis tous les nombres. S\'il y a une parenthèse, développe-la d\'abord.',exemple:'Sur $4x+3-x+5$ : $4x-x=3x$ et $3+5=8$, donc $3x+8$.'}; }
  bAide.addEventListener('click',()=>{ if(E.fini) return; const d0=E.dernierDiag||aideDepart(); const d={question:enLettre(d0.question,lettre),indice:enLettre(d0.indice,lettre),exemple:enLettre(d0.exemple,lettre)}; E.aide=Math.min(3,E.aide+1); niveau();
    if(iaOn()&&P()) P().ia.compter();
    const on=iaOn();
    if(E.aide===1) dire((on?'<strong>Une question d\'abord :</strong> ':'<strong>Indice 1.</strong> ')+d.question,'info');
    else if(E.aide===2) dire((on?'<strong>Un indice :</strong> ':'<strong>Indice 2.</strong> ')+d.indice,'info');
    else dire((on?'<strong>Regarde sur un exemple voisin, puis reviens à ton calcul :</strong> ':'<strong>Exemple voisin.</strong> ')+d.exemple+' <span class="discret">Le tuteur ne donne jamais la réponse de ton exercice.</span>','info');
    bAide.textContent= E.aide>=3?'Relire l\'exemple':E.aide===2?'Montre-moi sur un exemple voisin':'Un autre indice'; });
  function finir(){ E.fini=true; input.disabled=true; $('form button').disabled=true; bAide.hidden=true; $('[data-recommencer]').hidden=false;
    const n=['sans aucune aide','avec une question','avec un indice','avec un guidage fort'][E.aide];
    dire('<strong>Résolu '+n+'.</strong> '+(E.aide===0?'C\'est exactement ce qui fait progresser ton indicateur d\'autonomie.':'La prochaine fois, essaie d\'attendre un peu plus avant de demander : chaque palier d\'aide compte un peu moins.')+(E.erreurs?' Tu as corrigé '+E.erreurs+' erreur'+(E.erreurs>1?'s':'')+' en route : c\'est ça, apprendre.':''),'bon');
    if(P()){ P().exercice({chapitre,id,ok:true,aide:E.aide,erreurs:E.erreurs}); P().etape(chapitre,'calculer'); } }
  $('[data-recommencer]').addEventListener('click',()=>{ el._pret=false; initTuteur(el); });
}
window.Tuteur={init(r){ r.querySelectorAll('.tuteur').forEach(initTuteur); },parser,poly,Poly,tex,diagnostiquer};
})();
