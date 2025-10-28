-- 用户认证数据库迁移脚本（简化安全版本）
-- 只添加新表和新列，不删除或修改现有结构

-- 1. 创建用户认证表（如果不存在）
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. 创建用户会话表（如果不存在）
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. 为现有表添加新列（如果不存在）
-- 为travel_plans表添加app_user_id列
ALTER TABLE public.travel_plans 
ADD COLUMN IF NOT EXISTS app_user_id UUID;

-- 4. 创建外键约束（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_travel_plans_app_user_id') THEN
        ALTER TABLE public.travel_plans 
        ADD CONSTRAINT fk_travel_plans_app_user_id 
        FOREIGN KEY (app_user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(app_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_app_user_id ON public.travel_plans(app_user_id);

-- 6. 启用行级安全（如果未启用）
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 7. 创建简单的行级安全策略（使用应用层控制）
-- 允许所有用户查看用户表（用于登录验证）
DROP POLICY IF EXISTS "allow_all_select" ON public.app_users;
CREATE POLICY "allow_all_select" ON public.app_users FOR SELECT USING (true);

-- 允许插入新用户（注册）
DROP POLICY IF EXISTS "allow_insert" ON public.app_users;
CREATE POLICY "allow_insert" ON public.app_users FOR INSERT WITH CHECK (true);

-- 用户会话策略
DROP POLICY IF EXISTS "allow_session_select" ON public.user_sessions;
CREATE POLICY "allow_session_select" ON public.user_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_session_insert" ON public.user_sessions;
CREATE POLICY "allow_session_insert" ON public.user_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_session_delete" ON public.user_sessions;
CREATE POLICY "allow_session_delete" ON public.user_sessions FOR DELETE USING (true);

-- 8. 创建密码加密函数
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- 使用bcrypt算法加密密码
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
    -- 设置过期时间（30天）
    expiry_time := timezone('utc'::text, now()) + interval '30 days';
    
    -- 插入新会话
    INSERT INTO public.user_sessions (app_user_id, session_token, expires_at)
    VALUES (p_user_id, new_token, expiry_time);
    
    RETURN QUERY SELECT new_token, expiry_time;
END;
$$ LANGUAGE plpgsql;

-- 12. 创建验证会话函数
CREATE OR REPLACE FUNCTION public.validate_user_session(
    p_session_token VARCHAR(255)
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
        (us.session_token IS NOT NULL AND us.expires_at > timezone('utc'::text, now())) as is_valid
    FROM public.user_sessions us
    INNER JOIN public.app_users au ON us.app_user_id = au.id
    WHERE us.session_token = p_session_token
      AND au.is_active = true
      AND us.expires_at > timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- 13. 创建删除会话函数
CREATE OR REPLACE FUNCTION public.delete_user_session(
    p_session_token VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.user_sessions 
    WHERE session_token = p_session_token;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 14. 创建测试用户（可选）
INSERT INTO public.app_users (username, password_hash, display_name, email) 
VALUES 
    ('testuser', public.hash_password('password123'), '测试用户', 'test@example.com'),
    ('demo', public.hash_password('demo123'), '演示用户', 'demo@example.com')
ON CONFLICT (username) DO NOTHING;

-- 完成迁移
COMMENT ON TABLE public.app_users IS '应用用户表（支持用户名密码登录）';
COMMENT ON TABLE public.user_sessions IS '用户会话表';

-- 显示迁移完成信息
SELECT '用户认证数据库迁移完成！' as migration_status;