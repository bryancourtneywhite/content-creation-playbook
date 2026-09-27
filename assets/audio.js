/* ------------------------------------------------------------------
   Ambient soundtrack + UI sound effects for Ashura Whole Heavens.

   MUSIC — hosted by YouTube (not this domain) to minimize legal risk.
     A hidden YouTube IFrame player streams either a single looping track
     (default: the Bleach OST) OR a full YouTube playlist that starts on the
     Bleach OST — set YT_PLAYLIST to a "PL..." id to enable playlist mode.
     Either way YouTube hosts the audio, so copyright enforcement lands on
     YouTube, not solashur.com.

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

  // ▼ Background music — hosted by YouTube (liability stays with YouTube).
  //   Default: loop the single Bleach OST video.
  //   To make it a STREAMABLE PLAYLIST: create a public YouTube playlist
  //   (Add the Bleach OST first so it plays first), copy its playlist ID
  //   (the "list=PL..." part of the URL), and paste it into YT_PLAYLIST below.
  //   The player will then stream the whole playlist, looped, starting on
  //   the Bleach OST. Set YT_SHUFFLE = true to randomize after the first track.
  //   MULTI-STATION: the listener picks a "station" from the Now Playing panel.
  //   Each station is EITHER a single looping video (`video`) OR a real
  //   YouTube playlist (`list`). All IDs verified real via YouTube oEmbed.
  var STATIONS = [
    { id: 'bleach',  name: 'Bleach OST',           video: 'mvhqe_eLLh0' },
    { id: 'aion2',   name: 'AION 2: Echoes of Eternity', list: 'PLmp6IVxzqjhG1r6j5An4rslDFOCKf7fQH' },
    { id: 'nier',    name: 'NieR: Automata OST',    video: 'cq1u2ihcWJE' },
    { id: 'kh',      name: 'Kingdom Hearts',       video: '9gUZayPkXbw' },
    { id: 'naruto',  name: 'Naruto',               video: 'WBmUZZNYxg0' },
    { id: 'tekken',  name: 'Tekken',               video: 'Dd1jwuz4exQ' },
    { id: 'tekken2', name: 'Tekken 2',             video: 'DgoBWMJ7SKI' },
    { id: 'jsrf',    name: 'Jet Set Radio Future', video: 'QEdG7hiXi50' },
    { id: 'phonk',   name: 'Viral Phonk',          video: 'XSEyhGFc8rA' }
  ];
  var STATION_KEY = 'aws-audio-station';   // remembers the listener's chosen station
  var PANEL_KEY   = 'aws-audio-panel';     // remembers if the player panel is open/minimized
  function findStation(id) {
    for (var i = 0; i < STATIONS.length; i++) { if (STATIONS[i].id === id) return STATIONS[i]; }
    return null;
  }
  function savedStation() {
    var id; try { id = localStorage.getItem(STATION_KEY); } catch (e) {}
    return findStation(id) || STATIONS[0];   // default: Bleach OST
  }
  var station = savedStation();
  var YT_VIDEO_ID = station.video || '';   // current single-track video (if any)
  var YT_PLAYLIST = station.list  || '';   // current playlist id (if any)
  var YT_SHUFFLE  = false;           // shuffle the playlist (after the first video) if true
  var YT_START = 0;                   // start seconds into the first track
  var SFX_VOLUME = 0.5;

  var MUTE_KEY = 'aws-audio-muted';
  var POS_KEY  = 'aws-audio-pos';      // last playback time (seconds)
  var TS_KEY   = 'aws-audio-ts';       // wall-clock ms of last save
  var PLAY_KEY = 'aws-audio-playing';  // was it playing when we left?
  var VOL_KEY  = 'aws-audio-vol';      // music volume (0–100)
  var RATE_KEY = 'aws-audio-rate';     // playback speed (0.5–1.5)
  var AMB_KEY  = 'aws-audio-amb';      // ambient layer levels, JSON {drone,wind,rain}

  // Music volume — a gentle default, overridable by the listener + persisted.
  function loadVol() {
    var v; try { v = parseFloat(localStorage.getItem(VOL_KEY)); } catch (e) {}
    return (isFinite(v) && v >= 0 && v <= 100) ? v : 22;
  }
  var VOLUME = loadVol();            // YouTube volume is 0–100 (gentle bg level)
  function loadRate() {
    var r; try { r = parseFloat(localStorage.getItem(RATE_KEY)); } catch (e) {}
    return (isFinite(r) && r >= 0.25 && r <= 2) ? r : 1;
  }
  var RATE = loadRate();
  function setItem(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getNum(k) { try { return parseFloat(localStorage.getItem(k)); } catch (e) { return NaN; } }
  function isMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } }
  function setMutedPref(m) { setItem(MUTE_KEY, m ? '1' : '0'); if (typeof refreshAmbient === 'function') refreshAmbient(); }
  function wasPlaying() { try { return localStorage.getItem(PLAY_KEY) === '1'; } catch (e) { return false; } }

  /* ---------------- MUSIC (hidden YouTube player) ---------------- */
  var player = null, playerReady = false, started = false, wantPlay = false;
  var btnRef = null;
  var LOOP_LEN = 0;                    // track duration, learned once ready
  // True when the current station is a SINGLE looping video (vs a playlist).
  // We loop these ourselves on ENDED so switching in/out of a named playlist
  // never leaves looping broken.
  var singleLoop = !YT_PLAYLIST;

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
    if (YT_PLAYLIST) return;   // timestamp resume is meaningless across playlist tracks
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
      videoId: YT_PLAYLIST ? '' : YT_VIDEO_ID,   // blank if playlist (loaded after ready)
      playerVars: {
        autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1,
        loop: 1,
        playlist: YT_PLAYLIST ? undefined : YT_VIDEO_ID,
        start: YT_PLAYLIST ? undefined : YT_START,
        playsinline: 1, rel: 0
      },
      events: {
        onReady: function () {
          playerReady = true;
          // If a playlist is configured, load it via the API (most reliable).
          if (YT_PLAYLIST) {
            try {
              player.loadPlaylist({
                listType: 'playlist', list: YT_PLAYLIST,
                index: 0, startSeconds: YT_START
              });
              player.pauseVideo();                        // don't autoplay until gesture
              if (YT_SHUFFLE) player.setShuffle(true);
              player.setLoop(true);
            } catch (e) {}
          } else {
            try {
              var dur = player.getDuration();
              if (isFinite(dur) && dur > 0) LOOP_LEN = dur;
            } catch (e) {}
            // Resume from where we left off on the previous page (single-track only).
            try { player.seekTo(resumeTime(), true); } catch (e) {}
          }
          curVol = 0;
          try { player.setVolume(0); } catch (e) {}   // start silent, fade in
          try { player.setPlaybackRate(RATE); } catch (e) {}   // apply saved speed
          if (wantPlay && !isMuted()) doPlay();
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.PLAYING) { started = true; updateBtn(btnRef, true); }
          else if (e.data === YT.PlayerState.ENDED) {
            // Loop single-video stations ourselves (playlists loop via the API).
            if (singleLoop) { try { player.seekTo(0, true); player.playVideo(); } catch (er) {} }
            else { updateBtn(btnRef, false); }
          }
          else if (e.data === YT.PlayerState.PAUSED) { updateBtn(btnRef, false); }
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
    refreshAmbient();   // resume any saved ambient layers (needs a user gesture)
  }

  // Switch to a different station WITHOUT reloading the page: fade out, load
  // the new video/playlist into the existing player, then fade back in.
  function switchStation(id) {
    var s = findStation(id);
    if (!s || s.id === station.id) return;
    station = s;
    setItem(STATION_KEY, s.id);
    YT_VIDEO_ID = s.video || '';
    YT_PLAYLIST = s.list  || '';
    LOOP_LEN = 0;
    // Changing station invalidates the saved single-track position.
    setItem(POS_KEY, '0'); setItem(TS_KEY, Date.now());
    updatePanelStation();   // refresh thumbnail/title/active-chip in the panel

    function load() {
      try {
        // Reset the player state first. Switching from a single video (loaded
        // via loadVideoById) straight into a named playlist is a known YouTube
        // IFrame API quirk: loadPlaylist can silently no-op unless the current
        // video is stopped first (symptom: the old track keeps playing). Clear
        // any prior loop + stop, then load the new content.
        try { player.setLoop(false); player.setShuffle(false); } catch (e0) {}
        try { player.stopVideo(); } catch (e1) {}

        if (YT_PLAYLIST) {
          singleLoop = false;
          player.loadPlaylist({ listType: 'playlist', list: YT_PLAYLIST, index: 0, startSeconds: 0, suggestedQuality: 'default' });
          if (YT_SHUFFLE) player.setShuffle(true);
          player.setLoop(true);
        } else {
          // Single video → loadVideoById reliably replaces whatever is loaded.
          // We loop it ourselves in the ENDED handler.
          singleLoop = true;
          player.loadVideoById({ videoId: YT_VIDEO_ID, startSeconds: 0 });
        }
        // loadPlaylist/loadVideoById auto-play; make sure we're actually playing
        // (stopVideo above can leave it cued), then fade the audio in.
        player.setVolume(0); curVol = 0;
        try { player.setPlaybackRate(RATE); } catch (e3) {}
        try { player.playVideo(); } catch (e2) {}
        if (!isMuted()) fadeTo(VOLUME, 700);
      } catch (e) {}
    }

    if (!playerReady) { wantPlay = true; return; }
    // Fade out the current track, swap, then fade the new one in.
    fadeTo(0, 300, function () { load(); });
  }

  /* ---------------- Sound console: music volume + playback speed ----------------
     These are REAL controls on the YouTube player (setVolume / setPlaybackRate).
     NOTE: a true bass/mid/treble EQ is impossible on a cross-origin YouTube
     iframe (the page can't touch its audio graph), so instead we offer volume,
     speed, and self-synthesized AMBIENT layers below — all genuinely audible. */
  function setMusicVolume(v) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    VOLUME = v;
    setItem(VOL_KEY, String(v));
    // Only push to the player if we're not mid-fade (fades manage curVol).
    if (playerReady && isPlaying()) { try { player.setVolume(v); curVol = v; } catch (e) {} }
  }
  function setPlaybackRate(r) {
    r = Math.max(0.25, Math.min(2, r));
    RATE = r;
    setItem(RATE_KEY, String(r));
    if (playerReady) { try { player.setPlaybackRate(r); } catch (e) {} }
  }

  /* ---------------- Ambient layers (self-synthesized via Web Audio) ----------------
     Original sound — no files, no copyright. Three loops the listener can blend
     under the music for immersion: a low "Hueco Mundo" drone, wind, and rain.
     Each is filtered noise / oscillators with its own gain, persisted. */
  var AC = null;                 // AudioContext (created on first gesture)
  var amb = { drone: null, wind: null, rain: null };
  var ambLevels = loadAmbLevels();
  function loadAmbLevels() {
    try { var o = JSON.parse(localStorage.getItem(AMB_KEY)); if (o) return { drone: +o.drone || 0, wind: +o.wind || 0, rain: +o.rain || 0 }; } catch (e) {}
    return { drone: 0, wind: 0, rain: 0 };
  }
  function saveAmbLevels() { setItem(AMB_KEY, JSON.stringify(ambLevels)); }

  function ensureAC() {
    if (AC) return AC;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      AC = new Ctx();
    } catch (e) { AC = null; }
    return AC;
  }
  // A reusable buffer of white noise (2 seconds, looped).
  function noiseBuffer() {
    var len = AC.sampleRate * 2;
    var buf = AC.createBuffer(1, len, AC.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function buildDrone() {
    // Two detuned low oscillators through a lowpass = a deep ominous drone.
    var g = AC.createGain(); g.gain.value = 0;
    var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
    var o1 = AC.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;      // ~A1
    var o2 = AC.createOscillator(); o2.type = 'sine';     o2.frequency.value = 82.4;    // ~E2
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(AC.destination);
    o1.start(); o2.start();
    return g;
  }
  function buildWind() {
    // Bandpass-swept noise = wind.
    var g = AC.createGain(); g.gain.value = 0;
    var src = AC.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
    var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.7;
    // slow LFO on the filter for a gusting feel
    var lfo = AC.createOscillator(); lfo.frequency.value = 0.08;
    var lfoG = AC.createGain(); lfoG.gain.value = 320;
    lfo.connect(lfoG); lfoG.connect(bp.frequency);
    src.connect(bp); bp.connect(g); g.connect(AC.destination);
    src.start(); lfo.start();
    return g;
  }
  function buildRain() {
    // Highpassed noise = rain hiss/patter.
    var g = AC.createGain(); g.gain.value = 0;
    var src = AC.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
    var hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    src.connect(hp); hp.connect(g); g.connect(AC.destination);
    src.start();
    return g;
  }
  // Set an ambient layer's level (0–100) and (lazily) build its nodes.
  function setAmbient(name, level) {
    level = Math.max(0, Math.min(100, Math.round(level)));
    ambLevels[name] = level;
    saveAmbLevels();
    if (level > 0 && !ensureAC()) return;      // no Web Audio support
    if (level > 0) { try { if (AC.state === 'suspended') AC.resume(); } catch (e) {} }
    if (level > 0 && !amb[name]) {
      amb[name] = (name === 'drone') ? buildDrone() : (name === 'wind') ? buildWind() : buildRain();
    }
    if (amb[name]) {
      // scale to a gentle range; drone is quieter to avoid muddiness
      var max = (name === 'drone') ? 0.18 : (name === 'rain') ? 0.28 : 0.22;
      var target = (isMuted() ? 0 : (level / 100) * max);
      try { amb[name].gain.setTargetAtTime(target, AC.currentTime, 0.15); } catch (e) { amb[name].gain.value = target; }
    }
  }
  // Re-apply all ambient levels (e.g. after mute changes).
  function refreshAmbient() {
    ['drone', 'wind', 'rain'].forEach(function (n) { if (ambLevels[n] > 0) setAmbient(n, ambLevels[n]); });
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
    if (typeof refreshPanelState === 'function') refreshPanelState();
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

  /* ---------------- "Now Playing" source panel ----------------
     Shows the real YouTube source of the music (credits + link) with an
     animated equalizer. NOTE: the equalizer is decorative — a cross-origin
     YouTube iframe can't expose its audio waveform to the page, so this
     reflects play/pause STATE, not real frequency data. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  var panelEl = null, panelOpen = false, oembedLoaded = false;
  function bars() {
    var h = '';
    for (var i = 0; i < 7; i++) h += '<span></span>';
    return '<div class="np-eq" aria-hidden="true">' + h + '</div>';
  }
  // A YouTube link that represents the current station (video or playlist).
  function stationWatchUrl() {
    return YT_PLAYLIST
      ? 'https://www.youtube.com/playlist?list=' + YT_PLAYLIST
      : 'https://youtu.be/' + YT_VIDEO_ID;
  }
  // A thumbnail for the current station. Playlists don't expose a stable
  // thumb via oEmbed, so fall back to the playlist's first known art via
  // the video path when we have a video, else a neutral placeholder.
  function stationThumbUrl() {
    return YT_VIDEO_ID ? ('https://i.ytimg.com/vi/' + YT_VIDEO_ID + '/mqdefault.jpg') : '';
  }
  // Build the station-picker chips (one per station; active one highlighted).
  function stationChips() {
    var h = '<div class="np-stations" role="group" aria-label="Music stations">';
    for (var i = 0; i < STATIONS.length; i++) {
      var s = STATIONS[i];
      h += '<button type="button" class="np-station' + (s.id === station.id ? ' active' : '') +
           '" data-station="' + esc(s.id) + '">' + esc(s.name) + '</button>';
    }
    return h + '</div>';
  }
  // Build the "Sound" console: music volume, playback speed, ambient layers.
  function sndRow(label, cls, min, max, step, val, suffix) {
    return '<label class="np-snd-row"><span class="np-snd-lbl">' + esc(label) + '</span>' +
      '<input type="range" class="' + cls + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' +
      '<span class="np-snd-val" data-suffix="' + esc(suffix || '') + '">' + val + esc(suffix || '') + '</span></label>';
  }
  function ambRow(label, name, val) {
    return '<label class="np-snd-row"><span class="np-snd-lbl">' + esc(label) + '</span>' +
      '<input type="range" class="np-amb" data-amb="' + name + '" min="0" max="100" step="1" value="' + val + '">' +
      '<span class="np-snd-val">' + val + '</span></label>';
  }
  function soundConsole() {
    var speedPct = Math.round(RATE * 100);
    return '<div class="np-picker-label">Sound</div>' +
      '<div class="np-console">' +
        sndRow('Volume', 'np-vol', 0, 100, 1, Math.round(VOLUME), '') +
        sndRow('Speed',  'np-rate', 50, 150, 5, speedPct, '%') +
        '<div class="np-snd-sub">Ambience (blends under the music)</div>' +
        ambRow('Drone', 'drone', ambLevels.drone) +
        ambRow('Wind',  'wind',  ambLevels.wind) +
        ambRow('Rain',  'rain',  ambLevels.rain) +
      '</div>';
  }
  // (Re)load the oEmbed title + channel for the CURRENT station.
  function loadOembed() {
    if (!panelEl) return;
    var t = panelEl.querySelector('.np-title'); if (t) t.textContent = 'Loading…';
    var c = panelEl.querySelector('.np-chan'); if (c) c.textContent = '';
    fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(stationWatchUrl()) + '&format=json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!panelEl) return;
        var tt = panelEl.querySelector('.np-title');
        var cc = panelEl.querySelector('.np-chan');
        if (!d) { if (tt) tt.textContent = station.name; return; }
        if (tt) tt.textContent = d.title || station.name;
        if (cc) cc.textContent = d.author_name ? ('by ' + String(d.author_name).trim()) : '';
      })
      .catch(function () {
        if (!panelEl) return;
        var tt = panelEl.querySelector('.np-title'); if (tt) tt.textContent = station.name;
      });
  }
  // Refresh the panel's media (thumb + links + active chip) after a switch.
  function updatePanelStation() {
    if (!panelEl) return;
    var watch = stationWatchUrl();
    var media = panelEl.querySelector('.np-media'); if (media) media.setAttribute('href', watch);
    var src = panelEl.querySelector('.np-source'); if (src) src.setAttribute('href', watch);
    var img = panelEl.querySelector('.np-thumb');
    if (img) { var th = stationThumbUrl(); if (th) { img.src = th; img.style.display = ''; } else { img.style.display = 'none'; } }
    var chips = panelEl.querySelectorAll('.np-station');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('active', chips[i].getAttribute('data-station') === station.id);
    }
    loadOembed();
  }
  function buildPanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.id = 'now-playing';
    panelEl.className = 'now-playing';
    var watch = stationWatchUrl();
    var thumb = stationThumbUrl();
    panelEl.innerHTML =
      '<button class="np-close" aria-label="Minimize player" title="Minimize">&#8211;</button>' +
      '<div class="np-head">' +
        '<button class="np-playpause" type="button" aria-label="Play or pause">▶</button>' +
        bars() + '<span class="np-status">Now Playing</span>' +
      '</div>' +
      '<a class="np-media" href="' + watch + '" target="_blank" rel="noopener">' +
        '<img class="np-thumb" src="' + thumb + '" alt="" loading="lazy"' + (thumb ? '' : ' style="display:none"') + '>' +
        '<div class="np-meta">' +
          '<div class="np-title">Loading…</div>' +
          '<div class="np-chan"></div>' +
        '</div>' +
      '</a>' +
      '<a class="np-source" href="' + watch + '" target="_blank" rel="noopener">▶ Watch source on YouTube ↗</a>' +
      '<div class="np-picker-label">Stations</div>' +
      stationChips() +
      soundConsole();
    document.body.appendChild(panelEl);
    panelEl.querySelector('.np-close').addEventListener('click', function (e) { e.stopPropagation(); togglePanel(false); });
    // Play/Pause button — mirrors the speaker toggle but lives in the panel.
    panelEl.querySelector('.np-playpause').addEventListener('click', function (e) {
      e.stopPropagation();
      if (isPlaying()) {
        doPause();
        setMutedPref(true);          // keep it paused across pages
        if (btnRef) updateBtn(btnRef, false);
      } else {
        setMutedPref(false);
        startPlayback();
        if (btnRef) updateBtn(btnRef, true);
      }
      // onStateChange will re-sync once YouTube confirms; this is instant feedback.
      refreshPanelState();
    });
    // Station chip clicks → switch stations in place (no page reload).
    panelEl.addEventListener('click', function (e) {
      var chip = e.target && e.target.closest ? e.target.closest('.np-station') : null;
      if (!chip) return;
      e.stopPropagation();
      var id = chip.getAttribute('data-station');
      setMutedPref(false);        // choosing a station implies "play"
      if (!isPlaying() && !wantPlay) startPlayback();
      switchStation(id);
    });
    // Sound console sliders (live, no reload). Update the value label as they move.
    function bindSlider(sel, onInput) {
      var el = panelEl.querySelector(sel);
      if (!el) return;
      el.addEventListener('click', function (e) { e.stopPropagation(); });
      el.addEventListener('input', function () {
        var valEl = el.parentNode.querySelector('.np-snd-val');
        if (valEl) valEl.textContent = el.value + (sel === '.np-rate' ? '%' : '');
        onInput(parseFloat(el.value));
      });
    }
    bindSlider('.np-vol',  function (v) { setMusicVolume(v); });
    bindSlider('.np-rate', function (v) { setPlaybackRate(v / 100); });
    // Ambient sliders share a class; bind each by its data-amb name.
    panelEl.querySelectorAll('.np-amb').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); });
      el.addEventListener('input', function () {
        var valEl = el.parentNode.querySelector('.np-snd-val');
        if (valEl) valEl.textContent = el.value;
        setAmbient(el.getAttribute('data-amb'), parseFloat(el.value));
      });
    });
    // Pull real title + channel from YouTube oEmbed (keyless, credits the source).
    loadOembed();
    return panelEl;
  }
  function refreshPanelState() {
    if (!panelEl) return;
    var playing = isPlaying();
    panelEl.classList.toggle('is-playing', playing);
    var st = panelEl.querySelector('.np-status');
    if (st) st.textContent = playing ? 'Now Playing' : 'Paused';
    var pp = panelEl.querySelector('.np-playpause');
    if (pp) {
      pp.textContent = playing ? '❚❚' : '▶';
      pp.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      pp.title = playing ? 'Pause' : 'Play';
    }
  }
  function togglePanel(open) {
    buildPanel();
    panelOpen = (open === undefined) ? !panelOpen : open;
    panelEl.classList.toggle('open', panelOpen);
    // Remember the listener's choice so it persists across pages.
    setItem(PANEL_KEY, panelOpen ? '1' : '0');
    if (panelOpen) refreshPanelState();
  }

  /* ---------------- Init ---------------- */
  function init() {
    var btn = buildButton();
    btnRef = btn;
    initSfx();
    wireSfx();
    loadYT();

    // Info button (next to the audio toggle) toggles the "Now Playing" panel.
    var info = document.createElement('button');
    info.id = 'audio-info';
    info.className = 'audio-info';
    info.type = 'button';
    info.textContent = 'ℹ';
    info.setAttribute('aria-label', 'Now playing — music source');
    info.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(); });
    document.body.appendChild(info);

    // Show the music player EXPANDED by default so listeners see the stations
    // right away. If they previously minimized it, respect that choice.
    var startOpen;
    try { startOpen = localStorage.getItem(PANEL_KEY); } catch (e) { startOpen = null; }
    // Default (null / never chosen) = open. '0' = they minimized it.
    togglePanel(startOpen !== '0');

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
