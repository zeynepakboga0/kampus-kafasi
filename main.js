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

let sett = { wa: '', email: '' };
let events = [], board = [], admins = [];

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
    // Loader biter bitmez sayaçları başlat
    setTimeout(startCounters, 100);
  }

  window.addEventListener('load', () => setTimeout(hideLoader, 2000));
})();

// ── SAYAÇLAR: loader bittikten 5sn sonra 0'dan başlayarak artar ──
let _countersStarted = false;
function startCounters() {
  if (_countersStarted) return;
  _countersStarted = true;
  const m = parseInt(document.getElementById('sc-members')?.getAttribute('data-target')) || 17000;
  const e = parseInt(document.getElementById('sc-events')?.getAttribute('data-target')) || 50;
  const y = parseInt(document.getElementById('sc-year')?.getAttribute('data-target')) || 4;
  animCountEl(document.getElementById('sc-members'), m, '+', true);
  animCountEl(document.getElementById('sc-events'),  e, '+', false);
  animCountEl(document.getElementById('sc-year'),    y, '+', false);
}

function animCountEl(el, target, suffix, fmt) {
  if (!el) return;
  el.textContent = fmt ? '0+' : '0+';
  const dur = 1800, start = performance.now();
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

// ── ETKİNLİKLER (Preview — admin seçimleri veya en son 3) ──
const EMOJI = {Konferans:'🎤',Gezi:'🗺️',Spor:'⚽',Sosyal:'🎉',Kültür:'🎭',Eğitim:'📚',Diğer:'📌'};

function buildEventCard(ev, isPast, delay) {
  const card = document.createElement('div');
  card.className = 'event-card reveal' + (isPast ? ' ev-past' : '');
  card.style.transitionDelay = delay + 's';
  card.addEventListener('click', () => openModal(ev.id));

  if (!isPast) {
    const badge = document.createElement('div');
    badge.className = 'ev-upcoming-bar';
    badge.textContent = 'Yaklaşan';
    card.appendChild(badge);
  }

  // Thumbnail
  const thumb = document.createElement('div');
  thumb.className = 'ev-thumb';
  if (ev.img && /^(data:image\/|https?:\/\/)/.test(ev.img)) {
    const img = document.createElement('img');
    img.src = ev.img; img.alt = ev.title;
    thumb.appendChild(img);
  } else {
    const emoji = document.createElement('div');
    emoji.className = 'ev-thumb-emoji';
    emoji.textContent = EMOJI[ev.cat] || '📌';
    thumb.appendChild(emoji);
  }
  card.appendChild(thumb);

  // Body
  const body = document.createElement('div');
  body.className = 'ev-body';

  const catRow = document.createElement('div'); catRow.className = 'ev-cat-row';
  const badge = document.createElement('span'); badge.className = 'ev-badge';
  badge.textContent = (EMOJI[ev.cat]||'') + ' ' + ev.cat;
  catRow.appendChild(badge);
  body.appendChild(catRow);

  const title = document.createElement('div'); title.className = 'ev-title'; title.textContent = ev.title;
  body.appendChild(title);

  const meta = document.createElement('div'); meta.className = 'ev-meta';
  const ds = new Date(ev.date).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
  meta.innerHTML = `<div class="ev-meta-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${ds}</div>`
    + (ev.loc ? `<div class="ev-meta-row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>${ev.loc}</div>` : '');
  body.appendChild(meta);

  if (ev.desc) {
    const desc = document.createElement('div'); desc.className = 'ev-desc'; desc.textContent = ev.desc;
    body.appendChild(desc);
  }

  const more = document.createElement('div'); more.className = 'ev-read-more';
  more.innerHTML = 'Detayları Gör <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  body.appendChild(more);

  card.appendChild(body);

  // 3D Tilt
  card.addEventListener('mousemove', e => {
    card.style.transition = '';
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `translateY(-6px) perspective(600px) rotateY(${x*8}deg) rotateX(${-y*8}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .35s cubic-bezier(.34,1.2,.64,1)';
    card.style.transform = '';
    card.addEventListener('transitionend', () => { card.style.transition = ''; }, { once: true });
  });

  return card;
}

function renderEvents() {
  const g = document.getElementById('events-grid');
  g.textContent = '';
  if (!events.length) {
    const msg = document.createElement('div');
    msg.className = 'no-events-msg';
    msg.textContent = 'Henüz etkinlik eklenmedi.';
    g.appendChild(msg);
    return;
  }
  const now = new Date();
  const featured = events.filter(e => e.featured);
  let preview;
  if (featured.length) {
    preview = featured.slice(0, 6);
  } else {
    const upcoming = events.filter(e => new Date(e.date) >= now)
                           .sort((a,b) => new Date(a.date)-new Date(b.date))
                           .slice(0, 3);
    const past = events.filter(e => new Date(e.date) < now)
                       .sort((a,b) => new Date(b.date)-new Date(a.date))
                       .slice(0, 3);
    preview = [...upcoming, ...past].slice(0, 6);
  }
  preview.forEach((ev, i) => {
    const isPast = new Date(ev.date) < now;
    const card = buildEventCard(ev, isPast, i*0.07);
    g.appendChild(card);
    revealObs.observe(card);
  });
}

function openModal(id) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  const now = new Date();
  const isPast = new Date(ev.date) < now;
  const ds = new Date(ev.date).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});

  // Hero image or emoji
  const imgEl = document.getElementById('m-img');
  const emojiEl = document.getElementById('m-emoji');
  if (ev.img && /^(data:image\/|https?:\/\/)/.test(ev.img)) {
    imgEl.src = ev.img; imgEl.style.display = 'block';
    emojiEl.style.display = 'none';
  } else {
    imgEl.style.display = 'none';
    emojiEl.style.display = 'flex';
    emojiEl.textContent = EMOJI[ev.cat]||'📌';
  }

  document.getElementById('m-cat').textContent   = (EMOJI[ev.cat]||'') + ' ' + ev.cat;
  document.getElementById('m-title').textContent = ev.title;
  document.getElementById('m-date').textContent  = ds;

  const locWrap = document.getElementById('m-loc-wrap');
  if (ev.loc) { document.getElementById('m-loc').textContent = ev.loc; locWrap.style.display='flex'; }
  else { locWrap.style.display = 'none'; }

  const statusEl = document.getElementById('m-status');
  if (isPast) { statusEl.textContent = '✓ Tamamlandı'; statusEl.className = 'modal-status-badge past'; }
  else { statusEl.textContent = '🟢 Yaklaşan'; statusEl.className = 'modal-status-badge upcoming'; }

  document.getElementById('m-desc').textContent = ev.desc || '';

  document.getElementById('event-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() { document.getElementById('event-modal').classList.remove('open'); document.body.style.overflow=''; }
function closeModalOutside(e) { if(e.target===document.getElementById('event-modal')) closeModal(); }

function applySettings() {
  if (sett.wa) { ['wa-btn-hero','wa-link','footer-wa','drawer-wa'].forEach(id=>{const el=document.getElementById(id);if(el)el.href=sett.wa;}); }
  if (sett.email) {
    const el=document.getElementById('email-link'),es=document.getElementById('email-sub-text'),sp=document.getElementById('sponsor-email');
    if(el)el.href='mailto:'+sett.email; if(es)es.textContent=sett.email; if(sp)sp.href='mailto:'+sett.email;
  }
}

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