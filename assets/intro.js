/* ------------------------------------------------------------------
   Cinematic 3D intro for Ashura Whole Heavens (home page).
   - Plays once (localStorage), skippable, with a Replay button.
   - Three.js camera fly-through toward the crescent moon through clouds,
     then a sequenced reveal: logo → tagline → guided tour → Enter.
   Include AFTER three.min.js on the home page only.
   ------------------------------------------------------------------ */
(function () {
  var SEEN_KEY = 'aws-intro-seen';

  function hasSeen() { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {} }

  // Build the overlay DOM.
  function buildOverlay() {
    var ov = document.createElement('div');
    ov.id = 'intro-overlay';
    ov.innerHTML =
      '<canvas id="intro-canvas"></canvas>' +
      '<button class="intro-skip" id="intro-skip">Skip Intro ✕</button>' +
      '<div class="intro-content">' +
        '<div class="intro-spiral" id="i-spiral">🌀</div>' +
        '<h1 class="intro-logo" id="i-logo">SOLASHUR</h1>' +
        '<p class="intro-tagline" id="i-tag">Descendant of the God of the Whole Heavens — one of the world\'s premier MMO streamers. 🌙</p>' +
        '<div class="intro-tour" id="i-tour">' +
          tourCard('⚔️', 'Builds', 'Templar & Gladiator guides') +
          tourCard('📺', 'Watch', 'Live streams + video library') +
          tourCard('🖥️', 'Hardware', 'My exact gaming setup') +
          tourCard('🤝', 'Sponsors', 'Gear I run every stream') +
        '</div>' +
        '<button class="intro-enter" id="i-enter">Enter the Heavens 🌀</button>' +
      '</div>';
    document.body.appendChild(ov);
    return ov;
  }
  function tourCard(ico, name, desc) {
    return '<div class="it-card"><div class="it-ico">' + ico + '</div>' +
           '<div class="it-name">' + name + '</div>' +
           '<div class="it-desc">' + desc + '</div></div>';
  }

  // The 3D scene: reishi particles + crescent moon, camera flies forward.
  function runScene(canvas, onReady) {
    if (typeof THREE === 'undefined') { onReady(); return function () {}; }
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05040a, 0.04);
    var camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 60);

    scene.add(new THREE.AmbientLight(0x404060, 1.2));
    var l1 = new THREE.PointLight(0xd61e2c, 2.5, 120); l1.position.set(-20, 14, 30); scene.add(l1);
    var l2 = new THREE.PointLight(0xff5563, 2, 120); l2.position.set(20, -10, 20); scene.add(l2);

    // Crescent moon (canvas texture)
    var mc = document.createElement('canvas'); mc.width = mc.height = 512;
    var mx = mc.getContext('2d'); var cx = 256, cy = 256, r = 150;
    var glow = mx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.7);
    glow.addColorStop(0, 'rgba(255,235,235,0.4)'); glow.addColorStop(1, 'rgba(255,235,235,0)');
    mx.fillStyle = glow; mx.fillRect(0, 0, 512, 512);
    mx.save(); mx.beginPath(); mx.arc(cx, cy, r, 0, Math.PI * 2);
    mx.fillStyle = '#f4eef2'; mx.shadowColor = 'rgba(255,210,210,0.9)'; mx.shadowBlur = 50; mx.fill();
    mx.globalCompositeOperation = 'destination-out';
    mx.beginPath(); mx.arc(cx + r * 0.5, cy - r * 0.25, r * 0.95, 0, Math.PI * 2); mx.fill(); mx.restore();
    var moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(mc), transparent: true }));
    moon.scale.set(30, 30, 30); moon.position.set(10, 8, -40); scene.add(moon);

    // Reishi particle field the camera flies through
    var N = 1400, pos = new Float32Array(N * 3);
    for (var i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 120;
    var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var particles = new THREE.Points(pg, new THREE.PointsMaterial({
      color: 0xffb0b8, size: 0.35, transparent: true, opacity: 0.8
    }));
    scene.add(particles);

    var start = performance.now(), running = true, revealed = false;
    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
      var t = (performance.now() - start) / 1000;
      // Camera flies forward toward the moon over ~3.5s, then eases to rest.
      var z = 60 - Math.min(t / 3.5, 1) * 52;   // 60 -> 8
      camera.position.z = z;
      camera.position.x = Math.sin(t * 0.3) * 3;
      camera.lookAt(10, 6, -40);
      particles.rotation.y = t * 0.05;
      particles.rotation.z = t * 0.02;
      renderer.render(scene, camera);
      if (!revealed && t > 1.2) { revealed = true; onReady(); }
    }
    animate();
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    return function stop() { running = false; };
  }

  // Sequenced reveal of the text/tour once the fly-through settles.
  function reveal() {
    var seq = [
      ['i-spiral', 0], ['i-logo', 250], ['i-tag', 700]
    ];
    seq.forEach(function (s) { setTimeout(function () { var e = document.getElementById(s[0]); if (e) e.classList.add('in'); }, s[1]); });
    var cards = document.querySelectorAll('#i-tour .it-card');
    cards.forEach(function (c, idx) { setTimeout(function () { c.classList.add('in'); }, 1100 + idx * 180); });
    setTimeout(function () { var e = document.getElementById('i-enter'); if (e) e.classList.add('in'); }, 1100 + cards.length * 180 + 200);
  }

  function play() {
    var ov = buildOverlay();
    document.body.style.overflow = 'hidden';
    var stop = runScene(document.getElementById('intro-canvas'), reveal);

    function close() {
      markSeen();
      ov.classList.add('done');
      document.body.style.overflow = '';
      setTimeout(function () { stop(); ov.remove(); }, 900);
    }
    document.getElementById('intro-skip').addEventListener('click', close);
    document.getElementById('i-enter').addEventListener('click', close);
  }

  // Replay button always available on the page.
  function addReplayButton() {
    if (document.querySelector('.replay-intro')) return;
    var b = document.createElement('button');
    b.className = 'replay-intro';
    b.textContent = '▶ Replay Intro';
    b.addEventListener('click', play);
    document.body.appendChild(b);
  }

  function init() {
    addReplayButton();
    if (!hasSeen()) play();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
