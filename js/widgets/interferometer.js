/* interferometer — a sparse array of dishes: uv-coverage from baselines, Earth rotation, and the synthesised ("dirty") beam */
EM.register('interferometer', function (el) {
  const W = EM.widget(el, { title: 'Radio interferometry: a telescope as big as the dishes are far apart', badge: 'Try it',
    note: 'Each <b>pair</b> of dishes measures one Fourier component of the sky at the “spatial frequency” $(u,v)=\\vec B/\\lambda$ (their separation in wavelengths). Many pairs, plus the <b>rotation of the Earth</b> (which sweeps each baseline along an ellipse), fill the uv plane. The <b>synthesised beam</b> (right) is the Fourier transform of this coverage: its width is $\\approx\\lambda/B_{max}$. <b>Drag the dishes.</b> Positions and units are schematic.' });
  const { main, side } = W.grid('wide-side');
  const A = EM.canvas(main, { aspect: .55, cursor: 'grab' }), P = EM.canvas(main, { aspect: .62 }); P.cv.style.marginTop = '10px';
  const st = { ants: [], dec: 50, hrs: 8, drag: -1, lam: .21, Bmax: 36 };
  const PRE = {
    two: ['Two dishes', () => [[-.8, 0], [.8, 0]]],
    y: ['Y-shaped array (VLA-style)', () => { const a = [[0, 0]]; for (let k = 0; k < 3; k++) for (let i = 1; i <= 6; i++) a.push([Math.cos(Math.PI / 2 + k * 2 * Math.PI / 3) * (i * i / 36) * .9 + 0, Math.sin(Math.PI / 2 + k * 2 * Math.PI / 3) * (i * i / 36) * .9]); return a; }],
    ring: ['Ring of 16', () => Array.from({ length: 16 }, (_, i) => [.85 * Math.cos(i * Math.PI / 8), .85 * Math.sin(i * Math.PI / 8)])],
    rand: ['Random 12', () => { EM.rand(11); return Array.from({ length: 12 }, () => [(EM.rand() - .5) * 1.8, (EM.rand() - .5) * 1.8]); }],
    vlbi: ['8 telescopes across a continent (VLBI-style)', () => [[-.9, .2], [-.6, -.5], [-.2, .7], [.1, -.1], [.4, .6], [.6, -.6], [.85, .1], [-.3, -.1]]],
  };
  const sel = EM.select(side, { label: 'Array layout', options: Object.entries(PRE).map(([k, v]) => [k, v[0]]), value: 'y', onChange: v => { st.ants = PRE[v][1](); calc(); } });
  EM.slider(side, { label: 'Source declination (low = tracks flatten)', min: 10, max: 90, step: 1, value: 50, unit: '°', onInput: v => { st.dec = v; calc(); } });
  EM.slider(side, { label: 'Observing time (Earth rotation)', min: 0, max: 12, step: .5, value: 8, fmt: v => v + ' h', onInput: v => { st.hrs = v; calc(); } });
  const PREC = [['', 'Real-world scale…'], ['vla', 'VLA: 36 km, 21 cm'], ['alma', 'ALMA: 16 km, 1 mm'], ['eht', 'Event Horizon Telescope: 10 000 km, 1.3 mm'], ['lofar', 'LOFAR: 1000 km, 2 m']];
  EM.select(side, { label: 'Resolution in real units', options: PREC, value: '', onChange: v => { const t = { vla: [36e3, .21], alma: [16e3, 1e-3], eht: [1e7, 1.3e-3], lofar: [1e6, 2] }[v]; if (t) { st.Bmax = t[0]; st.lam = t[1]; calc(); } } });
  const ro = EM.readouts(side, [['nb', 'Baselines (pairs)', '', 'cool'], ['cov', 'uv-plane filled', '', 'fuel'], ['bm', 'Synthesised beam width', '', 'hot'], ['sl', 'Strongest sidelobe', '', 'bad'], ['res', 'Angular resolution λ/B', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  st.ants = PRE.y[1]();
  const GN = 72, off = EM.offscreen(GN, GN), octx = off.getContext('2d'), img = octx.createImageData(GN, GN); let uv = [], psf = null;
  function calc(fast) {
    uv = []; const n = st.ants.length, steps = fast ? 8 : 24, sd = Math.sin(EM.rad(st.dec));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const bx = st.ants[j][0] - st.ants[i][0], by = st.ants[j][1] - st.ants[i][1]; for (let s = 0; s <= steps; s++) { const H = (s / steps - .5) * EM.rad(st.hrs * 15); const u = bx * Math.cos(H) - by * Math.sin(H), v = (bx * Math.sin(H) + by * Math.cos(H)) * sd; uv.push([u, v], [-u, -v]); } }
    let mu = 1e-9; for (const p of uv) mu = Math.max(mu, Math.hypot(p[0], p[1])); st.umax = mu;
    const F = 5, buf = new Float32Array(GN * GN); let mx = 1e-9, cnt = 0;
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const l = (i / (GN - 1) * 2 - 1) * F, m = (j / (GN - 1) * 2 - 1) * F; let s = 0; for (const p of uv) s += Math.cos(2 * Math.PI * (p[0] * l + p[1] * m)); buf[j * GN + i] = s; }
    mx = buf[(GN >> 1) * GN + (GN >> 1)] || 1; psf = { buf, mx, F };
    for (let k = 0; k < GN * GN; k++) { const col = EM.diverge(buf[k] / mx); img.data[k * 4] = col[0]; img.data[k * 4 + 1] = col[1]; img.data[k * 4 + 2] = col[2]; img.data[k * 4 + 3] = 255; } octx.putImageData(img, 0, 0);
    // beam width (FWHM along the x axis through the centre) and highest sidelobe
    const cx0 = GN >> 1; let lo = 0; while (cx0 + lo < GN - 1 && buf[cx0 * GN + cx0 + lo] / mx > .5) lo++; const fw = 2 * lo / (GN - 1) * 2 * F;
    let sl = 0; for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const r = Math.hypot((i - cx0) / (GN - 1) * 2 * F, (j - cx0) / (GN - 1) * 2 * F); if (r > fw * 1.6) sl = Math.max(sl, buf[j * GN + i] / mx); }
    // coverage: fraction of uv cells (in a disc of radius umax) hit
    const cells = new Set(); for (const p of uv) cells.add(Math.round(p[0] / mu * 14) + ',' + Math.round(p[1] / mu * 14)); cnt = cells.size / (Math.PI * 14 * 14);
    const theta = st.lam / st.Bmax; ro.set('nb', n * (n - 1) / 2); ro.set('cov', Math.min(100, cnt * 100).toFixed(0) + ' %'); ro.set('bm', (fw / st.umax).toFixed(2) + ' × λ/B (nominal)'); ro.set('sl', EM.fixed(20 * Math.log10(Math.max(1e-3, sl)), 0) + ' dB'); ro.set('res', theta > 1e-3 ? (theta * 206265).toFixed(1) + ' arcsec' : (theta * 206265e6).toFixed(0) + ' µas');
    info.innerHTML = '<h6>Why many baselines</h6>Two dishes give a single stripe of the uv plane and a striped beam with endless sidelobes. More dishes and hours of Earth rotation fill in a dense pattern, and the sidelobes of the synthesised beam drop. <b>Resolution is set by the longest baseline</b> $\\theta\\approx\\lambda/B_{max}$: 1.2″ for the VLA at 21 cm; 26 microarcseconds for the Event Horizon Telescope (Earth-sized baseline, 1.3 mm) — enough to image the shadow of the black hole in the galaxy M87 (2019) and Sagittarius A* (2022).'; if (window.renderMath) window.renderMath(info); A.redraw(); P.redraw();
  }
  A.draw = (c, w, h) => {
    const half = w / 2, Rl = Math.min(half - 20, h - 20) / 2, lx = half / 2, ly = h / 2, ux = half + half / 2, Ru = Rl;
    c.fillStyle = EM.col('bg-2'); c.fillRect(0, 0, w, h); c.strokeStyle = EM.col('line'); c.beginPath(); c.moveTo(half, 8); c.lineTo(half, h - 8); c.stroke();
    // layout
    c.strokeStyle = EM.alpha(EM.col('line-2'), .6); c.strokeRect(lx - Rl, ly - Rl, 2 * Rl, 2 * Rl); st.ants.forEach((p, i) => { c.fillStyle = i === st.drag ? EM.col('acc3') : EM.col('acc'); c.beginPath(); c.arc(lx + p[0] * Rl, ly - p[1] * Rl, 6, 0, 7); c.fill(); c.strokeStyle = EM.col('bg'); c.lineWidth = 1.5; c.stroke(); });
    EM.label(c, 'dish layout (drag me)', lx, 12, EM.col('muted'), { size: 10, align: 'center', weight: '500' }); EM.label(c, 'uv coverage (spatial frequencies)', ux, 12, EM.col('muted'), { size: 10, align: 'center', weight: '500' });
    c.fillStyle = EM.alpha(EM.col('acc3'), .55); const sc = Ru / (st.umax || 1) * .94; for (const p of uv) c.fillRect(ux + p[0] * sc - .8, ly - p[1] * sc - .8, 1.6, 1.6);
    c.strokeStyle = EM.alpha(EM.col('line-2'), .6); c.beginPath(); c.moveTo(ux - Ru, ly); c.lineTo(ux + Ru, ly); c.moveTo(ux, ly - Ru); c.lineTo(ux, ly + Ru); c.stroke();
    st.geom = { lx, ly, Rl };
  };
  P.draw = (c, w, h) => {
    const s = Math.min(w, h) - 16, ox = (w - s) / 2, oy = (h - s) / 2; c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, GN, GN, ox, oy, s, s); c.strokeStyle = EM.col('line-2'); c.strokeRect(ox + .5, oy + .5, s, s);
    EM.label(c, 'synthesised beam (dirty beam) on the sky: bright centre = main lobe; the ripples around it are sidelobes', ox, oy - 3, EM.col('muted'), { size: 10, weight: '500' });
  };
  A.pointer({ down: p => { const g = st.geom; let best = -1, bd = 16; st.ants.forEach((a, i) => { const d = Math.hypot(g.lx + a[0] * g.Rl - p.x, g.ly - a[1] * g.Rl - p.y); if (d < bd) { bd = d; best = i; } }); st.drag = best; if (best < 0 && p.x < A.W / 2 && st.ants.length < 30) { st.ants.push([(p.x - g.lx) / g.Rl, -(p.y - g.ly) / g.Rl]); calc(true); } }, move: (p, e, d) => { if (d && st.drag >= 0) { const g = st.geom; st.ants[st.drag] = [EM.clamp((p.x - g.lx) / g.Rl, -1, 1), EM.clamp(-(p.y - g.ly) / g.Rl, -1, 1)]; calc(true); } }, up: () => { st.drag = -1; calc(); } });
  calc();
});
