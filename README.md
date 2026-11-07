# DomeOS AI — 官网

DomeOS AI 的 GitHub Pages 静态站点，包含首页、下载页与使用指南。

纯 HTML + CSS + JS，无构建步骤、无第三方依赖，直接由 GitHub Pages 托管。

- 线上地址：<https://liu7pro.github.io>
- 项目仓库：<https://github.com/liu7pro/DomeOS-AI-Agent-with-WinUI-3>

## 目录结构

```
.
├── index.html            # 首页：Hero、界面示意、功能分组、下载 CTA
├── download.html         # 下载页：安装包、系统要求、更新说明
├── guide.html            # 使用指南：安装、模型服务、数据、构建、FAQ
├── 404.html              # 自定义 404
├── assets/
│   ├── css/style.css     # 全部样式（深色 / 浅色主题）
│   ├── js/config.js      # 链接、版本号、安装包地址（改这一处即可）
│   ├── js/main.js        # 主题切换、菜单、滚动动画、目录高亮
│   └── img/              # logo.png、icon-32.png、app.ico（来自项目仓库）
├── .nojekyll             # 跳过 Jekyll，确保静态资源原样发布
└── deploy.ps1            # 初始化并推送到 <用户名>.github.io
```

## 修改内容

- **链接与版本**：`assets/js/config.js`
  - `githubUser` / `projectRepo`：GitHub 仓库位置
  - `version` / `codename` / `releaseDate` / `fileSize`：全站版本信息
  - `downloadUrl`：安装包直链，留空则跳转 Releases
- **文案**：直接修改各 HTML 文件
- **配色与排版**：`assets/css/style.css` 顶部的 CSS 变量

图标来自项目仓库 `Assets/logo.png`、`Assets/icon-32.png`、`Assets/app.ico`，替换时保持同名即可。

## 本地预览

直接双击 `index.html`，或起一个本地服务：

```powershell
python -m http.server 8080
# http://localhost:8080
```

## 部署

仓库名必须是 `<用户名>.github.io`（Public）：

```powershell
.\deploy.ps1 -GitHubUser liu7pro
```

推送后进入 `Settings → Pages`：

- **Source**：`Deploy from a branch`
- **Branch**：`main`，目录 `/ (root)`
- 保存后等待 1–2 分钟，访问 `https://liu7pro.github.io`

> 若网页上传而不是用 Git：在仓库中选择 **Add file → Upload files**，把本目录所有文件拖入。`.nojekyll` 是隐藏文件，必要时在仓库中手动新建一个空文件。

## 自定义域名（可选）

1. 在 `Settings → Pages → Custom domain` 填入域名；
2. 在仓库根目录新建 `CNAME` 文件，内容为域名；
3. DNS 添加记录：根域名用 `A`，子域名用 `CNAME` 指向 `<用户名>.github.io`；
4. 开启 **Enforce HTTPS**。
