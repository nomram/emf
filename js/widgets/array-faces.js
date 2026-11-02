/* array-faces — hemispheric coverage from several fixed flat arrays (each limited by scan loss) */
EM.register('array-faces', function (el) {
  const W = EM.widget(el, { title: 'Covering the whole sky with flat arrays', badge: 'Try it',
    note: 'A flat array loses gain as $\cos\theta_0$ and gets a broader beam as it scans off boresight, so one face is useful to about ±60° (−3 dB). Radars that must see all around (Aegis ships, missile-defence sites) use several faces. Pick the number of faces and the scan limit to see the coverage and the worst-case loss.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: 1, maxH: 480 });
  const st = { n: 4, lim: 60, off: 45 };
  EM.slider(side, { label: 'Number of faces', min: 1, max: 6, step: 1, value: 4, onInput: v => { st.n = v; upd(); } });
  EM.slider(side, { label: 'Scan limit of each face (±)', min: 30, max: 80, step: 1, value: 60, unit: '°', onInput: v => { st.lim = v; upd(); } });
  EM.slider(side, { label: 'Rotation of the whole radar', min: 0, max: 90, step: 1, value: 45, unit: '°', onInput: v => { st.off = v; upd(); } });
  const PRE = EM.h('div', { class: 'btn-row' }); side.append(PRE); [['Aegis-style: 4 faces', 4, 60], ['PAVE PAWS-style: 2 faces (240°)', 2, 60], ['Single-face fire control', 1, 60]].forEach(([t, n, l]) => EM.btn(PRE, t, () => { st.n = n; st.lim = l; side.querySelectorAll('input[type=range]')[0].value = n; side.querySelectorAll('input[type=range]')[0].dispatchEvent(new Event('input')); side.querySelectorAll('input[type=range]')[1].value = l; side.querySelectorAll('input[type=range]')[1].dispatchEvent(new Event('input')); }, 'small'));
  const ro = EM.readouts(side, [['cov', 'Azimuth covered', '', 'good'], ['gap', 'Gaps', '', 'bad'], ['loss', 'Scan loss at the edge', '', 'hot'], ['cost', 'Relative cost (faces)', '', 'fuel']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function upd() {
    const covered = Math.min(360, st.n * 2 * st.lim), gap = Math.max(0, 360 - covered), loss = -10 * Math.log10(Math.cos(EM.rad(st.lim)));
    ro.set('cov', Math.min(100, covered / 3.6).toFixed(0) + ' %'); ro.set('gap', gap > 0 ? EM.num(gap, 3) + '° uncovered' : 'none (overlap ' + EM.num(covered - 360, 3) + '°)'); ro.set('loss', EM.fixed(loss, 1), 'dB'); ro.set('cost', st.n + ' ×');
    info.innerHTML = '<h6>Trade-off</h6>Allowing ±70° costs ' + EM.fixed(-10 * Math.log10(Math.cos(EM.rad(70))), 1) + ' dB at the edge (and a 3× wider beam), but needs fewer faces: three faces of ±60° cover 360° with overlap. Each extra face means more modules, cooling and weight. Because the antenna itself is fixed, the radar can also dedicate a different face to different jobs (search, track, communicate with a missile) at the same time.'; S.redraw();
  }
  S.draw = (c, w, h) => {
    const R = Math.min(w, h) / 2 - 22, cx = w / 2, cy = h / 2; c.fillStyle = EM.col('bg-2'); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    const cols = ['acc', 'acc2', 'ok', 'violet', 'acc3', 'pink'];
    for (let i = 0; i < st.n; i++) { const b = EM.rad(st.off + i * 360 / st.n) - Math.PI / 2, lim = EM.rad(st.lim); c.fillStyle = EM.alpha(EM.col(cols[i]), .3); c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, b - lim, b + lim); c.closePath(); c.fill(); c.strokeStyle = EM.col(cols[i]); c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, b - lim, b + lim); c.closePath(); c.stroke(); const fx = cx + Math.cos(b) * 22, fy = cy + Math.sin(b) * 22; c.save(); c.translate(fx, fy); c.rotate(b + Math.PI / 2); c.fillStyle = EM.col(cols[i]); c.fillRect(-14, -4, 28, 8); c.restore(); }
    c.strokeStyle = EM.col('line-2'); c.lineWidth = 1; for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(cx, cy, R * k / 3, 0, 7); c.stroke(); } for (let a = 0; a < 360; a += 30) { const t = EM.rad(a) - Math.PI / 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * Math.cos(t), cy + R * Math.sin(t)); c.stroke(); EM.label(c, a + '°', cx + (R + 12) * Math.cos(t), cy + (R + 12) * Math.sin(t), EM.col('muted'), { size: 9, align: 'center' }); }
  };
  upd();
});
