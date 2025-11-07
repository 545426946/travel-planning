-- 直接创建管理员账户liu的SQL脚本
-- 请在Supabase SQL Editor中执行此脚本

-- 1. 首先确保用户表有role字段
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 2. 检查是否已存在用户liu
SELECT * FROM auth.users WHERE email = 'liu@example.com' OR username = 'liu';

-- 3. 如果不存在，创建新用户
-- 注意：Supabase认证系统会自动处理密码哈希，这里使用INSERT创建用户
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    username
) 
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'liu@example.com',
    crypt('123456', gen_salt('bf')), -- 密码123456经过bcrypt加密
    now(),
    now(),
    '',
    now(),
    '',
    now(),
    '',
    '',
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "liu", "role": "admin"}',
    false,
    now(),
    now(),
    '',
    now(),
    '',
    '',
    now(),
    '',
    0,
    now(),
    '',
    now(),
    'liu'
)
ON CONFLICT (email) DO NOTHING;

-- 4. 设置用户角色为admin
UPDATE auth.users 
SET role = 'admin', 
    raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'liu@example.com' OR username = 'liu';

-- 5. 验证用户创建成功
SELECT 
    id, 
    email, 
    username, 
    role,
    raw_user_meta_data->>'username' as meta_username,
    raw_user_meta_data->>'role' as meta_role
FROM auth.users 
WHERE email = 'liu@example.com' OR username = 'liu';