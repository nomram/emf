/* elf-antenna — why low-frequency antennas are gigantic: radiation resistance of a short dipole vs its loss resistance */
EM.register('elf-antenna', function (el) {
  const W = EM.widget(el, { title: 'Why ELF/VLF antennas are enormous', badge: 'Calculate',
    note: 'A short antenna ($L\\ll\\lambda$) behaves like a tiny resistor for radiation: $R_{rad}\\approx20\\pi^2(L/\\lambda)^2$ ohms (triangular current). Its wire and ground also have a <b>loss resistance</b> $R_{loss}$. Efficiency is $R_{rad}/(R_{rad}+R_{loss})$. Halve the length and $R_{rad}$ drops 4×. This is a free-space idealisation; real grounded ELF antennas do worse.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .6 });
  const st = { L: 52e3, f: 76, I: 300, Rl: 5 };
  const SC = [['ELF 76 Hz, 52 km line', 52e3, 76, 5], ['VLF 24 kHz, 3 km umbrella', 3e3, 2.4e4, 1.5], ['AM radio 1 MHz, 100 m mast', 100, 1e6, 10], ['FM 100 MHz, 1.5 m dipole', 1.5, 1e8, .5], ['Wi-Fi 2.4 GHz, 6 cm', .06, 2.4e9, .2]];
  const sc = EM.select(side, { label: 'Examples', options: SC.map((s, i) => [i, s[0]]), value: 0, onChange: v => { const s = SC[+v]; st.L = s[1]; st.f = s[2]; st.Rl = s[3]; Ls.set(st.L, true); fs.set(st.f, true); rs.set(st.Rl, true); upd(); } });
  const Ls = EM.slider(side, { label: 'Antenna length L', min: .01, max: 2e5, log: true, value: 52e3, fmt: v => EM.len(v), onInput: v => { st.L = v; upd(); } });
  const fs = EM.slider(side, { label: 'Frequency', min: 10, max: 1e10, log: true, value: 76, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const rs = EM.slider(side, { label: 'Loss resistance (wire + ground)', min: .05, max: 100, log: true, value: 5, fmt: v => EM.num(v, 2) + ' Ω', onInput: v => { st.Rl = v; upd(); } });
  const is = EM.slider(side, { label: 'Antenna current', min: .1, max: 1000, log: true, value: 300, fmt: v => EM.num(v, 3) + ' A', onInput: v => { st.I = v; upd(); } });
  const ro = EM.readouts(side, [['lam', 'Wavelength λ', '', 'cool'], ['ratio', 'L / λ', '', ''], ['Rr', 'Radiation resistance', '', 'fuel'], ['eff', 'Efficiency', '', 'hot'], ['Prad', 'Radiated power', '', 'good'], ['Pin', 'Power you must supply', '', 'bad']]);
  function Rrad(L, lam) { const r = L / lam; return r < .1 ? 20 * Math.PI * Math.PI * r * r : r < .5 ? 20 * Math.PI * Math.PI * .01 + (73 - 20 * Math.PI * Math.PI * .01) * (r - .1) / .4 : 73; }   // crude blend to the half-wave value
  function upd() {
    const lam = EM.C.c / st.f, rr = Rrad(st.L, lam), eff = rr / (rr + st.Rl);
    ro.set('lam', EM.len(lam)); ro.set('ratio', EM.num(st.L / lam, 3)); ro.set('Rr', EM.num(rr, 3), 'Ω'); ro.set('eff', eff < .01 ? EM.num(eff * 100, 2) + ' %' : (eff * 100).toFixed(1) + ' %');
    ro.set('Prad', EM.si(st.I * st.I * rr, 'W')); ro.set('Pin', EM.si(st.I * st.I * (rr + st.Rl), 'W')); S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 66, y: 14, w: w - 84, h: h - 56 }, { xmin: 1e-5, xmax: 1, xlog: true, ymin: 1e-8, ymax: 2, ylog: true, xlabel: 'antenna length in wavelengths (L / λ)', ylabel: 'efficiency  R_rad / (R_rad + R_loss)', yfmt: v => EM.num(v, 1) });
    P.grid();
    P.fn(r => { const lam = 1, rr = Rrad(r * lam, lam); return rr / (rr + st.Rl); }, EM.col('acc3'), 3, 160);
    const lam = EM.C.c / st.f, r = EM.clamp(st.L / lam, 1.0001e-5, .9999), rr = Rrad(st.L, lam);
    P.dot(r, rr / (rr + st.Rl), EM.col('acc2'), 7);
    P.vline(.5, EM.alpha(EM.col('ok'), .7), 1.2, [4, 4]); EM.label(c, 'half-wave dipole: ≈ 100 % efficient', P.X(.5) - 6, P.box.y + 14, EM.col('ok'), { size: 10, align: 'right', weight: '600' });
    EM.label(c, 'slope +2: efficiency ∝ (L/λ)² when small', P.X(3e-5), P.Y(1e-7), EM.col('muted'), { size: 11, weight: '500' });
    EM.label(c, 'you are here', P.X(r) + 10, P.Y(rr / (rr + st.Rl)) + 14, EM.col('acc2'), { size: 11, weight: '700' });
    for (const [n, f] of [['ELF', 76], ['VLF', 2.4e4], ['AM', 1e6], ['FM', 1e8]]) { }
  };
  upd();
});
