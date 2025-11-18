-- 为现有用户表添加账号密码登录支持
-- 注意：users表已经存在，主键是UUID类型

-- 添加缺失的字段（如果不存在）
DO $$
BEGIN
    -- 添加用户名字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
    END IF;

    -- 添加邮箱字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;

    -- 添加手机号字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;
    END IF;

    -- 添加密码字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(255);
    END IF;

    -- 添加登录类型字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'login_type'
    ) THEN
        ALTER TABLE users ADD COLUMN login_type VARCHAR(20) DEFAULT 'wechat';
    END IF;

    -- 添加状态字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;

    -- 添加最后登录字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_login_type ON users(login_type);

-- 创建用户登录日志表
CREATE TABLE IF NOT EXISTS user_login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    login_type VARCHAR(20) NOT NULL,
    login_device VARCHAR(100),
    login_ip VARCHAR(45),
    user_agent TEXT,
    login_success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建登录日志表索引
CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_created_at ON user_login_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_success ON user_login_logs(login_success);

-- 添加测试用户（用于测试账号密码登录）
INSERT INTO users (
    username, 
    email, 
    password, 
    name, 
    login_type, 
    status
) VALUES (
    'testuser',
    'test@example.com',
    '123456',
    '测试用户',
    'account',
    'active'
) ON CONFLICT (username) DO NOTHING;

-- 更新现有测试用户的登录信息
UPDATE users 
SET 
    username = 'testuser',
    email = 'test@example.com',
    password = '123456',
    login_type = 'account',
    status = 'active'
WHERE openid = 'test_openid_demo' AND (username IS NULL OR email IS NULL);

COMMIT;

-- 输出完成信息
SELECT 'Account login support added successfully!' as status;