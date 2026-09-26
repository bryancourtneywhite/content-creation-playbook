/* ------------------------------------------------------------------
   Follow / Subscribe call-to-action bar for Ashura Whole Heavens.

   Renders prominent YouTube "Subscribe" + Twitch "Follow" buttons (plus
   Discord "Join") into any <div data-follow></div>. Drop that div wherever
   you want the CTA — typically just above the footer on every page.

   - YouTube link uses ?sub_confirmation=1 so it opens the subscribe prompt.
   - Twitch link opens the channel where the Follow button lives.
   - Uses SFX/nav styles already on the site; no extra config needed.
   ------------------------------------------------------------------ */
(function () {
  var hosts = document.querySelectorAll('[data-follow]');
  if (!hosts.length) return;

  var YT = 'https://www.youtube.com/@SolAshur?sub_confirmation=1';
  var TW = 'https://www.twitch.tv/solashur';
  var DC = 'https://discord.gg/rTD6qxUcmG';

  var html =
    '<div class="follow-cta">' +
      '<div class="follow-head">' +
        '<span class="follow-title">Join the Ascension</span>' +
        '<span class="follow-sub">New AION 2 builds, guides &amp; live PvP every week — don\'t miss a drop.</span>' +
      '</div>' +
      '<div class="follow-btns">' +
        '<a class="follow-btn yt" href="' + YT + '" target="_blank" rel="noopener">' +
          '<span class="fb-ico">▶</span> Subscribe on YouTube</a>' +
        '<a class="follow-btn tw" href="' + TW + '" target="_blank" rel="noopener">' +
          '<span class="fb-ico">🎮</span> Follow on Twitch</a>' +
        '<a class="follow-btn dc" href="' + DC + '" target="_blank" rel="noopener">' +
          '<span class="fb-ico">💬</span> Join Discord</a>' +
      '</div>' +
    '</div>';

  hosts.forEach(function (h) { h.innerHTML = html; });
})();
