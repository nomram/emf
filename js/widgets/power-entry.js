/* power-entry — how can you power or charge a device inside a shielded enclosure? ranked options */
EM.register('power-entry', function (el) {
  const W = EM.widget(el, { title: 'How do I charge something inside a Faraday cage?', badge: 'Decide',
    note: 'Set how much power the device needs, for how long, and how much shielding you must keep. The options are ranked with their typical limits. Rule: the shield must stay <b>unbroken</b>, so everything that crosses the wall is either <em>non-conducting</em> (fibre, tube, light, sound), <em>filtered</em> (every wire), or <em>stays inside</em> (a battery).' });
  const { main, side } = W.grid('wide-side');
  const st = { P: 10, h: 8, se: 100 };
  const list = EM.h('div', { style: { display: 'grid', gap: '8px' } }); main.append(list);
  EM.slider(side, { label: 'Power the device needs', min: .001, max: 1e4, log: true, value: 10, fmt: v => EM.si(v, 'W'), onInput: v => { st.P = v; upd(); } });
  EM.slider(side, { label: 'Running time between charges', min: .1, max: 1000, log: true, value: 8, fmt: v => EM.num(v, 3) + ' h', onInput: v => { st.h = v; upd(); } });
  EM.slider(side, { label: 'Shielding you must keep', min: 40, max: 140, step: 1, value: 100, unit: 'dB', onInput: v => { st.se = v; upd(); } });
  const ro = EM.readouts(side, [['E', 'Energy needed', '', 'fuel'], ['bm', 'Li-ion battery for that', '', 'cool']]);
  const info = EM.h('div', { class: 'info-box' }); side.append(info);
  const OPT = [
    ['Sealed battery, charged outside', st => { const m = st.P * st.h / 200; return [m < 3 ? 3 : m < 30 ? 2 : m < 300 ? 1 : 0, 'Energy ' + EM.num(st.P * st.h, 3) + ' Wh needs about ' + EM.num(m, 2) + ' kg of Li-ion (200 Wh/kg). Zero holes in the wall; the cage stays perfect. To recharge you must open the cage, or use one of the options below.']; }],
    ['Filtered power line at a penetration panel', st => [st.se <= 80 ? 3 : st.se <= 110 ? 2 : 1, 'Mains or DC through feedthrough filters or two-stage filters mounted <b>through</b> the wall, with the panel bonded all round. The standard in shielded rooms. Efficiency about 99 %. Realistic SE up to roughly 100–120 dB with care; leakage-current limits cap the capacitors, so much of the filtering is by chokes (see the filter widget).']],
    ['Shielded isolation transformer + filters', st => [st.P > 30000 ? 1 : st.se <= 100 ? 3 : 2, 'A transformer with an electrostatic screen between windings blocks common-mode noise and gives electrical isolation (safety, no ground loops). Efficiency 95–98 %. A favourite for medical, EMC test labs and secure rooms; add filters on both sides.']],
    ['Power-over-fibre (laser + photovoltaic converter)', st => [st.P <= 2 ? 3 : st.P <= 15 ? 2 : st.P <= 60 ? 1 : 0, 'A laser outside feeds light down a fibre; a photovoltaic cell inside converts it to electricity. The fibre passes through a below-cutoff tube, so the wall stays intact: shielding is effectively unlimited. Total efficiency only about 15–30 % and practical power is a few watts, but it also gives complete electrical isolation (used in high-voltage substations, MRI rooms, sensors in explosive atmospheres).']],
    ['Ultrasonic power through the wall', st => [st.P <= 5 ? 2 : st.P <= 50 ? 1 : 0, 'Two piezoelectric transducers, glued to both sides of an <em>intact</em> metal wall, send mechanical vibration through it. No hole, so SE is unaffected. Research and a few products (through-hull sensors, sealed vessels): tens of watts at best, efficiency 30–50 %.']],
    ['Inductive / wireless charging across a gap', st => [st.se <= 30 ? 2 : 0, 'A coil outside and a coil inside need the <b>magnetic field to cross the wall</b>, which is exactly what the shield is meant to stop: if it works, the shield is not shielding at that frequency. A thick steel or aluminium wall blocks 100 kHz fields; only a non-conducting window works, and then it is a hole. Valid when the “cage” is only meant to block radio, not low-frequency fields.']],
    ['A bare cable through a hole', st => [0, 'Gives noise or a pulse a direct path inside: the cage is pointless. Never do this. Even a cable that you only use for charging is a long antenna (chapter 16).']],
  ];
  const col = ['bad', 'acc2', 'warn', 'ok'], lab = ['No', 'Poor', 'Possible', 'Good fit'];
  function upd() {
    const E = st.P * st.h; ro.set('E', EM.num(E, 3), 'Wh'); ro.set('bm', EM.num(E / 200, 3), 'kg');
    const res = OPT.map(o => { const r = o[1](st); return { n: o[0], s: r[0], t: r[1] }; }).sort((a, b) => b.s - a.s);
    list.innerHTML = res.map(r => '<div style="border:1px solid color-mix(in srgb,var(--' + col[r.s] + ') 50%,var(--line));background:color-mix(in srgb,var(--' + col[r.s] + ') 8%,var(--panel));border-radius:12px;padding:10px 14px"><div style="display:flex;gap:10px;align-items:center;margin-bottom:4px"><b style="color:var(--text)">' + r.n + '</b><span class="chip" style="color:var(--' + col[r.s] + ');border-color:var(--' + col[r.s] + ')">' + lab[r.s] + '</span></div><div style="font-size:.88rem;color:var(--text-2);line-height:1.5">' + r.t + '</div></div>').join('');
    info.innerHTML = '<h6>Practical answer</h6>' + (st.P <= 2 ? 'A few watts: <b>power-over-fibre</b> or a battery keep the wall perfect.' : st.P <= 5000 ? 'Tens of watts to kilowatts: a <b>filtered penetration panel with an isolation transformer</b>, bonded to the wall all round, is the proven way.' : 'Very high power: filtering gets bulky; consider placing the power equipment outside with a short, filtered, shielded feed.') + ' For data, use <b>fibre</b>. In everyday life, “charging a phone in a Faraday cage” means a cable to the outside, so the cage leaks along the cable.';
  }
  upd();
});
