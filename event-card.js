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