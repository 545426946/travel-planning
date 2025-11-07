// 直接在Supabase中创建管理员账户liu
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://hrgskukcnlwmjbpvitsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ3NrdWtjbmx3bWpicHZpdHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTE2ODksImV4cCI6MjA3NjU4NzY4OX0.zj1ZTOgChM8bKtIh3w2Z8oSftGMocho_COKkCp6FDhY';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
    try {
        console.log('开始创建管理员账户...');
        
        // 方法1：使用Supabase Auth API创建用户
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'liu@example.com',
            password: '123456',
            email_confirm: true,
            user_metadata: {
                username: 'liu',
                role: 'admin'
            }
        });
        
        if (authError) {
            console.log('方法1失败，尝试方法2...');
            
            // 方法2：使用数据库SQL直接插入
            const { data: sqlData, error: sqlError } = await supabase
                .from('app_users')
                .insert([{
                    username: 'liu',
                    email: 'liu@example.com',
                    display_name: '刘管理员',
                    role: 'admin',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select();
                
            if (sqlError) {
                console.log('方法2失败，尝试方法3...');
                
                // 方法3：使用REST API直接调用
                const response = await fetch(`${supabaseUrl}/rest/v1/app_users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        username: 'liu',
                        email: 'liu@example.com',
                        display_name: '刘管理员',
                        role: 'admin',
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ 管理员账户创建成功！');
                    console.log('创建结果:', result);
                } else {
                    console.error('方法3失败:', response.status, response.statusText);
                    console.log('请尝试以下手动方案...');
                }
            } else {
                console.log('✅ 管理员账户创建成功！');
                console.log('创建结果:', sqlData);
            }
        } else {
            console.log('✅ 管理员账户创建成功！');
            console.log('创建结果:', authData);
        }
        
        // 验证用户是否创建成功
        console.log('\n验证用户创建...');
        const { data: users, error: usersError } = await supabase
            .from('app_users')
            .select('*')
            .eq('username', 'liu');
            
        if (usersError) {
            console.error('验证失败:', usersError);
        } else {
            console.log('✅ 验证成功！找到用户:', users);
        }
        
    } catch (error) {
        console.error('创建管理员账户失败:', error);
    }
}

// 执行创建
createAdminUser();