<template>
  <div class="amap-container">
    <div class="map-controls">
      <a-space>
        <a-button-group>
          <a-button 
            :type="mapType === 'amap' ? 'primary' : 'default'"
            @click="changeMapType('amap')"
          >
            标准地图
          </a-button>
          <a-button 
            :type="mapType === 'satellite' ? 'primary' : 'default'"
            @click="changeMapType('satellite')"
          >
            卫星地图
          </a-button>
        </a-button-group>
        
        <a-button-group>
          <a-button @click="zoomIn">
            <template #icon><plus-outlined /></template>
          </a-button>
          <a-button @click="zoomOut">
            <template #icon><minus-outlined /></template>
          </a-button>
        </a-button-group>
        
        <a-button @click="locateMe" :loading="locating">
          <template #icon><environment-outlined /></template>
          定位
        </a-button>
        
        <a-button @click="clearMarkers">
          <template #icon><clear-outlined /></template>
          清除标记
        </a-button>
      </a-space>
    </div>
    
    <div 
      ref="mapContainer" 
      class="map"
      :style="{ height: mapHeight + 'px' }"
    ></div>
    
    <!-- 搜索框 -->
    <div class="search-box" v-if="showSearch">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索地点..."
        @search="handleSearch"
        size="large"
      >
        <template #enterButton>
          <a-button type="primary">
            <search-outlined />
          </a-button>
        </template>
      </a-input-search>
      
      <!-- 搜索结果 -->
      <div class="search-results" v-if="searchResults.length > 0">
        <a-list
          :data-source="searchResults"
          size="small"
          :bordered="false"
        >
          <template #renderItem="{ item }">
            <a-list-item 
              @click="selectPlace(item)"
              class="search-result-item"
            >
              <a-list-item-meta>
                <template #title>
                  <div>{{ item.name }}</div>
                </template>
                <template #description>
                  <div>{{ item.address }}</div>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>
    
    <!-- 路径规划面板 -->
    <div class="route-panel" v-if="showRoutePanel">
      <a-card title="路径规划" size="small">
        <template #extra>
          <a-button type="text" size="small" @click="closeRoutePanel">
            <close-outlined />
          </a-button>
        </template>
        
        <a-space direction="vertical" style="width: 100%">
          <a-input 
            v-model:value="routeOrigin" 
            placeholder="起点" 
            size="small"
          />
          <a-input 
            v-model:value="routeDestination" 
            placeholder="终点" 
            size="small"
          />
          
          <a-select 
            v-model:value="routeType" 
            size="small" 
            style="width: 100%"
          >
            <a-select-option value="driving">驾车</a-select-option>
            <a-select-option value="transit">公交</a-select-option>
            <a-select-option value="walking">步行</a-select-option>
          </a-select>
          
          <a-button 
            type="primary" 
            size="small" 
            @click="calculateRoute"
            :loading="calculatingRoute"
            block
          >
            规划路线
          </a-button>
          
          <div v-if="routeInfo" class="route-info">
            <p><strong>距离:</strong> {{ formatDistance(routeInfo.distance) }}</p>
            <p><strong>时间:</strong> {{ formatDuration(routeInfo.duration) }}</p>
            <p v-if="routeInfo.tolls"><strong>收费:</strong> ¥{{ routeInfo.tolls }}</p>
          </div>
        </a-space>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { 
  SearchOutlined, 
  PlusOutlined, 
  MinusOutlined, 
  EnvironmentOutlined,
  ClearOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import amapService from '../services/amapService'

const props = defineProps({
  // 地图高度
  mapHeight: {
    type: Number,
    default: 400
  },
  // 是否显示搜索框
  showSearch: {
    type: Boolean,
    default: true
  },
  // 是否显示路径规划面板
  showRoutePanel: {
    type: Boolean,
    default: true
  },
  // 初始中心点
  center: {
    type: Array,
    default: () => [116.397428, 39.90923] // 北京
  },
  // 初始缩放级别
  zoom: {
    type: Number,
    default: 11
  },
  // 标记点
  markers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['marker-click', 'map-click', 'place-select'])

// 地图相关变量
const mapContainer = ref(null)
const map = ref(null)
const mapType = ref('amap')
const locating = ref(false)

// 搜索相关
const searchKeyword = ref('')
const searchResults = ref([])

// 路径规划相关
const routeOrigin = ref('')
const routeDestination = ref('')
const routeType = ref('driving')
const calculatingRoute = ref(false)
const routeInfo = ref(null)

// 标记点集合
let markers = []
let polylines = []
let AMap = null

// 初始化地图
// 暴露给外部调用的方法
// 暴露给外部调用的方法
const initMap = async () => {
  try {
    // 加载高德地图脚本
    AMap = await amapService.loadMapScript()
    
    // 创建地图实例
    map.value = new AMap.Map(mapContainer.value, {
      zoom: props.zoom,
      center: props.center,
      mapStyle: 'amap://styles/normal',
      viewMode: '3D'
    })
    
    // 添加地图控件
    map.value.addControl(new AMap.ToolBar({
      position: 'LT'
    }))
    
    map.value.addControl(new AMap.Scale({
      position: 'LB'
    }))
    
    map.value.addControl(new AMap.HawkEye({
      position: 'RB'
    }))
    
    // 添加地图点击事件
    map.value.on('click', (e) => {
      emit('map-click', {
        lng: e.lnglat.lng,
        lat: e.lnglat.lat
      })
    })
    
    // 添加标记点
    addMarkers(props.markers)
    
    message.success('地图加载成功')
  } catch (error) {
    console.error('地图初始化失败:', error)
    message.error('地图加载失败，请检查网络连接和高德地图API配置')
  }
}

// 添加标记点
const addMarkers = (markerData) => {
  if (!map.value || !AMap) return
  
  // 清除现有标记
  clearMarkers()
  
  markerData.forEach((item, index) => {
    const marker = new AMap.Marker({
      position: item.position || [item.lng, item.lat],
      title: item.title,
      content: createMarkerContent(item, index),
      offset: new AMap.Pixel(-13, -30)
    })
    
    marker.on('click', () => {
      emit('marker-click', item)
    })
    
    map.value.add(marker)
    markers.push(marker)
  })
}

// 创建标记点内容
const createMarkerContent = (item, index) => {
  return `
    <div class="custom-marker">
      <div class="marker-index">${index + 1}</div>
      <div class="marker-title">${item.title}</div>
    </div>
  `
}

// 清除标记点
const clearMarkers = () => {
  if (map.value && markers.length > 0) {
    markers.forEach(marker => {
      map.value.remove(marker)
    })
    markers = []
  }
  
  // 清除路径
  if (polylines.length > 0) {
    polylines.forEach(polyline => {
      map.value.remove(polyline)
    })
    polylines = []
  }
  
  routeInfo.value = null
}

// 地图类型切换
const changeMapType = (type) => {
  mapType.value = type
  if (map.value) {
    map.value.setMapStyle(`amap://styles/${type}`)
  }
}

// 缩放控制
const zoomIn = () => {
  if (map.value) {
    map.value.zoomIn()
  }
}

const zoomOut = () => {
  if (map.value) {
    map.value.zoomOut()
  }
}

// 定位到当前位置
const locateMe = async () => {
  locating.value = true
  try {
    const location = await amapService.getIPLocation()
    if (location && location.rectangle) {
      const bounds = location.rectangle.split(';').map(coord => {
        const [lng, lat] = coord.split(',').map(Number)
        return [lng, lat]
      })
      
      if (map.value) {
        map.value.setBounds(bounds)
        message.success(`定位到 ${location.city}`)
      }
    }
  } catch (error) {
    console.error('定位失败:', error)
    message.error('定位失败')
  } finally {
    locating.value = false
  }
}

// 地点搜索
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return
  
  try {
    const results = await amapService.searchPlaces(searchKeyword.value)
    searchResults.value = results.slice(0, 10)
  } catch (error) {
    console.error('搜索失败:', error)
    message.error('搜索失败')
  }
}

// 选择地点
const selectPlace = (place) => {
  if (map.value && place.location) {
    const [lng, lat] = place.location.split(',').map(Number)
    map.value.setCenter([lng, lat])
    
    // 添加标记
    const marker = {
      title: place.name,
      position: [lng, lat],
      address: place.address
    }
    
    addMarkers([marker])
    emit('place-select', place)
    
    searchResults.value = []
    searchKeyword.value = ''
  }
}

// 路径规划
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
      
      // 在地图上绘制路径（需要实现路径绘制逻辑）
      drawRoute(result)
    } else {
      message.error('路径规划失败')
    }
  } catch (error) {
    console.error('路径规划失败:', error)
    message.error('路径规划失败')
  } finally {
    calculatingRoute.value = false
  }
}

// 绘制路径
const drawRoute = (routeData) => {
  if (!map.value || !AMap) return
  
  // 清除现有路径
  if (polylines.length > 0) {
    polylines.forEach(polyline => {
      map.value.remove(polyline)
    })
    polylines = []
  }
  
  // 根据路线类型绘制路径
  if (routeData.steps && routeData.steps.length > 0) {
    // 处理驾车/步行路径
    routeData.steps.forEach(step => {
      const path = step.polyline.split(';').map(point => {
        const [lng, lat] = point.split(',').map(Number)
        return [lng, lat]
      })
      
      const polyline = new AMap.Polyline({
        path: path,
        strokeColor: routeType.value === 'driving' ? '#1890ff' : 
                    routeType.value === 'transit' ? '#52c41a' : '#722ed1',
        strokeWeight: 6,
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      })
      
      map.value.add(polyline)
      polylines.push(polyline)
    })
  } else if (routeData.segments && routeData.segments.length > 0) {
    // 处理公交路径
    routeData.segments.forEach(segment => {
      if (segment.walking) {
        // 步行段
        segment.walking.steps.forEach(step => {
          const path = step.polyline.split(';').map(point => {
            const [lng, lat] = point.split(',').map(Number)
            return [lng, lat]
          })
          
          const polyline = new AMap.Polyline({
            path: path,
            strokeColor: '#722ed1',
            strokeWeight: 4,
            strokeOpacity: 0.8,
            strokeStyle: 'dashed'
          })
          
          map.value.add(polyline)
          polylines.push(polyline)
        })
      }
      
      if (segment.bus && segment.bus.buslines) {
        // 公交段
        segment.bus.buslines.forEach(busline => {
          const path = busline.polyline.split(';').map(point => {
            const [lng, lat] = point.split(',').map(Number)
            return [lng, lat]
          })
          
          const polyline = new AMap.Polyline({
            path: path,
            strokeColor: '#52c41a',
            strokeWeight: 6,
            strokeOpacity: 0.8
          })
          
          map.value.add(polyline)
          polylines.push(polyline)
        })
      }
    })
  }
  
  // 调整地图视图以显示完整路径
  if (polylines.length > 0) {
    map.value.setFitView(polylines)
  }
}

// 关闭路径规划面板
const closeRoutePanel = () => {
  showRoutePanel.value = false
  clearMarkers()
}

// 格式化距离
const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${distance}米`
  } else {
    return `${(distance / 1000).toFixed(1)}公里`
  }
}

// 格式化时间
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

// 监听标记点变化
watch(() => props.markers, (newMarkers) => {
  addMarkers(newMarkers)
})

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  if (map.value) {
    map.value.destroy()
  }
})

// 暴露方法给父组件
defineExpose({
  initMap
})
</script>

<style scoped>
.amap-container {
  position: relative;
  width: 100%;
}

.map-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map {
  width: 100%;
  border-radius: 8px;
}

.search-box {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  width: 300px;
}

.search-results {
  background: white;
  border-radius: 4px;
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  cursor: pointer;
  padding: 8px 12px;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.route-panel {
  position: absolute;
  top: 120px;
  left: 16px;
  z-index: 1000;
  width: 250px;
}

.route-info {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.route-info p {
  margin: 4px 0;
  font-size: 12px;
}

/* 自定义标记点样式 */
:deep(.custom-marker) {
  position: relative;
  text-align: center;
}

:deep(.marker-index) {
  background: #1890ff;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  line-height: 24px;
  font-size: 12px;
  font-weight: bold;
  margin: 0 auto;
}

:deep(.marker-title) {
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>