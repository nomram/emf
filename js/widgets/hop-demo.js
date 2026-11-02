/* hop-demo — frequency hopping vs a fixed channel when part of the band is occupied by interference (resilience concept) */
EM.register('hop-demo', function (el) {
  const W = EM.widget(el, { title: 'Why hop? A fixed channel versus a hopping link', badge: 'Try it',
    note: 'Time runs left to right, frequency upward. Each box is one burst of data. Red cells are channels occupied by <b>interference</b> (a neighbouring radio, a noisy device, or deliberate disturbance). A <b>fixed</b> link sits on one channel: if that channel is bad, the link is gone. A <b>hopping</b> link jumps pseudo-randomly through all channels in a pattern known only to both ends (derived from a shared secret key), so only a fraction of bursts is hit, and <b>error-correcting codes</b> repair those.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const st = { nCh: 40, bad: .25, hops: 100, fec: .5, mode: 'hop', t: 0, seed: 1, hist: [], ok: 0, tot: 0, okF: 0, totF: 0, adapt: false };
  EM.slider(side, { label: 'Number of channels in the band', min: 8, max: 128, step: 1, value: 40, onInput: v => { st.nCh = v; reset(); } });
  EM.slider(side, { label: 'Fraction of channels occupied by interference', min: 0, max: .9, step: .01, value: .25, fmt: v => (v * 100).toFixed(0) + ' %', onInput: v => { st.bad = v; reset(); } });
  EM.slider(side, { label: 'Hop rate', min: 10, max: 1600, log: true, value: 100, fmt: v => Math.round(v) + ' hops/s', onInput: v => { st.hops = v; } });
  EM.slider(side, { label: 'Error-correcting code: fraction of bursts that can be lost', min: 0, max: .6, step: .01, value: .5, fmt: v => (v * 100).toFixed(0) + ' %', onInput: v => { st.fec = v; } });
  EM.toggle(side, { label: 'Adaptive hopping: skip channels known to be bad (like Bluetooth AFH)', checked: false, onChange: v => { st.adapt = v; reset(); } });
  EM.btn(side, '↺ New interference pattern', () => { st.seed++; reset(); }, 'small');
  const ro = EM.readouts(side, [['fx', 'Fixed link: bursts received', '', 'bad'], ['hp', 'Hopping link: bursts received', '', 'good'], ['hq', 'Hopping link with coding: messages delivered', '', 'fuel'], ['gain', 'Spread over', '', 'cool']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  let badSet = [], fixedCh = 0, hopSeq = 0;
  function rng(n) { let s = (st.seed * 7919 + n * 104729) >>> 0; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100003) / 100003; }
  function reset() { badSet = []; const idx = Array.from({ length: st.nCh }, (_, i) => i).sort((a, b) => rng(a + 1) - rng(b + 1)); const nb = Math.round(st.bad * st.nCh); const chosen = new Set(idx.slice(0, nb)); badSet = Array.from({ length: st.nCh }, (_, i) => chosen.has(i)); fixedCh = Math.floor(rng(999) * st.nCh); if (nb > 0) fixedCh = idx[Math.floor(rng(5) * nb)] ; st.hist = []; st.ok = st.tot = st.okF = st.totF = 0; st.win = []; upd(); }
  function upd() { ro.set('gain', st.nCh + ' channels (' + (10 * Math.log10(st.nCh)).toFixed(0) + ' dB spreading)'); info.innerHTML = '<h6>What you see</h6>The fixed link (bottom marker) is stuck on a channel ' + (badSet[fixedCh] ? '<b>that happens to be occupied</b>: zero bursts get through, forever.' : 'that happens to be free; press “new interference pattern” to see what happens if it is not.') + ' The hopping link loses roughly the occupied fraction of bursts (' + (st.bad * 100).toFixed(0) + ' %), a random loss that a code can repair as long as the loss is below the code’s limit; with <b>adaptive</b> hopping it stops using the bad channels at all. Real systems: Bluetooth (1600 hops/s over 79 channels), military tactical radios (tens to hundreds of hops/s), some radars (frequency agility pulse to pulse), LoRa (chirp spreading) and GPS (code spreading, chapter next widget). The weakness: a hop only helps against interference that cannot follow it; fast hop rates, wide hop sets and secret sequences raise the cost of tracking the hops.'; }
  S.draw = (c, w, h) => {
    const L = 54, R = 12, T = 12, B = 46, pw = w - L - R, ph = h - T - B, cols = 60, cw = pw / cols, rh = ph / st.nCh;
    c.fillStyle = EM.col('bg-2'); c.fillRect(L, T, pw, ph);
    for (let i = 0; i < st.nCh; i++) if (badSet[i]) { c.fillStyle = EM.alpha(EM.col('bad'), .3); c.fillRect(L, T + ph - (i + 1) * rh, pw, rh); }
    for (let k = 0; k < st.hist.length; k++) { const hh = st.hist[k], x = L + (k + (cols - st.hist.length)) * cw; c.fillStyle = hh.ok ? EM.col('ok') : EM.col('bad'); c.fillRect(x + 1, T + ph - (hh.ch + 1) * rh + 1, Math.max(2, cw - 2), Math.max(2, rh - 2)); c.fillStyle = hh.fOk ? EM.alpha(EM.col('acc'), .9) : EM.alpha(EM.col('bad'), .9); c.fillRect(x + 1, T + ph + 8, Math.max(2, cw - 2), 12); }
    c.strokeStyle = EM.col('line-2'); c.strokeRect(L + .5, T + .5, pw, ph); EM.label(c, 'frequency →', 6, T + ph / 2, EM.col('muted'), { size: 10 }); EM.label(c, 'hopping link (green = received, red = hit by interference)', L, h - 10, EM.col('muted'), { size: 10, weight: '500' }); EM.label(c, 'fixed link', L + pw, T + ph + 14, EM.col('acc'), { size: 10, align: 'right' });
    c.strokeStyle = EM.alpha(EM.col('acc'), .8); c.setLineDash([4, 4]); const fy = T + ph - (fixedCh + .5) * rh; c.beginPath(); c.moveTo(L, fy); c.lineTo(L + pw, fy); c.stroke(); c.setLineDash([]);
  };
  let acc = 0;
  EM.loop(el, (t, dt) => {
    acc += dt * Math.min(st.hops, 30);                                // visual rate capped
    while (acc >= 1) { acc -= 1; st.t++; const goodList = st.adapt ? badSet.map((b, i) => b ? -1 : i).filter(i => i >= 0) : null; const ch = st.adapt && goodList.length ? goodList[Math.floor(Math.random() * goodList.length)] : Math.floor(Math.random() * st.nCh); const ok = !badSet[ch], fOk = !badSet[fixedCh]; st.hist.push({ ch, ok, fOk }); if (st.hist.length > 60) st.hist.shift(); st.tot++; st.ok += ok ? 1 : 0; st.totF++; st.okF += fOk ? 1 : 0; }
    const p = st.tot ? st.ok / st.tot : 0, pf = st.totF ? st.okF / st.totF : 0;
    ro.set('fx', (pf * 100).toFixed(0), '%'); ro.set('hp', (p * 100).toFixed(0), '%'); ro.set('hq', (1 - p <= st.fec ? 100 : Math.max(0, 100 * (1 - (1 - p - st.fec) * 4))).toFixed(0), '%');
    S.redraw();
  });
  reset();
});
