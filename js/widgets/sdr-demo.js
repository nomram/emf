/* sdr-demo — what a software-defined radio sees: spectrum + waterfall, centre frequency, sample rate, aliasing, tuned signal IQ */
EM.register('sdr-demo', function (el) {
  const W = EM.widget(el, { title: 'A software-defined radio in your browser', badge: 'Try it',
    note: 'An SDR digitises a <b>slice of spectrum</b> as wide as its sample rate $f_s$ (complex I/Q samples cover $\\pm f_s/2$ around the centre frequency) and does all tuning, filtering and demodulation in software. Click the spectrum to tune. Switch <b>off the anti-alias filter</b> and watch signals from outside the window <em>fold in</em> at the wrong frequency.' });
  const h = EM.h;
  const BANDS = {
    fm: { n: 'FM broadcast 88–108 MHz', lo: 87.5e6, hi: 108.5e6, fc: 98e6, st: (() => { const a = []; EM.rand(7); for (let f = 88.1; f < 108; f += .4) if (EM.rand() > .35) a.push([f * 1e6, -62 + EM.rand() * 38, 'FM', f.toFixed(1) + ' MHz station', 180e3]); return a; })() },
    air: { n: 'Air band 118–137 MHz (AM voice)', lo: 117e6, hi: 138e6, fc: 127e6, st: [[118.1e6, -50, 'AM', 'ATIS', 10e3], [119.7e6, -70, 'AM', 'tower', 10e3], [121.5e6, -60, 'AM', 'emergency 121.5', 10e3], [123.45e6, -75, 'AM', 'air-to-air', 10e3], [124.35e6, -65, 'AM', 'approach', 10e3], [126.7e6, -58, 'AM', 'ground', 10e3], [128.8e6, -72, 'AM', 'ATC', 10e3], [131.55e6, -64, 'AM', 'ACARS (data)', 12e3], [132.6e6, -55, 'AM', 'centre', 10e3], [134.2e6, -77, 'AM', 'approach', 10e3], [136.9e6, -66, 'AM', 'ACARS', 12e3]] },
    ham: { n: 'Ham 40 m band 7.0–7.3 MHz', lo: 6.9e6, hi: 7.4e6, fc: 7.1e6, st: [[7.012e6, -52, 'CW', 'CW call (Morse)', 300], [7.025e6, -66, 'CW', 'CW QSO', 300], [7.032e6, -58, 'CW', 'CW', 300], [7.048e6, -70, 'DIG', 'FT8 / digital', 50], [7.074e6, -50, 'DIG', 'FT8 cluster', 3000], [7.15e6, -60, 'SSB', 'SSB voice', 2700], [7.185e6, -48, 'SSB', 'SSB net', 2700], [7.2e6, -63, 'SSB', 'SSB', 2700], [7.225e6, -72, 'SSB', 'SSB', 2700], [7.255e6, -55, 'SSB', 'SSB', 2700], [7.3e6, -45, 'AM', 'shortwave broadcaster', 10e3]] },
    wifi: { n: '2.4 GHz band (Wi-Fi, Bluetooth, microwave oven)', lo: 2.39e9, hi: 2.5e9, fc: 2.44e9, st: [[2.412e9, -50, 'WIFI', 'Wi-Fi ch 1', 20e6], [2.437e9, -45, 'WIFI', 'Wi-Fi ch 6', 20e6], [2.462e9, -60, 'WIFI', 'Wi-Fi ch 11', 20e6], [2.45e9, -75, 'OVEN', 'microwave oven (leak!)', 40e6], [2.426e9, -78, 'BT', 'Bluetooth hop', 1e6], [2.458e9, -76, 'BT', 'Bluetooth hop', 1e6], [2.48e9, -80, 'BT', 'Bluetooth hop', 1e6]] },
  };
  const st = { band: 'fm', fc: 98e6, fs: 2.4e6, aa: true, gain: 20, tune: 98.4e6, wf: [], t: 0 };
  const S = EM.canvas(W.body, { aspect: .6, minH: 330, cursor: 'crosshair' });
  const ctl = h('div', { class: 'wgrid even', style: { marginTop: '12px' } }); W.body.append(ctl);
  const L = h('div', { class: 'ctls' }), R = h('div', { class: 'ctls' }); ctl.append(L, R);
  const bandSel = EM.select(L, { label: 'What to listen to', options: Object.entries(BANDS).map(([k, v]) => [k, v.n]), value: 'fm', onChange: v => { st.band = v; const b = BANDS[v]; st.fc = b.fc; st.tune = b.fc; fcS.set(st.fc, true); setFcRange(); st.wf = []; upd(); } });
  const fcS = EM.slider(L, { label: 'Centre frequency (LO)', min: 87e6, max: 109e6, step: 1e4, value: 98e6, fmt: v => EM.freq(v), onInput: v => { st.fc = v; upd(); } });
  const fsS = EM.select(L, { label: 'Sample rate (bandwidth of the window)', options: [[.25e6, '250 kS/s (≈ 250 kHz window)'], [1e6, '1 MS/s'], [2.4e6, '2.4 MS/s (RTL-SDR)'], [10e6, '10 MS/s'], [20e6, '20 MS/s (HackRF)'], [61.44e6, '61.44 MS/s (PlutoSDR)']], value: 2.4e6, onChange: v => { st.fs = +v; st.wf = []; upd(); } });
  EM.toggle(L, { label: 'Analog anti-alias filter in front of the ADC', checked: true, onChange: v => { st.aa = v; st.wf = []; upd(); } });
  EM.slider(L, { label: 'Receiver gain', min: 0, max: 50, step: 1, value: 20, unit: 'dB', onInput: v => { st.gain = v; } });
  const ro = EM.readouts(R, [['win', 'Window (±fs/2)', '', 'cool'], ['tune', 'Tuned to', '', 'fuel'], ['mode', 'Detected', '', 'hot'], ['res', 'Frequency resolution (1024-pt FFT)', '', ''], ['bits', 'Dynamic range (8-bit ADC)', '', '']]);
  const iq = EM.canvas(R, { aspect: .5 }); const note = h('div', { class: 'info-box' }); R.append(note);
  function setFcRange() { const b = BANDS[st.band], inp = fcS.input; /* re-create slider range by overriding min/max */ inp.min = b.lo; inp.max = b.hi; inp.step = Math.max(1, (b.hi - b.lo) / 4000); fcS.set(st.fc, true); }
  const win = () => [st.fc - st.fs / 2, st.fc + st.fs / 2];
  function stations() { return BANDS[st.band].st; }
  function alias(f) { const d = f - st.fc, k = ((d + st.fs / 2) % st.fs + st.fs) % st.fs - st.fs / 2; return st.fc + k; }
  function psd(f) {    // power in dB at frequency f (what the display shows)
    let p = Math.pow(10, (-96 + st.gain - 20) / 10);               // noise floor in mW; gain shifts everything
    for (const [sf, lev, type, , bw] of stations()) {
      const inWin = Math.abs(sf - st.fc) <= st.fs / 2, fa = alias(sf), isAlias = !inWin;
      if (isAlias && st.aa) { /* attenuated 55 dB by the filter */ }
      const att = isAlias ? (st.aa ? 55 : 0) : 0; if (isAlias && Math.abs(sf - st.fc) > st.fs * 2.2 && st.aa === false) { /* keep wide aliasing: signals far outside also fold */ }
      const x = f - fa, w2 = bw / 2; let s = 0;
      if (type === 'AM') s = Math.exp(-Math.pow(x / (w2 * .35 + 1), 2)) + .12 * Math.exp(-Math.pow((Math.abs(x) - 5e3) / 3e3, 2));
      else if (type === 'CW') s = Math.exp(-Math.pow(x / (w2 + 25), 2));
      else if (type === 'FM') s = Math.abs(x) < w2 ? (.35 + .65 * Math.abs(Math.sin(x / 30e3))) : Math.exp(-Math.pow((Math.abs(x) - w2) / 15e3, 2)) * .35;
      else if (type === 'SSB' || type === 'DIG') s = x > -200 && x < bw ? .75 : 0;
      else if (type === 'OVEN') s = Math.exp(-Math.pow(x / (w2 * .6), 2));
      else s = Math.abs(x) < w2 ? 1 : Math.exp(-Math.pow((Math.abs(x) - w2) / (w2 * .1 + 1e3), 2));
      const lvl = Math.pow(10, (lev - att + st.gain - 20) / 10); p += s * lvl;
    }
    return 10 * Math.log10(p);
  }
  const N = 400;
  function row() { const out = new Float32Array(N); const [lo, hi] = win(); for (let i = 0; i < N; i++) { const f = lo + (hi - lo) * i / (N - 1); out[i] = psd(f) + (Math.random() - .5) * 5 * (1 + (st.gain < 8 ? .3 : 0)); } return out; }
  function upd() {
    const [lo, hi] = win(); ro.set('win', EM.freq(lo) + ' to ' + EM.freq(hi)); ro.set('tune', EM.freq(st.tune)); ro.set('res', EM.freq(st.fs / 1024)); ro.set('bits', '≈ 48 dB');
    let best = null, bd = 1e12; for (const s of stations()) { if (st.aa && Math.abs(s[0] - st.fc) > st.fs / 2) continue; const d = Math.abs(alias(s[0]) - st.tune); if (d < Math.max(s[4], 5e3) * .8 && d < bd) { bd = d; best = s; } }
    ro.set('mode', best ? best[2] + ' · ' + best[3] + (Math.abs(best[0] - st.fc) > st.fs / 2 ? ' (ALIAS!)' : '') : 'noise only');
    note.innerHTML = '<h6>What the SDR does with it</h6>Antenna → LNA → <b>mixer</b> (LO at ' + EM.freq(st.fc) + ') → low-pass filter → <b>ADC</b> at ' + EM.freq(st.fs) + ' samples/s → USB → software FFT (this plot), digital down-conversion to the tuned signal, demodulation, audio. Dropping the anti-alias filter lets signals beyond ±' + EM.freq(st.fs / 2) + ' fold back into the window. Real SDRs: <b>RTL-SDR</b> (≈ $30, 24–1766 MHz, 2.4 MS/s, 8 bit), <b>HackRF</b> (1 MHz–6 GHz, 20 MS/s, transmits), <b>PlutoSDR</b> (325 MHz–3.8 GHz, 61 MS/s, 12 bit), <b>SDRplay</b> (1 kHz–2 GHz, 14 bit); software: SDR#, GQRX, SDR++, GNU Radio.'; iq.redraw(); S.redraw();
  }
  S.draw = (c, w, hh) => {
    const sp = hh * .42, wf = hh - sp - 30; const P = EM.plot(c, { x: 54, y: 10, w: w - 70, h: sp - 24 }, { xmin: win()[0], xmax: win()[1], ymin: -100, ymax: -20, xlabel: '', ylabel: 'dB', yticks: [-100, -80, -60, -40, -20], xticks: [], xfmt: v => EM.freq(v) });
    P.grid(); const r = st.wf.length ? st.wf[st.wf.length - 1] : row(), [lo, hi] = win();
    c.save(); c.beginPath(); c.rect(P.box.x, P.box.y, P.box.w, P.box.h); c.clip(); const grd = c.createLinearGradient(0, P.box.y, 0, P.box.y + P.box.h); grd.addColorStop(0, EM.alpha(EM.col('acc3'), .5)); grd.addColorStop(1, EM.alpha(EM.col('acc3'), 0)); c.fillStyle = grd; c.strokeStyle = EM.col('acc3'); c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i < N; i++) { const x = P.box.x + P.box.w * i / (N - 1), y = P.Y(EM.clamp(r[i], -100, -20)); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.lineTo(P.box.x + P.box.w, P.box.y + P.box.h); c.lineTo(P.box.x, P.box.y + P.box.h); c.closePath(); c.fill(); c.restore();
    // frequency labels
    c.fillStyle = EM.col('muted'); c.font = EM.font(10); c.textBaseline = 'top'; for (let k = 0; k <= 4; k++) { c.textAlign = k === 0 ? 'left' : k === 4 ? 'right' : 'center'; c.fillText(EM.freq(lo + (hi - lo) * k / 4), P.box.x + P.box.w * k / 4, sp - 12); }
    // tuning marker
    const tx = P.box.x + (st.tune - lo) / (hi - lo) * P.box.w; if (tx >= P.box.x && tx <= P.box.x + P.box.w) { c.strokeStyle = EM.col('bad'); c.lineWidth = 2; c.beginPath(); c.moveTo(tx, P.box.y); c.lineTo(tx, P.box.y + wf + sp); c.stroke(); }
    // station labels for in-window ones
    c.font = EM.font(9, '600'); c.textAlign = 'center'; for (const s of stations()) { const fa = alias(s[0]), x = P.box.x + (fa - lo) / (hi - lo) * P.box.w; if (x < P.box.x || x > P.box.x + P.box.w) continue; const alias_ = Math.abs(s[0] - st.fc) > st.fs / 2; if (alias_ && st.aa) continue; if (hi - lo < 4e6 || stations().length < 14 || EM.rand() > 2) { c.fillStyle = alias_ ? EM.col('bad') : EM.col('text-2'); c.save(); c.translate(x, P.Y(EM.clamp(s[1] + st.gain - 20 + 30, -95, -25)) - 4); c.rotate(-.9); c.textAlign = 'left'; c.fillText((alias_ ? 'ALIAS ' : '') + s[3], 0, 0); c.restore(); } }
    // waterfall
    const wy = sp + 4, rows = st.wf.length, rh = wf / 90; c.fillStyle = EM.col('bg-2'); c.fillRect(P.box.x, wy, P.box.w, wf - 4);
    for (let j = 0; j < rows; j++) { const rr = st.wf[rows - 1 - j]; for (let i = 0; i < N; i += 2) { const v = EM.clamp((rr[i] + 100) / 70, 0, 1), col = EM.heat(v); c.fillStyle = 'rgb(' + col.map(Math.round).join(',') + ')'; c.fillRect(P.box.x + P.box.w * i / N, wy + j * rh, P.box.w / N * 2 + 1, rh + .5); } }
    EM.label(c, 'waterfall (time ↓)', P.box.x + 6, wy + 10, EM.col('muted'), { size: 10, weight: '500' });
  };
  S.pointer({ down: (p) => tune(p), move: (p, e, d) => { if (d) tune(p); } });
  function tune(p) { const [lo, hi] = win(), x0 = 54, wd = S.W - 70; st.tune = EM.clamp(lo + (p.x - x0) / wd * (hi - lo), lo, hi); upd(); }
  iq.draw = (c, w, hh) => {   // I/Q view of the tuned signal (illustrative)
    let best = null, bd = 1e12; for (const s of stations()) { if (st.aa && Math.abs(s[0] - st.fc) > st.fs / 2) continue; const d = Math.abs(alias(s[0]) - st.tune); if (d < Math.max(s[4], 5e3) * .8 && d < bd) { bd = d; best = s; } }
    const cx = w / 2, cy = hh / 2, R_ = Math.min(w, hh) * .4; c.strokeStyle = EM.col('line'); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R_, 0, 7); c.moveTo(cx - R_, cy); c.lineTo(cx + R_, cy); c.moveTo(cx, cy - R_); c.lineTo(cx, cy + R_); c.stroke();
    EM.label(c, 'I', cx + R_ + 3, cy, EM.col('muted'), { size: 10 }); EM.label(c, 'Q', cx, cy - R_ - 6, EM.col('muted'), { size: 10, align: 'center' });
    const type = best ? best[2] : 'NOISE'; c.strokeStyle = EM.col('acc'); c.lineWidth = 1.6; c.beginPath(); const T = st.t;
    for (let i = 0; i < 220; i++) { const t = T - i * .004; let a = 1, ph = 0, ii, q;
      if (type === 'AM') { a = .6 + .4 * Math.sin(t * 6); ph = t * 2; } else if (type === 'FM') { a = 1; ph = t * 2 + 3 * Math.sin(t * 4); } else if (type === 'CW') { a = Math.sin(t * 3) > 0 ? 1 : .05; ph = t * 2; } else if (type === 'SSB') { a = .3 + .5 * Math.abs(Math.sin(t * 7) * Math.sin(t * 2.3)); ph = t * 5; } else if (type === 'NOISE') { a = .15 + .1 * EM.rand(); ph = EM.rand() * 6.28; } else { a = 1; ph = t * 3 + Math.floor(t * 4) * 1.57; }
      ii = cx + R_ * a * Math.cos(ph), q = cy - R_ * a * Math.sin(ph); i ? c.lineTo(ii, q) : c.moveTo(ii, q); } c.stroke();
    EM.label(c, 'I/Q of the tuned signal: ' + ({ AM: 'AM: radius breathes', FM: 'FM: phase wobbles', CW: 'Morse: on/off', SSB: 'SSB: both change', NOISE: 'noise: random dots', WIFI: 'Wi-Fi: phase steps (OFDM/PSK)', DIG: 'digital: phase steps', OVEN: 'oven noise', BT: 'Bluetooth' }[type] || ''), 8, 12, EM.col('text-2'), { size: 10, weight: '600' });
  };
  EM.loop(el, (t, dt) => { st.t = t; if ((st.skip = (st.skip || 0) + 1) % 3 === 0) { st.wf.push(row()); if (st.wf.length > 90) st.wf.shift(); } S.redraw(); iq.redraw(); });
  setFcRange(); upd();
});
