// utils/database.js
const { supabase } = require('./supabase')

// 数据库操作封装
const db = {
  // 用户相关操作
  users: {
    // 根据openid获取用户
    async getByOpenid(openid) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('openid', openid)
        .single()
      
      return { data, error }
    },

    // 创建或更新用户
    async upsert(userData) {
      const { data, error } = await supabase
        .from('users')
        .upsert(userData)
        .select()
      
      return { data, error }
    }
  },

  // 行程相关操作
  travelPlans: {
    // 获取用户的行程
    async getByUserId(userId, status = 'planned') {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false })
      
      return { data, error }
    },

    // 创建新行程
    async create(planData) {
      const { data, error } = await supabase
        .from('travel_plans')
        .insert(planData)
        .select()
      
      return { data, error }
    },

    // 更新行程
    async update(id, updateData) {
      const { data, error } = await supabase
        .from('travel_plans')
        .update(updateData)
        .eq('id', id)
        .select()
      
      return { data, error }
    },

    // 删除行程
    async delete(id) {
      const { data, error } = await supabase
        .from('travel_plans')
        .delete()
        .eq('id', id)
      
      return { data, error }
    }
  },

  // 景点相关操作
  destinations: {
    // 获取热门景点
    async getFeatured(limit = 10) {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit)
      
      return { data, error }
    },

    // 搜索景点
    async search(keyword, category = null) {
      let query = supabase
        .from('destinations')
        .select('*')
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
      
      if (category) {
        query = query.eq('category', category)
      }
      
      const { data, error } = await query.order('rating', { ascending: false })
      
      return { data, error }
    },

    // 根据分类获取景点
    async getByCategory(category, limit = 20) {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('category', category)
        .order('rating', { ascending: false })
        .limit(limit)
      
      return { data, error }
    }
  }
}

module.exports = { db }