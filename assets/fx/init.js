(function () {
  var cs = document.currentScript;
  var BASE = cs && cs.src ? cs.src.replace(/[^\/]*$/, '') : '';
  var loading = {};
  function load(src, cb) {
    if (loading[src]) { loading[src].push(cb); return; }
    loading[src] = [cb];
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    function done(ok) { var q = loading[src]; loading[src] = null; for (var i = 0; i < q.length; i++) q[i](ok); }
    s.onload = function () { done(true); };
    s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }
  function ensure(def, cb) {
    var B = BASE || (window.brandKB && window.brandKB.fxBase) || '';
    function step3() {
      if (window.KBFXFrag && window.KBFXFrag[def.id]) return cb(true);
      load(B + 'effects/' + def.id + '.js', function (ok) { cb(ok && !!(window.KBFXFrag && window.KBFXFrag[def.id])); });
    }
    function step2() {
      if (def.needsNoise && !(window.KBFXCore && window.KBFXCore.noise)) {
        load(B + 'noise.js', function (ok) { ok ? step3() : cb(false); });
      } else step3();
    }
    if (window.KBFXCore) step2();
    else load(B + 'core.js', function (ok) { ok ? step2() : cb(false); });
  }
  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }
  function build(def, P) {
    var C = window.KBFXCore, u = {}, sz = def.sizing || {};
    var m = def.map || [];
    for (var i = 0; i < m.length; i++) {
      var un = m[i][0], kind = m[i][1], k = m[i][2], v = P[k];
      if (kind === 'colors') {
        var arr = [];
        for (var j = 0; j < (v || []).length; j++) arr.push(C.color(v[j]));
        u[un] = arr;
        u.u_colorsCount = arr.length;
      } else if (kind === 'color') {
        u[un] = C.color(v);
      } else if (kind.indexOf('enum:') === 0) {
        u[un] = C.enums[kind.slice(5)][v];
      } else if (kind === 'noise') {
        u[un] = C.noise();
      } else {
        u[un] = typeof v === 'boolean' ? v : num(v, 0);
      }
    }
    u.u_fit = C.fit[sz.fit || 'contain'];
    u.u_scale = num(P.scale, sz.scale);
    u.u_rotation = num(P.rotation, sz.rotation);
    u.u_offsetX = num(sz.offsetX, 0);
    u.u_offsetY = num(sz.offsetY, 0);
    u.u_originX = num(sz.originX, 0.5);
    u.u_originY = num(sz.originY, 0.5);
    u.u_worldWidth = num(sz.worldWidth, 0);
    u.u_worldHeight = num(sz.worldHeight, 0);
    return u;
  }
  function speedOf(def, P) {
    if (!def.animated) return 0;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    return num(P.speed, 1);
  }
  function mount(el, def, P) {
    var C = window.KBFXCore, frag = window.KBFXFrag && window.KBFXFrag[def.id];
    if (!C || !frag || !el) return null;
    try {
      var m = new C.ShaderMount(el, frag, build(def, P), undefined, speedOf(def, P), 0, 1, 1920 * 1080 * 1.5);
      return { m: m, def: def };
    } catch (e) { return null; }
  }
  function update(h, P) {
    if (!h || !h.m) return;
    try { h.m.setUniforms(build(h.def, P)); h.m.setSpeed(speedOf(h.def, P)); } catch (e) {}
  }
  function dispose(h) { try { if (h && h.m) h.m.dispose(); } catch (e) {} }
  window.KBFX = { base: BASE, ensure: ensure, mount: mount, update: update, dispose: dispose };

  function auto() {
    var els = document.querySelectorAll('[data-fxdef]');
    Array.prototype.forEach.call(els, function (el) {
      var cfg; try { cfg = JSON.parse(el.getAttribute('data-fxdef')); } catch (e) { return; }
      ensure(cfg, function (ok) { if (ok) mount(el, cfg, cfg.all || {}); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
