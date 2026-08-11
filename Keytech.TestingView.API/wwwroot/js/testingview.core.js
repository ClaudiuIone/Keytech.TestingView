const L = {
    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    version: 5,
    user: { userId: null },
    dataOps: {},
    sessionParameterIds: {
        FirstTradeInfo: 1,
        PreventCandlePreviews: 2,
        EnablePredefinedTimes: 3,
        PredefinedTimes: 4,
        ConfirmEntries: 7,
        ShowOpenPositionTip: 8,
        AutoSnapshot: 9,
        CanModifyQty: 10,
        AutoOpenPanel: 11,
        WatchIntegrationPlots: 12
    },
    snapshotUrlPrefix: "https://tradingview.com/x/",
    r: await TradingViewApi.replayApi(),
    t: TradingViewApi,
    events: {
        onSelectDate: [],
        onFastForward: [],
        onOpeningPosition: [],
        onNewReplayResolutions: [],
        onTimeframeChange: [],
        onLoad: [],
        broker: {
            onBrokerConnected: [],
            onTradeOpen: [],
            onTradeClose: [],
            onTradeChange: []
        }
    }
};
