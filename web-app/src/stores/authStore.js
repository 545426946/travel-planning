// 用户认证状态管理
import { reactive } from 'vue'
import authService from '../services/authService'

// 认证状态
const authState = reactive({
  isLoggedIn: authService.isLoggedIn(),
  currentUser: authService.getCurrentUser(),
  isLoading: false
})

// 认证状态变化监听器
const handleAuthStateChange = () => {
  authState.isLoggedIn = authService.isLoggedIn()
  authState.currentUser = authService.getCurrentUser()
}

// 添加监听器
authService.addListener(handleAuthStateChange)

// 全局事件监听器
const handleGlobalAuthChange = (event) => {
  authState.isLoggedIn = event.detail.isLoggedIn
  authState.currentUser = event.detail.currentUser
}

window.addEventListener('authStateChange', handleGlobalAuthChange)

// 登出跳转监听器
const handleUserLogout = (event) => {
  authState.isLoggedIn = false
  authState.currentUser = null
  
  // 触发路由跳转（由App.vue处理）
  window.dispatchEvent(new CustomEvent('redirectToHome'))
}

window.addEventListener('userLogout', handleUserLogout)

// 导出认证状态和操作方法
export const useAuthStore = () => {
  return {
    // 状态
    authState,
    
    // 方法
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
    
    // 工具方法
    isLoggedIn: () => authState.isLoggedIn,
    getCurrentUser: () => authState.currentUser
  }
}

// 清理函数（用于组件卸载时）
export const cleanupAuthStore = () => {
  authService.removeListener(handleAuthStateChange)
  window.removeEventListener('authStateChange', handleGlobalAuthChange)
  window.removeEventListener('userLogout', handleUserLogout)
}