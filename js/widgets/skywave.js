/* skywave — HF radio bouncing off the ionosphere around the curve of the Earth (single/multi-hop), MUF, skip zone */
EM.register('skywave', function (el) {
  const W = EM.widget(el, { title: 'Bouncing off the sky: how shortwave goes around the Earth', badge: 'Try it',
    note: 'The ionosphere is a layer of free electrons that <b>refracts</b> HF waves back down, if the wave is not too fast. A ray at incidence angle $\\varphi$ on a layer with critical frequency $f_c$ is reflected only if $f<f_c\\sec\\varphi$ (the <b>maximum usable frequency</b>, MUF). Above that it escapes to space (that is how VHF and satellite links work). The low-angle ray travels farthest; steep rays come down close by. Real layers change hour by hour: the numbers here are typical.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .5 });
  const R = 6371, st = { f: 14, beta: 12, h: 300, fc: 8, day: true, hops: 3 };
  EM.seg(side, [['day', 'Daytime'], ['night', 'Night']], 'day', v => { st.day = v === 'day'; st.fc = st.day ? 8 : 3.8; fcS.set(st.fc, true); upd(); });
  EM.seg(side, [[300, 'F2 layer (300 km)'], [110, 'E layer (110 km)']], 300, v => { st.h = +v; st.fc = v == 300 ? (st.day ? 8 : 3.8) : (st.day ? 3.2 : .5); fcS.set(st.fc, true); upd(); });
  const fcS = EM.slider(side, { label: 'Layer critical frequency f_c (solar activity)', min: .5, max: 14, step: .1, value: 8, fmt: v => v.toFixed(1) + ' MHz', onInput: v => { st.fc = v; upd(); } });
  const fS = EM.slider(side, { label: 'Your transmit frequency', min: 1.5, max: 50, step: .1, value: 14, fmt: v => v.toFixed(1) + ' MHz', onInput: v => { st.f = v; upd(); } });
  const bS = EM.slider(side, { label: 'Take-off angle above the horizon', min: 1, max: 85, step: 1, value: 12, unit: '°', onInput: v => { st.beta = v; upd(); } });
  const pre = EM.h('div', { class: 'btn-row' }); side.append(pre);
  [['20 m band 14 MHz', 14], ['40 m band 7 MHz', 7], ['80 m band 3.6 MHz', 3.6], ['10 m band 28 MHz', 28], ['FM 100 MHz', 50]].forEach(([t, v]) => EM.btn(pre, t, () => { fS.set(v); }, 'small'));
  const ro = EM.readouts(side, [['hop', 'One hop reaches', '', 'cool'], ['muf', 'MUF at this angle', '', 'fuel'], ['luf', 'Lowest usable (D-layer absorption)', '', ''], ['max', 'Longest single hop', '', ''], ['st', 'Status', '', 'hot']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function geo() {
    const b = EM.rad(st.beta), phi = Math.asin(Math.min(1, R * Math.cos(b) / (R + st.h))), muf = st.fc / Math.cos(phi), hop = 2 * R * (Math.PI / 2 - b - phi);
    const phi0 = Math.asin(R / (R + st.h)); return { b, phi, muf, hop: Math.max(0, hop), max: 2 * R * (Math.PI / 2 - phi0), muf0: st.fc / Math.cos(phi0) };
  }
  function upd() {
    const g = geo(), luf = st.day ? 6 : 1.8, reflect = st.f < g.muf, absorbed = st.f < luf;
    ro.set('hop', reflect ? EM.num(g.hop, 4) + ' km' : '— (escapes)'); ro.set('muf', EM.num(g.muf, 3), 'MHz'); ro.set('luf', EM.num(luf, 2), 'MHz'); ro.set('max', EM.num(g.max, 4) + ' km (MUF ' + g.muf0.toFixed(0) + ' MHz)');
    ro.set('st', absorbed ? 'absorbed by the D layer' : reflect ? 'REFLECTED: skip works' : 'penetrates the layer');
    info.innerHTML = reflect && !absorbed ? '<h6>Skip</h6>The signal lands <b>' + EM.num(g.hop, 4) + ' km</b> away and can hop again from the ground (or sea), up to several times: around the world with a few watts. Between your antenna (ground wave, tens of km) and the landing point is the <b>skip zone</b>, where you can’t be heard. Lower the angle for longer hops; raise it for “near vertical incidence skywave” (NVIS, 0–500 km) on lower frequencies.' : absorbed ? '<h6>Too low</h6>In daytime the D layer (60–90 km) is dense with collisions: it soaks up signals below about 6–8 MHz. That is why AM stations are heard only locally in daylight but far away at night.' : '<h6>Too high</h6>The wave is not refracted enough and passes through the layer. The higher the frequency, the less the ionosphere bends it: above ≈ 30–50 MHz (VHF), only exceptional layers (sporadic-E) reflect, and satellites can be reached through the ionosphere.';
    S.redraw();
  }
  function path() {
    const g = geo(), b = EM.rad(st.beta), pts = [], reflect = st.f < g.muf; let pos = [R, 0], dir = [Math.sin(b), Math.cos(b)], seg = [pos.slice()];
    const hit = (p, d, r, down) => { const pd = p[0] * d[0] + p[1] * d[1], c = p[0] * p[0] + p[1] * p[1] - r * r, disc = pd * pd - c; if (disc < 0) return null; const s1 = -pd - Math.sqrt(disc), s2 = -pd + Math.sqrt(disc); return down ? (s1 > 1e-6 ? s1 : s2) : (s2 > 1e-6 ? s2 : null); };
    for (let hop = 0; hop < st.hops; hop++) {
      const s = hit(pos, dir, R + st.h, false); if (s == null) break; const P = [pos[0] + dir[0] * s, pos[1] + dir[1] * s]; pts.push([pos, P]);
      if (!reflect) { const e = hit(P, dir, R + 2200, false); const Q = [P[0] + dir[0] * (e || 1500), P[1] + dir[1] * (e || 1500)]; pts.push([P, Q]); return pts; }
      const n = [P[0] / (R + st.h), P[1] / (R + st.h)], dn = dir[0] * n[0] + dir[1] * n[1]; dir = [dir[0] - 2 * dn * n[0], dir[1] - 2 * dn * n[1]];
      const s2 = hit(P, dir, R, true); if (s2 == null) break; const Q = [P[0] + dir[0] * s2, P[1] + dir[1] * s2]; pts.push([P, Q]);
      const nq = [Q[0] / R, Q[1] / R], dq = dir[0] * nq[0] + dir[1] * nq[1]; dir = [dir[0] - 2 * dq * nq[0], dir[1] - 2 * dq * nq[1]]; pos = Q;
    }
    return pts;
  }
  S.draw = (c, w, h) => {
    const amax = EM.rad(46), sc = (w - 40) / (R * amax) * 1.0, Rpx = R * sc, amid = amax / 2, gy = h * .6, cx0 = w / 2, cy0 = gy + Rpx;
    const P = (r, a) => [cx0 + r * sc * Math.sin(a - amid), cy0 - r * sc * Math.cos(a - amid)], PA = p => { const r = Math.hypot(p[0], p[1]), a = Math.atan2(p[1], p[0]); return P(r, a); };
    // sky gradient
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, EM.alpha(EM.col('violet'), .18)); gr.addColorStop(1, 'transparent'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    // ionosphere layers
    const layer = (hh, col, lab, al) => { c.strokeStyle = EM.alpha(EM.col(col), al); c.lineWidth = 12 * (hh > 200 ? 1.3 : 1); c.beginPath(); for (let i = 0; i <= 80; i++) { const a = -EM.rad(4) + (amax + EM.rad(8)) * i / 80, p = P(R + hh, a); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); EM.label(c, lab, w - 8, P(R + hh, amax + EM.rad(4))[1] - 12, EM.col(col), { size: 10, weight: '700', align: 'right' }); };
    if (st.day) layer(75, 'bad', 'D layer ≈ 75 km (day only: absorbs)', .25); layer(110, 'acc', 'E layer ≈ 110 km', st.h === 110 ? .6 : .25); layer(300, 'violet', 'F2 layer ≈ 300 km', st.h === 300 ? .6 : .25);
    // Earth
    c.fillStyle = EM.alpha(EM.col('ok'), .22); c.beginPath(); c.moveTo(0, h); for (let i = 0; i <= 120; i++) { const a = -EM.rad(6) + (amax + EM.rad(12)) * i / 120, p = P(R, a); c.lineTo(p[0], p[1]); } c.lineTo(w, h); c.closePath(); c.fill();
    c.strokeStyle = EM.col('ok'); c.lineWidth = 2.5; c.beginPath(); for (let i = 0; i <= 120; i++) { const a = -EM.rad(6) + (amax + EM.rad(12)) * i / 120, p = P(R, a); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    // rays
    const segs = path(), g = geo(), reflect = st.f < g.muf, ok = reflect && st.f >= (st.day ? 6 : 1.8);
    c.lineWidth = 2.4; c.strokeStyle = ok ? EM.col('acc3') : (reflect ? EM.alpha(EM.col('bad'), .8) : EM.col('acc2'));
    c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
    for (const [a, b] of segs) { const pa = PA(a), pb = PA(b); c.beginPath(); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.stroke(); }
    c.restore();
    // landing marks
    const tx = PA([R, 0]); c.fillStyle = EM.col('text'); c.fillRect(tx[0] - 1, tx[1] - 16, 3, 16); EM.label(c, 'TX', tx[0], tx[1] - 24, EM.col('text'), { size: 11, align: 'center', weight: '800' });
    if (ok) segs.forEach(([a, b], i) => { if (i % 2 === 1) { const pb = PA(b); if (pb[0] < w) { c.fillStyle = EM.col('ok'); c.beginPath(); c.arc(pb[0], pb[1], 5, 0, 7); c.fill(); EM.label(c, EM.num(Math.atan2(b[1], b[0]) * R, 3) + ' km', pb[0], pb[1] + 18, EM.col('ok'), { size: 10, align: 'center', weight: '700' }); } } });
    // skip zone + ground wave
    if (ok) { const sx = tx[0], ex = PA(segs[1][1])[0]; c.fillStyle = EM.alpha(EM.col('bad'), .15); c.fillRect(sx + 40, h - 24, ex - sx - 44, 14); EM.label(c, 'skip zone (silent)', (sx + 40 + ex) / 2, h - 17, EM.col('bad'), { size: 10, align: 'center' }); c.fillStyle = EM.alpha(EM.col('acc'), .3); c.fillRect(sx, h - 24, 38, 14); EM.label(c, 'ground wave', sx + 19, h - 33, EM.col('acc'), { size: 9, align: 'center' }); }
  };
  upd();
});
