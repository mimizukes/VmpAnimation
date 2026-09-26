// ─────────────────────────────────────────────────────────────
//  Sets: reusable locations. Each is a pure function of time.
// ─────────────────────────────────────────────────────────────

const HZ = 600; // horizon for street sets

function nightSky(ctx, t, dawn = 0, hz = HZ, starA = 1) {
  const top = mix('#04050d', '#23285e', dawn), mid = mix('#0a0d22', '#6b4f8e', dawn), low = mix('#1b1f40', '#f0937a', dawn);
  ctx.fillStyle = vgrad(ctx, 0, hz, [[0, top], [0.62, mid], [1, low]]);
  ctx.fillRect(-W, -H, W * 3, hz + H + 2);
  if (dawn < 1) stars(ctx, t, 150, 3, hz * 0.85, (1 - dawn) * starA);
}

function skyline(ctx, t, hz, seed, col, litA = 1) {
  const r = mulberry32(seed);
  const blocks = [];
  let x = -40;
  while (x < W + 40) { const w = 70 + r() * 170, h = 24 + r() * 110; blocks.push([x, w, h, r()]); x += w - 2; }
  ctx.fillStyle = col;
  for (const [x0, w, h, k] of blocks) {
    if (k < 0.45) {
      // gabled house
      ctx.beginPath(); ctx.moveTo(x0, hz); ctx.lineTo(x0, hz - h * 0.6); ctx.lineTo(x0 + w / 2, hz - h); ctx.lineTo(x0 + w, hz - h * 0.6); ctx.lineTo(x0 + w, hz); ctx.fill();
    } else ctx.fillRect(x0, hz - h, w, h + 1);
  }
  if (litA > 0) for (const [x0, w, h, k] of blocks) {
    const rr = mulberry32(Math.floor(x0 * 13));
    for (let i = 0; i < 4; i++) if (rr() < 0.28) {
      ctx.fillStyle = rgba(rr() > 0.4 ? '#ffe2a0' : '#bcdcff', 0.7 * litA);
      ctx.fillRect(x0 + 10 + rr() * (w - 26), hz - h * (0.2 + rr() * 0.4), 9, 11);
    }
  }
}

// road seen straight down its length, converging at (960, HZ)
function roadHalf(y) { return 900 * (y - HZ) / (H - HZ); }

function perspectivePoles(ctx, t, dawn, col) {
  const zs = [1.25, 2.1, 3.4, 5.6, 9];
  const anchors = { L: [], R: [] };
  for (const side of [-1, 1]) {
    for (const z of zs) {
      const by = HZ + 480 / z, bx = 960 + side * 1150 / z, h = 1000 / z;
      const a = drawUtilityPole(ctx, bx, by, h, 1 / z, { col, transformer: z < 3, plate: z < 1.5 ? (side < 0 ? '月見町三丁目' : '夜更坂') : null });
      anchors[side < 0 ? 'L' : 'R'].push(a);
    }
  }
  for (const k of ['L', 'R']) {
    const A = anchors[k];
    for (let i = 0; i < A.length - 1; i++) for (let j = 0; j < 4; j++) {
      const p = A[i][j], q = A[i + 1][j];
      wire(ctx, p[0], p[1], q[0], q[1], 14 / (i + 1), col, 2.2 / (i * 0.5 + 1));
    }
    // wires flying off towards the camera
    for (let j = 0; j < 4; j++) {
      const p = A[0][j];
      wire(ctx, p[0], p[1], p[0] + (k === 'L' ? -700 : 700), p[1] - 60, 40, col, 3);
    }
  }
  // a couple of wires crossing the road overhead
  const a = anchors.L[1][1], b = anchors.R[1][2];
  wire(ctx, a[0], a[1], b[0], b[1], 30, col, 2);
}

// ── Railway crossing, symmetrical, looking down the road ─────
// o: {dawn, moon, gates (0 down .. 1 up), bell, girl(ctx) callback, train(ctx) callback}
function setCrossing(ctx, t, o = {}) {
  const dawn = o.dawn || 0;
  nightSky(ctx, t, dawn);
  if (o.moon !== false) drawMoon(ctx, 960, 230 + dawn * 160, 140, mix('#fff4d6', '#f7e6ef', dawn), 1 - dawn * 0.6);
  skyline(ctx, t, HZ, 21, mix('#07080f', '#2a2140', dawn), 1 - dawn);
  const poleCol = mix('#050508', '#1a1426', dawn);
  // ground + road
  ctx.fillStyle = mix('#0c0c12', '#2a2335', dawn); ctx.fillRect(0, HZ, W, H - HZ);
  ctx.fillStyle = mix('#16171e', '#352c42', dawn);
  ctx.beginPath(); ctx.moveTo(960, HZ); ctx.lineTo(960 + 900, H); ctx.lineTo(960 - 900, H); ctx.closePath(); ctx.fill();
  // edge lines
  ctx.strokeStyle = rgba('#e9e6dc', 0.55); ctx.lineWidth = 6;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(960 + s * 6, HZ); ctx.lineTo(960 + s * 820, H); ctx.stroke(); }
  // track bed across the frame
  ctx.fillStyle = mix('#1c1b20', '#3b3346', dawn); ctx.fillRect(0, 722, W, 64);
  const r = mulberry32(5);
  ctx.fillStyle = rgba('#8f8a86', 0.25);
  for (let i = 0; i < 500; i++) ctx.fillRect(r() * W, 722 + r() * 64, 3, 2);
  ctx.fillStyle = mix('#2a2a30', '#4a4056', dawn);
  ctx.beginPath(); ctx.moveTo(960 - roadHalf(722) - 30, 722); ctx.lineTo(960 + roadHalf(722) + 30, 722); ctx.lineTo(960 + roadHalf(786) + 30, 786); ctx.lineTo(960 - roadHalf(786) - 30, 786); ctx.fill();
  ctx.fillStyle = rgba('#c9ccd4', 0.75);
  ctx.fillRect(0, 734, W, 4); ctx.fillRect(0, 770, W, 5);
  // 止まれ painted on the road
  ctx.save();
  ctx.translate(960, 870);
  ctx.scale(1, 0.32);
  txt(ctx, '止まれ', 0, 0, { size: 190, color: rgba('#f0ede4', 0.6), weight: 800, ls: 0.1 });
  ctx.restore();
  ctx.fillStyle = rgba('#f0ede4', 0.55); ctx.fillRect(960 - roadHalf(820) * 0.8, 820, roadHalf(820) * 1.6, 10);

  perspectivePoles(ctx, t, dawn, poleCol);

  const gate = o.gates ?? 0;
  const bell = o.bell ?? true;
  // far side: signals, gates, girl
  drawCrossingSignal(ctx, 960 - 262, 700, 0.6, t, bell, false);
  drawCrossingSignal(ctx, 960 + 262, 700, 0.6, t + 0.2, bell, true);
  drawGateArm(ctx, 960 - 250, 650, 230, -gate * Math.PI / 2, 0.6);
  ctx.save(); ctx.translate(960 + 250, 650); ctx.scale(-1, 1); drawGateArm(ctx, 0, 0, 230, -gate * Math.PI / 2, 0.6); ctx.restore();
  if (o.girl) o.girl(ctx);
  if (o.train) o.train(ctx);
  // near side
  drawCrossingSignal(ctx, 960 - 470, 830, 1.05, t, bell, false);
  drawCrossingSignal(ctx, 960 + 470, 830, 1.05, t + 0.2, bell, true);
  drawGateArm(ctx, 960 - 450, 760, 450, -gate * Math.PI / 2, 1.05);
  ctx.save(); ctx.translate(960 + 450, 760); ctx.scale(-1, 1); drawGateArm(ctx, 0, 0, 450, -gate * Math.PI / 2, 1.05); ctx.restore();
  if (bell) {
    additive(ctx, () => {
      crossingGlow(ctx, 960 - 470, 830, 1.05, t);
      crossingGlow(ctx, 960 + 470, 830, 1.05, t + 0.2, true);
      crossingGlow(ctx, 960 - 262, 700, 0.6, t);
      crossingGlow(ctx, 960 + 262, 700, 0.6, t + 0.2, true);
      // red wash over the road, alternating sides
      const ph = Math.floor(t * 2.3) % 2;
      ctx.save(); ctx.translate(ph ? 1300 : 620, 900); ctx.scale(1.6, 0.4);
      glow(ctx, 0, 0, 420, '#ff1020', 0.22, 0.4);
      ctx.restore();
    });
  }
}

// ── Konbini + vending machines at night ─────────────────────
function setKonbini(ctx, t, o = {}) {
  nightSky(ctx, t, 0, 620);
  drawMoon(ctx, 300, 170, 70, '#fff4d6', 0.9);
  drawApartments(ctx, 980, 620, 520, 420, t, 4, 0.22);
  drawApartments(ctx, 1560, 620, 420, 330, t, 8, 0.3);
  drawApartments(ctx, -40, 620, 360, 260, t, 12, 0.18);
  skyline(ctx, t, 620, 9, '#07080f');
  // ground
  ctx.fillStyle = '#121218'; ctx.fillRect(0, 620, W, H - 620);
  ctx.fillStyle = '#1a1a22'; ctx.fillRect(0, 812, W, H - 812);
  ctx.strokeStyle = rgba('#e9e6dc', 0.4); ctx.lineWidth = 5;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(1000 + i * 150, 830); ctx.lineTo(900 + i * 190, H); ctx.stroke(); }
  // curb stops
  ctx.fillStyle = '#34343c';
  for (let i = 0; i < 5; i++) ctx.fillRect(1030 + i * 160, 850, 80, 14);

  drawKonbini(ctx, 880, 812, 980, 430, t);
  const vms = [[330, '#e9e6df', RED, 2], [500, '#1f6fd1', '#ffffff', 3], [670, '#e9e6df', '#1b998b', 5]];
  for (const [x, body, acc, seed] of vms) drawVending(ctx, x, 812 - 183 * 1.5, 1.5, t, { body, accent: acc, seed, side: 10, brand: seed === 3 ? 'MOON' : 'LUNA' });
  // trash bins by the machines
  ctx.fillStyle = '#2f5e3a'; ctx.fillRect(830, 740, 40, 72);
  ctx.fillStyle = '#1f3f88'; ctx.fillRect(250, 752, 40, 60);

  // wires & pole (strong diagonals)
  const pa = drawUtilityPole(ctx, 180, 830, 820, 1.1, { plate: '月見町三丁目' });
  for (let j = 0; j < pa.length; j++) wire(ctx, pa[j][0], pa[j][1], W + 100, 40 + j * 36, 60, '#040406', 3);
  for (let j = 0; j < 3; j++) wire(ctx, -50, 300 + j * 30, pa[j][0], pa[j][1], 20, '#040406', 3);

  if (o.girl) o.girl(ctx);

  additive(ctx, () => {
    for (const [x] of vms) vendingGlow(ctx, x, 812 - 183 * 1.5, 1.5, 0.9);
    glow(ctx, 1370, 640, 700, '#dff1ff', 0.35, 0.3);
    ctx.save(); ctx.translate(1370, 840); ctx.scale(1, 0.25); glow(ctx, 0, 0, 800, '#dff1ff', 0.4, 0.4); ctx.restore();
  });
  // moths circling the lights
  mothSwarm(ctx, t, 9, 1370, 470, 380, 120, 0.22, 11);
  mothSwarm(ctx, t, 5, 580, 620, 180, 90, 0.18, 17);
}

// small moths orbiting a light on wobbly paths
function mothSwarm(ctx, t, n, cx, cy, rx, ry, s, seed, col) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const sp = 0.6 + r() * 1.4, ph = r() * TAU, rr = 0.4 + r() * 0.6, dir = r() < 0.5 ? -1 : 1;
    const a = t * sp * dir + ph;
    const x = cx + Math.cos(a) * rx * rr + noise1(t * 2 + i * 7) * 30;
    const y = cy + Math.sin(a * 1.3) * ry * rr + noise1(t * 2.3 + i * 3) * 24;
    const fl = 0.5 + 0.5 * Math.sin(t * 38 + i);
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawMoth(ctx, x, y, s * (0.7 + r() * 0.6), a * dir + Math.PI / 2, fl, 1, true);
    ctx.restore();
  }
}

// ── Low-angle sky with wires: backdrop for her bust shots ────
function setLowSky(ctx, t, o = {}) {
  const c1 = o.c1 || '#0b2a33', c2 = o.c2 || '#16505a';
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, c1], [1, c2]]);
  ctx.fillRect(-W, -H, W * 3, H * 3);
  stars(ctx, t, 60, 8, H * 0.8, 0.5);
  if (o.moon !== false) drawMoon(ctx, 1500, 230, 190, '#fff4d6', 0.95);
  // tilted pole + wires crossing the frame
  ctx.save();
  ctx.translate(250, 1300);
  ctx.rotate(0.22);
  ctx.fillStyle = '#05080a';
  ctx.fillRect(-26, -1500, 52, 1500);
  ctx.fillRect(-170, -1380, 340, 16);
  ctx.fillRect(-170, -1250, 340, 16);
  roundRect(ctx, 30, -1180, 80, 140, 10); ctx.fill();
  ctx.restore();
  for (let j = 0; j < 5; j++) wire(ctx, -100, 120 + j * 55, W + 100, -60 + j * 95, 70 + j * 10, '#05080a', 4);
}

// ── White void with infinite vending machines ───────────────
function setVoid(ctx, t, o = {}) {
  const bg = o.bg || '#eee7da';
  fillAll(ctx, bg);
  const vpx = 960, vpy = 470;
  // floor grid
  ctx.strokeStyle = rgba('#1a1a1a', 0.14); ctx.lineWidth = 2;
  for (let i = -24; i <= 24; i++) { ctx.beginPath(); ctx.moveTo(vpx, vpy); ctx.lineTo(vpx + i * 180, H + 400); ctx.stroke(); }
  const speed = o.speed ?? 0.35;
  for (let k = 0; k < 16; k++) {
    const z = ((k - (t * speed) % 1) + 16) % 16 + 0.6;
    const y = vpy + 620 / z;
    ctx.globalAlpha = clamp(1.2 - z / 16);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // horizon line
  ctx.fillStyle = RED; ctx.fillRect(0, vpy - 1, W, 3);

  // giant clock
  if (o.clock !== false) drawBigClock(ctx, t, vpx, 240, 170, o.clockA ?? 1);

  // two rows of machines receding, drawn far to near
  const items = [];
  for (let k = 0; k < 14; k++) {
    const z = ((k - (t * speed) % 1) + 14) % 14 + 0.5;
    for (const side of [-1, 1]) items.push({ z, side, k });
  }
  items.sort((a, b) => b.z - a.z);
  for (const it of items) {
    const s = 3.6 / it.z;
    const bx = vpx + it.side * 700 / it.z - 50 * s;
    const by = vpy + 620 / it.z - 183 * s;
    ctx.globalAlpha = clamp(1.3 - it.z / 14);
    drawVending(ctx, bx, by, s, t, { body: RED, accent: '#111111', seed: it.k * 3 + (it.side > 0 ? 1 : 0), lit: 1 });
    ctx.globalAlpha = 1;
  }
  if (o.center) o.center(ctx);
}

function drawBigClock(ctx, t, x, y, r, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba('#000000', 0.12);
  ctx.beginPath(); ctx.ellipse(x, y + r + 60, r * 0.8, 12, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#faf6ee'; ctx.fill();
  ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const an = i / 60 * TAU, l = i % 5 ? 10 : 24;
    ctx.beginPath(); ctx.moveTo(x + Math.sin(an) * (r - 14), y - Math.cos(an) * (r - 14));
    ctx.lineTo(x + Math.sin(an) * (r - 14 - l), y - Math.cos(an) * (r - 14 - l));
    ctx.lineWidth = i % 5 ? 2 : 6; ctx.strokeStyle = '#111'; ctx.stroke();
  }
  const hand = (an, len, w, col) => {
    ctx.beginPath(); ctx.moveTo(x - Math.sin(an) * 16, y + Math.cos(an) * 16); ctx.lineTo(x + Math.sin(an) * len, y - Math.cos(an) * len);
    ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke();
  };
  hand((2 + 47 / 60) / 12 * TAU, r * 0.5, 12, '#111');
  hand(47 / 60 * TAU, r * 0.78, 8, '#111');
  // the second hand runs, but it never gets anywhere
  const sec = Math.floor(t) % 60 + Math.min(1, (t % 1) * 8);
  hand(sec / 60 * TAU, r * 0.84, 3, RED);
  ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fillStyle = RED; ctx.fill();
  ctx.restore();
}

// ── Shadows on asphalt, seen from above ──────────────────────
// A human shadow cast forward by a lamp behind; beside it, only a
// parasol's shadow. She doesn't cast one.
function shadowHuman(ctx, x, y, ang, len, ph) {
  const sw = Math.sin(ph) * 46, asw = -Math.sin(ph) * 30;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang + Math.PI / 2);
  ctx.scale(0.42, len / 1000);
  ctx.beginPath();
  tracePath(ctx, `M -74 -480 L -8 -480 L ${-26 + sw} -8 L ${-66 + sw} -8 Z`);
  tracePath(ctx, `M 8 -480 L 74 -480 L ${66 - sw} -8 L ${26 - sw} -8 Z`);
  tracePath(ctx, 'M -82 -470 C -92 -600 -112 -760 -124 -806 L 124 -806 C 112 -760 92 -600 82 -470 Z');
  tracePath(ctx, `M -124 -806 L -160 -800 L ${-166 + asw} -476 L ${-128 + asw} -470 Z`);
  tracePath(ctx, `M 124 -806 L 160 -800 L ${166 - asw} -476 L ${128 - asw} -470 Z`);
  ctx.rect(-24, -850, 48, 60);
  ctx.ellipse(0, -912, 66, 78, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function shadowParasol(ctx, x, y, ang, len, bob) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang + Math.PI / 2);
  ctx.scale(0.42, len / 1000);
  ctx.fillRect(-10, -1180 + bob, 20, 560);
  ctx.beginPath();
  const cy = -1250 + bob;
  for (let i = 0; i <= 36; i++) {
    const a = i / 36 * TAU, rr = 1 - (i % 3 === 0 ? 0.05 : 0);
    const px = Math.cos(a) * 360 * rr, py = cy + Math.sin(a) * 150 * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.fill();
  ctx.restore();
}
function setShadowWalk(ctx, t, o = {}) {
  const speed = 140;
  fillAll(ctx, '#2a2a30');
  // asphalt speckle (scrolls toward the camera as we walk)
  const off = (t * speed) % 240;
  const r = mulberry32(2);
  for (let i = 0; i < 1400; i++) {
    const x = r() * W, y = ((r() * (H + 240) + off) % (H + 240)) - 120;
    ctx.fillStyle = r() > 0.5 ? rgba('#3d3d45', 0.9) : rgba('#17171c', 0.9);
    ctx.fillRect(x, y, 3, 3);
  }
  // cracks
  ctx.strokeStyle = rgba('#141418', 0.8); ctx.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    const y0 = ((k * 520 + t * speed) % 2080) - 400;
    ctx.beginPath(); ctx.moveTo(200 + k * 330, y0);
    for (let j = 1; j < 6; j++) ctx.lineTo(200 + k * 330 + noise1(k * 9 + j) * 60 + j * 30, y0 + j * 40);
    ctx.stroke();
  }
  // lane edge on the left, dashed centre on the right
  ctx.fillStyle = rgba('#e8e4da', 0.7); ctx.fillRect(250, -10, 18, H + 20);
  for (let k = -1; k < 6; k++) {
    const y = ((k * 260 + t * speed) % (260 * 6)) - 260;
    ctx.fillRect(1650, y, 16, 140);
  }
  // painted text and a manhole go by
  const ty = ((t * speed + 300) % 2600) - 700;
  ctx.save(); ctx.translate(560, ty); txt(ctx, '止まれ', 0, 0, { size: 150, color: rgba('#e8e4da', 0.4), weight: 800, ls: 0.1 }); ctx.restore();
  const my = ((t * speed + 1500) % 2600) - 700;
  ctx.save(); ctx.translate(1420, my);
  ctx.beginPath(); ctx.arc(0, 0, 96, 0, TAU); ctx.fillStyle = '#3b3a3e'; ctx.fill();
  ctx.strokeStyle = '#1c1c20'; ctx.lineWidth = 7; ctx.stroke();
  for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i / 8 * TAU); drawMoth(ctx, 0, -52, 0.42, 0, 0, 0.8, true, '#232226'); ctx.restore(); }
  ctx.restore();

  // lamp light from behind us, swelling and fading as we pass lamps
  const cyc = t * 0.55;
  const k = 0.5 + 0.5 * Math.sin(cyc);
  additive(ctx, () => {
    ctx.save(); ctx.translate(900, H + 120); ctx.scale(1.6, 1);
    glow(ctx, 0, 0, 900 + 300 * k, '#ffdca0', 0.2 + 0.1 * (1 - k), 0.45);
    ctx.restore();
  });
  const len = 640 + 200 * k;
  const ang = -Math.PI / 2 - 0.12 + Math.sin(cyc + 0.8) * 0.08;
  ctx.fillStyle = `rgba(6,6,10,${0.8 - 0.25 * k})`;
  shadowHuman(ctx, 760, 1100, ang, len, t * 5.4);
  shadowParasol(ctx, 1150, 1100, ang, len, Math.sin(t * 5.4) * 12);
  // where her feet would be: nothing at all
  if (o.sign) o.sign(ctx);
}

// ── Dawn street: lamps receding, sky turning ────────────────
// o: {dawn, lampsOff (0..1), sun}
function setDawnStreet(ctx, t, o = {}) {
  const d = o.dawn ?? 0.3;
  nightSky(ctx, t, d, 640);
  if (o.sun > 0) {
    const sy = 640 - o.sun * 90;
    additive(ctx, () => {
      glow(ctx, 960, sy, 900 * (0.4 + o.sun), '#ffcf8a', 0.55 * o.sun, 0.2);
      glow(ctx, 960, sy, 260, '#fff6e0', 0.9 * o.sun, 0.3);
    });
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, 640); ctx.clip();
    ctx.beginPath(); ctx.arc(960, sy + 40, 80, 0, TAU); ctx.fillStyle = '#fffaf0'; ctx.fill();
    ctx.restore();
  }
  // river-side town silhouette
  skyline(ctx, t, 640, 31, mix('#1a1430', '#3a2a48', d), 1 - d);
  ctx.fillStyle = mix('#120f1e', '#3a2c40', d); ctx.fillRect(0, 640, W, H - 640);
  // road converging
  ctx.fillStyle = mix('#1b1828', '#4a3a50', d);
  ctx.beginPath(); ctx.moveTo(960, 640); ctx.lineTo(1860, H); ctx.lineTo(60, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba('#f0e6e0', 0.5); ctx.lineWidth = 5;
  for (let k = 0; k < 10; k++) {
    const z0 = 1 + k * 1.1, z1 = z0 + 0.5;
    const y0 = 640 + 440 / z0, y1 = 640 + 440 / z1;
    ctx.beginPath(); ctx.moveTo(960, y0); ctx.lineTo(960, y1); ctx.stroke();
  }
  // lamps down both sides; they switch off far to near
  const lamps = [];
  for (let i = 7; i >= 0; i--) {
    const z = 1.2 + i * 0.9;
    for (const side of [-1, 1]) lamps.push({ z, side, i });
  }
  const offCount = o.lampsOff ?? 0;
  for (const L of lamps) {
    const s = 1 / L.z, bx = 960 + L.side * 1050 * s, by = 640 + 440 * s;
    const on = offCount < (8 - L.i) / 8.5 ? 1 : 0;
    L.on = on; L.bx = bx; L.by = by; L.s = s;
    drawStreetlight(ctx, bx, by, 820 * s, -L.side, on, s * 1.6);
  }
  additive(ctx, () => { for (const L of lamps) streetlightGlow(ctx, L.bx, L.by, 820 * L.s, -L.side, L.on, L.s * 1.6); });
  // wires
  for (const side of [-1, 1]) for (let j = 0; j < 3; j++) wire(ctx, 960 + side * 2000, 150 + j * 40, 960 + side * 60, 600 + j * 4, 30, mix('#07060c', '#241a30', d), 3);
}
