// 高德地图服务 - 使用高德地图API（需要API密钥）
import AMapLoader from '@amap/amap-jsapi-loader'

class MapService {
  constructor() {
    this.mapType = 'amap'
    this.isLoaded = false
    this.mapInstance = null
    this.selectedMarkers = [] // 存储选中的标记
    this.isSelectMode = false // 标记选择模式
    this.clickHandlers = [] // 地图点击事件处理器
    this.AMap = null // 高德地图实例
  }

  // 加载高德地图脚本
  async loadMapScript() {
    if (this.isLoaded && this.AMap) {
      return this.AMap
    }

    try {
      this.AMap = await AMapLoader.load({
        key: import.meta.env.VITE_AMAP_API_KEY || '57fe7237013ec222d99303e390757ecc',
        version: '2.0',
        plugins: [
          'AMap.Geolocation',
          'AMap.Scale',
          'AMap.ToolBar',
          'AMap.MapType',
          'AMap.Polyline',
          'AMap.Marker'
        ]
      })
      
      this.isLoaded = true
      console.log('🗺️ 高德地图加载成功')
      return this.AMap
      
    } catch (error) {
      console.error('高德地图加载失败:', error)
      throw new Error('无法加载高德地图服务，请检查网络连接和API密钥配置')
    }
  }

  // 创建地图实例
  async createMap(container, options = {}) {
    try {
      const AMap = await this.loadMapScript()
      
      // 设置默认选项
      const defaultOptions = {
        center: options.center || [116.397428, 39.90923], // 北京中心
        zoom: options.zoom || 10,
        viewMode: '3D',
        mapStyle: 'amap://styles/normal'
      }

      const mapOptions = { ...defaultOptions, ...options }
      
      // 创建地图
      this.mapInstance = new AMap.Map(container, mapOptions)
      
      console.log('🗺️ 高德地图创建成功')
      return this.mapInstance
      
    } catch (error) {
      console.error('创建高德地图失败:', error)
      throw error
    }
  }

  // 添加标记点
  async addMarker(map, position, options = {}) {
    const AMap = await this.loadMapScript()
    
    // 检查position格式 - 高德地图使用[经度, 纬度]
    if (!position || !Array.isArray(position) || position.length !== 2) {
      console.error('无效的坐标格式:', position)
      return null
    }
    
    const defaultOptions = {
      position: new AMap.LngLat(position[0], position[1]), // 高德地图使用[经度, 纬度]
      title: options.title || '景点标记',
      offset: new AMap.Pixel(-15, -15)
    }

    const markerOptions = { ...defaultOptions, ...options }
    
    // 创建自定义图标
    if (options.iconColor || options.iconText) {
      markerOptions.icon = new AMap.Icon({
        size: new AMap.Size(30, 30),
        image: this.createCustomIcon(options.iconColor || '#1890ff', options.iconText || '📍'),
        imageSize: new AMap.Size(30, 30)
      })
    } else {
      // 默认标记
      markerOptions.icon = new AMap.Icon({
        size: new AMap.Size(36, 36),
        image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
        imageSize: new AMap.Size(36, 36)
      })
    }
    
    const marker = new AMap.Marker(markerOptions)
    map.add(marker)
    
    // 如果有弹窗内容，添加信息窗口
    if (options.popupContent) {
      const infoWindow = new AMap.InfoWindow({
        content: options.popupContent,
        offset: new AMap.Pixel(0, -30)
      })
      
      marker.on('click', () => {
        infoWindow.open(map, marker.getPosition())
      })
    }
    
    return marker
  }

  // 创建自定义图标
  createCustomIcon(color, text) {
    const canvas = document.createElement('canvas')
    canvas.width = 30
    canvas.height = 30
    const ctx = canvas.getContext('2d')
    
    // 绘制圆形背景
    ctx.beginPath()
    ctx.arc(15, 15, 12, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    
    // 绘制白色边框
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 绘制文字
    ctx.fillStyle = 'white'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 15, 15)
    
    return canvas.toDataURL()
  }

  // 添加多个标记
  async addMarkers(map, markersData) {
    const AMap = await this.loadMapScript()
    const markers = []
    
    for (const data of markersData) {
      const marker = await this.addMarker(map, data.position, {
        title: data.title,
        popupContent: data.popupContent || `<strong>${data.title}</strong><br>${data.description || ''}`
      })
      markers.push(marker)
    }
    
    return markers
  }

  // 设置地图中心
  async setCenter(map, center) {
    if (map && map.setCenter && center && Array.isArray(center) && center.length === 2) {
      // 高德地图setCenter方法直接接受[lng, lat]数组
      map.setCenter(center)
    }
  }

  // 设置缩放级别
  async setZoom(map, zoom) {
    if (map && map.setZoom) {
      map.setZoom(zoom)
    }
  }

  // 获取地图边界
  async getBounds(map) {
    if (map && map.getBounds) {
      return map.getBounds()
    }
    return null
  }

  // 适应所有标记的视图
  async fitBounds(map, markers) {
    if (map && map.setFitView && markers.length > 0) {
      // 高德地图的setFitView可以直接传入标记数组
      map.setFitView(markers)
    }
  }

  // 清除所有标记
  async clearMarkers(map, markers) {
    if (map && markers) {
      markers.forEach(marker => {
        if (marker && marker.remove) {
          marker.remove()
        }
      })
    }
  }

  // 添加控制层（缩放控件等）
  async addControls(map) {
    const AMap = await this.loadMapScript()
    
    try {
      // 添加缩放控件
      map.addControl(new AMap.ToolBar({
        position: 'LT'
      }))
      
      // 添加比例尺
      map.addControl(new AMap.Scale({
        position: 'LB'
      }))
      
      // 添加地图类型切换
      map.addControl(new AMap.MapType({
        defaultType: 0
      }))
      
      console.log('🗺️ 高德地图控件添加成功')
    } catch (error) {
      console.warn('添加高德地图控件时遇到问题，但地图仍可正常使用:', error)
    }
  }

  // 开始标记选择模式
  async startSelectionMode(map, options = {}) {
    const AMap = await this.loadMapScript()
    
    this.isSelectMode = true
    
    // 清除之前的选择
    this.clearSelection(map)
    
    // 设置光标样式
    if (map && map.getContainer) {
      map.getContainer().style.cursor = 'crosshair'
    }
    
    // 绑定地图点击事件
    const clickHandler = (e) => {
      if (this.isSelectMode) {
        this.handleMapClickForSelection(map, e, options)
      }
    }
    
    if (map && map.on) {
      map.on('click', clickHandler)
      this.clickHandlers.push(clickHandler)
    }
    
    console.log('🗺️ 标记选择模式已启动')
    return this.isSelectMode
  }

  // 停止标记选择模式
  async stopSelectionMode(map) {
    this.isSelectMode = false
    
    // 恢复光标样式
    if (map && map.getContainer) {
      map.getContainer().style.cursor = ''
    }
    
    // 移除事件处理器
    if (map && this.clickHandlers.length > 0) {
      this.clickHandlers.forEach(handler => {
        if (map.off) {
          map.off('click', handler)
        }
      })
      this.clickHandlers = []
    }
    
    console.log('🗺️ 标记选择模式已停止')
    return this.isSelectMode
  }

  // 处理地图点击以选择位置
  async handleMapClickForSelection(map, e, options = {}) {
    const AMap = await this.loadMapScript()
    
    // 高德地图事件返回的坐标是[lng, lat]格式，直接使用即可
    const position = [e.lnglat.lng, e.lnglat.lat]
    
    // 添加选择标记
    const marker = await this.addSelectionMarker(map, position, options)
    
    // 触发选择事件
    if (options.onSelect) {
      options.onSelect({
        position: position,
        marker: marker,
        lnglat: e.lnglat,
        timestamp: new Date().toISOString()
      })
    }
    
    return marker
  }

  // 添加选择标记
  async addSelectionMarker(map, position, options = {}) {
    const AMap = await this.loadMapScript()
    
    const markerOptions = {
      title: options.title || '选择的位置',
      iconColor: options.iconColor || '#52c41a',
      iconText: options.iconText || '✓',
      draggable: options.draggable || false,
      popupContent: options.popupContent || `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #1890ff;">${options.title || '选择的位置'}</h4>
          <p style="margin: 0 0 8px 0; color: #666;">点击地图添加的位置</p>
          <div style="font-size: 12px; color: #999;">
            <div>纬度: ${position[0].toFixed(6)}</div>
            <div>经度: ${position[1].toFixed(6)}</div>
          </div>
        </div>
      `
    }
    
    const marker = await this.addMarker(map, position, markerOptions)
    
    // 添加到选中标记列表
    this.selectedMarkers.push({
      marker: marker,
      position: position,
      timestamp: new Date().toISOString(),
      data: options.data || {}
    })
    
    // 绑定标记点击事件
    marker.on('click', () => {
      if (options.onMarkerClick) {
        options.onMarkerClick(marker, position)
      }
    })
    
    // 如果可拖动，绑定拖动事件
    if (markerOptions.draggable) {
      marker.on('dragend', (e) => {
        const newPos = [e.target.getPosition().lat, e.target.getPosition().lng]
        if (options.onMarkerDrag) {
          options.onMarkerDrag(marker, newPos)
        }
      })
    }
    
    return marker
  }

  // 清除所有选中的标记
  async clearSelection(map) {
    if (this.selectedMarkers.length > 0) {
      this.selectedMarkers.forEach(item => {
        if (item.marker && item.marker.remove) {
          item.marker.remove()
        }
      })
      this.selectedMarkers = []
    }
    
    console.log('🗺️ 已清除所有选中标记')
  }

  // 删除指定标记
  async removeMarker(marker) {
    if (marker && marker.remove) {
      marker.remove()
      
      // 从选中标记列表中移除
      this.selectedMarkers = this.selectedMarkers.filter(item => item.marker !== marker)
      
      console.log('🗺️ 标记已删除')
      return true
    }
    return false
  }

  // 获取所有选中的标记
  getSelectedMarkers() {
    return this.selectedMarkers.map(item => ({
      position: item.position,
      timestamp: item.timestamp,
      data: item.data,
      marker: item.marker
    }))
  }

  // 添加标记组（用于批量操作）
  async addMarkerGroup(map, markersData, groupOptions = {}) {
    const AMap = await this.loadMapScript()
    const groupMarkers = []
    
    for (const data of markersData) {
      const marker = await this.addSelectionMarker(map, data.position, {
        ...data.options,
        title: data.title || `标记点 ${groupMarkers.length + 1}`,
        iconColor: data.iconColor || groupOptions.defaultColor || '#1890ff',
        iconText: data.iconText || groupOptions.defaultIcon || `${groupMarkers.length + 1}`,
        draggable: data.draggable || groupOptions.draggable || false
      })
      groupMarkers.push(marker)
    }
    
    // 高德地图不直接支持标记组，返回标记数组
    return {
      markers: groupMarkers,
      group: groupMarkers,
      bounds: null // 高德地图需要单独计算边界
    }
  }

  // 适应标记组视图
  async fitMarkerGroup(map, markerGroup) {
    if (map && map.setFitView && markerGroup && markerGroup.length > 0) {
      const AMap = await this.loadMapScript()
      const positions = markerGroup.map(marker => {
        const pos = marker.getPosition()
        return [pos.lng, pos.lat]
      })
      map.setFitView(positions)
    }
  }

  // 添加路线标记
  async addRouteMarkers(map, routePoints, options = {}) {
    const AMap = await this.loadMapScript()
    const routeMarkers = []
    
    // 添加起点标记
    if (routePoints.length > 0) {
      const startMarker = await this.addSelectionMarker(map, routePoints[0], {
        title: options.startTitle || '起点',
        iconColor: '#52c41a',
        iconText: '🚩',
        popupContent: `
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #52c41a;">${options.startTitle || '起点'}</h4>
            <p style="margin: 0 0 8px 0; color: #666;">行程起点位置</p>
          </div>
        `
      })
      routeMarkers.push(startMarker)
    }
    
    // 添加终点标记
    if (routePoints.length > 1) {
      const endMarker = await this.addSelectionMarker(map, routePoints[routePoints.length - 1], {
        title: options.endTitle || '终点',
        iconColor: '#ff4d4f',
        iconText: '🏁',
        popupContent: `
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #ff4d4f;">${options.endTitle || '终点'}</h4>
            <p style="margin: 0 0 8px 0; color: #666;">行程终点位置</p>
          </div>
        `
      })
      routeMarkers.push(endMarker)
    }
    
    // 添加途经点标记
    for (let i = 1; i < routePoints.length - 1; i++) {
      const waypointMarker = await this.addSelectionMarker(map, routePoints[i], {
        title: `${options.waypointTitle || '途经点'} ${i}`,
        iconColor: '#faad14',
        iconText: `${i}`,
        popupContent: `
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #faad14;">${options.waypointTitle || '途经点'} ${i}</h4>
            <p style="margin: 0 0 8px 0; color: #666;">行程途经位置</p>
          </div>
        `
      })
      routeMarkers.push(waypointMarker)
    }
    
    return routeMarkers
  }

  // 地理编码（使用高德地图地理编码服务）
  async geocode(address, city = '全国') {
    try {
      const AMap = await this.loadMapScript()
      
      return new Promise((resolve, reject) => {
        AMap.plugin('AMap.Geocoder', () => {
          const geocoder = new AMap.Geocoder({
            city: city
          })
          
          geocoder.getLocation(address, (status, result) => {
            if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
              const geocode = result.geocodes[0]
              resolve({
                lat: geocode.location.lat,
                lng: geocode.location.lng,
                displayName: geocode.formattedAddress,
                type: geocode.level,
                address: geocode.formattedAddress
              })
            } else {
              // 使用备选方案：返回空结果，让调用方处理
              resolve(null)
            }
          })
        })
      })
      
    } catch (error) {
      console.error('地理编码失败:', error)
      return null
    }
  }

  // 批量地理编码
  async batchGeocode(addresses, city = '全国') {
    try {
      const results = []
      
      for (const address of addresses) {
        const result = await this.geocode(address, city)
        results.push({
          address: address,
          geocode: result
        })
      }
      
      return results
    } catch (error) {
      console.error('批量地理编码失败:', error)
      return addresses.map(address => ({
        address: address,
        geocode: null
      }))
    }
  }

  // 添加路线绘制功能
  async addRoutePolyline(map, routePoints, options = {}) {
    try {
      const AMap = await this.loadMapScript()
      
      if (!routePoints || routePoints.length < 2) {
        console.warn('路线点数量不足，无法绘制路线')
        return null
      }
      
      // 转换坐标格式
      const polylinePath = routePoints.map(point => {
        if (Array.isArray(point) && point.length === 2) {
          return new AMap.LngLat(point[0], point[1])
        }
        return new AMap.LngLat(116.397428, 39.90923) // 默认北京中心
      })
      
      // 创建折线
      const polyline = new AMap.Polyline({
        path: polylinePath,
        strokeColor: options.strokeColor || '#1890ff',
        strokeOpacity: options.strokeOpacity || 0.8,
        strokeWeight: options.strokeWeight || 6,
        strokeStyle: options.strokeStyle || 'solid',
        lineJoin: options.lineJoin || 'round',
        lineCap: options.lineCap || 'round'
      })
      
      // 添加折线到地图
      map.add(polyline)
      
      // 适应折线视图
      map.setFitView([polyline])
      
      return polyline
    } catch (error) {
      console.error('绘制路线失败:', error)
      return null
    }
  }

  // 完整的路线规划功能（包含标记和路线）
  async createRoutePlan(map, locations, options = {}) {
    try {
      // 批量地理编码
      const geocodeResults = await this.batchGeocode(locations, options.city || '全国')
      
      // 过滤有效的地理编码结果
      const validGeocodes = geocodeResults
        .filter(result => result.geocode !== null)
        .map(result => result.geocode)
      
      if (validGeocodes.length === 0) {
        console.warn('没有有效的地理编码结果，无法创建路线')
        return null
      }
      
      // 提取坐标点
      const routePoints = validGeocodes.map(geocode => [geocode.lng, geocode.lat])
      
      // 添加路线标记
      const routeMarkers = await this.addRouteMarkers(map, routePoints, options)
      
      // 绘制路线
      const polyline = await this.addRoutePolyline(map, routePoints, options)
      
      return {
        markers: routeMarkers,
        polyline: polyline,
        geocodes: validGeocodes,
        points: routePoints
      }
    } catch (error) {
      console.error('创建路线计划失败:', error)
      return null
    }
  }

  // 计算两点间距离（使用高德地图距离计算）
  async calculateDistance(lat1, lng1, lat2, lng2) {
    try {
      const AMap = await this.loadMapScript()
      
      return new Promise((resolve, reject) => {
        AMap.plugin('AMap.Driving', () => {
          const driving = new AMap.Driving({
            policy: AMap.DrivingPolicy.LEAST_TIME
          })
          
          driving.search(
            new AMap.LngLat(lng1, lat1),
            new AMap.LngLat(lng2, lat2),
            (status, result) => {
              if (status === 'complete' && result.routes.length > 0) {
                const distance = result.routes[0].distance
                resolve(distance) // 返回距离（米）
              } else {
                // 如果路径规划失败，使用Haversine公式估算
                const R = 6371e3 // 地球半径（米）
                const φ1 = lat1 * Math.PI / 180
                const φ2 = lat2 * Math.PI / 180
                const Δφ = (lat2 - lat1) * Math.PI / 180
                const Δλ = (lng2 - lng1) * Math.PI / 180

                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                          Math.cos(φ1) * Math.cos(φ2) *
                          Math.sin(Δλ/2) * Math.sin(Δλ/2)
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

                resolve(R * c)
              }
            }
          )
        })
      })
      
    } catch (error) {
      console.error('距离计算失败:', error)
      // 使用Haversine公式作为备选方案
      const R = 6371e3 // 地球半径（米）
      const φ1 = lat1 * Math.PI / 180
      const φ2 = lat2 * Math.PI / 180
      const Δφ = (lat2 - lat1) * Math.PI / 180
      const Δλ = (lng2 - lng1) * Math.PI / 180

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

      return R * c
    }
  }

  // 获取地图状态信息
  getMapStatus() {
    return {
      type: this.mapType,
      status: this.isSelectMode ? '选择模式' : '正常模式',
      message: '使用高德地图服务',
      isLoaded: this.isLoaded,
      hasInstance: !!this.mapInstance,
      selectedMarkers: this.selectedMarkers.length,
      isSelectMode: this.isSelectMode
    }
  }

  // 销毁地图
  destroyMap() {
    if (this.mapInstance) {
      this.mapInstance.destroy()
      this.mapInstance = null
    }
  }
}

// 导出单例实例
export default new MapService()