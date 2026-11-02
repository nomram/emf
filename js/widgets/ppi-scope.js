/* ppi-scope — a plan-position-indicator radar display with moving targets of different RCS, beamwidth smear, clutter */
EM.register('ppi-scope', function (el) {
  const W = EM.widget(el, { title: 'The radar screen (PPI): sweep, blips, clutter', badge: 'Try it',
    note: 'The antenna turns; each time its beam crosses a target, the echo (if strong enough) lights a <b>blip</b> that fades until the next pass. Blips smear in angle by the <b>beamwidth</b> and in range by the pulse. Targets with small RCS are only seen when close. Click on a blip to identify the target.' });
  const { main, side } = W.grid();
  const S = EM.canvas(main, { aspect: 1, minH: 340, maxH: 640, cursor: 'crosshair' });
  const st = { Rmax: 150, rpm: 12, bw: 3, Rdet: 120, clutter: true, ang: 0, blips: [], tr: [], sel: -1, trails: true };
  const TG = [['Airliner A', 100, 240, 260, 55, 'airliner'], ['Airliner B', 100, -80, 150, 120, 'airliner'], ['Fighter (conventional)', 5, -30, -90, 300, 'fighter'], ['Cessna', 2, 60, -50, 55, 'light plane'], ['Stealth fighter', .005, 80, 70, 280, 'stealth'], ['Drone', .02, -50, 40, 20, 'drone'], ['Ship', 5000, 100, -10, 12, 'ship'], ['Helicopter', 3, -60, -70, 65, 'helicopter'], ['Small bird flock', .001, 30, -100, 12, 'birds']];
  EM.rand(42);
  st.T = TG.map((t, i) => ({ n: t[0], sig: t[1], x: (EM.rand() - .5) * 220, y: (EM.rand() - .5) * 220, hdg: EM.rand() * 6.28, v: t[4] / 1000, kind: t[5], last: -1, seen: 0 }));
  EM.slider(side, { label: 'Display range', min: 50, max: 400, step: 10, value: 150, unit: 'km', onInput: v => { st.Rmax = v; st.blips = []; } });
  EM.slider(side, { label: 'Detection range for a 1 m² target', min: 20, max: 300, step: 5, value: 120, unit: 'km', onInput: v => { st.Rdet = v; } });
  EM.slider(side, { label: 'Antenna beamwidth', min: 1, max: 12, step: .5, value: 3, unit: '°', onInput: v => { st.bw = v; } });
  EM.slider(side, { label: 'Rotation rate', min: 3, max: 30, step: 1, value: 12, unit: 'rpm', onInput: v => { st.rpm = v; } });
  EM.toggle(side, { label: 'Ground and rain clutter', checked: true, onChange: v => { st.clutter = v; } });
  EM.toggle(side, { label: 'Show track history', checked: true, onChange: v => { st.trails = v; st.tr = []; } });
  const ro = EM.readouts(side, [['res', 'Cross-range blur at max range', '', 'hot'], ['rev', 'Time between updates', '', 'cool'], ['det', 'Seen right now', '', 'good']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const bearing = t => (Math.atan2(t.x, t.y) + 2 * Math.PI) % (2 * Math.PI), range = t => Math.hypot(t.x, t.y);
  function upd() { ro.set('res', EM.len(st.Rmax * 1000 * st.bw * Math.PI / 180)); ro.set('rev', (60 / st.rpm).toFixed(1) + ' s'); const n = st.T.filter(t => range(t) < st.Rmax && t.seen > st.t - 60 / st.rpm * 1.2).length; ro.set('det', n + ' / ' + st.T.filter(t => range(t) < st.Rmax).length + ' targets'); }
  S.draw = (c, w, h) => {
    const R = Math.min(w, h) / 2 - 10, cx = w / 2, cy = h / 2, sc = R / st.Rmax;
    c.fillStyle = EM.isDark() ? '#021008' : '#e8f5ec'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); const gc = EM.isDark() ? '#3ddc97' : '#118556';
    c.strokeStyle = EM.alpha(gc, .35); c.lineWidth = 1; for (let k = 1; k <= 4; k++) { c.beginPath(); c.arc(cx, cy, R * k / 4, 0, 7); c.stroke(); EM.label(c, EM.num(st.Rmax * k / 4, 3) + ' km', cx + 4, cy - R * k / 4 + 10, EM.alpha(gc, .8), { size: 9, weight: '500' }); }
    for (let a = 0; a < 360; a += 30) { const t = EM.rad(a) - Math.PI / 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * Math.cos(t), cy + R * Math.sin(t)); c.stroke(); EM.label(c, a + '°', cx + (R + 0) * Math.cos(t) * .94, cy + R * Math.sin(t) * .94, EM.alpha(gc, .7), { size: 9, align: 'center', weight: '500' }); }
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
    // track history
    if (st.trails) { c.fillStyle = EM.alpha(gc, .35); for (const p of st.tr) c.fillRect(cx + p[0] * sc - 1, cy - p[1] * sc - 1, 2, 2); }
    // blips
    const now = st.t, period = 60 / st.rpm;
    for (const b of st.blips) { const age = (now - b.t) / (period * 1.05); if (age > 1) continue; const al = Math.pow(1 - age, 1.6) * b.a, r = b.r * sc, a0 = b.az - EM.rad(st.bw) / 2 - Math.PI / 2, a1 = b.az + EM.rad(st.bw) / 2 - Math.PI / 2; c.strokeStyle = b.clu ? EM.alpha(gc, al * .45) : EM.alpha(b.sel ? '#ffd23f' : gc, al); c.lineWidth = b.clu ? 2 : Math.max(3, 1.5 * sc * 1.2 + 2); c.beginPath(); c.arc(cx, cy, Math.max(1, r), a0, a1); c.stroke(); }
    // sweep
    const a = st.ang - Math.PI / 2, gr = c.createConicGradient ? c.createConicGradient(a - 1.0, cx, cy) : null; if (gr) { gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.16, EM.alpha(gc, .45)); gr.addColorStop(.1592, EM.alpha(gc, .45)); gr.addColorStop(.17, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a - 1.0, a + .001); c.closePath(); c.fill(); }
    c.strokeStyle = gc; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); c.stroke(); c.restore();
    c.strokeStyle = EM.alpha(gc, .8); c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
    if (st.sel >= 0) { const t = st.T[st.sel]; if (t.seen > st.t - period * 1.2) { const px = cx + t.x * sc, py = cy - t.y * sc; c.strokeStyle = '#ffd23f'; c.lineWidth = 1.5; c.strokeRect(px - 9, py - 9, 18, 18); } }
  };
  S.pointer({ down: (p) => { const R = Math.min(S.W, S.H) / 2 - 10, sc = R / st.Rmax; let best = -1, bd = 22; st.T.forEach((t, i) => { if (t.seen < st.t - 60 / st.rpm * 1.2) return; const d = Math.hypot(S.W / 2 + t.x * sc - p.x, S.H / 2 - t.y * sc - p.y); if (d < bd) { bd = d; best = i; } }); st.sel = best; showSel(); } });
  function showSel() { if (st.sel < 0) { info.innerHTML = '<h6>Identify a blip</h6>Click any lit blip. Note that conventional aircraft show up well beyond 100 km, the stealth fighter, drone and bird flock only when quite close, and the airliners’ blips are bigger because of their large RCS (not their size on the screen).'; return; } const t = st.T[st.sel], r = range(t), snr = 13 + 40 * Math.log10(st.Rdet * Math.pow(t.sig, .25) / Math.max(r, 1)); info.innerHTML = '<h6>' + t.n + '</h6>Range ' + EM.num(r, 3) + ' km, bearing ' + (bearing(t) * 180 / Math.PI).toFixed(0) + '°, speed ' + (t.v * 1000 * 3.6).toFixed(0) + ' km/h, RCS ' + EM.num(t.sig, 2) + ' m²; SNR here ≈ ' + snr.toFixed(0) + ' dB. Its detection range would be ' + EM.num(st.Rdet * Math.pow(t.sig, .25), 3) + ' km.'; }
  st.t = 0; showSel();
  EM.loop(el, (t, dt) => {
    const prev = st.ang; st.ang = (st.ang + dt * st.rpm / 60 * 2 * Math.PI) % (2 * Math.PI); st.t += dt;
    for (const tg of st.T) { tg.x += Math.sin(tg.hdg) * tg.v * dt * 25; tg.y += Math.cos(tg.hdg) * tg.v * dt * 25; if (Math.hypot(tg.x, tg.y) > 260 || (EM.rand() < .0008)) { tg.hdg += 2.4 + EM.rand() * 1.2; tg.x *= .97; tg.y *= .97; } }       // time-lapse
    // detections: beam crossing
    const bwr = EM.rad(st.bw) / 2, a0 = prev, a1 = st.ang;
    for (const tg of st.T) { const r = range(tg); if (r > st.Rmax) continue; const az = bearing(tg); let d = Math.abs(((az - st.ang + Math.PI * 3) % (2 * Math.PI)) - Math.PI); if (d < bwr + EM.rad(.5) && st.t - tg.last > 60 / st.rpm * .5) { const snr = 13 + 40 * Math.log10(st.Rdet * Math.pow(tg.sig, .25) / r), pd = 1 / (1 + Math.exp(-(snr - 9) / 2.2)); tg.last = st.t; if (EM.rand() < pd) { tg.seen = st.t; st.blips.push({ t: st.t, r, az: st.ang, a: EM.clamp(.5 + snr / 40, .55, 1), sel: st.T.indexOf(tg) === st.sel }); if (st.trails) st.tr.push([tg.x, tg.y]); } } }
    // clutter & noise
    if (st.clutter) { for (let i = 0; i < 3; i++) if (EM.rand() < .9) { const rr = Math.pow(EM.rand(), 1.8) * 18; st.blips.push({ t: st.t, r: rr, az: st.ang, a: .7, clu: true }); } const wr = 55 + 25 * EM.rand(), waz = EM.rad(60) + (EM.rand() - .5) * EM.rad(26); if (EM.rand() < .6) st.blips.push({ t: st.t, r: wr, az: waz, a: .6, clu: true }); }
    if (EM.rand() < .06) st.blips.push({ t: st.t, r: EM.rand() * st.Rmax, az: st.ang, a: .5, clu: true });
    if (st.blips.length > 2500) st.blips.splice(0, st.blips.length - 2500); if (st.tr.length > 900) st.tr.splice(0, st.tr.length - 900);
    upd(); S.redraw();
  });
  upd();
});
