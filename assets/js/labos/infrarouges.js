/* =====================================================================
   LABORATOIRES — INFRAROUGES ET DÉTECTION (première ST2S)
     spectre   parcourir le spectre électromagnétique en échelle log, placer une onde
     wien      chauffer un corps : la courbe d'émission et le graphique de Wien
     camera    une pièce vue par une caméra thermique, et le détecteur de présence
   Les outils généraux sont dans labos/commun.js.
   ===================================================================== */
(function(){
"use strict";
const {maths,css,id,nb,hasard,lire,carcasse,reglette,lier,puces,Toile,etiquette,reussi}=window.Labo;
const WIEN=2.90e-3, HC_K=0.014388;
const mil=v=>String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
/* une longueur d'onde en mètres → « 9,4 µm », « 550 nm », « 12 cm »… */
function lambdaTxt(l){ const u=[[1e3,'km'],[1,'m'],[1e-2,'cm'],[1e-3,'mm'],[1e-6,'µm'],[1e-9,'nm'],[1e-12,'pm']]; for(const [v,n] of u){ if(l>=v*0.999){ const x=l/v; return nb(x,x<10?(x<1?2:1):0)+' '+n; } } return nb(l*1e12,2)+' pm'; }
const DOMAINES=[['rayons γ',1e-14,1e-11,'--d-gamma'],['rayons X',1e-11,1e-8,'--d-x'],['ultraviolet',1e-8,4e-7,'--d-uv'],['visible',4e-7,8e-7,null],['infrarouge',8e-7,1e-3,'--d-ir'],['micro-ondes',1e-3,1e-1,'--d-micro'],['ondes radio',1e-1,1e4,'--d-radio']];
const domaine=l=>DOMAINES.find(d=>l>=d[1]&&l<d[2])||DOMAINES[6];
function arcEnCiel(ctx,x1,x2,y,h){ const g=ctx.createLinearGradient(x1,0,x2,0); [['--sc-violet',0],['--sc-bleu',.3],['--sc-vert',.5],['--sc-jaune',.7],['--sc-rouge',1]].forEach(([c,o])=>g.addColorStop(o,css(c))); ctx.fillStyle=g; ctx.fillRect(x1,y,x2-x1,h); }

/* =================================================================
   1. LE SPECTRE
   ================================================================= */
const REPERES=[
  ['Lumière verte',5.5e-7,'visible : c\'est le maximum de sensibilité de l\'œil'],['Télécommande',9.4e-7,'infrarouge proche : juste au-delà du rouge, invisible'],['Corps humain',9.4e-6,'infrarouge thermique : ce qu\'émet la peau à 310 K'],
  ['Four micro-ondes',1.2e-1,'12 cm : micro-ondes, comme le Wi-Fi'],['Radio FM',3,'3 m : ondes radio'],['Rayons X',1e-10,'0,1 nm : traverse les tissus mous, arrêté par les os'],['UV du Soleil',3e-7,'300 nm : ultraviolet, coups de soleil'],['Rayons γ',1e-12,'1 pm : radiothérapie, très énergétique'],
];
function spectre(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Le spectre électromagnétique',
    intro:'Une seule famille d\'ondes, des rayons γ aux ondes radio, classée par longueur d\'onde. L\'échelle est <strong>logarithmique</strong> : chaque graduation multiplie $\\lambda$ par 1 000. Déplace le curseur, puis relève le défi : placer une onde dont on te donne la longueur d\'onde.',
    gauche:'<canvas class="spectre-ecran" role="img" aria-label="Le spectre électromagnétique en échelle logarithmique, avec un curseur mobile."></canvas><p class="discret">Glisse le curseur ou touche l\'échelle. Au clavier : flèches (Maj pour aller plus vite).</p>'});
  d.innerHTML='<div class="champ"><span class="etiq">Aller directement à</span><div class="puces reperes"></div></div>'+
    '<div class="releves"></div>'+
    '<div class="champ defi"><span class="etiq">Défi</span><p class="enonce-defi"></p><div class="ligne"><button type="button" class="btn valider">Je suis dessus</button><button type="button" class="btn fantome autre">Autre défi</button></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={log:-6+Math.log10(9.4),defi:null,ok:0};   // log10(λ en m)
  const cv=g.querySelector('canvas');
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const ink=css('--ink'),muted=css('--muted');
    const x0=18,x1=W-18,lmin=-14,lmax=4; const X=l=>x0+(l-lmin)/(lmax-lmin)*(x1-x0);
    const y=H*.30,h=H*.26;
    DOMAINES.forEach(([nom,a,b,v])=>{ const xa=X(Math.log10(a)),xb=X(Math.log10(b)); if(v){ c.fillStyle=css(v); c.fillRect(xa,y,xb-xa,h); } else arcEnCiel(c,xa,xb,y,h);
      if(!v) return; if(nom==='ultraviolet'&&xb-xa<66) nom='UV'; const parts=nom.split(/[ -]/); if(xb-xa>=70||parts.length<2) etiquette(c,nom,(xa+xb)/2,y+h/2,ink,{align:'center',taille:11,gras:false});
      else { etiquette(c,parts[0]+(nom.includes('-')?'-':''),(xa+xb)/2,y+h/2-7,ink,{align:'center',taille:11,gras:false}); etiquette(c,parts.slice(1).join(' '),(xa+xb)/2,y+h/2+7,ink,{align:'center',taille:11,gras:false}); } });
    etiquette(c,'visible',X(Math.log10(5.6e-7)),y-10,ink,{align:'center',taille:11,gras:false});
    // l'axe
    const ya=y+h+18; c.save(); c.strokeStyle=muted; c.lineWidth=1.5; c.beginPath(); c.moveTo(x0,ya); c.lineTo(x1,ya); c.stroke();
    [[-12,'1 pm'],[-9,'1 nm'],[-6,'1 µm'],[-3,'1 mm'],[0,'1 m'],[3,'1 km']].forEach(([e,lab])=>{ c.beginPath(); c.moveTo(X(e),ya-4); c.lineTo(X(e),ya+4); c.stroke(); etiquette(c,lab,X(e),ya+16,muted,{align:'center',taille:11,gras:false}); }); c.restore();
    etiquette(c,'← plus de fréquence, plus d\'énergie',x0,H-8,muted,{taille:11,gras:false}); etiquette(c,'λ plus grande →',x1,H-8,muted,{align:'right',taille:11,gras:false});
    // le curseur
    const xc=X(st.log); c.save(); c.strokeStyle=css('--pink'); c.lineWidth=3; c.beginPath(); c.moveTo(xc,y-26); c.lineTo(xc,ya+2); c.stroke(); c.fillStyle=css('--pink'); c.beginPath(); c.moveTo(xc-8,y-30); c.lineTo(xc+8,y-30); c.lineTo(xc,y-20); c.closePath(); c.fill(); c.restore();
    const l=Math.pow(10,st.log); etiquette(c,'λ = '+lambdaTxt(l),xc,y-36,css('--pink'),{align:xc<W*.2?'left':xc>W*.8?'right':'center',taille:14});
  });
  function releves(){ const l=Math.pow(10,st.log), dm=domaine(l); const f=3e8/l;
    q('.releves').innerHTML='<span>Longueur d\'onde</span><b>'+lambdaTxt(l)+'</b><span>En mètres</span><b>'+nb(l/Math.pow(10,Math.floor(st.log)),1).replace('.',',')+' × 10<sup>'+Math.floor(st.log)+'</sup> m</b><span>Domaine</span><b>'+dm[0]+'</b><span>Fréquence f = c / λ</span><b>'+(f>=1e12?nb(f/1e12,0)+' THz':f>=1e9?nb(f/1e9,1)+' GHz':f>=1e6?nb(f/1e6,1)+' MHz':nb(f/1e3,0)+' kHz')+'</b>'; T.redessiner(); }
  function regler(v){ st.log=Math.max(-14,Math.min(4,v)); releves(); }
  const pos=e=>{ const r=cv.getBoundingClientRect(); return -14+(e.clientX-r.left-18)/(r.width-36)*18; };
  let glisse=false; cv.addEventListener('pointerdown',e=>{ glisse=true; cv.setPointerCapture(e.pointerId); regler(Math.round(pos(e)*20)/20); }); cv.addEventListener('pointermove',e=>{ if(glisse) regler(Math.round(pos(e)*20)/20); }); cv.addEventListener('pointerup',()=>{ glisse=false; }); cv.addEventListener('pointercancel',()=>{ glisse=false; });
  cv.tabIndex=0; cv.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ e.preventDefault(); regler(st.log+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?1:.1)); } });
  puces(q('.reperes'),REPERES.map(r=>r[0]),-1,i=>{ regler(Math.log10(REPERES[i][1])); const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span><strong>'+REPERES[i][0]+'</strong>, '+lambdaTxt(REPERES[i][1])+' : '+REPERES[i][2]+'.</span>'; });
  function defi(){ const choix=[[5.5e-7,'une lumière verte, 550 nm'],[9.4e-6,'le rayonnement du corps humain, 9,4 µm'],[1.2e-1,'un four à micro-ondes, 12 cm'],[3,'une radio FM, 3 m'],[1e-10,'des rayons X, 0,1 nm'],[9.4e-7,'une télécommande, 940 nm'],[1e-5,'un radiateur, 10 µm'],[3e-7,'des UV, 300 nm'],[1e-3,'1 mm, la frontière infrarouge / micro-ondes'],[4e-7,'le violet, 400 nm'],[1e-12,'des rayons γ, 1 pm'],[2e-2,'un radar, 2 cm']];
    let c; do{ c=choix[hasard(0,choix.length-1)]; }while(st.defi&&c[0]===st.defi[0]); st.defi=c; q('.enonce-defi').innerHTML='Amène le curseur sur <strong>'+c[1]+'</strong>.'; const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>Repère d\'abord la graduation la plus proche, puis affine : entre deux graduations, il y a un facteur 1 000.</span>'; }
  q('.valider').addEventListener('click',()=>{ const v=q('.verdict'); const cible=Math.log10(st.defi[0]); const ecart=st.log-cible; const l=Math.pow(10,st.log);
    if(Math.abs(ecart)<=0.12){ st.ok++; reussi(v); v.className='verdict ok'; v.innerHTML='<strong>Juste : '+lambdaTxt(l)+', dans le domaine « '+domaine(st.defi[0])[0]+' ».</strong><span>'+(st.ok>=3?'Trois défis réussis : tu sais lire une échelle logarithmique.':'Autre défi ?')+'</span>'; }
    else if(Math.abs(ecart)<=0.5){ v.className='verdict ko'; v.innerHTML='<span>Presque : tu es à '+lambdaTxt(l)+', la cible est à '+lambdaTxt(st.defi[0])+'. Sur cette échelle, un petit déplacement change beaucoup la valeur : affine avec les flèches.</span>'; }
    else if(Math.abs(Math.abs(ecart)-3)<=0.4){ v.className='verdict ko'; v.innerHTML='<span>Tu es à '+lambdaTxt(l)+' : un facteur 1 000 de trop'+(ecart>0?' (trop grand)':' (trop petit)')+'. C\'est l\'erreur classique nm / µm / mm : une graduation entière.</span>'; }
    else { v.className='verdict ko'; v.innerHTML='<span>Non : '+lambdaTxt(l)+' est dans le domaine « '+domaine(l)[0]+' ». La cible, '+lambdaTxt(st.defi[0])+', est '+(ecart>0?'à gauche':'à droite')+'.</span>'; } });
  q('.autre').addEventListener('click',defi);
  defi(); releves();
}

/* =================================================================
   2. LA LOI DE WIEN
   ================================================================= */
function planck(l,T){ const x=HC_K/(l*T); if(x>500) return 0; return Math.pow(l,-5)/(Math.exp(x)-1); }
const CORPS=[['Glaçon',273],['Corps humain',310],['Plaque chauffante',500],['Braise',1000],['Filament de lampe',2700],['Soleil',5800]];
function wien(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'Chaud, plus chaud : la loi de Wien',
    intro:'Chauffe un corps et regarde ce qu\'il émet. La courbe se déplace vers les petites longueurs d\'onde quand la température monte ; le maximum suit $\\lambda_{max}=\\dfrac{2{,}90\\times10^{-3}}{T}$. À gauche, l\'émission ; à droite, le point sur le graphique de Wien.',
    gauche:'<canvas class="large" role="img" aria-label="La courbe d\'émission du corps en fonction de la longueur d\'onde, échelle logarithmique, et le graphique de la loi de Wien avec le point correspondant."></canvas>'});
  d.innerHTML='<div class="champ"><span class="etiq">Un corps connu</span><div class="puces corps"></div></div>'+
    '<div class="reglages"></div><div class="releves"></div>'+
    '<div class="champ defi"><span class="etiq">Défi</span><p class="enonce-defi"></p><div class="ligne"><button type="button" class="btn valider">Vérifier</button><button type="button" class="btn fantome autre">Autre défi</button></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={T:310,defi:null};
  const lmax=T=>WIEN/T;
  const cv=g.querySelector('canvas');
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const ink=css('--ink'),muted=css('--muted');
    const haut=H*.55;
    // --- gauche/haut : la courbe d'émission, λ de 0,1 à 100 µm
    const x0=40,x1=W-16,y0=14,y1=haut-30, lmin=-7,lmax_=-4; const X=l=>x0+(Math.log10(l)-lmin)/(lmax_-lmin)*(x1-x0);
    arcEnCiel(c,X(4e-7),X(8e-7),y0,y1-y0); c.save(); c.globalAlpha=.35; c.fillStyle=css('--d-ir'); c.fillRect(X(8e-7),y0,x1-X(8e-7),y1-y0); c.restore();
    c.save(); c.globalAlpha=.6; c.fillStyle=css('--card'); c.fillRect(X(4e-7),y0,X(8e-7)-X(4e-7),y1-y0); c.restore();
    etiquette(c,'visible',(X(4e-7)+X(8e-7))/2,y0+12,ink,{align:'center',taille:11,gras:false}); etiquette(c,'infrarouge',(X(8e-7)+x1)/2,y0+12,ink,{align:'center',taille:11,gras:false}); etiquette(c,'UV',(x0+X(4e-7))/2,y0+12,ink,{align:'center',taille:11,gras:false});
    c.save(); c.strokeStyle=muted; c.lineWidth=1.5; c.beginPath(); c.moveTo(x0,y1); c.lineTo(x1,y1); c.moveTo(x0,y0); c.lineTo(x0,y1); c.stroke();
    [[-7,'0,1'],[-6,'1'],[-5,'10'],[-4,'100']].forEach(([e,lab])=>{ c.beginPath(); c.moveTo(X(Math.pow(10,e)),y1); c.lineTo(X(Math.pow(10,e)),y1+4); c.stroke(); etiquette(c,lab,X(Math.pow(10,e)),y1+16,muted,{align:'center',taille:11,gras:false}); }); c.restore();
    etiquette(c,'λ (µm), échelle log',x1,y1+28,muted,{align:'right',taille:11,gras:false});
    let m=0; const n=200, vals=[]; for(let k=0;k<=n;k++){ const l=Math.pow(10,lmin+(lmax_-lmin)*k/n); const v=planck(l,st.T); vals.push(v); if(v>m) m=v; }
    c.save(); c.beginPath(); c.strokeStyle=css('--chaud'); c.lineWidth=2.8; c.lineJoin='round'; for(let k=0;k<=n;k++){ const l=Math.pow(10,lmin+(lmax_-lmin)*k/n); const y=y1-vals[k]/m*(y1-y0-30); if(k) c.lineTo(X(l),y); else c.moveTo(X(l),y); } c.stroke();
    const lm=lmax(st.T); c.setLineDash([5,5]); c.lineWidth=1.5; c.beginPath(); c.moveTo(X(lm),y1); c.lineTo(X(lm),y0+30); c.stroke(); c.restore();
    etiquette(c,'λmax = '+lambdaTxt(lm),X(lm),y0+40,css('--chaud'),{align:X(lm)>W*.7?'right':'left',taille:13});
    etiquette(c,mil(st.T)+' K',x0+8,y1-10,ink,{taille:15});
    // --- bas : le graphique de Wien, T de 200 à 1 000 K (ou 6 000 K si on dépasse)
    const gy0=haut+14, gy1=H-30, gx0=40, gx1=W-16; const Tmax= st.T>1000?6000:1000, Lmax= st.T>1000?12:12;
    const GX=t=>gx0+(t-200)/(Tmax-200)*(gx1-gx0), GY=l=>gy1-Math.min(l,Lmax)/Lmax*(gy1-gy0);
    c.save(); c.strokeStyle=css('--grid'); c.lineWidth=1; c.beginPath(); for(let t=Tmax>1000?1000:300;t<=Tmax;t+=Tmax>1000?1000:100){ c.moveTo(GX(t),gy0); c.lineTo(GX(t),gy1); } for(let l=2;l<=Lmax;l+=2){ c.moveTo(gx0,GY(l)); c.lineTo(gx1,GY(l)); } c.stroke();
    c.strokeStyle=muted; c.lineWidth=1.5; c.beginPath(); c.moveTo(gx0,gy1); c.lineTo(gx1,gy1); c.moveTo(gx0,gy0); c.lineTo(gx0,gy1); c.stroke(); c.restore();
    for(let t=Tmax>1000?1000:300;t<=Tmax;t+=Tmax>1000?1000:100) etiquette(c,mil(t),GX(t),gy1+12,muted,{align:'center',taille:10,gras:false});
    for(let l=4;l<=Lmax;l+=4) etiquette(c,String(l),gx0-6,GY(l)+4,muted,{align:'right',taille:10,gras:false});
    etiquette(c,'T (K)',gx1,gy1+24,muted,{align:'right',taille:11,gras:false}); etiquette(c,'λmax (µm)',gx1-4,gy0+10,muted,{align:'right',taille:11,gras:false});
    c.save(); c.beginPath(); c.strokeStyle=css('--chaud'); c.lineWidth=2.2; let first=true; for(let t=Math.max(200,WIEN/(Lmax*1e-6));t<=Tmax;t+=Tmax/300){ const l=lmax(t)*1e6; if(first){ c.moveTo(GX(t),GY(l)); first=false; } else c.lineTo(GX(t),GY(l)); } c.stroke(); c.restore();
    const lmu=lmax(st.T)*1e6; if(lmu<=Lmax){ c.save(); c.setLineDash([4,4]); c.strokeStyle=css('--pink'); c.lineWidth=1.5; c.beginPath(); c.moveTo(GX(st.T),gy1); c.lineTo(GX(st.T),GY(lmu)); c.lineTo(gx0,GY(lmu)); c.stroke(); c.setLineDash([]); c.fillStyle=css('--pink'); c.beginPath(); c.arc(GX(st.T),GY(lmu),5,0,7); c.fill(); c.restore(); }
    else etiquette(c,'hors du graphique : λmax = '+lambdaTxt(lmax(st.T)),(gx0+gx1)/2,(gy0+gy1)/2,ink,{align:'center',taille:12});
  });
  d.querySelector('.reglages').innerHTML=reglette(u,'T','Température T (K)',250,6000,1,310);
  const L=lier(d,st,{T:v=>mil(v)+' K'},()=>{ releves(); });
  function releves(){ const lm=lmax(st.T); const dm=domaine(lm); const theta=st.T-273;
    q('.releves').innerHTML='<span>En degrés Celsius</span><b>'+mil(theta)+' °C</b><span>λ<sub>max</sub> = 2,90 × 10<sup>−3</sup> ÷ T</span><b>'+nb(lm*1e6,2)+' µm</b><span>Domaine du maximum</span><b>'+dm[0]+'</b>'; T.redessiner(); }
  puces(q('.corps'),CORPS.map(c=>c[0]),1,i=>{ L.regler('T',CORPS[i][1]); releves(); const v=q('.verdict'); v.className='verdict info'; const Tc=CORPS[i][1]; const lm=lmax(Tc);
    v.innerHTML='<span><strong>'+CORPS[i][0]+'</strong>, '+mil(Tc)+' K ('+mil(Tc-273)+' °C) : $\\lambda_{max}=\\dfrac{2{,}90\\times10^{-3}}{'+mil(Tc)+'}\\approx'+nb(lm*1e6,2).replace(',','{,}')+'$ µm, '+domaine(lm)[0]+'. '+(Tc<800?'Aucune lumière visible : invisible dans le noir, mais net à la caméra thermique.':Tc<2000?'Une partie du rayonnement déborde dans le rouge : le corps rougeoie.':Tc<4000?'Le maximum est encore dans l\'infrarouge, mais une bonne part est visible : lumière jaune-blanche.':'Le maximum est dans le visible : c\'est la lumière du jour.')+'</span>'; maths(v); });
  function defi(){ const choix=[[9.35,'le corps humain (λmax = 9,35 µm)'],[6.1,'une plaque à 200 °C (λmax = 6,1 µm)'],[2.9,'une braise à 1 000 K (λmax = 2,9 µm)'],[1.07,'un filament à 2 700 K (λmax = 1,07 µm)'],[7.8,'un radiateur à 100 °C (λmax = 7,8 µm)'],[0.5,'le Soleil (λmax = 0,50 µm)'],[10.6,'un glaçon à 0 °C (λmax = 10,6 µm)'],[4.0,'un four à 450 °C (λmax = 4,0 µm)']];
    let c; do{ c=choix[hasard(0,choix.length-1)]; }while(st.defi&&c[0]===st.defi[0]); st.defi=c; q('.enonce-defi').innerHTML='Règle la température pour retrouver <strong>'+c[1]+'</strong>.'; }
  q('.valider').addEventListener('click',()=>{ const v=q('.verdict'); const Tc=WIEN/(st.defi[0]*1e-6); const r=st.T/Tc;
    if(Math.abs(r-1)<=0.04){ reussi(v); v.className='verdict ok'; v.innerHTML='<strong>Juste : '+mil(st.T)+' K, soit '+mil(st.T-273)+' °C.</strong><span>Par le calcul : $T=\\dfrac{2{,}90\\times10^{-3}}{'+nb(st.defi[0],2).replace(',','{,}')+'\\times10^{-6}}\\approx'+mil(Tc)+'$ K.</span>'; maths(v); }
    else if(Math.abs(st.T-(Tc-273))<=0.04*Tc){ v.className='verdict ko'; v.innerHTML='<span>Tu as réglé '+mil(st.T)+' K : c\'est la valeur en °C, pas en kelvins. Ajoute 273.</span>'; }
    else { v.className='verdict ko'; v.innerHTML='<span>À '+mil(st.T)+' K, le maximum est à '+nb(lmax(st.T)*1e6,2)+' µm. Il faut '+(r<1?'chauffer : λmax diminue quand T augmente.':'refroidir : λmax augmente quand T baisse.')+'</span>'; } });
  q('.autre').addEventListener('click',defi);
  defi(); releves(); q('.verdict').innerHTML='<span>Choisis un corps connu, ou fais glisser la température : la courbe se déplace, le point suit la loi de Wien.</span>';
}

/* =================================================================
   3. LA CAMÉRA THERMIQUE ET LE DÉTECTEUR DE PRÉSENCE
   ================================================================= */
const STOPS_FER=[[0,[0,0,8]],[.22,[40,8,80]],[.42,[125,20,110]],[.62,[205,55,30]],[.82,[245,165,0]],[1,[255,255,200]]];
const PALETTES={
  fer:t=>{ const s=Math.max(0,Math.min(1,t)); let i=1; while(i<STOPS_FER.length-1&&STOPS_FER[i][0]<s) i++; const [a,ca]=STOPS_FER[i-1],[b,cb]=STOPS_FER[i]; const k=(s-a)/(b-a); return 'rgb('+ca.map((v,j)=>Math.round(v+(cb[j]-v)*k)).join(',')+')'; },
  gris:t=>{ const v=Math.round(Math.max(0,Math.min(1,t))*255); return 'rgb('+v+','+v+','+v+')'; },
  arc:t=>{ const s=Math.max(0,Math.min(1,t)); return 'hsl('+Math.round(260-s*260)+',85%,'+Math.round(35+s*20)+'%)'; },
};
function camera(el){
  const u=id();
  const {g,d}=carcasse(el,{titre:'La caméra thermique',
    intro:'Une pièce vue par une caméra thermique : chaque pixel est une température, affichée en fausses couleurs. Survole ou touche la scène pour lire la température et $\\lambda_{max}$ en ce point. En bas, le détecteur de présence du couloir, qui ne réagit qu\'aux <strong>variations</strong>.',
    gauche:'<canvas class="large" role="img" aria-label="Une pièce vue en caméra thermique : une personne, un radiateur, une fenêtre, une tasse, un chien. Un détecteur de présence en bas."></canvas><div class="lecture discret"></div>'});
  d.innerHTML='<div class="champ"><span class="etiq">Palette</span><div class="puces palettes"></div></div>'+
    '<div class="champ"><span class="etiq">La scène</span><div class="pile">'+
      '<label class="case"><input type="checkbox" data-k="fievre"><span>La personne a de la fièvre (39,5 °C)</span></label>'+
      '<label class="case"><input type="checkbox" data-k="vitre"><span>Une vitre devant la personne</span></label>'+
      '<label class="case"><input type="checkbox" data-k="noir" checked><span>Lumière éteinte</span></label>'+
      '<label class="case"><input type="checkbox" data-k="radiateur" checked><span>Radiateur allumé (60 °C)</span></label></div></div>'+
    '<div class="releves"></div>'+
    '<div class="champ"><span class="etiq">Détecteur de présence</span><div class="ligne"><button type="button" class="btn marcher">La personne traverse</button><button type="button" class="btn fantome bouger">Elle bouge un bras</button></div></div>'+
    '<div class="verdict info" aria-live="polite"></div>';
  const q=s=>d.querySelector(s);
  const st={pal:'fer',fievre:false,vitre:false,noir:true,radiateur:true,px:0.62,anim:null,signal:[],lampe:false,tempo:0,souris:null};
  const cv=g.querySelector('canvas');
  const AMB=20, TMIN=5, TMAX=45;
  /* la température au point (x,y) en fraction de la scène (0–1), pour le dessin et la lecture */
  function temperature(x,y){
    let t=AMB+Math.sin(y*6)*0.4;
    // fenêtre en haut à gauche, froide
    if(x>0.06&&x<0.30&&y>0.10&&y<0.52) t=8+ (y-0.1)*4;
    // radiateur sous la fenêtre
    if(x>0.07&&x<0.29&&y>0.60&&y<0.78) t= st.radiateur? 60-(y-0.6)*30 : AMB-1;
    // la tasse de café sur la table
    if(Math.hypot((x-0.42)*2.2,(y-0.70))<0.05) t=65; if(x>0.34&&x<0.52&&y>0.74&&y<0.80) t=AMB+3;
    // le chien couché
    if(Math.hypot((x-0.88)*1.4,(y-0.80)*1.1)<0.08) t=36;
    // la personne : corps, tête, mains ; vêtements plus froids que la peau
    const px=st.px; const peau= st.fievre?39.5:34, vet=AMB+6;
    if(Math.hypot((x-px)*1.6,(y-0.22)*1.0)<0.08) t=peau-(Math.hypot((x-px)*1.6,(y-0.22))>0.06?3:0);   // tête
    if(Math.abs(x-px)<0.075&&y>0.30&&y<0.62) t=vet;   // buste habillé
    if(Math.hypot((x-px-0.095)*1.6,(y-0.50))<0.035||Math.hypot((x-px+0.095)*1.6,(y-0.50))<0.035) t=peau-2;   // mains
    if(Math.abs(x-px)<0.07&&y>=0.62&&y<0.92) t=vet-2;   // jambes
    if(st.vitre&&Math.abs(x-px)<0.16&&y>0.08&&y<0.95) t=AMB-1;   // la vitre cache tout
    return t;
  }
  const T=Toile(cv,T=>{
    const c=T.ctx,W=T.W,H=T.H; c.clearRect(0,0,W,H); const ink=css('--ink'),muted=css('--muted');
    const sh=H*.72; const pal=PALETTES[st.pal];
    const cols=96, rows=Math.round(cols*sh/W); const cw=W/cols, ch=sh/rows;
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ const t=temperature((i+.5)/cols,(j+.5)/rows); c.fillStyle=pal((t-TMIN)/(TMAX-TMIN)); c.fillRect(Math.floor(i*cw),Math.floor(j*ch),Math.ceil(cw)+1,Math.ceil(ch)+1); }
    // échelle de couleur
    for(let k=0;k<40;k++){ c.fillStyle=pal(k/39); c.fillRect(W-22,sh-14-k*(sh-30)/40,12,(sh-30)/40+.5); }
    etiquette(c,TMAX+' °C',W-26,20,css('--sur-image'),{align:'right',taille:11,halo:css('--halo-sur-image')}); etiquette(c,TMIN+' °C',W-26,sh-10,css('--sur-image'),{align:'right',taille:11,halo:css('--halo-sur-image')});
    if(st.vitre) etiquette(c,'vitre',W*st.px,sh*.5,css('--sur-image'),{align:'center',taille:13,halo:css('--halo-sur-image')});
    if(st.souris){ const [x,y]=st.souris; c.save(); c.strokeStyle=css('--sur-image'); c.lineWidth=2; c.beginPath(); c.arc(x*W,y*sh,9,0,7); c.stroke(); c.restore(); }
    // --- le détecteur de présence
    const dy=sh+8, dh=H-dy; c.save(); c.fillStyle=css('--card'); c.fillRect(0,dy,W,dh); c.restore();
    // deux zones
    const zx=W*.5, zy=dy+8; c.save(); c.globalAlpha=.35; c.fillStyle=css('--d-ir'); c.beginPath(); c.moveTo(zx,zy); c.lineTo(W*.12,H-6); c.lineTo(zx-6,H-6); c.closePath(); c.fill(); c.globalAlpha=.2; c.beginPath(); c.moveTo(zx,zy); c.lineTo(zx+6,H-6); c.lineTo(W*.88,H-6); c.closePath(); c.fill(); c.restore();
    c.save(); c.fillStyle=ink; c.beginPath(); c.arc(zx,zy,6,0,7); c.fill(); c.restore();
    etiquette(c,'A',W*.3,H-10,muted,{align:'center',taille:11}); etiquette(c,'B',W*.7,H-10,muted,{align:'center',taille:11});
    // la personne vue du détecteur
    const ppx=W*st.px; c.save(); c.fillStyle=css('--chaud'); c.beginPath(); c.arc(ppx,dy+dh*.55,7,0,7); c.fill(); c.restore();
    // le signal
    const sx0=W*.02, sw=W*.2; c.save(); c.strokeStyle=css('--chaud'); c.lineWidth=2; c.beginPath(); st.signal.forEach((s,i)=>{ const x=sx0+i/60*sw, y=dy+dh*.5-s*dh*.3; if(i) c.lineTo(x,y); else c.moveTo(x,y); }); c.stroke(); c.restore();
    etiquette(c,'signal',sx0,dy+12,muted,{taille:10,gras:false});
    // la lampe
    c.save(); c.fillStyle= st.lampe?css('--jaune'):css('--grid'); c.beginPath(); c.arc(W-30,dy+dh*.5,12,0,7); c.fill(); c.restore();
    etiquette(c,st.lampe?'allumée':'éteinte',W-30,dy+dh*.5+26,st.lampe?ink:muted,{align:'center',taille:11});
  });
  function lecture(x,y){ const t=temperature(x,y); const K=t+273; const lm=WIEN/K;
    g.querySelector('.lecture').innerHTML='En ce point : <b>'+nb(t,1)+' °C</b> = '+nb(K,0)+' K → λ<sub>max</sub> = 2,90 × 10<sup>−3</sup> ÷ '+nb(K,0)+' ≈ <b>'+nb(lm*1e6,1)+' µm</b> (infrarouge thermique)'; }
  const pos=e=>{ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/(r.height*.72)]; };
  cv.addEventListener('pointermove',e=>{ const [x,y]=pos(e); if(y<0||y>1) return; st.souris=[x,y]; lecture(x,y); T.redessiner(); });
  cv.addEventListener('pointerdown',e=>{ const [x,y]=pos(e); if(y<0||y>1) return; st.souris=[x,y]; lecture(x,y); T.redessiner(); });
  cv.addEventListener('pointerleave',()=>{ st.souris=null; T.redessiner(); });
  function releves(){ const peau=st.fievre?39.5:34; q('.releves').innerHTML='<span>Peau de la personne</span><b>'+nb(peau,1)+' °C = '+nb(peau+273,0)+' K</b><span>Son λ<sub>max</sub></span><b>'+nb(WIEN/(peau+273)*1e6,2)+' µm</b><span>Ce que voit la caméra</span><b>'+(st.vitre?'la vitre, '+nb(AMB-1,0)+' °C':nb(peau,1)+' °C')+'</b>'; }
  puces(q('.palettes'),['Fer','Gris','Arc-en-ciel'],0,i=>{ st.pal=['fer','gris','arc'][i]; T.redessiner(); });
  d.addEventListener('change',e=>{ const c=e.target.closest('[data-k]'); if(!c) return; st[c.dataset.k]=c.checked; releves(); const v=q('.verdict'); v.className='verdict info';
    if(c.dataset.k==='noir') v.innerHTML='<span>'+(c.checked?'Lumière éteinte : l\'image thermique ne change pas. La caméra ne regarde pas la lumière visible, elle capte ce que les objets émettent eux-mêmes.':'Lumière allumée : rien ne change non plus. Une lampe LED chauffe à peine ; une ampoule à filament, elle, apparaîtrait brûlante.')+'</span>';
    if(c.dataset.k==='vitre') v.innerHTML='<span>'+(c.checked?'Derrière une vitre, la personne disparaît : le verre est opaque à l\'infrarouge thermique. La caméra affiche la température de la vitre. Le détecteur de présence, lui non plus, ne verra personne.':'Sans la vitre, la personne réapparaît.')+'</span>';
    if(c.dataset.k==='fievre') v.innerHTML='<span>'+(c.checked?'Avec 39,5 °C, le visage ressort plus clair : il émet davantage. λmax passe de 9,45 à 9,28 µm, une différence invisible ; c\'est l\'intensité qui trahit la fièvre, pas la longueur d\'onde.':'Retour à 34 °C en surface.')+'</span>';
    if(c.dataset.k==='radiateur') v.innerHTML='<span>'+(c.checked?'Le radiateur à 60 °C est l\'objet le plus chaud de la pièce : il sature l\'échelle.':'Radiateur éteint : il prend la température de la pièce, et ne se distingue plus du mur.')+'</span>';
    T.redessiner(); });
  function detecteur(pxAvant,pxApres){ // signal ∝ différence de rayonnement entre zone A et zone B
    const zone=px=>px<0.5?-1:1; const chaud=st.vitre?0:1; return (zone(pxApres)-zone(pxAvant))*chaud*0.5; }
  function marcher(){ if(st.anim) return; const v=q('.verdict'); const depart= st.px>0.5?0.9:0.1, arrivee= st.px>0.5?0.15:0.85; st.px=depart; let k=0; st.signal=[]; st.lampe=false;
    v.className='verdict info'; v.innerHTML='<span>La personne traverse le champ du détecteur…</span>';
    const pas=()=>{ k++; const avant=st.px; st.px=depart+(arrivee-depart)*k/60; const s=detecteur(avant,st.px); st.signal.push(s); if(st.signal.length>60) st.signal.shift();
      if(Math.abs(s)>0.3&&!st.vitre){ st.lampe=true; st.tempo=90; }
      T.redessiner(); if(k<60) st.anim=requestAnimationFrame(pas); else { st.anim=null; fin(); } };
    const fin=()=>{ if(st.vitre){ v.className='verdict ko'; v.innerHTML='<strong>Rien ne s\'allume.</strong><span>La vitre bloque l\'infrarouge thermique : pour le détecteur, personne n\'est passé. C\'est pour cela qu\'un détecteur placé derrière une porte vitrée ne sert à rien.</span>'; }
      else { v.className='verdict ok'; v.innerHTML='<strong>Détection : la lampe s\'allume.</strong><span>Quand la personne est passée de la zone A à la zone B, le rayonnement reçu par chaque zone a changé d\'un coup : le signal a fait un pic, et c\'est ce pic qui déclenche. Maintenant qu\'elle est immobile, le signal est plat… la lampe va s\'éteindre.</span>'; tempo(); } };
    st.anim=requestAnimationFrame(pas); }
  function tempo(){ clearInterval(st.timer); st.timer=setInterval(()=>{ st.signal.push(0); if(st.signal.length>60) st.signal.shift(); st.tempo--; if(st.tempo<=0){ st.lampe=false; clearInterval(st.timer); st.timer=null; const v=q('.verdict'); v.className='verdict info'; v.innerHTML='<span>Lampe éteinte : la personne n\'a pas bougé. Elle émet toujours autant d\'infrarouge, mais le signal ne varie plus, et le détecteur ne réagit qu\'aux variations. Clique sur « Elle bouge un bras ».</span>'; } T.redessiner(); },50); }
  q('.marcher').addEventListener('click',marcher);
  q('.bouger').addEventListener('click',()=>{ if(st.anim) return; const v=q('.verdict'); if(st.vitre){ v.className='verdict ko'; v.innerHTML='<span>Derrière la vitre, bouger ne change rien : le détecteur ne reçoit pas son rayonnement.</span>'; return; }
    for(let i=0;i<8;i++) st.signal.push(i<4?0.35:-0.35); while(st.signal.length>60) st.signal.shift(); st.lampe=true; st.tempo=90; T.redessiner(); v.className='verdict ok'; v.innerHTML='<strong>Petit pic, lampe rallumée.</strong><span>Un bras qui passe d\'une zone à l\'autre suffit : c\'est le geste qu\'on fait dans un couloir quand la lumière s\'éteint.</span>'; tempo(); });
  releves(); lecture(st.px,0.22); q('.verdict').innerHTML='<span>Survole la scène : la personne, le radiateur, la fenêtre, la tasse, le chien. Puis fais traverser la personne devant le détecteur.</span>';
}

window.LABOS=window.LABOS||{};
window.LABOS.infrarouges={spectre,wien,camera};
})();
