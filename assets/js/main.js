/* DomeOS AI — 站点交互（无依赖） */
(function () {
  "use strict";

  var cfg = window.DOMEOS_CONFIG || {};
  var user = cfg.githubUser || "YOUR_GITHUB_USERNAME";
  var repo = cfg.projectRepo || "DomeOS-AI";
  var repoBase = "https://github.com/" + user + "/" + repo;
  var releasesUrl = repoBase + "/releases";

  var links = {
    github: repoBase,
    releases: releasesUrl,
    release: releasesUrl + "/latest",
    issues: repoBase + "/issues",
    download: cfg.downloadUrl || releasesUrl + "/latest"
  };

  // 写入链接与版本号
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var url = links[el.getAttribute("data-link")];
    if (url) el.setAttribute("href", url);
  });

  document.querySelectorAll("[data-version]").forEach(function (el) {
    el.textContent = cfg.version || "";
  });

  document.querySelectorAll("[data-release-date]").forEach(function (el) {
    el.textContent = cfg.releaseDate || "";
  });

  document.querySelectorAll("[data-codename]").forEach(function (el) {
    el.textContent = cfg.codename || "";
  });

  document.querySelectorAll("[data-file-size]").forEach(function (el) {
    el.textContent = cfg.fileSize || "";
  });

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // 主题切换
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("domeos-theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch (e) {}

  var themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try {
        localStorage.setItem("domeos-theme", next);
      } catch (e) {}
    });
  }

  // 移动端菜单
  var menuToggle = document.getElementById("menuToggle");
  var navLinks = document.getElementById("navLinks");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 顶栏滚动状态
  var header = document.getElementById("header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // 阅读进度条
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  document.body.appendChild(progress);

  var updateProgress = function () {
    var rootEl = document.documentElement;
    var max = rootEl.scrollHeight - rootEl.clientHeight;
    var ratio = max > 0 ? rootEl.scrollTop / max : 0;
    progress.style.transform = "scaleX(" + ratio + ")";
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  // 滚动显现
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 6) * 70 + "ms";
      revealObserver.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  // 功能卡片光晕跟随鼠标
  document.querySelectorAll(".feature").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
    });
  });

  // 文档目录高亮
  var tocLinks = document.querySelectorAll(".docs-nav a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) {
      map[a.getAttribute("href").slice(1)] = a;
    });
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (a) {
            a.classList.remove("active");
          });
          var link = map[entry.target.id];
          if (link) link.classList.add("active");
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    Object.keys(map).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }
})();
