/* radiating-dipole — exact fields of a small oscillating dipole (Hertzian), near field -> far field */
EM.register('radiating-dipole', function (el) {
  const W = EM.widget(el, { title: 'A wire that radiates: near field and far field', badge: 'Try it',
    note: 'A tiny vertical antenna (a few thousandths of a wavelength long) seen from the side. Colour = field strength with sign, squashed so you can see both the strong near field and the faint far field. Close in the field sloshes back and forth; beyond ≈ λ/2π it detaches and travels.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .72 });
  const Pl = EM.canvas(main, { aspect: .5 }); Pl.cv.style.marginTop = '12px';
  const st = { comp: 'Ez', span: 3, t: 0, show: true };
  const gw = 150, gh = 108, off = EM.offscreen(gw, gh), octx = off.getContext('2d'), img = octx.createImageData(gw, gh);
  EM.seg(side, [['Ez', 'E (along wire)'], ['Emag', '|E| energy'], ['Hphi', 'H (circles wire)']], 'Ez', v => { st.comp = v; });
  EM.slider(side, { label: 'View width', min: 1, max: 8, step: .1, value: 3, fmt: v => v.toFixed(1) + ' λ', onInput: v => { st.span = v; Pl.redraw(); } });
  EM.toggle(side, { label: 'Mark the near/far boundary r = λ/2π', checked: true, onChange: v => { st.show = v; Pl.redraw(); } });
  const ro = EM.readouts(side, [['b', 'Near-field limit λ/2π', '', 'fuel'], ['pat', 'Strongest sideways', 'θ = 90°', 'cool'], ['null', 'Null', 'along the wire', 'bad']]);
  side.append(EM.h('div', { class: 'info-box', html: '<h6>Three regimes</h6><b>Reactive near field</b> ($r\\ll\\lambda/2\\pi$): $E\\propto1/r^3$, energy sloshes back to the antenna.<br><b>Induction zone</b> ($r\\sim\\lambda/2\\pi$): $1/r^2$ terms, a mixture.<br><b>Radiation field</b> ($r\\gg\\lambda$): $E\\propto1/r$, $\\vec E\\perp\\vec H\\perp\\hat r$, a true wave, with $\\sin\\theta$ pattern.' }));
  function fields(x, z) { // returns {Ez, Hphi, mag} instantaneous for current phase, lambda = 1
    const r = Math.max(1e-3, Math.hypot(x, z)), k = 2 * Math.PI, u = k * r, ct = z / r, sn = Math.abs(x) / r, sgx = x >= 0 ? 1 : -1;
    const e = [Math.cos(u), -Math.sin(u)], cx = EM.cx;
    const Er = cx.mul(cx.sc([1, -1 / u], 2 * ct / (r * r)), e);
    const Et = cx.mul([1 / u * k * sn / r, (1 - 1 / (u * u)) * k * sn / r], e);   // j*B scaled
    // H_phi * eta = (j k sin/r)(1 + 1/(j k r)) e^{-jkr} = (k sin/r)( 1/(kr)... ) -> j(1 - j/u) = (1/u, 1)
    const Hc = cx.mul([k * sn / r / u, k * sn / r], e);
    const ph = S.phase || 0, c = Math.cos(ph), s = Math.sin(ph);
    const re = (v) => v[0] * c - v[1] * s;
    const er = re(Er), et = re(Et);
    // E vector: Er*rhat + Et*thetahat; rhat = (sgx*sn, ct) ; thetahat = (sgx*ct, -sn)
    const Ex = er * sgx * sn + et * sgx * ct, Ez = er * ct - et * sn;
    return { Ez, Hphi: re(Hc) * sgx, mag: Math.hypot(Ex, Ez) };
  }
  S.draw = (c, w, h) => {
    const sp = st.span, dark = EM.isDark();
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const x = ((i + .5) / gw - .5) * sp, z = (.5 - (j + .5) / gh) * sp * h / w;
      const f = fields(x, z * 1);
      let v, rgb;
      if (st.comp === 'Emag') { v = Math.pow(f.mag / 6.28, .4) * .85; rgb = EM.heat(v); }
      else { const val = st.comp === 'Ez' ? f.Ez : f.Hphi; v = Math.sign(val) * Math.pow(Math.abs(val) / 6.28, .4) * .85; rgb = EM.diverge(v); }
      const o = (j * gw + i) * 4; img.data[o] = rgb[0]; img.data[o + 1] = rgb[1]; img.data[o + 2] = rgb[2]; img.data[o + 3] = 255;
    }
    octx.putImageData(img, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, w, h);
    const cx = w / 2, cy = h / 2, pxl = w / sp;               // pixels per wavelength (horizontal)
    // dipole antenna
    c.strokeStyle = EM.col('acc3'); c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy - 10); c.lineTo(cx, cy + 10); c.stroke();
    c.fillStyle = EM.col('acc3'); c.beginPath(); c.arc(cx, cy, 3, 0, 7); c.fill();
    c.setLineDash([5, 5]); c.lineWidth = 1.4; c.strokeStyle = EM.alpha(EM.col('acc3'), .9);
    if (st.show) { c.beginPath(); c.arc(cx, cy, pxl / (2 * Math.PI), 0, 7); c.stroke(); }
    c.setLineDash([]);
    if (st.show) EM.label(c, 'r = λ/2π', cx + pxl / (2 * Math.PI) * .72 + 4, cy - pxl / (2 * Math.PI) * .72 - 8, EM.col('acc3'), { size: 11, bg: EM.alpha(EM.col('bg'), .6) });
    // scale bar
    c.strokeStyle = EM.col('text'); c.lineWidth = 2; c.beginPath(); c.moveTo(14, h - 14); c.lineTo(14 + pxl, h - 14); c.stroke(); EM.label(c, '1 λ', 20 + pxl, h - 14, EM.col('text'), { size: 12 });
    // pattern hint
    EM.label(c, 'null along the wire', cx + 6, 16, EM.col('text'), { size: 11, bg: EM.alpha(EM.col('bg'), .55) });
  };
  Pl.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 62, y: 12, w: w - 80, h: h - 52 }, { xmin: .02, xmax: st.span, xlog: true, ymin: .1, ymax: 1e6, ylog: true, xlabel: 'distance r from the wire (wavelengths)', ylabel: 'relative field', xfmt: v => EM.num(v, 2), yfmt: v => EM.num(v, 1) });
    P.grid();
    const u = r => 2 * Math.PI * r;
    P.clip();
    P.fn(r => 1 / u(r), EM.col('acc'), 2, 120, [6, 4]); P.fn(r => 1 / (u(r) * u(r)), EM.col('acc3'), 2, 120, [6, 4]); P.fn(r => 1 / Math.pow(u(r), 3), EM.col('acc2'), 2, 120, [6, 4]);
    P.fn(r => { const q = u(r); return 1 / q * Math.hypot(1 - 1 / (q * q), 1 / q); }, EM.col('text'), 3, 160);
    P.unclip();
    if (st.show) P.vline(1 / (2 * Math.PI), EM.alpha(EM.col('acc3'), .7), 1.2, [4, 4]);
    EM.label(c, 'total |E| at θ = 90°', P.box.x + 12, P.box.y + 12, EM.col('text'), { size: 11 });
    EM.label(c, '1/r  radiation', P.box.x + 12, P.box.y + 28, EM.col('acc'), { size: 11 }); EM.label(c, '1/r²  induction', P.box.x + 12, P.box.y + 44, EM.col('acc3'), { size: 11 }); EM.label(c, '1/r³  static-like', P.box.x + 12, P.box.y + 60, EM.col('acc2'), { size: 11 });
  };
  EM.loop(el, (t, dt) => { S.phase = (S.phase || 0) + dt * 2.6; S.redraw(); });
  ro.set('b', '0.159 λ'); ro.set('pat', 'sinθ'); ro.set('null', 'zero field');
  Pl.redraw();
});
