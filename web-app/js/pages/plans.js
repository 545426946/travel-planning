// 行程规划页面逻辑
class PlansPage {
    constructor(app) {
        this.app = app;
        this.init();
    }

    async init() {
        this.initEventListeners();
        await this.loadPlans();
    }

    initEventListeners() {
        // 创建行程按钮
        document.getElementById('create-plan-btn').addEventListener('click', () => {
            this.showCreatePlanModal();
        });

        // 行程搜索
        document.getElementById('plan-search').addEventListener('input', (e) => {
            this.searchPlans(e.target.value);
        });

        // 筛选器
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.filterPlans(filter);
            });
        });
    }

    async loadPlans() {
        const user = supabaseClient.getCurrentUser();
        if (!user) {
            this.showLoginPrompt();
            return;
        }

        this.app.showLoading();
        
        try {
            const result = await supabaseClient.getUserPlans(user.id);
            if (result.success) {
                this.renderPlans(result.plans);
            } else {
                this.app.showError('加载行程失败');
            }
        } catch (error) {
            this.app.showError('加载行程时发生错误');
        } finally {
            this.app.hideLoading();
        }
    }

    renderPlans(plans) {
        const container = document.getElementById('plans-container');
        if (!container) return;

        if (plans.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>暂无行程计划</h3>
                    <p>开始创建您的第一个旅行计划吧！</p>
                    <button class="btn btn-primary" onclick="plansPage.showCreatePlanModal()">
                        创建行程
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = plans.map(plan => `
            <div class="plan-card" onclick="plansPage.viewPlan('${plan.id}')">
                <div class="plan-header">
                    <h4>${plan.title}</h4>
                    <span class="plan-status ${plan.status}">${this.getStatusText(plan.status)}</span>
                </div>
                <div class="plan-info">
                    <span>📍 ${plan.destination}</span>
                    <span>📅 ${this.formatDate(plan.start_date)} - ${this.formatDate(plan.end_date)}</span>
                    <span>💰 ¥${plan.total_budget}</span>
                </div>
                <div class="plan-actions">
                    <button class="btn btn-outline" onclick="event.stopPropagation(); plansPage.editPlan('${plan.id}')">
                        编辑
                    </button>
                    <button class="btn btn-primary" onclick="event.stopPropagation(); plansPage.viewPlan('${plan.id}')">
                        查看详情
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'draft': '草稿',
            'planned': '已规划',
            'in_progress': '进行中',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('zh-CN');
    }

    showCreatePlanModal() {
        // 实现创建行程模态框
        console.log('显示创建行程模态框');
    }

    searchPlans(keyword) {
        // 实现行程搜索
        console.log('搜索行程:', keyword);
    }

    filterPlans(filter) {
        // 实现行程筛选
        console.log('筛选行程:', filter);
    }

    viewPlan(planId) {
        // 查看行程详情
        console.log('查看行程:', planId);
    }

    editPlan(planId) {
        // 编辑行程
        console.log('编辑行程:', planId);
    }

    showLoginPrompt() {
        const container = document.getElementById('plans-container');
        container.innerHTML = `
            <div class="empty-state">
                <h3>请先登录</h3>
                <p>登录后可以查看和管理您的行程计划</p>
                <button class="btn btn-primary" onclick="app.showLoginModal()">
                    立即登录
                </button>
            </div>
        `;
    }
}

// 全局实例
const plansPage = new PlansPage(app);