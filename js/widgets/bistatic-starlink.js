/* bistatic-starlink — passive bistatic radar budget using a LEO satellite downlink as the illuminator (a thought-experiment calculator with public-order-of-magnitude numbers) */
EM.register('bistatic-starlink', function (el) {
  const W = EM.widget(el, { title: 'Could a satellite internet downlink act as a radar? A bistatic budget', badge: 'Calculate',
    note: 'A <b>passive bistatic radar</b> uses a transmitter it does not control (an “illuminator of opportunity”) and a ground receiver that compares the direct signal with the <b>echo</b> from a target. The echo power is $P_r=\\dfrac{\\mathrm{EIRP}\\,G_r\\lambda^2\\sigma_b}{(4\\pi)^3R_t^2R_r^2}$ with $R_t$ satellite→target and $R_r$ target→receiver, and long integration of the wideband signal recovers weak echoes. Order-of-magnitude inputs: Ku-band downlink at 10.7–12.7 GHz, shell altitude ≈ 550 km. Exact EIRP and signal structure are not public in detail: this is a feasibility calculation, not a description of any real system.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 }), B = EM.canvas(main, { aspect: .5 }); B.cv.style.marginTop = '10px';
  const st = { eirp: 38, el: 60, Rr: 5e3, sig: 1, gr: 33, tint: 1, loss: 25, B: 240e6, fs: false, area: 10 };
  const PRE = [['Small drone (0.02 m²) at 3 km', .02, 3e3, 33], ['Person (1 m²) at 1 km', 1, 1e3, 33], ['Small aircraft (2 m²) at 10 km', 2, 1e4, 33], ['Airliner (40 m²) at 30 km', 40, 3e4, 36], ['Stealth fighter, claimed 0.001 m², at 5 km', 1e-3, 5e3, 36]];
  EM.select(side, { label: 'Scenario', options: PRE.map((p, i) => [i, p[0]]), value: 0, onChange: v => { const p = PRE[+v]; st.sig = p[1]; st.Rr = p[2]; st.gr = p[3]; sg.set(st.sig, true); rr.set(st.Rr, true); gr.set(st.gr, true); upd(); } });
  EM.slider(side, { label: 'Satellite EIRP toward the target (order of magnitude)', min: 28, max: 48, step: .5, value: 38, unit: 'dBW', onInput: v => { st.eirp = v; upd(); } });
  EM.slider(side, { label: 'Satellite elevation above the horizon', min: 25, max: 90, step: 1, value: 60, unit: '°', onInput: v => { st.el = v; upd(); } });
  const sg = EM.slider(side, { label: 'Target RCS (bistatic) σ', min: 1e-4, max: 1e2, log: true, value: 1, fmt: v => EM.num(v, 3) + ' m²  (' + EM.fixed(10 * Math.log10(v), 0) + ' dBsm)', onInput: v => { st.sig = v; upd(); } });
  const rr = EM.slider(side, { label: 'Distance receiver → target', min: 200, max: 1e5, log: true, value: 5e3, fmt: v => EM.len(v), onInput: v => { st.Rr = v; upd(); } });
  const gr = EM.slider(side, { label: 'Surveillance antenna gain (pointing at target)', min: 20, max: 45, step: 1, value: 33, unit: 'dBi', onInput: v => { st.gr = v; upd(); } });
  EM.slider(side, { label: 'Coherent integration time', min: .01, max: 10, log: true, value: 1, fmt: v => EM.num(v, 3) + ' s', onInput: v => { st.tint = v; upd(); } });
  EM.slider(side, { label: 'Processing and ambiguity losses (non-ideal signal, Doppler migration…)', min: 5, max: 45, step: 1, value: 25, unit: 'dB', onInput: v => { st.loss = v; upd(); } });
  EM.toggle(side, { label: 'Forward-scatter geometry (target between satellite and receiver): σ = 4πA²/λ²', checked: false, onChange: v => { st.fs = v; upd(); } });
  const ro = EM.readouts(side, [['Rt', 'Satellite → target distance', '', 'cool'], ['pfd', 'Power flux density at the target', '', 'fuel'], ['pr', 'Echo power at the receiver', '', ''], ['gain', 'Integration gain B·T − losses', '', 'good'], ['snr', 'SNR after processing', '', 'hot']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const Re = 6371e3, h0 = 550e3, lam = EM.C.c / 12e9;
  const slant = el => { const e = EM.rad(el); return Math.sqrt(Math.pow(Re + h0, 2) - Math.pow(Re * Math.cos(e), 2)) - Re * Math.sin(e); };
  function calc(Rr, sig) {
    const Rt = slant(st.el); let sb = sig; if (st.fs) sb = 4 * Math.PI * st.area * st.area / (lam * lam);
    const Pt = Math.pow(10, st.eirp / 10), G = Math.pow(10, st.gr / 10), pr = Pt * G * lam * lam * sb / (Math.pow(4 * Math.PI, 3) * Rt * Rt * Rr * Rr);
    const N = EM.C.kB * 290 * st.B * Math.pow(10, 3 / 10), gain = 10 * Math.log10(st.B * st.tint) - st.loss, snr = 10 * Math.log10(pr / N) + gain;
    return { Rt, pr, snr, gain, pfd: 10 * Math.log10(Pt / (4 * Math.PI * Rt * Rt)), sb };
  }
  function upd() {
    const k = calc(st.Rr, st.sig); ro.set('Rt', EM.len(k.Rt)); ro.set('pfd', EM.fixed(k.pfd, 0), 'dBW/m²'); ro.set('pr', EM.fixed(10 * Math.log10(k.pr * 1000), 0), 'dBm'); ro.set('gain', EM.fixed(k.gain, 0), 'dB'); ro.set('snr', EM.fixed(k.snr, 0), 'dB');
    info.innerHTML = '<h6>' + (k.snr > 13 ? 'Detectable on paper' : k.snr > 0 ? 'Marginal' : 'Not detectable') + '</h6>' + (st.fs ? 'In <b>forward scatter</b> the target’s shadow (silhouette area ' + st.area + ' m²) gives a huge cross-section $4\\pi A^2/\\lambda^2$ = ' + EM.fixed(10 * Math.log10(k.sb), 0) + ' dBsm, but only inside a narrow beam of width $\\approx\\lambda/\\sqrt A$ about the line between satellite and receiver, with <b>no range resolution</b> (a “fence” detector). ' : '') + 'Notice how the budget works: the signal power density at the ground is only about ' + EM.fixed(k.pfd, 0) + ' dBW/m² (billions of times below a radar’s), so everything depends on <b>wide bandwidth × long integration</b> (processing gain ' + EM.fixed(k.gain, 0) + ' dB after losses) and on a high-gain receive antenna. Real constraints: the signal is a communications waveform (not a radar waveform), beams switch and hop, many satellites overlap, the direct signal must be cancelled, and aircraft move during long integrations.'; if (window.renderMath) window.renderMath(info); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const R = Re / 12, cx = w / 2, cy = h + R * .78, sc = (h * .9) / (h0 * 1.9 / 1e3), ang = a => a; c.fillStyle = EM.col('bg-2'); c.fillRect(0, 0, w, h);
    c.fillStyle = EM.alpha(EM.col('ok'), .25); c.beginPath(); c.ellipse(cx, h + 20, w * .9, 70, 0, Math.PI, 2 * Math.PI); c.fill(); c.strokeStyle = EM.col('ok'); c.lineWidth = 2; c.beginPath(); c.ellipse(cx, h + 20, w * .9, 70, 0, Math.PI, 2 * Math.PI); c.stroke();
    const rx = w * .22, ry = h - 52, e = EM.rad(st.el), Rt = slant(st.el), len = Math.min(h * .8, 250); const tx = rx + Math.cos(Math.PI - e) * -len * (-1) * 0, satx = rx + Math.cos(e) * len, saty = ry - Math.sin(e) * len;
    // target position near receiver
    const tg = [rx + Math.min(w * .55, Math.max(30, Math.log10(st.Rr / 200) / Math.log10(500) * w * .5 + 30)), ry - 18];
    c.strokeStyle = EM.alpha(EM.col('acc2'), .8); c.lineWidth = 1.5; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(satx, saty); c.lineTo(rx, ry); c.stroke(); c.beginPath(); c.moveTo(satx, saty); c.lineTo(tg[0], tg[1]); c.stroke(); c.setLineDash([]);
    c.strokeStyle = EM.col('acc3'); c.lineWidth = 2; c.beginPath(); c.moveTo(tg[0], tg[1]); c.lineTo(rx, ry); c.stroke();
    c.fillStyle = EM.col('text'); c.fillRect(satx - 9, saty - 4, 18, 8); c.fillRect(satx - 18, saty - 1, 9, 2); c.fillRect(satx + 9, saty - 1, 9, 2); EM.label(c, 'satellite (≈ 550 km)', satx + 12, saty - 12, EM.col('text'), { size: 11 });
    c.fillStyle = EM.col('acc'); c.fillRect(rx - 7, ry - 7, 14, 14); EM.label(c, 'receiver (reference + surveillance channels)', rx, ry + 22, EM.col('acc'), { size: 11, weight: '700' });
    c.fillStyle = EM.col('bad'); c.beginPath(); c.moveTo(tg[0] - 8, tg[1] + 4); c.lineTo(tg[0] + 8, tg[1] + 4); c.lineTo(tg[0], tg[1] - 7); c.closePath(); c.fill(); EM.label(c, 'target', tg[0], tg[1] - 16, EM.col('bad'), { size: 11, align: 'center', weight: '700' });
    EM.label(c, 'dashed: direct signal and signal to the target; yellow: the echo', 10, 16, EM.col('muted'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 200, xmax: 1e5, xlog: true, ymin: -40, ymax: 80, xlabel: 'distance receiver → target', ylabel: 'SNR after processing (dB)', xfmt: v => EM.len(v, 2).replace(' ', ''), yticks: [-40, -20, 0, 20, 40, 60, 80] });
    P.grid(); P.hline(13, EM.alpha(EM.col('ok'), .8), 1.5, [5, 4]); EM.label(c, 'detection threshold (13 dB)', P.box.x + 8, P.Y(13) - 8, EM.col('ok'), { size: 10 });
    P.clip(); for (const [s, col, lab] of [[1e-3, 'bad', '0.001 m²'], [.02, 'acc2', '0.02 m²'], [1, 'acc3', '1 m²'], [40, 'acc', '40 m²']]) { P.fn(r => calc(r, s).snr, EM.alpha(EM.col(col), .8), 1.8, 120); }
    P.fn(r => calc(r, st.sig).snr, EM.col('text'), 3.2, 160); P.unclip(); P.dot(st.Rr, calc(st.Rr, st.sig).snr, EM.col('acc2'), 6);
    EM.label(c, 'curves: 0.001 / 0.02 / 1 / 40 m²; white = your target', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  upd();
});
