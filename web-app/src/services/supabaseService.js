// Supabase数据库服务
import { createClient } from '@supabase/supabase-js'

class SupabaseService {
  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    
    if (this.supabaseUrl && this.supabaseKey) {
      this.client = createClient(this.supabaseUrl, this.supabaseKey)
    } else {
      console.warn('Supabase配置未找到，使用本地存储')
      this.client = null
    }
  }

  // 保存行程到数据库
  async savePlan(planData) {
    try {
      if (this.client) {
        // 保存到Supabase
        const { data, error } = await this.client
          .from('travel_plans')
          .insert([{
            title: planData.title,
            description: planData.description,
            days: planData.days,
            budget: planData.budget,
            travelers: planData.travelers,
            destination: planData.destination,
            itinerary: planData.itinerary,
            tips: planData.tips,
            is_ai_generated: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()

        if (error) throw error
        return { success: true, data: data[0] }
      } else {
        // 保存到本地存储
        const plans = JSON.parse(localStorage.getItem('travel_plans') || '[]')
        const newPlan = {
          id: Date.now(),
          ...planData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        plans.unshift(newPlan)
        localStorage.setItem('travel_plans', JSON.stringify(plans))
        return { success: true, data: newPlan }
      }
    } catch (error) {
      console.error('保存行程失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取所有行程
  async getPlans() {
    try {
      if (this.client) {
        const { data, error } = await this.client
          .from('travel_plans')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
      } else {
        const plans = JSON.parse(localStorage.getItem('travel_plans') || '[]')
        return { success: true, data: plans }
      }
    } catch (error) {
      console.error('获取行程失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 删除行程
  async deletePlan(planId) {
    try {
      if (this.client) {
        const { error } = await this.client
          .from('travel_plans')
          .delete()
          .eq('id', planId)

        if (error) throw error
        return { success: true }
      } else {
        const plans = JSON.parse(localStorage.getItem('travel_plans') || '[]')
        const filteredPlans = plans.filter(plan => plan.id !== planId)
        localStorage.setItem('travel_plans', JSON.stringify(filteredPlans))
        return { success: true }
      }
    } catch (error) {
      console.error('删除行程失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 更新行程
  async updatePlan(planId, updates) {
    try {
      if (this.client) {
        const { data, error } = await this.client
          .from('travel_plans')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', planId)
          .select()

        if (error) throw error
        return { success: true, data: data[0] }
      } else {
        const plans = JSON.parse(localStorage.getItem('travel_plans') || '[]')
        const planIndex = plans.findIndex(plan => plan.id === planId)
        if (planIndex !== -1) {
          plans[planIndex] = {
            ...plans[planIndex],
            ...updates,
            updated_at: new Date().toISOString()
          }
          localStorage.setItem('travel_plans', JSON.stringify(plans))
          return { success: true, data: plans[planIndex] }
        }
        return { success: false, error: '行程未找到' }
      }
    } catch (error) {
      console.error('更新行程失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取行程详情（包括活动）
  async getPlanDetail(planId) {
    try {
      if (this.client) {
        // 获取行程基本信息
        const { data: planData, error: planError } = await this.client
          .from('travel_plans')
          .select('*')
          .eq('id', planId)
          .single()

        if (planError) throw planError

        // 获取行程活动
        const { data: activitiesData, error: activitiesError } = await this.client
          .from('plan_activities')
          .select('*')
          .eq('plan_id', planId)
          .order('day_number')
          .order('order_index')

        if (activitiesError) throw activitiesError

        return { 
          success: true, 
          data: {
            ...planData,
            activities: activitiesData || []
          }
        }
      } else {
        const plans = JSON.parse(localStorage.getItem('travel_plans') || '[]')
        const plan = plans.find(p => p.id === planId)
        if (!plan) {
          return { success: false, error: '行程未找到' }
        }
        
        const activities = JSON.parse(localStorage.getItem(`plan_activities_${planId}`) || '[]')
        return { 
          success: true, 
          data: {
            ...plan,
            activities: activities
          }
        }
      }
    } catch (error) {
      console.error('获取行程详情失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 保存行程活动
  async savePlanActivities(planId, activities) {
    try {
      if (this.client) {
        // 先删除现有活动
        const { error: deleteError } = await this.client
          .from('plan_activities')
          .delete()
          .eq('plan_id', planId)

        if (deleteError) throw deleteError

        // 插入新活动
        if (activities && activities.length > 0) {
          const { error: insertError } = await this.client
            .from('plan_activities')
            .insert(activities.map(activity => ({
              ...activity,
              plan_id: planId
            })))

          if (insertError) throw insertError
        }

        return { success: true }
      } else {
        localStorage.setItem(`plan_activities_${planId}`, JSON.stringify(activities || []))
        return { success: true }
      }
    } catch (error) {
      console.error('保存行程活动失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 测试数据库连接
  async testConnection() {
    try {
      if (this.client) {
        const { data, error } = await this.client.from('travel_plans').select('count')
        return !error
      }
      return true // 本地存储总是可用
    } catch (error) {
      return false
    }
  }
}

export default new SupabaseService()