// ─────────────────────────────────────────────────────────────
//  Props: the furniture of a Japanese night. Vending machines,
//  a konbini, a railway crossing, poles, wires, lamps, a train.
// ─────────────────────────────────────────────────────────────

const DRINK_COLS = ['#d7263d', '#1b998b', '#f4d35e', '#2e294e', '#f46036', '#e8e1ef', '#3a86ff', '#8ac926', '#6a4c93', '#ff99c8', '#ffffff', '#0b3954'];

// Vending machine, 100 × 183 units, top-left origin.
// o: {body, accent, lit, seed, sold:[idx], side}
function drawVending(ctx, x, y, s, t, o = {}) {
  const lit = o.lit ?? 1;
  const r = mulberry32(o.seed || 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const body = o.body || '#e9e6df', accent = o.accent || RED;
  // side depth
  if (o.side) {
    ctx.fillStyle = mix(body, '#000000', 0.45);
    ctx.beginPath(); ctx.moveTo(100, 2); ctx.lineTo(100 + o.side, 8); ctx.lineTo(100 + o.side, 183); ctx.lineTo(100, 183); ctx.closePath(); ctx.fill();
  }
  roundRect(ctx, 0, 0, 100, 183, 3);
  ctx.fillStyle = body; ctx.fill();
  ctx.strokeStyle = '#0a0a0e'; ctx.lineWidth = 1.2; ctx.stroke();
  // header
  ctx.fillStyle = accent; ctx.fillRect(0, 0, 100, 8);
  // display window
  const win = vgrad(ctx, 10, 96, [[0, mix('#20242c', '#fbfdff', lit)], [1, mix('#15171c', '#d8ecff', lit)]]);
  ctx.fillStyle = win; ctx.fillRect(6, 10, 88, 86);
  // far away: skip the fiddly bits, keep the silhouette and the glow
  if (s < (o.lod ?? 0.9)) {
    for (let row = 0; row < 3; row++) {
      const y0 = 13 + row * 28;
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = mix('#111111', DRINK_COLS[(row * 7 + i + (o.seed || 1)) % DRINK_COLS.length], 0.35 + 0.65 * lit);
        ctx.fillRect(9 + i * 12.2 + 1.5, y0 + 5, 8, 13);
      }
      ctx.fillStyle = row === 2 ? '#d62839' : '#1f6fd1';
      ctx.fillRect(8, y0 + 19.5, 84, 2.5);
    }
    ctx.fillStyle = accent; ctx.fillRect(6, 99, 60, 26);
    ctx.fillStyle = '#b9b5ad'; ctx.fillRect(70, 99, 24, 48);
    ctx.fillStyle = '#16171b'; ctx.fillRect(8, 148, 58, 22);
    ctx.fillStyle = '#0c0c0e'; ctx.fillRect(0, 176, 100, 7);
    ctx.restore();
    return;
  }
  // products: 3 rows × 7
  for (let row = 0; row < 3; row++) {
    const y0 = 13 + row * 28;
    for (let i = 0; i < 7; i++) {
      const px = 9 + i * 12.2;
      const col = DRINK_COLS[Math.floor(r() * DRINK_COLS.length)];
      const kind = r();
      ctx.fillStyle = mix('#111111', col, 0.35 + 0.65 * lit);
      if (kind < 0.5) { roundRect(ctx, px + 1.5, y0 + 5, 8, 13, 1.5); ctx.fill(); }
      else {
        ctx.beginPath();
        ctx.moveTo(px + 3.5, y0 + 1); ctx.lineTo(px + 6.5, y0 + 1); ctx.lineTo(px + 6.5, y0 + 4);
        ctx.lineTo(px + 9, y0 + 7); ctx.lineTo(px + 9, y0 + 18); ctx.lineTo(px + 1, y0 + 18); ctx.lineTo(px + 1, y0 + 7); ctx.lineTo(px + 3.5, y0 + 4);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = rgba('#ffffff', 0.35 * lit);
      ctx.fillRect(px + 2.5, y0 + 8, 1.2, 8);
      // label strip + button
      const hot = row === 2 && i > 3;
      ctx.fillStyle = hot ? '#d62839' : '#1f6fd1';
      ctx.fillRect(px, y0 + 19.5, 10.5, 2.5);
      const sold = o.sold && o.sold.includes(row * 7 + i);
      ctx.fillStyle = sold ? mix('#400', '#ff2a2a', lit) : mix('#030', '#40ff7a', lit * (0.6 + 0.4 * Math.sin(t * 2 + i)));
      ctx.beginPath(); ctx.arc(px + 5.2, y0 + 24.5, 1.3, 0, TAU); ctx.fill();
    }
  }
  // brand panel
  ctx.fillStyle = accent; ctx.fillRect(6, 99, 60, 26);
  ctx.fillStyle = rgba('#ffffff', 0.9);
  ctx.font = font(9, 800, F_EN); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(o.brand || 'LUNA', 36, 108);
  ctx.font = font(6, 700, F_JP); ctx.fillText(o.brandJp || 'つめた〜い', 36, 118);
  // coin panel
  ctx.fillStyle = '#b9b5ad'; ctx.fillRect(70, 99, 24, 48);
  ctx.fillStyle = '#111'; ctx.fillRect(74, 103, 16, 7);
  ctx.fillStyle = mix('#300', '#ff4030', lit); ctx.font = font(5.5, 700, F_EN); ctx.fillText('¥ 0', 82, 106.8);
  ctx.fillStyle = '#222'; ctx.fillRect(80, 114, 4, 10); ctx.fillRect(74, 128, 16, 3);
  ctx.beginPath(); ctx.arc(82, 139, 3, 0, TAU); ctx.fill();
  // dispenser
  ctx.fillStyle = '#16171b'; roundRect(ctx, 8, 148, 58, 22, 2); ctx.fill();
  ctx.fillStyle = '#3a3c42'; ctx.fillRect(10, 150, 54, 8);
  ctx.fillStyle = '#0c0c0e'; ctx.fillRect(0, 176, 100, 7);
  ctx.restore();
}
// light spill from a vending machine window (additive)
function vendingGlow(ctx, x, y, s, a = 1, col = '#cfe6ff') {
  glow(ctx, x + 50 * s, y + 55 * s, 170 * s, col, 0.55 * a, 0.25);
  glow(ctx, x + 50 * s, y + 190 * s, 150 * s, col, 0.25 * a, 0.3);
}

// Konbini front. x,y = bottom-left, w × h
function drawKonbini(ctx, x, y, w, h, t, o = {}) {
  const top = y - h;
  // wall
  ctx.fillStyle = '#cfccc4'; ctx.fillRect(x, top, w, h);
  // sign band
  const sb = h * 0.2;
  ctx.fillStyle = '#fbfaf6'; ctx.fillRect(x, top, w, sb);
  const stripes = ['#a6e8cf', RED, '#1c2254'];
  stripes.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, top + sb - (3 - i) * sb * 0.13, w, sb * 0.13); });
  ctx.fillStyle = '#1c2254';
  txt(ctx, o.name || 'ツキマート', x + w * 0.36, top + sb * 0.36, { size: sb * 0.42, weight: 800, color: '#1c2254', ls: 0.1 });
  txt(ctx, '24h', x + w * 0.8, top + sb * 0.36, { size: sb * 0.38, fam: F_EN, weight: 700, color: RED });
  // windows
  const wy = top + sb + h * 0.06, wh = h * 0.66;
  const panes = o.panes || 5;
  const pw = (w - 40) / panes;
  for (let i = 0; i < panes; i++) {
    const px = x + 20 + i * pw;
    ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#ffffff'], [0.55, '#f1fbff'], [1, '#dcefff']]);
    ctx.fillRect(px + 3, wy, pw - 6, wh);
    // interior: ceiling lights + shelves
    ctx.fillStyle = rgba('#ffffff', 1);
    ctx.fillRect(px + 10, wy + 8, pw - 20, 4);
    for (let k = 0; k < 4; k++) {
      const sy = wy + wh * 0.38 + k * wh * 0.14;
      ctx.fillStyle = rgba('#8aa0b4', 0.55);
      ctx.fillRect(px + 8, sy, pw - 16, 3);
      const r = mulberry32(i * 31 + k * 7);
      for (let q = px + 10; q < px + pw - 14; q += 9 + r() * 6) {
        ctx.fillStyle = rgba(DRINK_COLS[Math.floor(r() * DRINK_COLS.length)], 0.55);
        ctx.fillRect(q, sy - 10 - r() * 6, 6, 10 + r() * 4);
      }
    }
    // posters stuck on the glass
    if (i === 1 || i === 3) {
      ctx.fillStyle = i === 1 ? '#ffd23f' : '#ff5d73';
      ctx.fillRect(px + pw * 0.2, wy + wh * 0.62, pw * 0.3, wh * 0.28);
      ctx.fillStyle = '#1c2254';
      ctx.font = font(pw * 0.08, 800, F_JP); ctx.textAlign = 'center';
      ctx.fillText(i === 1 ? 'おでん' : '新発売', px + pw * 0.35, wy + wh * 0.74);
    }
    // door
    if (i === panes - 2) {
      ctx.strokeStyle = '#6f7780'; ctx.lineWidth = 4;
      ctx.strokeRect(px + 6, wy + 2, pw - 12, wh - 2);
      ctx.beginPath(); ctx.moveTo(px + pw / 2, wy); ctx.lineTo(px + pw / 2, wy + wh); ctx.stroke();
    }
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(px, wy, 3, wh); ctx.fillRect(px + pw - 3, wy, 3, wh);
  }
  ctx.fillStyle = '#8d8a83'; ctx.fillRect(x, y - h * 0.04, w, h * 0.04);
}

// Railway crossing signal. origin at pole base, h ≈ 420*s tall
function drawCrossingSignal(ctx, x, y, s, t, on = true, mirror = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(mirror ? -s : s, s);
  // pole
  ctx.fillStyle = '#e8e8e4'; ctx.fillRect(-6, -430, 12, 430);
  stripes(ctx, -7, -130, 14, 130, '#f6c90e', '#111', 12, 0.6);
  // crossbuck
  for (const a of [0.62, -0.62]) {
    ctx.save();
    ctx.translate(0, -392);
    ctx.rotate(a);
    stripes(ctx, -66, -9, 132, 18, '#f6c90e', '#111', 10, 0.7);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(-66, -9, 132, 18);
    ctx.restore();
  }
  // bell housing
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-10, -452, 20, 22);
  // lamp bar
  ctx.fillStyle = '#222'; ctx.fillRect(-58, -312, 116, 8);
  const phase = Math.floor(t * 2.3) % 2;
  for (const [lx, k] of [[-40, 0], [40, 1]]) {
    ctx.fillStyle = '#0d0d0d';
    ctx.beginPath(); ctx.arc(lx, -308, 27, 0, TAU); ctx.fill();
    const lit = on && phase === k;
    ctx.fillStyle = lit ? '#ff2a2a' : '#4a0b0b';
    ctx.beginPath(); ctx.arc(lx, -308, 16, 0, TAU); ctx.fill();
    if (lit) { ctx.fillStyle = '#ffd0c0'; ctx.beginPath(); ctx.arc(lx - 4, -312, 6, 0, TAU); ctx.fill(); }
    // hood
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(lx, -308, 24, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(lx + 24, -318); ctx.lineTo(lx - 24, -318); ctx.fill();
  }
  // direction arrows
  ctx.fillStyle = '#111'; ctx.fillRect(-34, -262, 68, 26);
  if (on) {
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(-26, -249); ctx.lineTo(-10, -258); ctx.lineTo(-10, -240); ctx.fill();
    ctx.fillStyle = rgba('#ffb347', 0.25);
    ctx.beginPath(); ctx.moveTo(26, -249); ctx.lineTo(10, -258); ctx.lineTo(10, -240); ctx.fill();
  }
  ctx.restore();
  return on ? (Math.floor(t * 2.3) % 2) : -1;
}
function crossingGlow(ctx, x, y, s, t, mirror = false) {
  const phase = Math.floor(t * 2.3) % 2;
  const lx = (phase === 0 ? -40 : 40) * (mirror ? -1 : 1);
  glow(ctx, x + lx * s, y - 308 * s, 150 * s, '#ff1a1a', 0.6);
}
// gate arm: pivot at (x,y), length L, angle (0 = horizontal toward +x)
function drawGateArm(ctx, x, y, L, angle, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#333'; ctx.fillRect(-18 * s, -14 * s, 30 * s, 28 * s);
  const n = Math.ceil(L / (40 * s));
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#111' : '#f6c90e';
    ctx.fillRect(i * 40 * s, -6 * s, 40 * s + 1, 12 * s);
  }
  ctx.restore();
}

// Street light with an LED head. dir: +1 arm to the right
function drawStreetlight(ctx, x, y, h, dir, on, s = 1) {
  ctx.strokeStyle = '#1a1b20';
  ctx.lineWidth = 8 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h + 40 * s);
  ctx.quadraticCurveTo(x, y - h, x + dir * 60 * s, y - h);
  ctx.lineTo(x + dir * 90 * s, y - h + 4 * s);
  ctx.stroke();
  ctx.fillStyle = '#26272c';
  ctx.fillRect(x + dir * 70 * s - 22 * s, y - h, 44 * s, 10 * s);
  if (on > 0) {
    ctx.fillStyle = mix('#555', '#fdfdf2', on);
    ctx.fillRect(x + dir * 70 * s - 18 * s, y - h + 8 * s, 36 * s, 5 * s);
  }
}
function streetlightGlow(ctx, x, y, h, dir, on, s = 1, col = '#fff4d8') {
  if (on <= 0) return;
  const lx = x + dir * 70 * s, ly = y - h + 10 * s;
  glow(ctx, lx, ly, 120 * s, col, 0.7 * on, 0.18);
  // cone
  const g = ctx.createLinearGradient(0, ly, 0, y);
  g.addColorStop(0, rgba(col, 0.28 * on));
  g.addColorStop(1, rgba(col, 0.02 * on));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(lx - 18 * s, ly);
  ctx.lineTo(lx + 18 * s, ly);
  ctx.lineTo(lx + 170 * s, y);
  ctx.lineTo(lx - 170 * s, y);
  ctx.closePath();
  ctx.fill();
  // pool on the ground
  ctx.save();
  ctx.translate(lx, y);
  ctx.scale(1, 0.22);
  glow(ctx, 0, 0, 200 * s, col, 0.35 * on, 0.4);
  ctx.restore();
}

// Concrete utility pole (電柱). origin at base. returns wire anchor points
function drawUtilityPole(ctx, x, y, h, s = 1, o = {}) {
  const top = y - h;
  ctx.fillStyle = o.col || '#101115';
  ctx.beginPath();
  ctx.moveTo(x - 12 * s, y); ctx.lineTo(x - 8 * s, top); ctx.lineTo(x + 8 * s, top); ctx.lineTo(x + 12 * s, y);
  ctx.closePath(); ctx.fill();
  const arms = [top + 40 * s, top + 110 * s];
  const anchors = [];
  for (const ay of arms) {
    ctx.fillRect(x - 70 * s, ay, 140 * s, 7 * s);
    for (const ax of [-62, -22, 22, 62]) {
      ctx.fillRect(x + ax * s - 3 * s, ay - 12 * s, 6 * s, 12 * s);
      anchors.push([x + ax * s, ay - 12 * s]);
    }
  }
  // transformer
  if (o.transformer !== false) {
    roundRect(ctx, x + 14 * s, top + 150 * s, 40 * s, 70 * s, 6 * s); ctx.fill();
  }
  // step bolts
  for (let i = 0; i < 10; i++) ctx.fillRect(x + (i % 2 ? 8 : -18) * s, top + 240 * s + i * 30 * s, 10 * s, 3 * s);
  // address plate
  if (o.plate) {
    ctx.fillStyle = '#1f4fa3';
    ctx.fillRect(x - 11 * s, y - h * 0.42, 22 * s, 90 * s);
    vtxt(ctx, o.plate, x, y - h * 0.42 + 6 * s, { size: 13 * s, color: '#ffffff', weight: 700 });
  }
  return anchors;
}

// Horizontal Japanese traffic light
function drawTrafficLight(ctx, x, y, s, lit = 2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#1b1c20'; roundRect(ctx, -150, -50, 300, 100, 14); ctx.fill();
  const cols = ['#19d3a2', '#ffbf1f', '#ff2a2a'];
  cols.forEach((c, i) => {
    const lx = -95 + i * 95;
    ctx.fillStyle = '#0b0b0d'; ctx.beginPath(); ctx.arc(lx, 0, 38, 0, TAU); ctx.fill();
    ctx.fillStyle = i === lit ? c : mix(c, '#000000', 0.8);
    ctx.beginPath(); ctx.arc(lx, 0, 30, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1b1c20';
    ctx.beginPath(); ctx.arc(lx, 0, 40, Math.PI, TAU); ctx.lineTo(lx + 40, -40); ctx.lineTo(lx - 40, -40); ctx.fill();
  });
  ctx.restore();
}

// Red paper lantern (赤提灯)
function drawLantern(ctx, x, y, s, t, label = 'おでん') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 1.3) * 0.04);
  ctx.scale(s, s);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(0, -110); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.fillRect(-46, -115, 92, 16); ctx.fillRect(-46, 100, 92, 16);
  ctx.beginPath(); ctx.ellipse(0, 0, 82, 104, 0, 0, TAU);
  ctx.fillStyle = vgrad(ctx, -104, 104, [[0, '#ff5a3d'], [0.5, '#e8182f'], [1, '#9c0a1a']]);
  ctx.fill();
  ctx.strokeStyle = rgba('#5a0610', 0.4); ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(0, i * 26, 80 * Math.cos((i / 4) * 1.2), 3, 0, 0, TAU); ctx.stroke(); }
  vtxt(ctx, label, 0, -[...label].length * 28, { size: 50, color: '#111', weight: 800, lh: 1.1 });
  ctx.restore();
  glow(ctx, x, y, 260 * s, '#ff3a2a', 0.35);
}

// Pedestrian signal: the little red standing man
function drawPedSignal(ctx, x, y, s, red = true) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#1b1c20'; roundRect(ctx, -70, -150, 140, 300, 10); ctx.fill();
  for (const [yy, on] of [[-72, red], [72, !red]]) {
    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(-58, yy - 64, 116, 128);
    const col = yy < 0 ? '#ff2a2a' : '#19d3a2';
    ctx.fillStyle = on ? col : mix(col, '#000', 0.82);
    // figure
    ctx.beginPath(); ctx.arc(0, yy - 38, 11, 0, TAU); ctx.fill();
    if (yy < 0) {
      ctx.fillRect(-16, yy - 24, 32, 44); ctx.fillRect(-12, yy + 18, 10, 36); ctx.fillRect(2, yy + 18, 10, 36);
    } else {
      ctx.save(); ctx.translate(0, yy); ctx.rotate(0.1);
      ctx.fillRect(-12, -24, 24, 40); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-6, yy + 14); ctx.lineTo(-28, yy + 52); ctx.lineTo(-16, yy + 56); ctx.lineTo(4, yy + 20); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, yy + 14); ctx.lineTo(24, yy + 52); ctx.lineTo(34, yy + 46); ctx.lineTo(14, yy + 12); ctx.fill();
    }
  }
  ctx.restore();
}

// Commuter train (side view), cars laid out from x to the right
function drawTrain(ctx, x, y, t, o = {}) {
  const carW = o.carW || 1400, carH = o.carH || 330, n = o.cars || 6;
  const stripe = o.stripe || '#1b998b';
  for (let c = 0; c < n; c++) {
    const cx = x + c * (carW + 24);
    if (cx > W + 200 || cx + carW < -200) continue;
    const top = y - carH;
    // body
    ctx.fillStyle = '#1a1c22';
    ctx.fillRect(cx, top, carW, carH);
    ctx.fillStyle = '#2a2d35';
    ctx.fillRect(cx, top + carH * 0.78, carW, carH * 0.22);
    // stripe
    ctx.fillStyle = stripe;
    ctx.fillRect(cx, top + carH * 0.66, carW, carH * 0.07);
    // windows & doors
    const units = 10;
    for (let i = 0; i < units; i++) {
      const ux = cx + 40 + i * ((carW - 80) / units);
      const uw = (carW - 80) / units - 18;
      const isDoor = i % 3 === 1;
      const wy = top + carH * (isDoor ? 0.12 : 0.18), wh = carH * (isDoor ? 0.46 : 0.36);
      ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#fffbe9'], [1, '#ffe7ad']]);
      ctx.fillRect(ux, wy, uw, wh);
      // straps & heads silhouettes
      ctx.fillStyle = rgba('#3a2e1a', 0.5);
      for (let k = 0; k < 3; k++) ctx.fillRect(ux + 8 + k * (uw / 3), wy + 6, 3, 18);
      const r = hash(c * 17 + i);
      if (r > 0.6) {
        ctx.fillStyle = rgba('#2a2418', 0.75);
        ctx.beginPath(); ctx.arc(ux + uw * 0.5, wy + wh * 0.62, wh * 0.14, 0, TAU); ctx.fill();
        ctx.fillRect(ux + uw * 0.5 - wh * 0.2, wy + wh * 0.74, wh * 0.4, wh * 0.3);
      }
      if (isDoor) { ctx.strokeStyle = '#0e0f13'; ctx.lineWidth = 6; ctx.strokeRect(ux - 4, wy - 4, uw + 8, carH * 0.56); }
    }
    // roof & pantograph
    ctx.fillStyle = '#101116'; ctx.fillRect(cx, top - 12, carW, 14);
    if (c % 2 === 0) {
      ctx.strokeStyle = '#101116'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx + carW * 0.3, top - 12); ctx.lineTo(cx + carW * 0.36, top - 70); ctx.lineTo(cx + carW * 0.42, top - 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + carW * 0.3, top - 70); ctx.lineTo(cx + carW * 0.42, top - 70); ctx.stroke();
    }
    // bogies
    ctx.fillStyle = '#07070a';
    for (const bx of [0.14, 0.86]) {
      ctx.fillRect(cx + carW * bx - 90, y, 180, 36);
      for (const wx of [-50, 50]) { ctx.beginPath(); ctx.arc(cx + carW * bx + wx, y + 34, 26, 0, TAU); ctx.fill(); }
    }
  }
}

// Big moon with a little texture
function drawMoon(ctx, x, y, r, col = '#fff6dc', a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  glow(ctx, x, y, r * 3.2, col, 0.22, 0.2);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = col; ctx.fill();
  ctx.clip();
  const rr = mulberry32(99);
  ctx.fillStyle = rgba('#d9c7a0', 0.35);
  for (let i = 0; i < 9; i++) {
    ctx.beginPath(); ctx.arc(x + (rr() - 0.5) * r * 1.6, y + (rr() - 0.5) * r * 1.6, r * (0.08 + rr() * 0.22), 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// Apartment block silhouette with lit windows
function drawApartments(ctx, x, y, w, h, t, seed = 1, litFrac = 0.35, col = '#0c0d14') {
  ctx.fillStyle = col; ctx.fillRect(x, y - h, w, h);
  const r = mulberry32(seed);
  const cols = Math.floor(w / 46), rows = Math.floor(h / 52);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const on = r() < litFrac;
    const flick = on && hash(i * 13 + j * 7 + seed) > 0.97 ? (Math.sin(t * 20) > 0 ? 1 : 0.4) : 1;
    ctx.fillStyle = on ? rgba(r() > 0.3 ? '#ffe9b0' : '#cfe6ff', 0.85 * flick) : '#15161f';
    ctx.fillRect(x + 12 + i * 46, y - h + 14 + j * 52, 26, 30);
  }
  // balconies
  ctx.fillStyle = rgba('#000000', 0.35);
  for (let j = 0; j < rows; j++) ctx.fillRect(x, y - h + 46 + j * 52, w, 4);
}

// Vertical neon bar sign
function drawNeonSign(ctx, x, y, s, t, label = 'スナック月', col = '#ff4fd8') {
  const n = [...label].length;
  const flick = Math.sin(t * 31) > 0.92 ? 0.4 : 1;
  ctx.fillStyle = '#0d0710';
  roundRect(ctx, x - 44 * s, y, 88 * s, (n * 78 + 30) * s, 8 * s); ctx.fill();
  ctx.strokeStyle = rgba(col, 0.9 * flick); ctx.lineWidth = 5 * s; ctx.stroke();
  additive(ctx, () => glow(ctx, x, y + (n * 39 + 15) * s, (n * 50 + 60) * s, col, 0.35 * flick));
  vtxt(ctx, label, x, y + 18 * s, { size: 64 * s, color: mix('#ffffff', col, 0.25), weight: 800, lh: 1.2 });
}
