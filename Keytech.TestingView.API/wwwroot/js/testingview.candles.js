L.onCurrentDateChange = function (currentTime) {
    clearTimeout(L.session.meta.updateSessionTimeout);
    if (!L.session.meta.isAutoNavigating && !L.session.meta.replayTo && !L.session.meta.isReviewMode) {
        L.session.currentDate = currentTime;
        const dateIncrement = currentTime - (L.session.delayedCurrentDate || L.session.currentDate);

        L.session.meta.updateSessionTimeout = setTimeout(() => {
            L.session.delayedCurrentDate = L.session.currentDate;
            var updateSession = true;
            if(!L.session.meta.isReviewMode) {
                if (L.session.meta.dateIncrements.length > 10) {
                    const avg = L.session.meta.dateIncrements.reduce((a, b) => a + b, 0) / L.session.meta.dateIncrements.length;
                    if (dateIncrement < 0) {
                        updateSession = false;
                        L.session.meta.disableCurrentDateTracking = true;
                        if(!L.session.allowPastDateNavigation) {
                            L.messageBox(L.s(0, 8) /* TestingView error */, L.s(0, 1, (dateIncrement / 60 / 60 / 24).toFixed(1)) /* An accidental backward time jump was detected ({0} days).\n\nTestingView will exit at this point and restart the session. */ );
                            L.exit(false, false);
                        }
                    } else if (0 < dateIncrement && dateIncrement < avg * 100 && !L.session.meta.disableJumpDetection) {
                        L.session.meta.dateIncrements.push(dateIncrement);
                    } else if(dateIncrement > 3 * 60 * 60 * 24 && !L.session.meta.disableJumpDetection) {
                        updateSession = false;
                        L.messageBox(L.s(0, 2) /* Warning */ , L.s(0, 3, (dateIncrement / 60 / 60 / 24).toFixed(1)) /* An unusually large time jump was detected ({0} days).\n\nIf this was unintended, please exit TestingView at this point and restart the session. */ );
                        L.session.meta.disableCurrentDateTracking = true;
                    }
                } else if (dateIncrement > 0 && !L.session.meta.disableJumpDetection) {
                    L.session.meta.dateIncrements.push(dateIncrement);
                }
            }

            clearTimeout(L.session.meta.executeUpdateSessionTimeout);
            if (updateSession) {
                L.session.meta.executeUpdateSessionTimeout = setTimeout(() => {
                    if(!L.session.meta.disableCurrentDateTracking) {
                        L.dataOps.updateSession({ sessionId: L.session.sessionId, currentDate: L.session.currentDate }, L.session.meta.isReviewMode);
                    }
                }, 5000);
            }
        }, 1000);
    }
}

L.onBarActivity = async function (previousBarInfo, currentBarInfo) {
    var firstChart;
    for (const chart of L.getCharts()) {
        L.setHistory(chart);
        if(!firstChart) {
            firstChart = chart;
        }
    }

    await L.detectEntries();
    L.session.assessPositionsTracking();
    await L.updateActivePositions();
    L.updatePositionsList();
    await L.stopAtEvents();
    L.session.meta.lastKnownBarTime = firstChart.priceHistoryEntries[firstChart.priceHistoryEntries.length - 1]?.time;
}

L.getBarInfo = function (bar, duration) {
    if (!bar) return null;
    if (!bar.value) return null;

    return {
        time: bar.value[0],
        open: bar.value[1],
        high: bar.value[2],
        low: bar.value[3],
        close: bar.value[4],
        duration: duration
    };
}

L.getCurrentBarInfo = function (chart) {
    if (!chart) {
        chart = L.getCharts()[0];
    }

    return L.getBarInfo(chart.chartModel().mainSeries().bars().last(), chart.timeframeSeconds);
}

L.findPriceTime = function(chart, price) {
    // First try price history (tick-level accuracy)
    if (chart.priceHistoryEntries?.length > 1) {
        for (var i = chart.priceHistoryEntries.length - 1; i >= 1; i--) {
            var bar = chart.priceHistoryEntries[i];
            var previousBar = chart.priceHistoryEntries[i - 1];
            
            // Check if price crossed the entry level
            if ((previousBar.price <= price && price <= bar.price) ||
                (previousBar.price >= price && price >= bar.price)) {
                return bar.time;
            }
        }
    }
    
    // Then try bar history (OHLC candles)
    if (chart.barsHistoryEntries?.length > 0) {
        for (var i = chart.barsHistoryEntries.length - 1; i >= 0; i--) {
            var bar = chart.barsHistoryEntries[i];
            
            // Check if entry price is within bar's range
            if (bar.low <= price && price <= bar.high) {
                return bar.time;
            }
        }
    }
    
    // Fallback: use replay current date
    return L.r.currentDate().value();
}

L.skipTimeWithShortcuts = async function (seconds, nonStop) {
    var skipped = true;

    var symbolInfo;
    var sessionStartUtc;

    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).hide();
    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).show();

    if(seconds) {
        var currentTimestamp = L.r.currentDate().value();
        const ok = await L.waitUntil(async () => L.getCurrentReplayResolution());
        if(!ok) {
            return false;
        }
        L.session.meta.isSkippingCandles = true;
        var initialResolution = L.getCurrentReplayResolution();

        var skipBySeconds = L.resolutionToSeconds(initialResolution);
        var targetTimestamp = 0;

        if (nonStop) {
            targetTimestamp = currentTimestamp + seconds;
        }
        else {
            var hasChart = false;

            for (const chart of L.getCharts()) {
                if (chart.timeframeSeconds == seconds) {
                    targetTimestamp = chart.chartModel().mainSeries().bars().last().value[0] + seconds;
                    hasChart = true;
                    break;
                }
            }

            if (!hasChart) {
                symbolInfo = L.c().chartModel().mainSeries().symbolInfo();
                sessionStartUtc = L.getSessionStartUtcTime(symbolInfo.session, symbolInfo.timezone);
                targetTimestamp = currentTimestamp + (seconds - ((currentTimestamp - sessionStartUtc) % seconds));
            }
            
            while (currentTimestamp + skipBySeconds >= targetTimestamp) {
                targetTimestamp += seconds;
            }
        }

        const availableResolutions = (await L.getAvailableReplayResolutions()).filter(r => L.resolutionToSeconds(r) >= 60).sort((a, b) => L.resolutionToSeconds(b) - L.resolutionToSeconds(a));

        if(targetTimestamp >= Date.now() / 1000) {
            L.exit(false, false);
            await L.delay(100000);
        }

        while (currentTimestamp < targetTimestamp) {
            if (L.session.meta.isSkippingCandles) {
                const remainingSeconds = targetTimestamp - currentTimestamp;
                
                let bestResolution = availableResolutions.find(r => {
                    const resolutionSeconds = L.resolutionToSeconds(r);
                    if(resolutionSeconds <= remainingSeconds /* && resolutionSeconds <= skipBySeconds */) {
                        symbolInfo = symbolInfo ?? L.c().chartModel().mainSeries().symbolInfo();
                        sessionStartUtc = sessionStartUtc ?? L.getSessionStartUtcTime(symbolInfo.session, symbolInfo.timezone);
                        const resolutionTimestamp = currentTimestamp + (resolutionSeconds - ((currentTimestamp - sessionStartUtc) % resolutionSeconds)) - 1;
                        return resolutionTimestamp == currentTimestamp;
                    }
                });

                if (!bestResolution) {
                    break;
                }
            
                if(nonStop) {
                    const currentResolution = L.getCurrentReplayResolution(); 

                    if (L.resolutionToSeconds(currentResolution) != L.resolutionToSeconds(bestResolution)) {
                        await L.r.safeChangeReplayResolution(bestResolution);
                    }
                }

                const stepped = await L.stepForward();
                if (!stepped) {
                    skipped = false;
                    break;
                }
            }
            else {
                skipped = false;
                break;
            }

            currentTimestamp = L.r.currentDate().value();
        }

        //restoring resolution snaps the candle after timeframe change
        const currentResolution = L.getCurrentReplayResolution();
        const restoredResolution = await L.getMinReplayResolution();
        if (L.resolutionToSeconds(currentResolution) != L.resolutionToSeconds(restoredResolution)) {
            await L.r.safeChangeReplayResolution(restoredResolution);
        }
    } else {
        await L.stepForward();
    }

    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).show();
    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).hide();

    L.session.meta.isSkippingCandles = false;

    return skipped;
}

L.skipTime = async function (seconds, nonStop) {
    var skipped = true;

    var symbolInfo;
    var sessionStartUtc;

    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).hide();
    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).show();

    if(seconds) {
        var currentTimestamp = L.r.currentDate().value();
        const ok = await L.waitUntil(async () => L.getCurrentReplayResolution());
        if(!ok) {
            return false;
        }
        L.session.meta.isSkippingCandles = true;
        var initialResolution = L.getCurrentReplayResolution();

        var skipBySeconds = L.resolutionToSeconds(initialResolution);
        var targetTimestamp = 0;

        if (nonStop) {
            targetTimestamp = currentTimestamp + seconds;
        }
        else {
            var hasChart = false;

            for (const chart of L.getCharts()) {
                if (chart.timeframeSeconds == seconds) {
                    targetTimestamp = chart.chartModel().mainSeries().bars().last().value[0] + seconds;
                    hasChart = true;
                    break;
                }
            }

            if (!hasChart) {
                symbolInfo = L.c().chartModel().mainSeries().symbolInfo();
                sessionStartUtc = L.getSessionStartUtcTime(symbolInfo.session, symbolInfo.timezone);
                targetTimestamp = currentTimestamp + (seconds - ((currentTimestamp - sessionStartUtc) % seconds));
            }
            
            while (currentTimestamp + skipBySeconds >= targetTimestamp) {
                targetTimestamp += seconds;
            }
        }

        if(targetTimestamp >= Date.now() / 1000) {
            L.exit(false, false);
            await L.delay(100000);
        }

        while (currentTimestamp + skipBySeconds <= targetTimestamp) {
            if (L.session.meta.isSkippingCandles) {
                const stepped = await L.stepForward();
                if (!stepped) {
                    skipped = false;
                    break;
                }
            }
            else {
                skipped = false;
                break;
            }

            currentTimestamp = L.r.currentDate().value();
        }
    } else {
        await L.stepForward();
    }

    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).show();
    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).hide();

    L.session.meta.isSkippingCandles = false;

    return skipped;
}

L.stepForward = async function () {
    try {
        // If there's any active position that has a resolution smaller than the current replay resolution,
        // don't allow stepping forward. This prevents skipping candles that could contain SL/TP hits.
        // Cache the result for 10 seconds for performance.
        const isException = L.session.meta.isAutoNavigating || L.session.meta.isChangingSymbol || L.session.meta.isIntervalChanging || L.session.meta.isReviewMode;
        if(!isException) {
            const cacheKey = 'stepForward-minPositionChartResolution';
            const cacheEntry = L.cache.getIfExists(cacheKey);
            let minPositionResolutionSeconds;
            
            if (cacheEntry[0]) {
                minPositionResolutionSeconds = cacheEntry[1];
            } else {
                const activePositions = L.session.getActivePositions();
                if (activePositions.length > 0) {
                    minPositionResolutionSeconds = Math.min(...activePositions.map(p => p.meta.resolution));
                } else {
                    minPositionResolutionSeconds = 0;
                }
                L.cache.set(cacheKey, minPositionResolutionSeconds, 10);
            }

            if (minPositionResolutionSeconds > 0) {
                const currentReplayResolutionSeconds = L.resolutionToSeconds(L.getCurrentReplayResolution());
                if (currentReplayResolutionSeconds > minPositionResolutionSeconds) {
                    // Current replay resolution is larger than the smallest position resolution.
                    // Don't allow stepping forward to avoid skipping potential SL/TP hits.
                    L.stopSkipping();
                    L.messageBox(L.s(-9, -7) /* Step size too big */, L.s(-9, -6) /* Please switch to a lower timeframe to accurately monitor your open position. */);
                    return false;
                }
            }
        }
        
        L.session.meta.replayTo = null;
        L.session.meta.disableJumpDetection = false;

        await L.r.doStep();
        L.keepSessionActive();
        return true;
    } catch(e) {
        // L.exit(true, false);
        return false;
    }
}

L.startAutoplay = async function () {
    if (L.r.isAutoplayStarted().value()) {
        L.r.toggleAutoplay();
    }

    if (!L.session.meta.autoplayStarted) {
        L.session.meta.autoplayStarted = true;
        L.session.meta.replayTo = null;
        while (L.session.meta.autoplayStarted) {
            await L.stepForward();
        }
    }
}

L.stopAutoPlay = function () {
    L.session.meta.autoplayStarted = false;
    L.session.meta.forceStopPlayback = false;

    if (L.r.isAutoplayStarted().value()) {
        L.r.toggleAutoplay();
    }
}

L.startSkipping = function () {
    L.startAutoplay();

    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).hide();
    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).show();
}

L.stopSkipping = function () {
    L.stopAutoPlay();

    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).show();
    $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).hide();
    L.session.meta.isSkippingCandles = false;
}

L.stopAtEvents = async function () {
    if(L.session.meta.replayTo) {
        return false;
    }

    if(!(L.session.meta.autoplayStarted || L.r.isAutoplayStarted().value())) {
        return false;
    }

    if(L.session.meta.isReviewMode) {
        return false;
    }

    if(L.session.meta.isAutoNavigating) {
        return false;
    }

    return await L.stopAtPredefinedTime() || L.stopAtIntegrationPlots() || L.stopAtUserLine();
}

L.stopAtPredefinedTime = async function () {
    if(L.session.getParameter(L.sessionParameterIds.EnablePredefinedTimes) != L.s(0, 6) /* true */) {
        return false;
    }

    const currentReplayResolutionSeconds = L.resolutionToSeconds(L.getCurrentReplayResolution());
    if (currentReplayResolutionSeconds >= 4 * 60 * 60) {
        return false;
    }

    if(L.session.currentDate <= (L.session.meta.latestPredefinedTime || 0)) {
        return false;
    }

    var isNearPredefinedTime = false;

    const predefinedTimes = L.session.getParameter(L.sessionParameterIds.PredefinedTimes).split(L.s(0, 7) /* , */).map(t => t.trim()).filter(t => t.length > 0);
    const chart = L.getCharts()[0];

    const minResolution = await L.getMinReplayResolution(true);
    var minReplayResolution = L.resolutionToSeconds(minResolution);

    const formattedLastKnownBarTime = L.formatLocalTime(L.session.meta.lastKnownBarTime);
    const formattedLatestBarTime = L.formatLocalTime(chart.priceHistoryEntries[chart.priceHistoryEntries.length - 1].time + minReplayResolution * 4);

    if (predefinedTimes.length > 0) {
        for (const time of predefinedTimes) {
            if (formattedLastKnownBarTime < time && time <= formattedLatestBarTime) {
                L.toast(L.s(0, 0, time) /* Auto stopping candle playback at {0} */, 3000);
                L.stopSkipping();
                
                const opId = Math.random();
                if(!L.session.meta.forceStopPlayback) {
                    L.session.meta.forceStopPlayback = opId;
                }

                L.session.meta.autoStopRetries = 5;
                L.asyncInterval(async () => {
                    if(L.session.meta.autoStopRetries-- < 0) {
                        return -1;
                    }

                    if(L.session.meta.forceStopPlayback != opId) {
                        return -1;
                    }

                    if(L.formatLocalTime(L.session.currentDate + 1) < time) {           
                        await L.skipTime(minReplayResolution, false, 500);
                    } else {
                        // if (L.session?.sessionId && L.session?.currentDate) {
                        //     L.sessionChannel.postMessage({
                        //         type: 'DATE-SYNC',
                        //         sessionId: L.session.sessionId,
                        //         currentDate: L.session.currentDate
                        //     });
                        // }
                        L.session.meta.latestPredefinedTime = L.session.currentDate + minReplayResolution * 4;
                        return -1;
                    }
                }, 500, 1.1);
                
                isNearPredefinedTime = true;
                break;
            }
        }
    }

    return isNearPredefinedTime;
}

L.stopAtIntegrationPlots = function () {
    if(L.session.getParameter(L.sessionParameterIds.WatchIntegrationPlots) != L.s(0, 6) /* true */) {
        return false;
    }

    var eventFound = false;

    L.applyOnCharts(chart => {
        var eventPlots;
        for(var candlesCountback = 0; candlesCountback <= 1; candlesCountback++) {
            eventPlots = L.getPlots(chart, [`${L.s(-2, 7) /* TestingView */}.+`], true, false, candlesCountback);
            
            for (const plot in eventPlots) {
                if(plot == 'found') continue;
                if(L.toBool(eventPlots[plot]) && chart.previousEventPlots && !L.toBool(chart.previousEventPlots[plot])) {
                    L.stopSkipping();
                    const plotName = L.stripPrefixWithSeparators(plot, L.s(-2, 7) /* TestingView */);
                    L.toast(L.r.s(-1, -4, plotName, eventPlots[plot]) /* Auto stopping candle playback: {0} ({1}) */, 3000);
                    eventFound = true;
                    break;
                }
            }

            if(eventFound) {
                break;
            }
        }
        chart.previousEventPlots = eventPlots;
        if(eventFound) {
            return -1;
        }
    });
    
    return eventFound;
}

L.stopAtUserLine = function() {
    if(L.session.stopPlayBackLines && L.session.stopPlayBackLines.length > 0) {
        for(var i = L.session.stopPlayBackLines.length - 1; i >= 0; i--) {
            const lineInfo = L.session.stopPlayBackLines[i];
            const chart = lineInfo.chart;
            const line = L.getShapeById(lineInfo.id, chart, true);
            if(line) {
                const linePrice = line.lineDataSource().points()[0].price;
                var isTapped = false;

                const currentPrice = chart.priceHistoryEntries[chart.priceHistoryEntries.length - 1].price;
                const previousPrice = chart.priceHistoryEntries[chart.priceHistoryEntries.length - 2].price;
                if(currentPrice && previousPrice) {
                    if ((previousPrice <= linePrice && linePrice <= currentPrice) ||
                        (previousPrice >= linePrice && linePrice >= currentPrice)) {
                            isTapped = true;
                    }
                }

                const currentBar = chart.barsHistoryEntries[chart.barsHistoryEntries.length - 1];
                if(currentBar) {
                    if(currentBar.low <= linePrice && linePrice <= currentBar.high) {
                        isTapped = true;
                    }
                }
                 
                if(isTapped) {
                    L.stopSkipping();

                    L.session.stopPlayBackLines.splice(i, 1);
                    L.removeShapeById(lineInfo.id, chart, true);

                    return true;                    
                }
            } else {
                L.session.stopPlayBackLines.splice(i, 1);
            }
        }
    }

    return false;
}