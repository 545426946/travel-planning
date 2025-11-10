// 高德地图服务
class AmapService {
  constructor() {
    this.apiKey = import.meta.env.VITE_AMAP_API_KEY
    this.apiUrl = import.meta.env.VITE_AMAP_API_URL
  }

  // 加载高德地图JS API
  loadMapScript() {
    return new Promise((resolve, reject) => {
      if (window.AMap) {
        resolve(window.AMap)
        return
      }

      // 检查API密钥是否有效
      if (!this.apiKey || this.apiKey === '9b2a0f8e3c5d7e9f1a3b5c7d9e1f3a5b7d9f1a3b' || this.apiKey === 'test-mode') {
        console.warn('高德地图API密钥无效或为测试模式，地图功能将受限')
        // 返回一个更完整的模拟AMap对象，允许应用继续运行
        const mockAMap = {
          Map: class MockMap {
            constructor(container, options) {
              console.log('模拟地图创建成功', container, options)
              this.container = container
              this.options = options
              // 添加容器样式
              if (container) {
                container.style.backgroundColor = '#f0f2f5'
                container.style.position = 'relative'
                container.style.minHeight = '400px'
                
                // 添加模拟地图内容
                const mapContent = document.createElement('div')
                mapContent.innerHTML = `
                  <div style="padding: 20px; text-align: center; color: #666;">
                    <h3>地图模拟模式</h3>
                    <p>当前为测试模式，地图功能受限</p>
                    <p>请配置真实的高德地图API密钥以使用完整功能</p>
                    <div style="margin-top: 20px;">
                      <button onclick="alert('请在.env文件中配置真实的高德地图API密钥')" style="padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        查看配置指南
                      </button>
                    </div>
                  </div>
                `
                container.appendChild(mapContent)
              }
            }
            addControl(control) {
              console.log('添加地图控件:', control)
              return this
            }
            on(event, callback) {
              console.log('地图事件监听:', event)
              return this
            }
            setMapStyle(style) {
              console.log('设置地图样式:', style)
              return this
            }
            setZoom(zoom) {
              console.log('设置缩放级别:', zoom)
              return this
            }
            setCenter(center) {
              console.log('设置中心点:', center)
              return this
            }
          },
          
          Marker: class MockMarker {
            constructor(options) {
              console.log('模拟标记创建成功', options)
            }
            setMap(map) {
              console.log('标记设置地图:', map)
              return this
            }
          },
          
          Polyline: class MockPolyline {
            constructor(options) {
              console.log('模拟路径创建成功', options)
            }
            setMap(map) {
              console.log('路径设置地图:', map)
              return this
            }
          },
          
          ToolBar: class MockToolBar {
            constructor(options) {
              console.log('工具栏控件创建成功', options)
              this.options = options
            }
          },
          
          Scale: class MockScale {
            constructor(options) {
              console.log('比例尺控件创建成功', options)
              this.options = options
            }
          },
          
          HawkEye: class MockHawkEye {
            constructor(options) {
              console.log('鹰眼控件创建成功', options)
              this.options = options
            }
          },
          
          // 添加可能需要的其他类
          Pixel: class MockPixel {
            constructor(x, y) {
              this.x = x
              this.y = y
            }
          },
          
          LngLat: class MockLngLat {
            constructor(lng, lat) {
              this.lng = lng
              this.lat = lat
            }
          }
        }
        
        // 延迟返回以模拟异步加载
        setTimeout(() => {
          window.AMap = mockAMap
          resolve(mockAMap)
        }, 500)
        return
      }

      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.apiKey}&plugin=AMap.Driving,AMap.Transfer,AMap.Walking,AMap.Riding,AMap.Geocoder,AMap.Autocomplete,AMap.PlaceSearch,AMap.MarkerClusterer`
      script.async = true
      script.onload = () => {
        if (window.AMap) {
          resolve(window.AMap)
        } else {
          reject(new Error('高德地图脚本加载失败'))
        }
      }
      script.onerror = (error) => {
        console.error('高德地图脚本加载错误:', error)
        reject(new Error('高德地图API配置错误，请检查网络连接和API密钥'))
      }
      
      document.head.appendChild(script)
    })
  }

  // 地理编码（地址转坐标）
  async geocode(address) {
    try {
      const response = await fetch(`${this.apiUrl}/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${this.apiKey}`)
      const data = await response.json()
      
      if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        return {
          location: data.geocodes[0].location,
          formattedAddress: data.geocodes[0].formatted_address,
          country: data.geocodes[0].country,
          province: data.geocodes[0].province,
          city: data.geocodes[0].city,
          district: data.geocodes[0].district
        }
      }
      return null
    } catch (error) {
      console.error('地理编码失败:', error)
      return null
    }
  }

  // 逆地理编码（坐标转地址）
  async reverseGeocode(lng, lat) {
    try {
      const response = await fetch(`${this.apiUrl}/v3/geocode/regeo?location=${lng},${lat}&key=${this.apiKey}&poitype=&radius=1000&extensions=all&batch=false&roadlevel=0`)
      const data = await response.json()
      
      if (data.status === '1' && data.regeocode) {
        return {
          formattedAddress: data.regeocode.formatted_address,
          addressComponent: data.regeocode.addressComponent,
          pois: data.regeocode.pois || []
        }
      }
      return null
    } catch (error) {
      console.error('逆地理编码失败:', error)
      return null
    }
  }

  // 路径规划
  async routePlanning(origin, destination, strategy = 0) {
    try {
      const response = await fetch(`${this.apiUrl}/v3/direction/driving?origin=${origin}&destination=${destination}&strategy=${strategy}&key=${this.apiKey}`)
      const data = await response.json()
      
      if (data.status === '1' && data.route) {
        return {
          distance: data.route.paths[0]?.distance, // 米
          duration: data.route.paths[0]?.duration, // 秒
          tolls: data.route.paths[0]?.tolls, // 收费
          steps: data.route.paths[0]?.steps || []
        }
      }
      return null
    } catch (error) {
      console.error('路径规划失败:', error)
      return null
    }
  }

  // 公交路径规划
  async transitRoutePlanning(origin, destination, city = '全国') {
    try {
      const response = await fetch(`${this.apiUrl}/v3/direction/transit/integrated?origin=${origin}&destination=${destination}&city=${encodeURIComponent(city)}&key=${this.apiKey}`)
      const data = await response.json()
      
      if (data.status === '1' && data.route) {
        return {
          distance: data.route.transits[0]?.distance,
          duration: data.route.transits[0]?.duration,
          cost: data.route.transits[0]?.cost,
          segments: data.route.transits[0]?.segments || []
        }
      }
      return null
    } catch (error) {
      console.error('公交路径规划失败:', error)
      return null
    }
  }

  // 步行路径规划
  async walkingRoutePlanning(origin, destination) {
    try {
      const response = await fetch(`${this.apiUrl}/v3/direction/walking?origin=${origin}&destination=${destination}&key=${this.apiKey}`)
      const data = await response.json()
      
      if (data.status === '1' && data.route) {
        return {
          distance: data.route.paths[0]?.distance,
          duration: data.route.paths[0]?.duration,
          steps: data.route.paths[0]?.steps || []
        }
      }
      return null
    } catch (error) {
      console.error('步行路径规划失败:', error)
      return null
    }
  }

  // 地点搜索
  async searchPlaces(keyword, city = '全国') {
    try {
      const response = await fetch(`${this.apiUrl}/v3/place/text?keywords=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}&key=${this.apiKey}`)
      const data = await response.json()
      
      if (data.status === '1' && data.pois) {
        return data.pois.map(poi => ({
          id: poi.id,
          name: poi.name,
          address: poi.address,
          location: poi.location,
          type: poi.type,
          tel: poi.tel,
          distance: poi.distance,
          businessArea: poi.business_area
        }))
      }
      return []
    } catch (error) {
      console.error('地点搜索失败:', error)
      return []
    }
  }

  // 周边搜索
  async searchAround(lng, lat, radius = 3000, types = '') {
    try {
      const response = await fetch(`${this.apiUrl}/v3/place/around?location=${lng},${lat}&radius=${radius}&types=${encodeURIComponent(types)}&key=${this.apiKey}`)
      const data = await response.json()
      
      if (data.status === '1' && data.pois) {
        return data.pois
      }
      return []
    } catch (error) {
      console.error('周边搜索失败:', error)
      return []
    }
  }

  // 计算多个点之间的距离矩阵
  async calculateDistanceMatrix(origins, destinations) {
    try {
      const response = await fetch(`${this.apiUrl}/v3/distance?origins=${origins.join('|')}&destinations=${destinations.join('|')}&key=${this.apiKey}`)
      const data = await response.json()
      
      if (data.status === '1' && data.results) {
        return data.results
      }
      return []
    } catch (error) {
      console.error('距离矩阵计算失败:', error)
      return []
    }
  }

  // 获取IP定位
  async getIPLocation() {
    try {
      const response = await fetch(`${this.apiUrl}/v3/ip?key=${this.apiKey}`)
      const data = await response.json()
      
      if (data.status === '1') {
        return {
          city: data.city,
          province: data.province,
          adcode: data.adcode,
          rectangle: data.rectangle
        }
      }
      return null
    } catch (error) {
      console.error('IP定位失败:', error)
      return null
    }
  }
}

// 创建单例实例
export default new AmapService()