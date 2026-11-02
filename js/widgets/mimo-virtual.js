/* mimo-virtual — MIMO radar / massive MIMO: N transmit x M receive elements make an N*M-element virtual array */
EM.register('mimo-virtual', function (el) {
  const W = EM.widget(el, { title: 'MIMO: a big array from a few antennas', badge: 'Try it',
    note: 'Give each transmit antenna its own waveform (orthogonal in time, frequency or code) and every receiver can tell them apart. The path from transmitter $i$ to receiver $j$ then behaves like one element at position $x_i+x_j$: with transmitters spaced $M d$ apart and receivers $d$ apart, $N+M$ real antennas act like <b>$N\\times M$</b> virtual ones. Automotive radars use 3 Tx × 4 Rx = 12 virtual elements; 5G “massive MIMO” base stations use 64 and more.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .3 }), B = EM.canvas(main, { aspect: .5 }); B.cv.style.marginTop = '10px';
  const st = { N: 3, M: 4, d: .5, sparse: true };
  EM.slider(side, { label: 'Transmit antennas N', min: 1, max: 8, step: 1, value: 3, onInput: v => { st.N = v; upd(); } });
  EM.slider(side, { label: 'Receive antennas M', min: 1, max: 16, step: 1, value: 4, onInput: v => { st.M = v; upd(); } });
  EM.toggle(side, { label: 'Space the transmitters M·d apart (fills the virtual array)', checked: true, onChange: v => { st.sparse = v; upd(); } });
  const ro = EM.readouts(side, [['phys', 'Real antennas', '', 'cool'], ['virt', 'Virtual elements', '', 'fuel'], ['bw1', 'Beamwidth, receivers alone', '', ''], ['bw2', 'Beamwidth with MIMO', '', 'good'], ['ap', 'Virtual aperture', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function pos() { const tx = [], rx = [], v = []; for (let j = 0; j < st.M; j++) rx.push(j * st.d); for (let i = 0; i < st.N; i++) tx.push(i * (st.sparse ? st.M : 1) * st.d); for (const t of tx) for (const r of rx) v.push(t + r); return { tx, rx, v }; }
  const af = (xs, th) => { let re = 0, im = 0, k = 2 * Math.PI, u = Math.sin(th); const c0 = xs.reduce((a, b) => a + b, 0) / xs.length; for (const x of xs) { re += Math.cos(k * (x - c0) * u); im += Math.sin(k * (x - c0) * u); } return Math.hypot(re, im) / xs.length; };
  function upd() {
    const p = pos(), hp = xs => EM.hpbw(a => af(xs, a), 0, Math.PI / 2);
    ro.set('phys', (st.N + st.M) + '  (' + st.N + ' Tx + ' + st.M + ' Rx)'); ro.set('virt', st.N * st.M + (new Set(p.v.map(x => x.toFixed(4))).size < p.v.length ? '  (' + new Set(p.v.map(x => x.toFixed(4))).size + ' distinct positions)' : '')); ro.set('bw1', hp(p.rx).toFixed(1) + '°'); ro.set('bw2', hp(p.v).toFixed(1) + '°'); ro.set('ap', EM.num(Math.max(...p.v) - Math.min(...p.v) + st.d, 3) + ' λ');
    info.innerHTML = '<h6>Why it pays</h6>Angular resolution is set by the <b>aperture</b>, and MIMO enlarges the aperture by adding transmit positions rather than receivers: a 3×4 system resolves like 12 elements while needing only 7 antennas and 4 receive chains. In 5G, massive MIMO uses the same idea (many antennas at the base station) to serve several users on the same frequency with separate beams (<em>spatial multiplexing</em>), increasing capacity by about the number of users. The price: orthogonal waveforms (which reduce peak power), more signal processing, and calibration.';
    A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const p = pos(), maxx = Math.max(...p.v, ...p.tx, ...p.rx) + st.d, X = x => 24 + x / maxx * (w - 48);
    c.fillStyle = EM.col('bg-2'); c.fillRect(0, 0, w, h);
    p.tx.forEach(x => { c.fillStyle = EM.col('acc2'); c.fillRect(X(x) - 6, h * .12, 12, 12); }); p.rx.forEach(x => { c.fillStyle = EM.col('acc'); c.beginPath(); c.arc(X(x), h * .43, 6, 0, 7); c.fill(); }); p.v.forEach(x => { c.fillStyle = EM.col('acc3'); c.beginPath(); c.arc(X(x), h * .78, 4, 0, 7); c.fill(); });
    EM.label(c, 'transmit', 6, h * .12 + 6, EM.col('acc2'), { size: 10 }); EM.label(c, 'receive', 6, h * .43 + 4, EM.col('acc'), { size: 10 }); EM.label(c, 'virtual array (Tx position + Rx position)', 6, h * .78 + 4, EM.col('acc3'), { size: 10 });
    c.strokeStyle = EM.alpha(EM.col('line-2'), .6); c.setLineDash([2, 3]); c.beginPath(); c.moveTo(0, h * .6); c.lineTo(w, h * .6); c.stroke(); c.setLineDash([]);
  };
  B.draw = (c, w, h) => {
    const p = pos(), P = EM.plot(c, { x: 50, y: 12, w: w - 66, h: h - 44 }, { xmin: -90, xmax: 90, ymin: -40, ymax: 3, xlabel: 'direction (°)', ylabel: 'dB', xticks: [-90, -60, -30, 0, 30, 60, 90], yticks: [-40, -30, -20, -10, 0] });
    P.grid(); P.fn(a => 20 * Math.log10(Math.max(1e-3, af(p.rx, EM.rad(a)))), EM.alpha(EM.col('acc'), .9), 2, 500, [5, 4]); P.fn(a => 20 * Math.log10(Math.max(1e-3, af(p.v, EM.rad(a)))), EM.col('acc3'), 2.8, 700);
    EM.label(c, 'receivers alone (blue dashed)   MIMO virtual array (yellow)', P.box.x + 8, P.box.y + 12, EM.col('text-2'), { size: 10, weight: '500' });
  };
  upd();
});
