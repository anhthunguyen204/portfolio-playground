/* 🌸 shower: window.pfBlossomBurst(x, y) releases 10–16 blossoms from a viewport point.
   Each blossom has a short soft dispersion, then a long fall with gentle side-to-side sway, slow rotation
   and a fade toward the end. Staggered release so they never move in unison.
   Motion: an outer span carries the path (translate), an inner span carries sway + tilt, so the two
   compose smoothly instead of fighting in one keyframe list.
   One shared fixed overlay (pointer-events:none); each particle removes itself when its animation ends.
   Reduced motion → 4 blossoms that fade in place with a few px of drift. */
(function () {
  var layer = null, live = 0, MAX = 64;
  var getLayer = function () {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:2147483000;contain:strict';
    document.body.appendChild(layer);
    return layer;
  };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  window.pfBlossomBurst = function (x, y) {
    if (!document.body || !Element.prototype.animate) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var n = reduce ? 4 : 10 + Math.floor(Math.random() * 7);
    var L = getLayer();
    var base = Math.random() * Math.PI * 2;
    var vh = window.innerHeight || 800;
    for (var i = 0; i < n && live < MAX; i++) {
      // A third of the blossoms are small (14–19px) for depth; small ones fall slower and fainter.
      var small = Math.random() < 0.34;
      var size = small ? rnd(14, 19) : rnd(19, 30);
      var depth = (size - 14) / 16;
      var outer = document.createElement('span');
      var inner = document.createElement('span');
      inner.textContent = '🌸';
      outer.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;margin:' + (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px;will-change:transform,opacity;opacity:0';
      inner.style.cssText = 'display:block;font-size:' + size.toFixed(1) + 'px;line-height:1;will-change:transform;user-select:none;' +
        'font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      outer.appendChild(inner);
      L.appendChild(outer); live++;

      var dur = reduce ? 700 : rnd(1800, 3000) * (1.08 - depth * 0.16);
      var delay = reduce ? i * 40 : rnd(0, 380) + i * 18;
      var peak = rnd(0.72, 1) * (0.78 + depth * 0.22);
      var anims = [];
      if (reduce) {
        anims.push(outer.animate([
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: 'translate(' + rnd(-4, 4) + 'px,-2px)', opacity: peak, offset: 0.3 },
          { transform: 'translate(' + rnd(-6, 6) + 'px,6px)', opacity: 0 }
        ], { duration: dur, delay: delay, easing: 'ease-out', fill: 'both' }));
      } else {
        // Dispersion: soft outward puff, biased upward and sideways so the fall reads as a shower.
        var ang = base + (i / n) * Math.PI * 2 + rnd(-0.45, 0.45);
        var r = rnd(36, 92);
        var px = Math.cos(ang) * r, py = Math.sin(ang) * r * 0.7 - rnd(10, 26);
        // Fall: long, slow descent with a light breeze drift to one side.
        var breeze = rnd(-1, 1) * rnd(24, 70);
        var fall = Math.min(vh * 0.55, rnd(170, 300) * (0.8 + depth * 0.35));
        var fx = px + breeze, fy = py + fall;
        anims.push(outer.animate([
          { transform: 'translate(0,0)', opacity: 0, easing: 'cubic-bezier(.22,.7,.3,1)' },
          { transform: 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px)', opacity: peak, offset: 0.2, easing: 'cubic-bezier(.45,.05,.55,.95)' },
          { transform: 'translate(' + (px + breeze * 0.45).toFixed(1) + 'px,' + (py + fall * 0.42).toFixed(1) + 'px)', opacity: peak, offset: 0.55, easing: 'cubic-bezier(.4,0,.6,1)' },
          { transform: 'translate(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px)', opacity: 0 }
        ], { duration: dur, delay: delay, fill: 'both' }));
        // Sway + tilt: 2–3 soft pendulum swings, rotation that eases with the swing; slight scale settle.
        var amp = rnd(8, 18) * (0.7 + depth * 0.5);
        var dir = Math.random() < 0.5 ? -1 : 1;
        var rot0 = rnd(-25, 25), tilt = rnd(14, 30), spin = rnd(-70, 70);
        var s0 = rnd(0.55, 0.7), s1 = rnd(0.92, 1.05);
        anims.push(inner.animate([
          { transform: 'translateX(0) rotate(' + rot0 + 'deg) scale(' + s0 + ')' },
          { transform: 'translateX(0) rotate(' + (rot0 + spin * 0.15) + 'deg) scale(' + s1 + ')', offset: 0.2 },
          { transform: 'translateX(' + (dir * amp) + 'px) rotate(' + (rot0 + spin * 0.4 + dir * tilt) + 'deg) scale(' + s1 + ')', offset: 0.42 },
          { transform: 'translateX(' + (-dir * amp * 0.85) + 'px) rotate(' + (rot0 + spin * 0.65 - dir * tilt * 0.8) + 'deg) scale(' + s1 + ')', offset: 0.66 },
          { transform: 'translateX(' + (dir * amp * 0.6) + 'px) rotate(' + (rot0 + spin * 0.88 + dir * tilt * 0.5) + 'deg) scale(' + (s1 * 0.96) + ')', offset: 0.88 },
          { transform: 'translateX(0) rotate(' + (rot0 + spin) + 'deg) scale(' + (s1 * 0.94) + ')' }
        ], { duration: dur, delay: delay, easing: 'cubic-bezier(.37,0,.63,1)', fill: 'both' }));
      }
      (function (node, list) {
        var gone = false;
        var done = function () { if (gone) return; gone = true; if (node.parentNode) node.parentNode.removeChild(node); live--; list.forEach(function (a) { try { a.cancel(); } catch (e) {} }); };
        list[0].onfinish = done; list[0].oncancel = done;
      })(outer, anims);
    }
  };
})();
