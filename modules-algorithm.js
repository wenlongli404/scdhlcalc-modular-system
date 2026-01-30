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
    
    // ==================== 原代码中的算法部分开始 ====================
    
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
    
    // ==================== 改进的配模算法 ====================

    // 自动配模方法 - 改进版本
    async autoMatchBoards(boards, settings, selectedThickness = []) {
        console.log('[算法模块] 开始自动配模...');
        
        if (selectedThickness.length === 0) {
            throw new Error('请至少选择一种厚度进行配模');
        }

        // 筛选出符合选中厚度的板材
        const filteredBoards = boards.filter(board => 
            selectedThickness.includes(board.thickness.toString())
        );

        if (filteredBoards.length === 0) {
            throw new Error('没有找到符合所选厚度的板材');
        }

        // 执行改进的配模算法
        const matchingResults = [];
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

        // 为每个厚度组生成配模结果
        Object.values(thicknessGroups).forEach(group => {
            // 1. 改进的初次配模 - 优先组合，减少单个板材成模
            this.improvedPrimaryMatching(group, targetLength, settings, matchingResults);
            
            // 2. 改进的二次配模 - 注重数量匹配度，降低门槛
            this.improvedSecondaryMatching(group, targetLength, settings, matchingResults);
            
            // 3. 新增：模数优化阶段
            this.modulusOptimizationStage(group, targetLength, settings, matchingResults);
            
            // 4. 新增：第三次配模 - 强制配模所有剩余板材
            this.thirdStageMatching(group, targetLength, settings, matchingResults);
        });

        // 显示统计信息
        const stats = this.showMatchingStatistics(matchingResults, boards, settings, selectedThickness);
        
        return {
            results: matchingResults,
            statistics: stats
        };
    }

    // 改进的初次配模 - 注重长度最大化
    improvedPrimaryMatching(group, targetLength, settings, results) {
        // 按长度利用率优先排序
        const sortedBoards = [...group].sort((a, b) => {
            // 优先处理长度利用率高的板材
            const aUtilization = a.length / targetLength;
            const bUtilization = b.length / targetLength;
            if (Math.abs(bUtilization - aUtilization) > 0.1) {
                return bUtilization - aUtilization;
            }
            // 其次处理数量多的板材
            return b.remaining - a.remaining;
        });

        const usedIds = new Set();
        
        // 定义短板材和长板材的阈值
        const shortBoardThreshold = targetLength * 0.5; // 50%以下为短板
        const optimalMinLength = targetLength * 0.6; // 60%以上为较优单板

        // 分离板材类型
        const shortBoards = sortedBoards.filter(b => 
            b.length < shortBoardThreshold && b.remaining > 0 && !usedIds.has(b.id)
        );
        const mediumBoards = sortedBoards.filter(b => 
            b.length >= shortBoardThreshold && b.length < optimalMinLength && b.remaining > 0 && !usedIds.has(b.id)
        );
        const longBoards = sortedBoards.filter(b => 
            b.length >= optimalMinLength && b.remaining > 0 && !usedIds.has(b.id)
        );

        // 阶段1：优先组合短板材与长板材
        this.combineShortWithLong(shortBoards, longBoards, targetLength, settings, usedIds, results);

        // 阶段2：组合短板材与中长板材
        this.combineShortWithMedium(shortBoards, mediumBoards, targetLength, settings, usedIds, results);

        // 阶段3：组合中长板材
        this.combineMediumBoards(mediumBoards, targetLength, settings, usedIds, results);

        // 阶段4：处理剩余的长板材 - 只有在长度很优时才单独成模
        this.processLongBoards(longBoards, targetLength, settings, usedIds, optimalMinLength, results);
    }

    // 组合短板与长板
    combineShortWithLong(shortBoards, longBoards, targetLength, settings, usedIds, results) {
        for (let i = 0; i < shortBoards.length; i++) {
            const shortBoard = shortBoards[i];
            if (usedIds.has(shortBoard.id) || shortBoard.remaining <= 0) continue;

            let bestLongBoard = null;
            let bestScore = -Infinity;

            for (let j = 0; j < longBoards.length; j++) {
                const longBoard = longBoards[j];
                if (usedIds.has(longBoard.id) || longBoard.remaining <= 0) continue;

                const totalLength = shortBoard.length + longBoard.length;
                if (totalLength > targetLength) continue;

                // 使用初次配模的评分函数（注重长度利用率）
                const score = this.calculatePrimaryCombinationScore(
                    [shortBoard, longBoard], 
                    targetLength,
                    totalLength,
                    settings
                );

                if (score > bestScore) {
                    bestScore = score;
                    bestLongBoard = longBoard;
                }
            }

            if (bestLongBoard) {
                const combination = [shortBoard, bestLongBoard];
                this.createMatchingResult(combination, targetLength, settings, usedIds, results, true);
            }
        }
    }

    // 组合短板与中长板 - 取消三板组合
    combineShortWithMedium(shortBoards, mediumBoards, targetLength, settings, usedIds, results) {
        for (let i = 0; i < shortBoards.length; i++) {
            const shortBoard = shortBoards[i];
            if (usedIds.has(shortBoard.id) || shortBoard.remaining <= 0) continue;

            let bestCombination = null;
            let bestScore = -Infinity;

            // 只考虑双板组合
            for (let j = 0; j < mediumBoards.length; j++) {
                const mediumBoard = mediumBoards[j];
                if (usedIds.has(mediumBoard.id) || mediumBoard.remaining <= 0) continue;

                const totalLength = shortBoard.length + mediumBoard.length;
                if (totalLength > targetLength) continue;

                const score = this.calculatePrimaryCombinationScore(
                    [shortBoard, mediumBoard], 
                    targetLength,
                    totalLength,
                    settings
                );

                if (score > bestScore) {
                    bestScore = score;
                    bestCombination = [shortBoard, mediumBoard];
                }
            }

            if (bestCombination && bestScore >= 40) {
                this.createMatchingResult(bestCombination, targetLength, settings, usedIds, results, true);
            }
        }
    }

    // 组合中长板材
    combineMediumBoards(mediumBoards, targetLength, settings, usedIds, results) {
        const remainingMedium = mediumBoards.filter(b => 
            !usedIds.has(b.id) && b.remaining > 0
        );

        // 使用改进的贪心算法进行组合
        this.improvedGreedyCombination(remainingMedium, targetLength, settings, usedIds, results, 'primary');
    }

    // 处理长板材 - 只有在长度很优时才单独成模
    processLongBoards(longBoards, targetLength, settings, usedIds, optimalMinLength, results) {
        const remainingLong = longBoards.filter(b => 
            !usedIds.has(b.id) && b.remaining > 0
        );

        // 对长板材进行排序：长度利用率高的优先
        remainingLong.sort((a, b) => {
            const aUtil = a.length / targetLength;
            const bUtil = b.length / targetLength;
            return bUtil - aUtil;
        });

        for (const longBoard of remainingLong) {
            if (usedIds.has(longBoard.id) || longBoard.remaining <= 0) continue;

            const utilization = longBoard.length / targetLength;
            
            // 只有长度利用率很高（比如85%以上）或者已经在最佳区间内才考虑单独成模
            if (utilization >= 0.85 || 
                (longBoard.length >= settings.minCombinationRange && 
                 longBoard.length <= settings.maxCombinationRange)) {
                
                // 计算单独成模的评分
                const score = this.calculateSingleBoardScore(longBoard, targetLength, 'primary', settings);
                
                // 设置较高的阈值，避免过多单独成模
                if (score >= 70) {
                    this.createMatchingResult([longBoard], targetLength, settings, usedIds, results, true);
                }
            }
        }
    }

    // 改进的二次配模 - 注重数量匹配度，降低门槛
    improvedSecondaryMatching(group, targetLength, settings, results) {
        let remainingBoards = group.filter(b => b.remaining > 0);
        
        if (remainingBoards.length < 2) return;

        // 使用多种策略进行二次配模，降低评分阈值
        const strategies = [
            () => this.quantityFirstStrategy(remainingBoards, targetLength, settings),
            () => this.balancedCombinationStrategy(remainingBoards, targetLength, settings),
            () => this.lengthComplementStrategy(remainingBoards, targetLength, settings)
        ];

        let strategyIndex = 0;
        let improvements = 0;
        const maxImprovements = 10; // 防止无限循环

        while (remainingBoards.length >= 2 && strategyIndex < strategies.length && improvements < maxImprovements) {
            const strategy = strategies[strategyIndex];
            const result = strategy();
            
            if (result && result.combination) {
                // 降低创建配模结果的门槛
                const created = this.createMatchingResult(result.combination, targetLength, settings, new Set(), results, false);
                if (created) {
                    improvements++;
                    remainingBoards = group.filter(b => b.remaining > 0);
                    strategyIndex = 0; // 重置策略索引，重新尝试
                } else {
                    strategyIndex++;
                }
            } else {
                strategyIndex++;
            }
        }
    }

    // 数量优先策略 - 寻找数量最匹配的组合
    quantityFirstStrategy(boards, targetLength, settings) {
        let bestCombination = null;
        let bestQuantityMatch = Infinity;

        for (let i = 0; i < boards.length; i++) {
            const board1 = boards[i];
            if (board1.remaining <= 0) continue;

            for (let j = i + 1; j < boards.length; j++) {
                const board2 = boards[j];
                if (board2.remaining <= 0) continue;

                const totalLength = board1.length + board2.length;
                if (totalLength > targetLength) continue;

                // 计算数量匹配度（差异越小越好）
                const quantityDiff = Math.abs(board1.remaining - board2.remaining);
                
                if (quantityDiff < bestQuantityMatch) {
                    const score = this.calculateSecondaryCombinationScore(
                        [board1, board2], 
                        targetLength,
                        totalLength,
                        quantityDiff,
                        settings
                    );
                    
                    // 降低分数阈值
                    if (score >= 40) {
                        bestQuantityMatch = quantityDiff;
                        bestCombination = [board1, board2];
                    }
                }
            }
        }

        return bestCombination ? { combination: bestCombination } : null;
    }

    // 平衡组合策略 - 取消三板组合
    balancedCombinationStrategy(boards, targetLength, settings) {
        let bestCombination = null;
        let bestScore = -Infinity;

        // 只考虑双板组合
        for (let i = 0; i < boards.length; i++) {
            const board1 = boards[i];
            if (board1.remaining <= 0) continue;

            for (let j = i + 1; j < boards.length; j++) {
                const board2 = boards[j];
                if (board2.remaining <= 0) continue;

                const totalLength = board1.length + board2.length;
                if (totalLength > targetLength) continue;

                const score = this.calculateSecondaryCombinationScore(
                    [board1, board2], 
                    targetLength,
                    totalLength,
                    Math.abs(board1.remaining - board2.remaining),
                    settings
                );

                if (score > bestScore) {
                    bestScore = score;
                    bestCombination = [board1, board2];
                }
            }
        }

        return bestCombination ? { combination: bestCombination } : null;
    }

    // 长度互补策略
    lengthComplementStrategy(boards, targetLength, settings) {
        let bestCombination = null;
        let bestLengthUtilization = 0;

        // 寻找长度互补的最佳组合
        for (let i = 0; i < boards.length; i++) {
            const board1 = boards[i];
            if (board1.remaining <= 0) continue;

            for (let j = 0; j < boards.length; j++) {
                if (i === j) continue;
                
                const board2 = boards[j];
                if (board2.remaining <= 0) continue;

                const totalLength = board1.length + board2.length;
                if (totalLength > targetLength) continue;

                const utilization = totalLength / targetLength;
                
                // 寻找利用率高的组合
                if (utilization > bestLengthUtilization && utilization >= 0.7) {
                    const score = this.calculateSecondaryCombinationScore(
                        [board1, board2], 
                        targetLength,
                        totalLength,
                        Math.abs(board1.remaining - board2.remaining),
                        settings
                    );
                    
                    if (score >= 35) {
                        bestLengthUtilization = utilization;
                        bestCombination = [board1, board2];
                    }
                }
            }
        }

        return bestCombination ? { combination: bestCombination } : null;
    }

    // 新增：模数优化阶段
    modulusOptimizationStage(group, targetLength, settings, results) {
        const remainingBoards = group.filter(b => b.remaining > 0);
        if (remainingBoards.length === 0) return;

        // 按模数潜力排序（厚度小、数量多的优先）
        const sortedByModulusPotential = [...remainingBoards].sort((a, b) => {
            const aModulusPotential = (a.remaining * a.thickness) / 1200;
            const bModulusPotential = (b.remaining * b.thickness) / 1200;
            return bModulusPotential - aModulusPotential;
        });

        // 尝试为模数潜力大的板材寻找组合伙伴
        for (const board of sortedByModulusPotential) {
            if (board.remaining <= 0) continue;

            // 寻找能提高模数的组合
            const modulusEnhancingCombination = this.findModulusEnhancingCombination(
                board, remainingBoards, targetLength, settings
            );
            
            if (modulusEnhancingCombination) {
                this.createMatchingResult(modulusEnhancingCombination, targetLength, settings, new Set(), results, false);
            }
        }
    }

    // 新增：寻找能提高模数的组合
    findModulusEnhancingCombination(mainBoard, candidates, targetLength, settings) {
        let bestCombination = null;
        let bestModulusImprovement = 0;

        for (const candidate of candidates) {
            if (candidate.id === mainBoard.id || candidate.remaining <= 0) continue;

            const totalLength = mainBoard.length + candidate.length;
            if (totalLength > targetLength) continue;

            // 计算模数改善程度
            const singleModulus = Math.ceil((mainBoard.remaining * mainBoard.thickness) / 1200);
            const combinedLayers = Math.min(mainBoard.remaining, candidate.remaining);
            const combinedModulus = Math.ceil((combinedLayers * mainBoard.thickness) / 1200);
            
            const modulusImprovement = singleModulus - combinedModulus;

            if (modulusImprovement > bestModulusImprovement) {
                bestModulusImprovement = modulusImprovement;
                bestCombination = [mainBoard, candidate];
            }
        }

        return bestModulusImprovement > 0 ? bestCombination : null;
    }

    // 新增：第三次配模 - 强制配模所有剩余板材
    thirdStageMatching(group, targetLength, settings, results) {
        const remainingBoards = group.filter(b => b.remaining > 0);
        
        if (remainingBoards.length === 0) return;

        // 按剩余数量从多到少排序，优先处理数量多的
        const sortedByRemaining = [...remainingBoards].sort((a, b) => b.remaining - a.remaining);

        // 第一阶段：尝试组合剩余板材
        this.thirdStageCombinationPhase(sortedByRemaining, targetLength, settings, results);
        
        // 第二阶段：尝试自我组合
        this.thirdStageSelfCombinationPhase(group, targetLength, settings, results);
        
        // 第三阶段：强制单独成模处理所有剩余板材
        this.thirdStageSingleBoardPhase(group, targetLength, settings, results);
    }

    // 第三次配模的组合阶段
    thirdStageCombinationPhase(remainingBoards, targetLength, settings, results) {
        // 尝试为每个剩余板材寻找组合伙伴
        for (let i = 0; i < remainingBoards.length; i++) {
            const board1 = remainingBoards[i];
            if (board1.remaining <= 0) continue;

            let bestCombination = null;
            let bestUtilization = 0;

            // 寻找最佳组合伙伴
            for (let j = 0; j < remainingBoards.length; j++) {
                if (i === j) continue;
                
                const board2 = remainingBoards[j];
                if (board2.remaining <= 0) continue;

                const totalLength = board1.length + board2.length;
                if (totalLength > targetLength) continue;

                const utilization = totalLength / targetLength;
                
                // 寻找利用率最高的组合
                if (utilization > bestUtilization) {
                    bestUtilization = utilization;
                    bestCombination = [board1, board2];
                }
            }

            // 如果找到组合且利用率超过50%，则创建配模结果
            if (bestCombination && bestUtilization >= 0.5) {
                this.createMatchingResult(bestCombination, targetLength, settings, new Set(), results, false);
            }
        }
    }

    // 新增：第三次配模的自我组合阶段 - 修复数量更新问题
    thirdStageSelfCombinationPhase(group, targetLength, settings, results) {
        const remainingBoards = group.filter(b => b.remaining >= 2); // 至少需要2块才能自我组合
        
        if (remainingBoards.length === 0) return;

        // 按剩余数量从多到少排序
        const sortedByRemaining = [...remainingBoards].sort((a, b) => b.remaining - a.remaining);

        for (const board of sortedByRemaining) {
            if (board.remaining < 2) continue;

            // 计算自我组合的总长度
            const totalLength = board.length * 2;
            if (totalLength > targetLength) continue;

            const utilization = totalLength / targetLength;
            
            // 自我组合的门槛：利用率必须达到60%以上
            if (utilization >= 0.6) {
                // 创建自我组合（同一规格的两块板材组合）
                const combination = [board, board];
                
                // 计算可配层数（每次消耗2块，所以最大层数是剩余数量除以2）
                const maxLayers = Math.floor(board.remaining / 2);
                if (maxLayers < 1) continue;
                
                // 创建配模结果
                const result = {
                    thickness: board.thickness,
                    layers: maxLayers,
                    modulus: Math.ceil((maxLayers * board.thickness) / 1200),
                    usedQuantities: [maxLayers, maxLayers],
                    targetLength,
                    combination: combination,
                    isComplete: true,
                    totalLength,
                    remainingLength: targetLength - totalLength,
                    utilization: utilization,
                    isTertiary: true,
                    isSelfCombination: true // 标记为自我组合
                };
                
                // 更新板材剩余数量（消耗2 * maxLayers块）- 直接在这里更新
                board.remaining -= 2 * maxLayers;

                results.push(result);
                
                // 显示通知
                if (this.core) {
                    this.core.showNotification(`创建自我组合：${board.length}mm × 2，利用率 ${(utilization * 100).toFixed(1)}%`, 'info');
                }
            }
        }
    }

    // 第三次配模的单板阶段
    thirdStageSingleBoardPhase(group, targetLength, settings, results) {
        const remainingBoards = group.filter(b => b.remaining > 0);
        
        if (remainingBoards.length === 0) return;

        // 按剩余数量从多到少排序
        const sortedByRemaining = [...remainingBoards].sort((a, b) => b.remaining - a.remaining);

        // 强制为所有剩余板材单独成模
        for (const board of sortedByRemaining) {
            if (board.remaining > 0) {
                // 创建第三次配模的特殊标记
                const result = this.createMatchingResult([board], targetLength, settings, new Set(), results, false);
                if (result) {
                    result.isTertiary = true; // 标记为第三次配模结果
                }
            }
        }
    }

    // ==================== 改进的评分函数 ====================

    // 初次配模评分函数 - 注重长度最大化，提高数量权重
    calculatePrimaryCombinationScore(combination, targetLength, totalLength, settings) {
        let score = 0;
        
        // 1. 长度利用率（最高权重）
        const lengthUtilization = totalLength / targetLength;
        score += lengthUtilization * 160; // 从180降低到160
        
        // 2. 最佳区间奖励
        if (totalLength >= settings.minCombinationRange && 
            totalLength <= settings.maxCombinationRange) {
            score += 60;
        }
        
        // 3. 组合多样性奖励（避免单一板材）
        if (combination.length > 1) {
            score += 30;
        }
        
        // 4. 短长组合特别奖励
        const hasShort = combination.some(b => b.length < targetLength * 0.4);
        const hasLong = combination.some(b => b.length >= targetLength * 0.6);
        if (hasShort && hasLong) {
            score += 40;
        }
        
        // 5. 数量匹配度（提高权重）
        const quantities = combination.map(b => b.remaining);
        const maxQty = Math.max(...quantities);
        const minQty = Math.min(...quantities);
        const quantityMatch = (1 - (maxQty - minQty) / (maxQty || 1)) * 50; // 从20提高到50
        score += quantityMatch;
        
        // 6. 模数奖励 - 鼓励层数多的组合
        const estimatedLayers = Math.min(...quantities);
        score += Math.min(estimatedLayers * 8, 40); // 增加模数奖励
        
        return score;
    }

    // 改进的二次配模评分函数 - 降低门槛，提高数量权重
    calculateSecondaryCombinationScore(combination, targetLength, totalLength, quantityDiff, settings) {
        let score = 0;
        
        // 1. 长度利用率（降低权重，提高容错性）
        const lengthUtilization = totalLength / targetLength;
        score += lengthUtilization * 120; // 从140降低到120
        
        // 2. 数量匹配度（大幅提高权重）
        const quantities = combination.map(b => b.remaining);
        const maxQty = Math.max(...quantities);
        const quantityMatch = (1 - quantityDiff / (maxQty || 1)) * 120; // 从80提高到120
        
        // 3. 剩余数量奖励 - 鼓励消耗更多剩余板材
        const minRemaining = Math.min(...quantities);
        score += Math.min(minRemaining * 6, 50); // 新增：剩余数量奖励
        
        // 4. 最佳区间奖励（降低要求）
        if (totalLength >= settings.minCombinationRange * 0.8 && // 放宽到80%
            totalLength <= settings.maxCombinationRange) {
            score += 40; // 从30提高到40
        }
        
        // 5. 组合多样性奖励
        if (combination.length > 1) {
            score += 25; // 从20提高到25
        }
        
        // 6. 模数优化奖励 - 鼓励形成更多模数
        const estimatedLayers = Math.min(...quantities);
        const estimatedModulus = Math.ceil((estimatedLayers * combination[0].thickness) / 1200);
        score += Math.min(estimatedModulus * 15, 60); // 新增：模数奖励
        
        return score;
    }

    // 改进的单独成模评分函数 - 大幅提高门槛
    calculateSingleBoardScore(board, targetLength, stage = 'primary', settings) {
        let score = 0;
        
        const utilization = board.length / targetLength;
        
        if (stage === 'primary') {
            // 初次配模：对单板材要求极高
            score += utilization * 70; // 从90降低到70，因为单独成模要严控
            
            // 只有在最佳区间且利用率很高时才给高分
            if (board.length >= settings.minCombinationRange && 
                board.length <= settings.maxCombinationRange) {
                score += 30;
            } else if (utilization >= 0.90) { // 从0.85提高到0.90
                score += 20;
            }
            
            // 数量要求大幅提高
            if (board.remaining < 8) { // 新增：数量太少直接扣分
                score -= (8 - board.remaining) * 10;
            }
            
            // 模数要求 - 必须能形成足够模数
            const potentialModulus = Math.ceil((board.remaining * board.thickness) / 1200);
            if (potentialModulus < 2) { // 模数小于2的严重扣分
                score -= 40;
            }
            
            score += Math.min(15, board.remaining * 0.3); // 降低数量奖励
            
        } else {
            // 二次配模：基本不允许单独成模
            score += utilization * 50;
            if (board.remaining < 10) { // 数量要求更高
                score -= (10 - board.remaining) * 15;
            }
        }
        
        return score;
    }

    // 改进的贪心组合算法 - 只考虑单板和双板组合
    improvedGreedyCombination(boards, targetLength, settings, usedIds, results, stage) {
        const remainingBoards = boards.filter(b => !usedIds.has(b.id) && b.remaining > 0);
        
        while (remainingBoards.length > 0) {
            let bestCombination = null;
            let bestScore = -Infinity;
            
            // 尝试从剩余板材中找出最佳组合
            for (let i = 0; i < remainingBoards.length; i++) {
                const startBoard = remainingBoards[i];
                if (startBoard.remaining <= 0) continue;
                
                // 单板组合
                let currentCombination = [startBoard];
                let currentLength = startBoard.length;
                let currentScore = this.calculateSingleBoardScore(startBoard, targetLength, stage, settings);
                
                // 尝试添加一个板材（只考虑双板组合）
                for (let j = 0; j < remainingBoards.length; j++) {
                    if (i === j) continue;
                    
                    const nextBoard = remainingBoards[j];
                    if (nextBoard.remaining <= 0 || usedIds.has(nextBoard.id)) continue;
                    
                    const newLength = currentLength + nextBoard.length;
                    if (newLength > targetLength) continue;
                    
                    // 只考虑双板组合
                    const newCombination = [startBoard, nextBoard];
                    const newScore = stage === 'primary' 
                        ? this.calculatePrimaryCombinationScore(newCombination, targetLength, newLength, settings)
                        : this.calculateSecondaryCombinationScore(newCombination, targetLength, newLength, 0, settings);
                    
                    if (newScore > currentScore) {
                        currentScore = newScore;
                        currentCombination = newCombination;
                        currentLength = newLength;
                    }
                }
                
                if (currentScore > bestScore && currentCombination.length > 0) {
                    bestScore = currentScore;
                    bestCombination = currentCombination;
                }
            }
            
            if (bestCombination && bestCombination.length > 0 && bestScore >= 40) {
                this.createMatchingResult(bestCombination, targetLength, settings, usedIds, results, true);
                
                // 更新剩余板材列表
                bestCombination.forEach(board => {
                    const index = remainingBoards.findIndex(b => b.id === board.id);
                    if (index !== -1 && board.remaining <= 0) {
                        remainingBoards.splice(index, 1);
                    }
                });
            } else {
                break;
            }
        }
    }

    // 创建配模结果（通用方法）- 修复自我组合数量更新问题
    createMatchingResult(combination, targetLength, settings, usedIds, results, markUsed = true) {
        const totalLength = combination.reduce((sum, b) => sum + b.length, 0);
        
        // 计算可配层数（取最小剩余数量）
        const minQuantity = Math.min(...combination.map(b => b.remaining));
        
        // 如果层数太少（小于1），跳过此组合
        if (minQuantity < 1) {
            return null;
        }
        
        const layers = Math.max(1, minQuantity);
        
        // 计算模数
        const modulus = Math.ceil((layers * combination[0].thickness) / 1200);
        
        // 创建配模结果
        const result = {
            thickness: combination[0].thickness,
            layers,
            modulus,
            usedQuantities: combination.map(() => layers),
            targetLength,
            combination: [...combination],
            isComplete: true,
            totalLength,
            remainingLength: targetLength - totalLength,
            utilization: totalLength / targetLength
        };
        
        // 更新板材剩余数量 - 修复自我组合的数量更新问题
        combination.forEach((board, index) => {
            // 对于自我组合（两个相同的板材），需要特别处理
            if (result.isSelfCombination) {
                // 自我组合每次消耗2块板材，所以剩余数量减少 2 * layers
                // 但为了避免重复更新，我们只在第一个板材时更新
                if (index === 0) {
                    board.remaining -= 2 * layers;
                }
            } else {
                // 普通组合，每个板材消耗 layers 块
                board.remaining -= layers;
            }
            
            if (markUsed) {
                usedIds.add(board.id);
            }
        });
        
        results.push(result);
        return result;
    }

    // 显示配模统计信息
    showMatchingStatistics(results, boards, settings, selectedThickness) {
        const totalTemplates = results.length;
        const singleBoardTemplates = results.filter(
            result => result.combination && result.combination.length === 1
        ).length;
        
        const multiBoardTemplates = totalTemplates - singleBoardTemplates;
        
        // 统计第三次配模的模板数量
        const tertiaryTemplates = results.filter(
            result => result.isTertiary
        ).length;
        
        // 统计自我组合的模板数量
        const selfCombinationTemplates = results.filter(
            result => result.isSelfCombination
        ).length;
        
        const totalMatchedQuantity = results.reduce((sum, result) => 
            sum + result.layers * (result.combination ? result.combination.length : 0), 0
        );
        
        const averageUtilization = results.length > 0 
            ? results.reduce((sum, result) => sum + result.utilization, 0) / totalTemplates
            : 0;

        const adjustedBoards = boards.filter(board => {
            if (!selectedThickness.includes(board.thickness.toString())) return false;
            const adjustment = this.calculateAdjustedQuantity(board, settings.autoAdjustQuantity);
            return adjustment.needsAdjustment;
        });

        // 计算模数统计
        const modulusStats = {};
        results.forEach(result => {
            const modulus = result.modulus;
            modulusStats[modulus] = (modulusStats[modulus] || 0) + 1;
        });

        let message = `配模完成！生成 ${totalTemplates} 个模板 `;
        message += `(组合模板: ${multiBoardTemplates}, 单板模板: ${singleBoardTemplates})`;
        
        if (tertiaryTemplates > 0) {
            message += `，其中第三次配模: ${tertiaryTemplates}`;
        }
        
        if (selfCombinationTemplates > 0) {
            message += `，自我组合: ${selfCombinationTemplates}`;
        }
        
        message += `，平均利用率 ${(averageUtilization * 100).toFixed(1)}%`;

        // 添加模数分布信息
        const modulusInfo = Object.entries(modulusStats)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([modulus, count]) => `${modulus}模:${count}个`)
            .join(', ');
        
        if (modulusInfo) {
            message += `，模数分布: ${modulusInfo}`;
        }

        if (adjustedBoards.length > 0) {
            const totalAdded = adjustedBoards.reduce((sum, board) => {
                const adjustment = this.calculateAdjustedQuantity(board, settings.autoAdjustQuantity);
                return sum + adjustment.added;
            }, 0);
            message += `，自动调整 ${adjustedBoards.length} 种规格，补充 ${totalAdded} 块板材`;
        }

        // 显示通知
        if (this.core) {
            this.core.showNotification(message, 'success');
        }

        return {
            totalTemplates,
            singleBoardTemplates,
            multiBoardTemplates,
            tertiaryTemplates,
            selfCombinationTemplates,
            totalMatchedQuantity,
            averageUtilization,
            adjustedBoardsCount: adjustedBoards.length,
            totalAdded: adjustedBoards.reduce((sum, board) => {
                const adjustment = this.calculateAdjustedQuantity(board, settings.autoAdjustQuantity);
                return sum + adjustment.added;
            }, 0),
            modulusStats
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
    
    // ==================== 原代码中的算法部分结束 ====================
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
