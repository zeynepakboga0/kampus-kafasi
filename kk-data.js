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

  try {
    // Ayarları çek
    const settSnap = await getDoc(doc(db, "ayarlar", "kk_sett"));
    if (settSnap.exists()) sett = settSnap.data();

    // Sayaçları çek
    const cntSnap = await getDoc(doc(db, "ayarlar", "kk_counters"));
    if (cntSnap.exists()) cnt = cntSnap.data();

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
  } catch (error) {
    console.error("Firebase'den veri çekilirken hata oluştu: ", error);
  }

  const page = location.pathname.split('/').pop() || 'index.html';

  /* ── 1. GLOBAL: WA / Email / Instagram linklerini uygula ── */
  function applyGlobalSettings() {
    if (sett.ig) {
      document.querySelectorAll('a[href*="instagram.com"]').forEach(el => {
        if(!el.classList.contains('no-overwrite')) el.href = sett.ig;
      });
    }
    if (sett.wa) {
      document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com"]').forEach(el => {
        el.href = sett.wa;
      });
      const footerWa = document.getElementById('footer-wa');
      if (footerWa) footerWa.href = sett.wa;
      const spWa = document.getElementById('sp-wa-link');
      if (spWa) spWa.href = sett.wa;
      const drawerWa = document.getElementById('drawer-wa');
      if (drawerWa) drawerWa.href = sett.wa;
    }
    if (sett.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
        el.href = 'mailto:' + sett.email;
      });
      const cEmail = document.getElementById('contact-email-val');
      if (cEmail) { cEmail.href = 'mailto:' + sett.email; cEmail.textContent = sett.email; }
    }
  }

  /* ── 2. SAYFA BAZLI YÜKLEMELER ── */
  
  // INDEX veya SPONSORLUK sayfasında sayaçları çalıştır
  if (page === 'index.html' || page === 'sponsorluk.html' || page === '') {
    applyCounters();
  }

  // INDEX sayfasındaki özel alanlar
 if (page === 'index.html' || page === '') {
    if (metin.heroBadge) {
      const badge = document.getElementById('hero-badge-text');
      if (badge) badge.textContent = metin.heroBadge;
    }
    if (metin.heroSub) {
      const sub = document.getElementById('hero-sub-el');
      if (sub) sub.textContent = metin.heroSub;
    }
    renderHomeEvents();

    const whoPs = document.querySelectorAll('#who .who-inner p');
    if (metin.who1 && whoPs[0]) whoPs[0].textContent = metin.who1;
    if (metin.who2 && whoPs[1]) whoPs[1].textContent = metin.who2;
  }

  // ETKİNLİKLER sayfası
  if (page === 'etkinlikler.html') {
    window.kk_events_data = eventsList;
    // renderEvents varsa çağır, yoksa etkinlikler.html kendi içinde kk_events_data'yı kullansın
    if (typeof window.renderEvents === 'function') {
      window.renderEvents(eventsList);
    } else {
      document.addEventListener('kk:ready', () => {
        if (typeof window.renderEvents === 'function') window.renderEvents(eventsList);
      });
    }
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
  }

  /* ── YARDIMCI PROSES FONKSİYONLARI ── */

  function applyCounters() {
    const mEl = document.getElementById('sc-members');
    const eEl = document.getElementById('sc-events');
    const yEl = document.getElementById('sc-year');
    if (mEl) mEl.setAttribute('data-target', cnt.members || 17000);
    if (eEl) eEl.setAttribute('data-target', cnt.events || 50);
    if (yEl) yEl.setAttribute('data-target', cnt.years || 4);
  }

  function renderHomeEvents() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    const active = eventsList.filter(e => !e.isPast).slice(0, 3);
    if (active.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted)">Yakın zamanda planlanmış etkinlik bulunmuyor. Takipte kalın!</div>';
      return;
    }
    grid.innerHTML = active.map(ev => `
      <div class="event-card reveal" onclick="openEventModal('${ev.id}')">
        <div class="ev-img-wrap">
          <img src="${ev.img || 'logo.jpg'}" alt="${esc(ev.title)}">
          <span class="ev-badge ${ev.isPast ? 'past' : 'upcoming'}">${ev.isPast ? 'Tamamlandı' : 'Yaklaşan'}</span>
        </div>
        <div class="ev-body">
          <span class="ev-date">${formatDate(ev.date)}</span>
          <h3 class="ev-title">${esc(ev.title)}</h3>
          <p class="ev-desc">${esc(ev.desc)}</p>
        </div>
      </div>
    `).join('');
    
    // Modal açma köprüsü
    window.openEventModal = function(id) {
      const found = eventsList.find(e => e.id === id);
      if(found && typeof window.showModal === 'function') window.showModal(found);
    };
  }

  function renderEkipPage(list) {
    const container = document.getElementById('ekip-container');
    if (!container) return;
    container.innerHTML = list.map(m => `
      <div class="board-card reveal">
        <div class="bc-img-wrap">
          <img src="${m.img || 'logo.jpg'}" alt="${esc(m.name)}">
        </div>
        <h3 class="bc-name">${esc(m.name)}</h3>
        <span class="bc-role">${esc(m.role)}</span>
        <p class="bc-bio">${esc(m.bio || '')}</p>
      </div>
    `).join('');
  }

  async function applySponsorPage() {
    // sponsorluk.html kendi inline script'i ile hallediyor

  }

  function applyAboutTexts() {
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

// Global tetikleyiciler
  applyGlobalSettings();

  // main.js'e verileri aktar ve UI'ı başlat
  window.events = eventsList;
  if (typeof window.sett !== 'undefined') {
    Object.assign(window.sett, sett);
  }
  if (typeof window.veriBaslat === 'function') {
    window.veriBaslat();
  }

})();