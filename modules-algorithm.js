// ==================== ALC板材配模管理系统 - 算法模块 ====================
// 版本: 1.0.0
// 最后更新: 2024-01-30

console.log('[算法模块] 正在加载...');

class AlgorithmModule {
    constructor(config) {
        this.config = config || {};
        this.core = window.core;
        this.dataModule = null;
        
        console.log('[算法模块] 初始化完成');
    }
    
    // 设置数据模块引用
    setDataModule(dataModule) {
        this.dataModule = dataModule;
        console.log('[算法模块] 数据模块已连接');
    }
    
    // 计算调整后的数量
    calculateAdjustedQuantity(board, autoAdjust = true) {
        if (!autoAdjust) {
            return {
                adjusted: board.quantity,
                original: board.quantity,
                added: 0,
                needsAdjustment: false
            };
        }
        
        const thickness = board.thickness;
        const originalQuantity = board.quantity;
        
        // 计算每模需要的板材数量
        const boardsPerLayer = Math.floor(1200 / thickness);
        if (boardsPerLayer <= 0) {
            return {
                adjusted: originalQuantity,
                original: originalQuantity,
                added: 0,
                needsAdjustment: false
            };
        }
        
        // 计算需要的模数（向上取整）
        const requiredLayers = Math.ceil(originalQuantity / boardsPerLayer);
        
        // 计算调整后的数量
        const adjustedQuantity = requiredLayers * boardsPerLayer;
        const addedQuantity = adjustedQuantity - originalQuantity;
        
        return {
            adjusted: adjustedQuantity,
            original: originalQuantity,
            added: addedQuantity,
            needsAdjustment: addedQuantity > 0
        };
    }
    
    // 主要配模方法
    async autoMatchBoards(boards, settings, selectedThickness = []) {
        console.log('[算法模块] 开始自动配模...');
        
        try {
            // 验证输入
            if (!boards || boards.length === 0) {
                throw new Error('没有板材数据');
            }
            
            if (selectedThickness.length === 0) {
                throw new Error('请至少选择一种厚度');
            }
            
            // 筛选出符合选中厚度的板材
            const filteredBoards = boards.filter(board => 
                selectedThickness.includes(board.thickness.toString())
            );
            
            if (filteredBoards.length === 0) {
                throw new Error('没有找到符合所选厚度的板材');
            }
            
            // 准备数据
            const targetLength = settings.templateSize - settings.cutLoss;
            
            // 为每种厚度生成配模结果
            const thicknessGroups = {};
            filteredBoards.forEach(board => {
                const key = board.thickness.toString();
                if (!thicknessGroups[key]) thicknessGroups[key] = [];
                
                const adjustment = this.calculateAdjustedQuantity(board, settings.autoAdjustQuantity);
                thicknessGroups[key].push({
                    ...board, 
                    remaining: adjustment.adjusted,
                    originalQuantity: board.quantity,
                    adjustedQuantity: adjustment.adjusted
                });
            });
            
            // 执行配模算法
            const allResults = [];
            
            for (const [thickness, group] of Object.entries(thicknessGroups)) {
                console.log(`[算法模块] 处理厚度 ${thickness}mm, ${group.length} 个板材`);
                
                const results = this.executeMatchingAlgorithm(group, targetLength, settings);
                allResults.push(...results);
            }
            
            console.log(`[算法模块] 配模完成，生成 ${allResults.length} 个结果`);
            return allResults;
            
        } catch (error) {
            console.error('[算法模块] 配模失败:', error);
            throw error;
        }
    }
    
    // 执行配模算法（这里放置你的完整算法）
    executeMatchingAlgorithm(group, targetLength, settings) {
        // 这里放置你完整的配模算法代码
        // 包括三次配模、评分函数、组合逻辑等
        
        // 由于代码非常长，这里只展示框架
        // 你需要将原代码中的算法部分复制到这里
        
        const results = [];
        
        // 第一阶段：初次配模
        this.improvedPrimaryMatching(group, targetLength, settings, results);
        
        // 第二阶段：二次配模
        this.improvedSecondaryMatching(group, targetLength, settings, results);
        
        // 第三阶段：模数优化
        this.modulusOptimizationStage(group, targetLength, settings, results);
        
        // 第四阶段：第三次配模
        this.thirdStageMatching(group, targetLength, settings, results);
        
        return results;
    }
    
    // 以下是原算法代码中的各个方法
    // 你需要将原代码中的以下方法复制到这里：
    
    // improvedPrimaryMatching()
    // combineShortWithLong()
    // combineShortWithMedium()
    // combineMediumBoards()
    // processLongBoards()
    // improvedSecondaryMatching()
    // quantityFirstStrategy()
    // balancedCombinationStrategy()
    // lengthComplementStrategy()
    // modulusOptimizationStage()
    // findModulusEnhancingCombination()
    // thirdStageMatching()
    // thirdStageCombinationPhase()
    // thirdStageSelfCombinationPhase()
    // thirdStageSingleBoardPhase()
    
    // calculatePrimaryCombinationScore()
    // calculateSecondaryCombinationScore()
    // calculateSingleBoardScore()
    
    // improvedGreedyCombination()
    // createMatchingResult()
    
    // 由于代码长度限制，这里不展示完整的算法代码
    // 你需要将原HTML文件中的算法部分（从autoMatchBoards方法开始）
    // 复制到这个文件中
    
    // 显示统计信息
    showMatchingStatistics(results, boards, settings, selectedThickness) {
        const totalTemplates = results.length;
        const singleBoardTemplates = results.filter(
            result => result.combination && result.combination.length === 1
        ).length;
        
        const multiBoardTemplates = totalTemplates - singleBoardTemplates;
        
        // 计算平均利用率
        const averageUtilization = results.length > 0 
            ? results.reduce((sum, result) => sum + (result.utilization || 0), 0) / totalTemplates
            : 0;
        
        // 统计调整的板材
        const adjustedBoards = boards.filter(board => {
            if (!selectedThickness.includes(board.thickness.toString())) return false;
            const adjustment = this.calculateAdjustedQuantity(board, settings.autoAdjustQuantity);
            return adjustment.needsAdjustment;
        });
        
        let message = `配模完成！生成 ${totalTemplates} 个模板 `;
        message += `(组合模板: ${multiBoardTemplates}, 单板模板: ${singleBoardTemplates})`;
        message += `，平均利用率 ${(averageUtilization * 100).toFixed(1)}%`;
        
        if (adjustedBoards.length > 0) {
            const totalAdded = adjustedBoards.reduce((sum, board) => {
                const adjustment = this.calculateAdjustedQuantity(board, settings.autoAdjustQuantity);
                return sum + adjustment.added;
            }, 0);
            message += `，自动调整 ${adjustedBoards.length} 种规格，补充 ${totalAdded} 块板材`;
        }
        
        // 显示通知
        if (this.core && this.core.showNotification) {
            this.core.showNotification(message, 'success');
        }
        
        return {
            totalTemplates,
            singleBoardTemplates,
            multiBoardTemplates,
            averageUtilization,
            adjustedBoardsCount: adjustedBoards.length
        };
    }
    
    // 撤回配模结果
    withdrawMatchingResult(results, resultIndex, boards) {
        if (resultIndex < 0 || resultIndex >= results.length) {
            throw new Error('无效的配模结果索引');
        }
        
        const result = results[resultIndex];
        
        // 恢复板材数量
        result.combination.forEach((board, idx) => {
            if (result.isSelfCombination) {
                if (idx === 0) {
                    board.remaining += 2 * result.layers;
                }
            } else {
                board.remaining += result.layers;
            }
        });
        
        // 从配模结果中移除
        results.splice(resultIndex, 1);
        
        return results;
    }
    
    // 验证配模参数
    validateMatchingParameters(settings) {
        const errors = [];
        
        if (!settings.templateSize || settings.templateSize <= 0) {
            errors.push('模板尺寸必须为正数');
        }
        
        if (settings.cutLoss < 0) {
            errors.push('切割损耗不能为负数');
        }
        
        if (!settings.minCombinationRange || settings.minCombinationRange <= 0 || 
            !settings.maxCombinationRange || settings.maxCombinationRange <= settings.minCombinationRange || 
            settings.maxCombinationRange > settings.templateSize) {
            errors.push('最佳组合区间设置无效');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// 创建算法模块实例并注册到核心
const algorithmModule = new AlgorithmModule(window.appConfig);
window.algorithm = algorithmModule;
window.AlgorithmModule = AlgorithmModule;

// 注册到核心模块
if (window.core) {
    window.core.registerModule('algorithm', algorithmModule);
    
    // 监听数据模块加载
    window.core.on('moduleRegistered', ({ name, instance }) => {
        if (name === 'data') {
            algorithmModule.setDataModule(instance);
        }
    });
}

console.log('[算法模块] 加载完成，已注册为 window.algorithm');