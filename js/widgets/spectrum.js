/* spectrum — the electromagnetic spectrum, frequency <-> wavelength <-> photon energy, bands, examples, zoom */
EM.register('spectrum', function (el) {
  const W = EM.widget(el, { title: 'The electromagnetic spectrum explorer', badge: 'Explore',
    note: '<b>Click or drag</b> anywhere on the spectrum (or use ← → when it is focused) to pick a frequency. Click a labelled example to jump to it. Use the zoom buttons to open up radio, microwaves, light or X-rays. Axis is logarithmic: each tick is ten times the last.' });
  const h = EM.h, c0 = EM.C.c, hP = EM.C.h, eV = EM.C.e;
  const S = EM.canvas(W.body, { height: 500, cursor: 'crosshair' }); S.cv.tabIndex = 0;
  const bar = h('div', { class: 'btn-row', style: { margin: '12px 0 4px' } }); W.body.insertBefore(bar, S.cv);
  const info = h('div', { class: 'wgrid even', style: { marginTop: '12px' } }); W.body.append(info);
  const left = h('div'), right = h('div', { class: 'info-box' }); info.append(left, right);

  const BANDS = [
    ['ELF', 3, 30, 215, 'Extremely low frequency'], ['SLF', 30, 300, 212, 'Super low (power grid, 76 Hz submarine link)'], ['ULF', 300, 3e3, 208, 'Ultra low (through-earth radio)'],
    ['VLF', 3e3, 3e4, 204, 'Very low (navy VLF)'], ['LF', 3e4, 3e5, 198, 'Low (longwave, time signals)'], ['MF', 3e5, 3e6, 192, 'Medium (AM radio)'], ['HF', 3e6, 3e7, 186, 'High (shortwave)'],
    ['VHF', 3e7, 3e8, 178, 'Very high (FM, TV, air band)'], ['UHF', 3e8, 3e9, 168, 'Ultra high (cell, GPS, Wi-Fi)'], ['SHF', 3e9, 3e10, 150, 'Super high (satellite, radar)'], ['EHF', 3e10, 3e11, 130, 'Extremely high (mm-wave)'],
    ['THz', 3e11, 1e13, 100, 'Terahertz / far IR'], ['Infrared', 1e13, 4e14, 14, 'Infrared'], ['Visible', 4e14, 7.9e14, -1, 'Visible light'], ['UV', 7.9e14, 3e16, 272, 'Ultraviolet'], ['X-ray', 3e16, 3e19, 245, 'X-rays'], ['Gamma', 3e19, 1e25, 318, 'Gamma rays'],
  ];
  const RADAR = [['HF', 3e6, 3e7], ['VHF', 1.3e8, 3e8], ['UHF', 3e8, 1e9], ['L', 1e9, 2e9], ['S', 2e9, 4e9], ['C', 4e9, 8e9], ['X', 8e9, 1.2e10], ['Ku', 1.2e10, 1.8e10], ['K', 1.8e10, 2.7e10], ['Ka', 2.7e10, 4e10], ['V', 4e10, 7.5e10], ['W', 7.5e10, 1.1e11]];
  const EX = [
    ['Schumann resonance', 7.83, 0, 'Lightning makes the Earth–ionosphere cavity ring at 7.83 Hz (≈ c / circumference of the Earth).'],
    ['Power grid', 50, 60, '50 Hz (Europe, Asia) or 60 Hz (Americas): wavelength 5000–6000 km, so mains wiring radiates almost nothing.'],
    ['Submarine ELF', 76, 82, 'US Navy 76 Hz and Russian ZEVS 82 Hz: seawater skin depth is tens of metres, at the price of a few bits per minute (chapter 8).'],
    ['Through-earth mine radio', 300, 3e3, 'Magnetic-field (near-field) radios send voice or text through rock to trapped miners.'],
    ['Navy VLF', 1.5e4, 3e4, 'Submarines at shallow depth (~20 m) receive 50–200 bit/s from huge VLF stations.'],
    ['DCF77 time signal', 7.75e4, 0, 'Radio-controlled clocks sync to atomic clocks via 77.5 kHz longwave.'],
    ['AM radio', 5.3e5, 1.7e6, 'Medium wave: ground wave by day, sky wave at night. 300 m wavelength needs tall mast antennas.'],
    ['Shortwave / ham HF', 3e6, 3e7, 'Reflects off the ionosphere, so a few watts can span the globe.'],
    ['FM radio', 8.8e7, 1.08e8, 'Line-of-sight broadcasting. A half-wave antenna is about 1.5 m long.'],
    ['Aviation VHF', 1.18e8, 1.37e8, 'Air-traffic voice (AM). Line of sight; range grows with altitude.'],
    ['TV (UHF)', 4.7e8, 7e8, 'Digital terrestrial TV; Yagi antennas on rooftops.'],
    ['Cell phones', 7e8, 2.6e9, '4G/5G low and mid bands: good compromise between range and capacity.'],
    ['GPS L1', 1.57542e9, 0, 'Arrives from 20 200 km away at roughly 10⁻¹⁶ W: weaker than thermal noise, recovered by correlation.'],
    ['Wi-Fi / Bluetooth', 2.4e9, 2.4835e9, 'Licence-free ISM band, shared with microwave ovens (chapter 17).'],
    ['Microwave oven', 2.45e9, 0, 'A magnetron makes about 700–1000 W at 2.45 GHz, with λ = 12.2 cm, caged by a metal mesh.'],
    ['Airport radar (S)', 2.7e9, 2.9e9, 'S-band air-surveillance radar: long range, little rain loss.'],
    ['5G mid-band', 3.3e9, 3.8e9, 'The workhorse 5G band. Massive MIMO arrays (chapter 19).'],
    ['Wi-Fi 5 / 6 GHz', 5.15e9, 5.85e9, 'Faster, shorter range: walls hurt more.'],
    ['Weather radar (C)', 5.6e9, 0, 'Sees rain and storm structure; heavy rain attenuates it.'],
    ['Marine radar (X)', 9.3e9, 9.5e9, 'Small antennas give narrow beams; used on ships and for missile tracking.'],
    ['Satellite TV (Ku)', 1.07e10, 1.275e10, 'Dishes 40–90 cm across.'],
    ['Police speed radar', 2.4e10, 3.5e10, 'K and Ka band, Doppler (chapter 13).'],
    ['5G mmWave', 2.65e10, 2.95e10, 'Gigabit speeds, but blocked by walls and hands.'],
    ['60 GHz O₂ line', 6e10, 0, 'Oxygen absorbs ~15 dB/km here: secure short links.'],
    ['Automotive radar', 7.6e10, 8.1e10, 'FMCW at 77 GHz, 4 GHz bandwidth: centimetre range resolution (chapter 13).'],
    ['Terahertz imaging', 1e12, 0, 'Sees through clothing and packaging, but water and air absorb it strongly.'],
    ['Body heat / thermal camera', 2.1e13, 3.75e13, 'Warm objects glow at 8–14 µm; thermal cameras see it in the dark.'],
    ['CO₂ laser', 2.83e13, 0, '10.6 µm industrial cutting laser.'],
    ['TV remote LED', 3.19e14, 0, '940 nm near-infrared: invisible, yet your phone camera can see it.'],
    ['Fibre-optic internet', 1.93e14, 0, '1550 nm: lowest loss in glass fibre (~0.2 dB/km).'],
    ['Visible light', 4.3e14, 7.5e14, 'Red 700 nm (430 THz) to violet 400 nm (750 THz): our eyes’ narrow window (chapter 7).'],
    ['Green laser pointer', 5.63e14, 0, '532 nm: frequency-doubled infrared laser.'],
    ['UVA blacklight', 8.2e14, 0, '365 nm: fluorescence and tanning.'],
    ['UVC germicidal', 1.18e15, 0, '254 nm: breaks DNA, kills germs, burns skin and eyes.'],
    ['EUV lithography', 2.22e16, 0, '13.5 nm: prints the smallest features on computer chips.'],
    ['Medical X-ray', 7e17, 3e19, '10–120 keV photons: pass through soft tissue, stopped by bone.'],
    ['Caesium-137 gamma', 1.6e20, 0, '662 keV from a nuclear decay: penetrates centimetres of steel.'],
    ['Cosmic gamma rays', 1e22, 1e24, 'GeV–TeV photons from black holes and neutron stars.'],
  ].map(e => ({ n: e[0], f1: e[1], f2: e[2] || e[1], note: e[3] }));
  const SIZES = [[6.37e6, 'the radius of the Earth'], [1e5, 'a large city'], [1e3, 'a kilometre: a big airport'], [100, 'a football pitch'], [10, 'a bus'], [1.7, 'a person'], [.2, 'a hand'], [.02, 'a coin'], [2e-3, 'an ant'], [1e-4, 'a hair’s thickness'], [1e-5, 'a skin cell'], [1e-6, 'a bacterium'], [1e-7, 'a virus'], [2e-9, 'DNA’s width'], [1e-10, 'an atom'], [1e-14, 'an atomic nucleus']];
  const st = { lo: 0, hi: 25, f: 2.45e9, hover: null, tween: null };
  const LOGO = f => Math.log10(f);
  const ML = 40, MR = 22;
  const X = (f, w) => ML + (LOGO(f) - st.lo) / (st.hi - st.lo) * (w - ML - MR);
  const invX = (x, w) => Math.pow(10, st.lo + (x - ML) / (w - ML - MR) * (st.hi - st.lo));
  const hsl = (hue, l = null) => 'hsl(' + hue + ',62%,' + (l == null ? (EM.isDark() ? 40 : 62) : l) + '%)';

  function zoom(lo, hi) { st.tween = { lo0: st.lo, hi0: st.hi, lo1: lo, hi1: hi, t: 0 }; step(); }
  function step() {
    const tw = st.tween; if (!tw) return; tw.t = Math.min(1, tw.t + .06); const e = 1 - Math.pow(1 - tw.t, 3);
    st.lo = tw.lo0 + (tw.lo1 - tw.lo0) * e; st.hi = tw.hi0 + (tw.hi1 - tw.hi0) * e; S.redraw(); if (tw.t < 1) requestAnimationFrame(step); else st.tween = null;
  }
  [['Everything', 0, 25], ['Radio (1 Hz–300 GHz)', 0, 11.5], ['Radio waves & microwaves', 5, 11.5], ['Radar & Wi-Fi bands', 8.5, 11.2], ['Infrared → UV', 12.5, 16.5], ['Visible light', 14.55, 14.95], ['X-rays & gamma', 16, 25]].forEach(([t, a, b]) => EM.btn(bar, t, () => zoom(a, b), 'small'));

  S.draw = (c, w, H) => {
    const xs = f => X(f, w), dark = EM.isDark();
    // ---------- ruler (frequency)
    const ppd = (w - ML - MR) / (st.hi - st.lo), every = ppd > 64 ? 1 : ppd > 22 ? 3 : 6;
    c.font = EM.font(11); c.fillStyle = EM.col('muted'); c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.strokeStyle = EM.col('line-2'); c.lineWidth = 1;
    EM.label(c, 'f', 12, 26, EM.col('acc3'), { size: 15, weight: '800', align: 'center' });
    for (let k = Math.ceil(st.lo - 1e-9); k <= st.hi + 1e-9; k++) {
      const x = xs(Math.pow(10, k)); c.beginPath(); c.moveTo(x, 36); c.lineTo(x, k % every === 0 ? 28 : 32); c.stroke();
      if (k % every === 0) { c.fillStyle = EM.col('text-2'); c.fillText(EM.freq(Math.pow(10, k)), x, 26); }
    }
    c.strokeStyle = EM.col('line-2'); c.beginPath(); c.moveTo(ML, 36.5); c.lineTo(w - MR, 36.5); c.stroke();
    // ---------- bands
    const by = 40, bh = 62;
    for (const [nm, f1, f2, hue, desc] of BANDS) {
      const x1 = Math.max(ML, xs(f1)), x2 = Math.min(w - MR, xs(f2)); if (x2 <= x1) continue;
      if (hue < 0) { for (let x = Math.floor(x1); x < x2; x += 2) { const f = invX(x, w), nmv = c0 / f * 1e9; const rgb = EM.nm2rgb(Math.max(380, Math.min(780, nmv))); c.fillStyle = 'rgb(' + rgb.join(',') + ')'; c.fillRect(x, by, 2.2, bh); } }
      else { c.fillStyle = hsl(hue); c.globalAlpha = .88; c.fillRect(x1, by, x2 - x1, bh); c.globalAlpha = 1; }
      c.strokeStyle = EM.alpha(EM.col('bg'), .9); c.lineWidth = 1; c.strokeRect(x1 + .5, by + .5, x2 - x1 - 1, bh - 1);
      const wd = x2 - x1;
      if (wd > 20) { c.save(); c.beginPath(); c.rect(x1, by, wd, bh); c.clip(); c.fillStyle = hue < 0 ? '#111' : (dark ? '#fff' : '#111'); c.font = EM.font(wd > 60 ? 13 : 11, '800'); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(nm, (x1 + x2) / 2, by + (wd > 130 ? 20 : bh / 2)); if (wd > 130) { c.font = EM.font(10, '500'); c.fillText(desc, (x1 + x2) / 2, by + 40); } c.restore(); }
    }
    // ---------- wavelength ruler
    c.strokeStyle = EM.col('line-2'); c.beginPath(); c.moveTo(ML, by + bh + .5); c.lineTo(w - MR, by + bh + .5); c.stroke();
    EM.label(c, 'λ', 12, by + bh + 15, EM.col('acc'), { size: 15, weight: '800', align: 'center' });
    c.textBaseline = 'top'; c.textAlign = 'center';
    for (let k = Math.ceil(st.lo - 1e-9); k <= st.hi + 1e-9; k++) {
      if (k % every !== 0) continue; const x = xs(Math.pow(10, k)); c.strokeStyle = EM.col('line-2'); c.beginPath(); c.moveTo(x, by + bh); c.lineTo(x, by + bh + 5); c.stroke();
      c.fillStyle = EM.col('text-2'); c.font = EM.font(11); c.fillText(EM.len(c0 / Math.pow(10, k), 2), x, by + bh + 8);
    }
    // ---------- radar letter bands
    let y = by + bh + 34; const ry = y;
    if (st.hi - st.lo < 6) {
      EM.label(c, 'RADAR BANDS (IEEE)', ML, y - 2, EM.col('muted'), { size: 9, weight: '800' }); y += 6;
      for (const [nm, f1, f2] of RADAR) { const x1 = Math.max(ML, xs(f1)), x2 = Math.min(w - MR, xs(f2)); if (x2 <= x1 + 2) continue; c.fillStyle = EM.alpha(EM.col('acc3'), .22); c.fillRect(x1, y, x2 - x1, 22); c.strokeStyle = EM.alpha(EM.col('acc3'), .7); c.strokeRect(x1 + .5, y + .5, x2 - x1 - 1, 21); c.fillStyle = EM.col('text'); c.font = EM.font(12, '700'); c.textAlign = 'center'; c.textBaseline = 'middle'; if (x2 - x1 > 14) c.fillText(nm, (x1 + x2) / 2, y + 11.5); }
      y += 30;
    }
    // ---------- examples (greedy label placement)
    const ex = EX.filter(e => e.f2 >= Math.pow(10, st.lo) && e.f1 <= Math.pow(10, st.hi)).sort((a, b) => a.f1 - b.f1);
    const levels = [], LH = 21, y0 = y + 14, maxL = Math.max(1, Math.floor((H - y0 - 8) / LH)); c.font = EM.font(11, '600');
    st.hit = [];
    EM.label(c, 'EXAMPLES — click one', 12, y0 - 14, EM.col('muted'), { size: 9, weight: '800' });
    for (const e of ex) {
      const x1 = Math.max(ML, xs(e.f1)), x2 = Math.min(w - MR, xs(e.f2)), cx = (x1 + x2) / 2, tw = c.measureText(e.n).width + 14; let lv = -1;
      const left = Math.max(2, Math.min(w - tw - 2, cx - tw / 2));
      for (let i = 0; i < maxL; i++) { if (levels[i] == null || levels[i] < left - 3) { lv = i; levels[i] = left + tw; break; } }
      const col = e.f1 < 3e11 ? EM.col('acc') : e.f1 < 4e14 ? EM.col('acc2') : e.f1 < 8e14 ? EM.col('ok') : EM.col('violet');
      c.strokeStyle = EM.alpha(col, .55); c.lineWidth = 1; c.beginPath(); c.moveTo(cx, by + bh + 32 > y0 ? y0 - 10 : by + bh + 32); c.lineTo(cx, lv < 0 ? y0 + 6 : y0 + lv * LH + 10); c.stroke();
      c.fillStyle = col; c.globalAlpha = .9; c.fillRect(x1, y0 - 6, Math.max(3, x2 - x1), 3); c.globalAlpha = 1;
      if (lv >= 0) {
        const ty = y0 + lv * LH; c.fillStyle = EM.alpha(EM.col('panel-2'), .96); c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.roundRect(left, ty, tw, 18, 9); c.fill(); c.stroke();
        c.fillStyle = EM.col('text'); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(e.n, left + 7, ty + 9.5); st.hit.push({ e, x: left, y: ty, w: tw, h: 18 });
      }
    }
    // ---------- selection line
    const sx = xs(st.f);
    if (sx >= ML && sx <= w - MR) {
      c.strokeStyle = EM.col('acc3'); c.lineWidth = 2; c.beginPath(); c.moveTo(sx, 34); c.lineTo(sx, H - 6); c.stroke();
      c.fillStyle = EM.col('acc3'); c.beginPath(); c.moveTo(sx - 6, 30); c.lineTo(sx + 6, 30); c.lineTo(sx, 38); c.closePath(); c.fill();
      const lab = EM.freq(st.f); c.font = EM.font(12, '800'); const tw = c.measureText(lab).width + 12; const lx = Math.max(2, Math.min(w - tw - 2, sx - tw / 2)); c.fillStyle = EM.col('acc3'); c.fillRect(lx, 4, tw, 17); c.fillStyle = '#201700'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(lab, lx + 6, 13);
    }
    if (st.hover != null && Math.abs(xs(st.hover) - sx) > 3) { c.strokeStyle = EM.alpha(EM.col('text'), .35); c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(xs(st.hover), 36); c.lineTo(xs(st.hover), H - 6); c.stroke(); c.setLineDash([]); }
  };

  function setF(f, silent) { st.f = EM.clamp(f, Math.pow(10, st.lo) * 1.001, Math.pow(10, st.hi) * .999); S.redraw(); upd(); }
  S.pointer({
    down: (p) => { const hit = (st.hit || []).find(o => p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y && p.y <= o.y + o.h); if (hit) { const e = hit.e; setF(e.f2 > e.f1 ? Math.sqrt(e.f1 * e.f2) : e.f1); st.dragging = false; } else { st.dragging = true; setF(invX(p.x, S.W)); } },
    move: (p, ev, d) => { st.hover = invX(p.x, S.W); if (d && st.dragging) setF(invX(p.x, S.W)); else S.redraw(); },
    up: () => { st.dragging = false; }, leave: () => { st.hover = null; S.redraw(); },
  });
  S.cv.addEventListener('keydown', ev => { const k = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (k) { ev.preventDefault(); setF(st.f * Math.pow(10, k * (ev.shiftKey ? .25 : .03))); } });

  // ---------- info panel
  const ro = EM.readouts(left, [['f', 'Frequency', '', 'fuel'], ['lam', 'Wavelength (vacuum)', '', 'cool'], ['E', 'Photon energy', '', 'hot'], ['T', 'Period', '', '']]);
  const cmp = h('div', { class: 'info-box', style: { marginTop: '10px' } }); left.append(cmp);
  const pick = EM.select(left, { label: 'Or jump to an example', options: [['', 'choose…'], ...EX.map((e, i) => [i, e.n])], value: '', onChange: v => { if (v !== '') { const e = EX[+v]; setF(e.f2 > e.f1 ? Math.sqrt(e.f1 * e.f2) : e.f1); const lf = Math.log10(st.f); if (lf < st.lo || lf > st.hi) zoom(Math.max(0, lf - 2), Math.min(25, lf + 2)); } } }); pick.el.style.marginTop = '10px';
  function upd() {
    const f = st.f, lam = c0 / f, E = hP * f / eV;
    ro.set('f', EM.freq(f)); ro.set('lam', EM.len(lam)); ro.set('E', E < 1e-3 ? EM.si(E, 'eV', 3) : EM.si(E, 'eV', 3)); ro.set('T', EM.si(1 / f, 's'));
    let sz = SIZES[0]; for (const s of SIZES) if (Math.abs(Math.log(s[0] / lam)) < Math.abs(Math.log(sz[0] / lam))) sz = s;
    cmp.innerHTML = '<h6>Size comparison</h6>One wavelength is about the size of <b>' + sz[1] + '</b>.<br>A half-wave antenna would be <b>' + EM.len(lam / 2) + '</b> long.<br>Light-travel in one period: <b>' + EM.len(lam) + '</b>.';
    const band = BANDS.find(b => f >= b[1] && f < b[2]) || BANDS[BANDS.length - 1];
    const here = EX.filter(e => f >= e.f1 / 1.06 && f <= e.f2 * 1.06);
    const rad = RADAR.filter(b => f >= b[1] && f < b[2]).map(b => b[0]);
    let ion = E < 1.65 ? 'Far too weak to break any chemical bond: heating only, at high power.' : E < 3.2 ? 'Visible light: energy of a few eV, enough to trigger chemistry in your retina, not enough to ionise.' : E < 10 ? 'Ultraviolet: can break some molecular bonds (sunburn, DNA damage), the border of ionising.' : 'Ionising radiation: each photon can knock electrons out of atoms. Needs shielding.';
    right.innerHTML = '<h6>' + band[0] + ' — ' + band[4] + '</h6>' + (rad.length ? '<p style="margin:.2em 0"><b>Radar band:</b> ' + rad.join(', ') + '</p>' : '') + '<p style="margin:.3em 0">' + ion + '</p>' +
      (here.length ? here.map(e => '<p style="margin:.35em 0"><b>' + e.n + '.</b> ' + e.note + '</p>').join('') : '<p class="muted" style="margin:.4em 0">No labelled example here — pick another spot, or zoom in to reveal more.</p>');
  }
  upd();
});
