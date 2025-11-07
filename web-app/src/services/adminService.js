// 管理员服务 - 管理用户和景点数据
import { message } from 'ant-design-vue'
import authService from './authService'

class AdminService {
  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }

  // 检查管理员权限
  checkAdminPermissions() {
    if (!this.isLoggedIn()) {
      throw new Error('请先登录管理员账户')
    }
  }

  // 调用Supabase函数
  async callSupabaseFunction(functionName, params = {}) {
    this.checkAdminPermissions()

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase配置未找到')
    }

    console.log(`调用Supabase函数: ${functionName}`, params)

    const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API请求失败: ${response.status} - ${errorText}`)
      throw new Error(`API请求失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`函数调用结果: ${functionName}`, result)
    return result
  }

  // 管理员登录
  async adminLogin(username, password) {
    try {
      if (!this.supabaseUrl || !this.supabaseKey) {
        throw new Error('数据库连接配置缺失')
      }

      // 首先验证用户凭据
      const authResponse = await fetch(`${this.supabaseUrl}/rest/v1/rpc/authenticate_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          p_username: username,
          p_password: password
        })
      })

      if (!authResponse.ok) {
        throw new Error('认证请求失败')
      }

      const authData = await authResponse.json()
      
      if (!authData || authData.length === 0) {
        throw new Error('用户名或密码错误')
      }

      const userData = authData[0]
      
      if (!userData.is_valid) {
        throw new Error('用户名或密码错误')
      }

      // 检查用户是否为管理员
      const adminCheckResponse = await fetch(`${this.supabaseUrl}/rest/v1/app_users?id=eq.${userData.id}&select=role`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      if (!adminCheckResponse.ok) {
        throw new Error('无法验证用户权限')
      }

      const adminData = await adminCheckResponse.json()
      
      if (!adminData || adminData.length === 0 || adminData[0].role !== 'admin') {
        throw new Error('权限不足：需要管理员权限')
      }

      // 登录成功，存储管理员信息到本地存储
      const adminInfo = {
        id: userData.id,
        username: username,
        email: userData.email || `${username}@travelplanner.com`,
        role: 'admin',
        isAdmin: true
      }
      
      localStorage.setItem('adminUser', JSON.stringify(adminInfo))

      message.success('管理员登录成功！')
      return { success: true, user: adminInfo }
    } catch (error) {
      console.error('管理员登录失败:', error)
      
      // 如果数据库连接失败，提供备用模拟登录
      if (error.message.includes('认证请求失败') || error.message.includes('数据库连接')) {
        console.warn('数据库连接失败，使用模拟登录')
        
        // 模拟管理员账户
        const mockAdmins = [
          { username: 'admin', password: 'admin123' },
          { username: 'manager', password: 'admin123' }
        ]
        
        const matchedAdmin = mockAdmins.find(admin => 
          admin.username === username && admin.password === password
        )
        
        if (matchedAdmin) {
          const adminInfo = {
            id: Date.now(),
            username: username,
            email: `${username}@travelplanner.com`,
            role: 'admin',
            isAdmin: true
          }
          
          localStorage.setItem('adminUser', JSON.stringify(adminInfo))
          message.success('管理员登录成功！（模拟模式）')
          return { success: true, user: adminInfo }
        }
      }
      
      throw error
    }
  }

  // 获取所有用户列表
  async getAllUsers() {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/app_users?select=*`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`获取用户列表失败: ${response.status}`)
      }

      const users = await response.json()
      
      // 格式化用户数据
      return users.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.display_name || user.username,
        email: user.email,
        role: user.role || 'user',
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        isActive: true
      }))
    } catch (error) {
      console.error('获取用户列表失败:', error)
      throw error
    }
  }

  // 更新用户信息
  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/app_users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          display_name: userData.displayName,
          updated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        message.success('用户信息更新成功')
        return { success: true }
      } else {
        throw new Error('更新用户信息失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  }

  // 删除用户
  async deleteUser(userId) {
    try {
      // 首先检查不能删除自己
      const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
      if (currentUser && currentUser.id === userId) {
        throw new Error('不能删除当前登录的用户')
      }

      const response = await fetch(`${this.supabaseUrl}/rest/v1/app_users?id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      if (response.ok) {
        message.success('用户删除成功')
        return { success: true }
      } else {
        throw new Error('删除用户失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      throw error
    }
  }

  // 创建新用户
  async createUser(userData) {
    try {
      const { username, password, displayName, email, role } = userData

      // 前端验证
      if (!username || !password) {
        throw new Error('用户名和密码不能为空')
      }

      if (username.length < 3 || username.length > 50) {
        throw new Error('用户名长度必须在3-50个字符之间')
      }

      if (password.length < 6) {
        throw new Error('密码长度不能少于6个字符')
      }

      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/register_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          p_username: username,
          p_password: password,
          p_email: email || null,
          p_display_name: displayName || username,
          p_role: role || 'user'
        })
      })

      if (response.ok) {
        const result = await response.json()
        message.success('用户创建成功')
        return { success: true, userId: result }
      } else {
        const errorText = await response.text()
        if (errorText.includes('用户名已存在')) {
          throw new Error('用户名已存在，请选择其他用户名')
        }
        throw new Error('创建用户失败')
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      throw error
    }
  }

  // 获取所有景点列表
  async getAllAttractions() {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/attractions?select=*`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`获取景点列表失败: ${response.status}`)
      }

      const attractions = await response.json()
      
      // 格式化景点数据
      return attractions.map(attraction => ({
        id: attraction.id,
        name: attraction.name,
        description: attraction.description,
        location: attraction.location,
        country: attraction.country,
        region: attraction.region,
        type: attraction.type,
        rating: attraction.rating,
        entryFee: attraction.entry_fee,
        bestTimeToVisit: attraction.best_time_to_visit,
        imageUrl: attraction.image_url,
        tags: attraction.tags || [],
        createdAt: attraction.created_at
      }))
    } catch (error) {
      console.error('获取景点列表失败:', error)
      throw error
    }
  }

  // 更新景点信息
  async updateAttraction(attractionId, attractionData) {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/attractions?id=eq.${attractionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: attractionData.name,
          description: attractionData.description,
          location: attractionData.location,
          city: attractionData.city,
          type: attractionData.type,
          rating: attractionData.rating,
          price_range: attractionData.priceRange,
          opening_hours: attractionData.openingHours,
          image_url: attractionData.imageUrl,
          is_active: attractionData.isActive,
          updated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        message.success('景点信息更新成功')
        return { success: true }
      } else {
        throw new Error('更新景点信息失败')
      }
    } catch (error) {
      console.error('更新景点信息失败:', error)
      throw error
    }
  }

  // 删除景点
  async deleteAttraction(attractionId) {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/attractions?id=eq.${attractionId}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      if (response.ok) {
        message.success('景点删除成功')
        return { success: true }
      } else {
        throw new Error('删除景点失败')
      }
    } catch (error) {
      console.error('删除景点失败:', error)
      throw error
    }
  }

  // 创建新景点
  async createAttraction(attractionData) {
    try {
      const { name, description, location, city, type, rating, priceRange, openingHours, imageUrl } = attractionData

      // 前端验证
      if (!name || !description || !location) {
        throw new Error('景点名称、描述和位置不能为空')
      }

      const response = await fetch(`${this.supabaseUrl}/rest/v1/attractions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: name,
          description: description,
          location: location,
          city: city || '',
          type: type || '景点',
          rating: rating || 0,
          price_range: priceRange || '免费',
          opening_hours: openingHours || '全天开放',
          image_url: imageUrl || '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        const result = await response.json()
        message.success('景点创建成功')
        return { success: true, attractionId: result[0].id }
      } else {
        throw new Error('创建景点失败')
      }
    } catch (error) {
      console.error('创建景点失败:', error)
      throw error
    }
  }

  // 获取统计数据
  async getDashboardStats() {
    try {
      // 获取用户总数
      const usersResponse = await fetch(`${this.supabaseUrl}/rest/v1/app_users?select=count`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      // 获取景点总数
      const attractionsResponse = await fetch(`${this.supabaseUrl}/rest/v1/attractions?select=count`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      // 获取旅行计划总数
      const plansResponse = await fetch(`${this.supabaseUrl}/rest/v1/travel_plans?select=count`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      // 获取城市总数
      const citiesResponse = await fetch(`${this.supabaseUrl}/rest/v1/cities?select=count`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      })

      if (!usersResponse.ok || !attractionsResponse.ok || !plansResponse.ok || !citiesResponse.ok) {
        throw new Error('获取统计数据失败')
      }

      const usersCount = await usersResponse.json()
      const attractionsCount = await attractionsResponse.json()
      const plansCount = await plansResponse.json()
      const citiesCount = await citiesResponse.json()

      return {
        totalUsers: usersCount.length > 0 ? usersCount[0].count : 0,
        totalAttractions: attractionsCount.length > 0 ? attractionsCount[0].count : 0,
        totalPlans: plansCount.length > 0 ? plansCount[0].count : 0,
        totalCities: citiesCount.length > 0 ? citiesCount[0].count : 0
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      // 返回默认数据，避免页面错误
      return {
        totalUsers: 0,
        totalAttractions: 0,
        totalPlans: 0,
        totalCities: 0
      }
    }
  }

  // 检查是否已登录
  isLoggedIn() {
    const adminUser = localStorage.getItem('adminUser')
    return adminUser !== null && adminUser !== 'null'
  }

  // 获取当前管理员用户
  getCurrentAdmin() {
    const adminUser = localStorage.getItem('adminUser')
    return adminUser ? JSON.parse(adminUser) : null
  }

  // 管理员退出登录
  adminLogout() {
    localStorage.removeItem('adminUser')
    message.success('管理员已退出登录')
  }

  // 检查是否为管理员
  isAdmin() {
    return this.isLoggedIn()
  }
}

// 创建单例实例
export default new AdminService()