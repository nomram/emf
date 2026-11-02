/* penetration-calc — plane wave through a slab of material: absorption (complex permittivity) + reflection (exact slab formula) */
EM.register('penetration-calc', function (el) {
  const W = EM.widget(el, { title: 'How much gets through? A slab calculator', badge: 'Calculate',
    note: 'Physics: each material has a permittivity $\\varepsilon_r$ and a conductivity $\\sigma$ (approximate values, loosely based on ITU-R P.2040 and standard tables). The wave decays as $e^{-\\alpha x}$ with $\\alpha=\\frac{\\omega}{c}\\,\\mathrm{Im}\\sqrt{\\varepsilon^*}$, and the exact two-surface slab formula includes reflection. Valid from 1 Hz to ≈ 1 THz for a flat slab at normal incidence; real buildings (rebar, windows, angle) differ by ±10 dB or more.' });
  const eps0 = EM.C.eps0, c0 = EM.C.c, cx = EM.cx;
  // sig(f): S/m ; eps: real part ; deb: [eps_s, eps_inf, tau] ; tand
  const G = f => f / 1e9;
  const MAT = {
    glass: { n: 'Window glass', col: 'acc', eps: 6.27, sig: f => 0.0043 * Math.pow(G(f), 1.1925) + 1e-9, th: .006 },
    plastic: { n: 'Plastic (polyethylene)', col: 'ok', eps: 2.3, tand: 3e-4, sig: f => 1e-12, th: .01 },
    abs: { n: 'Plastic (PVC / ABS, lossier)', col: 'warn', eps: 3, tand: .015, sig: f => 1e-10, th: .01 },
    drywall: { n: 'Drywall (plasterboard)', col: 'violet', eps: 2.94, sig: f => 0.0116 * Math.pow(G(f), .7076) + 1e-6, th: .0125 },
    wood: { n: 'Dry wood', col: 'fuel', eps: 1.99, sig: f => 0.0047 * Math.pow(G(f), 1.0718) + 1e-6, th: .04 },
    brick: { n: 'Brick wall', col: 'acc2', eps: 3.75, sig: f => f < 1e9 ? 0.01 + 0.028 * G(f) : 0.038, th: .2 },
    concrete: { n: 'Concrete (plain)', col: 'bad', eps: 5.31, sig: f => 0.0326 * Math.pow(G(f), .8095) + 0.005, th: .2 },
    drysoil: { n: 'Dry soil / sand', col: 'warn', eps: 4, tand: .02, sig: f => 1e-4, th: 1 },
    wetsoil: { n: 'Wet soil / clay', col: 'pink', eps: 20, deb: [24, 5, 9.4e-12], sig: f => 0.05, th: 1 },
    rock: { n: 'Dry rock (granite)', col: 'muted', eps: 6, tand: .01, sig: f => 1e-5, th: 10 },
    ice: { n: 'Glacier ice', col: 'text', eps: 3.17, tand: 5e-4, sig: f => 1e-5, th: 100 },
    fresh: { n: 'Fresh water', col: 'acc', eps: 80, deb: [80, 5, 9.4e-12], sig: f => 0.005, th: 1 },
    sea: { n: 'Seawater', col: 'acc', eps: 80, deb: [80, 5, 9.4e-12], sig: f => 4, th: 10 },
    body: { n: 'Human muscle / body', col: 'pink', eps: 55, deb: [55, 6, 7.2e-12], sig: f => 0.5, th: .05 },
    alu: { n: 'Aluminium (sheet)', col: 'muted', eps: 1, sig: f => 3.5e7, th: .001 },
    copper: { n: 'Copper', col: 'acc2', eps: 1, sig: f => 5.8e7, th: .001 },
  };
  const SCEN = [
    ['Wi-Fi 2.4 GHz through a brick wall', 'brick', 2.4e9, .2], ['Wi-Fi 5 GHz through a concrete wall', 'concrete', 5.5e9, .2], ['5G mmWave (28 GHz) through window glass', 'glass', 2.8e10, .006],
    ['Cell phone (1.8 GHz) into your head', 'body', 1.8e9, .05], ['Navy VLF (24 kHz) 20 m down in seawater (receiver inside)', 'sea', 2.4e4, 20, 1], ['ELF 76 Hz at 100 m depth (receiver inside)', 'sea', 76, 100, 1],
    ['FM radio (100 MHz) into a concrete room', 'concrete', 1e8, .3], ['GPS (1.5 GHz) reaching 1 m down in wet soil (receiver inside)', 'wetsoil', 1.575e9, 1, 1], ['Ground-radar 100 MHz, one way, 3 m in dry soil (receiver inside)', 'drysoil', 1e8, 3, 1],
    ['Ice-sounding radar (60 MHz), 1 km of glacier', 'ice', 6e7, 1000], ['Aluminium foil vs Wi-Fi', 'alu', 2.4e9, 2e-5], ['AM radio (1 MHz) through a thin metal sheet', 'alu', 1e6, 1e-3],
  ];
  const st = { m: 'concrete', f: 2.4e9, d: .2, tab: 'loss', cmp: false, embed: false };
  function epsC(m, f) {
    const w = 2 * Math.PI * f; let re = m.eps, im = 0;
    if (m.deb) { const [es, ei, tau] = m.deb, wt = w * tau; re = ei + (es - ei) / (1 + wt * wt); im += (es - ei) * wt / (1 + wt * wt); }
    if (m.tand) im += re * m.tand;
    im += m.sig(f) / (w * eps0);
    return [re, -im];
  }
  function calc(m, f, d) {
    const w = 2 * Math.PI * f, e = epsC(m, f), n = cx.sqrt(e), nre = n[0], nim = -n[1];   // n = n' - j n''
    const alpha = Math.max(0, w / c0 * nim);                                              // 1/m (field)
    const Gm = cx.div(cx.sub([1, 0], n), cx.add([1, 0], n)), G2 = cx.mul(Gm, Gm);
    const p = cx.exp([-w / c0 * nim * d, -w / c0 * nre * d]);
    const T = cx.div(cx.mul(cx.sub([1, 0], G2), p), cx.sub([1, 0], cx.mul(G2, cx.mul(p, p))));
    const tm = Math.max(cx.abs(T), 1e-30), refl = 1 - Math.pow(cx.abs(Gm), 2);
    const tH = cx.abs(cx.div(cx.sc(n, 2), cx.add(n, [1, 0])));                         // magnetic-field transmission into the material
    const emb = Math.max(0, -20 * Math.log10(Math.max(tH * Math.exp(-w / c0 * nim * d), 1e-30)));   // the small field boost at a dielectric surface is ignored
    return { alpha, dBm: 8.686 * alpha, depth: alpha > 0 ? 1 / alpha : Infinity, loss: st.embed ? emb : -20 * Math.log10(tm), reflLoss: -10 * Math.log10(Math.max(refl, 1e-30)), n: nre, eps: e[0] };
  }
  const S = EM.canvas(W.body, { aspect: .5, minH: 300 }), ctl = EM.h('div', { class: 'wgrid even', style: { marginTop: '12px' } }); W.body.append(ctl);
  const L = EM.h('div', { class: 'ctls' }), R = EM.h('div', { class: 'ctls' }); ctl.append(L, R);
  const tabs = EM.tabs(W.body, [['loss', 'Total loss through my slab (dB)'], ['rate', 'Absorption rate (dB per metre)']], 'loss', v => { st.tab = v; S.redraw(); }); W.body.insertBefore(tabs.el, S.cv);
  const sel = EM.select(L, { label: 'Material', options: Object.entries(MAT).map(([k, v]) => [k, v.n]), value: st.m, onChange: v => { st.m = v; st.d = MAT[v].th; ds.set(st.d, true); upd(); } });
  const fs = EM.slider(L, { label: 'Frequency', min: 1, max: 3e12, log: true, value: st.f, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const ds = EM.slider(L, { label: 'Thickness', min: 1e-5, max: 3e3, log: true, value: st.d, fmt: v => EM.len(v), onInput: v => { st.d = v; upd(); } });
  const emb = EM.toggle(L, { label: 'Receiver sits <b>inside</b> the material (field strength at depth, like a submarine) instead of a slab with air on both sides', checked: false, onChange: v => { st.embed = v; upd(); } });
  EM.toggle(L, { label: 'Overlay all other materials (faint)', checked: false, onChange: v => { st.cmp = v; S.redraw(); } });
  const sc = EM.select(R, { label: 'Real-world scenario', options: [['', 'choose a scenario…'], ...SCEN.map((s, i) => [i, s[0]])], value: '', onChange: v => { if (v === '') return; const s = SCEN[+v]; st.m = s[1]; st.f = s[2]; st.d = s[3]; st.embed = !!s[4]; emb.set(st.embed, true); sel.set(st.m, true); fs.set(st.f, true); ds.set(st.d, true); upd(); } });
  const ro = EM.readouts(R, [['loss', 'Loss', '', 'hot'], ['pow', 'Power left', '', 'good'], ['depth', 'Penetration depth 1/α', '', 'cool'], ['rate', 'Absorption', '', 'fuel'], ['refl', 'Surface reflection loss', '', ''], ['n', 'Refractive index n', '', '']]);
  const verdict = EM.h('div', { class: 'info-box' }); R.append(verdict);
  function upd() {
    const m = MAT[st.m], k = calc(m, st.f, st.d);
    const loss = k.loss;
    ro.set('loss', loss > 400 ? '> 400 dB' : EM.fixed(loss, 1), 'dB'); ro.set('pow', loss > 300 ? '≈ 0' : EM.num(Math.pow(10, -loss / 10) * 100, 3), loss > 300 ? '' : '%');
    ro.set('depth', EM.len(k.depth)); ro.set('rate', k.dBm < 1e4 ? EM.num(k.dBm, 3) : EM.num(k.dBm, 2), 'dB/m'); ro.set('refl', EM.fixed(k.reflLoss, 1), 'dB'); ro.set('n', EM.num(k.n, 3));
    const cat = loss < 3 ? ['good', 'Passes easily', 'less than half the power is lost'] : loss < 20 ? ['warn', 'Partly gets through', 'a noticeable signal survives, but the link margin shrinks'] : loss < 60 ? ['bad', 'Mostly blocked', 'only a strong transmitter and a good receiver could cope'] : ['bad', 'Blocked', 'effectively nothing survives'];
    verdict.innerHTML = '<h6>' + cat[1] + '</h6>' + cat[2] + '. ' + (k.reflLoss > loss * .6 && loss > 6 ? '<b>Most of the loss is reflection</b> from the surface (the wave simply bounces: typical of metals and, for radio, of seawater).' : loss > 6 ? '<b>Most of the loss is absorption inside</b> the material, turning wave energy into heat.' : '');
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const rate = st.tab === 'rate';
    const P = EM.plot(c, { x: 66, y: 14, w: w - 84, h: h - 56 }, { xmin: 1, xmax: 3e12, xlog: true, ymin: rate ? 1e-6 : .1, ymax: rate ? 1e9 : 1000, ylog: true, xlabel: 'frequency', ylabel: rate ? 'absorption (dB per metre)' : 'loss (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yfmt: v => EM.num(v, 1) });
    // band shading
    const bands = [['ELF–VLF', 3, 3e4], ['LF–HF', 3e4, 3e7], ['VHF–UHF', 3e7, 3e9], ['SHF', 3e9, 3e10], ['EHF', 3e10, 3e11], ['THz', 3e11, 3e12]];
    bands.forEach(([n, a, b], i) => { if (i % 2 === 0) { c.fillStyle = EM.alpha(EM.col('text'), .045); c.fillRect(P.X(a), P.box.y, P.X(b) - P.X(a), P.box.h); } EM.label(c, n, (P.X(a) + P.X(b)) / 2, P.box.y + 10, EM.col('muted'), { size: 10, align: 'center', weight: '600' }); });
    P.grid(); const val = (m, f) => { const k = calc(m, f, st.d); return rate ? k.dBm : k.loss; };
    P.clip();
    if (st.cmp) for (const [id, m] of Object.entries(MAT)) if (id !== st.m) P.fn(f => val(m, f), EM.alpha(EM.col(m.col), .35), 1.2, 140);
    P.fn(f => val(MAT[st.m], f), EM.col('acc3'), 3.2, 220);
    P.unclip();
    const m = MAT[st.m]; P.vline(st.f, EM.alpha(EM.col('text'), .5), 1.2, [4, 4]); P.dot(st.f, Math.max(val(m, st.f), 1e-9), EM.col('acc2'), 6);
    EM.label(c, MAT[st.m].n + (rate ? '' : ', ' + EM.len(st.d) + ' thick'), P.box.x + 10, P.box.y + 28, EM.col('acc3'), { size: 12, weight: '700' });
    if (!rate) { P.hline(3, EM.alpha(EM.col('ok'), .7), 1, [3, 4]); P.hline(20, EM.alpha(EM.col('warn'), .7), 1, [3, 4]); EM.label(c, '3 dB: half the power gone', P.box.x + P.box.w - 6, P.Y(3) - 7, EM.col('ok'), { size: 10, align: 'right', weight: '500' }); EM.label(c, '20 dB: 1 % left', P.box.x + P.box.w - 6, P.Y(20) - 7, EM.col('warn'), { size: 10, align: 'right', weight: '500' }); }
  };
  upd();
});
