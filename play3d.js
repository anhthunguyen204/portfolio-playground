/* Playground 3D experiences besides Tiny Worlds: window.pfPlay3D.mount(container, 'vinyl' | 'bookstory') → destroy().
   Lazy-loads the same pinned three.js build as tiny-worlds.js (shared pfLoadThree: jsDelivr, esm.sh fallback), renders only while the container is on screen,
   and disposes geometry, materials, textures and the WebGL context on destroy. Drag to orbit (limited), wheel /
   pinch to zoom (limited). Vinyl: the record spins; click it to pause / resume. Bookstory: click a book to pull it
   out, click the coffee cup for steam. A click is only a click if the pointer moved less than 5px. */
(function () {
  if (window.pfPlay3D) return;
  /* three.js loader shared by tiny-worlds.js and play3d.js (whichever loads first defines it). The Claude preview sandbox
     blocks esm.sh (flagged external_blocked when the project moved to Claude), so the same pinned build is taken from
     jsDelivr first, which the sandbox allows, then from esm.sh. A CDN's core and add-ons always load together, so the
     add-ons share that core's THREE instance; the result is cached, so all three scenes reuse one download. */
  if (!window.pfLoadThree) window.pfLoadThree = (function () {
    var TV = '0.160.0', cache = {};
    var CDNS = [
      { core: 'https://cdn.jsdelivr.net/npm/three@' + TV + '/+esm', addon: function (p) { return 'https://cdn.jsdelivr.net/npm/three@' + TV + '/examples/jsm/' + p + '/+esm'; } },
      { core: 'https://esm.sh/three@' + TV, addon: function (p) { return 'https://esm.sh/three@' + TV + '/examples/jsm/' + p; } }
    ];
    return function (addons) {
      var key = addons.join('|');
      if (cache[key]) return cache[key];
      var attempt = function (i) {
        var c = CDNS[i];
        return Promise.all([import(c.core)].concat(addons.map(function (p) { return import(c.addon(p)); })))
          .catch(function (e) { if (i + 1 < CDNS.length) return attempt(i + 1); throw e; });
      };
      return (cache[key] = attempt(0).catch(function (e) { delete cache[key]; throw e; }));
    };
  })();
  var V = '0.160.0';
  var reduce = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function canvasTex(T, w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }

  function vinyl(T, RB, scene, api) {
    var M = function (c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .6, metalness: 0 }, o || {})); };
    var add = function (g, m, x, y, z, p) { var me = new T.Mesh(g, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; (p || scene).add(me); return me; };
    var plinth = add(new RB(6.4, .7, 5, 4, .18), M(0xE9DCCB, { roughness: .55 }), 0, .35, 0);
    add(new RB(6.2, .06, 4.8, 2, .04), M(0x6B4A33, { roughness: .45 }), 0, .73, 0);
    [[-2.8, -2.1], [2.8, -2.1], [-2.8, 2.1], [2.8, 2.1]].forEach(function (p) { add(new T.CylinderGeometry(.22, .26, .2, 20), M(0x2B2B2E), p[0], -.02, p[1]); });
    add(new T.CylinderGeometry(2.25, 2.25, .16, 64), M(0xB9BCC2, { metalness: .85, roughness: .32 }), -.6, .84, 0);
    // record: grooves + sheen baked into a radial canvas texture; the label is a separate editable texture
    var grooves = canvasTex(T, 1024, 1024, function (g, w) { var c = w / 2; g.fillStyle = '#0D0D10'; g.fillRect(0, 0, w, w);
      for (var r = c * .36; r < c * .99; r += 2.2) { g.strokeStyle = 'rgba(255,255,255,' + (0.025 + 0.03 * Math.random()) + ')'; g.lineWidth = 1; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke(); }
      [[.5, .52], [.66, .68], [.83, .85]].forEach(function (b) { g.strokeStyle = 'rgba(0,0,0,.9)'; g.lineWidth = (b[1] - b[0]) * c; g.beginPath(); g.arc(c, c, (b[0] + b[1]) / 2 * c, 0, Math.PI * 2); g.stroke(); });
      var sh = g.createConicGradient(0.6, c, c); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.08, 'rgba(255,255,255,.16)'); sh.addColorStop(.16, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); sh.addColorStop(.58, 'rgba(255,255,255,.12)'); sh.addColorStop(.66, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sh; g.beginPath(); g.arc(c, c, c * .99, 0, Math.PI * 2); g.arc(c, c, c * .35, 0, Math.PI * 2, true); g.fill(); });
    var LABEL = window.PF_VINYL_LABEL || { bg: '#C21E56', ring: '#F9CFE0', title: 'Side A', sub: 'Thư Nguyễn · placeholder' };
    var label = canvasTex(T, 512, 512, function (g, w) { var c = w / 2; g.fillStyle = LABEL.bg; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill(); g.strokeStyle = LABEL.ring; g.lineWidth = 10; g.beginPath(); g.arc(c, c, c * .86, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#FFF8F2'; g.textAlign = 'center'; g.font = '700 64px Archivo, Arial, sans-serif'; g.fillText(LABEL.title, c, c - 40); g.font = '500 26px Archivo, Arial, sans-serif'; g.fillText(LABEL.sub, c, c + 80);
      for (var i = 0; i < 5; i++) { g.save(); g.translate(c, c + 10); g.rotate(i * Math.PI * 2 / 5); g.beginPath(); g.ellipse(0, -22, 13, 20, 0, 0, Math.PI * 2); g.fill(); g.restore(); } g.fillStyle = LABEL.bg; g.beginPath(); g.arc(c, c + 10, 9, 0, Math.PI * 2); g.fill(); });
    var rec = new T.Group(); rec.position.set(-.6, .95, 0); scene.add(rec);
    var disc = add(new T.CylinderGeometry(2.1, 2.1, .04, 128), [M(0x0D0D10, { roughness: .4 }), M(0xFFFFFF, { map: grooves, roughness: .28, metalness: .2 }), M(0x0D0D10)], 0, 0, 0, rec);
    disc.material[1].map.rotation = 0; disc.name = 'record';
    var lab = add(new T.CylinderGeometry(.74, .74, .046, 64), [M(0x8E1340), M(0xFFFFFF, { map: label, roughness: .7 }), M(0x8E1340)], 0, .001, 0, rec); lab.name = 'record';
    add(new T.CylinderGeometry(.05, .05, .2, 16), M(0xD7D9DE, { metalness: .9, roughness: .25 }), 0, .08, 0, rec);
    // tonearm
    var arm = new T.Group(); arm.position.set(2.2, .78, -1.6); scene.add(arm);
    add(new T.CylinderGeometry(.32, .38, .3, 32), M(0xC9CCD2, { metalness: .8, roughness: .3 }), 0, .15, 0, arm);
    var beam = add(new T.CylinderGeometry(.045, .045, 3, 16), M(0xD7D9DE, { metalness: .9, roughness: .22 }), 0, 0, 0, arm); beam.rotation.z = Math.PI / 2; beam.position.set(-1.3, .42, .4); beam.rotation.y = -.55;
    add(new RB(.42, .14, .26, 2, .04), M(0x2B2B2E), -2.6, .4, 1.25, arm);
    add(new T.CylinderGeometry(.16, .16, .32, 20), M(0x2B2B2E), .45, .44, .35, arm);
    [[1.95, 1.9, 0xFF6B6B], [2.4, 1.9, 0xE9DCCB]].forEach(function (b) { add(new T.CylinderGeometry(.14, .14, .06, 24), M(b[2]), b[0], .76, b[1]); });
    // a few sleeves leaning behind for composition
    [[-3.3, -2.9, .18, 0xF4A6C4], [-2.5, -3.05, -.06, 0x8B5CF6]].forEach(function (s) { var p = add(new RB(3.2, 3.2, .06, 2, .02), M(s[3], { roughness: .8 }), s[0] + 1, 1.6, s[1] - .3); p.rotation.set(-.12, s[2], 0); });
    var spinning = !reduce(), speed = 0, hover = false;
    api.camera.position.set(6.5, 6.8, 8.2); api.target.set(-.2, .7, -.2);
    api.pick = function (o) { if (o && o.name === 'record') { spinning = !spinning; api.say(spinning ? 'Spinning' : 'Paused'); return true; } return false; };
    api.hover = function (o) { var h = !!(o && o.name === 'record'); if (h !== hover) { hover = h; api.cursor(h ? 'pointer' : ''); } };
    api.tick = function (dt) { var goal = spinning ? 3.49 * .55 : 0; speed += (goal - speed) * Math.min(1, dt * 3); rec.rotation.y -= speed * dt; rec.position.y += ((hover ? 1.02 : .95) - rec.position.y) * Math.min(1, dt * 8); return Math.abs(speed) > .001 || Math.abs(rec.position.y - (hover ? 1.02 : .95)) > .001; };
    api.hint = 'Drag to look around · click the record to pause';
  }

  function bookstory(T, RB, scene, api) {
    var M = function (c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .75 }, o || {})); };
    var add = function (g, m, x, y, z, p, o) { var me = new T.Mesh(g, m); me.position.set(x, y, z); me.castShadow = !(o && o.noCast); me.receiveShadow = true; if (o && o.ry) me.rotation.y = o.ry; (p || scene).add(me); return me; };
    var box = function (w, h, d, r) { return new RB(w, h, d, 2, r == null ? Math.min(.06, w / 4, h / 4, d / 4) : r); };
    var floor = canvasTex(T, 512, 512, function (g, w) { for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#C98A5E' : '#B97A50'; g.fillRect(i * 64, j * 64, 64, 64); } });
    add(box(10, .4, 8, .1), M(0xFFFFFF, { map: floor }), 0, -.2, 0);
    add(box(10, 5.4, .3), M(0xF3E3CF), 0, 2.7, -3.85); add(box(.3, 5.4, 8), M(0xEED8BE), -4.85, 2.7, 0);
    // bookshelf wall with instanced books
    var wood = M(0x7A4A2E, { roughness: .6 });
    add(box(5.6, 4.6, .7), wood, -1.4, 2.3, -3.35); for (var s = 0; s < 5; s++) add(box(5.4, .08, .62, .02), M(0x8E5A38), -1.4, .32 + s * .98, -3.25, null, { noCast: true });
    var COLS = [0xC2410C, 0x9A3412, 0xF59E0B, 0x166534, 0x1E3A8A, 0xBE123C, 0xF5E6CC, 0x6D28D9, 0x0F766E, 0xE11D48];
    var books = [], bGeo = box(1, 1, 1, .02);
    for (s = 0; s < 4; s++) { var x = -3.95; while (x < 1.1) { var w = .14 + Math.random() * .12, h = .62 + Math.random() * .24; if (Math.random() < .08) { x += .3; continue; } var b = add(bGeo, M(COLS[(Math.random() * COLS.length) | 0], { roughness: .7 }), x + w / 2, .36 + s * .98 + h / 2, -3.2); b.scale.set(w, h, .5); b.userData = { z0: -3.2, y0: b.position.y, out: 0, goal: 0 }; b.name = 'book'; books.push(b); x += w + .02; } }
    // counter with espresso machine + cups
    add(box(3.2, 1.6, 1.2), M(0x3F2A1E, { roughness: .5 }), 3, .8, -2.7); add(box(3.4, .12, 1.4), M(0xEDE6DA, { roughness: .35 }), 3, 1.66, -2.7);
    add(box(.9, .8, .6), M(0xC0C4CA, { metalness: .8, roughness: .3 }), 3.6, 2.12, -2.9); add(box(.5, .14, .3), M(0x1F1F22), 3.6, 1.82, -2.62);
    [2.2, 2.6].forEach(function (cx) { add(new T.CylinderGeometry(.13, .1, .24, 20), M(0xFFFFFF, { roughness: .3 }), cx, 1.84, -2.5); });
    // pendant lamps with warm lights
    [[2.4, -2.5], [3.6, -2.5], [-.4, 0]].forEach(function (p, i) { add(new T.CylinderGeometry(.02, .02, 1.6, 6), M(0x1F1F22), p[0], 4.5, p[1], null, { noCast: true }); add(new T.ConeGeometry(.34, .32, 24, 1, true), M(0x1F1F22, { side: T.DoubleSide }), p[0], 3.6, p[1], null, { noCast: true }); var bulb = new T.Mesh(new T.SphereGeometry(.1, 16, 12), new T.MeshBasicMaterial({ color: 0xFFE1A8 })); bulb.position.set(p[0], 3.48, p[1]); scene.add(bulb); var L = new T.PointLight(0xFFC27A, i === 2 ? 14 : 9, 7, 1.6); L.position.set(p[0], 3.35, p[1]); scene.add(L); });
    // café table, chairs, coffee cup
    add(new T.CylinderGeometry(.85, .85, .07, 40), M(0xF3E8D6, { roughness: .4 }), -.4, 1.12, .2); add(new T.CylinderGeometry(.06, .06, 1.1, 12), M(0x2B2B2E, { metalness: .6 }), -.4, .56, .2); add(new T.CylinderGeometry(.4, .45, .06, 24), M(0x2B2B2E, { metalness: .6 }), -.4, .03, .2);
    [[-1.6, .5, 1.2], [.7, .9, -1.9]].forEach(function (c) { var g = new T.Group(); g.position.set(c[0], 0, c[1]); g.rotation.y = c[2]; scene.add(g); add(box(.7, .08, .7), M(0x8E5A38), 0, .72, 0, g); add(box(.7, .8, .08), M(0x8E5A38), 0, 1.12, -.31, g); [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]].forEach(function (l) { add(new T.CylinderGeometry(.035, .035, .7, 8), M(0x2B2B2E), l[0], .35, l[1], g); }); });
    var cup = new T.Group(); cup.position.set(-.2, 1.16, .35); scene.add(cup); cup.name = 'cup';
    var cm = M(0xFFFFFF, { roughness: .3 }); add(new T.CylinderGeometry(.3, .3, .03, 32), cm, 0, 0, 0, cup).name = 'cup'; add(new T.CylinderGeometry(.16, .12, .24, 28), cm, 0, .14, 0, cup).name = 'cup'; add(new T.CylinderGeometry(.145, .145, .01, 28), M(0x6F4325, { roughness: .2 }), 0, .26, 0, cup, { noCast: true }).name = 'cup';
    var handle = add(new T.TorusGeometry(.07, .02, 8, 20), cm, .19, .15, 0, cup); handle.name = 'cup';
    add(box(.5, .06, .36), M(0x9A3412), -.75, 1.18, .05, null, { ry: .4 }); add(box(.48, .05, .34), M(0xF5E6CC), -.75, 1.225, .05, null, { ry: .4, noCast: true });
    // reading corner: armchair, floor lamp, rug, plant
    add(box(3.2, .04, 2.4, .02), M(0xE7C6A5, { roughness: .95 }), -2.9, .02, 1.7, null, { noCast: true });
    var ch = new T.Group(); ch.position.set(-3.3, 0, 2); ch.rotation.y = .7; scene.add(ch); var fab = M(0x2F6B4F, { roughness: .9 });
    add(box(1.5, .5, 1.3, .14), fab, 0, .5, 0, ch); add(box(1.5, 1.1, .32, .14), fab, 0, 1.1, -.5, ch); add(box(.3, .7, 1.3, .12), fab, -.62, .8, 0, ch); add(box(.3, .7, 1.3, .12), fab, .62, .8, 0, ch);
    add(new T.CylinderGeometry(.025, .025, 2.6, 8), M(0x1F1F22), -4.2, 1.3, .6); add(new T.CylinderGeometry(.22, .36, .4, 24, 1, true), M(0xF5E6CC, { side: T.DoubleSide, emissive: 0xFFC27A, emissiveIntensity: .35 }), -4.2, 2.7, .6, null, { noCast: true });
    var fl = new T.PointLight(0xFFC27A, 6, 5, 1.6); fl.position.set(-4.2, 2.5, .6); scene.add(fl);
    add(new T.CylinderGeometry(.32, .26, .55, 20), M(0xB45309), 3.8, .28, 1.9); for (var k = 0; k < 7; k++) { var lf = add(new T.SphereGeometry(.34, 14, 10), M(k % 2 ? 0x2F7D4F : 0x3E9A62), 3.8 + Math.cos(k) * .25, .9 + (k % 3) * .22, 1.9 + Math.sin(k) * .25); lf.scale.set(1, .55, .8); lf.rotation.z = k; }
    // steam puffs
    var steam = [], sMat = new T.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0, depthWrite: false });
    for (k = 0; k < 6; k++) { var p = new T.Mesh(new T.SphereGeometry(.06, 10, 8), sMat.clone()); p.visible = false; scene.add(p); steam.push({ m: p, t: 1 }); }
    var hoverObj = null, puff = 0;
    api.camera.position.set(7.4, 6.6, 9.4); api.target.set(-.6, 1.4, -.6);
    var root = function (o) { while (o && !o.name && o.parent) o = o.parent; return o; };
    api.pick = function (o) { o = root(o); if (!o) return false;
      if (o.name === 'book') { books.forEach(function (b) { if (b !== o) b.userData.goal = 0; }); o.userData.goal = o.userData.goal ? 0 : 1; api.say(o.userData.goal ? 'Pulled a book' : 'Put it back'); return true; }
      if (o.name === 'cup') { puff = 1.6; steam.forEach(function (s, i) { s.t = -i * .18; s.m.visible = true; }); api.say('Fresh coffee'); return true; } return false; };
    api.hover = function (o) { o = root(o); var h = o && (o.name === 'book' || o.name === 'cup') ? o : null; if (h !== hoverObj) { hoverObj = h; api.cursor(h ? 'pointer' : ''); } };
    api.tick = function (dt) { var busy = false;
      books.forEach(function (b) { var u = b.userData, g = u.goal + (b === hoverObj && !u.goal ? .18 : 0); u.out += (g - u.out) * Math.min(1, dt * 7); b.position.z = u.z0 + u.out * .55; b.position.y = u.y0 + u.out * .12; if (Math.abs(g - u.out) > .002) busy = true; });
      if (puff > 0) { puff -= dt; busy = true; steam.forEach(function (s, i) { s.t += dt; if (s.t < 0) return; var a = Math.min(1, s.t / 1.2); s.m.position.set(-.2 + Math.sin(s.t * 4 + i) * .05, 1.48 + a * .9, .35); s.m.scale.setScalar(.6 + a * 1.4); s.m.material.opacity = .55 * (1 - a); if (a >= 1) s.m.visible = false; }); }
      return busy; };
    api.hint = 'Drag to look around · click a book or the coffee';
  }

  function mount(box, kind) {
    if (box.__pf3d) return box.__pf3d.destroy;
    var dead = false, cleanup = [], st = { destroy: function () { dead = true; cleanup.forEach(function (f) { try { f(); } catch (_) {} }); box.__pf3d = null; } };
    box.__pf3d = st;
    var status = document.createElement('div'); status.textContent = 'Building ' + (kind === 'vinyl' ? 'the turntable' : 'the bookshop') + '\u2026';
    status.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:500 13px Archivo,system-ui,sans-serif;color:rgba(17,17,17,.6)'; box.appendChild(status);
    window.pfLoadThree(['geometries/RoundedBoxGeometry.js', 'controls/OrbitControls.js']).then(function (m) {
      if (dead) return; var T = m[0], RB = m[1].RoundedBoxGeometry, OC = m[2].OrbitControls; status.remove();
      var r; try { r = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { status.textContent = '3D isn\u2019t available in this browser.'; box.appendChild(status); return; }
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap; r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none'; box.appendChild(r.domElement);
      var scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, .1, 200);
      scene.add(new T.HemisphereLight(0xFFF4E6, 0x6B5A80, kind === 'vinyl' ? 1.1 : .75));
      var sun = new T.DirectionalLight(0xFFF1DE, kind === 'vinyl' ? 2.2 : 1.3); sun.position.set(6, 12, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = sun.shadow.camera.bottom = -8; sun.shadow.camera.right = sun.shadow.camera.top = 8; sun.shadow.bias = -.0004; sun.shadow.radius = 4; scene.add(sun);
      var rim = new T.DirectionalLight(kind === 'vinyl' ? 0xC4B5FD : 0xFFD9B0, .7); rim.position.set(-8, 5, -6); scene.add(rim);
      var hint = document.createElement('div'); hint.style.cssText = 'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:rgba(17,17,17,.58);color:#fff;font:500 12px Archivo,system-ui,sans-serif;pointer-events:none;transition:opacity .3s;white-space:nowrap';
      var api = { camera: cam, target: new T.Vector3(), cursor: function (c) { r.domElement.style.cursor = c; }, say: function (t) { hint.textContent = t; hint.style.opacity = '1'; clearTimeout(api._ht); api._ht = setTimeout(function () { hint.textContent = api.hint; }, 1400); } };
      (kind === 'vinyl' ? vinyl : bookstory)(T, RB, scene, api);
      hint.textContent = api.hint; box.appendChild(hint);
      var ctl = new OC(cam, r.domElement); ctl.target.copy(api.target); ctl.enableDamping = true; ctl.dampingFactor = .08; ctl.enablePan = false;
      ctl.minDistance = 7; ctl.maxDistance = 18; ctl.minPolarAngle = .25; ctl.maxPolarAngle = 1.35; ctl.minAzimuthAngle = -1.2; ctl.maxAzimuthAngle = 1.6; ctl.update();
      var visible = true, raf = 0, last = 0, moving = false;
      var size = function () { var w = box.clientWidth || 1, h = box.clientHeight || 1; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); kick(); };
      var frame = function (t) { raf = 0; if (dead || !visible) return; var dt = last ? Math.min(.05, (t - last) / 1000) : .016; last = t; var busy = api.tick(dt); var c = ctl.update(); r.render(scene, cam); if (busy || c || moving) kick(); else last = 0; };
      var kick = function () { if (!raf && !dead && visible) raf = requestAnimationFrame(frame); };
      ctl.addEventListener('start', function () { moving = true; kick(); }); ctl.addEventListener('end', function () { moving = false; kick(); }); ctl.addEventListener('change', kick);
      var ray = new T.Raycaster(), ndc = new T.Vector2(), down = null;
      var hit = function (e) { var b = r.domElement.getBoundingClientRect(); ndc.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(ndc, cam); var h = ray.intersectObjects(scene.children, true)[0]; return h && h.object; };
      var onDown = function (e) { down = [e.clientX, e.clientY]; };
      var onUp = function (e) { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) { if (api.pick(hit(e))) kick(); } down = null; };
      var onMove = function (e) { if (e.pointerType === 'mouse' && !e.buttons) { api.hover(hit(e)); kick(); } };
      r.domElement.addEventListener('pointerdown', onDown); r.domElement.addEventListener('pointerup', onUp); r.domElement.addEventListener('pointermove', onMove);
      var ro = new ResizeObserver(size); ro.observe(box); size();
      var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting && document.visibilityState !== 'hidden'; if (visible) kick(); }); io.observe(box);
      var vis = function () { visible = document.visibilityState !== 'hidden'; kick(); }; document.addEventListener('visibilitychange', vis);
      setTimeout(function () { hint.style.opacity = '0'; }, 6000);
      cleanup.push(function () { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', vis); ctl.dispose();
        scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); var mm = o.material; (Array.isArray(mm) ? mm : mm ? [mm] : []).forEach(function (x) { if (x.map) x.map.dispose(); x.dispose(); }); });
        r.dispose(); if (r.forceContextLoss) r.forceContextLoss(); r.domElement.remove(); hint.remove(); });
    }).catch(function () { status.textContent = 'Couldn\u2019t load the 3D scene.'; });
    return st.destroy;
  }
  window.pfPlay3D = { mount: mount };
})();
