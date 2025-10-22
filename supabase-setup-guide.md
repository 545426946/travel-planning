# Supabase数据库设置指南

## 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com)
2. 注册/登录账户
3. 点击"New Project"创建新项目
4. 填写项目信息：
   - **Name**: travel-planner-web
   - **Database Password**: 设置安全的数据库密码
   - **Region**: 选择离您最近的区域（如ap-southeast-1）
5. 等待项目创建完成（约1-2分钟）

## 2. 获取项目配置

项目创建完成后，在项目设置中获取以下信息：

- **Project URL**: 类似 `https://your-project-ref.supabase.co`
- **anon/public key**: 在 Settings > API 中获取

## 3. 配置环境变量

将以下配置添加到 `web-app/js/supabase-client.js` 中：

```javascript
constructor() {
    // 替换为您的实际项目配置
    this.supabaseUrl = 'https://your-project-ref.supabase.co';
    this.supabaseKey = 'your-anon-key-here';
    
    this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
    this.init();
}
```

## 4. 执行数据库迁移

使用以下方法之一执行数据库表创建：

### 方法一：使用SQL编辑器
1. 进入 Supabase Dashboard
2. 点击左侧菜单的 "SQL Editor"
3. 复制 `database-schema.sql` 中的内容
4. 点击 "Run" 执行SQL语句

### 方法二：使用迁移工具
```bash
# 安装Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 应用迁移
supabase db push
```

## 5. 验证数据库连接

在浏览器中打开应用，检查：
- 是否能正常加载城市数据
- 用户注册/登录功能是否正常
- 行程创建功能是否正常

## 6. 安全配置

1. 在 Supabase Dashboard 中启用 Row Level Security (RLS)
2. 验证所有表的安全策略是否正确应用
3. 设置适当的CORS规则

## 故障排除

### 常见问题：
1. **CORS错误**: 在 Supabase Dashboard 的 Authentication > URL Configuration 中添加您的域名
2. **表不存在**: 确保已正确执行数据库迁移
3. **认证失败**: 检查API密钥是否正确

### 测试连接：
```javascript
// 在浏览器控制台中测试连接
const { data, error } = await supabase.from('cities').select('*');
if (error) console.error('连接失败:', error);
else console.log('连接成功，数据:', data);
```

## 生产环境部署

1. 为生产环境创建新的API密钥
2. 更新环境配置中的URL和密钥
3. 启用数据库备份
4. 设置监控和告警

---

**注意**: 请妥善保管您的数据库密码和API密钥，不要将其提交到版本控制系统。