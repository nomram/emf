/* radio-horizon — line of sight over the curved Earth: horizon distance, bulge, Fresnel clearance, k-factor */
EM.register('radio-horizon', function (el) {
  const W = EM.widget(el, { title: 'The radio horizon: line of sight on a round Earth', badge: 'Try it',
    note: 'Above ≈ 30 MHz waves travel in straight lines, but the atmosphere bends them slightly downward, so the <b>radio horizon</b> is further than the optical one: use an effective Earth radius $kR$ with $k\\approx4/3$. $d\\approx\\sqrt{2kR\\,h_1}+\\sqrt{2kR\\,h_2}$ (≈ 4.12(√h₁+√h₂) km, h in metres). For a link to work you also want the <b>first Fresnel zone</b> mostly clear of the ground (60 % of its radius).' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .5 });
  const Re = 6371e3, st = { h1: 30, h2: 10, d: 25e3, k: 4 / 3, f: 450e6 };
  const PRE = [['Two handhelds (2 m high) on flat ground', 2, 2, 1], ['Police VHF mast 30 m to car 1.5 m', 30, 1.5, 1], ['FM tower 300 m to car', 300, 1.5, 1], ['TV tower 600 m (CN Tower-class) to rooftop', 553, 10, 1], ['Airliner at 10 km to ground station', 10000, 20, 1], ['Mobile phone mast 40 m to phone 1.5 m', 40, 1.5, 1], ['Ship radar mast 25 m → target 5 m high', 25, 5, 1], ['Low Earth orbit (ISS 400 km) to antenna', 400e3, 10, 1]];
  EM.select(side, { label: 'Examples', options: [['', 'choose…'], ...PRE.map((p, i) => [i, p[0]])], value: '', onChange: v => { if (v === '') return; const p = PRE[+v]; st.h1 = p[1]; st.h2 = p[2]; H1.set(st.h1, true); H2.set(st.h2, true); st.d = Math.min(1e7, Math.sqrt(2 * Re * st.k * st.h1) + Math.sqrt(2 * Re * st.k * st.h2)) * .9; D.set(st.d, true); upd(); } });
  const H1 = EM.slider(side, { label: 'Antenna 1 height', min: 1, max: 1e6, log: true, value: 30, fmt: v => EM.len(v), onInput: v => { st.h1 = v; upd(); } });
  const H2 = EM.slider(side, { label: 'Antenna 2 height', min: 1, max: 1e6, log: true, value: 10, fmt: v => EM.len(v), onInput: v => { st.h2 = v; upd(); } });
  const D = EM.slider(side, { label: 'Distance between them', min: 500, max: 1e7, log: true, value: 25e3, fmt: v => EM.len(v), onInput: v => { st.d = v; upd(); } });
  EM.slider(side, { label: 'Frequency (for Fresnel zone)', min: 3e7, max: 1e11, log: true, value: 450e6, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  EM.seg(side, [[1, 'Geometric (k = 1)'], [4 / 3, 'Standard air (k = 4/3)'], [100, 'Strong duct (k ≫)']], 4 / 3, v => { st.k = +v; upd(); });
  const ro = EM.readouts(side, [['dmax', 'Radio horizon (max range)', '', 'cool'], ['bulge', 'Earth bulge at midpoint', '', ''], ['f1', 'First Fresnel radius (mid)', '', 'fuel'], ['clr', 'Clearance at midpoint', '', ''], ['v', 'Verdict', '', 'hot']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function calc() {
    const kR = st.k * Re, dmax = Math.sqrt(2 * kR * st.h1) + Math.sqrt(2 * kR * st.h2), x = st.d / 2, bulge = x * (st.d - x) / (2 * kR), los = (st.h1 + st.h2) / 2, lam = EM.C.c / st.f, F1 = Math.sqrt(lam * x * (st.d - x) / st.d);
    return { dmax, bulge, los, F1, clear: los - bulge };
  }
  function upd() {
    const g = calc(), vis = st.d <= g.dmax * 1.0001, fres = g.clear > .6 * g.F1;
    ro.set('dmax', EM.len(g.dmax)); ro.set('bulge', EM.len(g.bulge)); ro.set('f1', EM.len(g.F1)); ro.set('clr', EM.len(g.clear) + (g.clear < 0 ? ' (blocked)' : '')); ro.set('v', !vis ? 'beyond the horizon' : fres ? 'clear line of sight' : 'grazing: Fresnel obstructed');
    info.innerHTML = !vis ? '<h6>Over the horizon</h6>The Earth’s bulge is in the way. Options: raise an antenna (distance ∝ √h), relay (repeater on a hill, satellite), use a lower frequency that follows the ground or reflects off the ionosphere, or rely on <b>tropospheric ducting / scatter</b>. Under a temperature inversion the atmosphere traps VHF/UHF in a duct and signals travel 500–2000 km.' : '<h6>Within the horizon</h6>Since 4/3 of the geometric horizon is a good average, a 30 m mast sees 22 km; a 300 m tower 71 km; an aircraft at 10 km altitude 410 km. For long microwave links engineers choose heights so the 60 % Fresnel zone clears everything by the largest margin expected (k can drop to 2/3 in bad weather).';
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const g = calc(), kR = st.k * Re, dd = st.d, pad = 30, X = x => pad + x / dd * (w - 2 * pad), maxH = Math.max(st.h1, st.h2, g.bulge * 1.2, 5) * 1.35, base = h - 36, Y = z => base - (z + g.bulge * .02) / maxH * (base - 24);
    // ground: the Earth bulges above the straight chord between the two feet by x(d-x)/(2kR)
    const zg = x => x * (dd - x) / (2 * kR);
    const gr = c.createLinearGradient(0, base - 40, 0, h); gr.addColorStop(0, EM.alpha(EM.col('ok'), .4)); gr.addColorStop(1, EM.alpha(EM.col('ok'), .08)); c.fillStyle = gr; c.beginPath(); c.moveTo(X(0), h);
    for (let i = 0; i <= 100; i++) { const x = dd * i / 100; c.lineTo(X(x), Y(zg(x))); } c.lineTo(X(dd), h); c.closePath(); c.fill();
    // ground line: bulge is the height of the earth above the chord between the feet
    c.strokeStyle = EM.col('ok'); c.lineWidth = 2.5; c.beginPath(); for (let i = 0; i <= 100; i++) { const x = dd * i / 100, z = x * (dd - x) / (2 * kR); i ? c.lineTo(X(x), Y(z)) : c.moveTo(X(x), Y(z)); } c.stroke();
    // masts
    c.strokeStyle = EM.col('text'); c.lineWidth = 3; c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(0), Y(st.h1)); c.moveTo(X(dd), Y(0)); c.lineTo(X(dd), Y(st.h2)); c.stroke();
    // Fresnel zone (60 %)
    c.fillStyle = EM.alpha(EM.col('acc'), .15); c.beginPath(); const lam = EM.C.c / st.f;
    for (let i = 0; i <= 100; i++) { const x = dd * i / 100, zl = st.h1 + (st.h2 - st.h1) * x / dd, f1 = Math.sqrt(lam * x * (dd - x) / dd) * .6, p = [X(x), Y(zl + f1)]; i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let i = 100; i >= 0; i--) { const x = dd * i / 100, zl = st.h1 + (st.h2 - st.h1) * x / dd, f1 = Math.sqrt(lam * x * (dd - x) / dd) * .6; c.lineTo(X(x), Y(zl - f1)); } c.closePath(); c.fill();
    const blocked = g.clear < 0; c.strokeStyle = blocked ? EM.col('bad') : EM.col('acc3'); c.lineWidth = 2.2; c.setLineDash(blocked ? [6, 5] : []); c.beginPath(); c.moveTo(X(0), Y(st.h1)); c.lineTo(X(dd), Y(st.h2)); c.stroke(); c.setLineDash([]);
    EM.label(c, 'antenna 1: ' + EM.len(st.h1), X(0) + 8, Y(st.h1) - 8, EM.col('text-2'), { size: 11 }); EM.label(c, 'antenna 2: ' + EM.len(st.h2), X(dd) - 8, Y(st.h2) - 8, EM.col('text-2'), { size: 11, align: 'right' });
    EM.label(c, 'height scale stretched; d = ' + EM.len(dd) + (blocked ? ': the Earth blocks the path' : ''), w / 2, h - 12, blocked ? EM.col('bad') : EM.col('muted'), { size: 11, align: 'center', weight: '600' });
    EM.label(c, '60 % first Fresnel zone', w / 2, 16, EM.col('acc'), { size: 11, align: 'center' });
  };
  upd();
});
