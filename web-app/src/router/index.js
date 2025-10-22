import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Plans from '../views/Plans.vue'
import PlanDetail from '../views/PlanDetail.vue'
import Destinations from '../views/Destinations.vue'
import Profile from '../views/Profile.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/plans', name: 'Plans', component: Plans },
  { path: '/plan/:id', name: 'PlanDetail', component: PlanDetail },
  { path: '/destinations', name: 'Destinations', component: Destinations },
  { path: '/profile', name: 'Profile', component: Profile }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router