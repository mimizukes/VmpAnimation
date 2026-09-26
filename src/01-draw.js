// ─────────────────────────────────────────────────────────────
//  Drawing helpers: text, cards, light, texture, camera
// ─────────────────────────────────────────────────────────────

const F_JP = '"Shippori Mincho B1", "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Yu Mincho", "YuMincho", "Noto Serif JP", "Noto Serif CJK JP", "Source Han Serif JP", "MS PMincho", serif';
const F_EN = '"Cormorant Garamond", "Iowan Old Style", Georgia, "Times New Roman", serif';

const INK = '#0b0b0f', PAPER = '#f3eee4', RED = '#c3152f', BLOOD = '#8e0b1f';

function font(size, weight = 700, fam = F_JP, italic = false) {
  return `${italic ? 'italic ' : ''}${weight} ${size}px ${fam}`;
}

// Horizontal text with manual letter spacing (em units), so it looks
// the same in every browser.
function txt(ctx, s, x, y, o = {}) {
  const size = o.size || 40;
  ctx.font = font(size, o.weight || 700, o.fam || F_JP, o.italic);
  ctx.fillStyle = o.color || PAPER;
  ctx.textBaseline = o.base || 'middle';
  const ls = (o.ls || 0) * size;
  const align = o.align || 'center';
  if (!ls) {
    ctx.textAlign = align;
    if (o.stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.sw || size * 0.12; ctx.strokeText(s, x, y); }
    ctx.fillText(s, x, y);
    return ctx.measureText(s).width;
  }
  const chars = [...s];
  const ws = chars.map(c => ctx.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0) + ls * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    if (o.stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.sw || size * 0.12; ctx.strokeText(c, cx, y); }
    ctx.fillText(c, cx, y);
    cx += ws[i] + ls;
  });
  return total;
}

// Vertical Japanese text, top anchored at (x, y), centred on x.
const V_ROTATE = new Set(['ー', '〜', '…', '—', '―', '（', '）', '「', '」', '『', '』', '-']);
const V_SMALL = new Set([...'ゃゅょっぁぃぅぇぉャュョッァィゥェォ']);
function vtxt(ctx, s, x, y, o = {}) {
  const size = o.size || 60;
  const step = size * (o.lh || 1.08);
  ctx.font = font(size, o.weight || 700, o.fam || F_JP);
  ctx.fillStyle = o.color || PAPER;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  [...s].forEach((c, i) => {
    const cy = y + i * step + size / 2;
    ctx.save();
    ctx.translate(x, cy);
    if (V_ROTATE.has(c)) ctx.rotate(Math.PI / 2);
    else if (c === '。' || c === '、') ctx.translate(size * 0.55, -size * 0.55);
    else if (V_SMALL.has(c)) ctx.translate(size * 0.1, -size * 0.1);
    ctx.fillText(c, 0, 0);
    ctx.restore();
  });
  return [...s].length * step;
}

// Furigana over a horizontal word.
function ruby(ctx, base, reading, x, y, o = {}) {
  const size = o.size || 80;
  txt(ctx, base, x, y, o);
  txt(ctx, reading, x, y - size * 0.78, { ...o, size: size * 0.3, weight: 700, ls: o.rls ?? 0.5 });
}

// ── Monogatari-style title cards ─────────────────────────────
// c: {bg, fg, jp, en, layout, size, sub, ruby, accent, frame}
function drawCard(ctx, t, c) {
  const bg = c.bg || INK, fg = c.fg || PAPER, accent = c.accent || (bg === RED ? INK : RED);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const layout = c.layout || 'center';
  const size = c.size || 150;
  const enCol = c.enColor || rgba(fg === PAPER ? '#f3eee4' : fg, 0.7);

  if (c.frame) {
    ctx.strokeStyle = rgba(fg, 0.35);
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 70, W - 140, H - 140);
  }

  if (layout === 'center') {
    const y = H / 2 - (c.en ? 30 : 0);
    if (c.ruby) ruby(ctx, c.jp, c.ruby, W / 2, y, { size, color: fg, weight: c.weight || 800, ls: c.ls ?? 0.08 });
    else txt(ctx, c.jp, W / 2, y, { size, color: fg, weight: c.weight || 800, ls: c.ls ?? 0.08 });
    if (c.en) txt(ctx, c.en, W / 2, y + size * 0.62 + 34, { size: 30, fam: F_EN, weight: 600, color: enCol, ls: 0.45, italic: c.enItalic });
    if (c.sub) txt(ctx, c.sub, W / 2, y - size * 0.62 - 40, { size: 32, color: accent, weight: 700, ls: 0.4 });
  } else if (layout === 'left') {
    txt(ctx, c.jp, 200, H / 2 - 20, { size, color: fg, weight: c.weight || 800, align: 'left', ls: c.ls ?? 0.06 });
    if (c.en) txt(ctx, c.en, 206, H / 2 + size * 0.55 + 16, { size: 30, fam: F_EN, weight: 600, color: enCol, align: 'left', ls: 0.4 });
    if (c.sub) txt(ctx, c.sub, 206, H / 2 - size * 0.62 - 30, { size: 30, color: accent, weight: 700, align: 'left', ls: 0.4 });
  } else if (layout === 'right') {
    txt(ctx, c.jp, W - 200, H / 2 - 20, { size, color: fg, weight: c.weight || 800, align: 'right', ls: c.ls ?? 0.06 });
    if (c.en) txt(ctx, c.en, W - 206, H / 2 + size * 0.55 + 16, { size: 30, fam: F_EN, weight: 600, color: enCol, align: 'right', ls: 0.4 });
  } else if (layout === 'vertical') {
    const n = [...c.jp].length;
    const hgt = n * size * 1.08;
    vtxt(ctx, c.jp, c.x || W * 0.6, (H - hgt) / 2, { size, color: fg, weight: c.weight || 800 });
    if (c.ruby) vtxt(ctx, c.ruby, (c.x || W * 0.6) + size * 0.82, (H - hgt) / 2 + 6, { size: size * 0.28, color: fg, weight: 700, lh: (size * 1.08 * n) / (size * 0.28 * [...c.ruby].length) });
    if (c.en) txt(ctx, c.en, 180, H - 170, { size: 30, fam: F_EN, weight: 600, color: enCol, align: 'left', ls: 0.4 });
    if (c.sub) vtxt(ctx, c.sub, (c.x || W * 0.6) - size * 1.1, (H - hgt) / 2 + size * 0.3, { size: 34, color: accent, weight: 700 });
  } else if (layout === 'number') {
    txt(ctx, c.jp, W / 2, H / 2, { size, fam: F_EN, weight: 500, color: fg, ls: c.ls ?? 0.25 });
    if (c.en) txt(ctx, c.en, W / 2, H / 2 + size * 0.6 + 20, { size: 26, fam: F_EN, weight: 600, color: enCol, ls: 0.5 });
  }
  if (c.extra) c.extra(ctx, t, c);
}

// ── light & texture ──────────────────────────────────────────
function glow(ctx, x, y, r, color, a = 1, falloff = 0.3) {
  if (r <= 0 || a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(falloff, rgba(color, a * 0.35));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function additive(ctx, fn) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  fn();
  ctx.restore();
}
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function fillAll(ctx, style) {
  ctx.fillStyle = style;
  ctx.fillRect(-W, -H, W * 3, H * 3);
}
function camera(ctx, cx, cy, zoom = 1, rot = 0) {
  ctx.translate(W / 2, H / 2);
  if (rot) ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);
}
function shake(t, amt, speed = 30) {
  return [noise1(t * speed) * amt, noise1(t * speed + 99) * amt];
}

let _grainPattern = null, _grainCanvas = null;
function grain(ctx, t, amount = 0.08) {
  if (!_grainCanvas) {
    _grainCanvas = document.createElement('canvas');
    _grainCanvas.width = _grainCanvas.height = 256;
    const g = _grainCanvas.getContext('2d');
    const img = g.createImageData(256, 256);
    const r = mulberry32(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    _grainPattern = ctx.createPattern(_grainCanvas, 'repeat');
  }
  const f = Math.floor(t * 24);
  const ox = hash(f) * 256, oy = hash(f + 0.5) * 256;
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  ctx.translate(-ox, -oy);
  ctx.fillStyle = _grainPattern;
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}
function vignette(ctx, a = 0.55, color = '#000000') {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(color, a));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
function letterbox(ctx, amt) {
  if (amt <= 0) return;
  ctx.fillStyle = '#000';
  const h = 135 * amt;
  ctx.fillRect(0, 0, W, h);
  ctx.fillRect(0, H - h, W, h);
}

// deterministic star field
function stars(ctx, t, n, seed, y1 = H * 0.7, a = 1) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * y1, s = r() * 1.8 + 0.4, ph = r() * TAU;
    const tw = 0.55 + 0.45 * Math.sin(t * (1 + r() * 2) + ph);
    ctx.globalAlpha = a * tw * (0.35 + 0.65 * (1 - y / y1));
    ctx.fillStyle = '#fffbe8';
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

// sagging wire between two points
function wire(ctx, x1, y1, x2, y2, sag, color = '#050507', lw = 3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag * 2, x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

// diagonal hazard stripes (railway crossing) inside a clip
function stripes(ctx, x, y, w, h, c1, c2, width, angle = 0.785) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = c1;
  ctx.fillRect(x, y, w, h);
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.fillStyle = c2;
  const L = Math.hypot(w, h);
  for (let i = -L; i < L; i += width * 2) ctx.fillRect(i, -L, width, L * 2);
  ctx.restore();
}

// equiangular (log) spiral point: r = a e^{b θ}
function logSpiral(a, b, th) { const r = a * Math.exp(b * th); return [r * Math.cos(th), r * Math.sin(th)]; }
