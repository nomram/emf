/* wave-calc — type a frequency, wavelength or photon energy; the others follow. Medium changes wavelength, not frequency. */
EM.register('wave-calc', function (el) {
  const W = EM.widget(el, { title: 'Converter: frequency ↔ wavelength ↔ photon energy', badge: 'Calculate',
    note: '$\\lambda=v/f=c/(nf)$ and $E=hf$. In a medium the frequency stays the same but the wavelength shrinks by the refractive index $n$ (that is why a half-wave antenna is shorter when it is immersed or coated).' });
  const h = EM.h, c0 = EM.C.c;
  const U = { f: [['Hz', 1], ['kHz', 1e3], ['MHz', 1e6], ['GHz', 1e9], ['THz', 1e12], ['PHz', 1e15], ['EHz', 1e18]], l: [['km', 1e3], ['m', 1], ['cm', 1e-2], ['mm', 1e-3], ['µm', 1e-6], ['nm', 1e-9], ['pm', 1e-12]], e: [['µeV', 1e-6], ['meV', 1e-3], ['eV', 1], ['keV', 1e3], ['MeV', 1e6]] };
  const MED = [['Vacuum / air', 1], ['Water (visible) n=1.33', 1.33], ['Glass n=1.5', 1.5], ['Silicon (IR) n=3.5', 3.5], ['Seawater at 100 MHz n≈9', 9], ['PCB (FR-4) at 2 GHz n≈2.1', 2.1]];
  const wrap = h('div', { class: 'wgrid even' }); W.body.append(wrap);
  const left = h('div', { class: 'ctls' }), right = h('div', { class: 'ctls' }); wrap.append(left, right);
  const rows = {};
  function row(key, label, def, unit) {
    const inp = h('input', { type: 'number', step: 'any', value: def }), sel = h('select', null, ...U[key].map(([n]) => h('option', { value: n, text: n })));
    sel.value = unit; const box = h('div', { class: 'ctl' }, h('label', { text: label }), h('span'), h('div', { style: { gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '1fr 90px', gap: '8px' } }, inp, sel));
    left.append(box); rows[key] = { inp, sel };
    const go = () => calc(key); inp.addEventListener('input', go); sel.addEventListener('change', go);
  }
  row('f', 'Frequency', 2.4, 'GHz'); row('l', 'Wavelength (in the medium)', 12.5, 'cm'); row('e', 'Photon energy', 9.9, 'µeV');
  const med = EM.select(left, { label: 'Medium', options: MED.map((m, i) => [i, m[0]]), value: 0, onChange: () => calc('f') });
  const ro = EM.readouts(right, [['vac', 'Vacuum wavelength', '', 'cool'], ['half', 'Half-wave antenna', '', 'fuel'], ['band', 'Band', '', ''], ['temp', 'E / k_B as a temperature', '', 'hot']]);
  const note = h('div', { class: 'info-box' }); right.append(note);
  const val = (k) => (parseFloat(rows[k].inp.value) || 0) * U[k].find(u => u[0] === rows[k].sel.value)[1];
  const put = (k, v) => { const us = U[k]; let best = us[0]; for (const u of us) if (v / u[1] >= 1 && v / u[1] < 1000) best = u; if (v / us[0][1] < 1) best = us[0]; if (k === 'l') { for (const u of us) if (v / u[1] >= 1) { best = u; break; } if (v < 1e-12) best = us[us.length - 1]; } if (k === 'e') { best = us[2]; for (const u of us) if (v / u[1] >= 1 && v / u[1] < 1000) best = u; } rows[k].sel.value = best[0]; rows[k].inp.value = +(v / best[1]).toPrecision(4); };
  function calc(src) {
    const n = MED[+med.get()][1]; let f;
    if (src === 'f') f = val('f'); else if (src === 'l') f = c0 / (n * val('l')); else f = val('e') * EM.C.e / EM.C.h;
    if (!(f > 0) || !isFinite(f)) return;
    if (src !== 'f') put('f', f); if (src !== 'l') put('l', c0 / (n * f)); if (src !== 'e') put('e', EM.C.h * f / EM.C.e);
    const lam0 = c0 / f; ro.set('vac', EM.len(lam0)); ro.set('half', EM.len(lam0 / n / 2)); ro.set('temp', EM.si(EM.C.h * f / EM.C.kB, 'K'));
    ro.set('band', f < 3e3 ? 'ELF–ULF' : f < 3e4 ? 'VLF' : f < 3e5 ? 'LF' : f < 3e6 ? 'MF' : f < 3e7 ? 'HF' : f < 3e8 ? 'VHF' : f < 3e9 ? 'UHF' : f < 3e10 ? 'SHF' : f < 3e11 ? 'EHF' : f < 1e13 ? 'THz' : f < 4e14 ? 'Infrared' : f < 7.9e14 ? 'Visible' : f < 3e16 ? 'UV' : f < 3e19 ? 'X-ray' : 'Gamma');
    note.innerHTML = '<h6>Check</h6>$c=f\\lambda$: ' + EM.freq(f) + ' × ' + EM.len(lam0 / n) + ' = ' + EM.si(f * lam0 / n, 'm/s') + (n > 1 ? ' (= c/n)' : '') + '. The third number, $E/k_B$, is the temperature at which thermal jiggle energy equals one photon: at 2.4 GHz it is only 0.1 K, so a Wi-Fi photon is utterly dwarfed by room-temperature noise (300 K).';
    if (window.renderMath) window.renderMath(note);
  }
  calc('f');
});
