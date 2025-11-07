// 简单的Supabase管理员账户创建脚本
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://hrgskukcnlwmjbpvitsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ3NrdWtjbmx3bWpicHZpdHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTE2ODksImV4cCI6MjA3NjU4NzY4OX0.zj1ZTOgChM8bKtIh3w2Z8oSftGMocho_COKkCp6FDhY';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleCreateAdmin() {
    console.log('🚀 开始创建管理员账户liu...\n');
    
    try {
        // 方法1：直接使用Supabase Auth注册用户
        console.log('🔑 尝试通过注册方式创建用户...');
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: 'liu@example.com',
            password: '123456',
            options: {
                data: {
                    username: 'liu',
                    role: 'admin'
                }
            }
        });
        
        if (authError) {
            console.log('❌ 注册方式失败:', authError.message);
            console.log('\n🔄 尝试其他方法...\n');
            
            // 方法2：先登录确认数据库连接
            console.log('🔍 检查数据库连接...');
            
            const { data: cities, error: queryError } = await supabase
                .from('cities')
                .select('*')
                .limit(1);
                
            if (queryError) {
                console.log('❌ 数据库连接失败:', queryError.message);
                console.log('\n💡 建议：请手动在Supabase控制台中执行SQL');
                return;
            }
            
            console.log('✅ 数据库连接正常！');
            console.log('\n📋 请在Supabase控制台中执行以下SQL语句：\n');
            
            // 生成可以直接执行的SQL
            const sql = `
-- 在Supabase SQL Editor中执行此语句
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at, username
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'liu@example.com',
    crypt('123456', gen_salt('bf')),
    now(),
    '{"username": "liu", "role": "admin"}',
    now(),
    now(),
    'liu'
);

-- 验证结果
SELECT id, email, username, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'liu@example.com';
            `;
            
            console.log(sql);
            
        } else if (authData.user) {
            console.log('✅ 管理员账户创建成功！');
            console.log('用户信息:', {
                id: authData.user.id,
                email: authData.user.email,
                username: authData.user.user_metadata?.username,
                role: authData.user.user_metadata?.role
            });
            
            // 验证用户创建
            console.log('\n🔍 验证用户创建...');
            const { data: users } = await supabase
                .from('auth.users')
                .select('*')
                .eq('email', 'liu@example.com');
                
            console.log('验证结果:', users);
        }
        
    } catch (error) {
        console.error('❌ 创建过程中发生错误:', error);
    }
}

// 执行创建
simpleCreateAdmin();