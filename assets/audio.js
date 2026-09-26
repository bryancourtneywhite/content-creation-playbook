/* ------------------------------------------------------------------
   Ambient soundtrack + UI sound effects for Ashura Whole Heavens.

   MUSIC — near-continuous across page navigations (Option A):
     A multi-page site does a full reload on every navigation, which
     kills any playing audio. We can't prevent that, but we make it
     seamless: the track's playback position + playing state are saved
     to localStorage continuously, and the next page RESUMES from that
     exact timestamp the moment it loads (autoplay allowed once the user
     has interacted). Result: the music appears to continue rather than
     restart, with only a sub-second load gap.

   - Starts on a USER GESTURE (intro "Enter" event, or first click/tap).
   - Floating 🔊 / 🔇 toggle mutes BOTH music and SFX; choice persists.

   SFX — PlayStation-style click on interactive elements:
     A short assets/click.mp3 plays on nav links, buttons, and cards.
     Uses a tiny pool of cloned audio nodes so rapid clicks overlap
     cleanly. Respects the same mute toggle.

   Swap tracks any time: replace assets/intro-theme.mp3 / assets/click.mp3.
   ------------------------------------------------------------------ */
(function () {
  var inBuilds = location.pathname.indexOf('/builds/') !== -1;
  var BASE = inBuilds ? '../assets/' : 'assets/';
  var TRACK = BASE + 'intro-theme.mp3';
  var CLICK = BASE + 'click.mp3';

  var MUTE_KEY  = 'aws-audio-muted';
  var POS_KEY   = 'aws-audio-pos';     // last playback time (seconds)
  var PLAY_KEY  = 'aws-audio-playing'; // was it playing when we left?
  var TS_KEY    = 'aws-audio-ts';      // wall-clock timestamp of last save
  var VOLUME = 0.35;
  var SFX_VOLUME = 0.5;

  function getNum(k) { try { return parseFloat(localStorage.getItem(k)); } catch (e) { return NaN; } }
  function setItem(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function isMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } }
  function setMutedPref(m) { setItem(MUTE_KEY, m ? '1' : '0'); }
  function wasPlaying() { try { return localStorage.getItem(PLAY_KEY) === '1'; } catch (e) { return false; } }

  /* ---------------- MUSIC ---------------- */
  var audio = new Audio(TRACK);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = VOLUME;

  var LOOP_LEN = 180; // seconds (matches the 3-min clip); refined once metadata loads
  audio.addEventListener('loadedmetadata', function () {
    if (isFinite(audio.duration) && audio.duration > 0) LOOP_LEN = audio.duration;
  });

  // Compute where the track "should" be now, accounting for time spent
  // navigating (so it truly feels continuous, not frozen at the cut).
  function resumeTime() {
    var pos = getNum(POS_KEY);
    if (isNaN(pos)) return 0;
    var ts = getNum(TS_KEY);
    var elapsed = (!isNaN(ts)) ? (Date.now() - ts) / 1000 : 0;
    // Only advance for a brief, sane navigation gap (avoid huge jumps after
    // the user was away for minutes on another tab).
    if (elapsed < 0 || elapsed > 8) elapsed = 0;
    return (pos + elapsed) % LOOP_LEN;
  }

  function savePosition() {
    if (!audio.paused && isFinite(audio.currentTime)) {
      setItem(POS_KEY, audio.currentTime.toFixed(2));
      setItem(TS_KEY, Date.now());
      setItem(PLAY_KEY, '1');
    }
  }

  // Smoothly ramp the music volume to a target over `ms` milliseconds.
  var fadeTimer = null;
  function fadeTo(target, ms, done) {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
    var steps = Math.max(1, Math.round(ms / 25));
    var from = audio.volume;
    var delta = (target - from) / steps;
    var i = 0;
    fadeTimer = setInterval(function () {
      i++;
      var v = from + delta * i;
      audio.volume = Math.min(1, Math.max(0, v));
      if (i >= steps) {
        clearInterval(fadeTimer); fadeTimer = null;
        audio.volume = Math.min(1, Math.max(0, target));
        if (done) done();
      }
    }, 25);
  }

  var started = false;
  function startPlayback() {
    if (started || isMuted()) return;
    started = true;
    try { audio.currentTime = resumeTime(); } catch (e) {}
    audio.volume = 0;                       // start silent, fade in
    var p = audio.play();
    if (p && p.then) {
      p.then(function () { fadeTo(VOLUME, 450); }).catch(function () { started = false; audio.volume = VOLUME; });
    } else {
      audio.volume = VOLUME;
    }
  }

  /* ---------------- Intro warp SFX ---------------- */
  var warp = new Audio(BASE + 'warp.mp3');
  warp.preload = 'auto';
  warp.volume = 0.6;
  var warpPlayed = false;
  function playWarp() {
    if (warpPlayed || isMuted()) return;
    warpPlayed = true;
    try { warp.currentTime = 0; warp.play().catch(function () {}); } catch (e) {}
  }

  /* ---------------- SFX (click tick) ---------------- */
  var sfxPool = [], POOL = 4, poolIdx = 0, sfxReady = false;
  function initSfx() {
    for (var i = 0; i < POOL; i++) {
      var a = new Audio(CLICK);
      a.preload = 'auto';
      a.volume = SFX_VOLUME;
      sfxPool.push(a);
    }
    sfxReady = true;
  }
  function playClick() {
    if (isMuted() || !sfxReady) return;
    var a = sfxPool[poolIdx];
    poolIdx = (poolIdx + 1) % POOL;
    try { a.currentTime = 0; a.play().catch(function () {}); } catch (e) {}
  }

  // Elements that should tick when clicked.
  var SFX_SELECTOR = 'a, button, .build-card, .l3d-node[data-video], .platform-tab, .tier-chip, .guide-toc a, .thumb-card, .sponsor-banner, .tool';
  function wireSfx() {
    document.addEventListener('pointerdown', function (e) {
      var t = e.target && e.target.closest ? e.target.closest(SFX_SELECTOR) : null;
      if (!t) return;
      if (t.id === 'audio-toggle') return; // toggle has its own behavior
      playClick();
    }, true);
  }

  /* ---------------- Toggle button ---------------- */
  function updateBtn(btn, playing) {
    if (!btn) return;
    btn.textContent = playing ? '🔊' : '🔇';
    btn.setAttribute('aria-label', playing ? 'Mute audio' : 'Play audio');
    btn.classList.toggle('is-muted', !playing);
    btn.classList.toggle('is-playing', !!playing);
    // Once audio is actually playing, drop the "tap for sound" prompt.
    if (playing) btn.classList.remove('needs-start');
  }
  function buildButton() {
    if (document.getElementById('audio-toggle')) return document.getElementById('audio-toggle');
    var btn = document.createElement('button');
    btn.id = 'audio-toggle';
    btn.className = 'audio-toggle';
    btn.type = 'button';
    updateBtn(btn, !isMuted());
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (audio.paused) {
        setMutedPref(false);
        started = true;
        try { audio.currentTime = resumeTime(); } catch (er) {}
        audio.play().catch(function () {});
        updateBtn(btn, true);
      } else {
        audio.pause();
        setMutedPref(true);
        setItem(PLAY_KEY, '0');
        updateBtn(btn, false);
      }
    });
    document.body.appendChild(btn);
    return btn;
  }

  /* ---------------- Init ---------------- */
  function init() {
    var btn = buildButton();
    initSfx();
    wireSfx();

    // Try to start immediately. If the user was playing on a previous page
    // (or the browser allows it), music resumes with no click needed.
    // Otherwise, show an obvious "tap for sound" prompt on the button.
    function showPrompt() {
      if (!isMuted() && audio.paused) btn.classList.add('needs-start');
    }
    if (!isMuted()) {
      startPlayback();
      // Verify shortly after whether autoplay actually took (browsers may
      // silently reject it without a gesture) and prompt if it didn't.
      setTimeout(function () {
        if (audio.paused) { started = false; showPrompt(); }
        updateBtn(btn, !audio.paused);
      }, 350);
    }

    // Intro interaction → start the soundtrack AND layer the warp SFX.
    // 'aws-enter' fires on the first interaction with the intro overlay
    // (see intro.js), so music + warp begin together as the fly-through runs.
    var introActive = false;
    window.addEventListener('aws-intro-start', function () { introActive = true; });
    window.addEventListener('aws-enter', function () {
      var freshStart = audio.paused && !wasPlaying();
      startPlayback();
      // Only warp during the intro sequence and only when the track is
      // starting fresh (not when resuming mid-song from another page).
      if (introActive && freshStart) playWarp();
      updateBtn(btn, !audio.paused);
    });

    // Fallback: first interaction anywhere (pages without the intro).
    function firstGesture() {
      startPlayback();
      updateBtn(btn, !audio.paused);
      window.removeEventListener('pointerdown', firstGesture);
      window.removeEventListener('keydown', firstGesture);
    }
    if (!isMuted()) {
      window.addEventListener('pointerdown', firstGesture);
      window.addEventListener('keydown', firstGesture);
    }

    audio.addEventListener('pause', function () { updateBtn(btn, false); });
    audio.addEventListener('play', function () { updateBtn(btn, true); });

    // Persist position frequently + right before leaving the page.
    setInterval(savePosition, 1000);
    window.addEventListener('pagehide', savePosition);
    window.addEventListener('beforeunload', savePosition);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') savePosition();
    });

    // Soft fade-out on internal navigation to avoid the abrupt clip when the
    // page unloads. We briefly hold the click, ramp volume to 0 (~180ms),
    // save the position, then let the browser navigate.
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var target = a.getAttribute('target');
      // Only same-tab, same-origin, real page navigations.
      if (target === '_blank' || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (er) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page (anchor)
      if (audio.paused) return;              // nothing playing → nothing to fade

      e.preventDefault();
      savePosition();
      fadeTo(0, 180, function () {
        window.location.href = a.href;
      });
      // Safety: navigate anyway if the fade callback is delayed.
      setTimeout(function () { window.location.href = a.href; }, 260);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
