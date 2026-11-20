  // 音乐入口：跳转到独立的播放器页面
  (function () {
    var actions = document.querySelector(".nav-actions");
    if (!actions) return;

    var isEn =
      (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;

    var link = document.createElement("a");
    link.className = "music-toggle";
    link.href = "/music/";
    link.setAttribute(
      "aria-label",
      isEn ? "Open music player" : "打开音乐播放器"
    );
    link.title = isEn ? "Open music player" : "打开音乐播放器";
    link.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>';

    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn && themeBtn.parentNode === actions) {
      actions.insertBefore(link, themeBtn);
    } else {
      actions.appendChild(link);
    }
  })();
})();
