// 获取应用实例
const app = getApp()
const supabase = require('../utils/supabase').supabase
const aiIntegration = require('../utils/ai-integration').aiIntegration

Page({
  data: {
    // 当前激活的 Tab
    currentTab: 0,
    // 用户信息
    userInfo: null,
    // 用户统计信息
    stats: {
      visitedPlaces: 0,
      favoriteRoutes: 0
    },
    // AI推荐数据
    aiRecommendations: [],
    // Tabs 数据
    tabs: [
      { 
        text: '首页', 
        icon: 'home',
        activeIcon: 'home-filled'
      },
      { 
        text: '行程规划', 
        icon: 'calendar',
        activeIcon: 'calendar-filled'
      },
      { 
        text: '热门景点', 
        icon: 'location',
        activeIcon: 'location-filled'
      },
      { 
        text: '个人主页', 
        icon: 'person',
        activeIcon: 'person-filled'
      }
    ],
    // Banner 数据
    banners: [
      {
        image: 'https://picsum.photos/seed/banner1/800/400.jpg'
      },
      {
        image: 'https://picsum.photos/seed/banner2/800/400.jpg'
      }
    ],
    // AI 推荐路线数据
    aiRoutes: [
      {
        name: '江南水乡三日游',
        desc: '苏州-杭州经典线路',
        image: 'https://picsum.photos/seed/route1/600/320.jpg'
      },
      {
        name: '川西环线自驾',
        desc: '雪山草原深度体验',
        image: 'https://picsum.photos/seed/route2/600/320.jpg'
      }
    ],
    // 精选目的地数据
    destinations: [
      {
        name: '桂林山水',
        image: 'https://picsum.photos/seed/destination1/400/280.jpg'
      },
      {
        name: '张家界',
        image: 'https://picsum.photos/seed/destination2/400/280.jpg'
      },
      {
        name: '三亚海滩',
        image: 'https://picsum.photos/seed/destination3/400/280.jpg'
      },
      {
        name: '西安古城',
        image: 'https://picsum.photos/seed/destination4/400/280.jpg'
      }
    ],
    // 行程规划数据
    travelPlans: [
      {
        date: '今天',
        from: '北京',
        to: '上海',
        time: '08:00 - 20:00'
      },
      {
        date: '明天',
        from: '上海',
        to: '杭州',
        time: '09:00 - 18:00'
      }
    ],
    // 热门景点数据
    hotSpots: [
      {
        name: '故宫博物院',
        rating: 4.8,
        description: '明清两代皇家宫殿，世界文化遗产',
        image: 'https://picsum.photos/seed/spot1/200/200.jpg'
      },
      {
        name: '九寨沟风景区',
        rating: 4.9,
        description: '以彩池群、瀑布群闻名的自然保护区',
        image: 'https://picsum.photos/seed/spot2/200/200.jpg'
      }
    ],
    // 我的行程数据
    myTravelPlans: [
      {
        title: '云南大理丽江五日游',
        duration: '5天4晚',
        image: 'https://picsum.photos/seed/plan1/400/240.jpg'
      },
      {
        title: '日本东京京都七日游',
        duration: '7天6晚',
        image: 'https://picsum.photos/seed/plan2/400/240.jpg'
      }
    ]
  },

  onLoad() {
    console.log('页面加载完成');
    console.log('当前Tab:', this.data.currentTab);
    console.log('Tab数据:', this.data.tabs);
    
    // 获取用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
      // 加载用户统计信息
      this.loadUserStats()
    }
    
    // 加载热门景点数据
    this.loadDestinations()
    
    // 加载行程数据
    this.loadTravelPlans()
  },

  onShow() {
    // 每次页面显示时检查用户登录状态
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    this.setData({ userInfo })
    if (userInfo) {
      this.loadUserStats()
    }
  },

  // 加载热门景点
  loadDestinations() {
    supabase
      .from('destinations')
      .select('*')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (error) {
          console.error('加载景点数据失败:', error)
          return
        }

        // 转换数据格式
        const destinations = data.map(item => ({
          name: item.name,
          description: item.description || '',
          image: item.image_url,
          rating: item.rating,
          location: item.location
        }))

        this.setData({ 
          destinations,
          hotSpots: destinations.slice(0, 6).map(item => ({
            name: item.name,
            rating: item.rating,
            description: item.description,
            image: item.image
          }))
        })
        
        console.log('景点数据加载成功:', destinations.length)
      })
      .catch(error => {
        console.error('加载景点数据出错:', error)
      })
  },

  // 加载行程数据
  loadTravelPlans() {
    supabase
      .from('travel_plans')
      .select('*')
      .eq('status', 'planned')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data, error }) => {
        if (error) {
          console.error('加载行程数据失败:', error)
          return
        }

        // 转换数据格式
        const travelPlans = data.map(item => ({
          title: item.title,
          duration: this.calculateDuration(item.start_date, item.end_date),
          image: `https://picsum.photos/seed/plan${item.id}/400/240.jpg`
        }))

        this.setData({ 
          myTravelPlans: travelPlans,
          aiRoutes: data.slice(0, 2).map(item => ({
            name: item.title,
            desc: item.description || item.destination,
            image: `https://picsum.photos/seed/route${item.id}/600/320.jpg`
          }))
        })
        
        console.log('行程数据加载成功:', travelPlans.length)
      })
      .catch(error => {
        console.error('加载行程数据出错:', error)
      })
  },

  // 计算行程持续时间
  calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return '待定'
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    
    return `${days}天${days - 1}晚`
  },

  // 切换 Tab
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    console.log('切换到Tab索引:', index);
    if (!isNaN(index)) {
      this.setData({
        currentTab: index
      });
    }
  },

  // 探索目的地
  exploreDestinations() {
    console.log('探索目的地');
    // 可以跳转到热门景点页面
    this.setData({
      currentTab: 2
    });
  },

  // AI 智能规划行程
  async aiPlanItinerary() {
    console.log('AI 智能规划行程');
    
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return
    }

    wx.showModal({
      title: 'AI 智能规划',
      content: '请描述您的旅行需求，例如：我想去云南大理丽江玩5天，预算3000元，喜欢自然风光和古镇文化',
      editable: true,
      placeholderText: '输入您的旅行需求...',
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          wx.showLoading({ title: 'AI 正在规划...' });
          
          try {
            const result = await aiIntegration.planIntelligentItinerary(
              this.data.userInfo.id, 
              res.content
            );

            wx.hideLoading();

            if (result.success) {
              wx.showToast({
                title: 'AI 规划成功',
                icon: 'success'
              });

              // 重新加载行程数据
              await this.loadTravelPlans();

              // 显示AI生成结果
              this.showAIResultModal('行程规划结果', result.aiResponse);
            } else {
              this.showAIResultModal('AI 规划建议', result.aiResponse);
            }
          } catch (error) {
            wx.hideLoading();
            console.error('AI 规划失败:', error);
            wx.showToast({
              title: 'AI 规划失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 智能景点推荐
  async getSmartRecommendations() {
    console.log('获取智能景点推荐');
    
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return
    }

    wx.showLoading({ title: 'AI 正在推荐...' });
    
    try {
      const result = await aiIntegration.getSmartDestinationRecommendations(
        this.data.userInfo.id
      );

      wx.hideLoading();

      if (result.success) {
        this.setData({ 
          aiRecommendations: result.recommendations.destinations || []
        });
        
        wx.showToast({
          title: '推荐获取成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '推荐获取失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('获取推荐失败:', error);
      wx.showToast({
        title: '推荐获取失败',
        icon: 'none'
      });
    }
  },

  // AI 问答助手
  async showAIHelper() {
    console.log('AI 问答助手');
    
    wx.showModal({
      title: 'AI 旅行助手',
      content: '请输入您的旅行问题，我会为您详细解答',
      editable: true,
      placeholderText: '例如：云南最佳旅游时间是什么时候？',
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          wx.showLoading({ title: 'AI 正在思考...' });
          
          try {
            const result = await aiIntegration.askTravelQuestion(
              this.data.userInfo ? this.data.userInfo.id : null,
              res.content
            );

            wx.hideLoading();

            if (result.success) {
              this.showAIResultModal('AI 回答', result.answer);
            } else {
              wx.showToast({
                title: 'AI 回答失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('AI 问答失败:', error);
            wx.showToast({
              title: 'AI 回答失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 显示AI结果模态框
  showAIResultModal(title, content) {
    wx.showModal({
      title: title,
      content: content.length > 500 ? content.substring(0, 500) + '...' : content,
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        if (content.length > 500) {
          // 长内容可以复制到剪贴板
          wx.setClipboardData({
            data: content,
            success: () => {
              wx.showToast({
                title: '完整内容已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 添加新计划方法（支持AI和手动创建）
  addNewPlan() {
    console.log('新建行程');
    
    // 提供AI辅助和手动创建选项
    wx.showActionSheet({
      itemList: ['AI 智能规划', '手动创建行程'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.aiPlanItinerary();
        } else if (res.tapIndex === 1) {
          this.createManualPlan();
        }
      }
    });
  },

  // 手动创建行程
  async createManualPlan() {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return
    }

    // 示例：创建一个新行程
    const newPlan = {
      title: '新旅行计划',
      description: '这是一个新创建的旅行计划',
      destination: '待定',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 2000,
      travel_type: 'leisure',
      status: 'planned',
      user_id: this.data.userInfo.id,
      is_ai_generated: false,
      tags: ['自由行', '休闲']
    }

    supabase
      .from('travel_plans')
      .insert(newPlan)
      .select()
      .then(({ data, error }) => {
        if (error) {
          console.error('创建行程失败:', error)
          wx.showToast({
            title: '创建失败',
            icon: 'none'
          });
          return
        }

        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });

        // 重新加载行程数据
        this.loadTravelPlans()
      })
      .catch(error => {
        console.error('创建行程出错:', error)
        wx.showToast({
          title: '创建失败',
          icon: 'none'
        });
      })
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 加载用户统计信息
  async loadUserStats() {
    if (!this.data.userInfo) return

    try {
      // 并行查询用户统计数据
      const [plansResult, favoritesResult] = await Promise.all([
        // 查询用户的行程数量
        supabase
          .from('travel_plans')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', this.data.userInfo.id)
          .eq('status', 'completed'),
        
        // 查询用户的收藏数量
        supabase
          .from('user_favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', this.data.userInfo.id)
      ])

      const visitedPlaces = plansResult.count || 0
      const favoriteRoutes = favoritesResult.count || 0

      this.setData({
        stats: {
          visitedPlaces,
          favoriteRoutes
        }
      })

      console.log('用户统计信息:', { visitedPlaces, favoriteRoutes })
    } catch (error) {
      console.error('加载用户统计信息失败:', error)
    }
  },

  // 用户登出
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储和全局状态
          wx.removeStorageSync('userInfo')
          app.globalData.userInfo = null
          app.globalData.isLoggedIn = false

          // 更新页面状态
          this.setData({ 
            userInfo: null,
            stats: { visitedPlaces: 0, favoriteRoutes: 0 }
          })

          // 清除相关数据
          this.setData({
            travelPlans: [],
            myTravelPlans: []
          })

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })

          // 重新加载基础数据（不依赖用户的数据）
          this.loadDestinations()
        }
      }
    })
  },

  // 用户个人资料
  showUserOptions() {
    if (!this.data.userInfo) {
      this.goToLogin()
      return
    }

    wx.showActionSheet({
      itemList: ['个人资料', '我的收藏', '设置', '退出登录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 个人资料
            this.showUserProfile()
            break
          case 1:
            // 我的收藏
            this.switchToTab(3)
            break
          case 2:
            // 设置
            this.showSettings()
            break
          case 3:
            // 退出登录
            this.logout()
            break
        }
      }
    })
  },

  // 显示用户个人资料
  showUserProfile() {
    const { userInfo, stats } = this.data
    
    wx.showModal({
      title: '个人资料',
      content: `姓名：${userInfo.name}\n登录方式：${userInfo.loginType === 'wechat' ? '微信登录' : '账号登录'}\n去过的地方：${stats.visitedPlaces}\n收藏路线：${stats.favoriteRoutes}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 显示设置
  showSettings() {
    wx.showModal({
      title: '设置',
      content: '更多设置功能正在开发中...',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 图片加载错误处理
  onImageError(e) {
    console.log('图片加载失败:', e.detail);
    // 可以设置默认图片
  }
});