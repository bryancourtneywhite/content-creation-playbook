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
