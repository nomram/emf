/* transparent-shield — see-through conductors (ITO, silver nanowires, graphene, metal mesh, low-E coatings): optical transmittance vs RF shielding */
EM.register('transparent-shield', function (el) {
  const W = EM.widget(el, { title: 'Shielding you can see through: transparent conductors', badge: 'Compare',
    note: 'A thin conducting film (thinner than a skin depth) blocks a plane wave by an amount that depends <b>only on its sheet resistance</b> $R_s$: $SE=20\\log_{10}\\!\\big(1+\\eta_0/2R_s\\big)$ with $\\eta_0=377\\ \\Omega$, nearly independent of frequency. The difficulty is optical: a thicker film conducts better and absorbs more light. <b>Metal meshes</b> break the trade-off: wires thin enough to be nearly invisible, with $R_s\\approx\\rho\\,p/(w\\,t)$, but their openings leak above $f\\approx c/2p$. Typical values from the literature; real products vary widely.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .55 }), B = EM.canvas(main, { aspect: .5 }); B.cv.style.marginTop = '10px';
  const MAT = [
    ['Plain glass', Infinity, 92, 'Passes everything: no shielding at all.', 'film'],
    ['Graphene, 1 layer', 300, 97.7, 'Absorbs only 2.3 % of light per layer; high sheet resistance, so mediocre shielding unless stacked and doped.', 'film'],
    ['Graphene, 4 layers (doped)', 40, 91, 'Stacked and chemically doped: a flexible, corrosion-free transparent shield (research and niche products).', 'film'],
    ['PEDOT:PSS (conductive polymer)', 200, 85, 'Printable, flexible, cheap, but modest conductivity: antistatic coatings and touch sensors.', 'film'],
    ['Carbon-nanotube film', 120, 88, 'Flexible; used for antistatic and touch layers.', 'film'],
    ['ITO, thin (100 nm)', 100, 90, 'Indium tin oxide: the standard touch-screen/display conductor. Good for antistatic and 15–25 dB shielding.', 'film'],
    ['ITO, thick (300 nm)', 15, 82, 'Thicker ITO: ≈ 35–45 dB, with visible tint. Used for EMI windows on instruments and displays.', 'film'],
    ['FTO (fluorine-doped tin oxide)', 10, 80, 'Rugged, cheap; used in solar cells and as low-E coatings on architectural glass.', 'film'],
    ['Silver nanowire network', 30, 90, 'Random web of 20–40 nm wires: flexible, low haze at the right density. Competes with ITO for flexible screens.', 'film'],
    ['ITO / Ag / ITO sandwich', 5, 85, 'A thin silver layer between two ITO layers: high conductivity, transparent: ≈ 45–50 dB (e.g. EMI windows, aircraft canopies).', 'film'],
    ['Silver film, 10 nm', 8, 65, 'A thin continuous silver film: good SE, dark and mirror-like.', 'film'],
    ['Low-E window coating (Ag-based)', 4, 78, 'Reflects heat and also radio: modern energy-saving windows cost 20–40 dB at Wi-Fi and cell-phone frequencies.', 'film'],
    ['Copper micro-mesh (p 300 µm, w 10 µm, t 2 µm)', 0, 0, 'Fine metal grid: very low Rs, high transmittance; typical for shielded-window laminates for MRI rooms and displays; slight moiré.', 'mesh', 300e-6, 10e-6, 2e-6, 1.7e-8],
    ['Wire-cloth shield glass (p 1 mm, w 0.1 mm, t 0.1 mm)', 0, 0, 'Woven fine wires laminated in glass: the classic shielded-room window: 60–80 dB to 1 GHz, slightly hazy.', 'mesh', 1e-3, 1e-4, 1e-4, 1.7e-8],
    ['Oven-door perforated steel (p 3 mm, w 1 mm, t 0.5 mm)', 0, 0, 'Not clear glass but a hole pattern: transmits ≈ 44 % of light; the holes are far below the 2.45 GHz cutoff.', 'mesh', 3e-3, 1e-3, 5e-4, 1e-7],
  ];
  const st = { i: 5, f: 2.45e9 };
  const sel = EM.select(side, { label: 'Material', options: MAT.map((m, i) => [i, m[0]]), value: 5, onChange: v => { st.i = +v; upd(); } });
  EM.slider(side, { label: 'Frequency', min: 1e6, max: 3e11, log: true, value: 2.45e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const ro = EM.readouts(side, [['rs', 'Sheet resistance', '', 'cool'], ['T', 'Visible transmittance', '', 'fuel'], ['se', 'Shielding at this frequency', '', 'hot'], ['lim', 'What limits it', '', ''], ['left', 'Field left', '', 'bad']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function props(i) { const m = MAT[i]; if (m[4] === 'mesh') { const [p, w, t, rho] = [m[5], m[6], m[7], m[8]]; return { rs: rho * p / (w * t), T: Math.pow(1 - w / p, 2) * 100, mesh: { p, w } }; } return { rs: m[1], T: m[2] }; }
  function SE(i, f) { const pr = props(i), film = isFinite(pr.rs) ? 20 * Math.log10(1 + 188.5 / pr.rs) : 0; if (!pr.mesh) return { se: film, lim: 'sheet resistance' }; const lam = EM.C.c / f, g = pr.mesh.p - pr.mesh.w, ap = Math.max(0, 20 * Math.log10(lam / (2 * g))); return ap < film ? { se: ap, lim: 'mesh openings' } : { se: film, lim: 'sheet resistance' }; }
  function upd() {
    const m = MAT[st.i], pr = props(st.i), r = SE(st.i, st.f);
    ro.set('rs', isFinite(pr.rs) ? EM.num(pr.rs, 3) + ' Ω/sq' : '∞'); ro.set('T', pr.T.toFixed(0) + ' %'); ro.set('se', EM.fixed(r.se, 0), 'dB'); ro.set('lim', r.se < 1 ? '—' : r.lim); ro.set('left', r.se < .5 ? '100 %' : EM.num(Math.pow(10, -r.se / 20) * 100, 2) + ' % of the field');
    info.innerHTML = '<h6>' + m[0] + '</h6>' + m[3] + (m[4] === 'mesh' ? ' <b>Mesh test:</b> openings of ' + EM.len(pr.mesh.p - pr.mesh.w) + ' stop leaking-free shielding below $f\\approx c/2g=$ ' + EM.freq(EM.C.c / (2 * (pr.mesh.p - pr.mesh.w))) + '.' : '') + ' Note the <b>trade-off</b>: the better the film conducts, the less light it passes; meshes escape the trade by using wires too thin to see, but pay for it at high frequency.'; if (window.renderMath) window.renderMath(info); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 40, xmax: 100, ymin: 0, ymax: 80, xlabel: 'visible-light transmittance (%)', ylabel: 'shielding (dB)', xticks: [40, 50, 60, 70, 80, 90, 100], yticks: [0, 20, 40, 60, 80] });
    P.grid(); P.clip(); for (const rs of [1, 5, 20, 100]) { c.strokeStyle = EM.alpha(EM.col('muted'), .5); c.setLineDash([3, 4]); c.beginPath(); c.moveTo(P.X(40), P.Y(20 * Math.log10(1 + 188.5 / rs))); c.lineTo(P.X(100), P.Y(20 * Math.log10(1 + 188.5 / rs))); c.stroke(); c.setLineDash([]); EM.label(c, 'Rs = ' + rs + ' Ω/sq', P.X(41), P.Y(20 * Math.log10(1 + 188.5 / rs)) - 7, EM.col('muted'), { size: 9 }); }
    P.unclip(); MAT.forEach((m, i) => { const pr = props(i); if (!isFinite(pr.rs)) return; const se = SE(i, st.f).se, x = P.X(Math.max(40, pr.T)), y = P.Y(Math.min(80, se)), on = i === st.i; c.fillStyle = on ? EM.col('acc3') : (m[4] === 'mesh' ? EM.col('ok') : EM.col('acc')); c.strokeStyle = EM.col('bg'); c.lineWidth = 2; c.beginPath(); c.arc(x, y, on ? 8 : 5, 0, 7); c.fill(); c.stroke(); if (on) EM.label(c, m[0].split(' (')[0], x - 10, y - 13, EM.col('acc3'), { size: 11, align: 'right', weight: '700' }); });
    EM.label(c, 'blue = films, green = meshes; the dashed lines are fixed sheet resistance (the “ideal” film trade-off)', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 1e6, xmax: 3e11, xlog: true, ymin: 0, ymax: 100, xlabel: 'frequency', ylabel: 'SE (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yticks: [0, 20, 40, 60, 80, 100] });
    P.grid(); P.clip(); P.fn(f => Math.min(100, SE(st.i, f).se), EM.col('acc3'), 3, 300); P.unclip(); P.vline(st.f, EM.col('acc2'), 1.4); P.dot(st.f, Math.min(100, SE(st.i, st.f).se), EM.col('acc2'), 6);
    for (const [n, f] of [['FM', 1e8], ['Wi-Fi', 2.4e9], ['5G', 2.8e10]]) EM.label(c, n, P.X(f), P.box.y + P.box.h - 8, EM.col('muted'), { size: 9, align: 'center' });
    EM.label(c, 'shielding effectiveness of the selected material', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  upd();
});
