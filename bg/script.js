/* ==========================================================================
   ICEPOINT // HUMAN LIMIT FACILITY
   script.js

   Design constraints
   ------------------
   · ONE rAF loop drives everything. No setInterval for animation.
   · Canvas runs at ~20fps for the grain layer; it is the only JS painting.
   · DOM writes are throttled and skip identical values (no layout churn).
   · Every timer/listener is registered once; nothing is added per-frame,
     so there is no leak path over a multi-hour session.
   · All tunables live in config.js. URL params override a subset.
   ========================================================================== */

(function () {
  'use strict';

  /* ── config ────────────────────────────────────────────────────────── */

  var C = window.CONFIG;
  var params = new URLSearchParams(location.search);

  if (params.has('name'))          C.streamerName   = params.get('name');
  if (params.has('facility'))       C.facilityName   = params.get('facility');
  if (params.has('subject'))        C.subjectId      = params.get('subject');
  if (params.has('temp'))           C.temperature    = parseFloat(params.get('temp')) || C.temperature;
  if (params.has('intensity'))      C.animationIntensity = parseFloat(params.get('intensity'));
  if (params.has('mode'))           C.mode           = params.get('mode');

  var MODE = { calm: 0.28, standard: 1, extreme: 1.9 };
  var motion = C.animationIntensity * (MODE[C.mode] !== undefined ? MODE[C.mode] : 1);

  // guard against absurd values from the URL
  motion = Math.max(0, Math.min(3, isFinite(motion) ? motion : 0.6));

  document.documentElement.style.setProperty('--motion', motion || 0.0001);
  if (motion === 0) document.body.classList.add('still');

  /* ── helpers ───────────────────────────────────────────────────────── */

  function $(id) { return document.getElementById(id); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function irnd(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* writes a value only when it actually changed — keeps the compositor idle */
  function setText(el, val) {
    if (el && el.textContent !== val) el.textContent = val;
  }
  function setStyle(el, prop, val) {
    if (el && el.__last !== val) { el.style[prop] = val; el.__last = val; }
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /* ── live state ────────────────────────────────────────────────────── */

  var state = {
    temp: C.temperature,
    chill: C.windChill,
    load: C.systemLoad,
    sanity: C.sanity,
    core: C.coreStatus,
    biometrics: Object.assign({}, C.biometrics),
    // per-biometric drift direction so bars breathe instead of jittering
    drift: { THERMAL_RESISTANCE: 1, MENTAL_STABILITY: -1, PAIN_TOLERANCE: 1, COMMON_SENSE: -1 },
    sessionStart: Date.now(),
    lastTempTick: 0,
    lastBioTick: 0,
    lastCoreFlip: 0,
    lastLog: 0,
    lastAnom: 0,
    lastWarn: 0,
    lastBrand: 0,
    nextBrandAt: 0,
    nextLogAt: 0,
    nextAnomAt: 0,
    eggsFired: {}
  };

  /* ══════════════════════════════════════════════════════════════════
     1. STATIC BINDING — push config into the DOM once
     ══════════════════════════════════════════════════════════════════ */

  function bindStatic() {
    // every [data-cfg] element gets its config value
    var tagged = document.querySelectorAll('[data-cfg]');
    for (var i = 0; i < tagged.length; i++) {
      var el = tagged[i];
      var key = el.getAttribute('data-cfg');
      if (C[key] !== undefined && C[key] !== null) el.textContent = C[key];
    }

    // telemetry seeds
    setText($('v-temp'), C.temperature.toFixed(1));
    setText($('v-chill'), C.windChill.toFixed(1));
    setText($('v-core'), C.coreStatus);
    setText($('v-load'), String(C.systemLoad));
    setText($('v-san'), String(C.sanity));
    setStyle($('m-load'), 'width', C.systemLoad + '%');
    setStyle($('m-san'), 'width', C.sanity + '%');
  }

  /* ══════════════════════════════════════════════════════════════════
     1b. CHAMBER FILLER — instrument text through the middle band
     Built once. These nodes never change; the CSS handles the rest.
     ══════════════════════════════════════════════════════════════════ */

  function buildChamber() {
    var d = C.chamberData;
    if (!d) return;

    // left rail
    var left = $('ch-left');
    if (left && d.leftRail) {
      d.leftRail.forEach(function (pair) {
        var row = document.createElement('div');
        row.className = 'row';
        var k = document.createElement('span'); k.className = 'k'; k.textContent = pair[0];
        var v = document.createElement('span'); v.className = 'v'; v.textContent = pair[1];
        row.appendChild(k); row.appendChild(v);
        left.appendChild(row);
      });
    }

    // right rail, reversed
    var right = $('ch-right');
    if (right && d.leftRail) {
      d.leftRail.forEach(function (pair) {
        var row = document.createElement('div');
        row.className = 'row';
        var v = document.createElement('span'); v.className = 'v'; v.textContent = pair[1];
        var k = document.createElement('span'); k.className = 'k'; k.textContent = pair[0];
        row.appendChild(v); row.appendChild(k);
        right.appendChild(row);
      });
    }

    // channel bank
    var ch = $('ch-channels');
    if (ch && d.channels) {
      d.channels.forEach(function (pair) {
        var row = document.createElement('div');
        row.className = 'ch-row';
        var k = document.createElement('span'); k.className = 'k'; k.textContent = pair[0];
        var bar = document.createElement('span'); bar.className = 'bar';
        var fill = document.createElement('i');
        fill.style.width = pair[1] + '%';
        bar.appendChild(fill);
        var n = document.createElement('span'); n.className = 'n'; n.textContent = pair[1];
        row.appendChild(k); row.appendChild(bar); row.appendChild(n);
        ch.appendChild(row);
      });
    }

    // traces + stamps are positioned purely by CSS nth-child
    var tr = $('ch-traces');
    if (tr && d.traces) {
      d.traces.forEach(function (t) {
        var s = document.createElement('span');
        s.textContent = t;
        tr.appendChild(s);
      });
    }

    var st = $('ch-stamps');
    if (st && d.stamps) {
      d.stamps.forEach(function (t) {
        var s = document.createElement('span');
        s.textContent = t;
        st.appendChild(s);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     1c. ROTATING BRAND LINES
     Two random lines in the identity plate, re-rolled on a slow cycle.
     Never shows the same pair twice in a row.
     ══════════════════════════════════════════════════════════════════ */

  var brandPair = null;

  function pickBrand() {
    var pool = C.streamerLines;
    if (!pool || !pool.length) return null;
    var next;
    do { next = pick(pool); } while (brandPair && next === brandPair);
    return next;
  }

  function writeBrand(pair) {
    brandPair = pair;
    if (!pair) return;
    setText($('brand-a'), pair[0]);
    setText($('brand-b'), pair[1]);
    setText($('subj-alt'), pair[0]);
  }

  function tickBrand(now) {
    if (now < state.nextBrandAt) return;
    var r = C.streamerLineSwapMs;
    var base = r[0] + Math.random() * (r[1] - r[0]);
    state.nextBrandAt = now + clamp(base / (0.6 + motion * 0.6), 8000, 70000);

    var next = pickBrand();
    if (!next) return;

    // fade out, swap text, fade back in
    var nodes = [$('brand-a'), $('brand-b'), $('subj-alt')];
    nodes.forEach(function (n) { if (n) n.classList.add('swapping'); });
    setTimeout(function () {
      writeBrand(next);
      nodes.forEach(function (n) { if (n) n.classList.remove('swapping'); });
    }, 520);
  }

  /* ══════════════════════════════════════════════════════════════════
     2. BIOMETRIC BARS
     ══════════════════════════════════════════════════════════════════ */

  var SEGMENTS = 10;

  function buildBars() {
    var host = $('bars');
    if (!host) return;
    host.innerHTML = '';

    Object.keys(C.biometrics).forEach(function (key) {
      var row = document.createElement('div');
      row.className = 'bar-row';
      row.setAttribute('data-key', key);

      var label = document.createElement('div');
      label.className = 'bar-label';
      label.textContent = key.replace(/_/g, ' ');

      var track = document.createElement('div');
      track.className = 'bar-track';
      var segs = [];
      for (var s = 0; s < SEGMENTS; s++) {
        var seg = document.createElement('i');
        seg.className = 'bar-seg';
        track.appendChild(seg);
        segs.push(seg);
      }

      var val = document.createElement('div');
      val.className = 'bar-val';

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(val);
      host.appendChild(row);

      paintBar(key, segs, val);
    });
  }

  /* COMMON SENSE and friends read as a failure, so they get the red tint */
  var NEGATIVE = { COMMON_SENSE: 1, MENTAL_STABILITY: 1 };

  function paintBar(key, segs, valEl) {
    var pct = clamp(state.biometrics[key], 0, 100);
    var lit = Math.round((pct / 100) * SEGMENTS);
    var negative = NEGATIVE[key];

    for (var i = 0; i < SEGMENTS; i++) {
      var on = i < lit;
      segs[i].className = 'bar-seg' + (on ? (negative ? ' on hot' : ' on') : '');
    }
    setText(valEl, Math.round(pct) + '%');
  }

  function tickBiometrics() {
    var host = $('bars');
    if (!host) return;

    var rows = host.children;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var key = row.getAttribute('data-key');
      var base = C.biometrics[key];
      var cur = state.biometrics[key];

      // random walk around the baseline, clamped to ±14 of it
      cur += state.drift[key] * rnd(0.4, 1.6);
      if (cur > base + 14) { cur = base + 14; state.drift[key] = -1; }
      if (cur < Math.max(1, base - 14)) { cur = Math.max(1, base - 14); state.drift[key] = 1; }
      state.biometrics[key] = cur;

      var segs = row.getElementsByClassName('bar-seg');
      var valEl = row.getElementsByClassName('bar-val')[0];
      paintBar(key, segs, valEl);
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     3. TELEMETRY DRIFT
     ══════════════════════════════════════════════════════════════════ */

  function tickTelemetry() {
    var speed = Math.max(0.15, motion);

    // external temp wanders around the configured baseline
    var tSpan = C.mode === 'extreme' ? 4.5 : 2.2;
    state.temp = C.temperature + rnd(-tSpan, tSpan) * (0.5 + speed * 0.5);
    // wind chill trails temp with its own offset
    state.chill = state.temp - rnd(11, 17);

    // load hovers high, sanity hovers low
    state.load = clamp(C.systemLoad + rnd(-3, 3), 0, 100);
    state.sanity = clamp(C.sanity + rnd(-2.5, 2.5), 0, 100);

    setText($('v-temp'), state.temp.toFixed(1));
    setText($('v-chill'), state.chill.toFixed(1));
    setText($('v-load'), String(Math.round(state.load)));
    setText($('v-san'), String(Math.round(state.sanity)));
    setStyle($('m-load'), 'width', state.load + '%');
    setStyle($('m-san'), 'width', state.sanity + '%');

    // the physics egg watches for genuinely absurd readings
    if (state.temp < C.eggs.physicsThreshold) fireEgg('physics');
  }

  /* core status stays serious most of the time, drifts occasionally */
  var CORE_ALT = [
    'STILL ALIVE', 'BARELY', 'RUNNING', 'OPTIMISTIC',
    'HOLDING', 'COOLING DOWN', 'NOMINAL', 'OVERCLOCKED'
  ];

  function maybeFlipCore(now) {
    if (now - state.lastCoreFlip < 25000) return;
    if (Math.random() > 0.35) return;
    state.lastCoreFlip = now;

    var next = pick(CORE_ALT);
    setText($('v-core'), next);
    setText($('v-core-tag'), next.split(' ')[0]);

    // very dim flash of the status text — the panel is the indicator
    var v = $('v-core');
    if (v) {
      v.style.transition = 'opacity 0.25s';
      v.style.opacity = '0.25';
      requestAnimationFrame(function () {
        v.style.transition = 'opacity 1.2s';
        v.style.opacity = '1';
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     4. EVENT LOG
     ══════════════════════════════════════════════════════════════════ */

  var MAX_LOG_LINES = 7;

  function timeStamp(d) {
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function pushLog() {
    var host = $('log');
    if (!host) return;

    var raw = pick(C.systemLogs);
    var isJoke = raw.charAt(0) === '@';
    var text = isJoke ? raw.slice(1) : raw;

    var line = document.createElement('div');
    line.className = 'log-line' + (isJoke ? ' joke' : '');

    var t = document.createElement('span');
    t.className = 't';
    t.textContent = timeStamp(new Date());

    var m = document.createElement('span');
    m.className = 'm';
    m.textContent = text;

    line.appendChild(t);
    line.appendChild(m);
    host.appendChild(line);

    // hard cap on DOM nodes — this is the anti-leak guarantee
    while (host.children.length > MAX_LOG_LINES) {
      host.removeChild(host.firstChild);
    }
  }

  function tickLog(now) {
    if (now < state.nextLogAt) return;

    var range = C.logIntervalMs;
    var base = range[0] + Math.random() * (range[1] - range[0]);
    // intensity stretches or compresses the cadence
    var scaled = base / (0.6 + motion * 0.7);
    state.nextLogAt = now + clamp(scaled, 2200, 20000);

    pushLog();
  }

  /* ══════════════════════════════════════════════════════════════════
     5. ANOMALY REGISTER — three slots, the joke layer
     ══════════════════════════════════════════════════════════════════ */

  var ANOM_SLOTS = 3;
  var anomNodes = [];
  var anomCurrent = [];

  function buildAnomalies() {
    var host = $('anomaly-register');
    if (!host) return;
    host.innerHTML = '';
    anomNodes = [];
    anomCurrent = [];

    var pool = C.anomalies.slice();
    // shuffle so the first draw isn't config order
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }

    for (var s = 0; s < ANOM_SLOTS; s++) {
      var node = document.createElement('div');
      node.className = 'anom';
      node.innerHTML = '<span class="k"></span><span class="arrow">→</span><span class="v"></span>';
      host.appendChild(node);
      anomNodes.push(node);
      if (pool[s]) {
        anomCurrent[s] = pool[s];
        writeAnom(s, pool[s], false);
      }
    }
  }

  function writeAnom(i, pair, fade) {
    var node = anomNodes[i];
    if (!node || !pair) return;

    var apply = function () {
      node.querySelector('.k').textContent = pair[0];
      node.querySelector('.v').textContent = pair[1];
      node.classList.remove('fade');
    };

    if (fade) {
      node.classList.add('fade');
      setTimeout(apply, 700);
    } else {
      apply();
    }
  }

  function tickAnomalies(now) {
    if (now < state.nextAnomAt) return;

    var range = C.anomalySwapMs;
    var base = range[0] + Math.random() * (range[1] - range[0]);
    state.nextAnomAt = now + clamp(base / (0.6 + motion * 0.6), 6000, 30000);

    // replace exactly one slot per swap, so the set feels alive but calm
    var slot = irnd(0, ANOM_SLOTS - 1);
    var next;
    do { next = pick(C.anomalies); } while (anomCurrent[slot] && next === anomCurrent[slot]);
    anomCurrent[slot] = next;
    writeAnom(slot, next, true);
  }

  /* ══════════════════════════════════════════════════════════════════
     6. EASTER EGGS
     ══════════════════════════════════════════════════════════════════ */

  /* transient one-line messages, bottom-centre, very low presence */
  function whisper(text, ms) {
    var el = document.createElement('div');
    el.textContent = text;
    el.style.cssText =
      'position:fixed;left:50%;bottom:6.2rem;transform:translateX(-50%);' +
      'z-index:25;font-size:0.5rem;letter-spacing:0.24em;color:#5c7684;' +
      'text-transform:uppercase;opacity:0;transition:opacity 1.4s ease;' +
      'pointer-events:none;white-space:nowrap;';
    document.body.appendChild(el);

    requestAnimationFrame(function () { el.style.opacity = '0.9'; });
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1600);
    }, ms || 6000);
  }

  function fireEgg(name) {
    // each egg fires at most once per session unless re-armed
    if (state.eggsFired[name]) return;
    state.eggsFired[name] = true;

    switch (name) {
      case 'longstream':
        whisper('SUBJECT HAS BEEN STREAMING FOR TOO LONG', 7000);
        setTimeout(function () { whisper('MEDICAL ADVICE: REJECTED BY SUBJECT', 6500); }, 8000);
        break;
      case 'circadian':
        whisper('CIRCADIAN RHYTHM: COMPLETELY DESTROYED', 7000);
        break;
      case 'physics':
        whisper('PHYSICS HAS LEFT THE CHAT', 5000);
        break;
      case 'devmode':
        whisper('DEVELOPER MODE // ABSOLUTE ZERO UNLOCKED', 5000);
        break;
    }
  }

  /* checkEggs takes no rAF timestamp on purpose: it compares against
     state.sessionStart, which is stamped from Date.now(). Mixing the two
     clocks (performance.now() vs Date.now()) would silently make the
     long-stream egg unreachable. */
  function checkEggs() {
    var e = C.eggs;
    var now = Date.now();

    // long session
    var mins = (now - state.sessionStart) / 60000;
    if (mins >= e.longStreamMinutes) fireEgg('longstream');

    // circadian rhythm, between 02:00 and 05:00 local
    var h = new Date().getHours();
    if (h >= e.circadianStart && h < e.circadianEnd) fireEgg('circadian');
  }

  /* rare full-frame warning. cold, brief, never strobing. */
  function maybeWarn(now) {
    if (now - state.lastWarn < C.warningCooldownMs) return;
    if (Math.random() > 0.5) return;

    state.lastWarn = now;
    var el = $('warn-overlay');
    if (!el) return;

    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* ══════════════════════════════════════════════════════════════════
     7. GRAIN CANVAS — frost crystals, ~20fps, low resolution
     ══════════════════════════════════════════════════════════════════ */

  var grain = {
    canvas: null, ctx: null,
    w: 0, h: 0,
    flakes: [],
    lastDraw: 0
  };

  var FLAKE_COUNT = 90;   // deliberately sparse
  var GRAIN_FPS = 20;

  function initGrain() {
    grain.canvas = $('grain');
    if (!grain.canvas) return;
    grain.ctx = grain.canvas.getContext('2d', { alpha: true });
    resizeGrain();
    seedFlakes();
  }

  function resizeGrain() {
    if (!grain.canvas) return;
    // half resolution: the layer is a soft haze, nobody will see the pixels
    grain.w = Math.floor(window.innerWidth / 2);
    grain.h = Math.floor(window.innerHeight / 2);
    grain.canvas.width = grain.w;
    grain.canvas.height = grain.h;
  }

  function seedFlakes() {
    grain.flakes = [];
    var n = Math.round(FLAKE_COUNT * Math.max(0.3, Math.min(1.5, motion)));
    for (var i = 0; i < n; i++) {
      grain.flakes.push({
        x: Math.random() * grain.w,
        y: Math.random() * grain.h,
        r: rnd(0.4, 1.5),
        a: rnd(0.05, 0.26),
        vx: rnd(-0.09, 0.09),
        vy: rnd(-0.055, 0.02)   // slow downward drift, mostly still
      });
    }
  }

  function drawGrain(ts) {
    if (!grain.ctx) return;

    var ctx = grain.ctx;
    ctx.clearRect(0, 0, grain.w, grain.h);

    for (var i = 0; i < grain.flakes.length; i++) {
      var f = grain.flakes[i];
      f.x += f.vx * 0.4;
      f.y += f.vy * 0.4;

      // wrap around the edges so density stays constant forever
      if (f.x < -4) f.x = grain.w + 4; else if (f.x > grain.w + 4) f.x = -4;
      if (f.y < -4) f.y = grain.h + 4; else if (f.y > grain.h + 4) f.y = -4;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(190, 226, 242, ' + f.a + ')';
      ctx.fill();
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     8. SESSION CLOCK
     ══════════════════════════════════════════════════════════════════ */

  var sessionClock = 0;

  function tickSession() {
    var s = Math.floor((Date.now() - state.sessionStart) / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var str = (h > 0 ? pad2(h) + ':' : '') + pad2(m) + ':' + pad2(sec);
    setText($('v-session'), 'UPTIME ' + str);
    setText($('v-env'), 'ENV ' + C.facilitySector.replace('SECTOR ', '').slice(0, 8));
  }

  /* ══════════════════════════════════════════════════════════════════
     9. MAIN LOOP
     ══════════════════════════════════════════════════════════════════ */

  var grainInterval = 1000 / GRAIN_FPS;

  function frame(ts) {
    // --- grain: capped fps, independent of the main loop rate ---
    if (ts - grain.lastDraw >= grainInterval) {
      grain.lastDraw = ts;
      drawGrain(ts);
    }

    // --- telemetry: ~1.4s, slow enough to read, fast enough to feel alive ---
    if (ts - state.lastTempTick > 1400) {
      state.lastTempTick = ts;
      tickTelemetry();
      maybeFlipCore(ts);
    }

    // --- biometrics: ~2.6s ---
    if (ts - state.lastBioTick > 2600) {
      state.lastBioTick = ts;
      tickBiometrics();
    }

    // --- log + anomalies + eggs + session clock ---
    tickLog(ts);
    tickAnomalies(ts);
    tickBrand(ts);
    checkEggs();
    maybeWarn(ts);
    tickSession();

    requestAnimationFrame(frame);
  }

  /* ══════════════════════════════════════════════════════════════════
     10. LISTENERS — registered exactly once, at init
     ══════════════════════════════════════════════════════════════════ */

  function initListeners() {
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      // debounce: OBS can fire resize storms while the source is being set up
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeGrain();
        seedFlakes();
      }, 250);
    });

    // DEV MODE easter egg — five clicks on the identity plate
    var clicks = 0;
    var plate = document.querySelector('.plate');
    if (plate) {
      plate.style.pointerEvents = 'auto';
      plate.style.cursor = 'pointer';
      plate.addEventListener('click', function () {
        clicks++;
        if (clicks >= 5) { clicks = 0; fireEgg('devmode'); }
      });
    }

    // pause the grain loop when the window is hidden; rAF already stops,
    // so this only guards the wall-clock side effects.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) state.lastWarn = 0;
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     11. BOOT SEQUENCE
     ══════════════════════════════════════════════════════════════════ */

  function runBoot() {
    var lines = document.querySelectorAll('.boot-line');
    var step = 210;

    // generous budget: if motion is 0 we still want a clean reveal
    var stagger = motion === 0 ? 90 : step;

    for (var i = 0; i < lines.length; i++) {
      (function (node, i) {
        setTimeout(function () { node.classList.add('show'); }, i * stagger);
      })(lines[i], i);
    }

    var total = lines.length * stagger + 320;
    setTimeout(function () {
      var boot = $('boot');
      if (boot) boot.classList.add('done');
      // remove from the tree entirely once faded so it can never intercept input
      setTimeout(function () {
        if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
      }, 700);
      // start the world slightly before the overlay is fully gone
      start();
    }, total);
  }

  /* ══════════════════════════════════════════════════════════════════
     12. START
     ══════════════════════════════════════════════════════════════════ */

  function start() {
    // seed the log with a few history lines so it never looks empty
    for (var i = 0; i < 4; i++) pushLog();

    state.nextLogAt = performance.now() + 4000;
    state.nextAnomAt = performance.now() + 6000;
    state.sessionStart = Date.now();
    sessionClock = performance.now();

    requestAnimationFrame(frame);
  }

  function init() {
    bindStatic();
    writeBrand(pickBrand());
    buildChamber();
    buildBars();
    buildAnomalies();
    initGrain();
    initListeners();
    runBoot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();