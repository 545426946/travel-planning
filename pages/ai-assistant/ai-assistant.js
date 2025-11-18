// pages/ai-assistant/ai-assistant.js
const aiIntegration = require('../../utils/ai-integration').aiIntegration
const app = getApp()

Page({
  data: {
    userInfo: null,
    currentTab: 0,
    chatHistory: [],
    inputValue: '',
    quickQuestions: [
      '云南最佳旅游时间是什么时候？',
      '去日本旅游需要准备什么？',
      '如何制定完美的旅行计划？',
      '国内有哪些必去的景点？'
    ],
    isLoading: false,
    scrollToView: ''
  },

  onLoad() {
    console.log('AI助手页面加载')
    
    // 获取用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
    
    // 初始化聊天记录
    this.initChatHistory()
  },

  onShow() {
    // 页面显示时滚动到底部
    this.scrollToBottom()
  },

  // 初始化聊天记录
  initChatHistory() {
    const savedHistory = wx.getStorageSync('aiChatHistory') || []
    this.setData({ chatHistory: savedHistory })
  },

  // 切换功能Tab
  switchTab(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentTab: index })
  },

  // 处理输入
  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  // 发送消息
  async sendMessage() {
    const message = this.data.inputValue.trim()
    if (!message) return

    // 添加用户消息到聊天记录
    const newHistory = this.data.chatHistory.slice()
    newHistory.push({
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    })

    this.setData({ 
      chatHistory: newHistory,
      inputValue: '',
      isLoading: true 
    })

    this.scrollToBottom()

    try {
      // 调用AI服务
      const result = await aiIntegration.askTravelQuestion(
        this.data.userInfo?.id,
        message,
        { page: 'ai-assistant' }
      )

      if (result.success) {
        // 添加AI回复
        newHistory.push({
          type: 'ai',
          content: result.answer,
          timestamp: new Date().toISOString()
        })

        this.setData({ chatHistory: newHistory })
        this.saveChatHistory(newHistory)
      } else {
        // 显示错误消息
        newHistory.push({
          type: 'error',
          content: '抱歉，AI服务暂时不可用，请稍后再试。',
          timestamp: new Date().toISOString()
        })

        this.setData({ chatHistory: newHistory })
      }
    } catch (error) {
      console.error('AI对话失败:', error)
      
      // 显示错误消息
      newHistory.push({
        type: 'error',
        content: '网络连接失败，请检查网络后重试。',
        timestamp: new Date().toISOString()
      })

      this.setData({ chatHistory: newHistory })
    } finally {
      this.setData({ isLoading: false })
      this.scrollToBottom()
    }
  },

  // 智能规划行程
  async planItinerary() {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: 'AI 智能规划',
      content: '请描述您的旅行需求，我会为您制定详细行程',
      editable: true,
      placeholderText: '例如：我想去云南大理丽江玩5天，预算3000元，喜欢自然风光和古镇文化',
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          wx.showLoading({ title: 'AI 正在规划...' })

          try {
            const result = await aiIntegration.planIntelligentItinerary(
              this.data.userInfo.id,
              res.content
            )

            wx.hideLoading()

            if (result.success) {
              wx.showModal({
                title: '规划成功',
                content: 'AI 已为您生成旅行计划，是否查看详情？',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    this.showPlanResult(result)
                  }
                }
              })
            } else {
              wx.showModal({
                title: '规划建议',
                content: result.aiResponse.substring(0, 500) + '...',
                showCancel: false
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('AI规划失败:', error)
            wx.showToast({
              title: '规划失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 智能推荐景点
  async getRecommendations() {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: 'AI 正在分析...' })

    try {
      const result = await aiIntegration.getSmartDestinationRecommendations(
        this.data.userInfo.id
      )

      wx.hideLoading()

      if (result.success) {
        wx.showModal({
          title: '智能推荐',
          content: 'AI 已根据您的偏好生成推荐，是否查看详情？',
          success: (res) => {
            if (res.confirm) {
              this.showRecommendations(result)
            }
          }
        })
      } else {
        wx.showToast({
          title: '推荐获取失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('获取推荐失败:', error)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    }
  },

  // 快速提问
  quickQuestion(e) {
    const question = e.currentTarget.dataset.question
    this.setData({ inputValue: question })
    this.sendMessage()
  },

  // 清空聊天记录
  clearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ chatHistory: [] })
          wx.removeStorageSync('aiChatHistory')
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  // 保存聊天记录
  saveChatHistory(history) {
    // 只保存最近50条消息
    const recentHistory = history.slice(-50)
    wx.setStorageSync('aiChatHistory', recentHistory)
  },

  // 滚动到底部
  scrollToBottom() {
    setTimeout(() => {
      const query = wx.createSelectorQuery()
      query.select('.chat-container').boundingClientRect()
      query.selectAll('.message-item').boundingClientRect()
      query.exec((res) => {
        if (res[0] && res[1] && res[1].length > 0) {
          const lastMessage = res[1][res[1].length - 1]
          const scrollTop = lastMessage.bottom - res[0].height + 100
          
          wx.pageScrollTo({
            scrollTop: scrollTop > 0 ? scrollTop : 0,
            duration: 300
          })
        }
      })
    }, 100)
  },

  // 显示规划结果
  showPlanResult(result) {
    const content = result.aiResponse.length > 500 
      ? result.aiResponse.substring(0, 500) + '...' 
      : result.aiResponse

    wx.showModal({
      title: 'AI 行程规划结果',
      content: content,
      showCancel: false,
      confirmText: '复制完整内容',
      success: () => {
        wx.setClipboardData({
          data: result.aiResponse,
          success: () => {
            wx.showToast({
              title: '已复制到剪贴板',
              icon: 'success'
            })
          }
        })
      }
    })
  },

  // 显示推荐结果
  showRecommendations(result) {
    const recommendations = result.recommendations.destinations || []
    
    if (recommendations.length === 0) {
      wx.showToast({
        title: '暂无推荐',
        icon: 'none'
      })
      return
    }

    const content = recommendations.slice(0, 5).map((dest, index) => 
      `${index + 1}. ${dest.name || '推荐景点'}`
    ).join('\n')

    wx.showModal({
      title: 'AI 智能推荐',
      content: content + '\n\n更多推荐请在首页查看',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: 'AI旅行助手 - 智能规划您的完美旅程',
      path: '/pages/ai-assistant/ai-assistant'
    }
  }
})