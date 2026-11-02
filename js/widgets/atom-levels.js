/* atom-levels — a photon meets an atom or a solid: absorbed only if its energy matches a jump (or exceeds a gap / the ionisation energy) */
EM.register('atom-levels', function (el) {
  const W = EM.widget(el, { title: 'Will this photon be absorbed? Energy levels decide', badge: 'Try it',
    note: 'Electrons can only sit on certain <b>energy levels</b> (not any energy in between). A photon is absorbed only if it can lift an electron from one allowed level to another: $E_{photon}=E_{upper}-E_{lower}$. Too little energy, or the wrong amount: it passes straight through. Too much: in an atom the electron is torn free (<b>ionisation</b>). Hydrogen: $E_n=-13.6\\ \\text{eV}/n^2$.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .66 });
  const st = { mode: 'H', E: 10.2, tol: .02, photons: [], atom: { n: 1, t: 0, free: null }, hits: { pass: 0, abs: 0 }, auto: false, msg: '' };
  const SOL = { glass: ['Glass (insulator)', 9, 'Large gap (≈ 9 eV): visible light has too little energy to lift an electron across, so glass is transparent. UV-C and above are absorbed.'], si: ['Silicon (semiconductor)', 1.12, 'Small gap (1.12 eV ≈ 1100 nm): visible light is absorbed (silicon looks dark grey, solar cells work), but photons below 1.12 eV (long infrared) pass through.'], metal: ['Metal (no gap)', 0, 'No gap: electrons can absorb any amount of energy, so the wave is absorbed or reflected. Metals are opaque to radio, infrared and light alike.'] };
  const modeSel = EM.select(side, { label: 'Material', options: [['H', 'Hydrogen atom'], ['glass', SOL.glass[0]], ['si', SOL.si[0]], ['metal', SOL.metal[0]]], value: 'H', onChange: v => { st.mode = v; st.photons = []; reset(); upd(); } });
  const es = EM.slider(side, { label: 'Photon energy', min: 1e-6, max: 1e5, log: true, value: 10.2, fmt: v => EM.si(v, 'eV'), onInput: v => { st.E = v; upd(); } });
  const tolS = EM.slider(side, { label: 'Line sharpness (hydrogen): tolerance ±', min: .002, max: .2, log: true, value: .02, fmt: v => (v * 100).toFixed(1) + ' %', onInput: v => { st.tol = v; } });
  const pre = EM.h('div', { class: 'btn-row' }); side.append(pre);
  [['Wi-Fi 2.4 GHz', 9.93e-6], ['Thermal IR 10 µm', 0.124], ['Red 656 nm', 1.89], ['Blue 450 nm', 2.76], ['UV-C 254 nm', 4.88], ['Lyman-α 121.6 nm', 10.2], ['X-ray 10 keV', 1e4]].forEach(([t, e]) => EM.btn(pre, t, () => { st.E = e; es.set(e, true); upd(); }, 'small'));
  const btnRow = EM.h('div', { class: 'btn-row' }); side.append(btnRow);
  EM.btn(btnRow, '➜ Fire a photon', () => fire(), 'primary'); const at = EM.toggle(btnRow, { label: 'auto-fire', checked: false, onChange: v => { st.auto = v; } });
  const ro = EM.readouts(side, [['E', 'Photon energy', '', 'fuel'], ['lam', 'Wavelength', '', 'cool'], ['res', 'Result', '', 'hot'], ['tally', 'Passed / absorbed', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const En = n => -13.6 / (n * n);
  function hLines() { const out = []; for (let m = 2; m <= 7; m++) out.push([1, m, En(m) - En(1)]); return out; }
  function reset() { st.atom = { n: 1, t: 0, free: null }; }
  function decide() {   // returns {fate, ...} for the current photon energy
    const E = st.E;
    if (st.mode === 'H') {
      const a = st.atom; if (a.free || a.t > 0) return { fate: 'busy' };
      if (E >= -En(a.n)) return { fate: 'ion', ke: E - -En(a.n) };
      for (let m = a.n + 1; m <= 8; m++) { const dE = En(m) - En(a.n); if (Math.abs(E - dE) <= st.tol * dE) return { fate: 'abs', m }; }
      return { fate: 'pass' };
    }
    const Eg = SOL[st.mode][1];
    if (st.mode === 'metal') return { fate: 'abs' };
    return E >= Eg ? { fate: 'abs' } : { fate: 'pass' };
  }
  function fire() { st.photons.push({ x: .03, E: st.E, dec: null }); }
  function col(E) { const nm = 1239.84 / E; if (nm >= 380 && nm <= 780) return 'rgb(' + EM.nm2rgb(nm).join(',') + ')'; return nm > 780 ? EM.col('bad') : EM.col('violet'); }
  function upd() {
    const E = st.E, lam = EM.C.h * EM.C.c / (E * EM.C.e); ro.set('E', EM.si(E, 'eV')); ro.set('lam', EM.len(lam));
    const d = decide(); const nm = lam * 1e9;
    ro.set('res', d.fate === 'pass' ? 'passes' : d.fate === 'ion' ? 'ionises!' : d.fate === 'abs' ? (st.mode === 'H' ? 'absorbed → n=' + d.m : 'absorbed') : 'atom busy');
    ro.set('tally', st.hits.pass + ' / ' + st.hits.abs);
    if (st.mode === 'H') info.innerHTML = '<h6>Hydrogen</h6>Allowed jumps from the ground state: ' + hLines().map(l => EM.num(l[2], 4) + ' eV (1→' + l[1] + ')').slice(0, 4).join(', ') + ' … up to 13.6 eV, the <b>ionisation energy</b>. Above that any energy works: the extra becomes kinetic energy of the freed electron (<b>photoelectric effect</b>, Einstein 1905). Try 10.2 eV, then 10.0 eV, then 20 eV.';
    else info.innerHTML = '<h6>' + SOL[st.mode][0] + '</h6>' + SOL[st.mode][2];
  }
  const sx = w => w * .36, ladderX = w => w * .6;
  S.draw = (c, w, h) => {
    const cy = h * .5, ax = sx(w), a = st.atom;
    // beam line
    c.strokeStyle = EM.alpha(EM.col('line-2'), .6); c.setLineDash([3, 5]); c.beginPath(); c.moveTo(10, cy); c.lineTo(w * .54, cy); c.stroke(); c.setLineDash([]);
    EM.label(c, 'photon source', 12, cy + 26, EM.col('muted'), { size: 11, weight: '500' });
    // target icon
    if (st.mode === 'H') {
      for (let n = 1; n <= 3; n++) { c.strokeStyle = EM.alpha(EM.col('acc'), .5); c.lineWidth = 1; c.beginPath(); c.arc(ax, cy, 20 + n * 22, 0, 7); c.stroke(); }
      c.fillStyle = EM.col('bad'); c.beginPath(); c.arc(ax, cy, 9, 0, 7); c.fill(); EM.label(c, 'p⁺', ax, cy, '#fff', { size: 9, align: 'center', weight: '800' });
      if (!a.free) { const nn = a.t > 0 && a.m ? a.m : a.n, r = 20 + Math.min(nn, 3) * 22, ang = performance.now() / 500 * (1 / nn); c.fillStyle = EM.col('acc'); c.beginPath(); c.arc(ax + r * Math.cos(ang), cy + r * Math.sin(ang), 6, 0, 7); c.fill(); EM.label(c, 'electron', ax, cy + 20 + 3 * 22 + 18, EM.col('acc'), { size: 11, align: 'center' }); }
      else { c.fillStyle = EM.col('acc'); const f = a.free; c.beginPath(); c.arc(ax + f.x * 120, cy - f.x * 70 * Math.min(1, f.ke / 10 + .3), 6, 0, 7); c.fill(); EM.label(c, 'free electron, KE = ' + EM.si(f.ke, 'eV'), ax + f.x * 120 + 10, cy - f.x * 70 - 8, EM.col('acc'), { size: 11 }); }
    } else {
      const m = SOL[st.mode]; c.fillStyle = st.mode === 'metal' ? EM.alpha(EM.col('muted'), .9) : st.mode === 'si' ? EM.alpha('#555e69', .95) : EM.alpha(EM.col('acc'), .18); c.strokeStyle = EM.col('line-2'); c.lineWidth = 2;
      c.fillRect(ax - 22, cy - 80, 44, 160); c.strokeRect(ax - 22, cy - 80, 44, 160); EM.label(c, m[0].split(' ')[0], ax, cy - 90, EM.col('text-2'), { size: 12, align: 'center', weight: '700' });
    }
    // energy diagram
    const lx = ladderX(w), lw = w * .36, top = 22, bot = h - 26;
    if (st.mode === 'H') {
      const Y = e => bot - (e + 13.6) / 14.6 * (bot - top);       // -13.6 .. +1
      c.fillStyle = EM.alpha(EM.col('acc2'), .12); c.fillRect(lx, top, lw, Y(0) - top); EM.label(c, 'free electron (ionised)', lx + lw / 2, top + 12, EM.col('acc2'), { size: 11, align: 'center' });
      for (let n = 1; n <= 7; n++) { const y = Y(En(n)); c.strokeStyle = EM.col('text-2'); c.lineWidth = 2; c.beginPath(); c.moveTo(lx, y); c.lineTo(lx + lw * .55, y); c.stroke(); EM.label(c, 'n=' + n + '   ' + EM.fixed(En(n), 2) + ' eV', lx + lw * .58, y, EM.col('muted'), { size: 10, weight: '500' }); }
      c.strokeStyle = EM.alpha(EM.col('acc3'), .8); c.setLineDash([4, 4]); c.beginPath(); c.moveTo(lx, Y(0)); c.lineTo(lx + lw, Y(0)); c.stroke(); c.setLineDash([]);
      const n = a.t > 0 && a.m ? a.m : a.n; const y = a.free ? Y(.5) : Y(En(n));
      if (a.t > 0 && a.m) EM.arrow(c, lx + lw * .25, Y(En(a.n)), lx + lw * .25, Y(En(a.m)) + 6, EM.col('acc3'), 2.5, 9);
      c.fillStyle = EM.col('acc'); c.beginPath(); c.arc(lx + lw * .25, a.free ? Y(.6) : y - 7, 6, 0, 7); c.fill();
      // marker for photon energy relative to ground
      const yph = Y(En(a.n) + st.E); if (yph > top - 6) { c.strokeStyle = col(st.E); c.lineWidth = 2; c.beginPath(); c.moveTo(lx + lw * .04, Y(En(a.n))); c.lineTo(lx + lw * .04, Math.max(top, yph)); c.stroke(); EM.label(c, 'photon', lx + lw * .06, Math.max(top + 8, yph), col(st.E), { size: 10 }); }
    } else {
      const span = 14, yv = bot - 40, Y = e => yv - e / span * (yv - top), bw = lw * .6;
      if (st.mode === 'metal') {
        c.fillStyle = EM.alpha(EM.col('acc'), .4); c.fillRect(lx, yv - 70, bw, bot - yv + 70); c.fillStyle = EM.alpha(EM.col('acc'), .12); c.fillRect(lx, top + 20, bw, yv - 70 - top - 20);
        EM.label(c, 'one partly-filled band', lx + bw / 2, yv - 70, EM.col('text'), { size: 11, align: 'center' });
        EM.label(c, 'electrons can take any small energy step', lx + bw / 2, top + 36, EM.col('text-2'), { size: 10, align: 'center', weight: '500' });
      } else {
        const Eg = SOL[st.mode][1], yc = Y(Eg);
        c.fillStyle = EM.alpha(EM.col('acc'), .4); c.fillRect(lx, yv, bw, bot - yv);
        c.fillStyle = EM.alpha(EM.col('acc3'), .2); c.fillRect(lx, Math.max(top, yc - 40), bw, Math.min(40, yc - top));
        c.fillStyle = EM.alpha(EM.col('warn'), .08); c.fillRect(lx, yc, bw, yv - yc);
        EM.label(c, 'valence band (full of electrons)', lx + bw / 2, yv + 20, EM.col('text'), { size: 10, align: 'center' });
        EM.label(c, 'conduction band (empty)', lx + bw / 2, Math.max(top + 8, yc - 20), EM.col('text'), { size: 10, align: 'center' });
        EM.label(c, 'forbidden gap Eg = ' + Eg + ' eV', lx + bw / 2, (yv + yc) / 2, EM.col('warn'), { size: 11, align: 'center', weight: '700' });
        const phY = Math.max(top, Y(st.E)); c.strokeStyle = col(st.E); c.lineWidth = 2.5; c.beginPath(); c.moveTo(lx + bw + 18, yv); c.lineTo(lx + bw + 18, phY); c.stroke();
        EM.label(c, 'photon ' + EM.si(st.E, 'eV'), lx + bw + 24, Math.max(top + 10, phY), col(st.E), { size: 10 });
        EM.label(c, st.E >= Eg ? 'enough to cross the gap → absorbed' : 'too small to cross → passes', lx + bw + 24, yv - 14, st.E >= Eg ? EM.col('bad') : EM.col('ok'), { size: 10, weight: '700' });
      }
    }
    EM.label(c, 'energy ↑', lx, 12, EM.col('muted'), { size: 11, weight: '600' });
    // photons in flight
    for (const p of st.photons) { const x = p.x * w, y = p.y != null ? cy + p.y : cy, cc = col(p.E); c.strokeStyle = cc; c.lineWidth = 2.4; c.beginPath(); for (let i = 0; i <= 30; i++) { const xx = x - 30 + i; const yy = y + Math.sin(i * .9 + x * .05) * 7 * Math.sin(Math.PI * i / 30); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
    if (st.msg) EM.label(c, st.msg, 12, 16, EM.col('acc3'), { size: 12, weight: '700' });
  };
  let auto = 0;
  EM.loop(el, (t, dt) => {
    if (st.auto) { auto += dt; if (auto > 1.8) { auto = 0; fire(); } }
    const a = st.atom;
    for (const p of st.photons) {
      p.x += dt * .28; const hit = sx(S.W || 1) / (S.W || 1);
      if (!p.dec && p.x >= hit) {
        const d = decide(); p.dec = d.fate;
        if (d.fate === 'pass') st.hits.pass++; else if (d.fate !== 'busy') st.hits.abs++;
        if (d.fate === 'abs') { if (st.mode === 'H') { a.m = d.m; a.t = 1.6; st.msg = 'Absorbed: electron jumps n=' + a.n + ' → ' + d.m; } else st.msg = st.mode === 'metal' ? 'Absorbed / reflected by free electrons' : 'Absorbed: electron lifted across the gap'; p.dead = true; }
        else if (d.fate === 'ion') { a.free = { x: 0, ke: d.ke, t: 2 }; a.t = 0; st.msg = 'IONISED: electron freed with ' + EM.si(d.ke, 'eV') + ' of kinetic energy'; p.dead = true; }
        else if (d.fate === 'pass') st.msg = 'Passes straight through (no allowed jump matches)'; else st.msg = 'Atom is busy (already excited)';
        upd();
      }
    }
    st.photons = st.photons.filter(p => !p.dead && p.x < 1.05 && !p.gone);
    if (a.t > 0) { a.t -= dt; if (a.t <= 0) { a.t = 0; st.photons.push({ x: sx(S.W || 1) / (S.W || 1), E: EM.C.h * 0 + (En(a.m) - En(a.n)), dec: 'out', y: -60 * (Math.random() < .5 ? -1 : 1) }); st.msg = 'The electron falls back and re-emits a photon in a random direction'; a.m = null; } }
    if (a.free) { a.free.x += dt * .5; if (a.free.x > 1.6) { a.free = null; a.n = 1; } }
    for (const p of st.photons) if (p.dec === 'out') p.x += dt * .1;
    S.redraw();
  });
  upd();
});
