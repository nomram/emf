/* speed-calc — c = 1/sqrt(mu0 eps0), and the slower speed in materials */
EM.register('speed-calc', function (el) {
  const W = EM.widget(el, { title: 'The speed of light falls out of two constants', badge: 'Calculate',
    note: 'Maxwell computed $1/\\sqrt{\\mu_0\\varepsilon_0}$ from two table-top measurements (one electric, one magnetic) and found the speed of light. In a material the constants are multiplied by $\\mu_r,\\varepsilon_r$ and the wave slows to $v=c/n$, $n=\\sqrt{\\mu_r\\varepsilon_r}$.' });
  const { main, side } = W.grid('even');
  const MAT = { vac: ['Vacuum', 1, 1], air: ['Air', 1.0006, 1], teflon: ['PTFE (Teflon)', 2.1, 1], pe: ['Polyethylene', 2.3, 1], glass: ['Glass (radio)', 6, 1], conc: ['Concrete (radio)', 6, 1], water: ['Fresh water, 100 MHz', 80, 1], ferrite: ['Ferrite (μr = 100, εr = 12)', 12, 100] };
  const out = EM.h('div', { class: 'info-box', style: { fontFamily: 'var(--mono)', fontSize: '.92rem' } });
  main.append(out);
  const sel = EM.select(side, { label: 'Material', options: Object.entries(MAT).map(([k, v]) => [k, v[0]]), value: 'water', onChange: upd });
  const f = EM.slider(side, { label: 'Frequency', min: 1e6, max: 1e11, log: true, value: 1e9, fmt: v => EM.freq(v), onInput: upd });
  const ro = EM.readouts(side, [['n', 'Refractive index n', '', 'cool'], ['v', 'Wave speed', '', 'fuel'], ['lam', 'Wavelength inside', '', 'hot'], ['z', 'Impedance η', '', '']]);
  function upd() {
    const m = MAT[sel.get()], er = m[1], mr = m[2], n = Math.sqrt(er * mr), v = EM.C.c / n, fr = f.get();
    out.innerHTML = 'μ₀ = ' + EM.num(EM.C.mu0, 5) + ' H/m<br>ε₀ = ' + EM.num(EM.C.eps0, 5) + ' F/m<br>c = 1/√(μ₀ε₀) = ' + EM.num(1 / Math.sqrt(EM.C.mu0 * EM.C.eps0), 7) + ' m/s<br><br>' + m[0] + ': εr = ' + er + ', μr = ' + mr + '<br>v = c/√(μrεr) = ' + EM.num(v, 4) + ' m/s';
    ro.set('n', n.toFixed(3)); ro.set('v', EM.si(v, 'm/s')); ro.set('lam', EM.len(v / fr)); ro.set('z', EM.num(EM.C.eta0 * Math.sqrt(mr / er), 4), 'Ω');
  }
  upd();
});
