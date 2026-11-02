/* rcs-sphere — radar cross section of a perfectly conducting sphere vs size in wavelengths (exact Mie series) */
EM.register('rcs-sphere', function (el) {
  const W = EM.widget(el, { title: 'The three regions of a sphere’s radar cross section', badge: 'Try it',
    note: 'Exact scattering from a perfectly conducting sphere (Mie series), plotted as $\\sigma/\\pi r^2$ against $x=2\\pi r/\\lambda$. <b>Rayleigh region</b> ($x\\ll1$): $\\sigma\\approx9\\pi r^2x^4$ falls fast: things much <em>smaller than the wavelength</em> are nearly invisible. <b>Resonance region</b> ($x\\sim1$–10): ripples, with a peak of 3.6× at $x=1$. <b>Optical region</b> ($x\\gg1$): $\\sigma\\to\\pi r^2$, the geometric shadow area.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .6 });
  function mie(x) {
    const N = Math.ceil(x + 4 * Math.cbrt(x) + 3), M = N + 30, tmp = new Array(M + 2).fill(0), j = new Array(N + 2).fill(0), y = new Array(N + 2).fill(0); tmp[M] = 1e-30;
    for (let n = M; n >= 1; n--) { tmp[n - 1] = (2 * n + 1) / x * tmp[n] - tmp[n + 1]; if (Math.abs(tmp[n - 1]) > 1e250) for (let k = n - 1; k <= M + 1; k++) tmp[k] *= 1e-250; }
    const sc = (Math.sin(x) / x) / tmp[0]; for (let n = 0; n <= N + 1; n++) j[n] = tmp[n] * sc;
    y[0] = -Math.cos(x) / x; y[1] = -Math.cos(x) / (x * x) - Math.sin(x) / x; for (let n = 2; n <= N + 1; n++) y[n] = (2 * n - 1) / x * y[n - 1] - y[n - 2];
    let sr = 0, si = 0;
    for (let n = 1; n <= N; n++) {
      const psi = x * j[n], psip = x * j[n - 1] - n * j[n], xir = x * j[n], xii = x * y[n], xpr = x * j[n - 1] - n * j[n], xpi = x * y[n - 1] - n * y[n];
      const d1 = xpr * xpr + xpi * xpi, ar = psip * xpr / d1, ai = -psip * xpi / d1, d2 = xir * xir + xii * xii, br = psi * xir / d2, bi = -psi * xii / d2, sg = (n % 2 ? -1 : 1) * (2 * n + 1);
      sr += sg * (ar - br); si += sg * (ai - bi);
    }
    return (sr * sr + si * si) / (x * x);
  }
  const st = { r: .05, f: 3e9 };
  const PRE = [['Raindrop (r = 1 mm) at 3 GHz', .001, 3e9], ['Raindrop at 94 GHz', .001, 94e9], ['Ball bearing (r = 1 cm) at 10 GHz', .01, 1e10], ['Golf ball (2.1 cm) at 10 GHz', .021, 1e10], ['Metal sphere r = 10 cm at 3 GHz', .1, 3e9], ['Calibration sphere r = 25 cm at 1 GHz', .25, 1e9], ['Person-sized sphere r = 0.5 m at 150 MHz', .5, 1.5e8], ['Insect (r = 5 mm) at 10 GHz', .005, 1e10]];
  EM.select(side, { label: 'Examples', options: [['', 'choose…'], ...PRE.map((p, i) => [i, p[0]])], value: '', onChange: v => { if (v === '') return; const p = PRE[+v]; st.r = p[1]; st.f = p[2]; rs.set(st.r, true); fs.set(st.f, true); upd(); } });
  const rs = EM.slider(side, { label: 'Sphere radius r', min: 1e-3, max: 5, log: true, value: .05, fmt: v => EM.len(v), onInput: v => { st.r = v; upd(); } });
  const fs = EM.slider(side, { label: 'Radar frequency', min: 1e8, max: 1e11, log: true, value: 3e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const ro = EM.readouts(side, [['x', 'Size parameter x = 2πr/λ', '', 'cool'], ['reg', 'Region', '', ''], ['sig', 'Radar cross section', '', 'fuel'], ['dbsm', 'In dBsm', '', 'hot'], ['geo', 'Geometric area πr²', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function upd() {
    const x = 2 * Math.PI * st.r * st.f / EM.C.c, q = mie(x), sig = q * Math.PI * st.r * st.r;
    ro.set('x', EM.num(x, 3)); ro.set('reg', x < .5 ? 'Rayleigh (tiny)' : x < 10 ? 'resonance' : 'optical (big)'); ro.set('sig', EM.num(sig, 3), 'm²'); ro.set('dbsm', EM.fixed(10 * Math.log10(sig), 1), 'dBsm'); ro.set('geo', EM.num(Math.PI * st.r * st.r, 3), 'm²');
    info.innerHTML = '<h6>' + (x < .5 ? 'Small compared with the wavelength' : x < 10 ? 'Resonance region' : 'Optical region') + '</h6>' + (x < .5 ? 'A sphere much smaller than λ scatters only as $x^4$: halve the wavelength and the echo grows 16×. This is why raindrops are seen by 3 cm weather radar but not by 10 cm radar nearly as well, and why weather radars at W-band see cloud droplets.' : x < 10 ? 'Creeping waves travelling around the sphere interfere with the specular echo: ripples above and below πr². Be careful: a target in this regime can fluctuate by ±5 dB with a small change in frequency.' : 'Echo equals the projected area πr² (a sphere reflects the same in every direction, so a large sphere has a small RCS compared with the flat plate of the same size: see the next widget). The sphere is the standard calibration target.');
    if (window.renderMath) window.renderMath(info); S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 62, y: 14, w: w - 80, h: h - 56 }, { xmin: .03, xmax: 60, xlog: true, ymin: 1e-6, ymax: 10, ylog: true, xlabel: 'size parameter  x = 2πr / λ', ylabel: 'σ / πr²', yfmt: v => EM.num(v, 1) });
    for (const [a, b, n, cl] of [[.03, .5, 'RAYLEIGH', 'bad'], [.5, 10, 'RESONANCE', 'warn'], [10, 60, 'OPTICAL', 'ok']]) { c.fillStyle = EM.alpha(EM.col(cl), .1); c.fillRect(P.X(a), P.box.y, P.X(b) - P.X(a), P.box.h); EM.label(c, n, (P.X(a) + P.X(b)) / 2, P.box.y + 12, EM.col(cl), { size: 11, align: 'center', weight: '800' }); }
    P.grid(); const xs = [], ys = []; for (let i = 0; i <= 260; i++) { const x = .03 * Math.pow(2000, i / 260); xs.push(x); ys.push(mie(x)); } P.line(xs, ys, EM.col('acc3'), 2.6);
    P.fn(x => 9 * Math.pow(x, 4), EM.alpha(EM.col('bad'), .8), 1.5, 60, [5, 4]); P.hline(1, EM.alpha(EM.col('ok'), .7), 1.2, [5, 4]);
    EM.label(c, '9x⁴ (Rayleigh)', P.X(.12), P.Y(9 * Math.pow(.12, 4)) - 12, EM.col('bad'), { size: 10 }); EM.label(c, 'σ = πr² (geometric)', P.X(25), P.Y(1) - 10, EM.col('ok'), { size: 10 }); EM.label(c, 'peak 3.6 at x ≈ 1', P.X(1) + 8, P.Y(3.64) - 4, EM.col('warn'), { size: 10 });
    const x = 2 * Math.PI * st.r * st.f / EM.C.c; if (x > .03 && x < 60) P.dot(x, Math.max(1e-6, mie(x)), EM.col('acc2'), 7);
  };
  upd();
});
