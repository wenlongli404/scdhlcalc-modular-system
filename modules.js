// ==================== ALC板材配模管理系统 - 核心模块 ====================
// 版本: 1.0.0
// 最后更新: 2024-01-30

console.log('[核心模块] 正在加载...');

class CoreModule {
    constructor(config) {
        this.config = config || {};
        this.modules = {};
        this.settings = this.loadSettings();
        this.state = {
            initialized: false,
            modulesLoaded: 0,
            totalModules: 0
        };
        
        console.log('[核心模块] 初始化完成', this.config);
    }
    
    // 加载设置
    loadSettings() {
        try {
            const saved = localStorage.getItem('alc_settings');
            const defaults = this.config.default_settings || {
                templateSize: 6000,
                cutLoss: 0,
                minCombinationRange: 4000,
                maxCombinationRange: 6000,
                autoAdjustQuantity: true
            };
            
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch (error) {
            console.error('[核心模块] 加载设置失败:', error);
            return this.config.default_settings || {};
        }
    }
    
    // 保存设置
    saveSettings(newSettings = {}) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            localStorage.setItem('alc_settings', JSON.stringify(this.settings));
            
            // 触发设置更新事件
            this.emit('settingsUpdated', this.settings);
            
            console.log('[核心模块] 设置已保存:', this.settings);
            return true;
        } catch (error) {
            console.error('[核心模块] 保存设置失败:', error);
            return false;
        }
    }
    
    // 注册模块
    registerModule(name, moduleInstance) {
        if (this.modules[name]) {
            console.warn(`[核心模块] 模块 ${name} 已存在，将被覆盖`);
        }
        
        this.modules[name] = moduleInstance;
        this.state.modulesLoaded++;
        
        console.log(`[核心模块] 模块已注册: ${name}`);
        this.emit('moduleRegistered', { name, instance: moduleInstance });
        
        // 检查是否所有模块都已加载
        this.checkAllModulesLoaded();
        
        return true;
    }
    
    // 获取模块
    getModule(name) {
        return this.modules[name];
    }
    
    // 检查所有模块是否加载完成
    checkAllModulesLoaded() {
        if (this.state.modulesLoaded >= this.state.totalModules && !this.state.initialized) {
            this.state.initialized = true;
            this.emit('allModulesLoaded');
            console.log('[核心模块] 所有模块加载完成');
        }
    }
    
    // 设置总模块数
    setTotalModules(count) {
        this.state.totalModules = count;
        console.log(`[核心模块] 总模块数: ${count}`);
    }
    
    // 显示通知
    showNotification(message, type = 'info', duration = 5000) {
        const types = {
            success: { icon: 'fa-check-circle', color: '#10b981', bg: '#f0fdf4', border: '#10b981' },
            error: { icon: 'fa-times-circle', color: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
            warning: { icon: 'fa-exclamation-triangle', color: '#f59e0b', bg: '#fef3c7', border: '#f59e0b' },
            info: { icon: 'fa-info-circle', color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6' }
        };
        
        const config = types[type] || types.info;
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 0.5rem;
            border-left-width: 4px;
            border-left-color: ${config.border};
            background-color: ${config.bg};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas ${config.icon}" style="color: ${config.color}; font-size: 1.25rem;"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm" style="color: #1f2937;">${message}</p>
                </div>
                <button class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 close-notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 关闭按钮事件
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        // 触发通知事件
        this.emit('notificationShown', { message, type, duration });
        
        return notification;
    }
    
    // 移除通知
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    // 事件系统
    events = {};
    
    // 监听事件
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    // 移除监听
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
    
    // 触发事件
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[核心模块] 事件处理错误 (${event}):`, error);
                }
            });
        }
    }
    
    // 工具函数：防抖
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 工具函数：节流
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // 数据验证
    validateBoardData(board) {
        const errors = [];
        
        if (!board.length || board.length <= 0) {
            errors.push('长度必须大于0');
        }
        
        if (!board.width || board.width <= 0) {
            errors.push('宽度必须大于0');
        }
        
        if (!board.thickness || board.thickness <= 0) {
            errors.push('厚度必须大于0');
        }
        
        if (!board.quantity || board.quantity <= 0) {
            errors.push('数量必须大于0');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // 导出数据为CSV
    exportToCSV(data, filename) {
        try {
            if (!data || data.length === 0) {
                throw new Error('没有数据可导出');
            }
            
            // 获取表头
            const headers = Object.keys(data[0]);
            
            // 创建CSV内容
            let csvContent = headers.join(',') + '\n';
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    // 处理包含逗号的值
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                });
                csvContent += values.join(',') + '\n';
            });
            
            // 创建Blob并下载
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(blob, filename);
            } else {
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            return true;
        } catch (error) {
            console.error('[核心模块] CSV导出失败:', error);
            this.showNotification(`导出失败: ${error.message}`, 'error');
            return false;
        }
    }
    
    // 格式化日期
    formatDate(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
        const d = date instanceof Date ? date : new Date(date);
        
        const pad = (n) => n.toString().padStart(2, '0');
        
        const replacements = {
            'YYYY': d.getFullYear(),
            'MM': pad(d.getMonth() + 1),
            'DD': pad(d.getDate()),
            'HH': pad(d.getHours()),
            'mm': pad(d.getMinutes()),
            'ss': pad(d.getSeconds())
        };
        
        return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
    }
    
    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // 检查更新
    async checkForUpdates() {
        try {
            const response = await fetch(window.CONFIG_URL + '?t=' + Date.now());
            const remoteConfig = await response.json();
            
            const localVersion = this.config.version || '1.0.0';
            const remoteVersion = remoteConfig.version || '1.0.0';
            
            if (remoteVersion > localVersion) {
                this.showNotification(
                    `发现新版本 ${remoteVersion}，请刷新页面获取更新`,
                    'info',
                    10000
                );
                return {
                    updateAvailable: true,
                    localVersion,
                    remoteVersion,
                    changelog: remoteConfig.changelog || ''
                };
            }
            
            return { updateAvailable: false };
        } catch (error) {
            console.error('[核心模块] 检查更新失败:', error);
            return { updateAvailable: false, error: error.message };
        }
    }
    
    // 清理过期数据
    cleanupOldData(retentionDays = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            
            // 清理历史数据
            const history = JSON.parse(localStorage.getItem('alc_history') || '[]');
            const filteredHistory = history.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= cutoffDate;
            });
            
            if (history.length !== filteredHistory.length) {
                localStorage.setItem('alc_history', JSON.stringify(filteredHistory));
                console.log(`[核心模块] 清理了 ${history.length - filteredHistory.length} 条历史记录`);
            }
            
            return filteredHistory.length;
        } catch (error) {
            console.error('[核心模块] 数据清理失败:', error);
            return 0;
        }
    }
}

// 创建全局核心模块实例
window.core = new CoreModule(window.appConfig);
window.CoreModule = CoreModule;

console.log('[核心模块] 加载完成，已注册为 window.core');