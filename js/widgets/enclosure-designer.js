/* enclosure-designer — a rough shielding budget for a box: wall (absorption + reflection), holes, seams, cavity resonances; electric/plane-wave vs magnetic field */
EM.register('enclosure-designer', function (el) {
  const W = EM.widget(el, { title: 'Design your shielded box: the leak budget', badge: 'Design',
    note: 'Total shielding is limited by the <b>weakest path</b>: the leaks add, $SE=-20\\log_{10}\\sum_k10^{-SE_k/20}$. Wall: absorption $A=8.686\\,t/\\delta$ plus reflection $R$ (Ott’s formulas: plane wave $168+10\\log(\\sigma_r/\\mu_rf)$; near magnetic field $14.6+10\\log(f r^2\\sigma_r/\\mu_r)$). Holes: $20\\log(\\lambda/2D)+32\\,t_h/D-10\\log N$. Seams: $20\\log(\\lambda/2l)$ + gasket. Plus resonance dips at the box’s own cavity frequencies. Rough engineering estimates, not a substitute for measurement.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const MATS = { cu: ['Copper', 1, f => 1], al: ['Aluminium', .61, f => 1], steel: ['Mild steel', .1, f => 1 + 999 / (1 + f / 5e3)], ss: ['Stainless steel', .02, f => 1], mu: ['Mu-metal (annealed)', .03, f => 1 + 3e4 / (1 + f / 3e3)] };
  const st = { mat: 'al', t: .001, a: .4, b: .3, d: .2, N: 0, D: .006, th: .001, seam: 0, gk: 'none', r: .3, f: 1e8 };
  const PRE = [['Aluminium project box, no holes, rubber gasket seam', { mat: 'al', t: .0015, N: 0, seam: .6, gk: 'none' }], ['Same box + 20 vent holes of 6 mm', { mat: 'al', t: .0015, N: 20, D: .006, seam: .6, gk: 'none' }], ['Welded steel cabinet with finger-stock door', { mat: 'steel', t: .0015, N: 0, seam: 1.6, gk: 'finger' }], ['Steel box with honeycomb vents (6 mm × 25 mm)', { mat: 'steel', t: .0015, N: 50, D: .006, th: .025, seam: 1.6, gk: 'finger' }], ['Mu-metal enclosure for a sensitive magnetic sensor', { mat: 'mu', t: .0008, N: 0, seam: .4, gk: 'finger' }]];
  EM.select(side, { label: 'Start from an example', options: PRE.map((p, i) => [i, p[0]]), value: 0, onChange: v => { Object.assign(st, PRE[+v][1]); fix(); upd(); } });
  const c = {};
  c.mat = EM.select(side, { label: 'Wall material', options: Object.entries(MATS).map(([k, v]) => [k, v[0]]), value: 'al', onChange: v => { st.mat = v; upd(); } });
  c.t = EM.slider(side, { label: 'Wall thickness', min: 5e-5, max: .01, log: true, value: .001, fmt: v => EM.len(v), onInput: v => { st.t = v; upd(); } });
  c.a = EM.slider(side, { label: 'Box width', min: .1, max: 3, log: true, value: .4, fmt: v => EM.len(v), onInput: v => { st.a = v; upd(); } });
  c.N = EM.slider(side, { label: 'Number of vent holes', min: 0, max: 400, step: 1, value: 0, onInput: v => { st.N = v; upd(); } });
  c.D = EM.slider(side, { label: 'Hole diameter', min: .0005, max: .05, log: true, value: .006, fmt: v => EM.len(v), onInput: v => { st.D = v; upd(); } });
  c.th = EM.slider(side, { label: 'Hole depth (wall or tube)', min: .0003, max: .1, log: true, value: .001, fmt: v => EM.len(v), onInput: v => { st.th = v; upd(); } });
  c.seam = EM.slider(side, { label: 'Longest open seam between contact points (e.g. screw spacing)', min: 0, max: 3, step: .02, value: 0, fmt: v => v ? EM.len(v) : 'none', onInput: v => { st.seam = v; upd(); } });
  c.gk = EM.select(side, { label: 'Seam gasket', options: [['none', 'none: just overlapping panels'], ['foil', 'conductive foil tape / soft gasket (+20 dB)'], ['finger', 'finger-stock or knife-edge (+50 dB)']], value: 'none', onChange: v => { st.gk = v; upd(); } });
  EM.slider(side, { label: 'Frequency to examine', min: 10, max: 1e10, log: true, value: 1e8, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const ro = EM.readouts(side, [['E', 'Electric / plane wave', '', 'good'], ['H', 'Magnetic near-field (30 cm)', '', 'cool'], ['dom', 'Weakest path (plane wave)', '', 'hot'], ['res', 'Lowest box resonance', '', 'fuel']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function fix() { c.mat.set(st.mat, true); c.t.set(st.t, true); c.N.set(st.N, true); c.D.set(st.D, true); c.th.set(st.th, true); c.seam.set(st.seam, true); c.gk.set(st.gk, true); }
  const GK = { none: 0, foil: 20, finger: 50 };
  function parts(f) {
    const m = MATS[st.mat], sr = m[1], mu = m[2](f), lam = EM.C.c / f, delta = 1 / Math.sqrt(Math.PI * f * EM.C.mu0 * mu * 5.8e7 * sr), A = 8.686 * st.t / delta;
    const Rp = Math.max(0, 168 + 10 * Math.log10(sr / (mu * f))), Rh = Math.max(0, 14.6 + 10 * Math.log10(f * st.r * st.r * sr / mu));
    let holes = 300; if (st.N > 0) { const r = lam / (2 * st.D); let v = r > 1 ? 20 * Math.log10(r) : 0; const fc = .5861 * EM.C.c / st.D; if (v > 0 && f < fc) v += 32 * st.th / st.D * Math.sqrt(1 - Math.pow(f / fc, 2)); holes = Math.max(0, v - 10 * Math.log10(st.N)); }
    let seam = 300; if (st.seam > 0) { const r = lam / (2 * st.seam); seam = (r > 1 ? 20 * Math.log10(r) : 0) + GK[st.gk]; }
    return { wallE: A + Rp, wallH: A + Rh, holes, seam, A, delta };
  }
  const comb = arr => -20 * Math.log10(arr.reduce((s, v) => s + Math.pow(10, -Math.min(v, 300) / 20), 0));
  const f0 = () => { const a = st.a, b = a * .75, d = a * .5; return EM.C.c / 2 * Math.min(Math.sqrt(1 / (a * a) + 1 / (b * b)), Math.sqrt(1 / (a * a) + 1 / (d * d)), Math.sqrt(1 / (b * b) + 1 / (d * d))); };
  function total(f, kind) { const p = parts(f); let v = comb([kind === 'E' ? p.wallE : p.wallH, p.holes, p.seam]); const fr = f0(), Q = 100, x = (f - fr) / (fr / (2 * Q)); v -= 15 / (1 + x * x); return Math.max(0, Math.min(150, v)); }
  function upd() {
    const p = parts(st.f), E = total(st.f, 'E'), H = total(st.f, 'H'), arr = [['the wall', p.wallE], ['the holes', p.holes], ['the seam', p.seam]].sort((a, b) => a[1] - b[1]);
    ro.set('E', E >= 150 ? '> 150 (not the limit)' : EM.fixed(E, 0), E >= 150 ? '' : 'dB'); ro.set('H', H >= 150 ? '> 150 (not the limit)' : EM.fixed(H, 0), H >= 150 ? '' : 'dB'); ro.set('dom', arr[0][0] + ' (' + EM.fixed(Math.min(arr[0][1], 300), 0) + ' dB)'); ro.set('res', EM.freq(f0()) + ' (box ' + EM.len(st.a) + ' × ' + EM.len(st.a * .75) + ' × ' + EM.len(st.a * .5) + ')');
    info.innerHTML = '<h6>Reading the budget</h6>At ' + EM.freq(st.f) + ' the wall offers ' + EM.fixed(p.wallE, 0) + ' dB (plane wave) or ' + EM.fixed(p.wallH, 0) + ' dB (magnetic), holes ' + (st.N ? EM.fixed(p.holes, 0) + ' dB' : 'none') + ', the seam ' + (st.seam ? EM.fixed(p.seam, 0) + ' dB' : 'none') + '. <b>Try:</b> raise the frequency until the seam collapses; add more holes (the leak grows as the square root of their number); then lengthen the hole depth to turn them into below-cutoff tubes; switch to mu-metal and look at the low-frequency magnetic curve; and note the dip at the box’s own resonance (every cavity rings).'; S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 10, xmax: 1e10, xlog: true, ymin: 0, ymax: 160, xlabel: 'frequency', ylabel: 'shielding effectiveness (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yticks: [0, 40, 80, 120, 160] });
    P.grid(); P.clip(); P.fn(f => Math.min(160, total(f, 'H')), EM.col('acc'), 2.6, 380); P.fn(f => Math.min(160, total(f, 'E')), EM.col('acc3'), 3.2, 380); P.fn(f => Math.min(160, parts(f).holes), EM.alpha(EM.col('bad'), .7), 1.4, 200, [5, 4]); P.fn(f => Math.min(160, parts(f).seam), EM.alpha(EM.col('warn'), .8), 1.4, 200, [3, 4]); P.unclip();
    P.vline(st.f, EM.col('acc2'), 1.4); P.vline(f0(), EM.alpha(EM.col('text'), .35), 1, [2, 4]); EM.label(c, 'box resonance', P.X(f0()) + 3, P.box.y + P.box.h - 8, EM.col('muted'), { size: 9 });
    EM.label(c, 'total plane-wave/electric (yellow)   magnetic near-field (blue)   holes (red dashed)   seam (amber dotted)', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  Object.assign(st, PRE[0][1]); fix(); upd();
});
