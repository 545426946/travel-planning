# 🌍 轻量旅行规划 - 网页版应用

一个现代化的网页版旅行规划应用，专为大学生设计，提供轻量化的旅行规划服务。

## ✨ 功能特色

### 🎯 核心功能
- **智能行程规划** - 基于模板的快速行程创建
- **结伴匹配系统** - 寻找志同道合的旅行伙伴
- **预算管理** - 精确的旅行预算计算
- **目的地推荐** - 智能推荐热门旅行地

### 🎨 界面设计
- **现代化UI** - 采用渐变设计和毛玻璃效果
- **响应式布局** - 完美适配各种设备尺寸
- **流畅动画** - 丰富的交互动画效果
- **直观操作** - 简单易用的用户界面

### 🔧 技术架构
- **前端技术** - 纯HTML/CSS/JavaScript开发
- **后端集成** - Supabase云数据库服务
- **实时数据** - 支持实时数据同步
- **PWA支持** - 可安装为桌面应用

## 🚀 快速开始

### 环境要求
- 现代浏览器（Chrome、Firefox、Safari、Edge）
- 网络连接（用于Supabase服务）

### 安装步骤

1. **克隆项目**
```bash
git clone <项目地址>
cd travel-planner-web
```

2. **配置Supabase**
   - 在 `web-app/js/supabase-client.js` 中配置您的Supabase项目信息
   - 替换 `supabaseUrl` 和 `supabaseKey`

3. **启动应用**
```bash
# 使用本地服务器（推荐）
cd web-app
python -m http.server 8000

# 或使用其他本地服务器
# npx serve web-app
# php -S localhost:8000 -t web-app
```

4. **访问应用**
打开浏览器访问 `http://localhost:8000`

## 📁 项目结构

```
web-app/
├── index.html          # 主页面
├── styles/
│   └── main.css        # 主样式文件
├── js/
│   ├── app.js          # 主应用逻辑
│   └── supabase-client.js # Supabase客户端
├── assets/
│   └── images/         # 图片资源
└── README.md           # 说明文档
```

## 🔧 配置说明

### Supabase配置
在 `js/supabase-client.js` 中配置：

```javascript
this.supabaseUrl = 'https://your-project.supabase.co';
this.supabaseKey = 'your-anon-key';
```

### 数据库迁移
使用之前创建的 `supabase-migration.sql` 脚本初始化数据库。

## 🎯 使用指南

### 用户注册登录
1. 点击右上角"登录/注册"按钮
2. 选择注册或登录标签
3. 填写相应信息完成认证

### 创建行程
1. 点击"开始规划"按钮
2. 选择目的地和旅行日期
3. 设置预算和行程安排
4. 保存行程计划

### 寻找同伴
1. 进入"找同伴"页面
2. 浏览现有的结伴请求
3. 或发布自己的结伴需求

## 🔄 开发说明

### 添加新功能
1. 在 `app.js` 中添加新的方法
2. 在 `index.html` 中添加对应的HTML结构
3. 在 `main.css` 中添加样式

### 数据模型
应用使用以下主要数据表：
- `profiles` - 用户资料
- `travel_plans` - 行程规划
- `companion_requests` - 结伴请求
- `cities` - 城市数据
- `plan_templates` - 行程模板

## 🚀 部署指南

### 静态网站部署
可以将 `web-app` 目录部署到任何静态网站托管服务：

- **Vercel** - 直接拖拽部署
- **Netlify** - Git连接自动部署
- **GitHub Pages** - 免费静态托管
- **阿里云OSS** - 国内加速

### 环境变量配置
在生产环境中，建议使用环境变量配置Supabase密钥。

## 📱 PWA支持

应用支持PWA（渐进式Web应用），可以安装到桌面：

1. 在支持PWA的浏览器中访问应用
2. 点击地址栏的安装图标
3. 或通过菜单选择"安装应用"

## 🔍 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🐛 问题排查

### 常见问题

1. **Supabase连接失败**
   - 检查网络连接
   - 验证API密钥配置
   - 确认数据库服务状态

2. **样式显示异常**
   - 清除浏览器缓存
   - 检查CSS文件加载

3. **功能无法使用**
   - 查看浏览器控制台错误信息
   - 确认JavaScript文件正确加载

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

## 📄 许可证

本项目采用MIT许可证。

## 📞 技术支持

如有问题请提交Issue或联系开发团队。

---

**🎉 开始您的旅行规划之旅吧！**