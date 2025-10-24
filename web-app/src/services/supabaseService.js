// Supabase数据库服务
import { createClient } from '@supabase/supabase-js'

class SupabaseService {
  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    
    try {
      if (this.supabaseUrl && this.supabaseKey) {
        this.client = createClient(this.supabaseUrl, this.supabaseKey)
        console.log('Supabase客户端初始化成功')
      } else {
        console.warn('Supabase配置未找到，功能将受限')
        this.client = null
      }
    } catch (error) {
      console.error('Supabase初始化失败:', error)
      this.client = null
    }
  }

  // 验证UUID格式
  isValidUUID(id) {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // 获取所有行程列表
  async getPlans() {
    try {
      console.log('获取行程列表...')
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      const { data: plans, error } = await this.client
        .from('travel_plans')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('获取行程列表失败:', error)
        return { success: false, error: `获取行程列表失败: ${error.message}` }
      }
      
      console.log(`成功获取${plans?.length || 0}个行程`)
      return { success: true, data: plans || [] }
    } catch (error) {
      console.error('获取行程列表时发生异常:', error)
      return { success: false, error: `获取失败: ${error.message}` }
    }
  }

  // 保存行程
  async savePlan(planData) {
    try {
      console.log('保存行程:', planData)
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      const { data: plan, error } = await this.client
        .from('travel_plans')
        .insert([{
          title: planData.title,
          description: planData.description || '',
          days: planData.days,
          budget: planData.budget,
          travelers: planData.travelers,
          destination: planData.destination || '',
          status: planData.status || 'planning',
          is_ai_generated: planData.is_ai_generated || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
      
      if (error) {
        console.error('保存行程失败:', error)
        return { success: false, error: `保存行程失败: ${error.message}` }
      }
      
      console.log('行程保存成功，ID:', plan[0].id)
      return { success: true, data: plan[0] }
    } catch (error) {
      console.error('保存行程时发生异常:', error)
      return { success: false, error: `保存失败: ${error.message}` }
    }
  }

  // 删除行程
  async deletePlan(planId) {
    try {
      console.log('删除行程，ID:', planId)
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      // 首先删除关联的活动
      const { error: activitiesError } = await this.client
        .from('plan_activities')
        .delete()
        .eq('plan_id', planId)
      
      if (activitiesError) {
        console.error('删除关联活动失败:', activitiesError)
        return { success: false, error: `删除关联活动失败: ${activitiesError.message}` }
      }
      
      // 然后删除行程
      const { error } = await this.client
        .from('travel_plans')
        .delete()
        .eq('id', planId)
      
      if (error) {
        console.error('删除行程失败:', error)
        return { success: false, error: `删除行程失败: ${error.message}` }
      }
      
      console.log('行程删除成功')
      return { success: true }
    } catch (error) {
      console.error('删除行程时发生异常:', error)
      return { success: false, error: `删除失败: ${error.message}` }
    }
  }

  // 获取行程详情（包括活动）
  async getPlanDetail(planId) {
    try {
      console.log('获取行程详情，ID:', planId)
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      // 检查planId格式是否为有效的UUID
      if (!this.isValidUUID(planId)) {
        console.warn(`无效的UUID格式: ${planId}，尝试查找默认行程`);
        
        // 尝试获取第一个行程（作为备用方案）
        const { data: plans, error: fetchError } = await this.client
          .from('travel_plans')
          .select('id')
          .limit(1);
        
        if (fetchError || !plans || plans.length === 0) {
          console.error('无法找到有效的行程');
          return { success: false, error: '找不到有效的行程' };
        }
        
        planId = plans[0].id;
        console.log(`使用找到的行程ID: ${planId}`);
      }
      
      // 首先获取行程基本信息
      console.log(`获取行程ID ${planId} 的基本信息...`)
      const { data: planData, error: planError } = await this.client
        .from('travel_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('获取行程基本信息失败:', planError);
        return { success: false, error: `获取行程失败: ${planError.message}` };
      }

      // 然后获取行程活动
      console.log(`获取行程ID ${planId} 的活动...`)
      const { data: activitiesData, error: activitiesError } = await this.client
        .from('plan_activities')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number')
        .order('order_index');

      if (activitiesError) {
        console.error('获取行程活动失败:', activitiesError);
        return { 
          success: true, 
          data: { ...planData, activities: [] },
          warning: `获取活动失败: ${activitiesError.message}`
        };
      }
      
      // 将数据库字段名映射回前端期望的格式
      const mappedActivities = (activitiesData || []).map(activity => ({
        id: activity.id,
        activity_title: activity.title,
        activity_description: activity.description,
        day_number: activity.day_number,
        time_slot: activity.activity_type,
        start_time: activity.start_time,
        end_time: activity.end_time,
        location: activity.location,
        estimated_cost: activity.cost,
        duration_minutes: activity.duration_minutes,
        order_index: activity.order_index
      }));

      return { 
        success: true, 
        data: { ...planData, activities: mappedActivities }
      };
    } catch (error) {
      console.error('获取行程详情时发生异常:', error);
      return { success: false, error: `获取失败: ${error.message}` };
    }
  }

  // 保存行程活动
  async savePlanActivities(planId, activities) {
    try {
      console.log(`开始保存行程ID ${planId} 的活动，共${activities?.length || 0}个活动`)
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      // 检查planId格式是否为有效的UUID
      if (!this.isValidUUID(planId)) {
        console.error('无效的行程ID格式:', planId)
        return { success: false, error: '无效的行程ID格式' }
      }
      
      // 首先删除行程的所有活动
      const { error: deleteError } = await this.client
        .from('plan_activities')
        .delete()
        .eq('plan_id', planId)
        
      if (deleteError) {
        console.error('删除现有活动失败:', deleteError)
        return { success: false, error: `删除现有活动失败: ${deleteError.message}` }
      }
      
      console.log('现有活动已删除，准备插入新活动')
      
      // 格式化活动数据（修正字段名）
      const formattedActivities = (activities || []).map(activity => ({
        plan_id: planId,
        title: activity.activity_title || '未命名活动',
        description: activity.activity_description || '',
        day_number: activity.day_number || 1,
        activity_type: activity.time_slot || 'general',
        location: activity.location || '',
        cost: activity.estimated_cost || null,
        duration_minutes: activity.duration_minutes || null,
        start_time: activity.start_time || null,
        end_time: activity.end_time || null,
        order_index: activity.order_index || 0
      }))
      
      const { error: insertError } = await this.client
        .from('plan_activities')
        .insert(formattedActivities)

      if (insertError) {
        console.error('插入活动失败:', insertError)
        return { success: false, error: `保存活动失败: ${insertError.message}` }
      }
      
      console.log('活动保存成功')
      
      // 验证保存结果
      const { data: savedActivities } = await this.client
        .from('plan_activities')
        .select('*')
        .eq('plan_id', planId)
      
      console.log(`验证结果：找到${savedActivities?.length || 0}个活动记录`)
      
      return { success: true, data: savedActivities }
    } catch (error) {
      console.error('保存行程活动时发生异常:', error)
      return { success: false, error: `保存失败: ${error.message}` }
    }
  }

  // 保存单个活动（创建或更新）
  async saveActivity(activityData) {
    try {
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      const { id, plan_id, activity_title, activity_description, day_number, time_slot, 
              start_time, end_time, location, estimated_cost, duration_minutes, order_index } = activityData
      
      // 验证必要的字段
      if (!plan_id) {
        return { success: false, error: '缺少行程ID' }
      }
      
      if (!activity_title) {
        return { success: false, error: '缺少活动标题' }
      }
      
      // 准备数据库格式的数据
      const dbActivityData = {
        plan_id,
        title: activity_title,
        description: activity_description || '',
        day_number: day_number || 1,
        activity_type: time_slot || 'general',
        start_time: start_time || null,
        end_time: end_time || null,
        location: location || '',
        cost: estimated_cost ? Number(estimated_cost) : null,
        duration_minutes: duration_minutes ? Number(duration_minutes) : null,
        order_index: order_index || 0
      }
      
      let result
      if (id) {
        // 更新现有活动
        result = await this.client
          .from('plan_activities')
          .update(dbActivityData)
          .eq('id', id)
          .select()
          
        console.log('更新活动成功，ID:', id)
      } else {
        // 创建新活动
        result = await this.client
          .from('plan_activities')
          .insert(dbActivityData)
          .select()
          
        console.log('创建新活动成功')
      }
      
      if (result.error) {
        console.error('保存活动失败:', result.error)
        return { success: false, error: `保存活动失败: ${result.error.message}` }
      }
      
      // 转换回前端期望的格式
      const savedActivity = {
        id: result.data[0].id,
        plan_id: result.data[0].plan_id,
        activity_title: result.data[0].title,
        activity_description: result.data[0].description,
        day_number: result.data[0].day_number,
        time_slot: result.data[0].activity_type,
        start_time: result.data[0].start_time,
        end_time: result.data[0].end_time,
        location: result.data[0].location,
        estimated_cost: result.data[0].cost,
        duration_minutes: result.data[0].duration_minutes,
        order_index: result.data[0].order_index
      }
      
      return { success: true, data: savedActivity }
    } catch (error) {
      console.error('保存活动异常:', error)
      return { success: false, error: `保存失败: ${error.message}` }
    }
  }
  
  // 删除单个活动
  async deleteActivity(activityId) {
    try {
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      const { error } = await this.client
        .from('plan_activities')
        .delete()
        .eq('id', activityId)
        
      if (error) {
        console.error('删除活动失败:', error)
        return { success: false, error: `删除活动失败: ${error.message}` }
      }
      
      console.log('活动删除成功')
      return { success: true }
    } catch (error) {
      console.error('删除活动异常:', error)
      return { success: false, error: `删除失败: ${error.message}` }
    }
  }
  
  // 创建测试行程和活动
  async createTestPlanWithActivities() {
    try {
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      console.log('创建测试行程...')
      
      // 首先创建一个测试行程
      const { data: planData, error: planError } = await this.client
        .from('travel_plans')
        .insert([{
          title: '测试行程',
          description: '这是一个测试行程，用于验证活动显示功能',
          days: 2,
          budget: 1000,
          travelers: 2,
          destination: '测试城市',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        
      if (planError) {
        console.error('创建测试行程失败:', planError)
        return { success: false, error: `创建行程失败: ${planError.message}` }
      }
      
      const planId = planData[0].id
      console.log(`测试行程创建成功，ID: ${planId}`)
      
      // 创建测试活动
      const testActivities = [
        {
          plan_id: planId,
          title: '上午参观博物馆',
          description: '参观当地著名博物馆',
          day_number: 1,
          activity_type: 'morning',
          location: '市中心博物馆',
          cost: 100,
          duration_minutes: 120,
          order_index: 0
        },
        {
          plan_id: planId,
          title: '下午购物',
          description: '在商业区购物',
          day_number: 1,
          activity_type: 'afternoon',
          location: '购物广场',
          cost: 200,
          duration_minutes: 180,
          order_index: 1
        },
        {
          plan_id: planId,
          title: '第二天观光',
          description: '城市观光一日游',
          day_number: 2,
          activity_type: 'general',
          location: '城市各处',
          cost: 300,
          duration_minutes: 240,
          order_index: 0
        }
      ]
      
      const { error: activitiesError } = await this.client
        .from('plan_activities')
        .insert(testActivities)
        
      if (activitiesError) {
        console.error('创建测试活动失败:', activitiesError)
        return { success: false, error: `创建活动失败: ${activitiesError.message}` }
      }
      
      console.log('测试活动创建成功，共3个活动')
      return { success: true, data: { planId, activities: testActivities } }
    } catch (error) {
      console.error('创建测试数据异常:', error)
      return { success: false, error: `创建失败: ${error.message}` }
    }
  }
}

export default new SupabaseService()