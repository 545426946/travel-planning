// Mistral AI旅行规划服务
import { message } from 'ant-design-vue'

class MistralAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || ''
    this.apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.mistral.ai/v1/chat/completions'
    this.model = import.meta.env.VITE_AI_MODEL || 'mistral-medium-latest'
  }

  // 生成旅行规划
  async generateTravelPlan(userPreferences) {
    const prompt = this.buildTravelPrompt(userPreferences)
    
    try {
      const response = await this.callMistralAI(prompt)
      return this.parseTravelPlan(response)
    } catch (error) {
      console.error('Mistral AI规划失败:', error)
      message.error('AI规划失败，请稍后重试')
      return this.getFallbackPlan(userPreferences)
    }
  }

  // 构建Mistral AI提示词（针对旅行规划优化）
  buildTravelPrompt(preferences) {
    const { destination, days, budget, travelers, interests, travelStyle, specialRequirements } = preferences
    
    return `你是一个专业的旅行规划师。请为以下需求制定详细的旅行计划：

**旅行需求：**
- 目的地：${destination}
- 天数：${days}天
- 预算：${budget}元（总预算）
- 人数：${travelers}人
- 兴趣偏好：${interests?.join(', ') || '通用'}
- 旅行风格：${travelStyle || '舒适'}
- 特殊要求：${specialRequirements || '无'}

**请严格按照以下JSON格式返回数据，不要包含其他内容：**

{
  "title": "行程标题",
  "description": "行程描述",
  "days": ${days},
  "budget": ${budget},
  "itinerary": [
    {
      "day": 1,
      "activities": [
        {
          "time_slot": "morning",
          "start_time": "08:00",
          "end_time": "12:00",
          "activity_title": "活动标题",
          "activity_description": "详细的活动描述",
          "location": "具体地点",
          "estimated_cost": 100,
          "duration_minutes": 240
        }
      ]
    }
  ],
  "tips": ["贴士1", "贴士2"],
  "budget_breakdown": {
    "accommodation": 500,
    "food": 300,
    "transportation": 200,
    "tickets": 150,
    "other": 50
  }
}

**具体要求：**
1. 每个活动必须包含具体的时间段（morning/afternoon/evening/night）
2. 每个活动必须有具体的开始和结束时间
3. 每个活动必须有具体的地点名称
4. 每个活动必须有详细的描述和预估费用
5. 预算分配要合理，符合总预算限制
6. 行程安排要考虑交通时间和实际可行性
7. 活动安排要符合用户的兴趣偏好和旅行风格

请确保返回的数据是有效的JSON格式，不要包含任何额外的文本。`
  }

  // 调用Mistral AI API
  async callMistralAI(prompt) {
    // 检查API密钥
    if (!this.apiKey || this.apiKey === 'your_mistral_api_key_here') {
      console.warn('Mistral AI API密钥未配置，使用模拟数据')
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
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行规划专家，擅长为不同需求的旅行者制定个性化行程。请提供详细、实用、符合预算的旅行建议。'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Mistral API请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Mistral API返回数据格式错误')
    }
    
    return data.choices[0].message.content
  }

  // 解析Mistral AI返回的旅行规划
  parseTravelPlan(aiResponse) {
    try {
      // 尝试解析JSON格式的响应
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const planData = JSON.parse(jsonMatch[0])
        return this.validateAndFormatPlan(planData)
      }
    } catch (error) {
      console.warn('JSON解析失败，使用文本解析:', error)
    }
    
    // 如果JSON解析失败，使用文本解析
    return {
      title: this.extractTitle(aiResponse),
      description: this.extractDescription(aiResponse),
      days: this.extractDays(aiResponse),
      budget: this.extractBudget(aiResponse),
      itinerary: this.extractItinerary(aiResponse),
      tips: this.extractTips(aiResponse),
      rawResponse: aiResponse
    }
  }

  // 验证和格式化计划数据
  validateAndFormatPlan(planData) {
    // 确保必要字段存在
    const validatedPlan = {
      title: planData.title || 'AI智能旅行计划',
      description: planData.description || '基于您的需求生成的个性化行程',
      days: planData.days || 3,
      budget: planData.budget || 2000,
      itinerary: this.validateItinerary(planData.itinerary || []),
      tips: planData.tips || [],
      budget_breakdown: planData.budget_breakdown || {},
      rawResponse: JSON.stringify(planData)
    }

    return validatedPlan
  }

  // 验证行程安排
  validateItinerary(itinerary) {
    if (!Array.isArray(itinerary)) return this.getDefaultItinerary()
    
    return itinerary.map(day => ({
      day: day.day || 1,
      activities: this.validateActivities(day.activities || [])
    }))
  }

  // 验证活动数据
  validateActivities(activities) {
    if (!Array.isArray(activities)) return []
    
    return activities.map((activity, index) => ({
      id: index + 1,
      time_slot: activity.time_slot || 'morning',
      start_time: activity.start_time || '08:00',
      end_time: activity.end_time || '12:00',
      activity_title: activity.activity_title || `活动${index + 1}`,
      activity_description: activity.activity_description || '活动描述',
      location: activity.location || '具体地点',
      estimated_cost: activity.estimated_cost || 0,
      duration_minutes: activity.duration_minutes || 240,
      order_index: index
    }))
  }

  // 提取行程标题
  extractTitle(response) {
    const match = response.match(/^.*?(?:行程|计划)[：:]?\s*([^\n]+)/)
    return match ? match[1].trim() : 'AI智能旅行计划'
  }

  // 提取描述
  extractDescription(response) {
    return response.split('\n').slice(0, 3).join(' ').substring(0, 200) + '...'
  }

  // 提取天数
  extractDays(response) {
    const match = response.match(/(\d+)\s*天/)
    return match ? parseInt(match[1]) : 3
  }

  // 提取预算
  extractBudget(response) {
    const match = response.match(/预算[：:]?\s*[￥¥]?\s*(\d+)/)
    return match ? parseInt(match[1]) : 2000
  }

  // 提取行程安排
  extractItinerary(response) {
    const lines = response.split('\n')
    const itinerary = []
    
    let currentDay = null
    let inItinerarySection = false
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      // 检测行程部分开始
      if (trimmedLine.includes('每日详细安排') || trimmedLine.includes('第') && trimmedLine.includes('天')) {
        inItinerarySection = true
      }
      
      if (inItinerarySection) {
        const dayMatch = trimmedLine.match(/第\s*(\d+)\s*天/)
        if (dayMatch) {
          currentDay = { 
            day: `第${dayMatch[1]}天`, 
            activities: [],
            timeSlots: { morning: [], afternoon: [], evening: [] }
          }
          itinerary.push(currentDay)
        } else if (currentDay && trimmedLine && !trimmedLine.includes('---')) {
          // 按时间段分类活动
          if (trimmedLine.includes('上午') || trimmedLine.includes('早上')) {
            currentDay.timeSlots.morning.push(trimmedLine.replace(/[上午早上：:]/g, '').trim())
          } else if (trimmedLine.includes('下午')) {
            currentDay.timeSlots.afternoon.push(trimmedLine.replace(/[下午：:]/g, '').trim())
          } else if (trimmedLine.includes('晚上') || trimmedLine.includes('晚间')) {
            currentDay.timeSlots.evening.push(trimmedLine.replace(/[晚上晚间：:]/g, '').trim())
          } else {
            currentDay.activities.push(trimmedLine)
          }
        }
      }
    })
    
    return itinerary.length > 0 ? itinerary : this.getDefaultItinerary()
  }

  // 提取贴士
  extractTips(response) {
    const tips = []
    const lines = response.split('\n')
    let inTipsSection = false
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      if (trimmedLine.includes('实用贴士') || trimmedLine.includes('注意事项')) {
        inTipsSection = true
      } else if (inTipsSection && trimmedLine && 
                 !trimmedLine.includes('---') && 
                 !trimmedLine.includes('推荐景点')) {
        if (trimmedLine.match(/^[•·▪➢➤›>\-\*]\s*/) || trimmedLine.match(/^\d+\./)) {
          tips.push(trimmedLine.replace(/^[•·▪➢➤›>\-\*\d\.\s]+/, '').trim())
        }
      }
    })
    
    return tips.length > 0 ? tips : [
      '建议提前预订酒店和主要景点门票',
      '关注当地天气预报，准备合适的衣物',
      '了解当地交通规则和常用交通工具',
      '准备常用药品和应急联系方式'
    ]
  }

  // 默认行程安排
  getDefaultItinerary() {
    return [
      {
        day: '第1天',
        activities: ['抵达目的地', '入住酒店', '周边探索适应环境'],
        timeSlots: {
          morning: ['抵达目的地'],
          afternoon: ['入住酒店', '周边熟悉环境'],
          evening: ['当地特色晚餐']
        }
      },
      {
        day: '第2天',
        activities: ['主要景点游览', '深度文化体验'],
        timeSlots: {
          morning: ['早餐后前往主要景点'],
          afternoon: ['景点深度游览', '午餐休息'],
          evening: ['当地美食体验', '夜景欣赏']
        }
      }
    ]
  }

  // 模拟Mistral AI响应（用于演示）
  getMockResponse(prompt) {
    return `**北京3日文化深度游**

**行程概览：**
为您精心策划的北京3日文化之旅，融合历史探索与现代体验，预算控制在2000元以内。

**每日详细安排：**

**第1天：抵达与适应**
- 上午：抵达北京首都机场/火车站，乘坐地铁或出租车前往王府井地区
- 下午：入住经济型酒店（预算：300元/晚），稍作休息后游览天安门广场
- 晚上：品尝正宗北京烤鸭（人均80-100元），王府井步行街夜景

**第2天：历史文化探索**
- 上午：故宫博物院深度游（门票60元，建议预约上午场）
- 下午：景山公园俯瞰故宫全景，北海公园划船休闲
- 晚上：前门大街老字号餐厅晚餐，大栅栏文化街区漫步

**第3天：长城一日游与返程**
- 上午：八达岭长城游览（跟团游约200元含交通门票）
- 下午：返回市区，购买特产纪念品
- 晚上：准备返程，机场/火车站送别

**预算分配明细：**
- 住宿：600元（2晚×300元）
- 餐饮：750元（3天×250元/人）
- 交通：400元（含长城往返）
- 门票：250元（故宫60+长城200+其他）
- 总计：2000元（符合预算）

**实用贴士：**
• 北京春秋季节（4-5月，9-10月）气候宜人，最适合旅行
• 故宫门票需提前7天在官网预约，避开周一闭馆日
• 长城距离市区较远，建议选择正规旅行社一日游
• 准备舒适的步行鞋，北京景点步行量较大
• 学习基本的中文问候语，便于与当地人交流

**推荐景点：**
必去：故宫、天安门广场、八达岭长城
可选：颐和园、圆明园、天坛公园
特色体验：胡同游、京剧表演、老北京茶馆`
  }

  // 备用方案
  getFallbackPlan(preferences) {
    return {
      title: `${preferences.destination} ${preferences.days}日智能旅行计划`,
      description: '基于您的需求生成的个性化行程',
      days: preferences.days,
      budget: preferences.budget,
      itinerary: this.getDefaultItinerary().slice(0, preferences.days),
      tips: [
        '建议提前规划行程并预订',
        '关注目的地天气情况',
        '准备必要的旅行证件和保险'
      ],
      rawResponse: 'AI服务暂不可用，使用模板生成计划'
    }
  }

  // 测试API连接
  async testConnection() {
    try {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export default new MistralAIService()