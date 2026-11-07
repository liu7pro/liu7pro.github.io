/* 高斯玻璃：指针高光与环境微光 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  if (glow && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var tx = window.innerWidth / 2;
    var ty = window.innerHeight * 0.3;
    var x = tx;
    var y = ty;
    var raf = null;

    var tick = function () {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      glow.style.transform = "translate3d(" + x + "px," + y + "px,0)";
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
