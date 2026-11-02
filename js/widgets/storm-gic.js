/* storm-gic — famous geomagnetic storms (Dst) and the physics of geomagnetically induced currents in long power lines */
EM.register('storm-gic', function (el) {
  const W = EM.widget(el, { title: 'Geomagnetic storms and the currents in power lines', badge: 'Explore',
    note: 'A storm makes the magnetic field at the ground change over minutes. By Faraday (chapter 3) that induces a <b>geoelectric field</b> $E$ in the Earth, in V/km. A long grounded power line of length $L$ with total loop resistance $R$ carries a nearly-DC <b>geomagnetically induced current</b> $I=EL/R$, which pushes transformer cores into half-cycle saturation. Storm strength is summarised by the <b>Dst</b> index (nT, more negative = stronger). Values are widely quoted in the open literature; 1859 and 1921 are estimates.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .55 });
  const EV = [
    ['Carrington event, 1–2 Sep 1859', -850, 'Dst estimated at −850 nT and possibly as low as −1760 nT. Auroras seen near the equator; telegraph systems failed, operators received shocks, some paper caught fire. The CME took ≈ 17.6 hours.', 'est.'],
    ['“Railroad storm”, May 1921', -907, 'Estimated Dst about −900 nT: telegraph and railway signalling disrupted in North America and Europe.', 'est.'],
    ['Québec blackout, 13 Mar 1989', -589, 'Hydro-Québec’s grid collapsed in about 90 seconds; six million people lost power for roughly nine hours. Aurora seen as far south as Florida and Cuba.', 'measured'],
    ['“Halloween storms”, Oct 2003', -383, 'Auroras seen at low latitudes. A blackout hit Malmö in southern Sweden (tens of thousands of customers for 20–50 minutes); transformers were damaged in South Africa; satellites and aviation affected.', 'measured'],
    ['St Patrick’s Day storm, Mar 2015', -223, 'G4 storm: strong aurora, minor radio and GNSS problems, no major grid failure.', 'measured'],
    ['“Gannon” storm, 10–11 May 2024', -412, 'G5 (the first since 2003): auroras to low latitudes in Europe and North America; GNSS-guided farm equipment and some satellite operations disturbed; no grid collapse reported.', 'measured'],
    ['Near miss, 23 Jul 2012', -600, 'A Carrington-class CME crossed Earth’s orbit and missed our planet by about nine days (observed by STEREO-A). The expected Dst, if it had hit, is estimated at several hundred nT.', 'est.'],
  ];
  const st = { i: 2, E: 2, L: 400, R: 4 };
  const sel = EM.select(side, { label: 'Historic storm', options: EV.map((e, i) => [i, e[0]]), value: 2, onChange: v => { st.i = +v; upd(); } });
  EM.slider(side, { label: 'Geoelectric field E', min: .05, max: 40, log: true, value: 2, fmt: v => EM.num(v, 3) + ' V/km', onInput: v => { st.E = v; upd(); } });
  EM.slider(side, { label: 'Power line length L', min: 20, max: 1500, log: true, value: 400, fmt: v => EM.num(v, 3) + ' km', onInput: v => { st.L = v; upd(); } });
  EM.slider(side, { label: 'Loop resistance R (line + transformers + earthing)', min: .5, max: 30, log: true, value: 4, fmt: v => EM.num(v, 3) + ' Ω', onInput: v => { st.R = v; upd(); } });
  const pre = EM.h('div', { class: 'btn-row' }); side.append(pre); [['Moderate storm: 0.5 V/km', .5], ['NERC benchmark: 8 V/km', 8], ['Quoted severe case: 20 V/km', 20]].forEach(([t, v]) => EM.btn(pre, t, () => { st.E = v; side.querySelectorAll('input')[0].value = Math.round(1000 * Math.log(v / .05) / Math.log(40 / .05)); side.querySelectorAll('input')[0].dispatchEvent(new Event('input')); }, 'small'));
  const ro = EM.readouts(side, [['V', 'Induced voltage along the line', '', 'fuel'], ['I', 'Quasi-DC current (GIC)', '', 'hot'], ['risk', 'Transformer risk', '', 'bad']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function upd() {
    const V = st.E * st.L, I = V / st.R, e = EV[st.i];
    ro.set('V', EM.si(V, 'V')); ro.set('I', EM.num(I, 3), 'A'); ro.set('risk', I < 10 ? 'low' : I < 50 ? 'noticeable: harmonics, heating' : I < 150 ? 'high: half-cycle saturation, hot spots' : 'severe: relays trip, damage possible');
    info.innerHTML = '<h6>' + e[0] + ' (Dst ' + (e[3] === 'est.' ? '≈ ' : '') + e[1] + ' nT)</h6>' + e[2] + '<br><b>Physics:</b> at 60 Hz, a transformer core is designed to swing symmetrically. A steady extra current of a few tens of amps shifts the operating point, so the core saturates on every half-cycle, drawing huge reactive current, heating the windings and generating harmonics that can trip protection. Longer lines, high-latitude locations, resistive ground (rock) and low-resistance high-voltage lines (low R) make GIC larger. Operators use forecasts (hours to a day of warning), reduce load, and add neutral blocking devices. <span class="muted">The NERC benchmark for planning is about 8 V/km (a 1-in-100-year storm at 60° geomagnetic latitude). Published estimates of the slow E3 component of a high-altitude nuclear burst range from a few to tens of V/km, with large uncertainty.</span>'; A.redraw();
  }
  A.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 210, y: 14, w: w - 226, h: h - 46 }, { xmin: 0, xmax: 1900, ymin: 0, ymax: 1, yticks: [], xlabel: '|Dst| (nT): peak depression of the equatorial magnetic field', xticks: [0, 400, 800, 1200, 1600] });
    P.grid(); const rh = P.box.h / EV.length; EV.forEach((e, i) => { const y = P.box.y + i * rh, on = i === st.i; c.fillStyle = e[3] === 'est.' ? EM.alpha(EM.col('bad'), on ? 1 : .6) : EM.alpha(EM.col('acc'), on ? 1 : .7); c.fillRect(P.X(0), y + 4, P.X(-e[1]) - P.X(0), rh - 9); if (e[3] === 'est.' && e[0].startsWith('Carrington')) { c.fillStyle = EM.alpha(EM.col('bad'), .3); c.fillRect(P.X(850), y + 4, P.X(1760) - P.X(850), rh - 9); } c.fillStyle = on ? EM.col('text') : EM.col('text-2'); c.font = EM.font(11, on ? '700' : '500'); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(e[0].split(',')[0].replace('Carrington event', 'Carrington 1859'), P.box.x - 8, y + rh / 2); EM.label(c, '' + e[1], P.X(-e[1]) + 6, y + rh / 2, EM.col('text-2'), { size: 10 }); });
    EM.label(c, 'red = estimated from historical records', P.box.x + P.box.w - 6, P.box.y + 12, EM.col('muted'), { size: 10, align: 'right' });
    S.rows = { y0: P.box.y, rh };
  };
  const S = A; A.pointer({ down: p => { const r = A.rows, i = Math.floor((p.y - r.y0) / r.rh); if (i >= 0 && i < EV.length) { st.i = i; sel.set(i, true); upd(); } } });
  upd();
});
