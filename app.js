// app.js
const supabase = require('./utils/supabase').supabase
const Auth = require('./utils/auth').Auth

App({
  onLaunch() {
    console.log('小程序启动')
    
    // 检查登录状态
    this.checkLoginStatus()
    
    // 获取系统信息
    wx.getWindowInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        console.log('窗口信息:', res)
      }
    })
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = Auth.getCurrentUser()
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
      
      // 检查登录是否过期
      if (Auth.isLoginExpired(30)) {
        console.log('登录已过期，需要重新登录')
        Auth.clearUserLogin()
        this.globalData.isLoggedIn = false
        return
      }
      
      // 检查用户信息是否完整，如果不完整则尝试从数据库更新
      if (!userInfo.id || !userInfo.name) {
        this.updateUserInfo(userInfo)
      }
    }
  },

  // 更新用户信息
  async updateUserInfo(localUserInfo) {
    const updatedUserInfo = await Auth.refreshUserInfo(supabase)
    if (updatedUserInfo) {
      this.globalData.userInfo = updatedUserInfo
    }
  },

  // 微信登录方法
  wechatLogin() {
    return new Promise((resolve, reject) => {
      // 微信登录获取code
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            console.log('微信登录成功，code:', loginRes.code)
            
            // 这里应该调用后端接口，用微信code换取用户信息
            // 暂时使用模拟数据
            const mockUserInfo = {
              id: '123456',
              name: '旅行达人小张',
              avatar: 'https://ai-public.mastergo.com/ai/img_res/65805eacde859672f105ac7cb9520d50.jpg',
              token: loginRes.code,
              openid: 'mock_openid_' + Date.now(),
              loginType: 'wechat'
            }
            
            // 尝试保存用户到数据库
            supabase
              .from('users')
              .upsert({
                openid: mockUserInfo.openid,
                name: mockUserInfo.name,
                avatar: mockUserInfo.avatar,
                login_type: 'wechat',
                last_login: new Date().toISOString()
              })
              .select()
              .then((result) => {
                const data = result.data;
                const error = result.error;
                if (error) {
                  console.warn('保存用户到数据库失败:', error)
                } else if (data && data.length > 0) {
                  mockUserInfo.id = data[0].id
                  console.log('用户信息已保存到数据库:', data[0])
                }
                
                this.globalData.userInfo = mockUserInfo
                this.globalData.isLoggedIn = true
                
                // 保存用户信息到本地存储
                wx.setStorageSync('userInfo', mockUserInfo)
                
                resolve(mockUserInfo)
              })
              .catch((dbError) => {
                console.warn('数据库操作出错:', dbError)
                // 即使数据库操作失败，也继续登录流程
                this.globalData.userInfo = mockUserInfo
                this.globalData.isLoggedIn = true
                wx.setStorageSync('userInfo', mockUserInfo)
                resolve(mockUserInfo)
              })
          } else {
            reject(new Error('获取微信登录code失败'))
          }
        },
        fail: (error) => {
          console.error('微信登录失败:', error)
          reject(error)
        }
      })
    })
  },

  // 通用登录方法（保持向后兼容）
  login() {
    return this.wechatLogin()
  },

  // 退出登录
  logout() {
    Auth.clearUserLogin()
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    console.log('退出登录')
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    systemInfo: null,
    supabase: supabase,
    baseUrl: 'https://your-api-domain.com/api', // API基础URL
    config: {
      // AI 服务配置
      AI_API_KEY: 'E8L3fryNUIsAoWvROdNrumpwFTtfuCBL',
      AI_API_URL: 'https://api.mistral.ai/v1/chat/completions',
      AI_MODEL: 'mistral-small-latest',
      // Supabase 配置
      SUPABASE_URL: 'https://hmnjuntvubqvbpeyqoxw.supabase.co',
      SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtbmp1bnR2dWJxdmJwZXlxb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjEwNDYsImV4cCI6MjA3ODk5NzA0Nn0.BCp0_8M3OhlIhLQ4fz54le-sWqZeUx9JDRXr1XRsX8g'
    }
  }
})