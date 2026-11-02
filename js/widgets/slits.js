/* slits.js — three widgets sharing one scene:
   slit-pellets  : classical pellets through N slits (bumps behind each slit, no interference)
   slit-quantum  : photons / electrons one at a time (dots build up an interference pattern)
   slit-observer : which-path detector, partial knowledge, stray gas, quantum eraser                          */
(function () {
  const PI = Math.PI;
  const sinc2 = x => { const v = Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; return v * v; };
  const SMAX = 6.5;                     // screen half-width in fringe spacings (quantum case)
  const NB = 130;
  // normalised intensity in fringe units s = y d /(lambda L);  r = a/d
  function inten(s, r, N, Vis) {
    const env = sinc2(PI * s * r), x = PI * s;
    if (N === 1) return env;
    if (N === 2) return env * (1 + Vis * Math.cos(2 * x)) / 2;
    const den = N * Math.sin(x); return env * (Math.abs(den) < 1e-9 ? 1 : Math.pow(Math.sin(N * x) / den, 2));
  }
  function sample(fn, lo, hi, max) { for (let i = 0; i < 200; i++) { const s = lo + Math.random() * (hi - lo); if (Math.random() * max <= fn(s)) return s; } return 0; }

  function scene(el, kind) {
    const TITLE = { pellets: 'Experiment 1: shoot pellets at some slits', quantum: 'Experiment 2: shoot single photons (or electrons) at the same slits', observer: 'Experiment 3: now watch which slit it goes through' }[kind];
    const NOTE = {
      pellets: 'Each pellet goes through one slit and lands somewhere behind it, with a bit of random scatter from the slit edges. The pile on the screen is just the <b>sum of N separate bumps</b>, one per slit. Nothing surprising here: this is the <em>classical particle</em> prediction.',
      quantum: 'The source fires <b>one particle at a time</b>, so they cannot interfere with each other. Each lands as a single dot, yet after many dots the screen shows <b>bright and dark stripes</b>, the interference pattern of a wave that went through <em>all</em> the slits. The yellow curve is the quantum prediction $I\\propto\\mathrm{sinc}^2\\!\\big(\\pi a y/\\lambda L\\big)\\,\\big[\\sin N\\delta/N\\sin\\delta\\big]^2$.',
      observer: 'Add a detector that records <b>which slit</b> each particle used and the stripes vanish, <em>even if nobody ever reads the record</em>. “Observer” means anything that records the path (a detector, a stray gas molecule, a scattered photon), not a person. A weak detector gives a faded pattern: the more you know about the path, the less interference.',
    }[kind];
    const W = EM.widget(el, { title: TITLE, badge: kind === 'pellets' ? 'Classical' : 'Quantum', note: NOTE });
    const { main, side } = W.grid();
    const S = EM.canvas(main, { aspect: .72 });
    const st = {
      N: kind === 'pellets' ? 2 : 2, a: kind === 'pellets' ? 4 : 5, d: kind === 'pellets' ? 14 : 20, spread: 6, lam: 550, V: 500, who: 'photon', rate: 40, run: false, theory: true, wave: false,
      mode: 'free', K: .5, gas: 0, eraser: false, bins: new Array(NB).fill(0), binsA: new Array(NB).fill(0), binsB: new Array(NB).fill(0), dots: [], fly: [], total: 0, slitHits: [0, 0], t: 0,
    };
    const reset = () => { st.bins.fill(0); st.binsA.fill(0); st.binsB.fill(0); st.dots = []; st.fly = []; st.total = 0; st.slitHits = [0, 0]; upd(); };
    // ---------- controls
    if (kind !== 'observer') EM.slider(side, { label: 'Number of slits N', min: 1, max: 5, step: 1, value: 2, onInput: v => { st.N = v; reset(); } });
    else st.N = 2;
    if (kind === 'pellets') {
      EM.slider(side, { label: 'Slit width', min: 1, max: 8, step: .5, value: st.a, unit: 'cm', onInput: v => { st.a = v; reset(); } });
      EM.slider(side, { label: 'Slit spacing', min: 8, max: 24, step: 1, value: st.d, unit: 'cm', onInput: v => { st.d = v; reset(); } });
      EM.slider(side, { label: 'Scatter off the slit edges', min: 1, max: 12, step: .5, value: st.spread, unit: 'cm', onInput: v => { st.spread = v; reset(); } });
    } else {
      EM.seg(side, [['photon', 'Photons'], ['electron', 'Electrons']], 'photon', v => { st.who = v; lamS.el.style.display = v === 'photon' ? '' : 'none'; vS.el.style.display = v === 'photon' ? 'none' : ''; reset(); });
      var lamS = EM.slider(side, { label: 'Wavelength', min: 400, max: 700, step: 5, value: 550, unit: 'nm', onInput: v => { st.lam = v; reset(); } });
      var vS = EM.slider(side, { label: 'Electron accelerating voltage', min: 50, max: 50000, log: true, value: 500, fmt: v => EM.si(v, 'V'), onInput: v => { st.V = v; reset(); } }); vS.el.style.display = 'none';
      EM.slider(side, { label: 'Slit spacing d', min: 5, max: 100, step: 1, value: 20, unit: 'µm', onInput: v => { st.d = v; reset(); } });
      EM.slider(side, { label: 'Slit width a', min: 1, max: 20, step: .5, value: 5, unit: 'µm', onInput: v => { st.a = Math.min(v, st.d * .9); reset(); } });
    }
    if (kind === 'observer') {
      const modes = [['free', 'Nobody watching'], ['det', 'Detector at the slits'], ['off', 'Detector installed, switched OFF'], ['weak', 'Weak / partial detector'], ['gas', 'Stray gas in the chamber'], ['eraser', 'Quantum eraser']];
      EM.select(side, { label: 'Who is watching?', options: modes, value: 'free', onChange: v => { st.mode = v; Ks.el.style.display = v === 'weak' ? '' : 'none'; Gs.el.style.display = v === 'gas' ? '' : 'none'; reset(); } });
      var Ks = EM.slider(side, { label: 'Which-path knowledge K', min: 0, max: 1, step: .01, value: .5, fmt: v => v.toFixed(2), onInput: v => { st.K = v; reset(); } }); Ks.el.style.display = 'none';
      var Gs = EM.slider(side, { label: 'Gas pressure in chamber', min: 0, max: 3, step: .05, value: 0, fmt: v => v.toFixed(2) + ' (arb.)', onInput: v => { st.gas = v; reset(); } }); Gs.el.style.display = 'none';
    }
    const rs = EM.slider(side, { label: 'Particles per second', min: 1, max: 3000, log: true, value: 40, fmt: v => Math.round(v) + ' /s', onInput: v => { st.rate = v; } });
    const row = EM.h('div', { class: 'btn-row' }); side.append(row);
    const runB = EM.btn(row, '▶ Run', () => { st.run = !st.run; runB.textContent = st.run ? '❚❚ Pause' : '▶ Run'; }, 'primary');
    EM.btn(row, '+1', () => emit(1), 'small'); EM.btn(row, '+100', () => emit(100), 'small'); EM.btn(row, '+2000', () => emit(2000), 'small'); EM.btn(row, '↺ Reset', reset, 'small');
    EM.toggle(side, { label: 'Show the predicted curve', checked: true, onChange: v => { st.theory = v; } });
    if (kind === 'quantum') EM.toggle(side, { label: 'Show the wave that carries the probability', checked: false, onChange: v => { st.wave = v; } });
    const ro = EM.readouts(side, kind === 'pellets' ? [['n', 'Pellets fired', '', 'fuel'], ['bumps', 'Bumps on screen', '', 'cool']] : [['n', 'Particles landed', '', 'fuel'], ['lam', 'Wavelength λ', '', 'cool'], ['fr', 'Fringe spacing on screen', '', ''], ['vis', 'Fringe visibility', '', 'hot']]);
    const msg = EM.h('div', { class: 'info-box' }); side.append(msg);

    // ---------- physics
    function lamM() { return st.who === 'photon' ? st.lam * 1e-9 : 1.226e-9 / Math.sqrt(st.V); }
    function visibility() {
      if (kind !== 'observer' || st.N !== 2) return 1;
      if (st.mode === 'det') return 0; if (st.mode === 'weak') return Math.sqrt(Math.max(0, 1 - st.K * st.K)); if (st.mode === 'gas') return Math.exp(-st.gas); if (st.mode === 'eraser') return 0; return 1;
    }
    function pdf(s) { return kind === 'pellets' ? 0 : inten(s, st.a / st.d, st.N, visibility()); }
    const sig = () => Math.sqrt(st.spread * st.spread + st.a * st.a / 12);
    function slitY(i) { return (i - (st.N - 1) / 2) * st.d; }                    // cm (pellets)
    function pelletLanding() { const i = (Math.random() * st.N) | 0, y = slitY(i) + (Math.random() - .5) * st.a + EM.gauss() * st.spread; return { slit: i, y }; }
    function emit(n) {
      for (let k = 0; k < n; k++) {
        let s, slit = -1, subset = 0;
        if (kind === 'pellets') { const p = pelletLanding(); s = p.y / 40 * 6.5 * 1; slit = p.slit; if (Math.abs(s) > 6.5) continue; }
        else if (kind === 'observer' && (st.mode === 'det' || st.mode === 'eraser')) {
          s = sample(sv => inten(sv, st.a / st.d, 2, 0), -SMAX, SMAX, 1); slit = Math.random() < .5 ? 0 : 1;
          if (st.mode === 'eraser') { const pa = (1 + Math.cos(2 * PI * s)) / 2; subset = Math.random() < pa ? 1 : 2; }
        } else s = sample(pdf, -SMAX, SMAX, 1);
        const b = Math.min(NB - 1, Math.max(0, Math.floor((s + SMAX) / (2 * SMAX) * NB)));
        st.bins[b]++; if (subset === 1) st.binsA[b]++; if (subset === 2) st.binsB[b]++; st.total++;
        if (slit >= 0 && kind === 'observer') st.slitHits[slit]++;
        st.dots.push({ s, x: Math.random(), subset }); if (st.dots.length > 6000) st.dots.shift();
        if (n <= 3 || st.rate < 60) st.fly.push({ t: 0, s, slit, subset });
      }
      if (st.fly.length > 40) st.fly.splice(0, st.fly.length - 40);
      upd();
    }
    function upd() {
      ro.set('n', String(st.total));
      if (kind === 'pellets') { ro.set('bumps', String(st.N)); msg.innerHTML = '<h6>What you should see</h6>' + (st.N === 1 ? 'One slit: one bump.' : st.N + ' slits: ' + st.N + ' bumps, one behind each slit, blurred by scatter. Widening the scatter smears them together; shrinking it separates them. Whatever you do, <b>the pattern is just the sum</b> of the single-slit patterns.'); return; }
      const lam = lamM(), fr = lam * 1 / (st.d * 1e-6), V = visibility();
      ro.set('lam', EM.len(lam)); ro.set('fr', EM.len(fr)); ro.set('vis', st.N === 2 ? (V * 100).toFixed(0) + ' %' : (st.N === 1 ? 'n/a' : 'sharp'));
      if (kind === 'quantum') msg.innerHTML = '<h6>One at a time</h6>' + (st.who === 'electron' ? 'Electrons have a wavelength too: $\\lambda=h/p$, here ' + EM.len(lam) + '. ' : '') + (st.N === 1 ? 'A single slit gives a broad central maximum (diffraction). ' : 'With ' + st.N + ' slits the stripes are spaced $\\lambda L/d$ apart and get sharper as N grows. ') + 'Try the <b>+1</b> button repeatedly: each particle lands in one spot that looks random. Only the pile reveals the stripes. <b>Which slit did each one use? The pattern says: <em>both</em>.</b>';
      else msg.innerHTML = { free: '<h6>No which-path information exists</h6>Fringes at full contrast.', det: '<h6>The detector records the slit</h6>Fringes gone: just two broad bumps, like pellets. Slits recorded: left ' + st.slitHits[0] + ', right ' + st.slitHits[1] + '. Nobody has to <em>look</em> at the record: the existence of the record is what matters.', off: '<h6>A detector that doesn’t interact</h6>If the detector is off and gathers no information, nothing marks the path and <b>the fringes come back</b>. It is the information, not the hardware.', weak: '<h6>Partial knowledge</h6>Visibility $V=\\sqrt{1-K^2}$: the more reliably you can guess the slit (K), the weaker the fringes. At $K=1$ they vanish; at $K=0$ they are perfect (Englert’s duality relation $V^2+K^2\\le1$).', gas: '<h6>The environment is an observer too</h6>Each gas molecule the particle brushes against records a little “it went this way”. With more gas, fringes fade even though nobody ever looks. This is <b>decoherence</b>, why quantum effects are hard to see in warm, messy, large things (and why electron-slit experiments need a vacuum).', eraser: '<h6>Quantum eraser</h6>A partner (idler) particle carries the which-path information. The <b>total</b> pattern on the screen shows no fringes. But sort the dots by what you later measure on the idler: one subset (cyan) has fringes, the complementary subset (orange) has anti-fringes. Added together they are flat. The “eraser” does not change any single result, and nothing travels backwards in time: it only reveals hidden correlations.' }[st.mode];
      if (window.renderMath) window.renderMath(msg);
    }
    // ---------- drawing
    const G = (w, h) => ({ sx: w * .05, wx: w * .30, scx: w * .62, hx0: w * .70, hx1: w * .985, cy: h / 2, hs: h * .44 });
    const sy = (s, g) => g.cy - s / (kind === 'pellets' ? 6.5 : SMAX) * g.hs;
    S.draw = (c, w, h) => {
      const g = G(w, h), dark = EM.isDark(), N = st.N, gap = Math.min(46, g.hs * 1.6 / Math.max(2, N));
      const slitPix = i => g.cy + (i - (N - 1) / 2) * gap;
      const who = kind === 'pellets' ? 'pellet' : st.who;
      const dcol = kind === 'pellets' ? EM.col('acc2') : st.who === 'photon' ? 'rgb(' + EM.nm2rgb(st.lam).join(',') + ')' : EM.col('acc');
      // source
      c.fillStyle = EM.col('panel-3'); c.strokeStyle = EM.col('line-2'); c.lineWidth = 2; c.beginPath(); c.roundRect(g.sx - 14, g.cy - 14, 28, 28, 6); c.fill(); c.stroke();
      EM.label(c, kind === 'pellets' ? 'gun' : st.who === 'photon' ? 'lamp / laser' : 'electron gun', g.sx, g.cy + 28, EM.col('muted'), { size: 10, align: 'center', weight: '500' });
      // wave rings (quantum)
      if (kind === 'quantum' && st.wave) {
        c.save(); c.beginPath(); c.rect(g.wx, 0, g.scx - g.wx, h); c.clip(); c.lineWidth = 1;
        for (let i = 0; i < N; i++) for (let k = 0; k < 14; k++) { const r = ((k * 22 - st.t * 40) % 308 + 308) % 308 + 2; c.strokeStyle = EM.alpha(dcol, .22 * (1 - r / 310)); c.beginPath(); c.arc(g.wx, slitPix(i), r, -PI / 2, PI / 2); c.stroke(); }
        c.restore();
      }
      // wall with slits
      c.fillStyle = EM.alpha(EM.col('text-2'), .85); const wt = 10; let y0 = 0;
      for (let i = 0; i < N; i++) { const yy = slitPix(i); c.fillRect(g.wx - wt / 2, y0, wt, yy - 7 - y0); y0 = yy + 7; } c.fillRect(g.wx - wt / 2, y0, wt, h - y0);
      if (kind === 'observer' && (st.mode === 'det' || st.mode === 'weak' || st.mode === 'eraser' || st.mode === 'off')) for (let i = 0; i < 2; i++) { const on = st.mode !== 'off'; c.strokeStyle = on ? EM.col('bad') : EM.col('muted'); c.lineWidth = 2; c.beginPath(); c.roundRect(g.wx - 20, slitPix(i) - 14, 40, 28, 5); c.stroke(); EM.label(c, on ? '👁' : '×', g.wx - 34, slitPix(i), on ? EM.col('bad') : EM.col('muted'), { size: 13, align: 'center' }); }
      EM.label(c, N + (N > 1 ? ' slits' : ' slit') + ' (not to scale)', g.wx, h - 8, EM.col('muted'), { size: 10, align: 'center', weight: '500' });
      // screen with dots
      c.fillStyle = EM.alpha(EM.col('panel-3'), .9); c.fillRect(g.scx, g.cy - g.hs - 6, 22, 2 * g.hs + 12); c.strokeStyle = EM.col('line-2'); c.lineWidth = 1; c.strokeRect(g.scx + .5, g.cy - g.hs - 6 + .5, 22, 2 * g.hs + 12);
      for (const d of st.dots) { c.fillStyle = d.subset === 1 ? EM.col('acc') : d.subset === 2 ? EM.col('acc2') : dcol; c.globalAlpha = .9; c.fillRect(g.scx + 2 + d.x * 17, sy(d.s, g) - 1, 3, 2.2); } c.globalAlpha = 1;
      // flying particles
      for (const f of st.fly) {
        const p = f.t, ly = sy(f.s, g); let x, y;
        if (p < .5) { const q = p / .5, ty = (kind === 'observer' && f.slit >= 0 && (st.mode === 'det' || st.mode === 'eraser')) || kind === 'pellets' ? slitPix(f.slit) : g.cy; x = g.sx + (g.wx - g.sx) * q; y = g.cy + (ty - g.cy) * q; }
        else { const q = (p - .5) / .5, ty = (kind === 'observer' && f.slit >= 0 && (st.mode === 'det' || st.mode === 'eraser')) || kind === 'pellets' ? slitPix(f.slit) : g.cy; x = g.wx + (g.scx - g.wx) * q; y = ty + (ly - ty) * q; }
        c.fillStyle = f.subset === 2 ? EM.col('acc2') : dcol; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill();
        if (p > .5 && p < .6 && kind === 'observer' && f.slit >= 0 && (st.mode === 'det' || st.mode === 'eraser')) { c.strokeStyle = EM.col('bad'); c.lineWidth = 2; c.beginPath(); c.arc(g.wx, slitPix(f.slit), 20 * (p - .5) * 10, 0, 7); c.stroke(); }
      }
      // histogram
      const maxB = Math.max(4, ...st.bins), bh = 2 * g.hs / NB, hw = g.hx1 - g.hx0;
      c.fillStyle = EM.alpha(EM.col('bg'), .0);
      const mk = (arr, col, alpha) => { c.fillStyle = col; c.globalAlpha = alpha; for (let i = 0; i < NB; i++) { const v = arr[i] / maxB * hw; if (v > 0) c.fillRect(g.hx0, g.cy - g.hs + i * bh, v, Math.max(1, bh - .3)); } c.globalAlpha = 1; };
      mk(st.bins, dcol, kind === 'observer' && st.mode === 'eraser' ? .35 : .7);
      if (st.mode === 'eraser') { mk(st.binsA, EM.col('acc'), .9); mk(st.binsB, EM.col('acc2'), .9); }
      c.strokeStyle = EM.col('line-2'); c.lineWidth = 1; c.beginPath(); c.moveTo(g.hx0 + .5, g.cy - g.hs); c.lineTo(g.hx0 + .5, g.cy + g.hs); c.stroke();
      EM.label(c, 'counts', g.hx0, g.cy - g.hs - 12, EM.col('muted'), { size: 10 });
      // theory curve
      if (st.theory && st.total > 0) {
        let Z = 0; const th = []; for (let i = 0; i < NB; i++) { const s = (i + .5) / NB * 2 * SMAX - SMAX; let v;
          if (kind === 'pellets') { const yc = s / 6.5 * 40; v = 0; for (let k = 0; k < st.N; k++) { const mu = slitY(k), sg = sig(); v += Math.exp(-Math.pow(yc - mu, 2) / (2 * sg * sg)); } }
          else v = st.mode === 'det' || st.mode === 'eraser' ? inten(s, st.a / st.d, 2, 0) : pdf(s); th.push(v); Z += v; }
        c.strokeStyle = EM.col('acc3'); c.lineWidth = 2; c.beginPath(); th.forEach((v, i) => { const x = g.hx0 + (v / Z * st.total) / maxB * hw, y = g.cy - g.hs + (i + .5) * bh; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
      }
      // axis labels on screen
      const lam = lamM(), frmm = kind === 'pellets' ? 0 : lam / (st.d * 1e-6) * 1000;
      c.fillStyle = EM.col('muted'); c.font = EM.font(10); c.textAlign = 'right'; c.textBaseline = 'middle';
      for (const s of kind === 'pellets' ? [-40, -20, 0, 20, 40] : [-6, -3, 0, 3, 6]) { const y = sy(kind === 'pellets' ? s / 40 * 6.5 : s, g); c.fillText(kind === 'pellets' ? s + ' cm' : EM.num(s * frmm, 2) + ' mm', g.scx - 4, y); }
      EM.label(c, 'screen', g.scx + 11, g.cy + g.hs + 18, EM.col('muted'), { size: 10, align: 'center', weight: '500' });
    };
    EM.loop(el, (t, dt) => {
      st.t += dt; if (st.run) { st.acc = (st.acc || 0) + st.rate * dt; const n = Math.floor(st.acc); st.acc -= n; if (n) emit(Math.min(n, 400)); }
      for (const f of st.fly) f.t += dt / .4; st.fly = st.fly.filter(f => f.t < 1);
      S.redraw();
    });
    upd();
  }
  EM.register('slit-pellets', el => scene(el, 'pellets'));
  EM.register('slit-quantum', el => scene(el, 'quantum'));
  EM.register('slit-observer', el => scene(el, 'observer'));
})();
