// ─────────────────────────────────────────────────────────────
//  あさひモス · Asahi Moth — the timeline
//  Each shot: {dur, draw(ctx, t, p, shot), subs, cues, amb, post}
//  subs: [at, dur, who, jp, en]   who: 'n' narrator, 'a' Asahi
// ─────────────────────────────────────────────────────────────

const STORY = [];
const N = 'n', A = 'a';
function S(dur, draw, opt = {}) { STORY.push({ dur, draw, ...opt }); }
function CARD(dur, card, opt = {}) {
  S(dur, (ctx, t) => drawCard(ctx, t, card), {
    post: { grain: 0.05, vignette: 0 },
    cues: [[0, () => Sound.fx.hit(card.hit || 'card')]],
    ...opt,
  });
}
// lip flap from this shot's Asahi subtitles
function talkOf(sh, t) {
  let a = 0;
  for (const s of sh.subs || []) {
    if (s[2] !== A) continue;
    const end = s[0] + Math.min(s[1] - 0.3, 0.35 + [...s[3]].length * 0.1);
    a = Math.max(a, flap(t, s[0] + 0.05, end));
  }
  return a;
}
// which subtitle index is active (for per-line acting)
function lineOf(sh, t) {
  let idx = -1;
  (sh.subs || []).forEach((s, i) => { if (t >= s[0] - 0.15) idx = i; });
  return idx;
}

const THEME = [[0, 74, 1.5, 0.8], [1.5, 69, 0.5, 0.6], [2, 77, 1, 0.75], [3, 76, 1.5, 0.7], [4.5, 74, 0.5, 0.6], [5, 72, 1, 0.65], [6, 69, 3, 0.7],
  [0, 50, 3, 0.45], [0, 57, 3, 0.35], [3, 46, 1.5, 0.45], [3, 53, 1.5, 0.35], [4.5, 48, 1.5, 0.45], [4.5, 55, 1.5, 0.35], [6, 45, 3, 0.45], [6, 52, 3, 0.35]];
const THEME_MAJOR = [[0, 77, 1.5, 0.75], [1.5, 76, 0.5, 0.6], [2, 74, 1, 0.7], [3, 72, 1.5, 0.7], [4.5, 74, 0.5, 0.6], [5, 81, 1, 0.75], [6, 79, 3, 0.8],
  [0, 46, 3, 0.45], [0, 53, 3, 0.35], [3, 48, 3, 0.45], [3, 55, 3, 0.35], [6, 53, 3, 0.45], [6, 57, 3, 0.4], [6, 60, 3, 0.3]];

// ═════════════════ COLD OPEN ═════════════════

CARD(3, { bg: INK, fg: PAPER, jp: '001', layout: 'number', size: 96 }, {
  cues: [[0.15, () => Sound.fx.piano([[0, 38, 5, 0.9], [0, 50, 5, 0.5]])]],
  amb: { night: 0.4 },
});

S(13, (ctx, t, p) => {
  ctx.save();
  camera(ctx, 960, 540, lerp(1.0, 1.1, Ease.inOutSine(p)));
  setCrossing(ctx, t, { dawn: 0, gates: 0, bell: true });
  ctx.restore();
  letterbox(ctx, 1);
}, {
  amb: { night: 1, bell: 1, crickets: 0.35, city: 0.6 },
  subs: [
    [1.4, 4.2, N, '蛾は光に集まる、とよく言う。', 'People say moths are drawn to the light.'],
    [6.4, 5.0, N, '嘘だ。少なくとも、誤解だ。', "That's a lie. Or at least, a misunderstanding."],
  ],
});

// the geometry lesson
S(15, (ctx, t, p, sh) => {
  fillAll(ctx, '#07080d');
  // faint graph paper
  ctx.strokeStyle = rgba('#3a4a6a', 0.18); ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const lamp = [1180, 480], lampOn = seg(t, 5, 5.25);
  const moonDir = [Math.cos(0.62), Math.sin(0.62)];
  // moth path
  const alpha = 1.40, k = 1 / Math.tan(alpha), c = k / Math.sqrt(1 + k * k);
  const v = 146, start = [300, 620];
  const p5 = [start[0] + v * 5, start[1]];
  const r0 = Math.hypot(p5[0] - lamp[0], p5[1] - lamp[1]), ph0 = Math.atan2(p5[1] - lamp[1], p5[0] - lamp[0]);
  const tEnd = 5 + r0 / (c * v) * 0.985;
  const pos = tt => {
    if (tt <= 5) return [start[0] + v * tt, start[1]];
    const r = Math.max(2, r0 - c * v * (tt - 5));
    const ph = ph0 - Math.log(r0 / r) / k;
    return [lamp[0] + r * Math.cos(ph), lamp[1] + r * Math.sin(ph)];
  };
  // rays: parallel from the true moon, then radial from the lamp
  ctx.save();
  ctx.setLineDash([10, 14]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba('#e8e2cf', 0.22 * (1 - lampOn));
  for (let i = -8; i < 14; i++) {
    const ox = i * 170;
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox + moonDir[0] * 2400, moonDir[1] * 2400); ctx.stroke();
  }
  ctx.strokeStyle = rgba('#ffe7a8', 0.25 * lampOn);
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * TAU;
    ctx.beginPath(); ctx.moveTo(lamp[0], lamp[1]); ctx.lineTo(lamp[0] + Math.cos(a) * 1600, lamp[1] + Math.sin(a) * 1600); ctx.stroke();
  }
  ctx.restore();
  drawMoon(ctx, 150, 120, 46, '#fff4d6', 1 - lampOn * 0.6);
  txt(ctx, '月', 150, 210, { size: 30, color: rgba(PAPER, 0.7 * (1 - lampOn)), weight: 700 });
  // lamp
  if (lampOn > 0) {
    additive(ctx, () => { glow(ctx, lamp[0], lamp[1], 520, '#ffe7a8', 0.5 * lampOn, 0.15); glow(ctx, lamp[0], lamp[1], 60, '#ffffff', lampOn, 0.5); });
    txt(ctx, '偽月', lamp[0], lamp[1] + 90, { size: 30, color: rgba('#ffe7a8', 0.8 * lampOn), weight: 700, ls: 0.3 });
  }
  // trail
  const tNow = Math.min(t, tEnd);
  ctx.beginPath();
  for (let tt = 0; tt <= tNow; tt += 0.02) { const q = pos(tt); tt ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
  ctx.strokeStyle = rgba('#e8e2cf', 0.55); ctx.lineWidth = 2; ctx.stroke();
  // moth + angle marker
  const m = pos(tNow), m2 = pos(tNow + 0.02);
  const head = Math.atan2(m2[1] - m[1], m2[0] - m[0]);
  const toLight = t < 5 ? Math.atan2(-moonDir[1], -moonDir[0]) : Math.atan2(lamp[1] - m[1], lamp[0] - m[0]);
  if (t < tEnd - 0.6) {
    ctx.strokeStyle = RED; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(m[0] + Math.cos(toLight) * 90, m[1] + Math.sin(toLight) * 90); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(m[0] + Math.cos(head) * 90, m[1] + Math.sin(head) * 90); ctx.stroke();
    ctx.beginPath(); ctx.arc(m[0], m[1], 44, Math.min(head, toLight), Math.max(head, toLight)); ctx.stroke();
    const mid = (head + toLight) / 2;
    txt(ctx, 'θ', m[0] + Math.cos(mid) * 66, m[1] + Math.sin(mid) * 66, { size: 34, fam: F_EN, italic: true, weight: 600, color: RED });
  }
  drawMoth(ctx, m[0], m[1], 0.42, head + Math.PI / 2, 0.5 + 0.5 * Math.sin(t * 40), 1, true);
  // captions, SHAFT style
  vtxt(ctx, '等角螺旋', 120, 330, { size: 46, color: rgba(PAPER, 0.85) });
  const fw = txt(ctx, 'r = a·e', 1560, 120, { size: 54, fam: F_EN, italic: true, weight: 500, color: rgba(PAPER, 0.85), align: 'left' });
  txt(ctx, 'bθ', 1560 + fw + 4, 100, { size: 30, fam: F_EN, italic: true, weight: 500, color: rgba(PAPER, 0.85), align: 'left' });
  txt(ctx, 'equiangular spiral', 1560, 170, { size: 24, fam: F_EN, weight: 600, color: rgba(PAPER, 0.5), align: 'left', ls: 0.2 });
  // arrival
  const f = seg(t, tEnd - 0.05, tEnd + 0.15) * (1 - seg(t, tEnd + 0.2, 15));
  if (f > 0) { ctx.fillStyle = rgba('#fffbe8', f); ctx.fillRect(0, 0, W, H); }
}, {
  amb: { drone: 0.6, night: 0.25, ring: 0.6, droneHz: 36.7 },
  cues: [[5, () => { Sound.fx.relay(); Sound.fx.glass(); }], [0.2, () => Sound.fx.flutter(4, 0.08)], [6, () => Sound.fx.flutter(8, 0.1)], [14.1, () => Sound.fx.hit('tick')]],
  subs: [
    [0.5, 4.5, N, '蛾は月を頼りに飛ぶ。月との角度を一定に保って、まっすぐに。', 'A moth steers by the moon. It holds the moon at a fixed angle, and flies straight.'],
    [5.6, 4.4, N, 'けれど、偽物の月がすぐそばにあったら。', 'But put a false moon close enough...'],
    [10.2, 4.0, N, '同じ角度は、螺旋になる。', '...and that same angle becomes a spiral.'],
  ],
});

// montage: false moons, numbered
const MONTAGE = [
  ['#0e1a2b', (ctx, t) => { additive(ctx, () => vendingGlow(ctx, 810, 260, 3, 1)); drawVending(ctx, 810, 260, 3, t, { seed: 4, side: 16 }); }],
  ['#0d0d10', (ctx, t) => { additive(ctx, () => glow(ctx, 1150, 540, 420, '#ff2a2a', 0.5)); drawTrafficLight(ctx, 960, 540, 2.2, 2); }],
  ['#0a0b12', (ctx, t) => { ctx.save(); ctx.translate(-700, 0); drawKonbini(ctx, 760, 900, 1700, 900, t, { panes: 5 }); ctx.restore(); }],
  ['#170506', (ctx, t) => drawLantern(ctx, 960, 560, 2.3, t, 'おでん')],
  ['#08080a', (ctx, t) => { additive(ctx, () => glow(ctx, 960, 420, 360, '#ff2a2a', 0.45)); drawPedSignal(ctx, 960, 540, 2.4, true); }],
  ['#0c0d14', (ctx, t) => { ctx.save(); ctx.translate(960, 540); ctx.rotate(-0.12); ctx.translate(-960, -540); drawApartments(ctx, -200, 1400, 2400, 1800, t, 23, 0.45, '#10121c'); ctx.restore(); }],
  ['#10050f', (ctx, t) => drawNeonSign(ctx, 960, 90, 1.25, t, 'スナック月', '#ff4fd8')],
  ['#04050b', (ctx, t) => { stars(ctx, t, 200, 44, H, 1); drawMoon(ctx, 960, 520, 120, '#fff4d6', 1); }],
];
const KANJI_NUM = ['一', '二', '三', '四', '五', '六', '七'];
S(MONTAGE.length * 0.9, (ctx, t, p) => {
  const i = Math.min(MONTAGE.length - 1, Math.floor(t / 0.9)), lt = t - i * 0.9;
  const [bg, fn] = MONTAGE[i];
  fillAll(ctx, bg);
  ctx.save();
  camera(ctx, 960, 540, 1 + lt * 0.05);
  fn(ctx, t);
  ctx.restore();
  const last = i === MONTAGE.length - 1;
  vtxt(ctx, last ? '月' : '偽月 其ノ' + KANJI_NUM[i], 1780, 90, { size: 44, color: last ? PAPER : RED, weight: 800 });
  txt(ctx, last ? 'THE MOON' : 'FALSE MOON No.' + (i + 1), 140, 96, { size: 28, fam: F_EN, weight: 600, color: rgba(PAPER, 0.75), align: 'left', ls: 0.35 });
}, {
  amb: { city: 0.6, hum: 0.7, night: 0.4 },
  cues: MONTAGE.map((_, i) => [i * 0.9, () => Sound.fx.hit(i === MONTAGE.length - 1 ? 'card' : 'tick')]),
  subs: [[0.4, 6.6, N, 'この町には、偽物の月が多すぎる。', 'This town has far too many false moons.']],
});

// ═════════════════ TITLE ═════════════════

CARD(2.2, { bg: INK, fg: PAPER, jp: '午前二時四十七分', en: '2:47 AM', size: 120 }, {
  cues: [[0, () => Sound.fx.hit('card')], [0.2, () => Sound.fx.riser(2)]],
  amb: { night: 0.2 },
});

S(5, (ctx, t) => {
  fillAll(ctx, RED);
  ctx.strokeStyle = rgba(INK, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(140, 300); ctx.lineTo(W - 140, 300); ctx.moveTo(140, 780); ctx.lineTo(W - 140, 780); ctx.stroke();
  const w1 = (() => { ctx.font = font(250, 800); return ctx.measureText('あさひ').width; })();
  const w2 = (() => { ctx.font = font(250, 800); return ctx.measureText('モス').width; })();
  const x0 = 960 - (w1 + w2 + 20) / 2;
  txt(ctx, 'あさひ', x0, 540, { size: 250, color: INK, weight: 800, align: 'left' });
  txt(ctx, 'モス', x0 + w1 + 20, 540, { size: 250, color: PAPER, weight: 800, align: 'left' });
  txt(ctx, 'ASAHI  MOTH', 960, 860, { size: 40, fam: F_EN, weight: 600, color: INK, ls: 0.8 });
  vtxt(ctx, '其ノ壹', 1760, 330, { size: 52, color: PAPER, weight: 800 });
  ctx.save(); ctx.globalAlpha = 0.9; ctx.filter = 'none';
  ctx.translate(250, 200);
  drawMoth(ctx, 0, 0, 1.1, -0.4, 0.2 + 0.1 * Math.sin(t * 3), 1, false, INK);
  ctx.restore();
}, {
  post: { grain: 0.06, vignette: 0.15 },
  cues: [[0, () => { Sound.fx.hit('big'); Sound.fx.piano(THEME, 0.62, 0.9); }]],
  amb: { pad: 0.8, chord: 'Dm', drone: 0.25, droneHz: 36.7 },
});

// ═════════════════ PART ONE: the vending machine ═════════════════

S(14, (ctx, t, p) => {
  ctx.save();
  const e = Ease.inOutSine(p);
  camera(ctx, lerp(960, 640, e), lerp(540, 520, e), lerp(1.0, 1.55, e));
  setKonbini(ctx, t, {
    girl: c => {
      c.save(); c.translate(575, 538); c.scale(0.3, 0.3);
      drawFull(c, { t, pose: 'sit', blink: blinkAt(t, 3), look: [0.2, 0.3], parasol: { open: 0, rot: 0.55 }, wind: 0.5 });
      c.restore();
    },
  });
  ctx.restore();
}, {
  amb: { night: 0.8, hum: 0.8, crickets: 0.7, city: 0.35 },
  cues: [[1.2, () => Sound.fx.chime()]],
  subs: [
    [0.8, 4.6, N, '眠れなかった。午前二時四十七分に出歩く理由なんて、それくらいしかない。', "I couldn't sleep. That's the only reason to be out at 2:47 in the morning."],
    [5.8, 3.8, N, '自販機の上に、女の子が座っていた。', 'There was a girl sitting on top of a vending machine.'],
    [9.9, 3.8, N, '日傘を持って。真夜中に。', 'Holding a parasol. In the middle of the night.'],
  ],
});

CARD(1.3, { bg: PAPER, fg: INK, jp: '日傘', ruby: 'ひがさ', en: 'A PARASOL, AT MIDNIGHT', size: 170 });

function bustLowAngle(ctx, t, sh, face) {
  ctx.save();
  camera(ctx, 960, 540, 1.02, -0.05 + Math.sin(t * 0.3) * 0.015);
  setLowSky(ctx, t);
  additive(ctx, () => glow(ctx, 960, 1250, 1100, '#dff1ff', 0.5, 0.3));
  mothSwarm(ctx, t, 7, 960, 420, 700, 260, 0.35, 5);
  ctx.save();
  ctx.translate(960, 470);
  ctx.scale(1.05, 1.05);
  drawBust(ctx, { t, blink: blinkAt(t, 7), look: [0, 0.35], talk: talkOf(sh, t), wind: 0.8, ...face });
  ctx.restore();
  ctx.restore();
}

S(16.5, (ctx, t, p, sh) => {
  const ln = lineOf(sh, t);
  const face = [
    { mouth: 'closed', brow: 'neutral', lid: 0.25 },
    { mouth: 'closed', brow: 'neutral', lid: 0.3 },
    { mouth: 'closed', brow: 'neutral', lid: 0.3 },
    { mouth: t > 9.9 ? 'smile' : 'closed', brow: 'smug', lid: 0.2 },
    { mouth: t > 15 ? 'smile' : 'closed', brow: 'sad', lid: 0.15 },
  ][ln + 1] || {};
  bustLowAngle(ctx, t, sh, face);
}, {
  amb: { night: 0.7, hum: 0.4, crickets: 0.8, wind: 0.3 },
  subs: [
    [0.6, 3.0, A, '人間。じろじろと見ておるな。', 'Human. You are staring.'],
    [3.9, 4.0, N, '見るだろう、普通。自販機の上に女の子がいたら。', "Anyone would. There's a girl on a vending machine."],
    [8.2, 2.6, A, 'ならば見るがよい。許す。', 'Then stare. I permit it.'],
    [11.1, 5.2, A, '妾がまともに見られるのは、かれこれ六百年ぶりじゃからの。', 'It has been six hundred years since anyone looked at me properly.'],
  ],
});

CARD(1.0, { bg: RED, fg: INK, jp: '六百歳', en: 'SIX HUNDRED YEARS OLD', size: 190 });
CARD(1.0, { bg: INK, fg: PAPER, jp: '自称', en: 'SELF-PROCLAIMED', size: 190, layout: 'left' });

// the eye
S(6, (ctx, t, p) => {
  fillAll(ctx, '#050003');
  ctx.save();
  const z = lerp(6.4, 7.4, Ease.outCubic(p));
  ctx.translate(960, 560);
  ctx.scale(z, z);
  ctx.translate(84, -24);
  drawHead(ctx, { t, blink: t > 5.2 ? clamp((t - 5.2) / 0.12) : 0, pupil: lerp(1, 0.4, seg(t, 0.9, 2.4, Ease.outCubic)), look: [0, 0.1], wind: 0.3 });
  ctx.restore();
  vignette(ctx, 0.85, '#200000');
  vtxt(ctx, '赤信号', 1780, 120, { size: 44, color: RED, weight: 800 });
}, {
  post: { grain: 0.09, vignette: 0.3 },
  amb: { drone: 0.5, night: 0.2, droneHz: 32.7 },
  cues: [[0.5, () => Sound.fx.heartbeat()], [2.2, () => Sound.fx.heartbeat()], [1.0, () => Sound.fx.glass()]],
  subs: [[0.4, 5.3, N, 'その瞳は、赤信号の色をしていた。', 'Her eyes were the exact red of a stop signal.']],
});

CARD(1.3, { bg: INK, fg: RED, jp: '吸血鬼', ruby: 'きゅうけつき', en: 'VAMPIRE', size: 190 });

// ── the name ──
const NAME_BG = [
  ['#1c2254', PAPER, '朝日'],
  ['#e8a317', '#ffffff', 'ビール'],
  [RED, INK, '太陽'],
  [INK, '#f6d98a', '冗談'],
  [PAPER, INK, '皮肉'],
];
S(18, (ctx, t, p, sh) => {
  const ln = Math.max(0, lineOf(sh, t));
  const [bg, wm, word] = NAME_BG[ln];
  fillAll(ctx, bg);
  // giant watermark word
  ctx.save();
  ctx.globalAlpha = 0.14;
  txt(ctx, word, 960, 560, { size: [...word].length > 2 ? 420 : 560, color: wm, weight: 800 });
  ctx.restore();
  let face = {};
  let tilt = 0, sx = 0, sy = 0, z = 1.95;
  if (ln === 0) face = { mouth: 'closed', brow: 'neutral', lid: 0.1 };
  if (ln === 1) face = { mouth: 'pout', brow: 'neutral', lid: 0.5, look: [0.3, 0] };
  if (ln === 2) {
    const k = seg(t, 6.35, 6.7, Ease.outBack);
    tilt = -0.38 * k; z = 1.95 + 0.25 * k;
    [sx, sy] = shake(t, 10 * (1 - seg(t, 6.6, 8.5)));
    face = { mouth: t < 8.9 ? 'open' : 'grin', brow: 'angry', lid: 0, vein: true, irisScale: 0.85 };
  }
  if (ln === 3) face = { mouth: 'closed', brow: 'smug', lid: 0.35, look: [-0.4, 0.1] };
  if (ln === 4) face = { mouth: t > 15.8 ? 'grin' : 'smile', brow: 'smug', lid: 0.38, blush: 0.2 };
  ctx.save();
  ctx.translate(960 + sx, 440 + sy);
  ctx.scale(z, z);
  drawBust(ctx, { t, blink: blinkAt(t, 11), talk: talkOf(sh, t), wind: 0.6, tilt, ...face });
  ctx.restore();
  if (ln === 0) {
    const a = seg(t, 0.6, 1.1) * (1 - seg(t, 3.5, 3.8));
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = INK; ctx.fillRect(1640, 110, 150, 560);
    vtxt(ctx, '夜更朝日', 1715, 150, { size: 96, color: PAPER, weight: 800, lh: 1.15 });
    vtxt(ctx, 'よふけ あさひ', 1612, 160, { size: 26, color: PAPER, weight: 700, lh: 1.3 });
    ctx.restore();
    txt(ctx, 'YOFUKE ASAHI', 1715, 720, { size: 26, fam: F_EN, weight: 600, color: rgba(PAPER, a * 0.8), ls: 0.3 });
  }
}, {
  post: { grain: 0.06, vignette: 0.25 },
  amb: { pad: 0.5, chord: 'Dm', crickets: 0.3, night: 0.3 },
  cues: [[0.5, () => Sound.fx.piano([[0, 74, 1, 0.7], [1, 81, 2, 0.7], [0, 50, 3, 0.4]], 0.6)], [3.8, () => Sound.fx.hit('tick')], [6.4, () => Sound.fx.hit('card')], [9.8, () => Sound.fx.hit('tick')], [13.4, () => Sound.fx.hit('tick')]],
  subs: [
    [0.5, 3.1, A, '妾は、夜更朝日。', 'I am Yofuke Asahi.'],
    [3.8, 2.5, N, '朝日……ビールの?', 'Asahi... like the beer?'],
    [6.4, 3.2, A, '太陽の、じゃ! 無教養な小童め!', 'Like the SUN, you uncultured brat!'],
    [9.8, 3.4, N, '朝日という名前の吸血鬼。冗談みたいな話だ。', 'A vampire named Morning Sun. Sounds like a joke.'],
    [13.4, 4.4, A, '自分で付けた名じゃ。皮肉というものよ。', 'I picked it myself. It is called irony, human.'],
  ],
});

CARD(1.1, { bg: PAPER, fg: RED, jp: '皮肉', ruby: 'ひにく', en: 'IRONY', size: 200, layout: 'vertical', x: W * 0.55 });

// ═════════════════ PART TWO: little suns ═════════════════

S(22, (ctx, t, p, sh) => {
  const inv = seg(t, 18.1, 18.2);
  ctx.save();
  camera(ctx, 960, 520, lerp(1.0, 1.12, Ease.inOutSine(p)));
  setVoid(ctx, t, {
    bg: inv > 0.5 ? RED : '#eee7da',
    center: c => {
      const s = 3.6 / 2.2;
      drawVending(c, 960 - 50 * s, 470 + 620 / 2.2 - 183 * s, s, t, { body: inv > 0.5 ? INK : '#e9e6df', accent: RED, seed: 77, side: 8 });
      c.save(); c.translate(960, 470 + 620 / 2.2 - 183 * s + 2); c.scale(0.4, 0.4);
      const ln = lineOf(sh, t);
      drawFull(c, { t, pose: 'sit', blink: blinkAt(t, 5), talk: talkOf(sh, t), look: [0.1, 0.25], mouth: ln === 2 ? 'smile' : 'closed', brow: ln === 2 ? 'smug' : 'neutral', lid: ln >= 3 ? 0.3 : 0, parasol: { open: 0, rot: 0.55 }, wind: 0.4 });
      c.restore();
    },
  });
  ctx.restore();
  // floating statistics
  const a1 = seg(t, 9.8, 10.4) * (1 - seg(t, 14.4, 14.8));
  const a2 = seg(t, 11.6, 12.2) * (1 - seg(t, 14.4, 14.8));
  if (a1 > 0) {
    ctx.save(); ctx.globalAlpha = a1;
    const x = lerp(1900, 1490, Ease.outCubic(seg(t, 9.8, 10.8)));
    txt(ctx, '4,000,000', x, 250, { size: 104, fam: F_EN, weight: 600, color: INK, ls: 0.05 });
    txt(ctx, '自動販売機', x, 330, { size: 34, color: RED, weight: 800, ls: 0.4 });
    ctx.restore();
  }
  if (a2 > 0) {
    ctx.save(); ctx.globalAlpha = a2;
    const x = lerp(20, 430, Ease.outCubic(seg(t, 11.6, 12.6)));
    txt(ctx, '56,000', x, 250, { size: 104, fam: F_EN, weight: 600, color: INK, ls: 0.05 });
    txt(ctx, 'コンビニエンスストア', x, 330, { size: 30, color: RED, weight: 800, ls: 0.25 });
    ctx.restore();
  }
  const a3 = seg(t, 4.4, 5) * (1 - seg(t, 9.2, 9.7));
  if (a3 > 0) {
    ctx.save(); ctx.globalAlpha = a3;
    txt(ctx, '小さな太陽', 430, 250, { size: 76, color: INK, weight: 800, ls: 0.1 });
    txt(ctx, 'LITTLE SUNS', 430, 330, { size: 28, fam: F_EN, weight: 600, color: RED, ls: 0.4 });
    ctx.restore();
  }
}, {
  post: { grain: 0.07, vignette: 0.2 },
  amb: [[0, { drone: 0.45, ring: 1, pad: 0.35, chord: 'Am', droneHz: 27.5 }], [18.1, { drone: 0.8, ring: 1, pad: 0.5, chord: 'Em7b5', droneHz: 27.5 }]],
  cues: [[0, () => Sound.fx.glass()], [9.8, () => Sound.fx.hit('tick')], [11.6, () => Sound.fx.hit('tick')], [18.1, () => Sound.fx.hit('card')]],
  subs: [
    [0.8, 3.0, N, 'どうして自販機の上なんだ?', 'Why a vending machine?'],
    [4.2, 5.3, A, '明るいからじゃ。この国は街角ごとに小さな太陽を建てる。しかも、どれも焼けぬ。', 'Because it is bright. Your country builds a little sun on every corner, and none of them burn.'],
    [9.8, 4.6, A, '自販機がおよそ四百万台。コンビニが五万と数千。数えたのじゃ。', 'About four million vending machines. Fifty-some thousand konbini. I counted.'],
    [14.6, 3.3, N, 'だから毎晩、その周りをぐるぐると。', 'So every night, you circle them.'],
    [18.2, 3.4, N, 'まるで、蛾だな。', 'Like a moth.'],
  ],
});

CARD(1.1, { bg: RED, fg: INK, jp: '蛾', ruby: 'が', en: 'MOTH', size: 330 });

S(6.2, (ctx, t, p, sh) => {
  fillAll(ctx, '#ead9c6');
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = INK;
  for (let i = 0; i < 5; i++) drawMoth(ctx, 300 + i * 340, 200 + (i % 2) * 600, 2.2, 0.3 * i, 0, 1, true, INK);
  ctx.restore();
  const ln = lineOf(sh, t);
  const face = ln <= 0 ? { mouth: 'pout', brow: 'angry', lid: 0.2 } : { mouth: t > 5 ? 'smile' : 'closed', brow: 'sad', lid: 0.1, look: [-0.5, 0.15], blush: seg(t, 2.8, 3.6) };
  ctx.save();
  ctx.translate(960 + (ln <= 0 ? shake(t, 3)[0] : 0), 470);
  ctx.scale(1.25, 1.25);
  drawBust(ctx, { t, blink: blinkAt(t, 2), talk: talkOf(sh, t), wind: 0.4, tilt: ln > 0 ? 0.1 : 0, ...face });
  ctx.restore();
}, {
  post: { grain: 0.05, vignette: 0.2 },
  amb: { pad: 0.5, chord: 'F', crickets: 0.3 },
  subs: [
    [0.3, 2.2, A, '無礼な。', 'How rude.'],
    [2.7, 3.4, A, '……じゃが、間違ってはおらぬ。', '...But not incorrect.'],
  ],
});

// ═════════════════ PART THREE: toward morning ═════════════════

CARD(1.7, { bg: INK, fg: PAPER, jp: '午前四時十二分', en: '4:12 AM', size: 120 }, { amb: { night: 0.3 } });

S(14, (ctx, t, p) => {
  setShadowWalk(ctx, t);
  const a = seg(t, 5.8, 6.4) * (1 - seg(t, 9.6, 10));
  if (a > 0) {
    ctx.save(); ctx.globalAlpha = a;
    vtxt(ctx, '影', 1700, 200, { size: 150, color: RED, weight: 800 });
    vtxt(ctx, 'ひとつ', 1560, 230, { size: 46, color: PAPER, weight: 700 });
    ctx.restore();
  }
}, {
  post: { grain: 0.09, vignette: 0.6 },
  amb: { steps: 1, crickets: 0.4, night: 0.6, pad: 0.35, chord: 'Am' },
  subs: [
    [0.8, 4.4, N, '空が薄くなり始めるまで、僕らは歩いた。', 'We walked until the sky began to thin.'],
    [5.6, 4.4, N, '影がひとつしかないことには、気づかないふりをした。', 'I pretended not to notice there was only one shadow.'],
    [10.3, 3.7, A, '人間。夜明けに蛾がどうなるか、知っておるか?', 'Human. Do you know what happens to the moths at dawn?'],
  ],
});

// crossing, wide, before dawn. she is on the far side
function girlFarSide(t, face = {}) {
  return c => {
    c.save(); c.translate(960, 716); c.scale(0.12, 0.12);
    drawFull(c, { t, blink: blinkAt(t, 9), parasol: { open: 0, rot: 0.5 }, wind: 0.6, ...face });
    c.restore();
  };
}
S(5.4, (ctx, t, p, sh) => {
  ctx.save();
  camera(ctx, 960, 560, lerp(1.12, 1.2, p));
  setCrossing(ctx, t, { dawn: 0.38, gates: 0, bell: true, girl: girlFarSide(t, { talk: talkOf(sh, t) }) });
  ctx.restore();
  letterbox(ctx, 1);
}, {
  amb: { bell: 1, night: 0.6, crickets: 0.25, wind: 0.3 },
  subs: [[0.6, 4.2, A, '偽物の月は、消えるのじゃ。', 'The false moons go out.']],
});

// medium: her behind the gate, lit red; then the train
function crossingMedium(ctx, t, o, sh) {
  const d = o.dawn;
  nightSky(ctx, t, d, 820);
  skyline(ctx, t, 820, 41, mix('#0a0a14', '#2d2440', d), 1 - d);
  ctx.fillStyle = mix('#0f0e16', '#2a2335', d); ctx.fillRect(0, 818, W, H - 818);
  // the far signal, big, to the right
  drawCrossingSignal(ctx, 1520, 1020, 1.9, t, o.bell, true);
  // her, knees up
  ctx.save();
  ctx.translate(860, 1420);
  ctx.scale(1.05, 1.05);
  drawFull(ctx, { t, blink: blinkAt(t, 13), talk: talkOf(sh, t), parasol: { open: 0, rot: 0.5 }, wind: 1 + (o.windBoost || 0), look: [0.1, 0], ...o.face });
  ctx.restore();
  if (o.bell) additive(ctx, () => {
    crossingGlow(ctx, 1520, 1020, 1.9, t, true);
    const ph = Math.floor(t * 2.3) % 2;
    glow(ctx, ph ? 1150 : 900, 520, 520, '#ff1a2a', 0.22, 0.3);
  });
  // gate arm across the foreground
  const g = o.gates || 0;
  ctx.save(); ctx.translate(1580, 930); ctx.scale(-1, 1); drawGateArm(ctx, 0, 0, 1800, -g * Math.PI / 2 * 0.95, 2.2); ctx.restore();
}
function trainForeground(ctx, t, t0, v = 4300) {
  const carW = 3900, gap = 190, cars = 5, total = cars * (carW + gap);
  const front = (t - t0) * v;
  if (front < 0 || front - total > W) return 0;
  const top = 150, bot = 1110;
  for (let c = 0; c < cars; c++) {
    const x1 = front - c * (carW + gap), x0 = x1 - carW;
    if (x0 > W || x1 < 0) continue;
    ctx.fillStyle = '#15171d'; ctx.fillRect(x0, top, carW, bot - top);
    // motion blurred window band
    ctx.fillStyle = vgrad(ctx, 330, 640, [[0, 'rgba(255,238,200,0.0)'], [0.15, 'rgba(255,238,200,0.55)'], [0.85, 'rgba(255,226,170,0.55)'], [1, 'rgba(255,226,170,0)']]);
    ctx.fillRect(x0 + 40, 330, carW - 80, 310);
    for (let k = 0; k < 14; k++) {
      const wx = x0 + 60 + k * 275;
      ctx.fillStyle = rgba(hash(k + c * 7) > 0.5 ? '#fff4d8' : '#3a2e1a', 0.08 + hash(k * 5 + c) * 0.08);
      ctx.fillRect(wx, 350, 240, 270);
    }
    ctx.fillStyle = rgba('#e8e4da', 0.9); ctx.fillRect(x0, 300, carW, 5);
    // streaks
    for (let k = 0; k < 18; k++) {
      const yy = 180 + hash(k + c * 31) * 900;
      ctx.fillStyle = rgba('#8a90a0', 0.08 + hash(k * 3 + c) * 0.12);
      ctx.fillRect(x0, yy, carW, 2 + hash(k + 9) * 4);
    }
    ctx.fillStyle = '#1b998b'; ctx.fillRect(x0, 760, carW, 46);
    ctx.fillStyle = '#0a0b0e'; ctx.fillRect(x0, top, carW, 26); ctx.fillRect(x0, 980, carW, 130);
    // front/back ends slightly lighter
    ctx.fillStyle = rgba('#000000', 0.5); ctx.fillRect(x0, top, 30, bot - top); ctx.fillRect(x1 - 30, top, 30, bot - top);
  }
  return 1;
}
S(9, (ctx, t, p, sh) => {
  crossingMedium(ctx, t, { dawn: 0.42, bell: true, gates: 0, windBoost: seg(t, 1.2, 2) * (1 - seg(t, 6.5, 7.5)) * 2.5, face: { mouth: 'closed', brow: 'neutral', lid: 0.2 } }, sh);
  trainForeground(ctx, t, 1.3);
}, {
  post: { grain: 0.07, vignette: 0.45 },
  amb: { bell: 1, night: 0.5, wind: 0.4 },
  cues: [[0.1, () => Sound.fx.train(7.8)]],
  subs: [[1.6, 5.6, A, '毎朝、螺旋はほどけて、蛾は自由になるのじゃ。', 'Every morning the spiral comes undone, and the moths go free.']],
});

S(6.6, (ctx, t, p, sh) => {
  crossingMedium(ctx, t, { dawn: 0.5, bell: t < 0.6, gates: seg(t, 0.8, 3.2, Ease.inOutCubic), face: { mouth: t > 5.2 ? 'smile' : 'closed', brow: 'sad', lid: 0.15, blush: 0.25 } }, sh);
}, {
  post: { grain: 0.07, vignette: 0.45 },
  amb: { night: 0.4, wind: 0.4, pad: 0.4, chord: 'F' },
  subs: [[0.9, 5.2, A, 'だから、そんな顔をするでない。妾は、これがわりと好きなのじゃ。', "So don't make that face. I rather like this part."]],
});

// dawn: lamps go out, she opens the parasol, and is gone
let _buf = null;
function bufferFor(ctx) {
  const cv = ctx.canvas;
  if (!_buf || _buf.width !== cv.width || _buf.height !== cv.height) {
    _buf = document.createElement('canvas');
    _buf.width = cv.width; _buf.height = cv.height;
  }
  const b = _buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, _buf.width, _buf.height);
  b.setTransform(ctx.getTransform());
  return b;
}
const DAWN = { x: 960, y: 1060, s: 0.66 };
const LAMP_OFF = [4.5, 12];
S(22, (ctx, t, p, sh) => {
  const dawn = lerp(0.5, 0.95, seg(t, 0, 20, Ease.inOutSine));
  const sun = seg(t, 14.2, 17.5, Ease.outCubic);
  setDawnStreet(ctx, t, { dawn, lampsOff: seg(t, LAMP_OFF[0], LAMP_OFF[1], x => x), sun });
  const open = seg(t, 5.2, 6.3, Ease.inOutCubic);
  const rot = lerp(0.5, 0.06, seg(t, 4.8, 5.8, Ease.inOutCubic));
  const diss = seg(t, 15.8, 18.4, x => x);
  const ln = lineOf(sh, t);
  const face = ln === 2 ? { mouth: t > 13.6 ? 'grin' : 'smile', brow: 'smug', lid: t > 13.6 ? 0.55 : 0.1 } : ln === 1 ? { mouth: 'closed', brow: 'sad', lid: 0.1 } : { mouth: 'smile', brow: 'neutral', lid: 0.15 };
  const hand = [DAWN.x + 60 * DAWN.s, DAWN.y - 676 * DAWN.s];
  const girl = c => {
    c.save(); c.translate(DAWN.x, DAWN.y); c.scale(DAWN.s, DAWN.s);
    drawFull(c, { t, blink: blinkAt(t, 21), talk: talkOf(sh, t), wind: 1.2, look: [0, 0.05], ...face, parasol: diss > 0 ? null : { open, rot } });
    c.restore();
  };
  if (diss <= 0) girl(ctx);
  else {
    const b = bufferFor(ctx);
    girl(b);
    // noise dissolve, bottom-up with ragged edge
    const sc = ctx.getTransform().a;
    b.save();
    b.setTransform(sc, 0, 0, sc, 0, 0);
    b.globalCompositeOperation = 'destination-out';
    const cell = 10;
    for (let y = 300; y < H; y += cell) for (let x = 640; x < 1280; x += cell) {
      const th = hash2(x * 0.37, y * 0.71) * 0.55 + (1 - (y - 300) / 780) * 0.45;
      if (th < diss * 1.05) b.fillRect(x, y, cell, cell);
    }
    b.restore();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - Math.pow(diss, 1.5) * 0.5; ctx.drawImage(_buf, 0, 0); ctx.restore();
    // the parasol, left behind, falls
    const f = seg(t, 16.6, 18.6, Ease.inCubic);
    const bounce = seg(t, 18.6, 19.4, Ease.outCubic);
    ctx.save();
    ctx.translate(lerp(hand[0], hand[0] + 50, f), lerp(hand[1], 985, f) - Math.sin(bounce * Math.PI) * 30);
    ctx.rotate(lerp(0.06, 1.25, f) + Math.sin(bounce * Math.PI) * 0.1);
    ctx.scale(DAWN.s, DAWN.s);
    drawParasol(ctx, 1, 600, 360);
    ctx.restore();
  }
  // moths leaving
  if (t > 15.6) {
    const r = mulberry32(42);
    for (let i = 0; i < 46; i++) {
      const sx = 700 + r() * 520, sy = 330 + r() * 720;
      const born = 15.8 + ((1 - (sy - 300) / 780) * 0.45 + r() * 0.55) * 2.6;
      const age = t - born;
      if (age < 0) continue;
      const dir = -Math.PI / 2 + (r() - 0.5) * 2.2, spd = 120 + r() * 220;
      const x = sx + Math.cos(dir) * spd * age + Math.sin(age * 3 + i) * 30;
      const y = sy + Math.sin(dir) * spd * age - age * age * 20;
      const a = clamp(age / 0.3) * clamp(1 - (age - 4) / 2);
      if (a <= 0) continue;
      ctx.save(); ctx.globalAlpha = a;
      drawMoth(ctx, x, y, 0.3 + r() * 0.35, dir + Math.PI / 2 + Math.sin(age * 5) * 0.3, 0.5 + 0.5 * Math.sin(t * 30 + i), 1, false);
      ctx.restore();
    }
  }
  // sunrise bloom
  if (sun > 0) additive(ctx, () => glow(ctx, 960, 560, 1400, '#ffd6a0', 0.25 * sun, 0.3));
}, {
  post: { grain: 0.07, vignette: 0.4 },
  amb: [
    [0, { wind: 0.5, pad: 0.7, chord: 'F', night: 0.3, crickets: 0.15 }],
    [6.8, { wind: 0.5, pad: 0.7, chord: 'C', night: 0.2 }],
    [10.6, { wind: 0.5, pad: 0.8, chord: 'Dm', night: 0.1 }],
    [14.2, { wind: 0.6, pad: 1, chord: 'Bbmaj7', birds: 0.6 }],
    [18.4, { wind: 0.5, pad: 0.9, chord: 'F', birds: 1 }],
  ],
  cues: [
    [4.9, () => Sound.fx.footstep()],
    [5.2, () => Sound.fx.umbrella()],
    ...Array.from({ length: 8 }, (_, k) => [LAMP_OFF[0] + (LAMP_OFF[1] - LAMP_OFF[0]) * ((k + 1) / 8.5), () => Sound.fx.relay()]),
    [10.6, () => Sound.fx.piano([[0, 69, 1, 0.6], [1, 74, 1, 0.6], [2, 72, 2, 0.6]], 0.55)],
    [15.8, () => { Sound.fx.flutter(3.5, 0.3); Sound.fx.glass(); Sound.fx.piano(THEME_MAJOR, 0.6, 0.9); }],
    [18.6, () => Sound.fx.footstep()],
  ],
  subs: [
    [0.8, 3.2, A, '解き放たれるのが。', 'Being set free.'],
    [6.8, 3.2, N, '……また、会えるか?', '...Will I see you again?'],
    [10.6, 4.0, A, 'では、また今宵。人間。', 'Until tonight, then. Human.'],
  ],
});

CARD(1.8, { bg: PAPER, fg: INK, jp: '朝', ruby: 'あさ', en: 'MORNING', size: 260 }, {
  amb: { birds: 1, wind: 0.3 },
  cues: [[0, () => Sound.fx.hit('tick')]],
});

// ═════════════════ EPILOGUE ═════════════════

const CANS = [
  { name: 'おしるこ', en: 'OSHIRUKO', body: '#7e1f2c', band: '#efe1c8', ink: '#7e1f2c', hot: true, price: '130' },
  { name: 'トマト', en: 'TOMATO', body: '#d7263d', band: '#ffffff', ink: '#2f7d32', price: '120' },
  { name: '朝日', en: 'MORNING SUN', body: '#f2c14e', band: '#ffffff', ink: '#111111', sun: true, price: '130', sold: true },
  { name: '夜珈琲', en: 'NIGHT COFFEE', body: '#141414', band: '#c9a45c', ink: '#141414', enInk: '#141414', hot: true, price: '140' },
  { name: 'ミルクティー', en: 'MILK TEA', body: '#e8d8c0', band: '#8b5a2b', ink: '#8b5a2b', price: '160' },
];
function drawCan(ctx, x, y, w, h, c, t) {
  ctx.save();
  ctx.translate(x, y);
  roundRect(ctx, -w / 2, 0, w, h, 16);
  ctx.fillStyle = c.body; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = c.band; ctx.fillRect(-w / 2, h * 0.18, w, h * 0.5);
  if (c.sun) {
    ctx.fillStyle = RED;
    ctx.beginPath(); ctx.arc(0, h * 0.44, w * 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(RED, 0.55); ctx.lineWidth = 6;
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * w * 0.36, h * 0.44 + Math.sin(a) * w * 0.36); ctx.lineTo(Math.cos(a) * w * 0.9, h * 0.44 + Math.sin(a) * w * 0.9); ctx.stroke(); }
    drawMoth(ctx, w * 0.26, h * 0.62, 0.35, -0.3, 0, 1, true);
  }
  const nm = [...c.name].length;
  vtxt(ctx, c.name, c.sun ? -w * 0.28 : 0, h * 0.2, { size: nm > 5 ? w * 0.1 : nm > 3 ? w * 0.15 : w * 0.24, color: c.sun ? '#111111' : c.ink, weight: 800 });
  txt(ctx, c.en, 0, h * 0.8, { size: w * 0.075, fam: F_EN, weight: 700, color: c.sun ? '#111' : c.enInk || c.band, ls: 0.15 });
  // metal shine
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-w * 0.36, 0, w * 0.08, h);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(w * 0.3, 0, w * 0.2, h);
  ctx.restore();
  ctx.fillStyle = '#b8bcc2'; ctx.fillRect(-w / 2 + 8, -10, w - 16, 14);
  ctx.restore();
}
function vendingCloseup(ctx, t, press) {
  fillAll(ctx, '#e9e6df');
  ctx.fillStyle = vgrad(ctx, 60, 1020, [[0, '#fbfdff'], [1, '#d6ebff']]);
  ctx.fillRect(-400, 60, 3400, 700);
  for (let i = 0; i < CANS.length; i++) {
    const c = CANS[i], x = 360 + i * 520;
    drawCan(ctx, x, 150, 250, 470, c, t);
    // label strip & button
    ctx.fillStyle = c.hot ? '#d62839' : '#1f6fd1'; ctx.fillRect(x - 170, 660, 340, 56);
    txt(ctx, c.hot ? 'あったか〜い' : 'つめた〜い', x, 688, { size: 32, color: '#ffffff', weight: 800 });
    ctx.fillStyle = '#26282e'; roundRect(ctx, x - 170, 760, 340, 150, 12); ctx.fill();
    txt(ctx, '¥' + c.price, x - 40, 835, { size: 64, fam: F_EN, weight: 700, color: '#ffd23f' });
    const lit = c.sold ? (press > 0 && press < 1 ? (Math.floor(press * 8) % 2 ? 0.3 : 1) : 1) : 0;
    ctx.fillStyle = c.sold ? mix('#3a0808', '#ff2a2a', lit) : '#123a1a';
    roundRect(ctx, x + 60, 800, 96, 70, 8); ctx.fill();
    txt(ctx, c.sold ? '売切' : '', x + 108, 836, { size: 34, color: '#ffffff', weight: 800 });
    if (c.sold && lit) additive(ctx, () => glow(ctx, x + 108, 836, 160, '#ff2a2a', 0.4 * lit));
  }
  ctx.fillStyle = '#b9b5ad'; ctx.fillRect(-400, 940, 3400, 200);
}
S(14, (ctx, t, p) => {
  ctx.save();
  const e = Ease.inOutSine(seg(t, 0, 8));
  const z = lerp(1.0, 1.55, Ease.inOutCubic(seg(t, 5, 9)));
  camera(ctx, lerp(900, 1400, e), lerp(540, 500, e), z);
  vendingCloseup(ctx, t, seg(t, 8.3, 9.4, x => x));
  ctx.restore();
  if (t > 8.3 && t < 8.5) { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, 0, W, H); }
}, {
  post: { grain: 0.06, vignette: 0.5 },
  amb: { hum: 1, crickets: 0.6, night: 0.5 },
  cues: [[8.3, () => Sound.fx.buzz()]],
  subs: [
    [0.8, 4.4, N, '次の夜。あの自販機に、見慣れない飲み物が並んでいた。', 'The next night, that vending machine had a drink I had never seen before.'],
    [5.6, 2.6, N, '『朝日』。百三十円。', '"Morning Sun." 130 yen.'],
    [8.6, 2.4, N, '売り切れだった。', 'Sold out.'],
    [11.2, 2.6, N, '……まあ、そうだろうな。', '...Yeah. Figures.'],
  ],
});

CARD(1.1, { bg: RED, fg: PAPER, jp: '売切', en: 'SOLD OUT', size: 220 });

S(9, (ctx, t, p, sh) => {
  ctx.save();
  camera(ctx, 960, 560, lerp(1.25, 1.0, Ease.inOutSine(p)));
  nightSky(ctx, t, 0, 700);
  drawMoon(ctx, 1500, 200, 80, '#fff4d6', 1);
  skyline(ctx, t, 700, 57, '#07080f');
  ctx.fillStyle = '#121218'; ctx.fillRect(-W, 700, W * 3, H);
  const s = 2.3, vx = 960 - 50 * s, vy = 900 - 183 * s;
  additive(ctx, () => vendingGlow(ctx, vx, vy, s, 1));
  drawVending(ctx, vx, vy, s, t, { seed: 3, body: '#1f6fd1', accent: '#ffffff', brand: 'MOON', side: 12, sold: [9] });
  // a luna moth comes to rest where she sat
  const land = seg(t, 0.4, 4.2, Ease.outCubic);
  const mx = lerp(1700, 960, land) + Math.sin(t * 2.5) * 40 * (1 - land);
  const my = lerp(260, vy - 8, land) + Math.sin(t * 3.3) * 30 * (1 - land);
  const fl = land < 1 ? 0.5 + 0.5 * Math.sin(t * 26) : 0.15 + 0.1 * Math.sin(t * 1.7);
  drawMoth(ctx, mx, my, 0.9, land < 1 ? -0.8 + land * 0.8 : 0, fl, 1, false);
  mothSwarm(ctx, t, 4, 960, vy + 120, 200, 80, 0.2, 29);
  ctx.restore();
}, {
  post: { grain: 0.07, vignette: 0.55 },
  amb: { hum: 0.6, crickets: 0.8, night: 0.6, pad: 0.4, chord: 'F' },
  cues: [[0.4, () => Sound.fx.flutter(3.6, 0.12)], [2.4, () => Sound.fx.piano(THEME, 0.7, 0.8)]],
  subs: [[0.8, 7.4, N, 'それ以来、僕は夜更かしをしている。月にだって、話し相手くらいは要るだろう。', "I've been staying up late ever since. Even the moon could use someone to talk to."]],
});

// end card
S(4.2, (ctx, t) => {
  fillAll(ctx, RED);
  txt(ctx, 'あさひモス', 900, 540, { size: 150, color: INK, weight: 800, ls: 0.06 });
  ctx.fillStyle = INK; ctx.fillRect(1340, 460, 160, 160);
  txt(ctx, '終', 1420, 544, { size: 120, color: RED, weight: 800 });
}, { post: { grain: 0.05, vignette: 0.1 }, cues: [[0, () => Sound.fx.hit('big')]], amb: { pad: 0.6, chord: 'Dm' } });

// credits
const CREDITS = [
  ['あさひモス', 'ASAHI MOTH'],
  ['夜更 朝日', 'yofuke = late night · asahi = morning sun'],
  ['一本の短編', 'An original short, made in homage to the visual language of the Monogatari series.'],
  ['キャンバスと音', 'Drawn in Canvas 2D. Every sound synthesised live with WebAudio. No external assets.'],
];
S(11, (ctx, t) => {
  fillAll(ctx, INK);
  CREDITS.forEach(([jp, en], i) => {
    const a = seg(t, 0.4 + i * 1.3, 1.2 + i * 1.3);
    ctx.save(); ctx.globalAlpha = a;
    txt(ctx, jp, 960, 250 + i * 170, { size: i ? 40 : 64, color: i ? PAPER : RED, weight: 800, ls: 0.12 });
    txt(ctx, en, 960, 250 + i * 170 + (i ? 52 : 70), { size: i ? 26 : 30, fam: F_EN, weight: 600, color: rgba(PAPER, 0.7), ls: i ? 0.08 : 0.6, italic: i === 1 });
    ctx.restore();
  });
  const a = seg(t, 7, 8);
  ctx.save(); ctx.globalAlpha = a;
  drawMoth(ctx, 960, 960, 0.5, 0, 0.1 + 0.1 * Math.sin(t * 2), 1, false);
  ctx.restore();
}, {
  post: { grain: 0.05, vignette: 0.3 },
  amb: { pad: 0.5, chord: 'F', crickets: 0.4 },
  cues: [[0.3, () => Sound.fx.piano(THEME_MAJOR, 0.75, 0.7)]],
});
