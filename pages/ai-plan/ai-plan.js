// pages/ai-plan/ai-plan.js
const Auth = require('../../utils/auth').Auth
const aiIntegration = require('../../utils/ai-integration').aiIntegration

Page({
  data: {
    // 表单数据
    formData: {
      destination: '',
      days: '',
      daysIndex: 0,
      travelers: '',
      budget: '',
      style: 'comfortable',
      specialRequirements: ''
    },
    
    // 天数选项
    dayOptions: ['1天', '2天', '3天', '4天', '5天', '6天', '7天', '8天', '9天', '10天', '10天以上'],
    
    // 兴趣偏好选项
    interests: [
      { label: '文化历史', value: 'culture', checked: false },
      { label: '自然风光', value: 'nature', checked: false },
      { label: '美食体验', value: 'food', checked: false },
      { label: '购物娱乐', value: 'shopping', checked: false },
      { label: '冒险探索', value: 'adventure', checked: false },
      { label: '放松度假', value: 'relax', checked: false }
    ],
    
    // 旅行风格选项
    styles: [
      { label: '轻奢型', value: 'luxury' },
      { label: '舒适享受', value: 'comfortable' },
      { label: '奢华体验', value: 'premium' }
    ],
    
    // 加载状态
    isLoading: false
  },

  onLoad(options) {
    console.log('AI规划页面加载')
  },

  // 目的地输入
  onDestinationInput(e) {
    this.setData({
      'formData.destination': e.detail.value
    })
  },

  // 天数选择
  onDaysChange(e) {
    const index = e.detail.value
    this.setData({
      'formData.daysIndex': index,
      'formData.days': this.data.dayOptions[index]
    })
  },

  // 出行人数输入
  onTravelersInput(e) {
    this.setData({
      'formData.travelers': e.detail.value
    })
  },

  // 预算输入
  onBudgetInput(e) {
    this.setData({
      'formData.budget': e.detail.value
    })
  },

  // 兴趣偏好点击
  onInterestTap(e) {
    const index = e.currentTarget.dataset.index
    const interests = this.data.interests
    interests[index].checked = !interests[index].checked
    this.setData({ interests })
  },

  // 旅行风格点击
  onStyleTap(e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      'formData.style': value
    })
  },

  // 特殊要求输入
  onSpecialRequirementsInput(e) {
    this.setData({
      'formData.specialRequirements': e.detail.value
    })
  },

  // 表单验证
  validateForm() {
    const { destination, days, travelers, budget } = this.data.formData

    if (!destination.trim()) {
      wx.showToast({
        title: '请输入目的地',
        icon: 'none'
      })
      return false
    }

    if (!days) {
      wx.showToast({
        title: '请选择旅行天数',
        icon: 'none'
      })
      return false
    }

    if (!travelers || travelers <= 0) {
      wx.showToast({
        title: '请输入正确的出行人数',
        icon: 'none'
      })
      return false
    }

    if (!budget || budget <= 0) {
      wx.showToast({
        title: '请输入正确的预算',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 生成AI提示词
  generatePrompt() {
    const { destination, days, travelers, budget, style, specialRequirements } = this.data.formData
    
    // 获取选中的兴趣
    const selectedInterests = this.data.interests
      .filter(item => item.checked)
      .map(item => item.label)
      .join('、')

    // 风格映射
    const styleMap = {
      luxury: '轻奢型',
      comfortable: '舒适享受',
      premium: '奢华体验'
    }

    let prompt = `我想去${destination}旅行，计划${days}，${travelers}人出行，预算${budget}元。`
    
    if (selectedInterests) {
      prompt += `我喜欢${selectedInterests}。`
    }
    
    prompt += `旅行风格偏好${styleMap[style]}。`
    
    if (specialRequirements.trim()) {
      prompt += `特殊要求：${specialRequirements}。`
    }
    
    prompt += `请为我规划详细的旅行行程，包括每天的景点安排、交通方式、住宿建议和餐饮推荐。`

    return prompt
  },

  // 取消
  onCancel() {
    wx.navigateBack()
  },

  // 提交
  async onSubmit() {
    // 验证表单
    if (!this.validateForm()) {
      return
    }

    // 检查登录状态
    if (!Auth.requireLogin()) {
      return
    }

    const userId = Auth.getCurrentUserId()

    this.setData({ isLoading: true })

    try {
      // 生成AI提示词
      const userInput = this.generatePrompt()

      console.log('AI规划输入:', userInput)

      // 准备表单数据传递给AI
      const selectedInterests = this.data.interests
        .filter(item => item.checked)
        .map(item => ({ label: item.label, value: item.value }))

      const formDataForAI = {
        destination: this.data.formData.destination,
        days: this.data.formData.days,
        travelers: this.data.formData.travelers,
        budget: this.data.formData.budget,
        style: this.data.formData.style,
        interests: selectedInterests,
        specialRequirements: this.data.formData.specialRequirements
      }

      console.log('表单数据:', formDataForAI)

      // 调用AI规划服务（传入表单数据）
      const result = await aiIntegration.planIntelligentItinerary(userId, userInput, formDataForAI)

      this.setData({ isLoading: false })

      if (result.success) {
        wx.showToast({
          title: 'AI规划成功',
          icon: 'success',
          duration: 2000
        })

        // 延迟返回并刷新列表
        setTimeout(() => {
          wx.navigateBack({
            success: () => {
              // 通知上一个页面刷新数据
              const pages = getCurrentPages()
              const prevPage = pages[pages.length - 2]
              if (prevPage && prevPage.loadUserTravelPlans) {
                prevPage.loadUserTravelPlans()
              }
            }
          })
        }, 2000)

        // 显示AI规划结果
        if (result.aiResponse) {
          this.showPlanResult(result.aiResponse, result.data)
        }
      } else {
        wx.showModal({
          title: 'AI规划提示',
          content: result.aiResponse || result.error || 'AI规划失败，请重试',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    } catch (error) {
      this.setData({ isLoading: false })
      console.error('AI规划失败:', error)
      wx.showModal({
        title: '规划失败',
        content: '抱歉，AI规划出现错误，请稍后重试',
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 显示规划结果
  showPlanResult(aiResponse, planData) {
    const content = aiResponse.length > 500 
      ? aiResponse.substring(0, 500) + '...\n\n完整行程已保存，请在"我的行程"中查看' 
      : aiResponse

    wx.showModal({
      title: '🎉 AI规划成功',
      content: content,
      showCancel: false,
      confirmText: '查看详情',
      success: (res) => {
        if (res.confirm && planData && planData.id) {
          // 跳转到行程详情页（如果有的话）
          console.log('查看行程详情:', planData.id)
        }
      }
    })
  }
})
