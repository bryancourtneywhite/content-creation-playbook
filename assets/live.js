/* ------------------------------------------------------------------
   Live-stream banner. Reads data/live.json; when live:true, shows a
   "LIVE NOW" banner at the top linking to the Watch page.
   Flip the flag in data/live.json when you go live (commit+push, or
   edit it from GitHub's web UI on your phone).
   Include on pages that should announce going live (e.g. home).
   Pass a path prefix for subfolder pages via data-live-base on the script tag.
   ------------------------------------------------------------------ */
(function () {
  var KEY = 'aws-live-dismissed';
  // Figure out relative paths (home is root; builds/ is one level down).
  var base = document.currentScript && document.currentScript.getAttribute('data-live-base');
  base = base || '';

  fetch(base + 'data/live.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.live) return;
      // Don't re-show if the user dismissed this exact session's banner.
      var stamp = (d.platform || '') + '|' + (d.title || '');
      try { if (sessionStorage.getItem(KEY) === stamp) return; } catch (e) {}

      var platform = (d.platform === 'youtube') ? 'YouTube' : 'Twitch';
      var banner = document.createElement('div');
      banner.className = 'live-banner';
      banner.innerHTML =
        '<span class="live-dot"></span>' +
        '<span>🔴 LIVE NOW on ' + platform +
          (d.title ? ' — ' + escapeHtml(d.title) : '') + '</span>' +
        '<a class="live-cta" href="' + base + 'watch.html">▶ Watch the stream</a>' +
        '<button class="live-x" aria-label="Dismiss">✕</button>';

      document.body.insertBefore(banner, document.body.firstChild);

      banner.querySelector('.live-x').addEventListener('click', function () {
        banner.remove();
        try { sessionStorage.setItem(KEY, stamp); } catch (e) {}
      });
    })
    .catch(function () { /* offline / file:// — no banner, no harm */ });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
})();
