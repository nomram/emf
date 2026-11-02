/* sar — synthetic aperture radar: a moving small antenna acts as a huge array; resolution D/2 independent of range */
EM.register('sar', function (el) {
  const W = EM.widget(el, { title: 'Synthetic aperture radar: borrowing a huge antenna from motion', badge: 'Try it',
    note: 'A real beam is wide at long range: $\\Delta_{cross}=R\\lambda/D$ (kilometres from orbit). A radar on a <b>moving platform</b> records the echoes of a target along the track; combining them is like having an antenna as long as the track over which the target stays in the beam, $L_{syn}=R\\lambda/D$. The reward: $\\Delta_{cross}\\approx D/2$, <b>independent of range and wavelength</b> (smaller antenna → finer images!).' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 }), B = EM.canvas(main, { aspect: .42 }); B.cv.style.marginTop = '10px';
  const st = { R: 693e3, f: 5.4e9, D: 12.3, v: 7500, t: 0 };
  const PRE = [['Sentinel-1 (C-band, 693 km, 12.3 m antenna)', 693e3, 5.405e9, 12.3, 7500], ['Airborne X-band, 10 km, 1 m antenna', 10e3, 9.6e9, 1, 120], ['Small SAR satellite (X-band, 520 km, 3 m)', 520e3, 9.65e9, 3, 7600], ['Drone SAR (Ku-band, 1 km, 0.3 m)', 1e3, 15e9, .3, 20], ['ALOS-2 L-band, 628 km, 10 m', 628e3, 1.27e9, 10, 7500]];
  EM.select(side, { label: 'Examples', options: PRE.map((p, i) => [i, p[0]]), value: 0, onChange: v => { const p = PRE[+v]; st.R = p[1]; st.f = p[2]; st.D = p[3]; st.v = p[4]; Rs.set(st.R, true); fs.set(st.f, true); Ds.set(st.D, true); upd(); } });
  const Rs = EM.slider(side, { label: 'Range to the scene', min: 500, max: 1e6, log: true, value: 693e3, fmt: v => EM.len(v), onInput: v => { st.R = v; upd(); } });
  const fs = EM.slider(side, { label: 'Frequency', min: 1e9, max: 4e10, log: true, value: 5.4e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const Ds = EM.slider(side, { label: 'Antenna length along track D', min: .1, max: 20, log: true, value: 12.3, fmt: v => EM.len(v), onInput: v => { st.D = v; upd(); } });
  const ro = EM.readouts(side, [['lam', 'Wavelength', '', 'cool'], ['real', 'Real-beam cross-range Rλ/D', '', 'bad'], ['lsyn', 'Synthetic aperture length', '', 'fuel'], ['sar', 'SAR cross-range ≈ D/2', '', 'good'], ['gain', 'Improvement', '', 'hot'], ['tint', 'Integration time', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function upd() {
    const lam = EM.C.c / st.f, real = st.R * lam / st.D, L = real, sar = st.D / 2; ro.set('lam', EM.len(lam)); ro.set('real', EM.len(real)); ro.set('lsyn', EM.len(L)); ro.set('sar', EM.len(sar)); ro.set('gain', EM.num(real / sar, 3) + '×'); ro.set('tint', EM.si(L / st.v, 's'));
    info.innerHTML = '<h6>Why it works</h6>As the platform flies past a point, the distance to it changes as $r(x)=\\sqrt{R^2+x^2}$, so the echo’s phase (and Doppler) follows a known curve: a chirp in the <em>along-track</em> direction. Correlating each pixel’s echoes with that expected chirp “focuses” the image, exactly like pulse compression in range (chapter 12). Range resolution comes from the pulse bandwidth, cross-range from the Doppler history. Cloud, darkness and weather don’t matter: SAR images the Earth day and night, maps ice, floods, land motion to millimetres (interferometry), and ships.';
    if (window.renderMath) window.renderMath(info); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const lam = EM.C.c / st.f, ws = 2 * st.R * lam / st.D, grd = h - 40, top = 34, ax = w * .12, bx = w * .88;                                // schematic (not to scale)
    c.fillStyle = EM.alpha(EM.col('ok'), .2); c.fillRect(0, grd, w, h - grd); c.strokeStyle = EM.col('line-2'); c.setLineDash([5, 5]); c.beginPath(); c.moveTo(ax, top); c.lineTo(bx, top); c.stroke(); c.setLineDash([]);
    const px = ax + ((st.t * .25) % 1) * (bx - ax), tx = w / 2, ty = grd;
    // synthetic aperture span: positions from which the point target is illuminated
    const half = Math.min(w * .38, (grd - top) * Math.tan(EM.rad(Math.min(40, 140 * lam / st.D / 2)))); c.fillStyle = EM.alpha(EM.col('acc3'), .18); c.fillRect(tx - half, top - 8, 2 * half, 10); EM.label(c, 'synthetic aperture L = Rλ/D', tx, top - 18, EM.col('acc3'), { size: 11, align: 'center', weight: '700' });
    c.strokeStyle = EM.alpha(EM.col('acc'), .8); c.fillStyle = EM.alpha(EM.col('acc'), .12); c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, top); c.lineTo(px - (grd - top) * Math.tan(EM.rad(Math.min(40, 140 * lam / st.D / 2))), grd); c.lineTo(px + (grd - top) * Math.tan(EM.rad(Math.min(40, 140 * lam / st.D / 2))), grd); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = EM.col('text'); c.fillRect(px - 9, top - 4, 18, 8); EM.label(c, 'radar platform (flying →)', px, top + 18, EM.col('text-2'), { size: 10, align: 'center' });
    c.fillStyle = EM.col('bad'); c.beginPath(); c.arc(tx, ty - 4, 6, 0, 7); c.fill(); EM.label(c, 'point target', tx, ty + 18, EM.col('bad'), { size: 11, align: 'center', weight: '700' });
    EM.label(c, 'beam footprint on the ground = ' + EM.len(ws / 2) + ' (real-beam blur)', 10, h - 10, EM.col('muted'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const lam = EM.C.c / st.f, L = st.R * lam / st.D, P = EM.plot(c, { x: 60, y: 12, w: w - 76, h: h - 48 }, { xmin: -L / 2, xmax: L / 2, ymin: 0, ymax: 1, yticks: [], xlabel: 'platform position along track (m)', xfmt: v => EM.num(v, 3) }), r = x => Math.sqrt(st.R * st.R + x * x) - st.R;
    P.grid(); const rmax = r(L / 2); const N = 200, xs = [], ys = []; for (let i = 0; i <= N; i++) { const x = -L / 2 + L * i / N; xs.push(x); ys.push(1 - r(x) / (rmax || 1) * .9); }
    P.line(xs, ys, EM.col('acc3'), 2.6); const cycles = 2 * rmax / lam; EM.label(c, 'range history of one point target: Δr = ' + EM.len(rmax) + ' ≈ ' + EM.num(cycles, 3) + ' half-wavelength cycles of phase', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 11, weight: '500' });
    EM.label(c, 'this known curve (a chirp in slow time) is the matched filter that focuses the image', P.box.x + 8, P.box.y + 32, EM.col('muted'), { size: 10, weight: '500' });
  };
  EM.loop(el, (t, dt) => { st.t += dt * .5; A.redraw(); });
  upd();
});
