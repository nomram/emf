/* cage-materials — which material for a Faraday cage? Shielding vs frequency for solid sheets, foils, meshes, fabrics, paints and building materials, with weight and practical notes */
EM.register('cage-materials', function (el) {
  const W = EM.widget(el, { title: 'What should my Faraday cage be made of?', badge: 'Compare',
    note: 'Solid sheet: absorption $A=8.686\\,t/\\delta$ plus reflection $R$ (Ott: plane wave $168+10\\log(\\sigma_r/\\mu_rf)$). Thin film or fabric: $SE=20\\log(1+188.5/R_s)$ with the sheet resistance $R_s$. Mesh: the lesser of its film value and the opening limit $20\\log(\\lambda/2g)$. For a <b>magnetic near field</b> a thin sheet only works through eddy currents, $SE\\approx20\\log\\sqrt{1+(\\omega\\mu_0 d/2R_s)^2}$, so thin foil does nothing at 50 Hz, while a permeable metal (steel, mu-metal) adds flux shunting $\\approx1+\\tfrac23\\mu_rt/R$. The numbers are for <b>perfect seams</b>; a real box is limited by its worst leak (chapter 16a).' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { height: 14 * 24 + 40, cursor: 'pointer' }), B = EM.canvas(main, { aspect: .5 }); B.cv.style.marginTop = '10px';
  const RHO = { cu: 1.7e-8, al: 2.8e-8, fe: 1.7e-7 };
  // kind: solid | film | mesh. fields: name, kind, sigma, mu0, fmu, t, [Rs] [p,w,rho,dens], mass kg/m2, cls
  const M = [
    { n: 'Copper sheet 0.5 mm', k: 'solid', s: 5.8e7, mu: 1, fm: 0, t: 5e-4, m: 8960 * 5e-4, c: 'acc2', note: 'The benchmark: best conductor, solderable seams, no mild corrosion problem. Heavy and expensive. Contact with aluminium or steel in damp air corrodes the less noble metal.' },
    { n: 'Copper foil tape 35 µm', k: 'solid', s: 5.8e7, mu: 1, fm: 0, t: 3.5e-5, m: 8960 * 3.5e-5 + .05, c: 'acc2', note: 'Self-adhesive tape for repairs and for sealing seams: thin yet reflective down to a few kHz for electric fields. Conductive adhesive matters: with plain adhesive the overlap is a capacitor, not a joint.' },
    { n: 'Aluminium sheet 1.5 mm', k: 'solid', s: 3.5e7, mu: 1, fm: 0, t: 1.5e-3, m: 2700 * 1.5e-3, c: 'warn', note: 'Light, cheap, easy to work: the usual choice for enclosures and shielded rooms. A native oxide skin makes seams poor unless gaskets or conductive finishes (chromate) are used. Cannot be soldered.' },
    { n: 'Kitchen aluminium foil 15 µm', k: 'solid', s: 3.5e7, mu: 1, fm: 0, t: 1.5e-5, m: 2700 * 1.5e-5, c: 'warn', note: 'Reflection alone gives high values to MHz and GHz for an intact sheet, and so tin-foil wrapping works in the lab; in practice tears, creases and open seams dominate, and magnetic or 50 Hz fields pass straight through.' },
    { n: 'Galvanised steel 1 mm', k: 'solid', s: 6e6, mu: 1000, fm: 5e3, t: 1e-3, m: 7850 * 1e-3, c: 'ok', note: 'Magnetic, so it also helps at low frequency (50 Hz to tens of kHz). Cheap, strong and welds; the zinc coat protects it. Used in shielded rooms and cabinets. At MHz its permeability falls and it is a modest conductor.' },
    { n: 'Stainless steel 304, 1 mm', k: 'solid', s: 1.4e6, mu: 1, fm: 0, t: 1e-3, m: 8000 * 1e-3, c: 'muted', note: 'Corrosion-proof and rugged, but 40× poorer a conductor than copper: reflection is lower and skin depth larger. Welded seams are good. Microwave-oven cavities are made of it.' },
    { n: 'Mu-metal 1 mm', k: 'solid', s: 1.7e6, mu: 3e4, fm: 3e3, t: 1e-3, m: 8700 * 1e-3, c: 'acc3', note: 'The specialist for static and low-frequency <em>magnetic</em> fields (50 Hz transformers, CRT, MRI fringe, magnetometers). Useless as a general RF shield, expensive, and permanently degraded if bent or hammered after annealing.' },
    { n: 'Copper screen (1 mm pitch, 0.2 mm wire)', k: 'mesh', p: 1e-3, w: 2e-4, rho: RHO.cu, m: 2 * Math.PI / 4 * 4e-8 * 8960 / 1e-3, c: 'acc2', note: 'Fine mesh: transparent to air and light, good to the GHz range. The limit is the opening, $SE\\approx20\\log(\\lambda/2g)$; solder or weld the crossings, or contact resistance wrecks it.' },
    { n: 'Chicken wire (25 mm, 0.9 mm steel)', k: 'mesh', p: 2.5e-2, w: 9e-4, rho: RHO.fe, m: 2 * Math.PI / 4 * 8.1e-7 * 7850 / 2.5e-2, c: 'bad', note: 'Cheap and 100 % open to air, but its large holes pass anything above a few hundred MHz, and its twisted junctions are not bonded: a leaky shield in reality.' },
    { n: 'Rebar mesh in concrete (150 mm, 10 mm bars)', k: 'mesh', p: .15, w: 1e-2, rho: RHO.fe, m: 2 * Math.PI / 4 * 1e-4 * 7850 / .15, c: 'muted', note: 'Why buildings attenuate radio only 10–30 dB: the reinforcement is a coarse cage. Good for LF fields, almost transparent to GHz.' },
    { n: 'Ni/Cu-plated conductive fabric (0.05 Ω/sq)', k: 'film', Rs: .05, m: .08, c: 'ok', note: 'Ripstop fabric for tents, bags, curtains and clothing (about 60–80 dB in the lab at GHz). Flexible and light; seams need conductive tape or thread. Wears and creases reduce the figure.' },
    { n: 'Metallised plastic Faraday bag (0.5 Ω/sq)', k: 'film', Rs: .5, m: .06, c: 'warn', note: 'Phone and key-fob pouches. Closure and seam leakage usually limit these to a lab value of 30–60 dB or less.' },
    { n: 'Conductive nickel paint (1 Ω/sq)', k: 'film', Rs: 1, m: .1, c: 'acc3', note: 'Sprayed onto plastic housings or interior walls: 30–50 dB, thickness uniformity and adhesion at edges are the problem.' },
    { n: 'ITO glass (15 Ω/sq)', k: 'film', Rs: 15, m: 10, c: 'acc', note: 'See-through but weak: a thin film of resistive oxide. A window usually sets the limit of a transparent room (chapter 16a).' },
  ];
  const st = { f: 1e8, mode: 'plane', sort: 'se', sel: 0, r: .3, Rbox: .15 };
  EM.seg(side, [['plane', 'Radio wave (far field)'], ['mag', 'Magnetic near field']], 'plane', v => { st.mode = v; upd(); });
  EM.slider(side, { label: 'Frequency', min: 10, max: 1e11, log: true, value: 1e8, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  EM.seg(side, [['se', 'Best shielding'], ['mass', 'Lightest'], ['perkg', 'Shielding per kg']], 'se', v => { st.sort = v; upd(); });
  const ro = EM.readouts(side, [['n', 'Selected', '', 'cool'], ['se', 'Shielding (perfect seams)', '', 'fuel'], ['lim', 'Limited by', '', 'hot'], ['m', 'Mass per square metre', '', 'good'], ['pk', 'Shielding per kg', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const dl = (m, f, sg, mu) => 1 / Math.sqrt(Math.PI * f * EM.C.mu0 * mu * sg);
  const muF = (m, f) => m.mu > 1 && m.fm ? 1 + (m.mu - 1) / (1 + f / m.fm) : 1;
  function se(m, f, mode) {
    if (m.k === 'solid') {
      const mu = muF(m, f), sr = m.s / 5.8e7, d = dl(m, f, m.s, mu), Aab = 8.686 * m.t / d;
      if (mode === 'plane') { const R = Math.max(0, 168 + 10 * Math.log10(sr / (mu * f))); return { v: Math.min(200, R + Aab), lim: R > Aab ? 'reflection' : 'absorption' }; }
      const Rs = 1 / (m.s * Math.min(m.t, d)), eddy = 10 * Math.log10(1 + Math.pow(2 * Math.PI * f * EM.C.mu0 * st.r / (2 * Rs), 2)) + Aab, shunt = 20 * Math.log10(1 + 2 / 3 * mu * m.t / st.Rbox);
      return { v: Math.min(200, Math.max(eddy, shunt)), lim: shunt > eddy ? 'flux shunting (permeability)' : 'eddy currents' };
    }
    const Rs = m.k === 'mesh' ? m.rho * m.p / (m.w * m.w) : m.Rs; let film, lim = 'sheet resistance';
    if (mode === 'plane') film = 20 * Math.log10(1 + 188.5 / Rs); else film = 10 * Math.log10(1 + Math.pow(2 * Math.PI * f * EM.C.mu0 * st.r / (2 * Rs), 2));
    if (m.k === 'mesh') { const lam = EM.C.c / f, g = m.p - m.w, ap = Math.max(0, 20 * Math.log10(lam / (2 * g))); if (mode === 'plane' && ap < film) return { v: ap, lim: 'mesh openings' }; if (mode === 'mag') { const lim2 = Math.max(0, 20 * Math.log10(lam / (2 * g))); if (lim2 < film) return { v: lim2, lim: 'mesh openings' }; } }
    return { v: Math.min(200, film), lim };
  }
  const rank = () => M.map((m, i) => { const r = se(m, st.f, st.mode); return { i, v: r.v, lim: r.lim, m: m.m, pk: r.v / m.m }; }).sort((a, b) => st.sort === 'se' ? b.v - a.v : st.sort === 'mass' ? a.m - b.m : b.pk - a.pk);
  function upd() {
    const r = se(M[st.sel], st.f, st.mode), m = M[st.sel];
    ro.set('n', m.n); ro.set('se', EM.fixed(r.v, 0), 'dB'); ro.set('lim', r.lim); ro.set('m', EM.num(m.m, 2), 'kg/m²'); ro.set('pk', EM.num(r.v / m.m, 2), 'dB per kg/m²');
    info.innerHTML = '<h6>' + m.n + '</h6>' + m.note + (m.k === 'mesh' ? ' Opening cut-off: $f\\approx c/2g=$ ' + EM.freq(EM.C.c / (2 * (m.p - m.w))) + '.' : ''); if (window.renderMath) window.renderMath(info); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const rk = rank(), lw = Math.min(250, w * .46), top = 22, rh = (h - top - 26) / rk.length, x0 = lw, x1 = w - 52, X = v => x0 + Math.min(150, v) / 150 * (x1 - x0);
    A.rk = rk; A.lay = { top, rh };
    c.font = EM.font(10); c.textAlign = 'center'; c.textBaseline = 'top'; c.strokeStyle = EM.col('line'); [0, 30, 60, 90, 120, 150].forEach(v => { const x = Math.round(X(v)) + .5; c.beginPath(); c.moveTo(x, top - 4); c.lineTo(x, h - 24); c.stroke(); c.fillStyle = EM.col('muted'); c.fillText(v + ' dB', x, h - 20); });
    EM.label(c, 'shielding at ' + EM.freq(st.f) + (st.mode === 'plane' ? ' (radio wave)' : ' (magnetic near field, 30 cm source)'), (x0 + x1) / 2, 9, EM.col('text-2'), { size: 11, weight: '600', align: 'center' });
    rk.forEach((r, k) => { const m = M[r.i], y = top + k * rh, on = r.i === st.sel;
      if (on) { c.fillStyle = EM.alpha(EM.col('acc3'), .12); c.fillRect(0, y, w, rh); }
      EM.label(c, m.n, lw - 8, y + rh / 2, on ? EM.col('text') : EM.col('text-2'), { size: 10.5, align: 'right', weight: on ? '700' : '400' });
      c.fillStyle = EM.alpha(EM.col(m.c), on ? .95 : .72); c.fillRect(x0, y + rh * .2, Math.max(1, X(r.v) - x0), rh * .6);
      EM.label(c, EM.fixed(r.v, 0), X(r.v) + 5, y + rh / 2, EM.col('text-2'), { size: 10 }); });
  };
  A.pointer({ down: p => { const k = Math.floor((p.y - A.lay.top) / A.lay.rh); if (k >= 0 && k < M.length) { st.sel = A.rk[k].i; upd(); } } });
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 10, xmax: 1e11, xlog: true, ymin: 0, ymax: 150, yticks: [0, 30, 60, 90, 120, 150], xlabel: 'frequency', ylabel: 'SE (dB)', xfmt: v => EM.freq(v).replace(' ', '') });
    P.grid(); P.clip(); M.forEach((m, i) => { if (i !== st.sel) P.fn(f => Math.min(150, se(m, f, st.mode).v), EM.alpha(EM.col(m.c), .45), 1.4, 260); }); P.fn(f => Math.min(150, se(M[st.sel], f, st.mode).v), EM.col('acc3'), 3.4, 260); P.unclip(); P.vline(st.f, EM.col('acc2'), 1.2, [4, 4]);
    for (const [n, f] of [['50 Hz', 50], ['AM', 1e6], ['FM', 1e8], ['Wi-Fi', 2.45e9], ['5G', 2.8e10]]) EM.label(c, n, P.X(f), P.box.y + P.box.h - 8, EM.col('muted'), { size: 9, align: 'center' });
    EM.label(c, 'grey/colour = all materials, bold = selected', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  upd();
});
