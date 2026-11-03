/* signal-through-wall — carrying a wanted signal through a shield wall while the outside interference is blocked or cancelled: bare wire, bonded coax, filtered feedthrough, balanced pair + common-mode choke, below-cutoff tube + fibre */
EM.register('signal-through-wall', function (el) {
  const W = EM.widget(el, { title: 'Sending a signal through the wall of a Faraday cage', badge: 'Design',
    note: 'The outside world dumps interference onto any conductor that leaves the box (a radio-frequency voltage on the cable: broadcast stations, a Wi-Fi router, an EMP). Pick a way to cross the wall and see what arrives inside. Top: the spectrum, before (grey) and after (colour). Bottom: the <b>insertion loss</b> for interference versus frequency. Four tricks: <b>bond</b> the cable shield all round ($Z_t$), <b>filter</b> it (low-pass), <b>cancel</b> it with a balanced pair (the interference is the same on both wires, the receiver subtracts: common-mode rejection) or <b>don’t carry it at all</b>: glass fibre through a tube below cutoff, 32 dB per tube-diameter.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 }), B = EM.canvas(main, { aspect: .36 }); B.cv.style.marginTop = '10px';
  const st = { m: 'balanced', B: 1e7, pig: 2, fc: 1e6, ord: 2, ft: true, imb: .5, L: 200, D: 10, ld: 4, bb: false };
  const METHODS = [['bare', 'Bare wire through a hole'], ['coax', 'Shielded coax, bonded at the wall'], ['filter', 'Low-pass filter in the wall'], ['balanced', 'Balanced pair + common-mode choke'], ['tube', 'Fibre through a below-cutoff tube']];
  EM.select(side, { label: 'Way through the wall', options: METHODS, value: 'balanced', onChange: v => { st.m = v; show(); upd(); } });
  EM.slider(side, { label: 'Bandwidth of the wanted signal', min: 1e4, max: 1e9, log: true, value: 1e7, fmt: v => EM.freq(v), onInput: v => { st.B = v; upd(); } });
  EM.toggle(side, { label: 'Add a broadband impulse (EMP-like)', checked: false, onChange: v => { st.bb = v; upd(); } });
  const g = {}; const grp = k => { g[k] = EM.h('div'); side.append(g[k]); return g[k]; };
  EM.slider(grp('coax'), { label: 'Shield pigtail length (0 = 360° bond)', min: 0, max: 10, step: .5, value: 2, unit: ' cm', onInput: v => { st.pig = v; upd(); } });
  const gf = grp('filter');
  EM.slider(gf, { label: 'Filter cut-off', min: 1e3, max: 1e8, log: true, value: 1e6, fmt: v => EM.freq(v), onInput: v => { st.fc = v; upd(); } });
  EM.seg(gf, [[1, '1 pole'], [2, '2 poles'], [3, '3 poles']], 2, v => { st.ord = +v; upd(); });
  EM.toggle(gf, { label: 'Feedthrough (coaxial) capacitor; off = leaded capacitor', checked: true, onChange: v => { st.ft = v; upd(); } });
  const gb = grp('balanced');
  EM.slider(gb, { label: 'Imbalance of the two wires', min: .01, max: 10, log: true, value: .5, fmt: v => EM.num(v, 2) + ' %', onInput: v => { st.imb = v; upd(); } });
  EM.slider(gb, { label: 'Common-mode choke inductance', min: 1, max: 1e4, log: true, value: 200, fmt: v => EM.num(v, 3) + ' µH', onInput: v => { st.L = v; upd(); } });
  const gt = grp('tube');
  EM.slider(gt, { label: 'Tube diameter', min: 2, max: 100, step: 1, value: 10, unit: ' mm', onInput: v => { st.D = v; upd(); } });
  EM.slider(gt, { label: 'Tube length ÷ diameter', min: .5, max: 10, step: .5, value: 4, fmt: v => v.toFixed(1), onInput: v => { st.ld = v; upd(); } });
  const ro = EM.readouts(side, [['wl', 'Wanted signal loss', '', 'good'], ['wi', 'Strongest interference inside', '', 'hot'], ['sir', 'Wanted ÷ interference inside', '', 'fuel'], ['gain', 'Improvement over a bare wire', '', 'cool']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function show() { for (const k in g) g[k].style.display = (k === st.m) ? '' : 'none'; }
  // outside interference (level on the cable, dBµV into 50 ohm) and the wanted signal
  const INT = [[1e6, 'AM radio', 85], [1e8, 'FM radio', 75], [8e8, 'mobile 4G', 65], [2.45e9, 'Wi-Fi', 55]], LW = 60;
  const bbLevel = f => f < 1e5 ? 60 + 20 * Math.log10(Math.max(f, 1e3) / 1e5) : f < 3e8 ? 70 : 70 - 20 * Math.log10(f / 3e8);
  const dB = x => 20 * Math.log10(Math.max(1e-12, x));
  function ILi(f) { // insertion loss for common-mode interference (dB, >= 0)
    const w = 2 * Math.PI * f;
    switch (st.m) {
      case 'bare': return 0;
      case 'coax': { const Lt = 1e-9 + st.pig * 10e-9; const Zt = Math.hypot(.02, w * Lt); return Math.max(0, Math.min(120, dB(50 / Zt))); }
      case 'filter': { const cap = st.ft ? (f < 2e9 ? 100 : 100 - 20 * Math.log10(f / 2e9)) : (f < 3e7 ? 100 : 100 - 20 * Math.log10(f / 3e7)); return Math.max(0, Math.min(cap, f < st.fc ? 0 : 20 * st.ord * Math.log10(f / st.fc))); }
      case 'balanced': { const imb = st.imb / 100, cm = -dB(imb), fr = 3e7, cmr = f < fr ? cm : Math.max(0, cm - 20 * Math.log10(f / fr)); const L = st.L * 1e-6, fs = 5e7, Z = f < fs ? w * L : w * L / Math.pow(f / fs, 2); return cmr + dB(1 + Z / 150) * .85; }
      case 'tube': { const D = st.D * 1e-3, fc = .586 * EM.C.c / D; if (f >= fc) return 0; return Math.min(200, 32 * st.ld * Math.sqrt(1 - (f / fc) * (f / fc))); }
    }
  }
  function ILw() { // loss of the wanted signal over its own band
    switch (st.m) {
      case 'filter': return st.B <= st.fc ? 3 * 0 + 0.5 : Math.min(60, 20 * st.ord * Math.log10(st.B / st.fc) + 3);
      case 'balanced': return .5 + (st.B > 2e7 ? 20 * Math.log10(st.B / 2e7) * .5 : 0);
      case 'coax': return .3 + st.B / 1e9 * 3;
      default: return 0;
    }
  }
  function metrics() {
    let worst = -1e9, wf = 0, wn = ''; const L = INT.map(([f, n, lv]) => ({ f, n, out: lv, ins: lv - ILi(f) })); L.forEach(l => { if (l.ins > worst) { worst = l.ins; wf = l.f; wn = l.n; } });
    let bbin = -1e9; if (st.bb) { bbin = bbLevel(st.B) + 10 * Math.log10(Math.min(1, st.B / 1e8)) - ILi(st.B); if (bbin > worst) { worst = bbin; wf = st.B; wn = 'impulse (in band)'; } }
    const base = (() => { let wb = -1e9; INT.forEach(([f, n, lv]) => { wb = Math.max(wb, lv); }); if (st.bb) wb = Math.max(wb, bbLevel(st.B) + 10 * Math.log10(Math.min(1, st.B / 1e8))); return wb; })();
    return { L, worst, wf, wn, bbin, base };
  }
  function upd() {
    const m = metrics(), wl = ILw(), sir = LW - wl - m.worst, sir0 = LW - m.base;
    ro.set('wl', EM.fixed(-wl, 1), 'dB'); ro.set('wi', EM.fixed(m.worst, 0) + ' dBµV', m.wn); ro.set('sir', EM.fixed(sir, 0), 'dB'); ro.set('gain', EM.fixed(sir - sir0, 0), 'dB');
    const msg = { bare: 'A bare wire is a long antenna and a pipe: everything outside arrives inside at the same level. The wall is shielded but the cable is not.', coax: 'The coax shield carries the outside interference <em>on its outer surface</em> and the transfer impedance $Z_t$ (resistance plus $j\\omega L_t$) lets a little through to the inner conductor. A pigtail of a few cm adds inductance and ruins it above about 30 MHz: bond the shield <b>360°</b> to the wall with a bulkhead connector.', filter: 'A low-pass filter at the wall removes everything above its cut-off, for any signal: great against FM, Wi-Fi and 4G, <em>useless inside the wanted band</em> and it also kills your signal if the wanted bandwidth exceeds the cut-off. Leaded capacitors stop working at a few tens of MHz (their lead inductance); coaxial feedthrough capacitors reach the GHz range.', balanced: 'Both wires pick up almost the same interference (<b>common mode</b>); the signal is the <em>difference</em> between them. A balanced receiver subtracts, which cancels the common part, to a depth set by how well matched the wires are ($CMRR\\approx-20\\log_{10}$ imbalance). A common-mode choke raises the impedance for the common part only. This is how Ethernet and audio survive a noisy room: it even works for interference inside the signal’s own band.', tube: 'There is no metal path at all: a glass fibre carries light, and it passes through a metal tube too narrow for radio waves (below cutoff, $f_c=0.586c/D$): the tube attenuates $\\approx32\\,L/D$ dB. The price is a transceiver and its power on both sides, and the tube diameter sets the highest frequency it protects against.' }[st.m];
    info.innerHTML = '<h6>' + METHODS.find(x => x[0] === st.m)[1] + '</h6>' + msg + ' <b>Rule of thumb:</b> cross the wall <em>once</em>, at one bonded place, with a cancelling or non-conducting path; filter or choke every other conductor.'; if (window.renderMath) window.renderMath(info);
    A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 1e3, xmax: 1e10, xlog: true, ymin: -20, ymax: 110, yticks: [-20, 0, 20, 40, 60, 80, 100], xlabel: 'frequency', ylabel: 'level on the cable (dBµV)', xfmt: v => EM.freq(v).replace(' ', '') });
    P.grid(); const m = metrics(), wl = ILw(), nf = -174 + 107 + 10 * Math.log10(st.B) + 5;
    P.hline(nf, EM.alpha(EM.col('muted'), .9), 1, [5, 4]); EM.label(c, 'receiver noise floor', P.X(2e3), P.Y(nf) - 7, EM.col('muted'), { size: 9 });
    if (st.bb) { c.fillStyle = EM.alpha(EM.col('muted'), .22); c.beginPath(); c.moveTo(P.X(1e3), P.Y(-20)); for (let e = 3; e <= 10; e += .1) { const f = Math.pow(10, e); c.lineTo(P.X(f), P.Y(Math.min(110, bbLevel(f)))); } c.lineTo(P.X(1e10), P.Y(-20)); c.fill(); c.fillStyle = EM.alpha(EM.col('bad'), .3); c.beginPath(); c.moveTo(P.X(1e3), P.Y(-20)); for (let e = 3; e <= 10; e += .1) { const f = Math.pow(10, e); c.lineTo(P.X(f), P.Y(Math.max(-20, bbLevel(f) - ILi(f)))); } c.lineTo(P.X(1e10), P.Y(-20)); c.fill(); }
    // wanted band outside / inside
    c.fillStyle = EM.alpha(EM.col('ok'), .35); c.fillRect(P.X(1e3), P.Y(LW - wl), P.X(st.B) - P.X(1e3), P.Y(-20) - P.Y(LW - wl)); c.strokeStyle = EM.col('ok'); c.lineWidth = 2; c.strokeRect(P.X(1e3), P.Y(LW - wl), P.X(st.B) - P.X(1e3), P.Y(-20) - P.Y(LW - wl));
    EM.label(c, 'wanted signal', P.X(Math.sqrt(1e3 * st.B)), P.Y(LW - wl) - 8, EM.col('ok'), { size: 10, align: 'center', weight: '700' });
    m.L.forEach(l => { const xo = P.X(l.f); c.strokeStyle = EM.alpha(EM.col('muted'), .8); c.lineWidth = 2; c.beginPath(); c.moveTo(xo - 4, P.Y(-20)); c.lineTo(xo - 4, P.Y(l.out)); c.stroke(); c.fillStyle = EM.col('muted'); c.beginPath(); c.arc(xo - 4, P.Y(l.out), 4, 0, 7); c.fill();
      const v = Math.max(-20, l.ins), bad = l.ins > LW - 20; c.strokeStyle = bad ? EM.col('bad') : EM.col('acc2'); c.lineWidth = 3; c.beginPath(); c.moveTo(xo + 4, P.Y(-20)); c.lineTo(xo + 4, P.Y(v)); c.stroke(); c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(xo + 4, P.Y(v), 4.5, 0, 7); c.fill();
      EM.label(c, l.n, xo, P.box.y + 10 + (l.f === 1e8 ? 12 : 0), EM.col('text-2'), { size: 9.5, align: 'center' }); });
    EM.label(c, 'grey = outside   ·   colour = inside after the wall   ·   red = within 20 dB of the wanted signal', P.box.x + P.box.w - 6, P.box.y + P.box.h - 8, EM.col('muted'), { size: 9, align: 'right' });
  };
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 1e3, xmax: 1e10, xlog: true, ymin: 0, ymax: 140, yticks: [0, 30, 60, 90, 120], xlabel: 'frequency', ylabel: 'interference loss (dB)', xfmt: v => EM.freq(v).replace(' ', '') });
    P.grid(); c.fillStyle = EM.alpha(EM.col('ok'), .18); c.fillRect(P.X(1e3), P.box.y, P.X(st.B) - P.X(1e3), P.box.h);
    P.clip(); P.fn(f => Math.min(140, ILi(f)), EM.col('acc2'), 3.2, 400); P.unclip(); EM.label(c, 'wanted band', P.X(Math.sqrt(1e3 * st.B)), P.box.y + 12, EM.col('ok'), { size: 10, align: 'center', weight: '700' });
    INT.forEach(([f]) => P.vline(f, EM.alpha(EM.col('muted'), .5), 1, [2, 4]));
    if (st.m === 'tube') { const fc = .586 * EM.C.c / (st.D * 1e-3); if (fc > 1e3 && fc < 1e10) { P.vline(fc, EM.col('acc3'), 1.4, [5, 4]); EM.label(c, 'cutoff ' + EM.freq(fc), P.X(fc) - 4, P.box.y + 26, EM.col('acc3'), { size: 10, align: 'right' }); } }
    if (st.m === 'filter' && st.fc > 1e3) { P.vline(st.fc, EM.col('acc3'), 1.4, [5, 4]); EM.label(c, 'cut-off ' + EM.freq(st.fc), P.X(st.fc) + 4, P.box.y + 26, EM.col('acc3'), { size: 10 }); }
  };
  show(); upd();
});
