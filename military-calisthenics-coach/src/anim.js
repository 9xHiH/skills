/* MCAnim — original 2D articulated-figure animation engine (no external assets).
 * Coordinate system: SVG viewBox 0 0 240 160, y grows downward, floor at y=150.
 * Angles are in degrees with the mathematical convention: 0 = pointing right, 90 = pointing up.
 * A pose:
 *   h : [x,y]  hip-centre position
 *   t : torso angle (hip -> neck). 90 = upright.
 *   n : head offset relative to torso (deg), default 0
 *   a : [armNear, armFar]   each either [upperArmAngle, forearmAngle] (forward kinematics)
 *                           or {p:[x,y], b:+1|-1} (two-bone inverse kinematics, wrist target, bend side)
 *   l : [legNear, legFar]   same, for thigh/shin; IK target is the ankle
 *   f : [footNear, footFar] absolute foot angles (ankle -> toes), default 0 (side) / 180,0 (front)
 *   k : optional [torso, armNear, armFar, legNear, legFar] length multipliers to depict foreshortening (segments pointing toward/away from the viewer)
 * Exercise animation spec: {view:'side'|'front', top:bool (seen from above: no floor line, no floor checks), props:[...], keys:[{p:pose, d:ms, lab:'..'}], hang:bool, air:[keyIdx]}
 */
(function (root) {
  'use strict';
  var L = { torso: 46, neck: 12, head: 9, ua: 25, fa: 23, th: 34, sh: 32, ft: 11, shoulderDrop: 4, shW: 11, hipW: 7 };
  var FLOOR = 150;
  var R = Math.PI / 180;
  function dir(a) { return [Math.cos(a * R), -Math.sin(a * R)]; }
  function add(p, d, len) { return [p[0] + d[0] * len, p[1] + d[1] * len]; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  function ik(rootP, target, a, b, bend) {
    var dx = target[0] - rootP[0], dy = target[1] - rootP[1];
    var d = Math.sqrt(dx * dx + dy * dy);
    var dc = Math.max(Math.abs(a - b) + 0.01, Math.min(a + b - 0.01, d));
    var th = Math.atan2(dy, dx);
    var cosA = (a * a + dc * dc - b * b) / (2 * a * dc);
    var al = Math.acos(Math.max(-1, Math.min(1, cosA)));
    var ang = th + (bend >= 0 ? -al : al);
    var j = [rootP[0] + a * Math.cos(ang), rootP[1] + a * Math.sin(ang)];
    var ex = target[0] - j[0], ey = target[1] - j[1], el = Math.sqrt(ex * ex + ey * ey) || 1;
    var end = [j[0] + ex / el * b, j[1] + ey / el * b];
    var err = Math.sqrt(Math.pow(end[0] - target[0], 2) + Math.pow(end[1] - target[1], 2));
    return { j: j, e: end, err: err };
  }

  function limb(rootP, spec, a, b) {
    if (Array.isArray(spec)) {
      var j = add(rootP, dir(spec[0]), a);
      return { j: j, e: add(j, dir(spec[1]), b), err: 0 };
    }
    return ik(rootP, spec.p, a, b, spec.b == null ? 1 : spec.b);
  }

  /* Forward kinematics: returns joint positions and IK reach errors. */
  function solve(p, view) {
    var front = view === 'front';
    var k = p.k || [1, 1, 1, 1, 1]; /* foreshortening: [torso, armNear, armFar, legNear, legFar] length multipliers (0.3–1) */
    var hip = p.h, td = dir(p.t);
    var neck = add(hip, td, L.torso * k[0]);
    var hd = dir(p.t + (p.n || 0));
    var head = add(neck, hd, L.neck);
    var sh = add(neck, td, -L.shoulderDrop);
    var perp = [-td[1], td[0]]; // perpendicular (screen) to torso
    var shN = front ? add(sh, perp, -L.shW) : sh, shF = front ? add(sh, perp, L.shW) : sh;
    var hpN = front ? add(hip, perp, -L.hipW) : hip, hpF = front ? add(hip, perp, L.hipW) : hip;
    var a = p.a || [[-90, -90], [-90, -90]], l = p.l || [[-90, -90], [-90, -90]];
    var aN = limb(shN, a[0], L.ua * k[1], L.fa * k[1]), aF = limb(shF, a[1], L.ua * k[2], L.fa * k[2]);
    var lN = limb(hpN, l[0], L.th * k[3], L.sh * k[3]), lF = limb(hpF, l[1], L.th * k[4], L.sh * k[4]);
    var fdef = front ? [180, 0] : [0, 0];
    var f = p.f || fdef;
    var toeN = add(lN.e, dir(f[0] == null ? fdef[0] : f[0]), front ? 6 : L.ft);
    var toeF = add(lF.e, dir(f[1] == null ? fdef[1] : f[1]), front ? 6 : L.ft);
    return {
      hip: hip, neck: neck, head: head, sh: sh, shN: shN, shF: shF, hpN: hpN, hpF: hpF,
      elN: aN.j, wrN: aN.e, elF: aF.j, wrF: aF.e, knN: lN.j, anN: lN.e, knF: lF.j, anF: lF.e, toeN: toeN, toeF: toeF,
      err: Math.max(aN.err, aF.err, lN.err, lF.err)
    };
  }

  function lerpLimb(x, y, k) {
    if (Array.isArray(x) && Array.isArray(y)) return [lerp(x[0], y[0], k), lerp(x[1], y[1], k)];
    if (!Array.isArray(x) && !Array.isArray(y)) return { p: [lerp(x.p[0], y.p[0], k), lerp(x.p[1], y.p[1], k)], b: x.b };
    return k < 0.5 ? x : y; // mixed modes are rejected by the validator
  }
  function lerpPose(A, B, k) {
    var o = { h: [lerp(A.h[0], B.h[0], k), lerp(A.h[1], B.h[1], k)], t: lerp(A.t, B.t, k), n: lerp(A.n || 0, B.n || 0, k) };
    var da = [[-90, -90], [-90, -90]];
    o.a = [lerpLimb((A.a || da)[0], (B.a || da)[0], k), lerpLimb((A.a || da)[1], (B.a || da)[1], k)];
    o.l = [lerpLimb((A.l || da)[0], (B.l || da)[0], k), lerpLimb((A.l || da)[1], (B.l || da)[1], k)];
    if (A.k || B.k) { var ka = A.k || [1, 1, 1, 1, 1], kb = B.k || [1, 1, 1, 1, 1]; o.k = ka.map(function (v, i) { return lerp(v, kb[i], k); }); }
    if (A.f || B.f) { var fa = A.f || [0, 0], fb = B.f || [0, 0]; o.f = [lerp(fa[0], fb[0], k), lerp(fa[1], fb[1], k)]; }
    return o;
  }

  function cycleLength(spec) { return spec.keys.reduce(function (s, k) { return s + (k.d || 1000); }, 0); }
  /* pose at time ms (looping). Returns {pose, idx, label} */
  function poseAt(spec, ms) {
    var total = cycleLength(spec), t = ((ms % total) + total) % total, keys = spec.keys;
    for (var i = 0; i < keys.length; i++) {
      var d = keys[i].d || 1000;
      if (t <= d) {
        var hold = keys[i].hold || 0; // ms held at the key before moving
        var k = t <= hold ? 0 : ease((t - hold) / Math.max(1, d - hold));
        return { pose: lerpPose(keys[i].p, keys[(i + 1) % keys.length].p, k), idx: i, label: keys[i].lab || '' };
      }
      t -= d;
    }
    return { pose: keys[0].p, idx: 0, label: keys[0].lab || '' };
  }

  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pts(arr) { return arr.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }

  function drawProps(g, props) {
    (props || []).forEach(function (pr) {
      var c = { 'class': 'mc-prop' };
      switch (pr.k) {
        case 'wall': el('rect', { x: pr.x, y: 14, width: 7, height: FLOOR - 14, 'class': 'mc-prop-fill' }, g); break;
        case 'box': el('rect', { x: pr.x, y: FLOOR - pr.h, width: pr.w, height: pr.h, rx: 2, 'class': 'mc-prop-fill' }, g); break;
        case 'chair':
          el('rect', { x: pr.x, y: FLOOR - pr.h, width: pr.w, height: 4, 'class': 'mc-prop-fill' }, g);
          el('line', { x1: pr.x + 3, y1: FLOOR - pr.h, x2: pr.x + 3, y2: FLOOR, 'class': 'mc-prop' }, g);
          el('line', { x1: pr.x + pr.w - 3, y1: FLOOR - pr.h, x2: pr.x + pr.w - 3, y2: FLOOR, 'class': 'mc-prop' }, g);
          if (pr.back) { var bx = pr.back === 'l' ? pr.x + 2 : pr.x + pr.w - 2; el('line', { x1: bx, y1: FLOOR - pr.h, x2: bx, y2: FLOOR - pr.h - 34, 'class': 'mc-prop' }, g); }
          break;
        case 'table':
          el('rect', { x: pr.x, y: FLOOR - pr.h, width: pr.w, height: 5, 'class': 'mc-prop-fill' }, g);
          el('line', { x1: pr.x + 4, y1: FLOOR - pr.h, x2: pr.x + 4, y2: FLOOR, 'class': 'mc-prop' }, g);
          el('line', { x1: pr.x + pr.w - 4, y1: FLOOR - pr.h, x2: pr.x + pr.w - 4, y2: FLOOR, 'class': 'mc-prop' }, g);
          break;
        case 'bar':
          el('line', { x1: pr.x1, y1: pr.y, x2: pr.x2, y2: pr.y, 'class': 'mc-prop', 'stroke-width': 4 }, g);
          el('line', { x1: pr.x1, y1: pr.y, x2: pr.x1, y2: pr.post === false ? pr.y : FLOOR, 'class': 'mc-prop mc-post' }, g);
          el('line', { x1: pr.x2, y1: pr.y, x2: pr.x2, y2: pr.post === false ? pr.y : FLOOR, 'class': 'mc-prop mc-post' }, g);
          break;
        case 'barx': /* bar seen end-on (side view of a pull-up bar) */
          el('line', { x1: pr.x, y1: 2, x2: pr.x, y2: pr.y, 'class': 'mc-prop mc-post' }, g);
          el('circle', { cx: pr.x, cy: pr.y, r: 3.5, 'class': 'mc-prop-fill' }, g); break;
        case 'hands': /* inset: top view of hand placement relative to shoulders (r = hand width / shoulder width) */
          var gx = 6, gy = 6, cx = gx + 30;
          el('rect', { x: gx, y: gy, width: 60, height: 44, rx: 6, 'class': 'mc-inset' }, g);
          el('circle', { cx: cx, cy: gy + 9, r: 4.5, 'class': 'mc-inset-body' }, g);
          el('rect', { x: cx - 8, y: gy + 15, width: 16, height: 24, rx: 4, 'class': 'mc-inset-body' }, g);
          el('line', { x1: cx - 12, y1: gy + 17, x2: cx + 12, y2: gy + 17, 'class': 'mc-inset-sh' }, g);
          [-1, 1].forEach(function (sgn) { var hx = cx + sgn * 12 * pr.r; el('rect', { x: hx - 3, y: gy + 18, width: 6, height: 9, rx: 2, 'class': 'mc-inset-hand' }, g); el('line', { x1: cx + sgn * 12, y1: gy + 17, x2: hx, y2: gy + 22, 'class': 'mc-inset-sh' }, g); });
          break;
        case 'bench': /* flat or inclined bench pad on legs; incline: {deg} */
          el('rect', { x: pr.x, y: FLOOR - pr.h, width: pr.w, height: 6, rx: 2, 'class': 'mc-prop-fill', transform: pr.deg ? 'rotate(' + (-pr.deg) + ' ' + (pr.x + pr.w) + ' ' + (FLOOR - pr.h) + ')' : '' }, g);
          el('line', { x1: pr.x + 6, y1: FLOOR - pr.h + 6, x2: pr.x + 6, y2: FLOOR, 'class': 'mc-prop' }, g);
          el('line', { x1: pr.x + pr.w - 6, y1: FLOOR - pr.h + 6, x2: pr.x + pr.w - 6, y2: FLOOR, 'class': 'mc-prop' }, g); break;
        case 'rack': el('line', { x1: pr.x, y1: pr.y || 40, x2: pr.x, y2: FLOOR, 'class': 'mc-prop' }, g); el('line', { x1: pr.x - 6, y1: pr.hook || 60, x2: pr.x + 6, y2: pr.hook || 60, 'class': 'mc-prop' }, g); break;
        case 'mat': el('rect', { x: pr.x1, y: FLOOR - 2, width: pr.x2 - pr.x1, height: 3, rx: 1, 'class': 'mc-mat' }, g); break;
        case 'step': el('rect', { x: pr.x, y: FLOOR - pr.h, width: pr.w, height: pr.h, rx: 1, 'class': 'mc-prop-fill' }, g); break;
        default: break;
      }
    });
  }

  /* Build an animated figure inside container. Returns controller. */
  function Figure(container, spec, opts) {
    opts = opts || {};
    this.spec = spec; this.t = opts.t || 0; this.speed = 1; this.playing = !!opts.autoplay;
    this.onLabel = opts.onLabel || null;
    var svg = el('svg', { viewBox: '0 0 240 160', role: 'img', 'class': 'mc-fig' + (spec.mirror ? ' mc-mirror' : '') });
    if (opts.title) { var ti = el('title', {}, svg); ti.textContent = opts.title; }
    var floor = spec.top || (spec.hang && spec.floor === false) ? null : el('line', { x1: 4, y1: FLOOR + 1.5, x2: 236, y2: FLOOR + 1.5, 'class': 'mc-floor' }, svg);
    drawProps(el('g', {}, svg), spec.props);
    this.ghost = el('g', { 'class': 'mc-ghost' }, svg);
    this.trace = el('path', { 'class': 'mc-trace', d: '' }, svg);
    var g = el('g', { 'class': 'mc-body' }, svg);
    var far = el('g', { 'class': spec.view === 'front' ? 'mc-near' : 'mc-far' }, g);
    this.p = {
      aF: el('polyline', {}, far), lF: el('polyline', {}, far), fF: el('line', {}, far),
      towel: el('line', { 'class': 'mc-towel' }, g),
      torso: el('line', { 'class': 'mc-torso' }, g), neck: el('line', { 'class': 'mc-neck' }, g),
      head: el('circle', { r: L.head, 'class': 'mc-head' }, g)
    };
    var near = el('g', { 'class': 'mc-near' }, g);
    this.p.lN = el('polyline', {}, near); this.p.fN = el('line', {}, near); this.p.aN = el('polyline', {}, near);
    /* gym equipment attached to joints: dumbbell 'db', kettlebell 'kb', barbell end-on 'bb', barbell seen from the front 'bbline', cable 'cable' */
    this.att = (spec.props || []).filter(function (q) { return q.at; }).map(function (q) {
      var gg = el('g', { 'class': 'mc-load' }, svg), o = { q: q, g: gg, e: [] };
      var ats = q.at === 'both' ? ['wrN', 'wrF'] : [q.at];
      if (q.k === 'cable') { o.e.push(el('line', { 'class': 'mc-cable' }, gg)); el('circle', { cx: q.to[0], cy: q.to[1], r: 4, 'class': 'mc-prop-fill' }, gg); el('rect', { x: q.to[0] - 5, y: q.to[1], width: 10, height: 150 - q.to[1], 'class': 'mc-stack' }, gg); }
      else if (q.k === 'bbline') { o.e.push(el('line', { 'class': 'mc-bar' }, gg)); o.e.push(el('rect', { width: 5, height: 22, rx: 1.5, 'class': 'mc-plate' }, gg)); o.e.push(el('rect', { width: 5, height: 22, rx: 1.5, 'class': 'mc-plate' }, gg)); }
      else ats.forEach(function () {
        if (q.k === 'bb') o.e.push(el('circle', { r: q.r || 10, 'class': 'mc-plate' }, gg));
        else if (q.k === 'kb') o.e.push(el('circle', { r: 6, 'class': 'mc-plate' }, gg));
        else o.e.push(el('rect', { width: 12, height: 6, rx: 2, 'class': 'mc-plate' }, gg));
      });
      o.ats = ats; return o;
    });
    this.svg = svg; container.appendChild(svg);
    if (opts.ghost !== false) this.drawGhost(opts.traceJoint);
    this.render();
  }
  Figure.prototype.drawGhost = function (traceJoint) {
    var s = solve(this.spec.keys[0].p, this.spec.view), gg = this.ghost;
    while (gg.firstChild) gg.removeChild(gg.firstChild);
    [[s.shN, s.elN, s.wrN], [s.shF, s.elF, s.wrF], [s.hpN, s.knN, s.anN, s.toeN], [s.hpF, s.knF, s.anF, s.toeF], [s.hip, s.neck]].forEach(function (a) { el('polyline', { points: pts(a) }, gg); });
    el('circle', { cx: s.head[0], cy: s.head[1], r: L.head }, gg);
    var j = traceJoint || this.spec.trace;
    if (j) {
      var d = [], total = cycleLength(this.spec);
      for (var i = 0; i <= 40; i++) { var q = solve(poseAt(this.spec, total * i / 40).pose, this.spec.view)[j]; d.push((i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)); }
      this.trace.setAttribute('d', d.join(''));
    }
  };
  Figure.prototype.render = function () {
    var r = poseAt(this.spec, this.t), s = solve(r.pose, this.spec.view), p = this.p;
    p.aN.setAttribute('points', pts([s.shN, s.elN, s.wrN]));
    p.aF.setAttribute('points', pts([s.shF, s.elF, s.wrF]));
    p.lN.setAttribute('points', pts([s.hpN, s.knN, s.anN]));
    p.lF.setAttribute('points', pts([s.hpF, s.knF, s.anF]));
    [['fN', s.anN, s.toeN], ['fF', s.anF, s.toeF]].forEach(function (x) { p[x[0]].setAttribute('x1', x[1][0]); p[x[0]].setAttribute('y1', x[1][1]); p[x[0]].setAttribute('x2', x[2][0]); p[x[0]].setAttribute('y2', x[2][1]); });
    var tw = (this.spec.props || []).filter(function (q) { return q.k === 'towel'; })[0];
    if (tw) { var to = tw.to || s.wrF; p.towel.setAttribute('x1', s.wrN[0]); p.towel.setAttribute('y1', s.wrN[1]); p.towel.setAttribute('x2', to[0]); p.towel.setAttribute('y2', to[1]); }
    p.torso.setAttribute('x1', s.hip[0]); p.torso.setAttribute('y1', s.hip[1]); p.torso.setAttribute('x2', s.neck[0]); p.torso.setAttribute('y2', s.neck[1]);
    var hb = add(s.neck, dir(this.spec.keys[0].p.t), 0);
    p.neck.setAttribute('x1', hb[0]); p.neck.setAttribute('y1', hb[1]); p.neck.setAttribute('x2', s.head[0]); p.neck.setAttribute('y2', s.head[1]);
    p.head.setAttribute('cx', s.head[0]); p.head.setAttribute('cy', s.head[1]);
    this.att.forEach(function (o) {
      var q = o.q, off = q.off || [0, 0];
      if (q.k === 'cable') { var w = s[q.at]; o.e[0].setAttribute('x1', w[0]); o.e[0].setAttribute('y1', w[1]); o.e[0].setAttribute('x2', q.to[0]); o.e[0].setAttribute('y2', q.to[1]); return; }
      if (q.k === 'bbline') { var a = s.wrN, c = s.wrF, ext = q.ext || 22, dx = c[0] - a[0], dy = c[1] - a[1], ln = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / ln, uy = dy / ln;
        var p1 = [a[0] - ux * ext, a[1] - uy * ext], p2 = [c[0] + ux * ext, c[1] + uy * ext];
        o.e[0].setAttribute('x1', p1[0]); o.e[0].setAttribute('y1', p1[1]); o.e[0].setAttribute('x2', p2[0]); o.e[0].setAttribute('y2', p2[1]);
        [[o.e[1], p1, 1], [o.e[2], p2, -1]].forEach(function (z) { z[0].setAttribute('x', z[1][0] + ux * 4 * z[2] - 2.5); z[0].setAttribute('y', z[1][1] - 11); }); return; }
      o.ats.forEach(function (j, i) { var pt = s[j] || s.wrN, e = o.e[i], x = pt[0] + off[0], y = pt[1] + off[1];
        if (q.k === 'bb' || q.k === 'kb') { e.setAttribute('cx', x); e.setAttribute('cy', y + (q.k === 'kb' ? 6 : 0)); } else { e.setAttribute('x', x - 6); e.setAttribute('y', y - 3); } });
    });
    if (this.onLabel && r.idx !== this._idx) { this._idx = r.idx; this.onLabel(r.label, r.idx); }
  };
  Figure.prototype.tick = function (dt) { if (this.playing) { this.t += dt * this.speed; this.render(); } };
  Figure.prototype.seekFraction = function (f) { this.t = cycleLength(this.spec) * f; this.render(); };
  Figure.prototype.fraction = function () { var c = cycleLength(this.spec); return ((this.t % c) + c) % c / c; };
  Figure.prototype.seekKey = function (i) { var t = 0; for (var k = 0; k < i; k++) t += this.spec.keys[k].d || 1000; this.t = t + (this.spec.keys[i].hold || 0) * 0.5; this.render(); };

  /* Shared animation loop: only figures in the registry and visible are advanced. */
  var registry = new Set(), last = 0, running = false;
  function loop(ts) {
    var dt = last ? Math.min(64, ts - last) : 16; last = ts;
    registry.forEach(function (f) { if (!f.svg.isConnected) { registry.delete(f); return; } f.tick(dt); });
    if (registry.size) requestAnimationFrame(loop); else { running = false; last = 0; }
  }
  function track(f) { registry.add(f); if (!running) { running = true; requestAnimationFrame(loop); } }

  /* Static SVG markup (string) of a key pose, used for print & thumbnails. */
  function staticSVG(spec, keyIdx, cls) {
    var tmp = document.createElement('div');
    var f = new Figure(tmp, spec, { ghost: keyIdx !== 0, traceJoint: spec.trace });
    f.seekKey(keyIdx);
    f.svg.setAttribute('class', 'mc-fig ' + (cls || '')); f.svg.removeAttribute('role'); f.svg.setAttribute('aria-hidden', 'true'); /* static copies are decorative: the surrounding control/card carries the name */
    return tmp.innerHTML;
  }

  /* Validation used by the build/test tools. */
  function validate(spec) {
    var issues = [];
    if (!spec || !Array.isArray(spec.keys) || spec.keys.length < 2) return ['animation needs at least 2 key poses'];
    var total = cycleLength(spec);
    for (var i = 0; i <= 60; i++) {
      var r = poseAt(spec, total * i / 60), s = solve(r.pose, spec.view);
      if (s.err > 2.5) issues.push('IK reach error ' + s.err.toFixed(1) + 'px at ' + (i / 60).toFixed(2));
      var ys = [s.head[1] + L.head, s.hip[1], s.neck[1], s.elN[1], s.wrN[1], s.elF[1], s.wrF[1], s.knN[1], s.anN[1], s.knF[1], s.anF[1], s.toeN[1], s.toeF[1]];
      var low = Math.max.apply(null, ys);
      if (!spec.top && spec.floor !== false && low > FLOOR + 3) issues.push('body below floor by ' + (low - FLOOR).toFixed(1) + 'px at ' + (i / 60).toFixed(2));
      var nxt = (r.idx + 1) % spec.keys.length;
      var inAir = spec.hang || spec.top || (spec.air && (spec.air.indexOf(r.idx) >= 0 || spec.air.indexOf(nxt) >= 0));
      var support = (spec.props || []).some(function (p) { return ['box', 'chair', 'table', 'step'].indexOf(p.k) >= 0; });
      if (!inAir && !support && low < FLOOR - 4) issues.push('figure floating ' + (FLOOR - low).toFixed(1) + 'px at ' + (i / 60).toFixed(2));
    }
    spec.keys.forEach(function (k, i) {
      if (k.p.k && (k.p.k.length !== 5 || k.p.k.some(function (v) { return !(v >= 0.3 && v <= 1); }))) issues.push('key ' + i + ' k multipliers must be 5 values in [0.3,1]');
      var nx = spec.keys[(i + 1) % spec.keys.length].p;
      ['a', 'l'].forEach(function (g) { [0, 1].forEach(function (j) { var x = (k.p[g] || [[0]])[j], y = (nx[g] || [[0]])[j]; if (Array.isArray(x) !== Array.isArray(y)) issues.push('key ' + i + ' ' + g + j + ' mixes IK and angle modes'); }); });
    });
    return Array.from(new Set(issues)).slice(0, 6);
  }

  root.MCAnim = { Figure: Figure, track: track, solve: solve, poseAt: poseAt, staticSVG: staticSVG, validate: validate, FLOOR: FLOOR, L: L, cycleLength: cycleLength };
})(typeof window !== 'undefined' ? window : globalThis);
