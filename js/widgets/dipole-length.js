/* dipole-length — thin centre-fed dipole of any length: current distribution, pattern, directivity, radiation resistance (exact formulas) */
EM.register('dipole-length', function (el) {
  const W = EM.widget(el, { title: 'A real dipole: how length changes everything', badge: 'Try it',
    note: 'Current on a thin dipole is $I(z)=I_m\\sin k(L/2-|z|)$. The far field is $F(\\theta)=\\dfrac{\\cos(\\frac{kL}{2}\\cos\\theta)-\\cos\\frac{kL}{2}}{\\sin\\theta}$. Radiation resistance and directivity are from numerical integration of $F^2$. Try $L=\\lambda/2$ (73 Ω, 2.15 dBi), then keep stretching.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const st = { L: .5 };
  const eta = EM.C.eta0;
  const sl = EM.slider(side, { label: 'Length L in wavelengths', min: .02, max: 3, step: .01, value: .5, fmt: v => v.toFixed(2) + ' λ', onInput: v => { st.L = v; upd(); } });
  const pre = EM.h('div', { class: 'btn-row' }); side.append(pre);
  [['Short (λ/20)', .05], ['Half-wave', .5], ['Full-wave', 1], ['1.25 λ', 1.25], ['3λ/2', 1.5], ['2 λ', 2]].forEach(([t, v]) => EM.btn(pre, t, () => { sl.set(v); }, 'small'));
  const fq = EM.slider(side, { label: 'Frequency (to see the physical size)', min: 1e6, max: 1e10, log: true, value: 1e8, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } }); st.f = 1e8;
  const ro = EM.readouts(side, [['len', 'Physical length', '', 'cool'], ['D', 'Directivity', '', 'fuel'], ['hp', 'Beamwidth (E-plane)', '', ''], ['Rr', 'Radiation resistance', '', 'hot'], ['Rin', 'Feed-point resistance', '', 'hot'], ['lobes', 'Lobes', '', '']]);
  const msg = EM.h('div', { class: 'info-box' }); side.append(msg);
  const F = (th, kL) => { const s = Math.sin(th); if (Math.abs(s) < 1e-6) return 0; return (Math.cos(kL / 2 * Math.cos(th)) - Math.cos(kL / 2)) / s; };
  function upd() {
    const kL = 2 * Math.PI * st.L, f = th => F(th, kL);
    let ints = 0, mx = 0, tm = Math.PI / 2; const n = 2000; for (let i = 0; i < n; i++) { const th = (i + .5) / n * Math.PI, v = f(th); ints += v * v * Math.sin(th); if (Math.abs(v) > mx) { mx = Math.abs(v); tm = th; } } ints *= Math.PI / n;
    const Rm = eta / (2 * Math.PI) * ints, D = 2 * mx * mx / ints, sk = Math.sin(kL / 2), Rin = Math.abs(sk) < .02 ? Infinity : Rm / (sk * sk);
    const hp = EM.hpbw(f, tm, Math.PI / 2);
    ro.set('len', EM.len(st.L * EM.C.c / st.f)); ro.set('D', EM.num(D, 3) + ' (' + EM.fixed(10 * Math.log10(D), 2) + ' dBi)'); ro.set('hp', hp.toFixed(0) + '°');
    ro.set('Rr', EM.num(Rm, 3), 'Ω (at I_max)'); ro.set('Rin', Rin > 5000 ? 'very high (≫ 1 kΩ)' : EM.num(Rin, 3), Rin > 5000 ? '' : 'Ω');
    let lobes = 0, prev = 0; for (let i = 1; i < 721; i++) { const a = Math.abs(f(i / 720 * Math.PI)), b = Math.abs(f((i - 1) / 720 * Math.PI)), c2 = Math.abs(f((i + 1) / 720 * Math.PI)); if (a > b && a >= c2 && a > .05 * mx) lobes++; }
    ro.set('lobes', String(lobes));
    msg.innerHTML = st.L < .12 ? '<h6>Short dipole</h6>Nearly a Hertzian dipole: $\\sin\\theta$ pattern, 1.5 (1.76 dBi), very low radiation resistance $\\approx20\\pi^2(L/\\lambda)^2$ and a large capacitive reactance: hard to match, poor efficiency.' : Math.abs(st.L - .5) < .06 ? '<h6>Half-wave dipole</h6>The reference antenna: 73 Ω at the centre (close to 50–75 Ω coax), 2.15 dBi, 78° beamwidth, and resonant (no net reactance).' : st.L > 1.15 ? '<h6>Long dipole</h6>Extra half-wavelengths of current in opposite phase tilt the main lobes away from broadside toward the wire axis, and sidelobes appear. Not usually wanted: that is why “long-wire” antennas are special-purpose.' : '<h6>Between</h6>A full-wave dipole is slightly more directive (≈ 3.8 dBi) but the feed point is a current <em>minimum</em>, so the feed resistance is very high.';
    if (window.renderMath) window.renderMath(msg); st.tm = tm; S.redraw();
  }
  S.draw = (c, w, h) => {
    const kL = 2 * Math.PI * st.L, ph = h * .88;
    // left: wire + current
    const wx = w * .17, top = h * .08, bot = h * .92, len = Math.min(bot - top, st.L * (h * .5) + 20);
    const cy = (top + bot) / 2, half = Math.min((bot - top) / 2, st.L * h * .3);
    c.strokeStyle = EM.col('acc3'); c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(wx, cy - half); c.lineTo(wx, cy - 4); c.moveTo(wx, cy + 4); c.lineTo(wx, cy + half); c.stroke();
    c.fillStyle = EM.col('ok'); c.beginPath(); c.arc(wx, cy, 4, 0, 7); c.fill();
    c.strokeStyle = EM.col('acc'); c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 120; i++) { const z = -1 + 2 * i / 120, I = Math.sin(kL / 2 * (1 - Math.abs(z))), x = wx + I * 38, y = cy + z * half; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    EM.label(c, 'I(z)', wx + 42, cy - half + 4, EM.col('acc'), { size: 11 }); EM.label(c, 'feed', wx + 8, cy + 14, EM.col('ok'), { size: 10 });
    c.strokeStyle = EM.alpha(EM.col('muted'), .5); c.setLineDash([3, 4]); c.beginPath(); c.moveTo(wx, cy - half); c.lineTo(wx + 80, cy - half); c.moveTo(wx, cy + half); c.lineTo(wx + 80, cy + half); c.stroke(); c.setLineDash([]); EM.label(c, 'L = ' + st.L.toFixed(2) + ' λ', wx + 40, cy + half + 14, EM.col('text-2'), { size: 11, align: 'center' });
    // polar pattern
    const R = Math.min(h * .42, (w - wx - 140) / 2), cx = wx + 120 + R;
    EM.polarGrid(c, cx, h / 2, R, { dbMin: -30, step: 10, angStep: 30 });
    const mx = Math.max(1e-9, ...Array.from({ length: 361 }, (_, i) => Math.abs(F(i / 360 * Math.PI, kL))));
    EM.polarLine(c, cx, h / 2, R, th => { const t = Math.abs(((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)); const tt = t > Math.PI ? 2 * Math.PI - t : t; return F(tt, kL) / mx; }, { dbMin: -30, color: EM.col('acc2'), width: 2.6, fill: EM.alpha(EM.col('acc2'), .12) });
    EM.label(c, 'E-plane pattern (wire is vertical)', cx, h - 8, EM.col('muted'), { size: 11, align: 'center', weight: '500' });
  };
  upd();
});
