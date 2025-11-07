-- 创建管理员账户liu，使用正确的QQ邮箱格式
-- 请在Supabase SQL Editor中执行此脚本

-- 1. 创建管理员账户
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at, username
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '1487379304@qq.com',
    crypt('123456', gen_salt('bf')),
    now(),
    '{"username": "liu", "role": "admin", "display_name": "刘管理员"}',
    now(),
    now(),
    'liu'
);

-- 2. 设置管理员角色
UPDATE auth.users 
SET role = 'admin', 
    raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = '1487379304@qq.com';

-- 3. 验证创建结果
SELECT 
    id, 
    email, 
    username, 
    role,
    raw_user_meta_data->>'username' as meta_username,
    raw_user_meta_data->>'role' as meta_role,
    raw_user_meta_data->>'display_name' as display_name
FROM auth.users 
WHERE email = '1487379304@qq.com';

-- 4. 检查是否在app_users表中创建对应记录（如果需要）
-- 插入到app_users表（如果表存在）
INSERT INTO app_users (
    id, username, email, display_name, role, is_active, created_at, updated_at
) 
SELECT 
    id, 'liu', '1487379304@qq.com', '刘管理员', 'admin', true, now(), now()
FROM auth.users 
WHERE email = '1487379304@qq.com'
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = now();

-- 5. 验证app_users表记录
SELECT * FROM app_users WHERE email = '1487379304@qq.com';