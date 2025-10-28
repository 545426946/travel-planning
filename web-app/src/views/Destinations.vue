<template>
  <div class="destinations">
    <div class="page-header">
      <h1>中国热门旅游城市</h1>
      <p>探索中国各地的特色景点和自然风光</p>
    </div>

    <!-- 筛选器 -->
    <a-card class="filters-card">
      <a-space :size="16" wrap>
        <a-input
          v-model:value="searchText"
          placeholder="搜索城市或景点..."
          style="width: 250px"
          @input="handleSearch"
          allow-clear
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        
        <a-select
          v-model:value="regionFilter"
          placeholder="所有地区"
          style="width: 140px"
          @change="handleFilter"
        >
          <a-select-option value="">所有地区</a-select-option>
          <a-select-option value="north">华北地区</a-select-option>
          <a-select-option value="northeast">东北地区</a-select-option>
          <a-select-option value="east">华东地区</a-select-option>
          <a-select-option value="south">华南地区</a-select-option>
          <a-select-option value="central">华中地区</a-select-option>
          <a-select-option value="southwest">西南地区</a-select-option>
          <a-select-option value="northwest">西北地区</a-select-option>
        </a-select>

        <a-select
          v-model:value="typeFilter"
          placeholder="景点类型"
          style="width: 140px"
          @change="handleFilter"
        >
          <a-select-option value="">所有类型</a-select-option>
          <a-select-option value="history">历史文化</a-select-option>
          <a-select-option value="nature">自然风光</a-select-option>
          <a-select-option value="modern">现代都市</a-select-option>
          <a-select-option value="food">美食之都</a-select-option>
          <a-select-option value="coastal">海滨城市</a-select-option>
        </a-select>

        <a-button type="primary" @click="resetFilters">
          重置筛选
        </a-button>
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
              <div class="destination-budget">¥{{ destination.avgBudget }}/天</div>
            </div>
          </template>
          
          <a-card-meta 
            :title="destination.name" 
            :description="destination.location"
          />
          
          <p class="destination-description">{{ destination.description }}</p>
          
          <div class="destination-info">
            <div class="info-item">
              <span class="info-label">类型：</span>
              <span>{{ getTypeLabel(destination.type) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最佳季节：</span>
              <span>{{ destination.bestSeason }}</span>
            </div>
          </div>
          
          <div class="destination-tags">
            <a-space wrap>
              <a-tag 
                v-for="tag in destination.tags.slice(0, 3)" 
                :key="tag"
                color="blue"
              >
                {{ tag }}
              </a-tag>
              <a-tag v-if="destination.tags.length > 3" color="default">
                +{{ destination.tags.length - 3 }}
              </a-tag>
            </a-space>
          </div>
          
          <div class="destination-actions">
            <a-button type="primary" @click.stop="addToPlan(destination)">
              规划行程
            </a-button>
            <a-button @click.stop="viewDetails(destination)">
              详情
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      :title="selectedDestination?.name"
      width="700px"
      :footer="null"
    >
      <div v-if="selectedDestination" class="destination-detail">
        <a-row :gutter="[24, 24]">
          <a-col :span="12">
            <img :src="selectedDestination.image" :alt="selectedDestination.name" class="detail-image" />
            <div class="destination-info">
              <div class="info-item">
                <span class="info-label">地区：</span>
                <span>{{ getRegionLabel(selectedDestination.region) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">类型：</span>
                <span>{{ getTypeLabel(selectedDestination.type) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最佳季节：</span>
                <span>{{ selectedDestination.bestSeason }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">日均预算：</span>
                <span class="budget">¥{{ selectedDestination.avgBudget }}</span>
              </div>
            </div>
          </a-col>
          <a-col :span="12">
            <h3>{{ selectedDestination.name }}</h3>
            <p class="location"><EnvironmentOutlined /> {{ selectedDestination.location }}</p>
            <p class="description">{{ selectedDestination.description }}</p>
            
            <div class="detail-tags">
              <h4>特色标签</h4>
              <a-space wrap>
                <a-tag v-for="tag in selectedDestination.tags" :key="tag" color="blue">
                  {{ tag }}
                </a-tag>
              </a-space>
            </div>
            
            <div class="detail-actions">
              <a-button type="primary" size="large" @click="addToPlan(selectedDestination)">
                规划行程
              </a-button>
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
    name: "北京",
    location: "华北地区",
    description: "中国的首都，拥有故宫、长城等世界文化遗产",
    type: "history",
    region: "north",
    icon: "🏯",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["历史文化", "皇家宫殿", "长城", "美食"],
    bestSeason: "春秋季",
    avgBudget: 500
  },
  {
    id: 2,
    name: "上海",
    location: "华东地区",
    description: "现代化国际大都市，外滩夜景和迪士尼乐园著名",
    type: "modern",
    region: "east",
    icon: "🏙️",
    image: "https://images.unsplash.com/photo-1541332246502-bc8f5b3c3b2a?w=400",
    tags: ["现代都市", "购物天堂", "夜景", "迪士尼"],
    bestSeason: "春秋季",
    avgBudget: 600
  },
  {
    id: 3,
    name: "西安",
    location: "西北地区",
    description: "古都长安，兵马俑和古城墙见证千年历史",
    type: "history",
    region: "northwest",
    icon: "🗿",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["古都文化", "兵马俑", "丝绸之路", "美食"],
    bestSeason: "春秋季",
    avgBudget: 400
  },
  {
    id: 4,
    name: "杭州",
    location: "华东地区",
    description: "西湖美景，龙井茶文化，江南水乡的代表",
    type: "nature",
    region: "east",
    icon: "🌊",
    image: "https://images.unsplash.com/photo-1535957998253-26ae1ef29506?w=400",
    tags: ["西湖", "龙井茶", "江南水乡", "休闲"],
    bestSeason: "春季",
    avgBudget: 450
  },
  {
    id: 5,
    name: "成都",
    location: "西南地区",
    description: "天府之国，大熊猫基地和川菜美食闻名",
    type: "food",
    region: "southwest",
    icon: "🐼",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["大熊猫", "川菜美食", "休闲城市", "茶馆"],
    bestSeason: "春秋季",
    avgBudget: 400
  },
  {
    id: 6,
    name: "桂林",
    location: "华南地区",
    description: "山水甲天下，漓江风光和喀斯特地貌",
    type: "nature",
    region: "south",
    icon: "⛰️",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["山水风光", "漓江", "喀斯特", "摄影"],
    bestSeason: "春秋季",
    avgBudget: 350
  },
  {
    id: 7,
    name: "厦门",
    location: "华南地区",
    description: "海滨城市，鼓浪屿和环岛路风景优美",
    type: "coastal",
    region: "south",
    icon: "🏖️",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["海滨城市", "鼓浪屿", "海岛风光", "海鲜"],
    bestSeason: "春秋季",
    avgBudget: 450
  },
  {
    id: 8,
    name: "南京",
    location: "华东地区",
    description: "六朝古都，中山陵和夫子庙文化底蕴深厚",
    type: "history",
    region: "east",
    icon: "🏛️",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["古都文化", "中山陵", "夫子庙", "历史"],
    bestSeason: "春秋季",
    avgBudget: 400
  },
  {
    id: 9,
    name: "丽江",
    location: "西南地区",
    description: "古城风情，玉龙雪山和纳西文化",
    type: "nature",
    region: "southwest",
    icon: "🏔️",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["古城", "玉龙雪山", "少数民族", "摄影"],
    bestSeason: "春秋季",
    avgBudget: 400
  },
  {
    id: 10,
    name: "青岛",
    location: "华东地区",
    description: "海滨城市，啤酒文化和德式建筑",
    type: "coastal",
    region: "east",
    icon: "🍺",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["海滨", "啤酒", "德式建筑", "海鲜"],
    bestSeason: "夏季",
    avgBudget: 450
  },
  {
    id: 11,
    name: "张家界",
    location: "华中地区",
    description: "奇峰异石，国家森林公园和玻璃栈道",
    type: "nature",
    region: "central",
    icon: "🌄",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["奇峰", "森林公园", "玻璃栈道", "摄影"],
    bestSeason: "春秋季",
    avgBudget: 400
  },
  {
    id: 12,
    name: "哈尔滨",
    location: "东北地区",
    description: "冰雪之城，冰雕艺术和俄式建筑",
    type: "modern",
    region: "northeast",
    icon: "❄️",
    image: "https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=400",
    tags: ["冰雪", "冰雕", "俄式建筑", "冬季"],
    bestSeason: "冬季",
    avgBudget: 500
  }
])

const filteredDestinations = computed(() => {
  return destinations.value.filter(destination => {
    const matchesSearch = !searchText.value || 
      destination.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      destination.location.toLowerCase().includes(searchText.value.toLowerCase()) ||
      destination.description.toLowerCase().includes(searchText.value.toLowerCase()) ||
      destination.tags.some(tag => tag.toLowerCase().includes(searchText.value.toLowerCase()))
    
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

const resetFilters = () => {
  searchText.value = ''
  regionFilter.value = ''
  typeFilter.value = ''
}

const viewDestination = (destination) => {
  selectedDestination.value = destination
  detailModalVisible.value = true
}

const addToPlan = (destination) => {
  message.success(`已将 ${destination.name} 添加到行程规划`)
  // 这里可以添加实际添加到行程的逻辑
  window.dispatchEvent(new CustomEvent('openAuthModal', {
    detail: { mode: 'login' }
  }))
}

const viewDetails = (destination) => {
  selectedDestination.value = destination
  detailModalVisible.value = true
}

const getTypeLabel = (type) => {
  const typeMap = {
    'history': '历史文化',
    'nature': '自然风光',
    'modern': '现代都市',
    'food': '美食之都',
    'coastal': '海滨城市'
  }
  return typeMap[type] || type
}

const getRegionLabel = (region) => {
  const regionMap = {
    'north': '华北地区',
    'northeast': '东北地区',
    'east': '华东地区',
    'south': '华南地区',
    'central': '华中地区',
    'southwest': '西南地区',
    'northwest': '西北地区'
  }
  return regionMap[region] || region
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-header p {
  font-size: 1.1rem;
  color: #6b7280;
}

.filters-card {
  margin-bottom: 30px;
  border-radius: 12px;
}

.destination-card {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.destination-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
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
  transition: transform 0.3s ease;
}

.destination-card:hover .destination-cover img {
  transform: scale(1.05);
}

.destination-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 8px;
  backdrop-filter: blur(10px);
}

.destination-budget {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(24, 144, 255, 0.95);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.destination-description {
  color: #6b7280;
  margin: 16px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.destination-info {
  margin: 12px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.info-label {
  color: #9ca3af;
  font-weight: 500;
}

.destination-tags {
  margin: 16px 0;
}

.destination-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.destination-detail .detail-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 20px;
}

.destination-info .info-item {
  margin-bottom: 12px;
}

.budget {
  color: #1890ff;
  font-weight: 600;
  font-size: 1.1rem;
}

.location {
  color: #6b7280;
  margin-bottom: 16px;
}

.description {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 20px;
}

.detail-tags h4 {
  margin-bottom: 12px;
  color: #374151;
}

.detail-actions {
  margin-top: 24px;
  text-align: center;
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
  
  .destination-budget {
    font-size: 0.8rem;
    padding: 3px 10px;
  }
}

/* 筛选器样式优化 */
.filters-card :deep(.ant-card-body) {
  padding: 20px;
}

/* 卡片内容间距优化 */
.destination-card :deep(.ant-card-body) {
  padding: 20px;
}

/* 模态框样式优化 */
.destination-detail :deep(.ant-modal-body) {
  padding: 24px;
}
</style>