# 🚀 轻量旅行规划网页版应用

一款专为大学生设计的轻量化旅行规划网页应用，使用Supabase作为后端服务。

## ✨ 特性

- 🎯 **精准定位** - 专为大学生群体设计，预算控制在200-500元
- 🗺️ **智能规划** - 基于模板的快速行程规划
- 👥 **同校结伴** - 寻找志同道合的旅行伙伴
- 📱 **轻量体验** - 简洁界面，快速响应
- 🔐 **安全可靠** - Supabase后端，数据安全有保障

## 🏗️ 技术架构

### 前端技术栈
- **纯HTML/CSS/JavaScript** - 原生Web开发
- **响应式设计** - 适配各种设备
- **PWA支持** - 可安装为桌面应用

### 后端技术栈
- **Supabase** - 后端即服务
- **PostgreSQL** - 数据库
- **Row Level Security** - 行级安全策略
- **实时订阅** - 实时数据更新

## 📋 功能模块

### 核心功能
- [x] 用户注册登录（邮箱验证码）
- [x] 行程规划创建和编辑
- [x] 智能预算计算
- [x] 结伴需求发布和匹配
- [x] 个人资料管理
- [x] 行程模板库

### 特色功能
- [x] 同校伙伴匹配算法
- [x] 预算智能分配
- [x] 实时消息通知
- [x] 离线数据缓存

## 🚀 快速开始

### 环境要求
- Node.js 14.0+ 或 Python 3.6+
- 现代浏览器
- Supabase账户

### 安装步骤

1. **克隆项目**
```bash
git clone <项目地址>
cd travel-planner-web
```

2. **安装依赖**
```bash
npm install
```

3. **配置Supabase**
   - 在Supabase控制台创建新项目
   - 复制项目URL和anon key
   - 更新 `web-app/js/supabase-client.js` 中的配置

4. **启动开发**
```bash
# 方式1：使用Node.js服务器
npm run dev

# 方式2：使用Python服务器
npm start

# 方式3：使用serve包
npm run serve
```

5. **访问应用**
   打开浏览器访问 `http://localhost:8000`

## 📁 项目结构

```
web-app/
├── index.html              # 主页面（单页应用）
├── styles/
│   └── main.css           # 现代化样式系统
├── js/
│   ├── app.js             # 主应用逻辑
│   ├── supabase-client.js # Supabase集成
│   └── pages/             # 各页面逻辑
│       ├── plans.js       # 行程规划
│       ├── companion.js   # 找同伴
│       └── profile.js     # 个人中心
├── start-server.js        # 本地服务器
├── package.json           # 项目配置
└── deploy-config.json    # 部署配置
```

## 🔧 开发指南

### 数据库设计
项目使用5个核心数据表：

1. **profiles** - 用户资料表
2. **travel_plans** - 行程规划表  
3. **companion_requests** - 结伴需求表
4. **cities** - 城市数据表
5. **plan_templates** - 行程模板表

### API调用示例

```javascript
// 用户登录
import { signInWithEmail } from '../utils/supabase-client'

const result = await signInWithEmail('user@example.com')
if (result.success) {
  // 登录成功
}

// 创建行程
import { createTravelPlan } from '../utils/supabase-client'

const planData = {
  title: '北京文化之旅',
  destination: '北京',
  startDate: '2024-01-01',
  endDate: '2024-01-03',
  totalBudget: 900
}

const result = await createTravelPlan(planData)
```

### 安全策略
所有数据表都启用了行级安全(RLS)，确保：
- 用户只能访问自己的数据
- 公开数据可安全共享
- 防止未授权访问

## 🎯 部署指南

### 开发环境
1. 使用微信开发者工具测试
2. 配置测试环境Supabase项目
3. 启用调试模式

### 生产环境
1. 创建生产环境Supabase项目
2. 执行数据库迁移脚本
3. 配置域名和SSL证书
4. 提交微信审核

## 📊 性能优化

### 数据库优化
- 合理使用索引
- 查询结果分页
- 数据缓存策略

### 前端优化
- 图片懒加载
- 数据本地缓存
- 请求合并和去重

## 🐛 常见问题

### Q: Supabase连接失败
**A:** 检查项目URL和anon key是否正确，确认网络连接正常。

### Q: 用户登录异常  
**A:** 验证邮箱格式正确，检查验证码是否过期。

### Q: 数据权限错误
**A:** 确认RLS策略配置正确，用户已登录。

### Q: 实时订阅不工作
**A:** 检查网络连接，确认订阅权限设置。

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 代码贡献
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 问题反馈
- 使用GitHub Issues报告bug
- 提出新功能建议
- 分享使用体验

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目和技术：

- [Supabase](https://supabase.com) - 优秀的后端即服务平台
- [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/) - 强大的移动端框架
- [PostgreSQL](https://www.postgresql.org/) - 可靠的关系型数据库

## 📞 技术支持

- 📧 邮箱支持: support@example.com
- 💬 社区讨论: [GitHub Discussions](链接)
- 🐛 问题反馈: [GitHub Issues](链接)

---

**立即开始您的旅行规划之旅！** 🎉

*最后更新: ${new Date().toLocaleString('zh-CN')}*