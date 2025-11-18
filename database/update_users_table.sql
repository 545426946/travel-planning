-- 更新用户表结构，支持账号密码登录

-- 首先检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    openid VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    avatar TEXT,
    gender VARCHAR(10),
    birthday DATE,
    location VARCHAR(255),
    bio TEXT,
    status VARCHAR(20) DEFAULT 'active',
    login_type VARCHAR(20) DEFAULT 'wechat',
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为现有用户添加缺失字段（如果不存在）
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

    -- 添加性别字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gender'
    ) THEN
        ALTER TABLE users ADD COLUMN gender VARCHAR(10);
    END IF;

    -- 添加生日字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'birthday'
    ) THEN
        ALTER TABLE users ADD COLUMN birthday DATE;
    END IF;

    -- 添加位置字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location'
    ) THEN
        ALTER TABLE users ADD COLUMN location VARCHAR(255);
    END IF;

    -- 添加个人简介字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'bio'
    ) THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;

    -- 添加状态字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;

    -- 添加登录类型字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'login_type'
    ) THEN
        ALTER TABLE users ADD COLUMN login_type VARCHAR(20) DEFAULT 'wechat';
    END IF;

    -- 添加最后登录字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
    END IF;

    -- 添加邮箱验证字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- 添加手机验证字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- 添加偏好设置字段（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE users ADD COLUMN preferences JSONB;
    END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_login_type ON users(login_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 创建用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    travel_style VARCHAR(50), -- 旅行风格：adventure, leisure, cultural, nature, etc.
    budget_range VARCHAR(50), -- 预算范围：low, medium, high
    accommodation_type VARCHAR(50), -- 住宿偏好：hotel, hostel, apartment, resort
    transportation_mode VARCHAR(50), -- 交通偏好：plane, train, car, bus
    preferred_destinations TEXT[], -- 偏好目的地数组
    favorite_activities TEXT[], -- 偏好活动数组
    travel_frequency VARCHAR(20), -- 旅行频率：rarely, occasionally, frequently
    group_preference VARCHAR(20), -- 团队偏好：solo, couple, family, friends
    notification_settings JSONB, -- 通知设置
    privacy_settings JSONB, -- 隐私设置
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 创建用户偏好表索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 创建用户登录记录表
CREATE TABLE IF NOT EXISTS user_login_logs (
    id BIGINT PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    login_type VARCHAR(20) NOT NULL, -- wechat, account, email, phone
    login_device VARCHAR(100), -- 登录设备信息
    login_ip VARCHAR(45), -- 登录IP
    user_agent TEXT, -- 用户代理
    login_success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255), -- 失败原因
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建登录日志表索引
CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_created_at ON user_login_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_success ON user_login_logs(login_success);

-- 添加一些默认的用户数据（用于测试）
INSERT INTO users (id, openid, name, avatar, login_type, status, created_at)
VALUES 
(999999, 'test_openid_demo', '测试用户', 'https://ai-public.mastergo.com/ai/img_res/65805eacde859672f105ac7cb9520d50.jpg', 'account', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- 为测试用户添加账号信息（如果没有）
UPDATE users SET 
    username = 'testuser',
    email = 'test@example.com',
    password = '123456',
    login_type = 'account'
WHERE id = 999999 AND (username IS NULL OR email IS NULL);

-- 创建触发器：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 为用户偏好表创建触发器
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加约束：确保至少有一种登录方式
ALTER TABLE users ADD CONSTRAINT check_login_identifier 
    CHECK (openid IS NOT NULL OR username IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL);

-- 添加约束：确保状态值有效
ALTER TABLE users ADD CONSTRAINT check_user_status 
    CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));

-- 添加约束：确保登录类型有效
ALTER TABLE users ADD CONSTRAINT check_login_type 
    CHECK (login_type IN ('wechat', 'account', 'email', 'phone', 'third_party'));

-- 添加约束：确保性别值有效
ALTER TABLE users ADD CONSTRAINT check_gender 
    CHECK (gender IN ('male', 'female', 'other') OR gender IS NULL);

COMMIT;

-- 输出完成信息
SELECT 'Users table structure updated successfully!' as status;