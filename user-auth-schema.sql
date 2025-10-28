-- 用户认证相关数据库表结构
-- 用于支持用户名密码登录注册功能

-- 1. 创建用户认证表（替代Supabase默认的auth.users表）
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    display_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. 修改现有travel_plans表，关联到app_users表
-- 先添加新列，然后迁移数据，最后删除旧列
ALTER TABLE public.travel_plans 
ADD COLUMN IF NOT EXISTS app_user_id UUID;

-- 创建外键约束
ALTER TABLE public.travel_plans 
ADD CONSTRAINT fk_travel_plans_app_user_id 
FOREIGN KEY (app_user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

-- 3. 修改现有user_favorites表，关联到app_users表
ALTER TABLE public.user_favorites 
DROP COLUMN IF EXISTS user_id,
ADD COLUMN IF NOT EXISTS app_user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE;

-- 4. 创建用户会话表
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_is_active ON public.app_users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(app_user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- 6. 更新现有索引
DROP INDEX IF EXISTS idx_travel_plans_user_id;
CREATE INDEX IF NOT EXISTS idx_travel_plans_app_user_id ON public.travel_plans(app_user_id);

DROP INDEX IF EXISTS idx_user_favorites_user_id;
CREATE INDEX IF NOT EXISTS idx_user_favorites_app_user_id ON public.user_favorites(app_user_id);

-- 7. 更新行级安全策略
-- 行程表策略：用户可以管理自己的行程
DROP POLICY IF EXISTS "用户可以查看所有行程" ON public.travel_plans;
DROP POLICY IF EXISTS "用户可以创建行程" ON public.travel_plans;
DROP POLICY IF EXISTS "用户可以更新自己的行程" ON public.travel_plans;
DROP POLICY IF EXISTS "用户可以删除自己的行程" ON public.travel_plans;

CREATE POLICY "用户可以查看自己的行程" ON public.travel_plans FOR SELECT USING (
    app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id)
);
CREATE POLICY "用户可以创建行程" ON public.travel_plans FOR INSERT WITH CHECK (
    app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id)
);
CREATE POLICY "用户可以更新自己的行程" ON public.travel_plans FOR UPDATE USING (
    app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id)
);
CREATE POLICY "用户可以删除自己的行程" ON public.travel_plans FOR DELETE USING (
    app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id)
);

-- 活动表策略：用户可以管理自己行程的活动
DROP POLICY IF EXISTS "用户可以查看活动" ON public.plan_activities;
DROP POLICY IF EXISTS "用户可以创建活动" ON public.plan_activities;
DROP POLICY IF EXISTS "用户可以更新活动" ON public.plan_activities;
DROP POLICY IF EXISTS "用户可以删除活动" ON public.plan_activities;

CREATE POLICY "用户可以查看活动" ON public.plan_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.travel_plans WHERE id = plan_id AND app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id))
);
CREATE POLICY "用户可以创建活动" ON public.plan_activities FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.travel_plans WHERE id = plan_id AND app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id))
);
CREATE POLICY "用户可以更新活动" ON public.plan_activities FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.travel_plans WHERE id = plan_id AND app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id))
);
CREATE POLICY "用户可以删除活动" ON public.plan_activities FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.travel_plans WHERE id = plan_id AND app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id))
);

-- 收藏表策略：用户可以管理自己的收藏
DROP POLICY IF EXISTS "用户可以查看自己的收藏" ON public.user_favorites;
DROP POLICY IF EXISTS "用户可以创建收藏" ON public.user_favorites;
DROP POLICY IF EXISTS "用户可以删除自己的收藏" ON public.user_favorites;

CREATE POLICY "用户可以查看自己的收藏" ON public.user_favorites FOR SELECT USING (
    app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id)
);
CREATE POLICY "用户可以创建收藏" ON public.user_favorites FOR INSERT WITH CHECK (
    app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id)
);
CREATE POLICY "用户可以删除自己的收藏" ON public.user_favorites FOR DELETE USING (
    app_user_id IN (SELECT id FROM public.app_users WHERE id = app_user_id)
);

-- 8. 创建密码加密函数
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- 使用bcrypt算法加密密码，work factor为12
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql;

-- 9. 创建用户注册函数
CREATE OR REPLACE FUNCTION public.register_user(
    p_username VARCHAR(50),
    p_password TEXT,
    p_email VARCHAR(255) DEFAULT NULL,
    p_display_name VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    existing_user_count INTEGER;
BEGIN
    -- 检查用户名是否已存在
    SELECT COUNT(*) INTO existing_user_count 
    FROM public.app_users 
    WHERE username = p_username;
    
    IF existing_user_count > 0 THEN
        RAISE EXCEPTION '用户名已存在';
    END IF;
    
    -- 插入新用户
    INSERT INTO public.app_users (
        username, 
        password_hash, 
        email, 
        display_name
    ) VALUES (
        p_username,
        public.hash_password(p_password),
        p_email,
        COALESCE(p_display_name, p_username)
    ) RETURNING id INTO user_id;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建用户登录验证函数
CREATE OR REPLACE FUNCTION public.authenticate_user(
    p_username VARCHAR(50),
    p_password TEXT
)
RETURNS TABLE(
    user_id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.username,
        au.display_name,
        (au.password_hash = crypt(p_password, au.password_hash)) as is_valid
    FROM public.app_users au
    WHERE au.username = p_username 
      AND au.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 11. 创建会话管理函数
CREATE OR REPLACE FUNCTION public.create_user_session(
    p_user_id UUID
)
RETURNS TABLE(
    session_token VARCHAR(255),
    expires_at TIMESTAMPTZ
) AS $$
DECLARE
    new_token VARCHAR(255);
    expiry_time TIMESTAMPTZ;
BEGIN
    -- 生成随机token
    new_token := encode(gen_random_bytes(32), 'hex');
    -- 设置过期时间（7天后）
    expiry_time := timezone('utc'::text, now()) + interval '7 days';
    
    -- 插入新会话
    INSERT INTO public.user_sessions (app_user_id, session_token, expires_at)
    VALUES (p_user_id, new_token, expiry_time);
    
    RETURN QUERY SELECT new_token, expiry_time;
END;
$$ LANGUAGE plpgsql;

-- 12. 创建验证会话函数
CREATE OR REPLACE FUNCTION public.validate_session(
    p_session_token VARCHAR(255)
)
RETURNS TABLE(
    user_id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.username,
        au.display_name,
        (us.expires_at > timezone('utc'::text, now())) as is_valid
    FROM public.user_sessions us
    JOIN public.app_users au ON us.app_user_id = au.id
    WHERE us.session_token = p_session_token 
      AND au.is_active = true
      AND us.expires_at > timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- 13. 创建删除过期会话函数
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at <= timezone('utc'::text, now());
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 14. 插入示例用户数据（可选）
INSERT INTO public.app_users (username, password_hash, display_name, email) VALUES
('demo_user', crypt('demo123', gen_salt('bf', 12)), '演示用户', 'demo@example.com')
ON CONFLICT (username) DO NOTHING;

-- 15. 创建更新时间触发器
CREATE OR REPLACE TRIGGER update_app_users_updated_at 
    BEFORE UPDATE ON public.app_users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON public.user_sessions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();