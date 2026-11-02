/* electron-drift — electrons in a copper wire: slow drift (DC) vs jiggle (AC), field travels at ~c */
EM.register('electron-drift', function (el) {
  const W = EM.widget(el, { title: 'What “a current of 10 amps” really looks like', badge: 'Try it',
    note: 'Drift speed $v_d = I/(n q A)$ with $n = 8.5\\times10^{28}$ free electrons per m³ in copper. The animation is exaggerated so you can see it; the number is real.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .34 });
  const st = { I: 10, A: 1.5, f: 50, ac: false };
  const I = EM.slider(side, { label: 'Current I', min: .1, max: 100, log: true, value: 10, unit: 'A', onInput: v => { st.I = v; upd(); } });
  const A = EM.slider(side, { label: 'Wire cross-section A', min: .5, max: 16, log: true, value: 1.5, unit: 'mm²', onInput: v => { st.A = v; upd(); } });
  const F = EM.slider(side, { label: 'AC frequency', min: 1, max: 1e9, log: true, value: 50, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const tg = EM.toggle(side, { label: 'Alternating current (AC)', checked: false, onChange: v => { st.ac = v; upd(); } });
  const ro = EM.readouts(side, [['vd', 'Electron drift speed', '', 'cool'], ['t', 'Time to cross 1 m', '', ''], ['amp', 'AC: wiggle amplitude', '', 'hot'], ['c', 'Field speed (≈ c)', '299 792 km/s', 'fuel']]);
  const N = 70, es = Array.from({ length: N }, (_, i) => ({ x: Math.random(), y: Math.random(), ph: Math.random() * 6.28 }));
  function upd() {
    const vd = st.I / (8.5e28 * EM.C.e * st.A * 1e-6);
    ro.set('vd', EM.si(vd, 'm/s')); ro.set('t', vd > 0 ? EM.num(1 / vd / 60, 3) : '—', 'min');
    const amp = Math.sqrt(2) * vd / (2 * Math.PI * st.f);
    ro.set('amp', st.ac ? EM.len(amp) : 'n/a (steady)');
    F.el.style.display = st.ac ? '' : 'none';
  }
  S.draw = (c, w, h) => {
    const pad = 10, wh = h - 2 * pad;
    c.fillStyle = EM.alpha(EM.col('acc2'), .12); c.strokeStyle = EM.col('acc2'); c.lineWidth = 2; c.beginPath(); c.roundRect(pad, pad, w - 2 * pad, wh, 12); c.fill(); c.stroke();
    for (const e of es) {
      const x = pad + 8 + ((e.x * (w - 2 * pad - 16)) | 0), y = pad + 10 + e.y * (wh - 20);
      c.fillStyle = EM.col('acc'); c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill();
    }
    // lattice ions
    c.fillStyle = EM.alpha(EM.col('muted'), .55);
    for (let i = 0; i < 24; i++) for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(pad + 24 + i * (w - 2 * pad - 40) / 23, pad + 22 + j * (wh - 36) / 3, 5, 0, 7); c.fill(); }
    EM.label(c, st.ac ? 'electrons shake back and forth (they hardly go anywhere)' : 'electrons drift one way, ever so slowly', 18, h - 14, EM.col('text-2'), { size: 12 });
    EM.arrow(c, w - 130, h - 14, w - 40, h - 14, EM.col('acc3'), 2);
    EM.label(c, 'E-field push travels at ~c', w - 134, h - 28, EM.col('acc3'), { size: 11, align: 'right' });
  };
  EM.loop(el, (t, dt) => {
    const vis = Math.log10(st.I / st.A + 1) * .35;      // exaggerated on-screen speed (fraction of wire per second)
    for (const e of es) {
      if (st.ac) { e.x = (e.x + 0) ; e.ph += dt * Math.min(12, 3 + Math.log10(st.f)) ; e.x += Math.sin(e.ph) * dt * .08 * vis * 3; }
      else e.x += dt * vis * .5;
      e.x = (e.x + 1) % 1; e.y += (Math.random() - .5) * dt * .3; e.y = EM.clamp(e.y, 0, 1);
    }
    S.redraw();
  });
  upd(); S.redraw();
});
