-- 旅行规划应用 - 数据库初始化脚本
-- 专门用于初始化旅游模板数据表

-- 1. 创建旅游模板表（如果不存在）
CREATE TABLE IF NOT EXISTS public.travel_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id INTEGER NOT NULL,
    destination VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    days INTEGER NOT NULL,
    budget NUMERIC(10,2) NOT NULL,
    activities JSONB NOT NULL,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(template_id)
);

-- 2. 创建索引（优化查询性能）
DO $$ 
BEGIN
    -- 等待表创建完成
    PERFORM pg_sleep(0.1);
    
    -- 检查表是否存在且包含template_id列
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'travel_templates'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'travel_templates' AND column_name = 'template_id'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_travel_templates_destination') THEN
            CREATE INDEX idx_travel_templates_destination ON public.travel_templates(destination);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_travel_templates_template_id') THEN
            CREATE INDEX idx_travel_templates_template_id ON public.travel_templates(template_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_travel_templates_is_active') THEN
            CREATE INDEX idx_travel_templates_is_active ON public.travel_templates(is_active);
        END IF;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        -- 如果表不存在，跳过索引创建
        NULL;
    WHEN undefined_column THEN
        -- 如果列不存在，跳过索引创建
        NULL;
END $$;

-- 3. 启用行级安全策略（RLS）
ALTER TABLE public.travel_templates ENABLE ROW LEVEL SECURITY;

-- 4. 创建安全策略（允许所有用户读取模板数据）
CREATE POLICY "所有用户都可以查看旅游模板" ON public.travel_templates FOR SELECT USING (true);
CREATE POLICY "管理员可以管理旅游模板" ON public.travel_templates FOR ALL USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'admin@example.com'
));

-- 5. 创建更新时间触发器
CREATE OR REPLACE FUNCTION public.update_travel_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_travel_templates_updated_at 
    BEFORE UPDATE ON public.travel_templates 
    FOR EACH ROW EXECUTE FUNCTION public.update_travel_templates_updated_at();

-- 6. 插入示例旅游模板数据
INSERT INTO public.travel_templates (template_id, destination, title, description, days, budget, activities, tags) VALUES
-- 北京模板
(1, '北京', '北京3日文化游', '故宫、长城、颐和园经典路线', 3, 1500.00, '[
    {"day": 1, "title": "故宫博物院", "description": "参观明清皇宫建筑群"},
    {"day": 1, "title": "天安门广场", "description": "感受国家政治中心"},
    {"day": 2, "title": "八达岭长城", "description": "登长城，感受古代军事防御工程"},
    {"day": 3, "title": "颐和园", "description": "游览皇家园林"}
]'::jsonb, ARRAY['历史文化', '经典路线']),

(2, '北京', '北京5日深度游', '全面体验北京历史文化', 5, 2500.00, '[
    {"day": 1, "title": "故宫+景山公园", "description": "深度游览故宫"},
    {"day": 2, "title": "天坛+前门大街", "description": "感受老北京风情"},
    {"day": 3, "title": "长城一日游", "description": "八达岭或慕田峪长城"},
    {"day": 4, "title": "颐和园+圆明园", "description": "皇家园林之旅"},
    {"day": 5, "title": "798艺术区", "description": "现代艺术体验"}
]'::jsonb, ARRAY['深度游', '文化体验']),

-- 上海模板
(3, '上海', '上海2日现代游', '外滩、迪士尼、陆家嘴', 2, 1200.00, '[
    {"day": 1, "title": "外滩", "description": "欣赏黄浦江两岸风光"},
    {"day": 1, "title": "南京路步行街", "description": "购物休闲"},
    {"day": 2, "title": "迪士尼乐园", "description": "全天游玩"}
]'::jsonb, ARRAY['现代都市', '迪士尼']),

(4, '上海', '上海3日都市游', '全面体验魔都魅力', 3, 1800.00, '[
    {"day": 1, "title": "外滩+豫园", "description": "感受上海历史与现代交融"},
    {"day": 2, "title": "迪士尼乐园", "description": "童话世界一日游"},
    {"day": 3, "title": "陆家嘴+新天地", "description": "现代都市体验"}
]'::jsonb, ARRAY['都市游', '全面体验']),

-- 杭州模板
(5, '杭州', '杭州2日西湖游', '西湖、灵隐寺、龙井茶园', 2, 800.00, '[
    {"day": 1, "title": "西湖十景", "description": "漫步西湖，欣赏断桥残雪"},
    {"day": 1, "title": "灵隐寺", "description": "参观千年古刹"},
    {"day": 2, "title": "龙井茶园", "description": "体验采茶文化"}
]'::jsonb, ARRAY['西湖', '休闲']),

(6, '杭州', '杭州3日深度游', '全面感受江南水乡魅力', 3, 1200.00, '[
    {"day": 1, "title": "西湖+雷峰塔", "description": "深度游览西湖景区"},
    {"day": 2, "title": "灵隐寺+飞来峰", "description": "佛教文化体验"},
    {"day": 3, "title": "西溪湿地", "description": "自然生态之旅"}
]'::jsonb, ARRAY['深度游', '江南水乡']),

-- 西安模板
(7, '西安', '西安3日历史游', '兵马俑、大雁塔、古城墙', 3, 1000.00, '[
    {"day": 1, "title": "兵马俑博物馆", "description": "参观世界第八大奇迹"},
    {"day": 2, "title": "大雁塔", "description": "唐代佛教文化遗址"},
    {"day": 3, "title": "古城墙", "description": "骑行古城墙"}
]'::jsonb, ARRAY['历史文化', '古都']),

(8, '西安', '西安4日文化游', '深度体验古都文化', 4, 1500.00, '[
    {"day": 1, "title": "兵马俑+华清池", "description": "秦文化深度游"},
    {"day": 2, "title": "大雁塔+陕西历史博物馆", "description": "历史文化学习"},
    {"day": 3, "title": "古城墙+回民街", "description": "古城风情体验"},
    {"day": 4, "title": "大唐不夜城", "description": "现代唐文化展示"}
]'::jsonb, ARRAY['文化游', '深度体验']),

-- 成都模板
(9, '成都', '成都3日美食游', '大熊猫、宽窄巷子、火锅', 3, 900.00, '[
    {"day": 1, "title": "大熊猫基地", "description": "观赏国宝大熊猫"},
    {"day": 2, "title": "宽窄巷子", "description": "体验成都慢生活"},
    {"day": 3, "title": "锦里+武侯祠", "description": "三国文化体验"}
]'::jsonb, ARRAY['美食', '大熊猫']),

(10, '成都', '成都4日休闲游', '全面感受天府之国', 4, 1200.00, '[
    {"day": 1, "title": "大熊猫基地+杜甫草堂", "description": "自然与文化结合"},
    {"day": 2, "title": "宽窄巷子+人民公园", "description": "成都慢生活体验"},
    {"day": 3, "title": "都江堰", "description": "古代水利工程参观"},
    {"day": 4, "title": "青城山", "description": "道教名山游览"}
]'::jsonb, ARRAY['休闲游', '天府之国'])

ON CONFLICT (template_id) DO UPDATE SET
    destination = EXCLUDED.destination,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    days = EXCLUDED.days,
    budget = EXCLUDED.budget,
    activities = EXCLUDED.activities,
    tags = EXCLUDED.tags,
    updated_at = timezone('utc'::text, now());

-- 7. 创建视图：按目的地分组的模板统计
CREATE OR REPLACE VIEW public.travel_templates_summary AS
SELECT 
    destination,
    COUNT(*) as template_count,
    MIN(days) as min_days,
    MAX(days) as max_days,
    MIN(budget) as min_budget,
    MAX(budget) as max_budget,
    ARRAY_AGG(DISTINCT tag) as all_tags
FROM public.travel_templates,
    LATERAL UNNEST(tags) as tag
WHERE is_active = true
GROUP BY destination
ORDER BY template_count DESC;

-- 8. 创建函数：根据目的地获取模板
CREATE OR REPLACE FUNCTION public.get_templates_by_destination(dest_name VARCHAR)
RETURNS TABLE(
    template_id INTEGER,
    title VARCHAR,
    description TEXT,
    days INTEGER,
    budget NUMERIC,
    activities JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tt.template_id,
        tt.title,
        tt.description,
        tt.days,
        tt.budget,
        tt.activities
    FROM public.travel_templates tt
    WHERE tt.destination = dest_name 
        AND tt.is_active = true
    ORDER BY tt.days, tt.budget;
END;
$$ LANGUAGE plpgsql;

-- 9. 验证数据插入结果
SELECT '数据库初始化完成' as status;
SELECT COUNT(*) as total_templates FROM public.travel_templates;
SELECT destination, COUNT(*) as template_count 
FROM public.travel_templates 
GROUP BY destination 
ORDER BY template_count DESC;