/* ------------------------------------------------------------------
  Follow / Subscribe call-to-action bar for Ashura Whole Heavens.

  Renders prominent YouTube "Subscribe" + Twitch "Follow" buttons (plus
  Discord "Join") into any <div data-follow></div>. Drop that div wherever
  you want the CTA - typically just above the footer on every page.

  - Reads live follower/subscriber counts from data/live.json.
  - YouTube link uses ?sub_confirmation=1 so it opens the subscribe prompt.
  - Twitch link opens the channel where the Follow button lives.
  ------------------------------------------------------------------ */
(function () {
  var hosts = document.querySelectorAll('[data-follow]');
  if (!hosts.length) return;

  var YT = 'https://www.youtube.com/@SolAshur?sub_confirmation=1';
  var TW = 'https://www.twitch.tv/solashur';
  var DC = 'https://discord.gg/rTD6qxUcmG';

  function fmtCount(n) {
    if (!n || n <= 0) return null;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
  }

  function render(twCount, ytCount) {
    var twBadge = twCount ? '<span class="fb-count">' + twCount + ' followers</span>' : '';
    var ytBadge = ytCount ? '<span class="fb-count">' + ytCount + ' subscribers</span>' : '';

    var html =
      '<div class="follow-cta">' +
      '<div class="follow-head">' +
      '<span class="follow-title">Join the Ascension</span>' +
      '<span class="follow-sub">New AION 2 builds, guides &amp; live PvP every week - don\'t miss a drop.</span>' +
      '</div>' +
      '<div class="follow-btns">' +
      '<a class="follow-btn yt" href="' + YT + '" target="_blank" rel="noopener">' +
      '<span class="fb-ico">▶</span> Subscribe on YouTube' + ytBadge + '</a>' +
      '<a class="follow-btn tw" href="' + TW + '" target="_blank" rel="noopener">' +
      '<span class="fb-ico">🎮</span> Follow on Twitch' + twBadge + '</a>' +
      '<a class="follow-btn dc" href="' + DC + '" target="_blank" rel="noopener">' +
      '<span class="fb-ico">💬</span> Join Discord</a>' +
      '</div>' +
      '</div>';

    hosts.forEach(function (h) { h.innerHTML = html; });
  }

  // Determine path prefix (root vs builds/ subfolder)
  var base = '';
  var scripts = document.querySelectorAll('script[src]');
  scripts.forEach(function(s) {
    if (s.src && s.src.indexOf('follow.js') !== -1) {
      var m = s.src.match(/^(.*assets\/)/);
      if (m) base = m[1].replace('assets/', '');
    }
  });

  // Render immediately without counts (no layout shift), then update
  render(null, null);

  fetch(base + 'data/live.json', { cache: 'no-store' })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) {
      if (!d) return;
      var tw = fmtCount(d.twitchFollowers);
      var yt = fmtCount(d.youtubeSubscribers);
      render(tw, yt);
    })
    .catch(function() { /* offline - buttons still work, counts just hidden */ });
})();
