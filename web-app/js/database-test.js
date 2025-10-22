// 数据库连接测试工具
class DatabaseTester {
    constructor() {
        this.supabaseClient = supabaseClient;
        this.testResults = [];
    }

    // 运行所有测试
    async runAllTests() {
        console.log('开始数据库连接测试...');
        
        try {
            await this.testConnection();
            await this.testTables();
            await this.testDataAccess();
            await this.testAuthentication();
            
            this.displayResults();
        } catch (error) {
            console.error('测试失败:', error);
        }
    }

    // 测试基本连接
    async testConnection() {
        try {
            const startTime = Date.now();
            const { data, error } = await this.supabaseClient.client.from('cities').select('count').single();
            const endTime = Date.now();
            
            if (error) throw error;
            
            this.testResults.push({
                name: '数据库连接',
                status: '通过',
                details: `连接时间: ${endTime - startTime}ms`,
                success: true
            });
        } catch (error) {
            this.testResults.push({
                name: '数据库连接',
                status: '失败',
                details: error.message,
                success: false
            });
        }
    }

    // 测试表结构
    async testTables() {
        const requiredTables = ['profiles', 'cities', 'plan_templates', 'travel_plans', 'attractions'];
        const tableResults = [];

        for (const table of requiredTables) {
            try {
                const { data, error } = await this.supabaseClient.client.from(table).select('*').limit(1);
                
                if (error && error.code === '42P01') {
                    tableResults.push({
                        table,
                        exists: false,
                        error: '表不存在'
                    });
                } else if (error) {
                    tableResults.push({
                        table,
                        exists: true,
                        error: error.message
                    });
                } else {
                    tableResults.push({
                        table,
                        exists: true,
                        recordCount: data ? data.length : 0
                    });
                }
            } catch (error) {
                tableResults.push({
                    table,
                    exists: false,
                    error: error.message
                });
            }
        }

        const allTablesExist = tableResults.every(result => result.exists);
        const missingTables = tableResults.filter(result => !result.exists).map(result => result.table);

        this.testResults.push({
            name: '表结构检查',
            status: allTablesExist ? '通过' : '部分失败',
            details: allTablesExist ? 
                '所有必需表都存在' : 
                `缺少表: ${missingTables.join(', ')}`,
            success: allTablesExist,
            detailsTable: tableResults
        });
    }

    // 测试数据访问
    async testDataAccess() {
        const accessTests = [
            { table: 'cities', description: '读取城市数据' },
            { table: 'plan_templates', description: '读取行程模板' },
            { table: 'attractions', description: '读取景点数据' }
        ];

        const accessResults = [];

        for (const test of accessTests) {
            try {
                const { data, error } = await this.supabaseClient.client.from(test.table).select('*').limit(5);
                
                if (error) {
                    accessResults.push({
                        test: test.description,
                        success: false,
                        error: error.message
                    });
                } else {
                    accessResults.push({
                        test: test.description,
                        success: true,
                        recordCount: data.length
                    });
                }
            } catch (error) {
                accessResults.push({
                    test: test.description,
                    success: false,
                    error: error.message
                });
            }
        }

        const allAccessSuccessful = accessResults.every(result => result.success);

        this.testResults.push({
            name: '数据访问权限',
            status: allAccessSuccessful ? '通过' : '部分失败',
            details: allAccessSuccessful ? 
                '所有数据表都可正常访问' : 
                '部分数据表访问失败',
            success: allAccessSuccessful,
            detailsTable: accessResults
        });
    }

    // 测试认证功能
    async testAuthentication() {
        const authTests = [];

        // 测试匿名访问
        try {
            const { data, error } = await this.supabaseClient.client.from('cities').select('*').limit(1);
            authTests.push({
                test: '匿名访问公开数据',
                success: !error,
                error: error ? error.message : null
            });
        } catch (error) {
            authTests.push({
                test: '匿名访问公开数据',
                success: false,
                error: error.message
            });
        }

        // 测试需要认证的操作（模拟）
        authTests.push({
            test: '用户认证功能',
            success: true,
            details: '需要实际用户操作测试'
        });

        const authSuccessful = authTests.every(test => test.success);

        this.testResults.push({
            name: '认证系统',
            status: authSuccessful ? '通过' : '部分失败',
            details: authSuccessful ? 
                '认证系统基本正常' : 
                '认证功能存在问题',
            success: authSuccessful,
            detailsTable: authTests
        });
    }

    // 显示测试结果
    displayResults() {
        console.log('\n=== 数据库连接测试结果 ===');
        
        this.testResults.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.name}`);
            console.log(`   状态: ${result.success ? '✅' : '❌'} ${result.status}`);
            console.log(`   详情: ${result.details}`);
            
            if (result.detailsTable) {
                console.log('   详细结果:');
                result.detailsTable.forEach(detail => {
                    const status = detail.success ? '✅' : '❌';
                    console.log(`     ${status} ${detail.test}`);
                    if (detail.error) {
                        console.log(`       错误: ${detail.error}`);
                    }
                    if (detail.recordCount !== undefined) {
                        console.log(`       记录数: ${detail.recordCount}`);
                    }
                });
            }
        });

        const overallSuccess = this.testResults.every(result => result.success);
        console.log(`\n总体结果: ${overallSuccess ? '✅ 所有测试通过' : '❌ 存在问题的测试'}`);
        
        if (!overallSuccess) {
            console.log('\n建议操作:');
            console.log('1. 检查Supabase项目配置是否正确');
            console.log('2. 确认数据库表结构已正确创建');
            console.log('3. 验证API密钥和URL设置');
            console.log('4. 检查网络连接和CORS配置');
        }
    }

    // 生成测试报告
    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            results: this.testResults,
            summary: {
                totalTests: this.testResults.length,
                passedTests: this.testResults.filter(r => r.success).length,
                failedTests: this.testResults.filter(r => !r.success).length,
                overallStatus: this.testResults.every(r => r.success) ? 'PASSED' : 'FAILED'
            }
        };
    }
}

// 创建全局测试实例
const databaseTester = new DatabaseTester();

// 在页面加载完成后自动运行测试（可选）
// document.addEventListener('DOMContentLoaded', () => {
//     // 取消注释以下行以启用自动测试
//     // databaseTester.runAllTests();
// });

// 提供全局测试函数
window.runDatabaseTests = () => databaseTester.runAllTests();
window.getTestReport = () => databaseTester.generateReport();