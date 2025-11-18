// app.js
const { supabase } = require('./utils/supabase')

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
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    }
  },

  // 登录方法
  async login() {
    try {
      // 微信登录获取code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (loginRes.code) {
        console.log('微信登录成功，code:', loginRes.code)
        
        // 这里应该调用后端接口，用微信code换取用户信息
        // 暂时使用模拟数据
        const mockUserInfo = {
          id: '123456',
          name: '旅行达人小张',
          avatar: 'https://ai-public.mastergo.com/ai/img_res/65805eacde859672f105ac7cb9520d50.jpg',
          token: loginRes.code,
          openid: 'mock_openid_' + Date.now()
        }
        
        // 尝试保存用户到数据库
        try {
          const { data, error } = await supabase
            .from('users')
            .upsert({
              openid: mockUserInfo.openid,
              name: mockUserInfo.name,
              avatar: mockUserInfo.avatar
            })
            .select()
          
          if (error) {
            console.warn('保存用户到数据库失败:', error)
          } else if (data && data.length > 0) {
            mockUserInfo.id = data[0].id
            console.log('用户信息已保存到数据库:', data[0])
          }
        } catch (dbError) {
          console.warn('数据库操作出错:', dbError)
        }
        
        this.globalData.userInfo = mockUserInfo
        this.globalData.isLoggedIn = true
        
        // 保存用户信息到本地存储
        wx.setStorageSync('userInfo', mockUserInfo)
        
        return mockUserInfo
      } else {
        throw new Error('获取微信登录code失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  // 退出登录
  logout() {
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('userInfo')
    console.log('退出登录')
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    systemInfo: null,
    supabase: supabase,
    baseUrl: 'https://your-api-domain.com/api' // API基础URL
  }
})