<template>
  <a-config-provider :locale="zhCN">
    <div id="app">
      <!-- 导航栏 -->
      <a-layout>
        <a-layout-header class="header">
          <div class="header-content">
            <div class="logo">
              <h1>旅行规划</h1>
            </div>
            
            <!-- 桌面端导航菜单 -->
            <a-menu
              v-model:selectedKeys="currentRoute"
              mode="horizontal"
              class="nav-menu desktop-menu"
              @click="handleMenuClick"
            >
              <a-menu-item key="/">首页</a-menu-item>
              <a-menu-item key="/plans">行程规划</a-menu-item>
              <a-menu-item key="/destinations">热门景点</a-menu-item>
              <a-menu-item key="/profile">个人中心</a-menu-item>
            </a-menu>
            
            <!-- 移动端汉堡菜单 -->
            <a-button 
              class="mobile-menu-btn"
              type="text"
              @click="showMobileMenu = !showMobileMenu"
            >
              <MenuOutlined />
            </a-button>
            
            <div class="auth-buttons">
              <a-button 
                v-if="!isLoggedIn" 
                type="primary" 
                @click="openAuthModal('login')"
              >
                登录/注册
              </a-button>
              <a-dropdown v-else>
                <a-space>
                  <a-avatar>{{ currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}</a-avatar>
                  <span class="username">{{ currentUser?.displayName || currentUser?.username }}</span>
                </a-space>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="logout">退出登录</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
          
          <!-- 移动端菜单抽屉 -->
          <a-drawer
            v-model:open="showMobileMenu"
            placement="left"
            :closable="false"
            :width="280"
            class="mobile-drawer"
          >
            <template #title>
              <h3>导航菜单</h3>
            </template>
            <a-menu
              v-model:selectedKeys="currentRoute"
              mode="vertical"
              @click="handleMobileMenuClick"
            >
              <a-menu-item key="/">
                <HomeOutlined />
                首页
              </a-menu-item>
              <a-menu-item key="/plans">
                <CalendarOutlined />
                行程规划
              </a-menu-item>
              <a-menu-item key="/destinations">
                <EnvironmentOutlined />
                热门景点
              </a-menu-item>
              <a-menu-item key="/profile">
                <UserOutlined />
                个人中心
              </a-menu-item>
            </a-menu>
          </a-drawer>
        </a-layout-header>

        <!-- 主要内容 -->
        <a-layout-content class="content">
          <router-view />
        </a-layout-content>
      </a-layout>

      <!-- 登录注册模态框 -->
      <AuthModal 
        v-model:visible="showAuthModal" 
        :default-mode="authModalMode"
        @success="handleAuthSuccess"
      />
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { message } from 'ant-design-vue'
import AuthModal from './components/AuthModal.vue'
import { useAuthStore, cleanupAuthStore } from './stores/authStore'
import { 
  MenuOutlined, 
  HomeOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined, 
  UserOutlined 
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => [route.path])
const showAuthModal = ref(false)
const authModalMode = ref('login')
const showMobileMenu = ref(false)

// 使用状态管理store
const { authState, logout } = useAuthStore()

// 计算属性
const isLoggedIn = computed(() => authState.isLoggedIn)
const currentUser = computed(() => authState.currentUser)

const handleMenuClick = ({ key }) => {
  router.push(key)
}

const openAuthModal = (mode = 'login') => {
  authModalMode.value = mode
  showAuthModal.value = true
}

const handleAuthSuccess = () => {
  showAuthModal.value = false
}

// 移动端菜单点击处理
const handleMobileMenuClick = ({ key }) => {
  router.push(key)
  showMobileMenu.value = false // 关闭移动端菜单
}

// 登出跳转监听器
const handleRedirectToHome = () => {
  if (router.currentRoute.value.path !== '/') {
    router.push('/')
  }
}

onMounted(() => {
  // 监听来自子组件的打开登录模态框事件
  window.addEventListener('openAuthModal', (event) => {
    openAuthModal(event.detail.mode || 'login')
  })
  
  // 监听登出跳转事件
  window.addEventListener('redirectToHome', handleRedirectToHome)
  
  // 监听窗口大小变化，自动关闭移动端菜单
  const handleResize = () => {
    if (window.innerWidth > 768) {
      showMobileMenu.value = false
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  // 清理函数
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('openAuthModal', (event) => {
    openAuthModal(event.detail.mode || 'login')
  })
  window.removeEventListener('redirectToHome', handleRedirectToHome)
  cleanupAuthStore()
})
</script>

<style scoped>
/* 基础样式 */
.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  width: 100%;
  z-index: 1000;
  height: 64px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1890ff;
}

.nav-menu {
  flex: 1;
  justify-content: center;
  border-bottom: none;
}

.auth-buttons {
  display: flex;
  align-items: center;
}

.mobile-menu-btn {
  display: none;
  font-size: 18px;
}

.username {
  margin-left: 8px;
}

.content {
  margin-top: 64px;
  min-height: calc(100vh - 64px);
  background: #f5f5f5;
}

/* 移动端抽屉样式 */
.mobile-drawer :deep(.ant-drawer-header) {
  border-bottom: 1px solid #f0f0f0;
}

.mobile-drawer :deep(.ant-drawer-body) {
  padding: 0;
}

.mobile-drawer :deep(.ant-menu) {
  border-right: none;
}

.mobile-drawer :deep(.ant-menu-item) {
  margin: 0;
  height: 48px;
  line-height: 48px;
}

/* 平板设备 (768px - 1024px) */
@media (max-width: 1024px) {
  .header-content {
    padding: 0 16px;
  }
  
  .logo h1 {
    font-size: 1.3rem;
  }
  
  .nav-menu {
    flex: none;
    margin: 0 16px;
  }
}

/* 手机设备 (小于768px) */
@media (max-width: 768px) {
  .header {
    height: 56px;
  }
  
  .header-content {
    padding: 0 12px;
    flex-wrap: wrap;
  }
  
  .logo {
    flex: 1;
  }
  
  .logo h1 {
    font-size: 1.2rem;
  }
  
  .desktop-menu {
    display: none; /* 在小屏幕上隐藏桌面导航菜单 */
  }
  
  .mobile-menu-btn {
    display: block; /* 显示移动端菜单按钮 */
    margin-right: 12px;
  }
  
  .auth-buttons {
    flex: none;
  }
  
  .username {
    display: none; /* 在小屏幕上隐藏用户名 */
  }
  
  .content {
    margin-top: 56px;
    min-height: calc(100vh - 56px);
  }
}

/* 超小屏幕设备 (小于480px) */
@media (max-width: 480px) {
  .header-content {
    padding: 0 8px;
  }
  
  .logo h1 {
    font-size: 1.1rem;
  }
  
  .auth-buttons {
    font-size: 0.9rem;
  }
}

/* 横屏模式优化 */
@media (max-height: 500px) and (orientation: landscape) {
  .header {
    height: 48px;
  }
  
  .content {
    margin-top: 48px;
    min-height: calc(100vh - 48px);
  }
}
</style>