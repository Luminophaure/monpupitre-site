/* =====================================================================
   GÉNÉRATEURS — chapitre « Suites numériques » (première spécialité)
   Même format que les autres générateurs :
     { enonce, type:'nombre'|'qcm', reponse, choix, explication, tolerance, media }
   Tout se calcule sans calculatrice (épreuve anticipée) : raisons entières ou simples,
   puissances de 2 et de 3, sommes courtes. Les mauvaises réponses des QCM sont les erreurs
   de la liste du chapitre : u(n)+1 pour u(n+1), décalage d'indice, raison d'un pourcentage,
   (u₀q)ⁿ pour u₀qⁿ, signe de uₙ pris pour celui de u(n+1) − uₙ…
   ===================================================================== */
(function(){
"use strict";
const hasard=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const prendre=a=>a[Math.floor(Math.random()*a.length)];
const melanger=a=>{ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
function qcm(bonne,reserve,n){ const autres=melanger([...new Set(reserve)].filter(r=>r!==bonne)).slice(0,(n||4)-1); const choix=melanger([bonne,...autres]); return {type:'qcm',choix,reponse:choix.indexOf(bonne)}; }
const fr=(v,d)=>{ const r=Math.round(v*Math.pow(10,d))/Math.pow(10,d); return String(r).replace('.',','); };
const tex=(v,d)=>fr(v,d==null?3:d).replace(',','{,}');
const num=(v,d,rel)=>({type:'nombre',reponse:fr(v,d),tolerance:Math.max(Math.abs(v)*(rel||0),0.5*Math.pow(10,-d))});
const mil=v=>String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'\\,');
const IND='₀₁₂₃₄₅₆₇₈₉';
/* un polynôme en n, en LaTeX : poly([c, b, a]) = an² + bn + c */
function poly(c){ const t=[]; for(let i=c.length-1;i>=0;i--){ const k=c[i]; if(!k) continue; const a=Math.abs(k), coef=(a===1&&i>0)?'':tex(a); t.push((k<0?'-':(t.length?'+':''))+coef+(i===0?'':i===1?'n':'n^{'+i+'}')); } return t.length?t.join(''):'0'; }
const $=s=>'$'+s+'$';
const signe=v=>v<0?'-'+tex(-v):'+'+tex(v);
/* b·X écrit proprement après un premier terme : +3X, −X, +X… */
const fois=(b,X)=>(b<0?'-':'+')+(Math.abs(b)===1?'':tex(Math.abs(b)))+X;

/* ----- 1. Le terme suivant ----- */
function suivant(){
  if(hasard(0,1)===0){ const a=prendre([2,3,4,5,-2,-3]), b=prendre([-7,-4,-1,1,3,5,8]);
    const bon=poly([a+b,a]), reserve=[poly([b+1,a]),poly([b,a+1]),poly([b,a]),poly([a+b+1,a]),poly([a*a+b,a])].map($);
    return Object.assign(qcm($(bon),reserve),{enonce:'On pose $u_n='+poly([b,a])+'$. Que vaut $u_{n+1}$ ?',
      explication:'On remplace $n$ par $(n+1)$ : $u_{n+1}='+tex(a)+'(n+1)'+signe(b)+'='+bon+'$. Attention : $u_n+1='+poly([b+1,a])+'$, ce n\'est pas le terme suivant.'}); }
  const b=prendre([-5,-3,-2,-1,1,2,4]), c=prendre([-4,-1,0,2,3,6]);
  const bon=poly([1+b+c,2+b,1]);
  const reserve=[poly([c+1,b,1]),poly([1+b+c,b,1]),poly([c+1,b+2,1]),poly([c,b,1])].map($);
  return Object.assign(qcm($(bon),reserve),{enonce:'On pose $u_n='+poly([c,b,1])+'$. Que vaut $u_{n+1}$ ?',
    explication:'On remplace chaque $n$ par $(n+1)$ : $u_{n+1}=(n+1)^2'+fois(b,'(n+1)')+(c?signe(c):'')+'=n^2+2n+1'+fois(b,'n')+signe(b)+(c?signe(c):'')+'='+bon+'$. Le piège : $(n+1)^2=n^2+2n+1$, pas $n^2+1$.'});
}

/* ----- 2. Une suite explicite ----- */
function explicite(){
  const cas=hasard(0,2);
  if(cas<2){ const a=prendre([1,2,-1,3]), b=hasard(-6,6), c=hasard(-5,9), k=hasard(2,6); const v=a*k*k+b*k+c;
    return Object.assign(num(v,0),{enonce:'On pose $u_n='+poly([c,b,a])+'$. Calcule $u_{'+k+'}$.',
      explication:'On remplace $n$ par $'+k+'$ : $u_{'+k+'}='+(a===1?k+'^2':a===-1?'-('+k+'^2)':tex(a)+'\\times'+k+'^2')+(b?signe(b)+'\\times'+k:'')+(c?signe(c):'')+'='+tex(v)+'$.'}); }
  const a=prendre([1,2,3,5]), q=prendre([2,3]), k=q===2?hasard(2,6):hasard(2,4); const v=a*Math.pow(q,k);
  return Object.assign(num(v,0),{enonce:'On pose $u_n='+(a===1?'':a+'\\times')+q+'^n$. Calcule $u_{'+k+'}$.',
    explication:'$u_{'+k+'}='+(a===1?'':a+'\\times')+q+'^{'+k+'}='+(a===1?'':a+'\\times'+Math.pow(q,k)+'=')+mil(v)+'$.'});
}

/* ----- 3. Une suite définie par récurrence ----- */
function recurrence(){
  const a=prendre([2,3,-2,2]), b=prendre([-4,-3,-1,1,2,5]), u0=hasard(1,5), k=prendre([2,3,3]);
  const t=[u0]; for(let n=1;n<=k;n++) t.push(a*t[n-1]+b);
  const etapes=t.slice(1).map((v,n)=>'u_{'+(n+1)+'}='+tex(a)+'\\times'+(t[n]<0?'('+tex(t[n])+')':tex(t[n]))+signe(b)+'='+tex(v)).join(' ;\\ ');
  return Object.assign(num(t[k],0),{enonce:'$u_0='+u0+'$ et $u_{n+1}='+tex(a)+'u_n'+signe(b)+'$. Calcule $u_{'+k+'}$.',
    explication:'De proche en proche, sans sauter de rang : $'+etapes+'$.'});
}

/* ----- 4. Indices et nombre de termes ----- */
function indice(){ const cas=hasard(0,4);
  if(cas===0){ const k=hasard(5,40); return Object.assign(num(k-1,0),{enonce:'Une suite commence à $u_0$. Quel est l\'indice de son '+k+'<sup>e</sup> terme ?',explication:'Le 1<sup>er</sup> terme est $u_0$, le 2<sup>e</sup> est $u_1$… L\'indice a un de moins que le numéro : le '+k+'<sup>e</sup> terme est $u_{'+(k-1)+'}$.'}); }
  if(cas===1){ const k=hasard(5,40); return Object.assign(num(k,0),{enonce:'Une suite commence à $u_1$. Quel est l\'indice de son '+k+'<sup>e</sup> terme ?',explication:'Quand la suite commence à $u_1$, l\'indice et le numéro coïncident : $u_{'+k+'}$.'}); }
  if(cas===2){ const p=hasard(0,8), n=p+hasard(5,30); return Object.assign(num(n-p+1,0),{enonce:'Combien y a-t-il de termes de $u_{'+p+'}$ à $u_{'+n+'}$, ces deux termes compris ?',explication:'$'+n+'-'+p+'+1='+(n-p+1)+'$. Sans le $+1$, on oublie le premier terme.'}); }
  if(cas===3){ const y=hasard(2028,2045); return Object.assign(num(y-2026,0),{enonce:'On relève une population chaque année, avec $u_0$ pour 2026. Quel est l\'indice du relevé de '+y+' ?',explication:'$u_n$ correspond à l\'année $2026+n$, donc $n='+y+'-2026='+(y-2026)+'$.'}); }
  const n=hasard(3,30); return Object.assign(num(n+1,0),{enonce:'Combien y a-t-il de termes de $u_0$ à $u_{'+n+'}$ ?',explication:'$'+n+'-0+1='+(n+1)+'$ : en partant de $u_0$, il y a un terme de plus que le dernier indice.'}); }

/* ----- 5. Reconnaître une suite ----- */
function reconnaitre(){ const cas=hasard(0,2); let t,bon,exp;
  const A=r=>'arithmétique de raison '+$(tex(r)), G=q=>'géométrique de raison '+$(tex(q)), N='ni arithmétique ni géométrique';
  if(cas===0){ const u0=hasard(-5,12), r=prendre([-6,-4,-3,-2,2,3,4,5,7]); t=[0,1,2,3].map(n=>u0+n*r); bon=A(r); exp='Les écarts valent tous $'+tex(r)+'$ : on ajoute toujours le même nombre.'; }
  else if(cas===1){ const u0=prendre([1,2,3,5,-2,64,81]), q=u0===64?prendre([0.5,0.25]):u0===81?1/3:prendre([2,3,-2,4]); t=[0,1,2,3].map(n=>u0*Math.pow(q,n)); bon=G(q===1/3?'\\tfrac13':q); exp='Chaque terme est le précédent multiplié par $'+(q===1/3?'\\frac13':tex(q))+'$ : le quotient est constant.';
    if(q===1/3) bon='géométrique de raison $\\frac13$'; }
  else { const k=hasard(0,3); t=[[1,4,9,16],[2,5,10,17],[1,3,6,10],[1,2,4,7],[0,1,1,2]][k===3?prendre([3,4]):k]; bon=N; exp='Écarts : '+t.slice(1).map((v,i)=>'$'+tex(v-t[i])+'$').join(', ')+' (pas constants). Quotients pas constants non plus : ni l\'un ni l\'autre.'; }
  const d1=t[1]-t[0], q0=t[0]?t[1]/t[0]:2, q1=Math.abs(q0*100-Math.round(q0*100))<1e-9?q0:3;
  const reserve=[N,A(d1),G(q1||2),A(d1+1),G(2),A(2),G(3),A(-d1||1)];
  return Object.assign(qcm(bon,reserve),{enonce:'Les premiers termes d\'une suite sont '+t.map(v=>'$'+tex(v)+'$').join(' ; ')+'. Ils peuvent être ceux d\'une suite…',explication:exp}); }

/* ----- 6. Retrouver la raison ----- */
function raison(){ const cas=hasard(0,2);
  if(cas<2){ const r=prendre([-4,-3,-2,2,3,4,5,6]), p=hasard(0,6), k=hasard(2,9), up=hasard(-10,20); const un=up+k*r;
    return Object.assign(num(r,0),{enonce:'$(u_n)$ est arithmétique, $u_{'+p+'}='+tex(up)+'$ et $u_{'+(p+k)+'}='+tex(un)+'$. Quelle est sa raison $r$ ?',
      explication:'De $u_{'+p+'}$ à $u_{'+(p+k)+'}$, il y a $'+k+'$ rangs, donc $u_{'+(p+k)+'}=u_{'+p+'}+'+k+'r$ : $'+k+'r='+tex(un)+'-'+(up<0?'('+tex(up)+')':tex(up))+'='+tex(un-up)+'$ et $r='+tex(r)+'$.'}); }
  const q=prendre([2,3]), u0=prendre([1,2,3,5]), k=q===2?hasard(2,4):2; const uk=u0*Math.pow(q,k);
  return Object.assign(num(q,0),{enonce:'$(u_n)$ est géométrique à termes positifs, $u_0='+u0+'$ et $u_'+k+'='+uk+'$. Quelle est sa raison $q$ ?',
    explication:'$u_'+k+'=u_0\\times q^'+k+'$, donc $q^'+k+'=\\frac{'+uk+'}{'+u0+'}='+Math.pow(q,k)+'$ et, avec $q&gt;0$, $q='+q+'$.'}); }

/* ----- 7. La raison d'un pourcentage ----- */
function taux(){ const t=prendre([2,3,4,5,8,10,12,15,20,25,30,40]); const hausse=hasard(0,1)===0;
  if(hasard(0,2)<2){ const q=hausse?1+t/100:1-t/100;
    const reserve=[tex(t/100),tex(1-t/100),tex(1+t/100),tex(-t/100),String(t),tex(1+t/10)].map($);
    return Object.assign(qcm($(tex(q)),reserve),{enonce:'Une grandeur '+(hausse?'augmente':'baisse')+' de '+t+' % chaque année. Quelle est la raison de la suite géométrique de ses valeurs ?',
      explication:(hausse?'Augmenter':'Baisser')+' de '+t+' %, c\'est multiplier par $1'+(hausse?'+':'-')+'\\frac{'+t+'}{100}='+tex(q)+'$. On garde les 100 % et on '+(hausse?'ajoute':'retire')+' '+t+' %.'}); }
  const q=hausse?1+t/100:1-t/100;
  const reserve=['une hausse de '+t+' %','une baisse de '+t+' %','une hausse de '+fr(q*100,0)+' %','une baisse de '+fr(q*100,0)+' %','une hausse de '+fr(q,2)+' %'];
  return Object.assign(qcm(hausse?'une hausse de '+t+' %':'une baisse de '+t+' %',reserve),{enonce:'Chaque année, on multiplie un prix par $'+tex(q)+'$. Quelle évolution est-ce ?',
    explication:'$'+tex(q)+'=1'+(hausse?'+':'-')+tex(t/100)+'$ : c\'est '+(hausse?'une hausse':'une baisse')+' de '+t+' %.'}); }

/* ----- 8. Le terme général ----- */
function termeGeneral(){ const cas=hasard(0,3);
  if(cas===0){ const u0=hasard(-5,15), r=prendre([-4,-3,-2,2,3,5,6]); const bon=poly([u0,r]);
    return Object.assign(qcm($('u_n='+bon),['u_n='+poly([u0-r,r]),'u_n='+poly([u0+r,r]),'u_n='+poly([r,u0]),'u_n='+poly([u0,r+1])].map($)),{enonce:'$(u_n)$ est arithmétique, $u_0='+tex(u0)+'$ et $r='+tex(r)+'$. Son terme général est…',explication:'$u_n=u_0+nr='+tex(u0)+signe(r)+'n$, qui s\'écrit $'+bon+'$.'}); }
  if(cas===1){ const u1=hasard(-5,15), r=prendre([-4,-3,-2,2,3,5,6]); const bon=poly([u1-r,r]);
    return Object.assign(qcm($('u_n='+bon),['u_n='+poly([u1,r]),'u_n='+poly([u1+r,r]),'u_n='+poly([r,u1])].map($)),{enonce:'$(u_n)$ est arithmétique, de <strong>premier terme</strong> $u_1='+tex(u1)+'$ et de raison $'+tex(r)+'$. Son terme général est…',
      explication:'La suite commence à $u_1$ : $u_n=u_1+(n-1)r='+tex(u1)+signe(r)+'(n-1)='+bon+'$. Écrire $'+poly([u1,r])+'$, c\'est le décalage d\'indice.'}); }
  const u0=prendre([2,3,5,4]), q=prendre([2,3,0.5,1.5]);
  if(cas===2) return Object.assign(qcm($('u_n='+u0+'\\times'+tex(q)+'^n'),['u_n=('+u0+'\\times'+tex(q)+')^n','u_n='+u0+'\\times'+tex(q)+'^{n+1}','u_n='+u0+'+'+tex(q)+'n','u_n='+tex(q)+'\\times'+u0+'^n'].map($)),{enonce:'$(u_n)$ est géométrique, $u_0='+u0+'$ et $q='+tex(q)+'$. Son terme général est…',explication:'$u_n=u_0\\times q^n='+u0+'\\times'+tex(q)+'^n$. Attention, $('+u0+'\\times'+tex(q)+')^n$ élève aussi $'+u0+'$ à la puissance $n$.'});
  return Object.assign(qcm($('u_n='+u0+'\\times'+tex(q)+'^{n-1}'),['u_n='+u0+'\\times'+tex(q)+'^n','u_n='+u0+'\\times'+tex(q)+'^{n+1}','u_n=('+u0+'\\times'+tex(q)+')^{n-1}'].map($)),{enonce:'$(u_n)$ est géométrique, de <strong>premier terme</strong> $u_1='+u0+'$ et de raison $'+tex(q)+'$. Son terme général est…',explication:'Elle commence à $u_1$ : $u_n=u_1\\times q^{n-1}='+u0+'\\times'+tex(q)+'^{n-1}$. De $u_1$ à $u_n$, il y a $n-1$ rangs.'}); }

/* ----- 9. Somme arithmétique ----- */
function sommeArith(){ if(hasard(0,2)===0){ const n=prendre([10,20,30,40,50,100,12,15]); const S=n*(n+1)/2;
    return Object.assign(num(S,0),{enonce:'Calcule $1+2+3+\\dots+'+n+'$.',explication:'$\\dfrac{'+n+'\\times'+(n+1)+'}{2}='+mil(S)+'$.'}); }
  const u0=hasard(1,9), r=hasard(2,5), N=hasard(6,21); const dernier=u0+(N-1)*r; const S=N*(u0+dernier)/2;
  return Object.assign(num(S,0),{enonce:'Calcule $'+u0+'+'+(u0+r)+'+'+(u0+2*r)+'+\\dots+'+dernier+'$.',
    explication:'On ajoute $'+r+'$ à chaque fois : $u_n='+u0+'+'+r+'n$. $'+u0+'+'+r+'n='+dernier+'$ donne $n='+(N-1)+'$ : de $u_0$ à $u_{'+(N-1)+'}$, il y a $'+N+'$ termes. $S='+N+'\\times\\dfrac{'+u0+'+'+dernier+'}{2}='+mil(S)+'$.'}); }

/* ----- 10. Somme géométrique ----- */
function sommeGeom(){ const q=prendre([2,2,3]), a=prendre([1,2,3,5]), N=q===2?hasard(4,9):hasard(3,6); const dernier=a*Math.pow(q,N-1); const S=a*(Math.pow(q,N)-1)/(q-1);
  return Object.assign(num(S,0),{enonce:'Calcule $'+a+'+'+a*q+'+'+a*q*q+'+\\dots+'+mil(dernier)+'$.',
    explication:'On multiplie par $'+q+'$ à chaque fois : $u_n='+(a===1?'':a+'\\times')+q+'^n$. Le dernier terme est $'+(a===1?'':a+'\\times')+q+'^{'+(N-1)+'}$ : de $u_0$ à $u_{'+(N-1)+'}$, il y a $'+N+'$ termes. $S='+a+'\\times\\dfrac{1-'+q+'^{'+N+'}}{1-'+q+'}='+(a===1?'':a+'\\times')+'\\dfrac{'+mil(Math.pow(q,N))+'-1}{'+(q-1)+'}='+mil(S)+'$.'}); }

/* ----- 11. Le sens de variation ----- */
function variation(){ const R=['croissante','décroissante','constante','ni croissante ni décroissante']; const cas=hasard(0,3);
  if(cas===0){ const e=prendre([['2n+3',0],['n^2+1',0],['5',0],['-3',1],['-n-1',1],['-2n^2-4',1],['0',2]]);
    return Object.assign(qcm(R[e[1]],R),{enonce:'Pour tout entier $n\\ge0$, $u_{n+1}-u_n='+e[0]+'$. La suite $(u_n)$ est…',
      explication:e[1]===2?'La différence est nulle : chaque terme est égal au précédent.':'Pour tout $n\\ge0$, $'+e[0]+'$ est '+(e[1]?'strictement négatif':'strictement positif')+' : chaque terme est '+(e[1]?'plus petit':'plus grand')+' que le précédent.'}); }
  if(cas===1){ const r=prendre([-5,-2,-0.5,3,1.5,4]); return Object.assign(qcm(R[r>0?0:1],R),{enonce:'$(u_n)$ est arithmétique de raison $'+tex(r)+'$. Elle est…',explication:'$u_{n+1}-u_n=r='+tex(r)+'$, '+(r>0?'positif':'négatif')+'.'}); }
  if(cas===2){ const u0=prendre([2,5,10,100]), q=prendre([0.5,0.8,1.5,2,3,0.9,-2,-0.5]); const k=q<0?3:q>1?0:1;
    return Object.assign(qcm(R[k],R),{enonce:'$(u_n)$ est géométrique, $u_0='+u0+'$ et $q='+tex(q)+'$. Elle est…',
      explication:q<0?'Avec $q&lt;0$, les termes changent de signe à chaque rang : '+u0+', '+tex(u0*q)+', '+tex(u0*q*q)+'… Ni croissante ni décroissante.':'$u_0&gt;0$ et '+(q>1?'$q&gt;1$ : chaque terme est plus grand que le précédent.':'$0&lt;q&lt;1$ : chaque terme est plus petit que le précédent.')}); }
  const q=prendre([0.5,0.8,0.2]); return Object.assign(qcm(R[1],R),{enonce:'Tous les termes de $u_n='+tex(q)+'^n$ sont positifs. La suite est donc…',
    explication:'Le signe de $u_n$ ne dit rien du sens de variation. Ici, le quotient vaut $'+tex(q)+'&lt;1$ pour des termes positifs : chaque terme est plus petit que le précédent, la suite est décroissante.'}); }

/* ----- 12. Le seuil ----- */
function seuil(){ if(hasard(0,1)===0){ const u0=prendre([1,3,5,10,25]), q=prendre([2,3]); const S=prendre([100,200,300,500,1000,2000]); let n=0,v=u0; const t=[v]; while(v<=S){ n++; v*=q; t.push(v); }
    return Object.assign(num(n,0),{enonce:'$u_0='+u0+'$ et $u_{n+1}='+q+'u_n$. Quel est le premier rang $n$ tel que $u_n&gt;'+mil(S)+'$ ?',
      explication:'Les termes : '+t.map((x,i)=>'$u_{'+i+'}='+mil(x)+'$').join(', ')+'. Le premier qui dépasse $'+mil(S)+'$ est $u_{'+n+'}$ : $n='+n+'$, un rang, pas une valeur.'}); }
  const u0=hasard(2,12), r=hasard(3,9), S=hasard(60,150); const n=Math.floor((S-u0)/r)+1;
  return Object.assign(num(n,0),{enonce:'$u_n='+u0+'+'+r+'n$. Quel est le premier rang $n$ tel que $u_n&gt;'+S+'$ ?',
    explication:'$'+u0+'+'+r+'n&gt;'+S+'\\iff n&gt;\\frac{'+(S-u0)+'}{'+r+'}\\approx'+tex((S-u0)/r,2)+'$. Le premier entier qui convient est $'+n+'$ : $u_{'+(n-1)+'}='+(u0+r*(n-1))+'$ et $u_{'+n+'}='+(u0+r*n)+'$.'}); }

/* ----- 13. Lire un nuage de points ----- */
function nuage(u0,r){ const W=320,H=220,x0=34,x1=W-12,y0=12,y1=H-26; const vals=[0,1,2,3,4,5].map(n=>u0+n*r); const lo=Math.min(0,...vals)-1, hi=Math.max(0,...vals)+1;
  const X=n=>x0+n/5.6*(x1-x0), Y=v=>y1-(v-lo)/(hi-lo)*(y1-y0);
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="nuage-svg" role="img" aria-label="Le nuage de points d\'une suite, pour n de 0 à 5, sur un quadrillage.">';
  s+='<g class="quadrillage">'; for(let n=0;n<=5;n++) s+='<line x1="'+X(n).toFixed(1)+'" y1="'+y0+'" x2="'+X(n).toFixed(1)+'" y2="'+y1+'"/>'; for(let v=Math.ceil(lo);v<=hi;v++) s+='<line x1="'+x0+'" y1="'+Y(v).toFixed(1)+'" x2="'+x1+'" y2="'+Y(v).toFixed(1)+'"/>'; s+='</g>';
  s+='<g class="trace t-n fin"><line x1="'+x0+'" y1="'+Y(0).toFixed(1)+'" x2="'+x1+'" y2="'+Y(0).toFixed(1)+'"/><line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'"/></g>';
  for(let n=0;n<=5;n++) s+='<text class="petit" x="'+X(n).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle">'+n+'</text>';
  const pas=hi-lo>14?4:2; for(let v=Math.ceil(lo/pas)*pas;v<=hi;v+=pas) s+='<text class="petit" x="'+(x0-5)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end">'+String(v).replace('-','−')+'</text>';
  vals.forEach((v,n)=>{ s+='<circle class="pt" cx="'+X(n).toFixed(1)+'" cy="'+Y(v).toFixed(1)+'" r="4.5"/>'; });
  return s+'</svg>'; }
function lecture(){ const u0=hasard(-3,9), r=prendre([-2,-1,1,2,3]); const media=nuage(u0,r);
  if(hasard(0,1)===0){ const k=hasard(1,5); return Object.assign(num(u0+k*r,0),{enonce:'Lis $u_{'+k+'}$ sur le graphique, qui représente les premiers termes d\'une suite.',media,explication:'On repère $n='+k+'$ sur l\'axe horizontal et on lit la hauteur du point : $u_{'+k+'}='+tex(u0+k*r)+'$.'}); }
  return Object.assign(num(r,0),{enonce:'Les points du graphique sont ceux d\'une suite arithmétique. Quelle est sa raison ?',media,explication:'D\'un point au suivant, on '+(r>0?'monte':'descend')+' de $'+Math.abs(r)+'$ : la raison vaut $'+tex(r)+'$. Par exemple $u_0='+tex(u0)+'$ et $u_1='+tex(u0+r)+'$.'}); }

/* ----- 14. Vers quoi va la suite ? ----- */
function limite(){ const L=['tend vers $+\\infty$','tend vers $0$','tend vers $-\\infty$','n\'a pas de limite'];
  const cas=prendre([['1{,}5^n',0,'$1{,}5&gt;1$ : les termes finissent par dépasser tout nombre.'],['2^n',0,'$2^n$ double à chaque rang.'],['0{,}5^n',1,'On divise par 2 à chaque rang : $0{,}5^{10}\\approx0{,}001$.'],['0{,}9^n',1,'$0&lt;0{,}9&lt;1$ : les termes s\'écrasent sur $0$, lentement.'],['(-1)^n',3,'Elle vaut $1$, $-1$, $1$, $-1$… sans se rapprocher de rien.'],['(-2)^n',3,'$1$, $-2$, $4$, $-8$, $16$… les termes changent de signe et grandissent : ni un nombre, ni $+\\infty$, ni $-\\infty$.'],['2n+1',0,'On ajoute 2 à chaque rang : elle dépasse tout nombre.'],['5-3n',2,'On retire 3 à chaque rang : elle descend sous tout nombre.'],['-n^2',2,'$-n^2$ descend de plus en plus vite.'],['\\dfrac{1}{n+1}',1,'$\\frac{1}{1001}$, $\\frac{1}{10\\,001}$… le dénominateur grandit, la fraction s\'écrase sur 0.']]);
  return Object.assign(qcm(L[cas[1]],L),{enonce:'On pose $u_n='+cas[0]+'$. En calculant des termes de plus en plus loin, que peut-on conjecturer ?',explication:cas[2]}); }

window.GENERATEURS=window.GENERATEURS||{};
window.GENERATEURS['suites']={
  types:{'suivant':suivant,'explicite':explicite,'recurrence':recurrence,'indice':indice,'reconnaitre':reconnaitre,'raison':raison,'taux':taux,'terme-general':termeGeneral,'somme-arith':sommeArith,'somme-geom':sommeGeom,'variation':variation,'seuil':seuil,'lecture':lecture,'limite':limite},
  categories:{'suivant':'Le terme suivant','explicite':'Calculer un terme','recurrence':'De proche en proche','indice':'Indices et nombre de termes','reconnaitre':'Arithmétique ou géométrique ?','raison':'Retrouver la raison','taux':'Un pourcentage, une raison','terme-general':'Le terme général','somme-arith':'Somme arithmétique','somme-geom':'Somme géométrique','variation':'Le sens de variation','seuil':'À partir de quel rang ?','lecture':'Lire un nuage de points','limite':'Vers quoi va la suite ?'},
  ordre:['suivant','explicite','recurrence','indice','reconnaitre','taux','terme-general','somme-arith','somme-geom','variation','seuil','lecture','limite','raison','suivant','indice'],
};
})();
