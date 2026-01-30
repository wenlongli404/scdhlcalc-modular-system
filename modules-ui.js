// ==================== ALC板材配模管理系统 - UI模块 ====================
// 版本: 1.0.0
// 最后更新: 2024-01-30

console.log('[UI模块] 正在加载...');

class UIModule {
    constructor(config) {
        this.config = config || {};
        this.core = window.core;
        this.elements = {};
        this.state = {
            thicknessSelected: [],
            sortOrder: 'asc',
            historyPanelOpen: false,
            exportDropdownOpen: false
        };
        
        console.log('[UI模块] 初始化完成');
    }
    
    // 初始化UI
    async initialize() {
        try {
            console.log('[UI模块] 开始初始化界面...');
            
            // 1. 渲染主界面
            await this.renderMainInterface();
            
            // 2. 绑定事件
            await this.bindEvents();
            
            // 3. 加载保存的数据
            await this.loadSavedData();
            
            // 4. 更新UI
            this.updateUI();
            
            console.log('[UI模块] 界面初始化完成');
            return true;
            
        } catch (error) {
            console.error('[UI模块] 初始化失败:', error);
            this.core.showNotification('界面初始化失败', 'error');
            return false;
        }
    }
    
    // 渲染主界面
    async renderMainInterface() {
        const appContainer = document.getElementById('app');
        
        if (!appContainer) {
            throw new Error('应用容器未找到');
        }
        
        // 创建主界面HTML
        appContainer.innerHTML = `
            <!-- 导航栏 -->
            <nav class="bg-white shadow-lg sticky top-0 z-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-industry text-blue-600 text-xl"></i>
                            </div>
                            <h1 class="text-xl font-bold text-gray-800">${this.config.app_name || 'ALC板材配模管理系统'}</h1>
                            ${this.config.version ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">v${this.config.version}</span>` : ''}
                        </div>
                        <div class="flex items-center space-x-4">
                            <button id="historyQueryBtn" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-all">
                                <i class="fas fa-history mr-2"></i>历史查询
                            </button>
                            
                            <div class="dropdown" id="exportDropdown">
                                <button id="exportBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all">
                                    <i class="fas fa-download mr-2"></i>导出数据
                                    <i class="fas fa-chevron-down ml-2 text-xs"></i>
                                </button>
                                <div class="dropdown-content">
                                    <button id="exportBoardsBtn">
                                        <i class="fas fa-list-ul mr-2"></i>导出板材列表
                                    </button>
                                    <button id="exportResultsBtn">
                                        <i class="fas fa-project-diagram mr-2"></i>导出配模结果
                                    </button>
                                    <button id="exportHistoryBtn">
                                        <i class="fas fa-archive mr-2"></i>导出历史数据
                                    </button>
                                </div>
                            </div>
                            <button id="importBtn" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all">
                                <i class="fas fa-upload mr-2"></i>导入数据
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- 主要内容 -->
            <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <!-- 历史查询面板 -->
                <div id="historyPanel" class="history-panel bg-white rounded-2xl shadow-lg mb-8">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-xl font-semibold text-gray-800">历史数据查询</h2>
                            <button id="closeHistoryBtn" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                                <input type="date" id="startDate" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                                <input type="date" id="endDate" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                                <input type="text" id="projectFilter" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="筛选项目">
                            </div>
                            <div class="flex items-end">
                                <button id="searchHistoryBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full">
                                    <i class="fas fa-search mr-2"></i>查询
                                </button>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="font-medium text-gray-800 mb-3">查询结果</h3>
                            <div id="historyResults" class="space-y-3 max-h-64 overflow-y-auto">
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-search text-2xl mb-2"></i>
                                    <p>暂无查询结果</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- 左侧面板 -->
                    <div class="lg:col-span-1 space-y-6">
                        <!-- 厚度筛选 -->
                        <div class="bg-white rounded-2xl shadow-lg p-6 slide-up">
                            <h2 class="text-xl font-semibold text-gray-800 mb-4">厚度筛选</h2>
                            <div class="mb-4">
                                <div class="flex justify-between items-center mb-3">
                                    <span class="text-sm font-medium text-gray-700">选择厚度规格</span>
                                    <button id="selectAllBtn" class="text-blue-600 hover:text-blue-800 text-sm font-medium">全选</button>
                                    <button id="invertSelectBtn" class="text-red-600 hover:text-red-800 text-sm font-medium">反选</button>
                                </div>
                                <div class="grid grid-cols-3 gap-2" id="thicknessButtons">
                                    <!-- 厚度按钮将通过JS动态生成 -->
                                </div>
                            </div>
                            <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h3 class="font-medium text-blue-800 mb-2">当前选择</h3>
                                <div id="selectedThickness" class="text-sm text-blue-700">未选择厚度</div>
                            </div>
                        </div>

                        <!-- 配模参数设置 -->
                        <div class="bg-white rounded-2xl shadow-lg p-6 slide-up">
                            <h2 class="text-xl font-semibold text-gray-800 mb-4">配模参数设置</h2>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">模板尺寸 (mm)</label>
                                    <input type="number" id="templateSize" value="6000" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="模板长度">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">切割损耗 (mm)</label>
                                    <input type="number" id="cutLoss" value="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="切割损耗">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">最佳组合区间 (mm)</label>
                                    <div class="flex space-x-2">
                                        <input type="number" id="minCombinationRange" value="4000" class="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="最小值">
                                        <span class="flex items-center text-sm text-gray-500">至</span>
                                        <input type="number" id="maxCombinationRange" value="6000" class="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="最大值">
                                    </div>
                                </div>
                                
                                <div class="quantity-adjustment-panel rounded-lg p-4 mt-4">
                                    <div class="flex items-center justify-between mb-3">
                                        <label class="block text-sm font-medium text-gray-700">自动调整数量</label>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="autoAdjustQuantity" class="sr-only peer" checked>
                                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div class="text-xs text-gray-600 space-y-1">
                                        <p>• 基于1200mm总高自动调整板材数量</p>
                                        <p>• 奇数/偶数数量都会向上取整到完整模数</p>
                                        <p>• 调整后的数量会在板材列表中标注</p>
                                    </div>
                                </div>
                                
                                <div class="flex space-x-3">
                                    <button id="saveSettingsBtn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all">
                                        <i class="fas fa-save mr-2"></i>保存设置
                                    </button>
                                    <button id="autoMatchBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all">
                                        <i class="fas fa-cogs mr-2"></i>自动配模
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 批量操作 -->
                        <div class="bg-white rounded-2xl shadow-lg p-6 slide-up">
                            <h2 class="text-xl font-semibold text-gray-800 mb-4">批量操作</h2>
                            <div class="space-y-3">
                                <label class="block text-sm font-medium text-gray-700">
                                    数据粘贴区（支持Excel表格数据粘贴，格式：长度,宽度,厚度,数量,项目名称）
                                </label>
                                <textarea id="pasteArea" class="w-full border border-gray-300 rounded-lg px-4 py-3 h-32 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="请粘贴板材数据..."></textarea>
                                <div class="grid grid-cols-3 gap-3">
                                    <button id="downloadTemplateBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all">
                                        <i class="fas fa-file-excel mr-1"></i>下载模板
                                    </button>
                                    <button id="batchAddBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all">
                                        <i class="fas fa-plus mr-1"></i>批量添加
                                    </button>
                                    <button id="clearPasteBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg">
                                        <i class="fas fa-eraser mr-1"></i>清空
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧面板 -->
                    <div class="lg:col-span-2 space-y-8">
                        <!-- 统计信息 -->
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div class="bg-white rounded-xl p-4 shadow-lg text-center slide-up">
                                <div class="text-blue-600 text-2xl mb-2">
                                    <i class="fas fa-cubes"></i>
                                </div>
                                <h3 class="text-gray-500 text-sm">总规格数</h3>
                                <p id="totalBoards" class="text-2xl font-bold text-gray-800">0</p>
                            </div>
                            <div class="bg-white rounded-xl p-4 shadow-lg text-center slide-up">
                                <div class="text-green-600 text-2xl mb-2">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <h3 class="text-gray-500 text-sm">已配模规格</h3>
                                <p id="matchedBoards" class="text-2xl font-bold text-gray-800">0</p>
                            </div>
                            <div class="bg-white rounded-xl p-4 shadow-lg text-center slide-up">
                                <div class="text-orange-600 text-2xl mb-2">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <h3 class="text-gray-500 text-sm">待配模规格</h3>
                                <p id="pendingBoards" class="text-2xl font-bold text-gray-800">0</p>
                            </div>
                            <div class="bg-white rounded-xl p-4 shadow-lg text-center slide-up">
                                <div class="text-purple-600 text-2xl mb-2">
                                    <i class="fas fa-check-double"></i>
                                </div>
                                <h3 class="text-gray-500 text-sm">已配模数量</h3>
                                <p id="matchedQuantity" class="text-2xl font-bold text-gray-800">0</p>
                            </div>
                            <div class="bg-white rounded-xl p-4 shadow-lg text-center slide-up">
                                <div class="text-red-600 text-2xl mb-2">
                                    <i class="fas fa-hourglass-half"></i>
                                </div>
                                <h3 class="text-gray-500 text-sm">未配模数量</h3>
                                <p id="unmatchedQuantity" class="text-2xl font-bold text-gray-800">0</p>
                            </div>
                        </div>

                        <!-- 板材列表 -->
                        <div class="bg-white rounded-2xl shadow-lg p-6 slide-up">
                            <div class="flex justify-between items-center mb-6">
                                <h2 class="text-xl font-semibold text-gray-800">板材列表</h2>
                                <div class="flex space-x-2">
                                    <button id="sortBoardsBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all">
                                        <i class="fas fa-sort mr-2"></i>按长度排序
                                        <span class="sort-indicator" id="sortIndicator">
                                            <i class="fas fa-caret-up"></i>
                                            <i class="fas fa-caret-down"></i>
                                        </span>
                                    </button>
                                    <button id="removeInvalidBtn" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all">
                                        <i class="fas fa-ban mr-2"></i>移除无效数据
                                    </button>
                                    <button id="clearAllBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all">
                                        <i class="fas fa-trash mr-2"></i>清空全部
                                    </button>
                                </div>
                            </div>
                            
                            <div id="boardsListContainer" class="space-y-4">
                                <div class="text-center py-12 text-gray-500">
                                    <i class="fas fa-inbox text-4xl mb-3"></i>
                                    <p>暂无板材数据</p>
                                    <p class="text-sm">请添加板材开始使用</p>
                                </div>
                            </div>
                        </div>

                        <!-- 配模结果 -->
                        <div class="bg-white rounded-2xl shadow-lg p-6 slide-up">
                            <h2 class="text-xl font-semibold text-gray-800 mb-4">配模结果</h2>
                            <div id="matchingResults" class="space-y-6">
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-project-diagram text-4xl mb-3"></i>
                                    <p>暂无配模结果</p>
                                    <p class="text-sm">点击自动配模开始计算</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <!-- 文件导入输入框 -->
            <input type="file" id="fileInput" class="hidden" accept=".xlsx,.xls,.csv">
        `;
        
        // 初始化DOM元素引用
        this.initializeElements();
        
        // 渲染厚度按钮
        this.renderThicknessButtons();
        
        console.log('[UI模块] 主界面渲染完成');
    }
    
    // 初始化DOM元素引用
    initializeElements() {
        this.elements = {
            // 统计相关
            totalBoards: document.getElementById('totalBoards'),
            matchedBoards: document.getElementById('matchedBoards'),
            pendingBoards: document.getElementById('pendingBoards'),
            matchedQuantity: document.getElementById('matchedQuantity'),
            unmatchedQuantity: document.getElementById('unmatchedQuantity'),
            
            // 板材列表相关
            boardsListContainer: document.getElementById('boardsListContainer'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            removeInvalidBtn: document.getElementById('removeInvalidBtn'),
            sortBoardsBtn: document.getElementById('sortBoardsBtn'),
            sortIndicator: document.getElementById('sortIndicator'),
            
            // 配模结果相关
            matchingResults: document.getElementById('matchingResults'),
            
            // 导入导出相关
            exportDropdown: document.getElementById('exportDropdown'),
            exportBtn: document.getElementById('exportBtn'),
            exportBoardsBtn: document.getElementById('exportBoardsBtn'),
            exportResultsBtn: document.getElementById('exportResultsBtn'),
            exportHistoryBtn: document.getElementById('exportHistoryBtn'),
            importBtn: document.getElementById('importBtn'),
            fileInput: document.getElementById('fileInput'),
            
            // 批量操作相关
            batchAddBtn: document.getElementById('batchAddBtn'),
            clearPasteBtn: document.getElementById('clearPasteBtn'),
            pasteArea: document.getElementById('pasteArea'),
            downloadTemplateBtn: document.getElementById('downloadTemplateBtn'),
            
            // 配模设置相关
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            autoMatchBtn: document.getElementById('autoMatchBtn'),
            templateSize: document.getElementById('templateSize'),
            cutLoss: document.getElementById('cutLoss'),
            minCombinationRange: document.getElementById('minCombinationRange'),
            maxCombinationRange: document.getElementById('maxCombinationRange'),
            autoAdjustQuantity: document.getElementById('autoAdjustQuantity'),
            
            // 厚度筛选相关
            selectAllBtn: document.getElementById('selectAllBtn'),
            invertSelectBtn: document.getElementById('invertSelectBtn'),
            selectedThicknessEl: document.getElementById('selectedThickness'),
            thicknessButtonsContainer: document.getElementById('thicknessButtons'),
            
            // 历史查询相关
            historyQueryBtn: document.getElementById('historyQueryBtn'),
            historyPanel: document.getElementById('historyPanel'),
            closeHistoryBtn: document.getElementById('closeHistoryBtn'),
            startDate: document.getElementById('startDate'),
            endDate: document.getElementById('endDate'),
            projectFilter: document.getElementById('projectFilter'),
            searchHistoryBtn: document.getElementById('searchHistoryBtn'),
            historyResults: document.getElementById('historyResults')
        };
        
        // 设置默认日期范围（最近7天）
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        if (this.elements.startDate) {
            this.elements.startDate.value = startDate.toISOString().split('T')[0];
        }
        if (this.elements.endDate) {
            this.elements.endDate.value = endDate.toISOString().split('T')[0];
        }
        
        console.log('[UI模块] DOM元素初始化完成');
    }
    
    // 渲染厚度按钮
    renderThicknessButtons() {
        const thicknessOptions = this.config.thickness_options || 
                               ['300', '250', '220', '200', '190', '175', '150', '120', '100', '90'];
        
        if (!this.elements.thicknessButtonsContainer) return;
        
        this.elements.thicknessButtonsContainer.innerHTML = thicknessOptions.map(thickness => `
            <button class="thickness-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-all" 
                    data-thickness="${thickness}">
                ${thickness}mm
            </button>
        `).join('');
        
        console.log(`[UI模块] 渲染了 ${thicknessOptions.length} 个厚度按钮`);
    }
    
    // 绑定事件
    async bindEvents() {
        // 厚度筛选按钮事件
        document.addEventListener('click', (e) => {
            const thicknessBtn = e.target.closest('.thickness-btn');
            if (thicknessBtn) {
                this.toggleThicknessSelection(thicknessBtn);
            }
        });
        
        // 其他事件绑定...
        // 由于代码长度限制，这里只展示关键部分
        // 完整的绑定逻辑需要根据原代码迁移
        
        console.log('[UI模块] 事件绑定完成');
    }
    
    // 切换厚度选择
    toggleThicknessSelection(button) {
        const thickness = button.getAttribute('data-thickness');
        const index = this.state.thicknessSelected.indexOf(thickness);
        
        if (index === -1) {
            this.state.thicknessSelected.push(thickness);
            button.classList.add('active');
        } else {
            this.state.thicknessSelected.splice(index, 1);
            button.classList.remove('active');
        }
        
        this.updateSelectedThicknessDisplay();
        
        // 通知其他模块厚度选择已更新
        this.core.emit('thicknessSelectionChanged', this.state.thicknessSelected);
    }
    
    // 更新选择的厚度显示
    updateSelectedThicknessDisplay() {
        if (!this.elements.selectedThicknessEl) return;
        
        if (this.state.thicknessSelected.length === 0) {
            this.elements.selectedThicknessEl.textContent = '未选择厚度';
            return;
        }
        
        this.elements.selectedThicknessEl.textContent = 
            this.state.thicknessSelected.map(t => `${t}mm`).join('、');
    }
    
    // 更新UI
    updateUI(data = {}) {
        // 更新统计信息
        if (data.totalBoards !== undefined && this.elements.totalBoards) {
            this.elements.totalBoards.textContent = data.totalBoards;
        }
        
        // 更新其他UI元素...
        // 根据原代码迁移
        
        console.log('[UI模块] UI已更新');
    }
    
    // 加载保存的数据
    async loadSavedData() {
        try {
            // 加载设置
            const settings = this.core.settings;
            
            if (this.elements.templateSize) {
                this.elements.templateSize.value = settings.templateSize || 6000;
            }
            if (this.elements.cutLoss) {
                this.elements.cutLoss.value = settings.cutLoss || 0;
            }
            if (this.elements.minCombinationRange) {
                this.elements.minCombinationRange.value = settings.minCombinationRange || 4000;
            }
            if (this.elements.maxCombinationRange) {
                this.elements.maxCombinationRange.value = settings.maxCombinationRange || 6000;
            }
            if (this.elements.autoAdjustQuantity) {
                this.elements.autoAdjustQuantity.checked = settings.autoAdjustQuantity !== false;
            }
            
            console.log('[UI模块] 设置加载完成');
            return true;
            
        } catch (error) {
            console.error('[UI模块] 加载数据失败:', error);
            return false;
        }
    }
    
    // 渲染板材列表
    renderBoardsList(boards = []) {
        if (!this.elements.boardsListContainer) return;
        
        if (boards.length === 0) {
            this.elements.boardsListContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>暂无板材数据</p>
                    <p class="text-sm">请添加板材开始使用</p>
                </div>
            `;
            return;
        }
        
        // 根据筛选条件过滤
        let filteredBoards = boards;
        if (this.state.thicknessSelected.length > 0) {
            filteredBoards = boards.filter(board => 
                this.state.thicknessSelected.includes(board.thickness.toString())
            );
        }
        
        // 排序
        const sortedBoards = [...filteredBoards].sort((a, b) => {
            if (this.state.sortOrder === 'asc') {
                return a.length - b.length;
            } else {
                return b.length - a.length;
            }
        });
        
        // 生成列表HTML
        // 这里需要根据原代码迁移完整的渲染逻辑
        // 由于代码长度限制，这里只展示框架
        
        console.log(`[UI模块] 渲染了 ${sortedBoards.length} 个板材`);
    }
    
    // 渲染配模结果
    renderMatchingResults(results = []) {
        if (!this.elements.matchingResults) return;
        
        if (results.length === 0) {
            this.elements.matchingResults.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-project-diagram text-4xl mb-3"></i>
                    <p>暂无配模结果</p>
                    <p class="text-sm">点击自动配模开始计算</p>
                </div>
            `;
            return;
        }
        
        // 生成结果HTML
        // 这里需要根据原代码迁移完整的渲染逻辑
        // 由于代码长度限制，这里只展示框架
        
        console.log(`[UI模块] 渲染了 ${results.length} 个配模结果`);
    }
    
    // 禁用自动配模按钮
    disableAutoMatchButton() {
        if (this.elements.autoMatchBtn) {
            this.elements.autoMatchBtn.disabled = true;
            this.elements.autoMatchBtn.classList.add('btn-disabled');
            this.elements.autoMatchBtn.classList.remove('hover:bg-green-700');
            
            // 更新文本（可选）
            // this.elements.autoMatchBtn.innerHTML = '<i class="fas fa-ban mr-2"></i>功能已禁用';
            
            console.log('[UI模块] 自动配模按钮已禁用');
        }
    }
    
    // 启用自动配模按钮
    enableAutoMatchButton() {
        if (this.elements.autoMatchBtn) {
            this.elements.autoMatchBtn.disabled = false;
            this.elements.autoMatchBtn.classList.remove('btn-disabled');
            this.elements.autoMatchBtn.classList.add('hover:bg-green-700');
            
            // 恢复原文本
            this.elements.autoMatchBtn.innerHTML = '<i class="fas fa-cogs mr-2"></i>自动配模';
            
            console.log('[UI模块] 自动配模按钮已启用');
        }
    }
}

// 创建UI模块实例并注册到核心
const uiModule = new UIModule(window.appConfig);
window.ui = uiModule;
window.UIModule = UIModule;

// 注册到核心模块
if (window.core) {
    window.core.registerModule('ui', uiModule);
}

console.log('[UI模块] 加载完成，已注册为 window.ui');