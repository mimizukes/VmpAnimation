'use strict';
// ─────────────────────────────────────────────────────────────
//  Core: constants, math, easing, deterministic noise, path helpers
// ─────────────────────────────────────────────────────────────

const W = 1920, H = 1080;
const TAU = Math.PI * 2;

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, v) => clamp((v - a) / (b - a));
const remap = (v, a, b, c, d) => lerp(c, d, invLerp(a, b, v));
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const smoother = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };

const Ease = {
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

// 0→1 over [a,b] with an easing
const seg = (t, a, b, ease = smooth) => ease(clamp((t - a) / (b - a)));
// fade in over fi, hold, fade out over fo, within duration d
const envelope = (t, d, fi = 0.3, fo = 0.3) => Math.min(clamp(t / fi), clamp((d - t) / fo));

function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function hash2(a, b) { return hash(a * 12.9898 + b * 78.233); }
function noise1(x) {
  const i = Math.floor(x), f = x - i;
  return lerp(hash(i), hash(i + 1), f * f * (3 - 2 * f)) * 2 - 1;
}
function fbm1(x) { return noise1(x) * 0.6 + noise1(x * 2.13 + 7.1) * 0.3 + noise1(x * 4.37 + 3.3) * 0.1; }

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// hex "#rrggbb" helpers
function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(h, a) { const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; }
function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  const c = a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

// ── tiny SVG-ish path language (absolute M L C Q Z only) ─────
// Shapes are authored as strings once, parsed to arrays, and can be
// re-emitted every frame through an optional warp (hair sway etc).
const _shapeCache = new Map();
function shape(d) {
  let s = _shapeCache.get(d);
  if (s) return s;
  const toks = d.replace(/([MLCQZ])/g, ' $1 ').replace(/,/g, ' ').trim().split(/\s+/).filter(Boolean);
  s = [];
  let cmd = null;
  for (let i = 0; i < toks.length; ) {
    const tk = toks[i];
    if (/^[MLCQZ]$/.test(tk)) { cmd = tk; i++; if (cmd === 'Z') s.push(['Z']); continue; }
    const n = cmd === 'C' ? 6 : cmd === 'Q' ? 4 : 2;
    const nums = toks.slice(i, i + n).map(Number);
    s.push([cmd, ...nums]);
    i += n;
    if (cmd === 'M') cmd = 'L';
  }
  _shapeCache.set(d, s);
  return s;
}
function tracePath(ctx, d, warp) {
  const s = typeof d === 'string' ? shape(d) : d;
  for (const c of s) {
    const k = c[0];
    if (k === 'Z') { ctx.closePath(); continue; }
    const p = [];
    for (let j = 1; j < c.length; j += 2) {
      if (warp) { const w = warp(c[j], c[j + 1]); p.push(w[0], w[1]); }
      else p.push(c[j], c[j + 1]);
    }
    if (k === 'M') ctx.moveTo(p[0], p[1]);
    else if (k === 'L') ctx.lineTo(p[0], p[1]);
    else if (k === 'C') ctx.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
    else if (k === 'Q') ctx.quadraticCurveTo(p[0], p[1], p[2], p[3]);
  }
}
function fillShape(ctx, d, fill, warp, stroke, lw) {
  ctx.beginPath();
  tracePath(ctx, d, warp);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}

// cubic bezier point
function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}
const lerpPt = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
