/* match-network — design an L-network that matches a real load to a source and plot its bandwidth */
EM.register('match-network', function (el) {
  const W = EM.widget(el, { title: 'Matching with an L-network', badge: 'Design',
    note: 'Two components (one series, one shunt) can transform any real load to a real source resistance <b>at one frequency</b>. The more you transform ($Q=\\sqrt{R_{hi}/R_{lo}-1}$), the narrower the match: a high-Q network is a filter as well as a matcher.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const cx = EM.cx, st = { Rs: 50, RL: 12, f: 7.1e6, type: 'lp' };
  EM.select(side, { label: 'Source / line resistance', options: [[50, '50 Ω'], [75, '75 Ω'], [300, '300 Ω']], value: 50, onChange: v => { st.Rs = +v; upd(); } });
  EM.slider(side, { label: 'Load (antenna) resistance', min: 2, max: 2000, log: true, value: 12, fmt: v => EM.num(v, 3) + ' Ω', onInput: v => { st.RL = v; upd(); } });
  EM.slider(side, { label: 'Design frequency', min: 1e5, max: 3e9, log: true, value: 7.1e6, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  EM.seg(side, [['lp', 'Low-pass (series L, shunt C)'], ['hp', 'High-pass (series C, shunt L)']], 'lp', v => { st.type = v; upd(); });
  const ro = EM.readouts(side, [['Q', 'Q (transformation)', '', 'hot'], ['xs', 'Series part', '', 'cool'], ['xp', 'Shunt part', '', 'cool'], ['bw', 'Bandwidth (RL > 10 dB)', '', 'fuel']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function design() {
    const lo = Math.min(st.Rs, st.RL), hi = Math.max(st.Rs, st.RL), Q = Math.sqrt(hi / lo - 1), Xs = Q * lo, Xp = hi / Q; return { Q, Xs, Xp, loadLow: st.RL < st.Rs };
  }
  function Zin(f, d) {
    const w = 2 * Math.PI * f, lp = st.type === 'lp';
    const Zs = lp ? [0, w * d.Xs / (2 * Math.PI * st.f)] : [0, -1 / (w * (1 / (2 * Math.PI * st.f * d.Xs)))];             // series element reactance at f
    const Zp = lp ? [0, -1 / (w * (1 / (2 * Math.PI * st.f * d.Xp)))] : [0, w * d.Xp / (2 * Math.PI * st.f)];                     // shunt element reactance at f
    const par = (a, b) => cx.div(cx.mul(a, b), cx.add(a, b));
    return d.loadLow ? par(Zp, cx.add([st.RL, 0], Zs)) : cx.add(Zs, par(Zp, [st.RL, 0]));
  }
  const rlAt = (f, d) => { const z = Zin(f, d), G = cx.div(cx.sub(z, [st.Rs, 0]), cx.add(z, [st.Rs, 0])); return -20 * Math.log10(Math.max(1e-6, cx.abs(G))); };
  function upd() {
    const d = design(), w0 = 2 * Math.PI * st.f, lp = st.type === 'lp';
    const part = (X, ind) => ind ? EM.si(X / w0, 'H') + ' (inductor, ' + EM.num(X, 3) + ' Ω)' : EM.si(1 / (w0 * X), 'F') + ' (capacitor, ' + EM.num(X, 3) + ' Ω)';
    ro.set('Q', d.Q.toFixed(2)); ro.set('xs', part(d.Xs, lp)); ro.set('xp', part(d.Xp, !lp));
    let lo = st.f, hi = st.f; while (lo > st.f * .05 && rlAt(lo, d) > 10) lo *= .995; while (hi < st.f * 20 && rlAt(hi, d) > 10) hi *= 1.005;
    ro.set('bw', st.RL === st.Rs ? 'already matched' : EM.freq(hi - lo) + ' (' + ((hi - lo) / st.f * 100).toFixed(0) + ' %)');
    info.innerHTML = '<h6>' + (d.loadLow ? 'Load below source' : 'Load above source') + '</h6>' + (d.loadLow ? 'Series element next to the load, shunt element at the source side.' : 'Series element at the source, shunt element across the load.') + ' Check: ' + (d.loadLow ? '$Z_{in}=jX_p\\,\\|\\,(R_L+jX_s)$' : '$Z_{in}=jX_s+(jX_p\\|R_L)$') + ' equals ' + st.Rs + ' Ω at ' + EM.freq(st.f) + '. <b>Low-pass</b> versions also suppress harmonics: useful at a transmitter; <b>high-pass</b> ones pass DC (e.g. for lightning grounding of an antenna). Real components have loss, so Q much above 10 wastes power in the matching network.';
    if (window.renderMath) window.renderMath(info); S.redraw();
  }
  S.draw = (c, w, h) => {
    const d = design(), P = EM.plot(c, { x: 58, y: 14, w: w - 76, h: h - 54 }, { xmin: .4, xmax: 1.8, ymin: 0, ymax: 40, xlabel: 'frequency relative to the design frequency', ylabel: 'return loss (dB)', yticks: [0, 10, 20, 30, 40], xticks: [.5, .75, 1, 1.25, 1.5], xfmt: v => v + '×' });
    P.grid(); P.hline(10, EM.alpha(EM.col('ok'), .8), 1.2, [4, 4]); EM.label(c, '10 dB: VSWR 2:1, good enough', P.box.x + P.box.w - 6, P.Y(10) - 8, EM.col('ok'), { size: 10, align: 'right' });
    P.clip(); P.fn(x => Math.min(40, rlAt(x * st.f, d)), EM.col('acc3'), 3, 300); P.unclip();
    c.fillStyle = EM.alpha(EM.col('acc'), .1); const xs = [], ys = []; EM.label(c, 'Q = ' + d.Q.toFixed(1) + ': ' + (d.Q > 5 ? 'narrow' : d.Q > 2 ? 'moderate' : 'wide') + ' match', P.box.x + 10, P.box.y + 14, EM.col('text'), { size: 12, weight: '700' });
  };
  upd();
});
