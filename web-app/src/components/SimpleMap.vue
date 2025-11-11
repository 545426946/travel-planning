<template>
  <div class="map-container">
    <!-- 地图状态提示 -->
    <div v-if="!mapLoaded" class="map-status">
      <div class="loading-container">
        <a-spin size="large" />
        <p style="margin-top: 16px; color: #666;">正在加载地图...</p>
      </div>
    </div>
    
    <!-- 地图容器 -->
    <div ref="mapContainer" class="map" :class="{ 'map-loaded': mapLoaded }"></div>
    
    <!-- 地图状态信息 -->
    <div v-if="mapLoaded && mapStatus" class="map-info">
      <a-alert
        :message="mapStatus.message"
        type="success"
        show-icon
        :closable="false"
        style="margin-bottom: 10px;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import MapService from '../services/mapService.js'
import { message } from 'ant-design-vue'

// Props
const props = defineProps({
  center: {
    type: Array,
    default: () => [116.397128, 39.916527] // 北京默认中心
  },
  zoom: {
    type: Number,
    default: 10
  },
  landmarks: {
    type: Array,
    default: () => []
  },
  showControls: {
    type: Boolean,
    default: true
  },
  selectMode: {
    type: Boolean,
    default: false
  },
  selectionOptions: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits([
  'map-ready',
  'map-click',
  'marker-click',
  'marker-selected',
  'selection-start',
  'selection-stop'
])

// 响应式数据
const mapContainer = ref(null)
const mapInstance = ref(null)
const mapLoaded = ref(false)
const mapStatus = ref(null)
const markers = ref([])

// 地图初始化
const initMap = async () => {
  try {
    if (!mapContainer.value) return

    // 加载地图脚本
    await MapService.loadMapScript()
    
    // 创建地图实例
    mapInstance.value = await MapService.createMap(mapContainer.value, {
      center: props.center,
      zoom: props.zoom
    })

    // 添加地图控件
    if (props.showControls) {
      await MapService.addControls(mapInstance.value)
    }

    // 添加景点标记
    if (props.landmarks && props.landmarks.length > 0) {
      await addLandmarkMarkers()
    } else {
      console.log('没有景点数据可显示')
    }

    // 绑定地图事件
    bindMapEvents()

    // 更新状态
    mapStatus.value = MapService.getMapStatus()
    mapLoaded.value = true

    // 发送事件
    emit('map-ready', mapInstance.value)

    message.success('地图加载成功！使用高德地图服务')

  } catch (error) {
    console.error('地图初始化失败:', error)
    message.error('地图加载失败，请检查网络连接')
  }
}

// 添加景点标记
const addLandmarkMarkers = async () => {
  try {
    if (!mapInstance.value || !props.landmarks) return

    console.log('开始添加景点标记，数据量:', props.landmarks.length)
    
    // 清除现有标记
    await MapService.clearMarkers(mapInstance.value, markers.value)
    markers.value = []

    // 过滤有效标记数据 - 适配高德地图的position数组格式
    const validLandmarks = props.landmarks.filter(landmark => {
      const isValid = landmark.position && Array.isArray(landmark.position) && landmark.position.length === 2
      if (!isValid) {
        console.warn('无效的景点数据:', landmark)
      }
      return isValid
    })
    
    console.log('有效景点数据量:', validLandmarks.length)
    
    // 添加新标记
    const markerData = validLandmarks.map(landmark => ({
      position: landmark.position,
      title: landmark.name,
      popupContent: `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #1890ff;">${landmark.icon || '📍'} ${landmark.name}</h4>
          <p style="margin: 0 0 8px 0; color: #666;">${landmark.description || '著名旅游景点'}</p>
          <div style="font-size: 12px; color: #999;">
            <div>城市: ${landmark.city || '未知'}</div>
            <div>国家: ${landmark.country || '未知'}</div>
            <div>类型: ${landmark.type || '景点'}</div>
          </div>
        </div>
      `
    }))

    markers.value = await MapService.addMarkers(mapInstance.value, markerData)
    console.log('成功添加标记数量:', markers.value.length)

    // 适应所有标记的视图
    if (markers.value.length > 0) {
      await MapService.fitBounds(mapInstance.value, markers.value)
      console.log('地图视图已适应标记')
    }

    // 绑定标记点击事件
    markers.value.forEach((marker, index) => {
      marker.on('click', () => {
        emit('marker-click', props.landmarks[index])
      })
    })

  } catch (error) {
    console.error('添加景点标记失败:', error)
  }
}

// 绑定地图事件
const bindMapEvents = () => {
  if (!mapInstance.value) return

  // 地图点击事件
  if (mapInstance.value.on) {
    mapInstance.value.on('click', (e) => {
      emit('map-click', {
        lat: e.lnglat.lat,
        lng: e.lnglat.lng
      })
    })
  }
}

// 设置地图中心
const setCenter = async (center) => {
  if (mapInstance.value) {
    await MapService.setCenter(mapInstance.value, center)
  }
}

// 设置缩放级别
const setZoom = async (zoom) => {
  if (mapInstance.value) {
    await MapService.setZoom(mapInstance.value, zoom)
  }
}

// 销毁地图
const destroyMap = () => {
  if (mapInstance.value) {
    MapService.destroyMap(mapInstance.value)
    mapInstance.value = null
    mapLoaded.value = false
  }
}

// 重新初始化地图
const reinitMap = async () => {
  destroyMap()
  await nextTick()
  await initMap()
}

// 启动选择模式
const startSelectionMode = async () => {
  try {
    const options = {
      ...props.selectionOptions,
      onSelect: (selectionData) => {
        emit('marker-selected', selectionData)
      }
    }
    
    await MapService.startSelectionMode(mapInstance.value, options)
    emit('selection-start')
    message.info('标记选择模式已启动，点击地图添加标记')
  } catch (error) {
    console.error('启动选择模式失败:', error)
    message.error('启动选择模式失败')
  }
}

// 停止选择模式
const stopSelectionMode = async () => {
  try {
    await MapService.stopSelectionMode(mapInstance.value)
    emit('selection-stop')
    message.info('标记选择模式已停止')
  } catch (error) {
    console.error('停止选择模式失败:', error)
    message.error('停止选择模式失败')
  }
}

// 清除选中标记
const clearSelection = async () => {
  try {
    await MapService.clearSelection(mapInstance.value)
    message.success('已清除所有选中标记')
  } catch (error) {
    console.error('清除标记失败:', error)
    message.error('清除标记失败')
  }
}

// 获取选中标记
const getSelectedMarkers = () => {
  return MapService.getSelectedMarkers()
}

// 添加路线标记
const addRouteMarkers = async (routePoints, options = {}) => {
  try {
    return await MapService.addRouteMarkers(mapInstance.value, routePoints, options)
  } catch (error) {
    console.error('添加路线标记失败:', error)
    throw error
  }
}

// 监听 props 变化
watch(() => props.landmarks, (newLandmarks, oldLandmarks) => {
  if (mapInstance.value && newLandmarks !== oldLandmarks) {
    addLandmarkMarkers()
  }
})

watch(() => props.center, (newCenter) => {
  if (mapInstance.value && newCenter) {
    setCenter(newCenter)
  }
})

watch(() => props.zoom, (newZoom) => {
  if (mapInstance.value && newZoom) {
    setZoom(newZoom)
  }
})

watch(() => props.selectMode, async (newSelectMode, oldSelectMode) => {
  if (mapInstance.value && mapLoaded.value) {
    if (newSelectMode && !oldSelectMode) {
      // 启动选择模式
      await startSelectionMode()
    } else if (!newSelectMode && oldSelectMode) {
      // 停止选择模式
      await stopSelectionMode()
    }
  }
})

// 生命周期
onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  destroyMap()
})

// 暴露方法给父组件
defineExpose({
  initMap,
  destroyMap,
  reinitMap,
  setCenter,
  setZoom,
  startSelectionMode,
  stopSelectionMode,
  clearSelection,
  getSelectedMarkers,
  addRouteMarkers
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.map {
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.map.map-loaded {
  opacity: 1;
}

.map-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 999;
}

.map-info {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 1000;
}

.loading-container {
  text-align: center;
}
</style>