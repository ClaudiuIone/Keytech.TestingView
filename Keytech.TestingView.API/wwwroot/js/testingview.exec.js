await L.localize();
L.t.L = L;

L.configureGlobals();
await L.addCss();

L.createToolbarButton();
L.toast(L.r.s(-2, 8) /* TestingView is ready. Start from the top toolbar when needed. */, 3000);
L.r.replayTimingMode().setValue("manual");
L.startAppRefreshPolling();

L.applyOnCharts(chart => {
    chart.crossHairMoved().subscribe({}, crossHairInfo => L.onCrossHairMoved(chart, crossHairInfo));
});

L.dataOps.getAddons().then(async addons => {
    await Promise.all(addons.map(addon => 
        new Promise((resolve, reject) => {
            $('<script>', {
                type: 'module',
                src: L.s(4, 8, `js/addon.${addon}.js?v=1`) /* https://js.testingview.com/{0} */,
                nonce: $('script')[0].nonce
            })
            .on('load', resolve)
            .on('error', reject)
            .appendTo('head');
        })
    ));

    L.trigger(L.events.onLoad);
});
