/* solenoid-field — magnetic field lines of N current rings (numerical Biot–Savart), a loop becoming an electromagnet */
EM.register('solenoid-field', function (el) {
  const W = EM.widget(el, { title: 'From a loop to an electromagnet', badge: 'Try it',
    note: 'Cross-section through the axis. <b>⊙</b> = current toward you, <b>⊗</b> = away. Field lines come from the exact Biot–Savart sum over every ring. Inside a long coil the field is nearly uniform; outside it spreads like a bar magnet.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const st = { N: 8, L: 4, I: 2, mur: 1, lines: null };
  EM.slider(side, { label: 'Turns N', min: 1, max: 20, step: 1, value: 8, onInput: v => { st.N = v; build(); } });
  EM.slider(side, { label: 'Length L (in coil radii)', min: .2, max: 8, step: .1, value: 4, fmt: v => v.toFixed(1) + ' a', onInput: v => { st.L = v; build(); } });
  EM.slider(side, { label: 'Current I (negative reverses)', min: -10, max: 10, step: .1, value: 2, unit: 'A', onInput: v => { st.I = v; build(); } });
  const mu = EM.select(side, { label: 'Core material', options: [[1, 'Air (μr = 1)'], [100, 'Ferrite (μr ≈ 100)'], [5000, 'Iron (μr ≈ 5000)']], value: 1, onChange: v => { st.mur = +v; upd(); } });
  const a_in = EM.slider(side, { label: 'Coil radius a', min: .005, max: .1, log: true, value: .02, fmt: v => EM.len(v), onInput: v => { st.a = v; upd(); } }); st.a = .02;
  const ro = EM.readouts(side, [['B', 'B inside (long coil)', '', 'cool'], ['n', 'Turns per metre', '', ''], ['m', 'Magnetic moment', '', 'fuel']]);
  side.append(EM.h('div', { class: 'info-box', html: '<h6>Long-coil formula</h6>$B=\\mu_0\\mu_r\\dfrac{N I}{L}$. More turns, more current or a magnetic core all raise B. The <b>amp-turns</b> $NI$ is what really counts.' }));
  function upd() {
    const Lm = st.L * st.a, Bi = EM.C.mu0 * st.mur * st.N * Math.abs(st.I) / Lm;
    ro.set('B', EM.si(Bi, 'T') + (st.L < 3 ? ' *' : '')); ro.set('n', EM.num(st.N / Lm, 3), '/m'); ro.set('m', EM.si(st.N * st.I * Math.PI * st.a * st.a, 'A·m²', 2));
  }
  function Bfield(x, z, rings) {
    let bx = 0, bz = 0; const M = 36, dphi = 2 * Math.PI / M;
    for (const z0 of rings) { const D = z - z0; for (let k = 0; k < M; k++) { const ph = (k + .5) * dphi, c = Math.cos(ph), s = Math.sin(ph); const rx = x - c, ry = -s, r2 = rx * rx + ry * ry + D * D, r3 = Math.pow(r2 + 1e-4, 1.5); bx += c * D / r3; bz += (1 - c * x) / r3; } }
    return [bx * dphi, bz * dphi];
  }
  function build() {
    const N = st.N, L = st.L, rings = []; for (let k = 0; k < N; k++) rings.push(N === 1 ? 0 : -L / 2 + L * k / (N - 1));
    const lines = [], VZ = L / 2 + 4.2, VX = 3.4, sgn = Math.sign(st.I) || 1;
    for (let i = 0; i < 9; i++) {
      const x0 = -.9 + 1.8 * i / 8;
      for (const dir of [1, -1]) {
        let x = x0, z = 0; const pts = [[z, x]];
        for (let n = 0; n < 700; n++) {
          let [bx, bz] = Bfield(x, z, rings); let m = Math.hypot(bx, bz) || 1; bx = bx / m * dir * sgn; bz = bz / m * dir * sgn;
          const ds = .09; const [cx, cz] = Bfield(x + bx * ds / 2, z + bz * ds / 2, rings); const mm = Math.hypot(cx, cz) || 1;
          x += cx / mm * dir * sgn * ds; z += cz / mm * dir * sgn * ds; pts.push([z, x]);
          if (Math.abs(x) > VX * 1.2 || Math.abs(z) > VZ * 1.2) break;
        }
        lines.push({ pts, dir });
      }
    }
    st.lines = lines; st.rings = rings; upd(); S.redraw();
  }
  S.draw = (c, w, h) => {
    if (!st.lines) return;
    const VZ = st.L / 2 + 4.2, sc = w / (2 * VZ), cx = w / 2, cy = h / 2;
    const X = z => cx + z * sc, Y = x => cy - x * sc, sgn = Math.sign(st.I) || 1;
    for (const ln of st.lines) {
      const col = st.I === 0 ? EM.col('muted') : EM.col('acc'); c.strokeStyle = EM.alpha(col, .75); c.lineWidth = 1.6; c.beginPath();
      ln.pts.forEach((p, i) => { i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1])); }); c.stroke();
      if (ln.dir === 1) for (let i = 25; i < ln.pts.length - 2; i += 40) { // arrowheads (forward half only)
        const p = ln.pts[i], q = ln.pts[i + 1], dx = X(q[0]) - X(p[0]), dy = Y(q[1]) - Y(p[1]); EM.arrow(c, X(p[0]) - dx * 2, Y(p[1]) - dy * 2, X(p[0]) + dx * 2, Y(p[1]) + dy * 2, col, 1.4, 8);
      }
    }
    // coil
    c.fillStyle = EM.alpha(EM.col('acc2'), .18); c.strokeStyle = EM.col('acc2'); c.lineWidth = 1;
    const l0 = X(-st.L / 2) - 8, l1 = X(st.L / 2) + 8; c.fillRect(l0, Y(1.15), l1 - l0, Y(-1.15) - Y(1.15)); c.strokeRect(l0, Y(1.15), l1 - l0, Y(-1.15) - Y(1.15));
    for (const z0 of st.rings) for (const [x, up] of [[1, 1], [-1, -1]]) {
      const px = X(z0), py = Y(x); c.fillStyle = EM.col('acc2'); c.strokeStyle = EM.col('acc2'); c.lineWidth = 1.5;
      c.beginPath(); c.arc(px, py, 6, 0, 7); c.stroke();
      const out = (st.I >= 0) === (up > 0);
      if (out) { c.beginPath(); c.arc(px, py, 2.2, 0, 7); c.fill(); } else { c.beginPath(); c.moveTo(px - 3.5, py - 3.5); c.lineTo(px + 3.5, py + 3.5); c.moveTo(px + 3.5, py - 3.5); c.lineTo(px - 3.5, py + 3.5); c.stroke(); }
    }
    // pole labels
    const north = st.I >= 0 ? 1 : -1;
    EM.label(c, 'N', X(north * (st.L / 2 + 1.4)), Y(0), EM.col('bad'), { size: 16, weight: '900', align: 'center' });
    EM.label(c, 'S', X(-north * (st.L / 2 + 1.4)), Y(0), EM.col('acc'), { size: 16, weight: '900', align: 'center' });
    EM.label(c, 'field lines leave the north pole', 10, h - 12, EM.col('muted'), { size: 11, weight: '500' });
  };
  build();
});
