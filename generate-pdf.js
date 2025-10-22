// PDF生成脚本 - 将Markdown需求文档转换为PDF
const fs = require('fs');
const path = require('path');

// 创建HTML模板用于PDF生成
const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>轻量旅行规划网页版应用 - 项目需求文档</title>
    <style>
        /* 全局样式 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 0;
            margin: 0;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
        }
        
        /* 页眉页脚 */
        @page {
            size: A4;
            margin: 20mm;
            
            @top-left {
                content: "轻量旅行规划网页版应用";
                font-size: 10pt;
                color: #666;
            }
            
            @top-right {
                content: "项目需求文档";
                font-size: 10pt;
                color: #666;
            }
            
            @bottom-center {
                content: "第 " counter(page) " 页";
                font-size: 10pt;
                color: #666;
            }
        }
        
        /* 标题样式 */
        h1 {
            font-size: 24pt;
            color: #2c3e50;
            text-align: center;
            margin: 30px 0 20px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        h2 {
            font-size: 18pt;
            color: #34495e;
            margin: 25px 0 15px;
            border-left: 4px solid #3498db;
            padding-left: 10px;
        }
        
        h3 {
            font-size: 14pt;
            color: #2c3e50;
            margin: 20px 0 10px;
        }
        
        h4 {
            font-size: 12pt;
            color: #34495e;
            margin: 15px 0 8px;
        }
        
        /* 段落样式 */
        p {
            margin: 10px 0;
            text-align: justify;
            font-size: 11pt;
        }
        
        /* 表格样式 */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        /* 列表样式 */
        ul, ol {
            margin: 10px 0 10px 30px;
        }
        
        li {
            margin: 5px 0;
            font-size: 11pt;
        }
        
        /* 代码块样式 */
        pre {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 12px;
            margin: 10px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
        }
        
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
        }
        
        /* 引用样式 */
        blockquote {
            border-left: 4px solid #3498db;
            background: #f8f9fa;
            padding: 15px 20px;
            margin: 15px 0;
            font-style: italic;
        }
        
        /* 分割线 */
        hr {
            border: none;
            border-top: 2px solid #e9ecef;
            margin: 20px 0;
        }
        
        /* 特殊标记 */
        .important {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 15px 0;
        }
        
        .warning {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 15px 0;
        }
        
        .success {
            background: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            margin: 15px 0;
        }
        
        /* 页眉页脚内容隐藏（在PDF中显示） */
        .header, .footer {
            display: none;
        }
        
        /* 打印样式 */
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .container {
                margin: 0;
                padding: 0;
                max-width: none;
            }
            
            .no-print {
                display: none;
            }
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .container {
                padding: 10mm;
            }
            
            h1 {
                font-size: 20pt;
            }
            
            h2 {
                font-size: 16pt;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 文档内容将由脚本动态插入 -->
        <div id="content"></div>
    </div>
</body>
</html>
`;

// Markdown到HTML的简单转换函数
function markdownToHtml(markdown) {
    return markdown
        // 标题
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        
        // 表格
        .replace(/\|(.+)\|\n\|[-:| -]+\|\n((?:\|.+\\|\n?)+)/g, (match, headers, rows) => {
            const headerCells = headers.split('|').filter(cell => cell.trim()).map(cell => 
                `<th>${cell.trim()}</th>`
            ).join('');
            
            const tableRows = rows.split('\n').filter(row => row.trim()).map(row => {
                const cells = row.split('|').filter(cell => cell.trim()).map(cell => 
                    `<td>${cell.trim()}</td>`
                ).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            
            return `<table><thead><tr>${headerCells}</tr></thead><tbody>${tableRows}</tbody></table>`;
        })
        
        // 列表
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/^\\d+\\. (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
        
        // 代码块
        .replace(/```([\\s\\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        
        // 引用
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        
        // 分割线
        .replace(/^-{3,}$/gm, '<hr>')
        
        // 段落
        .replace(/(^|\\n)([^#\\n].+?)(?=\\n\\n|\\n#|$)/gs, '<p>$2</p>')
        
        // 特殊标记
        .replace(/:::important\\n([\\s\\S]*?)\\n:::/g, '<div class="important">$1</div>')
        .replace(/:::warning\\n([\\s\\S]*?)\\n:::/g, '<div class="warning">$1</div>')
        .replace(/:::success\\n([\\s\\S]*?)\\n:::/g, '<div class="success">$1</div>');
}

// 生成PDF的主函数
async function generatePdf() {
    try {
        // 读取Markdown需求文档
        const markdownContent = fs.readFileSync('项目需求文档.md', 'utf8');
        
        // 转换为HTML
        const htmlContent = markdownToHtml(markdownContent);
        
        // 创建完整的HTML文档
        const fullHtml = htmlTemplate.replace('<div id="content"></div>', htmlContent);
        
        // 保存HTML文件（用于预览）
        fs.writeFileSync('需求文档.html', fullHtml);
        
        console.log('✅ HTML文档已生成: 需求文档.html');
        
        // 提供PDF生成说明
        console.log(`
📋 PDF生成说明：

由于Node.js环境限制，无法直接生成PDF文件。请使用以下方法之一：

方法1: 浏览器打印（推荐）
1. 用浏览器打开 "需求文档.html"
2. 按 Ctrl+P (Windows) 或 Cmd+P (Mac)
3. 选择"另存为PDF"
4. 调整边距设置为"无"
5. 点击"保存"

方法2: 在线转换工具
1. 访问 https://www.sejda.com/html-to-pdf
2. 上传 "需求文档.html"
3. 下载生成的PDF文件

方法3: 使用puppeteer（需要安装）
运行: npx puppeteer需求文档.html 需求文档.pdf

📄 生成的PDF将包含完整的项目需求文档，适合项目评审和开发参考。
        `);
        
    } catch (error) {
        console.error('❌ 生成PDF时发生错误:', error);
    }
}

// 执行生成
generatePdf();