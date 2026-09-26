/* ------------------------------------------------------------------
   Ambient site soundtrack for Ashura Whole Heavens.

   - Loops a short intro theme softly in the background.
   - Starts on a USER GESTURE (browsers block autoplay-with-sound):
       • the intro "Enter the Heavens" click (via the 'aws-enter' event), or
       • the first click/tap anywhere on pages without the intro.
   - A floating 🔊 / 🔇 toggle lets visitors mute; the choice is
     remembered across pages via localStorage, so it never nags.
   - Muted by default is FALSE here (starts on gesture), but if a visitor
     has muted before, it stays muted and won't autostart.

   Swap the track any time: replace assets/intro-theme.mp3 (or change
   TRACK below). No other code changes needed.
   ------------------------------------------------------------------ */
(function () {
  var TRACK = 'assets/intro-theme.mp3';   // relative to site root
  // Build articles live in /builds/, so resolve the path from the root.
  if (location.pathname.indexOf('/builds/') !== -1) TRACK = '../' + TRACK;

  var MUTE_KEY = 'aws-audio-muted';
  var VOLUME = 0.35;                       // gentle background level

  function isMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } }
  function setMutedPref(m) { try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) {} }

  var audio = new Audio(TRACK);
  audio.loop = true;
  audio.preload = 'none';                  // don't download until we intend to play
  audio.volume = VOLUME;

  var started = false;

  function updateBtn(btn, playing) {
    btn.textContent = playing ? '🔊' : '🔇';
    btn.setAttribute('aria-label', playing ? 'Mute music' : 'Play music');
    btn.classList.toggle('is-muted', !playing);
  }

  function startPlayback() {
    if (started || isMuted()) return;
    started = true;
    audio.preload = 'auto';
    var p = audio.play();
    if (p && p.catch) p.catch(function () { started = false; });  // gesture not accepted yet
  }

  function buildButton() {
    if (document.getElementById('audio-toggle')) return;
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
        audio.preload = 'auto';
        audio.play().catch(function () {});
        updateBtn(btn, true);
      } else {
        audio.pause();
        setMutedPref(true);
        updateBtn(btn, false);
      }
    });
    document.body.appendChild(btn);
    return btn;
  }

  function init() {
    var btn = buildButton();

    // Preferred trigger: the intro "Enter" gesture.
    window.addEventListener('aws-enter', function () {
      startPlayback();
      if (btn) updateBtn(btn, !audio.paused);
    });

    // Fallback: first interaction anywhere (covers pages without the intro,
    // or when the intro was already seen). One-shot.
    function firstGesture() {
      startPlayback();
      if (btn) updateBtn(btn, !audio.paused);
      window.removeEventListener('pointerdown', firstGesture);
      window.removeEventListener('keydown', firstGesture);
    }
    if (!isMuted()) {
      window.addEventListener('pointerdown', firstGesture);
      window.addEventListener('keydown', firstGesture);
    }

    // Keep the button state honest if playback pauses/ends for any reason.
    audio.addEventListener('pause', function () { updateBtn(btn, false); });
    audio.addEventListener('play', function () { updateBtn(btn, true); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
