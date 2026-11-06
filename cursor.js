/* Portfolio custom cursor — the native 🌸 emoji in a fixed, pointer-events:none layer, centered on the pointer.
   Clicking plays a short wobble.
   Fine pointers only. The native cursor is hidden only after the first pointer move, so if this script
   fails the native cursor stays. Native cursors are kept for text fields, editable image slots and the PDF
   text layer. Theme-aware through the --pf-fg / --pf-bg / --pf-accent tokens from theme.js.
   States: default · interactive (a, button…) · card ([data-cursor="card"]) · pressed. */
(function () {
  if (window.__pfCursor) return;
  var mq = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!mq || !mq.matches) return;
  window.__pfCursor = true;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NATIVE = 'input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select,[contenteditable]:not([contenteditable=false]),image-slot[data-editable],.textLayer,[data-native-cursor]';
  var INTERACTIVE = 'a[href],button,[role=button],summary,label[for],[tabindex]:not([tabindex="-1"])';

  var st = document.createElement('style');
  st.textContent =
    'html.pf-cursor-on,html.pf-cursor-on *{cursor:none!important}' +
    'html.pf-cursor-on :is(' + NATIVE + '),html.pf-cursor-on :is(' + NATIVE + ') *{cursor:auto!important}' +
    'html.pf-cursor-on :is(input,textarea,[contenteditable]:not([contenteditable=false])){cursor:text!important}' +
    // drag surfaces (e.g. the Instax strip) opt into a native grab / grabbing hand
    'html.pf-cursor-on [data-native-cursor=grab],html.pf-cursor-on [data-native-cursor=grab] *{cursor:grab!important}html.pf-cursor-on [data-native-cursor=grab][data-grabbing],html.pf-cursor-on [data-native-cursor=grab][data-grabbing] *{cursor:grabbing!important}' +
    '#pf-cursor{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;transform-origin:50% 50%;opacity:0;will-change:transform;contain:layout style}' +
    '#pf-cursor .pfc-body,#pf-cursor .pfc-spin{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform-origin:50% 50%}' +
    '#pf-cursor .pfc-body{transition:transform .22s cubic-bezier(.22,1,.36,1)}' +
    '#pf-cursor .pfc-e{display:block;transition:transform .2s cubic-bezier(.22,1,.36,1),opacity .2s ease;font-size:42px;line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;user-select:none;-webkit-user-select:none}' +
    '#pf-cursor[data-s=link] .pfc-body{transform:scale(1.15) rotate(12deg)}' +
    // Project cards: the "View case study" label replaces the arrow entirely.
    '#pf-cursor[data-s=card]{opacity:0!important}' +
    '#pf-cursor .pfc-e.pfc-out{opacity:0;transform:scale(.6)}' +
    (reduce ? '#pf-cursor .pfc-body{transition:none!important}#pf-cursor .pfc-e{transition:opacity .12s linear!important}#pf-cursor .pfc-e.pfc-out{transform:none}' : '');
  document.head.appendChild(st);

  var el = document.createElement('div');
  el.id = 'pf-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="pfc-body"><div class="pfc-spin"><span class="pfc-e">\uD83C\uDF38</span></div></div>';
  var body = el.firstChild;

  // Petal-dust trail, only inside [data-cursor-trail] (set on <html> while the homepage is showing). Tiny pale-primary specks emitted by
  // distance travelled, each a one-shot WAAPI animation removed on finish; capped so the DOM never grows.
  var TRAIL_MAX = 64, TINTS = ['--pf-primary-100', '--pf-primary-200', '--pf-primary-200', '--pf-primary-200', '--pf-primary-300'];
  var trailLayer = null, live = 0, lastEx = 0, lastEy = 0, inTrail = false;
  var emit = function (cx, cy, dx, dy) {
    if (reduce || live >= TRAIL_MAX || !document.body.animate) return;
    if (!trailLayer) {
      trailLayer = document.createElement('div');
      trailLayer.setAttribute('aria-hidden', 'true');
      trailLayer.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden;contain:strict';
    }
    if (!trailLayer.isConnected) document.body.appendChild(trailLayer);
    var p = document.createElement('i');
    var size = 3 + Math.random() * 3;
    var petal = Math.random() < 0.55;
    p.style.cssText = 'position:absolute;left:0;top:0;width:' + size.toFixed(1) + 'px;height:' + (petal ? size * 1.35 : size).toFixed(1) + 'px;' +
      'margin:' + (-size / 2).toFixed(1) + 'px 0 0 ' + (-size / 2).toFixed(1) + 'px;border-radius:' + (petal ? '50% 0 50% 0' : '50%') + ';' +
      'background:var(' + TINTS[(Math.random() * TINTS.length) | 0] + ');will-change:transform,opacity';
    // Drift outward, mostly opposite the motion, with a slight downward settle.
    var len = Math.hypot(dx, dy) || 1, bx = -dx / len, by = -dy / len;
    var ang = Math.atan2(by, bx) + (Math.random() - 0.5) * 2.2;
    var dist = 12 + Math.random() * 24;
    var ox = cx + (Math.random() - 0.5) * 16, oy = cy + (Math.random() - 0.5) * 16;
    var tx = ox + Math.cos(ang) * dist, ty = oy + Math.sin(ang) * dist + 6 + Math.random() * 8;
    var rot = (Math.random() - 0.5) * 220, op = 0.7 + Math.random() * 0.25;
    trailLayer.appendChild(p); live++;
    var a = p.animate([
      { transform: 'translate(' + ox + 'px,' + oy + 'px) scale(.4) rotate(0deg)', opacity: 0 },
      { transform: 'translate(' + (ox + (tx - ox) * 0.3) + 'px,' + (oy + (ty - oy) * 0.3) + 'px) scale(1) rotate(' + (rot * 0.3) + 'deg)', opacity: op, offset: 0.18 },
      { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.7) rotate(' + rot + 'deg)', opacity: 0 }
    ], { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' });
    a.onfinish = a.oncancel = function () { p.remove(); live--; };
  };
  var trail = function (t) {
    inTrail = !!(t && t.closest && t.closest('[data-cursor-trail]')) && state !== 'card' && state !== 'native';
    if (!inTrail) { lastEx = x; lastEy = y; return; }
    var dx = x - lastEx, dy = y - lastEy, d = Math.hypot(dx, dy);
    if (d < 7) return;
    lastEx = x; lastEy = y;
    emit(x, y, dx, dy);
    if (Math.random() < 0.5) emit(x, y, dx, dy);
    if (d > 22) emit(x, y, dx, dy);
  };
  var spin = body.firstChild, spinAnim = null, spinDir = 1;
  // Emoji swap: any ancestor with [data-cursor-emoji] sets the glyph (default 🌸). Quick shrink-fade out,
  // swap, grow back in (~200ms total); a newer swap mid-flight just retargets the glyph.
  var DEFAULT_EMOJI = '\uD83C\uDF38', glyph = spin.firstChild, curEmoji = DEFAULT_EMOJI, wantEmoji = DEFAULT_EMOJI, swapT = 0;
  var setEmoji = function (e) {
    e = e || DEFAULT_EMOJI;
    if (e === wantEmoji) return;
    wantEmoji = e;
    if (swapT) return;
    glyph.classList.add('pfc-out');
    swapT = setTimeout(function () {
      swapT = 0; curEmoji = wantEmoji; glyph.textContent = curEmoji;
      requestAnimationFrame(function () { glyph.classList.remove('pfc-out'); });
    }, reduce ? 60 : 100);
  };
  var emojiFor = function (t) { var h = t && t.closest && t.closest('[data-cursor-emoji]'); return h ? h.getAttribute('data-cursor-emoji') : ''; };

  var x = -100, y = -100, px = -100, py = -100, tilt = 0, raf = 0, on = false, hidden = false, state = '';
  var mount = function () { if (!el.isConnected) document.body.appendChild(el); };

  var frame = function () {
    raf = 0;
    // Position is applied directly (no positional lag); only the tilt eases, from horizontal velocity.
    var vx = x - px; px = x; py = y;
    var target = reduce ? 0 : Math.max(-8, Math.min(8, vx * 0.5));
    tilt += (target - tilt) * 0.22;
    if (Math.abs(tilt) < 0.05) tilt = 0;
    el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + tilt.toFixed(2) + 'deg)';
    if (tilt !== 0) raf = requestAnimationFrame(frame);
  };
  var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };

  var classify = function (t) {
    if (!t || !t.closest) return '';
    if (t.closest(NATIVE)) return 'native';
    if (t.closest('[data-cursor=card]')) return 'card';
    if (t.closest(INTERACTIVE)) return 'link';
    return '';
  };
  var setState = function (s) {
    if (s === state) return;
    state = s;
    if (s === 'native') { el.style.opacity = '0'; el.removeAttribute('data-s'); return; }
    el.style.opacity = hidden ? '0' : '1';
    if (s) el.setAttribute('data-s', s); else el.removeAttribute('data-s');
  };

  // Claude Design Edit mode only. Inside the editor, Edit mode turns on its element picker, which marks
  // <body data-dc-editor-on> (and the host's mode bridge sets window.__editModeActive = true). Interact and
  // Comment modes clear both, and neither exists on the deployed site, so only Edit mode suspends the
  // cursor: no custom cursor, trail or native-cursor hiding. A body-attribute observer reacts instantly;
  // the light interval covers the window flag. Leaving Edit mode resumes the cursor on the next pointer move.
  var editing = function () {
    try { return (document.body && document.body.hasAttribute('data-dc-editor-on')) || window.__editModeActive === true; }
    catch (_) { return false; }
  };
  var suspended = false;
  var suspend = function () {
    suspended = true; on = false; hidden = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (swapT) { clearTimeout(swapT); swapT = 0; }
    document.documentElement.classList.remove('pf-cursor-on');
    if (el) { el.style.opacity = '0'; el.removeAttribute('data-down'); el.removeAttribute('data-s'); }
    if (trailLayer) trailLayer.style.display = 'none';
    state = null;
  };
  var resume = function () { suspended = false; if (trailLayer) trailLayer.style.display = ''; };
  var checkMode = function () { var e = editing(); if (e && !suspended) suspend(); else if (!e && suspended) resume(); };
  var modeT = setInterval(checkMode, 400);
  var modeMO = null;
  if (window.MutationObserver && document.body) { modeMO = new MutationObserver(checkMode); modeMO.observe(document.body, { attributes: true, attributeFilter: ['data-dc-editor-on'] }); }
  checkMode();

  var onMove = function (e) {
    if (editing()) { if (!suspended) suspend(); return; }
    if (suspended) resume();
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    x = e.clientX; y = e.clientY;
    if (!on) {
      on = true; px = x; mount();
      document.documentElement.classList.add('pf-cursor-on');
    }
    if (hidden) { hidden = false; if (state !== 'native') el.style.opacity = '1'; }
    var path = e.composedPath ? e.composedPath() : null;
    var tgt = path && path[0] && path[0].closest ? path[0] : e.target;
    setState(classify(tgt));
    setEmoji(emojiFor(tgt));
    if (state !== 'native' && el.style.opacity !== '1') el.style.opacity = '1';
    trail(path && path[0] && path[0].closest ? path[0] : e.target);
    kick();
  };
  var onLeave = function () { hidden = true; el.style.opacity = '0'; };
  // Click: a short spin with a squash-and-bounce, alternating direction. Restarting cancels the previous run.
  var onDown = function (e) {
    if (suspended) return;
    if (e && e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    el.setAttribute('data-down', '');
    if (!spin.animate) return;
    if (spinAnim) spinAnim.cancel();
    spinDir = -spinDir;
    var d = spinDir;
    spinAnim = reduce
      ? spin.animate([{ transform: 'scale(1)' }, { transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' })
      : spin.animate([
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(' + (d * 22) + 'deg) scale(.88)', offset: 0.28 },
          { transform: 'rotate(' + (d * -10) + 'deg) scale(1.08)', offset: 0.62 },
          { transform: 'rotate(' + (d * 4) + 'deg) scale(.98)', offset: 0.84 },
          { transform: 'rotate(0deg) scale(1)' }
        ], { duration: 560, easing: 'cubic-bezier(.3,.7,.3,1)' });
  };
  var onUp = function () { el.removeAttribute('data-down'); };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('blur', onLeave);
  document.documentElement.addEventListener('pointerleave', onLeave);
  // Re-check the hovered element after route changes / re-renders (content moves under a still pointer).
  window.addEventListener('hashchange', function () { setTimeout(function () { if (suspended) return; var t = document.elementFromPoint(x, y); setState(classify(t)); setEmoji(emojiFor(t)); }, 60); });

  window.pfCursorDestroy = function () {
    clearInterval(modeT); if (modeMO) modeMO.disconnect();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('blur', onLeave);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    if (raf) cancelAnimationFrame(raf);
    if (swapT) clearTimeout(swapT);
    document.documentElement.classList.remove('pf-cursor-on');
    el.remove(); st.remove(); if (trailLayer) trailLayer.remove(); window.__pfCursor = false;
  };
})();
