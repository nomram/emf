/* solar-flare — GOES X-ray flare classes, NOAA radio-blackout scale, and the Sun-to-Earth timeline (X-rays, protons, CME) */
EM.register('solar-flare', function (el) {
  const W = EM.widget(el, { title: 'Solar flares and CMEs: what arrives when, and what it does', badge: 'Explore',
    note: 'Flares are classed by their peak soft X-ray flux (GOES 1–8 Å): A, B, C, M, X are decades from $10^{-8}$ to $10^{-4}$ W/m², with a number inside each decade (X28 = 2.8×10⁻³). NOAA’s radio-blackout scale maps them to R1 (M1) … R5 (X20). The light from a flare arrives in 8 minutes 20 seconds; energetic protons within tens of minutes to hours; the plasma cloud of a <b>coronal mass ejection</b> (CME) in 15 hours to 3 days.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 }), B = EM.canvas(main, { aspect: .4 }); B.cv.style.marginTop = '10px';
  const st = { lf: -4, v: 1500 };
  const AU = 1.496e11;
  EM.slider(side, { label: 'Flare peak X-ray flux (class)', min: -7.7, max: -2.5, step: .01, value: -4, fmt: v => cls(Math.pow(10, v)), onInput: v => { st.lf = v; upd(); } });
  EM.slider(side, { label: 'CME speed', min: 300, max: 3000, step: 10, value: 1500, fmt: v => v + ' km/s', onInput: v => { st.v = v; upd(); } });
  const pre = EM.h('div', { class: 'btn-row' }); side.append(pre); [['C5', 5e-6], ['M5', 5e-5], ['X1', 1e-4], ['X9 (Sep 2017)', 9.3e-4], ['X28 (est. Nov 2003)', 2.8e-3]].forEach(([t, f]) => EM.btn(pre, t, () => { st.lf = Math.log10(f); side.querySelector('input').value = st.lf; side.querySelector('input').dispatchEvent(new Event('input')); }, 'small'));
  const ro = EM.readouts(side, [['cls', 'Flare class', '', 'fuel'], ['r', 'NOAA radio blackout', '', 'hot'], ['pw', 'Soft X-ray power from the Sun (peak)', '', ''], ['arr', 'CME arrives after', '', 'cool'], ['eff', 'HF radio on the sunlit side', '', 'bad']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function cls(f) { const letters = [['A', 1e-8], ['B', 1e-7], ['C', 1e-6], ['M', 1e-5], ['X', 1e-4]]; let l = letters[0]; for (const x of letters) if (f >= x[1] * .9999) l = x; return l[0] + (f / l[1]).toFixed(1); }
  function rscale(f) { return f >= 2e-3 ? ['R5 extreme', 'Complete HF radio blackout on the entire sunlit side for hours; low-frequency navigation signals degraded for hours.'] : f >= 1e-3 ? ['R4 severe', 'HF radio blackout on most of the sunlit side for one to two hours; navigation outages.'] : f >= 1e-4 ? ['R3 strong', 'Wide-area HF blackout, loss of contact for about an hour on the sunlit side; low-frequency navigation degraded.'] : f >= 5e-5 ? ['R2 moderate', 'Limited HF blackout on the sunlit side, loss of contact for tens of minutes.'] : f >= 1e-5 ? ['R1 minor', 'Weak or minor degradation of HF radio on the sunlit side; brief loss of contact.'] : ['below R1', 'No significant radio effect.']; }
  function upd() {
    const F = Math.pow(10, st.lf), r = rscale(F), P = F * 4 * Math.PI * AU * AU, t = AU / (st.v * 1e3);
    ro.set('cls', cls(F)); ro.set('r', r[0]); ro.set('pw', EM.si(P, 'W')); ro.set('arr', (t / 3600 < 48 ? (t / 3600).toFixed(0) + ' hours' : (t / 86400).toFixed(1) + ' days')); ro.set('eff', r[1]);
    info.innerHTML = '<h6>' + cls(F) + ' flare: ' + r[0] + '</h6>X-ray and extreme-ultraviolet from the flare ionise the lowest layer of the ionosphere (the D layer, chapter 11a) on the <b>sunlit hemisphere</b>. That layer absorbs HF, so shortwave aviation, maritime and amateur radio fade out within minutes, for as long as the flare lasts. It does not matter whether the CME is aimed at Earth: the X-rays always arrive. A CME that <em>does</em> hit, a day or two later, compresses the magnetosphere and drives a <b>geomagnetic storm</b> (next widget), with currents in power lines, aurora, GNSS errors and extra drag on satellites. Fast protons (a “solar radiation storm”, S-scale) arrive from tens of minutes to hours and are a hazard for astronauts and electronics at polar latitudes and in orbit.';
    A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const F = Math.pow(10, st.lf), P = EM.plot(c, { x: 62, y: 12, w: w - 80, h: h - 42 }, { xmin: 0, xmax: 180, ymin: 1e-8, ymax: 5e-3, ylog: true, xlabel: 'minutes', ylabel: 'GOES X-ray flux (W/m²)', xticks: [0, 30, 60, 90, 120, 150, 180], yfmt: v => EM.num(v, 1) });
    P.grid(); for (const [n, v] of [['A', 1e-8], ['B', 1e-7], ['C', 1e-6], ['M', 1e-5], ['X', 1e-4]]) { P.hline(v, EM.alpha(EM.col('muted'), .4), 1, [3, 4]); EM.label(c, n, P.box.x + P.box.w - 8, P.Y(v * 3) , EM.col('muted'), { size: 11, align: 'right', weight: '800' }); }
    for (const [n, v] of [['R1', 1e-5], ['R2', 5e-5], ['R3', 1e-4], ['R4', 1e-3], ['R5', 2e-3]]) { P.hline(v, EM.alpha(EM.col('bad'), .5), 1.2); EM.label(c, n, P.box.x + 6, P.Y(v) - 7, EM.col('bad'), { size: 10, weight: '700' }); }
    const bg = 3e-7, t0 = 20, tr = 8 + Math.max(0, (st.lf + 7) * 2), td = 25 + (st.lf + 7) * 8; P.clip(); P.fn(t => t < t0 ? bg : t < t0 + tr ? bg + (F - bg) * (1 - Math.pow(1 - (t - t0) / tr, 2)) : bg + (F - bg) * Math.exp(-(t - t0 - tr) / td), EM.col('acc3'), 3, 400); P.unclip();
    EM.label(c, 'typical flare profile: fast rise, slow decay', P.box.x + 10, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 40, y: 14, w: w - 56, h: h - 56 }, { xmin: 100, xmax: 1e6, xlog: true, ymin: 0, ymax: 1, yticks: [], xlabel: 'time after the eruption', xticks: [100, 600, 3600, 86400, 6e5], xfmt: v => v < 1000 ? Math.round(v / 60) + ' min' : v < 1e5 ? Math.round(v / 3600) + ' h' : Math.round(v / 86400) + ' d' });
    P.grid(); const t = AU / (st.v * 1e3); const ev = [['light and X-rays: 8 min 20 s', 500, 'acc3', .86], ['relativistic protons: ≈ 15 min – hours', 3600, 'violet', .66], ['CME (' + st.v + ' km/s): ' + (t / 3600 < 48 ? Math.round(t / 3600) + ' h' : (t / 86400).toFixed(1) + ' d'), t, 'acc2', .46], ['Carrington 1859: ≈ 17.6 h', 17.6 * 3600, 'muted', .26]];
    for (const [n, x, col, y] of ev) { P.vline(x, EM.alpha(EM.col(col), .6), 1.5, [4, 4]); c.fillStyle = EM.col(col); c.beginPath(); c.arc(P.X(x), P.Y(y), 7, 0, 7); c.fill(); EM.label(c, n, P.X(x) + 12, P.Y(y), EM.col(col), { size: 11, weight: '700' }); }
  };
  upd();
});
