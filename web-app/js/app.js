// 网页版旅行规划应用 - 主应用逻辑

class TravelPlannerApp {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    async init() {
        // 初始化事件监听
        this.initEventListeners();
        
        // 检查数据库连接状态并加载数据
        await this.checkDatabaseConnection();
        
        // 更新UI状态
        this.updateUI();
        
        console.log('旅行规划应用初始化完成');
    }

    // 检查数据库连接状态并加载数据
    async checkDatabaseConnection() {
        try {
            // 测试数据库连接
            const result = await supabaseClient.getCities();
            if (result.success) {
                console.log('数据库连接状态：已连接');
                // 连接成功后自动加载首页数据
                await this.loadHomeData();
            } else {
                console.warn('数据库连接状态：连接失败');
                // 静默处理连接失败，不显示错误提示
            }
        } catch (error) {
            console.error('数据库连接检查失败:', error);
            // 静默处理连接错误，不显示错误提示
        }
    }

    // 初始化事件监听器
    initEventListeners() {
        // 导航链接点击事件
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('href').substring(1);
                this.showPage(page);
            });
        });

        // 登录按钮点击事件
        document.getElementById('login-btn').addEventListener('click', () => {
            const user = supabaseClient.getCurrentUser();
            if (user) {
                this.logout();
            } else {
                this.showLoginModal();
            }
        });

        // 模态框关闭事件
        document.querySelector('.close').addEventListener('click', this.closeModal);
        document.getElementById('login-modal').addEventListener('click', (e) => {
            if (e.target.id === 'login-modal') {
                this.closeModal();
            }
        });

        // 登录/注册标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchAuthTab(tab);
            });
        });

        // 登录表单提交
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });

        // 注册表单提交
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e);
        });

        // 移动端菜单切换
        document.querySelector('.nav-toggle').addEventListener('click', () => {
            this.toggleMobileMenu();
        });
    }

    // 显示页面
    showPage(pageName) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            
            // 更新导航激活状态
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`.nav-link[href="#${pageName}"]`).classList.add('active');

            // 加载页面特定数据
            this.loadPageData(pageName);
        }

        // 关闭移动端菜单
        this.closeMobileMenu();
    }

    // 加载页面数据
    async loadPageData(pageName) {
        switch (pageName) {
            case 'home':
                await this.loadHomeData();
                break;
            case 'plans':
                await this.loadPlansData();
                break;
            case 'destinations':
                // 热门景点页面由独立的destinations.js处理
                break;
            case 'profile':
                await this.loadProfileData();
                break;
        }
    }

    // 加载首页数据
    async loadHomeData() {
        this.showLoading();
        
        try {
            // 并行加载数据
            const [citiesResult, templatesResult] = await Promise.all([
                supabaseClient.getCities(),
                supabaseClient.getPlanTemplates()
            ]);

            if (citiesResult.success) {
                this.renderDestinations(citiesResult.cities.slice(0, 6));
            }

            if (templatesResult.success) {
                this.renderTemplates(templatesResult.templates.slice(0, 4));
            }

            // 静默加载数据，不显示成功提示
        } catch (error) {
            console.error('加载首页数据失败:', error);
            this.showError('数据加载失败，请刷新页面重试');
        } finally {
            this.hideLoading();
        }
    }

    // 渲染热门目的地
    renderDestinations(cities) {
        const container = document.getElementById('destinations-grid');
        if (!container) return;

        container.innerHTML = cities.map(city => `
            <div class="card destination-card" onclick="app.viewCity('${city.id}')">
                <h4>${city.name}</h4>
                <p class="text-secondary">${city.country}</p>
                <div class="destination-info">
                    <span class="budget">💰 日均 ¥${city.avg_budget_per_day}</span>
                    <span class="season">📅 ${city.best_season.join('、')}</span>
                </div>
                <p class="travel-tips">${city.travel_tips || '暂无旅行提示'}</p>
            </div>
        `).join('');
    }

    // 渲染行程模板
    renderTemplates(templates) {
        const container = document.getElementById('templates-grid');
        if (!container) return;

        container.innerHTML = templates.map(template => `
            <div class="card template-card" onclick="app.useTemplate('${template.id}')">
                <h4>${template.title}</h4>
                <p class="text-secondary">📍 ${template.destination}</p>
                <div class="template-meta">
                    <span>⏱ ${template.duration_days}天</span>
                    <span>💰 ¥${template.total_budget}</span>
                    <span>🔥 ${template.popularity}</span>
                </div>
                <p>${template.description || '暂无描述'}</p>
                <button class="btn btn-primary" onclick="event.stopPropagation(); app.useTemplate('${template.id}')">
                    使用模板
                </button>
            </div>
        `).join('');
    }

    // 使用模板
    async useTemplate(templateId) {
        const user = supabaseClient.getCurrentUser();
        if (!user) {
            this.showLoginModal();
            return;
        }

        // 获取模板详情
        const result = await supabaseClient.getPlanTemplates();
        if (result.success) {
            const template = result.templates.find(t => t.id === templateId);
            if (template) {
                this.showPage('plans');
                // 这里可以预填充行程创建表单
                this.prefillPlanForm(template);
            }
        }
    }

    // 预填充行程表单
    prefillPlanForm(template) {
        // 实现表单预填充逻辑
        console.log('预填充模板:', template);
    }

    // 显示登录模态框
    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
    }

    // 关闭模态框
    closeModal() {
        document.getElementById('login-modal').style.display = 'none';
    }

    // 切换认证标签
    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    // 处理登录
    async handleLogin(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        this.showLoading();
        
        try {
            const result = await supabaseClient.signIn(email, password);
            if (result.success) {
                this.closeModal();
                this.showSuccess('登录成功！');
                this.updateUI();
                this.loadPageData(this.currentPage);
            } else {
                this.showError(result.error || '登录失败');
            }
        } catch (error) {
            this.showError('登录过程中发生错误');
        } finally {
            this.hideLoading();
        }
    }

    // 处理注册
    async handleRegister(e) {
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        this.showLoading();
        
        try {
            const result = await supabaseClient.signUp(email, password, { username });
            if (result.success) {
                this.closeModal();
                this.showSuccess('注册成功！请检查邮箱验证邮件');
            } else {
                this.showError(result.error || '注册失败');
            }
        } catch (error) {
            this.showError('注册过程中发生错误');
        } finally {
            this.hideLoading();
        }
    }

    // 退出登录
    async logout() {
        const result = await supabaseClient.signOut();
        if (result.success) {
            this.showSuccess('已退出登录');
            this.updateUI();
            this.loadPageData(this.currentPage);
        } else {
            this.showError('退出登录失败');
        }
    }

    // 更新UI状态
    updateUI() {
        supabaseClient.updateUI();
    }

    // 显示加载状态
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    // 隐藏加载状态
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    // 显示成功消息
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // 显示错误消息
    showError(message) {
        this.showNotification(message, 'error');
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // 切换移动端菜单
    toggleMobileMenu() {
        const menu = document.querySelector('.nav-menu');
        menu.classList.toggle('active');
    }

    // 关闭移动端菜单
    closeMobileMenu() {
        const menu = document.querySelector('.nav-menu');
        menu.classList.remove('active');
    }
}

// 全局应用实例
const app = new TravelPlannerApp();

// 全局函数供HTML调用
function showPage(pageName) {
    app.showPage(pageName);
}

function logout() {
    app.logout();
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
    }
`;
document.head.appendChild(style);