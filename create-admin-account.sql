-- 创建管理员账户和设置管理员角色
-- 在Supabase数据库中执行此脚本

-- 1. 首先检查并添加role字段（如果不存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 2. 检查表结构是否匹配
-- 确保你的用户表名为 profiles 或 app_users
-- 如果表名不同，请根据实际情况调整下面的表名

-- 3. 创建默认管理员账户（方案一：通过注册函数创建）
-- 注意：Supabase通过auth.users表管理账户，这里需要创建对应的用户记录

-- 方式一：通过Supabase Auth系统创建管理员账户
-- 首先在Supabase的Authentication页面手动创建用户，然后在这里设置角色

-- 假设你已经通过前端注册了以下用户，现在要将其设置为管理员
-- 请将下面的用户名替换为实际存在的用户名

-- 将现有用户设置为管理员
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE username = 'admin';

-- 如果不存在admin用户，请先在前端注册一个用户，然后执行以下更新
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE username = '你的用户名';

-- 4. 测试SQL（可选）：检查当前用户及其角色
SELECT 
    id, 
    username, 
    email, 
    role, 
    created_at, 
    updated_at 
FROM profiles 
WHERE role = 'admin';

-- 5. 如果需要在数据库中直接创建管理员账户（不推荐在生产环境使用）
-- 注意：这种方式需要同时处理auth.users表和profiles表
-- 仅在开发环境或特殊情况下使用

/*
-- 开发环境快速创建管理员账户（需要禁用RLS）
INSERT INTO profiles (
    id, username, email, role, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'admin',
    'admin@travelplanner.com',
    'admin',
    NOW(),
    NOW()
);
*/

-- 6. 重要提示
-- 在实际使用中，建议通过以下方式创建管理员账户：
-- 1. 在前端注册一个普通用户
-- 2. 在数据库中执行 UPDATE profiles SET role = 'admin' WHERE username = '你的用户名';
-- 3. 使用该账户登录后台管理系统

-- 7. 验证管理员账户设置
SELECT 
    '管理员账户设置完成' as status,
    username,
    email,
    role
FROM profiles 
WHERE role = 'admin';