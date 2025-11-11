Write-Host "========================================" -ForegroundColor Green
Write-Host "   轻量旅行规划网页版应用启动脚本" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 检查Node.js是否安装
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js已安装 ($nodeVersion)" -ForegroundColor Green
} else {
    Write-Host "❌ 错误：未检测到Node.js，请先安装Node.js" -ForegroundColor Red
    Write-Host "下载地址：https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

# 进入web-app目录
Set-Location "web-app"

# 检查node_modules是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 正在安装依赖包..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "✅ 依赖已存在，跳过安装" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 启动开发服务器..." -ForegroundColor Cyan
Write-Host "应用将在 http://localhost:5173 启动" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host ""

# 启动Vite开发服务器
npm run dev