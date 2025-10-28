# 数据库迁移指南

## ❗️ 问题说明

在导入原始数据库迁移脚本时出现错误：
```
ERROR: cannot drop column user_id of table travel_plans because other objects depend on it
```

**原因**：现有的数据库结构中有多个视图和策略依赖于 `user_id` 列，直接删除会导致依赖错误。

## ✅ 解决方案

已创建安全迁移脚本，采用非破坏性迁移策略：

### 1. 安全迁移脚本
- **文件**：`user-auth-safe-migration.sql`
- **策略**：只添加新表和新列，不删除现有结构
- **特点**：完全兼容现有应用

### 2. 迁移步骤

#### 第一步：导入安全迁移脚本
在Supabase SQL编辑器中运行：
```sql
-- 复制 user-auth-safe-migration.sql 的内容到Supabase SQL编辑器
-- 然后点击"运行"
```

#### 第二步：验证迁移结果
检查以下内容是否创建成功：
- ✅ `app_users` 表
- ✅ `user_sessions` 表  
- ✅ `app_user_id` 列（在travel_plans表中）
- ✅ 所有必要的函数和索引

#### 第三步：测试功能
使用测试账号登录：
- 用户名：`testuser`，密码：`password123`
- 用户名：`demo`，密码：`demo123`

## 🔄 迁移策略说明

### 非破坏性设计
- **保留现有列**：不删除 `user_id` 列，保持现有功能
- **添加新列**：新增 `app_user_id` 用于新认证系统
- **兼容性**：现有应用继续使用 `user_id`，新功能使用 `app_user_id`

### 数据流设计
```
新用户注册 → app_users表 → app_user_id → travel_plans表
现有用户 → 继续使用user_id（保持不变）
```

## 🛠️ 前端代码适配

前端代码已经适配新的数据库结构：

### 1. 认证服务 (`authService.js`)
- 使用新的数据库函数进行用户认证
- 支持会话管理
- 兼容性处理

### 2. 数据服务 (`supabaseAuthService.js`)
- 使用 `app_user_id` 进行数据关联
- 支持用户专属数据查询
- 保持现有功能不变

## 📊 数据库结构对比

### 迁移前
```sql
travel_plans (
    id UUID,
    user_id UUID,  -- 现有列（保持不变）
    ...其他字段
)
```

### 迁移后
```sql
travel_plans (
    id UUID,
    user_id UUID,        -- 现有列（保持不变）
    app_user_id UUID,     -- 新增列（用于新认证系统）
    ...其他字段
)

app_users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    ...其他字段
)
```

## 🚀 部署步骤

### 1. 数据库部署
1. 登录Supabase控制台
2. 进入SQL编辑器
3. 复制 `user-auth-safe-migration.sql` 内容
4. 运行SQL脚本
5. 验证迁移结果

### 2. 应用部署
1. 确保环境变量配置正确
2. 构建前端应用：`npm run build`
3. 部署到Netlify或其他平台

### 3. 功能测试
1. 注册新用户
2. 使用测试账号登录
3. 创建用户专属行程
4. 验证数据隔离

## 🔧 故障排除

### 常见问题

#### Q1: 迁移脚本运行失败
**解决**：检查SQL语法错误，确保Supabase项目有足够权限

#### Q2: 新用户无法创建行程
**解决**：检查 `app_user_id` 外键约束是否正确设置

#### Q3: 现有用户数据丢失
**解决**：不会发生！迁移脚本不删除任何现有数据

#### Q4: 认证功能不工作
**解决**：检查环境变量配置，验证数据库连接

### 日志检查
- 浏览器控制台错误信息
- Supabase日志面板
- 网络请求状态

## 📈 迁移后优化（可选）

### 阶段一：并行运行
- 新功能使用 `app_user_id`
- 现有功能继续使用 `user_id`

### 阶段二：数据迁移（可选）
- 将现有用户数据迁移到新系统
- 更新关联关系

### 阶段三：清理（可选）
- 在确认所有功能正常后
- 可考虑清理旧的 `user_id` 相关结构

## 🎯 成功标志

- ✅ 新用户可正常注册登录
- ✅ 用户可创建专属行程
- ✅ 数据隔离正常工作
- ✅ 现有功能不受影响
- ✅ 无控制台错误

---

**迁移完成时间**：2025-10-28  
**技术支持**：项目文档和代码注释  
**备份建议**：在迁移前备份数据库