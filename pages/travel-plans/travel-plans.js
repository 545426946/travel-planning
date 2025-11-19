// 行程规划列表页面
const Auth = require('../../utils/auth').Auth
const supabase = require('../../utils/supabase').supabase

Page({
  data: {
    // 行程列表
    travelPlans: [],
    // 筛选条件
    filterStatus: 'all', // all, planned, ongoing, completed
    // 加载状态
    loading: false,
    // 用户信息
    userInfo: null
  },

  onLoad() {
    // 检查登录状态
    const userInfo = Auth.getCurrentUser()
    if (!userInfo) {
      wx.showModal({
        title: '请先登录',
        content: '查看行程需要先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }

    this.setData({ userInfo })
    this.loadTravelPlans()
  },

  onShow() {
    // 每次显示时刷新列表
    if (this.data.userInfo) {
      this.loadTravelPlans()
    }
  },

  // 加载行程列表
  async loadTravelPlans() {
    const userId = Auth.getCurrentUserId()
    if (!userId) return

    this.setData({ loading: true })

    try {
      let query = supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // 根据筛选条件过滤
      if (this.data.filterStatus !== 'all') {
        query = query.eq('status', this.data.filterStatus)
      }

      const result = await query
      const { data, error } = result

      if (error) {
        throw error
      }

      // 处理数据
      const travelPlans = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        destination: item.destination,
        startDate: item.start_date,
        endDate: item.end_date,
        totalDays: item.total_days || this.calculateDays(item.start_date, item.end_date),
        travelers: item.travelers_count || 1,
        budget: item.total_budget,
        status: item.status,
        isAIGenerated: item.is_ai_generated,
        tags: item.tags || [],
        createdAt: item.created_at,
        image: this.getImageUrl(item.id, item.destination),
        // 保存额外字段用于复制
        travelStyle: item.travel_style,
        transportation: item.transportation,
        accommodation: item.accommodation,
        specialRequirements: item.special_requirements,
        itinerary: item.itinerary
      }))

      this.setData({ 
        travelPlans,
        loading: false
      })

    } catch (error) {
      console.error('加载行程失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
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
    // 使用destination生成唯一的图片
    return `https://picsum.photos/seed/${destination || id}/800/400.jpg`
  },

  // 切换筛选状态
  changeFilter(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ filterStatus: status })
    this.loadTravelPlans()
  },

  // 查看行程详情
  viewPlanDetail(e) {
    const planId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/plan-detail/plan-detail?id=${planId}`
    })
  },

  // 编辑行程
  editPlan(e) {
    const planId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/create-plan/create-plan?id=${planId}`
    })
  },

  // 创建新行程
  createNewPlan() {
    wx.showActionSheet({
      itemList: ['AI 智能规划', '手动创建行程'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // AI智能规划
          wx.navigateTo({
            url: '/pages/ai-plan/ai-plan'
          })
        } else if (res.tapIndex === 1) {
          // 手动创建
          wx.navigateTo({
            url: '/pages/create-plan/create-plan'
          })
        }
      }
    })
  },

  // 更多操作
  showMoreActions(e) {
    const planId = e.currentTarget.dataset.id
    const planTitle = e.currentTarget.dataset.title
    const plan = this.data.travelPlans.find(p => p.id === planId)
    
    if (!plan) return

    const itemList = ['编辑行程', '复制行程', '更改状态', '删除行程']
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 编辑行程
            this.editPlan({ currentTarget: { dataset: { id: planId } } })
            break
          case 1:
            // 复制行程
            this.duplicatePlan(plan)
            break
          case 2:
            // 更改状态
            this.changeStatus(plan)
            break
          case 3:
            // 删除行程
            this.deletePlan(e)
            break
        }
      }
    })
  },

  // 复制行程
  async duplicatePlan(plan) {
    wx.showLoading({ title: '复制中...' })

    try {
      const userId = Auth.getCurrentUserId()
      
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
        travel_style: this.data.travelPlans.find(p => p.id === plan.id)?.travelStyle || 'comfortable',
        status: 'planned',
        is_ai_generated: false, // 复制的行程标记为手动创建
        tags: plan.tags || [],
        transportation: plan.transportation,
        accommodation: plan.accommodation,
        special_requirements: plan.specialRequirements,
        itinerary: plan.itinerary
      }

      const { data, error } = await supabase
        .from('travel_plans')
        .insert(newPlan)
        .select()

      wx.hideLoading()

      if (error) throw error

      wx.showToast({
        title: '复制成功',
        icon: 'success'
      })

      // 刷新列表
      this.loadTravelPlans()

    } catch (error) {
      wx.hideLoading()
      console.error('复制行程失败:', error)
      wx.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  },

  // 更改状态
  changeStatus(plan) {
    const statusOptions = [
      { value: 'planned', label: '计划中' },
      { value: 'ongoing', label: '进行中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ]

    const itemList = statusOptions.map(item => item.label)
    
    wx.showActionSheet({
      itemList: itemList,
      success: async (res) => {
        const newStatus = statusOptions[res.tapIndex].value
        
        if (newStatus === plan.status) {
          wx.showToast({
            title: '状态未改变',
            icon: 'none'
          })
          return
        }

        try {
          const { error } = await supabase
            .from('travel_plans')
            .update({ status: newStatus })
            .eq('id', plan.id)

          if (error) throw error

          wx.showToast({
            title: '状态已更新',
            icon: 'success'
          })

          // 刷新列表
          this.loadTravelPlans()

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

  // 删除行程
  deletePlan(e) {
    const planId = e.currentTarget.dataset.id
    const planTitle = e.currentTarget.dataset.title

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${planTitle}"吗？`,
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          try {
            const { error } = await supabase
              .from('travel_plans')
              .delete()
              .eq('id', planId)

            if (error) throw error

            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })

            // 刷新列表
            this.loadTravelPlans()

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

  // 格式化日期
  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}`
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
  },

  // 获取状态颜色
  getStatusColor(status) {
    const colorMap = {
      'planned': '#4A90E2',
      'ongoing': '#50C878',
      'completed': '#999',
      'cancelled': '#FF6B6B'
    }
    return colorMap[status] || '#999'
  }
})
