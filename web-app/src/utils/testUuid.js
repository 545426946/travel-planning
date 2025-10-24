// 测试UUID处理和行程数据功能
import supabaseService from '../services/supabaseService';

async function testUuidAndData() {
  console.error('===== 开始测试UUID处理和行程数据 =====');
  
  try {
    // 测试UUID验证函数
    console.error('===== 测试UUID验证 =====');
    console.error('"1" 是有效的UUID吗？', supabaseService.isValidUUID('1'));
    console.error('"123e4567-e89b-12d3-a456-426614174000" 是有效的UUID吗？', 
                supabaseService.isValidUUID('123e4567-e89b-12d3-a456-426614174000'));
    
    // 尝试创建测试行程和活动
    console.error('\n===== 创建测试行程和活动 =====');
    const createResult = await supabaseService.createTestPlanWithActivities();
    
    if (createResult.success) {
      const { planId } = createResult.data;
      console.error(`✅ 测试行程创建成功！行程ID: ${planId}`);
      console.error(`📌 请访问: http://localhost:5174/plan/${planId} 来查看行程详情`);
      
      // 立即获取刚创建的行程详情，验证数据是否正确
      console.error('\n===== 获取刚创建的行程详情 =====');
      const planResult = await supabaseService.getPlanDetail(planId);
      
      if (planResult.success) {
        console.error('行程标题:', planResult.data.title);
        console.error('活动数量:', planResult.data.activities?.length || 0);
        if (planResult.data.activities && planResult.data.activities.length > 0) {
          console.error('第一个活动:', JSON.stringify(planResult.data.activities[0], null, 2));
        }
        return planId; // 返回行程ID，用于直接访问
      }
    } else {
      console.error('❌ 创建测试行程失败:', createResult.error);
      
      // 如果创建失败，尝试获取现有行程
      console.error('\n===== 尝试获取第一个现有行程 =====');
      const { data: plans } = await supabaseService.client
        .from('travel_plans')
        .select('id')
        .limit(1);
      
      if (plans && plans.length > 0) {
        const planId = plans[0].id;
        console.error(`找到现有行程，ID: ${planId}`);
        return planId;
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
  
  return null;
}

export default testUuidAndData;