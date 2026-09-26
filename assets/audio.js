/* ------------------------------------------------------------------
   Ambient soundtrack + UI sound effects for Ashura Whole Heavens.

   MUSIC — hosted by YouTube (not this domain) to minimize legal risk.
     The background track is a hidden YouTube IFrame player. YouTube hosts
     the audio, so any copyright enforcement lands on YouTube (the video
     breaks on their side) rather than triggering a DMCA takedown of
     solashur.com. Swap the track by changing YT_VIDEO_ID below.

   - Starts on a USER GESTURE (intro "Enter" event, or first click/tap) —
     browsers block autoplay-with-sound until then.
   - Floating 🔊 / 🔇 toggle mutes BOTH music and SFX; choice persists via
     localStorage so it never nags across pages.
   - Cross-page continuity: playback position is saved to localStorage every
     second and on unload; the next page seeks to that spot (advanced by the
     nav gap) so the track resumes rather than restarts. Volume fades IN on
     start and fades OUT on internal navigation to avoid abrupt clipping.

   SFX — PlayStation-style click + intro warp are ORIGINAL synthesized
     sounds hosted here (assets/click.mp3, assets/warp.mp3). No copyright
     risk, so they stay self-hosted for instant, reliable playback.
   ------------------------------------------------------------------ */
(function () {
  var inBuilds = location.pathname.indexOf('/builds/') !== -1;
  var BASE = inBuilds ? '../assets/' : 'assets/';
  var CLICK = BASE + 'click.mp3';

  // ▼ Background track — a YouTube video ID (YouTube hosts it, not us).
  var YT_VIDEO_ID = 'mvhqe_eLLh0';   // "Bleach Battle Music / OST Mix - V2"
  var YT_START = 0;                   // start seconds into the track
  var VOLUME = 22;                    // YouTube volume is 0–100 (gentle bg level)
  var SFX_VOLUME = 0.5;

  var MUTE_KEY = 'aws-audio-muted';
  var POS_KEY  = 'aws-audio-pos';      // last playback time (seconds)
  var TS_KEY   = 'aws-audio-ts';       // wall-clock ms of last save
  var PLAY_KEY = 'aws-audio-playing';  // was it playing when we left?
  function setItem(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getNum(k) { try { return parseFloat(localStorage.getItem(k)); } catch (e) { return NaN; } }
  function isMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } }
  function setMutedPref(m) { setItem(MUTE_KEY, m ? '1' : '0'); }
  function wasPlaying() { try { return localStorage.getItem(PLAY_KEY) === '1'; } catch (e) { return false; } }

  /* ---------------- MUSIC (hidden YouTube player) ---------------- */
  var player = null, playerReady = false, started = false, wantPlay = false;
  var btnRef = null;
  var LOOP_LEN = 0;                    // track duration, learned once ready

  // Where the track "should" resume, accounting for the brief navigation gap
  // so it feels continuous across page loads rather than restarting.
  function resumeTime() {
    var pos = getNum(POS_KEY);
    if (isNaN(pos) || pos < 0) return YT_START;
    var ts = getNum(TS_KEY);
    var elapsed = (!isNaN(ts)) ? (Date.now() - ts) / 1000 : 0;
    if (elapsed < 0 || elapsed > 8) elapsed = 0;   // ignore long gaps (tab left open)
    var t = pos + elapsed;
    if (LOOP_LEN > 0) t = t % LOOP_LEN;             // wrap within the loop
    return t;
  }

  function savePosition() {
    try {
      if (playerReady && isPlaying()) {
        var t = player.getCurrentTime();
        if (isFinite(t)) { setItem(POS_KEY, t.toFixed(2)); setItem(TS_KEY, Date.now()); setItem(PLAY_KEY, '1'); }
      }
    } catch (e) {}
  }

  // Smooth volume ramp (YouTube volume is 0–100).
  var fadeTimer = null, curVol = 0;
  function fadeTo(target, ms, done) {
    if (!playerReady) { try { player.setVolume(target); } catch (e) {} curVol = target; if (done) done(); return; }
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
    var steps = Math.max(1, Math.round(ms / 40));
    var from = curVol;
    var delta = (target - from) / steps;
    var i = 0;
    fadeTimer = setInterval(function () {
      i++;
      curVol = Math.max(0, Math.min(100, from + delta * i));
      try { player.setVolume(curVol); } catch (e) {}
      if (i >= steps) {
        clearInterval(fadeTimer); fadeTimer = null;
        curVol = Math.max(0, Math.min(100, target));
        try { player.setVolume(curVol); } catch (e) {}
        if (done) done();
      }
    }, 40);
  }

  // Inject the YouTube IFrame API script once.
  function loadYT() {
    if (window.YT && window.YT.Player) { onYTReady(); return; }
    if (!document.getElementById('yt-iframe-api')) {
      var s = document.createElement('script');
      s.id = 'yt-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') { try { prev(); } catch (e) {} }
      onYTReady();
    };
  }

  function onYTReady() {
    if (player) return;
    var host = document.createElement('div');
    host.id = 'yt-audio-host';
    // Keep it in the DOM (some browsers won't play a display:none iframe),
    // but push it far off-screen and tiny so it's invisible/inaudible-visually.
    host.style.cssText = 'position:fixed;left:-9999px;bottom:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    var mount = document.createElement('div');
    mount.id = 'yt-audio-player';
    host.appendChild(mount);
    document.body.appendChild(host);

    player = new YT.Player('yt-audio-player', {
      videoId: YT_VIDEO_ID,
      playerVars: {
        autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1,
        loop: 1, playlist: YT_VIDEO_ID, start: YT_START, playsinline: 1, rel: 0
      },
      events: {
        onReady: function () {
          playerReady = true;
          try {
            var dur = player.getDuration();
            if (isFinite(dur) && dur > 0) LOOP_LEN = dur;
          } catch (e) {}
          // Resume from where we left off on the previous page.
          try { player.seekTo(resumeTime(), true); } catch (e) {}
          curVol = 0;
          try { player.setVolume(0); } catch (e) {}   // start silent, fade in
          if (wantPlay && !isMuted()) doPlay();
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.PLAYING) { started = true; updateBtn(btnRef, true); }
          else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) { updateBtn(btnRef, false); }
        }
      }
    });
  }

  function doPlay() {
    if (!playerReady) { wantPlay = true; return; }
    try {
      player.setVolume(0); curVol = 0;   // ensure we start from silence
      player.playVideo();
      fadeTo(VOLUME, 700);               // fade IN
    } catch (e) {}
  }
  function doPause() {
    if (!playerReady) { try { player.pauseVideo(); } catch (e2) {} wantPlay = false; return; }
    // fade OUT, then pause
    fadeTo(0, 350, function () { try { player.pauseVideo(); } catch (e) {} });
  }
  function isPlaying() {
    try { return playerReady && player.getPlayerState && player.getPlayerState() === 1; } catch (e) { return false; }
  }

  function startPlayback() {
    if (isMuted()) return;
    wantPlay = true;
    doPlay();
  }

  /* ---------------- Intro warp SFX (original, self-hosted) ---------------- */
  var warp = new Audio(BASE + 'warp.mp3');
  warp.preload = 'auto';
  warp.volume = 0.6;
  var warpPlayed = false;
  function playWarp() {
    if (warpPlayed || isMuted()) return;
    warpPlayed = true;
    try { warp.currentTime = 0; warp.play().catch(function () {}); } catch (e) {}
  }

  /* ---------------- SFX (click tick, original, self-hosted) ---------------- */
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
  var SFX_SELECTOR = 'a, button, .build-card, .l3d-node[data-video], .platform-tab, .tier-chip, .guide-toc a, .thumb-card, .sponsor-banner, .tool';
  function wireSfx() {
    document.addEventListener('pointerdown', function (e) {
      var t = e.target && e.target.closest ? e.target.closest(SFX_SELECTOR) : null;
      if (!t) return;
      if (t.id === 'audio-toggle') return;
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
    if (playing) btn.classList.remove('needs-start');
  }
  function buildButton() {
    if (document.getElementById('audio-toggle')) return document.getElementById('audio-toggle');
    var btn = document.createElement('button');
    btn.id = 'audio-toggle';
    btn.className = 'audio-toggle';
    btn.type = 'button';
    updateBtn(btn, false);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!isPlaying()) {
        setMutedPref(false);
        startPlayback();
        updateBtn(btn, true);
      } else {
        doPause();
        setMutedPref(true);
        updateBtn(btn, false);
      }
    });
    document.body.appendChild(btn);
    return btn;
  }

  /* ---------------- Init ---------------- */
  function init() {
    var btn = buildButton();
    btnRef = btn;
    initSfx();
    wireSfx();
    loadYT();

    // Show the "tap for sound" prompt until playback actually begins
    // (browsers block autoplay-with-sound until a user gesture).
    if (!isMuted()) {
      startPlayback();   // will play the moment the player is ready IF allowed
      setTimeout(function () {
        if (!isPlaying()) btn.classList.add('needs-start');
      }, 1200);
    }

    // Intro interaction → start music + layer the warp SFX.
    var introActive = false;
    window.addEventListener('aws-intro-start', function () { introActive = true; });
    window.addEventListener('aws-enter', function () {
      var fresh = !isPlaying();
      startPlayback();
      if (introActive && fresh) playWarp();
      updateBtn(btn, true);
    });

    // Fallback: first interaction anywhere (pages without the intro).
    function firstGesture() {
      startPlayback();
      window.removeEventListener('pointerdown', firstGesture);
      window.removeEventListener('keydown', firstGesture);
    }
    if (!isMuted()) {
      window.addEventListener('pointerdown', firstGesture);
      window.addEventListener('keydown', firstGesture);
    }

    // Persist playback position continuously + right before leaving, so the
    // next page can resume from the same spot (cross-page continuity).
    setInterval(savePosition, 1000);
    window.addEventListener('pagehide', savePosition);
    window.addEventListener('beforeunload', savePosition);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') savePosition();
    });

    // Soft fade-out on internal navigation (avoids the abrupt audio clip on
    // page unload). Hold the click briefly, ramp volume to 0, save position,
    // then navigate.
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var tgt = a.getAttribute('target');
      if (tgt === '_blank' || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (er) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same-page anchor
      if (!isPlaying()) return;              // nothing playing → nothing to fade

      e.preventDefault();
      savePosition();
      var navigated = false;
      function go() { if (navigated) return; navigated = true; window.location.href = a.href; }
      fadeTo(0, 220, go);
      setTimeout(go, 300);                   // safety: navigate even if fade callback lags
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
