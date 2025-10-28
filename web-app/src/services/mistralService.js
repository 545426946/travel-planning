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
    
    // 计算人均预算
    const perPersonBudget = Math.floor(budget / travelers)
    const perDayBudget = Math.floor(budget / days)
    
    return `你是一个专业的旅行规划师，拥有丰富的实际旅行经验。请为以下需求制定详细、实用、价格准确的旅行计划：

**旅行需求：**
- 目的地：${destination}
- 天数：${days}天
- 总预算：${budget}元（${travelers}人，人均${perPersonBudget}元，日均${perDayBudget}元）
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
  "travelers": ${travelers},
  "itinerary": [
    {
      "day": 1,
      "date": "2024-01-01",
      "activities": [
        {
          "time_slot": "morning",
          "start_time": "08:00",
          "end_time": "12:00",
          "activity_title": "具体活动名称",
          "activity_description": "详细的活动描述，包含具体内容和体验",
          "location": "具体真实的地点名称",
          "estimated_cost": 100,
          "duration_minutes": 240,
          "transportation": "交通方式",
          "travel_time": "交通时间"
        }
      ],
      "total_cost": 500
    }
  ],
  "tips": ["实用贴士1", "实用贴士2"],
  "budget_breakdown": {
    "accommodation": 500,
    "food": 300,
    "transportation": 200,
    "tickets": 150,
    "shopping": 100,
    "other": 50
  },
  "total_estimated_cost": ${budget}
}

**CRITICAL REQUIREMENTS - 必须严格遵守：**

**1. 价格准确性要求：**
- 所有价格必须基于2024年实际市场价格，考虑通货膨胀因素
- 住宿价格：经济型酒店150-300元/晚，舒适型300-600元/晚，豪华型600+元/晚
- 餐饮价格：早餐15-30元，午餐30-60元，晚餐50-100元（根据旅行风格调整）
- 交通费用：市内交通10-50元/次，城际交通50-500元/次
- 门票价格：普通景点30-100元，知名景点100-300元
- 总费用必须严格控制在预算${budget}元以内

**2. 地点真实性要求：**
- 必须使用真实存在的景点、餐厅、酒店名称
- 优先选择知名、评价好的地点
- 考虑地点的实际可达性和开放时间
- 避免虚构或不存在的地点

**3. 时间合理性要求：**
- 每个活动必须有合理的开始和结束时间
- 考虑交通时间、排队时间、用餐时间
- 避免时间安排过于紧凑或松散
- 每天活动总时长控制在8-10小时

**4. 预算分配要求：**
- 住宿费用占总预算25-35%
- 餐饮费用占总预算20-30%
- 交通费用占总预算15-25%
- 门票娱乐费用占总预算10-20%
- 购物及其他费用占总预算5-10%
- 必须预留10%的应急费用

**5. 行程逻辑要求：**
- 按照地理位置合理安排每日行程
- 考虑景点之间的交通便利性
- 第一天安排轻松适应，最后一天安排返程准备
- 重要景点安排在精力充沛的时间段

**6. 个性化要求：**
- 根据用户兴趣偏好安排相应活动
- 考虑旅行风格（经济/舒适/奢华）调整消费水平
- 满足特殊要求（如老人小孩、饮食禁忌等）

**7. 数据格式要求：**
- 必须返回有效的JSON格式
- 所有费用字段必须是数字类型
- 时间格式必须为HH:MM
- 地点名称必须具体明确

请确保生成的行程计划实用、可行、价格准确，并且完全符合用户的预算和需求。`
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
      travelers: planData.travelers || 1,
      itinerary: this.validateItinerary(planData.itinerary || []),
      tips: planData.tips || [],
      budget_breakdown: planData.budget_breakdown || {},
      total_estimated_cost: planData.total_estimated_cost || planData.budget || 2000,
      rawResponse: JSON.stringify(planData)
    }

    // 验证预算合理性
    if (validatedPlan.budget_breakdown) {
      const totalBreakdown = Object.values(validatedPlan.budget_breakdown).reduce((sum, cost) => sum + (cost || 0), 0)
      if (totalBreakdown > validatedPlan.budget * 1.1) {
        // 如果预算分配超过总预算10%，重新分配
        validatedPlan.budget_breakdown = this.redistributeBudget(validatedPlan.budget_breakdown, validatedPlan.budget)
      }
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
    
    return activities.map((activity, index) => {
      // 验证费用合理性
      let estimatedCost = activity.estimated_cost || 0
      if (estimatedCost <= 0) {
        // 根据活动类型设置合理费用
        switch (activity.time_slot) {
          case 'morning': estimatedCost = Math.floor(Math.random() * 100) + 50; break
          case 'afternoon': estimatedCost = Math.floor(Math.random() * 150) + 80; break
          case 'evening': estimatedCost = Math.floor(Math.random() * 120) + 60; break
          default: estimatedCost = Math.floor(Math.random() * 100) + 50
        }
      }
      
      return {
        id: index + 1,
        time_slot: activity.time_slot || 'morning',
        start_time: activity.start_time || '08:00',
        end_time: activity.end_time || '12:00',
        activity_title: activity.activity_title || `活动${index + 1}`,
        activity_description: activity.activity_description || '活动描述',
        location: activity.location || '具体地点',
        estimated_cost: estimatedCost,
        duration_minutes: activity.duration_minutes || 240,
        transportation: activity.transportation || '步行/公共交通',
        travel_time: activity.travel_time || '30分钟',
        order_index: index
      }
    })
  }

  // 重新分配预算
  redistributeBudget(budgetBreakdown, totalBudget) {
    const categories = ['accommodation', 'food', 'transportation', 'tickets', 'shopping', 'other']
    const defaultRatios = {
      accommodation: 0.3,
      food: 0.25,
      transportation: 0.2,
      tickets: 0.15,
      shopping: 0.05,
      other: 0.05
    }
    
    const redistributed = {}
    categories.forEach(category => {
      redistributed[category] = Math.floor(totalBudget * defaultRatios[category])
    })
    
    return redistributed
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

  // 模拟Mistral AI响应（基于实际价格和真实地点）
  getMockResponse() {
    return `{
  "title": "北京3日文化深度游",
  "description": "为您精心策划的北京3日文化之旅，融合历史探索与现代体验，预算控制在2000元以内",
  "days": 3,
  "budget": 2000,
  "travelers": 1,
  "itinerary": [
    {
      "day": 1,
      "date": "2024-10-01",
      "activities": [
        {
          "time_slot": "morning",
          "start_time": "09:00",
          "end_time": "12:00",
          "activity_title": "抵达北京首都机场",
          "activity_description": "乘坐机场快线或出租车前往市区，预计交通费用50元",
          "location": "北京首都国际机场",
          "estimated_cost": 50,
          "duration_minutes": 180,
          "transportation": "机场快线/出租车",
          "travel_time": "60分钟"
        },
        {
          "time_slot": "afternoon",
          "start_time": "14:00",
          "end_time": "17:00",
          "activity_title": "天安门广场游览",
          "activity_description": "参观天安门广场、人民英雄纪念碑，感受首都政治文化中心",
          "location": "天安门广场",
          "estimated_cost": 0,
          "duration_minutes": 180,
          "transportation": "地铁1号线",
          "travel_time": "20分钟"
        },
        {
          "time_slot": "evening",
          "start_time": "18:30",
          "end_time": "20:30",
          "activity_title": "王府井美食体验",
          "activity_description": "品尝正宗北京烤鸭，人均消费80-100元",
          "location": "王府井大街全聚德烤鸭店",
          "estimated_cost": 90,
          "duration_minutes": 120,
          "transportation": "步行",
          "travel_time": "10分钟"
        }
      ],
      "total_cost": 140
    },
    {
      "day": 2,
      "date": "2024-10-02",
      "activities": [
        {
          "time_slot": "morning",
          "start_time": "08:30",
          "end_time": "12:30",
          "activity_title": "故宫博物院深度游",
          "activity_description": "参观故宫博物院，门票60元，建议提前官网预约",
          "location": "故宫博物院",
          "estimated_cost": 60,
          "duration_minutes": 240,
          "transportation": "地铁1号线天安门东站",
          "travel_time": "30分钟"
        },
        {
          "time_slot": "afternoon",
          "start_time": "14:00",
          "end_time": "17:00",
          "activity_title": "景山公园俯瞰故宫",
          "activity_description": "登上景山公园万春亭，俯瞰故宫全景，门票2元",
          "location": "景山公园",
          "estimated_cost": 2,
          "duration_minutes": 180,
          "transportation": "步行",
          "travel_time": "15分钟"
        },
        {
          "time_slot": "evening",
          "start_time": "18:30",
          "end_time": "20:30",
          "activity_title": "前门大街文化体验",
          "activity_description": "前门大街老字号餐厅晚餐，体验传统北京文化",
          "location": "前门大街",
          "estimated_cost": 70,
          "duration_minutes": 120,
          "transportation": "地铁2号线前门站",
          "travel_time": "20分钟"
        }
      ],
      "total_cost": 132
    },
    {
      "day": 3,
      "date": "2024-10-03",
      "activities": [
        {
          "time_slot": "morning",
          "start_time": "07:30",
          "end_time": "13:30",
          "activity_title": "八达岭长城一日游",
          "activity_description": "参加正规旅行社长城一日游，包含交通和门票，费用200元",
          "location": "八达岭长城",
          "estimated_cost": 200,
          "duration_minutes": 360,
          "transportation": "旅游大巴",
          "travel_time": "90分钟"
        },
        {
          "time_slot": "afternoon",
          "start_time": "15:00",
          "end_time": "17:00",
          "activity_title": "特产购物",
          "activity_description": "购买北京特产如稻香村糕点、六必居酱菜等",
          "location": "王府井特产商店",
          "estimated_cost": 100,
          "duration_minutes": 120,
          "transportation": "地铁",
          "travel_time": "60分钟"
        },
        {
          "time_slot": "evening",
          "start_time": "18:00",
          "end_time": "20:00",
          "activity_title": "返程准备",
          "activity_description": "整理行李，前往机场/火车站",
          "location": "酒店",
          "estimated_cost": 50,
          "duration_minutes": 120,
          "transportation": "出租车",
          "travel_time": "60分钟"
        }
      ],
      "total_cost": 350
    }
  ],
  "tips": [
    "北京春秋季节（4-5月，9-10月）气候宜人，最适合旅行",
    "故宫门票需提前7天在官网预约，避开周一闭馆日",
    "长城距离市区较远，建议选择正规旅行社一日游",
    "准备舒适的步行鞋，北京景点步行量较大",
    "学习基本的中文问候语，便于与当地人交流"
  ],
  "budget_breakdown": {
    "accommodation": 600,
    "food": 500,
    "transportation": 400,
    "tickets": 262,
    "shopping": 100,
    "other": 138
  },
  "total_estimated_cost": 2000
}`
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