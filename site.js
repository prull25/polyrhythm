  document.getElementById('year').textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal */
  (function () {
    var items = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* Hero rhythm strip: two tempos, one shared beat */
  (function () {
    var canvas = document.getElementById('rhythmCanvas');
    var readout = document.getElementById('syncReadout');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var running = false;
    var rafId = null;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    }

    function tone(varName) {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    var freqA = 3.3, freqB = 4.1, speed = 0.09;

    function frame(x, freq, mult) {
      return Math.sin(2 * Math.PI * (freq * x - speed * mult));
    }

    function render(tMs) {
      var t = reduceMotion ? 0.4 : tMs / 1000;
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      var midY = h * 0.5;
      var amp = h * 0.3;
      var lineA = tone('--text-muted');
      var lineB = tone('--text-faint');
      var accent = tone('--accent');

      var steps = Math.max(80, Math.floor(w / (2 * dpr)));
      var pathA = [], pathB = [];
      var syncPoints = [];

      for (var i = 0; i <= steps; i++) {
        var xn = i / steps;
        var vA = Math.sin(2 * Math.PI * (freqA * xn - speed * freqA * t));
        var vB = Math.sin(2 * Math.PI * (freqB * xn - speed * freqB * t));
        var x = xn * w;
        pathA.push([x, midY - vA * amp]);
        pathB.push([x, midY - vB * amp]);
        if (vA > 0.88 && vB > 0.88) syncPoints.push([x, midY - ((vA + vB) / 2) * amp]);
      }

      function stroke(path, color, dash) {
        ctx.beginPath();
        ctx.setLineDash(dash ? [4 * dpr, 4 * dpr] : []);
        ctx.moveTo(path[0][0], path[0][1]);
        for (var j = 1; j < path.length; j++) ctx.lineTo(path[j][0], path[j][1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.4 * dpr, 1);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      stroke(pathA, lineA, false);
      stroke(pathB, lineB, true);

      var hasSync = syncPoints.length > 0;
      syncPoints.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3.2 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
      });

      if (readout) readout.classList.toggle('is-on', hasSync);

      if (running && !reduceMotion) rafId = requestAnimationFrame(render);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      rafId = requestAnimationFrame(render);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (inView) start();
    });

    var inView = false;
    if ('IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          if (inView && !document.hidden) start(); else stop();
        });
      }, { threshold: 0.1 });
      io2.observe(canvas);
    } else {
      inView = true;
      start();
    }

    resize();
    render(0);
    if (reduceMotion) { inView = true; }
  })();
