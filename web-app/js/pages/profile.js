// 用户个人资料和历史记录页面逻辑
class ProfilePage {
    constructor() {
        this.init();
    }

    async init() {
        this.initEventListeners();
        await this.loadUserProfile();
        await this.loadUserHistory();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 保存个人资料按钮
        const saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }

        // 清除历史记录按钮
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
    }

    // 加载用户个人资料
    async loadUserProfile() {
        const user = supabaseClient.getCurrentUser();
        if (!user) {
            this.showLoginPrompt();
            return;
        }

        try {
            // 获取用户资料
            const { data, error } = await supabaseClient.client
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('加载用户资料失败:', error);
                return;
            }

            this.renderProfile(data || { id: user.id, email: user.email });
        } catch (error) {
            console.error('加载用户资料错误:', error);
        }
    }

    // 渲染用户资料
    renderProfile(profile) {
        const profileForm = document.getElementById('profile-form');
        if (!profileForm) return;

        // 填充表单数据
        const elements = profileForm.elements;
        if (elements.username) elements.username.value = profile.username || '';
        if (elements.email) elements.email.value = profile.email || '';
        if (elements.university) elements.university.value = profile.university || '';

        // 显示用户统计信息
        this.renderUserStats(profile);
    }

    // 渲染用户统计信息
    async renderUserStats(profile) {
        const statsContainer = document.getElementById('user-stats');
        if (!statsContainer) return;

        try {
            // 获取用户行程统计
            const plansResult = await supabaseClient.getTravelPlans();
            const plansCount = plansResult.success ? plansResult.plans.length : 0;

            // 获取创建时间统计
            const joinDate = profile.created_at ? 
                new Date(profile.created_at).toLocaleDateString('zh-CN') : 
                '未知';

            statsContainer.innerHTML = `
                <div class="stat-card">
                    <h4>📊 用户统计</h4>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <span class="stat-label">创建行程</span>
                            <span class="stat-value">${plansCount}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">加入时间</span>
                            <span class="stat-value">${joinDate}</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('渲染用户统计错误:', error);
        }
    }

    // 保存个人资料
    async saveProfile() {
        const user = supabaseClient.getCurrentUser();
        if (!user) {
            this.showError('请先登录');
            return;
        }

        const form = document.getElementById('profile-form');
        if (!form) return;

        const formData = new FormData(form);
        const profileData = {
            username: formData.get('username'),
            email: user.email, // 使用认证邮箱
            university: formData.get('university'),
            updated_at: new Date().toISOString()
        };

        try {
            // 检查资料是否存在
            const { data: existingProfile } = await supabaseClient.client
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            let result;
            if (existingProfile) {
                // 更新现有资料
                result = await supabaseClient.client
                    .from('profiles')
                    .update(profileData)
                    .eq('id', user.id);
            } else {
                // 创建新资料
                result = await supabaseClient.client
                    .from('profiles')
                    .insert([{ ...profileData, id: user.id }]);
            }

            if (result.error) throw result.error;

            this.showSuccess('个人资料保存成功！');
            await this.loadUserProfile(); // 重新加载资料
        } catch (error) {
            console.error('保存个人资料失败:', error);
            this.showError('保存失败，请重试');
        }
    }

    // 加载用户历史记录
    async loadUserHistory() {
        const user = supabaseClient.getCurrentUser();
        if (!user) {
            this.showLoginPrompt();
            return;
        }

        try {
            // 获取用户行程历史
            const plansResult = await supabaseClient.getTravelPlans();
            if (plansResult.success) {
                this.renderTravelHistory(plansResult.plans);
            }

            // 获取用户活动记录（可选）
            await this.loadUserActivities();
        } catch (error) {
            console.error('加载历史记录失败:', error);
        }
    }

    // 渲染旅行历史
    renderTravelHistory(plans) {
        const historyContainer = document.getElementById('travel-history');
        if (!historyContainer) return;

        if (plans.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <p>📝 还没有创建任何行程</p>
                    <p class="text-secondary">开始规划您的第一次旅行吧！</p>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = plans.map(plan => `
            <div class="history-item">
                <div class="history-header">
                    <h4>${plan.title}</h4>
                    <span class="history-date">${new Date(plan.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <div class="history-details">
                    <span>📍 ${plan.destination}</span>
                    <span>⏱ ${this.calculateDuration(plan.start_date, plan.end_date)}天</span>
                    <span>💰 ¥${plan.total_budget}</span>
                    <span class="status-badge ${plan.status}">${this.getStatusText(plan.status)}</span>
                </div>
                <div class="history-actions">
                    <button class="btn btn-sm btn-outline" onclick="profilePage.viewPlan('${plan.id}')">查看详情</button>
                    <button class="btn btn-sm btn-outline" onclick="profilePage.duplicatePlan('${plan.id}')">复制行程</button>
                </div>
            </div>
        `).join('');
    }

    // 计算行程天数
    calculateDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'draft': '草稿',
            'planned': '已规划',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    }

    // 加载用户活动记录
    async loadUserActivities() {
        // 这里可以扩展加载其他类型的用户活动记录
        // 例如：浏览记录、收藏记录等
    }

    // 查看行程详情
    async viewPlan(planId) {
        // 跳转到行程详情页面或显示模态框
        console.log('查看行程:', planId);
        // 这里可以实现具体的查看逻辑
    }

    // 复制行程
    async duplicatePlan(planId) {
        try {
            const user = supabaseClient.getCurrentUser();
            if (!user) {
                this.showError('请先登录');
                return;
            }

            // 获取原行程数据
            const { data: originalPlan, error } = await supabaseClient.client
                .from('travel_plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (error) throw error;

            // 创建新行程（复制）
            const newPlan = {
                ...originalPlan,
                id: undefined, // 让数据库生成新ID
                title: `${originalPlan.title} (副本)`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const result = await supabaseClient.createTravelPlan(newPlan);
            if (result.success) {
                this.showSuccess('行程复制成功！');
                await this.loadUserHistory(); // 刷新历史记录
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('复制行程失败:', error);
            this.showError('复制失败，请重试');
        }
    }

    // 清除历史记录
    async clearHistory() {
        if (!confirm('确定要清除所有历史记录吗？此操作不可撤销。')) {
            return;
        }

        try {
            const user = supabaseClient.getCurrentUser();
            if (!user) {
                this.showError('请先登录');
                return;
            }

            // 删除用户的所有行程（可选：可以改为标记为删除）
            const { error } = await supabaseClient.client
                .from('travel_plans')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            this.showSuccess('历史记录已清除');
            await this.loadUserHistory(); // 刷新显示
        } catch (error) {
            console.error('清除历史记录失败:', error);
            this.showError('清除失败，请重试');
        }
    }

    // 显示登录提示
    showLoginPrompt() {
        const profileContainer = document.getElementById('profile-content');
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="login-prompt">
                    <h3>🔐 请先登录</h3>
                    <p>登录后可以查看和管理您的个人资料和历史记录</p>
                    <button class="btn btn-primary" onclick="app.showLoginModal()">立即登录</button>
                </div>
            `;
        }
    }

    // 显示成功消息
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-success';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 显示错误消息
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-error';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// 创建全局实例
const profilePage = new ProfilePage();