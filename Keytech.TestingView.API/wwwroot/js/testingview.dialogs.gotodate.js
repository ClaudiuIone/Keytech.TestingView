L.createGotoDateUI = function (dialogContainer) {
    dialogContainer.find(L.s(5, 7) /* div[class*='tabs'] */).remove();
    dialogContainer.find(L.s(5, 8) /* span[class*='editIcon'] */).remove();

    const container = dialogContainer.find(L.s(5, 9) /* div[class*='scrollable'] div[class*='content'] */);
    container.children().remove();

    const footer = dialogContainer.find(L.s(6, 0) /* div[class*='footer'] */);
    footer.find(L.s(6, 1) /* span[role='button'][data-role='listbox'] */).remove();

    const predefinedTimesTable = $(`
        <table class="${L.s(6, 4) /* backtst-dialog-table */}">
        </table>
    `);
    const predefinedTimesSection = $(`
        <div class="${L.s(6, 9) /* predefined-times */} ${L.s(7, 0) /* backtst-dialog-section */}">
            <div class="${L.s(9, 3) /* backtst-dialog-options-section */}">
                <input type='checkbox' id='${L.r.s(-1, -1) /* backtst-option-WatchIntegrationPlots */}' ${L.session.getParameter(L.sessionParameterIds.WatchIntegrationPlots) == L.s(0, 6) /* true */ ? L.s(7, 3) /* checked */ : ""}>
                <label for='${L.r.s(-1, -1) /* backtst-option-WatchIntegrationPlots */}'>${L.r.s(-1, -3) /* Auto stop on chart events */}</label>
                <span title="${L.r.s(-1, -2) /* Automatically stops candle playback when a chart/indicator event occurs (e.g., a new FVG is discovered, an order block was detected, a breakout happens, a news event, etc.).<n><n>Chart events are detected via indicators on your chart (only TestingView-compatible indicators).<n><n>Examples of compatible indicators can be found in the TestingView Learning set of indicators. */}" class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true">${L.s(8, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg> */}</span></span>        
                <hr>
                <input type='checkbox' id='${L.s(7, 2) /* backtst-option-EnablePredefinedTimes */}' ${L.session.getParameter(L.sessionParameterIds.EnablePredefinedTimes) == L.s(0, 6) /* true */ ? L.s(7, 3) /* checked */ : ""}>
                <label for='${L.s(7, 2) /* backtst-option-EnablePredefinedTimes */}'>${L.s(9, 4) /* Auto stop at predefined times */}</label>
                <span title="${L.s(9, 5) /* Automatically stops candle playback at specified times during the day. Useful for regular events like session opens, news releases or your own schedule. */}" class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true">${L.s(8, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg> */}</span></span>        
            </div>
        </div>`);
    predefinedTimesSection.append(predefinedTimesTable);
    container.append(predefinedTimesSection);

    // Load existing predefined times
    const predefinedTimes = (L.session.getParameter(L.sessionParameterIds.PredefinedTimes) || "")
        .split(L.s(0, 7) /* , */)
        .map((time) => time.trim())
        .filter((time) => time.length > 0);

    const getRandomDateInRangeAvoidingPositionDays = (startDate, endDate) => {
        const timezone = L.c().getTimezone();
        const blockedDays = new Set();

        for(const position of (L.session.positions || [])) {
            if(Number.isFinite(position.entryTime)) {
                const dayId = L.getIsoDay(L.getDateInTimezone(position.entryTime, timezone));
                blockedDays.add(dayId);
            }
        }

        if(!blockedDays.size) {
            return L.getRandomDateInRange(startDate, endDate);
        }

        const startDay = L.getDateInTimezone(startDate, timezone);
        startDay.setUTCHours(0, 0, 0, 0);

        const endDay = L.getDateInTimezone(endDate, timezone);
        endDay.setUTCHours(0, 0, 0, 0);

        const availableRanges = [];
        let totalDuration = 0;
        const cursorDay = new Date(startDay);

        while(cursorDay <= endDay) {
            const dayId = L.getIsoDay(cursorDay);

            if(!blockedDays.has(dayId)) {
                const dayStartInTimezone = new Date(`${dayId}T00:00:00.000Z`);
                const nextDayInTimezone = new Date(dayStartInTimezone);
                nextDayInTimezone.setUTCDate(nextDayInTimezone.getUTCDate() + 1);

                const dayStart = L.getUtcDate(dayStartInTimezone, timezone).getTime() / 1000;
                const dayEnd = L.getUtcDate(nextDayInTimezone, timezone).getTime() / 1000;

                const rangeStart = Math.max(startDate, dayStart);
                const rangeEnd = Math.min(endDate, dayEnd);

                if(rangeEnd > rangeStart) {
                    const duration = rangeEnd - rangeStart;
                    availableRanges.push({ startDate: rangeStart, endDate: rangeEnd, duration });
                    totalDuration += duration;
                }
            }

            cursorDay.setUTCDate(cursorDay.getUTCDate() + 1);
        }

        if(!availableRanges.length || totalDuration <= 0) {
            return L.getRandomDateInRange(startDate, endDate);
        }

        let selectedDuration = Math.random() * totalDuration;
        for(const range of availableRanges) {
            if(selectedDuration <= range.duration) {
                return L.getRandomDateInRange(range.startDate, range.endDate);
            }
            selectedDuration -= range.duration;
        }

        const lastRange = availableRanges[availableRanges.length - 1];
        return L.getRandomDateInRange(lastRange.startDate, lastRange.endDate);
    };

    const getGotoTimeDateTime = (time) => {
        var startDate = L.session.currentDate;

        if(L.session.isRandomized) {
            startDate = getRandomDateInRangeAvoidingPositionDays(L.session.randomizedStartDate, L.session.randomizedEndDate);
        }

        return L.getNextDateTime(startDate, time);
    };

    const getGotoTimeTitle = (date) => {
        if(!date) {
            return L.s(8, 2) /* Could not find next valid market session for the specified time */;
        }

        const label = L.session.isRandomized ? L.r.s(-2, -9) /* ChronoShuffle™ hop (new day each click) */ : L.s(7, 8) /* Next occurrence */;
        return `${label}: ${L.toTradingViewDateTimeFormat(date)}`;
    };

    function saveParameters() {
        const watchIntegrationPlots = $("#" + L.r.s(-1, -1) /* backtst-option-WatchIntegrationPlots */).prop(L.s(7, 3) /* checked */).toString();
        const enablePredefinedTimes = $("#" + L.s(7, 2) /* backtst-option-EnablePredefinedTimes */).prop(L.s(7, 3) /* checked */).toString();
        const times = predefinedTimesTable.find(L.s(7, 4) /* tbody tr input[type='time'] */)
            .map((_, el) => $(el).val())
            .get()
            .filter(t => t)
            .sort()
            .join(L.s(0, 7) /* , */ + " ");

        L.session.setParameter(L.sessionParameterIds.WatchIntegrationPlots, watchIntegrationPlots);
        L.session.setParameter(L.sessionParameterIds.EnablePredefinedTimes, enablePredefinedTimes);
        L.session.setParameter(L.sessionParameterIds.PredefinedTimes, times);
    }

    function addTimeRow(time) {
        const row = $(`
            <tr>
                <td><input type="time" class="input size-small" value="${time}" /></td>
                <td class="${L.s(6, 6) /* backtst-actions */} ${L.r.s(2, -8) /* rightAlign */}" width="40%">
                    <button class="${L.s(7, 7) /* goto-time */} lightButton secondary xsmall typography-regular14px">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                            ${L.r.s(2, 8) /* <path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.17 5.79 3.05 2.92H6.52a.97.97 0 0 0-.97.97v.64c0 .54.43.97.97.97h7.36l-3.05 2.92c-.39.37-.4 1-.01 1.38l.44.44c.38.38 1 .38 1.37 0l5.35-5.34c.38-.38.38-1 0-1.37l-5.35-5.36a.96.96 0 0 0-1.37 0l-.44.44a.97.97 0 0 0 .01 1.39Z"></path> */}
                        </svg>
                    </button>
                    <button class="${L.s(7, 9) /* delete-time */} lightButton secondary xsmall typography-regular14px" title="${L.s(8, 0) /* Delete */}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                            ${L.r.s(3, 2) /* <path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path> */}
                        </svg>
                    </button>
                </td>
            </tr>
        `);

        const refreshGotoTimePreview = () => {
            const t = row.find("input[type='time']").val();
            const nextDateTime = getGotoTimeDateTime(t);
            row.data("gotoDateTime", nextDateTime || null);
            row.find(`.${L.s(7, 7) /* goto-time */}`).attr("title", getGotoTimeTitle(nextDateTime));
        };

        row.find("input[type='time']").on("change", refreshGotoTimePreview);
        refreshGotoTimePreview();

        row.find(`.${L.s(7, 7) /* goto-time */}`).on("click", async function() {
            if(!TradingView.defaultProperties.meta.includes(L.r.s(-2, -2) /* MoreThan10GotoTimeUsages */)) {
                L.session.meta.gotoTimeUsages = (L.session.meta.gotoTimeUsages || 0) + 1;
                if(L.session.meta.gotoTimeUsages > 10) {
                    L.messageBox(L.r.s(-2, -3) /* Limit reached */, L.r.s(-2, -4) /* You have reached the limit of "Go to Time" usages for this session. To increase this limit, please upgrade your TestingView.com plan. */);
                    return;
                }
            }

            const nextDateTime = row.data("gotoDateTime") || getGotoTimeDateTime(row.find("input[type='time']").val());

            saveParameters();
            L.removeDummyShape();
            if (L.session.getActivePositions().length == 0) {
                if (nextDateTime) {
                    L.session.stopAssessTracking();
                    L.session.meta.disableJumpDetection = true;
                    L.session.delayedCurrentDate = null;

                    if(L.session.isRandomized) {
                        L.enableTemporaryPastDateNavigation();
                    }

                    await L.selectDateWithNavigation(nextDateTime.getTime() / 1000);
                    setTimeout(async () => {
                        const minReplayResolution = await L.getMinReplayResolution(true);
                        L.session.meta.latestPredefinedTime = L.session.currentDate + L.resolutionToSeconds(minReplayResolution) * 4

                        clearTimeout(L.session.meta.executeUpdateSessionTimeout);
                        L.session.meta.disableCurrentDateTracking = false;
                        L.session.meta.executeUpdateSessionTimeout = setTimeout(() => {
                            if(!L.session.meta.disableCurrentDateTracking) {
                                L.session.currentDate = L.r.currentDate().value();
                                L.dataOps.updateSession({ sessionId: L.session.sessionId, currentDate: L.session.currentDate }, L.session.meta.isReviewMode, L.session.isRandomized);
                            }
                        }, 3000);
                    }, 1000);
                    setTimeout(() => {
                        if (L.session?.sessionId && L.session?.currentDate) {
                            L.sessionChannel.postMessage({
                                type: 'DATE-SYNC',
                                sessionId: L.session.sessionId,
                                currentDate: L.session.currentDate
                            });
                        }
                    }, 2000);
                    refreshGotoTimePreview();
                } else {
                    L.toast(L.s(8, 2) /* Could not find next valid market session for the specified time */, 2000, "warn");
                }
            } else {
                L.toast(L.s(8, 3) /* Cannot go to the specified time while there are open positions */, 2000, "warn");
            }
        });

        row.find(`.${L.s(7, 9) /* delete-time */}`).on("click", function() {
            row.remove();
        });

        predefinedTimesTable.append(row);
    }

    // Add existing times
    predefinedTimes.forEach(time => addTimeRow(time));

    // Add new time button
    const addNewTime = $(`
        <div>
            <button class="lightButton secondary xsmall typography-regular14px">
                ${L.s(8, 4) /* Add new time */}
            </button>
        </div>
    `);
    addNewTime.find("button").on("click", () => addTimeRow(L.s(8, 5) /* 00:00 */));
    container.append(addNewTime);

    const customDateTimeSection = $(`
        <div class="${L.s(8, 6) /* backtst-dialog-options-section-custom-date */}">
            <hr>
            <div class="${L.s(7, 0) /* backtst-dialog-section */}">
                <label for="${L.s(8, 7) /* custom-date-time */}">${L.s(8, 8) /* Or, go to a custom date/time */}:</label>
                <table class="${L.s(6, 4) /* backtst-dialog-table */}">
                    <tr>
                        <td>
                            <input 
                                id="${L.s(8, 7) /* custom-date-time */}" 
                                type="datetime-local" 
                                class="input size-small" 
                                value="${(() => {
                                    const utcDate = new Date(L.session.currentDate * 1000);
                                    if(predefinedTimes[0]) {
                                        const [hours, minutes] = predefinedTimes[0].split(":").map(Number);
                                        utcDate.setHours(hours, minutes, 0, 0);
                                    }
                                    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
                                    const defaultVal = localDate.toISOString().slice(0, 16);
                                    return defaultVal;
                                })()}"
                                min="${L.getDateInTimezone(L.session.currentDate, L.c().getTimezone()).toISOString().slice(0, 16)}">
                        </td>
                        <td class="${L.s(6, 6) /* backtst-actions */} ${L.r.s(2, -8) /* rightAlign */}" width="40%">
                            <button class="${L.s(7, 7) /* goto-time */} lightButton secondary xsmall typography-regular14px">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                                    ${L.r.s(2, 8) /* <path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.17 5.79 3.05 2.92H6.52a.97.97 0 0 0-.97.97v.64c0 .54.43.97.97.97h7.36l-3.05 2.92c-.39.37-.4 1-.01 1.38l.44.44c.38.38 1 .38 1.37 0l5.35-5.34c.38-.38.38-1 0-1.37l-5.35-5.36a.96.96 0 0 0-1.37 0l-.44.44a.97.97 0 0 0 .01 1.39Z"></path> */}
                                </svg>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    `);
    container.append(customDateTimeSection);
    container.find(`.${L.s(8, 6) /* backtst-dialog-options-section-custom-date */} .${L.s(7, 7) /* goto-time */}`).on("click", async function() {
        if(!TradingView.defaultProperties.meta.includes(L.r.s(-2, -2) /* MoreThan10GotoTimeUsages */)) {
            L.session.meta.gotoTimeUsages = (L.session.meta.gotoTimeUsages || 0) + 1;
            if(L.session.meta.gotoTimeUsages > 10) {
                L.messageBox(L.r.s(-2, -3) /* Limit reached */, L.r.s(-2, -4) /* You have reached the limit of "Go to Time" usages for this session. To increase this limit, please upgrade your TestingView.com plan. */);
                return;
            }
        }

        saveParameters();
        L.removeDummyShape();

        const customDateTime = customDateTimeSection.find(`#${L.s(8, 7) /* custom-date-time */}`).val();
        if (customDateTime) {
            var timeNow = new Date();
            var timeNowInTimezone = L.getDateInTimezone(timeNow / 1000, L.c().getTimezone());

            const offsetHours = timeNowInTimezone.getUTCHours() - timeNow.getHours();
            const offsetMinutes = timeNowInTimezone.getUTCMinutes() - timeNow.getMinutes();

            const adjustedDateTime = new Date(customDateTime);
            adjustedDateTime.setHours(adjustedDateTime.getHours() - offsetHours);
            adjustedDateTime.setMinutes(adjustedDateTime.getMinutes() - offsetMinutes);
            
            if (new Date(adjustedDateTime).getTime() / 1000 > L.session.currentDate || L.session.allowPastDateNavigation) {
                if (L.session.getActivePositions().length == 0) {
                    L.session.stopAssessTracking();
                    L.session.meta.disableJumpDetection = true;
                    L.session.delayedCurrentDate = null;

                    const timestamp = new Date(adjustedDateTime).getTime() / 1000;
                    await L.selectDateWithNavigation(timestamp);
                
                    clearTimeout(L.session.meta.executeUpdateSessionTimeout);
                    L.session.meta.executeUpdateSessionTimeout = setTimeout(() => {
                        if(!L.session.meta.disableCurrentDateTracking) {
                            L.session.currentDate = L.r.currentDate().value();
                            L.dataOps.updateSession({ sessionId: L.session.sessionId, currentDate: L.session.currentDate }, L.session.meta.isReviewMode);
                        }
                    }, 3000);
                } else {
                    L.messageBox(L.s(9, 0) /* Usage info */, L.s(9, 1) /* Cannot go to the specified date/time while there are open positions. Please close all positions before jumping to another date. */);
                }
            } else {
                L.messageBox(L.s(9, 0) /* Usage info */, L.s(9, 2) /* The selected date/time must be in the future. */);
            }
        } 
    });

    L.session.retrieveParameters().then(() => {
        $(`#${L.r.s(-1, -1) /* backtst-option-WatchIntegrationPlots */}`).prop(L.s(7, 3) /* checked */, L.session.getParameter(L.sessionParameterIds.WatchIntegrationPlots) == L.s(0, 6) /* true */);
        $(`#${L.s(7, 2) /* backtst-option-EnablePredefinedTimes */}`).prop(L.s(7, 3) /* checked */, L.session.getParameter(L.sessionParameterIds.EnablePredefinedTimes) == L.s(0, 6) /* true */);
    });

    footer.find(L.s(-2, 2) /* button[name='submit'] */).on("click", async function () {
        saveParameters();
        L.removeDummyShape();
    });

    footer.find(L.s(6, 3) /* button[name='cancel'] */).on("click", () => {
        L.removeDummyShape();
    });
}
