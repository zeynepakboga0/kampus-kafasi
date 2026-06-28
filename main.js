// ── GLOBAL RESET: her yükleme/back-forward'da scroll sıfırla ──
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('pageshow', () => window.scrollTo(0, 0));

// ── LOGO → TAM SAYFA SIFIRLA (F5 etkisi) ──
const navLogoLink = document.getElementById('nav-logo-link');
if (navLogoLink) {
  navLogoLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = window.location.href.split('?')[0].split('#')[0];
  });
}

window.sett = { wa: '', email: '' };
window.events = [];
window.board = [];
window.admins = [];

// Firebase verileri kk-data.js tarafından yüklenir.
// Bu fonksiyon kk-data.js yüklemesi tamamlandıktan sonra çağrılır.
function veriBaslat() {
  renderEvents();
  applySettings();
}

// ── LOADER: her yükleme/yenileme/back-forward'da tekrar çalışır ──
(function() {
  const loader = document.getElementById('loader');
  // Loader görünür başlar (CSS'de display:flex), her seferinde çalışır
  loader.classList.remove('hidden');
  window.scrollTo(0, 0);

  function hideLoader() {
    loader.classList.add('hidden');
  }

window.addEventListener('load', () => {
  setTimeout(hideLoader, 1300);
});
})();

// ── SAYAÇLAR: loader bittikten 5sn sonra 0'dan başlayarak artar ──
let _countersStarted = false;
function startCounters(m, e, y) {
  if (_countersStarted) return;
  _countersStarted = true;
  animCountEl(document.getElementById('sc-members'), m, '+', true);
  animCountEl(document.getElementById('sc-events'),  e, '+', false);
  animCountEl(document.getElementById('sc-year'),    y, '+', false);
}

function animCountEl(el, target, suffix, fmt) {
  if (!el) return;
  el.textContent = '0+';
  const dur = 3500, start = performance.now();
  const run = now => {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const val = Math.round(ease * target);
    el.textContent = fmt ? val.toLocaleString('tr-TR') + suffix : val + suffix;
    if (p < 1) requestAnimationFrame(run);
    else el.textContent = fmt ? target.toLocaleString('tr-TR') + suffix : target + suffix;
  };
  requestAnimationFrame(run);
}

// ── DRAWER ──
function toggleDrawer() {
  const d=document.getElementById('drawer'),o=document.getElementById('drawer-overlay'),h=document.getElementById('hamburger');
  const open=d.classList.toggle('open');
  o.classList.toggle('open',open);h.classList.toggle('open',open);
  document.body.style.overflow=open?'hidden':'';
}
function closeDrawer() {
  ['drawer','drawer-overlay'].forEach(id=>document.getElementById(id).classList.remove('open'));
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow='';
}

// ── SCROLL REVEAL ──
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, {threshold:0.1});
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));


// ── SPONSOR ──
function openSponsor()  { document.getElementById('sponsor-modal').classList.add('open'); document.body.style.overflow='hidden'; }
function closeSponsor() { document.getElementById('sponsor-modal').classList.remove('open'); document.body.style.overflow=''; }
function closeSponsorOutside(e) { if(e.target===document.getElementById('sponsor-modal')) closeSponsor(); }

// ── NAV SCROLL ──
window.addEventListener('scroll',()=>{document.getElementById('nav').classList.toggle('scrolled',window.scrollY>40);},{passive:true});

// ── LOADER CANVAS ──
(function(){
  const c=document.getElementById('ld-canvas');if(!c)return;
  const ctx=c.getContext('2d');
  c.width=window.innerWidth;c.height=window.innerHeight;
  const pts=Array.from({length:60},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4}));
  function draw(){ctx.clearRect(0,0,c.width,c.height);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>c.width)p.vx*=-1;if(p.y<0||p.y>c.height)p.vy*=-1;});pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<120){ctx.strokeStyle=`rgba(45,221,212,${.15*(1-d/120)})`;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}));pts.forEach(p=>{ctx.fillStyle='rgba(45,221,212,.45)';ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fill();});requestAnimationFrame(draw);}
  draw();
})();

// ── HERO PARTICLE CANVAS ──
(function(){
  const c=document.getElementById('particle-canvas');if(!c)return;
  const ctx=c.getContext('2d');let W,H,pts,id;
  function resize(){W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;}
  function init(){resize();pts=Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.5+.5}));}
  function draw(){ctx.clearRect(0,0,W,H);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;});pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<130){const ef=Math.min(a.x/70,1)*Math.min((W-a.x)/70,1)*Math.min(a.y/70,1)*Math.min((H-a.y)/70,1);ctx.strokeStyle=`rgba(45,221,212,${.1*(1-d/130)*ef})`;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}));pts.forEach(p=>{const ef=Math.min(p.x/60,1)*Math.min((W-p.x)/60,1)*Math.min(p.y/60,1)*Math.min((H-p.y)/60,1);ctx.fillStyle=`rgba(45,221,212,${.55*ef})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});id=requestAnimationFrame(draw);}
  init();draw();window.addEventListener('resize',()=>{cancelAnimationFrame(id);init();draw();});
})();

// ── BLOB PARALLAX ──
window.addEventListener('scroll',()=>{const sy=window.scrollY;document.querySelectorAll('.blob').forEach((b,i)=>{b.style.transform=`translateY(${sy*([.08,.05,.12][i]||.06)}px)`;});},{passive:true});

// ── KART 3D TİLT ──
document.querySelectorAll('.who-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    card.style.transition='';
    const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    card.style.transform=`translateY(-6px) perspective(600px) rotateY(${x*8}deg) rotateX(${-y*8}deg)`;
  });
  card.addEventListener('mouseleave',()=>{
    card.style.transition='transform .35s cubic-bezier(.34,1.2,.64,1)';
    card.style.transform='';
    card.addEventListener('transitionend',()=>{card.style.transition='';},{once:true});
  });
});

// ── GLOW TRAIL ──
document.querySelectorAll('.who-card,.contact-card,.sponsor-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();card.style.background=`radial-gradient(300px circle at ${e.clientX-r.left}px ${e.clientY-r.top}px,rgba(45,221,212,.07),transparent 60%),var(--card)`;});
  card.addEventListener('mouseleave',()=>{card.style.background='';});
});

// ── HERO BAŞLIK FLASH ──
window.addEventListener('load',()=>{
  setTimeout(()=>{const t=document.getElementById('hero-title-el');if(!t)return;t.style.transition='filter .3s';t.style.filter='brightness(1.5) drop-shadow(0 0 28px rgba(45,221,212,.7))';setTimeout(()=>{t.style.filter='';},500);},2600);
});