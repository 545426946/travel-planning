<template>
  <div class="destinations">
    <div class="page-header">
      <h1>热门景点探索</h1>
      <p>发现世界各地的特色建筑和自然风光</p>
    </div>

    <!-- 筛选器 -->
    <a-card class="filters-card">
      <a-space :size="16" wrap>
        <a-input
          v-model:value="searchText"
          placeholder="搜索景点名称..."
          style="width: 200px"
          @change="handleSearch"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        
        <a-select
          v-model:value="regionFilter"
          placeholder="所有地区"
          style="width: 120px"
          @change="handleFilter"
        >
          <a-select-option value="">所有地区</a-select-option>
          <a-select-option value="asia">亚洲</a-select-option>
          <a-select-option value="europe">欧洲</a-select-option>
          <a-select-option value="america">美洲</a-select-option>
          <a-select-option value="africa">非洲</a-select-option>
          <a-select-option value="oceania">大洋洲</a-select-option>
        </a-select>

        <a-select
          v-model:value="typeFilter"
          placeholder="所有类型"
          style="width: 120px"
          @change="handleFilter"
        >
          <a-select-option value="">所有类型</a-select-option>
          <a-select-option value="architecture">特色建筑</a-select-option>
          <a-select-option value="nature">自然风光</a-select-option>
          <a-select-option value="culture">文化遗址</a-select-option>
          <a-select-option value="modern">现代地标</a-select-option>
        </a-select>
      </a-space>
    </a-card>

    <!-- 景点展示 -->
    <a-row :gutter="[24, 24]" class="destinations-grid">
      <a-col 
        :xs="24" 
        :sm="12" 
        :lg="8" 
        v-for="destination in filteredDestinations" 
        :key="destination.id"
      >
        <a-card 
          hoverable 
          class="destination-card"
          @click="viewDestination(destination)"
        >
          <template #cover>
            <div class="destination-cover">
              <img :alt="destination.name" :src="destination.image" />
              <div class="destination-icon">{{ destination.icon }}</div>
            </div>
          </template>
          
          <a-card-meta 
            :title="destination.name" 
            :description="destination.location"
          />
          
          <p class="destination-description">{{ destination.description }}</p>
          
          <div class="destination-tags">
            <a-tag 
              v-for="tag in destination.tags" 
              :key="tag"
              color="blue"
            >
              {{ tag }}
            </a-tag>
          </div>
          
          <div class="destination-actions">
            <a-button type="primary" @click.stop="addToPlan(destination)">
              加入行程
            </a-button>
            <a-button @click.stop="viewDetails(destination)">
              查看详情
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      :title="selectedDestination?.name"
      width="600px"
      :footer="null"
    >
      <div v-if="selectedDestination" class="destination-detail">
        <a-row :gutter="[24, 24]">
          <a-col :span="12">
            <img :src="selectedDestination.image" :alt="selectedDestination.name" class="detail-image" />
          </a-col>
          <a-col :span="12">
            <h3>{{ selectedDestination.name }}</h3>
            <p><EnvironmentOutlined /> {{ selectedDestination.location }}</p>
            <p>{{ selectedDestination.description }}</p>
            <div class="detail-tags">
              <a-tag v-for="tag in selectedDestination.tags" :key="tag" color="blue">
                {{ tag }}
              </a-tag>
            </div>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const searchText = ref('')
const regionFilter = ref('')
const typeFilter = ref('')
const detailModalVisible = ref(false)
const selectedDestination = ref(null)

const destinations = ref([
  {
    id: 1,
    name: "故宫博物院",
    location: "北京, 中国",
    description: "世界上现存规模最大、保存最为完整的木质结构古建筑群",
    type: "architecture",
    region: "asia",
    icon: "🏯",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["历史建筑", "文化遗产", "皇家宫殿"]
  },
  {
    id: 2,
    name: "埃菲尔铁塔",
    location: "巴黎, 法国",
    description: "法国文化象征，世界著名铁制镂空塔",
    type: "architecture",
    region: "europe",
    icon: "🗼",
    image: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=400",
    tags: ["现代建筑", "城市地标", "浪漫景点"]
  },
  {
    id: 3,
    name: "大堡礁",
    location: "昆士兰, 澳大利亚",
    description: "世界最大最长的珊瑚礁群，自然奇观",
    type: "nature",
    region: "oceania",
    icon: "🐠",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    tags: ["自然奇观", "海洋生物", "潜水胜地"]
  },
  {
    id: 4,
    name: "泰姬陵",
    location: "阿格拉, 印度",
    description: "印度穆斯林艺术最完美的瑰宝，世界文化遗产",
    type: "architecture",
    region: "asia",
    icon: "🕌",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea533?w=400",
    tags: ["爱情象征", "大理石建筑", "世界奇迹"]
  },
  {
    id: 5,
    name: "尼亚加拉瀑布",
    location: "安大略, 加拿大",
    description: "世界三大跨国瀑布之一，气势磅礴",
    type: "nature",
    region: "america",
    icon: "💧",
    image: "https://images.unsplash.com/photo-1523482580672-f109a8f9d810?w=400",
    tags: ["自然瀑布", "壮观景色", "旅游热点"]
  },
  {
    id: 6,
    name: "罗马斗兽场",
    location: "罗马, 意大利",
    description: "古罗马时期最大的圆形角斗场",
    type: "culture",
    region: "europe",
    icon: "🏛️",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
    tags: ["古罗马遗址", "历史遗迹", "建筑奇迹"]
  }
])

const filteredDestinations = computed(() => {
  return destinations.value.filter(destination => {
    const matchesSearch = !searchText.value || 
      destination.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      destination.location.toLowerCase().includes(searchText.value.toLowerCase()) ||
      destination.description.toLowerCase().includes(searchText.value.toLowerCase())
    
    const matchesRegion = !regionFilter.value || destination.region === regionFilter.value
    const matchesType = !typeFilter.value || destination.type === typeFilter.value
    
    return matchesSearch && matchesRegion && matchesType
  })
})

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const handleFilter = () => {
  // 筛选逻辑已在computed中处理
}

const viewDestination = (destination) => {
  selectedDestination.value = destination
  detailModalVisible.value = true
}

const addToPlan = (destination) => {
  message.success(`已将 ${destination.name} 添加到行程`)
}

const viewDetails = (destination) => {
  selectedDestination.value = destination
  detailModalVisible.value = true
}

onMounted(() => {
  // 可以在这里加载真实数据
})
</script>

<style scoped>
.destinations {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1f2937;
}

.page-header p {
  font-size: 1.1rem;
  color: #6b7280;
}

.filters-card {
  margin-bottom: 30px;
}

.destination-card {
  height: 100%;
  transition: all 0.3s ease;
}

.destination-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.destination-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.destination-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.destination-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 8px;
}

.destination-description {
  color: #6b7280;
  margin: 16px 0;
  line-height: 1.5;
}

.destination-tags {
  margin: 16px 0;
}

.destination-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.detail-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
}

.detail-tags {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .destinations {
    padding: 20px 16px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .destination-actions {
    flex-direction: column;
  }
}
</style>