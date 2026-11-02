/* faraday-cage — shielding effectiveness of an enclosure: absorption by the metal skin vs leakage through apertures */
EM.register('faraday-cage', function (el) {
  const W = EM.widget(el, { title: 'Faraday cage: how good is a metal box with holes?', badge: 'Calculate',
    note: 'Two things limit a shield. <b>The metal:</b> absorption loss $A=8.686\\,t/\\delta$ dB (skin depth $\\delta=1/\\sqrt{\\pi f\\mu\\sigma}$): poor at low frequency, excellent at high. <b>The holes:</b> an aperture of largest dimension $l$ leaks, with $SE\\approx20\\log_{10}(\\lambda/2l)$ dB when $l<\\lambda/2$ (and ≈ 0 dB when the hole is larger than half a wavelength). A mesh of tiny holes in thick metal acts as many waveguides below cutoff, adding $≈32\\,t_h/D$ dB for a hole of diameter $D$ and depth $t_h$. The shield is only as good as its <b>weakest</b> mechanism.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .6 });
  const st = { f: 2.45e9, l: 2e-3, t: 5e-4, mat: 'steel', n: 1, hole: 'mesh', th: 1e-3 };
  const MAT = { cu: ['Copper', 5.8e7, 1], al: ['Aluminium', 3.5e7, 1], steel: ['Steel (mild, μr ≈ 100 at low f)', 1e7, 100], mesh: ['Fine steel mesh (screening)', 1e7, 1] };
  const PRE = [['Microwave-oven door mesh (2.45 GHz, 2 mm holes)', 2.45e9, 2e-3, 5e-4, 'steel', 1e-3], ['Visible light through the same holes', 5.5e14, 2e-3, 5e-4, 'steel', 1e-3], ['Chicken-wire cage (25 mm) vs FM radio', 1e8, 25e-3, 1e-3, 'steel', 1e-3], ['Window screen (1.5 mm) vs Wi-Fi 2.4 GHz', 2.4e9, 1.5e-3, 3e-4, 'al', 3e-4], ['Metal enclosure with a 1 cm seam vs 1 GHz', 1e9, 1e-2, 1e-3, 'al', 1e-3], ['Solid steel box (no holes) vs 50 Hz field', 50, 1e-9, 2e-3, 'steel', 2e-3], ['Aluminium foil bag (0.02 mm) vs Wi-Fi', 2.4e9, 1e-9, 2e-5, 'al', 2e-5], ['Car body with windows (30 cm gaps) vs FM', 1e8, .3, 1e-3, 'steel', 1e-3]];
  EM.select(side, { label: 'Real examples', options: [['', 'choose…'], ...PRE.map((p, i) => [i, p[0]])], value: 0, onChange: v => { if (v === '') return; const p = PRE[+v]; st.f = p[1]; st.l = p[2]; st.t = p[3]; st.mat = p[4]; st.th = p[5]; fs.set(st.f, true); ls.set(Math.max(1e-5, st.l), true); ts.set(st.t, true); ms.set(st.mat, true); upd(); } });
  const fs = EM.slider(side, { label: 'Frequency', min: 10, max: 1e15, log: true, value: 2.45e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const ls = EM.slider(side, { label: 'Largest opening / gap l', min: 1e-5, max: 1, log: true, value: 2e-3, fmt: v => EM.len(v), onInput: v => { st.l = v; upd(); } });
  const ts = EM.slider(side, { label: 'Metal thickness', min: 1e-6, max: .02, log: true, value: 5e-4, fmt: v => EM.len(v), onInput: v => { st.t = v; st.th = v; upd(); } });
  const ms = EM.select(side, { label: 'Metal', options: Object.entries(MAT).map(([k, v]) => [k, v[0]]), value: 'steel', onChange: v => { st.mat = v; upd(); } });
  const ro = EM.readouts(side, [['lam', 'Wavelength', '', 'cool'], ['abs', 'Metal absorption (solid sheet)', '', 'fuel'], ['ap', 'Aperture limit', '', 'hot'], ['tot', 'Shielding effectiveness', '', 'good'], ['lim', 'What limits it', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function calc(f) {
    const m = MAT[st.mat], lam = EM.C.c / f, delta = 1 / Math.sqrt(Math.PI * f * EM.C.mu0 * m[2] * m[1]), absdB = 8.686 * st.t / delta;
    const ratio = lam / (2 * st.l); let ap = st.l < .9 && st.l > 2e-8 ? (ratio > 1 ? 20 * Math.log10(ratio) : 0) : 200;
    const fc = .586 * EM.C.c / st.l; if (ap > 0 && ap < 199 && f < fc) ap += 32 * st.th / st.l * Math.sqrt(1 - Math.pow(f / fc, 2));       // hole as a waveguide below cutoff
    const leak = Math.pow(10, -Math.min(absdB, 400) / 20) + (ap >= 199 ? 0 : Math.pow(10, -ap / 20));
    return { lam, delta, absdB, ap, tot: -20 * Math.log10(Math.max(leak, 1e-12)) };
  }
  function upd() {
    const r = calc(st.f); ro.set('lam', EM.len(r.lam)); ro.set('abs', r.absdB > 300 ? '> 300 dB' : EM.fixed(r.absdB, 0), r.absdB > 300 ? '' : 'dB'); ro.set('ap', r.ap >= 199 ? 'no holes' : EM.fixed(r.ap, 0), r.ap >= 199 ? '' : 'dB'); ro.set('tot', EM.fixed(Math.max(0, r.tot), 0), 'dB'); ro.set('lim', r.ap < r.absdB ? 'the openings' : 'the metal skin');
    info.innerHTML = '<h6>' + (r.tot > 60 ? 'Excellent shield' : r.tot > 30 ? 'Good: reduces fields to ≈ ' + EM.num(Math.pow(10, -r.tot / 20) * 100, 2) + ' %' : r.tot > 10 ? 'Poor' : 'Essentially transparent') + '</h6>' + (r.ap < r.absdB && r.ap < 199 ? 'The wave is wavelength ' + EM.len(r.lam) + ' and the opening ' + EM.len(st.l) + ': ' + (st.l >= r.lam / 2 ? 'the hole is as big as half a wavelength, so the wave walks through.' : 'only ' + EM.fixed(r.ap, 0) + ' dB leak limit.') : 'The metal is ' + EM.len(st.t) + ' thick, skin depth ' + EM.len(r.delta) + ': ' + (st.t < r.delta ? 'thinner than one skin depth, so the wave is barely attenuated (typical for low frequencies and magnetic fields).' : 'many skin depths, so absorption is strong.')) + ' <b>A microwave oven:</b> a 2 mm hole against λ = 12.2 cm gives ≈ 30 dB from the opening formula plus ≈ 16 dB from the hole depth (waveguide below cutoff): about 45 dB per layer. The real door adds a choke seal around its edge to exceed 60 dB. Visible light (λ = 0.55 µm) passes the very same holes freely.'; S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 62, y: 14, w: w - 80, h: h - 56 }, { xmin: 10, xmax: 1e15, xlog: true, ymin: 0, ymax: 160, xlabel: 'frequency', ylabel: 'shielding effectiveness (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yticks: [0, 40, 80, 120, 160] });
    P.grid(); const old = st.f; const tot = f => { st.f = f; const r = calc(f); st.f = old; return Math.max(0, Math.min(160, r.tot)); }, ab = f => Math.min(160, calc(f).absdB), ap = f => Math.min(160, calc(f).ap);
    P.clip(); P.fn(ab, EM.alpha(EM.col('acc'), .85), 2, 300, [5, 4]); P.fn(ap, EM.alpha(EM.col('bad'), .85), 2, 300, [5, 4]); P.fn(tot, EM.col('acc3'), 3.2, 400); P.unclip();
    P.vline(st.f, EM.col('text'), 1.5); P.dot(st.f, tot(st.f), EM.col('acc2'), 6);
    for (const [n, f] of [['50 Hz', 50], ['AM', 1e6], ['FM', 1e8], ['2.4 GHz', 2.4e9], ['light', 5.5e14]]) EM.label(c, n, P.X(f), P.box.y + P.box.h - 8, EM.col('muted'), { size: 9, align: 'center' });
    EM.label(c, 'metal absorption (blue)   aperture leakage (red)   total (yellow)', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  upd();
});
