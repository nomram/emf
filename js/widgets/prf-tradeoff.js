/* prf-tradeoff — the range-Doppler ambiguity dilemma: R_u = c/2PRF, v_u = lambda PRF/4, R_u * v_u = c lambda / 8 */
EM.register('prf-tradeoff', function (el) {
  const W = EM.widget(el, { title: 'The PRF dilemma: you can’t have unambiguous range and speed together', badge: 'Try it',
    note: 'A pulsed radar samples the target once per pulse. <b>Low PRF</b>: long unambiguous range, but Doppler “wraps around” (velocity ambiguity, blind speeds). <b>High PRF</b>: speed is clear, but range is ambiguous. The product $R_u\\cdot v_u=c\\lambda/8$ is <b>fixed by the wavelength</b>: lower frequency (longer λ) eases the dilemma.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .6 });
  const st = { f: 3e9, prf: 3000, Rneed: 100e3, vneed: 300 };
  const c0 = EM.C.c;
  const pre = EM.h('div', { class: 'btn-row' }); side.append(pre);
  [['L-band 1.3 GHz', 1.3e9], ['S-band 3 GHz', 3e9], ['X-band 10 GHz', 1e10], ['W-band 94 GHz', 9.4e10]].forEach(([t, v]) => EM.btn(pre, t, () => { fs.set(v); }, 'small'));
  const fs = EM.slider(side, { label: 'Radar frequency', min: 1e8, max: 1e11, log: true, value: 3e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  EM.slider(side, { label: 'Pulse repetition frequency', min: 100, max: 1e6, log: true, value: 3000, fmt: v => EM.num(v, 4) + ' Hz', onInput: v => { st.prf = v; upd(); } });
  EM.slider(side, { label: 'I need to see out to', min: 1e3, max: 1e6, log: true, value: 1e5, fmt: v => EM.len(v), onInput: v => { st.Rneed = v; upd(); } });
  EM.slider(side, { label: 'and speeds up to', min: 1, max: 3000, log: true, value: 300, fmt: v => EM.num(v, 3) + ' m/s', onInput: v => { st.vneed = v; upd(); } });
  const ro = EM.readouts(side, [['Ru', 'Unambiguous range', '', 'cool'], ['vu', 'Unambiguous speed ±', '', 'fuel'], ['blind', 'First blind speed', '', 'bad'], ['reg', 'PRF regime', '', 'hot']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function upd() {
    const lam = c0 / st.f, Ru = c0 / (2 * st.prf), vu = lam * st.prf / 4, blind = lam * st.prf / 2, reg = st.prf < 5e3 ? 'LOW (range-clear)' : st.prf < 3e4 ? 'MEDIUM (both ambiguous)' : 'HIGH (speed-clear)';
    ro.set('Ru', EM.len(Ru)); ro.set('vu', EM.num(vu, 3), 'm/s'); ro.set('blind', EM.num(blind, 3), 'm/s'); ro.set('reg', reg);
    const need = 8 * st.Rneed * st.vneed / c0, ok = lam >= need;
    info.innerHTML = '<h6>' + (ok ? 'Both requirements can be met with one PRF' : 'One PRF cannot do both') + '</h6>You want $R\\ge$ ' + EM.len(st.Rneed) + ' and $v\\le$ ' + EM.num(st.vneed, 3) + ' m/s. That needs $\\lambda\\ge8Rv/c=$ ' + EM.len(need) + '. This radar’s λ is ' + EM.len(lam) + ': ' + (ok ? 'yes, choose PRF so that ' + EM.len(Ru) + ' and ±' + EM.num(vu, 3) + ' m/s fit.' : '<b>no</b>. Real radars use <b>several PRFs in turn</b> (staggered or “medium-PRF” schemes, resolved by the Chinese remainder theorem), or a long-wavelength band, or both.') + ' The “blind speeds” $v_n=n\\lambda\\,\\text{PRF}/2$ are speeds at which a moving target looks stationary and is rejected by the clutter filter.';
    if (window.renderMath) window.renderMath(info); S.redraw();
  }
  S.draw = (c, w, h) => {
    const lam = c0 / st.f, P = EM.plot(c, { x: 64, y: 14, w: w - 130, h: h - 56 }, { xmin: 100, xmax: 1e6, xlog: true, ymin: 100, ymax: 1.5e6, ylog: true, xlabel: 'pulse repetition frequency (Hz)', ylabel: 'unambiguous range (m)', yfmt: v => EM.len(v, 2).replace(' ', '') });
    // zones
    for (const [a, b, n, cl] of [[100, 5e3, 'LOW PRF', 'ok'], [5e3, 3e4, 'MEDIUM', 'warn'], [3e4, 1e6, 'HIGH PRF', 'acc2']]) { c.fillStyle = EM.alpha(EM.col(cl), .1); c.fillRect(P.X(a), P.box.y, P.X(b) - P.X(a), P.box.h); EM.label(c, n, (P.X(a) + P.X(b)) / 2, P.box.y + 12, EM.col(cl), { size: 11, align: 'center', weight: '800' }); }
    P.grid(); P.clip(); P.fn(p => c0 / (2 * p), EM.col('acc'), 3, 120);
    // velocity curve on its own scale (right axis)
    const vmin = lam * 100 / 4, vmax = lam * 1e6 / 4, Pv = EM.plot(c, P.box, { xmin: 100, xmax: 1e6, xlog: true, ymin: vmin, ymax: vmax, ylog: true }); Pv.fn(p => lam * p / 4, EM.col('acc3'), 3, 120); c.restore();
    P.hline(st.Rneed, EM.alpha(EM.col('acc'), .8), 1, [4, 4]);
    P.vline(st.prf, EM.col('text'), 2); P.dot(st.prf, c0 / (2 * st.prf), EM.col('acc'), 6); Pv.dot(st.prf, lam * st.prf / 4, EM.col('acc3'), 6);
    EM.label(c, 'unambiguous range (left axis)', P.box.x + 10, P.box.y + 30, EM.col('acc'), { size: 11, weight: '700' }); EM.label(c, 'unambiguous speed ± (right axis, m/s)', P.box.x + P.box.w - 10, P.box.y + 30, EM.col('acc3'), { size: 11, weight: '700', align: 'right' });
    c.fillStyle = EM.col('acc3'); c.font = EM.font(10); c.textAlign = 'left'; c.textBaseline = 'middle'; for (let e = Math.ceil(Math.log10(vmin)); e <= Math.floor(Math.log10(vmax)); e++) c.fillText(EM.num(Math.pow(10, e), 2), P.box.x + P.box.w + 5, Pv.Y(Math.pow(10, e)));
  };
  upd();
});
