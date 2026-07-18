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

// Kartın gövdesini üretir: kategori rozeti, başlık, tarih+konum, açıklama, "Detayları Gör"
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
  if (ev.img && /^(data:image\/|https?:\/\/)/.test(ev.img)) {
    const img = document.createElement('img');
    img.src = ev.img; img.alt = ev.title;
    img.style.objectPosition = ev.imgPos || '50% 50%';
    thumb.appendChild(img);
  } else {
    const em = document.createElement('div');
    em.className = 'ev-thumb-emoji';
    em.textContent = ev.emoji || window.KK_CAT_EMOJI[ev.cat] || '📌';
    thumb.appendChild(em);
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