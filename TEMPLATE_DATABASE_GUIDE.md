# 旅游模板数据库集成指南

## 📋 概述

本指南详细说明如何将热门景点页面中的行程数据保存到Supabase数据库，并实现从数据库中引用模板数据的功能。

## 🗄️ 数据库表结构

### travel_templates 表结构
```sql
CREATE TABLE IF NOT EXISTS public.travel_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id INTEGER NOT NULL UNIQUE,
    destination VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    days INTEGER NOT NULL,
    budget NUMERIC(10,2) NOT NULL,
    activities JSONB NOT NULL,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
```

## 🚀 快速开始

### 1. 数据库初始化

1. **登录Supabase控制台**
   - 访问: https://supabase.com/dashboard
   - 选择您的项目: `hrgskukcnlwmjbpvitsg`

2. **执行初始化脚本**
   - 在SQL编辑器中执行 `database-init-script.sql`
   - 或使用以下简化命令:
   ```sql
   -- 创建表结构
   CREATE TABLE IF NOT EXISTS public.travel_templates (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       template_id INTEGER NOT NULL UNIQUE,
       destination VARCHAR(100) NOT NULL,
       title VARCHAR(255) NOT NULL,
       description TEXT,
       days INTEGER NOT NULL,
       budget NUMERIC(10,2) NOT NULL,
       activities JSONB NOT NULL,
       tags TEXT[],
       is_active BOOLEAN DEFAULT TRUE,
       created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
       updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
   );
   ```

### 2. 环境配置检查

确保 `web-app/.env` 文件包含正确的Supabase配置:
```env
VITE_SUPABASE_URL=https://hrgskukcnlwmjbpvitsg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ3NrdWtjbmx3bWpicHZpdHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTE2ODksImV4cCI6MjA3NjU4NzY4OX0.zj1ZTOgChM8bKtIh3w2Z8oSftGMocho_COKkCp6FDhY
```

## 🔧 功能实现

### 1. 模板数据保存

在热门景点页面 (`Destinations.vue`) 中，点击"保存模板到数据库"按钮:

```javascript
// 保存模板到数据库
const saveTemplatesToDatabase = async () => {
  savingTemplates.value = true
  
  try {
    const result = await templateService.saveTemplatesToDatabase(travelTemplates)
    
    if (result.success) {
      message.success(`成功保存 ${result.data?.length || 0} 个模板到数据库`)
    } else {
      message.error(`保存失败: ${result.error}`)
    }
  } catch (error) {
    message.error('保存模板时发生错误')
  } finally {
    savingTemplates.value = false
  }
}
```

### 2. 从数据库加载模板

```javascript
// 从数据库加载模板数据
const loadTemplatesFromDatabase = async () => {
  try {
    const result = await templateService.loadTemplatesFromDatabase()
    
    if (result.success) {
      console.log(`从数据库加载了 ${result.data.length} 个模板`)
      return result.data
    } else {
      console.warn('从数据库加载模板失败，使用本地数据:', result.error)
      return travelTemplates // 返回本地数据作为后备
    }
  } catch (error) {
    console.error('加载模板数据时发生异常:', error)
    return travelTemplates // 返回本地数据作为后备
  }
}
```

### 3. 按目的地获取模板

```javascript
// 获取特定目的地的模板
const getTemplatesForDestination = async (destinationName) => {
  try {
    const result = await templateService.getTemplatesByDestination(destinationName)
    
    if (result.success) {
      return result.data
    } else {
      console.warn(`获取${destinationName}模板失败，使用本地数据:`)
      return travelTemplates.filter(template => template.destination === destinationName)
    }
  } catch (error) {
    console.error(`获取${destinationName}模板时发生异常:`)
    return travelTemplates.filter(template => template.destination === destinationName)
  }
}
```

## 📊 数据管理

### 当前模板数据统计

| 目的地 | 模板数量 | 天数范围 | 预算范围 |
|--------|----------|----------|----------|
| 北京   | 2个      | 3-5天    | ¥1500-2500 |
| 上海   | 2个      | 2-3天    | ¥1200-1800 |
| 杭州   | 2个      | 2-3天    | ¥800-1200 |
| 西安   | 2个      | 3-4天    | ¥1000-1500 |
| 成都   | 2个      | 3-4天    | ¥900-1200 |
| 广州   | 2个      | 2-3天    | ¥700-1000 |
| 南京   | 2个      | 3-4天    | ¥900-1300 |
| 重庆   | 2个      | 3-4天    | ¥800-1100 |
| 苏州   | 2个      | 2-3天    | ¥600-900 |
| 丽江   | 2个      | 3-4天    | ¥1000-1400 |

**总计: 20个旅游模板**

## 🔍 数据库查询示例

### 1. 查询所有模板
```sql
SELECT * FROM public.travel_templates 
WHERE is_active = true 
ORDER BY destination, days;
```

### 2. 按目的地查询
```sql
SELECT * FROM public.travel_templates 
WHERE destination = '北京' AND is_active = true 
ORDER BY days;
```

### 3. 统计模板数量
```sql
SELECT destination, COUNT(*) as template_count
FROM public.travel_templates 
WHERE is_active = true 
GROUP BY destination 
ORDER BY template_count DESC;
```

## 🛠️ 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `.env` 文件中的 Supabase URL 和密钥
   - 验证网络连接
   - 检查 Supabase 项目状态

2. **表不存在错误**
   - 执行 `database-init-script.sql` 创建表结构
   - 检查表名拼写是否正确

3. **权限错误**
   - 确保 RLS (行级安全策略) 配置正确
   - 检查匿名用户权限设置

### 调试工具

在浏览器控制台中测试数据库连接:
```javascript
// 测试数据库连接
templateService.checkDatabaseConnection().then(result => {
  console.log('数据库连接状态:', result)
})

// 检查表状态
templateService.initTemplatesTable().then(result => {
  console.log('模板表状态:', result)
})
```

## 📈 性能优化

### 索引优化
- `destination` 字段索引: 快速按目的地筛选
- `template_id` 字段索引: 唯一标识符查询
- `is_active` 字段索引: 活跃模板筛选

### 缓存策略
- 前端缓存模板数据，减少数据库查询
- 使用本地存储作为后备方案
- 实现数据版本控制

## 🔄 数据同步

### 自动同步机制
```javascript
// 应用启动时检查数据同步
onMounted(async () => {
  // 检查数据库连接
  const dbStatus = await templateService.checkDatabaseConnection()
  
  if (dbStatus.success) {
    // 从数据库加载模板
    const templates = await loadTemplatesFromDatabase()
    // 更新前端数据
    travelTemplates.value = templates
  }
})
```

## 🎯 下一步计划

1. **实时数据同步** - 实现模板数据的实时更新
2. **用户自定义模板** - 允许用户创建和保存个性化模板
3. **模板版本控制** - 支持模板的版本管理和历史记录
4. **数据分析仪表板** - 展示模板使用统计和热门目的地

## 📞 技术支持

如有问题，请参考:
- Supabase 官方文档: https://supabase.com/docs
- 项目文档: `README.md`
- 数据库指南: `DATABASE_MIGRATION_GUIDE.md`