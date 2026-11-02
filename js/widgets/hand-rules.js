/* hand-rules — F = q v x B in 3-D. Drag the picture to orbit. */
EM.register('hand-rules', function (el) {
  const W = EM.widget(el, { title: 'The right-hand rule for the magnetic force', badge: 'Try it',
    note: 'Drag the picture to orbit it. The force is always <b>perpendicular to both</b> $\\vec v$ and $\\vec B$, so a magnetic field can steer a charge but never speed it up.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .78, cursor: 'grab' });
  const cam = EM.cam({ yaw: .75, pitch: .38, scale: 120 });
  const st = { bAz: 0, bEl: 90, vAz: 0, vEl: 0, q: -1, v: 1e6, B: 1e-3 };
  const U = (az, el) => { const a = EM.rad(az), e = EM.rad(el); return [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)]; };
  const dr = () => { S.redraw(); upd(); };
  EM.seg(side, [[-1, 'Electron (−)'], [1, 'Proton (+)']], -1, v => { st.q = +v; dr(); });
  EM.slider(side, { label: 'Velocity direction: azimuth', min: -180, max: 180, step: 1, value: 0, unit: '°', onInput: v => { st.vAz = v; dr(); } });
  EM.slider(side, { label: 'Velocity direction: elevation', min: -90, max: 90, step: 1, value: 0, unit: '°', onInput: v => { st.vEl = v; dr(); } });
  EM.slider(side, { label: 'B direction: azimuth', min: -180, max: 180, step: 1, value: 0, unit: '°', onInput: v => { st.bAz = v; dr(); } });
  EM.slider(side, { label: 'B direction: elevation', min: -90, max: 90, step: 1, value: 90, unit: '°', onInput: v => { st.bEl = v; dr(); } });
  EM.slider(side, { label: 'Speed v', min: 1e4, max: 1e8, log: true, value: 1e6, unit: 'm/s', fmt: v => EM.si(v, 'm/s'), onInput: v => { st.v = v; upd(); } });
  EM.slider(side, { label: 'Field strength B', min: 1e-5, max: 1, log: true, value: 1e-3, fmt: v => EM.si(v, 'T'), onInput: v => { st.B = v; upd(); } });
  const ro = EM.readouts(side, [['th', 'Angle v–B', '', 'cool'], ['F', 'Force |F|', '', 'hot'], ['a', 'Acceleration', '', '']]);
  const rule = EM.h('div', { class: 'info-box' }); side.append(rule);
  function calc() { const v = U(st.vAz, st.vEl), b = U(st.bAz, st.bEl); const cr = EM.v3.cross(v, b); const s = EM.v3.len(cr); return { v, b, cr, s, th: EM.deg(Math.acos(EM.clamp(EM.v3.dot(v, b), -1, 1))) }; }
  function upd() {
    const k = calc(), m = st.q < 0 ? EM.C.me : 1.6726e-27, F = EM.C.e * st.v * st.B * k.s;
    ro.set('th', k.th.toFixed(0) + '°'); ro.set('F', EM.si(F, 'N')); ro.set('a', EM.si(F / m, 'm/s²', 2));
    rule.innerHTML = k.s < .03 ? '<h6>Parallel</h6>$\\vec v\\parallel\\vec B$: $\\sin\\theta=0$, no force. A charge spirals only if it has a sideways component.' :
      '<h6>The rule</h6>Fingers along $\\vec v$, curl them toward $\\vec B$: the thumb gives $\\vec F$ for a <b>positive</b> charge. ' + (st.q < 0 ? 'For an <b>electron</b> the force points the opposite way (the pink arrow already has that flip).' : 'You chose a proton, so the thumb is the pink arrow.') + ' $F=|q|vB\\sin\\theta$.';
    if (window.renderMath) window.renderMath(rule);
  }
  S.draw = (c, w, h) => {
    cam.cx = w / 2; cam.cy = h / 2 + 10; cam.scale = Math.min(w, h) * .27;
    const P = (v) => cam.p(v), k = calc();
    // axes
    c.lineWidth = 1; c.font = EM.font(11, '600');
    for (const [ax, lab] of [[[1.7, 0, 0], 'x'], [[0, 1.7, 0], 'y'], [[0, 0, 1.7], 'z']]) {
      const a = P([0, 0, 0]), b = P(ax); c.strokeStyle = EM.alpha(EM.col('muted'), .55); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      c.fillStyle = EM.col('muted'); c.fillText(lab, b[0] + 4, b[1] - 4);
    }
    // plane spanned by v and B
    const v = EM.v3.sc(k.v, 1.3), b = EM.v3.sc(k.b, 1.3), o = P([0, 0, 0]), pv = P(v), pb = P(b), pvb = P(EM.v3.add(v, b));
    c.fillStyle = EM.alpha(EM.col('violet'), .13); c.strokeStyle = EM.alpha(EM.col('violet'), .5); c.lineWidth = 1;
    c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(pv[0], pv[1]); c.lineTo(pvb[0], pvb[1]); c.lineTo(pb[0], pb[1]); c.closePath(); c.fill(); c.stroke();
    // angle arc
    if (k.s > .03) {
      c.strokeStyle = EM.col('acc3'); c.lineWidth = 1.5; c.beginPath();
      const th = EM.rad(k.th);
      for (let i = 0; i <= 24; i++) { const t = i / 24 * th, a = Math.sin(th - t) / Math.sin(th), bb = Math.sin(t) / Math.sin(th); const pt = P(EM.v3.sc(EM.v3.add(EM.v3.sc(k.v, a), EM.v3.sc(k.b, bb)), .42)); i ? c.lineTo(pt[0], pt[1]) : c.moveTo(pt[0], pt[1]); }
      c.stroke();
    }
    // force arrow (flip for electron)
    const F = EM.v3.sc(k.cr, 1.3 * st.q);
    const pF = P(F);
    EM.arrow(c, o[0], o[1], pv[0], pv[1], EM.col('acc3'), 3.2, 12); EM.label(c, 'v', pv[0] + 6, pv[1] - 8, EM.col('acc3'), { size: 14, weight: '800' });
    EM.arrow(c, o[0], o[1], pb[0], pb[1], EM.col('acc'), 3.2, 12); EM.label(c, 'B', pb[0] + 6, pb[1] - 8, EM.col('acc'), { size: 14, weight: '800' });
    if (k.s > .03) { EM.arrow(c, o[0], o[1], pF[0], pF[1], EM.col('pink'), 3.6, 13); EM.label(c, 'F', pF[0] + 6, pF[1] - 8, EM.col('pink'), { size: 14, weight: '800' }); }
    c.fillStyle = EM.col('text'); c.beginPath(); c.arc(o[0], o[1], 4, 0, 7); c.fill();
    EM.label(c, (st.q < 0 ? '−' : '+') + ' charge', 12, 18, EM.col('text-2'), { size: 12 });
  };
  let drag = null;
  S.pointer({ down: (p) => { drag = p; S.cv.style.cursor = 'grabbing'; }, move: (p, e, d) => { if (!d || !drag) return; cam.yaw += (p.x - drag.x) * .01; cam.pitch = EM.clamp(cam.pitch + (p.y - drag.y) * .008, -1.4, 1.4); drag = p; S.redraw(); }, up: () => { drag = null; S.cv.style.cursor = 'grab'; } });
  upd(); S.redraw();
});
