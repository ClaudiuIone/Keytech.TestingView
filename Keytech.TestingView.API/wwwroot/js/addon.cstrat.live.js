const L = TradingViewApi.L;
L.brokerTrading.trades = {};
L._defaultRisk = 600;
L.cStrat = {
    enableAutomations: true,
    defaultQty: 60,
    defaultTpUsd: 3100,
};

$(document).on("keydown.cstratlive", async (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "q") {
        event.preventDefault();
        L.toast("Executing after bar close when a bracket is found");
        L.cStrat.toggleExecution();
    }

    if (event.ctrlKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        var chart = L.c();
        chart.bracket = L.cStrat.getBracketPlots(chart);
        if (chart.bracket.found) {
            const trading = L.t.trading();
            const broker = trading.activeBroker();
            L.cStrat.drawLivePosition(chart, broker);
        } else {
            L.toast("No valid bracket found for drawing", 1000);
        }

        chart = L.getCharts()[0];
        var prePriceIndicator = chart.getAllStudies().find(s => s.name == 'Entry Prerequisite');

        if(prePriceIndicator) {
            var study = chart.getStudyById(prePriceIndicator.id);
            study.setInputValues([{ id: "in_0", value: L.getCurrentBarInfo().close }]);
        }
    }

    if (event.altKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        var chart = L.c();
        const risk = Number(await L.showInputPrompt("Risk USD", chart.liveRisk || L._defaultRisk, L._defaultRisk, document.body));
        await L.applyOnChartsAsync(async c => {
            c.liveRisk = risk;
        });

        if(risk) {
            for (const shape of L.getPositionShapes()) {
                const shapeDataSourceProperties = shape.lineDataSource().properties();
                shapeDataSourceProperties.riskDisplayMode.setValue("money");
                shapeDataSourceProperties.risk.setValue(chart.liveRisk || L._defaultRisk);
                
                const shapeProperties = {
                    risk: chart.liveRisk || L._defaultRisk,
                    riskDisplayMode: "money",
                };

                shape.setProperties(shapeProperties);
            }
        }
    }

    if (event.altKey && event.key.toLowerCase() === 'y') {
        var chart = TradingViewApi.activeChart();
        var shapeId = chart.getAllShapes().filter(s => s.name == 'long_position' || s.name == 'short_position').slice(-1)[0].id;
        const shape = L.getShapeById(shapeId, chart, false);
        const shapeDataSourceProperties = shape.lineDataSource().properties();
        
        const trading = L.t.trading();
        const broker = trading.activeBroker();
        const { symbol } = trading.linking().value();
        chart.bracket = {};

        chart.bracket["TP"] = shapeDataSourceProperties.targetPrice.value();
        chart.bracket["SL"] = shapeDataSourceProperties.stopPrice.value();
        chart.bracket["Entry"] = shapeDataSourceProperties.entryPrice.value();

        const side = (chart.bracket["TP"] > chart.bracket["Entry"] && chart.bracket["SL"] < chart.bracket["Entry"]) ? 1 : (chart.bracket["TP"] < chart.bracket["Entry"] && chart.bracket["SL"] > chart.bracket["Entry"]) ? -1 : null;
        const qty = broker ? await L.cStrat.computeQuantity(chart, broker, symbol, shapeId) : 0;
        
        const placed = await L.cStrat.placeBracketOrder(chart, trading, qty, symbol, side, 3);
        L.cStrat.armAltYBracketCancelNear15mClose(chart, trading, symbol, side, placed?.orderId);
        if(L.cStrat.enableAutomations) {
            L.cStrat.setDefaultBE(chart, chart.bracket["Entry"], chart.bracket["TP"], true);
            L.cStrat.setDefaultDDBE(chart, chart.bracket["Entry"], chart.bracket["SL"], true);
        }
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'j') {
        L.cStrat.enableAutomations = !L.cStrat.enableAutomations;
        L.toast(`Automations ${L.cStrat.enableAutomations ? "enabled" : "disabled"}`, 1000);
    }

    if (event.ctrlKey && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        event.stopPropagation();
        await L.cStrat.openPositionFromHotkey();
    }
});

L.cStrat.setDefaultBE = async function (chart, entry, tp, visible) {
    await L.applyOnChartsAsync(async c => {
        if(c.symbol() == chart.symbol()) {
            var beStudyInfo = c.getAllStudies().find(s => s.name == 'Auto BE');
            if(beStudyInfo) {
                var beStudy = c.getStudyById(beStudyInfo.id);
                if(beStudy) {
                    beStudy.setInputValues([{ id: "in_0", value: entry + (tp - entry) * 0.5 }]);
                    c.autoBEAppliedForBrokerTrade = null;
                    beStudy.setVisible(visible);
                    return -1;
                }
            }
        }
    });
}

L.cStrat.setDefaultDDBE = async function (chart, entry, sl, visible) {
    await L.applyOnChartsAsync(async c => {
        if(c.symbol() == chart.symbol()) {
            var beStudyInfo = c.getAllStudies().find(s => s.name == 'Auto BE');
            if(beStudyInfo) {
                var beStudy = c.getStudyById(beStudyInfo.id);
                if(beStudy) {
                    var defaultDdBe = entry - (entry - sl) * 0.5;

                    const bar = L.getCurrentBarInfo(chart);
                    if(entry > sl) {
                        if(bar.low < defaultDdBe) {
                            defaultDdBe = bar.low - (entry - sl) * 0.1;
                        }
                    }

                    if(entry < sl) {
                        if(bar.high > defaultDdBe) {
                            defaultDdBe = bar.high + (sl - entry) * 0.1;
                        }
                    }

                    beStudy.setInputValues([{ id: "in_1", value: defaultDdBe }]);
                    c.autoDDBEAppliedForBrokerTrade = null;
                    beStudy.setVisible(visible);
                    return -1;
                }
            }
        }
    });
}

L.TestingViewButton.attr("data-tooltip", "Ctrl + E: Draw position\nAlt + E: Set risk %\nAlt + Y: Set pending order\nCtrl + L: Market long/short + TP\nAlt + Shift + T: Sync time\nCtrl + Shift + G: Autosize charts\nCtrl + Alt + F: Snapshots");

L.cStrat.getConfiguredQty = function (symbol) {
    const fallback = L.cStrat.defaultQty || 60;

    try {
        const trading = L.t.trading();
        const broker = trading.activeBroker();
        const host = broker?._host || broker?._adapter?._host || trading?._host;
        const getQty = host?.getQty?.bind(host) || trading.getQty?.bind(trading) || broker?.getQty?.bind(broker);
        if (getQty) {
            const q = Number(getQty(symbol));
            if (Number.isFinite(q) && q > 0) {
                return q;
            }
        }

        const suggester = trading?.getQtySuggester?.() || host?._trading?.getQtySuggester?.();
        if (suggester?.getQty) {
            const q = Number(suggester.getQty(symbol));
            if (Number.isFinite(q) && q > 0) {
                return q;
            }
        }
    } catch (e) { /* ignore */ }

    try {
        const buttons = [...document.querySelectorAll("button, div[role='button'], span[role='button']")];
        const tradeBtn = buttons.find(el => {
            const text = (el.textContent || "").replace(/\s+/g, " ").trim();
            return /\b(SELL|BUY)\b/i.test(text) && /[\d,]+\.?\d*/.test(text);
        });
        if (tradeBtn) {
            let root = tradeBtn.parentElement;
            for (let i = 0; i < 4 && root; i++, root = root.parentElement) {
                const input = root.querySelector("input:not([type='hidden'])");
                if (input) {
                    const q = Number(String(input.value).replace(/,/g, ""));
                    if (Number.isFinite(q) && q > 0) {
                        return q;
                    }
                }
            }
        }
    } catch (e) { /* ignore */ }

    return fallback;
};

L.cStrat.roundToMinTick = function (price, minTick) {
    if (!minTick || !Number.isFinite(minTick) || minTick <= 0) {
        return price;
    }
    const decimals = Math.max(0, (String(minTick).split(".")[1] || "").length);
    return Number((Math.round(price / minTick) * minTick).toFixed(decimals));
};

L.cStrat.priceMoveFromTpUsd = function (tpUsd, qty, symbolInfo) {
    const pipSize = Number(symbolInfo?.pipSize || symbolInfo?.minTick);
    const pipValue = Number(symbolInfo?.pipValue);
    const lotSize = Number(symbolInfo?.lotSize ?? 1);
    const minTick = Number(symbolInfo?.minTick || pipSize);

    if (!qty || !tpUsd || !Number.isFinite(pipSize) || pipSize <= 0 || !Number.isFinite(pipValue) || pipValue <= 0) {
        return null;
    }

    // PL ≈ priceDiff * qty * lotSize / pipSize * pipValue
    const valuePerPriceUnit = qty * lotSize / pipSize * pipValue;
    if (!valuePerPriceUnit) {
        return null;
    }

    return {
        priceMove: tpUsd / valuePerPriceUnit,
        minTick: minTick || pipSize,
    };
};

L.cStrat.showOpenPositionDialog = function (qty, defaultTpUsd) {
    return new Promise((resolve) => {
        const dialog = $("<div>")
            .addClass(L.s(-2, 3) /* backtst-prompt-dialog */)
            .appendTo(document.body);

        const dialogContent = $("<div>")
            .addClass(L.s(-2, 4) /* backtst-prompt-dialog-content */)
            .css({ width: "360px", maxWidth: "90%" })
            .appendTo(dialog);

        dialogContent.append($("<p>").text(`Open position · Qty ${qty}`));

        dialogContent.append($("<label>")
            .css({ display: "block", marginBottom: "4px", opacity: 0.8 })
            .text("Take profit (USD)"));

        const input = $("<input>")
            .val(defaultTpUsd)
            .attr("spellcheck", "false")
            .attr("placeholder", String(L.cStrat.defaultTpUsd))
            .attr("type", "number")
            .appendTo(dialogContent);

        const buttons = $("<div>")
            .css({ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "12px" })
            .appendTo(dialogContent);

        const finish = (side) => {
            const tpUsd = Number(input.val());
            dialog.remove();
            if (!side || !Number.isFinite(tpUsd) || tpUsd <= 0) {
                resolve(null);
                return;
            }
            L.cStrat.defaultTpUsd = tpUsd;
            resolve({ side, tpUsd });
        };

        $("<button>")
            .text("Long")
            .addClass("lightButton secondary xsmall typography-regular14px")
            .css({ background: "#2962ff", color: "#fff", border: "none" })
            .on("click", () => finish(1))
            .appendTo(buttons);

        $("<button>")
            .text("Short")
            .addClass("lightButton secondary xsmall typography-regular14px")
            .css({ background: "#f23645", color: "#fff", border: "none" })
            .on("click", () => finish(-1))
            .appendTo(buttons);

        $("<button>")
            .text("Cancel")
            .addClass("lightButton secondary xsmall typography-regular14px")
            .on("click", () => finish(null))
            .appendTo(buttons);

        dialog.on("click mousedown mouseup focusin", (e) => {
            if ($(e.target).hasClass(L.s(-2, 3) /* backtst-prompt-dialog */)) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                finish(null);
            }
        });

        input.on("keydown", (e) => {
            if (e.key === "Escape") {
                finish(null);
            } else if (e.key === "Enter") {
                finish(1);
            }
        });

        setTimeout(() => input.focus().select(), 200);
    });
};

L.cStrat.resolveBrokerSymbol = function (chart, trading) {
    try {
        const info = chart?.chartModel?.()?.mainSeries?.()?.symbolInfo?.();
        if (info?.front_contract) {
            const exchange = info.listed_exchange || info.exchange;
            if (exchange) {
                return `${exchange}:${info.front_contract}`;
            }
            return info.front_contract;
        }
    } catch (e) { /* ignore */ }

    try {
        const linking = trading?.linking?.()?.value?.();
        if (linking?.symbol) {
            return linking.symbol;
        }
    } catch (e) { /* ignore */ }

    return chart?.symbol?.() || null;
};

L.cStrat.openPositionFromHotkey = async function () {
    const chart = L.c();
    const trading = L.t.trading();
    const broker = trading.activeBroker();
    if (!broker) {
        L.toast("No active broker", 2000);
        return;
    }

    const symbol = L.cStrat.resolveBrokerSymbol(chart, trading);
    if (!symbol) {
        L.toast("No symbol on active chart", 2000);
        return;
    }

    const qty = L.cStrat.getConfiguredQty(symbol);
    const choice = await L.cStrat.showOpenPositionDialog(qty, L.cStrat.defaultTpUsd);
    if (!choice) {
        return;
    }

    const symbolInfo = await broker.symbolInfo(symbol);
    const move = L.cStrat.priceMoveFromTpUsd(choice.tpUsd, qty, symbolInfo);
    if (!move) {
        L.toast("Cannot compute TP from symbol pip value", 3000);
        return;
    }

    const quotes = await trading.realtimeProvider().quotesSnapshot(symbol);
    const entry = choice.side === 1 ? quotes.ask : quotes.bid;
    if (!Number.isFinite(entry)) {
        L.toast("No quote available", 2000);
        return;
    }

    const takeProfit = L.cStrat.roundToMinTick(
        choice.side === 1 ? entry + move.priceMove : entry - move.priceMove,
        move.minTick
    );

    const order = {
        symbol,
        side: choice.side,
        type: 2, // market
        qty,
        takeProfit,
        seenPrice: entry,
    };

    await broker.placeOrder(order);
    L.toast(`${choice.side === 1 ? "Long" : "Short"} ${qty} ${symbol} @ ~${entry} · TP ${takeProfit} ($${choice.tpUsd})`, 3000);

    if (L.cStrat.enableAutomations) {
        L.cStrat.setDefaultBE(chart, entry, takeProfit, true);
    }
};

L.cStrat.drawLivePosition = async function (chart, broker, shapeId) {
    var accountSize = 0;
    if (!shapeId) {
        accountSize = await L.brokerTrading.getCurrentEquity(broker);
    }
    const currentTime = chart.chartModel().mainSeries().bars()._items.slice(-1)[0].value[0];
    const points = [{ price: chart.bracket["Entry"], time: currentTime + chart.timeframeSeconds }, { price: chart.bracket["Entry"], time: currentTime + chart.timeframeSeconds * 10 }];

    if (!shapeId) {
        shapeId = await chart.createShape(
            points,
            {
                shape: chart.bracket["SL"] < chart.bracket["TP"] ? "long_position" : "short_position"
            }
        );
    }

    const shapePositioning = L.applyOnCharts((c) => {
        const s =  L.getShapeById(shapeId, c, true);
        if (!s) {
            return false;
        }

        s.setPoints(points);
        return true;
    }, true);

    if(shapePositioning.filter(r => r).length == 0) {
        return;
    }

    const shape = L.getShapeById(shapeId, chart, true);
    const shapeDataSourceProperties = shape.lineDataSource().properties();
    shapeDataSourceProperties.targetPrice.setValue(chart.bracket["TP"]);
    shapeDataSourceProperties.stopPrice.setValue(chart.bracket["SL"]);
    if(!chart.liveRisk) {
        chart.liveRisk = Number(await L.showInputPrompt("Risk USD", chart.liveRisk || L._defaultRisk, L._defaultRisk, document.body));
    }

    if(!chart.liveRisk) {
        throw new Error("Risk USD is required");
    }

    shapeDataSourceProperties.risk.setValue(chart.liveRisk);
    shapeDataSourceProperties.riskDisplayMode.setValue("money");

    var shapeProperties = {
        entryPrice: chart.bracket["Entry"],
        stopPrice: chart.bracket["SL"],
        targetPrice: chart.bracket["TP"],
        endTime: points[1].time,
    };

    if(chart.liveRisk) {
        shapeProperties.risk = chart.liveRisk;
        shapeProperties.riskDisplayMode = "money";
    }

    if (accountSize) {
        shapeProperties.accountSize = accountSize;
        shapeDataSourceProperties.accountSize.setValue(accountSize);
    }

    shape.setProperties(shapeProperties);
    shapeProperties = shape.getProperties();

    return shapeId;
}

L.cStrat.removeLivePositionShape = function (chart) {
    const shapes = chart.getAllShapes();
    for (const shapeInfo of shapes.filter(s => s.name == 'long_position' || s.name == 'short_position')) {
        L.removeShapeById(shapeInfo.id, chart, true);
    }
}

L.cStrat.computeQuantity = async function (chart, broker, symbol, shapeId) {
    const shape = L.getShapeById(shapeId, chart, true);
    const shapeProperties = shape.getProperties();
    const symbolInfo = await broker.symbolInfo(symbol);

    // Calculate the number of full steps that fit into the requested quantity above the minimum
    const k = Math.ceil((shapeProperties.qty - symbolInfo.qty.min) / symbolInfo.qty.step);
    // Calculate the nearest valid quantity by adding the full steps to the minimum quantity
    const q = symbolInfo.qty.min + k * symbolInfo.qty.step;

    const stepString = String(symbolInfo.qty.step);
    const decimalPos = stepString.indexOf('.');
    const stepDecimals = decimalPos === -1 ? 0 : stepString.length - decimalPos - 1;

    const fixed = Number(q.toFixed(stepDecimals));
    const qty = Math.max(symbolInfo.qty.min, Math.min(symbolInfo.qty.max, fixed));

    const shapeDataSourceProperties = shape.lineDataSource().properties();
    shapeProperties.qty = qty;
    shapeDataSourceProperties.qty.setValue(qty);
    
    return qty;
}

L.cStrat.placeBracketOrder = async function (chart, trading, qty, symbol, side, type) {
    if(!qty) {
        return;
    }

    const quotes = await trading.realtimeProvider().quotesSnapshot(symbol);
    const ask = quotes.ask, bid = quotes.bid;

    const order = {
        symbol,
        side,
        type: type,
        qty,
        takeProfit: chart.bracket["TP"],
        stopLoss: chart.bracket["SL"],
        seenPrice: side == 1 ? ask : bid
    };

    if(type == 3) { // stop order
        order.stopPrice = chart.bracket["Entry"];
    }

    if(type == 1) { // limit order
        order.limitPrice = chart.bracket["Entry"];
    }

    // Place directly via broker — skip the order ticket confirmation popup
    return await trading.activeBroker().placeOrder(order);
}

L.cStrat.armAltYBracketCancelNear15mClose = function (chart, trading, symbol, side, orderId) {
    clearTimeout(L.cStrat._altYBracketCancelTimer);
    L.cStrat._altYBracketCancelTimer = null;

    if (!chart || chart.timeframeSeconds !== 900) {
        return;
    }

    const bar = L.getCurrentBarInfo(chart);
    if (!bar?.time) {
        return;
    }

    const entry = chart.bracket?.["Entry"];
    const closeAtMs = (bar.time + 900) * 1000;
    const delayMs = closeAtMs - 60_000 - Date.now();

    const cancelBracket = async () => {
        L.cStrat._altYBracketCancelTimer = null;

        const active = TradingViewApi.activeChart?.() || L.c?.();
        if (!active || active.timeframeSeconds !== 900) {
            return;
        }

        const broker = trading?.activeBroker?.();
        if (!broker?.cancelOrder) {
            return;
        }

        for (let attempt = 0; attempt < 10; attempt++) {
            try {
                if (orderId) {
                    await broker.cancelOrder(orderId);
                    L.toast("Bracket cancelled: <1m to 15m close", 2000);
                    return;
                }

                const orders = await broker.orders();
                const toCancel = (orders || []).filter(o =>
                    o.symbol === symbol &&
                    o.side === side &&
                    o.status === 6 &&
                    !o.parentId &&
                    (o.type === 3 || o.stopPrice != null) &&
                    (entry == null || Math.abs(Number(o.stopPrice) - Number(entry)) < 1e-8)
                );

                if (toCancel.length) {
                    for (const o of toCancel) {
                        await broker.cancelOrder(o.id);
                    }
                    L.toast("Bracket cancelled: <1m to 15m close", 2000);
                    return;
                }
            } catch (e) {
                L.dbg("Alt+Y cancel near 15m close failed:", "error", e);
            }

            await L.delay(100);
        }
    };

    if (delayMs <= 0) {
        cancelBracket();
        return;
    }

    L.cStrat._altYBracketCancelTimer = setTimeout(cancelBracket, delayMs);
}

L.cStrat.canExecute = function (chart) {
    const bar = L.getCurrentBarInfo(chart);
    if (bar.time < chart.executionMaxTime) {
        if (chart.bracket["TP"] > chart.bracket["SL"]) {
            if (bar.close >= chart.bracket["Entry"]) {
                return true;
            }
        } else if (chart.bracket["TP"] < chart.bracket["SL"]) {
            if (bar.close <= chart.bracket["Entry"]) {
                return true;
            }
        }
    } else if (bar.time >= chart.executionMaxTime) {
        L.cStrat.cancelExecution(chart);
        L.toast("Timeout: bar closed before entry price reached, execution cancelled");
    }

    return false;
}

L.cStrat.waitAndExecute = async function (chart, shapeId, trading, broker, symbol) {
    const side = (chart.bracket["TP"] > chart.bracket["Entry"] && chart.bracket["SL"] < chart.bracket["Entry"]) ? 1 : (chart.bracket["TP"] < chart.bracket["Entry"] && chart.bracket["SL"] > chart.bracket["Entry"]) ? -1 : null;
    const qty = broker ? await L.cStrat.computeQuantity(chart, broker, symbol, shapeId) : 0;
    L.toast(`Executing when price reaches ${chart.bracket["Entry"]}`);

    clearInterval(chart.waitForCanExecuteInterval);
    chart.waitForCanExecuteInterval = setInterval(async () => {
        if(chart.waitForCanExecuteIntervalBusy) {
            return;
        }
        chart.waitForCanExecuteIntervalBusy = true;
        if (L.cStrat.canExecute(chart)) {
            clearInterval(chart.waitForCanExecuteInterval);
            await L.cStrat.placeBracketOrder(chart, trading, qty, symbol, side, 2);
            L.cStrat.cancelExecution(chart);
            L.cStrat.setDefaultBE(chart, chart.bracket["Entry"], chart.bracket["TP"], broker, true);
        }

        if(chart.waitForCanExecuteIntervalBusy) {
            chart.waitForCanExecuteIntervalBusy = false;
        }
    }, 10);
}

L.cStrat.getBracketPlots = function (chart) {
    return L.getPlots(chart, ["TP", "SL", "Entry", "Reference"], false, true);
}

L.cStrat.toggleExecution = async function () {
    const chart = L.c();
    if(chart.executionMinTime) {
        L.cStrat.cancelExecution(chart);
        L.cStrat.removeLivePositionShape(chart);
        L.toast("Execution cancelled", 1000);
        return;
    }

    const trading = L.t.trading();
    const broker = trading.activeBroker();
    const { symbol } = trading.linking().value();
    
    chart.bracket = L.cStrat.getBracketPlots(chart);

    var bar = L.getCurrentBarInfo(chart);
    chart.executionMinTime = bar.time + chart.timeframeSeconds * (chart.bracket["Reference"] == 1 ? 1 : 0);
    chart.executionMaxTime = bar.time + chart.timeframeSeconds * (chart.bracket["Reference"] == 1 ? 2 : 1);

    var shapeId;

    clearInterval(chart.prepareExecutionInterval);
    chart.prepareExecutionInterval = setInterval(async () => {
        if(chart.prepareExecutionIntervalBusy) {
            return;
        }

        chart.prepareExecutionIntervalBusy = true;

        bar = L.getCurrentBarInfo(chart);
        if (bar.time < chart.executionMinTime) {
            chart.bracket = L.cStrat.getBracketPlots(chart);
            if (chart.bracket?.found) {
                const sid = await L.cStrat.drawLivePosition(chart, broker, shapeId);
                if (!shapeId) {
                    shapeId = sid;
                }
            }
        }

        if (chart.bracket?.found && chart.executionMinTime <= bar.time && bar.time < chart.executionMaxTime) {
            clearInterval(chart.prepareExecutionInterval);
            if(!shapeId) {
                shapeId = await L.cStrat.drawLivePosition(chart, broker);
            }
            await L.cStrat.waitAndExecute(chart, shapeId, trading, broker, symbol);
        } else if(!chart.bracket?.found) {
            L.cStrat.removeLivePositionShape(chart);
            shapeId = undefined;

            if(bar.time >= chart.executionMinTime) {
                L.cStrat.cancelExecution(chart);
                L.toast("No bracket: execution cancelled");
            }
        }

        if (bar.time >= chart.executionMaxTime) {
            L.cStrat.cancelExecution(chart);
            L.toast("Timeout: execution cancelled");
        }

        if(chart.prepareExecutionIntervalBusy) {
            chart.prepareExecutionIntervalBusy = false;
        }
    }, 10);
}

L.cStrat.executeBracket = async function () {
    const chart = L.c();
    const trading = L.t.trading();
    const broker = trading.activeBroker();
    const { symbol } = trading.linking().value();
    chart.bracket = L.cStrat.getBracketPlots(chart);
    if (chart.bracket.found) {
        const shapeId = await L.cStrat.drawLivePosition(chart, broker);
        const qty = await L.cStrat.computeQuantity(chart, broker, symbol, shapeId);
        const side = (chart.bracket["TP"] > chart.bracket["Entry"] && chart.bracket["SL"] < chart.bracket["Entry"]) ? 1 : (chart.bracket["TP"] < chart.bracket["Entry"] && chart.bracket["SL"] > chart.bracket["Entry"]) ? -1 : null;
        await L.cStrat.placeBracketOrder(chart, trading, qty, symbol, side, 2);
        L.cStrat.cancelExecution(chart);
        L.cStrat.setDefaultBE(chart, chart.bracket["Entry"], chart.bracket["TP"], broker, true);

        return true;
    } else {
        return false;
    }
}

L.cStrat.cancelExecution = function (chart) {
    clearInterval(chart.prepareExecutionInterval);
    clearInterval(chart.waitForCanExecuteInterval);
    delete chart.prepareExecutionInterval;
    delete chart.waitForCanExecuteInterval;
    delete chart.prepareExecutionIntervalBusy;
    delete chart.waitForCanExecuteIntervalBusy;
    delete chart.executionMinTime;
    delete chart.executionMaxTime;
    delete chart.bracket;
}

L.asyncInterval(async () => {
    if(!L.cStrat.enableAutomations) return;
    if(L.r.isReplayStarted().value()) return;
    var broker;
    var trading;
    var equity = await L.tryExecAsync(() => {
        trading = L.t.trading();
        broker = trading.activeBroker();
        return L.brokerTrading.getCurrentEquity(broker);
    }, true);

    if(!equity) {
        await L.delay(10000);
        return;
    }

    try {
        await L.applyOnChartsAsync(async (chart) => {
            if (!broker) return;

            const securityInfo = trading.linking().value();
            const symbolV1 = securityInfo.symbol;
            const symbolV2 = securityInfo.continuous;

            // Get open position for this symbol from broker
            const brokerTrades = await broker.positions();
            const brokerTrade = brokerTrades?.find(p => [symbolV1, symbolV2].includes(p.symbol) && [symbolV1, symbolV2].includes(chart.symbol()) && p.qty !== 0);
            if (!brokerTrade) {
                chart.hasTrade = false;
                chart.autoBEAppliedForBrokerTrade = null;
                chart.pendingReverse = false;
                delete chart.__entryTime;
                return;
            }

            chart.hasTrade = true;
            
            const initialSl = await L.brokerTrading.getInitialSl(broker, brokerTrade, true);
            const initialTp = await L.brokerTrading.getInitialTp(broker, brokerTrade, true);

            // Skip if we already moved to BE for this position
            if (chart.autoBEAppliedForBrokerTrade === brokerTrade.id) return;

            // Get the BE plot value from the chart
            const bePlot = L.getPlots(chart, ["BE"], false, true);
            if (!bePlot.found || bePlot["BE"] <= 0) return;

            const bePlotValue = bePlot["BE"];

            // Get current bar info
            const bar = L.getCurrentBarInfo(chart);
            if(!chart.__entryTime) {
                chart.__entryTime = bar.time;
            }

            if(bar.time <= chart.__entryTime) {
                return;
            }

            const isLong = brokerTrade.side === 1;
            const entryPrice = brokerTrade.avgPrice;

            // Check if price has tapped the BE level
            let priceTappedBE = false;
            if (isLong) {
                // For longs: BE level should be above entry, price needs to reach it
                priceTappedBE = bePlotValue > entryPrice && bar.high >= bePlotValue;
            } else {
                // For shorts: BE level should be below entry, price needs to reach it  
                priceTappedBE = bePlotValue < entryPrice && bar.low <= bePlotValue;
            }

            if (priceTappedBE) {
                var rawSlOrder = await L.brokerTrading.getInitialSl(broker, brokerTrade);
                if(rawSlOrder) {
                    const slOrder = { ...rawSlOrder };

                    delete slOrder.duration;
                    delete slOrder.updateTime;
                    
                    slOrder.stopPrice = entryPrice;
                    L.brokerTrading.addToSLs(brokerTrade, slOrder);

                    if(slOrder.parentId != slOrder.mainOrder.id) {
                        delete slOrder.qty;
                    }
                    
                    L.toast(`Auto BE: Stop moved to entry (${entryPrice})`);
                    L.playChime(0);

                    try {
                        await broker.modifyOrder(slOrder);
                        L.applyOnCharts(c => c.autoBEAppliedForBrokerTrade = brokerTrade.id, false, chart.symbol());
                    } catch (e) {
                        L.dbg("Auto BE: Failed to modify order:", "error", e);
                    }
                } else {
                    L.dbg("Auto BE: No stop loss order found to modify.", "error");
                }
            }
        });
    } catch (e) {
        L.dbg("Auto BE monitor error:", "error", e);
    }
}, 500, 0, true);

L.asyncInterval(async () => {
    if(!L.cStrat.enableAutomations) return;
    if(L.r.isReplayStarted().value()) return;
    var broker;
    var trading;
    var equity = await L.tryExecAsync(() => {
        trading = L.t.trading();
        broker = trading.activeBroker();
        return L.brokerTrading.getCurrentEquity(broker);
    }, true);

    if(!equity) {
        await L.delay(10000);
        return;
    }

    try {
        await L.applyOnChartsAsync(async (chart) => {
            if (!broker) return;

            const securityInfo = trading.linking().value();
            const symbolV1 = securityInfo.symbol;
            const symbolV2 = securityInfo.continuous;

            // Get open position for this symbol from broker
            const brokerTrades = await broker.positions();
            const brokerTrade = brokerTrades?.find(p => [symbolV1, symbolV2].includes(p.symbol) && [symbolV1, symbolV2].includes(chart.symbol()) && p.qty !== 0);
            if (!brokerTrade) {
                chart.hasTrade = false;
                chart.autoDDBEAppliedForBrokerTrade = null;
                chart.pendingReverse = false;
                delete chart.__entryTime;
                return;
            }

            chart.hasTrade = true;
            // Skip if we already moved to BE for this position
            if (chart.autoDDBEAppliedForBrokerTrade === brokerTrade.id) return;

            // Get the BE plot value from the chart
            const bePlot = L.getPlots(chart, ["DDBE"], false, true);
            if (!bePlot.found || bePlot["DDBE"] <= 0) return;

            const bePlotValue = bePlot["DDBE"];

            // Get current bar info
            const bar = L.getCurrentBarInfo(chart);
            if(!chart.__entryTime) {
                chart.__entryTime = bar.time;
            }
            if(bar.time <= chart.__entryTime) {
                return;
            }

            const isLong = brokerTrade.side === 1;
            const entryPrice = brokerTrade.avgPrice;

            // Check if price has tapped the BE level
            let priceTappedDDBE = false;
            if (!isLong) {
                // For shorts: BE level should be above entry, price needs to reach it
                priceTappedDDBE = bePlotValue > entryPrice && bar.high >= bePlotValue;
            } else {
                // For longs: BE level should be below entry, price needs to reach it  
                priceTappedDDBE = bePlotValue < entryPrice && bar.low <= bePlotValue;
            }

            if (priceTappedDDBE) {
                var rawTpOrder = await L.brokerTrading.getInitialTp(broker, brokerTrade);
                if(rawTpOrder) {
                    const tpOrder = { ...rawTpOrder };

                    delete tpOrder.duration;
                    delete tpOrder.updateTime;

                    tpOrder.limitPrice = entryPrice;
                    L.brokerTrading.addToTPs(brokerTrade, tpOrder);

                    if(tpOrder.parentId != tpOrder.mainOrder.id) {
                        delete tpOrder.qty;
                    }
                
                    L.playChime(1);
                    L.dbg(`Auto DD BE: TP ${tpOrder.id} moved to entry (${entryPrice})`);

                    try {
                        await broker.modifyOrder(tpOrder);
                        L.applyOnCharts(c => {c.autoDDBEAppliedForBrokerTrade = brokerTrade.id; c.pendingReverse = brokerTrade.id;}, false, chart.symbol());
                    } catch (e) {
                        L.dbg("Auto DD BE: Failed to modify order:", "error", e);
                    }
                } else {
                    L.dbg("Auto DD BE: No TP order found to modify.", "error");
                }
            }
        });
    } catch (e) {
        L.dbg("Auto BE monitor error:", "error", e);
    }
}, 500, 0, true);

// L.asyncInterval(async () => {
//     if(!L.cStrat.enableAutomations) return;
//     if(L.r.isReplayStarted().value()) return;
//     var broker;
//     var trading;
//     var equity = await L.tryExecAsync(() => {
//         trading = L.t.trading();
//         broker = trading.activeBroker();
//         return L.brokerTrading.getCurrentEquity(broker);
//     }, true);

//     if(!equity) {
//         await L.delay(10000);
//         return;
//     }

//     try {
//         await L.applyOnChartsAsync(async (chart) => {
//             if (!broker) return;

//             const securityInfo = trading.linking().value();
//             const symbolV1 = securityInfo.symbol;
//             const symbolV2 = securityInfo.continuous;

//             // Get open position for this symbol from broker
//             const brokerTrades = await broker.positions();
//             const brokerTrade = brokerTrades?.find(p => [symbolV1, symbolV2].includes(p.symbol) && [symbolV1, symbolV2].includes(chart.symbol()) && p.qty !== 0);
//             if (!brokerTrade) {
//                 chart.hasTrade = false;
//                 chart.extendedTPAppliedForBrokerTrade = null;
//                 delete chart.__entryTime;
//                 return;
//             }

//             chart.hasTrade = true;
//             if (chart.extendedTPAppliedForBrokerTrade === brokerTrade.id) return;

//             // Get current bar info
//             const bar = L.getCurrentBarInfo(chart);
//             if(!chart.__entryTime) {
//                 chart.__entryTime = bar.time;
//             }
//             if(bar.time <= chart.__entryTime) {
//                 return;
//             }

//             var rawTpOrder = await L.brokerTrading.getInitialTp(broker, brokerTrade);
//             if(rawTpOrder) {
//                 const tpOrder = { ...rawTpOrder };

//                 delete tpOrder.duration;
//                 delete tpOrder.updateTime;
                
//                 const entryPrice = brokerTrade.avgPrice;
//                 const isLong = brokerTrade.side === 1;

//                 tpOrder.limitPrice = isLong ? tpOrder.limitPrice + (tpOrder.limitPrice - entryPrice) : tpOrder.limitPrice - (entryPrice - tpOrder.limitPrice);
//                 L.brokerTrading.addToTPs(brokerTrade, tpOrder);

//                 if(tpOrder.parentId != tpOrder.mainOrder.id) {
//                     delete tpOrder.qty;
//                 }
                
//                 L.playChime(2);
//                 L.dbg(`Auto TP: TP ${tpOrder.id} doubled to ${tpOrder.limitPrice}`);

//                 try {
//                     await L.delay(1000);
//                     broker.modifyOrder(tpOrder);
//                     L.applyOnCharts(c => c.extendedTPAppliedForBrokerTrade = brokerTrade.id, false, chart.symbol());
//                 } catch (e) {
//                     L.dbg("Auto TP: Failed to modify order:", "error", e);
//                 }
//             } else {
//                 L.dbg("Auto TP: No TP order found to modify.", "error");
//             }
//         });
//     } catch (e) {
//         L.dbg("Auto TP monitor error:", "error", e);
//     }
// }, 500, 0, true);

// L.asyncInterval(async () => {
//     if(!L.cStrat.enableAutomations) return;
//     if(L.r.isReplayStarted().value()) return;
//     var broker;
//     var trading;
//     var equity = await L.tryExecAsync(() => {
//         trading = L.t.trading();
//         broker = trading.activeBroker();
//         return L.brokerTrading.getCurrentEquity(broker);
//     }, true);

//     if(!equity) {
//         await L.delay(10000);
//         return;
//     }

//     try {
//         await L.applyOnChartsAsync(async (chart) => {
//             if (!broker) return;

//             const securityInfo = trading.linking().value();
//             const symbolV1 = securityInfo.symbol;
//             const symbolV2 = securityInfo.continuous;

//             // Get open position for this symbol from broker
//             const brokerTrades = await broker.positions();
//             const brokerTrade = brokerTrades?.find(p => [symbolV1, symbolV2].includes(p.symbol) && [symbolV1, symbolV2].includes(chart.symbol()) && p.qty !== 0);
//             if (!brokerTrade) {
//                 chart.hasTrade = false;
//                 chart.autoSLTPAppliedForBrokerTrade = null;
//                 delete chart.__entryTime;
//                 return;
//             }

//             chart.hasTrade = true;
//             if (chart.autoSLTPAppliedForBrokerTrade === brokerTrade.id) return;

//             // Get current bar info
//             const bar = L.getCurrentBarInfo(chart);
//             if(!chart.__entryTime) {
//                 chart.__entryTime = bar.time;
//             }
//             if(bar.time <= chart.__entryTime) {
//                 return;
//             }

//             const isLong = brokerTrade.side === 1;
//             const entryPrice = brokerTrade.avgPrice;

//             const initialTp = await L.brokerTrading.getInitialTp(broker, brokerTrade, true);
        
//             // Check if price has tapped the BE level
//             let priceTappedTP = false;
//             if (isLong) {
//                 // For longs: BE level should be above entry, price needs to reach it
//                 priceTappedTP = initialTp > entryPrice && bar.high >= initialTp;
//             } else {
//                 // For shorts: BE level should be below entry, price needs to reach it  
//                 priceTappedTP = initialTp < entryPrice && bar.low <= initialTp;
//             }

//             if(priceTappedTP && chart.extendedTPAppliedForBrokerTrade) {
//                 var rawSlOrder = await L.brokerTrading.getInitialSl(broker, brokerTrade);
//                 if(rawSlOrder) {
//                     const slOrder = { ...rawSlOrder };

//                     delete slOrder.duration;
//                     delete slOrder.updateTime;
//                     slOrder.stopPrice = initialTp;
//                     L.brokerTrading.addToSLs(brokerTrade, slOrder);

//                     if(slOrder.parentId != slOrder.mainOrder.id) {
//                         delete slOrder.qty;
//                     }
                    
//                     L.toast(`Auto SL@TP: Stop moved to TP (${initialTp})`);
//                     L.playChime(3);

//                     var slTpSuccess = await L.cStrat.tryMoveSlToTp(chart, broker, brokerTrade, slOrder);

//                     if(!slTpSuccess) {
//                         {
//                             const currentSlOrder = await L.brokerTrading.getBrokerSlOrder(broker, brokerTrade);
//                             const currentSl = currentSlOrder.stopLoss || currentSlOrder.stopPrice || currentSlOrder.avgPrice;

//                             if((isLong && currentSl < initialTp) || (!isLong && currentSl > initialTp)) {
//                                 L.dbg(`Can't set SL ${currentSl} at ${initialTp} - Closing at market`);
//                                 await broker.closePosition(brokerTrade.id);
//                             }
//                         }
//                     }
//                 } else {
//                     L.dbg("Auto SL@TP: No stop loss order found to modify.", "error");
//                     await broker.closePosition(brokerTrade.id);
//                 }
//             }
//         });
//     } catch (e) {
//         L.dbg("Auto SL@TP monitor error:", "error", e);
//     }
// }, 500, 0, true);

L.cStrat.tryMoveSlToTp = async function(chart, broker, brokerTrade, slOrder) {
    const deadline = Date.now() + 5000;
    let slTpSuccess = false;

    while (Date.now() < deadline) {
        try {
            L.applyOnCharts(
                c => c.autoSLTPAppliedForBrokerTrade = brokerTrade.id,
                false,
                chart.symbol()
            );

            const remaining = deadline - Date.now();
            if (remaining <= 0) {
                break;
            }

            const modified = await Promise.race([
                broker.modifyOrder(slOrder),
                new Promise(resolve => setTimeout(() => resolve(false), remaining))
            ]);

            if (modified) {
                slTpSuccess = true;
                break;
            }
        } catch (e) {
            L.dbg("Auto SL@TP: Failed to modify order:", "error", e);
        }

        const remaining = deadline - Date.now();
        if (remaining <= 0) {
            break;
        }

        await L.delay(Math.min(500, remaining));
    }

    return slTpSuccess;
}

L.cStrat.onBrokerLiveTradeOpen = async function(e) {
    const broker = e.broker;
    const brokerTrade = e.brokerTrade;
    const chart = e.chart;
    
    if(!chart) {
        return;
    }
    
    L.brokerTrading.trades[brokerTrade.id] = brokerTrade;
    L.brokerTrading.trades[brokerTrade.id].SLs = new Set();
    L.brokerTrading.trades[brokerTrade.id].TPs = new Set();

    const [slOrder, tpOrder] = await Promise.all([
        L.brokerTrading.getBrokerSlOrder(broker, brokerTrade),
        L.brokerTrading.getBrokerTpOrder(broker, brokerTrade)
    ]);

    if (slOrder) {
        L.brokerTrading.addToSLs(slOrder);
    }

    if (tpOrder) {
        L.brokerTrading.addToTPs(tpOrder);
    }
}

L.cStrat.onBrokerLiveTradeClose = async function(e) {
    if(!L.cStrat.enableAutomations) return;
    const broker = e.broker;
    const brokerTrade = e.brokerTrade;
    const chart = e.chart;

    if(!chart) {
        return;
    }

    if (broker.metainfo().id == L.brokerTrading.defaultBrokers.replayBroker) {
        return;
    }

    chart.autoSLTPAppliedForBrokerTrade = null;
    chart.extendedTPAppliedForBrokerTrade = null;
    chart.autoDDBEAppliedForBrokerTrade = null;
    chart.autoBEAppliedForBrokerTrade = null;
    delete chart.__entryTime;
    chart.hasTrade = false;

    if(chart.pendingReverse == brokerTrade.id) {
        chart.pendingReverse = false;

        var isBeTrade = false;
        
        const initialSl = await L.brokerTrading.getInitialSl(broker, brokerTrade, true);
        const initialTp = await L.brokerTrading.getInitialTp(broker, brokerTrade, true);

        delete L.brokerTrading.trades[brokerTrade.id];
        
        isBeTrade = isBeTrade || brokerTrade.pl === 0;
        isBeTrade = isBeTrade || Math.abs(brokerTrade.pl) <= Math.abs(initialSl - brokerTrade.avgPrice) * brokerTrade.qty * brokerTrade.pointValue / 10;
        isBeTrade = isBeTrade || Math.abs(brokerTrade.pl) <= (chart.liveRisk || L._defaultRisk) / 10;
        isBeTrade = isBeTrade || Math.abs(brokerTrade.lastPrice - brokerTrade.avgPrice) <= Math.abs(initialSl - brokerTrade.avgPrice) / 10

        const dbgObject = {
                isBeTrade,
                initialSl,
                initialTp,
                liveRisk: chart.liveRisk,
                brokerTrade,
            };

        L.dbg("Preparing CBreak-R execution", "info", dbgObject);

        if(isBeTrade) {
            chart.bracket = {};
            chart.bracket["TP"] = initialSl;  
            chart.bracket["SL"] = initialTp;

            L.cStrat.placeBracketOrder(chart, L.t.trading(), brokerTrade.qty, brokerTrade.symbol, -brokerTrade.side, 2);
            L.cStrat.setDefaultBE(chart, brokerTrade.avgPrice, initialSl, false);
            L.cStrat.setDefaultDDBE(chart, brokerTrade.avgPrice, initialTp, false);
        }
    } else {
        chart.pendingReverse = false;
        delete L.brokerTrading.trades[brokerTrade.id];
    }
}

L.brokerTrading.addToSLs = function(brokerTrade, slOrder) {
    if(!slOrder) {
        L.dbg("No SL found", "error");
        return;
    }
        
    const cachedBrokerTrade = L.brokerTrading.trades[brokerTrade.id];
    cachedBrokerTrade.SLs.add(slOrder);
}

L.brokerTrading.addToTPs = function(brokerTrade, tpOrder) {
    if(!tpOrder) {
        L.dbg("No TP found", "error");
        return;
    }

    const cachedBrokerTrade = L.brokerTrading.trades[brokerTrade.id];
    cachedBrokerTrade.TPs.add(tpOrder);
}

L.brokerTrading.getInitialSl = async function(broker, brokerTrade, valueOnly) {
    var slOrder = L.brokerTrading.trades[brokerTrade.id].SLs?.values().next().value;
    if(!slOrder) {
        slOrder = await L.brokerTrading.getBrokerSlOrder(broker, brokerTrade);
        if(slOrder) {
            L.brokerTrading.addToSLs(brokerTrade, slOrder);
        }
    }

    if(!slOrder) {
        return null;
    }
    
    return valueOnly ? slOrder.stopLoss || slOrder.stopPrice || slOrder.avgPrice : slOrder;
}

L.brokerTrading.getInitialTp = async function(broker, brokerTrade, valueOnly) {
    var tpOrder = L.brokerTrading.trades[brokerTrade.id].TPs?.values().next().value;
    if(!tpOrder) {
        tpOrder = await L.brokerTrading.getBrokerTpOrder(broker, brokerTrade);
        if(tpOrder) {
            L.brokerTrading.addToTPs(brokerTrade, tpOrder);
        }
    }

    if(!tpOrder) {
        return null;
    }

    return valueOnly ? tpOrder.takeProfit || tpOrder.limitPrice || tpOrder.avgPrice : tpOrder;
}

L.subscribe(L.events.onLoad, async () => {
    L.brokerTrading.keepBrokerInSync();

    L.subscribe(L.events.broker.onTradeOpen, L.cStrat.onBrokerLiveTradeOpen);
    L.subscribe(L.events.broker.onTradeClose, L.cStrat.onBrokerLiveTradeClose);
});