# 用户认证功能部署指南

## 🎯 功能概述

已成功实现完整的用户认证系统，包括：
- ✅ 用户注册（用户名+密码）
- ✅ 用户登录
- ✅ 用户会话管理
- ✅ 用户专属行程管理
- ✅ 个人中心页面

## 📋 部署前准备

### 1. Supabase 数据库设置

#### 创建Supabase项目
1. 访问 [Supabase官网](https://supabase.com)
2. 创建新项目或使用现有项目
3. 获取项目URL和anon key

#### 导入数据库表结构
运行以下SQL语句创建用户认证相关的表：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 行程表（已关联用户）
CREATE TABLE IF NOT EXISTS travel_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    days INTEGER NOT NULL DEFAULT 3,
    budget DECIMAL(10,2) NOT NULL DEFAULT 0,
    travelers INTEGER NOT NULL DEFAULT 2,
    destination VARCHAR(100),
    status VARCHAR(20) DEFAULT 'planning',
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_created_at ON travel_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 启用行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "用户只能查看自己的数据" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户只能修改自己的数据" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能查看自己的行程" ON travel_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的行程" ON travel_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能修改自己的行程" ON travel_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的行程" ON travel_plans FOR DELETE USING (auth.uid() = user_id);
```

### 2. 环境变量配置

在项目根目录创建 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 应用配置
VITE_APP_NAME=旅行规划轻量化应用
VITE_APP_VERSION=1.0.0
```

## 🚀 部署步骤

### 1. Netlify 部署

#### 方法一：通过GitHub自动部署
1. 将代码推送到GitHub仓库
2. 登录 [Netlify](https://netlify.com)
3. 选择 "New site from Git"
4. 连接GitHub仓库
5. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 添加环境变量（在Netlify控制台）

#### 方法二：手动部署
```bash
# 构建项目
npm run build

# 将dist目录拖拽到Netlify部署界面
```

### 2. Vercel 部署（备选）

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 🔧 功能测试

### 1. 用户注册测试
- 访问应用首页
- 点击"注册"按钮
- 填写用户名和密码
- 验证注册成功提示

### 2. 用户登录测试
- 使用注册的账号登录
- 验证登录状态显示
- 检查导航栏用户信息

### 3. 行程管理测试
- 登录后创建新行程
- 验证行程与用户ID关联
- 检查个人中心统计信息

## 🐛 常见问题解决

### 1. 数据库连接失败
**症状**: "数据库连接未初始化"错误
**解决**: 
- 检查Supabase URL和Key是否正确
- 确认网络连接正常
- 验证Supabase项目状态

### 2. 用户认证失败
**症状**: "请先登录"错误
**解决**:
- 检查浏览器本地存储是否被禁用
- 验证session管理逻辑
- 检查路由守卫配置

### 3. 行程数据不显示
**症状**: 个人中心无行程数据
**解决**:
- 检查数据库连接
- 验证用户ID关联
- 检查数据查询逻辑

## 📊 功能验证清单

- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 会话保持功能正常
- [ ] 用户专属行程创建正常
- [ ] 个人中心数据显示正常
- [ ] 用户统计信息计算正确
- [ ] 退出登录功能正常

## 🔒 安全注意事项

1. **密码安全**: 使用bcrypt进行密码哈希
2. **会话管理**: 使用安全的session存储机制
3. **数据隔离**: 确保用户只能访问自己的数据
4. **输入验证**: 所有用户输入都经过验证
5. **错误处理**: 避免泄露敏感信息

## 📞 技术支持

如遇部署问题，请检查：
1. 环境变量配置是否正确
2. Supabase项目是否正常运行
3. 网络连接是否正常
4. 浏览器控制台错误信息

## 🎉 部署成功标志

1. ✅ 应用可正常访问
2. ✅ 用户注册/登录功能正常
3. ✅ 行程创建与管理正常
4. ✅ 个人中心数据正确显示
5. ✅ 无控制台错误信息

---

**部署完成时间**: 2025-10-28  
**版本**: v1.0.0  
**技术支持**: 项目文档和代码注释