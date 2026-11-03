/* conductivity-chart — electrical conductivity of materials on a log scale, and what it means: skin depth and shielding of a sheet */
EM.register('conductivity-chart', function (el) {
  const W = EM.widget(el, { title: 'Conductivity of materials, and what it does to a wave', badge: 'Graph',
    note: 'Conductivity $\\sigma$ (siemens per metre) spans <b>over 30 orders of magnitude</b>. Switch the view: the skin depth $\\delta=1/\\sqrt{\\pi f\\mu\\sigma}$ is how far a wave gets into the material before it falls to 1/e (chapter 6); a sheet of thickness $t$ then shields by absorption $A=8.686\\,t/\\delta$ plus reflection $R$ (Ott’s plane-wave formula, $R=168+10\\log(\\sigma_r/\\mu_rf)$, $\\sigma_r=\\sigma/\\sigma_{Cu}$). Thin bars show the typical spread of published values: alloys, temperature, moisture and purity change them a lot.' });
  const { main, side } = W.grid();
  // [name, category, typical sigma, low, high, mu_r at DC, corner frequency of mu_r (Hz), note]
  const M = [
    ['Silver', 'metal', 6.3e7, 6.0e7, 6.3e7, 1, 0, 'The best conductor; tarnishes to a poorer surface. Used for plating of contacts and waveguides.'],
    ['Copper (annealed)', 'metal', 5.96e7, 5.7e7, 5.96e7, 1, 0, 'The reference (IACS 100 %). Excellent for shields, but heavy, costly and prone to oxidising.'],
    ['Gold', 'metal', 4.1e7, 4.0e7, 4.5e7, 1, 0, 'Does not corrode; used in thin plating on connectors.'],
    ['Aluminium', 'metal', 3.5e7, 3.0e7, 3.8e7, 1, 0, '61 % of copper but one third of the density: the most common lightweight shield. A native oxide skin limits seam contact.'],
    ['Magnesium', 'metal', 2.2e7, 2.0e7, 2.4e7, 1, 0, 'Very light; used in die-cast housings; corrodes unless coated.'],
    ['Tungsten', 'metal', 1.8e7, 1.7e7, 1.9e7, 1, 0, 'Dense, hard; used for X-ray and gamma shielding rather than for RF.'],
    ['Zinc', 'metal', 1.7e7, 1.6e7, 1.8e7, 1, 0, 'The coating of galvanised steel.'],
    ['Brass', 'alloy', 1.5e7, 1.1e7, 1.6e7, 1, 0, 'Copper-zinc alloy; machinable; EMI gaskets and feedthrough bodies.'],
    ['Nickel', 'metal', 1.4e7, 1.2e7, 1.5e7, 100, 1e5, 'Mildly magnetic. Nickel plating is a common conductive coating.'],
    ['Iron (pure)', 'metal', 1.0e7, 0.9e7, 1.0e7, 5000, 1e4, 'Very high permeability at low frequency.'],
    ['Tin', 'metal', 9.2e6, 8.5e6, 9.5e6, 1, 0, 'Solder and plating.'],
    ['Mild steel', 'alloy', 6e6, 4e6, 7e6, 1000, 5e3, 'Poorer conductor but magnetic: at 50 Hz–10 kHz it is a better shield than copper against magnetic fields. At MHz its permeability collapses and it is only a modest conductor.'],
    ['Lead', 'metal', 4.8e6, 4.5e6, 5.0e6, 1, 0, 'Dense; for X-rays, not for RF.'],
    ['Titanium', 'metal', 2.4e6, 2.0e6, 2.5e6, 1, 0, 'Strong, light, poor conductor; aircraft structures.'],
    ['Stainless steel 304', 'alloy', 1.4e6, 1.3e6, 1.5e6, 1, 0, 'Non-magnetic, corrosion-resistant, 40× poorer than copper: skin depth is large; used for rugged enclosures and microwave oven cavities.'],
    ['Mu-metal', 'alloy', 1.7e6, 1.5e6, 1.9e6, 3e4, 3e3, 'Nickel-iron alloy with extreme permeability at low frequency: shields <em>static and ELF magnetic</em> fields. Loses it at high frequency, saturates and is spoiled by bending.'],
    ['Nichrome', 'alloy', 9.1e5, 8.5e5, 9.5e5, 1, 0, 'Heating wire: a deliberately poor conductor.'],
    ['ITO (indium tin oxide)', 'transparent', 7e5, 3e5, 1e6, 1, 0, 'The transparent conductor of screens: 1000× poorer than copper, so it must be thin to stay clear.'],
    ['Silver ink / epoxy', 'soft', 2e6, 1e5, 1e7, 1, 0, 'Printed or glued silver flakes: conductive adhesives and printed antennas.'],
    ['Graphite (in-plane)', 'carbon', 2.5e5, 1e5, 3e6, 1, 0, 'Carbon block or sheet; anisotropic.'],
    ['Nickel paint (EMI coating)', 'soft', 4e4, 1e4, 1e5, 1, 0, 'Conductive paint for plastic housings: 30–60 dB, mainly by reflection.'],
    ['Carbon-fibre composite (along fibres)', 'carbon', 5e4, 1e4, 1e5, 1, 0, 'Conducts but 1000× worse than aluminium: carbon-fibre aircraft need added mesh for lightning protection.'],
    ['Heavily doped silicon', 'soft', 1e4, 1e2, 1e5, 1, 0, 'Semiconductor: conductivity tunable over many decades.'],
    ['Conductive polymer (PEDOT:PSS)', 'soft', 1e4, 1e2, 1e5, 1, 0, 'Printable, flexible; antistatic coatings and touch sensors.'],
    ['Seawater', 'earth', 4.8, 3, 5.5, 1, 0, 'Salt ions carry current: a lossy conductor that stops radio below a few hundred hertz of depth (chapters 6, 8).'],
    ['Human tissue (muscle)', 'earth', .5, .3, 1.0, 1, 0, 'Salty water in a bag: a poor conductor and a lossy dielectric.'],
    ['Wet soil', 'earth', 1e-2, 1e-3, 5e-2, 1, 0, 'Varies with moisture and salts.'],
    ['Concrete (cured)', 'earth', 1e-2, 1e-3, 1e-1, 1, 0, 'Poor conductor that is wet inside; rebar reflects.'],
    ['Drinking water', 'earth', 2e-2, 5e-3, 5e-2, 1, 0, 'Pure water is an insulator; dissolved salts make it conduct.'],
    ['Dry soil', 'earth', 1e-3, 1e-4, 1e-2, 1, 0, ''],
    ['Window glass', 'insulator', 1e-12, 1e-14, 1e-10, 1, 0, 'Insulator: no shielding.'],
    ['Dry wood', 'insulator', 1e-13, 1e-15, 1e-10, 1, 0, 'Insulator when dry.'],
    ['Polyethylene / plastics', 'insulator', 1e-16, 1e-18, 1e-14, 1, 0, 'Excellent insulators: why plastic enclosures need a coating.'],
  ];
  const CAT = { metal: ['Metals', 'acc2'], alloy: ['Alloys', 'warn'], carbon: ['Carbon', 'muted'], transparent: ['Transparent conductors', 'acc'], soft: ['Inks, paints, polymers, semiconductors', 'acc3'], earth: ['Water, soil, tissue', 'ok'], insulator: ['Insulators', 'bad'] };
  const st = { v: 'sigma', f: 1e6, t: 1e-3, sel: 1 };
  EM.seg(side, [['sigma', 'Conductivity'], ['delta', 'Skin depth'], ['se', 'Shielding of a sheet']], 'sigma', v => { st.v = v; upd(); });
  EM.slider(side, { label: 'Frequency', min: 1, max: 1e11, log: true, value: 1e6, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  EM.slider(side, { label: 'Sheet thickness', min: 1e-6, max: .1, log: true, value: 1e-3, fmt: v => EM.len(v), onInput: v => { st.t = v; upd(); } });
  const ro = EM.readouts(side, [['n', 'Selected', '', 'cool'], ['s', 'Conductivity', '', 'fuel'], ['d', 'Skin depth at this frequency', '', 'hot'], ['se', 'Shielding of the sheet', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const S = EM.canvas(main, { height: 36 * 19 + 52, cursor: 'pointer' });
  const mur = (m, f) => m[5] > 1 && m[6] > 0 ? 1 + (m[5] - 1) / (1 + f / m[6]) : 1;
  const delta = (m, f, sg) => Math.min(1e5, 1 / Math.sqrt(Math.PI * f * EM.C.mu0 * mur(m, f) * sg));
  function seOf(m, f, t, sg) { const sr = sg / 5.8e7, mu = mur(m, f), R = Math.max(0, 168 + 10 * Math.log10(sr / (mu * f))), A = 8.686 * t / delta(m, f, sg); return Math.min(250, R + A); }
  function upd() {
    const m = M[st.sel], d = delta(m, st.f, m[2]);
    ro.set('n', m[0]); ro.set('s', EM.num(m[2], 2), 'S/m'); ro.set('d', d >= 1e4 ? '> 10 km (no skin effect)' : EM.len(d)); ro.set('se', EM.fixed(seOf(m, st.f, st.t, m[2]), 0), 'dB');
    info.innerHTML = '<h6>' + m[0] + '</h6>' + (m[7] || '') + (m[5] > 1 ? ' Its relative permeability is about ' + EM.num(mur(m, st.f), 3) + ' at ' + EM.freq(st.f) + ' (it falls with frequency).' : ''); S.redraw();
  }
  S.draw = (c, w, h) => {
    const lw = Math.min(210, w * .4), top = 38, rh = (h - top - 30) / M.length, x0 = lw, x1 = w - 14;
    const v = st.v; let lo, hi, fmt, val, rng;
    if (v === 'sigma') { lo = -18; hi = 8.5; fmt = e => '10' + EM.sup(e); val = m => Math.log10(m[2]); rng = m => [Math.log10(m[3]), Math.log10(m[4])]; }
    else if (v === 'delta') { lo = -7; hi = 5; fmt = e => '10' + EM.sup(e) + ' m'; val = m => Math.log10(delta(m, st.f, m[2])); rng = m => [Math.log10(delta(m, st.f, m[4])), Math.log10(delta(m, st.f, m[3]))]; }
    else { lo = 0; hi = 250; fmt = e => e + ' dB'; val = m => seOf(m, st.f, st.t, m[2]); rng = m => [seOf(m, st.f, st.t, m[3]), seOf(m, st.f, st.t, m[4])]; }
    const X = e => x0 + (Math.min(hi, Math.max(lo, e)) - lo) / (hi - lo) * (x1 - x0);
    const ticks = v === 'se' ? [0, 50, 100, 150, 200, 250] : Array.from({ length: Math.floor((hi - lo) / (v === 'sigma' ? 4 : 2)) + 1 }, (_, i) => lo + i * (v === 'sigma' ? 4 : 2));
    c.font = EM.font(10); c.textAlign = 'center'; c.textBaseline = 'top'; c.strokeStyle = EM.col('line'); c.lineWidth = 1;
    ticks.forEach(e => { if (e < lo || e > hi) return; const x = Math.round(X(e)) + .5; c.beginPath(); c.moveTo(x, top - 4); c.lineTo(x, h - 28); c.stroke(); c.fillStyle = EM.col('muted'); c.fillText(fmt(e), x, h - 24); });
    EM.label(c, v === 'sigma' ? 'conductivity σ (S/m), logarithmic' : v === 'delta' ? 'skin depth at ' + EM.freq(st.f) + ', logarithmic' : 'shielding of a ' + EM.len(st.t) + ' sheet at ' + EM.freq(st.f) + ' (dB)', (x0 + x1) / 2, 12, EM.col('text-2'), { size: 11, weight: '600', align: 'center' });
    if (v === 'delta') [[-3, '1 mm'], [-2, '1 cm']].forEach(([e, s]) => { const x = X(e); c.strokeStyle = EM.alpha(EM.col('muted'), .7); c.setLineDash([3, 3]); c.beginPath(); c.moveTo(x, top - 4); c.lineTo(x, h - 28); c.stroke(); c.setLineDash([]); EM.label(c, s, x + 2, top + 2, EM.col('muted'), { size: 9 }); });
    S.layout = { y0: top, rh, n: M.length };
    M.forEach((m, i) => { const y = top + i * rh, cy = y + rh / 2, col = EM.col(CAT[m[1]][1]), on = i === st.sel;
      if (on) { c.fillStyle = EM.alpha(EM.col('acc3'), .12); c.fillRect(0, y, w, rh); }
      EM.label(c, m[0], lw - 8, cy, on ? EM.col('text') : EM.col('text-2'), { size: 10.5, align: 'right', weight: on ? '700' : '400', base: 'middle' });
      const vv = val(m), [a, b] = rng(m); c.fillStyle = EM.alpha(col, on ? .95 : .75); c.fillRect(x0, y + rh * .2, Math.max(1, X(vv) - x0), rh * .6);
      { c.strokeStyle = EM.col('text'); c.lineWidth = 1.2; c.beginPath(); c.moveTo(X(Math.min(a, b)), cy); c.lineTo(X(Math.max(a, b)), cy); c.moveTo(X(Math.min(a, b)), cy - 3); c.lineTo(X(Math.min(a, b)), cy + 3); c.moveTo(X(Math.max(a, b)), cy - 3); c.lineTo(X(Math.max(a, b)), cy + 3); c.stroke(); } });
  };
  S.pointer({ down: p => { const l = S.layout, i = Math.floor((p.y - l.y0) / l.rh); if (i >= 0 && i < l.n) { st.sel = i; upd(); } } });
  const leg = EM.h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: '.78rem', color: 'var(--text-2)', marginTop: '6px' } });
  Object.values(CAT).forEach(([n, k]) => leg.append(EM.h('span', {}, EM.h('span', { style: { display: 'inline-block', width: '10px', height: '10px', background: 'var(--' + k + ')', marginRight: '5px', borderRadius: '2px' } }), n)));
  main.append(leg);
  upd();
});
