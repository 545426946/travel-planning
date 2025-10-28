import { createRouter, createWebHistory } from 'vue-router'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import Home from '../views/Home.vue'
import Plans from '../views/Plans.vue'
import PlanDetail from '../views/PlanDetail.vue'
import Destinations from '../views/Destinations.vue'
import Profile from '../views/Profile.vue'

const routes = [
  { 
    path: '/', 
    name: 'Home', 
    component: Home 
  },
  { 
    path: '/plans', 
    name: 'Plans', 
    component: Plans,
    meta: { requiresAuth: true }
  },
  { 
    path: '/plan/:id', 
    name: 'PlanDetail', 
    component: PlanDetail,
    meta: { requiresAuth: true }
  },
  { 
    path: '/destinations', 
    name: 'Destinations', 
    component: Destinations 
  },
  { 
    path: '/profile', 
    name: 'Profile', 
    component: Profile,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  if (to.meta.requiresAuth) {
    // 验证用户是否已登录
    if (!authService.isLoggedIn()) {
      message.error('请先登录以访问此页面')
      next('/')
      return
    }
  }
  
  next()
})

export default router