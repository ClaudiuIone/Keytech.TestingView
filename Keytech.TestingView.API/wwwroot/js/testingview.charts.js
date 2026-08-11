L.onSymbolChanged = async function (chart, symbolInfo) {
    if(L.session) {
        L.session.meta.isChangingSymbol = true;
        L.cache.delete(L.s(1, 0) /* getCharts-true */);
        L.cache.delete(L.s(1, 1) /* getCharts-false */);

        const barsSnapshot = chart.chartModel().mainSeries().bars()._items.map(b => b.value.join()).join();

        chart.barsHistoryEntries = [];
        chart.priceHistoryEntries = [];
        L.brokerTrading.symbols = {};

        const ok = await L.waitUntil(async () => chart.chartModel().mainSeries().bars()._items.length != 0 && chart.chartModel().mainSeries().bars()._items.map(b => b.value.join()).join() != barsSnapshot);
        if(!ok) {
            L.session.meta.isChangingSymbol = false;
            return;
        }
            
        setTimeout(() => {
            L.session.meta.isChangingSymbol = false;
        }, 2000);
    }
}

L.onChartIntervalChanged = async function (chart, interval) {
    if(L.session) {
        L.session.meta.isIntervalChanging = true;
        L.cache.delete(L.s(1, 0) /* getCharts-true */);
        L.cache.delete(L.s(1, 1) /* getCharts-false */);

        const timeframeSeconds = chart.timeframeSeconds;
        const barsSnapshot = chart.chartModel().mainSeries().bars()._items.map(b => b.value.join()).join();
    
        clearTimeout(L.intervalChangingTimeout);
        L.session.meta.replayTo = L.session.currentDate;
        L.stopSkipping();

        //get the very last closing price
        const currentPrice = L.getCurrentBarInfo(chart).close;

        const ok = await L.waitUntil(async () => {L.getCharts(); return timeframeSeconds != chart.timeframeSeconds && chart.chartModel().mainSeries().bars()._items.length != 0 && chart.chartModel().mainSeries().bars()._items.map(b => b.value.join()).join() != barsSnapshot});
        if(!ok) {
            L.session.meta.isIntervalChanging = false;
            return;
        }
        await L.trigger(L.events.onTimeframeChange);

        if (L.session.getParameter(L.sessionParameterIds.PreventCandlePreviews) == L.s(0, 6) /* true */) {
            const currentBarInfo = L.getCurrentBarInfo(chart);
            if (currentBarInfo.close != currentPrice) {
                const currentBarTime = currentBarInfo.time;
                if(L.session.meta.replayTo - currentBarTime + 1 != chart.timeframeSeconds && L.isDateReacheableByPlayback(currentBarInfo.time, L.session.meta.replayTo)) {
                    await L.selectDateWithNavigation(L.session.meta.replayTo);
                }
            }
        }
        
        L.intervalChangingTimeout = setTimeout(() => {
            L.session.meta.isIntervalChanging = false;
        }, 2000);
    }  

}

L.setHistory = function (chart, session) {
    session = session || L.session;
    if(session.meta && !session.meta.isChangingSymbol && !session.meta.isIntervalChanging) {
        const bars = chart.chartModel().mainSeries().bars()._items;

        session.meta.lastKnownBarTime = session.meta.lastKnownBarTime || chart.priceHistoryEntries[chart.priceHistoryEntries.length - 1]?.time || session.currentDate;
        const previousBarsSnapshot = chart.barsHistoryEntries.slice(-5);
        chart.barsHistoryEntries = bars.slice(-20).map(b => L.getBarInfo(b, chart.timeframeSeconds))
        if(chart.barsHistoryEntries.length) {
            var adjusted = false;
            for (let i = chart.barsHistoryEntries.length - 1; i > chart.barsHistoryEntries.length - 5; i--) {
                const bar = chart.barsHistoryEntries[i];
                for(let j = previousBarsSnapshot.length - 1; j > 0; j--) {
                    const previousBar = previousBarsSnapshot[j];
                    if (previousBar.time == bar.time) {
                        if (previousBar.high != bar.high || previousBar.low != bar.low || previousBar.close != bar.close) {
                            bar.time += Math.ceil((((chart.barsHistoryEntries[i + 1]?.time) || session.currentDate) - bar.time) / 2);
                            chart.barsHistoryEntries.splice(i, 0, previousBar);
                            adjusted = true;
                            break;
                        }
                    }
                }

                if(adjusted) {
                    break;
                }
            }
        }
        
        if (!chart.priceHistoryEntries || chart.priceHistoryEntries.length == 0) {
            chart.priceHistoryEntries = chart.barsHistoryEntries.map(e => ({ price: e.close, time: e.time }));
        }

        const latestPrice = bars[bars.length - 1]?.value?.[4];
        if(latestPrice) {
            const latestPriceHistoryEntry = chart.priceHistoryEntries[chart.priceHistoryEntries.length - 1];
            if (chart.priceHistoryEntries.length == 0 || latestPriceHistoryEntry.price != latestPrice) {
                chart.priceHistoryEntries.push({ price: latestPrice, time: L.r.currentDate().value() });
                while(chart.priceHistoryEntries.length > 50) {
                    chart.priceHistoryEntries.shift();
                }
            }
        }
    }
}

L.c = function() {
    return L.t.activeChart();
}

L.getPositionChart = function (position, surpressError) {
    const chart = L.getShapeChart(position.getShape()?.shapeId) || L.getCharts().find(c => c.symbol() == position.symbol.symbolName || c.chartModel().mainSeries().symbolInfo().pro_name == position.symbol.symbolName);
    if (!chart && !surpressError) {
        throw new Error(L.s(1, 2) /* Chart not found while trying to get position chart */);
    }

    return chart;
}

L.getShapeChart = function (shapeId) {
    return L.getCharts().find(c => L.tryExec(() => {
        const shape = L.getShapeById(shapeId, c, true);
        if (shape) {
            return c.symbol() == shape.symbol() || c.chartModel().mainSeries().symbolInfo().pro_name == shape.symbol();
        }
    }));
}

L.getShapeById = function (shapeId, chart, surpressError) {
    if(!shapeId) {
        return null;
    }

    chart = chart || L.getShapeChart(shapeId);
    if (chart) {
        return L.tryExec(() => chart.getShapeById(shapeId), surpressError);
    }
}

L.removeShapeById = function (shapeId, chart, ignoreErrors) {
    chart = chart || L.getShapeChart(shapeId)
    if (chart) {
        chart.removeEntity(shapeId);
    } else {
        if (!ignoreErrors) {
            throw new Error(L.s(1, 3) /* Chart not found while trying to remove shape */);
        }
    }
}

L.onChartMouseMove = function (chart, event) {
    L.keepSessionActive();
}

L.keepSessionActive = function() {
    clearTimeout(L.session.meta.isActiveTimeout);
    L.session.meta.isActive = true;
    L.session.meta.isActiveTimeout = setTimeout(() => {
        L.session.meta.isActive = false;
    }, 30000);
}

L.getCharts = function (reverse) {
    const cacheKey = L.s(1, 4, reverse) /* getCharts-{0} */;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    } else {
        var chartInfoEntries = [];

        const chartCount = L.t.chartsCount();

        for (let i = 0; i < chartCount; i++) {
            const chart = L.t.chart(i);
            chart.timeframeSeconds = L.resolutionToSeconds(chart.resolution());
            chart.timeframeText = L.timeframes.find(tf => tf.value == chart.timeframeSeconds)?.text || chart.resolution();

            if (!chart.__changeMonitored) {
                chart.onSymbolChanged().subscribe(null, (symbolInfo) => L.onSymbolChanged(chart, symbolInfo));
                chart.chartModel().mainSeries().onIntervalChanged().subscribe(null, (interval, t) => L.onChartIntervalChanged(chart, interval));
                chart.__changeMonitored = true;
                chart.__uid = L.getUid();
            }

            if(!chart.__mouseMonitored && L.session?.sessionColumns?.find(c => c.columnName == L.r.s(2, -6) /* Analysis Time */).visible) {
                chart.chartModel().crosshairSource().moved().subscribe(null, (e) => L.onChartMouseMove(chart, e));
                chart.__mouseMonitored = true;
            }

            chartInfoEntries.push(chart);
        }

        chartInfoEntries.sort((c1, c2) => reverse ? (c2.timeframeSeconds - c1.timeframeSeconds) : (c1.timeframeSeconds - c2.timeframeSeconds));
        L.cache.set(cacheKey, chartInfoEntries, 5); // Cache for 5 sec
        return chartInfoEntries;
    }
}

L.applyOnCharts = function (action, reverse, symbol) {
    var actions = [];

    const charts = L.getCharts(reverse);
    for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];
        if(!symbol || chart.symbol() == symbol) {
            const result = action(chart, i);
            actions.push(result);
            if(result == -1) {
                break;
            }
        }
    }

    return actions;
}

L.applyOnChartsAsync = async function (action, reverse, ignoreErrors, symbol) {
    var actions = [];
    const charts = L.getCharts(reverse);
    for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];
        if(!symbol || chart.symbol() == symbol) {
            try {
                const result = await action(chart, i);
                actions.push(result);
                if(result == -1) {
                    break;
                }
            } catch (e) {
                if(ignoreErrors) {
                    console.warn(e);
                } else {
                    throw e;
                }
            }
        }
    }

    return actions;
}

L.hasSameSymbol = function(chart, position) {
    return chart.symbol() == position.symbol.symbolName || chart.chartModel().mainSeries().symbolInfo().pro_name == position.symbol.symbolName;
}

L.saveChartOffsets = function() {
    L.applyOnCharts(chart => {
        const chartTimeScale = chart.getTimeScale();
        const rightOffset = chartTimeScale.rightOffset();
        chartTimeScale.defaultRightOffset().setValue(rightOffset);
    });
}

L.getStudies = function(chart) {
    const cacheKey = `getStudies-${chart.__uid}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    } else {
        var studies = chart.getAllStudies();
        L.cache.set(cacheKey, studies, 1);
        return studies;
    }
}

L.getStudyById = function(chart, studyId) {
    const cacheKey = `getStudyById-${chart.__uid}-${studyId}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    } else {
        const study = chart.getStudyById(studyId).study();
        L.cache.set(cacheKey, study, 1);
        return study;
    }
}

L.getPlots = function (chart, plotNames, useRegex, stopWhenAllFound, candlesCountback) {
    var plots = {};
    var matchedNames = {};

    const plotMatchers = plotNames.map(pn => {
        if (useRegex) {
            return { name: pn, regex: new RegExp(pn) };
        } else {
            return { name: pn };
        }
    });

    function matchPlotName(plotTitle) {
        const cachedKey = `matchPlotName-${plotTitle}-${useRegex}`;
        const cachedEntry = L.cache.getIfExists(cachedKey);
        if(cachedEntry[0]) {
            return cachedEntry[1];
        }

        for (const matcher of plotMatchers) {
            if (useRegex) {
                if (matcher.regex.test(plotTitle)) {                    
                    const match = { matcherName: matcher.name, actualName: plotTitle };
                    L.cache.set(cachedKey, match, 3600);
                    return match;
                }
            } else if (matcher.name === plotTitle) {
                const match = { matcherName: matcher.name, actualName: plotTitle };
                L.cache.set(cachedKey, match, 3600);
                return match;
            }
        }
        
        return null;
    }

    for (var studyMeta of L.getStudies(chart)) {
        const study = L.getStudyById(chart, studyMeta.id);
        const metaInfo = study.metaInfo();

        if (!study.isVisible()) {
            continue;
        }

        for (var ps in metaInfo.styles) {
            const plotTitle = metaInfo.styles[ps].title;
            const match = matchPlotName(plotTitle);
            if (match) {
                for (var i = 0; i < metaInfo.plots.length; i++) {
                    var p = metaInfo.plots[i];
                    if (p.id == ps) {
                        candlesCountback = candlesCountback || 0;
                        const plotValues = study.plots()?._items.slice(-(candlesCountback + 1))[0]?.value;
                        if (plotValues) {
                            const plotValue = plotValues[i + 1];
                            // Store under the actual plot title name
                            plots[match.actualName] = plotValue;
                            // Track that this matcher found something
                            matchedNames[match.matcherName] = true;
                        }
                        break;
                    }
                }
            }
        }

        if (stopWhenAllFound) {
            // Check if all matchers have found at least one match
            let allFound = true;
            for (const matcher of plotMatchers) {
                if (!matchedNames[matcher.name]) {
                    allFound = false;
                    break;
                }
            }
            if (allFound) {
                break;
            }
        }
    }

    plots.found = Object.keys(plots).length > 0;
    return plots;
}

L.onCrossHairMoved = function(chart, crossHairInfo) {
    L.mousePrice = crossHairInfo.price;
}

L.r.safeChangeReplayResolution = async function (resolution) {
    L.r._seenResolutions = L.r._seenResolutions || {};
    if(!L.r._seenResolutions[resolution]) {
        await L.delay(1000);
    }
    try {
        L.r.changeReplayResolution(resolution);
        L.r.autoReplayResolution().setValue(resolution);
        L.r._seenResolutions[resolution] = true;
    } catch(e) {
        throw "233" + e;
    }
}