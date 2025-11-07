import { createRouter, createWebHistory } from 'vue-router'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import adminService from '../services/adminService'
import Home from '../views/Home.vue'
import Plans from '../views/Plans.vue'
import PlanDetail from '../views/PlanDetail.vue'
import Destinations from '../views/Destinations.vue'
import Profile from '../views/Profile.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import UserManagement from '../views/admin/UserManagement.vue'
import AttractionManagement from '../views/admin/AttractionManagement.vue'

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
  },
  { 
    path: '/admin', 
    name: 'AdminLogin', 
    component: AdminLogin 
  },
  { 
    path: '/admin/dashboard', 
    name: 'AdminDashboard', 
    component: AdminDashboard,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/users', 
    name: 'UserManagement', 
    component: UserManagement,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/attractions', 
    name: 'AttractionManagement', 
    component: AttractionManagement,
    meta: { requiresAdmin: true }
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
  
  // 检查路由是否需要管理员权限
  if (to.meta.requiresAdmin) {
    // 管理员路由使用 adminService 检查权限
    if (!adminService.isLoggedIn()) {
      message.error('请先登录管理员账户')
      next('/admin')
      return
    }
  }
  
  next()
})

export default router