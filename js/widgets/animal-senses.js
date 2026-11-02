/* animal-senses — who hears / sees what: hearing ranges (Hz) and vision ranges (wavelength), plus a safe tone generator */
EM.register('animal-senses', function (el) {
  const W = EM.widget(el, { title: 'Who can sense what? Hearing and vision ranges', badge: 'Explore',
    note: 'Ranges are typical published values (they differ between individuals and studies). <b>Hover or click a bar</b> for details. The tone generator plays a pure sine at a <b>low, fixed volume</b>: keep your system volume modest and stop if anything is uncomfortable.' });
  const h = EM.h;
  const HEAR = [
    ['Elephant', 16, 12000, 'Rumbles at 14–35 Hz travel kilometres through ground and air; elephants feel them in their feet.'],
    ['Blue whale', 10, 40, 'Calls at 10–40 Hz (≈ 180 dB re 1 µPa): λ ≈ 40–150 m in water. They travel thousands of km in the deep sound channel.'],
    ['Fin whale', 15, 30, 'The famous 20 Hz pulses; the loudest whale sound, picked up by seismometers.'],
    ['Humpback whale', 30, 8000, 'Songs span 30 Hz–8 kHz, with harmonics to 24 kHz; repeated phrases that change from year to year.'],
    ['Pigeon', 1, 10000, 'Can sense infrasound below 1 Hz (storms, wind over mountains): likely part of their navigation.'],
    ['Human', 20, 20000, 'Best hearing at 2–5 kHz. The upper limit falls with age (about 12–15 kHz by 50) and with noise exposure.'],
    ['Piano keyboard', 27.5, 4186, 'Fundamentals from A0 (27.5 Hz) to C8 (4186 Hz); harmonics go much higher.'],
    ['Human speech', 85, 3400, 'Male fundamental ≈ 85–180 Hz, female ≈ 165–255 Hz; intelligibility lives at 300–3400 Hz (the old telephone band).'],
    ['Barn owl', 100, 12000, 'Very sensitive 4–8 kHz hearing, with asymmetric ears that locate prey in total darkness.'],
    ['Dog', 67, 45000, 'Can hear dog-whistles (23–54 kHz).'],
    ['Cat', 48, 85000, 'One of the widest mammal ranges: hears the ultrasonic squeaks of mice.'],
    ['Mouse', 1000, 91000, 'Communicates with ultrasonic songs and pup calls around 40–90 kHz.'],
    ['Sperm whale', 100, 30000, 'Clicks up to 230 dB: the loudest animal sound, used for echolocation (and possibly stunning prey).'],
    ['Bottlenose dolphin', 75, 150000, 'Echolocation clicks at 40–130 kHz resolve a golf ball at 100 m. λ in water at 100 kHz is only 1.5 cm.'],
    ['Beluga', 1000, 120000, 'The “canary of the sea”: whistles, clicks and chirps.'],
    ['Bat (echolocating)', 10000, 200000, 'Calls from 10 kHz to 200 kHz; a wavelength of 2–30 mm lets them sense insects as small as that.'],
    ['Moth (tiger moth)', 20000, 100000, 'Hears bat calls and even jams them with its own clicks.'],
  ].sort((a, b) => a[1] - b[1]);
  const SEE = [
    ['Human', 380, 750, 'Three cone types peaking at ≈ 420, 534 and 564 nm. Rods (night vision) at 498 nm. The lens blocks most UV.'],
    ['Honeybee', 300, 650, 'Sees UV, blue and green but not red. Flowers have UV “landing strips” invisible to us.'],
    ['Many birds', 320, 700, 'Four cone types including UV-sensitive: parrots and songbirds show UV plumage patterns.'],
    ['Butterfly (Papilio)', 300, 720, 'Up to 6 photoreceptor types incl. UV and red.'],
    ['Dog', 400, 600, 'Dichromat: two cone types (blue and yellow-green), no red. Better in dim light than us.'],
    ['Reindeer', 320, 700, 'Sees UV, useful to spot lichens, urine and wolves against snow (which absorbs UV).'],
    ['Mantis shrimp', 300, 720, 'Up to 12–16 photoreceptor types, and sees circular polarisation: far more than colour discrimination.'],
    ['Deep-sea fish', 440, 520, 'Only blue-green light reaches depth, so that is all they see (chapter 8).'],
    ['Pit viper (thermal pit)', 5000, 30000, 'Not an “eye”: a membrane in the facial pit senses thermal infrared at 5–30 µm, so a mouse (warm body, peak ≈ 9.4 µm) glows in the dark at ≈ 0.003 K resolution.'],
    ['Silicon camera sensor', 400, 1100, 'Most phone cameras see to 1100 nm; an IR filter blocks it (remove it and a TV remote LED lights up).'],
    ['Thermal camera (microbolometer)', 8000, 14000, 'Sees the 8–14 µm atmospheric window where body heat glows.'],
  ].sort((a, b) => a[1] - b[1]);
  const st = { tab: 'hear', f: 440, age: 25, hover: -1, pin: -1, tone: null };
  const tabs = EM.tabs(W.body, [['hear', 'Hearing (sound waves)'], ['see', 'Vision (light & heat)']], 'hear', v => { st.tab = v; st.hover = st.pin = -1; ctl.style.display = v === 'hear' ? '' : 'none'; resize(); S.redraw(); updInfo(); });
  const S = EM.canvas(W.body, { height: 440, cursor: 'pointer' });
  const info = h('div', { class: 'info-box', style: { marginTop: '10px' } }); W.body.append(info);
  const ctl = h('div', { class: 'wgrid even', style: { marginTop: '12px' } }); W.body.append(ctl);
  const L = h('div', { class: 'ctls' }), R = h('div', { class: 'ctls' }); ctl.append(L, R);
  const fs = EM.slider(L, { label: 'Tone frequency', min: 5, max: 40000, log: true, value: 440, fmt: v => EM.freq(v), onInput: v => { st.f = v; if (st.tone) st.tone.set(v); upd(); } });
  const ag = EM.slider(L, { label: 'Your age (typical high-frequency limit)', min: 10, max: 80, step: 1, value: 25, unit: 'years', onInput: v => { st.age = v; upd(); } });
  const btnRow = h('div', { class: 'btn-row' }); L.append(btnRow);
  const pb = EM.btn(btnRow, '🔊 Play tone (quiet)', () => { if (st.tone) { st.tone.stop(); st.tone = null; pb.innerHTML = '🔊 Play tone (quiet)'; } else { st.tone = EM.audio.tone(st.f, .04); if (st.tone) pb.innerHTML = '■ Stop'; } }, 'primary');
  [['Mosquito 17.4 kHz', 17400], ['Concert A 440 Hz', 440], ['Hum 50 Hz', 50]].forEach(([t, f]) => EM.btn(btnRow, t, () => { st.f = f; fs.set(f, true); if (st.tone) st.tone.set(f); upd(); }, 'small'));
  const ro = EM.readouts(R, [['lam', 'Wavelength in air (343 m/s)', '', 'cool'], ['lamw', 'Wavelength in water (1480 m/s)', '', 'cool'], ['you', 'Can a typical you hear it?', '', 'hot'], ['em', 'Same-frequency radio wave λ', '', 'fuel']]);
  const rows = () => st.tab === 'hear' ? HEAR : SEE;
  const rowH = 24, top = 54;
  function resize() { S.fixedH = top + rows().length * rowH + 40; S.setAspect(S.aspect); }
  const hiLimit = age => EM.clamp(20000 - Math.max(0, age - 10) * 130 - Math.max(0, age - 40) * 100 - Math.max(0, age - 60) * 150, 4000, 20000);
  function upd() {
    const f = st.f, lim = hiLimit(st.age); ro.set('lam', EM.len(343 / f)); ro.set('lamw', EM.len(1480 / f)); ro.set('em', EM.len(EM.C.c / f)); ro.set('you', f < 20 ? 'felt, not heard (infrasound)' : f > lim ? 'no (above ≈ ' + EM.freq(Math.round(lim / 100) * 100) + ')' : 'yes (limit ≈ ' + EM.freq(Math.round(lim / 100) * 100) + ')'); S.redraw();
  }
  function pxx(S_) { return { l: 150, r: S_.W - 16 }; }
  S.draw = (c, w, H) => {
    const hear = st.tab === 'hear', data = rows(), m = pxx(S);
    const P = EM.plot(c, { x: m.l, y: top - 4, w: m.r - m.l, h: data.length * rowH + 4 }, hear ? { xmin: 1, xmax: 3e5, xlog: true, ymin: 0, ymax: 1, yticks: [], xlabel: 'frequency', xfmt: v => EM.freq(v).replace(' ', '') } : { xmin: 100, xmax: 3e4, xlog: true, ymin: 0, ymax: 1, yticks: [], xlabel: 'wavelength', xfmt: v => (v >= 1000 ? EM.num(v / 1000) + ' µm' : v + ' nm') });
    if (!hear) { c.save(); c.beginPath(); c.rect(P.box.x, P.box.y, P.box.w, P.box.h); c.clip(); for (let x = P.X(380); x < P.X(750); x += 1) { const nm = P.invX(x), rgb = EM.nm2rgb(nm); c.fillStyle = 'rgba(' + rgb.join(',') + ',.30)'; c.fillRect(x, P.box.y, 1.5, P.box.h); } c.restore(); }
    P.grid();
    if (hear) { EM.label(c, 'infrasound', P.X(3), 18, EM.col('muted'), { size: 11, align: 'center' }); EM.label(c, 'ultrasound →', P.X(40000), 18, EM.col('muted'), { size: 11, align: 'center' }); c.fillStyle = EM.alpha(EM.col('ok'), .12); c.fillRect(P.X(20), P.box.y, P.X(20000) - P.X(20), P.box.h); EM.label(c, 'human range', P.X(630), 18, EM.col('ok'), { size: 11, align: 'center', weight: '700' }); c.fillStyle = EM.alpha(EM.col('text'), .06); c.fillRect(P.box.x, P.box.y, P.X(20) - P.box.x, P.box.h); }
    else { EM.label(c, 'ultraviolet', P.X(200), 18, EM.col('violet'), { size: 11, align: 'center' }); EM.label(c, 'visible', P.X(550), 18, EM.col('text'), { size: 11, align: 'center', weight: '700' }); EM.label(c, 'thermal infrared (body heat)', P.X(10000), 18, EM.col('acc2'), { size: 11, align: 'center' }); }
    data.forEach((d, i) => {
      const y = P.box.y + 2 + i * rowH, lo = hear ? d[1] : d[1], hi = d[2], x1 = P.X(Math.max(lo, P.o.xmin)), x2 = P.X(Math.min(hi, P.o.xmax)); const on = i === st.hover || i === st.pin;
      const col = d[0] === 'Human' ? EM.col('acc3') : (hear ? (d[3].includes('whale') || d[0].includes('whale') || d[0].includes('dolphin') || d[0] === 'Beluga' ? EM.col('acc') : d[0].includes('Bat') || d[0].includes('Moth') ? EM.col('violet') : EM.col('acc2')) : (d[1] >= 5000 ? EM.col('bad') : d[0].includes('camera') ? EM.col('muted') : EM.col('ok')));
      c.fillStyle = EM.alpha(col, on ? 1 : .78); c.beginPath(); c.roundRect(x1, y + 3, Math.max(4, x2 - x1), rowH - 8, 5); c.fill();
      c.fillStyle = on ? EM.col('text') : EM.col('text-2'); c.font = EM.font(12, on || d[0] === 'Human' ? '700' : '500'); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(d[0], m.l - 8, y + rowH / 2);
    });
    if (hear) { const x = P.X(st.f); c.strokeStyle = EM.col('acc3'); c.lineWidth = 2; c.beginPath(); c.moveTo(x, P.box.y); c.lineTo(x, P.box.y + P.box.h); c.stroke(); const lab = EM.freq(st.f); c.fillStyle = EM.col('acc3'); c.font = EM.font(11, '800'); const tw = c.measureText(lab).width + 10; c.fillRect(Math.min(P.box.x + P.box.w - tw, x - tw / 2), H - 22, tw, 16); c.fillStyle = '#201700'; c.textAlign = 'center'; c.fillText(lab, Math.min(P.box.x + P.box.w - tw / 2, x), H - 14); }
    S.P = P;
  };
  function rowAt(p) { const i = Math.floor((p.y - (top - 2)) / rowH); return i >= 0 && i < rows().length ? i : -1; }
  S.pointer({ move: (p) => { const i = rowAt(p); if (i !== st.hover) { st.hover = i; S.redraw(); updInfo(); } }, down: (p) => { const i = rowAt(p); st.pin = i === st.pin ? -1 : i; updInfo(); S.redraw(); }, leave: () => { st.hover = -1; S.redraw(); updInfo(); } });
  function updInfo() {
    const i = st.hover >= 0 ? st.hover : st.pin, hear = st.tab === 'hear';
    if (i < 0) { info.innerHTML = hear ? '<h6>Sound is not radio</h6>Sound is a pressure wave <em>in matter</em> (343 m/s in air, 1480 m/s in seawater); it cannot cross a vacuum. Radio is an electromagnetic wave (3×10⁸ m/s) and needs no medium. Both obey λ = v/f, but the same frequency gives a wavelength about a million times shorter in sound. Hover over a bar.' : '<h6>Light is only a sliver</h6>Human vision spans less than one octave of the spectrum (380–750 nm). Hover over a bar to see what others see.'; return; }
    const d = rows()[i]; info.innerHTML = '<h6>' + d[0] + ' — ' + (hear ? EM.freq(d[1]) + ' to ' + EM.freq(d[2]) + '  (λ in water ' + EM.len(1480 / d[2]) + ' to ' + EM.len(1480 / d[1]) + ')' : (d[1] >= 1000 ? EM.num(d[1] / 1000) + ' µm' : d[1] + ' nm') + ' to ' + (d[2] >= 1000 ? EM.num(d[2] / 1000) + ' µm' : d[2] + ' nm')) + '</h6>' + d[3];
  }
  resize(); upd(); updInfo();
  EM.loop(el, () => {}, { autostart: false });
});
