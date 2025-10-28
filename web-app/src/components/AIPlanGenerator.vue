<template>
  <div class="ai-plan-generator">
    <!-- AI规划按钮 -->
    <a-button 
      type="primary" 
      size="large" 
      @click="showAIModal = true"
      class="ai-plan-btn"
    >
      <template #icon><RobotOutlined /></template>
      AI智能规划
    </a-button>

    <!-- AI规划模态框 -->
    <a-modal
      v-model:open="showAIModal"
      title="AI智能旅行规划"
      width="800px"
      :confirm-loading="generating"
      :ok-text="generating ? '生成中...' : '开始规划'"
      @ok="handleAIGenerate"
      @cancel="handleCancel"
    >
      <a-form
        ref="aiFormRef"
        :model="aiForm"
        :rules="aiRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="目的地" name="destination">
              <a-input 
                v-model:value="aiForm.destination" 
                placeholder="例如：北京、上海、杭州"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="旅行天数" name="days">
              <a-select v-model:value="aiForm.days" placeholder="选择天数">
                <a-select-option :value="1">1天</a-select-option>
                <a-select-option :value="2">2天</a-select-option>
                <a-select-option :value="3">3天</a-select-option>
                <a-select-option :value="4">4天</a-select-option>
                <a-select-option :value="5">5天</a-select-option>
                <a-select-option :value="7">7天</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="预算（元）" name="budget">
              <a-input-number 
                v-model:value="aiForm.budget" 
                :min="100" 
                :max="100000"
                style="width: 100%"
                placeholder="总预算金额"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="出行人数" name="travelers">
              <a-input-number 
                v-model:value="aiForm.travelers" 
                :min="1" 
                :max="10"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="兴趣偏好" name="interests">
          <a-checkbox-group v-model:value="aiForm.interests">
            <a-checkbox value="culture">文化历史</a-checkbox>
            <a-checkbox value="nature">自然风光</a-checkbox>
            <a-checkbox value="food">美食体验</a-checkbox>
            <a-checkbox value="shopping">购物休闲</a-checkbox>
            <a-checkbox value="adventure">冒险探索</a-checkbox>
            <a-checkbox value="relaxation">放松度假</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item label="旅行风格" name="travelStyle">
          <a-radio-group v-model:value="aiForm.travelStyle">
            <a-radio value="budget">经济实惠</a-radio>
            <a-radio value="comfort">舒适享受</a-radio>
            <a-radio value="luxury">奢华体验</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="特殊要求" name="specialRequirements">
          <a-textarea 
            v-model:value="aiForm.specialRequirements" 
            placeholder="例如：带老人小孩、饮食禁忌、特殊需求等"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 规划结果展示 -->
    <a-modal
      v-model:open="showResultModal"
      title="AI旅行规划结果"
      width="900px"
      :footer="null"
    >
      <div v-if="aiPlanResult" class="ai-plan-result">
        <a-alert 
          message="AI为您生成的旅行计划" 
          description="以下是根据您的需求智能生成的详细行程安排"
          type="success"
          show-icon
          class="result-alert"
        />

        <div class="plan-summary">
          <h3>{{ aiPlanResult.title }}</h3>
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="天数">{{ aiPlanResult.days }}天</a-descriptions-item>
            <a-descriptions-item label="预算">¥{{ aiPlanResult.budget }}</a-descriptions-item>
            <a-descriptions-item label="出行人数">{{ aiForm.travelers }}人</a-descriptions-item>
            <a-descriptions-item label="目的地">{{ aiForm.destination }}</a-descriptions-item>
          </a-descriptions>
        </div>

        <div class="itinerary-section">
          <h4>📅 每日行程安排</h4>
          <a-timeline>
            <a-timeline-item 
              v-for="(day, index) in aiPlanResult.itinerary" 
              :key="index"
            >
              <template #dot>
                <a-tag color="blue">第{{ index + 1 }}天</a-tag>
              </template>
              <div class="day-activities">
                <div v-for="(activity, i) in day.activities" :key="i" class="activity">
                  • {{ activity }}
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>

        <div class="tips-section">
          <h4>💡 旅行贴士</h4>
          <a-list size="small">
            <a-list-item v-for="(tip, index) in aiPlanResult.tips" :key="index">
              {{ tip }}
            </a-list-item>
          </a-list>
        </div>

        <div class="action-buttons">
          <a-button type="primary" @click="saveAIPlan">
            <template #icon><SaveOutlined /></template>
            保存为我的行程
          </a-button>
          <a-button @click="regeneratePlan">
            <template #icon><ReloadOutlined /></template>
            重新生成
          </a-button>
          <a-button @click="showResultModal = false">关闭</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import mistralService from '../services/mistralService'
import supabaseAuthService from '../services/supabaseAuthService'
import authService from '../services/authService'

const router = useRouter()

const emit = defineEmits(['plan-saved'])

const showAIModal = ref(false)
const showResultModal = ref(false)
const generating = ref(false)
const aiFormRef = ref()

const aiForm = ref({
  destination: '',
  days: 3,
  budget: 2000,
  travelers: 2,
  interests: ['culture', 'food'],
  travelStyle: 'comfort',
  specialRequirements: ''
})

const aiRules = {
  destination: [{ required: true, message: '请输入目的地', trigger: 'blur' }],
  days: [{ required: true, message: '请选择旅行天数', trigger: 'change' }],
  budget: [{ required: true, message: '请输入预算', trigger: 'blur' }],
  travelers: [{ required: true, message: '请输入出行人数', trigger: 'blur' }]
}

const aiPlanResult = ref(null)

const handleAIGenerate = async () => {
  try {
    await aiFormRef.value.validate()
    generating.value = true
    
    // 调用Mistral AI服务生成规划
    const plan = await mistralService.generateTravelPlan(aiForm.value)
    aiPlanResult.value = plan
    
    showAIModal.value = false
    showResultModal.value = true
    
    message.success('AI规划生成成功！')
  } catch (error) {
    console.error('AI规划生成失败:', error)
    message.error('规划生成失败，请检查输入信息')
  } finally {
    generating.value = false
  }
}

const handleCancel = () => {
  showAIModal.value = false
  aiFormRef.value.resetFields()
}

// 保存AI生成的行程
const saveAIPlan = async () => {
  try {
    if (!aiPlanResult.value) {
      message.error('没有可保存的行程')
      return
    }
    
    const saving = ref(true)
    
    // 准备保存数据
    const planData = {
      title: aiPlanResult.value.title || `${aiForm.value.destination}${aiForm.value.days}日游`,
      description: `AI生成的${aiForm.value.destination}旅行计划`,
      destination: aiForm.value.destination,
      days: parseInt(aiForm.value.days),
      budget: parseFloat(aiForm.value.budget),
      travelers: parseInt(aiForm.value.travelers),
      status: 'planning',
      is_ai_generated: true,
      created_by_ai: true
    }
    
    // 检查用户是否已登录
    if (!authService.isLoggedIn()) {
      throw new Error('请先登录后再保存行程')
    }
    
    // 保存行程基本信息到用户专属数据库
    const result = await supabaseAuthService.saveUserPlan(planData)
    
    if (!result.success) {
      throw new Error(result.error || '保存行程失败')
    }
    
    const savedPlan = result.data
    
    // 转换活动数据格式（支持新的JSON格式）
    const activities = []
    if (aiPlanResult.value.itinerary && Array.isArray(aiPlanResult.value.itinerary)) {
      aiPlanResult.value.itinerary.forEach((day, dayIndex) => {
        if (day.activities && Array.isArray(day.activities)) {
          day.activities.forEach((activity, activityIndex) => {
            // 处理新的JSON格式活动数据
            const activityData = {
              plan_id: savedPlan.id,
              day_number: day.day || dayIndex + 1,
              order_index: activityIndex,
              activity_title: activity.activity_title || activity.name || '活动',
              activity_description: activity.activity_description || activity.description || `第${dayIndex + 1}天的第${activityIndex + 1}个活动`,
              location: activity.location || aiForm.value.destination,
              time_slot: activity.time_slot || ['morning', 'afternoon', 'evening'][activityIndex % 3],
              start_time: activity.start_time || '09:00',
              end_time: activity.end_time || '12:00',
              duration_minutes: activity.duration_minutes || 180,
              estimated_cost: activity.estimated_cost || Math.floor(Math.random() * 200) + 50,
              transportation: activity.transportation || '步行/公共交通',
              travel_time: activity.travel_time || '30分钟'
            }
            
            // 验证并修正时间数据
            if (!activityData.start_time || !activityData.end_time) {
              // 生成合理的时间安排
              const timeSlots = ['08:00', '10:00', '13:00', '15:00', '18:00', '20:00']
              activityData.start_time = timeSlots[activityIndex % timeSlots.length]
              activityData.end_time = timeSlots[(activityIndex + 1) % timeSlots.length]
            }
            
            // 根据时间段设置合理的持续时间
            if (!activityData.duration_minutes) {
              switch (activityData.time_slot) {
                case 'morning': activityData.duration_minutes = 180; break
                case 'afternoon': activityData.duration_minutes = 240; break
                case 'evening': activityData.duration_minutes = 120; break
                default: activityData.duration_minutes = 180
              }
            }
            
            activities.push(activityData)
          })
        }
      })
    }
    
    // 保存活动到用户专属数据库
    await supabaseAuthService.saveUserPlanActivities(savedPlan.id, activities)
    
    message.success('行程保存成功')
    showResultModal.value = false
    
    // 跳转到行程详情页
    router.push(`/plan/${savedPlan.id}`)
  } catch (error) {
    console.error('保存行程失败:', error)
    message.error('保存行程失败，请重试')
  }
}

const regeneratePlan = async () => {
  showResultModal.value = false
  showAIModal.value = true
}

// 获取时间段函数（根据活动索引）
const getTimeSlotByIndex = (index) => {
  const slots = ['morning', 'afternoon', 'evening']
  return slots[index % slots.length]
}

// 计算总天数
const calculateTotalDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays > 0 ? diffDays : 1;
};

// 计算总预算
const calculateTotalBudget = (dailyBudget, days) => {
  if (!dailyBudget || !days) return 0;
  return parseFloat(dailyBudget) * parseInt(days);
};

// 计算日均预算
const calculateDailyBudget = (totalBudget, days) => {
  if (!totalBudget || !days || parseInt(days) === 0) return 0;
  return parseFloat(totalBudget) / parseInt(days);
}
</script>

<style scoped>
.ai-plan-generator {
  margin: 20px 0;
}

.ai-plan-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.ai-plan-result {
  max-height: 600px;
  overflow-y: auto;
}

.result-alert {
  margin-bottom: 20px;
}

.plan-summary {
  margin: 20px 0;
}

.plan-summary h3 {
  color: #1890ff;
  margin-bottom: 16px;
}

.itinerary-section {
  margin: 30px 0;
}

.itinerary-section h4 {
  color: #52c41a;
  margin-bottom: 16px;
}

.day-activities {
  margin-left: 20px;
}

.activity {
  margin: 4px 0;
  color: #666;
}

.tips-section {
  margin: 30px 0;
}

.tips-section h4 {
  color: #faad14;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

:deep(.ant-timeline-item-content) {
  padding-bottom: 20px;
}

:deep(.ant-list-item) {
  padding: 8px 0;
}
</style>