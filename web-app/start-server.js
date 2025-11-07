// 网页应用启动脚本 (ES模块版本)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 8086;
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // 处理前端路由 - 所有路由都返回index.html
    let filePath;
    
    // 如果请求的是静态资源（css, js, images等），直接返回文件
    const extname = path.extname(req.url).toLowerCase();
    if (extname && mimeTypes[extname]) {
        filePath = '/dist' + req.url;
    } else {
        // 所有其他路由（包括/admin）都返回index.html，由前端路由处理
        filePath = '/dist/index.html';
    }
    
    filePath = path.join(__dirname, filePath);
    const contentType = mimeTypes[extname] || 'text/html';
    
    // 读取文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在，返回404
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - 页面未找到</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #666; }
                            a { color: #007bff; text-decoration: none; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - 页面未找到</h1>
                        <p>请求的页面不存在。</p>
                        <p><a href="/">返回首页</a></p>
                    </body>
                    </html>
                `);
            } else {
                // 服务器错误
                res.writeHead(500);
                res.end(`服务器错误: ${error.code}`);
            }
        } else {
            // 成功返回文件
            const headers = { 'Content-Type': contentType };
            if (contentType === 'text/html' || contentType === 'text/css' || contentType === 'text/javascript') {
                headers['Content-Type'] = contentType + '; charset=utf-8';
            }
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`
🚀 轻量旅行规划网页版应用已启动！

📍 本地访问地址: http://localhost:${port}
🌐 网络访问地址: http://${getLocalIP()}:${port}

📋 功能特色:
✅ 现代化响应式设计
✅ Supabase后端集成
✅ 实时数据同步
✅ PWA支持

💡 使用说明:
1. 在浏览器中打开上述地址
2. 配置Supabase项目信息
3. 开始使用旅行规划功能

按 Ctrl+C 停止服务器
    `);
});

// 获取本地IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const netInterface of interfaces[name]) {
            if (netInterface.family === 'IPv4' && !netInterface.internal) {
                return netInterface.address;
            }
        }
    }
    return 'localhost';
}