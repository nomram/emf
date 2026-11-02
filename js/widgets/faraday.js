/* faraday — a magnet moving through a coil: flux, EMF = -N dPhi/dt, Lenz's law */
EM.register('faraday', function (el) {
  const W = EM.widget(el, { title: 'Faraday & Lenz: move a magnet, get a voltage', badge: 'Try it',
    note: 'The voltage depends on how <b>fast the flux changes</b>, not on how much flux there is. Hold the magnet still inside the coil and the voltage is zero. Drag it in and out and watch the sign flip: the induced current always <b>opposes the change</b> (Lenz).' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .34 });
  const G = EM.canvas(main, { aspect: .36 }); G.cv.style.marginTop = '10px';
  const st = { N: 100, mode: 'auto', x: -1.2, f: .8, amp: 1.2, hist: [], phiPrev: 0, emf: 0, t: 0, sm: 0, dragging: false };
  const a = .35;                                     // coil radius in view units; magnet dipole model
  const phi = (x) => Math.pow(a * a / (a * a + x * x * .5), 1.5);   // normalised flux through the coil from a magnet at distance x
  const PHI0 = 6e-5;                                  // 60 µWb per turn when the magnet is at the coil centre (demo number)
  EM.seg(side, [['auto', 'Automatic'], ['drag', 'Drag it yourself']], 'auto', v => { st.mode = v; });
  EM.slider(side, { label: 'Turns N', min: 1, max: 1000, log: true, value: 100, fmt: v => Math.round(v) + '', onInput: v => { st.N = v; } });
  EM.slider(side, { label: 'Speed (automatic mode)', min: .1, max: 3, step: .05, value: .8, unit: 'Hz', onInput: v => { st.f = v; } });
  const ro = EM.readouts(side, [['emf', 'EMF now', '', 'hot'], ['peak', 'Peak EMF so far', '', 'fuel'], ['dir', 'Induced current', '', '']]);
  side.append(EM.h('div', { class: 'info-box', html: '<h6>Faraday’s law</h6>$\\mathcal{E}=-N\\,\\dfrac{d\\Phi}{dt}$, with $\\Phi=\\int\\vec B\\cdot d\\vec A$ in webers. The minus sign is Lenz: the current makes a field that resists the change.' }));
  let peak = 1e-9;
  A.draw = (c, w, h) => {
    const cx = w / 2, cy = h / 2, sc = w / 3.4, X = x => cx + x * sc;
    // coil
    const turns = 8; c.lineWidth = 2;
    for (let i = 0; i < turns; i++) { const x = X(-.18 + i * .36 / (turns - 1)); c.strokeStyle = EM.alpha(EM.col('acc2'), .9); c.beginPath(); c.ellipse(x, cy, 7, a * sc * .62, 0, 0, 2 * Math.PI); c.stroke(); }
    // magnet
    const mx = X(st.x), mw = sc * .52, mh = sc * .2;
    c.fillStyle = EM.col('bad'); c.fillRect(mx - mw / 2, cy - mh / 2, mw / 2, mh);
    c.fillStyle = EM.col('acc'); c.fillRect(mx, cy - mh / 2, mw / 2, mh);
    c.fillStyle = '#fff'; c.font = EM.font(14, '800'); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', mx - mw / 4, cy); c.fillText('S', mx + mw / 4, cy);
    // lens arrows showing induced current
    const I = -st.emf; const mag = Math.min(1, Math.abs(st.emf) / (peak * .6 + 1e-12));
    if (mag > .05) { c.strokeStyle = EM.alpha(EM.col('acc3'), mag); c.lineWidth = 3; c.beginPath(); c.ellipse(X(0), cy, 12, a * sc * .62 + 8, 0, 0, 2 * Math.PI); c.stroke(); const dir = I > 0 ? 1 : -1; EM.arrow(c, X(0) - 1, cy - a * sc * .62 - 8, X(0) + dir * 9, cy - a * sc * .62 - 8, EM.col('acc3'), 3, 11); }
    // lamp / meter
    const lx = w - 44, ly = 36; c.fillStyle = EM.alpha(EM.col('acc3'), Math.min(1, Math.abs(st.emf) / (peak * .8 + 1e-12)) * .9 + .05); c.beginPath(); c.arc(lx, ly, 18, 0, 7); c.fill(); c.strokeStyle = EM.col('line-2'); c.lineWidth = 2; c.stroke();
    EM.label(c, 'lamp', lx, ly + 32, EM.col('muted'), { size: 10, align: 'center' });
    c.strokeStyle = EM.col('muted'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(.2), cy + a * sc * .62); c.lineTo(X(.2), h - 10); c.lineTo(lx, h - 10); c.lineTo(lx, ly + 18); c.stroke();
    EM.label(c, st.mode === 'drag' ? '← drag the magnet →' : 'magnet swings through the coil', 12, 18, EM.col('text-2'), { size: 12 });
  };
  A.pointer({ down: (p) => { if (st.mode === 'drag') { st.dragging = true; mv(p); } }, move: (p, e, d) => { if (d && st.mode === 'drag') mv(p); }, up: () => { st.dragging = false; } });
  function mv(p) { st.x = EM.clamp((p.x - A.W / 2) / (A.W / 3.4), -1.5, 1.5); }
  G.draw = (c, w, h) => {
    const T = 4, P = EM.plot(c, { x: 56, y: 10, w: w - 70, h: h - 44 }, { xmin: -T, xmax: 0, ymin: -1.15, ymax: 1.15, xlabel: 'time (s, now = 0)', ylabel: 'normalised', yticks: [-1, 0, 1] });
    P.grid(); P.hline(0, EM.col('line-2'));
    const hs = st.hist; if (hs.length > 1) {
      const t0 = hs[hs.length - 1][0];
      P.line(hs.map(p => p[0] - t0), hs.map(p => p[1]), EM.col('acc'), 2.4);
      P.line(hs.map(p => p[0] - t0), hs.map(p => p[2] / (peak * 1.05)), EM.col('acc2'), 2.4);
    }
    EM.label(c, 'flux Φ', P.box.x + 10, P.box.y + 12, EM.col('acc'), { size: 12 }); EM.label(c, 'EMF = −N dΦ/dt', P.box.x + 70, P.box.y + 12, EM.col('acc2'), { size: 12 });
  };
  EM.loop(el, (t, dt) => {
    st.t += dt;
    if (st.mode === 'auto') st.x = st.amp * Math.sin(2 * Math.PI * st.f * st.t * .5) * 1.1;
    const ph = phi(st.x), d = (ph - st.phiPrev) / Math.max(dt, 1e-3); st.phiPrev = ph;
    const raw = -st.N * PHI0 * d;                  // EMF = -N dPhi/dt
    const flux = ph;
    st.sm += (raw - st.sm) * Math.min(1, dt * 18); st.emf = st.sm; peak = Math.max(peak * .9995, Math.abs(st.emf), 1e-9);
    st.hist.push([st.t, flux, st.emf]); while (st.hist.length && st.t - st.hist[0][0] > 4) st.hist.shift();
    ro.set('emf', EM.si(st.emf, 'V')); ro.set('peak', EM.si(peak, 'V')); ro.set('dir', Math.abs(st.emf) < peak * .05 ? 'none' : (st.emf > 0 ? 'one way' : 'the other way'));
    A.redraw(); G.redraw();
  });
  A.redraw();
});
