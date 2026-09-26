/* ------------------------------------------------------------------
   Brand-styled SVG logos for sponsors.
   IMPORTANT: These are ORIGINAL, stylized representations drawn in SVG —
   inspired by each brand's look (colors, letterforms), NOT copies of the
   official trademarked logo files. This avoids trademark/copyright issues
   while giving a professional, recognizable look.

   TO USE OFFICIAL ASSETS LATER (fully licensed): replace the SVG returned
   here with an <img src="..."> pointing to the brand's official affiliate
   asset (Amazon SiteStripe banner, or Impact "Ads/Assets" for Razer/ExitLag).

   Usage: element.innerHTML = window.BRAND_LOGOS.razer();  (etc.)
   ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   Hardware device illustrations (original stylized SVG) — used as the
   product-shot fallback when there's no real product photo. Each draws
   the device TYPE with the brand name on it. Not copies of any logo.
   Usage: element.innerHTML = window.HW_ICONS.cpu('AMD');
   ------------------------------------------------------------------ */
window.HW_ICONS = (function () {
  function wrap(inner) {
    return '<svg viewBox="0 0 120 90" width="100%" height="100%" ' +
      'style="max-height:100px" role="img">' + inner + '</svg>';
  }
  function label(txt, color) {
    return '<text x="60" y="84" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" ' +
      'font-size="11" font-weight="900" letter-spacing="1.5" fill="' + (color || '#c9c9d2') + '">' +
      String(txt).toUpperCase() + '</text>';
  }
  var GLOW = 'filter="drop-shadow(0 0 5px rgba(214,30,44,0.5))"';

  return {
    // CPU chip with pins
    cpu: function (brand) {
      return wrap(
        '<g ' + GLOW + '>' +
        '<rect x="38" y="18" width="44" height="44" rx="4" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<rect x="48" y="28" width="24" height="24" rx="2" fill="#2a1e2e" stroke="#ff7a4d" stroke-width="1.5"/>' +
        '<text x="60" y="44" text-anchor="middle" font-family="Arial" font-size="7" fill="#ff9a6d">CPU</text>' +
        // pins
        '<g stroke="#e04a2c" stroke-width="2">' +
        '<line x1="44" y1="18" x2="44" y2="10"/><line x1="54" y1="18" x2="54" y2="10"/>' +
        '<line x1="66" y1="18" x2="66" y2="10"/><line x1="76" y1="18" x2="76" y2="10"/>' +
        '<line x1="44" y1="62" x2="44" y2="70"/><line x1="54" y1="62" x2="54" y2="70"/>' +
        '<line x1="66" y1="62" x2="66" y2="70"/><line x1="76" y1="62" x2="76" y2="70"/>' +
        '<line x1="38" y1="26" x2="30" y2="26"/><line x1="38" y1="40" x2="30" y2="40"/><line x1="38" y1="54" x2="30" y2="54"/>' +
        '<line x1="82" y1="26" x2="90" y2="26"/><line x1="82" y1="40" x2="90" y2="40"/><line x1="82" y1="54" x2="90" y2="54"/>' +
        '</g></g>' + label(brand, '#ff9a6d'));
    },
    // Graphics card: PCB + fans
    gpu: function (brand) {
      return wrap(
        '<g ' + GLOW + '>' +
        '<rect x="16" y="26" width="88" height="34" rx="3" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<circle cx="40" cy="43" r="11" fill="none" stroke="#ff7a4d" stroke-width="2"/>' +
        '<circle cx="76" cy="43" r="11" fill="none" stroke="#ff7a4d" stroke-width="2"/>' +
        '<g stroke="#ff7a4d" stroke-width="1.5">' +
        '<line x1="40" y1="34" x2="40" y2="52"/><line x1="31" y1="43" x2="49" y2="43"/>' +
        '<line x1="76" y1="34" x2="76" y2="52"/><line x1="67" y1="43" x2="85" y2="43"/></g>' +
        '<rect x="20" y="60" width="30" height="6" fill="#e04a2c"/>' +
        '</g>' + label(brand, '#ff9a6d'));
    },
    // RAM stick
    ram: function (brand) {
      return wrap(
        '<g ' + GLOW + '>' +
        '<rect x="26" y="20" width="68" height="40" rx="3" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<g fill="#2a1e2e" stroke="#ff7a4d" stroke-width="1">' +
        '<rect x="32" y="28" width="12" height="16"/><rect x="48" y="28" width="12" height="16"/>' +
        '<rect x="64" y="28" width="12" height="16"/><rect x="80" y="28" width="8" height="16"/></g>' +
        // gold contacts
        '<g stroke="#f5c542" stroke-width="2">' +
        '<line x1="34" y1="60" x2="34" y2="66"/><line x1="44" y1="60" x2="44" y2="66"/>' +
        '<line x1="54" y1="60" x2="54" y2="66"/><line x1="64" y1="60" x2="64" y2="66"/>' +
        '<line x1="74" y1="60" x2="74" y2="66"/><line x1="84" y1="60" x2="84" y2="66"/></g>' +
        '</g>' + label(brand, '#ff9a6d'));
    },
    // AIO cooler: pump block + tubes + radiator
    cooler: function (brand) {
      return wrap(
        '<g ' + GLOW + '>' +
        '<rect x="20" y="24" width="26" height="40" rx="3" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<circle cx="33" cy="44" r="8" fill="none" stroke="#4aa3e0" stroke-width="2"/>' +
        '<rect x="74" y="20" width="30" height="48" rx="3" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<g stroke="#ff7a4d" stroke-width="1.5"><line x1="80" y1="26" x2="98" y2="26"/><line x1="80" y1="34" x2="98" y2="34"/>' +
        '<line x1="80" y1="42" x2="98" y2="42"/><line x1="80" y1="50" x2="98" y2="50"/><line x1="80" y1="58" x2="98" y2="58"/></g>' +
        '<path d="M46 34 C60 30 62 30 74 34" fill="none" stroke="#4aa3e0" stroke-width="3"/>' +
        '<path d="M46 54 C60 58 62 58 74 54" fill="none" stroke="#4aa3e0" stroke-width="3"/>' +
        '</g>' + label(brand, '#ff9a6d'));
    },
    // SSD drive
    ssd: function (brand) {
      return wrap(
        '<g ' + GLOW + '>' +
        '<rect x="24" y="22" width="72" height="40" rx="4" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<rect x="32" y="30" width="40" height="10" rx="2" fill="#2a1e2e" stroke="#ff7a4d" stroke-width="1"/>' +
        '<circle cx="84" cy="52" r="3" fill="#ff7a4d"/>' +
        '</g>' + label(brand, '#ff9a6d'));
    },
    // Keyboard
    keyboard: function (brand) {
      var keys = '';
      for (var r = 0; r < 3; r++) for (var c = 0; c < 8; c++)
        keys += '<rect x="' + (22 + c * 9.5) + '" y="' + (26 + r * 10) + '" width="7" height="7" rx="1" fill="#2a1e2e" stroke="#ff7a4d" stroke-width="0.8"/>';
      return wrap('<g ' + GLOW + '>' +
        '<rect x="16" y="20" width="88" height="42" rx="4" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        keys + '</g>' + label(brand, '#ff9a6d'));
    },
    // Mouse
    mouse: function (brand) {
      return wrap('<g ' + GLOW + '>' +
        '<path d="M60 16 C44 16 38 30 38 44 C38 60 48 68 60 68 C72 68 82 60 82 44 C82 30 76 16 60 16 Z" ' +
        'fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<line x1="60" y1="18" x2="60" y2="40" stroke="#ff7a4d" stroke-width="1.5"/>' +
        '<rect x="56" y="26" width="8" height="10" rx="3" fill="#4aa3e0"/>' +
        '</g>' + label(brand, '#ff9a6d'));
    },
    // Headset
    headset: function (brand) {
      return wrap('<g ' + GLOW + '>' +
        '<path d="M28 52 L28 42 A32 32 0 0 1 92 42 L92 52" fill="none" stroke="#e04a2c" stroke-width="3"/>' +
        '<rect x="20" y="46" width="16" height="24" rx="4" fill="#1c1420" stroke="#ff7a4d" stroke-width="2"/>' +
        '<rect x="84" y="46" width="16" height="24" rx="4" fill="#1c1420" stroke="#ff7a4d" stroke-width="2"/>' +
        '<path d="M20 64 C10 66 10 74 18 76" fill="none" stroke="#4aa3e0" stroke-width="2.5"/>' +
        '</g>' + label(brand, '#ff9a6d'));
    },
    // Monitor
    monitor: function (brand) {
      return wrap('<g ' + GLOW + '>' +
        '<rect x="22" y="16" width="76" height="44" rx="3" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<rect x="28" y="22" width="64" height="32" rx="1" fill="#2a1e2e"/>' +
        '<path d="M32 50 L48 34 L58 44 L70 28 L86 50 Z" fill="#4aa3e0" opacity="0.5"/>' +
        '<rect x="52" y="60" width="16" height="6" fill="#e04a2c"/>' +
        '<rect x="42" y="66" width="36" height="4" rx="2" fill="#e04a2c"/>' +
        '</g>' + label(brand, '#ff9a6d'));
    },
    // Webcam
    webcam: function (brand) {
      return wrap('<g ' + GLOW + '>' +
        '<circle cx="60" cy="40" r="22" fill="#1c1420" stroke="#e04a2c" stroke-width="2.5"/>' +
        '<circle cx="60" cy="40" r="12" fill="#2a1e2e" stroke="#ff7a4d" stroke-width="2"/>' +
        '<circle cx="60" cy="40" r="5" fill="#4aa3e0"/>' +
        '<rect x="46" y="60" width="28" height="6" rx="2" fill="#e04a2c"/>' +
        '</g>' + label(brand, '#ff9a6d'));
    }
  };
})();

window.BRAND_LOGOS = {
  // Razer-style: clean green "RAZER" wordmark with the angular Ξ-style E
  // (stylized, original — no serpent, matches the wordmark-only look).
  razer: function () {
    var g = '#44d62c';
    return '' +
      '<svg viewBox="0 0 240 60" width="100%" height="100%" role="img" aria-label="Razer" style="max-height:44px">' +
        '<g fill="none" stroke="' + g + '" stroke-width="6" stroke-linecap="square" stroke-linejoin="miter" ' +
           'filter="drop-shadow(0 0 4px rgba(68,214,44,0.6))">' +
          // R  (stem, bowl, leg)
          '<path d="M10 50 L10 12 L26 12 Q34 12 34 22 Q34 32 26 32 L10 32 M22 32 L34 50"/>' +
          // A  (two legs + crossbar)
          '<path d="M48 50 L58 12 L68 50 M52 38 L64 38"/>' +
          // Z
          '<path d="M82 12 L104 12 L82 50 L104 50"/>' +
          // Ξ-style E (three horizontal bars, no vertical stem)
          '<path d="M118 12 L138 12 M118 31 L136 31 M118 50 L138 50"/>' +
          // R
          '<path d="M152 50 L152 12 L168 12 Q176 12 176 22 Q176 32 168 32 L152 32 M164 32 L176 50"/>' +
        '</g>' +
        // small TM
        '<text x="184" y="18" font-family="Arial, sans-serif" font-size="8" fill="' + g + '">TM</text>' +
      '</svg>';
  },

  // ExitLag-style: bold "EXIT" wordmark with red chevron X (stylized).
  exitlag: function () {
    return '' +
      '<svg viewBox="0 0 160 60" width="100%" height="100%" role="img" aria-label="ExitLag" style="max-height:40px">' +
        '<text x="6" y="40" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" ' +
              'fill="#f2f2f2" letter-spacing="1">E</text>' +
        // red chevron "X" made of two arrow stacks
        '<g fill="#d61e2c">' +
          '<path d="M40 14 l12 16 l-12 16 l8 0 l12 -16 l-12 -16 z"/>' +
          '<path d="M54 14 l12 16 l-12 16 l8 0 l12 -16 l-12 -16 z" opacity="0.85"/>' +
        '</g>' +
        '<text x="82" y="40" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" ' +
              'fill="#f2f2f2" letter-spacing="1">IT</text>' +
        '<text x="120" y="40" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" ' +
              'fill="#d61e2c" letter-spacing="1">LAG</text>' +
      '</svg>';
  },

  // Amazon-style: lowercase wordmark with the curved smile-arrow (stylized).
  amazon: function () {
    return '' +
      '<svg viewBox="0 0 150 60" width="100%" height="100%" role="img" aria-label="Amazon" style="max-height:40px">' +
        '<text x="75" y="36" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" ' +
              'font-weight="700" fill="#f2f2f2">amazon</text>' +
        // curved smile arrow under the wordmark
        '<path d="M28 44 C55 56 95 56 122 46" fill="none" stroke="#ff9900" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M122 46 l-2 -8 l10 5 z" fill="#ff9900"/>' +
      '</svg>';
  }
};
