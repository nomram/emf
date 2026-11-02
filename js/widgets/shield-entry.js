/* shield-entry — how well does the shield survive a cable passing through it? Pigtail vs 360° bond vs solid shield vs fibre */
EM.register('shield-entry', function (el) {
  const W = EM.widget(el, { title: 'Through the wall: what a cable does to a shield', badge: 'Try it',
    note: 'A cable that crosses the wall can carry noise in on its <b>outer</b> surface. For a coax, an outer shield current $I_s$ makes a voltage $V=Z_t I_s$ on the inside conductor, where $Z_t$ is the <b>transfer impedance</b>. Thanks to the <b>skin effect</b> the outside and inside surfaces of a shield are separate at high frequency, <em>if</em> the shield is bonded all the way round at the wall. A pigtail wire adds $\\approx10$ nH per cm, so $Z_t\\approx j\\omega L_p$ rises with frequency and kills the shielding. Curves show shielding effectiveness $SE=20\\log(50\\,\\Omega/|Z_t|)$, capped by the wall.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .62 });
  const cx = EM.cx, st = { wall: 100, req: 60, pig: 5, f: 1e8, on: { bare: true, pig: true, braid: true, rigid: true, filt: false, fibre: true } };
  EM.slider(side, { label: 'Shield (wall) effectiveness', min: 40, max: 140, step: 1, value: 100, unit: 'dB', onInput: v => { st.wall = v; upd(); } });
  EM.slider(side, { label: 'Pigtail length (shield wire to the wall)', min: .3, max: 15, step: .1, value: 5, fmt: v => v.toFixed(1) + ' cm', onInput: v => { st.pig = v; upd(); } });
  EM.slider(side, { label: 'Shielding you need', min: 20, max: 120, step: 1, value: 60, unit: 'dB', onInput: v => { st.req = v; upd(); } });
  EM.slider(side, { label: 'Frequency of interest', min: 1e5, max: 1e10, log: true, value: 1e8, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const names = { bare: 'Bare wire through a hole', pig: 'Coax, shield on a pigtail', braid: 'Coax, braid bonded 360° at the wall', rigid: 'Solid-tube (semi-rigid) coax bonded 360°', filt: 'Wire through a feedthrough filter', fibre: 'Fibre through a below-cutoff tube' };
  const cols = { bare: 'bad', pig: 'warn', braid: 'acc', rigid: 'ok', filt: 'violet', fibre: 'acc3' };
  Object.keys(names).forEach(k => EM.toggle(side, { label: '<span class="sw" style="background:' + EM.col(cols[k]) + '"></span>' + names[k], checked: st.on[k], onChange: v => { st.on[k] = v; S.redraw(); } }));
  const ro = EM.readouts(side, [['v', 'Entries that meet the target here', '', 'hot'], ['best', 'Best option here', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const sinh = z => cx.sc(cx.sub(cx.exp(z), cx.exp(cx.sc(z, -1))), .5);
  function SE(k, f) {
    const w = 2 * Math.PI * f; let v;
    if (k === 'bare') v = 3;
    else if (k === 'pig') { const Zt = Math.hypot(.01, w * (1e-9 + st.pig * 10e-9)); v = 20 * Math.log10(50 / Zt); }
    else if (k === 'braid') { const Zt = Math.hypot(.01, w * .4e-9); v = 20 * Math.log10(50 / Zt); }
    else if (k === 'rigid') { const d = 1 / Math.sqrt(Math.PI * f * EM.C.mu0 * 5.8e7), x = [2e-4 / d, 2e-4 / d]; const Zt = cx.abs(cx.mul([.05, 0], cx.div(x, sinh(x)))); v = 20 * Math.log10(50 / Math.max(Zt, 1e-9)); }
    else if (k === 'filt') { const L = 1e-6, C = 1e-9, esl = .2e-9, cp = 3e-12, Z1 = cx.div([0, w * L], [1 - w * w * L * cp, 0]), Zc = cx.add(cx.add([.02, 0], [0, w * esl]), [0, -1 / (w * C)]), Y = cx.div([1, 0], Zc), A = cx.add([1, 0], cx.mul(Z1, Y)); v = 20 * Math.log10(Math.max(1e-6, cx.abs(cx.add(cx.add(A, cx.sc(Z1, 1 / 50)), cx.add(cx.sc(Y, 50), [1, 0]))) / 2)); }
    else v = 400;
    return Math.max(0, Math.min(st.wall, v));
  }
  function upd() {
    let best = '', bv = -1; for (const k of Object.keys(names)) { const v = SE(k, st.f); if (v > bv) { bv = v; best = names[k]; } }
    const ok = Object.keys(names).filter(k => SE(k, st.f) >= st.req).length;
    ro.set('v', ok + ' of 6 reach ' + st.req + ' dB'); ro.set('best', best + ' (' + EM.fixed(bv, 0) + ' dB)');
    info.innerHTML = '<h6>What the curves say</h6>• <b>Bare wire</b> (red): the cage does nothing for noise riding on the wire. • <b>Pigtail</b> (amber): fine at kHz, useless by about 10–30 MHz: <em>a 5 cm pigtail has more impedance than the whole braid</em>. • <b>360° bond</b> (blue): a proper bulkhead connector with the shield clamped around its full circumference keeps tens of dB to a GHz or so. • <b>Solid copper tube</b> (green): best, because current can’t diffuse through the wall above a few MHz. • <b>Filter</b> (violet): works for a signal line if the band to be passed is low. • <b>Fibre in a below-cutoff tube</b> (yellow): limited only by the wall itself.<br><span class="muted">Typical, illustrative values; a real design is measured with a transfer-impedance or whole-enclosure test.</span>'; S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 1e5, xmax: 1e10, xlog: true, ymin: 0, ymax: 150, xlabel: 'frequency', ylabel: 'shielding effectiveness (dB)', xfmt: v => EM.freq(v).replace(' ', ''), yticks: [0, 40, 80, 120] });
    P.grid(); P.hline(st.req, EM.alpha(EM.col('text'), .7), 1.5, [6, 4]); P.hline(st.wall, EM.alpha(EM.col('muted'), .6), 1, [2, 4]); EM.label(c, 'need ' + st.req + ' dB', P.box.x + 6, P.Y(st.req) - 8, EM.col('text-2'), { size: 10, weight: '600' }); EM.label(c, 'wall alone', P.box.x + P.box.w - 6, P.Y(st.wall) - 8, EM.col('muted'), { size: 10, align: 'right' });
    P.clip(); for (const k of Object.keys(names)) if (st.on[k]) P.fn(f => SE(k, f), EM.col(cols[k]), k === 'fibre' ? 3.2 : 2.6, 260, k === 'fibre' ? [6, 4] : undefined); P.unclip(); P.vline(st.f, EM.col('acc2'), 1.4);
  };
  upd();
});
