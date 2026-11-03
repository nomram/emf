/* theremin-hand — the musical theremin: your hand is one plate of a capacitor in an oscillator; two radio-frequency oscillators beat to an audible tone */
EM.register('theremin-hand', function (el) {
  const W = EM.widget(el, { title: 'Playing a theremin without touching it', badge: 'Try it',
    note: 'Two radio-frequency oscillators run near $f_0\\approx450$ kHz. One is fixed. In the other, the antenna and your hand form a small extra capacitor $C_h$ that adds to the tank: $f=1/(2\\pi\\sqrt{L(C_0+C_h)})$. The difference of the two (the <b>beat</b>, as in a heterodyne receiver, chapter 11a) is audible: $f_a=f_0-f$. Move your hand closer to the pitch antenna and $C_h$ grows, $f$ falls, the beat rises. Values are typical orders of magnitude, not a design.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .5 });
  const st = { d: 25, tone: null, f0: 450e3, C0: 200e-12, Cm: 3e-12, d0: 0.08 }; // d in cm
  const cap = d => st.Cm * st.d0 / (st.d0 + d / 100);
  const fvar = d => st.f0 * Math.sqrt(st.C0 / (st.C0 + cap(d)));
  const beat = d => Math.max(0, st.f0 - fvar(d));
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const note = f => { if (f < 20) return '—'; const n = Math.round(12 * Math.log2(f / 440)) + 69; return names[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1); };
  EM.slider(side, { label: 'Hand distance from the pitch antenna', min: 0, max: 80, step: .5, value: 25, unit: ' cm', onInput: v => { st.d = v; upd(); } });
  EM.slider(side, { label: 'Hand capacitance at contact', min: 1, max: 6, step: .1, value: 3, fmt: v => v.toFixed(1) + ' pF', onInput: v => { st.Cm = v * 1e-12; upd(); } });
  const row = EM.h('div', { style: { display: 'flex', gap: '8px', margin: '8px 0' } }); side.append(row);
  const pb = EM.btn(row, '🔊 Play (quiet)', () => { if (st.tone) { st.tone.stop(); st.tone = null; pb.innerHTML = '🔊 Play (quiet)'; } else { const f = Math.min(beat(st.d), 4000); st.tone = EM.audio.tone(Math.max(f, 30), .04); if (st.tone) pb.innerHTML = '■ Stop'; } }, 'primary');
  const ro = EM.readouts(side, [['ch', 'Hand capacitance now', '', 'fuel'], ['fv', 'Variable oscillator', '', 'cool'], ['fa', 'Beat = what you hear', '', 'hot'], ['nt', 'Nearest note', '', 'good'], ['sl', 'Sensitivity at this spot', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function upd() {
    const b = beat(st.d); ro.set('ch', (cap(st.d) * 1e12).toFixed(2), 'pF'); ro.set('fv', EM.freq(fvar(st.d))); ro.set('fa', EM.freq(b)); ro.set('nt', note(b)); ro.set("sl", EM.fixed((beat(Math.max(0, st.d - 1)) - beat(st.d + 1)) / 2, 0), "Hz per cm");
    if (st.tone) st.tone.set(Math.max(Math.min(b, 4000), 30));
    info.innerHTML = '<h6>Why it is so hard to play in tune</h6>The hand capacitance falls off roughly like $1/(d+d_0)$, so the pitch is <b>not linear</b> in distance: it is very sensitive near the antenna and flat far away. Players learn the map by ear. The same trick, sensing a body through its capacitance with no contact, sits inside touch screens, car seat-occupancy sensors and the presence sensors of chapter 15d.'; if (window.renderMath) window.renderMath(info);
    A.redraw();
  }
  A.draw = (c, w, h) => {
    const P = EM.plot(c, { x: 64, y: 14, w: w - 80, h: h - 48 }, { xmin: 0, xmax: 80, ymin: 0, ymax: Math.max(1500, beat(0) * 1.05), xlabel: 'hand distance from antenna (cm)', ylabel: 'audio pitch (Hz)' });
    P.grid(); P.fn(d => beat(d), EM.col('acc2'), 3, 200); P.vline(st.d, EM.alpha(EM.col('acc3'), .7), 1.4, [4, 4]); P.dot(st.d, beat(st.d), EM.col('acc3'), 7);
    EM.label(c, 'closer hand → bigger capacitance → lower oscillator frequency → higher beat', P.box.x + 8, P.box.y + 14, EM.col('text-2'), { size: 10, weight: '500' });
  };
  upd();
});
