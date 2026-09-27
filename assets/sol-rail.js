/* ============================================================================
   sol-rail.js — sitewide floating "Sol rail" to drive sign-ins + check-ins.
   A compact bottom-left card: top 3 souls + a context CTA (Sign in / Check in).
   • Dismissible -> collapses to a small "🏆 Sol" tab (remembers the choice).
   • Auto-hides on the leaderboard/profile pages (already the main event there).
   • Requires supabase-js + sol.js (already loaded sitewide). Degrades silently.
   Load after sol.js on every page.
   ============================================================================ */
(function () {
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var deep = /\/(builds|lore)\//.test(location.pathname);
  var B = deep ? '../' : '';
  var href = function (p) { return B + p; };

  // Don't show on pages where the leaderboard is already the focus.
  var path = location.pathname.toLowerCase();
  if (/leaderboard\.html|profile\.html/.test(path)) return;
  if (!window.Sol) return;

  var COLLAPSED_KEY = 'sol-rail-collapsed';

  var el = document.createElement('div');
  el.id = 'sol-rail';
  el.className = 'sol-rail' + (localStorage.getItem(COLLAPSED_KEY) === '1' ? ' collapsed' : '');
  document.body.appendChild(el);

  function collapsedTab() {
    return '<button class="sr-tab" id="sr-open" aria-label="Open Sol leaderboard">🏆 <span>Sol</span></button>';
  }

  function card(top, cta) {
    var rows = top.map(function (r, i) {
      var info = Sol.roleInfo(r.role);
      var medal = ['🥇','🥈','🥉'][i] || ('#' + r.position);
      var avatar = '<img class="sr-av" src="' + esc(Sol.avatarFor(r.avatar_url)) + '" alt="">';
      return '<li><span class="sr-pos">' + medal + '</span>' + avatar +
        '<span class="sr-name">' + esc(Sol.displayName(r.alias)) + '</span>' +
        '<span class="sr-sol">' + (r.sols||0).toLocaleString() + '</span></li>';
    }).join('');
    return '<button class="sr-x" id="sr-close" aria-label="Dismiss">✕</button>' +
      '<div class="sr-head">🏆 Sol Leaderboard</div>' +
      '<ol class="sr-list">' + (rows || '<li class="sr-empty">Be the first to rank.</li>') + '</ol>' +
      cta;
  }

  function render() {
    if (el.classList.contains('collapsed')) { el.innerHTML = collapsedTab(); wire(); return; }
    Sol.fetchLeaderboard(3).then(function (top) {
      Sol.getSession().then(function (s) {
        var cta;
        if (s) {
          cta = '<button class="sr-cta" id="sr-checkin">⚡ Check In &amp; Earn Sol</button>' +
                '<div class="sr-note" id="sr-note"></div>';
        } else {
          cta = '<a class="sr-cta" href="' + href('profile.html') + '">🌀 Sign in &amp; Join</a>' +
                '<div class="sr-sub">Earn Sol. Climb the ranks.</div>';
        }
        el.innerHTML = card(top, cta);
        wire();
      });
    }).catch(function(){ /* silent */ });
  }

  function wire() {
    var close = document.getElementById('sr-close');
    if (close) close.onclick = function () {
      el.classList.add('collapsed'); localStorage.setItem(COLLAPSED_KEY, '1'); render();
    };
    var open = document.getElementById('sr-open');
    if (open) open.onclick = function () {
      el.classList.remove('collapsed'); localStorage.removeItem(COLLAPSED_KEY); render();
    };
    var chk = document.getElementById('sr-checkin');
    if (chk) chk.onclick = function () {
      var note = document.getElementById('sr-note'); chk.disabled = true; note.textContent = 'Absorbing Sol…';
      Sol.checkIn().then(function (r) {
        if (r && r.ok) { note.textContent = '+' + r.awarded + ' Sol!' + (r.rankedUp ? ' RANK UP! 🎉' : '');
          setTimeout(render, 1400); }
        else if (r && r.reason === 'cooldown') { note.textContent = 'Back in ~' + r.hoursLeft + 'h ⏳'; chk.disabled = false; }
        else { note.textContent = 'Try again soon.'; chk.disabled = false; }
      }).catch(function(e){ note.textContent = 'Error'; chk.disabled = false; });
    };
  }

  // Show after a short delay so it doesn't fight the page load / intro.
  setTimeout(render, 1200);
  if (window.Sol && Sol.onAuthChange) Sol.onAuthChange(function(){ if (!el.classList.contains('collapsed')) render(); });
})();
