/* the-thing — a passive cavity microphone (the 1945 "Great Seal bug"): sound moves a diaphragm, that detunes a resonator, which modulates the echo of an illuminating radio beam */
EM.register('the-thing', function (el) {
  const W = EM.widget(el, { title: 'The Thing: a microphone with no battery', badge: 'Try it',
    note: 'A resonant cavity re-radiates an illuminating signal. Its resonance is a Lorentzian: in units of half-bandwidths $\\Delta=2Q(f-f_0)/f_0$ the echo has amplitude $|a|=1/\\sqrt{1+\\Delta^2}$ and phase $-\\arctan\\Delta$. Sound pushes the diaphragm, which changes the gap capacitance, so $f_0$ moves by $\\Delta f/f_0\\approx-\\Delta C/2C$ and the whole curve slides sideways. The fixed illuminating frequency sits on the <b>slope</b> of the curve, so the echo is amplitude- and phase-modulated by the sound. A listener demodulates it. Tune the operating point and see which demodulator gives a clean copy.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .42 }), B = EM.canvas(main, { aspect: .62 }); B.cv.style.marginTop = '10px';
  const st = { Q: 150, off: 0.8, amp: 0.6, fa: 500, r: 10, erp: 1000, t: 0 };
  const F0 = 330e6; // the frequency usually reported for the original; treat as an illustration
  EM.slider(side, { label: 'Quality factor Q of the cavity', min: 20, max: 1000, log: true, value: 150, fmt: v => EM.num(v, 3), onInput: v => { st.Q = v; upd(); } });
  EM.slider(side, { label: 'Illuminator offset from resonance', min: -3, max: 3, step: .05, value: .8, fmt: v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' half-bandwidths', onInput: v => { st.off = v; upd(); } });
  EM.slider(side, { label: 'Diaphragm swing (loudness)', min: .05, max: 2, step: .05, value: .6, fmt: v => v.toFixed(2) + ' half-bandwidths', onInput: v => { st.amp = v; upd(); } });
  EM.slider(side, { label: 'Sound frequency', min: 200, max: 3000, log: true, value: 500, fmt: v => EM.num(v, 3) + ' Hz', onInput: v => { st.fa = v; upd(); } });
  EM.slider(side, { label: 'Distance to the listening receiver', min: 1, max: 1000, log: true, value: 10, fmt: v => EM.len(v), onInput: v => { st.r = v; upd(); } });
  EM.slider(side, { label: 'Illuminator power (ERP)', min: 10, max: 1e4, log: true, value: 1000, fmt: v => EM.si(v, 'W'), onInput: v => { st.erp = v; upd(); } });
  const ro = EM.readouts(side, [['bw', 'Resonance width', '', 'cool'], ['df', 'Peak frequency shift', '', 'fuel'], ['am', 'AM output: distortion', '', 'hot'], ['pm', 'Phase output: distortion', '', 'good'], ['echo', 'Echo power at the receiver', '', 'cool'], ['dyn', 'Illuminator is stronger than the echo by', '', 'bad']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const N = 512, K = 3; // samples, cycles shown
  let dt_ = [], am = [], ph = [], inp = [];
  const echo = d => 1 / Math.hypot(1, d), phase = d => -Math.atan(d);
  function harmonics(arr) { // amplitude of fundamental and harmonics 2..4 over K cycles
    const out = []; for (let k = 1; k <= 4; k++) { let re = 0, im = 0; for (let i = 0; i < N; i++) { re += arr[i] * Math.cos(2 * Math.PI * k * K * i / N); im += arr[i] * Math.sin(2 * Math.PI * k * K * i / N); } out.push(2 * Math.hypot(re, im) / N); } return out;
  }
  const thd = a => { const f = a[0] || 1e-12; return Math.sqrt(a[1] * a[1] + a[2] * a[2] + a[3] * a[3]) / f; };
  function gen() {
    inp = []; am = []; ph = [];
    for (let i = 0; i < N; i++) { const x = Math.sin(2 * Math.PI * K * i / N), d = st.off + st.amp * x; inp.push(x); am.push(echo(d)); ph.push(phase(d)); }
  }
  function upd() {
    gen();
    const hA = harmonics(am), hP = harmonics(ph), bw = F0 / st.Q;
    ro.set('bw', EM.freq(bw)); ro.set('df', '±' + EM.freq(st.amp * bw / 2)); ro.set('am', (thd(hA) * 100).toFixed(0) + ' %' + (hA[0] < 1e-3 ? ' (no signal)' : '')); ro.set('pm', (thd(hP) * 100).toFixed(0) + ' %');
    // backscatter budget: sigma = lambda^2 G^2 / 4pi, modulation index from the fundamental
    const lam = EM.C.c / F0, G = 1.6, sig = lam * lam * G * G / (4 * Math.PI), Gr = 10, Pt = st.erp;
    const Pc = Pt * Gr * lam * lam * sig * echo(st.off) ** 2 / (Math.pow(4 * Math.PI, 3) * Math.pow(st.r, 4));
    const direct = Pt * Gr * lam * lam / Math.pow(4 * Math.PI * st.r, 2);
    ro.set('echo', EM.si(Pc, 'W')); ro.set('dyn', EM.fixed(10 * Math.log10(direct / Pc), 0) + ' dB');
    info.innerHTML = '<h6>' + (Math.abs(st.off) < .15 ? 'On the peak: the amplitude doubles the pitch' : Math.abs(st.off) > 2 ? 'Far off resonance: almost no echo to modulate' : 'On the slope: a usable copy of the sound') + '</h6>On the resonance peak the echo amplitude is flat, so small swings of the curve change it only at <em>twice</em> the sound frequency (distorted), while the <em>phase</em> is steepest there and gives a clean copy. Off to one side, the amplitude has a linear slope. A <b>high Q</b> gives a steep slope and a stronger audio signal, but a narrow resonance that a large swing sweeps right across (distortion). The original bug is reported to have been illuminated near 300–330 MHz; the numbers here are order-of-magnitude. The last readout is the real difficulty: the listener must pull a faint echo out from beside a beam that is a hundred or more dB stronger, as in the passive radar of chapter 15c.'; if (window.renderMath) window.renderMath(info);
    A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 56, y: 14, w: w - 72, h: h - 46 }, { xmin: -6, xmax: 6, ymin: 0, ymax: 1.1, xlabel: 'illuminator frequency relative to the resting resonance (half-bandwidths)', ylabel: 'echo amplitude', yticks: [0, .25, .5, .75, 1] });
    P.grid(); const sh = st.amp * Math.sin(2 * Math.PI * st.t * 0.7); // resonance centre moves left/right
    P.fn(x => 1 / Math.hypot(1, x), EM.alpha(EM.col('muted'), .6), 1.5, 200);
    P.fn(x => 1 / Math.hypot(1, x - (-sh)), EM.col('acc2'), 3, 200);
    P.vline(st.off, EM.col('acc3'), 2, [5, 4]); P.dot(st.off, echo(st.off + sh), EM.col('acc3'), 7);
    EM.label(c, 'the curve slides as the diaphragm moves; the illuminator (violet) stays put', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const rows = [['sound on the diaphragm', inp, EM.col('acc'), -1.2, 1.2], ['echo amplitude (AM demodulator)', am, EM.col('acc2'), 0, 1.05], ['echo phase (PM demodulator)', ph, EM.col('acc3'), -Math.PI / 2, Math.PI / 2]];
    const rh = (h - 30) / 3;
    rows.forEach((r, k) => { const y0 = 10 + k * (rh + 6); const P = EM.plot(c, { x: 56, y: y0, w: w - 72, h: rh - 8 }, { xmin: 0, xmax: N, ymin: r[3], ymax: r[4], yticks: [], xticks: [] });
      c.strokeStyle = EM.col('line'); c.strokeRect(P.box.x + .5, P.box.y + .5, P.box.w, P.box.h); c.strokeStyle = r[2]; c.lineWidth = 2.2; c.beginPath(); r[1].forEach((v, i) => { const x = P.X(i), y = P.Y(v); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
      EM.label(c, r[0], P.box.x + 8, P.box.y + 12, r[2], { size: 10, weight: '700' }); });
    EM.label(c, 'three cycles of the sound', 56 + (w - 72) / 2, h - 6, EM.col('muted'), { size: 10, align: 'center' });
  };
  EM.loop(el, (t, dt) => { st.t += dt; A.redraw(); });
  upd();
});
