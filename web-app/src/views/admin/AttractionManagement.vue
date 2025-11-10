<template>
  <AdminLayout>
    <div class="attraction-management">
      <div class="page-header">
        <h1>热门景点管理</h1>
        <p>基于用户旅行规划显示热门景点，支持查看和分析景点热度</p>
      </div>

      <!-- 搜索和筛选 -->
      <a-card class="search-card">
        <a-form layout="inline" :model="searchForm" @finish="handleSearch">
          <a-form-item label="景点名称">
            <a-input
              v-model:value="searchForm.name"
              placeholder="输入景点名称"
              allow-clear
            />
          </a-form-item>
          
          <a-form-item label="位置">
            <a-input
              v-model:value="searchForm.location"
              placeholder="输入位置"
              allow-clear
            />
          </a-form-item>
          
          <a-form-item label="类型">
            <a-select
              v-model:value="searchForm.type"
              placeholder="选择类型"
              style="width: 120px"
              allow-clear
            >
              <a-select-option value="历史建筑">历史建筑</a-select-option>
              <a-select-option value="自然景观">自然景观</a-select-option>
              <a-select-option value="现代建筑">现代建筑</a-select-option>
              <a-select-option value="历史遗迹">历史遗迹</a-select-option>
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

      <!-- 热门景点统计卡片 -->
      <a-row :gutter="16" class="stats-row">
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon popularity-icon">
                <star-outlined />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalPopularAttractions || 0 }}</div>
                <div class="stat-label">热门景点数</div>
              </div>
            </div>
          </a-card>
        </a-col>
        
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon plans-icon">
                <calendar-outlined />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalPlans || 0 }}</div>
                <div class="stat-label">涉及行程数</div>
              </div>
            </div>
          </a-card>
        </a-col>
        
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon users-icon">
                <user-outlined />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
                <div class="stat-label">相关用户数</div>
              </div>
            </div>
          </a-card>
        </a-col>
        
        <a-col :span="6">
          <a-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon cities-icon">
                <environment-outlined />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalDestinations || 0 }}</div>
                <div class="stat-label">目的地城市</div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 热门景点列表 -->
      <a-card class="attractions-card">
        <template #extra>
          <a-button type="primary" @click="refreshData">
            <template #icon><reload-outlined /></template>
            刷新数据
          </a-button>
        </template>

        <a-table
          :columns="columns"
          :data-source="popularAttractions"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="location"
        >
          <template #popularity="{ record }">
            <a-progress 
              :percent="Math.min(100, (record.popularity / maxPopularity) * 100)" 
              :stroke-color="getPopularityColor(record.popularity)"
              :format="() => `${record.popularity}次`"
            />
          </template>

          <template #type="{ record }">
            <a-tag :color="getTypeColor(record.type)">
              {{ record.type }}
            </a-tag>
          </template>

          <template #rating="{ record }">
            <a-rate :value="record.avgRating" disabled />
            <span style="margin-left: 8px; color: #ffc53d">{{ record.avgRating.toFixed(1) }}</span>
          </template>

          <template #action="{ record }">
            <a-space>
              <a-button size="small" @click="viewAttractionDetails(record)">详情</a-button>
              <a-button size="small" @click="showRelatedPlans(record)">相关行程</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 添加/编辑景点模态框 -->
      <a-modal
        v-model:visible="attractionModal.visible"
        :title="attractionModal.isEdit ? '编辑景点' : '添加景点'"
        @ok="handleAttractionSubmit"
        @cancel="handleAttractionCancel"
        :confirm-loading="attractionModal.loading"
        width="800px"
      >
        <a-form
          ref="attractionFormRef"
          :model="attractionForm"
          :rules="attractionRules"
          layout="vertical"
        >
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="景点名称" name="name">
                <a-input v-model:value="attractionForm.name" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="位置" name="location">
                <a-input v-model:value="attractionForm.location" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="国家" name="country">
                <a-input v-model:value="attractionForm.country" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="地区" name="region">
                <a-input v-model:value="attractionForm.region" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="类型" name="type">
                <a-select v-model:value="attractionForm.type">
                  <a-select-option value="历史建筑">历史建筑</a-select-option>
                  <a-select-option value="自然景观">自然景观</a-select-option>
                  <a-select-option value="现代建筑">现代建筑</a-select-option>
                  <a-select-option value="历史遗迹">历史遗迹</a-select-option>
                  <a-select-option value="主题公园">主题公园</a-select-option>
                  <a-select-option value="博物馆">博物馆</a-select-option>
                  <a-select-option value="海滩">海滩</a-select-option>
                  <a-select-option value="山脉">山脉</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="最佳游览时间" name="bestTimeToVisit">
                <a-input v-model:value="attractionForm.bestTimeToVisit" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="门票价格" name="entryFee">
                <a-input-number
                  v-model:value="attractionForm.entryFee"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  addon-before="¥"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="评分" name="rating">
                <a-rate
                  v-model:value="attractionForm.rating"
                  allow-half
                />
                <span style="margin-left: 8px">{{ attractionForm.rating }}</span>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="描述" name="description">
            <a-textarea
              v-model:value="attractionForm.description"
              :rows="4"
              placeholder="请输入景点描述"
            />
          </a-form-item>

          <a-form-item label="图片链接" name="imageUrl">
            <a-input v-model:value="attractionForm.imageUrl" placeholder="请输入图片URL" />
          </a-form-item>

          <a-form-item label="标签" name="tags">
            <a-select
              v-model:value="attractionForm.tags"
              mode="tags"
              style="width: 100%"
              placeholder="请输入标签"
            ></a-select>
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 景点详情模态框 -->
      <a-modal
        v-model:visible="detailModal.visible"
        title="景点详情"
        :footer="null"
        width="700px"
      >
        <div v-if="selectedAttraction" class="attraction-detail">
          <div class="detail-header">
            <h3>{{ selectedAttraction.name }}</h3>
            <p>{{ selectedAttraction.location }}, {{ selectedAttraction.country }}</p>
          </div>
          
          <a-row :gutter="16" class="detail-info">
            <a-col :span="12">
              <p><strong>类型:</strong> {{ selectedAttraction.type }}</p>
              <p><strong>地区:</strong> {{ selectedAttraction.region }}</p>
              <p><strong>最佳游览时间:</strong> {{ selectedAttraction.best_time_to_visit || '未知' }}</p>
            </a-col>
            <a-col :span="12">
              <p><strong>门票价格:</strong> {{ selectedAttraction.entry_fee ? `¥${selectedAttraction.entry_fee}` : '免费' }}</p>
              <p><strong>评分:</strong> 
                <a-rate :value="selectedAttraction.rating" disabled />
                ({{ selectedAttraction.rating }})
              </p>
            </a-col>
          </a-row>
          
          <div class="detail-description">
            <h4>描述</h4>
            <p>{{ selectedAttraction.description }}</p>
          </div>
          
          <div class="detail-tags" v-if="selectedAttraction.tags && selectedAttraction.tags.length">
            <h4>标签</h4>
            <div>
              <a-tag v-for="tag in selectedAttraction.tags" :key="tag">{{ tag }}</a-tag>
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
import { 
  SearchOutlined, 
  ReloadOutlined,
  StarOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined 
} from '@ant-design/icons-vue'
import adminService from '../../services/adminService'

// 表格列配置
const columns = [
  {
    title: '景点名称',
    dataIndex: 'name',
    key: 'name',
    width: 150
  },
  {
    title: '位置',
    dataIndex: 'location',
    key: 'location',
    width: 120
  },
  {
    title: '热门度',
    dataIndex: 'popularity',
    key: 'popularity',
    width: 120,
    slots: { customRender: 'popularity' }
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    slots: { customRender: 'type' }
  },
  {
    title: '平均评分',
    dataIndex: 'avgRating',
    key: 'avgRating',
    width: 120,
    slots: { customRender: 'rating' }
  },
  {
    title: '涉及行程数',
    dataIndex: 'planCount',
    key: 'planCount',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    slots: { customRender: 'action' }
  }
]

const loading = ref(false)
const popularAttractions = ref([])
const stats = ref({})
const maxPopularity = ref(1)

// 搜索表单
const searchForm = reactive({
  name: '',
  location: '',
  type: ''
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

// 景点模态框
const attractionModal = reactive({
  visible: false,
  loading: false,
  isEdit: false
})

const attractionForm = reactive({
  id: '',
  name: '',
  location: '',
  country: '',
  region: '',
  type: '历史建筑',
  description: '',
  bestTimeToVisit: '',
  entryFee: 0,
  rating: 4.5,
  imageUrl: '',
  tags: []
})

const attractionRules = {
  name: [
    { required: true, message: '请输入景点名称' }
  ],
  location: [
    { required: true, message: '请输入位置' }
  ],
  country: [
    { required: true, message: '请输入国家' }
  ],
  region: [
    { required: true, message: '请输入地区' }
  ],
  description: [
    { required: true, message: '请输入描述' }
  ]
}

// 详情模态框
const detailModal = reactive({
  visible: false
})

// 类型颜色映射
const getTypeColor = (type) => {
  const colorMap = {
    '历史建筑': 'purple',
    '自然景观': 'green',
    '现代建筑': 'blue',
    '历史遗迹': 'orange',
    '主题公园': 'cyan',
    '博物馆': 'magenta',
    '海滩': 'geekblue',
    '山脉': 'volcano'
  }
  return colorMap[type] || 'default'
}



const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取热门度颜色
const getPopularityColor = (popularity) => {
  if (popularity >= 20) return '#ff4d4f'
  if (popularity >= 10) return '#ff7a45'
  if (popularity >= 5) return '#ffa940'
  return '#ffc53d'
}

// 热门景点详情视图
const selectedAttraction = ref(null)

const viewAttractionDetails = (record) => {
  selectedAttraction.value = record
  detailModal.visible = true
}

const showRelatedPlans = (record) => {
  message.info(`查看与"${record.name}"相关的行程`)
  // 实际项目中这里应该跳转到相关行程页面
}

const refreshData = async () => {
  await loadPopularAttractions()
}

const loadPopularAttractions = async () => {
  loading.value = true
  
  try {
    // 调用管理员服务获取热门景点统计数据
    const data = await adminService.getPopularAttractionsStats()
    
    // 更新统计数据
    stats.value = data.stats
    popularAttractions.value = data.popularAttractions
    
    // 计算最大热门度用于进度条显示
    if (popularAttractions.value.length > 0) {
      maxPopularity.value = Math.max(...popularAttractions.value.map(a => a.popularity))
    }
    
    // 应用搜索过滤
    applySearchFilter()
    
  } catch (error) {
    console.error('加载热门景点数据失败:', error)
    message.error('加载热门景点数据失败')
    
    // 使用默认数据作为备选方案
    stats.value = {
      totalPopularAttractions: 0,
      totalPlans: 0,
      totalUsers: 0,
      totalDestinations: 0
    }
    popularAttractions.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 应用搜索过滤
const applySearchFilter = () => {
  let filteredAttractions = popularAttractions.value
  
  if (searchForm.name) {
    filteredAttractions = filteredAttractions.filter(attraction => 
      attraction.name && attraction.name.toLowerCase().includes(searchForm.name.toLowerCase())
    )
  }
  
  if (searchForm.location) {
    filteredAttractions = filteredAttractions.filter(attraction => 
      attraction.location && attraction.location.toLowerCase().includes(searchForm.location.toLowerCase())
    )
  }
  
  if (searchForm.type) {
    filteredAttractions = filteredAttractions.filter(attraction => 
      attraction.type === searchForm.type
    )
  }
  
  popularAttractions.value = filteredAttractions
  pagination.total = filteredAttractions.length
}

const handleSearch = () => {
  pagination.current = 1
  applySearchFilter()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.current = 1
  loadPopularAttractions()
}

const handleTableChange = (newPagination) => {
  Object.assign(pagination, newPagination)
}

const showAddModal = () => {
  attractionModal.isEdit = false
  attractionModal.visible = true
  
  // 重置表单
  Object.keys(attractionForm).forEach(key => {
    if (key !== 'type' && key !== 'rating') {
      attractionForm[key] = ''
    }
  })
  attractionForm.type = '历史建筑'
  attractionForm.rating = 4.5
  attractionForm.entryFee = 0
  attractionForm.tags = []
}

const editAttraction = (attraction) => {
  attractionModal.isEdit = true
  attractionModal.visible = true
  
  // 填充表单
  Object.keys(attractionForm).forEach(key => {
    if (attraction[key] !== undefined) {
      if (key === 'best_time_to_visit') {
        attractionForm.bestTimeToVisit = attraction[key]
      } else if (key === 'entry_fee') {
        attractionForm.entryFee = attraction[key]
      } else if (key === 'image_url') {
        attractionForm.imageUrl = attraction[key]
      } else {
        attractionForm[key] = attraction[key]
      }
    }
  })
}

const viewAttraction = (attraction) => {
  selectedAttraction.value = attraction
  detailModal.visible = true
}

const deleteAttraction = (attraction) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除景点 "${attraction.name}" 吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        // 模拟删除操作
        await adminService.deleteAttraction(attraction.id)
        message.success('景点删除成功')
        loadAttractions()
        
      } catch (error) {
        message.error('删除景点失败')
      }
    }
  })
}

const handleAttractionSubmit = async () => {
  attractionModal.loading = true
  
  try {
    if (attractionModal.isEdit) {
      // 更新景点信息
      await adminService.updateAttraction(attractionForm.id, {
        name: attractionForm.name,
        description: attractionForm.description,
        location: attractionForm.location,
        country: attractionForm.country,
        region: attractionForm.region,
        type: attractionForm.type,
        best_time_to_visit: attractionForm.bestTimeToVisit,
        entry_fee: attractionForm.entryFee,
        rating: attractionForm.rating,
        image_url: attractionForm.imageUrl,
        tags: attractionForm.tags
      })
      message.success('景点信息更新成功')
    } else {
      // 创建新景点
      await adminService.createAttraction({
        name: attractionForm.name,
        description: attractionForm.description,
        location: attractionForm.location,
        country: attractionForm.country,
        region: attractionForm.region,
        type: attractionForm.type,
        best_time_to_visit: attractionForm.bestTimeToVisit,
        entry_fee: attractionForm.entryFee,
        rating: attractionForm.rating,
        image_url: attractionForm.imageUrl,
        tags: attractionForm.tags
      })
      message.success('景点添加成功')
    }
    
    attractionModal.visible = false
    loadAttractions()
    
  } catch (error) {
    console.error('操作失败:', error)
    message.error(`操作失败: ${error.message}`)
  } finally {
    attractionModal.loading = false
  }
}

const handleAttractionCancel = () => {
  attractionModal.visible = false
}

onMounted(() => {
  loadPopularAttractions()
})
</script>

<style scoped>
.attraction-management {
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

.attractions-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.attraction-detail {
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
  
  .search-card :deep(.ant-form-item-label) {
    width: 100%;
    text-align: left;
  }
  
  .attractions-card :deep(.ant-table-thead > tr > th),
  .attractions-card :deep(.ant-table-tbody > tr > td) {
    padding: 8px 4px;
    font-size: 14px;
  }
  
  .detail-header h3 {
    font-size: 18px;
  }
  
  .detail-description h4,
  .detail-tags h4 {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 20px;
  }
  
  .page-header p {
    font-size: 13px;
  }
  
  .search-card :deep(.ant-form-item) {
    margin-bottom: 12px;
  }
  
  .attractions-card :deep(.ant-table-thead > tr > th),
  .attractions-card :deep(.ant-table-tbody > tr > td) {
    padding: 6px 2px;
    font-size: 13px;
  }
  
  .attractions-card :deep(.ant-pagination) {
    font-size: 13px;
  }
  
  .attractions-card :deep(.ant-btn) {
    font-size: 12px;
    padding: 4px 8px;
  }
  
  .detail-header h3 {
    font-size: 16px;
  }
  
  .detail-description h4,
  .detail-tags h4 {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 18px;
  }
  
  .search-card :deep(.ant-form-item) {
    margin-bottom: 8px;
  }
  
  .attractions-card :deep(.ant-table) {
    font-size: 12px;
  }
  
  .attractions-card :deep(.ant-table-thead > tr > th),
  .attractions-card :deep(.ant-table-tbody > tr > td) {
    padding: 4px 1px;
    font-size: 12px;
  }
  
  .attractions-card :deep(.ant-pagination) {
    font-size: 12px;
  }
  
  .attractions-card :deep(.ant-pagination-item) {
    min-width: 28px;
    height: 28px;
  }
  
  .attractions-card :deep(.ant-pagination-prev,
                           .ant-pagination-next,
                           .ant-pagination-jump-prev,
                           .ant-pagination-jump-next) {
    min-width: 28px;
    height: 28px;
  }
  
  .detail-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }
  
  .detail-header h3 {
    font-size: 16px;
    margin-bottom: 6px;
  }
  
  .detail-info {
    margin-bottom: 16px;
  }
  
  .detail-description {
    margin-bottom: 16px;
  }
  
  .detail-description h4,
  .detail-tags h4 {
    font-size: 14px;
    margin-bottom: 6px;
  }
}
</style>