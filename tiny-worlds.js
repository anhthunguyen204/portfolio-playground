/* Tiny Worlds: an interactive isometric miniature room for the Playground card.
   window.pfTinyWorld.mount(container) lazy-loads three.js (pinned; jsDelivr, esm.sh fallback) when the card nears the viewport,
   builds the scene from code (rounded boxes, cylinders, spheres; instanced grass and petals), and renders
   only while something moves; it pauses when off-screen or the tab is hidden.
   Drag sideways to turn the world (limited range, inertia). A click without a drag on a glowing object opens
   its note in the scene: the camera glides in, the object scales up and a note card appears beside it.
   Click anywhere (or Back to room / Escape) to return. A full-screen viewer reuses the same renderer.
   Keyboard: the toolbar (revealed on Tab) rotates and focuses objects.
   If WebGL or the module load fails, the card's existing CSS illustration stays as the fallback.
   NOTES are original sample content, not published research. */
(function () {
  if (window.pfTinyWorld) return;
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
  var NOTES = {
    notebook: { cat: 'Notebook', title: 'Design principles', body: 'Clarity beats cleverness. Make the next step obvious, use the words people already use, and remove anything that doesn\u2019t help them finish the task.' },
    laptop: { cat: 'Workflow', title: 'Prototype to learn', body: 'Start rough and test early; raise fidelity only when the question needs it. AI makes variations cheap. Users and data still decide which one works.' },
    board: { cat: 'Research', title: 'The research wall', body: 'Cluster what people did, not only what they said. Look for patterns across sessions, and keep every insight linked to its original evidence.' },
    easel: { cat: 'Sketchbook', title: 'Sketch wide, then decide', body: 'Explore several directions quickly before committing to one. Compare them against the problem you\u2019re solving, not against your favourite.' },
    books: { cat: 'Resources', title: 'Worth revisiting', body: 'Usability heuristics, Gestalt principles and Jobs to Be Done are worth returning to whenever a design feels stuck.' },
    piano: { cat: 'Music', title: 'F. Liszt \u2014 Liebestraum No. 3', body: 'Sheet music on the piano stand.', sheet: true },
    plant: { cat: 'A small thought', title: 'Grow it slowly', body: 'Good products grow like plants: small, regular care beats one big rewrite. Ship, observe, adjust, repeat.' }
  };
  var ORDER = ['board', 'laptop', 'notebook', 'books', 'easel', 'piano', 'plant'];
  var LABEL = { laptop: 'Monitor and MacBook', notebook: 'Notebooks', board: 'Wall board', easel: 'Easel', books: 'Bookshelf', piano: 'Piano', plant: 'Plant' };
  var reduce = function () { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); };
  var hasGL = function () { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (_) { return false; } };
  var css = function (el, s) { el.style.cssText = s; return el; };
  var mk = function (tag, s, txt) { var e = css(document.createElement(tag), s || ''); if (txt != null) e.textContent = txt; return e; };

  function mount(box) {
    if (!box || box.__pfTW) return; box.__pfTW = true;
    Array.prototype.forEach.call(box.children, function (c) { c.setAttribute('aria-hidden', 'true'); });
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Tiny Worlds: an interactive 3D miniature room');
    var status = mk('div', 'position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;pointer-events:none;font-family:var(--pf-mono);font-size:12px;letter-spacing:.06em;color:var(--pf-pg-emerald-title);transition:opacity 300ms', '');
    box.appendChild(status);
    var io = new IntersectionObserver(function (ents) {
      if (!ents.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      if (!hasGL()) { status.remove(); return; }
      status.textContent = 'Building a tiny world\u2026';
      window.pfLoadThree(['geometries/RoundedBoxGeometry.js'])
        .then(function (m) { build(box, status, m[0], m[1].RoundedBoxGeometry); })
        .catch(function () { status.remove(); });
    }, { rootMargin: '300px 0px' });
    io.observe(box);
  }

  function build(box, status, THREE, RBox) {
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (_) { status.remove(); return; }
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2));
    var MAXANI = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var cv = renderer.domElement;
    css(cv, 'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 500ms ease;touch-action:pan-y;outline:none;-webkit-tap-highlight-color:transparent');
    cv.setAttribute('aria-hidden', 'true'); cv.tabIndex = -1;

    var scene = new THREE.Scene();
    var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    var D = 20; cam.position.set(D + 0.9, D * 0.84, D + 0.9); cam.lookAt(0.9, 1.9, 0.9);

    var hemi = new THREE.HemisphereLight(0xFFF3EC, 0xDCCEF5, 0.85); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xFFF1E6, 2.0);
    sun.position.set(8, 14, 6); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 4; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025;
    var sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
    scene.add(sun);
    var fill = new THREE.DirectionalLight(0xE7DDFF, 0.45); fill.position.set(-10, 6, 10); scene.add(fill);
    var rim = new THREE.DirectionalLight(0xA6E3EE, 0.4); rim.position.set(12, 5, -8); scene.add(rim);
    // soft daylight entering through the left-wall window (no shadow; keeps the window side of objects lit)
    var daylight = new THREE.DirectionalLight(0xFFF6EA, 0.45); daylight.position.set(-14, 8, -1.3); scene.add(daylight);
    // Soft studio environment (gradient dome + a bright window panel), prefiltered once. It gives every material
    // gentle, direction-aware reflections so plastics, ceramic and metal read differently from matte fabric.
    (function () {
      var es = new THREE.Scene(), g = new THREE.SphereGeometry(10, 32, 16), col = [], c = new THREE.Color(), pos = g.attributes.position;
      for (var i = 0; i < pos.count; i++) { var y = pos.getY(i) / 10; c.set(y > 0 ? 0xFFF4EC : 0xD7CCEB).lerp(new THREE.Color(0xF6DCE2), 1 - Math.abs(y)); col.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      var win = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), new THREE.MeshBasicMaterial({ color: 0xFFFFFF })); win.position.set(-9, 4, -1); win.lookAt(0, 2, 0); es.add(win);
      var key = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: 0xFFF1E0 })); key.position.set(6, 8, 5); key.lookAt(0, 0, 0); es.add(key);
      var pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.04).texture; pm.dispose(); g.dispose();
    })();

    var world = new THREE.Group(); scene.add(world);
    var MAT = {};
    var mat = function (hex, o) {
      var k = hex + JSON.stringify(o || {}); if (MAT[k]) return MAT[k];
      var m = new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.78, metalness: 0 }, o || {}));
      return (MAT[k] = m);
    };
    var GEO = {};
    var rbox = function (w, h, d, r) { var k = 'b' + [w, h, d, r]; return GEO[k] || (GEO[k] = new RBox(w, h, d, 3, r == null ? Math.min(w, h, d) * 0.22 : r)); };
    var cyl = function (rt, rb, h, s) { var k = 'c' + [rt, rb, h, s]; return GEO[k] || (GEO[k] = new THREE.CylinderGeometry(rt, rb, h, s || 28)); };
    var sph = function (r, s) { var k = 's' + [r, s]; return GEO[k] || (GEO[k] = new THREE.SphereGeometry(r, s || 20, Math.round((s || 20) * 0.7))); };
    var add = function (parent, geo, m, x, y, z, o) {
      var me = new THREE.Mesh(geo, m); me.position.set(x, y, z);
      if (o && o.rx) me.rotation.x = o.rx; if (o && o.ry) me.rotation.y = o.ry; if (o && o.rz) me.rotation.z = o.rz;
      if (o && o.s) me.scale.set(o.s[0], o.s[1], o.s[2]);
      me.castShadow = !(o && o.noCast); me.receiveShadow = true; parent.add(me); return me;
    };

    // Palette after the reference: a monochrome pink room with warm wood, butter, lilac and mint accents.
    var C = {
      wall: 0xF3A3B7, wallTop: 0xFBCAD6, floor: 0xF199AE, slab: 0xF6B4C4, plinth: 0xF8C3D0, hot: 0xEC6F8E, hotDeep: 0xD9557A,
      blush: 0xFFD0DB, wood: 0xF7D8AE, woodDark: 0xE7B988, cream: 0xFFF4E8, plum: 0x8E2F4D, navy: 0x34477F, sky: 0x8FB6E8,
      butter: 0xFFD978, peach: 0xFFB38A, lav: 0xC7B5F2, leaf: 0x7CCB8E, leafDeep: 0x4FAF72, brand: 0xC21E56
    };
    var tex = function (w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = MAXANI; return tx; };
    var rr = function (g, x, y, w, h, r, col) { g.fillStyle = col; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
    var face = function (parent, w, h, map, x, y, z, o) { var me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: map, roughness: 0.7, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.18 })); me.position.set(x, y, z); if (o && o.ry) me.rotation.y = o.ry; me.receiveShadow = true; parent.add(me); return me; };

    // Plinth and room shell (back walls on -x and -z, open toward the camera)
    var S = 4.2, H = 5.2, T = 0.46;
    add(world, rbox(12.4, 0.8, 12.4, 0.36), mat(C.plinth, { roughness: 0.9 }), 0.9, -0.4, 0.9, { noCast: true });
    var room = new THREE.Group(); world.add(room);
    // Light-oak plank floor: 19 planks (~0.43 wide) running along x, staggered end joints, per-plank tone, fine
    // grain and seams; a matching roughness map keeps it satin, with seams slightly rougher.
    var woodRnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(7);
    var NP = 19, plankTone = [], plankJoint = [];
    for (var pk = 0; pk < NP; pk++) { plankTone.push(woodRnd()); plankJoint.push([woodRnd(), woodRnd()]); }
    var drawPlanks = function (g, w, h, rough) {
      var ph = h / NP;
      for (var p = 0; p < NP; p++) {
        var y0 = p * ph, tn = plankTone[p];
        if (rough) g.fillStyle = 'rgb(' + Math.round(150 + tn * 30) + ',' + Math.round(150 + tn * 30) + ',' + Math.round(150 + tn * 30) + ')';
        else g.fillStyle = 'hsl(' + (32 + tn * 6).toFixed(1) + ',' + (52 + tn * 10).toFixed(0) + '%,' + (78 + tn * 7).toFixed(1) + '%)';
        g.fillRect(0, y0, w, ph);
        if (!rough) {
          for (var gl = 0; gl < 7; gl++) {
            var gy = y0 + 3 + woodRnd() * (ph - 6), amp = 0.6 + woodRnd() * 1.6, fr = 0.004 + woodRnd() * 0.01, ph0 = woodRnd() * 6;
            g.strokeStyle = 'rgba(150,100,58,' + (0.06 + woodRnd() * 0.08).toFixed(3) + ')'; g.lineWidth = 0.7 + woodRnd() * 0.9; g.beginPath();
            for (var gx = 0; gx <= w; gx += 16) { var yy = gy + Math.sin(gx * fr + ph0) * amp; gx ? g.lineTo(gx, yy) : g.moveTo(gx, yy); } g.stroke();
          }
          if (woodRnd() < 0.4) { var kx = woodRnd() * w, ky = y0 + ph * (0.3 + woodRnd() * 0.4); g.fillStyle = 'rgba(160,108,62,0.18)'; g.beginPath(); g.ellipse(kx, ky, 9, 3.5, 0, 0, Math.PI * 2); g.fill(); }
        }
        g.fillStyle = rough ? 'rgb(225,225,225)' : 'rgba(128,84,48,0.55)'; g.fillRect(0, y0, w, 1.6);
        plankJoint[p].forEach(function (j, ji) { var jx = ((j + ji * 0.5 + (p % 2) * 0.25) % 1) * w; g.fillRect(jx, y0, 1.6, ph); });
      }
    };
    var floorTex = tex(1024, 1024, function (g, w, h) { drawPlanks(g, w, h, false); });
    var floorRough = tex(1024, 1024, function (g, w, h) { drawPlanks(g, w, h, true); }); floorRough.colorSpace = THREE.NoColorSpace;
    var oakEdge = tex(512, 64, function (g, w, h) { g.fillStyle = '#E2B988'; g.fillRect(0, 0, w, h); for (var q = 0; q < 14; q++) { g.strokeStyle = 'rgba(140,92,52,' + (0.08 + woodRnd() * 0.1).toFixed(2) + ')'; g.lineWidth = 1; g.beginPath(); var yy = woodRnd() * h; g.moveTo(0, yy); for (var x = 0; x <= w; x += 32) g.lineTo(x, yy + Math.sin(x * 0.02 + q) * 1.5); g.stroke(); } });
    add(room, rbox(S * 2 + 0.2, 0.42, S * 2 + 0.2, 0.16), new THREE.MeshStandardMaterial({ map: oakEdge, color: 0xFFFFFF, roughness: 0.7 }), 0, 0.21, 0);
    add(room, rbox(S * 2 - 0.3, 0.04, S * 2 - 0.3, 0.02), new THREE.MeshStandardMaterial({ map: floorTex, roughnessMap: floorRough, roughness: 1, color: 0xFFFFFF, envMapIntensity: 0.5 }), 0.1, 0.43, 0.1, { noCast: true });
    add(room, rbox(T, H, S * 2, 0.14), mat(C.wall), -S + T / 2, H / 2 + 0.42, 0);
    add(room, rbox(S * 2, H, T, 0.14), mat(C.wall), 0, H / 2 + 0.42, -S + T / 2);
    add(room, rbox(T + 0.02, 0.08, S * 2, 0.04), mat(C.wallTop), -S + T / 2, H + 0.42, 0, { noCast: true });
    add(room, rbox(S * 2, 0.08, T + 0.02, 0.04), mat(C.wallTop), 0, H + 0.42, -S + T / 2, { noCast: true });
    // Rectangular woven rug (x -1.6..2.2, z -0.2..2.3), clear of the chair casters, plant pot, bench and easel
    var rugTex = tex(512, 336, function (g, w, h) {
      g.fillStyle = '#F6EADB'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#E3A5B1'; g.fillRect(14, 14, w - 28, h - 28); g.fillStyle = '#F6EADB'; g.fillRect(28, 28, w - 56, h - 56);
      g.strokeStyle = '#A9BFA0'; g.lineWidth = 3; g.strokeRect(40, 40, w - 80, h - 80);
      for (var dy = 0; dy < 4; dy++) for (var dx = 0; dx < 7; dx++) {
        var cx = 82 + dx * 58, cy = 86 + dy * 55;
        g.fillStyle = (dx + dy) % 2 ? '#E8B4A0' : '#E3A5B1';
        g.beginPath(); g.moveTo(cx, cy - 13); g.lineTo(cx + 13, cy); g.lineTo(cx, cy + 13); g.lineTo(cx - 13, cy); g.closePath(); g.fill();
        g.fillStyle = '#F6EADB'; g.beginPath(); g.arc(cx, cy, 3.5, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#E8B4A0'; for (var fx = 30; fx < w - 26; fx += 10) { g.fillRect(fx, 4, 3, 8); g.fillRect(fx, h - 12, 3, 8); }
    });
    add(room, rbox(3.8, 0.05, 2.5, 0.03), mat(0xEBD9C6, { roughness: 1 }), 0.3, 0.475, 1.05, { noCast: true });
    var rugTop = new THREE.Mesh(new THREE.PlaneGeometry(3.74, 2.44), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
    rugTop.rotation.x = -Math.PI / 2; rugTop.position.set(0.3, 0.502, 1.05); rugTop.receiveShadow = true; room.add(rugTop);

    var hot = [];
    var hotGroup = function (key, parent) { var g = new THREE.Group(); g.userData.key = key; parent.add(g); hot.push({ key: key, group: g, baseY: 0, lift: 0, want: 0 }); return g; };
    var LW = -S + T; // inner face of the left wall
    var BW = -S + T; // inner face of the back wall

    // Left wall: window and a framed abstract artwork
    var win = new THREE.Group(); win.position.set(LW + 0.06, 3.15, -1.3); win.rotation.y = Math.PI / 2; room.add(win);
    add(win, rbox(2.0, 2.7, 0.14, 0.05), mat(C.hot), 0, 0, 0);
    add(win, rbox(1.72, 2.42, 0.04, 0.02), mat(C.blush, { emissive: 0xFFD6E0, emissiveIntensity: 0.45 }), 0, 0, 0.06, { noCast: true });
    add(win, rbox(0.08, 2.42, 0.08, 0.02), mat(C.hot), 0, 0, 0.08);
    add(win, rbox(1.72, 0.08, 0.08, 0.02), mat(C.hot), 0, 0.1, 0.08);
    add(win, rbox(2.2, 0.12, 0.34, 0.04), mat(C.hot), 0, -1.38, 0.14);
    var artTex = tex(256, 320, function (g, w, h) { g.fillStyle = '#3D4A86'; g.fillRect(0, 0, w, h); rr(g, 30, 40, 196, 240, 14, '#F2C9A8'); g.fillStyle = '#E86C8C'; g.beginPath(); g.arc(128, 120, 54, 0, Math.PI * 2); g.fill(); g.fillStyle = '#FFD978'; g.beginPath(); g.moveTo(40, 280); g.lineTo(128, 170); g.lineTo(216, 280); g.fill(); rr(g, 88, 210, 80, 16, 8, '#8E2F4D'); });
    var art = new THREE.Group(); art.position.set(LW + 0.05, 3.55, 1.7); art.rotation.y = Math.PI / 2; room.add(art);
    add(art, rbox(1.4, 1.72, 0.1, 0.04), mat(C.plum), 0, 0, 0);
    face(art, 1.18, 1.48, artTex, 0, 0, 0.056);

    // Back wall: design-tool board (research wall note) + a small pink frame + a swatch pill
    var uiTex = tex(512, 384, function (g, w, h) {
      rr(g, 0, 0, w, h, 26, '#34477F');
      for (var r = 0; r < 4; r++) for (var c = 0; c < 2; c++) rr(g, 22 + c * 52, 26 + r * 56, 42, 44, 8, ['#F48FAA', '#FFC3D2'][(r + c) % 2]);
      rr(g, 140, 40, 210, 300, 18, '#8FB6E8'); rr(g, 160, 70, 170, 110, 14, '#F7A9BE');
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(180, 165); g.lineTo(225, 110); g.lineTo(255, 145); g.lineTo(275, 125); g.lineTo(310, 165); g.closePath(); g.fill();
      g.beginPath(); g.arc(290, 95, 12, 0, Math.PI * 2); g.fill();
      rr(g, 160, 205, 150, 14, 7, '#FFFFFF'); rr(g, 160, 232, 110, 14, 7, '#FFFFFF');
      rr(g, 372, 40, 120, 300, 18, '#2A3A6C'); g.fillStyle = '#FFFFFF'; g.font = '700 64px Archivo, Arial, sans-serif'; g.fillText('Aa', 392, 118);
      for (var k = 0; k < 4; k++) rr(g, 392, 160 + k * 34, 80 - k * 12, 14, 7, '#FFFFFF');
    });
    var board = hotGroup('board', room); board.position.set(1.4, 4.38, BW + 0.06);
    add(board, rbox(3.1, 2.36, 0.12, 0.08), mat(C.navy), 0, 0, 0);
    face(board, 2.98, 2.24, uiTex, 0, 0, 0.065);
    var pf = new THREE.Group(); pf.position.set(-1.3, 3.95, BW + 0.05); room.add(pf);
    add(pf, rbox(0.8, 1.0, 0.08, 0.04), mat(C.hot), 0, 0, 0);
    add(pf, rbox(0.52, 0.7, 0.02, 0.02), mat(C.peach), 0, 0, 0.05, { noCast: true });
    var pill = new THREE.Group(); pill.position.set(3.45, 3.3, BW + 0.06); room.add(pill);
    add(pill, rbox(0.34, 1.4, 0.1, 0.16), mat(C.blush), 0, 0, 0);
    [[0.42, C.hot], [0.14, C.butter], [-0.14, C.sky], [-0.42, C.navy]].forEach(function (p) { add(pill, sph(0.08, 12), mat(p[1]), 0, p[0], 0.07, { noCast: true }); });

    // Designer workstation: a longer desk (x -1.0..3.7) with a three-drawer cabinet on the right and open legroom
    // on the left. Left to right: monitor, MacBook; keyboard centred in front, mouse to its right. The monitor and
    // MacBook form one clickable group (workflow note); the notebooks keep their note.
    var earG = new THREE.ConeGeometry(0.075, 0.15, 4), inEarG = new THREE.ConeGeometry(0.045, 0.1, 4);
    var deskX = 1.35, deskZ = BW + 0.95, top = 2.05, DW = 4.7, DD = 1.7;
    add(room, rbox(DW, 0.16, DD, 0.07), mat(C.wood, { roughness: 0.6 }), deskX, top, deskZ);
    [[-DW / 2 + 0.12, -DD / 2 + 0.12], [-DW / 2 + 0.12, DD / 2 - 0.12]].forEach(function (p) { add(room, cyl(0.075, 0.06, top - 0.42, 12), mat(C.woodDark), deskX + p[0], (top + 0.42) / 2, deskZ + p[1]); });
    var cabX = deskX + DW / 2 - 0.58, cabH = top - 0.08 - 0.44;
    add(room, rbox(1.04, cabH, DD - 0.16, 0.06), mat(C.peach), cabX, 0.44 + cabH / 2, deskZ);
    [0.78, 1.26, 1.74].forEach(function (y) {
      add(room, rbox(0.9, 0.42, 0.04, 0.03), mat(C.cream), cabX, y, deskZ + (DD - 0.16) / 2 + 0.02);
      add(room, rbox(0.3, 0.05, 0.05, 0.02), mat(C.butter, { roughness: 0.4 }), cabX, y + 0.06, deskZ + (DD - 0.16) / 2 + 0.07);
    });
    var monTex = tex(512, 300, function (g, w, h) {
      g.fillStyle = '#2A3150'; g.fillRect(0, 0, w, h);
      rr(g, 0, 0, w, 22, 0, '#232A45'); [14, 30, 46].forEach(function (x, k) { g.fillStyle = ['#F48FAA', '#FFD978', '#8FD3A9'][k]; g.beginPath(); g.arc(x, 11, 4, 0, Math.PI * 2); g.fill(); });
      rr(g, 0, 22, 92, h - 22, 0, '#323A5C'); for (var k = 0; k < 7; k++) rr(g, 12, 38 + k * 26, 64 - (k % 3) * 12, 9, 4, k === 1 ? '#F48FAA' : '#56608A');
      rr(g, w - 86, 22, 86, h - 22, 0, '#323A5C'); for (var j = 0; j < 5; j++) rr(g, w - 74, 40 + j * 30, 60, 10, 5, '#56608A');
      [[118, '#FFC3D2'], [214, '#C7B5F2'], [310, '#A9E7F2']].forEach(function (f) {
        rr(g, f[0], 46, 80, 160, 12, '#FFF8F4'); rr(g, f[0] + 10, 58, 60, 40, 8, f[1]);
        rr(g, f[0] + 10, 108, 52, 8, 4, '#C9C3D6'); rr(g, f[0] + 10, 122, 40, 8, 4, '#C9C3D6'); rr(g, f[0] + 10, 178, 60, 18, 9, '#C21E56');
      });
      g.strokeStyle = '#F48FAA'; g.lineWidth = 2; g.beginPath(); g.moveTo(198, 120); g.bezierCurveTo(205, 120, 207, 100, 214, 100); g.stroke();
      g.beginPath(); g.moveTo(294, 150); g.bezierCurveTo(301, 150, 303, 130, 310, 130); g.stroke();
    });
    var lapTex = tex(320, 200, function (g, w, h) {
      g.fillStyle = '#FFF8F4'; g.fillRect(0, 0, w, h); rr(g, 0, 0, w, 18, 0, '#F2E6EE');
      rr(g, 16, 32, 130, 150, 12, '#FFD3DF'); rr(g, 30, 46, 100, 54, 8, '#F48FAA'); rr(g, 30, 112, 80, 10, 5, '#FFFFFF'); rr(g, 30, 130, 60, 10, 5, '#FFFFFF'); rr(g, 30, 156, 100, 16, 8, '#C21E56');
      rr(g, 162, 32, 142, 70, 12, '#E6DEFA'); rr(g, 162, 112, 142, 70, 12, '#DDF3E6');
      rr(g, 176, 50, 90, 10, 5, '#A996E6'); rr(g, 176, 68, 60, 10, 5, '#A996E6'); rr(g, 176, 130, 90, 10, 5, '#6FBF8E'); rr(g, 176, 148, 70, 10, 5, '#6FBF8E');
    });
    var work = hotGroup('laptop', room);
    var mon = new THREE.Group(); mon.position.set(deskX - 0.45, top + 0.08, deskZ - 0.42); work.add(mon);
    add(mon, rbox(0.7, 0.05, 0.42, 0.02), mat(0xD9DCE4, { roughness: 0.35, metalness: 0.2 }), 0, 0.025, 0);
    add(mon, rbox(0.12, 0.6, 0.08, 0.03), mat(0xD9DCE4, { roughness: 0.35, metalness: 0.2 }), 0, 0.33, -0.08);
    add(mon, rbox(2.3, 1.34, 0.08, 0.04), mat(0x2E3550, { roughness: 0.4 }), 0, 1.25, 0);
    face(mon, 2.2, 1.24, monTex, 0, 1.25, 0.042);
    var mac = new THREE.Group(); mac.position.set(deskX + 1.25, top + 0.08, deskZ - 0.08); mac.rotation.y = -0.38; work.add(mac);
    var alu = mat(0xE4E6EC, { roughness: 0.32, metalness: 0.25 });
    add(mac, rbox(1.2, 0.05, 0.82, 0.03), alu, 0, 0.025, 0);
    add(mac, rbox(1.0, 0.012, 0.36, 0.006), mat(0xC3C7D2, { roughness: 0.5 }), 0, 0.052, -0.12, { noCast: true });
    add(mac, rbox(0.42, 0.01, 0.24, 0.006), mat(0xD3D6DE, { roughness: 0.3 }), 0, 0.052, 0.24, { noCast: true });
    var mlid = new THREE.Group(); mlid.position.set(0, 0.05, -0.4); mlid.rotation.x = -0.32; mac.add(mlid);
    add(mlid, rbox(1.2, 0.78, 0.035, 0.03), alu, 0, 0.39, 0);
    add(mlid, rbox(1.12, 0.7, 0.01, 0.01), mat(0x1F2333, { roughness: 0.4 }), 0, 0.39, 0.019, { noCast: true });
    face(mlid, 1.06, 0.64, lapTex, 0, 0.39, 0.026);
    add(mlid, cyl(0.055, 0.055, 0.008, 20), mat(0xCDD1DA, { roughness: 0.2, metalness: 0.4 }), 0, 0.42, -0.02, { rx: Math.PI / 2, noCast: true });
    // keyboard (centred in front of the monitor and MacBook) + mouse on a pad to its right
    var kbX = deskX + 0.15, kbZ = deskZ + 0.46;
    add(room, rbox(1.36, 0.06, 0.44, 0.03), mat(C.cream), kbX, top + 0.11, kbZ);
    var capG = new THREE.BoxGeometry(0.072, 0.035, 0.072), caps = new THREE.InstancedMesh(capG, mat(0xFFFFFF, { roughness: 0.55 }), 56);
    var KM = new THREE.Matrix4(), KQ = new THREE.Quaternion(), KP = new THREE.Vector3(), KS = new THREE.Vector3(1, 1, 1), KC = new THREE.Color(), ki = 0;
    for (var kr = 0; kr < 4; kr++) for (var kc = 0; kc < 14; kc++) {
      KP.set(kbX - 0.6 + kc * 0.0923 + (kr % 2) * 0.02, top + 0.157, kbZ - 0.15 + kr * 0.093);
      KM.compose(KP, KQ, KS); caps.setMatrixAt(ki, KM);
      caps.setColorAt(ki, KC.set(kr === 0 && kc === 0 ? 0xEC6F8E : (kc === 13 || (kr === 3 && kc < 2)) ? 0xC7B5F2 : 0xFFE3EA)); ki++;
    }
    caps.castShadow = true; caps.receiveShadow = true; room.add(caps);
    add(room, rbox(0.52, 0.035, 0.07, 0.015), mat(0xFFE3EA, { roughness: 0.55 }), kbX + 0.02, top + 0.157, kbZ + 0.21, { noCast: true });
    add(room, rbox(0.54, 0.015, 0.5, 0.01), mat(C.lav, { roughness: 0.95 }), kbX + 1.06, top + 0.087, kbZ + 0.02, { noCast: true });
    add(room, sph(0.12, 20), mat(C.cream, { roughness: 0.4 }), kbX + 1.06, top + 0.13, kbZ + 0.04, { s: [0.72, 0.42, 1.08] });
    // a few purposeful extras: lamp, notebook stack, cup
    var lamp = new THREE.Group(); lamp.position.set(deskX - 2.05, top + 0.08, deskZ - 0.5); room.add(lamp);
    add(lamp, cyl(0.24, 0.28, 0.1, 24), mat(C.butter), 0, 0.05, 0);
    add(lamp, cyl(0.04, 0.04, 0.85, 10), mat(C.butter), 0, 0.5, 0);
    add(lamp, cyl(0.24, 0.36, 0.5, 24), mat(C.butter, { emissive: 0xFFD670, emissiveIntensity: 0.35 }), 0, 1.05, 0);
    var bulb = new THREE.PointLight(0xFFD9A0, 2.4, 5.5, 1.5); bulb.position.set(0, 0.85, 0.2); lamp.add(bulb);
    var bounce = new THREE.PointLight(0xFFB59A, 1.2, 3.2, 1.6); bounce.position.set(0, -0.1, 0.5); lamp.add(bounce);
    var nb = hotGroup('notebook', room); nb.position.set(deskX - 1.75, top + 0.08, deskZ + 0.38); nb.rotation.y = 0.35;
    add(nb, rbox(0.7, 0.08, 0.9, 0.03), mat(C.peach), 0, 0.04, 0);
    add(nb, rbox(0.64, 0.07, 0.84, 0.03), mat(0xF79A6E), 0.03, 0.12, 0.02, { ry: -0.12 });
    add(nb, rbox(0.6, 0.03, 0.8, 0.02), mat(C.cream), 0.03, 0.17, 0.02, { ry: -0.12 });
    // Vietnamese milk coffee in a cream cup on a saucer, right of the MacBook; handle turned toward the default view
    var cup = new THREE.Group(); cup.position.set(deskX + 2.02, top + 0.08, deskZ + 0.42); cup.rotation.y = -Math.PI / 4; room.add(cup);
    var cupM = mat(0xFBF3E6, { roughness: 0.35 });
    add(cup, cyl(0.19, 0.16, 0.025, 28), cupM, 0, 0.0125, 0);
    add(cup, cyl(0.12, 0.085, 0.22, 24), cupM, 0, 0.135, 0);
    add(cup, cyl(0.125, 0.125, 0.012, 24), mat(0xE9B9A7, { roughness: 0.4 }), 0, 0.24, 0, { noCast: true });
    var coffeeTex = tex(128, 128, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, '#C89A6E'); gr.addColorStop(1, '#8A5A3A');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(244,226,200,0.85)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
      for (var a = 0; a < Math.PI * 3.2; a += 0.1) { var rr2 = 6 + a * 7; var px = w / 2 + Math.cos(a) * rr2, py = h / 2 + Math.sin(a) * rr2; a ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
    });
    var coffee = new THREE.Mesh(new THREE.CircleGeometry(0.108, 28), new THREE.MeshStandardMaterial({ map: coffeeTex, roughness: 0.25 }));
    coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.228; cup.add(coffee);
    var handle = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.018, 8, 18, Math.PI), cupM); handle.rotation.z = -Math.PI / 2; handle.position.set(0.105, 0.14, 0); handle.castShadow = true; cup.add(handle);
    // Warm brown cat loafing on the two notebooks, head toward the room (separate from the floor cat).
    // It is a child of the notebook group, so it stays on the books when the notebook is focused.
    var dcat = new THREE.Group(); dcat.position.set(0.03, 0.197, 0.02); dcat.rotation.y = -0.12 - Math.PI / 2; dcat.scale.setScalar(0.6); nb.add(dcat);
    var gFur = mat(0x9C6B4E, { roughness: 0.85 }), gDeep = mat(0x7A4E37, { roughness: 0.85 }), gLight = mat(0xEBD6BC, { roughness: 0.85 });
    add(dcat, sph(0.36, 24), gFur, -0.04, 0.22, 0, { s: [1.25, 0.7, 0.95] });
    add(dcat, sph(0.3, 20), gLight, 0.12, 0.13, 0, { s: [0.9, 0.42, 0.82], noCast: true });
    [-0.2, -0.05, 0.1].forEach(function (x) { add(dcat, sph(0.1, 12), gDeep, x, 0.45, 0, { s: [0.35, 0.16, 2.6], noCast: true }); });
    add(dcat, sph(0.22, 20), gFur, 0.36, 0.32, 0, { s: [0.95, 0.88, 1] });
    add(dcat, sph(0.08, 12), gLight, 0.54, 0.26, 0, { s: [0.6, 0.6, 1.3], noCast: true });
    add(dcat, sph(0.022, 10), mat(0xEC6F8E), 0.575, 0.3, 0, { noCast: true });
    [-1, 1].forEach(function (sd) {
      var e1 = new THREE.Mesh(earG, gFur); e1.position.set(0.36, 0.53, sd * 0.11); e1.rotation.set(sd * 0.32, 0.785, 0); e1.castShadow = true; dcat.add(e1);
      var e2 = new THREE.Mesh(inEarG, mat(0xF7A9BE)); e2.position.set(0.385, 0.525, sd * 0.1); e2.rotation.set(sd * 0.32, 0.785, 0); dcat.add(e2);
      add(dcat, rbox(0.012, 0.014, 0.07, 0.005), mat(0x3B2A22), 0.56, 0.35, sd * 0.075, { ry: sd * 0.25, rx: sd * -0.25, noCast: true });
      add(dcat, sph(0.07, 12), gLight, 0.47, 0.06, sd * 0.1, { s: [1.4, 0.6, 1] });
    });
    var dtail = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 10, 22, Math.PI * 0.95), gFur); dtail.rotation.set(Math.PI / 2, 0, Math.PI * 0.55); dtail.position.set(-0.02, 0.07, 0.02); dtail.castShadow = true; dcat.add(dtail);
    add(dcat, sph(0.06, 12), gLight, 0.3, 0.07, 0.33);

    // Ergonomic task chair facing the workstation: five-star base on casters, gas-lift column, contoured seat,
    // adjustable-look armrests and a curved mesh back with a lumbar pad and small headrest.
    var chair = new THREE.Group(); chair.position.set(kbX, 0.44, deskZ + 1.85); chair.rotation.y = 0.12; room.add(chair);
    var cFrame = mat(0x26272B, { roughness: 0.55 }), cDark = mat(0x1E1F22, { roughness: 0.5 }), cAlu = mat(0xCFD2D8, { roughness: 0.3, metalness: 0.5 }), cAccent = mat(0xD8D2CB, { roughness: 0.8 });
    for (var cl = 0; cl < 5; cl++) {
      var ca = cl * Math.PI * 2 / 5 + 0.3, leg = new THREE.Mesh(rbox(0.62, 0.06, 0.1, 0.03), cAlu);
      leg.position.set(Math.cos(ca) * 0.31, 0.16, Math.sin(ca) * 0.31); leg.rotation.set(0, -ca, -0.08); leg.castShadow = true; leg.receiveShadow = true; chair.add(leg);
      add(chair, sph(0.065, 12), cDark, Math.cos(ca) * 0.6, 0.065, Math.sin(ca) * 0.6, { s: [1, 1, 0.75] });
    }
    add(chair, cyl(0.1, 0.12, 0.12, 18), cAlu, 0, 0.19, 0);
    add(chair, cyl(0.055, 0.055, 0.62, 14), cDark, 0, 0.55, 0);
    add(chair, cyl(0.075, 0.075, 0.2, 14), cFrame, 0, 0.36, 0);
    add(chair, rbox(0.5, 0.08, 0.46, 0.03), cDark, 0, 0.9, 0.02);
    add(chair, rbox(1.0, 0.16, 0.95, 0.08), mat(0x34353B, { roughness: 0.85 }), 0, 1.02, 0);
    add(chair, rbox(0.88, 0.04, 0.8, 0.04), mat(0x3E3F46, { roughness: 0.9 }), 0, 1.105, -0.02, { noCast: true });
    [-1, 1].forEach(function (sd) {
      add(chair, rbox(0.06, 0.44, 0.08, 0.025), cFrame, sd * 0.52, 1.28, 0.08);
      add(chair, rbox(0.12, 0.05, 0.42, 0.025), cDark, sd * 0.52, 1.52, 0.04);
    });
    add(chair, rbox(0.14, 0.5, 0.1, 0.04), cFrame, 0, 1.2, 0.5, { rx: 0.18 });
    var meshTex = tex(128, 128, function (g, w, h) { g.fillStyle = '#3A3B42'; g.fillRect(0, 0, w, h); g.strokeStyle = '#55565E'; g.lineWidth = 1; for (var q = 0; q <= w; q += 8) { g.beginPath(); g.moveTo(q, 0); g.lineTo(q, h); g.stroke(); g.beginPath(); g.moveTo(0, q); g.lineTo(w, q); g.stroke(); } });
    meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping; meshTex.repeat.set(3, 3);
    var back = new THREE.Group(); back.position.set(0, 1.42, 0.5); back.rotation.x = 0.1; chair.add(back);
    var R = 1.4, th0 = -0.35, thL = 0.7, arc = new THREE.Group(); arc.position.set(0, 0, -R + 0.02); back.add(arc);
    var meshPanel = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.0, 18, 1, true, th0, thL), new THREE.MeshStandardMaterial({ map: meshTex, color: 0xFFFFFF, roughness: 0.9, side: THREE.DoubleSide }));
    meshPanel.position.y = 0.55; meshPanel.castShadow = true; meshPanel.receiveShadow = true; arc.add(meshPanel);
    [0.06, 1.05].forEach(function (y) { var band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.07, 18, 1, true, th0, thL), new THREE.MeshStandardMaterial({ color: 0x26272B, roughness: 0.55, side: THREE.DoubleSide })); band.position.y = y; band.castShadow = true; arc.add(band); });
    [-1, 1].forEach(function (sd) { var ux = Math.sin(sd * 0.35) * R, uz = Math.cos(0.35) * R; add(arc, rbox(0.07, 1.06, 0.07, 0.03), cFrame, ux, 0.555, uz, { ry: sd * 0.35 }); });
    var lum = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.17, 18, 1, true, -0.24, 0.48), new THREE.MeshStandardMaterial({ color: 0xD8D2CB, roughness: 0.8, side: THREE.DoubleSide })); lum.position.y = 0.3; arc.add(lum);
    add(back, rbox(0.56, 0.22, 0.08, 0.05), cFrame, 0, 1.27, 0.04, { rx: -0.08 });
    add(back, rbox(0.06, 0.14, 0.05, 0.02), cDark, 0, 1.12, 0.04);

    // Digital piano + bench along the left wall, just in front of the window (keys face into the room)
    var piano = hotGroup('piano', room); piano.position.set(LW + 0.37, 0.44, 1.7); piano.rotation.y = Math.PI / 2;
    var pBody = mat(0xDCD0F7, { roughness: 0.55 }), pDeep = mat(0xB9A4EC, { roughness: 0.55 });
    add(piano, rbox(0.1, 1.2, 0.66, 0.04), pBody, -1.3, 0.6, 0);
    add(piano, rbox(0.1, 1.2, 0.66, 0.04), pBody, 1.3, 0.6, 0);
    add(piano, rbox(2.5, 0.7, 0.06, 0.03), pBody, 0, 0.52, -0.28);
    add(piano, rbox(2.7, 0.52, 0.4, 0.06), pBody, 0, 1.46, -0.13);
    add(piano, rbox(2.52, 0.1, 0.56, 0.03), pDeep, 0, 1.17, 0.05);
    add(piano, rbox(2.5, 0.05, 0.1, 0.02), pDeep, 0, 1.3, -0.17);
    var NW = 26, ww = 2.38 / NW;
    var wk = new THREE.InstancedMesh(new THREE.BoxGeometry(ww - 0.008, 0.05, 0.4), mat(0xFFFBF6, { roughness: 0.4 }), NW);
    var bkIdx = []; for (var q = 0; q < NW - 1; q++) if ([0, 1, 3, 4, 5].indexOf(q % 7) >= 0) bkIdx.push(q);
    var bk = new THREE.InstancedMesh(new THREE.BoxGeometry(ww * 0.55, 0.05, 0.25), mat(0x3A3550, { roughness: 0.35 }), bkIdx.length);
    for (var q2 = 0; q2 < NW; q2++) { KP.set(-1.19 + ww / 2 + q2 * ww, 1.245, 0.1); KM.compose(KP, KQ, KS); wk.setMatrixAt(q2, KM); }
    bkIdx.forEach(function (q3, k) { KP.set(-1.19 + (q3 + 1) * ww, 1.29, 0.02); KM.compose(KP, KQ, KS); bk.setMatrixAt(k, KM); });
    [wk, bk].forEach(function (im) { im.castShadow = true; im.receiveShadow = true; piano.add(im); });
    // Music stand: bracket on the piano top, two support stems, backplate and ledge (tilted back slightly)
    add(piano, rbox(0.42, 0.03, 0.14, 0.012), pDeep, 0, 1.735, -0.2);
    var stand = new THREE.Group(); stand.position.set(0, 1.75, -0.2); stand.rotation.x = -0.22; piano.add(stand);
    [-0.14, 0.14].forEach(function (x) { add(stand, cyl(0.014, 0.014, 0.12, 8), pDeep, x, 0.04, -0.02); });
    add(stand, rbox(0.62, 0.6, 0.028, 0.02), pDeep, 0, 0.38, -0.02);
    add(stand, rbox(0.68, 0.035, 0.09, 0.012), pDeep, 0, 0.085, 0.025);
    add(stand, rbox(0.68, 0.04, 0.012, 0.006), pDeep, 0, 0.115, 0.066, { noCast: true });
    // Symbolic sheet music (not a transcription): title, grand staves, clefs and scattered notes on ivory paper.
    var sheetTex = tex(600, 849, function (g, w, h) {
      g.fillStyle = '#FFFBF2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1E1B24'; g.textAlign = 'center';
      g.font = 'italic 600 34px Georgia, "Times New Roman", serif'; g.fillText('Liebestraum No. 3', w / 2, 70);
      g.font = '400 20px Georgia, "Times New Roman", serif'; g.fillText('F. Liszt', w / 2, 102);
      g.textAlign = 'left'; g.font = 'italic 16px Georgia, serif'; g.fillText('Poco allegro, con affetto', 40, 140);
      var clef = function (x, y) {
        g.lineWidth = 3; g.strokeStyle = '#1E1B24'; g.beginPath();
        g.moveTo(x + 10, y + 46); g.bezierCurveTo(x - 6, y + 40, x - 2, y + 18, x + 12, y + 18); g.bezierCurveTo(x + 26, y + 18, x + 26, y + 38, x + 10, y + 38);
        g.bezierCurveTo(x - 2, y + 38, x + 2, y + 8, x + 14, y - 6); g.bezierCurveTo(x + 22, y - 16, x + 14, y - 22, x + 10, y - 10); g.lineTo(x + 14, y + 58); g.stroke();
        g.beginPath(); g.arc(x + 11, y + 60, 4, 0, Math.PI * 2); g.fill();
      };
      var bass = function (x, y) { g.lineWidth = 3; g.beginPath(); g.arc(x + 10, y + 12, 9, Math.PI * 1.1, Math.PI * 0.35); g.stroke(); g.beginPath(); g.arc(x + 26, y + 6, 2.5, 0, Math.PI * 2); g.arc(x + 26, y + 18, 2.5, 0, Math.PI * 2); g.fill(); };
      var seed = 5, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      var note = function (x, y, open, stemUp) {
        g.save(); g.translate(x, y); g.rotate(-0.35); g.beginPath(); g.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
        if (open) { g.lineWidth = 2; g.stroke(); } else g.fill(); g.restore();
        g.lineWidth = 1.8; g.beginPath(); if (stemUp) { g.moveTo(x + 6, y - 1); g.lineTo(x + 6, y - 34); } else { g.moveTo(x - 6, y + 1); g.lineTo(x - 6, y + 34); } g.stroke();
      };
      for (var s = 0; s < 3; s++) {
        var top = 180 + s * 215;
        [0, 92].forEach(function (off, k) {
          g.strokeStyle = '#1E1B24'; g.lineWidth = 1.4;
          for (var l = 0; l < 5; l++) { g.beginPath(); g.moveTo(36, top + off + l * 11); g.lineTo(w - 30, top + off + l * 11); g.stroke(); }
          if (k === 0) clef(42, top + off - 4); else bass(42, top + off + 4);
          var bars = [200, 330, 460];
          bars.forEach(function (bx) { g.lineWidth = 1.4; g.beginPath(); g.moveTo(bx, top + off); g.lineTo(bx, top + off + 44); g.stroke(); });
          for (var n = 0; n < 9; n++) {
            var nx = 96 + n * 52 + rnd() * 10, ny = top + off + Math.round(rnd() * 8) * 5.5;
            note(nx, ny, k === 1 && n % 4 === 0, ny > top + off + 22);
          }
          if (k === 0) { g.lineWidth = 4; g.beginPath(); g.moveTo(102 + 52 * 2, top + off - 30); g.lineTo(102 + 52 * 3, top + off - 34); g.stroke(); }
        });
        g.lineWidth = 2; g.beginPath(); g.moveTo(36, top); g.lineTo(36, top + 92 + 44); g.stroke();
      }
      g.font = 'italic 700 20px Georgia, serif'; g.fillText('p', 70, 300); g.font = 'italic 15px Georgia, serif'; g.fillText('dolce cantando', 86, 300);
    });
    // A4 portrait sheet (210:297) resting on the ledge, 0.012 in front of the backplate
    var smallSheet = face(stand, 0.38, 0.537, sheetTex, 0, 0.375, 0.008);
    smallSheet.material.emissiveMap = smallSheet.material.map;
    var bigTex = sheetTex.clone(); bigTex.needsUpdate = true; bigTex.repeat.set(1, 1); bigTex.offset.set(0, 0);
    var bigSheet = new THREE.Mesh(new THREE.PlaneGeometry(1.089, 1.54), new THREE.MeshStandardMaterial({ map: bigTex, emissive: 0xffffff, emissiveMap: bigTex, emissiveIntensity: 0.35, roughness: 0.85, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    bigSheet.position.set(0, 2.95, -0.1); bigSheet.rotation.x = -0.12; bigSheet.userData.y0 = 2.95; bigSheet.visible = false; piano.add(bigSheet);
    var sheetA = 0;
    [-0.12, 0, 0.12].forEach(function (x) { add(piano, rbox(0.06, 0.03, 0.16, 0.01), mat(C.butter, { roughness: 0.3, metalness: 0.3 }), x, 0.06, 0.1); });
    var bench = new THREE.Group(); bench.position.set(LW + 1.35, 0.44, 1.7); room.add(bench);
    add(bench, rbox(0.46, 0.12, 1.1, 0.05), mat(C.hot), 0, 0.88, 0);
    [[-0.17, -0.45], [0.17, -0.45], [-0.17, 0.45], [0.17, 0.45]].forEach(function (p) { add(bench, cyl(0.04, 0.045, 0.82, 10), mat(C.woodDark), p[0], 0.41, p[1]); });

    // Easel with a landscape painting (sketchbook note)
    var paintTex = tex(300, 260, function (g, w, h) {
      g.fillStyle = '#0E9C92'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(0, 150); g.lineTo(80, 70); g.lineTo(150, 130); g.lineTo(220, 60); g.lineTo(300, 140); g.lineTo(300, 260); g.lineTo(0, 260); g.fill();
      g.fillStyle = '#6FB6E0'; g.beginPath(); g.moveTo(0, 175); g.lineTo(90, 120); g.lineTo(170, 165); g.lineTo(300, 125); g.lineTo(300, 260); g.lineTo(0, 260); g.fill();
      g.fillStyle = '#7CC36E'; g.fillRect(0, 175, w, 40); g.fillStyle = '#FFC93C'; g.fillRect(0, 210, w, 50);
      g.fillStyle = '#1F5E3A'; g.beginPath(); g.moveTo(230, 210); g.lineTo(250, 60); g.lineTo(270, 210); g.fill();
    });
    var easel = hotGroup('easel', room); easel.position.set(0.3, 0.44, 3.0); easel.rotation.y = 0.35;
    [[-0.55, 0.1], [0.55, 0.1]].forEach(function (p) { add(easel, cyl(0.05, 0.06, 2.6, 10), mat(C.hot), p[0], 1.25, p[1], { rz: p[0] * -0.12, rx: -0.12 }); });
    add(easel, cyl(0.045, 0.05, 2.4, 10), mat(C.hot), 0, 1.15, -0.5, { rx: 0.35 });
    add(easel, rbox(1.5, 0.08, 0.2, 0.03), mat(C.hot), 0, 1.0, 0.24);
    add(easel, rbox(1.56, 1.36, 0.08, 0.04), mat(C.blush), 0, 1.75, 0.2, { rx: -0.12 });
    var pm = face(easel, 1.4, 1.2, paintTex, 0, 1.755, 0.245); pm.rotation.x = -0.12;
    add(room, cyl(0.24, 0.2, 0.46, 18), mat(C.hot), 1.3, 0.67, 3.55);
    [[0.06, 0.02, C.plum], [-0.05, 0.05, C.navy], [0, -0.06, C.butter]].forEach(function (p) { add(room, cyl(0.022, 0.022, 0.7, 8), mat(p[2]), 1.3 + p[0], 1.05, 3.55 + p[1], { rz: p[0] * 4 }); });
    add(room, sph(0.5, 28), mat(0xF48BA0, { roughness: 0.35 }), -0.95, 0.94, 1.75);

    // Bookshelf in the back-left corner (resources note): cream case, lilac back, varied spines
    var shelf = hotGroup('books', room); shelf.position.set(-2.35, 0.44, BW + 0.34);
    var sw = 2.0, sh = 2.1, sd = 0.56, th = 0.09;
    add(shelf, rbox(sw, th, sd, 0.04), mat(C.cream), 0, th / 2, 0);
    add(shelf, rbox(sw, th, sd, 0.04), mat(C.cream), 0, sh - th / 2, 0);
    add(shelf, rbox(th, sh, sd, 0.04), mat(C.cream), -sw / 2 + th / 2, sh / 2, 0);
    add(shelf, rbox(th, sh, sd, 0.04), mat(C.cream), sw / 2 - th / 2, sh / 2, 0);
    add(shelf, rbox(sw - 0.1, 0.06, sd - 0.04, 0.02), mat(C.cream), 0, 0.72, 0);
    add(shelf, rbox(sw - 0.1, 0.06, sd - 0.04, 0.02), mat(C.cream), 0, 1.4, 0);
    add(shelf, rbox(sw - 0.12, sh - 0.12, 0.04, 0.02), mat(C.lav), 0, sh / 2, -sd / 2 + 0.03, { noCast: true });
    var SPINE = [C.hot, C.peach, C.lav, C.butter, C.sky, C.plum, C.leaf, C.navy, 0xF7A9BE, 0xFFB3A0];
    var row = function (y, n, seed) {
      var x = -0.84;
      for (var k = 0; k < n; k++) {
        var w = 0.11 + ((k * 37 + seed) % 5) * 0.02, h = 0.4 + ((k * 53 + seed) % 4) * 0.045, lean = k === n - 1 ? 0.2 : 0;
        add(shelf, rbox(w, h, 0.4, 0.015), mat(SPINE[(k + seed) % SPINE.length], { roughness: 0.7 }), x + w / 2 + (lean ? 0.07 : 0), y + h / 2 - (lean ? 0.02 : 0), 0.02, { rz: -lean });
        x += w + 0.025;
      }
    };
    row(0.09, 7, 0); row(0.75, 5, 3); row(1.43, 3, 6);
    add(shelf, rbox(0.52, 0.08, 0.38, 0.02), mat(C.peach), 0.5, 0.79, 0.02);
    add(shelf, rbox(0.46, 0.08, 0.36, 0.02), mat(C.hot), 0.52, 0.87, 0.02, { ry: 0.15 });
    add(shelf, sph(0.13, 18), mat(C.butter, { roughness: 0.4 }), 0.45, 1.56, 0.04);
    // Miniature vintage-style amp speaker standing on top of the bookshelf (decorative): black vinyl body, dotted grille with a
    // small cream script logo, brass control strip and knobs on top.
    var spkTex = tex(320, 200, function (g, w, h) {
      g.fillStyle = '#1A1A1C'; g.fillRect(0, 0, w, h);
      rr(g, 10, 10, w - 20, h - 20, 14, '#C9A45C'); rr(g, 14, 14, w - 28, h - 28, 11, '#232325');
      g.fillStyle = '#0F0F10'; for (var gy = 26; gy < h - 20; gy += 9) for (var gx = 26 + ((gy / 9) % 2) * 4.5; gx < w - 20; gx += 9) { g.beginPath(); g.arc(gx, gy, 2.6, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#F2E6CF'; g.font = 'italic 700 46px "Brush Script MT", "Segoe Script", cursive'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('Marshall', w / 2, 58);
    });
    var spk = new THREE.Group(); spk.position.set(-0.4, sh, 0.05); shelf.add(spk);
    add(spk, rbox(0.62, 0.42, 0.28, 0.05), mat(0x1C1C1E, { roughness: 0.92 }), 0, 0.21, 0);
    var spkFace = face(spk, 0.56, 0.36, spkTex, 0, 0.21, 0.142); spkFace.material.emissiveIntensity = 0.12;
    add(spk, rbox(0.5, 0.018, 0.08, 0.008), mat(0xC9A45C, { roughness: 0.35, metalness: 0.6 }), 0, 0.425, 0.06, { noCast: true });
    [-0.16, -0.06, 0.04, 0.14].forEach(function (x) { add(spk, cyl(0.022, 0.024, 0.03, 14), mat(0xD8B36A, { roughness: 0.3, metalness: 0.65 }), x, 0.445, 0.06); });
    [-0.24, 0.24].forEach(function (x) { add(spk, rbox(0.06, 0.02, 0.2, 0.008), mat(0x2A2A2C, { roughness: 0.6 }), x, 0.008, 0, { noCast: true }); });
    add(shelf, cyl(0.14, 0.12, 0.24, 18), mat(C.sky), 0.55, sh + 0.12, 0);
    add(shelf, sph(0.18, 16), mat(C.leaf), 0.55, sh + 0.36, 0, { s: [1, 0.85, 1] });

    // Soft coloured accent lights (attached to the room so they turn with it): warm window, lilac shelf, cyan floor bounce
    var winL = new THREE.PointLight(0xFFC2A8, 3.2, 7, 1.5); winL.position.set(LW + 0.9, 3.1, -1.3); room.add(winL);
    var lavL = new THREE.PointLight(0xD6C6FF, 2.2, 5, 1.5); lavL.position.set(-2.3, 2.9, BW + 1.4); room.add(lavL);
    var cyL = new THREE.PointLight(0xA9E7F2, 2.4, 8, 1.4); cyL.position.set(2.4, 1.0, 2.6); room.add(cyL);

    // Sleeping cat loafing on a round floor cushion (decorative only)
    var nap = new THREE.Group(); nap.position.set(-2.0, 0.45, 3.25); room.add(nap);
    add(nap, cyl(0.62, 0.6, 0.2, 40), mat(0xCDBDF2, { roughness: 0.95 }), 0, 0.1, 0);
    var rim2 = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.08, 12, 40), mat(0xBBA8EE, { roughness: 0.95 })); rim2.rotation.x = Math.PI / 2; rim2.position.y = 0.17; rim2.castShadow = true; rim2.receiveShadow = true; nap.add(rim2);
    add(nap, sph(0.56, 32), mat(0xD9CCF7, { roughness: 0.95 }), 0, 0.19, 0, { s: [1, 0.12, 1] });
    var cat = new THREE.Group(); cat.position.set(0, 0.24, 0); cat.rotation.y = -0.785; nap.add(cat);
    var fur = mat(0xF4B77E, { roughness: 0.85 }), furDeep = mat(0xE3975C, { roughness: 0.85 }), furLight = mat(0xFFE6CC, { roughness: 0.85 });
    add(cat, sph(0.36, 28), fur, -0.04, 0.22, 0, { s: [1.25, 0.7, 0.95] });
    add(cat, sph(0.3, 24), furLight, 0.12, 0.13, 0, { s: [0.9, 0.42, 0.82], noCast: true });
    [-0.16, 0.0, 0.14].forEach(function (x) { add(cat, sph(0.1, 14), furDeep, x - 0.04, 0.45, 0, { s: [0.35, 0.16, 2.6], noCast: true }); });
    add(cat, sph(0.22, 24), fur, 0.36, 0.32, 0, { s: [0.95, 0.88, 1] });
    [-1, 1].forEach(function (sd) {
      var e1 = new THREE.Mesh(earG, fur); e1.position.set(0.36, 0.53, sd * 0.11); e1.rotation.set(sd * 0.32, 0.785, 0); e1.castShadow = true; cat.add(e1);
      var e2 = new THREE.Mesh(inEarG, mat(0xF7A9BE)); e2.position.set(0.385, 0.525, sd * 0.1); e2.rotation.set(sd * 0.32, 0.785, 0); cat.add(e2);
      add(cat, rbox(0.012, 0.014, 0.07, 0.005), mat(0x5A3A2E), 0.56, 0.35, sd * 0.075, { ry: sd * 0.25, rx: sd * -0.25, noCast: true });
      add(cat, sph(0.07, 14), furLight, 0.45, 0.06, sd * 0.1, { s: [1.3, 0.6, 1] });
    });
    add(cat, sph(0.022, 10), mat(0xEC6F8E), 0.575, 0.3, 0, { noCast: true });
    add(cat, sph(0.08, 14), furLight, 0.54, 0.26, 0, { s: [0.6, 0.6, 1.3], noCast: true });
    var tail = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 10, 24, Math.PI * 0.95), fur); tail.rotation.set(Math.PI / 2, 0, Math.PI * 0.55); tail.position.set(-0.02, 0.07, 0.02); tail.castShadow = true; cat.add(tail);
    add(cat, sph(0.06, 12), furDeep, 0.3, 0.07, 0.33);

    // Two casual book piles on the floor under the window, between the bookshelf and the piano
    var BOOKC = [0xD9A3AB, 0xA9BFA0, 0xEFE3CC, 0xD8C1A0, 0x8E4A5A, 0x9C7A62];
    var pageM = mat(0xF7F0E1, { roughness: 0.9 });
    var pile = function (x, z, books) {
      var g = new THREE.Group(); g.position.set(x, 0.45, z); room.add(g); var y = 0;
      books.forEach(function (bk) {
        var w = bk[0], d = bk[1], h = bk[2], cm = mat(BOOKC[bk[3]], { roughness: 0.8 });
        var b = new THREE.Group(); b.position.set(bk[5] || 0, y + h / 2, bk[6] || 0); b.rotation.y = bk[4]; g.add(b);
        add(b, rbox(w, 0.018, d, 0.008), cm, 0, h / 2 - 0.009, 0);
        add(b, rbox(w, 0.018, d, 0.008), cm, 0, -h / 2 + 0.009, 0);
        add(b, rbox(0.03, h, d, 0.012), cm, -w / 2 + 0.015, 0, 0);
        add(b, rbox(w - 0.045, h - 0.03, d - 0.03, 0.006), pageM, 0.006, 0, 0);
        add(b, rbox(0.032, h * 0.3, d * 0.6, 0.006), mat(0xF2E6CF, { roughness: 0.7 }), -w / 2 + 0.012, 0, 0, { noCast: true });
        y += h;
      });
    };
    pile(-3.3, -1.0, [[0.62, 0.46, 0.09, 4, 0.1], [0.56, 0.42, 0.07, 1, -0.16, 0.02, 0.01], [0.6, 0.44, 0.1, 3, 0.22, -0.02], [0.5, 0.38, 0.06, 0, -0.06, 0.01, -0.02], [0.46, 0.34, 0.08, 5, 0.3]]);
    pile(-3.1, -1.8, [[0.58, 0.44, 0.08, 2, -0.12], [0.52, 0.4, 0.1, 0, 0.18, 0.02], [0.48, 0.36, 0.06, 1, -0.28, -0.01, 0.02]]);

    // Curtains pulled open on both sides of the window: draped panels with vertical folds, gathered by tie-backs,
    // hanging from a slim rail. Panels sit just off the wall and stay clear of the piano and bookshelf.
    var CT_TOP = 4.56, CT_BOT = 1.86, CT_TIE = 2.7, CT_W = 0.42, CT_WT = 0.22, CT_WB = 0.34;
    var floralTex = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#FBEFE6'; g.fillRect(0, 0, w, h);
      var seed = 11, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      var cols = ['#D99AA6', '#C98290', '#A9BFA0', '#F1DC93', '#F3E3CF'];
      for (var gy = 0; gy < 6; gy++) for (var gx = 0; gx < 6; gx++) {
        var cx = (gx + 0.5 + (gy % 2) * 0.5) * w / 6 + (rnd() - 0.5) * 14, cy = (gy + 0.5) * h / 6 + (rnd() - 0.5) * 14, rad = 5 + rnd() * 2.5, rot = rnd() * 6.28, col = cols[(gx * 3 + gy * 2) % 5];
        if (col === '#A9BFA0') { g.fillStyle = col; g.save(); g.translate(cx, cy); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, 6, 2.6, 0, 0, Math.PI * 2); g.fill(); g.restore(); continue; }
        g.fillStyle = col;
        for (var p = 0; p < 5; p++) { var a = rot + p * Math.PI * 2 / 5; g.beginPath(); g.arc(cx + Math.cos(a) * rad * 0.62, cy + Math.sin(a) * rad * 0.62, rad * 0.5, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = col === '#F1DC93' ? '#D99AA6' : '#F1DC93'; g.beginPath(); g.arc(cx, cy, rad * 0.32, 0, Math.PI * 2); g.fill();
      }
    });
    floralTex.wrapS = floralTex.wrapT = THREE.RepeatWrapping; floralTex.repeat.set(1.4, 7.5);
    var curtainM = new THREE.MeshStandardMaterial({ map: floralTex, color: 0xFFFFFF, roughness: 0.95, side: THREE.DoubleSide });
    var widthAt = function (y) {
      var sm = function (a) { return a * a * (3 - 2 * a); };
      return y >= CT_TIE ? CT_WT + (CT_W - CT_WT) * sm((y - CT_TIE) / (CT_TOP - CT_TIE)) : CT_WT + (CT_WB - CT_WT) * sm((CT_TIE - y) / (CT_TIE - CT_BOT));
    };
    var curtain = function (outerZ, dirIn) {
      var g = new THREE.Group(); g.position.set(LW, 0, outerZ); g.rotation.y = Math.PI / 2; room.add(g);
      var geo = new THREE.PlaneGeometry(1, 1, 30, 14), pa = geo.attributes.position, uva = geo.attributes.uv;
      for (var i = 0; i < pa.count; i++) {
        var u = pa.getX(i) + 0.5, v = pa.getY(i) + 0.5, y = CT_BOT + v * (CT_TOP - CT_BOT), w = widthAt(y), amp = 0.03 * (CT_W / w);
        pa.setXYZ(i, -dirIn * u * w, y, 0.07 + amp * (0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 5 + 0.6)));
        uva.setX(i, u * w / CT_W);
      }
      geo.computeVertexNormals();
      var me = new THREE.Mesh(geo, curtainM); me.castShadow = true; me.receiveShadow = true; g.add(me);
      add(g, rbox(CT_WT + 0.05, 0.07, 0.17, 0.03), mat(0xE8A9B8, { roughness: 0.8 }), -dirIn * CT_WT / 2, CT_TIE, 0.1);
      return g;
    };
    // outer edges set so each panel's inner edge stays ~0.06 outside the frame at its widest
    curtain(0.18, -1); curtain(-2.78, 1);
    add(room, cyl(0.026, 0.026, 3.2, 12), mat(C.woodDark, { roughness: 0.5 }), LW + 0.13, CT_TOP + 0.06, -1.3, { rx: Math.PI / 2 });
    [-2.88, 0.28].forEach(function (z) { add(room, sph(0.05, 12), mat(C.woodDark, { roughness: 0.5 }), LW + 0.13, CT_TOP + 0.06, z); add(room, rbox(0.14, 0.04, 0.04, 0.01), mat(C.woodDark), LW + 0.07, CT_TOP + 0.06, z + (z < 0 ? 0.1 : -0.1), { noCast: true }); });

    // Plant in a pink pot (small-thought note)
    // pot + leaves sit in pIn (18% larger); leaves hang from pLeaves, pivoted at the soil, so clicks sway only the foliage
    var plant = hotGroup('plant', room); plant.position.set(2.85, 0.44, 2.5);
    var pIn = new THREE.Group(); pIn.scale.setScalar(1.18); plant.add(pIn);
    add(pIn, cyl(0.52, 0.4, 0.82, 28), mat(C.hot, { roughness: 0.6 }), 0, 0.41, 0);
    add(pIn, cyl(0.55, 0.55, 0.1, 28), mat(C.hotDeep, { roughness: 0.6 }), 0, 0.82, 0);
    add(pIn, cyl(0.49, 0.49, 0.03, 28), mat(0x7A5A44, { roughness: 1 }), 0, 0.85, 0, { noCast: true });
    var pLeaves = new THREE.Group(); pLeaves.position.y = 0.86; pIn.add(pLeaves);
    // Monstera: each leaf is a root group at the soil (azimuth) holding a curved petiole tube and an extruded,
    // gently cupped and arched blade. Mature blades get edge splits and oval fenestrations; young ones are solid.
    // A canvas texture (UV-mapped across the blade) paints the midrib, lateral veins and a soft edge darkening.
    var veinTex = tex(256, 256, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, w * 0.62); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#C9D6C9');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,236,0.75)'; g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
      g.lineWidth = 2.2; for (var vy = 0.12; vy < 0.95; vy += 0.11) { [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(w / 2, h * (1 - vy)); g.quadraticCurveTo(w / 2 + sd * w * 0.22, h * (1 - vy - 0.03), w / 2 + sd * w * 0.48, h * (1 - vy - 0.12)); g.stroke(); }); }
    });
    var MON = {};
    var monsteraGeo = function (L, W, mature) {
      var k = [L, W, mature].join(); if (MON[k]) return MON[k];
      var edge = function (u, sd) { var x = W * 0.5 * Math.pow(Math.sin(Math.PI * (0.15 + 0.85 * u)), 0.85) * (1 - 0.15 * u); return new THREE.Vector2(sd * x, L * u - 0.12 * L * Math.pow(1 - u, 3)); };
      var slits = mature ? [0.28, 0.43, 0.58, 0.72] : [];
      var side = function (sd, off) {
        var pts = [], done = {};
        for (var u = 0; u <= 1.0001; u += 0.025) {
          var hit = -1; slits.forEach(function (s, i) { s += off; if (u >= s - 0.022 && u < s + 0.022) hit = i; });
          if (hit < 0) { pts.push(edge(Math.min(1, u), sd)); continue; }
          if (done[hit]) continue; done[hit] = 1;
          var s0 = slits[hit] + off, e0 = edge(s0 - 0.02, sd), e1 = edge(s0 + 0.02, sd), em = edge(s0, sd);
          pts.push(e0, new THREE.Vector2(em.x * 0.36, em.y - 0.05 * L), e1);
        }
        return pts;
      };
      var right = side(1, 0), left = side(-1, 0.03).reverse();
      var sh = new THREE.Shape();
      sh.moveTo(0, 0.06 * L); sh.lineTo(0.06 * W, -0.03 * L); sh.lineTo(0.14 * W, -0.1 * L);
      right.forEach(function (p) { sh.lineTo(p.x, p.y); });
      left.forEach(function (p) { sh.lineTo(p.x, p.y); });
      sh.lineTo(-0.14 * W, -0.1 * L); sh.lineTo(-0.06 * W, -0.03 * L); sh.lineTo(0, 0.06 * L);
      if (mature) [[0.36, 0.2], [0.51, 0.22], [0.65, 0.19], [0.36, -0.21], [0.52, -0.2], [0.66, -0.18]].forEach(function (hh) {
        var cx = hh[1] * W, cy = hh[0] * L, rx = 0.035 * W, ry = 0.055 * L, ho = new THREE.Path();
        ho.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, true, 0.3); sh.holes.push(ho);
      });
      var geo = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 1, curveSegments: 8 });
      var pa = geo.attributes.position, uv = geo.attributes.uv;
      for (var i = 0; i < pa.count; i++) {
        var x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i) - 0.006;
        uv.setXY(i, x / W + 0.5, Math.max(0, y) / L);
        z -= 0.42 * x * x / W + 0.22 * y * y / L;
        pa.setXYZ(i, x, y, z);
      }
      geo.rotateZ(-Math.PI / 2); geo.rotateX(-Math.PI / 2); geo.computeVertexNormals();
      return (MON[k] = geo);
    };
    var monM = [0x4C9E68, 0x58AE74, 0x7CC98E].map(function (c) { return new THREE.MeshStandardMaterial({ color: c, map: veinTex, roughness: 0.5, side: THREE.DoubleSide }); });
    var petM = mat(0x5E9C62, { roughness: 0.6 });
    // [azimuth, petiole height, reach, blade length, mature, tilt]; azimuths favour the room interior (away from +x/+z)
    [[0.5, 1.22, 0.12, 0.58, 0, 0.45], [1.5, 0.95, 0.3, 0.8, 1, 0.12], [2.45, 1.12, 0.26, 0.76, 1, 0.2], [3.4, 0.78, 0.32, 0.72, 1, 0.02], [4.35, 1.04, 0.22, 0.82, 1, 0.16], [5.35, 0.7, 0.2, 0.52, 0, 0.1], [6.05, 1.32, 0.14, 0.66, 1, 0.32]].forEach(function (lf, k) {
      var root = new THREE.Group(); root.rotation.y = lf[0]; pLeaves.add(root);
      var tip = new THREE.Vector3(lf[2], lf[1], 0);
      var curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(lf[2] * 0.15, lf[1] * 0.75, 0), tip);
      var pet = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.022, 6, false), petM); pet.castShadow = true; root.add(pet);
      var holder = new THREE.Group(); holder.position.copy(tip); holder.rotation.z = lf[5]; root.add(holder);
      var blade = new THREE.Mesh(monsteraGeo(lf[3], lf[3] * 0.92, !!lf[4]), monM[lf[4] ? k % 2 : 2]); blade.castShadow = true; blade.receiveShadow = true; holder.add(blade);
    });
    // Air purifier beside the desk chair (replaces the leaning board, same spot): matte off-white rounded tower on a
    // recessed foot, top outlet grille, lower intake slots on the front and sides, and a small upper control panel
    // with two status LEDs (green + soft blue) and a power mark. Kept in `lean` so its contact shadow is reused.
    var lean = new THREE.Group(); lean.position.set(3.55, 0.45, -1.0); lean.rotation.y = Math.PI / 4; room.add(lean);
    var apBody = mat(0xF5F1EA, { roughness: 0.75 }), apGrey = mat(0xD8D2C9, { roughness: 0.6 }), apSlot = mat(0xBFB8AE, { roughness: 0.7 });
    add(lean, rbox(0.62, 0.06, 0.62, 0.05), apGrey, 0, 0.03, 0);
    add(lean, rbox(0.72, 1.86, 0.72, 0.15), apBody, 0, 0.99, 0);
    add(lean, rbox(0.58, 0.025, 0.58, 0.08), apGrey, 0, 1.915, 0, { noCast: true });
    [-0.2, -0.1, 0, 0.1, 0.2].forEach(function (x) { add(lean, rbox(0.02, 0.012, 0.48, 0.005), apSlot, x, 1.93, 0, { noCast: true }); });
    for (var as = 0; as < 7; as++) {
      var ay = 0.28 + as * 0.075;
      add(lean, rbox(0.48, 0.018, 0.012, 0.006), apSlot, 0, ay, 0.362, { noCast: true });
      add(lean, rbox(0.012, 0.018, 0.48, 0.006), apSlot, 0.362, ay, 0, { noCast: true });
      add(lean, rbox(0.012, 0.018, 0.48, 0.006), apSlot, -0.362, ay, 0, { noCast: true });
    }
    add(lean, rbox(0.46, 0.3, 0.012, 0.06), mat(0xECE7DF, { roughness: 0.45 }), 0, 1.6, 0.362, { noCast: true });
    var apLed = function (x, col) {
      var led = new THREE.Mesh(sph(0.02, 12), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); led.position.set(x, 1.68, 0.372); lean.add(led);
      var halo = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); halo.position.set(x, 1.68, 0.37); halo.renderOrder = 3; lean.add(halo);
    };
    apLed(-0.08, 0x7EE0B0); apLed(0.08, 0x9CCBFF);
    var pwr = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 20, Math.PI * 1.6), mat(0xA79F95)); pwr.position.set(0, 1.53, 0.37); pwr.rotation.z = Math.PI / 2 + Math.PI * 0.2; lean.add(pwr);
    add(lean, rbox(0.008, 0.035, 0.006, 0.002), mat(0xA79F95), 0, 1.552, 0.371, { noCast: true });

    // Outside: two small trees, a few flower tufts and three pastel pebbles on the plinth
    var tree = function (x, z, s, c1, c2) {
      var g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); world.add(g);
      add(g, cyl(0.13, 0.18, 1.3, 12), mat(C.woodDark), 0, 0.65, 0);
      add(g, sph(0.8, 22), mat(c1, { roughness: 0.85 }), 0, 1.75, 0);
      add(g, sph(0.58, 20), mat(c2, { roughness: 0.85 }), 0.3, 2.35, 0.12);
      return g;
    };
    var mintL = new THREE.PointLight(0xBDF0D2, 1.6, 6, 1.5); mintL.position.set(5.4, 1.6, 1.0); world.add(mintL);
    var trees = [tree(5.7, -2.6, 0.95 * 1.18, 0xF6A9BE, 0xFFCAD7), tree(-2.6, 5.7, 0.85 * 1.18, C.leaf, 0xA9DFB4), tree(6.2, 1.6, 0.6 * 1.18, C.leafDeep, C.leaf)];
    var rng = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(11);
    var PET = [C.cream, C.blush, C.lav, 0xFFE7A8, C.peach];
    var fl = [];
    [[5.2, 4.2], [6.3, -0.4], [0.8, 6.3], [4.0, 6.1], [-1.2, 5.6], [6.1, 3.0]].forEach(function (c) { for (var k = 0; k < 4; k++) fl.push([c[0] + (rng() - 0.5) * 0.8, c[1] + (rng() - 0.5) * 0.8, 0.22 + rng() * 0.26, PET[Math.floor(rng() * PET.length)]]); });
    var M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3(), col = new THREE.Color(), pi = 0;
    var petals = new THREE.InstancedMesh(sph(0.085, 10), mat(0xFFFFFF, { roughness: 0.7 }), fl.length * 5);
    var centers = new THREE.InstancedMesh(sph(0.05, 8), mat(C.butter), fl.length);
    var stems = new THREE.InstancedMesh(cyl(0.016, 0.018, 1, 6), mat(C.leafDeep), fl.length);
    fl.forEach(function (f, k) {
      Q.identity(); S3.set(1, f[2], 1); P3.set(f[0], f[2] / 2, f[1]); M4.compose(P3, Q, S3); stems.setMatrixAt(k, M4);
      S3.set(1, 1, 1); P3.set(f[0], f[2] + 0.02, f[1]); M4.compose(P3, Q, S3); centers.setMatrixAt(k, M4);
      for (var p = 0; p < 5; p++) { var a = p * Math.PI * 2 / 5; S3.set(1, 0.45, 1); P3.set(f[0] + Math.cos(a) * 0.095, f[2], f[1] + Math.sin(a) * 0.095); M4.compose(P3, Q, S3); petals.setMatrixAt(pi, M4); petals.setColorAt(pi, col.set(f[3])); pi++; }
    });
    [petals, centers, stems].forEach(function (im) { im.castShadow = true; im.receiveShadow = true; world.add(im); });
    [[5.4, 5.6, C.hot, 0.42], [6.3, 4.7, C.peach, 0.38], [6.6, 3.6, C.lav, 0.34]].forEach(function (p) { add(world, cyl(p[3], p[3] * 1.05, 0.2, 24), mat(p[2], { roughness: 0.5 }), p[0], 0.1, p[1]); });

    // Window views: a stylised day scene and a night scene on two planes just in front of the pane (behind the
    // mullions). The night plane's opacity follows the theme (TH.night), so the view crossfades with the lights.
    var viewTex = function (night) {
      return tex(344, 484, function (g, w, h) {
        var sky = g.createLinearGradient(0, 0, 0, h * 0.75);
        if (night) { sky.addColorStop(0, '#1C2550'); sky.addColorStop(1, '#3B4884'); } else { sky.addColorStop(0, '#A9D8F5'); sky.addColorStop(1, '#E7F5FF'); }
        g.fillStyle = sky; g.fillRect(0, 0, w, h);
        var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(night ? 21 : 4);
        if (night) {
          for (var i = 0; i < 16; i++) { var sx = rnd() * w, sy = rnd() * h * 0.55, sr = 0.8 + rnd() * 1.3; g.fillStyle = 'rgba(255,246,220,' + (0.55 + rnd() * 0.4).toFixed(2) + ')'; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill(); }
          var mg = g.createRadialGradient(240, 110, 10, 240, 110, 70); mg.addColorStop(0, 'rgba(255,240,200,0.35)'); mg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = mg; g.fillRect(150, 30, 180, 170);
          g.fillStyle = '#FFF3D2'; g.beginPath(); g.arc(240, 110, 24, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#3B4884'; g.beginPath(); g.arc(252, 102, 21, 0, Math.PI * 2); g.fill();
        } else {
          g.fillStyle = 'rgba(255,255,255,0.85)'; [[80, 110, 1], [240, 70, 0.8], [270, 170, 0.6]].forEach(function (c) { var s = c[2]; g.beginPath(); g.ellipse(c[0], c[1], 46 * s, 15 * s, 0, 0, Math.PI * 2); g.ellipse(c[0] - 22 * s, c[1] + 4 * s, 26 * s, 12 * s, 0, 0, Math.PI * 2); g.ellipse(c[0] + 26 * s, c[1] + 5 * s, 24 * s, 11 * s, 0, 0, Math.PI * 2); g.fill(); });
        }
        var hill = function (y0, amp, col, ph) { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (var x = 0; x <= w; x += 8) g.lineTo(x, y0 + Math.sin(x * 0.012 + ph) * amp + Math.sin(x * 0.031 + ph * 2) * amp * 0.4); g.lineTo(w, h); g.closePath(); g.fill(); };
        hill(h * 0.66, 14, night ? '#2E3C68' : '#C5E8CF', 0.4);
        var treeC = night ? '#22305A' : '#9FD3AE';
        [[40, 0.69, 30], [96, 0.67, 22], [210, 0.7, 34], [300, 0.68, 26]].forEach(function (tr) { g.fillStyle = night ? '#1E2A4E' : '#B79A7E'; g.fillRect(tr[0] - 3, h * tr[1] - 6, 6, 34); g.fillStyle = treeC; g.beginPath(); g.arc(tr[0], h * tr[1] - tr[2] * 0.8, tr[2], 0, Math.PI * 2); g.fill(); });
        hill(h * 0.8, 10, night ? '#25335C' : '#A9DDB6', 2.1);
      });
    };
    var mkView = function (night) { var m = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 2.42), new THREE.MeshBasicMaterial({ map: viewTex(night), toneMapped: false, transparent: night, opacity: night ? 0 : 1, depthWrite: !night })); m.position.set(0, 0, night ? 0.0815 : 0.081); m.renderOrder = night ? 2 : 1; win.add(m); return m; };
    var dayView = mkView(false), nightView = mkView(true);

    // Curved floor lamp to the piano's left (toward the room front): weighted disc base, slim pole that hooks over
    // toward the piano, a small downturned shade with a warm bulb. Its light (no shadow) is theme-driven.
    var flamp = new THREE.Group(); flamp.position.set(LW + 0.42, 0.45, 3.45); room.add(flamp);
    var brass = mat(0xD9BC8C, { roughness: 0.35, metalness: 0.55 });
    add(flamp, cyl(0.3, 0.34, 0.06, 32), mat(0x6E6259, { roughness: 0.5, metalness: 0.3 }), 0, 0.03, 0);
    add(flamp, cyl(0.24, 0.27, 0.04, 32), brass, 0, 0.08, 0);
    var hookDir = new THREE.Vector3(0.55, 0, -0.84).normalize();
    var hp = function (k, y) { return new THREE.Vector3(hookDir.x * k, y, hookDir.z * k); };
    var poleCurve = new THREE.CatmullRomCurve3([hp(0, 0.1), hp(0, 2.6), hp(0, 3.55), hp(0.12, 3.95), hp(0.42, 4.12), hp(0.7, 4.02), hp(0.82, 3.78)]);
    var pole = new THREE.Mesh(new THREE.TubeGeometry(poleCurve, 64, 0.03, 10, false), brass); pole.castShadow = true; flamp.add(pole);
    var head = new THREE.Group(); head.position.copy(hp(0.82, 3.78)); flamp.add(head);
    add(head, cyl(0.035, 0.035, 0.08, 12), brass, 0, 0.0, 0);
    var shadeG = new THREE.CylinderGeometry(0.1, 0.27, 0.3, 32, 1, true);
    var fShade = new THREE.Mesh(shadeG, new THREE.MeshStandardMaterial({ color: 0xF6E7CF, roughness: 0.7, side: THREE.DoubleSide, emissive: 0xFFD9A0, emissiveIntensity: 0.25 })); fShade.position.y = -0.17; fShade.castShadow = true; head.add(fShade);
    var fBulbM = new THREE.MeshBasicMaterial({ color: 0xFFE2A8, toneMapped: false }); var fBulb = new THREE.Mesh(sph(0.075, 14), fBulbM); fBulb.position.y = -0.2; head.add(fBulb);
    var floorLight = new THREE.PointLight(0xFFCB8A, 1, 5, 1.6); floorLight.position.set(0, -0.32, 0); head.add(floorLight);
    var poolTex = tex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,214,150,0.55)'); gr.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    var pool = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.25, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(flamp.position.x + hookDir.x * 0.82, 0.455, flamp.position.z + hookDir.z * 0.82); pool.renderOrder = 2; room.add(pool);

    // "stay golden" neon above the bookshelf: script lettering drawn as one stroke (bright core) plus a separate
    // blurred halo plane (additive), on a faint clear acrylic backer with four standoffs, lighting the wall a little.
    var NEON_FONT = '"Yellowtail", "Segoe Script", "Brush Script MT", cursive';
    if (!document.getElementById('tw-neon-font')) { var lk = document.createElement('link'); lk.id = 'tw-neon-font'; lk.rel = 'stylesheet'; lk.href = 'https://fonts.googleapis.com/css2?family=Yellowtail&display=swap'; document.head.appendChild(lk); }
    var neonCanvas = function (halo) {
      return function (g, w, h) {
        g.clearRect(0, 0, w, h); g.font = '400 168px ' + NEON_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineCap = 'round';
        if (halo) { g.shadowColor = 'rgba(255,190,70,1)'; g.shadowBlur = 46; g.fillStyle = 'rgba(255,196,84,0.9)'; g.fillText('stay golden', w / 2, h / 2); g.shadowBlur = 22; g.fillText('stay golden', w / 2, h / 2); return; }
        g.shadowColor = 'rgba(255,186,60,0.95)'; g.shadowBlur = 10; g.strokeStyle = '#FFC24D'; g.lineWidth = 9; g.strokeText('stay golden', w / 2, h / 2);
        g.shadowBlur = 0; g.strokeStyle = '#FFF2C4'; g.lineWidth = 3.4; g.strokeText('stay golden', w / 2, h / 2);
      };
    };
    var neonCoreTex = tex(1024, 320, neonCanvas(false)), neonHaloTex = tex(1024, 320, neonCanvas(true));
    var neon = new THREE.Group(); neon.position.set(shelf.position.x, 4.3, BW + 0.04); room.add(neon);
    add(neon, rbox(2.15, 0.72, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.12, roughness: 0.15, depthWrite: false }), 0, 0, 0.05, { noCast: true });
    [[-0.95, 0.27], [0.95, 0.27], [-0.95, -0.27], [0.95, -0.27]].forEach(function (p) { add(neon, cyl(0.03, 0.03, 0.06, 10), mat(0xE9E2D8, { roughness: 0.3, metalness: 0.5 }), p[0], p[1], 0.03, { rx: Math.PI / 2, noCast: true }); });
    var neonHaloM = new THREE.MeshBasicMaterial({ map: neonHaloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.35 });
    var neonCoreM = new THREE.MeshBasicMaterial({ map: neonCoreTex, transparent: true, depthWrite: false, toneMapped: false });
    var nHalo = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.72), neonHaloM); nHalo.position.z = 0.02; nHalo.renderOrder = 3; neon.add(nHalo);
    var nCore = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.72), neonCoreM); nCore.position.z = 0.072; nCore.renderOrder = 4; neon.add(nCore);
    var neonLight = new THREE.PointLight(0xFFC45E, 0.35, 3.2, 1.8); neonLight.position.set(0, 0, 0.55); neon.add(neonLight);
    if (document.fonts && document.fonts.load) document.fonts.load('168px "Yellowtail"').then(function () {
      [[neonCoreTex, false], [neonHaloTex, true]].forEach(function (p) { neonCanvas(p[1])(p[0].image.getContext('2d'), p[0].image.width, p[0].image.height); p[0].needsUpdate = true; });
      kick();
    }).catch(function () {});

    // Theme-synced lighting. The page's <html data-theme> is the single source of truth (watched with a
    // MutationObserver). Light = soft daylight; dark = cozy evening: cool moonlight key and window, dimmer sky/ground
    // fill and environment, a warm ceiling glow and a brighter desk lamp. Values ease over ~0.7s inside the render
    // loop (no object moves); the first frame uses the target directly, so there is no flash on load.
    var evening = new THREE.PointLight(0xFFC28E, 0, 10, 1.4); evening.position.set(0.4, 4.4, 0.4); room.add(evening);
    var paneMat = win.children[1] && win.children[1].material, shadeMat = lamp.children[2] && lamp.children[2].material;
    var TH = {
      light: { exp: 1.05, hemiI: 0.85, hemiS: 0xFFF3EC, hemiG: 0xDCCEF5, sunI: 2.0, sunC: 0xFFF1E6, fillI: 0.45, fillC: 0xE7DDFF, rimI: 0.4, dayI: 0.45, dayC: 0xFFF6EA, env: 1, bulbI: 2.4, bounceI: 1.2, eveI: 0, mintI: 1.6, paneC: 0xFFD6E0, paneI: 0.45, shadeI: 0.35, night: 0, flI: 1.0, flShade: 0.25, flPool: 0.22, neonHalo: 0.32, neonCore: 0.85, neonI: 0.35 },
      dark: { exp: 1.12, hemiI: 0.42, hemiS: 0x7A80C0, hemiG: 0x4A3654, sunI: 0.7, sunC: 0xB9C8FF, fillI: 0.32, fillC: 0x9C8CE0, rimI: 0.3, dayI: 0.42, dayC: 0x9DB8FF, env: 0.4, bulbI: 4.4, bounceI: 2.2, eveI: 2.1, mintI: 0.9, paneC: 0xA9BEFF, paneI: 0.55, shadeI: 1.0, night: 1, flI: 3.2, flShade: 0.9, flPool: 0.6, neonHalo: 0.95, neonCore: 1, neonI: 1.5 }
    };
    var thKey = function () { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; };
    var thCur = null, thWant = thKey(), thMats = [];
    var CL = { hemiS: new THREE.Color(), hemiG: new THREE.Color(), sunC: new THREE.Color(), fillC: new THREE.Color(), dayC: new THREE.Color(), paneC: new THREE.Color() };
    var thApply = function (v) {
      renderer.toneMappingExposure = v.exp;
      hemi.intensity = v.hemiI; hemi.color.copy(CL.hemiS); hemi.groundColor.copy(CL.hemiG);
      sun.intensity = v.sunI; sun.color.copy(CL.sunC); fill.intensity = v.fillI; fill.color.copy(CL.fillC); rim.intensity = v.rimI;
      daylight.intensity = v.dayI; daylight.color.copy(CL.dayC);
      bulb.intensity = v.bulbI; bounce.intensity = v.bounceI; evening.intensity = v.eveI; if (typeof mintL !== 'undefined' && mintL) mintL.intensity = v.mintI;
      if (paneMat) { paneMat.emissive.copy(CL.paneC); paneMat.emissiveIntensity = v.paneI; }
      if (shadeMat) shadeMat.emissiveIntensity = v.shadeI;
      nightView.material.opacity = v.night; nightView.visible = v.night > 0.003;
      floorLight.intensity = v.flI; fShade.material.emissiveIntensity = v.flShade; pool.material.opacity = v.flPool;
      neonHaloM.opacity = v.neonHalo; neonCoreM.opacity = v.neonCore; neonLight.intensity = v.neonI;
      if (!thMats.length) world.traverse(function (o) { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && thMats.indexOf(o.material) < 0) { o.material.userData.envBase = o.material.envMapIntensity; thMats.push(o.material); } });
      thMats.forEach(function (m) { m.envMapIntensity = m.userData.envBase * v.env; });
    };
    var themeStep = function (dt) {
      var tgt = TH[thWant];
      if (!thCur) { thCur = Object.assign({}, tgt); Object.keys(CL).forEach(function (k) { CL[k].set(tgt[k]); }); thApply(thCur); return false; }
      var a = reduce() ? 1 : Math.min(1, dt * 4), moving = false;
      Object.keys(tgt).forEach(function (k) {
        if (CL[k]) { var c2 = new THREE.Color(tgt[k]); if (Math.abs(CL[k].r - c2.r) + Math.abs(CL[k].g - c2.g) + Math.abs(CL[k].b - c2.b) > 0.002) { CL[k].lerp(c2, a); moving = true; } else CL[k].copy(c2); }
        else { var d = tgt[k] - thCur[k]; if (Math.abs(d) > 0.002) { thCur[k] += d * a; moving = true; } else thCur[k] = tgt[k]; }
      });
      if (moving || thCur._dirty) { thApply(thCur); thCur._dirty = moving; }
      return moving;
    };
    var thObs = new MutationObserver(function () { var k = thKey(); if (k !== thWant) { thWant = k; if (thCur) thCur._dirty = true; kick(); } });
    thObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Soft contact shadows: one shared radial-gradient texture on thin planes just above the floor (or rug), sized
    // from each object's footprint. They add the dark "touch" the shadow map is too soft to draw.
    var csTex = tex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(70,40,40,0.55)'); gr.addColorStop(0.55, 'rgba(70,40,40,0.25)'); gr.addColorStop(1, 'rgba(70,40,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    var csMat = new THREE.MeshBasicMaterial({ map: csTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
    var csGeo = new THREE.PlaneGeometry(1, 1);
    var contact = function (o, pad, y, strength) {
      if (!o) return; room.updateMatrixWorld(true);
      var bb = new THREE.Box3().setFromObject(o), a = room.worldToLocal(bb.min.clone()), b = room.worldToLocal(bb.max.clone());
      var m = new THREE.Mesh(csGeo, strength ? csMat.clone() : csMat); if (strength) m.material.opacity = strength;
      m.rotation.x = -Math.PI / 2; m.position.set((a.x + b.x) / 2, y || 0.452, (a.z + b.z) / 2);
      m.scale.set(Math.abs(b.x - a.x) * pad, Math.abs(b.z - a.z) * pad, 1); m.renderOrder = 1; room.add(m);
    };
    contact(chair, 1.05); contact(piano, 1.2); contact(bench, 1.25); contact(shelf, 1.15); contact(plant, 1.15); contact(nap, 1.25); contact(easel, 1.0, 0.452, 0.6); contact(lean, 1.15);
    var deskShadow = new THREE.Mesh(csGeo, csMat); deskShadow.rotation.x = -Math.PI / 2; deskShadow.position.set(deskX, 0.452, deskZ); deskShadow.scale.set(DW * 1.08, DD * 1.15, 1); room.add(deskShadow);
    // Material response: matte fabrics/paper stay soft; hard surfaces pick up the studio environment, metals most.
    world.traverse(function (o) {
      if (!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return;
      var m = o.material; if (m.userData.tuned) return; m.userData.tuned = true;
      if (m.metalness > 0.2) { m.envMapIntensity = 1.0; m.roughness = Math.max(0.22, m.roughness); }
      else if (m.roughness <= 0.45) m.envMapIntensity = 0.7;
      else if (m.roughness >= 0.9) m.envMapIntensity = 0.15;
      else if (m.envMapIntensity === 1) m.envMapIntensity = 0.35;
    });

    // Focus scales each clickable group about its own origin. Groups built at the room origin (the monitor +
    // MacBook) would therefore be pushed out by the scale factor, through the back wall. Re-pivot every group to
    // the bottom-centre of its own bounds first, keeping all world positions unchanged.
    world.updateMatrixWorld(true);
    hot.forEach(function (h) {
      var g = h.group, bb = new THREE.Box3().setFromObject(g), pw = new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);
      var pl = g.worldToLocal(pw.clone());
      g.children.forEach(function (ch) { ch.position.sub(pl); if (ch.userData.y0 != null) ch.userData.y0 = ch.position.y; });
      g.position.add(pl.clone().multiply(g.scale).applyQuaternion(g.quaternion));
      g.updateMatrixWorld(true);
    });
    hot.forEach(function (h) {
      h.baseY = h.group.position.y; h.mats = []; h.scale = 1;
      h.group.traverse(function (o) { if (o.isMesh) { o.material = o.material.clone(); o.userData.key = h.key; h.mats.push(o.material); o.material.userData.ei0 = o.material.emissiveIntensity; } });
    });
    var HOT = {}; hot.forEach(function (h) { HOT[h.key] = h; });
    var pickables = []; hot.forEach(function (h) { h.group.traverse(function (o) { if (o.isMesh) pickables.push(o); }); });

    // Stage: everything interactive lives in one layer so it can move between the card and the full-screen viewer.
    var stage = mk('div', 'position:absolute;inset:0;z-index:2;overflow:hidden;border-radius:inherit');
    box.appendChild(stage); stage.appendChild(cv);

    // View state. The camera keeps its isometric direction; a view is a look-at point L plus an orthographic zoom.
    // Orbit: yaw turns the world; pitch raises the camera from a low side view (8°) to near top-down (81°).
    // The default pitch is the original isometric angle.
    var PITCH0 = Math.atan2(0.84, Math.SQRT2), PITCH_MIN = 0.14, PITCH_MAX = 1.42, pitch = PITCH0, pvel = 0;
    var DIR = new THREE.Vector3(), DIST = 30;
    // The look-at target Tl lives in the room's own (world-group) coordinates, so turning the room orbits around
    // whatever you are looking at. Home is on the turning axis, which keeps the overview identical to before.
    var Tl0 = new THREE.Vector3(0, 1.9, 0), Tl = Tl0.clone(), view = { L: new THREE.Vector3(), zoom: 1 };
    var ZMIN = 0.8, ZMAX = 4.6;
    var RIGHT = new THREE.Vector3(), UP = new THREE.Vector3();
    var applyView = function () {
      var c = Math.cos(pitch); DIR.set(c * Math.SQRT1_2, Math.sin(pitch), c * Math.SQRT1_2);
      world.updateMatrixWorld(); view.L.copy(Tl); world.localToWorld(view.L);
      cam.position.copy(view.L).addScaledVector(DIR, DIST); cam.lookAt(view.L); cam.zoom = view.zoom; cam.updateProjectionMatrix();
      cam.updateMatrixWorld(); RIGHT.setFromMatrixColumn(cam.matrixWorld, 0); UP.setFromMatrixColumn(cam.matrixWorld, 1);
    };
    applyView();

    // Sizing: the frustum is fitted to the scene bounds (across the yaw range) at several pitches once;
    // tilting interpolates between them so the world stays centred and fully in view at every angle.
    var W = 1, Hh = 1, EXT = null, PS = [PITCH_MIN, 0.36, PITCH0, 0.82, 1.12, PITCH_MAX];
    var measure = function () {
      var bb = new THREE.Box3(), v = new THREE.Vector3(), kp = pitch, kT = Tl.clone(), kz = view.zoom;
      Tl.copy(Tl0); view.zoom = 1;
      EXT = PS.map(function (p) {
        pitch = p;
        var mn = [1e9, 1e9], mx = [-1e9, -1e9];
        [-0.9, 0, 0.9].forEach(function (yy) {
          world.rotation.y = yy; world.updateMatrixWorld(true); applyView(); bb.setFromObject(world);
          for (var i = 0; i < 8; i++) { v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(cam.matrixWorldInverse); mn[0] = Math.min(mn[0], v.x); mn[1] = Math.min(mn[1], v.y); mx[0] = Math.max(mx[0], v.x); mx[1] = Math.max(mx[1], v.y); }
        });
        return { p: p, cx: (mn[0] + mx[0]) / 2, cy: (mn[1] + mx[1]) / 2, w: (mx[0] - mn[0]) * 0.86, h: (mx[1] - mn[1]) * 0.9 };
      });
      pitch = kp; Tl.copy(kT); view.zoom = kz; world.rotation.y = yaw || 0; world.updateMatrixWorld(true); applyView();
    };
    var extAt = function (p) {
      var A = EXT[0], B = EXT[EXT.length - 1];
      for (var i = 0; i < EXT.length - 1; i++) if (p >= EXT[i].p && p <= EXT[i + 1].p) { A = EXT[i]; B = EXT[i + 1]; break; }
      var k = B.p === A.p ? 0 : Math.max(0, Math.min(1, (p - A.p) / (B.p - A.p)));
      return { cx: A.cx + (B.cx - A.cx) * k, cy: A.cy + (B.cy - A.cy) * k, w: A.w + (B.w - A.w) * k, h: A.h + (B.h - A.h) * k };
    };
    var applyFrustum = function () {
      var e = extAt(Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch))), asp = W / Hh, hw = Math.max(e.w / 2, e.h / 2 * asp), hh = hw / asp;
      cam.left = e.cx - hw; cam.right = e.cx + hw; cam.top = e.cy + hh; cam.bottom = e.cy - hh; cam.updateProjectionMatrix();
    };
    var fit = function () {
      var r = stage.getBoundingClientRect(); W = Math.max(1, r.width); Hh = Math.max(1, r.height);
      renderer.setSize(W, Hh, false);
      if (!EXT) measure();
      applyFrustum();
      if (focus) { var k = focus.key; focus = null; focusObj(k, true); }
      kick();
    };

    // Interaction state
    var YAW_MIN = -1.3, YAW_MAX = 1.3;
    var yaw = 0, vel = 0, drag = null, idleT = 0, lastInteract = performance.now(), hoverKey = null;
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    // Botanical flourish: clicking a plant or tree sways it about its base (foliage only for the potted plant) and
    // releases a few tiny petals, five-petal blossoms and leaves from its crown. Sway always restarts from the
    // stored rest rotation, so repeated clicks never add up or drift. Particles live in the world group (they turn
    // and zoom with the scene) and are removed and disposed when they fade out.
    trees.forEach(function (g, i) { g.traverse(function (o) { if (o.isMesh) { o.userData.key = 'tree' + i; pickables.push(o); } }); });
    var swayers = { plant: { obj: pLeaves, amp: 0.13, top: new THREE.Vector3(0, 1.35, 0), leaves: pLeaves.children.map(function (m, k) { return { m: m, rx: m.rotation.x, rz: m.rotation.z, ph: k * 0.9 }; }) } };
    trees.forEach(function (g, i) { swayers['tree' + i] = { obj: g, amp: 0.07, top: new THREE.Vector3(0.1, 2.1, 0.05), leaves: g.children.slice(1).map(function (m, k) { return { m: m, rx: m.rotation.x, rz: m.rotation.z, ph: 1 + k }; }) }; });
    Object.keys(swayers).forEach(function (k) { var s = swayers[k]; s.rx = s.obj.rotation.x; s.rz = s.obj.rotation.z; s.t = -1; });
    var FX = [], fxPetalG = sph(0.045, 8), fxLeafG = new THREE.ConeGeometry(0.035, 0.12, 4), fxCoreG = sph(0.022, 6);
    var FXC = [0xF9C6D3, 0xF4AFC0, 0xFFF4EA, 0xFFFFFF, 0xF7D7DF], FXL = [0xB7D9B4, 0xA3CBA0];
    var fxMat = function (c) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, transparent: true, opacity: 0, depthWrite: false }); };
    var burst = function (s) {
      var o = s.obj.localToWorld(s.top.clone()); world.worldToLocal(o);
      var n = 9 + Math.floor(Math.random() * 4);
      for (var i = 0; i < n; i++) {
        var kind = i < 3 ? 'flower' : (i % 3 === 0 ? 'leaf' : 'petal'), p = new THREE.Group(), mats = [];
        if (kind === 'flower') {
          var pm = fxMat(FXC[i % 3]); mats.push(pm);
          for (var q = 0; q < 5; q++) { var pe = new THREE.Mesh(fxPetalG, pm); var a = q * Math.PI * 2 / 5; pe.position.set(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04); pe.scale.set(1, 0.35, 0.8); p.add(pe); }
          var cm = fxMat(0xFFE08A); mats.push(cm); p.add(new THREE.Mesh(fxCoreG, cm));
        } else if (kind === 'leaf') { var lm = fxMat(FXL[i % 2]); mats.push(lm); var lf = new THREE.Mesh(fxLeafG, lm); lf.scale.set(1, 1, 0.35); p.add(lf); }
        else { var qm = fxMat(FXC[i % FXC.length]); mats.push(qm); var pt = new THREE.Mesh(fxPetalG, qm); pt.scale.set(1, 0.3, 0.7); p.add(pt); }
        var az = Math.random() * Math.PI * 2, sp = 0.35 + Math.random() * 0.45;
        p.position.copy(o).add(new THREE.Vector3(Math.cos(az) * 0.15, (Math.random() - 0.3) * 0.25, Math.sin(az) * 0.15));
        p.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        world.add(p);
        FX.push({ g: p, mats: mats, v: new THREE.Vector3(Math.cos(az) * sp, 0.35 + Math.random() * 0.4, Math.sin(az) * sp), spin: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3), t: -i * 0.035, life: 1.1 + Math.random() * 0.7, sc: kind === 'flower' ? 0.9 + Math.random() * 0.4 : 0.7 + Math.random() * 0.6, ph: Math.random() * 6 });
      }
    };
    var poke = function (k) {
      var s = swayers[k]; if (!s || reduce()) return;
      s.t = 0; if (FX.length < 60) burst(s); kick();
    };
    var updateFX = function (dt) {
      var busy = false;
      Object.keys(swayers).forEach(function (k) {
        var s = swayers[k]; if (s.t < 0) return;
        s.t += dt; var tau = Math.min(1, s.t / 1.6), env = Math.pow(1 - tau, 2), w = Math.sin(tau * Math.PI * 2 * 2.2);
        s.obj.rotation.z = s.rz + s.amp * w * env; s.obj.rotation.x = s.rx + s.amp * 0.35 * Math.sin(tau * Math.PI * 2 * 1.6 + 0.8) * env;
        s.leaves.forEach(function (l) { var lw = Math.sin(tau * Math.PI * 2 * 2.2 - 0.6 - l.ph * 0.15) * env * 0.08; l.m.rotation.x = l.rx + lw * 0.6; l.m.rotation.z = l.rz + lw; });
        if (tau >= 1) { s.obj.rotation.z = s.rz; s.obj.rotation.x = s.rx; s.leaves.forEach(function (l) { l.m.rotation.x = l.rx; l.m.rotation.z = l.rz; }); s.t = -1; } else busy = true;
      });
      for (var i = FX.length - 1; i >= 0; i--) {
        var f = FX[i]; f.t += dt; if (f.t < 0) { busy = true; continue; }
        var u = f.t / f.life;
        if (u >= 1) { world.remove(f.g); f.mats.forEach(function (m) { m.dispose(); }); FX.splice(i, 1); continue; }
        f.v.multiplyScalar(Math.pow(0.35, dt)); f.v.y -= 0.12 * dt;
        f.g.position.addScaledVector(f.v, dt); f.g.position.x += Math.sin(f.t * 3 + f.ph) * 0.12 * dt;
        f.g.rotation.x += f.spin.x * dt; f.g.rotation.y += f.spin.y * dt; f.g.rotation.z += f.spin.z * dt;
        var pop = Math.min(1, u / 0.15); f.g.scale.setScalar(f.sc * (0.4 + 0.6 * pop));
        var op = u < 0.15 ? u / 0.15 : 1 - Math.pow((u - 0.15) / 0.85, 1.6);
        f.mats.forEach(function (m) { m.opacity = Math.max(0, op) * 0.95; });
        busy = true;
      }
      return busy;
    };
    var pick = function (cx, cy) {
      var r = cv.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam); var hit = ray.intersectObjects(pickables, false)[0];
      return hit ? hit.object.userData.key : null;
    };
    var setHover = function (k) {
      if (k === hoverKey) return; hoverKey = k;
      hot.forEach(function (h) { h.want = h.key === k ? 1 : 0; });
      if (k) cv.setAttribute('role', 'button'); else cv.removeAttribute('role');
      cv.style.cursor = drag && drag.moved ? 'grabbing' : (k || focus ? 'pointer' : 'grab');
      kick();
    };
    cv.style.cursor = 'grab';

    // In-scene note: a billboard plane drawn to a canvas, placed in the final focused view beside the object,
    // always in front of the geometry (no depth test), fading in once the zoom has landed.
    var noteMesh = null, noteAlpha = 0, noteWant = 0;
    var wrap = function (g, text, maxW) { var words = text.split(' '), lines = [], line = ''; words.forEach(function (w) { var tryL = line ? line + ' ' + w : w; if (g.measureText(tryL).width > maxW && line) { lines.push(line); line = w; } else line = tryL; }); if (line) lines.push(line); return lines; };
    var drawNote = function (n, pxW, maxH) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), sc = 1, cw, ch, lines, ctx0 = document.createElement('canvas').getContext('2d');
      for (var tries = 0; tries < 4; tries++) {
        var pad = 18 * sc, bodyF = 14 * sc, lh = 20 * sc;
        ctx0.font = '400 ' + bodyF + 'px Archivo, Arial, sans-serif';
        lines = wrap(ctx0, n.body, pxW - pad * 2);
        ch = pad + 12 * sc + 10 * sc + 22 * sc + 10 * sc + lines.length * lh + 12 * sc + 14 * sc + pad;
        if (ch <= maxH || sc < 0.8) break; sc -= 0.07;
      }
      cw = pxW;
      var c = document.createElement('canvas'); c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr);
      var g = c.getContext('2d'); g.scale(dpr, dpr);
      var pad2 = 18 * sc, y = pad2;
      g.fillStyle = 'rgba(194,30,86,0.10)'; g.beginPath(); g.roundRect(2, 5, cw - 4, ch - 6, 16); g.fill();
      g.fillStyle = '#FFFBF8'; g.beginPath(); g.roundRect(0, 0, cw - 2, ch - 4, 16); g.fill();
      g.fillStyle = '#C21E56'; g.font = '500 ' + (11 * sc) + 'px "JetBrains Mono", monospace'; g.textBaseline = 'top';
      g.fillText(n.cat.toUpperCase(), pad2, y); y += 12 * sc + 10 * sc;
      g.fillStyle = '#111111'; g.font = '700 ' + (19 * sc) + 'px Archivo, Arial, sans-serif'; g.fillText(n.title, pad2, y); y += 22 * sc + 10 * sc;
      g.fillStyle = '#3F3F46'; g.font = '400 ' + (14 * sc) + 'px Archivo, Arial, sans-serif';
      lines.forEach(function (l) { g.fillText(l, pad2, y); y += 20 * sc; });
      y += 12 * sc; g.fillStyle = '#8A8A93'; g.font = '400 ' + (11 * sc) + 'px "JetBrains Mono", monospace';
      g.fillText('Sample note \u00B7 click anywhere to return', pad2, y);
      var tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
      return { tex: tx, w: cw, h: ch };
    };
    var clearNote = function () { if (!noteMesh) return; scene.remove(noteMesh); noteMesh.material.map.dispose(); noteMesh.material.dispose(); noteMesh.geometry.dispose(); noteMesh = null; noteAlpha = 0; };

    // Focus: tween camera look-at + zoom, scale the object up about its base, then reveal the note.
    var focus = null, tw = null, FOCUS_SCALE = 1.35;
    var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    var startTween = function (toT, toZoom, dur) {
      tw = { t: 0, dur: reduce() ? 0 : dur, fromT: Tl.clone(), toT: toT, fromZ: view.zoom, toZ: toZoom };
      kick();
    };
    // Ends a close-up without moving the camera: the object eases back to size and its note fades.
    var releaseFocus = function () {
      if (!focus) return; focus = null; noteWant = 0;
      cv.style.cursor = hoverKey ? 'pointer' : 'grab'; lastInteract = performance.now(); kick();
    };
    // A manual gesture always wins over a running camera animation; mid-flight close-ups are released.
    var cancelTween = function () { if (!tw) return; tw = null; if (focus && !noteWant) releaseFocus(); };
    var clampT = function () { Tl.x = Math.max(-5.5, Math.min(6.8, Tl.x)); Tl.z = Math.max(-5.5, Math.min(6.8, Tl.z)); Tl.y = Math.max(0.3, Math.min(4.8, Tl.y)); };
    // Zoom by a factor. Zooming in keeps the point under the pointer still; zooming out drifts the target back
    // home so that by zoom 1 the whole room is framed again.
    var zoomBy = function (factor, clientX, clientY) {
      var z1 = view.zoom, z2 = Math.max(ZMIN, Math.min(ZMAX, z1 * factor));
      if (Math.abs(z2 - z1) < 1e-4) return;
      cancelTween();
      if (z2 > z1 && clientX != null) {
        var rc = cv.getBoundingClientRect(), nx = ((clientX - rc.left) / rc.width) * 2 - 1, ny = 1 - ((clientY - rc.top) / rc.height) * 2;
        var hw = (cam.right - cam.left) / 2, hh = (cam.top - cam.bottom) / 2, k = 1 / z1 - 1 / z2;
        world.updateMatrixWorld(); var L = Tl.clone(); world.localToWorld(L);
        L.addScaledVector(RIGHT, nx * hw * k).addScaledVector(UP, ny * hh * k);
        Tl.copy(world.worldToLocal(L));
      } else if (z2 < z1) {
        Tl.lerp(Tl0, z2 <= 1 ? 1 : Math.min(1, (z1 - z2) / (z1 - 1)));
      }
      clampT(); view.zoom = z2;
      if (focus && z2 < 1.12) releaseFocus();
      lastInteract = performance.now(); dropHint(); kick();
    };
    var focusObj = function (k, instant) {
      var h = HOT[k]; if (!h) return;
      var n = NOTES[k];
      lastInteract = performance.now(); vel = 0; pvel = 0;
      if (k === 'plant' && !instant) poke('plant');
      if (focus && focus.key === k && !instant) return;
      clearNote(); noteWant = 0;
      focus = { key: k };
      // bake any idle sway into yaw so nothing jumps, then measure the object at its focused scale
      yaw = world.rotation.y; idleT = 0; world.updateMatrixWorld(true); applyView(); applyFrustum(); var s0 = h.group.scale.x; h.group.scale.setScalar(FOCUS_SCALE); world.updateMatrixWorld(true);
      var bb = new THREE.Box3().setFromObject(h.group), c = bb.getCenter(new THREE.Vector3()), v = new THREE.Vector3(), sx = 0, sy = 0;
      for (var i = 0; i < 8; i++) { v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).sub(c); sx = Math.max(sx, Math.abs(v.dot(RIGHT))); sy = Math.max(sy, Math.abs(v.dot(UP))); }
      h.group.scale.setScalar(s0); world.updateMatrixWorld(true);
      var wide = W >= 620, hwB = (cam.right - cam.left) / 2, hhB = (cam.top - cam.bottom) / 2, cx = (cam.right + cam.left) / 2, cy = (cam.top + cam.bottom) / 2;
      var objNX = wide ? -0.42 : 0, objNY = wide ? 0.02 : 0.4, fracW = wide ? 0.34 : 0.62, fracH = wide ? 0.62 : 0.4;
      if (n.sheet) { objNX = 0; objNY = 0; fracW = 0.6; fracH = 0.66; }
      var zoom = Math.max(1.3, Math.min(4.2, Math.min(hwB * fracW / sx, hhB * fracH / sy)));
      var dx = hwB / zoom, dy = hhB / zoom;
      var L = c.clone().addScaledVector(RIGHT, -(cx + objNX * dx)).addScaledVector(UP, -(cy + objNY * dy));
      if (!n.sheet) {
      // note card: right half on wide stages, lower part on narrow ones
      var pxW = wide ? Math.min(360, W * 0.42) : Math.min(380, W - 28), maxH = wide ? Hh * 0.78 : Hh * 0.44;
      var nd = drawNote(n, pxW, maxH), wpp = (2 * dx) / W;
      var noteNX = wide ? 0.43 : 0, noteNY = wide ? 0 : -0.5;
      var geo = new THREE.PlaneGeometry(nd.w * wpp, nd.h * wpp);
      var m = new THREE.MeshBasicMaterial({ map: nd.tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
      noteMesh = new THREE.Mesh(geo, m); noteMesh.renderOrder = 999;
      noteMesh.position.copy(L).addScaledVector(RIGHT, cx + noteNX * dx).addScaledVector(UP, cy + noteNY * dy).addScaledVector(DIR, 12);
      noteMesh.quaternion.copy(cam.quaternion); scene.add(noteMesh);
      }
      startTween(world.worldToLocal(L.clone()), zoom, instant ? 0 : 750);
      if (instant && tw) tw.dur = 0;
      dropHint();
      cv.style.cursor = 'pointer';
    };
    // Back to room: the one explicit reset (button, Escape, or clicking empty space during a close-up).
    var unfocus = function () {
      focus = null; noteWant = 0;
      startTween(Tl0.clone(), 1, 650);
      cv.style.cursor = hoverKey ? 'pointer' : 'grab';
      lastInteract = performance.now();
    };

    // Gestures. Left drag (or one finger) turns and tilts; right drag or Shift+left drag zooms (up = in);
    // two-finger pinch zooms; Ctrl/⌘+wheel and trackpad pinch zoom in the card, plain wheel zooms in full screen.
    // Only a press-and-release without movement counts as a click.
    var pts = new Map(), pinch = null;
    var pinchState = function () { var a = Array.from(pts.values()); return { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2) {
        if (drag) { try { cv.releasePointerCapture(drag.id); } catch (_) {} drag = null; }
        cancelTween(); var ps = pinchState(); pinch = { last: ps.d };
        pts.forEach(function (_, id) { try { cv.setPointerCapture(id); } catch (_) {} });
        setHover(null); lastInteract = performance.now(); dropHint();
        return;
      }
      if (e.button !== 0 && e.button !== 2) return;
      var mode = e.pointerType === 'mouse' && (e.button === 2 || e.shiftKey) ? 'zoom' : 'orbit';
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, type: e.pointerType, mode: mode, button: e.button };
      if (mode === 'zoom') { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) {} }
      vel = 0; lastInteract = performance.now(); dropHint();
    });
    window.addEventListener('pointermove', function (e) {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch) {
        if (pts.size >= 2 && pts.has(e.pointerId)) { var ps = pinchState(); if (pinch.last > 0) zoomBy(ps.d / pinch.last, ps.x, ps.y); pinch.last = ps.d; }
        return;
      }
      if (drag && e.pointerId === drag.id) {
        var dx = e.clientX - drag.lx, tot = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
        if (!drag.moved && tot > 6) {
          if (drag.mode === 'orbit' && drag.type !== 'mouse' && !modal && Math.abs(e.clientY - drag.y) > Math.abs(e.clientX - drag.x)) { drag = null; return; }
          drag.moved = true; cancelTween();
          if (drag.mode === 'orbit') releaseFocus();
          setHover(null); cv.style.cursor = drag.mode === 'zoom' ? 'ns-resize' : 'grabbing';
          try { cv.setPointerCapture(e.pointerId); } catch (_) {}
        }
        if (drag.moved) {
          if (drag.mode === 'zoom') zoomBy(Math.exp(-(e.clientY - drag.ly) * 0.008), drag.x, drag.y);
          else {
            var d = dx * 0.0065 * (520 / Math.max(320, W));
            yaw = Math.max(YAW_MIN - 0.08, Math.min(YAW_MAX + 0.08, yaw + d)); vel = d;
            var dp = (e.clientY - drag.ly) * 0.006 * (420 / Math.max(300, Hh));
            if (dp) { pitch = Math.max(PITCH_MIN - 0.06, Math.min(PITCH_MAX + 0.04, pitch + dp)); pvel = dp; }
            lastInteract = performance.now(); kick();
          }
        }
        drag.lx = e.clientX; drag.ly = e.clientY;
        return;
      }
      if (e.pointerType === 'mouse' && e.target === cv) setHover(pick(e.clientX, e.clientY));
    }, { passive: true });
    var end = function (e) {
      if (pts.has(e.pointerId)) {
        pts.delete(e.pointerId); try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
        if (pinch) { if (pts.size < 2) pinch = null; lastInteract = performance.now(); kick(); return; }
      }
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
      lastInteract = performance.now();
      if (e.type === 'pointerup' && !d.moved && d.mode === 'orbit' && d.button === 0) {
        var k = pick(e.clientX, e.clientY);
        if (k && k.indexOf('tree') === 0) poke(k);
        else if (k && (!focus || focus.key !== k)) focusObj(k); else if (focus) unfocus();
      }
      cv.style.cursor = focus || hoverKey ? 'pointer' : 'grab';
      kick();
    };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', function () { if (!drag) setHover(null); });
    cv.addEventListener('wheel', function (e) {
      if (!modal && !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomBy(Math.exp(-dy * (e.ctrlKey ? 0.012 : 0.0018)), e.clientX, e.clientY);
    }, { passive: false });

    // Controls: back to room (while focused), full-screen viewer, keyboard toolbar (revealed on focus)
    var chip = 'display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 14px;border:none;border-radius:999px;background:var(--pf-card);color:var(--pf-fg);font-family:var(--pf-sans);font-size:13px;font-weight:500;box-shadow:var(--pf-card-shadow);transition:opacity 180ms ease,transform 140ms ease';
    var backBtn = mk('button', chip + ';position:absolute;z-index:6;left:12px;bottom:12px;display:none;opacity:0', '\u2190 Back to room');
    backBtn.type = 'button'; backBtn.addEventListener('click', function () { unfocus(); });
    stage.appendChild(backBtn);
    var fsBtn = mk('button', chip + ';position:absolute;z-index:6;right:12px;bottom:12px');
    fsBtn.type = 'button'; fsBtn.setAttribute('aria-label', 'Explore Tiny Worlds in full screen');
    fsBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9"/></svg><span>Explore in full screen</span>';
    fsBtn.addEventListener('click', function () { if (modal) closeModal(); else openModal(); });
    stage.appendChild(fsBtn);
    var bar = mk('div', 'position:absolute;z-index:7;left:10px;right:10px;top:10px;display:flex;flex-wrap:wrap;gap:6px;opacity:0;pointer-events:none;transition:opacity 160ms');
    bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Tiny Worlds controls');
    var btn = function (label, aria, fn) { var b = mk('button', chip + ';min-height:32px;padding:0 12px', label); b.type = 'button'; if (aria) b.setAttribute('aria-label', aria); b.addEventListener('click', fn); bar.appendChild(b); return b; };
    btn('\u2190', 'Rotate left', function () { releaseFocus(); { vel = -0.09; lastInteract = performance.now(); kick(); } });
    btn('\u2192', 'Rotate right', function () { releaseFocus(); { vel = 0.09; lastInteract = performance.now(); kick(); } });
    btn('\u2191', 'Tilt to view from above', function () { releaseFocus(); { pvel = 0.05; lastInteract = performance.now(); kick(); } });
    btn('\u2193', 'Tilt to a lower view', function () { releaseFocus(); { pvel = -0.05; lastInteract = performance.now(); kick(); } });
    btn('+', 'Zoom in', function () { zoomBy(1.3); });
    btn('\u2212', 'Zoom out', function () { zoomBy(1 / 1.3); });
    ORDER.forEach(function (k) { btn(LABEL[k], 'Focus on ' + LABEL[k] + ' and read its note', function () { focusObj(k); }); });
    bar.addEventListener('focusin', function () { bar.style.opacity = '1'; bar.style.pointerEvents = 'auto'; dropHint(); });
    bar.addEventListener('focusout', function (e) { if (!bar.contains(e.relatedTarget)) { bar.style.opacity = '0'; bar.style.pointerEvents = 'none'; } });
    stage.appendChild(bar);
    var live = mk('div', 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    var hint = mk('div', 'position:absolute;z-index:5;left:12px;top:12px;padding:6px 10px;border-radius:999px;background:var(--pf-card);color:var(--pf-pg-emerald-title);font-family:var(--pf-mono);font-size:11px;letter-spacing:.04em;box-shadow:var(--pf-card-shadow);pointer-events:none;opacity:0;transition:opacity 400ms ease', 'Drag to turn \u00B7 Pinch or right-drag to zoom \u00B7 Click objects');
    stage.appendChild(hint);
    var hintGone = false;
    function dropHint() { if (!hintGone) { hintGone = true; hint.style.opacity = '0'; } }
    var _focusObj = focusObj; focusObj = function (k, instant) { _focusObj(k, instant); var n = NOTES[k]; if (n && !instant) live.textContent = n.title + '. ' + n.body; };

    // Full-screen viewer: the stage moves into a fixed overlay and back.
    var modal = null, prevScroll = 0, prevOverflow = '';
    function openModal() {
      prevScroll = window.scrollY; prevOverflow = document.documentElement.style.overflow;
      var ov = mk('div', 'position:fixed;inset:0;z-index:1000;background:rgba(17,17,17,0.55);display:flex;align-items:center;justify-content:center;padding:clamp(10px,2.4vw,28px);opacity:0;transition:opacity 220ms ease');
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Tiny Worlds full-screen viewer');
      var panel = mk('div', 'position:relative;width:100%;height:100%;max-width:1600px;border-radius:24px;overflow:hidden;background:var(--pf-pg-emerald-soft);box-shadow:0 24px 80px -20px rgba(0,0,0,0.45)');
      var x = mk('button', 'position:absolute;z-index:8;top:12px;right:12px;width:44px;height:44px;border:none;border-radius:999px;background:var(--pf-card);color:var(--pf-fg);font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:var(--pf-card-shadow)', '\u00D7');
      x.type = 'button'; x.setAttribute('aria-label', 'Close full-screen viewer'); x.addEventListener('click', closeModal);
      ov.addEventListener('pointerdown', function (e) { if (e.target === ov) ov.__down = true; });
      ov.addEventListener('click', function (e) { if (e.target === ov && ov.__down) closeModal(); ov.__down = false; });
      panel.appendChild(stage); panel.appendChild(x); ov.appendChild(panel); document.body.appendChild(ov);
      document.documentElement.style.overflow = 'hidden';
      fsBtn.querySelector('span').textContent = 'Exit full screen'; fsBtn.setAttribute('aria-label', 'Exit full screen');
      fsBtn.style.right = '64px'; fsBtn.style.bottom = '12px';
      modal = { ov: ov, x: x }; cv.style.touchAction = 'none';
      requestAnimationFrame(function () { ov.style.opacity = '1'; x.focus({ preventScroll: true }); });
      visible = true; kick();
    }
    function closeModal() {
      if (!modal) return; var ov = modal.ov; modal = null;
      focus = null; noteWant = 0; clearNote(); Tl.copy(Tl0); view.zoom = 1; hot.forEach(function (h) { h.scale = 1; h.group.scale.setScalar(1); }); tw = null; pinch = null; pts.clear(); backShown = false; backBtn.style.display = 'none'; backBtn.style.opacity = '0';
      box.appendChild(stage); cv.style.touchAction = 'pan-y';
      ov.remove();
      document.documentElement.style.overflow = prevOverflow; window.scrollTo(0, prevScroll);
      fsBtn.querySelector('span').textContent = 'Explore in full screen'; fsBtn.setAttribute('aria-label', 'Explore Tiny Worlds in full screen');
      fsBtn.style.right = '12px';
      fsBtn.focus({ preventScroll: true });
      kick();
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (backShown) { e.preventDefault(); unfocus(); return; }
      if (modal) { e.preventDefault(); closeModal(); }
    });

    // Render loop: runs only while something changes; idle sway is slow and skipped for reduced motion.
    var raf = 0, visible = true, last = performance.now(), t0 = performance.now(), backShown = false;
    function kick() { if (!raf && (visible || modal) && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function frame(now) {
      raf = 0; var dt = Math.min(0.05, (now - last) / 1000); last = now; var busy = false, pch = false;
      if (!drag) {
        if (Math.abs(vel) > 0.0004) { yaw += vel; vel *= Math.pow(0.9, dt * 60); busy = true; } else vel = 0;
        var lim = Math.max(YAW_MIN, Math.min(YAW_MAX, yaw));
        if (Math.abs(lim - yaw) > 0.0005) { yaw += (lim - yaw) * Math.min(1, dt * 9); vel *= 0.6; busy = true; }
        if (Math.abs(pvel) > 0.0004) { pitch += pvel; pvel *= Math.pow(0.88, dt * 60); busy = true; } else pvel = 0;
        var pl = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
        if (Math.abs(pl - pitch) > 0.0005) { pitch += (pl - pitch) * Math.min(1, dt * 9); pvel *= 0.6; busy = true; }
      }
      var idle = !reduce() && !drag && !pinch && !focus && !tw && now - lastInteract > 2600;
      var sway = Math.sin((now - t0) / 5200) * 0.06;
      idleT += ((idle ? 1 : 0) - idleT) * Math.min(1, dt * 1.5);
      if (idle || idleT > 0.002) busy = true;
      var swayNow = sway * idleT;
      if (tw) {
        tw.t = tw.dur ? Math.min(1, tw.t + dt * 1000 / tw.dur) : 1;
        var e = ease(tw.t);
        Tl.lerpVectors(tw.fromT, tw.toT, e); view.zoom = tw.fromZ + (tw.toZ - tw.fromZ) * e;
        busy = true;
        if (tw.t >= 1) { tw = null; if (focus) noteWant = 1; }
      }
      if (updateFX(dt)) busy = true;
      if (themeStep(dt)) busy = true;
      hot.forEach(function (h) {
        var st = focus && focus.key === h.key ? FOCUS_SCALE : 1;
        if (Math.abs(st - h.scale) > 0.001) { h.scale += (st - h.scale) * (reduce() ? 1 : Math.min(1, dt * 7)); busy = true; } else h.scale = st;
        h.group.scale.setScalar(h.scale);
      });
      world.rotation.y = yaw + swayNow;
      applyView(); applyFrustum();
      var away = !!focus || view.zoom > 1.03 || Tl.distanceToSquared(Tl0) > 0.0025;
      if (away !== backShown) {
        backShown = away;
        if (away) { backBtn.style.display = 'inline-flex'; requestAnimationFrame(function () { if (backShown) backBtn.style.opacity = '1'; }); }
        else { backBtn.style.opacity = '0'; setTimeout(function () { if (!backShown) backBtn.style.display = 'none'; }, 200); }
      }
      if (noteMesh) {
        noteAlpha += (noteWant - noteAlpha) * (reduce() ? 1 : Math.min(1, dt * 8));
        if (Math.abs(noteWant - noteAlpha) > 0.003) busy = true; else noteAlpha = noteWant;
        noteMesh.material.opacity = noteAlpha; noteMesh.visible = noteAlpha > 0.01;
        if (!focus && noteAlpha < 0.01) clearNote();
      }
      if (bigSheet) {
        var sWant = focus && focus.key === 'piano' ? noteWant : 0;
        sheetA += (sWant - sheetA) * (reduce() ? 1 : Math.min(1, dt * 6));
        if (Math.abs(sWant - sheetA) > 0.003) busy = true; else sheetA = sWant;
        bigSheet.visible = sheetA > 0.01; bigSheet.material.opacity = sheetA;
        bigSheet.position.y = bigSheet.userData.y0 - (1 - sheetA) * 0.25;
      }
      hot.forEach(function (h) {
        var target = Math.max(h.want, focus && focus.key === h.key ? 1 : 0);
        h.lift += (target - h.lift) * Math.min(1, dt * 12);
        if (Math.abs(target - h.lift) > 0.002) busy = true;
        h.group.position.y = h.baseY + h.lift * 0.12;
        h.mats.forEach(function (m) { var u = m.userData; if (u.ei0 > 0) m.emissiveIntensity = u.ei0 + h.lift * 0.25; else { m.emissive.setHex(0xFFE3EC); m.emissiveIntensity = h.lift * 0.32; } });
      });
      if (idleT > 0.002) trees.forEach(function (g, k) { g.rotation.z = Math.sin((now - t0) / 1900 + k) * 0.025 * idleT; });
      renderer.render(scene, cam);
      if (busy || drag) raf = requestAnimationFrame(frame);
    }
    var vio = new IntersectionObserver(function (ents) { visible = ents.some(function (e) { return e.isIntersecting; }); if (visible) kick(); else if (raf && !modal) { cancelAnimationFrame(raf); raf = 0; } }, { threshold: 0 });
    vio.observe(box);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage); else window.addEventListener('resize', fit);
    fit();
    renderer.compile(scene, cam);
    renderer.render(scene, cam);
    requestAnimationFrame(function () {
      cv.style.opacity = '1'; status.style.opacity = '0';
      Array.prototype.forEach.call(box.children, function (ch) { if (ch !== stage && ch !== status) { ch.style.transition = 'opacity 500ms ease'; ch.style.opacity = '0'; } });
      setTimeout(function () { status.remove(); }, 320);
      setTimeout(function () { if (!hintGone) hint.style.opacity = '1'; }, 500);
      setTimeout(dropHint, 7000);
      kick();
    });
    box.__pfTWApi = { focus: function (k) { focusObj(k); }, back: unfocus, openFull: openModal, closeFull: closeModal };
  }

  window.pfTinyWorld = { mount: mount, notes: NOTES };
})();
