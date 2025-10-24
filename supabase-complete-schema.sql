-- 旅行规划应用 - 完整Supabase数据库表结构
-- 根据项目功能需求优化

-- 1. 创建主行程表（使用UUID主键，与Supabase认证系统兼容）
CREATE TABLE IF NOT EXISTS public.travel_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    destination VARCHAR(100),
    days INTEGER NOT NULL DEFAULT 3,
    travelers INTEGER NOT NULL DEFAULT 2,
    budget NUMERIC(10,2) DEFAULT 0,
    total_budget NUMERIC(10,2) DEFAULT 0,
    daily_budget NUMERIC(10,2) DEFAULT 0,
    travel_type VARCHAR(50) DEFAULT 'leisure',
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    itinerary JSONB,
    tips JSONB,
    tags TEXT[],
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. 创建行程活动表（详细行程安排）
CREATE TABLE IF NOT EXISTS public.plan_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES public.travel_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    cost NUMERIC(10,2) DEFAULT 0,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. 创建城市信息表（用于目的地管理）
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    description TEXT,
    popular_season VARCHAR(50),
    avg_budget_per_day NUMERIC(10,2),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. 创建计划模板表（AI生成的模板）
CREATE TABLE IF NOT EXISTS public.plan_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    destination VARCHAR(100),
    days INTEGER NOT NULL,
    budget_range VARCHAR(100),
    travel_type VARCHAR(50),
    itinerary_template JSONB,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. 创建景点信息表
CREATE TABLE IF NOT EXISTS public.attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    address TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    opening_hours TEXT,
    ticket_price NUMERIC(10,2),
    estimated_duration_minutes INTEGER,
    tags TEXT[],
    rating DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. 创建用户收藏表
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.travel_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, plan_id)
);

-- 7. 创建索引（优化查询性能）
CREATE INDEX IF NOT EXISTS idx_travel_plans_user_id ON public.travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_created_at ON public.travel_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_travel_plans_status ON public.travel_plans(status);
CREATE INDEX IF NOT EXISTS idx_travel_plans_destination ON public.travel_plans(destination);
CREATE INDEX IF NOT EXISTS idx_travel_plans_is_ai_generated ON public.travel_plans(is_ai_generated);

CREATE INDEX IF NOT EXISTS idx_plan_activities_plan_id ON public.plan_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_activities_day_number ON public.plan_activities(day_number);
CREATE INDEX IF NOT EXISTS idx_plan_activities_activity_type ON public.plan_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities(country);
CREATE INDEX IF NOT EXISTS idx_attractions_city_id ON public.attractions(city_id);
CREATE INDEX IF NOT EXISTS idx_attractions_type ON public.attractions(type);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);

-- 8. 启用行级安全策略（RLS）
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 9. 创建安全策略
-- 行程表策略：用户可以管理自己的行程
CREATE POLICY "用户可以查看所有行程" ON public.travel_plans FOR SELECT USING (true);
CREATE POLICY "用户可以创建行程" ON public.travel_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新自己的行程" ON public.travel_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的行程" ON public.travel_plans FOR DELETE USING (auth.uid() = user_id);

-- 活动表策略：用户可以管理自己行程的活动
CREATE POLICY "用户可以查看活动" ON public.plan_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.travel_plans WHERE id = plan_id AND user_id = auth.uid())
);
CREATE POLICY "用户可以创建活动" ON public.plan_activities FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.travel_plans WHERE id = plan_id AND user_id = auth.uid())
);
CREATE POLICY "用户可以更新活动" ON public.plan_activities FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.travel_plans WHERE id = plan_id AND user_id = auth.uid())
);
CREATE POLICY "用户可以删除活动" ON public.plan_activities FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.travel_plans WHERE id = plan_id AND user_id = auth.uid())
);

-- 收藏表策略：用户可以管理自己的收藏
CREATE POLICY "用户可以查看自己的收藏" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以创建收藏" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的收藏" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- 10. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. 为所有表创建更新时间触发器（使用CREATE OR REPLACE避免重复）
CREATE OR REPLACE TRIGGER update_travel_plans_updated_at 
    BEFORE UPDATE ON public.travel_plans 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_plan_activities_updated_at 
    BEFORE UPDATE ON public.plan_activities 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_cities_updated_at 
    BEFORE UPDATE ON public.cities 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_plan_templates_updated_at 
    BEFORE UPDATE ON public.plan_templates 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_attractions_updated_at 
    BEFORE UPDATE ON public.attractions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_favorites_updated_at 
    BEFORE UPDATE ON public.user_favorites 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. 插入示例数据
-- 插入示例城市
INSERT INTO public.cities (name, country, region, description, avg_budget_per_day, tags) VALUES
('北京', '中国', '华北', '中国的首都，拥有丰富的历史文化遗产', 500.00, ARRAY['历史文化', '首都', '美食']),
('上海', '中国', '华东', '现代化国际大都市，金融和商业中心', 600.00, ARRAY['现代化', '购物', '夜景']),
('杭州', '中国', '华东', '西湖美景，龙井茶文化', 400.00, ARRAY['自然风光', '茶文化', '休闲'])
ON CONFLICT DO NOTHING;

-- 插入示例计划模板
INSERT INTO public.plan_templates (title, description, destination, days, budget_range, travel_type, tags) VALUES
('北京文化三日游', '探索故宫、长城等历史文化景点', '北京', 3, '1500-3000', 'cultural', ARRAY['历史文化', '经典路线']),
('上海现代两日游', '体验上海的现代化都市魅力', '上海', 2, '1000-2000', 'urban', ARRAY['现代化', '购物']),
('杭州休闲两日游', '享受西湖美景和龙井茶文化', '杭州', 2, '800-1500', 'leisure', ARRAY['自然风光', '休闲'])
ON CONFLICT DO NOTHING;

-- 13. 创建视图（方便查询）
CREATE OR REPLACE VIEW public.travel_plan_details AS
SELECT 
    tp.*,
    u.email as user_email,
    COUNT(pa.id) as activity_count,
    COALESCE(SUM(pa.cost), 0) as total_activity_cost
FROM public.travel_plans tp
LEFT JOIN auth.users u ON tp.user_id = u.id
LEFT JOIN public.plan_activities pa ON tp.id = pa.plan_id
GROUP BY tp.id, u.email;

-- 14. 创建函数：计算行程总成本
CREATE OR REPLACE FUNCTION public.calculate_plan_total_cost(plan_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_cost NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(cost), 0) INTO total_cost 
    FROM public.plan_activities 
    WHERE plan_id = $1;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;