/* ============================================================================
  SOLASHUR STREAM PACKAGE - SHARED CANVAS ENGINE
  Two themes matching solashur.com (set via <html data-theme>):
  - dark  = black + Akatsuki red  (Hueco Mundo)  [default]
  - light = white + electric blue  (Lightning Templar)
  ----------------------------------------------------------------------------
  Reusable drawing + animation helpers used by every scene so the whole pack
  looks consistent. Pure canvas - no image files, no build step. Motifs recolor
  automatically with the theme, and the background carries the website's
  drifting Akatsuki clouds + shuriken + eclipsed moon.

  Expose a single global: window.Solashur

  Core motifs:
  Solashur.drawEclipseMoon(ctx, x, y, r, opts)  -> eclipsed Hueco Mundo moon
  Solashur.drawWing(ctx, x, y, scale, side, t)  -> one feathered angel wing
  Solashur.drawWings(ctx, cx, cy, scale, t)  -> a mirrored pair of wings
  Solashur.drawBlade(ctx, cx, cy, len, angle, t)  -> zanpakuto katana (+lightning)
  Solashur.drawCloud(ctx, x, y, scale)  -> one Akatsuki cloud
  Solashur.drawShuriken(ctx, x, y, scale, rot)  -> one 4-point shuriken
  new Solashur.CloudField(canvas, opts)  -> drifting clouds + shuriken
  Solashur.lightningPath(ctx,x1,y1,x2,y2,jag,inten) -> a jagged electric arc
  Solashur.drawAura(ctx,cx,cy,r,bolts,inten,t)  -> radiating aura
  new Solashur.Reishi(canvas, opts)  -> drifting spirit particles
  Solashur.raf(fn) / Solashur.hi(canvas) / Solashur.theme()
  ========================================================================== */
(function () {
  /* Two palettes matching solashur.com. Chosen by <html data-theme>. */
  var PALETTES = {
  dark: {  /* black + Akatsuki red (Hueco Mundo) */
  accent:'#d61e2c', accent2:'#ff5563', deep:'#7a0f18',
  reishi:'#eef2ff', reishiDim:'#b8c0e0', ink:'#0d0b0d', void:'#050507',
  glow:'255,85,99', core:'214,30,44',
  /* cloud + shuriken (mirror background.js dark) */
  cloudGlow:'rgba(214,30,44,0.95)', cloudStroke:'#d61e2c', cloudFill:'#0d0b0d', cloudLine:'#f5f5f5',
  shuriGlow:'rgba(214,30,44,0.85)', shuriFill:'#2b2226', shuriEdge:'#f5f5f5',
  shuriHoleFill:'#0d0b0d', shuriHoleRing:'#d61e2c',
  moonBody:['#20222c','#101119','#050507'], moonEdge:'rgba(245,248,255,0.9)',
  moonHollow:'#d61e2c', moonGlow:'rgba(220,230,255,0.9)'
  },
  light: {  /* white + electric blue (Lightning Templar) */
  accent:'#1f6fd6', accent2:'#3fa9ff', deep:'#0a1a2e',
  reishi:'#0a1a2e', reishiDim:'#45577a', ink:'#eef4fc', void:'#f4f8fd',
  glow:'63,169,255', core:'31,111,214',
  cloudGlow:'rgba(31,111,214,0.85)', cloudStroke:'#1f6fd6', cloudFill:'#3fa9ff', cloudLine:'#ffffff',
  shuriGlow:'rgba(31,111,214,0.8)', shuriFill:'#0a1a2e', shuriEdge:'#3fa9ff',
  shuriHoleFill:'#0a1a2e', shuriHoleRing:'#3fa9ff',
  moonBody:['#c9d8f0','#aec4e6','#8fa8d0'], moonEdge:'rgba(255,255,255,0.95)',
  moonHollow:'#1f6fd6', moonGlow:'rgba(120,170,255,0.9)'
  }
  };
  function themeName() {
  return (typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'light') ? 'light' : 'dark';
  }
  var C = PALETTES[themeName()];
  /* Re-point C to the active palette when the theme toggles. */
  if (typeof window !== 'undefined') {
  window.addEventListener('themechange', function () {
  var p = PALETTES[themeName()];
  for (var k in p) C[k] = p[k];
  });
  }

  /* HiDPI: size the canvas backing store to its CSS box * devicePixelRatio. */
  function hi(canvas) {
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var r = canvas.getBoundingClientRect();
  var w = Math.max(1, Math.round(r.width));
  var h = Math.max(1, Math.round(r.height));
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  var ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx: ctx, w: w, h: h, dpr: dpr };
  }

  /* rAF loop that passes elapsed seconds. */
  function raf(fn) {
  var start = performance.now();
  (function tick(now) {
  fn((now - start) / 1000);
  requestAnimationFrame(tick);
  })(start);
  }

  /* ---- Hueco Mundo eclipsed moon -----------------------------------------
  Dark body, thin luminous crescent rim, pale halo, blue hollow mark. */
  function drawEclipseMoon(ctx, x, y, r, opts) {
  opts = opts || {};
  var hollow = opts.hollow !== false;  // show the blue hollow mark
  ctx.save();
  ctx.translate(x, y);

  // cold blue-white halo
  var halo = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, r * 1.9);
  halo.addColorStop(0,  'rgba(150,200,255,0.30)');
  halo.addColorStop(0.5, 'rgba(120,180,255,0.10)');
  halo.addColorStop(1,  'rgba(120,180,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2); ctx.fill();

  // eclipsed body (palette-driven: blue-black in dark, pale in light)
  var mb = C.moonBody || ['#20222c','#101119','#050507'];
  var body = ctx.createRadialGradient(-r*0.25, -r*0.25, r*0.1, 0, 0, r);
  body.addColorStop(0, mb[0]);
  body.addColorStop(0.7, mb[1]);
  body.addColorStop(1, mb[2]);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = body; ctx.fill();

  // luminous crescent rim (lower-left)
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  var lit = ctx.createRadialGradient(-r*0.55, r*0.55, r*0.05, -r*0.55, r*0.55, r*1.5);
  lit.addColorStop(0,  'rgba(224,242,255,0.97)');
  lit.addColorStop(0.35,'rgba(150,205,255,0.55)');
  lit.addColorStop(0.7, 'rgba(95,170,255,0.12)');
  lit.addColorStop(1,  'rgba(95,170,255,0)');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = lit; ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(r*0.30, -r*0.30, r*0.98, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // hot edge highlight
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = r * 0.035;
  ctx.strokeStyle = C.moonEdge || 'rgba(230,246,255,0.92)';
  ctx.shadowColor = C.moonGlow || 'rgba(95,208,255,0.9)'; ctx.shadowBlur = r*0.16;
  ctx.beginPath(); ctx.arc(0, 0, r - ctx.lineWidth*0.5, Math.PI*0.35, Math.PI*1.15); ctx.stroke();
  ctx.restore();

  // hollow mark (palette-outlined)
  if (hollow) {
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.clip();
  var hx = -r*0.42, hy = r*0.34, s = r*0.34;
  ctx.beginPath();
  ctx.moveTo(hx - s*0.9, hy + s*0.05);
  ctx.bezierCurveTo(hx - s*1.0, hy - s*0.7,  hx - s*0.1, hy - s*0.95, hx + s*0.4, hy - s*0.55);
  ctx.bezierCurveTo(hx + s*1.0, hy - s*0.2,  hx + s*0.95, hy + s*0.5, hx + s*0.35, hy + s*0.7);
  ctx.bezierCurveTo(hx - s*0.1, hy + s*0.85, hx - s*0.7, hy + s*0.7,  hx - s*0.9, hy + s*0.05);
  ctx.closePath();
  ctx.fillStyle = (C.moonBody ? C.moonBody[2] : '#050507'); ctx.fill();
  ctx.lineWidth = r * 0.03;
  ctx.strokeStyle = C.moonHollow || C.accent;
  ctx.shadowColor = 'rgba(' + C.glow + ',0.9)'; ctx.shadowBlur = r*0.14;
  ctx.stroke();
  ctx.restore();
  }
  ctx.restore();
  }

  /* ---- One feathered angel wing ------------------------------------------
  side: -1 = left, +1 = right. t drives a gentle flap.
  Drawn as layered feather rows sweeping back from a shoulder point. */
  function drawWing(ctx, x, y, scale, side, t, opts) {
  opts = opts || {};
  var flap = Math.sin(t * 1.6) * 0.10;  // radians of flap
  var rows = 4;  // feather rows
  var perRow = [6, 7, 8, 9];  // feathers per row (inner->outer)
  var tint = opts.tint || C.reishi;
  var edge = opts.edge || C.accent;  /* electric-blue feather tips */

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side * scale, scale);
  ctx.rotate(flap);

  // soft wing haze behind the feathers (palette glow)
  var haze = ctx.createRadialGradient(60, -10, 10, 60, -10, 180);
  haze.addColorStop(0, 'rgba(' + C.glow + ',0.20)');
  haze.addColorStop(1, 'rgba(' + C.glow + ',0)');
  ctx.fillStyle = haze;
  ctx.beginPath(); ctx.ellipse(70, -10, 170, 90, -0.2, 0, Math.PI*2); ctx.fill();

  for (var row = 0; row < rows; row++) {
  var n = perRow[row];
  var baseLen = 70 + row * 34;  // outer rows longer
  var spread  = 0.16 + row * 0.045;  // angular spread per feather
  var lift  = -row * 8;  // stack rows upward
  for (var i = 0; i < n; i++) {
  var ang = -0.15 - i * spread + Math.sin(t*1.6 + i*0.3 + row) * 0.012;
  var len = baseLen * (1 - i * 0.045);
  var fx = Math.cos(ang) * len;
  var fy = Math.sin(ang) * len + lift;
  var wid = 9 + row * 2.2;

  // feather body
  ctx.save();
  ctx.translate(0, lift);
  ctx.rotate(ang);
  var g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.97)');
  g.addColorStop(0.6, tint);
  g.addColorStop(1, 'rgba(' + C.glow + ',0.15)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len*0.5, -wid, len, 0);
  ctx.quadraticCurveTo(len*0.5,  wid, 0, 0);
  ctx.closePath();
  ctx.shadowColor = 'rgba(' + C.glow + ',0.40)'; ctx.shadowBlur = 9;
  ctx.fill();
  // electric-blue feather tip on the outermost row
  if (row === rows - 1) {
  ctx.beginPath();
  ctx.moveTo(len*0.7, 0);
  ctx.quadraticCurveTo(len*0.85, -wid*0.5, len, 0);
  ctx.quadraticCurveTo(len*0.85,  wid*0.5, len*0.7, 0);
  ctx.closePath();
  ctx.fillStyle = edge; ctx.fill();
  }
  ctx.restore();
  }
  }
  ctx.restore();
  }

  /* A mirrored pair of wings centered on (cx, cy). */
  function drawWings(ctx, cx, cy, scale, t, opts) {
  drawWing(ctx, cx - 6*scale, cy, scale, -1, t, opts);
  drawWing(ctx, cx + 6*scale, cy, scale,  1, t, opts);
  }

  /* ---- Zanpakuto (katana) -------------------------------------------------
  Drawn vertical by default, rotated by `angle`. Glowing edge + tsuba + tsuka.
  len = blade length in px. */
  function drawBlade(ctx, cx, cy, len, angle, t, opts) {
  opts = opts || {};
  var bladeW = len * 0.055;
  var glow = 0.6 + Math.abs(Math.sin(t * 1.2)) * 0.4;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // ---- blade (points up = -y) - blue-lit steel ----
  var g = ctx.createLinearGradient(-bladeW, 0, bladeW, 0);
  g.addColorStop(0,  '#6d86b0');
  g.addColorStop(0.5, '#eaf4ff');
  g.addColorStop(1,  '#5a7098');
  ctx.fillStyle = g;
  ctx.shadowColor = 'rgba(' + C.core + ',' + (0.65*glow).toFixed(2) + ')';
  ctx.shadowBlur = len * 0.08;
  ctx.beginPath();
  ctx.moveTo(-bladeW, 0);
  ctx.lineTo(-bladeW, -len * 0.9);
  ctx.quadraticCurveTo(0, -len, bladeW, -len * 0.9);  // tip
  ctx.lineTo(bladeW, 0);
  ctx.closePath();
  ctx.fill();

  // hamon / glowing edge line (palette)
  ctx.strokeStyle = 'rgba(' + C.glow + ',' + glow.toFixed(2) + ')';
  ctx.lineWidth = Math.max(1.5, len * 0.012);
  ctx.shadowColor = C.accent2; ctx.shadowBlur = len * 0.07;
  ctx.beginPath();
  ctx.moveTo(-bladeW*0.4, -len*0.06);
  ctx.lineTo(-bladeW*0.4, -len*0.86);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // lightning arcing along the blade
  if (opts.lightning !== false) {
  lightningPath(ctx, 0, -len*0.05, 0, -len*0.9, len*0.05, glow);
  }

  // ---- tsuba (guard) ----
  ctx.fillStyle = '#0b1220';
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = len * 0.012;
  ctx.shadowColor = C.accent2; ctx.shadowBlur = len*0.03;
  ctx.beginPath();
  ctx.ellipse(0, 0, bladeW * 3.2, bladeW * 1.1, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  // ---- tsuka (handle) with wrap ----
  var hLen = len * 0.28;
  ctx.fillStyle = '#0a0f1a';
  ctx.fillRect(-bladeW * 1.1, 0, bladeW * 2.2, hLen);
  ctx.strokeStyle = 'rgba(' + C.core + ',0.85)';
  ctx.lineWidth = len * 0.008;
  for (var i = 1; i < 6; i++) {
  var yy = (hLen / 6) * i;
  ctx.beginPath();
  ctx.moveTo(-bladeW * 1.1, yy - 3);
  ctx.lineTo( bladeW * 1.1, yy + 3);
  ctx.stroke();
  }
  // pommel
  ctx.fillStyle = '#0b1220';
  ctx.beginPath(); ctx.arc(0, hLen, bladeW * 1.3, 0, Math.PI*2); ctx.fill();

  ctx.restore();
  }

  /* ---- Lightning bolt path -----------------------------------------------
  Jagged electric arc from (x1,y1) to (x2,y2). `jag` = max lateral offset.
  Redraws each frame with randomized offsets for a live crackle.
  `intensity` (0..1) scales brightness/glow. */
  function lightningPath(ctx, x1, y1, x2, y2, jag, intensity) {
  intensity = intensity == null ? 1 : intensity;
  var segs = 9;
  var dx = (x2 - x1) / segs, dy = (y2 - y1) / segs;
  ctx.save();
  ctx.lineCap = 'round';
  // outer glow pass (palette)
  ctx.strokeStyle = 'rgba(' + C.glow + ',' + (0.35*intensity).toFixed(2) + ')';
  ctx.lineWidth = jag * 0.9;
  ctx.shadowColor = C.accent2; ctx.shadowBlur = 16;
  strokeJag();
  // bright core pass
  ctx.strokeStyle = 'rgba(235,248,255,' + (0.95*intensity).toFixed(2) + ')';
  ctx.lineWidth = Math.max(1, jag * 0.28);
  ctx.shadowBlur = 8;
  strokeJag();
  ctx.restore();

  function strokeJag() {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (var i = 1; i < segs; i++) {
  var ox = (Math.random() - 0.5) * jag * 2;
  var oy = (Math.random() - 0.5) * jag * 0.6;
  ctx.lineTo(x1 + dx*i + ox, y1 + dy*i + oy);
  // occasional forked branch
  if (Math.random() < 0.25) {
  var bx = x1 + dx*i + ox, by = y1 + dy*i + oy;
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + (Math.random()-0.5)*jag*3, by + (Math.random()-0.5)*jag*2);
  ctx.moveTo(x1 + dx*i + ox, y1 + dy*i + oy);
  }
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
  }
  }

  /* Radiating lightning aura around a point (for shields, auras, alerts). */
  function drawAura(ctx, cx, cy, radius, bolts, intensity, t) {
  for (var i = 0; i < bolts; i++) {
  var a = (i / bolts) * Math.PI * 2 + t * 0.6;
  var r0 = radius * (0.55 + Math.random()*0.1);
  var r1 = radius * (0.95 + Math.random()*0.25);
  lightningPath(ctx,
  cx + Math.cos(a)*r0, cy + Math.sin(a)*r0,
  cx + Math.cos(a)*r1, cy + Math.sin(a)*r1,
  radius*0.03, intensity);
  }
  }

  /* ---- Reishi particle field ---------------------------------------------
  Drifting spirit particles with a blue glow. Attach to a full-box canvas.
  opts: { count, drift (px/s up), color } */
  function Reishi(canvas, opts) {
  opts = opts || {};
  var self = this;
  this.canvas = canvas;
  this.count  = opts.count || 90;
  this.drift  = opts.drift || 14;
  this.color  = opts.color || C.reishi;
  this.parts  = [];
  var dim = hi(canvas);
  this.ctx = dim.ctx; this.w = dim.w; this.h = dim.h;

  function seed(p, fresh) {
  p.x = Math.random() * self.w;
  p.y = fresh ? self.h + Math.random() * 40 : Math.random() * self.h;
  p.r = 0.6 + Math.random() * 2.4;
  p.sp = 0.4 + Math.random() * 1.4;  // vertical speed multiplier
  p.sway = 0.3 + Math.random() * 0.9;
  p.phase = Math.random() * Math.PI * 2;
  p.tw = 0.02 + Math.random() * 0.05;
  p.a = 0.2 + Math.random() * 0.7;
  p.hot = Math.random() < 0.25;  // some glow red
  }
  for (var i = 0; i < this.count; i++) { var p = {}; seed(p, false); this.parts.push(p); }

  window.addEventListener('resize', function () {
  var d = hi(canvas); self.ctx = d.ctx; self.w = d.w; self.h = d.h;
  });

  this.step = function (t, dt) {
  var ctx = self.ctx;
  ctx.clearRect(0, 0, self.w, self.h);
  for (var i = 0; i < self.parts.length; i++) {
  var p = self.parts[i];
  p.y -= self.drift * p.sp * dt;
  p.x += Math.sin(t * p.sway + p.phase) * 0.3;
  p.phase += p.tw;
  if (p.y < -10) seed(p, true);
  var alpha = p.a * (0.5 + 0.5 * Math.abs(Math.sin(p.phase)));
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fillStyle = p.hot
  ? 'rgba(' + C.glow + ',' + alpha.toFixed(2) + ')'
  : 'rgba(234,244,255,' + alpha.toFixed(2) + ')';
  ctx.shadowColor = p.hot ? C.accent2 : 'rgba(' + C.core + ',0.6)';
  ctx.shadowBlur = p.hot ? 12 : 6;
  ctx.fill();
  }
  };
  }

  /* ---- Akatsuki cloud + shuriken (mirrors website background.js) ---------- */

  // Akatsuki cloud path (same silhouette as the website), centered at origin.
  function cloudPath() {
  var p = new Path2D();
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
  var _cloud = cloudPath();

  function drawCloud(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.shadowColor = C.cloudGlow; ctx.shadowBlur = 26;
  ctx.strokeStyle = C.cloudStroke; ctx.lineWidth = 14; ctx.stroke(_cloud);
  ctx.shadowBlur = 12; ctx.stroke(_cloud);
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.cloudFill; ctx.fill(_cloud);
  ctx.strokeStyle = C.cloudLine; ctx.lineWidth = 4.5; ctx.stroke(_cloud);
  ctx.restore();
  }

  function drawShuriken(ctx, x, y, scale, rot) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale); ctx.rotate(rot || 0);
  var blade = new Path2D();
  for (var i = 0; i < 4; i++) {
  var a = (i / 4) * Math.PI * 2, a2 = a + Math.PI / 4;
  blade.moveTo(0, 0);
  blade.lineTo(Math.cos(a) * 92, Math.sin(a) * 92);
  blade.lineTo(Math.cos(a2) * 34, Math.sin(a2) * 34);
  }
  blade.closePath();
  ctx.fillStyle = C.shuriFill; ctx.shadowColor = C.shuriGlow; ctx.shadowBlur = 18; ctx.fill(blade);
  ctx.shadowBlur = 0; ctx.strokeStyle = C.shuriEdge; ctx.lineWidth = 5; ctx.stroke(blade);
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fillStyle = C.shuriHoleFill; ctx.fill();
  ctx.strokeStyle = C.shuriHoleRing; ctx.lineWidth = 5; ctx.stroke();
  ctx.restore();
  }

  /* Drifting field of Akatsuki clouds + shuriken across a full-box canvas.
  Matches the website's floating-symbol background. opts:{ count } */
  function CloudField(canvas, opts) {
  opts = opts || {};
  var self = this;
  var dim = hi(canvas); this.ctx = dim.ctx; this.w = dim.w; this.h = dim.h; this.canvas = canvas;
  this.items = [];
  var count = opts.count || 10;
  function seed(it) {
  it.x = Math.random() * self.w;
  it.baseY = Math.random() * self.h;
  it.scale = 0.35 + Math.random() * 0.65;
  it.drift = (6 + Math.random() * 10) * (Math.random() < 0.5 ? -1 : 1); // px/s horizontal
  it.floatAmp = 8 + Math.random() * 18;
  it.floatSpd = 0.25 + Math.random() * 0.45;
  it.phase = Math.random() * Math.PI * 2;
  it.type = Math.random() < 0.7 ? 'cloud' : 'shuriken'; // clouds dominate, like the site
  it.spin = (Math.random() - 0.5) * 0.5;
  it.rot = Math.random() * Math.PI * 2;
  it.op = 0.55 + Math.random() * 0.35;
  }
  for (var i = 0; i < count; i++) { var it = {}; seed(it); this.items.push(it); }
  window.addEventListener('resize', function () { var d = hi(canvas); self.ctx = d.ctx; self.w = d.w; self.h = d.h; });
  this.step = function (t, dt) {
  var ctx = self.ctx; ctx.clearRect(0, 0, self.w, self.h);
  for (var i = 0; i < self.items.length; i++) {
  var it = self.items[i];
  it.x += it.drift * dt;
  if (it.x < -180) it.x = self.w + 160;
  if (it.x > self.w + 180) it.x = -160;
  it.rot += it.spin * dt * 0.4;
  var y = it.baseY + Math.sin(t * it.floatSpd + it.phase) * it.floatAmp;
  ctx.save(); ctx.globalAlpha = it.op;
  if (it.type === 'cloud') drawCloud(ctx, it.x, y, it.scale);
  else drawShuriken(ctx, it.x, y, it.scale, it.rot);
  ctx.restore();
  }
  };
  }

  window.Solashur = {
  colors: C,
  palette: function () { return C; },
  theme: themeName,
  hi: hi,
  raf: raf,
  drawEclipseMoon: drawEclipseMoon,
  drawWing: drawWing,
  drawWings: drawWings,
  drawBlade: drawBlade,
  drawCloud: drawCloud,
  drawShuriken: drawShuriken,
  lightningPath: lightningPath,
  drawAura: drawAura,
  Reishi: Reishi,
  CloudField: CloudField
  };
})();

