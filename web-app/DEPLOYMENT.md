# Netlify 部署指南

## 项目概述
旅行规划轻量化项目 - Vue.js + Supabase + Mistral AI

## 部署步骤

### 1. 准备部署文件
确保以下文件已创建：
- `netlify.toml` - Netlify配置文件
- `.env.production` - 生产环境变量
- `dist/` - 构建输出目录

### 2. 构建项目
```bash
cd web-app
npm install
npm run build
```

### 3. Netlify部署方式

#### 方式一：拖拽部署（推荐）
1. 访问 [Netlify](https://app.netlify.com/)
2. 登录您的账户
3. 将 `web-app/dist` 文件夹拖拽到部署区域
4. 等待部署完成

#### 方式二：GitHub集成
1. 将项目推送到GitHub仓库
2. 在Netlify中连接GitHub仓库
3. 配置构建设置：
   - 构建命令：`npm run build`
   - 发布目录：`dist`
4. 部署分支：`master` 或 `main`

#### 方式三：CLI部署
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=dist
```

## 环境变量配置

在Netlify控制台中设置以下环境变量：

```env
VITE_SUPABASE_URL=https://hrgskukcnlwmjbpvitsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ3NrdWtjbmx3bWpicHZpdHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTE2ODksImV4cCI6MjA3NjU4NzY4OX0.zj1ZTOgChM8bKtIh3w2Z8oSftGMocho_COKkCp6FDhY

VITE_AI_API_KEY=E8L3fryNUIsAoWvROdNrumpwFTtfuCBL
VITE_AI_API_URL=https://api.mistral.ai/v1/chat/completions
VITE_AI_MODEL=mistral-small-latest
```

## 项目结构
```
web-app/
├── dist/                 # 构建输出目录
├── src/                  # 源代码
├── netlify.toml          # Netlify配置
├── .env.production       # 生产环境变量
├── vite.config.js        # Vite配置
└── package.json          # 项目依赖
```

## 功能特性
- ✅ Vue.js 3 + Vite 现代化前端框架
- ✅ Ant Design Vue UI组件库
- ✅ Supabase 后端即服务
- ✅ Mistral AI 智能行程规划
- ✅ 响应式设计，支持移动端
- ✅ 实时数据同步

## 部署验证
部署完成后，请测试以下功能：
1. 创建新行程
2. 查看行程列表
3. 编辑行程活动
4. AI智能规划
5. 数据持久化

## 故障排除

### 常见问题
1. **构建失败**：检查Node.js版本（推荐18+）
2. **环境变量未生效**：在Netlify控制台重新设置
3. **路由404**：确保SPA重定向配置正确
4. **API连接失败**：检查Supabase和AI服务配置

### 技术支持
如有部署问题，请检查：
- 控制台错误日志
- 网络请求状态
- 环境变量配置