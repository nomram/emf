/* presence-radar — a room seen by a small mm-wave presence radar: range-azimuth map, moving vs still vs sleeping people, range limits */
EM.register('presence-radar', function (el) {
  const W = EM.widget(el, { title: 'A presence radar in a room: who does it see?', badge: 'Try it',
    note: 'The sensor on the top wall transmits a short-range mm-wave signal and builds a <b>range–angle map</b> (a small MIMO array gives ≈ 15–30° angular resolution; a 4 GHz sweep gives ≈ 4 cm range resolution). Different states need different echo strength: <b>moving</b> (large Doppler) is easiest, <b>sitting still</b> (small micro-motion), <b>asleep</b> (breathing only), <b>vital signs</b> (millimetre phase wobble) hardest. Typical datasheet-level ranges at 10 mW are scaled here by the radar equation ($R\\propto P^{1/4}$); walls cost $2L$ dB two-way. <b>Drag the people</b>; click a person to cycle their state.' });
  const { main, side } = W.grid('wide-side');
  const S = EM.canvas(main, { aspect: .8, cursor: 'grab' });
  const st = { P: 10, wall: 0, ghost: true, people: [{ x: -1.2, y: 2.6, s: 'walk', ph: 0 }, { x: 1.6, y: 4.2, s: 'sit', ph: 1 }, { x: .2, y: 5.5, s: 'sleep', ph: 2 }], drag: -1, t: 0 };
  const ROOM = { w: 6, d: 7 }, BASE = { walk: 12, sit: 6, sleep: 4, vital: 2 };
  EM.slider(side, { label: 'Radar transmit power (EIRP)', min: 1, max: 100, log: true, value: 10, fmt: v => EM.num(v, 3) + ' mW', onInput: v => { st.P = v; upd(); } });
  EM.slider(side, { label: 'Wall between radar and the people', min: 0, max: 25, step: 1, value: 0, fmt: v => v ? v + ' dB each way (' + (v < 6 ? 'thin plasterboard' : v < 14 ? 'brick/chipboard' : 'concrete') + ')' : 'none', onInput: v => { st.wall = v; upd(); } });
  EM.toggle(side, { label: 'Show multipath ghosts (reflections off the side walls)', checked: true, onChange: v => { st.ghost = v; } });
  const row = EM.h('div', { class: 'btn-row' }); side.append(row); [['Add person', () => { if (st.people.length < 5) st.people.push({ x: (Math.random() - .5) * 4, y: 1.5 + Math.random() * 5, s: 'sit', ph: Math.random() * 6 }); upd(); }], ['Remove last', () => { st.people.pop(); upd(); }]].forEach(([t, f]) => EM.btn(row, t, f, 'small'));
  const ro = EM.readouts(side, [['walk', 'Reliable range: walking', '', 'good'], ['sit', 'Presence when still', '', 'cool'], ['sleep', 'Sleeping (breathing)', '', 'fuel'], ['vital', 'Heart/breath rate', '', 'hot'], ['n', 'People counted now', '', '']]);
  const list = EM.h('div', { class: 'info-box' }); side.append(list);
  const scale = () => Math.pow(st.P / 10, .25) * Math.pow(10, -2 * st.wall / 40);
  const rng = s => BASE[s] * scale();
  const STATES = ['walk', 'sit', 'sleep', 'vital'], LAB = { walk: 'walking', sit: 'sitting still', sleep: 'asleep', vital: 'vital-sign mode (stationary)' };
  function upd() {
    ro.set('walk', EM.num(rng('walk'), 3), 'm'); ro.set('sit', EM.num(rng('sit'), 3), 'm'); ro.set('sleep', EM.num(rng('sleep'), 3), 'm'); ro.set('vital', EM.num(rng('vital'), 3), 'm');
    let n = 0; list.innerHTML = '<h6>What the sensor decides</h6>' + st.people.map((p, i) => { const r = Math.hypot(p.x, p.y), lim = p.s === 'sleep' ? rng('sleep') : p.s === 'vital' ? rng('vital') : rng(p.s), ok = r <= lim; if (ok) n++; return '<div>Person ' + (i + 1) + ' (' + LAB[p.s] + ') at ' + EM.num(r, 2) + ' m: ' + (ok ? '<b style="color:var(--ok)">detected</b>' + (p.s === 'vital' ? ' with heart/breath rate' : '') : '<b style="color:var(--bad)">missed</b> (limit ' + EM.num(lim, 2) + ' m)') + '</div>'; }).join('') + '<div class="muted" style="margin-top:6px">Applications: lights and HVAC that follow occupancy, fall detection and sleep monitoring for older people, “child left in the car” alarms (required or rewarded in new vehicles), smart-speaker gestures, queue counting. It sees shapes and motion, not faces: a privacy advantage over cameras, with its own consent issues.</div>';
    ro.set('n', n + ' of ' + st.people.length); S.redraw();
  }
  S.draw = (c, w, hh) => {
    const sc = Math.min((w - 20) / ROOM.w, (hh - 30) / ROOM.d), ox = w / 2, oy = 14, X = x => ox + x * sc, Y = y => oy + y * sc;
    c.fillStyle = EM.col('bg-2'); c.fillRect(X(-ROOM.w / 2), Y(0), ROOM.w * sc, ROOM.d * sc); c.strokeStyle = EM.col('text-2'); c.lineWidth = 3; c.strokeRect(X(-ROOM.w / 2), Y(0), ROOM.w * sc, ROOM.d * sc);
    if (st.wall > 0) { c.fillStyle = EM.alpha(EM.col('muted'), .55); c.fillRect(X(-ROOM.w / 2), Y(1.2), ROOM.w * sc, 6); EM.label(c, 'wall (' + st.wall + ' dB)', X(-ROOM.w / 2) + 6, Y(1.2) - 8, EM.col('muted'), { size: 10 }); }
    // range–angle heat map (polar blobs)
    const N = 90, off = S.off || (S.off = EM.offscreen(N, Math.round(N * ROOM.d / ROOM.w))), oc = off.getContext('2d'), gw = off.width, gh = off.height, img = oc.getImageData(0, 0, gw, gh);
    const sig = (px, py) => { let v = 0.015; for (const p of st.people) { const r = Math.hypot(p.x, p.y), lim = p.s === 'walk' ? rng('walk') : p.s === 'sit' ? rng('sit') : p.s === 'sleep' ? rng('sleep') : rng('vital'), amp = Math.min(1.4, Math.pow(lim / Math.max(r, .3), 2) * .7) * (p.s === 'walk' ? 1 : .8 + .2 * Math.sin(st.t * 2 + p.ph)); const add = (qx, qy, a) => { const rr = Math.hypot(qx, qy), ar = Math.atan2(qx, qy), r0 = Math.hypot(px, py), a0 = Math.atan2(px, py); v += a * Math.exp(-Math.pow((r0 - rr) / .22, 2) - Math.pow((a0 - ar) / .17, 2)); }; add(p.x, p.y, amp); if (st.ghost) { add(-ROOM.w - p.x, p.y, amp * .22); add(ROOM.w - p.x, p.y, amp * .22); } } return v; };
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const px = (i / gw - .5) * ROOM.w, py = (j / gh) * ROOM.d, a = sig(px, py), col = EM.heat(EM.clamp(a, 0, 1)), o = (j * gw + i) * 4; img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = Math.min(235, 40 + a * 360); }
    oc.putImageData(img, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(off, X(-ROOM.w / 2), Y(0), ROOM.w * sc, ROOM.d * sc);
    // field of view arcs
    c.strokeStyle = EM.alpha(EM.col('acc'), .5); c.setLineDash([4, 5]); for (const r of [2, 4, 6]) { c.beginPath(); c.arc(X(0), Y(0), r * sc, .05, Math.PI - .05); c.stroke(); EM.label(c, r + ' m', X(0) + r * sc - 4, Y(0) + 11, EM.col('acc'), { size: 9, align: 'right' }); } c.setLineDash([]);
    c.fillStyle = EM.col('acc3'); c.fillRect(X(0) - 12, Y(0) - 7, 24, 8); EM.label(c, 'radar sensor', X(0) + 18, Y(0) - 3, EM.col('acc3'), { size: 10, weight: '700' });
    st.people.forEach((p, i) => { const r = Math.hypot(p.x, p.y), lim = rng(p.s), ok = r <= lim; c.fillStyle = ok ? EM.col('ok') : EM.col('bad'); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(X(p.x), Y(p.y), 8, 0, 7); c.fill(); c.stroke(); EM.label(c, '' + (i + 1), X(p.x), Y(p.y), '#fff', { size: 10, align: 'center', weight: '800' }); EM.label(c, LAB[p.s], X(p.x), Y(p.y) + 20, EM.col('text'), { size: 10, align: 'center', bg: EM.alpha(EM.col('bg'), .6) }); });
    S.g = { X: sc, ox, oy };
  };
  S.pointer({ down: p => { const g = S.g; let best = -1, bd = 18; st.people.forEach((q, i) => { const d = Math.hypot(g.ox + q.x * g.X - p.x, g.oy + q.y * g.X - p.y); if (d < bd) { bd = d; best = i; } }); st.drag = best; st.moved = false; }, move: (p, e, d) => { if (d && st.drag >= 0) { const g = S.g; st.people[st.drag].x = EM.clamp((p.x - g.ox) / g.X, -ROOM.w / 2 + .2, ROOM.w / 2 - .2); st.people[st.drag].y = EM.clamp((p.y - g.oy) / g.X, .4, ROOM.d - .2); st.moved = true; upd(); } }, up: () => { if (st.drag >= 0 && !st.moved) { const q = st.people[st.drag]; q.s = STATES[(STATES.indexOf(q.s) + 1) % 4]; upd(); } st.drag = -1; } });
  EM.loop(el, (t, dt) => { st.t += dt; st.people.forEach(p => { if (p.s === 'walk') { p.x += Math.sin(st.t * .7 + p.ph) * dt * .5; p.y = EM.clamp(p.y + Math.cos(st.t * .5 + p.ph) * dt * .4, .6, ROOM.d - .3); p.x = EM.clamp(p.x, -ROOM.w / 2 + .3, ROOM.w / 2 - .3); } }); S.redraw(); if (((st.k = (st.k || 0) + 1) % 10) === 0) upd(); });
  upd();
});
