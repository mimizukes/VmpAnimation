// ─────────────────────────────────────────────────────────────
//  Player: timeline, subtitles, controls, font preloading
// ─────────────────────────────────────────────────────────────

(() => {
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d', { alpha: false });
  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);

  // compile the timeline
  let acc = 0;
  STORY.forEach(s => { s.start = acc; acc += s.dur; });
  const TOTAL = acc;
  const SUBS = [], CUES = [];
  for (const s of STORY) {
    for (const x of s.subs || []) SUBS.push({ t0: s.start + x[0], t1: s.start + x[0] + x[1], who: x[2], jp: x[3], en: x[4] });
    for (const c of s.cues || []) CUES.push({ t: s.start + c[0], fn: c[1] });
  }
  CUES.sort((a, b) => a.t - b.t);

  let T = 0, playing = false, started = false, subsOn = true, jpOn = true;
  let cueIdx = 0, lastFrame = 0, ambKey = '';

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const scale = Math.min(vw / W, vh / H);
    const cw = Math.max(1, Math.round(W * scale)), ch = Math.max(1, Math.round(H * scale));
    cv.style.width = cw + 'px';
    cv.style.height = ch + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cw * dpr);
    cv.height = Math.round(ch * dpr);
    if (!playing) render();
  }

  function shotIndex(t) {
    let lo = 0, hi = STORY.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (STORY[mid].start <= t) lo = mid; else hi = mid - 1;
    }
    return lo;
  }
  function ambFor(sh, lt) {
    if (!sh.amb) return {};
    if (Array.isArray(sh.amb)) { let a = sh.amb[0][1]; for (const [t0, o] of sh.amb) if (lt >= t0) a = o; return a; }
    return sh.amb;
  }

  // ── subtitles ──────────────────────────────────────────
  function wrap(text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    // balance two-line subtitles
    if (lines.length === 2) {
      const all = text.split(' ');
      let best = null, bestD = 1e9;
      for (let i = 1; i < all.length; i++) {
        const a = all.slice(0, i).join(' '), b = all.slice(i).join(' ');
        const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
        if (wa > maxW || wb > maxW) continue;
        const d = Math.abs(wa - wb);
        if (d < bestD) { bestD = d; best = [a, b]; }
      }
      if (best) return best;
    }
    return lines;
  }
  function drawSubs(t) {
    let s = null;
    for (const x of SUBS) if (t >= x.t0 && t < x.t1) s = x;
    if (!s) return;
    const a = Math.min(1, (t - s.t0) / 0.18, (s.t1 - t) / 0.18);
    const nar = s.who === 'n';
    ctx.save();
    ctx.globalAlpha = clamp(a);
    ctx.font = font(48, 600, F_EN, nar);
    const lines = wrap(s.en, 1500);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    const base = H - 64;
    lines.forEach((ln, i) => {
      const y = base - (lines.length - 1 - i) * 58;
      ctx.strokeStyle = 'rgba(0,0,0,0.82)';
      ctx.lineWidth = 8;
      ctx.strokeText(ln, W / 2, y);
      ctx.fillStyle = nar ? '#f6f1e6' : '#ffd98a';
      ctx.fillText(ln, W / 2, y);
    });
    if (jpOn) {
      const y = base - lines.length * 58 - 8;
      ctx.font = font(29, 700, F_JP);
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 6;
      ctx.strokeText(s.jp, W / 2, y);
      ctx.fillStyle = nar ? 'rgba(246,241,230,0.82)' : 'rgba(255,217,138,0.85)';
      ctx.fillText(s.jp, W / 2, y);
    }
    ctx.restore();
  }

  // ── render one frame at time T ─────────────────────────
  function render() {
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const i = shotIndex(Math.min(T, TOTAL - 1e-3));
    const sh = STORY[i];
    const lt = Math.min(T, TOTAL - 1e-3) - sh.start;
    ctx.save();
    try { sh.draw(ctx, lt, clamp(lt / sh.dur), sh); } catch (e) { console.error('shot', i, e); }
    ctx.restore();
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.globalAlpha = 1;
    const post = sh.post || {};
    const vg = post.vignette ?? 0.5;
    if (vg > 0) vignette(ctx, vg);
    grain(ctx, T, post.grain ?? 0.07);
    if (subsOn) drawSubs(T);
    // soft fade in from black at the very start and out at the very end
    const edge = Math.max(1 - T / 0.6, 1 - (TOTAL - T) / 1.2);
    if (edge > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(edge)})`; ctx.fillRect(0, 0, W, H); }
    // ambience follows the shot; cards without their own keep the last scene's
    if (Sound.ready) {
      let j = i;
      while (j > 0 && STORY[j].amb === undefined) j--;
      const src = STORY[j];
      const amb = ambFor(src, j === i ? lt : src.dur);
      const key = j + ':' + JSON.stringify(amb);
      if (key !== ambKey) { ambKey = key; Sound.setAmb(amb); }
    }
  }

  // ── transport ──────────────────────────────────────────
  function seek(t) {
    T = clamp(t, 0, TOTAL);
    cueIdx = CUES.findIndex(c => c.t > T);
    if (cueIdx < 0) cueIdx = CUES.length;
    Sound.cut();
    Sound.reset();
    ambKey = '';
    render();
    updateBar();
  }
  function play() {
    if (T >= TOTAL - 0.05) seek(0);
    playing = true;
    Sound.resume();
    lastFrame = performance.now();
    document.body.classList.add('playing');
    document.body.classList.remove('paused');
    $('bPlay').textContent = 'Pause';
    requestAnimationFrame(loop);
  }
  function pause() {
    playing = false;
    Sound.pause();
    document.body.classList.remove('playing');
    document.body.classList.add('paused');
    $('bPlay').textContent = 'Play';
  }
  function toggle() { if (!started) return; playing ? pause() : play(); }

  function loop(now) {
    if (!playing) return;
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    const prev = T;
    T = Math.min(TOTAL, T + dt);
    while (cueIdx < CUES.length && CUES[cueIdx].t <= T) {
      const c = CUES[cueIdx++];
      if (c.t > prev - 0.05) { try { c.fn(); } catch (e) { console.error(e); } }
    }
    render();
    updateBar();
    if (T >= TOTAL) { finish(); return; }
    requestAnimationFrame(loop);
  }
  function finish() {
    pause();
    Sound.setAmb({});
    const st = $('start');
    $('play').textContent = 'Watch again';
    st.classList.remove('gone');
  }

  let barTick = 0;
  function updateBar() {
    const now = performance.now();
    if (now - barTick < 100) return;
    barTick = now;
    $('fill').style.width = (T / TOTAL * 100).toFixed(2) + '%';
    $('time').textContent = `${fmt(T)} / ${fmt(TOTAL)}`;
  }

  // ── fonts ──────────────────────────────────────────────
  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const src = Array.from(document.scripts).map(s => s.textContent).join('');
    const chars = Array.from(new Set(src.replace(/[\x00-\x7f]/g, ''))).join('') + 'あいうえお';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?\'"-·θ¥…';
    const jobs = [];
    for (const w of [400, 700, 800]) jobs.push(document.fonts.load(`${w} 40px "Shippori Mincho B1"`, chars));
    for (const spec of ['500 40px', '600 40px', '700 40px', 'italic 500 40px', 'italic 600 40px']) jobs.push(document.fonts.load(`${spec} "Cormorant Garamond"`, latin));
    return Promise.race([Promise.allSettled(jobs), new Promise(r => setTimeout(r, 7000))]);
  }

  // ── UI wiring ──────────────────────────────────────────
  let idleTimer = 0;
  function poke() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), 2200);
  }
  function fullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }
  function toggleMute() { Sound.setMuted(!Sound.muted); $('bMute').textContent = Sound.muted ? 'Unmute' : 'Mute'; }
  function toggleSubs() { subsOn = !subsOn; $('bSubs').style.opacity = subsOn ? '' : '0.4'; if (!playing) render(); }

  function start() {
    const st = $('start');
    st.classList.add('gone');
    if (!Sound.ready) { try { Sound.init(); } catch (e) { console.warn('audio unavailable', e); } }
    started = true;
    poke();
    play();
  }

  $('play').addEventListener('click', start);
  $('bPlay').addEventListener('click', e => { e.stopPropagation(); toggle(); });
  $('bMute').addEventListener('click', e => { e.stopPropagation(); toggleMute(); });
  $('bSubs').addEventListener('click', e => { e.stopPropagation(); toggleSubs(); });
  $('bFull').addEventListener('click', e => { e.stopPropagation(); fullscreen(); });
  $('track').addEventListener('click', e => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    seek((e.clientX - r.left) / r.width * TOTAL);
  });
  cv.addEventListener('click', () => { if (started) toggle(); });
  window.addEventListener('mousemove', poke);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });
  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) { if (!started) return; e.preventDefault(); }
    const k = e.key.toLowerCase();
    if (!started) { if (k === ' ' || k === 'enter') { e.preventDefault(); if (!$('play').disabled) start(); } return; }
    if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); }
    else if (k === 'arrowright') seek(T + 5);
    else if (k === 'arrowleft') seek(T - 5);
    else if (k === 'f') fullscreen();
    else if (k === 'm') toggleMute();
    else if (k === 's') toggleSubs();
    else if (k === 'j') { jpOn = !jpOn; if (!playing) render(); }
    poke();
  });

  resize();
  const mins = Math.round(TOTAL / 60 * 2) / 2;
  const hint = document.querySelector('#start .hint');
  if (hint) hint.innerHTML = hint.innerHTML.replace(/Runtime about [^.]*\./, `Runtime ${fmt(TOTAL)}.`);
  $('time').textContent = `0:00 / ${fmt(TOTAL)}`;

  // ?t=SECONDS&still  renders a single frame (used for previews)
  const still = q.has('still');
  const t0 = parseFloat(q.get('t') || '0') || 0;
  loadFonts().then(() => {
    const btn = $('play');
    btn.disabled = false;
    btn.textContent = 'Play';
    if (still) {
      $('start').classList.add('gone');
      $('bar').style.display = 'none';
      seek(t0);
      window.__ready = true;
      return;
    }
    if (t0) seek(t0); else render();
  });
  window.__player = { seek: t => { seek(t); }, get total() { return TOTAL; }, render, story: STORY };
})();
