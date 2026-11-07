/* 高斯玻璃：指针高光与环境微光 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 导航：跟随指针滑动的胶囊高光
  document.querySelectorAll(".nav-links").forEach(function (nav) {
    var pill = nav.querySelector(".nav-hover");
    if (!pill) return;

    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("pointerenter", function () {
        nav.style.setProperty("--pill-x", a.offsetLeft + "px");
        nav.style.setProperty("--pill-w", a.offsetWidth + "px");
        nav.classList.add("pill-on");
      });
    });

    nav.addEventListener("pointerleave", function () {
      nav.classList.remove("pill-on");
    });
  });

  // 顶栏：跟随指针的轻微 3D 倾斜
  var capsule = document.querySelector(".nav.glass");
  if (
    capsule &&
    !reduceMotion &&
    window.matchMedia("(pointer: fine)").matches
  ) {
    capsule.addEventListener(
      "pointermove",
      function (e) {
        if (window.innerWidth <= 720) return;
        var r = capsule.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        capsule.style.setProperty("--rx", (-ny * 2.4).toFixed(2) + "deg");
        capsule.style.setProperty("--ry", (nx * 3).toFixed(2) + "deg");
        capsule.style.setProperty("--lift", "1");
      },
      { passive: true }
    );

    capsule.addEventListener("pointerleave", function () {
      capsule.style.setProperty("--rx", "0deg");
      capsule.style.setProperty("--ry", "0deg");
      capsule.style.setProperty("--lift", "0");
    });
  }

  // 背景：跟随指针缓慢视差
  var scene = document.querySelector(".bg-scene");
  if (scene && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var bx = 0;
    var by = 0;
    var tx = 0;
    var ty = 0;
    var sceneRaf = null;

    var sceneTick = function () {
      bx += (tx - bx) * 0.08;
      by += (ty - by) * 0.08;
      scene.style.transform =
        "translate3d(" + bx + "px," + by + "px,0) scale(1.06)";
      if (Math.abs(tx - bx) > 0.1 || Math.abs(ty - by) > 0.1) {
        sceneRaf = requestAnimationFrame(sceneTick);
      } else {
        sceneRaf = null;
      }
    };

    document.addEventListener(
      "pointermove",
      function (e) {
        tx = (e.clientX / window.innerWidth - 0.5) * 16;
        ty = (e.clientY / window.innerHeight - 0.5) * 16;
        if (!sceneRaf) sceneRaf = requestAnimationFrame(sceneTick);
      },
      { passive: true }
    );
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
