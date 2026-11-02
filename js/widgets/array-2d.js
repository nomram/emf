/* array-2d — planar phased array: beam in the u-v (direction-cosine) plane, steering in azimuth and elevation, grating lobes, taper */
EM.register('array-2d', function (el) {
  const W = EM.widget(el, { title: 'A flat phased array: steer in two directions', badge: 'Try it',
    note: 'View the sky as a disc: $u=\\sin\\theta\\cos\\phi$, $v=\\sin\\theta\\sin\\phi$ with the array looking out of the screen (centre = straight ahead, edge = horizon). The pattern is a product of a row and a column pattern. The beam is steered by shifting phase; at wide angles it <b>broadens</b> (the array looks smaller) and <b>grating lobes</b> may appear. Drag on the disc to point the beam.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: 1, maxH: 520, cursor: 'crosshair' });
  const st = { Nx: 16, Ny: 16, d: .5, u0: .3, v0: .2, taper: false, dB: true };
  EM.slider(side, { label: 'Elements across (N_x)', min: 2, max: 48, step: 1, value: 16, onInput: v => { st.Nx = v; upd(); } });
  EM.slider(side, { label: 'Elements up (N_y)', min: 2, max: 48, step: 1, value: 16, onInput: v => { st.Ny = v; upd(); } });
  EM.slider(side, { label: 'Spacing d', min: .3, max: 1.4, step: .01, value: .5, fmt: v => v.toFixed(2) + ' λ', onInput: v => { st.d = v; upd(); } });
  const us = EM.slider(side, { label: 'Beam direction u = sinθ cosφ', min: -.95, max: .95, step: .01, value: .3, fmt: v => v.toFixed(2), onInput: v => { st.u0 = v; upd(); } });
  const vs = EM.slider(side, { label: 'Beam direction v = sinθ sinφ', min: -.95, max: .95, step: .01, value: .2, fmt: v => v.toFixed(2), onInput: v => { st.v0 = v; upd(); } });
  EM.toggle(side, { label: 'Taper (Hamming) to lower sidelobes', checked: false, onChange: v => { st.taper = v; upd(); } });
  const ro = EM.readouts(side, [['th', 'Beam points', '', 'cool'], ['n', 'Elements (T/R modules)', '', 'fuel'], ['G', 'Gain ≈ 4πA/λ² × cosθ₀', '', 'hot'], ['bw', 'Beamwidth az × el (broadside)', '', ''], ['gl', 'Grating lobes', '', 'bad']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const off = EM.offscreen(160, 160), octx = off.getContext('2d'), img = octx.createImageData(160, 160);
  function w1(N) { const w = []; for (let n = 0; n < N; n++) { const x = (n - (N - 1) / 2) / ((N - 1) / 2 || 1); w.push(st.taper ? .54 + .46 * Math.cos(Math.PI * x * .98) : 1); } return w; }
  function af(u, u0, N, w) { const k = 2 * Math.PI * st.d; let re = 0, im = 0, s = 0; for (let n = 0; n < N; n++) { const ph = k * (n - (N - 1) / 2) * (u - u0); re += w[n] * Math.cos(ph); im += w[n] * Math.sin(ph); s += w[n]; } return Math.hypot(re, im) / s; }
  function upd() {
    const th = Math.asin(Math.min(1, Math.hypot(st.u0, st.v0))), ph = Math.atan2(st.v0, st.u0), n = st.Nx * st.Ny, A = n * st.d * st.d, G = 4 * Math.PI * A * Math.cos(th);
    const gl = st.d * (1 + Math.max(Math.abs(st.u0), Math.abs(st.v0))) > 1.0001;
    ro.set('th', EM.deg(th).toFixed(0) + '° off boresight, azimuth ' + EM.deg(ph).toFixed(0) + '°'); ro.set('n', n.toLocaleString()); ro.set('G', EM.fixed(10 * Math.log10(G), 1), 'dBi'); ro.set('bw', (51 / (st.Nx * st.d)).toFixed(1) + '° × ' + (51 / (st.Ny * st.d)).toFixed(1) + '°'); ro.set('gl', gl ? 'YES: spacing too big for this angle' : 'none in view');
    info.innerHTML = '<h6>' + EM.num(n) + ' elements</h6>The gain only depends on <b>area</b> $A=Nd^2$ (in wavelengths squared). A radar such as AN/TPY-2 uses about 25 000 transmit/receive modules; PAVE PAWS has 1792 per face. The beam is a spot (and the bright cross is the sidelobes of the rows and columns, which a taper reduces). Steer toward the edge and the spot stretches into an ellipse: the radar can not see below about ±60° without losing too much gain, so a full-coverage system uses several faces (three or four).'; S.redraw();
  }
  S.draw = (c, w, h) => {
    const R = Math.min(w, h) / 2 - 8, cx = w / 2, cy = h / 2, wx = w1(st.Nx), wy = w1(st.Ny), N = 160; let mx = 1e-9;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = (i + .5) / N * 2 - 1, v = 1 - (j + .5) / N * 2, r2 = u * u + v * v, o = (j * N + i) * 4;
      if (r2 > 1) { img.data[o + 3] = 0; continue; }
      const cosT = Math.sqrt(1 - r2), a = af(u, st.u0, st.Nx, wx) * af(v, st.v0, st.Ny, wy) * Math.pow(cosT, .5), db = 20 * Math.log10(Math.max(1e-4, a)), t = EM.clamp((db + 45) / 45, 0, 1), col = EM.heat(t);
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    octx.putImageData(img, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, N, N, cx - R, cy - R, 2 * R, 2 * R);
    c.strokeStyle = EM.alpha('#fff', .5); c.lineWidth = 1; for (const r of [.5, Math.sin(EM.rad(60)), 1]) { c.beginPath(); c.arc(cx, cy, r * R, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
    EM.label(c, 'horizon', cx + R * .72, cy - R * .72, '#fff', { size: 10 }); EM.label(c, '30°', cx + R * .5 + 3, cy + 11, '#fff', { size: 9 }); EM.label(c, '60°', cx + Math.sin(EM.rad(60)) * R + 3, cy + 11, '#fff', { size: 9 });
    const bx = cx + st.u0 * R, by = cy - st.v0 * R; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, 7, 0, 7); c.stroke();
    EM.label(c, 'sky seen from the array (centre = boresight); colour = dB below peak (white = peak, dark = −45 dB)', 8, 12, EM.col('muted'), { size: 10, weight: '500' });
  };
  S.pointer({ down: p => aim(p), move: (p, e, d) => d && aim(p) });
  function aim(p) { const R = Math.min(S.W, S.H) / 2 - 8; const u = EM.clamp((p.x - S.W / 2) / R, -.95, .95), v = EM.clamp(-(p.y - S.H / 2) / R, -.95, .95); if (u * u + v * v > .9) return; st.u0 = u; st.v0 = v; us.set(u, true); vs.set(v, true); upd(); }
  upd();
});
