/**
 * kk-data.js — Kampüs Kafası Paylaşılan Veri Yükleyicisi (Firebase Sürümü)
 */
import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

(async function() {
  'use strict';

  // 1. Firebase Firestore'dan verileri çekiyoruz
  let sett = {};
  let cnt = { members: 17000, events: 50, years: 4 };
  let metin = {};
  let spData = {};
  let ekipData = null;
  let eventsList = [];
  let groupsList = [];

  // Temiz URL yapısı (ör: /hakkimizda/) ile eski dosya adı yapısını (ör: /hakkimizda.html)
  // birlikte destekler. Klasör adını veya dosya adını bulup ".html" ekleyerek
  // aşağıdaki sayfa-özel kontrollerle uyumlu hale getirir.
  // Bilinen alt sayfa isimleri. Bu listede olmayan her şey ana sayfa
  // kabul edilir. Bu liste olmadan, GitHub Pages proje adresinde
  // (kullanici.github.io/kampus-kafasi/) ana sayfanın son URL parçası
  // repo adı ("kampus-kafasi") olduğu için kod bunu yanlışlıkla bir alt
  // sayfa sanıyor ve ana sayfaya özel metinler (Biz Kimiz paragrafları
  // gibi) hiç uygulanmıyordu.
  const KNOWN_PAGES = ['hakkimizda', 'ekip', 'etkinlikler', 'iletisim', 'sponsorluk', 'oyun', 'gruplar'];
  const segments = location.pathname.split('/').filter(Boolean); // boş parçaları at
  const lastSeg = segments.pop() || '';
  let page;
  if (lastSeg === '' || lastSeg === 'index.html') {
    page = 'index.html';
  } else if (lastSeg.endsWith('.html')) {
    const slug = lastSeg.replace(/\.html$/, '');
    page = KNOWN_PAGES.includes(slug) ? lastSeg : 'index.html';
  } else {
    page = KNOWN_PAGES.includes(lastSeg) ? lastSeg + '.html' : 'index.html';
  }
  // Bu betiğin (ve style.css, main.js gibi ortak dosyaların) bulunduğu kök dizine göre
  // sayfanın kaç seviye altta olduğunu belirler. Ana sayfa hariç tüm sayfalar
  // birer klasörün içinde (ör. /ekip/) olduğu için tek seviye yukarı çıkmak gerekir.
  // Bu, hem GitHub Pages proje adresinde (kullanici.github.io/repo/) hem de
  // ileride alınacak özel bir domain'de (site.com/) değişiklik yapmadan çalışır.
  const assetPrefix = (page === 'index.html') ? '' : '../';

  /* ── YARDIMCI PROSES FONKSİYONLARI ── */

  function applyCounters() {
    // Sayaç animasyonunu burada TETİKLEMİYORUZ.
    // Sadece gerçek sayıyı saklıyoruz; ne zaman başlayacağına
    // main.js'teki loader kapanma anı karar veriyor.
    window._kkCounters = {
      members: cnt.members || 17000,
      events:  cnt.events  || 50,
      years:   cnt.years   || 4
    };
  }

  function renderEkipPage(list) {
    const container = document.getElementById('ekip-container');
    if (!container) return;
    container.innerHTML = list.map(m => `
      <div class="board-card reveal">
        <div class="bc-img-wrap">
          <img src="${esc(m.img || assetPrefix + 'logo.jpg')}" alt="${esc(m.name)}">
        </div>
        <h3 class="bc-name">${esc(m.name)}</h3>
        <span class="bc-role">${esc(m.role)}</span>
        <p class="bc-bio">${esc(m.bio || '')}</p>
      </div>
    `).join('');
  }

  // WhatsApp grup ikonu — tüm grup kartlarında kullanılıyor
  const WA_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  function renderGruplarPage(list) {
    const container = document.getElementById('gruplar-container');
    if (!container) return;
    if (!list || !list.length) {
      container.innerHTML = '<div class="gr-empty">Henüz grup eklenmedi. Çok yakında burada olacak!</div>';
      return;
    }
    container.innerHTML = list.map(g => `
      <a href="${esc(g.link || '#')}" target="_blank" rel="noopener noreferrer" class="group-card reveal">
        <div class="gc-icon">${WA_ICON}</div>
        <div class="gc-text">
          <h3 class="gc-name">${esc(g.name)}</h3>
          ${g.desc ? `<p class="gc-desc">${esc(g.desc)}</p>` : ''}
        </div>
        <div class="gc-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </div>
      </a>
    `).join('');
    // Basit görünürlük animasyonu (diğer sayfalardaki .reveal düzenine uyumlu)
    requestAnimationFrame(() => {
      container.querySelectorAll('.reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 60);
      });
    });
  }

  async function applySponsorPage() {
    // sponsorluk.html kendi inline script'i ile hallediyor
  }

  function applyAboutTexts() {
    // Hero (rozet + alt başlık) — hakkımızda sayfasının kendine ait hero'su,
    // ana sayfanın hero'sundan bağımsız. Sayfada aşağıdaki id'ler bulunmalı:
    // #about-badge-text  -> rozet metni (ör: "Akdeniz Üniversitesi · Antalya")
    // #about-hero-sub    -> hero alt başlığı
    const aboutHeroSub = document.getElementById('about-hero-sub');
    if (metin.aboutSub && aboutHeroSub) aboutHeroSub.textContent = metin.aboutSub;

    const introPSel = document.querySelectorAll('#intro .intro-text p');
    if (metin.about1 && introPSel[0]) introPSel[0].textContent = metin.about1;
    if (metin.about2 && introPSel[1]) introPSel[1].textContent = metin.about2;
    if (metin.about3 && introPSel[2]) introPSel[2].textContent = metin.about3;

    const vmCards = document.querySelectorAll('.vm-card');
    if (vmCards[0]) {
      const vps = vmCards[0].querySelectorAll('.vm-text');
      if (metin.vision1 && vps[0]) vps[0].textContent = metin.vision1;
      if (metin.vision2 && vps[1]) vps[1].textContent = metin.vision2;
    }
    if (vmCards[1]) {
      const mps = vmCards[1].querySelectorAll('.vm-text');
      if (metin.mission1 && mps[0]) mps[0].textContent = metin.mission1;
      if (metin.mission2 && mps[1]) mps[1].textContent = metin.mission2;
    }

    // "Son Etkinlikler" bölüm başlığı/açıklaması. Sayfada gerekli id'ler:
    // #about-ev-title -> bölüm başlığı, #about-ev-sub -> bölüm açıklaması
    const aboutEvTitle = document.getElementById('about-ev-title');
    if (metin.aboutEvTitle && aboutEvTitle) aboutEvTitle.textContent = metin.aboutEvTitle;
    const aboutEvSub = document.getElementById('about-ev-sub');
    if (metin.aboutEvSub && aboutEvSub) aboutEvSub.textContent = metin.aboutEvSub;
  }

  // Etkinlikler sayfası hero'su. Gerekli id'ler:
  // #events-badge-text -> rozet metni, #events-hero-sub -> alt başlık
  function applyEventsHero() {
    const sub = document.getElementById('events-hero-sub');
    if (metin.eventsSub && sub) sub.textContent = metin.eventsSub;
  }

  // Ekip sayfası hero'su. Gerekli id'ler:
  // #ekip-badge-text -> rozet metni, #ekip-hero-sub -> alt başlık
  function applyEkipHero() {
    const sub = document.getElementById('ekip-hero-sub');
    if (metin.ekipSub && sub) sub.textContent = metin.ekipSub;
  }

  // İletişim sayfası hero'su. Gerekli id'ler:
  // #iletisim-badge-text -> rozet metni, #iletisim-hero-sub -> alt başlık
  function applyIletisimHero() {
    const sub = document.getElementById('iletisim-hero-sub');
    if (metin.iletisimSub && sub) sub.textContent = metin.iletisimSub;
  }

  

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatDate(d) {
    if (!d) return '—';
    const parts = d.split('-');
    const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    return parseInt(parts[2]) + ' ' + months[parseInt(parts[1]) - 1] + ' ' + parts[0];
  }

  // ── Sayaçları ayrı bir try/catch içinde çek ──
  // Bu adım hata verse bile (izin hatası, doküman yok, ağ hatası vb.)
  // sayaçlar varsayılan değerlerle (17000 / 50 / 4) yine de başlasın.
  try {
    const cntSnap = await getDoc(doc(db, "ayarlar", "kk_counters"));
    if (cntSnap.exists()) cnt = cntSnap.data();
  } catch (error) {
    console.error("Sayaç verisi çekilirken hata oluştu, varsayılan değerler kullanılacak: ", error);
  }
  // Sayaç verisini her sayfada hazırla; kullanıp kullanmamaya o sayfanın kendi kodu karar verir
  applyCounters();

  // ── Diğer tüm veriler ayrı bir try/catch içinde ──
  try {
    // Ayarları çek
    const settSnap = await getDoc(doc(db, "ayarlar", "kk_sett"));
    if (settSnap.exists()) sett = settSnap.data();

    // Metinleri çek
    const metinSnap = await getDoc(doc(db, "ayarlar", "kk_metin_v1"));
    if (metinSnap.exists()) metin = metinSnap.data();

    // Sponsorluk verilerini çek
    const spSnap = await getDoc(doc(db, "ayarlar", "kk_sponsorluk_v1"));
    if (spSnap.exists()) spData = spSnap.data();

    // Ekip verilerini çek (admin board koleksiyonundan)
    const ekipSnap = await getDocs(collection(db, "kk_team_board"));
    ekipData = [];
    ekipSnap.forEach(d => ekipData.push({ id: d.id, ...d.data() }));
    ekipData.sort((a, b) => (a.order || 99) - (b.order || 99));
    if (ekipData.length === 0) ekipData = null;

    // Etkinlikler listesini çek (Koleksiyondan)
    const querySnapshot = await getDocs(collection(db, "kk_events"));
    querySnapshot.forEach((doc) => {
      eventsList.push({ id: doc.id, ...doc.data() });
    });

    // WhatsApp gruplarını çek (Koleksiyondan)
    const gruplarSnap = await getDocs(collection(db, "kk_wa_groups"));
    gruplarSnap.forEach((doc) => {
      groupsList.push({ id: doc.id, ...doc.data() });
    });
    groupsList.sort((a, b) => (a.order || 99) - (b.order || 99));
  } catch (error) {
    console.error("Firebase'den veri çekilirken hata oluştu: ", error);
  }

  /* ── 1. GLOBAL: WA / Email / Instagram linklerini uygula ── */
 if (sett.ig) {
  document.querySelectorAll('a[href*="instagram.com"]').forEach(el => {
    if(!el.classList.contains('no-overwrite')) el.href = 'https://www.instagram.com/' + sett.ig.replace(/^@/, '');
  });
}
    // NOT: footer-wa / drawer-wa / sp-wa-link / wa-link / wa-btn-hero artık
    // sett.wa'ya değil, dosyanın en altındaki kesin atamayla /gruplar/
    // sayfasına yönlendiriliyor (bkz. IIFE sonu). sett.wa hâlâ admin panelde
    // saklanıyor ama bu butonlar için kullanılmıyor.
    if (sett.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
        el.href = 'mailto:' + sett.email;
      });
      const cEmail = document.getElementById('contact-email-val');
      if (cEmail) { cEmail.href = 'mailto:' + sett.email; cEmail.textContent = sett.email; }
    }
    if (sett.linkedin) {
      document.querySelectorAll('a[href*="linkedin.com"]').forEach(el => {
        if (!el.classList.contains('no-overwrite')) el.href = sett.linkedin;
      });
    }
    if (sett.tiktok) {
      document.querySelectorAll('a[href*="tiktok.com"]').forEach(el => {
        if (!el.classList.contains('no-overwrite')) el.href = sett.tiktok;
      });
    }

  // INDEX sayfasındaki özel alanlar
  if (page === 'index.html' || page === '') {

    if (metin.heroSub) {
      const sub = document.getElementById('hero-sub-el');
      if (sub) sub.textContent = metin.heroSub;
    }

    const whoPs = document.querySelectorAll('#who .who-inner p');
    if (metin.who1 && whoPs[0]) whoPs[0].textContent = metin.who1;
    if (metin.who2 && whoPs[1]) whoPs[1].textContent = metin.who2;
  }

  // EKİP sayfası
  if (page === 'ekip.html' && ekipData) {
    renderEkipPage(ekipData);
  }

  // SPONSORLUK sayfası
  if (page === 'sponsorluk.html') {
    await applySponsorPage();
  }

  // HAKKIMIZDA sayfası
  if (page === 'hakkimizda.html') {
    applyAboutTexts();
    if (typeof window.loadActivities === 'function') {
      window.loadActivities(eventsList);
    }
  }

  // ETKİNLİKLER sayfası
  if (page === 'etkinlikler.html') {
    applyEventsHero();
  }

  // EKİP sayfası — hero rozeti/alt başlığı (üye kartları renderEkipPage ile ayrı uygulanıyor)
  if (page === 'ekip.html') {
    applyEkipHero();
  }

  // İLETİŞİM sayfası
  if (page === 'iletisim.html') {
    applyIletisimHero();
  }

  // GRUPLAR sayfası
  if (page === 'gruplar.html') {
    renderGruplarPage(groupsList);
  }

    // main.js'e verileri aktar ve UI'ı başlat
  window.events = eventsList;
  if (typeof window.sett !== 'undefined') {
    Object.assign(window.sett, sett);
  }
  window._kkMetin = metin;

  /* ── "WhatsApp'a Katıl" butonlarını TEK bir gruba değil, ──
     tüm grupların listelendiği /gruplar/ sayfasına yönlendir.
     ÖNEMLİ: Bu fonksiyon, aşağıdaki veriBaslat()/applyIndexTexts()
     çağrılarından SONRA da tekrar çalıştırılıyor. Çünkü o fonksiyonlar
     (özellikle applySettings/applyIndexTexts) sett.wa değerini kullanarak
     bu butonların href'ini eski WhatsApp linkiyle tekrar yazabiliyordu.
     Önce çağırmak tek başına yetmiyordu çünkü sonradan üzerine yazılıyordu;
     bu yüzden en son bu fonksiyon çalışıp "son sözü" söylüyor. */
  const gruplarHref = assetPrefix + 'gruplar/';
  function fixWaLinks() {
    ['wa-btn-hero', 'wa-link', 'footer-wa', 'drawer-wa', 'sp-wa-link', 'wa-cta-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.href = gruplarHref;
      }
    });
  }

  // 1) Erken çalıştır: veriBaslat/applyIndexTexts hata verirse bile linkler düzeltilmiş olsun
  fixWaLinks();

  try {
    if (typeof window.veriBaslat === 'function') {
      window.veriBaslat();
    }
  } catch (error) {
    console.error("veriBaslat() çalışırken hata oluştu: ", error);
  }

  try {
    if (typeof window.applyIndexTexts === 'function') {
      window.applyIndexTexts();
    }
  } catch (error) {
    console.error("applyIndexTexts() çalışırken hata oluştu: ", error);
  }

  // 2) Geç çalıştır: yukarıdaki fonksiyonlar href'i eski sett.wa değeriyle
  //    tekrar yazmış olsa bile, en son burada tekrar /gruplar/ sayfasına döndür.
  fixWaLinks();

})();