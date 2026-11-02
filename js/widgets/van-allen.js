/* van-allen — the radiation belts in a dipole field: L-shells, belts, orbits, and the motion of a trapped particle (gyration, bounce, drift) */
EM.register('van-allen', function (el) {
  const W = EM.widget(el, { title: 'The Van Allen belts: particles trapped in Earth’s magnetic field', badge: 'Try it',
    note: 'Side view of Earth’s dipole field. A field line labelled <b>L</b> crosses the equator at $L$ Earth radii: $r=L\\cos^2\\lambda$. A charged particle <b>gyrates</b> around the line, <b>bounces</b> between mirror points where it meets stronger field ($\\sin^2\\alpha_0=B_{eq}/B_m$), and <b>drifts</b> around the Earth. The inner belt (mostly protons) and outer belt (mostly electrons) are where such particles are stored; their size and position shift with space weather. Belt boundaries are approximate and variable.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const st = { L: 2, a0: 40, sp: 'p', E: 100, t: 0 };
  EM.slider(side, { label: 'Field line (L-shell)', min: 1.1, max: 7, step: .05, value: 2, fmt: v => 'L = ' + v.toFixed(2), onInput: v => { st.L = v; upd(); } });
  EM.slider(side, { label: 'Equatorial pitch angle α₀', min: 3, max: 90, step: 1, value: 40, unit: '°', onInput: v => { st.a0 = v; upd(); } });
  EM.seg(side, [['p', 'Proton'], ['e', 'Electron']], 'p', v => { st.sp = v; upd(); });
  EM.slider(side, { label: 'Kinetic energy', min: .01, max: 500, log: true, value: 100, fmt: v => EM.num(v, 3) + ' MeV', onInput: v => { st.E = v; upd(); } });
  const pre = EM.h('div', { class: 'btn-row' }); side.append(pre); [['Inner belt proton', 2, 'p', 100], ['Slot region', 2.8, 'e', 1], ['Outer belt electron', 4.5, 'e', 1], ['GPS orbit L', 4.17, 'e', 1]].forEach(([t, L, sp, E]) => EM.btn(pre, t, () => { st.L = L; st.sp = sp; st.E = E; const r = side.querySelectorAll('input[type=range]'); r[0].value = L; r[0].dispatchEvent(new Event('input')); r[2].value = Math.round(1000 * Math.log(E / .01) / Math.log(500 / .01)); r[2].dispatchEvent(new Event('input')); }, 'small'));
  const ro = EM.readouts(side, [['reg', 'Region', '', 'cool'], ['B', 'Field at the equator', '', 'fuel'], ['gf', 'Gyro-frequency', '', ''], ['gr', 'Gyro-radius', '', ''], ['mir', 'Mirror latitude', '', 'hot'], ['bp', 'Bounce period', '', 'good'], ['dp', 'Drift once around the Earth', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const Re = 6371e3, mc2 = { p: 938.272, e: .511 }, mass = { p: 1.6726e-27, e: 9.109e-31 };
  const Bf = lam => Math.sqrt(1 + 3 * Math.sin(lam) ** 2) / Math.pow(Math.cos(lam), 6);
  function mirror(a0, L) { const s2 = Math.pow(Math.sin(EM.rad(a0)), 2); let lo = 0, hi = Math.acos(Math.sqrt(1.0 / L)) - 1e-6 + 0; hi = Math.min(hi, 1.45); const fm = l => 1 / Bf(l); if (fm(hi) > s2) return hi; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (fm(m) > s2) lo = m; else hi = m; } return (lo + hi) / 2; }
  function region(L) { return L < 1.4 ? 'below the inner belt (SAA excepted)' : L < 2.5 ? 'inner belt (mostly protons)' : L < 3.5 ? 'slot region (usually quiet)' : L < 7.5 ? 'outer belt (mostly electrons)' : 'beyond the belts'; }
  function upd() {
    const L = st.L, B = 31200e-9 / Math.pow(L, 3), g = 1 + st.E / mc2[st.sp], v = EM.C.c * Math.sqrt(1 - 1 / (g * g)), q = EM.C.e, m = mass[st.sp], sa = Math.sin(EM.rad(st.a0)), vp = v * sa, gf = q * B / (2 * Math.PI * g * m), gr = g * m * vp / (q * B), lm = mirror(st.a0, L), Tb = L * Re / v * (3.7 - 1.6 * sa), Td = 1.05 / (L * st.E) * 3600;
    const latAtm = Math.acos(Math.sqrt(Math.min(1, 1.016 / L))), sa2 = Math.pow(Math.cos(latAtm), 6) / Math.sqrt(1 + 3 * Math.sin(latAtm) ** 2), alc = EM.deg(Math.asin(Math.sqrt(sa2))), lost = L > 1.016 && st.a0 < alc;
    ro.set('reg', region(L)); ro.set('B', EM.si(B, 'T')); ro.set('gf', EM.freq(gf)); ro.set('gr', EM.len(gr)); ro.set('mir', lost ? 'enters the atmosphere (lost)' : EM.deg(lm).toFixed(0) + '° N/S'); ro.set('bp', EM.si(Tb, 's')); ro.set('dp', Td < 120 ? Td.toFixed(0) + ' s' : Td < 3600 ? (Td / 60).toFixed(0) + ' min' : (Td / 3600).toFixed(1) + ' h');
    info.innerHTML = '<h6>' + (lost ? 'In the loss cone' : 'Trapped') + '</h6>' + (lost ? 'Pitch angles below ≈ ' + alc.toFixed(0) + '° reach the atmosphere on the first bounce and are absorbed: the <b>loss cone</b>. ' : 'This particle bounces north and south between ±' + EM.deg(lm).toFixed(0) + '° forever, until scattered by waves, storms or the atmosphere. ') + 'The belts hold two populations: <b>inner belt protons</b> (tens to hundreds of MeV, made mainly by cosmic-ray collisions with the atmosphere, very stable) and <b>outer belt electrons</b> (up to several MeV, which swell and vanish within hours to days with solar-wind and geomagnetic activity). In 1958 James Van Allen’s Explorer 1 found them; nuclear bursts in 1958 (Argus) and 1962 (Starfish Prime) injected electrons that persisted for months or years and damaged satellites. <span class="muted">Formulas: bounce period ≈ (L R<sub>E</sub>/v)(3.7 − 1.6 sin α₀), drift period ≈ 1.05/(L E<sub>MeV</sub>) hours: standard textbook approximations.</span>'; S.redraw();
  }
  S.draw = (c, w, h) => {
    const cx = w * .34, cy = h / 2, R = Math.min(h * .43 / 7.6, w * .62 / 16), sc = R; // R pixels per Earth radius
    c.fillStyle = EM.col('bg-2'); c.fillRect(0, 0, w, h);
    // belts (shaded bands in equatorial plane, drawn as annulus sectors around the dipole shape)
    const belt = (L1, L2, col, al) => { c.fillStyle = EM.alpha(EM.col(col), al); const N = 80; c.beginPath(); for (let i = 0; i <= N; i++) { const lam = -Math.PI / 2 * .75 + i / N * Math.PI * .75; const r = L2 * Math.cos(lam) ** 2; c.lineTo(cx + r * Math.cos(lam) * sc, cy - r * Math.sin(lam) * sc); } for (let i = N; i >= 0; i--) { const lam = -Math.PI / 2 * .75 + i / N * Math.PI * .75, r = L1 * Math.cos(lam) ** 2; c.lineTo(cx + r * Math.cos(lam) * sc, cy - r * Math.sin(lam) * sc); } c.closePath(); c.fill(); };
    // draw for both hemispheres by mirroring lambda sign (-75% … +0 and 0 … +75% already cover); do full range
    const beltFull = (L1, L2, col, al) => { c.fillStyle = EM.alpha(EM.col(col), al); const N = 120; c.beginPath(); for (let i = 0; i <= N; i++) { const lam = -1.2 + 2.4 * i / N, r = L2 * Math.cos(lam) ** 2; c.lineTo(cx + r * Math.cos(lam) * sc, cy - r * Math.sin(lam) * sc); } for (let i = N; i >= 0; i--) { const lam = -1.2 + 2.4 * i / N, r = L1 * Math.cos(lam) ** 2; c.lineTo(cx + r * Math.cos(lam) * sc, cy - r * Math.sin(lam) * sc); } c.closePath(); c.fill(); };
    beltFull(1.4, 2.5, 'acc2', .28); beltFull(3.5, 7, 'acc', .22);
    // field lines
    for (const L of [1.5, 2, 3, 4, 5, 6.6]) { c.strokeStyle = EM.alpha(EM.col('muted'), .55); c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= 160; i++) { const lam = -Math.acos(Math.sqrt(1.0 / L)) + 2 * Math.acos(Math.sqrt(1.0 / L)) * i / 160, r = L * Math.cos(lam) ** 2; const x = cx + r * Math.cos(lam) * sc, y = cy - r * Math.sin(lam) * sc; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); EM.label(c, 'L=' + L, cx + L * sc + 4, cy + 11, EM.col('muted'), { size: 9 }); }
    // selected field line
    const lmax = Math.acos(Math.sqrt(1.0 / st.L)); c.strokeStyle = EM.col('acc3'); c.lineWidth = 2.6; c.beginPath(); for (let i = 0; i <= 200; i++) { const lam = -lmax + 2 * lmax * i / 200, r = st.L * Math.cos(lam) ** 2; const x = cx + r * Math.cos(lam) * sc, y = cy - r * Math.sin(lam) * sc; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    // Earth
    c.fillStyle = EM.col('acc'); c.beginPath(); c.arc(cx, cy, sc, 0, 7); c.fill(); EM.label(c, 'Earth', cx, cy, '#04202c', { size: 11, align: 'center', weight: '800' });
    // orbits
    const orbits = [['ISS / Starlink', 1.086, 'text'], ['GPS (20 200 km)', 4.17, 'ok'], ['Galileo (23 200 km)', 4.65, 'ok'], ['GEO', 6.62, 'violet']]; c.setLineDash([3, 4]); for (const [n, r, col] of orbits) { c.strokeStyle = EM.alpha(EM.col(col), .8); c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r * sc, 0, 7); c.stroke(); if (r > 2) EM.label(c, n, cx - r * sc + 4, cy - 10, EM.col(col), { size: 10 }); } c.setLineDash([]);
    EM.label(c, 'inner belt', cx + 2.0 * sc * .75, cy - 2.0 * sc * .5, EM.col('acc2'), { size: 11, weight: '700' }); EM.label(c, 'outer belt', cx + 5.2 * sc * .8, cy - 3 * sc * .4, EM.col('acc'), { size: 11, weight: '700' }); EM.label(c, 'slot', cx + 3 * sc, cy + 1.6 * sc, EM.col('muted'), { size: 10 });
    // particle: bounce between mirror points, with gyration
    const lm = Math.min(mirror(st.a0, st.L), lmax - .001), Tb = 3 + 1.5 * (1 - Math.sin(EM.rad(st.a0))), ph = (st.t / Tb) * 2 * Math.PI, lam = lm * Math.sin(ph), r = st.L * Math.cos(lam) ** 2, bx = cx + r * Math.cos(lam) * sc, by = cy - r * Math.sin(lam) * sc, gyro = ph * 24, gr = 5 + 5 * Math.sin(EM.rad(st.a0));
    c.fillStyle = st.sp === 'p' ? EM.col('acc2') : EM.col('bad'); c.beginPath(); c.arc(bx + gr * Math.cos(gyro), by + gr * Math.sin(gyro), 4.5, 0, 7); c.fill(); c.strokeStyle = EM.alpha(EM.col('text'), .35); c.beginPath(); c.arc(bx, by, gr, 0, 7); c.stroke();
    // mirror points
    for (const s of [-1, 1]) { const rr = st.L * Math.cos(lm) ** 2, mx = cx + rr * Math.cos(lm) * sc, my = cy - s * rr * Math.sin(lm) * sc; c.strokeStyle = EM.col('acc3'); c.lineWidth = 2; c.beginPath(); c.moveTo(mx - 8, my); c.lineTo(mx + 8, my); c.stroke(); }
    EM.label(c, 'mirror points', cx + st.L * Math.cos(lm) ** 2 * Math.cos(lm) * sc + 12, cy - st.L * Math.cos(lm) ** 2 * Math.sin(lm) * sc, EM.col('acc3'), { size: 10 });
    EM.label(c, 'dipole field, meridian plane (not to scale for the gyro-radius)', 10, h - 10, EM.col('muted'), { size: 10, weight: '500' });
  };
  EM.loop(el, (t, dt) => { st.t += dt; S.redraw(); });
  upd();
});
