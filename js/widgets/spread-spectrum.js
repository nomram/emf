/* spread-spectrum — direct-sequence spreading: processing gain turns a narrowband interferer into low-level noise */
EM.register('spread-spectrum', function (el) {
  const W = EM.widget(el, { title: 'Spreading the signal: processing gain', badge: 'Try it',
    note: 'The data (bit rate $R_b$) is multiplied by a fast pseudo-random code (chip rate $R_c$). The signal occupies $R_c$ of spectrum instead of $R_b$ and its power spectral density drops <b>below the noise floor</b>. The receiver multiplies by the same code: the signal collapses back to $R_b$, while a narrowband interferer is <b>spread out</b> instead. Net improvement: the <b>processing gain</b> $G_p=R_c/R_b$.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .44 }), T = EM.canvas(main, { aspect: .44 }); T.cv.style.marginTop = '10px';
  const st = { Rb: 50, Rc: 1.023e6, sir: -20, snr: -10 };
  const PRE = [['GPS C/A: 50 bit/s on 1.023 Mchip/s', 50, 1.023e6], ['Wi-Fi 802.11b: 1 Mbit/s on 11 Mchip/s', 1e6, 11e6], ['CDMA phone: 9.6 kbit/s on 1.2288 Mchip/s', 9600, 1.2288e6], ['Light spreading (10×)', 1e5, 1e6]];
  EM.select(side, { label: 'Real systems', options: [['', 'choose…'], ...PRE.map((p, i) => [i, p[0]])], value: '', onChange: v => { if (v === '') return; const p = PRE[+v]; st.Rb = p[1]; st.Rc = p[2]; upd(); } });
  EM.slider(side, { label: 'Interference strength relative to the signal (per signal bandwidth)', min: -10, max: 50, step: 1, value: 20, unit: 'dB', onInput: v => { st.sir = -v; upd(); } }); st.sir = -20;
  EM.slider(side, { label: 'Chip rate (spread bandwidth)', min: 1e4, max: 1e8, log: true, value: 1.023e6, fmt: v => EM.freq(v), onInput: v => { st.Rc = v; upd(); } });
  EM.slider(side, { label: 'Data rate', min: 10, max: 1e6, log: true, value: 50, fmt: v => EM.num(v, 3) + ' bit/s', onInput: v => { st.Rb = v; upd(); } });
  const ro = EM.readouts(side, [['gp', 'Processing gain G_p = R_c / R_b', '', 'cool'], ['sir0', 'Signal-to-interference before despreading', '', 'bad'], ['sir1', 'After despreading', '', 'good'], ['need', 'Typical decoding needs', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function upd() {
    const Gp = st.Rc / st.Rb, gdb = 10 * Math.log10(Gp); ro.set('gp', EM.num(Gp, 4) + '  (' + gdb.toFixed(1) + ' dB)'); ro.set('sir0', EM.fixed(st.sir, 0), 'dB'); ro.set('sir1', EM.fixed(st.sir + gdb, 1), 'dB'); ro.set('need', '≈ 10 dB');
    info.innerHTML = '<h6>' + (st.sir + gdb >= 10 ? 'Works' : st.sir + gdb >= 0 ? 'Marginal' : 'Overwhelmed') + '</h6>With $G_p=$ ' + gdb.toFixed(0) + ' dB the link tolerates interference up to about ' + EM.fixed(gdb - 10, 0) + ' dB <em>stronger</em> than the signal, in the sense of equal bandwidth. GPS reaches 43 dB of spreading: a 50 bit/s message hidden in 1 MHz, which is how a signal 20 dB <em>below the noise</em> can be received. But GPS signals are so weak at the ground that strong nearby sources can still exceed the margin: the reason receivers add anti-jam antenna arrays (chapter 18), inertial back-up and the protected military codes. Spreading also makes a signal hard to detect: its power density can be below the receiver noise of anyone who doesn’t know the code (<b>LPI</b>).';
    if (window.renderMath) window.renderMath(info); S.redraw(); T.redraw();
  }
  const draw = (c, w, h, despread) => {
    const P = EM.plot(c, { x: 50, y: 14, w: w - 66, h: h - 50 }, { xmin: -1, xmax: 1, ymin: -90, ymax: 10, xlabel: 'frequency (relative to the spread bandwidth)', ylabel: 'power density (dB)', yticks: [-80, -60, -40, -20, 0], xticks: [-1, -.5, 0, .5, 1], xfmt: v => v });
    P.grid();
    const noise = -55, ds = noise - 15, gdb = 10 * Math.log10(st.Rc / st.Rb), js = -st.sir, rel = st.Rb / st.Rc;      // signal 15 dB below the noise in the spread band; js = interference-to-signal power ratio (dB)
    const sinc2 = x => 10 * Math.log10(Math.max(1e-9, Math.pow(Math.abs(EM.sinc(Math.PI * x)), 2)));
    const sig = x => despread ? ds + gdb + 10 * Math.log10(Math.max(1e-9, Math.exp(-Math.pow(x / Math.max(.004, rel * 2), 2)))) : ds + sinc2(x);
    const jam = x => despread ? ds + js + sinc2(x) : ds + js + gdb + 10 * Math.log10(Math.max(1e-9, Math.exp(-Math.pow((x - .25) / .006, 2))));
    P.clip(); P.hline(noise, EM.alpha(EM.col('muted'), .8), 1.5, [5, 4]); P.fn(jam, EM.col('bad'), 2.4, 700); P.fn(sig, EM.col('ok'), 2.8, 700); P.unclip();
    EM.label(c, despread ? 'After despreading: signal (green) compact and tall; interference (red) smeared into a low floor' : 'On the air: the spread signal (green) is below the noise floor; the interference (red) is a tall narrow spike', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 11, weight: '500' });
    EM.label(c, 'receiver noise floor', P.box.x + P.box.w - 6, P.Y(noise) - 8, EM.col('muted'), { size: 10, align: 'right' });
  };
  S.draw = (c, w, h) => draw(c, w, h, false); T.draw = (c, w, h) => draw(c, w, h, true);
  upd();
});
