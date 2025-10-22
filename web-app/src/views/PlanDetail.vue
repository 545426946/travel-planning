<template>
  <div class="plan-detail">
    <!-- 头部信息 -->
    <div class="plan-header">
      <a-button type="link" @click="$router.back()" class="back-btn">
        <template #icon><ArrowLeftOutlined /></template>
        返回
      </a-button>
      
      <div class="header-content">
        <h1>{{ plan.title }}</h1>
        <p class="plan-description">{{ plan.description }}</p>
        
        <div class="plan-meta">
          <a-space :size="24">
            <span><CalendarOutlined /> {{ plan.days }}天行程</span>
            <span><DollarOutlined /> 预算: ¥{{ plan.budget }}</span>
            <span><UserOutlined /> {{ plan.travelers }}人</span>
            <span><EnvironmentOutlined /> {{ plan.destination }}</span>
            <a-tag :color="getStatusColor(plan.status)">{{ getStatusText(plan.status) }}</a-tag>
          </a-space>
        </div>
        
        <div class="header-actions">
          <a-space>
            <a-button type="primary" @click="showEditModal = true">
              <template #icon><EditOutlined /></template>
              编辑行程
            </a-button>
            <a-button @click="exportPlan">
              <template #icon><ExportOutlined /></template>
              导出
            </a-button>
            <a-popconfirm
              title="确定要删除这个行程吗？"
              @confirm="deletePlan"
            >
              <a-button danger>
                <template #icon><DeleteOutlined /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 行程安排 -->
    <div class="itinerary-section">
      <h2>行程安排</h2>
      
      <!-- AI生成的详细行程 -->
      <div v-if="plan.is_ai_generated && plan.activities && plan.activities.length > 0" class="ai-itinerary">
        <a-alert 
          message="AI智能规划行程" 
          description="以下是根据您的需求智能生成的详细行程安排，具体到时间段和实际地点"
          type="info"
          show-icon
          class="ai-alert"
        />
        
        <a-tabs v-model:activeKey="activeDay" type="card">
          <a-tab-pane v-for="day in getUniqueDays()" :key="day" :tab="`第${day}天`">
            <div class="day-itinerary">
              <a-timeline>
                <a-timeline-item v-for="activity in getDayActivities(day)" :key="activity.id">
                  <template #dot>
                    <div class="time-dot" :class="getTimeSlotClass(activity.time_slot)">
                      {{ getTimeSlotText(activity.time_slot) }}
                    </div>
                  </template>
                  
                  <a-card class="activity-card">
                    <div class="activity-header">
                      <h3>{{ activity.activity_title }}</h3>
                      <div class="activity-time">
                        <span v-if="activity.start_time">{{ formatTime(activity.start_time) }}</span>
                        <span v-if="activity.end_time">{{ activity.start_time ? ' - ' : '' }}{{ formatTime(activity.end_time) }}</span>
                        <span v-if="activity.duration_minutes"> ({{ activity.duration_minutes }}分钟)</span>
                      </div>
                    </div>
                    
                    <div class="activity-content">
                      <p>{{ activity.activity_description }}</p>
                      
                      <div class="activity-meta">
                        <a-space>
                          <span v-if="activity.location"><EnvironmentOutlined /> {{ activity.location }}</span>
                          <span v-if="activity.estimated_cost"><DollarOutlined /> ¥{{ activity.estimated_cost }}</span>
                        </a-space>
                      </div>
                    </div>
                  </a-card>
                </a-timeline-item>
              </a-timeline>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
      
      <!-- 手动创建的行程 -->
      <div v-else class="manual-itinerary">
        <a-tabs v-model:activeKey="activeDay" type="card">
          <a-tab-pane v-for="day in plan.days" :key="day" :tab="`第${day}天`">
            <div class="day-itinerary">
              <a-timeline>
                <a-timeline-item v-for="activity in getDayActivities(day)" :key="activity.id">
                  <template #dot>
                    <div class="time-dot" :class="getTimeSlotClass(activity.time_slot)">
                      {{ getTimeSlotText(activity.time_slot) }}
                    </div>
                  </template>
                  
                  <a-card class="activity-card">
                    <div class="activity-header">
                      <h3>{{ activity.activity_title }}</h3>
                      <div class="activity-time">
                        <span v-if="activity.start_time">{{ formatTime(activity.start_time) }}</span>
                        <span v-if="activity.end_time"> - {{ formatTime(activity.end_time) }}</span>
                        <span v-if="activity.duration_minutes"> ({{ activity.duration_minutes }}分钟)</span>
                      </div>
                    </div>
                    
                    <div class="activity-content">
                      <p>{{ activity.activity_description }}</p>
                      
                      <div class="activity-meta">
                        <a-space>
                          <span v-if="activity.location"><EnvironmentOutlined /> {{ activity.location }}</span>
                          <span v-if="activity.estimated_cost"><DollarOutlined /> ¥{{ activity.estimated_cost }}</span>
                        </a-space>
                      </div>
                    </div>
                  </a-card>
                </a-timeline-item>
              </a-timeline>
              
              <div v-if="getDayActivities(day).length === 0" class="no-activities">
                <a-empty description="暂无活动安排">
                  <a-button type="primary" @click="addActivity(day)">添加活动</a-button>
                </a-empty>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>

    <!-- 编辑行程模态框 -->
    <a-modal
      v-model:open="showEditModal"
      title="编辑行程"
      width="800px"
      :confirm-loading="editing"
      @ok="handleEditPlan"
      @cancel="handleCancelEdit"
    >
      <a-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="行程标题" name="title">
              <a-input v-model:value="editForm.title" placeholder="请输入行程标题" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-select v-model:value="editForm.status" placeholder="请选择状态">
                <a-select-option value="planning">规划中</a-select-option>
                <a-select-option value="in_progress">进行中</a-select-option>
                <a-select-option value="completed">已完成</a-select-option>
                <a-select-option value="cancelled">已取消</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="行程描述" name="description">
          <a-textarea 
            v-model:value="editForm.description" 
            placeholder="请输入行程描述"
            :rows="3"
          />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="行程天数" name="days">
              <a-input-number 
                v-model:value="editForm.days" 
                :min="1" 
                :max="30"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="出行人数" name="travelers">
              <a-input-number 
                v-model:value="editForm.travelers" 
                :min="1" 
                :max="10"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="预算（元）" name="budget">
              <a-input-number 
                v-model:value="editForm.budget" 
                :min="0" 
                :max="100000"
                style="width: 100%"
                :formatter="value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="目的地" name="destination">
          <a-select v-model:value="editForm.destination" placeholder="请选择目的地">
            <a-select-option value="北京">北京</a-select-option>
            <a-select-option value="上海">上海</a-select-option>
            <a-select-option value="杭州">杭州</a-select-option>
            <a-select-option value="成都">成都</a-select-option>
            <a-select-option value="广州">广州</a-select-option>
            <a-select-option value="深圳">深圳</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  EditOutlined,
  ExportOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import supabaseService from '../services/supabaseService'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const editing = ref(false)
const showEditModal = ref(false)
const activeDay = ref(1)
const editFormRef = ref()

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

const editForm = ref({})

const editRules = {
  title: [{ required: true, message: '请输入行程标题', trigger: 'blur' }],
  days: [{ required: true, message: '请输入行程天数', trigger: 'blur' }],
  budget: [{ required: true, message: '请输入预算', trigger: 'blur' }]
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    planning: 'blue',
    in_progress: 'orange',
    completed: 'green',
    cancelled: 'red'
  }
  return colors[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    planning: '规划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || '未知'
}

// 获取时间段文本
const getTimeSlotText = (timeSlot) => {
  const texts = {
    morning: '上午',
    afternoon: '下午',
    evening: '晚上',
    night: '深夜'
  }
  return texts[timeSlot] || timeSlot
}

// 获取时间段样式类
const getTimeSlotClass = (timeSlot) => {
  return `time-slot-${timeSlot}`
}

// 获取某天的活动
const getDayActivities = (day) => {
  if (!plan.value.activities) return []
  return plan.value.activities.filter(activity => activity.day_number === day)
}

// 获取唯一的日期列表
const getUniqueDays = () => {
  if (!plan.value.activities) return Array.from({length: plan.value.days}, (_, i) => i + 1)
  
  const days = [...new Set(plan.value.activities.map(activity => activity.day_number))]
  return days.sort((a, b) => a - b)
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.substring(0, 5) // 只显示小时和分钟
}

// 添加活动
const addActivity = (day) => {
  message.info(`添加第${day}天的活动`)
  // 这里可以打开活动编辑模态框
}

// 导出行程
const exportPlan = () => {
  const planData = {
    title: plan.value.title,
    description: plan.value.description,
    days: plan.value.days,
    budget: plan.value.budget,
    travelers: plan.value.travelers,
    destination: plan.value.destination,
    activities: plan.value.activities
  }
  
  const blob = new Blob([JSON.stringify(planData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${plan.value.title}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  message.success('行程已导出')
}

// 编辑行程
const handleEditPlan = async () => {
  try {
    await editFormRef.value.validate()
    editing.value = true
    
    const result = await supabaseService.updatePlan(plan.value.id, editForm.value)
    if (result.success) {
      Object.assign(plan.value, result.data)
      message.success('行程更新成功')
      showEditModal.value = false
    } else {
      message.error('更新失败：' + result.error)
    }
  } catch (error) {
    console.error('编辑行程失败:', error)
    message.error('编辑失败，请重试')
  } finally {
    editing.value = false
  }
}

// 取消编辑
const handleCancelEdit = () => {
  showEditModal.value = false
  resetEditForm()
}

// 重置编辑表单
const resetEditForm = () => {
  editForm.value = { ...plan.value }
}

// 删除行程
const deletePlan = async () => {
  try {
    const result = await supabaseService.deletePlan(plan.value.id)
    if (result.success) {
      message.success('行程已删除')
      router.push('/plans')
    } else {
      message.error('删除失败：' + result.error)
    }
  } catch (error) {
    console.error('删除行程失败:', error)
    message.error('删除失败，请重试')
  }
}

// 加载行程详情
const loadPlanDetail = async () => {
  loading.value = true
  try {
    const result = await supabaseService.getPlanDetail(route.params.id)
    if (result.success) {
      plan.value = result.data
      resetEditForm()
    } else {
      message.error('加载行程详情失败：' + result.error)
      router.push('/plans')
    }
  } catch (error) {
    console.error('加载行程详情失败:', error)
    message.error('加载失败，请重试')
    router.push('/plans')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.params.id) {
    loadPlanDetail()
  } else {
    message.error('行程ID不存在')
    router.push('/plans')
  }
})
</script>

<style scoped>
.plan-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 80px);
}

.plan-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  position: relative;
}

.back-btn {
  color: white !important;
  margin-bottom: 20px;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: white;
}

.plan-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.plan-meta {
  margin-bottom: 20px;
}

.plan-meta .ant-space {
  font-size: 1rem;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.itinerary-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.itinerary-section h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1f2937;
}

.day-itinerary {
  padding: 20px 0;
}

.time-dot {
  width: 80px;
  height: 30px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.time-slot-morning {
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
}

.time-slot-afternoon {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.time-slot-evening {
  background: linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%);
}

.time-slot-night {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 100%);
}

.activity-card {
  margin: 10px 0;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.activity-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}

.activity-time {
  color: #6b7280;
  font-size: 0.9rem;
}

.activity-content p {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 12px;
}

.activity-meta {
  color: #6b7280;
  font-size: 0.9rem;
}

.no-activities {
  text-align: center;
  padding: 60px 0;
}

:deep(.ant-tabs-tab) {
  font-weight: 500;
}

:deep(.ant-timeline-item-content) {
  margin-left: 100px;
}

:deep(.ant-timeline-item-tail) {
  left: 40px;
}

:deep(.ant-timeline-item-head) {
  left: 40px;
}

@media (max-width: 768px) {
  .plan-detail {
    padding: 16px;
  }
  
  .plan-header {
    padding: 20px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .activity-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  :deep(.ant-timeline-item-content) {
    margin-left: 60px;
  }
  
  :deep(.ant-timeline-item-tail) {
    left: 30px;
  }
  
  :deep(.ant-timeline-item-head) {
    left: 30px;
  }
}
</style>