const L = TradingViewApi.L;
L.mt5copier = {};
L.mt5copier.mt5Risk = 2000;

L.mt5copier.onBrokerLiveTradeOpen = async function(e) {
    const broker = e.broker;
    const brokerTrade = e.brokerTrade;
    const chart = e.chart;

    if(!chart) {
        return;
    }

    if (broker.metainfo().id == L.brokerTrading.defaultBrokers.replayBroker) {
        return;
    }

    if(chart.sendToMT5) {
        const shapes = L.getPositionShapes(chart);
        
        const shape = shapes.slice(-1)[0];
        const shapeProperties = shape.getProperties();
        const shapeDataSourceProperties = shape.lineDataSource().properties();

        var c = "";
        if(brokerTrade.side == 1) {
            c += `buy`;
        } else {
            c += `sell`;
        }

        var riskUsd = L.mt5copier.mt5Risk || chart.liveRisk;
        if(!riskUsd) {
            if(shapeProperties.riskDisplayMode == "money") {
                riskUsd = shapeProperties.risk;
            } else {
                riskUsd = L._defaultRisk;
                L.toast("Paper Copier: Unable to determine risk amount, defaulting to $" + L._defaultRisk);
            }
        }

        c += `,${chart.mtSymbol}`;
        c += `,riskUsd=${riskUsd}`;
        c += `,sl=${Math.abs(shapeDataSourceProperties.stopPrice.value() - shapeDataSourceProperties.entryPrice.value()) / chart.mtPointSize}`;
        c += `,tp=${Math.abs(shapeDataSourceProperties.targetPrice.value() - shapeDataSourceProperties.entryPrice.value()) / chart.mtPointSize}`;
        c += `,stopsMultiplier=1.5`;
        //c += `,split=10`;
        c += `,comment=${L.getTradeComment()}`;

        return L.sendPayloadToMT5(c);
    }
}

L.mt5copier.onBrokerLiveTradeClose = function(e) {
    const broker = e.broker;
    const brokerTrade = e.brokerTrade;
    const chart = e.chart;
    
    if(!chart) {
        return;
    }

    if (broker.metainfo().id == L.brokerTrading.defaultBrokers.replayBroker) {
        return;
    }

    if(chart.sendToMT5 && chart.mtSymbol) {
        var c = `closelongshort,${chart.mtSymbol},comment=${L.getTradeComment()}`;
        return L.sendPayloadToMT5(c);
    }
}

L.toggleMT5Copy = async function (chart, forcedValue) {
    if(!chart) {
        chart = L.c();
    }
    chart.sendToMT5 = forcedValue !== undefined ? forcedValue : !chart.sendToMT5;
    
    if(chart.sendToMT5) {
        var symbolInfo = await L.waitUntil(async () => chart.chartModel().mainSeries().symbolInfo());
        chart.mtSymbol = symbolInfo.name;
        chart.liveRisk = L._defaultRisk;

        // Direct NAS100/USTEC CFD
        if(symbolInfo.name == "NAS100") {
            chart.liveRiskMultiplier = 1;
            chart.ptsMultiplier = 0.01;
        }

        // Direct US500 CFD
        if(symbolInfo.name == "US500") {
            chart.liveRiskMultiplier = 1;
            chart.ptsMultiplier = 0.01;
        }

        // GER40 (DAX) - assuming direct CFD
        // GER40 has 2 digits (MT5 point = 0.01)
        if(symbolInfo.name == "GER40") {
            chart.liveRiskMultiplier = 1;
            chart.ptsMultiplier = 0.01;
        }

        // Tradovate MNQ → IC Markets USTEC
        // MNQ: $2/pt per contract, USTEC: $1/pt per lot → multiply by 2
        // USTEC has 2 digits (MT5 point = 0.01), DB pointSize for MNQ = 2 → ptsMultiplier = 0.01/2 = 0.005
        if(symbolInfo.root == "MNQ") {
            chart.liveRiskMultiplier = 2;
            chart.ptsMultiplier = 0.005;
        }

        // Tradovate Mes → FTMO US500
        if(symbolInfo.root == "MES") {
            chart.liveRiskMultiplier = 5;
            chart.ptsMultiplier = 0.002;
        }

        // Tradovate NQ → IC Markets USTEC
        // NQ: $20/pt per contract, USTEC: $1/pt per lot → multiply by 20
        if(symbolInfo.root == "NQ") {
            chart.liveRiskMultiplier = 20;
            chart.ptsMultiplier = 0.005;
        }

        // Tradovate ES → US500
        if(symbolInfo.root == "ES") {
            chart.liveRiskMultiplier = 50;
            chart.ptsMultiplier = 0.002;
        }

        // Tradovate MYM → IC Markets US30
        // MYM: $0.50/pt per contract, US30: $1/pt per lot → multiply by 0.5
        // US30 has 2 digits (MT5 point = 0.01), DB pointSize for MYM = 0.5 → ptsMultiplier = 0.01/0.5 = 0.02
        if(symbolInfo.root == "MYM") {
            chart.liveRiskMultiplier = 0.5;
            chart.ptsMultiplier = 0.02;
        }

        // Tradovate YM → IC Markets US30
        // YM: $5/pt per contract, US30: $1/pt per lot → multiply by 5
        if(symbolInfo.root == "YM") {
            chart.liveRiskMultiplier = 5;
            chart.ptsMultiplier = 0.02;
        }

        // Direct US30 CFD
        if(symbolInfo.name == "US30") {
            chart.liveRiskMultiplier = 1;
            chart.ptsMultiplier = 0.01;
        }

        // Tradovate MGC → IC Markets XAUUSD
        // MGC: $10/pt per contract, XAUUSD: $100/pt per lot → multiply by 0.1
        // XAUUSD has 2 digits (MT5 point = 0.01), DB pointSize for MGC = 10 → ptsMultiplier = 0.01/10 = 0.001
        if(symbolInfo.root == "MGC") {
            chart.liveRiskMultiplier = 0.1;
            chart.ptsMultiplier = 0.001;
        }

        // Tradovate GC → IC Markets XAUUSD
        // GC: $100/pt per contract, XAUUSD: $100/pt per lot → multiply by 1
        if(symbolInfo.root == "GC") {
            chart.liveRiskMultiplier = 1;
            chart.ptsMultiplier = 0.001;
        }

        // Direct XAUUSD CFD
        if(symbolInfo.name == "XAUUSD") {
            chart.liveRiskMultiplier = 0.01;
            chart.ptsMultiplier = 0.01;
        }

        if(!chart.liveRiskMultiplier) {
            chart.liveRiskMultiplier = Number(await L.showInputPrompt("Risk Multiplier", 1, "1", document.body));
        }
        if(!chart.ptsMultiplier) {
            chart.ptsMultiplier = Number(await L.showInputPrompt("Points Multiplier", 0.01, "0.01", document.body));
        }
        
        chart.mtPointSize = (await L.getContractSize(symbolInfo.full_name, symbolInfo.type)).pointSize * chart.ptsMultiplier;
    }

    if(chart == L.c()) {
        L.toast(`Sync: ${chart.sendToMT5} | liveRiskMultiplier=${chart.liveRiskMultiplier} | ptsMultiplier=${chart.ptsMultiplier} | risk=${chart.liveRisk}`, 2000);
    }
}

L.sendToMT5 = function (chart, shapeId, isImmediate) {
    if(!chart.sendToMT5) {
        return;
    }

    const shape = L.getShapeById(shapeId, chart, false);
    const shapeProperties = shape.getProperties();
    const shapeDataSourceProperties = shape.lineDataSource().properties();
    
    const shapeEntryPrice = shapeDataSourceProperties.entryPrice.value();
    const bar = L.getCurrentBarInfo(chart);

    var c = "";
    if((shapeProperties.name && shapeProperties.name == 'long_position') || shapeDataSourceProperties._defaultName?.toLowerCase() == 'linetoolriskrewardlong') {
        if(isImmediate) {
            c += `buy`;
        } else {
            if(shapeEntryPrice < bar.close) {
                c += `buylimit`;
            } else {
                c += `buystop`;
            }
        }
    } else if((shapeProperties.name && shapeProperties.name == 'short_position') || shapeDataSourceProperties._defaultName?.toLowerCase() == 'linetoolriskrewardshort') {
        if(isImmediate) {
            c += `sell`;
        } else {
            if(shapeEntryPrice > bar.close) {
                c += `selllimit`;
            } else {
                c += `sellstop`;
            }
        }
    } else {
        alert("MT5 Copier: Unable to determine position type (long/short) from shape.");
        return;
    }

    c += `,${chart.mtSymbol}`;
    if(!isImmediate) {
        c += `,pending=${Math.abs(bar.close - shapeEntryPrice) / chart.mtPointSize}`;
    }
    c += `,sl=${Math.abs(shapeDataSourceProperties.stopPrice.value() - shapeEntryPrice) / chart.mtPointSize}`;
    c += `,tp=${Math.abs(shapeDataSourceProperties.targetPrice.value() - shapeEntryPrice) / chart.mtPointSize}`;
    c += `,risk=${shapeProperties.qty * chart.liveRiskMultiplier * 5}`;
    //c += `,split=10`
    c += `,stopsMultiplier=1.5`;
    c += `,comment=${L.getTradeComment()}`;

    return L.sendPayloadToMT5(c);
}

L.getTradeComment = function() {
    if(['BacktestingMaestro'].includes(user.username)) {
        return "TVM";
    }

    if (user.username == 'LazarDan1818') {
        return "TVM-D"
    }

    return "TVM-G";
}

L.sendPayloadToMT5 = function(payload) {
    return L.tryExecAsync(() => fetch('https://api.testingview.com/app/proxy', {
        method: 'POST',
        headers: {
            'address': 'http://127.0.0.1/signal',
            'method': 'POST',
            'Content-Type': 'text/plain'
        },
        body: payload
    }), true);
}

$(document).on("keydown.mt5copier", async (event) => {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'o') {
        L.applyOnCharts(chart => {
            L.toggleMT5Copy(chart);
        });
    }

    if (event.altKey && event.key.toLowerCase() === 'u' && ['BacktestingMaestro'].includes(user.username)) {
        var chart = TradingViewApi.activeChart();
        var shapeId = chart.getAllShapes().filter(s => s.name == 'long_position' || s.name == 'short_position').slice(-1)[0].id;
        
        if(chart.sendToMT5) {
            await L.sendToMT5(chart, shapeId, event.shiftKey)
            L.toast("Order sent", 10000);
        } else {
            L.toast("Sync is disabled", 1000);
        }
    }
});

L.subscribe(L.events.onLoad, async () => {
    L.subscribe(L.events.broker.onBrokerConnected, async (broker) => {
        if (broker.metainfo().id !== L.brokerTrading.defaultBrokers.replayBroker) {
            // L.applyOnCharts(chart => {
            //     L.toggleMT5Copy(chart, ['TestingView', 'LazarDan1818', 'eBacktesting'].includes(user.username));
            // });

            // L.toast(`Broker: ${broker.metainfo().id} - Syncing: ${L.c().sendToMT5 ? 'YES' : 'NO'}`);
        }
    });

    L.brokerTrading.keepBrokerInSync();

    L.subscribe(L.events.broker.onTradeOpen, L.mt5copier.onBrokerLiveTradeOpen);
    L.subscribe(L.events.broker.onTradeClose, L.mt5copier.onBrokerLiveTradeClose);
});