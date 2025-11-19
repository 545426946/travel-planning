// 行程详情页面
const Auth = require('../../utils/auth').Auth
const supabase = require('../../utils/supabase').supabase

Page({
  data: {
    // 行程ID
    planId: null,
    // 行程详情
    plan: null,
    // 当前选中的日期（第几天）
    selectedDay: 1,
    // 加载状态
    loading: true,
    // 每日行程数据
    dailyItinerary: []
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({ planId: options.id })
    this.loadPlanDetail()
  },

  // 加载行程详情
  async loadPlanDetail() {
    const userId = Auth.getCurrentUserId()
    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        })
      }, 1500)
      return
    }

    this.setData({ loading: true })

    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('id', this.data.planId)
        .eq('user_id', userId) // 确保只能查看自己的行程
        .single()

      if (error) throw error

      if (!data) {
        wx.showToast({
          title: '行程不存在',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
        return
      }

      // 处理行程数据
      const plan = {
        id: data.id,
        title: data.title,
        description: data.description,
        destination: data.destination,
        startDate: data.start_date,
        endDate: data.end_date,
        totalDays: data.total_days || this.calculateDays(data.start_date, data.end_date),
        travelers: data.travelers_count || 1,
        budget: data.total_budget,
        travelStyle: data.travel_style,
        status: data.status,
        isAIGenerated: data.is_ai_generated,
        tags: data.tags || [],
        transportation: data.transportation,
        accommodation: data.accommodation,
        specialRequirements: data.special_requirements,
        itinerary: data.itinerary,
        interests: this.parseInterests(data.interests),
        createdAt: data.created_at,
        image: this.getImageUrl(data.id, data.destination)
      }

      // 解析每日行程
      const dailyItinerary = this.parseItinerary(plan.itinerary, plan.totalDays)

      this.setData({
        plan,
        dailyItinerary,
        loading: false
      })

    } catch (error) {
      console.error('加载行程详情失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 解析兴趣偏好
  parseInterests(interests) {
    if (!interests) return []
    if (typeof interests === 'string') {
      try {
        return JSON.parse(interests)
      } catch (e) {
        return []
      }
    }
    return interests
  },

  // 解析行程为每日安排
  parseItinerary(itinerary, totalDays) {
    if (!itinerary) return []

    const dailyPlans = []
    
    // 简单解析：按天分割（假设AI返回的格式包含"第X天"）
    const dayPattern = /第[一二三四五六七八九十\d]+天|Day\s*\d+/gi
    const parts = itinerary.split(dayPattern).filter(p => p.trim())

    for (let i = 0; i < totalDays; i++) {
      const dayNum = i + 1
      let content = ''
      
      if (parts[i]) {
        content = parts[i].trim()
      } else {
        content = '暂无安排'
      }

      // 尝试从内容中提取活动项
      const activities = this.extractActivities(content)

      dailyPlans.push({
        day: dayNum,
        date: this.calculateDate(this.data.plan?.startDate, i),
        content: content,
        activities: activities
      })
    }

    return dailyPlans
  },

  // 提取活动项
  extractActivities(content) {
    const activities = []
    
    // 简单解析：查找时间+活动的模式
    const timePattern = /(\d{1,2}[:：]\d{2})\s*[-–—]\s*(\d{1,2}[:：]\d{2})?[\s:：]*([^\n]+)/g
    let match
    
    while ((match = timePattern.exec(content)) !== null) {
      activities.push({
        time: match[1] + (match[2] ? ' - ' + match[2] : ''),
        title: match[3].trim().substring(0, 50),
        location: this.extractLocation(match[3]),
        price: this.extractPrice(match[3])
      })
    }

    // 如果没有找到时间格式的活动，按行分割
    if (activities.length === 0) {
      const lines = content.split('\n').filter(l => l.trim())
      lines.slice(0, 5).forEach(line => {
        if (line.trim() && !line.includes('第') && !line.includes('Day')) {
          activities.push({
            time: '上午',
            title: line.trim().substring(0, 50),
            location: this.extractLocation(line),
            price: null
          })
        }
      })
    }

    return activities
  },

  // 提取地点
  extractLocation(text) {
    const match = text.match(/(?:在|到|前往|参观|游览)\s*([^，。,\n]+)/)
    return match ? match[1].trim() : ''
  },

  // 提取价格
  extractPrice(text) {
    const match = text.match(/[¥￥](\d+)/)
    return match ? match[1] : null
  },

  // 计算日期
  calculateDate(startDate, dayOffset) {
    if (!startDate) return ''
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayOffset)
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  // 计算天数
  calculateDays(startDate, endDate) {
    if (!startDate || !endDate) return 1
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  },

  // 获取图片URL
  getImageUrl(id, destination) {
    return `https://picsum.photos/seed/${destination || id}/800/400.jpg`
  },

  // 切换日期
  selectDay(e) {
    const day = parseInt(e.currentTarget.dataset.day)
    this.setData({ selectedDay: day })
  },

  // 添加活动
  addActivity() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 高德地图导航
  navigateToMap() {
    if (!this.data.plan?.destination) {
      wx.showToast({
        title: '暂无目的地信息',
        icon: 'none'
      })
      return
    }

    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 分享行程
  sharePlan() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    })
  },

  // 复制行程
  async duplicatePlan() {
    wx.showModal({
      title: '复制行程',
      content: '确定要复制这个行程吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '复制中...' })

          try {
            const userId = Auth.getCurrentUserId()
            const plan = this.data.plan
            
            // 创建新行程（不包含id和created_at）
            const newPlan = {
              user_id: userId,
              title: `${plan.title} (副本)`,
              description: plan.description,
              destination: plan.destination,
              start_date: plan.startDate,
              end_date: plan.endDate,
              total_days: plan.totalDays,
              travelers_count: plan.travelers,
              total_budget: plan.budget,
              travel_style: plan.travelStyle,
              status: 'planned',
              is_ai_generated: false, // 复制的行程标记为手动创建
              tags: plan.tags || [],
              transportation: plan.transportation,
              accommodation: plan.accommodation,
              special_requirements: plan.specialRequirements,
              itinerary: plan.itinerary,
              interests: typeof plan.interests === 'string' ? plan.interests : JSON.stringify(plan.interests || [])
            }

            const { data, error } = await supabase
              .from('travel_plans')
              .insert(newPlan)
              .select()

            wx.hideLoading()

            if (error) throw error

            wx.showModal({
              title: '复制成功',
              content: '是否要查看新复制的行程？',
              success: (modalRes) => {
                if (modalRes.confirm && data && data[0]) {
                  // 跳转到新行程的详情页
                  wx.redirectTo({
                    url: `/pages/plan-detail/plan-detail?id=${data[0].id}`
                  })
                } else {
                  // 返回列表页
                  wx.navigateBack()
                }
              }
            })

          } catch (error) {
            wx.hideLoading()
            console.error('复制行程失败:', error)
            wx.showToast({
              title: '复制失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 更改状态
  changeStatus() {
    const statusOptions = [
      { value: 'planned', label: '计划中' },
      { value: 'ongoing', label: '进行中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ]

    const currentStatus = this.data.plan.status
    const itemList = statusOptions.map(item => 
      item.value === currentStatus ? `✓ ${item.label}` : item.label
    )
    
    wx.showActionSheet({
      itemList: itemList,
      success: async (res) => {
        const newStatus = statusOptions[res.tapIndex].value
        
        if (newStatus === currentStatus) {
          return
        }

        try {
          const { error } = await supabase
            .from('travel_plans')
            .update({ status: newStatus })
            .eq('id', this.data.planId)

          if (error) throw error

          wx.showToast({
            title: '状态已更新',
            icon: 'success'
          })

          // 重新加载行程详情
          this.loadPlanDetail()

        } catch (error) {
          console.error('更新状态失败:', error)
          wx.showToast({
            title: '更新失败',
            icon: 'none'
          })
        }
      }
    })
  },

  // 更多操作
  showMoreActions() {
    const itemList = ['复制行程', '更改状态', '导出行程', '分享行程']
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 复制行程
            this.duplicatePlan()
            break
          case 1:
            // 更改状态
            this.changeStatus()
            break
          case 2:
            // 导出行程
            this.exportPlan()
            break
          case 3:
            // 分享行程
            this.sharePlan()
            break
        }
      }
    })
  },

  // 导出行程
  exportPlan() {
    const plan = this.data.plan
    let content = `【${plan.title}】

`
    content += `📍 目的地：${plan.destination}
`
    content += `📅 日期：${plan.startDate} 至 ${plan.endDate} (${plan.totalDays}天)
`
    content += `👥 人数：${plan.travelers}人
`
    content += `💰 预算：¥${plan.budget}

`
    
    if (plan.description) {
      content += `📝 描述：${plan.description}

`
    }
    
    // 添加每日行程
    if (this.data.dailyItinerary && this.data.dailyItinerary.length > 0) {
      content += `📋 行程安排：

`
      this.data.dailyItinerary.forEach(day => {
        content += `第${day.day}天 (${day.date})：
${day.content}

`
      })
    }
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  // 编辑行程
  editPlan() {
    wx.navigateTo({
      url: `/pages/create-plan/create-plan?id=${this.data.planId}`
    })
  },

  // 删除行程
  deletePlan() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${this.data.plan?.title}"吗？`,
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          try {
            const { error } = await supabase
              .from('travel_plans')
              .delete()
              .eq('id', this.data.planId)

            if (error) throw error

            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })

            setTimeout(() => {
              wx.navigateBack()
            }, 1500)

          } catch (error) {
            console.error('删除失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 获取旅行风格文本
  getTravelStyleText(style) {
    const styleMap = {
      'luxury': '轻奢型',
      'comfortable': '舒适享受',
      'premium': '奢华体验',
      'budget': '经济实惠',
      'adventure': '探险刺激'
    }
    return styleMap[style] || '舒适享受'
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'planned': '计划中',
      'ongoing': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return statusMap[status] || '未知'
  }
})
