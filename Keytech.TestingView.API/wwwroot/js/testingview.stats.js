L.stats = {};

L.stats.computeCostPerLot = function() {
    const totalCost = -L.session.meta.stats.costPercent * L.session.capital;
    if (!totalCost) {
        return 0;
    }

    const closedPositions = L.session.positions.filter(p => p.exitTime);
    let totalLots = 0;
    for (const position of closedPositions) {
        totalLots += position.getQuantity(true, true);
    }
    
    return totalCost / totalLots;
}

L.stats.exportStats = async function () {
    if (TradingView.defaultProperties.meta.includes(L.s(-1, -8) /* JournalExport */)) {
        L.toast(L.s(-4, -4) /* Exporting session statistics... */);

        if (!L.isEbacktestingPanelOpen()) {
            $(L.s(1, -5) /* button[data-qa-id=replay_trading] */).click();
        }

        var positionsTable = $(`${L.s(-2, -1) /* div.replay_trading:not(.js-hidden) */} table`);

        var positionTableRows = 0;
        await L.waitUntil(async () => {
            const rows = positionsTable.find(`tr.${L.r.s(7, -2) /* V_POSITION */}`).length;
            if (rows != positionTableRows) {
                positionTableRows = rows;
                return false;
            }
            return true;
        }, 50000, 500);

        var positionEntries = [];
        positionsTable.find(`tr.${L.r.s(7, -2) /* V_POSITION */}`).each((rowIndex, row) => {
            row = $(row);
            var positionEntry = new Map();
            var positionId = row.attr("id").split("_")[1];
            var position = L.session.positions.find(p => p.positionId == positionId);

            row.find(`td[${L.r.s(0, 7) /* column-name */}]`).each((columnIndex, cell) => {
                cell = $(cell);
                var columnName = cell.attr(L.r.s(0, 7) /* column-name */);
                if (columnName == L.r.s(1, -1) /* Trade */) {
                    positionEntry[L.r.s(1, -1) /* Trade */] = position.getDirection().toUpperCase();
                    const entryDate = L.getDateInTimezone(position.entryTime, L.c().getTimezone());
                    positionEntry[L.s(-4, -5) /* Entry Date */] = entryDate.toISOString().split("T")[0];
                    positionEntry[L.s(-4, -6) /* Entry Time */] = entryDate.toISOString().split("T")[1].slice(0, 5);

                    const exitDate = position.exitTime ? L.getDateInTimezone(position.exitTime, L.c().getTimezone()) : null;
                    positionEntry[L.s(-4, -7) /* Exit Date */] = exitDate ? exitDate.toISOString().split("T")[0] : null;
                    positionEntry[L.s(-4, -8) /* Exit Time */] = exitDate ? exitDate.toISOString().split("T")[1].slice(0, 5) : null;
                } else if (columnName == L.r.s(1, -3) /* Price */) {
                    positionEntry[L.s(-4, -9) /* Entry Price */] = position.entryPrice;
                    positionEntry[L.s(-5, -1) /* Exit Price */] = position.exitPrice || null;
                } else if (columnName == L.r.s(1, -7) /* Risk */) {
                    positionEntry[`${L.r.s(1, -7) /* Risk */} ${cell.find(`.${L.r.s(8, 1) /* currency */}`).text()}`] = cell.find(`.${L.r.s(4, -7) /* V_RISK */}`).text().trim();
                    positionEntry[`${L.r.s(1, -7) /* Risk */} %`] = cell.find(`.${L.r.s(4, -8) /* V_RISKPERCENTAGE */}`).text().trim();

                    positionEntry[L.s(-5, -2) /* SL */] = position.stopPrice(undefined, true, 0) || null;
                    positionEntry[L.s(-5, -3) /* TP */] = position.targetPrice(undefined, true, 0) || null;
                    positionEntry[L.s(-5, -4) /* BE */] = position.bePrice(undefined, true, 0) || null;
                } else if (columnName == L.r.s(1, -8) /* Profit */) {
                    positionEntry[`${L.r.s(1, -8) /* Profit */} ${cell.find(`.${L.r.s(8, 1) /* currency */}`).text()}`] = cell.find(`.${L.r.s(4, -9) /* V_PROFIT */}`).text().trim();
                    positionEntry[`${L.r.s(1, -8) /* Profit */} %`] = cell.find(`.${L.r.s(5, -1) /* V_PROFITPERCENTAGE */}`).text().trim();
                } else if (columnName == L.r.s(1, -9) /* Cumulative profit */) {
                    positionEntry[`${L.r.s(1, -9) /* Cumulative profit */} ${cell.find(`.${L.r.s(8, 1) /* currency */}`).text()}`] = cell.find(`.${L.r.s(5, -2) /* V_CUMULATIVEPROFIT */}`).text().trim();
                    positionEntry[`${L.r.s(1, -9) /* Cumulative profit */} %`] = cell.find(`.${L.r.s(5, -3) /* V_CUMULATIVEPROFITPERCENTAGE */}`).text().trim();
                } else if (columnName == L.r.s(2, -1) /* Run-up */) {
                    positionEntry[`${L.r.s(2, -1) /* Run-up */} ${cell.find(`.${L.r.s(8, 1) /* currency */}`).text()}`] = cell.find(`.${L.r.s(5, -4) /* V_RUNUP */}`).text().trim();
                    positionEntry[`${L.r.s(2, -1) /* Run-up */} %`] = cell.find(`.${L.r.s(5, -5) /* V_RUNUPPERCENTAGE */}`).text().trim();
                } else if (columnName == L.r.s(2, -2) /* Drawdown */) {
                    positionEntry[`${L.r.s(2, -2) /* Drawdown */} ${cell.find(`.${L.r.s(8, 1) /* currency */}`).text()}`] = cell.find(`.${L.r.s(5, -6) /* V_DRAWDOWN */}`).text().trim();
                    positionEntry[`${L.r.s(2, -2) /* Drawdown */} %`] = cell.find(`.${L.r.s(5, -7) /* V_DRAWDOWNPERCENTAGE */}`).text().trim();
                } else if (columnName == L.r.s(2, -4) /* BE Run-up */) {
                    positionEntry[`${L.r.s(2, -4) /* BE Run-up */} ${cell.find(`.${L.r.s(8, 1) /* currency */}`).text()}`] = cell.find(`.${L.r.s(5, -8) /* V_BERUNUP */}`).text().trim();
                    positionEntry[`${L.r.s(2, -4) /* BE Run-up */} %`] = cell.find(`.${L.r.s(5, -9) /* V_BERUNUPPERCENTAGE */}`).text().trim();
                } else if (columnName == L.r.s(2, -3) /* Snapshots */) {
                    positionEntry[L.r.s(2, -3) /* Snapshots */] = position.positionSnapshots.map(snapshot => `${L.snapshotUrlPrefix}${snapshot.snapshotUrl}`).join(", ");
                } else {
                    var value = position.columnValue(columnName) || null;
                    if (!value) {
                        const input = cell.find('input, select, textarea').first();
                        if (input.is(":checkbox")) {
                            value = input.is(":checked") ? "true" : "false";
                        } else {
                            if (input.length > 0) {
                                value = input.val();
                            } else {
                                value = cell.text().trim();
                            }
                        }
                    }

                    positionEntry[columnName] = value;
                }
            });

            positionEntries.push(positionEntry);
        });

        return L.dataOps.exportSessionStatistics(L.session.name, { userId: L.user.userId, sessionId: L.session.sessionId, positionEntries }).then(() => {
            L.toast(L.s(-5, -5) /* Session statistics exported successfully! */);
        });
    } else {
        L.messageBox(L.r.s(4, 0) /* Feature disabled */, L.s(-5, -8) /* Unable to export: please upgrade your TestingView.com subscription plan to enable this feature */);
        return Promise.resolve();
    }
}

L.stats.getClosedPositions = function () {
    const cacheKey = `getClosedPositions-${L.session.positions.length}-cost-${L.session.meta.stats.costPercent}`;

    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const closedPositions = L.session.positions.filter(p => p.exitTime && p.getQuantity(true, true)).sort((a, b) => a.entryTime - b.entryTime);
    L.cache.set(cacheKey, closedPositions, 3600);
    return closedPositions;
}

L.stats.getEffectivePositions = function (perLotCost) {
    const positions = L.stats.getClosedPositions();
    const cacheKey = `getEffectivePositions-${positions.length}-cost-${perLotCost}`;

    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const filteredPositions = positions.filter(p => Math.abs(p.getProfit(true, perLotCost)) >= (p.getRisk(true, perLotCost) || 0) / 10);
    L.cache.set(cacheKey, filteredPositions, 3600);
    return filteredPositions;
}

L.stats.getHighLevelStats = function (positions, perLotCost) {
    const totalTrades = positions.length;
    const winningTrades = positions.filter(p => p.getProfit(true, perLotCost) > 0).length;
    const losingTrades = positions.filter(p => p.getProfit(true, perLotCost) < 0).length;

    const totalProfit = positions.reduce((sum, p) => { const pr = p.getProfit(true, perLotCost); return sum + (pr > 0 ? pr : 0); }, 0);
    const totalLoss = positions.reduce((sum, p) => { const pr = p.getProfit(true, perLotCost); return sum + (pr < 0 ? pr : 0); }, 0);
    const winrate = totalTrades > 0 ? (((winningTrades / totalTrades) * 100).toFixed(0) + "%") : L.s(-4, -3) /* N/A */;
    const profitFactor = totalLoss !== 0 ? Math.abs((totalProfit / totalLoss).toFixed(2)) : L.s(-4, -3) /* N/A */;

    const avgRiskToReward = (losingTrades != 0 && winningTrades != 0 && totalLoss != 0)
        ? (
            (totalProfit / winningTrades) /
            (Math.abs(totalLoss) / losingTrades)
          ).toFixed(2)
        : L.s(-4, -3) /* N/A */;

    return {
        totalTrades,
        winningTrades,
        losingTrades,
        winrate,
        profitFactor,
        avgRiskToReward
    };
}

L.stats.getStreaks = function (positions, perLotCost) {
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let maxConsecutiveBes = 0;
    let currentWins = 0;
    let currentLosses = 0;
    let currentBes = 0;

    for (const position of positions) {
        const profit = position.getProfit(true, perLotCost);
        const isBE = position.isBreakEven(perLotCost);

        if (!isBE && profit > 0) {
            currentWins++; currentLosses = 0; currentBes = 0;
        } else if (!isBE && profit < 0) {
            currentLosses++; currentWins = 0; currentBes = 0;
        } else { // treat BE
            currentBes++; currentWins = 0; currentLosses = 0;
        }

        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
        maxConsecutiveBes = Math.max(maxConsecutiveBes, currentBes);
    }

    return {
        maxConsecutiveWins,
        maxConsecutiveLosses,
        maxConsecutiveBes
    };
}

L.stats.getStatsSummary = function () {
    const closedPositions = L.stats.getClosedPositions();
    const cacheKey = `getStatsSummary-${closedPositions.length}-cost-${L.session.meta.stats.costPercent}`;

    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const perLotCost = L.stats.computeCostPerLot(closedPositions.length);
    const effectivePositions = L.stats.getEffectivePositions(perLotCost);
    const highLevelStats = L.stats.getHighLevelStats(effectivePositions, perLotCost);
    const streaks = L.stats.getStreaks(closedPositions, perLotCost);
    const maxDrawdownPercent = L.stats.computeMaxDrawdown(closedPositions, false, perLotCost);
    const breakevenTrades = closedPositions.length - effectivePositions.length;

    function summaryLabel(label) {
        return '\t' + label + '\n';
    }

    function summaryValue(value) {
        return value.toString().padStart(8, " ");
    }

    const summary = summaryValue(highLevelStats.winrate) + summaryLabel(L.s(-3, -1) /* Winrate */) +
                    summaryValue(highLevelStats.profitFactor) + summaryLabel(L.s(-3, -2) /* Profit factor */) +
                    summaryValue(highLevelStats.avgRiskToReward) + summaryLabel(L.s(-3, -3) /* R:R ratio */) +
                    (highLevelStats.winningTrades > 0 ? (summaryValue(highLevelStats.winningTrades) + summaryLabel(L.s(-3, -5) /* Winning trades */)) : "") +
                    (highLevelStats.losingTrades > 0 ? (summaryValue(highLevelStats.losingTrades) + summaryLabel(L.s(-3, -6) /* Losing trades */)) : "") +
                    (breakevenTrades > 0 ? (summaryValue(breakevenTrades) + summaryLabel(L.s(-3, -7) /* BE trades */)) : "") +
                    (streaks.maxConsecutiveWins > 1 ? (summaryValue(streaks.maxConsecutiveWins) + summaryLabel(L.s(-3, -8) /* Win streak */)) : "") +
                    (streaks.maxConsecutiveLosses > 1 ? (summaryValue(streaks.maxConsecutiveLosses) + summaryLabel(L.s(-3, -9) /* Loss streak */)) : "") +
                    (maxDrawdownPercent > 0 ? (summaryValue(`${maxDrawdownPercent.toFixed(1)}%`) + summaryLabel(L.s(-4, -2) /* Max drawdown */)) : "");

    L.cache.set(cacheKey, summary, 3600); // Cache for 1 hour
    return summary;
}

L.stats.calculateSharpeRatio = function (returns) {
    if (!returns || returns.length === 0) return L.s(-4, -3) /* N/A */;

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - meanReturn, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length);

    return stdDev !== 0 ? (meanReturn / stdDev).toFixed(2) : L.s(-4, -3) /* N/A */;
}

L.stats.calculateDetailedStats = function(closedPositions, effectivePositions) {
    const perLotCost = L.stats.computeCostPerLot(closedPositions.length);
    const effectiveProfits = effectivePositions.map(p => p.getProfit(true, perLotCost));
    const highLevelStats = L.stats.getHighLevelStats(effectivePositions, perLotCost);
    
    const totalProfit = effectiveProfits.reduce((sum, p) => sum + (p > 0 ? p : 0), 0);
    const totalLoss = effectiveProfits.reduce((sum, p) => sum + (p < 0 ? p : 0), 0);

    const winAmounts = effectiveProfits.filter(p => p > 0);
    const lossAmounts = effectiveProfits.filter(p => p < 0);

    const avgWin = winAmounts.length > 0 ? winAmounts.reduce((sum, w) => sum + w, 0) / winAmounts.length : 0;
    const avgLoss = lossAmounts.length > 0 ? lossAmounts.reduce((sum, l) => sum + l, 0) / lossAmounts.length : 0;
    const largestWin = winAmounts.length > 0 ? Math.max(...winAmounts) : 0;
    const largestLoss = lossAmounts.length > 0 ? Math.min(...lossAmounts) : 0;

    const streaks = L.stats.getStreaks(closedPositions, perLotCost);

    return {
        perLotCost,
        closedPositions,
        effectiveProfits,
        highLevelStats,
        totalProfit,
        totalLoss,
        avgWin,
        avgLoss,
        largestWin,
        largestLoss,
        streaks
    };
}

L.stats.drawEquityCurve = function(positions) {
    const canvas = document.getElementById('backtst-equity-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find min/max values
    const balances = positions.map(d => d.meta.initial);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const balanceRange = maxBalance - minBalance || 1;
    
    // Clear canvas
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--tv-color-platform-background').trim() || '#131722';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--tv-color-line-divider').trim() || '#434651';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        
        // Labels
        const value = maxBalance - (balanceRange / 5) * i;
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--tv-color-text').trim() || '#d1d4dc';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(0), padding - 5, y + 3);
    }
    
    // Draw equity curve
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--tv-color-brand').trim() || '#2962ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    positions.forEach((position, index) => {
        const x = padding + (chartWidth / (positions.length - 1)) * index;
        const y = padding + chartHeight - ((position.balance - minBalance) / balanceRange) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw points for trades
    positions.forEach((position, index) => {
        if (index === 0) return; // Skip starting point

        const x = padding + (chartWidth / (positions.length - 1)) * index;
        const y = padding + chartHeight - ((position.balance - minBalance) / balanceRange) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);

        if (position.tradeType === 'win') {
            ctx.fillStyle = '#4caf50';
        } else if (position.tradeType === 'loss') {
            ctx.fillStyle = '#f44336';
        } else {
            ctx.fillStyle = '#9e9e9e';
        }
        
        ctx.fill();
    });
    
    // Draw starting capital line
    const startY = padding + chartHeight - ((L.session.capital - minBalance) / balanceRange) * chartHeight;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--tv-color-text-secondary').trim() || '#868ca0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, startY);
    ctx.lineTo(padding + chartWidth, startY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add labels
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--tv-color-text').trim() || '#d1d4dc';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Equity Curve', width / 2, 20);
}

L.stats.computeAverageTradeDuration = function(positions) {
    const avgSec = positions.reduce((s,p) => s + (p.exitTime - p.entryTime), 0) / positions.length;
    return L.getDurationText(avgSec);
}

// Compute optimal Stop-Loss size as a percentage of original SL (risk),
// by simulating hypothetical PnL if each trade were stopped at k * risk when its MAE exceeds that level.
// Returns { k, kPercent, baseline, hypothetical, delta, deltaPercent }
L.stats.computeOptimalSLSize = function(positions, perLotCost) {
    var optimalK = 0;
    var maxBalance = -Infinity;

    for (var k = 0.1; k <= 5; k += 0.1) {
        var runningBalance = 0;
        for (const p of positions) {
            const risk = p.getRisk(true) || 0;
            let qty = p.getQuantity(true, true) / k;
            let profit = (p.getProfit(true) / k) - (perLotCost * qty);
            const mae = Math.max(0, -p.getVirtualDrawDown(true));
            if (mae >= k * risk) {
                // loser: would have stopped out at full monetary risk
                profit = -risk - (perLotCost * qty);
            } else {
                // winner: assume original TP hit, scale by sizeFactor
                const tpPrice = p.targetPrice(undefined, true, 0);
                if (tpPrice) {
                    const tpProfit = L.calculateProfit(p, tpPrice);
                    if (tpProfit) {
                        profit = (tpProfit / k) - (perLotCost * qty);
                    }
                }
            }
            runningBalance += profit;
        }
        if (runningBalance > maxBalance) {
            optimalK = k;
            maxBalance = runningBalance;
        }
    }

    return optimalK;
};

L.stats.computeOptimalTPSize = function(positions, perLotCost) {
    let optimalK = 0; // fraction of original TP profit
    let maxBalance = -Infinity;

    // Scan k from 10% to 500% of original TP, step 10%
    for (let k = 0.1; k <= 5; k += 0.1) {
        let runningBalance = 0;
        for (const p of positions) {
            var profit = p.getProfit(true, perLotCost);
            const qty = p.getQuantity(true, true);
            const risk = p.getRisk(true) || 0;
            const mfe = p.getVirtualRunUp(true);
            const tpPrice = p.targetPrice(undefined, true, 0);
            if(tpPrice) {
                const tpProfit = L.calculateProfit(p, tpPrice);

                if (tpProfit > 0) {
                    const need = k * tpProfit; // currency required to hit scaled TP
                    if (mfe >= need) {
                        profit = need - (perLotCost * qty);
                    } else {
                        profit = -risk - (perLotCost * qty);
                    }
                }
            }
            runningBalance += profit;
        }
        if (runningBalance > maxBalance) {
            optimalK = k;
            maxBalance = runningBalance;
        }
    }
    return optimalK;
};

L.stats.computeMaxDrawdown = function (positions, absolute, perLotCost) {
    var peak = 0;
    var equity = 0;
    var maxDrawdown = 0;

    for (const position of positions) {
        var profit = absolute ? position.getProfit(true, perLotCost) : position.getProfitPercentage(undefined, true, perLotCost);
        var currentDrawdown = absolute ? position.getDrawDown(true, perLotCost) : position.getDrawDownPercentage(true, perLotCost);
        
        // Before trade closes, check drawdown: current equity + effective DD vs peak
        const ddFromPeak = equity + currentDrawdown - peak;
        
        if (ddFromPeak < maxDrawdown) {
            maxDrawdown = ddFromPeak;
        }

        // After trade closes, update equity
        equity += profit;

        // Update peak if we made new highs
        if (equity > peak) {
            peak = equity;
        }
    }

    return maxDrawdown;
}

L.stats.computeMaxRunup = function(positions, absolute, perLotCost) {
    var trough = 0;
    var equity = 0;
    var maxRunup = 0;
    for (const position of positions) {
        var profit = absolute ? position.getProfit(true, perLotCost) : position.getProfitPercentage(undefined, true, perLotCost);
        var currentRunup = absolute ? position.getRunUp(true, perLotCost) : position.getRunUpPercentage(true, perLotCost);
        // Before trade closes, check runup: current equity + effective RU vs trough
        const ruFromTrough = equity + currentRunup - trough;
        if (ruFromTrough > maxRunup) {
            maxRunup = ruFromTrough;
        }
        // After trade closes, update equity
        equity += profit;
        // Update trough if we made new lows
        if (equity < trough) {
            trough = equity;
        }
    }
    return maxRunup;
};

L.stats.aggregateByHour = function(positions, perLotCost) {
    var hours = [];
    for (var i = 0; i < 24; i++) {
        hours.push({hour: i.toString().padStart(2, "0") + ":00", profit: 0, count: 0});
    }

    for (const p of positions) {
        const d = L.getDateInTimezone(p.entryTime, L.c().getTimezone());
        const hour = d.getUTCHours();
        hours[hour].profit += p.getProfit(true, perLotCost);
        hours[hour].count++;
    }
    return hours;
}

L.stats.aggregateByDay = function(positions, perLotCost) {
    const days = new Map();
    for (const p of positions) {
        const positionDate = L.getDateInTimezone(p.entryTime, L.c().getTimezone());
        const dayId = L.getIsoDay(positionDate); // key: YYYY-MM-DD
        const dayResult = days.get(dayId) || { date: new Date(dayId), profit: 0, count: 0 };
        dayResult.profit += p.getProfit(true, perLotCost);
        dayResult.count++;
        days.set(dayId, dayResult);
    }

    return Array.from(days.values()).sort((a, b) => a.date - b.date);
}

L.stats.aggregateByWeek = function(positions, perLotCost) {
    const weeks = new Map(); // key: YYYY-MM-DD (monday)
    for (const p of positions) {
        const positionDate = L.getDateInTimezone(p.entryTime, L.c().getTimezone());
        const weekId = L.getIsoDay(L.getLastMonday(positionDate));
        const weekResult = weeks.get(weekId) || { date: new Date(weekId), profit: 0, count: 0 };
        weekResult.profit += p.getProfit(true, perLotCost);
        weekResult.count += 1;
        weeks.set(weekId, weekResult);
    }

    return Array.from(weeks.values()).sort((a, b)=> a.date - b.date);
}

L.stats.aggregateByWeekday = function(positions, perLotCost) {
    const days = [
        { label: 'Sun', profit: 0, count: 0 },
        { label: 'Mon', profit: 0, count: 0 },
        { label: 'Tue', profit: 0, count: 0 },
        { label: 'Wed', profit: 0, count: 0 },
        { label: 'Thu', profit: 0, count: 0 },
        { label: 'Fri', profit: 0, count: 0 },
        { label: 'Sat', profit: 0, count: 0 },
    ];
    for (const p of positions) {
        const positionDate = L.getDateInTimezone(p.entryTime, L.c().getTimezone());
        const positionDay = positionDate.getUTCDay();
        const rec = days[positionDay];
        rec.profit += p.getProfit(true, perLotCost);
        rec.count++;
    }
    
    return days;
}

L.stats.aggregateByMonth = function(positions, perLotCost) {
    const months = new Map();
    for (const p of positions) {
        const positionDate = L.getDateInTimezone(p.entryTime, L.c().getTimezone());
        const firstOfMonth = new Date(positionDate.setDate(1));
        const monthId = L.getIsoDay(firstOfMonth);
        const monthResult = months.get(monthId) || { date: firstOfMonth, profit: 0, count: 0 };
        monthResult.profit += p.getProfit(true, perLotCost);
        monthResult.count++;
        months.set(monthId, monthResult);
    }

    return Array.from(months.values()).sort((a,b)=> a.date - b.date);
}

// ---- Main overlay UI ----
L.stats.showSessionStatistics = async function() {
    if (!L.session || !(L.session.positions||[]).length) {
        L.messageBox(L.s(-7, -9) /* No data */, L.s(-8, -1) /* There are no positions in the current session to compute statistics. */);
        return;
    }

    const positions = L.stats.getClosedPositions();
    const perLotCost = L.stats.computeCostPerLot(closed.length);
    const effectivePositions = L.stats.getEffectivePositions(perLotCost);
    
    const highLevelStats = L.stats.getHighLevelStats(effectivePositions, perLotCost);
    const detailedStats = L.stats.calculateDetailedStats(positions, effectivePositions);
    const breakevenTrades = positions.length - effectivePositions.length;
    
    const profits = positions.map(p => p.getProfit(true, perLotCost));
    const sharpeRatio = L.stats.calculateSharpeRatio(profits);
    const avgDuration = L.stats.computeAverageTradeDuration(positions);
    const maxDrawdown = L.stats.computeMaxDrawdown(positions, true, perLotCost);
    const maxDrawdownPercent = L.stats.computeMaxDrawdown(positions, false, perLotCost);
    const maxRunup = L.stats.computeMaxRunup(positions, true, perLotCost);
    const maxRunupPercent = L.stats.computeMaxRunup(positions, false, perLotCost);

    const optSL = L.stats.computeOptimalSLSize(positions, perLotCost);
    const optTP = L.stats.computeOptimalTPSize(positions, perLotCost);
    
    // Determine if optimal SL is within acceptable near-optimal range (90% - 110%)
    const optSlPercent = Number.isFinite(optSL) ? optSL * 100 : NaN;
    const optSlIsOk = optSlPercent >= 90 && optSlPercent <= 110;
    // Determine if optimal TP (percentage of original TP) is near 100%
    const optTpPercent = Number.isFinite(optTP) ? optTP * 100 : NaN;
    const optTpIsOk = optTpPercent >= 90 && optTpPercent <= 110;
    // Heuristic thresholds for OK/Not-OK flags
    const parseNum = (v) => {
        if (v === null || v === undefined) return NaN;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
            if (v === '∞') return Infinity;
            const m = v.match(/-?\d+(?:\.\d+)?/);
            return m ? parseFloat(m[0]) : NaN;
        }
        return NaN;
    };
    const thresholds = {
        winrate: 50,          // %
        profitFactor: 1.5,    // >= 1.5 is OK
        avgRR: 1.0,           // >= 1.0 is OK
        sharpe: 1.0,          // >= 1.0 is OK
        winStreak: 3,         // >= 3 is OK
        lossStreak: 3,        // <= 3 is OK
        maxDrawdown: 20,      // <= 20% is OK
        maxRunup: 10          // >= 10% is OK
    };

    const okProfitFactor = parseNum(highLevelStats.profitFactor) >= thresholds.profitFactor;
    const okSharpe = parseNum(sharpeRatio) >= thresholds.sharpe;
    const iconCheck = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M9 16.17 4.83 12 3.41 13.41 9 19 21 7l-1.41-1.41z"/></svg>';

    // Equity curve and overlays (run-up/drawdown) for Lightweight Charts using real entry/exit times
    let equity = L.session.capital;
    const equityPoints = [];
    const runUpPoints = [];
    const drawDownPoints = [];
    let lastTimeSec = null;
    const toSec = (t) => {
        if (!t) return null;
        if (typeof t === 'number') {
            if (t > 1e12) return Math.floor(t / 1000); // ms -> s
            if (t > 1e9) return Math.floor(t); // already seconds
            // too small, assume milliseconds (older/smaller values)
            return Math.floor(t / 1000);
        }
        const d = new Date(t);
        const ms = d.getTime();
        return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
    };
    // Seed with an initial point just before the first valid trade time
    for (let i=0;i<positions.length;i++) {
        const sec = toSec(positions[i].entryTime || positions[i].exitTime);
        if (sec && Number.isFinite(sec)) { lastTimeSec = sec - 1; equityPoints.push({ time: lastTimeSec, value: equity }); runUpPoints.push({ time: lastTimeSec, value: equity }); drawDownPoints.push({ time: lastTimeSec, value: equity }); break; }
    }
    for (let i=0;i<positions.length;i++) {
        const sec = toSec(positions[i].entryTime || positions[i].exitTime);
        if (!Number.isFinite(sec)) continue; // skip if invalid time
        const timeSec = (lastTimeSec !== null && sec <= lastTimeSec) ? lastTimeSec + 1 : sec;
        const p = positions[i];
        const entryEquity = equity;
        const profit = p.getProfit(true, perLotCost);
        
        // Drawdown overlay: always include intra-trade MAE (even for BE trades)
        let troughWithin = entryEquity + profit; // default realized result
        const dd = p.getDrawDown(true, perLotCost); // negative when valid
        if (Number.isFinite(dd) && dd < profit) {
            troughWithin = entryEquity + dd;
        }
        // Run-up overlay: always include intra-trade MFE (even for BE trades)
        let peakWithin = entryEquity + profit;
        const ru = p.getRunUp(true, perLotCost); // positive
        if (Number.isFinite(ru) && ru > profit) {
            peakWithin = entryEquity + ru;
        }
        runUpPoints.push({ time: timeSec, value: peakWithin });
        drawDownPoints.push({ time: timeSec, value: troughWithin });
        // Equity progression always includes profit
        equity += profit;
        equityPoints.push({ time: timeSec, value: equity });
        lastTimeSec = timeSec;
    }
    if (!equityPoints.length) {
        // fallback to now if no valid times found
        const nowSec = Math.floor(Date.now()/1000);
        equityPoints.push({ time: nowSec, value: equity });
        runUpPoints.push({ time: nowSec, value: equity });
        drawDownPoints.push({ time: nowSec, value: equity });
        lastTimeSec = nowSec;
    }

    // Compute Expectancy (average profit per trade, after costs)
    const expectancy = (L.session.equity - L.session.capital) / positions.length - (perLotCost * positions.reduce((sum, p) => sum + (p.getQuantity ? p.getQuantity(true, true) : 0), 0) / positions.length);

    // Build overlay container (using a backdrop to allow outside-click close)
    $(".session-stats-backdrop").remove();
    const shell = $(`
        <div class="session-stats-backdrop" style="position:fixed; inset:0; z-index:147; background-color: rgba(0,0,0,0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);"></div>
    `);
        const viewer = $(`
            <div class="session-stats-viewer" style="position:fixed; top:50%; left:50%; transform: translate(-50%, -50%); width:96%; height:96%; z-index:146; background:var(--tv-color-platform-background,var(--color-popup-background, #0c0e12)); border:1px solid var(--tv-color-line-divider,#2a2e39); box-shadow:0 10px 30px rgba(0,0,0,0.5); border-radius:8px; display:flex; flex-direction:column;">
            <div style="display:flex; align-items:center; padding:8px 12px; border-bottom:1px solid var(--tv-color-line-divider,#2a2e39);">
                <div style="font-weight:600; font-size:14px;">TestingView Session: ${L.session.name || ''}</div>
                <div style="flex:1"></div>
                <button class="lightButton secondary xsmall typography-regular14px stats-screenshot" title="Copy & download a screenshot of the current stats" style="cursor:pointer; margin-right:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" style="vertical-align:middle; margin-right:6px;"><g fill="none" fill-rule="evenodd" stroke="currentColor"><path d="M13.111 18.5H10.5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-8.389z"></path><path d="M18.5 20v1.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H8"></path></g></svg>
                    Copy image
                </button>
                <button class="lightButton secondary xsmall typography-regular14px stats-export" title="Export all positions to Excel (as they appear in the TestingView journal panel)" style="cursor:pointer;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" style="vertical-align: middle;margin-right:6px;"><path stroke="currentColor" d="M6.5 16v4.5a1 1 0 001 1h14a1 1 0 001-1V16M14.5 5V17m-4-3.5l4 4l4-4"></path></svg>
                   Export
                </button>
            </div>
                                    <style>
                            /* Responsive grids */
                            .session-stats-viewer { display:flex; flex-direction:column; transition: filter 1s linear; }
                            .session-stats-viewer .metrics-grid { display:grid; gap:0px 6px; grid-template-columns: repeat(12, 1fr); grid-auto-rows: minmax(50px, auto); align-content:start; align-items:start; padding:8px 12px; }
                            .session-stats-viewer .charts-grid { display:grid; gap:12px; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 1fr; align-content:stretch; align-items:stretch; flex:1 1 auto; overflow:auto; padding:8px 12px; }
                            .session-stats-viewer .chart-tile { overflow:hidden; position:relative; isolation:isolate; contain:paint; display:grid; grid-template-rows: 24px 1fr; background: var(--tv-color-platform-background,var(--color-popup-background, #0c0e12)); height:auto; }
                                                    .session-stats-viewer .chart-header { display:grid; grid-template-columns: 1fr; align-items:center; }
                                                    .session-stats-viewer .chart-title { opacity:.8; font-size:12px; padding-left:8px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
                                                    .session-stats-viewer .chart-title .expand-icon { width:12px; height:12px; opacity:.7; }
                                                    .session-stats-viewer .chart-title:hover .expand-icon { opacity:1; }
                                                      .session-stats-viewer .chart-container { width:100%; height:100%; position:relative; overflow:hidden; min-height: 120px; box-sizing: border-box; padding-bottom: 1.25em; }
                                                      .session-stats-viewer .stats-large-overlay .chart-host { box-sizing: border-box; padding-bottom: 1.25em; }
                            /* Hide TradingView attribution/logo strictly inside stats overlay */
                            .session-stats-backdrop .session-stats-viewer .chart-container .tv-attr-logo,
                            .session-stats-backdrop .session-stats-viewer .chart-container [class^="tv-attr"],
                            .session-stats-backdrop .session-stats-viewer .chart-container [class*="tv-attr"],
                            .session-stats-backdrop .session-stats-viewer .chart-container a[href*="tradingview.com"],
                            .session-stats-backdrop .session-stats-viewer .stats-large-overlay .tv-attr-logo,
                            .session-stats-backdrop .session-stats-viewer .stats-large-overlay [class^="tv-attr"],
                            .session-stats-backdrop .session-stats-viewer .stats-large-overlay [class*="tv-attr"],
                            .session-stats-backdrop .session-stats-viewer .stats-large-overlay a[href*="tradingview.com"],
                            .session-stats-backdrop .session-stats-viewer .chart-container [data-name="logo"] {
                                display: none !important;
                                pointer-events: none !important;
                            }
                            /* Tile heights are controlled by charts-grid row sizing; Monte Carlo spans two rows */
                            .session-stats-viewer .tile-equity { height:auto; min-height: 24px; }
                            .session-stats-viewer .tile-small  { height:auto; min-height: 24px; }
                            @media (max-width: 1400px) {
                                .session-stats-viewer .metrics-grid { grid-template-columns: repeat(6, 1fr); }
                                .session-stats-viewer .charts-grid { grid-template-columns: repeat(6, 1fr); }
                                .session-stats-viewer .span-12 { grid-column: span 6 !important; }
                                .session-stats-viewer .span-6 { grid-column: span 6 !important; }
                                .session-stats-viewer .span-3 { grid-column: span 3 !important; }
                            }
                            @media (max-width: 900px) {
                                .session-stats-viewer .metrics-grid { grid-template-columns: repeat(1, 1fr); }
                                .session-stats-viewer .charts-grid { grid-template-columns: repeat(1, 1fr); grid-auto-rows: minmax(180px, 1fr); }
                                .session-stats-viewer .span-12,
                                .session-stats-viewer .span-6,
                                .session-stats-viewer .span-3 { grid-column: span 1 !important; }
                                /* Row-based sizing manages heights in single column */
                            }
                            /* Stat OK/NOK indicator */
                            .session-stats-viewer .stat-flag { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:50%; margin-left:6px; vertical-align:middle; }
                            .session-stats-viewer .stat-flag.ok { background: rgba(0, 200, 83, .15); color:#00C853; }
                            .session-stats-viewer .stat-flag.nok { background: rgba(244, 67, 54, .15); color:#F44336; }
                            .session-stats-viewer h2 { margin-top: 5px; font-size: 1.3em; }
                        </style>
                        <div class="metrics-grid stats-grid">
                        <div class="metric-winrate" style="grid-column: span 3; cursor:pointer;" title="Winrate = percent of trades that made money (ignoring tiny results < 0.1R).">
                    <div style="opacity:0.7; font-size:12px;">Winrate</div>
                                    <div style="font-size:16px;">${highLevelStats.winrate}</div>
                </div>
                <div class="metric-profit-factor" style="grid-column: span 3; cursor:pointer;" title="Profit factor = gross profit / gross loss. Higher is better (must be > 1).">
                    <div style="opacity:0.7; font-size:12px;">Profit factor</div>
                    <div style="font-size:16px;">${highLevelStats.profitFactor}<span class="stat-flag ${okProfitFactor ? 'ok' : 'nok'}">${okProfitFactor ? iconCheck : ""}</span></div>
                </div>
                <div class="metric-avg-rr" style="grid-column: span 3; cursor:pointer;" title="Average risk:reward per trade (avg win / avg loss). Higher is better.">
                    <div style="opacity:0.7; font-size:12px;">Average R:R</div>
                                    <div style="font-size:16px;">${highLevelStats.avgRiskToReward}</div>
                </div>
                <div class="metric-sharpe" style="grid-column: span 3; cursor:pointer;" title="Sharpe ratio (simplified here): average return / volatility. Higher is better.">
                    <div style="opacity:0.7; font-size:12px;">Sharpe ratio</div>
                    <div style="font-size:16px;">${sharpeRatio}<span class="stat-flag ${okSharpe ? 'ok' : 'nok'}">${okSharpe ? iconCheck : ""}</span></div>
                </div>

                <div style="grid-column: span 3;" title="Number of closed trades with profit (>= 0.1R).">
                    <div style="opacity:0.7; font-size:12px;">Winning trades</div>
                    <div style="font-size:16px;">${highLevelStats.winningTrades}</div>
                </div>
                <div style="grid-column: span 3;" title="Number of closed trades with loss (<= -0.1R).">
                    <div style="opacity:0.7; font-size:12px;">Losing trades</div>
                    <div style="font-size:16px;">${highLevelStats.losingTrades}</div>
                </div>
                <div class="metric-be-trades" style="grid-column: span 3; cursor:pointer;" title="Number of closed trades near breakeven (between -0.1R and +0.1R). Click to see hypothetical outcomes if BE hadn't been set.">
                    <div style="opacity:0.7; font-size:12px;">BE trades</div>
                    <div style="font-size:16px;">${breakevenTrades}</div>
                </div>
                <div class="metric-avg-duration" style="grid-column: span 3; cursor:pointer;" title="Average time a trade stays open (entry to exit).">
                    <div style="opacity:0.7; font-size:12px;">Avg trade duration</div>
                    <div style="font-size:16px;">${avgDuration}</div>
                </div>

                <div class="metric-win-streak" style="grid-column: span 3; cursor:pointer;" title="Longest run of consecutive winning trades."><div style=\"opacity:0.7; font-size:12px;\">Win streak</div><div style=\"font-size:16px;\">${detailedStats.streaks.maxConsecutiveWins}</div></div>
                <div class="metric-loss-streak" style="grid-column: span 3; cursor:pointer;" title="Longest run of consecutive losing trades.">
                    <div style="opacity:0.7; font-size:12px;">Loss streak</div>
                    <div style="font-size:16px;">${detailedStats.streaks.maxConsecutiveLosses}</div>
                </div>
                <div class="metric-max-dd" style="grid-column: span 3; cursor:pointer;" title="Largest peak-to-trough equity drop (includes intra-trade MAE for non-losing trades). Lower is better.">
                    <div style="opacity:0.7; font-size:12px;">Max drawdown</div>
                    <div style="font-size:16px;">${maxDrawdownPercent.toFixed(1)}% <span style="opacity:.75; font-size:12px;">( ${maxDrawdown.toFixed(2)} ${L.session.currencyId} )</span></div>
                </div>
                <div class="metric-max-ru" style="grid-column: span 3; cursor:pointer;" title="Largest trough-to-peak equity rise (includes intra-trade MFE for non-winning trades). Higher is better.">
                    <div style="opacity:0.7; font-size:12px;">Max run-up</div>
                    <div style="font-size:16px;">${maxRunupPercent.toFixed(1)}% <span style="opacity:.75; font-size:12px;">( ${maxRunup.toFixed(2)} ${L.session.currencyId} )</span></div>
                </div>

                

                <div class="metric-opt-sl" style="grid-column: span 3; cursor:pointer;" title="The percent-based SL size that would have yielded the highest net profit if it had been applied to all trades.">
                    <div style="opacity:0.7; font-size:12px;">Optimal SL size</div>
                    <div style="font-size:16px;">${Number.isFinite(optSL) ? (optSL * 100).toFixed(0) + '%' : 'N/A'}
                        ${optSlIsOk ? '<span class="stat-flag ok" title="100% means your current (average) SL size is effectively optimal. Making it larger would have added unnecessary loss on stopped trades; making it smaller would have increased premature stop-outs before reaching targets, hurting overall performance.">'+iconCheck+'</span>' : ''}
                    </div>
                </div>

                <div class="metric-opt-tp" style="grid-column: span 3; cursor:pointer;" title="The optimal take-profit as a percentage of each trade's original TP (per-position scaling) that yields the highest net profit.">
                    <div style="opacity:0.7; font-size:12px;">Optimal TP size</div>
                    <div style="font-size:16px;">${Number.isFinite(optTP) ? (optTP * 100).toFixed(0) + '%' : 'N/A'}
                        ${optTpIsOk ? '<span class="stat-flag ok" title="100% means your current TP sizing is effectively optimal relative to each trade\'s original TP target. Increasing it would have left more unrealized gains on the table as fewer trades reached the higher target; decreasing it would have cut winners too early, lowering overall performance.">'+iconCheck+'</span>' : ''}
                    </div>
                </div>

                <div class="metric-expectancy" style="grid-column: span 3; cursor:pointer;" title="Expectancy: average profit per trade (includes trading costs)">
                    <div style="opacity:0.7; font-size:12px;">Expectancy</div>
                    <div style="font-size:16px;">${(function(){
                        try { return Number.isFinite(expectancy) ? expectancy.toFixed(2) + ' ' + (L.session.currencyId||'') : 'N/A'; } catch(_e){ return 'N/A'; }
                    })()}</div>
                </div>

                </div>
                <div class="charts-grid">
                <div class="chart-tile span-12 tile-equity" style="grid-column: span 12; grid-row: span 2; border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:6px; padding:8px; overflow:hidden;" id="ebt-chart-montecarlo-main">
                    <div class="chart-header">
                        <div class="chart-title">Overall performance <span class="expand-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h7v2H7v10h10v-5h2v7H5V5Z"/></svg></span></div>
                    </div>
                    <div class="chart-container"></div>
                </div>

                <div class="chart-tile span-6 tile-small" style="grid-column: span 6; border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:6px; padding:8px; overflow:hidden;" id="ebt-chart-weekday">
                    <div class="chart-header">
                        <div class="chart-title">Profits by weekday <span class="expand-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h7v2H7v10h10v-5h2v7H5V5Z"/></svg></span></div>
                    </div>
                    <div class="chart-container"></div>
                </div>
                <div class="chart-tile span-6 tile-small" style="grid-column: span 6; border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:6px; padding:8px; overflow:hidden;" id="ebt-chart-hour">
                    <div class="chart-header">
                        <div class="chart-title">Profits by hour <span class="expand-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h7v2H7v10h10v-5h2v7H5V5Z"/></svg></span></div>
                    </div>
                    <div class="chart-container"></div>
                </div>

                <div class="chart-tile span-6 tile-small" style="grid-column: span 6; border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:6px; padding:8px; overflow:hidden;" id="ebt-chart-daily">
                    <div class="chart-header">
                        <div class="chart-title">Daily profit <span class="expand-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h7v2H7v10h10v-5h2v7H5V5Z"/></svg></span></div>
                    </div>
                    <div class="chart-container"></div>
                </div>
                <div class="chart-tile span-6 tile-small" style="grid-column: span 6; border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:6px; padding:8px; overflow:hidden;" id="ebt-chart-weekly">
                    <div class="chart-header">
                        <div class="chart-title">Weekly profit <span class="expand-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h7v2H7v10h10v-5h2v7H5V5Z"/></svg></span></div>
                    </div>
                    <div class="chart-container"></div>
                </div>
                <div class="chart-tile span-6 tile-small" style="grid-column: span 6; border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:6px; padding:8px; overflow:hidden;" id="ebt-chart-monthly">
                    <div class="chart-header">
                        <div class="chart-title">Monthly profit <span class="expand-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h7v2H7v10h10v-5h2v7H5V5Z"/></svg></span></div>
                    </div>
                    <div class="chart-container"></div>
                </div>
                <div class="chart-tile span-6 tile-small" style="grid-column: span 6; border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:6px; padding:8px; overflow:hidden;" id="ebt-chart-trades-week">
                    <div class="chart-header">
                        <div class="chart-title">Trades per week <span class="expand-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h7v2H7v10h10v-5h2v7H5V5Z"/></svg></span></div>
                    </div>
                    <div class="chart-container"></div>
                </div>
            </div>
            <div class="chart-tile span-12 tile-small" style="grid-column: span 12; padding:10px; overflow:hidden; min-height: 50px; height: 50px; display: block;" id="ebt-tile-costs">
                    <div class="chart-header">
                        <div class="chart-title">Trading costs impact (spreads + commissions) <span class="help-icon" title="Click to read more" style="display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:50%; background:rgba(255,255,255,0.08); color:inherit; font-weight:700; font-size:12px;">?</span></div>
                    </div>
                    <div class="chart-container" style="display:flex; flex-direction:column; gap:8px; padding:8px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <input type="range" min="0" max="20" step="0.5" class="ebt-cost-slider" style="flex:1;" />
                            <div style="text-align:right;">-<span class="ebt-cost-value">0%</span> impact</div>
                        </div>
                    </div>
                </div>
        </div>
    `);
    if(!TradingView.defaultProperties.meta.includes(L.s(-1, -9) /* AdvancedMetrics */)) {
        setTimeout(() => {
            viewer.css({filter: "blur(3px)"});
        }, 100);
    }
    shell.append(viewer);
    $('body').append(shell);
    
    if (!TradingView.defaultProperties.meta.includes(L.s(-1, -9) /* AdvancedMetrics */)) {
        $(`.${L.s(-8, -2) /* session-stats-backdrop */}`).addClass(L.s(-8, -3) /* blurred */);
        L.messageBox(L.r.s(4, 0) /* Feature disabled */, L.s(-8, -4) /* Unable to show the advanced statistics: please upgrade your TestingView.com subscription plan to enable this feature */, () => {
            shell.remove();
        });
    }
    // Initialize CSS variable for overlay height to drive tile heights
    const setViewerHeightVar = () => {
        const r = viewer[0].getBoundingClientRect();
        viewer.css('--viewer-h', r.height + 'px');
    };
    setViewerHeightVar();
    // Set initial size similar to previous max caps while respecting viewport
    try {
        const vw = window.innerWidth || 0;
        const vh = window.innerHeight || 0;
        const targetW = Math.min(Math.floor(vw * 0.96), 2000);
        const targetH = Math.min(Math.floor(vh * 0.96), 1500);
        viewer.css({ width: targetW + 'px', height: targetH + 'px' });
    } catch(_e) { /* ignore */ }
    // Keep in sync on window resize
    const onWindowResizeViewerVar = () => setViewerHeightVar();
    window.addEventListener('resize', onWindowResizeViewerVar);
    // Track content grid height for better chart fill
    const statsGridEl = viewer.find('.stats-grid')[0];
    if (window.ResizeObserver && statsGridEl) {
        const roGrid = new ResizeObserver(() => {
            const r = statsGridEl.getBoundingClientRect();
            viewer.css('--content-h', r.height + 'px');
        });
        roGrid.observe(statsGridEl);
        // Set initial content height var
        const r0 = statsGridEl.getBoundingClientRect();
        viewer.css('--content-h', r0.height + 'px');
    }
    viewer.find('.stats-export').on('click', async (e)=>{
        e.preventDefault();
        const btn = $(e.currentTarget);
        // Show a lightweight spinner overlay near the button
        btn.hide();
        const spinner = $(`
            <span class="ebt-spin" style="margin-right:10px">
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" style="animation: ebtspin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"/>
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
            </span>`);
        // Keyframes only within this viewer shell to avoid global CSS pollution
        const style = $(`<style>@keyframes ebtspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>`);
        viewer.append(style);
        btn.after(spinner);
        // Delay slightly so spinner renders before heavy work
        setTimeout(async () => {
            try {
                await L.stats.exportStats();
            } catch (err) {
                L.dbg('Export failed', "error", err);
                L.toast('Export failed. Please try again.', 3000);
            } finally {
                // Remove spinner and re-enable button
                btn.show();
                viewer.find('.ebt-spin').remove();
            }
        }, 100);
    });
    // Screenshot button: capture entire stats popup, copy to clipboard, and download (with spinner)
    viewer.find('.stats-screenshot').on('click', async (e)=>{
        e.preventDefault();
            // Show a lightweight spinner overlay near the button
            const btn = $(e.currentTarget);
            btn.hide();
            const spinner = $(`
                <span class="ebt-spin" style="margin-right:10px">
                    <svg class="spin" width="14" height="14" viewBox="0 0 24 24" style="animation: ebtspin 1s linear infinite;">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"/>
                        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                </span>`);
            // Keyframes only within this viewer shell to avoid global CSS pollution
            const style = $(`<style>@keyframes ebtspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>`);
            viewer.append(style);
            btn.after(spinner);
            setTimeout(async () => {
                // Before capturing: hide spinner and show button so they appear in the image
                spinner.hide();
                btn.show();
                // Remove box-shadow from viewer for clean screenshot
                const origBoxShadow = viewer[0].style.boxShadow;
                viewer[0].style.boxShadow = 'none';
                // Replace range sliders with visual representations for html2canvas
                const sliderReplacements = [];
                viewer.find('input[type="range"]').each(function(){
                    const slider = $(this);
                    const val = parseFloat(slider.val()) || 0;
                    const min = parseFloat(slider.attr('min')) || 0;
                    const max = parseFloat(slider.attr('max')) || 100;
                    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
                    // Create a visual slider track with thumb
                    const fakeSlider = $(`
                        <div class="ebt-fake-slider" style="flex:1; height:6px; background:rgba(255,255,255,0.15); border-radius:3px; position:relative;">
                            <div style="position:absolute; left:0; top:0; height:100%; width:${pct}%; background:#21c77d; border-radius:3px;"></div>
                            <div style="position:absolute; top:50%; left:${pct}%; transform:translate(-50%,-50%); width:14px; height:14px; background:#fff; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
                        </div>
                    `);
                    slider.hide();
                    slider.after(fakeSlider);
                    sliderReplacements.push({ slider, fakeSlider });
                });
                // Resolve CSS variables to explicit colors for html2canvas compatibility
                const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--tv-color-platform-background').trim() || 
                                getComputedStyle(document.documentElement).getPropertyValue('--color-popup-background').trim() || '#0c0e12';
                const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--tv-color-line-divider').trim() || '#2a2e39';
                // Store original backgrounds and set explicit colors on all elements with CSS variable backgrounds
                const bgRestoreList = [];
                const elementsToFix = [viewer[0], ...viewer.find('.chart-tile, .stats-header, .chart-grid, .chart-container, [style*="var("]').toArray()];
                for (const elem of elementsToFix) {
                    const origStyle = elem.style.background || '';
                    const origBgColor = elem.style.backgroundColor || '';
                    const computed = getComputedStyle(elem);
                    // Set explicit background color from computed style
                    const computedBg = computed.backgroundColor;
                    if (computedBg && computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'transparent') {
                        elem.style.backgroundColor = computedBg;
                    } else {
                        elem.style.backgroundColor = bgColor;
                    }
                    elem.style.background = elem.style.backgroundColor;
                    bgRestoreList.push({ elem, origStyle, origBgColor });
                }
                try {
                    const el = viewer[0];
                    // Temporarily ensure charts are fully visible and no overlays obscure content
                    const dpr = Math.min(window.devicePixelRatio || 1, 2);
                    const canvas = await html2canvas(el, {
                        backgroundColor: bgColor,
                        scale: dpr,
                        useCORS: true,
                        logging: false,
                        windowWidth: document.documentElement.scrollWidth,
                        windowHeight: document.documentElement.scrollHeight
                    });
                    // Convert to blob
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    if (!blob) throw new Error('Failed to generate PNG');
                    // Try copy to clipboard (requires secure context and permissions)
                    let copied = false;
                    try {
                        if (navigator.clipboard && window.ClipboardItem) {
                            const item = new ClipboardItem({ 'image/png': blob });
                            await navigator.clipboard.write([item]);
                            copied = true;
                        }
                    } catch(_e) {
                        copied = false;
                    }
                    // Trigger download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const ts = new Date().toISOString().replace(/[:T]/g,'-').replace(/\..+/, '');
                    // Sanitize session name for Windows filenames
                    const rawName = String((L.session && L.session.name) || 'session');
                    let safeName = rawName
                        .replace(/[\\/:*?"<>|]+/g, '-') // replace forbidden chars with '-'
                        .replace(/\s+/g, ' ') // collapse whitespace
                        .trim()
                        .replace(/[\. ]+$/g, ''); // remove trailing dots/spaces
                    if (!safeName) safeName = 'session';
                    const reserved = new Set(['CON','PRN','AUX','NUL','COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8','COM9','LPT1','LPT2','LPT3','LPT4','LPT5','LPT6','LPT7','LPT8','LPT9']);
                    if (reserved.has(safeName.toUpperCase())) safeName = `${safeName}_`;
                    safeName = safeName.slice(0, 80);
                    a.href = url;
                    a.download = `TestingView-stats-${safeName}.png`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(()=>{ try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch(_e){} }, 0);
                    // Toast feedback
                    if (copied) L.toast('Screenshot copied to clipboard and downloaded.', 3000); else L.toast('Screenshot downloaded. Clipboard copy may be blocked by browser.', 3000);
                } catch(err) {
                    L.dbg('Screenshot failed', "error", err);
                    L.messageBox('Screenshot failed', 'Could not create the screenshot. Please try again.');
                } finally {
                    // Restore sliders, background, and box-shadow
                    for (const { slider, fakeSlider } of sliderReplacements) {
                        fakeSlider.remove();
                        slider.show();
                    }
                    viewer[0].style.background = bgRestoreList[0].origStyle;
                    viewer[0].style.boxShadow = origBoxShadow;
                    // Remove spinner and re-enable button
                    spinner.remove();
                    btn.show();
                }
            }, 100);
    });
    // Close only when clicking on the backdrop itself, or pressing Esc
    let shellDownOnBackdrop = false;
    shell.on('mousedown', (e)=> { shellDownOnBackdrop = (e.target === shell[0]); });
    shell.on('click', (e)=> { if (e.target === shell[0] && shellDownOnBackdrop) { shell.remove(); } });
    const onEsc = (e) => {
        if (e.key === 'Escape') {
            const topLarge = shell.find('.stats-large-overlay');
            if (topLarge.length) topLarge.remove(); else shell.remove();
        }
    };
    $(document).on('keydown.statsEsc', onEsc);
    shell.on('remove', ()=> {
        $(document).off('keydown.statsEsc', onEsc);
        window.removeEventListener('resize', onWindowResizeViewerVar);
    });
    // Enable resizing by dragging any corner (no visible handles; cursor changes near corners)
    (function enableCornerResize(){
        const el = viewer[0];
        if (!el) return;
        const edge = 12; // px hotspot size for corners
    const minW = 600, minH = 380; // sensible minimums
    let maxW = Infinity, maxH = Infinity; // allow beyond previous max; viewport will still bound
        let resizing = null; // { corner, startX, startY, startW, startH, startL, startT }

        const getCorner = (x, y) => {
            const r = el.getBoundingClientRect();
            const nearLeft = (x - r.left) <= edge;
            const nearRight = (r.right - x) <= edge;
            const nearTop = (y - r.top) <= edge;
            const nearBottom = (r.bottom - y) <= edge;
            if (nearLeft && nearTop) return 'nw';
            if (nearRight && nearTop) return 'ne';
            if (nearLeft && nearBottom) return 'sw';
            if (nearRight && nearBottom) return 'se';
            return null;
        };
        const cursorFor = (corner) => {
            if (!corner) return '';
            return (corner === 'nw' || corner === 'se') ? 'nwse-resize' : 'nesw-resize';
        };
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

        const onMoveHover = (e) => {
            if (resizing) return; // cursor handled in active resize
            const c = getCorner(e.clientX, e.clientY);
            el.style.cursor = cursorFor(c);
        };
        const beginResize = (e) => {
            const c = getCorner(e.clientX, e.clientY);
            if (!c) return;
            e.preventDefault(); e.stopPropagation();
            const r = el.getBoundingClientRect();
            // If centered via transform, switch to absolute pixel positioning for resizing
            const computed = getComputedStyle(el);
            const hasTransform = (computed.transform && computed.transform !== 'none');
            if (hasTransform) {
                el.style.transform = 'none';
                el.style.left = r.left + 'px';
                el.style.top = r.top + 'px';
            }
            resizing = {
                corner: c,
                startX: e.clientX,
                startY: e.clientY,
                startW: r.width,
                startH: r.height,
                startL: r.left,
                startT: r.top,
                centerX: r.left + r.width / 2,
                centerY: r.top + r.height / 2
            };
            document.addEventListener('mousemove', onResizing, true);
            document.addEventListener('mouseup', endResize, true);
        };
        const onResizing = (e) => {
            if (!resizing) return;
            const dx = e.clientX - resizing.startX;
            const dy = e.clientY - resizing.startY;
            // Resize symmetrically to keep center fixed
            const signX = (resizing.corner === 'se' || resizing.corner === 'ne') ? 1 : -1;
            const signY = (resizing.corner === 'se' || resizing.corner === 'sw') ? 1 : -1;
            let newW = resizing.startW + 2 * signX * dx;
            let newH = resizing.startH + 2 * signY * dy;
            // Constrain minimum sizes
            newW = Math.max(minW, newW);
            newH = Math.max(minH, newH);
            // Keep within viewport while maintaining center
            const vw = window.innerWidth, vh = window.innerHeight;
            const maxWByViewport = 2 * Math.min(resizing.centerX, vw - resizing.centerX);
            const maxHByViewport = 2 * Math.min(resizing.centerY, vh - resizing.centerY);
            if (Number.isFinite(maxWByViewport) && maxWByViewport > 0) newW = Math.min(newW, maxWByViewport);
            if (Number.isFinite(maxHByViewport) && maxHByViewport > 0) newH = Math.min(newH, maxHByViewport);
            const newL = Math.round(resizing.centerX - newW / 2);
            const newT = Math.round(resizing.centerY - newH / 2);
            el.style.width = Math.round(newW) + 'px';
            el.style.height = Math.round(newH) + 'px';
            el.style.left = newL + 'px';
            el.style.top = newT + 'px';
            el.style.cursor = cursorFor(resizing.corner);
            e.preventDefault();
        };
        const endResize = (e) => {
            if (!resizing) return;
            document.removeEventListener('mousemove', onResizing, true);
            document.removeEventListener('mouseup', endResize, true);
            el.style.cursor = '';
            resizing = null;
            if (e) { try { e.preventDefault(); e.stopPropagation(); } catch(_e){} }
        };
        el.addEventListener('mousemove', onMoveHover);
        el.addEventListener('mousedown', beginResize);
        // Cleanup when shell is removed
        shell.on('remove', ()=>{
            try {
                el.removeEventListener('mousemove', onMoveHover);
                el.removeEventListener('mousedown', beginResize);
                document.removeEventListener('mousemove', onResizing, true);
                document.removeEventListener('mouseup', endResize, true);
            } catch(_e){}
        });
    })();

    // Render small charts
    const makeChart = (el, defSeries) => {
    const container = $(el).find('.chart-container')[0];
    const rect = container.getBoundingClientRect();
    const pb0 = parseFloat(getComputedStyle(container).paddingBottom||'0') || 0; // computed px for em-based padding
            const chart = createChart(container, {
                width: rect.width,
                height: Math.max(0, rect.height - pb0),
                layout:{ background:{ type:'solid', color:'transparent' }, textColor: getComputedStyle(document.documentElement).getPropertyValue('--color-toolbar-button-text-hover').trim() || '#d1d4dc' },
                grid: { vertLines: { visible: false }, horzLines: { visible: false } },
                leftPriceScale: { visible: false },
                rightPriceScale:{ borderVisible:false },
                timeScale:{ borderVisible:false }
            });
        for (const s of defSeries) {
            // Defaults keep labels hidden unless the series explicitly enables them
            let base = Object.assign({ lastValueVisible: false, priceLineVisible: false }, s.options || {});
            let series;
            if (s.type === 'area') series = chart.addAreaSeries(base);
            else if (s.type === 'histogram') series = chart.addHistogramSeries(base);
            else series = chart.addLineSeries(base);
            series.setData(s.data||[]);
        }
        chart.timeScale().fitContent();
        // If this chart includes a primary area series followed by series with future-only points (forecast),
        // zoom to fit the equity history and just the start of the forecast (not the full forecast)
        try {
            const primary = (defSeries[0] && defSeries[0].data) ? defSeries[0].data : null;
            if (primary && primary.length > 1) {
                const from = primary[0].time;
                const lastEq = primary[primary.length - 1].time;
                // Find earliest forecast time and step from any subsequent series
                let firstFuture = Infinity;
                let step = NaN;
                for (let i = 1; i < defSeries.length; i++) {
                    const d = defSeries[i].data || [];
                    for (let j = 0; j < d.length; j++) {
                        const t = d[j].time;
                        if (t > lastEq) {
                            if (t < firstFuture) {
                                firstFuture = t;
                                // try infer step as next point in same series
                                if (j + 1 < d.length) {
                                    const t2 = d[j + 1].time;
                                    if (Number.isFinite(t2)) step = t2 - t;
                                }
                            }
                            break;
                        }
                    }
                }
                if (Number.isFinite(from) && Number.isFinite(lastEq) && Number.isFinite(firstFuture) && firstFuture !== Infinity) {
                    if (!Number.isFinite(step) || step <= 0) step = Math.max(1, firstFuture - lastEq);
                    const to = lastEq + step * 3; // include only first ~3 forecast steps
                    chart.timeScale().setVisibleRange({ from, to });
                }
            }
        } catch(_e) { /* ignore if range cannot be set */ }
        // If this is the Weekday chart, format axis ticks to day names
        if (typeof title === 'string' && title.toLowerCase().includes('weekday')) {
            try {
                chart.applyOptions({
                    timeScale: {
                        tickMarkFormatter: (time) => {
                            let sec;
                            if (typeof time === 'number') {
                                sec = time;
                            } else if (time && typeof time === 'object') {
                                if (typeof time.timestamp === 'number') sec = time.timestamp;
                                else if (typeof time.year === 'number') sec = Math.floor(Date.UTC(time.year, (time.month||1)-1, time.day||1)/1000);
                            }
                            if (!Number.isFinite(sec)) return '';
                            const d = new Date(sec * 1000);
                            return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()];
                        }
                    }
                });
                chart.applyOptions({
                    localization: {
                        timeFormatter: (time) => {
                            const sec = typeof time === 'number' ? time : (time && typeof time.timestamp === 'number' ? time.timestamp : null);
                            if (!Number.isFinite(sec)) return '';
                            const d = new Date(sec * 1000);
                            return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()];
                        }
                    }
                });
            } catch(_e) { /* ignore if formatter not supported */ }
        }
        // Keep in sync with container size
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                const r = container.getBoundingClientRect();
                const w = Math.max(0, Math.floor(r.width));
                const pb = parseFloat(getComputedStyle(container).paddingBottom||'0') || 0; // computed px
                const h = Math.max(0, Math.floor(r.height - pb));
                chart.applyOptions({ width: w, height: h });
            });
            ro.observe(container);
        } else {
            window.addEventListener('resize', () => {
                const r = container.getBoundingClientRect();
                const pb = parseFloat(getComputedStyle(container).paddingBottom||'0') || 0; // computed px
                chart.applyOptions({ width: r.width, height: Math.max(0, r.height - pb) });
            });
        }
        return chart;
    };

    const hourlyPoints = L.stats.aggregateByHour(positions, perLotCost);
    const dailyPoints = L.stats.aggregateByDay(positions, perLotCost);
    const weekdayPoints = L.stats.aggregateByWeekday(positions, perLotCost);
    const weeklyPoints = L.stats.aggregateByWeek(positions, perLotCost);
    const monthlyPoints = L.stats.aggregateByMonth(positions, perLotCost);
    
    const hourlyData = hourlyPoints.map((p, i) => ({ time: i * 3600, value: p.profit, color: (p.profit < 0 ? '#ff5c7c' : p.profit > 0 ? '#ff9f38' : '#9e9e9e') }));
    const dailyData = dailyPoints.map(p => ({ time: p.date / 1000, value: p.profit, color: (p.profit < 0 ? '#ff5c7c' : p.profit > 0 ? '#6fbf73' : '#9e9e9e') }));
    const weekdayData = weekdayPoints.map((p, i)=> ({ time: new Date(1970, 0, 4 + i) / 1000, value: p.profit, color: (p.profit < 0 ? '#ff5c7c' : p.profit > 0 ? '#38a2ff' : '#9e9e9e') }));
    const weeklyData = weeklyPoints.map(p => ({ time: p.date / 1000, value: p.profit, color: (p.profit < 0 ? '#ff5c7c' : p.profit > 0 ? '#7e57c2' : '#9e9e9e') }));
    const weeklyTradesPoints = weeklyPoints.map(p => ({ time: p.date / 1000, value: p.count, color: (p.profit < 0 ? '#feaa28' : p.profit > 0 ? '#ffca28' : '#9e9e9e') }));
    const monthlyData = monthlyPoints.map(p => ({ time: p.date / 1000, value: p.profit, color: (p.profit < 0 ? '#ff5c7c' : p.profit > 0 ? '#26c6da' : '#9e9e9e') }));

    const hourlySeries = [{ type:'histogram', data: hourlyData, options:{ color:'#ff9f38', priceFormat:{ type:'price', precision:2, minMove:0.01 } } }];
    const dailySeries = [{ type:'histogram', data: dailyData, options:{ color:'#6fbf73', priceFormat:{ type:'price', precision:2, minMove:0.01 } } }];
    const weekdaySeries = [{ type:'histogram', data: weekdayData, options:{ color:'#38a2ff', priceFormat:{ type:'price', precision:2, minMove:0.01 } } }];
    const weeklySeries = [{ type:'histogram', data: weeklyData, options:{ color:'#7e57c2', priceFormat:{ type:'price', precision:2, minMove:0.01 } } }];
    const weeklyTradesSeries = [{ type:'histogram', data: weeklyTradesPoints, options:{ color:'#ffca28', priceFormat:{ type:'volume' } } }];
    const monthlySeries = [{ type:'histogram', data: monthlyData, options:{ color:'#26c6da', priceFormat:{ type:'price', precision:2, minMove:0.01 } } }];
    
    const hourlyChart = makeChart($('#ebt-chart-hour')[0], hourlySeries);
    const formatHour = (seconds)=> {
        const h = Math.floor(seconds / 3600) % 24;
        return String(h).padStart(2,'0');
    };
    
    hourlyChart.applyOptions({
        timeScale: {
            tickMarkFormatter: (seconds)=> formatHour(seconds)
        },
        localization: {
            timeFormatter: (seconds)=> `${formatHour(seconds)}:00`
        }
    });


    makeChart($('#ebt-chart-daily')[0], dailySeries);
    const weekdayChart = makeChart($('#ebt-chart-weekday')[0], weekdaySeries);
    weekdayChart.applyOptions({
        timeScale: {
            tickMarkFormatter: (seconds) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(seconds * 1000).getDay()]
        }
    });
    weekdayChart.applyOptions({
        localization: {
            timeFormatter: (seconds) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(seconds * 1000).getDay()]
        }
    });


    makeChart($('#ebt-chart-weekly')[0], weeklySeries);
    const monthlyChart = makeChart($('#ebt-chart-monthly')[0], monthlySeries);
    // Format monthly axis to show only month name (e.g., May, Jun) instead of 'May 1'
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    monthlyChart.applyOptions({
        timeScale: {
            tickMarkFormatter: (seconds) => monthNames[new Date(seconds * 1000).getUTCMonth()]
        },
        localization: {
            timeFormatter: (seconds) => monthNames[new Date(seconds * 1000).getUTCMonth()]
        }
    });
    makeChart($('#ebt-chart-trades-week')[0], weeklyTradesSeries);

    // Compute and label winrates (positives/total) for daily/weekly/monthly charts
    const calcWinrate = (points) => {
        const pos = points.length ? points.reduce((acc, p) => acc + (p.profit > 0 ? 1 : 0), 0) : 0;
        const pct = points.length ? Math.round((pos / points.length) * 100) : 0;
        return { pct, pos, total: points.length};
    };
    const wrDaily = calcWinrate(dailyPoints);
    const wrWeekly = calcWinrate(weeklyPoints);
    const wrMonthly = calcWinrate(monthlyPoints);
    const addWinrateBadge = (tileSelector, wr) => {
        const titleEl = viewer.find(tileSelector + ' .chart-title');
        titleEl.find('.wr-badge').remove();
        const text = `${wr.pct}% (${wr.pos}/${wr.total})`;
        const badge = $(`<span class="wr-badge" style="opacity:.75; font-size:12px; margin-left:8px;">${text}</span>`);
        titleEl.append(badge);
    };
    addWinrateBadge('#ebt-chart-daily', wrDaily);
    addWinrateBadge('#ebt-chart-weekly', wrWeekly);
    addWinrateBadge('#ebt-chart-monthly', wrMonthly);

    // Progression charts: Winrate (%), Profit Factor, Average R:R over time (by exit time), excluding BE trades for counts
    let cumWins = 0, cumLosses = 0;
    let cumProfitPos = 0, cumProfitNeg = 0; // negative sum of losses
    let lastWr = null, lastPf = null, lastRR = null;
    const wrProg = [];
    const pfProg = [];
    const rrProg = [];
    // For Sharpe progression: maintain running mean and variance (Welford) on per-trade returns (profit values)
    let nSharpe = 0, meanSharpe = 0, m2Sharpe = 0;
    const sharpeProg = [];
    // For Avg duration progression: cumulative average of (exit - entry) in seconds for closed trades
    let nDur = 0, sumDur = 0;
    const durProg = [];
    for (const p of positions) {
        const t = toSec(p.exitTime || p.entryTime);
        const pr = p.getProfit(true, perLotCost); 
        const risk = Number(p.getRisk && p.getRisk(true)) || 0;
        const isBE = p.isBreakEven(perLotCost);
        if (!isBE) {
            if (pr >= risk/10) { cumWins++; cumProfitPos += pr; }
            else if (pr <= -risk/10) { cumLosses++; cumProfitNeg += pr; }
        }
        const denom = (cumWins + cumLosses);
        if (denom > 0) lastWr = (cumWins / denom) * 100;
        wrProg.push({ time: t, value: (lastWr===null? null : Number(lastWr.toFixed(2))) });
        if (cumLosses > 0 && cumProfitNeg !== 0) lastPf = Math.abs(cumProfitPos / cumProfitNeg);
        pfProg.push({ time: t, value: (lastPf===null? null : Number(lastPf.toFixed(2))) });
        if (cumWins > 0 && cumLosses > 0 && cumProfitNeg !== 0) {
            const avgWin = cumProfitPos / cumWins;
            const avgLossAbs = Math.abs(cumProfitNeg) / cumLosses;
            if (avgLossAbs > 0) lastRR = avgWin / avgLossAbs;
        }
        rrProg.push({ time: t, value: (lastRR===null? null : Number(lastRR.toFixed(2))) });

        // Sharpe progression (use all returns including BE so volatility reflects reality)
        if (Number.isFinite(pr)) {
            nSharpe += 1;
            const delta = pr - meanSharpe;
            meanSharpe += delta / nSharpe;
            const delta2 = pr - meanSharpe;
            m2Sharpe += delta * delta2;
            const variance = nSharpe > 1 ? (m2Sharpe / nSharpe) : 0; // population variance to match existing L.calculateSharpeRatio
            const stdDev = Math.sqrt(variance);
            const sharpe = stdDev !== 0 ? (meanSharpe / stdDev) : null;
            sharpeProg.push({ time: t, value: sharpe === null ? null : Number(sharpe.toFixed(2)) });
        } else {
            sharpeProg.push({ time: t, value: null });
        }

        // Avg duration progression (only when trade has both entry and exit)
        if (p.entryTime && p.exitTime) {
            const durSec = (p.exitTime - p.entryTime);
            if (Number.isFinite(durSec)) {
                nDur += 1;
                sumDur += durSec;
                const avgDurSec = sumDur / nDur;
                durProg.push({ time: t, value: Number((avgDurSec/60).toFixed(2)) }); // minutes for readability
            } else {
                durProg.push({ time: t, value: null });
            }
        } else {
            durProg.push({ time: t, value: null });
        }
    }
    
    // Helper to filter outliers: clamp values to 90th percentile range
    function clampToPercentile(data, percentile = 0.9) {
        if (!data || data.length < 3) return data;
        const values = data.map(p => p.value).filter(v => v !== null && Number.isFinite(v)).sort((a, b) => a - b);
        if (values.length < 3) return data;
        const lowIdx = Math.floor(values.length * (1 - percentile) / 2);
        const highIdx = Math.floor(values.length * (1 + percentile) / 2) - 1;
        const minVal = values[lowIdx];
        const maxVal = values[highIdx];
        return data.map(p => ({
            time: p.time,
            value: p.value === null ? null : Math.max(minVal, Math.min(maxVal, p.value))
        }));
    }
    
    const wrSeries = [{ type:'line', data: clampToPercentile(wrProg.filter(p=>p.value!==null)), options:{ color:'#ffd166', lineWidth:2 } }];
    const pfSeries = [{ type:'line', data: clampToPercentile(pfProg.filter(p=>p.value!==null)), options:{ color:'#26c6da', lineWidth:2 } }];
    const rrSeries = [{ type:'line', data: clampToPercentile(rrProg.filter(p=>p.value!==null)), options:{ color:'#7e57c2', lineWidth:2 } }];
    const sharpeSeries = [{ type:'line', data: clampToPercentile(sharpeProg.filter(p=>p.value!==null)), options:{ color:'#66bb6a', lineWidth:2 } }];
    const avgDurSeries = [{ type:'line', data: clampToPercentile(durProg.filter(p=>p.value!==null)), options:{ color:'#ef6c00', lineWidth:2 } }];

    // Initialize and wire the cost slider to re-render stats with new costs
    (function initCostSlider(){
        const tile = viewer.find('#ebt-tile-costs');
        const slider = tile.find('.ebt-cost-slider');
        const valueEl = tile.find('.ebt-cost-value');
        const currentAbs = Math.round(Math.abs(Number(L.session.meta.stats.costPercent||0)) * 100 * 10) / 10; // as % with 1 decimal
        slider.val(String(Math.min(20, Math.max(0, currentAbs))));
        valueEl.text(`${currentAbs.toFixed(1)}%`);
        const apply = (absPct) => {
            const pct = -absPct / 100; // store as negative fraction of starting capital
            L.session.meta.stats.costPercent = pct;
            const oldShell = shell; // keep current shell to remove after new one mounts
            setTimeout(()=> {
                L.stats.showSessionStatistics();
                try { oldShell.remove(); } catch(_e) {}
            }, 0);
        };
        // While dragging: update label only (no full re-render to avoid flicker)
        slider.on('input', function(){
            const v = Number(this.value) || 0;
            valueEl.text(`${v.toFixed(1)}%`);
        });
        // Apply once when the user releases the slider or commits the value
        const commit = () => {
            if(!TradingView.defaultProperties.meta.includes(L.r.s(-2, -5) /* SlippageAndSpreads */)) {
                L.messageBox(L.r.s(4, 0) /* Feature disabled */, L.r.s(-2, -6) /* Trading costs are not available: please upgrade your TestingView.com subscription plan to enable this feature. */);
                return;
            }

            const v = Number(slider.val()) || 0;
            apply(v);
        };
        slider.on('change', commit);
        slider.on('pointerup mouseup touchend', commit);
        // Help popup on title click
        const openCostsHelp = () => {
            const large = $(`
                <div class="stats-large-overlay" style="position:absolute; inset:0; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display:flex; align-items:center; justify-content:center; z-index:149;">
                    <div style="position:relative; width: min(900px, 95%); max-height: 80%; overflow:auto; background: var(--tv-color-platform-background,var(--color-popup-background, #0c0e12)); border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:8px; padding:16px 20px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                            <div style="font-weight:600;">Trading costs impact (spreads + commissions)</div>
                            <div style="flex:1"></div>
                        </div>
                        <div style="font-size:12px; opacity:.9; line-height:1.5;">
                            <p>Adjust how much trading costs weigh on the portfolio over time. The slider applies a negative percentage of starting capital, distributed across all closed trades (larger-size trades incur proportionally more cost). All metrics and charts above reflect this adjustment.</p>
                            <h3 style="margin:8px 0 6px;">The costs depend a lot on:</h3>
                            <ul style="margin:0 0 10px 18px;">
                                <li>Instruments (futures vs. forex vs. stocks vs. crypto)</li>
                                <li>Trading frequency (scalping with dozens/hundreds of trades daily vs. 1–2 entries)</li>
                                <li>Position size and account size (fixed commissions vs. per contract vs. per lot)</li>
                                <li>Broker (ECN low-spread + small commission vs. market maker with wide spreads)</li>
                            </ul>
                            <h3 style="margin:8px 0 6px;">Typical ranges:</h3>
                            <ul style="margin:0 0 10px 18px;">
                                <li><strong>Medium-frequency traders</strong> (intraday, a few trades per day): around 1–3% per month; roughly −1% yearly if not very active.</li>
                                <li><strong>Very active scalpers:</strong> can be −5% to −15% monthly, sometimes more with wide spreads.</li>
                                <li><strong>Swing/position trading:</strong> usually &lt;1% yearly due to fewer trades.</li>
                            </ul>
                            <p>For active day trading (not extreme), a typical medium/long-term range is −2% to −5% of the portfolio. Values near −20% usually imply extremely high frequency trading or a costly broker.</p>
                        </div>
                    </div>
                </div>
            `);
            viewer.append(large);
            // Close on a single outside click (no need for mousedown gating)
            large.on('click', (e)=> {
                if (e.target === large[0]) {
                    try { e.stopPropagation(); e.preventDefault(); } catch(_e){}
                    large.remove();
                }
            });
            large.find('.btn-close').on('click', ()=> large.remove());
            const onEsc = (e) => { if (e.key === 'Escape') large.remove(); };
            $(document).on('keydown.costsHelpEsc', onEsc);
            large.on('remove', ()=> $(document).off('keydown.costsHelpEsc', onEsc));
        };
        // Bind title and help icon separately to avoid double-open when clicking the icon
        tile.find('.chart-title').css('cursor','pointer').on('click', openCostsHelp);
        tile.find('.help-icon').css('cursor','pointer').on('click', function(e){
            try { e.stopPropagation(); e.preventDefault(); } catch(_e){}
            openCostsHelp();
        });
    })();

    // Monte Carlo: generate quantile bands for 100 trials of next 100 trades using bootstrapped returns
    const trials = 300; const steps = Math.min(150, Math.max(30, positions.length));
    const mcPaths = [];
    for (let t=0;t<trials;t++) {
        let val = equityPoints[equityPoints.length-1].value;
        const path=[];
        for (let s=0;s<steps;s++) {
            const inc = profits.length ? profits[Math.floor(Math.random()*profits.length)] : 0;
            val += inc;
            path.push(val);
        }
        mcPaths.push(path);
    }
    // Compute quantiles per step
    function quantile(arr, q){ const a=arr.slice().sort((x,y)=>x-y); const pos=(a.length-1)*q; const base=Math.floor(pos); const rest=pos-base; return a[base] + (a[base+1]!==undefined?rest*(a[base+1]-a[base]):0); }
    const q05=[], q50=[], q95=[];
    const startFuture = equityPoints.length ? equityPoints[equityPoints.length - 1].time : Math.floor(Date.now()/1000);
    for (let s=0;s<steps;s++) {
        const vals = mcPaths.map(p=>p[s]);
        const t = startFuture + (s+1)*86400; // daily step after last entry time
        q05.push({ time: t, value: quantile(vals, 0.05) });
        q50.push({ time: t, value: quantile(vals, 0.50) });
        q95.push({ time: t, value: quantile(vals, 0.95) });
    }
    const mcSeries = [
        { type:'area', data: equityPoints, options:{ lineColor:'#21c77d', topColor:'rgba(33,199,125,0.1)', bottomColor:'rgba(33,199,125,0.0)', lastValueVisible:true, priceLineVisible:true }},
    // Overlays: run-up (MFE for non-winners) and drawdown (MAE for non-losers)
    { type:'line', data: runUpPoints, options:{ color:'#4cc9f0', lineWidth:1, lineStyle:2, crosshairMarkerVisible:false } },
        { type:'line', data: drawDownPoints, options:{ color:'#ff5c7c', lineWidth:1, lineStyle:2, crosshairMarkerVisible:false } },
        { type:'line', data: q05, options:{ color:'#ff5c7c', lineWidth:1, crosshairMarkerVisible:false } },
        { type:'line', data: q50, options:{ color:'#cccccc', lineWidth:2, crosshairMarkerVisible:false } },
        { type:'line', data: q95, options:{ color:'#5af04cff', lineWidth:1, crosshairMarkerVisible:false } },
    ];
    // Render Monte Carlo as main chart
    makeChart($('#ebt-chart-montecarlo-main')[0], mcSeries);

    // Build hypothetical equity given a multiplier k and mode ('sl' or 'tp')
    function buildHypotheticalEquity(k, mode) {
        let eq = L.session.capital;
        const out = [];
        if (!positions.length) return out;
        // seed with first point time to align with original
        let seedTime = equityPoints.length ? equityPoints[0].time : null;
        if (seedTime != null) out.push({ time: seedTime, value: eq });
        let lastT = seedTime;
        for (let i=0;i<positions.length;i++) {
            const p = positions[i];
            const sec = toSec(p.entryTime || p.exitTime);
            if (!Number.isFinite(sec)) continue; // keep alignment with realized equity construction
            const t = (lastT != null && sec <= lastT) ? lastT + 1 : sec;
            const base = Number(p.getProfit && p.getProfit(true)) || 0;
            const risk = Number(p.getRisk && p.getRisk(true)) || 0;
            // cost proportional to lots
            let qty = 0; try { qty = Number(p && p.getQuantity ? p.getQuantity(false, true) : p && p.quantity); } catch(_e) { qty = Number(p && p.quantity); }
            const lots = Math.abs(qty) || 0;
            let adj = base - (perLotCost * lots); // default: realized minus per-lot cost
            if (Number.isFinite(risk) && risk > 0) {
                if (mode === 'sl') {
                    // Normalize monetary risk: sizeFactor = 1/k. If MAE >= k*risk => loser at -risk; else winner at TP profit scaled by sizeFactor.
                    const dd = p.getVirtualDrawDown(true); // negative (MAE in currency)
                    const mae = Number.isFinite(dd) ? Math.max(0, -dd) : 0; // positive currency
                    const thresh = k * risk;
                    const sizeFactor = k > 0 ? (1 / k) : 1;
                    const newLots = lots * sizeFactor;
                    if (mae >= thresh) {
                        // loser: fixed monetary risk
                        adj = (-risk) - (perLotCost * newLots);
                    } else {
                        // winner: assume original TP hit, profit scales with sizeFactor
                        const tpPrice = (p.targetPrice && p.targetPrice(undefined, true, 0));
                        if (Number.isFinite(tpPrice)) {
                            const tpProfit = p.getOriginalTPProfit();
                            if (Number.isFinite(tpProfit)) {
                                adj = (tpProfit * sizeFactor) - (perLotCost * newLots);
                            } else {
                                adj = (base * sizeFactor) - (perLotCost * newLots);
                            }
                        } else {
                            adj = (base * sizeFactor) - (perLotCost * newLots);
                        }
                    }
                } else if (mode === 'tp') {
                    const tpCur = p.getOriginalTPProfit();
                    const mfe = p.getVirtualRunUp(true) || 0; // currency
                    if (Number.isFinite(tpCur) && tpCur > 0) {
                        const need = k * tpCur;
                        if (mfe >= need) {
                            adj = need - (perLotCost * lots);
                        } else {
                            adj = -risk - (perLotCost * lots);
                        }
                    }
                }
            }
            eq += adj;
            out.push({ time: t, value: eq });
            lastT = t;
        }
        return out;
    }


    // Embedded enlarged view overlay inside the stats viewer
    const openLarge = (title, defSeries, opts) => {
                const options = Object.assign({ showForecast: true, extraBottom: 0, renderBottomControls: null }, opts||{});
                const large = $(`
                    <div class="stats-large-overlay" style="position:absolute; inset:0; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display:flex; align-items:center; justify-content:center; z-index:149;">
                            <div style="position:relative; width: min(1200px, 95%); height: min(80%, 700px); background: var(--tv-color-platform-background,var(--color-popup-background, #0c0e12)); border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:8px;">
                                <div style="position:absolute; top:8px; left:12px; right:12px; display:flex; align-items:center; gap:8px;">
                                    <div class="chart-title-text" style="font-weight:600;">${title}</div>
                                    <div style="flex:1"></div>
                                    ${(String(title).toLowerCase().includes('overall') && options.showForecast) ? `
                                    <button class="lightButton xsmall typography-regular14px btn-randomize" title="Forecast the overall performance considering ±20% variance in trade results" style="cursor:pointer;">Forecast</button>
                                    ` : ''}
                                </div>
                                <div class="chart-host" style="position:absolute; inset:36px 8px 8px 8px;"></div>
                                <div class="bottom-controls" style="position:absolute; left:8px; right:8px; bottom:8px; height:0; display:none;"></div>
                            </div>
                        </div>
                `);
        viewer.append(large);
    const container = large.find('.chart-host')[0];
        const bottomHost = large.find('.bottom-controls');
        if (options.extraBottom && options.extraBottom > 0) {
            try {
                const host = large.find('.chart-host');
                const bottomPad = 8 + options.extraBottom;
                host.css('inset', `36px 8px ${bottomPad}px 8px`);
                bottomHost.css({ display:'block', height: `${options.extraBottom}px` });
            } catch(_e) { /* ignore */ }
        }
        const rect = container.getBoundingClientRect();
        const pbLarge = parseFloat(getComputedStyle(container).paddingBottom||'0') || 0;
        const baseOpts = {
            width: rect.width,
            height: Math.max(0, rect.height - pbLarge),
            layout:{ background:{ type:'solid', color:'transparent' }, textColor:'#d1d4dc' },
            grid: { vertLines: { visible: false }, horzLines: { visible: false } },
            leftPriceScale: { visible: false },
            rightPriceScale:{ borderVisible:false },
            timeScale:{ borderVisible:false }
        };
        
        // If this is the Weekday chart, set axis formatters at creation time
        if (typeof title === 'string' && title.toLowerCase().includes('weekday')) {
            baseOpts.timeScale.tickMarkFormatter = (time) => {
                let sec;
                if (typeof time === 'number') sec = time; else if (time && typeof time === 'object') {
                    if (typeof time.timestamp === 'number') sec = time.timestamp;
                    else if (typeof time.year === 'number') sec = Math.floor(Date.UTC(time.year, (time.month||1)-1, time.day||1)/1000);
                }
                if (!Number.isFinite(sec)) return '';
                const d = new Date(sec * 1000);
                return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
            };
            baseOpts.localization = {
                timeFormatter: (time) => {
                    const sec = typeof time === 'number' ? time : (time && typeof time.timestamp === 'number' ? time.timestamp : null);
                    if (!Number.isFinite(sec)) return '';
                    const d = new Date(sec * 1000);
                    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
                }
            };
        }
        // If this is the Hour chart, set axis formatters to show 0..23 hours
        if (typeof title === 'string' && title.toLowerCase().includes('hour')) {
            const fmtHour = (time) => {
                let sec;
                if (typeof time === 'number') sec = time; else if (time && typeof time === 'object') {
                    if (typeof time.timestamp === 'number') sec = time.timestamp;
                }
                if (!Number.isFinite(sec)) return '';
                const h = ((sec / 3600) | 0) % 24;
                return String(h).padStart(2,'0');
            };
            baseOpts.timeScale.tickMarkFormatter = (t) => fmtHour(t);
            baseOpts.localization = {
                timeFormatter: (t) => `${fmtHour(t)}:00`
            };
        }
        const chart = createChart(container, baseOpts);
        const seriesRefs = [];
        // If caller provided an initialRange, apply it; else attempt a smart fitRange based on provided series
        try {
            if (options.initialRange && options.initialRange.from && options.initialRange.to) {
                chart.timeScale().setVisibleRange({ from: options.initialRange.from, to: options.initialRange.to });
            } else if (Array.isArray(defSeries) && defSeries.length && Array.isArray(defSeries[0].data) && defSeries[0].data.length) {
                const d0 = defSeries[0].data;
                const from = d0[0].time; const to = d0[d0.length-1].time;
                if (from && to) chart.timeScale().setVisibleRange({ from, to });
            }
        } catch(_e) { /* ignore */ }
    const isOverall = String(title).toLowerCase().includes('overall');
        let area0 = null;
        let original = [];
    if (isOverall) {
            // Create our own primary area series first and keep a reference
            original = (defSeries[0] && defSeries[0].data) ? defSeries[0].data.slice() : [];
            const firstOpts = Object.assign({ lastValueVisible:true, priceLineVisible:true }, (defSeries[0] && defSeries[0].options) || { lineColor:'#21c77d', topColor:'rgba(33,199,125,0.1)', bottomColor:'rgba(33,199,125,0.0)' });
            area0 = chart.addAreaSeries(firstOpts);
            area0.setData(original);
            seriesRefs.push(area0);
            // Add the rest of series (e.g., quantile lines) after
            for (let i=1;i<defSeries.length;i++){
                const s = defSeries[i];
                let base = Object.assign({}, s.options || {}, { lastValueVisible: false, priceLineVisible: false });
                let series;
                if (s.type === 'area') series = chart.addAreaSeries(base);
                else if (s.type === 'histogram') series = chart.addHistogramSeries(base);
                else series = chart.addLineSeries(base);
                series.setData(s.data||[]);
                seriesRefs.push(series);
            }
        } else {
            // Default path: add all provided series
            for (const s of defSeries) {
                let base = Object.assign({}, s.options || {});
                if (!Object.prototype.hasOwnProperty.call(base, 'lastValueVisible')) base.lastValueVisible = false;
                if (!Object.prototype.hasOwnProperty.call(base, 'priceLineVisible')) base.priceLineVisible = false;
                let series;
                if (s.type === 'area') series = chart.addAreaSeries(base);
                else if (s.type === 'histogram') series = chart.addHistogramSeries(base);
                else series = chart.addLineSeries(base);
                series.setData(s.data||[]);
                seriesRefs.push(series);
            }
        }
        chart.timeScale().fitContent();
        // If Overall Performance large view, zoom to equity plus just the start of the forecast
        try {
            if (isOverall && original && original.length > 1) {
                const from = original[0].time;
                const lastEq = original[original.length - 1].time;
                // scan defSeries (excluding primary) for earliest future point and step
                let firstFuture = Infinity;
                let step = NaN;
                for (let i = 1; i < defSeries.length; i++) {
                    const d = defSeries[i].data || [];
                    for (let j = 0; j < d.length; j++) {
                        const t = d[j].time;
                        if (t > lastEq) {
                            if (t < firstFuture) {
                                firstFuture = t;
                                if (j + 1 < d.length) {
                                    const t2 = d[j + 1].time;
                                    if (Number.isFinite(t2)) step = t2 - t;
                                }
                            }
                            break;
                        }
                    }
                }
                if (Number.isFinite(from) && Number.isFinite(lastEq) && Number.isFinite(firstFuture) && firstFuture !== Infinity) {
                    if (!Number.isFinite(step) || step <= 0) step = Math.max(1, firstFuture - lastEq);
                    const to = lastEq + step * 3; // include only first ~3 forecast steps
                    chart.timeScale().setVisibleRange({ from, to });
                }
            }
        } catch(_e) { /* ignore */ }
        // Apply optional initial visible range (safe zoom-in for highlighted windows)
        if (options.initialRange && Number.isFinite(options.initialRange.from) && Number.isFinite(options.initialRange.to)) {
            try { chart.timeScale().setVisibleRange({ from: options.initialRange.from, to: options.initialRange.to }); } catch(_e) { /* ignore */ }
        }
    // If Overall Performance, wire Randomize/Reset to our primary series reference
        if (isOverall && area0 && options.showForecast) {
            const btnRand = large.find('.btn-randomize');
            // Helper: build randomized equity path using closed trades shuffled and ±20% variance; preserve spacing after last point in 1-day steps
            const buildRandomized = () => {
                // Shuffle
                for (let i=profits.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const tmp=profits[i]; profits[i]=profits[j]; profits[j]=tmp; }
                // Apply ±20% variance
                const varied = profits.map(v=> v * (0.8 + Math.random()*0.4));
                // Start from last known equity/time from the original path
                const base = original.slice();
                const last = base.length ? base[base.length-1] : { time: Math.floor(Date.now()/1000), value: (L.session ? L.session.capital : 0) };
                let val = last.value;
                const out = base.slice();
                const step = 86400; // 1 day
                for (let k=0;k<varied.length;k++){
                    val += varied[k];
                    const t = last.time + (k+1)*step;
                    out.push({ time: t, value: val });
                }
                return out;
            };
            btnRand.on('click', ()=>{
                const randData = buildRandomized();
                area0.setData(randData);
                chart.timeScale().fitContent();
                // After randomize, apply the same partial-forecast zoom
                try {
                    const from = randData.length ? randData[0].time : null;
                    const lastEq = randData.length ? randData[randData.length - 1].time : null;
                    let firstFuture = Infinity;
                    let step = NaN;
                    for (let i = 1; i < defSeries.length; i++) {
                        const d = defSeries[i].data || [];
                        for (let j = 0; j < d.length; j++) {
                            const t = d[j].time;
                            if (Number.isFinite(lastEq) && t > lastEq) {
                                if (t < firstFuture) {
                                    firstFuture = t;
                                    if (j + 1 < d.length) {
                                        const t2 = d[j + 1].time;
                                        if (Number.isFinite(t2)) step = t2 - t;
                                    }
                                }
                                break;
                            }
                        }
                    }
                    if (Number.isFinite(from) && Number.isFinite(lastEq) && Number.isFinite(firstFuture) && firstFuture !== Infinity) {
                        if (!Number.isFinite(step) || step <= 0) step = Math.max(1, firstFuture - lastEq);
                        const to = lastEq + step * 3;
                        chart.timeScale().setVisibleRange({ from, to });
                    }
                } catch(_e) { /* ignore */ }
            });
        }
    // Close only when clicking on the backdrop itself, or pressing Esc
    let largeDownOnBackdrop = false;
    large.on('mousedown', (e)=> { largeDownOnBackdrop = (e.target === large[0]); });
    large.on('click', (e)=> { if (e.target === large[0] && largeDownOnBackdrop) large.remove(); });
    const onLargeEsc = (e) => { if (e.key === 'Escape') large.remove(); };
    $(document).on('keydown.statsLargeEsc', onLargeEsc);
    large.on('remove', ()=> $(document).off('keydown.statsLargeEsc', onLargeEsc));
        const onResize = () => {
            const r = container.getBoundingClientRect();
            const pb = parseFloat(getComputedStyle(container).paddingBottom||'0') || 0;
            chart.applyOptions({ width: r.width, height: Math.max(0, r.height - pb) });
        };
        window.addEventListener('resize', onResize);
        large.on('remove', ()=> window.removeEventListener('resize', onResize));
        // Manual resize for enlarged window removed per requirements; window scales responsively.
        // If caller wants to render bottom controls, allow it now
        try {
            if (typeof options.renderBottomControls === 'function' && options.extraBottom > 0) {
                options.renderBottomControls(large, chart, seriesRefs, bottomHost);
            }
        } catch(_e) { /* ignore */ }
        // Return references for further customization if needed
        return { root: large, chart, seriesRefs };
    };

    // Open buttons
    // Clickable titles open enlarged views
    viewer.find('#ebt-chart-weekday .chart-title').on('click', ()=> openLarge('Performance by Weekday', weekdaySeries));
    viewer.find('#ebt-chart-hour .chart-title').on('click', ()=> openLarge('Performance by Hour', hourlySeries));
    viewer.find('#ebt-chart-daily .chart-title').on('click', ()=> openLarge(`Daily Profit — ${wrDaily.pct}% (${wrDaily.pos}/${wrDaily.total})`, dailySeries));
    viewer.find('#ebt-chart-weekly .chart-title').on('click', ()=> openLarge(`Weekly Profit — ${wrWeekly.pct}% (${wrWeekly.pos}/${wrWeekly.total})`, weeklySeries));
    viewer.find('#ebt-chart-monthly .chart-title').on('click', ()=> openLarge(`Monthly Profit — ${wrMonthly.pct}% (${wrMonthly.pos}/${wrMonthly.total})`, monthlySeries));
    viewer.find('#ebt-chart-montecarlo-main .chart-title').on('click', ()=> openLarge('Overall Performance', mcSeries));
    viewer.find('#ebt-chart-trades-week .chart-title').on('click', ()=> openLarge('Trades per Week', weeklyTradesSeries));

    // Bind clicks on metric tiles to open progression charts
    viewer.find('.metric-winrate').off('click').on('click', ()=> openLarge('Winrate progression (%)', wrSeries, { showForecast:false }));
    viewer.find('.metric-profit-factor').off('click').on('click', ()=> openLarge('Profit factor progression', pfSeries, { showForecast:false }));
    viewer.find('.metric-avg-rr').off('click').on('click', ()=> openLarge('Average R:R progression', rrSeries, { showForecast:false }));
    viewer.find('.metric-sharpe').off('click').on('click', ()=> openLarge('Sharpe ratio progression', sharpeSeries, { showForecast:false }));
    viewer.find('.metric-avg-duration').off('click').on('click', ()=> openLarge('Avg trade duration progression (min)', avgDurSeries, { showForecast:false }));

    // BE trades hypothetical outcomes: what would've happened if BE wasn't set
    viewer.find('.metric-be-trades').off('click').on('click', () => {
        const beTrades = positions.filter(p => p.exitTime && p.isBreakEven());
        if (!beTrades.length) { L.toast('No BE trades found'); return; }

        // Calculate hypothetical outcome for each BE trade
        // Logic: if maxDrawdown < initial risk → would've hit SL (loss)
        //        else if maxRunup > initial target → would've hit TP (win)
        //        else → 0 (inconclusive)
        const results = { wouldWin: [], wouldLose: [], inconclusive: [] };
        let hypoProfit = 0, hypoWins = 0, hypoLosses = 0;

        for (const p of beTrades) {
            const risk = p.getRisk(true) || 0;
            const runup = p.getVirtualRunUp(true);   // MFE, positive value
            const dd = p.getVirtualDrawDown(true); // MAE, negative value
            const drawdown = Math.abs(dd);  // convert to positive for comparison
            const targetProfit = p.getOriginalTPProfit();

            let outcome = 'inconclusive', hypo = 0;
            if (Number.isFinite(risk) && risk > 0 && drawdown >= risk) {
                // Drawdown hit or exceeded risk → would've hit SL
                outcome = 'loss';
                hypo = -risk;
                hypoLosses++;
            } else if (Number.isFinite(targetProfit) && targetProfit > 0 && runup >= targetProfit) {
                // Runup hit or exceeded target → would've hit TP
                outcome = 'win';
                hypo = targetProfit;
                hypoWins++;
            }
            // else: inconclusive (neither SL nor TP was hit)

            hypoProfit += hypo;
            const item = { position: p, risk, runup, drawdown, targetProfit, outcome, hypo };
            if (outcome === 'win') results.wouldWin.push(item);
            else if (outcome === 'loss') results.wouldLose.push(item);
            else results.inconclusive.push(item);
        }

        // Build popup content
        const currency = L.session.currencyId || '';
        const popupHtml = `
            <div style="padding:16px; font-family:sans-serif; color:var(--tv-color-pane-text,#d1d4dc);">
                <h2 style="margin:0 0 16px 0; font-size:1.3em;">BE Trades: Hypothetical Outcomes</h2>
                <p style="opacity:.8; margin-bottom:16px;">What would have happened if BE (break-even stop) wasn't set?</p>
                
                <div style="display:flex; gap:16px; margin-bottom:20px;">
                    <div style="flex:1; padding:12px; background:rgba(0,200,83,.1); border-radius:6px; text-align:center;">
                        <div style="font-size:24px; color:#00C853;">${hypoWins}</div>
                        <div style="opacity:.7; font-size:12px;">Would've Won</div>
                    </div>
                    <div style="flex:1; padding:12px; background:rgba(244,67,54,.1); border-radius:6px; text-align:center;">
                        <div style="font-size:24px; color:#F44336;">${hypoLosses}</div>
                        <div style="opacity:.7; font-size:12px;">Would've Lost</div>
                    </div>
                    <div style="flex:1; padding:12px; background:rgba(255,255,255,.05); border-radius:6px; text-align:center;">
                        <div style="font-size:24px;">${results.inconclusive.length}</div>
                        <div style="opacity:.7; font-size:12px;">Inconclusive</div>
                    </div>
                </div>

                <div style="padding:12px; background:rgba(255,255,255,.05); border-radius:6px; margin-bottom:16px;">
                    <div style="font-size:14px; opacity:.8;">Potential extra P&L:</div>
                    <div style="font-size:20px; margin-top: 8px; color:${hypoProfit >= 0 ? '#00C853' : '#F44336'};">${hypoProfit >= 0 ? '+' : ''}${hypoProfit.toFixed(2)} ${currency}</div>
                </div>

                <details style="margin-bottom:12px;" ${results.wouldWin.length ? 'open' : ''}>
                    <summary style="cursor:pointer; padding:8px; background:rgba(0,200,83,.1); border-radius:4px;">
                        <span style="color:#00C853;">Would've Won (${results.wouldWin.length})</span>
                    </summary>
                    <div style="max-height:150px; overflow-y:auto; font-size:12px; padding:8px;">
                        ${results.wouldWin.length ? results.wouldWin.map(r => `
                            <div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,.1);">
                                ${L.toTradingViewDateTimeFormat(r.position.entryTime)} — Target: ${r.targetProfit?.toFixed(2)||'?'} ${currency}, MFE: ${r.runup.toFixed(2)} ${currency}
                            </div>
                        `).join('') : '<div style="opacity:.5;">None</div>'}
                    </div>
                </details>

                <details style="margin-bottom:12px;" ${results.wouldLose.length ? 'open' : ''}>
                    <summary style="cursor:pointer; padding:8px; background:rgba(244,67,54,.1); border-radius:4px;">
                        <span style="color:#F44336;">Would've Lost (${results.wouldLose.length})</span>
                    </summary>
                    <div style="max-height:150px; overflow-y:auto; font-size:12px; padding:8px;">
                        ${results.wouldLose.length ? results.wouldLose.map(r => `
                            <div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,.1);">
                                ${L.toTradingViewDateTimeFormat(r.position.entryTime)} — Risk: ${r.risk.toFixed(2)} ${currency}, MAE: ${r.drawdown.toFixed(2)} ${currency}
                            </div>
                        `).join('') : '<div style="opacity:.5;">None</div>'}
                    </div>
                </details>

                <details>
                    <summary style="cursor:pointer; padding:8px; background:rgba(255,255,255,.05); border-radius:4px;">
                        Inconclusive (${results.inconclusive.length})
                    </summary>
                    <div style="max-height:150px; overflow-y:auto; font-size:12px; padding:8px; opacity:.7;">
                        ${results.inconclusive.length ? results.inconclusive.map(r => `
                            <div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,.1);">
                                ${L.toTradingViewDateTimeFormat(r.position.entryTime)} — Risk: ${r.risk.toFixed(2)}, Target: ${r.targetProfit?.toFixed(2)||'?'}, MAE: ${r.drawdown.toFixed(2)}, MFE: ${r.runup.toFixed(2)}
                            </div>
                        `).join('') : '<div style="opacity:.5;">None</div>'}
                    </div>
                </details>

                <div style="margin-top:16px; font-size:11px; opacity:.6;">
                    Logic: If MAE ≥ Risk → would've hit SL (loss). Else if MFE ≥ Target → would've hit TP (win). Otherwise inconclusive.
                </div>
            </div>
        `;

        // Create popup
        const popup = $(`<div class="ebt-be-popup" style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:100000; background:var(--tv-color-pane-background,#1e222d); border:1px solid var(--tv-color-line-divider,#2a2e39); border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,.5); max-width:500px; min-width:350px;"></div>`);
        popup.html(popupHtml);

        // Close on backdrop click
        const backdrop = $('<div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,.5); z-index:99999;"></div>');
        backdrop.on('click', () => { backdrop.remove(); popup.remove(); });

        $('body').append(backdrop).append(popup);
    });

    // Clickable Optimal SL/TP tiles open comparison chart (actual vs would-be)
    const openComparison = (title, k, mode) => {
        const computeHypoAndStats = (kk) => {
            const hypo = buildHypotheticalEquity(kk, mode);
            let baseline = 0, hypothetical = 0, hits = 0;
            for (const p of positions) {
                const base = p.getProfit(true);
                let qty = 0; try { qty = Number(p && p.getQuantity ? p.getQuantity(false, true) : p && p.quantity); } catch(_e) { qty = Number(p && p.quantity); }
                const lots = Math.abs(qty) || 0;
                const risk = Number(p.getRisk && p.getRisk(true)) || 0;
                baseline += (base - (perLotCost * lots));
                if (!(Number.isFinite(risk) && risk > 0)) { hypothetical += (base - (perLotCost * lots)); continue; }
                if (mode === 'sl') {
                    const dd = p.getVirtualDrawDown(true);
                    const mae = Number.isFinite(dd) ? Math.max(0, -dd) : 0;
                    const sizeFactor = kk > 0 ? (1/kk) : 1;
                    const newLots = lots * sizeFactor;
                    if (mae >= kk * risk) {
                        // loser: fixed monetary risk
                        hypothetical += (-risk) - (perLotCost * newLots);
                    } else {
                        // winner: assume original TP hit; profit scales with size factor
                        const tpPrice = (p.targetPrice && p.targetPrice(undefined, true, 0));
                        if (Number.isFinite(tpPrice)) {
                            const tpProfit = p.getOriginalTPProfit();
                            if (Number.isFinite(tpProfit)) {
                                hypothetical += (tpProfit * sizeFactor) - (perLotCost * newLots);
                            } else {
                                hypothetical += (base * sizeFactor) - (perLotCost * newLots);
                            }
                        } else {
                            hypothetical += (base * sizeFactor) - (perLotCost * newLots);
                        }
                        hits++;
                    }
                } else {
                    const tpCur = p.getOriginalTPProfit();
                    const mfe = p.getVirtualRunUp(true) || 0;
                    if (Number.isFinite(tpCur) && tpCur > 0) {
                        const need = kk * tpCur;
                        if (mfe >= need) {
                            hypothetical += need - (perLotCost * lots);
                            hits++;
                        } else {
                            hypothetical += -risk - (perLotCost * lots);
                        }
                    } else {
                        hypothetical += base - (perLotCost * lots);
                    }
                }
            }
            const delta = hypothetical - baseline;
            const denom = Math.abs(baseline) > 1e-9 ? Math.abs(baseline) : 1;
            const dPct = (delta / denom) * 100;
            const labelHits = 'TP hits';
            const extra = ` <span style="opacity:.8; font-weight:400;">• ${labelHits} ${hits}/${positions.length} • Δ ${(delta>=0?'+':'')}${delta.toFixed(2)} ${L.session.currencyId||''} (${dPct>=0?'+':''}${dPct.toFixed(1)}%)</span>`;
            return { hypo, titleExtra: extra };
        };

        const initial = computeHypoAndStats(k);
        const baseTitle = title;
        const seriesDef = [
            { type:'area', data: equityPoints, options:{ lineColor:'#21c77d', topColor:'rgba(33,199,125,0.1)', bottomColor:'rgba(33,199,125,0.0)'}},
            { type:'line', data: initial.hypo, options:{ color: mode==='sl' ? '#ff9f38' : '#4cc9f0', lineWidth:2, crosshairMarkerVisible:false }}
        ];
        const api = openLarge(baseTitle + initial.titleExtra, seriesDef, {
            showForecast: false,
            extraBottom: 56,
            renderBottomControls: (large, chart, seriesRefs, $bottom) => {
                const bottom = ($bottom && $bottom.length ? $bottom : $(large).find('.bottom-controls'));
                const valueFmt = (v)=> `${v.toFixed(1)}x${mode==='tp'?' (TP of original)':''}`;
                bottom.empty().append(`
                    <div style="display:flex; align-items:center; gap:12px; height:100%;">
                        <div style="opacity:.8; width:110px;">Adjust ${mode.toUpperCase()}:</div>
                        <input type="range" min="0.1" max="5" step="0.1" value="${k}" class="ebt-opt-slider" style="flex:1;" />
                        <div class="ebt-opt-slider-value" style="width:140px; text-align:right;">${valueFmt(k)}</div>
                    </div>
                `);
                const slider = bottom.find('.ebt-opt-slider');
                const label = bottom.find('.ebt-opt-slider-value');
                const titleEl = large.find('.chart-title-text');
                const update = (val) => {
                    const kk = Math.max(0.1, Math.min(5, Number(val)||k));
                    label.text(valueFmt(kk));
                    const res = computeHypoAndStats(kk);
                    // update title
                    titleEl.html(baseTitle + res.titleExtra);
                    // update hypothetical line (seriesRefs[1])
                    const s = seriesRefs && seriesRefs[1];
                    if (s && s.setData) s.setData(res.hypo);
                };
                slider.on('input', function(){ update(this.value); });
                slider.on('change', function(){ update(this.value); });
            }
        });
        return api;
    };
    if (Number.isFinite(optSL)) {
        viewer.find('.metric-opt-sl').on('click', ()=> openComparison(`Overall Performance vs Optimal SL (${(optSL *100).toFixed(0)}%)`, optSL, 'sl'));
    }
    if (Number.isFinite(optTP)) {
        viewer.find('.metric-opt-tp').on('click', ()=> openComparison(`Overall Performance vs Optimal TP (${(optTP*100).toFixed(0)}% of original)`, optTP, 'tp'));
    }

    // Expectancy progression: cumulative average profit/trade over time
    viewer.find('.metric-expectancy').off('click').on('click', () => {
        // Build progression by trade close time (or entry if exit missing)
        let cum = 0;
        const series = [];
        const toSec = (t) => {
            if (!t) return null;
            if (typeof t === 'number') {
                if (t > 1e12) return Math.floor(t / 1000);
                if (t > 1e9) return Math.floor(t);
                return Math.floor(t / 1000);
            }
            const d = new Date(t); const ms = d.getTime();
            return Number.isFinite(ms) ? Math.floor(ms/1000) : null;
        };
        for (let i=0;i<positions.length;i++) {
            const p = positions[i];
            const t = toSec(p.exitTime || p.entryTime);
            cum += p.getProfit(true, perLotCost);
            const avg = cum / (i+1);
            if (Number.isFinite(t)) series.push({ time: t, value: avg });
        }
        if (!series.length) return;
        const seriesDef = [
            { type:'line', data: clampToPercentile(series), options:{ color:'#ffd166', lineWidth:2, crosshairMarkerVisible:false } }
        ];
        const initialRange = { from: series[0].time, to: series[series.length-1].time };
        openLarge('Expectancy over time (avg profit per trade)', seriesDef, { showForecast:false, initialRange });
    });

    // Drawdown helpers and metrics: Max Drawdown window and Longest time underwater
    // Uses same logic as L.stats.computeMaxDrawdown - includes intra-trade drawdown (MAE)
    function _findMaxDrawdownWindow(equityPts, drawDownPts, maxDDPercent) {
        // Kadane-like scan considering intra-trade drawdown
        if (!equityPts || equityPts.length < 2) return null;
        const useDDPoints = drawDownPts && drawDownPts.length === equityPts.length;
        let peakVal = equityPts[0].value;
        let peakIdx = 0;
        let maxDrop = 0;
        let troughIdx = 0;
        let peakIdxForMax = 0;
        for (let i = 1; i < equityPts.length; i++) {
            const equity = equityPts[i].value;
            // Intra-trade drawdown: ddPoint.value represents equity at worst point during trade
            const ddVal = useDDPoints ? drawDownPts[i].value : equity;
            // Check drawdown from peak using intra-trade low
            const dropFromPeak = peakVal - ddVal;
            if (dropFromPeak > maxDrop) {
                maxDrop = dropFromPeak;
                troughIdx = i;
                peakIdxForMax = peakIdx;
            }
            // Update peak based on realized equity (after trade closes)
            if (equity > peakVal) {
                peakVal = equity;
                peakIdx = i;
            }
        }
        if (maxDrop <= 0) return null;
        const peak = equityPts[peakIdxForMax];
        const trough = useDDPoints ? drawDownPts[troughIdx] : equityPts[troughIdx];
        // Use the pre-computed percentage from L.stats.computeMaxDrawdown for consistency
        const pct = typeof maxDDPercent === 'number' ? -maxDDPercent : (peak.value > 0 ? (maxDrop / peak.value) * 100 : 0);
        return { peakIdx: peakIdxForMax, troughIdx, peak, trough, amount: maxDrop, percent: pct };
    }

    function _findLongestUnderwaterPeriod(points) {
        if (!points || points.length < 2) return null;
        let athVal = points[0].value;
        let athIdx = 0;
        let uwStartIdx = null; // start at peak index when entering underwater
        let best = { duration: 0, startIdx: null, endIdx: null };
        for (let i=1;i<points.length;i++) {
            const v = points[i].value;
            if (v > athVal) {
                // recovered only when price STRICTLY exceeds prior ATH
                if (uwStartIdx !== null) {
                    const dur = points[i].time - points[uwStartIdx].time;
                    if (dur > best.duration) best = { duration: dur, startIdx: uwStartIdx, endIdx: i };
                    uwStartIdx = null;
                }
                // Update ATH only on strict increase
                athVal = v;
                athIdx = i;
            } else {
                // v <= athVal → no new profit; enter/continue underwater if we've dipped below ATH at least once
                if (v < athVal && uwStartIdx === null) uwStartIdx = athIdx;
                // If v === athVal and we're already underwater, keep it open (do not close or shift ATH)
            }
        }
        // If still underwater at the end, consider open drawdown
        if (uwStartIdx !== null) {
            const lastIdx = points.length - 1;
            const dur = points[lastIdx].time - points[uwStartIdx].time;
            if (dur > best.duration) best = { duration: dur, startIdx: uwStartIdx, endIdx: lastIdx };
        }
        if (best.startIdx === null) return null;
        return {
            startIdx: best.startIdx,
            endIdx: best.endIdx,
            start: points[best.startIdx],
            end: points[best.endIdx],
            durationSec: best.duration
        };
    }

    const ddWindow = _findMaxDrawdownWindow(equityPoints, drawDownPoints, maxDrawdownPercent);
    if (ddWindow) {
        // Click on Max drawdown metric opens the DD window chart
        viewer.find('.metric-max-dd').off('click').on('click', () => {
            const startIdx = Math.max(0, ddWindow.peakIdx - 30);
            const endIdx = Math.min(equityPoints.length - 1, ddWindow.troughIdx + 30);
            // Highlight the equity curve from peak to trough
            const highlight = equityPoints.slice(ddWindow.peakIdx, ddWindow.troughIdx + 1);
            const seriesDef = [
                // Full session for context
                { type:'area', data: equityPoints, options:{ lineColor:'#21c77d', topColor:'rgba(33,199,125,0.1)', bottomColor:'rgba(33,199,125,0.0)'}},
                // Highlight the DD window on equity curve
                { type:'line', data: highlight, options:{ color:'#ff5c7c', lineWidth:4, crosshairMarkerVisible:false, priceLineVisible:false, lastValueVisible:false } }
            ];
            const t = `Max Drawdown • ${ddWindow.percent.toFixed(1)}% (−${ddWindow.amount.toFixed(2)} ${L.session.currencyId||''})`;
            const initialRange = { from: equityPoints[startIdx].time, to: equityPoints[endIdx].time };
            openLarge(t, seriesDef, { showForecast:false, initialRange });
        });
    }

    // Max run-up popup (mirror of drawdown but trough->peak)
    // Uses runUpPoints already filtered to exclude BE trades' impact.
    (function(){
        // Build a run-up window using runUpPoints vs equityPoints: look for max difference from a trough to a later peak
        if (!runUpPoints || runUpPoints.length < 2) return;
        let troughIdx = 0; let troughVal = runUpPoints[0].value;
        let maxRise = 0; let peakIdx = 0; let troughIdxForMax = 0;
        for (let i=1;i<runUpPoints.length;i++) {
            const v = runUpPoints[i].value;
            if (v < troughVal) { troughVal = v; troughIdx = i; }
            const rise = v - troughVal;
            if (rise > maxRise) { maxRise = rise; peakIdx = i; troughIdxForMax = troughIdx; }
        }
        if (maxRise <= 0) return;
        const startIdx = Math.max(0, troughIdxForMax - 30);
        const endIdx = Math.min(equityPoints.length - 1, peakIdx + 30);
        const highlight = runUpPoints.slice(troughIdxForMax, peakIdx + 1);
        // Use pre-computed maxRunupPercent from L.stats.computeMaxRunup for consistency with metric
        const seriesDef = [
            // Full session for context
            { type:'area', data: equityPoints, options:{ lineColor:'#21c77d', topColor:'rgba(33,199,125,0.1)', bottomColor:'rgba(33,199,125,0.0)'}},
            // Highlight only the run-up window (using runUpPoints values)
            { type:'line', data: highlight, options:{ color:'#4cc9f0', lineWidth:4, crosshairMarkerVisible:false, priceLineVisible:false, lastValueVisible:false } }
        ];
        const t = `Max Run-up • ${maxRunupPercent.toFixed(1)}% (+${maxRunup.toFixed(2)} ${L.session.currencyId||''})`;
        const initialRange = { from: equityPoints[startIdx].time, to: equityPoints[endIdx].time };
        viewer.find('.metric-max-ru').off('click').on('click', () => openLarge(t, seriesDef, { showForecast:false, initialRange }));
    })();

    // Win/Loss streak popups: highlight ALL max-length streak segments on equity
    (function(){
        // Build per-trade timing from effectivePositions (excludes BE trades) to match streak detection
        const tradeTimes = [];
        for (const p of effectivePositions) {
            const entrySec = toSec(p.entryTime || p.exitTime);
            const exitSec = toSec(p.exitTime || p.entryTime);
            if (Number.isFinite(entrySec) || Number.isFinite(exitSec)) {
                tradeTimes.push({
                    entry: Number.isFinite(entrySec) ? entrySec : exitSec,
                    exit: Number.isFinite(exitSec) ? exitSec : entrySec,
                    profit: Number(p.getProfit(true, perLotCost))||0
                });
            }
        }
        if (!tradeTimes.length) return;
        // Collect all win/loss streak segments
        const segments = []; // { type:'win'|'loss', startIdx, endIdx, count }
        let wCount = 0, wStart = 0;
        let lCount = 0, lStart = 0;
        const flushWin = (i) => { if (wCount>0) { segments.push({ type:'win', startIdx:wStart, endIdx:i-1, count:wCount }); wCount=0; } };
        const flushLoss = (i) => { if (lCount>0) { segments.push({ type:'loss', startIdx:lStart, endIdx:i-1, count:lCount }); lCount=0; } };
        for (let i=0;i<tradeTimes.length;i++) {
            const profit = tradeTimes[i].profit;
            const isWin = profit > 0;
            const isLoss = profit < 0;
            if (isWin) {
                if (wCount===0) wStart=i; wCount++;
                flushLoss(i);
            } else if (isLoss) {
                if (lCount===0) lStart=i; lCount++;
                flushWin(i);
            } else {
                // Breakeven: terminate both
                flushWin(i); flushLoss(i);
            }
        }
        flushWin(tradeTimes.length); flushLoss(tradeTimes.length);
        const maxWin = segments.filter(s=>s.type==='win').reduce((m,s)=>Math.max(m,s.count), 0);
        const maxLoss = segments.filter(s=>s.type==='loss').reduce((m,s)=>Math.max(m,s.count), 0);
        const winSegs = segments.filter(s=>s.type==='win' && s.count===maxWin && s.count>=2);
        const lossSegs = segments.filter(s=>s.type==='loss' && s.count===maxLoss && s.count>=2);
        if (!winSegs.length && !lossSegs.length) return;
        // Map streak indices to equityPoints range helpers
        function findFirstIndexAtOrAfter(arr, t){
            let lo=0, hi=arr.length-1, ans=arr.length-1;
            while (lo<=hi) { const mid=(lo+hi)>>1; if (arr[mid].time>=t){ ans=mid; hi=mid-1; } else lo=mid+1; }
            return ans;
        }
        function findLastIndexAtOrBefore(arr, t){
            let lo=0, hi=arr.length-1, ans=0;
            while (lo<=hi) { const mid=(lo+hi)>>1; if (arr[mid].time<=t){ ans=mid; lo=mid+1; } else hi=mid-1; }
            return ans;
        }
        function openStreaks(title, streaks, color){
            if (!streaks || !streaks.length) return;
            // Build highlight series for each streak and compute overall range
            let minFrom = Infinity, maxTo = -Infinity;
            const highlightSeries = [];
            for (const s of streaks) {
                const startTime = tradeTimes[s.startIdx].entry || tradeTimes[s.startIdx].exit;
                const endTime = tradeTimes[s.endIdx].exit || tradeTimes[s.endIdx].entry;
                const hiStart = findFirstIndexAtOrAfter(equityPoints, startTime);
                const hiEnd = findLastIndexAtOrBefore(equityPoints, endTime);
                const seg = equityPoints.slice(hiStart, hiEnd+1);
                if (seg.length) {
                    highlightSeries.push({ type:'line', data: seg, options:{ color, lineWidth:4, crosshairMarkerVisible:false, priceLineVisible:false, lastValueVisible:false } });
                    minFrom = Math.min(minFrom, equityPoints[Math.max(0, hiStart-30)].time);
                    maxTo = Math.max(maxTo, equityPoints[Math.min(equityPoints.length-1, hiEnd+30)].time);
                }
            }
            if (!highlightSeries.length) return;
            const seriesDef = [
                { type:'area', data: equityPoints, options:{ lineColor:'#21c77d', topColor:'rgba(33,199,125,0.1)', bottomColor:'rgba(33,199,125,0.0)'}},
                ...highlightSeries
            ];
            const from = Number.isFinite(minFrom) ? minFrom : equityPoints[0].time;
            const to = Number.isFinite(maxTo) ? maxTo : equityPoints[equityPoints.length-1].time;
            openLarge(title, seriesDef, { showForecast:false, initialRange: { from, to } });
        }
        // Bind click handlers to open charts with ALL max-length streaks highlighted
        if (winSegs.length) viewer.find('.metric-win-streak').off('click').on('click', () => {
            openStreaks(`Win streak • ${maxWin} trades`, winSegs, '#ffd166');
        });
        if (lossSegs.length) viewer.find('.metric-loss-streak').off('click').on('click', () => {
            openStreaks(`Loss streak • ${maxLoss} trades`, lossSegs, '#ff5c7c');
        });
    })();

    // Insert "Max time in drawdown" tile (longest continuous underwater period), unconditional
    const uw = _findLongestUnderwaterPeriod(equityPoints);
    {
        const grid = viewer.find('.metrics-grid');
        const hasUw = !!uw;
        const endPoint = equityPoints[equityPoints.length - 1] || { time: 0 };
        const startDate = hasUw ? new Date(uw.start.time*1000).toISOString().slice(0,10) : new Date(endPoint.time*1000).toISOString().slice(0,10);
        const endDate = hasUw ? new Date(uw.end.time*1000).toISOString().slice(0,10) : new Date(endPoint.time*1000).toISOString().slice(0,10);
        const days = hasUw ? Math.max(0, Math.round(uw.durationSec/86400)) : 0;
        const tileHtml = `
            <div class="metric-uw-duration" style="grid-column: span 3; cursor:pointer;" title="Longest continuous time from a peak until equity recovers to that peak (time spent underwater).">
                <div style="opacity:0.7; font-size:12px;">Max time in drawdown</div>
                <div style="font-size:16px;">${days}d${hasUw ? ` • ${startDate} → ${endDate}` : ''}</div>
            </div>`;
    // Place it before Optimal SL tile if possible; otherwise append
    const optSlTile = grid.find('.metric-opt-sl').first();
    if (optSlTile.length) $(tileHtml).insertBefore(optSlTile); else grid.append($(tileHtml));
        // Click: open full equity chart; highlight if underwater exists (apply zoom range)
        viewer.find('.metric-uw-duration').off('click').on('click', () => {
            const hasRange = hasUw;
            const startIdx = hasRange ? Math.max(0, uw.startIdx - 30) : 0;
            const endIdx = hasRange ? Math.min(equityPoints.length - 1, uw.endIdx + 30) : equityPoints.length - 1;
            const highlight = hasRange ? equityPoints.slice(uw.startIdx, uw.endIdx + 1) : [];
            const t = hasRange ? `Max time in drawdown • ${days}d (${startDate} → ${endDate})` : `Max time in drawdown • 0d`;
            const seriesDef = [
                { type:'area', data: equityPoints, options:{ lineColor:'#21c77d', topColor:'rgba(33,199,125,0.1)', bottomColor:'rgba(33,199,125,0.0)'}},
                ...(hasRange ? [{ type:'line', data: highlight, options:{ color:'#ff5c7c', lineWidth:4, crosshairMarkerVisible:false, priceLineVisible:false, lastValueVisible:false } }] : [])
            ];
            const initialRange = { from: equityPoints[startIdx].time, to: equityPoints[endIdx].time };
            openLarge(t, seriesDef, { showForecast:false, initialRange });
        });
    }
};