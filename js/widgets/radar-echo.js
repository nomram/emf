/* radar-echo — the pulse goes out, the echo comes back: delay, range, resolution, ambiguity (second-time-around echoes) */
EM.register('radar-echo', function (el) {
  const W = EM.widget(el, { title: 'The radar pulse: ranging with a stopwatch', badge: 'Try it',
    note: 'Range $R=c\\,t/2$: the echo’s round-trip time $t$ times the speed of light, halved. Two targets closer than $c\\tau/2$ merge into one blip (<b>range resolution</b>). A target farther than $c/2\\,\\text{PRF}$ (the <b>unambiguous range</b>) is shown at the <em>wrong</em> range, because its echo arrives after the next pulse has been sent. The animation is slowed down by a factor of about $10^{5}$.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .34 });
  const B = EM.canvas(main, { aspect: .42 }); B.cv.style.marginTop = '10px';
  const c0 = EM.C.c;
  const st = { R1: 60e3, dR: 4e3, tau: 10e-6, prf: 1500, two: true, t: 0 };
  EM.slider(side, { label: 'Target 1 range', min: 1e3, max: 400e3, log: true, value: 60e3, fmt: v => EM.len(v), onInput: v => { st.R1 = v; upd(); } });
  const dS = EM.slider(side, { label: 'Second target farther by', min: 100, max: 40e3, log: true, value: 4e3, fmt: v => EM.len(v), onInput: v => { st.dR = v; upd(); } });
  EM.toggle(side, { label: 'Show a second target', checked: true, onChange: v => { st.two = v; dS.el.style.display = v ? '' : 'none'; upd(); } });
  EM.slider(side, { label: 'Pulse length τ', min: 1e-7, max: 1e-4, log: true, value: 1e-5, fmt: v => EM.si(v, 's'), onInput: v => { st.tau = v; upd(); } });
  EM.slider(side, { label: 'Pulse repetition frequency (PRF)', min: 100, max: 20000, log: true, value: 1500, fmt: v => EM.num(v, 4) + ' Hz', onInput: v => { st.prf = v; upd(); } });
  const ro = EM.readouts(side, [['t', 'Echo delay (target 1)', '', 'cool'], ['unamb', 'Unambiguous range', '', 'fuel'], ['res', 'Range resolution cτ/2', '', 'hot'], ['app', 'Displayed range (target 1)', '', 'good'], ['duty', 'Duty cycle τ·PRF', '', ''], ['min', 'Blind range (during pulse)', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const Ru = () => c0 / (2 * st.prf), tg = () => st.two ? [st.R1, st.R1 + st.dR] : [st.R1];
  function upd() {
    const ru = Ru(), res = c0 * st.tau / 2, ap = st.R1 % ru;
    ro.set('t', EM.si(2 * st.R1 / c0, 's')); ro.set('unamb', EM.len(ru)); ro.set('res', EM.len(res)); ro.set('app', EM.len(ap) + (st.R1 > ru ? ' (AMBIGUOUS)' : '')); ro.set('duty', EM.num(st.tau * st.prf * 100, 3), '%'); ro.set('min', EM.len(res));
    const resolved = !st.two || st.dR >= res;
    info.innerHTML = '<h6>' + (st.R1 > ru ? 'Range ambiguity!' : !resolved ? 'Two targets merged' : 'Clean picture') + '</h6>' + (st.R1 > ru ? 'Target 1 is beyond ' + EM.len(ru) + '. Its echo comes back after the <em>next</em> pulse left, so the scope shows it at ' + EM.len(ap) + '. Fix: lower the PRF (but then slower data rate and worse Doppler, chapter 13).' : !resolved ? 'The two targets are ' + EM.len(st.dR) + ' apart, closer than the pulse length in space ' + EM.len(res) + '. The echoes overlap into one blip. Shorten the pulse (more bandwidth) to separate them.' : 'Both targets are separated by more than the resolution cell, and they sit inside the unambiguous range.') + ' Pulse length in space: ' + EM.len(c0 * st.tau) + '. Bandwidth needed ≈ 1/τ = ' + EM.freq(1 / st.tau) + '.';
    A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const ru = Ru(), D = Math.max(ru * 1.15, ...tg()) * 1.1, X = r => 40 + r / D * (w - 70), cy = h * .55;
    c.fillStyle = EM.col('bg-2'); c.fillRect(0, 0, w, h);
    // ground line, radar, targets
    c.strokeStyle = EM.col('line-2'); c.lineWidth = 1; c.beginPath(); c.moveTo(0, cy + 20); c.lineTo(w, cy + 20); c.stroke();
    c.fillStyle = EM.col('text'); c.fillRect(24, cy - 14, 8, 34); c.beginPath(); c.arc(28, cy - 16, 10, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); EM.label(c, 'radar', 28, cy + 38, EM.col('muted'), { size: 10, align: 'center' });
    // unambiguous range marker
    if (ru < D) { c.setLineDash([4, 4]); c.strokeStyle = EM.alpha(EM.col('bad'), .8); c.beginPath(); c.moveTo(X(ru), 8); c.lineTo(X(ru), h - 8); c.stroke(); c.setLineDash([]); EM.label(c, 'unambiguous range ' + EM.len(ru), X(ru) - 4, 14, EM.col('bad'), { size: 10, align: 'right' }); }
    tg().forEach((R, i) => { const x = X(R); c.fillStyle = i ? EM.col('acc2') : EM.col('acc3'); c.beginPath(); c.moveTo(x - 10, cy + 4); c.lineTo(x + 10, cy + 4); c.lineTo(x + 4, cy - 8); c.lineTo(x - 4, cy - 8); c.closePath(); c.fill(); EM.label(c, 'T' + (i + 1) + ' ' + EM.len(R), x, cy + 38, EM.col('text-2'), { size: 10, align: 'center' }); });
    // pulses (outgoing and echoes) for the last three transmissions
    const PRI = 1 / st.prf, ph = (st.t % 1) * PRI * 1;   // time since the last transmit, s (slowed animation)
    c.lineWidth = 0; const pl = Math.max(4, c0 * st.tau / D * (w - 70));
    for (let k = 0; k < 3; k++) {
      const tt = ph + k * PRI;
      const d = c0 * tt; if (d < D * 1.0 && d > 0) { c.fillStyle = EM.alpha(EM.col('acc'), k ? .35 : .95); c.fillRect(X(Math.max(0, d - c0 * st.tau)), cy - 3 - 12, Math.max(3, X(d) - X(Math.max(0, d - c0 * st.tau))), 6); }
      tg().forEach((R, i) => { if (d > R) { const back = 2 * R - d; if (back > 0) { c.fillStyle = EM.alpha(i ? EM.col('acc2') : EM.col('acc3'), k ? .45 : .95); c.fillRect(X(Math.max(0, back)), cy + 4 + 6 + i * 3, Math.max(3, pl), 5); } } });
    }
    EM.label(c, 'blue = pulse going out, coloured = echoes coming back (older pulses dimmer)', 10, h - 8, EM.col('muted'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const ru = Ru(), res = c0 * st.tau / 2, P = EM.plot(c, { x: 40, y: 12, w: w - 56, h: h - 46 }, { xmin: 0, xmax: ru, ymin: 0, ymax: 1.2, xlabel: 'displayed range on the A-scope (0 → unambiguous range)', yticks: [], xfmt: v => EM.len(v, 2).replace(' ', '') });
    P.grid(); c.fillStyle = EM.alpha(EM.col('acc'), .15); const sig = [];
    const N = 700, xs = [], ys = []; for (let i = 0; i <= N; i++) { const r = ru * i / N; let v = .05 + .04 * EM.rand();
      if (r < res * 1.1) v += Math.exp(-Math.pow(r / (res * .6), 2)) * 1;                                      // transmit pulse ("main bang")
      tg().forEach((R, j) => { const ap = R % ru, amp = (j ? .75 : 1) * (R > ru ? .7 : 1) * Math.pow(60e3 / Math.max(R, 20e3), .3); const edge = r - ap; v += (j ? 1 : 1) * amp * (edge >= 0 && edge <= res ? 1 : (edge < 0 && edge > -res * .1 ? 1 + edge / (res * .1) : (edge > res && edge < res * 1.1 ? 1 - (edge - res) / (res * .1) : 0))) * 0.8; });
      xs.push(r); ys.push(Math.min(1.15, v)); }
    P.line(xs, ys, EM.col('ok'), 2.2); EM.label(c, 'transmit pulse', P.X(res * .5) + 8, P.Y(1) + 6, EM.col('muted'), { size: 10 });
    tg().forEach((R, j) => { const ap = R % ru; EM.label(c, 'T' + (j + 1) + (R > ru ? ' (ambiguous!)' : ''), P.X(ap + res / 2), P.Y(.95 - j * .2) - 10, R > ru ? EM.col('bad') : EM.col('acc3'), { size: 11, align: 'center', weight: '700' }); });
  };
  EM.loop(el, (t, dt) => { st.t += dt * .18; A.redraw(); });
  upd();
});
