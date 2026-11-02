/* link-budget — Friis free-space transmission: Pr = Pt Gt Gr (lambda / 4 pi d)^2, with noise floor and margin */
EM.register('link-budget', function (el) {
  const W = EM.widget(el, { title: 'The link budget: will the signal be heard?', badge: 'Calculate',
    note: 'Friis: $P_r=P_tG_tG_r\\big(\\tfrac{\\lambda}{4\\pi d}\\big)^2$. In dB: $P_r=P_t+G_t+G_r-\\text{FSPL}$ with FSPL $=20\\log_{10}d+20\\log_{10}f-147.55$ (SI units). The receiver’s noise floor is $kTB$, which is $-174\\ \\text{dBm/Hz}+10\\log_{10}B$ at 290 K. Free space only: walls, rain and fading come on top.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .6 });
  const PRE = [
    ['Wi-Fi laptop to router', 2.437e9, .1, 3, 2, 10, 2e7, 4, 'lap'], ['Bluetooth earbuds', 2.44e9, .0025, 0, 0, 1, 1e6, 8, 'bt'], ['GPS satellite → phone', 1.57542e9, 27, 13, 0, 2.02e7, 2e6, 3, 'gps'], ['FM station → car', 9.8e7, 1e5, 6, 0, 5e4, 2e5, 5, 'fm'],
    ['Geostationary TV satellite → dish', 1.2e10, 100, 32, 38, 3.6e7, 3e7, 1.5, 'sat'], ['Cell phone → tower (4G)', 1.8e9, .2, 0, 15, 2e3, 2e7, 4, 'cell'], ['Mars rover → orbiter (UHF)', 4e8, 12, 3, 12, 4e5, 2.56e5, 2, 'rover'], ['Voyager 1 → 70 m DSN dish', 8.4e9, 23, 48, 74, 2.4e13, 160, 20, 'voy'], ['Moon bounce (EME) ham, 144 MHz', 1.44e8, 1500, 16, 16, 7.7e8, 100, 3, 'moon'],
  ];
  const st = { Pt: .1, Gt: 3, Gr: 2, f: 2.4e9, d: 10, B: 2e7, NF: 4 };
  const sel = EM.select(side, { label: 'Real examples', options: [['', 'custom…'], ...PRE.map((p, i) => [i, p[0]])], value: 0, onChange: v => { if (v === '') return; const p = PRE[+v]; Object.assign(st, { f: p[1], Pt: p[2], Gt: p[3], Gr: p[4], d: p[5], B: p[6], NF: p[7] }); sy(); upd(); } });
  const sl = {};
  sl.f = EM.slider(side, { label: 'Frequency', min: 1e6, max: 1e11, log: true, value: st.f, fmt: v => EM.freq(v), onInput: v => { st.f = v; cust(); } });
  sl.Pt = EM.slider(side, { label: 'Transmit power', min: 1e-4, max: 1e6, log: true, value: st.Pt, fmt: v => EM.si(v, 'W'), onInput: v => { st.Pt = v; cust(); } });
  sl.Gt = EM.slider(side, { label: 'Transmit antenna gain', min: 0, max: 80, step: .5, value: st.Gt, unit: 'dBi', onInput: v => { st.Gt = v; cust(); } });
  sl.Gr = EM.slider(side, { label: 'Receive antenna gain', min: 0, max: 80, step: .5, value: st.Gr, unit: 'dBi', onInput: v => { st.Gr = v; cust(); } });
  sl.d = EM.slider(side, { label: 'Distance', min: 1, max: 1e14, log: true, value: st.d, fmt: v => EM.len(v), onInput: v => { st.d = v; cust(); } });
  sl.B = EM.slider(side, { label: 'Receiver bandwidth', min: 1, max: 1e9, log: true, value: st.B, fmt: v => EM.freq(v), onInput: v => { st.B = v; cust(); } });
  const ro = EM.readouts(side, [['fspl', 'Free-space path loss', '', 'hot'], ['pr', 'Received power', '', 'fuel'], ['n', 'Noise floor', '', ''], ['snr', 'Signal-to-noise', '', 'good'], ['eirp', 'EIRP', '', 'cool']]);
  const verdict = EM.h('div', { class: 'info-box' }); side.append(verdict);
  function sy() { sl.f.set(st.f, true); sl.Pt.set(st.Pt, true); sl.Gt.set(st.Gt, true); sl.Gr.set(st.Gr, true); sl.d.set(st.d, true); sl.B.set(st.B, true); }
  function cust() { sel.sel.value = ''; upd(); }
  const fspl = (d, f) => 20 * Math.log10(d) + 20 * Math.log10(f) - 147.55;
  const prdBm = d => 10 * Math.log10(st.Pt * 1000) + st.Gt + st.Gr - fspl(d, st.f);
  const noise = () => -174 + 10 * Math.log10(st.B) + st.NF;
  function upd() {
    const L = fspl(st.d, st.f), pr = prdBm(st.d), n = noise(), snr = pr - n;
    ro.set('fspl', EM.fixed(L, 1), 'dB'); ro.set('pr', EM.fixed(pr, 1), 'dBm'); ro.set('n', EM.fixed(n, 1), 'dBm'); ro.set('snr', EM.fixed(snr, 1), 'dB'); ro.set('eirp', EM.fixed(10 * Math.log10(st.Pt) + st.Gt, 1), 'dBW');
    verdict.innerHTML = '<h6>' + (snr > 20 ? 'Strong link' : snr > 10 ? 'Good link' : snr > 0 ? 'Marginal: you can decode simple signals' : snr > -20 ? 'Below the noise: needs heavy coding / narrow bandwidth (like GPS)' : 'Hopeless without extreme processing') + '</h6>Received power ' + EM.si(Math.pow(10, pr / 10) / 1000, 'W') + ' (' + EM.fixed(pr, 0) + ' dBm). The receiver noise floor is ' + EM.fixed(n, 0) + ' dBm. Doubling distance costs 6 dB; doubling frequency also 6 dB (for fixed-gain antennas); +3 dB of gain is the same as doubling transmit power.';
    S.redraw();
  }
  S.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 70, y: 14, w: w - 90, h: h - 56 }, { xmin: 1, xmax: 1e14, xlog: true, ymin: -260, ymax: 80, xlabel: 'distance (m)', ylabel: 'received power (dBm)', xticks: [1, 1e2, 1e4, 1e6, 1e8, 1e10, 1e12, 1e14], yticks: [-250, -200, -150, -100, -50, 0, 50] });
    P.grid(); P.clip();
    P.fn(d => prdBm(d), EM.col('acc3'), 3, 160); P.hline(noise(), EM.col('bad'), 2, [6, 4]); P.unclip();
    EM.label(c, 'noise floor', P.box.x + 8, P.Y(noise()) - 9, EM.col('bad'), { size: 11, weight: '700' });
    const pr = prdBm(st.d); P.dot(st.d, EM.clamp(pr, -258, 78), EM.col('acc2'), 6);
    for (const [n, d] of [['Moon', 3.84e8], ['Sun', 1.5e11], ['Voyager', 2.4e13]]) { P.vline(d, EM.alpha(EM.col('muted'), .5), 1, [2, 4]); EM.label(c, n, P.X(d) + 3, P.box.y + 12, EM.col('muted'), { size: 10 }); }
  };
  upd();
});
