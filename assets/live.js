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
        '<span>🔴 <strong>SOLASHUR IS LIVE</strong> on ' + platform +
          (d.title ? ' — ' + escapeHtml(d.title) : '') + '</span>' +
        '<a class="live-cta" href="' + base + 'watch.html">▶ Watch now</a>' +
        '<button class="live-x" aria-label="Dismiss">✕</button>';

      document.body.insertBefore(banner, document.body.firstChild);

      // Optional inline stream preview (hover-reveal) — only if a
      // container with id="live-preview" exists on the page (home hero).
      var previewHost = document.getElementById('live-preview');
      if (previewHost && d.platform !== 'youtube') {
        var ch = d.twitch || 'solashur';
        var parents = ['solashur.com', 'www.solashur.com', 'bryancourtneywhite.github.io', 'localhost'];
        var pq = parents.map(function (p) { return 'parent=' + p; }).join('&');
        previewHost.innerHTML =
          '<div class="live-preview-inner">' +
            '<div class="lp-label"><span class="live-dot"></span> Live preview</div>' +
            '<iframe src="https://player.twitch.tv/?channel=' + ch + '&' + pq + '&muted=true&autoplay=true" ' +
              'allowfullscreen title="Solashur live preview"></iframe>' +
          '</div>';
        previewHost.style.display = 'block';
      }

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
