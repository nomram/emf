/* inverse-square — power spreads over a sphere: S = P G / (4 pi r^2), and the field E from S */
EM.register('inverse-square', function (el) {
  const W = EM.widget(el, { title: 'Spreading out: power density and field strength vs distance', badge: 'Calculate',
    note: 'Far from any antenna the power spreads over a sphere of area $4\\pi r^2$: <b>double the distance, a quarter the power density</b> (−6 dB), but only <b>half the field strength</b> $E$, because $S=E^2/377$. The exposure limit shown is the ICNIRP general-public reference level for 2–300 GHz (10 W/m²); limits are lower below 2 GHz.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .5 });
  const PRE = { phone: ['Mobile phone (2 GHz)', .25, 0], wifi: ['Wi-Fi router', .1, 3], fm: ['FM radio station', 1e5, 6], radar: ['Airport radar (peak)', 1e6, 33], sat: ['Geostationary satellite beam', 100, 30] };
  const st = { P: .1, G: 3, d: 3 };
  const pre = EM.select(side, { label: 'Preset source', options: [['', 'custom…'], ...Object.entries(PRE).map(([k, v]) => [k, v[0]])], value: 'wifi', onChange: v => { if (v) { st.P = PRE[v][1]; st.G = PRE[v][2]; Ps.set(st.P, true); Gs.set(st.G, true); upd(); } } });
  const Ps = EM.slider(side, { label: 'Transmit power P', min: 1e-3, max: 1e7, log: true, value: .1, fmt: v => EM.si(v, 'W'), onInput: v => { st.P = v; pre.sel.value = ''; upd(); } });
  const Gs = EM.slider(side, { label: 'Antenna gain G', min: 0, max: 50, step: .5, value: 3, unit: 'dBi', onInput: v => { st.G = v; pre.sel.value = ''; upd(); } });
  const Ds = EM.slider(side, { label: 'Distance r', min: .1, max: 1e6, log: true, value: 3, fmt: v => EM.len(v), onInput: v => { st.d = v; upd(); } });
  const ro = EM.readouts(side, [['S', 'Power density', '', 'fuel'], ['E', 'Electric field (rms)', '', 'hot'], ['H', 'Magnetic field', '', 'cool'], ['lim', 'Of 10 W/m² limit', '', 'good']]);
  function calc(d) { const S_ = st.P * Math.pow(10, st.G / 10) / (4 * Math.PI * d * d); return { S: S_, E: Math.sqrt(S_ * EM.C.eta0) }; }
  function upd() {
    const k = calc(st.d); ro.set('S', EM.si(k.S, 'W/m²')); ro.set('E', EM.si(k.E, 'V/m')); ro.set('H', EM.si(k.E / EM.C.eta0, 'A/m'));
    const pc = k.S / 10 * 100; ro.set('lim', pc >= 1 ? EM.num(pc, 3) + ' %' : EM.num(pc, 2) + ' %'); S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 66, y: 12, w: w - 84, h: h - 54 }, { xmin: .1, xmax: 1e6, xlog: true, ymin: 1e-14, ymax: 1e8, ylog: true, xlabel: 'distance (m)', ylabel: 'power density S (W/m²)', xfmt: v => EM.len(v, 2).replace(/ /, ''), yfmt: v => EM.num(v, 1) });
    P.grid(); P.hline(10, EM.alpha(EM.col('bad'), .9), 1.5, [6, 4]); P.text('exposure limit 10 W/m²', P.box.x + 6, P.Y(10) - 9, EM.col('bad'), 'left', EM.font(11));
    P.hline(1e-12, EM.alpha(EM.col('acc'), .8), 1, [3, 4]); P.text('≈ a weak but usable signal (1 pW/m²)', P.box.x + 6, P.Y(1e-12) - 9, EM.col('acc'), 'left', EM.font(11));
    P.clip(); P.fn(d => calc(d).S, EM.col('acc3'), 3, 100); P.unclip();
    P.dot(st.d, calc(st.d).S, EM.col('acc2'), 6);
    EM.label(c, '−20 dB per decade of distance (power)', P.box.x + P.box.w - 8, P.box.y + 14, EM.col('muted'), { size: 11, align: 'right', weight: '500' });
  };
  upd();
});
