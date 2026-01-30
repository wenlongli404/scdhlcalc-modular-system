// ==================== 应用初始化函数 ====================

async function initializeApp(config) {
    console.log('开始初始化应用...');
    
    try {
        // 1. 设置总模块数
        if (window.core) {
            const totalModules = config.enabledModules?.length || 0;
            window.core.setTotalModules(totalModules);
        }
        
        // 2. 初始化UI模块
        if (window.ui) {
            await window.ui.initialize();
        } else {
            throw new Error('UI模块未加载');
        }
        
        // 3. 检查算法是否启用
        if (!config.algorithm_enabled && window.ui) {
            console.warn('算法功能被远程禁用');
            window.ui.disableAutoMatchButton();
            
            // 修改自动配模按钮事件
            const autoMatchBtn = document.getElementById('autoMatchBtn');
            if (autoMatchBtn) {
                autoMatchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.core.showNotification('自动配模功能已被远程禁用', 'error');
                });
            }
        }
        
        // 4. 设置默认值
        if (config.default_settings) {
            window.core.saveSettings(config.default_settings);
        }
        
        // 5. 检查更新
        if (config.notifications?.update_available) {
            setTimeout(() => {
                window.core.showNotification(
                    config.notifications.update_message || '有新版本可用，请刷新页面',
                    'info',
                    8000
                );
            }, 2000);
        }
        
        // 6. 设置维护模式
        if (config.notifications?.maintenance_mode) {
            setTimeout(() => {
                window.core.showNotification(
                    config.notifications.maintenance_message || '系统维护中，部分功能可能不可用',
                    'warning',
                    10000
                );
            }, 1000);
        }
        
        console.log('应用初始化完成！');
        
    } catch (error) {
        console.error('应用初始化失败:', error);
        window.core.showNotification(`应用初始化失败: ${error.message}`, 'error');
        throw error;
    }
}

// 暴露给基础框架
window.initializeApp = initializeApp;