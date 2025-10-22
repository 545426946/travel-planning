// Supabase客户端配置 - 网页版
class SupabaseClient {
    constructor() {
        // Supabase配置 - 请替换为您的实际项目配置
        this.supabaseUrl = 'https://hrgskukcnlwmjbpvitsg.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ3NrdWtjbmx3bWpicHZpdHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTE2ODksImV4cCI6MjA3NjU4NzY4OX0.zj1ZTOgChM8bKtIh3w2Z8oSftGMocho_COKkCp6FDhY';
        
        this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        this.connectionStatus = 'connecting'; // connecting, connected, error
        this.init();
    }

    async init() {
        try {
            // 显示连接中状态
            this.showConnectionStatus('正在连接数据库...', 'info');
            
            // 测试数据库连接
            const { data, error } = await this.client.from('cities').select('count').limit(1);
            
            if (error) {
                throw error;
            }
            
            // 连接成功
            this.connectionStatus = 'connected';
            this.showConnectionStatus('数据库连接成功！', 'success');
            
        } catch (error) {
            console.error('数据库连接失败:', error);
            this.connectionStatus = 'error';
            this.showConnectionStatus('数据库连接失败，请检查网络连接', 'error');
        }
        
        // 检查用户登录状态
        const { data: { user } } = await this.client.auth.getUser();
        if (user) {
            this.setUser(user);
        }
    }

    // 显示连接状态提醒
    showConnectionStatus(message, type = 'info') {
        // 移除现有的连接状态通知
        const existingNotification = document.querySelector('.connection-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `connection-notification connection-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            ${type === 'info' ? '<div class="loading-spinner"></div>' : ''}
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInDown 0.3s ease-out;
            max-width: 400px;
            text-align: center;
        `;

        document.body.appendChild(notification);

        // 根据类型设置不同的显示时间
        const duration = type === 'info' ? 5000 : 3000;
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutUp 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    // 检查连接状态
    isConnected() {
        return this.connectionStatus === 'connected';
    }

    // 用户认证方法
    async signUp(email, password, userData) {
        try {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });

            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            this.setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;
            this.clearUser();
            return { success: true };
        } catch (error) {
            console.error('退出失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 用户状态管理
    setUser(user) {
        this.user = user;
        localStorage.setItem('travel_user', JSON.stringify(user));
        this.updateUI();
    }

    clearUser() {
        this.user = null;
        localStorage.removeItem('travel_user');
        this.updateUI();
    }

    getCurrentUser() {
        if (this.user) return this.user;
        
        const storedUser = localStorage.getItem('travel_user');
        if (storedUser) {
            this.user = JSON.parse(storedUser);
            return this.user;
        }
        return null;
    }

    updateUI() {
        const user = this.getCurrentUser();
        const loginBtn = document.getElementById('login-btn');
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');

        if (user) {
            loginBtn.textContent = '退出登录';
            if (userName) userName.textContent = user.user_metadata?.username || '用户';
            if (userEmail) userEmail.textContent = user.email;
        } else {
            loginBtn.textContent = '登录/注册';
            if (userName) userName.textContent = '游客';
            if (userEmail) userEmail.textContent = '请登录查看详细信息';
        }
    }

    // 数据操作方法
    async getCities() {
        try {
            const { data, error } = await this.client
                .from('cities')
                .select('*')
                .order('name');

            if (error) throw error;
            return { success: true, cities: data };
        } catch (error) {
            console.error('获取城市数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getPlanTemplates() {
        try {
            const { data, error } = await this.client
                .from('plan_templates')
                .select('*')
                .order('popularity', { ascending: false });

            if (error) throw error;
            return { success: true, templates: data };
        } catch (error) {
            console.error('获取模板失败:', error);
            return { success: false, error: error.message };
        }
    }

    async createTravelPlan(planData) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('请先登录');
            }

            const { data, error } = await this.client
                .from('travel_plans')
                .insert([{
                    ...planData,
                    user_id: user.id
                }])
                .select();

            if (error) throw error;
            return { success: true, plan: data[0] };
        } catch (error) {
            console.error('创建行程失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getTravelPlans(userId = null) {
        try {
            const user = this.getCurrentUser();
            if (!user && !userId) {
                throw new Error('请先登录');
            }

            let query = this.client.from('travel_plans').select('*');
            
            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, plans: data };
        } catch (error) {
            console.error('获取行程失败:', error);
            return { success: false, error: error.message };
        }
    }

    async createCompanionRequest(requestData) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('请先登录');
            }

            const { data, error } = await this.client
                .from('companion_requests')
                .insert([{
                    ...requestData,
                    user_id: user.id
                }])
                .select();

            if (error) throw error;
            return { success: true, request: data[0] };
        } catch (error) {
            console.error('创建结伴请求失败:', error);
            return { success: false, error: error.message };
        }
    }

    async getCompanionRequests() {
        try {
            const { data, error } = await this.client
                .from('companion_requests')
                .select(`
                    *,
                    profiles:user_id(username, university)
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, requests: data };
        } catch (error) {
            console.error('获取结伴请求失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 搜索功能
    async searchCities(keyword) {
        try {
            const { data, error } = await this.client
                .from('cities')
                .select('*')
                .ilike('name', `%${keyword}%`)
                .order('name');

            if (error) throw error;
            return { success: true, cities: data };
        } catch (error) {
            console.error('搜索城市失败:', error);
            return { success: false, error: error.message };
        }
    }

    async searchPlanTemplates(keyword) {
        try {
            const { data, error } = await this.client
                .from('plan_templates')
                .select('*')
                .or(`title.ilike.%${keyword}%,destination.ilike.%${keyword}%`)
                .order('popularity', { ascending: false });

            if (error) throw error;
            return { success: true, templates: data };
        } catch (error) {
            console.error('搜索模板失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 添加CSS动画
const connectionStyle = document.createElement('style');
connectionStyle.textContent = `
    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes slideInDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(connectionStyle);

// 创建全局实例
const supabaseClient = new SupabaseClient();