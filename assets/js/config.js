/* ============================================================
   DomeOS AI 站点配置
   所有链接、版本号、文件名集中在这里，改一处全站生效。
   ============================================================ */

window.DOMEOS_CONFIG = {
  // GitHub
  githubUser: "liu7pro",
  projectRepo: "DomeOS-AI-Agent-with-WinUI-3",

  // 版本信息（静态兜底；页面会优先读取 assets/data/release.json）
  version: "v3.0",
  codename: "Really",
  releaseDate: "2026-11-07",
  fileSize: "约 528 MB",
  fileSizeEn: "~528 MB",

  // 安装包直链（留空则跳转到 Releases 页面）
  downloadUrl:
    "https://github.com/liu7pro/DomeOS-AI-Agent-with-WinUI-3/releases/download/Really/DomeOS-AI-Setup-3.0.exe",

  // 音乐播放器（在线列表来自 assets/audio/playlist.json）
  music: {
    src: "/assets/audio/track-01.mp3",
    title: "《您好，真心已解锁》",
    artist: "DeepSeek",
    album: "《你好，按条款关怀》",
    playlist: "/assets/audio/playlist.json"
  },
};