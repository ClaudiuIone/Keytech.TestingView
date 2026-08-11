/*
--------------------------------------
Operations UI
--------------------------------------
*/

L.selectDate = async function (date) {
    L.stopAutoPlay();
    var currentDate = L.r.currentDate().value();

    L.applyOnCharts(chart => {
        chart.barsHistoryEntries = [];
        chart.priceHistoryEntries = [];
    });
    
    if(date >= Date.now()) {
        L.exit(false, false);
        await L.delay(100000);
    }

    await L.r.selectDate(date);
    await L.trigger(L.events.onSelectDate);

    const ok = await L.waitUntil(async () => currentDate != L.r.currentDate().value());
    if(!ok) {
        return false;
    }
    await L.getAvailableReplayResolutions();
}

L.selectDateWithNavigation = async function (timestamp) {
    if (L.toBool(L.session.getParameter(L.sessionParameterIds.PreventCandlePreviews))) {
        L.session.meta.isAutoNavigating = true;
        
        // Get the chart with the highest timeframeSeconds
        const chart = L.getCharts().slice(-1)[0];
        const timeframeSeconds = chart.timeframeSeconds;
        
        // Find the candle open time by deducing from existing bar data
        const bars = chart.chartModel().mainSeries().bars();
        let candleOpenTime = null;
        
        // Find the first candle that opened in the last day to establish the pattern
        const oneDayAgo = L.r.currentDate().value() - 86400;
        let referenceBarTime = null;
        
        for (let i = 0; i < bars.size(); i++) {
            const barTime = bars.valueAt(i)[0];
            if (barTime >= oneDayAgo) {
                referenceBarTime = barTime;
                break;
            }
        }
        
        if (referenceBarTime) {
            // Calculate which candle boundary is just before the target timestamp
            // e.g., if referenceBarTime is 1AM and timeframe is 4h: pattern is 1AM, 5AM, 9AM, 1PM...
            const offset = timestamp - referenceBarTime;
            const candleCount = Math.floor(offset / timeframeSeconds);
            candleOpenTime = referenceBarTime + candleCount * timeframeSeconds;
        }
        
        // Go to just before the candle opens (end of previous candle)
        if(candleOpenTime > 0 && candleOpenTime <= timestamp) {
            await L.selectDate(new Date(candleOpenTime * 1000));
            
            if(!L.session._resolutionsInitialized) {
                await L.selectResolution(0, 1000);
                L.session._resolutionsInitialized = true;
            }

            // Now skip forward to the target timestamp
            if(await L.isDateReacheableByPlayback(L.r.currentDate().value(), timestamp)) {
                await L.skipTime(timestamp - L.r.currentDate().value(), true, 500);
            } else {
                // Too far to skip, just navigate directly
                await L.selectDate(new Date((timestamp + 1) * 1000));
            }
        } else {
            // Fallback: navigate directly
            await L.selectDate(new Date((timestamp + 1) * 1000));
        }
    } else {
        await L.selectDate(new Date(timestamp * 1000));
    }
        
    setTimeout(() => {
        L.session.meta.isAutoNavigating = false;
    }, 2000);
}

L.isDateReacheableByPlayback = async function(fromTimestamp, toTimestamp) {
    var minReplayResolution = await L.getMinReplayResolution(true);
    const minReplayResolutionSeconds = L.resolutionToSeconds(minReplayResolution);

    return ((toTimestamp - fromTimestamp) / minReplayResolutionSeconds < 250) && ((toTimestamp - fromTimestamp) % minReplayResolutionSeconds === 0 || (toTimestamp - fromTimestamp + 1) % minReplayResolutionSeconds === 0 || (toTimestamp - fromTimestamp - 1) % minReplayResolutionSeconds === 0);
}

L.exit = function (force, showConfirmation) {
    L.removeGeneratedShapes();
    var isSaved = false;

    if (!force) {
        const saveService = L.t.getSaveChartService();
        saveService.chartSaved().subscribe(null, () => {
            clearTimeout(L.exitTimeout);
            L.exitTimeout = setTimeout(() => {
                if (showConfirmation) {
                    L.tryExecAsync(async () => L.r.replayTimingMode().setValue("manual"));
                    location.reload();
                }
            }, 500);
        });
        if (showConfirmation) {
            L.confirmBox(L.r.s(9, -6) /* Exit TestingView mode */, L.r.s(9, -7) /* Do you want to exit TestingView mode and refresh chart? */, (ok) => {
                showConfirmation = ok;
                if(ok) {
                    L.tryExecAsync(async () => L.r.replayTimingMode().setValue("manual"));
                    saveService.saveExistentChart();
                    L.messageBox(L.r.s(9, -8) /* Saving chart */, L.r.s(9, -9) /* Please wait a moment... */);
                }
            });
        } else {
            saveService.saveExistentChart();
            showConfirmation = true;
            if(isSaved) {
                L.tryExecAsync(async () => L.r.replayTimingMode().setValue("manual"));
                location.reload();
            }
        }
    } else {
        if (showConfirmation) {
            L.confirmBox(L.r.s(9, -6) /* Exit TestingView mode */, L.r.s(9, -7) /* Do you want to exit TestingView mode and refresh chart? */, (ok) => {
                if (ok) {
                    L.tryExecAsync(async () => L.r.replayTimingMode().setValue("manual"));
                    location.reload();
                }
            });
        } else {
            L.tryExecAsync(async () => L.r.replayTimingMode().setValue("manual"));
            location.reload();
        }
    }
}

/*
--------------------------------------
Data processing
--------------------------------------
*/

L.isNumber = function (value) {
    return typeof value === "number" && !isNaN(value);
}

L.sanitizeId = function(id) {
    // Strip characters incompatible with HTML IDs in jQuery context
    return String(id).replace(/[^a-zA-Z0-9_-]/g, '');
}

L.toBool = function(value) {
    if (typeof value === 'string') {
        value = value.trim().toLowerCase();
        return value !== '' && value !== 'false' && value !== '0';
    }
    return Boolean(value);
}

L.coalesce = function(...values) {
    for(var v of values) {
        if(v || v === 0) {
            return v;
        }
    }

    return values[0];
}

L.getContractSize = async function (symbolName, symbolType) {
    const cacheKey = `getContractSize-${symbolName}-${symbolType}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    } else {
        var symbolRuleContractSizes = await L.dataOps.getSymbolRuleContractSizes(symbolType);
        for (const rule of symbolRuleContractSizes) {
            if (rule.symbolNameRegex) {
                var regex = new RegExp(rule.symbolNameRegex);
                if (regex.test(symbolName)) {
                    L.cache.set(cacheKey, rule, 3600);
                    return rule;
                }
            } else {
                return rule;
            }
        }
    }
}

/*
--------------------------------------
General Operations
--------------------------------------
*/

L.trigger = async function (events, params) {
    var success = true;
    for (const event of events) {
        if(!await event(params)) {
            success = false;
        }
    }
    
    return success;
}

L.subscribe = function (events, eventHandler) {
    if(!events.includes(eventHandler)) {
        events.push(eventHandler);
        return true;
    }

    return false;
}

L.unsubscribe = function (events, eventHandler) {
    const index = events.indexOf(eventHandler);
    if (index !== -1) {
        events.splice(index, 1);
        return true;
    }
    
    return false;
}

L.isTyping = function () {
    const activeElement = document.activeElement;
    if (activeElement.tagName.toUpperCase() == 'INPUT' 
        || activeElement.tagName.toUpperCase() == 'TEXTAREA' 
        || activeElement.isContentEditable) {
        return true;
    }
}

L.delay = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

L.waitUntil = async function(condition, maxRetries, delayMs) {
    if(!maxRetries) {
        maxRetries = 50;
    }
    if(!delayMs) {
        delayMs = 100;
    }
    
    var result;
    while(maxRetries-- > 0 && !(result = await condition())) {
        await L.delay(delayMs);
    }

    return result;
}

L.asyncInterval = async function (callback, delay, decay, ignoreSession) {
    const sessionId = L.session?.sessionId || 0;
    var adjustedDelay = delay;

    while (ignoreSession || L.session?.sessionId === sessionId) {
        await L.delay(adjustedDelay);
        try {
            const r = await callback();
            if(r === -1) {
                break;
            }
        } catch (e) {
            console.warn(L.r.s(-2, 2) /* Error while executing timer */, e);
        }

        if(decay) {
            adjustedDelay *= decay;
            if(adjustedDelay > delay * 2) {
                adjustedDelay = delay * 2;
            }
            if(adjustedDelay < delay / 2) {
                adjustedDelay = delay / 2;
            }
        }
    }
}

L.tryExec = function (func, surpressError) {
    try {
        return func();
    } catch (e) {
        if (!surpressError) {
            console.warn(e);
        }
    }
}

L.tryExecAsync = async function (func, surpressError) {
    try {
        return await func();
    } catch (e) {
        if (!surpressError) {
            console.warn(e);
        }
    }
}

L.changeSymbol = async function (chart, symbolName) {
    chart.changingSymbol = true;
    await chart.setSymbol(symbolName);
    const ok = await L.waitUntil(async () => !chart.changingSymbol);
    if(!ok) {
        chart.changingSymbol = false;
        return false;
    }
    
    return true;
}

L.cs = function (obj, i, j, ...params) {
    var s = obj[i][j];
    if (!s) {
        throw "232";
    }

    if(params.length === 0) {
        return s;
    } else if (params.length == 1) {
        return s.replace("{0}", params[0]);
    } else if (params.length == 2) {
        return s.replace("{0}", params[0]).replace("{1}", params[1]);
    } else {
        return s.replace(/{(\d+)}/g, (match, index) => params[index]);
    }
}

L.s = function (i, j, ...params) {
    return L.cs(L, i, j, ...params);
}

L.r.s = function (i, j, ...params) {
    return L.cs(L.r, i, j, ...params);
}

L.parseLoc = function(l, target) {
    var i = 0;
    for(const line of l.split("υ")) {
        const parts = line.split("ν", 2);
        if(parts.length < 2) {
            i = parts[0];
            target[i] = {};
        } else {
            target[i][parts[0]] = parts[1].replaceAll("<n>", "\n");
        }
    }
}

L.localize = function() {
    return Promise.all([
        L.dataOps.getLoc(1).then(l => L.parseLoc(l, L)),
        L.dataOps.getLoc(2).then(l => L.parseLoc(l, L.r))
    ]);
}

L.json = function (obj) {
    return JSON.stringify(obj,  (key, value) => {  if (value !== null) return value; });
}

L.playChime = function (variant) {
    L.tryExec(() => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        if(variant == 1) {
            oscillator.frequency.setValueAtTime(1220, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(780, audioContext.currentTime + 0.1);
        } else if(variant == 2) {
            oscillator.frequency.setValueAtTime(1420, audioContext.currentTime); 
            oscillator.frequency.setValueAtTime(1420, audioContext.currentTime + 0.1); 
        } else if(variant == 3) {
            oscillator.frequency.setValueAtTime(700, audioContext.currentTime); 
            oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.1); 
        } else {
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
            oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.1); // E6 note
        }
        

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    });
}

L.configureGlobals = function() {
    L.timeframes = [
        { text: L.r.s(-1, 0) /* 5s */, value: 5 },
        { text: L.r.s(-1, 1) /* 30s */, value: 30 },
        { text: L.r.s(-1, 2) /* 1m */, value: 60 },
        { text: L.r.s(-1, 3) /* 5m */, value: 60 * 5 },
        { text: L.r.s(-1, 4) /* 15m */, value: 60 * 15 },
        { text: L.r.s(-1, 5) /* 30m */, value: 60 * 30 },
        { text: L.r.s(-1, 6) /* 1h */, value: 60 * 60 },
        { text: L.r.s(-1, 7) /* 2h */, value: 60 * 60 * 2 },
        { text: L.r.s(-1, 8) /* 4h */, value: 60 * 240 },
        { text: L.r.s(-1, 9) /* 1D */, value: 60 * 1440 },
        { text: L.r.s(-2, 0) /* 1W */, value: 60 * 1440 * 7 }
    ];
}

L.isSameSymbol = function(symbol1, symbol2) {
    const [exchange1, instrument1] = symbol1.split(':');
    const [exchange2, instrument2] = symbol2.split(':');
    if (exchange1 !== exchange2) return false;

    return instrument1.substring(0, 3) === instrument2.substring(0, 3);
}

L.escapeRegExp = function(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

L.stripPrefixWithSeparators = function(str, prefix, { caseInsensitive = true } = {}) {
  const p = L.escapeRegExp(prefix);

  // Option A (practical, matches your examples)
  const re = new RegExp(
    `^${p}(?:\\s*[-:/\\.,]\\s*|\\s+)`,
    caseInsensitive ? "i" : ""
  );

  // If you also want to remove "prefix" even when it has NO separator after it,
  // use this instead (more aggressive):
  // const re = new RegExp(`^${p}(?:[\\s\\W_]+)?`, caseInsensitive ? "i" : "");

  return str.replace(re, "");
}

L.getUid = function() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

L.detectPlatform = function() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if(userAgent.indexOf("TradingView") != -1) {
        return "TradingView";
    }

    if(userAgent.indexOf("Edg") != -1) {
        return "Edge";
    }
    
    if(userAgent.indexOf("Chrome") != -1) {
        return "Chrome";
    }
}

L.getCurrentReplayResolution = function() {
    return L.r.currentReplayResolution().value() || "1D";
}

L.newGuid = function() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}