/* =====================================================================
   GRAPHES — lit les <figure class="graphe"> de la page et trace.

   Attributs possibles (tous facultatifs sauf data-f ou data-noeuds) :
     data-f="x^2 - 2x - 3"        formule (plusieurs : "x^2 | 2x+1")
     data-nom="f"                  nom(s) des courbes ("f | g")
     data-fenetre="-3 5 -5 7"      xmin xmax ymin ymax
     data-noeuds="-4,3 -3,1 0,-1"  courbe en segments passant par ces points
     data-points="A(4;5) B(1;-4)"  points à placer
     data-image="4"                montre la lecture de l'image de 4
     data-antecedents="0"          trace y = 0 et montre les antécédents
     data-interactif="image"       ajoute un curseur (image | antecedents | les-deux)
     data-tableau="-2 4"           (interactif) tableau de valeurs de -2 à 4
     class="graphe panoramique"    format plus large (16/10)
   Formules acceptées : + - * / ^ ( ), 2x, x(x-1), sqrt( ), abs( ), exp( ),
   ln( ), sin( ), cos( ), pi, et les symboles − × ² ³ √.
   ===================================================================== */
(function(){
"use strict";

/* ---------- Format des nombres ---------- */
function fmt(v){ if(Math.abs(v)<1e-9) v=0; let s=(Math.round(v*100)/100).toString(); return s.replace('.',',').replace('-','−'); }
function par(v){ return v<0 ? '('+fmt(v)+')' : fmt(v); }

/* ---------- Lecteur de formules ---------- */
const FONCS={sqrt:Math.sqrt,racine:Math.sqrt,abs:Math.abs,exp:Math.exp,ln:Math.log,log:Math.log10,sin:Math.sin,cos:Math.cos,tan:Math.tan};
const CONSTS={pi:Math.PI,e:Math.E};
function jetons(src){
  src=String(src).replace(/−/g,'-').replace(/×|·/g,'*').replace(/÷/g,'/').replace(/²/g,'^2').replace(/³/g,'^3').replace(/√/g,'sqrt').replace(/π/g,'pi');
  const t=[]; let i=0;
  while(i<src.length){
    const c=src[i];
    if(/\s/.test(c)){i++;continue;}
    if(/[0-9.,]/.test(c)){ let j=i; while(j<src.length&&/[0-9.,]/.test(src[j])) j++; t.push({k:'n',v:parseFloat(src.slice(i,j).replace(',','.')),s:src.slice(i,j)}); i=j; continue; }
    if(/[a-zA-Z]/.test(c)){ let j=i; while(j<src.length&&/[a-zA-Z]/.test(src[j])) j++; let w=src.slice(i,j);
      // découpe "xx", "2xpi"… : on reconnaît fonctions et constantes, sinon lettre par lettre
      while(w.length){ const f=Object.keys(FONCS).concat(Object.keys(CONSTS)).sort((a,b)=>b.length-a.length).find(n=>w.startsWith(n));
        if(f){ t.push({k:FONCS[f]?'f':'c',v:f}); w=w.slice(f.length); }
        else { t.push({k:(w[0]==='x'||w[0]==='n')?'x':'?',v:w[0]}); w=w.slice(1); } }   // x ou n : la variable
      i=j; continue; }
    if('+-*/^()'.includes(c)){ t.push({k:c}); i++; continue; }
    throw new Error('Caractère non reconnu : « '+c+' »');
  }
  return t;
}
function compiler(src){
  const t=jetons(src); let p=0;
  const voir=()=>t[p], prendre=()=>t[p++];
  const debutPrimaire=k=>k&&(k.k==='n'||k.k==='x'||k.k==='c'||k.k==='f'||k.k==='(');
  function expr(){ let a=terme(); while(voir()&&(voir().k==='+'||voir().k==='-')){ const o=prendre().k, b=terme(), A=a; a = o==='+' ? x=>A(x)+b(x) : x=>A(x)-b(x); } return a; }
  function terme(){ let a=unaire();
    while(voir()&&(voir().k==='*'||voir().k==='/'||debutPrimaire(voir()))){
      let o='*'; if(voir().k==='*'||voir().k==='/') o=prendre().k;
      const b=puissance(), A=a; a = o==='*' ? x=>A(x)*b(x) : x=>A(x)/b(x); }
    return a; }
  function unaire(){ if(voir()&&voir().k==='-'){ prendre(); const a=unaire(); return x=>-a(x); } if(voir()&&voir().k==='+'){ prendre(); return unaire(); } return puissance(); }
  function puissance(){ const a=primaire(); if(voir()&&voir().k==='^'){ prendre(); const b=unaire(); return x=>Math.pow(a(x),b(x)); } return a; }
  function primaire(){ const k=prendre(); if(!k) throw new Error('Formule incomplète');
    if(k.k==='n'){ const v=k.v; return ()=>v; }
    if(k.k==='x') return x=>x;
    if(k.k==='c'){ const v=CONSTS[k.v]; return ()=>v; }
    if(k.k==='f'){ const fn=FONCS[k.v]; const a = voir()&&voir().k==='(' ? primaire() : puissance(); return x=>fn(a(x)); }
    if(k.k==='('){ const a=expr(); if(!voir()||voir().k!==')') throw new Error('Parenthèse non fermée'); prendre(); return a; }
    throw new Error('Symbole inattendu : « '+(k.v||k.k)+' »'); }
  const f=expr(); if(p<t.length) throw new Error('Symbole en trop : « '+(t[p].v||t[p].k)+' »');
  return f;
}
/* Affiche la formule joliment, en remplaçant éventuellement x par une valeur */
function afficher(src,val){
  const t=jetons(src); let s=''; let prev=null;
  for(let i=0;i<t.length;i++){
    const k=t[i];
    const finPrev = prev && (prev.k==='n'||prev.k==='x'||prev.k==='c'||prev.k===')');
    const debut = k.k==='n'||k.k==='x'||k.k==='c'||k.k==='f'||k.k==='(';
    if(finPrev && debut && val!==undefined && !(prev.k==='n' && k.k!=='x' && k.k!=='(' && k.k!=='f')) s+='×';
    if(k.k==='n') s+=fmt(k.v);
    else if(k.k==='x') s+= val===undefined ? k.v : par(val);
    else if(k.k==='c') s+= k.v==='pi'?'π':k.v;
    else if(k.k==='f') s+= k.v==='sqrt'?'√':k.v;
    else if(k.k==='^'){ const n=t[i+1]; if(n&&n.k==='n'&&(n.v===2||n.v===3)){ s+= n.v===2?'²':'³'; i++; } else s+='^'; }
    else if(k.k==='*') s+='×';
    else if(k.k==='/') s+=' / ';
    else if(k.k==='-'){ const unaire=!prev||['+','-','*','/','^','('].includes(prev.k); s+= unaire?'−':' − '; }
    else if(k.k==='+') s+=' + ';
    else s+=k.k;
    prev = (k.k==='^' && (s.endsWith('²')||s.endsWith('³'))) ? {k:')'} : k;
  }
  return s;
}

/* ---------- Antécédents (résolution numérique dans la fenêtre) ---------- */
function racines(f,k,a,b){
  const n=4000, h=(b-a)/n, g=x=>f(x)-k, out=[];
  let px=a, pv=g(a);
  for(let i=1;i<=n;i++){ const x=a+i*h, v=g(x);
    if(isFinite(pv)&&Math.abs(pv)<1e-9) out.push(px);
    else if(isFinite(pv)&&isFinite(v)&&pv*v<0&&Math.abs(pv-v)<1e3){ let lo=px,hi=x; for(let j=0;j<60;j++){const m=(lo+hi)/2; if(g(lo)*g(m)<=0) hi=m; else lo=m;} out.push((lo+hi)/2); }
    px=x; pv=v; }
  if(isFinite(pv)&&Math.abs(pv)<1e-9) out.push(px);
  for(let i=1;i<n;i++){ const x0=a+(i-1)*h,x2=a+(i+1)*h,x1=a+i*h; const v0=Math.abs(g(x0)),v1=Math.abs(g(x1)),v2=Math.abs(g(x2));
    if(v1<v0&&v1<v2&&v1<1e-3){ let lo=x0,hi=x2; for(let j=0;j<80;j++){const m1=lo+(hi-lo)/3,m2=hi-(hi-lo)/3; if(Math.abs(g(m1))<Math.abs(g(m2))) hi=m2; else lo=m1;} const r=(lo+hi)/2; if(Math.abs(g(r))<1e-6) out.push(r);} }
  const res=[]; out.sort((p,q)=>p-q).forEach(r=>{ const rr=Math.abs(r-Math.round(r*100)/100)<1e-4?Math.round(r*100)/100:r; if(!res.some(s=>Math.abs(s-rr)<1e-3)) res.push(rr); });
  return res;
}
function racinesNoeuds(nd,k){
  const r=[]; nd.forEach(p=>{ if(p[1]===k) r.push(p[0]); });
  for(let i=0;i<nd.length-1;i++){ const a=nd[i][1]-k,b=nd[i+1][1]-k; if(a*b<0) r.push(nd[i][0]+a/(a-b)*(nd[i+1][0]-nd[i][0])); }
  return r.sort((p,q)=>p-q);
}
function valeurNoeuds(nd,x){ for(let i=0;i<nd.length-1;i++){ const [x0,y0]=nd[i],[x1,y1]=nd[i+1]; if(x>=x0-1e-12&&x<=x1+1e-12) return y0+(y1-y0)*(x-x0)/(x1-x0);} return NaN; }

/* ---------- Dessin ---------- */
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function etiquette(c,txt,x,y,coul,align,fond,W,H){
  c.font='600 12px "IBM Plex Mono", monospace';
  const w=c.measureText(txt).width+10, h=18;
  let lx= align==='right'? x-w : align==='center'? x-w/2 : x;
  lx=Math.max(2,Math.min(W-w-2,lx)); const ly=Math.max(2,Math.min(H-h-2,y-h/2));
  c.fillStyle=fond; c.strokeStyle=coul; c.lineWidth=1.2; c.beginPath();
  if(c.roundRect) c.roundRect(lx,ly,w,h,4); else c.rect(lx,ly,w,h); c.fill(); c.stroke();
  c.fillStyle=coul; c.textAlign='left'; c.textBaseline='middle'; c.fillText(txt,lx+5,ly+h/2+1);
}
function dessiner(cv,o){
  const w=cv.clientWidth, h=cv.clientHeight; if(!w||!h) return;
  const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h);
  const C={grid:css('--grid'),axe:css('--ink'),muted:css('--muted'),courbe:css('--curve'),bx:css('--blue'),by:css('--pink'),fond:css('--card'),c2:css('--b-prop'),c3:css('--b-meth')};
  const {xmin,xmax,ymin,ymax}=o, sx=w/(xmax-xmin), sy=h/(ymax-ymin);
  const px=x=>(x-xmin)*sx, py=y=>h-(y-ymin)*sy;
  cv._repere={xmin,xmax,ymin,ymax,sx,sy};
  // pas des graduations : 1, 2, 5, 10, 20, 50… choisi pour garder des étiquettes lisibles, sur chaque axe
  const choisirPas=(s,mini)=>{ const L=[0.1,0.2,0.5,1,2,5,10,20,50,100,200,500,1000,2000,5000,1e4,2e4,5e4,1e5,2e5,5e5,1e6]; return L.find(p=>p*s>=mini)||1e6; };
  const pasX=choisirPas(sx,30), pasY=choisirPas(sy,22);
  const grille=(s,p)=> s>=80 ? p : s>=14 ? 1 : p, etiq=(s,p)=> s>=80 ? p : s>=20 ? 1 : s>=10 ? 2 : p;
  const grilleX=grille(sx,pasX), grilleY=grille(sy,pasY);
  c.lineWidth=1; c.strokeStyle=C.grid;
  for(let x=Math.ceil(xmin/grilleX)*grilleX;x<=xmax;x+=grilleX){const X=Math.round(px(x))+.5;c.beginPath();c.moveTo(X,0);c.lineTo(X,h);c.stroke();}
  for(let y=Math.ceil(ymin/grilleY)*grilleY;y<=ymax;y+=grilleY){const Y=Math.round(py(y))+.5;c.beginPath();c.moveTo(0,Y);c.lineTo(w,Y);c.stroke();}
  const ox=Math.round(px(Math.min(Math.max(0,xmin),xmax)))+.5, oy=Math.round(py(Math.min(Math.max(0,ymin),ymax)))+.5;
  c.strokeStyle=C.axe; c.lineWidth=1.4; c.beginPath(); c.moveTo(0,oy); c.lineTo(w,oy); c.moveTo(ox,h); c.lineTo(ox,0); c.stroke();
  c.fillStyle=C.axe; c.beginPath(); c.moveTo(w,oy); c.lineTo(w-8,oy-4); c.lineTo(w-8,oy+4); c.fill();
  c.beginPath(); c.moveTo(ox,0); c.lineTo(ox-4,8); c.lineTo(ox+4,8); c.fill();
  const etX=etiq(sx,pasX), etY=etiq(sy,pasY);
  c.font='11px "IBM Plex Mono", monospace'; c.fillStyle=C.muted;
  c.textAlign='center'; c.textBaseline='top';
  for(let x=Math.ceil(xmin/etX)*etX;x<=xmax+1e-9;x+=etX){ if(Math.abs(x)<1e-9) continue; const X=px(x); if(X<8||X>w-12) continue; c.fillText(fmt(x),X,Math.min(oy+3,h-14)); }
  c.textAlign='right'; c.textBaseline='middle';
  for(let y=Math.ceil(ymin/etY)*etY;y<=ymax+1e-9;y+=etY){ if(Math.abs(y)<1e-9) continue; const Y=py(y); if(Y<10||Y>h-8) continue; c.fillText(fmt(y),Math.max(ox-4,22),Y); }
  if(xmin<0&&ymin<0){ c.textBaseline='top'; c.fillText('0',ox-3,oy+3); }
  c.font='italic 700 13px "Atkinson Hyperlegible", sans-serif';
  c.fillStyle=C.bx; c.textAlign='right'; c.textBaseline='bottom'; c.fillText('x',w-4,oy-4);
  c.fillStyle=C.by; c.textAlign='left'; c.textBaseline='top'; c.fillText('y',ox+6,2);
  const couls=[C.courbe,C.c2,C.c3];
  const traces=[];
  (o.fonctions||[]).forEach((F,i)=>{
    c.strokeStyle=couls[i%3]; c.lineWidth=2.4; c.lineJoin='round'; c.beginPath(); let on=false, der=null;
    for(let X=0;X<=w;X++){ const x=xmin+X/sx, y=F.f(x); if(!isFinite(y)||y<ymin-40||y>ymax+40){on=false;continue;} const Y=py(y); if(on) c.lineTo(X,Y); else {c.moveTo(X,Y);on=true;} if(y>=ymin&&y<=ymax) der=[X,Y]; }
    c.stroke(); if(F.nom&&der) traces.push([F.nom,der,couls[i%3]]);
  });
  if(o.noeuds){ c.strokeStyle=C.courbe; c.lineWidth=2.4; c.lineJoin='round'; c.beginPath(); o.noeuds.forEach((p,i)=> i?c.lineTo(px(p[0]),py(p[1])):c.moveTo(px(p[0]),py(p[1]))); c.stroke();
    if(o.nomNoeuds){ const l=o.noeuds[o.noeuds.length-1]; traces.push([o.nomNoeuds,[px(l[0]),py(l[1])],C.courbe]); } }
  c.setLineDash([5,4]); c.lineWidth=1.6;
  const hOk=o.horizontale!=null&&o.horizontale>=ymin&&o.horizontale<=ymax;
  if(hOk){ const Y=py(o.horizontale); c.strokeStyle=C.by; c.beginPath(); c.moveTo(0,Y); c.lineTo(w,Y); c.stroke(); }
  (o.racines||[]).forEach(r=>{ c.strokeStyle=C.bx; c.beginPath(); c.moveTo(px(r),py(o.horizontale)); c.lineTo(px(r),oy); c.stroke(); });
  const P=o.point; const pOk=P&&isFinite(P.y)&&P.y>=ymin&&P.y<=ymax;
  if(pOk){ c.strokeStyle=C.bx; c.beginPath(); c.moveTo(px(P.x),oy); c.lineTo(px(P.x),py(P.y)); c.stroke();
    c.strokeStyle=C.by; c.beginPath(); c.moveTo(px(P.x),py(P.y)); c.lineTo(ox,py(P.y)); c.stroke(); }
  c.setLineDash([]);
  traces.forEach(([nom,[X,Y],coul])=>{ c.font='italic 700 14px "Atkinson Hyperlegible", sans-serif'; c.fillStyle=coul; c.textAlign='right'; c.textBaseline='bottom'; c.fillText('𝒞'+nom,Math.max(30,X-6),Math.max(16,Y-6)); });
  (o.points||[]).forEach(q=>{ if(q.y<ymin||q.y>ymax||q.x<xmin||q.x>xmax) return; c.fillStyle=C.axe; c.beginPath(); c.arc(px(q.x),py(q.y),4.5,0,7); c.fill();
    if(q.nom){ c.font='700 13px "Atkinson Hyperlegible", sans-serif'; c.fillStyle=C.axe; c.textAlign='left'; c.textBaseline='bottom'; c.fillText(q.nom,px(q.x)+6,py(q.y)-4); } });
  (o.marques||[]).forEach(q=>{ if(q.y<ymin||q.y>ymax) return; c.fillStyle=C.by; c.beginPath(); c.arc(px(q.x),py(q.y),4,0,7); c.fill(); });
  if(hOk) etiquette(c,'y = '+fmt(o.horizontale),w-6,py(o.horizontale)-12,C.by,'right',C.fond,w,h);
  (o.racines||[]).forEach(r=>{ c.fillStyle=C.fond; c.strokeStyle=C.bx; c.lineWidth=2.5; c.beginPath(); c.arc(px(r),py(o.horizontale),5,0,7); c.fill(); c.stroke(); etiquette(c,fmt(r),px(r),oy+14,C.bx,'center',C.fond,w,h); });
  if(P){ if(pOk){ const X=px(P.x),Y=py(P.y);
      c.fillStyle=C.courbe; c.beginPath(); c.arc(X,Y,5.5,0,7); c.fill(); c.fillStyle=C.fond; c.beginPath(); c.arc(X,Y,2.2,0,7); c.fill();
      etiquette(c,fmt(P.x),X,oy+14,C.bx,'center',C.fond,w,h); etiquette(c,fmt(P.y),ox-4,Y,C.by,'right',C.fond,w,h);
      if(P.nom) etiquette(c,P.nom+'('+fmt(P.x)+' ; '+fmt(P.y)+')',X+9,Y-16,C.axe,'left',C.fond,w,h);
    } else if(isFinite(P.y)) etiquette(c,'le point ('+fmt(P.x)+' ; '+fmt(P.y)+') est hors du cadre',w/2,h-14,C.muted,'center',C.fond,w,h); }
  // dessin supplémentaire fourni par un laboratoire (bandes, termes de suite…)
  if(typeof o.apres==='function') o.apres(c,{px,py,w,h,ox,oy,C,css,etiquette:(t,x,y,coul,al)=>etiquette(c,t,x,y,coul,al,C.fond,w,h)});
}

/* ---------- Gestion du redessin (taille, thème) ---------- */
const liste=[];
function enregistrer(cv,getOpts){ const r={cv,getOpts}; liste.push(r); dessiner(cv,getOpts()); return r; }
function oublier(r){ const i=liste.indexOf(r); if(i>=0) liste.splice(i,1); }
function toutRedessiner(){ liste.forEach(r=>{ if(document.body.contains(r.cv)) dessiner(r.cv,r.getOpts()); }); }
let attente=null; const planifier=()=>{ cancelAnimationFrame(attente); attente=requestAnimationFrame(toutRedessiner); };
if(window.ResizeObserver) new ResizeObserver(planifier).observe(document.body); else addEventListener('resize',planifier);
try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change',planifier); }catch(e){}
new MutationObserver(planifier).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
document.addEventListener('toggle',planifier,true);

/* ---------- Lecture des <figure class="graphe"> ---------- */
const nb=s=>parseFloat(String(s).trim().replace('−','-').replace(',','.'));
function lireFigure(fig){
  const d=fig.dataset;
  const srcs=(d.f||'').split('|').map(s=>s.trim()).filter(Boolean);
  const noms=(d.nom||'').split('|').map(s=>s.trim());
  const fonctions=srcs.map((s,i)=>({src:s,f:compiler(s),nom:noms[i]||''}));
  const noeuds=d.noeuds? d.noeuds.trim().split(/\s+/).map(p=>p.split(/[,;]/).map(nb)) : null;
  let fen=(d.fenetre||'').trim().split(/\s+/).map(nb);
  if(fen.length!==4||fen.some(isNaN)){
    if(noeuds){ const xs=noeuds.map(p=>p[0]), ys=noeuds.map(p=>p[1]); fen=[Math.min(...xs)-1,Math.max(...xs)+1,Math.min(...ys,0)-1,Math.max(...ys,0)+1]; }
    else fen=[-5,5,-5,5];
  }
  const points=[]; (d.points||'').replace(/([A-Za-z]\w*)?\s*\(\s*([^;()]+)\s*;\s*([^;()]+)\s*\)/g,(m,n,x,y)=>{ points.push({nom:n||'',x:nb(x),y:nb(y)}); });
  return {fonctions,noeuds,fen,points};
}
function valeur(info,x){ return info.noeuds ? valeurNoeuds(info.noeuds,x) : info.fonctions[0].f(x); }
function antecedents(info,k){ return info.noeuds ? racinesNoeuds(info.noeuds,k) : racines(info.fonctions[0].f,k,info.fen[0],info.fen[1]); }
function listeFr(a){ const t=a.map(fmt); return t.length<2 ? t.join('') : t.slice(0,-1).join(' ; ')+' et '+t[t.length-1]; }

function initFigure(fig){
  if(fig._pret) return; fig._pret=true;
  let info; try{ info=lireFigure(fig); }catch(e){ fig.insertAdjacentHTML('afterbegin','<p class="retour mauvais">Graphe : '+e.message+' (vérifie data-f)</p>'); return; }
  const [xmin,xmax,ymin,ymax]=info.fen;
  const cv=document.createElement('canvas'); cv.setAttribute('role','img');
  cv.setAttribute('aria-label', fig.getAttribute('aria-label') || ('Courbe '+(info.fonctions[0]?('de '+afficher(info.fonctions[0].src)):'')));
  const legende=fig.querySelector('figcaption');
  const mode=fig.dataset.interactif;
  if(info.noeuds) info.nomNoeuds=(fig.dataset.nom||'').trim();
  const nomF=(info.fonctions[0]&&info.fonctions[0].nom)||info.nomNoeuds||'f';
  const base={fonctions:info.fonctions,noeuds:info.noeuds,nomNoeuds:info.nomNoeuds,xmin,xmax,ymin,ymax,points:info.points};

  if(!mode){
    fig.insertBefore(cv,legende||null);
    const o=Object.assign({},base);
    if(fig.dataset.image!=null){ const x=nb(fig.dataset.image); o.point={x,y:valeur(info,x)}; }
    if(fig.dataset.antecedents!=null){ const k=nb(fig.dataset.antecedents); o.horizontale=k; o.racines=antecedents(info,k); }
    enregistrer(cv,()=>o); return;
  }

  /* --- version interactive --- */
  const F=info.fonctions[0];
  const tab=(fig.dataset.tableau||'').trim().split(/\s+/).map(nb);
  const xr = tab.length===2&&!tab.some(isNaN) ? tab : [Math.ceil(xmin),Math.floor(xmax)];
  const st={mode: mode==='antecedents'?'ant':'img', x:Math.round((xr[0]+xr[1])/2), k:0};
  fig.classList.add('graphe-interactif','large');
  const gauche=document.createElement('div'); gauche.className='pile';
  gauche.appendChild(cv);
  const aide=document.createElement('p'); aide.className='discret'; gauche.appendChild(aide);
  const pan=document.createElement('div'); pan.className='panneau';
  const uid='g'+Math.random().toString(36).slice(2,8);
  pan.innerHTML=
    (mode==='les-deux'?'<div class="bascule" role="group" aria-label="Je cherche"><button data-m="img">une image</button><button data-m="ant">des antécédents</button></div>':'')+
    '<div class="curseur" data-c="img"><div class="ligne"><label for="'+uid+'x" class="vx">x (antécédent)</label><output class="vx"></output></div><input type="range" id="'+uid+'x" step="0.5" min="'+xr[0]+'" max="'+xr[1]+'"></div>'+
    '<div class="curseur" data-c="ant"><div class="ligne"><label for="'+uid+'k" class="vy">k (on cherche ses antécédents)</label><output class="vy"></output></div><input type="range" class="rose" id="'+uid+'k" step="0.5" min="'+Math.ceil(ymin+1)+'" max="'+Math.floor(ymax-1)+'"></div>'+
    '<div class="calcul"></div><div class="phrases"></div>'+
    '<div class="defile"><table class="valeurs"></table></div>';
  fig.innerHTML=''; fig.appendChild(gauche); fig.appendChild(pan); if(legende){ legende.classList.add('pleine-largeur'); fig.appendChild(legende); }
  const q=s=>pan.querySelector(s);
  const ix=q('[data-c=img] input'), ik=q('[data-c=ant] input');
  const nomAff=nomF||'f';
  function maj(){
    pan.querySelectorAll('.bascule button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===st.mode));
    q('[data-c=img]').hidden=st.mode!=='img'; q('[data-c=ant]').hidden=st.mode!=='ant';
    ix.value=st.x; ik.value=st.k; q('[data-c=img] output').textContent=fmt(st.x); q('[data-c=ant] output').textContent=fmt(st.k);
    aide.textContent = st.mode==='img' ? 'Clique sur le graphique pour choisir x.' : 'Clique sur le graphique pour placer la droite y = k.';
    const X=v=>'<span class="vx">'+v+'</span>', Y=v=>'<span class="vy">'+v+'</span>';
    if(st.mode==='img'){
      const y=valeur(info,st.x);
      q('.calcul').innerHTML = F ? nomAff+'('+X(fmt(st.x))+') = '+afficher(F.src,st.x)+' = '+Y(fmt(y)) : nomAff+'('+X(fmt(st.x))+') = '+Y(fmt(y))+' <span class="discret">(lecture graphique)</span>';
      q('.phrases').innerHTML='<p>L\'image de '+X(fmt(st.x))+' par '+nomAff+' est '+Y(fmt(y))+'.</p><p>'+X(fmt(st.x))+' est un antécédent de '+Y(fmt(y))+'.</p><p>Le point ('+X(fmt(st.x))+' ; '+Y(fmt(y))+') est sur la courbe.</p>';
    } else {
      const r=antecedents(info,st.k);
      q('.calcul').innerHTML='On cherche les x tels que '+nomAff+'(x) = '+Y(fmt(st.k))+(F?'<br>soit : '+afficher(F.src)+' = '+fmt(st.k):'');
      q('.phrases').innerHTML = r.length ? '<p>'+Y(fmt(st.k))+' a '+(r.length===1?'un seul antécédent':r.length+' antécédents')+' : '+X(listeFr(r))+'.</p><p>'+(r.length===1?'C\'est l\'abscisse':'Ce sont les abscisses')+' des points d\'intersection.</p>' : '<p>'+Y(fmt(st.k))+' n\'a aucun antécédent dans ce cadre : la droite ne coupe pas la courbe.</p>';
    }
    let r1='<tr><th>x</th>', r2='<tr><th>'+nomAff+'(x)</th>';
    for(let x=Math.ceil(xr[0]);x<=xr[1];x++){ const v=valeur(info,x); const hi= st.mode==='img' ? Math.abs(x-st.x)<1e-9 : Math.abs(v-st.k)<1e-9;
      r1+='<td data-x="'+x+'" class="'+(hi?'marque-x':'')+'">'+fmt(x)+'</td>'; r2+='<td data-x="'+x+'" class="'+(hi?'marque-y':'')+'">'+fmt(v)+'</td>'; }
    q('table').innerHTML=r1+'</tr>'+r2+'</tr>';
    dessiner(cv,opts());
  }
  function opts(){ const o=Object.assign({},base); if(st.mode==='img') o.point={x:st.x,y:valeur(info,st.x),nom:'M'}; else { o.horizontale=st.k; o.racines=antecedents(info,st.k); } return o; }
  pan.querySelectorAll('.bascule button').forEach(b=>b.addEventListener('click',()=>{st.mode=b.dataset.m;maj();}));
  ix.addEventListener('input',()=>{st.x=+ix.value;maj();});
  ik.addEventListener('input',()=>{st.k=+ik.value;maj();});
  q('table').addEventListener('click',e=>{ const td=e.target.closest('td[data-x]'); if(!td) return; const x=+td.dataset.x; if(st.mode==='img') st.x=x; else st.k=valeur(info,x); maj(); });
  cv.addEventListener('pointerdown',e=>{ const m=cv._repere; if(!m) return; const r=cv.getBoundingClientRect();
    const x=m.xmin+(e.clientX-r.left)/m.sx, y=m.ymax-(e.clientY-r.top)/m.sy;
    if(st.mode==='img') st.x=Math.max(xr[0],Math.min(xr[1],Math.round(x*2)/2)); else st.k=Math.max(+ik.min,Math.min(+ik.max,Math.round(y*2)/2)); maj(); });
  enregistrer(cv,opts); maj();
}

window.Graphe={compiler,afficher,racines,racinesNoeuds,dessiner,enregistrer,oublier,toutRedessiner,fmt,par,
  init(racine){ (racine||document).querySelectorAll('figure.graphe').forEach(initFigure); }};
})();
