/* particle-b — charged particle in B (out of the screen) with optional E: circles, cycloids, E x B drift */
EM.register('particle-b', function (el) {
  const W = EM.widget(el, { title: 'A charge in a magnetic field: circles, spirals, drift', badge: 'Try it',
    note: 'B points <b>out of the screen</b>. Without E the path is a circle of radius $r=mv/|q|B$. Add a sideways E and the circle slides along: the <b>E×B drift</b> $v_d=E/B$, the same for every charge and mass. This is exactly what happens to electrons in a microwave-oven magnetron (chapter 17).' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .72 });
  const parts = { e: ['Electron', -EM.C.e, EM.C.me], p: ['Proton', EM.C.e, 1.6726e-27], a: ['Alpha particle', 2 * EM.C.e, 6.6447e-27] };
  const st = { who: 'e', B: 1e-3, v: 1e6, Eover: 0, trail: [], x: 0, y: 0, vx: 1, vy: 0, t: 0 };
  function reset() { st.x = 0; st.y = 0; st.vx = 0; st.vy = 1; st.trail = []; st.t = 0; st.camx = 0; st.camy = 0; }
  EM.select(side, { label: 'Particle', options: Object.entries(parts).map(([k, v]) => [k, v[0]]), value: 'e', onChange: v => { st.who = v; reset(); upd(); } });
  EM.slider(side, { label: 'B (out of screen)', min: 1e-4, max: 1, log: true, value: 1e-3, fmt: v => EM.si(v, 'T'), onInput: v => { st.B = v; upd(); } });
  EM.slider(side, { label: 'Speed v', min: 1e4, max: 1e8, log: true, value: 1e6, fmt: v => EM.si(v, 'm/s'), onInput: v => { st.v = v; upd(); } });
  EM.slider(side, { label: 'Electric field E ⟂ B, as a fraction of v·B', min: 0, max: 1.6, step: .01, value: 0, fmt: v => v.toFixed(2), onInput: v => { st.Eover = v; reset(); upd(); } });
  EM.btn(side, '↺ Restart', () => { reset(); }, 'small');
  const ro = EM.readouts(side, [['r', 'Radius r', '', 'cool'], ['f', 'Cyclotron frequency', '', 'fuel'], ['vd', 'Drift speed E/B', '', 'hot'], ['E', 'E needed', '', '']]);
  function upd() {
    const [, q, m] = parts[st.who];
    const r = m * st.v / (Math.abs(q) * st.B), f = Math.abs(q) * st.B / (2 * Math.PI * m);
    ro.set('r', EM.len(r)); ro.set('f', EM.freq(f)); ro.set('vd', EM.si(st.Eover * st.v, 'm/s')); ro.set('E', EM.si(st.Eover * st.v * st.B, 'V/m'));
  }
  // normalised units: length r0 = m v/|q|B, time 1/omega; E' = Eover along +x; B' = +z (out of screen)
  function step(dt) {
    const s = Math.sign(parts[st.who][1]);                     // q/|q|
    // Boris pusher in 2D (B = +z, E = (Eover, 0))
    const E = st.Eover, h = dt / 2;
    let vx = st.vx + s * E * h, vy = st.vy;
    const t = s * Math.tan(h), sn = 2 * t / (1 + t * t);       // rotation about z by angle -s*... (v x B with B=z)
    const px = vx + vy * t, py = vy - vx * t;
    const qx = vx + py * sn, qy = vy - px * sn;
    st.vx = qx + s * E * h; st.vy = qy;
    st.x += st.vx * dt; st.y += st.vy * dt;
  }
  S.draw = (c, w, h) => {
    const s = Math.sign(parts[st.who][1]);
    const tr = st.trail, cx = w / 2, cy = h / 2;
    // view scale: show ~ 6 radii wide, but follow drift
    const sc = Math.min(w, h) / 6;
    const camx = st.camx || 0, camy = st.camy || 0;
    // B dots
    c.fillStyle = EM.alpha(EM.col('acc'), .35); for (let i = -6; i <= 6; i++) for (let j = -5; j <= 5; j++) { const gx = cx + (i * 70 - ((camx * sc) % 70)), gy = cy + j * 70 + ((camy * sc) % 70); c.beginPath(); c.arc(gx, gy, 2.2, 0, 7); c.fill(); }
    EM.label(c, 'B ⊙ (out of screen)', 12, 18, EM.col('acc'), { size: 12 });
    if (st.Eover > 0) { EM.arrow(c, w - 110, 24, w - 40, 24, EM.col('acc2'), 3, 11); EM.label(c, 'E', w - 30, 24, EM.col('acc2'), { size: 13, weight: '800' }); }
    c.lineWidth = 2.2; c.strokeStyle = EM.col('acc3'); c.beginPath();
    tr.forEach((p, i) => { const x = cx + (p[0] - camx) * sc, y = cy - (p[1] - camy) * sc; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    const px = cx + (st.x - camx) * sc, py = cy - (st.y - camy) * sc;
    c.fillStyle = s < 0 ? EM.col('acc') : EM.col('acc2'); c.strokeStyle = EM.col('bg'); c.lineWidth = 2; c.beginPath(); c.arc(px, py, 7, 0, 7); c.fill(); c.stroke();
    EM.label(c, s < 0 ? '−' : '+', px, py + .5, '#05141a', { size: 11, weight: '900', align: 'center' });
    EM.arrow(c, px, py, px + st.vx * 34, py - st.vy * 34, EM.col('text'), 2, 8);
  };
  reset();
  EM.loop(el, (t, dt) => {
    const n = 6, d = Math.min(.05, dt * 1.8) / n;
    for (let i = 0; i < n; i++) { step(d); st.t += d; }
    if (st.Eover > .05) { st.camx += (st.x - st.camx) * .04; st.camy += (st.y - st.camy) * .04; } else { st.camx = 0; st.camy = 0; }
    st.trail.push([st.x, st.y]); if (st.trail.length > 900) st.trail.shift();
    S.redraw();
  });
  upd(); S.redraw();
});
