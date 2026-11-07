<#
  DomeOS AI — GitHub Pages 一键部署脚本
  用法：.\deploy.ps1 -GitHubUser 你的用户名

  前置条件：
  1. 已安装 Git
  2. 已在 GitHub 创建仓库 <用户名>.github.io（Public）
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$GitHubUser
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# ---------- 1. 写入 GitHub 用户名 ----------
$configPath = Join-Path $PSScriptRoot "assets/js/config.js"
$content = Get-Content -Path $configPath -Raw -Encoding UTF8
$content = $content -replace 'YOUR_GITHUB_USERNAME', $GitHubUser
[System.IO.File]::WriteAllText(
  $configPath,
  $content,
  (New-Object System.Text.UTF8Encoding($false))
)
Write-Host "[1/4] 已写入用户名：$GitHubUser"

# ---------- 2. 初始化仓库 ----------
if (-not (Test-Path ".git")) {
  git init | Out-Null
  git branch -M main
  Write-Host "[2/4] 已初始化 Git 仓库"
} else {
  Write-Host "[2/4] 已存在 Git 仓库，跳过初始化"
}

# 仅在本仓库内设置提交身份（不影响全局配置）
git config user.name $GitHubUser
git config user.email "$GitHubUser@users.noreply.github.com"

git add .
git commit -m "deploy: initialize DomeOS AI Pages site" 2>$null
Write-Host "[3/4] 已提交本地变更"

# ---------- 3. 推送 ----------
$repoUrl = "https://github.com/$GitHubUser/$GitHubUser.github.io.git"
git remote remove origin 2>$null
git remote add origin $repoUrl
Write-Host "[4/4] 正在推送到 $repoUrl"
git push -u origin main

Write-Host ""
Write-Host "推送完成。接下来："
Write-Host "  1. 打开 https://github.com/$GitHubUser/$GitHubUser.github.io/settings/pages"
Write-Host "  2. Source 选择 Deploy from a branch"
Write-Host "  3. Branch 选择 main，目录选择 / (root)，保存"
Write-Host "  4. 访问 https://$GitHubUser.github.io"
