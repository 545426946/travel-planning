// utils/database.js
const supabase = require('./supabase').supabase

// 数据库操作封装
const db = {
  // 用户相关操作
  users: {
    // 根据openid获取用户
    getByOpenid(openid) {
      return supabase
        .from('users')
        .select('*')
        .eq('openid', openid)
        .single()
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    },

    // 创建或更新用户
    upsert(userData) {
      return supabase
        .from('users')
        .upsert(userData)
        .select()
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    }
  },

  // 行程相关操作
  travelPlans: {
    // 获取用户的行程
    getByUserId(userId, status = 'planned') {
      return supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    },

    // 创建新行程
    create(planData) {
      return supabase
        .from('travel_plans')
        .insert(planData)
        .select()
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    },

    // 更新行程
    update(id, updateData) {
      return supabase
        .from('travel_plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    },

    // 删除行程
    delete(id) {
      return supabase
        .from('travel_plans')
        .delete()
        .eq('id', id)
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    }
  },

  // 景点相关操作
  destinations: {
    // 获取热门景点
    getFeatured(limit = 10) {
      return supabase
        .from('destinations')
        .select('*')
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit)
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    },

    // 搜索景点
    search(keyword, category = null) {
      let query = supabase
        .from('destinations')
        .select('*')
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
      
      if (category) {
        query = query.eq('category', category)
      }
      
      return query.order('rating', { ascending: false })
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    },

    // 根据分类获取景点
    getByCategory(category, limit = 20) {
      return supabase
        .from('destinations')
        .select('*')
        .eq('category', category)
        .order('rating', { ascending: false })
        .limit(limit)
        .then(({ data, error }) => ({ data, error }))
        .catch(error => ({ data: null, error }))
    }
  }
}

module.exports = { db }