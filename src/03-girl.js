// ─────────────────────────────────────────────────────────────
//  夜更 朝日 (Yofuke Asahi): blonde vampire, 600-ish, yukata, parasol
//  Portrait space: origin between the eyes at eye level, y down.
//  Face ~320 wide, hair top ≈ -245, chin ≈ 180.
// ─────────────────────────────────────────────────────────────

const HAIR = { base: '#f7dc8f', light: '#fff5cf', shade: '#e2b659', deep: '#b98a34', line: '#8a5a22' };
const SKIN = { base: '#fff2ea', shade: '#f6d0c3', deep: '#e9b3a6', line: '#9a5448', blush: '#ff8796' };
const EYEC = { i0: '#3d000c', i1: '#a8122b', i2: '#ff5d45', lash: '#2a1212', pupil: '#14000a' };
const YUK = { base: '#1c2254', shade: '#12163a', line: '#07081c', pat: '#a6e8cf', band: '#262d66', obi: '#c3152f', obiS: '#8c0c20', cord: '#a6e8cf' };
const MOTHC = { wing: '#c9f0d8', edge: '#f4fff8', vein: '#8fc8aa', lead: '#8a5a78', spot: '#f0c34a', body: '#fbfff6' };

// ── bangs outline, built once from a tip/valley list ─────────
const BANG_PTS = [
  [-194, -56],
  [-174, 84], [-152, -30], [-138, 8], [-122, -60], [-98, -20], [-86, -52], [-66, -2],
  [-50, -72], [-26, -32], [-12, -62], [8, 18], [20, -52], [36, -20], [52, -74], [80, -8],
  [94, -58], [114, -30], [126, -62], [144, 6], [158, -34], [176, 84],
  [194, -56],
];
const BANGS = (() => {
  let d = `M ${BANG_PTS[0][0]} ${BANG_PTS[0][1]}`;
  for (let i = 1; i < BANG_PTS.length; i++) {
    const [ax, ay] = BANG_PTS[i - 1], [bx, by] = BANG_PTS[i];
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const L = Math.hypot(bx - ax, by - ay) || 1;
    const down = by > ay;
    const sx = Math.sign(down ? bx : ax) || 1;
    // strands flick outward at the tips, valleys stay tight
    const cx = down ? mx + sx * 0.16 * L : mx - sx * 0.04 * L;
    const cy = down ? my - 0.08 * L : my + 0.02 * L;
    d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${bx} ${by}`;
  }
  d += ' C 206 -300 -206 -300 -192 -58 Z';
  return d;
})();

const FACE = 'M -160 -70 C -162 10 -148 72 -110 116 C -80 148 -38 166 0 171 C 38 166 80 148 110 116 C 148 72 162 10 160 -70 C 158 -210 -158 -210 -160 -70 Z';
const EAR_SHADOW = 'M -161 -30 C -156 40 -144 84 -112 116 C -134 80 -146 40 -150 -30 Z';

const SIDELOCK_L = 'M -190 -62 C -204 40 -220 150 -228 262 C -236 382 -232 470 -210 562 C -204 522 -198 494 -188 474 C -182 504 -176 526 -162 542 C -170 444 -172 334 -170 234 C -168 124 -164 40 -150 -44 Z';
const SIDELOCK_L_SHADE = 'M -178 20 C -190 120 -198 240 -200 360 C -202 430 -198 480 -190 520 C -188 470 -186 420 -184 380 C -182 300 -180 200 -170 100 Z';
const AHOGE = 'M 4 -262 C 6 -312 44 -336 70 -318 C 44 -318 26 -300 18 -262 Z';

function mirrorShape(d) {
  return d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${-parseFloat(x)} ${y}`);
}
const SIDELOCK_R = mirrorShape(SIDELOCK_L);
const SIDELOCK_R_SHADE = mirrorShape(SIDELOCK_L_SHADE);

// back hair, parametrised by length (portrait units, bottom y)
const _backHairCache = new Map();
function backHairPath(len) {
  const key = Math.round(len);
  if (_backHairCache.has(key)) return _backHairCache.get(key);
  const spread = 250 + len * 0.06;
  let d = 'M -176 -110 C -186 -296 186 -296 176 -110';
  d += ` C 222 40 ${spread - 20} ${len * 0.35} ${spread} ${len * 0.8}`;
  d += ` Q ${spread + 6} ${len * 0.92} ${spread - 10} ${len}`;
  const n = 9;
  for (let i = 1; i <= n; i++) {
    const x = lerp(spread - 10, -(spread - 10), i / n);
    const up = i % 2 ? len - 46 - (i % 3) * 14 : len + 10;
    d += ` L ${x.toFixed(1)} ${up}`;
  }
  d += ` Q ${-spread - 6} ${len * 0.92} ${-spread} ${len * 0.8}`;
  d += ` C ${-(spread - 20)} ${len * 0.35} -222 40 -176 -110 Z`;
  const inner = `M -150 40 C -176 ${len * 0.3} -196 ${len * 0.6} -206 ${len * 0.95} L 206 ${len * 0.95} C 196 ${len * 0.6} 176 ${len * 0.3} 150 40 Z`;
  const r = { d, inner };
  _backHairCache.set(key, r);
  return r;
}

// ── helpers ──────────────────────────────────────────────────
function hairGrad(ctx, y0, y1) {
  return vgrad(ctx, y0, y1, [[0, HAIR.light], [0.28, HAIR.base], [0.75, HAIR.base], [1, HAIR.shade]]);
}
function swayWarp(t, amp, from = 60, span = 520, tilt = 0, pivot = [0, 200]) {
  return (x, y) => {
    // tilt: rotate around pivot, fading out further down the hair
    if (tilt) {
      const w = clamp(1 - (y - 120) / 520);
      const a = tilt * w;
      const dx = x - pivot[0], dy = y - pivot[1];
      const c = Math.cos(a), s = Math.sin(a);
      x = pivot[0] + dx * c - dy * s;
      y = pivot[1] + dx * s + dy * c;
    }
    const k = clamp((y - from) / span);
    const dx = amp * k * k * (Math.sin(t * 1.15 + y * 0.006) * 20 + Math.sin(t * 2.6 + y * 0.015 + x * 0.01) * 7);
    return [x + dx, y];
  };
}

// ── the luna moth (オオミズアオ): used for the hairpin and the swarm ─
// top view, span ≈ 100, body along y. flap 0..1 folds wings (scaleX)
function drawMoth(ctx, x, y, s, rot = 0, flap = 0, alpha = 1, simple = false, tint = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.globalAlpha *= alpha;
  const fx = 1 - 0.82 * flap;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * fx, 1);
    // hind wing + tail
    fillShape(ctx, 'M 4 6 C 18 4 36 10 38 24 C 40 36 30 42 24 48 C 22 62 26 78 20 96 C 14 80 12 62 12 50 C 6 44 3 30 4 6 Z', tint || MOTHC.wing, null, simple || tint ? null : MOTHC.vein, 1.4);
    // fore wing
    fillShape(ctx, 'M 4 -8 C 20 -26 44 -34 54 -28 C 56 -16 50 -2 40 8 C 30 14 16 12 4 6 Z', tint || MOTHC.wing, null, simple || tint ? null : MOTHC.vein, 1.4);
    if (!simple && !tint) {
      // leading edge stripe
      ctx.beginPath(); ctx.moveTo(4, -8); ctx.bezierCurveTo(20, -26, 44, -34, 54, -28);
      ctx.strokeStyle = MOTHC.lead; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.stroke();
      // eye spots
      for (const [ex, ey, er] of [[34, -8, 4.8], [24, 26, 4.2]]) {
        ctx.beginPath(); ctx.ellipse(ex, ey, er, er * 1.2, 0.4, 0, TAU); ctx.fillStyle = MOTHC.spot; ctx.fill();
        ctx.beginPath(); ctx.ellipse(ex, ey, er * 0.45, er * 0.6, 0.4, 0, TAU); ctx.fillStyle = '#6a3a50'; ctx.fill();
      }
    }
    ctx.restore();
  }
  // body
  ctx.beginPath(); ctx.ellipse(0, 6, 5, 20, 0, 0, TAU); ctx.fillStyle = tint || MOTHC.body; ctx.fill();
  if (!simple && !tint) {
    ctx.strokeStyle = '#d7c7a0'; ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 2, -12); ctx.quadraticCurveTo(side * 10, -26, side * 16, -30); ctx.stroke();
    }
  }
  ctx.restore();
}

// ── eyes ────────────────────────────────────────────────────
// side: -1 viewer-left, +1 viewer-right. Local coords are for the right eye.
const EYE_OPEN = [[34, 24], [46, -10], [98, -32], [132, 4]];
const EYE_SHUT = [[34, 44], [60, 58], [104, 56], [132, 30]];
const EYE_LOW = [[126, 30], [112, 58], [66, 68], [40, 48]];

function drawEye(ctx, side, o) {
  const shut = clamp(o.blink || 0);
  const lid = clamp((o.lid || 0) + shut * (1 - (o.lid || 0)));
  const U = EYE_OPEN.map((p, i) => lerpPt(p, EYE_SHUT[i], lid));
  const lx = (o.look ? o.look[0] : 0) * side, ly = o.look ? o.look[1] : 0;
  const pupil = o.pupil ?? 1;
  ctx.save();
  ctx.scale(side, 1);

  if (lid < 0.97) {
    // opening
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(U[0][0], U[0][1]);
    ctx.bezierCurveTo(U[1][0], U[1][1], U[2][0], U[2][1], U[3][0], U[3][1]);
    ctx.lineTo(EYE_LOW[0][0], EYE_LOW[0][1]);
    ctx.bezierCurveTo(EYE_LOW[1][0], EYE_LOW[1][1], EYE_LOW[2][0], EYE_LOW[2][1], EYE_LOW[3][0], EYE_LOW[3][1]);
    ctx.closePath();
    ctx.fillStyle = vgrad(ctx, -34, 60, [[0, '#d8c6e2'], [0.45, '#fffafa'], [1, '#ffffff']]);
    ctx.fill();
    ctx.clip();

    const cx = 84 + lx * 14, cy = 26 + ly * 10;
    const s = o.irisScale || 1;
    // iris
    ctx.beginPath();
    ctx.ellipse(cx, cy, 34 * s, 44 * s, 0, 0, TAU);
    ctx.fillStyle = vgrad(ctx, cy - 44, cy + 44, [[0, EYEC.i0], [0.45, EYEC.i1], [0.85, EYEC.i2], [1, '#ff8a5c']]);
    ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#2a0006'; ctx.stroke();
    // inner radial streaks
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = '#ffb199';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 12 * s, cy + Math.sin(a) * 16 * s);
      ctx.lineTo(cx + Math.cos(a) * 28 * s, cy + Math.sin(a) * 37 * s);
      ctx.stroke();
    }
    ctx.restore();
    // lower glow crescent
    ctx.beginPath();
    ctx.ellipse(cx, cy + 20 * s, 22 * s, 14 * s, 0, 0, Math.PI);
    ctx.fillStyle = rgba('#ffc49a', 0.55);
    ctx.fill();
    // slit pupil
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 5.5 * pupil * s, 27 * s * (0.75 + 0.25 * pupil), 0, 0, TAU);
    ctx.fillStyle = EYEC.pupil;
    ctx.fill();
    // lid shadow
    ctx.fillStyle = vgrad(ctx, U[2][1] - 6, U[2][1] + 40, [[0, 'rgba(60,0,20,0.55)'], [1, 'rgba(60,0,20,0)']]);
    ctx.fillRect(20, -60, 130, 140);
    // highlights (kept on the same side for both eyes)
    const hx = -13 * side;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(cx + hx, cy - 16, 9.5 * s, 12.5 * s, 0.3 * side, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - hx, cy + 20, 4.5 * s, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(cx + hx * 0.2, cy - 30, 3, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // lower lash
    ctx.beginPath();
    ctx.moveTo(EYE_LOW[0][0], EYE_LOW[0][1]);
    ctx.bezierCurveTo(EYE_LOW[1][0] - 2, EYE_LOW[1][1] + 2, EYE_LOW[2][0] + 34, EYE_LOW[2][1] + 1, EYE_LOW[2][0] + 18, EYE_LOW[2][1]);
    ctx.strokeStyle = rgba('#7a3a34', 0.75);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    // crease
    ctx.beginPath();
    const c0 = lerpPt(U[1], U[2], 0.3), c1 = U[2], c2 = U[3];
    ctx.moveTo(c0[0], c0[1] - 13);
    ctx.quadraticCurveTo(c1[0] + 8, c1[1] - 12, c2[0] - 4, c2[1] - 10);
    ctx.strokeStyle = rgba('#d19688', 0.9);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // upper lash: thick band along the lid curve, heavier at the outer corner
  const N = 18, outer = [], inner = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = bez(U[0], U[1], U[2], U[3], t);
    const q = bez(U[0], U[1], U[2], U[3], Math.min(1, t + 0.01));
    const r = bez(U[0], U[1], U[2], U[3], Math.max(0, t - 0.01));
    let nx = -(q[1] - r[1]), ny = q[0] - r[0];
    const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const w = (3 + 10 * Math.pow(t, 1.4)) * (1 - lid * 0.35);
    outer.push([p[0] + nx * w, p[1] + ny * w]);
    inner.push([p[0] - nx * 1.2, p[1] - ny * 1.2]);
  }
  ctx.beginPath();
  ctx.moveTo(inner[0][0], inner[0][1]);
  outer.forEach(p => ctx.lineTo(p[0], p[1]));
  // outer wing flick
  const e = U[3];
  ctx.lineTo(e[0] + 16, e[1] + 6 + lid * 8);
  ctx.lineTo(e[0] + 2, e[1] + 10);
  for (let i = N; i >= 0; i--) ctx.lineTo(inner[i][0], inner[i][1]);
  ctx.closePath();
  ctx.fillStyle = EYEC.lash;
  ctx.fill();
  // a couple of separate lashes
  ctx.strokeStyle = EYEC.lash;
  ctx.lineWidth = 3;
  for (const [t, len, a] of [[0.72, 12, -0.4], [0.86, 14, 0.1]]) {
    const p = bez(U[0], U[1], U[2], U[3], t);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1] - 4);
    ctx.lineTo(p[0] + Math.sin(a) * len + 6, p[1] - 4 - Math.cos(a) * len * (1 - lid));
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrow(ctx, side, mood) {
  const B = {
    neutral: [[46, -56], [92, -76], [134, -54]],
    angry: [[46, -40], [92, -64], [134, -62]],
    sad: [[46, -66], [92, -70], [134, -46]],
    smug: [[46, -50], [92, -74], [134, -60]],
    up: [[46, -70], [92, -92], [134, -66]],
  }[mood || 'neutral'];
  ctx.save();
  ctx.scale(side, 1);
  ctx.beginPath();
  ctx.moveTo(B[0][0], B[0][1]);
  ctx.quadraticCurveTo(B[1][0], B[1][1], B[2][0], B[2][1]);
  ctx.strokeStyle = rgba('#b8893a', 0.75);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawMouth(ctx, o) {
  const m = o.mouth || 'closed';
  const a = clamp(o.talk || 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const fang = (x, y, s = 1, dir = 1) => {
    ctx.beginPath();
    ctx.moveTo(x - 3.5 * s, y);
    ctx.lineTo(x + 3.5 * s, y);
    ctx.lineTo(x + 0.6 * s * dir, y + 9 * s);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#a24b4b';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  };
  if ((m === 'closed' || m === 'smile' || m === 'pout') && a < 0.08) {
    ctx.beginPath();
    if (m === 'smile') { ctx.moveTo(-20, 116); ctx.quadraticCurveTo(0, 132, 20, 116); }
    else if (m === 'pout') { ctx.moveTo(-12, 126); ctx.quadraticCurveTo(0, 119, 12, 126); }
    else { ctx.moveTo(-14, 121); ctx.quadraticCurveTo(0, 126, 14, 120); }
    ctx.strokeStyle = '#a24b4b';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    if (m !== 'pout') fang(8, m === 'smile' ? 122 : 122, 1, -1);
    return;
  }
  if (m === 'grin') {
    ctx.beginPath();
    ctx.moveTo(-26, 113);
    ctx.quadraticCurveTo(0, 120, 26, 113);
    ctx.bezierCurveTo(22, 134, 9, 144, 0, 144);
    ctx.bezierCurveTo(-9, 144, -22, 134, -26, 113);
    ctx.closePath();
    ctx.fillStyle = '#6a1420'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.ellipse(0, 144, 16, 12, 0, 0, TAU); ctx.fillStyle = '#e46e7b'; ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#8e3a3e'; ctx.lineWidth = 2.6; ctx.stroke();
    fang(-12, 115.5, 1.2, 1); fang(12, 115.5, 1.2, -1);
    return;
  }
  if (m === 'o') {
    ctx.beginPath(); ctx.ellipse(0, 124, 8, 10 + a * 4, 0, 0, TAU);
    ctx.fillStyle = '#6a1420'; ctx.fill();
    ctx.strokeStyle = '#8e3a3e'; ctx.lineWidth = 2.2; ctx.stroke();
    return;
  }
  // talking / open
  const h = 6 + a * 22, w = 15 + a * 3;
  ctx.beginPath();
  ctx.moveTo(-w, 118);
  ctx.quadraticCurveTo(0, 121, w, 118);
  ctx.bezierCurveTo(w - 2, 118 + h * 0.8, 6, 118 + h, 0, 118 + h);
  ctx.bezierCurveTo(-6, 118 + h, -w + 2, 118 + h * 0.8, -w, 118);
  ctx.closePath();
  ctx.fillStyle = '#6a1420'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.beginPath(); ctx.ellipse(0, 118 + h, 11, 7 + a * 4, 0, 0, TAU); ctx.fillStyle = '#e46e7b'; ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#8e3a3e'; ctx.lineWidth = 2.4; ctx.stroke();
  fang(-8, 119.2, 0.9, 1); fang(8, 119.2, 0.9, -1);
}

function drawBlush(ctx, amt) {
  if (amt <= 0) return;
  for (const s of [-1, 1]) {
    const g = ctx.createRadialGradient(s * 92, 86, 0, s * 92, 86, 44);
    g.addColorStop(0, rgba(SKIN.blush, 0.55 * amt));
    g.addColorStop(1, rgba(SKIN.blush, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(s * 92, 86, 46, 20, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba('#ff6f84', 0.8 * amt);
    ctx.lineWidth = 2.6;
    for (let i = 0; i < 3; i++) {
      const x = s * (74 + i * 14);
      ctx.beginPath(); ctx.moveTo(x + 4, 78); ctx.lineTo(x - 4, 92); ctx.stroke();
    }
  }
}

// ── head (face + front hair). Assumes ctx is in portrait space.
function drawHead(ctx, o) {
  const t = o.t || 0;
  const warpS = swayWarp(t, (o.wind ?? 1) * 0.6, 40, 520, 0);

  // face
  fillShape(ctx, FACE, SKIN.base, null, SKIN.line, 3);
  // cel shadow under the fringe and down the sides
  ctx.save();
  ctx.beginPath(); tracePath(ctx, FACE); ctx.clip();
  ctx.translate(6, 22);
  fillShape(ctx, BANGS, SKIN.shade);
  ctx.translate(-6, -22);
  fillShape(ctx, EAR_SHADOW, SKIN.shade);
  fillShape(ctx, mirrorShape(EAR_SHADOW), SKIN.shade);
  ctx.restore();

  drawBlush(ctx, o.blush || 0);
  drawEye(ctx, -1, o);
  drawEye(ctx, 1, o);

  // nose
  ctx.beginPath(); ctx.moveTo(4, 70); ctx.quadraticCurveTo(6, 78, 3, 82);
  ctx.strokeStyle = '#dc9b8b'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke();
  ctx.save(); ctx.translate(0, -8); drawMouth(ctx, o); ctx.restore();

  // side locks (in front of cheeks and shoulders)
  const g = hairGrad(ctx, -120, 560);
  fillShape(ctx, SIDELOCK_L, g, warpS, HAIR.line, 2.6);
  fillShape(ctx, SIDELOCK_L_SHADE, HAIR.shade, warpS);
  fillShape(ctx, SIDELOCK_R, g, warpS, HAIR.line, 2.6);
  fillShape(ctx, SIDELOCK_R_SHADE, HAIR.shade, warpS);

  // fringe
  fillShape(ctx, BANGS, hairGrad(ctx, -250, 70), null, HAIR.line, 2.8);
  // strand separation lines
  ctx.strokeStyle = rgba(HAIR.deep, 0.75);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = 2; i < BANG_PTS.length - 2; i += 2) {
    const [vx, vy] = BANG_PTS[i];
    ctx.beginPath();
    ctx.moveTo(vx, vy + 2);
    ctx.quadraticCurveTo(vx * 0.96, vy - 60, vx * 0.7, vy - 120);
    ctx.stroke();
  }
  // shade near the strand tips
  ctx.save();
  ctx.beginPath(); tracePath(ctx, BANGS); ctx.clip();
  ctx.fillStyle = vgrad(ctx, -60, 80, [[0, rgba(HAIR.shade, 0)], [1, rgba(HAIR.deep, 0.55)]]);
  ctx.fillRect(-220, -60, 440, 140);
  // angel ring highlight
  ctx.beginPath();
  const ringY = -150;
  ctx.moveTo(-170, ringY + 30);
  for (let i = 0; i <= 16; i++) {
    const x = lerp(-170, 170, i / 16);
    const arc = -Math.cos((i / 16 - 0.5) * Math.PI) * 26;
    ctx.lineTo(x, ringY + arc + (i % 2 ? -14 : 10));
  }
  for (let i = 16; i >= 0; i--) {
    const x = lerp(-170, 170, i / 16);
    const arc = -Math.cos((i / 16 - 0.5) * Math.PI) * 26;
    ctx.lineTo(x, ringY + arc + 26 + (i % 2 ? 6 : -4));
  }
  ctx.closePath();
  ctx.fillStyle = rgba('#ffffff', 0.62);
  ctx.fill();
  ctx.restore();

  // brows sit over the hair, SHAFT style
  ctx.save();
  ctx.globalAlpha = 0.7;
  drawBrow(ctx, -1, o.brow);
  drawBrow(ctx, 1, o.brow);
  ctx.restore();

  // ahoge
  fillShape(ctx, AHOGE, HAIR.base, (x, y) => [x + Math.sin(t * 3) * (y + 268) * -0.08, y], HAIR.line, 2.4);

  // luna moth kanzashi
  drawMoth(ctx, 150, -168, 0.85, -0.55, 0.12 + 0.08 * Math.sin(t * 2.2));

  // anger mark / sweat etc
  if (o.vein) {
    ctx.save();
    ctx.translate(-120, -200);
    ctx.strokeStyle = RED; ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (const r of [0, 1, 2, 3]) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(6, -18); ctx.quadraticCurveTo(6, -6, 18, -6); ctx.stroke();
    }
    ctx.restore();
  }
}

// ── body pieces ─────────────────────────────────────────────
const NECK = 'M -44 100 L -50 262 L 50 262 L 44 100 Z';
const NECK_SHADOW = 'M -52 140 C -30 222 30 222 52 140 L 52 100 L -52 100 Z';
const TORSO = 'M -50 228 C -86 262 -170 268 -230 298 C -272 320 -294 384 -302 472 L -318 1200 L 318 1200 L 302 472 C 294 384 272 320 230 298 C 170 268 86 262 50 228 Z';
const V_SKIN = 'M -60 226 L 60 226 Q 30 330 0 430 Q -30 330 -60 226 Z';
const BAND_UNDER = 'M -60 234 Q -30 336 10 432 L -28 456 Q -68 352 -98 244 Z';
const BAND_TOP = 'M 60 234 Q 30 336 -10 432 L -150 800 L -106 818 L 28 456 Q 68 352 98 244 Z';
const OBI = 'M -300 640 L 300 640 L 306 820 L -306 820 Z';

function drawYukataPattern(ctx, t, x0, y0, x1, y1, seed = 3, sc = 1) {
  const r = mulberry32(seed);
  const n = Math.round(((x1 - x0) * (y1 - y0)) / (150 * 150 * sc * sc));
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), rot = r() * TAU;
    drawMoth(ctx, x, y, (0.5 + r() * 0.3) * sc, rot, 0, 1, true);
  }
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = YUK.pat;
  ctx.lineWidth = 3 * sc;
  for (let i = 0; i < 7; i++) {
    const y = lerp(y0, y1, r());
    ctx.beginPath();
    ctx.moveTo(x0, y);
    for (let x = x0; x <= x1; x += 40 * sc) ctx.lineTo(x, y + Math.sin(x * 0.02 / sc + i) * 14 * sc);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTorso(ctx, o) {
  const t = o.t || 0;
  fillShape(ctx, NECK, SKIN.base, null, SKIN.line, 2.6);
  fillShape(ctx, NECK_SHADOW, SKIN.shade);
  // body
  fillShape(ctx, TORSO, YUK.base, null, YUK.line, 3.2);
  ctx.save();
  ctx.beginPath(); tracePath(ctx, TORSO); ctx.clip();
  drawYukataPattern(ctx, t, -320, 250, 320, 1200);
  // side folds
  ctx.fillStyle = rgba(YUK.shade, 0.8);
  fillShape(ctx, 'M -230 298 C -250 420 -262 600 -270 1200 L -318 1200 L -302 472 C -294 384 -272 320 -230 298 Z', YUK.shade);
  fillShape(ctx, 'M 230 298 C 250 420 262 600 270 1200 L 318 1200 L 302 472 C 294 384 272 320 230 298 Z', YUK.shade);
  ctx.restore();
  // V of skin + collar
  fillShape(ctx, V_SKIN, SKIN.base);
  ctx.save();
  ctx.beginPath(); tracePath(ctx, V_SKIN); ctx.clip();
  ctx.fillStyle = vgrad(ctx, 226, 430, [[0, rgba(SKIN.shade, 1)], [0.35, rgba(SKIN.shade, 0)]]);
  ctx.fillRect(-70, 220, 140, 220);
  // collarbones
  ctx.strokeStyle = rgba(SKIN.deep, 0.8); ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(-40, 300); ctx.quadraticCurveTo(-18, 296, -8, 306); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, 300); ctx.quadraticCurveTo(18, 296, 8, 306); ctx.stroke();
  ctx.restore();
  fillShape(ctx, BAND_UNDER, YUK.band, null, YUK.line, 3);
  fillShape(ctx, BAND_TOP, YUK.band, null, YUK.line, 3);
  // obi
  if (o.obi !== false) {
    fillShape(ctx, OBI, YUK.obi, null, '#5c0614', 3);
    fillShape(ctx, 'M -300 760 L 300 760 L 306 820 L -306 820 Z', YUK.obiS);
    ctx.beginPath(); ctx.moveTo(-304, 728); ctx.lineTo(304, 728);
    ctx.strokeStyle = YUK.cord; ctx.lineWidth = 9; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 728, 13, 0, TAU); ctx.fillStyle = '#f7f0d8'; ctx.fill();
  }
}

// ── bust: back hair + torso + head, with optional head tilt ──
// o: {t, blink, lid, look, mouth, talk, brow, blush, wind, tilt, hairLen}
function drawBust(ctx, o) {
  const t = o.t || 0, tilt = o.tilt || 0;
  const len = o.hairLen || 1150;
  const bh = backHairPath(len);
  const warpB = swayWarp(t, o.wind ?? 1, 80, 700, tilt, [0, 200]);
  fillShape(ctx, bh.d, hairGrad(ctx, -280, len), warpB, HAIR.line, 3);
  fillShape(ctx, bh.inner, '#d4a447', warpB);
  drawTorso(ctx, o);
  ctx.save();
  ctx.translate(0, 200);
  ctx.rotate(tilt);
  ctx.translate(0, -200);
  drawHead(ctx, o);
  ctx.restore();
}

// ── parasol (janome-gasa): red washi with a white ring ─────
// drawn in its own space: shaft base (hand) at 0,0, top at 0,-L
function drawParasol(ctx, open, L = 620, R = 380) {
  const topY = -L;
  const o = Ease.inOutCubic(clamp(open));
  // shaft
  ctx.strokeStyle = '#6b3b1c';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, topY); ctx.stroke();
  // grip wrap
  ctx.strokeStyle = '#1a0d08'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, -40); ctx.stroke();
  // canopy: rim half-width and drop depend on openness
  const rw = lerp(26, R, o);
  const drop = lerp(L * 0.62, R * 0.36, o);
  const rimY = topY + drop;
  const ribs = 12;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, topY - 6);
  const rim = [];
  for (let i = 0; i <= ribs; i++) {
    const a = i / ribs; // 0..1 left to right
    const x = lerp(-rw, rw, a);
    const curve = Math.sin(a * Math.PI) * lerp(4, R * 0.1, o);
    rim.push([x, rimY + curve]);
  }
  ctx.bezierCurveTo(-rw * 0.5, topY + drop * 0.05, -rw * 0.95, topY + drop * 0.45, rim[0][0], rim[0][1]);
  for (let i = 1; i <= ribs; i++) {
    const [px, py] = rim[i - 1], [qx, qy] = rim[i];
    ctx.quadraticCurveTo((px + qx) / 2, (py + qy) / 2 - lerp(2, 16, o), qx, qy);
  }
  ctx.bezierCurveTo(rw * 0.95, topY + drop * 0.45, rw * 0.5, topY + drop * 0.05, 0, topY - 6);
  ctx.closePath();
  ctx.fillStyle = vgrad(ctx, topY, rimY + 20, [[0, '#e8283f'], [1, '#a50d22']]);
  ctx.fill();
  ctx.clip();
  // janome white ring
  ctx.lineWidth = lerp(3, 26, o);
  ctx.strokeStyle = rgba('#fff4ea', 0.95);
  ctx.beginPath();
  ctx.ellipse(0, topY + drop * 0.62, rw * 0.66, drop * 0.5 + 6, 0, Math.PI, TAU);
  ctx.stroke();
  // ribs
  ctx.strokeStyle = rgba('#5a0610', 0.5);
  ctx.lineWidth = 2;
  for (let i = 0; i <= ribs; i++) {
    ctx.beginPath(); ctx.moveTo(0, topY); ctx.lineTo(rim[i][0], rim[i][1]); ctx.stroke();
  }
  // light through the paper
  ctx.fillStyle = vgrad(ctx, topY, rimY, [[0, 'rgba(255,220,200,0.25)'], [1, 'rgba(255,200,180,0)']]);
  ctx.fillRect(-R, topY, R * 2, drop + 40);
  ctx.restore();
  // top knob
  ctx.fillStyle = '#2a120a';
  ctx.beginPath(); ctx.arc(0, topY - 6, 9, 0, TAU); ctx.fill();
  ctx.fillRect(-3, topY - 34, 6, 30);
}

// ── full figure. origin at the feet (standing) or seat edge (sitting)
// Full space: ~1000 tall. Head uses portrait drawing at HS scale.
const HS = 0.36;
const SIT_DRAPE = 'M -90 -604 C -112 -594 -128 -562 -130 -526 C -132 -498 -124 -466 -120 -414 Q -62 -402 -6 -414 L 0 -426 L 6 -414 Q 62 -402 120 -414 C 124 -466 132 -498 130 -526 C 128 -562 112 -594 90 -604 Z';
const ROBE = 'M -86 -806 C -96 -760 -86 -700 -76 -640 C -80 -560 -92 -470 -90 -380 C -88 -250 -84 -120 -80 -40 L 80 -40 C 84 -120 88 -250 90 -380 C 92 -470 80 -560 76 -640 C 86 -700 96 -760 86 -806 C 60 -820 -60 -820 -86 -806 Z';
const ROBE_SEAM = 'M 30 -646 C 18 -500 8 -250 4 -40';
const SLEEVE_L = 'M -86 -800 C -118 -770 -132 -720 -134 -660 L -140 -520 C -140 -498 -128 -488 -108 -488 L -34 -488 C -24 -540 -8 -600 18 -660 C -20 -700 -50 -760 -86 -800 Z';
const SLEEVE_R = 'M 86 -800 C 118 -770 132 -720 134 -660 L 140 -520 C 140 -498 128 -488 108 -488 L 58 -488 C 60 -560 70 -610 76 -660 C 90 -700 94 -760 86 -800 Z';

function drawGeta(ctx, x, lift = 0, sway = 0) {
  ctx.save();
  ctx.translate(x, -lift);
  ctx.rotate(sway);
  // foot
  ctx.fillStyle = SKIN.base;
  ctx.beginPath(); ctx.ellipse(0, -16, 17, 12, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = SKIN.line; ctx.lineWidth = 2; ctx.stroke();
  // sole + teeth
  ctx.fillStyle = '#c99a62';
  ctx.fillRect(-22, -8, 44, 10);
  ctx.fillStyle = '#7a5530';
  ctx.fillRect(-18, 2, 8, 10); ctx.fillRect(10, 2, 8, 10);
  // hanao strap
  ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, -8); ctx.quadraticCurveTo(0, -30, 14, -8); ctx.stroke();
  ctx.restore();
}

// o: {t, pose:'stand'|'sit', parasol:{open, rot}|null, ...head opts}
function drawFull(ctx, o) {
  const t = o.t || 0;
  const sit = o.pose === 'sit';
  const breath = Math.sin(t * 2.1) * 3;

  ctx.save();
  if (sit) ctx.translate(0, 520);
  // back hair (long, to the thighs)
  ctx.save();
  ctx.translate(0, -912 + breath * 0.3);
  ctx.scale(HS, HS);
  const len = sit ? 1250 : 1500;
  const bh = backHairPath(len);
  const warp = swayWarp(t, (o.wind ?? 1) * 1.2, 80, 900, o.tilt || 0, [0, 200]);
  fillShape(ctx, bh.d, hairGrad(ctx, -280, len), warp, HAIR.line, 5);
  ctx.restore();

  // parasol behind (when resting on the shoulder)
  const P = o.parasol;
  const pBehind = P && (P.rot || 0) > 0.35;
  const hand = [60, -676];
  const paraDraw = () => {
    ctx.save();
    ctx.translate(hand[0], hand[1]);
    ctx.rotate(P.rot || 0);
    drawParasol(ctx, P.open || 0, P.L || 600, P.R || 360);
    ctx.restore();
  };
  if (pBehind) paraDraw();

  if (sit) {
    // dangling shins, then the robe draped over the knees
    for (const [lx, ph] of [[-38, 0], [38, 1.7]]) {
      const kick = Math.sin(t * 2.4 + ph) * 0.16;
      ctx.save();
      ctx.translate(lx, -470);
      ctx.rotate(kick);
      fillShape(ctx, 'M -14 0 L 14 0 L 12 170 L -12 170 Z', SKIN.base, null, SKIN.line, 2);
      ctx.translate(0, 188);
      drawGeta(ctx, 0, 0, 0);
      ctx.restore();
    }
    fillShape(ctx, SIT_DRAPE, YUK.base, null, YUK.line, 3);
    ctx.save();
    ctx.beginPath(); tracePath(ctx, SIT_DRAPE); ctx.clip();
    drawYukataPattern(ctx, t, -130, -610, 130, -400, 11, 0.36);
    fillShape(ctx, 'M -130 -526 C -100 -512 -40 -508 0 -520 C 40 -508 100 -512 130 -526 L 130 -500 C 100 -490 40 -492 0 -500 C -40 -492 -100 -490 -130 -500 Z', rgba(YUK.shade, 0.9));
    fillShape(ctx, 'M -4 -506 C -6 -470 -4 -440 0 -428 L 4 -428 C 8 -440 10 -470 8 -506 Z', rgba(YUK.shade, 0.9));
    ctx.restore();
  }

  // robe
  const robe = sit ? 'M -86 -806 C -96 -760 -86 -700 -76 -640 C -80 -616 -90 -604 -90 -596 L 90 -596 C 90 -604 80 -616 76 -640 C 86 -700 96 -760 86 -806 C 60 -820 -60 -820 -86 -806 Z' : ROBE;
  fillShape(ctx, robe, YUK.base, null, YUK.line, 3.5);
  ctx.save();
  ctx.beginPath(); tracePath(ctx, robe); ctx.clip();
  drawYukataPattern(ctx, t, -100, -820, 100, -40, 5, 0.36);
  fillShape(ctx, 'M 50 -800 C 70 -600 76 -300 72 -40 L 100 -40 L 100 -820 Z', rgba(YUK.shade, 0.9));
  ctx.restore();
  if (!sit) {
    ctx.beginPath(); tracePath(ctx, ROBE_SEAM);
    ctx.strokeStyle = YUK.line; ctx.lineWidth = 3; ctx.stroke();
  }
  // collar V (scaled bust pieces)
  ctx.save();
  ctx.translate(0, -912 + breath * 0.3);
  ctx.scale(HS, HS);
  fillShape(ctx, NECK, SKIN.base, null, SKIN.line, 4);
  fillShape(ctx, NECK_SHADOW, SKIN.shade);
  fillShape(ctx, V_SKIN, SKIN.base);
  fillShape(ctx, BAND_UNDER, YUK.band, null, YUK.line, 5);
  fillShape(ctx, BAND_TOP, YUK.band, null, YUK.line, 5);
  ctx.restore();
  // obi
  fillShape(ctx, 'M -80 -676 L 80 -676 L 82 -590 L -82 -590 Z', YUK.obi, null, '#5c0614', 3);
  fillShape(ctx, 'M -82 -610 L 82 -610 L 82 -590 L -82 -590 Z', YUK.obiS);
  ctx.beginPath(); ctx.moveTo(-81, -628); ctx.lineTo(81, -628);
  ctx.strokeStyle = YUK.cord; ctx.lineWidth = 4; ctx.stroke();

  // hands: small, mostly swallowed by the sleeves
  if (P) {
    fillShape(ctx, `M ${hand[0] - 16} ${hand[1] + 6} C ${hand[0] - 18} ${hand[1] - 12} ${hand[0] + 14} ${hand[1] - 18} ${hand[0] + 16} ${hand[1] - 2} C ${hand[0] + 16} ${hand[1] + 14} ${hand[0] - 14} ${hand[1] + 20} ${hand[0] - 16} ${hand[1] + 6} Z`, SKIN.base, null, SKIN.line, 2.2);
  } else {
    fillShape(ctx, 'M -20 -630 C -22 -646 22 -646 20 -630 C 20 -616 -20 -616 -20 -630 Z', SKIN.base, null, SKIN.line, 2.2);
  }

  // sleeves
  for (const sl of [SLEEVE_L, SLEEVE_R]) {
    fillShape(ctx, sl, YUK.base, null, YUK.line, 3.5);
    ctx.save(); ctx.beginPath(); tracePath(ctx, sl); ctx.clip();
    drawYukataPattern(ctx, t, -150, -800, 150, -480, 9, 0.36);
    ctx.restore();
  }
  // feet
  if (!sit) { drawGeta(ctx, -30, 0, 0); drawGeta(ctx, 30, 0, 0); }

  // head
  ctx.save();
  ctx.translate(0, -912 + breath * 0.3);
  ctx.scale(HS, HS);
  ctx.translate(0, 200); ctx.rotate(o.tilt || 0); ctx.translate(0, -200);
  drawHead(ctx, o);
  ctx.restore();

  if (P && !pBehind) paraDraw();
  ctx.restore();
}

// Blink helper: natural blinking driven by time only.
function blinkAt(t, seed = 1) {
  // blink roughly every 3-4.5 s, 0.16 s long
  const period = 3.7 + hash(seed) * 0.8;
  const ph = (t + hash(seed * 3) * period) % period;
  const b = 1 - Math.abs(ph - 0.08) / 0.08;
  return clamp(b);
}
// Lip flap for dialogue: returns 0..1 while talking between [a, b]
function flap(t, a, b, speed = 11) {
  if (t < a || t > b) return 0;
  const e = Math.min(1, (t - a) / 0.08, (b - t) / 0.08);
  return clamp(e * (0.35 + 0.65 * Math.abs(Math.sin(t * speed) * (0.6 + 0.4 * Math.sin(t * speed * 0.37 + 1)))));
}
