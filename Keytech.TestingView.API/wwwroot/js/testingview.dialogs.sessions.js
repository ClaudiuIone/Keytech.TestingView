L.createSessionsUI = function (dialogContainer) {
    dialogContainer.find(L.s(5, 7) /* div[class*='tabs'] */).remove();
    dialogContainer.find(L.s(5, 8) /* span[class*='editIcon'] */).remove();
    const container = dialogContainer.find(L.s(5, 9) /* div[class*='scrollable'] div[class*='content'] */);
    container.children().remove();

    const footer = dialogContainer.find(L.s(6, 0) /* div[class*='footer'] */);
    footer.find(L.s(6, 1) /* span[role='button'][data-role='listbox'] */).remove();
    footer.find(L.s(-2, 2) /* button[name='submit'] */).remove();
    footer.find("button[name='cancel'] span[class*='content']").text(L.s(-3, 1) /* Close */);

    const discordInfo = L.s(-3, 2) /* <div class="discord-cta">Need help? Join the <a href="https://discord.gg/kJSmwSxBpW" target="_blank">TestingView Discord</a> community!</div> */;
    footer.prepend(discordInfo);

    const section = $(`
        <div class="${L.s(-3, 3) /* backtst-dialog-section-sessions */}">
            <span class="${L.s(-3, 4) /* intro */}">
                ${L.s(-3, 5, user.username) /* Please ensure your <a href="https://TestingView.com" target="_blank">TestingView.com</a> subscription plan is active for your TradingView username: <span contenteditable readonly spellcheck="false">{0}</span> */}
            </span>
        </div>`);

    section.append($(L.r.s(6, -4) /* <svg class="backtst-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" d="M13.88 3.88a1.88 1.88 0 1 1-3.76 0 1.88 1.88 0 0 1 3.76 0ZM12 18.24A1.88 1.88 0 1 0 12 22a1.88 1.88 0 0 0 0-3.75Zm8.13-8.13a1.88 1.88 0 1 0 0 3.76 1.88 1.88 0 0 0 0-3.76ZM5.74 12A1.88 1.88 0 1 0 2 12a1.88 1.88 0 0 0 3.75 0Zm.5 3.87a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75Zm11.5 0a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75ZM6.25 4.38a1.87 1.87 0 1 0 0 3.75 1.87 1.87 0 0 0 0-3.75Z"></path></svg> */));
    container.append(section);

    var sessionsTable = $(L.s(-3, 7) /* <table class="backtst-dialog-table backtst-sessions-table"> */);
    const startIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">${L.r.s(2, 8) /* <path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.17 5.79 3.05 2.92H6.52a.97.97 0 0 0-.97.97v.64c0 .54.43.97.97.97h7.36l-3.05 2.92c-.39.37-.4 1-.01 1.38l.44.44c.38.38 1 .38 1.37 0l5.35-5.34c.38-.38.38-1 0-1.37l-5.35-5.36a.96.96 0 0 0-1.37 0l-.44.44a.97.97 0 0 0 .01 1.39Z"></path> */}</svg>`;
    const diceIcon = L.r.s(-3, 9) /* 🎲 */;

    const toLocalDateTimeInputValue = (timestamp) => {
        const date = new Date(timestamp * 1000);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 16);
    };

    const promptRandomizedRange = () => new Promise((resolve) => {
        const defaultRange = L.getDefaultRandomizedSessionRange();
        const maxDateTime = toLocalDateTimeInputValue(L.getYesterdayTimestamp());
        const modal = $(`
            <div class="${L.r.s(-3, -5) /* backtst-random-range-overlay */}">
                <div>
                    <div>
                        ${L.r.s(-3, -6) /* Configure ChronoShuffle™ period range */}
                        <span>${L.r.s(-3, -7) /* (make sure your chart data and TradingView plan supports it) */}</span>
                    </div>
                    <br>
                    <div class="${L.r.s(-3, -8) /* date-ranges */}">
                        <label>
                            ${L.r.s(-3, -9) /* From: */}
                            <input type="datetime-local" class="input size-small ${L.r.s(-4, 2) /* random-range-start */}" max="${maxDateTime}" value="${toLocalDateTimeInputValue(defaultRange.startDate)}" title="${L.r.s(-4, 0) /* Pick a start date for shuffling (make sure your chart data and TradingView plan supports it) */}">
                        </label>
                        <label>
                            ${L.r.s(-4, 6) /* To: */}
                            <input type="datetime-local" class="input size-small ${L.r.s(-4, 3) /* random-range-end */}" max="${maxDateTime}" value="${toLocalDateTimeInputValue(defaultRange.endDate)}" title="${L.r.s(-4, 1) /* Pick an end date for shuffling (make sure your chart data and TradingView plan supports it) */}">
                        </label>
                    </div>
                    <div class="${L.r.s(-4, 8) /* chronoshuffle-footnote */}">${L.r.s(-4, 7) /* Start with a random date, and on each <em>Go to Date/Time</em> action, it will jump to a new random date within your selected range. */}</div>
                    <div class="actions">
                        <button class="lightButton secondary xsmall typography-regular14px ${L.r.s(-4, 4) /* random-range-cancel */}">${L.s(-2, 6) /* Cancel */}</button>
                        <button class="lightButton secondary xsmall typography-regular14px ${L.r.s(-4, 5) /* random-range-save */}">${L.s(-2, 5) /* OK */}</button>
                    </div>
                </div>
            </div>
        `);

        const close = (value) => {
            modal.remove();
            resolve(value);
        };

        modal.find(`.${L.r.s(-4, 4) /* random-range-cancel */}`).on("click", () => close(null));
        modal.find(`.${L.r.s(-4, 5) /* random-range-save */}`).on("click", () => {
            const startDate = new Date(modal.find(`.${L.r.s(-4, 2) /* random-range-staart */}`).val());
            const endDate = new Date(modal.find(`.${L.r.s(-4, 3) /* random-range-end */}`).val());
            if(!L.isRandomizedSessionRangeValid(startDate, endDate)) {
                alert(L.r.s(-3, -1) /* Please choose valid start/end dates. */);
                return;
            }

            close({
                startDate: startDate.getTime() / 1000,
                endDate: endDate.getTime() / 1000
            });
        });

        L.removeDummyShape();
        $("body").append(modal);
    });

    const createSessionRow = (session) => {
        const displayDate = L.getDateInTimezone(session.currentDate, L.c().getTimezone()).toISOString().slice(0, 16);
        return $(`
            <tr ${L.s(-4, 0, session.sessionId) /* data-session-id='{0}' */} class="${session.sessionId == L.session?.sessionId ? L.s(-4, 1) /* selected-session */ : ""}">
            <td>
                <table>
                <tr>
                    <td class="${L.s(-4, 2) /* session-section */}">${L.s(-4, 3) /* Session */}:</td>
                    <td class="${L.s(-4, 4) /* session-name */}">
                    <input class="input size-small" value="${session.name}"></td>
                    </td>
                </tr>
                <tr>
                    <td class="${L.s(-4, 2) /* session-section */}">${L.s(-4, 5) /* Chart date */}:</td>
                    <td class="${L.s(-4, 6) /* session-bar-date */}">
                    <input type="datetime-local" class="input size-small" tooltip="${L.s(-4, 7) /* Set another backtesting date */}" ${L.s(-4, 8) /* initial-value */}="${displayDate}" value="${displayDate}" title="${L.s(-6, 9) /* Pick a start date (make sure your chart data and TradingView plan supports it) */}">
                    </td>
                </tr>
                <tr>
                    <td class="${L.s(-4, 2) /* session-section */}">${L.s(-4, 9) /* Balance */}:</td>
                    <td class="${L.s(-5, 0) /* session-capital */}">
                    <span class="${L.s(-5, 1) /* session-balance */}">${session.equity.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</span> <span class="currency">${session.currencyId}</span>
                    </td>
                </tr>
                <tr>
                    <td class="${L.s(-5, 2) /* session-stats-info */}" colspan="2">
                    ${L.s(-5, 4) /* Positions */}: <span class="${L.s(-5, 3) /* positions-counter */}">${session.positions.length}</span>
                    <br/>
                    ${L.s(-5, 5) /* Last update */}: ${L.toTradingViewDateTimeFormat(session.lastUpdate, L.c().getTimezone())}
                    </td>
                </tr>
                </table>
            </td>
            <td class="${L.s(6, 6) /* backtst-actions */}">
                <button class="${L.s(-5, 6) /* resume-session */} lightButton secondary xsmall typography-regular14px ${session.sessionId == L.session?.sessionId ? "hidden" : ""}" title="${L.s(-5, 7) /* Resume session */}">
                    ${L.s(-5, 8) /* Go &nbsp; */}${session.isRandomized ? diceIcon : startIcon}
                </button>
                <br/>
                <button class="${L.s(-5, 9) /* delete-session */} lightButton secondary xsmall typography-regular14px" title="${L.s(-6, 0) /* Delete session */}">
                    ${L.s(-6, 1) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path></svg> */}
                </button>
            </td>
            </tr>
        `);
    };

    const isPendingNewSession = () => {
        return sessionsTable.find(`tr[${L.s(-4, 0, "new") /* data-session-id='{0}' */}]`).length > 0;
    };

    L.dataOps.getOrSaveUserId(user).then(userId => {
        L.dataOps.getUserById(userId).then(user => {
            L.user = user;

            section.append($(`<div class="${L.s(-6, 3) /* backtst-dialog-section-plan */}">${L.s(-6, 4) /* Active plan */}: ${L.user.plan.name}${L.r.s(-2, -7) /* &nbsp;&bull;&nbsp;<a href="https://testingview.com/?utm_source=tradingview&utm_medium=extension&utm_campaign=sessions_screen#comp-m9lbin4x">Upgrade plan</a> */}</div>`));
            L.dataOps.getPermissions(L.user.plan.planId).then(permissions => {
                TradingView.defaultProperties.meta = permissions;
                L.dataOps.getSessions(L.user.userId).then(sessions => {
                $(`.${L.s(-6, 5) /* backtst-loader */}`).hide();

                    const addNewSession = $(`
                        <div class="${L.s(-6, 2) /* backtst-session-settings-add-new-session-container */}">
                            <button class="lightButton secondary xsmall typography-regular14px">
                                <span class="content nowrap">
                                    <span class="ellipsisContainer">${L.s(-6, 6) /* New session */}</span>
                                </span>
                            </button>
                        </div>
                    `);

                    addNewSession.on("click", () => {
                        if (isPendingNewSession()) return;
                        if(sessionsTable.find(`tr[${L.s(-6, 7) /* data-session-id */}]`).length <= 1 || TradingView.defaultProperties.meta.includes(L.s(-1, -1) /* MultiplTestingViewSessions */)) {
                            var oneYearAgo = new Date();
                            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                            oneYearAgo = oneYearAgo.toISOString().slice(0, 16);

                            const editableSessionRow = $(`
                                <tr ${L.s(-4, 0, "new") /* data-session-id='{0}' */}>
                                    <td>
                                        <table>
                                            <tr>
                                                <td class="${L.s(-4, 2) /* session-section */}">Session:</td>
                                                <td class="${L.s(-4, 4) /* session-name */}">
                                                    <input class="input size-small" value="${L.s(-6, 8) /* My TestingView session */}">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="${L.s(-4, 2) /* session-section */}">${L.s(-4, 5) /* Chart date */}:</td>
                                                <td class="${L.s(-4, 6) /* session-bar-date */}">
                                                    <input type="datetime-local" class="input size-small" value="${oneYearAgo}" title="${L.s(-6, 9) /* Pick a start date (make sure your chart data and TradingView plan supports it) */}">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="${L.s(-4, 2) /* session-section */}">${L.s(-4, 9) /* Balance */}:</td>
                                                <td class="${L.s(-5, 0) /* session-capital */}">
                                                    <table border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td class="${L.s(-7, 0) /* session-capital-value */}">
                                                                <input type="number" step="1000" placeholder="${L.s(-7, 1) /* Capital */}" value="${L.s(-7, 2) /* 100000 */}" class="input size-small">
                                                            </td>
                                                            <td class="${L.s(-7, 3) /* session-capital-currency */}">
                                                                <select class="input size-small">
                                                                    <option value="${L.s(-7, 4) /* USD */}">${L.s(-7, 4) /* USD */}</option>
                                                                    <option value="${L.s(-7, 5) /* EUR */}">${L.s(-7, 5) /* EUR */}</option>
                                                                    <option value="${L.s(-7, 6) /* AUD */}">${L.s(-7, 6) /* AUD */}</option>
                                                                    <option value="${L.s(-7, 7) /* GBP */}">${L.s(-7, 7) /* GBP */}</option>
                                                                    <option value="${L.s(-7, 8) /* NZD */}">${L.s(-7, 8) /* NZD */}</option>
                                                                    <option value="${L.s(-7, 9) /* CAD */}">${L.s(-7, 9) /* CAD */}</option>
                                                                    <option value="${L.s(-8, 0) /* CHF */}">${L.s(-8, 0) /* CHF */}</option>
                                                                    <option value="${L.s(-8, 1) /* HKD */}">${L.s(-8, 1) /* HKD */}</option>
                                                                    <option value="${L.s(-8, 2) /* JPY */}">${L.s(-8, 2) /* JPY */}</option>
                                                                    <option value="${L.s(-8, 3) /* NOK */}">${L.s(-8, 3) /* NOK */}</option>
                                                                    <option value="${L.s(-8, 4) /* RUB */}">${L.s(-8, 4) /* RUB */}</option>
                                                                    <option value="${L.s(-8, 5) /* SEK */}">${L.s(-8, 5) /* SEK */}</option>
                                                                    <option value="${L.s(-8, 6) /* SGD */}">${L.s(-8, 6) /* SGD */}</option>
                                                                    <option value="${L.s(-8, 7) /* TRY */}">${L.s(-8, 7) /* TRY */}</option>
                                                                    <option value="${L.s(-8, 8) /* ZAR */}">${L.s(-8, 8) /* ZAR */}</option>
                                                                    <option value="${L.s(-8, 9) /* BTC */}">${L.s(-8, 9) /* BTC */}</option>
                                                                    <option value="${L.s(-9, 0) /* ETH */}">${L.s(-9, 0) /* ETH */}</option>
                                                                    <option value="${L.s(-9, 1) /* MYR */}">${L.s(-9, 1) /* MYR */}</option>
                                                                    <option value="${L.s(-9, 2) /* KRW */}">${L.s(-9, 2) /* KRW */}</option>
                                                                    <option value="${L.s(-9, 3) /* USDT */}">${L.s(-9, 3) /* USDT */}</option>
                                                                    <option value="${L.s(-9, 4) /* INR */}">${L.s(-9, 4) /* INR */}</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td class="${L.s(6, 6) /* backtst-actions */}">
                                        <button class="${L.s(-9, 5) /* save-session */} lightButton secondary xsmall typography-regular14px" title="${L.s(-1, -4) /* Start backtesting */}">
                                            ${L.s(-1, -3) /* Start &nbsp; */}${startIcon}
                                        </button>
                                        <br/>
                                        <button class="save-random-session lightButton secondary xsmall typography-regular14px" title="${L.r.s(-3, -4) /* Start with a random date and continue to shuffle days on each jump/navigation with Go To Date/Time */}">
                                            ${L.r.s(-3, -3) /* ChronoShuffle™ */} ${diceIcon}
                                        </button>
                                        <br/>
                                        <button class="${L.s(-9, 9) /* cancel-session */} lightButton secondary xsmall typography-regular14px ${sessions.length ? "" : "hidden"}" title="${L.s(-1, -5) /* Cancel session */}">
                                            ${L.s(-6, 1) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path></svg> */}
                                        </button>
                                    </td>
                                </tr>
                            `);
                            const createNewSession = async (isRandomized) => {
                                const session = {}
                                session.userId = L.user.userId;
                                session.name = editableSessionRow.find("input").val();
                                if (!session.name) {
                                    alert(L.s(-9, 6) /* Please enter a session name. */);
                                    return;
                                }
                                if (sessions.find(s => s.name.toLowerCase() == session.name.toLowerCase())) {
                                    alert(L.s(-9, 7) /* There is already a session with this name. */);
                                    return;
                                }
                                session.capital = Number(editableSessionRow.find("input[type='number']").val());
                                if (!(session.capital > 0)) {
                                    alert(L.s(-9, 8) /* Please enter a valid capital amount. */);
                                    return;
                                }

                                const selectedDateTime = editableSessionRow.find("input[type='datetime-local']").val();
                                session.currencyId = editableSessionRow.find("select").val();
                                session.currentDate = new Date(selectedDateTime).getTime() / 1000;
                                if(!Number.isFinite(session.currentDate)) {
                                    alert("Please enter a valid chart date.");
                                    return;
                                }

                                let randomizedRange = null;
                                if(isRandomized) {
                                    randomizedRange = await promptRandomizedRange();
                                    if(!randomizedRange) {
                                        return;
                                    }

                                    session.currentDate = L.getRandomDateInRange(randomizedRange.startDate, randomizedRange.endDate);;
                                    session.randomizedStartDate = randomizedRange.startDate;
                                    session.randomizedEndDate = randomizedRange.endDate;
                                }

                                const actionButton = editableSessionRow.find(isRandomized ? `button.${L.r.s(-3, 2) /* save-random-session */}` : `button.${L.s(-9, 5) /* save-session */}`);
                                const initialButtonHtml = actionButton.html();
                                actionButton.html(L.r.s(6, -4) /* <svg class="backtst-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" d="M13.88 3.88a1.88 1.88 0 1 1-3.76 0 1.88 1.88 0 0 1 3.76 0ZM12 18.24A1.88 1.88 0 1 0 12 22a1.88 1.88 0 0 0 0-3.75Zm8.13-8.13a1.88 1.88 0 1 0 0 3.76 1.88 1.88 0 0 0 0-3.76ZM5.74 12A1.88 1.88 0 1 0 2 12a1.88 1.88 0 0 0 3.75 0Zm.5 3.87a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75Zm11.5 0a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75ZM6.25 4.38a1.87 1.87 0 1 0 0 3.75 1.87 1.87 0 0 0 0-3.75Z"></path></svg> */);

                                try {
                                    const latestSession = [...sessions].sort((a, b) => b.lastUpdate - a.lastUpdate)[0];
                                    const sessionId = await L.dataOps.createSession(session);

                                    if (latestSession) {
                                        const latestColumns = await L.dataOps.getSessionColumns(latestSession.sessionId);
                                        await L.saveSessionColumns(sessionId, latestColumns);
                                    } else {
                                        await L.saveSessionColumns(sessionId);
                                    }

                                    L.startSession(sessionId);
                                    L.removeDummyShape();
                                } catch(e) {
                                    console.warn("Unable to create session", e);
                                    actionButton.html(initialButtonHtml);
                                }
                            };

                            editableSessionRow.find(`button.${L.s(-9, 5) /* save-session */}`).on("click", () => createNewSession(false));
                            editableSessionRow.find("button.save-random-session").on("click", () => createNewSession(true));

                            editableSessionRow.find(`button.${L.s(-9, 9) /* cancel-session */}`).on("click", () => {
                                if (sessionsTable.find(`tr[${L.s(-6, 7) /* data-session-id */}]`).length > 1) {
                                    editableSessionRow.remove();
                                }
                            });
                            sessionsTable.append(editableSessionRow);
                            window.dispatchEvent(new Event('resize'));
                        }
                        else {
                            alert(L.s(0, -1) /* Cannot create multiple sessions: please upgrade your TestingView.com subscription plan to enable this feature */);
                        }
                    });

                    for (const session of sessions) {
                        const sessionRow = createSessionRow(session);
                        sessionRow.find(`.${L.s(-4, 4) /* session-name */} input`).on("change", () => {
                            const sessionName = sessionRow.find(`.${L.s(-4, 4) /* session-name */} input`).val().trim();
                            if (!sessionName) {
                                alert(L.s(0, -2) /* Please enter a session name. */);
                                return;
                            }
                            if (sessions.find(s => s.name == sessionName && s.sessionId != session.sessionId)) {
                                alert(L.s(0, -3) /* There is already a session with this name. */);
                                return;
                            }
                            session.name = sessionName;
                            L.dataOps.updateSession({ sessionId: session.sessionId, name: session.name });
                        });
                        sessionRow.find(`button.${L.s(-5, 6) /* resume-session */}`).on("click", () => {
                            if(TradingView.defaultProperties.meta.includes(L.s(-1, -7) /* CanContinueSession */)) {
                                const initialDate = new Date(sessionRow.find(`.${L.s(-4, 6) /* session-bar-date */} input`).attr("initial-value")).getTime() / 1000;
                                const currentDate = new Date(sessionRow.find(`.${L.s(-4, 6) /* session-bar-date */} input`).val()).getTime() / 1000;
                                const secondsDifference = currentDate - initialDate;
                                if(!secondsDifference) {
                                    L.removeDummyShape();
                                    L.startSession(session.sessionId);
                                } else {
                                    L.dataOps.getSessionPositions(session.sessionId).then(positions => {
                                        if (positions.every(p => p.exitTime)) {
                                            session.currentDate += secondsDifference;
                                            if (positions.every(p => p.exitTime <= session.currentDate)) {
                                                L.removeDummyShape();
                                                L.dataOps.updateSession({ sessionId: session.sessionId, currentDate: session.currentDate }, false, true).then(() => {
                                                    L.startSession(session.sessionId);
                                                });
                                            } else {
                                                alert(L.s(0, -4) /* Unable to change the replay date: some positions would be still open at that date. Please close all positions before changing the date. */);
                                            }
                                        } else {
                                            alert(L.s(0, -5) /* Unable to change the replay date: there is an open position in this session. */);
                                        }
                                    });
                                }
                            } else {
                                alert(L.s(0, -6) /* Cannot resume an existing session: please subscribe to a plan or start a free trial on TestingView.com */);
                            }
                        });
                        sessionRow.find(`button.${L.s(-5, 9) /* delete-session */}`).on("click", () => {
                            if (!confirm(L.s(0, -7) /* Are you sure you want to delete this session? */)) return;

                            L.dataOps.deleteSession(session.sessionId);
                            sessions.splice(sessions.indexOf(session), 1);
                            sessionRow.remove();

                            if (session.sessionId == L.session?.sessionId) {
                                L.removeDummyShape();
                                L.exit();
                            } else if (!sessions.length) {
                                addNewSession.click();
                            }
                        });
                        // Right-click (contextmenu) on Delete → Clone session instead
                        sessionRow.find(`button.${L.s(-5, 9) /* delete-session */}`).on("contextmenu", async (e) => {
                            e.preventDefault();
                            const sid = session.sessionId;
                            if (!sid) return;
                            if (!confirm(L.s(0, -8) /* Clone this session (with positions)? */)) return;
                            const row = $(e.currentTarget).closest('tr');
                            const actionsCell = row.find(`.${L.s(6, 6) /* backtst-actions */}`);
                            const prevHtml = actionsCell.html();
                            actionsCell.html(L.s(0, -9) /* <span class="ebt-spin" title="Cloning…"></span> */);
                            try {
                                // Tiny delay to ensure spinner renders
                                await new Promise(r => setTimeout(r, 75));
                                const suggested = `${L.s(1, -1) /* Copy of */} ${session.name}`;
                                await L.dataOps.cloneSession(sid, suggested);
                                // Re-render dialog to include cloned session
                                L.createSessionsUI(dialogContainer);
                            } catch (err) {
                                L.dbg(L.s(1, -2) /* Clone session failed */, "error", err);
                                alert(L.s(1, -2) /* Clone session failed */);
                                actionsCell.html(prevHtml);
                            }
                        });
                        sessionsTable.append(sessionRow);
                    }
                    section.append(sessionsTable);

                    if (sessions.length) {
                        section.append(addNewSession);
                    } else {
                        addNewSession.click();
                    }

                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 1000);
                });
            });
        });
    });

    dialogContainer.find(L.s(6, 3) /* button[name='cancel'] */).on("click", () => {
        L.removeDummyShape();
    });
}
