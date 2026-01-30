// ==================== ALC板材配模管理系统 - 历史模块 ====================
// 版本: 1.0.0
// 最后更新: 2024-01-30

console.log('[历史模块] 正在加载...');

class HistoryModule {
    constructor(config) {
        this.config = config || {};
        this.core = window.core;
        this.dataModule = null;
        this.uiModule = null;
        
        console.log('[历史模块] 初始化完成');
    }
    
    // 设置模块引用
    setModuleRefs(dataModule, uiModule) {
        this.dataModule = dataModule;
        this.uiModule = uiModule;
        console.log('[历史模块] 模块引用已设置');
    }
    
    // 查询历史记录
    searchHistory(startDate, endDate, projectFilter = '') {
        try {
            if (!this.dataModule) {
                throw new Error('数据模块未加载');
            }
            
            let filteredHistory = [...this.dataModule.historyData];
            
            // 日期过滤
            if (startDate) {
                const start = new Date(startDate);
                filteredHistory = filteredHistory.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate >= start;
                });
            }
            
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filteredHistory = filteredHistory.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate <= end;
                });
            }
            
            // 项目名称过滤
            if (projectFilter.trim()) {
                const filter = projectFilter.toLowerCase();
                filteredHistory = filteredHistory.filter(entry => {
                    return entry.boards.some(board => 
                        board.project.toLowerCase().includes(filter)
                    );
                });
            }
            
            console.log(`[历史模块] 查询到 ${filteredHistory.length} 条历史记录`);
            return filteredHistory;
            
        } catch (error) {
            console.error('[历史模块] 查询失败:', error);
            throw error;
        }
    }
    
    // 渲染历史查询结果
    renderHistoryResults(historyEntries, containerId = 'historyResults') {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error('历史结果容器未找到');
            }
            
            if (historyEntries.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-search text-2xl mb-2"></i>
                        <p>没有找到匹配的历史记录</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = historyEntries.map(entry => `
                <div class="history-item bg-white rounded-lg p-4 shadow-sm cursor-pointer" 
                     data-entry-id="${entry.id}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-900">${entry.date}</h4>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                                <div>规格数: ${entry.summary.totalBoards}</div>
                                <div>已配模: ${entry.summary.matchedBoards}</div>
                                <div>模板数: ${entry.summary.totalTemplates}</div>
                                <div>已配数量: ${entry.summary.totalMatchedQuantity}</div>
                            </div>
                            <div class="mt-2 text-xs text-gray-500">
                                ${this.core.formatDate(entry.timestamp, 'YYYY-MM-DD HH:mm:ss')}
                            </div>
                        </div>
                        <div class="flex space-x-2 ml-4">
                            <button class="text-blue-600 hover:text-blue-800 text-sm load-history-btn" 
                                    data-entry-id="${entry.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="text-red-600 hover:text-red-800 text-sm delete-history-btn" 
                                    data-entry-id="${entry.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // 绑定事件
            this.bindHistoryItemEvents();
            
            console.log(`[历史模块] 渲染了 ${historyEntries.length} 条历史记录`);
            
        } catch (error) {
            console.error('[历史模块] 渲染失败:', error);
            throw error;
        }
    }
    
    // 绑定历史项目事件
    bindHistoryItemEvents() {
        // 加载历史记录
        document.querySelectorAll('.load-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = e.currentTarget.dataset.entryId;
                this.loadHistoryEntry(entryId);
            });
        });
        
        // 删除历史记录
        document.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = e.currentTarget.dataset.entryId;
                this.deleteHistoryEntry(entryId);
            });
        });
        
        // 点击整个项目
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const entryId = item.dataset.entryId;
                    this.loadHistoryEntry(entryId);
                }
            });
        });
    }
    
    // 加载历史记录
    async loadHistoryEntry(entryId) {
        try {
            if (!this.dataModule) {
                throw new Error('数据模块未加载');
            }
            
            const entry = this.dataModule.historyData.find(item => item.id === entryId);
            if (!entry) {
                throw new Error('未找到对应的历史记录');
            }
            
            // 确认加载
            if (!confirm('确定要加载这条历史记录吗？当前未保存的数据将会丢失。')) {
                return;
            }
            
            // 更新数据模块
            this.dataModule.boards = [...entry.boards];
            this.dataModule.matchingResults = [...entry.matchingResults];
            
            // 更新核心设置
            if (entry.settings) {
                this.core.saveSettings(entry.settings);
            }
            
            // 触发数据更新事件
            this.core.emit('boardsUpdated', this.dataModule.boards);
            this.core.emit('matchingResultsUpdated', this.dataModule.matchingResults);
            
            // 更新UI
            if (this.uiModule) {
                this.uiModule.updateUI();
                this.uiModule.renderBoardsList(this.dataModule.boards);
                this.uiModule.renderMatchingResults(this.dataModule.matchingResults);
            }
            
            // 关闭历史面板
            this.toggleHistoryPanel(false);
            
            this.core.showNotification('历史记录加载成功', 'success');
            console.log('[历史模块] 历史记录已加载:', entryId);
            
        } catch (error) {
            console.error('[历史模块] 加载历史记录失败:', error);
            this.core.showNotification(`加载失败: ${error.message}`, 'error');
        }
    }
    
    // 删除历史记录
    async deleteHistoryEntry(entryId) {
        try {
            if (!this.dataModule) {
                throw new Error('数据模块未加载');
            }
            
            // 确认删除
            if (!confirm('确定要删除这条历史记录吗？此操作不可撤销。')) {
                return;
            }
            
            const initialCount = this.dataModule.historyData.length;
            this.dataModule.historyData = this.dataModule.historyData.filter(item => item.id !== entryId);
            
            this.dataModule.saveHistoryData();
            
            const removedCount = initialCount - this.dataModule.historyData.length;
            
            // 重新查询并渲染
            if (this.uiModule && this.uiModule.elements) {
                const startDate = this.uiModule.elements.startDate?.value;
                const endDate = this.uiModule.elements.endDate?.value;
                const projectFilter = this.uiModule.elements.projectFilter?.value || '';
                
                const filteredHistory = this.searchHistory(startDate, endDate, projectFilter);
                this.renderHistoryResults(filteredHistory);
            }
            
            this.core.showNotification('历史记录已删除', 'success');
            console.log('[历史模块] 历史记录已删除:', entryId);
            
        } catch (error) {
            console.error('[历史模块] 删除历史记录失败:', error);
            this.core.showNotification(`删除失败: ${error.message}`, 'error');
        }
    }
    
    // 导出历史数据
    exportHistoryData(historyEntries = null) {
        try {
            const entries = historyEntries || this.dataModule?.historyData || [];
            
            if (entries.length === 0) {
                throw new Error('没有历史数据可导出');
            }
            
            const exportData = entries.map(entry => {
                // 统计每种厚度的板材数量
                const thicknessStats = {};
                entry.boards.forEach(board => {
                    const thickness = board.thickness + 'mm';
                    thicknessStats[thickness] = (thicknessStats[thickness] || 0) + board.quantity;
                });
                
                return {
                    '日期': entry.date,
                    '时间': this.core.formatDate(entry.timestamp, 'HH:mm:ss'),
                    '总规格数': entry.summary.totalBoards,
                    '已配模规格': entry.summary.matchedBoards,
                    '模板数量': entry.summary.totalTemplates,
                    '已配模数量': entry.summary.totalMatchedQuantity,
                    '厚度统计': Object.entries(thicknessStats).map(([thickness, count]) => 
                        `${thickness}:${count}`).join('; '),
                    '项目列表': [...new Set(entry.boards.map(b => b.project))].join('; ')
                };
            });
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, "历史数据");
            
            const fileName = `ALC历史数据_${this.core.formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            console.log(`[历史模块] 已导出 ${entries.length} 条历史数据`);
            return fileName;
            
        } catch (error) {
            console.error('[历史模块] 导出历史数据失败:', error);
            throw error;
        }
    }
    
    // 切换历史面板
    toggleHistoryPanel(show = null) {
        try {
            const historyPanel = document.getElementById('historyPanel');
            if (!historyPanel) return;
            
            const shouldShow = show !== null ? show : !historyPanel.classList.contains('open');
            
            if (shouldShow) {
                historyPanel.classList.add('open');
                
                // 执行查询并渲染
                if (this.uiModule && this.uiModule.elements) {
                    const startDate = this.uiModule.elements.startDate?.value;
                    const endDate = this.uiModule.elements.endDate?.value;
                    const projectFilter = this.uiModule.elements.projectFilter?.value || '';
                    
                    const filteredHistory = this.searchHistory(startDate, endDate, projectFilter);
                    this.renderHistoryResults(filteredHistory);
                }
                
            } else {
                historyPanel.classList.remove('open');
            }
            
            console.log(`[历史模块] 历史面板 ${shouldShow ? '打开' : '关闭'}`);
            
        } catch (error) {
            console.error('[历史模块] 切换历史面板失败:', error);
        }
    }
    
    // 清理过期历史数据
    cleanupOldHistory(retentionDays = 7) {
        try {
            if (!this.dataModule) return 0;
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            
            const initialCount = this.dataModule.historyData.length;
            this.dataModule.historyData = this.dataModule.historyData.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= cutoffDate;
            });
            
            const removedCount = initialCount - this.dataModule.historyData.length;
            
            if (removedCount > 0) {
                this.dataModule.saveHistoryData();
                console.log(`[历史模块] 清理了 ${removedCount} 条过期历史记录`);
            }
            
            return removedCount;
            
        } catch (error) {
            console.error('[历史模块] 清理历史数据失败:', error);
            return 0;
        }
    }
}

// 创建历史模块实例并注册到核心
const historyModule = new HistoryModule(window.appConfig);
window.history = historyModule;
window.HistoryModule = HistoryModule;

// 注册到核心模块
if (window.core) {
    window.core.registerModule('history', historyModule);
    
    // 监听其他模块加载
    window.core.on('moduleRegistered', ({ name, instance }) => {
        if (name === 'data') {
            historyModule.setModuleRefs(instance, window.ui);
        } else if (name === 'ui') {
            historyModule.setModuleRefs(window.data, instance);
        }
    });
}

console.log('[历史模块] 加载完成，已注册为 window.history');