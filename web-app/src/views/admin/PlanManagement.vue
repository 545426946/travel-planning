<template>
  <AdminLayout>
    <div class="plan-management">
      <div class="page-header">
        <h1>旅行计划管理</h1>
        <p>管理系统用户的旅行计划，包括查看、审核和统计</p>
      </div>

      <!-- 搜索和筛选 -->
      <a-card class="search-card">
        <a-form layout="inline" :model="searchForm" @finish="handleSearch">
          <a-form-item label="计划标题">
            <a-input
              v-model:value="searchForm.title"
              placeholder="输入计划标题"
              allow-clear
            />
          </a-form-item>
          
          <a-form-item label="目的地">
            <a-input
              v-model:value="searchForm.destination"
              placeholder="输入目的地"
              allow-clear
            />
          </a-form-item>
          
          <a-form-item label="状态">
            <a-select
              v-model:value="searchForm.status"
              placeholder="选择状态"
              style="width: 120px"
              allow-clear
            >
              <a-select-option value="planning">规划中</a-select-option>
              <a-select-option value="active">进行中</a-select-option>
              <a-select-option value="completed">已完成</a-select-option>
              <a-select-option value="cancelled">已取消</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="loading">
              <template #icon><search-outlined /></template>
              搜索
            </a-button>
            <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 统计信息 -->
      <a-row :gutter="16" class="stats-row">
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.total }}</div>
              <div class="stat-label">总计划数</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.planning }}</div>
              <div class="stat-label">规划中</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.active }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 计划列表 -->
      <a-card class="plans-card">
        <a-table
          :columns="columns"
          :data-source="plans"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
        >
          <template #status="{ record }">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <template #travelType="{ record }">
            <a-tag :color="getTravelTypeColor(record.travel_type)">
              {{ record.travel_type }}
            </a-tag>
          </template>

          <template #budget="{ record }">
            ¥{{ record.total_budget }}
          </template>

          <template #dates="{ record }">
            {{ formatDate(record.start_date) }} - {{ formatDate(record.end_date) }}
          </template>

          <template #createdAt="{ record }">
            {{ formatDate(record.created_at) }}
          </template>

          <template #action="{ record }">
            <a-space>
              <a-button size="small" @click="viewPlan(record)">查看</a-button>
              <a-button size="small" @click="editPlan(record)">编辑</a-button>
              <a-button size="small" danger @click="deletePlan(record)">
                删除
              </a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 计划详情模态框 -->
      <a-modal
        v-model:visible="detailModal.visible"
        title="旅行计划详情"
        :footer="null"
        width="800px"
      >
        <div v-if="selectedPlan" class="plan-detail">
          <div class="detail-header">
            <h3>{{ selectedPlan.title }}</h3>
            <p>目的地: {{ selectedPlan.destination }}</p>
          </div>
          
          <a-row :gutter="16" class="detail-info">
            <a-col :span="12">
              <p><strong>创建者:</strong> {{ selectedPlan.creator_username || '未知用户' }}</p>
              <p><strong>出发日期:</strong> {{ formatDate(selectedPlan.start_date) }}</p>
              <p><strong>结束日期:</strong> {{ formatDate(selectedPlan.end_date) }}</p>
              <p><strong>行程天数:</strong> {{ getDaysDifference(selectedPlan.start_date, selectedPlan.end_date) }} 天</p>
            </a-col>
            <a-col :span="12">
              <p><strong>总预算:</strong> ¥{{ selectedPlan.total_budget }}</p>
              <p><strong>每日预算:</strong> ¥{{ selectedPlan.daily_budget }}</p>
              <p><strong>旅行类型:</strong> {{ selectedPlan.travel_type }}</p>
              <p>
                <strong>状态:</strong> 
                <a-tag :color="getStatusColor(selectedPlan.status)">
                  {{ getStatusText(selectedPlan.status) }}
                </a-tag>
              </p>
            </a-col>
          </a-row>
          
          <div class="detail-description">
            <h4>计划描述</h4>
            <p>{{ selectedPlan.description || '暂无描述' }}</p>
          </div>
          
          <div class="detail-itinerary" v-if="selectedPlan.itinerary && selectedPlan.itinerary.length">
            <h4>行程安排</h4>
            <a-timeline>
              <a-timeline-item v-for="(day, index) in selectedPlan.itinerary.slice(0, 3)" :key="index">
                <template #dot>
                  <a-avatar size="small" style="backgroundColor: #1890ff">
                    {{ index + 1 }}
                  </a-avatar>
                </template>
                <p><strong>第{{ index + 1 }}天:</strong> {{ day.title || '未命名行程' }}</p>
                <p v-if="day.description">{{ day.description }}</p>
              </a-timeline-item>
              <a-timeline-item v-if="selectedPlan.itinerary.length > 3">
                <template #dot>
                  <a-avatar size="small" style="backgroundColor: #8c8c8c">
                    ...
                  </a-avatar>
                </template>
                <p>还有 {{ selectedPlan.itinerary.length - 3 }} 天的行程</p>
              </a-timeline-item>
            </a-timeline>
          </div>
          
          <div class="detail-tags" v-if="selectedPlan.tags && selectedPlan.tags.length">
            <h4>标签</h4>
            <div>
              <a-tag v-for="tag in selectedPlan.tags" :key="tag">{{ tag }}</a-tag>
            </div>
          </div>
        </div>
      </a-modal>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import adminService from '../../services/adminService'

// 表格列配置
const columns = [
  {
    title: '计划标题',
    dataIndex: 'title',
    key: 'title',
    width: 200
  },
  {
    title: '目的地',
    dataIndex: 'destination',
    key: 'destination',
    width: 150
  },
  {
    title: '旅行类型',
    dataIndex: 'travel_type',
    key: 'travel_type',
    width: 120,
    slots: { customRender: 'travelType' }
  },
  {
    title: '总预算',
    dataIndex: 'total_budget',
    key: 'total_budget',
    width: 100,
    slots: { customRender: 'budget' }
  },
  {
    title: '行程日期',
    dataIndex: 'dates',
    key: 'dates',
    width: 200,
    slots: { customRender: 'dates' }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    slots: { customRender: 'status' }
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 150,
    slots: { customRender: 'createdAt' }
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    slots: { customRender: 'action' }
  }
]

const loading = ref(false)
const plans = ref([])
const selectedPlan = ref(null)

// 统计信息
const stats = reactive({
  total: 0,
  planning: 0,
  active: 0,
  completed: 0
})

// 搜索表单
const searchForm = reactive({
  title: '',
  destination: '',
  status: ''
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 条记录`
})

// 详情模态框
const detailModal = reactive({
  visible: false
})

// 状态颜色映射
const getStatusColor = (status) => {
  const colorMap = {
    'planning': 'blue',
    'active': 'green',
    'completed': 'gray',
    'cancelled': 'red'
  }
  return colorMap[status] || 'default'
}

// 状态文本映射
const getStatusText = (status) => {
  const textMap = {
    'planning': '规划中',
    'active': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return textMap[status] || '未知'
}

// 旅行类型颜色映射
const getTravelTypeColor = (type) => {
  const colorMap = {
    '个人游': 'purple',
    '情侣游': 'magenta',
    '家庭游': 'cyan',
    '朋友游': 'orange',
    '商务游': 'blue'
  }
  return colorMap[type] || 'default'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

const loadPlans = async () => {
  loading.value = true
  
  try {
    // 调用管理员服务获取计划列表
    const allPlans = await adminService.getAllPlans()
    
    // 应用搜索过滤
    let filteredPlans = allPlans
    
    if (searchForm.title) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.title && plan.title.includes(searchForm.title)
      )
    }
    
    if (searchForm.destination) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.destination && plan.destination.includes(searchForm.destination)
      )
    }
    
    if (searchForm.status) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.status === searchForm.status
      )
    }
    
    plans.value = filteredPlans
    pagination.total = filteredPlans.length
    
    // 更新统计信息
    stats.total = allPlans.length
    stats.planning = allPlans.filter(p => p.status === 'planning').length
    stats.active = allPlans.filter(p => p.status === 'active').length
    stats.completed = allPlans.filter(p => p.status === 'completed').length
    
  } catch (error) {
    console.error('加载计划数据失败:', error)
    message.error('加载计划数据失败')
    
    // 如果API调用失败，使用空数组
    plans.value = []
    pagination.total = 0
    
    // 重置统计信息
    Object.keys(stats).forEach(key => {
      stats[key] = 0
    })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadPlans()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.current = 1
  loadPlans()
}

const handleTableChange = (newPagination) => {
  Object.assign(pagination, newPagination)
  loadPlans()
}

const viewPlan = (plan) => {
  selectedPlan.value = plan
  detailModal.visible = true
}

const editPlan = (plan) => {
  // 编辑功能待实现
  message.info('编辑功能正在开发中')
}

const deletePlan = (plan) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除旅行计划 "${plan.title}" 吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await adminService.deletePlan(plan.id)
        message.success('旅行计划删除成功')
        loadPlans()
        
      } catch (error) {
        console.error('删除计划失败:', error)
        message.error(`删除计划失败: ${error.message}`)
      }
    }
  })
}

onMounted(() => {
  loadPlans()
})
</script>

<style scoped>
.plan-management {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #262626;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.search-card {
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
}

.stat-content {
  padding: 16px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

.plans-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.plan-detail {
  padding: 16px 0;
}

.detail-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.detail-header h3 {
  margin: 0 0 8px 0;
  color: #262626;
  font-size: 20px;
}

.detail-header p {
  margin: 0;
  color: #8c8c8c;
}

.detail-info {
  margin-bottom: 20px;
}

.detail-description {
  margin-bottom: 20px;
}

.detail-description h4 {
  margin-bottom: 8px;
  color: #262626;
}

.detail-itinerary {
  margin-bottom: 20px;
}

.detail-itinerary h4 {
  margin-bottom: 8px;
  color: #262626;
}

.detail-tags h4 {
  margin-bottom: 8px;
  color: #262626;
}

.detail-tags .ant-tag {
  margin-bottom: 4px;
}

@media (max-width: 1024px) {
  .page-header h1 {
    font-size: 22px;
  }
  
  .search-card :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
  
  .stat-number {
    font-size: 28px;
  }
  
  .plans-card :deep(.ant-table-thead > tr > th),
  .plans-card :deep(.ant-table-tbody > tr > td) {
    padding: 8px 4px;
    font-size: 14px;
  }
  
  .detail-header h3 {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 20px;
  }
  
  .stats-row {
    margin-bottom: 12px;
  }
  
  .stat-content {
    padding: 12px 0;
  }
  
  .stat-number {
    font-size: 24px;
    margin-bottom: 6px;
  }
  
  .plans-card :deep(.ant-table-thead > tr > th),
  .plans-card :deep(.ant-table-tbody > tr > td) {
    padding: 6px 2px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 18px;
  }
  
  .stats-row {
    margin-bottom: 8px;
  }
  
  .stat-content {
    padding: 8px 0;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .plans-card :deep(.ant-table) {
    font-size: 12px;
  }
}
</style>