<template>
  <div class="profile">

    <div class="profile-content">
      <!-- 用户信息卡片 -->
      <a-card class="user-info-card">
        <div class="user-header">
          <a-avatar size="80" class="user-avatar">
            {{ (currentUser.displayName || currentUser.username || 'U')?.charAt(0)?.toUpperCase() || 'U' }}
          </a-avatar>
          <div class="user-details">
            <h2>{{ currentUser.displayName || currentUser.username || '用户' }}</h2>
            <p class="user-email">{{ currentUser.email || '未设置邮箱' }}</p>
            <p class="user-join-date">
              注册时间：{{ formatJoinDate(currentUser.createdAt) }}
            </p>
          </div>
        </div>
      </a-card>

      <!-- 统计信息 -->
      <a-row :gutter="[24, 24]" class="stats-row">
        <a-col :span="8">
          <a-card class="stat-card">
            <div class="stat-content">
              <FileTextOutlined class="stat-icon" />
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalPlans }}</div>
                <div class="stat-label">总行程数</div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card class="stat-card">
            <div class="stat-content">
              <CalendarOutlined class="stat-icon" />
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalDays }}</div>
                <div class="stat-label">总天数</div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card class="stat-card">
            <div class="stat-content">
              <DollarOutlined class="stat-icon" />
              <div class="stat-info">
                <div class="stat-number">¥{{ userStats.totalBudget }}</div>
                <div class="stat-label">总预算</div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 最近行程 -->
      <a-card title="最近行程" class="recent-plans-card">
        <a-list
          :data-source="recentPlans"
          :loading="loading"
          item-layout="horizontal"
        >
          <template #renderItem="{ item }">
            <a-list-item class="plan-item">
              <a-list-item-meta
                :title="item.title"
                :description="item.description"
              >
                <template #avatar>
                  <a-avatar>{{ item.is_ai_generated ? '🤖' : '✈️' }}</a-avatar>
                </template>
              </a-list-item-meta>
              
              <div class="plan-info">
                <a-space>
                  <span><CalendarOutlined /> {{ item.days }}天</span>
                  <span><DollarOutlined /> ¥{{ item.budget }}</span>
                  <span><UserOutlined /> {{ item.travelers }}人</span>
                </a-space>
              </div>
              
              <template #actions>
                <a-button type="link" @click="viewPlan(item)">
                  <template #icon><EyeOutlined /></template>
                  查看
                </a-button>
              </template>
            </a-list-item>
          </template>
          
          <template #empty>
            <div class="empty-state">
              <FileTextOutlined class="empty-icon" />
              <p>暂无行程记录</p>
              <a-button type="primary" @click="$router.push('/plans')">
                创建第一个行程
              </a-button>
            </div>
          </template>
        </a-list>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'
import authService from '../services/authService'
import supabaseAuthService from '../services/supabaseAuthService'

const router = useRouter()
const loading = ref(false)

// 响应式状态管理
const authState = reactive({
  isLoggedIn: authService.isLoggedIn(),
  currentUser: authService.getCurrentUser()
})

// 计算属性
const isLoggedIn = computed(() => authState.isLoggedIn)
const currentUser = computed(() => authState.currentUser)

// 响应式数据
const userStats = ref({
  totalPlans: 0,
  totalDays: 0,
  totalBudget: 0
})

const recentPlans = ref([])

// 监听认证状态变化
const handleAuthStateChange = () => {
  authState.isLoggedIn = authService.isLoggedIn()
  authState.currentUser = authService.getCurrentUser()
  
  // 如果用户已登出，重定向到首页
  if (!authState.isLoggedIn) {
    message.info('您已退出登录')
    router.push('/')
  }
}

const formatJoinDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const viewPlan = (plan) => {
  // 这里可以添加查看行程详情的逻辑
  message.info(`查看行程: ${plan.title}`)
}

const loadUserStats = async () => {
  if (!isLoggedIn.value) return
  
  try {
    loading.value = true
    const result = await supabaseAuthService.getUserStats()
    
    if (result.success) {
      userStats.value = result.data
    }
  } catch (error) {
    console.error('加载用户统计失败:', error)
  } finally {
    loading.value = false
  }
}

const loadRecentPlans = async () => {
  if (!isLoggedIn.value) return
  
  try {
    const result = await supabaseAuthService.getUserPlans()
    
    if (result.success) {
      recentPlans.value = result.data.slice(0, 5) // 只显示最近5个行程
    }
  } catch (error) {
    console.error('加载最近行程失败:', error)
  }
}

onMounted(() => {
  // 初始化认证状态
  authState.isLoggedIn = authService.isLoggedIn()
  authState.currentUser = authService.getCurrentUser()
  
  // 添加认证状态变化监听器
  window.addEventListener('authStateChange', handleAuthStateChange)
  
  // 检查用户是否已登录
  if (!isLoggedIn.value) {
    message.error('请先登录')
    router.push('/')
    return
  }
  
  // 加载用户数据
  loadUserStats()
  loadRecentPlans()
})

// 组件卸载时移除监听器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('authStateChange', handleAuthStateChange)
})
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f8fafc;
}

/* 顶部导航栏样式 */
.top-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  z-index: 1000;
  padding: 0 20px;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.nav-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 4px;
}

.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.user-info-card {
  margin-bottom: 24px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 32px;
  font-weight: 600;
  color: white;
}

.user-details h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.user-email {
  margin: 0 0 4px 0;
  color: #6b7280;
}

.user-join-date {
  margin: 0;
  color: #9ca3af;
  font-size: 0.9rem;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
  color: #667eea;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.recent-plans-card {
  margin-bottom: 24px;
}

.plan-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.plan-item:last-child {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.empty-icon {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .profile-content {
    padding: 20px 16px;
  }
  
  .user-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .stats-row {
    margin-bottom: 16px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>