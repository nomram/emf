/* ==========================================================================
   site.js — page chrome (top bar, chapter nav, prev/next), theme, math, lazy widget loader
   Every page contains its text + <div data-widget="name"> placeholders. Plain scripts, no modules:
   the site works when you double-click index.html (file://) as well as from a web server.
   ========================================================================== */
(function () {
'use strict';

const PAGES = [
  { file: 'index.html',        n: '⌂',  title: 'Start here',                         group: 'Start' },
  { file: 'safety.html',       n: '!',  title: 'Safety & scope',                     group: 'Start' },
  { file: '01-current.html',   n: '1',  title: 'A current makes a field',            group: 'I · Fields from scratch' },
  { file: '02-fields.html',    n: '2',  title: 'E, D, H, B & the hand rules',        group: 'I · Fields from scratch' },
  { file: '03-induction.html', n: '3',  title: 'Electromagnetism: induction & Maxwell', group: 'I · Fields from scratch' },
  { file: '04-radiation.html', n: '4',  title: 'Waves leave the wire (and fade)',    group: 'I · Fields from scratch' },
  { file: '05-spectrum.html',  n: '5',  title: 'The spectrum',                       group: 'II · Spectrum & matter' },
  { file: '05a-atoms.html',    n: '5a', title: 'Photons, atoms & ionising radiation', group: 'II · Spectrum & matter' },
  { file: '05b-quantum.html',  n: '5b', title: 'Wave or particle? The double slit',  group: 'II · Spectrum & matter' },
  { file: '06-matter.html',    n: '6',  title: 'What passes through what',           group: 'II · Spectrum & matter' },
  { file: '07-senses.html',    n: '7',  title: 'Hearing, whales, bats & eyes',       group: 'II · Spectrum & matter' },
  { file: '08-submarines.html',n: '8',  title: 'Talking to submarines',              group: 'II · Spectrum & matter' },
  { file: '09-antenna.html',   n: '9',  title: 'What is an antenna?',                group: 'III · Antennas' },
  { file: '10-lines.html',     n: '10', title: 'Feeding it: lines & matching',       group: 'III · Antennas' },
  { file: '11-zoo.html',       n: '11', title: 'The antenna zoo',                    group: 'III · Antennas' },
  { file: '11a-radio.html',    n: '11a', title: 'Radio in practice: ham, SDR & skywave', group: 'III · Antennas' },
  { file: '12-radar.html',     n: '12', title: 'Radar from zero',                    group: 'IV · Radar' },
  { file: '13-doppler.html',   n: '13', title: 'Doppler, PRF & FMCW',                group: 'IV · Radar' },
  { file: '14-types.html',     n: '14', title: 'Radar types & bands',                group: 'IV · Radar' },
  { file: '15-rcs.html',       n: '15', title: 'Seen or unseen: RCS & stealth',      group: 'IV · Radar' },
  { file: '15b-realdata.html', n: '15b', title: 'Radar in the real world: public data', group: 'IV · Radar' },
  { file: '15c-passive.html',  n: '15c', title: 'Passive radar & the Starlink question', group: 'IV · Radar' },
  { file: '15d-presence.html', n: '15d', title: 'Radar that senses people', group: 'IV · Radar' },
  { file: '15a-ew.html',       n: '15a', title: 'Electronic warfare & resilient links', group: 'IV · Radar' },
  { file: '16-emp.html',       n: '16', title: 'EMP: the fast, broad burst',         group: 'V · EMP' },
  { file: '16a-shielding.html', n: '16a', title: 'Shielding in practice: cages & feedthroughs', group: 'V · EMP' },
  { file: '16b-space.html',    n: '16b', title: 'Space weather & the Van Allen belts', group: 'V · EMP' },
  { file: '17-microwave.html', n: '17', title: 'Case study: the microwave oven',     group: 'V · EMP' },
  { file: '18-arrays.html',    n: '18', title: 'Phased arrays',                      group: 'VI · Hero level' },
  { file: '19-systems.html',   n: '19', title: 'Multi-array systems',                group: 'VI · Hero level' },
  { file: 'reference.html',    n: '≡',  title: 'Formulas, glossary & sources',       group: 'Resources' },
];
window.EM_PAGES = PAGES;

const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4cc9f0"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient></defs>
<circle cx="16" cy="16" r="14" fill="none" stroke="url(#lg)" stroke-width="2"/>
<path d="M3.5 16 C 7 5, 10 5, 12.5 16 S 18 27, 20.5 16 S 26 5, 28.5 16" fill="none" stroke="url(#lg)" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="16" cy="16" r="1.8" fill="#ffd23f"/></svg>`;

const here = (location.pathname.split('/').pop() || 'index.html');
const current = PAGES.find(p => p.file === here) || PAGES[0];
const params = new URLSearchParams(location.search);
const TEST = params.has('testall');
window.__EM_ERR = [];
window.addEventListener('error', (e) => window.__EM_ERR.push(String(e.message) + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
window.addEventListener('unhandledrejection', (e) => window.__EM_ERR.push('promise: ' + String(e.reason && e.reason.message || e.reason)));

/* ---------- theme ---------- */
function getStoredTheme() { try { return localStorage.getItem('em-theme'); } catch (e) { return null; } }
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
}
function theme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
(function initTheme() {
  const stored = getStoredTheme();
  const pref = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', stored || pref);
})();

/* ---------- visited chapters ---------- */
function seenSet() { try { return new Set(JSON.parse(localStorage.getItem('em-seen') || '[]')); } catch (e) { return new Set(); } }
function markSeen(file) { try { const s = seenSet(); s.add(file); localStorage.setItem('em-seen', JSON.stringify([...s])); } catch (e) { /* private mode */ } }

/* ---------- chrome ---------- */
function buildTopbar() {
  const bar = document.getElementById('topbar');
  if (!bar) return;
  bar.className = 'topbar';
  bar.innerHTML = `
    <button class="icon-btn" id="menu-btn" aria-label="Chapters">☰</button>
    <a class="brand" href="index.html">${LOGO}<span>Waves &amp; Antennas for Dummies<small>From a wire to a phased array</small></span></a>
    <nav class="top-links">
      <a href="05-spectrum.html" class="hide-sm">Spectrum</a>
      <a href="11-zoo.html" class="hide-sm">Antennas</a>
      <a href="12-radar.html" class="hide-sm">Radar</a>
      <a href="18-arrays.html" class="hot">Phased arrays</a>
      <button class="icon-btn" id="theme-btn" aria-label="Toggle theme" title="Toggle light / dark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg></button>
    </nav>
    <div class="progress" id="progress"></div>`;
  document.getElementById('theme-btn').addEventListener('click', () => {
    const t = theme() === 'dark' ? 'light' : 'dark';
    applyTheme(t);
    try { localStorage.setItem('em-theme', t); } catch (e) { /* private mode */ }
  });
  document.getElementById('menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  const prog = document.getElementById('progress');
  const onScroll = () => {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    prog.style.width = (p * 100).toFixed(1) + '%';
    if (p > .6) markSeen(current.file);
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

function buildSidenav() {
  const nav = document.getElementById('sidenav');
  if (!nav) return;
  const seen = seenSet();
  let html = '', group = '';
  for (const p of PAGES) {
    if (p.group !== group) { group = p.group; html += `<h6>${group}</h6>`; }
    const cur = p.file === current.file;
    html += `<a class="nav-item${cur ? ' current' : ''}${seen.has(p.file) && !cur ? ' seen' : ''}" href="${p.file}"><span class="n">${p.n}</span><span>${p.title}</span></a>`;
    if (cur) html += `<div class="sub" id="subnav"></div>`;
  }
  nav.innerHTML = html;
  const heads = [...document.querySelectorAll('main h2[id]')];
  const sub = document.getElementById('subnav');
  if (sub && heads.length) {
    sub.innerHTML = heads.map(h => `<a href="#${h.id}" data-for="${h.id}">${h.dataset.short || h.textContent}</a>`).join('');
    const links = new Map([...sub.querySelectorAll('a')].map(a => [a.dataset.for, a]));
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        const a = links.get(e.target.id); if (a) a.classList.add('active');
      }
    }, { rootMargin: '-20% 0px -70% 0px' });
    heads.forEach(h => io.observe(h));
  }
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });
  const cur = nav.querySelector('.current'); if (cur) { const top = cur.offsetTop - 120; nav.scrollTop = Math.max(0, top); }
}

function buildPrevNext() {
  const main = document.querySelector('main');
  if (!main) return;
  const i = PAGES.indexOf(current);
  const prev = PAGES[i - 1], next = PAGES[i + 1];
  const pn = document.createElement('div');
  pn.className = 'pn';
  pn.innerHTML = (prev ? `<a class="prev" href="${prev.file}"><small>← Previous</small>${prev.title}</a>` : '<span></span>')
               + (next ? `<a class="next" href="${next.file}"><small>Next →</small>${next.title}</a>` : '<span></span>');
  main.appendChild(pn);
  const foot = document.createElement('footer');
  foot.className = 'site-foot';
  foot.innerHTML = `<b>Educational use only.</b> This guide explains how electromagnetic waves, antennas, radar and pulses work. It does not describe how to build transmitters, jammers or weapons, and several parts of the radio spectrum are licensed. See <a href="safety.html">Safety &amp; scope</a>. · Plain HTML/CSS/JS and KaTeX · <a href="reference.html#sources">Sources</a>`;
  main.appendChild(foot);
}

/* ---------- math (KaTeX, loaded lazily) ---------- */
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('cannot load ' + src)); document.head.appendChild(s);
  });
}
let mathReady = null;
function renderMath(root) {
  root = root || document.body;
  if (!mathReady) mathReady = loadScript('vendor/katex/katex.min.js').then(() => loadScript('vendor/katex/auto-render.min.js'));
  return mathReady.then(() => {
    window.renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'canvas'],
    });
  }).catch(() => { /* offline math: leave source text */ });
}
window.renderMath = renderMath;

/* ---------- lazy widgets ---------- */
const scriptCache = {};
const ALIAS = { 'slit-pellets': 'slits', 'slit-quantum': 'slits', 'slit-observer': 'slits' };   // several widgets sharing one file
function loadWidgetScript(name) {
  if (window.EM.widgets[name]) return Promise.resolve();
  const file = ALIAS[name] || name;
  if (!scriptCache[file]) scriptCache[file] = loadScript('js/widgets/' + file + '.js');
  return scriptCache[file];
}
async function bootWidget(el) {
  const name = el.dataset.widget;
  try {
    await loadWidgetScript(name);
    const fn = window.EM.widgets[name];
    if (!fn) throw new Error('widget file loaded but EM.register("' + name + '") was never called');
    await fn(el, { theme, renderMath });
    renderMath(el);
    el.dataset.ready = '1';
  } catch (err) {
    console.error('widget failed:', name, err);
    window.__EM_ERR.push('widget ' + name + ': ' + String(err && err.message || err));
    el.innerHTML = `<div class="callout danger"><span class="ct">Widget error</span>Could not start “${name}”: ${String(err.message || err)}</div>`;
  }
}
function initWidgets() {
  const els = [...document.querySelectorAll('[data-widget]')];
  if (TEST || !('IntersectionObserver' in window)) { els.forEach(bootWidget); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); bootWidget(e.target); }
  }, { rootMargin: '500px 0px' });
  els.forEach(el => io.observe(el));
}

/* ---------- boot ---------- */
function boot() {
  buildTopbar();
  buildSidenav();
  buildPrevNext();
  renderMath(document.querySelector('main') || document.body);
  initWidgets();
  if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }, 60);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
