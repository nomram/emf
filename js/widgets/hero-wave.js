/* hero-wave — decorative travelling E (orange) and B (cyan) wave on the home page */
EM.register('hero-wave', function (el) {
  EM.clear(el);
  const S = EM.canvas(el, { height: 150 }); S.cv.className = 'hero-wave';
  S.draw = (c, W, H) => {
    const t = S.t || 0, mid = H / 2, A = H * .36, k = 2 * Math.PI / (W / 3.2);
    c.lineWidth = 2.4;
    for (let pass = 0; pass < 2; pass++) {
      c.strokeStyle = pass ? EM.col('acc') : EM.col('acc2');
      c.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const ph = k * x - t * 3, y = pass ? Math.sin(ph) * A * .55 : Math.sin(ph) * A;
        const yy = pass ? mid + Math.sin(ph) * A * .5 * Math.cos(.9) : mid - Math.sin(ph) * A;
        // B drawn "in depth": offset sideways so it reads as perpendicular
        const xx = pass ? x + Math.sin(ph) * A * .6 : x;
        pass ? (x ? c.lineTo(xx, mid + Math.sin(ph) * A * .35) : c.moveTo(xx, mid)) : (x ? c.lineTo(x, yy) : c.moveTo(x, yy));
      }
      c.stroke();
    }
    c.strokeStyle = EM.alpha(EM.col('muted'), .4); c.lineWidth = 1; c.beginPath(); c.moveTo(0, mid); c.lineTo(W, mid); c.stroke();
    EM.label(c, 'E', 14, 22, EM.col('acc2'), { size: 14, weight: '800' });
    EM.label(c, 'B', 38, 22, EM.col('acc'), { size: 14, weight: '800' });
  };
  EM.loop(el, (t) => { S.t = t; S.redraw(); });
});
