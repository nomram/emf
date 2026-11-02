/* null-steer — adaptive receive array: put deep nulls on interfering directions while keeping the wanted beam (MVDR / minimum-variance weights) */
EM.register('null-steer', function (el) {
  const W = EM.widget(el, { title: 'Adaptive nulling: listen to one direction, ignore the others', badge: 'Try it',
    note: 'A receive array can compute its weights from the interference it measures: $\mathbf w=\dfrac{\mathbf R^{-1}\mathbf a_s}{\mathbf a_s^H\mathbf R^{-1}\mathbf a_s}$ (minimum-variance, “MVDR”), where $\mathbf R$ is the covariance of noise plus interferers and $\mathbf a_s$ the steering vector of the wanted signal. It keeps unit gain toward the signal and <b>places nulls</b> on interferers. $N$ elements can null up to $N-1$ directions. This is the principle behind anti-interference GPS antennas, radar sidelobe cancellers and 5G receivers.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const cx = EM.cx, st = { N: 12, ths: 0, snr: -10, J: [{ on: true, th: 35, p: 40 }, { on: true, th: -50, p: 35 }, { on: false, th: 15, p: 45 }], adaptive: true };
  EM.slider(side, { label: 'Elements N', min: 4, max: 20, step: 1, value: 12, onInput: v => { st.N = v; upd(); } });
  EM.slider(side, { label: 'Wanted signal direction', min: -60, max: 60, step: 1, value: 0, unit: '°', onInput: v => { st.ths = v; upd(); } });
  EM.slider(side, { label: 'Wanted signal strength per element (vs noise)', min: -30, max: 10, step: 1, value: -10, unit: 'dB', onInput: v => { st.snr = v; upd(); } });
  st.J.forEach((j, i) => { EM.toggle(side, { label: '<b>Interferer ' + (i + 1) + '</b>', checked: j.on, onChange: v => { j.on = v; upd(); } }); EM.slider(side, { label: 'direction', min: -85, max: 85, step: 1, value: j.th, unit: '°', onInput: v => { j.th = v; upd(); } }); EM.slider(side, { label: 'strength vs noise (per element)', min: 10, max: 70, step: 1, value: j.p, unit: 'dB', onInput: v => { j.p = v; upd(); } }); });
  const ro = EM.readouts(side, [['s0', 'Output SINR, ordinary beam', '', 'bad'], ['s1', 'Output SINR, adaptive', '', 'good'], ['imp', 'Improvement', '', 'fuel'], ['null', 'Null depth at interferers', '', 'hot']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const a = th => { const t = EM.rad(th), v = []; for (let n = 0; n < st.N; n++) v.push(cx.expj(Math.PI * (n - (st.N - 1) / 2) * Math.sin(t))); return v; };
  const inner = (x, y) => { let r = [0, 0]; for (let i = 0; i < x.length; i++) r = cx.add(r, cx.mul(cx.conj(x[i]), y[i])); return r; };
  function solve(Rm, b) {      // Gaussian elimination, complex
    const n = b.length, A = Rm.map((r, i) => r.concat([b[i]]));
    for (let i = 0; i < n; i++) { let p = i; for (let k = i + 1; k < n; k++) if (cx.abs(A[k][i]) > cx.abs(A[p][i])) p = k; [A[i], A[p]] = [A[p], A[i]]; for (let k = i + 1; k < n; k++) { const f = cx.div(A[k][i], A[i][i]); for (let j = i; j <= n; j++) A[k][j] = cx.sub(A[k][j], cx.mul(f, A[i][j])); } }
    const x = new Array(n); for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s = cx.sub(s, cx.mul(A[i][j], x[j])); x[i] = cx.div(s, A[i][i]); } return x;
  }
  function compute() {
    const N = st.N, as = a(st.ths), act = st.J.filter(j => j.on);
    const R = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => [i === j ? 1 : 0, 0]));
    act.forEach(j => { const v = a(j.th), p = Math.pow(10, j.p / 10); for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) R[r][c] = cx.add(R[r][c], cx.sc(cx.mul(v[r], cx.conj(v[c])), p)); });
    const y = solve(R, as), den = inner(as, y), w = y.map(v => cx.div(v, den)), wc = as.map(v => cx.sc(v, 1 / N));
    const sinr = ww => { const sg = Math.pow(10, st.snr / 10) * Math.pow(cx.abs(inner(ww, as)), 2); let q = [0, 0]; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) q = cx.add(q, cx.mul(cx.mul(cx.conj(ww[r]), R[r][c]), ww[c])); return sg / q[0]; };
    return { w, wc, sinr0: sinr(wc), sinr1: sinr(w), act };
  }
  function upd() {
    const k = compute(), s0 = 10 * Math.log10(k.sinr0), s1 = 10 * Math.log10(k.sinr1); st.k = k;
    const pw = (ww, th) => 10 * Math.log10(Math.max(1e-12, Math.pow(cx.abs(inner(ww, a(th))), 2) / Math.pow(cx.abs(inner(ww, a(st.ths))), 2)));
    ro.set('s0', EM.fixed(s0, 1), 'dB'); ro.set('s1', EM.fixed(s1, 1), 'dB'); ro.set('imp', EM.fixed(s1 - s0, 1), 'dB'); ro.set('null', k.act.length ? k.act.map(j => EM.fixed(pw(k.w, j.th), 0) + ' dB').join(', ') : '—');
    info.innerHTML = '<h6>' + (s1 - s0 > 20 ? 'Interference removed' : 'Little to remove') + '</h6>The ordinary (uniform) beam has sidelobes around −13 dB: a strong interferer in a sidelobe still dominates the output. The adaptive weights hold the wanted direction at 0 dB and put a deep null on each interferer, restoring the signal-to-noise ratio. Limits: needs more elements than interferers; <b>an interferer very close to the wanted direction</b> (within a beamwidth) can’t be nulled without also cutting the signal (try moving one to the same angle); adaptation takes time and snapshots of data.';
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const k = st.k || compute(), P = EM.plot(c, { x: 54, y: 14, w: w - 70, h: h - 50 }, { xmin: -90, xmax: 90, ymin: -80, ymax: 5, xlabel: 'direction (°)', ylabel: 'array response (dB)', xticks: [-90, -60, -30, 0, 30, 60, 90], yticks: [-80, -60, -40, -20, 0] });
    P.grid(); const pat = (ww, th) => 20 * Math.log10(Math.max(1e-6, cx.abs(inner(ww, a(th))) / Math.max(1e-9, cx.abs(inner(ww, a(st.ths))))));
    P.clip(); P.fn(th => Math.max(-80, pat(k.wc, th)), EM.alpha(EM.col('muted'), .95), 1.8, 500, [5, 4]); P.fn(th => Math.max(-80, pat(k.w, th)), EM.col('acc3'), 2.8, 700); P.unclip();
    P.vline(st.ths, EM.col('ok'), 2, [6, 4]); EM.label(c, 'wanted', P.X(st.ths) + 4, P.box.y + 12, EM.col('ok'), { size: 11, weight: '700' });
    k.act.forEach((j, i) => { P.vline(j.th, EM.col('bad'), 2); EM.label(c, 'interferer', P.X(j.th) + 3, P.box.y + 26 + i * 14, EM.col('bad'), { size: 10 }); });
    EM.label(c, 'ordinary beam (grey dashed)   adaptive (yellow)', P.box.x + 8, P.box.y + P.box.h - 10, EM.col('text-2'), { size: 10, weight: '500' });
  };
  upd();
});
