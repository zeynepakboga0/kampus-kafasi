/* ════════════════════════════════════════════════════════════
   event-card.js — Kampüs Kafası ORTAK ETKİNLİK KARTI
   index.html, hakkimizda.html ve etkinlikler.html hepsi bu
   dosyadaki kkBuildEventCard() fonksiyonunu kullanır.
   Kartın GÖRÜNÜMÜNÜ değiştirmek istersen style.css içindeki
   "ETKİNLİK KARTI — TEK ORTAK TASARIM" bloğunu düzenle.
   Kartın YAPISINI (hangi bilgi nerede) değiştirmek istersen
   bu dosyadaki kkBuildEventCardBody() fonksiyonunu düzenle.
   ════════════════════════════════════════════════════════════ */

// Üç sayfada da geçen tüm kategoriler burada toplandı.
window.KK_CAT_EMOJI = {
  Sosyal: '🎉', Gezi: '🗺️', Spor: '⚽', Panel: '🎤', Bilgilendirme: '📋',
  Konferans: '🎤', Kültür: '🎭', Eğitim: '📚', Diğer: '📌'
};

function kkEscHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
window.kkEscHtml = kkEscHtml;

function kkFormatDate(d, opts) {
  return new Date(d).toLocaleDateString('tr-TR', opts || { day: 'numeric', month: 'long', year: 'numeric' });
}
window.kkFormatDate = kkFormatDate;

const KK_ICON_CALENDAR = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
const KK_ICON_PIN = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const KK_ICON_ARROW = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

// Kart üzerinde galeri mozaiği için gereken CSS'i bir kere enjekte eder.
// style.css'e dokunmadan, event-card.js'in kullanıldığı her sayfada
// (index.html, hakkimizda.html, etkinlikler.html) otomatik çalışır.
// (Not: "bilet deliği" çentikleri artık kaldırıldı — bkz. style.css,
// .ev-body::before/::after kuralı silindi.)
(function kkInjectMosaicStyles() {
  if (document.getElementById('kk-ev-mosaic-style')) return;
  const style = document.createElement('style');
  style.id = 'kk-ev-mosaic-style';
  style.textContent = `
    .ev-thumb-mosaic{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:3px;width:100%;height:100%}
    .ev-thumb-mosaic.two{grid-template-columns:1fr 1fr;grid-template-rows:1fr}
    .ev-mosaic-tile{position:relative;overflow:hidden;background:#0c1b24}
    .ev-mosaic-tile.main{grid-row:1/3}
    .ev-thumb-mosaic.two .ev-mosaic-tile{grid-row:auto}
    .ev-mosaic-tile img{width:100%;height:100%;object-fit:cover;display:block}
  `;
  document.head.appendChild(style);
})();

// Bir etkinliğin kapak fotoğrafı + galeri fotoğraflarını tek listede toplar.
function kkGetEventImages(ev) {
  const imgs = [];
  if (ev.img && /^(data:image\/|https?:\/\/)/.test(ev.img)) {
    imgs.push({ url: ev.img, pos: ev.imgPos || '50% 50%' });
  }
  if (Array.isArray(ev.gallery)) {
    ev.gallery.forEach(g => {
      const url = typeof g === 'string' ? g : (g && g.url);
      if (url) imgs.push({ url, pos: (g && g.pos) || '50% 50%' });
    });
  }
  return imgs;
}
window.kkGetEventImages = kkGetEventImages;


function kkBuildEventCardBody(ev, dateOpts) {
  const emoji = ev.emoji || window.KK_CAT_EMOJI[ev.cat] || '📌';
  const ds = kkFormatDate(ev.date, dateOpts);
  const body = document.createElement('div');
  body.className = 'ev-body';
  body.innerHTML = `
    <div class="ev-cat-row">
      <span class="ev-cat-badge">${emoji} ${kkEscHtml(ev.cat)}</span>
    </div>
    <div class="ev-title">${kkEscHtml(ev.title)}</div>
    <div class="ev-meta">
      <div class="ev-date">${KK_ICON_CALENDAR}${ds}</div>
      ${ev.loc ? `<div class="ev-loc">${KK_ICON_PIN}${kkEscHtml(ev.loc)}</div>` : ''}
    </div>
    ${ev.desc ? `<div class="ev-desc">${kkEscHtml(ev.desc)}</div>` : ''}
    <div class="ev-read-more">Detayları Gör ${KK_ICON_ARROW}</div>
  `;
  return body;
}
window.kkBuildEventCardBody = kkBuildEventCardBody;

// Tam kartı üretir: görsel/emoji thumb + gövde. Tıklanınca onClick(ev) çalışır.
function kkBuildEventCard(ev, { isPast = false, onClick = null, dateOpts = null } = {}) {
  const card = document.createElement('div');
  card.className = 'event-card' + (isPast ? ' ev-past' : '');
  if (onClick) card.addEventListener('click', () => onClick(ev));

  const thumb = document.createElement('div');
  thumb.className = 'ev-thumb';

  // Kart küçükken (grid içindeyken) fotoğrafa tıklamak da dahil her tıklama
  // kartın kendi onClick'ine (aşağıda) düşer ve detay penceresi (modal)
  // büyüyerek açılır. Fotoğraflar arasında gezinme (lightbox) sadece modal
  // açıldıktan SONRA, modal içindeki galeri mozaiğinden yapılır.
  const imgs = kkGetEventImages(ev);

  if (imgs.length === 0) {
    const em = document.createElement('div');
    em.className = 'ev-thumb-emoji';
    em.textContent = ev.emoji || window.KK_CAT_EMOJI[ev.cat] || '📌';
    thumb.appendChild(em);
  } else if (imgs.length === 1) {
    const img = document.createElement('img');
    img.src = imgs[0].url; img.alt = ev.title;
    img.style.objectPosition = imgs[0].pos;
    thumb.appendChild(img);
  } else {
    // Birden fazla foto varsa: 1 büyük + en fazla 2 küçük kutudan oluşan
    // mozaik gösterilir (modal içindeki galeri mozaiğiyle aynı mantık) —
    // sadece önizleme amaçlı, tıklanınca yine kart büyüyüp modal açılır.
    const grid = document.createElement('div');
    grid.className = 'ev-thumb-mosaic' + (imgs.length === 2 ? ' two' : '');
    const maxTiles = imgs.length === 2 ? 2 : 3;
    imgs.slice(0, maxTiles).forEach((item, i) => {
      const tile = document.createElement('div');
      tile.className = 'ev-mosaic-tile' + (i === 0 && maxTiles === 3 ? ' main' : '');
      const img = document.createElement('img');
      img.src = item.url; img.alt = ev.title;
      img.style.objectPosition = item.pos;
      tile.appendChild(img);
      grid.appendChild(tile);
    });
    thumb.appendChild(grid);
  }

  if (!isPast) {
    const badge = document.createElement('div');
    badge.className = 'ev-upcoming-badge';
    badge.textContent = 'Yaklaşan';
    thumb.appendChild(badge);
  }
  const extraCount = Array.isArray(ev.images) ? ev.images.filter(p => p && p.url).length : 0;
  if (extraCount > 0) {
    const pc = document.createElement('div');
    pc.className = 'ev-photo-count';
    pc.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="15" height="15" rx="2"/><path d="M21 8v11a2 2 0 01-2 2H8"/></svg>+' + extraCount;
    thumb.appendChild(pc);
  }
  card.appendChild(thumb);
  card.appendChild(kkBuildEventCardBody(ev, dateOpts));

  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform .35s cubic-bezier(.34,1.2,.64,1)';
    card.style.transform = 'translateY(-6px)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .35s cubic-bezier(.34,1.2,.64,1)';
    card.style.transform = '';
  });

  return card;
}
window.kkBuildEventCard = kkBuildEventCard;

/* ════════════════════════════════════════════════════════════
   FOTOĞRAF GALERİSİ + LIGHTBOX
   Etkinlik detay modalındaki "koleksiyon" görünümünü kurar
   (1 büyük + yanında küçük fotoğraflar) ve fotoğrafa tıklanınca
   açılan tam ekran, kaydırmalı lightbox'ı yönetir.
   index.html / hakkimizda.html / etkinlikler.html — hepsi
   detay modalındaki galeri kutusunu doldurmak için
   kkRenderEventGallery(containerEl, ev) fonksiyonunu çağırır.
   ════════════════════════════════════════════════════════════ */

// ev.img (kapak) + ev.images[] (ek fotoğraflar) içinden geçerli url listesi üretir
function kkGetEventPhotos(ev) {
  const list = [];
  if (ev.img && /^(data:image\/|https?:\/\/)/.test(ev.img)) list.push(ev.img);
  if (Array.isArray(ev.images)) {
    ev.images.forEach(p => {
      if (p && p.url && /^(data:image\/|https?:\/\/)/.test(p.url)) list.push(p.url);
    });
  }
  return list;
}
window.kkGetEventPhotos = kkGetEventPhotos;

// Detay modalındaki galeri kutusunu doldurur. containerEl: .ev-gallery sınıfına sahip boş bir div.
function kkRenderEventGallery(containerEl, ev) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  const photos = kkGetEventPhotos(ev);

  if (!photos.length) {
    containerEl.classList.remove('has-side');
    const em = document.createElement('div');
    em.className = 'ev-gallery-emoji';
    em.textContent = ev.emoji || window.KK_CAT_EMOJI[ev.cat] || '📌';
    containerEl.appendChild(em);
    return;
  }

  const main = document.createElement('div');
  main.className = 'ev-gallery-main';
  const mainImg = document.createElement('img');
  mainImg.src = photos[0]; mainImg.alt = ev.title || '';
  main.appendChild(mainImg);
  main.addEventListener('click', (e) => { e.stopPropagation(); kkOpenLightbox(photos, 0); });
  containerEl.appendChild(main);

  const rest = photos.slice(1, 3); // yanda en fazla 2 küçük fotoğraf gösterilir
  if (rest.length) {
    containerEl.classList.add('has-side');
    const side = document.createElement('div');
    side.className = 'ev-gallery-side' + (rest.length === 1 ? ' rows-1' : '');
    rest.forEach((url, i) => {
      const idx = i + 1;
      const th = document.createElement('div');
      th.className = 'ev-gallery-thumb';
      const im = document.createElement('img');
      im.src = url; im.alt = '';
      th.appendChild(im);
      // 3. fotoğrafın üzerinde, kalan fotoğraf sayısı varsa "+N" göster
      if (idx === 2 && photos.length > 3) {
        const more = document.createElement('div');
        more.className = 'ev-gallery-more';
        more.textContent = '+' + (photos.length - 3);
        th.appendChild(more);
      }
      th.addEventListener('click', (e) => { e.stopPropagation(); kkOpenLightbox(photos, idx); });
      side.appendChild(th);
    });
    containerEl.appendChild(side);
  } else {
    containerEl.classList.remove('has-side');
  }
}
window.kkRenderEventGallery = kkRenderEventGallery;

/* ── Lightbox: tek seferlik DOM enjeksiyonu, tüm sayfalarda paylaşılır ── */
let _kkLbPhotos = [], _kkLbIndex = 0, _kkLbTouchX = null;

function kkEnsureLightboxDom() {
  if (document.getElementById('kk-lightbox')) return;
  const el = document.createElement('div');
  el.id = 'kk-lightbox';
  el.innerHTML = `
    <div class="kk-lb-stage">
      <button class="kk-lb-close" aria-label="Kapat">✕</button>
      <button class="kk-lb-nav kk-lb-prev" aria-label="Önceki">${KK_ICON_ARROW.replace('M5 12h14M12 5l7 7-7 7','M15 6l-6 6 6 6')}</button>
      <img class="kk-lb-img" alt="">
      <button class="kk-lb-nav kk-lb-next" aria-label="Sonraki">${KK_ICON_ARROW}</button>
      <div class="kk-lb-counter"></div>
    </div>`;
  document.body.appendChild(el);

  el.querySelector('.kk-lb-close').addEventListener('click', kkCloseLightbox);
  el.addEventListener('click', (e) => { if (e.target === el) kkCloseLightbox(); });
  el.querySelector('.kk-lb-prev').addEventListener('click', () => kkLbStep(-1));
  el.querySelector('.kk-lb-next').addEventListener('click', () => kkLbStep(1));

  document.addEventListener('keydown', (e) => {
    if (!el.classList.contains('open')) return;
    if (e.key === 'Escape') kkCloseLightbox();
    else if (e.key === 'ArrowLeft') kkLbStep(-1);
    else if (e.key === 'ArrowRight') kkLbStep(1);
  });

  const stage = el.querySelector('.kk-lb-stage');
  stage.addEventListener('touchstart', (e) => { _kkLbTouchX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (_kkLbTouchX === null) return;
    const dx = e.changedTouches[0].clientX - _kkLbTouchX;
    if (Math.abs(dx) > 40) kkLbStep(dx > 0 ? -1 : 1);
    _kkLbTouchX = null;
  }, { passive: true });
}

function kkLbRender() {
  const el = document.getElementById('kk-lightbox');
  if (!el) return;
  el.querySelector('.kk-lb-img').src = _kkLbPhotos[_kkLbIndex];
  el.querySelector('.kk-lb-counter').textContent = (_kkLbIndex + 1) + ' / ' + _kkLbPhotos.length;
  const multi = _kkLbPhotos.length > 1;
  el.querySelector('.kk-lb-prev').style.display = multi ? 'flex' : 'none';
  el.querySelector('.kk-lb-next').style.display = multi ? 'flex' : 'none';
  el.querySelector('.kk-lb-counter').style.display = multi ? 'block' : 'none';
}
function kkLbStep(dir) {
  if (!_kkLbPhotos.length) return;
  _kkLbIndex = (_kkLbIndex + dir + _kkLbPhotos.length) % _kkLbPhotos.length;
  kkLbRender();
}
function kkOpenLightbox(photos, startIndex) {
  if (!photos || !photos.length) return;
  kkEnsureLightboxDom();
  _kkLbPhotos = photos; _kkLbIndex = startIndex || 0;
  kkLbRender();
  document.getElementById('kk-lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function kkCloseLightbox() {
  const el = document.getElementById('kk-lightbox');
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}
window.kkOpenLightbox = kkOpenLightbox;
window.kkCloseLightbox = kkCloseLightbox;