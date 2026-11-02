# Waves & Antennas for Dummies

An interactive, plain HTML/CSS/JS guide: from a current in a wire to phased arrays, with 75+ widgets.
Modelled on the structure of the “Jet Engines for Dummies” site (multi-page, lazy-loaded canvas widgets, KaTeX maths).

## Run it
- **Double-click `index.html`** (works from `file://`; no modules, no build step), or
- `node serve.js 8123` and open http://localhost:8123 (any static server works, e.g. GitHub Pages).
- Append `?testall` to any page URL to load every widget immediately and collect errors in `window.__EM_ERR`.

## Layout
- `index.html`, `safety.html`, `01-current.html` … `19-systems.html`, `reference.html` — one page per chapter (`05a`, `05b`, `11a`, `15a` are the later additions).
- `css/style.css` — design system (dark/light, cyan = magnetic, orange = electric, yellow = energy).
- `js/em.js` — shared widget library (sliders, canvases, plots, polar plots, colour maps, audio).
- `js/site.js` — chapter list (`PAGES`), nav, theme, KaTeX loader, lazy widget loader.
- `js/widgets/*.js` — one file per widget (`EM.register('name', fn)`); a page uses `<div data-widget="name">`.
- `vendor/katex/` — KaTeX 0.16 (local copy, MIT licence).

## Adding a chapter or widget
1. Add the page to `PAGES` in `js/site.js` (order = sidebar order = prev/next).
2. Copy any chapter page as a template; put `<div data-widget="my-widget"></div>` where it belongs.
3. Create `js/widgets/my-widget.js` calling `EM.register('my-widget', el => { … })` (see `wire-field.js` for a compact example).

## Scope
Educational. It deliberately contains no instructions for building transmitters, jammers, EMP or high-power-microwave devices (see `safety.html`).
