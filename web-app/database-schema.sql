-- 旅行规划应用数据库表结构
-- 适用于Supabase PostgreSQL数据库

-- 创建行程表
CREATE TABLE IF NOT EXISTS travel_plans (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    days INTEGER NOT NULL DEFAULT 3,
    budget DECIMAL(10,2) NOT NULL DEFAULT 0,
    travelers INTEGER NOT NULL DEFAULT 2,
    destination VARCHAR(100),
    itinerary JSONB,
    tips JSONB,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_travel_plans_created_at ON travel_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_travel_plans_status ON travel_plans(status);
CREATE INDEX IF NOT EXISTS idx_travel_plans_destination ON travel_plans(destination);

-- 创建用户表（可选，用于未来扩展）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建用户行程关联表（可选，用于未来扩展）
CREATE TABLE IF NOT EXISTS user_travel_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id BIGINT REFERENCES travel_plans(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_id)
);

-- 创建行程活动表（用于详细行程安排）
CREATE TABLE IF NOT EXISTS plan_activities (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT REFERENCES travel_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    time_slot VARCHAR(20) CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'night')),
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    location VARCHAR(255),
    estimated_cost DECIMAL(10,2),
    duration_minutes INTEGER,
    start_time TIME,
    end_time TIME,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_plan_activities_plan_id ON plan_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_activities_day_number ON plan_activities(day_number);

-- 启用行级安全策略（RLS）
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_activities ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有用户读取和创建行程）
CREATE POLICY "允许所有人查看行程" ON travel_plans FOR SELECT USING (true);
CREATE POLICY "允许所有人创建行程" ON travel_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "允许所有人更新自己的行程" ON travel_plans FOR UPDATE USING (true);
CREATE POLICY "允许所有人删除自己的行程" ON travel_plans FOR DELETE USING (true);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表创建更新时间触发器
CREATE TRIGGER update_travel_plans_updated_at 
    BEFORE UPDATE ON travel_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_travel_plans_updated_at 
    BEFORE UPDATE ON user_travel_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_activities_updated_at 
    BEFORE UPDATE ON plan_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据
INSERT INTO travel_plans (title, description, days, budget, travelers, destination, is_ai_generated) VALUES
('北京文化之旅', '探索故宫、长城等历史文化景点', 3, 2500.00, 2, '北京', false),
('上海现代游', '体验上海的现代化都市魅力', 2, 1800.00, 1, '上海', false),
('杭州西湖休闲游', '享受西湖美景和龙井茶文化', 2, 1200.00, 2, '杭州', true)
ON CONFLICT DO NOTHING;