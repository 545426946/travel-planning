-- 用户认证数据库迁移脚本（安全版本）
-- 采用逐步迁移策略，避免依赖错误

-- 1. 创建用户认证表
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

-- 2. 创建用户会话表
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. 为现有表添加新列（不删除旧列）
-- 为travel_plans表添加app_user_id列
ALTER TABLE public.travel_plans 
ADD COLUMN IF NOT EXISTS app_user_id UUID;

-- 为user_favorites表添加app_user_id列
ALTER TABLE public.user_favorites 
ADD COLUMN IF NOT EXISTS app_user_id UUID;

-- 4. 创建外键约束
ALTER TABLE public.travel_plans 
ADD CONSTRAINT fk_travel_plans_app_user_id 
FOREIGN KEY (app_user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE public.user_favorites 
ADD CONSTRAINT fk_user_favorites_app_user_id 
FOREIGN KEY (app_user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_is_active ON public.app_users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(app_user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_travel_plans_app_user_id ON public.travel_plans(app_user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_app_user_id ON public.user_favorites(app_user_id);

-- 6. 创建新的行级安全策略（不删除现有策略）
-- 为app_users表启用行级安全
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 创建新的策略，使用app_user_id
CREATE POLICY "app_users_select_own" ON public.app_users FOR SELECT USING (id = current_setting('app.user_id', true)::uuid);
CREATE POLICY "app_users_update_own" ON public.app_users FOR UPDATE USING (id = current_setting('app.user_id', true)::uuid);

-- 为travel_plans表创建新的策略
CREATE POLICY "travel_plans_select_own_app" ON public.travel_plans FOR SELECT USING (
    app_user_id = current_setting('app.user_id', true)::uuid
);
CREATE POLICY "travel_plans_insert_own_app" ON public.travel_plans FOR INSERT WITH CHECK (
    app_user_id = current_setting('app.user_id', true)::uuid
);
CREATE POLICY "travel_plans_update_own_app" ON public.travel_plans FOR UPDATE USING (
    app_user_id = current_setting('app.user_id', true)::uuid
);
CREATE POLICY "travel_plans_delete_own_app" ON public.travel_plans FOR DELETE USING (
    app_user_id = current_setting('app.user_id', true)::uuid
);

-- 为plan_activities表创建新的策略
CREATE POLICY "plan_activities_select_own_app" ON public.plan_activities FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.travel_plans tp 
        WHERE tp.id = plan_id 
        AND tp.app_user_id = current_setting('app.user_id', true)::uuid
    )
);
CREATE POLICY "plan_activities_insert_own_app" ON public.plan_activities FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.travel_plans tp 
        WHERE tp.id = plan_id 
        AND tp.app_user_id = current_setting('app.user_id', true)::uuid
    )
);
CREATE POLICY "plan_activities_update_own_app" ON public.plan_activities FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.travel_plans tp 
        WHERE tp.id = plan_id 
        AND tp.app_user_id = current_setting('app.user_id', true)::uuid
    )
);
CREATE POLICY "plan_activities_delete_own_app" ON public.plan_activities FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.travel_plans tp 
        WHERE tp.id = plan_id 
        AND tp.app_user_id = current_setting('app.user_id', true)::uuid
    )
);

-- 为user_favorites表创建新的策略
CREATE POLICY "user_favorites_select_own_app" ON public.user_favorites FOR SELECT USING (
    app_user_id = current_setting('app.user_id', true)::uuid
);
CREATE POLICY "user_favorites_insert_own_app" ON public.user_favorites FOR INSERT WITH CHECK (
    app_user_id = current_setting('app.user_id', true)::uuid
);
CREATE POLICY "user_favorites_delete_own_app" ON public.user_favorites FOR DELETE USING (
    app_user_id = current_setting('app.user_id', true)::uuid
);

-- 7. 创建密码加密函数
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- 使用bcrypt算法加密密码，work factor为12
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql;

-- 8. 创建用户注册函数
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

-- 9. 创建用户登录验证函数
CREATE OR REPLACE FUNCTION public.authenticate_user(
    p_username VARCHAR(50),
    p_password TEXT
)
RETURNS TABLE(
    user_id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    email VARCHAR(255),
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.username,
        au.display_name,
        au.email,
        (au.password_hash = crypt(p_password, au.password_hash)) as is_valid
    FROM public.app_users au
    WHERE au.username = p_username 
      AND au.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建会话管理函数
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

-- 11. 创建数据迁移函数（可选，用于将现有数据迁移到新系统）
CREATE OR REPLACE FUNCTION public.migrate_existing_users()
RETURNS INTEGER AS $$
DECLARE
    migrated_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- 如果有现有的auth.users表，可以在这里添加迁移逻辑
    -- 目前返回0，表示没有需要迁移的数据
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- 12. 创建测试用户（可选）
INSERT INTO public.app_users (username, password_hash, display_name, email) 
VALUES 
    ('testuser', public.hash_password('password123'), '测试用户', 'test@example.com'),
    ('demo', public.hash_password('demo123'), '演示用户', 'demo@example.com')
ON CONFLICT (username) DO NOTHING;

-- 完成迁移
COMMENT ON TABLE public.app_users IS '应用用户表（支持用户名密码登录）';
COMMENT ON TABLE public.user_sessions IS '用户会话表';
COMMENT ON FUNCTION public.hash_password IS '密码加密函数';
COMMENT ON FUNCTION public.register_user IS '用户注册函数';
COMMENT ON FUNCTION public.authenticate_user IS '用户认证函数';
COMMENT ON FUNCTION public.create_user_session IS '创建用户会话函数';