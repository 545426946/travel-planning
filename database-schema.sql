-- 旅行规划应用数据库表结构
-- 创建必要的表结构和关系

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    university VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 城市目的地表
CREATE TABLE IF NOT EXISTS cities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    avg_budget_per_day INTEGER NOT NULL,
    best_season VARCHAR[] DEFAULT '{}',
    travel_tips TEXT,
    image_url TEXT,
    tags VARCHAR[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 行程模板表
CREATE TABLE IF NOT EXISTS plan_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL,
    total_budget INTEGER NOT NULL,
    description TEXT,
    itinerary JSONB,
    popularity INTEGER DEFAULT 0,
    tags VARCHAR[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 旅行计划表
CREATE TABLE IF NOT EXISTS travel_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget INTEGER NOT NULL,
    itinerary JSONB,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 热门景点表
CREATE TABLE IF NOT EXISTS attractions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    best_time_to_visit VARCHAR(100),
    entry_fee DECIMAL(10,2),
    image_url TEXT,
    tags VARCHAR[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入示例数据
-- 插入城市数据
INSERT INTO cities (name, country, region, avg_budget_per_day, best_season, travel_tips, tags) VALUES
('北京', '中国', '亚洲', 300, '{"春季", "秋季"}', '建议游览故宫、长城等著名景点，注意避开节假日高峰期', '{"历史", "文化", "首都"}'),
('上海', '中国', '亚洲', 350, '{"春季", "秋季"}', '现代化大都市，外滩夜景和迪士尼乐园值得一看', '{"现代", "购物", "娱乐"}'),
('东京', '日本', '亚洲', 400, '{"春季", "秋季"}', '樱花季和枫叶季是最佳旅游时间，公共交通发达', '{"现代", "文化", "美食"}'),
('巴黎', '法国', '欧洲', 500, '{"春季", "夏季"}', '浪漫之都，埃菲尔铁塔和卢浮宫必游', '{"浪漫", "艺术", "历史"}'),
('纽约', '美国', '美洲', 600, '{"春季", "秋季"}', '世界金融中心，自由女神像和时代广场著名', '{"现代", "商业", "多元"}'),
('悉尼', '澳大利亚', '大洋洲', 450, '{"夏季", "秋季"}', '悉尼歌剧院和海港大桥是标志性建筑', '{"自然", "现代", "海滨"}');

-- 插入行程模板数据
INSERT INTO plan_templates (title, destination, duration_days, total_budget, description, itinerary, popularity, tags) VALUES
('北京3日文化之旅', '北京', 3, 1500, '深度体验北京历史文化', '{"day1": "故宫-天安门广场", "day2": "长城一日游", "day3": "颐和园-圆明园"}', 85, '{"文化", "历史", "短途"}'),
('东京5日动漫之旅', '东京', 5, 4000, '动漫爱好者的天堂', '{"day1": "秋叶原-浅草寺", "day2": "迪士尼乐园", "day3": "涩谷-原宿", "day4": "台场-银座", "day5": "自由活动"}', 92, '{"动漫", "购物", "娱乐"}'),
('巴黎4日浪漫之旅', '巴黎', 4, 5000, '感受浪漫之都的魅力', '{"day1": "埃菲尔铁塔-香榭丽舍大街", "day2": "卢浮宫-奥赛博物馆", "day3": "凡尔赛宫", "day4": "蒙马特高地-圣心大教堂"}', 78, '{"浪漫", "艺术", "历史"}');

-- 插入热门景点数据
INSERT INTO attractions (name, location, country, region, type, description, best_time_to_visit, entry_fee, tags, rating) VALUES
('故宫博物院', '北京', '中国', '亚洲', '历史建筑', '世界上现存规模最大、保存最为完整的木质结构古建筑群', '春季、秋季', 60.00, '{"历史", "文化", "世界遗产"}', 4.8),
('埃菲尔铁塔', '巴黎', '法国', '欧洲', '现代建筑', '法国文化象征之一，巴黎城市地标', '全年', 25.50, '{"现代", "地标", "浪漫"}', 4.7),
('大堡礁', '昆士兰', '澳大利亚', '大洋洲', '自然景观', '世界最大最长的珊瑚礁群', '5-10月', 0.00, '{"自然", "海洋", "潜水"}', 4.9),
('泰姬陵', '阿格拉', '印度', '亚洲', '历史建筑', '世界新七大奇迹之一，象征永恒的爱情', '11月-2月', 1100.00, '{"历史", "爱情", "建筑"}', 4.6),
('尼亚加拉瀑布', '安大略', '加拿大', '美洲', '自然景观', '世界三大跨国瀑布之一', '夏季', 0.00, '{"自然", "瀑布", "壮观"}', 4.8),
('罗马斗兽场', '罗马', '意大利', '欧洲', '历史遗迹', '古罗马时期最大的圆形角斗场', '春季、秋季', 16.00, '{"历史", "古罗马", "遗迹"}', 4.7),
('东京塔', '东京', '日本', '亚洲', '现代建筑', '东京地标性建筑，仿照埃菲尔铁塔建造', '全年', 12.00, '{"现代", "地标", "夜景"}', 4.5),
('马丘比丘', '库斯科', '秘鲁', '美洲', '历史遗迹', '印加帝国遗迹，世界新七大奇迹', '5-9月', 152.00, '{"历史", "印加", "神秘"}', 4.9),
('悉尼歌剧院', '悉尼', '澳大利亚', '大洋洲', '现代建筑', '20世纪最具特色的建筑之一', '全年', 42.00, '{"现代", "艺术", "地标"}', 4.8),
('金字塔', '吉萨', '埃及', '非洲', '历史遗迹', '古埃及法老的陵墓，世界七大奇迹', '10月-4月', 200.00, '{"历史", "古埃及", "神秘"}', 4.7),
('富士山', '静冈县', '日本', '亚洲', '自然景观', '日本最高峰，活火山', '7-8月', 0.00, '{"自然", "登山", "神圣"}', 4.6),
('布拉格广场', '布拉格', '捷克', '欧洲', '历史建筑', '欧洲最美丽的广场之一', '春季、秋季', 0.00, '{"历史", "哥特式", "浪漫"}', 4.5);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cities_region ON cities(region);
CREATE INDEX IF NOT EXISTS idx_cities_tags ON cities USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_plan_templates_popularity ON plan_templates(popularity);
CREATE INDEX IF NOT EXISTS idx_attractions_region ON attractions(region);
CREATE INDEX IF NOT EXISTS idx_attractions_type ON attractions(type);
CREATE INDEX IF NOT EXISTS idx_attractions_tags ON attractions USING gin(tags);

-- 启用行级安全策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- 创建策略
-- profiles表：用户只能查看和修改自己的资料
CREATE POLICY "用户只能查看自己的资料" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户只能修改自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id);

-- cities表：所有用户都可以查看
CREATE POLICY "所有用户都可以查看城市" ON cities FOR SELECT USING (true);

-- plan_templates表：所有用户都可以查看
CREATE POLICY "所有用户都可以查看行程模板" ON plan_templates FOR SELECT USING (true);

-- travel_plans表：用户只能查看和修改自己的行程
CREATE POLICY "用户只能查看自己的行程" ON travel_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的行程" ON travel_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能修改自己的行程" ON travel_plans FOR UPDATE USING (auth.uid() = user_id);

-- attractions表：所有用户都可以查看
CREATE POLICY "所有用户都可以查看景点" ON attractions FOR SELECT USING (true);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要更新时间的表创建触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_plans_updated_at BEFORE UPDATE ON travel_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();