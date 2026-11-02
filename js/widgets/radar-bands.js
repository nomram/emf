/* radar-bands — letter bands L..W: wavelength, antenna size for a given beamwidth, rain loss, uses */
EM.register('radar-bands', function (el) {
  const W = EM.widget(el, { title: 'Choosing a radar band', badge: 'Compare',
    note: 'Each band trades <b>antenna size</b> (a narrow beam needs $D\\approx70\\lambda/\\theta$) against <b>weather loss</b> (rain attenuation $\\gamma=kR^{\\alpha}$ dB/km, ITU-R P.838 coefficients) and <b>range</b>. Set a target beamwidth and a rain rate; click a band for its typical uses.' });
  const h = EM.h;
  const B = [
    ['HF', .015, 'OTH radar', 'Over-the-horizon radar by ionospheric bounce (ch. 11a): 1000–3000 km range, poor resolution, enormous arrays.', .003],
    ['VHF', .15, 'Early warning', 'Long-range surveillance, anti-stealth (stealth shaping works poorly at long λ), wind profilers, ground-penetrating radar. Large antennas.', .004],
    ['UHF', .5, 'Early warning / UHF GPR', 'Ballistic-missile early warning (PAVE PAWS 420–450 MHz), foliage penetration, ground-penetrating radar.', .005],
    ['L', 1.3, 'Air-route surveillance', 'Long-range air-traffic control (1.3 GHz), GPS L-band, satellite SAR (ALOS PALSAR), soil moisture mapping, penetrates foliage.', .006],
    ['S', 3, 'Airport / weather', 'Airport surveillance (ASR), NEXRAD weather (2.7–3 GHz), naval air-defence (SPY-1). Good rain penetration.', .008],
    ['C', 5.6, 'Weather / SAR', 'C-band weather radars (Europe), Sentinel-1 SAR (5.4 GHz), shipborne navigation, ground surveillance.', .01],
    ['X', 9.6, 'Tracking / marine', 'Marine navigation radar, fire control, missile seekers, high-resolution SAR (TerraSAR-X, ICEYE), small weather radars.', .02],
    ['Ku', 15, 'High-res SAR / altimeters', 'Radar altimeters over ice and sea (13.5 GHz), drone SAR, satellite scatterometers.', .04],
    ['K', 22, 'Police / water-vapour', 'Police speed radar (24 GHz), short-range sensors; atmospheric water-vapour line at 22.2 GHz makes it lossy.', .18],
    ['Ka', 35, 'Cloud / guidance', 'Cloud radar (35 GHz), airborne/automotive precursors, missile guidance, speed cameras (35 GHz).', .12],
    ['V', 60, 'Short-range sensing', 'Oxygen absorption (~15 dB/km at 60 GHz) makes it useless at range but ideal for secure short links and presence sensing.', 14],
    ['W', 94, 'Automotive / cloud', 'Automotive radar (76–81 GHz), 94 GHz cloud radar, security scanners, space-borne cloud profiling (CloudSat).', .45],
  ];
  const KA = [[1, 3.87e-5, .912], [2, 1.54e-4, .963], [4, 6.5e-4, 1.121], [6, 1.75e-3, 1.308], [8, 4.54e-3, 1.327], [10, .01217, 1.2571], [15, .04481, 1.1233], [20, .09164, 1.0568], [30, .2403, .9485], [40, .4431, .8673], [60, .8606, .7656], [94, 1.06, .70]];
  const rainK = f => { if (f <= KA[0][0]) return [KA[0][1] * Math.pow(f, .9), KA[0][2]]; for (let i = 1; i < KA.length; i++) if (f <= KA[i][0]) { const a = KA[i - 1], b = KA[i], t = Math.log(f / a[0]) / Math.log(b[0] / a[0]); return [Math.exp(Math.log(a[1]) + (Math.log(b[1]) - Math.log(a[1])) * t), a[2] + (b[2] - a[2]) * t]; } return [KA[KA.length - 1][1], KA[KA.length - 1][2]]; };
  const st = { bw: 3, rain: 25, rng: 20, sel: 4 };
  const S = EM.canvas(W.body, { aspect: .62, minH: 340, cursor: 'pointer' });
  const ctl = h('div', { class: 'wgrid even', style: { marginTop: '12px' } }); W.body.append(ctl);
  const L = h('div', { class: 'ctls' }), R = h('div'); ctl.append(L, R);
  EM.slider(L, { label: 'Wanted antenna beamwidth', min: .5, max: 10, step: .1, value: 3, unit: '°', onInput: v => { st.bw = v; upd(); } });
  EM.slider(L, { label: 'Rain rate', min: 0, max: 100, step: 1, value: 25, unit: 'mm/h', onInput: v => { st.rain = v; upd(); } });
  EM.slider(L, { label: 'Distance through the rain (one way)', min: 1, max: 100, log: true, value: 20, unit: 'km', fmt: v => EM.num(v, 3) + ' km', onInput: v => { st.rng = v; upd(); } });
  const info = h('div', { class: 'info-box' }); R.append(info);
  const rows = B.map(b => { const f = b[1], lam = EM.C.c / (f * 1e9), D = 70 * lam / st.bw; return { f, lam }; });
  function metrics(i) { const b = B[i], f = b[1], lam = EM.C.c / (f * 1e9), D = 70 * lam / st.bw, [k, a] = rainK(f), g = k * Math.pow(st.rain, a), gas = b[4]; return { f, lam, D, rain: g * st.rng * 2, gas: gas * st.rng * 2, g }; }
  function upd() { const m = metrics(st.sel), b = B[st.sel]; info.innerHTML = '<h6>' + b[0] + ' band · ' + EM.num(b[1], 3) + ' GHz · λ ' + EM.len(m.lam) + '</h6>' + b[3] + '<br><b>Antenna for ' + st.bw + '° beam:</b> ' + EM.len(m.D) + '. <b>Two-way rain loss over ' + st.rng + ' km at ' + st.rain + ' mm/h:</b> ' + EM.fixed(m.rain, 1) + ' dB (' + EM.num(m.g, 2) + ' dB/km one way); <b>clear-air gas loss:</b> ' + EM.fixed(m.gas, 1) + ' dB.'; S.redraw(); }
  S.draw = (c, w, hh) => {
    const n = B.length, pl = 60, pw = w - pl - 12, cw = pw / n, half = hh / 2 - 16;
    const mets = B.map((b, i) => metrics(i));
    // antenna diameter chart (top)
    const Pd = EM.plot(c, { x: pl, y: 14, w: pw, h: half - 18 }, { xmin: 0, xmax: n, ymin: .003, ymax: 1000, ylog: true, ylabel: 'antenna size (m)', xticks: [], yfmt: v => EM.num(v, 2) });
    Pd.grid(); mets.forEach((m, i) => { const sel = i === st.sel, y = Pd.Y(Math.max(.003, m.D)); c.fillStyle = sel ? EM.col('acc3') : EM.alpha(EM.col('acc'), .75); c.fillRect(pl + i * cw + cw * .12, y, cw * .76, Pd.box.y + Pd.box.h - y); EM.label(c, EM.len(m.D, 2).replace(' ', ''), pl + i * cw + cw / 2, y - 8, sel ? EM.col('acc3') : EM.col('text-2'), { size: 9, align: 'center', weight: '600' }); });
    // loss chart (bottom)
    const y0 = hh / 2 + 8, Pl = EM.plot(c, { x: pl, y: y0, w: pw, h: half - 16 }, { xmin: 0, xmax: n, ymin: .01, ymax: 1000, ylog: true, ylabel: 'two-way loss (dB)', xticks: [], yfmt: v => EM.num(v, 2) });
    Pl.grid(); mets.forEach((m, i) => { const sel = i === st.sel, tot = m.rain + m.gas, y = Pl.Y(Math.max(.01, tot)); c.fillStyle = sel ? EM.col('acc3') : EM.alpha(EM.col('bad'), .75); c.fillRect(pl + i * cw + cw * .12, y, cw * .76, Pl.box.y + Pl.box.h - y); EM.label(c, EM.fixed(tot, tot < 10 ? 1 : 0), pl + i * cw + cw / 2, y - 8, sel ? EM.col('acc3') : EM.col('text-2'), { size: 9, align: 'center', weight: '600' }); c.fillStyle = sel ? EM.col('acc3') : EM.col('text-2'); c.font = EM.font(11, sel ? '800' : '600'); c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(B[i][0], pl + i * cw + cw / 2, Pl.box.y + Pl.box.h + 6); });
    S.layout = { pl, cw, n };
  };
  S.pointer({ down: (p) => { const l = S.layout, i = Math.floor((p.x - l.pl) / l.cw); if (i >= 0 && i < l.n) { st.sel = i; upd(); } } });
  upd();
});
