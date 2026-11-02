/* emp-coupling — why a broadband pulse excites every cable: pulse spectrum x wire "antenna" response with resonances n c / 2L */
EM.register('emp-coupling', function (el) {
  const W = EM.widget(el, { title: 'Why every cable is an antenna for a pulse', badge: 'Try it',
    note: 'A wire or cable of length $L$ picks up a wave like a dipole: its effective height is $h_e(f)=\\dfrac{c}{\\pi f}\\big|\\sin\\dfrac{\\pi Lf}{c}\\big|$, equal to $L$ at low frequency and peaking near the resonances $f_n=n\\,c/2L$. A pulse that contains <b>all frequencies</b> excites the resonance of <em>whatever</em> length it meets: the induced voltage spectrum is (pulse spectrum) × $h_e(f)$. Shorter cables ring at higher frequencies. This shows the idea; real coupling depends on height above ground, terminations and shielding.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .6 });
  const st = { L: 5, k: 'e1' };
  const PRE = [['USB / phone cable (1 m)', 1], ['Ethernet patch (5 m)', 5], ['Building wiring run (30 m)', 30], ['Overhead power line span (300 m)', 300], ['Long communication line (3 km)', 3000], ['PCB trace (10 cm)', .1], ['Antenna cable on a rooftop (20 m)', 20]];
  EM.select(side, { label: 'Examples', options: PRE.map((p, i) => [i, p[0]]), value: 1, onChange: v => { st.L = PRE[+v][1]; Ls.set(st.L, true); upd(); } });
  const Ls = EM.slider(side, { label: 'Cable length', min: .03, max: 1e4, log: true, value: 5, fmt: v => EM.len(v), onInput: v => { st.L = v; upd(); } });
  EM.seg(side, [['e1', 'Fast nuclear E1'], ['light', 'Lightning'], ['esd', 'Static spark']], 'e1', v => { st.k = v; upd(); });
  const ro = EM.readouts(side, [['f1', 'First resonance c / 2L', '', 'cool'], ['peak', 'Wire resonances inside the pulse band', '', 'hot'], ['ring', 'Ringing period 2L/c', '', 'fuel'], ['pt', 'Protection that fits', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const AP = { e1: [4e7, 6e8], light: [1.4e4, 6e6], esd: [1.5e7, 1.2e9] }, c0 = EM.C.c;
  const spec = f => { const [a, b] = AP[st.k], w = 2 * Math.PI * f; return Math.hypot(...EM.cx.sub(EM.cx.div([1, 0], [a, w]), EM.cx.div([1, 0], [b, w]))); };
  const he = f => c0 / (Math.PI * f) * Math.abs(Math.sin(Math.PI * st.L * f / c0));
  function upd() {
    const f1 = c0 / (2 * st.L); const edge = AP[st.k][1] / (2 * Math.PI), nres = Math.floor(edge / f1);
    ro.set('f1', EM.freq(f1)); ro.set('peak', nres + ' (up to ' + EM.freq(edge) + ')'); ro.set('ring', EM.si(2 * st.L / c0, 's')); ro.set('pt', st.L < 2 ? 'filters + clamps at the port; short, shielded paths' : st.L < 100 ? 'shielded cable, surge arresters, ferrites, bonded grounds' : 'surge arresters, isolation transformers, fibre-optic links');
    info.innerHTML = '<h6>Reading the plot</h6>The <span class="y-col">product (yellow)</span> shows what actually builds up in the cable. For the nuclear E1 pulse the energy sits between ≈ 1 MHz and ≈ 200 MHz, exactly the range of cable resonances for lengths from 1 m to 100 m: that is why <b>building wiring and antenna cables</b> are the main entry paths. A <b>fibre-optic</b> link has no metal to resonate; <b>shielding</b> and <b>filtering</b> at the entry point attack the problem before it reaches the electronics.'; S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 62, y: 14, w: w - 80, h: h - 56 }, { xmin: 1e4, xmax: 1e10, xlog: true, ymin: -100, ymax: 10, xlabel: 'frequency', ylabel: 'relative (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yticks: [-100, -80, -60, -40, -20, 0] });
    P.grid(); const s0 = spec(1e4), norm = f => 20 * Math.log10(Math.max(1e-14, spec(f) / s0)), hmax = c0 / Math.PI;
    P.clip(); P.fn(f => norm(f), EM.alpha(EM.col('acc2'), .9), 2.2, 300, [5, 4]); P.fn(f => 20 * Math.log10(Math.max(1e-6, he(f) / st.L)), EM.alpha(EM.col('acc'), .9), 2.2, 700); P.fn(f => norm(f) + 20 * Math.log10(Math.max(1e-6, he(f) / st.L)), EM.col('acc3'), 3.2, 900); P.unclip();
    for (let n = 1; n <= 5; n++) { const fn = n * c0 / (2 * st.L); if (fn > 1e4 && fn < 1e10) { P.vline(fn, EM.alpha(EM.col('acc'), .35), 1, [2, 3]); EM.label(c, n === 1 ? 'f₁' : 'f' + n, P.X(fn) + 2, P.box.y + P.box.h - 8, EM.col('acc'), { size: 10 }); } }
    EM.label(c, 'pulse spectrum (orange dashed)   wire pickup h_e (blue)   induced spectrum = product (yellow)', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  upd();
});
