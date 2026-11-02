/* photon-ladder — what can ONE photon of a given energy do? thresholds from heat to pair production */
EM.register('photon-ladder', function (el) {
  const W = EM.widget(el, { title: 'What can one photon do? The energy ladder', badge: 'Try it',
    note: 'Drag the slider. The ticks are the energy you need for each effect. A photon acts <b>one at a time</b>: ten thousand photons that are each too weak do <em>not</em> add up to one strong one, which is why radio power can never ionise anything, but a single X-ray photon can.' });
  const S = EM.canvas(W.body, { aspect: .4, minH: 240 });
  const body = EM.h('div', { class: 'wgrid even', style: { marginTop: '12px' } }); W.body.append(body);
  const L = EM.h('div', { class: 'ctls' }), R = EM.h('div'); body.append(L, R);
  const T = [   // [energy eV, name, short, effect class]
    [2.59e-2, 'Room-temperature thermal energy kT', 'kT', 0], [9.9e-6, 'Wi-Fi 2.4 GHz photon', 'Wi-Fi', 0], [1.2e-3, 'Molecular rotation (microwave oven, water)', 'rotation', 1], [.1, 'Molecular vibration (infrared)', 'vibration', 1],
    [1.65, 'Red light: retinal molecule changes shape', 'vision', 2], [1.12, 'Silicon band gap (solar cell)', 'Si gap', 2], [3.6, 'Break a C–C bond', 'C–C', 3], [4.8, 'Break an O–H bond; UV-C damages DNA', 'DNA', 3],
    [12.6, 'Ionise a water molecule', 'ionise H₂O', 4], [13.6, 'Ionise hydrogen', 'ionise H', 4], [284, 'Knock out a carbon K-shell (inner) electron', 'K-shell', 5], [1.022e6, 'Make an electron–positron pair (2 m_e c²)', 'pair', 6], [8e6, 'Eject a neutron/proton from a nucleus (photodisintegration)', 'nuclear', 7],
  ].sort((a, b) => a[0] - b[0]);
  const st = { E: 1.65 };
  const sl = EM.slider(L, { label: 'Photon energy', min: 1e-6, max: 1e8, log: true, value: 1.65, fmt: v => EM.si(v, 'eV'), onInput: v => { st.E = v; upd(); } });
  const ro = EM.readouts(L, [['f', 'Frequency', '', 'fuel'], ['lam', 'Wavelength', '', 'cool'], ['verdict', 'Ionising?', '', 'hot']]);
  const list = EM.h('div', { class: 'info-box', style: { padding: '8px 10px' } }); R.append(list);
  function upd() {
    const E = st.E, f = E * EM.C.e / EM.C.h; ro.set('f', EM.freq(f)); ro.set('lam', EM.len(EM.C.c / f)); ro.set('verdict', E < 3.6 ? 'no' : E < 12.5 ? 'not quite (breaks bonds)' : 'YES');
    list.innerHTML = T.map(t => { const ok = E >= t[0]; return '<div style="display:flex;gap:8px;padding:2px 0;color:' + (ok ? 'var(--text)' : 'var(--muted)') + '"><span style="width:1.3em;color:' + (ok ? 'var(--ok)' : 'var(--line-2)') + ';font-weight:800">' + (ok ? '✓' : '✗') + '</span><span style="flex:1;font-size:.84rem">' + t[1] + '</span><span style="font-family:var(--mono);font-size:.78rem">' + EM.si(t[0], 'eV', 2) + '</span></div>'; }).join('');
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 20, y: 10, w: w - 40, h: h - 64 }, { xmin: 1e-6, xmax: 1e8, xlog: true, ymin: 0, ymax: 1, yticks: [], xlabel: 'photon energy (eV)', xfmt: v => EM.si(v, 'eV', 1).replace(' ', '') });
    // zones
    const zones = [[1e-6, 3.1e-1, 'heat / rotation / vibration', 'ok'], [.31, 3.6, 'electron excitation', 'acc3'], [3.6, 12.5, 'bond breaking', 'warn'], [12.5, 1e8, 'IONISING', 'bad']];
    for (const [a, b, n, cl] of zones) { c.fillStyle = EM.alpha(EM.col(cl), .13); c.fillRect(P.X(a), P.box.y, P.X(b) - P.X(a), P.box.h); EM.label(c, n, (P.X(a) + Math.min(P.X(b), P.box.x + P.box.w)) / 2 + (b > 1e7 ? -90 : 0), P.box.y + 12, EM.col(cl), { size: 11, align: 'center', weight: '800' }); }
    P.grid({ noMinor: false });
    let lvl = 0, lastEnd = -1e9;
    T.forEach(t => { const x = P.X(t[0]); const ly = P.box.y + 28 + (lvl % 4) * 20; c.strokeStyle = EM.alpha(EM.col('text'), .5); c.lineWidth = 1; c.beginPath(); c.moveTo(x, ly); c.lineTo(x, P.box.y + P.box.h); c.stroke(); c.fillStyle = EM.col('text'); c.beginPath(); c.arc(x, P.box.y + P.box.h, 3, 0, 7); c.fill(); EM.label(c, t[2], x + 3, ly, EM.col('text-2'), { size: 10, weight: '600' }); lvl++; });
    const x = P.X(st.E); c.strokeStyle = EM.col('acc3'); c.lineWidth = 3; c.beginPath(); c.moveTo(x, P.box.y); c.lineTo(x, P.box.y + P.box.h); c.stroke();
  };
  upd();
});
