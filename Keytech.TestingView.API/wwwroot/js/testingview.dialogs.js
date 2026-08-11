L.showInputPrompt = function (message, defaultValue, placeholder, parent) {
    return new Promise((resolve) => {
        const dialog = $("<div>")
            .addClass(L.s(-2, 3) /* backtst-prompt-dialog */)
            .appendTo(parent);

        const dialogContent = $("<div>")
            .addClass(L.s(-2, 4) /* backtst-prompt-dialog-content */)
            .appendTo(dialog);

        dialogContent.append($("<p>")
            .text(message));

        const input = $("<input>")
            .val(defaultValue)
            .attr("spellcheck", "false")
            .attr("placeholder", placeholder)
            .appendTo(dialogContent);

        const buttons = $("<div>")
            .appendTo(dialogContent);

        const okButton = $("<button>")
            .text(L.s(-2, 5) /* OK */)
            .addClass("lightButton secondary xsmall typography-regular14px")
            .on("click", () => {
                dialog.remove();
                resolve(input.val());
            })
            .appendTo(buttons);

        const cancelButton = $("<button>")
            .text(L.s(-2, 6) /* Cancel */)
            .addClass("lightButton secondary xsmall typography-regular14px")
            .on("click", () => {
                dialog.remove();
                resolve(null);
            })
            .appendTo(buttons);

        dialog.on("click mousedown mouseup focusin", (e) => {
            if ($(e.target).hasClass(L.s(-2, 3) /* backtst-prompt-dialog */)) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                cancelButton.click();
            }
        });

        input.on("keydown", (e) => {
            if (e.key === "Enter") {
                okButton.click();
            } else if (e.key === "Escape") {
                cancelButton.click();
            }
        });

        setTimeout(() => {
            input.focus();
        }, 300);
    });
}

L.showDialog = async function (title) {
    const hideDefaultDialogCss = `div[role="dialog"][data-name="source-properties-editor"] { display: none; }`;
    $("head").append(`<style>${hideDefaultDialogCss}</style>`);
    
    L.removeDummyShape();
    const chart = L.getCharts()[0];
    const dummyProperties = {
        shape: "emoji",
        disableSelection: true,
        disableSave: true,
        disableUndo: true,
        frozen: true,
        visible: false,
        showInObjectsTree: false,
        title: title,
        size: 0,
    };

    const dummyShapeId = await chart.createShape({ time: 0 }, dummyProperties);
    L.setGeneratedShape(dummyShapeId);

    const dummyShape = L.getShapeById(dummyShapeId, chart);
    dummyShape.setProperties(dummyProperties);
    L.monitorDialogs();
    chart.showPropertiesDialog(dummyShapeId);
}

L.showSessions = async function () {
    await L.showDialog(L.s(-2, 7) /* TestingView */);
}

L.showSettings = async function () {
    await L.showDialog(L.session.name);
}

L.showGotoDateDialog = async function () {
    await L.showDialog(L.s(-2, 8) /* Go to Date/Time */);
}

L.showAnalysisTimesDialog = async function () {
    await L.showDialog(L.s(-2, 9) /* Analysis Times */);
}

L.monitorDialogs = function () {
    L.monitorDialogsStartTime = Date.now();
    L.monitorDialogsTimer = setInterval(() => {
        if (Date.now() - L.monitorDialogsStartTime > 10000) {
            clearInterval(L.monitorDialogsTimer);
            return;
        }

        const dialogs = [
            { name: L.s(-2, 7) /* TestingView */, handler: L.createSessionsUI },
            { name: L.session?.name, handler: L.createSettingsUI },
            { name: L.s(-2, 8) /* Go to Date/Time */, handler: L.createGotoDateUI, info: L.s(-9, -5) /* Navigate directly to a specified date/time.<n>Note: jumping to a date/time will stop analysing optimal SL/TP & BE for the previous trades (see Statistics panel) */ },
            { name: L.s(-2, 9) /* Analysis Times */, handler: L.createAnalysisTimesUI },
        ];

        for (const dialog of dialogs) {
            const dialogContainer = $(`div[role="dialog"][data-name="source-properties-editor"][data-dialog-name="${dialog.name}"]:not([handled])`);
            if (dialogContainer.length && $("div[class*='popupDialog']").length == 0) {
                dialogContainer.attr("handled", 1);
                if(dialog.info) {
                    dialogContainer.find(`span:contains('${dialog.name}')`).append(`<span title="${dialog.info}" class="dialog-info-icon icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true">${L.s(8, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg> */}</span></span>`);
                }
                dialog.handler(dialogContainer);
                const showDefaultDialogCss = `div[role="dialog"][data-name="source-properties-editor"] { display: revert; }`
                $("head").append(`<style>${showDefaultDialogCss}</style>`);
            
                clearInterval(L.monitorDialogsTimer);
                dialogContainer.parent().css({top: "50%", left: "50%", transform: L.r.s(-1, -9) /* translate(-50%, -50%) */});
                return;
            }
        }
    }, 200);
}

L.setGeneratedShape = function (shapeId) {
    if (!L.generatedShapes) {
        L.generatedShapes = [];
    }
    L.generatedShapes.push(shapeId);
}

L.removeGeneratedShapes = function () {
    L.applyOnCharts(chart => {
        const shapes = chart.getAllShapes();
        for (const shapeInfo of shapes) {
            if (L.isGeneratedShape(shapeInfo.id)) {
                L.removeShapeById(shapeInfo.id, chart, true);
            }
        }
    });
}

L.isGeneratedShape = function (shapeId) {
    return (L.generatedShapes || []).includes(shapeId);
}

L.removeDummyShape = function () {
    const chart = L.getCharts()[0];
    const dummyShapes = chart.getAllShapes().filter(s => s.name == L.s(-3, 0) /* emoji */);
    for (const dummyShapeInfo of dummyShapes) {
        if (L.isGeneratedShape(dummyShapeInfo.id)) {
            L.removeShapeById(dummyShapeInfo.id, chart, true);
        }
    }
}

L.messageBox = function (title, content, callback) {
    L.t.showNoticeDialog({ title: title, body: content, callback: callback });
    L.dbg(`[Message] ${title}: ${content}`);
}

L.confirmBox = function (title, content, callback) {
    //callback is (answer: bool) => { if(answer) { ... } }
    L.t.showConfirmDialog({ title: title, body: content, callback: callback });
    L.dbg(`[Confirm] ${title}: ${content}`);
}

L.toast = function(message, timeout, type) {
    type = type || "info";

    L.applyOnCharts(c => c.chartWidget()._hideHint());
    const chartWidget = L.c().chartWidget();
    
    if(type == "info") {
        chartWidget.showHint(0, message);
    } else if(type == "warn") {
        chartWidget.showHint(1, {text: message});
    }

    clearTimeout(L.toastTimeout);
    if(timeout) {
        L.toastTimeout = setTimeout(() => {
            L.applyOnCharts(c => c.chartWidget()._hideHint());
        }, timeout);
    }

    L.dbg(message, type);
}

L.dbg = function(message, type, ...args) {
    type = type || "info";
    const timestamp = `[${new Date().toISOString()}]`;

    if(type == "info") {
        console.info(timestamp, message, ...args);
    } else {
        console.error(timestamp, message, ...args);
    }
}