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

  // 音乐播放器（在线列表）
  (function () {
    var actions = document.querySelector(".nav-actions");
    if (!actions) return;

    var isEn = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
    var musicCfg = cfg.music || {};
    var defaultTrack = {
      title: musicCfg.title || "Moonlight",
      artist: musicCfg.artist || "DomeOS Team",
      album: musicCfg.album || "",
      src: musicCfg.src || "/assets/audio/bgm.flac"
    };
    var tracks = [defaultTrack];
    var currentIndex = -1;
    var audio = null;
    var isOpen = false;

    var ICONS = {
      play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
      pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
      prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>',
      next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"/></svg>',
      note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>'
    };

    var panel = document.createElement("div");
    panel.className = "music-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML =
      '<div class="music-panel-head"><span class="music-panel-heading">' +
      (isEn ? "Music player" : "音乐播放器") +
      '</span><button class="music-close" type="button" aria-label="' +
      (isEn ? "Close" : "关闭") +
      '">×</button></div>' +
      '<div class="music-now"><div class="music-now-title">' +
      (isEn ? "Nothing playing" : "未在播放") +
      '</div><div class="music-now-artist">DomeOS Team</div></div>' +
      '<div class="music-progress" role="slider" tabindex="0" aria-label="' +
      (isEn ? "Playback progress" : "播放进度") +
      '"><span class="music-progress-fill"></span></div>' +
      '<div class="music-time"><span data-current>00:00</span><span data-total>00:00</span></div>' +
      '<div class="music-controls">' +
      '<button class="music-ctrl" type="button" data-prev aria-label="' +
      (isEn ? "Previous" : "上一首") +
      '">' +
      ICONS.prev +
      "</button>" +
      '<button class="music-ctrl music-play" type="button" data-play aria-label="' +
      (isEn ? "Play" : "播放") +
      '">' +
      ICONS.play +
      "</button>" +
      '<button class="music-ctrl" type="button" data-next aria-label="' +
      (isEn ? "Next" : "下一首") +
      '">' +
      ICONS.next +
      "</button></div>" +
      '<div class="music-list" data-list></div>' +
      '<p class="music-hint">' +
      (isEn ? "Playlist provided by the site." : "在线列表由站点提供。") +
      "</p>";
    document.body.appendChild(panel);

    var btn = document.createElement("button");
    btn.className = "music-toggle";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", isEn ? "Open music player" : "打开音乐播放器");
    btn.title = isEn ? "Open music player" : "打开音乐播放器";
    btn.innerHTML = ICONS.note;

    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn && themeBtn.parentNode === actions) {
      actions.insertBefore(btn, themeBtn);
    } else {
      actions.appendChild(btn);
    }

    var listEl = panel.querySelector("[data-list]");
    var nowTitle = panel.querySelector(".music-now-title");
    var nowArtist = panel.querySelector(".music-now-artist");
    var playBtn = panel.querySelector("[data-play]");
    var prevBtn = panel.querySelector("[data-prev]");
    var nextBtn = panel.querySelector("[data-next]");
    var closeBtn = panel.querySelector(".music-close");
    var progressEl = panel.querySelector(".music-progress");
    var progressFill = panel.querySelector(".music-progress-fill");
    var currentEl = panel.querySelector("[data-current]");
    var totalEl = panel.querySelector("[data-total]");
    var toast = document.createElement("div");
    toast.className = "site-toast";
    document.body.appendChild(toast);
    var toastTimer = null;

    function showToast(text) {
      toast.textContent = text;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove("show");
      }, 2400);
    }

    function ensureAudio() {
      if (audio) return audio;
      audio = new window.Audio();
      audio.preload = "none";
      audio.addEventListener("play", function () {
        setPlaying(true);
      });
      audio.addEventListener("pause", function () {
        setPlaying(false);
      });
      audio.addEventListener("timeupdate", updateProgress);
      audio.addEventListener("loadedmetadata", updateProgress);
      audio.addEventListener("ended", function () {
        if (tracks.length > 1) {
          next(1);
        } else if (audio) {
          audio.currentTime = 0;
          var result = audio.play();
          if (result && result.catch) result.catch(function () {});
        }
      });
      return audio;
    }

    function setPlaying(playing) {
      btn.classList.toggle("is-playing", playing);
      btn.setAttribute(
        "aria-label",
        playing
          ? isEn
            ? "Music playing"
            : "音乐播放中"
          : isEn
          ? "Open music player"
          : "打开音乐播放器"
      );
      btn.title = playing
        ? isEn
          ? "Music playing"
          : "音乐播放中"
        : isEn
        ? "Open music player"
        : "打开音乐播放器";
      playBtn.innerHTML = playing ? ICONS.pause : ICONS.play;
      playBtn.setAttribute(
        "aria-label",
        playing ? (isEn ? "Pause" : "暂停") : isEn ? "Play" : "播放"
      );
    }

    function formatTime(value) {
      if (!isFinite(value) || value < 0) return "00:00";
      var total = Math.floor(value);
      var m = Math.floor(total / 60);
      var s = total % 60;
      return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    function updateProgress() {
      if (!audio) return;
      currentEl.textContent = formatTime(audio.currentTime);
      totalEl.textContent = isFinite(audio.duration)
        ? formatTime(audio.duration)
        : "00:00";
      progressFill.style.width =
        isFinite(audio.duration) && audio.duration > 0
          ? (audio.currentTime / audio.duration) * 100 + "%"
          : "0%";
    }

    function artistLine(track) {
      return track.artist + (track.album ? " · " + track.album : "");
    }

    function updateNow() {
      if (currentIndex >= 0 && tracks[currentIndex]) {
        nowTitle.textContent = tracks[currentIndex].title;
        nowArtist.textContent = artistLine(tracks[currentIndex]);
      } else {
        nowTitle.textContent = isEn ? "Nothing playing" : "未在播放";
        nowArtist.textContent = "DomeOS Team";
      }
    }

    function renderList() {
      listEl.innerHTML = "";
      if (!tracks.length) {
        var empty = document.createElement("div");
        empty.className = "music-empty";
        empty.textContent = isEn ? "No tracks yet." : "暂无音乐。";
        listEl.appendChild(empty);
        return;
      }

      tracks.forEach(function (track, index) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "music-item" + (index === currentIndex ? " active" : "");
        if (index === currentIndex) item.setAttribute("aria-current", "true");
        item.title = track.title;

        var note = document.createElement("span");
        note.className = "music-item-note";
        note.textContent = "♪";

        var text = document.createElement("span");
        text.className = "music-item-text";

        var title = document.createElement("span");
        title.className = "music-item-title";
        title.textContent = track.title;

        var artist = document.createElement("span");
        artist.className = "music-item-artist";
        artist.textContent = artistLine(track);

        text.appendChild(title);
        text.appendChild(artist);
        item.appendChild(note);
        item.appendChild(text);
        item.addEventListener("click", function () {
          if (index === currentIndex) {
            togglePlay();
          } else {
            playTrack(index);
          }
        });
        listEl.appendChild(item);
      });
    }

    function playTrack(index) {
      if (index < 0 || index >= tracks.length) return;
      currentIndex = index;
      var track = tracks[index];
      var player = ensureAudio();
      player.src = track.src;
      player.load();
      player.loop = tracks.length === 1;
      currentEl.textContent = "00:00";
      totalEl.textContent = "00:00";
      progressFill.style.width = "0%";
      updateNow();
      renderList();
      var result = player.play();
      if (result && result.catch) {
        result.catch(function () {
          showToast(isEn ? "Unable to play this audio" : "无法播放该音频");
          setPlaying(false);
        });
      }
    }

    function togglePlay() {
      if (!tracks.length) {
        showToast(isEn ? "No playable audio files" : "没有可播放的音频文件");
        return;
      }
      if (currentIndex === -1) {
        playTrack(0);
        return;
      }
      var player = ensureAudio();
      if (player.paused) {
        var result = player.play();
        if (result && result.catch) {
          result.catch(function () {
            showToast(isEn ? "Unable to play this audio" : "无法播放该音频");
            setPlaying(false);
          });
        }
      } else {
        player.pause();
      }
    }

    function next(delta) {
      if (!tracks.length) return;
      if (currentIndex === -1) {
        playTrack(0);
        return;
      }
      var index = (currentIndex + delta + tracks.length) % tracks.length;
      playTrack(index);
    }

    function openPanel() {
      if (isOpen) return;
      isOpen = true;
      panel.classList.add("show");
      panel.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      renderList();
    }

    function closePanel() {
      if (!isOpen) return;
      isOpen = false;
      panel.classList.remove("show");
      panel.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
    }

    function loadPlaylist() {
      if (!("fetch" in window)) {
        renderList();
        return;
      }
      var url = musicCfg.playlist || "/assets/audio/playlist.json";
      fetch(url + "?v=" + Date.now(), { cache: "no-store" })
        .then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          return response.json();
        })
        .then(function (data) {
          var list = (data && data.tracks) || [];
          var loaded = list
            .filter(function (item) {
              return item && item.src;
            })
            .map(function (item) {
              return {
                title: item.title || (isEn ? "Untitled" : "未命名"),
                artist: item.artist || "DomeOS Team",
                album: item.album || "",
                src: item.src
              };
            });

          if (!loaded.length) loaded = [defaultTrack];

          var currentTrack =
            currentIndex >= 0 ? tracks[currentIndex] : null;
          tracks = loaded.concat(
            tracks.filter(function (track) {
              return track.local;
            })
          );
          if (audio) audio.loop = tracks.length === 1;

          if (currentTrack) {
            currentIndex = -1;
            for (var i = 0; i < tracks.length; i++) {
              if (tracks[i].src === currentTrack.src) {
                currentIndex = i;
                break;
              }
            }
          }

          renderList();
          if (currentIndex >= 0) updateNow();
        })
        .catch(function () {
          renderList();
        });
    }

    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      if (isOpen) closePanel();
      else openPanel();
    });

    closeBtn.addEventListener("click", closePanel);
    playBtn.addEventListener("click", togglePlay);
    prevBtn.addEventListener("click", function () {
      next(-1);
    });
    nextBtn.addEventListener("click", function () {
      next(1);
    });

    progressEl.addEventListener("click", function (event) {
      if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
      var rect = progressEl.getBoundingClientRect();
      var percent = (event.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      audio.currentTime = percent * audio.duration;
      updateProgress();
    });

    document.addEventListener("click", function (event) {
      if (
        isOpen &&
        !panel.contains(event.target) &&
        !btn.contains(event.target)
      ) {
        closePanel();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) closePanel();
    });

    setPlaying(false);
    renderList();
    updateNow();
    loadPlaylist();
  })();
})();