<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>后台仪表板</h1>
      <p>欢迎回来，{{ currentUser?.displayName || currentUser?.username }}！</p>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users-icon">
              <user-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon attractions-icon">
              <environment-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalAttractions || 0 }}</div>
              <div class="stat-label">景点数量</div>
            </div>
          </div>
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon plans-icon">
              <CalendarOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPlans || 0 }}</div>
              <div class="stat-label">行程计划</div>
            </div>
          </div>
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon cities-icon">
              <GlobalOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalCities || 0 }}</div>
              <div class="stat-label">城市数量</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 快速操作 -->
    <a-card title="快速操作" class="quick-actions-card">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-card hoverable class="action-card" @click="$router.push('/admin/users')">
            <div class="action-content">
              <user-add-outlined class="action-icon" />
              <h3>用户管理</h3>
              <p>管理用户账户和权限</p>
            </div>
          </a-card>
        </a-col>
        
        <a-col :span="8">
          <a-card hoverable class="action-card" @click="$router.push('/admin/attractions')">
            <div class="action-content">
              <plus-circle-outlined class="action-icon" />
              <h3>景点管理</h3>
              <p>添加和编辑景点信息</p>
            </div>
          </a-card>
        </a-col>
        
        <a-col :span="8">
          <a-card hoverable class="action-card" @click="handleSystemSettings">
            <div class="action-content">
              <setting-outlined class="action-icon" />
              <h3>系统设置</h3>
              <p>配置系统参数</p>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <!-- 最近活动 -->
    <a-row :gutter="16" class="recent-activity-row">
      <a-col :span="12">
        <a-card title="最近注册用户" class="recent-card">
          <a-list
            :data-source="recentUsers"
            :loading="loading"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.username"
                  :description="`注册时间: ${formatDate(item.created_at)}`"
                >
                  <template #avatar>
                    <a-avatar>{{ item.username.charAt(0).toUpperCase() }}</a-avatar>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button type="link" size="small" @click="viewUser(item)">查看</a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      
      <a-col :span="12">
        <a-card title="最新景点" class="recent-card">
          <a-list
            :data-source="recentAttractions"
            :loading="loading"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.name"
                  :description="`位置: ${item.location}, ${item.country}`"
                >
                  <template #avatar>
                    <a-avatar :src="item.image_url" :alt="item.name">
                      <environment-outlined v-if="!item.image_url" />
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button type="link" size="small" @click="viewAttraction(item)">编辑</a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  UserOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined, 
  GlobalOutlined,
  UserAddOutlined,
  PlusCircleOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'
import authService from '../../services/authService'

const router = useRouter()
const loading = ref(false)

const stats = ref({
  totalUsers: 0,
  totalAttractions: 0,
  totalPlans: 0,
  totalCities: 0
})

const recentUsers = ref([])
const recentAttractions = ref([])

const currentUser = computed(() => authService.getCurrentUser())

// 模拟数据 - 实际项目中应该从API获取
const mockStats = {
  totalUsers: 1250,
  totalAttractions: 85,
  totalPlans: 320,
  totalCities: 15
}

const mockRecentUsers = [
  { id: 1, username: 'user001', created_at: new Date().toISOString() },
  { id: 2, username: 'traveler2024', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, username: 'explorer_001', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 4, username: 'journey_lover', created_at: new Date(Date.now() - 259200000).toISOString() }
]

const mockRecentAttractions = [
  { 
    id: 1, 
    name: '长城', 
    location: '北京', 
    country: '中国',
    image_url: null,
    created_at: new Date().toISOString() 
  },
  { 
    id: 2, 
    name: '埃菲尔铁塔', 
    location: '巴黎', 
    country: '法国',
    image_url: null,
    created_at: new Date(Date.now() - 86400000).toISOString() 
  }
]

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const viewUser = (user) => {
  message.info(`查看用户: ${user.username}`)
  // 实际项目中这里应该跳转到用户详情页面
}

const viewAttraction = (attraction) => {
  message.info(`编辑景点: ${attraction.name}`)
  // 实际项目中这里应该跳转到景点编辑页面
}

const handleSystemSettings = () => {
  message.info('系统设置功能开发中...')
}

const loadDashboardData = async () => {
  loading.value = true
  
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 实际项目中应该调用真实的API
    stats.value = mockStats
    recentUsers.value = mockRecentUsers
    recentAttractions.value = mockRecentAttractions
    
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0 0 8px 0;
  color: #262626;
  font-size: 28px;
}

.dashboard-header p {
  margin: 0;
  color: #8c8c8c;
  font-size: 16px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.users-icon {
  background: #1890ff;
  color: white;
}

.attractions-icon {
  background: #52c41a;
  color: white;
}

.plans-icon {
  background: #faad14;
  color: white;
}

.cities-icon {
  background: #722ed1;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  line-height: 1;
}

.stat-label {
  color: #8c8c8c;
  margin-top: 4px;
}

.quick-actions-card {
  margin-bottom: 24px;
}

.action-card {
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-content {
  padding: 16px;
}

.action-icon {
  font-size: 32px;
  color: #1890ff;
  margin-bottom: 12px;
}

.action-content h3 {
  margin: 0 0 8px 0;
  color: #262626;
}

.action-content p {
  margin: 0;
  color: #8c8c8c;
}

.recent-activity-row {
  margin-bottom: 0;
}

.recent-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .stats-row .ant-col {
    margin-bottom: 16px;
  }
  
  .recent-activity-row .ant-col {
    margin-bottom: 16px;
  }
}
</style>