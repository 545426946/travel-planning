<template>
  <div class="map-page">
    <a-page-header
      :title="pageTitle"
      :sub-title="pageSubtitle"
      @back="$router.back"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" @click="showRoutePanel = true">
            <template #icon><EnvironmentOutlined /></template>
            路线规划
          </a-button>
          <a-button @click="refreshMap">
            <template #icon><reload-outlined /></template>
            刷新地图
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
      <AmapMap
        ref="amapRef"
        :map-height="600"
        :show-search="true"
        :show-route-panel="showRoutePanel"
        :markers="markers"
        @marker-click="handleMarkerClick"
        @map-click="handleMapClick"
        @place-select="handlePlaceSelect"
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
            <a-descriptions-item label="地址">{{ selectedPlace.address }}</a-descriptions-item>
            <a-descriptions-item label="类型">{{ selectedPlace.type }}</a-descriptions-item>
            <a-descriptions-item label="电话" v-if="selectedPlace.tel">{{ selectedPlace.tel }}</a-descriptions-item>
            <a-descriptions-item label="距离" v-if="selectedPlace.distance">
              {{ formatDistance(selectedPlace.distance) }}
            </a-descriptions-item>
          </a-descriptions>

          <div class="place-actions">
            <a-space>
              <a-button type="primary" @click="addToRoute(selectedPlace)">
                <template #icon><plus-outlined /></template>
                添加到路线
              </a-button>
              <a-button @click="setAsOrigin(selectedPlace)">
                <template #icon><environment-outlined /></template>
                设为起点
              </a-button>
              <a-button @click="setAsDestination(selectedPlace)">
                <template #icon><flag-outlined /></template>
                设为终点
              </a-button>
            </a-space>
          </div>
        </div>
      </a-drawer>

      <!-- 路线规划面板 -->
      <a-drawer
        title="路线规划"
        :width="450"
        :open="showRoutePanel"
        :mask-closable="true"
        :closable="true"
        @close="showRoutePanel = false"
      >
        <div class="route-planning">
          <a-form layout="vertical">
            <a-form-item label="起点">
              <a-input
                v-model:value="routeOrigin"
                placeholder="请输入起点地址"
                :suffix="originMarker ? '✅' : null"
              />
            </a-form-item>
            
            <a-form-item label="终点">
              <a-input
                v-model:value="routeDestination"
                placeholder="请输入终点地址"
                :suffix="destinationMarker ? '✅' : null"
              />
            </a-form-item>
            
            <a-form-item label="出行方式">
              <a-select v-model:value="routeType" style="width: 100%">
                <a-select-option value="driving">驾车</a-select-option>
                <a-select-option value="transit">公交</a-select-option>
                <a-select-option value="walking">步行</a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item>
              <a-button 
                type="primary" 
                :loading="calculatingRoute" 
                @click="calculateRoute"
                block
              >
                开始规划
              </a-button>
            </a-form-item>
          </a-form>

          <!-- 路线结果 -->
          <div v-if="routeInfo" class="route-info">
            <a-card title="路线信息" size="small">
              <a-descriptions size="small" column={1}>
                <a-descriptions-item label="距离">
                  {{ formatDistance(routeInfo.distance) }}
                </a-descriptions-item>
                <a-descriptions-item label="预计时间">
                  {{ formatDuration(routeInfo.duration) }}
                </a-descriptions-item>
                <a-descriptions-item label="收费" v-if="routeInfo.tolls">
                  ¥{{ routeInfo.tolls }}
                </a-descriptions-item>
                <a-descriptions-item label="费用" v-if="routeInfo.cost">
                  ¥{{ routeInfo.cost }}
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </div>

          <!-- 路线点管理 -->
          <div class="route-points">
            <a-card title="路线点" size="small">
              <a-list
                :data-source="routePoints"
                size="small"
                :bordered="false"
              >
                <template #renderItem="{ item, index }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title>
                        <div>{{ item.name || `点 ${index + 1}` }}</div>
                      </template>
                      <template #description>
                        <div>{{ item.address }}</div>
                      </template>
                    </a-list-item-meta>
                    
                    <template #actions>
                      <a-space>
                        <a-button size="small" type="text" @click="removeRoutePoint(index)">
                          <delete-outlined />
                        </a-button>
                      </a-space>
                    </template>
                  </a-list-item>
                </template>
              </a-list>
              
              <a-button 
                type="dashed" 
                size="small" 
                @click="clearRoutePoints"
                block
                style="margin-top: 8px"
              >
                清空路线点
              </a-button>
            </a-card>
          </div>
        </div>
      </a-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import AmapMap from '../components/AmapMap.vue'
import amapService from '../services/amapService'
import { 
  ReloadOutlined, 
  PlusOutlined, 
  EnvironmentOutlined,
  FlagOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

// 路由引用
const route = useRoute()

// 地图引用
const amapRef = ref(null)

// 状态管理
const selectedPlace = ref(null)
const showRoutePanel = ref(false)
const routeOrigin = ref('')
const routeDestination = ref('')
const routeType = ref('driving')
const calculatingRoute = ref(false)
const routeInfo = ref(null)
const routePoints = ref([])

// 行程路线相关状态
const planLocations = ref([])
const isPlanRoute = ref(false)
const planTitle = ref('')

// 计算属性
const pageTitle = computed(() => {
  return isPlanRoute.value ? planTitle.value : '旅行地图'
})

const pageSubtitle = computed(() => {
  return isPlanRoute.value ? '行程路线展示' : '查看旅行路线和地点'
})

// 标记点
const markers = ref([])
const originMarker = ref(null)
const destinationMarker = ref(null)

// 处理标记点点击
const handleMarkerClick = (place) => {
  selectedPlace.value = place
}

// 处理地图点击
const handleMapClick = (point) => {
  console.log('地图点击:', point)
  // 可以在这里添加点击地图添加标记点的功能
}

// 处理地点选择
const handlePlaceSelect = (place) => {
  selectedPlace.value = place
  message.success(`已选择: ${place.name}`)
}

// 关闭地点详情面板
const closePlaceDrawer = () => {
  selectedPlace.value = null
}

// 刷新地图
const refreshMap = () => {
  if (amapRef.value) {
    // 重新初始化地图
    amapRef.value.initMap()
  }
  message.success('地图已刷新')
}

// 格式化距离
const formatDistance = (distance) => {
  if (!distance) return '未知'
  if (distance < 1000) {
    return `${distance}米`
  } else {
    return `${(distance / 1000).toFixed(1)}公里`
  }
}

// 格式化时间
const formatDuration = (seconds) => {
  if (!seconds) return '未知'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

// 添加到路线
const addToRoute = (place) => {
  routePoints.value.push(place)
  message.success(`已将 ${place.name} 添加到路线`)
}

// 设为起点
const setAsOrigin = (place) => {
  routeOrigin.value = place.name
  originMarker.value = place
  message.success(`已将 ${place.name} 设为起点`)
}

// 设为终点
const setAsDestination = (place) => {
  routeDestination.value = place.name
  destinationMarker.value = place
  message.success(`已将 ${place.name} 设为终点`)
}

// 移除路线点
const removeRoutePoint = (index) => {
  routePoints.value.splice(index, 1)
  message.success('路线点已移除')
}

// 清空路线点
const clearRoutePoints = () => {
  routePoints.value = []
  message.success('路线点已清空')
}

// 清除行程路线
const clearPlanRoute = () => {
  planLocations.value = []
  isPlanRoute.value = false
  planTitle.value = ''
  markers.value = []
  message.success('行程路线已清除')
}

// 加载行程路线
const loadPlanRoute = async () => {
  const { locations, planTitle } = route.query
  
  if (!locations) return
  
  try {
    // 解析地点信息
    const locationList = locations.split('|').filter(loc => loc.trim())
    
    if (locationList.length === 0) {
      message.warning('没有找到有效的地点信息')
      return
    }
    
    // 设置行程信息
    planLocations.value = locationList
    isPlanRoute.value = true
    planTitle.value = planTitle || '行程路线'
    
    // 清空现有标记点
    markers.value = []
    
    // 为每个地点获取坐标并添加标记点
    for (let i = 0; i < locationList.length; i++) {
      const location = locationList[i]
      
      try {
        // 地理编码获取坐标
        const result = await amapService.geocode(location)
        
        if (result && result.length > 0) {
          const place = result[0]
          
          // 添加标记点
          markers.value.push({
            title: `${i + 1}. ${location}`,
            position: [place.location.lng, place.location.lat],
            address: place.formatted_address,
            type: 'plan',
            planIndex: i
          })
        }
      } catch (error) {
        console.error(`无法获取地点坐标: ${location}`, error)
        // 即使无法获取坐标，也保留地点信息
        markers.value.push({
          title: `${i + 1}. ${location}`,
          position: null,
          address: location,
          type: 'plan',
          planIndex: i
        })
      }
    }
    
    message.success(`已加载行程路线，包含 ${locationList.length} 个地点`)
    
  } catch (error) {
    console.error('加载行程路线失败:', error)
    message.error('加载行程路线失败')
  }
}

// 计算路线
const calculateRoute = async () => {
  if (!routeOrigin.value || !routeDestination.value) {
    message.warning('请输入起点和终点')
    return
  }

  calculatingRoute.value = true
  
  try {
    let result
    
    if (routeType.value === 'driving') {
      result = await amapService.routePlanning(routeOrigin.value, routeDestination.value)
    } else if (routeType.value === 'transit') {
      result = await amapService.transitRoutePlanning(routeOrigin.value, routeDestination.value)
    } else if (routeType.value === 'walking') {
      result = await amapService.walkingRoutePlanning(routeOrigin.value, routeDestination.value)
    }
    
    if (result) {
      routeInfo.value = result
      message.success('路线规划成功')
    } else {
      message.error('路线规划失败')
    }
  } catch (error) {
    console.error('路线规划失败:', error)
    message.error('路线规划失败')
  } finally {
    calculatingRoute.value = false
  }
}

// 初始化示例数据
onMounted(() => {
  // 检查是否有行程路线参数
  if (route.query.locations) {
    loadPlanRoute()
  } else {
    // 添加一些示例标记点
    markers.value = [
      {
        title: '天安门广场',
        position: [116.397428, 39.90923],
        address: '北京市东城区东长安街'
      },
      {
        title: '故宫博物院',
        position: [116.397056, 39.917974],
        address: '北京市东城区景山前街4号'
      },
      {
        title: '颐和园',
        position: [116.273174, 39.999872],
        address: '北京市海淀区新建宫门路19号'
      }
    ]
  }
})
</script>

<style scoped>
.map-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.map-content {
  flex: 1;
  position: relative;
}

.place-details {
  padding: 16px 0;
}

.place-actions {
  margin-top: 16px;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.route-planning {
  padding: 16px 0;
}

.route-info {
  margin-top: 16px;
}

.route-points {
  margin-top: 16px;
}
</style>