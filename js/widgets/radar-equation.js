/* radar-equation — maximum range from power, antenna, wavelength, target RCS and receiver sensitivity; the 1/R^4 law */
EM.register('radar-equation', function (el) {
  const W = EM.widget(el, { title: 'The radar range equation', badge: 'Calculate',
    note: '$R_{max}=\\Big[\\dfrac{P_t\\,G^2\\,\\lambda^2\\,\\sigma}{(4\\pi)^3\\,S_{min}\\,L}\\Big]^{1/4}$. The echo falls as $1/R^4$ (once out, once back), so <b>doubling the range needs 16× the power</b>, or 4× the antenna gain, or a 16× bigger target. $S_{min}=kT_0BF\\cdot\\text{SNR}_{min}$ is the weakest detectable echo.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .6 });
  const TG = [['Small bird (sparrow)', .001], ['Insect swarm / large insect', .0001], ['Small drone (quadcopter)', .02], ['Person', 1], ['Car', 100], ['Light aircraft (Cessna)', 2], ['Fighter aircraft (conventional)', 5], ['Stealth fighter (reported)', .005], ['Airliner (Boeing 737)', 40], ['Large airliner (747)', 100], ['Ship (coastal freighter)', 5000], ['Cruise missile', .1], ['Rain cell, per km³ (typical)', .001]];
  const st = { Pt: 1e5, Gdb: 35, f: 3e9, sig: 5, B: 1e6, F: 4, snr: 13, L: 4 };
  const pre = EM.select(side, { label: 'Target (radar cross section σ)', options: TG.map((t, i) => [i, t[0] + ' – ' + EM.num(t[1], 2) + ' m²']), value: 6, onChange: v => { st.sig = TG[+v][1]; sg.set(st.sig, true); upd(); } });
  const sg = EM.slider(side, { label: 'σ (m²)', min: 1e-4, max: 1e4, log: true, value: 5, fmt: v => EM.num(v, 3) + ' m²', onInput: v => { st.sig = v; upd(); } });
  EM.slider(side, { label: 'Transmit (peak) power', min: 1, max: 1e7, log: true, value: 1e5, fmt: v => EM.si(v, 'W'), onInput: v => { st.Pt = v; upd(); } });
  EM.slider(side, { label: 'Antenna gain', min: 0, max: 55, step: .5, value: 35, unit: 'dBi', onInput: v => { st.Gdb = v; upd(); } });
  EM.slider(side, { label: 'Frequency', min: 1e8, max: 1e11, log: true, value: 3e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  EM.slider(side, { label: 'Receiver bandwidth ≈ 1/τ', min: 1e4, max: 1e9, log: true, value: 1e6, fmt: v => EM.freq(v), onInput: v => { st.B = v; upd(); } });
  EM.slider(side, { label: 'Required SNR for detection', min: 3, max: 25, step: .5, value: 13, unit: 'dB', onInput: v => { st.snr = v; upd(); } });
  EM.slider(side, { label: 'System losses', min: 0, max: 15, step: .5, value: 4, unit: 'dB', onInput: v => { st.L = v; upd(); } });
  const ro = EM.readouts(side, [['Rmax', 'Maximum range', '', 'good'], ['Smin', 'Minimum detectable signal', '', ''], ['lam', 'Wavelength', '', 'cool'], ['x16', 'Power for 2× the range', '', 'hot']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const smin = () => EM.C.kB * 290 * st.B * Math.pow(10, st.F / 10) * Math.pow(10, st.snr / 10);
  const pr = R => { const lam = EM.C.c / st.f, G = Math.pow(10, st.Gdb / 10); return st.Pt * G * G * lam * lam * st.sig / (Math.pow(4 * Math.PI, 3) * Math.pow(R, 4) * Math.pow(10, st.L / 10)); };
  function upd() {
    const lam = EM.C.c / st.f, G = Math.pow(10, st.Gdb / 10), sm = smin(), Rm = Math.pow(st.Pt * G * G * lam * lam * st.sig / (Math.pow(4 * Math.PI, 3) * sm * Math.pow(10, st.L / 10)), .25);
    ro.set('Rmax', EM.len(Rm)); ro.set('Smin', EM.fixed(10 * Math.log10(sm * 1000), 1), 'dBm'); ro.set('lam', EM.len(lam)); ro.set('x16', EM.si(st.Pt * 16, 'W'));
    info.innerHTML = '<h6>' + (Rm > 3e5 ? 'Long-range surveillance' : Rm > 3e4 ? 'Typical air-traffic / weather range' : 'Short-range radar') + '</h6>Echo power at the maximum range is ' + EM.fixed(10 * Math.log10(sm * 1000), 0) + ' dBm: ' + EM.num(sm, 2) + ' W. Radiating ' + EM.si(st.Pt, 'W') + ' and detecting <b>' + EM.si(sm, 'W') + '</b> is a ratio of ' + EM.fixed(10 * Math.log10(st.Pt / sm), 0) + ' dB. Try σ = 0.005 m² (stealth) against 5 m² (conventional): range drops by $(1/1000)^{1/4}=0.18$, to under a fifth.';
    if (window.renderMath) window.renderMath(info); S.redraw();
  }
  S.draw = (c, w, h) => {
    const sm = smin(), P = EM.plot(c, { x: 68, y: 14, w: w - 86, h: h - 56 }, { xmin: 100, xmax: 1e7, xlog: true, ymin: sm * 1e-6, ymax: 1e-2, ylog: true, xlabel: 'range (m)', ylabel: 'received echo power (W)', xfmt: v => EM.len(v, 2).replace(' ', ''), yfmt: v => EM.si(v, 'W', 1).replace(' ', '') });
    P.grid(); P.clip(); P.fn(R => pr(R), EM.col('acc3'), 3, 200); P.hline(sm, EM.col('bad'), 2, [6, 4]); P.unclip();
    EM.label(c, 'detection threshold', P.box.x + 8, P.Y(sm) - 9, EM.col('bad'), { size: 11, weight: '700' });
    const lam = EM.C.c / st.f, G = Math.pow(10, st.Gdb / 10), Rm = Math.pow(st.Pt * G * G * lam * lam * st.sig / (Math.pow(4 * Math.PI, 3) * sm * Math.pow(10, st.L / 10)), .25);
    if (Rm > 100 && Rm < 1e7) { P.dot(Rm, sm, EM.col('ok'), 7); EM.label(c, 'R_max = ' + EM.len(Rm), P.X(Rm) + 10, P.Y(sm) - 14, EM.col('ok'), { size: 12, weight: '800' }); }
    EM.label(c, 'slope −4: every 10× in range costs 40 dB', P.box.x + P.box.w - 8, P.box.y + 14, EM.col('muted'), { size: 11, align: 'right', weight: '500' });
  };
  upd();
});
