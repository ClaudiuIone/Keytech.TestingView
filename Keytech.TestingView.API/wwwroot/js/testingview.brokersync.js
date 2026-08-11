L.brokerTrading = {symbols: {}, defaultBrokers: {replayBroker: "REPLAYBROKER", paperTrading: "Paper"}};

L.brokerTrading.getMainOrder = async function(broker, brokerTrade, orders) {
    if (!orders) {
        orders = await broker.orders();
    }

    const candidates = orders.filter(o =>
        o.symbol == brokerTrade.symbol &&
        o.side == brokerTrade.side &&
        o.qty == brokerTrade.qty &&
        !o.parentId &&
        (o.avgPrice != null || o.stopPrice != null)
    );

    if (!candidates.length) {
        return null;
    }

    return candidates.reduce((best, o) => {
        const orderPrice = o.avgPrice != null ? o.avgPrice : o.stopPrice;
        const bestPrice = best.avgPrice != null ? best.avgPrice : best.stopPrice;

        const orderDiff = Math.abs(orderPrice - brokerTrade.avgPrice);
        const bestDiff = Math.abs(bestPrice - brokerTrade.avgPrice);

        if (orderDiff < bestDiff) {
            return o;
        }

        if (orderDiff > bestDiff) {
            return best;
        }

        return (o.updateTime || 0) > (best.updateTime || 0) ? o : best;
    });
}

L.brokerTrading.getBrokerSlOrder = async function(broker, brokerTrade) {
    const orders = await broker.orders();
    const mainOrder = await L.brokerTrading.getMainOrder(broker, brokerTrade, orders);

    const slOrder = orders.find(o => o.side != mainOrder.side && o.status == 6 && o.qty == mainOrder.qty && o.stopPrice > 0 && (o.parentId == mainOrder.id || (o.stopPrice == mainOrder.stopLoss && !o.takeProfit)));
    if(slOrder) slOrder.mainOrder = mainOrder;
    return slOrder;
}

L.brokerTrading.getBrokerTpOrder = async function(broker, brokerTrade) {
    const orders = await broker.orders();
    const mainOrder = await L.brokerTrading.getMainOrder(broker, brokerTrade, orders);

    const tpOrder = orders.find(o => o.side != mainOrder.side && o.status == 6 && o.qty == mainOrder.qty && o.limitPrice > 0 && (o.parentId == mainOrder.id || (o.limitPrice == mainOrder.takeProfit && !o.stopPrice)));
    if(tpOrder) tpOrder.mainOrder = mainOrder;
    return tpOrder;
}

L.brokerTrading.keepBrokerInSync = async function () {
    await L.asyncInterval(async () => {
        var broker;

        var equity = await L.tryExecAsync(() => {
            const trading = L.t.trading();
            broker = trading.activeBroker();
            return L.brokerTrading.getCurrentEquity(broker);
        }, true);

        if(equity > 0 && !broker?.isSubscribed) {
            broker.isSubscribed = true;
            await L.brokerTrading.subscribeToBrokerTradeUpdates(broker);
            await L.trigger(L.events.broker.onBrokerConnected, broker);
        }
    }, 500, 0, true);
}

L.brokerTrading.subscribeToBrokerTradeUpdates = async function (broker) {
    L.brokerTrading.openBrokerTrades = new Map();

    broker.positions().then(brokerTrades => {
        for (const brokerTrade of brokerTrades) {
            if (L.brokerTrading.isOpenBrokerTrade(brokerTrade)) {
                L.brokerTrading.openBrokerTrades.set(brokerTrade.id, brokerTrade);
            }
        }
    });

    const senderId = L.session?.sessionId || L.id;
    (broker.positionUpdate || broker.onPositionUpdate).subscribe(senderId, (brokerTrade) => L.brokerTrading.handleBrokerTradeUpdate(broker, brokerTrade, senderId));
    broker.positionPartialUpdate.subscribe(senderId, (brokerTrade) => L.brokerTrading.handleBrokerTradeUpdate(broker, brokerTrade, senderId));

    broker.positionsFullUpdate.subscribe(senderId, () => {
        broker.positions().then(brokerTrades => {
            L.brokerTrading.openBrokerTrades.clear();
            for (const brokerTrade of brokerTrades) {
                if (L.brokerTrading.isOpenBrokerTrade(brokerTrade)) {
                    L.brokerTrading.openBrokerTrades.set(brokerTrade.id, brokerTrade);
                }
            }
        });
    });
}

L.brokerTrading.isOpenBrokerTrade = function(brokerTrade) {
    return (
        brokerTrade.qty !== 0 ||
        (brokerTrade.longQty && brokerTrade.longQty !== 0) ||
        (brokerTrade.shortQty && brokerTrade.shortQty !== 0)
    );
}

L.brokerTrading.cloneBrokerTrade = function (brokerTrade) {
    return {
        id: brokerTrade.id,
        symbol: brokerTrade.symbol,

        side: brokerTrade.side,
        qty: brokerTrade.qty,

        avgPrice: brokerTrade.avgPrice,
        lastPrice: brokerTrade.lastPrice,

        pointValue: brokerTrade.pointValue,
        leverage: brokerTrade.leverage,

        accountCurrency: brokerTrade.accountCurrency,
        isDelayed: brokerTrade.isDelayed,

        marketValue: brokerTrade.marketValue,
        tradeValue: brokerTrade.tradeValue,
        usedMargin: brokerTrade.usedMargin,

        pl: L.coalesce(brokerTrade.pl, brokerTrade.unrealizedPl, brokerTrade.realizedPl),
        plPercent: brokerTrade.plPercent,

        stopLoss: brokerTrade.stopLoss,
        takeProfit: brokerTrade.takeProfit,

        expirationDate: brokerTrade.expirationDate
            ? {
                dateOrDateTime: brokerTrade.expirationDate.dateOrDateTime,
                hasTime: brokerTrade.expirationDate.hasTime
            }
            : null,

        exitLevels: Array.isArray(brokerTrade.exitLevels)
            ? brokerTrade.exitLevels.map(function (exitLevel) {
                return exitLevel
                    ? {
                        qty: exitLevel.qty,
                        takeProfit: exitLevel.takeProfit,
                        stopLoss: exitLevel.stopLoss,
                        guaranteedStop: exitLevel.guaranteedStop,
                        trailingStopPips: exitLevel.trailingStopPips
                    }
                    : null;
            })
            : null
    };
};

L.brokerTrading.handleBrokerTradeUpdate = function(broker, brokerTrade, senderId) {
    if(senderId === (L.session?.sessionId || L.id)) {
        var chart = L.brokerTrading.findChart(brokerTrade);
      
        const currentlyOpen = L.brokerTrading.isOpenBrokerTrade(brokerTrade);
        const hadBefore = L.brokerTrading.openBrokerTrades.has(brokerTrade.id);

        if (currentlyOpen && !hadBefore) {
            brokerTrade = L.brokerTrading.cloneBrokerTrade(brokerTrade);
            L.brokerTrading.openBrokerTrades.set(brokerTrade.id, brokerTrade);
            L.trigger(L.events.broker.onTradeOpen, { broker, brokerTrade, chart });
        } else if (!currentlyOpen && hadBefore) {
            brokerTrade = L.brokerTrading.openBrokerTrades.get(brokerTrade.id);
            L.brokerTrading.openBrokerTrades.delete(brokerTrade.id);
            L.trigger(L.events.broker.onTradeClose, { broker, brokerTrade, chart });
        } else if (currentlyOpen && hadBefore) {
            const previousBrokerTrade = L.brokerTrading.openBrokerTrades.get(brokerTrade.id);
            brokerTrade = L.brokerTrading.cloneBrokerTrade(brokerTrade);
            L.brokerTrading.openBrokerTrades.set(brokerTrade.id, brokerTrade);
            L.trigger(L.events.broker.onTradeChange, { broker, brokerTrade, previousBrokerTrade, chart });
        }
    }
}

L.brokerTrading.findChart = function(brokerTrade) {
    var chart;

    if(!L.brokerTrading.symbols[brokerTrade.symbol]) {
        const chartCount = L.t.chartsCount();
        for (let i = 0; i < chartCount; i++) {
            var c = L.t.chart(i);
            if(L.isSameSymbol(brokerTrade.symbol, c.chartModel().mainSeries().symbolInfo().full_name))
            {
                L.brokerTrading.symbols[brokerTrade.symbol] = {chart: c};
                chart = c;
                break;
            }
        }
    } else {
        chart = L.brokerTrading.symbols[brokerTrade.symbol].chart;
        if(!L.isSameSymbol(brokerTrade.symbol, chart.chartModel().mainSeries().symbolInfo().full_name)) {
            delete L.brokerTrading.symbols[brokerTrade.symbol];
            chart = L.brokerTrading.findChart(brokerTrade);
        }
    }

    return chart;
}

L.brokerTrading.getCurrentEquity = async function (broker) {
    if (!broker) return 0;

    return new Promise((resolve) => {
        const onEquity = (_accountId, equity) => {
            broker.unsubscribeEquity(onEquity);
            resolve(equity);
        };
        broker.subscribeEquity(onEquity);
    });
}

L.brokerTrading.isOpenBrokerTrade = function(brokerTrade) {
    return (
        brokerTrade.qty !== 0 ||
        (brokerTrade.longQty && brokerTrade.longQty !== 0) ||
        (brokerTrade.shortQty && brokerTrade.shortQty !== 0)
    );
}