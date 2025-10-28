<template>
  <div class="plans">
    <div class="page-header">
      <h1>行程规划</h1>
      <p>创建属于你的完美旅行计划</p>
    </div>

    <!-- 创建新行程 -->
    <a-card class="create-plan-card">
      <div class="create-plan-header">
        <h2>创建新行程</h2>
        <a-space :size="16">
          <a-button type="primary" size="large" @click="showCreateModal = true">
            <template #icon><PlusOutlined /></template>
            手动创建
          </a-button>
          <AIPlanGenerator @plan-saved="handlePlanSaved" />
        </a-space>
      </div>
    </a-card>

    <!-- 我的行程列表 -->
    <a-card title="我的行程" class="plans-list-card">
      <a-list
        :data-source="plans"
        :loading="loading"
        item-layout="horizontal"
      >
        <template #renderItem="{ item }">
          <a-list-item class="plan-item">
            <a-list-item-meta
              :title="item.title"
              :description="item.description"
            >
              <template #avatar>
                <a-avatar>{{ item.icon }}</a-avatar>
              </template>
            </a-list-item-meta>
            
            <div class="plan-info">
              <a-space>
                <span><CalendarOutlined /> {{ item.days }}天</span>
                <span><DollarOutlined /> ¥{{ item.budget }}</span>
                <span><UserOutlined /> {{ item.travelers }}人</span>
              </a-space>
            </div>
            
            <template #actions>
              <a-button type="link" @click="viewPlan(item)">
                <template #icon><EyeOutlined /></template>
                查看
              </a-button>
              <a-button type="link" danger @click="deletePlan(item)">
                <template #icon><DeleteOutlined /></template>
                删除
              </a-button>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-card>

    <!-- 创建行程模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      title="创建新行程"
      width="600px"
      :confirm-loading="creating"
      @ok="handleCreatePlan"
      @cancel="handleCancelCreate"
    >
      <a-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        layout="vertical"
      >
        <a-form-item label="行程标题" name="title">
          <a-input v-model:value="createForm.title" placeholder="请输入行程标题" />
        </a-form-item>
        
        <a-form-item label="行程描述" name="description">
          <a-textarea 
            v-model:value="createForm.description" 
            placeholder="请输入行程描述"
            :rows="3"
          />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="行程天数" name="days">
              <a-input-number 
                v-model:value="createForm.days" 
                :min="1" 
                :max="30"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="出行人数" name="travelers">
              <a-input-number 
                v-model:value="createForm.travelers" 
                :min="1" 
                :max="10"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="预算（元）" name="budget">
          <a-input-number 
            v-model:value="createForm.budget" 
            :min="0" 
            :max="100000"
            style="width: 100%"
            :formatter="value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          />
        </a-form-item>
        
        <a-form-item label="目的地" name="destination">
          <a-select v-model:value="createForm.destination" placeholder="请选择目的地">
            <a-select-option value="beijing">北京</a-select-option>
            <a-select-option value="shanghai">上海</a-select-option>
            <a-select-option value="hangzhou">杭州</a-select-option>
            <a-select-option value="chengdu">成都</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  PlusOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  UserOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import AIPlanGenerator from '../components/AIPlanGenerator.vue'
import supabaseAuthService from '../services/supabaseAuthService'
import authService from '../services/authService'

const router = useRouter()

const loading = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)
const createFormRef = ref()

const createForm = ref({
  title: '',
  description: '',
  days: 3,
  travelers: 2,
  budget: 2000,
  destination: ''
})

const createRules = {
  title: [{ required: true, message: '请输入行程标题', trigger: 'blur' }],
  days: [{ required: true, message: '请输入行程天数', trigger: 'blur' }],
  budget: [{ required: true, message: '请输入预算', trigger: 'blur' }]
}

const plans = ref([
  {
    id: 1,
    title: '北京文化之旅',
    description: '探索故宫、长城等历史文化景点',
    icon: '🏯',
    days: 3,
    budget: 2500,
    travelers: 2,
    status: 'planning'
  },
  {
    id: 2,
    title: '上海现代游',
    description: '体验上海的现代化都市魅力',
    icon: '🏙️',
    days: 2,
    budget: 1800,
    travelers: 1,
    status: 'completed'
  }
])

const handleCreatePlan = async () => {
  try {
    await createFormRef.value.validate()
    creating.value = true
    
    // 检查用户是否已登录
    if (!authService.isLoggedIn()) {
      message.error('请先登录后再创建行程')
      return
    }
    
    // 保存到用户专属数据库
    const result = await supabaseAuthService.saveUserPlan({
      title: createForm.value.title,
      description: createForm.value.description,
      days: createForm.value.days,
      budget: createForm.value.budget,
      travelers: createForm.value.travelers,
      destination: createForm.value.destination,
      status: 'planning',
      is_ai_generated: false
    })
    
    if (result.success) {
      message.success('行程创建成功')
      showCreateModal.value = false
      resetCreateForm()
      // 重新加载用户行程列表
      loadPlans()
    } else {
      message.error('创建失败：' + result.error)
    }
  } catch (error) {
    console.error('创建行程失败:', error)
    message.error('创建失败，请重试')
  } finally {
    creating.value = false
  }
}

const handleCancelCreate = () => {
  showCreateModal.value = false
  resetCreateForm()
}

const resetCreateForm = () => {
  createForm.value = {
    title: '',
    description: '',
    days: 3,
    travelers: 2,
    budget: 2000,
    destination: ''
  }
}

const handlePlanSaved = (plan) => {
  // 重新加载行程列表
  loadPlans()
  message.success('AI行程已保存到数据库')
}

const viewPlan = (plan) => {
  router.push(`/plan/${plan.id}`)
}

const deletePlan = async (plan) => {
  try {
    const result = await supabaseAuthService.deleteUserPlan(plan.id)
    if (result.success) {
      plans.value = plans.value.filter(p => p.id !== plan.id)
      message.success('行程已删除')
    } else {
      message.error('删除失败：' + result.error)
    }
  } catch (error) {
    console.error('删除行程失败:', error)
    message.error('删除失败，请重试')
  }
}

// 从数据库加载用户专属行程数据
const loadPlans = async () => {
  loading.value = true
  try {
    // 检查用户是否已登录
    if (!authService.isLoggedIn()) {
      // 用户未登录，显示空列表
      plans.value = []
      return
    }
    
    const result = await supabaseAuthService.getUserPlans()
    if (result.success) {
      plans.value = result.data.map(plan => ({
        ...plan,
        icon: plan.is_ai_generated ? '🤖' : '✈️'
      }))
    } else {
      message.error('加载行程失败：' + result.error)
    }
  } catch (error) {
    console.error('加载行程失败:', error)
    message.error('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 加载行程数据
  loadPlans()
})
</script>

<style scoped>
.plans {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 80px);
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1f2937;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header p {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 400;
}

.create-plan-card {
  margin-bottom: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.create-plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.create-plan-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.plans-list-card {
  margin-top: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.plan-item {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.plan-item:hover {
  background-color: #f8fafc;
  transform: translateY(-1px);
}

.plan-info {
  margin-top: 8px;
}

.plan-info .ant-space {
  color: #6b7280;
  font-size: 0.9rem;
}

.plan-item:last-child {
  border-bottom: none;
}

:deep(.ant-avatar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

:deep(.ant-list-item-meta-title) {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

:deep(.ant-list-item-meta-description) {
  color: #6b7280;
  font-size: 0.9rem;
}

:deep(.ant-btn-link) {
  color: #667eea;
  font-weight: 500;
}

:deep(.ant-btn-link:hover) {
  color: #764ba2;
}

:deep(.ant-btn-link[type="danger"]) {
  color: #f56565;
}

:deep(.ant-btn-link[type="danger"]:hover) {
  color: #e53e3e;
}

@media (max-width: 768px) {
  .plans {
    padding: 20px 16px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .create-plan-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .plan-item {
    padding: 16px;
  }
  
  :deep(.ant-list-item-extra) {
    margin-top: 12px;
  }
}
</style>