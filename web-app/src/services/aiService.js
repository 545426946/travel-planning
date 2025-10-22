// AI旅行规划服务 - 支持多种AI提供商
import { message } from 'ant-design-vue'

class AITravelService {
  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || ''
    this.apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.mistral.ai/v1/chat/completions'
    this.model = import.meta.env.VITE_AI_MODEL || 'mistral-medium-latest'
    this.provider = this.detectProvider()
  }

  // 检测AI服务提供商
  detectProvider() {
    if (this.apiUrl.includes('mistral.ai')) {
      return 'mistral'
    } else if (this.apiUrl.includes('openai.com')) {
      return 'openai'
    } else if (this.apiUrl.includes('baidu.com')) {
      return 'baidu'
    } else if (this.apiUrl.includes('aliyun.com')) {
      return 'aliyun'
    } else {
      return 'mistral' // 默认使用Mistral
    }
  }

  // 生成旅行规划
  async generateTravelPlan(userPreferences) {
    const prompt = this.buildTravelPrompt(userPreferences)
    
    try {
      const response = await this.callAI(prompt)
      return this.parseTravelPlan(response)
    } catch (error) {
      console.error('AI规划失败:', error)
      message.error('AI规划失败，请稍后重试')
      return this.getFallbackPlan(userPreferences)
    }
  }

  // 构建AI提示词
  buildTravelPrompt(preferences) {
    const { destination, days, budget, travelers, interests, travelStyle } = preferences
    
    return `你是一个专业的旅行规划师。请为以下需求制定详细的旅行计划：

目的地：${destination}
天数：${days}天
预算：${budget}元
人数：${travelers}人
兴趣：${interests?.join(', ') || '通用'}
旅行风格：${travelStyle || '休闲'}

请提供以下格式的详细规划：
1. 每日行程安排（包含景点、餐饮、住宿建议）
2. 预算分配明细
3. 交通建议
4. 注意事项和贴士
5. 推荐的最佳季节和天气

请用中文回复，内容要详细实用。`
  }

  // 调用AI API
  async callAI(prompt) {
    // 模拟AI响应（实际使用时替换为真实API调用）
    if (!this.apiKey) {
      return this.getMockResponse(prompt)
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  // 解析AI返回的旅行规划
  parseTravelPlan(aiResponse) {
    // 这里可以添加更复杂的解析逻辑
    return {
      title: 'AI生成的旅行计划',
      description: aiResponse,
      days: 3,
      budget: 2000,
      itinerary: this.extractItinerary(aiResponse),
      tips: this.extractTips(aiResponse)
    }
  }

  // 提取行程安排
  extractItinerary(response) {
    // 简单的文本解析逻辑
    const lines = response.split('\n')
    const itinerary = []
    
    let currentDay = null
    lines.forEach(line => {
      if (line.includes('第') && line.includes('天')) {
        currentDay = { day: line.trim(), activities: [] }
        itinerary.push(currentDay)
      } else if (currentDay && line.trim() && !line.includes('---')) {
        currentDay.activities.push(line.trim())
      }
    })
    
    return itinerary.length > 0 ? itinerary : [
      { day: '第1天', activities: ['抵达目的地', '入住酒店', '周边探索'] },
      { day: '第2天', activities: ['主要景点游览', '当地美食体验'] },
      { day: '第3天', activities: ['购物休闲', '返程准备'] }
    ]
  }

  // 提取贴士
  extractTips(response) {
    const tips = []
    const lines = response.split('\n')
    
    lines.forEach(line => {
      if (line.includes('贴士') || line.includes('注意') || line.includes('建议')) {
        tips.push(line.trim())
      }
    })
    
    return tips.length > 0 ? tips : [
      '提前预订酒店和门票',
      '注意当地天气变化',
      '准备常用药品'
    ]
  }

  // 模拟AI响应（用于演示）
  getMockResponse(prompt) {
    return `基于您的需求，我为您制定了以下旅行计划：

**北京3日文化之旅**

**第1天：抵达与适应**
- 上午：抵达北京，入住王府井附近酒店
- 下午：游览天安门广场，参观国家博物馆
- 晚上：品尝北京烤鸭

**第2天：历史文化探索**
- 上午：游览故宫博物院（建议提前预约）
- 下午：参观景山公园，俯瞰故宫全景
- 晚上：王府井步行街购物

**第3天：长城一日游**
- 全天：八达岭长城游览（建议跟团或包车）
- 傍晚：返回市区，准备返程

**预算分配：**
- 住宿：800元（2晚）
- 餐饮：600元
- 交通：400元
- 门票：200元

**贴士：**
- 北京春秋季节最适合旅行
- 故宫门票需提前在线预约
- 长城距离市区较远，建议安排全天行程`
  }

  // 备用方案
  getFallbackPlan(preferences) {
    return {
      title: `${preferences.destination} ${preferences.days}日游`,
      description: '基于模板生成的旅行计划',
      days: preferences.days,
      budget: preferences.budget,
      itinerary: [
        { day: '第1天', activities: ['抵达目的地', '入住酒店', '周边探索'] },
        { day: '第2天', activities: ['主要景点游览', '当地美食体验'] }
      ].slice(0, preferences.days),
      tips: ['建议提前规划行程', '注意天气变化']
    }
  }
}

export default new AITravelService()