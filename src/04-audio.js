// ─────────────────────────────────────────────────────────────
//  Sound: everything is synthesised with WebAudio, no samples.
//  Ambient layers are declared per shot and crossfade; one-shots
//  are fired by timeline cues and go through a bus that can be
//  cut instantly when the viewer seeks.
// ─────────────────────────────────────────────────────────────

const Sound = (() => {
  let ac = null, master, verb, verbIn, bus = null;
  let white, pink, brown;
  const L = {};
  let targets = {};
  let chord = null, padVoices = [];
  let droneOscs = [];
  let nextBell = 0, bellAlt = 0, nextCricket = 0, nextBird = 0, nextStep = 0, stepAlt = 0;
  let timer = null;
  let volume = 0.9, muted = false;

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const now = () => ac.currentTime;

  function noiseBuffer(kind, secs = 4) {
    const n = Math.floor(ac.sampleRate * secs);
    const b = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'white') d[i] = w * 0.5;
        else if (kind === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      }
    }
    return b;
  }
  function impulse(secs, decay) {
    const n = Math.floor(ac.sampleRate * secs);
    const b = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  function src(buf, loop = true) {
    const s = ac.createBufferSource();
    s.buffer = buf; s.loop = loop;
    s.loopStart = Math.random() * 2;
    return s;
  }
  function gain(v = 0) { const g = ac.createGain(); g.gain.value = v; return g; }
  function filt(type, f, q = 0.7) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  function chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }

  function newBus() {
    if (bus) {
      const old = bus;
      old.dry.gain.setTargetAtTime(0, now(), 0.02);
      old.wet.gain.setTargetAtTime(0, now(), 0.02);
      setTimeout(() => { try { old.dry.disconnect(); old.wet.disconnect(); } catch (e) {} }, 400);
    }
    const dry = gain(1), wet = gain(1);
    dry.connect(master); wet.connect(verbIn);
    bus = { dry, wet };
  }
  // connect a one-shot's output to the current bus with a reverb send
  function out(node, send = 0.3) {
    node.connect(bus.dry);
    if (send > 0) { const s = gain(send); node.connect(s); s.connect(bus.wet); }
  }

  function layer(name, level, verbSend = 0.2) {
    const g = gain(0);
    g.connect(master);
    if (verbSend) { const s = gain(verbSend); g.connect(s); s.connect(verbIn); }
    L[name] = { g, level };
    return g;
  }

  function init() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.25;
    master = gain(volume);
    master.connect(comp); comp.connect(ac.destination);
    verb = ac.createConvolver(); verb.buffer = impulse(3.4, 2.6);
    verbIn = gain(1);
    const verbOut = gain(0.55);
    verbIn.connect(verb); verb.connect(verbOut); verbOut.connect(master);
    white = noiseBuffer('white'); pink = noiseBuffer('pink'); brown = noiseBuffer('brown');
    newBus();

    // night air / distant city
    { const g = layer('night', 0.32, 0.1); const s = src(pink); chain(s, filt('lowpass', 420), g); s.start(); }
    { const g = layer('city', 0.5, 0.05); const s = src(brown); chain(s, filt('lowpass', 160), g); s.start(); }
    // mains hum + fluorescent buzz (konbini, vending machines)
    {
      const g = layer('hum', 0.07, 0.05);
      const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 60;
      const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = 120;
      const f = filt('lowpass', 380);
      o1.connect(f); o2.connect(f); f.connect(g); o1.start(); o2.start();
      const bz = ac.createOscillator(); bz.type = 'square'; bz.frequency.value = 120;
      const bp = filt('bandpass', 2600, 6), bg = gain(0.08);
      chain(bz, bp, bg, g); bz.start();
    }
    // wind
    {
      const g = layer('wind', 0.4, 0.2); const s = src(pink);
      const f = filt('bandpass', 500, 0.6);
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.13; const lg = gain(260);
      lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      chain(s, f, g); s.start();
    }
    // surreal drone
    {
      const g = layer('drone', 0.22, 0.5);
      [36.7, 55, 73.4, 110.3].forEach((fq, i) => {
        const o = ac.createOscillator(); o.type = i === 3 ? 'triangle' : 'sine'; o.frequency.value = fq;
        o.detune.value = (i - 1.5) * 4;
        const og = gain(i === 3 ? 0.18 : 0.5 - i * 0.08);
        const lfo = ac.createOscillator(); lfo.frequency.value = 0.07 + i * 0.05; const lg = gain(0.25);
        lfo.connect(lg); lg.connect(og.gain); lfo.start();
        chain(o, og, g); o.start(); droneOscs.push(o);
      });
      const s = src(pink); chain(s, filt('bandpass', 260, 2), gain(0.6), g); s.start();
    }
    // high whine for the white void
    {
      const g = layer('ring', 0.012, 0.6);
      const o = ac.createOscillator(); o.frequency.value = 2637;
      const trem = ac.createOscillator(); trem.frequency.value = 0.3; const tg = gain(0.5);
      const og = gain(0.5); trem.connect(tg); tg.connect(og.gain); trem.start();
      chain(o, og, g); o.start();
    }
    layer('crickets', 0.09, 0.35);
    layer('bell', 0.16, 0.25);
    layer('birds', 0.07, 0.4);
    layer('steps', 0.22, 0.2);
    layer('pad', 0.1, 0.8);

    timer = setInterval(schedule, 50);
  }

  // ── ambience ─────────────────────────────────────────────
  function setAmb(a, instant = false) {
    if (!ac) return;
    targets = a || {};
    const t = now();
    for (const k in L) {
      const v = (targets[k] || 0) * L[k].level;
      L[k].g.gain.cancelScheduledValues(t);
      if (instant) L[k].g.gain.setValueAtTime(v, t);
      else L[k].g.gain.setTargetAtTime(v, t, k === 'bell' ? 0.05 : 0.35);
    }
    if (targets.chord !== chord) setChord(targets.chord);
    if (targets.droneHz) droneOscs.forEach((o, i) => o.frequency.setTargetAtTime(targets.droneHz * [1, 1.5, 2, 3][i], t, 1.5));
  }

  const CHORDS = {
    Dm: [50, 57, 62, 65, 69], Bb: [46, 58, 62, 65, 70], F: [53, 57, 60, 65, 69], C: [48, 55, 60, 64, 67],
    Am: [45, 57, 60, 64, 69], Gm: [43, 55, 58, 62, 67], Dsus: [50, 57, 62, 64, 69], Fmaj7: [53, 57, 60, 64, 69],
    Bbmaj7: [46, 57, 62, 65, 69], Em7b5: [52, 58, 62, 64, 67], Asus: [45, 57, 62, 64, 69], D: [50, 57, 62, 66, 69],
  };
  function setChord(name) {
    chord = name;
    const t = now();
    padVoices.forEach(v => { v.g.gain.setTargetAtTime(0, t, 0.8); v.oscs.forEach(o => o.stop(t + 5)); });
    padVoices = [];
    if (!name || !CHORDS[name]) return;
    for (const m of CHORDS[name]) {
      const g = gain(0);
      const f = filt('lowpass', 900, 0.4);
      const oscs = [-7, 7].map(d => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = d; o.connect(f); o.start(); return o; });
      f.connect(g); g.connect(L.pad.g);
      g.gain.setTargetAtTime(0.16, t, 1.2);
      padVoices.push({ g, oscs });
    }
  }

  // ── scheduler for rhythmic layers ───────────────────────
  function schedule() {
    if (!ac || ac.state !== 'running') return;
    const t = now(), ahead = t + 0.25;
    if (targets.bell) {
      if (nextBell < t) nextBell = t + 0.02;
      while (nextBell < ahead) { bellStrike(nextBell, bellAlt ^= 1); nextBell += 0.43; }
    }
    if (targets.crickets) {
      if (nextCricket < t) nextCricket = t;
      while (nextCricket < ahead) { cricket(nextCricket); nextCricket += 0.09 + Math.random() * 0.35; }
    }
    if (targets.birds) {
      if (nextBird < t) nextBird = t + 0.3;
      while (nextBird < ahead) { sparrow(nextBird); nextBird += 0.5 + Math.random() * 1.4; }
    }
    if (targets.steps) {
      if (nextStep < t) nextStep = t;
      while (nextStep < ahead) { geta(nextStep, stepAlt ^= 1); nextStep += 0.52; }
    }
  }

  function env(g, t, a, peak, tau) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(0, t + a, tau);
  }

  function bellStrike(t, alt) {
    const f0 = alt ? 740 : 752;
    const g = gain(0);
    g.connect(L.bell.g);
    [[1, 1, 0.22], [2, 0.3, 0.12], [2.76, 0.42, 0.1], [4.07, 0.16, 0.06]].forEach(([m, a, tau]) => {
      const o = ac.createOscillator(); o.frequency.value = f0 * m;
      const og = gain(0); env(og, t, 0.002, a, tau);
      o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.9);
    });
    g.gain.value = 1;
  }
  function cricket(t) {
    const o = ac.createOscillator(); o.frequency.value = 3900 + Math.random() * 900;
    const g = gain(0);
    const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    const n = 3 + Math.floor(Math.random() * 5), a = 0.2 + Math.random() * 0.8;
    for (let i = 0; i < n; i++) {
      const s = t + i * 0.038;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(a, s + 0.006);
      g.gain.linearRampToValueAtTime(0, s + 0.026);
    }
    o.connect(g);
    if (pan) { pan.pan.value = Math.random() * 2 - 1; g.connect(pan); pan.connect(L.crickets.g); }
    else g.connect(L.crickets.g);
    o.start(t); o.stop(t + n * 0.04 + 0.05);
  }
  function sparrow(t) {
    const n = 1 + Math.floor(Math.random() * 3);
    const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    const g = gain(1);
    if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan); pan.connect(L.birds.g); } else g.connect(L.birds.g);
    for (let i = 0; i < n; i++) {
      const s = t + i * 0.16;
      const o = ac.createOscillator();
      const base = 3600 + Math.random() * 900;
      o.frequency.setValueAtTime(base, s);
      o.frequency.linearRampToValueAtTime(base * 1.35, s + 0.02);
      o.frequency.linearRampToValueAtTime(base * 0.8, s + 0.07);
      const og = gain(0); env(og, s, 0.005, 0.8, 0.025);
      o.connect(og); og.connect(g); o.start(s); o.stop(s + 0.2);
    }
  }
  function geta(t, alt) {
    const g = gain(0); env(g, t, 0.001, 0.9, 0.035);
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = alt ? 1150 : 880;
    const n = src(white, false); const bp = filt('bandpass', alt ? 1500 : 1100, 4);
    o.connect(g); chain(n, bp, g); g.connect(L.steps.g);
    o.start(t); o.stop(t + 0.25); n.start(t); n.stop(t + 0.1);
  }

  // ── one-shots ────────────────────────────────────────────
  const fx = {
    hit(kind = 'card') {
      const t = now() + 0.01;
      if (kind === 'tick') {
        const n = src(white, false), g = gain(0); env(g, t, 0.001, 0.35, 0.012);
        chain(n, filt('highpass', 3500), g); out(g, 0.15); n.start(t); n.stop(t + 0.1);
        return;
      }
      const big = kind === 'big';
      const o = ac.createOscillator(); o.frequency.setValueAtTime(big ? 110 : 150, t); o.frequency.exponentialRampToValueAtTime(big ? 32 : 45, t + (big ? 0.6 : 0.18));
      const g = gain(0); env(g, t, 0.003, big ? 1.1 : 0.7, big ? 0.45 : 0.1);
      o.connect(g); out(g, big ? 0.5 : 0.2); o.start(t); o.stop(t + 3);
      const n = src(white, false), ng = gain(0); env(ng, t, 0.001, big ? 0.5 : 0.28, big ? 0.12 : 0.02);
      chain(n, filt('highpass', big ? 900 : 2800), ng); out(ng, 0.4); n.start(t); n.stop(t + 1.5);
      if (big) {
        const w = src(pink, false), wg = gain(0); env(wg, t, 0.01, 0.35, 0.9);
        chain(w, filt('lowpass', 900), wg); out(wg, 0.7); w.start(t); w.stop(t + 5);
      }
    },
    riser(dur = 2) {
      const t = now() + 0.01;
      const n = src(white, false), f = filt('bandpass', 300, 1.2), g = gain(0);
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(6000, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + dur * 0.95); g.gain.linearRampToValueAtTime(0, t + dur);
      chain(n, f, g); out(g, 0.5); n.start(t); n.stop(t + dur + 0.1);
    },
    glass() {
      const t = now() + 0.01;
      [2093, 3136, 4186, 5274].forEach((f, i) => {
        const o = ac.createOscillator(); o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
        const g = gain(0); env(g, t + i * 0.02, 0.002, 0.07, 0.6 - i * 0.1);
        o.connect(g); out(g, 0.8); o.start(t); o.stop(t + 4);
      });
    },
    chime() {
      const t = now() + 0.01;
      [[659.3, 0], [523.3, 0.42]].forEach(([f, d]) => {
        [[1, 0.28, 0.9], [2, 0.06, 0.4], [3, 0.04, 0.25]].forEach(([m, a, tau]) => {
          const o = ac.createOscillator(); o.frequency.value = f * m;
          const g = gain(0); env(g, t + d, 0.004, a, tau);
          o.connect(g); out(g, 0.5); o.start(t + d); o.stop(t + d + 4);
        });
      });
    },
    train(dur = 6.5) {
      const t = now() + 0.01;
      const pan = ac.createStereoPanner ? ac.createStereoPanner() : gain(1);
      if (pan.pan) { pan.pan.setValueAtTime(-0.9, t); pan.pan.linearRampToValueAtTime(0.9, t + dur); }
      const envG = gain(0);
      envG.gain.setValueAtTime(0, t);
      envG.gain.linearRampToValueAtTime(0.35, t + dur * 0.25);
      envG.gain.linearRampToValueAtTime(1, t + dur * 0.4);
      envG.gain.setValueAtTime(1, t + dur * 0.72);
      envG.gain.linearRampToValueAtTime(0, t + dur);
      envG.connect(pan); out(pan, 0.25);
      const b = src(brown, true), lp = filt('lowpass', 250);
      lp.frequency.setValueAtTime(220, t); lp.frequency.linearRampToValueAtTime(1100, t + dur * 0.45); lp.frequency.linearRampToValueAtTime(260, t + dur);
      chain(b, lp, gain(1.1), envG); b.start(t); b.stop(t + dur + 0.2);
      const w = src(white, true); chain(w, filt('highpass', 2500), gain(0.08), envG); w.start(t); w.stop(t + dur + 0.2);
      // wheel clatter: ta-tan ... ta-tan
      for (let s = t + dur * 0.3; s < t + dur * 0.9; s += 0.34) {
        for (const d of [0, 0.1]) {
          const o = ac.createOscillator(); o.frequency.setValueAtTime(95, s + d); o.frequency.exponentialRampToValueAtTime(50, s + d + 0.08);
          const g = gain(0); env(g, s + d, 0.002, 0.9, 0.04);
          o.connect(g); g.connect(envG); o.start(s + d); o.stop(s + d + 0.3);
          const n = src(white, false), ng = gain(0); env(ng, s + d, 0.001, 0.3, 0.015);
          chain(n, filt('bandpass', 1400, 1.5), ng, envG); n.start(s + d); n.stop(s + d + 0.1);
        }
      }
    },
    relay() {
      const t = now() + 0.01;
      const n = src(white, false), g = gain(0); env(g, t, 0.001, 0.5, 0.012);
      chain(n, filt('bandpass', 1900, 2), g); out(g, 0.35); n.start(t); n.stop(t + 0.1);
      const o = ac.createOscillator(); o.frequency.value = 130;
      const og = gain(0); env(og, t, 0.002, 0.4, 0.03); o.connect(og); out(og, 0.2); o.start(t); o.stop(t + 0.3);
    },
    umbrella() {
      const t = now() + 0.01;
      const n = src(white, false), f = filt('bandpass', 500, 0.9), g = gain(0);
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.3);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.22); g.gain.linearRampToValueAtTime(0, t + 0.42);
      chain(n, f, g); out(g, 0.4); n.start(t); n.stop(t + 0.5);
      const o = ac.createOscillator(); o.frequency.setValueAtTime(120, t + 0.3); o.frequency.exponentialRampToValueAtTime(60, t + 0.45);
      const og = gain(0); env(og, t + 0.3, 0.004, 0.5, 0.06); o.connect(og); out(og, 0.3); o.start(t); o.stop(t + 0.8);
    },
    flutter(dur = 1.4, amt = 0.25) {
      const t = now() + 0.01;
      const n = src(white, false), f = filt('bandpass', 850, 1.1), g = gain(0);
      const lfo = ac.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 26; const lg = gain(0.5);
      lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amt, t + dur * 0.3); g.gain.linearRampToValueAtTime(0, t + dur);
      chain(n, f, g); out(g, 0.5); n.start(t); n.stop(t + dur + 0.1); lfo.start(t); lfo.stop(t + dur + 0.1);
    },
    heartbeat() {
      const t = now() + 0.01;
      [0, 0.28].forEach((d, i) => {
        const o = ac.createOscillator(); o.frequency.setValueAtTime(62, t + d); o.frequency.exponentialRampToValueAtTime(38, t + d + 0.15);
        const g = gain(0); env(g, t + d, 0.004, i ? 0.6 : 0.85, 0.07); o.connect(g); out(g, 0.15); o.start(t + d); o.stop(t + d + 0.6);
      });
    },
    buzz() {
      const t = now() + 0.01;
      [0, 0.2].forEach(d => {
        const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 196;
        const f = filt('lowpass', 1200), g = gain(0);
        g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.12, t + d + 0.01); g.gain.setValueAtTime(0.12, t + d + 0.12); g.gain.linearRampToValueAtTime(0, t + d + 0.14);
        chain(o, f, g); out(g, 0.1); o.start(t + d); o.stop(t + d + 0.2);
      });
    },
    footstep() {
      const t = now() + 0.01;
      const n = src(white, false), g = gain(0); env(g, t, 0.002, 0.4, 0.04);
      chain(n, filt('lowpass', 500), g); out(g, 0.2); n.start(t); n.stop(t + 0.3);
    },
    // piano phrase: notes = [[beat, midi, beats, vel]], spb = seconds per beat
    piano(notes, spb = 0.7, vol = 1) {
      const t0 = now() + 0.03;
      for (const [b, m, len, v = 0.8] of notes) note(t0 + b * spb, m, v * vol, len * spb);
    },
  };

  function note(t, m, v, len) {
    const f = mtof(m);
    const g = gain(1);
    out(g, 0.55);
    const tau = 1.4 * Math.pow(440 / f, 0.35);
    [[1, 1], [2, 0.42], [3, 0.2], [4.02, 0.08], [5.1, 0.04]].forEach(([k, a], i) => {
      if (f * k > 12000) return;
      const o = ac.createOscillator(); o.frequency.value = f * k;
      if (i === 0) o.detune.value = (Math.random() - 0.5) * 4;
      const og = gain(0);
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(a * v * 0.22, t + 0.006);
      og.gain.setTargetAtTime(0, t + 0.006, tau / Math.pow(k, 0.8));
      og.gain.setTargetAtTime(0, t + Math.max(len, 0.3), 0.25);
      o.connect(og); og.connect(g); o.start(t); o.stop(t + Math.max(len, 0.3) + 2);
    });
    const n = src(white, false), ng = gain(0); env(ng, t, 0.001, 0.05 * v, 0.01);
    chain(n, filt('lowpass', Math.min(f * 6, 9000)), ng, g); n.start(t); n.stop(t + 0.1);
  }

  return {
    init,
    get ready() { return !!ac; },
    get ctx() { return ac; },
    setAmb,
    fx: new Proxy(fx, { get: (o, k) => (...a) => { if (ac && ac.state === 'running') o[k](...a); } }),
    cut() { if (ac) newBus(); },
    pause() { if (ac) ac.suspend(); },
    resume() { if (ac) return ac.resume(); },
    setMuted(m) { muted = m; if (ac) master.gain.setTargetAtTime(m ? 0 : volume, now(), 0.05); },
    get muted() { return muted; },
    reset() { nextBell = nextCricket = nextBird = nextStep = 0; },
  };
})();
