/* =====================================================================
   GÉNÉRATEURS — chapitre « Vecteurs » (seconde, sans coordonnées)
   Même format que les autres générateurs :
     { enonce, type:'nombre'|'qcm', reponse, choix, explication, media }
   Les figures sont des SVG sur quadrillage, colorées par le CSS
   (classes .trace .t-u .t-v .t-w .t-n, comme dans les pages de cours).
   ===================================================================== */
(function(){
"use strict";
const hasard=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const prendre=a=>a[Math.floor(Math.random()*a.length)];
const melanger=a=>{ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
function qcm(bonne,reserve,n){ const autres=melanger([...new Set(reserve)].filter(r=>r!==bonne)).slice(0,(n||4)-1); const choix=melanger([bonne,...autres]); return {type:'qcm',choix,reponse:choix.indexOf(bonne)}; }
const ov=s=>'\\overrightarrow{'+s+'}';
const nb=v=>String(v).replace('.','{,}');

/* ---------- figure sur quadrillage ---------- */
const U=30;
function figure(cols,rows,fleches,aria){
  const X=x=>10+x*U, Y=y=>10+(rows-y)*U;
  let g='<g class="quadrillage">';
  for(let i=0;i<=cols;i++) g+='<line x1="'+X(i)+'" y1="'+Y(0)+'" x2="'+X(i)+'" y2="'+Y(rows)+'"/>';
  for(let j=0;j<=rows;j++) g+='<line x1="'+X(0)+'" y1="'+Y(j)+'" x2="'+X(cols)+'" y2="'+Y(j)+'"/>';
  g+='</g>';
  fleches.forEach(f=>{ const x1=X(f.a[0]),y1=Y(f.a[1]),x2=X(f.b[0]),y2=Y(f.b[1]); const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,t=Math.min(12,l*.45),bx=x2-ux*t,by=y2-uy*t;
    g+='<g class="trace '+(f.cls||'t-u')+'"><line x1="'+x1+'" y1="'+y1+'" x2="'+(x2-ux*t*.6).toFixed(1)+'" y2="'+(y2-uy*t*.6).toFixed(1)+'"/><polygon points="'+x2+','+y2+' '+(bx-uy*t*.45).toFixed(1)+','+(by+ux*t*.45).toFixed(1)+' '+(bx+uy*t*.45).toFixed(1)+','+(by-ux*t*.45).toFixed(1)+'"/>';
    if(f.nom) g+='<text class="nom-vec" x="'+((x1+x2)/2-uy*15-5).toFixed(1)+'" y="'+((y1+y2)/2+ux*15+6).toFixed(1)+'">'+f.nom+'</text>';
    g+='</g>'; });
  return '<figure class="figure-svg"><svg viewBox="0 0 '+(cols*U+20)+' '+(rows*U+20)+'" role="img" aria-label="'+aria+'">'+g+'</svg></figure>';
}
const add=(p,d,k)=>[p[0]+(k==null?1:k)*d[0],p[1]+(k==null?1:k)*d[1]];
const eg=(a,b)=>a[0]===b[0]&&a[1]===b[1];
function petitVecteur(mx,my){ mx=mx||3; my=my||2; let d; do d=[hasard(-mx,mx),hasard(-my,my)]; while(Math.abs(d[0])+Math.abs(d[1])<2); return d; }
/* place des flèches de déplacements donnés dans des cases distinctes de la grille */
function placer(ds,cols,rows){
  const cases=[]; const n=ds.length; const lignes=n>3?2:1, par=Math.ceil(n/lignes), w=cols/par, h=rows/lignes;
  return ds.map((d,i)=>{ const cx=(i%par)*w, cy=Math.floor(i/par)*h;
    let a=[Math.round(cx+w/2-d[0]/2), Math.round(cy+h/2-d[1]/2)];
    a=[Math.max(Math.max(0,-d[0]),Math.min(cols-Math.max(0,d[0]),a[0])),Math.max(Math.max(0,-d[1]),Math.min(rows-Math.max(0,d[1]),a[1]))]; return {a,b:add(a,d)}; });
}

/* ----- 1. Vecteur égal ou opposé, sur une figure ----- */
function egauxFigure(){
  const d=petitVecteur(2,1); const cherche=Math.random()<0.65?'egal':'oppose';
  const rot=[-d[1],d[0]], double=[2*d[0],2*d[1]];
  const cands=melanger([{n:'egal',d},{n:'oppose',d:[-d[0],-d[1]]},{n:'double',d:double},{n:'autre',d:rot}]);
  const lettres=['a','b','c','d'];
  const pos=placer([d,...cands.map(c=>c.d)],15,9);
  const fl=[Object.assign(pos[0],{cls:'t-u',nom:'u'})].concat(cands.map((c,i)=>Object.assign(pos[i+1],{cls:'t-n',nom:lettres[i]})));
  const bonne=lettres[cands.findIndex(c=>c.n===cherche)];
  const res=qcm('$\\vec '+bonne+'$',lettres.map(l=>'$\\vec '+l+'$'));
  const exp={egal:'il a même direction, même sens et même longueur que $\\vec u$',oppose:'il a même direction et même longueur, mais le sens contraire'}[cherche];
  return Object.assign(res,{enonce:'Quel vecteur est '+(cherche==='egal'?'<strong>égal</strong> à':'<strong>opposé</strong> à')+' $\\vec u$ ?',media:figure(15,9,fl,'Le vecteur u et quatre vecteurs a, b, c, d'),
    explication:'$\\vec '+bonne+'$ : '+exp+'. Les autres ont soit une autre direction, soit une autre longueur'+(cherche==='egal'?', soit le sens contraire':', soit le même sens')+'.'});
}

/* ----- 2. Somme sur une figure ----- */
function sommeFigure(){
  let u,v; do{ u=petitVecteur(2,2); v=petitVecteur(2,2); } while(u[0]*v[1]-u[1]*v[0]===0);
  const s=add(u,v), diff=add(u,v,-1), inv=add(v,u,-1);
  const cands=melanger([{n:'s',d:s},{n:'d',d:diff},{n:'i',d:inv}]).filter((c,i,t)=>t.findIndex(x=>eg(x.d,c.d))===i);
  const lettres=['a','b','c'];
  const pos=placer([u,v,...cands.map(c=>c.d)],15,9);
  const fl=[Object.assign(pos[0],{cls:'t-u',nom:'u'}),Object.assign(pos[1],{cls:'t-v',nom:'v'})].concat(cands.map((c,i)=>Object.assign(pos[i+2],{cls:'t-n',nom:lettres[i]})));
  const bonne=lettres[cands.findIndex(c=>c.n==='s')];
  return Object.assign(qcm('$\\vec '+bonne+'$',lettres.slice(0,cands.length).map(l=>'$\\vec '+l+'$')),{enonce:'Quel vecteur est égal à $\\vec u+\\vec v$ ?',
    media:figure(15,9,fl,'Les vecteurs u, v et trois vecteurs candidats'),
    explication:'On met $\\vec v$ au bout de $\\vec u$ : le trajet total est $\\vec '+bonne+'$. Compte les carreaux : on fait le trajet de $\\vec u$, puis celui de $\\vec v$.'});
}

/* ----- 3. Produit sur une figure ----- */
function produitFigure(){
  const k=prendre([2,3,-1,-2,0.5,-0.5,1.5,-1.5]);
  let u; do{ u=petitVecteur(); if(k!==Math.round(k)) u=[u[0]*2,u[1]*2]; } while(Math.abs(u[0]*k)>6||Math.abs(u[1]*k)>4||Math.abs(u[0])>6||Math.abs(u[1])>4);
  const v=[u[0]*k,u[1]*k];
  const pos=placer([u,v],15,8);
  return {enonce:'On a $\\vec v=k\\vec u$. Quelle est la valeur de $k$ ? <span class="discret">(écris par exemple 2, −1 ou 0,5)</span>',type:'nombre',reponse:String(k).replace('.',',')+'|'+k,
    media:figure(15,8,[Object.assign(pos[0],{cls:'t-u',nom:'u'}),Object.assign(pos[1],{cls:'t-v',nom:'v'})],'Les vecteurs u et v'),
    explication:'$\\vec v$ est '+(Math.abs(k)===1?'aussi long que':Math.abs(k)>1?nb(Math.abs(k))+' fois plus long que':'deux fois plus court que')+' $\\vec u$, '+(k>0?'dans le même sens':'en sens contraire')+' : $k='+nb(k)+'$.'};
}

/* ----- 4. Chasles ----- */
const ALPH='ABCDEFGHKLMNPRST'.split('');
function trois(){ return melanger(ALPH.slice()).slice(0,3); }
function chasles(){
  const [X,Y,Z]=trois(); const t=hasard(0,4);
  const F=[
    [ov(X+Y)+'+'+ov(Y+Z), ov(X+Z), 'La fin du premier, $'+Y+'$, est le début du second : $'+ov(X+Z)+'$.'],
    [ov(Y+Z)+'+'+ov(X+Y), ov(X+Z), 'On range bout à bout : $'+ov(X+Y)+'+'+ov(Y+Z)+'='+ov(X+Z)+'$.'],
    [ov(X+Y)+'-'+ov(Z+Y), ov(X+Z), '$-'+ov(Z+Y)+'='+ov(Y+Z)+'$, donc $'+ov(X+Y)+'+'+ov(Y+Z)+'='+ov(X+Z)+'$.'],
    [ov(X+Y)+'-'+ov(X+Z), ov(Z+Y), '$-'+ov(X+Z)+'='+ov(Z+X)+'$, donc $'+ov(Z+X)+'+'+ov(X+Y)+'='+ov(Z+Y)+'$.'],
    [ov(X+Y)+'+'+ov(Y+X), '\\vec 0', 'On part de $'+X+'$ et on y revient : $'+ov(X+X)+'=\\vec 0$.'],
  ][t];
  const reserve=[ov(X+Z),ov(Z+X),ov(Y+Z),ov(Z+Y),ov(X+Y),'\\vec 0',ov(Y+X)].map(s=>'$'+s+'$');
  return Object.assign(qcm('$'+F[1]+'$',reserve),{enonce:'Simplifier $'+F[0]+'$.',explication:F[2]});
}

/* ----- 5. Parallélogramme et ordre des lettres ----- */
function parallelogramme(){
  const [X,Y,Z,T]=melanger(ALPH.slice()).slice(0,4);
  if(Math.random()<0.5){
    return Object.assign(qcm(X+Y+T+Z,[X+Y+Z+T,X+T+Y+Z,X+Z+Y+T]),{enonce:'On sait que $'+ov(X+Y)+'='+ov(Z+T)+'$. Quel quadrilatère est un parallélogramme ?',
      explication:'$'+ov(X+Y)+'='+ov(Z+T)+'$ : on lit $'+X+'$, $'+Y+'$, puis les deux autres lettres à l\'envers, $'+T+'$, $'+Z+'$. Le parallélogramme est $'+X+Y+T+Z+'$.'});
  }
  const q='$'+X+Y+Z+T+'$';
  return Object.assign(qcm('$'+ov(T+Z)+'$',['$'+ov(Z+T)+'$','$'+ov(Y+Z)+'$','$'+ov(X+T)+'$']),{enonce:q+' est un parallélogramme. $'+ov(X+Y)+'=$',
    explication:'Dans le parallélogramme '+q+', le côté opposé à $['+X+Y+']$ est $['+T+Z+']$, parcouru dans le même sens : $'+ov(X+Y)+'='+ov(T+Z)+'$.'});
}

/* ----- 6. Milieu ----- */
function milieu(){
  const [X,Y]=melanger(ALPH.filter(l=>l!=='I')).slice(0,2);
  const vraies=[ov(X+'I')+'='+ov('I'+Y), ov(X+Y)+'=2'+ov(X+'I'), ov('I'+X)+'+'+ov('I'+Y)+'=\\vec 0', ov(X+'I')+'=\\frac12'+ov(X+Y)];
  const fausses=[ov(X+'I')+'='+ov(Y+'I'), ov('I'+X)+'='+ov('I'+Y), ov(X+Y)+'=2'+ov(Y+'I'), ov(X+'I')+'+'+ov(Y+'I')+'='+ov(X+Y)];
  if(Math.random()<0.5){ const b=prendre(vraies); return Object.assign(qcm('$'+b+'$',fausses.map(s=>'$'+s+'$')),{enonce:'$I$ est le milieu de $['+X+Y+']$. Quelle égalité est vraie ?',
    explication:'$'+b+'$ est vraie. Les autres inversent un sens : par exemple $'+ov(X+'I')+'$ et $'+ov(Y+'I')+'$ vont dans des sens contraires.'}); }
  const f=prendre(fausses);
  return Object.assign(qcm('$'+f+'$',vraies.map(s=>'$'+s+'$')),{enonce:'$I$ est le milieu de $['+X+Y+']$. Quelle égalité est <strong>fausse</strong> ?',
    explication:'$'+f+'$ est fausse : un des deux vecteurs va dans le mauvais sens. Fais un petit schéma pour le voir.'});
}

/* ----- 7. Norme d'un produit ----- */
function norme(){
  const n=hasard(2,6), k=prendre([-3,-2,2,3,-0.5,0.5,4]); const r=Math.abs(k)*n;
  return {enonce:'$\\|\\vec u\\|='+n+'$. Calcule $\\|'+(k===-1?'-':nb(k))+'\\vec u\\|$.',type:'nombre',reponse:String(r).replace('.',',')+'|'+r,
    explication:'$\\|k\\vec u\\|=|k|\\times\\|\\vec u\\|='+nb(Math.abs(k))+'\\times'+n+'='+nb(r)+'$. Une longueur n\'est jamais négative.'};
}

/* ----- 8. Calcul avec des vecteurs ----- */
function calcul(){
  const a=hasard(2,3), b=prendre([-1,1,2]), c=prendre([-2,-1,1,2]);
  // a(u + b v) + c u = (a + c) u + a b v
  const cu=a+c, cv=a*b;
  const ecr=(x,y)=>{ let t=''; if(x) t+=(x===1?'':x===-1?'-':x)+'\\vec u'; if(y) t+=(y>0&&t?'+':'')+(y===1?'':y===-1?'-':y)+'\\vec v'; return t||'\\vec 0'; };
  const expr=a+'(\\vec u'+(b>0?'+':'-')+(Math.abs(b)===1?'':Math.abs(b))+'\\vec v)'+(c>0?'+':'-')+(Math.abs(c)===1?'':Math.abs(c))+'\\vec u';
  const bonne='$'+ecr(cu,cv)+'$';
  return Object.assign(qcm(bonne,['$'+ecr(1+c,cv)+'$','$'+ecr(cu,b)+'$','$'+ecr(a-c,cv)+'$','$'+ecr(cu,-cv)+'$']),{enonce:'Simplifier $'+expr+'$.',
    explication:'On développe : $'+ecr(a,cv)+(c>0?'+':'-')+(Math.abs(c)===1?'':Math.abs(c))+'\\vec u$, puis on regroupe les $\\vec u$ : $'+ecr(cu,cv)+'$.'});
}

window.GENERATEURS=window.GENERATEURS||{};
window.GENERATEURS['vecteurs']={
  types:{'egaux':egauxFigure,'somme':sommeFigure,'produit':produitFigure,'chasles':chasles,'parallelogramme':parallelogramme,'milieu':milieu,'norme':norme,'calcul':calcul},
  categories:{'egaux':'Vecteurs égaux et opposés','somme':'Somme','produit':'Produit par un réel','chasles':'Relation de Chasles','parallelogramme':'Parallélogramme','milieu':'Milieu','norme':'Produit par un réel','calcul':'Calcul vectoriel'},
  ordre:['egaux','egaux','somme','somme','produit','chasles','chasles','parallelogramme','milieu','norme','calcul'],
};
})();
