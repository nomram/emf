/* dish — parabolic reflector geometry (rays to the focus), Airy beam, gain, surface-accuracy (Ruze) loss */
EM.register('dish', function (el) {
  const W = EM.widget(el, { title: 'The parabolic dish: from rays to a beam', badge: 'Try it',
    note: 'A parabola sends every ray arriving parallel to its axis to <b>one focus</b>, and (by reciprocity) a feed at the focus sends a parallel beam out. The beam width is set by the diameter: HPBW ≈ 1.02 λ/D (uniform) and ≈ 70 λ/D (typical, tapered). Surface errors ε cost gain as $e^{-(4\\pi\\varepsilon/\\lambda)^2}$ (Ruze).' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 }), B = EM.canvas(main, { aspect: .5 }); B.cv.style.marginTop = '12px';
  const st = { D: 3, f: 12e9, fd: .4, eps: .5, eta: .65 };
  const pre = EM.select(side, { label: 'Presets', options: [['', 'choose…'], ['tv', 'Satellite TV dish: 60 cm at 12 GHz'], ['wifi', 'Wi-Fi grid dish: 60 cm at 5.8 GHz'], ['dsn', 'DSN: 70 m at 8.4 GHz'], ['ao', 'Parkes radio telescope: 64 m at 1.4 GHz'], ['fast', 'FAST (China): 500 m at 1.4 GHz'], ['radar', 'Marine radar: 0.6 m at 9.4 GHz']], value: '', onChange: v => { const P = { tv: [.6, 12e9], wifi: [.6, 5.8e9], dsn: [70, 8.4e9], ao: [64, 1.4e9], fast: [500, 1.4e9], radar: [.6, 9.4e9] }[v]; if (P) { st.D = P[0]; st.f = P[1]; Ds.set(st.D, true); fs.set(st.f, true); upd(); } } });
  const Ds = EM.slider(side, { label: 'Diameter D', min: .1, max: 500, log: true, value: 3, fmt: v => EM.len(v), onInput: v => { st.D = v; pre.sel.value = ''; upd(); } });
  const fs = EM.slider(side, { label: 'Frequency', min: 3e8, max: 1e11, log: true, value: 12e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; pre.sel.value = ''; upd(); } });
  EM.slider(side, { label: 'Focal ratio f/D', min: .25, max: 1, step: .01, value: .4, fmt: v => v.toFixed(2), onInput: v => { st.fd = v; upd(); } });
  EM.slider(side, { label: 'Surface error (rms)', min: .01, max: 20, log: true, value: .5, fmt: v => EM.len(v / 1000), onInput: v => { st.eps = v; upd(); } });
  const ro = EM.readouts(side, [['lam', 'Wavelength', '', 'cool'], ['DL', 'D / λ', '', ''], ['G', 'Gain', '', 'fuel'], ['hp', 'Beamwidth (−3 dB)', '', 'hot'], ['ruze', 'Surface-error loss', '', 'bad'], ['far', 'Far field starts at', '', '']]);
  function upd() {
    const lam = EM.C.c / st.f, DL = st.D / lam, ruze = Math.exp(-Math.pow(4 * Math.PI * st.eps / 1000 / lam, 2)), G = st.eta * Math.pow(Math.PI * DL, 2) * ruze;
    ro.set('lam', EM.len(lam)); ro.set('DL', EM.num(DL, 3)); ro.set('G', EM.fixed(10 * Math.log10(G), 1), 'dBi'); ro.set('hp', EM.num(70 / DL, 3) + '°'); ro.set('ruze', ruze > .99 ? '< 0.05 dB' : EM.fixed(-10 * Math.log10(ruze), 1) + ' dB'); ro.set('far', EM.len(2 * st.D * st.D / lam));
    A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    // vertex on the right, dish opens to the left; rays arrive from the left, parallel to the axis, and reflect to the focus
    const Dpx = Math.min(h * .8, w * .5), fpx = st.fd * Dpx, vx = w * .8, cy = h / 2, par = y => y * y / (4 * fpx), dx = y => vx - par(y), n = 9;
    for (let i = 0; i < n; i++) {
      const y = (i / (n - 1) - .5) * Dpx * .92, x = dx(y);
      c.lineWidth = 1.5; c.strokeStyle = EM.alpha(EM.col('acc'), .85); c.beginPath(); c.moveTo(w * .05, cy + y); c.lineTo(x, cy + y); c.stroke();
      c.strokeStyle = EM.alpha(EM.col('acc2'), .95); c.beginPath(); c.moveTo(x, cy + y); c.lineTo(vx - fpx, cy); c.stroke();
      EM.arrow(c, w * .05, cy + y, w * .05 + 24, cy + y, EM.col('acc'), 1.5, 6);
    }
    c.strokeStyle = EM.col('text'); c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 80; i++) { const y = (i / 80 - .5) * Dpx; i ? c.lineTo(dx(y), cy + y) : c.moveTo(dx(y), cy + y); } c.stroke();
    c.setLineDash([4, 4]); c.strokeStyle = EM.alpha(EM.col('muted'), .7); c.lineWidth = 1; c.beginPath(); c.moveTo(w * .05, cy); c.lineTo(vx, cy); c.stroke(); c.setLineDash([]);
    c.fillStyle = EM.col('ok'); c.beginPath(); c.arc(vx - fpx, cy, 6, 0, 7); c.fill(); EM.label(c, 'focus (feed)', vx - fpx, cy - 14, EM.col('ok'), { size: 11, align: 'center', weight: '700' });
    EM.label(c, 'parallel wave in (or beam out)', 12, 16, EM.col('acc'), { size: 11 }); EM.label(c, 'focal length f = ' + EM.len(st.fd * st.D) + ',  D = ' + EM.len(st.D), 12, h - 12, EM.col('text-2'), { size: 11, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const lam = EM.C.c / st.f, DL = st.D / lam, span = Math.min(90, Math.max(2.5, 200 / Math.max(DL, 1) * 1.5)), P = EM.plot(c, { x: 58, y: 14, w: w - 76, h: h - 54 }, { xmin: -span, xmax: span, ymin: -50, ymax: 3, xlabel: 'angle from boresight (°)', ylabel: 'dB', yticks: [-50, -40, -30, -20, -10, 0] });
    P.grid(); const ruze = Math.exp(-Math.pow(4 * Math.PI * st.eps / 1000 / lam, 2));
    P.clip(); P.fn(a => { const u = Math.PI * DL * Math.sin(EM.rad(a)); const v = Math.abs(u) < 1e-6 ? 1 : 2 * EM.j1(u) / u; return 20 * Math.log10(Math.max(1e-4, Math.abs(v))); }, EM.col('acc3'), 2.4, 800); P.unclip();
    P.hline(-3, EM.alpha(EM.col('acc'), .8), 1, [4, 4]); const hp = 58.4 / DL / 1; EM.label(c, 'ideal uniform dish: −3 dB at ±' + EM.num(hp / 2, 3) + '°; sidelobes −17.6 dB', P.box.x + 8, P.box.y + 12, EM.col('text-2'), { size: 11, weight: '500' });
  };
  EM.loop(el, () => {}, { autostart: false });
  upd();
});
