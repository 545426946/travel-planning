// utils/ai-integration.js - AI 集成工具类
const { aiService } = require('./ai-service')
const { completeDb } = require('./complete_database')

class AIIntegration {
  // 智能行程规划
  async planIntelligentItinerary(userId, userInput) {
    try {
      // 获取用户偏好
      const { data: preferences } = await completeDb.userPreferences.getByUserId(userId)
      
      // 生成行程计划
      const aiResponse = await aiService.generateTravelPlan(userInput, preferences || {})
      
      // 解析AI响应并保存行程
      const planData = this.parseAIResponseToPlan(aiResponse, userId)
      
      if (planData) {
        const { data, error } = await completeDb.travelPlans.create({
          user_id: userId,
          title: planData.title,
          description: planData.description,
          destination: planData.destination,
          start_date: planData.startDate,
          end_date: planData.endDate,
          total_budget: planData.budget,
          itinerary: planData.itinerary,
          is_ai_generated: true,
          tags: planData.tags,
          transportation: planData.transportation,
          accommodation: planData.accommodation
        })
        
        return { success: true, data, aiResponse }
      }
      
      return { success: false, aiResponse }
    } catch (error) {
      console.error('智能行程规划失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 智能景点推荐
  async getSmartDestinationRecommendations(userId, currentLocation = null) {
    try {
      // 获取用户偏好
      const { data: preferences } = await completeDb.userPreferences.getByUserId(userId)
      
      // 获取用户历史收藏
      const { data: favorites } = await completeDb.favorites.getUserFavorites(userId, 'destination')
      
      // 生成AI推荐
      const aiResponse = await aiService.recommendDestinations(
        preferences || {}, 
        currentLocation
      )
      
      // 解析推荐结果
      const recommendations = this.parseDestinationRecommendations(aiResponse)
      
      return {
        success: true,
        recommendations,
        aiResponse,
        userPreferences: preferences
      }
    } catch (error) {
      console.error('智能景点推荐失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 创建AI生成路线
  async createAIGeneratedRoute(routeTheme, difficulty, duration, createdBy = null) {
    try {
      const aiResponse = await aiService.generatePopularRoute(routeTheme, difficulty, duration)
      
      const routeData = this.parseAIRouteToData(aiResponse, routeTheme)
      
      if (routeData) {
        const { data, error } = await supabase
          .from('popular_routes')
          .insert({
            ...routeData,
            is_ai_generated: true,
            created_by: createdBy
          })
          .select()
        
        return { success: true, data, aiResponse }
      }
      
      return { success: false, aiResponse }
    } catch (error) {
      console.error('AI路线生成失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 行程优化建议
  async optimizeItinerary(planId, optimizationGoal = '优化时间安排') {
    try {
      // 获取行程详情
      const { data: plan } = await completeDb.travelPlans.getById(planId)
      
      if (!plan) {
        return { success: false, error: '行程不存在' }
      }
      
      // 生成优化建议
      const aiResponse = await aiService.optimizeTravelPlan(plan, optimizationGoal)
      
      // 保存优化建议到数据库
      const optimizationData = {
        plan_id: planId,
        optimization_goal: optimizationGoal,
        ai_suggestions: aiResponse,
        created_at: new Date().toISOString()
      }
      
      // 这里可以保存到专门的优化建议表，或者更新计划字段
      const { data, error } = await completeDb.travelPlans.update(planId, {
        ai_optimization_suggestions: optimizationData
      })
      
      return { success: true, data, aiResponse }
    } catch (error) {
      console.error('行程优化失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 智能问答
  async askTravelQuestion(userId, question, context = {}) {
    try {
      // 获取用户上下文信息
      const { data: preferences } = await completeDb.userPreferences.getByUserId(userId)
      const { data: recentPlans } = await completeDb.travelPlans.getByUserId(userId, 'planned', 3)
      
      const enrichedContext = {
        userPreferences: preferences,
        recentPlans: recentPlans,
        ...context
      }
      
      const aiResponse = await aiService.travelQA(question, enrichedContext)
      
      // 保存问答记录（可选）
      // 这里可以保存到问答历史表
      
      return { success: true, answer: aiResponse }
    } catch (error) {
      console.error('智能问答失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 生成个性化推荐
  async getPersonalizedRecommendations(userId) {
    try {
      const aiResponse = await aiService.generatePersonalizedRecommendations(userId)
      
      const recommendations = this.parsePersonalizedRecommendations(aiResponse)
      
      return { success: true, recommendations, aiResponse }
    } catch (error) {
      console.error('个性化推荐失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 批量生成景点描述
  async batchGenerateDestinationDescriptions(destinations) {
    const results = []
    
    for (const dest of destinations) {
      try {
        const aiResponse = await aiService.generateDestinationDescription(
          dest.name, 
          { location: dest.location, category: dest.category }
        )
        
        const description = this.parseDestinationDescription(aiResponse)
        
        // 更新数据库
        await supabase
          .from('destinations')
          .update({
            description: description.full,
            short_desc: description.short,
            tags: description.tags
          })
          .eq('id', dest.id)
        
        results.push({ id: dest.id, success: true, description })
      } catch (error) {
        results.push({ id: dest.id, success: false, error: error.message })
      }
    }
    
    return results
  }

  // 解析AI行程响应
  parseAIResponseToPlan(aiResponse, userId) {
    try {
      // 这里实现AI响应解析逻辑
      // 可以根据实际AI输出格式进行调整
      
      const lines = aiResponse.split('\n').filter(line => line.trim())
      
      // 简化的解析逻辑 - 实际实现需要更复杂的NLP处理
      return {
        title: this.extractTitle(aiResponse),
        description: this.extractDescription(aiResponse),
        destination: this.extractDestination(aiResponse),
        startDate: null, // 需要从用户输入或AI响应中解析
        endDate: null,
        budget: this.extractBudget(aiResponse),
        itinerary: aiResponse,
        tags: this.extractTags(aiResponse),
        transportation: this.extractTransportation(aiResponse),
        accommodation: this.extractAccommodation(aiResponse)
      }
    } catch (error) {
      console.error('解析AI响应失败:', error)
      return null
    }
  }

  // 解析景点推荐
  parseDestinationRecommendations(aiResponse) {
    // 解析AI推荐的景点列表
    return {
      destinations: [], // 解析后的景点列表
      summary: aiResponse.substring(0, 200) + '...', // 摘要
      fullResponse: aiResponse
    }
  }

  // 解析路线数据
  parseAIRouteToData(aiResponse, theme) {
    return {
      title: theme + '主题路线',
      description: aiResponse.substring(0, 500),
      itinerary: aiResponse,
      tags: [theme, 'AI生成'],
      difficulty_level: 2,
      price_range: '待定',
      duration: '待定'
    }
  }

  // 解析个性化推荐
  parsePersonalizedRecommendations(aiResponse) {
    return {
      destinations: [],
      routes: [],
      tips: [],
      fullResponse: aiResponse
    }
  }

  // 解析景点描述
  parseDestinationDescription(aiResponse) {
    return {
      short: aiResponse.substring(0, 200),
      full: aiResponse,
      tags: ['热门推荐']
    }
  }

  // 辅助提取方法
  extractTitle(text) {
    const match = text.match(/标题[:：](.+?)(?:\n|$)/)
    return match ? match[1].trim() : 'AI生成行程'
  }

  extractDescription(text) {
    const lines = text.split('\n').filter(line => line.trim())
    return lines.slice(0, 3).join(' ').substring(0, 200)
  }

  extractDestination(text) {
    const match = text.match(/目的地[:：](.+?)(?:\n|$)/)
    return match ? match[1].trim() : '待定'
  }

  extractBudget(text) {
    const match = text.match(/预算[:：](\d+)(?:元|千|万)?/)
    return match ? parseInt(match[1]) : 0
  }

  extractTags(text) {
    const tags = []
    if (text.includes('自然')) tags.push('自然风光')
    if (text.includes('文化')) tags.push('文化历史')
    if (text.includes('美食')) tags.push('美食')
    return tags
  }

  extractTransportation(text) {
    if (text.includes('飞机')) return '飞机'
    if (text.includes('高铁')) return '高铁'
    if (text.includes('自驾')) return '自驾'
    return '待定'
  }

  extractAccommodation(text) {
    if (text.includes('酒店')) return '酒店'
    if (text.includes('民宿')) return '民宿'
    if (text.includes('青年旅社')) return '青年旅社'
    return '待定'
  }
}

// 创建AI集成实例
const aiIntegration = new AIIntegration()

module.exports = { aiIntegration, AIIntegration }