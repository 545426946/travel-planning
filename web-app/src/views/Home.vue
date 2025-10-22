<template>
  <div class="home">
    <!-- 英雄区域 -->
    <a-row class="hero-section" :gutter="[60, 0]">
      <a-col :span="12">
        <div class="hero-content">
          <h1 class="hero-title">轻松规划完美旅程</h1>
          <p class="hero-subtitle">专为大学生设计的旅行规划工具</p>
          <div class="hero-actions">
            <a-button type="primary" size="large" @click="$router.push('/plans')">
              <template #icon><RocketOutlined /></template>
              开始规划
            </a-button>
            <a-button size="large" @click="$router.push('/destinations')">
              <template #icon><CompassOutlined /></template>
              探索景点
            </a-button>
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
import { ref, onMounted } from 'vue'
import { 
  RocketOutlined, 
  CompassOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  StarOutlined 
} from '@ant-design/icons-vue'

const destinations = ref([])
const templates = ref([])

onMounted(() => {
  // 模拟数据加载
  destinations.value = [
    {
      id: 1,
      name: '北京',
      location: '中国',
      image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=300',
      icon: '🏯',
      type: '文化',
      budget: 300
    },
    {
      id: 2,
      name: '上海',
      location: '中国',
      image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=300',
      icon: '🏙️',
      type: '现代',
      budget: 400
    },
    {
      id: 3,
      name: '杭州',
      location: '中国',
      image: 'https://images.unsplash.com/photo-1531183208301-0a43d8b828d0?w=300',
      icon: '🏞️',
      type: '自然',
      budget: 250
    },
    {
      id: 4,
      name: '成都',
      location: '中国',
      image: 'https://images.unsplash.com/photo-1594819047050-99b4ae3a2fdf?w=300',
      icon: '🐼',
      type: '美食',
      budget: 200
    }
  ]

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