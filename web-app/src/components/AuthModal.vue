<template>
  <a-modal
    v-model:visible="visible"
    :title="isLoginMode ? '用户登录' : '用户注册'"
    width="400px"
    :footer="null"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      layout="vertical"
      @finish="handleSubmit"
    >
      <!-- 用户名 -->
      <a-form-item label="用户名" name="username">
        <a-input
          v-model:value="formState.username"
          placeholder="请输入用户名"
          size="large"
        />
      </a-form-item>

      <!-- 显示名称（仅注册时显示） -->
      <a-form-item v-if="!isLoginMode" label="显示名称" name="displayName">
        <a-input
          v-model:value="formState.displayName"
          placeholder="请输入显示名称（可选）"
          size="large"
        />
      </a-form-item>

      <!-- 邮箱（仅注册时显示） -->
      <a-form-item v-if="!isLoginMode" label="邮箱" name="email">
        <a-input
          v-model:value="formState.email"
          placeholder="请输入邮箱（可选）"
          size="large"
        />
      </a-form-item>

      <!-- 密码 -->
      <a-form-item label="密码" name="password">
        <a-input-password
          v-model:value="formState.password"
          placeholder="请输入密码"
          size="large"
        />
      </a-form-item>

      <!-- 确认密码（仅注册时显示） -->
      <a-form-item v-if="!isLoginMode" label="确认密码" name="confirmPassword">
        <a-input-password
          v-model:value="formState.confirmPassword"
          placeholder="请再次输入密码"
          size="large"
        />
      </a-form-item>

      <!-- 提交按钮 -->
      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          size="large"
          :loading="loading"
          block
        >
          {{ isLoginMode ? '登录' : '注册' }}
        </a-button>
      </a-form-item>

      <!-- 切换模式 -->
      <div style="text-align: center; margin-top: 16px;">
        <a-button type="link" @click="toggleMode">
          {{ isLoginMode ? '没有账号？立即注册' : '已有账号？立即登录' }}
        </a-button>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'

// 组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  defaultMode: {
    type: String,
    default: 'login' // 'login' 或 'register'
  }
})

// 组件事件
const emit = defineEmits(['update:visible', 'success'])

// 响应式数据
const visible = ref(props.visible)
const isLoginMode = ref(props.defaultMode === 'login')
const loading = ref(false)
const formRef = ref()

// 表单数据
const formState = reactive({
  username: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度必须在3-50个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value) => {
        if (!isLoginMode.value && value !== formState.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  email: [
    {
      type: 'email',
      message: '请输入有效的邮箱地址',
      trigger: 'blur'
    }
  ]
}

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  visible.value = newVal
})

// 监听visible值变化
watch(visible, (newVal) => {
  emit('update:visible', newVal)
  if (!newVal) {
    resetForm()
  }
})

// 监听defaultMode属性变化
watch(() => props.defaultMode, (newVal) => {
  isLoginMode.value = newVal === 'login'
})

// 切换登录/注册模式
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  resetForm()
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formState, {
    username: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
}

// 处理取消
const handleCancel = () => {
  visible.value = false
}

// 处理表单提交
const handleSubmit = async () => {
  loading.value = true
  
  try {
    if (isLoginMode.value) {
      // 显示等待提示
      const loadingMessage = message.loading('正在登录，请稍后...', 0)
      
      // 登录逻辑
      await authService.login(formState.username, formState.password)
      
      // 关闭等待提示并显示成功消息
      loadingMessage()
      message.success('登录成功！')
      emit('success', { mode: 'login', user: authService.getCurrentUser() })
    } else {
      // 显示等待提示
      const loadingMessage = message.loading('正在注册，请稍后...', 0)
      
      // 注册逻辑
      await authService.register({
        username: formState.username,
        password: formState.password,
        confirmPassword: formState.confirmPassword,
        email: formState.email,
        displayName: formState.displayName || formState.username
      })
      
      // 关闭等待提示并显示成功消息
      loadingMessage()
      message.success('注册成功！')
      // 注册成功后自动切换到登录模式
      isLoginMode.value = true
      resetForm()
      message.info('请使用刚才注册的账号登录')
      return // 不关闭弹窗，让用户直接登录
    }
    
    // 登录成功，关闭弹窗
    visible.value = false
  } catch (error) {
    // 关闭等待提示并显示错误消息
    message.destroy()
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// 暴露方法给父组件
const open = (mode = 'login') => {
  isLoginMode.value = mode === 'login'
  visible.value = true
  resetForm()
}

const close = () => {
  visible.value = false
}

// 暴露方法
defineExpose({
  open,
  close
})
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 16px;
}

.ant-btn-link {
  padding: 0;
  height: auto;
}
</style>