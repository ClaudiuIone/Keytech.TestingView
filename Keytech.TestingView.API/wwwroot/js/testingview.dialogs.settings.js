L.createSettingsUI = function (dialogContainer) {
    dialogContainer.find(L.s(5, 7) /* div[class*='tabs'] */).remove();
    const container = dialogContainer.find(L.s(5, 9) /* div[class*='scrollable'] div[class*='content'] */);
    container.children().remove();

    const footer = dialogContainer.find(L.s(6, 0) /* div[class*='footer'] */);
    footer.find(L.s(6, 1) /* span[role='button'][data-role='listbox'] */).remove();

    container.append($(`<h3 class='${L.s(8, -2) /* backtst-dialog-section-title */}'>${L.s(8, -3) /* Options */}</h3>`));
    var section = $("<div>").addClass(L.s(9, 3) /* backtst-dialog-options-section */);
    container.append(section);
    var optionsSection = $(`
            <input type='checkbox' id='${L.s(8, -4) /* backtst-option */}-${L.s(8, -5) /* MinReplayResolution */}Dummy' checked>
            <label for="${L.s(8, -4) /* backtst-option */}-${L.s(8, -5) /* MinReplayResolution */}">Minimum step forward</label>
            <select id="${L.s(8, -4) /* backtst-option */}-${L.s(8, -5) /* MinReplayResolution */}">
            </select>
            <span title="${L.s(8, -6) /* The minimum replay interval when clicking the step forward button (Shift + ⇨). When skipping candles, all increments are based on this interval. By default, it's the minimum supported by your TradingView subscription plan. */}" class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true">${L.s(8, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg> */}</span></span>
            <div id='${L.r.s(-5, -4) /* min-resolution-warning */}'></div>
            <br/>
            <input type='checkbox' id='${L.s(8, -4) /* backtst-option */}-${L.s(8, -8) /* PreventCandlePreviews */}' ${L.session.getParameter(L.sessionParameterIds.PreventCandlePreviews) == L.s(0, 6) /* true */ ? L.s(7, 3) /* checked */ : ""}>
            <label for='${L.s(8, -4) /* backtst-option */}-${L.s(8, -8) /* PreventCandlePreviews */}'>${L.s(8, -9) /* Prevent candle previews when changing timeframes */}</label>
            <span title="${L.s(9, -1) /* When you change timeframes, TradingView may briefly show an inaccurate preview of the current candle. When this option is enabled, the chart will automatically step back slightly and replay forward to rebuild the candle correctly, ensuring the final candle state is accurate. */}" class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true">${L.s(8, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg> */}</span></span>
            <br/>
            <input type='checkbox' id='${L.s(8, -4) /* backtst-option */}-${L.s(9, -2) /* AutoSnapshot */}' ${L.session.getParameter(L.sessionParameterIds.AutoSnapshot) == L.s(0, 6) /* true */ ? L.s(7, 3) /* checked */ : ""}>
            <label for='${L.s(8, -4) /* backtst-option */}-${L.s(9, -2) /* AutoSnapshot */}'>${L.s(9, -3) /* Auto capture trade snapshots */}</label>
            <span title="${L.s(9, -4) /* Save into the TestingView journal panel automatic snapshots of the chart during and after a trade: when the position opens, when either TP or SL gets hit, when BE gets hit, or when the trade is manually closed. */}" class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true">${L.s(8, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg> */}</span></span>
            <br/>
            <input type='checkbox' id='${L.s(8, -4) /* backtst-option */}-${L.s(9, -5) /* CanModifyQty*/}' ${L.session.getParameter(L.sessionParameterIds.CanModifyQty) == L.s(0, 6) /* true */ ? L.s(7, 3) /* checked */ : ""}>
            <label for='${L.s(8, -4) /* backtst-option */}-${L.s(9, -5) /* CanModifyQty*/}'>${L.s(9, -6) /* Allow modifying quantity */}</label>
            <span title="${L.s(9, -7) /* Enable the ability to modify the quantity (lots) of each trade in the TestingView panel. */}" class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true">${L.s(8, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg> */}</span></span>
            <br/>
            <input type='checkbox' id='${L.s(8, -4) /* backtst-option */}-${L.s(-6, -2) /* ConfirmEntries */}' ${L.session.getParameter(L.sessionParameterIds.ConfirmEntries) == L.s(0, 6) /* true */ ? L.s(7, 3) /* checked */ : ""}>
            <label for='${L.s(8, -4) /* backtst-option */}-${L.s(-6, -2) /* ConfirmEntries */}'>${L.s(-6, -3) /* Confirm entries */}</label>
            <span title="${L.s(-6, -4) /* When opening a new position, show a yes/no dialog to confirm the position should be opened */}" class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true">${L.s(8, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg> */}</span></span>
        `);

    section.append(optionsSection);
    $(`#${L.s(8, -4) /* backtst-option */}-${L.s(8, -5) /* MinReplayResolution */}`).on("change", (e) => {
        const minReplayResolutionInput = $(e.target);
        const warningDiv = $(`#${L.r.s(-5, -4) /* min-resolution-warning */}`);
        const selectedMinReplayResolution = minReplayResolutionInput.val();
        if(L.resolutionToSeconds(selectedMinReplayResolution) < 60) {
            warningDiv.html(L.r.s(-5, -3, L.resolutionToFriendlyText(selectedMinReplayResolution)) /* Warning: <b>{0}</b> stepping depends on recorded ticks. If ticks are missing, time will jump to the next available tick (e.g., +2s, +5s).<br>This may affect fast-forwarding by the selected interval (15m, 1h, 2h, etc.) */);
            warningDiv.show();
        } else {
            warningDiv.hide();
        }
    });

    $(`#${L.s(8, -4) /* backtst-option */}-${L.s(8, -5) /* MinReplayResolution */}Dummy`)
    .on('click change keydown keyup mousedown mouseup touchstart touchend', function(e) {
        e.preventDefault();
        $(this).prop('checked', true);
        return false;
    });

    L.getAvailableReplayResolutions().then(resolutions => {
        const select = optionsSection.closest(`#${L.s(8, -4) /* backtst-option */}-${L.s(8, -5) /* MinReplayResolution */}`);
        L.getMinReplayResolution().then(minReplayResolution => {
            resolutions.forEach(resolution => {
                select.append($('<option>', {
                    value: resolution,
                    text: L.resolutionToFriendlyText(resolution),
                    selected: minReplayResolution == resolution
                }));
            });
        });
    });

    L.session.retrieveParameters().then(() => {
        L.getMinReplayResolution().then(r => { $(`#${L.s(8, -4) /* backtst-option */}-${L.s(8, -5) /* MinReplayResolution */}`).val(r); });
        $(`#${L.s(8, -4) /* backtst-option */}-${L.s(8, -8) /* PreventCandlePreviews */}`).prop(L.s(7, 3) /* checked */, L.session.getParameter(L.sessionParameterIds.PreventCandlePreviews) == L.s(0, 6) /* true */);
        $(`#${L.s(8, -4) /* backtst-option */}-${L.s(9, -2) /* AutoSnapshot */}`).prop(L.s(7, 3) /* checked */, L.session.getParameter(L.sessionParameterIds.AutoSnapshot) == L.s(0, 6) /* true */);
        $(`#${L.s(8, -4) /* backtst-option */}-${L.s(9, -5) /* CanModifyQty */}`).prop(L.s(7, 3) /* checked */, L.session.getParameter(L.sessionParameterIds.CanModifyQty) == L.s(0, 6) /* true */);
    });

    container.append($(`<h3 class='${L.s(8, -2) /* backtst-dialog-section-title */}'>${L.s(9, -8, L.session.sessionColumns.filter(c => !c.hidden).length) /* Journal Columns <span>({0})</span> */}</h3>`));
    section = $("<div>")
        .addClass(L.s(9, 3) /* backtst-dialog-options-section */)
        .addClass("collapsed")
        .addClass(L.s(9, -9) /* backtst-journal-options-section */);

    container.append(section);

    var columnsTable = $(`
        <table class="${L.s(6, 4) /* backtst-dialog-table */} ${L.r.s(0, 0) /* backtst-column-settings-table */}">
        </table>
    `);

    const createColumnRow = (column) => {
        const columnRow = $(`
            <tr ${L.r.s(0, 1) /* data-column-id */}="${column.columnId}" class="${column.hidden ? "hidden" : ""}">
                <td class="${L.r.s(0, 2) /* column-drag */}">
                    <div class="${L.r.s(0, 3) /* drag-handle */}">
                        ${L.r.s(0, 4) /* <svg width="20" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="5" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="6" cy="19" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle><circle cx="18" cy="5" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle><circle cx="18" cy="19" r="1.5"></circle></svg> */}
                    </div>
                </td>
                <td class="${L.r.s(0, 5) /* column-enable */}">
                    <input type="checkbox" ${L.r.s(0, 6) /* data-column-name */}="${column.columnName}" ${column.visible ? L.s(7, 3) /* checked */ : ""}>
                </td>
                <td class="${L.r.s(0, 7) /* column-name */}"><input title="${column.description}" class="input size-small" value="${column.columnName}" ${L.isPredefinedColumn(column.columnName) ? "readonly" : ""}></td>
                <td class="${L.r.s(0, 8) /* column-type */}">
                    <select ${L.isPredefinedColumn(column.columnName) ? "disabled" : ""}>
                        <option value="${L.r.s(0, 9) /* text */}" ${column.columnType == L.r.s(0, 9) /* text */ ? "selected" : ""}>${L.r.s(1, 0) /* Text */}</option>
                        <option value="${L.r.s(1, 1) /* richtext */}" ${column.columnType == L.r.s(1, 1) /* richtext */ ? "selected" : ""}>${L.r.s(1, 2) /* Rich text */}</option>
                        <option value="${L.r.s(1, 3) /* number */}" ${column.columnType == L.r.s(1, 3) /* number */ ? "selected" : ""}>${L.r.s(1, 4) /* Number */}</option>
                        <option value="${L.r.s(1, 5) /* bool */}" ${column.columnType == L.r.s(1, 5) /* bool */ ? "selected" : ""}>${L.r.s(1, 6) /* Yes/No */}</option>
                        <option value="${L.r.s(1, 7) /* date */}" ${column.columnType == L.r.s(1, 7) /* date */ ? "selected" : ""}>${L.r.s(1, 8) /* Date */}</option>
                        <option value="${L.r.s(1, 9) /* time */}" ${column.columnType == L.r.s(1, 9) /* time */ ? "selected" : ""}>${L.r.s(2, 0) /* Time */}</option>
                        <option value="${L.r.s(2, 1) /* datetime */}" ${column.columnType == L.r.s(2, 1) /* datetime */ ? "selected" : ""}>${L.r.s(2, 2) /* Date & time */}</option>
                        <option disabled value="${L.r.s(2, 3) /* actions */}" ${column.columnType == "actions" ? "selected" : ""}>${L.r.s(2, 4) /* Actions */}</option>
                    </select>
                </td>
                <td class="${L.s(6, 6) /* backtst-actions */}">
                    <button class="${L.r.s(2, 5) /* edit-select-values */} lightButton secondary xsmall typography-regular14px" title="${column.columnEnumValues || L.r.s(2, 6) /* Edit possible values */}" ${L.r.s(3, 0) /* data-values */}="${column.columnEnumValues || ""}" ${L.isPredefinedColumn(column.columnName) || ["richtext", "bool", "actions"].includes(column.columnType) ? "disabled" : ""}>
                        ${L.r.s(2, 7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="18" height="18"><path fill="currentColor" d="M5 6.4a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 6h16V5H8v1Zm-3 8.46a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 14h16v-1H8v1Zm-2 7.43a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM24 22H8v-1h16v1Z"></path></svg> */}
                    </button>
                    <button class="${L.r.s(2, 9) /* delete-column */} lightButton secondary xsmall typography-regular14px" title="${L.s(-6, -9) /* Delete column */}" ${L.isPredefinedColumn(column.columnName) ? "disabled" : ""}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                            ${L.r.s(3, 2) /* <path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path> */}
                        </svg>
                    </button>
                </td>
            </tr>
        `);

        columnRow.find("select").on("change", function () {
            const columnType = $(this).val();
            if ([L.r.s(1, 1) /* richtext */, L.r.s(1, 5) /* bool */, L.r.s(2, 3) /* actions */].includes(columnType)) {
                columnRow.find(`button.${L.r.s(2, 5) /* edit-select-values */}`).attr("disabled", true);
            } else {
                columnRow.find(`button.${L.r.s(2, 5) /* edit-select-values */}`).removeAttr("disabled");
            }

            if (L.isPredefinedColumn(column.columnName)) {
                columnRow.find(`button.${L.r.s(2, 5) /* edit-select-values */}`).attr("disabled", true);
                columnRow.find(`button.${L.r.s(2, 9) /* delete-column */}`).attr("disabled", true);
            }
        });

        columnRow.find(`button.${L.r.s(2, 5) /* edit-select-values */}`).on("click", () => {
            L.showInputPrompt(L.r.s(3, 3, $(`tr[data-column-id=${column.columnId}] td.column-name input`).val().trim()) /* Specify possible options for {0}, separated by commas:*/, column.columnEnumValues, L.r.s(3, 4) /* Option 1, Option 2, Option 3 */, dialogContainer).then(value => {
                if (value !== null) {
                    const button = columnRow.find(`button.${L.r.s(2, 5) /* edit-select-values */}`);
                    button.attr(L.r.s(3, 0) /* data-values */, value);
                    button.attr("title", value);
                }
            });
        });

        columnRow.find(`button.${L.r.s(2, 9) /* delete-column */}`).on("click", () => {
            columnRow.remove();
        });

        return columnRow;
    };

    for (const column of L.session.sessionColumns) {
        columnsTable.append(createColumnRow(column));
    }
    section.append(columnsTable);

    const expandColumnsButton = $(`
        <div data-role="button" class="controls-button button apply-common-tooltip isInteractive ${L.r.s(-1, -7) /* backtst-column-settings-expand-button */}" data-tooltip="${L.r.s(-1, -8) /* Expand: show all journal columns */}">
            <span role="img" aria-hidden="true"> 
                ${L.r.s(-1, -6) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-9.31 4.6 5.46-5.47c.38-.38.38-1 0-1.37l-.69-.68a.96.96 0 0 0-1.36 0l-4.1 4.1-4.1-4.1a.96.96 0 0 0-1.36 0l-.69.68a.96.96 0 0 0 0 1.37l5.46 5.46c.38.38 1 .38 1.38 0Z"></path></svg> */}
            </span>
        </div>`);
    section.append(expandColumnsButton);
    $(`.${L.r.s(-1, -7) /* backtst-column-settings-expand-button */}`).on("click", () => {
        $(`.${L.s(9, -9) /* backtst-journal-options-section */}`).removeClass("collapsed");
        setTimeout(() => {
            window.dispatchEvent(new Event('resize')); 
        }, 500);
    });

    const addNewColumn = $(`
        <div class="${L.r.s(3, 5) /* backtst-column-settings-add-new-column-container */}">
            <button class="lightButton secondary xsmall typography-regular14px">
                <span class="content nowrap">
                    <span class="ellipsisContainer">${L.r.s(3, 6) /* Add new column */}</span>
                </span>
            </button>
        </div>
    `);
    section.append(addNewColumn);

    let draggedRow = null;

    const dragOnMouseDown = function () {
        draggedRow = $(this).parents("tr");
        draggedRow.addClass(L.r.s(3, 7) /* dragging */);
    };

    const dragOnMouseMove = function (e) {
        if (draggedRow) {
            let targetRow = $(this);
            if (targetRow[0] !== draggedRow[0]) {
                let draggedY = draggedRow.offset().top;
                let targetY = targetRow.offset().top;
                if (draggedY > targetY) {
                    targetRow.before(draggedRow);
                } else {
                    targetRow.after(draggedRow);
                }
            }
        }
    };

    columnsTable.find(`tr .${L.r.s(0, 3) /* drag-handle */}`).on("mousedown", dragOnMouseDown);
    columnsTable.find("tr").on("mousemove", dragOnMouseMove);

    $(document).on("mouseup", function () {
        draggedRow?.removeClass(L.r.s(3, 7) /* dragging */);
        draggedRow = null;
    });

    $("button", addNewColumn).on("click", () => {
        if(TradingView.defaultProperties.meta.includes(L.r.s(3, 8) /* JournalCustomization */)) {
            const newColumn = {
                columnName: L.r.s(3, 9) /* New Column */,
                columnType: "text",
                visible: true,
                sortable: true
            };

            const newRow = createColumnRow(newColumn);

            if (columnsTable.find("tbody").length) {
                columnsTable.find("tbody").append(newRow);
            } else {
                columnsTable.find("tr").append(newRow);
            }

            columnsTable.find(`tr .${L.r.s(0, 3) /* drag-handle */}`).on("mousedown", dragOnMouseDown);
            columnsTable.find("tr").on("mousemove", dragOnMouseMove);
                    
            setTimeout(() => {
                window.dispatchEvent(new Event('resize')); 
            }, 1000);
        } else {
            L.messageBox(L.r.s(4, 0) /* Feature disabled */, L.r.s(4, 1) /* Cannot customize journal columns: please upgrade your TestingView.com subscription plan to enable this feature */);
        }
    });

    const saveOptions = function () {
        L.dataOps.setSessionTimeframeResolution(L.session.sessionId, L.getCharts()[0].timeframeSeconds, $(`#${L.s(8, -4) /* backtst-option */}-${L.s(8, -5) /* MinReplayResolution */}`).val());
        L.session.setParameter(L.sessionParameterIds.PreventCandlePreviews, $(`#${L.s(8, -4) /* backtst-option */}-${L.s(8, -8) /* PreventCandlePreviews */}`).prop(L.s(7, 3) /* checked */).toString());
        L.session.setParameter(L.sessionParameterIds.AutoSnapshot, $(`#${L.s(8, -4) /* backtst-option */}-${L.s(9, -2) /* AutoSnapshot */}`).prop(L.s(7, 3) /* checked */).toString());
        L.session.setParameter(L.sessionParameterIds.CanModifyQty, $(`#${L.s(8, -4) /* backtst-option */}-${L.s(9, -5) /* CanModifyQty*/}`).prop(L.s(7, 3) /* checked */).toString());
        L.session.setParameter(L.sessionParameterIds.ConfirmEntries, $(`#${L.s(8, -4) /* backtst-option */}-${L.s(-6, -2) /* ConfirmEntries*/}`).prop(L.s(7, 3) /* checked */).toString());
        L.selectResolution(0, 0);
        L.reflectReplayResolutions();

        if (!$(`#${L.s(8, -4) /* backtst-option */}-${L.s(8, -8) /* PreventCandlePreviews */}`).prop(L.s(7, 3) /* checked */)) {
            L.stopSkipping();
        }

        const newSessionName = dialogContainer.attr("data-dialog-name").trim();
        if (newSessionName && L.session.name != newSessionName) {
            L.session.name = newSessionName;
            L.dataOps.updateSession({ sessionId: L.session.sessionId, name: newSessionName }, L.session.meta.isReviewMode);
        }
    }

    optionsSection.filter("input, select").on("change", saveOptions);

    dialogContainer.find("button[name='submit']").on("click", () => {
        saveOptions();
        const currentColumnsJson = L.json(L.session.sessionColumns);
        const columns = [];
        columnsTable.find("tr").each((i, row) => {
            const columnId = $(row).attr(L.r.s(0, 1) /* data-column-id */);
            var columnName = $(row).find(`td.${L.r.s(0, 7) /* column-name */} input`).val().trim();
            const columnType = $(row).find(`td.${L.r.s(0, 8) /* column-type */} select`).val();
            const visible = $(row).find(`td.${L.r.s(0, 5) /* column-enable */} input`).is(":checked");
            var columnEnumValues = $(row).find(`button.${L.r.s(2, 5) /* edit-select-values */}`).attr(L.r.s(3, 0) /* data-values */);
            if ([L.r.s(1, 1) /* richtext */, L.r.s(1, 5) /* bool */, L.r.s(2, 3) /* actions */].includes(columnType)) {
                columnEnumValues = null;
            }

            if (columnName.trim()) {
                const existingColumn = L.session.sessionColumns.find(c => c.columnId == columnId);
                if (existingColumn) {
                    existingColumn.columnName = columnName;
                    existingColumn.columnType = columnType;
                    existingColumn.columnEnumValues = columnEnumValues;
                    existingColumn.visible = visible;
                    columns.push(existingColumn);
                } else {
                    if (!columns.some(c => c.columnName == columnName)) {
                        columns.push({
                            columnName: columnName,
                            columnType: columnType,
                            columnEnumValues: columnEnumValues,
                            visible: visible,
                            sortable: true
                        });
                    }
                }
            }
        });

        //detect columnName duplicates in columns array and add suffixes to duplicates
        const columnNames = columns.map(c => c.columnName);
        const duplicates = columnNames.filter((item, index) => columnNames.indexOf(item) != index);
        for (const duplicate of duplicates) {
            const duplicateCount = columnNames.filter(c => c == duplicate).length;
            for (let i = 0; i < duplicateCount; i++) {
                const column = columns.find(c => c.columnName == duplicate);
                if (column) {
                    column.columnName = `${duplicate} ${i + 1}`;
                }
            }
        }

        if(currentColumnsJson != L.json(columns)) {
        L.saveSessionColumns(L.session.sessionId, columns).then(c => {
            L.session.sessionColumns = c;
            L.syncWithDefaultColumns(L.session.sessionColumns);
            L.createPositionsListHeader(true);
        });

            if (columns.find(c => c.columnName == L.r.s(2, -6) /* Analysis Time */).visible) {
                $(`.${L.r.s(4, 3) /* analysis-timer-separator */}`).show();
                $(`.${L.r.s(4, 4) /* backtst-session-analysis-timer */}`).show();
            } else {
                $(`.${L.r.s(4, 3) /* analysis-timer-separator */}`).hide();
                $(`.${L.r.s(4, 4) /* backtst-session-analysis-timer */}`).hide();
            }
        }
        L.removeDummyShape();
    });

    dialogContainer.find(L.s(6, 3) /* button[name='cancel'] */).on("click", () => {
        L.removeDummyShape();
    });

    setTimeout(() => {
        window.dispatchEvent(new Event('resize')); 
    }, 1000);
}