L.addCss = function () {
    return new Promise((resolve) => {
        $(`<link crossorigin='anonymous' href='${L.r.s(9, 3, L.r.s(-3, 0) /* css/backtst.css */) /* https://js.testingview.com/{0} */}?v=1' rel='stylesheet' type='text/css'></link>`) 
            .on('load', () => resolve())
            .appendTo(L.s(-1, -6) /* body */);
    });
}

L.checkAppRefreshState = async function () {
    if (L.appRefreshPolling?.refreshRequired) {
        return;
    }

    const refreshState = await L.dataOps.getRefreshState(L.appRefreshPolling?.clientVersion);
    if (!refreshState) {
        return;
    }

    L.appRefreshPolling.clientVersion = refreshState.serverVersion;

    if (refreshState.shouldRefresh && !L.appRefreshPolling.refreshRequired) {
        L.appRefreshPolling.refreshRequired = true;
        L.toast(L.r.s(-5, 0) /* A new version of TestingView is available. Please refresh the chart page to update. */, 0, "warn");
    }
}

L.startAppRefreshPolling = function () {
    if (!L.appRefreshPolling) {
        L.appRefreshPolling = {
            clientVersion: L.version,
            intervalId: null,
            refreshRequired: false
        };
    }

    if (L.appRefreshPolling.intervalId) {
        return;
    }

    L.tryExecAsync(L.checkAppRefreshState, true);

    L.appRefreshPolling.intervalId = setInterval(() => {
        L.tryExecAsync(L.checkAppRefreshState, true);
    }, 60000);
}

L.createToolbarButton = function () {
    const TestingViewButton = $(`
        <button aria-label="${L.s(-2, 7) /* TestingView */}" id="${L.s(3, -3) /* header-toolbar-backtst */}" aria-pressed="false" tabindex="-1" type="button" class="button withText apply-common-tooltip isInteractive accessible ${L.r.s(4, 5) /* backtst-button */}">
            <span role="img" aria-hidden="true">
                ${L.r.s(4, 6) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 120 120" width="24" height="24"><polygon points="10,10 10,90 100,50" stroke="white" stroke-width="2" fill="black"></polygon><rect x="22" y="25" width="8" height="50" rx="2" ry="2" fill="white"></rect><rect x="40" y="35" width="8" height="33" rx="2" ry="2" fill="white"></rect><rect x="57" y="20" width="9" height="40" rx="2" ry="2" fill="white" stroke="black" stroke-width="1"></rect></svg> */}
            </span>
            <div class="js-button-text text ${L.r.s(4, 5) /* backtst-button */}">${L.s(-2, 7) /* TestingView */}</div>
        </button>
    `);

    if (!$(`#${L.s(3, -3) /* header-toolbar-backtst */}`).length) {
        $(`button#${L.s(3, -2) /* header-toolbar-replay */}`).parents(L.r.s(-3, 8) /* div[class*='group'] */).append(TestingViewButton);
        L.TestingViewButton = TestingViewButton;

        TestingViewButton.on("click", () => {
            if (TestingViewButton.attr("aria-pressed") === L.s(0, 6) /* true */) {
                L.exit(false, true);
            } else {
                if(L.r.isReplayStarted().value()) {
                    L.messageBox(L.s(-2, 7) /* TestingView */, L.r.s(4, 7) /* Please exit Bar Replay mode before starting TestingView. */);
                } else {
                    L.showSessions();
                }
            }
        });
    }
}

L.createReplayControls = function () {
    if (!L.lastReplayControlsCheck || (Date.now() - L.session.meta.lastReplayControlsCheck) > 1000) {
        L.lastReplayControlsCheck = Date.now();

        const replayToolbar = $(L.r.s(-3, 3) /* div[class*='replayToolbar-'] */);
        if (replayToolbar.length === 0) {
            console.warn("Replay Toolbar not found!");
            return null;
        }

        const controlsPanels = replayToolbar.find(L.r.s(-3, 4) /* div[class*='controlsPanel-'] */);
        if (controlsPanels.length === 0) {
            console.warn("Controls Panel not found!");
            return null;
        }

        const controlsContainers = controlsPanels.find(L.r.s(-3, 5) /* div[class*='controls-'] */);
        if (controlsContainers.length === 0) {
            console.warn("Controls container not found!");
            return null;
        }

        replayToolbar.parent().parent().hide();
    }

    const toolbarContainer = $(L.r.s(-3, 6) /* div.chart-toolbar.chart-controls-bar div[class*='dateRangeExpanded'] */);
    if (toolbarContainer.length === 0) {
        console.warn("Toolbar container not found!");
        return null;
    }

    if ($(`.${L.r.s(4, 8) /* backtesting-replay-controls */}`).length == 0) {
        toolbarContainer.parent().parent().removeAttr(L.r.s(-3, 7) /* data-mouse-click-auto-blur */);
        toolbarContainer.children().hide();
        const replayControls = $(`
            <div class="${L.r.s(4, 8) /* backtesting-replay-controls */} controls">
                <div class="${L.r.s(0, 3) /* drag-handle */}">
                    ${L.r.s(0, 4) /* <svg width="20" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="5" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="6" cy="19" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle><circle cx="18" cy="5" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle><circle cx="18" cy="19" r="1.5"></circle></svg> */ }
                </div>
                <div class="${L.r.s(4, 9) /* controls-control */}">
                    <div class="${L.r.s(5, 0) /* controls-button */} button apply-common-tooltip isInteractive ${L.r.s(5, 1) /* play-pause-button */} ${L.s(0, 4) /* play */}" title="${L.r.s(5, 2) /* Play&#013;Shift + ⇩ */}" style="${L.session.meta.isSkippingCandles || L.session.meta.autoplayStarted ? 'display:none' : ''}" data-role="button">
                        <span role="img" aria-hidden="true">
                            ${L.r.s(5, 3) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" fill-rule="evenodd" d="m10.997 6.93 7.834 6.628a.58.58 0 0 1 0 .88l-7.834 6.627c-.359.303-.897.04-.897-.44V7.37c0-.48.538-.743.897-.44Zm8.53 5.749a1.741 1.741 0 0 1 0 2.637l-7.834 6.628c-1.076.91-2.692.119-2.692-1.319V7.37c0-1.438 1.616-2.23 2.692-1.319l7.834 6.628Z"></path></svg> */ }
                        </span>
                    </div>
                    <div class="${L.r.s(5, 0) /* controls-button */} button apply-common-tooltip isInteractive ${L.r.s(5, 1) /* play-pause-button */} ${L.s(0, 5) /* pause */}" title="${L.r.s(5, 4) /* Pause&#013;Shift + ⇩ */}" style="${L.session.meta.isSkippingCandles || L.session.meta.autoplayStarted ? '' : 'display:none'}" data-role="button">
                        <span role="img" aria-hidden="true">
                            ${L.r.s(5, 5) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" fill-rule="evenodd" d="M10 6h2v16h-2V6ZM9 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V6Zm7 0h2v16h-2V6Zm-1 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V6Z"></path></svg> */ }
                        </span>
                    </div>
                </div>
                <div class="${L.r.s(5, 6) /* controls-separator */}"><span class="${L.r.s(5, 7) /* separator */}"></span></div>
                <div class="${L.r.s(4, 9) /* controls-control */} ${L.r.s(5, 8) /* controls-control-type-forward */}">
                    <div data-role="button" class="${L.r.s(5, 0) /* controls-button */} button apply-common-tooltip isInteractive ${L.r.s(5, 9) /* forward-button */}">
                        <span role="img" aria-hidden="true">
                            ${L.r.s(6, 0) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" fill-rule="evenodd" d="M20 6v16h1V6h-1Zm-3.908 7.628L9.834 7.996A.5.5 0 0 0 9 8.368v11.264a.5.5 0 0 0 .834.372l6.258-5.632a.5.5 0 0 0 0-.744Zm.67 1.487a1.5 1.5 0 0 0 0-2.23l-6.259-5.632C9.538 6.384 8 7.07 8 8.368v11.264c0 1.299 1.538 1.984 2.503 1.115l6.258-5.632Z"></path></svg> */ }
                        </span>
                    </div>
                </div>
                <div class="${L.r.s(4, 9) /* controls-control */} ${L.r.s(5, 8) /* controls-control-type-forward */}">
                    <div title="${L.r.s(6, 1) /* Fast forward&#013;Ctrl + Shift + ⇨ */}" data-role="button" class="${L.r.s(5, 0) /* controls-button */} button apply-common-tooltip isInteractive ${L.r.s(6, 2) /* fast-forward-button */}">
                        <span role="img" aria-hidden="true">
                            ${L.r.s(6, 3) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 28" width="36" height="28"><path fill="currentColor" fill-rule="evenodd" d="M8 6.93l7.834 6.628a.58.58 0 0 1 0 .88L8 21.065c-.359.303-.897.04-.897-.44V7.37c0-.48.538-.743.897-.44Zm8.53 5.749a1.741 1.741 0 0 1 0 2.637L8.696 21.944c-1.076.91-2.692.119-2.692-1.319V7.37c0-1.438 1.616-2.23 2.692-1.319l7.834 6.628Z"></path><path fill="currentColor" fill-rule="evenodd" d="M18 6.93l7.834 6.628a.58.58 0 0 1 0 .88L18 21.065c-.359.303-.897.04-.897-.44V7.37c0-.48.538-.743.897-.44Zm8.53 5.749a1.741 1.741 0 0 1 0 2.637L18.696 21.944c-1.076.91-2.692.119-2.692-1.319V7.37c0-1.438 1.616-2.23 2.692-1.319l7.834 6.628Z"></path></svg> */ }
                        </span>
                    </div>
                </div>
                <select class="${L.r.s(6, 4) /* skip-intervals */} input normal" title="${L.r.s(6, 5) /* Fast forward interval */}">
                </select>
                <div class="${L.r.s(4, 9) /* controls-control */} ${L.r.s(6, 6) /* controls-control-type-goto-date */}">
                    <div title="${L.r.s(6, 7) /* Go to date/time */}" data-role="button" class="${L.r.s(5, 0) /* controls-button */} button apply-common-tooltip isInteractive ${L.r.s(6, 8) /* goto-date-button */}">
                        <span role="img" aria-hidden="true">
                            ${L.r.s(6, 9) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18.06a8.06 8.06 0 1 1 0-16.12 8.06 8.06 0 0 1 0 16.12Zm2.5-4.2-3.43-2.5a.49.49 0 0 1-.2-.38V6.35c0-.26.22-.48.48-.48h1.3c.26 0 .48.22.48.48v5.72l2.7 1.96c.21.16.25.46.1.68l-.76 1.04a.49.49 0 0 1-.68.1Z"></path></svg> */ }
                        </span>
                    </div>
                </div>
                <div class="${L.r.s(5, 6) /* controls-separator */}"><span class="${L.r.s(5, 7) /* separator */}"></span></div>
                <div class="${L.r.s(7, 0) /* backtst-session-balance */}">
                    <div class="${L.r.s(7, 1) /* backtst-session-balance-balance */}">
                        <span class="${L.r.s(7, 2) /* backtst-session-balance-balance */}">${L.r.s(7, 3) /* Balance */}:</span>
                        <span class="${L.r.s(7, 4) /* backtst-session-balance-balance-value */}">${(L?.session?.meta?.balance || L?.session?.capital).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</span>
                        <span class="${L.r.s(7, 5) /* backtst-session-balance-balance-currency */} ${L.r.s(8, 1) /* currency */}">${L.session.currencyId}</span>
                    </div>
                    <div class="${L.r.s(7, 6) /* backtst-session-balance-equity */}">
                        <span class="${L.r.s(7, 7) /* backtst-session-balance-equity-label */}">${L.r.s(7, 8) /* Equity */}:</span>
                        <span class="${L.r.s(7, 9) /* backtst-session-balance-equity-value */}">${L?.session?.meta?.equity?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</span>
                        <span class="${L.r.s(8, 0) /* backtst-session-balance-equity-currency */} ${L.r.s(8, 1) /* currency */}">${L.session.currencyId}</span>
                    </div>
                </div>
                <div class="${L.r.s(5, 6) /* controls-separator */}"><span class="${L.r.s(5, 7) /* separator */}"></span></div>
                <div class="${L.r.s(4, 9) /* controls-control */} ${L.r.s(8, 2) /* controls-control-type-review */}">
                    <div data-role="button" class="${L.r.s(5, 0) /* controls-button */} button apply-common-tooltip isInteractive ${L.r.s(8, 3) /* backtst-review-button */} ${L.session.meta.isReviewMode ? L.r.s(9, 5) /* isActive */ : ""}" data-tooltip="${L.r.s(8, 4) /* Review mode */}">
                        <span role="img" aria-hidden="true">
                            ${L.r.s(8, 5) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="24"><path fill="currentColor" d="M18.93 12.68v3.84c0 .96-.34 1.78-1.01 2.46A3.33 3.33 0 0 1 15.47 20h-10c-.96 0-1.78-.34-2.45-1.02A3.36 3.36 0 0 1 2 16.52V6.48c0-.96.34-1.78 1.02-2.46A3.33 3.33 0 0 1 5.46 3h10.01c.5 0 .97.1 1.4.3.13.06.2.15.22.28a.38.38 0 0 1-.1.35l-.6.6a.38.38 0 0 1-.27.11c-.03 0-.06 0-.1-.02a2.13 2.13 0 0 0-.55-.07h-10c-.54 0-.99.18-1.37.56-.37.38-.56.84-.56 1.37v10.04c0 .53.19.99.56 1.37.38.38.83.56 1.36.56h10.01c.53 0 .98-.18 1.36-.56.38-.38.56-.84.56-1.37v-3.06c0-.1.04-.2.11-.27l.77-.77a.38.38 0 0 1 .28-.12c.05 0 .1 0 .14.03.16.07.24.18.24.35Zm2.78-5.9-9.79 9.83c-.2.19-.42.29-.68.29-.27 0-.5-.1-.69-.3l-5.17-5.18a.94.94 0 0 1-.29-.7c0-.26.1-.49.29-.68L6.7 8.7c.2-.2.42-.29.69-.29.26 0 .5.1.68.3l3.17 3.17 7.78-7.82c.19-.19.42-.29.68-.29.27 0 .5.1.69.3L21.7 5.4c.2.2.29.43.29.7 0 .26-.1.49-.29.68Z"></path></svg> */ }
                        </span>
                    </div>
                </div>
                <div class="${L.r.s(4, 9) /* controls-control */} ${L.r.s(8, 6) /* controls-control-type-stats */}">
                    <div data-role="button" class="${L.r.s(5, 0) /* controls-button */} button apply-common-tooltip isInteractive ${L.r.s(8, 7) /* backtst-stats-button */}" data-tooltip="${L.stats.getStatsSummary()}">
                        <span role="img" aria-hidden="true">
                            ${L.r.s(8, 8) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="24"><path fill="currentColor" d="M15 14.5h1.5c.25 0 .5-.25.5-.5V8.75c0-.25-.25-.5-.5-.5H15c-.25 0-.5.25-.5.5V14c0 .25.25.5.5.5Zm3.75 0h1.5c.25 0 .5-.25.5-.5V5c0-.25-.25-.5-.5-.5h-1.5c-.25 0-.5.25-.5.5v9c0 .25.25.5.5.5Zm-11.25 0H9c.25 0 .5-.25.5-.5v-2.75c0-.25-.25-.5-.5-.5H7.5c-.25 0-.5.25-.5.5V14c0 .25.25.5.5.5Zm3.75 0h1.5c.25 0 .5-.25.5-.5V6.25c0-.25-.25-.5-.5-.5h-1.5c-.25 0-.5.25-.5.5V14c0 .25.25.5.5.5ZM21.38 17H4.5V5.12a.62.62 0 0 0-.63-.62H2.63a.62.62 0 0 0-.62.63v13.12c0 .69.56 1.25 1.25 1.25h18.13c.34 0 .62-.28.62-.63v-1.25a.62.62 0 0 0-.63-.62Z"></path></svg> */ }
                        </span>
                    </div>
                </div>
                <div class="${L.r.s(4, 9) /* controls-control */} ${L.r.s(8, 9) /* controls-control-type-settings */}">
                    <div data-role="button" class="${L.r.s(5, 0) /* controls-button */} button apply-common-tooltip isInteractive ${L.r.s(9, 1) /* backtst-settings-button */}" data-tooltip="${L.r.s(9, 0) /* TestingView Settings */}">
                        <span role="img" aria-hidden="true">
                            ${L.r.s(9, 2) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="24" fill="currentColor"><path fill="currentColor" d="m21.3 10.67-2.33-1.58.53-2.78a1.59 1.59 0 0 0-1.85-1.85l-2.77.53-1.57-2.34c-.6-.87-2.03-.87-2.62 0L9.11 5l-2.76-.53A1.58 1.58 0 0 0 4.5 6.32l.53 2.77-2.33 1.58a1.58 1.58 0 0 0 0 2.62l2.33 1.58-.53 2.77a1.58 1.58 0 0 0 1.85 1.86l2.76-.54 1.58 2.34a1.58 1.58 0 0 0 2.62 0l1.57-2.34 2.77.54c.53.1 1.05-.06 1.42-.43.37-.38.53-.9.43-1.42l-.53-2.78 2.33-1.58a1.58 1.58 0 0 0 0-2.62ZM16.9 14l.68 3.56-3.55-.68-2.03 3-2.03-3-3.55.68.69-3.56-3-2.03 3-2.03-.69-3.57 3.56.7 2.02-3 2.03 3 3.55-.7-.69 3.57 3 2.03-3 2.03ZM12 7.94a4.07 4.07 0 1 0 .01 8.14A4.07 4.07 0 0 0 12 7.94Zm0 6.25a2.19 2.19 0 1 1 0-4.38 2.19 2.19 0 0 1 0 4.38Z"></path></svg> */ }
                        </span>
                    </div>
                </div>
                <div class="${L.r.s(5, 6) /* controls-separator */} ${L.r.s(4, 3) /* analysis-timer-separator */}"><span class="${L.r.s(5, 7) /* separator */} "></span></div>
                <div class="${L.r.s(4, 4) /* backtst-session-analysis-timer */}">${L.r.s(9, 4) /* Analysis time */}: ${((L?.session?.meta?.analysisTimes || []).slice(-1)[0]?.analysisTimespan || "00:00")}</div>
            </div>
        `);

        $(`.${L.r.s(6, 4) /* skip-intervals */}`, replayControls).on("change", function () {
            if (L.session?.meta) {
                L.session.meta.forceStopPlayback = false;
                L.session.meta.selectedResolution = $(this).val();
                L.dataOps.setSessionTimeframeFastForwardResolution(L.session.sessionId, L.resolutionToSeconds(L.getCurrentReplayResolution()), L.session.meta.selectedResolution);
            }

        });

        $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`, replayControls).on("click", () => {
            L.session.meta.forceStopPlayback = false;
            L.session.meta.disableCurrentDateTracking = false;
            L.startSkipping();
        });

        $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`, replayControls).on("click", () => {
            L.stopSkipping();
            L.session.meta.forceStopPlayback = true;
        });

        $(`.${L.r.s(5, 9) /* forward-button */}`, replayControls).on("click", async () => {
            L.session.meta.forceStopPlayback = false;
            L.session.meta.disableCurrentDateTracking = false;
            await L.skipTime(0, false, 0);
        });

        $(`.${L.r.s(5, 9) /* forward-button */}`, replayControls).on("contextmenu", async (e) => {
            L.session.meta.forceStopPlayback = false;
            L.session.meta.disableCurrentDateTracking = false;
            const selectedIntervalValue = Number($(`.${L.r.s(6, 4) /* skip-intervals */}`, replayControls).find("option:first").val());
            await L.skipTime(selectedIntervalValue, false, 0);
        });

        $(`.${L.r.s(6, 2) /* fast-forward-button */}`, replayControls).on("click", async () => {
            L.session.meta.forceStopPlayback = false;
            L.session.meta.disableCurrentDateTracking = false;
            const selectedIntervalValue = Number($(`.${L.r.s(6, 4) /* skip-intervals */}`, replayControls).val());
            await L.skipTime(selectedIntervalValue, false, 0);
            await L.trigger(L.events.onFastForward);

            L.sessionChannel.postMessage({type: "FAST-FORWARD", sessionId: L.session.sessionId, interval: selectedIntervalValue});
        });

        $(`.${L.r.s(6, 8) /* goto-date-button */}`, replayControls).on("click", () => {
            L.session.meta.forceStopPlayback = false;
            L.showGotoDateDialog();
        });

        if (!L.session.sessionColumns.find(c => c.columnName == L.r.s(2, -6) /* Analysis Time */).visible) {
            $(`.${L.r.s(4, 3) /* analysis-timer-separator */}`, replayControls).hide();
            $(`.${L.r.s(4, 4) /* backtst-session-analysis-timer */}`, replayControls).hide();
        }

        $(`.${L.r.s(4, 4) /* backtst-session-analysis-timer */}`, replayControls).on("click", () => {
            if (L.session.meta.analysisTimes && L.session.meta.analysisTimes.filter(at => at.analysisDuration > 5 && at.analysisStartTime < L.session.currentDate).length > 1) {
                L.showAnalysisTimesDialog();
            }
        });

        $(`.${L.r.s(0, 3) /* drag-handle */}`, replayControls).on("mousedown", (e) => {
            const controls = $(`.${L.r.s(4, 8) /* backtesting-replay-controls */}`);
            controls.attr(L.r.s(0, -1) /* isDragging */, 1);
            controls.attr("startX", e.clientX);
            controls.attr("startLeft", controls.offset().left);
            $(`.${L.r.s(0, 3) /* drag-handle */}`).css("cursor", "grabbing");
            e.preventDefault();
        });

        $(`.${L.r.s(9, 1) /* backtst-settings-button */}`, replayControls).on("click", () => {
            L.session.meta.forceStopPlayback = false;
            L.showSettings();
        });

        $(`.${L.s(4, -4) /* backtst-stats-button */}`, replayControls).on("click", () => {
            L.stats.showSessionStatistics();
        });

        if (L.session.positions.length < 3) {
            $(`.${L.r.s(8, 3) /* backtst-review-button */}`, replayControls).parent().hide();
        } else {
            $(`.${L.r.s(8, 3) /* backtst-review-button */}`, replayControls).on("click", async () => {
                if(!L.session.meta.isReviewMode) {
                    L.session.meta.realSessionDate = L.session.currentDate;
                    if (L.session.getActivePositions().length == 0) {
                        L.session.meta.isReviewMode = true;
                        $(`.${L.r.s(8, 3) /* backtst-review-button */}`, replayControls).addClass(L.r.s(9, 5) /* isActive */);
                        L.toast(L.r.s(9, 6) /* Review mode: click on a position's date (TestingView panel) to replay the trade. */, 3000);
                    } else {
                        L.messageBox(L.r.s(9, 7) /* Open position */, L.r.s(9, 8) /* You cannot enter review mode while having active positions. */);
                    }
                } else {
                    $(`.${L.r.s(8, 3) /* backtst-review-button */}`, replayControls).removeClass(L.r.s(9, 5) /* isActive */);

                    if(L.r.currentDate().value() != L.session.meta.realSessionDate) {
                        await L.selectDateWithNavigation(L.session.meta.realSessionDate);
                    }

                    L.session.meta.isReviewMode = false;
                }
            });
        }

        toolbarContainer.append(replayControls);
        L.reflectReplayResolutions();
        
        const parentWidth = $(`.${L.r.s(9, 9) /* chart-controls-bar */}`).outerWidth();
        const childWidth = replayControls.outerWidth();
        const leftOffset = (parentWidth - childWidth) / 2;
        
        replayControls.css("left", leftOffset + "px");

        L.updateSessionCapitalInfo();
    }
}

L.resetReplayResolution = async function(replayResolutions) {
    clearTimeout(L.resetReplayResolutionTimeout);
    L.resetReplayResolutionTimeout = setTimeout(async () => {
        if(replayResolutions) {
            replayResolutions = replayResolutions.filter(r => r);
            if(replayResolutions.length == 0) {
                return;
            }
        } else {
            replayResolutions = await L.getAvailableReplayResolutions();
        }

        const chart = L.getCharts()[0];
        const ok = await L.waitUntil(async () => chart.previousResolution != chart.resolution());
        if (!ok) {
            return;
        }

        chart.previousResolution = chart.resolution();

        L.cache.delete(L.s(-7, -1) /* replayResolutions */);
        if (replayResolutions.length > 0) {
            L.getMinReplayResolution().then(async minReplayResolution => {
                await L.r.safeChangeReplayResolution(minReplayResolution);
                L.tryExec(() => L.reflectReplayResolutions(minReplayResolution));
            });
        }
    }, 500);
}

L.createUI = function () {
    const replayTradingButton = $(L.s(1, -5) /* button[data-qa-id=replay_trading] */);
    replayTradingButton.addClass(L.s(9, 6) /* backtst-journal-button */);

    $("svg", replayTradingButton).parent().html(L.r.s(4, 6) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 120 120" width="24" height="24"><polygon points="10,10 10,90 100,50" stroke="white" stroke-width="2" fill="black"></polygon><rect x="22" y="25" width="8" height="50" rx="2" ry="2" fill="white"></rect><rect x="40" y="35" width="8" height="33" rx="2" ry="2" fill="white"></rect><rect x="57" y="20" width="9" height="40" rx="2" ry="2" fill="white" stroke="black" stroke-width="1"></rect></svg> */);
    $(L.s(8, 9) /* span[class*=title] */, replayTradingButton).html(`${L.s(-2, 7) /* TestingView */} <span class="${L.r.s(0, -2) /* backtst-button-loader */} ${L.r.s(0, -4) /* ebt-spin */}">${L.r.s(0, -3) /* <svg class="spin" width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"></circle><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="2" fill="none"></path></svg> */ }</span>`);

    replayTradingButton.on("contextmenu", (e) => {
        e.preventDefault();
        L.createPositionsListHeader(true);
        return false;
    });

    L.createReplayControls();
    L.createPositionsListHeader();
    
    if(!L.session.meta.analysisTimes){
        L.session.meta.analysisTimes = [];
    }

    setInterval(() => {
        if(L.session.sessionColumns.find(c => c.columnName == L.r.s(2, -6) /* Analysis Time */).visible && L.session.meta.isActive && !L.session.meta.isReviewMode && !L.r.isAutoplayStarted().value() && !L.session.meta.isSkippingCandles) {
            var analysisTime = L.session.meta.analysisTimes.find(at => at.analysisStartTime == L.session.currentDate);
            if(!analysisTime) {
                analysisTime = {
                    analysisDuration: 0,
                    analysisTimespan: "00:00",
                    analysisStartTime: L.session.currentDate
                };

                L.session.meta.analysisTimes.unshift(analysisTime);
            } else {
                L.session.meta.totalAnalysisTime = (L.session.meta.totalAnalysisTime || 0) + 0.11;
                if(L.session.meta.totalAnalysisTime > 3600) {
                    L.session.meta.totalAnalysisTime = 0;
                    L.messageBox(L.r.s(0, -5) /* Overtrading */, L.r.s(0, -6) /* You have been analyzing for over 1 hour, which may lead to performance issues. Please consider a break to avoid overtrading. */);
                }
                if(analysisTime.analysisDuration < 3600) {
                    analysisTime.analysisDuration += 0.11;
                }
                analysisTime.analysisTimespan = L.formatTimestamp(parseInt(analysisTime.analysisDuration));
            }

            $(`.${L.r.s(4, 4) /* backtst-session-analysis-timer */}`).text(`${L.r.s(9, 4) /* Analysis time */}: ` + (analysisTime.analysisTimespan || "00:00"));
        }
    }, 100);

    L.t.onActiveChartChanged().subscribe(null, () => {
        setTimeout(() => {
            L.createReplayTimestampUI();
            $(`#${L.s(0, 9) /* TestingViewCurrentDate */}`).text(L.toTradingViewDateTimeFormat(L.r.currentDate().value(), L.c().getTimezone()));
        }, 200);
    });
    
    L.t.onActiveChartChanged().fire();

    $(document).on("mousemove.initui", (e) => {
        const controls = $(`.${L.r.s(4, 8) /* backtesting-replay-controls */}`);

        if (!controls.attr(L.r.s(0, -1) /* isDragging */)) return;

        let deltaX = e.clientX - Number(controls.attr("startX"));
        let newLeft = Number(controls.attr("startLeft")) + deltaX;

        const maxLeft = $("div[class*='seriesControlWrapper']").position().left - controls.width();

        controls.css("left", newLeft + "px");
        if (controls.position().left > maxLeft) {
            controls.css("left", maxLeft + "px");
        }

        if (controls.position().left < 0) {
            controls.css("left", "0px");
        }
    });

    $(document).on("mouseup.initui", () => {
        const controls = $(`.${L.r.s(4, 8) /* backtesting-replay-controls */}`);
        if (controls.attr(L.r.s(0, -1) /* isDragging */)) {
            controls.removeAttr(L.r.s(0, -1) /* isDragging */);
            $(`.${L.r.s(0, 3) /* drag-handle */}`).css("cursor", "grab");
        }
    });

    $(document).on("keyup.initui", async (event) => {
        if (!(event.shiftKey && event.ctrlKey)) return;
        if(L.isTyping()) {
            return;
        }

        if (event.key === L.s(7, -8) /* ArrowRight */) {
            $(`.${L.r.s(6, 2) /* fast-forward-button */}`).click();
        }
    });

    $(document).on("keydown.initui", async (event) => {
        if (event.key === " ") {
            if(L.isTyping()) {
                return;
            }
            
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    });

    L.r.isAutoplayStarted().subscribe((isAutoplayStarted) => {
        if(L.session.meta.forceStopPlayback) {
            $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).show();
            $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).hide();
        }
        
        if (isAutoplayStarted || L.session.meta.isSkippingCandles || L.session.meta.autoplayStarted) {
            $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).hide();
            $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).show();
        } else {
            $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 4) /* play */}`).show();
            $(`.${L.r.s(5, 1) /* play-pause-button */}.${L.s(0, 5) /* pause */}`).hide();
        }
    })
}

L.createReplayTimestampUI = function () {
    if ($(`#${L.s(0, 9) /* TestingViewCurrentDate */}`).length == 0) {
        const timeContainerDiv = $(L.r.s(0, -7) /* div[.chart-toolbar] button.apply-common-tooltip[data-name='time-zone-menu'] div.js-button-text */);

        if (timeContainerDiv.length) {
            $("<div>")
                .attr("id", L.s(0, 9) /* TestingViewCurrentDate */)
                .insertAfter(timeContainerDiv);
            
            L.cache.delete("TestingViewCurrentDateElement");
        } else {
            L.dbg(L.r.s(0, -8) /* Current Time div not found! */, "error");
        }
    }
}

L.getCurrentDateElement = function() {
    const cacheKey = "TestingViewCurrentDateElement";
    
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const TestingViewCurrentDateElement = $(`#${L.s(0, 9) /* TestingViewCurrentDate */}`);
    L.cache.set(cacheKey, TestingViewCurrentDateElement, 3600);
    return TestingViewCurrentDateElement;
}

L.getAvailableReplayResolutions = async function () {
    const cacheKey = L.s(-7, -1) /* replayResolutions */;
    const cached = L.cache.getIfExists(cacheKey);
    
    if (cached[0]) {
        //return cached[1];
    }

    const ok = await L.waitUntil(async () => L.r.replayResolutions().value().filter(r => r).length > 0);
    if (!ok) {
        return [];
    }
    const availableReplayResolutions = L.r.replayResolutions().value().filter(r => r);

    L.cache.set(cacheKey, availableReplayResolutions, 1);
    return availableReplayResolutions;
}

L.getMinReplayResolution = async function (skipSavedResolution) {
    clearTimeout(L.saveMinReplayResolutionTimeout);
    const availableReplayResolutions = await L.getAvailableReplayResolutions();
    const savedTimeframeResolutions = skipSavedResolution ? [] : (await L.dataOps.getSessionTimeframeResolutions(L.session.sessionId)).filter(r => !r.isFastForward);
    const smallestTimeframeSeconds = L.getCharts()[0].timeframeSeconds;

    //1. Try to find exact timeframe that was saved
    var replayResolution = availableReplayResolutions.find(availableResolution => availableResolution == savedTimeframeResolutions.find(savedResolution => savedResolution.timeframeSeconds == smallestTimeframeSeconds)?.resolution);

    if(!replayResolution) {
        //2. Try to take the resolution of the closest lower timeframe
        for(const savedTimeframeResolution of savedTimeframeResolutions.slice().sort((a, b) => b.timeframeSeconds - a.timeframeSeconds)) {
            if(savedTimeframeResolution.timeframeSeconds < smallestTimeframeSeconds) {
                replayResolution = availableReplayResolutions.find(r => r == savedTimeframeResolution.resolution);
                if(replayResolution) {
                    break;
                }
            }
        }

        //3. Take the smallest resolution that is at least 1 minute
        if(!replayResolution) {
            replayResolution = availableReplayResolutions.find(r => L.resolutionToSeconds(r) >= 60);
        }

        //4. Take the smallest available resolution
        if(!replayResolution) {
            replayResolution = availableReplayResolutions[0];
        }

        if(replayResolution && !skipSavedResolution) {
            L.saveMinReplayResolutionTimeout = setTimeout(() => {
                L.dataOps.setSessionTimeframeResolution(L.session.sessionId, L.getCharts()[0].timeframeSeconds, replayResolution);
            }, 10000);
        }
    }

    return replayResolution;
}

L.selectResolution = async function (seconds, resolutionSelectionDelay) {
    var replayResolution = null;
    if(seconds) {
        const availableReplayResolutions = await L.getAvailableReplayResolutions();
        
        for (const resolution of availableReplayResolutions) {
            if (L.resolutionToSeconds(resolution) == seconds) {
                replayResolution = resolution;
                break;
            }
        }
    }

    if(!replayResolution) {
        replayResolution = await L.getMinReplayResolution();
    }

    await L.r.safeChangeReplayResolution(replayResolution);
    
    if(resolutionSelectionDelay) {
        await L.delay(resolutionSelectionDelay);
    }
    return replayResolution;
}

L.reflectReplayResolutions = async function (minReplayResolution) {
    minReplayResolution = minReplayResolution || await L.getMinReplayResolution();

    if (minReplayResolution) {
        const minResolutionSeconds = L.resolutionToSeconds(minReplayResolution);
        $(`.${L.r.s(4, 8) /* backtesting-replay-controls */}`).show();
        var options = L.timeframes.filter(option => option.value > minResolutionSeconds && option.value % minResolutionSeconds == 0).slice(0, 6);
        $(`.controls.${L.r.s(4, 8) /* backtesting-replay-controls */} .${L.r.s(6, 4) /* skip-intervals */}`).empty();

        options.forEach(optionData => {
            $("<option>")
            .val(optionData.value)
            .text(optionData.text)
            .appendTo($(`.controls.${L.r.s(4, 8) /* backtesting-replay-controls */} .${L.r.s(6, 4) /* skip-intervals */}`));
        });

        $(`.${L.r.s(5, 9) /* forward-button */}`).attr("title", L.r.s(-2, 1, L.resolutionToFriendlyText(minReplayResolution)) /* Step forward {0}\nShift + ⇨ */);

        if(await L.waitUntil(async () => L.getCurrentReplayResolution(), 500)) {
            var selectedFastForwardResolution = (await L.dataOps.getSessionTimeframeResolutions(L.session.sessionId)).find(r => r.isFastForward && r.timeframeSeconds == L.resolutionToSeconds(L.getCurrentReplayResolution()))?.resolution;
            if(!selectedFastForwardResolution) {
                selectedFastForwardResolution = L.session?.meta?.selectedResolution;
            }

            if (selectedFastForwardResolution) {
                $(`.controls.${L.r.s(4, 8) /* backtesting-replay-controls */} .${L.r.s(6, 4) /* skip-intervals */}`).val(selectedFastForwardResolution);
            }
        }
    }
}

L.showSessionLoader = function() {
    if ($(`.${L.s(-8, -5) /* backtst-session-loader */}`).length) return;
    
    const loader = $(`
        <div class="${L.s(-8, -5) /* backtst-session-loader */}">
            <div class="${L.s(-8, -6) /* backtst-session-loader-spinner */}">
                ${L.s(-8, -7) /* <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"></circle><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="2" fill="none"></path></svg> */}
            </div>
            <div class="${L.s(-8, -8) /* backtst-session-loader-text */}">${L.s(-8, -9) /* Loading session... */}</div>
        </div>
    `);
    $('body').append(loader);
}

L.hideSessionLoader = function() {
    $(`.${L.s(-8, -5) /* backtst-session-loader */}`).fadeOut(300, function() {
        $(this).remove();
    });
}

L.configureContextMenu = function() {
    // Utility: Extract TradingView menu class names from a menu node
    function extractMenuClasses(menuNode) {
        // Find a menu item row
        const row = menuNode.querySelector('tr[data-role="menuitem"]');
        // Find a separator row
        const sep = menuNode.querySelector('tr[class*="row-"]');
        // Find icon cell
        const iconCell = row ? row.querySelector('td[data-icon-cell]') : null;
        // Find icon span
        const iconSpan = iconCell ? iconCell.querySelector('span') : null;
        // Find content div
        const contentDiv = row ? row.querySelector('div[class*="content-"]') : null;
        // Find label span
        const labelSpan = contentDiv ? contentDiv.querySelector('span[data-label]') : null;
        return {
            menu: menuNode.className,
            row: row ? row.className : '',
            sep: sep ? sep.className : '',
            iconCell: iconCell ? iconCell.className : '',
            iconSpan: iconSpan ? iconSpan.className : '',
            contentDiv: contentDiv ? contentDiv.className : '',
            labelSpan: labelSpan ? labelSpan.className : ''
        };
    }

    // Utility: Create a menu row matching TradingView style (dynamic classes)
    function createMenuRow(label, iconSVG, onClick, menuClasses) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-role', 'menuitem');
        tr.className = menuClasses.row || '';
        tr.tabIndex = -1;

        const tdIcon = document.createElement('td');
        tdIcon.className = menuClasses.iconCell || '';
        tdIcon.setAttribute('data-icon-cell', 'true');
        if (iconSVG) {
            const span = document.createElement('span');
            span.className = menuClasses.iconSpan || '';
            span.innerHTML = iconSVG;
            tdIcon.appendChild(span);
        }
        const tdContent = document.createElement('td');
        const divContent = document.createElement('div');
        divContent.className = menuClasses.contentDiv || '';
        const spanLabel = document.createElement('span');
        spanLabel.className = menuClasses.labelSpan || '';
        spanLabel.setAttribute('data-label', 'true');
        spanLabel.textContent = label;
        divContent.appendChild(spanLabel);
        tdContent.appendChild(divContent);
        tr.appendChild(tdIcon);
        tr.appendChild(tdContent);
        tr.addEventListener('click', function(e) {
            e.stopPropagation();
            onClick && onClick(e);
            // Optionally close the menu
            const menu = tr.closest('div');
            if (menu) menu.style.display = 'none';
        });
        return tr;
    }

    // Main logic: Observe for context menu
    const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.classList.contains('context-menu')) {
                    const tbody = node.querySelector('tbody');
                    if (tbody) {
                        // Extract menu classes from this menu instance
                        const menuClasses = extractMenuClasses(node);
                        // Remove trading-related menu items and find their position
                        const tradingActions = [
                            'trade-buy-limit',
                            'trade-sell-limit',
                            'trade-buy-stop',
                            'trade-sell-stop',
                            'trade-new-order',
                            'trade-buy',
                            'trade-sell'
                        ];
                        let insertBefore = null;
                        let removedCount = 0;
                        // Collect rows to remove
                        const rowsToRemove = [];
                        for (const tr of Array.from(tbody.children)) {
                            if (tr.getAttribute && tr.getAttribute('data-action-name') && tradingActions.includes(tr.getAttribute('data-action-name'))) {
                                if (!insertBefore) insertBefore = tr;
                                rowsToRemove.push(tr);
                                // Also remove the submenu row after, if present
                                if (tr.nextSibling && tr.nextSibling.className && tr.nextSibling.className.indexOf('subMenu') !== -1) {
                                    rowsToRemove.push(tr.nextSibling);
                                }
                            }
                        }
                        
                        if (insertBefore) {
                            const customRow = createMenuRow(
                                L.r.s(-1, -5) /* Stop playback at this price */,
                                L.r.s(5, 5) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" fill-rule="evenodd" d="M10 6h2v16h-2V6ZM9 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V6Zm7 0h2v16h-2V6Zm-1 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V6Z"></path></svg> */,
                                async function() {
                                    L.session.stopPlayBackLines = L.session.stopPlayBackLines || [];
                                    L.session.stopPlayBackLines.push({chart: L.c(), id: await L.c().createShape({ price: L.mousePrice }, { shape: 'horizontal_line', })});
                                },
                                menuClasses
                            );
                            
                            tbody.insertBefore(customRow, insertBefore);
                            // Remove trading rows
                            for (const tr of rowsToRemove) {
                                tr.parentNode && tr.parentNode.removeChild(tr);
                                removedCount++;
                            }
                        }
                    }
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
