/* quiz — reads a JSON array from an inline <script type="application/json"> inside the placeholder */
EM.register('quiz', function (el) {
  const h = EM.h;
  const tag = el.querySelector('script[type="application/json"]');
  const qs = JSON.parse(tag ? tag.textContent : '[]');
  el.className = 'quiz'; el.removeAttribute('style'); EM.clear(el);
  const score = h('span', { class: 'score', text: '0 / ' + qs.length });
  el.append(h('div', { class: 'quiz-head' }, h('span', { class: 'badge widget-badge', style: { fontSize: '.64rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', background: EM.col('acc3'), color: '#221800', padding: '3px 8px', borderRadius: '999px' }, text: 'Check yourself' }), h('h5', { text: 'Quick quiz' }), score));
  let right = 0;
  qs.forEach((q) => {
    const box = h('div', { class: 'q' }, h('div', { class: 'qt', html: q.q }));
    const opts = h('div', { class: 'opts' });
    const btns = q.o.map((t, i) => {
      const b = h('button', { class: 'opt', html: t, type: 'button' });
      b.addEventListener('click', () => {
        if (box.classList.contains('done')) return;
        box.classList.add('done');
        btns.forEach((bb, j) => { bb.disabled = true; if (j === q.a) bb.classList.add('right'); });
        if (i === q.a) right++; else b.classList.add('wrong');
        score.textContent = right + ' / ' + qs.length;
        if (window.renderMath) window.renderMath(box);
      });
      opts.append(b); return b;
    });
    box.append(opts, h('div', { class: 'why', html: q.why || '' }));
    el.append(box);
  });
});
