/* maxwell-cards — the four equations, in words, in symbols, with what each one gives you */
EM.register('maxwell-cards', function (el) {
  const W = EM.widget(el, { title: 'Maxwell’s four equations, one at a time', badge: 'Explore', note: 'Click a card. Every device in this guide (motors, transformers, antennas, radar) is one of these four lines at work.' });
  const EQ = [
    { k: 'gauss', t: 'Gauss: charge makes E', words: 'Electric field lines start on positive charge and end on negative charge. The total field flowing out of any closed surface equals the enclosed charge (divided by ε₀).',
      i: '\\oint\\vec E\\cdot d\\vec A=\\dfrac{Q}{\\varepsilon_0}', d: '\\nabla\\cdot\\vec E=\\dfrac{\\rho}{\\varepsilon_0}', use: 'Why a charged balloon sticks to a wall. Why a metal box shields its inside from static fields. The $1/r^2$ of a point charge.', draw: (s, ns) => { for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; s.append(ns('line', { x1: 50 + 10 * Math.cos(t), y1: 40 + 10 * Math.sin(t), x2: 50 + 32 * Math.cos(t), y2: 40 + 32 * Math.sin(t), stroke: 'var(--acc2)', 'stroke-width': 2.2, 'marker-end': 'url(#ah-o)' })); } s.append(ns('circle', { cx: 50, cy: 40, r: 8, fill: 'var(--acc3)' })); } },
    { k: 'gaussB', t: 'Gauss for B: no magnetic charges', words: 'Magnetic field lines never start or stop: they always close into loops. Cut a magnet in half and you get two magnets, never a lone “north”.',
      i: '\\oint\\vec B\\cdot d\\vec A=0', d: '\\nabla\\cdot\\vec B=0', use: 'Why every magnet has two poles. Why field lines of a coil close on themselves (chapter 2).', draw: (s, ns) => { s.append(ns('ellipse', { cx: 50, cy: 40, rx: 34, ry: 18, fill: 'none', stroke: 'var(--acc)', 'stroke-width': 2.2 })); s.append(ns('ellipse', { cx: 50, cy: 40, rx: 22, ry: 10, fill: 'none', stroke: 'var(--acc)', 'stroke-width': 2.2 })); s.append(ns('rect', { x: 38, y: 35, width: 12, height: 10, fill: 'var(--bad)' })); s.append(ns('rect', { x: 50, y: 35, width: 12, height: 10, fill: 'var(--acc)' })); } },
    { k: 'faraday', t: 'Faraday: changing B makes E', words: 'A changing magnetic flux through a loop pushes charge round the loop: an EMF equal to the rate of change of flux (and Lenz’s minus sign makes it oppose the change).',
      i: '\\oint\\vec E\\cdot d\\vec l=-\\dfrac{d\\Phi_B}{dt}', d: '\\nabla\\times\\vec E=-\\dfrac{\\partial\\vec B}{\\partial t}', use: 'Generators, transformers, induction cooktops, wireless charging, the receiving loop in an antenna.', draw: (s, ns) => { s.append(ns('ellipse', { cx: 50, cy: 40, rx: 32, ry: 22, fill: 'none', stroke: 'var(--acc2)', 'stroke-width': 2.4, 'stroke-dasharray': '1 0' })); const tx = ns('text', { x: 50, y: 45, 'text-anchor': 'middle', fill: 'var(--acc)', 'font-size': 20, 'font-weight': 800 }); tx.textContent = 'dB/dt'; s.append(tx); } },
    { k: 'ampere', t: 'Ampère–Maxwell: current and changing E make B', words: 'A current makes a circulating magnetic field (Ampère, 1820). Maxwell added the missing half in 1865: a changing electric field also makes a magnetic field, as if it were a current (“displacement current”).',
      i: '\\oint\\vec B\\cdot d\\vec l=\\mu_0\\left(I+\\varepsilon_0\\dfrac{d\\Phi_E}{dt}\\right)', d: '\\nabla\\times\\vec B=\\mu_0\\vec J+\\mu_0\\varepsilon_0\\dfrac{\\partial\\vec E}{\\partial t}', use: 'Why current “flows” through a capacitor’s gap. And the key to waves: a changing E makes B, a changing B makes E, forever.', draw: (s, ns) => { s.append(ns('rect', { x: 22, y: 20, width: 6, height: 40, fill: 'var(--acc2)' })); s.append(ns('rect', { x: 72, y: 20, width: 6, height: 40, fill: 'var(--acc2)' })); for (let y = 26; y < 60; y += 12) s.append(ns('line', { x1: 32, y1: y, x2: 68, y2: y, stroke: 'var(--acc2)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' })); s.append(ns('ellipse', { cx: 50, cy: 40, rx: 40, ry: 12, fill: 'none', stroke: 'var(--acc)', 'stroke-width': 2 })); } },
  ];
  const ns = EM.ns, h = EM.h;
  const grid = h('div', { class: 'cards', style: { margin: '0 0 14px' } }); const detail = h('div', { class: 'info-box', style: { fontSize: '.95rem' } });
  W.body.append(grid, detail);
  function icon(e) {
    const s = ns('svg', { viewBox: '0 0 100 80', width: 100, height: 80, style: 'flex:none' });
    s.append(ns('defs')); const d = s.firstChild; const m = ns('marker', { id: 'ah-o', markerWidth: 6, markerHeight: 6, refX: 5, refY: 3, orient: 'auto' }); m.append(ns('path', { d: 'M0,0 L6,3 L0,6 z', fill: 'var(--acc2)' })); d.append(m);
    e.draw(s, ns); return s;
  }
  const cards = EQ.map(e => {
    const b = h('button', { class: 'card', type: 'button', style: { textAlign: 'left', font: 'inherit', cursor: 'pointer' } }, icon(e), h('h3', { text: e.t }), h('p', { html: '$' + e.i + '$' }));
    b.addEventListener('click', () => show(e)); grid.append(b); return b;
  });
  function show(e) {
    cards.forEach((b, i) => b.style.borderColor = EQ[i] === e ? 'var(--acc)' : '');
    detail.innerHTML = '<h6>' + e.t + '</h6><p style="margin:.3em 0">' + e.words + '</p><div class="eq" style="margin:.6em 0">$$' + e.i + '$$ $$' + e.d + '$$</div><p style="margin:.3em 0"><b>Gives you:</b> ' + e.use + '</p><p class="muted" style="margin:.4em 0 0">Left: integral form (about a region). Right: differential form (at a point).</p>';
    if (window.renderMath) window.renderMath(detail);
  }
  show(EQ[3]); if (window.renderMath) window.renderMath(grid);
});
