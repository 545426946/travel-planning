<template>
  <div class="profile">
    <div class="page-header">
      <h1>个人中心</h1>
    </div>

    <!-- 用户信息卡片 -->
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :lg="8">
        <a-card class="user-card">
          <div class="user-info">
            <a-avatar :size="80" :src="user.avatar" class="user-avatar">
              <UserOutlined v-if="!user.avatar" />
            </a-avatar>
            <div class="user-details">
              <h2>{{ user.username || '游客' }}</h2>
              <p class="user-email">{{ user.email || '请登录查看详细信息' }}</p>
              <a-tag v-if="user.isMember" color="gold">会员</a-tag>
              <a-tag v-else color="default">普通用户</a-tag>
            </div>
          </div>
          
          <div class="user-stats">
            <a-statistic title="已创建行程" :value="userStats.plans" />
            <a-statistic title="已访问景点" :value="userStats.visitedDestinations" />
            <a-statistic title="总消费" :value="userStats.totalSpent" prefix="¥" />
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="16">
        <!-- 功能菜单 -->
        <a-card title="功能菜单" class="menu-card">
          <a-list item-layout="horizontal">
            <a-list-item @click="$router.push('/plans')">
              <a-list-item-meta
                title="我的行程"
                description="查看和管理您的旅行计划"
              >
                <template #avatar>
                  <ScheduleOutlined style="font-size: 24px; color: #1890ff;" />
                </template>
              </a-list-item-meta>
            </a-list-item>
            
            <a-list-item @click="$router.push('/destinations')">
              <a-list-item-meta
                title="热门景点"
                description="探索世界各地的特色景点"
              >
                <template #avatar>
                  <CompassOutlined style="font-size: 24px; color: #52c41a;" />
                </template>
              </a-list-item-meta>
            </a-list-item>
            
            <a-list-item @click="showSettings = true">
              <a-list-item-meta
                title="设置"
                description="个性化设置和偏好"
              >
                <template #avatar>
                  <SettingOutlined style="font-size: 24px; color: #faad14;" />
                </template>
              </a-list-item-meta>
            </a-list-item>
            
            <a-list-item v-if="user" @click="logout">
              <a-list-item-meta
                title="退出登录"
                description="安全退出当前账户"
              >
                <template #avatar>
                  <LogoutOutlined style="font-size: 24px; color: #ff4d4f;" />
                </template>
              </a-list-item-meta>
            </a-list-item>
            
            <a-list-item v-else @click="$emit('showLogin')">
              <a-list-item-meta
                title="登录/注册"
                description="登录或注册新账户"
              >
                <template #avatar>
                  <LoginOutlined style="font-size: 24px; color: #722ed1;" />
                </template>
              </a-list-item-meta>
            </a-list-item>
          </a-list>
        </a-card>

        <!-- 最近行程 -->
        <a-card title="最近行程" class="recent-plans-card">
          <a-list
            :data-source="recentPlans"
            :loading="loading"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.title"
                  :description="`${item.days}天 · ¥${item.budget}`"
                >
                  <template #avatar>
                    <a-avatar :src="item.icon" />
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button type="link" @click="viewPlan(item)">查看</a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
          
          <div v-if="recentPlans.length === 0" class="empty-state">
            <a-empty description="暂无行程记录">
              <a-button type="primary" @click="$router.push('/plans')">
                创建第一个行程
              </a-button>
            </a-empty>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 设置模态框 -->
    <a-modal
      v-model:open="showSettings"
      title="设置"
      width="500px"
      :footer="null"
    >
      <a-tabs>
        <a-tab-pane key="profile" tab="个人信息">
          <a-form layout="vertical">
            <a-form-item label="用户名">
              <a-input :value="user.username" />
            </a-form-item>
            <a-form-item label="邮箱">
              <a-input :value="user.email" />
            </a-form-item>
            <a-form-item label="个人简介">
              <a-textarea placeholder="介绍一下自己..." :rows="3" />
            </a-form-item>
          </a-form>
        </a-tab-pane>
        
        <a-tab-pane key="preferences" tab="偏好设置">
          <a-form layout="vertical">
            <a-form-item label="主题">
              <a-radio-group v-model:value="theme">
                <a-radio value="light">浅色</a-radio>
                <a-radio value="dark">深色</a-radio>
                <a-radio value="auto">自动</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-form-item label="语言">
              <a-select v-model:value="language" style="width: 200px">
                <a-select-option value="zh-CN">中文</a-select-option>
                <a-select-option value="en-US">English</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  UserOutlined, 
  ScheduleOutlined, 
  CompassOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  LoginOutlined 
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()

const loading = ref(false)
const showSettings = ref(false)
const theme = ref('light')
const language = ref('zh-CN')

const user = ref({
  username: '旅行者',
  email: 'traveler@example.com',
  avatar: null,
  isMember: true
})

const userStats = ref({
  plans: 5,
  visitedDestinations: 12,
  totalSpent: 8560
})

const recentPlans = ref([
  {
    id: 1,
    title: '北京文化之旅',
    days: 3,
    budget: 2500,
    icon: '🏯'
  },
  {
    id: 2,
    title: '上海现代游',
    days: 2,
    budget: 1800,
    icon: '🏙️'
  }
])

const logout = () => {
  user.value = null
  userStats.value = { plans: 0, visitedDestinations: 0, totalSpent: 0 }
  recentPlans.value = []
  message.success('已退出登录')
}

const viewPlan = (plan) => {
  message.info(`查看行程: ${plan.title}`)
}

onMounted(() => {
  // 加载用户数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<style scoped>
.profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
}

.user-card {
  height: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.user-avatar {
  margin-right: 16px;
}

.user-details h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-email {
  margin: 0 0 8px 0;
  color: #6b7280;
}

.user-stats {
  display: grid;
  gap: 16px;
}

.menu-card {
  margin-bottom: 24px;
}

.recent-plans-card {
  margin-top: 24px;
}

.empty-state {
  padding: 40px 0;
}

:deep(.ant-list-item) {
  cursor: pointer;
  transition: background-color 0.3s;
}

:deep(.ant-list-item:hover) {
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .profile {
    padding: 20px 16px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
  }
  
  .user-avatar {
    margin-right: 0;
    margin-bottom: 16px;
  }
}
</style>