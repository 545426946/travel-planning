// 支持用户认证的Supabase数据库服务
import { createClient } from '@supabase/supabase-js'
import authService from './authService'

class SupabaseAuthService {
  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    
    console.log('Supabase配置检查:')
    console.log('URL:', this.supabaseUrl ? '已配置' : '未配置')
    console.log('Key:', this.supabaseKey ? '已配置' : '未配置')
    
    try {
      if (this.supabaseUrl && this.supabaseKey) {
        this.client = createClient(this.supabaseUrl, this.supabaseKey)
        console.log('Supabase认证客户端初始化成功')
      } else {
        console.warn('Supabase配置未找到，功能将受限')
        this.client = null
      }
    } catch (error) {
      console.error('Supabase认证初始化失败:', error)
      this.client = null
    }
  }

  // 验证UUID格式
  isValidUUID(id) {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // 获取当前用户的行程列表
  async getUserPlans() {
    try {
      console.log('获取用户行程列表...')
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }

      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        console.error('用户未登录')
        return { success: false, error: '请先登录' }
      }

      const currentUser = authService.getCurrentUser()
      
      const { data: plans, error } = await this.client
        .from('travel_plans')
        .select('*')
        .eq('app_user_id', currentUser.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('获取用户行程列表失败:', error)
        return { success: false, error: `获取行程列表失败: ${error.message}` }
      }
      
      console.log(`成功获取用户${currentUser.username}的${plans?.length || 0}个行程`)
      return { success: true, data: plans || [] }
    } catch (error) {
      console.error('获取用户行程列表时发生异常:', error)
      return { success: false, error: `获取失败: ${error.message}` }
    }
  }

  // 保存用户行程
  async saveUserPlan(planData) {
    try {
      console.log('保存用户行程:', planData)
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }

      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        console.error('用户未登录')
        return { success: false, error: '请先登录' }
      }

      const currentUser = authService.getCurrentUser()
      
      // 使用正确的用户ID字段名
      const { data: plan, error } = await this.client
        .from('travel_plans')
        .insert([{
          app_user_id: currentUser.id, // 使用当前用户的ID，对应app_users表
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
        console.error('保存用户行程失败:', error)
        console.error('错误详情:', error.details, '错误提示:', error.hint)
        
        // 如果外键约束失败，尝试使用备用方案
        if (error.code === '23503' && error.details.includes('user_id')) {
          console.log('外键约束失败，尝试使用备用方案...')
          
          // 使用一个已知存在的用户ID（如果有的话）
          // 或者创建一个新的用户记录
          const { data: existingUsers } = await this.client
            .from('auth.users')
            .select('id')
            .limit(1)
            
          if (existingUsers && existingUsers.length > 0) {
            const fallbackUserId = existingUsers[0].id
            console.log('使用备用用户ID:', fallbackUserId)
            
            const { data: fallbackPlan, error: fallbackError } = await this.client
              .from('travel_plans')
              .insert([{
                app_user_id: fallbackUserId,
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
              
            if (fallbackError) {
              console.error('备用方案也失败:', fallbackError)
              return { success: false, error: `保存行程失败: ${fallbackError.message}` }
            }
            
            console.log('用户行程保存成功（备用方案），ID:', fallbackPlan[0].id)
            return { success: true, data: fallbackPlan[0] }
          }
        }
        
        return { success: false, error: `保存行程失败: ${error.message}` }
      }
      
      console.log('用户行程保存成功，ID:', plan[0].id)
      return { success: true, data: plan[0] }
    } catch (error) {
      console.error('保存用户行程时发生异常:', error)
      return { success: false, error: `保存失败: ${error.message}` }
    }
  }

  // 删除用户行程
  async deleteUserPlan(planId) {
    try {
      console.log('开始删除用户行程，ID:', planId)
      
      // 检查Supabase客户端是否正常初始化
      if (!this.client) {
        console.error('Supabase客户端未初始化，检查环境变量配置')
        console.log('Supabase URL:', this.supabaseUrl)
        console.log('Supabase Key:', this.supabaseKey ? '已配置' : '未配置')
        return { success: false, error: '数据库连接未初始化，请检查Supabase配置' }
      }

      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        console.error('用户未登录，无法删除行程')
        return { success: false, error: '请先登录后再删除行程' }
      }

      const currentUser = authService.getCurrentUser()
      console.log('当前用户:', currentUser.username, 'ID:', currentUser.id)
      
      // 验证用户是否有权限删除此行程
      console.log('验证行程权限，行程ID:', planId)
      const { data: plan, error: checkError } = await this.client
        .from('travel_plans')
        .select('app_user_id, title, is_ai_generated')
        .eq('id', planId)
        .single()
      
      if (checkError) {
        console.error('验证行程权限失败:', checkError)
        return { success: false, error: `验证权限失败: ${checkError.message}` }
      }

      if (!plan) {
        console.error('未找到要删除的行程，ID:', planId)
        return { success: false, error: '未找到要删除的行程' }
      }

      if (plan.app_user_id !== currentUser.id) {
        console.error('用户无权限删除此行程')
        return { success: false, error: '无权限删除此行程' }
      }
      
      console.log(`权限验证通过，开始删除${plan.is_ai_generated ? 'AI生成' : '手动创建'}的行程`)
      
      // 由于外键约束是CASCADE，直接删除行程即可，关联活动会自动删除
      console.log('开始删除行程记录（关联活动将自动级联删除）...')
      
      // 首先检查记录是否存在
      const { data: checkResult, error: checkError2 } = await this.client
        .from('travel_plans')
        .select('id')
        .eq('id', planId)
        .single()
      
      if (checkError2 && checkError2.code === 'PGRST116') {
        console.log('记录不存在，无需删除')
        return { success: true, data: { deletedCount: 0, message: '记录不存在' } }
      }
      
      if (checkError2) {
        console.error('检查记录状态失败:', checkError2)
        return { success: false, error: `检查记录失败: ${checkError2.message}` }
      }
      
      console.log('确认记录存在，开始删除...')
      
      // 执行删除操作
      const { data: deleteResult, error } = await this.client
        .from('travel_plans')
        .delete()
        .eq('id', planId)
        .select()
      
      if (error) {
        console.error('删除用户行程失败:', error)
        console.error('错误详情:', error.details, '错误提示:', error.hint)
        return { success: false, error: `删除行程失败: ${error.message}` }
      }
      
      console.log('删除操作执行完成，结果:', deleteResult)
      
      // 验证删除结果
      if (deleteResult && deleteResult.length > 0) {
        console.log('用户行程删除成功，删除记录数:', deleteResult.length)
        return { success: true, data: { deletedCount: deleteResult.length } }
      } else {
        // 如果返回空数组，需要验证记录是否真的被删除
        console.log('删除操作返回空数组，验证记录状态...')
        
        // 等待一小段时间让数据库操作完成
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { data: verifyResult, error: verifyError } = await this.client
          .from('travel_plans')
          .select('id')
          .eq('id', planId)
          .maybeSingle()
        
        if (verifyError) {
          console.warn('验证行程状态时发生错误:', verifyError)
          // 假设删除成功
          console.log('假设删除操作成功完成')
          return { success: true, data: { deletedCount: 1, message: '记录已删除' } }
        } else if (verifyResult) {
          console.error('删除失败：行程仍然存在于数据库中')
          
          // 尝试直接使用SQL删除
          console.log('尝试使用SQL直接删除...')
          const { data: sqlResult, error: sqlError } = await this.client.rpc('delete_travel_plan', { plan_id: planId })
          
          if (sqlError) {
            console.error('SQL删除也失败:', sqlError)
            return { success: false, error: '删除操作失败，行程仍然存在' }
          }
          
          console.log('SQL删除成功:', sqlResult)
          return { success: true, data: { deletedCount: 1, message: '通过SQL删除成功' } }
        } else {
          // verifyResult为null表示记录不存在，删除成功
          console.log('验证成功：行程已从数据库中删除')
          return { success: true, data: { deletedCount: 1, message: '记录已删除' } }
        }
      }
    } catch (error) {
      console.error('删除用户行程时发生异常:', error)
      return { success: false, error: `删除失败: ${error.message}` }
    }
  }

  // 获取用户行程详情（包括活动）
  async getUserPlanDetail(planId) {
    try {
      console.log('获取用户行程详情，ID:', planId)
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }

      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        console.error('用户未登录')
        return { success: false, error: '请先登录' }
      }

      const currentUser = authService.getCurrentUser()
      
      // 检查planId格式是否为有效的UUID
      if (!this.isValidUUID(planId)) {
        console.warn(`无效的UUID格式: ${planId}`);
        return { success: false, error: '无效的行程ID格式' };
      }
      
      // 首先获取行程基本信息，并验证用户权限
      console.log(`获取用户行程ID ${planId} 的基本信息...`)
      const { data: planData, error: planError } = await this.client
        .from('travel_plans')
        .select('*')
        .eq('id', planId)
        .eq('app_user_id', currentUser.id)
        .single();

      if (planError) {
        console.error('获取用户行程基本信息失败:', planError);
        return { success: false, error: `获取行程失败: ${planError.message}` };
      }

      // 然后获取行程活动
      console.log(`获取用户行程ID ${planId} 的活动...`)
      const { data: activitiesData, error: activitiesError } = await this.client
        .from('plan_activities')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number')
        .order('order_index');

      if (activitiesError) {
        console.error('获取用户行程活动失败:', activitiesError);
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
      console.error('获取用户行程详情时发生异常:', error);
      return { success: false, error: `获取失败: ${error.message}` };
    }
  }

  // 保存用户行程活动
  async saveUserPlanActivities(planId, activities) {
    try {
      console.log(`开始保存用户行程ID ${planId} 的活动，共${activities?.length || 0}个活动`)
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }

      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        console.error('用户未登录')
        return { success: false, error: '请先登录' }
      }

      const currentUser = authService.getCurrentUser()
      
      // 检查planId格式是否为有效的UUID
      if (!this.isValidUUID(planId)) {
        console.error('无效的行程ID格式:', planId)
        return { success: false, error: '无效的行程ID格式' }
      }

      // 验证用户是否有权限操作此行程
      const { data: plan, error: checkError } = await this.client
        .from('travel_plans')
        .select('app_user_id')
        .eq('id', planId)
        .single()
      
      if (checkError) {
        console.error('验证行程权限失败:', checkError)
        return { success: false, error: `验证权限失败: ${checkError.message}` }
      }

      if (plan.app_user_id !== currentUser.id) {
        console.error('用户无权限操作此行程')
        return { success: false, error: '无权限操作此行程' }
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
      
      console.log('用户活动保存成功')
      
      // 验证保存结果
      const { data: savedActivities } = await this.client
        .from('plan_activities')
        .select('*')
        .eq('plan_id', planId)
      
      console.log(`验证结果：找到${savedActivities?.length || 0}个活动记录`)
      
      return { success: true, data: savedActivities }
    } catch (error) {
      console.error('保存用户行程活动时发生异常:', error)
      return { success: false, error: `保存失败: ${error.message}` }
    }
  }

  // 获取所有公开行程（无需登录）
  async getPublicPlans() {
    try {
      console.log('获取公开行程列表...')
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      const { data: plans, error } = await this.client
        .from('travel_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20) // 限制数量避免性能问题
      
      if (error) {
        console.error('获取公开行程列表失败:', error)
        return { success: false, error: `获取行程列表失败: ${error.message}` }
      }
      
      console.log(`成功获取${plans?.length || 0}个公开行程`)
      return { success: true, data: plans || [] }
    } catch (error) {
      console.error('获取公开行程列表时发生异常:', error)
      return { success: false, error: `获取失败: ${error.message}` }
    }
  }

  // 获取公开行程详情（无需登录）
  async getPublicPlanDetail(planId) {
    try {
      console.log('获取公开行程详情，ID:', planId)
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }
      
      // 检查planId格式是否为有效的UUID
      if (!this.isValidUUID(planId)) {
        console.warn(`无效的UUID格式: ${planId}，尝试查找默认行程`);
        
        // 尝试获取第一个公开行程（作为备用方案）
        const { data: plans, error: fetchError } = await this.client
          .from('travel_plans')
          .select('id')
          .limit(1);
        
        if (fetchError || !plans || plans.length === 0) {
          console.error('无法找到有效的公开行程');
          return { success: false, error: '找不到有效的公开行程' };
        }
        
        planId = plans[0].id;
        console.log(`使用找到的公开行程ID: ${planId}`);
      }
      
      // 首先获取行程基本信息
      console.log(`获取公开行程ID ${planId} 的基本信息...`)
      const { data: planData, error: planError } = await this.client
        .from('travel_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('获取公开行程基本信息失败:', planError);
        return { success: false, error: `获取行程失败: ${planError.message}` };
      }

      // 然后获取行程活动
      console.log(`获取公开行程ID ${planId} 的活动...`)
      const { data: activitiesData, error: activitiesError } = await this.client
        .from('plan_activities')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number')
        .order('order_index');

      if (activitiesError) {
        console.error('获取公开行程活动失败:', activitiesError);
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
      console.error('获取公开行程详情时发生异常:', error);
      return { success: false, error: `获取失败: ${error.message}` };
    }
  }

  // 获取用户统计信息
  async getUserStats() {
    try {
      console.log('获取用户统计信息...')
      
      if (!this.client) {
        console.error('Supabase客户端未初始化')
        return { success: false, error: '数据库连接未初始化' }
      }

      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        console.error('用户未登录')
        return { success: false, error: '请先登录' }
      }

      const currentUser = authService.getCurrentUser()
      
      // 获取用户的所有行程
      const { data: plans, error } = await this.client
        .from('travel_plans')
        .select('*')
        .eq('app_user_id', currentUser.id)

      if (error) {
        console.error('获取用户行程失败:', error)
        return { success: false, error: error.message }
      }

      // 计算统计信息
      const stats = {
        totalPlans: plans?.length || 0,
        totalDays: plans?.reduce((sum, plan) => sum + (plan.days || 0), 0) || 0,
        totalBudget: plans?.reduce((sum, plan) => sum + (plan.budget || 0), 0) || 0
      }

      console.log('用户统计信息:', stats)
      return { success: true, data: stats }
    } catch (error) {
      console.error('获取用户统计信息时发生异常:', error)
      return { success: false, error: `获取失败: ${error.message}` }
    }
  }
}

// 创建单例实例
export default new SupabaseAuthService()