/* =====================================================================
   GÉNÉRATEURS — chapitre « Suites : terme général et sommes » (terminale technologique)
   Même format que les autres générateurs :
     { enonce, type:'nombre'|'qcm', reponse, choix, explication, tolerance, media }
   Les nombres se calculent de tête ou presque ; quand une puissance comme 1,03¹⁰ serait
   nécessaire, la question devient un QCM sur la formule. Les mauvaises réponses des QCM sont
   les erreurs de la liste du chapitre : le taux pris pour la raison, « +10 % trois fois = +30 % »,
   n termes au lieu de n + 1, u₀ × qⁿ confondu avec u₁ × qⁿ⁻¹, l'exposant de la somme qui
   n'est pas le nombre de termes, les deux moyennes confondues, le dernier versement qu'on
   fait rapporter, range(n) qui s'arrête à n − 1…
   ===================================================================== */
(function(){
"use strict";
const hasard=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const prendre=a=>a[Math.floor(Math.random()*a.length)];
const melanger=a=>{ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
function qcm(bonne,reserve,n){ const autres=melanger([...new Set(reserve)].filter(r=>r!==bonne)).slice(0,(n||4)-1); const choix=melanger([bonne,...autres]); return {type:'qcm',choix,reponse:choix.indexOf(bonne)}; }
const fr=(v,d)=>{ const r=Math.round(v*Math.pow(10,d))/Math.pow(10,d); return String(r).replace('.',','); };
const tex=(v,d)=>fr(v,d==null?3:d).replace(',','{,}').replace(/^-/,'-');
const num=(v,d,rel)=>({type:'nombre',reponse:fr(v,d),tolerance:Math.max(Math.abs(v)*(rel||0),0.5*Math.pow(10,-d))});
/* 12500 → « 12\,500 » en LaTeX, « 12 500 » en texte */
const mil=v=>{ const [e,f]=fr(v,2).split(','); return e.replace(/\B(?=(\d{3})+(?!\d))/g,'\\,')+(f?'{,}'+f:''); };
const milt=v=>{ const [e,f]=fr(v,2).split(','); return e.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(f?','+f:''); };
const $=s=>'$'+s+'$';
const pc=t=>fr(t,2)+' %';
const sgn=v=>(v>0?'+':v<0?'−':'')+fr(Math.abs(v),2)+' %';

/* ----- 1. Un pourcentage, un coefficient ----- */
function coef(){ const t=prendre([2,3,4,5,8,10,12,15,20,25,30,40,60,1.5,0.5]); const hausse=hasard(0,1)===0; const q=hausse?1+t/100:1-t/100;
  if(hasard(0,2)<2){ const reserve=[tex(t/100,3),tex(-t/100,3),tex(1+t/100,3),tex(1-t/100,3),fr(t,2).replace(',','{,}'),tex(1+t/10,3),tex(t/10,3)].map($);
    return Object.assign(qcm($(tex(q,3)),reserve),{enonce:(hausse?'Une hausse':'Une baisse')+' de '+pc(t)+', c\'est multiplier par…',
      explication:'On garde les 100 % et on '+(hausse?'ajoute':'retire')+' '+pc(t)+' : $1'+(hausse?'+':'-')+'\\frac{'+fr(t,2).replace(',','{,}')+'}{100}='+tex(q,3)+'$.'+(hausse?'':' Un coefficient négatif n\'a pas de sens ici : la grandeur ne change pas de signe.')}); }
  const reserve=['une hausse de '+pc(t),'une baisse de '+pc(t),'une hausse de '+pc(q*100),'une baisse de '+pc(q*100),'une hausse de '+pc(t/10)].filter((x,i,a)=>a.indexOf(x)===i);
  return Object.assign(qcm(hausse?'une hausse de '+pc(t):'une baisse de '+pc(t),reserve),{enonce:'Multiplier par $'+tex(q,3)+'$, c\'est…',
    explication:'$'+tex(q,3)+'=1'+(hausse?'+':'-')+tex(t/100,3)+'$ : c\'est '+(hausse?'une hausse':'une baisse')+' de '+pc(t)+'.'}); }

/* ----- 2. Évolutions successives ----- */
const SUCCESSIVES=[[[10,10]],[[20,-20]],[[-10,-10]],[[50,-50]],[[10,10,10]],[[20,25]],[[-20,25]],[[5,5]],[[-50,100]],[[25,-20]],[[-30,10]],[[40,-10]],[[10,-10]],[[20,20]],[[-20,-20]],[[30,-30]],[[100,100]],[[50,50]],[[-10,20]],[[15,-20]]].map(x=>x[0]);
function successives(){ const ev=prendre(SUCCESSIVES); const cs=ev.map(e=>1+e/100); const g=cs.reduce((a,b)=>a*b,1); const t=Math.round((g-1)*10000)/100;
  const dire=e=>(e>0?'une hausse':'une baisse')+' de '+Math.abs(e)+' %';
  return Object.assign(num(t,2),{enonce:'Un prix subit '+ev.map(dire).join(', puis ')+'. Quelle est l\'évolution globale, en % ? (Un nombre négatif pour une baisse.)',
    explication:'On multiplie les coefficients : $'+cs.map(c=>tex(c,2)).join('\\times')+'='+tex(g,4)+'$, soit une évolution de '+sgn(t)+'. '+(Math.abs(t-ev.reduce((a,b)=>a+b,0))>1e-9?'Pas '+sgn(ev.reduce((a,b)=>a+b,0))+' : les pourcentages ne s\'additionnent pas.':'Ici, la somme des pourcentages tombe juste par hasard : ne t\'y fie pas.')}); }

/* ----- 3. Le taux réciproque ----- */
const RECIPROQUES=[-20,-50,25,100,-25,-10,50,-60,20,-80,-75,300];
function reciproque(){ const e=prendre(RECIPROQUES); const c=1+e/100, r=1/c, t=Math.round((r-1)*10000)/100;
  return Object.assign(num(t,2),{tolerance:0.011,enonce:'Après '+(e>0?'une hausse':'une baisse')+' de '+Math.abs(e)+' %, quelle évolution ramène à la valeur de départ ? Donne-la en %, avec un signe moins si c\'est une baisse (à 0,01 près).',
    explication:'Le coefficient de départ est $'+tex(c,2)+'$ ; le réciproque est $\\frac{1}{'+tex(c,2)+'}\\approx'+tex(r,4)+'$, soit '+sgn(t)+'. Pas '+sgn(-e)+' : la seconde évolution se calcule sur une valeur qui a déjà changé.'}); }

/* ----- 4. Le terme d'une suite arithmétique ----- */
function termeArith(){ const cas=hasard(0,2);
  if(cas===0){ const L=prendre([9600,12000,8400,14400,7200]), r=prendre([120,150,200,240,300,360]), k=hasard(3,12); const v=L+k*r;
    return Object.assign(num(v,0),{enonce:'Le loyer annuel d\'un local vaut '+milt(L)+' € en 2026 et augmente de '+r+' € par an. Quel sera-t-il en '+(2026+k)+' (en €) ?',
      explication:'Suite arithmétique : $L_n='+mil(L)+'+'+r+'n$, où $n$ compte les années depuis 2026. En '+(2026+k)+', $n='+k+'$ : $L_{'+k+'}='+mil(L)+'+'+r+'\\times'+k+'='+mil(v)+'$ €.'}); }
  if(cas===1){ const p=prendre([80,100,120,150]), r=prendre([10,12,15,20,25]), k=hasard(4,15); const v=p+(k-1)*r;
    return Object.assign(num(v,0),{enonce:'Une prime mensuelle vaut '+p+' € la 1<sup>re</sup> année, puis '+r+' € de plus chaque année. Combien vaut-elle la '+k+'<sup>e</sup> année (en €) ?',
      explication:'La suite commence à $p_1='+p+'$ : $p_n=p_1+(n-1)r$, donc $p_{'+k+'}='+p+'+'+(k-1)+'\\times'+r+'='+v+'$ €. Avec $p_1+'+k+'r$, on compterait une hausse de trop.'}); }
  const S=prendre([5000,4000,3600,6000,2500]), r=prendre([80,120,150,200,250]), k=hasard(3,12); const v=S-k*r;
  return Object.assign(num(v,0),{enonce:'Un stock de '+milt(S)+' pièces diminue de '+r+' pièces par semaine. Combien en reste-t-il au bout de '+k+' semaines ?',
    explication:'Suite arithmétique de raison $-'+r+'$ : $s_n='+mil(S)+'-'+r+'n$, donc $s_{'+k+'}='+mil(S)+'-'+(k*r)+'='+mil(v)+'$.'}); }

/* ----- 5. Le terme général d'une suite géométrique ----- */
const SITUATIONS_G=[['Un chiffre d\'affaires de','€','augmente',[80000,120000,250000]],['Une population de','habitants','augmente',[8000,12000,25000]],['Le prix annuel d\'un abonnement,','€','augmente',[120,240,480]],['La valeur d\'une machine,','€','baisse',[12000,18000,24000]],['Un stock de','pièces','baisse',[1200,2500,5000]],['Le nombre d\'abonnés d\'une application,','abonnés','augmente',[1200,2500,5000]]];
function termeGeom(){ const s=prendre(SITUATIONS_G), t=prendre([2,3,4,5,10,15,20,25]), hausse=s[2]==='augmente', q=hausse?1+t/100:1-t/100, debut=hasard(0,1), V0=prendre(s[3]);
  const Q=tex(q,2), T=tex(t/100,2), V=mil(V0);
  const bon=debut===0?'u_n='+V+'\\times'+Q+'^n':'u_n='+V+'\\times'+Q+'^{n-1}';
  const reserve=['u_n='+V+'\\times'+Q+'^n','u_n='+V+'\\times'+Q+'^{n-1}','u_n='+V+'\\times'+Q+'^{n+1}','u_n='+V+'\\times'+T+'^n','u_n='+V+(hausse?'+':'-')+mil(V0*t/100)+'n','u_n=('+V+'\\times'+Q+')^n'].map($);
  return Object.assign(qcm($(bon),reserve),{enonce:s[0]+' '+milt(V0)+' '+s[1]+' '+(debut===0?'au départ ($u_0$)':'la 1<sup>re</sup> année ($u_1$)')+', '+s[2]+' de '+t+' % par an. Quel est le terme général ?',
    explication:(hausse?'Augmenter':'Baisser')+' de '+t+' %, c\'est multiplier par $'+Q+'$ : suite géométrique de raison $'+Q+'$, pas $'+T+'$. '+(debut===0?'Elle commence à $u_0$ : $u_n=u_0\\times q^n$.':'Elle commence à $u_1$ : $u_n=u_1\\times q^{n-1}$ (de $u_1$ à $u_n$, il y a $n-1$ multiplications).')}); }

/* ----- 6. Ajouter ou multiplier ? ----- */
function nature(){ const cas=hasard(0,5);
  const A=r=>'arithmétique de raison '+$(tex(r,2)), G=q=>'géométrique de raison '+$(tex(q,3));
  let txt,bon,res,exp;
  if(cas===0){ const r=prendre([20,30,45,60,120]); txt='Un loyer augmente de '+r+' € chaque année.'; bon=A(r); res=[G(1+r/100),G(r),A(-r),G(r/100)]; exp='Une quantité fixe ajoutée chaque année : arithmétique, raison $'+r+'$.'; }
  else if(cas===1){ const t=prendre([2,3,4,5,8]); txt='Un salaire augmente de '+t+' % chaque année.'; bon=G(1+t/100); res=[A(t),G(t/100),A(t/100),G(t)]; exp='Un même pourcentage chaque année : géométrique, raison $1+\\frac{'+t+'}{100}='+tex(1+t/100,3)+'$.'; }
  else if(cas===2){ const t=prendre([10,15,20,25]); txt='Une machine perd '+t+' % de sa valeur chaque année.'; bon=G(1-t/100); res=[A(-t),G(-t/100),G(t/100),G(1+t/100)]; exp='Perdre '+t+' %, c\'est multiplier par $'+tex(1-t/100,2)+'$ : géométrique. Pas $-'+tex(t/100,2)+'$ : une raison négative ferait changer de signe chaque année.'; }
  else if(cas===3){ const r=prendre([50,80,120,150]); txt='Un stock diminue de '+r+' pièces chaque semaine.'; bon=A(-r); res=[A(r),G(1-r/1000),G(-r),A(-r/100)]; exp='Une quantité fixe retirée : arithmétique, de raison négative $-'+r+'$.'; }
  else if(cas===4){ txt='Le nombre d\'abonnés d\'une application double chaque mois.'; bon=G(2); res=[A(2),G(1.02),G(0.5),A(100)]; exp='Doubler, c\'est multiplier par 2 : géométrique de raison $2$ (une hausse de 100 % par mois).'; }
  else { const a=prendre([500,800,1000]); txt='Un placement à intérêts simples rapporte chaque année '+milt(a)+' €, toujours calculés sur le capital de départ.'; bon=A(a); res=[G(1+a/10000),G(a),A(a/100),G(1.05)]; exp='Les intérêts simples ajoutent chaque année la même somme : arithmétique. Ce sont les intérêts composés qui donnent une suite géométrique.'; }
  return Object.assign(qcm(bon,res),{enonce:txt+' La suite des valeurs est…',explication:exp+' Le mot qui décide : une quantité (« de 120 € ») ou une proportion (« de 3 % »).'}); }

/* ----- 7. Trois termes consécutifs et les moyennes ----- */
const GEOM3=[[4,6,9],[9,12,16],[16,20,25],[25,30,36],[100,120,144],[64,80,100],[2,6,18],[3,6,12],[800,840,882],[400,500,625],[1600,1800,2025],[50,60,72]];
function moyennes(){ const cas=hasard(0,2);
  if(cas===0){ const t=prendre(GEOM3); return Object.assign(num(t[1],2),{enonce:'$'+mil(t[0])+'$ ; $x$ ; $'+mil(t[2])+'$ sont trois termes consécutifs d\'une suite <strong>géométrique</strong> à termes positifs. Que vaut $x$ ?',
    explication:'$x$ est la moyenne géométrique : $x=\\sqrt{'+mil(t[0])+'\\times'+mil(t[2])+'}=\\sqrt{'+mil(t[0]*t[2])+'}='+mil(t[1])+'$. La moyenne arithmétique, $'+tex((t[0]+t[2])/2,2)+'$, irait pour une suite arithmétique.'}); }
  if(cas===1){ const a=hasard(2,40)*10, c=a+2*prendre([10,20,30,50,70]); return Object.assign(num((a+c)/2,2),{enonce:'$'+mil(a)+'$ ; $x$ ; $'+mil(c)+'$ sont trois termes consécutifs d\'une suite <strong>arithmétique</strong>. Que vaut $x$ ?',
    explication:'$x$ est la moyenne arithmétique : $x=\\frac{'+mil(a)+'+'+mil(c)+'}{2}='+mil((a+c)/2)+'$. On ajoute $'+mil((c-a)/2)+'$ à chaque fois.'}); }
  const R=['arithmétique','géométrique','ni l\'un ni l\'autre']; const k=hasard(0,2); let t;
  if(k===0){ const a=hasard(1,30)*10, r=prendre([5,10,15,20,25]); t=[a,a+r,a+2*r]; }
  else if(k===1) t=prendre(GEOM3);
  else t=prendre([[50,60,75],[10,15,25],[100,110,130],[20,30,50],[8,12,20],[30,40,60]]);
  const exp='Moyenne arithmétique des extrêmes : $\\frac{'+t[0]+'+'+t[2]+'}{2}='+tex((t[0]+t[2])/2,2)+'$ '+(k===0?'= ':'≠ ')+t[1]+'. Carré du milieu : $'+t[1]+'^2='+mil(t[1]*t[1])+'$, produit des extrêmes : $'+mil(t[0]*t[2])+'$'+(k===1?' : égaux.':' : différents.');
  return Object.assign(qcm(R[k],R,3),{enonce:'Les nombres $'+mil(t[0])+'$ ; $'+mil(t[1])+'$ ; $'+mil(t[2])+'$ sont-ils trois termes consécutifs d\'une suite…',explication:exp}); }

/* ----- 8. Combien de termes ? ----- */
function nbTermes(){ const cas=hasard(0,3);
  if(cas===0){ const p=hasard(0,6), n=p+hasard(4,25); return Object.assign(num(n-p+1,0),{enonce:'Combien de termes compte la somme $\\displaystyle\\sum_{k='+p+'}^{'+n+'}u_k$ ?',explication:'$'+n+'-'+p+'+1='+(n-p+1)+'$ termes. Sans le « +1 », on oublie le premier.'}); }
  if(cas===1){ const a=hasard(2025,2030), b=a+hasard(5,15); return Object.assign(num(b-a+1,0),{enonce:'Une entreprise verse une somme chaque année, de '+a+' à '+b+' inclus. Combien de versements fait-elle ?',explication:'$'+b+'-'+a+'+1='+(b-a+1)+'$ versements : '+a+' compte aussi.'}); }
  if(cas===2){ const n=hasard(5,30); return Object.assign(num(n+1,0),{enonce:'Combien de termes y a-t-il de $u_0$ à $u_{'+n+'}$ ?',explication:'$'+n+'-0+1='+(n+1)+'$ : en partant de $u_0$, il y a un terme de plus que le dernier indice.'}); }
  const n=hasard(4,30); return Object.assign(num(n,0),{enonce:'En Python, combien de tours fait la boucle <code>for k in range(1, '+(n+1)+'):</code> ?',explication:'<code>range(1, '+(n+1)+')</code> donne $k=1,2,\\dots,'+n+'$ : il s\'arrête juste avant '+(n+1)+'. Cela fait '+n+' tours.'}); }

/* ----- 9. Calculer une somme Σ ----- */
const SIGMAS=[
  {tex:'k',f:k=>k,p:[0,1],n:[4,10]},{tex:'k^2',f:k=>k*k,p:[1],n:[3,6]},{tex:'k^3',f:k=>k*k*k,p:[1],n:[2,4]},
  {tex:'(2k+1)',f:k=>2*k+1,p:[0,1],n:[3,7]},{tex:'2^k',f:k=>Math.pow(2,k),p:[0,1],n:[3,6]},{tex:'\\frac1k',f:k=>1/k,p:[1],n:[2,4],frac:true},{tex:'3k',f:k=>3*k,p:[1],n:[3,8]},{tex:'(10-k)',f:k=>10-k,p:[0,1],n:[3,6]}];
function sigma(){ const S=prendre(SIGMAS), p=prendre(S.p), n=hasard(S.n[0],S.n[1]); let s=0; const ts=[]; for(let k=p;k<=n;k++){ s+=S.f(k); ts.push(S.frac?(k===1?'1':'\\frac1{'+k+'}'):tex(S.f(k),0)); }
  if(S.frac){ const fr_={2:'\\frac32',3:'\\frac{11}{6}',4:'\\frac{25}{12}'}[n]; return Object.assign(num(s,2),{tolerance:0.006,enonce:'Calcule $\\displaystyle\\sum_{k='+p+'}^{'+n+'}'+S.tex+'$ (une fraction ou un décimal à 0,01 près).',explication:'$'+ts.join('+')+'='+fr_+'\\approx'+tex(s,2)+'$.'}); }
  return Object.assign(num(s,0),{enonce:'Calcule $\\displaystyle\\sum_{k='+p+'}^{'+n+'}'+S.tex+'$.',explication:'De $k='+p+'$ à $k='+n+'$ : $'+ts.join('+')+'='+s+'$'+(p===0?' (le terme $k=0$ compte aussi).':'.')}); }

/* ----- 10. Somme de termes d'une suite arithmétique ----- */
function sommeArith(){ const cas=hasard(0,2);
  if(cas===0){ const n=prendre([10,12,20,30,50,100]); const S=n*(n+1)/2; return Object.assign(num(S,0),{enonce:'Calcule $1+2+3+\\dots+'+n+'$.',explication:'$\\dfrac{'+n+'\\times'+(n+1)+'}{2}='+mil(S)+'$.'}); }
  if(cas===1){ const a=prendre([10,12,15,20,25]), b=prendre([1,2,5,0.5]), N=prendre([6,10,12]); const dernier=a+(N-1)*b, S=N*(a+dernier)/2;
    return Object.assign(num(S,2),{enonce:'Un abonnement coûte '+fr(a,2)+' € le 1<sup>er</sup> mois, puis '+fr(b,2)+' € de plus chaque mois. Combien paie-t-on en tout sur '+N+' mois (en €) ?',
      explication:'Suite arithmétique, de '+fr(a,2)+' € à $'+tex(a,2)+'+'+(N-1)+'\\times'+tex(b,2)+'='+tex(dernier,2)+'$ € : '+N+' termes. $S='+N+'\\times\\dfrac{'+tex(a,2)+'+'+tex(dernier,2)+'}{2}='+mil(S)+'$ €.'}); }
  const u0=hasard(1,9), r=hasard(2,5), N=hasard(6,15); const dernier=u0+(N-1)*r, S=N*(u0+dernier)/2;
  return Object.assign(num(S,0),{enonce:'Calcule $'+u0+'+'+(u0+r)+'+'+(u0+2*r)+'+\\dots+'+dernier+'$.',
    explication:'On ajoute $'+r+'$ à chaque fois. $'+u0+'+'+r+'n='+dernier+'$ donne $n='+(N-1)+'$ : de $u_0$ à $u_{'+(N-1)+'}$, il y a '+N+' termes. $S='+N+'\\times\\dfrac{'+u0+'+'+dernier+'}{2}='+mil(S)+'$.'}); }

/* ----- 11. Somme de termes d'une suite géométrique ----- */
function sommeGeom(){ if(hasard(0,1)===0){ const q=prendre([2,2,3]), a=prendre([1,2,3,5]), N=q===2?hasard(4,8):hasard(4,5); const dernier=a*Math.pow(q,N-1), S=a*(Math.pow(q,N)-1)/(q-1);
    return Object.assign(num(S,0),{enonce:'Calcule $'+a+'+'+a*q+'+'+a*q*q+'+\\dots+'+mil(dernier)+'$.',
      explication:'On multiplie par $'+q+'$ : le dernier terme est $'+(a===1?'':a+'\\times')+q+'^{'+(N-1)+'}$, de $u_0$ à $u_{'+(N-1)+'}$ : '+N+' termes. $S='+a+'\\times\\dfrac{'+q+'^{'+N+'}-1}{'+q+'-1}='+mil(S)+'$.'}); }
  const C=prendre([50000,80000,120000,250000]), t=prendre([2,3,4,5,6]), m=hasard(3,8), q=1+t/100, Q=tex(q,2), V=mil(C), N=m+1;
  const bon='S='+V+'\\times\\dfrac{1-'+Q+'^{'+N+'}}{1-'+Q+'}';
  const reserve=[bon,'S='+V+'\\times\\dfrac{1-'+Q+'^{'+m+'}}{1-'+Q+'}','S='+V+'\\times\\dfrac{1-'+Q+'^{'+(N+1)+'}}{1-'+Q+'}','S='+N+'\\times'+V+'\\times'+Q+'^{'+m+'}','S='+V+'\\times\\dfrac{1-'+tex(t/100,2)+'^{'+N+'}}{1-'+tex(t/100,2)+'}'].map($);
  return Object.assign(qcm($(bon),reserve),{enonce:'Un chiffre d\'affaires vaut '+milt(C)+' € en 2026 et augmente de '+t+' % par an. Le chiffre d\'affaires cumulé de 2026 à '+(2026+m)+' est…',
    explication:'Suite géométrique de raison $'+Q+'$, de $C_0$ (2026) à $C_{'+m+'}$ ('+(2026+m)+') : '+N+' termes. L\'exposant de la formule est le nombre de termes, '+N+', pas l\'indice du dernier, '+m+'.'}); }

/* ----- 12. La valeur acquise ----- */
function valeurAcquise(){ const V0=prendre([100,200,500,600,1000,1200]), V=mil(V0), t=prendre([1,2,3,4,5]), n=hasard(4,12), Q=tex(1+t/100,2), T=tex(t/100,2), P=prendre([['année','une','an'],['année','une','an'],['trimestre','un','trimestre']]), per=P[0];
  const apres=hasard(0,3)===0;
  const F=k=>'\\dfrac{'+Q+'^{'+k+'}-1}{'+T+'}';
  const bon=apres?V+'\\times'+Q+'\\times'+F(n):V+'\\times'+F(n);
  const reserve=[V+'\\times'+F(n),V+'\\times'+Q+'\\times'+F(n),V+'\\times'+F(n-1),V+'\\times'+F(n+1),V+'\\times\\dfrac{'+T+'^{'+n+'}-1}{'+T+'-1}',n+'\\times'+V+'\\times'+Q+'^{'+n+'}'].map($);
  return Object.assign(qcm($(bon),reserve),{enonce:'On verse '+milt(V0)+' € au début de chaque '+per+', à '+t+' % par '+P[2]+', intérêts composés. '+(apres?'Que vaut le placement '+P[1]+' '+per+' après le '+n+'<sup>e</sup> versement, sans nouveau versement ?':'Que vaut le placement juste après le '+n+'<sup>e</sup> versement ?'),
    explication:n+' versements, donc '+n+' termes : de $'+V+'$ (le dernier) à $'+V+'\\times'+Q+'^{'+(n-1)+'}$ (le premier). Juste après le dernier versement, $A='+V+'\\times'+F(n)+'$ ; '+(apres?P[1]+' '+per+' plus tard, tout a encore rapporté : on multiplie par $'+Q+'$.':'le facteur $'+Q+'$ en plus, ce serait '+P[1]+' '+per+' plus tard.')}); }

/* ----- 13. Ce que renvoie la fonction ----- */
const PY=[{py:'k',f:k=>k},{py:'k**2',f:k=>k*k},{py:'2*k + 1',f:k=>2*k+1},{py:'k**3',f:k=>k*k*k},{py:'2**k',f:k=>Math.pow(2,k)}];
function python(){ const T=prendre(PY), p=hasard(0,1), n=T.py==='k**3'||T.py==='2**k'?hasard(3,4):hasard(3,6), plus=hasard(0,2)>0;
  const fin=plus?n:n-1; let s=0; const ts=[]; for(let k=p;k<=fin;k++){ s+=T.f(k); ts.push(T.f(k)); }
  const code='<pre class="code">def somme(n):\n    s = 0\n    for k in range('+p+', '+(plus?'n + 1':'n')+'):\n        s = s + '+T.py+'\n    return s</pre>';
  const ks=[]; for(let k=p;k<=fin;k++) ks.push(k);
  return Object.assign(num(s,0),{enonce:'Que renvoie <code>somme('+n+')</code> ? Regarde bien où commence et où s\'arrête le <code>range</code>.',media:code,
    explication:'<code>range('+p+', '+(plus?n+' + 1':n)+')</code> donne $k='+ks.join(', ')+'$'+(plus?'':' (il s\'arrête juste avant '+n+')')+'. On ajoute : $'+ts.join('+')+'='+s+'$.'}); }

window.GENERATEURS=window.GENERATEURS||{};
window.GENERATEURS['suites-tt']={
  types:{'coef':coef,'successives':successives,'reciproque':reciproque,'terme-arith':termeArith,'terme-geom':termeGeom,'nature':nature,'moyennes':moyennes,'nb-termes':nbTermes,'sigma':sigma,'somme-arith':sommeArith,'somme-geom':sommeGeom,'valeur-acquise':valeurAcquise,'python':python},
  categories:{'coef':'Un pourcentage, un coefficient','successives':'Évolutions successives','reciproque':'Revenir au départ','terme-arith':'Terme d\'une suite arithmétique','terme-geom':'Le terme général géométrique','nature':'Ajouter ou multiplier ?','moyennes':'Trois termes consécutifs','nb-termes':'Combien de termes ?','sigma':'Calculer une somme Σ','somme-arith':'Somme arithmétique','somme-geom':'Somme géométrique','valeur-acquise':'La valeur acquise','python':'Ce que renvoie la fonction'},
  ordre:['coef','successives','terme-arith','nature','terme-geom','moyennes','nb-termes','sigma','somme-arith','somme-geom','valeur-acquise','python','reciproque','coef','nb-termes','valeur-acquise'],
};
})();
