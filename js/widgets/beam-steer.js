/* beam-steer — how phase shifters and true-time-delay lines combine the element signals; beam squint with frequency */
EM.register('beam-steer', function (el) {
  const W = EM.widget(el, { title: 'Phasors and delays: how the beam gets steered', badge: 'Try it',
    note: 'A plane wave from angle $\\theta_0$ reaches element $n$ with a delay $\\tau_n=n\\,d\\sin\\theta_0/c$. The receiver <b>cancels those delays</b> (with phase shifters or true-time-delay lines) and adds the results: they line up in phase only for the intended direction. A <b>phase shifter</b> fixes the phase at the design frequency, so the beam <b>squints</b> as the frequency changes; <b>true-time delay</b> stays pointed at any frequency (needed for very wide bandwidth).' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 }), B = EM.canvas(main, { aspect: .38 }); B.cv.style.marginTop = '10px';
  const st = { N: 8, th: 30, df: 0, mode: 'phase', t: 0 };
  EM.slider(side, { label: 'Direction of the arriving wave', min: -70, max: 70, step: 1, value: 30, unit: '°', onInput: v => { st.th = v; upd(); } });
  EM.slider(side, { label: 'Frequency offset from the design frequency', min: -30, max: 30, step: 1, value: 0, fmt: v => (v > 0 ? '+' : '') + v + ' %', onInput: v => { st.df = v; upd(); } });
  EM.seg(side, [['phase', 'Phase shifters'], ['ttd', 'True-time delay']], 'phase', v => { st.mode = v; upd(); });
  EM.slider(side, { label: 'Elements', min: 4, max: 16, step: 1, value: 8, onInput: v => { st.N = v; upd(); } });
  const ro = EM.readouts(side, [['sum', 'Combined signal vs ideal', '', 'good'], ['pt', 'Beam actually points at', '', 'cool'], ['err', 'Squint error', '', 'hot']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const d = .5;                                                                  // spacing in design wavelengths
  function sumAmp(th, df) { const f = 1 + df / 100, k = 2 * Math.PI * d * f; let re = 0, im = 0; const th0 = EM.rad(st.th); for (let n = 0; n < st.N; n++) { const arrive = k * n * Math.sin(EM.rad(th)); const comp = st.mode === 'ttd' ? k * n * Math.sin(th0) : 2 * Math.PI * d * n * Math.sin(th0); re += Math.cos(arrive - comp); im += Math.sin(arrive - comp); } return Math.hypot(re, im) / st.N; }
  function upd() {
    let best = 0, ba = 0; for (let a = -89; a <= 89; a += .1) { const v = sumAmp(a, st.df); if (v > best) { best = v; ba = a; } }
    ro.set('sum', EM.fixed(20 * Math.log10(Math.max(1e-3, sumAmp(st.th, st.df))), 1), 'dB'); ro.set('pt', ba.toFixed(1) + '°'); ro.set('err', (ba - st.th).toFixed(1) + '°');
    info.innerHTML = '<h6>' + (st.mode === 'phase' ? 'Phase shifters: narrowband' : 'True-time delay: wideband') + '</h6>' + (st.mode === 'phase' ? 'The shifters give the right <em>phase</em> only at the design frequency; at ±' + Math.abs(st.df) + '% the beam points at $\\sin\\theta=\\sin\\theta_0/(1+\\delta)$, so it drifts by ' + (ba - st.th).toFixed(1) + '°. For a radar pulse of bandwidth 10 % this smears the beam; wideband arrays use delay lines or sub-array delays.' : 'A delay is the same at all frequencies, so the combined beam stays on target. The price is hardware: delay lines (fibre or switched cable) are bigger and costlier than phase shifters.') + ' <span class="muted">The “sum” readout shows how much of the ideal coherent gain is kept when the wave comes from the chosen direction.</span>';
    if (window.renderMath) window.renderMath(info); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const N = st.N, sp = Math.min(60, (w - 100) / N), x0 = w / 2 - (N - 1) * sp / 2, ay = h * .78, th = EM.rad(st.th), f = 1 + st.df / 100, k = 2 * Math.PI * d * f, ph0 = st.t * 3;
    // incoming plane wave: wavefronts are lines perpendicular to the direction of the source
    const lamPx = 2 * sp / f, sx = Math.sin(th), sy = -Math.cos(th), px = Math.cos(th), py = Math.sin(th);
    c.save(); c.beginPath(); c.rect(0, 0, w, ay + 6); c.clip(); c.strokeStyle = EM.alpha(EM.col('acc'), .45); c.lineWidth = 2;
    for (let i = -14; i < 14; i++) { const p = i * lamPx - ((st.t * 30) % lamPx), cxp = w / 2 + p * sx, cyp = ay + p * sy; c.beginPath(); c.moveTo(cxp - 600 * px, cyp - 600 * py); c.lineTo(cxp + 600 * px, cyp + 600 * py); c.stroke(); }
    c.restore();
    // elements + phasors
    let sr = 0, si = 0; const th0 = EM.rad(st.th);
    for (let n = 0; n < N; n++) { const x = x0 + n * sp, arrive = k * n * Math.sin(th), comp = st.mode === 'ttd' ? k * n * Math.sin(th0) : 2 * Math.PI * d * n * Math.sin(th0), ph = arrive - comp; sr += Math.cos(ph); si += Math.sin(ph);
      c.fillStyle = EM.col('acc3'); c.fillRect(x - 5, ay, 10, 10); c.strokeStyle = EM.alpha(EM.col('text'), .4); c.lineWidth = 1; c.beginPath(); c.arc(x, ay + 42, 15, 0, 7); c.stroke(); EM.arrow(c, x, ay + 42, x + 15 * Math.cos(ph - ph0 * 0), ay + 42 - 15 * Math.sin(ph - ph0 * 0), EM.col('acc2'), 2, 6); }
    const tot = Math.hypot(sr, si) / N; EM.label(c, 'phasors after delay/phase compensation (aligned = coherent)', 10, ay + 74, EM.col('muted'), { size: 10, weight: '500' });
    c.fillStyle = EM.alpha(EM.col('ok'), .85); c.fillRect(w - 40, 20 + (1 - tot) * (ay - 50), 14, tot * (ay - 50)); c.strokeStyle = EM.col('line-2'); c.strokeRect(w - 40.5, 20.5, 14, ay - 50); EM.label(c, 'sum', w - 33, 12, EM.col('muted'), { size: 10, align: 'center' });
    EM.label(c, 'wave from ' + st.th + '°', 14, 18, EM.col('acc'), { size: 11, weight: '700' });
  };
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 50, y: 10, w: w - 66, h: h - 42 }, { xmin: -90, xmax: 90, ymin: -40, ymax: 3, xlabel: 'direction (°)', ylabel: 'dB', yticks: [-40, -20, 0], xticks: [-90, -60, -30, 0, 30, 60, 90] });
    P.grid(); P.fn(a => 20 * Math.log10(Math.max(1e-3, sumAmp(a, 0))), EM.alpha(EM.col('muted'), .8), 1.6, 500, [4, 4]); P.fn(a => 20 * Math.log10(Math.max(1e-3, sumAmp(a, st.df))), EM.col('acc3'), 2.8, 500); P.vline(st.th, EM.col('acc2'), 1.4, [4, 4]);
    EM.label(c, 'beam at the design frequency (grey dashed) and at the offset frequency (yellow); orange = wanted direction', P.box.x + 8, P.box.y + 12, EM.col('text-2'), { size: 10, weight: '500' });
  };
  EM.loop(el, (t, dt) => { st.t += dt; A.redraw(); });
  upd();
});
