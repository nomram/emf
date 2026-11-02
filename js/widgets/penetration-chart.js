/* penetration-chart — whole-spectrum qualitative map: which band passes through which material */
EM.register('penetration-chart', function (el) {
  const W = EM.widget(el, { title: 'What passes through what: the whole spectrum', badge: 'Explore',
    note: 'Typical everyday thicknesses (a window pane, a wall, a metre of soil, a body). <b>Click any cell</b> for the reason. Colours: green passes, yellow partly, orange mostly blocked, red blocked. This is a guide, not a calculation: use the slab calculator above for numbers.' });
  const h = EM.h;
  const COLS = [['ELF–VLF', '< 30 kHz'], ['MF–HF', '0.3–30 MHz'], ['VHF', '30–300 MHz'], ['UHF', '0.3–3 GHz'], ['SHF', '3–30 GHz'], ['EHF', '30–300 GHz'], ['THz', '0.3–10 THz'], ['IR', 'heat & near IR'], ['Visible', '380–750 nm'], ['UV', '10–380 nm'], ['X-ray', 'keV'], ['Gamma', 'MeV']];
  const ROWS = [
    ['Window glass (6 mm)', [3, 3, 3, 3, 3, 2, 1, 1, 3, 1, 2, 3], 'Glass has no radio absorption to speak of (only coatings: low-E and car-window coatings can cut 2–5 GHz by 20 dB). Its band gap (~9 eV) makes it clear to visible light, but ordinary glass absorbs thermal infrared (beyond ≈ 4 µm) and UV-B/UV-C. Thin glass hardly stops X-rays; lead glass does.'],
    ['Clear plastic (PE, acrylic)', [3, 3, 3, 3, 3, 3, 2, 1, 2, 1, 3, 3], 'Plastics are very good insulators with tiny loss: radomes (radar covers) are made of them for exactly that reason. Clear ones pass light; opaque pigmented ones block it. They absorb infrared by molecular vibrations.'],
    ['Wood / drywall (1–4 cm)', [3, 3, 3, 3, 3, 2, 1, 0, 0, 0, 3, 3], 'Dry, low-density materials: about 1 dB per wall at Wi-Fi. At 60 GHz and above they start to absorb. Damp wood is worse. Opaque to light and heat.'],
    ['Brick / concrete wall (20 cm)', [3, 3, 2, 2, 1, 0, 0, 0, 0, 0, 1, 1], 'Absorption grows with frequency (5–15 dB at 2.4 GHz, 20–40 dB at 28 GHz). Reinforced concrete with a rebar mesh is much worse, since the mesh acts as a Faraday cage for wavelengths shorter than its spacing. X-rays and gamma need thick concrete to stop them.'],
    ['Moist soil (1 m)', [3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1], 'Soil is conductive: skin depth = 1/α falls with frequency. ELF/VLF penetrate tens of metres (through-earth mine radio); at VHF/UHF ground-penetrating radar sees a few metres at best; at GHz the signal dies in a fraction of a metre (GPS does not work underground). Wet clay is much worse than dry sand.'],
    ['Dry rock', [3, 3, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1], 'Dry, low-conductivity rock (granite) lets radio waves through much better than soil: radar sounders see tens to hundreds of metres. Water in cracks ruins it. Opaque to everything above the radio range.'],
    ['Glacier ice (kilometres)', [3, 3, 3, 3, 2, 1, 0, 1, 2, 1, 3, 3], 'Cold glacial ice is the most radio-transparent natural solid: radar at 60 MHz maps ice sheets over 3 km thick. Thick ice is also transparent to visible light (blue). Liquid water is a completely different story.'],
    ['Seawater (metres)', [2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 1], 'Salt water conducts (σ ≈ 4 S/m), so the wave decays within a skin depth that is ≈ 250/√f metres: 30 m at 76 Hz, 1.6 m at 25 kHz, 3 cm at 100 MHz. Only ELF/VLF get any distance. Visible blue–green is the exception (~100 m, because water’s absorption has a minimum there). Almost nothing else passes.'],
    ['Human body', [3, 2, 2, 1, 1, 0, 0, 1, 1, 0, 3, 3], 'Static and ELF magnetic fields pass through nearly unchanged. At VHF the body absorbs strongly near its resonance (~70 MHz). At cell-phone frequencies penetration is a few centimetres; at 30 GHz+ a millimetre. Red and near-infrared light leaks through a finger. X-rays and gamma pass (that is how medical imaging works).'],
    ['Metal sheet / foil', [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3], 'Metals reflect radio waves and light (the skin depth is micrometres). A thin sheet barely stops slowly-changing magnetic fields (ELF/VLF) but any closed metal box shields electric fields. X-rays pass through thin foil; thick lead stops them.'],
    ['Clear atmosphere (to space)', [3, 1, 3, 3, 3, 2, 1, 2, 3, 1, 0, 0], 'The ionosphere reflects HF/MF back down (that is why shortwave goes round the world, but cannot reach satellites). VHF–SHF pass freely, the “radio window”. Oxygen (60 GHz) and water vapour (22, 183 GHz and THz) absorb; ozone blocks UV-C; the atmosphere stops X-rays and gamma rays, so X-ray telescopes must be in space.'],
    ['Rain / fog / cloud', [3, 3, 3, 3, 2, 1, 0, 0, 1, 1, 3, 3], 'Raindrops (mm size) scatter and absorb waves with wavelengths of a few mm to cm: heavy rain costs 1 dB/km at 10 GHz and 10 dB/km at 60 GHz. Cloud droplets block light and thermal IR but not microwaves below 10 GHz: that is why weather satellites and radar work.'],
  ];
  const LV = [['Blocked', 'bad'], ['Mostly blocked', 'acc2'], ['Partly passes', 'warn'], ['Passes', 'ok']];
  const wrap = h('div', { class: 'table-wrap', style: { margin: 0 } });
  const tbl = h('table', { class: 'data', style: { fontSize: '.8rem', minWidth: '720px' } });
  const head = h('tr', null, h('th', { text: '' }), ...COLS.map(c => h('th', { style: { textAlign: 'center', padding: '6px 3px' } }, h('div', { text: c[0] }), h('div', { class: 'muted', style: { fontSize: '.62rem', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }, text: c[1] }))));
  tbl.append(head);
  const info = h('div', { class: 'info-box', style: { marginTop: '12px' } }), cells = [];
  function show(r, c) { cells.forEach(x => x.style.outline = ''); cells[r * COLS.length + c].style.outline = '2px solid var(--acc3)'; const lv = ROWS[r][1][c]; info.innerHTML = '<h6>' + ROWS[r][0] + ' · ' + COLS[c][0] + ' (' + COLS[c][1] + '): ' + LV[lv][0] + '</h6>' + ROWS[r][2]; }
  ROWS.forEach((row, r) => {
    const tr = h('tr', null, h('td', { style: { fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', padding: '6px 10px' }, text: row[0] }));
    row[1].forEach((lv, c) => { const td = h('td', { title: row[0] + ' · ' + COLS[c][0] + ': ' + LV[lv][0], style: { cursor: 'pointer', padding: 0, textAlign: 'center', background: 'color-mix(in srgb, var(--' + LV[lv][1] + ') ' + (lv === 0 ? 38 : 26) + '%, var(--panel))', borderLeft: '2px solid var(--panel)' }, onclick: () => show(r, c) }, h('div', { style: { padding: '9px 2px', fontWeight: 800, color: 'var(--' + LV[lv][1] + ')' }, text: ['✕', '▾', '◐', '✓'][lv] })); cells.push(td); tr.append(td); });
    tbl.append(tr);
  });
  wrap.append(tbl);
  const legend = h('div', { class: 'legend', style: { margin: '0 0 10px' } }, ...LV.map((l, i) => h('span', null, h('i', { style: { background: 'var(--' + l[1] + ')', width: '14px', height: '10px' } }), ['✕ ', '▾ ', '◐ ', '✓ '][i] + l[0])));
  W.body.append(legend, wrap, info); show(3, 4);
});
