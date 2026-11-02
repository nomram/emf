/* emp-waveform — double-exponential pulses (nuclear E1 per IEC 61000-2-9, lightning-like, ESD) in time and frequency; E2/E3 as order-of-magnitude comparison */
EM.register('emp-waveform', function (el) {
  const W = EM.widget(el, { title: 'What an EMP pulse looks like: in time and in frequency', badge: 'Explore',
    note: 'Fast transients are modelled as a <b>double exponential</b> $E(t)=E_0\\,k\\,(e^{-\\alpha t}-e^{-\\beta t})$. Its spectrum is flat up to a corner near $\\alpha/2\\pi$ and then falls: a pulse is a <em>broadband</em> burst that contains every frequency from DC up to its corner, so something is bound to resonate with it. The nuclear E1 values are the standard IEC test waveform (50 kV/m, rise ≈ 2.5 ns). These are for understanding protection, not for building anything.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .42 }), B = EM.canvas(main, { aspect: .5 }); B.cv.style.marginTop = '10px';
  const eta = EM.C.eta0;
  const PUL = {
    e1: { n: 'Nuclear high-altitude E1 (IEC 61000-2-9)', E0: 5e4, k: 1.3, a: 4e7, b: 6e8, unit: 'V/m', tmax: 2e-7, note: 'The fast part: arrives within a microsecond of the burst, produced when gamma rays knock electrons out of air molecules in the stratosphere and the Earth’s magnetic field bends them; field strength ≈ 50 kV/m over a footprint of hundreds of km. Couples efficiently into electronics through antennas and cables.' },
    light: { n: 'Lightning return stroke (nearby)', E0: 5e3, k: 1.02, a: 1.4e4, b: 6e6, unit: 'V/m', tmax: 4e-4, note: 'Peak currents of 30 kA over tens of µs; strong fields close to the strike, falling as 1/distance. A much slower, longer pulse than E1: it contains less high-frequency energy, which surge protectors are designed to handle.' },
    esd: { n: 'Electrostatic discharge (8 kV human-body, IEC 61000-4-2)', E0: 30, k: 1.08, a: 1.5e7, b: 1.2e9, unit: 'A', tmax: 2e-7, note: 'The spark when you touch a door handle: 30 A peak in under a nanosecond. Tiny energy (millijoules) but destroys exposed chips; the reason for wrist straps and ESD protection on every USB port.' },
  };
  const st = { k: 'e1', t: 0 };
  EM.seg(side, Object.entries(PUL).map(([k, v]) => [k, k === 'e1' ? 'Nuclear E1' : k === 'light' ? 'Lightning' : 'Static spark']), 'e1', v => { st.k = v; upd(); });
  const ro = EM.readouts(side, [['pk', 'Peak', '', 'fuel'], ['rise', 'Rise time (10–90 %)', '', 'cool'], ['fwhm', 'Duration (half height)', '', ''], ['fc', 'Spectrum flat up to', '', 'hot'], ['fl', 'Fluence (E1/E-field only)', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const f = (p, t) => t < 0 ? 0 : p.E0 * p.k * (Math.exp(-p.a * t) - Math.exp(-p.b * t));
  function stats(p) {
    let mx = 0, tm = 0; const N = 40000, dt = p.tmax / N * 5; for (let i = 0; i < N; i++) { const v = f(p, i * dt); if (v > mx) { mx = v; tm = i * dt; } }
    let t10, t90, tl, th; for (let i = 0; i < N; i++) { const v = f(p, i * dt); if (t10 == null && v >= .1 * mx) t10 = i * dt; if (t90 == null && v >= .9 * mx) t90 = i * dt; if (v >= .5 * mx) { if (tl == null) tl = i * dt; th = i * dt; } }
    let en = 0; for (let i = 0; i < N; i++) en += Math.pow(f(p, i * dt), 2) * dt; return { mx, rise: t90 - t10, fwhm: th - tl, E: en / eta };
  }
  function upd() {
    const p = PUL[st.k], s = stats(p); ro.set('pk', EM.num(s.mx, 3), p.unit); ro.set('rise', EM.si(s.rise, 's')); ro.set('fwhm', EM.si(s.fwhm, 's')); ro.set('fc', EM.freq(p.a / (2 * Math.PI)) + ' (then −20 dB/dec to ' + EM.freq(p.b / (2 * Math.PI)) + ', then −40)'); ro.set('fl', p.unit === 'V/m' ? EM.num(s.E, 3) + ' J/m²' : '—');
    info.innerHTML = '<h6>' + p.n + '</h6>' + p.note + (p.unit === 'V/m' ? ' <b>Energy check:</b> only ' + EM.num(s.E, 2) + ' J per square metre: far less than a camera flash, but delivered in nanoseconds, so the <em>voltage</em> (field × wire length) matters, not the energy.' : ''); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const p = PUL[st.k], s = stats(p), P = EM.plot(c, { x: 62, y: 12, w: w - 80, h: h - 46 }, { xmin: 0, xmax: p.tmax, ymin: 0, ymax: s.mx * 1.1, xlabel: 'time', ylabel: p.unit, xfmt: v => EM.si(v, 's', 2).replace(' ', ''), yfmt: v => EM.num(v, 2) });
    P.grid(); P.fn(t => f(p, t), EM.col('acc2'), 3, 500); EM.label(c, p.n, P.box.x + 10, P.box.y + 14, EM.col('text-2'), { size: 11, weight: '600' });
  };
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 62, y: 12, w: w - 80, h: h - 46 }, { xmin: 1e3, xmax: 1e10, xlog: true, ymin: -100, ymax: 0, xlabel: 'frequency', ylabel: 'relative spectrum (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yticks: [-100, -80, -60, -40, -20, 0] });
    P.grid(); const mag = (p, fr) => { const w2 = 2 * Math.PI * fr, A1 = [p.a, w2], B1 = [p.b, w2]; return Math.hypot(...EM.cx.sub(EM.cx.div([1, 0], A1), EM.cx.div([1, 0], B1))); };
    let ref = 0; for (const p of Object.values(PUL)) { const nrm = p.unit === 'A' ? 1 : p.E0; ref = Math.max(ref, nrm * p.k * mag(p, 1e3)); }
    for (const [k, p] of Object.entries(PUL)) { const nrm = p.k * (p.unit === 'A' ? 30 / 30 : p.E0); const m0 = mag(p, 1); P.fn(fr => 20 * Math.log10(Math.max(1e-12, p.k * mag(p, fr) / (p.k * mag(p, 1e3)))) - (k === st.k ? 0 : 0), k === st.k ? EM.col('acc2') : EM.alpha(EM.col('muted'), .55), k === st.k ? 3 : 1.5, 200); }
    P.clip(); P.fn(fr => 20 * Math.log10(Math.max(1e-12, mag(PUL[st.k], fr) / mag(PUL[st.k], 1e3))), EM.col('acc2'), 3.2, 240); P.unclip();
    const p = PUL[st.k]; P.vline(p.a / (2 * Math.PI), EM.alpha(EM.col('acc3'), .8), 1.4, [4, 4]); P.vline(p.b / (2 * Math.PI), EM.alpha(EM.col('acc3'), .8), 1.4, [4, 4]);
    EM.label(c, 'normalised to each pulse’s DC level; flat, then −20 dB/decade, then −40', P.box.x + 8, P.box.y + 14, EM.col('muted'), { size: 10, weight: '500' });
    for (const [n, fr] of [['AM', 1e6], ['FM', 1e8], ['Wi-Fi', 2.4e9]]) { P.vline(fr, EM.alpha(EM.col('text'), .25), 1); EM.label(c, n, P.X(fr) + 3, P.box.y + P.box.h - 10, EM.col('muted'), { size: 10 }); }
  };
  upd();
});
