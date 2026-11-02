/* accel-charge — electric field lines of a point charge from retarded (Lienard-Wiechert) fields, c = 1.
   Motion is along the vertical axis; the picture is the plane containing that axis. */
EM.register('accel-charge', function (el) {
  const W = EM.widget(el, { title: 'Only acceleration makes a wave', badge: 'Try it',
    note: 'Field lines are traced from the exact retarded fields of a moving charge. A <b>ring</b> marks how far “the news” has travelled at the speed of light since the charge was shoved.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .66 });
  const st = { mode: 'kick', beta: .55, omega: 2.6, slow: .5, t: 0 };
  const T0 = 1.0, TW = 0.1, CYC = 4.6, VIEW = 2.3;

  function traj(tau) {   // -> [y, beta, betadot]
    if (st.mode === 'rest') return [0, 0, 0];
    if (st.mode === 'uniform') return [st.beta * tau, st.beta, 0];
    if (st.mode === 'osc') { const A = Math.min(.9, st.beta) / st.omega; return [A * Math.sin(st.omega * tau), A * st.omega * Math.cos(st.omega * tau), -A * st.omega * st.omega * Math.sin(st.omega * tau)]; }
    const b0 = st.beta;                                 // sudden stop at t = T0 over duration TW
    if (tau < T0) return [b0 * tau, b0, 0];
    const s = (tau - T0) / TW;
    if (s >= 1) return [b0 * (T0 + TW * .5), 0, 0];
    return [b0 * (T0 + TW * (s - s * s * s + s * s * s * s / 2)), b0 * (1 - (3 * s * s - 2 * s * s * s)), -b0 * (6 * s - 6 * s * s) / TW];
  }
  function field(px, py, t) {
    let tr = t - Math.hypot(px, py) - 0;            // first guess
    let y, b, bd, R, nx, ny;
    for (let i = 0; i < 40; i++) {
      const T = traj(tr); y = T[0];
      R = Math.hypot(px, py - y); const trn = t - R;
      if (Math.abs(trn - tr) < 1e-7) { tr = trn; break; }
      tr = trn;
    }
    [y, b, bd] = traj(tr);
    R = Math.max(1e-4, Math.hypot(px, py - y)); nx = px / R; ny = (py - y) / R;
    const kap = 1 - ny * b, g = (1 - b * b);
    const ndb = ny * bd, nmx = nx, nmy = ny - b;
    const t1x = nmx * g / (kap * kap * kap * R * R), t1y = nmy * g / (kap * kap * kap * R * R);
    const t2x = (nmx * ndb - 0) / (kap * kap * kap * R), t2y = (nmy * ndb - bd * kap) / (kap * kap * kap * R);
    return [t1x + t2x, t1y + t2y];
  }
  const modes = EM.seg(side, [['rest', 'At rest'], ['uniform', 'Constant speed'], ['kick', 'Sudden stop'], ['osc', 'Oscillating']], 'kick', v => { st.mode = v; st.t = 0; upd(); });
  const sb = EM.slider(side, { label: 'Speed (fraction of c)', min: .1, max: .8, step: .01, value: .55, onInput: v => { st.beta = v; } });
  const so = EM.slider(side, { label: 'Oscillation frequency ω (rad per unit time)', min: 1, max: 5, step: .05, value: 2.6, onInput: v => { st.omega = v; } });
  const ss = EM.slider(side, { label: 'Slow motion', min: .1, max: 1, step: .01, value: .5, fmt: v => v.toFixed(2) + '×', onInput: v => { st.slow = v; } });
  const row = EM.h('div', { class: 'btn-row' }); side.append(row);
  const pb = EM.btn(row, 'Pause', () => { lp.pause(!lp.paused); pb.textContent = lp.paused ? 'Play' : 'Pause'; }, 'small');
  EM.btn(row, '↺ Replay', () => { st.t = 0; }, 'small');
  const ro = EM.readouts(side, [['v', 'Speed', '', 'cool'], ['a', 'Acceleration', '', 'hot'], ['rad', 'Radiating?', '', 'good']]);
  const msg = EM.h('div', { class: 'info-box' }); side.append(msg);
  function upd() {
    so.el.style.display = st.mode === 'osc' ? '' : 'none';
    sb.setLabel(st.mode === 'osc' ? 'Peak speed (fraction of c)' : 'Speed (fraction of c)');
    msg.innerHTML = {
      rest: '<h6>No motion</h6>Field lines are straight and radial. Nothing changes, so nothing travels.',
      uniform: '<h6>Constant velocity</h6>The view follows the charge. The lines are still straight, only squashed sideways (a relativistic effect). The field simply rides along: <b>no radiation</b>. This is a steady current.',
      kick: '<h6>The kink</h6>Outside the ring the field “doesn’t know” the charge stopped, and still points from where it <em>would</em> be. Inside it points from the new place. The strip between must connect them: a sideways kink, which is a pulse of <b>transverse E</b> carrying energy outward.',
      osc: '<h6>Shaking charge</h6>Each swing sends out kinks of alternating sign: a continuous wave. This is a transmitting antenna, an alternating current.',
    }[st.mode];
  }
  S.draw = (c, w, h) => {
    const tt = st.t, cyc = tt % CYC;
    const tau = st.mode === 'osc' || st.mode === 'uniform' ? tt : cyc;
    const [yc, bc, ac] = traj(tau);
    const camY = st.mode === 'uniform' ? yc : 0, sc = Math.min(w, h) / (2 * VIEW) * (w > h ? 1.15 : 1);
    const X = x => w / 2 + x * sc, Y = y => h / 2 - (y - camY) * sc;
    // background grid hint
    c.strokeStyle = EM.alpha(EM.col('line'), .6); c.lineWidth = 1;
    for (let r = 1; r <= 3; r++) { c.beginPath(); c.arc(X(0), Y(camY), r * sc, 0, 7); c.stroke(); }
    // shock rings (kick only)
    if (st.mode === 'kick' && cyc > T0) {
      const y0 = traj(T0)[0];
      for (const [r, a] of [[cyc - T0, .9], [cyc - T0 - TW, .9]]) if (r > 0) {
        c.setLineDash([6, 5]); c.strokeStyle = EM.alpha(EM.col('acc3'), a); c.lineWidth = 1.5; c.beginPath(); c.arc(X(0), Y(y0), r * sc, 0, 7); c.stroke(); c.setLineDash([]);
      }
      EM.label(c, 'news of the stop travels at c', X(0) + (cyc - T0) * sc * .72 + 8, Y(y0) - (cyc - T0) * sc * .72 - 8, EM.col('acc3'), { size: 11 });
    }
    // field lines
    const N = 22, ds = .025, lim = VIEW * 1.5;
    c.lineWidth = 1.7; c.strokeStyle = EM.col('acc2');
    for (let k = 0; k < N; k++) {
      const th = (k + .5) / N * 2 * Math.PI, e0 = .06;
      let x = e0 * Math.cos(th), y = yc + e0 * Math.sin(th);
      c.beginPath(); c.moveTo(X(x), Y(y));
      for (let i = 0; i < 520; i++) {
        let [fx, fy] = field(x, y, tau), m = Math.hypot(fx, fy); if (!(m > 0)) break; fx /= m; fy /= m;
        const [gx, gy] = field(x + fx * ds / 2, y + fy * ds / 2, tau), mm = Math.hypot(gx, gy) || 1;
        x += gx / mm * ds; y += gy / mm * ds;
        c.lineTo(X(x), Y(y));
        if (Math.abs(x) > lim || Math.abs(y - camY) > lim) break;
      }
      c.stroke();
    }
    // charge
    c.fillStyle = EM.col('acc3'); c.strokeStyle = EM.col('bg'); c.lineWidth = 2; c.beginPath(); c.arc(X(0), Y(yc), 8, 0, 7); c.fill(); c.stroke();
    EM.label(c, '+', X(0), Y(yc) + .5, '#1a1200', { size: 13, weight: '900', align: 'center' });
    EM.label(c, { rest: 'a = 0', uniform: 'a = 0', kick: Math.abs(ac) > .01 ? 'a ≠ 0 right now!' : (cyc < T0 ? 'a = 0 (coasting)' : 'a = 0 (stopped)'), osc: 'a ≠ 0 all the time' }[st.mode], 12, 20, EM.col('text-2'), { size: 12 });
    ro.set('v', bc.toFixed(2), 'c'); ro.set('a', Math.abs(ac) < .005 ? '0' : EM.num(ac, 2), 'c²'); ro.set('rad', Math.abs(ac) > .01 || st.mode === 'osc' ? 'yes' : (st.mode === 'kick' && cyc > T0 && cyc < T0 + 3.4 ? 'pulse in flight' : 'no'));
  };
  const lp = EM.loop(el, (t, dt) => { st.t += dt * st.slow * 1.0; S.redraw(); });
  upd(); S.redraw();
});
