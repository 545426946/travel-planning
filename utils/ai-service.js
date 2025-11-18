// utils/ai-service.js - Mistral AI 服务模块
const supabase = require('./supabase').supabase
const AI_CONFIG = require('./config').AI_CONFIG

class AIService {
  constructor() {
    this.apiKey = AI_CONFIG.apiKey
    this.apiUrl = AI_CONFIG.apiUrl
    this.model = AI_CONFIG.model
  }

  // 调用 Mistral AI API
  async callAPI(messages, options = {}) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(Object.assign({
          model: this.model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000
        }, options))
      })

      if (!response.ok) {
        throw new Error(`AI API 错误: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('AI 服务调用失败:', error)
      throw error
    }
  }

  // 行程规划助手
  async generateTravelPlan(userInput, userPreferences = {}) {
    const systemPrompt = `你是一个专业的旅行规划AI助手，擅长为用户制定个性化旅行行程。

请根据用户提供的信息，生成详细的旅行计划，包括：
1. 推荐的目的地和景点
2. 详细的行程安排（每天的活动）
3. 交通建议
4. 住宿建议
5. 预算估算
6. 注意事项和贴士

用户偏好：${JSON.stringify(userPreferences)}

请用中文回复，格式清晰，内容实用。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ]

    return await this.callAPI(messages)
  }

  // 景点推荐
  async recommendDestinations(userPreferences, currentLocation = null) {
    const systemPrompt = `你是一个旅行景点推荐专家，根据用户偏好推荐合适的景点。

推荐标准：
1. 匹配用户的兴趣偏好
2. 考虑地理位置便利性
3. 提供景点特色和亮点
4. 包含实用的游玩建议
5. 预估游玩时间和费用

用户偏好：${JSON.stringify(userPreferences)}
当前位置：${currentLocation || '未指定'}

请推荐5-8个景点，按推荐度排序。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请为我推荐合适的景点' }
    ]

    return await this.callAPI(messages)
  }

  // 生成热门路线
  async generatePopularRoute(routeTheme, difficulty = '中等', duration = '3-5天') {
    const systemPrompt = `你是一个专业路线规划师，创建高质量的旅游路线。

路线要求：
- 主题：${routeTheme}
- 难度等级：${difficulty}
- 时长：${duration}
- 包含详细的每日行程安排
- 提供交通和住宿建议
- 预算范围和费用明细
- 注意事项和建议

请生成一条完整的旅游路线，内容详细实用。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请创建一条${routeTheme}主题的旅游路线` }
    ]

    return await this.callAPI(messages)
  }

  // 行程优化建议
  async optimizeTravelPlan(travelPlan, optimizationGoal = '优化时间安排') {
    const systemPrompt = `你是一个行程优化专家，分析用户提供的行程并给出优化建议。

当前行程：${JSON.stringify(travelPlan)}
优化目标：${optimizationGoal}

请从以下角度分析：
1. 时间安排合理性
2. 路线效率优化
3. 费用控制建议
4. 体验改善建议
5. 实用性改进

提供具体可行的优化建议。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请帮我优化这个行程' }
    ]

    return await this.callAPI(messages)
  }

  // 智能问答
  async travelQA(question, context = {}) {
    const systemPrompt = `你是一个旅行知识专家，回答用户的旅行相关问题。

知识范围：
- 目的地信息和景点介绍
- 旅行攻略和建议
- 交通和住宿信息
- 当地文化和风俗
- 安全注意事项
- 最佳旅行时间和天气

上下文信息：${JSON.stringify(context)}

请准确、实用地回答用户问题。如果不确定，请诚实地告知。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ]

    return await this.callAPI(messages, { temperature: 0.3 })
  }

  // 生成景点描述
  async generateDestinationDescription(destinationName, basicInfo = {}) {
    const systemPrompt = `你是一个文案写作专家，为景点生成吸引人的描述。

景点名称：${destinationName}
基本信息：${JSON.stringify(basicInfo)}

请生成：
1. 简短吸引人的标题
2. 详细的景点介绍（200-300字）
3. 景点特色和亮点
4. 游玩建议和贴士
5. 最佳游玩时间

文案要生动有趣，有吸引力。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请为${destinationName}生成描述文案` }
    ]

    return await this.callAPI(messages)
  }

  // 生成旅行贴士
  async generateTravelTips(destination, travelType = '自由行', season = '春季') {
    const systemPrompt = `你是一个资深旅行顾问，提供实用的旅行贴士。

目的地：${destination}
旅行类型：${travelType}
旅行季节：${season}

请提供详细的旅行贴士，包括：
1. 必备物品清单
2. 穿衣建议
3. 当地文化注意事项
4. 安全提醒
5. 费用节约建议
6. 交通出行建议
7. 住宿选择建议

建议要实用、具体、可操作。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请提供${destination}的旅行贴士` }
    ]

    return await this.callAPI(messages)
  }

  // 翻译服务
  async translateText(text, targetLanguage = '英文') {
    const systemPrompt = `你是一个专业翻译，将中文翻译成${targetLanguage}。

翻译要求：
- 保持原文意思准确
- 语言表达自然流畅
- 符合目标语言习惯
- 专业术语翻译准确

请直接翻译结果，不需要额外解释。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ]

    return await this.callAPI(messages, { temperature: 0.1 })
  }

  // 生成个性化推荐
  async generatePersonalizedRecommendations(userId, userHistory = {}) {
    // 获取用户偏好和历史记录
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: plans } = await supabase
      .from('travel_plans')
      .select('destination, travel_type, tags')
      .eq('user_id', userId)
      .limit(5)

    const { data: favorites } = await supabase
      .from('user_favorites')
      .select(`
        target_type,
        target_id,
        ${'destinations(name, location, category)'},
        ${'popular_routes(title, tags)'}
      `)
      .eq('user_id', userId)
      .eq('target_type', 'destination')
      .limit(10)

    const systemPrompt = `基于用户的偏好和历史数据，生成个性化推荐。

用户偏好：${JSON.stringify(preferences)}
历史行程：${JSON.stringify(plans)}
收藏记录：${JSON.stringify(favorites)}

请提供：
1. 个性化目的地推荐（5个）
2. 符合偏好的旅行路线建议（3条）
3. 下一步行动建议
4. 相关活动推荐

推荐要符合用户特点，具有针对性。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请为我生成个性化旅行推荐' }
    ]

    return await this.callAPI(messages)
  }
}

// 创建 AI 服务实例
const aiService = new AIService()

module.exports = { aiService, AIService }