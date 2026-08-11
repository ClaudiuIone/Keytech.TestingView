const L = TradingViewApi.L;

L.subscribe(L.events.onFastForward, async () => {
    if(!L.addExtraStep) {
        return;
    }
    
    await L.delay(500);
    L.stepForward();
});

L.refreshAllChartsLoadedIndicators = async function() {
    L.applyOnChartsAsync(async chart => {
        L.refreshLoadedIndicators(chart);
    });
    L.unsubscribe(L.events.onFastForward, L.refreshAllChartsLoadedIndicators);
}

L.refreshAllChartsLoadedIndicatorsOnForward = function() {
    L.subscribe(L.events.onFastForward, L.refreshAllChartsLoadedIndicators);
}

L.subscribe(L.events.onSelectDate, L.refreshAllChartsLoadedIndicatorsOnForward);

L.subscribe(L.events.onOpeningPosition, async () => {
    var chart = L.getCharts()[0];
    var prePricePlots = L.getPlots(chart, ["PrePrice", "TimeInEffect"], false, true);
    if(prePricePlots.found) {
        const prePrice = prePricePlots["PrePrice"];
        L.openAttemptAt = prePricePlots["TimeInEffect"] / 1000;
        
        for (var barIndex = 1; barIndex < chart.priceHistoryEntries.length; barIndex++) {
            var previousBar = chart.priceHistoryEntries[barIndex - 1];
            var bar = chart.priceHistoryEntries[barIndex];
            if (bar.time >= L.openAttemptAt) {
                if (previousBar.price <= prePrice && prePrice <= bar.price) {
                    L.openAttemptAt = null;
                    return true;
                }
            }
        }

        for (var barIndex = 1; barIndex < chart.barsHistoryEntries.length; barIndex++) {
            var previousBar = chart.barsHistoryEntries[barIndex - 1];
            var bar = chart.barsHistoryEntries[barIndex];
            if (bar.time >= L.openAttemptAt) {
                if (Math.min(previousBar.close, bar.open) <= prePrice && prePrice <= Math.max(previousBar.close, bar.open) && bar.time > L.openAttemptAt) {
                    L.openAttemptAt = null;
                    return true;
                }
                else if (bar.low <= prePrice && prePrice <= bar.high) {
                    L.openAttemptAt = null;
                    return true;
                }
            }
        }

        return false;
    } else {
        return true;
    }
});


L.refreshLoadedIndicators = async function(chart) {
    if(L.skipIndicatorRefresh) {
        return;
    }
    const studies = chart.getAllStudies();

    for (var studyInfo of studies) {
        const study = chart.getStudyById(studyInfo.id);
        if (study.isVisible()) {
            while(study.isLoading()) {
                await L.delay(500);
            }

            chart.removeEntityWithUndo(studyInfo.id);
            await L.delay(200);
            chart.chartUndoModel().undoHistory().undo();
            await L.delay(100);
        }
    }
}

L.analysisSnapshots = async function(delay, useClipboard, entireLayout) {
    L.toast("Preparing snapshots...");
    if(L.r.isReplayStarted().value()) {
        L._mockDate = "Time " + ($(`#${L.s(0, 9) /* TestingViewCurrentDate */}`).text().split("   ")[1] || new Date(L.r.currentDate().value() * 1000).toLocaleTimeString());
    }
    try {
        await L.takeSnapshot(null, !entireLayout, useClipboard, async (c, i) => {
            L.toast(`Copied snapshot of chart ${i + 1}`);
            await L.delay(delay);
        }, !useClipboard);
        
        L.toast("Snapshots taken", 2000);
    } catch (e) {
        L.toast("Error while taking snapshots: " + e.message);
    }

    L._mockDate = null;
}

L.compileSources = async function (debug) {
    L.toast(`Compiling sources (debug=${debug})...`);
    try {
        const response = await fetch(L.s(4, 8, `app/compile?debug=${debug}`));
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        L.toast(`Sources compiled (debug=${debug})`, 2000);
    } catch (e) {
        L.toast(`Compile failed: ${e.message}`, 4000, "warn");
    }
};

let middleClickCompileTimer = null;

L.TestingViewButton.on("mousedown", async (e) => {
    if (e.which !== 2) return;
    e.preventDefault();

    if (middleClickCompileTimer) {
        clearTimeout(middleClickCompileTimer);
        middleClickCompileTimer = null;
        await L.compileSources(false);
        return;
    }

    middleClickCompileTimer = setTimeout(async () => {
        middleClickCompileTimer = null;
        await L.compileSources(true);
    }, 300);
});

L.TestingViewButton.on("contextmenu", async (e) => {
    L.TestingViewButton.off("contextmenu");
    setInterval(() => {
        const chartCount = L.t.chartsCount();
        var isClean = true;

        for (let i = 0; i < chartCount; i++) {
            const chart = L.t.chart(i);
            const studies = chart.getAllStudies();
            var continueIteration = true;

            for (var studyInfo of studies) {
                const study = chart.getStudyById(studyInfo.id);
                if (study.hasError()) {
                    chart.removeEntityWithUndo(studyInfo.id);
                    setTimeout(() => {
                        chart.chartUndoModel().undoHistory().undo();
                    }, 300);
                    isClean = false;
                    continueIteration = false;
                    break;
                } else if (study.isLoading()) {
                    isClean = false;
                }

                if (!continueIteration) {
                    break;
                }
            }
        }

        $(".backtst-button").css("zoom", isClean ? "1.2" : "1");
    }, 1000);
})

$(document).on("keydown.extend", async (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        
        const selectedPosition = $(".V_POSITION.selected");
        if (selectedPosition.length) {
            const positionId = selectedPosition.attr("id").split("_")[1];
            const position = L.session.positions.find(p => p.positionId == positionId);
            
            if (position) {
                L.confirmBox("Delete position", "Are you sure you want to delete this position?", async (ok) => {
                    if (ok) {
                        // Remove from database
                        await L.dataOps.deletePosition(positionId);
                        
                        // Remove from session
                        L.session.positions = L.session.positions.filter(p => p.positionId !== positionId);
                        
                        // Remove from UI
                        selectedPosition.remove();
                        
                        // Remove shapes from chart
                        L.applyOnCharts(chart => {
                            const shapes = chart.getAllShapes();
                            for (const shapeInfo of shapes) {
                                if (shapeInfo.positionId === positionId) {
                                    L.removeShapeById(shapeInfo.id, chart, true);
                                }
                            }
                        });
                        
                        L.toast("Position deleted", 2000);
                    }
                });
            }
        }
    }

    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'f') {
        L.arrangeCharts();
        await L.delay(500);
        L.analysisSnapshots(600, event.shiftKey);
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'b') {
        if(confirm("Are you sure you want to set all position quantities to represent 1% risk? This action cannot be undone.")) {
            //for each position, set the quantity equivalent to 1%
            event.preventDefault();
            const positions = (L.session.positions || []).map(p => p).sort((a, b) => a.entryTime - b.entryTime).filter(p => p.exitTime);
            var balance = L.session.capital;

            for (const position of positions) {
                const currentRiskPercent = position.getRisk(true) / balance * 100;
                if (currentRiskPercent !== 1 && currentRiskPercent !== 0) {
                    const newQuantity = position.quantity * (1 / currentRiskPercent);
                    L.dbg(`Adjusting position ${position.positionId} quantity from ${position.quantity} to ${newQuantity}`);

                    position.quantity = newQuantity;
                    await L.dataOps.updatePositionQuantity(position.positionId, newQuantity);

                    const risk = position.getRisk(true);
                    position.risk(risk * (1 / currentRiskPercent));
                    L.dbg(`Updated Risk from ${risk} to ${risk * (1 / currentRiskPercent)}`);

                    const beRunUp = position.getBERunUp(true);
                    position.columnValue("BE Run-up", beRunUp * (1 / currentRiskPercent));
                    L.dbg(`Updated BE Run-up from ${beRunUp} to ${beRunUp * (1 / currentRiskPercent)}`);
                    
                    //add virtual columns

                    const runUp = position.getRunUp(true);
                    position.columnValue("Run-up", runUp * (1 / currentRiskPercent));
                    L.dbg(`Updated Run-up from ${runUp} to ${runUp * (1 / currentRiskPercent)}`);

                    const drawdown = position.getDrawDown(true);
                    position.columnValue("Drawdown", drawdown * (1 / currentRiskPercent));
                    L.dbg(`Updated Drawdown from ${drawdown} to ${drawdown * (1 / currentRiskPercent)}`);

                    await L.delay(200);
                }

                position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);
                balance += position.getProfit(true);
            }

            alert("All position quantities adjusted to represent 1% risk.");
        }
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'k') {
        if(confirm("Are you sure you want to set all position quantities to represent FIXED risk? This action cannot be undone.")) {
            event.preventDefault();
            const positions = (L.session.positions || []).map(p => p).sort((a, b) => a.entryTime - b.entryTime).filter(p => p.exitTime);
            var balance = L.session.capital;

            for (const position of positions) {
                const currentQty = position.quantity;
                const newQuantity = 5 * Math.sign(position.quantity);
                if (currentQty !== newQuantity && currentQty !== 0) {
                    L.dbg(`Adjusting position ${position.positionId} quantity from ${position.quantity} to ${newQuantity}`);
                    position.quantity = newQuantity;
                    await L.dataOps.updatePositionQuantity(position.positionId, newQuantity);
                    const oldRisk = position.getRisk(true);
                    const newRisk = oldRisk * (newQuantity / currentQty);
                    position.risk(newRisk);
                    L.dbg(`Updated Risk from ${oldRisk} to ${newRisk}`);

                    const beRunUp = position.getBERunUp(true);
                    position.columnValue("BE Run-up", beRunUp * (newQuantity / currentQty));
                    L.dbg(`Updated BE Run-up from ${beRunUp} to ${beRunUp * (newQuantity / currentQty)}`);

                    //add virtual columns

                    const runUp = position.getRunUp(true);
                    position.columnValue("Run-up", runUp * (newQuantity / currentQty));
                    L.dbg(`Updated Run-up from ${runUp} to ${runUp * (newQuantity / currentQty)}`);

                    const drawdown = position.getDrawDown(true);
                    position.columnValue("Drawdown", drawdown * (newQuantity / currentQty));
                    L.dbg(`Updated Drawdown from ${drawdown} to ${drawdown * (newQuantity / currentQty)}`);

                    await L.delay(200); // Slight delay to avoid overwhelming the UI
                }

                position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);
                balance += position.getProfit(true);
            }

            alert("All position quantities adjusted to represent fixed risk.");
        }
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'o') {
        if(confirm("Are you sure you want to set all position quantities to represent fixed USD risk? This action cannot be undone.")) {
            event.preventDefault();
            const positions = (L.session.positions || []).map(p => p).sort((a, b) => a.entryTime - b.entryTime).filter(p => p.exitTime);
            var balance = L.session.capital;
            const usdRisk = 200;

            for (const position of positions) {
                const currentRisk = position.getRisk(true);
                if (currentRisk !== usdRisk && currentRisk !== 0) {
                    const newQuantity = position.quantity * (usdRisk / currentRisk);
                    L.dbg(`Adjusting position ${position.positionId} quantity from ${position.quantity} to ${newQuantity}`);

                    position.quantity = newQuantity;
                    await L.dataOps.updatePositionQuantity(position.positionId, newQuantity);

                    position.risk(usdRisk);
                    L.dbg(`Updated Risk from ${currentRisk} to ${usdRisk}`);

                    const beRunUp = position.getBERunUp(true);
                    position.columnValue("BE Run-up", beRunUp * (usdRisk / currentRisk));
                    L.dbg(`Updated BE Run-up from ${beRunUp} to ${beRunUp * (usdRisk / currentRisk)}`);

                    const vBeRunUp = position.getVirtualBERunUp(true);
                    position.columnValue("Virtual BE Run-up", vBeRunUp * (usdRisk / currentRisk));
                    L.dbg(`Updated Virtual BE Run-up from ${vBeRunUp} to ${vBeRunUp * (usdRisk / currentRisk)}`);

                    const runUp = position.getRunUp(true);
                    position.columnValue("Run-up", runUp * (usdRisk / currentRisk));
                    L.dbg(`Updated Run-up from ${runUp} to ${runUp * (usdRisk / currentRisk)}`);

                    const vRunUp = position.getVirtualRunUp(true);
                    position.columnValue("Virtual Run-up", vRunUp * (usdRisk / currentRisk));
                    L.dbg(`Updated Virtual Run-up from ${vRunUp} to ${vRunUp * (usdRisk / currentRisk)}`);

                    const drawdown = position.getDrawDown(true);
                    position.columnValue("Drawdown", drawdown * (usdRisk / currentRisk));
                    L.dbg(`Updated Drawdown from ${drawdown} to ${drawdown * (usdRisk / currentRisk)}`);

                    const vDrawdown = position.getVirtualDrawDown(true);
                    position.columnValue("Virtual Drawdown", vDrawdown * (usdRisk / currentRisk));
                    L.dbg(`Updated Virtual Drawdown from ${vDrawdown} to ${vDrawdown * (usdRisk / currentRisk)}`);

                    await L.delay(200); // Slight delay to avoid overwhelming the UI
                }

                position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);
                balance += position.getProfit(true);
            }

            alert("All position quantities adjusted to represent 1% risk.");
        }
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'p') {
        L.session.allowPastDateNavigation = true;
    }

    if (event.ctrlKey && event.shiftKey && event.key === 'ArrowLeft') {
        L.session.allowPastDateNavigation = true;
        const currentBar = L.getCurrentBarInfo();
        await L.selectDateWithNavigation(currentBar.time - L.c().timeframeSeconds);
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'h') {
        L.refreshLoadedIndicators(L.c());
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'g') {
        L.arrangeCharts();
        if(confirm("Arrange charts regularly?")) {
            L.startArrangeChartsIdleTracking();
            clearInterval(L.arrangeChartsInterval);
            L.arrangeChartsInterval = setInterval(() => {
                if(!L.areChartsIdle()) {
                    return;
                }

                if(Date.now() - (L.lastArrangeChartsAt || 0) < L.arrangeChartsIntervalMs) {
                    return;
                }

                L.lastArrangeChartsAt = Date.now();
                L.arrangeCharts();
            }, 60 * 1000);
        }
    }

    if (event.altKey && event.shiftKey && event.key.toLowerCase() === 't') {
        const chart = L.c();
        const chartWidget = chart.chartWidget();
        const chartWidgetCollection = chartWidget.chartWidgetCollection();
        chartWidgetCollection.lock.trackTime.setValue(!chartWidgetCollection.lock.trackTime.value());
    }
})

L.toDate = function(ts) {
    if(ts > 1000000000000) {
        return new Date(ts);
    } else if(ts > 1000000000) {
        return new Date(ts * 1000);
    }
}

L.dates = function() {
    L.dbg(`${L.session?.currentDate} - ${L.toDate(L.session?.currentDate)}\n${L.r?.currentDate()?.value()} - ${L.toDate(L.r?.currentDate()?.value())}`);
}

L.scheduleAnalysisSnapshots = function() {
    var symbolInfo = L.c().chartModel().mainSeries().symbolInfo();

    function getNextTargetTime(hour, minute, second) {
        const now = new Date();
        let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second, 0);
        if (now >= target) {
            target.setDate(target.getDate() + 1);
        }
        return target;
    }

    async function scheduleFor(hour, minute, second, entireLayout) {
        const now = new Date();
        const target = getNextTargetTime(hour, minute, second);
        const msUntil = target - now;
        L.dbg(`Scheduling for ${hour}:${minute}:${second} (${msUntil / 1000 / 60}min)`)

        setTimeout(async () => {
            var proceed = true;
            if (new Date().getDay() === 0 || new Date().getDay() === 6) {
                if(!["BINANCE:BTCUSDT"].includes(symbolInfo.pro_name)) {
                    L.dbg("Weekend day... skipping");
                    proceed = false;
                }
            }

            if(proceed) {
                try {
                    //await L.delay(1000);
                    L.dbg("Snapshotting...");
                    await L.analysisSnapshots(800, false, entireLayout);
                } catch (e) {
                    if (L && L.toast) L.toast("Error running scheduled snapshots: " + e.message);
                }
            }
            scheduleFor(hour, minute, second); // reschedule for next day
        }, msUntil);
    }

    var scheduled = false;

    if(symbolInfo.root == "MNQ") {
        scheduleFor(8, 59, 0);
        scheduleFor(11, 59, 0);
        scheduleFor(14, 59, 0);
        scheduled = true;
    }
    
    if(symbolInfo.root == "MGC") {
        scheduleFor(8, 59, 45);
        scheduleFor(11, 59, 45);
        scheduleFor(14, 59, 45);
        scheduled = true;
    }

    if(scheduled) {
        L.arrangeCharts();
    }
}

L.arrangeChartsIdleMs = 30 * 1000;
L.arrangeChartsIntervalMs = 30 * 60 * 1000;
L.arrangeChartsAreaSelector = ".chart-gui-wrapper, .chart-markup-table, [class*='chart-container']";

L.startArrangeChartsIdleTracking = function() {
    L.arrangeChartsLastActivityAt = Date.now();
    L.lastArrangeChartsAt = Date.now();

    // Use real DOM mouse moves. crosshairSource().moved() also fires on live price ticks,
    // which would keep charts "active" forever during live trading.
    $(document).off("mousemove.arrangeChartsIdle").on("mousemove.arrangeChartsIdle", (event) => {
        if($(event.target).closest(L.arrangeChartsAreaSelector).length) {
            L.arrangeChartsLastActivityAt = Date.now();
        }
    });
}

L.areChartsIdle = function() {
    return Date.now() - (L.arrangeChartsLastActivityAt || 0) >= L.arrangeChartsIdleMs;
}

L.arrangeCharts = function() {
    L.applyOnCharts(chart => {
            const chartTimeScale = chart.getTimeScale();
            chartTimeScale.defaultRightOffset().setValue(3);
            chartTimeScale.setRightOffset(3);
            chartTimeScale.setBarSpacing(30);
            chart.chartWidget().actions().autoSeriesScale.execute();
        });
}

setTimeout(() => {
    if(L.detectPlatform() != "Edge")
        return;

    L.scheduleAnalysisSnapshots();
}, 10000);
