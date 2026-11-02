/* fmcw — frequency-modulated continuous-wave radar: chirp, beat frequency, range resolution c/2B, maximum range from the ADC */
EM.register('fmcw', function (el) {
  const W = EM.widget(el, { title: 'FMCW radar: turn distance into a tone', badge: 'Try it',
    note: 'The radar sends a <b>chirp</b>: a frequency that ramps linearly by $B$ over time $T_c$ (slope $S=B/T_c$). The echo is a delayed copy ($\\tau=2R/c$), so at any moment it differs from what is being sent by $f_b=S\\tau=2RS/c$. Mix them and you get a <b>beat tone</b> whose frequency is proportional to range. An FFT of the beat shows a peak per target. Resolution is $c/2B$: <b>wider sweep, finer detail</b>.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 }), B = EM.canvas(main, { aspect: .42 }); B.cv.style.marginTop = '10px';
  const c0 = EM.C.c, st = { Bw: 1e9, Tc: 50e-6, R1: 40, R2: 44, v: 0, fs: 20e6, two: true, f0: 77e9 };
  const PRE = [['Automotive 77 GHz, 4 GHz sweep (fine)', 4e9, 40e-6], ['Automotive, 1 GHz sweep (typical)', 1e9, 50e-6], ['Altimeter/level gauge, 200 MHz', 2e8, 1e-3], ['Wideband imaging 4 GHz in 1 ms', 4e9, 1e-3]];
  EM.select(side, { label: 'Examples', options: [['', 'choose…'], ...PRE.map((p, i) => [i, p[0]])], value: '', onChange: v => { if (v === '') return; const p = PRE[+v]; st.Bw = p[1]; st.Tc = p[2]; bS.set(st.Bw, true); tS.set(st.Tc, true); upd(); } });
  const bS = EM.slider(side, { label: 'Sweep bandwidth B', min: 5e7, max: 4e9, log: true, value: 1e9, fmt: v => EM.freq(v), onInput: v => { st.Bw = v; upd(); } });
  const tS = EM.slider(side, { label: 'Chirp duration T_c', min: 1e-5, max: 2e-3, log: true, value: 5e-5, fmt: v => EM.si(v, 's'), onInput: v => { st.Tc = v; upd(); } });
  EM.slider(side, { label: 'Target 1 range', min: 1, max: 250, step: .5, value: 40, fmt: v => v.toFixed(1) + ' m', onInput: v => { st.R1 = v; upd(); } });
  const r2 = EM.slider(side, { label: 'Target 2 range', min: 1, max: 250, step: .5, value: 44, fmt: v => v.toFixed(1) + ' m', onInput: v => { st.R2 = v; upd(); } });
  EM.slider(side, { label: 'ADC sample rate', min: 2e6, max: 100e6, log: true, value: 2e7, fmt: v => EM.freq(v), onInput: v => { st.fs = v; upd(); } });
  const ro = EM.readouts(side, [['S', 'Chirp slope', '', 'cool'], ['fb1', 'Beat frequency (target 1)', '', 'fuel'], ['res', 'Range resolution c/2B', '', 'hot'], ['rmax', 'Max range (ADC limit)', '', 'good'], ['sep', 'Targets separated?', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const slope = () => st.Bw / st.Tc, fb = R => 2 * R * slope() / c0;
  function upd() {
    const res = c0 / (2 * st.Bw), rmax = c0 * st.fs / (4 * slope()), sep = Math.abs(st.R2 - st.R1) >= res;
    ro.set('S', EM.num(slope() / 1e12, 3), 'MHz/µs'); ro.set('fb1', EM.freq(fb(st.R1))); ro.set('res', EM.len(res)); ro.set('rmax', EM.len(rmax)); ro.set('sep', sep ? 'yes (Δ=' + EM.len(Math.abs(st.R2 - st.R1)) + ' > ' + EM.len(res) + ')' : 'NO: peaks merge');
    info.innerHTML = '<h6>Why FMCW is everywhere</h6>No high-power pulse: a few milliwatts of continuous wave suffice (the receiver listens while sending), the electronics are cheap (the beat is in the kHz–MHz range, so a slow ADC does the job), and bandwidth gives centimetre resolution. Resolution $c/2B$ for $B=4$ GHz is 3.75 cm. The price: transmitter and receiver run at the same time (leakage must be tiny), and range is limited by the ADC: $R_{max}=c\\,f_s/4S$. Adding a Doppler shift moves the beat slightly: sweep several chirps in a row and take a second FFT across chirps to measure speed (a <b>range–Doppler map</b>).';
    if (window.renderMath) window.renderMath(info); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 60, y: 14, w: w - 76, h: h - 52 }, { xmin: 0, xmax: 2.2, ymin: 0, ymax: 1.2, yticks: [], xticks: [], xlabel: 'time → (a few chirps)' });
    P.grid(); const Tn = 1, delay = 2 * st.R1 / c0 / st.Tc, dl2 = 2 * st.R2 / c0 / st.Tc; const saw = (t, d) => { const u = ((t - d) % Tn + Tn) % Tn; return .08 + .95 * u / Tn; };
    const draw = (d, col, w2, dash) => { c.strokeStyle = col; c.lineWidth = w2; if (dash) c.setLineDash(dash); c.beginPath(); let pen = false; for (let i = 0; i <= 880; i++) { const t = i / 400, u = t - d, y = P.Y(saw(t, d)); if (t - d < 0) { pen = false; continue; } if (i > 0 && saw(t, d) < saw((i - 1) / 400, d)) pen = false; pen ? c.lineTo(P.X(t), y) : c.moveTo(P.X(t), y); pen = true; } c.stroke(); c.setLineDash([]); };
    // exaggerate the delay visually so it is visible: 15 % of chirp per 100 m worth
    const vis = d => Math.min(.45, d * 25);
    draw(0, EM.col('acc'), 3); draw(vis(delay), EM.col('acc2'), 2.2); if (st.two) draw(vis(dl2), EM.alpha(EM.col('ok'), .9), 2, [5, 4]);
    EM.label(c, 'transmitted chirp', P.X(.15), P.Y(.75) - 10, EM.col('acc'), { size: 11, weight: '700' }); EM.label(c, 'echo T1 (delayed, delay exaggerated)', P.X(.6), P.Y(.35), EM.col('acc2'), { size: 11 }); if (st.two) EM.label(c, 'echo T2', P.X(1.5), P.Y(.25), EM.col('ok'), { size: 11 });
    const x1 = P.X(1.6); EM.arrow(c, x1, P.Y(saw(1.6, 0)), x1, P.Y(saw(1.6, vis(delay))), EM.col('acc3'), 2, 7); EM.label(c, 'f_b', x1 + 6, (P.Y(saw(1.6, 0)) + P.Y(saw(1.6, vis(delay)))) / 2, EM.col('acc3'), { size: 12, weight: '800' });
    EM.label(c, 'frequency ↑ (B = ' + EM.freq(st.Bw) + ')', 8, 16, EM.col('muted'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const rmaxAx = Math.max(60, st.R1, st.R2) * 1.3, res = c0 / (2 * st.Bw), P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 52 }, { xmin: 0, xmax: rmaxAx, ymin: 0, ymax: 1.15, yticks: [], xlabel: 'range (beat-frequency axis)', xfmt: v => v + ' m' });
    P.grid(); const rm = c0 * st.fs / (4 * slope());
    const spec = r => { let s = 0.02 + .01 * EM.rand(); const pk = (R, a) => { const x = (r - R) / res; return a * Math.pow(Math.abs(EM.sinc(Math.PI * x)), 2); }; s += pk(st.R1, 1) + (st.two ? pk(st.R2, .75) : 0); return s; };
    const xs = [], ys = []; for (let i = 0; i <= 600; i++) { const r = rmaxAx * i / 600; xs.push(r); ys.push(Math.min(1.1, spec(r))); }
    P.line(xs, ys, EM.col('ok'), 2.4);
    if (rm < rmaxAx) { P.vline(rm, EM.col('bad'), 2, [5, 4]); EM.label(c, 'ADC limit ' + EM.len(rm), P.X(rm) - 6, P.box.y + 14, EM.col('bad'), { size: 11, align: 'right', weight: '700' }); }
    EM.label(c, 'FFT of the beat signal: one peak per target; width ∝ resolution c/2B = ' + EM.len(res), P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 11, weight: '500' });
  };
  upd();
});
