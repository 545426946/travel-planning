// 获取应用实例
const app = getApp()
const { supabase } = require('../utils/supabase')

Page({
  data: {
    // 当前激活的 Tab
    currentTab: 0,
    // 用户信息
    userInfo: null,
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

  async onLoad() {
    console.log('页面加载完成');
    console.log('当前Tab:', this.data.currentTab);
    console.log('Tab数据:', this.data.tabs);
    
    // 获取用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
    
    // 加载热门景点数据
    await this.loadDestinations()
    
    // 加载行程数据
    await this.loadTravelPlans()
  },

  // 加载热门景点
  async loadDestinations() {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(8)

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
    } catch (error) {
      console.error('加载景点数据出错:', error)
    }
  },

  // 加载行程数据
  async loadTravelPlans() {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('status', 'planned')
        .order('created_at', { ascending: false })
        .limit(4)

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
    } catch (error) {
      console.error('加载行程数据出错:', error)
    }
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

  // 添加新计划方法
  async addNewPlan() {
    console.log('新建行程');
    
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return
    }

    try {
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

      const { data, error } = await supabase
        .from('travel_plans')
        .insert(newPlan)
        .select()

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
      await this.loadTravelPlans()
      
    } catch (error) {
      console.error('创建行程出错:', error)
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    }
  },

  // 图片加载错误处理
  onImageError(e) {
    console.log('图片加载失败:', e.detail);
    // 可以设置默认图片
  }
});