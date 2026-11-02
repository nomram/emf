/* pattern-anatomy — main lobe, sidelobes, nulls, beamwidth, F/B, gain, effective area for a line aperture */
EM.register('pattern-anatomy', function (el) {
  const W = EM.widget(el, { title: 'Anatomy of a radiation pattern', badge: 'Try it',
    note: 'A pattern is the <b>far-field strength versus direction</b>. Here: a line aperture of length $D$ with uniform or tapered illumination. Make the aperture bigger and the beam narrows: $\\text{HPBW}\\approx51\\lambda/D$ (uniform). Taper it (weaker at the edges) and sidelobes shrink, at the price of a wider beam.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .5 });
  const st = { D: 6, taper: 'uni', polar: true };
  EM.slider(side, { label: 'Aperture size D', min: 1, max: 24, step: .25, value: 6, fmt: v => v.toFixed(1) + ' λ', onInput: v => { st.D = v; upd(); } });
  EM.seg(side, [['uni', 'Uniform'], ['cos', 'Cosine taper'], ['cos2', 'Cosine²']], 'uni', v => { st.taper = v; upd(); });
  const ro = EM.readouts(side, [['hp', 'Beamwidth (−3 dB)', '', 'cool'], ['null', 'First null at', '', ''], ['sll', 'Highest sidelobe', '', 'hot'], ['D', 'Gain (ideal)', '', 'fuel'], ['Ae', 'Effective area', '', ''], ['eff', 'Taper efficiency', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const F = th => { const u = Math.PI * st.D * Math.sin(th); if (st.taper === 'uni') return EM.sinc(u); if (st.taper === 'cos') { const q = u / (Math.PI / 2); return Math.abs(Math.abs(q) - 1) < 1e-6 ? Math.PI / 4 : Math.cos(u) / (1 - q * q) * (Math.PI / 4); } const q = u / Math.PI; if (Math.abs(q) < 1e-6) return 1; return EM.sinc(u) / (1 - q * q) * 1; };
  const eff = () => st.taper === 'uni' ? 1 : st.taper === 'cos' ? .81 : .667;
  function upd() {
    const f = th => F(th) * (Math.cos(th) > 0 ? 1 : 0);
    let sll = -99, firstNull = 90; { let pk = 1; let prevDown = true; const n = 4000; let seenNull = false; let lastVal = Math.abs(F(0)); let local = 0; for (let i = 1; i <= n; i++) { const th = i / n * Math.PI / 2, v = Math.abs(F(th)); if (!seenNull && v > lastVal && i > 2) { seenNull = true; firstNull = EM.deg((i - 1) / n * Math.PI / 2); } if (seenNull && v > local) local = v; lastVal = v; } if (local > 0) sll = 20 * Math.log10(local / Math.abs(F(0))); }
    const hp = EM.hpbw(th => F(th), 0, Math.PI / 2), G = eff() * Math.PI * 2 * st.D * 1 /* line source: ≈ 2D for cos element */; // 2-D (line) gain
    ro.set('hp', hp.toFixed(1) + '°'); ro.set('null', firstNull.toFixed(1) + '°'); ro.set('sll', EM.fixed(sll, 1) + ' dB'); const Gl = 2 * st.D * eff(); ro.set('D', EM.fixed(10 * Math.log10(Gl), 1) + ' dBi (line)'); ro.set('Ae', EM.num(eff() * st.D, 3) + ' λ·(1 m)'); ro.set('eff', (eff() * 100).toFixed(0) + ' %');
    info.innerHTML = '<h6>Reading the plot</h6><b>Main lobe</b>: where most power goes. <b>Beamwidth</b>: angular width between the −3 dB points (half power). <b>Nulls</b>: directions of zero field. <b>Sidelobes</b>: unwanted lobes, listed by the highest one. For a uniform aperture the highest is always <b>−13.3 dB</b>, for a cosine taper −23 dB, for cosine² −32 dB. Gain ∝ aperture area in wavelengths: <b>big in wavelengths = narrow beam = high gain</b>.';
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const R = Math.min(h * .42, w * .22), cx = R + 24, cy = h / 2;
    EM.polarGrid(c, cx, cy, R, { dbMin: -40, step: 10, angStep: 30, noLabels: false });
    EM.polarLine(c, cx, cy, R, th => { const t = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); const tt = t > Math.PI ? t - 2 * Math.PI : t; return Math.abs(F(tt)) * (Math.abs(tt) < Math.PI / 2 ? 1 : .01); }, { dbMin: -40, color: EM.col('acc'), width: 2.4, fill: EM.alpha(EM.col('acc'), .12), n: 720 });
    EM.label(c, 'polar (dB)', cx, h - 10, EM.col('muted'), { size: 11, align: 'center', weight: '500' });
    const P = EM.plot(c, { x: R * 2 + 90, y: 14, w: w - R * 2 - 110, h: h - 54 }, { xmin: -90, xmax: 90, ymin: -40, ymax: 3, xlabel: 'angle from boresight (°)', ylabel: 'dB', xticks: [-90, -60, -30, 0, 30, 60, 90], yticks: [-40, -30, -20, -10, 0] });
    P.grid(); P.clip(); P.fn(a => 20 * Math.log10(Math.max(1e-4, Math.abs(F(EM.rad(a))))), EM.col('acc'), 2.4, 600); P.unclip();
    P.hline(-3, EM.alpha(EM.col('acc3'), .8), 1, [4, 4]); EM.label(c, '−3 dB', P.box.x + 4, P.Y(-3) - 8, EM.col('acc3'), { size: 10 });
    const hp = EM.hpbw(th => F(th), 0, Math.PI / 2) / 2; EM.arrow(c, P.X(-hp), P.Y(-3), P.X(hp), P.Y(-3), EM.col('acc3'), 1.5, 6); EM.arrow(c, P.X(hp), P.Y(-3), P.X(-hp), P.Y(-3), EM.col('acc3'), 1.5, 6);
    EM.label(c, 'main lobe', P.X(0) + 10, P.Y(0) + 10, EM.col('text'), { size: 11, weight: '700' }); EM.label(c, 'sidelobes', P.X(35), P.Y(-30), EM.col('bad'), { size: 11, weight: '700', align: 'center' });
  };
  upd();
});
