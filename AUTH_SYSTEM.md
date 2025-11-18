# 用户认证和权限系统说明

## 概述

本项目已实现完整的用户认证和权限控制系统，确保每个用户只能访问和操作自己的数据。

## 核心功能

### 1. 用户认证 (utils/auth.js)

`Auth` 工具类提供了完整的认证功能：

#### 主要方法

- `getCurrentUser()` - 获取当前登录用户信息
- `getCurrentUserId()` - 获取当前用户ID
- `isLoggedIn()` - 检查是否已登录
- `requireLogin(showToast)` - 要求用户登录，未登录则跳转
- `canAccess(resourceUserId)` - 检查是否有权访问指定资源
- `requireAccess(resourceUserId, errorMessage)` - 验证访问权限
- `saveUserLogin(userInfo, rememberMe)` - 保存用户登录信息
- `clearUserLogin()` - 清除登录信息
- `isLoginExpired(expiryDays)` - 检查登录是否过期
- `refreshUserInfo(supabase)` - 刷新用户信息
- `generateToken(userId)` - 生成用户token

#### 使用示例

```javascript
const Auth = require('../../utils/auth').Auth

// 检查是否登录
if (!Auth.isLoggedIn()) {
  Auth.requireLogin() // 自动跳转到登录页
  return
}

// 获取当前用户ID
const userId = Auth.getCurrentUserId()

// 检查访问权限
if (!Auth.canAccess(resourceUserId)) {
  wx.showToast({ title: '无权访问', icon: 'none' })
  return
}
```

### 2. 数据库访问控制 (utils/database.js)

所有数据库操作都已集成权限验证：

#### 自动权限验证

所有涉及用户数据的操作都会自动验证权限：

- **行程管理** (`travelPlans`)
  - `getByUserId()` - 只能查询当前用户的行程
  - `getById()` - 自动验证是否有权访问该行程
  - `create()` - 自动设置为当前用户ID
  - `update()` - 验证权限后才能更新
  - `delete()` - 验证权限后才能删除

- **用户偏好** (`userPreferences`)
  - `getByUserId()` - 只能查询当前用户的偏好
  - `upsert()` - 自动设置为当前用户ID

- **收藏管理** (`favorites`)
  - `getUserFavorites()` - 只能查询当前用户的收藏
  - `add()` - 自动设置为当前用户ID
  - `remove()` - 验证权限后才能删除

- **问答历史** (`qaPairs`)
  - `getUserHistory()` - 只能查询当前用户的历史
  - `create()` - 自动设置为当前用户ID

#### 使用示例

```javascript
const db = require('../../utils/database').db

// 获取当前用户的行程（自动验证权限）
const result = await db.travelPlans.getByUserId(userId, 'planned')
if (result.error) {
  console.error('无权访问:', result.error.message)
  return
}

// 创建行程（自动设置为当前用户）
const newPlan = await db.travelPlans.create({
  title: '新行程',
  destination: '目的地'
  // user_id 会自动设置，无需手动指定
})

// 更新行程（自动验证权限）
const updated = await db.travelPlans.update(planId, {
  title: '更新后的标题'
  // user_id 不能被修改
})
```

### 3. 页面级权限控制

#### 登录页面 (pages/login/login.js)

- 检查是否已登录，已登录则自动跳转首页
- 使用 `Auth.saveUserLogin()` 保存登录状态
- 支持记住用户名功能

#### 注册页面 (pages/register/register.js)

- 注册成功后自动登录
- 使用 `Auth.saveUserLogin()` 保存登录状态

#### 首页 (index/index.js)

- 使用 `Auth.requireLogin()` 检查登录状态
- 只加载当前用户的行程数据
- 所有AI功能都需要登录后才能使用

## 安全特性

### 1. 数据隔离

- 每个用户只能访问自己创建的数据
- 数据库查询自动添加 `user_id` 过滤条件
- 无法通过修改参数访问其他用户的数据

### 2. 越权防护

- 创建/更新数据时强制使用当前用户ID
- 无法通过传入其他用户ID来越权操作
- `user_id` 字段在更新时被自动移除，防止篡改

### 3. 登录状态管理

- 登录信息同时保存在全局状态和本地存储
- 支持30天登录过期检查
- 页面显示时自动检查登录状态

### 4. 错误处理

- 未登录时自动跳转登录页
- 无权访问时返回友好错误提示
- 所有数据库操作都有错误处理

## 使用指南

### 在新页面中实现权限控制

```javascript
// 1. 引入Auth工具
const Auth = require('../../utils/auth').Auth

// 2. 在页面加载时检查登录
onLoad() {
  if (!Auth.requireLogin()) {
    return // 未登录会自动跳转
  }
  // 继续加载页面数据
  this.loadData()
}

// 3. 获取数据时使用当前用户ID
loadData() {
  const userId = Auth.getCurrentUserId()
  // 使用userId查询数据
}

// 4. 验证资源访问权限
viewPlan(planId) {
  const plan = await db.travelPlans.getById(planId)
  if (plan.error) {
    wx.showToast({ title: '无权访问', icon: 'none' })
    return
  }
  // 继续处理
}
```

### 在组件中使用权限系统

```javascript
// 条件渲染（需要登录才显示）
<view wx:if="{{userInfo}}">
  <!-- 登录后才显示的内容 -->
</view>

<view wx:else>
  <button bindtap="goToLogin">请先登录</button>
</view>
```

## 数据库表结构要求

为确保权限系统正常工作，所有用户相关的表都应包含 `user_id` 字段：

```sql
-- 示例：travel_plans表
CREATE TABLE travel_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,  -- 关键字段
  title TEXT,
  -- 其他字段...
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 添加索引提高查询性能
CREATE INDEX idx_travel_plans_user_id ON travel_plans(user_id);
```

## 测试建议

1. **测试数据隔离**
   - 创建多个测试账号
   - 分别登录创建数据
   - 验证无法看到其他用户的数据

2. **测试越权防护**
   - 尝试通过修改参数访问其他用户数据
   - 验证权限检查是否生效

3. **测试登录过期**
   - 修改本地存储的登录时间
   - 验证是否自动退出登录

## 注意事项

1. **所有用户数据操作都必须通过 `db` 对象**，不要直接使用 `supabase` 客户端
2. **新增用户相关表时**，记得在 `database.js` 中添加相应的权限控制
3. **敏感操作前**，始终使用 `Auth.requireLogin()` 或 `Auth.canAccess()` 验证
4. **前端权限控制只是辅助**，后端（Supabase RLS）也需要配置行级安全策略

## 后续优化建议

1. 在Supabase中配置RLS（Row Level Security）策略
2. 实现更复杂的角色权限系统（如管理员、普通用户）
3. 添加操作日志记录
4. 实现更安全的密码加密方案
5. 添加双因素认证
