/* ==========================================================================
   em.js — tiny shared library for every widget (no dependencies, no modules, works from file://)
   ========================================================================== */
(function () {
'use strict';
const EM = window.EM = { widgets: {} };

/* ---------- constants ---------- */
EM.C = { c: 299792458, mu0: 4e-7 * Math.PI, eps0: 8.8541878128e-12, eta0: 376.730313668, kB: 1.380649e-23, h: 6.62607015e-34, e: 1.602176634e-19, me: 9.1093837e-31, G: 6.674e-11 };
const PI = Math.PI;

/* ---------- DOM ---------- */
EM.h = function (tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
};
const h = EM.h;
EM.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
EM.ns = (tag, attrs) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); return e; };

/* ---------- colours ---------- */
let colCache = {};
window.addEventListener('themechange', () => { colCache = {}; });
EM.col = function (name) {
  if (colCache[name]) return colCache[name];
  const v = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
  return (colCache[name] = v || '#888');
};
EM.alpha = function (hex, a) {
  if (hex[0] !== '#') return hex;
  let r, g, b;
  if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
  else { r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16); }
  return `rgba(${r},${g},${b},${a})`;
};
EM.isDark = () => (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
EM.hex2rgb = function (hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; };
EM.mix = function (a, b, t) { const A = EM.hex2rgb(a), B = EM.hex2rgb(b); return `rgb(${(A[0] + (B[0] - A[0]) * t) | 0},${(A[1] + (B[1] - A[1]) * t) | 0},${(A[2] + (B[2] - A[2]) * t) | 0})`; };
EM.font = (px, w = '') => `${w} ${px}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.trim();
EM.mono = (px, w = '') => `${w} ${px}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`.trim();

/* colour maps (t in 0..1 -> [r,g,b]) */
EM.heat = function (t) { // black -> violet -> orange -> yellow-white (inferno-ish)
  t = Math.max(0, Math.min(1, t));
  const s = [[0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99], [212, 72, 66], [245, 125, 21], [250, 193, 39], [252, 255, 164]];
  const x = t * (s.length - 1), i = Math.min(s.length - 2, x | 0), f = x - i;
  return [0, 1, 2].map(k => s[i][k] + (s[i + 1][k] - s[i][k]) * f);
};
EM.diverge = function (v) { // -1..1 : cyan <- dark -> orange   (dark theme) / blue <- white -> red (light)
  v = Math.max(-1, Math.min(1, v));
  const dark = EM.isDark(), a = Math.abs(v);
  const base = dark ? [13, 19, 28] : [244, 247, 251];
  const tgt = v >= 0 ? (dark ? [255, 138, 61] : [212, 86, 10]) : (dark ? [76, 201, 240] : [11, 127, 174]);
  return [0, 1, 2].map(k => base[k] + (tgt[k] - base[k]) * Math.pow(a, .8));
};
EM.rainbow = function (t) { // violet..red for wavelength-like use
  t = Math.max(0, Math.min(1, t));
  const hh = 270 * (1 - t);
  return `hsl(${hh},90%,55%)`;
};
/* visible light: wavelength (nm) -> css colour */
EM.nm2rgb = function (nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 780) { r = 1; }
  let f = 1;
  if (nm < 420) f = .3 + .7 * (nm - 380) / 40; else if (nm > 700) f = .3 + .7 * (780 - nm) / 80;
  if (nm < 380 || nm > 780) f = 0;
  const gam = (x) => Math.round(255 * Math.pow(Math.max(0, x * f), .8));
  return [gam(r), gam(g), gam(b)];
};

/* ---------- maths / formatting ---------- */
EM.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
EM.lerp = (a, b, t) => a + (b - a) * t;
EM.dB = (x) => 10 * Math.log10(x);
EM.dB20 = (x) => 20 * Math.log10(x);
EM.undB = (d) => Math.pow(10, d / 10);
EM.rad = (d) => d * PI / 180;
EM.deg = (r) => r * 180 / PI;
EM.sinc = (x) => Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x;
EM.rand = (function () { let s = 1234567; return (seed) => { if (seed != null) s = seed; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; })();
EM.gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); };

const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
EM.sup = (n) => String(n).split('').map(c => SUP[c] || c).join('');
EM.num = function (v, sig = 3) {
  if (v === 0) return '0';
  if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
  const a = Math.abs(v);
  if (a >= 1e6 || a < 1e-3) {
    const e = Math.floor(Math.log10(a)); let m = v / Math.pow(10, e);
    let ms = m.toPrecision(sig); if (ms.indexOf('.') >= 0) ms = ms.replace(/0+$/, '').replace(/\.$/, '');
    if (ms.startsWith('10')) { ms = '1'; return ms + '×10' + EM.sup(e + 1); }
    return ms + '×10' + EM.sup(e);
  }
  let s = v.toPrecision(sig);
  if (s.indexOf('e') >= 0) s = String(+s);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('-', '−');
};
const PFX = [[1e24, 'Y'], [1e21, 'Z'], [1e18, 'E'], [1e15, 'P'], [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'], [1e-15, 'f'], [1e-18, 'a']];
EM.si = function (v, unit = '', sig = 3) {
  if (v === 0 || !isFinite(v)) return (v === 0 ? '0 ' : EM.num(v) + ' ') + unit;
  const a = Math.abs(v);
  let p = PFX[PFX.length - 1];
  for (const q of PFX) if (a >= q[0] * 0.9999) { p = q; break; }
  let s = (v / p[0]).toPrecision(sig);
  if (s.indexOf('e') >= 0) s = String(+s);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('-', '−') + ' ' + p[1] + unit;
};
EM.freq = (f) => EM.si(f, 'Hz');
EM.len = function (m, sig = 3) {
  const a = Math.abs(m);
  const f = (x) => { let s = x.toPrecision(sig); if (s.indexOf('e') >= 0) s = String(+s); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s; };
  if (a >= 1e3) { const km = m / 1e3; return (Math.abs(km) >= 1e6 ? EM.num(km, sig) : f(km)) + ' km'; }
  if (a >= 1) return f(m) + ' m';
  if (a >= 1e-2) return f(m * 100) + ' cm';
  if (a >= 1e-3) return f(m * 1e3) + ' mm';
  if (a >= 1e-6) return f(m * 1e6) + ' µm';
  if (a >= 1e-9) return f(m * 1e9) + ' nm';
  if (a >= 1e-12) return f(m * 1e12) + ' pm';
  return f(m * 1e15) + ' fm';
};
EM.fixed = (v, d = 1) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
EM.db = (v, d = 1) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + ' dB';

/* ---------- complex numbers as [re, im] ---------- */
EM.cx = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
  abs: (a) => Math.hypot(a[0], a[1]),
  arg: (a) => Math.atan2(a[1], a[0]),
  sc: (a, s) => [a[0] * s, a[1] * s],
  conj: (a) => [a[0], -a[1]],
  exp: (a) => { const m = Math.exp(a[0]); return [m * Math.cos(a[1]), m * Math.sin(a[1])]; },
  expj: (t) => [Math.cos(t), Math.sin(t)],
  sqrt: (a) => { const m = Math.hypot(a[0], a[1]); const re = Math.sqrt((m + a[0]) / 2); const im = Math.sqrt(Math.max(0, (m - a[0]) / 2)); return [re, a[1] < 0 ? -im : im]; },
};

/* ---------- ticks ---------- */
EM.niceTicks = function (min, max, n = 6) {
  const range = max - min; if (!(range > 0)) return [min];
  const raw = range / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag; const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out = []; for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
  return out;
};

/* ---------- 2-D plot helper ---------- */
EM.plot = function (ctx, box, o) {
  // box = {x,y,w,h} pixel rectangle of the plot area; o = {xmin,xmax,xlog,ymin,ymax,ylog,xlabel,ylabel,xfmt,yfmt,xticks,yticks}
  const P = { ctx, box, o };
  const lx = o.xlog ? Math.log10(o.xmin) : o.xmin, hx = o.xlog ? Math.log10(o.xmax) : o.xmax;
  const ly = o.ylog ? Math.log10(o.ymin) : o.ymin, hy = o.ylog ? Math.log10(o.ymax) : o.ymax;
  P.X = (x) => box.x + ((o.xlog ? Math.log10(x) : x) - lx) / (hx - lx) * box.w;
  P.Y = (y) => box.y + box.h - ((o.ylog ? Math.log10(y) : y) - ly) / (hy - ly) * box.h;
  P.invX = (px) => { const t = lx + (px - box.x) / box.w * (hx - lx); return o.xlog ? Math.pow(10, t) : t; };
  P.invY = (py) => { const t = ly + (box.y + box.h - py) / box.h * (hy - ly); return o.ylog ? Math.pow(10, t) : t; };
  P.inside = (px, py) => px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h;
  const logTicks = (min, max) => { const t = []; for (let e = Math.ceil(Math.log10(min) - 1e-9); e <= Math.floor(Math.log10(max) + 1e-9); e++) t.push(Math.pow(10, e)); return t; };
  P.xt = o.xticks || (o.xlog ? logTicks(o.xmin, o.xmax) : EM.niceTicks(o.xmin, o.xmax, Math.max(3, Math.round(box.w / 90))));
  P.yt = o.yticks || (o.ylog ? logTicks(o.ymin, o.ymax) : EM.niceTicks(o.ymin, o.ymax, Math.max(3, Math.round(box.h / 50))));
  const defFmt = (log) => (v) => log ? '10' + EM.sup(Math.round(Math.log10(v))) : EM.num(v);
  const xf = o.xfmt || defFmt(o.xlog), yf = o.yfmt || defFmt(o.ylog);
  P.grid = function (opts = {}) {
    ctx.save();
    ctx.lineWidth = 1; ctx.font = EM.font(11);
    const gc = EM.col('line');
    if (o.xlog && !opts.noMinor) { ctx.strokeStyle = EM.alpha(EM.col('line'), .45); ctx.beginPath(); for (let e = Math.floor(Math.log10(o.xmin)); e <= Math.ceil(Math.log10(o.xmax)); e++) for (let m = 2; m < 10; m++) { const v = m * Math.pow(10, e); if (v > o.xmin && v < o.xmax) { const x = Math.round(P.X(v)) + .5; ctx.moveTo(x, box.y); ctx.lineTo(x, box.y + box.h); } } ctx.stroke(); }
    ctx.strokeStyle = gc; ctx.fillStyle = EM.col('muted');
    ctx.beginPath();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const t of P.xt) { const x = Math.round(P.X(t)) + .5; if (x < box.x - 1 || x > box.x + box.w + 1) continue; ctx.moveTo(x, box.y); ctx.lineTo(x, box.y + box.h); }
    ctx.stroke();
    for (const t of P.xt) { const x = P.X(t); if (x < box.x - 1 || x > box.x + box.w + 1) continue; ctx.fillText(xf(t), x, box.y + box.h + 5); }
    ctx.beginPath(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const t of P.yt) { const y = Math.round(P.Y(t)) + .5; if (y < box.y - 1 || y > box.y + box.h + 1) continue; ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); }
    ctx.stroke();
    for (const t of P.yt) { const y = P.Y(t); if (y < box.y - 1 || y > box.y + box.h + 1) continue; ctx.fillText(yf(t), box.x - 6, y); }
    ctx.strokeStyle = EM.col('line-2'); ctx.strokeRect(box.x + .5, box.y + .5, box.w, box.h);
    ctx.fillStyle = EM.col('text-2'); ctx.font = EM.font(12, '600');
    if (o.xlabel) { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(o.xlabel, box.x + box.w / 2, box.y + box.h + (opts.xlabelDy || 34)); }
    if (o.ylabel) { ctx.save(); ctx.translate(box.x - (opts.ylabelDx || 50), box.y + box.h / 2); ctx.rotate(-PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(o.ylabel, 0, 0); ctx.restore(); }
    ctx.restore();
  };
  P.clip = () => { ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); };
  P.unclip = () => ctx.restore();
  P.line = function (xs, ys, color, w = 2, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); let pen = false;
    for (let i = 0; i < xs.length; i++) {
      const y = ys[i]; if (!isFinite(y) || (o.ylog && y <= 0)) { pen = false; continue; }
      const px = P.X(xs[i]), py = P.Y(y);
      if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.restore();
  };
  P.fn = function (f, color, w = 2, n, dash) {
    n = n || Math.round(box.w / 2); const xs = [], ys = [];
    for (let i = 0; i <= n; i++) { const t = i / n; const x = o.xlog ? Math.pow(10, lx + t * (hx - lx)) : lx + t * (hx - lx); xs.push(x); ys.push(f(x)); }
    P.line(xs, ys, color, w, dash); return [xs, ys];
  };
  P.dot = (x, y, color, r = 5) => { ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = EM.col('bg'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P.X(x), P.Y(y), r, 0, 2 * PI); ctx.fill(); ctx.stroke(); ctx.restore(); };
  P.vline = (x, color, w = 1, dash) => { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); const px = Math.round(P.X(x)) + .5; ctx.beginPath(); ctx.moveTo(px, box.y); ctx.lineTo(px, box.y + box.h); ctx.stroke(); ctx.restore(); };
  P.hline = (y, color, w = 1, dash) => { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); const py = Math.round(P.Y(y)) + .5; ctx.beginPath(); ctx.moveTo(box.x, py); ctx.lineTo(box.x + box.w, py); ctx.stroke(); ctx.restore(); };
  P.text = (s, x, y, color, align = 'left', font) => { ctx.save(); ctx.fillStyle = color || EM.col('text-2'); ctx.font = font || EM.font(12); ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); ctx.restore(); };
  return P;
};

/* ---------- polar plot helpers (0 deg = up, or 'right') ---------- */
EM.polarGrid = function (ctx, cx, cy, R, o = {}) {
  const dbMin = o.dbMin == null ? -40 : o.dbMin, step = o.step || 10, zero = o.zero || 'up';
  ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = EM.col('line'); ctx.fillStyle = EM.col('muted'); ctx.font = EM.font(10);
  for (let d = 0; d >= dbMin - 1e-9; d -= step) {
    const r = R * (d - dbMin) / (-dbMin);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * PI); ctx.stroke();
    if (!o.noLabels && d > dbMin) { ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(d + ' dB', cx + 3, cy - r + 11); }
  }
  ctx.beginPath();
  for (let a = 0; a < 360; a += o.angStep || 30) {
    const t = EM.rad(a) - (zero === 'up' ? PI / 2 : 0);
    ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(t), cy + R * Math.sin(t));
  }
  ctx.stroke();
  if (!o.noAngles) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let a = 0; a < 360; a += o.angStep || 30) {
      const t = EM.rad(a) - (zero === 'up' ? PI / 2 : 0);
      ctx.fillText(a + '°', cx + (R + 13) * Math.cos(t), cy + (R + 13) * Math.sin(t));
    }
  }
  ctx.restore();
};
// fn(thetaRad) returns amplitude (linear, relative to 1) ; mode 'db' (default) or 'lin'
EM.polarLine = function (ctx, cx, cy, R, fn, o = {}) {
  const dbMin = o.dbMin == null ? -40 : o.dbMin, zero = o.zero || 'up', mode = o.mode || 'db', n = o.n || 361;
  ctx.save(); ctx.strokeStyle = o.color || EM.col('acc'); ctx.lineWidth = o.width || 2.2; ctx.lineJoin = 'round';
  if (o.fill) ctx.fillStyle = o.fill;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const th = i / n * 2 * PI; let a = Math.abs(fn(th));
    let r;
    if (mode === 'db') { const d = Math.max(dbMin, 20 * Math.log10(Math.max(a, 1e-12))); r = R * (d - dbMin) / (-dbMin); }
    else r = R * a;
    const t = th - (zero === 'up' ? PI / 2 : 0);
    const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  if (o.fill) ctx.fill();
  ctx.stroke(); ctx.restore();
};

/* ---------- arrows ---------- */
EM.arrow = function (ctx, x1, y1, x2, y2, color, w = 2, head = 9) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 1) return;
  const ux = dx / L, uy = dy / L, hd = Math.min(head, L * .6);
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hd * .7, y2 - uy * hd * .7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hd + uy * hd * .45, y2 - uy * hd - ux * hd * .45); ctx.lineTo(x2 - ux * hd - uy * hd * .45, y2 - uy * hd + ux * hd * .45); ctx.closePath(); ctx.fill();
  ctx.restore();
};
EM.label = function (ctx, s, x, y, color, o = {}) {
  ctx.save(); ctx.font = o.font || EM.font(o.size || 12, o.weight || '600'); ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
  if (o.bg) { const w = ctx.measureText(s).width + 10; const hh = (o.size || 12) + 8; const bx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x - 5; ctx.fillStyle = o.bg; ctx.fillRect(bx, y - hh / 2, w, hh); }
  ctx.fillStyle = color || EM.col('text'); ctx.fillText(s, x, y); ctx.restore();
};

/* ---------- 3-D camera (orbit) ---------- */
EM.cam = function (o = {}) {
  const C = { yaw: o.yaw == null ? .6 : o.yaw, pitch: o.pitch == null ? .35 : o.pitch, scale: o.scale || 100, cx: 0, cy: 0, persp: o.persp == null ? 0 : o.persp };
  C.p = function (v) { // returns [px, py, depth]
    const cyw = Math.cos(C.yaw), syw = Math.sin(C.yaw), cp = Math.cos(C.pitch), sp = Math.sin(C.pitch);
    const x1 = v[0] * cyw + v[1] * syw, y1 = -v[0] * syw + v[1] * cyw, z1 = v[2];
    const y2 = y1 * cp + z1 * sp, z2 = -y1 * sp + z1 * cp;     // z2 = up, y2 = depth (away)
    const k = C.persp ? 1 / (1 + y2 * C.persp / C.scale) : 1;
    return [C.cx + x1 * C.scale * k, C.cy - z2 * C.scale * k, y2];
  };
  return C;
};
EM.v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  sc: (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};

/* ---------- widget scaffolding ---------- */
EM.widget = function (el, o = {}) {
  el.className = 'widget'; EM.clear(el); el.removeAttribute('style');
  const head = h('div', { class: 'widget-head' }, h('span', { class: 'badge', text: o.badge || 'Interactive' }), h('h5', { text: o.title || '' }), h('span', { class: 'sp' }));
  const body = h('div', { class: 'widget-body' });
  el.append(head, body);
  if (o.note) el.append(h('div', { class: 'widget-note', html: o.note }));
  const W = { root: el, head, body };
  W.grid = (kind) => { const g = h('div', { class: 'wgrid' + (kind ? ' ' + kind : '') }); const main = h('div', { style: { minWidth: 0 } }); const side = h('div', { class: 'ctls' }); g.append(main, side); body.append(g); return { grid: g, main, side }; };
  W.headBtn = (text, fn) => { const b = h('button', { class: 'btn small', text, onclick: fn }); head.append(b); return b; };
  return W;
};

EM.slider = function (parent, o) {
  const log = !!o.log, id = 's' + Math.random().toString(36).slice(2, 8);
  const input = h('input', { type: 'range', id });
  if (log) { input.min = 0; input.max = 1000; input.step = 1; } else { input.min = o.min; input.max = o.max; input.step = o.step || (o.max - o.min) / 400; }
  const out = h('output', { for: id });
  const lab = h('label', { for: id, html: o.label });
  const el = h('div', { class: 'ctl' }, lab, out, input);
  const fmt = o.fmt || ((v) => EM.num(v) + (o.unit ? ' ' + o.unit : ''));
  const toV = (t) => log ? o.min * Math.pow(o.max / o.min, t / 1000) : +t;
  const toT = (v) => log ? 1000 * Math.log(v / o.min) / Math.log(o.max / o.min) : v;
  const S = { el, input, out, label: lab };
  S.get = () => { let v = toV(input.value); if (o.snap) v = Math.round(v / o.snap) * o.snap; return v; };
  const sync = () => { const p = (input.value - input.min) / (input.max - input.min) * 100; input.style.setProperty('--p', p + '%'); out.textContent = fmt(S.get()); };
  S.set = (v, silent) => { input.value = toT(v); sync(); if (!silent && o.onInput) o.onInput(S.get(), S); };
  input.addEventListener('input', () => { sync(); if (o.onInput) o.onInput(S.get(), S); });
  S.set(o.value != null ? o.value : (log ? Math.sqrt(o.min * o.max) : (o.min + o.max) / 2), true);
  S.setLabel = (html) => { lab.innerHTML = html; };
  (parent || document.createElement('div')).append(el);
  return S;
};
EM.select = function (parent, o) {
  const id = 'd' + Math.random().toString(36).slice(2, 8);
  const sel = h('select', { id });
  const opts = o.options.map(x => Array.isArray(x) ? x : [x, x]);
  for (const [v, t] of opts) sel.append(h('option', { value: v, text: t }));
  if (o.value != null) sel.value = o.value;
  const el = h('div', { class: 'ctl' }, h('label', { for: id, html: o.label || '' }), h('span'), sel);
  sel.addEventListener('change', () => o.onChange && o.onChange(sel.value, S));
  const S = { el, sel, get: () => sel.value, set: (v, silent) => { sel.value = v; if (!silent && o.onChange) o.onChange(sel.value, S); } };
  (parent || document.createElement('div')).append(el);
  return S;
};
EM.toggle = function (parent, o) {
  const inp = h('input', { type: 'checkbox' }); inp.checked = !!o.checked;
  const el = h('label', { class: 'tgl' }, inp, h('span', { html: o.label }));
  inp.addEventListener('change', () => o.onChange && o.onChange(inp.checked, S));
  const S = { el, input: inp, get: () => inp.checked, set: (v, silent) => { inp.checked = v; if (!silent && o.onChange) o.onChange(v, S); } };
  (parent || document.createElement('div')).append(el);
  return S;
};
EM.btn = function (parent, text, fn, cls = '') {
  const b = h('button', { class: 'btn ' + cls, onclick: fn, html: text });
  (parent || document.createElement('div')).append(b); return b;
};
EM.seg = function (parent, options, value, onChange) {
  const opts = options.map(x => Array.isArray(x) ? x : [x, x]);
  const el = h('div', { class: 'seg' });
  const S = { el, value };
  const btns = opts.map(([v, t]) => { const b = h('button', { text: t, type: 'button' }); b.addEventListener('click', () => S.set(v)); el.append(b); return [v, b]; });
  S.set = (v, silent) => { S.value = v; for (const [vv, b] of btns) b.classList.toggle('on', vv === v); if (!silent && onChange) onChange(v, S); };
  S.get = () => S.value; S.set(value, true);
  (parent || document.createElement('div')).append(el); return S;
};
EM.tabs = function (parent, options, value, onChange) {
  const opts = options.map(x => Array.isArray(x) ? x : [x, x]);
  const el = h('div', { class: 'tabs' }); const S = { el, value };
  const btns = opts.map(([v, t]) => { const b = h('button', { text: t, type: 'button' }); b.addEventListener('click', () => S.set(v)); el.append(b); return [v, b]; });
  S.set = (v, silent) => { S.value = v; for (const [vv, b] of btns) b.classList.toggle('on', vv === v); if (!silent && onChange) onChange(v, S); };
  S.get = () => S.value; S.set(value, true);
  (parent || document.createElement('div')).append(el); return S;
};
// readouts: defs = [[key, label, unit, cls], ...]
EM.readouts = function (parent, defs) {
  const wrap = h('div', { class: 'readouts' }); const R = { el: wrap, v: {} };
  for (const [key, label, unit, cls] of defs) {
    const v = h('span', { class: 'v', text: '—' }); const u = h('span', { class: 'u', text: unit || '' });
    wrap.append(h('div', { class: 'ro ' + (cls || '') }, h('div', { class: 'k', text: label }), h('div', null, v, u)));
    R.v[key] = { v, u };
  }
  R.set = (key, text, unit) => { const r = R.v[key]; if (!r) return; r.v.textContent = text; if (unit != null) r.u.textContent = unit; };
  (parent || document.createElement('div')).append(wrap); return R;
};

/* ---------- canvas with DPR + resize ---------- */
EM.canvas = function (parent, o = {}) {
  const cv = h('canvas', { class: 'plot' });
  if (o.cursor) cv.style.cursor = o.cursor;
  parent.append(cv);
  const S = { cv, ctx: cv.getContext('2d'), W: 0, H: 0, dpr: 1, draw: null, aspect: o.aspect || .6, fixedH: o.height };
  let lastW = 0, lastH = 0;
  function fit() {
    const w = Math.floor(cv.clientWidth || (cv.parentElement && cv.parentElement.clientWidth) || 0);
    if (w < 20) return false;
    let hgt = S.fixedH || Math.round(w * S.aspect); if (o.minH) hgt = Math.max(o.minH, hgt); if (o.maxH) hgt = Math.min(o.maxH, hgt);
    cv.style.height = hgt + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w !== lastW || hgt !== lastH || dpr !== S.dpr) {
      lastW = w; lastH = hgt; S.W = w; S.H = hgt; S.dpr = dpr;
      cv.width = Math.round(w * dpr); cv.height = Math.round(hgt * dpr);
      return true;
    }
    return false;
  }
  S.redraw = function () {
    if (!S.W) { if (!fit()) return; }
    const c = S.ctx; c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); c.clearRect(0, 0, S.W, S.H);
    if (S.draw) S.draw(c, S.W, S.H);
  };
  S.setAspect = (a) => { S.aspect = a; if (fit()) S.redraw(); };
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (fit()) S.redraw(); }); ro.observe(cv); }
  window.addEventListener('themechange', () => S.redraw());
  window.addEventListener('resize', () => { if (fit()) S.redraw(); });
  S.pos = (ev) => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * (S.W / r.width), y: (ev.clientY - r.top) * (S.H / r.height) }; };
  S.pointer = function (cb) { // cb = {down(p,ev), move(p,ev,dragging), up(p,ev)}
    let drag = false;
    cv.addEventListener('pointerdown', (ev) => { drag = true; cv.setPointerCapture(ev.pointerId); cb.down && cb.down(S.pos(ev), ev); });
    cv.addEventListener('pointermove', (ev) => { cb.move && cb.move(S.pos(ev), ev, drag); });
    const up = (ev) => { if (!drag) return; drag = false; cb.up && cb.up(S.pos(ev), ev); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', (ev) => { cb.leave && cb.leave(S.pos(ev), ev); });
  };
  requestAnimationFrame(() => { if (fit()) S.redraw(); });
  return S;
};
EM.offscreen = (w, h_) => { const c = document.createElement('canvas'); c.width = w; c.height = h_; return c; };

/* ---------- animation loop that sleeps off-screen ---------- */
EM.loop = function (el, fn, o = {}) {
  const L = { running: false, paused: false, t0: 0, time: 0, visible: true };
  let raf = 0, last = 0;
  function frame(now) {
    raf = 0; if (!L.visible || document.hidden) { last = 0; return; }
    if (!last) last = now; let dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!L.paused) { L.time += dt * (o.speed || 1); fn(L.time, dt); }
    raf = requestAnimationFrame(frame);
  }
  L.kick = () => { if (!raf && L.visible && !document.hidden && L.running) { last = 0; raf = requestAnimationFrame(frame); } };
  L.start = () => { L.running = true; L.kick(); };
  L.stop = () => { L.running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  L.pause = (p) => { L.paused = p; if (!p) L.kick(); };
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { L.visible = es[0].isIntersecting; if (L.visible) L.kick(); }, { rootMargin: '80px' }).observe(el);
  document.addEventListener('visibilitychange', () => L.kick());
  if (o.autostart !== false) L.start();
  return L;
};

/* ---------- storage ---------- */
EM.store = {
  get(k, d) { try { const v = localStorage.getItem('em-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('em-' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};

/* ---------- audio (lazy, user-gesture only) ---------- */
EM.audio = (function () {
  let ac = null;
  return {
    ctx() { if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); } if (ac.state === 'suspended') ac.resume(); return ac; },
    tone(freq, vol = .05) {
      const a = this.ctx(); if (!a) return null;
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = freq; g.gain.value = 0; o.connect(g); g.connect(a.destination); o.start();
      g.gain.setTargetAtTime(vol, a.currentTime, .03);
      return { osc: o, gain: g, set(f) { o.frequency.setTargetAtTime(f, a.currentTime, .02); }, stop() { g.gain.setTargetAtTime(0, a.currentTime, .03); setTimeout(() => { try { o.stop(); } catch (e) { /* */ } }, 150); } };
    },
  };
})();

/* Bessel J1 (Numerical Recipes rational approximations) */
EM.j1 = function (x) {
  const ax = Math.abs(x); let ans;
  if (ax < 8) { const y = x * x; const a1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606)))))); const a2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y)))); ans = a1 / a2; }
  else { const z = 8 / ax, y = z * z, xx = ax - 2.356194491; const a1 = 1.0 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6)))); const a2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6))); ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * a1 - z * Math.sin(xx) * a2); if (x < 0) ans = -ans; }
  return ans;
};
/* half-power beamwidth (degrees) of the lobe around thetaMax, for a function f(theta rad) over [0, pi] */
EM.hpbw = function (f, th0, span = Math.PI) {
  const peak = Math.abs(f(th0)) || 1e-12, t = peak * Math.SQRT1_2; let lo = th0, hi = th0;
  const st = .002; while (lo > th0 - span && Math.abs(f(lo)) > t) lo -= st; while (hi < th0 + span && Math.abs(f(hi)) > t) hi += st;
  return EM.deg(hi - lo);
};
/* directivity of an axisymmetric pattern F(theta) (amplitude) about the polar axis */
EM.dirAxi = function (f) { let s = 0; const n = 2000; for (let i = 0; i < n; i++) { const th = (i + .5) / n * Math.PI; s += f(th) * f(th) * Math.sin(th); } s *= Math.PI / n; let mx = 0; for (let i = 0; i <= n; i++) mx = Math.max(mx, Math.abs(f(i / n * Math.PI))); return 2 * mx * mx / s; };

/* ---------- registry ---------- */
EM.register = (name, fn) => { EM.widgets[name] = fn; };

})();
