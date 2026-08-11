L.subscribeToData = async function(ctx) {
    const chart  = L.getCharts()[0];
    const model  = chart.chartModel();
    const series = model.mainSeries();
    const c = {}; // for unsubscribes
  
    let rafId = 0, rafId2 = 0;
    const read = async () => {
        if (L.session.meta.replayTo 
            || L.session.meta.isChangingSymbol
            || L.session.meta.isIntervalChanging
            || L.session.meta.isAutoNavigating) {
            return;
        }
    
        const v = series.lastValueData(undefined, /*lastBar*/ true, /*includePrice*/ true);
        
        const lastBar = series.bars?.().last?.() ?? series.bars?._items?.at?.(-1);
        const currentBarInfo = L.getBarInfo(lastBar, chart.timeframeSeconds);
        currentBarInfo.close = v?.price ?? currentBarInfo.close;
        if (currentBarInfo.time !== ctx.previousBarInfo.time || currentBarInfo.close !== ctx.previousBarInfo.close || currentBarInfo.high !== ctx.previousBarInfo.high || currentBarInfo.low !== ctx.previousBarInfo.low || currentBarInfo.open !== ctx.previousBarInfo.open) {
            const previousBarInfo = ctx.previousBarInfo;
            ctx.previousBarInfo = currentBarInfo;
            await L.onBarActivity(previousBarInfo, currentBarInfo);
        }
    };
  
    // schedule read after TV has applied updates (and even painted)
    const scheduleRead = () => {
      cancelAnimationFrame(rafId); cancelAnimationFrame(rafId2);
      rafId = requestAnimationFrame(() => {
        // sometimes commit → paint is another turn; do a second rAF
        rafId2 = requestAnimationFrame(read);
      });
    };
  
    // LIVE: fires on realtime updates
    series.dataEvents().barReceived().subscribe(c, scheduleRead);
    series.dataEvents().dataUpdated().subscribe(c, scheduleRead); // symbol/res changes etc.
  
    // REPLAY: drive off the playhead time; then read on next frame
    (async () => {
      L.r.currentDate().subscribe(scheduleRead);
    })();
}

L.pollBarActivity = async function(ctx) {
    if(L.session.meta.replayTo && L.session.currentDate > L.session.meta.replayTo) {
        L.session.meta.replayTo = null;
    }

    if(ctx.replayTimestampCounter <= 0) {
        setTimeout(() => {
            L.createReplayTimestampUI();
            L.getCurrentDateElement().text(L.toTradingViewDateTimeFormat(L.r.currentDate().value(), L.c().getTimezone()));
        }, 200);
        ctx.replayTimestampCounter = 5;
    }

    ctx.replayTimestampCounter--;

    if (L.session.meta.replayTo 
        || L.session.meta.isChangingSymbol
        || L.session.meta.isIntervalChanging
        || L.session.meta.isReviewMode
        || L.session.meta.isAutoNavigating) {
        return;
    }

    const currentBarInfo = L.getCurrentBarInfo();
    if (currentBarInfo) {
        if (currentBarInfo.time !== ctx.previousBarInfo.time || currentBarInfo.close !== ctx.previousBarInfo.close || currentBarInfo.high !== ctx.previousBarInfo.high || currentBarInfo.low !== ctx.previousBarInfo.low || currentBarInfo.open !== ctx.previousBarInfo.open) {
            const previousBarInfo = ctx.previousBarInfo;
            ctx.previousBarInfo = currentBarInfo;
            await L.onBarActivity(previousBarInfo, currentBarInfo);
        }

        L.syncLinesWithPositions();
    }
}

L.monitorEntryShapes = function () {
    L.asyncInterval(async () => {
        if (L.entryShapeCharts) {
            for (const shapeChartInfo of L.entryShapeCharts) {
                const shape = L.getShapeById(shapeChartInfo.shapeInfo.id, shapeChartInfo.chart, true);
                if (shape) {
                    const shapeDataSourceProperties = shape.lineDataSource().properties();
                    const entryPrice = shapeDataSourceProperties.entryPrice.value();
                    if (entryPrice != shapeChartInfo.shapeInfo._entryPrice) {
                        shapeChartInfo.shapeInfo._entryPrice = entryPrice;
                        shapeChartInfo.shapeInfo.timeAdded = L.session.currentDate;
                    }
                }
            }
        }
    }, 100);
}

L.detectEntries = async function () {
    if (L.session.meta.isAutoNavigating || L.session.meta.replayTo || L.session.meta.isReviewMode) {
        return;
    }

    L.generateEntryShapeCharts();
    for (var shapeChartIndex = L.session.meta.entryShapeCharts.length - 1; shapeChartIndex >= 0; shapeChartIndex--) {
        const shapeChartInfo = L.session.meta.entryShapeCharts[shapeChartIndex];
        const shape = L.getShapeById(shapeChartInfo.shapeInfo.id, shapeChartInfo.chart, true);
        const shapePoints = shape?.getPoints();
        if (shape && shapePoints.length && shapePoints[1].time > L.session.currentDate) {
            const shapeDataSourceProperties = shape.lineDataSource().properties();

            if (!shape._lockedProperties) {
                shape._lockedProperties = true;
                var symbolInfo = shapeChartInfo.chart.chartModel().mainSeries().symbolInfo();
                const lotSize = (await L.getContractSize(symbolInfo.full_name, symbolInfo.type)).contractSize * (shapeDataSourceProperties.entryPointCurrencyRate.value() || 1);
                var shapeProperties = shape.getProperties();
                L.setPositionShapeSettings(shapeDataSourceProperties, { id: shapeChartInfo.shapeInfo.id, ...shapeProperties, accountSize: L.session.meta.balance || L.session.capital, currency: L.session.currencyId, lotSize });
            }

            if (shapeChartInfo.chart.barsHistoryEntries.length > 1) {
                var entryPrice = 0;
                var entryTime = 0;

                for (var barIndex = 1; barIndex < shapeChartInfo.chart.priceHistoryEntries.length; barIndex++) {
                    var previousBar = shapeChartInfo.chart.priceHistoryEntries[barIndex - 1];
                    var bar = shapeChartInfo.chart.priceHistoryEntries[barIndex];
                    if (bar.time >= shapeChartInfo.shapeInfo.timeAdded) {
                        const shapeEntryPrice = shapeDataSourceProperties.entryPrice.value();

                        if (previousBar.price <= shapeEntryPrice && shapeEntryPrice <= bar.price) {
                            entryPrice = shapeEntryPrice;
                            entryTime = bar.time;
                            break;
                        }
                    }
                }

                for (var barIndex = 1; barIndex < shapeChartInfo.chart.barsHistoryEntries.length; barIndex++) {
                    var previousBar = shapeChartInfo.chart.barsHistoryEntries[barIndex - 1];
                    var bar = shapeChartInfo.chart.barsHistoryEntries[barIndex];
                    if (bar.time >= shapeChartInfo.shapeInfo.timeAdded) {
                        const shapeEntryPrice = shapeDataSourceProperties.entryPrice.value();

                        if (Math.min(previousBar.close, bar.open) <= shapeEntryPrice && shapeEntryPrice <= Math.max(previousBar.close, bar.open) && bar.time > shapeChartInfo.shapeInfo.timeAdded) {
                            entryPrice = bar.open;
                            entryTime = bar.time;

                            break;
                        }
                        else if (bar.low <= shapeEntryPrice && shapeEntryPrice <= bar.high) {
                            entryPrice = shapeEntryPrice;
                            entryTime = bar.time;

                            break;
                        }

                    }
                }

                if (entryPrice && entryTime) {
                    if(!(L.session.positions.length < 20 || TradingView.defaultProperties.meta.includes(L.r.s(-2, 3) /* MoreThan20Trades */) || TradingView.defaultProperties.meta.includes(L.r.s(-2, 4) /* UnlimitedTrades */))) {
                        L.stopSkipping();
                        L.messageBox(L.r.s(4, 0) /* Feature disabled */, L.r.s(-2, 5) /* Cannot open more than 20 trades: please upgrade your TestingView.com subscription plan to enable this feature */);
                        break;
                    }

                    if(!(L.session.positions.length < 50 || TradingView.defaultProperties.meta.includes(L.r.s(-2, 4) /* UnlimitedTrades */))) {
                        L.stopSkipping();
                        L.messageBox(L.r.s(4, 0) /* Feature disabled */, L.r.s(-2, 6) /* Cannot open more than 50 trades: please upgrade your TestingView.com subscription plan to enable this feature */);
                        break;
                    }

                    shapeDataSourceProperties.entryPrice.setValue(entryPrice);
                    shapeDataSourceProperties.entryPrice.subscribe(null, () => {
                        if (shapeDataSourceProperties.entryPrice.value() != entryPrice && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
                            L.session.meta.lastSyncTime = Date.now();
                            shapeDataSourceProperties.entryPrice.setValue(entryPrice);
                        }
                    });

                    await L.openPosition({ entryPrice, entryTime }, shapeChartInfo, shape);
                    L.session.meta.entryShapeCharts.splice(shapeChartIndex, 1);
                    break;
                }
            } else {
                console.warn(L.r.s(-2, 7) /* No history bars on shape's chart */);
            }
        }
    }
}
