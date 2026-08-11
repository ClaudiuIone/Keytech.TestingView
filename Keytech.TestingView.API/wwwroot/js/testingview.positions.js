L.openPosition = async function (position, shapeChartInfo, shape) {
    L.stopSkipping();
    const shapeDataSourceProperties = shape.lineDataSource().properties();

    if(!await L.trigger(L.events.onOpeningPosition)) {
        return;
    }

    position.symbol = await L.dataOps.getOrAddSymbol(shapeChartInfo.chart.symbol(), () => shapeChartInfo.chart.chartModel().mainSeries().symbolInfo());
    Object.defineProperty(position.symbol, 'meta', { value: {}, writable: true, enumerable: false });

    position.symbol.meta.contractSize = shapeDataSourceProperties.lotSize.value();
    position.symbol.meta.pointSize = (await L.getContractSize(position.symbol.symbolName, position.symbol.symbolType)).pointSize;

    position.entryCurrencyRate = shapeDataSourceProperties.entryPointCurrencyRate?.value();
    position.quantity = shapeDataSourceProperties.qty.value() / position.symbol.meta.contractSize * (shapeChartInfo.shapeInfo.name == 'long_position' ? 1 : -1);
    
    const stopPrice = shapeDataSourceProperties.stopPrice?.value();
    const risk = (position.entryPrice - stopPrice) * position.quantity * position.symbol.meta.contractSize * position.entryCurrencyRate * position.symbol.meta.pointSize;
    var shapeRisk;
    L.setPositionFunctions(position);

    if(!position.meta.isBrokerTrade) {
        shapeRisk = shapeDataSourceProperties.risk?.value();
        if(shapeDataSourceProperties.riskDisplayMode.value() == 'money') {
            shapeRisk = `${shapeRisk} ${shapeDataSourceProperties.currency.value()}`;
        } else {
            shapeRisk = `${shapeRisk}%`;
        }

        if(L.session.getParameter(L.sessionParameterIds.ConfirmEntries) == 'true' && !await new Promise((resolve) => {
            L.confirmBox(L.s(-6, -5) /* New trade */, `${L.r.s(4, 2, position.getDirection(), shapeRisk, position.getQuantity(true)) /* Are you sure you want to open this {0} position?<n><n>Risk: {1} ({2} lots) */}`, (answer) => {
                resolve(answer);
            });
        })) {
            return;
        }
    }

    position.meta.profit = 0;
    position.meta.trackVirtualRunUp = true;
    position.meta.trackVirtualDrawDown = true;
    position.meta.trackBeRunUp = false;
    position.meta.trackVirtualBeRunUp = false;

    position.meta.resolution = L.resolutionToSeconds(L.getCurrentReplayResolution());

    position.index = L.session.positions.length + 1;
    position.positionId = L.newGuid();

    if(!position.meta.isBrokerTrade) {
        L.syncShapeWithPosition(shape, position);
        const shapePoints = shape.getPoints();
        position.positionShapes = [{
            shapeId: shapeChartInfo.shapeInfo.id,
            name: shapeChartInfo.shapeInfo.name,
            stopPrice: stopPrice,
            targetPrice: shapeDataSourceProperties.targetPrice.value(),
            endTime: shapePoints[1].time,
        }];

        L.keepShapeInfoInSync(position, shape, shapeDataSourceProperties);
    }

    position.meta.initialBalance = L.session.meta.balance || L.session.capital;
    position.positionSnapshots = [];

    position.columnValue(L.r.s(1, -4) /* Symbol */, position.symbol.symbolName.split(":").slice(-1)[0], true);
    position.columnValue(L.r.s(2, -1) /* Run-up */, 0, true);
    position.columnValue(L.r.s(2, -2) /* Drawdown */, 0, true);
    position.columnValue(L.s(-7, -6) /* Virtual Run-up */, 0, true);
    position.columnValue(L.s(-7, -7) /* Virtual Drawdown */, 0, true);
    position.columnValue(L.r.s(2, -6) /* Analysis Time */, L.session.meta.analysisTimes.find(at => at.analysisDuration > 5)?.analysisTimespan || "00:00", true);

    if (position.quantity) {
        if(!position.meta.isBrokerTrade) {
            position.stopPrice(position.meta.currentStopPrice = position.getShape().stopPrice, true);
            position.targetPrice(position.meta.currentTargetPrice = position.getShape().targetPrice, true);
            position.risk(risk, true);
            try {
                const sl = position.stopPrice(undefined, true, 0);
                const tp = position.targetPrice(undefined, true, 0);
                const entry = position.entryPrice;
                if (entry != null && sl != null && tp != null && entry !== sl) {
                    const rr = Math.abs(tp - entry) / Math.abs(entry - sl);
                    if (Number.isFinite(rr)) {
                        position.columnValue(L.r.s(1, -6) /* RR */, Number(rr.toFixed(2)), true);
                    }
                }
            } catch(_e) { /* ignore RR init errors */ }
        }

        if(L.session.getParameter(L.sessionParameterIds.FirstTradeInfo) == L.s(0, 6) /* true */) {
            setTimeout(() => {
                L.messageBox(L.s(1, -3) /* Your first TestingView trade */, L.s(1, -4, shapeRisk, position.getQuantity(true)) /* Your new position has the risk quantity of {0} ({1} lots).<n><n>This can be adjusted from the Risk setting of the position's tool/drawing properties. */);
                L.session.setParameter(L.sessionParameterIds.FirstTradeInfo, 'false');
            }, 2000);
        } else  if (!L.isEbacktestingPanelOpen()) {
            if(L.session.getParameter(L.sessionParameterIds.AutoOpenPanel) == L.s(0, 6) /* true */) {
                setTimeout(() => {
                    $(L.s(1, -5) /* button[data-qa-id=replay_trading] */).click();
                    L.session.setParameter(L.sessionParameterIds.AutoOpenPanel, 'false');    
                }, 2000);
            } else {
                L.toast(L.s(1, -6, position.getDirection().toUpperCase()) /* {0} activated. You can open the TestingView panel to view and manage the position. */, 5000);
            }
        }

        await L.createLinesForPosition(position, shapeChartInfo.chart);

        L.session.positions.unshift(position);
        L.session.meta.positionsContainerLoadedPositions = L.session.meta.positionsContainerLoadedPositions ? L.session.meta.positionsContainerLoadedPositions + 1 : 1;
        L.addToPositionList(position, true);
        L.updateSessionCapitalInfo();

        await L.dataOps.createPosition(position);
        
        if (L.session.getParameter(L.sessionParameterIds.AutoSnapshot) == L.s(0, 6) /* true */) {
            L.takeSnapshot(position);
        }
    } else {
        L.toast(L.s(1, -7) /* Unable to open position: lot size cannot be set at this time */, 0, "warn");
        L.removeShapeById(position.getShape().shapeId, shapeChartInfo.chart);
    }
}

L.closePosition = async function (position, exitReason, chart) {
    L.stopSkipping();
    if (chart) {
        position.exitReason = exitReason;
        position.exitTime = position.exitTime || L.session.currentDate;

        const shape = L.getShapeById(position.getShape()?.shapeId, chart, true);
        if (shape) {
            L.syncShapeWithPosition(shape, position);
        }

        position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);
        L.updatePositionUI(position);

        L.session.equity -= position.getProfit(true);
        L.session.meta.balance += position.getProfit(true);

        if (position.meta.entryLineId) {
            L.removeShapeById(position.meta.entryLineId, chart);
        }
        if (position.meta.stopLineId) {
            L.removeShapeById(position.meta.stopLineId, chart);
        }
        if (position.meta.targetLineId) {
            L.removeShapeById(position.meta.targetLineId, chart);
        }
        if (position.meta.beLineId) {
            L.removeShapeById(position.meta.beLineId, chart);
        }

        L.updateSessionCapitalInfo();

        L.cache.delete(`getClosedPositions-${L.session.positions.length}-cost-${L.session.meta.stats.costPercent}`);
        L.cache.delete(`getEffectivePositions-${L.session.positions.length}-cost-${L.session.meta.stats.costPercent}`);
        L.cache.delete(`getStatsSummary-${L.session.positions.length}-cost-${L.session.meta.stats.costPercent}`);

        await L.dataOps.closePosition(position);
        L.dataOps.updateSession({ sessionId: L.session.sessionId, equity: L.session.equity}, true);
    }

    if (L.session.getParameter(L.sessionParameterIds.AutoSnapshot) == L.s(0, 6) /* true */) {
        L.takeSnapshot(position);
    }
}

L.setPositionFunctions = function (position) {
    if(!position.meta) {
        Object.defineProperty(position, 'meta', { value: {}, writable: true, enumerable: false });
    }

    position.getShape = function () {
        return position.positionShapes[0];
    };

    position.getColumn = function (columnName, sessionColumn) {
        if (!sessionColumn) {
            sessionColumn = L.session.sessionColumns.find(c => c.columnName == columnName);
        }
        if (!position.positionColumns) {
            position.positionColumns = [];
        }
        return position.positionColumns.find(c => c.columnId == sessionColumn?.columnId);
    }

    position.columnValue = function (columnName, value, dontStore) {
        const sessionColumn = L.session.sessionColumns.find(c => c.columnName == columnName);
        if(sessionColumn) {
            var positionColumn = position.getColumn(columnName, sessionColumn);

            if (value !== undefined) {
                if (!positionColumn) {
                    positionColumn = {
                        columnId: sessionColumn.columnId,
                        value: value
                    };
                    
                    Object.defineProperty(positionColumn, 'meta', { value: {}, writable: true, enumerable: false });
                    positionColumn.meta.columnName = sessionColumn.columnName;

                    position.positionColumns.push(positionColumn);
                }
                
                positionColumn.value = value;
                if (!dontStore) {
                    position.queueSetPositionColumn(positionColumn);
                }
            }

            return positionColumn?.value;
        }
    }

    position.queueSetPositionColumn = function (positionColumn) {
        position.meta.queuedPositionColumns = position.meta.queuedPositionColumns || {};
        position.meta.queuedPositionColumns[positionColumn.columnId] = positionColumn;
        clearTimeout(position.meta.queuedPositionColumnsTimeout);
        position.meta.queuedPositionColumnsTimeout = setTimeout(async () => {
            var positionColumns = [];
            for(var queuedColumn in L.session.positions[0].meta.queuedPositionColumns) {
                positionColumns.push(L.session.positions[0].meta.queuedPositionColumns[queuedColumn]);
                delete L.session.positions[0].meta.queuedPositionColumns[queuedColumn];
            }

            L.dataOps.setPositionColumns(position.positionId, positionColumns);
        }, 1000);
    }

    position.stopPrice = function (value, dontStore, index) {
        if (!position.positionSLs) {
            position.positionSLs = [];
        }

        if (value !== undefined) {
            if (position.positionSLs.slice(-1)[0]?.sl != value) {
                const chart = L.getPositionChart(position, true);
                const barTime = chart ? Math.max(chart.barsHistoryEntries.slice(-1)[0]?.time || L.session.currentDate, chart.priceHistoryEntries.slice(-1)[0]?.time || L.session.currentDate) : L.session.currentDate;
                const positionSL = { sl: value, barTime: barTime };
                position.positionSLs.push(positionSL);

                if (!dontStore) {
                    L.dataOps.addPositionSL(position.positionId, positionSL);
                }
            }
        }

        if (position.positionSLs.length) {
            return position.positionSLs[index === undefined ? position.positionSLs.length - 1 : index].sl;
        } else {
            return undefined;
        }
    };

    position.targetPrice = function (value, dontStore, index) {
        if (!position.positionTPs) {
            position.positionTPs = [];
        }

        if (value !== undefined) {
            if (position.positionTPs.slice(-1)[0]?.tp != value) {
                const chart = L.getPositionChart(position, true);
                const barTime = chart ? Math.max(chart.barsHistoryEntries.slice(-1)[0]?.time || L.session.currentDate, chart.priceHistoryEntries.slice(-1)[0]?.time || L.session.currentDate) : L.session.currentDate;
               
                const positionTP = { tp: value, barTime: barTime };
                position.positionTPs.push(positionTP);
                if (!dontStore) {
                    L.dataOps.addPositionTP(position.positionId, positionTP);
                }
            }
        }

        if (position.positionTPs.length) {
            return position.positionTPs[index === undefined ? position.positionTPs.length - 1 : index].tp;
        } else {
            return undefined;
        }
    };

    position.bePrice = function (value, dontStore, index) {
        if (!position.positionBEs) {
            position.positionBEs = [];
        }

        if (value !== undefined) {
            if (position.positionBEs.slice(-1)[0]?.be != value) {
                const chart = L.getPositionChart(position, true);
                const barTime = chart ? Math.max(chart.barsHistoryEntries.slice(-1)[0]?.time || L.session.currentDate, chart.priceHistoryEntries.slice(-1)[0]?.time || L.session.currentDate) : L.session.currentDate;
               
                const positionBE = { be: value, barTime: barTime };
                position.positionBEs.push(positionBE);
                if (!dontStore) {
                    L.dataOps.addPositionBE(position.positionId, positionBE);
                }
            }
        }

        if (position.positionBEs.length) {
            return position.positionBEs[index === undefined ? position.positionBEs.length - 1 : index].be;
        } else {
            return undefined;
        }
    };

    position.risk = function (value, dontStore) {       
        if (!position.positionRisks) {
            position.positionRisks = [];
        }

        if (value != undefined && !isNaN(value)) {
            value = Math.abs(value);

            if (position.positionRisks.slice(-1)[0]?.risk != value) {
                const positionRisk = { risk: value, barTime: L.session.currentDate };
                position.positionRisks.push(positionRisk);
                if (!dontStore) {
                    L.dataOps.addPositionRisk(position.positionId, positionRisk);
                }
            }
        }

        if (position.positionRisks.length) {
            return position.positionRisks[position.positionRisks.length - 1].risk;
        } else {
            return undefined;
        }
    };

    position.getIndex = function () {
        return position.index;
    };

    position.getDirection = function () {
        return position.quantity > 0 ? "long" : "short";
    };

    position.getStatus = function () {
        return position.exitTime ? `${L.s(1, -8) /* Exit */} ${position.getDirection()}` : L.s(1, -9) /* Open */;
    };

    position.getRisk = function (noRounding, perLotCost) {
        perLotCost = perLotCost || 0;
        return Number((position.risk() + perLotCost * position.getQuantity(true, true)).toFixed(noRounding ? 100 : 2));
    };

    position.getRiskPercentage = function (noRounding, perLotCost) {
        return Number((position.getRisk(true, perLotCost) / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2));
    };

    position.getEntryDate = function (chart) {
        return L.toTradingViewDateTimeFormat(position.entryTime, chart.getTimezone());
    };

    position.getExitDate = function (chart) {
        return L.toTradingViewDateTimeFormat(position.exitTime || L.session.currentDate, chart.getTimezone());
    };

    position.getExitPrice = function (noRounding) {
        if (position.exitPrice) {
            return Number(position.exitPrice.toFixed(noRounding ? 100 : position.symbol.pricePrecision));
        }
    };

    position.getEntryPrice = function (noRounding) {
        return Number(position.entryPrice.toFixed(noRounding ? 100 : position.symbol.pricePrecision));
    };

    position.getLatestPrice = function (noRounding) {
        if(!position.exitTime && !position.meta.currentPrice) {
            const chart = L.getPositionChart(position, true);
            if(chart) {
                if(!chart.priceHistoryEntries || !chart.priceHistoryEntries.length) {
                    L.setHistory(chart);
                }

                const bar = chart.barsHistoryEntries.slice(-1)[0];
                position.meta.currentPrice = bar.close;
            } else {
                position.meta.currentPrice = L.session.sessionSymbolLastPrices.find(p => p.symbolId == position.symbol.symbolId).lastPrice;
            }
        }

        return Number((position.exitTime ? position.exitPrice : position.meta.currentPrice).toFixed(noRounding ? 100 : position.symbol.pricePrecision));
    };

    position.getSymbolCurrency = function () {
        return position.symbol.currencyId;
    };

    position.getQuantity = function (abs, noRounding) {
        return Number((abs ? Math.abs(position.quantity) : position.quantity).toFixed(noRounding ? 100 : position.symbol.quantityPrecision));
    };

    position.getProfitAtPrice = function (price, noRounding, perLotCost) {
        if (price) {
            return Number(L.calculateProfit(position, price, perLotCost).toFixed(noRounding ? 100 : 2));
        }
    }

    position.getProfit = function (noRounding, perLotCost) {
        perLotCost = perLotCost || 0;
        return Number((position.meta.profit - perLotCost * position.getQuantity(true, true)).toFixed(noRounding ? 100 : 2));
    }

    position.getProfitPercentage = function (profit, noRounding, perLotCost) {
        if (!profit) {
            profit = position.getProfit(noRounding, perLotCost);
        }

        return Number((profit / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2));
    };

    position.getOriginalTPProfit = function(perLotCost) {
        const tpPrice = position.targetPrice(undefined, true, 0);
        if (!Number.isFinite(tpPrice)) return NaN;

        return position.getProfitAtPrice(tpPrice, true, perLotCost);
    }

    position.getCumulativeProfit = function (profit, noRounding, perLotCost) {
        if (!profit) {
            profit = position.getProfit(noRounding, perLotCost);
        }

        return Number((position.meta.initialBalance + profit).toFixed(noRounding ? 100 : 2));
    };

    position.getCumulativeProfitPercentage = function (profit, noRounding, perLotCost) {
        if (!profit) {
            profit = position.getProfit(noRounding, perLotCost);
        }

        return Number(((position.getCumulativeProfit(profit, noRounding, perLotCost) - L.session.capital) / L.session.capital * 100).toFixed(noRounding ? 100 : 2));
    };

    position.getRunUp = function (noRounding, perLotCost) {
        perLotCost = perLotCost || 0;
        return Number(Number(position.columnValue(L.r.s(2, -1) /* Run-up */) - perLotCost * position.getQuantity(true, true)).toFixed(noRounding ? 100 : 2));
    };

    position.getRunUpPercentage = function (noRounding, perLotCost) {
        perLotCost = perLotCost || 0;
        return Number(((position.columnValue(L.r.s(2, -1) /* Run-up */) - perLotCost * position.getQuantity(true, true)) / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2));
    };

    position.getVirtualRunUp = function (noRounding) {
        return Number(Number(position.columnValue(L.s(-7, -6) /* Virtual Run-up */)).toFixed(noRounding ? 100 : 2));
    };

    position.getDrawDown = function (noRounding, perLotCost) {
        perLotCost = perLotCost || 0;
        return -Math.abs(Number(Number(position.columnValue(L.r.s(2, -2) /* Drawdown */) - perLotCost * position.getQuantity(true, true)).toFixed(noRounding ? 100 : 2)));
    };

    position.getDrawDownPercentage = function (noRounding, perLotCost) {
        perLotCost = perLotCost || 0;
        return -Math.abs(Number(((position.columnValue(L.r.s(2, -2) /* Drawdown */) - perLotCost * position.getQuantity(true, true)) / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2)));
    };

    position.getVirtualDrawDown = function (noRounding) {
        return -Math.abs(Number(Number(position.columnValue(L.s(-7, -7) /* Virtual Drawdown */)).toFixed(noRounding ? 100 : 2)));
    };

    position.getBERunUp = function (noRounding, perLotCost) {
        perLotCost = perLotCost || 0;
        const beRunUp = Number(position.columnValue(L.r.s(2, -4) /* BE Run-up */) - perLotCost * position.getQuantity(true, true)) || 0;
        return Number(beRunUp.toFixed(noRounding ? 100 : 2));
    }

    position.getBERunUpPercentage = function (noRounding, perLotCost) {
        perLotCost = perLotCost || 0;
        const beRunUp = position.columnValue(L.r.s(2, -4) /* BE Run-up */) - perLotCost * position.getQuantity(true, true) || 0;
        return Number((beRunUp / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2));
    }

    position.getVirtualBERunUp = function (noRounding) {
        const beRunUp = Number(position.columnValue(L.s(-7, -8) /* Virtual BE Run-up */)) || 0;
        return Number(beRunUp.toFixed(noRounding ? 100 : 2));
    }

    position.getRR = function(noRounding) {
        var rr = position.columnValue(L.r.s(1, -6) /* RR */);
        if(!rr) {
            try {
                const sl = position.stopPrice(undefined, true, 0);
                const tp = position.targetPrice(undefined, true, 0);
                const entry = position.entryPrice;
                if (entry != null && sl != null && tp != null && entry !== sl) {
                    rr = Math.abs(tp - entry) / Math.abs(entry - sl);
                }
            } catch(_e) { return 0; }
        }

        return Number((Number(position.columnValue(L.r.s(1, -6) /* RR */)) || 0).toFixed(noRounding ? 100 : 2));
    }

    position.getLeverage = function() {
        const requiredMargin = position.entryPrice * Math.abs(position.quantity) * position.symbol.meta.contractSize;
        return Math.ceil(requiredMargin / position.meta.initialBalance);
    };
    
    position.isBreakEven = function(perLotCost) {
        return position.getRisk(true, perLotCost) ? Math.abs(position.getProfit(true, perLotCost)) < position.getRisk(true, perLotCost) / 10 : false;
    }
}

L.setPositionShapeSettings = function (shapeDataSourceProperties, shapeProperties) {
    shapeDataSourceProperties.accountSize.setValue(shapeProperties.accountSize);
    shapeDataSourceProperties.currency.setValue(shapeProperties.currency);
    shapeDataSourceProperties.lotSize.setValue(shapeProperties.lotSize);

    shapeDataSourceProperties.accountSize.subscribe(null, () => {
        if (shapeDataSourceProperties.accountSize.value() != shapeProperties.accountSize && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.accountSize.setValue(shapeProperties.accountSize);
        }
    });
    shapeDataSourceProperties.currency.subscribe(null, () => {
        if (shapeDataSourceProperties.currency.value() != shapeProperties.currency && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.currency.setValue(shapeProperties.currency);
        }
    });
    shapeDataSourceProperties.lotSize.subscribe(null, () => {
        if (shapeDataSourceProperties.lotSize.value() != shapeProperties.lotSize && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.lotSize.setValue(shapeProperties.lotSize);
        }
    });
    shapeDataSourceProperties.risk.subscribe(null, () => {
        if (shapeDataSourceProperties.risk.value() != shapeProperties.risk && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.risk.setValue(shapeProperties.risk);
        }
    });
    shapeDataSourceProperties.riskDisplayMode.subscribe(null, () => {
        if (shapeDataSourceProperties.riskDisplayMode.value() != shapeProperties.riskDisplayMode && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.riskDisplayMode.setValue(shapeProperties.riskDisplayMode);
        }
    });
    shapeDataSourceProperties.entryPointCurrencyRate.subscribe(null, () => {
        if (!shapeDataSourceProperties.entryPointCurrencyRate.value()) {
            shapeDataSourceProperties.entryPointCurrencyRate.setValue(1);
        }
    });
    shapeDataSourceProperties.closePointCurrencyRate.subscribe(null, () => {
        if (!shapeDataSourceProperties.closePointCurrencyRate.value()) {
            shapeDataSourceProperties.closePointCurrencyRate.setValue(1);
        }
    });
    if (shapeProperties.entryPrice) {
        shapeDataSourceProperties.entryPrice.subscribe(null, () => {
            if (shapeDataSourceProperties.entryPrice.value() != shapeProperties.entryPrice && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
                L.session.meta.lastSyncTime = Date.now();
                shapeDataSourceProperties.entryPrice.setValue(shapeProperties.entryPrice);
            }
        });
    }
}

L.updateActivePositions = async function () {
    var openProfit = 0;
    for (const position of L.session.getActivePositions()) {
        const currentPositionPrice = position.meta.currentPrice;
        await L.updatePosition(position);

        clearTimeout(position.symbol.meta.updateLastPriceTimeout);
        position.symbol.meta.updateLastPriceTimeout = setTimeout(() => {
            if (currentPositionPrice != position.meta.currentPrice) {
                L.dataOps.updateLastPrice(L.session.sessionId, position.symbol.symbolId, position.meta.currentPrice);
            }
        }, 1000);

        L.updatePositionUI(position);

        if (!position.exitTime) {
            L.createLinesForPosition(position, L.getPositionChart(position, true));
            openProfit += position.getProfit(true);
        }
    }

    L.session.meta.balance = L.session.meta.balance || L.session.capital;
    L.session.equity = L.session.meta.balance + openProfit;

    L.updateSessionCapitalInfo();
}

L.assessTracking = function (position, bar) {
    if (position.quantity > 0) {
        if (position.meta.trackVirtualBeRunUp && (bar.low || bar.price) <= position.entryPrice && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.meta.trackVirtualBeRunUp = false;
        }

        if ((position.meta.trackVirtualRunUp || position.meta.trackVirtualBeRunUp) && (bar.low || bar.price) <= position.positionSLs[0]?.sl && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.meta.trackVirtualRunUp = false;
            position.meta.trackVirtualBeRunUp = false;
        }

        if (position.meta.trackVirtualDrawDown && (bar.high || bar.price) >= position.positionTPs[0]?.tp && position.positionTPs[position.positionTPs.length - 1].barTime <= bar.time) {
            position.meta.trackVirtualDrawDown = false;
        }
    }
    else if (position.quantity < 0) {
        if (position.meta.trackVirtualBeRunUp && (bar.high || bar.price) >= position.entryPrice && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.meta.trackVirtualBeRunUp = false;
        }

        if ((position.meta.trackVirtualRunUp || position.meta.trackVirtualBeRunUp) && (bar.high || bar.price) >= position.positionSLs[0]?.sl && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.meta.trackVirtualRunUp = false;
            position.meta.trackVirtualBeRunUp = false;
        }

        if (position.meta.trackVirtualDrawDown && (bar.low || bar.price) <= position.positionTPs[0]?.tp && position.positionTPs[position.positionTPs.length - 1].barTime <= bar.time) {
            position.meta.trackVirtualDrawDown = false;
        }
    }

    if(position.exitTime) {
        if(position.meta.trackVirtualRunUp) {
            const virtualRunUp = Math.max(position.columnValue(L.s(-7, -6) /* Virtual Run-up */) || 0, position.quantity > 0 ? position.getProfitAtPrice(bar.high || bar.price, true) : position.getProfitAtPrice(bar.low || bar.price, true));
            if (virtualRunUp > position.columnValue(L.s(-7, -6) /* Virtual Run-up */)) {
                position.columnValue(L.s(-7, -6) /* Virtual Run-up */, virtualRunUp);
            }
        }

        if(position.meta.trackVirtualDrawDown) {
            const virtualDrawDown = Math.min(position.columnValue(L.s(-7, -7) /* Virtual Drawdown */) || 0, position.quantity > 0 ? position.getProfitAtPrice(bar.low || bar.price, true) : position.getProfitAtPrice(bar.high || bar.price, true));
            if (virtualDrawDown < position.columnValue(L.s(-7, -7) /* Virtual Drawdown */)) {
                position.columnValue(L.s(-7, -7) /* Virtual Drawdown */, virtualDrawDown);
            }
        }

        if(position.meta.trackVirtualBeRunUp) {
            if (position.columnValue(L.s(-7, -8) /* Virtual BE Run-up */)) {
                const virtualBeRunUp = position.columnValue(L.s(-7, -6) /* Virtual Run-up */);
                if (virtualBeRunUp != position.columnValue(L.s(-7, -8) /* Virtual BE Run-up */)) {
                    position.columnValue(L.s(-7, -8) /* Virtual BE Run-up */, virtualBeRunUp);
                }
            }
        }
    }
}

L.updatePositionStats = function(position, bar) {
    const dbUpdates = [];
    L.assessTracking(position, bar);

    var runUp = Math.max(position.columnValue(L.r.s(2, -1) /* Run-up */) || 0, position.quantity > 0 ? position.getProfitAtPrice(bar.high || bar.price, true) : position.getProfitAtPrice(bar.low || bar.price, true));
    if(position.exitTime) {
        runUp = Math.min(runUp, position.getProfit(true));
    }
    
    if (runUp > position.columnValue(L.r.s(2, -1) /* Run-up */)) {
        position.columnValue(L.r.s(2, -1) /* Run-up */, runUp);
        if(!position.exitTime) {
            position.columnValue(L.s(-7, -6) /* Virtual Run-up */, runUp);
        }
    }
    
    const drawDown = Math.max(Math.min(position.columnValue(L.r.s(2, -2) /* Drawdown */) || 0, position.quantity > 0 ? position.getProfitAtPrice(bar.low || bar.price, true) : position.getProfitAtPrice(bar.high || bar.price, true)), -position.getRisk(true) || -Infinity);
    if (drawDown < position.columnValue(L.r.s(2, -2) /* Drawdown */)) {
        position.columnValue(L.r.s(2, -2) /* Drawdown */, drawDown);

        if(!position.exitTime) {
            position.columnValue(L.s(-7, -7) /* Virtual Drawdown */, drawDown);
        }
    }

    if(position.meta.trackBeRunUp) {
        if (position.columnValue(L.r.s(2, -4) /* BE Run-up */)) {
            const beRunUp = position.columnValue(L.r.s(2, -1) /* Run-up */);
            if (beRunUp != position.columnValue(L.r.s(2, -4) /* BE Run-up */)) {
                position.columnValue(L.r.s(2, -4) /* BE Run-up */, beRunUp);
                if(!position.exitTime) {
                    position.columnValue(L.s(-7, -8) /* Virtual BE Run-up */, beRunUp);
                } else {
                    position.meta.trackBeRunUp = false;
                }
            }
        }
    }
}

L.updatePosition = async function (position) {
    const chart = L.getPositionChart(position, true);
    var continueParsing = !!chart;

    if (continueParsing) {
        if (continueParsing) {
            for (var i = 0; i <= chart.barsHistoryEntries.length - 1; i++) {
                const bar = chart.barsHistoryEntries[i];
                if (bar.time > position.entryTime) {
                    continueParsing = await parseBarAction(bar, null, i == chart.barsHistoryEntries.length - 1);
                    if (!continueParsing) {
                        break;
                    }
                }
            }
        }

        if (continueParsing) {
            for (var i = 0; i < chart.priceHistoryEntries.length; i++) {
                const bar = chart.priceHistoryEntries[i];
                const previousBar = chart.priceHistoryEntries[i - 1];
                continueParsing = await parseBarAction(bar, previousBar, i == chart.priceHistoryEntries.length - 1);
                if(!continueParsing) {
                    break;
                }
            }
        }
    } else {
        console.warn(L.s(2, -3, position.symbol.symbolName) /* Position chart not found for symbol {0} */);
    }

    async function parseBarAction(bar, previousBar, isLatestBar) {
        var isClosing = false;

        if (bar.time >= position.entryTime) {
            if (isLatestBar) {
                position.meta.profit = position.getProfitAtPrice(bar.close || bar.price, true);
                position.meta.currentPrice = (bar.close || bar.price);
            }

            isClosing = L.detectExit(position, chart, bar, previousBar);
            L.updatePositionStats(position, bar);
        }

        return !isClosing;
    }
}

L.detectExit = function (position, chart, bar, previousBar) {
    if (L.session.meta.replayTo 
        || L.session.meta.isChangingSymbol
        || L.session.meta.isIntervalChanging
        || L.session.meta.isReviewMode
        || L.session.meta.isAutoNavigating) {
        return;
    }

    if (position.bePrice()) {
        var beHit = true;
        beHit = beHit && (position.positionBEs[position.positionBEs.length - 1].barTime <= bar.time);
        if(position.quantity > 0) {
            beHit = beHit && ((bar.low || previousBar?.price) <= position.bePrice() && position.bePrice() <= (bar.high || bar.price));
        } else {
            beHit = beHit && ((bar.high || previousBar?.price) >= position.bePrice() && position.bePrice() >= (bar.low || bar.price));
        }

        if (beHit) {
            position.meta.trackBeRunUp = true;
            position.meta.trackVirtualBeRunUp = true;
            L.toast(L.s(2, -4) /* BE hit, moving SL to entry */, 2000);
            L.stopSkipping();
            L.removeBeLine(position, chart);
            if(TradingView.defaultProperties.meta.includes(L.r.s(-2, 9) /* CanSetBE */)) {
                L.applyOnCharts((c) => {
                    const stopLine = L.getShapeById(position.meta.stopLineId, c, true);
                    stopLine?.setPoints([{ price: position.entryPrice, time: position.entryTime }]);
                });
                
                L.setStopPrice(position, position.entryPrice, true);
                position.columnValue(L.r.s(2, -4) /* BE Run-up */, position.columnValue(L.r.s(2, -1) /* Run-up */));
                position.columnValue(L.s(-7, -8) /* Virtual BE Run-up */, position.columnValue(L.r.s(2, -1) /* Run-up */));
                
                if (L.session.getParameter(L.sessionParameterIds.AutoSnapshot) == 'true') {
                    L.takeSnapshot(position);
                }
            } else {
                L.toast(L.s(2, -5) /* BE hit, but the auto-BE feature is disabled: please upgrade your TestingView.com subscription plan to enable this feature */, 0, "warn");
                L.delay(2000).then(() => {
                    L.startAutoplay();
                });
            }
        }
    }
    
    if (position.quantity > 0) {
        if ((bar.low || bar.price) <= position.stopPrice() && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.exitPrice = position.stopPrice();
        }

        if ((bar.high || bar.price) >= position.targetPrice() && position.positionTPs[position.positionTPs.length - 1].barTime <= bar.time) {
            position.exitPrice = position.targetPrice();
        }
    }
    else if (position.quantity < 0) {
        if ((bar.high || bar.price) >= position.stopPrice() && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.exitPrice = position.stopPrice();
        }

        if ((bar.low || bar.price) <= position.targetPrice() && position.positionTPs[position.positionTPs.length - 1].barTime <= bar.time) {
            position.exitPrice = position.targetPrice();
        }
    }

    if (position.exitPrice) {
        if(position.exitPrice == position.stopPrice()) {
            L.toast(L.s(2, -6) /* Stop loss hit */, 2000, "warn");
        } else if(position.exitPrice == position.targetPrice()) {
            L.toast(L.s(2, -7) /* Take profit hit */, 2000);
        }

        position.exitTime = bar.time + chart.timeframeSeconds > L.session.currentDate ? L.session.currentDate : bar.time + chart.timeframeSeconds;
        position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);

        L.closePosition(position, 1 /* TP/SL */, chart);
        return true;
    }
}

L.keepShapeInfoInSync = function (position, shape, shapeDataSourceProperties) {
    shapeDataSourceProperties.stopPrice.subscribe(null, () => {
        if (position.meta.setShapeStopPriceTimeout) {
            clearTimeout(position.meta.setShapeStopPriceTimeout);
        }

        position.meta.setShapeStopPriceTimeout = setTimeout(() => {
            if (!position.exitTime && position.getShape().stopPrice != shapeDataSourceProperties.stopPrice.value()) {
                position.getShape().stopPrice = shapeDataSourceProperties.stopPrice.value();
            }
        }, 1000);
    });

    shapeDataSourceProperties.stopPrice.subscribe(null, () => {
        if (position.meta.setShapeTargetPriceTimeout) {
            clearTimeout(position.meta.setShapeTargetPriceTimeout);
        }

        position.meta.setShapeTargetPriceTimeout = setTimeout(() => {
            if (!position.exitTime && position.getShape().targetPrice != shapeDataSourceProperties.targetPrice.value()) {
                position.getShape().targetPrice = shapeDataSourceProperties.targetPrice.value();
            }
        }, 1000);
    });

    shapeDataSourceProperties.stopPrice.subscribe(null, () => {
        if (position.meta.setShapeEndTimeTimeout) {
            clearTimeout(position.meta.setShapeEndTimeTimeout);
        }

        position.meta.setShapeEndTimeTimeout = setTimeout(() => {
            const endTime = shape.getPoints()[1].time;
            if (!position.exitTime && position.getShape().endTime != endTime) {
                position.getShape().endTime = endTime;
            }
        }, 1000);
    });
}

L.setStopPrice = function (position, price, immediate) {
    if (position.meta.pendingNewStopPrice != price) {
        position.meta.pendingNewStopPrice = price;
        if (position.positionSLs?.slice(-1)[0] != price) {
            const setStopPrice = () => {
                const positionChart = L.getShapeChart(position.meta.stopLineId);
                if (positionChart) {
                    const bar = positionChart.priceHistoryEntries.slice(-1)[0];

                    const isInvalidPrice = !!immediate;

                    if(position.quantity > 0 && price >= bar.price) {
                        L.toast(L.s(2, -8) /* SL cannot be higher than the current price */, 3000, "warn");
                        isInvalidPrice = true;
                    }
                    if(position.quantity < 0 && price <= bar.price) {
                        L.toast(L.r.s(-5, 9) /* SL cannot be lower than the current price */, 3000, "warn");
                        isInvalidPrice = true;
                    }
                    if(position.quantity > 0 && position.bePrice() && price > position.bePrice()) {
                        L.toast(L.r.s(-5, -1) /* SL cannot be higher than the BE level */, 3000, "warn");
                        isInvalidPrice = true;
                    }
                    if(position.quantity < 0 && position.bePrice() && price < position.bePrice()) {
                        L.toast(L.r.s(-5, -2) /* SL cannot be lower than the BE level */, 3000, "warn");
                        isInvalidPrice = true;
                    }
        
                    if (!immediate && isInvalidPrice) {
                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.stopLineId, chart, true)?.setPoints(
                                [{ price: position.stopPrice(), time: position.entryTime }]);
                        });
                    }
                    else {
                        position.stopPrice(price);

                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.stopLineId, chart, true)?.setProperties({
                                text: `${position.getProfitAtPrice(position.stopPrice())} ${L.session.currencyId} (${position.getProfitPercentage(position.getProfitAtPrice(position.stopPrice(), true))}%)`,
                            });
                        });
                    }
                }
            }

            if (immediate) {
                setStopPrice();
            } else {
                if (position.meta.setStopPriceTimeout) {
                    clearTimeout(position.meta.setStopPriceTimeout);
                }
            
                position.meta.setStopPriceTimeout = setTimeout(setStopPrice, 1000);
            }
        }
    }
}

L.setTargetPrice = function (position, price) {
    if (position.meta.pendingNewTargetPrice != price) {
        position.meta.pendingNewTargetPrice = price;
        if (position.positionTPs?.slice(-1)[0] != price) {
            if (position.meta.setTargetPriceTimeout) {
                clearTimeout(position.meta.setTargetPriceTimeout);
            }

            position.meta.setTargetPriceTimeout = setTimeout(() => {
                const positionChart = L.getShapeChart(position.meta.targetLineId);
                if (positionChart) {
                    const bar = positionChart.priceHistoryEntries.slice(-1)[0];

                    var isInvalidPrice = false;
                   
                    if(position.quantity > 0 && price <= bar.price) {
                        L.toast(L.s(2, -9) /* TP cannot be lower than the current price */, 3000, "warn");
                        isInvalidPrice = true;
                    } else if(position.quantity < 0 && price >= bar.price) {
                        L.toast(L.r.s(-5, 1) /* TP cannot be higher than the current price */, 3000, "warn");
                        isInvalidPrice = true;
                    } else if(position.quantity > 0 && position.bePrice() && price < position.bePrice()) {
                        L.toast(L.r.s(-5, 2) /* TP cannot be lower than the BE level */, 3000, "warn");
                        isInvalidPrice = true;
                    } else if(position.quantity < 0 && position.bePrice() && price > position.bePrice()) {
                        L.toast(L.r.s(-5, 3) /* TP cannot be higher than the BE level */, 3000, "warn");
                        isInvalidPrice = true;
                    }

                    if (isInvalidPrice) {
                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.targetLineId, chart, true)?.setPoints(
                                [{ price: position.targetPrice(), time: position.entryTime }]);
                        });
                    }
                    else {
                        position.targetPrice(price);
                        
                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.targetLineId, chart, true)?.setProperties({
                                text: `${position.getProfitAtPrice(position.targetPrice())} ${L.session.currencyId} (${position.getProfitPercentage(position.getProfitAtPrice(position.targetPrice(), true))}%)`,
                            });
                        });
                    }
                }
            }, 1000);
        }
    }
}

L.setBePrice = function (position, price) {
    if (position.meta.pendingNewBEPrice != price) {
        position.meta.pendingNewBEPrice = price;
        if (position.positionBEs?.slice(-1)[0] != price) {
            position.meta.currentBePrice = price;
            if (position.meta.setBePriceTimeout) {
                clearTimeout(position.meta.setBePriceTimeout);
            }

            position.meta.setBePriceTimeout = setTimeout(() => {
                const positionChart = L.getShapeChart(position.meta.beLineId);
                if (positionChart) {                   
                    const isInvalidPrice = false;

                    if(position.quantity > 0 && price <= position.stopPrice()) {
                        L.toast(L.s(3, -1) /* BE level cannot be lower than SL */, 3000, "warn");
                        isInvalidPrice = true;
                    }
                    if(position.quantity < 0 && price >= position.stopPrice()) {
                        L.toast(L.r.s(-5, 4) /* BE level cannot be higher than SL */, 3000, "warn");
                        isInvalidPrice = true;
                    }
                    if(position.quantity > 0 && price >= position.targetPrice()) {
                        L.toast(L.r.s(-5, 5) /* BE level cannot be higher than TP */, 3000, "warn");
                        isInvalidPrice = true;
                    }
                    if(position.quantity < 0 && price <= position.targetPrice()) {
                        L.toast(L.r.s(-5, 6) /* BE level cannot be lower than TP */, 3000, "warn");
                        isInvalidPrice = true;
                    }
                    if(position.quantity > 0 && price <= position.entryPrice) {
                        L.toast(L.r.s(-5, 7) /* BE level cannot be lower than entry price */, 3000, "warn");
                        isInvalidPrice = true;
                    }
                    if(position.quantity < 0 && price >= position.entryPrice) {
                        L.toast(L.r.s(-5, 8) /* BE level cannot be higher than entry price */, 3000, "warn");
                        isInvalidPrice = true;
                    }
        
                    if (isInvalidPrice) {
                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.beLineId, chart, true)?.setPoints(
                                [{ price: position.bePrice(), time: position.entryTime }]);
                        });
                    }
                    else {
                        position.bePrice(price);
                    }
                }
            }, 1000);
        }
    }
}

L.sortPositions = function (field) {
    const comparePosition = function (position1, position2, valueFunction) {
        const a = valueFunction(position1);
        const b = valueFunction(position2);
        var valueComparison = 0;

        // Treat null or undefined as smaller than any defined value
        const isANullish = a === null || a === undefined;
        const isBNullish = b === null || b === undefined;

        if (isANullish && !isBNullish) { valueComparison = -1; }
        else if (!isANullish && isBNullish) { valueComparison = 1; }
        else if (a < b) { valueComparison = -1; }
        else if (a > b) { valueComparison = 1; }

        L.session.meta.sortByColumn = field;

        return (position2.exitTime ? 1 : 0) - (position1.exitTime ? 1 : 0)
            || (L.session.meta.sortByDesc ? -valueComparison : valueComparison)
            || (L.session.meta.sortByDesc ? (position2.index - position1.index) : (position1.index - position2.index));
    }

    if (L.session.positions.length > 1 && field) {
        if (L.session.meta.sortByColumn == field) {
            L.session.meta.sortByDesc = !L.session.meta.sortByDesc;
        }
        var accessors = {};

        accessors[L.r.s(1, -1) /* Trade */] = p => p.getDirection();
        accessors[L.r.s(1, -2) /* Date/Time */] = p => p.entryTime;
        accessors[L.r.s(1, -3) /* Price */] = p => p.entryPrice;
        accessors[L.r.s(1, -5) /* Lots */] = p => Math.abs(p.quantity);
        accessors[L.r.s(1, -7) /* Risk */] = p => p.getRisk() || 0;
        accessors[L.r.s(1, -8) /* Profit */] = p => p.getProfitPercentage();
        accessors[L.r.s(1, -9) /* Cumulative profit */] = p => p.getCumulativeProfit();
        accessors[L.r.s(2, -1) /* Run-up */] = p => p.getRunUpPercentage();
        accessors[L.r.s(2, -2) /* Drawdown */] = p => p.getDrawDownPercentage();
        accessors[L.r.s(2, -4) /* BE Run-up */] = p => p.getBERunUpPercentage();

        const accessor = accessors[field];

        if (accessor) {
            L.session.positions.sort((a, b) => comparePosition(a, b, accessor));
        } else {
            const column = L.session.sessionColumns.find(c => c.columnName === field);
            if (column?.sortable) {
                L.session.positions.sort((a, b) => comparePosition(a, b, p => p.columnValue(field)));
            }
        }
    }
    L.updatePositionsList(true);
}

L.calculateProfit = function (position, currentPrice, perLotCost) {
    perLotCost = perLotCost || 0;
    return (currentPrice - position.entryPrice) * position.quantity * position.symbol.meta.contractSize * position.entryCurrencyRate * position.symbol.meta.pointSize - perLotCost * position.getQuantity(true, true);
}

L.getBalanceAfterPositions = async function (initialBalance, positions) {
    positions = positions.slice().sort((a, b) => a.exitTime - b.exitTime);

    for (const position of positions) {
        Object.defineProperty(position.symbol, 'meta', { value: {}, writable: true, enumerable: false });
        L.setPositionFunctions(position);
        if (!position.symbol.meta.contractSize) {
            position.symbol.meta.contractSize = (await L.getContractSize(position.symbol.symbolName, position.symbol.symbolType)).contractSize;
        }

        if (!position.symbol.meta.pointSize) {
            position.symbol.meta.pointSize = (await L.getContractSize(position.symbol.symbolName, position.symbol.symbolType)).pointSize;
        }

        position.meta.initialBalance = initialBalance;
        if (position.exitTime) {
            position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);
            initialBalance += position.getProfit(true);
        } else {
            if (L.session?.sessionSymbolLastPrices) {
                try {
                    position.meta.currentPrice = L.session.sessionSymbolLastPrices.find(p => p.symbolId == position.symbol.symbolId).lastPrice;
                } catch(e) {
                    L.dbg(e);
                }
                position.meta.profit = position.getProfitAtPrice(position.meta.currentPrice, true);
            }
        }
    }

    return initialBalance;
}
