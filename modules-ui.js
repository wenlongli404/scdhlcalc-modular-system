// modules-ui.js
// ALC板材配模管理系统 - UI模块
// 用于GitHub仓库远程配置获取

class BoardMatchingUI {
    constructor() {
        this.elements = {};
        this.settings = {};
        this.boards = [];
        this.matchingResults = [];
        this.selectedThickness = [];
        this.sortOrder = 'asc';
        this.historyData = [];
        
        this.bindElements();
        this.initEventListeners();
        this.initUI();
    }
    
    // 绑定DOM元素
    bindElements() {
        // 统计相关元素
        this.elements.totalBoards = document.getElementById('totalBoards');
        this.elements.matchedBoards = document.getElementById('matchedBoards');
        this.elements.pendingBoards = document.getElementById('pendingBoards');
        this.elements.matchedQuantity = document.getElementById('matchedQuantity');
        this.elements.unmatchedQuantity = document.getElementById('unmatchedQuantity');
        
        // 板材列表相关元素
        this.elements.boardsListContainer = document.getElementById('boardsListContainer');
        this.elements.clearAllBtn = document.getElementById('clearAllBtn');
        this.elements.removeInvalidBtn = document.getElementById('removeInvalidBtn');
        this.elements.sortBoardsBtn = document.getElementById('sortBoardsBtn');
        this.elements.sortIndicator = document.getElementById('sortIndicator');
        
        // 配模结果相关元素
        this.elements.matchingResults = document.getElementById('matchingResults');
        
        // 厚度筛选相关元素
        this.elements.selectAllBtn = document.getElementById('selectAllBtn');
        this.elements.invertSelectBtn = document.getElementById('invertSelectBtn');
        this.elements.selectedThicknessEl = document.getElementById('selectedThickness');
        
        // 配模设置相关元素
        this.elements.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.elements.autoMatchBtn = document.getElementById('autoMatchBtn');
        this.elements.templateSize = document.getElementById('templateSize');
        this.elements.cutLoss = document.getElementById('cutLoss');
        this.elements.minCombinationRange = document.getElementById('minCombinationRange');
        this.elements.maxCombinationRange = document.getElementById('maxCombinationRange');
        this.elements.autoAdjustQuantity = document.getElementById('autoAdjustQuantity');
        
        // 批量操作相关元素
        this.elements.batchAddBtn = document.getElementById('batchAddBtn');
        this.elements.clearPasteBtn = document.getElementById('clearPasteBtn');
        this.elements.pasteArea = document.getElementById('pasteArea');
        this.elements.downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
        
        // 历史查询相关元素
        this.elements.historyQueryBtn = document.getElementById('historyQueryBtn');
        this.elements.historyPanel = document.getElementById('historyPanel');
        this.elements.closeHistoryBtn = document.getElementById('closeHistoryBtn');
        this.elements.startDate = document.getElementById('startDate');
        this.elements.endDate = document.getElementById('endDate');
        this.elements.projectFilter = document.getElementById('projectFilter');
        this.elements.searchHistoryBtn = document.getElementById('searchHistoryBtn');
        this.elements.historyResults = document.getElementById('historyResults');
        
        // 设置默认日期范围（最近7天）
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        this.elements.startDate.value = startDate.toISOString().split('T')[0];
        this.elements.endDate.value = endDate.toISOString().split('T')[0];
    }
    
    // 初始化UI事件监听
    initEventListeners() {
        // 厚度筛选按钮事件
        document.querySelectorAll('.thickness-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleThicknessSelection(e.target));
        });
        
        // 全选/反选按钮
        this.elements.selectAllBtn.addEventListener('click', () => this.selectAllThickness());
        this.elements.invertSelectBtn.addEventListener('click', () => this.invertSelectThickness());
        
        // 排序按钮
        this.elements.sortBoardsBtn.addEventListener('click', () => this.toggleSortOrder());
        
        // 历史查询相关事件
        this.elements.historyQueryBtn.addEventListener('click', () => this.toggleHistoryPanel());
        this.elements.closeHistoryBtn.addEventListener('click', () => this.closeHistoryPanel());
        this.elements.searchHistoryBtn.addEventListener('click', () => this.searchHistory());
        
        // 设置自动调整开关事件
        if (this.elements.autoAdjustQuantity) {
            this.elements.autoAdjustQuantity.addEventListener('change', () => {
                this.onAutoAdjustChange?.();
            });
        }
        
        // 保存设置按钮事件
        if (this.elements.saveSettingsBtn) {
            this.elements.saveSettingsBtn.addEventListener('click', () => {
                this.onSaveSettings?.();
            });
        }
        
        // 自动配模按钮事件
        if (this.elements.autoMatchBtn) {
            this.elements.autoMatchBtn.addEventListener('click', () => {
                this.onAutoMatch?.();
            });
        }
        
        // 批量操作按钮事件
        if (this.elements.batchAddBtn) {
            this.elements.batchAddBtn.addEventListener('click', () => {
                this.onBatchAdd?.();
            });
        }
        
        if (this.elements.clearPasteBtn) {
            this.elements.clearPasteBtn.addEventListener('click', () => {
                this.elements.pasteArea.value = '';
            });
        }
        
        if (this.elements.downloadTemplateBtn) {
            this.elements.downloadTemplateBtn.addEventListener('click', () => {
                this.onDownloadTemplate?.();
            });
        }
        
        // 板材列表操作事件委托
        if (this.elements.boardsListContainer) {
            this.elements.boardsListContainer.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.fa-edit')?.parentElement;
                const deleteBtn = e.target.closest('.fa-trash')?.parentElement;
                
                if (editBtn) {
                    const boardId = parseInt(editBtn.closest('.board-item').dataset.boardId);
                    this.onEditBoard?.(boardId);
                } else if (deleteBtn) {
                    const boardId = parseInt(deleteBtn.closest('.board-item').dataset.boardId);
                    this.onDeleteBoard?.(boardId);
                }
            });
        }
        
        // 清空全部按钮
        if (this.elements.clearAllBtn) {
            this.elements.clearAllBtn.addEventListener('click', () => {
                this.onClearAll?.();
            });
        }
        
        // 移除无效数据按钮
        if (this.elements.removeInvalidBtn) {
            this.elements.removeInvalidBtn.addEventListener('click', () => {
                this.onRemoveInvalid?.();
            });
        }
    }
    
    // 初始化UI
    initUI() {
        this.updateUI();
    }
    
    // 更新UI显示
    updateUI() {
        this.updateStatistics();
        this.renderBoardsList();
        this.renderMatchingResults();
        this.updateSelectedThicknessDisplay();
        this.renderThicknessButtons();
    }
    
    // 更新统计信息
    updateStatistics() {
        if (!this.elements.totalBoards) return;
        
        // 1. 总规格数
        this.elements.totalBoards.textContent = this.boards.length;
        
        // 2. 计算已配模和待配模的规格数
        const matchedBoardIds = new Set();
        this.matchingResults.forEach(result => {
            if (result.combination) {
                result.combination.forEach(board => {
                    matchedBoardIds.add(board.id);
                });
            }
        });
        
        const matchedCount = matchedBoardIds.size;
        const pendingCount = this.boards.length - matchedCount;
        
        this.elements.matchedBoards.textContent = matchedCount;
        this.elements.pendingBoards.textContent = pendingCount;
        
        // 3. 计算已配模和未配模的板材总数量
        let totalMatchedQuantity = 0;
        let totalUnmatchedQuantity = 0;
        
        this.boards.forEach(board => {
            const adjustment = this.calculateAdjustedQuantity?.(board) || { adjusted: board.quantity };
            
            // 找到该板材在配模结果中被使用的总数量
            let usedQuantity = 0;
            this.matchingResults.forEach(result => {
                if (result.layers && result.combination) {
                    if (result.isSelfCombination) {
                        const found = result.combination.find(item => item.id === board.id);
                        if (found) {
                            usedQuantity += result.layers * 2;
                        }
                    } else {
                        const found = result.combination.find(item => item.id === board.id);
                        if (found) {
                            usedQuantity += result.layers;
                        }
                    }
                }
            });
            
            usedQuantity = Math.min(usedQuantity, adjustment.adjusted);
            totalMatchedQuantity += usedQuantity;
            totalUnmatchedQuantity += (adjustment.adjusted - usedQuantity);
        });
        
        this.elements.matchedQuantity.textContent = totalMatchedQuantity;
        this.elements.unmatchedQuantity.textContent = totalUnmatchedQuantity;
    }
    
    // 渲染板材列表
    renderBoardsList() {
        const container = this.elements.boardsListContainer;
        if (!container) return;
        
        if (this.boards.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>暂无板材数据</p>
                    <p class="text-sm">请添加板材开始使用</p>
                </div>
            `;
            return;
        }
        
        // 根据筛选条件过滤显示
        let filteredBoards = this.boards;
        if (this.selectedThickness.length > 0) {
            filteredBoards = this.boards.filter(board => 
                this.selectedThickness.includes(board.thickness.toString())
            );
        }
        
        if (filteredBoards.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-filter text-4xl mb-3"></i>
                    <p>没有符合当前筛选条件的板材</p>
                    <p class="text-sm">请更改厚度筛选条件</p>
                </div>
            `;
            return;
        }
        
        // 按照长度排序
        const sortedBoards = [...filteredBoards].sort((a, b) => {
            if (this.sortOrder === 'asc') {
                return a.length - b.length;
            } else {
                return b.length - a.length;
            }
        });
        
        // 生成板材列表HTML
        container.innerHTML = sortedBoards.map(board => {
            // 计算调整后的数量信息
            const adjustment = this.calculateAdjustedQuantity?.(board) || { 
                adjusted: board.quantity,
                original: board.quantity,
                added: 0,
                needsAdjustment: false
            };
            
            // 检查该板材是否已配模
            const isMatched = this.matchingResults.some(result => 
                result.combination?.some(item => item.id === board.id)
            );
            
            // 计算已使用数量和剩余数量
            let usedQuantity = 0;
            this.matchingResults.forEach(result => {
                if (result.layers && result.combination) {
                    if (result.isSelfCombination) {
                        const found = result.combination.find(item => item.id === board.id);
                        if (found) {
                            usedQuantity += result.layers * 2;
                        }
                    } else {
                        const found = result.combination.find(item => item.id === board.id);
                        if (found) {
                            usedQuantity += result.layers;
                        }
                    }
                }
            });
            usedQuantity = Math.min(usedQuantity, adjustment.adjusted);
            const remainingQuantity = adjustment.adjusted - usedQuantity;
            
            // 生成数量显示
            let quantityDisplay = `${adjustment.original}`;
            if (adjustment.needsAdjustment) {
                quantityDisplay += ` → ${adjustment.adjusted} <span class="adjusted-quantity">补充${adjustment.added}块</span>`;
            }
            
            return `
                <div class="board-item ${isMatched ? 'matched-board' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 shadow-sm" data-board-id="${board.id}">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-medium text-gray-900">${board.project || '未命名项目'}</h3>
                            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 text-sm">
                                <div class="bg-gray-100 px-2 py-1 rounded">长度: ${board.length}mm</div>
                                <div class="bg-gray-100 px-2 py-1 rounded">宽度: ${board.width}mm</div>
                                <div class="bg-gray-100 px-2 py-1 rounded">厚度: ${board.thickness}mm</div>
                                <div class="bg-gray-100 px-2 py-1 rounded">
                                    数量: ${quantityDisplay}
                                </div>
                                <div class="bg-gray-100 px-2 py-1 rounded ${remainingQuantity <= 0 ? 'text-red-600 font-medium' : ''}">
                                    剩余: ${remainingQuantity}
                                </div>
                            </div>
                            ${adjustment.needsAdjustment ? `
                            <div class="mt-2 text-xs text-amber-600">
                                <i class="fas fa-info-circle mr-1"></i>
                                基于${board.thickness}mm厚度，${Math.floor(1200/board.thickness)}块/模调整
                            </div>
                            ` : ''}
                        </div>
                        <div class="flex space-x-2">
                            <button class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 渲染配模结果
    renderMatchingResults() {
        const container = this.elements.matchingResults;
        if (!container) return;
        
        if (this.matchingResults.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-project-diagram text-4xl mb-3"></i>
                    <p>暂无配模结果</p>
                    <p class="text-sm">点击自动配模开始计算</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.matchingResults.map((result, index) => {
            // 计算组合总长度
            const totalLength = result.combination.reduce((sum, item) => sum + item.length, 0);
            const remainingLength = result.targetLength - totalLength;
            
            // 判断是否在最佳区间内
            const inOptimalRange = totalLength >= this.settings.minCombinationRange && 
                                  totalLength <= this.settings.maxCombinationRange;
            
            // 确定模板卡片样式类
            let templateClass = 'template-card';
            if (result.isTertiary) {
                templateClass += ' tertiary';
            } else if (result.isSecondary) {
                templateClass += ' secondary';
            }
            
            if (result.isSelfCombination) {
                templateClass += ' self-combination';
            }
            
            // 生成板材使用数量显示
            const usageDisplay = result.combination.map((board, idx) => 
                `${board.length}mm: ${result.usedQuantities[idx]}块`
            ).join('，');
            
            return `
            <div class="${templateClass} rounded-xl p-5 slide-up">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-bold text-lg text-gray-800">模板 #${index + 1} 
                            ${result.isSecondary ? '<span class="text-amber-600 text-sm">(二次组合)</span>' : ''}
                            ${result.isTertiary ? '<span class="text-red-600 text-sm">(第三次配模)</span>' : ''}
                            ${result.isSelfCombination ? '<span class="text-green-600 text-sm">(自我组合)</span>' : ''}
                            ${inOptimalRange ? '<span class="text-green-600 text-sm">(最佳区间)</span>' : ''}
                        </h3>
                        <p class="text-gray-600">厚度: ${result.thickness}mm, 层数: ${result.layers}, 模数: ${result.modulus}</p>
                        <p class="text-gray-600">板材使用: ${usageDisplay}</p>
                    </div>
                    <div class="dropdown">
                        <button class="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-content">
                            <button class="withdraw-result-btn" data-index="${index}">
                                <i class="fas fa-undo mr-2"></i>撤回配模
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">目标长度: ${result.targetLength}mm (模板尺寸 ${this.settings.templateSize}mm - 切割损耗 ${this.settings.cutLoss}mm)，最佳区间: ${this.settings.minCombinationRange}-${this.settings.maxCombinationRange}mm</p>
                    <p class="text-sm ${result.utilization >= 0.7 ? 'text-green-600' : result.utilization >= 0.5 ? 'text-amber-600' : 'text-red-600'} mt-1">
                        <i class="fas fa-info-circle mr-1"></i>组合长度: ${totalLength}mm，利用率: ${(result.utilization * 100).toFixed(1)}%
                    </p>
                </div>
                
                <h4 class="font-medium text-gray-700 mb-3">
                    长度组合: ${result.combination.map(item => `${item.length}mm`).join(' + ')}  
                    <span class="text-orange-600">剩余=${remainingLength}mm</span>
                </h4>
                
                <div class="border rounded-lg overflow-hidden">
                    <div class="grid grid-cols-5 bg-gray-50 py-2 px-3 font-medium text-sm">
                        <div>层号</div>
                        <div>长度(mm)</div>
                        <div>宽度(mm)</div>
                        <div>厚度(mm)</div>
                        <div>项目名称</div>
                    </div>
                    
                    ${Array.from({length: result.layers}).map((_, i) => `
                        <div class="grid grid-cols-5 py-2 px-3 border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                            <div class="text-sm">第${i + 1}层</div>
                            <div class="text-sm">${result.combination.map(item => `${item.length}`).join(' + ')}</div>
                            <div class="text-sm">${result.combination[0].width}</div>
                            <div class="text-sm">${result.combination[0].thickness}</div>
                            <div class="text-sm">${result.combination[0].project}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            `;
        }).join('');
        
        // 绑定撤回配模结果事件
        document.querySelectorAll('.withdraw-result-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.onWithdrawResult?.(index);
            });
        });
    }
    
    // 厚度筛选相关方法
    toggleThicknessSelection(button) {
        const thickness = button.getAttribute('data-thickness');
        const index = this.selectedThickness.indexOf(thickness);
        
        if (index === -1) {
            this.selectedThickness.push(thickness);
            button.classList.add('active');
        } else {
            this.selectedThickness.splice(index, 1);
            button.classList.remove('active');
        }
        
        this.updateSelectedThicknessDisplay();
        this.renderBoardsList();
    }
    
    selectAllThickness() {
        const allThickness = Array.from(document.querySelectorAll('.thickness-btn')).map(btn => 
            btn.getAttribute('data-thickness')
        );
        
        this.selectedThickness = [...new Set(allThickness)];
        this.renderThicknessButtons();
        this.updateSelectedThicknessDisplay();
        this.renderBoardsList();
    }
    
    invertSelectThickness() {
        const allThickness = Array.from(document.querySelectorAll('.thickness-btn')).map(btn => 
            btn.getAttribute('data-thickness')
        );
        
        this.selectedThickness = allThickness.filter(thickness => 
            !this.selectedThickness.includes(thickness)
        );
        
        this.renderThicknessButtons();
        this.updateSelectedThicknessDisplay();
        this.renderBoardsList();
    }
    
    updateSelectedThicknessDisplay() {
        if (!this.elements.selectedThicknessEl) return;
        
        if (this.selectedThickness.length === 0) {
            this.elements.selectedThicknessEl.textContent = '未选择厚度';
            return;
        }
        
        this.elements.selectedThicknessEl.textContent = 
            this.selectedThickness.map(t => `${t}mm`).join('、');
    }
    
    renderThicknessButtons() {
        document.querySelectorAll('.thickness-btn').forEach(btn => {
            const thickness = btn.getAttribute('data-thickness');
            if (this.selectedThickness.includes(thickness)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // 排序相关方法
    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.updateSortIndicator();
        this.renderBoardsList();
    }
    
    updateSortIndicator() {
        const indicator = this.elements.sortIndicator;
        if (!indicator) return;
        
        const upIcon = indicator.querySelector('.fa-caret-up');
        const downIcon = indicator.querySelector('.fa-caret-down');
        
        indicator.classList.add('active');
        
        if (this.sortOrder === 'asc') {
            upIcon.style.opacity = '1';
            downIcon.style.opacity = '0.3';
        } else {
            upIcon.style.opacity = '0.3';
            downIcon.style.opacity = '1';
        }
    }
    
    // 历史查询面板控制
    toggleHistoryPanel() {
        this.elements.historyPanel.classList.toggle('open');
        if (this.elements.historyPanel.classList.contains('open')) {
            this.searchHistory();
        }
    }
    
    closeHistoryPanel() {
        this.elements.historyPanel.classList.remove('open');
    }
    
    // 历史数据查询
    searchHistory() {
        const startDate = new Date(this.elements.startDate.value);
        const endDate = new Date(this.elements.endDate.value);
        endDate.setHours(23, 59, 59, 999);
        
        const projectFilter = this.elements.projectFilter.value.toLowerCase();
        
        const filteredHistory = this.historyData.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            
            // 日期过滤
            if (entryDate < startDate || entryDate > endDate) {
                return false;
            }
            
            // 项目名称过滤
            if (projectFilter) {
                const hasMatchingProject = entry.boards.some(board => 
                    board.project.toLowerCase().includes(projectFilter)
                );
                if (!hasMatchingProject) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.renderHistoryResults(filteredHistory);
    }
    
    // 渲染历史查询结果
    renderHistoryResults(historyEntries) {
        const container = this.elements.historyResults;
        if (!container) return;
        
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
                 onclick="boardMatchingUI.onLoadHistory?.(${entry.id})">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${entry.date}</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                            <div>规格数: ${entry.summary?.totalBoards || 0}</div>
                            <div>已配模: ${entry.summary?.matchedBoards || 0}</div>
                            <div>模板数: ${entry.summary?.totalTemplates || 0}</div>
                            <div>已配数量: ${entry.summary?.totalMatchedQuantity || 0}</div>
                        </div>
                        <div class="mt-2 text-xs text-gray-500">
                            ${new Date(entry.timestamp).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button class="text-blue-600 hover:text-blue-800 text-sm" 
                                onclick="event.stopPropagation(); boardMatchingUI.onLoadHistory?.(${entry.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 text-sm" 
                                onclick="event.stopPropagation(); boardMatchingUI.onDeleteHistory?.(${entry.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // 获取设置值
    getSettings() {
        return {
            templateSize: parseInt(this.elements.templateSize.value) || 6000,
            cutLoss: parseInt(this.elements.cutLoss.value) || 0,
            minCombinationRange: parseInt(this.elements.minCombinationRange.value) || 4000,
            maxCombinationRange: parseInt(this.elements.maxCombinationRange.value) || 6000,
            autoAdjustQuantity: this.elements.autoAdjustQuantity?.checked || true
        };
    }
    
    // 获取粘贴区数据
    getPasteData() {
        return this.elements.pasteArea?.value || '';
    }
    
    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <i class="fas ${type === 'success' ? 'fa-check-circle text-green-500' : 
                                 type === 'error' ? 'fa-times-circle text-red-500' : 
                                 'fa-info-circle text-blue-500'}"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm">${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // 更新设置UI
    updateSettingsUI(settings) {
        if (!settings) return;
        
        if (this.elements.templateSize) this.elements.templateSize.value = settings.templateSize || 6000;
        if (this.elements.cutLoss) this.elements.cutLoss.value = settings.cutLoss || 0;
        if (this.elements.minCombinationRange) this.elements.minCombinationRange.value = settings.minCombinationRange || 4000;
        if (this.elements.maxCombinationRange) this.elements.maxCombinationRange.value = settings.maxCombinationRange || 6000;
        if (this.elements.autoAdjustQuantity) this.elements.autoAdjustQuantity.checked = settings.autoAdjustQuantity !== false;
        
        this.settings = { ...this.settings, ...settings };
    }
    
    // 设置数据
    setData(boards, matchingResults) {
        this.boards = boards || [];
        this.matchingResults = matchingResults || [];
        this.updateUI();
    }
    
    // 设置历史数据
    setHistoryData(historyData) {
        this.historyData = historyData || [];
    }
    
    // 禁用自动配模按钮
    disableAutoMatchButton() {
        const autoMatchBtn = this.elements.autoMatchBtn;
        if (!autoMatchBtn) return;
        
        autoMatchBtn.disabled = true;
        autoMatchBtn.classList.add('btn-disabled');
        autoMatchBtn.classList.remove('hover:bg-green-700');
        
        // 移除原有的事件监听器
        autoMatchBtn.removeEventListener('click', () => this.onAutoMatch?.());
        
        // 添加禁用状态处理
        autoMatchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showNotification('自动配模功能已被远程禁用', 'error');
        });
    }
    
    // 回调函数占位符（由主程序实现）
    onAutoAdjustChange = null;
    onSaveSettings = null;
    onAutoMatch = null;
    onBatchAdd = null;
    onDownloadTemplate = null;
    onEditBoard = null;
    onDeleteBoard = null;
    onClearAll = null;
    onRemoveInvalid = null;
    onWithdrawResult = null;
    onLoadHistory = null;
    onDeleteHistory = null;
    calculateAdjustedQuantity = null;
}

// 创建全局UI实例
let boardMatchingUI = null;

// 初始化函数
function initBoardMatchingUI() {
    boardMatchingUI = new BoardMatchingUI();
    return boardMatchingUI;
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BoardMatchingUI,
        initBoardMatchingUI
    };
}

// 浏览器环境自动初始化
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        boardMatchingUI = initBoardMatchingUI();
        window.boardMatchingUI = boardMatchingUI;
    });
}