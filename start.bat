@echo off
echo ========================================
echo   轻量旅行规划网页版应用启动脚本
echo ========================================
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js已安装

REM 进入web-app目录并安装依赖
cd web-app

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo 📦 正在安装依赖包...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在，跳过安装
)

echo.
echo 🚀 启动开发服务器...
echo 应用将在 http://localhost:5173 启动
echo.
echo 按 Ctrl+C 停止服务器
echo.

REM 启动Vite开发服务器
npm run dev

pause