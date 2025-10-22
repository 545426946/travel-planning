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
                v-if="!user" 
                type="primary" 
                @click="showLoginModal = true"
              >
                登录/注册
              </a-button>
              <a-dropdown v-else>
                <a-space>
                  <a-avatar :src="user.avatar" />
                  <span>{{ user.username }}</span>
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

      <!-- 登录模态框 -->
      <a-modal
        v-model:open="showLoginModal"
        title="登录/注册"
        :footer="null"
        width="400px"
      >
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="login" tab="登录">
            <a-form
              :model="loginForm"
              @finish="handleLogin"
              layout="vertical"
            >
              <a-form-item label="邮箱地址" name="email">
                <a-input v-model:value="loginForm.email" />
              </a-form-item>
              <a-form-item label="密码" name="password">
                <a-input-password v-model:value="loginForm.password" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" html-type="submit" block>
                  登录
                </a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>
          
          <a-tab-pane key="register" tab="注册">
            <a-form
              :model="registerForm"
              @finish="handleRegister"
              layout="vertical"
            >
              <a-form-item label="用户名" name="username">
                <a-input v-model:value="registerForm.username" />
              </a-form-item>
              <a-form-item label="邮箱地址" name="email">
                <a-input v-model:value="registerForm.email" />
              </a-form-item>
              <a-form-item label="密码" name="password">
                <a-input-password v-model:value="registerForm.password" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" html-type="submit" block>
                  注册
                </a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </a-modal>
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => [route.path])
const showLoginModal = ref(false)
const activeTab = ref('login')
const user = ref(null)

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: ''
})

const handleMenuClick = ({ key }) => {
  router.push(key)
}

const handleLogin = async () => {
  try {
    // 模拟登录成功
    user.value = {
      username: '用户',
      email: loginForm.value.email,
      avatar: null
    }
    showLoginModal.value = false
    message.success('登录成功')
  } catch (error) {
    message.error('登录失败')
  }
}

const handleRegister = async () => {
  try {
    // 模拟注册成功
    user.value = {
      username: registerForm.value.username,
      email: registerForm.value.email,
      avatar: null
    }
    showLoginModal.value = false
    message.success('注册成功')
  } catch (error) {
    message.error('注册失败')
  }
}

const logout = () => {
  user.value = null
  message.success('已退出登录')
}

onMounted(() => {
  // 检查用户登录状态
  // 这里可以添加实际的登录状态检查逻辑
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