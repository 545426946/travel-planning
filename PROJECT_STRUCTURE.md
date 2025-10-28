# 旅行规划项目结构说明

## 项目概述
这是一个基于Vue 3 + Vite的旅行规划Web应用，支持用户注册登录、AI智能行程规划、行程管理等功能。

## 目录结构

```
旅行规划轻量化项目/
├── web-app/                    # 前端应用目录
│   ├── src/
│   │   ├── components/        # 可复用组件
│   │   │   ├── AIPlanGenerator.vue    # AI行程生成器
│   │   │   └── AuthModal.vue          # 登录注册模态框
│   │   ├── views/             # 页面组件
│   │   │   ├── Home.vue               # 首页
│   │   │   ├── Plans.vue              # 行程列表页
│   │   │   ├── PlanDetail.vue        # 行程详情页
│   │   │   ├── Destinations.vue       # 热门景点页
│   │   │   └── Profile.vue            # 个人中心页
│   │   ├── services/          # 服务层
│   │   │   ├── authService.js         # 用户认证服务
│   │   │   ├── supabaseAuthService.js # 用户专属数据库服务
│   │   │   ├── mistralService.js      # AI智能规划服务
│   │   │   └── aiService.js          # AI服务（备用）
│   │   ├── stores/            # 状态管理
│   │   │   └── authStore.js           # 用户认证状态管理
│   │   ├── constants/         # 常量定义
│   │   │   └── travel.js              # 旅行相关常量
│   │   ├── types/             # 类型定义
│   │   │   └── travel.js              # 旅行相关类型
│   │   ├── router/            # 路由配置
│   │   │   └── index.js               # 路由配置
│   │   ├── utils/             # 工具函数
│   │   ├── assets/            # 静态资源
│   │   ├── hooks/             # 自定义Hooks
│   │   ├── App.vue            # 根组件
│   │   └── main.js            # 应用入口
│   ├── package.json           # 项目依赖
│   ├── vite.config.js         # Vite配置
│   └── README.md              # 项目说明
├── database-schema.sql        # 数据库表结构
├── supabase-complete-schema.sql # 完整数据库结构
├── supabase-setup-guide.md   # Supabase配置指南
├── AUTH_DEPLOYMENT_GUIDE.md  # 认证部署指南
├── DATABASE_MIGRATION_GUIDE.md # 数据库迁移指南
├── WEB_APP_COMPLETION_REPORT.md # 项目完成报告
├── 项目需求文档.md            # 项目需求说明
├── 项目实施指南.md            # 项目开发指南
├── 启动说明.md               # 项目启动说明
├── README.md                 # 项目总览
└── package.json             # 根目录配置
```

## 核心功能模块

### 1. 用户认证系统
- **authService.js**: 用户登录、注册、会话管理
- **authStore.js**: 全局认证状态管理
- **AuthModal.vue**: 登录注册界面

### 2. 行程规划系统
- **Plans.vue**: 行程列表和创建
- **PlanDetail.vue**: 行程详情和编辑
- **AIPlanGenerator.vue**: AI智能行程生成

### 3. 数据服务层
- **supabaseAuthService.js**: 用户专属数据库操作
- **mistralService.js**: AI智能规划服务

### 4. 状态管理
- **authStore.js**: 集中管理用户认证状态
- 支持组件间状态共享和响应式更新

## 技术栈
- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **UI组件库**: Ant Design Vue
- **状态管理**: Vue Reactive + 自定义Store
- **后端服务**: Supabase (PostgreSQL)
- **AI服务**: Mistral AI
- **路由**: Vue Router

## 启动说明
```bash
# 进入前端目录
cd web-app

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 查看应用。