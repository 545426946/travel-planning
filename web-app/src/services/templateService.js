// 模板数据服务 - 用于管理旅游模板的数据库操作
import { createClient } from '@supabase/supabase-js'

class TemplateService {
  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    
    console.log('模板服务初始化 - Supabase URL:', this.supabaseUrl ? '已配置' : '未配置')
    console.log('模板服务初始化 - Supabase Key:', this.supabaseKey ? '已配置' : '未配置')
    
    try {
      if (this.supabaseUrl && this.supabaseKey) {
        this.client = createClient(this.supabaseUrl, this.supabaseKey)
        console.log('模板服务初始化成功')
      } else {
        console.warn('Supabase配置未找到，模板服务将使用本地数据')
        this.client = null
      }
    } catch (error) {
      console.error('模板服务初始化失败:', error)
      this.client = null
    }

    // 定义完整的旅游模板数据
    this.defaultTemplates = [
      // 北京模板
      {
        id: 1,
        destination: '北京',
        title: '北京3日文化游',
        description: '故宫、长城、颐和园经典路线',
        days: 3,
        budget: 1500,
        activities: [
          { day: 1, title: '故宫博物院', description: '参观明清皇宫建筑群' },
          { day: 1, title: '天安门广场', description: '感受国家政治中心' },
          { day: 2, title: '八达岭长城', description: '登长城，感受古代军事防御工程' },
          { day: 3, title: '颐和园', description: '游览皇家园林' }
        ]
      },
      {
        id: 2,
        destination: '北京',
        title: '北京5日深度游',
        description: '全面体验北京历史文化',
        days: 5,
        budget: 2500,
        activities: [
          { day: 1, title: '故宫+景山公园', description: '深度游览故宫' },
          { day: 2, title: '天坛+前门大街', description: '感受老北京风情' },
          { day: 3, title: '长城一日游', description: '八达岭或慕田峪长城' },
          { day: 4, title: '颐和园+圆明园', description: '皇家园林之旅' },
          { day: 5, title: '798艺术区', description: '现代艺术体验' }
        ]
      },
      // 上海模板
      {
        id: 3,
        destination: '上海',
        title: '上海2日现代游',
        description: '外滩、迪士尼、陆家嘴',
        days: 2,
        budget: 1200,
        activities: [
          { day: 1, title: '外滩', description: '欣赏黄浦江两岸风光' },
          { day: 1, title: '南京路步行街', description: '购物休闲' },
          { day: 2, title: '迪士尼乐园', description: '全天游玩' }
        ]
      },
      {
        id: 4,
        destination: '上海',
        title: '上海3日都市游',
        description: '全面体验魔都魅力',
        days: 3,
        budget: 1800,
        activities: [
          { day: 1, title: '外滩+豫园', description: '感受上海历史与现代交融' },
          { day: 2, title: '迪士尼乐园', description: '童话世界一日游' },
          { day: 3, title: '陆家嘴+新天地', description: '现代都市体验' }
        ]
      },
      // 杭州模板
      {
        id: 5,
        destination: '杭州',
        title: '杭州2日西湖游',
        description: '西湖、灵隐寺、龙井茶园',
        days: 2,
        budget: 800,
        activities: [
          { day: 1, title: '西湖十景', description: '漫步西湖，欣赏断桥残雪' },
          { day: 1, title: '灵隐寺', description: '参观千年古刹' },
          { day: 2, title: '龙井茶园', description: '体验采茶文化' }
        ]
      },
      {
        id: 6,
        destination: '杭州',
        title: '杭州3日深度游',
        description: '全面感受江南水乡魅力',
        days: 3,
        budget: 1200,
        activities: [
          { day: 1, title: '西湖+雷峰塔', description: '深度游览西湖景区' },
          { day: 2, title: '灵隐寺+飞来峰', description: '佛教文化体验' },
          { day: 3, title: '西溪湿地', description: '自然生态之旅' }
        ]
      },
      // 西安模板
      {
        id: 7,
        destination: '西安',
        title: '西安3日历史游',
        description: '兵马俑、大雁塔、古城墙',
        days: 3,
        budget: 1000,
        activities: [
          { day: 1, title: '兵马俑博物馆', description: '参观世界第八大奇迹' },
          { day: 2, title: '大雁塔', description: '唐代佛教文化遗址' },
          { day: 3, title: '古城墙', description: '骑行古城墙' }
        ]
      },
      {
        id: 8,
        destination: '西安',
        title: '西安4日文化游',
        description: '深度体验古都文化',
        days: 4,
        budget: 1500,
        activities: [
          { day: 1, title: '兵马俑+华清池', description: '秦文化深度游' },
          { day: 2, title: '大雁塔+陕西历史博物馆', description: '历史文化学习' },
          { day: 3, title: '古城墙+回民街', description: '古城风情体验' },
          { day: 4, title: '大唐不夜城', description: '现代唐文化展示' }
        ]
      },
      // 成都模板
      {
        id: 9,
        destination: '成都',
        title: '成都3日美食游',
        description: '大熊猫、宽窄巷子、火锅',
        days: 3,
        budget: 900,
        activities: [
          { day: 1, title: '大熊猫基地', description: '观赏国宝大熊猫' },
          { day: 2, title: '宽窄巷子', description: '体验成都慢生活' },
          { day: 3, title: '锦里+武侯祠', description: '三国文化体验' }
        ]
      },
      {
        id: 10,
        destination: '成都',
        title: '成都4日休闲游',
        description: '全面感受天府之国',
        days: 4,
        budget: 1200,
        activities: [
          { day: 1, title: '大熊猫基地+杜甫草堂', description: '自然与文化结合' },
          { day: 2, title: '宽窄巷子+人民公园', description: '成都慢生活体验' },
          { day: 3, title: '都江堰', description: '古代水利工程参观' },
          { day: 4, title: '青城山', description: '道教名山游览' }
        ]
      },
      // 广州模板
      {
        id: 11,
        destination: '广州',
        title: '广州2日美食游',
        description: '早茶、珠江夜游、美食街',
        days: 2,
        budget: 700,
        activities: [
          { day: 1, title: '广州塔', description: '登顶广州地标建筑' },
          { day: 1, title: '珠江夜游', description: '欣赏珠江夜景' },
          { day: 2, title: '上下九步行街', description: '品尝广州美食' }
        ]
      },
      {
        id: 12,
        destination: '广州',
        title: '广州3日都市游',
        description: '现代都市与传统文化结合',
        days: 3,
        budget: 1000,
        activities: [
          { day: 1, title: '广州塔+海心沙', description: '现代都市体验' },
          { day: 2, title: '陈家祠+沙面岛', description: '历史文化探索' },
          { day: 3, title: '长隆旅游度假区', description: '主题乐园游玩' }
        ]
      },
      // 南京模板
      {
        id: 13,
        destination: '南京',
        title: '南京3日历史游',
        description: '中山陵、夫子庙、总统府',
        days: 3,
        budget: 900,
        activities: [
          { day: 1, title: '中山陵', description: '参观国父陵墓' },
          { day: 2, title: '夫子庙', description: '感受秦淮文化' },
          { day: 3, title: '总统府', description: '近代历史学习' }
        ]
      },
      {
        id: 14,
        destination: '南京',
        title: '南京4日深度游',
        description: '六朝古都文化体验',
        days: 4,
        budget: 1300,
        activities: [
          { day: 1, title: '中山陵+明孝陵', description: '帝王陵墓参观' },
          { day: 2, title: '夫子庙+秦淮河', description: '夜游秦淮河' },
          { day: 3, title: '总统府+南京博物院', description: '历史文化学习' },
          { day: 4, title: '栖霞山', description: '自然风光游览' }
        ]
      },
      // 重庆模板
      {
        id: 15,
        destination: '重庆',
        title: '重庆3日山城游',
        description: '洪崖洞、解放碑、火锅',
        days: 3,
        budget: 800,
        activities: [
          { day: 1, title: '解放碑', description: '重庆地标建筑' },
          { day: 2, title: '洪崖洞', description: '欣赏山城夜景' },
          { day: 3, title: '磁器口古镇', description: '古镇文化体验' }
        ]
      },
      {
        id: 16,
        destination: '重庆',
        title: '重庆4日深度游',
        description: '全面感受山城魅力',
        days: 4,
        budget: 1100,
        activities: [
          { day: 1, title: '解放碑+长江索道', description: '城市观光' },
          { day: 2, title: '洪崖洞+南山一棵树', description: '夜景欣赏' },
          { day: 3, title: '磁器口+白公馆', description: '历史文化' },
          { day: 4, title: '武隆天生三桥', description: '自然奇观' }
        ]
      },
      // 苏州模板
      {
        id: 17,
        destination: '苏州',
        title: '苏州2日园林游',
        description: '拙政园、周庄、平江路',
        days: 2,
        budget: 600,
        activities: [
          { day: 1, title: '拙政园', description: '中国四大名园之一' },
          { day: 1, title: '平江路', description: '古街文化体验' },
          { day: 2, title: '周庄古镇', description: '水乡古镇游览' }
        ]
      },
      {
        id: 18,
        destination: '苏州',
        title: '苏州3日文化游',
        description: '深度体验江南园林',
        days: 3,
        budget: 900,
        activities: [
          { day: 1, title: '拙政园+狮子林', description: '园林艺术欣赏' },
          { day: 2, title: '周庄古镇', description: '水乡文化体验' },
          { day: 3, title: '寒山寺+虎丘', description: '历史文化探索' }
        ]
      },
      // 丽江模板
      {
        id: 19,
        destination: '丽江',
        title: '丽江3日古城游',
        description: '丽江古城、玉龙雪山、束河古镇',
        days: 3,
        budget: 1000,
        activities: [
          { day: 1, title: '丽江古城', description: '世界文化遗产' },
          { day: 2, title: '玉龙雪山', description: '雪山风光欣赏' },
          { day: 3, title: '束河古镇', description: '古镇文化体验' }
        ]
      },
      {
        id: 20,
        destination: '丽江',
        title: '丽江4日深度游',
        description: '全面感受纳西文化',
        days: 4,
        budget: 1400,
        activities: [
          { day: 1, title: '丽江古城', description: '深度游览古城' },
          { day: 2, title: '玉龙雪山', description: '雪山一日游' },
          { day: 3, title: '束河古镇+白沙古镇', description: '古镇文化对比' },
          { day: 4, title: '拉市海', description: '湿地生态体验' }
        ]
      }
    ];
  }

  // 初始化模板数据表
  async initTemplatesTable() {
    if (!this.client) {
      console.warn('Supabase客户端未初始化，跳过表初始化')
      return { success: false, error: '数据库连接未初始化' }
    }

    try {
      // 检查表是否存在
      const { data: existingTables, error } = await this.client
        .from('travel_templates')
        .select('*')
        .limit(1)

      if (error && error.code === '42P01') {
        // 表不存在，需要创建
        console.log('模板表不存在，需要创建...')
        return { success: false, error: '模板表不存在，请执行数据库初始化脚本' }
      }

      // 检查是否有数据
      const { data: templateCount, error: countError } = await this.client
        .from('travel_templates')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.warn('检查模板数据数量失败:', countError)
      }

      const message = templateCount ? `模板表已存在，包含 ${templateCount} 条数据` : '模板表已存在，但数据为空'
      return { success: true, message: message, count: templateCount }
    } catch (error) {
      console.error('检查模板表失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 保存模板数据到数据库
  async saveTemplatesToDatabase(templates) {
    if (!this.client) {
      console.warn('Supabase客户端未初始化，无法保存到数据库')
      return { success: false, error: '数据库连接未初始化' }
    }

    try {
      console.log('开始保存模板数据到数据库...')
      
      // 首先清空现有数据
      const { error: deleteError } = await this.client
        .from('travel_templates')
        .delete()
        .neq('template_id', '0') // 删除所有记录

      if (deleteError) {
        console.warn('清空模板数据失败:', deleteError)
        // 继续尝试插入，可能表是空的
      }

      // 格式化模板数据
      const formattedTemplates = templates.map(template => ({
        template_id: template.id,
        destination: template.destination,
        title: template.title,
        description: template.description,
        days: template.days,
        budget: template.budget,
        activities: template.activities || [],
        tags: template.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // 批量插入模板数据
      const { data, error } = await this.client
        .from('travel_templates')
        .insert(formattedTemplates)
        .select()

      if (error) {
        console.error('保存模板数据失败:', error)
        return { success: false, error: error.message }
      }

      console.log(`成功保存 ${data?.length || 0} 个模板到数据库`)
      return { success: true, data: data }
    } catch (error) {
      console.error('保存模板数据时发生异常:', error)
      return { success: false, error: error.message }
    }
  }

  // 从数据库加载模板数据
  async loadTemplatesFromDatabase() {
    if (!this.client) {
      console.warn('Supabase客户端未初始化，使用本地模板数据')
      return { success: false, error: '数据库连接未初始化' }
    }

    try {
      console.log('从数据库加载模板数据...')
      
      const { data: templates, error } = await this.client
        .from('travel_templates')
        .select('*')
        .order('destination')
        .order('template_id')

      if (error) {
        console.error('加载模板数据失败:', error)
        return { success: false, error: error.message }
      }

      console.log('数据库原始模板数据数量:', templates?.length || 0)
      if (templates && templates.length > 0) {
        console.log('前几个模板目的地:', templates.slice(0, 5).map(t => t.destination))
      }
      
      // 格式化返回的数据
      const formattedTemplates = (templates || []).map(template => {
        try {
          return {
            ...template,
            id: template.template_id || template.id, // 使用template_id作为前端id，如果不存在则使用id
            activities: typeof template.activities === 'string' ? 
              JSON.parse(template.activities) : 
              (template.activities || [])
          }
        } catch (parseError) {
          console.warn('解析模板数据失败:', parseError, template)
          return {
            ...template,
            id: template.template_id || template.id,
            activities: []
          }
        }
      })

      console.log(`从数据库加载了 ${formattedTemplates.length} 个模板`)
      return { success: true, data: formattedTemplates }
    } catch (error) {
      console.error('加载模板数据时发生异常:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取特定目的地的模板
  async getTemplatesByDestination(destinationName) {
    if (!this.client) {
      console.warn('Supabase客户端未初始化，使用本地模板数据')
      return { success: false, error: '数据库连接未初始化' }
    }

    try {
      const { data: templates, error } = await this.client
        .from('travel_templates')
        .select('*')
        .eq('destination', destinationName)
        .order('days')

      if (error) {
        console.error('获取目的地模板失败:', error)
        return { success: false, error: error.message }
      }

      // 格式化返回的数据
      const formattedTemplates = (templates || []).map(template => ({
        ...template,
        activities: template.activities ? JSON.parse(template.activities) : []
      }))

      return { success: true, data: formattedTemplates }
    } catch (error) {
      console.error('获取目的地模板时发生异常:', error)
      return { success: false, error: error.message }
    }
  }

  // 检查数据库连接状态
  async checkDatabaseConnection() {
    if (!this.client) {
      return { success: false, error: '数据库客户端未初始化' }
    }

    try {
      const { data, error } = await this.client
        .from('travel_templates')
        .select('count')
        .limit(1)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, message: '数据库连接正常' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// 创建单例实例
export default new TemplateService()