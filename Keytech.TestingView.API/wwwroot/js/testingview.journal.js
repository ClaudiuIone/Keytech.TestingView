L.isPredefinedColumn = (columnName, exceptColumns) => {
    return (!exceptColumns || !exceptColumns.includes(columnName)) && [
        L.r.s(1, -1) /* Trade */, L.r.s(1, -2) /* Date/Time */, L.r.s(1, -3) /* Price */, L.r.s(1, -4) /* Symbol */, L.r.s(1, -5) /* Lots */, L.r.s(1, -6) /* RR */, L.r.s(1, -7) /* Risk */, L.r.s(1, -8) /* Profit */, L.r.s(1, -9) /* Cumulative profit */, L.r.s(2, -1) /* Run-up */, L.r.s(2, -2) /* Drawdown */, L.r.s(2, -3) /* Snapshots */, L.r.s(2, -4) /* BE Run-up */, L.r.s(2, -5) /* Notes */, L.r.s(2, -6) /* Analysis Time */, L.s(-7, -6) /* Virtual Run-up */, L.s(-7, -7) /* Virtual Drawdown */, L.s(-7, -8) /* Virtual BE Run-up */
    ].includes(columnName);
};

L.getColumnClass = function (column) {
    switch (column.columnType) {
        case L.r.s(1, 7) /* date */:
        case L.r.s(1, 9) /* time */:
        case L.r.s(2, 1) /* datetime */:
        case L.r.s(1, 3) /* number */: {
            return L.r.s(2, -8) /* rightAlign */;
        }
        case L.r.s(2, 3) /* actions */:
        case L.r.s(1, 5) /* bool */: {
            return L.r.s(2, -9) /* centerAlign */;
        }
        default: {
            return L.r.s(3, -1) /* leftAlign */;
        }
    }
}

L.toJournalDisplayFormat = function (position, column) {
    var displayEdit = true;

    var value = position.columnValue(column.columnName);
    if (column.columnEnumValues) {
        const columnEnumValues = column.columnEnumValues.split(",").map(v => v.trim());
        if (value != null && value != undefined && !columnEnumValues.includes(value)) {
            columnEnumValues.push(value);
        }
        displayEdit = false;
        return `<select class="input size-small">${columnEnumValues.map(v => `<option ${v == value ? "selected" : ""}>${v}</option>`).join("")}</select>`;
    } else {
        if (column.columnType == L.r.s(1, 5) /* bool */) {
            displayEdit = false;
            value = "<input type='checkbox' " + (value ? "checked" : "") + ">";
        } else if (column.columnType == L.r.s(1, 7) /* date */ || column.columnType == L.r.s(1, 9) /* time */ || column.columnType == L.r.s(2, 1) /* datetime */) {
            value = (value || "").replace("T", " ");
        } else if (column.columnType == L.r.s(1, 3) /* number */) {
            if (value) {
                if (L.isNumber(value)) {
                    value = Number(value);
                }
            }
        } else {
            value = (value || "").toString();
        }
    }
    if (displayEdit && (value || "").toString().trim().length == 0) {
        value = L.r.s(2, -7) /* <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'><path fill='currentColor' d='m21.45 7.55-1.8 1.8a.47.47 0 0 1-.67 0L14.65 5a.47.47 0 0 1 0-.66l1.8-1.8a1.88 1.88 0 0 1 2.65 0l2.35 2.35c.73.73.73 1.91 0 2.65ZM13.1 5.9 2.84 16.15l-.83 4.75a.94.94 0 0 0 1.1 1.09l4.74-.84L18.1 10.9a.47.47 0 0 0 0-.67L13.77 5.9a.47.47 0 0 0-.67 0Zm-6.25 9.37a.54.54 0 0 1 0-.77l6.01-6.01a.54.54 0 0 1 .78 0c.21.21.21.55 0 .77l-6.02 6.01a.54.54 0 0 1-.77 0Zm-1.41 3.29H7.3v1.42l-2.52.44-1.21-1.22.44-2.51h1.42v1.87Z'></path></svg> */;
    }
    return value;
}

L.createHeaderCell = function (column) {
    var header = `<th class="ka-thead-cell ka-thead-background ka-pointer headCell ${L.getColumnClass(column)} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" scope="col" ${L.r.s(0, 7) /* column-name */}="${column.columnName}">`;
    if (column.columnName != L.r.s(1, -1) /* Trade */) {
        header += `
            <div class="ka-thead-cell-wrapper">
                <div class="ka-thead-cell-content-wrapper">${column.columnName}</div>
            </div>
            `;
    }
    header += "</th>";
    return header;
}

L.createPositionsListHeader = function (reset) {
    var positionsContainer = $(L.s(-2, -1) /* div.replay_trading:not(.js-hidden) */);

    if (positionsContainer.length > 0) {
        if (!L.session.meta.positionsContainerCheckDate || (Date.now() - L.session.meta.positionsContainerCheckDate) > 2000) {
            L.session.meta.positionsContainerCheckDate = Date.now();
            if ($(`${L.s(1, -5) /* button[data-qa-id=replay_trading] */}[data-active='true']`).length == 0) {
                $(`div.${L.r.s(3, -2) /* backtst-positions-table */}`).remove();
                return null;
            }
            positionsContainer.find(L.s(-2, -3) /* [class*='container']:has(div[class*='strategyGroup']) */).hide();
            positionsContainer.find(L.s(-2, -4) /* div[class*='tabsContainer'] */).hide();
            positionsContainer.find(L.s(-2, -5) /* div[class*='container']:has(div[class*='title']):has(div[class*='text']) */).hide();

            L.clearPositionRowsCache();
        }

        if (!L.session.meta.positionsContainerIntegrityCheckDate || (Date.now() - L.session.meta.positionsContainerIntegrityCheckDate) > 10000) {
            L.session.meta.positionsContainerIntegrityCheckDate = Date.now();
            const currentPositionsCount = $(`${L.s(-2, -1) /* div.replay_trading:not(.js-hidden) */} .${L.r.s(7, -2) /* V_POSITION */}`).length;
            if(L.session.meta.positionsContainerLoadedPositions == currentPositionsCount && currentPositionsCount != L.session.positions.length) {
                reset = true;
            }

            L.session.meta.positionsContainerLoadedPositions = currentPositionsCount;
        }

        if (!reset && positionsContainer.find(`table.ka-table[${L.r.s(3, -3) /* backtst-session */}=${L.session.sessionId}]`).length) {
            return positionsContainer;
        }

        $(`div.${L.r.s(3, -2) /* backtst-positions-table */}`).remove();
        positionsContainer.children().hide();

        const listStructure = $(`
          <div class="wrapper ${L.r.s(3, -2) /* backtst-positions-table */}">
            <div class="ka root table">
              <div class="ka-table-wrapper tableWrapper">
                <table class="ka-table" data-selector="table">
                  <thead class="ka-thead">
                    <tr class="ka-tr ka-thead-row">
                      <th class="ka-thead-cell ka-thead-background ka-pointer headCell fitContent ${L.r.s(2, -9) /* centerAlign */}" scope="col" ${L.r.s(0, 7) /* column-name */}="${L.r.s(1, -1) /* Trade */}">
                        <div class="ka-thead-cell-wrapper">
                            <div class="ka-thead-cell-content-wrapper">${L.r.s(1, -1) /* Trade */}</div>
                        </div>
                      </th>
                      ${L.session.sessionColumns.map(L.createHeaderCell).join("")}
                    </tr>
                  </thead>
                  <tbody class="ka-tbody">
                    <tr class="${L.r.s(3, -4) /* positions-ui-first-row */}">
                      <td></td>
                    </tr>
                    
                    <tr class="${L.r.s(3, -5) /* positions-ui-last-row */}">
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `);

        $(".ka-thead-cell-wrapper", listStructure).on("click", (e) => {
            L.sortPositions($(e.currentTarget).parents("th").attr(L.r.s(0, 7) /* column-name */));
        });

        positionsContainer.append(listStructure);
        $(`.${L.r.s(3, -2) /* backtst-positions-table */} table.ka-table`).attr(L.r.s(3, -3) /* backtst-session */, L.session.sessionId);
        L.updatePositionsList(true);
    }

    return positionsContainer;
}

L.createPositionListCell = function (column) {
    switch (column.columnName) {
        case L.r.s(1, -1) /* Trade */: {
            return `
                <td class="ka-cell cell noPadding ${L.r.s(3, -6) /* justifyStart */} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(1, -1) /* Trade */}">
                    <div class="${L.r.s(4, -1) /* doubleCell */}">
                        <div class="cell ${L.r.s(3, -8) /* V_STATUS */}" ${L.r.s(3, -9) /* data-part */}="0"></div>
                        <div class="cell" ${L.r.s(3, -9) /* data-part */}="1">${L.r.s(4, -2) /* Entry */} ${L.s(-2, -7) /* #DIRECTION# */}</div>
                    </div>
                </td>`;
        }
        case L.r.s(1, -2) /* Date/Time */: {
            return `
                <td class="ka-cell cell noPadding justifyEnd ${column.visible ? '' : L.r.s(3, -7) /* hidden */} ${L.r.s(2, -8) /* rightAlign */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(1, -2) /* Date/Time */}">
                    <div class="${L.r.s(4, -1) /* doubleCell */}">
                        <div class="cell date-cell ${L.r.s(4, -3) /* V_EXITDATE */}" ${L.r.s(3, -9) /* data-part */}="0"></div>
                        <div class="cell date-cell ${L.r.s(4, -4) /* V_ENTRYDATE */}" ${L.r.s(3, -9) /* data-part */}="1"></div>
                    </div>
                </td>`;
        }
        case L.r.s(1, -3) /* Price */: {
            return `
                <td class="ka-cell cell noPadding justifyEnd ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(1, -3) /* Price */}">
                    <div class="${L.r.s(4, -1) /* doubleCell */}">
                        <div class="cell" ${L.r.s(3, -9) /* data-part */}="0">
                            <div class="tableCell twoRows">
                                <div class="currencyWrapper">
                                    <div class="value ${L.r.s(4, -5) /* V_LATESTPRICE */}"></div>
                                    <div class="currency ${L.r.s(4, -6) /* V_LATESTPRICECURRENCY */}">${L.s(-2, -9) /* #SYMBOLCURRENCY# */}</div>
                                </div>
                                <div class="percentValue small"></div>
                            </div>
                        </div>
                        <div class="cell" ${L.r.s(3, -9) /* data-part */}="1">
                            <div class="tableCell twoRows">
                                <div class="currencyWrapper">
                                    <div class="value">${L.s(-2, -8) /* #ENTRYPRICE# */}</div>
                                    <div class="currency">${L.s(-2, -9) /* #SYMBOLCURRENCY# */}</div>
                                </div>
                                <div class="percentValue small"></div>
                            </div>
                        </div>
                    </div>
                </td>`;
        }
        case L.r.s(1, -7) /* Risk */: {
            return `
                <td class="ka-cell cell ${L.r.s(3, -6) /* justifyStart */} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(1, -7) /* Risk */}">
                    <div class="tableCell twoRows ">
                        <div class="currencyWrapper">
                            <div class="value ${L.r.s(4, -7) /* V_RISK */}"></div>
                            <div class="currency">${L.s(-2, -2) /* #ACCOUNTCURRENCY# */}</div>
                        </div>
                        <div class="percentValue small"><span class="${L.r.s(4, -8) /* V_RISKPERCENTAGE */}"></span>%</div>
                    </div>
                </td>`;
        }
        case L.r.s(1, -8) /* Profit */: {
            return `
                <td class="ka-cell cell ${L.r.s(3, -6) /* justifyStart */} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(1, -8) /* Profit */}">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value ${L.r.s(4, -9) /* V_PROFIT */}"></div>
                            <div class="currency">${L.s(-2, -2) /* #ACCOUNTCURRENCY# */}</div>
                        </div>
                        <div class="percentValue small"><span class="${L.r.s(5, -1) /* V_PROFITPERCENTAGE */}"></span>%</div>
                    </div>
                </td>`;
        }
        case L.r.s(1, -9) /* Cumulative profit */: {
            return `
                <td class="ka-cell cell ${L.r.s(3, -6) /* justifyStart */} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(1, -9) /* Cumulative profit */}">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value ${L.r.s(5, -2) /* V_CUMULATIVEPROFIT */}"></div>
                            <div class="currency">${L.s(-2, -2) /* #ACCOUNTCURRENCY# */}</div>
                        </div>
                        <div class="percentValue small"><span class="${L.r.s(5, -3) /* V_CUMULATIVEPROFITPERCENTAGE */}"></span>%</div>
                    </div>
                </td>`;
        }
        case L.r.s(2, -1) /* Run-up */: {
            return `
                <td class="ka-cell cell ${L.r.s(3, -6) /* justifyStart */} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(2, -1) /* Run-up */}">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value ${L.r.s(5, -4) /* V_RUNUP */}"></div>
                            <div class="currency">${L.s(-2, -2) /* #ACCOUNTCURRENCY# */}</div>
                        </div>
                        <div class="percentValue small"><div class="${L.r.s(5, -5) /* V_RUNUPPERCENTAGE */}"></div>%</div>
                    </div>
                </td>`;
        }
        case L.r.s(2, -2) /* Drawdown */: {
            return `
                <td class="ka-cell cell ${L.r.s(3, -6) /* justifyStart */} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(2, -2) /* Drawdown */}">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value ${L.r.s(5, -6) /* V_DRAWDOWN */}"></div>
                            <div class="currency">${L.s(-2, -2) /* #ACCOUNTCURRENCY# */}</div>
                        </div>
                        <div class="percentValue small"><div class="${L.r.s(5, -7) /* V_DRAWDOWNPERCENTAGE */}"></div>%</div>
                    </div>
                </td>`;
        }
        case L.r.s(2, -4) /* BE Run-up */: {
            return `
                <td class="ka-cell cell ${L.r.s(3, -6) /* justifyStart */} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(2, -4) /* BE Run-up */}">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value ${L.r.s(5, -8) /* V_BERUNUP */}"></div>
                            <div class="currency">${L.s(-2, -2) /* #ACCOUNTCURRENCY# */}</div>
                        </div>
                        <div class="percentValue small"><div class="${L.r.s(5, -9) /* V_BERUNUPPERCENTAGE */}"></div>%</div>
                    </div>
                </td>`;
        }
        case L.r.s(2, -3) /* Snapshots */: {
            return `
                <td class="ka-cell cell ${L.r.s(3, -6) /* justifyStart */} ${L.r.s(2, -9) /* centerAlign */} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${L.r.s(2, -3) /* Snapshots */}">
                    <div class="${L.r.s(6, -5) /* snapshot-action-buttons */}">
                        <div data-role="button" class="${L.s(5, -2) /* view-snapshots-button */} apply-common-tooltip controls-button button isInteractive" title="${L.r.s(6, -1) /* View snapshots */}" ${L.s(5, -3) /* data-snapshots */}="0">
                            ${L.r.s(6, -2) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" fill-rule="evenodd" d="M3.5 14S7.06 6 14 6c6.94 0 10.5 8 10.5 8S21 22 14 22 3.5 14 3.5 14Zm1.95.5-.27-.5A15.92 15.92 0 0 1 7.28 11C8.9 9.14 11.15 7.5 14 7.5c2.85 0 5.1 1.64 6.72 3.49a16.8 16.8 0 0 1 2.1 3.01 15.9 15.9 0 0 1-2.07 3.01c-1.62 1.85-3.87 3.49-6.75 3.49s-5.13-1.64-6.75-3.49a16.5 16.5 0 0 1-1.8-2.52Zm-.58.11ZM16.5 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.5 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"></path></svg> */}
                        </div>
                        <div data-role="button" class="${L.r.s(6, -8) /* take-snapshot-button */} apply-common-tooltip controls-button button isInteractive" title="${L.r.s(6, -7) /* Take a snapshot */}">
                            ${L.r.s(6, -3) /* <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.118 6a.5.5 0 0 0-.447.276L9.809 8H5.5A1.5 1.5 0 0 0 4 9.5v10A1.5 1.5 0 0 0 5.5 21h16a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 21.5 8h-4.309l-.862-1.724A.5.5 0 0 0 15.882 6h-4.764zm-1.342-.17A1.5 1.5 0 0 1 11.118 5h4.764a1.5 1.5 0 0 1 1.342.83L17.809 7H21.5A2.5 2.5 0 0 1 24 9.5v10a2.5 2.5 0 0 1-2.5 2.5h-16A2.5 2.5 0 0 1 3 19.5v-10A2.5 2.5 0 0 1 5.5 7h3.691l.585-1.17z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0 1a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"></path></svg> */ }
                        </div>
                        <div data-role="button" class="${L.r.s(6, -9) /* take-snapshot-loader */} apply-common-tooltip controls-button button isInteractive" style="display:none" title="${L.r.s(6, -6) /* Taking the snapshot... */}">
                            ${L.r.s(6, -4) /* <svg class="backtst-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" d="M13.88 3.88a1.88 1.88 0 1 1-3.76 0 1.88 1.88 0 0 1 3.76 0ZM12 18.24A1.88 1.88 0 1 0 12 22a1.88 1.88 0 0 0 0-3.75Zm8.13-8.13a1.88 1.88 0 1 0 0 3.76 1.88 1.88 0 0 0 0-3.76ZM5.74 12A1.88 1.88 0 1 0 2 12a1.88 1.88 0 0 0 3.75 0Zm.5 3.87a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75Zm11.5 0a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75ZM6.25 4.38a1.87 1.87 0 1 0 0 3.75 1.87 1.87 0 0 0 0-3.75Z"></path></svg> */ }
                        </div>
                    </div>
                </td>`;
        }
        default: {
            return `
                <td class="ka-cell cell ${L.r.s(3, -6) /* justifyStart */} ${L.getColumnClass(column)} ${column.visible ? '' : L.r.s(3, -7) /* hidden */}" ${L.r.s(0, 7) /* column-name */}="${column.columnName}">
                    <div class="${L.r.s(7, -1) /* V_VALUE */}"></div>
                </td>`;
        }
    }
}

L.setJournalLoading = function (isLoading) {
    const TestingViewButtonLoader = $(`.${L.r.s(0, -2) /* backtst-button-loader */}`);
    if(isLoading) {
        clearTimeout(L.session.meta.hideLoaderTimeout);
        L.session.meta.showLoaderTimeout = setTimeout(() => {
            TestingViewButtonLoader.show();
        }, 1500);
    } else {
        clearTimeout(L.session.meta.showLoaderTimeout);
        L.session.meta.hideLoaderTimeout = setTimeout(() => {
            TestingViewButtonLoader.hide();
        }, 1500);
    }
}

L.updatePositionsList = function (reset) {
    if (L.isEbacktestingPanelOpen()) {
		L.session.meta.updatePositionListRequestCount = L.session.meta.updatePositionListRequestCount || 0;
		const updatePositionListRequestCount = ++L.session.meta.updatePositionListRequestCount;
        L.session.meta.sortByColumn = L.session.meta.sortByColumn || L.r.s(1, -2) /* Date/Time */;

        if(reset) {
            $(`${L.s(-2, -1) /* div.replay_trading:not(.js-hidden) */} .ka-icon.ka-icon-sort`).remove();
            $(`${L.s(-2, -1) /* div.replay_trading:not(.js-hidden) */} .${L.r.s(7, -2) /* V_POSITION */}`).remove();
            $(`${L.s(-2, -1) /* div.replay_trading:not(.js-hidden) */} th.ka-thead-cell[${L.r.s(0, 7) /* column-name */}='${L.session.meta.sortByColumn}'] .ka-thead-cell-content-wrapper`).append(`<span class='ka-icon ka-icon-sort ka-icon-sort-arrow-${!L.session.meta.sortByDesc ? "up" : "down"}'></span>`);
        }
        
        var positionIndex = 0;
        L.asyncInterval(async() => {
            if (positionIndex >= L.session.positions.length || updatePositionListRequestCount < L.session.meta.updatePositionListRequestCount) {
                L.setJournalLoading(false);
                return -1;
            }

            const position = L.session.positions[positionIndex];
            if (L.addToPositionList(position, !position.exitTime)) {
                L.setJournalLoading(true);    
            }

            if(reset) {
                delete position.meta.hash;
            }

            if(L.updatePositionUI(position)) {
                L.setJournalLoading(true);
            }

            positionIndex++;
            await L.delay(30);
        }, 1);
    } else {
        clearTimeout(L.session.meta.showLoaderTimeout);
        L.clearPositionRowsCache();
        $(`.${L.r.s(0, -2) /* backtst-button-loader */}`).hide();
    }
}

L.addToPositionList = function (position, insertFirst) {
    if (L.isEbacktestingPanelOpen()) {
        if(!position.meta.addedToList && !$(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).length) {
            position.meta.addedToList = true;
            var positionStructure = `
            <tr class="ka-tr ka-row row ${L.r.s(7, -2) /* V_POSITION */}" data="${L.s(-2, -6) /* #INDEX# */}" id="${L.r.s(7, -3) /* ID_ */}${position.positionId}">
                <td class="ka-cell cell" ${L.r.s(0, 7) /* column-name */}="${L.r.s(1, -1) /* Trade */}">
                <div class="${L.r.s(7, -4) /* V_INDEX */}">${L.s(-2, -6) /* #INDEX# */}</div>
                <div class="${L.r.s(7, -5) /* action-buttons */}">
                    <div data-role="button" class="${L.r.s(7, -6) /* close-trade-button */} apply-common-tooltip controls-button button isInteractive" title="${L.r.s(7, -7) /* Close trade */}">
                        ${L.r.s(7, -8) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.9 12.63c.2.18.2.5 0 .68l-1.6 1.6a.48.48 0 0 1-.68 0L12 14.25 9.37 16.9a.48.48 0 0 1-.68 0l-1.6-1.6a.48.48 0 0 1 0-.68L9.75 12 7.1 9.37a.48.48 0 0 1 0-.68l1.6-1.6c.18-.19.49-.19.68 0L12 9.74l2.63-2.64c.18-.2.5-.2.68 0l1.6 1.6c.19.18.19.49 0 .68L14.26 12l2.64 2.63Z"></path></svg> */}
                    </div>
                    <div data-role="button" class="${L.r.s(7, -9) /* show-be-button */} apply-common-tooltip controls-button button isInteractive" title="${L.r.s(8, -1) /* Set BE level */}">
                        ${L.r.s(8, -2) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 3.94a8.06 8.06 0 1 1 0 16.12 8.06 8.06 0 0 1 0-16.12ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 6.77a3.23 3.23 0 1 0 0 6.46 3.23 3.23 0 0 0 0-6.46Z"></path></svg> */}
                    </div>
                    <div data-role="button" class="${L.r.s(8, -3) /* hide-be-button */} apply-common-tooltip controls-button button isInteractive" title="${L.r.s(8, -4) /* Remove BE level */}">
                        ${L.r.s(8, -5) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM6.68 13.61a.49.49 0 0 1-.49-.48v-2.26c0-.27.22-.48.49-.48h10.64c.27 0 .49.21.49.48v2.26c0 .27-.22.48-.49.48H6.68Z"></path></svg> */}
                    </div>
                </div>
                </td>
                ${L.session.sessionColumns.map(column => L.createPositionListCell(column)).join("")}
            </tr>
            `
                .replaceAll(L.s(-2, -6) /* #INDEX# */, position.getIndex())
                .replaceAll(L.s(-2, -7) /* #DIRECTION# */, position.getDirection())
                .replaceAll(L.s(-2, -8) /* #ENTRYPRICE# */, position.getEntryPrice())
                .replaceAll(L.s(-2, -9) /* #SYMBOLCURRENCY# */, position.getSymbolCurrency())
                .replaceAll(L.s(-2, -2) /* #ACCOUNTCURRENCY# */, L.session.currencyId)
                ;

            L.optimizePositionsList();

            if(insertFirst) {
                $(`.${L.r.s(3, -4) /* positions-ui-first-row */}`).after($(positionStructure));
            } else {
                $(`.${L.r.s(3, -5) /* positions-ui-last-row */}`).before($(positionStructure));
            }

            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).on("click", () => { L.onSelectPositionRow(position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).on("dblclick", (e) => { L.onDblClickPositionRow(e, position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(7, -6) /* close-trade-button */}`).on("click", () => { L.onCloseTradeButtonClick(position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(7, -9) /* show-be-button */}`).on("click", () => { L.onShowBEButtonClick(position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(8, -3) /* hide-be-button */}`).on("click", () => { L.onHideBEButtonClick(position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} .date-cell`).on("click", (e) => { L.onDateCellClick(e, position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} .date-cell`).on("mouseenter", (e) => { L.onDateCellMouseEnter(e, position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} .date-cell`).on("mouseleave", (e) => { L.onDateCellMouseLeave(e, position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} .${L.s(5, -2) /* view-snapshots-button */}`).on("click", (e) => { L.viewSnapshots(e, position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} .${L.r.s(6, -8) /* take-snapshot-button */}`).on("click", async (e) => { await L.onTakeSnapshot(e, position) });
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId} td[column-name] div`).on("click", (e) => { L.onEditField(e, position) });

            if (position.bePrice()) {
                $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(7, -9) /* show-be-button */}`).hide();
                $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(8, -3) /* hide-be-button */}`).show();
            } else {
                $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(7, -9) /* show-be-button */}`).show();
                $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */} .${L.r.s(7, -5) /* action-buttons */} .${L.r.s(8, -3) /* hide-be-button */}`).hide();
            }

            return true;
        }
    }
}

L.optimizePositionsList = function() {
    const wrapper = $('.ka-table-wrapper.tableWrapper');
    const allRows = wrapper.find(`tr.${L.r.s(7, -2) /* V_POSITION */}`);
    const maxVisibleRows = 20;

    if (allRows.length <= maxVisibleRows) {
        return;
    }

    L.setJournalLoading(true);

    allRows.each((index, row) => {
        row = $(row);
        if(index > 20) {
            row.addClass(L.r.s(3, -7) /* hidden */);
        }
    });

    wrapper.off('scroll.optimize').on('scroll.optimize', function() {
        clearTimeout(L.positionsListScrollTimeout);
        L.positionsListScrollTimeout = setTimeout(() => {
            const scrollTop = wrapper.scrollTop();
            const viewportHeight = wrapper.height();
            const scrollHeight = wrapper[0].scrollHeight;

            allRows.each((index, row) => {
                row = $(row);
                const isHidden = row.hasClass(L.r.s(3, -7) /* hidden */);
                
                if (scrollHeight - scrollTop - viewportHeight < 500 && isHidden) {
                    row.removeClass(L.r.s(3, -7) /* hidden */);
                    // return false;
                }
            });
        }, 50);
    });

    // Initial optimization
    wrapper.trigger('scroll.optimize');
    L.setJournalLoading(false);
}


L.updatePositionUI = function (position) {
    if (L.isEbacktestingPanelOpen()) {
        const currentHash = L.json({...position, ...position.meta, hash: undefined, index: undefined });

        if (position.meta.hash === currentHash) {
            return false;
        }

        position.meta.hash = currentHash;

        const positionRow = L.getPositionRow(position.positionId);
        if (positionRow.length) {
            L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(7, -5) /* action-buttons */}`).addClass(position.exitTime ? "" : L.r.s(8, -6) /* openTrade */).removeClass(position.exitTime ? L.r.s(8, -6) /* openTrade */ : "");
            L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(7, -4) /* V_INDEX */}`).addClass(position.exitTime ? "" : L.r.s(8, -6) /* openTrade */).removeClass(position.exitTime ? L.r.s(8, -6) /* openTrade */ : "");

            const activeChart = L.c();

            for (const column of L.session.sessionColumns) {
                switch (column.columnName) {
                    case L.r.s(1, -1) /* Trade */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(3, -8) /* V_STATUS */}`)
                            .addClass(position.exitTime ? "" : L.r.s(8, -6) /* openTrade */)
                            .removeClass(position.exitTime ? L.r.s(8, -6) /* openTrade */ : "")
                            .text(position.getStatus());
                        break;
                    }
                    case L.r.s(1, -2) /* Date/Time */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(4, -3) /* V_EXITDATE */}`).addClass(position.exitTime ? "" : L.r.s(8, -6) /* openTrade */).removeClass(position.exitTime ? L.r.s(8, -6) /* openTrade */ : "").text(position.getExitDate(activeChart));
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(4, -4) /* V_ENTRYDATE */}`).text(position.getEntryDate(activeChart));
                        break;
                    }
                    case L.r.s(1, -3) /* Price */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(4, -5) /* V_LATESTPRICE */}`).addClass(position.exitTime ? "" : L.r.s(8, -6) /* openTrade */).removeClass(position.exitTime ? L.r.s(8, -6) /* openTrade */ : "").text(position.getLatestPrice());
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(4, -6) /* V_LATESTPRICECURRENCY */}`).addClass(position.exitTime ? "" : L.r.s(8, -6) /* openTrade */).removeClass(position.exitTime ? L.r.s(8, -6) /* openTrade */ : "");
                        break;
                    }
                    case L.r.s(1, -5) /* Lots */: {
                        L.getPositionRowField(position.positionId, positionRow, `td[${L.r.s(0, 7) /* column-name */}='${L.r.s(1, -5) /* Lots */}'] .${L.r.s(7, -1) /* V_VALUE */}`)
                            .text(position.getQuantity())
                            .attr('title', L.r.s(8, -7, position.getLeverage()) /* Leverage: {0}x */);
                        break;
                    }
                    case L.r.s(1, -7) /* Risk */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(4, -7) /* V_RISK */}`).text(position.getRisk() || L.s(-4, -3) /* N/A */);
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(4, -8) /* V_RISKPERCENTAGE */}`).text(position.getRiskPercentage() || L.s(-4, -3) /* N/A */);
                        break;
                    }
                    case L.r.s(1, -8) /* Profit */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(4, -9) /* V_PROFIT */}`).text(position.getProfit());
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -1) /* V_PROFITPERCENTAGE */}`).text(position.getProfitPercentage());
                        break;
                    }
                    case L.r.s(1, -9) /* Cumulative profit */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -2) /* V_CUMULATIVEPROFIT */}`).text(position.getCumulativeProfit());
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -3) /* V_CUMULATIVEPROFITPERCENTAGE */}`).text(position.getCumulativeProfitPercentage());
                        break;
                    }
                    case L.r.s(2, -1) /* Run-up */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -4) /* V_RUNUP */}`).text(position.getRunUp());
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -5) /* V_RUNUPPERCENTAGE */}`).text(position.getRunUpPercentage());
                        break;
                    }
                    case L.r.s(2, -2) /* Drawdown */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -6) /* V_DRAWDOWN */}`).text(position.getDrawDown());
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -7) /* V_DRAWDOWNPERCENTAGE */}`).text(position.getDrawDownPercentage());
                        break;
                    }
                    case L.r.s(2, -4) /* BE Run-up */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -8) /* V_BERUNUP */}`).text(position.getBERunUp());
                        L.getPositionRowField(position.positionId, positionRow, `.${L.r.s(5, -9) /* V_BERUNUPPERCENTAGE */}`).text(position.getBERunUpPercentage());
                        break;
                    }
                    case L.r.s(2, -3) /* Snapshots */: {
                        L.getPositionRowField(position.positionId, positionRow, `.${L.s(5, -2) /* view-snapshots-button */}`).attr(L.s(5, -3) /* data-snapshots */, position.positionSnapshots.length);
                        L.getPositionRowField(position.positionId, positionRow, `.${L.s(5, -2) /* view-snapshots-button */}`).attr("title", L.s(5, -4, position.positionSnapshots.length > 1 ? position.positionSnapshots.length + " " : "", position.positionSnapshots.length > 1 ? "s" : "") /* View {0}snapshot{1} */);
                        break;
                    }
                    default: {
                        L.getPositionRowField(position.positionId, positionRow, `td[${L.r.s(0, 7) /* column-name */}='${column.columnName}'] .${L.r.s(7, -1) /* V_VALUE */}`).html(L.toJournalDisplayFormat(position, column));
                        break;
                    }
                }
            }

            return true;
        }
    }
}

L.getPositionRow = function (positionId) {
    const cacheKey = `position-row-${positionId}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    var positionRow = $(`#${L.r.s(7, -3) /* ID_ */}${positionId}.${L.r.s(7, -2) /* V_POSITION */}`);
    L.cache.set(cacheKey, positionRow, 3600);
    return positionRow;
}

L.getPositionRowField = function (positionId, positionRow, fieldSelector) {
    const cacheKey = `position-row-field-${positionId}-${fieldSelector}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    var positionRowField = positionRow.find(fieldSelector);
    L.cache.set(cacheKey, positionRowField, 3600);
    return positionRowField;
}

L.clearPositionRowsCache = function () {
    for (const position of L.session.positions) {
        delete position.meta?.addedToList;
        L.cache.delete(`position-row-${position.positionId}`);

        for (const column of L.session.sessionColumns) {
            L.cache.delete(`position-row-field-${position.positionId}-td[${L.r.s(0, 7) /* column-name */}='${column.columnName}'] .${L.r.s(7, -1) /* V_VALUE */}`);
        }

        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(3, -8) /* V_STATUS */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(4, -3) /* V_EXITDATE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(4, -4) /* V_ENTRYDATE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(4, -5) /* V_LATESTPRICE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(4, -6) /* V_LATESTPRICECURRENCY */}`);
        L.cache.delete(`position-row-field-${position.positionId}-td[${L.r.s(0, 7) /* column-name */}='${L.r.s(1, -5) /* Lots */}'] .${L.r.s(7, -1) /* V_VALUE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(4, -7) /* V_RISK */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(4, -8) /* V_RISKPERCENTAGE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(4, -9) /* V_PROFIT */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -1) /* V_PROFITPERCENTAGE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -2) /* V_CUMULATIVEPROFIT */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -3) /* V_CUMULATIVEPROFITPERCENTAGE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -4) /* V_RUNUP */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -5) /* V_RUNUPPERCENTAGE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -6) /* V_DRAWDOWN */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -7) /* V_DRAWDOWNPERCENTAGE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -8) /* V_BERUNUP */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.r.s(5, -9) /* V_BERUNUPPERCENTAGE */}`);
        L.cache.delete(`position-row-field-${position.positionId}-.${L.s(5, -2) /* view-snapshots-button */}`);
    }
}

L.isEbacktestingPanelOpen = function() {
    const cacheKey = "isEbacktestingPanelOpen";
    
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const isOpen = $(L.s(-2, -1) /* div.replay_trading:not(.js-hidden) */).length == 1;
    L.cache.set(cacheKey, isOpen, 2);
    return isOpen;
}

L.onDateCellClick = async function (event, position) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    if (!L.isEditingPositionsList()) {
        const element = $(event.currentTarget);
        L.getPositionChart(position, true)?.setActive();
        
        setTimeout(() => {
            L.onSelectPositionRow(position, true);
        }, 1000);

        if (element.hasClass(L.r.s(4, -4) /* V_ENTRYDATE */)) {
            if(L.session.meta.isReviewMode) {
                await L.selectDateWithNavigation(position.entryTime);
            } else {
                L.gotoTime(position.entryTime);
            }
        } else if (element.hasClass(L.r.s(4, -3) /* V_EXITDATE */)) {
            if(L.session.meta.isReviewMode && position.exitTime) {
                await L.selectDateWithNavigation(position.exitTime);
            } else {
                L.gotoTime(position.exitTime || L.session.currentDate);
            }
        }
    }
}

L.onDateCellMouseEnter = function (event, position) {
    const element = $(event.currentTarget);
    if (!element.hasClass(L.r.s(8, -6) /* openTrade */)) {
        if (element.find("svg").length == 0) {
            element.prepend(L.r.s(8, -8) /* <svg class="cell" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" fill-rule="evenodd" d="M3.58 9.5a5.45 5.45 0 0 0 4.92 4.92V16h1v-1.58a5.45 5.45 0 0 0 4.92-4.92H16v-1h-1.58A5.45 5.45 0 0 0 9.5 3.58V2h-1v1.58A5.45 5.45 0 0 0 3.58 8.5H2v1h1.58ZM8.5 6V4.58A4.45 4.45 0 0 0 4.58 8.5H6v1H4.58a4.45 4.45 0 0 0 3.92 3.92V12h1v1.42a4.45 4.45 0 0 0 3.92-3.92H12v-1h1.42A4.45 4.45 0 0 0 9.5 4.58V6h-1Z"></path></svg> */);          
        }
    }
}

L.onDateCellMouseLeave = function (event, position) {
    const element = $(event.currentTarget);
    element.find("svg").remove();    
}

L.onSelectPositionRow = async function (position, forceSelect) {
    if (!L.isEditingPositionsList()) {
        $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).toggleClass(L.r.s(8, -9) /* selected */).siblings().removeClass(L.r.s(8, -9) /* selected */);
        if(forceSelect) {
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).addClass(L.r.s(8, -9) /* selected */);
        }

        if ($(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).hasClass(L.r.s(8, -9) /* selected */)) {
            for (const p of L.session.positions) {
                if (p.meta.hasShapeRedraw) {
                    L.removeShapeForPosition(p, true);
                }
            }
            const shapes = await L.drawShapeForPosition(position);
            if(shapes.some(s => s)) {
                const isShapeOnScreen = function(shape) {
                    if(shape) {
                        const shapePoints = shape.getPoints();
                        return L.getCharts().filter(c => c.symbol() == position.symbol.symbolName || c.chartModel().mainSeries().symbolInfo().pro_name == position.symbol.symbolName).some(c => {
                            const visibleRange = c.getVisibleRange();
                            if(visibleRange.from <= shapePoints[0]?.time && shapePoints[1]?.time <= visibleRange.to) {
                                return true;
                            }

                            return false;
                        });
                    }
                };

                if(!shapes.some(s => isShapeOnScreen(s))) {
                    L.toast(L.r.s(9, -1) /* Click entry/exit dates in the TestingView panel to jump to the trade. */, 2000);
                }
            } else {
                if (!L.hasSameSymbol(L.c(), position)) {
                    L.toast(L.r.s(9, -2) /* Double click to open the position's chart */, 2000);
                }
            }
        } else {
            L.removeShapeForPosition(position, true);
        }
    }
}

L.onDblClickPositionRow = async function (event, position) {
    if (!L.isEditingPositionsList()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!L.getPositionChart(position, true)) {
            await L.changeSymbol(L.c(), position.symbol.symbolName);
        }

        if (await L.drawShapeForPosition(position)) {
            $(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).addClass(L.r.s(8, -9) /* selected */).siblings().removeClass(L.r.s(8, -9) /* selected */);
            for (const p of L.session.positions) {
                if (p.meta.hasShapeRedraw) {
                    L.removeShapeForPosition(p, true);
                }
            }
        }
    }
}

L.onCloseTradeButtonClick = function (position) {
    const chart = L.getPositionChart(position);
    if (chart) {
        position.exitPrice = position.meta.currentPrice;
        L.closePosition(position, 0 /* Manual */, chart);
    }
}

L.onShowBEButtonClick = function (position) {
    L.showBeLine(position, L.getPositionChart(position, true));
}

L.onHideBEButtonClick = function (position) {
    L.removeBeLine(position, L.getPositionChart(position, true));
}

L.onEditField = function (event, position) {
    const element = $(event.currentTarget);
    if (!L.isEditingPositionsList()) {
        if (element.hasClass(L.r.s(5, -7) /* V_DRAWDOWNPERCENTAGE */) && position.exitTime) {
            L.createInput(L.r.s(1, 3) /* number */, event, position);
        } else if (element.hasClass(L.r.s(5, -5) /* V_RUNUPPERCENTAGE */) && position.exitTime) {
            L.createInput(L.r.s(1, 3) /* number */, event, position);
        } else if (element.hasClass(L.r.s(5, -9) /* V_BERUNUPPERCENTAGE */) && position.exitTime) {
            L.createInput(L.r.s(1, 3) /* number */, event, position);
        } else if (element.hasClass(L.r.s(5, -6) /* V_DRAWDOWN */) && position.exitTime) {
            L.createInput(L.r.s(1, 3) /* number */, event, position);
        } else if (element.hasClass(L.r.s(5, -4) /* V_RUNUP */) && position.exitTime) {
            L.createInput(L.r.s(1, 3) /* number */, event, position);
        } else if (element.hasClass(L.r.s(5, -8) /* V_BERUNUP */) && position.exitTime) {
            L.createInput(L.r.s(1, 3) /* number */, event, position);
        } else if (element.hasClass(L.r.s(5, -8) /* V_BERUNUP */) && position.exitTime) {
            L.createInput(L.r.s(1, 3) /* number */, event, position);
        } else if (element.hasClass(L.r.s(7, -1) /* V_VALUE */)) {
            const columnName = $(event.currentTarget).parent().attr(L.r.s(0, 7) /* column-name */);
            const column = L.session.sessionColumns.find(c => c.columnName == columnName);
            if (!column.readonly) {
                if (column.columnEnumValues) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    position.columnValue(element.parent().attr(L.r.s(0, 7) /* column-name */), event.target.value);
                } else {
                    switch (column.columnType) {
                        case L.r.s(0, 9) /* text */:
                        case L.r.s(1, 7) /* date */:
                        case L.r.s(1, 9) /* time */:
                        case L.r.s(2, 1) /* datetime */:
                        case L.r.s(1, 3) /* number */: {
                            if(columnName == L.r.s(1, -5) /* Lots */ && L.session.getParameter(L.sessionParameterIds.CanModifyQty) != 'true') {
                                return;
                            }
                            if(TradingView.defaultProperties.meta.includes(L.r.s(9, -3) /* CanModifyPositionQty */)) {
                                L.createInput(column.columnType, event, position);
                            } else {
                                L.messageBox(L.r.s(4, 0) /* Feature disabled */, L.r.s(9, -4) /* Modifying position quantity is disabled in your current TestingView plan. Please upgrade to enable this feature. */);
                            }
                            break;
                        }
                        case L.r.s(1, 1) /* richtext */: {
                            L.createTextAreaInput(event, position);
                            break;
                        }
                        case L.r.s(1, 5) /* bool */: {
                            position.columnValue(element.parent().attr(L.r.s(0, 7) /* column-name */), event.target.checked);
                            event.stopPropagation();
                            event.stopImmediatePropagation();
                            break;
                        }
                    }
                }
            }
        }
    }
}

L.createInput = function (columnType, event, position) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const element = $(event.currentTarget);
    if (!element.children("input").length) {
        var value = element.html();
        const width = element.width();
        const height = element.height();
        if (value.includes("<svg")) {
            value = "";
        }

        const inputType = columnType == L.r.s(2, 1) /* datetime */ ? "datetime-local" : columnType;

        element.html(`<input type="${inputType}" value="${value}" />`);
        const control = element.children("input");
        control.width(width * 1.5);
        control.height(height);
        control.on("focus", function () { this.select(); }).focus();
        control.focus();
        control.on("blur", (e) => {
            var userValue = e.target.value;

            if (element.hasClass(L.r.s(5, -4) /* V_RUNUP */)) {
                userValue = Math.abs(userValue);
                position.columnValue(L.r.s(2, -1) /* Run-up */, userValue);
                element.parents("td").find(L.r.s(5, -5) /* V_RUNUPPERCENTAGE */).text(position.getRunUpPercentage());
                position.meta.trackVirtualRunUp = false;
            } else if (element.hasClass(L.r.s(5, -6) /* V_DRAWDOWN */)) {
                userValue = -Math.abs(userValue);
                position.columnValue(L.r.s(2, -2) /* Drawdown */, userValue);
                element.parents("td").find(L.r.s(5, -7) /* V_DRAWDOWNPERCENTAGE */).text(position.getDrawDownPercentage());
                position.meta.trackVirtualDrawDown = false;
            } else if (element.hasClass(L.r.s(5, -5) /* V_RUNUPPERCENTAGE */)) {
                userValue = Math.abs(userValue);
                position.columnValue(L.r.s(2, -1) /* Run-up */, userValue * position.meta.initialBalance / 100);
                element.parents("td").find(L.r.s(5, -4) /* V_RUNUP */).text(position.getRunUp());
                position.meta.trackVirtualRunUp = false;
            } else if (element.hasClass(L.r.s(5, -7) /* V_DRAWDOWNPERCENTAGE */)) {
                userValue = -Math.abs(userValue);
                position.columnValue(L.r.s(2, -2) /* Drawdown */, userValue * position.meta.initialBalance / 100);
                element.parents("td").find(L.r.s(5, -6) /* V_DRAWDOWN */).text(position.getDrawDown());
                position.meta.trackVirtualDrawDown = false;
            } else if (element.hasClass(L.r.s(5, -8) /* V_BERUNUP */)) {
                userValue = Math.abs(userValue);
                position.columnValue(L.r.s(2, -4) /* BE Run-up */, userValue);
                element.parents("td").find(L.r.s(5, -9) /* V_BERUNUPPERCENTAGE */).text(position.getBERunUpPercentage());
                if(position.columnValue(L.r.s(2, -1) /* Run-up */) < position.getBERunUp()) {
                    position.columnValue(L.r.s(2, -1) /* Run-up */, position.getBERunUp());
                    element.parents("td").parent().find(L.r.s(5, -4) /* V_RUNUP */).text(position.getRunUp());
                    element.parents("td").parent().find(L.r.s(5, -5) /* V_RUNUPPERCENTAGE */).text(position.getRunUpPercentage());
                }
                position.meta.trackBeRunUp = false;
                position.meta.trackVirtualBeRunUp = false;
            } else if (element.hasClass(L.r.s(5, -9) /* V_BERUNUPPERCENTAGE */)) {
                userValue = Math.abs(userValue);
                position.columnValue(L.r.s(2, -4) /* BE Run-up */, userValue * position.meta.initialBalance / 100);
                element.parents("td").find(L.r.s(5, -8) /* V_BERUNUP */).text(position.getBERunUp());
                if(position.columnValue(L.r.s(2, -1) /* Run-up */) < position.getBERunUp()) {
                    position.columnValue(L.r.s(2, -1) /* Run-up */, position.getBERunUp());
                    element.parents("td").parent().find(L.r.s(5, -4) /* V_RUNUP */).text(position.getRunUp());
                    element.parents("td").parent().find(L.r.s(5, -5) /* V_RUNUPPERCENTAGE */).text(position.getRunUpPercentage());
                }
                position.meta.trackBeRunUp = false;
                position.meta.trackVirtualBeRunUp = false;
            } else if(element.parents("td").attr(L.r.s(0, 7) /* column-name */) == L.r.s(1, -5) /* Lots */) {
                const qtyDiff = position.quantity / Number(userValue);

                position.quantity = Number(userValue);
                L.dataOps.updatePositionQuantity(position.positionId, position.quantity);

                if(qtyDiff != 0) {
                    if(position.getRisk(true)) {
                        position.risk(position.getRisk(true) / qtyDiff);
                    }
                    position.columnValue(L.r.s(2, -4) /* BE Run-up */, position.getBERunUp(true) / qtyDiff);
                    position.columnValue(L.r.s(2, -1) /* Run-up */, position.getRunUp(true) / qtyDiff);
                    position.columnValue(L.r.s(2, -2) /* Drawdown */, position.getDrawDown(true) / qtyDiff);
                    
                    if(position.exitTime) {
                        position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);
                    }
                }

                L.getBalanceAfterPositions(L.session.capital, L.session.positions).then((balance) => { L.session.meta.balance = balance; });
                L.updatePositionUI(position);
            } else {
                position.columnValue(element.parent().attr(L.r.s(0, 7) /* column-name */), userValue);
            }

            if (columnType == L.r.s(1, 7) /* date */ || columnType == L.r.s(1, 9) /* time */ || columnType == L.r.s(2, 1) /* datetime */) {
                userValue = userValue.replace("T", " ");
            } else if (columnType == L.r.s(1, 3) /* number */) {
                userValue = Number(userValue);
            }

            if (userValue.toString().trim().length == 0) {
                userValue = L.r.s(2, -7) /* <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'><path fill='currentColor' d='m21.45 7.55-1.8 1.8a.47.47 0 0 1-.67 0L14.65 5a.47.47 0 0 1 0-.66l1.8-1.8a1.88 1.88 0 0 1 2.65 0l2.35 2.35c.73.73.73 1.91 0 2.65ZM13.1 5.9 2.84 16.15l-.83 4.75a.94.94 0 0 0 1.1 1.09l4.74-.84L18.1 10.9a.47.47 0 0 0 0-.67L13.77 5.9a.47.47 0 0 0-.67 0Zm-6.25 9.37a.54.54 0 0 1 0-.77l6.01-6.01a.54.54 0 0 1 .78 0c.21.21.21.55 0 .77l-6.02 6.01a.54.54 0 0 1-.77 0Zm-1.41 3.29H7.3v1.42l-2.52.44-1.21-1.22.44-2.51h1.42v1.87Z'></path></svg> */;
            }
            element.html(userValue);
        });
    }
}

L.createTextAreaInput = function (event, position) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const element = $(event.currentTarget);
    if (!element.children("input").length) {
        var value = element.text();
        const width = element.width();
        const height = element.height();
        if (value.includes("<svg")) {
            value = "";
        }

        element.html(`<textarea rows="3">${value}</textarea>`);
        const control = element.children("textarea");
        control.width(Math.max(width, 200));
        control.height(Math.max(height, 80));
        control.on("focus", function () { this.select(); }).focus();
        control.focus();
        control.on("blur", (e) => {
            var userValue = e.target.value.trim();
            position.columnValue(element.parent().attr(L.r.s(0, 7) /* column-name */), userValue);
            if (userValue.trim().length == 0) {
                userValue = L.r.s(2, -7) /* <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'><path fill='currentColor' d='m21.45 7.55-1.8 1.8a.47.47 0 0 1-.67 0L14.65 5a.47.47 0 0 1 0-.66l1.8-1.8a1.88 1.88 0 0 1 2.65 0l2.35 2.35c.73.73.73 1.91 0 2.65ZM13.1 5.9 2.84 16.15l-.83 4.75a.94.94 0 0 0 1.1 1.09l4.74-.84L18.1 10.9a.47.47 0 0 0 0-.67L13.77 5.9a.47.47 0 0 0-.67 0Zm-6.25 9.37a.54.54 0 0 1 0-.77l6.01-6.01a.54.54 0 0 1 .78 0c.21.21.21.55 0 .77l-6.02 6.01a.54.54 0 0 1-.77 0Zm-1.41 3.29H7.3v1.42l-2.52.44-1.21-1.22.44-2.51h1.42v1.87Z'></path></svg> */;
            }

            element.html(userValue);
        });
    }
}

L.isEditingPositionsList = function () {
    return $(`.${L.r.s(3, -2) /* backtst-positions-table */} input:not([type='checkbox'])`).length > 0
        || $(`.${L.r.s(3, -2) /* backtst-positions-table */} textarea`).length > 0;
}
 
L.getDefaultColumns = function () {
    return [
        { columnName: L.r.s(1, -1) /* Trade */, columnType: L.r.s(2, 3) /* actions */, sortable: false, visible: true, readonly: true },
        { columnName: L.r.s(1, -2) /* Date/Time */, columnType: L.r.s(2, 1) /* datetime */, sortable: true, readonly: true, visible: true },
        { columnName: L.r.s(1, -3) /* Price */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: true, readonly: true },
        { columnName: L.r.s(1, -4) /* Symbol */, columnType: L.r.s(0, 9) /* text */, sortable: true, visible: false, readonly: true },
        { columnName: L.r.s(1, -5) /* Lots */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: true },
        { columnName: L.r.s(1, -6) /* RR */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: false },
        { columnName: L.r.s(1, -7) /* Risk */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: true, readonly: true },
        { columnName: L.r.s(1, -8) /* Profit */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: true, readonly: true },
        { columnName: L.r.s(1, -9) /* Cumulative profit */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: false, readonly: true, description: L.s(-9, -4) /* The running total of all closed position profits/losses up to and including this position */ },
        { columnName: L.r.s(2, -1) /* Run-up */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: true, description: L.s(-9, -2) /* The maximum favorable excursion (MFE) reached while in the position */ },
        { columnName: L.r.s(2, -2) /* Drawdown */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: true, description: L.s(-9, -3) /* The maximum adverse excursion (MAE) reached while in the position */ },
        { columnName: L.r.s(2, -4) /* BE Run-up */, columnType: L.r.s(1, 3) /* number */, sortable: true, visible: false, description: L.s(-9, -1) /* The maximum favorable excursion (MFE) reached before breakeven was hit (only applicable when a BE price is set after entry) */ },
        { columnName: L.s(-7, -6) /* Virtual Run-up */, columnType: L.r.s(1, 3) /* number */, sortable: true, hidden: !['BacktestingMaestro'].includes(user.username) },
        { columnName: L.s(-7, -7) /* Virtual Drawdown */, columnType: L.r.s(1, 3) /* number */, sortable: true, hidden: !['BacktestingMaestro'].includes(user.username) },
        { columnName: L.s(-7, -8) /* Virtual BE Run-up */, columnType: L.r.s(1, 3) /* number */, sortable: true, hidden: !['BacktestingMaestro'].includes(user.username) },
        { columnName: L.r.s(2, -3) /* Snapshots */, columnType: L.r.s(2, 3) /* actions */, sortable: false, visible: true, readonly: true },
        { columnName: L.r.s(2, -5) /* Notes */, columnType: L.r.s(1, 1) /* richtext */, sortable: false, visible: true },
        { columnName: L.r.s(2, -6) /* Analysis Time */, columnType: L.r.s(1, 9) /* time */, sortable: true, visible: true }
    ];
}

L.syncWithDefaultColumns = function (columns) {
    for (const defaultColumn of L.getDefaultColumns()) {
        const column = columns.find(c => c.columnName == defaultColumn.columnName);
        if(column) {
            column.hidden = !!defaultColumn.hidden;
            column.readonly = !!defaultColumn.readonly;
            column.description = defaultColumn.description || "";
        }
    }
}

L.saveSessionColumns = function (sessionId, columns) {
    if(!columns) {
        columns = [];
    }

    for (const defaultColumn of L.getDefaultColumns()) {
        const column = columns.find(c => c.columnName == defaultColumn.columnName);
        if (!column) {
            columns.push(defaultColumn);
        } else {
            column.sortable = column.sortable ?? defaultColumn.sortable;
            column.columnType = column.columnType ?? defaultColumn.columnType;
            column.readonly = column.readonly ?? defaultColumn.readonly;
        }
    }

    return L.dataOps.saveSessionColumns(sessionId, columns);
}
