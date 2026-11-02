/* rcs-shapes — monostatic RCS vs aspect angle: plate, cylinder, trihedral corner, sphere, boxy vs faceted body */
EM.register('rcs-shapes', function (el) {
  const W = EM.widget(el, { title: 'Shape decides: radar cross section vs viewing angle', badge: 'Try it',
    note: 'A flat face reflects like a mirror: <b>huge</b> echo when it faces the radar, tiny otherwise. A corner reflector sends energy back whatever the direction (hence radar reflectors on boats). A sphere looks the same from everywhere. A <b>faceted</b> body tilts its flat faces away so that, from most directions, the mirror reflections go somewhere else. Peak values: plate $4\\pi A^2/\\lambda^2$, corner $4\\pi a^4/3\\lambda^2$, cylinder $2\\pi rL^2/\\lambda$, sphere $\\pi r^2$.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .58 });
  const st = { shape: 'plate', a: 2, f: 3e9 };
  const sinc = EM.sinc, deg = EM.deg;
  const SH = {
    sphere: { n: 'Sphere (r = size/2)', peak: (a, lam) => Math.PI * a * a / 4, pat: () => 1, txt: 'The same from every direction: σ = πr² (in the optical region). Large-sphere RCS is modest.' },
    plate: { n: 'Flat plate (side = size)', peak: (a, lam) => 4 * Math.PI * Math.pow(a * a, 2) / (lam * lam), pat: (th, a, lam) => Math.pow(sinc(2 * Math.PI / lam * a * Math.sin(th)), 2) * Math.pow(Math.cos(th), 2), txt: 'A mirror: enormous at normal incidence, falling off in a narrow lobe of width ≈ λ/a. A 1 m plate at 10 GHz has a peak of 1.4×10⁴ m²: more than a loaded airliner.' },
    cyl: { n: 'Cylinder (length = size, r = size/20)', peak: (a, lam) => 2 * Math.PI * (a / 20) * a * a / lam, pat: (th, a, lam) => Math.pow(sinc(2 * Math.PI / lam * a * Math.sin(th)), 2) * Math.pow(Math.cos(th), 1), txt: 'Echo is strong when the radar looks broadside (perpendicular to the axis) and weak end-on. Fuselages and missile bodies behave this way.' },
    corner: { n: 'Trihedral corner reflector (edge = size)', peak: (a, lam) => 4 * Math.PI * Math.pow(a, 4) / (3 * lam * lam), pat: (th) => Math.exp(-Math.pow(th / EM.rad(24), 2) * Math.LN2 * .5 * 1) , txt: 'Three perpendicular plates send any ray back where it came from: wide-angle (≈ 40° beam) echo with a big peak. Boats hang one aloft as a “radar reflector” so that others see them; road-sign and calibration targets also use corners.' },
    box: { n: 'Boxy body: flat faces to nose, sides and tail', peak: (a, lam) => 4 * Math.PI * Math.pow(a * a / 2, 2) / (lam * lam), pat: (th, a, lam) => { let s = 0; for (const n of [0, 90, 180, 270]) { const d = th - EM.rad(n); s += Math.pow(sinc(2 * Math.PI / lam * a * Math.sin(d)), 2) * Math.pow(Math.cos(d), 2) * (Math.cos(d) > 0 ? 1 : 0); } return s + .003; }, txt: 'Four flat faces: four huge specular spikes at 0°, 90°, 180°, 270° and low echoes between. From the nose it looks like a big plate.' },
    facet: { n: 'Faceted body: faces tilted 45° off the axes', peak: (a, lam) => 4 * Math.PI * Math.pow(a * a / 2, 2) / (lam * lam), pat: (th, a, lam) => { let s = 0; for (const n of [45, 135, 225, 315]) { const d = th - EM.rad(n); s += Math.pow(sinc(2 * Math.PI / lam * a * Math.sin(d)), 2) * Math.pow(Math.cos(d), 2) * (Math.cos(d) > 0 ? 1 : 0); } return s + .003; }, txt: 'The same four faces, rotated: spikes now point at ±45° and ±135°, so the nose, sides and tail look dark. The spikes are narrow (≈ λ/a), so a radar must be in exactly the wrong direction to see them. This is “shaping”, the first rule of low observability.' },
  };
  const sel = EM.select(side, { label: 'Shape', options: Object.entries(SH).map(([k, v]) => [k, v.n]), value: 'plate', onChange: v => { st.shape = v; upd(); } });
  EM.slider(side, { label: 'Size', min: .1, max: 20, log: true, value: 2, fmt: v => EM.len(v), onInput: v => { st.a = v; upd(); } });
  EM.slider(side, { label: 'Radar frequency', min: 1e8, max: 1e11, log: true, value: 3e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const ro = EM.readouts(side, [['peak', 'Peak RCS', '', 'fuel'], ['nose', 'RCS seen from the nose (0°)', '', 'hot'], ['avg', 'Average over all angles', '', 'cool'], ['rng', 'Detection range vs a 1 m² target', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const sig = th => { const s = SH[st.shape], lam = EM.C.c / st.f; return Math.max(1e-9, s.peak(st.a, lam) * s.pat(th, st.a, lam) / (st.shape === 'box' || st.shape === 'facet' ? 1.0 : 1)); };
  function upd() {
    const lam = EM.C.c / st.f; let mx = 0, avg = 0; const n = 720; for (let i = 0; i < n; i++) { const v = sig(i / n * 2 * Math.PI); mx = Math.max(mx, v); avg += v / n; }
    const dB = v => EM.fixed(10 * Math.log10(v), 1) + ' dBsm';
    ro.set('peak', EM.num(mx, 3) + ' m² (' + dB(mx) + ')'); ro.set('nose', EM.num(sig(0), 3) + ' m² (' + dB(sig(0)) + ')'); ro.set('avg', EM.num(avg, 3) + ' m²'); ro.set('rng', '× ' + EM.num(Math.pow(sig(0), .25), 3) + ' (nose view)');
    info.innerHTML = '<h6>' + SH[st.shape].n + '</h6>' + SH[st.shape].txt + ' Remember: detection range scales as $\\sigma^{1/4}$, so cutting σ by 1000× shortens range only to 18 % (×0.18), and this is only along directions where the RCS is small. Shaping works best when features are larger than λ; for wavelengths comparable to the whole aircraft (VHF) the “resonance” returns reappear.';
    if (window.renderMath) window.renderMath(info); S.redraw();
  }
  S.draw = (c, w, h) => {
    const R = Math.min(h * .42, w * .27), cx = R + 28, cy = h / 2; let mx = 0; for (let i = 0; i < 720; i++) mx = Math.max(mx, sig(i / 720 * 2 * Math.PI));
    EM.polarGrid(c, cx, cy, R, { dbMin: -50, step: 10, angStep: 30 });
    EM.polarLine(c, cx, cy, R, th => Math.sqrt(sig(th) / mx), { dbMin: -50, color: EM.col('acc3'), width: 2.4, fill: EM.alpha(EM.col('acc3'), .14), n: 720 });
    EM.label(c, 'polar RCS (dB below peak); 0° = nose', cx, h - 8, EM.col('muted'), { size: 10, align: 'center', weight: '500' });
    // schematic of the body
    const ox = R * 2 + 90, a = Math.min(w - ox - 20, 140) * .5, my = cy; c.strokeStyle = EM.col('acc'); c.fillStyle = EM.alpha(EM.col('acc'), .15); c.lineWidth = 2.5; const sh = st.shape;
    c.save(); c.translate(ox + 70, my);
    if (sh === 'sphere') { c.beginPath(); c.arc(0, 0, a * .6, 0, 7); c.fill(); c.stroke(); } else if (sh === 'plate') { c.fillRect(-4, -a * .8, 8, a * 1.6); c.strokeRect(-4, -a * .8, 8, a * 1.6); } else if (sh === 'cyl') { c.fillRect(-a * .8, -6, a * 1.6, 12); c.strokeRect(-a * .8, -6, a * 1.6, 12); } else if (sh === 'corner') { c.beginPath(); c.moveTo(-a * .4, -a * .6); c.lineTo(a * .5, 0); c.lineTo(-a * .4, a * .6); c.closePath(); c.moveTo(a * .5, 0); c.lineTo(-a * .4, 0); c.fill(); c.stroke(); } else { c.rotate(sh === 'facet' ? Math.PI / 4 : 0); c.fillRect(-a * .55, -a * .55, a * 1.1, a * 1.1); c.strokeRect(-a * .55, -a * .55, a * 1.1, a * 1.1); }
    c.restore(); EM.arrow(c, ox + 70 - a * 1.2, my, ox + 70 - a * 1.2 + 26, my, EM.col('acc2'), 2, 8); EM.label(c, 'radar (nose, 0°)', ox + 70 - a * 1.2, my - 12, EM.col('acc2'), { size: 10 });
  };
  upd();
});
