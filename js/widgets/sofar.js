/* sofar — sound rays in the ocean (Munk profile): the deep sound channel that carries whale calls for thousands of km */
EM.register('sofar', function (el) {
  const W = EM.widget(el, { title: 'The deep sound channel (SOFAR): why a whale can be heard across an ocean', badge: 'Try it',
    note: 'Sound speed depends on temperature and pressure: it drops with depth (cooling) to a <b>minimum at ≈ 1 km</b>, then rises again (pressure). Waves bend toward slow regions, so a sound launched near that depth is <b>trapped</b> and spreads in only two dimensions. Vertical scale is stretched about 20×.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .5 });
  const st = { zs: 1300, ang: 18, n: 15, f: .02, rays: [] };
  const ZA = 1300, B = 1300, EPS = .00737, ZMAX = 5000, XMAX = 200e3;
  const cz = z => { const e = 2 * (z - ZA) / B; return 1500 * (1 + EPS * (e - 1 + Math.exp(-e))); };
  const dcz = z => { const e = 2 * (z - ZA) / B; return 1500 * EPS * (1 - Math.exp(-e)) * 2 / B; };
  EM.slider(side, { label: 'Source depth', min: 0, max: 5000, step: 10, value: 1300, unit: 'm', onInput: v => { st.zs = v; trace(); } });
  EM.slider(side, { label: 'Launch fan: ± angle', min: 2, max: 30, step: .5, value: 18, unit: '°', onInput: v => { st.ang = v; trace(); } });
  EM.slider(side, { label: 'Number of rays', min: 5, max: 41, step: 2, value: 15, onInput: v => { st.n = v; trace(); } });
  const pre = EM.h('div', { class: 'btn-row' }); side.append(pre);
  EM.btn(pre, 'Blue whale at the channel axis', () => set(1300), 'small'); EM.btn(pre, 'Near the surface', () => set(100), 'small'); EM.btn(pre, 'Near the bottom', () => set(4800), 'small');
  const fS = EM.slider(side, { label: 'Sound frequency (for absorption)', min: 5, max: 2e5, log: true, value: 20, fmt: v => EM.freq(v), onInput: v => { st.f = v / 1000; upd(); } });
  const ro = EM.readouts(side, [['c', 'Speed at source', '', 'cool'], ['cmin', 'Channel axis speed', '', ''], ['trap', 'Trapped rays', '', 'good'], ['abs', 'Absorption', '', 'hot'], ['rng', 'Range for 60 dB absorption', '', 'fuel']]);
  function set(z) { st.zs = z; side.querySelector('input').value = z; side.querySelector('input').dispatchEvent(new Event('input')); }
  function trace() {
    st.rays = []; const n = st.n, ds = 40, nstep = XMAX / ds;
    for (let k = 0; k < n; k++) {
      const th0 = EM.rad(-st.ang + 2 * st.ang * k / (n - 1)); let x = 0, z = st.zs, th = th0, touched = false; const pts = [[0, z]];
      for (let i = 0; i < nstep; i++) {
        const k1 = -dcz(z) / cz(z); const zm = z + Math.tan(th) * ds / 2, thm = th + k1 * ds / 2;
        z += Math.tan(thm) * ds; th += -dcz(zm) / cz(zm) * ds; x += ds;
        if (z < 0) { z = -z; th = -th; touched = true; } if (z > ZMAX) { z = 2 * ZMAX - z; th = -th; touched = true; }
        if (i % 4 === 0) pts.push([x, z]);
      }
      st.rays.push({ pts, trapped: !touched });
    }
    upd();
  }
  function upd() {
    ro.set('c', EM.num(cz(st.zs), 5), 'm/s'); ro.set('cmin', EM.num(cz(ZA), 5), 'm/s at 1300 m'); ro.set('trap', st.rays.filter(r => r.trapped).length + ' of ' + st.rays.length);
    const f = st.f, a = .11 * f * f / (1 + f * f) + 44 * f * f / (4100 + f * f) + 2.75e-4 * f * f + .003;          // Thorp, dB/km
    ro.set('abs', EM.num(a, 2), 'dB/km'); ro.set('rng', EM.len(60 / a * 1000)); S.redraw();
  }
  S.draw = (c, w, h) => {
    const pl = 60, pr = 12, pt = 12, pb = 40, pw = w - pl - pr - 90, ph = h - pt - pb, X = x => pl + 90 + x / XMAX * pw, Y = z => pt + z / ZMAX * ph;
    // sound-speed profile
    const sx0 = pl, sw = 80; c.strokeStyle = EM.col('line'); c.lineWidth = 1; c.strokeRect(sx0 + .5, pt + .5, sw, ph);
    c.strokeStyle = EM.col('acc3'); c.lineWidth = 2; c.beginPath(); for (let z = 0; z <= ZMAX; z += 50) { const x = sx0 + (cz(z) - 1480) / (1555 - 1480) * sw; z ? c.lineTo(x, Y(z)) : c.moveTo(x, Y(z)); } c.stroke();
    EM.label(c, 'speed', sx0 + sw / 2, h - 26, EM.col('muted'), { size: 10, align: 'center' }); EM.label(c, '1480–1555 m/s', sx0 + sw / 2, h - 12, EM.col('muted'), { size: 9, align: 'center', weight: '500' });
    // water
    const g = c.createLinearGradient(0, Y(0), 0, Y(ZMAX)); g.addColorStop(0, EM.alpha(EM.col('acc'), .22)); g.addColorStop(1, EM.alpha('#001018', .6)); c.fillStyle = g; c.fillRect(X(0), Y(0), pw, ph);
    c.strokeStyle = EM.alpha(EM.col('acc3'), .6); c.setLineDash([5, 5]); c.beginPath(); c.moveTo(X(0), Y(ZA)); c.lineTo(X(XMAX), Y(ZA)); c.stroke(); c.setLineDash([]);
    EM.label(c, 'channel axis (1300 m)', X(XMAX) - 4, Y(ZA) - 9, EM.col('acc3'), { size: 10, align: 'right' });
    c.fillStyle = EM.col('muted'); c.font = EM.font(10); c.textAlign = 'right'; c.textBaseline = 'middle'; for (let z = 0; z <= ZMAX; z += 1000) c.fillText(z / 1000 + ' km', pl - 4 + 0, Y(z)); c.textAlign = 'center'; c.textBaseline = 'top';
    for (let x = 0; x <= XMAX; x += 50e3) c.fillText(x / 1000 + ' km', X(x), h - 36);
    for (const r of st.rays) { c.strokeStyle = r.trapped ? EM.col('ok') : EM.alpha(EM.col('text'), .55); c.lineWidth = r.trapped ? 1.8 : 1; c.beginPath(); r.pts.forEach((p, i) => i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1]))); c.stroke(); }
    c.fillStyle = EM.col('acc2'); c.beginPath(); c.arc(X(0), Y(st.zs), 6, 0, 7); c.fill();
    EM.label(c, '🐋 source', X(0) + 10, Y(st.zs) - 12, EM.col('acc2'), { size: 11, weight: '700' });
    EM.label(c, 'green = trapped in the channel (never touches surface or bottom)', X(XMAX) - 4, Y(ZMAX) - 12, EM.col('ok'), { size: 10, align: 'right' });
  };
  trace();
});
