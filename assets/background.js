/* ------------------------------------------------------------------
   Ashura Whole Heavens — shared 3D background
   Floating Akatsuki clouds + shuriken (Three.js billboard sprites).
   Reused across every page. Requires a <canvas id="bg-canvas"> and
   Three.js loaded before this script.
   ------------------------------------------------------------------ */
(function () {
  // Theme palettes for the 3D background. Read from <html data-theme>.
  var THEMES = {
    // Dark = Hueco Mundo: black night sky, pale reishi particles, crescent moon.
    dark: {
      cloudGlow: 'rgba(214, 30, 44, 0.95)', cloudStroke: '#d61e2c',
      cloudFill: '#0d0b0d', cloudLine: '#f5f5f5',
      shuriGlow: 'rgba(214,30,44,0.85)', shuriFill: '#2b2226',
      shuriEdge: '#f5f5f5', shuriHoleFill: '#0d0b0d', shuriHoleRing: '#d61e2c',
      fog: 0x05050a, particle: 0xdfe6ff,
      lights: [0xd61e2c, 0xff5563, 0x8a1018],
      fallback: 'radial-gradient(1000px 700px at 78% 12%, #1a1c2e 0%, #05050a 55%)'
    },
    light: {
      cloudGlow: 'rgba(31, 111, 214, 0.85)', cloudStroke: '#1f6fd6',
      cloudFill: '#3fa9ff', cloudLine: '#ffffff',
      shuriGlow: 'rgba(31,111,214,0.8)', shuriFill: '#0a1a2e',
      shuriEdge: '#3fa9ff', shuriHoleFill: '#0a1a2e', shuriHoleRing: '#3fa9ff',
      fog: 0xeaf3ff, particle: 0x2f8fe6,
      lights: [0x1f6fd6, 0x3fa9ff, 0x0a1a2e],
      fallback: 'radial-gradient(1200px 800px at 70% 10%, #dcecff 0%, #f4f8fd 60%)'
    }
  };
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  var pal = THEMES[currentTheme()];

  // ---- Guard: if Three.js failed to load, keep the page usable ----
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded; showing static gradient background.');
    document.body.style.background = pal.fallback;
    return;
  }

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(pal.fog, 0.03);

  const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.z = 18;

  // ---- Lights ----
  scene.add(new THREE.AmbientLight(0x404060, 1.2));
  const p1 = new THREE.PointLight(pal.lights[0], 2.2, 60); p1.position.set(-15, 10, 20); scene.add(p1);
  const p2 = new THREE.PointLight(pal.lights[1], 2, 60); p2.position.set(15, -10, 15); scene.add(p2);
  const p3 = new THREE.PointLight(pal.lights[2], 1.5, 60); p3.position.set(0, 12, -10); scene.add(p3);

  // ---- Symbol textures (hand-drawn on canvas) ----
  function makeSymbolTexture(drawFn) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.translate(size / 2, size / 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  // Akatsuki cloud: black fill, white inner line, red outer glow.
  function buildCloudPath() {
    const p = new Path2D();
    p.moveTo(-116, 26);
    p.quadraticCurveTo(-70, 4, -58, -18);
    p.quadraticCurveTo(-52, -52, -18, -44);
    p.quadraticCurveTo(-10, -74, 24, -60);
    p.quadraticCurveTo(38, -84, 68, -62);
    p.quadraticCurveTo(96, -70, 96, -36);
    p.quadraticCurveTo(122, -20, 108, 10);
    p.quadraticCurveTo(120, 40, 84, 46);
    p.quadraticCurveTo(58, 62, 30, 48);
    p.quadraticCurveTo(2, 64, -22, 46);
    p.quadraticCurveTo(-48, 60, -60, 34);
    p.quadraticCurveTo(-92, 46, -116, 26);
    p.closePath();
    return p;
  }

  function drawAkatsukiCloud(ctx) {
    ctx.save();
    ctx.scale(0.92, 0.92);
    const path = buildCloudPath();
    ctx.shadowColor = pal.cloudGlow;
    ctx.shadowBlur = 26;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = pal.cloudStroke;
    ctx.lineWidth = 14;
    ctx.stroke(path);
    ctx.shadowBlur = 12;
    ctx.stroke(path);
    ctx.shadowBlur = 0;
    ctx.fillStyle = pal.cloudFill;
    ctx.fill(path);
    ctx.strokeStyle = pal.cloudLine;
    ctx.lineWidth = 4.5;
    ctx.stroke(path);
    ctx.restore();
  }

  function drawShuriken(ctx) {
    const blade = new Path2D();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const a2 = a + Math.PI / 4;
      blade.moveTo(0, 0);
      blade.lineTo(Math.cos(a) * 92, Math.sin(a) * 92);
      blade.lineTo(Math.cos(a2) * 34, Math.sin(a2) * 34);
    }
    blade.closePath();
    ctx.fillStyle = pal.shuriFill;
    ctx.shadowColor = pal.shuriGlow;
    ctx.shadowBlur = 18;
    ctx.fill(blade);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = pal.shuriEdge;
    ctx.lineWidth = 5;
    ctx.stroke(blade);
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = pal.shuriHoleFill;
    ctx.fill();
    ctx.strokeStyle = pal.shuriHoleRing;
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  const symbolTextures = [
    makeSymbolTexture(drawAkatsukiCloud),
    makeSymbolTexture(drawAkatsukiCloud),
    makeSymbolTexture(drawShuriken)
  ];

  const shapes = [];
  for (let i = 0; i < 16; i++) {
    const tex = symbolTextures[i % symbolTextures.length];
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true,
      opacity: 0.62 + Math.random() * 0.32, depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(
      (Math.random() - 0.5) * 36,
      (Math.random() - 0.5) * 26,
      (Math.random() - 0.5) * 22 - 4
    );
    const s = 2.2 + Math.random() * 2.6;
    sprite.scale.set(s, s, s);
    sprite.userData = {
      spin: (Math.random() - 0.5) * 0.4,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.25 + Math.random() * 0.45,
      baseY: sprite.position.y
    };
    scene.add(sprite);
    shapes.push(sprite);
  }

  // ---- Particle starfield ----
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 80;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: pal.particle, size: 0.08, transparent: true, opacity: 0.5
  }));
  scene.add(particles);

  // ---- Hueco Mundo crescent moon (Bleach / Arrancar vibe) ----
  // A large pale crescent fixed high in the background, behind everything.
  function makeMoonTexture() {
    var size = 512;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    var cx = size / 2, cy = size / 2, r = 150;
    // Soft outer glow
    var glow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.6);
    glow.addColorStop(0, 'rgba(230,235,255,0.35)');
    glow.addColorStop(1, 'rgba(230,235,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    // Full disc, then carve a crescent by subtracting an offset circle.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#eef2ff';
    ctx.shadowColor = 'rgba(220,230,255,0.8)';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx + r * 0.55, cy - r * 0.25, r * 0.98, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return new THREE.CanvasTexture(c);
  }
  var moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeMoonTexture(), transparent: true, opacity: 0.85, depthWrite: false
  }));
  moon.scale.set(14, 14, 14);
  moon.position.set(16, 11, -14);   // upper-right, far back
  scene.add(moon);

  // ---- Live re-theme (called when the user toggles light/dark) ----
  function retheme() {
    pal = THEMES[currentTheme()];
    // Rebuild sprite textures with the new palette.
    var newTex = [
      makeSymbolTexture(drawAkatsukiCloud),
      makeSymbolTexture(drawAkatsukiCloud),
      makeSymbolTexture(drawShuriken)
    ];
    shapes.forEach(function (sprite, i) {
      var t = newTex[i % newTex.length];
      if (sprite.material.map) sprite.material.map.dispose();
      sprite.material.map = t;
      sprite.material.needsUpdate = true;
    });
    // Crescent moon belongs to Hueco Mundo (dark). Fade it in light mode.
    moon.material.opacity = (currentTheme() === 'light') ? 0.2 : 0.85;
    scene.fog.color.setHex(pal.fog);
    p1.color.setHex(pal.lights[0]);
    p2.color.setHex(pal.lights[1]);
    p3.color.setHex(pal.lights[2]);
    particles.material.color.setHex(pal.particle);
  }
  window.addEventListener('themechange', retheme);

  // ---- Mouse parallax + scroll influence ----
  let mouseX = 0, mouseY = 0, scrollY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    shapes.forEach((m) => {
      m.material.rotation += m.userData.spin * 0.01;
      m.position.y = m.userData.baseY +
        Math.sin(t * m.userData.floatSpeed + m.userData.floatOffset) * 0.9;
    });
    particles.rotation.y = t * 0.02;
    const targetX = mouseX * 4;
    const targetY = -mouseY * 3 - scrollY * 0.004;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// ---- Scroll reveal for any element with .reveal or .step ----
(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.step, .reveal').forEach((el) => observer.observe(el));
})();
