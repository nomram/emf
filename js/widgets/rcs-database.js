/* rcs-database — published (open-literature) radar cross sections, and how far several public radars could see each target */
EM.register('rcs-database', function (el) {
  const W = EM.widget(el, { title: 'Real-world radar cross sections (open sources) and who can see them', badge: 'Data',
    note: 'Values are <b>typical microwave-band figures from public textbooks and papers</b> (Skolnik’s table reproduced in many lecture notes; automotive and drone measurements from open papers; media-quoted claims for stealth aircraft are flagged because they are <em>unverified</em>). RCS changes by 10–30 dB with frequency, aspect and polarisation, so treat each bar as a range. Detection ranges use the radar equation of chapter 12 with approximate public radar parameters.' });
  const h = EM.h;
  const D = [
    ['Insect (locust to fly)', 'nature', 1e-5, 1e-4, 'Skolnik: 10⁻⁵ m². Rayleigh-region scatterer: visible to short-wavelength radars.', 'typical'],
    ['Small bird (sparrow, starling)', 'nature', 1e-3, 1e-2, 'Published bird-radar studies give about 10⁻³–10⁻² m² at X-band.', 'typical'],
    ['Large bird (gull, goose)', 'nature', 1e-2, 5e-2, 'Skolnik: 0.01 m². Flocks add up.', 'typical'],
    ['Person (walking)', 'ground', .3, 1.5, 'Skolnik: 1 m² (1–4 m² depending on frequency in other tables). Automotive 77 GHz literature: −8 to 0 dBsm for pedestrians.', 'typical'],
    ['Bicycle / cyclist', 'ground', 1, 5, 'Skolnik: 2 m². Automotive radar: about 0–7 dBsm.', 'typical'],
    ['Motorcycle', 'ground', 3, 10, 'Automotive-radar literature, 77 GHz.', 'typical'],
    ['Automobile (rear view)', 'ground', 10, 200, 'Skolnik: 100 m². Automotive radar at 77 GHz: 10–20 dBsm.', 'typical'],
    ['Pickup truck', 'ground', 100, 300, 'Skolnik: 200 m².', 'typical'],
    ['Truck / bus (rear)', 'ground', 100, 1000, 'Automotive-radar literature: 20–30 dBsm.', 'typical'],
    ['Small boat (open)', 'sea', .02, .1, 'Skolnik: 0.02 m²; very hard to see in sea clutter.', 'typical'],
    ['Small pleasure boat', 'sea', 1, 4, 'Skolnik: 2 m².', 'typical'],
    ['Cabin cruiser', 'sea', 5, 20, 'Skolnik: 10 m².', 'typical'],
    ['Coastal freighter / large ship', 'sea', 1e3, 1e5, 'Large vessels: 10³–10⁵ m² (many flat metal faces and corners).', 'typical'],
    ['Small drone (quadcopter, 30 cm)', 'air', 5e-3, 5e-2, 'Open measurements of consumer quadcopters at X-band: about 0.01–0.03 m² (−20 to −15 dBsm); rotor blades add micro-Doppler.', 'measured'],
    ['Small single-engine aircraft', 'air', 1, 3, 'Skolnik: 1 m².', 'typical'],
    ['Small fighter / four-passenger jet', 'air', 2, 6, 'Skolnik: 2 m². Frontal values much lower, for shaped designs.', 'typical'],
    ['Large fighter (conventional)', 'air', 3, 10, 'Skolnik: 6 m².', 'typical'],
    ['Conventional winged missile', 'air', .1, 1, 'Skolnik: 0.5 m².', 'typical'],
    ['Medium bomber / medium airliner', 'air', 10, 30, 'Skolnik: 20 m².', 'typical'],
    ['Large airliner / bomber', 'air', 25, 60, 'Skolnik: 40 m².', 'typical'],
    ['Jumbo jet (Boeing 747)', 'air', 60, 150, 'Skolnik: 100 m².', 'typical'],
    ['Stealth bomber (public claims)', 'claim', .01, .75, 'Open-literature estimates for the B-2 are widely quoted around 0.1 m²; not officially confirmed.', 'claim'],
    ['Early stealth attack aircraft (public claims)', 'claim', .01, .1, 'F-117: about 0.025 m² is the figure quoted in open sources; unverified.', 'claim'],
    ['Modern stealth fighters (public claims)', 'claim', 1e-4, 5e-3, 'Media quote “marble to golf ball” sizes (0.0001–0.005 m²) for the F-22 and F-35. Highly uncertain; frontal sector, specific bands only.', 'claim'],
    ['Metal sphere, radius 10 cm (calibration)', 'ref', .0314, .0314, 'πr² in the optical region: 0.031 m² (computed).', 'computed'],
    ['Metal sphere, radius 1 m (calibration)', 'ref', 3.14, 3.14, 'πr²: 3.14 m² (computed).', 'computed'],
    ['Trihedral corner, edge 30 cm at 10 GHz', 'ref', 37.7, 37.7, '4πa⁴/3λ²: 37.7 m² (computed): marine “radar reflector” principle.', 'computed'],
    ['Marine radar reflector (octahedral)', 'ref', 5, 20, 'Commercial marine reflectors specify 2–20 m² at 9.4 GHz.', 'typical'],
    ['CubeSat (10×10×10 cm) in orbit', 'space', .01, .1, 'Small satellites: of order 10⁻²–10⁻¹ m²; detectability limits the tracking of debris below about 10 cm by ground radars.', 'typical'],
    ['Orbital debris, 10 cm', 'space', .005, .05, 'US Space Surveillance Network tracks objects down to about 10 cm in low orbit.', 'typical'],
    ['Large satellite / rocket body', 'space', 5, 100, 'Large satellites and spent stages: 5–100 m² depending on shape and aspect.', 'typical'],
  ];
  const R = [
    ['NEXRAD WSR-88D (S-band weather)', 750e3, 45.5, 2.85e9, 6.4e5, 3, 3, 'NOAA technical data: 750 kW peak at the transmitter, 45.5 dBi gain, 0.925° beam, 8.5 m dish; pulse 1.57 µs. Built for rain, but let’s ask what it would see.'],
    ['Airport surveillance (ASR-9-class, S-band)', 1.1e6, 33.5, 2.8e9, 1e6, 4, 4, 'Public figures for ASR-9-class radars: about 1 MW peak, ≈ 34 dBi fan beam; advertised range ≈ 60 nmi (111 km). Approximate.'],
    ['Marine navigation radar (X-band, 25 kW)', 25e3, 31, 9.4e9, 2e6, 5, 3, 'Typical commercial 25 kW X-band with a 2.4 m scanner: about 30 dBi, 0.5 µs pulse.'],
    ['Small X-band surveillance radar (illustrative)', 100, 25, 9.6e9, 2e6, 4, 3, 'Illustrative compact radar with 100 W peak, 25 dBi; chosen to represent drone/bird-sized sensors, not a specific product.'],
    ['Automotive long-range radar (77 GHz FMCW)', .01, 28, 77e9, 5e3, 12, 6, 'Typical: ~10 dBm transmit, ≈ 28 dBi antenna, narrow FFT bin; spec range ≈ 250 m.'],
  ];
  const st = { cat: 'all', r: 0, snr: 13, sel: 0 };
  const cats = [['all', 'All'], ['nature', 'Nature'], ['ground', 'Ground'], ['sea', 'Sea'], ['air', 'Air'], ['space', 'Space'], ['ref', 'Reflectors'], ['claim', 'Stealth claims']];
  const tabs = EM.tabs(W.body, cats, 'all', v => { st.cat = v; st.sel = 0; upd(); });
  const sel = EM.select(W.body, { label: 'Radar to test against', options: R.map((r, i) => [i, r[0]]), value: 0, onChange: v => { st.r = +v; upd(); } }); sel.el.style.marginTop = '6px';
  const rinfo = h('div', { class: 'muted', style: { margin: '2px 0 8px' } }); W.body.append(rinfo);
  const S = EM.canvas(W.body, { height: 420, cursor: 'pointer' }); const tbl = h('div', { class: 'table-wrap' }); W.body.append(tbl);
  const info = h('div', { class: 'info-box', style: { marginTop: '10px' } }); W.body.append(info);
  const vis = () => D.filter(d => st.cat === 'all' || d[1] === st.cat).sort((a, b) => Math.sqrt(a[2] * a[3]) - Math.sqrt(b[2] * b[3]));
  function rmax(r, sig) { const lam = EM.C.c / r[3], G = Math.pow(10, r[2] / 10), sm = EM.C.kB * 290 * r[4] * Math.pow(10, r[5] / 10) * Math.pow(10, st.snr / 10); return Math.pow(r[1] * G * G * lam * lam * sig / (Math.pow(4 * Math.PI, 3) * sm * Math.pow(10, r[6] / 10)), .25); }
  const gm = d => Math.sqrt(d[2] * d[3]);
  const badge = c => ({ typical: 'chip ok', measured: 'chip ok', computed: 'chip b', claim: 'chip bad' }[c] || 'chip');
  function upd() {
    const R0 = R[st.r], L = vis(); rinfo.innerHTML = R0[7] + '  <b>SNR needed:</b> ' + st.snr + ' dB.';
    let html = '<table class="data"><tr><th>Target</th><th class="num">RCS (m²)</th><th class="num">dBsm</th><th class="num">Detected out to</th><th>Source quality</th></tr>';
    L.forEach((d, i) => { const g = gm(d), rr = rmax(R0, g); html += '<tr data-i="' + i + '" style="cursor:pointer' + (i === st.sel ? ';background:color-mix(in srgb,var(--acc3) 14%,transparent)' : '') + '"><td>' + d[0] + '</td><td class="num">' + (d[2] === d[3] ? EM.num(d[2], 3) : EM.num(d[2], 2) + ' – ' + EM.num(d[3], 2)) + '</td><td class="num">' + (d[2] === d[3] ? EM.fixed(10 * Math.log10(d[2]), 0) : EM.fixed(10 * Math.log10(d[2]), 0) + ' … ' + EM.fixed(10 * Math.log10(d[3]), 0)) + '</td><td class="num">' + EM.len(rr) + '</td><td><span class="' + badge(d[5]) + '">' + d[5] + '</span></td></tr>'; });
    tbl.innerHTML = html + '</table>'; tbl.querySelectorAll('tr[data-i]').forEach(tr => tr.addEventListener('click', () => { st.sel = +tr.dataset.i; upd(); }));
    const d = L[Math.min(st.sel, L.length - 1)]; if (d) info.innerHTML = '<h6>' + d[0] + '</h6>' + d[4] + ' <b>With ' + R0[0] + ':</b> detection range ≈ ' + EM.len(rmax(R0, d[2])) + ' (at the low end of the RCS range) to ' + EM.len(rmax(R0, d[3])) + ' (at the high end), in clear air, ignoring clutter, curvature and multipath.' + (d[5] === 'claim' ? ' <b>Treat as unverified:</b> real RCS of stealth aircraft is classified and depends strongly on direction and radar band.' : ''); S.redraw();
  }
  S.draw = (c, w, hh) => {
    const L = vis(), m = { l: 210, r: 14, t: 14, b: 34 }, P = EM.plot(c, { x: m.l, y: m.t, w: w - m.l - m.r, h: hh - m.t - m.b }, { xmin: 1e-5, xmax: 1e5, xlog: true, ymin: 0, ymax: 1, yticks: [], xlabel: 'radar cross section (m²)', xfmt: v => EM.num(v, 1) });
    P.grid(); const rh = P.box.h / Math.max(L.length, 1);
    L.forEach((d, i) => { const y = P.box.y + i * rh, on = i === st.sel, col = d[5] === 'claim' ? EM.col('bad') : d[5] === 'computed' ? EM.col('acc') : d[1] === 'nature' ? EM.col('ok') : d[1] === 'sea' ? EM.col('acc') : d[1] === 'space' ? EM.col('violet') : d[1] === 'air' ? EM.col('acc2') : EM.col('acc3'); const x1 = P.X(d[2]), x2 = P.X(d[3]); c.fillStyle = EM.alpha(col, on ? 1 : .75); c.beginPath(); c.roundRect(x1 - (x2 - x1 < 5 ? 3 : 0), y + 3, Math.max(6, x2 - x1), rh - 7, 4); c.fill(); c.fillStyle = on ? EM.col('text') : EM.col('text-2'); c.font = EM.font(11, on ? '700' : '500'); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(d[0].length > 34 ? d[0].slice(0, 33) + '…' : d[0], m.l - 8, y + rh / 2); });
    for (const [n, v] of [['0 dBsm = 1 m²', 1]]) { P.vline(v, EM.alpha(EM.col('text'), .35), 1, [4, 4]); EM.label(c, n, P.X(v) + 4, P.box.y + P.box.h - 8, EM.col('muted'), { size: 9 }); }
    S.layout = { y0: P.box.y, rh, n: L.length };
  };
  S.pointer({ down: p => { const l = S.layout, i = Math.floor((p.y - l.y0) / l.rh); if (i >= 0 && i < l.n) { st.sel = i; upd(); } } });
  EM.slider(W.body, { label: 'Required signal-to-noise for detection', min: 6, max: 20, step: 1, value: 13, unit: 'dB', onInput: v => { st.snr = v; upd(); } });
  upd();
});
