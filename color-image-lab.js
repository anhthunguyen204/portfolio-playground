/* Color & Image Lab — <pf-color-image-lab mode="preview|full" back-href="#/playground" full-href="#/tools/color-image-lab">
   Everything runs in the browser; nothing is uploaded and there are no dependencies.
   - Color Lab: one gradient model renders to CSS (live preview + copied code) and to Canvas 2D (PNG export).
   - Image Effects: each effect is a Canvas 2D pixel pipeline. Preview, thumbnails and export call the same
     function; pixel-sized parameters are authored at a 1000px reference and scaled by the image's long edge,
     so a 4000px export matches the 1400px preview. */
(function () {
  if (window.customElements && customElements.get('pf-color-image-lab')) return;

  // ---------- utilities ----------
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var hexToRgb = function (h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  var rgbToHex = function (r, g, b) { return '#' + [r, g, b].map(function (v) { return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'); }).join('').toUpperCase(); };
  var hsl = function (h, s, l) { h = ((h % 360) + 360) % 360 / 360; var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; var f = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var rng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  var cv = function (w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  var cx2 = function (c) { return c.getContext('2d', { willReadFrequently: true }); };
  var FILTER_OK = (function () { try { var x = document.createElement('canvas').getContext('2d'); x.filter = 'blur(2px)'; return x.filter === 'blur(2px)'; } catch (_) { return false; } })();
  var lum = function (r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };

  // Blur a canvas. Uses ctx.filter where the browser supports it; otherwise a multi-pass down/up-scale (close to a
  // Gaussian). Preview and export go through the same branch in a given browser, so they match.
  function blurred(src, r) {
    var w = src.width, h = src.height, out = cv(w, h), o = out.getContext('2d');
    if (r <= 0.3) { o.drawImage(src, 0, 0); return out; }
    if (FILTER_OK) { var pad = Math.ceil(r * 2.2), big = cv(w + pad * 2, h + pad * 2), b = big.getContext('2d');
      b.drawImage(src, pad, pad); b.drawImage(src, 0, 0, 1, h, 0, pad, pad, h); b.drawImage(src, w - 1, 0, 1, h, pad + w, pad, pad, h); b.drawImage(src, 0, 0, w, 1, pad, 0, w, pad); b.drawImage(src, 0, h - 1, w, 1, pad, pad + h, w, pad);
      o.filter = 'blur(' + r + 'px)'; o.drawImage(big, -pad, -pad); o.filter = 'none'; return out; }
    var f = Math.max(1, r / 1.6), sw = Math.max(1, Math.round(w / f)), sh = Math.max(1, Math.round(h / f)), s = cv(sw, sh), sc = s.getContext('2d');
    sc.imageSmoothingQuality = 'high'; sc.drawImage(src, 0, 0, sw, sh);
    var s2 = cv(Math.max(1, sw / 2), Math.max(1, sh / 2)); s2.getContext('2d').drawImage(s, 0, 0, s2.width, s2.height); sc.clearRect(0, 0, sw, sh); sc.drawImage(s2, 0, 0, sw, sh);
    o.imageSmoothingQuality = 'high'; o.drawImage(s, 0, 0, w, h); return out;
  }
  function data(c) { return c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height); }
  function copyTo(out, src) { var o = out.getContext('2d'); o.clearRect(0, 0, out.width, out.height); o.drawImage(src, 0, 0); return o; }
  function bilinear(d, w, h, x, y, ch) { x = clamp(x, 0, w - 1.001); y = clamp(y, 0, h - 1.001); var x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = (y0 * w + x0) * 4 + ch, a = d[i], b = d[i + 4], c = d[i + w * 4], e = d[i + w * 4 + 4]; return (a + (b - a) * fx) * (1 - fy) + (c + (e - c) * fx) * fy; }
  // Generic displacement: fn(x, y) returns [sx, sy] (or per-channel via fnc) — bilinear sampling.
  function displace(src, out, fn, post) {
    var w = src.width, h = src.height, S = data(src), sd = S.data, O = out.getContext('2d').createImageData(w, h), od = O.data;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var p = fn(x, y), i = (y * w + x) * 4;
      for (var c = 0; c < 4; c++) od[i + c] = bilinear(sd, w, h, p[c < 3 ? c : 3][0], p[c < 3 ? c : 3][1], c);
      if (post) post(od, i, x, y, p);
    }
    out.getContext('2d').putImageData(O, 0, 0);
  }
  function mapPixels(src, out, fn) {
    var S = data(src), d = S.data;
    for (var i = 0, n = d.length; i < n; i += 4) fn(d, i, (i / 4) % src.width, ((i / 4) / src.width) | 0);
    out.getContext('2d').putImageData(S, 0, 0);
  }
  function noiseCanvas(w, h, size, mono, seed) {
    var nw = Math.max(1, Math.round(w / size)), nh = Math.max(1, Math.round(h / size)), n = cv(nw, nh), x = n.getContext('2d'), I = x.createImageData(nw, nh), d = I.data, r = rng(seed || 7);
    for (var i = 0; i < d.length; i += 4) { var v = r() * 255; d[i] = v; d[i + 1] = mono ? v : r() * 255; d[i + 2] = mono ? v : r() * 255; d[i + 3] = 255; }
    x.putImageData(I, 0, 0); var o = cv(w, h), oc = o.getContext('2d'); oc.imageSmoothingEnabled = size > 1.6; oc.drawImage(n, 0, 0, w, h); return o;
  }
  var mix = function (a, b, t) { return a + (b - a) * t; };

  // ---------- gradients ----------
  var sortStops = function (g) { return g.stops.slice().sort(function (a, b) { return a.p - b.p; }); };
  var stopColor = function (s) { var c = hexToRgb(s.c); return s.a >= 1 ? s.c.toUpperCase() : 'rgba(' + c.join(', ') + ', ' + (+s.a.toFixed(2)) + ')'; };
  function gradCSS(g) {
    var st = sortStops(g).map(function (s) { return stopColor(s) + ' ' + Math.round(s.p) + '%'; }).join(', ');
    if (g.type === 'radial') return 'radial-gradient(ellipse ' + g.size + '% ' + g.size + '% at ' + g.cx + '% ' + g.cy + '%, ' + st + ')';
    if (g.type === 'conic') return 'conic-gradient(from ' + g.angle + 'deg at ' + g.cx + '% ' + g.cy + '%, ' + st + ')';
    return 'linear-gradient(' + g.angle + 'deg, ' + st + ')';
  }
  // Paint gradient g over the rect (x, y, w, h) of ctx — same geometry as gradCSS.
  function paintGrad(ctx, g, x, y, w, h) {
    var st = sortStops(g), add = function (gr) { st.forEach(function (s) { gr.addColorStop(clamp(s.p / 100, 0, 1), stopColor(s)); }); return gr; };
    ctx.save();
    if (g.type === 'radial') {
      var px = x + w * g.cx / 100, py = y + h * g.cy / 100, rx = Math.max(1, w * g.size / 100), ry = Math.max(1, h * g.size / 100);
      ctx.translate(px, py); ctx.scale(rx, ry); ctx.fillStyle = add(ctx.createRadialGradient(0, 0, 0, 0, 0, 1)); ctx.fillRect((x - px) / rx, (y - py) / ry, w / rx, h / ry);
    } else if (g.type === 'conic' && ctx.createConicGradient) {
      ctx.fillStyle = add(ctx.createConicGradient((g.angle - 90) * Math.PI / 180, x + w * g.cx / 100, y + h * g.cy / 100)); ctx.fillRect(x, y, w, h);
    } else {
      var a = (g.type === 'conic' ? 90 : g.angle) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), L = Math.abs(w * dx) + Math.abs(h * dy), mx = x + w / 2, my = y + h / 2;
      ctx.fillStyle = add(ctx.createLinearGradient(mx - dx * L / 2, my - dy * L / 2, mx + dx * L / 2, my + dy * L / 2)); ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }
  var G = function (type, angle, cx, cy, size, stops) { return { type: type, angle: angle, cx: cx, cy: cy, size: size, stops: stops.map(function (s) { var p = s.split('@'); return { c: p[0], a: 1, p: +p[1] }; }) }; };
  var PRESETS = [
    ['Raspberry', G('linear', 135, 50, 50, 80, ['#C21E56@0', '#F472B6@55', '#FCE7F3@100'])],
    ['Peach fizz', G('linear', 160, 50, 50, 80, ['#FFEDD5@0', '#FDBA74@50', '#FB7185@100'])],
    ['Lilac haze', G('radial', 0, 30, 25, 95, ['#F5F3FF@0', '#C4B5FD@45', '#818CF8@100'])],
    ['Mint dew', G('linear', 200, 50, 50, 80, ['#ECFDF5@0', '#6EE7B7@55', '#0D9488@100'])],
    ['Sunset', G('linear', 180, 50, 50, 80, ['#1E1B4B@0', '#9D174D@45', '#FB923C@78', '#FDE68A@100'])],
    ['Ocean', G('linear', 120, 50, 50, 80, ['#0C4A6E@0', '#0EA5E9@55', '#A5F3FC@100'])],
    ['Aurora', G('conic', 210, 40, 60, 80, ['#22D3EE@0', '#A78BFA@30', '#F472B6@55', '#34D399@80', '#22D3EE@100'])],
    ['Bloom', G('radial', 0, 50, 55, 70, ['#FFF1F2@0', '#FDA4AF@40', '#C21E56@100'])],
    ['Ink', G('linear', 150, 50, 50, 80, ['#0A0A0A@0', '#27272A@60', '#52525B@100'])],
    ['Butter', G('radial', 0, 70, 30, 90, ['#FEFCE8@0', '#FDE68A@50', '#F59E0B@100'])],
    ['Sorbet', G('conic', 0, 50, 50, 80, ['#FECDD3@0', '#FDE68A@33', '#BBF7D0@66', '#FECDD3@100'])],
    ['Night', G('radial', 0, 80, 10, 120, ['#4C1D95@0', '#1E1B4B@55', '#020617@100'])]
  ];
  function randomGrad() {
    var r = Math.random, types = ['linear', 'linear', 'radial', 'conic'], t = types[(r() * 4) | 0], base = r() * 360, n = 2 + ((r() * 3) | 0), step = [30, 45, 160, 200][(r() * 4) | 0];
    var stops = []; for (var i = 0; i < n; i++) { var c = hsl(base + step * i * (r() > .5 ? 1 : -.6), .55 + r() * .35, .5 + r() * .35); stops.push({ c: rgbToHex(c[0], c[1], c[2]), a: 1, p: Math.round(i / (n - 1) * 100) }); }
    if (t === 'conic') stops.push({ c: stops[0].c, a: 1, p: 100 }), stops.forEach(function (s, i) { s.p = Math.round(i / (stops.length - 1) * 100); });
    return { type: t, angle: Math.round(r() * 360), cx: Math.round(20 + r() * 60), cy: Math.round(20 + r() * 60), size: Math.round(60 + r() * 60), stops: stops };
  }

  // ---------- gradient elements ----------
  var SHAPES = {
    wave: { label: 'Wave', vb: [160, 100], d: 'M0 58 C 26 22, 52 22, 80 50 S 134 82, 160 40 L 160 70 C 134 112, 102 102, 80 80 S 26 46, 0 92 Z' },
    blob: { label: 'Blob', vb: [100, 100], d: 'M54 4 C 76 4 96 20 96 44 C 96 66 84 92 58 96 C 32 100 6 86 4 60 C 2 34 26 4 54 4 Z' },
    circle: { label: 'Circle', vb: [100, 100], d: 'M50 2 A 48 48 0 1 1 49.99 2 Z' },
    triangle: { label: 'Triangle', vb: [100, 100], d: 'M50 8 Q 54 8 56 12 L 95 84 Q 97 90 90 90 L 10 90 Q 3 90 5 84 L 44 12 Q 46 8 50 8 Z' },
    square: { label: 'Rounded square', vb: [100, 100], d: 'M22 4 H 78 Q 96 4 96 22 V 78 Q 96 96 78 96 H 22 Q 4 96 4 78 V 22 Q 4 4 22 4 Z' },
    text: { label: 'Text', vb: [100, 100], d: '' }
  };
  var maskURL = function (k) { var s = SHAPES[k]; return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s.vb[0] + ' ' + s.vb[1] + '" preserveAspectRatio="none"><path d="' + s.d + '"/></svg>') + '")'; };
  var elId = 0;
  var newEl = function (kind, o) { var g = clone(PRESETS[(elId * 5) % PRESETS.length][1]); return Object.assign({ id: 'e' + (++elId), kind: kind, x: 50, y: 50, scale: 1, rot: 0, opacity: 1, blur: 0, text: 'Bloom', grad: g }, o || {}); };
  var defaultEls = function () { return [
    newEl('wave', { x: 46, y: 58, scale: 1.9, rot: -8, grad: clone(PRESETS[1][1]) }),
    newEl('blob', { x: 74, y: 32, scale: 0.85, blur: 6, opacity: .9, grad: clone(PRESETS[2][1]) }),
    newEl('circle', { x: 22, y: 30, scale: 0.55, grad: clone(PRESETS[7][1]) }),
    newEl('text', { x: 50, y: 50, scale: 1, text: 'Bloom', grad: clone(PRESETS[0][1]) })
  ]; };
  var STAGE_BG = { light: '#F7F5F2', dark: '#141414' };
  function drawElement(ctx, el, W, H) {
    var s = SHAPES[el.kind], cxp = W * el.x / 100, cyp = H * el.y / 100, off, ow, oh;
    if (el.kind === 'text') {
      var fs = 0.16 * W * el.scale, t = cx2(cv(2, 2)); t.font = '800 ' + fs + 'px Archivo, "Helvetica Neue", Arial, sans-serif';
      ow = Math.ceil(t.measureText(el.text).width + fs * 0.2); oh = Math.ceil(fs * 1.25); off = cv(ow, oh); var o = off.getContext('2d');
      o.font = t.font; o.textBaseline = 'middle'; o.textAlign = 'center'; o.fillStyle = '#000'; o.fillText(el.text, ow / 2, oh / 2);
      o.globalCompositeOperation = 'source-in'; paintGrad(o, el.grad, 0, 0, ow, oh);
    } else {
      ow = 0.36 * W * el.scale; oh = ow * s.vb[1] / s.vb[0]; off = cv(ow, oh); var c = off.getContext('2d');
      c.save(); c.scale(off.width / s.vb[0], off.height / s.vb[1]); c.fillStyle = '#000'; c.fill(new Path2D(s.d)); c.restore();
      c.globalCompositeOperation = 'source-in'; paintGrad(c, el.grad, 0, 0, off.width, off.height);
    }
    var b = el.blur * W / 1000, src = off;
    if (b > 0.3) { var pad = Math.ceil(b * 3), big = cv(off.width + pad * 2, off.height + pad * 2); big.getContext('2d').drawImage(off, pad, pad); src = blurred(big, b); }
    ctx.save(); ctx.globalAlpha = el.opacity; ctx.translate(cxp, cyp); ctx.rotate(el.rot * Math.PI / 180); ctx.drawImage(src, -src.width / 2, -src.height / 2); ctx.restore();
  }

  // ---------- image effects ----------
  var R = function (k, label, min, max, step, def) { return { k: k, label: label, type: 'range', min: min, max: max, step: step, def: def }; };
  var C = function (k, label, def) { return { k: k, label: label, type: 'color', def: def }; };
  var S = function (k, label, opts, def) { return { k: k, label: label, type: 'select', opts: opts, def: def }; };
  var CATS = ['Glass & Reflection', 'Light', 'Texture', 'Distortion', 'Blur', 'Color', 'Experimental'];
  var FX = [
    { id: 'frosted', name: 'Frosted Glass', cat: 0, params: [R('blur', 'Blur amount', 0, 60, 1, 18), R('scatter', 'Frost scatter', 0, 30, 1, 8), R('frost', 'Frost opacity', 0, 1, .01, .28), R('grain', 'Grain', 0, 1, .01, .25)],
      run: function (src, out, p, k) { var b = blurred(src, p.blur * k), r = rng(11), sc = p.scatter * k; var w = b.width, h = b.height;
        if (sc > 0) displace(b, out, function (x, y) { var q = [x + (r() - .5) * 2 * sc, y + (r() - .5) * 2 * sc]; return [q, q, q, q]; }); else copyTo(out, b);
        var o = out.getContext('2d'); o.fillStyle = 'rgba(255,255,255,' + p.frost + ')'; o.fillRect(0, 0, w, h);
        if (p.grain > 0) { o.save(); o.globalAlpha = p.grain * .5; o.globalCompositeOperation = 'overlay'; o.drawImage(noiseCanvas(w, h, 1.2 * k, true, 5), 0, 0); o.restore(); } } },
    { id: 'mirror', name: 'Blurry Mirror', cat: 0, params: [S('axis', 'Mirror axis', ['Vertical', 'Horizontal'], 'Vertical'), R('split', 'Split position', 20, 80, 1, 50), R('blur', 'Blur amount', 0, 60, 1, 22), R('opacity', 'Reflection opacity', 0, 1, .01, .9)],
      run: function (src, out, p, k) { var w = src.width, h = src.height, o = copyTo(out, src), v = p.axis === 'Vertical', at = (v ? w : h) * p.split / 100, ref = cv(w, h), rc = ref.getContext('2d');
        rc.save(); if (v) { rc.translate(at * 2, 0); rc.scale(-1, 1); } else { rc.translate(0, at * 2); rc.scale(1, -1); } rc.drawImage(src, 0, 0); rc.restore();
        var b = blurred(ref, p.blur * k); o.save(); o.beginPath(); if (v) o.rect(at, 0, w - at, h); else o.rect(0, at, w, h - at); o.clip(); o.globalAlpha = p.opacity; o.drawImage(b, 0, 0); o.restore();
        o.fillStyle = 'rgba(255,255,255,.35)'; if (v) o.fillRect(at - .5 * k, 0, 1 * k, h); else o.fillRect(0, at - .5 * k, w, 1 * k); } },
    { id: 'liquid', name: 'Liquid Glass', cat: 0, params: [R('strength', 'Distortion strength', 0, 80, 1, 26), R('scale', 'Wave scale', 40, 400, 1, 160), R('highlight', 'Highlight', 0, 1, .01, .45), R('blur', 'Softness', 0, 12, .5, 1.5)],
      run: function (src, out, p, k) { var s = p.strength * k, f = 2 * Math.PI / (p.scale * k), base = blurred(src, p.blur * k);
        displace(base, out, function (x, y) { var dx = s * Math.sin(y * f + Math.sin(x * f * .7) * 1.3), dy = s * Math.cos(x * f * .8 + Math.sin(y * f * .6) * 1.1), q = [x + dx, y + dy]; return [q, q, q, q]; },
          function (d, i, x, y) { if (!p.highlight) return; var hl = Math.pow(Math.max(0, Math.sin(y * f + Math.sin(x * f * .7) * 1.3 + 1.1)), 14) * p.highlight * 255; d[i] = Math.min(255, d[i] + hl); d[i + 1] = Math.min(255, d[i + 1] + hl); d[i + 2] = Math.min(255, d[i + 2] + hl); }); } },
    { id: 'refraction', name: 'Glass Refraction', cat: 0, params: [R('rib', 'Rib width', 8, 120, 1, 38), R('strength', 'Refraction', 0, 2, .01, .9), R('shade', 'Rib shading', 0, 1, .01, .35), R('blur', 'Softness', 0, 10, .5, 1)],
      run: function (src, out, p, k) { var rw = p.rib * k, base = blurred(src, p.blur * k);
        displace(base, out, function (x, y) { var u = (x % rw) / rw, c = x - u * rw + rw / 2, q = [c + (u - .5) * rw * (1 - p.strength), y]; return [q, q, q, q]; },
          function (d, i, x) { var u = (x % rw) / rw, sh = 1 - p.shade * Math.pow(Math.abs(u - .5) * 2, 2) * .55 + p.shade * .12 * Math.pow(Math.max(0, 1 - Math.abs(u - .25) * 6), 2); d[i] *= sh; d[i + 1] *= sh; d[i + 2] *= sh; }); } },
    { id: 'glow', name: 'Soft Glow', cat: 1, params: [R('radius', 'Glow radius', 2, 80, 1, 24), R('intensity', 'Intensity', 0, 1, .01, .55)],
      run: function (src, out, p, k) { var o = copyTo(out, src); o.save(); o.globalCompositeOperation = 'screen'; o.globalAlpha = p.intensity; o.drawImage(blurred(src, p.radius * k), 0, 0); o.restore(); } },
    { id: 'bloom', name: 'Bloom', cat: 1, params: [R('threshold', 'Threshold', 0, 1, .01, .62), R('radius', 'Bloom radius', 2, 100, 1, 30), R('intensity', 'Intensity', 0, 2, .01, 1)],
      run: function (src, out, p, k) { var t = cv(src.width, src.height); mapPixels(src, t, function (d, i) { var l = lum(d[i], d[i + 1], d[i + 2]), m = clamp((l - p.threshold) / Math.max(.02, 1 - p.threshold), 0, 1); d[i] *= m; d[i + 1] *= m; d[i + 2] *= m; });
        var o = copyTo(out, src); o.save(); o.globalCompositeOperation = 'lighter'; o.globalAlpha = Math.min(1, p.intensity); o.drawImage(blurred(t, p.radius * k), 0, 0); if (p.intensity > 1) { o.globalAlpha = p.intensity - 1; o.drawImage(blurred(t, p.radius * k * .4), 0, 0); } o.restore(); } },
    { id: 'flare', name: 'Lens Flare', cat: 1, params: [R('x', 'Light X', 0, 100, 1, 24), R('y', 'Light Y', 0, 100, 1, 22), R('intensity', 'Intensity', 0, 1, .01, .75), C('color', 'Tint', '#FFD9A8')],
      run: function (src, out, p, k) { var o = copyTo(out, src), w = src.width, h = src.height, lx = w * p.x / 100, ly = h * p.y / 100, mx = w / 2, my = h / 2, c = hexToRgb(p.color), D = Math.max(w, h), a = p.intensity;
        var blob = function (x, y, r, col, al, ring) { var g = o.createRadialGradient(x, y, 0, x, y, r); var rc = 'rgba(' + col.join(',') + ','; if (ring) { g.addColorStop(0, rc + '0)'); g.addColorStop(.78, rc + (al * .2) + ')'); g.addColorStop(.92, rc + al + ')'); g.addColorStop(1, rc + '0)'); } else { g.addColorStop(0, rc + al + ')'); g.addColorStop(1, rc + '0)'); } o.fillStyle = g; o.fillRect(x - r, y - r, r * 2, r * 2); };
        o.save(); o.globalCompositeOperation = 'screen'; blob(lx, ly, D * .32, c, .55 * a); blob(lx, ly, D * .06, [255, 255, 255], .95 * a);
        o.save(); o.translate(lx, ly); o.scale(1, .025); blob(0, 0, D * .55, c, .6 * a); o.restore();
        [[-.35, .05, [180, 220, 255], .35], [-.7, .09, [255, 170, 210], .25], [.4, .035, [200, 255, 220], .4], [1.25, .14, c, .18, 1], [1.6, .05, [255, 210, 150], .3]].forEach(function (g) { blob(mx + (mx - lx) * g[0] * -1 + (lx - mx) * 0, my + (my - ly) * g[0] * -1, D * g[1], g[2], g[3] * a, g[4]); });
        o.restore(); } },
    { id: 'leak', name: 'Light Leak', cat: 1, params: [S('edge', 'Leak from', ['Left', 'Right', 'Top', 'Corner'], 'Left'), C('color', 'Leak color', '#FF7A3D'), C('color2', 'Second color', '#FF3D8B'), R('intensity', 'Intensity', 0, 1, .01, .7)],
      run: function (src, out, p, k) { var o = copyTo(out, src), w = src.width, h = src.height, D = Math.max(w, h), pos = { Left: [[0, .35], [0, .8]], Right: [[1, .3], [1, .75]], Top: [[.3, 0], [.75, 0]], Corner: [[0, 0], [.2, .05]] }[p.edge];
        o.save(); o.globalCompositeOperation = 'screen'; [[p.color, pos[0], .55], [p.color2, pos[1], .42]].forEach(function (l, i) { var x = w * l[1][0], y = h * l[1][1], r = D * l[2], g = o.createRadialGradient(x, y, 0, x, y, r), c = hexToRgb(l[0]).join(','); g.addColorStop(0, 'rgba(' + c + ',' + p.intensity + ')'); g.addColorStop(.45, 'rgba(' + c + ',' + (p.intensity * .45) + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); o.fillStyle = g; o.fillRect(0, 0, w, h); });
        o.restore(); } },
    { id: 'grain', name: 'Film Grain', cat: 2, params: [R('amount', 'Amount', 0, 1, .01, .45), R('size', 'Grain size', 1, 6, .1, 1.6), R('fade', 'Faded blacks', 0, .3, .01, .06)],
      run: function (src, out, p, k) { var o = copyTo(out, src), w = src.width, h = src.height; if (p.fade) { o.fillStyle = 'rgba(40,32,28,' + p.fade + ')'; o.globalCompositeOperation = 'lighten'; o.fillRect(0, 0, w, h); o.globalCompositeOperation = 'source-over'; }
        o.save(); o.globalCompositeOperation = 'overlay'; o.globalAlpha = p.amount; o.drawImage(noiseCanvas(w, h, p.size * k, true, 3), 0, 0); o.restore(); } },
    { id: 'noise', name: 'Noise', cat: 2, params: [R('amount', 'Amount', 0, 1, .01, .3), R('size', 'Noise size', 1, 8, .1, 1), S('mode', 'Noise type', ['Color', 'Mono'], 'Color')],
      run: function (src, out, p, k) { var o = copyTo(out, src); o.save(); o.globalAlpha = p.amount; o.globalCompositeOperation = 'soft-light'; o.drawImage(noiseCanvas(src.width, src.height, p.size * k, p.mode === 'Mono', 9), 0, 0); o.globalAlpha = p.amount * .35; o.globalCompositeOperation = 'source-over'; o.drawImage(noiseCanvas(src.width, src.height, p.size * k, p.mode === 'Mono', 13), 0, 0); o.restore(); } },
    { id: 'halftone', name: 'Halftone', cat: 2, params: [R('dot', 'Dot size', 3, 40, .5, 10), R('angle', 'Screen angle', 0, 90, 1, 45), S('mode', 'Color mode', ['Ink', 'Color'], 'Ink'), C('ink', 'Ink', '#1A1A1A'), C('paper', 'Paper', '#F6F0E6')],
      run: function (src, out, p, k) { var w = src.width, h = src.height, cell = Math.max(2, p.dot * k), o = out.getContext('2d'), sw = Math.max(1, Math.round(w / cell)), sh = Math.max(1, Math.round(h / cell)), sm = cv(sw, sh), sc = sm.getContext('2d');
        sc.imageSmoothingQuality = 'high'; sc.drawImage(src, 0, 0, sw, sh); var sd = sc.getImageData(0, 0, sw, sh).data; o.clearRect(0, 0, w, h); o.fillStyle = p.paper; o.fillRect(0, 0, w, h);
        var a = p.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), D = Math.hypot(w, h), cxp = w / 2, cyp = h / 2; o.fillStyle = p.ink;
        for (var v = -D / 2; v < D / 2; v += cell) for (var u = -D / 2; u < D / 2; u += cell) { var x = cxp + u * ca - v * sa, y = cyp + u * sa + v * ca; if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
          var ix = clamp((x / w * sw) | 0, 0, sw - 1), iy = clamp((y / h * sh) | 0, 0, sh - 1), i = (iy * sw + ix) * 4; if (sd[i + 3] < 10) continue; var dark = 1 - lum(sd[i], sd[i + 1], sd[i + 2]), r = Math.sqrt(dark) * cell * .62; if (r < .3) continue;
          if (p.mode === 'Color') o.fillStyle = 'rgb(' + sd[i] + ',' + sd[i + 1] + ',' + sd[i + 2] + ')', r = cell * .62 * Math.sqrt(.25 + .75 * dark);
          o.beginPath(); o.arc(x, y, r, 0, Math.PI * 2); o.fill(); } } },
    { id: 'paper', name: 'Paper Texture', cat: 2, params: [R('amount', 'Texture amount', 0, 1, .01, .6), R('warmth', 'Warmth', 0, 1, .01, .5), R('fibers', 'Fibers', 0, 1, .01, .5)],
      run: function (src, out, p, k) { var w = src.width, h = src.height, pc = cv(w, h), c = pc.getContext('2d'), r = rng(21), warm = rgbToHex(mix(250, 244, p.warmth), mix(250, 234, p.warmth), mix(250, 214, p.warmth));
        c.fillStyle = warm; c.fillRect(0, 0, w, h); c.globalAlpha = .55; c.globalCompositeOperation = 'multiply'; c.drawImage(blurred(noiseCanvas(w, h, 3 * k, true, 17), 1.2 * k), 0, 0); c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over'; c.lineCap = 'round'; var n = Math.round(w * h / (900 * k * k) * p.fibers); for (var i = 0; i < n; i++) { var x = r() * w, y = r() * h, L = (8 + r() * 26) * k, an = r() * Math.PI; c.strokeStyle = 'rgba(120,96,70,' + (.05 + r() * .1) + ')'; c.lineWidth = (.4 + r() * .7) * k; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(an) * L * .5 + (r() - .5) * 6 * k, y + Math.sin(an) * L * .5, x + Math.cos(an) * L, y + Math.sin(an) * L); c.stroke(); }
        var o = copyTo(out, src); o.save(); o.globalCompositeOperation = 'multiply'; o.globalAlpha = p.amount; o.drawImage(pc, 0, 0); o.restore(); } },
    { id: 'chroma', name: 'Chromatic Aberration', cat: 3, params: [R('strength', 'Strength', 0, 4, .01, 1.2), R('falloff', 'Edge falloff', .5, 3, .01, 1.4)],
      run: function (src, out, p) { var w = src.width, h = src.height, mx = w / 2, my = h / 2, s = p.strength * .012, R0 = Math.hypot(mx, my);
        displace(src, out, function (x, y) { var dx = x - mx, dy = y - my, f = Math.pow(Math.hypot(dx, dy) / R0, p.falloff) * s; return [[mx + dx * (1 + f), my + dy * (1 + f)], [x, y], [mx + dx * (1 - f), my + dy * (1 - f)], [x, y]]; }); } },
    { id: 'rgbsplit', name: 'RGB Split', cat: 3, params: [R('dist', 'Distance', 0, 60, .5, 10), R('angle', 'Direction', 0, 360, 1, 0), R('mixv', 'Mix', 0, 1, .01, 1)],
      run: function (src, out, p, k) { var a = p.angle * Math.PI / 180, dx = Math.cos(a) * p.dist * k * p.mixv, dy = Math.sin(a) * p.dist * k * p.mixv;
        displace(src, out, function (x, y) { return [[x - dx, y - dy], [x, y], [x + dx, y + dy], [x, y]]; }); } },
    { id: 'ripple', name: 'Ripple', cat: 3, params: [R('amp', 'Amplitude', 0, 40, .5, 10), R('wave', 'Wavelength', 10, 200, 1, 46), R('cx', 'Center X', 0, 100, 1, 50), R('cy', 'Center Y', 0, 100, 1, 50), R('damp', 'Damping', 0, 1, .01, .5)],
      run: function (src, out, p, k) { var w = src.width, h = src.height, mx = w * p.cx / 100, my = h * p.cy / 100, A = p.amp * k, L = p.wave * k, D = Math.hypot(w, h);
        displace(src, out, function (x, y) { var dx = x - mx, dy = y - my, r = Math.hypot(dx, dy) || 1, o = A * Math.sin(r / L * Math.PI * 2) * (1 - p.damp * r / D), q = [x + dx / r * o, y + dy / r * o]; return [q, q, q, q]; }); } },
    { id: 'wave', name: 'Wave Distortion', cat: 3, params: [R('amp', 'Amplitude', 0, 80, .5, 18), R('freq', 'Frequency', .5, 20, .1, 4), S('dir', 'Direction', ['Horizontal', 'Vertical'], 'Horizontal')],
      run: function (src, out, p, k) { var A = p.amp * k, w = src.width, h = src.height, f = p.freq * Math.PI * 2;
        displace(src, out, function (x, y) { var q = p.dir === 'Horizontal' ? [x + A * Math.sin(y / h * f), y] : [x, y + A * Math.sin(x / w * f)]; return [q, q, q, q]; }); } },
    { id: 'gauss', name: 'Gaussian Blur', cat: 4, params: [R('radius', 'Blur amount', 0, 80, .5, 12)], run: function (src, out, p, k) { copyTo(out, blurred(src, p.radius * k)); } },
    { id: 'motion', name: 'Motion Blur', cat: 4, params: [R('dist', 'Distance', 0, 200, 1, 50), R('angle', 'Angle', 0, 180, 1, 0)],
      run: function (src, out, p, k) { var o = copyTo(out, src), n = 24, a = p.angle * Math.PI / 180, d = p.dist * k; for (var i = 0; i < n; i++) { var t = (i / (n - 1) - .5) * d; o.globalAlpha = 1 / (i + 1); o.drawImage(src, Math.cos(a) * t, Math.sin(a) * t); } o.globalAlpha = 1; } },
    { id: 'radial', name: 'Radial Blur', cat: 4, params: [R('strength', 'Strength', 0, .5, .005, .12), R('cx', 'Center X', 0, 100, 1, 50), R('cy', 'Center Y', 0, 100, 1, 50)],
      run: function (src, out, p) { var o = copyTo(out, src), n = 24, w = src.width, h = src.height, mx = w * p.cx / 100, my = h * p.cy / 100; for (var i = 0; i < n; i++) { var s = 1 + p.strength * i / (n - 1); o.globalAlpha = 1 / (i + 1); o.setTransform(s, 0, 0, s, mx - mx * s, my - my * s); o.drawImage(src, 0, 0); } o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; } },
    { id: 'depth', name: 'Depth Blur', cat: 4, approx: true, params: [R('focus', 'Focus position', 0, 100, 1, 55), R('band', 'Focus band', 2, 60, 1, 18), R('blur', 'Blur amount', 0, 60, 1, 16)],
      run: function (src, out, p, k) { var w = src.width, h = src.height, o = copyTo(out, src), b = blurred(src, p.blur * k), bc = b.getContext('2d'), f = p.focus / 100, bd = p.band / 100, g = bc.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#000'); g.addColorStop(clamp(f - bd, 0, 1), 'rgba(0,0,0,.15)'); g.addColorStop(clamp(f - bd / 3, 0, 1), 'rgba(0,0,0,0)'); g.addColorStop(clamp(f + bd / 3, 0, 1), 'rgba(0,0,0,0)'); g.addColorStop(clamp(f + bd, 0, 1), 'rgba(0,0,0,.15)'); g.addColorStop(1, '#000');
        bc.globalCompositeOperation = 'destination-in'; bc.fillStyle = g; bc.fillRect(0, 0, w, h); o.drawImage(b, 0, 0); } },
    { id: 'duotone', name: 'Duotone', cat: 5, params: [C('dark', 'Shadows', '#2B1055'), C('light', 'Highlights', '#FF9BC2'), R('contrast', 'Contrast', .5, 2, .01, 1.1), R('mixv', 'Mix', 0, 1, .01, 1)],
      run: function (src, out, p) { var a = hexToRgb(p.dark), b = hexToRgb(p.light); mapPixels(src, out, function (d, i) { var t = clamp((lum(d[i], d[i + 1], d[i + 2]) - .5) * p.contrast + .5, 0, 1); for (var c = 0; c < 3; c++) d[i + c] = mix(d[i + c], mix(a[c], b[c], t), p.mixv); }); } },
    { id: 'gradmap', name: 'Gradient Map', cat: 5, params: [C('c1', 'Shadows', '#14213D'), C('c2', 'Midtones', '#C21E56'), C('c3', 'Highlights', '#FDE68A'), R('mixv', 'Mix', 0, 1, .01, 1)],
      run: function (src, out, p) { var A = hexToRgb(p.c1), B = hexToRgb(p.c2), Cc = hexToRgb(p.c3); mapPixels(src, out, function (d, i) { var t = lum(d[i], d[i + 1], d[i + 2]); for (var c = 0; c < 3; c++) { var v = t < .5 ? mix(A[c], B[c], t * 2) : mix(B[c], Cc[c], t * 2 - 1); d[i + c] = mix(d[i + c], v, p.mixv); } }); } },
    { id: 'overlay', name: 'Color Overlay', cat: 5, params: [C('color', 'Color', '#C21E56'), S('blend', 'Blend mode', ['soft-light', 'overlay', 'multiply', 'screen', 'color', 'hue', 'normal'], 'soft-light'), R('opacity', 'Opacity', 0, 1, .01, .6)],
      run: function (src, out, p) { var o = copyTo(out, src); o.save(); o.globalCompositeOperation = p.blend === 'normal' ? 'source-atop' : p.blend; o.globalAlpha = p.opacity; o.fillStyle = p.color; o.fillRect(0, 0, src.width, src.height); o.restore();
        if (p.blend !== 'normal') { o.save(); o.globalCompositeOperation = 'destination-in'; o.drawImage(src, 0, 0); o.restore(); } } },
    { id: 'shift', name: 'Color Shift', cat: 5, params: [R('hue', 'Hue shift', -180, 180, 1, 60), R('sat', 'Saturation', 0, 2, .01, 1.15), R('bright', 'Brightness', .5, 1.5, .01, 1)],
      run: function (src, out, p) { var a = p.hue * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), M = [.213 + c * .787 - s * .213, .715 - c * .715 - s * .715, .072 - c * .072 + s * .928, .213 - c * .213 + s * .143, .715 + c * .285 + s * .14, .072 - c * .072 - s * .283, .213 - c * .213 - s * .787, .715 - c * .715 + s * .715, .072 + c * .928 + s * .072];
        mapPixels(src, out, function (d, i) { var r = d[i], g = d[i + 1], b = d[i + 2], R1 = M[0] * r + M[1] * g + M[2] * b, G1 = M[3] * r + M[4] * g + M[5] * b, B1 = M[6] * r + M[7] * g + M[8] * b, L = .2126 * R1 + .7152 * G1 + .0722 * B1; d[i] = (L + (R1 - L) * p.sat) * p.bright; d[i + 1] = (L + (G1 - L) * p.sat) * p.bright; d[i + 2] = (L + (B1 - L) * p.sat) * p.bright; }); } },
    { id: 'y2k', name: 'Y2K', cat: 6, params: [R('intensity', 'Intensity', 0, 1, .01, .85), R('split', 'Color split', 0, 20, .5, 4), R('scan', 'Scanlines', 0, 1, .01, .3)],
      run: function (src, out, p, k) { var P = [[10, 20, 64], [95, 140, 255], [232, 240, 255], [255, 140, 210]], t = cv(src.width, src.height);
        mapPixels(src, t, function (d, i) { var l = clamp((lum(d[i], d[i + 1], d[i + 2]) - .5) * 1.5 + .5, 0, 1) * 3, j = Math.min(2, l | 0), f = l - j; for (var c = 0; c < 3; c++) d[i + c] = mix(d[i + c], mix(P[j][c], P[j + 1][c], f), p.intensity); });
        var dx = p.split * k; displace(t, out, function (x, y) { return [[x - dx, y], [x, y], [x + dx, y], [x, y]]; });
        if (p.scan) { var o = out.getContext('2d'), step = Math.max(2, 3 * k); o.fillStyle = 'rgba(0,0,20,' + (p.scan * .35) + ')'; for (var y = 0; y < src.height; y += step) o.fillRect(0, y, src.width, step / 2); } } },
    { id: 'holo', name: 'Holographic', cat: 6, params: [R('intensity', 'Intensity', 0, 1, .01, .7), R('spread', 'Rainbow spread', .2, 4, .01, 1.4), R('angle', 'Angle', 0, 360, 1, 35)],
      run: function (src, out, p) { var w = src.width, h = src.height, a = p.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), D = Math.hypot(w, h), rb = cv(w, h);
        mapPixels(src, rb, function (d, i, x, y) { var l = lum(d[i], d[i + 1], d[i + 2]), c = hsl(((x * ca + y * sa) / D * p.spread * 360) + l * 140, .9, .62); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; });
        var o = copyTo(out, src); o.save(); o.globalCompositeOperation = 'color'; o.globalAlpha = p.intensity * .55; o.drawImage(rb, 0, 0); o.globalCompositeOperation = 'overlay'; o.globalAlpha = p.intensity * .5; o.drawImage(rb, 0, 0); o.globalCompositeOperation = 'destination-in'; o.globalAlpha = 1; o.drawImage(src, 0, 0); o.restore(); } },
    { id: 'iri', name: 'Iridescent', cat: 6, params: [R('intensity', 'Intensity', 0, 1, .01, .65), R('bands', 'Film thickness', .5, 5, .01, 1.8), R('shift', 'Hue offset', 0, 360, 1, 200)],
      run: function (src, out, p) { var t = cv(src.width, src.height); mapPixels(src, t, function (d, i) { var l = lum(d[i], d[i + 1], d[i + 2]), c = hsl(p.shift + l * 360 * p.bands, .7, .55 + .25 * l); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; });
        var o = copyTo(out, src); o.save(); o.globalCompositeOperation = 'soft-light'; o.globalAlpha = p.intensity; o.drawImage(t, 0, 0); o.globalCompositeOperation = 'screen'; o.globalAlpha = p.intensity * .22; o.drawImage(t, 0, 0); o.globalCompositeOperation = 'destination-in'; o.globalAlpha = 1; o.drawImage(src, 0, 0); o.restore(); } },
    { id: 'chrome', name: 'Liquid Chrome', cat: 6, params: [R('bands', 'Chrome bands', .5, 5, .01, 2.2), R('warp', 'Liquid warp', 0, 40, .5, 10), C('tint', 'Tint', '#DCE6FF'), R('mixv', 'Mix', 0, 1, .01, 1)],
      run: function (src, out, p, k) { var w = src.width, h = src.height, A = p.warp * k, f = 2 * Math.PI / (180 * k), t = cv(w, h), T = hexToRgb(p.tint), base = blurred(src, 1.5 * k);
        displace(base, t, function (x, y) { var q = [x + A * Math.sin(y * f + Math.sin(x * f)), y + A * Math.cos(x * f * .9)]; return [q, q, q, q]; });
        mapPixels(t, out, function (d, i) { var l = lum(d[i], d[i + 1], d[i + 2]), v = .5 + .5 * Math.cos(l * Math.PI * 2 * p.bands), s = Math.pow(v, 3); for (var c = 0; c < 3; c++) { var ch = clamp(20 + s * T[c] + Math.pow(v, 18) * 120, 0, 255); d[i + c] = mix(d[i + c], ch, p.mixv); } }); } }
  ];
  var FXI = {}; FX.forEach(function (f) { FXI[f.id] = f; });
  var defaults = function (f) { var o = {}; f.params.forEach(function (q) { o[q.k] = q.def; }); return o; };
  function applyFx(id, params, src) { var out = cv(src.width, src.height), f = FXI[id]; if (!f) { copyTo(out, src); return out; } f.run(src, out, Object.assign(defaults(f), params || {}), Math.max(src.width, src.height) / 1000); return out; }
  function fitCanvas(img, max) { var w = img.width || img.naturalWidth, h = img.height || img.naturalHeight, s = Math.min(1, max / Math.max(w, h)), c = cv(w * s, h * s), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height); return c; }
  function sampleImage() { // built-in test image so the library can be tried without uploading
    var c = cv(1400, 1000), x = c.getContext('2d'), sky = x.createLinearGradient(0, 0, 0, 1000); sky.addColorStop(0, '#FBD3E0'); sky.addColorStop(.55, '#FDE7C8'); sky.addColorStop(1, '#F7B9A4'); x.fillStyle = sky; x.fillRect(0, 0, 1400, 1000);
    var sun = x.createRadialGradient(980, 360, 10, 980, 360, 190); sun.addColorStop(0, '#FFFBEA'); sun.addColorStop(.5, '#FFD27A'); sun.addColorStop(1, 'rgba(255,210,122,0)'); x.fillStyle = sun; x.fillRect(700, 100, 600, 600);
    [['#C76A8C', 640, .0035, 90], ['#8E4C78', 730, .005, 60], ['#4A2B55', 840, .004, 50]].forEach(function (l) { x.fillStyle = l[0]; x.beginPath(); x.moveTo(0, 1000); for (var i = 0; i <= 1400; i += 10) x.lineTo(i, l[1] + Math.sin(i * l[2] + l[1]) * l[3]); x.lineTo(1400, 1000); x.fill(); });
    x.fillStyle = '#FFFFFF'; x.font = '800 120px Archivo, Arial, sans-serif'; x.fillText('Aa', 120, 300); x.fillStyle = '#C21E56'; x.beginPath(); x.arc(470, 250, 70, 0, Math.PI * 2); x.fill(); return c;
  }

  // ---------- styles ----------
  var CSS = ':host{all:initial;display:block;height:min(780px,88vh);min-height:560px;border-radius:28px;overflow:hidden;box-shadow:0 0 0 1px var(--pf-line,rgba(127,127,127,.2));font-family:var(--pf-sans,"Archivo",system-ui,sans-serif);color:var(--pf-fg,#111);--bg:var(--pf-bg,#fff);--fg:var(--pf-fg,#111);--sf:var(--pf-surface,#F5F5F5);--sf2:var(--pf-surface-2,#EDEDED);--mt:var(--pf-muted,#666);--ln:var(--pf-line,rgba(127,127,127,.22));--ac:var(--pf-accent,#C21E56);--ft:var(--pf-focus,#C21E56);--mono:var(--pf-mono,"JetBrains Mono",ui-monospace,monospace)}' +
    ':host([mode="modal"]){height:100%;min-height:0;border-radius:inherit;box-shadow:none}:host([mode="full"]){position:fixed;inset:0;z-index:80;height:100vh;height:100dvh;min-height:0;border-radius:0;box-shadow:none}' +
    '*{box-sizing:border-box}button,input,select{font:inherit;color:inherit}button{cursor:pointer}' +
    '.app{container-type:inline-size;display:grid;grid-template-rows:auto minmax(0,1fr);height:100%;min-height:0;background:var(--bg);color:var(--fg);border-radius:inherit;overflow:hidden}' +
    '.top{display:flex;align-items:center;gap:12px;padding:10px 14px;flex-wrap:wrap}.title{font-weight:700;font-size:15px;letter-spacing:-.01em;margin-right:6px;white-space:nowrap}.sp{flex:1}' +
    '.btn{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border-radius:10px;border:0;background:var(--sf);font-size:13px;font-weight:500;text-decoration:none;color:var(--fg);transition:background-color .16s,transform .12s}.btn:hover{background:var(--sf2)}.btn:active{transform:scale(.97)}.btn:focus-visible,.chip:focus-visible,.tile:focus-visible,input:focus-visible,select:focus-visible,.seg button:focus-visible{outline:2px solid var(--ft);outline-offset:2px}.btn[disabled]{opacity:.4;pointer-events:none}.btn.pri{background:var(--fg);color:var(--bg)}.btn.pri:hover{opacity:.88}.btn.ic{width:36px;padding:0;justify-content:center}' +
    '.seg{display:inline-flex;padding:3px;gap:2px;border-radius:12px;background:var(--sf)}.seg button{border:0;background:transparent;padding:7px 12px;border-radius:9px;font-size:13px;font-weight:500;color:var(--mt)}.seg button[aria-pressed="true"]{background:var(--bg);color:var(--fg);box-shadow:0 1px 2px rgba(0,0,0,.08)}' +
    '.main{display:grid;grid-template-columns:230px minmax(0,1fr) 290px;min-height:0;gap:0}.side{overflow:auto;padding:12px 14px 20px;display:flex;flex-direction:column;gap:14px;min-height:0}.side.l{padding-right:6px}.side.r{padding-left:6px}' +
    '.stagewrap{position:relative;min-height:0;display:flex;align-items:center;justify-content:center;padding:12px;background:var(--sf);border-radius:16px;margin:4px 6px 14px}' +
    '.lbl{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mt)}' +
    '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.tile{border:0;padding:0;background:none;text-align:left;display:flex;flex-direction:column;gap:5px;border-radius:12px}.tile .sw{aspect-ratio:4/3;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06);transition:transform .16s;overflow:hidden;background:var(--sf2)}.tile .sw canvas,.tile .sw img{display:block;width:100%;height:100%;object-fit:cover}.tile:hover .sw{transform:translateY(-2px)}.tile[aria-pressed="true"] .sw{box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--ac)}.tile span{font-size:12px;font-weight:500;color:var(--fg);padding:0 2px}.tile em{font-style:normal;font-size:10px;color:var(--mt);font-family:var(--mono)}' +
    '.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{border:0;background:var(--sf);border-radius:999px;padding:5px 10px;font-size:12px;font-weight:500;color:var(--mt)}.chip[aria-pressed="true"]{background:var(--fg);color:var(--bg)}' +
    '.field{display:flex;flex-direction:column;gap:6px}.row{display:flex;align-items:center;gap:8px}.row label,.field>label{font-size:12px;color:var(--mt);display:flex;justify-content:space-between;gap:8px}.val{font-family:var(--mono);font-size:11px;color:var(--fg)}' +
    'input[type=range]{width:100%;accent-color:var(--ac);height:18px;margin:0}select,input[type=text],input[type=number]{border:0;background:var(--sf);border-radius:8px;padding:7px 9px;font-size:13px;min-width:0;width:100%}input[type=number]{font-family:var(--mono);font-size:12px;padding:6px}' +
    'input[type=color]{-webkit-appearance:none;appearance:none;border:0;padding:0;width:30px;height:30px;border-radius:8px;background:none;flex:none}input[type=color]::-webkit-color-swatch-wrapper{padding:0}input[type=color]::-webkit-color-swatch{border:0;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}input[type=color]::-moz-color-swatch{border:0;border-radius:8px}' +
    '.stop{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:6px 8px;align-items:center;padding:8px;border-radius:12px;background:var(--sf)}.stop[data-on="1"]{box-shadow:0 0 0 2px var(--ac)}.stop .rgb{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.stop .sl{grid-column:1/-1;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px;align-items:center;font-size:11px;color:var(--mt)}.mini{border:0;background:var(--bg);border-radius:7px;width:26px;height:26px;font-size:12px;display:inline-flex;align-items:center;justify-content:center;color:var(--mt)}.mini:hover{color:var(--fg)}' +
    '.bar{position:relative;height:28px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);margin:0 7px;touch-action:none}.hd{position:absolute;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:ew-resize;touch-action:none}.hd[data-on="1"]{width:20px;height:20px;margin:-10px 0 0 -10px;box-shadow:0 0 0 2px var(--ac),0 1px 4px rgba(0,0,0,.35)}' +
    '.prev{position:relative;max-width:100%;max-height:100%;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px -18px rgba(0,0,0,.35);container-type:inline-size}.check{background-color:#fff;background-image:linear-gradient(45deg,#e6e6e6 25%,transparent 25%,transparent 75%,#e6e6e6 75%),linear-gradient(45deg,#e6e6e6 25%,transparent 25%,transparent 75%,#e6e6e6 75%);background-size:16px 16px;background-position:0 0,8px 8px}' +
    '.el{position:absolute;transform-origin:center;cursor:grab;touch-action:none}.el[data-on="1"]{outline:1.5px dashed rgba(255,255,255,.9);outline-offset:4px;box-shadow:0 0 0 1px rgba(0,0,0,.25)}.el.t{white-space:nowrap;font-weight:800;line-height:1.2;letter-spacing:-.04em;-webkit-background-clip:text;background-clip:text;color:transparent;padding:0 .1em}' +
    '.code{font-family:var(--mono);font-size:11px;line-height:1.5;background:var(--sf);border-radius:10px;padding:10px;word-break:break-all;max-height:110px;overflow:auto;user-select:all;-webkit-user-select:all}' +
    '.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:28px;border-radius:14px;border:1.5px dashed var(--ln);width:min(520px,100%);min-height:260px;transition:border-color .16s,background-color .16s}.empty[data-over="1"]{border-color:var(--ac);background:color-mix(in srgb,var(--ac) 6%,transparent)}.empty h3{margin:0;font-size:17px;font-weight:600}.empty p{margin:0;font-size:13px;color:var(--mt);max-width:36ch;line-height:1.5}.err{color:#B42318;font-size:13px}' +
    '.cmp{position:absolute;inset:0;pointer-events:none}.cmp canvas{position:absolute;inset:0;width:100%;height:100%}.div{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.2);pointer-events:auto;cursor:ew-resize;touch-action:none}.div::after{content:"⟷";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;background:#fff;color:#111;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25)}.tag{position:absolute;top:10px;padding:3px 8px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font-size:11px;font-family:var(--mono)}' +
    '.busy{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--bg) 55%,transparent);font-size:13px;font-weight:500;border-radius:12px}.pop{position:absolute;right:14px;top:58px;z-index:5;width:260px;padding:14px;border-radius:16px;background:var(--bg);box-shadow:0 14px 40px -12px rgba(0,0,0,.35),0 0 0 1px var(--ln);display:flex;flex-direction:column;gap:12px}' +
    '.toast{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);background:var(--fg);color:var(--bg);font-size:13px;padding:8px 14px;border-radius:999px;pointer-events:none;opacity:0;transition:opacity .2s}.toast[data-on="1"]{opacity:1}' +
    '.mtabs{display:none}.note{font-size:11px;color:var(--mt);line-height:1.45}' +
    '@container (max-width:920px){.main{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto;overflow:auto}.stagewrap{height:min(62vw,460px);order:0}.side{order:2;overflow:visible;padding:12px 14px}.side.l,.side.r{padding:12px 14px}.mtabs{display:flex;order:1;padding:0 14px}.main[data-pane="lib"] .side.r,.main[data-pane="adj"] .side.l{display:none}.grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}}' +
    '@media (prefers-reduced-motion:reduce){*{transition:none!important}}';

  // ---------- element ----------
  class Lab extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.root = this.attachShadow({ mode: 'open' });
      this.s = { tab: 'color', cmode: 'bg', bg: clone(PRESETS[0][1]), preset: 0, sel: 0, els: defaultEls(), elSel: 0, stageBg: 'light', aspect: '16:10', fx: 'none', fxp: {}, cat: -1, pane: 'adj', cmp: false, cmpPos: 50, exp: false, fmt: 'png', q: .92, res: 'full' };
      this.hist = []; this.fut = []; this.snap(true);
      this.root.innerHTML = '<style>' + CSS + '</style><div class="app" part="app"></div>';
      this.app = this.root.querySelector('.app');
      this.render();
      this.root.addEventListener('click', this.onClick.bind(this));
      this.root.addEventListener('input', this.onInput.bind(this));
      this.root.addEventListener('change', this.onChange.bind(this));
      this.root.addEventListener('pointerdown', this.onDown.bind(this));
      this._key = this.onKey.bind(this); window.addEventListener('keydown', this._key);
      this.root.addEventListener('dragover', function (e) { var z = e.composedPath().find(function (n) { return n.classList && n.classList.contains('empty'); }); if (z) { e.preventDefault(); z.dataset.over = '1'; } });
      this.root.addEventListener('dragleave', function (e) { var z = e.target.closest && e.target.closest('.empty'); if (z) z.dataset.over = ''; });
      this.root.addEventListener('drop', (e) => { var z = e.target.closest && e.target.closest('.stagewrap'); if (!z) return; e.preventDefault(); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) this.load(f); });
    }
    disconnectedCallback() { window.removeEventListener('keydown', this._key); if (this._url) URL.revokeObjectURL(this._url); }
    get full() { return this.getAttribute('mode') === 'full'; }
    get modal() { return this.getAttribute('mode') === 'modal'; }
    // modal mode: the host page listens for this and closes the dialog
    requestClose() { this.dispatchEvent(new CustomEvent('pf-lab-close', { bubbles: true, composed: true })); window.dispatchEvent(new CustomEvent('pf-lab-close')); }

    // history (undo / redo): snapshots of the editable model, committed 350ms after the last change
    model() { var s = this.s; return { tab: s.tab, cmode: s.cmode, bg: s.bg, els: s.els, elSel: s.elSel, stageBg: s.stageBg, aspect: s.aspect, fx: s.fx, fxp: s.fxp, sel: s.sel }; }
    snap(now) { var go = () => { var m = JSON.stringify(this.model()); if (this.hist[this.hist.length - 1] === m) return; this.hist.push(m); if (this.hist.length > 80) this.hist.shift(); this.fut = []; this.syncHist(); }; clearTimeout(this._ht); if (now) go(); else this._ht = setTimeout(go, 350); }
    undo() { clearTimeout(this._ht); var cur = JSON.stringify(this.model()); if (this.hist[this.hist.length - 1] !== cur) this.hist.push(cur); if (this.hist.length < 2) return; this.fut.push(this.hist.pop()); this.restore(this.hist[this.hist.length - 1]); }
    redo() { if (!this.fut.length) return; var m = this.fut.pop(); this.hist.push(m); this.restore(m); }
    restore(m) { Object.assign(this.s, JSON.parse(m)); this._fxCache = null; this.render(); }
    syncHist() { var u = this.root.querySelector('[data-a="undo"]'), r = this.root.querySelector('[data-a="redo"]'); if (u) u.disabled = this.hist.length < 2; if (r) r.disabled = !this.fut.length; }
    onKey(e) {
      var tg = e.composedPath()[0], step = e.shiftKey ? 10 : 1, dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (dir && tg && tg.dataset && tg.dataset.hd != null && this.root.contains(tg)) { e.preventDefault(); var st = this.eg().stops[+tg.dataset.hd]; st.p = clamp(st.p + dir * step, 0, 100); this.refreshColor(); var ip = this.root.querySelector('[data-b="stop.' + tg.dataset.hd + '.p"]'); if (ip) ip.value = st.p; this.snap(); return; }
      if (dir && tg && tg.dataset && tg.dataset.div != null && this.root.contains(tg)) { e.preventDefault(); this.s.cmpPos = clamp(this.s.cmpPos + dir * step * 2, 0, 100); tg.style.left = this.s.cmpPos + '%'; tg.setAttribute('aria-valuenow', this.s.cmpPos); var oc = this.root.querySelector('[data-orig]'); if (oc) oc.style.clipPath = 'inset(0 ' + (100 - this.s.cmpPos) + '% 0 0)'; return; }
      if (!this.isConnected || !this.offsetParent && !this.full) return; var t = e.composedPath()[0]; if (e.key !== 'Escape' && t && /INPUT|SELECT|TEXTAREA/.test(t.tagName) && t.type !== 'range') return; var mod = e.metaKey || e.ctrlKey; if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); } else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); } else if (e.key === 'Escape') { if (this.s.exp) { this.s.exp = false; this.render(); var eb = this.root.querySelector('[data-a="exp"]'); if (eb) eb.focus(); } else if (this.modal) this.requestClose(); } }

    // the gradient being edited: page background or the selected element's fill
    eg() { return this.s.cmode === 'el' && this.s.els[this.s.elSel] ? this.s.els[this.s.elSel].grad : this.s.bg; }
    toast(t) { var n = this.root.querySelector('.toast'); if (!n) return; n.textContent = t; n.dataset.on = '1'; clearTimeout(this._tt); this._tt = setTimeout(function () { n.dataset.on = ''; }, 1600); }

    render() {
      var s = this.s, back = this.getAttribute('back-href') || '#/playground', fullHref = this.getAttribute('full-href') || '#/tools/color-image-lab';
      var top = '<div class="top">' + (this.full ? '<a class="btn" href="' + esc(back) + '" aria-label="Back to Playground">← Back</a>' : '') + '<span class="title">Color &amp; Image Lab</span>' +
        '<div class="seg" role="group" aria-label="Workspace"><button data-a="tab" data-v="color" aria-pressed="' + (s.tab === 'color') + '">Color Lab</button><button data-a="tab" data-v="image" aria-pressed="' + (s.tab === 'image') + '">Image Effects</button></div><span class="sp"></span>' +
        '<button class="btn ic" data-a="undo" aria-label="Undo" title="Undo (Ctrl/⌘+Z)">↶</button><button class="btn ic" data-a="redo" aria-label="Redo" title="Redo (Shift+Ctrl/⌘+Z)">↷</button>' +
        (this.modal ? '' : this.full ? '<button class="btn" data-a="fs" aria-label="Toggle browser full screen">⛶ Full screen</button>' : '<a class="btn" href="' + esc(fullHref) + '">⛶ Open full screen</a>') +
        '<button class="btn pri" data-a="exp" aria-expanded="' + s.exp + '">Export</button>' + (this.modal ? '<button class="btn ic" data-a="close" aria-label="Close Color & Image Lab" title="Close (Esc)">✕</button>' : '') + '</div>';
      var body = s.tab === 'color' ? this.colorUI() : this.imageUI();
      this.app.innerHTML = top + '<div class="main" data-pane="' + s.pane + '">' + body + '</div>' + (s.exp ? this.exportUI() : '') + '<div class="toast" role="status" aria-live="polite"></div>';
      this.syncHist(); this.paint();
    }
    mtabs() { var p = this.s.pane; return '<div class="mtabs"><div class="seg" role="group" aria-label="Panel"><button data-a="pane" data-v="lib" aria-pressed="' + (p === 'lib') + '">' + (this.s.tab === 'color' ? 'Presets & elements' : 'Effect library') + '</button><button data-a="pane" data-v="adj" aria-pressed="' + (p === 'adj') + '">Adjust</button></div></div>'; }

    // ---------- Color Lab UI ----------
    colorUI() {
      var s = this.s, el = s.els[s.elSel], left = '<div class="side l"><div class="seg" role="group" aria-label="Color Lab mode"><button data-a="cmode" data-v="bg" aria-pressed="' + (s.cmode === 'bg') + '">Gradient background</button><button data-a="cmode" data-v="el" aria-pressed="' + (s.cmode === 'el') + '">Gradient elements</button></div>';
      if (s.cmode === 'el') {
        left += '<div class="field"><span class="lbl">Add element</span><div class="chips">' + Object.keys(SHAPES).map(function (k) { return '<button class="chip" data-a="add" data-v="' + k + '">+ ' + SHAPES[k].label + '</button>'; }).join('') + '</div></div>' +
          '<div class="field"><span class="lbl">Elements</span><div class="chips">' + s.els.map(function (e, i) { return '<button class="chip" data-a="pick" data-v="' + i + '" aria-pressed="' + (i === s.elSel) + '">' + (i + 1) + ' · ' + esc(e.kind === 'text' ? '“' + e.text.slice(0, 10) + '”' : SHAPES[e.kind].label) + '</button>'; }).join('') + '</div></div>' +
          '<div class="field"><span class="lbl">Stage</span><div class="chips">' + [['light', 'Light'], ['dark', 'Dark'], ['gradient', 'Background gradient'], ['transparent', 'Transparent']].map(function (o) { return '<button class="chip" data-a="stage" data-v="' + o[0] + '" aria-pressed="' + (s.stageBg === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
      }
      left += '<div class="field"><span class="lbl">' + (s.cmode === 'el' ? 'Apply a preset to the element' : 'Presets') + '</span><div class="grid">' + PRESETS.map(function (p, i) { return '<button class="tile" data-a="preset" data-v="' + i + '" title="' + esc(p[0]) + '" aria-pressed="' + (s.cmode === 'bg' && s.preset === i) + '"><div class="sw" style="background:' + gradCSS(p[1]) + '"></div><span>' + esc(p[0]) + '</span></button>'; }).join('') + '</div></div>' +
        '<button class="btn" data-a="random">⚄ Randomize</button></div>';
      var stage = '<div class="stagewrap">' + this.stageHTML() + '</div>';
      var g = this.eg(), right = '<div class="side r">';
      if (s.cmode === 'el' && el) {
        right += '<div class="field"><span class="lbl">Element ' + (s.elSel + 1) + ' · ' + SHAPES[el.kind].label + '</span>' + (el.kind === 'text' ? '<input type="text" data-b="el.text" value="' + esc(el.text) + '" aria-label="Text" maxlength="24">' : '') + '</div>' +
          this.rng('el.scale', 'Scale', .1, 3, .01, el.scale, '×') + this.rng('el.x', 'Position X', 0, 100, .5, el.x, '%') + this.rng('el.y', 'Position Y', 0, 100, .5, el.y, '%') + this.rng('el.rot', 'Rotation', -180, 180, 1, el.rot, '°') + this.rng('el.opacity', 'Opacity', 0, 1, .01, el.opacity, '') + this.rng('el.blur', 'Blur', 0, 80, .5, el.blur, 'px') +
          '<div class="row"><button class="btn" data-a="dup">Duplicate</button><button class="btn" data-a="front">Bring to front</button><button class="btn" data-a="del" aria-label="Delete element">Delete</button></div>';
      }
      right += this.gradUI(g) + '<div class="field"><span class="lbl">CSS</span><div class="code">' + (s.cmode === 'el' ? 'background: ' + esc(gradCSS(g)) + ';' : 'background: ' + esc(gradCSS(g)) + ';') + '</div><button class="btn" data-a="copy">Copy CSS</button></div></div>';
      return left + this.mtabs() + stage + right;
    }
    rng(b, label, min, max, step, v, unit) { return '<div class="field"><label><span>' + label + '</span><span class="val" data-v-for="' + b + '">' + this.fmtV(v, step) + unit + '</span></label><input type="range" data-b="' + b + '" data-u="' + unit + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '" aria-label="' + esc(label) + '"></div>'; }
    fmtV(v, step) { return step < 1 ? (+v).toFixed(step < .1 ? 2 : 1) : Math.round(v); }
    gradUI(g) {
      var s = this.s, sel = clamp(s.sel, 0, g.stops.length - 1); s.sel = sel;
      var h = '<div class="field"><span class="lbl">Gradient</span><div class="seg" role="group" aria-label="Gradient type">' + ['linear', 'radial', 'conic'].map(function (t) { return '<button data-a="gtype" data-v="' + t + '" aria-pressed="' + (g.type === t) + '">' + t[0].toUpperCase() + t.slice(1) + '</button>'; }).join('') + '</div></div>';
      if (g.type === 'linear') h += this.rng('g.angle', 'Angle', 0, 360, 1, g.angle, '°');
      if (g.type === 'conic') h += this.rng('g.angle', 'Rotation', 0, 360, 1, g.angle, '°');
      if (g.type !== 'linear') h += this.rng('g.cx', 'Center X', 0, 100, 1, g.cx, '%') + this.rng('g.cy', 'Center Y', 0, 100, 1, g.cy, '%');
      if (g.type === 'radial') h += this.rng('g.size', 'Size', 10, 200, 1, g.size, '%');
      h += '<div class="field"><label><span>Color stops (' + g.stops.length + ')</span><span class="val">drag handles</span></label><div class="bar" data-bar="1" style="background:' + gradCSS(Object.assign({}, g, { type: 'linear', angle: 90 })) + '">' +
        g.stops.map(function (st, i) { return '<span class="hd" data-hd="' + i + '" data-on="' + (i === sel ? 1 : 0) + '" style="left:' + st.p + '%;background:' + stopColor(st) + '" role="slider" tabindex="0" aria-label="Stop ' + (i + 1) + ' position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(st.p) + '"></span>'; }).join('') + '</div></div>';
      h += g.stops.map(function (st, i) { var c = hexToRgb(st.c); return '<div class="stop" data-on="' + (i === sel ? 1 : 0) + '" data-stop="' + i + '"><input type="color" data-b="stop.' + i + '.c" value="' + st.c.toLowerCase() + '" aria-label="Stop ' + (i + 1) + ' color"><input type="text" data-b="stop.' + i + '.hex" value="' + st.c.toUpperCase() + '" aria-label="Stop ' + (i + 1) + ' HEX" maxlength="7" spellcheck="false">' +
        '<div class="row" style="gap:4px"><button class="mini" data-a="up" data-v="' + i + '" aria-label="Move stop up">↑</button><button class="mini" data-a="down" data-v="' + i + '" aria-label="Move stop down">↓</button><button class="mini" data-a="rm" data-v="' + i + '" aria-label="Remove stop"' + (g.stops.length < 3 ? ' disabled' : '') + '>✕</button></div>' +
        '<div class="rgb">' + ['R', 'G', 'B'].map(function (n, j) { return '<input type="number" min="0" max="255" data-b="stop.' + i + '.rgb' + j + '" value="' + c[j] + '" aria-label="Stop ' + (i + 1) + ' ' + n + '" title="' + n + '">'; }).join('') + '</div>' +
        '<div class="sl"><span>Pos</span><input type="range" min="0" max="100" step="1" data-b="stop.' + i + '.p" value="' + st.p + '" aria-label="Stop ' + (i + 1) + ' position"><span class="val" data-v-for="stop.' + i + '.p">' + Math.round(st.p) + '%</span></div>' +
        '<div class="sl"><span>Opacity</span><input type="range" min="0" max="1" step="0.01" data-b="stop.' + i + '.a" value="' + st.a + '" aria-label="Stop ' + (i + 1) + ' opacity"><span class="val" data-v-for="stop.' + i + '.a">' + Math.round(st.a * 100) + '%</span></div></div>'; }).join('');
      return h + '<button class="btn" data-a="addstop">+ Add color stop</button>';
    }
    aspect() { return { '16:10': [16, 10], '1:1': [1, 1], '4:5': [4, 5], '9:16': [9, 16] }[this.s.aspect] || [16, 10]; }
    stageHTML() {
      var s = this.s, a = this.aspect(), sty = 'aspect-ratio:' + a[0] + '/' + a[1] + ';' + (a[0] >= a[1] ? 'width:100%;' : 'height:100%;');
      var bgc = s.cmode === 'bg' ? gradCSS(s.bg) : s.stageBg === 'gradient' ? gradCSS(s.bg) : STAGE_BG[s.stageBg] || '';
      var els = s.cmode === 'el' ? s.els.map(function (e, i) { return Lab.elHTML(e, i, i === s.elSel); }).join('') : '';
      return '<div class="prev' + (s.cmode === 'el' && s.stageBg === 'transparent' ? ' check' : '') + '" data-stage="1" style="' + sty + 'background:' + bgc + '">' + els + '</div>' +
        '<div style="position:absolute;left:12px;bottom:10px"><select data-a2="aspect" aria-label="Canvas aspect ratio" style="width:auto;background:var(--bg)">' + ['16:10', '1:1', '4:5', '9:16'].map(function (r) { return '<option' + (r === s.aspect ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></div>';
    }
    static elHTML(e, i, on) {
      var common = 'left:' + e.x + '%;top:' + e.y + '%;opacity:' + e.opacity + ';transform:translate(-50%,-50%) rotate(' + e.rot + 'deg);filter:' + (e.blur > 0 ? 'blur(' + (e.blur / 10) + 'cqw)' : 'none') + ';background:' + gradCSS(e.grad) + ';';
      if (e.kind === 'text') return '<div class="el t" data-el="' + i + '" data-on="' + (on ? 1 : 0) + '" style="' + common + 'font-size:' + (16 * e.scale) + 'cqw;font-family:Archivo,\'Helvetica Neue\',Arial,sans-serif">' + esc(e.text) + '</div>';
      var sh = SHAPES[e.kind], m = maskURL(e.kind);
      return '<div class="el" data-el="' + i + '" data-on="' + (on ? 1 : 0) + '" style="' + common + 'width:' + (36 * e.scale) + '%;aspect-ratio:' + sh.vb[0] + '/' + sh.vb[1] + ';-webkit-mask:' + m + ' center/100% 100% no-repeat;mask:' + m + ' center/100% 100% no-repeat"></div>';
    }
    // light update without rebuilding panels (keeps slider focus while dragging)
    refreshColor() {
      var s = this.s, st = this.root.querySelector('[data-stage]'); if (!st) return; var g = this.eg();
      if (s.cmode === 'bg') st.style.background = gradCSS(s.bg); else { st.style.background = s.stageBg === 'gradient' ? gradCSS(s.bg) : STAGE_BG[s.stageBg] || ''; st.innerHTML = s.els.map(function (e, i) { return Lab.elHTML(e, i, i === s.elSel); }).join(''); }
      var bar = this.root.querySelector('[data-bar]'); if (bar) { bar.style.background = gradCSS(Object.assign({}, g, { type: 'linear', angle: 90 })); bar.querySelectorAll('.hd').forEach(function (h, i) { var x = g.stops[i]; if (!x) return; h.style.left = x.p + '%'; h.style.background = stopColor(x); h.setAttribute('aria-valuenow', Math.round(x.p)); }); }
      var code = this.root.querySelector('.code'); if (code) code.textContent = 'background: ' + gradCSS(g) + ';';
    }

    // ---------- Image Effects UI ----------
    imageUI() {
      var s = this.s, has = !!this.work;
      var left = '<div class="side l"><div class="field"><span class="lbl">Effect library</span><div class="chips"><button class="chip" data-a="cat" data-v="-1" aria-pressed="' + (s.cat === -1) + '">All</button>' + CATS.map(function (c, i) { return '<button class="chip" data-a="cat" data-v="' + i + '" aria-pressed="' + (s.cat === i) + '">' + esc(c) + '</button>'; }).join('') + '</div></div>';
      var groups = CATS.map(function (c, ci) { if (s.cat !== -1 && s.cat !== ci) return ''; return '<div class="field"><span class="lbl">' + esc(c) + '</span><div class="grid">' + FX.filter(function (f) { return f.cat === ci; }).map(function (f) { return '<button class="tile" data-a="fx" data-v="' + f.id + '" title="' + esc(f.name) + '" aria-pressed="' + (s.fx === f.id) + '"><div class="sw" data-thumb="' + f.id + '"></div><span>' + esc(f.name) + (f.approx ? ' <em>approx.</em>' : '') + '</span></button>'; }).join('') + '</div></div>'; }).join('');
      left += groups + '</div>';
      var stage = '<div class="stagewrap">' + (has ? '<div class="prev" data-iprev="1" style="aspect-ratio:' + this.work.width + '/' + this.work.height + ';' + (this.work.width / this.work.height >= 1.2 ? 'width:100%' : 'height:100%') + '"><canvas data-out="1" style="display:block;width:100%;height:100%"></canvas>' +
          (s.cmp ? '<div class="cmp"><canvas data-orig="1" style="clip-path:inset(0 ' + (100 - s.cmpPos) + '% 0 0)"></canvas><span class="tag" style="left:10px">Original</span><span class="tag" style="right:10px">Edited</span><span class="div" data-div="1" style="left:' + s.cmpPos + '%" role="slider" tabindex="0" aria-label="Compare original and edited" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + s.cmpPos + '"></span></div>' : '') + '<div class="busy" data-busy="1" hidden>Rendering…</div></div>'
        : '<div class="empty"><h3>Drop an image to start</h3><p>Upload a JPG, PNG or WebP. It stays on your device; nothing is uploaded.</p><div class="row" style="justify-content:center;flex-wrap:wrap"><label class="btn pri" style="cursor:pointer">Upload image<input type="file" accept="image/*" data-a2="file" hidden></label><button class="btn" data-a="sample">Try a sample image</button></div>' + (this._err ? '<p class="err" role="alert">' + esc(this._err) + '</p>' : '') + (this._loading ? '<p>Loading image…</p>' : '') + '</div>') + '</div>';
      var f = FXI[s.fx], right = '<div class="side r">';
      if (has) right += '<div class="field"><span class="lbl">Image</span><div class="row" style="flex-wrap:wrap"><label class="btn" style="cursor:pointer">Replace<input type="file" accept="image/*" data-a2="file" hidden></label><button class="btn" data-a="cmp" aria-pressed="' + s.cmp + '">' + (s.cmp ? 'Hide compare' : 'Compare') + '</button><button class="btn" data-a="clearimg">Remove image</button></div><span class="note">' + esc(this._name || '') + ' · ' + this.orig.width + '×' + this.orig.height + 'px' + (this.orig.width > this.work.width ? ' · previewing at ' + this.work.width + '×' + this.work.height : '') + '</span></div>';
      if (!f) right += '<div class="field"><span class="lbl">Adjust</span><p class="note">' + (has ? 'Pick an effect from the library. Its controls appear here and update the preview as you drag.' : 'Upload an image, then pick an effect.') + '</p></div>';
      else {
        var p = Object.assign(defaults(f), s.fxp[f.id] || {});
        right += '<div class="field"><span class="lbl">' + esc(CATS[f.cat]) + '</span><div style="font-size:17px;font-weight:600">' + esc(f.name) + '</div>' + (f.approx ? '<span class="note">Approximation: blur is applied by a focus band, not real depth.</span>' : '') + '</div>';
        right += f.params.map((q) => {
          var v = p[q.k], rs = '<button class="mini" data-a="rp" data-v="' + q.k + '" aria-label="Reset ' + esc(q.label) + '" title="Reset">↺</button>';
          if (q.type === 'range') return '<div class="field"><label><span>' + esc(q.label) + '</span><span class="row" style="gap:6px"><span class="val" data-v-for="fx.' + q.k + '">' + this.fmtV(v, q.step) + '</span>' + rs + '</span></label><input type="range" data-b="fx.' + q.k + '" min="' + q.min + '" max="' + q.max + '" step="' + q.step + '" value="' + v + '" aria-label="' + esc(q.label) + '"></div>';
          if (q.type === 'color') return '<div class="field"><label><span>' + esc(q.label) + '</span>' + rs + '</label><div class="row"><input type="color" data-b="fx.' + q.k + '" value="' + String(v).toLowerCase() + '" aria-label="' + esc(q.label) + '"><input type="text" data-b="fxhex.' + q.k + '" value="' + esc(String(v).toUpperCase()) + '" maxlength="7" aria-label="' + esc(q.label) + ' HEX"></div></div>';
          return '<div class="field"><label><span>' + esc(q.label) + '</span>' + rs + '</label><select data-b="fx.' + q.k + '" aria-label="' + esc(q.label) + '">' + q.opts.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>';
        }).join('');
        right += '<div class="row" style="flex-wrap:wrap"><button class="btn" data-a="resetfx">Reset effect</button><button class="btn" data-a="nofx">Remove effect</button></div>';
      }
      return left + this.mtabs() + stage + right + '</div>';
    }
    load(file) {
      if (!file || !/^image\//.test(file.type)) { this._err = 'That file isn’t an image. Try a JPG, PNG or WebP.'; this.s.tab = 'image'; this.render(); return; }
      this._err = ''; this._loading = true; this.render();
      var done = (img) => { this._loading = false; this.setImage(img, file.name); };
      var fail = () => { this._loading = false; this._err = 'This image couldn’t be read. Try another file.'; this.render(); };
      if (window.createImageBitmap) createImageBitmap(file).then(done, () => this.loadEl(file, done, fail)); else this.loadEl(file, done, fail);
    }
    loadEl(file, done, fail) { if (this._url) URL.revokeObjectURL(this._url); var u = this._url = URL.createObjectURL(file), im = new Image(); im.onload = () => { done(im); URL.revokeObjectURL(u); this._url = null; }; im.onerror = () => { URL.revokeObjectURL(u); this._url = null; fail(); }; im.src = u; }
    setImage(img, name) {
      // originals above 4096px are stored at 4096 (export cap); the live preview works on a ≤1400px copy
      this.orig = fitCanvas(img, 4096); this.work = fitCanvas(this.orig, 1400); this._name = name; this._fxCache = null; if (img.close) img.close();
      if (this.s.fx === 'none') this.s.fx = 'frosted';
      this.render(); this.thumbs();
    }
    thumbs() {
      if (!this.work) return; var base = fitCanvas(this.work, 180), list = FX.slice(), self = this, id = this._thumbRun = (this._thumbRun || 0) + 1;
      this._thumbs = this._thumbs && this._thumbBase === this.work ? this._thumbs : {}; this._thumbBase = this.work;
      var step = function () { if (id !== self._thumbRun) return; var t0 = performance.now(); while (list.length && performance.now() - t0 < 12) { var f = list.shift(); if (!self._thumbs[f.id]) { try { self._thumbs[f.id] = applyFx(f.id, {}, base).toDataURL('image/jpeg', .8); } catch (_) {} } self.placeThumb(f.id); } if (list.length) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    placeThumb(id) { var el = this.root.querySelector('[data-thumb="' + id + '"]'); if (el && this._thumbs && this._thumbs[id] && !el.firstChild) { var im = new Image(); im.alt = ''; im.src = this._thumbs[id]; el.appendChild(im); } }
    paint() {
      if (this.s.tab !== 'image' || !this.work) return;
      if (this._thumbs) FX.forEach((f) => this.placeThumb(f.id)); if (!this._thumbs || this._thumbBase !== this.work) this.thumbs();
      cancelAnimationFrame(this._pr); this._pr = requestAnimationFrame(() => {
        var out = this.root.querySelector('[data-out]'); if (!out) return;
        var res = applyFx(this.s.fx, this.s.fxp[this.s.fx], this.work); out.width = res.width; out.height = res.height; out.getContext('2d').drawImage(res, 0, 0);
        var o = this.root.querySelector('[data-orig]'); if (o) { o.width = this.work.width; o.height = this.work.height; o.getContext('2d').drawImage(this.work, 0, 0); }
      });
    }

    // ---------- export ----------
    exportUI() {
      var s = this.s, img = s.tab === 'image', a = this.aspect(), W = a[0] >= a[1] ? 2400 : Math.round(2400 * a[0] / a[1]), H = Math.round(W * a[1] / a[0]);
      var h = '<div class="pop" role="dialog" aria-label="Export"><div class="row" style="justify-content:space-between"><strong style="font-size:14px">Export</strong><button class="mini" data-a="exp" aria-label="Close export">✕</button></div>';
      if (img) {
        if (!this.work) return h + '<p class="note">Upload an image first.</p></div>';
        h += '<div class="field"><span class="lbl">Format</span><div class="seg" role="group" aria-label="Format">' + ['png', 'jpeg', 'webp'].map(function (f) { return '<button data-a="fmt" data-v="' + f + '" aria-pressed="' + (s.fmt === f) + '">' + f.toUpperCase() + '</button>'; }).join('') + '</div></div>' +
          (s.fmt !== 'png' ? this.rng('q', 'Quality', .5, 1, .01, s.q, '') : '<span class="note">PNG is lossless and keeps transparency when the image has it.</span>') +
          '<div class="field"><span class="lbl">Size</span><select data-a2="res" aria-label="Export size"><option value="full"' + (s.res === 'full' ? ' selected' : '') + '>Full · ' + this.orig.width + '×' + this.orig.height + '</option><option value="preview"' + (s.res === 'preview' ? ' selected' : '') + '>Preview · ' + this.work.width + '×' + this.work.height + '</option></select></div>';
      } else h += '<span class="note">PNG · ' + W + '×' + H + (s.cmode === 'el' && s.stageBg === 'transparent' ? ' · transparent background' : '') + '</span><button class="btn" data-a="copy">Copy CSS</button>';
      return h + '<button class="btn pri" data-a="download">Download ' + (img ? s.fmt.toUpperCase() : 'PNG') + '</button></div>';
    }
    download() {
      var s = this.s, busy = this.root.querySelector('[data-busy]'); if (busy) busy.hidden = false;
      var btn = this.root.querySelector('[data-a="download"]'); if (btn) { btn.disabled = true; btn.textContent = 'Rendering…'; }
      setTimeout(() => {
        var c, name, type, q;
        try {
          if (s.tab === 'image') { c = applyFx(s.fx, s.fxp[s.fx], s.res === 'full' ? this.orig : this.work); type = 'image/' + s.fmt; q = s.fmt === 'png' ? undefined : s.q; name = (this._name || 'image').replace(/\.[^.]+$/, '') + '-' + (s.fx === 'none' ? 'original' : s.fx) + '.' + (s.fmt === 'jpeg' ? 'jpg' : s.fmt);
            if (s.fmt === 'jpeg') { var flat = cv(c.width, c.height), fx = flat.getContext('2d'); fx.fillStyle = '#FFFFFF'; fx.fillRect(0, 0, c.width, c.height); fx.drawImage(c, 0, 0); c = flat; } }
          else { var a = this.aspect(), W = a[0] >= a[1] ? 2400 : Math.round(2400 * a[0] / a[1]), H = Math.round(W * a[1] / a[0]); c = cv(W, H); var x = c.getContext('2d');
            if (s.cmode === 'bg' || s.stageBg === 'gradient') paintGrad(x, s.bg, 0, 0, W, H); else if (STAGE_BG[s.stageBg]) { x.fillStyle = STAGE_BG[s.stageBg]; x.fillRect(0, 0, W, H); }
            if (s.cmode === 'el') s.els.forEach(function (e) { drawElement(x, e, W, H); });
            type = 'image/png'; name = s.cmode === 'bg' ? 'gradient-background.png' : 'gradient-elements.png'; }
        } catch (e) { this.toast('Export failed — try a smaller size'); this.endBusy(); return; }
        c.toBlob((blob) => { this.endBusy(); if (!blob) { this.toast('This browser can’t export ' + type.split('/')[1].toUpperCase()); return; } var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); this.toast('Saved ' + name); }, type, q);
      }, 30);
    }
    endBusy() { var b = this.root.querySelector('[data-busy]'); if (b) b.hidden = true; var btn = this.root.querySelector('[data-a="download"]'); if (btn) { btn.disabled = false; btn.textContent = 'Download ' + (this.s.tab === 'image' ? this.s.fmt.toUpperCase() : 'PNG'); } }

    // ---------- events ----------
    onClick(e) {
      var t = e.target.closest('[data-a]'); if (!t || t.disabled) return; var a = t.dataset.a, v = t.dataset.v, s = this.s, g = this.eg(), re = true, hist = true;
      switch (a) {
        case 'tab': s.tab = v; s.exp = false; break;
        case 'pane': s.pane = v; hist = false; break;
        case 'cmode': s.cmode = v; s.sel = 0; break;
        case 'preset': var pg = clone(PRESETS[+v][1]); if (s.cmode === 'el' && s.els[s.elSel]) s.els[s.elSel].grad = pg; else { s.bg = pg; s.preset = +v; } s.sel = 0; break;
        case 'random': if (s.cmode === 'el' && s.els[s.elSel]) s.els[s.elSel].grad = randomGrad(); else { s.bg = randomGrad(); s.preset = -1; } s.sel = 0; break;
        case 'gtype': g.type = v; if (v === 'conic' && g.stops.length > 1 && g.stops[g.stops.length - 1].c !== g.stops[0].c) { } break;
        case 'addstop': var sst = sortStops(g), i0 = sst.reduce(function (best, st, i) { var gap = i ? st.p - sst[i - 1].p : 0; return gap > best[0] ? [gap, i] : best; }, [0, 1])[1], A = sst[i0 - 1] || sst[0], B = sst[i0] || sst[0], ca = hexToRgb(A.c), cb = hexToRgb(B.c);
          g.stops.push({ c: rgbToHex(mix(ca[0], cb[0], .5), mix(ca[1], cb[1], .5), mix(ca[2], cb[2], .5)), a: 1, p: Math.round((A.p + B.p) / 2) }); s.sel = g.stops.length - 1; break;
        case 'rm': if (g.stops.length > 2) { g.stops.splice(+v, 1); s.sel = 0; } break;
        case 'up': case 'down': var i = +v, j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= g.stops.length) return; var sw = g.stops[i]; g.stops[i] = g.stops[j]; g.stops[j] = sw; var pp = g.stops[i].p; g.stops[i].p = g.stops[j].p; g.stops[j].p = pp; s.sel = j; break;
        case 'add': var ne = newEl(v, { x: 30 + Math.random() * 40, y: 30 + Math.random() * 40, scale: v === 'text' ? 1 : .7 }); s.els.push(ne); s.elSel = s.els.length - 1; s.sel = 0; break;
        case 'pick': s.elSel = +v; s.sel = 0; hist = false; break;
        case 'stage': s.stageBg = v; break;
        case 'dup': var d = clone(s.els[s.elSel]); d.id = 'e' + (++elId); d.x = clamp(d.x + 5, 0, 100); d.y = clamp(d.y + 5, 0, 100); s.els.push(d); s.elSel = s.els.length - 1; break;
        case 'front': var fe = s.els.splice(s.elSel, 1)[0]; s.els.push(fe); s.elSel = s.els.length - 1; break;
        case 'del': s.els.splice(s.elSel, 1); s.elSel = Math.max(0, s.elSel - 1); break;
        case 'copy': var css = 'background: ' + gradCSS(this.eg()) + ';'; (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(css) : Promise.reject()).then(() => this.toast('CSS copied'), () => { var ta = document.createElement('textarea'); ta.value = css; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); this.toast('CSS copied'); } catch (_) { this.toast('Copy failed — select the code instead'); } ta.remove(); }); return;
        case 'exp': s.exp = !s.exp; hist = false; break;
        case 'fs': var host = this.closest('[data-lab-full]') || this; if (document.fullscreenElement) document.exitFullscreen(); else if (host.requestFullscreen) host.requestFullscreen().catch(function () {}); return;
        case 'close': this.requestClose(); return;
        case 'undo': this.undo(); return; case 'redo': this.redo(); return;
        case 'cat': s.cat = +v; hist = false; break;
        case 'fx': s.fx = v; break;
        case 'nofx': s.fx = 'none'; break;
        case 'resetfx': delete s.fxp[s.fx]; break;
        case 'rp': if (s.fxp[s.fx]) delete s.fxp[s.fx][v]; break;
        case 'cmp': s.cmp = !s.cmp; hist = false; break;
        case 'sample': this.setImage(sampleImage(), 'sample.png'); return;
        case 'clearimg': this.orig = this.work = null; this._thumbs = null; s.cmp = false; break;
        case 'fmt': s.fmt = v; hist = false; break;
        case 'download': this.download(); return;
        default: re = false;
      }
      if (re) this.render(); if (hist) this.snap();
    }
    setPath(b, val) {
      var s = this.s, g = this.eg(), p = b.split('.'), el = s.els[s.elSel];
      if (p[0] === 'g') g[p[1]] = +val;
      else if (p[0] === 'el' && el) el[p[1]] = p[1] === 'text' ? String(val) : +val;
      else if (p[0] === 'stop') { var st = g.stops[+p[1]]; if (!st) return; this.s.sel = +p[1];
        if (p[2] === 'c') st.c = String(val).toUpperCase();
        else if (p[2] === 'hex') { var hv = String(val).trim(); if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hv)) return false; hv = '#' + hv.replace('#', ''); if (hv.length === 4) hv = '#' + hv.slice(1).split('').map(function (c) { return c + c; }).join(''); st.c = hv.toUpperCase(); }
        else if (/^rgb/.test(p[2])) { var c = hexToRgb(st.c); c[+p[2].slice(3)] = clamp(+val || 0, 0, 255); st.c = rgbToHex(c[0], c[1], c[2]); }
        else st[p[2]] = +val; }
      else if (p[0] === 'fx' || p[0] === 'fxhex') { var f = FXI[s.fx]; if (!f) return; var q = f.params.find(function (x) { return x.k === p[1]; }); var v2 = q.type === 'range' ? +val : val;
        if (p[0] === 'fxhex') { if (!/^#?[0-9a-f]{6}$/i.test(val)) return false; v2 = '#' + String(val).replace('#', '').toUpperCase(); }
        (s.fxp[s.fx] = s.fxp[s.fx] || {})[p[1]] = v2; }
      else if (p[0] === 'q') s.q = +val;
      return true;
    }
    onInput(e) {
      var t = e.target, b = t.dataset && t.dataset.b; if (!b) return; if (this.setPath(b, t.value) === false) return;
      var lab = this.root.querySelector('[data-v-for="' + b + '"]'); if (lab) { var st = +t.step || 1, u = t.dataset.u || ''; lab.textContent = /stop\.\d+\.a$/.test(b) ? Math.round(t.value * 100) + '%' : /stop\.\d+\.p$/.test(b) ? Math.round(t.value) + '%' : this.fmtV(t.value, st) + u; }
      if (this.s.tab === 'color') {
        this.refreshColor();
        if (/^stop\.\d+\.(c|hex|rgb\d)$/.test(b)) { var i = b.split('.')[1], st2 = this.eg().stops[+i], row = this.root.querySelector('[data-stop="' + i + '"]'); if (row) { row.querySelectorAll('input[type=number]').forEach(function (n, j) { if (n !== t) n.value = hexToRgb(st2.c)[j]; }); var hx = row.querySelector('input[type=text]'), co = row.querySelector('input[type=color]'); if (hx !== t) hx.value = st2.c; if (co !== t) co.value = st2.c.toLowerCase(); } }
        if (b === 'el.text') { var chip = this.root.querySelector('[data-a="pick"][data-v="' + this.s.elSel + '"]'); if (chip) chip.textContent = (this.s.elSel + 1) + ' · “' + t.value.slice(0, 10) + '”'; }
      } else { if (/^fx(hex)?\./.test(b)) { var k = b.split('.')[1], sib = this.root.querySelectorAll('[data-b="fx.' + k + '"],[data-b="fxhex.' + k + '"]'); sib.forEach(function (n) { if (n !== t && n.type !== 'range') n.value = n.type === 'color' ? String(t.value).toLowerCase() : String(t.value).toUpperCase(); }); } this.paint(); }
      this.snap();
    }
    onChange(e) {
      var t = e.target, a2 = t.dataset && t.dataset.a2;
      if (a2 === 'file') { var f = t.files && t.files[0]; if (f) { this.s.tab = 'image'; this.load(f); } t.value = ''; return; }
      if (a2 === 'aspect') { this.s.aspect = t.value; this.render(); this.snap(); return; }
      if (a2 === 'res') { this.s.res = t.value; return; }
      if (t.tagName === 'SELECT' && t.dataset.b) { this.render(); }
    }
    onDown(e) {
      var t = e.target, s = this.s;
      var hd = t.closest && t.closest('[data-hd]'), elx = t.closest && t.closest('[data-el]'), dv = t.closest && t.closest('[data-div]');
      if (hd) { // drag a color stop along the bar
        e.preventDefault(); var bar = hd.parentElement, i = +hd.dataset.hd, g = this.eg(); s.sel = i; this.root.querySelectorAll('.hd').forEach(function (h, k) { h.dataset.on = k === i ? 1 : 0; }); this.root.querySelectorAll('.stop').forEach(function (r, k) { r.dataset.on = k === i ? 1 : 0; });
        var mv = (ev) => { var r = bar.getBoundingClientRect(); g.stops[i].p = Math.round(clamp((ev.clientX - r.left) / r.width * 100, 0, 100)); this.refreshColor(); var ip = this.root.querySelector('[data-b="stop.' + i + '.p"]'), lb = this.root.querySelector('[data-v-for="stop.' + i + '.p"]'); if (ip) ip.value = g.stops[i].p; if (lb) lb.textContent = g.stops[i].p + '%'; };
        this.track(e, mv); return;
      }
      if (elx && s.cmode === 'el') { // move an element on the stage
        e.preventDefault(); var idx = +elx.dataset.el, el = s.els[idx], stg = elx.parentElement, r0 = stg.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, ox = el.x, oy = el.y;
        if (idx !== s.elSel) { s.elSel = idx; s.sel = 0; this.render(); stg = this.root.querySelector('[data-stage]'); }
        this.track(e, (ev) => { el.x = Math.round(clamp(ox + (ev.clientX - sx) / r0.width * 100, -10, 110) * 2) / 2; el.y = Math.round(clamp(oy + (ev.clientY - sy) / r0.height * 100, -10, 110) * 2) / 2; this.refreshColor(); ['x', 'y'].forEach((k) => { var ip = this.root.querySelector('[data-b="el.' + k + '"]'), lb = this.root.querySelector('[data-v-for="el.' + k + '"]'); if (ip) ip.value = el[k]; if (lb) lb.textContent = this.fmtV(el[k], .5) + '%'; }); }); return;
      }
      if (dv) { e.preventDefault(); var pv = dv.closest('[data-iprev]'), oc = this.root.querySelector('[data-orig]');
        this.track(e, (ev) => { var r = pv.getBoundingClientRect(); s.cmpPos = Math.round(clamp((ev.clientX - r.left) / r.width * 100, 0, 100)); dv.style.left = s.cmpPos + '%'; dv.setAttribute('aria-valuenow', s.cmpPos); if (oc) oc.style.clipPath = 'inset(0 ' + (100 - s.cmpPos) + '% 0 0)'; }, true); }
    }
    track(e, mv, noHist) { var id = e.pointerId, up = () => { window.removeEventListener('pointermove', m); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); if (!noHist) this.snap(); }, m = (ev) => { if (ev.pointerId === id) mv(ev); }; window.addEventListener('pointermove', m); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); }
  }
  customElements.define('pf-color-image-lab', Lab);
  window.PF_LAB = { gradCSS: gradCSS, applyFx: applyFx, effects: FX.map(function (f) { return f.id; }) };
})();
