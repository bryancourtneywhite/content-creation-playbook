/* ============================================================================
   profile-chip.js — sitewide profile widget in the top-right of the nav.
   Mounts into #nav-profile (rendered by nav.js). Shows:
     • logged out -> a "Sign in" button (-> profile.html)
     • logged in  -> avatar + alias + Sol, with a dropdown (profile, leaderboard,
                     quick check-in, customize, log out)
   Requires supabase-js + sol.js to be loaded for the live data. If Sol isn't
   present on a page, it degrades to a simple "Sign in" link so the nav never
   breaks.
   Load AFTER nav.js (and, ideally, sol.js) on every page:
     <script src="assets/profile-chip.js"></script>
   ============================================================================ */
(function () {
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  // Resolve relative links the same way nav.js does (subfolder depth).
  var deep = /\/(builds|lore)\//.test(location.pathname);
  var B = deep ? '../' : '';
  function href(p){ return B + p; }

  function render() {
    var mount = document.getElementById('nav-profile');
    if (!mount) return;

    // No Sol helper on this page -> minimal sign-in link (never break the nav).
    if (!window.Sol) {
      mount.innerHTML = '<a class="np-signin" href="' + href('profile.html') + '">Sign in</a>';
      return;
    }

    // Draw the logged-out state first; upgrade to logged-in if a session exists.
    drawLoggedOut(mount);
    Sol.getSession().then(function (s) {
      if (s) drawLoggedIn(mount);
      else drawLoggedOut(mount);
    });
    // Keep it in sync with auth changes across the site.
    Sol.onAuthChange(function (s) {
      if (s) drawLoggedIn(mount); else drawLoggedOut(mount);
    });
  }

  function drawLoggedOut(mount) {
    mount.innerHTML =
      '<a class="np-signin" href="' + href('profile.html') + '">' +
        '<span class="np-spark">🌀</span> Sign in' +
      '</a>';
  }

  function drawLoggedIn(mount) {
    // Fetch profile + summary in parallel, then paint the chip + dropdown.
    Promise.all([Sol.myProfile(), Sol.mySummary()]).then(function (res) {
      var p = res[0] || {}, m = res[1] || {};
      var info = Sol.roleInfo(m.role || p.role || 'shinigami');
      var alias = p.alias || m.alias || 'Set your alias';
      var sols = (m.sols != null ? m.sols : 0);
      var avatar = '<img class="np-avatar" src="' + esc(Sol.avatarFor(p.avatar_url)) + '" alt="">';

      mount.innerHTML =
        '<div class="np-chip" id="np-chip" tabindex="0" aria-haspopup="true" aria-expanded="false">' +
          avatar +
          '<span class="np-meta">' +
            '<span class="np-alias">' + esc(alias) + '</span>' +
            '<span class="np-rank" style="color:' + info.color + '">' + info.icon + ' ' + esc(info.label) + '</span>' +
          '</span>' +
          '<span class="np-sol">' + sols.toLocaleString() + '<small>SOL</small></span>' +
          '<span class="np-caret">▾</span>' +
        '</div>' +
        '<div class="np-menu" id="np-menu">' +
          '<div class="np-menu-head">' +
            avatar.replace('np-avatar', 'np-avatar np-menu-avatar') +
            '<div><div class="np-alias">' + esc(alias) + '</div>' +
            '<div class="np-rank" style="color:' + info.color + '">' + info.icon + ' ' + esc(info.label) +
              (m.rank_pos ? ' · #' + m.rank_pos : '') + '</div></div>' +
          '</div>' +
          '<button class="np-item" id="np-checkin">⚡ Quick Check-In</button>' +
          '<a class="np-item" href="' + href('profile.html') + '">🎨 Customize Profile</a>' +
          '<a class="np-item" href="' + href('leaderboard.html') + '">🏆 Leaderboard</a>' +
          '<button class="np-item np-danger" id="np-logout">↩ Log out</button>' +
          '<div class="np-checknote" id="np-checknote"></div>' +
        '</div>';

      wireMenu();
    });
  }

  function wireMenu() {
    var chip = document.getElementById('np-chip');
    var menu = document.getElementById('np-menu');
    if (!chip || !menu) return;

    function open(o) {
      menu.classList.toggle('open', o);
      chip.setAttribute('aria-expanded', o ? 'true' : 'false');
    }
    chip.addEventListener('click', function (e) { e.stopPropagation(); open(!menu.classList.contains('open')); });
    chip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(!menu.classList.contains('open')); } });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target) && e.target !== chip) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });

    var logout = document.getElementById('np-logout');
    if (logout) logout.addEventListener('click', function () { Sol.logout(); });

    var checkin = document.getElementById('np-checkin');
    var note = document.getElementById('np-checknote');
    if (checkin) checkin.addEventListener('click', function () {
      checkin.disabled = true; note.textContent = 'Absorbing Sol…'; note.style.display = 'block';
      Sol.checkIn().then(function (r) {
        if (r && r.ok) {
          note.textContent = '+' + r.awarded + ' Sol! Streak x' + r.streak + (r.rankedUp ? ' — RANK UP! 🎉' : '');
          // repaint the chip totals after a beat
          setTimeout(function () { render(); }, 1400);
        } else if (r && r.reason === 'cooldown') {
          note.textContent = 'Come back in ~' + r.hoursLeft + 'h ⏳';
          checkin.disabled = false;
        } else {
          note.textContent = 'Try again in a moment.'; checkin.disabled = false;
        }
      }).catch(function (e) { note.textContent = 'Error: ' + e.message; checkin.disabled = false; });
    });
  }

  // Render, but if Sol isn't loaded yet (it may be included lower in the page),
  // keep retrying briefly so the chip upgrades from "Sign in" to the live chip
  // as soon as the Sol helper is available.
  var tries = 0;
  function renderWhenReady() {
    render();
    if (!window.Sol && tries < 40) {   // up to ~4s of 100ms polls
      tries++;
      setTimeout(renderWhenReady, 100);
    }
  }

  // nav.js fires this when the nav (and #nav-profile) exists.
  window.addEventListener('aws-nav-ready', renderWhenReady);
  if (document.readyState !== 'loading' && document.getElementById('nav-profile')) {
    renderWhenReady();
  }
})();
