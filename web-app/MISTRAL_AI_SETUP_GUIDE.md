# Mistral AI API 集成配置指南

## 🚀 快速开始

### 1. 获取Mistral AI API密钥

#### 步骤1：注册Mistral AI账户
1. 访问 [Mistral AI官网](https://mistral.ai/)
2. 点击 "Sign Up" 或 "Get Started"
3. 选择注册方式：
   - **邮箱注册**：输入邮箱，完成验证
   - **GitHub账户**：使用GitHub账户快速登录

#### 步骤2：获取API密钥
1. 登录后进入 [Mistral AI控制台](https://console.mistral.ai/)
2. 在左侧菜单选择 "API Keys"
3. 点击 "Create new API key"
4. 输入密钥名称（如：travel-planner）
5. 复制生成的API密钥（以 `sk-` 开头）

#### 步骤3：了解定价（重要）
Mistral AI提供免费额度，超出后按使用量计费：

| 模型 | 输入价格 | 输出价格 | 免费额度 |
|------|----------|----------|----------|
| mistral-tiny | $0.14/1M tokens | $0.42/1M tokens | 无 |
| mistral-small | $0.6/1M tokens | $1.8/1M tokens | 无 |
| mistral-medium | $2.5/1M tokens | $7.5/1M tokens | 无 |

💡 **建议**：开发阶段使用 `mistral-small`，生产环境根据需求选择。

### 2. 配置应用

#### 步骤1：创建环境配置文件
```bash
cd web-app
cp .env.example .env
```

#### 步骤2：编辑 .env 文件
```env
# Mistral AI服务配置
VITE_AI_API_KEY=sk-your-actual-mistral-api-key-here
VITE_AI_API_URL=https://api.mistral.ai/v1/chat/completions
VITE_AI_MODEL=mistral-medium-latest

# 可选模型（根据需求选择）：
# - mistral-tiny-latest（快速，成本低）
# - mistral-small-latest（平衡性能与成本）
# - mistral-medium-latest（高质量，成本较高）

# Supabase配置（可选）
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 应用配置
VITE_APP_NAME=旅行规划AI版
VITE_APP_VERSION=1.0.0
```

#### 步骤3：安装依赖并启动
```bash
npm install
npm run dev
```

## 🔧 技术细节

### Mistral AI API 调用示例

```javascript
// 基本调用结构
const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'mistral-medium-latest',
    messages: [
      {
        role: 'system',
        content: '你是一个专业的旅行规划师。'
      },
      {
        role: 'user',
        content: '请为3天的北京旅行制定计划，预算2000元。'
      }
    ],
    max_tokens: 2000,
    temperature: 0.7
  })
})
```

### 支持的模型列表

| 模型名称 | 描述 | 适用场景 |
|----------|------|----------|
| mistral-tiny-latest | 轻量级模型 | 简单问答，快速响应 |
| mistral-small-latest | 平衡型模型 | 一般对话，内容生成 |
| mistral-medium-latest | 高质量模型 | 复杂推理，专业内容 |

## 🎯 功能特性

### AI旅行规划功能
1. **智能行程生成**：基于用户需求自动生成详细旅行计划
2. **预算优化**：根据预算限制优化行程安排
3. **个性化推荐**：考虑用户兴趣偏好和特殊需求
4. **实时调整**：支持多轮对话优化行程

### 用户界面特性
- **直观的表单**：收集旅行需求信息
- **实时预览**：AI生成结果的即时展示
- **交互式编辑**：支持手动调整AI生成的计划
- **多格式导出**：支持保存、分享行程

## 🛠️ 故障排除

### 常见问题

#### 1. API密钥错误
**症状**："401 Unauthorized" 错误
**解决**：
- 检查API密钥是否正确复制
- 确认密钥以 `sk-` 开头
- 在Mistral控制台验证密钥状态

#### 2. 配额限制
**症状**："429 Too Many Requests" 错误
**解决**：
- 检查API使用量
- 考虑升级到付费计划
- 优化请求频率

#### 3. 网络连接问题
**症状**：请求超时或连接失败
**解决**：
- 检查网络连接
- 确认Mistral API服务状态
- 考虑使用代理（如需要）

### 调试技巧

1. **启用详细日志**：
```javascript
// 在aiService.js中启用调试
console.log('API请求详情:', {
  url: this.apiUrl,
  model: this.model,
  provider: this.provider
})
```

2. **测试连接**：
```bash
# 使用curl测试API连接
curl -X GET "https://api.mistral.ai/v1/models" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 📊 性能优化建议

### 1. 提示词优化
- 使用清晰的指令结构
- 提供具体的约束条件（预算、时间等）
- 明确期望的输出格式

### 2. 请求优化
- 合理设置 `max_tokens` 避免过长响应
- 使用适当的 `temperature`（0.7-0.9用于创意内容）
- 批量处理相似请求

### 3. 成本控制
- 监控API使用量
- 使用缓存减少重复请求
- 考虑使用更经济的模型进行简单任务

## 🔒 安全注意事项

### API密钥安全
- ❌ 不要将API密钥提交到版本控制
- ✅ 使用环境变量管理敏感信息
- ✅ 定期轮换API密钥
- ✅ 设置使用限额和监控

### 数据隐私
- 用户输入的旅行需求可能包含个人信息
- 确保符合数据保护法规（如GDPR）
- 考虑数据加密和匿名化处理

## 🚀 扩展功能

### 计划实现的增强功能
1. **多语言支持**：支持英文、日文等语言的旅行规划
2. **实时天气集成**：结合天气预报优化行程
3. **图片生成**：使用AI生成旅行目的地预览图
4. **语音交互**：支持语音输入旅行需求
5. **社交分享**：一键分享旅行计划到社交媒体

### 技术栈扩展
- **后端API**：Node.js/Express处理AI请求
- **数据库**：MongoDB/PostgreSQL存储用户行程
- **缓存**：Redis缓存常用旅行模板
- **消息队列**：RabbitMQ处理异步AI请求

---

## 📞 技术支持

如果遇到问题，可以：
1. 查看Mistral AI官方文档
2. 检查浏览器控制台错误信息
3. 联系开发团队获取支持

**应用已启动在**：http://localhost:8001/

开始享受AI智能旅行规划吧！🎉