/* maxwell-wave — a plane electromagnetic wave in 3-D: E, H, direction of travel (E x H), polarisation */
EM.register('maxwell-wave', function (el) {
  const W = EM.widget(el, { title: 'A plane wave: E, H and the way it travels', badge: 'Try it',
    note: 'Drag to orbit. $\\vec E$ (orange), $\\vec H$ (cyan) and the direction of travel (yellow) are mutually perpendicular, and $\\vec E\\times\\vec H$ <b>always points along the travel direction</b>. The animation is slowed down enormously: the real wave moves at 300 000 km/s.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .74, cursor: 'grab' });
  const cam = EM.cam({ yaw: -.55, pitch: .32, scale: 90 });
  const st = { pol: 'v', E0: 1, f: 100e6, show: true, t: 0 };
  EM.seg(side, [['v', 'Vertical'], ['h', 'Horizontal'], ['c', 'Circular']], 'v', v => { st.pol = v; upd(); });
  EM.slider(side, { label: 'Frequency', min: 1e3, max: 1e12, log: true, value: 1e8, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  EM.slider(side, { label: 'Electric field amplitude E₀', min: .001, max: 1000, log: true, value: 1, fmt: v => EM.si(v, 'V/m'), onInput: v => { st.E0 = v; upd(); } });
  EM.toggle(side, { label: 'Show E × H arrow', checked: true, onChange: v => { st.show = v; } });
  const ro = EM.readouts(side, [['lam', 'Wavelength λ = c/f', '', 'cool'], ['H', 'H₀ = E₀/377 Ω', '', 'cool'], ['S', 'Power density', '', 'fuel'], ['T', 'Period', '', '']]);
  const msg = EM.h('div', { class: 'info-box' }); side.append(msg);
  function upd() {
    const lam = EM.C.c / st.f, H = st.E0 / EM.C.eta0, Sd = st.E0 * st.E0 / (2 * EM.C.eta0) * (st.pol === 'c' ? 2 : 1);
    ro.set('lam', EM.len(lam)); ro.set('H', EM.si(H, 'A/m')); ro.set('S', EM.si(Sd, 'W/m²')); ro.set('T', EM.si(1 / st.f, 's'));
    msg.innerHTML = st.pol === 'c' ? '<h6>Circular</h6>Two linear waves 90° out of step: the tip of $\\vec E$ corkscrews along the beam. Satellite links and GPS use circular polarisation so the dish need not be rotated to match.' : '<h6>' + (st.pol === 'v' ? 'Vertical' : 'Horizontal') + ' polarisation</h6>The polarisation is the direction of $\\vec E$. A vertical whip antenna sends and best receives vertical waves; TV rooftop arrays are horizontal in many countries.';
    if (window.renderMath) window.renderMath(msg);
  }
  S.draw = (c, w, h) => {
    cam.cx = w / 2; cam.cy = h / 2 + 20; cam.scale = Math.min(w / 5.4, h / 2.6);
    const P = v => cam.p(v), L = 3.2, k = 2 * Math.PI / 1.6, ph = st.t * 2.2, n = 64;
    const o = P([-L / 2, 0, 0]), e = P([L / 2 + .3, 0, 0]);
    c.strokeStyle = EM.alpha(EM.col('muted'), .7); c.lineWidth = 1.5; c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(e[0], e[1]); c.stroke();
    EM.arrow(c, e[0] - 10, e[1] - 4, e[0] + 8, e[1] + 6, EM.col('muted'), 1.5, 8);
    // sample points with depth ordering: draw vectors
    const comps = (x) => { // returns [Ey,Ez] (E) in the y–z plane
      const a = Math.cos(k * x - ph), b = Math.sin(k * x - ph);
      if (st.pol === 'v') return [0, a]; if (st.pol === 'h') return [a, 0]; return [b * .9, a * .9];
    };
    const ptsE = [], ptsH = [];
    for (let i = 0; i <= n; i++) { const x = -L / 2 + L * i / n, [ey, ez] = comps(x); ptsE.push(P([x, ey, ez])); ptsH.push(P([x, -ez, ey])); }   // H = (x̂ × E)/η : (ey,ez) -> (-ez, ey)
    const draw = (pts, col, kind) => {
      c.strokeStyle = col; c.lineWidth = 2.6; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
      c.lineWidth = 1.2; c.strokeStyle = EM.alpha(col, .75);
      for (let i = 0; i <= n; i += 2) { const x = -L / 2 + L * i / n, base = P([x, 0, 0]), p = pts[i]; c.beginPath(); c.moveTo(base[0], base[1]); c.lineTo(p[0], p[1]); c.stroke(); }
    };
    // draw H first (behind or in front depending on yaw: just draw both)
    draw(ptsH, EM.col('acc'), 'H'); draw(ptsE, EM.col('acc2'), 'E');
    // phase-front plane hint (a slab at one x)
    const x0 = -L / 2 + ((ph / k) % 1.6 + 1.6) % 1.6, q = [[x0, -1, -1], [x0, 1, -1], [x0, 1, 1], [x0, -1, 1]].map(P);
    c.strokeStyle = EM.alpha(EM.col('violet'), .5); c.fillStyle = EM.alpha(EM.col('violet'), .07); c.lineWidth = 1; c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.stroke();
    if (st.show) { const a = P([-L / 2 - .3, 0, -1.1]), b = P([-L / 2 + .9, 0, -1.1]); EM.arrow(c, a[0], a[1], b[0], b[1], EM.col('acc3'), 3.5, 13); EM.label(c, 'E × H = direction of travel', a[0], a[1] + 18, EM.col('acc3'), { size: 12 }); }
    EM.label(c, 'E', 14, 20, EM.col('acc2'), { size: 14, weight: '800' }); EM.label(c, 'H', 36, 20, EM.col('acc'), { size: 14, weight: '800' });
    // wavelength marker
    const w0 = P([-L / 2, 0, -1.35]), w1 = P([-L / 2 + 1.6, 0, -1.35]); c.strokeStyle = EM.col('text-2'); c.lineWidth = 1.2; c.beginPath(); c.moveTo(w0[0], w0[1]); c.lineTo(w1[0], w1[1]); c.moveTo(w0[0], w0[1] - 4); c.lineTo(w0[0], w0[1] + 4); c.moveTo(w1[0], w1[1] - 4); c.lineTo(w1[0], w1[1] + 4); c.stroke();
    EM.label(c, 'λ = ' + EM.len(EM.C.c / st.f), (w0[0] + w1[0]) / 2, w0[1] + 14, EM.col('text-2'), { size: 12, align: 'center' });
  };
  let drag = null;
  S.pointer({ down: p => { drag = p; S.cv.style.cursor = 'grabbing'; }, move: (p, e, d) => { if (!d || !drag) return; cam.yaw += (p.x - drag.x) * .01; cam.pitch = EM.clamp(cam.pitch + (p.y - drag.y) * .008, -1.4, 1.4); drag = p; }, up: () => { drag = null; S.cv.style.cursor = 'grab'; } });
  EM.loop(el, (t, dt) => { st.t += dt; S.redraw(); });
  upd();
});
