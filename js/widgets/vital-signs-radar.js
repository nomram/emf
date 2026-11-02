/* vital-signs-radar — a millimetre-wave radar senses chest motion through the phase of the echo: breathing and heartbeat appear as tiny phase wobbles */
EM.register('vital-signs-radar', function (el) {
  const W = EM.widget(el, { title: 'Reading breathing and heartbeat with a radar', badge: 'Try it',
    note: 'For a target that moves by $x$, the echo phase changes by $\\Delta\\varphi=4\\pi x/\\lambda$ (the wave travels there and back). Breathing moves the chest by a few millimetres (≈ 1–12 mm), the heartbeat only about 0.3–0.6 mm (published values), but at 60 GHz ($\\lambda=5$ mm) even 0.3 mm is $\\approx0.75$ rad: easy to see. Time series on top, its <b>spectrum</b> below: a peak at the breathing rate, a smaller one at the heart rate, plus breathing harmonics that can mask it.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .36 }), B = EM.canvas(main, { aspect: .42 }); B.cv.style.marginTop = '10px';
  const st = { f: 60e9, br: 15, ba: 4, hr: 72, ha: .4, noise: .05, motion: false, t: 0 };
  EM.seg(side, [[24e9, '24 GHz'], [60e9, '60 GHz'], [77e9, '77 GHz']], 60e9, v => { st.f = +v; upd(); });
  EM.slider(side, { label: 'Breathing rate', min: 6, max: 30, step: 1, value: 15, unit: ' /min', onInput: v => { st.br = v; upd(); } });
  EM.slider(side, { label: 'Chest movement from breathing', min: 1, max: 12, step: .5, value: 4, unit: ' mm', onInput: v => { st.ba = v; upd(); } });
  EM.slider(side, { label: 'Heart rate', min: 40, max: 140, step: 1, value: 72, unit: ' bpm', onInput: v => { st.hr = v; upd(); } });
  EM.slider(side, { label: 'Skin movement from the heartbeat', min: .1, max: 1, step: .05, value: .4, unit: ' mm', onInput: v => { st.ha = v; upd(); } });
  EM.slider(side, { label: 'Radar phase noise / clutter', min: 0, max: .6, step: .01, value: .05, fmt: v => v.toFixed(2) + ' rad', onInput: v => { st.noise = v; upd(); } });
  EM.toggle(side, { label: 'Add random body movement (fidgeting)', checked: false, onChange: v => { st.motion = v; } });
  const ro = EM.readouts(side, [['lam', 'Wavelength', '', 'cool'], ['pb', 'Breathing phase swing', '', 'fuel'], ['ph', 'Heartbeat phase swing', '', 'hot'], ['detb', 'Breathing detected', '', 'good'], ['deth', 'Heart rate detected', '', 'good'], ['pfd', 'Radar power density at 1 m (10 mW EIRP)', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const FS = 20, NS = 400;
  let sig = new Float32Array(NS), spec = [], seedN = 1;
  const rnd = () => { seedN = (seedN * 1664525 + 1013904223) >>> 0; return seedN / 4294967296; }, gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  function gen(t0) {
    const lam = EM.C.c / st.f; let mot = 0;
    for (let i = 0; i < NS; i++) { const t = t0 + i / FS; const x = st.ba * 1e-3 / 2 * Math.sin(2 * Math.PI * st.br / 60 * t) + st.ba * 1e-3 * .12 * Math.sin(4 * Math.PI * st.br / 60 * t) + st.ha * 1e-3 / 2 * Math.sin(2 * Math.PI * st.hr / 60 * t) + (st.motion ? 2e-3 * Math.sin(2 * Math.PI * .07 * t + Math.sin(t * .31)) * Math.max(0, Math.sin(t * .17)) : 0); sig[i] = 4 * Math.PI * x / lam + st.noise * gauss(); }
    // spectrum of the detrended signal, 0.1 .. 3 Hz
    let mean = 0; for (let i = 0; i < NS; i++) mean += sig[i]; mean /= NS; spec = []; for (let f = .1; f <= 3; f += .02) { let re = 0, im = 0; for (let i = 0; i < NS; i++) { const wd = .5 - .5 * Math.cos(2 * Math.PI * i / (NS - 1)), v = (sig[i] - mean) * wd; re += v * Math.cos(2 * Math.PI * f * i / FS); im += v * Math.sin(2 * Math.PI * f * i / FS); } spec.push([f, Math.hypot(re, im) / NS * 4]); }
  }
  function peakIn(f1, f2) { let m = 0, fm = 0; for (const [f, a] of spec) if (f >= f1 && f <= f2 && a > m) { m = a; fm = f; } return [fm, m]; }
  function text() {
    const lam = EM.C.c / st.f; const pb = 4 * Math.PI * st.ba * 1e-3 / lam, ph = 4 * Math.PI * st.ha * 1e-3 / lam;
    const [fb, ab] = peakIn(.1, .6), [fh, ah] = peakIn(.75, 2.2), floor = spec.map(s => s[1]).sort((a, b) => a - b)[Math.floor(spec.length * .5)], okb = Math.abs(fb * 60 - st.br) < 1.5 && ab > 4 * floor, okh = Math.abs(fh * 60 - st.hr) < 3 && ah > 4 * floor;
    ro.set('lam', EM.len(lam)); ro.set('pb', pb.toFixed(1), 'rad'); ro.set('ph', ph.toFixed(2), 'rad'); ro.set('detb', okb ? (fb * 60).toFixed(0) + ' /min ✓' : 'lost in noise'); ro.set('deth', okh ? (fh * 60).toFixed(0) + ' bpm ✓' : 'not found'); ro.set('pfd', EM.num(.01 / (4 * Math.PI) * 1e3, 3), 'mW/m² (limit 10 000)');
    info.innerHTML = '<h6>' + (okh ? 'Heart rate readable' : okb ? 'Breathing readable, heartbeat hidden' : 'Nothing readable') + '</h6>Raise the frequency and the same motion makes a larger phase swing (24 GHz: 1 mm = 1.0 rad; 60 GHz: 2.5 rad; 77 GHz: 3.2 rad). The heartbeat is ten times smaller than breathing and sits near a breathing harmonic, so it is lost first when noise or movement rises: real systems separate the two with filters and tracking, and work best on a still subject at close range. The radar’s own power density is tiny: a 10 mW EIRP source gives about 0.8 mW/m² at 1 m, over 10 000 times below the public exposure limit (10 W/m²).'; if (window.renderMath) window.renderMath(info);
  }
  function upd() { gen(st.t); text(); A.redraw(); B.redraw(); }
  A.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 12, w: w - 72, h: h - 42 }, { xmin: 0, xmax: NS / FS, ymin: -1.3 * Math.max(.5, 4 * Math.PI * st.ba * 1e-3 / (EM.C.c / st.f)), ymax: 1.3 * Math.max(.5, 4 * Math.PI * st.ba * 1e-3 / (EM.C.c / st.f)), xlabel: 'time (s)', ylabel: 'echo phase (rad)', xticks: [0, 5, 10, 15, 20] });
    P.grid(); P.hline(0, EM.col('line-2')); c.strokeStyle = EM.col('acc3'); c.lineWidth = 2; c.beginPath(); for (let i = 0; i < NS; i++) { const x = P.X(i / FS), y = P.Y(sig[i]); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    EM.label(c, 'phase of the radar echo from a person sitting still, 1.5 m away', P.box.x + 8, P.box.y + 12, EM.col('text-2'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    let mx = 1e-9; for (const s of spec) mx = Math.max(mx, s[1]); const P = EM.plot(c, { x: 56, y: 12, w: w - 72, h: h - 42 }, { xmin: .1, xmax: 3, ymin: 0, ymax: mx * 1.15, yticks: [], xlabel: 'frequency (Hz)  ·  60 per minute = 1 Hz', ylabel: 'amplitude', xticks: [.5, 1, 1.5, 2, 2.5, 3] });
    P.grid(); c.fillStyle = EM.alpha(EM.col('acc'), .15); c.fillRect(P.X(.1), P.box.y, P.X(.6) - P.X(.1), P.box.h); c.fillStyle = EM.alpha(EM.col('bad'), .12); c.fillRect(P.X(.75), P.box.y, P.X(2.2) - P.X(.75), P.box.h);
    c.strokeStyle = EM.col('acc3'); c.lineWidth = 2.4; c.beginPath(); spec.forEach((s, i) => { const x = P.X(s[0]), y = P.Y(s[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    EM.label(c, 'breathing band', P.X(.35), P.box.y + 12, EM.col('acc'), { size: 10, align: 'center', weight: '700' }); EM.label(c, 'heartbeat band', P.X(1.5), P.box.y + 12, EM.col('bad'), { size: 10, align: 'center', weight: '700' });
    P.vline(st.br / 60, EM.alpha(EM.col('acc'), .7), 1, [3, 3]); P.vline(st.hr / 60, EM.alpha(EM.col('bad'), .7), 1, [3, 3]); P.vline(2 * st.br / 60, EM.alpha(EM.col('muted'), .6), 1, [2, 4]); EM.label(c, '2× breath', P.X(2 * st.br / 60) + 3, P.box.y + P.box.h - 8, EM.col('muted'), { size: 9 });
  };
  EM.loop(el, (t, dt) => { st.t += dt; gen(st.t); A.redraw(); B.redraw(); if ((st.k = (st.k || 0) + 1) % 25 === 0) text(); });
  upd();
});
