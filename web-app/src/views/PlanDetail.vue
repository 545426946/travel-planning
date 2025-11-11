<template>
  <div class="plan-detail">
    <!-- 返回按钮和调试控制 -->
    <div class="top-controls">
      <div class="back-button-container">
        <button @click="goBack" class="back-button">
          ← 返回行程列表
        </button>
      </div>
      <div class="action-buttons">
        <button @click="addNewActivity" class="edit-button">
          ➕ 添加活动
        </button>
        <button @click="openMapView" class="map-button">
          🗺️ 查看地图路线
        </button>
        <button @click="openAmapApp" class="amap-button">
          📍 高德地图导航
        </button>
        <button @click="toggleDebug" class="toggle-debug-button" title="切换调试模式">
          {{ showDebug ? '隐藏' : '显示' }}调试
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载行程信息...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchPlanDetail" class="retry-button">重试</button>
    </div>

    <!-- 行程内容 -->
    <template v-else>
      <!-- 行程基本信息 -->
      <div class="plan-header">
        <h1>{{ plan.title || '行程详情' }}</h1>
        <p class="plan-description">{{ plan.description || '暂无行程描述' }}</p>
        
        <!-- 行程元数据 -->
        <div class="plan-meta">
          <div class="meta-item">
            <span class="meta-label">行程天数：</span>
            <span class="meta-value">{{ plan.days }}天</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">出行人数：</span>
            <span class="meta-value">{{ plan.travelers }}人</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">预算：</span>
            <span class="meta-value">¥{{ formatCurrency(plan.budget) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">目的地：</span>
            <span class="meta-value">{{ plan.destination || '未指定' }}</span>
          </div>
        </div>
      </div>

    <!-- 活动列表 -->
    <div class="activities-section">
      <h2>行程安排</h2>
      
      <!-- 日期切换标签 -->
      <div class="day-tabs">
        <button
          v-for="day in displayDays"
          :key="day"
          :class="['day-tab', { active: activeDay === day }]"
          @click="switchDay(day)"
        >
          第{{ day }}天
        </button>
      </div>

      <!-- 当前日期活动列表 -->
      <div class="day-activities">
        <div v-if="currentDayActivities.length === 0" class="no-activities">
          <p>第{{ activeDay }}天暂无安排的活动</p>
        </div>
        <div v-else>
          <div
            v-for="activity in currentDayActivities"
          :key="activity.id || `${activity.day_number}-${activity.order_index}`"
          class="activity-card"
          @click="handleActivityClick(activity)"
          >
            <div class="activity-time-badge">
              {{ getTimeSlotText(activity.time_slot) }}
            </div>
            <div class="activity-image-container">
              <!-- 直接使用默认占位图，避免图片加载错误 -->
              <img 
                :src="getDefaultImage(activity)" 
                :alt="activity.activity_title" 
                class="activity-image"
              >
            </div>
            <div class="activity-content">
              <h3>{{ activity.activity_title }}</h3>
              <p class="activity-desc">{{ activity.activity_description || '暂无描述' }}</p>
              <div class="activity-info">
                <div class="info-item">
                  <span class="info-label">时间：</span>
                  <span>{{ formatTime(activity.start_time) }} - {{ formatTime(activity.end_time) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">地点：</span>
                  <span>{{ activity.location || '未指定' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">花费：</span>
                  <span>¥{{ formatCurrency(activity.estimated_cost || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingActivity ? '编辑活动' : '添加活动' }}</h3>
          <button @click="closeEditModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>活动标题：</label>
            <input v-model="editForm.activity_title" type="text" placeholder="请输入活动标题">
          </div>
          <div class="form-group">
            <label>活动描述：</label>
            <textarea v-model="editForm.activity_description" placeholder="请输入活动描述" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>日期：</label>
              <select v-model="editForm.day_number">
                <option v-for="day in displayDays" :key="day" :value="day">第{{ day }}天</option>
              </select>
            </div>
            <div class="form-group">
              <label>时间段：</label>
              <select v-model="editForm.time_slot">
                <option value="morning">上午</option>
                <option value="afternoon">下午</option>
                <option value="evening">晚上</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开始时间：</label>
              <input v-model="editForm.start_time" type="time">
            </div>
            <div class="form-group">
              <label>结束时间：</label>
              <input v-model="editForm.end_time" type="time">
            </div>
          </div>
          <div class="form-group">
            <label>地点：</label>
            <input v-model="editForm.location" type="text" placeholder="请输入活动地点">
          </div>
          <div class="form-group">
            <label>预估花费：</label>
            <input v-model="editForm.estimated_cost" type="number" placeholder="0">
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-cancel">取消</button>
          <button @click="saveActivity" class="btn-save">保存</button>
          <button v-if="editingActivity" @click="deleteActivity" class="btn-delete">删除</button>
        </div>
      </div>
    </div>

      <!-- 调试信息 -->
      <div class="debug-info" v-if="showDebug">
          <h3>调试信息</h3>
          <p>行程ID：{{ plan.id }}</p>
          <p>活动总数：{{ plan.activities.length }}</p>
          <p>当前显示第{{ activeDay }}天</p>
          <p>当前天数活动数：{{ currentDayActivities.length }}</p>
          <p>路由参数：{{ JSON.stringify(route.params) }}</p>
          <div class="debug-buttons">
            <button @click="toggleDebug" class="debug-toggle">隐藏调试</button>
          </div>
        </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import supabaseAuthService from '../services/supabaseAuthService'
import authService from '../services/authService'


const route = useRoute()
const router = useRouter()
const showDebug = ref(false) // 默认隐藏调试信息
const activeDay = ref(1)
const loading = ref(false)
const error = ref(null)

// 编辑相关状态
const showEditModal = ref(false)
const editingActivity = ref(null)
const editForm = ref({
  activity_title: '',
  activity_description: '',
  day_number: 1,
  time_slot: 'morning',
  start_time: '',
  end_time: '',
  location: '',
  estimated_cost: 0
})

// 行程数据（初始空结构）
const plan = ref({
  id: null,
  title: '',
  description: '',
  days: 0,
  budget: 0,
  travelers: 0,
  destination: '',
  status: 'planning',
  activities: []
})

// 计算属性
const displayDays = computed(() => {
  const days = []
  for (let i = 1; i <= plan.value.days; i++) {
    days.push(i)
  }
  return days
})

const currentDayActivities = computed(() => {
  // 确保activities数组存在且不为空
  if (!plan.value.activities || !Array.isArray(plan.value.activities)) {
    console.log('没有找到活动数据，plan.value.activities:', plan.value.activities)
    return []
  }
  
  // 过滤当前天数的活动并按顺序索引排序
  const filteredActivities = plan.value.activities
    .filter(activity => {
      // 确保activity存在且day_number有效
      if (!activity) return false
      const dayNum = parseInt(activity.day_number) || 1
      return dayNum === activeDay.value
    })
    .sort((a, b) => {
      const orderA = parseInt(a.order_index) || 0
      const orderB = parseInt(b.order_index) || 0
      return orderA - orderB
    })
  
  console.log(`第${activeDay.value}天的活动数量:`, filteredActivities.length)
  return filteredActivities
})

// 方法
const goBack = () => {
  router.back()
}

// 活动点击处理
const handleActivityClick = (activity) => {
  console.log('点击活动:', activity.activity_title)
  // 点击活动时打开编辑弹窗
  openEditModal(activity)
}

const switchDay = (day) => {
  activeDay.value = day
  console.log(`切换到第${day}天`)
}

const getTimeSlotText = (timeSlot) => {
  const slotMap = {
    morning: '上午',
    afternoon: '下午',
    evening: '晚上',
    night: '深夜'
  }
  return slotMap[timeSlot] || '未指定'
}

// 添加新活动
const addNewActivity = () => {
  console.log('添加新活动')
  openEditModal()
}

// 打开编辑弹窗
const openEditModal = (activity = null) => {
  editingActivity.value = activity
  
  if (activity) {
    // 编辑现有活动
    editForm.value = { 
      activity_title: activity.activity_title || '',
      activity_description: activity.activity_description || '',
      day_number: activity.day_number || 1,
      time_slot: activity.time_slot || 'morning',
      start_time: activity.start_time || '09:00',
      end_time: activity.end_time || '12:00',
      location: activity.location || '',
      estimated_cost: activity.estimated_cost || 0
    }
  } else {
    // 添加新活动
    editForm.value = {
      activity_title: '',
      activity_description: '',
      day_number: activeDay.value,
      time_slot: 'morning',
      start_time: '09:00',
      end_time: '12:00',
      location: '',
      estimated_cost: 0
    }
  }
  
  showEditModal.value = true
}

// 关闭编辑弹窗
const closeEditModal = () => {
  showEditModal.value = false
  editingActivity.value = null
  // 重置表单
  editForm.value = {
    activity_title: '',
    activity_description: '',
    day_number: 1,
    time_slot: 'morning',
    start_time: '09:00',
    end_time: '12:00',
    location: '',
    estimated_cost: 0
  }
}

// 保存活动
const saveActivity = async () => {
  try {
    // 表单验证
    if (!editForm.value.activity_title.trim()) {
      alert('请填写活动标题')
      return
    }
    
    if (!editForm.value.start_time || !editForm.value.end_time) {
      alert('请填写活动时间')
      return
    }
    
    // 显示等待提示
    const loadingMessage = message.loading('正在保存活动，请稍后...', 0)
    
    // 创建活动数据对象
    const activityData = {
      plan_id: plan.value.id,
      activity_title: editForm.value.activity_title.trim(),
      activity_description: editForm.value.activity_description.trim(),
      day_number: editForm.value.day_number,
      time_slot: editForm.value.time_slot,
      start_time: editForm.value.start_time,
      end_time: editForm.value.end_time,
      location: editForm.value.location.trim(),
      estimated_cost: Number(editForm.value.estimated_cost) || 0,
      order_index: 0 // 默认排序索引
    }
    
    // 确保行程ID存在
    if (!plan.value.id || plan.value.id === 'new') {
      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        loadingMessage()
        throw new Error('请先登录后再创建行程')
      }
      
      // 如果是新建行程，先保存行程基础信息到用户专属数据库
      const planResult = await supabaseAuthService.saveUserPlan({
        title: plan.value.title || '未命名行程',
        description: plan.value.description || '',
        days: plan.value.days || 1,
        budget: plan.value.budget || 0,
        travelers: plan.value.travelers || 1,
        destination: plan.value.destination || '',
        status: 'planning'
      })
      
      if (planResult.success) {
        plan.value.id = planResult.data.id
        activityData.plan_id = plan.value.id
        console.log('行程已创建，ID:', plan.value.id)
      } else {
        loadingMessage()
        throw new Error('创建行程失败: ' + (planResult.error || '未知错误'))
      }
    }
    
    // 直接使用用户专属数据库服务保存活动
    let result
    if (editingActivity.value && editingActivity.value.id) {
      // 更新现有活动
      activityData.id = editingActivity.value.id
      result = await supabaseAuthService.saveUserPlanActivities(plan.value.id, [activityData])
    } else {
      // 创建新活动
      result = await supabaseAuthService.saveUserPlanActivities(plan.value.id, [activityData])
    }
    
    if (result.success) {
      console.log('活动保存成功')
      // 重新加载行程数据以获取最新状态
      await fetchPlanDetail()
      
      // 如果添加了新活动且不在当前天，切换到对应天数
      if (!editingActivity.value && editForm.value.day_number !== activeDay.value) {
        activeDay.value = editForm.value.day_number
      }
      
      // 关闭等待提示并关闭弹窗
      loadingMessage()
      closeEditModal()
    } else {
      loadingMessage()
      throw new Error(result.error || '保存活动失败')
    }
    
  } catch (error) {
    console.error('保存活动失败:', error)
    // 关闭等待提示并显示错误消息
    message.destroy()
    alert('保存活动失败: ' + error.message)
    // 重新加载数据以确保显示正确状态
    await fetchPlanDetail()
  }
}

// 删除活动
const deleteActivity = async () => {
  if (!editingActivity.value || !editingActivity.value.id) return
  
  if (confirm('确定要删除这个活动吗？')) {
    try {
      // 显示等待提示
      const loadingMessage = message.loading('正在删除活动，请稍后...', 0)
      
      // 确保行程ID存在
      if (!plan.value.id || plan.value.id === 'new') {
        loadingMessage()
        throw new Error('无法删除未保存行程中的活动')
      }
      
      // 删除活动：先获取所有活动，过滤掉要删除的，然后重新保存
      const currentActivities = plan.value.activities || []
      const filteredActivities = currentActivities.filter(activity => activity.id !== editingActivity.value.id)
      
      // 重新保存过滤后的活动列表
      const result = await supabaseAuthService.saveUserPlanActivities(plan.value.id, filteredActivities)
      
      if (result.success) {
        console.log('活动删除成功')
        // 重新加载行程数据以确保显示最新信息
        await fetchPlanDetail()
        
        // 关闭等待提示并关闭弹窗
        loadingMessage()
        closeEditModal()
      } else {
        loadingMessage()
        throw new Error(result.error || '删除活动失败')
      }
      
    } catch (error) {
      console.error('删除活动失败:', error)
      // 关闭等待提示并显示错误消息
      message.destroy()
      alert('删除活动失败: ' + error.message)
      // 重新加载数据以恢复到正确状态
      await fetchPlanDetail()
    }
  }
}

const formatTime = (time) => {
  return time || '--:--'
}

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString('zh-CN')
}

// 获取默认图片
const getDefaultImage = (activity) => {
  // 根据活动类型或时间段返回不同颜色的占位图
  const colorMap = {
    morning: '%23e6f7ff', // 蓝色
    afternoon: '%23f6ffed', // 绿色
    evening: '%23fff7e6', // 橙色
    night: '%23f9f0ff' // 紫色
  };
  const bgColor = colorMap[activity.time_slot] || '%23f0f0f0';
  
  return `data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25" viewBox="0 0 800 400"%3e%3cdefs%3e%3cstyle type="text/css"%3e .shape %7b fill: ${bgColor}; %7d .text %7b font-family: Arial, sans-serif; font-size: 16px; fill: %23666; %7d %3c/style%3e%3c/defs%3e%3crect class="shape" width="800" height="400"/%3e%3ctext class="text" x="400" y="200" text-anchor="middle" dy=".3em"%3e${encodeURIComponent(getTimeSlotText(activity.time_slot))}活动%3c/text%3e%3c/svg%3e`;
}

const toggleDebug = () => {
  showDebug.value = !showDebug.value
}

// 获取行程详情
const fetchPlanDetail = async () => {
  loading.value = true
  error.value = null
  
  try {
    const { id } = route.params
    console.log('尝试获取行程ID:', id)
    
    // 验证UUID格式
    if (id && id !== 'new' && !supabaseAuthService.isValidUUID?.(id)) {
      throw new Error('无效的行程ID格式')
    }
    
    if (id && id !== 'new') {
      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        throw new Error('请先登录后再查看行程详情')
      }
      
      // 从用户专属数据库获取行程数据
      console.log(`尝试获取用户专属行程ID: ${id} 的详情`)
      const result = await supabaseAuthService.getUserPlanDetail(id)
      
      if (result.success && result.data) {
        console.log('成功从数据库获取行程:', result.data.title)
        // 确保activities字段存在且是数组
        const activities = Array.isArray(result.data.activities) ? result.data.activities : []
        
        plan.value = {
          ...result.data,
          activities: activities
        }
        activeDay.value = 1
        
        // 调试信息：显示获取到的活动数据
        console.log('获取到的行程数据:', {
          title: result.data.title,
          days: result.data.days,
          activitiesCount: activities.length,
          activities: activities.map(a => ({
            title: a.activity_title,
            day: a.day_number,
            timeSlot: a.time_slot
          }))
        })
      } else {
        // 数据库获取失败，提供更详细的错误信息
        console.error('获取用户行程详情失败:', result.error || '未知错误')
        
        // 如果是网络或连接问题，提供友好的错误提示
        if (result.error && result.error.includes('连接') || result.error.includes('网络')) {
          throw new Error('网络连接失败，请检查网络连接后重试')
        } else {
          throw new Error(result.error || '行程不存在或您没有权限访问')
        }
      }
    } else {
      // 新建行程页面，显示空行程状态
      console.log('显示空行程状态')
      plan.value = {
        id: 'new',
        title: '新建行程',
        description: '请创建您的旅行计划',
        days: 1,
        budget: 0,
        travelers: 1,
        destination: '',
        status: 'planning',
        activities: []
      }
      activeDay.value = 1
    }
  } catch (err) {
    console.error('获取行程详情失败:', err)
    error.value = err.message || '获取行程信息失败，请稍后重试'
    
    // 如果是网络问题，提供重试按钮
    if (err.message.includes('网络') || err.message.includes('连接')) {
      error.value += '。请检查网络连接后点击重试按钮。'
    }
  } finally {
    loading.value = false
  }
}

// 打开地图视图
const openMapView = () => {
  if (!plan.value.id || plan.value.id === 'new') {
    alert('请先保存行程，再查看地图路线')
    return
  }
  
  if (!plan.value.activities || plan.value.activities.length === 0) {
    alert('当前行程还没有添加活动，请先添加活动再查看地图路线')
    return
  }
  
  // 提取活动地点信息 - 使用真实的活动数据
  const locations = plan.value.activities
    .filter(activity => activity.location && activity.location.trim() !== '')
    .map(activity => activity.location)
    .filter((location, index, array) => array.indexOf(location) === index) // 去重
  
  if (locations.length === 0) {
    alert('当前行程中的活动没有指定地点，请先为活动添加地点信息')
    return
  }
  
  console.log('传递到地图页面的真实地点数据:', {
    行程名称: plan.value.title,
    总天数: plan.value.days,
    活动数量: plan.value.activities.length,
    有效地点数量: locations.length,
    地点列表: locations
  })
  
  // 跳转到地图页面，并传递真实行程路线信息
  router.push({
    path: '/map',
    query: {
      locations: locations.join('|'),
      planTitle: plan.value.title,
      planId: plan.value.id,
      isRealPlan: 'true' // 标记为真实行程
    }
  })
}

// 打开高德地图导航
const openAmapApp = () => {
  if (!plan.value.id || plan.value.id === 'new') {
    alert('请先保存行程，再使用导航功能')
    return
  }
  
  if (!plan.value.activities || plan.value.activities.length === 0) {
    alert('当前行程还没有添加活动，请先添加活动再使用导航功能')
    return
  }
  
  // 获取第一个活动地点作为导航起点
  const firstActivity = plan.value.activities.find(activity => activity.location && activity.location.trim() !== '')
  
  if (!firstActivity) {
    alert('当前行程中的活动没有指定地点，请先为活动添加地点信息')
    return
  }
  
  // 构建高德地图导航链接
  const destination = encodeURIComponent(firstActivity.location)
  const amapUrl = `https://uri.amap.com/navigation?destination=${destination}&callnative=1`
  
  // 打开高德地图App或网页版
  window.open(amapUrl, '_blank')
}

// 生命周期
onMounted(() => {
  console.log('行程详情页面加载成功')
  console.log('路由参数:', route.params)
  fetchPlanDetail()
})
</script>

<style scoped>
.plan-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 80px);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 返回按钮 */
.top-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.back-button-container {
  /* 由top-controls控制 */
}

.toggle-debug-button {
  padding: 6px 16px;
  background: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.toggle-debug-button:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
}

@media (max-width: 768px) {
  .top-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

.back-button {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  user-select: none;
}

.back-button:active {
  transform: translateY(1px);
}

.back-button:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

/* 行程头部信息 */
.plan-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
}

.plan-header h1 {
  font-size: 2.5rem;
  margin-bottom: 16px;
  color: white;
}

.plan-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 24px;
  line-height: 1.6;
}

.plan-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 16px;
  border-radius: 20px;
  font-size: 14px;
}

.meta-label {
  font-weight: 500;
  margin-right: 4px;
}

.meta-value {
  font-weight: 700;
}

/* 活动部分 */
.activities-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activities-section h2 {
  font-size: 1.8rem;
  margin-bottom: 24px;
  color: #1f2937;
}

/* 日期标签 */
.day-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  scroll-behavior: smooth;
}

.day-tabs::-webkit-scrollbar {
  height: 6px;
}

.day-tabs::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.day-tabs::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.day-tabs::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.day-tab {
  padding: 10px 20px;
  background: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  font-weight: 500;
  user-select: none;
}

.day-tab:active {
  transform: scale(0.95);
}

.day-tab:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.day-tab.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

/* 活动列表 */
.day-activities {
  position: relative;
}

.no-activities {
  text-align: center;
  padding: 60px 20px;
  color: #8c8c8c;
  font-size: 16px;
}

.activity-card {
  display: flex;
  margin-bottom: 24px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.5s ease-out;
  cursor: pointer;
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.activity-image-container {
  width: 150px;
  flex-shrink: 0;
  overflow: hidden;
  background: #f0f0f0;
}

.activity-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.activity-time-badge {
  width: 80px;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.activity-content {
  flex: 1;
  padding: 20px;
}

.activity-content h3 {
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: #1f2937;
}

.activity-desc {
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.6;
}

.activity-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.info-item {
  font-size: 14px;
  color: #4b5563;
}

.info-label {
  font-weight: 500;
  margin-right: 4px;
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-container {
  text-align: center;
  padding: 60px 20px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-message {
  color: #ff4d4f;
  margin-bottom: 20px;
  font-size: 16px;
}

.retry-button {
  padding: 8px 24px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-button:hover {
  background: #40a9ff;
}

/* 调试信息 */
.debug-info {
  margin-top: 30px;
  padding: 20px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
}

.debug-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.debug-action {
  padding: 6px 12px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.debug-action:hover {
  background: #73d13d;
}

.debug-info h3 {
  margin-bottom: 12px;
  color: #389e0d;
}

.debug-info p {
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 14px;
}

.debug-toggle {
  margin-top: 12px;
  padding: 6px 12px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.debug-toggle:hover {
  background: #73d13d;
}

/* 编辑弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.modal-close:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: #e6e6e6;
  border-color: #bfbfbf;
}

.btn-save {
  padding: 10px 20px;
  background: #1890ff;
  border: 1px solid #1890ff;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn-delete {
  padding: 10px 20px;
  background: #ff4d4f;
  border: 1px solid #ff4d4f;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-delete:hover {
  background: #ff7875;
  border-color: #ff7875;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plan-detail {
    padding: 16px;
  }
  
  .plan-header {
    padding: 20px;
  }
  
  .plan-header h1 {
    font-size: 2rem;
  }
  
  .plan-meta {
    flex-direction: column;
    gap: 12px;
  }
  
  .activities-section {
    padding: 20px;
  }
  
  .activity-card {
    flex-direction: column;
  }
  
  .activity-time-badge {
    width: 100%;
    padding: 8px 0;
  }
  
  .activity-image-container {
    width: 100%;
    height: 180px;
  }
  
  .day-tabs {
    -webkit-overflow-scrolling: touch;
  }
  
  .back-button {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-footer button {
    width: 100%;
  }
}
</style>