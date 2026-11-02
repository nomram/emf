/* microwave-cavity — standing-wave heating pattern in a rectangular oven cavity (TM modes), turntable averaging, the chocolate speed-of-light test */
EM.register('microwave-cavity', function (el) {
  const W = EM.widget(el, { title: 'Hot spots: the standing-wave pattern in the oven', badge: 'Try it',
    note: 'The cavity is a resonant box. A mode $(m,n,p)$ resonates at $f=\\tfrac{c}{2}\\sqrt{(m/a)^2+(n/b)^2+(p/d)^2}$ and its heating is proportional to $E^2$: bright spots every half wavelength (≈ 6 cm at 2.45 GHz). Real ovens excite several modes at once and move the food (turntable) or the field (stirrer) so that the hot spots average out. Showing TM modes only (TE modes exist too).' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: 1, maxH: 520 });
  const c0 = EM.C.c, st = { a: .30, b: .29, d: .20, mode: -1, turn: false, z: .5, f: 2.45e9, spacing: 6, modes: [] };
  const aS = EM.slider(side, { label: 'Cavity width a', min: .2, max: .4, step: .005, value: .3, fmt: v => (v * 100).toFixed(1) + ' cm', onInput: v => { st.a = v; calc(); } });
  EM.slider(side, { label: 'Cavity depth b', min: .2, max: .4, step: .005, value: .29, fmt: v => (v * 100).toFixed(1) + ' cm', onInput: v => { st.b = v; calc(); } });
  EM.slider(side, { label: 'Cavity height d', min: .15, max: .3, step: .005, value: .2, fmt: v => (v * 100).toFixed(1) + ' cm', onInput: v => { st.d = v; calc(); } });
  EM.slider(side, { label: 'Height of the plate / food', min: 0, max: 1, step: .01, value: .5, fmt: v => (v * 100).toFixed(0) + ' % up', onInput: v => { st.z = v; draw(); } });
  const modeSel = EM.select(side, { label: 'Mode shown', options: [['-1', 'Several modes mixed (like a real oven)']], value: '-1', onChange: v => { st.mode = +v; draw(); } });
  EM.toggle(side, { label: 'Turntable on (rotate the food: average the pattern)', checked: false, onChange: v => { st.turn = v; draw(); } });
  const ro = EM.readouts(side, [['n', 'TM modes within 2.40–2.50 GHz', '', 'cool'], ['lam', 'Wavelength λ at 2.45 GHz', '', 'fuel'], ['hs', 'Hot-spot spacing ≈ λ/2', '', 'hot']]);
  const choc = EM.slider(side, { label: 'Chocolate test: measured distance between melted spots', min: 4, max: 8, step: .05, value: 6, fmt: v => v.toFixed(2) + ' cm', onInput: v => { st.spacing = v; ch(); } });
  const chInfo = EM.h('div', { class: 'info-box' }); side.append(chInfo);
  const off = EM.offscreen(110, 110), octx = off.getContext('2d'), img = octx.createImageData(110, 110);
  function calc() {
    st.modes = []; st.mix = []; for (let m = 1; m <= 9; m++) for (let n = 1; n <= 9; n++) for (let p = 0; p <= 5; p++) { const f = c0 / 2 * Math.sqrt(Math.pow(m / st.a, 2) + Math.pow(n / st.b, 2) + Math.pow(p / st.d, 2)); if (f > 2.4e9 && f < 2.5e9) st.modes.push({ m, n, p, f }); if (f > 2.25e9 && f < 2.65e9) st.mix.push({ m, n, p, f }); }
    modeSel.sel.innerHTML = ''; modeSel.sel.append(EM.h('option', { value: '-1', text: 'Several modes mixed (like a real oven)' })); st.modes.forEach((q, i) => modeSel.sel.append(EM.h('option', { value: i, text: 'TM(' + q.m + ',' + q.n + ',' + q.p + ') at ' + EM.freq(q.f) }))); modeSel.sel.value = st.mode < st.modes.length ? st.mode : -1; if (st.mode >= st.modes.length) st.mode = -1;
    ro.set('n', st.modes.length + ' (' + st.mix.length + ' within ±200 MHz; a loaded oven resonance is broad, so several are excited, plus the TE family)'); ro.set('lam', EM.len(c0 / 2.45e9)); ro.set('hs', EM.len(c0 / 2.45e9 / 2)); ch(); draw();
  }
  function ch() { const cc = 2 * st.spacing / 100 * 2.45e9; chInfo.innerHTML = '<h6>Measure the speed of light with chocolate</h6>Hot spots are half a wavelength apart: $c=2\\,d\\,f$ = 2 × ' + (st.spacing / 100).toFixed(4) + ' m × 2.45 GHz = <b>' + EM.num(cc, 4) + ' m/s</b> (' + ((cc / c0 - 1) * 100).toFixed(1) + ' % vs the true value). Take out the turntable, spread cheese or marshmallows on a plate, run for 20 seconds, and measure. (The oven’s frequency is printed on its rating plate: 2450 MHz.)'; if (window.renderMath) window.renderMath(chInfo); }
  function field(x, y, z) {
    const sel = st.mode >= 0 ? [st.modes[st.mode]] : st.mix.slice(0, 12); if (!sel.length || !sel[0]) return 0; let e = 0;
    sel.forEach((q, i) => { const amp = st.mode >= 0 ? 1 : .6 + .4 * Math.sin(i * 7.3 + 1); e += amp * Math.sin(q.m * Math.PI * x / st.a) * Math.sin(q.n * Math.PI * y / st.b) * Math.cos(q.p * Math.PI * z / st.d); });
    return e * e;
  }
  function draw() {
    const N = 110, z = st.z * st.d, R = st.turn ? 10 : 1, cx = st.a / 2, cy = st.b / 2; let mx = 1e-9; const buf = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i + .5) / N * st.a, y = (j + .5) / N * st.b; let s = 0;
      if (st.turn) { const dx = x - cx, dy = y - cy, rr = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx); for (let k = 0; k < 24; k++) { const a = a0 + k / 24 * 2 * Math.PI, xx = cx + rr * Math.cos(a), yy = cy + rr * Math.sin(a); if (xx > 0 && xx < st.a && yy > 0 && yy < st.b) s += field(xx, yy, z); } s /= 24; } else s = field(x, y, z);
      buf[j * N + i] = s; if (s > mx) mx = s;
    }
    for (let k = 0; k < N * N; k++) { const col = EM.heat(Math.pow(buf[k] / mx, .8)); img.data[k * 4] = col[0]; img.data[k * 4 + 1] = col[1]; img.data[k * 4 + 2] = col[2]; img.data[k * 4 + 3] = 255; }
    octx.putImageData(img, 0, 0); S.redraw();
  }
  S.draw = (c, w, h) => {
    const s = Math.min(w, h) - 20, ox = (w - s) / 2, oy = (h - s) / 2; c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, 110, 110, ox, oy, s * st.a / Math.max(st.a, st.b), s * st.b / Math.max(st.a, st.b));
    const pw = s * st.a / Math.max(st.a, st.b), ph = s * st.b / Math.max(st.a, st.b); c.strokeStyle = EM.col('text-2'); c.lineWidth = 2; c.strokeRect(ox, oy, pw, ph);
    if (st.turn) { c.strokeStyle = EM.alpha('#fff', .7); c.setLineDash([5, 4]); c.beginPath(); c.arc(ox + pw / 2, oy + ph / 2, Math.min(pw, ph) / 2 - 4, 0, 7); c.stroke(); c.setLineDash([]); }
    const lamPx = pw * (c0 / 2.45e9) / st.a; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(ox + 10, oy + ph - 14); c.lineTo(ox + 10 + lamPx, oy + ph - 14); c.stroke(); EM.label(c, 'λ = 12.2 cm', ox + 14 + lamPx, oy + ph - 14, '#fff', { size: 11, weight: '700' });
    EM.label(c, 'heating pattern (E²) in the plane of your food, seen from above', ox, oy - 4, EM.col('muted'), { size: 10, weight: '500' });
  };
  calc();
});
