<template>
  <div class="admin-login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>后台管理系统</h1>
        <p>请输入管理员账号信息</p>
      </div>
      
      <a-form
        :model="loginForm"
        name="adminLogin"
        autocomplete="off"
        @finish="onLogin"
        class="login-form"
      >
        <a-form-item
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input
            v-model:value="loginForm.username"
            placeholder="用户名"
            size="large"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
            v-model:value="loginForm.password"
            placeholder="密码"
            size="large"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            size="large"
            block
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>

      <div class="login-footer">
        <a-button type="link" @click="goBack">返回首页</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import adminService from '../../services/adminService'

const router = useRouter()
const loading = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const onLogin = async () => {
  loading.value = true
  
  try {
    const result = await adminService.adminLogin(loginForm.value.username, loginForm.value.password)
    
    if (result.success) {
      message.success('管理员登录成功')
      router.push('/admin/dashboard')
    }
  } catch (error) {
    message.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 8px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #1890ff;
  margin-bottom: 8px;
  font-size: 24px;
}

.login-header p {
  color: #666;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-footer {
  text-align: center;
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .admin-login-container {
    padding: 10px;
  }
}
</style>