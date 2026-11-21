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

  document.querySelectorAll("[data-file-size-en]").forEach(function (el) {
    el.textContent = cfg.fileSizeEn || "";
  });

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // 自动同步 GitHub 最新 Release；失败时保留 config.js 的静态值
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch];
    });
  }

  function formatFileSize(bytes) {
    var mb = bytes / (1024 * 1024);
    return (mb >= 100 ? Math.round(mb) : Math.round(mb * 10) / 10) + " MB";
  }

  function applyLatestRelease(rel) {
    if (!rel) return;

    var rawVersion =
      rel.name && /^\d/.test(rel.name) ? rel.name : rel.tag_name || "";
    var version = rawVersion;
    if (version && !/^v/i.test(version) && /^\d/.test(version)) {
      version = "v" + version;
    }

    var codename = rel.tag_name || "";
    var date = rel.published_at ? rel.published_at.slice(0, 10) : "";

    if (version) {
      document.querySelectorAll("[data-version]").forEach(function (el) {
        el.textContent = version;
      });
      document.querySelectorAll(".nav-version").forEach(function (el) {
        el.textContent = version;
      });
    }

    if (codename) {
      document.querySelectorAll("[data-codename]").forEach(function (el) {
        el.textContent = codename;
      });
    }

    if (date) {
      document.querySelectorAll("[data-release-date]").forEach(function (el) {
        el.textContent = date;
      });
    }

    var assets = rel.assets || [];
    var asset =
      assets.filter(function (item) {
        return /\.exe$/i.test(item.name);
      })[0] || assets[0];

    if (asset) {
      document.querySelectorAll("[data-file-size]").forEach(function (el) {
        el.textContent = "约 " + formatFileSize(asset.size);
      });
      document.querySelectorAll("[data-file-size-en]").forEach(function (el) {
        el.textContent = "~" + formatFileSize(asset.size);
      });
      document.querySelectorAll('[data-link="download"]').forEach(function (el) {
        el.setAttribute("href", asset.browser_download_url);
      });
    }

    var notes = document.querySelector("[data-release-notes]");
    if (notes && rel.body) {
      var items = rel.body
        .split(/\r?\n/)
        .map(function (line) {
          return line.replace(/^[•\-*]\s*/, "").trim();
        })
        .filter(Boolean);
      if (items.length) {
        notes.innerHTML = items
          .map(function (line) {
            return "<li>" + escapeHtml(line) + "</li>";
          })
          .join("");
      }
    }

    window.domeosRelease = rel;
  }

  function loadLatestRelease() {
    var cacheKey = "domeos-release-json-v1";
    try {
      var cached = JSON.parse(sessionStorage.getItem(cacheKey));
      if (cached && cached.time && Date.now() - cached.time < 30 * 60 * 1000) {
        applyLatestRelease(cached.data);
        return;
      }
    } catch (e) {}

    if (!("fetch" in window)) return;

    var controller =
      "AbortController" in window ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, 8000)
      : null;

    fetch("/assets/data/release.json?v=" + Date.now(), {
      cache: "no-store",
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (rel) {
        if (timer) clearTimeout(timer);
        applyLatestRelease(rel);
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ time: Date.now(), data: rel })
          );
        } catch (e) {}
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
      });
  }

  loadLatestRelease();

  // 主题：默认跟随系统深/浅色，手动切换后记住选择
  var root = document.documentElement;
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var lightQuery =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: light)");

  function readThemeChoice() {
    try {
      var value = localStorage.getItem("domeos-theme-v2");
      return value === "light" || value === "dark" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function systemTheme() {
    return lightQuery && lightQuery.matches ? "light" : "dark";
  }

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (themeMeta) {
      themeMeta.setAttribute(
        "content",
        theme === "light" ? "#f7f8fa" : "#0a0b0f"
      );
    }
    if (persist) {
      try {
        localStorage.setItem("domeos-theme-v2", theme);
      } catch (e) {}
    }
  }

  applyTheme(readThemeChoice() || systemTheme(), false);

  if (lightQuery) {
    var onSystemThemeChange = function () {
      if (!readThemeChoice()) applyTheme(systemTheme(), false);
    };
    if (lightQuery.addEventListener) {
      lightQuery.addEventListener("change", onSystemThemeChange);
    } else if (lightQuery.addListener) {
      lightQuery.addListener(onSystemThemeChange);
    }
  }

  var themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(root.dataset.theme === "light" ? "dark" : "light", true);
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

  // 外链确认弹窗
  (function () {
    var isEn = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;

    var overlay = document.createElement("div");
    overlay.className = "site-modal";
    overlay.id = "siteModal";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="site-modal-card" role="dialog" aria-modal="true" aria-labelledby="siteModalTitle">' +
      '<h3 id="siteModalTitle"></h3>' +
      '<p id="siteModalDesc"></p>' +
      '<div class="site-modal-actions">' +
      '<button class="btn btn-quiet" type="button" data-modal-cancel></button>' +
      '<button class="btn btn-primary" type="button" data-modal-continue></button>' +
      "</div></div>";
    document.body.appendChild(overlay);

    var titleEl = overlay.querySelector("#siteModalTitle");
    var descEl = overlay.querySelector("#siteModalDesc");
    var cancelBtn = overlay.querySelector("[data-modal-cancel]");
    var continueBtn = overlay.querySelector("[data-modal-continue]");
    var pendingUrl = "";
    var pendingLink = null;

    function hide() {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (pendingLink) {
        try {
          pendingLink.focus();
        } catch (e) {}
      }
    }

    function show(link, url, title, desc, action) {
      pendingUrl = url;
      pendingLink = link;
      titleEl.textContent = title;
      descEl.textContent = desc;
      cancelBtn.textContent = isEn ? "Cancel" : "取消";
      continueBtn.textContent = action || (isEn ? "Continue" : "继续访问");
      overlay.classList.add("show");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      setTimeout(function () {
        try {
          continueBtn.focus();
        } catch (e) {}
      }, 50);
    }

    cancelBtn.addEventListener("click", hide);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) hide();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay.classList.contains("show")) hide();
    });
    continueBtn.addEventListener("click", function () {
      var url = pendingUrl;
      hide();
      if (url) window.open(url, "_blank", "noopener");
    });

    document.addEventListener(
      "click",
      function (event) {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        var target = event.target;
        if (!target || !target.closest) return;
        var link = target.closest("a[href]");
        if (!link) return;

        var href = link.getAttribute("href");
        if (!href || href.charAt(0) === "#" || /^(mailto|tel):/i.test(href)) {
          return;
        }

        var url;
        try {
          url = new URL(link.href, location.href);
        } catch (e) {
          return;
        }
        if (url.protocol !== "http:" && url.protocol !== "https:") return;
        if (url.origin === location.origin) return;

        // 下载直链不弹外链确认，直接下载
        if (
          link.getAttribute("data-link") === "download" ||
          link.hasAttribute("download") ||
          /\.exe$/i.test(url.pathname)
        ) {
          return;
        }

        event.preventDefault();
        var title =
          link.getAttribute("data-modal-title") ||
          (isEn ? "External link" : "外部链接提示");
        var desc =
          link.getAttribute("data-modal-desc") ||
          (isEn
            ? "You are about to leave DomeOS AI. Continue?"
            : "即将跳转到外部站点，是否继续？");
        var action =
          link.getAttribute("data-modal-action") ||
          (isEn ? "Continue" : "继续访问");
        show(link, url.href, title, desc, action);
      },
      true
    );
  })();

})();


/* ---------- 自定义光标（参考 Moonshot） ---------- */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);
  document.body.appendChild(dot);

  var mx = -100, my = -100, rx = -100, ry = -100, shown = false, down = false;
  var hoverSel = 'a, button, .btn, [role="button"], [data-cursor-hover], .card, .member, .thanks-card, .product-card';

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    if (!shown) {
      shown = true;
      ring.style.opacity = '1';
      dot.style.opacity = '1';
    }
    dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
  }, { passive: true });

  (function loop() {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) scale(' + (down ? 0.86 : 1) + ')';
    window.requestAnimationFrame(loop);
  })();

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest(hoverSel)) ring.classList.add('is-hover');
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest && e.target.closest(hoverSel)) ring.classList.remove('is-hover');
  });
  document.addEventListener('mousedown', function () { down = true; });
  document.addEventListener('mouseup', function () { down = false; });
  document.addEventListener('mouseleave', function () {
    ring.style.opacity = '0';
    dot.style.opacity = '0';
    shown = false;
  });
})();