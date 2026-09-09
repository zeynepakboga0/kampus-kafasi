/**
 * cookie-consent.js — Kampüs Kafası Çerez Onay Banner'ı
 * Firebase'e / main.js'e bağımlı değildir, tüm sayfalarda bağımsız çalışır.
 *
 * Kullanım: bu dosyayı her HTML sayfasının <head> kısmına, style.css'in
 * hemen altına şu şekilde ekle:
 *   <script src="cookie-consent.js" defer></script>          (kök dizindeki sayfalar, ör. index.html)
 *   <script src="../cookie-consent.js" defer></script>       (alt klasördeki sayfalar, ör. /ekip/, /hakkimizda/ vb.)
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'kk_cookie_consent'; // localStorage anahtarı
  const CONSENT_VERSION = 'v1'; // Politika metnini ileride önemli ölçüde değiştirirsen bu değeri artır, banner tekrar gösterilir.

  // ↓↓↓ BURAYI DEĞİŞTİR: Google Analytics ölçüm ID'ni buraya yaz (ör. "G-ABC1234XYZ")
  const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

  function loadGoogleAnalytics() {
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return; // ID girilmediyse hiç yükleme
    if (window._kkGaLoaded) return; // iki kere yüklemeyi önle
    window._kkGaLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    // anonymize_ip: KVKK/GDPR açısından IP'yi kısaltarak gönderir, ek bir gizlilik önlemi.
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function getSavedConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(status) {
    const payload = { status: status, version: CONSENT_VERSION, ts: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { /* localStorage kapalıysa sessizce geç */ }
    window.kkCookieConsent = status; // 'accepted' | 'rejected'
    window.dispatchEvent(new CustomEvent('kkCookieConsentChanged', { detail: { status: status } }));
  }

  // Sayfanın kaç klasör altında olduğunu bulup /cerez-politikasi/ linkini doğru kur
  const segments = location.pathname.split('/').filter(Boolean);
  const isSubpage = segments.length > 0 && segments[0] !== 'index.html';
  const assetPrefix = isSubpage ? '../' : '';
  const policyHref = assetPrefix + 'cerez-politikasi/';

  const existing = getSavedConsent();
  if (existing) {
    // Kullanıcı daha önce karar vermiş; global değişkeni set edip çık, banner gösterme.
    window.kkCookieConsent = existing.status;
    if (existing.status === 'accepted') loadGoogleAnalytics();
    return;
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #kk-cookie-banner {
        position: fixed;
        left: 0; right: 0; bottom: 0;
        z-index: 99999;
        display: flex;
        justify-content: center;
        padding: 18px 24px;
        background: #0b0f14;
        border-top: 1px solid rgba(45, 212, 191, 0.25);
        color: #e6e9ee;
        font-family: 'Outfit', system-ui, sans-serif;
        font-size: 14.5px;
        line-height: 1.5;
        box-shadow: 0 -8px 32px rgba(0,0,0,0.45);
        transform: translateY(100%);
        transition: transform .4s ease;
      }
      #kk-cookie-banner.kk-visible { transform: translateY(0); }
      #kk-cookie-inner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        width: 100%;
        max-width: 1180px;
      }
      #kk-cookie-banner p { margin: 0; flex: 1 1 320px; min-width: 240px; }
      #kk-cookie-banner a { color: #2dd4bf; text-decoration: underline; }
      #kk-cookie-actions { display: flex; gap: 10px; flex-wrap: wrap; }
      #kk-cookie-banner button {
        cursor: pointer;
        border: none;
        border-radius: 999px;
        padding: 10px 22px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        transition: background .2s ease, border-color .2s ease, transform .15s ease;
      }
      #kk-cookie-accept {
        background: linear-gradient(135deg, #2dd4bf, #14b8a6);
        color: #06120f;
      }
      #kk-cookie-accept:hover { filter: brightness(1.08); transform: translateY(-1px); }
      #kk-cookie-reject {
        background: transparent;
        color: #e6e9ee;
        border: 1px solid rgba(230, 233, 238, 0.28) !important;
      }
      #kk-cookie-reject:hover { background: rgba(45, 212, 191, 0.08); border-color: rgba(45, 212, 191, 0.5) !important; }
      @media (max-width: 560px) {
        #kk-cookie-banner { padding: 16px; }
        #kk-cookie-actions { width: 100%; }
        #kk-cookie-actions button { flex: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  function showBanner() {
    injectStyles();

    const banner = document.createElement('div');
    banner.id = 'kk-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Çerez onayı');
    banner.innerHTML = `
      <div id="kk-cookie-inner">
        <p>
          Sitemizde deneyimini iyileştirmek için zorunlu çerezler kullanıyoruz. Detaylar için
          <a href="${policyHref}">Çerez Politikası</a>'nı inceleyebilirsin.
        </p>
        <div id="kk-cookie-actions">
          <button id="kk-cookie-reject" type="button">Sadece Zorunlu</button>
          <button id="kk-cookie-accept" type="button">Kabul Et</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    requestAnimationFrame(() => banner.classList.add('kk-visible'));

    function closeBanner() {
      banner.classList.remove('kk-visible');
      setTimeout(() => banner.remove(), 400);
    }

    document.getElementById('kk-cookie-accept').addEventListener('click', () => {
      saveConsent('accepted');
      loadGoogleAnalytics();
      closeBanner();
    });
    document.getElementById('kk-cookie-reject').addEventListener('click', () => {
      saveConsent('rejected');
      closeBanner();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();