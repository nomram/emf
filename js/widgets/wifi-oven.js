/* wifi-oven — a microwave oven's leakage vs Wi-Fi channels in the 2.4 GHz band */
EM.register('wifi-oven', function (el) {
  const W = EM.widget(el, { title: 'The oven next door: leakage versus Wi-Fi channels', badge: 'Try it',
    note: 'Ovens work at 2.45 GHz, in the same licence-free (ISM) band as Wi-Fi and Bluetooth. Their frequency is <b>not exactly fixed</b> (a magnetron drifts over tens of MHz with load and heating), and they <b>pulse at the mains frequency</b>: the magnetron conducts only on one half-cycle of the supply, so the leakage is on for 10 ms and off for 10 ms (50 Hz) and Wi-Fi can use the gaps. The leakage is a tiny fraction of 1 kW, but a Wi-Fi receiver only needs microwatts.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 }), B = EM.canvas(main, { aspect: .25 }); B.cv.style.marginTop = '10px';
  const st = { fc: 2.458e9, bw: 40e6, lvl: -68, rssi: -55, t: 0 };
  EM.slider(side, { label: 'Oven centre frequency (drifts with load)', min: 2.43e9, max: 2.48e9, step: 1e6, value: 2.458e9, fmt: v => EM.freq(v), onInput: v => { st.fc = v; upd(); } });
  EM.slider(side, { label: 'Oven sweep width', min: 5e6, max: 80e6, step: 1e6, value: 40e6, fmt: v => EM.freq(v), onInput: v => { st.bw = v; upd(); } });
  EM.slider(side, { label: 'Oven leakage seen by your router (average)', min: -90, max: -30, step: 1, value: -68, unit: 'dBm', onInput: v => { st.lvl = v; upd(); } });
  EM.slider(side, { label: 'Your Wi-Fi signal strength (RSSI)', min: -85, max: -30, step: 1, value: -55, unit: 'dBm', onInput: v => { st.rssi = v; upd(); } });
  const ro = EM.readouts(side, [['hit', 'Channels degraded while the oven runs', '', 'bad'], ['best', 'Best channel', '', 'good'], ['duty', 'Oven on-time (50 Hz mains)', '10 ms of every 20 ms', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const ch = n => 2412e6 + (n - 1) * 5e6, gauss = (x, mu, s) => Math.exp(-.5 * Math.pow((x - mu) / s, 2));
  function overlap(n) { const lo = ch(n) - 10e6, hi = ch(n) + 10e6; let acc = 0, tot = 0; for (let f = st.fc - 2 * st.bw; f <= st.fc + 2 * st.bw; f += 1e6) { const wgt = gauss(f, st.fc, st.bw / 2.5); tot += wgt; if (f >= lo && f <= hi) acc += wgt; } return acc / tot; }
  const snr = n => { const ov = overlap(n); const iNet = ov > 0 ? st.lvl + 10 * Math.log10(ov) : -120; return st.rssi - Math.max(iNet, -100); };
  function upd() {
    const bad = []; let best = 1, bs = -1e9; for (let n = 1; n <= 13; n++) { const s = snr(n); if (s < 15) bad.push(n); if (s > bs) { bs = s; best = n; } }
    ro.set('hit', bad.length ? bad.join(', ') : 'none'); ro.set('best', 'ch ' + best + ' (SNR ' + EM.fixed(bs, 0) + ' dB)'); ro.set('duty', '≈ 50 %');
    info.innerHTML = '<h6>What to do about it</h6>Channels 1, 6 and 11 (the three that do not overlap) are the usual choices; with the oven centred at ' + EM.freq(st.fc) + ' the worst-hit ones are around channels ' + (bad.length ? bad.slice(0, 4).join(', ') : '—') + '. The 5 GHz band or a wired link avoids the problem altogether. The oven is not <em>illegal</em>: it is allowed to radiate a small amount in the ISM band, as are Wi-Fi and Bluetooth. A properly sealed oven leaks very little (≤ 5 mW/cm² at 5 cm by standard, and typically far less), but a router sees even picowatts.'; A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 54 }, { xmin: 2.4e9, xmax: 2.5e9, ymin: -100, ymax: -20, xlabel: 'frequency (GHz)', ylabel: 'power (dBm)', xticks: [2.4e9, 2.42e9, 2.44e9, 2.46e9, 2.48e9, 2.5e9], xfmt: v => (v / 1e9).toFixed(2), yticks: [-100, -80, -60, -40, -20] });
    P.grid();
    for (let n = 1; n <= 13; n++) { const f1 = ch(n) - 10e6, f2 = ch(n) + 10e6, s = snr(n), col = s < 15 ? EM.col('bad') : EM.col('ok'); c.fillStyle = EM.alpha(col, .12); c.fillRect(P.X(f1), P.Y(st.rssi), P.X(f2) - P.X(f1), P.box.y + P.box.h - P.Y(st.rssi)); c.strokeStyle = EM.alpha(col, .9); c.lineWidth = 1.5; c.beginPath(); c.moveTo(P.X(f1), P.box.y + P.box.h); c.lineTo(P.X(f1 + 2e6), P.Y(st.rssi)); c.lineTo(P.X(f2 - 2e6), P.Y(st.rssi)); c.lineTo(P.X(f2), P.box.y + P.box.h); c.stroke(); EM.label(c, '' + n, P.X(ch(n)), P.Y(st.rssi) - 9, col, { size: 10, align: 'center', weight: '700' }); }
    P.clip(); c.strokeStyle = EM.col('acc3'); c.lineWidth = 3; c.fillStyle = EM.alpha(EM.col('acc3'), .3); c.beginPath(); c.moveTo(P.X(2.4e9), P.Y(-100)); for (let i = 0; i <= 200; i++) { const f = 2.4e9 + 1e8 * i / 200, v = st.lvl + 20 * Math.log10(Math.max(1e-4, gauss(f, st.fc, st.bw / 2.5))); c.lineTo(P.X(f), P.Y(Math.max(-100, v))); } c.lineTo(P.X(2.5e9), P.Y(-100)); c.fill(); c.stroke(); P.unclip();
    EM.label(c, 'Wi-Fi channels (green = OK, red = degraded)', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 11, weight: '600' }); EM.label(c, 'oven leakage', P.X(st.fc) + 8, P.Y(st.lvl) - 12, EM.col('acc3'), { size: 11, weight: '700' });
  };
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 8, w: w - 72, h: h - 32 }, { xmin: 0, xmax: 60, ymin: 0, ymax: 1.3, yticks: [], xlabel: 'time (ms): oven leakage on the mains half-cycles', xticks: [0, 10, 20, 30, 40, 50, 60] });
    P.grid(); c.fillStyle = EM.alpha(EM.col('acc3'), .6); for (let k = 0; k < 3; k++) c.fillRect(P.X(k * 20), P.Y(1), P.X(10) - P.X(0), P.Y(0) - P.Y(1)); c.fillStyle = EM.alpha(EM.col('ok'), .25); for (let k = 0; k < 3; k++) c.fillRect(P.X(k * 20 + 10), P.Y(1), P.X(10) - P.X(0), P.Y(0) - P.Y(1)); EM.label(c, 'oven ON', P.X(5), P.Y(.5), EM.col('bg'), { size: 10, align: 'center', weight: '800' }); EM.label(c, 'quiet gap: Wi-Fi frames can sneak through', P.X(15), P.Y(.5), EM.col('ok'), { size: 10, align: 'center' });
  };
  upd();
});
