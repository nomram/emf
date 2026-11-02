/* transmission-line — reflections, standing waves, VSWR and the Smith chart for a lossless line terminated in Z_L */
EM.register('transmission-line', function (el) {
  const W = EM.widget(el, { title: 'Reflections on a line: standing waves and the Smith chart', badge: 'Try it',
    note: 'A load that is not equal to the line’s $Z_0$ <b>reflects</b> part of the wave. Forward and reflected waves add into a <b>standing wave</b> whose peak/valley ratio is the VSWR. On the Smith chart, the load is a point; moving toward the generator rotates it clockwise around the centre at constant radius $|\\Gamma|$ (one full turn per half wavelength).' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .42 });
  const B = EM.canvas(main, { aspect: .8 }); B.cv.style.marginTop = '12px'; B.cv.style.maxWidth = '420px'; B.cv.style.marginInline = 'auto';
  const cx = EM.cx;
  const st = { Z0: 50, R: 50, X: 0, l: .35, t: 0 };
  const PRE = [['Matched load 50 Ω', 50, 0], ['Half-wave dipole ≈ 73 + j0', 73, 0], ['Folded dipole ≈ 300 Ω', 300, 0], ['Short circuit', .5, 0], ['Open circuit', 5000, 0], ['Inductive 50 + j50', 50, 50], ['Capacitive 50 − j50', 50, -50], ['Antenna too short: 20 − j60', 20, -60], ['25 Ω', 25, 0]];
  const pre = EM.select(side, { label: 'Load presets', options: PRE.map((p, i) => [i, p[0]]), value: 0, onChange: v => { const p = PRE[+v]; st.R = p[1]; st.X = p[2]; Rs.set(st.R, true); Xs.set(st.X, true); upd(); } });
  const Z0s = EM.seg(side, [[50, '50 Ω line'], [75, '75 Ω line'], [300, '300 Ω line']], 50, v => { st.Z0 = +v; upd(); });
  const Rs = EM.slider(side, { label: 'Load resistance R', min: .5, max: 5000, log: true, value: 50, fmt: v => EM.num(v, 3) + ' Ω', onInput: v => { st.R = v; upd(); } });
  const Xs = EM.slider(side, { label: 'Load reactance X (+inductive, −capacitive)', min: -300, max: 300, step: 1, value: 0, fmt: v => (v >= 0 ? '+' : '−') + Math.abs(v) + ' Ω', onInput: v => { st.X = v; upd(); } });
  EM.slider(side, { label: 'Line length from load', min: 0, max: 1.5, step: .005, value: .35, fmt: v => v.toFixed(3) + ' λ', onInput: v => { st.l = v; upd(); } });
  const ro = EM.readouts(side, [['G', '|Γ| at load', '', 'cool'], ['swr', 'VSWR', '', 'hot'], ['rl', 'Return loss', '', 'fuel'], ['ml', 'Mismatch loss', '', ''], ['refl', 'Power reflected', '', 'bad'], ['zin', 'Z seen at line input', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function gam() { const z = cx.div([st.R, st.X], [st.Z0, 0]); return cx.div(cx.sub(z, [1, 0]), cx.add(z, [1, 0])); }
  function upd() {
    const G = gam(), g = cx.abs(G), swr = g >= .9999 ? Infinity : (1 + g) / (1 - g), Gin = cx.mul(G, cx.expj(-4 * Math.PI * st.l)), zin = cx.div(cx.add([1, 0], Gin), cx.sub([1, 0], Gin));
    ro.set('G', g.toFixed(3) + ' ∠' + EM.deg(cx.arg(G)).toFixed(0) + '°'); ro.set('swr', swr > 999 ? '∞' : swr.toFixed(2) + ' : 1'); ro.set('rl', g < 1e-4 ? '> 80 dB' : EM.fixed(-20 * Math.log10(g), 1), g < 1e-4 ? '' : 'dB'); ro.set('ml', EM.fixed(-10 * Math.log10(Math.max(1e-9, 1 - g * g)), 2), 'dB'); ro.set('refl', (g * g * 100).toFixed(1), '%');
    ro.set('zin', EM.num(zin[0] * st.Z0, 3) + (zin[1] < 0 ? ' − j' : ' + j') + EM.num(Math.abs(zin[1]) * st.Z0, 3), 'Ω');
    info.innerHTML = g < .02 ? '<h6>Matched</h6>No reflection: a pure travelling wave, flat voltage along the line, all power delivered to the load.' : swr < 2 ? '<h6>Acceptable</h6>VSWR below 2 : 1 (return loss > 9.5 dB, under 11 % of the power reflected) is a common specification for antennas.' : swr < 4 ? '<h6>Poor</h6>Transmitters often fold back power at VSWR above 2–3 to protect the output stage, and reflected power heats the line.' : '<h6>Bad</h6>Most of the wave is reflected. The standing wave has voltage peaks ' + (swr > 99 ? 'many' : swr.toFixed(0)) + '× the valleys: over-voltage can damage the transmitter and the cable.';
    A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const G = gam(), g = cx.abs(G), T = st.l, mid = h / 2, A0 = h * .3, X = x => 30 + x / T * (w - 60);        // x runs 0 (generator) .. T (load)
    c.fillStyle = EM.alpha(EM.col('panel-3'), .6); c.fillRect(30, h - 18, w - 60, 4);
    // envelope
    const env = d => Math.sqrt(1 + g * g + 2 * g * Math.cos(cx.arg(G) - 4 * Math.PI * d));           // d = distance from load (λ)
    c.strokeStyle = EM.alpha(EM.col('acc3'), .7); c.lineWidth = 1.5; c.setLineDash([5, 4]);
    for (const sgn of [1, -1]) { c.beginPath(); for (let i = 0; i <= 300; i++) { const x = T * i / 300, d = T - x, y = mid - sgn * env(d) / (1 + g) * A0 * 1.0; i ? c.lineTo(X(x), y) : c.moveTo(X(x), y); } c.stroke(); }
    c.setLineDash([]);
    // instantaneous voltage
    const ph = st.t * 3; c.lineWidth = 2.6; c.strokeStyle = EM.col('acc'); c.beginPath();
    for (let i = 0; i <= 600; i++) { const x = T * i / 600, d = T - x, kk = 2 * Math.PI, v = Math.cos(ph - kk * x) + g * Math.cos(ph + kk * x + cx.arg(G) - kk * T * 2 + kk * 0), y = mid - v / (1 + g) * A0; i ? c.lineTo(X(x), y) : c.moveTo(X(x), y); } c.stroke();
    // fwd and refl hint
    c.lineWidth = 1; c.strokeStyle = EM.alpha(EM.col('acc2'), .5); c.beginPath(); for (let i = 0; i <= 600; i++) { const x = T * i / 600, v = Math.cos(ph - 2 * Math.PI * x), y = mid - v / (1 + g) * A0 * .5; i ? c.lineTo(X(x), y) : c.moveTo(X(x), y); } c.stroke();
    EM.label(c, 'generator', 30, h - 28, EM.col('muted'), { size: 11 }); EM.label(c, 'load Z_L', w - 30, h - 28, EM.col('acc2'), { size: 11, align: 'right', weight: '700' });
    c.fillStyle = EM.col('acc2'); c.fillRect(w - 32, mid - 14, 8, 28);
    EM.label(c, 'voltage on the line (blue), forward wave alone (orange), standing-wave envelope (dashed)', 12, 16, EM.col('muted'), { size: 11, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const R = Math.min(w, h) * .45, ox = w / 2, oy = h / 2, P = (gr, gi) => [ox + gr * R, oy - gi * R];
    c.fillStyle = EM.col('bg-2'); c.beginPath(); c.arc(ox, oy, R, 0, 7); c.fill();
    c.save(); c.beginPath(); c.arc(ox, oy, R, 0, 7); c.clip(); c.lineWidth = 1;
    for (const r of [0, .2, .5, 1, 2, 5]) { c.strokeStyle = r === 1 ? EM.alpha(EM.col('text-2'), .7) : EM.col('line-2'); c.beginPath(); c.arc(ox + r / (1 + r) * R, oy, R / (1 + r), 0, 7); c.stroke(); }
    for (const x of [.2, .5, 1, 2, 5]) for (const s of [1, -1]) { c.strokeStyle = EM.col('line-2'); c.beginPath(); c.arc(ox + R, oy - s * R / x, R / x, 0, 7); c.stroke(); }
    c.strokeStyle = EM.col('line-2'); c.beginPath(); c.moveTo(ox - R, oy); c.lineTo(ox + R, oy); c.stroke(); c.restore();
    c.strokeStyle = EM.col('text-2'); c.lineWidth = 1.5; c.beginPath(); c.arc(ox, oy, R, 0, 7); c.stroke();
    c.fillStyle = EM.col('muted'); c.font = EM.font(10); c.textAlign = 'center'; c.textBaseline = 'top'; for (const r of [.2, .5, 1, 2, 5]) c.fillText(r + '', ox + (r - 1) / (r + 1) * R, oy + 3); c.fillText('0', ox - R + 6, oy + 3); c.fillText('∞', ox + R - 6, oy + 3);
    EM.label(c, 'inductive (+jX)', ox, oy - R - 10, EM.col('muted'), { size: 10, align: 'center' }); EM.label(c, 'capacitive (−jX)', ox, oy + R + 12, EM.col('muted'), { size: 10, align: 'center' });
    const G = gam(), g = cx.abs(G); c.setLineDash([4, 4]); c.strokeStyle = EM.alpha(EM.col('acc3'), .9); c.lineWidth = 1.5; c.beginPath(); c.arc(ox, oy, g * R, 0, 7); c.stroke(); c.setLineDash([]);
    // locus of impedance along the line
    c.strokeStyle = EM.col('acc'); c.lineWidth = 2.5; c.beginPath(); for (let i = 0; i <= 120; i++) { const d = st.l * i / 120, Gd = cx.mul(G, cx.expj(-4 * Math.PI * d)); const p = P(Gd[0], Gd[1]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    const pl = P(G[0], G[1]); c.fillStyle = EM.col('acc2'); c.beginPath(); c.arc(pl[0], pl[1], 6, 0, 7); c.fill(); EM.label(c, 'load', pl[0] + 9, pl[1] - 9, EM.col('acc2'), { size: 11, weight: '700' });
    const Gi = cx.mul(G, cx.expj(-4 * Math.PI * st.l)), pi = P(Gi[0], Gi[1]); c.fillStyle = EM.col('ok'); c.beginPath(); c.arc(pi[0], pi[1], 6, 0, 7); c.fill(); EM.label(c, 'input', pi[0] + 9, pi[1] + 11, EM.col('ok'), { size: 11, weight: '700' });
    c.fillStyle = EM.col('text'); c.beginPath(); c.arc(ox, oy, 3, 0, 7); c.fill();
  };
  EM.loop(el, (t, dt) => { st.t += dt; A.redraw(); });
  upd();
});
