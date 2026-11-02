/* haarp — what an ionospheric heater does: plasma frequency, reflection, power density at 200+ km vs sunlight */
EM.register('haarp', function (el) {
  const W = EM.widget(el, { title: 'An ionospheric heater (HAARP-style): the numbers', badge: 'Calculate',
    note: 'The ionosphere reflects a wave only if its frequency is below the local <b>plasma frequency</b> $f_p=8.98\\sqrt{N_e}$ Hz ($N_e$ in m⁻³). A heater uses a frequency just under that, so the wave is absorbed or reflected where the electrons live, and pumps energy into them. Compare the power density with sunlight (≈ 1360 W/m²) and with exposure limits. Values for HAARP are approximate public figures.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const st = { P: 3.6e6, G: 31, h: 250e3, f: 5.8e6, N: 5e11, drive: 1 };
  const ps = EM.slider(side, { label: 'Transmitter power (all 180 elements)', min: 1e4, max: 3.6e6, log: true, value: 3.6e6, fmt: v => EM.si(v, 'W'), onInput: v => { st.P = v; upd(); } });
  EM.slider(side, { label: 'Array gain (many dipoles in phase)', min: 10, max: 40, step: .5, value: 31, unit: 'dBi', onInput: v => { st.G = v; upd(); } });
  EM.slider(side, { label: 'Height of the F2 layer', min: 150e3, max: 400e3, step: 5e3, value: 250e3, fmt: v => EM.len(v), onInput: v => { st.h = v; upd(); } });
  EM.slider(side, { label: 'Heater frequency', min: 2.7e6, max: 10e6, step: 5e4, value: 5.8e6, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  EM.slider(side, { label: 'Electron density N_e of the layer (solar activity, time of day)', min: 5e9, max: 1.5e12, log: true, value: 5e11, fmt: v => EM.num(v, 2) + ' m⁻³', onInput: v => { st.N = v; upd(); } });
  const ro = EM.readouts(side, [['fp', 'Plasma frequency f_p', '', 'cool'], ['ref', 'Heater frequency vs layer', '', 'hot'], ['erp', 'Effective radiated power', '', 'fuel'], ['S', 'Power density at the layer', '', ''], ['sun', 'Compared with sunlight', '', 'good'], ['E', 'E-field there (rms)', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function upd() {
    const fp = 8.98 * Math.sqrt(st.N), erp = st.P * Math.pow(10, st.G / 10), Sd = erp / (4 * Math.PI * st.h * st.h), E = Math.sqrt(Sd * EM.C.eta0);
    ro.set('fp', EM.freq(fp)); ro.set('ref', st.f < fp ? 'below f_p: interacts' : 'above f_p: passes through'); ro.set('erp', EM.si(erp, 'W')); ro.set('S', EM.si(Sd, 'W/m²')); ro.set('sun', EM.num(Sd / 1361 * 100, 2), '% of sunlight'); ro.set('E', EM.si(E, 'V/m'));
    info.innerHTML = '<h6>What this is (and is not)</h6>A heater is a <b>big HF phased array</b> (chapter 18): 180 crossed dipoles in a 12×15 grid at Gakona, Alaska, about 3.6 MW total, tunable 2.7–10 MHz, producing hundreds of megawatts to a few gigawatts of ERP. That sounds huge, yet at the ionosphere the beam is ≈ ' + EM.num(Sd * 1e3, 2) + ' mW/m², about ' + EM.num(Sd / 1361 * 100, 2) + ' % of ordinary sunlight, and it is absorbed by a thin layer of electrons at very low density. Result: electrons warm by a few hundred kelvin, a patch glows faintly (artificial airglow), and the plasma develops waves that scientists can study. <b>No effect on weather, earthquakes or minds has ever been demonstrated; the energy involved is some ten orders of magnitude below a thunderstorm.</b>';
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const ground = h * .9, X0 = w * .22, hp = h => ground - (h / 400e3) * (ground - 20);
    c.fillStyle = EM.alpha(EM.col('ok'), .25); c.fillRect(0, ground, w, h - ground);
    // layers
    for (const [hh, lab, col] of [[75e3, 'D', 'bad'], [110e3, 'E', 'acc'], [250e3, 'F2', 'violet']]) { c.fillStyle = EM.alpha(EM.col(col), .12); c.fillRect(0, hp(hh + 15e3), w, hp(hh - 15e3) - hp(hh + 15e3)); EM.label(c, lab, w - 14, hp(hh), EM.col(col), { size: 11, weight: '800' }); }
    c.fillStyle = EM.alpha(EM.col('acc3'), .4); const lh = hp(st.h); c.fillRect(X0 - 60, lh - 8, 120, 16);
    EM.label(c, 'heated patch', X0 + 70, lh, EM.col('acc3'), { size: 11, weight: '700' });
    // antenna array
    c.fillStyle = EM.col('text'); for (let i = -6; i <= 6; i++) for (let j = 0; j < 2; j++) c.fillRect(X0 + i * 7 - 1, ground - 6 - j * 4, 3, 5);
    EM.label(c, 'array of 180 crossed dipoles', X0, ground + 16, EM.col('text-2'), { size: 10, align: 'center' });
    // beam
    const fp = 8.98 * Math.sqrt(st.N), reflected = st.f < fp; c.fillStyle = EM.alpha(EM.col('acc2'), reflected ? .28 : .15); c.beginPath(); c.moveTo(X0 - 44, ground - 8); c.lineTo(X0 + 44, ground - 8); c.lineTo(X0 + 60, lh); c.lineTo(X0 - 60, lh); c.closePath(); c.fill();
    if (!reflected) { c.fillStyle = EM.alpha(EM.col('acc2'), .1); c.fillRect(X0 - 60, 0, 120, lh); EM.label(c, 'passes through (f > f_p)', X0 + 70, hp(330e3), EM.col('muted'), { size: 10 }); } else EM.label(c, 'absorbed / reflected (f < f_p)', X0 + 70, lh + 22, EM.col('acc2'), { size: 10 });
    // plasma frequency profile
    const px = w * .55, pw = w * .38; c.strokeStyle = EM.col('line-2'); c.strokeRect(px + .5, 20.5, pw, ground - 20);
    c.strokeStyle = EM.col('violet'); c.lineWidth = 2.2; c.beginPath(); for (let k = 0; k <= 60; k++) { const hh = 70e3 + (400e3 - 70e3) * k / 60, Nz = st.N * Math.exp(.5 * (1 - (hh - 250e3) / 50e3 - Math.exp(-(hh - 250e3) / 50e3))) * (hh < 250e3 ? 1 : 1); const f = 8.98 * Math.sqrt(Math.max(1e8, Nz)) / 1e7; const x = px + pw * Math.min(1, f), y = hp(hh); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    const xf = px + pw * Math.min(1, st.f / 1e7); c.setLineDash([5, 4]); c.strokeStyle = EM.col('acc2'); c.beginPath(); c.moveTo(xf, 20); c.lineTo(xf, ground); c.stroke(); c.setLineDash([]);
    EM.label(c, 'plasma frequency profile (0–10 MHz)', px + pw / 2, 12, EM.col('muted'), { size: 10, align: 'center' }); EM.label(c, 'heater ' + EM.freq(st.f), xf + 4, ground - 10, EM.col('acc2'), { size: 10, weight: '700' });
  };
  upd();
});
