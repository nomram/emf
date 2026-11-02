/* doppler-shift — f_d = 2 v_r / lambda: speed guns, aircraft, weather; hear the Doppler tone */
EM.register('doppler-shift', function (el) {
  const W = EM.widget(el, { title: 'The Doppler shift of an echo', badge: 'Try it',
    note: 'A target moving toward the radar compresses the returning wave: $f_d=\\dfrac{2v_r}{\\lambda}=\\dfrac{2v_rf}{c}$, with $v_r=v\\cos\\theta$ the <b>radial</b> speed. The factor 2 is because the wave is shifted twice (once on hitting the moving target, once when re-radiated). It is tiny compared with the carrier (parts per 10⁷), but easy to measure by mixing the echo with the transmitted signal: the <b>beat</b> is the Doppler tone.' });
  const { main, side } = W.grid();
  const A = EM.canvas(main, { aspect: .36 }), B = EM.canvas(main, { aspect: .34 }); B.cv.style.marginTop = '10px';
  const st = { f: 24e9, v: 27.8, th: 0, t: 0, tone: null };
  const PRE = [['Speed gun, 24 GHz, car 100 km/h', 24e9, 27.8, 0], ['Air-traffic radar, 3 GHz, jet at 250 m/s', 3e9, 250, 0], ['Weather radar, 5.6 GHz, 20 m/s wind', 5.6e9, 20, 0], ['Automotive radar, 77 GHz, 100 km/h closing', 77e9, 27.8, 0], ['Airliner crossing at 60°: radial component only', 3e9, 250, 60], ['Walking person, 10 GHz motion sensor', 10e9, 1.4, 0], ['Breathing chest, 60 GHz, 1 cm/s', 60e9, .01, 0]];
  EM.select(side, { label: 'Examples', options: [['', 'choose…'], ...PRE.map((p, i) => [i, p[0]])], value: '', onChange: v => { if (v === '') return; const p = PRE[+v]; st.f = p[1]; st.v = p[2]; st.th = p[3]; fs.set(st.f, true); vs.set(st.v, true); ts.set(st.th, true); upd(); } });
  const fs = EM.slider(side, { label: 'Radar frequency', min: 1e8, max: 1e11, log: true, value: 24e9, fmt: v => EM.freq(v), onInput: v => { st.f = v; upd(); } });
  const vs = EM.slider(side, { label: 'Target speed (positive = approaching)', min: -300, max: 300, step: .5, value: 27.8, fmt: v => v.toFixed(1) + ' m/s  (' + (v * 3.6).toFixed(0) + ' km/h)', onInput: v => { st.v = v; upd(); } });
  const ts = EM.slider(side, { label: 'Angle between motion and line of sight', min: 0, max: 90, step: 1, value: 0, unit: '°', onInput: v => { st.th = v; upd(); } });
  const ro = EM.readouts(side, [['lam', 'Wavelength', '', 'cool'], ['vr', 'Radial speed', '', ''], ['fd', 'Doppler shift f_d', '', 'hot'], ['rel', 'Fraction of the carrier', '', ''], ['per', 'Period of the beat', '', 'fuel']]);
  const row = EM.h('div', { class: 'btn-row' }); side.append(row);
  const ab = EM.btn(row, '🔊 Hear the Doppler tone (quiet)', () => { if (st.tone) { st.tone.stop(); st.tone = null; ab.innerHTML = '🔊 Hear the Doppler tone (quiet)'; } else { st.tone = EM.audio.tone(tone(), .04); if (st.tone) ab.innerHTML = '■ Stop'; } }, 'small');
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const vr = () => st.v * Math.cos(EM.rad(st.th)), fd = () => 2 * vr() * st.f / EM.C.c;
  function tone() { let f = Math.abs(fd()); while (f > 1500) f /= 2; return Math.max(60, f); }
  function upd() {
    const lam = EM.C.c / st.f, f = fd(); ro.set('lam', EM.len(lam)); ro.set('vr', vr().toFixed(1), 'm/s'); ro.set('fd', (f >= 0 ? '+' : '−') + EM.si(Math.abs(f), 'Hz')); ro.set('rel', EM.num(Math.abs(f) / st.f, 2)); ro.set('per', f ? EM.si(1 / Math.abs(f), 's') : '∞');
    info.innerHTML = '<h6>' + (Math.abs(f) < 1 ? 'No Doppler: crossing target' : f > 0 ? 'Approaching: echo frequency goes UP' : 'Receding: echo frequency goes DOWN') + '</h6>A target moving <b>across</b> the line of sight ($\\theta=90°$) produces no Doppler at all (a classic blind spot: “the notch”). The <b>sign</b> tells approach from recession; the <b>size</b> tells radial speed. One cycle of Doppler corresponds to half a wavelength of target motion. ' + (st.tone ? 'Playing ' + EM.freq(tone()) + (Math.abs(fd()) > 1500 ? ' (octave-shifted down to fit your speakers)' : '') + '.' : '');
    if (window.renderMath) window.renderMath(info); if (st.tone) st.tone.set(tone()); A.redraw(); B.redraw();
  }
  A.draw = (c, w, h) => {
    const cy = h * .55, rx = 40, tx = rx + (w - 100) * (.55 + .35 * Math.sin(st.t * .5) * Math.sign(st.v || 1) * .0), spd = st.v, lam = 26;
    c.fillStyle = EM.col('bg-2'); c.fillRect(0, 0, w, h); c.fillStyle = EM.col('text'); c.fillRect(rx - 10, cy - 10, 10, 30); EM.label(c, 'radar', rx - 5, cy + 36, EM.col('muted'), { size: 10, align: 'center' });
    const tp = rx + 100 + ((w - 220) * (((st.t * 18 * (spd >= 0 ? -1 : 1) * Math.min(1, Math.abs(spd) / 40 + .1)) % (w - 220)) + (w - 220)) % (w - 220) / (w - 220)); const tpos = tp;
    // outgoing waves
    for (let x = rx; x < tpos; x += lam) { const xx = x + ((st.t * 40) % lam); if (xx < tpos) { c.strokeStyle = EM.alpha(EM.col('acc'), .6); c.lineWidth = 2; c.beginPath(); c.moveTo(xx, cy - 22); c.lineTo(xx, cy + 22); c.stroke(); } }
    // reflected waves: wavelength compressed/expanded
    const k = 1 + 2 * (spd / 40) * .6, lam2 = Math.max(6, lam / Math.max(.3, 1 + 2 * Math.cos(EM.rad(st.th)) * (spd / 80)));
    for (let x = tpos; x > rx + 14; x -= lam2) { const xx = x - ((st.t * 40) % lam2); if (xx > rx + 14 && xx < tpos) { c.strokeStyle = EM.alpha(EM.col('acc2'), .7); c.lineWidth = 2; c.beginPath(); c.moveTo(xx, cy - 12); c.lineTo(xx, cy + 12); c.stroke(); } }
    c.fillStyle = EM.col('acc3'); c.beginPath(); c.moveTo(tpos - 12, cy + 4); c.lineTo(tpos + 12, cy + 4); c.lineTo(tpos + 4, cy - 10); c.lineTo(tpos - 4, cy - 10); c.closePath(); c.fill();
    EM.arrow(c, tpos, cy + 26, tpos + (spd >= 0 ? -1 : 1) * 36, cy + 26, EM.col('acc3'), 2.5, 8);
    EM.label(c, 'blue: transmitted wave (wavelength λ)   orange: echo, ' + (spd > 0 ? 'squeezed' : spd < 0 ? 'stretched' : 'unchanged') + ' by the motion (exaggerated)', 10, 14, EM.col('muted'), { size: 10, weight: '500' });
  };
  B.draw = (c, w, h) => {
    const f = fd(), P = EM.plot(c, { x: 50, y: 12, w: w - 66, h: h - 42 }, { xmin: 0, xmax: 1, ymin: -1.2, ymax: 1.2, yticks: [-1, 0, 1], xticks: [], xlabel: 'time →   (mixer output: transmitted × received = beat at f_d)' });
    P.grid(); P.hline(0, EM.col('line-2')); const cyc = 5 * (Math.abs(f) > 0 ? 1 : 0) * (f > 0 ? 1 : -1);
    P.line(Array.from({ length: 401 }, (_, i) => i / 400), Array.from({ length: 401 }, (_, i) => Math.cos(2 * Math.PI * (cyc * i / 400 - st.t * .4 * Math.sign(cyc)))), EM.col('acc3'), 2.5);
    EM.label(c, Math.abs(f) < 1 ? 'zero beat: no radial motion' : '5 beats shown here = ' + EM.si(Math.abs(f), 'Hz') + ' (real signal would show ' + EM.num(Math.abs(f) * .001, 3) + ' cycles per ms)', P.box.x + 8, P.box.y + 12, EM.col('text-2'), { size: 11, weight: '500' });
  };
  EM.loop(el, (t, dt) => { st.t += dt; A.redraw(); B.redraw(); });
  upd();
});
