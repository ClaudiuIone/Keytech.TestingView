L.startSession = async function (sessionId) {
    L.csq();

    // Show session loader overlay
    L.showSessionLoader();

    L.removeGeneratedShapes();
    
    $(`button#${L.s(3, -2) /* header-toolbar-replay */}`).hide();
    $(`button#${L.s(3, -2) /* header-toolbar-replay */}`).next(L.s(-5, -9) /* div[class*='wrapper']:has(div[class*='arrow']) */).hide();
    $(`button#${L.s(-7, -3) /* header-toolbar-alerts */}`).hide();

    //remove trade buttons
    setTimeout(() => $(`${L.s(-7, -2) /* div[class*="wrapper-"]:has(button[data-qa-id="trade-panel-button"]) */}`).hide(), 10000);
    setTimeout(() => $(`${L.s(-7, -4) /* #header-toolbar-publish-desktop */}`).hide(), 10000);

    setTimeout(() => TradingViewApi._chartWidgetCollection._options.widgetOptions.customerReadableName = L.s(-7, -5) /* TestingView.com */, 10000);

    $(`button#${L.s(3, -3) /* header-toolbar-backtst */}`).attr("aria-pressed", true);
    $(`button#${L.s(3, -3) /* header-toolbar-backtst */}`).addClass("isActive");
    $("head").append(L.s(-6, -1) /* <style>div.chart-toolbar.chart-controls-bar button[data-name="time-zone-menu"] div.js-button-text {display:none}</style> */);

    L.session = await L.dataOps.getSession(sessionId);
    L.session.isNew = new Date(L.session.creationDate).getTime()  > new Date().getTime() - 300000;

    L.syncWithDefaultColumns(L.session.sessionColumns);
    L.setSessionFunctions(L.session);

    L.session.positions = await L.dataOps.getSessionPositions(sessionId);

    Object.defineProperty(L.session, 'meta', { value: {}, writable: true, enumerable: false });
    L.session.meta.balance = await L.getBalanceAfterPositions(L.session.capital, L.session.positions);
    L.session.equity = L.session.meta.balance;
    L.session.isRandomized = L.session.randomizedStartDate;
    L.session.allowPastDateNavigation = false;
    
    const activePositions = L.session.getActivePositions();
    for(const position of activePositions) {
        L.session.equity += position.getProfit();
    }

    L.dataOps.updateSession({ sessionId: L.session.sessionId, equity: L.session.equity}, false);

    L.session.meta.sortByDesc = true;
    L.session.meta.dateIncrements = [];
    L.session.meta.stats = {};
    
    for (const position of L.session.positions) {
        for (const shape of position.positionShapes) {
            Object.defineProperty(shape, 'meta', { value: {}, writable: true, enumerable: false });
        }
    }

    L.monitorEntryShapes();

    const currentBarTime = L.getCharts()[0].chartModel().mainSeries().bars()._items.slice(-1)[0].value[0];

    const onReplayMode = async function () {
        while (!L.getCharts()[0].chartModel().mainSeries().bars()._items.slice(-1)[0] || L.getCharts()[0].chartModel().mainSeries().bars()._items.slice(-1)[0].value[0] == currentBarTime) {
            await L.delay(1000);
        }

        L.r.isReplayStarted().unsubscribe(onReplayMode);
        L.tryExec(() => L.r._replayUIController.tradingUIController().destroy(), true);
        $(`div[class*=${L.r.s(-4, 9) /* sellBuyAndPresetsButtons */}]`).hide();
        L.brokerTrading.keepBrokerInSync();
        L.subscribe(L.events.broker.onTradeOpen, () => {
            L.messageBox(L.s(-9, -8) /* Open trade */, L.s(-9, -9) /* To open a new position, use the Long/Short Position tool/drawing, then play the candles until its entry price is hit<n><n>For more how-tos, please watch instruction videos on TestingView.com */);
        });

        L.createUI();
        L.asyncInterval(async () => {
            L.createReplayControls();
            L.createPositionsListHeader();

            const replayTradingButton = $(L.s(1, -5) /* button[data-qa-id=replay_trading] */);
            replayTradingButton.attr("aria-label", replayTradingButton.attr("data-active") == L.s(0, 6) /* true */ ? L.s(3, -4) /* Close TestingView Journal */ : L.s(3, -5) /* Open TestingView Journal */);
            replayTradingButton.attr("data-tooltip", replayTradingButton.attr("data-active") == L.s(0, 6) /* true */ ? L.s(3, -4) /* Close TestingView Journal */ : L.s(3, -5) /* Open TestingView Journal */);
        }, 1000);

        L.r.currentDate().subscribe(L.onCurrentDateChange);
            
        setInterval(() => {
            L.tryExec(() => { L.r.changeAutoplayDelay(1000); }, true);
                
            setTimeout(() => {
                L.tryExec(() => { L.r.changeAutoplayDelay(100); }, true);
            }, 1000);
        }, 10000);

        L.asyncInterval(async () => {
            if (!L.session.meta.autoplayDelayChangeDate) {
                L.session.meta.autoplayDelayChangeDate = new Date().getTime() / 1000;
            }

            const currentTime = new Date().getTime() / 1000;
            if (currentTime - L.session.meta.autoplayDelayChangeDate > 10) {
                L.session.meta.autoplayDelayChangeDate = currentTime;
                L.tryExec(() => {
                    L.r.changeAutoplayDelay(1000);
                    setTimeout(() => {
                        L.r.changeAutoplayDelay(100);
                    }, 2000);
                }, true);
            }
        }, 50);

        var ctx = {
            previousBarInfo: {},
            replayTimestampCounter: 5
        };

        L.asyncInterval(() => L.pollBarActivity(ctx), 10);
        L.asyncInterval(() => L.saveChartOffsets(), 5000);
        // L.subscribeToData(ctx);

        for (const position of L.session.getActivePositions()) {
            const chartShapes = await L.drawShapeForPosition(position);
            const shape = chartShapes[0];
            if(shape) {
                position.meta.hasShapeRedraw = false;
                L.keepShapeInfoInSync(position, shape, shape.lineDataSource().properties());
            }
        }

        L.initSessionChannel();
        L.replayInitialized = true;
        L.hideSessionLoader();
        L.configureContextMenu();
    };

    L.applyOnCharts(chart => {
        const chartModel = chart.chartModel();
        const chartWidget = chart.chartWidget();
        if(!chartModel.mainSeries().priceScale().isScaleSeriesOnly()) {
            chartWidget.actions().scaleSeriesOnly.execute();
        }

        chartWidget.properties().chartEventsSourceProperties.visible.setValue(true)
        chartWidget.properties().chartEventsSourceProperties.futureOnly.setValue(false);
        chartModel.watermarkSource().properties().childs().replay.setValue(false);
    });

    L.r._replayUIController._ignoreReplayStateRestoring = true;

    //L.subscribe(L.events.onNewReplayResolutions, L.resetReplayResolution);
    L.subscribe(L.events.onTimeframeChange, L.resetReplayResolution);

    L.r.replayMode().setValue("AllCharts");
    L.r.replayResolutions().subscribe(replayResolutions => L.trigger(L.events.onNewReplayResolutions, replayResolutions));

    L.r.isReplayStarted().subscribe(onReplayMode);

    var timeNow = new Date();
    var timeNowInTimezone = L.getDateInTimezone(timeNow / 1000, L.c().getTimezone());

    const offsetHours = timeNowInTimezone.getUTCHours() - timeNow.getHours();
    const offsetMinutes = timeNowInTimezone.getUTCMinutes() - timeNow.getMinutes();

    const adjustedDateTime = new Date(L.session.currentDate * 1000);
    adjustedDateTime.setHours(adjustedDateTime.getHours() - offsetHours);
    adjustedDateTime.setMinutes(adjustedDateTime.getMinutes() - offsetMinutes);
    
    if(user.badges?.length == 0 && L.session.isNew) {
        var changedResolution = false;
        await L.applyOnChartsAsync(async chart => { if(L.resolutionToSeconds(chart.resolution()) < 86400) { await chart.setResolution("D"); changedResolution = true; } });
        if(changedResolution) {
            L.toast(L.r.s(-2, -1) /* Your TradingView plan does not support replay on lower timeframes. The timeframe has been switched to Daily (D) */, 5000);
            await L.delay(1000);
        }
    }

    await L.selectDateWithNavigation(L.session.currentDate);
    if(!L.isEbacktestingPanelOpen()) {
        L.toast(L.s(3, -7) /* Session synced to last active time. You can now open the TestingView journal panel below to view your trades. */, 10000);
        clearTimeout(L.session.meta.showLoaderTimeout);
        L.clearPositionRowsCache();
        $(`.${L.r.s(0, -2) /* backtst-button-loader */}`).hide();
    }

    L.brandSnapshots();

    setTimeout(() => {
        if (L.session.getParameter(L.sessionParameterIds.ShowOpenPositionTip) != "false") {
            L.c().createAnchoredShape({ x: 0.1, y: 0.3 }, { shape: "anchored_text", text: L.s(3, -9, L.session.currencyId) /* Quick tip:\nTo enter a position, simply \n- draw a Long Position or Short Position on the chart\n- double click to set its risk percentage or {0}\n- and start playing some candles */, overrides: { color: "white", backgroundColor: "rgb(0,0,0)", backgroundTransparency: 1, fillBackground: true, fontsize: 18 } })
            L.session.setParameter(L.sessionParameterIds.ShowOpenPositionTip, "false");
        }
    }, 10000);

    setInterval(() => {
        if(!L.r.isReplayStarted().value()) {
            L.exit(false, false);
        }
    }, 10000);
}

L.updateSessionCapitalInfo = function () {
    if (L.session.meta.sessionCapitalCalculationTimeout) {
        clearTimeout(L.session.meta.sessionCapitalCalculationTimeout);
    }

    L.session.meta.sessionCapitalCalculationTimeout = setTimeout(() => {
        const balanceValue = (L.session.meta.balance || L.session.capital)
            .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        $(`.${L.s(4, -1) /* backtst-session-balance-balance-value */}`).text(balanceValue);

        const equityValue = L.session.equity
            .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        $(`.${L.s(4, -2) /* backtst-session-balance-equity-value */}`).text(equityValue);

        if (L.session.getActivePositions().length == 0) {
            $(`.${L.s(4, -3) /* backtst-session-balance-equity */}`).hide();
        } else {
            $(`.${L.s(4, -3) /* backtst-session-balance-equity */}`).show();
        }

        $(`.${L.s(4, -4) /* backtst-stats-button */}`)
            .attr("aria-label", L.stats.getStatsSummary())
            .attr("data-tooltip", L.stats.getStatsSummary());
        
    }, 1000);
}

L.setSessionFunctions = function (session) {
    session.retrieveParameters = async function () {
        session.sessionParameters = await L.dataOps.getSessionParameters(L.session.sessionId);
    };

    session.getParameter = function (parameterId) {
        return session.sessionParameters?.find(p => p.parameterId == parameterId)?.parameterValue || "";
    };

    session.setParameter = function (parameterId, value) {
        L.dataOps.setSessionParameterValue(L.session.sessionId, parameterId, value);
        if (!session.sessionParameters) {
            session.sessionParameters = [{ parameterId, parameterValue: value }];
        }

        const param = session.sessionParameters.find(p => p.parameterId == parameterId);
        if (param) {
            param.parameterValue = value;
        }
    };
    session.getActivePositions = function () {
        return (L.session?.positions || []).filter(p => !p.exitTime);
    };
    session.stopAssessTracking = function () {
        for (const position of L.session.positions) {
            position.meta.trackVirtualRunUp = false;
            position.meta.trackVirtualDrawDown = false;
            position.meta.trackVirtualBeRunUp = false;
        }
    };
    session.assessPositionsTracking = async function() {
        for (const position of L.session.positions) {
            if(position.meta.trackVirtualRunUp || position.meta.trackVirtualDrawDown || position.meta.trackVirtualBeRunUp) {
                const cacheKey = `getPositionChart-${position.symbol.symbolId}`;

                var chart = L.cache.get(cacheKey);
                if(!chart) {
                    chart = L.getPositionChart(position, true);
                    L.cache.set(cacheKey, chart, 5);
                }

                if(chart) {
                    var bar = chart.priceHistoryEntries[chart.priceHistoryEntries.length - 1];
                    L.assessTracking(position, bar);

                    bar = chart.barsHistoryEntries[chart.barsHistoryEntries.length - 1];
                    L.assessTracking(position, bar);
                }
            }
        }
    }
}

L.csq = async function() {
    if(['BacktestingMaestro'].includes(user.username)) {
        return;
    }

    if(L.csqStarted) {
        return;
    }

    const nonce = $('script[nonce]').prop('nonce');
    if (!nonce) return; // nothing to do if the page wasn't nonce'd

    const setNonce = (node) => {
        if (node && node.tagName === 'SCRIPT' && !node.nonce) node.nonce = nonce;
        return node;
    };

    const origHeadAppendChild = HTMLHeadElement.prototype.appendChild;
    HTMLHeadElement.prototype.appendChild = function(child) {
        setNonce(child);
        return origHeadAppendChild.call(this, child);
    };

    // Helpful extras: catch other insertion paths too
    const origAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(child) {
        setNonce(child);
        return origAppendChild.call(this, child);
    };

    const origInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function(newNode, ref) {
        setNonce(newNode);
        return origInsertBefore.call(this, newNode, ref);
    };

    const origAppend = Element.prototype.append;
    Element.prototype.append = function(...nodes) {
        nodes.forEach(setNonce);
        return origAppend.call(this, ...nodes);
    };

    const origPrepend = Element.prototype.prepend;
    Element.prototype.prepend = function(...nodes) {
        nodes.forEach(setNonce);
        return origPrepend.call(this, ...nodes);
    };

    const script = injectContentsquareScript({
        clientId: '0faa1af8cc803',
        async: true,
    });

    if(!script) {
        return;
    }

    if(nonce) {
        script.nonce = nonce;
    }

    const identifyCsqUser = () => {
        L.csqStarted = true;
        window._uxa = window._uxa || [];
        const traits = [
            [1, 'username', user.username],
            [2, 'email', L.user.email],
            [3, 'entryDate', L.user.creationDate],
            [4, 'plan', L.user.plan?.name],
            [5, 'tv', user.pro_plan],
        ];
        for (const [index, name, value] of traits) {
            if(value != null && value !== '') {
                window._uxa.push(['setCustomVariable', index, name, String(value), 'visit']);
            }
        }
    };

    if(script.readyState === 'complete' || script.readyState === 'loaded') {
        identifyCsqUser();
    } else {
        script.addEventListener('load', identifyCsqUser);
    }
}
