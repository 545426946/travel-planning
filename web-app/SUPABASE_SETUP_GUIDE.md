# Supabase 数据库配置指南

## 🚀 快速开始

### 1. 创建 Supabase 项目
1. 访问 [Supabase官网](https://supabase.com)
2. 注册账户并登录
3. 点击 "New Project" 创建新项目
4. 填写项目名称和数据库密码
5. 选择离你最近的区域（推荐：亚太地区）
6. 等待项目创建完成

### 2. 获取配置信息
项目创建完成后，在项目设置页面找到：
- **Project URL**：你的 Supabase 项目 URL
- **API Key**：anon public 密钥

### 3. 配置环境变量
编辑 `web-app/.env` 文件，添加以下配置：

```env
# Supabase配置
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的anon public密钥

# Mistral AI配置
VITE_AI_API_KEY=E8L3fryNUIsAoWvROdNrumpwFTtfuCBL
VITE_AI_API_URL=https://api.mistral.ai/v1/chat/completions
VITE_AI_MODEL=mistral-small-latest

# 应用配置
VITE_APP_NAME=旅行规划AI版
VITE_APP_VERSION=1.0.0
```

### 4. 创建数据库表
在 Supabase 控制台中：
1. 进入 "SQL Editor"
2. 复制 `database-schema.sql` 文件中的内容
3. 执行 SQL 语句创建表结构
4. 确认表创建成功

## 📊 数据库表结构

### travel_plans 表（行程表）
- `id`: 主键，自增ID
- `title`: 行程标题
- `description`: 行程描述
- `days`: 旅行天数
- `budget`: 预算金额
- `travelers`: 出行人数
- `destination`: 目的地
- `itinerary`: 详细行程安排（JSON格式）
- `tips`: 旅行贴士（JSON格式）
- `is_ai_generated`: 是否为AI生成
- `status`: 行程状态
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 🔧 功能特性

### 数据持久化
- ✅ AI生成的行程自动保存到数据库
- ✅ 支持本地存储降级（无Supabase时）
- ✅ 实时数据同步
- ✅ 支持增删改查操作

### 错误处理
- ✅ 数据库连接失败时自动降级到本地存储
- ✅ 完善的错误提示和重试机制
- ✅ 网络异常时的优雅降级

## 🎯 使用说明

### 1. AI规划保存流程
1. 用户填写旅行需求
2. AI生成详细行程计划
3. 自动保存到数据库
4. 行程列表实时更新
5. 支持编辑和删除操作

### 2. 数据备份
- 所有数据自动备份到Supabase
- 支持数据导出和导入
- 跨设备数据同步

## 🔒 安全配置

### 行级安全策略（RLS）
数据库已启用行级安全策略，确保数据安全：
- 允许所有用户查看行程
- 允许所有用户创建行程
- 允许用户更新和删除自己的行程

### 环境变量保护
- API密钥通过环境变量配置
- 敏感信息不暴露在代码中
- 支持不同环境的配置管理

## 🚨 故障排除

### 常见问题

#### Q: 数据库连接失败怎么办？
A: 应用会自动降级到本地存储，检查：
- Supabase项目URL是否正确
- API密钥是否有效
- 网络连接是否正常

#### Q: AI规划无法保存？
A: 检查：
- Supabase表结构是否正确创建
- 环境变量配置是否正确
- 浏览器控制台错误信息

#### Q: 图标显示异常？
A: 确保：
- `@ant-design/icons-vue` 依赖已安装
- 图标组件已正确导入
- 浏览器缓存已清除

### 调试工具
```javascript
// 在浏览器控制台测试数据库连接
import supabaseService from './src/services/supabaseService'
supabaseService.testConnection().then(result => {
  console.log('数据库连接:', result ? '成功' : '失败')
})

// 测试AI服务连接
import mistralService from './src/services/mistralService'
mistralService.testConnection().then(result => {
  console.log('AI服务连接:', result ? '成功' : '失败')
})
```

## 📞 技术支持

如果遇到问题：
1. 检查浏览器控制台错误信息
2. 确认环境变量配置正确
3. 验证数据库表结构
4. 查看网络连接状态

## 🎉 完成配置

完成以上步骤后，你的旅行规划应用将具备：
- ✅ AI智能规划功能
- ✅ 数据库持久化存储
- ✅ 美观的界面设计
- ✅ 完整的增删改查功能
- ✅ 错误处理和降级机制

现在可以享受完整的AI旅行规划体验了！