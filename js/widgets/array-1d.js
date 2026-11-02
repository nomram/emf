/* array-1d — uniform/tapered linear array: pattern vs angle, steering, grating lobes (visible region), beamwidth, sidelobes, directivity */
EM.register('array-1d', function (el) {
  const W = EM.widget(el, { title: 'A row of antennas: build the beam yourself', badge: 'Try it',
    note: 'Pattern = (element pattern) × <b>array factor</b> $AF=\\sum_n w_n e^{jnkd(\\sin\\theta-\\sin\\theta_0)}$. The phases $-nkd\\sin\\theta_0$ (set electronically by phase shifters) steer the main beam to $\\theta_0$. The top panel plots $AF$ against $u=\\sin\\theta$: <b>only $-1\\le u\\le1$ is real space</b> (the visible region); if the spacing is more than $\\lambda/2$, copies of the main beam (<b>grating lobes</b>) enter the visible region.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .4 }), B = EM.canvas(main, { aspect: .6 }); B.cv.style.marginTop = '10px';
  const st = { N: 8, d: .5, th0: 0, taper: 'uni', elem: true };
  EM.slider(side, { label: 'Number of elements N', min: 2, max: 64, step: 1, value: 8, onInput: v => { st.N = v; upd(); } });
  EM.slider(side, { label: 'Spacing d', min: .2, max: 2, step: .01, value: .5, fmt: v => v.toFixed(2) + ' λ', onInput: v => { st.d = v; upd(); } });
  EM.slider(side, { label: 'Steering angle θ₀ from broadside', min: -80, max: 80, step: .5, value: 0, unit: '°', onInput: v => { st.th0 = v; upd(); } });
  EM.seg(side, [['uni', 'Uniform'], ['ham', 'Hamming'], ['cheb', 'Low sidelobe (−30 dB)'], ['bin', 'Binomial']], 'uni', v => { st.taper = v; upd(); });
  EM.toggle(side, { label: 'Include a realistic element pattern (cos θ)', checked: true, onChange: v => { st.elem = v; upd(); } });
  const ro = EM.readouts(side, [['hp', 'Beamwidth (−3 dB)', '', 'cool'], ['sll', 'Highest sidelobe', '', 'hot'], ['D', 'Directivity', '', 'fuel'], ['gl', 'Grating lobes', '', 'bad'], ['scan', 'Scan loss', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function wts() {
    const N = st.N, w = []; for (let n = 0; n < N; n++) { const x = (n - (N - 1) / 2) / ((N - 1) / 2 || 1); let v = 1; if (st.taper === 'ham') v = .54 + .46 * Math.cos(Math.PI * x / 1.0 * .98); else if (st.taper === 'cheb') v = Math.pow(Math.cos(Math.PI * x / 2 * .98), 1.9) * .92 + .08 * 0; else if (st.taper === 'bin') { v = 1; } w.push(v); }
    if (st.taper === 'bin') { let c = 1; for (let n = 0; n < N; n++) { w[n] = c; c = c * (N - 1 - n) / (n + 1); } }
    return w;
  }
  const afAmp = (u, w) => { const k = 2 * Math.PI * st.d, u0 = Math.sin(EM.rad(st.th0)); let re = 0, im = 0; for (let n = 0; n < w.length; n++) { const ph = k * (n - (w.length - 1) / 2) * (u - u0); re += w[n] * Math.cos(ph); im += w[n] * Math.sin(ph); } return Math.hypot(re, im); };
  function upd() {
    const w = wts(), sum = w.reduce((a, b) => a + b, 0), N = w.length, k = 2 * Math.PI * st.d, u0 = Math.sin(EM.rad(st.th0));
    const el = th => st.elem ? Math.max(0, Math.cos(th)) : 1, pat = a => afAmp(Math.sin(a), w) / sum * el(a);
    let mx = 0, am = 0; for (let i = 0; i <= 3600; i++) { const a = EM.rad(-90 + i / 20), v = pat(a); if (v > mx) { mx = v; am = a; } }
    const hp = EM.hpbw(pat, am, Math.PI / 2); let sll = -99, sl = 0, ex = 0; { let state = 0, prev = 0, going = 0; const tn = []; for (let i = 0; i <= 3600; i++) { const a = EM.rad(-90 + i / 20), v = pat(a); tn.push(v); } for (let i = 1; i < tn.length - 1; i++) if (tn[i] > tn[i - 1] && tn[i] >= tn[i + 1]) { const ang = -90 + i / 20; if (Math.abs(ang - EM.deg(am)) > hp * .9) sl = Math.max(sl, tn[i]); } if (sl > 0) sll = 20 * Math.log10(sl / mx); }
    let den = 0; for (let m = 0; m < N; m++) for (let n = 0; n < N; n++) { const x = k * Math.abs(m - n); den += w[m] * w[n] * (x < 1e-9 ? 1 : Math.sin(x) / x); }
    const D = sum * sum / den, gl = st.d * (1 + Math.abs(u0)) > 1.0001, glAng = gl ? (() => { const arr = []; for (const s of [-1, 1]) { const u = u0 + s / st.d; if (Math.abs(u) <= 1) arr.push(EM.deg(Math.asin(u)).toFixed(0) + '°'); } return arr.join(', '); })() : '';
    ro.set('hp', hp.toFixed(1) + '°'); ro.set('sll', EM.fixed(sll, 1) + ' dB'); ro.set('D', EM.fixed(10 * Math.log10(D), 1) + ' dBi (iso. elements)'); ro.set('gl', gl ? 'YES at ' + glAng : 'none'); ro.set('scan', st.elem ? EM.fixed(10 * Math.log10(Math.max(1e-3, Math.cos(EM.rad(st.th0)))), 1) + ' dB' : '0 dB (isotropic elements)');
    info.innerHTML = '<h6>' + (gl ? 'Grating lobes!' : 'Clean beam') + '</h6>' + (gl ? 'With $d=' + st.d.toFixed(2) + '\\lambda$ and the beam at ' + st.th0 + '°, the visible region contains a second main lobe at ' + glAng + ': half the power goes the wrong way, and the radar sees a ghost target. Rule: $d\\le\\lambda/(1+|\\sin\\theta_0|)$, which is $\\lambda/2$ for full ±90° scan; electronic scanning arrays use λ/2.' : 'Beamwidth ≈ $0.886\\lambda/(Nd\\cos\\theta_0)$ rad: more elements (a longer array) narrows the beam. Steer the beam: it broadens by $1/\\cos\\theta_0$ and the gain falls by $\\cos\\theta_0$ (scan loss), because the array looks smaller from the side. Tapering lowers sidelobes at the price of a wider beam and lower directivity.');
    if (window.renderMath) window.renderMath(info); st.w = w; st.sum = sum; A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const wt = st.w || wts(), sum = wt.reduce((a, b) => a + b, 0), P = EM.plot(c, { x: 52, y: 14, w: w - 66, h: h - 46 }, { xmin: -2.2, xmax: 2.2, ymin: -50, ymax: 3, xlabel: 'u = sin θ (the “direction cosine”): real space is −1 … +1', ylabel: 'dB', yticks: [-40, -20, 0], xticks: [-2, -1, 0, 1, 2], xfmt: v => v });
    c.fillStyle = EM.alpha(EM.col('ok'), .08); c.fillRect(P.X(-1), P.box.y, P.X(1) - P.X(-1), P.box.h); P.grid(); P.vline(-1, EM.col('ok'), 1.5); P.vline(1, EM.col('ok'), 1.5);
    P.clip(); P.fn(u => 20 * Math.log10(Math.max(1e-3, afAmp(u, wt) / sum)), EM.alpha(EM.col('muted'), .9), 1.4, 800); c.save(); c.beginPath(); c.rect(P.X(-1), P.box.y, P.X(1) - P.X(-1), P.box.h); c.clip(); P.fn(u => 20 * Math.log10(Math.max(1e-3, afAmp(u, wt) / sum)), EM.col('acc3'), 2.8, 800); c.restore(); P.unclip();
    EM.label(c, 'visible region (real directions)', P.X(0), P.box.y + 12, EM.col('ok'), { size: 11, align: 'center', weight: '700' }); EM.label(c, 'invisible: periodic copies', P.X(-1.6), P.box.y + 12, EM.col('muted'), { size: 10, align: 'center' }); EM.label(c, 'invisible', P.X(1.6), P.box.y + 12, EM.col('muted'), { size: 10, align: 'center' });
  };
  B.draw = (c, w, h) => {
    const wt = st.w || wts(), sum = wt.reduce((a, b) => a + b, 0), R = Math.min(h * .44, w * .4), cx = w / 2, cy = h * .72, el = th => st.elem ? Math.max(0, Math.cos(th)) : 1;
    EM.polarGrid(c, cx, cy, R, { dbMin: -40, step: 10, angStep: 30, noLabels: false });
    c.save(); c.beginPath(); c.rect(0, 0, w, cy + 2); c.clip();
    EM.polarLine(c, cx, cy, R, th => { const t = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); const tt = t > Math.PI ? t - 2 * Math.PI : t; return Math.abs(tt) > Math.PI / 2 ? 1e-6 : afAmp(Math.sin(tt), wt) / sum * el(tt); }, { dbMin: -40, color: EM.col('acc2'), width: 2.6, fill: EM.alpha(EM.col('acc2'), .14), n: 720 });
    c.restore(); c.fillStyle = EM.col('acc3'); const d = Math.min(14, (w * .5) / st.N); for (let n = 0; n < st.N; n++) c.fillRect(cx + (n - (st.N - 1) / 2) * d - 3, cy + 4, 6, 6);
    EM.label(c, 'polar pattern (dB), 0° = broadside; array at the bottom', cx, h - 6, EM.col('muted'), { size: 10, align: 'center', weight: '500' });
  };
  upd();
});
