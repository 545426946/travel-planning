<template>
  <div class="home">

    <!-- 英雄区域 -->
    <a-row class="hero-section" :gutter="[60, 0]">
      <a-col :span="12">
        <div class="hero-content">
          <h1 class="hero-title">轻松规划完美旅程</h1>
          <p class="hero-subtitle">专为大学生设计的旅行规划工具</p>
          <div class="hero-actions">
            <a-button type="primary" size="large" @click="handleStartPlanning">
              <template #icon><RocketOutlined /></template>
              {{ isLoggedIn ? '开始规划' : '立即体验' }}
            </a-button>
            <a-button size="large" @click="$router.push('/destinations')">
              <template #icon><CompassOutlined /></template>
              探索景点
            </a-button>
          </div>
          <div v-if="!isLoggedIn" class="hero-login-tip">
            <a-typography-text type="secondary">
              注册账号可保存您的旅行计划
            </a-typography-text>
          </div>
        </div>
      </a-col>
      <a-col :span="12">
        <div class="hero-image">
          <a-card>
            <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500" alt="旅行" />
          </a-card>
        </div>
      </a-col>
    </a-row>

    <!-- 热门目的地 -->
    <div class="section">
      <h2 class="section-title">热门目的地</h2>
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :sm="12" :md="8" :lg="6" v-for="destination in destinations" :key="destination.id">
          <a-card hoverable class="destination-card">
            <template #cover>
              <img :alt="destination.name" :src="destination.image" />
            </template>
            <a-card-meta :title="destination.name" :description="destination.location">
              <template #avatar>
                <a-avatar :src="destination.icon" />
              </template>
            </a-card-meta>
            <div class="destination-info">
              <a-tag color="blue">{{ destination.type }}</a-tag>
              <span class="budget">¥{{ destination.budget }}/天</span>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 精选模板 -->
    <div class="section">
      <h2 class="section-title">精选行程模板</h2>
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :sm="12" :lg="8" v-for="template in templates" :key="template.id">
          <a-card hoverable class="template-card">
            <a-card-meta
              :title="template.title"
              :description="template.description"
            >
              <template #avatar>
                <a-avatar :src="template.icon" />
              </template>
            </a-card-meta>
            <div class="template-meta">
              <a-space>
                <span><CalendarOutlined /> {{ template.days }}天</span>
                <span><DollarOutlined /> ¥{{ template.budget }}</span>
                <span><StarOutlined /> {{ template.rating }}</span>
              </a-space>
            </div>
            <a-button type="primary" block class="use-template-btn">
              使用模板
            </a-button>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { 
  RocketOutlined, 
  CompassOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  StarOutlined 
} from '@ant-design/icons-vue'
import authService from '../services/authService'

// 响应式状态管理
const authState = reactive({
  isLoggedIn: authService.isLoggedIn(),
  currentUser: authService.getCurrentUser()
})

// 计算属性
const isLoggedIn = computed(() => authState.isLoggedIn)
const currentUser = computed(() => authState.currentUser)

const destinations = ref([])
const templates = ref([])

// 从热门景点数据中随机抽取4个景点
const getRandomDestinations = () => {
  const allDestinations = [
    {
      id: 1,
      name: "北京",
      location: "华北地区",
      description: "中国的首都，拥有故宫、长城等世界文化遗产",
      type: "历史文化",
      region: "north",
      icon: "🏯",
      image: "/images/cities/beijing.png",
      tags: ["历史文化", "皇家宫殿", "长城", "美食"],
      bestSeason: "春秋季",
      avgBudget: 500
    },
    {
      id: 2,
      name: "上海",
      location: "华东地区",
      description: "现代化国际大都市，外滩夜景和迪士尼乐园著名",
      type: "现代都市",
      region: "east",
      icon: "🏙️",
      image: "/images/cities/shanghai.png",
      tags: ["现代都市", "购物天堂", "夜景", "迪士尼"],
      bestSeason: "春秋季",
      avgBudget: 600
    },
    {
      id: 3,
      name: "西安",
      location: "西北地区",
      description: "古都长安，兵马俑和古城墙见证千年历史",
      type: "历史文化",
      region: "northwest",
      icon: "🗿",
      image: "/images/cities/xian.png",
      tags: ["古都文化", "兵马俑", "丝绸之路", "美食"],
      bestSeason: "春秋季",
      avgBudget: 400
    },
    {
      id: 4,
      name: "杭州",
      location: "华东地区",
      description: "西湖美景，龙井茶文化，江南水乡的代表",
      type: "自然风光",
      region: "east",
      icon: "🌊",
      image: "/images/cities/hangzhou.png",
      tags: ["西湖", "龙井茶", "江南水乡", "休闲"],
      bestSeason: "春季",
      avgBudget: 450
    },
    {
      id: 5,
      name: "成都",
      location: "西南地区",
      description: "天府之国，大熊猫基地和川菜美食闻名",
      type: "美食之都",
      region: "southwest",
      icon: "🐼",
      image: "/images/cities/chengdu.png",
      tags: ["大熊猫", "川菜美食", "休闲城市", "茶馆"],
      bestSeason: "春秋季",
      avgBudget: 400
    },
    {
      id: 6,
      name: "桂林",
      location: "华南地区",
      description: "山水甲天下，漓江风光和喀斯特地貌",
      type: "自然风光",
      region: "south",
      icon: "⛰️",
      image: "/images/cities/guilin.png",
      tags: ["山水风光", "漓江", "喀斯特", "摄影"],
      bestSeason: "春秋季",
      avgBudget: 350
    },
    {
      id: 7,
      name: "厦门",
      location: "华南地区",
      description: "海滨城市，鼓浪屿和环岛路风景优美",
      type: "海滨城市",
      region: "south",
      icon: "🏖️",
      image: "/images/cities/xiamen.png",
      tags: ["海滨城市", "鼓浪屿", "海岛风光", "海鲜"],
      bestSeason: "春秋季",
      avgBudget: 450
    },
    {
      id: 8,
      name: "南京",
      location: "华东地区",
      description: "六朝古都，中山陵和夫子庙文化底蕴深厚",
      type: "历史文化",
      region: "east",
      icon: "🏛️",
      image: "/images/cities/nanjing.png",
      tags: ["古都文化", "中山陵", "夫子庙", "历史"],
      bestSeason: "春秋季",
      avgBudget: 400
    },
    {
      id: 9,
      name: "丽江",
      location: "西南地区",
      description: "古城风情，玉龙雪山和纳西文化",
      type: "自然风光",
      region: "southwest",
      icon: "🏔️",
      image: "/images/cities/lijiang.png",
      tags: ["古城", "玉龙雪山", "少数民族", "摄影"],
      bestSeason: "春秋季",
      avgBudget: 400
    },
    {
      id: 10,
      name: "青岛",
      location: "华东地区",
      description: "海滨城市，啤酒文化和德式建筑",
      type: "海滨城市",
      region: "east",
      icon: "🍺",
      image: "/images/cities/qingdao.png",
      tags: ["海滨", "啤酒", "德式建筑", "海鲜"],
      bestSeason: "夏季",
      avgBudget: 450
    },
    {
      id: 11,
      name: "张家界",
      location: "华中地区",
      description: "奇峰异石，国家森林公园和玻璃栈道",
      type: "自然风光",
      region: "central",
      icon: "🌄",
      image: "/images/cities/zhangjiajie.png",
      tags: ["奇峰", "森林公园", "玻璃栈道", "摄影"],
      bestSeason: "春秋季",
      avgBudget: 400
    },
    {
      id: 12,
      name: "哈尔滨",
      location: "东北地区",
      description: "冰雪之城，冰雕艺术和俄式建筑",
      type: "现代都市",
      region: "northeast",
      icon: "❄️",
      image: "/images/cities/haerbing.png",
      tags: ["冰雪", "冰雕", "俄式建筑", "冬季"],
      bestSeason: "冬季",
      avgBudget: 500
    }
  ]
  
  // 随机打乱数组并取前4个
  const shuffled = [...allDestinations].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 4).map(dest => ({
    id: dest.id,
    name: dest.name,
    location: dest.location,
    image: dest.image,
    icon: dest.icon,
    type: dest.type,
    budget: dest.avgBudget
  }))
}

// 监听认证状态变化
const handleAuthStateChange = () => {
  authState.isLoggedIn = authService.isLoggedIn()
  authState.currentUser = authService.getCurrentUser()
}

const handleStartPlanning = () => {
  if (isLoggedIn.value) {
    // 已登录，跳转到行程规划页面
    window.$router.push('/plans')
  } else {
    // 未登录，打开登录模态框
    window.dispatchEvent(new CustomEvent('openAuthModal', {
      detail: { mode: 'login' }
    }))
  }
}

onMounted(() => {
  // 初始化认证状态
  authState.isLoggedIn = authService.isLoggedIn()
  authState.currentUser = authService.getCurrentUser()
  
  // 添加认证状态变化监听器
  window.addEventListener('authStateChange', handleAuthStateChange)
  
  
  
  // 随机抽取4个热门目的地
  destinations.value = getRandomDestinations()

  templates.value = [
    {
      id: 1,
      title: '北京3日文化游',
      description: '故宫、长城、颐和园经典路线',
      icon: '🏯',
      days: 3,
      budget: 900,
      rating: 4.8
    },
    {
      id: 2,
      title: '上海2日现代游',
      description: '外滩、迪士尼、陆家嘴',
      icon: '🏙️',
      days: 2,
      budget: 800,
      rating: 4.6
    },
    {
      id: 3,
      title: '杭州西湖休闲游',
      description: '西湖、灵隐寺、龙井茶园',
      icon: '🏞️',
      days: 2,
      budget: 500,
      rating: 4.9
    }
  ]
})

// 组件卸载时移除监听器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('authStateChange', handleAuthStateChange)
  window.removeEventListener('openAuthModal', handleAuthStateChange)
})
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.hero-section {
  margin-bottom: 80px;
  align-items: center;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 30px;
  line-height: 1.5;
}

.hero-actions {
  display: flex;
  gap: 16px;
}

.hero-image img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
}

.section {
  margin-bottom: 60px;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
  color: #1f2937;
}

.destination-card {
  height: 100%;
}

.destination-info {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-card {
  height: 100%;
}

.template-meta {
  margin: 16px 0;
}

.use-template-btn {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-actions {
    flex-direction: column;
  }
}
</style>