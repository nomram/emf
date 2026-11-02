/* magnetron — electrons in crossed E (radial) and B (axial): Hull cutoff, why the cavity is a source of 2.45 GHz */
EM.register('magnetron', function (el) {
  const W = EM.widget(el, { title: 'Inside the magnetron: electrons in crossed fields', badge: 'Try it',
    note: 'A hot cathode at the centre emits electrons; a ring-shaped anode with resonant cavities surrounds it at several kV; a permanent magnet makes $\\vec B$ point along the axis. Below the <b>Hull cutoff</b> $B_c$ electrons spiral across to the anode (current flows). Above it, the magnetic force bends them back before they arrive: they orbit as a rotating cloud that sweeps past the cavities and drives them at $\\approx$ 2.45 GHz. Here: exact motion of electrons (Boris pusher) with the real dimensions; the RF cavity fields are not simulated.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: 1, maxH: 520 });
  const a = 2e-3, b = 5e-3, q = -EM.C.e, m = EM.C.me, st = { V: 4000, B: .11, p: [], hits: 0, back: 0, win: [] };
  EM.slider(side, { label: 'Anode voltage', min: 500, max: 8000, step: 50, value: 4000, fmt: v => EM.num(v / 1000, 3) + ' kV', onInput: v => { st.V = v; st.p = []; upd(); } });
  EM.slider(side, { label: 'Magnetic field B', min: .01, max: .2, step: .002, value: .11, fmt: v => v.toFixed(3) + ' T', onInput: v => { st.B = v; st.p = []; upd(); } });
  const ro = EM.readouts(side, [['bc', 'Hull cutoff field B_c at this voltage', '', 'hot'], ['vc', 'Hull threshold voltage at this B', '', 'fuel'], ['fc', 'Electron cyclotron frequency', '', 'cool'], ['reg', 'Regime', '', 'good'], ['cur', 'Electrons reaching the anode', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const Bc = V => Math.sqrt(8 * m * V / EM.C.e) / (b * (1 - a * a / (b * b))), Vc = B => EM.C.e * B * B * b * b * Math.pow(1 - a * a / (b * b), 2) / (8 * m);
  function upd() {
    const bc = Bc(st.V), fc = EM.C.e * st.B / (2 * Math.PI * m); ro.set('bc', EM.num(bc, 3), 'T'); ro.set('vc', EM.num(Vc(st.B) / 1000, 3), 'kV'); ro.set('fc', EM.freq(fc));
    const above = st.B > bc; ro.set('reg', above ? 'cut-off: electrons orbit' : 'electrons cross to the anode');
    info.innerHTML = '<h6>' + (above ? 'Above cutoff' : 'Below cutoff') + '</h6>' + (above ? 'The magnetic force bends each electron back toward the cathode before it reaches the anode: the current drops to almost zero and a <b>rotating space-charge “spoke” pattern</b> forms, travelling past the cavity slots at the speed that matches their RF wave. The electrons hand energy to the cavity fields (rather like a child pushing a swing in time with it), and the cavity frequency, set by the vane geometry, locks the whole thing.' : 'Electrons are bent into curving paths but still reach the anode (a simple diode with a magnetic-field-controlled current). No oscillation yet.') + ' Real magnetrons run near $B\\approx1.1$–1.3 $B_c$: for 4 kV and these dimensions $B_c\\approx0.1$ T, with a ferrite or samarium-cobalt magnet. The electron’s cyclotron frequency at 0.1 T is 2.8 GHz: close to 2.45 GHz, which is why magnetron design and the microwave-oven frequency fit together.';
    if (window.renderMath) window.renderMath(info);
  }
  function step(dt) {
    const E0 = st.V / Math.log(b / a);
    for (const p of st.p) {
      const r = Math.hypot(p.x, p.y), Er = -E0 / r, ax = q / m * Er * p.x / r, ay = q / m * Er * p.y / r;      // field points inward (anode +); force on electron outward
      let vx = p.vx + ax * dt / 2, vy = p.vy + ay * dt / 2; const tt = q / m * st.B * dt / 2, sn = 2 * tt / (1 + tt * tt);
      const px = vx + vy * tt, py = vy - vx * tt; const qx = vx + py * sn, qy = vy - px * sn; p.vx = qx + ax * dt / 2; p.vy = qy + ay * dt / 2; p.x += p.vx * dt; p.y += p.vy * dt;
      const r2 = Math.hypot(p.x, p.y); if (r2 >= b) { p.dead = 1; st.hits++; } else if (r2 <= a * .999) { p.dead = 1; st.back++; }
      p.tr.push([p.x, p.y]); if (p.tr.length > 60) p.tr.shift();
    }
    st.p = st.p.filter(p => !p.dead);
  }
  S.draw = (c, w, h) => {
    const R = Math.min(w, h) / 2 - 14, cx = w / 2, cy = h / 2, sc = R / (b * 1.18);
    c.fillStyle = EM.col('bg-2'); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    // anode with 10 vanes/cavities
    c.fillStyle = EM.alpha(EM.col('muted'), .75); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.arc(cx, cy, b * sc, 0, 7, true); c.fill();
    for (let i = 0; i < 10; i++) { const t = i * Math.PI / 5 + Math.PI / 10; c.save(); c.translate(cx, cy); c.rotate(t); c.fillStyle = EM.col('bg-2'); c.fillRect(b * sc, -R * .09, R - b * sc - 6, R * .18); c.restore(); }
    c.strokeStyle = EM.col('acc3'); c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, b * sc, 0, 7); c.stroke(); c.fillStyle = EM.col('acc2'); c.beginPath(); c.arc(cx, cy, a * sc, 0, 7); c.fill();
    for (const p of st.p) { c.strokeStyle = EM.alpha(EM.col('acc'), .4); c.lineWidth = 1; c.beginPath(); p.tr.forEach((t, i) => i ? c.lineTo(cx + t[0] * sc, cy - t[1] * sc) : c.moveTo(cx + t[0] * sc, cy - t[1] * sc)); c.stroke(); c.fillStyle = EM.col('acc'); c.beginPath(); c.arc(cx + p.x * sc, cy - p.y * sc, 2.6, 0, 7); c.fill(); }
    EM.label(c, 'anode ring with 10 resonant cavities', cx, 14, EM.col('text-2'), { size: 11, align: 'center', weight: '600' }); EM.label(c, 'cathode', cx, cy + a * sc + 14, EM.col('acc2'), { size: 10, align: 'center' }); EM.label(c, 'B ⊙ out of the screen', 10, h - 10, EM.col('muted'), { size: 10, weight: '500' });
  };
  EM.loop(el, (t, dt) => {
    for (let i = 0; i < 2; i++) if (st.p.length < 140) { const th = Math.random() * 6.283; st.p.push({ x: a * 1.01 * Math.cos(th), y: a * 1.01 * Math.sin(th), vx: 1e5 * Math.cos(th), vy: 1e5 * Math.sin(th), tr: [] }); }
    const sub = 160; for (let k = 0; k < sub; k++) step(4e-12);
    st.win.push(st.hits); st.hits = 0; if (st.win.length > 30) st.win.shift(); const avg = st.win.reduce((s, v) => s + v, 0) / st.win.length; ro.set('cur', avg < 1 ? 'almost none' : Math.round(avg * 60) + ' per second (arb.)');
    S.redraw();
  });
  upd();
});
