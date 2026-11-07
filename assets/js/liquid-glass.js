/* ============================================================
   Liquid Glass
   思路移植自 shuding/liquid-glass（MIT）：
   用 SDF 生成位移贴图，再通过 SVG feImage + feDisplacementMap
   作用于 backdrop-filter，让玻璃边缘真正折射背后的内容。
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsBackdrop =
    "backdropFilter" in document.documentElement.style ||
    "webkitBackdropFilter" in document.documentElement.style;
  var NS = "http://www.w3.org/2000/svg";
  var XLINK = "http://www.w3.org/1999/xlink";
  var uid = 0;

  function smoothStep(a, b, t) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  // 圆角矩形有符号距离场：内部为负，外部为正
  function sdfRect(x, y, hw, hh, r) {
    r = Math.min(r, hw, hh);
    var qx = Math.abs(x) - hw + r;
    var qy = Math.abs(y) - hh + r;
    return (
      Math.min(Math.max(qx, qy), 0) +
      Math.sqrt(Math.max(qx, 0) * Math.max(qx, 0) + Math.max(qy, 0) * Math.max(qy, 0)) -
      r
    );
  }

  function radiusOf(el, w, h) {
    var raw = window.getComputedStyle(el).borderTopLeftRadius || "0px";
    var value = parseFloat(raw);
    if (!isFinite(value)) return 0;
    if (raw.indexOf("%") > -1) value = (value / 100) * Math.min(w, h);
    return Math.min(value, Math.min(w, h) / 2);
  }

  // 生成背景折射用的位移贴图
  function buildMap(w, h, radius) {
    var maxShift = Math.max(1, Math.min(16, Math.min(w, h) * 0.18));
    var cw = Math.min(460, Math.max(64, Math.round(w)));
    var ch = Math.max(24, Math.round((cw * h) / w));
    var data = new Uint8ClampedArray(cw * ch * 4);
    var hw = w / 2;
    var hh = h / 2;
    var band = Math.min(28, Math.min(w, h) * 0.3);
    var i = 0;

    for (var y = 0; y < ch; y++) {
      var ey = ((y + 0.5) / ch) * h;
      for (var x = 0; x < cw; x++) {
        var ex = ((x + 0.5) / cw) * w;
        var edge = -sdfRect(ex - hw, ey - hh, hw, hh, radius);
        var t = smoothStep(band, 0, edge);
        var dx = 0;
        var dy = 0;

        if (t > 0) {
          var gx =
            sdfRect(ex + 1 - hw, ey - hh, hw, hh, radius) -
            sdfRect(ex - 1 - hw, ey - hh, hw, hh, radius);
          var gy =
            sdfRect(ex - hw, ey + 1 - hh, hw, hh, radius) -
            sdfRect(ex - hw, ey - 1 - hh, hw, hh, radius);
          var gl = Math.sqrt(gx * gx + gy * gy) || 1;
          var mag = t * maxShift;
          // 法线朝向内部，让边缘像透镜一样把背景向内收
          dx = (-gx / gl) * mag;
          dy = (-gy / gl) * mag;
        }

        data[i++] = (dx / (2 * maxShift)) * 255 + 127.5;
        data[i++] = (dy / (2 * maxShift)) * 255 + 127.5;
        data[i++] = 128;
        data[i++] = 255;
      }
    }

    var canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    canvas.getContext("2d").putImageData(new ImageData(data, cw, ch), 0, 0);

    return {
      url: canvas.toDataURL("image/png"),
      scale: maxShift * 2
    };
  }

  function buildFilter(id, w, h, map) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText =
      "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;z-index:-1;";

    var defs = document.createElementNS(NS, "defs");
    var filter = document.createElementNS(NS, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("x", "0");
    filter.setAttribute("y", "0");
    filter.setAttribute("width", String(w));
    filter.setAttribute("height", String(h));
    filter.setAttribute("color-interpolation-filters", "sRGB");

    var image = document.createElementNS(NS, "feImage");
    image.setAttribute("result", "map");
    image.setAttribute("width", String(w));
    image.setAttribute("height", String(h));
    image.setAttribute("preserveAspectRatio", "none");
    image.setAttribute("href", map.url);
    image.setAttributeNS(XLINK, "xlink:href", map.url);

    var disp = document.createElementNS(NS, "feDisplacementMap");
    disp.setAttribute("in", "SourceGraphic");
    disp.setAttribute("in2", "map");
    disp.setAttribute("xChannelSelector", "R");
    disp.setAttribute("yChannelSelector", "G");
    disp.setAttribute("scale", String(map.scale));

    filter.appendChild(image);
    filter.appendChild(disp);
    defs.appendChild(filter);
    svg.appendChild(defs);

    return { svg: svg, id: id };
  }

  function enhance(el) {
    var lastW = 0;
    var lastH = 0;
    var lastR = 0;
    var svg = null;
    var timer = null;
    var blur = parseFloat(el.getAttribute("data-liquid-blur")) || 14;

    function render(force) {
      var w = el.offsetWidth;
      var h = el.offsetHeight;
      if (!w || !h) return;

      var radius = radiusOf(el, w, h);
      if (
        !force &&
        Math.abs(w - lastW) < 4 &&
        Math.abs(h - lastH) < 4 &&
        Math.abs(radius - lastR) < 2
      ) {
        return;
      }

      lastW = w;
      lastH = h;
      lastR = radius;

      var id = "domeos-glass-" + ++uid;
      var map = buildMap(w, h, radius);
      var filter = buildFilter(id, w, h, map);

      if (svg) svg.remove();
      document.body.appendChild(filter.svg);
      svg = filter.svg;

      var value =
        "url(#" +
        id +
        ") blur(" +
        blur +
        "px) saturate(172%) brightness(1.04)";
      el.style.backdropFilter = value;
      el.style.webkitBackdropFilter = value;
      el.classList.add("liquid-ready");
    }

    // 等布局稳定后再生成，避免拿到 0 尺寸
    setTimeout(function () {
      render(true);
    }, 80);

    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          render(false);
        }, 180);
      }).observe(el);
    }
  }

  if (supportsBackdrop) {
    document.querySelectorAll("[data-liquid]").forEach(enhance);
  }

  // 指针在玻璃上移动时更新高光位置
  document.querySelectorAll(".glass").forEach(function (el) {
    el.addEventListener(
      "pointermove",
      function (e) {
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        el.style.setProperty(
          "--gx",
          ((e.clientX - rect.left) / rect.width) * 100 + "%"
        );
        el.style.setProperty(
          "--gy",
          ((e.clientY - rect.top) / rect.height) * 100 + "%"
        );
      },
      { passive: true }
    );
  });

  // 跟随指针的环境微光
  var glow = document.querySelector(".cursor-glow");
  if (
    glow &&
    !reduceMotion &&
    window.matchMedia("(pointer: fine)").matches
  ) {
    var tx = window.innerWidth / 2;
    var ty = window.innerHeight * 0.3;
    var x = tx;
    var y = ty;
    var raf = null;

    var tick = function () {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      glow.style.transform =
        "translate3d(" + x + "px," + y + "px,0)";
      if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    document.addEventListener(
      "pointermove",
      function (e) {
        tx = e.clientX;
        ty = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
      },
      { passive: true }
    );

    glow.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  }
})();
