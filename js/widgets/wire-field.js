/* wire-field — magnetic field of a long straight wire: right-hand rule, compass needles, B = mu0 I / (2 pi r) */
EM.register('wire-field', function (el) {
  const W = EM.widget(el, { title: 'The field around a straight wire', badge: 'Try it',
    note: 'Drag the yellow probe. The wire is seen end-on: <b>⊙</b> = current coming toward you, <b>⊗</b> = going away. Fingers of your right hand curl the way the field circulates when your thumb points along the current.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .62 });
  const B = EM.canvas(main, { aspect: .42 }); B.cv.style.marginTop = '12px';
  const mu0 = EM.C.mu0, R_VIEW = 0.5;                       // canvas half-height shows 0.5 m
  const st = { I: 10, r: 0.12, ang: -0.6 };
  const I = EM.slider(side, { label: 'Current I (negative = away from you)', min: -50, max: 50, step: 0.5, value: 10, unit: 'A', onInput: v => { st.I = v; A.redraw(); B.redraw(); upd(); } });
  const ro = EM.readouts(side, [['B', 'B at probe', '', 'cool'], ['r', 'Distance r', '', ''], ['x', 'Versus Earth’s field', '', 'fuel'], ['dir', 'Field circulates', '', '']]);
  side.append(EM.h('div', { class: 'info-box', html: '<h6>Ampère’s law (the shortcut)</h6>Add up B around a circle of radius r: the loop is $2\\pi r$ long and encloses current $I$, so $B\\,2\\pi r=\\mu_0 I$.' }));
  function Bat(r) { return mu0 * Math.abs(st.I) / (2 * Math.PI * r); }
  function upd() {
    const b = Bat(st.r);
    ro.set('B', EM.si(b, 'T')); ro.set('r', EM.len(st.r)); ro.set('x', EM.num(b / 50e-6) + ' ×');
    ro.set('dir', st.I === 0 ? '—' : st.I > 0 ? 'counter-clockwise' : 'clockwise');
  }
  A.draw = (c, w, h) => {
    const cx = w / 2, cy = h / 2, sc = (h / 2 - 6) / R_VIEW, sgn = Math.sign(st.I);
    // field rings
    for (const rm of [0.03, 0.07, 0.12, 0.2, 0.3, 0.44]) {
      const r = rm * sc, str = Math.min(1, Bat(rm) / 150e-6 + .12);
      c.strokeStyle = EM.alpha(EM.col('acc'), sgn ? .25 + .5 * str : .12); c.lineWidth = 1.6;
      c.beginPath(); c.arc(cx, cy, r, 0, 2 * Math.PI); c.stroke();
      if (sgn) for (const a of [0.7, 3.84]) {                       // arrowheads along circulation
        const th = a, dir = sgn > 0 ? -1 : 1;                       // screen y flipped => ccw on screen is negative angle
        const px = cx + r * Math.cos(th), py = cy + r * Math.sin(th);
        const tx = -Math.sin(th) * dir, ty = Math.cos(th) * dir;
        EM.arrow(c, px - tx * 6, py - ty * 6, px + tx * 6, py + ty * 6, EM.col('acc'), 1.5, 8);
      }
    }
    // compass needles (red tip points along the field)
    for (const rm of [0.1, 0.2, 0.32]) for (let k = 0; k < 8; k++) {
      const th = k * Math.PI / 4 + (rm > .15 ? Math.PI / 8 : 0), px = cx + rm * sc * Math.cos(th), py = cy + rm * sc * Math.sin(th);
      const tx = sgn >= 0 ? Math.sin(th) : -Math.sin(th), ty = sgn >= 0 ? -Math.cos(th) : Math.cos(th);
      const ra = sgn ? Math.atan2(ty, tx) : -Math.PI / 2;
      c.save(); c.translate(px, py); c.rotate(ra);
      c.fillStyle = sgn ? EM.col('bad') : EM.col('muted'); c.beginPath(); c.moveTo(11, 0); c.lineTo(-1, 3.5); c.lineTo(-1, -3.5); c.closePath(); c.fill();
      c.fillStyle = EM.col('text-2'); c.beginPath(); c.moveTo(-11, 0); c.lineTo(-1, 3.5); c.lineTo(-1, -3.5); c.closePath(); c.fill();
      c.restore();
    }
    // wire
    c.fillStyle = EM.col('panel-3'); c.strokeStyle = EM.col('acc2'); c.lineWidth = 2.5;
    c.beginPath(); c.arc(cx, cy, 13, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.strokeStyle = EM.col('acc2'); c.fillStyle = EM.col('acc2'); c.lineWidth = 2.5;
    if (st.I > 0) { c.beginPath(); c.arc(cx, cy, 3.5, 0, 7); c.fill(); }
    else if (st.I < 0) { c.beginPath(); c.moveTo(cx - 6, cy - 6); c.lineTo(cx + 6, cy + 6); c.moveTo(cx + 6, cy - 6); c.lineTo(cx - 6, cy + 6); c.stroke(); }
    // probe
    const px = cx + st.r * sc * Math.cos(st.ang), py = cy + st.r * sc * Math.sin(st.ang);
    c.setLineDash([4, 4]); c.strokeStyle = EM.alpha(EM.col('acc3'), .7); c.lineWidth = 1; c.beginPath(); c.moveTo(cx, cy); c.lineTo(px, py); c.stroke(); c.setLineDash([]);
    c.fillStyle = EM.col('acc3'); c.strokeStyle = EM.col('bg'); c.lineWidth = 2; c.beginPath(); c.arc(px, py, 7, 0, 7); c.fill(); c.stroke();
    EM.label(c, EM.si(Bat(st.r), 'T'), px + 12, py - 10, EM.col('acc3'), { size: 12, weight: '700' });
    EM.label(c, 'scale: canvas edge = ' + EM.len(R_VIEW), 8, h - 10, EM.col('muted'), { size: 11, weight: '500' });
  };
  A.pointer({ down: mv, move: (p, e, d) => d && mv(p) });
  function mv(p) {
    const cx = A.W / 2, cy = A.H / 2, sc = (A.H / 2 - 6) / R_VIEW;
    const dx = p.x - cx, dy = p.y - cy; st.r = EM.clamp(Math.hypot(dx, dy) / sc, 0.004, 0.49); st.ang = Math.atan2(dy, dx);
    A.redraw(); B.redraw(); upd();
  }
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 62, y: 12, w: w - 80, h: h - 52 }, { xmin: 0.002, xmax: 1, xlog: true, ymin: 1e-7, ymax: 1e-2, ylog: true, xlabel: 'distance r from the wire (m)', ylabel: 'B (tesla)', yfmt: v => EM.si(v, 'T', 1) });
    P.grid();
    P.hline(50e-6, EM.alpha(EM.col('acc3'), .8), 1, [5, 4]); P.text('Earth’s field ≈ 50 µT', P.box.x + 8, P.Y(50e-6) - 9, EM.col('acc3'), 'left', EM.font(11));
    P.clip(); P.fn(r => st.I ? Bat(r) : NaN, EM.col('acc'), 2.5); P.unclip();
    if (st.I) P.dot(st.r, Bat(st.r), EM.col('acc3'));
    P.text('slope −1 on a log plot: B ∝ 1/r', P.box.x + P.box.w - 8, P.box.y + 14, EM.col('muted'), 'right', EM.font(11));
  };
  upd(); A.redraw();
});
