/* fdtd-box — a live 2-D wave simulation (FDTD, TMz) of a metal box with an aperture, an optional tube (waveguide), a second slot and an optional conductive-film window */
EM.register('fdtd-box', function (el) {
  const W = EM.widget(el, { title: 'Build a shielded box and shine a wave on it', badge: 'Simulation',
    note: 'A real wave simulation (finite-difference time-domain, 2-D, $E_z$ out of the screen). A plane wave comes from the left and hits a metal box (grey = perfect conductor). Open an <b>aperture</b>, add a <b>tube</b> in front of it, cut a <b>seam</b>, or cover the opening with a <b>conductive film</b> (a transparent-conductor model, set by its sheet resistance) and watch what gets inside. Wavelength is measured in grid cells; a tube narrower than <b>λ/2</b> is below cutoff (in 2-D, the plate spacing plays the role of the waveguide width).' });
  const { main, side } = W.grid();
  const NX = 220, NY = 140, S = EM.canvas(main, { aspect: NY / NX });
  const st = { absorb: true, lam: 28, g: 14, L: 0, tubeIn: false, seam: 0, film: false, rs: 80, t: 3, view: 'inst', run: true, step: 0 };
  const PRE = [['Sealed box', { g: 0, L: 0, seam: 0, film: false }], ['Hole λ/4 wide (small)', { g: 7, L: 0, seam: 0, film: false }], ['Slot λ/2 wide: the wave walks in', { g: 14, L: 0, seam: 0, film: false }], ['Hole λ/4 + tube 3 widths long (below cutoff)', { g: 7, L: 30, seam: 0, film: false }], ['Wide tube (above cutoff): a waveguide', { g: 22, L: 40, seam: 0, film: false }], ['Large opening λ wide, covered by a conductive film', { g: 28, L: 0, seam: 0, film: true }], ['Tiny seam in the wall (λ/14)', { g: 0, L: 0, seam: 2, film: false }]];
  EM.select(side, { label: 'Examples', options: PRE.map((p, i) => [i, p[0]]), value: 2, onChange: v => { Object.assign(st, PRE[+v][1]); sync(); build(); } });
  const sl = {};
  sl.lam = EM.slider(side, { label: 'Wavelength λ', min: 14, max: 70, step: 1, value: 28, fmt: v => v + ' cells', onInput: v => { st.lam = v; upd(); reset(); } });
  sl.g = EM.slider(side, { label: 'Aperture width g (0 = sealed)', min: 0, max: 40, step: 1, value: 14, fmt: v => v + ' cells  (≈ ' + ((v + 1) / st.lam).toFixed(2) + ' λ)', onInput: v => { st.g = v; build(); } });
  sl.L = EM.slider(side, { label: 'Tube length in front of the aperture', min: 0, max: 60, step: 1, value: 0, fmt: v => v + ' cells', onInput: v => { st.L = v; build(); } });
  sl.seam = EM.slider(side, { label: 'Extra thin seam in the wall', min: 0, max: 8, step: 1, value: 0, fmt: v => v ? v + ' cells' : 'none', onInput: v => { st.seam = v; build(); } });
  sl.film = EM.toggle(side, { label: 'Cover the openings with a conductive film (window)', checked: false, onChange: v => { st.film = v; build(); } });
  sl.rs = EM.slider(side, { label: 'Film sheet resistance Rs', min: 5, max: 1000, log: true, value: 80, fmt: v => EM.num(v, 3) + ' Ω/sq', onInput: v => { st.rs = v; build(); } });
  EM.toggle(side, { label: 'Absorber lining inside the box (damps cavity ringing)', checked: true, onChange: v => { st.absorb = v; build(); } });
  EM.seg(side, [['inst', 'Field (instant)'], ['avg', 'Average intensity (dB)']], 'inst', v => { st.view = v; });
  const row = EM.h('div', { class: 'btn-row' }); side.append(row); const pb = EM.btn(row, 'Pause', () => { st.run = !st.run; pb.textContent = st.run ? 'Pause' : 'Run'; }, 'small'); EM.btn(row, '↺ Restart', () => reset(), 'small');
  const ro = EM.readouts(side, [['gl', 'Aperture / wavelength', '', 'cool'], ['mode', 'Aperture regime', '', ''], ['pred', 'Tube attenuation predicted', '', 'fuel'], ['se', 'Shielding measured here (≈)', '', 'hot']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function sync() { sl.g.set(st.g, true); sl.L.set(st.L, true); sl.seam.set(st.seam, true); sl.film.set(st.film, true); upd(); }
  // ---- grid
  const Ez = new Float32Array(NX * NY), Hx = new Float32Array(NX * NY), Hy = new Float32Array(NX * NY), avg = new Float32Array(NX * NY), pec = new Uint8Array(NX * NY), sig = new Float32Array(NX * NY), damp = new Float32Array(NX * NY);
  const id = (i, j) => j * NX + i, SP = 16; for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const d = Math.min(i, NX - 1 - i, j, NY - 1 - j); damp[id(i, j)] = d < SP ? 1 - .12 * Math.pow((SP - d) / SP, 2) : 1; }
  const BX0 = 100, BX1 = 205, BY0 = 32, BY1 = 108, AY = 70, SRC = 24;
  function build() {
    pec.fill(0); sig.fill(0); const t = st.t;
    for (let j = BY0; j <= BY1; j++) for (let i = BX0; i <= BX1; i++) { const wall = i < BX0 + t || i > BX1 - t || j < BY0 + t || j > BY1 - t; if (wall) pec[id(i, j)] = 1; }
    if (st.absorb) for (let j = BY0 + t; j <= BY1 - t; j++) for (let i = BX0 + t; i <= BX1 - t; i++) sig[id(i, j)] = .004;
    const cut = (y0, y1) => { for (let j = Math.max(0, y0); j <= y1; j++) for (let i = BX0; i < BX0 + t; i++) { pec[id(i, j)] = 0; if (st.film) sig[id(i, j)] = 1 / ((st.rs / 377) * t); } };
    if (st.g > 0) { const y0 = Math.round(AY - st.g / 2), y1 = y0 + st.g - 1; cut(y0, y1);
      if (st.L > 0) for (let i = BX0 - st.L; i < BX0; i++) for (const jj of [y0 - 2, y0 - 1, y1 + 1, y1 + 2]) pec[id(i, jj)] = 1; }
    if (st.seam > 0) { const y0 = BY0 + 12; cut(y0, y0 + st.seam - 1); }
    Ez.fill(0); Hx.fill(0); Hy.fill(0); avg.fill(0); st.step = 0; upd();
  }
  function reset() { Ez.fill(0); Hx.fill(0); Hy.fill(0); avg.fill(0); st.step = 0; }
  function upd() {
    const ge = st.g + 1, gl = ge / st.lam; ro.set('gl', st.g ? gl.toFixed(2) + ' λ  (cutoff at 0.50)' : 'sealed'); ro.set('mode', !st.g ? '—' : gl < .5 ? 'below cutoff' : 'above cutoff: propagates'); ro.set('pred', st.g && st.L && gl < .5 ? EM.fixed(27.3 * st.L / ge * Math.sqrt(1 - Math.pow(2 * gl, 2)), 0) + ' dB' : '—');
    info.innerHTML = '<h6>Things to try</h6>1) Sealed box: nothing inside, the wave is reflected and forms a standing pattern in front. 2) A hole <em>smaller</em> than λ/2: only a weak, rapidly decaying “evanescent” glow enters (a shielding hole). 3) Widen the hole past λ/2: the wave passes. 4) Add a tube: below cutoff it kills the field exponentially along its length. 5) Cover a large opening with a film: Rs ≈ 80 Ω/sq blocks most of the wave while still being (optically) transparent, as in conductive shield glass (see the materials widget). 6) A thin seam leaks a lot more than its width suggests <em>if its length is comparable to λ/2</em>.';
  }
  function stepSim() {
    const dt = .5, w = 2 * Math.PI / st.lam, n = st.step++, T = st.lam * 6 / dt, ramp = n < T ? .5 * (1 - Math.cos(Math.PI * n / T)) : 1;
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) { const k = id(i, j); Hx[k] -= dt * (Ez[k + NX] - Ez[k]); Hy[k] += dt * (Ez[k + 1] - Ez[k]); }
    for (let j = 1; j < NY; j++) for (let i = 1; i < NX; i++) { const k = id(i, j); if (pec[k]) { Ez[k] = 0; continue; } const s = sig[k], a = (1 - s * dt / 2) / (1 + s * dt / 2), b = dt / (1 + s * dt / 2); Ez[k] = a * Ez[k] + b * ((Hy[k] - Hy[k - 1]) - (Hx[k] - Hx[k - NX])); }
    for (let j = 0; j < NY; j++) Ez[id(SRC, j)] += ramp * Math.sin(w * n * dt) * .5 * (j > 8 && j < NY - 8 ? 1 : 0);
    for (let k = 0; k < NX * NY; k++) { const d = damp[k]; if (d < 1) { Ez[k] *= d; Hx[k] *= d; Hy[k] *= d; } const e = Ez[k]; avg[k] = avg[k] * .992 + e * e * .008; }
  }
  const off = EM.offscreen(NX, NY), octx = off.getContext('2d'), img = octx.createImageData(NX, NY);
  function meas() {
    let pin = 0, n1 = 0, pinc = 0, n2 = 0; for (let j = BY0 + st.t + 3; j < BY1 - st.t - 2; j++) for (let i = BX0 + st.t + 8; i < BX1 - st.t - 6; i++) { pin += avg[id(i, j)]; n1++; } for (let j = AY - 24; j < AY + 24; j++) for (let i = 40; i < 75; i++) { pinc += avg[id(i, j)]; n2++; }
    const a = pin / n1, b = pinc / n2; return b > 1e-6 && st.step > st.lam * 8 ? 10 * Math.log10(b / Math.max(a, 1e-12)) : null;
  }
  S.draw = (c, w, h) => {
    const dark = EM.isDark(); let mx = 0; for (let k = 0; k < NX * NY; k += 7) mx = Math.max(mx, avg[k]);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = id(i, j), o = k * 4; let col;
      if (pec[k]) col = dark ? [120, 130, 142] : [90, 100, 110]; else if (sig[k] > 0) col = [76, 201, 240];
      else if (st.view === 'inst') col = EM.diverge(Ez[k] * 1.6);
      else { const db = 10 * Math.log10(Math.max(avg[k], 1e-9) / .12); col = EM.heat(EM.clamp((db + 60) / 62, 0, 1)); }
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    octx.putImageData(img, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(off, 0, 0, w, h);
    EM.label(c, 'incident wave →', 8, 14, EM.col('muted'), { size: 11, weight: '600' }); EM.label(c, 'inside the box', (BX0 + BX1) / 2 / NX * w, (BY0 + BY1) / 2 / NY * h, EM.col('text'), { size: 11, align: 'center', weight: '700', bg: EM.alpha(EM.col('bg'), .45) });
    const se = meas(); if (se != null) ro.set('se', EM.fixed(se, 0), 'dB'); else ro.set('se', 'settling…');
  };
  EM.loop(el, () => { if (st.run) for (let k = 0; k < 5; k++) stepSim(); S.redraw(); });
  sync(); build();
});
