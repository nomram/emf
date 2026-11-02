/* falloff — how field strength fades with distance for different source shapes (log-log) */
EM.register('falloff', function (el) {
  const W = EM.widget(el, { title: 'How fast does a field fade? It depends on the shape of the source', badge: 'Compare',
    note: 'All curves are scaled to equal 1 at the reference distance, so you compare only the <b>steepness</b>. On a log–log plot every power law $1/r^n$ is a straight line of slope $-n$.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .66 });
  const SRC = [
    { k: 'sheet', n: 'Infinite flat sheet (or plate)', p: 0, col: 'violet', ex: 'Field between big capacitor plates' },
    { k: 'line', n: 'Long straight wire / line charge', p: 1, col: 'acc', ex: 'B around a power line: B = μ₀I/2πr' },
    { k: 'point', n: 'Point charge / point source', p: 2, col: 'acc2', ex: 'E = q/4πε₀r²' },
    { k: 'dip', n: 'Static dipole (bar magnet, loop)', p: 3, col: 'acc3', ex: 'Far field of a magnet or a small loop' },
    { k: 'quad', n: 'Quadrupole', p: 4, col: 'pink', ex: 'Two opposite dipoles side by side' },
    { k: 'rad', n: 'Radiating wave, E field (far)', p: 1, col: 'ok', ex: 'Any antenna far away: E ∝ 1/r' },
  ];
  const on = {}; SRC.forEach(s => on[s.k] = ['line', 'point', 'dip', 'rad'].includes(s.k));
  const st = { r0: 1, probe: 10 };
  const tg = SRC.map(s => EM.toggle(side, { label: '<span class="sw" style="background:' + EM.col(s.col) + '"></span>' + s.n, checked: on[s.k], onChange: v => { on[s.k] = v; S.redraw(); upd(); } }));
  EM.slider(side, { label: 'Probe distance (multiple of reference)', min: 1, max: 1000, log: true, value: 10, fmt: v => '×' + EM.num(v, 3), onInput: v => { st.probe = v; S.redraw(); upd(); } });
  const tbl = EM.h('div', { class: 'info-box', style: { padding: 0, overflow: 'hidden' } }); side.append(tbl);
  function upd() {
    let h = '<table class="data" style="margin:0;font-size:.8rem"><tr><th>Source</th><th class="num">at ×' + EM.num(st.probe, 3) + '</th><th class="num">per ×2</th></tr>';
    for (const s of SRC) if (on[s.k]) h += '<tr><td><span class="sw" style="background:' + EM.col(s.col) + '"></span>' + s.n.split(' (')[0] + '</td><td class="num">' + EM.num(Math.pow(st.probe, -s.p), 3) + '</td><td class="num">' + (s.p ? '−' + (6.02 * s.p).toFixed(0) + ' dB' : '0 dB') + '</td></tr>';
    tbl.innerHTML = h + '</table>';
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 64, y: 14, w: w - 84, h: h - 56 }, { xmin: 1, xmax: 1000, xlog: true, ymin: 1e-12, ymax: 10, ylog: true, xlabel: 'distance from the source (× reference distance)', ylabel: 'field strength (relative)', yfmt: v => EM.num(v, 1) });
    P.grid();
    P.clip();
    for (const s of SRC) if (on[s.k]) P.fn(r => Math.pow(r, -s.p), EM.col(s.col), s.k === 'rad' ? 3 : 2.5, 80, s.k === 'rad' ? [7, 5] : undefined);
    P.unclip();
    P.vline(st.probe, EM.alpha(EM.col('text'), .5), 1.2, [4, 4]);
    for (const s of SRC) if (on[s.k]) P.dot(st.probe, Math.pow(st.probe, -s.p), EM.col(s.col), 5);
    for (const s of SRC) if (on[s.k] && s.p > 0) { const x = 1.6, y = Math.pow(x, -s.p); EM.label(c, '1/r' + (s.p > 1 ? EM.sup(s.p) : ''), P.X(x * 1.1), P.Y(y) - 11, EM.col(s.col), { size: 11, weight: '700' }); }
  };
  upd(); S.redraw();
});
