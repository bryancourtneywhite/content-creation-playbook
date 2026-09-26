/* ------------------------------------------------------------------
   Shared light/dark theme toggle for Ashura Whole Heavens.
   - Persists choice in localStorage ('aws-theme').
   - Applies saved theme ASAP to avoid a flash of the wrong theme.
   - Injects a floating toggle button and dispatches a 'themechange'
     event so the 3D background can recolor.
   Include this in <head> (or early) on every page.
   ------------------------------------------------------------------ */
(function () {
  var KEY = 'aws-theme';

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function apply(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Apply immediately (runs as soon as the script is parsed).
  var initial = saved() === 'light' ? 'light' : 'dark';
  apply(initial);

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function setTheme(theme) {
    apply(theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = theme === 'light' ? '🌙' : '☀️';
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
    window.dispatchEvent(new Event('themechange'));
  }

  // Build the toggle button once the DOM is ready.
  // Preferred placement: as the last item inside the nav's .links
  // (industry standard — GitHub, Vercel, docs sites). Falls back to a
  // floating button only if there is no nav on the page.
  function initButton() {
    if (document.getElementById('theme-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.type = 'button';
    var t = current();
    btn.textContent = t === 'light' ? '🌙' : '☀️';
    btn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    btn.addEventListener('click', function () {
      setTheme(current() === 'light' ? 'dark' : 'light');
    });

    var navLinks = document.querySelector('.site-nav .links');
    if (navLinks) {
      btn.className = 'theme-toggle nav-toggle';
      navLinks.appendChild(btn);
    } else {
      btn.className = 'theme-toggle';   // floating fallback
      document.body.appendChild(btn);
    }
  }

  // Mobile hamburger: collapses the nav links into a slide-down menu on
  // small screens (CSS handles the layout at <=820px; this just toggles the
  // .nav-open class). Injected on every page since the nav is shared.
  function initBurger() {
    var nav = document.querySelector('.site-nav');
    var links = nav && nav.querySelector('.links');
    if (!nav || !links || nav.querySelector('.nav-burger')) return;

    var burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Toggle menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span class="nb-lines"></span>';
    // Place the burger as the last child of the nav (sits at the right edge).
    nav.appendChild(burger);

    function setOpen(open) {
      nav.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains('nav-open'));
    });
    // Close when a nav link is tapped (but not the theme toggle).
    links.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (a) setOpen(false);
    });
    // Close when tapping outside the nav, or on Escape.
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('nav-open') && !nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  function initNav() { initButton(); initBurger(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
