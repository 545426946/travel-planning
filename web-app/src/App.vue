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
            <a-menu
              v-model:selectedKeys="currentRoute"
              mode="horizontal"
              class="nav-menu"
              @click="handleMenuClick"
            >
              <a-menu-item key="/">首页</a-menu-item>
              <a-menu-item key="/plans">行程规划</a-menu-item>
              <a-menu-item key="/destinations">热门景点</a-menu-item>
              <a-menu-item key="/profile">个人中心</a-menu-item>
            </a-menu>
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
                  <span>{{ currentUser?.displayName || currentUser?.username }}</span>
                </a-space>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="logout">退出登录</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
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

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => [route.path])
const showAuthModal = ref(false)
const authModalMode = ref('login')

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
.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  width: 100%;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
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

.content {
  margin-top: 64px;
  min-height: calc(100vh - 64px);
  background: #f5f5f5;
}
</style>