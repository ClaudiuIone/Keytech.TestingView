const L = TradingViewApi.L;
L._TradingUser = "APEX_379932";
L._TradingPass = "A$p7hH19$DPN";

L.tradovateSessionChannel = new BroadcastChannel(`tradovate-session`);
L.tradovateSessionChannel.onmessage = async function (event) {
    const data = event.data;
    if (data.type === 'BROKER-LOGOUT') {
        const trading = L.t.trading();
        const broker = trading.activeBroker();
        await L.tryExecAsync(() => broker.disconnect());
        await L.delay(1000);
        L.tradovateSessionChannel.postMessage({ type: "BROKER-LOGIN" });
    }

    if (data.type === 'BROKER-LOGIN') {
        if (L._awaitingBrokerLogin) {
            if(!L._TradingUser) {
                L._TradingUser = await L.showInputPrompt("Tradovate User", "APEX_379932", "APEX_379932", document.body);
            }
            if(!L._TradingPass) {
                L._TradingPass = await L.showInputPrompt("Tradovate Pass", "A$p7hH19$DPN", "A$p7hH19$DPN", document.body);
            }

            const trading = L.t.trading();
            await trading.selectBroker("TRADOVATE");
            trading.activeBroker().signIn(L._TradingUser, L._TradingPass, 1);
            L._awaitingBrokerLogin = false;
        }
    }
}

$(document).on("keydown.brokers", async (event) => {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'b') {
        await navigator.clipboard.writeText(L._TradingPass);
        await L.delay(500);
        await navigator.clipboard.writeText(L._TradingUser);
        L.toast("Tradovate credentials copied to clipboard.", 3000);
    } else if (event.ctrlKey && event.key.toLowerCase() === 'b') {
        L._awaitingBrokerLogin = true;
        L.tradovateSessionChannel.postMessage({ type: "BROKER-LOGOUT" });
    }
});