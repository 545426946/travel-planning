<template>
  <a-layout class="admin-layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="admin-sider"
    >
      <div class="logo">
        <h2>{{ collapsed ? 'TP' : '旅行规划' }}</h2>
      </div>
      
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="/admin/dashboard">
          <pie-chart-outlined />
          <span>仪表板</span>
        </a-menu-item>
        
        <a-menu-item key="/admin/users">
          <user-outlined />
          <span>用户管理</span>
        </a-menu-item>
        
        <a-menu-item key="/admin/attractions">
          <environment-outlined />
          <span>景点管理</span>
        </a-menu-item>
        
        <a-sub-menu key="more" :title="collapsed ? '' : '更多功能'">
          <template #icon>
            <setting-outlined />
          </template>
          <a-menu-item key="/admin/settings">系统设置</a-menu-item>
          <a-menu-item key="/admin/logs">操作日志</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>

    <!-- 主要内容区域 -->
    <a-layout class="admin-content-layout">
      <!-- 顶部导航栏 -->
      <a-layout-header class="admin-header">
        <div class="header-left">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="toggleCollapsed"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="toggleCollapsed"
          />
          <span class="header-title">后台管理系统</span>
        </div>
        
        <div class="header-right">
          <a-dropdown>
            <a-space>
              <a-avatar>{{ currentUser?.username?.charAt(0)?.toUpperCase() || 'A' }}</a-avatar>
              <span class="admin-name">{{ currentUser?.displayName || currentUser?.username }}</span>
            </a-space>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="handleLogout">
                  <logout-outlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容区域 -->
      <a-layout-content class="admin-main-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  PieChartOutlined,
  UserOutlined,
  EnvironmentOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import authService from '../../services/authService'
import adminService from '../../services/adminService'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const selectedKeys = computed(() => [route.path])

const currentUser = computed(() => adminService.getCurrentAdmin())

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

const handleMenuClick = ({ key }) => {
  router.push(key)
}

const handleLogout = async () => {
  try {
    adminService.adminLogout()
    message.success('已退出管理员登录')
    router.push('/admin')
  } catch (error) {
    message.error('退出登录失败')
  }
}

onMounted(() => {
  // 检查是否为管理员
  if (!currentUser.value || currentUser.value.role !== 'admin') {
    message.error('权限不足：需要管理员权限')
    router.push('/admin')
  }
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-sider {
  background: #001529;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #002140;
  margin: 0;
  color: white;
}

.logo h2 {
  color: white;
  margin: 0;
  font-size: 18px;
}

.admin-content-layout {
  background: #f0f2f5;
}

.admin-header {
  background: white;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  margin-right: 16px;
  color: #1890ff;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.header-right {
  display: flex;
  align-items: center;
}

.admin-name {
  margin-left: 8px;
  color: #262626;
}

.admin-main-content {
  margin: 24px;
  padding: 24px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  min-height: calc(100vh - 112px);
  overflow-x: auto;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .admin-sider {
    position: fixed !important;
    z-index: 999;
    height: 100vh;
  }
  
  .admin-content-layout {
    margin-left: 0 !important;
  }
  
  .trigger {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 1000;
    background: white;
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

/* 手机适配 */
@media (max-width: 768px) {
  .admin-header {
    padding: 0 12px;
    flex-wrap: wrap;
  }
  
  .admin-main-content {
    margin: 8px;
    padding: 12px;
    min-height: calc(100vh - 96px);
  }
  
  .header-title {
    display: none;
  }
  
  .header-right {
    margin-top: 8px;
    width: 100%;
    justify-content: flex-end;
  }
  
  .admin-name {
    font-size: 14px;
  }
  
  .logo h2 {
    font-size: 16px;
  }
}

/* 超小屏适配 */
@media (max-width: 480px) {
  .admin-header {
    padding: 0 8px;
  }
  
  .admin-main-content {
    margin: 4px;
    padding: 8px;
    min-height: calc(100vh - 80px);
  }
  
  .trigger {
    top: 8px;
    left: 8px;
    padding: 6px;
  }
}
</style>