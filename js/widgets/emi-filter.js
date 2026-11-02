/* emi-filter — insertion loss of an LC line filter with real parasitics (capacitor lead inductance, inductor winding capacitance) */
EM.register('emi-filter', function (el) {
  const W = EM.widget(el, { title: 'The filter on the wall: why real filters stop working at high frequency', badge: 'Try it',
    note: 'A power or signal line enters the shield through a low-pass filter: a series inductor $L$ and a shunt capacitor $C$ to the shield wall. Ideal: 40 dB/decade above the corner. Real parts have <b>parasitics</b>: the capacitor’s leads add inductance (ESL), which makes it resonate and then act as an inductor; the inductor’s windings add capacitance $C_p$, which lets signals hop over it. So the loss <b>peaks and then falls</b>. A <b>feedthrough capacitor</b> (mounted <em>through</em> the wall, no leads) has almost no ESL and keeps working into the GHz. Insertion loss in a 50 Ω system.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .6 });
  const cx = EM.cx, st = { L: 10e-6, C: 100e-9, esl: 15e-9, cp: 20e-12, esr: .02 };
  const PRE = [['Typical leaded mains filter (10 µH, 100 nF, 15 nH leads)', 10e-6, 100e-9, 15e-9, 20e-12], ['Leaded, poor layout (long wires: 50 nH)', 10e-6, 100e-9, 50e-9, 40e-12], ['Feedthrough capacitor 1 nF (0.2 nH) + small choke', 1e-6, 1e-9, .2e-9, 3e-12], ['Feedthrough 10 nF + ferrite bead (0.5 µH)', .5e-6, 10e-9, .3e-9, 2e-12], ['Large power-line filter (100 µH, 1 µF, 30 nH)', 100e-6, 1e-6, 30e-9, 60e-12]];
  EM.select(side, { label: 'Examples', options: PRE.map((p, i) => [i, p[0]]), value: 0, onChange: v => { const p = PRE[+v]; st.L = p[1]; st.C = p[2]; st.esl = p[3]; st.cp = p[4]; Ls.set(st.L, true); Cs.set(st.C, true); Es.set(st.esl, true); Ps.set(st.cp, true); upd(); } });
  const Ls = EM.slider(side, { label: 'Series inductor L', min: 1e-7, max: 1e-3, log: true, value: 10e-6, fmt: v => EM.si(v, 'H'), onInput: v => { st.L = v; upd(); } });
  const Cs = EM.slider(side, { label: 'Shunt capacitor C (to the wall)', min: 1e-10, max: 1e-5, log: true, value: 100e-9, fmt: v => EM.si(v, 'F'), onInput: v => { st.C = v; upd(); } });
  const Es = EM.slider(side, { label: 'Capacitor lead inductance (ESL)', min: 1e-10, max: 1e-7, log: true, value: 15e-9, fmt: v => EM.si(v, 'H'), onInput: v => { st.esl = v; upd(); } });
  const Ps = EM.slider(side, { label: 'Inductor winding capacitance', min: 1e-12, max: 2e-10, log: true, value: 20e-12, fmt: v => EM.si(v, 'F'), onInput: v => { st.cp = v; upd(); } });
  const ro = EM.readouts(side, [['fc', 'Ideal corner frequency', '', 'cool'], ['best', 'Best loss reached', '', 'good'], ['bw', 'Still ≥ 60 dB from … to …', '', 'fuel'], ['leak', 'Earth leakage at 230 V / 50 Hz', '', 'bad']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function IL(f, p = st) {
    const w = 2 * Math.PI * f, Z1 = cx.div([0, w * p.L], [1 - w * w * p.L * p.cp, 0]), Zc = cx.add(cx.add([p.esr, 0], [0, w * p.esl]), [0, -1 / (w * p.C)]), Y = cx.div([1, 0], Zc), A = cx.add([1, 0], cx.mul(Z1, Y)), Bm = Z1, Cc = Y, D = [1, 0], Z0 = 50;
    const s = cx.add(cx.add(A, cx.sc(Bm, 1 / Z0)), cx.add(cx.sc(Cc, Z0), D)); return 20 * Math.log10(Math.max(1e-6, cx.abs(s) / 2));
  }
  function upd() {
    const fc = 1 / (2 * Math.PI * Math.sqrt(st.L * st.C)); let best = -1, fb = 0, lo = null, hi = null; for (let i = 0; i <= 600; i++) { const f = 1e4 * Math.pow(3e5, i / 600), v = IL(f); if (v > best) { best = v; fb = f; } if (v >= 60) { if (lo == null) lo = f; hi = f; } }
    ro.set('fc', EM.freq(fc)); ro.set('best', EM.fixed(best, 0) + ' dB at ' + EM.freq(fb)); ro.set('bw', lo ? EM.freq(lo) + ' … ' + EM.freq(hi) : 'never reaches 60 dB'); ro.set('leak', EM.num(230 * 2 * Math.PI * 50 * st.C * 1000, 3), 'mA (if C goes to protective earth)');
    info.innerHTML = '<h6>' + (hi && hi > 1e9 ? 'A good wideband filter' : hi ? 'Works up to about ' + EM.freq(hi) : 'Not good enough') + '</h6>Between the corner and the first parasitic resonance the filter follows the ideal 40 dB/decade. Beyond it the loss <b>drops again</b>: this is why a mains filter with a leaded capacitor may be useless against a pulse’s 100 MHz–1 GHz energy, and why shield rooms use feedthrough or <em>pi</em> filters mounted <b>through the wall</b>, so that the unfiltered side and the filtered side are separated by the metal. Two traps: a filter mounted <em>inside</em> the box with a long wire from the entry point lets the noise radiate around it; and big capacitors from mains to protective earth carry <b>leakage current</b> (0.5–3.5 mA limit), so the capacitance to earth is limited for safety (a few nF), and large attenuation comes from a series inductor (a common-mode choke) instead.'; S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 1e4, xmax: 3e9, xlog: true, ymin: -10, ymax: 140, xlabel: 'frequency', ylabel: 'insertion loss (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yticks: [0, 40, 80, 120] });
    P.grid(); P.hline(60, EM.alpha(EM.col('ok'), .7), 1.2, [5, 4]); P.clip(); P.fn(f => { const w2 = 2 * Math.PI * f; return Math.max(-10, 20 * Math.log10(Math.abs(1 / (1 - w2 * w2 * st.L * st.C)) || 1) || 0); }, EM.alpha(EM.col('muted'), .9), 1.6, 300, [5, 4]); P.fn(f => IL(f), EM.col('acc3'), 3.2, 700); P.unclip();
    EM.label(c, 'ideal 40 dB/decade (grey dashed) vs real part with parasitics (yellow)', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' }); EM.label(c, '60 dB', P.box.x + P.box.w - 6, P.Y(60) - 8, EM.col('ok'), { size: 10, align: 'right' });
    for (const [n, f] of [['AM', 1e6], ['FM', 1e8], ['Wi-Fi', 2.4e9]]) { P.vline(f, EM.alpha(EM.col('text'), .25), 1); EM.label(c, n, P.X(f) + 3, P.box.y + P.box.h - 8, EM.col('muted'), { size: 9 }); }
  };
  upd();
});
