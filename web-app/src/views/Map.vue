<template>
  <div class="map-page">
    <a-page-header
      :title="pageTitle"
      :sub-title="pageSubtitle"
      @back="$router.back"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" @click="refreshMap">
            <template #icon><ReloadOutlined /></template>
            刷新地图
          </a-button>
          <a-button :type="isSelectMode ? 'primary' : 'default'" @click="toggleSelectMode">
            <template #icon><EnvironmentOutlined /></template>
            {{ isSelectMode ? '退出选择模式' : '标记选择' }}
          </a-button>
          <a-button @click="toggleFilters">
            <template #icon><FilterOutlined /></template>
            景点筛选
          </a-button>
          <a-button v-if="isPlanRoute" @click="clearPlanRoute" type="dashed">
            <template #icon><DeleteOutlined /></template>
            清除行程路线
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <div class="map-content">
      <!-- 地图组件 -->
      <SimpleMap
        ref="mapRef"
        :center="mapCenter"
        :zoom="mapZoom"
        :landmarks="markers"
        :show-controls="true"
        :select-mode="isSelectMode"
        :selection-options="{ 
          onSelect: handleMarkerSelected,
          iconColor: '#1890ff',
          iconText: '📍'
        }"
        @marker-click="handleMarkerClick"
        @map-click="handleMapClick"
        @map-ready="handleMapReady"
        @marker-selected="handleMarkerSelected"
        @selection-start="() => console.log('选择模式启动')"
        @selection-stop="() => console.log('选择模式停止')"
      />

      <!-- 地点信息侧边栏 -->
      <a-drawer
        title="地点详情"
        :width="400"
        :open="!!selectedPlace"
        :mask-closable="true"
        :closable="true"
        @close="closePlaceDrawer"
      >
        <div v-if="selectedPlace" class="place-details">
          <a-descriptions title="基本信息" size="small" bordered>
            <a-descriptions-item label="名称">{{ selectedPlace.name }}</a-descriptions-item>
            <a-descriptions-item label="城市">{{ selectedPlace.city || '未知' }}</a-descriptions-item>
            <a-descriptions-item label="国家">{{ selectedPlace.country || '未知' }}</a-descriptions-item>
            <a-descriptions-item label="类型">{{ getTypeLabel(selectedPlace.type) }}</a-descriptions-item>
            <a-descriptions-item label="描述">{{ selectedPlace.description || '著名旅游景点' }}</a-descriptions-item>
          </a-descriptions>

          <div class="place-actions">
            <a-space>
              <a-button type="primary" @click="viewMoreInfo">
                <template #icon><SearchOutlined /></template>
                查看更多信息
              </a-button>
            </a-space>
          </div>
        </div>
      </a-drawer>

      <!-- 景点筛选面板 -->
      <a-drawer
        title="景点筛选"
        :width="400"
        :open="showFilters"
        :mask-closable="true"
        :closable="true"
        @close="showFilters = false"
      >
        <div class="filter-panel">
          <a-form layout="vertical">
            <a-form-item label="城市筛选">
              <a-input 
                v-model:value="searchCity" 
                placeholder="请输入城市名称（如：北京、上海、西安等）" 
                style="width: 100%"
                @input="handleCitySearch"
                @press-enter="applyFilters"
                :allow-clear="true"
              />
              <div style="margin-top: 8px; font-size: 12px; color: #666;">
                提示：可输入城市名进行模糊搜索，支持中文城市名。当前支持城市：北京、上海、西安、广州、杭州、成都
              </div>
              <div v-if="filteredCities.length > 0" style="margin-top: 8px; font-size: 12px; color: #1890ff;">
                匹配到 {{ filteredCities.length }} 个城市：{{ filteredCities.join(', ') }}
              </div>
              <div v-else-if="searchCity.trim() !== ''" style="margin-top: 8px; font-size: 12px; color: #ff4d4f;">
                未找到匹配的城市，请检查输入
              </div>
            </a-form-item>
            
            <a-form-item label="景点类型">
              <a-select v-model:value="selectedType" style="width: 100%" @change="updateMarkers">
                <a-select-option value="all">所有类型</a-select-option>
                <a-select-option v-for="type in allTypes" :key="type" :value="type">
                  {{ getTypeLabel(type) }}
                </a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item label="国家/地区">
              <a-select v-model:value="selectedCountry" style="width: 100%" @change="updateMarkers">
                <a-select-option value="all">所有国家</a-select-option>
                <a-select-option v-for="country in allCountries" :key="country" :value="country">
                  {{ country }}
                </a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item>
              <a-space>
                <a-button type="primary" @click="applyFilters">
                  应用筛选
                </a-button>
                <a-button @click="resetFilters">
                  重置筛选
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
          
          <!-- 景点统计信息 -->
          <a-card title="景点统计" size="small" style="margin-top: 16px">
            <a-descriptions size="small" column={1}>
              <a-descriptions-item label="当前显示">
                {{ filteredLandmarks.length }} 个景点
              </a-descriptions-item>
              <a-descriptions-item label="筛选条件">
                {{ getFilterDescription() }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </div>
      </a-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import SimpleMap from '../components/SimpleMap.vue'
import { landmarks } from '../data/landmarks'
import { 
  ReloadOutlined, 
  DeleteOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'

// 路由引用
const route = useRoute()

// 地图引用
const mapRef = ref(null)

// 状态管理
const selectedPlace = ref(null)

// 行程路线相关状态
const planLocations = ref([])
const isPlanRoute = ref(false)
const planTitle = ref('')

// 标记选择模式状态
const isSelectMode = ref(false)

// 景点数据相关状态
const currentCity = ref('北京') // 默认显示北京
const searchCity = ref('') // 城市搜索输入框
const showFilters = ref(false)
const selectedType = ref('all')
const selectedCountry = ref('all')

// 地图状态 - 高德地图使用 [lng, lat] 格式
const mapCenter = ref([116.397128, 39.916527]) // 北京中心，高德地图格式
const mapZoom = ref(10)
const mapReady = ref(false)

// 计算属性
const pageTitle = computed(() => {
  return isPlanRoute.value ? planTitle.value : '旅行地图'
})

const pageSubtitle = computed(() => {
  return isPlanRoute.value ? '行程路线展示' : '使用高德地图服务，探索全球景点'
})

// 标记点
const markers = ref([])

// 计算匹配的城市列表
const filteredCities = computed(() => {
  if (!searchCity.value || searchCity.value.trim() === '') {
    return []
  }
  
  const searchTerm = searchCity.value.trim().toLowerCase()
  const matchedCities = allCities.filter(city => 
    city.toLowerCase().includes(searchTerm)
  )
  
  return matchedCities
})

// 计算属性
const filteredLandmarks = computed(() => {
  let filtered = landmarks
  
  // 按城市筛选 - 支持模糊搜索
  if (searchCity.value && searchCity.value.trim() !== '') {
    const searchTerm = searchCity.value.trim().toLowerCase()
    filtered = filtered.filter(item => 
      item.city.toLowerCase().includes(searchTerm)
    )
  }
  
  // 按类型筛选
  if (selectedType.value !== 'all') {
    filtered = filtered.filter(item => item.type === selectedType.value)
  }
  
  // 按国家筛选
  if (selectedCountry.value !== 'all') {
    filtered = filtered.filter(item => item.country === selectedCountry.value)
  }
  
  return filtered
})

// 获取所有城市列表
const allCities = [...new Set(landmarks.map(item => item.city))]

// 获取所有类型列表
const allTypes = [...new Set(landmarks.map(item => item.type))]

// 获取所有国家列表
const allCountries = [...new Set(landmarks.map(item => item.country))]

// 处理标记点点击
const handleMarkerClick = (place) => {
  selectedPlace.value = place
  console.log('标记点点击:', place)
}

// 处理地图点击
const handleMapClick = (point) => {
  console.log('地图点击:', point)
  // 可以在这里添加点击地图添加标记点的功能
}

// 处理地图准备完成
const handleMapReady = async (mapInstance) => {
  console.log('地图加载完成:', mapInstance)
  mapReady.value = true
  
  // 如果是行程路线模式，绘制路线
  if (isPlanRoute.value && planLocations.value.length > 1) {
    await drawRoutePlan(mapInstance)
  }
  
  // 初始化景点标记
  updateMarkers()
  
  message.success('地图加载成功！使用高德地图服务')
}

// 关闭地点详情面板
const closePlaceDrawer = () => {
  selectedPlace.value = null
}

// 刷新地图
const refreshMap = () => {
  if (mapRef.value && mapReady.value) {
    // 重新初始化地图
    mapRef.value.destroyMap()
    setTimeout(() => {
      if (mapRef.value.initMap) {
        mapRef.value.initMap()
      }
    }, 100)
    message.success('地图已刷新')
  } else {
    message.info('地图正在加载中，请稍后...')
  }
}

// 查看更多信息
const viewMoreInfo = () => {
  if (selectedPlace.value) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedPlace.value.name + ' ' + selectedPlace.value.city)}`
    window.open(searchUrl, '_blank')
  }
}

// 绘制行程路线
const drawRoutePlan = async (mapInstance) => {
  try {
    if (!mapInstance) return
    
    // 导入地图服务
    const mapService = await import('../services/mapService.js')
    
    // 使用地图服务创建路线计划
    const routePlan = await mapService.default.createRoutePlan(mapInstance, planLocations.value, {
      city: '全国',
      startTitle: '行程起点',
      endTitle: '行程终点',
      waypointTitle: '途经点'
    })
    
    if (routePlan) {
      console.log('路线计划创建成功:', routePlan)
      message.success(`行程路线绘制成功，包含 ${routePlan.points.length} 个地点`)
      
      // 更新标记点显示
      if (routePlan.markers && routePlan.markers.length > 0) {
        markers.value = routePlan.markers.map((marker, index) => {
          const position = [marker.getPosition().lng, marker.getPosition().lat]
          const locationName = planLocations.value[index] || `地点${index + 1}`
          
          return {
            id: `plan-${index}`,
            name: `${index + 1}. ${locationName}`,
            type: 'plan',
            description: index === 0 ? '行程起点' : 
                        index === routePlan.markers.length - 1 ? '行程终点' : '途经点',
            position: position,
            city: '行程路线',
            country: '中国'
          }
        })
      }
    } else {
      message.warning('路线绘制失败，将显示为标记点')
      // 降级处理：只显示标记点
      markers.value = planLocations.value.map((location, index) => ({
        id: `plan-${index}`,
        name: `${index + 1}. ${location}`,
        type: 'plan',
        description: index === 0 ? '行程起点' : 
                    index === planLocations.value.length - 1 ? '行程终点' : '途经点',
        position: mapCenter.value, // 使用地图中心点作为默认位置
        city: '行程路线',
        country: '中国'
      }))
    }
  } catch (error) {
    console.error('绘制路线计划失败:', error)
    message.error('路线绘制失败，请检查网络连接')
    
    // 降级处理：只显示标记点
    markers.value = planLocations.value.map((location, index) => ({
      id: `plan-${index}`,
      name: `${index + 1}. ${location}`,
      type: 'plan',
      description: index === 0 ? '行程起点' : 
                  index === planLocations.value.length - 1 ? '行程终点' : '途经点',
      position: mapCenter.value, // 使用地图中心点作为默认位置
      city: '行程路线',
      country: '中国'
    }))
  }
}

// 清除行程路线
const clearPlanRoute = () => {
  planLocations.value = []
  isPlanRoute.value = false
  planTitle.value = ''
  markers.value = []
  
  // 重新加载默认景点数据
  updateMarkers()
  
  message.success('行程路线已清除')
}

// 格式化距离（保留但暂时注释，以备后续使用）
/* const formatDistance = (distance) => {
  if (!distance) return '未知'
  if (distance < 1000) {
    return `${distance}米`
  } else {
    return `${(distance / 1000).toFixed(1)}公里`
  }
} */

// 获取类型标签
const getTypeLabel = (type) => {
  const typeLabels = {
    'culture': '文化古迹',
    'modern': '现代建筑',
    'architecture': '建筑艺术',
    'nature': '自然景观',
    'religion': '宗教建筑',
    'plan': '行程点'
  }
  return typeLabels[type] || type
}

// 切换选择模式
const toggleSelectMode = async () => {
  if (!mapReady.value) {
    message.info('地图正在加载中，请稍后...')
    return
  }

  isSelectMode.value = !isSelectMode.value

  if (mapRef.value) {
    if (isSelectMode.value) {
      // 启动选择模式
      await mapRef.value.startSelectionMode()
    } else {
      // 停止选择模式
      await mapRef.value.stopSelectionMode()
    }
  }
}

// 处理标记选择事件
const handleMarkerSelected = (selectionData) => {
  console.log('标记选择:', selectionData)
  message.success(`已添加标记到位置: ${selectionData.position[0].toFixed(4)}, ${selectionData.position[1].toFixed(4)}`)
  
  // 可以在这里添加对新标记的处理逻辑
  // 例如：添加到行程列表、保存到本地存储等
}

// 清除选中标记
// 清除选中标记（保留但暂时注释，以备后续使用）
/* const clearSelectedMarkers = async () => {
  if (mapRef.value && isSelectMode.value) {
    await mapRef.value.clearSelection()
  }
}

// 获取选中标记（保留但暂时注释，以备后续使用）
const getSelectedMarkers = () => {
  if (mapRef.value) {
    return mapRef.value.getSelectedMarkers()
  }
  return []
} */

// 筛选相关方法
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const updateMarkers = () => {
  console.log('更新标记数据，原始景点数量:', filteredLandmarks.value.length)
  
  // 直接传递原始landmark对象，确保position字段被正确传递
  markers.value = filteredLandmarks.value.map(landmark => {
    const markerData = { ...landmark }
    
    // 确保position字段存在且格式正确
    if (!markerData.position || !Array.isArray(markerData.position) || markerData.position.length !== 2) {
      console.warn('无效的坐标数据:', landmark.name, markerData.position)
    }
    
    return markerData
  })
  
  console.log('更新后的标记数量:', markers.value.length)
}

const applyFilters = () => {
  updateMarkers()
  showFilters.value = false
  message.success(`已筛选出 ${filteredLandmarks.value.length} 个景点`)
}

// 城市搜索处理
const handleCitySearch = () => {
  // 实时更新筛选结果
  updateMarkers()
}

const resetFilters = () => {
  searchCity.value = ''
  selectedType.value = 'all'
  selectedCountry.value = 'all'
  updateMarkers()
  message.success('筛选条件已重置')
}

const getFilterDescription = () => {
  const descriptions = []
  
  if (currentCity.value !== 'all') {
    descriptions.push(`城市: ${currentCity.value}`)
  }
  
  if (selectedType.value !== 'all') {
    descriptions.push(`类型: ${getTypeLabel(selectedType.value)}`)
  }
  
  if (selectedCountry.value !== 'all') {
    descriptions.push(`国家: ${selectedCountry.value}`)
  }
  
  return descriptions.length > 0 ? descriptions.join(', ') : '无筛选条件'
}

// 初始化示例数据
onMounted(() => {
  // 检查是否有行程路线参数
  if (route.query.locations) {
    // 加载行程路线功能暂时简化
    const locationList = route.query.locations.split('|').filter(loc => loc.trim())
    if (locationList.length > 0) {
      planLocations.value = locationList
      isPlanRoute.value = true
      planTitle.value = route.query.planTitle || '行程路线'
      
      // 为行程地点创建标记点
      markers.value = locationList.map((location, index) => ({
        id: `plan-${index}`,
        name: `${index + 1}. ${location}`,
        type: 'plan',
        description: '行程地点'
      }))
      
      message.success(`已加载行程路线，包含 ${locationList.length} 个地点`)
    }
  } else {
    // 使用新的景点数据
    updateMarkers()
    message.success(`已加载 ${filteredLandmarks.value.length} 个全球著名景点`)
  }
})
</script>

<style scoped>
.map-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 固定导航栏样式 */
:deep(.ant-page-header) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #f0f0f0;
}

.map-content {
  flex: 1;
  position: relative;
  margin-top: 80px; /* 为固定导航栏留出空间 */
  height: calc(100vh - 80px); /* 减去导航栏高度 */
}

.place-details {
  padding: 16px 0;
}

.place-actions {
  margin-top: 16px;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.filter-panel {
  padding: 16px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .map-content {
    margin-top: 100px; /* 移动端导航栏可能更高 */
    height: calc(100vh - 100px);
  }
}
</style>