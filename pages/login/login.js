// pages/login/login.js
const { supabase } = require('../../utils/supabase')
const app = getApp()

Page({
  data: {
    // 登录方式：0 - 账号密码，1 - 微信登录
    loginType: 0,
    // 表单数据
    formData: {
      username: '',
      password: ''
    },
    // 表单验证
    formErrors: {
      username: '',
      password: ''
    },
    // 登录状态
    isLoading: false,
    // 显示密码
    showPassword: false,
    // 记住我
    rememberMe: false
  },

  onLoad() {
    console.log('登录页面加载')
    // 检查是否已登录
    if (app.globalData.isLoggedIn) {
      this.redirectToHome()
    }
    
    // 加载保存的用户名
    this.loadSavedUsername()
  },

  // 切换登录方式
  switchLoginType(e) {
    const type = parseInt(e.currentTarget.dataset.type)
    this.setData({ loginType: type })
  },

  // 表单输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    const formData = { ...this.data.formData }
    formData[field] = value
    
    this.setData({ 
      formData,
      [`formErrors.${field}`]: '' // 清除该字段的错误
    })
  },

  // 切换密码显示
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  // 切换记住我
  toggleRemember() {
    this.setData({
      rememberMe: !this.data.rememberMe
    })
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data
    const errors = {}
    let isValid = true

    if (!formData.username.trim()) {
      errors.username = '请输入用户名/邮箱/手机号'
      isValid = false
    }

    if (!formData.password.trim()) {
      errors.password = '请输入密码'
      isValid = false
    } else if (formData.password.length < 6) {
      errors.password = '密码至少6位'
      isValid = false
    }

    this.setData({ formErrors: errors })
    return isValid
  },

  // 账号密码登录
  async accountLogin() {
    if (!this.validateForm()) {
      return
    }

    this.setData({ isLoading: true })

    try {
      const { formData, rememberMe } = this.data

      // 查询用户信息
      const { data: users, error: queryError } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${formData.username},email.eq.${formData.username},phone.eq.${formData.username}`)
        .limit(1)

      if (queryError) {
        throw new Error('查询用户失败：' + queryError.message)
      }

      if (!users || users.length === 0) {
        throw new Error('用户不存在')
      }

      const user = users[0]

      // 验证密码（这里需要根据实际密码加密方式调整）
      if (user.password !== formData.password) {
        throw new Error('密码错误')
      }

      // 构建用户信息
      const userInfo = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || 'https://ai-public.mastergo.com/ai/img_res/65805eacde859672f105ac7cb9520d50.jpg',
        loginType: 'account',
        token: this.generateToken(user.id)
      }

      // 保存用户信息
      await this.saveUserLogin(userInfo, rememberMe)

      // 登录成功
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        this.redirectToHome()
      }, 1500)

    } catch (error) {
      console.error('账号登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 微信一键登录
  async wechatLogin() {
    this.setData({ isLoading: true })

    try {
      // 先获取用户信息（必须在用户手势中调用）
      const userInfoRes = await this.getUserProfile()

      // 调用微信登录
      const loginRes = await this.wechatLoginRequest()
      
      if (!loginRes.code) {
        throw new Error('微信登录授权失败')
      }

      // 构建用户数据
      const userData = {
        openid: loginRes.code, // 实际应该通过后端换取openid
        name: userInfoRes.nickName || '微信用户',
        avatar: userInfoRes.avatarUrl || 'https://ai-public.mastergo.com/ai/img_res/65805eacde859672f105ac7cb9520d50.jpg',
        loginType: 'wechat'
      }

      // 保存或更新用户信息到数据库
      const { data, error } = await supabase
        .from('users')
        .upsert({
          openid: userData.openid,
          name: userData.name,
          avatar: userData.avatar,
          last_login: new Date().toISOString()
        }, {
          onConflict: 'openid'
        })
        .select()

      if (error) {
        console.warn('保存微信用户失败:', error)
      }

      // 构建登录用户信息
      const finalUserInfo = {
        id: data?.[0]?.id || Date.now(),
        name: userData.name,
        avatar: userData.avatar,
        openid: userData.openid,
        loginType: 'wechat',
        token: this.generateToken(userData.openid)
      }

      // 保存登录状态
      await this.saveUserLogin(finalUserInfo, false)

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        this.redirectToHome()
      }, 1500)

    } catch (error) {
      console.error('微信登录失败:', error)
      wx.showToast({
        title: error.message || '微信登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 封装微信登录API
  wechatLoginRequest() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      })
    })
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: resolve,
        fail: reject
      })
    })
  },

  // 生成简单token
  generateToken(userId) {
    return 'token_' + userId + '_' + Date.now()
  },

  // 保存用户登录信息
  async saveUserLogin(userInfo, rememberMe) {
    // 保存到全局状态
    app.globalData.userInfo = userInfo
    app.globalData.isLoggedIn = true

    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo)

    // 如果选择记住我，保存用户名
    if (rememberMe && userInfo.username) {
      wx.setStorageSync('savedUsername', userInfo.username)
    } else {
      wx.removeStorageSync('savedUsername')
    }

    // 记录登录时间
    wx.setStorageSync('loginTime', new Date().toISOString())
  },

  // 加载保存的用户名
  loadSavedUsername() {
    const savedUsername = wx.getStorageSync('savedUsername')
    if (savedUsername) {
      this.setData({
        'formData.username': savedUsername,
        rememberMe: true
      })
    }
  },

  // 跳转到首页
  redirectToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 忘记密码
  forgotPassword() {
    wx.showModal({
      title: '忘记密码',
      content: '请联系客服重置密码\n客服电话：400-123-4567',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  },

  // 查看用户协议
  viewUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '使用本应用即表示您同意我们的服务条款和隐私政策。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 查看隐私政策
  viewPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私，所有用户数据都将得到保护。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})