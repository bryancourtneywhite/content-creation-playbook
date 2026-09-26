/* ------------------------------------------------------------------
   Shared privacy-friendly analytics for Ashura Whole Heavens.

   Uses Cloudflare Web Analytics — free, cookieless, no consent banner
   required, and it does NOT slow the page (beacon loads async/defer).

   ── ONE-TIME SETUP ────────────────────────────────────────────────
   1. Go to https://dash.cloudflare.com/ → Analytics & Logs →
      Web Analytics → "Add a site".
   2. Enter: solashur.com  (you do NOT need Cloudflare to host the DNS;
      the "manual" / JS-beacon option works on GitHub Pages).
   3. Cloudflare gives you a token that looks like:
         <script ... data-cf-beacon='{"token": "abcd1234...."}'></script>
      Copy JUST the token string (the part in "token": "___").
   4. Paste it into CF_TOKEN below. Done — every page reports instantly.

   Until a token is set, this script no-ops (site works normally, just
   no data collected). Nothing to remove later.

   Optional: to use Plausible instead, set PLAUSIBLE_DOMAIN and it will
   load Plausible rather than Cloudflare.
   ------------------------------------------------------------------ */
(function () {
  // ▼▼▼ SET ONE OF THESE (leave the other blank) ▼▼▼
  var CF_TOKEN = '';                 // Cloudflare Web Analytics token
  var PLAUSIBLE_DOMAIN = '';         // e.g. 'solashur.com' (only if using Plausible)
  // ▲▲▲

  function loadCloudflare(token) {
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: token }));
    document.head.appendChild(s);
  }

  function loadPlausible(domain) {
    var s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', domain);
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
  }

  if (CF_TOKEN) {
    loadCloudflare(CF_TOKEN);
  } else if (PLAUSIBLE_DOMAIN) {
    loadPlausible(PLAUSIBLE_DOMAIN);
  }
  // else: no analytics configured yet — no-op.
})();
