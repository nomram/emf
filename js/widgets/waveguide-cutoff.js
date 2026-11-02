/* waveguide-cutoff — a metal tube below its cutoff frequency is a wall for waves but an open door for fibres, hoses and air */
EM.register('waveguide-cutoff', function (el) {
  const W = EM.widget(el, { title: 'The waveguide below cutoff: a hole that waves cannot use', badge: 'Try it',
    note: 'A hollow metal tube can carry a wave only above its <b>cutoff frequency</b> $f_c$ (circular: $f_c=0.586\\,c/D$; rectangular, widest side $a$: $f_c=c/2a$). Below $f_c$ the field inside decays exponentially, $e^{-\\alpha x}$, with $\\alpha=\\tfrac{2\\pi}{\\lambda_c}\\sqrt{1-(f/f_c)^2}$: far below cutoff that is <b>32 dB per tube diameter</b> (circular) or <b>27.3 dB per width</b> (rectangular). So a long enough narrow tube lets a fibre, hose or plastic rod into a shielded room while blocking radio waves. Above cutoff the same tube is a low-loss <em>waveguide</em> that carries the wave straight through.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .34 }), B = EM.canvas(main, { aspect: .5 }); B.cv.style.marginTop = '10px';
  const c0 = EM.C.c, st = { shape: 'circ', D: .006, t: .06, f: 1e9 };
  const PRE = [['Fibre-optic feedthrough: 6 mm bore, 60 mm long', 'circ', .006, .06], ['Vent honeycomb cell: 6 mm, 25 mm deep', 'circ', .006, .025], ['Oven waveguide WR-340 (86 × 43 mm), 100 mm', 'rect', .0864, .1], ['Air-hose / pipe: 25 mm bore, 100 mm long', 'circ', .025, .1], ['Plastic rod through the wall: 10 mm, 150 mm', 'circ', .01, .15], ['Short sloppy hole: 6 mm, 2 mm (thin sheet)', 'circ', .006, .002]];
  EM.select(side, { label: 'Real examples', options: PRE.map((p, i) => [i, p[0]]), value: 0, onChange: v => { const p = PRE[+v]; st.shape = p[1]; st.D = p[2]; st.t = p[3]; Ds.set(st.D, true); ts.set(st.t, true); sh.set(st.shape, true); upd(); } });
  const sh = EM.seg(side, [['circ', 'Round tube'], ['rect', 'Rectangular duct']], 'circ', v => { st.shape = v; upd(); });
  const Ds = EM.slider(side, { label: 'Diameter D (or width a)', min: .001, max: .5, log: true, value: .006, fmt: v => EM.len(v), onInput: v => { st.D = v; upd(); } });
  const ts = EM.slider(side, { label: 'Tube length (depth of the hole)', min: .001, max: .6, log: true, value: .06, fmt: v => EM.len(v), onInput: v => { st.t = v; upd(); } });
  const fs = EM.slider(side, { label: 'Frequency', min: 1e6, max: 3e11, log: true, value: 1e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const ro = EM.readouts(side, [['fc', 'Cutoff frequency f_c', '', 'cool'], ['att', 'Attenuation through the tube', '', 'hot'], ['mode', 'At this frequency', '', 'fuel'], ['rule', 'Tube length for 100 dB far below cutoff', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const fc = () => st.shape === 'circ' ? .5861 * c0 / st.D : c0 / (2 * st.D);
  const per = () => st.shape === 'circ' ? 32 : 27.3;
  function att(f) { const F = fc(); if (f >= F) return 0; const lc = c0 / F, al = 2 * Math.PI / lc * Math.sqrt(1 - Math.pow(f / F, 2)); return 8.686 * al * st.t; }
  function upd() {
    const F = fc(), a = att(st.f), lam = c0 / st.f;
    ro.set('fc', EM.freq(F)); ro.set('att', a > 400 ? '> 400 dB' : a === 0 ? '≈ 0 dB (guided)' : EM.fixed(a, 0), a > 0 && a <= 400 ? 'dB' : ''); ro.set('mode', st.f < F ? 'evanescent: the wave is blocked' : 'propagates: λ_guide = ' + EM.len(lam / Math.sqrt(1 - Math.pow(F / st.f, 2)))); ro.set('rule', EM.len(100 / per() * st.D) + ' (' + EM.num(100 / per(), 3) + ' × the width)');
    info.innerHTML = '<h6>' + (st.f < F ? 'Below cutoff' : 'Above cutoff') + '</h6>' + (st.f < F ? 'The tube is ' + EM.num(st.t / st.D, 3) + ' widths long, giving ≈ ' + EM.fixed(a, 0) + ' dB. <b>Rule:</b> depth ≥ 3 × width gives about 100 dB for any frequency well below cutoff; this is how fibres, hoses, shafts and ventilation pass through shielded rooms. Make sure the tube is <em>metal and bonded to the wall all the way round</em>, and that nothing metallic runs through it (a metal wire inside it becomes a guide of its own).' : 'This frequency is above the cutoff: the tube guides the wave with almost no loss, so it is now a <b>leak</b>, not a shield. Shrink the tube (raise $f_c$) or accept it only if nothing at that frequency needs to be kept out. Used deliberately, the same tube is the <b>waveguide</b> that carries microwaves from a magnetron to the oven cavity (chapter 17).'); if (window.renderMath) window.renderMath(info); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const F = fc(), cy = h / 2, x0 = w * .18, x1 = w * .82, th = Math.min(h * .55, 70), lam = c0 / st.f, a = att(st.f), tt = performance.now() / 1000;
    c.fillStyle = EM.col('bg-2'); c.fillRect(0, 0, w, h);
    c.fillStyle = EM.alpha(EM.col('muted'), .55); c.fillRect(x0, 0, x1 - x0, cy - th / 2); c.fillRect(x0, cy + th / 2, x1 - x0, cy - th / 2);       // wall with the tube
    c.fillStyle = EM.alpha(EM.col('acc'), .1); c.fillRect(x0, cy - th / 2, x1 - x0, th);
    const above = st.f >= F, al = above ? 0 : (2 * Math.PI / (c0 / F) * Math.sqrt(1 - Math.pow(st.f / F, 2))), lg = above ? lam / Math.sqrt(1 - Math.pow(F / st.f, 2)) : 1;
    // incoming wave
    for (let x = 6; x < x0; x += 16) { c.strokeStyle = EM.alpha(EM.col('acc'), .6); c.lineWidth = 2; const xx = x + ((tt * 30) % 16); if (xx < x0 - 2) { c.beginPath(); c.moveTo(xx, cy - th * .45); c.lineTo(xx, cy + th * .45); c.stroke(); } }
    // field inside the tube
    c.strokeStyle = EM.col('acc3'); c.lineWidth = 2.6; c.beginPath(); for (let i = 0; i <= 200; i++) { const xm = st.t * i / 200, X = x0 + (x1 - x0) * i / 200; const env = above ? 1 : Math.exp(-al * xm), v = above ? Math.sin(2 * Math.PI * xm / lg - tt * 4) : Math.cos(tt * 4); const y = cy - v * env * th * .42; i ? c.lineTo(X, y) : c.moveTo(X, y); } c.stroke();
    if (!above) { c.strokeStyle = EM.alpha(EM.col('bad'), .8); c.setLineDash([4, 4]); c.beginPath(); for (let i = 0; i <= 100; i++) { const xm = st.t * i / 100, X = x0 + (x1 - x0) * i / 100, y = cy - Math.exp(-al * xm) * th * .42; i ? c.lineTo(X, y) : c.moveTo(X, y); } c.stroke(); c.setLineDash([]); }
    EM.label(c, above ? 'wave guided through (low loss)' : 'wave decays exponentially inside the tube', (x0 + x1) / 2, cy + th / 2 + 22, above ? EM.col('bad') : EM.col('ok'), { size: 11, align: 'center', weight: '700' });
    EM.label(c, a > 99 ? 'outside: strong' : 'outside', 6, 14, EM.col('muted'), { size: 10 }); EM.label(c, a > 400 ? 'inside: nothing' : a > 0 ? 'inside: −' + EM.fixed(a, 0) + ' dB' : 'inside: full strength', x1 + 8, 14, a > 20 ? EM.col('ok') : EM.col('bad'), { size: 10, weight: '700' });
  };
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 1e6, xmax: 3e11, xlog: true, ymin: 0, ymax: 160, xlabel: 'frequency', ylabel: 'attenuation (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yticks: [0, 40, 80, 120, 160] });
    P.grid(); const F = fc(); c.fillStyle = EM.alpha(EM.col('ok'), .08); c.fillRect(P.box.x, P.box.y, P.X(F) - P.box.x, P.box.h); c.fillStyle = EM.alpha(EM.col('bad'), .1); c.fillRect(P.X(F), P.box.y, P.box.x + P.box.w - P.X(F), P.box.h);
    P.clip(); P.fn(f => Math.min(160, att(f)), EM.col('acc3'), 3.2, 400); P.unclip(); P.vline(F, EM.col('text'), 1.5, [5, 4]); P.vline(st.f, EM.col('acc2'), 1.5);
    EM.label(c, 'blocks', P.X(F) - 8, P.box.y + 14, EM.col('ok'), { size: 11, align: 'right', weight: '800' }); EM.label(c, 'passes', P.X(F) + 8, P.box.y + 14, EM.col('bad'), { size: 11, weight: '800' }); EM.label(c, 'f_c', P.X(F) + 4, P.box.y + P.box.h - 10, EM.col('text'), { size: 10 });
    for (const [n, f] of [['FM', 1e8], ['Wi-Fi', 2.4e9], ['radar X', 1e10], ['77 GHz', 7.7e10]]) EM.label(c, n, P.X(f), P.box.y + P.box.h - 22, EM.col('muted'), { size: 9, align: 'center' });
  };
  EM.loop(el, () => A.redraw());
  upd();
});
