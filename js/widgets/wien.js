/* wien — thermal radiation: everything glows; hotter means shorter wavelength (Planck / Wien) */
EM.register('wien', function (el) {
  const W = EM.widget(el, { title: 'Everything warm glows: Planck curves', badge: 'Try it',
    note: 'Every object above absolute zero radiates a continuous spectrum set only by its temperature. The peak wavelength is $\\lambda_{peak}=2898\\ \\mu\\text{m·K}/T$ (Wien). It explains why you glow in the infrared, why a hot stove turns red, and why the Sun is yellow-white.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const st = { T: 5772 };
  const PRE = [['Cosmic microwave background', 2.725], ['Liquid nitrogen', 77], ['Human skin', 305], ['Boiling water', 373], ['Red-hot stove', 900], ['Light-bulb filament', 2700], ['The Sun', 5772], ['Hot star (Sirius)', 9900]];
  const sl = EM.slider(side, { label: 'Temperature', min: 2, max: 2e4, log: true, value: 5772, fmt: v => EM.num(v, 4) + ' K', onInput: v => { st.T = v; sel.sel.value = ''; upd(); } });
  const sel = EM.select(side, { label: 'Presets', options: [['', 'choose…'], ...PRE.map((p, i) => [i, p[0]])], value: 6, onChange: v => { if (v !== '') { st.T = PRE[+v][1]; sl.set(st.T, true); upd(); } } });
  const ro = EM.readouts(side, [['lam', 'Peak wavelength', '', 'cool'], ['f', 'Peak frequency', '', 'fuel'], ['P', 'Radiated power', '', 'hot'], ['sw', 'Looks like', '', '']]);
  const swatch = EM.h('div', { style: { height: '26px', borderRadius: '8px', border: '1px solid var(--line-2)' } }); side.append(swatch);
  function planck(lam, T) { const a = 2 * EM.C.h * EM.C.c * EM.C.c / Math.pow(lam, 5), x = EM.C.h * EM.C.c / (lam * EM.C.kB * T); return x > 700 ? 0 : a / (Math.exp(x) - 1); }
  function upd() {
    const T = st.T, lp = 2.898e-3 / T; ro.set('lam', EM.len(lp)); ro.set('f', EM.freq(EM.C.c / lp)); ro.set('P', EM.si(5.670374e-8 * Math.pow(T, 4), 'W/m²'));
    // colour from blackbody (rough tanner-helland approx)
    const t = EM.clamp(T, 1000, 40000) / 100; let r, g, b;
    r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -.1332); g = t <= 66 ? 99.47 * Math.log(t) - 161.1 : 288.1 * Math.pow(t - 60, -.0755); b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305.0;
    const rgb = [r, g, b].map(v => Math.round(EM.clamp(v, 0, 255)));
    const vis = T > 700; swatch.style.background = vis ? 'rgb(' + rgb.join(',') + ')' : 'var(--panel-3)';
    ro.set('sw', T < 700 ? 'dark (infrared only)' : T < 1500 ? 'dull red' : T < 3500 ? 'orange' : T < 5000 ? 'yellow-orange' : T < 7000 ? 'white' : 'blue-white');
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 66, y: 14, w: w - 84, h: h - 56 }, { xmin: 1e-7, xmax: 1e-2, xlog: true, ymin: 1e-12, ymax: 1e1, ylog: true, xlabel: 'wavelength', ylabel: 'relative intensity', xfmt: v => EM.len(v, 1).replace(' ', ''), yfmt: v => '' });
    // visible band
    c.save(); c.beginPath(); c.rect(P.box.x, P.box.y, P.box.w, P.box.h); c.clip();
    for (let x = P.X(380e-9); x < P.X(780e-9); x += 1) { const nm = P.invX(x) * 1e9, rgb = EM.nm2rgb(nm); c.fillStyle = 'rgba(' + rgb.join(',') + ',.28)'; c.fillRect(x, P.box.y, 1.5, P.box.h); } c.restore();
    P.grid();
    // normalised so that the peak of the selected curve is at 1; others shown too
    const peakOf = T => planck(2.898e-3 / T, T), ref = peakOf(st.T);
    P.clip();
    for (const [nm, T] of [['Skin', 305], ['Filament', 2700], ['Sun', 5772]]) { if (Math.abs(Math.log(T / st.T)) < .02) continue; P.fn(l => planck(l, T) / ref, EM.alpha(EM.col('muted'), .7), 1.5, 150, [4, 4]); }
    P.fn(l => planck(l, st.T) / ref, EM.col('acc3'), 3, 200);
    P.unclip();
    const lp = 2.898e-3 / st.T; P.dot(lp, 1, EM.col('acc2'), 6); EM.label(c, 'peak ' + EM.len(lp), P.X(lp) + 9, P.Y(1) - 9, EM.col('acc2'), { size: 11, weight: '700' });
    EM.label(c, 'visible', P.X(550e-9), P.box.y + 12, EM.col('text-2'), { size: 11, align: 'center' });
    EM.label(c, 'dashed: skin, filament, Sun for comparison', P.box.x + P.box.w - 8, P.box.y + 12, EM.col('muted'), { size: 11, align: 'right', weight: '500' });
  };
  upd();
});
