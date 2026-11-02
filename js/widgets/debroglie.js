/* debroglie — every moving object has a wavelength lambda = h / (m v): why only tiny things show interference */
EM.register('debroglie', function (el) {
  const W = EM.widget(el, { title: 'Everything has a wavelength: λ = h / (m v)', badge: 'Calculate',
    note: 'To see wave behaviour the wavelength must not be absurdly smaller than the slits and the object must stay isolated from its surroundings. Electrons and even 25 000-atom molecules have been sent through double slits (Vienna, 2019). A baseball’s wavelength is 10⁻³⁴ m, 10¹⁹ times smaller than a nucleus.' });
  const { main, side } = W.grid();
  const OBJ = [['Electron after 100 V', 9.109e-31, 5.93e6], ['Electron after 50 kV (electron microscope)', 9.109e-31, 1.24e8], ['Thermal neutron (neutron reactor)', 1.675e-27, 2200], ['Helium atom at room temperature', 6.646e-27, 1360], ['C₆₀ “buckyball” molecule', 1.2e-24, 200], ['Large molecule, 25 000 atomic masses', 4.15e-23, 100], ['Dust speck (1 µg) drifting', 1e-9, .001], ['Baseball (145 g) at 40 m/s', .145, 40], ['A walking person (70 kg)', 70, 1.4]];
  const S = EM.canvas(main, { aspect: .5 });
  const st = { i: 0, m: OBJ[0][1], v: OBJ[0][2] };
  const sel = EM.select(side, { label: 'Object', options: OBJ.map((o, i) => [i, o[0]]), value: 0, onChange: v => { st.i = +v; st.m = OBJ[st.i][1]; st.v = OBJ[st.i][2]; ms.set(st.m, true); vs.set(st.v, true); upd(); } });
  const ms = EM.slider(side, { label: 'Mass', min: 1e-31, max: 1e3, log: true, value: st.m, fmt: v => EM.si(v, 'kg'), onInput: v => { st.m = v; upd(); } });
  const vs = EM.slider(side, { label: 'Speed', min: 1e-3, max: 3e8, log: true, value: st.v, fmt: v => EM.si(v, 'm/s'), onInput: v => { st.v = v; upd(); } });
  const ro = EM.readouts(side, [['lam', 'de Broglie wavelength', '', 'cool'], ['cmp', 'Compared with', '', ''], ['wave', 'Wave behaviour visible?', '', 'hot']]);
  const SZ = [[1e-15, 'a proton'], [1e-10, 'an atom'], [1e-9, 'a small molecule'], [1e-7, 'a virus'], [1e-6, 'a bacterium'], [1e-4, 'a hair'], [1e-2, 'a coin'], [1.7, 'a person']];
  function upd() {
    const lam = EM.C.h / (st.m * st.v); ro.set('lam', EM.len(lam, 3));
    let b = SZ[0]; for (const s of SZ) if (Math.abs(Math.log(s[0] / lam)) < Math.abs(Math.log(b[0] / lam))) b = s;
    ro.set('cmp', 'about the size of ' + b[1]);
    ro.set('wave', lam > 1e-12 ? 'YES: bigger than a nucleus-scale slit would need' : lam > 1e-17 ? 'only with extreme effort' : 'no, hopelessly small');
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const lam = EM.C.h / (st.m * st.v), P = EM.plot(c, { x: 66, y: 14, w: w - 84, h: h - 56 }, { xmin: 1e-36, xmax: 1e-6, xlog: true, ymin: 0, ymax: 1, yticks: [], xlabel: 'de Broglie wavelength (m)', xticks: [1e-36, 1e-30, 1e-24, 1e-18, 1e-12, 1e-6], xfmt: v => '10' + EM.sup(Math.round(Math.log10(v))) });
    P.grid();
    for (const [a, b, n, cl] of [[1e-36, 1e-17, 'hopelessly tiny', 'bad'], [1e-17, 1e-12, 'extreme', 'warn'], [1e-12, 1e-6, 'wave effects demonstrated', 'ok']]) { c.fillStyle = EM.alpha(EM.col(cl), .13); c.fillRect(P.X(a), P.box.y, P.X(b) - P.X(a), P.box.h); EM.label(c, n, (P.X(a) + P.X(b)) / 2, P.box.y + 14, EM.col(cl), { size: 11, align: 'center', weight: '700' }); }
    OBJ.forEach((o, i) => { const l = EM.C.h / (o[1] * o[2]), x = P.X(l); c.fillStyle = i === st.i ? EM.col('acc3') : EM.col('muted'); c.beginPath(); c.arc(x, P.box.y + 36 + (i % 6) * 22, i === st.i ? 6 : 4, 0, 7); c.fill(); EM.label(c, o[0].split(' (')[0].replace('Electron after ', 'e⁻ '), x + 8, P.box.y + 36 + (i % 6) * 22, i === st.i ? EM.col('acc3') : EM.col('text-2'), { size: 10, weight: i === st.i ? '800' : '500' }); });
    P.vline(Math.min(1e-6, Math.max(1e-36, lam)), EM.col('acc2'), 2.5);
  };
  upd();
});
