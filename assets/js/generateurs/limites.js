/* =====================================================================
   GÉNÉRATEURS — chapitre « Limites de suites et de fonctions » (terminale)
   Même format que generateurs/fonctions.js :
     { enonce, type:'nombre'|'qcm', reponse, choix, explication, graphe, grapheApres }
   ===================================================================== */
(function(){
"use strict";
const hasard=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const prendre=a=>a[Math.floor(Math.random()*a.length)];
const melanger=a=>{ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
/* QCM : la bonne réponse + des leurres pris dans une réserve, sans doublon, 4 choix au plus */
function qcm(bonne,reserve,n){ const autres=melanger([...new Set(reserve)].filter(r=>r!==bonne)).slice(0,(n||4)-1); const choix=melanger([bonne,...autres]); return {type:'qcm',choix,reponse:choix.indexOf(bonne)}; }
/* nombre au format LaTeX français : 0{,}75 ; -3 */
const tex=v=>{ const s=(Math.round(v*1000)/1000).toString(); return s.replace('.','{,}'); };
const PINF='$+\\infty$', MINF='$-\\infty$', ZERO='$0$', PAS='pas de limite', FI='forme indéterminée', NC='on ne peut pas conclure';
const L=t=>'$\\lim\\limits_{n\\to+\\infty} '+t+'$';

/* ----- 1. Limites de référence ----- */
const REF=[
  ['\\lim\\limits_{n\\to+\\infty} \\frac{1}{n^2}', ZERO, '$\\frac1{n^2}$ : on divise 1 par un nombre de plus en plus grand.'],
  ['\\lim\\limits_{n\\to+\\infty} \\sqrt{n}', PINF, '$\\sqrt n$ dépasse tout seuil : $\\sqrt n &gt; A$ dès que $n &gt; A^2$.'],
  ['\\lim\\limits_{n\\to+\\infty} \\left(-n^3\\right)', MINF, '$n^3 \\to +\\infty$, donc son opposé tend vers $-\\infty$.'],
  ['\\lim\\limits_{n\\to+\\infty} \\frac{5}{\\sqrt{n}}', ZERO, 'Un nombre fixe divisé par $\\sqrt n \\to +\\infty$ tend vers 0.'],
  ['\\lim\\limits_{n\\to+\\infty} (-1)^n', PAS, 'La suite vaut alternativement 1 et −1 : elle ne se rapproche d\'aucun nombre.'],
  ['\\lim\\limits_{x\\to+\\infty} e^{x}', PINF, 'La fonction exponentielle tend vers $+\\infty$ en $+\\infty$.'],
  ['\\lim\\limits_{x\\to-\\infty} e^{x}', ZERO, 'En $-\\infty$, $e^x$ tend vers 0 : l\'axe des abscisses est asymptote.'],
  ['\\lim\\limits_{x\\to+\\infty} \\ln x', PINF, '$\\ln x$ tend vers $+\\infty$, lentement mais sûrement.'],
  ['\\lim\\limits_{x\\to0^+} \\ln x', MINF, 'Près de 0 (par la droite), $\\ln x$ plonge vers $-\\infty$ : l\'axe des ordonnées est asymptote.'],
  ['\\lim\\limits_{x\\to0^+} \\frac{1}{x}', PINF, '1 divisé par un petit nombre <strong>positif</strong> donne un grand nombre positif.'],
  ['\\lim\\limits_{x\\to0^-} \\frac{1}{x}', MINF, '1 divisé par un petit nombre <strong>négatif</strong> donne un grand nombre négatif.'],
  ['\\lim\\limits_{x\\to-\\infty} x^2', PINF, 'Un carré est positif, et $x^2$ grandit sans limite.'],
  ['\\lim\\limits_{x\\to-\\infty} x^3', MINF, 'Le cube d\'un grand nombre négatif est un grand nombre négatif.'],
];
function reference(){ const [t,rep,exp]=prendre(REF);
  return Object.assign(qcm(rep,[ZERO,PINF,MINF,PAS,'$1$']),{enonce:'Que vaut $'+t+'$ ?',explication:exp}); }

/* ----- 2. Suites géométriques ----- */
function geometrique(){
  const q=prendre([0.3,0.75,-0.4,-0.9,0.99,1.2,3,1.05,-1.5,-2,-1]), a=prendre([2,5,-3,-4]), b=prendre([-1,0,4,7]);
  const qs=q<0?'('+tex(q)+')':tex(q);
  const expr=(a===1?'':tex(a)+'\\times ')+qs+'^n'+(b>0?'+'+b:b<0?b:'');
  let rep, exp;
  if(Math.abs(q)<1){ rep='$'+tex(b)+'$'; exp='$-1 &lt; '+tex(q)+' &lt; 1$ donc $'+qs+'^n \\to 0$. Le terme $'+tex(a)+'\\times'+qs+'^n$ tend vers 0, il reste $'+tex(b)+'$.'; }
  else if(q>1){ rep=a>0?PINF:MINF; exp='$'+tex(q)+' &gt; 1$ donc $'+qs+'^n \\to +\\infty$. Multiplié par $'+tex(a)+'$ ('+(a>0?'positif':'négatif')+'), cela donne '+(a>0?'$+\\infty$':'$-\\infty$')+' ; ajouter '+tex(b).replace('{,}',',')+' ne change rien.'; }
  else { rep=PAS; exp='$'+tex(q)+' \\le -1$ : les termes $'+qs+'^n$ changent de signe à chaque rang'+(q<-1?' et grandissent en valeur absolue':'')+'. La suite n\'a pas de limite.'; }
  return Object.assign(qcm(rep,[PINF,MINF,PAS,'$'+tex(b)+'$','$'+tex(a+b)+'$',ZERO]),{enonce:'Soit $u_n='+expr+'$. Que vaut '+L('u_n')+' ?',explication:exp});
}

/* ----- 3. Opérations ----- */
const LIMS=[{t:'f',v:2},{t:'f',v:-3},{t:'f',v:0},{t:'i',s:1},{t:'i',s:-1}];
const texL=x=>x.t==='f'?tex(x.v):(x.s>0?'+\\infty':'-\\infty');
function calc(a,b,o){
  const neg=x=>x.t==='f'?{t:'f',v:-x.v}:{t:'i',s:-x.s};
  if(o==='-') return calc(a,neg(b),'+');
  if(o==='+'){ if(a.t==='f'&&b.t==='f') return {t:'f',v:a.v+b.v}; if(a.t==='f') return b; if(b.t==='f') return a; return a.s===b.s?a:{t:'FI',k:'\\infty-\\infty'}; }
  if(o==='*'){ if(a.t==='f'&&b.t==='f') return {t:'f',v:a.v*b.v}; const fin=a.t==='f'?a:b.t==='f'?b:null, inf=a.t==='i'?a:b;
    if(fin) return fin.v===0?{t:'FI',k:'0\\times\\infty'}:{t:'i',s:inf.s*Math.sign(fin.v)}; return {t:'i',s:a.s*b.s}; }
  if(b.t==='f'&&b.v!==0) return a.t==='f'?{t:'f',v:a.v/b.v}:{t:'i',s:a.s*Math.sign(b.v)};
  if(b.t==='i') return a.t==='f'?{t:'f',v:0}:{t:'FI',k:'\\frac{\\infty}{\\infty}'};
  if(a.t==='f'&&a.v===0) return {t:'FI',k:'\\frac00'};
  return {t:'zero'};
}
function operation(){
  let a,b,o,r;
  do{ a=prendre(LIMS); b=prendre(LIMS); o=prendre(['+','-','*','/']); r=calc(a,b,o); }while(r.t==='zero'||(r.t!=='FI'&&Math.random()<0.35));
  const opTex={'+':'u_n+v_n','-':'u_n-v_n','*':'u_n\\times v_n','/':'\\dfrac{u_n}{v_n}'}[o];
  const rep= r.t==='FI'?FI:'$'+texL(r)+'$';
  const exp= r.t==='FI' ? 'C\'est la forme indéterminée « $'+r.k+'$ » : on ne peut pas conclure avec les règles d\'opérations, il faut transformer l\'expression.'
    : 'Règle '+({'+':'de la somme','-':'de la différence','*':'du produit','/':'du quotient'}[o])+' : $\\lim('+opTex+') = '+texL(r)+'$.'+(o==='/'&&b.t==='i'?' Un nombre fixe divisé par un infini tend vers 0.':'')+(o==='*'&&r.t==='i'?' Pense à la règle des signes.':'');
  return Object.assign(qcm(rep,[PINF,MINF,ZERO,FI,'$'+tex(a.t==='f'?a.v:1)+'$']),{enonce:'On sait que $\\lim u_n='+texL(a)+'$ et $\\lim v_n='+texL(b)+'$. Que vaut $\\lim\\left('+opTex+'\\right)$ ?',explication:exp});
}

/* ----- 4. Reconnaître une forme indéterminée ----- */
const SIT=(a,b,op)=>'$\\lim u_n='+a+'$, $\\lim v_n='+b+'$, on cherche $\\lim\\left('+op+'\\right)$';
const FIS=[SIT('+\\infty','+\\infty','u_n-v_n'),SIT('0','+\\infty','u_n\\times v_n'),SIT('+\\infty','-\\infty','\\frac{u_n}{v_n}'),SIT('0','0','\\frac{u_n}{v_n}'),SIT('+\\infty','-\\infty','u_n+v_n'),SIT('-\\infty','0','u_n v_n')];
const NONFIS=[SIT('+\\infty','+\\infty','u_n+v_n'),SIT('+\\infty','3','u_n\\times v_n'),SIT('0','+\\infty','\\frac{u_n}{v_n}'),SIT('-\\infty','-\\infty','u_n+v_n'),SIT('+\\infty','+\\infty','u_n\\times v_n'),SIT('5','-\\infty','\\frac{u_n}{v_n}'),SIT('+\\infty','-\\infty','u_n-v_n')];
function formeIndeterminee(){ const bonne=prendre(FIS); const c=qcm(bonne,NONFIS,4);
  return Object.assign(c,{enonce:'Laquelle de ces situations mène à une <strong>forme indéterminée</strong> ?',explication:'Les quatre formes indéterminées sont $\\infty-\\infty$, $0\\times\\infty$, $\\frac{\\infty}{\\infty}$ et $\\frac00$. Attention : $+\\infty-(-\\infty)=+\\infty$ n\'en est pas une, et $\\frac{0}{\\infty}=0$ non plus.'}); }

/* ----- 5. Terme dominant (fractions rationnelles) ----- */
function poly(c,v){ // c = coefficients du plus haut degré au plus bas
  const deg=c.length-1; let s='';
  c.forEach((k,i)=>{ if(k===0) return; const d=deg-i, a=Math.abs(k); const lettre=d===0?'':d===1?v:v+'^{'+d+'}';
    const m= lettre&&a===1 ? '' : String(a);
    s+= s==='' ? (k<0?'-':'')+m+lettre : (k<0?'-':'+')+m+lettre; });
  return s||'0';
}
function positifPourN(c){ for(let n=1;n<=30;n++){ let v=0; c.forEach(k=>v=v*n+k); if(v<=0) return false; } return true; }
function rationnelle(){
  const cas=prendre(['egal','egal','haut','bas']);
  const p= cas==='bas'?1:2, qd= cas==='haut'?1:2;
  const d=prendre([1,2,4,5]); let a=0; while(!a) a=hasard(-9,9);
  const num=[a]; for(let i=0;i<p;i++) num.push(hasard(-6,6));
  let den; do{ den=[d]; for(let i=0;i<qd;i++) den.push(hasard(-4,8)); }while(!positifPourN(den));
  const expr='\\dfrac{'+poly(num,'n')+'}{'+poly(den,'n')+'}';
  const dn=p===1?'n':'n^{'+p+'}', dd=qd===1?'n':'n^{'+qd+'}';
  const methode='On factorise en haut par $'+(a===1?'':a===-1?'-':a)+dn+'$ et en bas par $'+(d===1?'':d)+dd+'$ : les parenthèses restantes tendent vers 1, donc $\\lim u_n=\\lim\\dfrac{'+(a===1?'':a===-1?'-':a)+dn+'}{'+(d===1?'':d)+dd+'}$';
  if(cas==='egal'){ const v=a/d;
    return {enonce:'Soit $u_n='+expr+'$. Calcule '+L('u_n')+'. <span class="discret">(écris un nombre : 2, −1,5 ou 3/4)</span>',type:'nombre',reponse:String(v).replace('.',',')+'|'+a+'/'+d,
      explication:'Forme indéterminée $\\frac{\\infty}{\\infty}$. '+methode+'$ = \\dfrac{'+a+'}{'+d+'} = '+tex(v)+'$.'}; }
  const rep= cas==='bas' ? ZERO : (a/d>0?PINF:MINF);
  return Object.assign(qcm(rep,[ZERO,PINF,MINF,'$'+tex(a/d)+'$']),{enonce:'Soit $u_n='+expr+'$. Que vaut '+L('u_n')+' ?',
    explication:methode+(cas==='bas'?' $=\\lim\\dfrac{'+a+'}{'+d+'n} = 0$ : le dénominateur est de plus haut degré.':' $=\\lim\\dfrac{'+a+'n}{'+d+'} = '+(a>0?'+\\infty':'-\\infty')+'$ : le numérateur est de plus haut degré.')}); }

/* ----- 6. Comparaison et gendarmes ----- */
function comparaison(){
  const t=hasard(0,5);
  if(t===0){ const k=prendre([2,3]); return Object.assign(qcm(PINF,[NC,ZERO,MINF]),{enonce:'Pour tout $n$, $u_n \\ge n^{'+k+'}$. Que peut-on dire de '+L('u_n')+' ?',explication:'Théorème de comparaison : $u_n$ est au-dessus d\'une suite qui tend vers $+\\infty$, donc $\\lim u_n=+\\infty$.'}); }
  if(t===1) return Object.assign(qcm(NC,[PINF,ZERO,MINF]),{enonce:'Pour tout $n$, $u_n \\le n^2$. Que peut-on dire de '+L('u_n')+' ?',explication:'Piège ! Être <strong>en dessous</strong> d\'une suite qui tend vers $+\\infty$ ne dit rien : $u_n$ peut valoir 0, $-n$ ou $n$. On ne peut pas conclure.'});
  if(t===2) return Object.assign(qcm(MINF,[NC,ZERO,PINF]),{enonce:'Pour tout $n$, $u_n \\le -\\sqrt n$. Que peut-on dire de '+L('u_n')+' ?',explication:'$-\\sqrt n \\to -\\infty$ et $u_n$ est en dessous : par comparaison, $\\lim u_n=-\\infty$.'});
  if(t===3) return Object.assign(qcm(NC,['$0$','$1$',PAS]),{enonce:'Pour tout $n$, $-1 \\le u_n \\le 1$. Que peut-on dire de '+L('u_n')+' ?',explication:'Les deux bornes ne tendent pas vers la même limite (elles valent −1 et 1) : le théorème des gendarmes ne s\'applique pas. $u_n$ peut converger vers n\'importe quel nombre de $[-1\\,;1]$, ou ne pas avoir de limite.'});
  const Lm=hasard(-5,5), a=hasard(1,4), b=hasard(1,4);
  if(t===4) return {enonce:'Pour tout $n\\ge1$, $'+Lm+'-\\dfrac{'+a+'}{n} \\le u_n \\le '+Lm+'+\\dfrac{'+b+'}{n}$. Calcule '+L('u_n')+'.',type:'nombre',reponse:String(Lm),explication:'Les deux « gendarmes » tendent vers '+Lm+' (car $\\frac{'+a+'}{n}\\to0$ et $\\frac{'+b+'}{n}\\to0$). D\'après le théorème des gendarmes, $\\lim u_n='+Lm+'$.'};
  const k=prendre([2,3,5]);
  return {enonce:'On pose $u_n=\\dfrac{'+k+'n+\\cos n}{n}$. En encadrant $\\cos n$, calcule '+L('u_n')+'.',type:'nombre',reponse:String(k),explication:'$-1\\le\\cos n\\le1$ donc $\\dfrac{'+k+'n-1}{n}\\le u_n\\le\\dfrac{'+k+'n+1}{n}$, soit $'+k+'-\\frac1n\\le u_n\\le '+k+'+\\frac1n$. Les deux bornes tendent vers '+k+' : par les gendarmes, $\\lim u_n='+k+'$.'};
}

/* ----- 7. Lecture graphique d'une limite ----- */
function lecture(){
  const Lm=hasard(-3,4), c=prendre([3,4,5,-3,-4,-5]), mode=prendre(['geo','inv']), q=prendre([0.7,0.8,-0.7,-0.6]);
  const u= mode==='geo' ? (n=>Lm+c*Math.pow(q,n)) : (n=>Lm+c/n);
  const marques=[]; for(let n=1;n<=24;n++) marques.push({x:n,y:u(n)});
  const vals=marques.map(m=>m.y), lo=Math.min(...vals,Lm)-1, hi=Math.max(...vals,Lm)+1;
  const base={fonctions:[],xmin:-1,xmax:25,ymin:Math.floor(lo),ymax:Math.ceil(hi),marques};
  return {enonce:'Voici les 24 premiers termes d\'une suite convergente. Lis sa limite (un entier).',type:'nombre',reponse:String(Lm),graphe:base,grapheApres:Object.assign({},base,{horizontale:Lm}),
    explication:'Les termes se rapprochent de la droite $y='+Lm+'$'+(mode==='geo'&&q<0?', en oscillant de part et d\'autre':'')+'. On conjecture $\\lim u_n='+Lm+'$.'};
}

window.GENERATEURS=window.GENERATEURS||{};
window.GENERATEURS['limites']={
  types:{'reference':reference,'geometrique':geometrique,'operation':operation,'forme-indeterminee':formeIndeterminee,'terme-dominant':rationnelle,'comparaison':comparaison,'lecture':lecture},
  categories:{'reference':'Limites de référence','geometrique':'Suites géométriques','operation':'Opérations','forme-indeterminee':'Formes indéterminées','terme-dominant':'Terme dominant','comparaison':'Comparaison et gendarmes','lecture':'Lecture graphique'},
  ordre:['reference','reference','geometrique','operation','operation','forme-indeterminee','terme-dominant','terme-dominant','comparaison','comparaison','lecture'],
};
})();
