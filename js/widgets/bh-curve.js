/* bh-curve — hysteresis loops: how a material answers an applied H with a flux density B */
EM.register('bh-curve', function (el) {
  const W = EM.widget(el, { title: 'B–H curves: what a material does to a field', badge: 'Try it',
    note: '$\\vec H$ is what <em>you</em> apply (amp-turns per metre); $\\vec B$ is what you get. In vacuum $B=\\mu_0H$. A magnetic material multiplies it: $B=\\mu_0\\mu_r H$ until it <b>saturates</b>, and it remembers where it has been (<b>hysteresis</b>). The loop’s area is energy lost as heat on every cycle.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .8 });
  const MAT = {
    air:   { n: 'Air / vacuum', Hc: 100, Bs: 0, w: 100, use: 'Reference: B = μ₀H, no memory.' },
    ferrite: { n: 'Ferrite (MnZn)', Hc: 15, Bs: .45, w: 25, use: 'High-frequency transformers, antenna rods: low loss at RF.' },
    sist:  { n: 'Silicon steel', Hc: 30, Bs: 2.0, w: 45, use: 'Mains transformers and motors: narrow loop, small loss.' },
    iron:  { n: 'Soft iron', Hc: 80, Bs: 2.1, w: 150, use: 'Electromagnets, relays: strong but loses energy faster.' },
    steel: { n: 'Hard steel', Hc: 4000, Bs: 1.5, w: 4000, use: 'Old permanent magnets: keeps its magnetisation.' },
    alnico: { n: 'Alnico', Hc: 5e4, Bs: 1.2, w: 4e4, use: 'Guitar pickups, sensors.' },
    ndfeb: { n: 'Neodymium (NdFeB)', Hc: 9e5, Bs: 1.4, w: 6e5, use: 'The strongest common permanent magnets: motors, speakers, microwave magnetrons use ferrite or SmCo/NdFeB.' },
  };
  const st = { m: 'iron', amp: 4, M: 0, H: 0, ph: 0, B0: 0, acc: 0, loss: 0, Br: 0, last: 0, trail: [] };
  const sel = EM.select(side, { label: 'Material', options: Object.entries(MAT).map(([k, v]) => [k, v.n]), value: 'iron', onChange: v => { st.m = v; reset(); upd(); } });
  EM.slider(side, { label: 'Drive amplitude (× coercivity)', min: .2, max: 8, log: true, value: 4, fmt: v => v.toFixed(1) + ' × Hc', onInput: v => { st.amp = v; reset(); } });
  const ro = EM.readouts(side, [['Hc', 'Coercivity Hc', '', 'hot'], ['Br', 'Remanence Br', '', 'cool'], ['Bs', 'Saturation', '', 'cool'], ['mu', 'μr here', '', 'fuel'], ['loss', 'Loss per cycle', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function reset() { st.M = 0; st.H = 0; st.ph = 0; st.trail = []; st.acc = 0; }
  function upd() { const m = MAT[st.m]; info.innerHTML = '<h6>' + m.n + '</h6>' + m.use; ro.set('Hc', m.Bs ? EM.si(m.Hc, 'A/m') : '—'); ro.set('Bs', m.Bs ? m.Bs + ' T' : '—'); }
  function step(dt) {
    const m = MAT[st.m], Hmax = st.amp * m.Hc, f = .14;
    const ph = st.ph + dt * f, Hn = Hmax * Math.sin(2 * Math.PI * ph), dH = Hn - st.H;
    if (m.Bs) { const tgt = m.Bs * Math.tanh((Hn + (dH >= 0 ? -m.Hc : m.Hc)) / m.w); st.M += (tgt - st.M) * (1 - Math.exp(-Math.abs(dH) / (m.w * .8))); }
    const Bo = EM.C.mu0 * st.H + st.M, Bn = EM.C.mu0 * Hn + st.M; st.acc += (st.H + Hn) / 2 * (Bn - Bo);
    if (st.H > 0 && Hn <= 0) st.Br = Bn;
    if (Math.floor(ph) > Math.floor(st.ph)) { st.loss = st.acc; st.acc = 0; }
    st.ph = ph; st.H = Hn; st.trail.push([Hn, Bn]); if (st.trail.length > 700) st.trail.shift();
  }
  S.draw = (c, w, h) => {
    const m = MAT[st.m], Hx = 8 * m.Hc, By = Math.max(.6, m.Bs * 1.2 || 0.6);
    const P = EM.plot(c, { x: 66, y: 12, w: w - 84, h: h - 54 }, { xmin: -Hx, xmax: Hx, ymin: -By, ymax: By, xlabel: 'H applied (A/m)', ylabel: 'B (tesla)', xfmt: v => EM.si(v, '', 2), yfmt: v => EM.num(v, 2) });
    P.grid(); P.hline(0, EM.col('line-2')); P.vline(0, EM.col('line-2'));
    // reference line B = mu0 H (tiny) and the +/- Hc markers
    P.clip(); P.fn(x => EM.C.mu0 * x, EM.alpha(EM.col('muted'), .8), 1.2, 60, [4, 4]); P.unclip();
    if (m.Bs) { P.vline(m.Hc, EM.alpha(EM.col('acc2'), .4), 1, [3, 4]); P.vline(-m.Hc, EM.alpha(EM.col('acc2'), .4), 1, [3, 4]); }
    c.save(); c.beginPath(); c.rect(P.box.x, P.box.y, P.box.w, P.box.h); c.clip();
    const tr = st.trail; c.lineWidth = 2.4; c.strokeStyle = EM.col('acc'); c.beginPath();
    tr.forEach((p, i) => { const x = P.X(p[0]), y = P.Y(p[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore();
    if (tr.length) { const p = tr[tr.length - 1]; P.dot(p[0], p[1], EM.col('acc3'), 6); const mu = Math.abs(p[0]) > 1e-9 ? p[1] / (EM.C.mu0 * p[0]) : 0; ro.set('mu', Math.abs(p[0]) > m.Hc * .05 ? EM.num(Math.abs(mu), 3) : '—'); }
    ro.set('Br', m.Bs ? EM.num(Math.abs(st.Br), 2) + ' T' : '—'); ro.set('loss', m.Bs ? EM.si(Math.abs(st.loss), 'J/m³') : '0');
    P.text('B = μ₀H (vacuum)', P.box.x + P.box.w - 6, P.Y(EM.C.mu0 * Hx) + 12, EM.col('muted'), 'right', EM.font(11));
  };
  reset(); upd();
  EM.loop(el, (t, dt) => { for (let i = 0; i < 4; i++) step(dt / 4); S.redraw(); });
  S.redraw();
});
