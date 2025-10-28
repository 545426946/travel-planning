// 用户认证服务
import { message } from 'ant-design-vue'

class AuthService {
  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    this.currentUser = null
    this.sessionToken = this.getStoredSessionToken()
    this.listeners = []
    
    // 初始化时验证现有会话
    this.validateCurrentSession()
  }

  // 添加状态变化监听器
  addListener(callback) {
    this.listeners.push(callback)
  }

  // 移除状态变化监听器
  removeListener(callback) {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          isLoggedIn: this.isLoggedIn(),
          currentUser: this.getCurrentUser()
        })
      } catch (error) {
        console.error('Auth listener error:', error)
      }
    })
    
    // 同时触发全局事件
    window.dispatchEvent(new CustomEvent('authStateChange', {
      detail: {
        isLoggedIn: this.isLoggedIn(),
        currentUser: this.getCurrentUser()
      }
    }))
  }

  // 获取存储的会话token
  getStoredSessionToken() {
    return localStorage.getItem('travel_planner_session_token') || null
  }

  // 存储会话token
  setStoredSessionToken(token) {
    if (token) {
      localStorage.setItem('travel_planner_session_token', token)
    } else {
      localStorage.removeItem('travel_planner_session_token')
    }
  }

  // 存储用户信息
  setStoredUser(user) {
    if (user) {
      localStorage.setItem('travel_planner_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('travel_planner_user')
    }
  }

  // 获取存储的用户信息
  getStoredUser() {
    const userStr = localStorage.getItem('travel_planner_user')
    return userStr ? JSON.parse(userStr) : null
  }

  // 验证当前会话
  async validateCurrentSession() {
    if (!this.sessionToken) {
      this.currentUser = null
      return false
    }

    try {
      const response = await this.callSupabaseFunction('validate_session', {
        session_token: this.sessionToken
      })

      if (response.data && response.data.length > 0 && response.data[0].is_valid) {
        this.currentUser = {
          id: response.data[0].user_id,
          username: response.data[0].username,
          displayName: response.data[0].display_name
        }
        this.setStoredUser(this.currentUser)
        return true
      } else {
        this.logout()
        return false
      }
    } catch (error) {
      console.error('会话验证失败:', error)
      this.logout()
      return false
    }
  }

  // 调用Supabase函数
  async callSupabaseFunction(functionName, params = {}) {
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

  // 用户注册
  async register(userData) {
    const { username, password, confirmPassword, email, displayName } = userData

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

    if (password !== confirmPassword) {
      throw new Error('两次输入的密码不一致')
    }

    try {
      const response = await this.callSupabaseFunction('register_user', {
        p_username: username,
        p_password: password,
        p_email: email || null,
        p_display_name: displayName || username
      })

      if (response) {
        message.success('注册成功！请登录')
        return { success: true, userId: response }
      }
    } catch (error) {
      console.error('注册失败:', error)
      
      if (error.message.includes('用户名已存在')) {
        throw new Error('用户名已存在，请选择其他用户名')
      } else {
        throw new Error(`注册失败: ${error.message}`)
      }
    }
  }

  // 用户登录
  async login(username, password) {
    if (!username || !password) {
      throw new Error('用户名和密码不能为空')
    }

    try {
      // 方法1: 尝试使用数据库函数
      try {
        const authResponse = await this.callSupabaseFunction('authenticate_user', {
          p_username: username,
          p_password: password
        })

        console.log('登录验证响应:', authResponse)

        if (authResponse && authResponse.length > 0) {
          const userData = authResponse[0]
          
          if (userData.is_valid) {
            // 创建会话
            const sessionResponse = await this.callSupabaseFunction('create_user_session', {
              p_user_id: userData.user_id
            })

            console.log('会话创建响应:', sessionResponse)

            if (sessionResponse && sessionResponse.length > 0) {
              const sessionData = sessionResponse[0]
              
              this.sessionToken = sessionData.session_token
              this.currentUser = {
                id: userData.user_id,
                username: userData.username,
                displayName: userData.display_name
              }
              
              // 存储会话和用户信息
              this.setStoredSessionToken(this.sessionToken)
              this.setStoredUser(this.currentUser)
              
              message.success(`欢迎回来，${userData.display_name || userData.username}！`)
              return { success: true, user: this.currentUser }
            }
          }
        }
      } catch (funcError) {
        console.warn('数据库函数调用失败，尝试直接查询:', funcError)
      }

      // 方法2: 使用数据库函数进行密码验证
      try {
        // 再次尝试使用数据库函数进行验证
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
          throw new Error(`认证请求失败: ${authResponse.status}`)
        }

        const authData = await authResponse.json()
        
        if (!authData || authData.length === 0) {
          throw new Error('用户名或密码错误')
        }

        const userData = authData[0]
        
        if (!userData.is_valid) {
          throw new Error('用户名或密码错误')
        }

        // 创建会话
        const sessionResponse = await fetch(`${this.supabaseUrl}/rest/v1/rpc/create_user_session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            p_user_id: userData.user_id
          })
        })

        if (!sessionResponse.ok) {
          throw new Error(`会话创建失败: ${sessionResponse.status}`)
        }

        const sessionData = await sessionResponse.json()
        
        if (!sessionData || sessionData.length === 0) {
          throw new Error('会话创建失败')
        }

        const sessionInfo = sessionData[0]
        
        this.sessionToken = sessionInfo.session_token
        this.currentUser = {
          id: userData.user_id,
          username: userData.username,
          displayName: userData.display_name || userData.username
        }
        
        // 存储会话和用户信息
        this.setStoredSessionToken(this.sessionToken)
        this.setStoredUser(this.currentUser)
        
        // 通知状态变化
        this.notifyListeners()
        
        message.success(`欢迎回来，${this.currentUser.displayName}！`)
        return { success: true, user: this.currentUser }
        
      } catch (fallbackError) {
        console.error('备用认证方法失败:', fallbackError)
        throw new Error('认证服务暂时不可用，请稍后重试')
      }
      
    } catch (error) {
      console.error('登录失败:', error)
      
      if (error.message.includes('用户名或密码错误')) {
        throw new Error('用户名或密码错误')
      }
      
      throw new Error(`登录失败: ${error.message}`)
    }
  }

  // 用户登出
  logout() {
    this.currentUser = null
    this.sessionToken = null
    this.setStoredSessionToken(null)
    this.setStoredUser(null)
    
    // 通知状态变化
    this.notifyListeners()
    
    message.success('已成功登出')
  }

  // 获取当前用户
  getCurrentUser() {
    return this.currentUser
  }

  // 检查是否已登录
  isLoggedIn() {
    return !!this.currentUser && !!this.sessionToken
  }

  // 获取会话token（用于API调用）
  getSessionToken() {
    return this.sessionToken
  }

  // 更新用户信息
  async updateUserProfile(userData) {
    if (!this.isLoggedIn()) {
      throw new Error('请先登录')
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/app_users?id=eq.${this.currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          display_name: userData.displayName,
          email: userData.email,
          updated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        this.currentUser.displayName = userData.displayName
        this.setStoredUser(this.currentUser)
        message.success('个人信息更新成功')
        return { success: true }
      } else {
        throw new Error('更新失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw new Error(`更新失败: ${error.message}`)
    }
  }

  // 修改密码
  async changePassword(oldPassword, newPassword) {
    if (!this.isLoggedIn()) {
      throw new Error('请先登录')
    }

    if (!oldPassword || !newPassword) {
      throw new Error('原密码和新密码不能为空')
    }

    if (newPassword.length < 6) {
      throw new Error('新密码长度不能少于6个字符')
    }

    try {
      // 先验证原密码
      const authResponse = await this.callSupabaseFunction('authenticate_user', {
        p_username: this.currentUser.username,
        p_password: oldPassword
      })

      if (!authResponse.data || !authResponse.data[0] || !authResponse.data[0].is_valid) {
        throw new Error('原密码错误')
      }

      // 更新密码
      const response = await fetch(`${this.supabaseUrl}/rest/v1/app_users?id=eq.${this.currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          password_hash: `\\x${Buffer.from(newPassword).toString('hex')}`, // 简化处理，实际应该加密
          updated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        message.success('密码修改成功')
        return { success: true }
      } else {
        throw new Error('密码修改失败')
      }
    } catch (error) {
      console.error('修改密码失败:', error)
      throw new Error(`修改密码失败: ${error.message}`)
    }
  }
}

// 创建单例实例
export default new AuthService()