/* ------------------------------------------------------------------
   Live channel stats for Ashura Whole Heavens.

   Renders a small stat strip into any <div data-live-stats></div>.

   • YouTube subscribers — TRULY LIVE via api.socialcounts.org, a free,
     keyless public endpoint (no API key to leak on a static site).
     Auto-refreshes every ~60s.
   • Twitch followers — read from data/live.json ("twitchFollowers"),
     because Twitch's API needs OAuth secrets that can't be safely shipped
     in public client-side code. Update that number when it changes.

   Both degrade gracefully: if a source fails, that stat is hidden rather
   than showing a wrong/zero value.
   ------------------------------------------------------------------ */
(function () {
  var YT_CHANNEL_ID = 'UCXfA4M5_bHzLAoRkj-7Kz_A';   // Ashura Whole Heavens
  var YT_ENDPOINT = 'https://api.socialcounts.org/youtube-live-subscriber-count/' + YT_CHANNEL_ID;

  var inBuilds = location.pathname.indexOf('/builds/') !== -1;
  var LIVE_JSON = (inBuilds ? '../' : '') + 'data/live.json';

  var hosts = document.querySelectorAll('[data-live-stats]');
  if (!hosts.length) return;

  function fmt(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  function shell() {
    return '' +
      '<div class="ls-strip">' +
        '<a class="ls-item ls-yt" href="https://www.youtube.com/@SolAshur?sub_confirmation=1" target="_blank" rel="noopener">' +
          '<span class="ls-ico">▶️</span>' +
          '<span class="ls-num" data-yt>—</span>' +
          '<span class="ls-lbl">YouTube subs</span>' +
        '</a>' +
        '<a class="ls-item ls-tw" href="https://www.twitch.tv/solashur" target="_blank" rel="noopener">' +
          '<span class="ls-ico">🎮</span>' +
          '<span class="ls-num" data-tw>—</span>' +
          '<span class="ls-lbl">Twitch followers</span>' +
        '</a>' +
      '</div>';
  }

  hosts.forEach(function (h) { h.innerHTML = shell(); });

  function setAll(sel, text) {
    document.querySelectorAll('[data-live-stats] ' + sel).forEach(function (el) { el.textContent = text; });
  }
  function hideItem(cls) {
    document.querySelectorAll('[data-live-stats] .' + cls).forEach(function (el) { el.style.display = 'none'; });
  }

  // --- YouTube: live, auto-refresh ---
  function loadYT() {
    fetch(YT_ENDPOINT, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var c = d && d.counters;
        var n = c && ((c.estimation && c.estimation.subscriberCount) || (c.api && c.api.subscriberCount));
        if (n) setAll('[data-yt]', fmt(n));
        else hideItem('ls-yt');
      })
      .catch(function () { hideItem('ls-yt'); });
  }

  // --- Twitch: from live.json (manual, safe) ---
  function loadTW() {
    fetch(LIVE_JSON, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var n = d && d.twitchFollowers;
        if (n && Number(n) > 0) setAll('[data-tw]', fmt(n));
        else hideItem('ls-tw');
      })
      .catch(function () { hideItem('ls-tw'); });
  }

  loadYT();
  loadTW();
  setInterval(loadYT, 60000);   // refresh YouTube subs every minute
})();
