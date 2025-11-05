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
              <img :alt="destination.name" :src="destination.image" loading="lazy" />
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
      width="800px"
      :footer="null"
    >
      <div v-if="selectedDestination" class="destination-detail">
        <a-row :gutter="[24, 24]">
          <a-col :span="12">
            <img :src="selectedDestination.image" :alt="selectedDestination.name" class="detail-image" loading="lazy" />
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
            
            <!-- 行程模板 -->
            <div class="templates-section">
              <h4>推荐行程模板</h4>
              <a-row :gutter="[16, 16]">
                <a-col :span="12" v-for="template in getTemplatesForDestination(selectedDestination.name)" :key="template.id">
                  <a-card class="template-card" hoverable>
                    <a-card-meta
                      :title="template.title"
                      :description="template.description"
                    />
                    <div class="template-meta">
                      <a-space>
                        <span><CalendarOutlined /> {{ template.days }}天</span>
                        <span><DollarOutlined /> ¥{{ template.budget }}</span>
                      </a-space>
                    </div>
                    <a-space direction="vertical" size="small" style="width: 100%">
                      <a-button type="primary" size="small" block @click="viewTemplateDetail(template)">
                        查看详情
                      </a-button>
                      <a-button size="small" block @click="useTemplate(template)">
                        使用模板
                      </a-button>
                    </a-space>
                  </a-card>
                </a-col>
              </a-row>
            </div>
            

            

          </a-col>
        </a-row>
      </div>
    </a-modal>

    <!-- 模板详情模态框 -->
    <a-modal
      v-model:open="templateDetailModalVisible"
      :title="selectedTemplate?.title"
      width="900px"
      :footer="null"
    >
      <div v-if="selectedTemplate" class="template-detail">
        <a-row :gutter="[24, 24]">
          <a-col :span="8">
            <div class="template-info">
              <h3>{{ selectedTemplate.title }}</h3>
              <p class="destination">{{ selectedTemplate.destination }}</p>
              <p class="description">{{ selectedTemplate.description }}</p>
              
              <div class="template-meta">
                <a-space direction="vertical" size="middle" style="width: 100%">
                  <div class="meta-item">
                    <CalendarOutlined />
                    <span>行程天数：{{ selectedTemplate.days }}天</span>
                  </div>
                  <div class="meta-item">
                    <DollarOutlined />
                    <span>预算：¥{{ selectedTemplate.budget }}</span>
                  </div>
                  <div class="meta-item">
                    <EnvironmentOutlined />
                    <span>目的地：{{ selectedTemplate.destination }}</span>
                  </div>
                </a-space>
              </div>
              
              <div class="template-actions">
                <a-button type="primary" size="large" block @click="useTemplate(selectedTemplate)">
                  使用此模板
                </a-button>
              </div>
            </div>
          </a-col>
          
          <a-col :span="16">
            <div class="schedule-detail">
              <h3>详细行程安排</h3>
              <div class="day-schedule" v-for="day in selectedTemplate.days" :key="day">
                <h4>第{{ day }}天</h4>
                <a-list
                  :data-source="getActivitiesByDay(selectedTemplate.activities, day)"
                  item-layout="vertical"
                  size="small"
                >
                  <template #renderItem="{ item, index }">
                    <a-list-item>
                      <a-list-item-meta
                        :title="item.title"
                        :description="item.description"
                      >
                        <template #avatar>
                          <div class="activity-time">
                            {{ item.time }}
                          </div>
                        </template>
                      </a-list-item-meta>
                      <div class="activity-details">
                        <a-space>
                          <span class="location">{{ item.location }}</span>
                          <span class="cost" v-if="item.cost">¥{{ item.cost }}</span>
                        </a-space>
                      </div>
                    </a-list-item>
                  </template>
                </a-list>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { SearchOutlined, EnvironmentOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import templateService from '../services/templateService'
import supabaseAuthService from '../services/supabaseAuthService'
import authService from '../services/authService'

const route = useRoute()
const searchText = ref('')
const regionFilter = ref('')
const typeFilter = ref('')
const detailModalVisible = ref(false)
const templateDetailModalVisible = ref(false)
const selectedDestination = ref(null)
const selectedTemplate = ref(null)
const savingTemplates = ref(false)
const databaseTemplates = ref([])
const loadingTemplates = ref(false)

const destinations = ref([
  {
    id: 1,
    name: "北京",
    location: "华北地区",
    description: "中国的首都，拥有故宫、长城等世界文化遗产",
    type: "history",
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
    type: "modern",
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
    type: "history",
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
    type: "nature",
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
    type: "food",
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
    type: "nature",
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
    type: "coastal",
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
    type: "history",
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
    type: "nature",
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
    type: "coastal",
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
    type: "nature",
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
    type: "modern",
    region: "northeast",
    icon: "❄️",
    image: "/images/cities/haerbing.png",
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

// 查看模板详情
const viewTemplateDetail = (template) => {
  selectedTemplate.value = template
  templateDetailModalVisible.value = true
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

// 行程模板数据
const travelTemplates = [
  // 北京模板
  {
    id: 1,
    destination: '北京',
    title: '北京3日文化游',
    description: '故宫、长城、颐和园经典路线，体验千年古都文化',
    days: 3,
    budget: 1500,
    activities: [
      { day: 1, title: '故宫博物院', description: '上午参观明清皇宫建筑群，游览太和殿、乾清宫等主要建筑', time: '09:00-12:00', location: '故宫博物院', cost: 60 },
      { day: 1, title: '天安门广场', description: '下午参观国家政治中心，观看降旗仪式', time: '14:00-16:00', location: '天安门广场', cost: 0 },
      { day: 1, title: '王府井步行街', description: '晚上品尝北京小吃，体验老北京风情', time: '18:00-20:00', location: '王府井', cost: 100 },
      { day: 2, title: '八达岭长城', description: '上午登长城，感受古代军事防御工程的雄伟', time: '08:00-12:00', location: '八达岭长城', cost: 45 },
      { day: 2, title: '明十三陵', description: '下午参观明代皇家陵寝，了解古代帝王陵墓文化', time: '14:00-17:00', location: '昌平区', cost: 60 },
      { day: 3, title: '颐和园', description: '上午游览皇家园林，欣赏昆明湖和万寿山美景', time: '09:00-12:00', location: '颐和园', cost: 30 },
      { day: 3, title: '圆明园遗址', description: '下午参观历史遗址，感受近代历史沧桑', time: '14:00-16:00', location: '圆明园', cost: 25 }
    ]
  },
  {
    id: 2,
    destination: '北京',
    title: '北京5日深度游',
    description: '全面体验北京历史文化，深度探索古都魅力',
    days: 5,
    budget: 2500,
    activities: [
      { day: 1, title: '故宫+景山公园', description: '全天深度游览故宫，傍晚登景山俯瞰紫禁城全景', time: '09:00-17:00', location: '故宫博物院', cost: 60 },
      { day: 2, title: '天坛+前门大街', description: '上午参观天坛，下午逛前门大街体验老北京风情', time: '09:00-18:00', location: '天坛公园', cost: 35 },
      { day: 3, title: '慕田峪长城', description: '全天游览慕田峪长城，体验长城雄伟与自然风光', time: '08:00-17:00', location: '慕田峪长城', cost: 45 },
      { day: 4, title: '颐和园+圆明园', description: '上午游颐和园，下午参观圆明园遗址', time: '09:00-17:00', location: '海淀区', cost: 55 },
      { day: 5, title: '798艺术区+南锣鼓巷', description: '上午参观现代艺术区，下午逛胡同体验北京文化', time: '10:00-18:00', location: '朝阳区', cost: 80 }
    ]
  },
  // 上海模板
  {
    id: 3,
    destination: '上海',
    title: '上海2日现代游',
    description: '外滩、迪士尼、陆家嘴，体验魔都现代魅力',
    days: 2,
    budget: 1200,
    activities: [
      { day: 1, title: '外滩观光', description: '上午欣赏黄浦江两岸风光，参观万国建筑群', time: '09:00-12:00', location: '外滩', cost: 0 },
      { day: 1, title: '南京路步行街', description: '下午购物休闲，品尝上海特色小吃', time: '14:00-17:00', location: '南京路', cost: 200 },
      { day: 1, title: '豫园商城', description: '晚上游览豫园，体验上海传统文化', time: '18:00-20:00', location: '豫园', cost: 40 },
      { day: 2, title: '迪士尼乐园', description: '全天游玩迪士尼乐园，体验童话世界', time: '09:00-21:00', location: '迪士尼乐园', cost: 399 }
    ]
  },
  {
    id: 4,
    destination: '上海',
    title: '上海3日都市游',
    description: '全面体验魔都魅力，感受现代都市与传统文化交融',
    days: 3,
    budget: 1800,
    activities: [
      { day: 1, title: '外滩+豫园', description: '上午外滩观光，下午豫园游览，晚上城隍庙美食', time: '09:00-20:00', location: '黄浦区', cost: 80 },
      { day: 2, title: '迪士尼乐园', description: '全天迪士尼乐园游玩，观看烟花表演', time: '09:00-21:00', location: '迪士尼乐园', cost: 399 },
      { day: 3, title: '陆家嘴+新天地', description: '上午登东方明珠，下午逛新天地，体验现代都市', time: '10:00-18:00', location: '浦东新区', cost: 220 }
    ]
  },
  // 杭州模板
  {
    id: 5,
    destination: '杭州',
    title: '杭州2日西湖游',
    description: '西湖、灵隐寺、龙井茶园，感受江南水乡韵味',
    days: 2,
    budget: 800,
    activities: [
      { day: 1, title: '西湖十景', description: '上午漫步西湖，欣赏断桥残雪、苏堤春晓等景点', time: '08:00-12:00', location: '西湖景区', cost: 0 },
      { day: 1, title: '灵隐寺', description: '下午参观千年古刹，感受佛教文化', time: '14:00-17:00', location: '灵隐寺', cost: 45 },
      { day: 2, title: '龙井茶园', description: '上午体验采茶文化，品尝正宗龙井茶', time: '09:00-12:00', location: '龙井村', cost: 50 },
      { day: 2, title: '宋城景区', description: '下午游览宋城，观看《宋城千古情》表演', time: '14:00-18:00', location: '宋城', cost: 310 }
    ]
  },
  {
    id: 6,
    destination: '杭州',
    title: '杭州3日深度游',
    description: '全面感受江南水乡魅力，深度体验杭州文化',
    days: 3,
    budget: 1200,
    activities: [
      { day: 1, title: '西湖+雷峰塔', description: '全天深度游览西湖景区，登雷峰塔俯瞰西湖', time: '08:00-17:00', location: '西湖', cost: 40 },
      { day: 2, title: '灵隐寺+飞来峰', description: '上午参观灵隐寺，下午游览飞来峰石刻', time: '09:00-16:00', location: '灵隐寺', cost: 75 },
      { day: 3, title: '西溪湿地', description: '全天游览西溪湿地，体验自然生态之美', time: '09:00-17:00', location: '西溪湿地', cost: 80 }
    ]
  },
  // 西安模板
  {
    id: 7,
    destination: '西安',
    title: '西安3日历史游',
    description: '兵马俑、大雁塔、古城墙，感受千年古都文化',
    days: 3,
    budget: 1000,
    activities: [
      { day: 1, title: '兵马俑博物馆', description: '上午参观世界第八大奇迹，了解秦代历史', time: '09:00-12:00', location: '临潼区', cost: 120 },
      { day: 1, title: '华清池', description: '下午游览华清池，感受唐代皇家园林', time: '14:00-16:00', location: '华清池', cost: 120 },
      { day: 2, title: '大雁塔', description: '上午登大雁塔，下午参观陕西历史博物馆', time: '09:00-16:00', location: '雁塔区', cost: 50 },
      { day: 3, title: '古城墙', description: '上午骑行古城墙，下午逛回民街品尝美食', time: '09:00-17:00', location: '古城墙', cost: 54 }
    ]
  },
  {
    id: 8,
    destination: '西安',
    title: '西安4日文化游',
    description: '深度体验古都文化，全面了解西安历史',
    days: 4,
    budget: 1500,
    activities: [
      { day: 1, title: '兵马俑+华清池', description: '全天秦文化深度游，参观兵马俑和华清池', time: '08:00-17:00', location: '临潼区', cost: 240 },
      { day: 2, title: '大雁塔+陕西历史博物馆', description: '上午登大雁塔，下午参观博物馆学习历史', time: '09:00-17:00', location: '雁塔区', cost: 50 },
      { day: 3, title: '古城墙+回民街', description: '上午骑行古城墙，下午逛回民街体验美食', time: '09:00-18:00', location: '古城内', cost: 54 },
      { day: 4, title: '大唐不夜城', description: '晚上游览大唐不夜城，感受现代唐文化', time: '19:00-22:00', location: '曲江新区', cost: 0 }
    ]
  },
  // 成都模板
  {
    id: 9,
    destination: '成都',
    title: '成都3日美食游',
    description: '大熊猫、宽窄巷子、火锅，体验天府之国魅力',
    days: 3,
    budget: 900,
    activities: [
      { day: 1, title: '大熊猫基地', description: '上午观赏国宝大熊猫，了解熊猫保护工作', time: '08:00-12:00', location: '成华区', cost: 55 },
      { day: 1, title: '宽窄巷子', description: '下午体验成都慢生活，品尝地道小吃', time: '14:00-18:00', location: '青羊区', cost: 100 },
      { day: 2, title: '锦里+武侯祠', description: '全天三国文化体验，参观武侯祠和锦里古街', time: '09:00-17:00', location: '武侯祠', cost: 60 },
      { day: 3, title: '杜甫草堂', description: '上午参观杜甫草堂，下午体验成都茶馆文化', time: '09:00-16:00', location: '青羊区', cost: 60 }
    ]
  },
  {
    id: 10,
    destination: '成都',
    title: '成都4日休闲游',
    description: '全面感受天府之国，深度体验成都慢生活',
    days: 4,
    budget: 1200,
    activities: [
      { day: 1, title: '大熊猫基地+杜甫草堂', description: '上午看熊猫，下午参观草堂，自然与文化结合', time: '08:00-17:00', location: '市区', cost: 115 },
      { day: 2, title: '宽窄巷子+人民公园', description: '全天成都慢生活体验，喝茶聊天感受悠闲', time: '10:00-18:00', location: '青羊区', cost: 80 },
      { day: 3, title: '都江堰', description: '全天参观古代水利工程，了解李冰治水智慧', time: '08:00-17:00', location: '都江堰市', cost: 90 },
      { day: 4, title: '青城山', description: '全天游览道教名山，感受自然与人文融合', time: '08:00-17:00', location: '都江堰市', cost: 90 }
    ]
  },
  // 桂林模板
  {
    id: 11,
    destination: '桂林',
    title: '桂林3日山水游',
    description: '漓江风光、阳朔西街、象鼻山，体验山水甲天下',
    days: 3,
    budget: 800,
    activities: [
      { day: 1, title: '漓江竹筏游', description: '上午乘竹筏游览漓江，欣赏山水画廊美景', time: '08:00-12:00', location: '漓江', cost: 150 },
      { day: 1, title: '象鼻山公园', description: '下午参观桂林城徽象鼻山', time: '14:00-16:00', location: '象山区', cost: 55 },
      { day: 2, title: '阳朔西街', description: '全天阳朔游玩，晚上逛西街体验夜生活', time: '09:00-22:00', location: '阳朔县', cost: 200 },
      { day: 3, title: '龙脊梯田', description: '全天游览龙脊梯田，感受壮族农耕文化', time: '08:00-17:00', location: '龙胜县', cost: 100 }
    ]
  },
  {
    id: 12,
    destination: '桂林',
    title: '桂林4日深度游',
    description: '深度体验桂林山水，全面感受喀斯特地貌魅力',
    days: 4,
    budget: 1200,
    activities: [
      { day: 1, title: '漓江精华游', description: '全天漓江游览，从桂林到阳朔山水画廊', time: '08:00-17:00', location: '漓江', cost: 300 },
      { day: 2, title: '阳朔遇龙河', description: '上午遇龙河漂流，下午骑行十里画廊', time: '09:00-17:00', location: '阳朔县', cost: 150 },
      { day: 3, title: '象鼻山+两江四湖', description: '上午象鼻山，晚上两江四湖夜游', time: '09:00-21:00', location: '桂林市区', cost: 210 },
      { day: 4, title: '龙脊梯田', description: '全天龙脊梯田深度游，体验少数民族文化', time: '08:00-17:00', location: '龙胜县', cost: 100 }
    ]
  },
  // 厦门模板
  {
    id: 13,
    destination: '厦门',
    title: '厦门3日海滨游',
    description: '鼓浪屿、环岛路、曾厝垵，感受海滨城市浪漫',
    days: 3,
    budget: 900,
    activities: [
      { day: 1, title: '鼓浪屿一日游', description: '全天游览鼓浪屿，参观日光岩、菽庄花园等景点', time: '08:00-18:00', location: '鼓浪屿', cost: 100 },
      { day: 2, title: '环岛路骑行', description: '上午环岛路骑行，下午曾厝垵文创村游玩', time: '09:00-17:00', location: '环岛路', cost: 50 },
      { day: 3, title: '南普陀寺+厦门大学', description: '上午参观南普陀寺，下午逛厦门大学校园', time: '09:00-16:00', location: '思明区', cost: 0 }
    ]
  },
  {
    id: 14,
    destination: '厦门',
    title: '厦门4日休闲游',
    description: '全面体验厦门魅力，感受海岛休闲生活',
    days: 4,
    budget: 1300,
    activities: [
      { day: 1, title: '鼓浪屿深度游', description: '全天鼓浪屿游览，体验小岛风情', time: '08:00-18:00', location: '鼓浪屿', cost: 100 },
      { day: 2, title: '环岛路+曾厝垵', description: '上午骑行环岛路，下午曾厝垵休闲', time: '09:00-17:00', location: '环岛路', cost: 80 },
      { day: 3, title: '厦门大学+南普陀', description: '上午南普陀寺，下午厦门大学参观', time: '09:00-16:00', location: '思明区', cost: 0 },
      { day: 4, title: '集美学村', description: '全天集美学村游览，感受陈嘉庚建筑风格', time: '09:00-17:00', location: '集美区', cost: 30 }
    ]
  },
  // 青岛模板
  {
    id: 15,
    destination: '青岛',
    title: '青岛3日海滨游',
    description: '栈桥、八大关、啤酒博物馆，感受德式建筑与海滨风情',
    days: 3,
    budget: 850,
    activities: [
      { day: 1, title: '栈桥+八大关', description: '上午栈桥观光，下午八大关风景区游览', time: '09:00-17:00', location: '市南区', cost: 0 },
      { day: 2, title: '崂山风景区', description: '全天崂山游览，感受道教文化与自然风光', time: '08:00-17:00', location: '崂山区', cost: 130 },
      { day: 3, title: '啤酒博物馆', description: '上午参观啤酒博物馆，下午海滨浴场休闲', time: '09:00-16:00', location: '市北区', cost: 60 }
    ]
  },
  {
    id: 16,
    destination: '青岛',
    title: '青岛4日深度游',
    description: '深度体验青岛魅力，感受海滨城市文化',
    days: 4,
    budget: 1200,
    activities: [
      { day: 1, title: '栈桥+小鱼山', description: '上午栈桥，下午小鱼山公园俯瞰青岛全景', time: '09:00-17:00', location: '市南区', cost: 0 },
      { day: 2, title: '八大关+第二海水浴场', description: '全天八大关游览，海滨休闲', time: '09:00-18:00', location: '市南区', cost: 0 },
      { day: 3, title: '崂山一日游', description: '全天崂山风景区深度游览', time: '08:00-17:00', location: '崂山区', cost: 130 },
      { day: 4, title: '啤酒博物馆+台东步行街', description: '上午啤酒文化体验，下午购物美食', time: '09:00-18:00', location: '市北区', cost: 100 }
    ]
  },
  // 张家界模板
  {
    id: 17,
    destination: '张家界',
    title: '张家界3日奇峰游',
    description: '国家森林公园、天门山、玻璃栈道，体验自然奇观',
    days: 3,
    budget: 950,
    activities: [
      { day: 1, title: '张家界国家森林公园', description: '全天游览袁家界、天子山等核心景区', time: '08:00-17:00', location: '武陵源区', cost: 228 },
      { day: 2, title: '天门山国家森林公园', description: '全天天门山游览，体验玻璃栈道和索道', time: '08:00-17:00', location: '永定区', cost: 258 },
      { day: 3, title: '黄龙洞+宝峰湖', description: '上午黄龙洞，下午宝峰湖游览', time: '09:00-16:00', location: '武陵源区', cost: 121 }
    ]
  },
  {
    id: 18,
    destination: '张家界',
    title: '张家界4日深度游',
    description: '深度体验张家界自然奇观，全面感受地质公园魅力',
    days: 4,
    budget: 1400,
    activities: [
      { day: 1, title: '张家界森林公园', description: '全天袁家界、杨家界景区游览', time: '08:00-17:00', location: '武陵源区', cost: 228 },
      { day: 2, title: '天子山+十里画廊', description: '全天天子山景区，乘坐小火车游览十里画廊', time: '08:00-17:00', location: '武陵源区', cost: 152 },
      { day: 3, title: '天门山景区', description: '全天天门山游览，体验玻璃栈道惊险', time: '08:00-17:00', location: '永定区', cost: 258 },
      { day: 4, title: '黄龙洞+宝峰湖', description: '上午溶洞探险，下午湖光山色', time: '09:00-16:00', location: '武陵源区', cost: 121 }
    ]
  },
  // 哈尔滨模板
  {
    id: 19,
    destination: '哈尔滨',
    title: '哈尔滨3日冰雪游',
    description: '冰雪大世界、中央大街、索菲亚教堂，体验北国冰雪魅力',
    days: 3,
    budget: 1100,
    activities: [
      { day: 1, title: '中央大街', description: '上午漫步中央大街，下午参观索菲亚教堂', time: '09:00-16:00', location: '道里区', cost: 0 },
      { day: 2, title: '冰雪大世界', description: '全天冰雪大世界游玩，晚上观赏冰灯', time: '14:00-22:00', location: '松北区', cost: 330 },
      { day: 3, title: '太阳岛雪博会', description: '上午太阳岛雪雕欣赏，下午俄罗斯风情小镇', time: '09:00-16:00', location: '松北区', cost: 240 }
    ]
  },
  {
    id: 20,
    destination: '哈尔滨',
    title: '哈尔滨4日文化游',
    description: '深度体验哈尔滨文化，感受俄式建筑与冰雪艺术',
    days: 4,
    budget: 1500,
    activities: [
      { day: 1, title: '中央大街+索菲亚教堂', description: '全天哈尔滨城市观光，感受俄式建筑', time: '09:00-17:00', location: '道里区', cost: 0 },
      { day: 2, title: '冰雪大世界', description: '全天冰雪艺术体验，晚上冰灯观赏', time: '14:00-22:00', location: '松北区', cost: 330 },
      { day: 3, title: '太阳岛+东北虎林园', description: '上午太阳岛雪雕，下午东北虎观赏', time: '09:00-16:00', location: '松北区', cost: 240 },
      { day: 4, title: '伏尔加庄园', description: '全天俄式庄园游览，体验异国风情', time: '09:00-17:00', location: '香坊区', cost: 150 }
    ]
  }
]

// 获取特定目的地的模板
const getTemplatesForDestination = (destinationName) => {
  console.log('获取模板 - 目的地:', destinationName)
  console.log('数据库模板数量:', databaseTemplates.value.length)
  
  // 首先尝试从数据库加载
  if (databaseTemplates.value.length > 0) {
    const dbTemplates = databaseTemplates.value.filter(template => template.destination === destinationName)
    console.log('数据库中找到的模板数量:', dbTemplates.length)
    if (dbTemplates.length > 0) {
      console.log('使用数据库模板数据')
      return dbTemplates
    }
  }
  
  // 如果数据库中没有数据，使用本地模板数据
  const localTemplates = travelTemplates.filter(template => template.destination === destinationName)
  console.log('本地模板数量:', localTemplates.length)
  return localTemplates
}

// 获取按天分组的活动
const getActivitiesByDay = (activities, day) => {
  return activities.filter(activity => activity.day === day)
}

// 使用模板
const useTemplate = async (template) => {
  console.log('使用模板:', template)
  
  // 检查用户是否已登录
  if (!authService.isLoggedIn()) {
    message.warning('请先登录后再使用模板')
    // 触发登录弹窗
    window.dispatchEvent(new CustomEvent('openAuthModal', {
      detail: { mode: 'login' }
    }))
    return
  }
  
  try {
    // 显示等待提示
    const loadingMessage = message.loading('正在使用模板创建行程，请稍后...', 0)
    
    // 将模板数据转换为用户行程格式
    const planData = {
      title: template.title,
      description: template.description || `基于"${template.title}"模板创建的行程`,
      days: template.days,
      budget: template.budget,
      travelers: 2, // 默认2人
      destination: template.destination,
      status: 'planning',
      is_ai_generated: false
    }
    
    console.log('转换后的行程数据:', planData)
    
    // 保存行程到数据库
    const result = await supabaseAuthService.saveUserPlan(planData)
    
    if (result.success) {
      const savedPlan = result.data
      console.log('行程保存成功:', savedPlan)
      
      // 如果模板有活动数据，保存活动到数据库
      if (template.activities && template.activities.length > 0) {
        console.log('开始保存活动数据，活动数量:', template.activities.length)
        
        // 将模板活动转换为数据库活动格式
        const activities = template.activities.map((activity, index) => ({
          activity_title: activity.title,
          activity_description: activity.description,
          day_number: activity.day || 1,
          time_slot: 'general',
          location: '',
          estimated_cost: null,
          duration_minutes: null,
          order_index: index
        }))
        
        console.log('转换后的活动数据:', activities)
        
        // 保存活动到数据库
        const activitiesResult = await supabaseAuthService.saveUserPlanActivities(savedPlan.id, activities)
        
        if (activitiesResult.success) {
          console.log('活动保存成功:', activitiesResult.data)
        } else {
          console.warn('活动保存失败:', activitiesResult.error)
        }
      }
      
      // 关闭等待提示并显示成功消息
      loadingMessage()
      message.success(`"${template.title}"已成功保存到您的行程规划`)
      
      // 关闭详情模态框
      detailModalVisible.value = false
      
      // 可选：跳转到行程规划页面
      // router.push('/plans')
      
    } else {
      // 关闭等待提示并显示错误消息
      loadingMessage()
      message.error(`保存失败: ${result.error}`)
      console.error('保存行程失败:', result.error)
    }
  } catch (error) {
    // 关闭等待提示并显示错误消息
    message.destroy()
    message.error('创建行程时发生错误')
    console.error('使用模板时发生错误:', error)
  }
}

// 保存模板到数据库
const saveTemplatesToDatabase = async () => {
  savingTemplates.value = true
  
  try {
    // 使用模板服务保存所有模板
    const result = await templateService.saveTemplatesToDatabase(travelTemplates)
    
    if (result.success) {
      message.success(`成功保存 ${result.data?.length || 0} 个模板到数据库`)
      console.log('模板保存成功:', result.data)
    } else {
      message.error(`保存失败: ${result.error}`)
      console.error('模板保存失败:', result.error)
    }
  } catch (error) {
    message.error('保存模板时发生错误')
    console.error('保存模板错误:', error)
  } finally {
    savingTemplates.value = false
  }
}

// 从数据库加载模板数据
const loadTemplatesFromDatabase = async () => {
  loadingTemplates.value = true
  try {
    const result = await templateService.loadTemplatesFromDatabase()
    if (result.success) {
      databaseTemplates.value = result.data || []
      console.log(`从数据库加载了 ${databaseTemplates.value.length} 个模板`)
      console.log('数据库模板目的地列表:', [...new Set(databaseTemplates.value.map(t => t.destination))])
      
      if (databaseTemplates.value.length === 0) {
        console.log('数据库中没有模板数据，将使用本地数据')
      } else {
        console.log('数据库模板数据加载成功，准备显示')
      }
    } else {
      console.warn('从数据库加载模板失败:', result.error)
      databaseTemplates.value = []
    }
  } catch (error) {
    console.error('加载模板数据时发生错误:', error)
    databaseTemplates.value = []
  } finally {
    loadingTemplates.value = false
  }
}

// 初始化数据库模板
const initializeDatabaseTemplates = async () => {
  try {
    const result = await templateService.initTemplatesTable()
    if (result.success) {
      console.log('模板表检查完成:', result.message)
    } else {
      console.warn('模板表检查失败:', result.error)
    }
  } catch (error) {
    console.error('初始化模板表错误:', error)
  }
}

onMounted(() => {
  // 检查是否有从首页传递的城市参数
  if (route.query.city) {
    searchText.value = route.query.city
    // 自动打开第一个匹配的目的地详情
    const matchedDestination = destinations.value.find(dest => 
      dest.name === route.query.city
    )
    if (matchedDestination) {
      setTimeout(() => {
        viewDestination(matchedDestination)
      }, 300)
    }
  }

  // 初始化数据库模板
  initializeDatabaseTemplates()
  
  // 从数据库加载模板数据
  loadTemplatesFromDatabase()
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

/* 模板样式 */
.templates-section {
  margin: 20px 0;
}

.templates-section h4 {
  margin-bottom: 16px;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.template-card {
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-meta {
  margin: 12px 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.template-meta .ant-space {
  width: 100%;
  justify-content: space-between;
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

/* 模板详情样式 */
.template-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.template-info h3 {
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 1.3rem;
}

.template-info .destination {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 12px;
}

.template-info .description {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 20px;
}

.template-meta {
  margin: 20px 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.95rem;
}

.meta-item span {
  color: #374151;
  font-weight: 500;
}

.template-actions {
  margin-top: 24px;
}

.schedule-detail h3 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 1.2rem;
}

.day-schedule {
  margin-bottom: 24px;
}

.day-schedule h4 {
  color: #374151;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 1rem;
}

.activity-time {
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 70px;
  text-align: center;
}

.activity-details {
  margin-top: 8px;
}

.location {
  color: #6b7280;
  font-size: 0.9rem;
}

.cost {
  color: #10b981;
  font-weight: 600;
  font-size: 0.9rem;
}

/* 列表项样式优化 */
.day-schedule :deep(.ant-list-item) {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px;
}

.day-schedule :deep(.ant-list-item:hover) {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.day-schedule :deep(.ant-list-item-meta-title) {
  margin-bottom: 4px;
  font-size: 1rem;
  color: #1f2937;
}

.day-schedule :deep(.ant-list-item-meta-description) {
  color: #6b7280;
  font-size: 0.9rem;
}
</style>