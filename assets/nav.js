/* ------------------------------------------------------------------
   Shared site navigation for Ashura Whole Heavens — ONE source of truth.
   Renders a game-menu style nav with dropdowns into <nav id="site-nav">.
   Every page just needs: <nav id="site-nav" data-active="builds"></nav>
   and this script. Change the menu here → it updates everywhere.

   - Auto-resolves relative paths by depth: pages in /builds/ or /lore/
     get a "../" prefix so links work from subfolders.
   - data-active on the <nav> highlights the current top-level item.
   - Desktop: hover opens dropdowns. Mobile: hamburger → accordion.
   - Pairs with theme.js (injects the theme toggle) + the .nav-burger CSS.
   ------------------------------------------------------------------ */
(function () {
  // Depth prefix: /builds/x.html and /lore/x.html are one level deep.
  var p = location.pathname;
  var deep = /\/(builds|lore)\//.test(p);
  var B = deep ? '../' : '';

  // Menu model. `id` matches data-active values for highlighting.
  var MENU = [
    { id: 'home', label: 'Home', href: 'index.html' },
    { id: 'aion2', label: 'AION 2', children: [
      { label: "Player's Guide", href: 'builds.html' },
      { label: 'Classes',        href: 'classes.html' },
      { label: 'Builds',         href: 'questlog.html' },
      { label: 'Guides',         href: 'guides.html' },
      { label: 'Tier List',      href: 'tiers.html' }
    ]},
    { id: 'lore', label: 'Lore', href: 'lore.html', children: [
      { label: 'Lore Hub',                 href: 'lore.html' },
      { label: 'The Story of AION',        href: 'lore/aion-story-explained.html' },
      { label: 'Elyos vs Asmodian',        href: 'lore/elyos-vs-asmodian.html' },
      { label: 'Balaur & Dragon Lords',    href: 'lore/balaur-dragon-lords.html' },
      { label: 'Daevas & Ascension',       href: 'lore/daevas-and-ascension.html' },
      { label: 'AION 2 vs AION 1',         href: 'lore/aion-2-vs-aion-1.html' }
    ]},
    { id: 'watch', label: 'Watch', href: 'watch.html', children: [
      { label: 'Watch / Live', href: 'watch.html' },
      { label: 'YouTube', href: 'https://www.youtube.com/@SolAshur', ext: true },
      { label: 'Twitch',  href: 'https://www.twitch.tv/solashur', ext: true },
      { label: 'Discord', href: 'https://discord.gg/rTD6qxUcmG', ext: true }
    ]},
    { id: 'sponsors', label: 'Sponsors', href: 'optimize.html', highlight: true },
    { id: 'misc', label: 'MISC', children: [
      { label: 'Hardware',  href: 'hardware.html' },
      { label: 'Media Kit', href: 'media-kit.html' },
      { label: 'Playbook',  href: 'playbook.html' }
    ]}
  ];

  function url(href, ext) {
    if (ext || /^https?:/.test(href)) return href;
    return B + href;
  }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var nav = document.getElementById('site-nav');
  if (!nav) return;
  var active = nav.getAttribute('data-active') || '';

  var html = '<a class="brand" href="' + url('index.html') + '"><span class="sp">🌀</span> Ashura Whole Heavens</a>';
  html += '<div class="links">';

  MENU.forEach(function (item) {
    var isActive = item.id === active ? ' active' : '';
    if (item.children) {
      html += '<div class="nav-group' + isActive + (item.highlight ? ' nav-hot' : '') + '">';
      // top-level: links to its href if it has one, else acts as a menu label
      if (item.href) {
        html += '<a class="nav-top" href="' + url(item.href) + '">' + esc(item.label) + ' <span class="nav-caret">▾</span></a>';
      } else {
        html += '<button class="nav-top" type="button" aria-haspopup="true" aria-expanded="false">' + esc(item.label) + ' <span class="nav-caret">▾</span></button>';
      }
      html += '<div class="nav-drop">';
      item.children.forEach(function (c) {
        html += '<a href="' + url(c.href, c.ext) + '"' + (c.ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(c.label) + (c.ext ? ' <span class="ext-arrow">↗</span>' : '') + '</a>';
      });
      html += '</div></div>';
    } else {
      html += '<a class="nav-top nav-solo' + isActive + (item.highlight ? ' nav-hot' : '') + '" href="' + url(item.href) + '">' + esc(item.label) + '</a>';
    }
  });

  html += '</div>';
  nav.className = 'site-nav';
  nav.innerHTML = html;

  // Tell theme.js the nav exists now so it can inject the theme toggle +
  // hamburger into it (nav.js may run after theme.js's initial pass).
  window.dispatchEvent(new Event('aws-nav-ready'));

  /* ---- Interactions ---- */
  // Mobile accordion: tapping a group's top button toggles its dropdown.
  nav.querySelectorAll('.nav-group').forEach(function (g) {
    var top = g.querySelector('.nav-top');
    // On mobile, a top-level LINK with children should open the submenu on
    // first tap instead of navigating. We detect small screens at click time.
    top.addEventListener('click', function (e) {
      if (window.matchMedia('(max-width: 820px)').matches) {
        // let the caret behave as an accordion toggle
        if (top.tagName === 'A') {
          // first tap opens; if already open, allow navigation
          if (!g.classList.contains('open')) { e.preventDefault(); }
        } else {
          e.preventDefault();
        }
        nav.querySelectorAll('.nav-group.open').forEach(function (o) { if (o !== g) o.classList.remove('open'); });
        g.classList.toggle('open');
      }
    });
  });
})();
