/* Portfolio theme: design tokens (CSS custom properties) + light/dark init, persistence and toggle API.
   Load in <helmet> before content so the saved theme applies before first paint. */
(function () {
  var KEY = 'pf-theme';
  // Primary brand scale (single source of truth). 600 is the core brand color; semantic aliases below map onto it.
  var PRIMARY = {
    50: '#FDF2F6', 100: '#FCE7EF', 200: '#F9CFE0', 300: '#F4A6C4', 400: '#EC6F9C', 500: '#DE3E76',
    600: '#C21E56', 700: '#A11746', 800: '#85163D', 900: '#6F1736', 950: '#44061B'
  };
  var P = function (n) { return PRIMARY[n]; };
  var LIGHT = {
    bg: '#FFFFFF', fg: '#111111', body: '#333333', muted: '#666666', subtle: '#767676', disabled: '#B3B3B3',
    line: '#E5E5E5', 'line-strong': '#D4D4D4', surface: '#F5F5F5', 'surface-2': '#FAFAFA',
    accent: P(600), 'accent-hover': P(700), 'accent-active': P(800), focus: P(500), 'accent-soft': 'rgba(194,30,86,0.08)', 'accent-tint': P(50), highlight: P(200), 'footer-card': P(50), 'pb-primary-50': P(50), 'pb-emoji': '#FFF8F3', 'pb-emoji-op': '0.5', 'pb-ink': P(700), 'pb-chip': 'rgba(255,255,255,0.86)', 'footer-art-opacity': '0.55', 'on-accent': '#FFFFFF', card: '#FFFFFF', 'card-shadow': '0 1px 2px rgba(17,17,17,0.04), 0 6px 20px -8px rgba(17,17,17,0.10)', 'card-shadow-hover': '0 2px 4px rgba(17,17,17,0.05), 0 14px 32px -12px rgba(17,17,17,0.16)', 'fg-hover': '#333333',
    glass: 'rgba(255,255,255,0.86)', shadow: 'rgba(17,17,17,0.16)', scrim: 'rgba(17,17,17,0.46)',
    // Hero gradient blooms: primary 50–200 tints plus one warm neutral.
    'blob-1': 'rgba(249,207,224,0.85)', 'blob-2': 'rgba(252,231,239,0.95)', 'blob-3': 'rgba(244,166,196,0.42)', 'blob-4': 'rgba(253,242,246,1)', 'blob-5': 'rgba(236,233,228,0.7)', 'blob-0': 'rgba(253,242,246,0)'
  };
  var DARK = {
    bg: '#111111', fg: '#F5F5F5', body: '#D4D4D4', muted: '#A3A3A3', subtle: '#8F8F8F', disabled: '#555555',
    line: '#333333', 'line-strong': '#444444', surface: '#1A1A1A', 'surface-2': '#161616',
    accent: P(400), 'accent-hover': P(300), 'accent-active': P(200), focus: P(300), 'accent-soft': 'rgba(236,111,156,0.12)', 'accent-tint': P(950), highlight: P(900), 'footer-card': '#1A1A1A', 'pb-primary-50': P(950), 'pb-emoji': '#1E1619', 'pb-emoji-op': '0.38', 'pb-ink': P(300), 'pb-chip': 'rgba(17,17,17,0.72)', 'footer-art-opacity': '0.06', 'on-accent': '#111111', card: '#1A1A1A', 'card-shadow': 'inset 0 1px 0 rgba(255,255,255,0.04), 0 6px 20px -8px rgba(0,0,0,0.55)', 'card-shadow-hover': 'inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 32px -12px rgba(0,0,0,0.75)', 'fg-hover': '#D4D4D4',
    glass: 'rgba(26,26,26,0.86)', shadow: 'rgba(0,0,0,0.6)', scrim: 'rgba(0,0,0,0.66)',
    'blob-1': 'rgba(194,30,86,0.22)', 'blob-2': 'rgba(111,23,54,0.42)', 'blob-3': 'rgba(236,111,156,0.14)', 'blob-4': 'rgba(68,6,27,0.55)', 'blob-5': 'rgba(40,40,40,0.8)', 'blob-0': 'rgba(17,17,17,0)'
  };
  // Brand system scales (theme-independent). Documented in "Brand Kit.dc.html"; exposed as --pf-<group>-<step>.
  var NEUTRAL = { 0: '#FFFFFF', 50: '#FAFAFA', 100: '#F5F5F5', 200: '#E5E5E5', 300: '#D4D4D4', 400: '#B3B3B3', 500: '#8F8F8F', 600: '#666666', 700: '#444444', 800: '#333333', 850: '#1A1A1A', 900: '#161616', 950: '#111111', 1000: '#000000' };
  var SYSTEM = {
    space: { 0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 14: '56px', 16: '64px', 20: '80px', 26: '104px', 30: '120px' },
    radius: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '28px', pill: '999px' },
    border: { hairline: '1px', strong: '1.5px', focus: '2px' },
    shadow: { 0: 'none', 1: '0 1px 2px rgba(17,17,17,0.04), 0 6px 20px -8px rgba(17,17,17,0.10)', 2: '0 2px 4px rgba(17,17,17,0.05), 0 14px 32px -12px rgba(17,17,17,0.16)', 3: '0 24px 60px -20px rgba(17,17,17,0.28)' },
    dur: { instant: '80ms', fast: '140ms', base: '220ms', slow: '360ms', page: '600ms' },
    ease: { standard: 'cubic-bezier(.22,1,.36,1)', 'in-out': 'cubic-bezier(.65,.05,.25,1)', linear: 'linear' },
    bp: { sm: '640px', md: '900px', lg: '1200px' },
    container: { text: '68ch', content: '1200px', gutter: 'clamp(20px,4vw,48px)' }
  };
  var sysDecl = Object.keys(NEUTRAL).map(function (k) { return '--pf-neutral-' + k + ':' + NEUTRAL[k]; }).concat([].concat.apply([], Object.keys(SYSTEM).map(function (g) { return Object.keys(SYSTEM[g]).map(function (k) { return '--pf-' + g + '-' + k + ':' + SYSTEM[g][k]; }); }))).join(';');
  var decl = function (t) { return Object.keys(t).map(function (k) { return '--pf-' + k + ':' + t[k]; }).join(';'); };
  var scale = Object.keys(PRIMARY).map(function (k) { return '--pf-primary-' + k + ':' + PRIMARY[k]; }).join(';');
  var fonts = "--pf-sans:'Archivo',system-ui,sans-serif;--pf-mono:'JetBrains Mono',ui-monospace,monospace";
  if (!document.getElementById('pf-theme-tokens')) {
    var st = document.createElement('style');
    st.id = 'pf-theme-tokens';
    st.textContent =
      ':root{' + fonts + ';' + scale + ';' + sysDecl + ';' + decl(LIGHT) + ';color-scheme:light}' +
      ':root[data-theme="dark"]{' + decl(DARK) + ';color-scheme:dark}' +
      // Scoped previews: any element with data-theme re-declares the theme for its subtree (Brand Kit comparisons).
      ':root [data-theme="light"]{' + decl(LIGHT) + ';color-scheme:light;color:var(--pf-fg)}:root [data-theme="dark"]{' + decl(DARK) + ';color-scheme:dark;color:var(--pf-fg)}' +
      'html,body{background:var(--pf-bg);color:var(--pf-fg)}' +
      // Component pseudo-styles compile to `.scpN:focus{outline…!important}` (specificity 0,2,0), which also fire on
      // mouse clicks. `:root` lifts this rule to 0,3,0 so pointer focus gets no ring; :focus-visible (keyboard) keeps it.
      ':root :focus:not(:focus-visible){outline:none!important}' +
      ':root a,:root button,:root [role=button]{-webkit-tap-highlight-color:transparent}' +
      '@media (prefers-reduced-motion: reduce){:root a,:root button{transition-duration:0s!important}}' +
      ':root.pf-theme-anim,:root.pf-theme-anim *{transition:background-color .24s ease,color .24s ease,border-color .24s ease,outline-color .24s ease !important}';
    document.head.appendChild(st);
  }
  var read = function () { try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch (e) { return null; } };
  var apply = function (t) {
    var root = document.documentElement;
    root.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = t === 'dark' ? DARK.bg : LIGHT.bg;
  };
  apply(read() || 'light');
  var api = window.pfTheme || {};
  api.get = function () { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; };
  api.primary = PRIMARY; api.neutral = NEUTRAL; api.system = SYSTEM; api.light = LIGHT; api.dark = DARK;
  api.tokens = function () { return api.get() === 'dark' ? DARK : LIGHT; };
  api.set = function (t) {
    var root = document.documentElement;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) { root.classList.add('pf-theme-anim'); clearTimeout(api._tm); api._tm = setTimeout(function () { root.classList.remove('pf-theme-anim'); }, 300); }
    apply(t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    window.dispatchEvent(new CustomEvent('pf-theme', { detail: { theme: t } }));
  };
  api.toggle = function () { api.set(api.get() === 'dark' ? 'light' : 'dark'); };
  window.pfTheme = api;
  window.addEventListener('storage', function (e) { if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) { apply(e.newValue); window.dispatchEvent(new CustomEvent('pf-theme', { detail: { theme: e.newValue } })); } });
})();
