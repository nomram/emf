/* seawater-depth — how deep does each kind of signal reach? Physics of the sea (sigma = 4 S/m, Debye water) for radio; absorption data for light and sound */
EM.register('seawater-depth', function (el) {
  const W = EM.widget(el, { title: 'How deep can the message go?', badge: 'Try it',
    note: 'Signal loss with depth is $8.686\\,\\alpha z$ dB plus ≈ −6 dB (the magnetic field doubles at the surface). Set your <b>loss budget</b>: how many dB of weakening the transmitter and receiver together can tolerate. The deepest point where signal ≥ noise is the <b>reach</b>. A budget of 100 dB is already heroic: it is 10¹⁰ in power.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: .56 });
  const c0 = EM.C.c, eps0 = EM.C.eps0, cx = EM.cx;
  const PRE = [
    ['ELF 76 Hz (US) / 82 Hz (ZEVS)', 76, 'radio', '≈ a few characters per minute', 'huge ground antennas, tens of km; submarine uses a loop or trailing wire receiver; heard at operating depth'],
    ['VLF 24 kHz (naval VLF station)', 2.4e4, 'radio', '50–300 bit/s (MSK)', '3 km+ umbrella antennas and 1 MW class transmitters; receiver must be within ~ 10–20 m of the surface, on a buoy or trailing wire'],
    ['LF 100 kHz', 1e5, 'radio', 'a few hundred bit/s', 'little advantage: depth falls, antennas still huge'],
    ['HF 10 MHz', 1e7, 'radio', 'kbit/s', 'only works with an antenna mast or buoy at the surface (the signal dies within a few cm of water)'],
    ['UHF satellite 300 MHz', 3e8, 'radio', '2.4–64 kbit/s', 'antenna above the surface (periscope mast, buoy); the sea blocks it within mm'],
    ['Blue-green laser 480 nm', 0, 'light', '1 Mbit/s–1 Gbit/s (tests)', 'satellite or aircraft laser; needs a clear sky and clear water; reach ≈ 100–200 m in clean ocean'],
    ['Red laser 650 nm', -1, 'light', '–', 'absorbed 20× faster than blue: ~ 10 m in clean ocean'],
    ['Sonar / acoustic modem 10 kHz', 1e4, 'sound', '100 bit/s–10 kbit/s', 'sound goes km, but it’s slow (1.5 km/s), needs sound sources underwater and gives away position'],
  ];
  const st = { i: 0, f: 76, depth: 100, budget: 100 };
  function epsC(f) { const w = 2 * Math.PI * f, wt = w * 9.4e-12; return [5 + 75 / (1 + wt * wt), -(75 * wt / (1 + wt * wt) + 4 / (w * eps0))]; }
  function dBperM(i, f) {
    const p = PRE[i];
    if (p[2] === 'light') return p[1] === 0 ? 4.343 * .05 : 4.343 * .36;           // diffuse attenuation (1/m) × 4.343, clear ocean
    if (p[2] === 'sound') { const k = f / 1000, a = .11 * k * k / (1 + k * k) + 44 * k * k / (4100 + k * k) + 2.75e-4 * k * k + .003; return a / 1000; }
    const n = cx.sqrt(epsC(f)), nim = -n[1], w = 2 * Math.PI * f; return 8.686 * w / c0 * nim;
  }
  const pre = EM.select(side, { label: 'Signal', options: PRE.map((p, i) => [i, p[0]]), value: 0, onChange: v => { st.i = +v; if (PRE[st.i][2] === 'radio' || PRE[st.i][2] === 'sound') { st.f = PRE[st.i][1]; fS.set(st.f, true); } upd(); } });
  const fS = EM.slider(side, { label: 'Fine-tune frequency (radio / sound)', min: 1, max: 1e10, log: true, value: 76, fmt: v => EM.freq(v), onInput: v => { st.f = v; if (PRE[st.i][2] === 'light') { st.i = 0; pre.set(0, true); } upd(); } });
  EM.slider(side, { label: 'Loss budget (transmitter + receiver can handle)', min: 20, max: 200, step: 1, value: 100, unit: 'dB', onInput: v => { st.budget = v; upd(); } });
  EM.slider(side, { label: 'Submarine depth', min: 1, max: 1000, log: true, value: 100, fmt: v => EM.len(v), onInput: v => { st.depth = v; upd(); } });
  const ro = EM.readouts(side, [['rate', 'Loss rate', '', 'hot'], ['reach', 'Reach for your budget', '', 'good'], ['atd', 'Loss at your depth', '', 'cool'], ['v', 'Verdict', '', '']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  function loss(i, f, z) { const r = dBperM(i, f); const isRadio = PRE[i][2] === 'radio'; return r * z + (isRadio ? 6 : 0); }
  function upd() {
    const i = st.i, p = PRE[i], f = p[2] === 'light' ? 0 : st.f, r = dBperM(i, f);
    ro.set('rate', r > 1000 ? EM.num(r, 3) : EM.num(r, 3), 'dB/m'); const reach = Math.max(0, (st.budget - (p[2] === 'radio' ? 6 : 0)) / r); ro.set('reach', EM.len(reach));
    const L = loss(i, f, st.depth); ro.set('atd', EM.fixed(L, 1), 'dB'); ro.set('v', L <= st.budget ? 'can receive ✓' : 'lost ✗');
    info.innerHTML = '<h6>' + p[0] + '</h6><b>Data rate:</b> ' + p[3] + '<br><b>Practical notes:</b> ' + p[4];
    S.redraw(); tbl();
  }
  const tblEl = EM.h('div', { class: 'table-wrap', style: { marginTop: '14px' } }); W.body.append(tblEl);
  function tbl() {
    let h = '<table class="data"><tr><th>Signal</th><th class="num">Loss rate (dB/m)</th><th class="num">Reach at ' + st.budget + ' dB</th><th>Data rate</th></tr>';
    PRE.forEach((p, i) => { const f = p[2] === 'light' ? 0 : p[1]; const r = dBperM(i, f), reach = Math.max(0, (st.budget - (p[2] === 'radio' ? 6 : 0)) / r); h += '<tr' + (i === st.i ? ' style="background:color-mix(in srgb,var(--acc3) 12%,transparent)"' : '') + '><td>' + p[0] + '</td><td class="num">' + EM.num(r, 3) + '</td><td class="num">' + EM.len(reach) + '</td><td>' + p[3] + '</td></tr>'; });
    tblEl.innerHTML = h + '</table>';
  }
  S.draw = (c, w, h) => {
    const skyH = h * .16, seaTop = skyH, zmax = Math.max(st.depth * 1.6, 30), Y = z => seaTop + z / zmax * (h - seaTop - 22);
    // sky + sea
    c.fillStyle = EM.alpha(EM.col('acc3'), .06); c.fillRect(0, 0, w, skyH);
    const g = c.createLinearGradient(0, seaTop, 0, h); g.addColorStop(0, EM.alpha(EM.col('acc'), .32)); g.addColorStop(1, 'rgba(0,10,20,.85)'); c.fillStyle = g; c.fillRect(0, seaTop, w, h - seaTop);
    c.strokeStyle = EM.col('acc'); c.lineWidth = 2; c.beginPath(); c.moveTo(0, seaTop); c.lineTo(w, seaTop); c.stroke();
    // transmitter tower
    c.strokeStyle = EM.col('text'); c.lineWidth = 2; c.beginPath(); c.moveTo(w * .16, seaTop); c.lineTo(w * .16, 6); c.moveTo(w * .16 - 7, 14); c.lineTo(w * .16 + 7, 14); c.stroke();
    for (let k = 1; k <= 3; k++) { c.strokeStyle = EM.alpha(EM.col('acc2'), .8 - k * .2); c.beginPath(); c.arc(w * .16, 8, 14 * k, -.5, 1.2); c.stroke(); }
    EM.label(c, 'transmitter', w * .16 + 22, 18, EM.col('muted'), { size: 10 });
    // depth axis
    const nTick = 6; c.fillStyle = EM.col('muted'); c.font = EM.font(10); c.textAlign = 'left'; c.textBaseline = 'middle';
    for (let k = 0; k <= nTick; k++) { const z = zmax * k / nTick; c.strokeStyle = EM.alpha(EM.col('line'), .6); c.beginPath(); c.moveTo(0, Y(z)); c.lineTo(w, Y(z)); c.stroke(); c.fillText(EM.len(z, 2), 4, Y(z) - 7); }
    const p = PRE[st.i], f = p[2] === 'light' ? 0 : st.f;
    // signal-strength shading (vertical)
    for (let y = seaTop; y < h - 22; y += 3) { const z = (y - seaTop) / (h - seaTop - 22) * zmax, L = loss(st.i, f, z), t = EM.clamp(1 - L / st.budget, 0, 1); c.fillStyle = 'rgba(' + EM.heat(.25 + t * .75).map(Math.round).join(',') + ',' + (.05 + t * .45) + ')'; c.fillRect(w * .30, y, w * .2, 3); }
    const reach = Math.max(0, (st.budget - (p[2] === 'radio' ? 6 : 0)) / dBperM(st.i, f));
    if (reach < zmax) { c.setLineDash([6, 4]); c.strokeStyle = EM.col('bad'); c.lineWidth = 2; c.beginPath(); c.moveTo(w * .26, Y(reach)); c.lineTo(w * .54, Y(reach)); c.stroke(); c.setLineDash([]); EM.label(c, 'reach: ' + EM.len(reach), w * .55, Y(reach), EM.col('bad'), { size: 11, weight: '700' }); } else EM.label(c, 'reach > ' + EM.len(zmax), w * .55, Y(zmax) - 10, EM.col('ok'), { size: 11, weight: '700' });
    EM.label(c, 'signal strength', w * .40, seaTop + 14, EM.col('text'), { size: 10, align: 'center' });
    // submarine
    const sy = Y(st.depth), sx = w * .72; c.fillStyle = L2() ? EM.col('ok') : EM.col('bad'); function L2() { return loss(st.i, f, st.depth) <= st.budget; }
    c.beginPath(); c.ellipse(sx, sy, 38, 12, 0, 0, 7); c.fill(); c.fillRect(sx - 8, sy - 22, 14, 14); c.strokeStyle = '#000'; c.lineWidth = 1; c.stroke();
    EM.label(c, L2() ? 'message received' : 'no signal', sx, sy + 26, L2() ? EM.col('ok') : EM.col('bad'), { size: 11, align: 'center', weight: '700' });
    EM.label(c, EM.len(st.depth), sx, sy - 30, EM.col('text'), { size: 11, align: 'center' });
  };
  upd();
});
