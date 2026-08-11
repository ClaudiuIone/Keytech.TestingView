export let L = {
    user: { userId: null },
    replayApi: await window.TradingViewApi.replayApi(),
    isSkippingCandles: false,
    permissions: [],
    dataOps: { 
        plans: {
            none: {
                planId: "00000000-0000-0000-0000-000000000000"
            },
            full: {
                planId: "1BD92829-0577-4177-9B7A-0A9B0E8DD4ED"
            }
        }
    },
    sessionParameterIds: {
        MinReplayResolution: 1,
        PreventHTFCandlePreviews: 2,
        EnablePredefinedTimes: 3,
        PredefinedTimes: 4,
        EnableWarmupStart: 5,
        WarmupStartOffset: 6,
        AnalysisTimer: 7,
        ShowOpenPositionTip: 8,
    },
    snapshotUrlPrefix: "https://tradingview.com/x/",
    cache: {
        _storage: {},

        set: function (key, value, timeoutSeconds) {
            const expiresAt = Date.now() + timeoutSeconds * 1000;
            this._storage[key] = { value, expiresAt };
            setTimeout(() => this.delete(key), timeoutSeconds * 1000 + 1000);
        },

        get: function (key) {
            const cachedItem = this._storage[key];

            if (cachedItem && Date.now() < cachedItem.expiresAt) {
                return cachedItem.value;
            } else {
                delete this._storage[key];
                return undefined;
            }
        },

        getIfExists: function (key) {
            const value = this.get(key);
            return [value !== undefined, value];
        },

        delete: function (key) {
            delete this._storage[key];
        },

        clear: function () {
            this._storage = {};
        }
    },
};

/*
--------------------------------------
UI
--------------------------------------
*/

L.addCss = function () {
    $("<style>")
        .prop("type", "text/css")
        .html(`
        .hidden {
            display: none !important;
        }
        .drag-handle {
            cursor: grab;
            margin-right: 10px;
            opacity: 0.3;
        }
        .drag-handle:hover {
            opacity: 1;
        }

        @media (any-hover: hover) {
            html.theme-dark .button:hover {
                color: var(--tv-color-toolbar-button-text-hover, #dbdbdb);
            }
            .button:hover {
                color: var(--tv-color-toolbar-button-text-hover, #0f0f0f);
            }
            html.theme-dark .button.isInteractive:hover:before {
                background-color: var(--tv-color-toolbar-button-background-hover, #2e2e2e);
            }
            .button.isInteractive:hover:before {
                background-color: var(--tv-color-toolbar-button-background-hover, #f2f2f2);
                content: "";
            }
        }
        .button.isInteractive:before {
            border-radius: var(--tv-toolbar-explicit-hover-border-radius, 2px);
            bottom: var(--tv-toolbar-explicit-hover-margin, 2px);
            display: block;
            left: var(--tv-toolbar-explicit-hover-margin, 2px);
            outline: 2px none #2962ff;
            position: absolute;
            right: var(--tv-toolbar-explicit-hover-margin, 2px);
            top: var(--tv-toolbar-explicit-hover-margin, 2px);
            z-index: -1;
        }
        .controls {
            display: flex;
            justify-content: center;
            position: absolute;
        }
        .controls-separator {
            display: flex;
            flex: 1;
            height: 38px;
            justify-content: center;
            margin: 0 4px;
            max-width: 41px;
            min-width: 9px;
        }
        .controls-control {
            align-items: center;
            display: flex;
            height: 38px;
            justify-content: center;
            min-width: 38px;
        }
        .controls-control-type-forward {
            flex: 2;
            max-width: 70px;
            min-width: 38px;
        }
        .skip-intervals {
            margin: 6px;
        }

        html.theme-dark .button {
            color: var(--tv-color-toolbar-button-text, #dbdbdb);
            border-color: #fff;
        }
        .button.isInteractive {
            position: relative;
            z-index: 0;
        }
        .controls-button {
            height: 38px;
            justify-content: center;
            width: 38px;
        }
        .button {
            all: unset;
            align-items: center;
            box-sizing: border-box;
            cursor: default;
            display: flex;
            height: 100%;
            transition: background-color 60ms ease, opacity 60ms ease, color 60ms ease;
            --tv-toolbar-explicit-hover-border-radius: 4px;
            color: var(--tv-color-toolbar-button-text, #0f0f0f);
            border-color: #0f0f0f;
        }
        html.theme-dark .separator {
            background-color: var(--tv-color-toolbar-divider-background, #4a4a4a);
        }
        .separator {
            background-color: var(--tv-color-toolbar-divider-background, #ebebeb);
            display: inline-block;
            height: calc(100% - 16px);
            margin: 8px 4px;
            width: 1px;
        }
        div[role="dialog"][data-name="source-properties-editor"][data-dialog-name] {
            overflow-y: auto;
        }
        .testingview-positions-table input[type="number"]::-webkit-outer-spin-button,
        .testingview-positions-table input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        .testingview-positions-table input[type="number"] {
            -moz-appearance: textfield;
            text-align: right;
        }
        
        .testingview-positions-table input, .testingview-positions-table textarea {
            border: none;
            width: 100%;
            resize: none;
            outline: none;
            height: 100%;
            padding: 0;
            margin: 0;
        }

        .default {
            --ui-lib-icon-qi-default-color: #b8b8b8;
            --ui-lib-icon-qi-default-color-hover: #707070;
            --ui-lib-icon-qi-default-color-active: #4a4a4a;
        }
        html.theme-dark .default {
            --ui-lib-icon-qi-default-color-active: #b8b8b8;
            --ui-lib-icon-qi-default-color-hover: #8c8c8c;
            --ui-lib-icon-qi-default-color: #575757;
        }
        .iconWrapper {
            --ui-lib-size-defaulted: var(--ui-lib-size, 3);
            --ui-lib-size-defaulted-small: calc(max(0, 1 - (var(--ui-lib-size-defaulted) - 3) * (var(--ui-lib-size-defaulted) - 3)));
            --ui-lib-size-defaulted-medium: calc(max(0, 1 - (var(--ui-lib-size-defaulted) - 4) * (var(--ui-lib-size-defaulted) - 4)));
            --ui-lib-size-defaulted-large: calc(max(0, 1 - (var(--ui-lib-size-defaulted) - 5) * (var(--ui-lib-size-defaulted) - 5)));
            background: #0000;
            border: 0;
            box-shadow: none;
            color: var(--ui-lib-icon-qi-color, var(--ui-lib-icon-qi-default-color));
            display: inline-block;
            padding: 0;
            vertical-align: middle;
            --ui-lib-icon-question-information-size: calc(var(--ui-lib-size-defaulted-small)*18px + var(--ui-lib-size-defaulted-medium)*28px + var(--ui-lib-size-defaulted-large)*44px);
            height: var(--ui-lib-icon-question-information-size);
            line-height: var(--ui-lib-icon-question-information-size);
            min-width: var(--ui-lib-icon-question-information-size);
            outline: none;
            overflow: visible;
            position: relative;
            width: var(--ui-lib-icon-question-information-size);
        }
        @media (hover: hover) and (pointer: fine) {
            @media (any-hover: hover) {
                .icon-wrapper:hover {
                    color: var(--ui-lib-icon-qi-color-hover, var(--ui-lib-icon-qi-default-color-hover));
                }
            }
        }
        @media (any-hover: hover) {
            .icon-wrapper:hover {
                color: var(--ui-lib-icon-qi-color, var(--ui-lib-icon-qi-default-color));
            }
        }
        @media (any-hover: hover) {
            .iconWrapper:hover {
                color: var(--ui-lib-icon-qi-color-hover, var(--ui-lib-icon-qi-default-color-hover));
            }
        }
        .wrapper {
            height: 100%;
            position: relative;
            width: 100%;
            display: flex;
            flex-direction: column;
        }
        html.theme-dark .root{
            background-color: var(--report-table-background, #0f0f0f);
        }
        .table {
            --report-table-cell-height: 98px;
        }
        .root {
            background-color: var(--report-table-background, #fff);
            height: 100%;
            overflow: visible;
        }
        .tableWrapper {
            overflow-y: auto;
            width: auto;
        }
        html.theme-dark .headCell {
            background-color: var(--report-table-background, #0f0f0f);
            border-bottom: 1px solid var(--report-table-header-border, #4a4a4a);
            color: #8c8c8c;
        }
        .headCell:first-child {
            padding-left: 20px;
            text-align: left;
        }
        .root .ka-pointer {
            cursor: default;
        }
        .fitContent {
            width: 0;
        }
        .headCell {
            background-color: var(--report-table-background, #fff);
            border-bottom: 1px solid var(--report-table-header-border, #ebebeb);
            color: #707070;
            font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif;
            font-feature-settings: "tnum" on, "lnum" on;
            font-style: normal;
            height: 49px;
            padding: 0 12px;
            text-align: right;
            white-space: nowrap;
            z-index: 1;
            --ui-lib-typography-font-size: 14px;
            font-size: var(--ui-lib-typography-font-size);
            font-weight: 400;
            --ui-lib-typography-line-height: 18px;
            line-height: var(--ui-lib-typography-line-height);
        }
        .leftAlign {
            text-align: left !important;
        }
        .rightAlign {
            text-align: right !important;
        }
        .centerAlign {
            text-align: center !important;
        }
        html.theme-dark .row {
            border-bottom: 1px solid var(--report-table-border, #2e2e2e);
        }
        .row {
            border-bottom: 1px solid var(--report-table-border, #f2f2f2);
            border-top: none;
        }
        @media (any-hover: hover) {
            html.theme-dark .row:hover {
                background-color: rgb(46, 46, 46);
            }
            .row:hover {
                background-color: rgb(225, 225, 225);
            }
        }
        html.theme-dark .row.selected {
            background-color: rgb(26, 29, 53);
        }
        .row.selected {
            background-color: rgb(216, 219, 249);
        }
        html.theme-dark .cell {
            color: #dbdbdb;
        }
        .row td:first-child {
            text-align: left;
        }
        .cell:first-child {
            padding-left: 20px;
        }
        .row td {
            text-align: right;
        }
        .justifyStart {
            justify-content: flex-start;
        }
        .justifyEnd{
            justify-content: flex-end;
        }
        .noPadding {
            padding: 0 !important
        }
        .ka-thead-cell-wrapper {
            cursor: pointer;
        }
        .cell {
            color: #0f0f0f;
            font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif;
            font-feature-settings: "tnum" on, "lnum" on;
            font-style: normal;
            height: var(--report-table-cell-height, 49px);
            padding: 0 12px;
            -webkit-user-select: text;
            user-select: text;
            --ui-lib-typography-font-size: 14px;
            font-size: var(--ui-lib-typography-font-size);
            font-weight: 400;
            --ui-lib-typography-line-height: 18px;
            line-height: var(--ui-lib-typography-line-height);
            max-width: 240px;
        }
        .doubleCell {
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: inherit;
        }
        .doubleCell .cell:first-child {
            position: relative;
        }
        .doubleCell .cell {
            align-items: center;
            display: flex;
            height: 100%;
            justify-content: inherit;
            padding: 0 12px;
            -webkit-user-select: none;
            user-select: none;
            white-space: nowrap;
            max-width: unset;
        }
        .date-cell {
            cursor: pointer;
        }
        html.theme-dark .doubleCell .cell:first-child:after {
            border-bottom: 1px solid #4a4a4a;
        }
        .doubleCell .cell:first-child:after {
            border-bottom: 1px solid #ebebeb;
            bottom: 0;
            content: "";
            display: block;
            margin: 0 -12px;
            position: absolute;
            width: 100%;
        }
        .cell .V_VALUE {
            white-space: pre-wrap;
        }
        .square {
            border-radius: 4px;
        }
        .iconButton {
            align-items: center;
            background: none;
            border: none;
            display: flex;
            height: 22px;
            justify-content: center;
            outline: none;
            overflow: visible;
            padding: 0;
            position: relative;
            width: 22px;
        }
        html.theme-dark .primary .icon {
            color: var(--ui-lib-iconButton-icon-color-default, #8c8c8c);
        }
        .primary .icon {
            color: var(--ui-lib-iconButton-icon-color-default, #707070);
        }
        .blockIcon, .blockIcon svg {
            display: block;
        }
        html.theme-dark .openTrade {
            color: #8c8c8c;
        }
        .openTrade {
            color: #707070;
        }
        .twoRows {
            align-items: flex-end !important;
            flex-flow: column wrap !important;
        }
        .tableCell {
            align-items: baseline;
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            justify-content: flex-end;
        }
        .currencyWrapper {
            align-items: baseline;
            display: flex;
            gap: 3px;
        }
        .value {
            white-space: nowrap;
        }
        .currency {
            font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif;
            font-feature-settings: "tnum" on, "lnum" on;
            white-space: nowrap;
            --ui-lib-typography-line-height: 14px;
            line-height: var(--ui-lib-typography-line-height);
            --ui-lib-typography-font-size: 10px;
            font-size: var(--ui-lib-typography-font-size);
            font-style: normal;
            font-weight: 500;
        }
        .small {
            font-size: 12px !important;
            --ui-lib-size: 3;
        }
        .percentValue {
            font-size: var(--data-cell-percent-font-size, 14px);
            white-space: nowrap;
        }
        .percentValue div {
            display: inline-block;
        }
        .V_INDEX.openTrade {
            display: none;
        }

        .action-buttons {
            display: none;
        }
        .action-buttons .button {
            margin: 16px;
            cursor: pointer;
        }
        .action-buttons.openTrade {
            display: block;
        }

        .snapshot-action-buttons div {
            display: inline-block;
            margin-top: auto;
            margin-bottom: auto;
            vertical-align: middle;
            cursor: pointer;
        }
        .snapshot-action-buttons div svg {
            vertical-align: middle;
        }
        .snapshot-action-buttons div:hover {
            color: orange !important;
        }
        .view-snapshots-button[data-snapshots="0"] {
            display: none;
        }
        .snapshot-viewer {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: calc(100% - 60px);
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            text-align: center;
            color: white;
            padding-top: 60px;
            backdrop-filter: blur(20px);
            overflow-y: auto;
        }
        .snapshot-viewer-image-container {
            width: 100%;
            text-align: center;
            display: block;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Cpath fill='white' d='M13.88 3.88a1.88 1.88 0 1 1-3.76 0 1.88 1.88 0 0 1 3.76 0ZM12 18.24A1.88 1.88 0 1 0 12 22a1.88 1.88 0 0 0 0-3.75Zm8.13-8.13a1.88 1.88 0 1 0 0 3.76 1.88 1.88 0 0 0 0-3.76ZM5.74 12A1.88 1.88 0 1 0 2 12a1.88 1.88 0 0 0 3.75 0Zm.5 3.87a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75Zm11.5 0a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75ZM6.25 4.38a1.87 1.87 0 1 0 0 3.75 1.87 1.87 0 0 0 0-3.75Z'/%3E%3C/svg%3E");
            color: white;
            background-repeat: no-repeat;
            background-size: 150px;
            min-height: 150px;
            background-position: center;
        }
        .snapshot-viewer-image-container img {
            max-width: calc(100% - 70px);
            max-height: calc(100% - 70px);
            border: 1px solid white;
        }
        .snapshot-viewer-info {
            display: inline-block;
            margin: 5px;
            font-size: 1.3em;
            line-height: 1.5em;
        }
        .snapshot-viewer-url {
            color: #c2ffeb;
            font-size: 0.8em;
        }
        .snapshot-viewer-time {
            color:rgba(194, 255, 235, 0.72);
            font-size: 0.8em;
        }
        .snapshot-viewer-button {
            cursor: pointer !important;
            padding: 10px;
            margin: 10px;
            color: white !important;
        }
        .snapshot-viewer-close-button {
            float: right;
        }
        .snapshot-viewer-nav-button.snapshot-viewer-prev {
            float: left;
            height: 45px;
        }
        .snapshot-viewer-nav-button.snapshot-viewer-next {
            float: right;
            height: 45px;
        }
        .snapshot-viewer-delete-button {
            float: left;
        }

        .testingview-session-balance, .testingview-session-analysis-timer {
            white-space: nowrap;
            display: flex;
            align-items: center;
            box-sizing: border-box;
        }
        .testingview-session-balance div {
            margin-left: 20px;
            margin-right: 20px;
        }
        .testingview-session-balance-equity {
            display: none;
        }

        .testingview-prompt-dialog {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .testingview-prompt-dialog-content {
            padding: 20px;
            background: #131314;
            color: white;
            border: 2px solid white;
            border-radius: 6px;
            text-align: left;
        }
        .testingview-prompt-dialog-content h3 {
            margin-bottom: 16px;
        }
        .testingview-prompt-dialog-content input {
            border: 1px solid #6f6f6f;
            margin-bottom: 5px;
            width: 100%;
            text-align: left;
            padding-top: 3px;
            padding-bottom: 3px;
            background-color: #242425;
            color: white;
        }
        .testingview-prompt-dialog-content div {
            display: block;
            width: 100%;
            text-align: right;
        }
        .testingview-prompt-dialog-content button {
            margin-left: 5px;
            color: initial;
        }
        
        .testingview-dialog-section-title {
            margin-bottom: 15px;
            grid-column: 1 / 3;
        }
        .testingview-dialog-section-title + * {
            margin-bottom: 30px;
        }
        .testingview-dialog-options-section {
            line-height: 2em;
            grid-column: 1 / -1;
        }
        .testingview-dialog-options-section .iconWrapper {
            float: right;
        }
        .testingview-dialog-table {
            grid-column: 1 / 3;
        }
        .testingview-dialog-table tr {
            height: 34px;
        }
        .testingview-dialog-table td.testingview-actions {
            text-align: center;
            padding: 5px;
        }
        .testingview-dialog-table td button[disabled] {
            opacity: 0.3;
        }
        .testingview-dialog-table td.column-drag {
            text-align: left;
        }

        .testingview-dialog-section-sessions .intro {
            display: block;
            max-width: 410px;
        }
        .testingview-dialog-section-sessions .testingview-loader {
            display: block;
            margin: 20px;
            margin-left: auto;
            margin-right: auto;
        }
        .testingview-dialog-section-plan {
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .testingview-sessions-table {
            margin-bottom: 10px;
            margin-top: 20px;
        }
        .testingview-sessions-table tr[data-session-id].selected-session {
            background-color: #0000ff1f;
        }
        .testingview-sessions-table tr[data-session-id='new']{
            background-color: #6b8e2321;
        }
        .testingview-sessions-table tr[data-session-id]>td {
            padding: 15px;
        }
        .testingview-sessions-table td,
        .testingview-sessions-table th {
            border: 1px solid #4a4a4a7a;
        }
        .testingview-sessions-table tr[data-session-id] table td {
            border: none;
            text-align: right;
        }
        .testingview-sessions-table tr[data-session-id] table tr td:first-child {
            width: 100px;
            text-align: left;
        }
        .testingview-sessions-table tr[data-session-id] td input, .testingview-sessions-table tr[data-session-id] td select {
            text-align: right;
            padding: 0;
            margin: 0;
            width: 100%;
        }
        .testingview-sessions-table tr[data-session-id] td select::-ms-expand {
            display: none;
        }
        .testingview-sessions-table tr[data-session-id] td.session-name input {
            float: right;
        }
        .testingview-sessions-table input[type="number"]::-webkit-outer-spin-button,
        .testingview-sessions-table input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        .testingview-sessions-table input[type="number"] {
            display: inline-block;
            -moz-appearance: textfield;
            padding: 0;
            margin: 0;
        }
        .testingview-sessions-table tr table td.session-stats-info {
            font-size: 0.8em;
            opacity: 0.8;
            font-style: italic;
        }
        .testingview-sessions-table .testingview-actions button {
            margin: 4px;
        }
        .testingview-sessions-table td.session-capital table {
            width: 100%;
        }
        .testingview-sessions-table td.session-capital td.session-capital-currency {
            width: 66px;
        }
        .testingview-column-settings-table td.column-enable {
            text-align: center;
            width: 25px;
        }
        .testingview-column-settings-table td.column-name {
            text-align: left;
            padding-right: 16px;
        }
        .testingview-column-settings-table td.column-type {
            text-align: right;
        }
        .testingview-column-settings-add-new-column-container {
            margin-top: 10px;
            grid-column: 1 / 3;
        }
        .testingview-dialog-section.predefined-times {
            grid-column: 1 / -1;
            display: grid;
        }
        .testingview-dialog-section.predefined-times .testingview-dialog-table {
            margin-top: 5px;
        }
        .testingview-dialog-options-section-custom-date {
            grid-column: 1 / -1;
        }
        .testingview-dialog-options-section hr,
        .testingview-dialog-options-section-custom-date hr {
            margin-top: 20px;
            margin-bottom: 20px;
            opacity: 0.2;
        }
        .testingview-dialog-options-section-custom-date .testingview-dialog-table {
            margin-top: 5px;
        }
        .testingview-dialog-options-section-custom-date .testingview-dialog-section {
            display: grid
        }
        .discord-cta {
            max-width: 300px;
        }
        @media not (pointer: coarse) {
            @media (any-hover: hover) {
                html.theme-dark .secondary:hover {
                    --ui-lib-light-button-default-color-border: #2e2e2e;
                    --ui-lib-light-button-default-color-content: #fff;
                    --ui-lib-light-button-default-color-bg: #4b4b4b;
                }
            }
            html.theme-dark .secondary.active, html.theme-dark .secondary.disableActiveOnTouch:not(.disableActiveStateStyles):not(:disabled):active, html.theme-dark .secondary:not(.disableActiveOnTouch):not(.disableActiveStateStyles):not(:disabled):active {
                --ui-lib-light-button-default-color-border: #3d3d3d;
                --ui-lib-light-button-default-color-content: #fff;
                --ui-lib-light-button-default-color-bg: #3d3d3d;
            }
            .secondary.active, .secondary.disableActiveOnTouch:not(.disableActiveStateStyles):not(:disabled):active, .secondary:not(.disableActiveOnTouch):not(.disableActiveStateStyles):not(:disabled):active {
                --ui-lib-light-button-default-color-bg: #ebebeb;
                --ui-lib-light-button-default-color-content: #0f0f0f;
                --ui-lib-light-button-default-color-border: #ebebeb;
            }
        }
        html.theme-dark .secondary {
            --ui-lib-light-button-default-color-border: #4a4a4a;
            --ui-lib-light-button-default-color-content: #dbdbdb;
            --ui-lib-light-button-default-color-bg: #0000;
        }
        .secondary:hover {
            --ui-lib-light-button-default-color-bg: #000000c2;
            --ui-lib-light-button-default-color-content: #ffffff;
            --ui-lib-light-button-default-color-border: #3d3d3d;
        }
        .secondary {
            --ui-lib-light-button-default-color-bg: #0000;
            --ui-lib-light-button-default-color-content: #0f0f0f;
            --ui-lib-light-button-default-color-border: #575757;
        }
        .lightButton.typography-regular14px, .lightButton.typography-semibold14px {
            font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif;
            --ui-lib-typography-font-size: 14px;
            --ui-lib-typography-line-height: 18px;
            line-height: var(--ui-lib-typography-line-height);
        }
        .lightButton.typography-regular14px {
            font-feature-settings: "tnum" on, "lnum" on;
            font-size: var(--ui-lib-typography-font-size);
            font-style: normal;
            font-weight: 400;
        }
        .xsmall {
            border-radius: 6px;
            height: 28px;
            min-width: 28px;
            padding-block-end: 0;
            padding-block-start: 0;
            padding-inline-end: 11px;
            padding-inline-start: 11px;
        }
        .lightButton {
            align-items: center;
            background-color: var(--ui-lib-light-button-color-bg, var(--ui-lib-light-button-default-color-bg));
            border-color: var(--ui-lib-light-button-color-border, var(--ui-lib-light-button-default-color-border));
            border-style: solid;
            border-width: 1px;
            box-sizing: border-box;
            color: var(--ui-lib-light-button-color-content, var(--ui-lib-light-button-default-color-content));
            cursor: default;
            display: inline-flex;
            justify-content: center;
            max-width: 100%;
            min-width: 40px;
            outline: none;
            overflow: visible;
            position: relative;
        }
        .xsmall .content {
            padding-bottom: calc((28px - var(--ui-lib-typography-line-height)) / 2 - 1px);
            padding-top: calc((28px - var(--ui-lib-typography-line-height)) / 2 - 1px);
        }
        .nowrap {
            align-self: auto;
            overflow: hidden;
            white-space: nowrap;
        }
        .content {
            display: inline-block;
            min-width: 0;
            text-align: center;
            --ui-lib-lightbutton-show-children-with-fallback: var(--ui-lib-lightButton-show-children, 1);
            max-width: calc(max(0, 1 -(var(--ui-lib-lightbutton-show-children-with-fallback) - 1)*(var(--ui-lib-lightbutton-show-children-with-fallback) - 1))* 9999px + max(0, 1 -(var(--ui-lib-lightbutton-show-children-with-fallback) - 0)*(var(--ui-lib-lightbutton-show-children-with-fallback) - 0))* 0px);
        }
        .ellipsisContainer {
            display: inherit;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .input {
            padding: 0 calc(8px - var(--ui-lib-control-border-width, 2px) - var(--ui-lib-control-inner-slot-gap, 2px));
        }
        input.size-small {
            background-color: rgba(255, 255, 255, 0.2);
        }
        input.size-small:read-only {
            background-color: rgba(255, 255, 255, 0.1);
        }
        html.theme-dark input.size-small {
            background-color: rgba(0, 0, 0, 0.2);
        }
        html.theme-dark input.size-small:read-only {
            background-color: rgba(0, 0, 0, 0.1);
        }
        .input.size-small {
            border: 1px solid #4a4a4a00;
            -webkit-appearance: auto;
            appearance: textfield;
            display: block;
            height: 100%;
            margin: 0;
            min-width: 0;
            outline: 0;
            width: 100%;
            -webkit-text-fill-color: var(--ui-lib-control-text-fill-color, currentColor);
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            order: 0;
        }
        .input.size-small:hover, .input.size-small:active, .input.size-small:focus  {
            border: 1px solid #4a4a4aa3;
        }
        .input.size-small:read-only {
            border: none !important;
        }
        .input.normal {
            border: 1px solid #4a4a4a;
            height: 2em;
            display: unset;
            width: unset;
        }
        #header-toolbar-testingview {
            all: unset;
            align-items: center;
            box-sizing: border-box;
            cursor: default;
            display: flex;
            height: 100%;
            transition: background-color 60ms ease, opacity 60ms ease, color 60ms ease;
            --tv-toolbar-explicit-hover-border-radius: 4px;
            color: var(--tv-color-toolbar-button-text, #0f0f0f);
            padding: 0 10px 0 5px;
            position: relative;
            z-index: 0;
        }
        html.theme-dark #header-toolbar-testingview {
            color: var(--tv-color-toolbar-button-text,#dbdbdb);
        }
        html.theme-dark .button.isInteractive.isActive {
            color: var(--tv-color-toolbar-button-text-active, #2962ff) !important;
        }
        .button.isInteractive.isActive {
            color: var(--tv-color-toolbar-button-text-active, #2962ff) !important;
        }
        #header-toolbar-testingview .js-button-text {
            margin-left: 5px;
        }
    `)
        .appendTo("head");
}

L.createToolbarButton = function () {
    const TestingViewButton = $(`
        <button aria-label="TestingView" id="header-toolbar-testingview" aria-pressed="false" tabindex="-1" type="button" class="button withText apply-common-tooltip isInteractive accessible">
            <span role="img" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 120 120" width="24" height="24">
                <polygon points="10,10 10,90 100,50" stroke="white" stroke-width="2" fill="black"></polygon>
                <rect x="22" y="25" width="8" height="50" rx="2" ry="2" fill="white"></rect>
                <rect x="40" y="35" width="8" height="33" rx="2" ry="2" fill="white"></rect>
                <rect x="57" y="20" width="9" height="40" rx="2" ry="2" fill="white" stroke="black" stroke-width="1"></rect>
              </svg>
            </span>
            <div class="js-button-text text TestingView-button">TestingView</div>
        </button>
    `);

    if (!$("#header-toolbar-testingview").length) {
        $("button#header-toolbar-replay").parents("div[class*='group']").append(TestingViewButton);
        L.TestingViewButton = TestingViewButton;

        TestingViewButton.on("click", () => {
            if (TestingViewButton.attr("aria-pressed") === "true") {
                L.exit(false, true);
            } else {
                L.showSessions();
            }
        });
    }
}

L.createReplayControls = function () {
    if (!L.lastReplayControlsCheck || (Date.now() - L.session.meta.lastReplayControlsCheck) > 1000) {
        L.lastReplayControlsCheck = Date.now();

        const replayToolbar = $("div[class*='replayToolbar-']");
        if (replayToolbar.length === 0) {
            console.warn("Replay Toolbar not found!");
            return null;
        }

        const controlsPanels = replayToolbar.find("div[class*='controlsPanel-']");
        if (controlsPanels.length === 0) {
            console.warn("Controls Panel not found!");
            return null;
        }

        const controlsContainers = controlsPanels.find("div[class*='controls-']");
        if (controlsContainers.length === 0) {
            console.warn("Controls container not found!");
            return null;
        }

        replayToolbar.parent().parent().hide();
    }

    const toolbarContainer = $("div.chart-toolbar.chart-controls-bar div[class*='dateRangeExpanded']");
    if (toolbarContainer.length === 0) {
        console.warn("Toolbar container not found!");
        return null;
    }

    if ($(".backtesting-replay-controls").length == 0) {
        toolbarContainer.parent().parent().removeAttr("data-mouse-click-auto-blur");
        toolbarContainer.children().hide();
        const replayControls = $(`
            <div class="backtesting-replay-controls controls">
                <div class="drag-handle">
                    <svg width="20" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="5" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="6" cy="19" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle><circle cx="18" cy="5" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle><circle cx="18" cy="19" r="1.5"></circle></svg>
                </div>
                <div class="controls-control">
                    <div class="controls-button button apply-common-tooltip isInteractive play-pause-button play" title="Play&#013;Shift + ⇩" data-role="button">
                        <span role="img" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
                            <path fill="currentColor" fill-rule="evenodd" d="m10.997 6.93 7.834 6.628a.58.58 0 0 1 0 .88l-7.834 6.627c-.359.303-.897.04-.897-.44V7.37c0-.48.538-.743.897-.44Zm8.53 5.749a1.741 1.741 0 0 1 0 2.637l-7.834 6.628c-1.076.91-2.692.119-2.692-1.319V7.37c0-1.438 1.616-2.23 2.692-1.319l7.834 6.628Z"></path>
                            </svg>
                        </span>
                    </div>
                    <div class="controls-button button apply-common-tooltip isInteractive play-pause-button pause" title="Pause&#013;Shift + ⇩" data-role="button" style="display:none">
                        <span role="img" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
                            <path fill="currentColor" fill-rule="evenodd" d="M10 6h2v16h-2V6ZM9 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V6Zm7 0h2v16h-2V6Zm-1 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V6Z"></path>
                            </svg>
                        </span>
                    </div>
                </div>
                <div class="controls-separator"><span class="separator"></span></div>
                <div class="controls-control controls-control-type-forward">
                    <div data-role="button" class="controls-button button apply-common-tooltip isInteractive forward-button">
                        <span role="img" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
                            <path fill="currentColor" fill-rule="evenodd" d="M20 6v16h1V6h-1Zm-3.908 7.628L9.834 7.996A.5.5 0 0 0 9 8.368v11.264a.5.5 0 0 0 .834.372l6.258-5.632a.5.5 0 0 0 0-.744Zm.67 1.487a1.5 1.5 0 0 0 0-2.23l-6.259-5.632C9.538 6.384 8 7.07 8 8.368v11.264c0 1.299 1.538 1.984 2.503 1.115l6.258-5.632Z"></path>
                            </svg>
                        </span>
                    </div>
                </div>
                <div class="controls-control controls-control-type-forward">
                    <div title="Fast forward&#013;Ctrl + Shift + ⇨" data-role="button" class="controls-button button apply-common-tooltip isInteractive fast-forward-button">
                        <span role="img" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 28" width="36" height="28">
                                <path fill="currentColor" fill-rule="evenodd" d="M8 6.93l7.834 6.628a.58.58 0 0 1 0 .88L8 21.065c-.359.303-.897.04-.897-.44V7.37c0-.48.538-.743.897-.44Zm8.53 5.749a1.741 1.741 0 0 1 0 2.637L8.696 21.944c-1.076.91-2.692.119-2.692-1.319V7.37c0-1.438 1.616-2.23 2.692-1.319l7.834 6.628Z"></path>
                                <path fill="currentColor" fill-rule="evenodd" d="M18 6.93l7.834 6.628a.58.58 0 0 1 0 .88L18 21.065c-.359.303-.897.04-.897-.44V7.37c0-.48.538-.743.897-.44Zm8.53 5.749a1.741 1.741 0 0 1 0 2.637L18.696 21.944c-1.076.91-2.692.119-2.692-1.319V7.37c0-1.438 1.616-2.23 2.692-1.319l7.834 6.628Z"></path>
                            </svg>
                        </span>
                    </div>
                </div>
                <select class="skip-intervals input normal" title="Fast forward interval">
                </select>
                <div class="controls-control controls-control-type-goto-date">
                    <div title="Go to date/time" data-role="button" class="controls-button button apply-common-tooltip isInteractive goto-date-button">
                        <span role="img" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18.06a8.06 8.06 0 1 1 0-16.12 8.06 8.06 0 0 1 0 16.12Zm2.5-4.2-3.43-2.5a.49.49 0 0 1-.2-.38V6.35c0-.26.22-.48.48-.48h1.3c.26 0 .48.22.48.48v5.72l2.7 1.96c.21.16.25.46.1.68l-.76 1.04a.49.49 0 0 1-.68.1Z"></path></svg>
                        </span>
                    </div>
                </div>
                <div class="controls-separator"><span class="separator"></span></div>
                <div class="testingview-session-balance">
                    <div class="testingview-session-balance-balance">
                        <span class="testingview-session-balance-balance-label">Balance:</span>
                        <span class="testingview-session-balance-balance-value">${(L?.session?.meta?.balance || L?.session?.capital).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</span>
                        <span class="testingview-session-balance-balance-currency currency">${L.session.currencyId}</span>
                    </div>
                    <div class="testingview-session-balance-equity">
                        <span class="testingview-session-balance-equity-label">Equity:</span>
                        <span class="testingview-session-balance-equity-value">${L?.session?.meta?.equity?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}</span>
                        <span class="testingview-session-balance-equity-currency currency">${L.session.currencyId}</span>
                    </div>
                </div>
                <div class="controls-separator"><span class="separator"></span></div>
                <div class="controls-control controls-control-type-settings">
                    <div data-role="button" class="controls-button button apply-common-tooltip isInteractive testingview-stats-button" aria-label="${L.getStatsSummary()}" data-tooltip="${L.getStatsSummary()}">
                        <span role="img" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15 14.5h1.5c.25 0 .5-.25.5-.5V8.75c0-.25-.25-.5-.5-.5H15c-.25 0-.5.25-.5.5V14c0 .25.25.5.5.5Zm3.75 0h1.5c.25 0 .5-.25.5-.5V5c0-.25-.25-.5-.5-.5h-1.5c-.25 0-.5.25-.5.5v9c0 .25.25.5.5.5Zm-11.25 0H9c.25 0 .5-.25.5-.5v-2.75c0-.25-.25-.5-.5-.5H7.5c-.25 0-.5.25-.5.5V14c0 .25.25.5.5.5Zm3.75 0h1.5c.25 0 .5-.25.5-.5V6.25c0-.25-.25-.5-.5-.5h-1.5c-.25 0-.5.25-.5.5V14c0 .25.25.5.5.5ZM21.38 17H4.5V5.12a.62.62 0 0 0-.63-.62H2.63a.62.62 0 0 0-.62.63v13.12c0 .69.56 1.25 1.25 1.25h18.13c.34 0 .62-.28.62-.63v-1.25a.62.62 0 0 0-.63-.62Z"></path></svg>
                        </span>
                    </div>
                </div>
                <div class="controls-control controls-control-type-settings">
                    <div title="TestingView Settings" data-role="button" class="controls-button button apply-common-tooltip isInteractive testingview-settings-button">
                        <span role="img" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path fill="currentColor" d="m21.3 10.67-2.33-1.58.53-2.78a1.59 1.59 0 0 0-1.85-1.85l-2.77.53-1.57-2.34c-.6-.87-2.03-.87-2.62 0L9.11 5l-2.76-.53A1.58 1.58 0 0 0 4.5 6.32l.53 2.77-2.33 1.58a1.58 1.58 0 0 0 0 2.62l2.33 1.58-.53 2.77a1.58 1.58 0 0 0 1.85 1.86l2.76-.54 1.58 2.34a1.58 1.58 0 0 0 2.62 0l1.57-2.34 2.77.54c.53.1 1.05-.06 1.42-.43.37-.38.53-.9.43-1.42l-.53-2.78 2.33-1.58a1.58 1.58 0 0 0 0-2.62ZM16.9 14l.68 3.56-3.55-.68-2.03 3-2.03-3-3.55.68.69-3.56-3-2.03 3-2.03-.69-3.57 3.56.7 2.02-3 2.03 3 3.55-.7-.69 3.57 3 2.03-3 2.03ZM12 7.94a4.07 4.07 0 1 0 .01 8.14A4.07 4.07 0 0 0 12 7.94Zm0 6.25a2.19 2.19 0 1 1 0-4.38 2.19 2.19 0 0 1 0 4.38Z"></path></svg>
                        </span>
                    </div>
                </div>
                <div class="controls-separator analysis-timer-separator"><span class="separator"></span></div>
                <div class="testingview-session-analysis-timer">Analysis time: ${((L?.session?.meta?.analysisTimes || []).slice(-1)[0]?.analysisTimespan || "00:00")}</div>
            </div>
        `);

        $(".skip-intervals", replayControls).on("change", function () {
            if (L.session?.meta) {
                L.session.meta.forceStopPlayback = false;
                L.session.meta.selectedResolution = $(this).val();
            }
        });

        $(".play-pause-button.play", replayControls).on("click", () => {
            L.session.meta.forceStopPlayback = false;
            L.startSkipping();
        });

        $(".play-pause-button.pause", replayControls).on("click", () => {
            L.stopSkipping();
            L.session.meta.forceStopPlayback = true;
        });

        $(".forward-button", replayControls).on("click", async () => {
            L.session.meta.forceStopPlayback = false;
            await L.skipTime(0, false, 0);
        });

        $(".fast-forward-button", replayControls).on("click", async () => {
            L.session.meta.forceStopPlayback = false;
            const selectedIntervalValue = Number($(".skip-intervals", replayControls).val());
            await L.skipTime(selectedIntervalValue, false, 0);
            L.sessionChannel.postMessage({type: "FAST-FORWARD", sessionId: L.session.sessionId, interval: selectedIntervalValue});
            $('.backtesting.deep-history .appended-info-box').remove();
            L._tests = new Array(4);
        });

        $(".goto-date-button", replayControls).on("click", () => {
            L.session.meta.forceStopPlayback = false;
            L.showGotoDateDialog();
        });

        if (L.session.getParameter(L.sessionParameterIds.AnalysisTimer) != 'true') {
            $(".analysis-timer-separator", replayControls).hide();
            $(".testingview-session-analysis-timer", replayControls).hide();
        }

        $(".testingview-session-analysis-timer", replayControls).on("click", () => {
            if (L.session.meta.analysisTimes && L.session.meta.analysisTimes.filter(at => at.analysisDuration > 5 && at.analysisStartTime < L.session.currentDate).length > 1) {
                L.showAnalysisTimesDialog();
            }
        });

        $(".drag-handle", replayControls).on("mousedown", (e) => {
            const controls = $(".backtesting-replay-controls");
            controls.attr("isDragging", 1);
            controls.attr("startX", e.clientX);
            controls.attr("startLeft", $(".backtesting-replay-controls").offset().left);
            $(".drag-handle").css("cursor", "grabbing");
            e.preventDefault();
        });

        $(".testingview-settings-button", replayControls).on("click", () => {
            L.session.meta.forceStopPlayback = false;
            L.showSettings();
        });

        $(".testingview-stats-button", replayControls).on("click", () => {
            L.exportStats();
        });

        toolbarContainer.append(replayControls);
        L.reflectReplayResolutions();
        
        const parentWidth = $(".chart-controls-bar").outerWidth();
        const childWidth = replayControls.outerWidth();
        const leftOffset = (parentWidth - childWidth) / 2;
        
        replayControls.css("left", leftOffset + "px");

        L.updateSessionCapitalInfo();
    }
}

L.createUI = function () {
    const replayTradingButton = $("button[data-name='replay_trading']");
    replayTradingButton.text("TestingView");

    L.createReplayControls();
    L.createPositionsListHeader();
    
    if(!L.session.meta.analysisTimes){
        L.session.meta.analysisTimes = [];
    }

    setInterval(() => {
        if(L.session.getParameter(L.sessionParameterIds.AnalysisTimer) == 'true') {
            var analysisTime = L.session.meta.analysisTimes.find(at => at.analysisStartTime == L.session.currentDate);
            if(!analysisTime) {
                analysisTime = {
                    analysisDuration: 0,
                    analysisTimespan: "00:00",
                    analysisStartTime: L.session.currentDate
                };

                L.session.meta.analysisTimes.unshift(analysisTime);
            } else {
                L.session.meta.totalAnalysisTime = (L.session.meta.totalAnalysisTime || 0) + 1;
                if(L.session.meta.totalAnalysisTime > 3600) {
                    L.session.meta.totalAnalysisTime = 0;
                    L.messageBox("Overtrading", "You have been analyzing for over 1 hour. Please consider a break to avoid overtrading.");
                }
                analysisTime.analysisDuration += 1;
                analysisTime.analysisTimespan = L.formatTimestamp(analysisTime.analysisDuration);
            }

            $(".testingview-session-analysis-timer").text("Analysis time: " + (analysisTime.analysisTimespan || "00:00"));
        } 
    }, 1000);

    TradingViewApi.onActiveChartChanged().subscribe(null, () => {
        setTimeout(() => {
            L.createReplayTimestampUI();
            $("#TestingViewCurrentDate").text(L.toTradingViewDateTimeFormat(L.replayApi.currentDate().value(), window.TradingViewApi.activeChart().getTimezone()));
        }, 200);
    });
    
    TradingViewApi.onActiveChartChanged().fire();

    $(document).on("mousemove", (e) => {
        const controls = $(".backtesting-replay-controls");

        if (!controls.attr("isDragging")) return;

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

    $(document).on("mouseup", () => {
        const controls = $(".backtesting-replay-controls");
        if (controls.attr("isDragging")) {
            controls.removeAttr("isDragging");
            $(".drag-handle").css("cursor", "grab");
        }
    });

    $(document).on("keyup", async (event) => {
        if (!(event.shiftKey && event.ctrlKey)) return;
        if(L.isTyping()) {
            return;
        }

        if (event.key === "ArrowRight") {
            const intervalsDropdown = $(".backtesting-replay-controls .skip-intervals");
            const selectedIntervalValue = Number(intervalsDropdown.val());
            await L.skipTime(selectedIntervalValue, false, 0);
        }
    });

    $(document).on("keydown", async (event) => {
        if (event.key === " ") {
            if(L.isTyping()) {
                return;
            }
            
            event.preventDefault();
            event.stopPropagation();
            return false;
        }

        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'n') {
            event.preventDefault();
            
            // Generate entry shape charts to find position tools
            L.generateEntryShapeCharts();
            
            // Find last added position tool
            const shapeChartInfo = L.session.meta.entryShapeCharts
                .sort((a, b) => b.shapeInfo.timeAdded - a.shapeInfo.timeAdded)[0];
    
            if (shapeChartInfo) {
                const shape = L.getShapeById(shapeChartInfo.shapeInfo.id, shapeChartInfo.chart, true);
                if (shape) {
                    const shapePoints = shape.getPoints();
                    const shapeDataSourceProperties = shape.lineDataSource().properties();

                    var position = {
                        entryPrice: shapeDataSourceProperties.entryPrice.value(), entryTime: shapePoints[0].time
                    };

                    await L.openPosition(position, shapeChartInfo, shape);
                }
            } else {
                L.toast("No position tool found. Draw a long/short position first.", 3000, "warn");
            }
        }

        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
            event.preventDefault();
            
            if (L.session?.sessionId && L.session?.currentDate) {
                L.sessionChannel.postMessage({
                    type: 'DATE-SYNC',
                    sessionId: L.session.sessionId,
                    currentDate: L.session.currentDate
                });
            }
        }

        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'r') {
            event.preventDefault();
            
            const selectedPosition = $(".V_POSITION.selected");
            if (selectedPosition.length) {
                const positionId = selectedPosition.attr("id").split("_")[1];
                const position = L.session.positions.find(p => p.positionId == positionId);
                
                if (position) {
                    L.confirmBox("Delete position", "Are you sure you want to delete this position?", async (ok) => {
                        if (ok) {
                            // Remove from database
                            await L.dataOps.deletePosition(positionId);
                            
                            // Remove from session
                            L.session.positions = L.session.positions.filter(p => p.positionId !== positionId);
                            
                            // Remove from UI
                            selectedPosition.remove();
                            
                            // Remove shapes from chart
                            L.applyOnCharts(chart => {
                                const shapes = chart.getAllShapes();
                                for (const shapeInfo of shapes) {
                                    if (shapeInfo.positionId === positionId) {
                                        L.removeShapeById(shapeInfo.id, chart, true);
                                    }
                                }
                            });
                            
                            L.toast("Position deleted", 2000);
                        }
                    });
                }
            }
        }

        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === '!') {
            L._instance = 1;
        }
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === '@') {
            L._instance = 2;
        }
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === '#') {
            L._instance = 3;
        }
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === '$') {
            L._instance = 4;
        }

        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
            TradingViewApi.activeChart().removeAllStudies();
            
            L.sessionChannel.postMessage({type: "STUDIES-REQ", sessionId: L.session.sessionId, instance: 1});
            await L.delay(500);
            L.sessionChannel.postMessage({type: "STUDIES-REQ", sessionId: L.session.sessionId, instance: 2});
            await L.delay(500);
            L.sessionChannel.postMessage({type: "STUDIES-REQ", sessionId: L.session.sessionId, instance: 3});
            await L.delay(500);
            L.sessionChannel.postMessage({type: "STUDIES-REQ", sessionId: L.session.sessionId, instance: 4});
            await L.delay(500);
        }

        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'x') {
            
            const selectedIntervalValue = Number($(".skip-intervals").val());
            await L.skipTime(selectedIntervalValue, false, 0);
            $('.backtesting.deep-history .appended-info-box').remove();
            L._tests = new Array(4);

            var chart = TradingViewApi.activeChart();
            var stratStudies = chart.getAllStudies().filter(s => s.name == 'PAH Strat');

            var scores = "";
            for(var stratStudyInfo of stratStudies) {
                var stratStudy = chart.getStudyById(stratStudyInfo.id);
                var replayApi = await TradingViewApi.replayApi();
                var currentDate = replayApi.currentDate().value() * 1000; //UTC
                stratStudy.setInputValues([{id: "in_116", value: new Date(new Date(new Date(currentDate).setHours(9)).setMinutes(0)).setSeconds(0)}]); //tradingStartDate
                stratStudy.setInputValues([{id: "in_117", value: false}]); //dynamicDate
            }

            for(var stratStudyInfo of stratStudies) {
                var stratStudy = chart.getStudyById(stratStudyInfo.id);
               
                while(stratStudy.status().type != 2) {
                    await L.delay(300);
                }

                stratStudy.setVisible(false);
                await L.delay(1000);
                stratStudy.setVisible(true);
                await L.delay(1000);
                
                while(stratStudy.isLoading()) {
                    await L.delay(300);
                }

                try {
                    var pnl = parseFloat($(".backtesting.deep-history > div[class*=wrapper] > div[class*=wrapper] > div[class*=reportContainer] > div[class*=container] > div[class*=containerCell] > div[class*=container] > div[class*=Value]").map((i, e) => $(e).text().replace(/[,|%]/g, '').replace("−", "-"))[0]);
                    pnl = Math.floor(pnl / 100) * 100;
                    if(pnl) {
                        scores = `${scores}${pnl}\n`;
                    }
                } catch (e) {;}
            }

            navigator.clipboard.writeText(scores);
            L.toast("Scores copied to clipboard", 1000);
            TradingViewApi.activeChart().removeAllStudies();
        }
    });

    L.replayApi.isAutoplayStarted().subscribe((isAutoplayStarted) => {
        if(L.session.meta.forceStopPlayback) {
            $(".play-pause-button.play").show();
            $(".play-pause-button.pause").hide();
        }
        
        if (isAutoplayStarted || L.isSkippingCandles || L.session.meta.autoplayStarted) {
            $(".play-pause-button.play").hide();
            $(".play-pause-button.pause").show();
        } else {
            $(".play-pause-button.play").show();
            $(".play-pause-button.pause").hide();
        }
    })
}

L.startSession = async function (sessionId) {
    L.removeGeneratedShapes();
    
    $("button#header-toolbar-replay").hide();
    $("button#header-toolbar-replay").next("div[class*='wrapper']:has(div[class*='arrow'])").hide();

    $("button#header-toolbar-testingview").attr("aria-pressed", true);
    $("button#header-toolbar-testingview").addClass("isActive");
    $("head").append(`<style>div.chart-toolbar.chart-controls-bar button[data-name="time-zone-menu"] div.js-button-text {display:none}</style>`);

    L.session = {};

    L.session = await L.dataOps.getSession(sessionId);
    L.setSessionFunctions(L.session);

    L.session.positions = await L.dataOps.getSessionPositions(sessionId);

    Object.defineProperty(L.session, 'meta', { value: {}, writable: true, enumerable: false });
    L.session.meta.balance = await L.getBalanceAfterPositions(L.session.capital, L.session.positions);
    L.session.meta.sortByDesc = true;
    
    for (const position of L.session.positions) {
        for (const shape of position.positionShapes) {
            Object.defineProperty(shape, 'meta', { value: {}, writable: true, enumerable: false });
        }
    }

    L.monitorEntryShapes();

    const currentBarTime = L.getCharts()[0].chartModel().mainSeries().bars()._items.slice(-1)[0].value[0];

    const onReplayMode = async function () {
        while (!L.getCharts()[0].chartModel().mainSeries().bars()._items.slice(-1)[0] || L.getCharts()[0].chartModel().mainSeries().bars()._items.slice(-1)[0].value[0] == currentBarTime) {
            await L.delay(1000);
        }

        L.replayApi.isReplayStarted().unsubscribe(onReplayMode);

        const switchToMinReplayResolution = function (replayResolutions) {
            replayResolutions = replayResolutions.filter(r => r);
            if (replayResolutions.length > 0) {
                L.replayApi.changeReplayResolution(replayResolutions.find(r => L.resolutionToSeconds(r) >= 60) || replayResolutions[0]);
                L.replayApi.replayResolutions().unsubscribe(switchToMinReplayResolution);
            }
        };

        L.replayApi.replayResolutions().subscribe(switchToMinReplayResolution);

        L.createUI();
        L.asyncInterval(async () => {
            L.createReplayControls();
            L.createPositionsListHeader();

            const replayTradingButton = $("button[data-name='replay_trading']");
            replayTradingButton.attr("aria-label", replayTradingButton.attr("data-active") == "true" ? "Close TestingView" : "Open TestingView");
            replayTradingButton.attr("data-tooltip", replayTradingButton.attr("data-active") == "true" ? "Close TestingView" : "Open TestingView");
        }, 1000);

        L.replayApi.currentDate().subscribe((currentTime) => {
            if (!L.replayTo) {
                L.session.currentDate = currentTime;

                clearTimeout(L.session.meta.updateUsageTimeout);
                L.session.meta.updateUsageTimeout = setTimeout(() => {
                    L.session.lastUpdate = new Date();
                    L.dataOps.updateSession({ sessionId: L.session.sessionId, currentDate: L.session.currentDate, lastUpdate: L.session.lastUpdate });
                }, 1000);
            }
        });

        setInterval(() => {
            L.tryExec(() => { L.replayApi.changeAutoplayDelay(1000); }, true);
                
            setTimeout(() => {
                L.tryExec(() => { L.replayApi.changeAutoplayDelay(100); }, true);
            }, 1000);
        }, 10000);

        L.asyncInterval(async () => {
            if (!L.session.meta.autoplayDelayChangeDate) {
                L.session.meta.autoplayDelayChangeDate = new Date().getTime() / 1000;
            }

            const currentTime = new Date().getTime() / 1000;
            if (currentTime - L.session.meta.autoplayDelayChangeDate > 10) {
                L.session.meta.autoplayDelayChangeDate = currentTime;
                L.tryExec(() => {
                    L.replayApi.changeAutoplayDelay(1000);
                    setTimeout(() => {
                        L.replayApi.changeAutoplayDelay(100);
                    }, 2000);
                }, true);
            }
        }, 50);

        var previousBarInfo = {};
        var replayTimestampCounter = 5;

        async function checkBarActivity() {
            if(L.replayTo && L.replayApi.currentDate().value() > L.replayTo) {
                L.replayTo = null;
            }

            if(replayTimestampCounter <= 0) {
                setTimeout(() => {
                    L.createReplayTimestampUI();
                    $("#TestingViewCurrentDate").text(L.toTradingViewDateTimeFormat(L.replayApi.currentDate().value(), window.TradingViewApi.activeChart().getTimezone()));
                }, 200);
                replayTimestampCounter = 5;
            }

            replayTimestampCounter--;
        
            if (L.replayTo) {
                return;
            }

            if (L.changingSymbol) {
                return;
            }

            if (L.isWarmingUp) {
                return;
            }

            const currentBarInfo = L.getCurrentBarInfo();
            if (currentBarInfo) {
                if (currentBarInfo.time !== previousBarInfo.time || currentBarInfo.close !== previousBarInfo.close || currentBarInfo.high !== previousBarInfo.high || currentBarInfo.low !== previousBarInfo.low || currentBarInfo.open !== previousBarInfo.open) {
                    previousBarInfo = currentBarInfo;
                    await L.onBarActivity();
                }

                L.syncLinesWithPositions();
            }
        }

        L.asyncInterval(checkBarActivity, 10);

        for (const position of L.session.getActivePositions()) {
            const chartShapes = await L.drawShapeForPosition(position);
            const shape = chartShapes[0];
            if(shape) {
                position.meta.hasShapeRedraw = false;
                L.keepShapeInfoInSync(position, shape, shape.lineDataSource().properties());
            }
        }

        await L.selectResolution(0, 1000);

        L.sessionChannel = new BroadcastChannel(`testingview-session-${L.session.sessionId}`);
        L.sessionChannel.onmessage = async function(event) {
            const data = event.data;
            if (data.type === 'DATE-SYNC' && 
                data.sessionId === L.session?.sessionId && 
                data.currentDate > L.session.currentDate) {
                
                await L.selectDateWithWarmup(data.currentDate);
                setTimeout(() => {
                    L.testStrats();
                }, 2000);

            }

            if (data.type === 'FAST-FORWARD' && 
                data.sessionId === L.session?.sessionId) {
                    const selectedIntervalValue = Number($(".skip-intervals").val());
                    await L.skipTime(selectedIntervalValue, false, 0);
                }

            try {
                await L.extMessage(event);
            } catch(e) {;}
        };

        L.replayInitialized = true;
    };

    L.applyOnCharts(chart => {
        const chartModel = chart.chartModel();
        const chartWidget = chart.chartWidget();
        if(!chartModel.mainSeries().priceScale().isScaleSeriesOnly()) {
            chartWidget.actions().scaleSeriesOnly.execute();
        }

        chartWidget.properties().chartEventsSourceProperties.visible.setValue(true)
        chartWidget.properties().chartEventsSourceProperties.futureOnly.setValue(false);
    });

    L.replayApi.replayMode().setValue("AllCharts");
    L.replayApi.replayResolutions().subscribe(resolutions => L.reflectReplayResolutions(resolutions.filter(r => r)));
    L.replayApi.isReplayStarted().subscribe(onReplayMode);
    if (L.session.getParameter(L.sessionParameterIds.EnableWarmupStart) == "true") {
        L.toast("Warmup: playing candles to where you left off to prevent candle previews...", 5000)
    }
    await L.selectDateWithWarmup(L.session.currentDate);
    L.toast("Session synced to last active time. You can now open the TestingView journal panel below to view your trades.", 10000);

    setTimeout(() => {
        if (L.session.getParameter(L.sessionParameterIds.ShowOpenPositionTip) != "false") {
            TradingViewApi.activeChart().createAnchoredShape({ x: 0.1, y: 0.3 }, { shape: "anchored_text", text: `Quick tip:\nTo enter a position, simply \n- draw a Long Position or Short Position on the chart\n- double click to set its risk percentage or ${L.session.currencyId}\n- and start playing some candles`, overrides: { color: "white", backgroundColor: "rgb(0,0,0)", backgroundTransparency: 1, fillBackground: true, fontsize: 18 } })
            L.session.setParameter(L.sessionParameterIds.ShowOpenPositionTip, "false");
        } else {
            if(L.user.plan.planId.toUpperCase() != L.dataOps.plans.full.planId) {
                L.toast("All TestingView features are open, regardless of plan, while TestingView is in early stage");
            }
        }
    }, 10000);
}

L.createReplayTimestampUI = function () {
    if ($("#TestingViewCurrentDate").length == 0) {
        const timeContainerDiv = $("div[.chart-toolbar] button.apply-common-tooltip[data-name='time-zone-menu'] div.js-button-text");

        if (timeContainerDiv.length) {
            $("<div>")
                .attr("id", "TestingViewCurrentDate")
                .insertAfter(timeContainerDiv);
        } else {
            console.error("Current Time div not found!");
        }
    }
}

L.updateSessionCapitalInfo = function () {
    if (L.session.meta.sessionCapitalCalculationTimeout) {
        clearTimeout(L.session.meta.sessionCapitalCalculationTimeout);
    }

    L.session.meta.sessionCapitalCalculationTimeout = setTimeout(() => {
        const balanceValue = (L.session.meta.balance || L.session.capital)
            .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        $(".testingview-session-balance-balance-value").text(balanceValue);

        if (L.session.meta.equity !== undefined) {
            const equityValue = L.session.meta.equity
                .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            $(".testingview-session-balance-equity-value").text(equityValue);
        }

        if (L.session.getActivePositions().length == 0) {
            $(".testingview-session-balance-equity").hide();
        } else {
            $(".testingview-session-balance-equity").show();
        }

        $(".testingview-stats-button")
            .attr("aria-label", L.getStatsSummary())
            .attr("data-tooltip", L.getStatsSummary());
        
    }, 1000);
}

L.isPredefinedColumn = (columnName, exceptColumns) => {
    return (!exceptColumns || !exceptColumns.includes(columnName)) && ["Trade", "Date/Time", "Price", "Symbol", "Lots", "Risk", "Profit", "Cumulative profit", "Run-up", "Drawdown", "Snapshots", "BE Run-up", "Notes", "Analysis Time"].includes(columnName);
};

/*
--------------------------------------
Dialogs UI
--------------------------------------
*/

L.showInputPrompt = function (message, defaultValue, parent) {
    return new Promise((resolve) => {
        const dialog = $("<div>")
            .addClass("testingview-prompt-dialog")
            .appendTo(parent);

        const dialogContent = $("<div>")
            .addClass("testingview-prompt-dialog-content")
            .appendTo(dialog);

        const messageElement = $("<h3>")
            .text(message)
            .appendTo(dialogContent);

        const input = $("<input>")
            .val(defaultValue)
            .attr("spellcheck", "false")
            .appendTo(dialogContent);

        const buttons = $("<div>")
            .appendTo(dialogContent);

        const okButton = $("<button>")
            .text("OK")
            .on("click", () => {
                dialog.remove();
                resolve(input.val());
            })
            .appendTo(buttons);

        const cancelButton = $("<button>")
            .text("Cancel")
            .on("click", () => {
                dialog.remove();
                resolve(null);
            })
            .appendTo(buttons);

        dialog.on("click mousedown mouseup focusin", (e) => {
            if ($(e.target).hasClass("testingview-prompt-dialog")) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                cancelButton.click();
            }
        });
    });
}

L.showDialog = async function (title) {
    const hideDefaultDialogCss = `div[role="dialog"][data-name="source-properties-editor"] { display: none; }`
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
};

L.showSessions = async function () {
    await L.showDialog("TestingView");
};

L.showSettings = async function () {
    await L.showDialog(L.session.name);
};

L.showGotoDateDialog = async function () {
    await L.showDialog("Go to Date/Time");
};

L.showAnalysisTimesDialog = async function () {
    await L.showDialog("Analysis Times");
};

L.monitorDialogs = function () {
    L.monitorDialogsStartTime = Date.now();
    L.monitorDialogsTimer = setInterval(() => {
        if (Date.now() - L.monitorDialogsStartTime > 10000) {
            clearInterval(L.monitorDialogsTimer);
            return;
        }

        const dialogs = [
            { name: "TestingView", handler: L.createSessionsUI },
            { name: L.session?.name, handler: L.createSettingsUI },
            { name: "Go to Date/Time", handler: L.createGotoDateUI },
            { name: "Analysis Times", handler: L.createAnalysisTimesUI },
        ];

        for (const dialog of dialogs) {
            const dialogContainer = $(`div[role="dialog"][data-name="source-properties-editor"][data-dialog-name="${dialog.name}"]:not([handled])`);
            if (dialogContainer.length && $("div[class*='popupDialog']").length == 0) {
                dialogContainer.attr("handled", 1);
                dialog.handler(dialogContainer);
                const showDefaultDialogCss = `div[role="dialog"][data-name="source-properties-editor"] { display: revert; }`
                $("head").append(`<style>${showDefaultDialogCss}</style>`);
            
                clearInterval(L.monitorDialogsTimer);
                return;
            }
        }
    }, 200);
}

L.createSessionsUI = function (dialogContainer) {
    dialogContainer.find("div[class*='tabs']").remove();
    dialogContainer.find("span[class*='editIcon']").remove();
    const container = dialogContainer.find("div[class*='scrollable'] div[class*='content']");
    container.children().remove();

    const footer = dialogContainer.find("div[class*='footer']");
    footer.find("span[role='button'][data-role='listbox']").remove();
    footer.find("button[name='submit']").remove();
    footer.find("button[name='cancel'] span[class*='content']").text("Close");

    const discordInfo = `<div class="discord-cta">Need help or want to connect with other traders? Join the <a href="https://discord.gg/4jreqpJY">TestingView Discord</a> community!</div>`;
    footer.prepend(discordInfo);

    const section = $(`
        <div class="testingview-dialog-section-sessions">
            <span class="intro">
                Please ensure your <a href="https://TestingView.com" target="_blank">TestingView.com</a> subscription plan is active and associated with your TradingView username: <span contenteditable readonly spellcheck="false">${user.username}</span>
            </span>
        </div>`);

    section.append($(`<svg class="testingview-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13.88 3.88a1.88 1.88 0 1 1-3.76 0 1.88 1.88 0 0 1 3.76 0ZM12 18.24A1.88 1.88 0 1 0 12 22a1.88 1.88 0 0 0 0-3.75Zm8.13-8.13a1.88 1.88 0 1 0 0 3.76 1.88 1.88 0 0 0 0-3.76ZM5.74 12A1.88 1.88 0 1 0 2 12a1.88 1.88 0 0 0 3.75 0Zm.5 3.87a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75Zm11.5 0a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75ZM6.25 4.38a1.87 1.87 0 1 0 0 3.75 1.87 1.87 0 0 0 0-3.75Z"></path></svg>`))
    container.append(section);

    var sessionsTable = $(`<table class="testingview-dialog-table testingview-sessions-table">`);

    const createSessionRow = (session) => {
        L.dataOps.getSessionPositions(session.sessionId).then(positions => {
            sessionsTable.find(`tr[data-session-id='${session.sessionId}'] .positions-counter`).text(positions.length);

            L.getBalanceAfterPositions(session.capital, positions, session).then(balance => {
                sessionsTable.find(`tr[data-session-id='${session.sessionId}'] .session-balance`).text(balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }));
            });
        });

        return $(`
            <tr data-session-id="${session.sessionId}" class="${session.sessionId == L.session?.sessionId ? "selected-session" : ""}">
            <td>
                <table>
                <tr>
                    <td class="session-section">Session:</td>
                    <td class="session-name">
                    <input class="input size-small" value="${session.name}"></td>
                    </td>
                </tr>
                <tr>
                    <td class="session-section">Chart date:</td>
                    <td class="session-bar-date">
                    <input type="datetime-local" class="input size-small" tooltip="Set another backtesting date" value="${L.getDateInTimezone(session.currentDate, window.TradingViewApi.activeChart().getTimezone()).toISOString().slice(0, 16)}" min="${L.getDateInTimezone(session.currentDate, window.TradingViewApi.activeChart().getTimezone()).toISOString().slice(0, 16)}">
                    </td>
                </tr>
                <tr>
                    <td class="session-section">Balance:</td>
                    <td class="session-capital">
                    <span class="session-balance">${session.capital.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</span> <span class="currency">${session.currencyId}</span>
                    </td>
                </tr>
                <tr>
                    <td class="session-stats-info" colspan="2">
                    Positions: <span class="positions-counter">0</span>
                    <br/>
                    Last update: ${L.toTradingViewDateTimeFormat(session.lastUpdate, window.TradingViewApi.activeChart().getTimezone())}
                    </td>
                </tr>
                </table>
            </td>
            <td class="testingview-actions">
                <button class="resume-session lightButton secondary xsmall typography-regular14px ${session.sessionId == L.session?.sessionId ? "hidden" : ""}" style="--ui-lib-light-button-content-max-lines: 1;" title="Resume session">
                    Go &nbsp; <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.17 5.79 3.05 2.92H6.52a.97.97 0 0 0-.97.97v.64c0 .54.43.97.97.97h7.36l-3.05 2.92c-.39.37-.4 1-.01 1.38l.44.44c.38.38 1 .38 1.37 0l5.35-5.34c.38-.38.38-1 0-1.37l-5.35-5.36a.96.96 0 0 0-1.37 0l-.44.44a.97.97 0 0 0 .01 1.39Z"></path></svg>
                </button>
                <br/>
                <button class="delete-session lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;" title="Delete session">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path></svg>
                </button>
            </td>
            </tr>
        `);
    };

    const isPendingNewSession = () => {
        return sessionsTable.find("tr[data-session-id='new']").length > 0;
    };

    L.dataOps.getOrSaveUserId(user).then(userId => {
        L.dataOps.getUserById(userId).then(user => {
            L.user = user;

            section.append($(`<div class="testingview-dialog-section-plan">Active plan: ${L.user.plan.name}</div>`));
            L.dataOps.getPermissions(L.user.plan.planId).then(permissions => {
                L.permissions = permissions;
                L.dataOps.getSessions(L.user.userId).then(sessions => {
                    $(".testingview-loader").remove();

                    const addNewSession = $(`
                        <div class="testingview-session-settings-add-new-session-container">
                            <button class="lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;">
                                <span class="content nowrap">
                                    <span class="ellipsisContainer">New session</span>
                                </span>
                            </button>
                        </div>
                    `);

                    addNewSession.on("click", () => {
                        if (isPendingNewSession()) return;
                        if(sessionsTable.find("tr[data-session-id]").length <= 1 || L.permissions.includes("MultipleBacktestingSessions")) {
                            var oneYearAgo = new Date();
                            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                            // Format as yyyy-MM-ddTHH:mm (what datetime-local input expects)
                            oneYearAgo = oneYearAgo.toISOString().slice(0, 16);

                            const editableSessionRow = $(`
                                <tr data-session-id="new">
                                    <td>
                                        <table>
                                            <tr>
                                                <td class="session-section">Session:</td>
                                                <td class="session-name">
                                                    <input class="input size-small" value="My TestingView session">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="session-section">Chart date:</td>
                                                <td class="session-bar-date">
                                                    <input type="datetime-local" tooltip="Select a backtesting date" class="input size-small" value="${oneYearAgo}">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="session-section">Balance:</td>
                                                <td class="session-capital">
                                                    <table border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td class="session-capital-value">
                                                                <input type="number" step="1000" placeholder="Capital" value="100000" class="input size-small">
                                                            </td>
                                                            <td class="session-capital-currency">
                                                                <select class="input size-small">
                                                                    <option value="USD">USD</option>
                                                                    <option value="EUR">EUR</option>
                                                                    <option value="AUD">AUD</option>
                                                                    <option value="GBP">GBP</option>
                                                                    <option value="NZD">NZD</option>
                                                                    <option value="CAD">CAD</option>
                                                                    <option value="CHF">CHF</option>
                                                                    <option value="HKD">HKD</option>
                                                                    <option value="JPY">JPY</option>
                                                                    <option value="NOK">NOK</option>
                                                                    <option value="RUB">RUB</option>
                                                                    <option value="SEK">SEK</option>
                                                                    <option value="SGD">SGD</option>
                                                                    <option value="TRY">TRY</option>
                                                                    <option value="ZAR">ZAR</option>
                                                                    <option value="BTC">BTC</option>
                                                                    <option value="ETH">ETH</option>
                                                                    <option value="MYR">MYR</option>
                                                                    <option value="KRW">KRW</option>
                                                                    <option value="USDT">USDT</option>
                                                                    <option value="INR">INR</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td class="testingview-actions">
                                        <button class="save-session lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;" title="Start backtesting">
                                            Start &nbsp; <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.17 5.79 3.05 2.92H6.52a.97.97 0 0 0-.97.97v.64c0 .54.43.97.97.97h7.36l-3.05 2.92c-.39.37-.4 1-.01 1.38l.44.44c.38.38 1 .38 1.37 0l5.35-5.34c.38-.38.38-1 0-1.37l-5.35-5.36a.96.96 0 0 0-1.37 0l-.44.44a.97.97 0 0 0 .01 1.39Z"></path></svg>
                                        </button>
                                        <br/>
                                        <button class="cancel-session lightButton secondary xsmall typography-regular14px ${sessions.length ? "" : "hidden"}" style="--ui-lib-light-button-content-max-lines: 1;" title="Cancel session">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path></svg>
                                        </button>
                                    </td>
                                </tr>
                            `);
                            editableSessionRow.find("button.save-session").on("click", () => {
                                const session = {}
                                session.userId = L.user.userId;
                                session.name = editableSessionRow.find("input").val();
                                if (!session.name) {
                                    alert("Please enter a session name.");
                                    return;
                                }
                                if (sessions.find(s => s.name.toLowerCase() == session.name.toLowerCase())) {
                                    alert("There is already a session with this name.");
                                    return;
                                }
                                session.capital = Number(editableSessionRow.find("input[type='number']").val());
                                if (!(session.capital > 0)) {
                                    alert("Please enter a valid capital amount.");
                                    return;
                                }

                                session.currencyId = editableSessionRow.find("select").val();
                                session.currentDate = new Date(editableSessionRow.find("input[type='datetime-local']").val()).getTime() / 1000;

                                //display loader
                                editableSessionRow.find(".save-session").html(`<svg class="testingview-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M13.88 3.88a1.88 1.88 0 1 1-3.76 0 1.88 1.88 0 0 1 3.76 0ZM12 18.24A1.88 1.88 0 1 0 12 22a1.88 1.88 0 0 0 0-3.75Zm8.13-8.13a1.88 1.88 0 1 0 0 3.76 1.88 1.88 0 0 0 0-3.76ZM5.74 12A1.88 1.88 0 1 0 2 12a1.88 1.88 0 0 0 3.75 0Zm.5 3.87a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75Zm11.5 0a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75ZM6.25 4.38a1.87 1.87 0 1 0 0 3.75 1.87 1.87 0 0 0 0-3.75Z"></path></svg>`);

                                const latestSession = [...sessions].sort((a, b) => b.lastUpdate - a.lastUpdate)[0];
                                L.dataOps.createSession(session).then((sessionId) => {
                                    var saveColumns;
                                    if (latestSession) {
                                        saveColumns = L.dataOps.getSessionColumns(latestSession.sessionId).then((latestColumns) => L.saveSessionColumns(sessionId, latestColumns));
                                    } else {
                                        saveColumns = L.saveSessionColumns(sessionId);
                                    }

                                    saveColumns.then(() => {
                                        L.startSession(sessionId);
                                        L.removeDummyShape();
                                    });
                                });
                            });

                            editableSessionRow.find("button.cancel-session").on("click", () => {
                                if (sessionsTable.find("tr[data-session-id]").length > 1) {
                                    editableSessionRow.remove();
                                }
                            });
                            sessionsTable.append(editableSessionRow);
                            window.dispatchEvent(new Event('resize'));
                        }
                        else {
                            alert("Cannot create multiple sessions: please subscribe to a free plan or start a free trial on TestingView.com");
                        }
                    });

                    for (const session of sessions) {
                        const sessionRow = createSessionRow(session);
                        sessionRow.find(".session-name input").on("change", () => {
                            const sessionName = sessionRow.find(".session-name input").val().trim();
                            if (!sessionName) {
                                alert("Please enter a session name.");
                                return;
                            }
                            if (sessions.find(s => s.name == sessionName && s.sessionId != session.sessionId)) {
                                alert("There is already a session with this name.");
                                return;
                            }
                            session.name = sessionName;
                            L.dataOps.updateSession({ sessionId: session.sessionId, name: session.name });
                        });
                        sessionRow.find("button.resume-session").on("click", () => {
                            if(L.permissions.includes("CanContinueSession")) {
                                L.removeDummyShape();
                                const sessionDate = new Date(sessionRow.find(".session-bar-date input").val()).getTime() / 1000;
                                L.dataOps.getSessionPositions(session.sessionId).then(positions => {
                                    if (positions.every(p => p.exitTime)) {
                                        session.currentDate = sessionDate;
                                        L.dataOps.updateSession({ sessionId: session.sessionId, currentDate: session.currentDate }).then(() => {
                                            L.startSession(session.sessionId);
                                        });
                                    } else {
                                        L.startSession(session.sessionId);
                                        if(session.currentDate - sessionDate >= 60) {
                                            alert("Unable to change the replay date: there is an open position in this session.");
                                        }
                                    }
                                });
                            } else {
                                L.messageBox("Feature disabled", "Cannot resume an existing session: please subscribe to a free plan or start a free trial on TestingView.com");
                            }
                        });
                        sessionRow.find("button.delete-session").on("click", () => {
                            if (!confirm("Are you sure you want to delete this session?")) return;

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



    dialogContainer.find("button[name='cancel']").on("click", () => {
        L.removeDummyShape();
    });
}

L.createSettingsUI = function (dialogContainer) {
    dialogContainer.find("div[class*='tabs']").remove();
    const container = dialogContainer.find("div[class*='scrollable'] div[class*='content']");
    container.children().remove();

    const footer = dialogContainer.find("div[class*='footer']");
    footer.find("span[role='button'][data-role='listbox']").remove();

    container.append($("<h3 class='testingview-dialog-section-title'>Options</h3>"));
    var section = $("<div>").addClass("testingview-dialog-options-section");
    container.append(section);
    var optionsSection = $(`
            <input type='checkbox' id='testingview-option-MinReplayResolutionDummy' checked>
            <label for="testingview-option-MinReplayResolution">Minimum step forward</label>
            <select id="testingview-option-MinReplayResolution">
            </select>
            <span title="The minimum replay interval when clicking the step forward button (Shift + ⇨). When skipping candles, all increments are based on this interval. By default, it's the minimum supported by your TradingView subscription plan." class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg></span></span>
            <br/>
            <input type='checkbox' id='testingview-option-PreventHTFCandlePreviews' ${L.session.getParameter(L.sessionParameterIds.PreventHTFCandlePreviews) == 'true' ? "checked" : ""}>
            <label for='testingview-option-PreventHTFCandlePreviews'>Prevent candle previews when changing timeframes</label>
            <span title="Automatically goes back to the previous candle and plays it again when switching timeframes. This prevents seeing the full candle formation, which TradingView shows by default in replay mode when switching to higher timeframes." class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg></span></span>
            <br/>
            <input type='checkbox' id='testingview-option-EnablePredefinedTimes' ${L.session.getParameter(L.sessionParameterIds.EnablePredefinedTimes) == 'true' ? "checked" : ""}>
            <label for='testingview-option-EnablePredefinedTimes'>Stop at hours (HH:mm)</label>
            <input type='text' id='testingview-option-PredefinedTimes' class="input size-small normal" value='${L.session.getParameter(L.sessionParameterIds.PredefinedTimes)}' placeholder='e.g., 09:30, 12:30, 15:30'>
            <span title="Automatically stops candle playback at specified times during the day. Useful for regular events like session opens, news releases or your own schedule." class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg></span></span>
            <br/>
            <input type='checkbox' id='testingview-option-EnableWarmupStart' ${L.session.getParameter(L.sessionParameterIds.EnableWarmupStart) == 'true' ? "checked" : ""}>
            <label for='testingview-option-EnableWarmupStart'>Warmup jump-to-date</label>
            <select id="testingview-option-WarmupStartOffset">
                <option value="300" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '300' ? "selected" : ""}>5m</option>
                <option value="900" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '900' ? "selected" : ""}>15m</option>
                <option value="1800" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '1800' ? "selected" : ""}>30m</option>
                <option value="3600" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '3600' ? "selected" : ""}>1h</option>
                <option value="7200" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '7200' ? "selected" : ""}>2h</option>
                <option value="14400" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '14400' ? "selected" : ""}>4h</option>
                <option value="86400" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '86400' ? "selected" : ""}>1D</option>
            </select>
            <span title="When jumping to a specific time, a brief playback will take place just before that time to load indicators and prevent seeing future price action (by default, TradingView displays the full candle when navigating to a time that is mid-candle)." class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg></span></span>
            <br/>
            <input type='checkbox' id='testingview-option-AnalysisTimer' ${L.session.getParameter(L.sessionParameterIds.AnalysisTimer) == 'true' ? "checked" : ""}>
            <label for='testingview-option-AnalysisTimer'>Show analysis timer</label>
            <span title="Track how long you spend analyzing each trading opportunity. The timer starts when you pause at any candle." class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg></span></span>
        `);

    section.append(optionsSection);
    $("#testingview-option-MinReplayResolutionDummy")
    .on('click change keydown keyup mousedown mouseup touchstart touchend', function(e) {
        e.preventDefault();
        $(this).prop('checked', true);
        return false;
    });

    L.getReplayResolutions().then(resolutions => {
        const select = optionsSection.closest('#testingview-option-MinReplayResolution');
        resolutions.forEach(resolution => {
            select.append($('<option>', {
                value: resolution,
                text: L.resolutionToFriendlyText(resolution),
                selected: L.session.getParameter(L.sessionParameterIds.MinReplayResolution) == resolution
            }));
        });
    });

    L.session.retrieveParameters().then(() => {
        $("#testingview-option-MinReplayResolution").val(L.session.getParameter(L.sessionParameterIds.MinReplayResolution));
        $("#testingview-option-PreventHTFCandlePreviews").prop("checked", L.session.getParameter(L.sessionParameterIds.PreventHTFCandlePreviews) == 'true');
        $("#testingview-option-EnablePredefinedTimes").prop("checked", L.session.getParameter(L.sessionParameterIds.EnablePredefinedTimes) == 'true');
        $("#testingview-option-PredefinedTimes").val(L.session.getParameter(L.sessionParameterIds.PredefinedTimes));
        $("#testingview-option-EnableWarmupStart").prop("checked", L.session.getParameter(L.sessionParameterIds.EnableWarmupStart) == 'true');
        $("#testingview-option-WarmupStartOffset").val(L.session.getParameter(L.sessionParameterIds.WarmupStartOffset));
        $("#testingview-option-AnalysisTimer").prop("checked", L.session.getParameter(L.sessionParameterIds.AnalysisTimer) == 'true');
    });

    container.append($("<h3 class='testingview-dialog-section-title'>Journal Columns</h3>"));
    section = $("<div>");
    container.append(section);

    var columnsTable = $(`
        <table class="testingview-dialog-table testingview-column-settings-table">
        </table>
    `);

    const createColumnRow = (column) => {
        const columnRow = $(`
            <tr data-column-id="${column.columnId}">
                <td class="column-drag">
                    <div class="drag-handle">
                        <svg width="20" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="5" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="6" cy="19" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle><circle cx="18" cy="5" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle><circle cx="18" cy="19" r="1.5"></circle></svg>
                    </div>
                </td>
                <td class="column-enable">
                    <input type="checkbox" data-column-name="${column.columnName}" ${column.visible ? "checked" : ""}>
                </td>
                <td class="column-name"><input class="input size-small" value="${column.columnName}" ${L.isPredefinedColumn(column.columnName) ? "readonly" : ""}></td>
                <td class="column-type">
                    <select ${L.isPredefinedColumn(column.columnName) ? "disabled" : ""}>
                        <option value="text" ${column.columnType == "text" ? "selected" : ""}>Text</option>
                        <option value="richtext" ${column.columnType == "richtext" ? "selected" : ""}>Rich text</option>
                        <option value="number" ${column.columnType == "number" ? "selected" : ""}>Number</option>
                        <option value="bool" ${column.columnType == "bool" ? "selected" : ""}>Yes/No</option>
                        <option value="date" ${column.columnType == "date" ? "selected" : ""}>Date</option>
                        <option value="time" ${column.columnType == "time" ? "selected" : ""}>Time</option>
                        <option value="datetime" ${column.columnType == "datetime" ? "selected" : ""}>Date & time</option>
                        <option disabled value="actions" ${column.columnType == "actions" ? "selected" : ""}>Actions</option>
                    </select>
                </td>
                <td class="testingview-actions">
                    <button class="edit-select-values lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;" title="${column.columnEnumValues || "Edit possible values"}" data-values="${column.columnEnumValues || ""}" ${L.isPredefinedColumn(column.columnName) || ["richtext", "bool", "actions"].includes(column.columnType) ? "disabled" : ""}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="18" height="18"><path fill="currentColor" d="M5 6.4a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 6h16V5H8v1Zm-3 8.46a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 14h16v-1H8v1Zm-2 7.43a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM24 22H8v-1h16v1Z"></path></svg>
                    </button>
                    <button class="delete-column lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;" title="Delete column" ${L.isPredefinedColumn(column.columnName) ? "disabled" : ""}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                            <path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `);

        columnRow.find("select").on("change", function () {
            const columnType = $(this).val();
            if (["richtext", "bool", "actions"].includes(columnType)) {
                columnRow.find("button.edit-select-values").attr("disabled", true);
            } else {
                columnRow.find("button.edit-select-values").removeAttr("disabled");
            }

            if (L.isPredefinedColumn(column.columnName)) {
                columnRow.find("button.edit-select-values").attr("disabled", true);
                columnRow.find("button.delete-column").attr("disabled", true);
            }
        });

        columnRow.find("button.edit-select-values").on("click", () => {
            L.showInputPrompt(`Specify possible options for '${$(`tr[data-column-id=${column.columnId}] td.column-name input`).val().trim()}', separated by commas:`, column.columnEnumValues, dialogContainer).then(value => {
                if (value !== null) {
                    const button = columnRow.find("button.edit-select-values");
                    button.attr("data-values", value);
                    button.attr("title", value);
                }
            });
        });

        columnRow.find("button.delete-column").on("click", () => {
            columnRow.remove();
        });

        return columnRow;
    };

    for (const column of L.session.sessionColumns) {
        columnsTable.append(createColumnRow(column));
    }
    section.append(columnsTable);

    const addNewColumn = $(`
        <div class="testingview-column-settings-add-new-column-container">
            <button class="lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;">
                <span class="content nowrap">
                    <span class="ellipsisContainer">Add new column</span>
                </span>
            </button>
        </div>
    `);

    section.append(addNewColumn);

    let draggedRow = null;

    const dragOnMouseDown = function () {
        draggedRow = $(this).parents("tr");
        draggedRow.addClass("dragging");
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

    columnsTable.find("tr .drag-handle").on("mousedown", dragOnMouseDown);
    columnsTable.find("tr").on("mousemove", dragOnMouseMove);

    $(document).on("mouseup", function () {
        draggedRow?.removeClass("dragging");
        draggedRow = null;
    });

    $("button", addNewColumn).on("click", () => {
        if(L.permissions.includes("JournalCustomization")) {
            const newColumn = {
                columnName: "New Column",
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

            columnsTable.find("tr .drag-handle").on("mousedown", dragOnMouseDown);
            columnsTable.find("tr").on("mousemove", dragOnMouseMove);
                    
            setTimeout(() => {
                window.dispatchEvent(new Event('resize')); 
            }, 1000);
        } else {
            L.messageBox("Feature disabled", "Cannot customize journal columns: please subscribe to a free plan or start a free trial on TestingView.com");
        }
    });

    dialogContainer.find("button[name='submit']").on("click", () => {
        L.session.setParameter(L.sessionParameterIds.MinReplayResolution, $("#testingview-option-MinReplayResolution").val());
        L.session.setParameter(L.sessionParameterIds.PreventHTFCandlePreviews, $("#testingview-option-PreventHTFCandlePreviews").prop("checked").toString());
        L.session.setParameter(L.sessionParameterIds.EnablePredefinedTimes, $("#testingview-option-EnablePredefinedTimes").prop("checked").toString());
        L.session.setParameter(L.sessionParameterIds.PredefinedTimes, $("#testingview-option-PredefinedTimes").val());
        L.session.setParameter(L.sessionParameterIds.EnableWarmupStart, $("#testingview-option-EnableWarmupStart").prop("checked").toString());
        L.session.setParameter(L.sessionParameterIds.WarmupStartOffset, $("#testingview-option-WarmupStartOffset").val());
        L.session.setParameter(L.sessionParameterIds.AnalysisTimer, $("#testingview-option-AnalysisTimer").prop("checked").toString());
        L.selectResolution(0, 0);
        L.reflectReplayResolutions();

        if (!$("#testingview-option-PreventHTFCandlePreviews").prop("checked")) {
            L.stopSkipping();
        }

        if ($("#testingview-option-AnalysisTimer").prop("checked")) {
            $(".analysis-timer-separator").show();
            $(".testingview-session-analysis-timer").show();
        } else {
            $(".analysis-timer-separator").hide();
            $(".testingview-session-analysis-timer").hide();
        }

        const columns = [];
        columnsTable.find("tr").each((i, row) => {
            const columnId = $(row).attr("data-column-id");
            var columnName = $(row).find("td.column-name input").val().trim();
            const columnType = $(row).find("td.column-type select").val();
            const visible = $(row).find("td.column-enable input").is(":checked");
            var columnEnumValues = $(row).find("button.edit-select-values").attr("data-values");
            if (["richtext", "bool", "actions"].includes(columnType)) {
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

        L.saveSessionColumns(L.session.sessionId, columns).then(c => {
            L.session.sessionColumns = c;
            L.createPositionsListHeader(true);
        });

        const newSessionName = dialogContainer.attr("data-dialog-name").trim();
        if (newSessionName && L.session.name != newSessionName) {
            L.session.name = newSessionName;
            L.dataOps.updateSession({ sessionId: L.session.sessionId, name: newSessionName });
        }
        L.removeDummyShape();
    });

    dialogContainer.find("button[name='cancel']").on("click", () => {
        L.removeDummyShape();
    });

    setTimeout(() => {
        window.dispatchEvent(new Event('resize')); 
    }, 1000);
}

L.createGotoDateUI = function (dialogContainer) {
    dialogContainer.find("div[class*='tabs']").remove();
    dialogContainer.find("span[class*='editIcon']").remove();

    const container = dialogContainer.find("div[class*='scrollable'] div[class*='content']");
    container.children().remove();

    const footer = dialogContainer.find("div[class*='footer']");
    footer.find("span[role='button'][data-role='listbox']").remove();

    const predefinedTimesTable = $(`
        <table class="testingview-dialog-table">
        </table>
    `);
    const predefinedTimesSection = $(`
        <div class="predefined-times testingview-dialog-section">
            <label>Predefined times:</label>
        </div>`);
    predefinedTimesSection.append(predefinedTimesTable);
    container.append(predefinedTimesSection);

    // Load existing predefined times
    const predefinedTimes = (L.session.getParameter(L.sessionParameterIds.PredefinedTimes) || "")
        .split(",")
        .map((time) => time.trim())
        .filter((time) => time.length > 0);

    function saveParameters() {
        const enablePredefinedTimes = optionsSection.find("#testingview-option-EnablePredefinedTimes").prop("checked").toString();
        const times = predefinedTimesTable.find("tbody tr input[type='time']")
            .map((_, el) => $(el).val())
            .get()
            .filter(t => t)
            .sort()
            .join(", ");

        L.session.setParameter(L.sessionParameterIds.EnablePredefinedTimes, enablePredefinedTimes);
        L.session.setParameter(L.sessionParameterIds.PredefinedTimes, times);
        L.session.setParameter(L.sessionParameterIds.EnableWarmupStart, $("#testingview-option-EnableWarmupStart").prop("checked").toString());
        L.session.setParameter(L.sessionParameterIds.WarmupStartOffset, $("#testingview-option-WarmupStartOffset").val());
    }

    function addTimeRow(time) {
        var nextDate = L.getNextDateTime(time);
        
        const row = $(`
            <tr>
                <td><input type="time" class="input size-small" value="${time}" /></td>
                <td class="testingview-actions rightAlign" width="40%">
                    <button class="goto-time lightButton secondary xsmall typography-regular14px" title="Next occurrence: ${L.toTradingViewDateTimeFormat(nextDate)}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.17 5.79 3.05 2.92H6.52a.97.97 0 0 0-.97.97v.64c0 .54.43.97.97.97h7.36l-3.05 2.92c-.39.37-.4 1-.01 1.38l.44.44c.38.38 1 .38 1.37 0l5.35-5.34c.38-.38.38-1 0-1.37l-5.35-5.36a.96.96 0 0 0-1.37 0l-.44.44a.97.97 0 0 0 .01 1.39Z"></path>
                        </svg>
                    </button>
                    <button class="delete-time lightButton secondary xsmall typography-regular14px" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                            <path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `);

        row.find(".goto-time").on("click", async function() {
            const t = row.find("input[type='time']").val();
            const nextDateTime = L.getNextDateTime(t);
            saveParameters();
            L.removeDummyShape();
            if (L.session.getActivePositions().length == 0) {
                if (nextDateTime) {
                    L.session.stopAssessTracking();
                    if (L.session.getParameter(L.sessionParameterIds.EnableWarmupStart) == "true") {
                        L.toast("Playing warmup candles near the specified time to prevent candle previews", 5000);
                    }
                    await L.selectDateWithWarmup(nextDateTime.getTime() / 1000);
                    setTimeout(async () => {
                        var minReplayResolution = L.session.getParameter(L.sessionParameterIds.MinReplayResolution);
                        L.session.meta.latestPredefinedTime = L.session.currentDate + L.resolutionToSeconds(minReplayResolution) * 4
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
                } else {
                    L.toast("Could not find next valid market session for the specified time", 2000, "warn");
                }
            } else {
                L.toast("Cannot go to the specified time while there are open positions", 2000, "warn");
            }
        });

        row.find(".delete-time").on("click", function() {
            row.remove();
        });

        predefinedTimesTable.append(row);
    }

    // Add existing times
    predefinedTimes.forEach(time => addTimeRow(time));

    // Add new time button
    const addNewTime = $(`
        <div style="margin-top: 10px;">
            <button class="lightButton secondary xsmall typography-regular14px">
                Add new time
            </button>
        </div>
    `);
    addNewTime.find("button").on("click", () => addTimeRow("00:00"));
    container.append(addNewTime);

    const customDateTimeSection = $(`
        <div class="testingview-dialog-options-section-custom-date">
            <hr>
            <div class="testingview-dialog-section">
                <label for="custom-date-time">Or, go to a custom date/time:</label>
                <table class="testingview-dialog-table">
                    <tr>
                        <td>
                            <input 
                                id="custom-date-time" 
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
                                min="${L.getDateInTimezone(L.session.currentDate, window.TradingViewApi.activeChart().getTimezone()).toISOString().slice(0, 16)}">
                        </td>
                        <td class="testingview-actions rightAlign" width="40%">
                            <button class="goto-time lightButton secondary xsmall typography-regular14px">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                                    <path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.17 5.79 3.05 2.92H6.52a.97.97 0 0 0-.97.97v.64c0 .54.43.97.97.97h7.36l-3.05 2.92c-.39.37-.4 1-.01 1.38l.44.44c.38.38 1 .38 1.37 0l5.35-5.34c.38-.38.38-1 0-1.37l-5.35-5.36a.96.96 0 0 0-1.37 0l-.44.44a.97.97 0 0 0 .01 1.39Z"></path>
                                </svg>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    `);
    container.append(customDateTimeSection);

    container.find(".testingview-dialog-options-section-custom-date .goto-time").on("click", async function() {
        saveParameters();
        L.removeDummyShape();

        const customDateTime = customDateTimeSection.find("#custom-date-time").val();
        if (customDateTime) {
            var timeNow = new Date();
            var timeNowInTimezone = L.getDateInTimezone(timeNow / 1000, TradingViewApi.activeChart().getTimezone());

            const offsetHours = timeNowInTimezone.getUTCHours() - timeNow.getHours();
            const offsetMinutes = timeNowInTimezone.getUTCMinutes() - timeNow.getMinutes();

            const adjustedDateTime = new Date(customDateTime);
            adjustedDateTime.setHours(adjustedDateTime.getHours() - offsetHours);
            adjustedDateTime.setMinutes(adjustedDateTime.getMinutes() - offsetMinutes);
            
            if (new Date(adjustedDateTime).getTime() / 1000 > L.session.currentDate) {
                if (L.session.getActivePositions().length == 0) {
                    L.session.stopAssessTracking();

                    const timestamp = new Date(adjustedDateTime).getTime() / 1000;
                    if (L.session.getParameter(L.sessionParameterIds.EnableWarmupStart) == "true") {
                        L.toast("Warming up candles to the specified date/time to prevent candle preview...", 5000);
                    }
                    await L.selectDateWithWarmup(timestamp);
                } else {
                    L.messageBox("Usage info", "Cannot go to the specified date/time while there are open positions. Please close all positions before jumping to another date.");
                }
            } else {
                L.messageBox("Usage info", "The selected date/time must be in the future.");
            }
        } 
    });

    const optionsSection = $(`
        <div class="testingview-dialog-options-section">
            <hr>
            <input type='checkbox' id='testingview-option-EnablePredefinedTimes' ${L.session.getParameter(L.sessionParameterIds.EnablePredefinedTimes) == 'true' ? "checked" : ""}>
            <label for='testingview-option-EnablePredefinedTimes'>Stop playback/skipping at predefined times</label>
            <span title="Automatically stops candle playback at specified times during the day. Useful for regular events like session opens, news releases or your own schedule." class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg></span></span>
            <br/>
            <input type='checkbox' id='testingview-option-EnableWarmupStart' ${L.session.getParameter(L.sessionParameterIds.EnableWarmupStart) == 'true' ? "checked" : ""}>
            <label for='testingview-option-EnableWarmupStart'>Warmup jump-to-date</label>
            <select id="testingview-option-WarmupStartOffset">
                <option value="300" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '300' ? "selected" : ""}>5m</option>
                <option value="900" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '900' ? "selected" : ""}>15m</option>
                <option value="1800" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '1800' ? "selected" : ""}>30m</option>
                <option value="3600" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '3600' ? "selected" : ""}>1h</option>
                <option value="7200" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '7200' ? "selected" : ""}>2h</option>
                <option value="14400" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '14400' ? "selected" : ""}>4h</option>
                <option value="86400" ${L.session.getParameter(L.sessionParameterIds.WarmupStartOffset) == '86400' ? "selected" : ""}>1D</option>
            </select>
            <span title="When jumping to a specific time, a brief playback will take place just before that time to load indicators and prevent seeing future price action (by default, TradingView displays the full candle when navigating to a time that is mid-candle)." class="icon-wrapper with-tooltip apply-common-tooltip iconWrapper default small" tabindex="-1"><span role="img" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path></svg></span></span>
        </div>
    `);
    container.append(optionsSection);
    L.session.retrieveParameters().then(() => {
        $("#testingview-option-EnablePredefinedTimes").prop("checked", L.session.getParameter(L.sessionParameterIds.EnablePredefinedTimes) == 'true');
        $("#testingview-option-EnableWarmupStart").prop("checked", L.session.getParameter(L.sessionParameterIds.EnableWarmupStart) == 'true');
        $("#testingview-option-WarmupStartOffset").val(L.session.getParameter(L.sessionParameterIds.WarmupStartOffset));
    });

    // Handle submit button
    footer.find("button[name='submit']").on("click", async function () {
        saveParameters();
        L.removeDummyShape();
    });

    // Handle dialog close
    footer.find("button[name='cancel']").on("click", () => {
        L.removeDummyShape();
    });
}

L.createAnalysisTimesUI = function (dialogContainer) {
    dialogContainer.find("div[class*='tabs']").remove();
    dialogContainer.find("span[class*='editIcon']").remove();

    const container = dialogContainer.find("div[class*='scrollable'] div[class*='content']");
    container.children().remove();

    const footer = dialogContainer.find("div[class*='footer']");
    footer.find("span[role='button'][data-role='listbox']").remove();

    const analysisTimesTable = $(`
        <table class="testingview-dialog-table">
        </table>
    `);
    container.append(analysisTimesTable);

    for (const analysisTime of L.session.meta.analysisTimes.filter(a => a.analysisDuration > 5 && a.analysisStartTime < L.session.currentDate).slice(0, 10)) {
        const row = $(`
            <tr>
                <td>${L.toTradingViewDateTimeFormat(analysisTime.analysisStartTime, window.TradingViewApi.activeChart().getTimezone())}</td>
                <td class="analysis-timespan" contenteditable readonly>${analysisTime.analysisTimespan}</td>
                <td class="testingview-actions">
                    <button class="lightButton secondary xsmall typography-regular14px select-analysis-time-button" title="Add to journal">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18.75 7.38h-3.37c.06-.3.09-.59.09-.88 0-1.87-1.37-3.25-3.6-3.25-1.77 0-2.22 1.9-2.95 3.08-.3.48-.67.9-1.01 1.3H7.9c-.6.7-.9.93-1.18.93h-.1c-.23-.2-.53-.31-.87-.31h-2.5c-.69 0-1.25.5-1.25 1.13v9c0 .62.56 1.12 1.25 1.12h2.5c.34 0 .64-.12.86-.31h.1c1.13 0 2.63 1.56 4.98 1.56h.83c2.44 0 3.86-1.51 3.9-3.56.5-.7.73-1.6.63-2.45.14-.28.24-.57.3-.87h1.4A3.27 3.27 0 0 0 22 10.63a3.3 3.3 0 0 0-3.25-3.26Zm0 4.62h-3.56c.5.57.57 1.67-.19 2.38.44.77.07 1.79-.5 2.1.25 1.53-.4 2.4-1.98 2.4h-.83c-1.78 0-3.02-1.4-4.69-1.55v-6.9c.99-.13 1.68-.84 2.3-1.56.45-.49.86-.98 1.21-1.55.57-.92 1.02-2.2 1.37-2.2.9 0 1.71.35 1.71 1.38 0 1.38-1.03 2.07-1.03 2.75h6.19c.72 0 1.38.64 1.38 1.38A1.4 1.4 0 0 1 18.75 12ZM5.44 17a.94.94 0 1 1-1.88 0 .94.94 0 0 1 1.88 0Z"></path></svg>
                    </button>
                </td>
            </tr>
        `);

        row.find(".select-analysis-time-button").on("click", async function() {
            const timeValue = row.find(".analysis-timespan").text();
            if (timeValue) {
                L.removeDummyShape();
                const position = L.session.getActivePositions()[0];
                if (position) {
                    position.columnValue("Analysis Time", timeValue);
                    L.updatePositionUI(position);
                }

            }
        });

        analysisTimesTable.append(row);
    }

    if(L.session.getActivePositions().length == 0) {
        analysisTimesTable.find(".select-analysis-time-button").hide();
    }

    footer.find("button[name='cancel']").hide();
}

L.removeDummyShape = function () {
    const chart = L.getCharts()[0];
    const dummyShapes = chart.getAllShapes().filter(s => s.name == "emoji");
    for (const dummyShapeInfo of dummyShapes) {
        if (L.isGeneratedShape(dummyShapeInfo.id)) {
            L.removeShapeById(dummyShapeInfo.id, chart, true);
            }
        }
    }

L.exportStats = function () {
    L.confirmBox("Export to Excel", "Do you want to export your TestingView positions and session statistics?", (ok) => {
        if (ok) {
            if (L.permissions.includes("JournalExport")) {
                var positionsTable = $("div.replay_trading:not(.js-hidden) div.backtesting.deep-history table");
                if (positionsTable.length) {
                    L.toast("Exporting session statistics...");

                    var positionEntries = [];
                    positionsTable.find("tr.V_POSITION").each((rowIndex, row) => {
                        row = $(row);
                        var positionEntry = new Map();
                        var positionId = row.attr("id").split("_")[1];
                        var position = L.session.positions.find(p => p.positionId == positionId);

                        row.find("td[column-name]").each((columnIndex, cell) => {
                            cell = $(cell);
                            var columnName = cell.attr("column-name");
                            if (columnName == "Trade") {
                                positionEntry["Trade"] = position.getDirection().toUpperCase();
                            } else if (columnName == "Date/Time") {
                                const entryDate = L.getDateInTimezone(position.entryTime, window.TradingViewApi.activeChart().getTimezone());
                                positionEntry["Entry Date"] = entryDate.toISOString().split("T")[0];
                                positionEntry["Entry Time"] = entryDate.toISOString().split("T")[1].slice(0, 5);

                                const exitDate = position.exitTime ? L.getDateInTimezone(position.exitTime, window.TradingViewApi.activeChart().getTimezone()) : null;
                                positionEntry["Exit Date"] = exitDate ? exitDate.toISOString().split("T")[0] : null;
                                positionEntry["Exit Time"] = exitDate ? exitDate.toISOString().split("T")[1].slice(0, 5) : null;
                            } else if (columnName == "Price") {
                                positionEntry["Entry Price"] = position.entryPrice;
                                positionEntry["Exit Price"] = position.exitPrice || null;
                            } else if (columnName == "Risk") {
                                positionEntry[`Risk ${cell.find(".currency").text()}`] = cell.find(".V_RISK").text().trim();
                                positionEntry[`Risk %`] = cell.find(".V_RISKPERCENTAGE").text().trim();

                                positionEntry[`SL`] = position.stopPrice() || null;
                                positionEntry[`TP`] = position.targetPrice() || null;
                                positionEntry[`BE`] = position.bePrice() || null;
                            } else if (columnName == "Profit") {
                                positionEntry[`Profit ${cell.find(".currency").text()}`] = cell.find(".V_PROFIT").text().trim();
                                positionEntry[`Profit %`] = cell.find(".V_PROFITPERCENTAGE").text().trim();
                            } else if (columnName == "Cumulative profit") {
                                positionEntry[`Cumulative profit ${cell.find(".currency").text()}`] = cell.find(".V_CUMULATIVEPROFIT").text().trim();
                                positionEntry[`Cumulative profit %`] = cell.find(".V_CUMULATIVEPROFITPERCENTAGE").text().trim();
                            } else if (columnName == "Run-up") {
                                positionEntry[`Run-up ${cell.find(".currency").text()}`] = cell.find(".V_RUNUP").text().trim();
                                positionEntry[`Run-up %`] = cell.find(".V_RUNUPPERCENTAGE").text().trim();
                            } else if (columnName == "Drawdown") {
                                positionEntry[`Drawdown ${cell.find(".currency").text()}`] = cell.find(".V_DRAWDOWN").text().trim();
                                positionEntry[`Drawdown %`] = cell.find(".V_DRAWDOWNPERCENTAGE").text().trim();
                            } else if (columnName == "BE Run-up") {
                                positionEntry[`BE Run-up ${cell.find(".currency").text()}`] = cell.find(".V_BERUNUP").text().trim();
                                positionEntry[`BE Run-up %`] = cell.find(".V_BERUNUPPERCENTAGE").text().trim();
                            } else if (columnName == "Snapshots") {
                                positionEntry["Snapshots"] = position.positionSnapshots.map(snapshot => `${L.snapshotUrlPrefix}${snapshot.snapshotUrl}`).join(", ");
                            } else {
                                var value = position.columnValue(columnName) || null;
                                if (!value) {
                                    const input = cell.find('input, select, textarea').first();
                                    if (input.is(":checkbox")) {
                                        value = input.is(":checked") ? "true" : "false";
                                    } else {
                                        if (input.length > 0) {
                                            value = input.val();
                                        } else {
                                            value = cell.text().trim();
                                        }
                                    }
                                }

                                positionEntry[columnName] = value;
                            }
                        });

                        positionEntries.push(positionEntry);
                    });

                    L.dataOps.exportSessionStatistics(L.session.name, { userId: L.user.userId, sessionId: L.session.sessionId, positionEntries }).then(() => {
                        L.toast("Session statistics exported successfully!", 3000);
                    });
                } else {
                    L.messageBox("Usage info", "Please open the TestingView journal panel to export your session statistics.");
                    return;
                }
            } else {
                L.messageBox("Feature disabled", "Unable to export: please subscribe to a free plan or start a free trial on TestingView.com");
            }
        }
    });
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

L.temporaryOffset = function (exclusiveChart) {
    L.applyOnCharts(chart => {
        if(chart == exclusiveChart || !exclusiveChart) {
            const chartTimeScale = chart.getTimeScale();
            const rightOffset = chartTimeScale.rightOffset();
            chartTimeScale.defaultRightOffset().setValue(rightOffset);
            chartTimeScale.setRightOffset(-10);
        }
    });
}

L.undoTemporaryOffset = function (exclusiveChart, timeout) {
    timeout =  timeout || 3000;

    L.applyOnCharts(chart => {
        if(chart == exclusiveChart || !exclusiveChart) {
            setTimeout(() => {
                const chartTimeScale = chart.getTimeScale();
                chartTimeScale.setRightOffset(chartTimeScale.defaultRightOffset().readonly().value());
            }, timeout);
        }
    });
}

L.selectDate = async function (date, skipOffsetAlignment) {
    if(!skipOffsetAlignment) {
        L.temporaryOffset();
    }

    var currentDate = L.replayApi.currentDate().value();
    await L.replayApi.selectDate(date);

    L.selectDateStartTime = Date.now();
    while (currentDate == L.replayApi.currentDate().value()) {
        await L.delay(100);
        if((Date.now() - L.selectDateStartTime) > 10000) {
            break;
        }
    }

    if(!skipOffsetAlignment) {
        L.undoTemporaryOffset();
    }
}

L.selectDateWithWarmup = async function (timestamp) {
    if (L.session.getParameter(L.sessionParameterIds.EnableWarmupStart) == "true") {
        L.isWarmingUp = true;

        const symbolInfo = window.TradingViewApi.activeChart().chartModel().mainSeries().symbolInfo();
        const sessionStart = L.convertTimeToUnixTimestamp(symbolInfo.session);
        const sessionStartUtc = L.getUtcDate(sessionStart, symbolInfo.timezone).getTime() / 1000;
        
        const warmupStartOffset = Number(L.session.getParameter(L.sessionParameterIds.WarmupStartOffset));
        const timeSinceSessionStart = timestamp - sessionStart;
        const completedIntervals = Math.floor(timeSinceSessionStart / warmupStartOffset);
        const lastWarmupTimeframeClose = sessionStart + completedIntervals * warmupStartOffset;
        
        await L.selectDate(new Date(lastWarmupTimeframeClose * 1000));
        do {
            await L.delay(1000);
        } while(!L.replayInitialized);
        await L.skipTime(timestamp - lastWarmupTimeframeClose + 1, true, 1000);
        
        setTimeout(() => {
            L.isWarmingUp = false;
        }, 2000);
    } else {
        await L.selectDate(new Date(timestamp * 1000));
    }
}

L.exit = function (force, showConfirmation) {
    L.removeGeneratedShapes();
    var chartSaved = false;

    if (!force) {
        const saveService = TradingViewApi.getSaveChartService();
        saveService.chartSaved().subscribe(null, () => {
            clearTimeout(L.exitTimeout);
            L.exitTimeout = setTimeout(() => {
                chartSaved = true;
                if (showConfirmation) {
                    location.reload();
                }
            }, 500);
        });
        if (showConfirmation) {
            L.confirmBox("Exit TestingView mode", "Do you want to exit TestingView mode and refresh chart?", (ok) => {
                if(ok) {
                    L.messageBox("Saving chart..", "Please wait a moment.");
                    saveService.saveExistentChart();
                }
            });
        }
    } else {
        if (showConfirmation) {
            L.confirmBox("Exit TestingView mode", "Do you want to exit TestingView mode and refresh chart?", (ok) => {
                if (ok) {
                    location.reload();
                }
            });
        } else {
            location.reload();
        }
    }
}

/*
--------------------------------------
Positions List UI 
--------------------------------------
*/

L.updatePositionsList = function (reset) {
    if (L.isEbacktestingPanelOpen()) {
		L.session.meta.updatePositionListRequestCount = L.session.meta.updatePositionListRequestCount || 0;
		const updatePositionListRequestCount = ++L.session.meta.updatePositionListRequestCount;
        L.session.meta.sortByColumn = L.session.meta.sortByColumn || "Date/Time";

        if(reset) {
            $("div.replay_trading:not(.js-hidden) div.backtesting.deep-history .ka-icon.ka-icon-sort").remove();
            $("div.replay_trading:not(.js-hidden) div.backtesting.deep-history .V_POSITION").remove();
            $(`div.replay_trading:not(.js-hidden) div.backtesting.deep-history th.ka-thead-cell[column-name='${L.session.meta.sortByColumn}'] .ka-thead-cell-content-wrapper`).append(`<span class='ka-icon ka-icon-sort ka-icon-sort-arrow-${!L.session.meta.sortByDesc ? "up" : "down"}'></span>`);
        }
        
        const replayTradingButton = $("button[data-name='replay_trading']");
        clearTimeout(L.session.meta.showLoaderTimeout);
        L.session.meta.showLoaderTimeout = setTimeout(() => {
            replayTradingButton.text("TestingView *");
        }, 1500);

        var positionIndex = 0;
        L.asyncInterval(async() => {
            if (positionIndex >= L.session.positions.length || updatePositionListRequestCount < L.session.meta.updatePositionListRequestCount) {
                clearTimeout(L.session.meta.showLoaderTimeout);
                replayTradingButton.text("TestingView");
                return -1;
            }

            const position = L.session.positions[positionIndex];
            L.addToPositionList(position, !position.exitTime);
    
            if(reset) {
                delete position.meta.hash;
            }
            L.updatePositionUI(position);

            positionIndex++;
            await L.delay(30);
        }, 1);
    }
}

L.getColumnClass = function (column) {
    switch (column.columnType) {
        case "date":
        case "time":
        case "datetime":
        case "number": {
            return "rightAlign";
        }
        case "actions":
        case "bool": {
            return "centerAlign";
        }
        default: {
            return "leftAlign";
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
        if (column.columnType == "bool") {
            displayEdit = false;
            value = "<input type='checkbox' " + (value ? "checked" : "") + ">";
        } else if (column.columnType == "date" || column.columnType == "time" || column.columnType == "datetime") {
            value = (value || "").replace("T", " ");
        } else if (column.columnType == "number") {
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
        value = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'><path fill='currentColor' d='m21.45 7.55-1.8 1.8a.47.47 0 0 1-.67 0L14.65 5a.47.47 0 0 1 0-.66l1.8-1.8a1.88 1.88 0 0 1 2.65 0l2.35 2.35c.73.73.73 1.91 0 2.65ZM13.1 5.9 2.84 16.15l-.83 4.75a.94.94 0 0 0 1.1 1.09l4.74-.84L18.1 10.9a.47.47 0 0 0 0-.67L13.77 5.9a.47.47 0 0 0-.67 0Zm-6.25 9.37a.54.54 0 0 1 0-.77l6.01-6.01a.54.54 0 0 1 .78 0c.21.21.21.55 0 .77l-6.02 6.01a.54.54 0 0 1-.77 0Zm-1.41 3.29H7.3v1.42l-2.52.44-1.21-1.22.44-2.51h1.42v1.87Z'></path></svg>";
    }
    return value;
}

L.createHeaderCell = function (column) {
    var header = `<th class="ka-thead-cell ka-thead-background ka-pointer headCell ${L.getColumnClass(column)} ${column.visible ? '' : 'hidden'}" scope="col" column-name="${column.columnName}">`;
    if (column.columnName != "Trade") {
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
    var positionsContainer = $("div.replay_trading:not(.js-hidden) div.backtesting.deep-history");

    if (positionsContainer.length > 0) {
        if (!L.session.meta.positionsContainerCheckDate || (Date.now() - L.session.meta.positionsContainerCheckDate) > 2000) {
            L.session.meta.positionsContainerCheckDate = Date.now();
            if ($("button[data-name='replay_trading'][data-active='true']").length == 0) {
                $("div.testingview-positions-table").remove();
                return null;
            }
            positionsContainer.find("[class*='container']:has(div[class*='strategyGroup'])").hide();
            positionsContainer.find("div[class*='tabsContainer']").hide();
            positionsContainer.find("div[class*='container']:has(div[class*='title']):has(div[class*='text'])").hide();
        }

        if (!reset && positionsContainer.find(`table.ka-table[testingview-session=${L.session.sessionId}]`).length) {
            return positionsContainer;
        }

        $("div.testingview-positions-table").remove();
        positionsContainer.children().hide();

        const listStructure = $(`
          <div class="wrapper testingview-positions-table">
            <div class="ka root table">
              <div class="ka-table-wrapper tableWrapper">
                <table class="ka-table" data-selector="table" style="table-layout: auto;">
                  <thead class="ka-thead">
                    <tr class="ka-tr ka-thead-row">
                      <th class="ka-thead-cell ka-thead-background ka-pointer headCell fitContent centerAlign" scope="col">
                        <div class="ka-thead-cell-wrapper">
                            <div class="ka-thead-cell-content-wrapper">Trade</div>
                        </div>
                      </th>
                      ${L.session.sessionColumns.map(L.createHeaderCell).join("")}
                    </tr>
                  </thead>
                  <tbody class="ka-tbody">
                    <tr style="height: 0px;" class="positions-ui-first-row">
                      <td style="height: 0px;"></td>
                    </tr>
                    
                    <tr style="height: 0px;" class="positions-ui-last-row">
                      <td style="height: 0px;"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `);

        $(".ka-thead-cell-wrapper", listStructure).on("click", (e) => {
            L.sortPositions($(e.currentTarget).parents("th").attr("column-name"));
        });

        positionsContainer.append(listStructure);
        $(".testingview-positions-table table.ka-table").attr("testingview-session", L.session.sessionId);
        L.updatePositionsList(true);
    }

    return positionsContainer;
}

L.createPositionListCell = function (column) {
    switch (column.columnName) {
        case "Trade": {
            return `
                <td class="ka-cell cell noPadding justifyStart ${column.visible ? '' : 'hidden'}" column-name="Trade">
                    <div class="doubleCell">
                        <div class="cell V_STATUS" data-part="0"></div>
                        <div class="cell" data-part="1">Entry #DIRECTION#</div>
                    </div>
                </td>`;
        }
        case "Date/Time": {
            return `
                <td class="ka-cell cell noPadding justifyEnd ${column.visible ? '' : 'hidden'} rightAlign" column-name="Date/Time">
                    <div class="doubleCell">
                        <div class="cell date-cell V_EXITDATE" data-part="0"></div>
                        <div class="cell date-cell V_ENTRYDATE" data-part="1"></div>
                    </div>
                </td>`;
        }
        case "Price": {
            return `
                <td class="ka-cell cell noPadding justifyEnd ${column.visible ? '' : 'hidden'}" column-name="Price">
                    <div class="doubleCell">
                        <div class="cell" data-part="0">
                            <div class="tableCell twoRows">
                                <div class="currencyWrapper">
                                    <div class="value V_LATESTPRICE"></div>
                                    <div class="currency V_LATESTPRICECURRENCY">#SYMBOLCURRENCY#</div>
                                </div>
                                <div class="percentValue small"></div>
                            </div>
                        </div>
                        <div class="cell" data-part="1">
                            <div class="tableCell twoRows">
                                <div class="currencyWrapper">
                                    <div class="value">#ENTRYPRICE#</div>
                                    <div class="currency">#SYMBOLCURRENCY#</div>
                                </div>
                                <div class="percentValue small"></div>
                            </div>
                        </div>
                    </div>
                </td>`;
        }
        case "Risk": {
            return `
                <td class="ka-cell cell justifyStart ${column.visible ? '' : 'hidden'}" column-name="Risk">
                    <div class="tableCell twoRows ">
                        <div class="currencyWrapper">
                            <div class="value V_RISK"></div>
                            <div class="currency">#ACCOUNTCURRENCY#</div>
                        </div>
                        <div class="percentValue small"><span class="V_RISKPERCENTAGE"></span>%</div>
                    </div>
                </td>`;
        }
        case "Profit": {
            return `
                <td class="ka-cell cell justifyStart ${column.visible ? '' : 'hidden'}" column-name="Profit">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value V_PROFIT"></div>
                            <div class="currency">#ACCOUNTCURRENCY#</div>
                        </div>
                        <div class="percentValue small"><span class="V_PROFITPERCENTAGE"></span>%</div>
                    </div>
                </td>`;
        }
        case "Cumulative profit": {
            return `
                <td class="ka-cell cell justifyStart ${column.visible ? '' : 'hidden'}" column-name="Cumulative profit">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value V_CUMULATIVEPROFIT"></div>
                            <div class="currency">#ACCOUNTCURRENCY#</div>
                        </div>
                        <div class="percentValue small"><span class="V_CUMULATIVEPROFITPERCENTAGE"></span>%</div>
                    </div>
                </td>`;
        }
        case "Run-up": {
            return `
                <td class="ka-cell cell justifyStart ${column.visible ? '' : 'hidden'}" column-name="Run-up">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value V_RUNUP"></div>
                            <div class="currency">#ACCOUNTCURRENCY#</div>
                        </div>
                        <div class="percentValue small"><div class="V_RUNUPPERCENTAGE"></div>%</div>
                    </div>
                </td>`;
        }
        case "Drawdown": {
            return `
                <td class="ka-cell cell justifyStart ${column.visible ? '' : 'hidden'}" column-name="Drawdown">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value V_DRAWDOWN"></div>
                            <div class="currency">#ACCOUNTCURRENCY#</div>
                        </div>
                        <div class="percentValue small"><div class="V_DRAWDOWNPERCENTAGE"></div>%</div>
                    </div>
                </td>`;
        }
        case "BE Run-up": {
            return `
                <td class="ka-cell cell justifyStart ${column.visible ? '' : 'hidden'}" column-name="BE Run-up">
                    <div class="tableCell twoRows">
                        <div class="currencyWrapper">
                            <div class="value V_BERUNUP"></div>
                            <div class="currency">#ACCOUNTCURRENCY#</div>
                        </div>
                        <div class="percentValue small"><div class="V_BERUNUPPERCENTAGE"></div>%</div>
                    </div>
                </td>`;
        }
        case "Snapshots": {
            return `
                <td class="ka-cell cell justifyStart centerAlign ${column.visible ? '' : 'hidden'}" column-name="Snapshots">
                    <div class="snapshot-action-buttons">
                        <div data-role="button" class="view-snapshots-button apply-common-tooltip controls-button button isInteractive" title="View 0 snapshots" data-snapshots="0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" fill-rule="evenodd" d="M3.5 14S7.06 6 14 6c6.94 0 10.5 8 10.5 8S21 22 14 22 3.5 14 3.5 14Zm1.95.5-.27-.5A15.92 15.92 0 0 1 7.28 11C8.9 9.14 11.15 7.5 14 7.5c2.85 0 5.1 1.64 6.72 3.49a16.8 16.8 0 0 1 2.1 3.01 15.9 15.9 0 0 1-2.07 3.01c-1.62 1.85-3.87 3.49-6.75 3.49s-5.13-1.64-6.75-3.49a16.5 16.5 0 0 1-1.8-2.52Zm-.58.11ZM16.5 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.5 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"></path></svg>
                        </div>
                        <div data-role="button" class="take-snapshot-button apply-common-tooltip controls-button button isInteractive" title="Take a snapshot">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.118 6a.5.5 0 0 0-.447.276L9.809 8H5.5A1.5 1.5 0 0 0 4 9.5v10A1.5 1.5 0 0 0 5.5 21h16a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 21.5 8h-4.309l-.862-1.724A.5.5 0 0 0 15.882 6h-4.764zm-1.342-.17A1.5 1.5 0 0 1 11.118 5h4.764a1.5 1.5 0 0 1 1.342.83L17.809 7H21.5A2.5 2.5 0 0 1 24 9.5v10a2.5 2.5 0 0 1-2.5 2.5h-16A2.5 2.5 0 0 1 3 19.5v-10A2.5 2.5 0 0 1 5.5 7h3.691l.585-1.17z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0 1a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"></path></svg>
                        </div>
                        <div data-role="button" class="take-snapshot-loader apply-common-tooltip controls-button button isInteractive" style="display: none" title="Taking the snapshot...">
                            <svg class="testingview-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" d="M13.88 3.88a1.88 1.88 0 1 1-3.76 0 1.88 1.88 0 0 1 3.76 0ZM12 18.24A1.88 1.88 0 1 0 12 22a1.88 1.88 0 0 0 0-3.75Zm8.13-8.13a1.88 1.88 0 1 0 0 3.76 1.88 1.88 0 0 0 0-3.76ZM5.74 12A1.88 1.88 0 1 0 2 12a1.88 1.88 0 0 0 3.75 0Zm.5 3.87a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75Zm11.5 0a1.88 1.88 0 1 0 0 3.75 1.88 1.88 0 0 0 0-3.75ZM6.25 4.38a1.87 1.87 0 1 0 0 3.75 1.87 1.87 0 0 0 0-3.75Z"></path></svg>
                        </div>
                    </div>
                </td>`;
        }
        default: {
            return `
                <td class="ka-cell cell justifyStart ${L.getColumnClass(column)} ${column.visible ? '' : 'hidden'}" column-name="${column.columnName}">
                    <div class="V_VALUE"></div>
                </td>`;
        }
    }
}

L.addToPositionList = function (position, insertFirst) {
    if (L.isEbacktestingPanelOpen()) {
        var positionRowExists = L.cache.get(`positionRowExists-${position.positionId}-${L.session.meta.sortByColumn}-${L.session.meta.sortByDesc}`);
        if (!positionRowExists) {
            positionRowExists = ($(`tr#ID_${position.positionId}`).length == 1);
            L.cache.set(`positionRowExists-${position.positionId}`, positionRowExists, 3600); // Cache for 1 hour
        }

        if (!positionRowExists) {
            var positionStructure = `
            <tr class="ka-tr ka-row row V_POSITION" data="#INDEX#" id="ID_#ID#">
                <td class="ka-cell cell" column-name="Trade">
                <div class="V_INDEX">#INDEX#</div>
                <div class="action-buttons">
                    <div data-role="button" class="close-trade-button apply-common-tooltip controls-button button isInteractive" title="Close trade">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.9 12.63c.2.18.2.5 0 .68l-1.6 1.6a.48.48 0 0 1-.68 0L12 14.25 9.37 16.9a.48.48 0 0 1-.68 0l-1.6-1.6a.48.48 0 0 1 0-.68L9.75 12 7.1 9.37a.48.48 0 0 1 0-.68l1.6-1.6c.18-.19.49-.19.68 0L12 9.74l2.63-2.64c.18-.2.5-.2.68 0l1.6 1.6c.19.18.19.49 0 .68L14.26 12l2.64 2.63Z"></path>
                        </svg>
                    </div>
                    <div data-role="button" class="show-be-button apply-common-tooltip controls-button button isInteractive" title="Set BE level">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M12 3.94a8.06 8.06 0 1 1 0 16.12 8.06 8.06 0 0 1 0-16.12ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 6.77a3.23 3.23 0 1 0 0 6.46 3.23 3.23 0 0 0 0-6.46Z"></path>
                        </svg>
                    </div>
                    <div data-role="button" class="hide-be-button apply-common-tooltip controls-button button isInteractive" title="Remove BE level">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM6.68 13.61a.49.49 0 0 1-.49-.48v-2.26c0-.27.22-.48.49-.48h10.64c.27 0 .49.21.49.48v2.26c0 .27-.22.48-.49.48H6.68Z"></path>
                        </svg>
                    </div>
                </div>
                </td>
                ${L.session.sessionColumns.map(column => L.createPositionListCell(column)).join("")}
            </tr>
            `
                .replaceAll("#ID#", position.positionId)
                .replaceAll("#INDEX#", position.getIndex())
                .replaceAll("#DIRECTION#", position.getDirection())
                .replaceAll("#ORDERTYPE#", position.getOrderType())
                .replaceAll("#ENTRYPRICE#", position.getEntryPrice())
                .replaceAll("#SYMBOLCURRENCY#", position.getSymbolCurrency())
                .replaceAll("#ACCOUNTCURRENCY#", L.session.currencyId)
                ;

            L.optimizePositionsList();

            if(insertFirst) {
                $(".positions-ui-first-row").after($(positionStructure));
            } else {
                $(".positions-ui-last-row").before($(positionStructure));
            }

            $(`tr#ID_${position.positionId}`).on("click", () => { L.onSelectPositionRow(position) });
            $(`tr#ID_${position.positionId}`).on("dblclick", (e) => { L.onDblClickPositionRow(e, position) });
            $(`tr#ID_${position.positionId} .action-buttons .close-trade-button`).on("click", () => { L.onCloseTradeButtonClick(position) });
            $(`tr#ID_${position.positionId} .action-buttons .show-be-button`).on("click", () => { L.onShowBEButtonClick(position) });
            $(`tr#ID_${position.positionId} .action-buttons .hide-be-button`).on("click", () => { L.onHideBEButtonClick(position) });
            $(`tr#ID_${position.positionId} .date-cell`).on("click", (e) => { L.onDateCellClick(e, position) });
            $(`tr#ID_${position.positionId} .view-snapshots-button`).on("click", (e) => { L.viewSnapshots(e, position) });
            $(`tr#ID_${position.positionId} .take-snapshot-button`).on("click", async (e) => { await L.takeSnapshot(e, position) });
            $(`tr#ID_${position.positionId} td[column-name] div`).on("click", (e) => { L.onEditField(e, position) });

            if (position.bePrice()) {
                $(`tr#ID_${position.positionId}.V_POSITION .action-buttons .show-be-button`).hide();
                $(`tr#ID_${position.positionId}.V_POSITION .action-buttons .hide-be-button`).show();
            } else {
                $(`tr#ID_${position.positionId}.V_POSITION .action-buttons .show-be-button`).show();
                $(`tr#ID_${position.positionId}.V_POSITION .action-buttons .hide-be-button`).hide();
            }

        }
    }
}

L.optimizePositionsList = function() {
    $(".positions-ui-first-row").parents(".ka-table-wrapper.tableWrapper").scrollTop(0);

    const wrapper = $('.ka-table-wrapper.tableWrapper');
    const allRows = wrapper.find('tr.V_POSITION');
    const maxVisibleRows = 20;

    if (allRows.length <= maxVisibleRows) {
        return;
    }

    allRows.each((index, row) => {
        row = $(row);
        if(index > 20) {
            row.addClass('hidden');
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
                const isHidden = row.hasClass('hidden');
                
                if (scrollHeight - scrollTop - viewportHeight < 500 && isHidden) {
                    row.removeClass('hidden');
                    return false;
                }
            });
        }, 50);
    });

    // Initial optimization
    wrapper.trigger('scroll.optimize');
}

L.messageBox = function (title, content, callback) {
    TradingViewApi.showNoticeDialog({ title: title, body: content, callback: callback });
}

L.confirmBox = function (title, content, callback) {
    //callback is (answer: bool) => { if(answer) { ... } }
    TradingViewApi.showConfirmDialog({ title: title, body: content, callback: callback });
}

L.toast = function(message, timeout, type) {
    type = type || "info";

    L.applyOnCharts(c => c.chartWidget()._hideHint());
    const chartWidget = TradingViewApi.activeChart().chartWidget();
    
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
}

L.isEbacktestingPanelOpen = function() {
    const cacheKey = "isEbacktestingPanelOpen";
    
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const isOpen = $("div.replay_trading:not(.js-hidden) div.backtesting.deep-history").length == 1;
    L.cache.set(cacheKey, isOpen, 2);
    return isOpen;
}

L.updatePositionUI = function (position) {
    if (L.isEbacktestingPanelOpen()) {
        const currentHash = JSON.stringify({...position, ...position.meta, hash: undefined, index: undefined });

        if (position.meta.hash === currentHash) {
            return;
        }

        position.meta.hash = currentHash;

        const positionElement = $(`#ID_${position.positionId}.V_POSITION`);
        if (positionElement.length) {
            positionElement.find(".action-buttons").addClass(position.exitTime ? "" : "openTrade").removeClass(position.exitTime ? "openTrade" : "");
            positionElement.find(".V_INDEX").addClass(position.exitTime ? "" : "openTrade").removeClass(position.exitTime ? "openTrade" : "");

            const activeChart = window.TradingViewApi.activeChart();

            for (const column of L.session.sessionColumns) {
                switch (column.columnName) {
                    case "Trade": {
                        positionElement.find(".V_STATUS").addClass(position.exitTime ? "" : "openTrade").removeClass(position.exitTime ? "openTrade" : "").text(position.getStatus());
                        break;
                    }
                    case "Date/Time": {
                        positionElement.find(".V_EXITDATE").addClass(position.exitTime ? "" : "openTrade").removeClass(position.exitTime ? "openTrade" : "").text(position.getExitDate(activeChart));
                        positionElement.find(".V_ENTRYDATE").text(position.getEntryDate(activeChart));
                        break;
                    }
                    case "Price": {
                        positionElement.find(".V_LATESTPRICE").addClass(position.exitTime ? "" : "openTrade").removeClass(position.exitTime ? "openTrade" : "").text(position.getLatestPrice());
                        positionElement.find(".V_LATESTPRICECURRENCY").addClass(position.exitTime ? "" : "openTrade").removeClass(position.exitTime ? "openTrade" : "");
                        break;
                    }
                    case "Lots": {
                        positionElement.find("td[column-name='Lots'] .V_VALUE")
                            .text(position.getQuantity())
                            .attr('title', `Leverage: ${position.getLeverage()}x`);
                        break;
                    }
                    case "Risk": {
                        positionElement.find(".V_RISK").text(position.getRisk());
                        positionElement.find(".V_RISKPERCENTAGE").text(position.getRiskPercentage());
                        break;
                    }
                    case "Profit": {
                        positionElement.find(".V_PROFIT").text(position.getProfit());
                        positionElement.find(".V_PROFITPERCENTAGE").text(position.getProfitPercentage());
                        break;
                    }
                    case "Cumulative profit": {
                        positionElement.find(".V_CUMULATIVEPROFIT").text(position.getCumulativeProfit());
                        positionElement.find(".V_CUMULATIVEPROFITPERCENTAGE").text(position.getCumulativeProfitPercentage());
                        break;
                    }
                    case "Run-up": {
                        positionElement.find(".V_RUNUP").text(position.getRunUp());
                        positionElement.find(".V_RUNUPPERCENTAGE").text(position.getRunUpPercentage());
                        break;
                    }
                    case "Drawdown": {
                        positionElement.find(".V_DRAWDOWN").text(position.getDrawDown());
                        positionElement.find(".V_DRAWDOWNPERCENTAGE").text(position.getDrawDownPercentage());
                        break;
                    }
                    case "BE Run-up": {
                        positionElement.find(".V_BERUNUP").text(position.getBERunUp());
                        positionElement.find(".V_BERUNUPPERCENTAGE").text(position.getBERunUpPercentage());
                        break;
                    }
                    case "Snapshots": {
                        positionElement.find(".view-snapshots-button").attr("data-snapshots", position.positionSnapshots.length);
                        positionElement.find(".view-snapshots-button").attr("title", `View ${position.positionSnapshots.length > 1 ? position.positionSnapshots.length + " " : ""}snapshot${position.positionSnapshots.length > 1 ? "s" : ""}`);
                        break;
                    }
                    default: {
                        positionElement.find(`td[column-name='${column.columnName}'] .V_VALUE`).html(L.toJournalDisplayFormat(position, column));
                        break;
                    }
                }
            }
        }
    }
}

L.sortPositions = function (field) {
    const comparePosition = function (position1, position2, valueFunction) {
        const a = valueFunction(position1);
        const b = valueFunction(position2);
        var valueComparison = 0;

        // Treat null or undefined as smaller than any defined value
        const isANullish = a === null || a === undefined;
        const isBNullish = b === null || b === undefined;

        if (isANullish && !isBNullish) { valueComparison = -1; }
        else if (!isANullish && isBNullish) { valueComparison = 1; }
        else if (a < b) { valueComparison = -1; }
        else if (a > b) { valueComparison = 1; }

        L.session.meta.sortByColumn = field;

        return (position2.exitTime ? 1 : 0) - (position1.exitTime ? 1 : 0)
            || (L.session.meta.sortByDesc ? -valueComparison : valueComparison)
            || (L.session.meta.sortByDesc ? (position2.index - position1.index) : (position1.index - position2.index));
    }

    if (L.session.positions.length > 1 && field) {
        if (L.session.meta.sortByColumn == field) {
            L.session.meta.sortByDesc = !L.session.meta.sortByDesc;
        }
        const accessors = {
            "Trade": p => p.getDirection(),
            "Date/Time": p => p.entryTime,
            "Price": p => p.entryPrice,
            "Lots": p => Math.abs(p.quantity),
            "Risk": p => p.getRisk(),
            "Profit": p => p.getProfitPercentage(),
            "Cumulative profit": p => p.getCumulativeProfit(),
            "Run-up": p => p.getRunUpPercentage(),
            "Drawdown": p => p.getDrawDownPercentage(),
            "BE Run-up": p => p.getBERunUpPercentage()
        };

        const accessor = accessors[field];

        if (accessor) {
            L.session.positions.sort((a, b) => comparePosition(a, b, accessor));
        } else {
            const column = L.session.sessionColumns.find(c => c.columnName === field);
            if (column?.sortable) {
                L.session.positions.sort((a, b) => comparePosition(a, b, p => p.columnValue(field)));
            }
        }
    }
    L.updatePositionsList(true);
}

/*
--------------------------------------
Event Handlers
--------------------------------------
*/

L.onBarActivity = async function () {
    var firstChart;
    for (const chart of L.getCharts()) {
        L.setHistory(chart);
        if(!firstChart) {
            firstChart = chart;
        }
    }

    await L.detectEntries();
    L.session.assessPositionsTracking();
    await L.updateActivePositions();
    L.updatePositionsList();
    await L.stopAtPredefinedTime();
    L.session.meta.lastKnownBarTime = firstChart.priceHistoryEntries[firstChart.priceHistoryEntries.length - 1]?.time;
}

L.onSymbolChanged = async function (chart, symbolInfo) {
    if(L.session) {
        L.changingSymbol = true;

        L.temporaryOffset(chart);
        const barsSnapshot = chart.chartModel().mainSeries().bars()._items.map(b => b.value.join()).join();

        chart.barsHistoryEntries = [];
        chart.priceHistoryEntries = [];
        L.symbolChangedStartTime = Date.now();
        while (chart.chartModel().mainSeries().bars()._items.length == 0 || chart.chartModel().mainSeries().bars()._items.map(b => b.value.join()).join() == barsSnapshot) {
            await L.delay(100);
            if((Date.now() - L.symbolChangedStartTime) > 10000) {
                break;
            }
        }

        L.undoTemporaryOffset(chart, 1000);
        L.changingSymbol = false;
    }
}

L.onChartIntervalChanged = async function (chart, interval) {
    L.session.meta.canDetectEntries = false;

    if (L.session && L.session.getParameter(L.sessionParameterIds.PreventHTFCandlePreviews) == 'true') {
        const timeframeSeconds = chart.timeframeSeconds;
        const barsSnapshot = chart.chartModel().mainSeries().bars()._items.map(b => b.value.join()).join();
        //L.toast("Jumping to accurate candle state to avoid HTF preview...", 3000);
        L.temporaryOffset();
    
        L.replayTo = L.session.currentDate;
        L.stopSkipping();

        chart.barsHistoryEntries = [];
        chart.priceHistoryEntries = [];

        L.chartIntervalChangedStartTime = Date.now();
        while (timeframeSeconds == chart.timeframeSeconds || chart.chartModel().mainSeries().bars()._items.length == 0 || chart.chartModel().mainSeries().bars()._items.map(b => b.value.join()).join() == barsSnapshot) {
            await L.delay(100);
            L.getCharts();
            if((Date.now() - L.chartIntervalChangedStartTime) > 10000) {
                break;
            }
        }

        const barInfo = L.getCurrentBarInfo(chart);
        if (barInfo.time + chart.timeframeSeconds - 1 != L.session.currentDate) {
            var selectedDate = barInfo.time - 1;
            if (selectedDate > L.session.currentDate) {
                selectedDate = L.replayTo - chart.timeframeSeconds;
            }
            if (selectedDate < L.replayTo - chart.timeframeSeconds) {
                selectedDate = L.replayTo - chart.timeframeSeconds;
            }

            await L.selectDate(new Date(selectedDate * 1000), true);
            L.undoTemporaryOffset();

            if (await L.skipTime(L.replayTo - L.replayApi.currentDate().value(), true, 500)) {
                L.replayTo = null;
            }
        } else {
            L.undoTemporaryOffset(null, 1000);
        }
    } 
    
    setTimeout(() => {
        L.session.meta.canDetectEntries = true;
    }, 2000);
}

/*
--------------------------------------
Data processing
--------------------------------------
*/

L.saveSessionColumns = function (sessionId, columns) {
    const defaultColumns = [
        { columnName: "Trade", columnType: "actions", sortable: false, visible: true },
        { columnName: "Date/Time", columnType: "datetime", sortable: true, visible: true },
        { columnName: "Price", columnType: "number", sortable: true, visible: true },
        { columnName: "Symbol", columnType: "text", sortable: true, visible: false },
        { columnName: "Lots", columnType: "number", sortable: true, visible: true },
        { columnName: "Risk", columnType: "number", sortable: true, visible: true },
        { columnName: "Profit", columnType: "number", sortable: true, visible: true },
        { columnName: "Cumulative profit", columnType: "number", sortable: true, visible: false },
        { columnName: "Run-up", columnType: "number", sortable: true, visible: true },
        { columnName: "Drawdown", columnType: "number", sortable: true, visible: true },
        { columnName: "BE Run-up", columnType: "number", sortable: true, visible: false },
        { columnName: "Snapshots", columnType: "actions", sortable: false, visible: true },
        { columnName: "Notes", columnType: "richtext", sortable: false, visible: true },
        { columnName: "Analysis Time", columnType: "time", sortable: true, visible: true }
    ];

    if(!columns) {
        columns = [];
    }

    for (const defaultColumn of defaultColumns) {
        const column = columns.find(c => c.columnName == defaultColumn.columnName);
        if (!column) {
            columns.push(defaultColumn);
        } else {
            column.sortable = column.sortable ?? defaultColumn.sortable;
            column.columnType = column.columnType ?? defaultColumn.columnType;
        }
    }

    return L.dataOps.saveSessionColumns(sessionId, columns);
}

L.getDateInTimezone = function (timestamp, timezone) {
    const date = new Date(timestamp * 1000);

    // Get UTC offset in minutes
    const tzOffsetMinutes = L.getUTCOffsetInMinutes(timezone, date);

    // Apply offset to create a new adjusted Date object
    return new Date(date.getTime() + tzOffsetMinutes * 60 * 1000);
}

L.getUtcDate = function (timestamp, timezone) {
    const date = new Date(timestamp * 1000);

    // Get UTC offset in minutes
    const tzOffsetMinutes = L.getUTCOffsetInMinutes(timezone, date);

    // Apply offset to create a new adjusted Date object
    return new Date(date.getTime() - tzOffsetMinutes * 60 * 1000);
}

L.getUTCOffsetInMinutes = function (timezone, date) {
    const cacheKey = `getUTCOffsetInMinutes-${timezone}-${date}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const options = { timeZone: timezone, timeZoneName: "longOffset" };
    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);

    const offsetPart = parts.find(part => part.type === "timeZoneName");
    if (offsetPart) {
        const match = offsetPart.value.match(/([+-]\d{2}):(\d{2})/);
        if (match) {
            const offsetMinutes = parseInt(match[1]) * 60 + parseInt(match[2]); // Convert to minutes
            L.cache.set(cacheKey, offsetMinutes, 3600); // Cache for 1 hour
            return offsetMinutes;
        }
    }
    L.cache.set(cacheKey, 0, 3600); // Cache default UTC offset for 1 hour
    return 0; // Default to UTC if parsing fails
}

L.toTradingViewDateTimeFormat = function (timestamp, timezone, chart) {
    if (!chart) {
        chart = L.getCharts()[0];
    }

    if (!timezone) {
        timezone = chart.getTimezone();
    }

    const cacheKey = `toTradingViewDateTimeFormat-${timestamp}-${timezone}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    if (L.isDate(timestamp)) {
        timestamp = timestamp.getTime() / 1000;
    } else if (!L.isNumber(timestamp)) {
        timestamp = new Date(timestamp) / 1000;
    }

    const date = L.getDateInTimezone(timestamp, timezone);
    let formatterChart = chart;
    if (!formatterChart.chartModel().dateTimeFormatter()._timeFormatter) {
        const charts = L.getCharts();
        for (const c of charts) {
            if (c.chartModel().dateTimeFormatter()._timeFormatter) {
                formatterChart = c;
                break;
            }
        }
    }
    const timeFormatter = formatterChart.chartModel().dateTimeFormatter()._timeFormatter;
    if(timeFormatter) {
        timeFormatter._valuesAndDelimeters = ["%h",":","%m", ":", "%s"];
    }

    const formattedDate = formatterChart.chartModel().dateTimeFormatter().format(date);

    L.cache.set(cacheKey, formattedDate, 3600); // Cache for 1 hour
    return formattedDate;
}

L.getNextDateTime = function(time) {
    var [hours, minutes] = time.split(":").map(Number);
    var timeNow = new Date();
    var timeNowInTimezone = L.getDateInTimezone(timeNow /1000, TradingViewApi.activeChart().getTimezone());

    hours = hours - (timeNowInTimezone.getUTCHours() - timeNow.getHours());
    minutes = minutes - (timeNowInTimezone.getUTCMinutes() - timeNow.getMinutes());

    const symbolInfo = TradingViewApi.activeChart().chartModel().mainSeries().symbolInfo();
    const sessionStr = symbolInfo.session;
    let sessions = [];
    
    sessionStr.split('|').forEach(s => {
        const [time, days] = s.split(':');
        const [start, end] = time.split('-');
        
        if (days) {
            for(const day of days) {
                sessions.push({
                    day: parseInt(day) - 1,
                    startHour: parseInt(start.substring(0, 2)),
                    startMinute: parseInt(start.substring(2)),
                    endHour: parseInt(end.substring(0, 2)),
                    endMinute: parseInt(end.substring(2))
                });
            }
        } else {
            const existingDays = sessions.map(s => s.day);
            for (let d = 1; d <= 5; d++) {
                if (!existingDays.includes(d)) {
                    sessions.push({
                        day: d,
                        startHour: parseInt(start.substring(0, 2)),
                        startMinute: parseInt(start.substring(2)),
                        endHour: parseInt(end.substring(0, 2)),
                        endMinute: parseInt(end.substring(2))
                    });
                }
            }
        }
    });

    let nextDate = L.getDateInTimezone(L.session.currentDate, TradingViewApi.activeChart().getTimezone());
    let found = false;
    let maxAttempts = 30; 

    while (!found && maxAttempts > 0) {
        
        nextDate.setHours(hours, minutes, 0, 0);
        
        if (nextDate.getTime() / 1000 <= L.session.currentDate) {
            // Move to next day if time is in the past
            nextDate.setDate(nextDate.getDate() + 1);
            continue;
        }

        // Check if this day & time is within market hours
        const dayOfWeek = nextDate.getDay() || 7; // Convert Sunday from 0 to 7
        const session = sessions.find(s => s.day === dayOfWeek);

        if (session) {
            found = true;
        }

        if (!found) {
            nextDate.setDate(nextDate.getDate() + 1);
        }
        maxAttempts--;
    }

    if(found) {
        return nextDate;
    }
}

L.resolutionToSeconds = function (resolution) {
    if (resolution.endsWith("T")) return parseInt(resolution);   // Convert ticks to seconds
    else if (resolution.endsWith("S")) return parseInt(resolution);   // Get the seconds
    else if (resolution.toLocaleLowerCase().endsWith("h")) return parseInt(resolution) * 60 * 60;   // Convert hours to seconds
    else if (resolution.endsWith("D")) return parseInt(resolution) * 1440 * 60; // Convert days to seconds
    else if (resolution.endsWith("W")) return parseInt(resolution) * 10080 * 60; // Convert weeks to seconds
    else if (resolution.endsWith("M") && resolution.length > 1) return parseInt(resolution) * 43200 * 60; // Convert months to seconds
    else if (!isNaN(resolution)) return parseInt(resolution) * 60;              // Convert minutes to seconds
    else return 0; // unknown
};

L.resolutionToFriendlyText = function (resolution) {
    if (resolution.endsWith("T")) return resolution.replace("T", "t");
    else if (resolution.endsWith("S")) return resolution.replace("S", "s");
    else if (!isNaN(resolution)) return resolution + "m";
    else return resolution;
}

L.formatLocalTime = function(seconds) {
    const chart = TradingViewApi.activeChart();
    return chart.chartModel().timeFormatter().format(L.getDateInTimezone(seconds, chart.getTimezone()));
}

L.formatTimestamp = function (seconds) {
    const m = ~~((seconds % 3600) / 60);
    const s = seconds % 60;

    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

L.calculateProfit = function (position, currentPrice) {
    return (currentPrice - position.entryPrice) * position.quantity * position.symbol.meta.contractSize * position.entryCurrencyRate * position.symbol.meta.pointSize;
}

L.getBalanceAfterPositions = async function (initialBalance, positions, session) {
    positions = positions.slice().sort((a, b) => a.exitTime - b.exitTime);

    for (const position of positions) {
        Object.defineProperty(position.symbol, 'meta', { value: {}, writable: true, enumerable: false });
        L.setPositionFunctions(position);
        if (!position.symbol.meta.contractSize) {
            position.symbol.meta.contractSize = (await L.getContractSize(position.symbol.symbolName, position.symbol.symbolType)).contractSize;
        }

        if (!position.symbol.meta.pointSize) {
            position.symbol.meta.pointSize = (await L.getContractSize(position.symbol.symbolName, position.symbol.symbolType)).pointSize;
        }

        position.meta.initialBalance = initialBalance;
        if (position.exitTime) {
            position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);
            initialBalance += position.getProfit(true, session);
        } else {
            if (L.session?.sessionSymbolLastPrices) {
                position.meta.currentPrice = L.session.sessionSymbolLastPrices.find(p => p.symbolId == position.symbol.symbolId).lastPrice;
                position.meta.profit = position.getProfitAtPrice(position.meta.currentPrice, true);
            }
        }
    }

    return initialBalance;
}

L.convertTimeToUnixTimestamp = function (timeStr) {
    // Extract the first word (should be HHMM format)
    const match = timeStr.match(/^\d{4}/); // Matches 4-digit numbers at the start

    if (!match) {
        return null;
    }

    const time = match[0]; // Extracted 4-digit time
    const hours = parseInt(time.substring(0, 2), 10);
    const minutes = parseInt(time.substring(2, 4), 10);

    // Validate if the extracted value is a valid time (00:00 - 23:59)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }

    // Get today's date
    const now = new Date(0);
    now.setUTCHours(hours, minutes, 0, 0); // Set the extracted time (HH:MM:00)

    // Convert to Unix timestamp (seconds)
    const unixTimestamp = Math.floor(now.getTime() / 1000);

    return unixTimestamp;
}

L.getContractSize = async function (symbolName, symbolType) {
    const cacheKey = `getContractSize-${symbolName}-${symbolType}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    } else {
        var symbolRuleContractSizes = await L.dataOps.getSymbolRuleContractSizes(symbolType);
        for (const rule of symbolRuleContractSizes) {
            if (rule.symbolNameRegex) {
                var regex = new RegExp(rule.symbolNameRegex);
                if (regex.test(symbolName)) {
                    L.cache.set(`getContractSize-${symbolName}-${symbolType}`, rule, 3600);
                    return rule;
                }
            } else {
                return rule;
            }
        }
    }
}

L.setSessionFunctions = function (session) {
    session.retrieveParameters = async function () {
        session.sessionParameters = await L.dataOps.getSessionParameters(L.session.sessionId);
    };

    session.getParameter = function (parameterId) {
        return session.sessionParameters?.find(p => p.parameterId == parameterId)?.parameterValue || "";
    };

    session.setParameter = function (parameterId, value) {
        L.dataOps.setSessionParameterValue(L.session.sessionId, parameterId, value);
        if (!session.sessionParameters) {
            session.sessionParameters = [{ parameterId, parameterValue: value }];
        }

        const param = session.sessionParameters.find(p => p.parameterId == parameterId);
        if (param) {
            param.parameterValue = value;
        }
    };
    session.getActivePositions = function () {
        return (L.session?.positions || []).filter(p => !p.exitTime);
    };
    session.stopAssessTracking = function () {
        for (const position of L.session.positions) {
            position.meta.trackRunUp = false;
            position.meta.trackDrawDown = false;
            position.meta.trackBeRunUp = false;
        }
    };
    session.assessPositionsTracking = async function() {
        for (const position of L.session.positions) {
            if(position.meta.trackRunUp || position.meta.trackDrawDown || position.meta.trackBeRunUp) {
                const cacheKey = `getPositionChart-${position.symbol.symbolId}`;

                var chart = L.cache.get(cacheKey);
                if(!chart) {
                    chart = L.getPositionChart(position, true);
                    L.cache.set(cacheKey, chart, 5);
                }

                if(chart) {
                    var bar = chart.priceHistoryEntries[chart.priceHistoryEntries.length - 1];
                    L.assessTracking(position, bar);

                    bar = chart.barsHistoryEntries[chart.barsHistoryEntries.length - 1];
                    L.assessTracking(position, bar);
                }
            }
        }
    }
}

L.isNumber = function (value) {
    return typeof value === "number" && !isNaN(value);
}

L.isDate = function (value) {
    return value instanceof Date && !isNaN(value.getTime());
}

/*
--------------------------------------
Operations
--------------------------------------
*/

L.getReplayResolutions = async function () {
    var availableReplayResolutions = L.replayApi.replayResolutions().value().filter(r => r);
    L.getReplayResolutionsStartTime = Date.now();
    while (!availableReplayResolutions.length) {
        await L.delay(100);
        availableReplayResolutions = L.replayApi.replayResolutions().value().filter(r => r);
        if((Date.now() - L.getReplayResolutionsStartTime) > 10000) {
            break;
        }
    }

    return availableReplayResolutions;
}

L.selectResolution = async function (seconds, resolutionSelectionDelay) {
    const availableReplayResolutions = await L.getReplayResolutions();
    var replayResolution = L.session.getParameter(L.sessionParameterIds.MinReplayResolution);
    if(!replayResolution) {
        replayResolution = availableReplayResolutions.find(r => L.resolutionToSeconds(r) >= 60) || availableReplayResolutions[0];
    }

    for (const resolution of availableReplayResolutions) {
        if (L.resolutionToSeconds(resolution) == seconds) {
            replayResolution = resolution;
            break;
        }
    }

    L.replayApi.changeReplayResolution(replayResolution);
    L.replayApi.autoReplayResolution().setValue(replayResolution);
    if(resolutionSelectionDelay) {
        await L.delay(resolutionSelectionDelay);
    }
    return replayResolution;
}

L.skipTime = async function (seconds, nonStop, resolutionSelectionDelay) {
    var skipped = true;

    L.session.meta.canDetectEntries = true;
    L.isSkippingCandles = true;
    $(".play-pause-button.play").hide();
    $(".play-pause-button.pause").show();

    if(seconds) {
        var currentTimestamp = L.replayApi.currentDate().value();
        const minReplayResolution = await L.selectResolution(0, resolutionSelectionDelay);

        var skipBySeconds = L.resolutionToSeconds(minReplayResolution);
        var targetTimestamp = 0;

        if (nonStop) {
            targetTimestamp = currentTimestamp + seconds;
        }
        else {
            var hasChart = false;

            for (const chart of L.getCharts()) {
                if (chart.timeframeSeconds == seconds) {
                    targetTimestamp = chart.chartModel().mainSeries().bars().last().value[0] + seconds;
                    hasChart = true;
                    break;
                }
            }

            if (!hasChart) {
                const symbolInfo = window.TradingViewApi.activeChart().chartModel().mainSeries().symbolInfo();
                const sessionStart = L.convertTimeToUnixTimestamp(symbolInfo.session);
                const sessionStartUtc = L.getUtcDate(sessionStart, symbolInfo.timezone).getTime() / 1000;
                targetTimestamp = currentTimestamp + (seconds - ((currentTimestamp - sessionStartUtc) % seconds));
            }

            while (currentTimestamp + skipBySeconds >= targetTimestamp) {
                targetTimestamp += seconds;
            }

            // if (hasChart && currentTimestamp == targetTimestamp - seconds - 1) {
            //     var chartResolution = await L.selectResolution(seconds, 1000); //this may cause indicators to reload. Check back in 6 months: 24-09-2025
            //     skipBySeconds = L.resolutionToSeconds(chartResolution);
            // }
        }

        while (currentTimestamp + skipBySeconds <= targetTimestamp) {
            if (L.isSkippingCandles) {
                await L.replayApi.doStep();
            }
            else {
                skipped = false;
                break;
            }

            currentTimestamp = L.replayApi.currentDate().value();
        }
    } else {
        await L.replayApi.doStep();
    }

    $(".play-pause-button.play").show();
    $(".play-pause-button.pause").hide();
    L.isSkippingCandles = false;

    return skipped;
}

L.startAutoplay = async function () {
    if (L.replayApi.isAutoplayStarted().value()) {
        L.replayApi.toggleAutoplay();
    }

    if (!L.session.meta.autoplayStarted) {
        L.session.meta.autoplayStarted = true;
        while (L.session.meta.autoplayStarted) {
            await L.replayApi.doStep();
        }
    }
}

L.stopAutoPlay = function () {
    L.session.meta.autoplayStarted = false;

    if (L.replayApi.isAutoplayStarted().value()) {
        L.replayApi.toggleAutoplay();
    }
}

L.startSkipping = function () {
    L.startAutoplay();

    $(".play-pause-button.play").hide();
    $(".play-pause-button.pause").show();
    L.session.meta.canDetectEntries = true;
}

L.stopSkipping = function () {
    L.stopAutoPlay();

    $(".play-pause-button.pause").hide();
    $(".play-pause-button.play").show();
    L.isSkippingCandles = false;
}

L.stopAtPredefinedTime = async function () {
    if(L.isSkippingCandles) {
        return false;
    }

    if(!(L.session.meta.autoplayStarted || L.replayApi.isAutoplayStarted().value())) {
        return false;
    }

    if(L.session.getParameter(L.sessionParameterIds.EnablePredefinedTimes) != "true") {
        return false;
    }

    if(L.session.currentDate <= (L.session.meta.latestPredefinedTime || 0)) {
        return false;
    }

    var isNearPredefinedTime = false;

    const predefinedTimes = L.session.getParameter(L.sessionParameterIds.PredefinedTimes).split(",").map(t => t.trim()).filter(t => t.length > 0);
    const chart = L.getCharts()[0];

    var minResolution = L.session.getParameter(L.sessionParameterIds.MinReplayResolution);
    if(!minResolution) {
        const availableReplayResolutions = await L.getReplayResolutions();
        minResolution = availableReplayResolutions.find(r => L.resolutionToSeconds(r) >= 60) || availableReplayResolutions[0];
    }

    var minReplayResolution = L.resolutionToSeconds(minResolution);

    const formattedLastKnownBarTime = L.formatLocalTime(L.session.meta.lastKnownBarTime);
    const formattedLatestBarTime = L.formatLocalTime(chart.priceHistoryEntries[chart.priceHistoryEntries.length - 1].time + minReplayResolution * 4);

    if (predefinedTimes.length > 0) {
        for (const time of predefinedTimes) {
            if (formattedLastKnownBarTime < time && time <= formattedLatestBarTime) {
                L.toast(`Auto stopping candle playback at ${time}`, 3000);
                L.stopSkipping();
                L.session.meta.autoStopRetries = 5;
                L.asyncInterval(async () => {
                    if(L.session.meta.autoStopRetries-- < 0) {
                        return -1;
                    }

                    if(L.session.meta.forceStopPlayback) {
                        return -1;
                    }

                    if(L.formatLocalTime(L.session.currentDate + 1) < time) {           
                        await L.skipTime(minReplayResolution, false, 500);
                    } else {
                        // if (L.session?.sessionId && L.session?.currentDate) {
                        //     L.sessionChannel.postMessage({
                        //         type: 'DATE-SYNC',
                        //         sessionId: L.session.sessionId,
                        //         currentDate: L.session.currentDate
                        //     });
                        // }
                        L.session.meta.latestPredefinedTime = L.session.currentDate + minReplayResolution * 4;
                        return -1;
                    }
                }, 500, 1.1);
                
                isNearPredefinedTime = true;
                break;
            }
        }
    }

    return isNearPredefinedTime;
}

L.gotoTime = function (utcTime) {
    L.applyOnCharts(chart => chart.chartModel().gotoTime(L.getDateInTimezone(utcTime, chart.getTimezone())));
}

L.delay = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

L.asyncInterval = async function (callback, delay, decay) {
    const sessionId = L.session?.sessionId || 0;
    var adjustedDelay = delay;

    while (L.session?.sessionId === sessionId) {
        await L.delay(adjustedDelay);
        try {
            const r = await callback();
            if(r === -1) {
                break;
            }
        } catch (e) {
            console.warn("Error while executing timer", e);
        }

        if(decay) {
            adjustedDelay *= decay;
            if(adjustedDelay > delay * 2) {
                adjustedDelay = delay * 2;
            }
            if(adjustedDelay < delay / 2) {
                adjustedDelay = delay / 2;
            }
        }
    }
}

L.tryExec = function (func, surpressError) {
    try {
        return func();
    } catch (e) {
        if (!surpressError) {
            console.warn(e);
        }
    }
}

L.changeSymbol = async function (chart, symbolName) {
    chart.changingSymbol = true;
    await chart.setSymbol(symbolName);
    L.changeSymbolStartTime = Date.now();
    while (chart.changingSymbol) {
        await L.delay(100);
        if((Date.now() - L.changeSymbolStartTime) > 10000) {
            break;
        }
    }
}

L.isTyping = function () {
    const activeElement = document.activeElement;
    if (activeElement.tagName.toUpperCase() == 'INPUT' 
        || activeElement.tagName.toUpperCase() == 'TEXTAREA' 
        || activeElement.isContentEditable) {
        return true;
    }
}

/*
--------------------------------------
Handle charting
--------------------------------------
*/

L.setHistory = function (chart, session) {
    session = session || L.session;

    session.meta.lastKnownBarTime = session.meta.lastKnownBarTime || chart.priceHistoryEntries[chart.priceHistoryEntries.length - 1]?.time || session.currentDate;
    const previousBarsSnapshot = chart.barsHistoryEntries.slice(-5);
    chart.barsHistoryEntries = chart.chartModel().mainSeries().bars()._items.sort((a, b) => a.index - b.index).slice(-50).map(b => L.getBarInfo(b, chart.timeframeSeconds))
    if(chart.barsHistoryEntries.length) {
        var adjusted = false;
        for (let i = chart.barsHistoryEntries.length - 1; i > chart.barsHistoryEntries.length - 5; i--) {
            const bar = chart.barsHistoryEntries[i];
            for(let j = previousBarsSnapshot.length - 1; j > 0; j--) {
                const previousBar = previousBarsSnapshot[j];
                if (previousBar.time == bar.time) {
                    if (previousBar.high != bar.high || previousBar.low != bar.low || previousBar.close != bar.close) {
                        bar.time += Math.ceil((((chart.barsHistoryEntries[i + 1]?.time) || session.currentDate) - bar.time) / 2);
                        chart.barsHistoryEntries.splice(i, 0, previousBar);
                        adjusted = true;
                        break;
                    }
                }
            }

            if(adjusted) {
                break;
            }
        }
    }
    
    if (!chart.priceHistoryEntries || chart.priceHistoryEntries.length == 0) {
        chart.priceHistoryEntries = chart.barsHistoryEntries.map(e => ({ price: e.close, time: e.time }));
    }

    const latestPrice = L.getCurrentBarInfo(chart)?.close;
    if(latestPrice) {
        if (chart.priceHistoryEntries.length == 0 || chart.priceHistoryEntries.slice(-1)[0].price != latestPrice) {
            chart.priceHistoryEntries.push({ price: chart.barsHistoryEntries.slice(-1)[0].close, time: L.replayApi.currentDate().value() });
            chart.priceHistoryEntries = chart.priceHistoryEntries.slice(-50);
        }
    }
}

L.getBarInfo = function (bar, duration) {
    if (!bar) return null;
    if (!bar.value) return null;

    return {
        time: bar.value[0],
        open: bar.value[1],
        high: bar.value[2],
        low: bar.value[3],
        close: bar.value[4],
        duration: duration
    };
}

L.getCurrentBarInfo = function (chart) {
    if (!chart) {
        chart = L.getCharts()[0];
    }

    return L.getBarInfo(chart.chartModel().mainSeries().bars().last(), chart.timeframeSeconds);
}

L.getPositionChart = function (position, surpressError) {
    const chart = L.getShapeChart(position.getShape().shapeId) || L.getCharts().find(c => c.symbol() == position.symbol.symbolName || c.chartModel().mainSeries().symbolInfo().pro_name == position.symbol.symbolName);
    if (!chart && !surpressError) {
        throw new Error("Chart not found while trying to get position chart");
    }

    return chart;
}

L.getShapeChart = function (shapeId) {
    return L.getCharts().find(c => L.tryExec(() => {
        const shape = L.getShapeById(shapeId, c, true);
        if (shape) {
            return c.symbol() == shape.symbol() || c.chartModel().mainSeries().symbolInfo().pro_name == shape.symbol();
        }
    }));
}

L.getShapeById = function (shapeId, chart, surpressError) {
    if(!shapeId) {
        return null;
    }

    chart = chart || L.getShapeChart(shapeId);
    if (chart) {
        return L.tryExec(() => chart.getShapeById(shapeId), surpressError);
    }
}

L.removeShapeById = function (shapeId, chart, ignoreErrors) {
    chart = chart || L.getShapeChart(shapeId)
    if (chart) {
        chart.removeEntity(shapeId);
    } else {
        if (!ignoreErrors) {
            throw new Error("Chart not found while trying to remove shape");
        }
    }
}

L.getCharts = function (reverse) {
    var chartInfoEntries = [];

    const chartCount = window.TradingViewApi.chartsCount();

    for (let i = 0; i < chartCount; i++) {
        const chart = window.TradingViewApi.chart(i);
        chart.timeframeSeconds = L.resolutionToSeconds(chart.resolution());
        if (!chart.__monitored) {
            chart.onSymbolChanged().subscribe(null, (symbolInfo) => L.onSymbolChanged(chart, symbolInfo));
            chart.chartModel().mainSeries().onIntervalChanged().subscribe(null, (interval, t) => L.onChartIntervalChanged(chart, interval));
            chart.__monitored = true;
        }
        chartInfoEntries.push(chart);
    }

    chartInfoEntries.sort((c1, c2) => reverse ? (c2.timeframeSeconds - c1.timeframeSeconds) : (c1.timeframeSeconds - c2.timeframeSeconds));
    return chartInfoEntries;
}

L.applyOnCharts = function (action, reverse) {
    var actions = [];

    const charts = L.getCharts(reverse);
    for (const chart of charts) {
        actions.push(action(chart));
    }

    return actions;
}

L.applyOnChartsAsync = async function (action, reverse, ignoreErrors) {
    var actions = [];
    const charts = L.getCharts(reverse);
    for (const chart of charts) {
        try {
            actions.push(await action(chart));
        } catch (e) {
            if(ignoreErrors) {
                console.warn(e);
            } else {
                throw e;
            }
        }
    }

    return actions;
}

L.reflectReplayResolutions = async function (resolutions) {
    if (!resolutions) {
        resolutions = await L.getReplayResolutions();
    }

    var minReplayResolution = L.session.getParameter(L.sessionParameterIds.MinReplayResolution);

    if(!minReplayResolution || !resolutions.includes(minReplayResolution)) {
        minReplayResolution = resolutions.find(r => L.resolutionToSeconds(r) >= 60) || resolutions[0];

        if (minReplayResolution) {
            L.session.setParameter(L.sessionParameterIds.MinReplayResolution, minReplayResolution);
        }
    }

    if (minReplayResolution) {
        const minResolutionSeconds = L.resolutionToSeconds(minReplayResolution);
        $(".backtesting-replay-controls").show();

        var allOptions = [
            { text: "5s", value: 5 },
            { text: "30s", value: 30 },
            { text: "1m", value: 60 },
            { text: "5m", value: 60 * 5 },
            { text: "15m", value: 60 * 15 },
            { text: "30m", value: 60 * 30 },
            { text: "1h", value: 60 * 60 },
            { text: "2h", value: 60 * 60 * 2 },
            { text: "4h", value: 60 * 240 },
            { text: "1D", value: 60 * 1440 },
            { text: "1W", value: 60 * 1440 * 7 }
        ];

        var options = allOptions.filter(option => option.value > minResolutionSeconds).slice(0, 6);
        $(".controls.backtesting-replay-controls .skip-intervals").empty();

        options.forEach(optionData => {
            $("<option>")
            .val(optionData.value)
            .text(optionData.text)
            .appendTo($(".controls.backtesting-replay-controls .skip-intervals"));
        });

        if (L.session?.meta?.selectedResolution) {
            $(".controls.backtesting-replay-controls .skip-intervals").val(L.session.meta.selectedResolution);
        }

        $(".forward-button").attr("title", `Step forward (${L.resolutionToFriendlyText(minReplayResolution)})\nShift + ⇨`);
    }
}

/*
--------------------------------------
Manage positions logic
--------------------------------------
*/

L.monitorEntryShapes = function () {
    L.asyncInterval(async () => {
        if (L.entryShapeCharts) {
            for (const shapeChartInfo of L.entryShapeCharts) {
                const shape = L.getShapeById(shapeChartInfo.shapeInfo.id, shapeChartInfo.chart, true);
                if (shape) {
                    const shapeDataSourceProperties = shape.lineDataSource().properties();
                    const entryPrice = shapeDataSourceProperties.entryPrice.value();
                    if (entryPrice != shapeChartInfo.shapeInfo._entryPrice) {
                        shapeChartInfo.shapeInfo._entryPrice = entryPrice;
                        shapeChartInfo.shapeInfo.timeAdded = L.session.currentDate;
                    }
                }
            }
        }
    }, 100);
}

L.generateEntryShapeCharts = function () {
    L.session.meta.entryShapeCharts = L.session.meta.entryShapeCharts || [];
    L.applyOnCharts(chart => {
        const shapes = chart.getAllShapes();
        for (var i = shapes.length - 1; i >= 0; i--) {
            const shapeInfo = shapes[i];

            var isEntry = true;
            isEntry = isEntry && (shapeInfo.name === 'long_position' || shapeInfo.name === 'short_position');
            isEntry = isEntry && !L.session.meta.entryShapeCharts.some(s => s.shapeInfo.id == shapeInfo.id);
            isEntry = isEntry && !L.session.positions.some(position => position.getShape().shapeId === shapeInfo.id);
            isEntry = isEntry && chart.barsHistoryEntries.length;

            if (isEntry) {
                shapeInfo.timeAdded = chart.barsHistoryEntries.slice(-1)[0].time;
                L.session.meta.entryShapeCharts.push({ shapeInfo, chart });
            }
        }
    });

    for (var shapeChartIndex = L.session.meta.entryShapeCharts.length - 1; shapeChartIndex >= 0; shapeChartIndex--) {
        const shapeChartInfo = L.session.meta.entryShapeCharts[shapeChartIndex];
        const shape = L.getShapeById(shapeChartInfo.shapeInfo.id, shapeChartInfo.chart, true);
        if(!shape) {
            L.session.meta.entryShapeCharts.splice(shapeChartIndex, 1);
            continue;
        }
    }
}

L.detectEntries = async function () {
    if (!L.session.meta.canDetectEntries || L.replayTo) {
        return;
    }

    L.generateEntryShapeCharts();
    for (var shapeChartIndex = L.session.meta.entryShapeCharts.length - 1; shapeChartIndex >= 0; shapeChartIndex--) {
        const shapeChartInfo = L.session.meta.entryShapeCharts[shapeChartIndex];
        const shape = L.getShapeById(shapeChartInfo.shapeInfo.id, shapeChartInfo.chart, true);
        const shapePoints = shape?.getPoints();
        if (shape && shapePoints.length && shapePoints[1].time > L.session.currentDate) {
            const shapeDataSourceProperties = shape.lineDataSource().properties();

            if (!shape._lockedProperties) {
                shape._lockedProperties = true;
                var symbolInfo = shapeChartInfo.chart.chartModel().mainSeries().symbolInfo();
                const lotSize = (await L.getContractSize(symbolInfo.full_name, symbolInfo.type)).contractSize * shapeDataSourceProperties.entryPointCurrencyRate.value();
                var shapeProperties = shape.getProperties();
                L.setPositionShapeSettings(shapeDataSourceProperties, { id: shapeChartInfo.shapeInfo.id, ...shapeProperties, accountSize: L.session.meta.balance || L.session.capital, currency: L.session.currencyId, lotSize });
            }

            if (shapeChartInfo.chart.barsHistoryEntries.length > 1) {
                var entryPrice = 0;
                var entryTime = 0;

                for (var barIndex = 1; barIndex < shapeChartInfo.chart.priceHistoryEntries.length; barIndex++) {
                    var previousBar = shapeChartInfo.chart.priceHistoryEntries[barIndex - 1];
                    var bar = shapeChartInfo.chart.priceHistoryEntries[barIndex];
                    if (bar.time >= shapeChartInfo.shapeInfo.timeAdded) {
                        const shapeEntryPrice = shapeDataSourceProperties.entryPrice.value();

                        if (previousBar.price <= shapeEntryPrice && shapeEntryPrice <= bar.price) {
                            entryPrice = shapeEntryPrice;
                            entryTime = bar.time;
                            break;
                        }
                    }
                }

                for (var barIndex = 1; barIndex < shapeChartInfo.chart.barsHistoryEntries.length; barIndex++) {
                    var previousBar = shapeChartInfo.chart.barsHistoryEntries[barIndex - 1];
                    var bar = shapeChartInfo.chart.barsHistoryEntries[barIndex];
                    if (bar.time >= shapeChartInfo.shapeInfo.timeAdded) {
                        const shapeEntryPrice = shapeDataSourceProperties.entryPrice.value();

                        if (Math.min(previousBar.close, bar.open) <= shapeEntryPrice && shapeEntryPrice <= Math.max(previousBar.close, bar.open) && bar.time > shapeChartInfo.shapeInfo.timeAdded) {
                            entryPrice = bar.open;
                            entryTime = bar.time;

                            break;
                        }
                        else if (bar.low <= shapeEntryPrice && shapeEntryPrice <= bar.high) {
                            entryPrice = shapeEntryPrice;
                            entryTime = bar.time;

                            break;
                        }

                    }
                }

                if (entryPrice && entryTime) {
                    if(!(L.session.positions.length < 20 || L.permissions.includes("MoreThan20Trades") || L.permissions.includes("UnlimitedTrades"))) {
                        L.stopSkipping();
                        L.messageBox("Feature disabled", "Cannot open more than 20 trades: please subscribe to a free plan or start a free trial on TestingView.com");
                        break;
                    }

                    if(!(L.session.positions.length < 50 || L.permissions.includes("UnlimitedTrades"))) {
                        L.stopSkipping();
                        L.messageBox("Feature disabled", "Cannot open more than 50 trades: please subscribe to a free plan or start a free trial on TestingView.com");
                        break;
                    }

                    shapeDataSourceProperties.entryPrice.setValue(entryPrice);
                    shapeDataSourceProperties.entryPrice.subscribe(null, () => {
                        if (shapeDataSourceProperties.entryPrice.value() != entryPrice && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
                            L.session.meta.lastSyncTime = Date.now();
                            shapeDataSourceProperties.entryPrice.setValue(entryPrice);
                        }
                    });

                    await L.openPosition({ entryPrice, entryTime }, shapeChartInfo, shape);
                    L.session.meta.entryShapeCharts.splice(shapeChartIndex, 1);
                    break;
                }
            } else {
                console.warn("No history bars on shape's chart");
            }
        }
    }
}

L.setPositionShapeSettings = function (shapeDataSourceProperties, shapeProperties) {
    shapeDataSourceProperties.accountSize.setValue(shapeProperties.accountSize);
    shapeDataSourceProperties.currency.setValue(shapeProperties.currency);
    shapeDataSourceProperties.lotSize.setValue(shapeProperties.lotSize);

    shapeDataSourceProperties.accountSize.subscribe(null, () => {
        if (shapeDataSourceProperties.accountSize.value() != shapeProperties.accountSize && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.accountSize.setValue(shapeProperties.accountSize);
        }
    });
    shapeDataSourceProperties.currency.subscribe(null, () => {
        if (shapeDataSourceProperties.currency.value() != shapeProperties.currency && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.currency.setValue(shapeProperties.currency);
        }
    });
    shapeDataSourceProperties.lotSize.subscribe(null, () => {
        if (shapeDataSourceProperties.lotSize.value() != shapeProperties.lotSize && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.lotSize.setValue(shapeProperties.lotSize);
        }
    });
    shapeDataSourceProperties.risk.subscribe(null, () => {
        if (shapeDataSourceProperties.risk.value() != shapeProperties.risk && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.risk.setValue(shapeProperties.risk);
        }
    });
    shapeDataSourceProperties.riskDisplayMode.subscribe(null, () => {
        if (shapeDataSourceProperties.riskDisplayMode.value() != shapeProperties.riskDisplayMode && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
            L.session.meta.lastSyncTime = Date.now();
            shapeDataSourceProperties.riskDisplayMode.setValue(shapeProperties.riskDisplayMode);
        }
    });
    shapeDataSourceProperties.entryPointCurrencyRate.subscribe(null, () => {
        if (!shapeDataSourceProperties.entryPointCurrencyRate.value()) {
            shapeDataSourceProperties.entryPointCurrencyRate.setValue(1);
        }
    });
    shapeDataSourceProperties.closePointCurrencyRate.subscribe(null, () => {
        if (!shapeDataSourceProperties.closePointCurrencyRate.value()) {
            shapeDataSourceProperties.closePointCurrencyRate.setValue(1);
        }
    });
    if (shapeProperties.entryPrice) {
        shapeDataSourceProperties.entryPrice.subscribe(null, () => {
            if (shapeDataSourceProperties.entryPrice.value() != shapeProperties.entryPrice && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
                L.session.meta.lastSyncTime = Date.now();
                shapeDataSourceProperties.entryPrice.setValue(shapeProperties.entryPrice);
            }
        });
    }
}

L.updateActivePositions = async function () {
    var openProfit = 0;
    for (const position of L.session.getActivePositions()) {
        const currentPositionPrice = position.meta.currentPrice;
        await L.updatePosition(position);

        clearTimeout(position.symbol.meta.updateLastPriceTimeout);
        position.symbol.meta.updateLastPriceTimeout = setTimeout(() => {
            if (currentPositionPrice != position.meta.currentPrice) {
                L.dataOps.updateLastPrice(L.session.sessionId, position.symbol.symbolId, position.meta.currentPrice);
            }
        }, 1000);

        L.updatePositionUI(position);

        if (!position.exitTime) {
            L.createLinesForPosition(position, L.getPositionChart(position, true));
            openProfit += position.getProfit(true);
        }
    }

    L.session.meta.balance = L.session.meta.balance || L.session.capital;
    L.session.meta.equity = L.session.meta.balance + openProfit;

    L.updateSessionCapitalInfo();
}

L.assessTracking = async function (position, bar) {
    if (position.quantity > 0) {
        if (position.meta.trackBeRunUp && (bar.low || bar.price) <= position.entryPrice && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.meta.trackBeRunUp = false;
        }

        if ((position.meta.trackRunUp || position.meta.trackBeRunUp) && (bar.low || bar.price) <= position.positionSLs[0]?.sl && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.meta.trackRunUp = false;
            position.meta.trackBeRunUp = false;
        }

        if (position.meta.trackDrawDown && (bar.high || bar.price) >= position.positionTPs[0]?.tp && position.positionTPs[position.positionTPs.length - 1].barTime <= bar.time) {
            position.meta.trackDrawDown = false;
        }
    }
    else if (position.quantity < 0) {
        if (position.meta.trackBeRunUp && (bar.high || bar.price) >= position.entryPrice && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.meta.trackBeRunUp = false;
        }

        if ((position.meta.trackRunUp || position.meta.trackBeRunUp) && (bar.high || bar.price) >= position.positionSLs[0]?.sl && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.meta.trackRunUp = false;
            position.meta.trackBeRunUp = false;
        }

        if (position.meta.trackDrawDown && (bar.low || bar.price) <= position.positionTPs[0]?.tp && position.positionTPs[position.positionTPs.length - 1].barTime <= bar.time) {
            position.meta.trackDrawDown = false;
        }
    }

    if(position.exitTime) {
        const dbUpdates = [];
        var positionElement;
        var runUp;
        
        if(position.meta.trackRunUp) {
            runUp = Math.max(position.columnValue("Run-up") || 0, position.quantity > 0 ? position.getProfitAtPrice(bar.high || bar.price, true) : position.getProfitAtPrice(bar.low || bar.price, true));
            if (runUp > position.columnValue("Run-up")) {
                position.columnValue("Run-up", runUp, true);
                dbUpdates.push(L.dataOps.setPositionColumn(position.positionId, position.getColumn("Run-up")));
                positionElement = positionElement || $(`#ID_${position.positionId}.V_POSITION`);
                positionElement.find(".V_RUNUP").text(position.getRunUp());
                positionElement.find(".V_RUNUPPERCENTAGE").text(position.getRunUpPercentage());
            } else {
                runUp = position.columnValue("Run-up");
            }
        }

        if(position.meta.trackDrawDown) {
            const drawDown = Math.min(position.columnValue("Drawdown") || 0, position.quantity > 0 ? position.getProfitAtPrice(bar.low || bar.price, true) : position.getProfitAtPrice(bar.high || bar.price, true));
            if (drawDown < position.columnValue("Drawdown")) {
                position.columnValue("Drawdown", drawDown, true);
                dbUpdates.push(L.dataOps.setPositionColumn(position.positionId, position.getColumn("Drawdown")));
                positionElement = positionElement || $(`#ID_${position.positionId}.V_POSITION`);
                positionElement.find(".V_DRAWDOWN").text(position.getDrawDown());
                positionElement.find(".V_DRAWDOWNPERCENTAGE").text(position.getDrawDownPercentage());
            }
        }

        if(position.meta.trackBeRunUp) {
            if (position.columnValue("BE Run-up")) {
                const beRunUp = position.columnValue("Run-up");
                if (beRunUp != position.columnValue("BE Run-up")) {
                    position.columnValue("BE Run-up", beRunUp, true);
                    dbUpdates.push(L.dataOps.setPositionColumn(position.positionId, position.getColumn("BE Run-up")));
                    positionElement = positionElement || $(`#ID_${position.positionId}.V_POSITION`);
                    positionElement.find(".V_BERUNUP").text(position.getBERunUp());
                    positionElement.find(".V_BERUNUPPERCENTAGE").text(position.getBERunUpPercentage());
                }
            }
        }

        await Promise.all(dbUpdates);
    }
}

L.updatePositionStats = async function(position, bar) {
    const dbUpdates = [];
    L.assessTracking(position, bar);

    if(position.meta.trackRunUp) {
        var runUp = Math.max(position.columnValue("Run-up") || 0, position.quantity > 0 ? position.getProfitAtPrice(bar.high || bar.price, true) : position.getProfitAtPrice(bar.low || bar.price, true));
        if (runUp > position.columnValue("Run-up")) {
            position.columnValue("Run-up", runUp, true);
            dbUpdates.push(L.dataOps.setPositionColumn(position.positionId, position.getColumn("Run-up")));
        }
    }

    if(position.meta.trackDrawDown) {
        const drawDown = Math.min(position.columnValue("Drawdown") || 0, position.quantity > 0 ? position.getProfitAtPrice(bar.low || bar.price, true) : position.getProfitAtPrice(bar.high || bar.price, true));
        if (drawDown < position.columnValue("Drawdown")) {
            position.columnValue("Drawdown", drawDown, true);
            dbUpdates.push(L.dataOps.setPositionColumn(position.positionId, position.getColumn("Drawdown")));
        }
    }

    if(position.meta.trackBeRunUp) {
        if (position.columnValue("BE Run-up")) {
            const beRunUp = position.columnValue("Run-up");
            if (beRunUp != position.columnValue("BE Run-up")) {
                position.columnValue("BE Run-up", beRunUp, true);
                dbUpdates.push(L.dataOps.setPositionColumn(position.positionId, position.getColumn("BE Run-up")));
            }
        }
    }

    await Promise.all(dbUpdates);
}

L.updatePosition = async function (position) {
    const chart = L.getPositionChart(position, true);
    var continueParsing = !!chart;

    if (continueParsing) {
        if (continueParsing) {
            for (var i = 0; i <= chart.barsHistoryEntries.length - 1; i++) {
                const bar = chart.barsHistoryEntries[i];
                if (bar.time > position.entryTime) {
                    continueParsing = await parseBarAction(bar, null, i == chart.barsHistoryEntries.length - 1);
                    if (!continueParsing) {
                        break;
                    }
                }
            }
        }

        if (continueParsing) {
            for (var i = 0; i < chart.priceHistoryEntries.length; i++) {
                const bar = chart.priceHistoryEntries[i];
                const previousBar = chart.priceHistoryEntries[i - 1];
                continueParsing = await parseBarAction(bar, previousBar, i == chart.priceHistoryEntries.length - 1);
                if(!continueParsing) {
                    break;
                }
            }
        }
    } else {
        console.warn(`Position chart not found for symbol ${position.symbol.symbolName}`);
    }

    async function parseBarAction(bar, previousBar, isLatestBar) {
        if (bar.time >= position.entryTime) {
            if (isLatestBar) {
                position.meta.profit = position.getProfitAtPrice(bar.close || bar.price, true);
                position.meta.currentPrice = (bar.close || bar.price);
            }

            L.updatePositionStats(position, bar);

            if (L.detectExit(position, chart, bar, previousBar)) {
                return false;
            }
        }

        return true;
    }
}

L.detectExit = function (position, chart, bar, previousBar) {
    if (position.bePrice()) {
        var beHit = true;
        beHit = beHit && (position.positionBEs[position.positionBEs.length - 1].barTime <= bar.time);
        if(position.quantity > 0) {
            beHit = beHit && ((bar.low || previousBar?.price) <= position.bePrice() && position.bePrice() <= (bar.high || bar.price));
        } else {
            beHit = beHit && ((bar.high || previousBar?.price) >= position.bePrice() && position.bePrice() >= (bar.low || bar.price));
        }

        if (beHit) {
            position.meta.trackBeRunUp = true;
            L.toast("BE hit, moving SL to entry", 2000);
            L.stopSkipping();
            L.removeBeLine(position, chart);
            if(L.permissions.includes("CanSetBE")) {
                L.applyOnCharts((c) => {
                    const stopLine = L.getShapeById(position.meta.stopLineId, c, true);
                    stopLine?.setPoints([{ price: position.entryPrice, time: position.entryTime }]);
                });
                
                L.setStopPrice(position, position.entryPrice, true);
                position.columnValue("BE Run-up", position.columnValue("Run-up"));
            } else {
                L.toast("BE hit, but the auto-BE feature is disabled: please subscribe to a free plan or start a free trial on TestingView.com", 0, "warn");
            }
        }
    }
    
    if (position.quantity > 0) {
        if ((bar.low || bar.price) <= position.stopPrice() && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.exitPrice = position.stopPrice();
        }

        if ((bar.high || bar.price) >= position.targetPrice() && position.positionTPs[position.positionTPs.length - 1].barTime <= bar.time) {
            position.exitPrice = position.targetPrice();
        }
    }
    else if (position.quantity < 0) {
        if ((bar.high || bar.price) >= position.stopPrice() && position.positionSLs[position.positionSLs.length - 1].barTime <= bar.time) {
            position.exitPrice = position.stopPrice();
        }

        if ((bar.low || bar.price) <= position.targetPrice() && position.positionTPs[position.positionTPs.length - 1].barTime <= bar.time) {
            position.exitPrice = position.targetPrice();
        }
    }

    if (position.exitPrice) {
        if(position.exitPrice == position.stopPrice()) {
            L.toast("Stop loss hit", 2000, "warn");
        } else if(position.exitPrice == position.targetPrice()) {
            L.toast("Take profit hit", 2000);
        }

        position.exitTime = bar.time + chart.timeframeSeconds > L.session.currentDate ? L.session.currentDate : bar.time + chart.timeframeSeconds;
        L.closePosition(position, 1 /* TP/SL */, chart);
        return true;
    }
}

L.openPosition = async function (position, shapeChartInfo, shape) {
    L.stopSkipping();
    L.setPositionFunctions(position);

    position.meta.profit = 0;
    position.meta.trackRunUp = true;
    position.meta.trackDrawDown = true;
    position.meta.trackBeRunUp = false;

    position.index = L.session.positions.length + 1;
    position.positionId = shapeChartInfo.shapeInfo.id;

    L.syncShapeWithPosition(shape, position);
    const shapeDataSourceProperties = shape.lineDataSource().properties();
    const shapePoints = shape.getPoints();
    position.positionShapes = [{
        shapeId: shapeChartInfo.shapeInfo.id,
        name: shapeChartInfo.shapeInfo.name,
        stopPrice: shapeDataSourceProperties.stopPrice.value(),
        targetPrice: shapeDataSourceProperties.targetPrice.value(),
        endTime: shapePoints[1].time,
    }];

    L.keepShapeInfoInSync(position, shape, shapeDataSourceProperties);

    position.entryCurrencyRate = shapeDataSourceProperties.entryPointCurrencyRate.value();
    position.meta.initialBalance = shapeDataSourceProperties.accountSize.value();
    position.symbol = await L.dataOps.getOrAddSymbol(shapeChartInfo.chart.symbol(), () => shapeChartInfo.chart.chartModel().mainSeries().symbolInfo());
    position.positionSnapshots = [];

    Object.defineProperty(position.symbol, 'meta', { value: {}, writable: true, enumerable: false });
    position.symbol.meta.contractSize = shapeDataSourceProperties.lotSize.value();
    position.symbol.meta.pointSize = (await L.getContractSize(position.symbol.symbolName, position.symbol.symbolType)).pointSize;

    position.columnValue("Symbol", position.symbol.symbolName.split(":").slice(-1)[0], true);
    position.columnValue("Run-up", 0, true);
    position.columnValue("Drawdown", 0, true);
    position.columnValue("Analysis Time", L.session.meta.analysisTimes.find(at => at.analysisDuration > 5)?.analysisTimespan || "00:00", true);

    position.quantity = shapeDataSourceProperties.qty.value() / position.symbol.meta.contractSize * (shapeChartInfo.shapeInfo.name == 'long_position' ? 1 : -1);
    if (position.quantity) {
        if (!L.isEbacktestingPanelOpen()) {
            L.toast(`${position.getOrderType()} activated. You can open the TestingView panel to view and manage the position.`, 5000);
        }

        position.stopPrice(position.meta.currentStopPrice = position.getShape().stopPrice, true);
        position.targetPrice(position.meta.currentTargetPrice = position.getShape().targetPrice, true);
        position.risk((position.entryPrice - position.stopPrice()) * position.quantity * position.symbol.meta.contractSize * position.entryCurrencyRate * position.symbol.meta.pointSize, true);

        await L.createLinesForPosition(position, shapeChartInfo.chart);

        L.session.positions.unshift(position);
        L.addToPositionList(position, true);
        L.updateSessionCapitalInfo();

        await L.dataOps.createPosition(position);
    } else {
        L.toast("Unable to open position: lot size cannot be set at this time", 0, "warn");
        L.removeShapeById(position.getShape().shapeId, shapeChartInfo.chart);
    }
}

L.keepShapeInfoInSync = function (position, shape, shapeDataSourceProperties) {
    shapeDataSourceProperties.stopPrice.subscribe(null, () => {
        if (position.meta.setShapeStopPriceTimeout) {
            clearTimeout(position.meta.setShapeStopPriceTimeout);
        }

        position.meta.setShapeStopPriceTimeout = setTimeout(() => {
            if (!position.exitTime && position.getShape().stopPrice != shapeDataSourceProperties.stopPrice.value()) {
                position.getShape().stopPrice = shapeDataSourceProperties.stopPrice.value();
            }
        }, 1000);
    });

    shapeDataSourceProperties.stopPrice.subscribe(null, () => {
        if (position.meta.setShapeTargetPriceTimeout) {
            clearTimeout(position.meta.setShapeTargetPriceTimeout);
        }

        position.meta.setShapeTargetPriceTimeout = setTimeout(() => {
            if (!position.exitTime && position.getShape().targetPrice != shapeDataSourceProperties.targetPrice.value()) {
                position.getShape().targetPrice = shapeDataSourceProperties.targetPrice.value();
            }
        }, 1000);
    });

    shapeDataSourceProperties.stopPrice.subscribe(null, () => {
        if (position.meta.setShapeEndTimeTimeout) {
            clearTimeout(position.meta.setShapeEndTimeTimeout);
        }

        position.meta.setShapeEndTimeTimeout = setTimeout(() => {
            const endTime = shape.getPoints()[1].time;
            if (!position.exitTime && position.getShape().endTime != endTime) {
                position.getShape().endTime = endTime;
            }
        }, 1000);
    });
}

L.closePosition = function (position, exitReason, chart) {
    L.stopSkipping();
    if (chart) {
        position.exitReason = exitReason;
        position.exitTime = position.exitTime || L.session.currentDate;

        const shape = L.getShapeById(position.getShape().shapeId, chart, true);
        if (shape) {
            L.syncShapeWithPosition(shape, position);
        }

        position.meta.profit = position.getProfitAtPrice(position.exitPrice, true);
        L.updatePositionUI(position);

        L.session.meta.equity -= position.getProfit(true);
        L.session.meta.balance += position.getProfit(true);

        if (position.meta.entryLineId) {
            L.removeShapeById(position.meta.entryLineId, chart);
        }
        if (position.meta.stopLineId) {
            L.removeShapeById(position.meta.stopLineId, chart);
        }
        if (position.meta.targetLineId) {
            L.removeShapeById(position.meta.targetLineId, chart);
        }
        if (position.meta.beLineId) {
            L.removeShapeById(position.meta.beLineId, chart);
        }

        L.updateSessionCapitalInfo();
        L.dataOps.closePosition(position);
    }
}

L.setPositionFunctions = function (position) {
    Object.defineProperty(position, 'meta', { value: {}, writable: true, enumerable: false });

    position.getShape = function () {
        return position.positionShapes[0];
    };

    position.getColumn = function (columnName, sessionColumn) {
        if (!sessionColumn) {
            sessionColumn = L.session.sessionColumns.find(c => c.columnName == columnName);
        }
        if (!position.positionColumns) {
            position.positionColumns = [];
        }
        return position.positionColumns.find(c => c.columnId == sessionColumn?.columnId);
    }

    position.columnValue = function (columnName, value, dontStore) {
        const sessionColumn = L.session.sessionColumns.find(c => c.columnName == columnName);
        if(sessionColumn) {
            var positionColumn = position.getColumn(columnName, sessionColumn);

            if (value !== undefined) {
                if (!positionColumn) {
                    positionColumn = {
                        columnId: sessionColumn.columnId,
                        columnName: sessionColumn.columnName,
                        value: value
                    };
                    position.positionColumns.push(positionColumn);
                }
                
                positionColumn.value = value;
                if (!dontStore) {
                    L.dataOps.setPositionColumn(position.positionId, positionColumn);
                }
            }

            return positionColumn?.value;
        }
    }

    position.stopPrice = function (value, dontStore) {
        if (!position.positionSLs) {
            position.positionSLs = [];
        }

        if (value !== undefined) {
            if (position.positionSLs.slice(-1)[0]?.sl != value) {
                const chart = L.getPositionChart(position, true);
                const barTime = chart ? Math.max(chart.barsHistoryEntries.slice(-1)[0]?.time || L.session.currentDate, chart.priceHistoryEntries.slice(-1)[0]?.time || L.session.currentDate) : L.session.currentDate;
                const positionSL = { sl: value, barTime: barTime };
                position.positionSLs.push(positionSL);

                if (!dontStore) {
                    L.dataOps.addPositionSL(position.positionId, positionSL);
                }
            }
        }

        if (position.positionSLs.length) {
            return position.positionSLs[position.positionSLs.length - 1].sl;
        } else {
            return undefined;
        }
    };

    position.targetPrice = function (value, dontStore) {
        if (!position.positionTPs) {
            position.positionTPs = [];
        }

        if (value !== undefined) {
            if (position.positionTPs.slice(-1)[0]?.tp != value) {
                const chart = L.getPositionChart(position, true);
                const barTime = chart ? Math.max(chart.barsHistoryEntries.slice(-1)[0]?.time || L.session.currentDate, chart.priceHistoryEntries.slice(-1)[0]?.time || L.session.currentDate) : L.session.currentDate;
               
                const positionTP = { tp: value, barTime: barTime };
                position.positionTPs.push(positionTP);
                if (!dontStore) {
                    L.dataOps.addPositionTP(position.positionId, positionTP);
                }
            }
        }

        if (position.positionTPs.length) {
            return position.positionTPs[position.positionTPs.length - 1].tp;
        } else {
            return undefined;
        }
    };

    position.bePrice = function (value, dontStore) {
        if (!position.positionBEs) {
            position.positionBEs = [];
        }

        if (value !== undefined) {
            if (position.positionBEs.slice(-1)[0]?.be != value) {
                const chart = L.getPositionChart(position, true);
                const barTime = chart ? Math.max(chart.barsHistoryEntries.slice(-1)[0]?.time || L.session.currentDate, chart.priceHistoryEntries.slice(-1)[0]?.time || L.session.currentDate) : L.session.currentDate;
               
                const positionBE = { be: value, barTime: barTime };
                position.positionBEs.push(positionBE);
                if (!dontStore) {
                    L.dataOps.addPositionBE(position.positionId, positionBE);
                }
            }
        }

        if (position.positionBEs.length) {
            return position.positionBEs[position.positionBEs.length - 1].be;
        } else {
            return undefined;
        }
    };

    position.risk = function (value, dontStore) {       
        if (!position.positionRisks) {
            position.positionRisks = [];
        }

        if (value != undefined) {
            value = Math.abs(value);

            if (position.positionRisks.slice(-1)[0]?.risk != value) {
                const positionRisk = { risk: value, barTime: L.session.currentDate };
                position.positionRisks.push(positionRisk);
                if (!dontStore) {
                    L.dataOps.addPositionRisk(position.positionId, positionRisk);
                }
            }
        }

        if (position.positionRisks.length) {
            return position.positionRisks[position.positionRisks.length - 1].risk;
        } else {
            return undefined;
        }
    };

    position.getIndex = function () {
        return position.index;
    };

    position.getDirection = function () {
        return position.quantity > 0 ? "long" : "short";
    };

    position.getStatus = function () {
        return position.exitTime ? `Exit ${position.getDirection()}` : "Open";
    };

    position.getRisk = function (noRounding) {
        return Number(position.risk().toFixed(noRounding ? 100 : 2));
    };

    position.getRiskPercentage = function (noRounding) {
        return Number((position.risk() / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2));
    };

    position.getOrderType = function () {
        return position.quantity > 0 ? "Buy" : "Sell";
    };

    position.getEntryDate = function (chart) {
        return L.toTradingViewDateTimeFormat(position.entryTime, chart.getTimezone());
    };

    position.getExitDate = function (chart) {
        return L.toTradingViewDateTimeFormat(position.exitTime || L.session.currentDate, chart.getTimezone());
    };

    position.getExitPrice = function (noRounding) {
        if (position.exitPrice) {
            return Number(position.exitPrice.toFixed(noRounding ? 100 : position.symbol.pricePrecision));
        }
    };

    position.getEntryPrice = function (noRounding) {
        return Number(position.entryPrice.toFixed(noRounding ? 100 : position.symbol.pricePrecision));
    };

    position.getLatestPrice = function (noRounding) {
        if(!position.exitTime && !position.meta.currentPrice) {
            const chart = L.getPositionChart(position, true);
            if(chart) {
                if(!chart.priceHistoryEntries || !chart.priceHistoryEntries.length) {
                    L.setHistory(chart);
                }

                const bar = chart.barsHistoryEntries.slice(-1)[0];
                position.meta.currentPrice = bar.close;
            } else {
                position.meta.currentPrice = L.session.sessionSymbolLastPrices.find(p => p.symbolId == position.symbol.symbolId).lastPrice;
            }
        }

        return Number((position.exitTime ? position.exitPrice : position.meta.currentPrice).toFixed(noRounding ? 100 : position.symbol.pricePrecision));
    };

    position.getSymbolCurrency = function () {
        return position.symbol.currencyId;
    };

    position.getQuantity = function () {
        return Number(position.quantity.toFixed(position.symbol.quantityPrecision));
    };

    position.getProfit = function (noRounding, session) {
        if(position.meta.profit === undefined || position.meta.profit === null) {
            const chart = L.getPositionChart(position);
            if(!chart.priceHistoryEntries || !chart.priceHistoryEntries.length) {
                L.setHistory(chart, session);
            }

            const bar = chart.barsHistoryEntries.slice(-1)[0];
            position.meta.profit = position.getProfitAtPrice(bar.close, true);
        }

        return Number(position.meta.profit.toFixed(noRounding ? 100 : 2));
    }

    position.getProfitAtPrice = function (price, noRounding) {
        if (price) {
            return Number(L.calculateProfit(position, price).toFixed(noRounding ? 100 : 2));
        }
    }

    position.getProfitPercentage = function (profit, noRounding) {
        if (!profit) {
            profit = position.getProfit(noRounding);
        }

        return Number((profit / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2));
    };

    position.getCumulativeProfit = function (profit, noRounding) {
        if (!profit) {
            profit = position.getProfit(noRounding);
        }

        return Number((position.meta.initialBalance + profit).toFixed(noRounding ? 100 : 2));
    };

    position.getCumulativeProfitPercentage = function (profit, noRounding) {
        if (!profit) {
            profit = position.getProfit(noRounding);
        }

        return Number(((position.getCumulativeProfit(profit, noRounding) - L.session.capital) / L.session.capital * 100).toFixed(noRounding ? 100 : 2));
    };

    position.getRunUp = function (noRounding) {
        return Number(Number(position.columnValue("Run-up")).toFixed(noRounding ? 100 : 2));
    };

    position.getRunUpPercentage = function (noRounding) {
        return Number((position.columnValue("Run-up") / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2));
    };

    position.getDrawDown = function (noRounding) {
        return -Math.abs(Number(Number(position.columnValue("Drawdown")).toFixed(noRounding ? 100 : 2)));
    };

    position.getDrawDownPercentage = function (noRounding) {
        return -Math.abs(Number((position.columnValue("Drawdown") / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2)));
    };

    position.getBERunUp = function (noRounding) {
        const runup = Number(position.columnValue("BE Run-up")) || 0;
        return Number(runup.toFixed(noRounding ? 100 : 2));
    }

    position.getBERunUpPercentage = function (noRounding) {
        const runup = position.columnValue("BE Run-up") || 0;
        return Number((runup / position.meta.initialBalance * 100).toFixed(noRounding ? 100 : 2));
    }

    position.getLeverage = function() {
        const requiredMargin = position.entryPrice * Math.abs(position.quantity) * position.symbol.meta.contractSize;
        return Math.ceil(requiredMargin / position.meta.initialBalance);
    };
}

L.onDateCellClick = function (event, position) {
    if ($(`tr#ID_${position.positionId}`).hasClass("selected")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    if (!L.isEditingPositionsList()) {
        const element = $(event.currentTarget);
        L.getPositionChart(position, true)?.setActive();
        if (element.hasClass("V_ENTRYDATE")) {
            L.gotoTime(position.entryTime);
            setTimeout(() => {
                L.onSelectPositionRow(position, true);
            }, 1000);
        } else if (element.hasClass("V_EXITDATE")) {
            L.gotoTime(position.exitTime || L.session.currentDate);
            setTimeout(() => {
                L.onSelectPositionRow(position, true);
            }, 1000);
        }
    }
}

L.onSelectPositionRow = async function (position, forceSelect) {
    if (!L.isEditingPositionsList()) {
        $(`tr#ID_${position.positionId}`).toggleClass("selected").siblings().removeClass("selected");
        if(forceSelect) {
            $(`tr#ID_${position.positionId}`).addClass("selected");
        }

        if ($(`tr#ID_${position.positionId}`).hasClass("selected")) {
            for (const p of L.session.positions) {
                if (p.meta.hasShapeRedraw) {
                    L.removeShapeForPosition(p, true);
                }
            }
            const shapes = await L.drawShapeForPosition(position);
            if(shapes.some(s => s)) {
                isShapeOnScreen = function(shape) {
                    if(shape) {
                        const shapePoints = shape.getPoints();
                        return L.getCharts().filter(c => c.symbol() == position.symbol.symbolName || c.chartModel().mainSeries().symbolInfo().pro_name == position.symbol.symbolName).some(c => {
                            const visibleRange = c.getVisibleRange();
                            if(visibleRange.from <= shapePoints[0].time && shapePoints[1].time <= visibleRange.to) {
                                return true;
                            }

                            return false;
                        });
                    }
                };

                if(!shapes.some(s => isShapeOnScreen(s))) {
                    L.toast("Click entry/exit dates in the TestingView panel to jump to the trade.", 2000);
                }
            } else {
                if (!L.isSameSymbol(TradingViewApi.activeChart(), position)) {
                    L.toast("Double click to open the position's chart", 2000);
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
            await L.changeSymbol(TradingViewApi.activeChart(), position.symbol.symbolName);
        }

        if (await L.drawShapeForPosition(position)) {
            $(`tr#ID_${position.positionId}`).addClass("selected").siblings().removeClass("selected");
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

L.setStopPrice = function (position, price, immediate) {
    if (position.meta.pendingNewStopPrice != price) {
        position.meta.pendingNewStopPrice = price;
        if (position.positionSLs?.slice(-1)[0] != price) {
            const setStopPrice = () => {
                const positionChart = L.getShapeChart(position.meta.stopLineId);
                if (positionChart) {
                    const bar = positionChart.priceHistoryEntries.slice(-1)[0];

                    const isInvalidPrice = !!immediate
                    || (position.quantity > 0 && price >= bar.price)
                    || (position.quantity < 0 && price <= bar.price)
                    || (position.quantity > 0 && position.bePrice() && price > position.bePrice())
                    || (position.quantity < 0 && position.bePrice() && price < position.bePrice())
                    ;
        
                    if (!immediate && isInvalidPrice) {
                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.stopLineId, chart, true)?.setPoints(
                                [{ price: position.stopPrice(), time: position.entryTime }]);
                        });
                        L.toast("Invalid stop price", 3000, "warn");
                    }
                    else {
                        position.stopPrice(price);

                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.stopLineId, chart, true)?.setProperties({
                                text: `${position.getProfitAtPrice(position.stopPrice())} ${L.session.currencyId} (${position.getProfitPercentage(position.getProfitAtPrice(position.stopPrice(), true))}%)`,
                            });
                        });
                    }
                }
            }

            if (immediate) {
                setStopPrice();
            } else {
                if (position.meta.setStopPriceTimeout) {
                    clearTimeout(position.meta.setStopPriceTimeout);
                }
            
                position.meta.setStopPriceTimeout = setTimeout(setStopPrice, 1000);
            }
        }
    }
}

L.setTargetPrice = function (position, price) {
    if (position.meta.pendingNewTargetPrice != price) {
        position.meta.pendingNewTargetPrice = price;
        if (position.positionTPs?.slice(-1)[0] != price) {
            if (position.meta.setTargetPriceTimeout) {
                clearTimeout(position.meta.setTargetPriceTimeout);
            }

            position.meta.setTargetPriceTimeout = setTimeout(() => {
                const positionChart = L.getShapeChart(position.meta.targetLineId);
                if (positionChart) {
                    const bar = positionChart.priceHistoryEntries.slice(-1)[0];

                    const isInvalidPrice = false
                    || (position.quantity > 0 && price <= bar.price)
                    || (position.quantity < 0 && price >= bar.price)
                    || (position.quantity > 0 && position.bePrice() && price < position.bePrice())
                    || (position.quantity < 0 && position.bePrice() && price > position.bePrice())
                    ;
        
                    if (isInvalidPrice) {
                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.targetLineId, chart, true)?.setPoints(
                                [{ price: position.targetPrice(), time: position.entryTime }]);
                        });
                        L.toast("Invalid target price", 3000, "warn");
                    }
                    else {
                        position.targetPrice(price);
                        
                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.targetLineId, chart, true)?.setProperties({
                                text: `${position.getProfitAtPrice(position.targetPrice())} ${L.session.currencyId} (${position.getProfitPercentage(position.getProfitAtPrice(position.targetPrice(), true))}%)`,
                            });
                        });
                    }
                }
            }, 1000);
        }
    }
}

L.setBePrice = function (position, price) {
    if (position.meta.pendingNewBEPrice != price) {
        position.meta.pendingNewBEPrice = price;
        if (position.positionBEs?.slice(-1)[0] != price) {
            position.meta.currentBePrice = price;
            if (position.meta.setBePriceTimeout) {
                clearTimeout(position.meta.setBePriceTimeout);
            }

            position.meta.setBePriceTimeout = setTimeout(() => {
                const positionChart = L.getShapeChart(position.meta.beLineId);
                if (positionChart) {                   
                    const isInvalidPrice = false
                    || (position.quantity > 0 && price <= position.stopPrice())
                    || (position.quantity < 0 && price >= position.stopPrice())
                    || (position.quantity > 0 && price >= position.targetPrice())
                    || (position.quantity < 0 && price <= position.targetPrice())
                    || (position.quantity > 0 && price <= position.entryPrice)
                    || (position.quantity < 0 && price >= position.entryPrice)
                    ;
        
                    if (isInvalidPrice) {
                        L.applyOnCharts((chart) => {
                            L.getShapeById(position.meta.beLineId, chart, true)?.setPoints(
                                [{ price: position.bePrice(), time: position.entryTime }]);
                        });
                        L.toast("Invalid BE price", 3000, "warn");
                    }
                    else {
                        position.bePrice(price);
                    }
                }
            }, 1000);
        }
    }

}

/*
--------------------------------------
Manage positions UI
--------------------------------------
*/

L.showBeLine = async function (position, chart) {
    if (chart && !position.exitTime) {
        if (!(position.meta.beLineId && L.getShapeById(position.meta.beLineId, chart))) {
            position.meta.beLineId = await chart.createShape(
                { price: position.bePrice() || (position.entryPrice + Math.sign(position.quantity) * Math.abs(position.targetPrice() - position.entryPrice) / 2), time: position.entryTime },
                {
                    shape: "horizontal_line",
                    disableSelection: true,
                    disableSave: true,
                    //disableUndo: true, //this leads to the shape being drawn only on 1 chart
                    showInObjectsTree: false,
                    lineWidth: 1,
                });
        }

        L.setGeneratedShape(position.meta.beLineId);
        const beLine = L.getShapeById(position.meta.beLineId, chart);

        beLine.lineDataSource().properties().linestyle.setValue(2);
        beLine.lineDataSource().properties().linecolor.setValue("#FFFF00CC");

        $(`tr#ID_${position.positionId}.V_POSITION .action-buttons .show-be-button`).hide();
        $(`tr#ID_${position.positionId}.V_POSITION .action-buttons .hide-be-button`).show();
    }
}

L.removeBeLine = function (position, chart) {
    if (chart) {
        if (position.meta.beLineId) {
            L.removeShapeById(position.meta.beLineId, chart);
        }

        delete position.meta.beLineId;
        position.bePrice(0);

        $(`tr#ID_${position.positionId}.V_POSITION .action-buttons .show-be-button`).show();
        $(`tr#ID_${position.positionId}.V_POSITION .action-buttons .hide-be-button`).hide();
    }
}

L.syncLinesWithPositions = function () {
    if (L.session.meta.lastSyncLinesWithPositions && (new Date() - L.session.meta.lastSyncLinesWithPositions) < 2000) {
        return;
    }
    L.session.meta.lastSyncLinesWithPositions = new Date();

    for (const position of L.session.getActivePositions()) {
        if (position.meta.stopLineId) {
            const stopLine = L.getShapeById(position.meta.stopLineId);
            if (stopLine) {
                L.setStopPrice(position, stopLine.lineDataSource().points()[0].price);
            }
        }

        if (position.meta.targetLineId) {
            const targetLine = L.getShapeById(position.meta.targetLineId);
            if (targetLine) {
                L.setTargetPrice(position, targetLine.lineDataSource().points()[0].price);
            }
        }

        if (position.meta.beLineId) {
            const beLine = L.getShapeById(position.meta.beLineId);
            if (beLine) {
                L.setBePrice(position, beLine.lineDataSource().points()[0].price);
            }
        }
    }
}

L.syncShapeWithPosition = function (shape, position) {
    const points = shape.getPoints();

    if (points[0].price !== position.entryPrice || points[1].price !== position.entryPrice || points[0].time !== position.entryTime || position.exitTime) {
        const shapeLength = points[1].time - points[0].time;
        shape.setPoints([{ price: position.entryPrice, time: position.entryTime }, { price: position.entryPrice, time: Math.max(position.exitTime || 0, position.entryTime + shapeLength) }]);
    }
}

L.createLinesForPosition = async function (position, chart) {
    if(!chart)
    {
        return;
    }
        
    var lineProperties = {
        shape: "horizontal_ray",
        disableSelection: true,
        disableSave: true,
        //disableUndo: true, //this leads to the shape being drawn only on 1 chart
        lock: true,
        showInObjectsTree: false,
        lineWidth: 1,
        showLabel: true,
        horzLabelsAlign: "right",
        text: position.quantity > 0 ? "⬆️" : "⬇️",
        vertLabelsAlign: position.quantity > 0 ? "top" : "bottom",
        linestyle: 1,
        linecolor: "#0000FFCC",
        textcolor: "#0000FFCC"
    };

    var lineShape = L.getShapeById(position.meta.entryLineId, chart, true);
    if (!lineShape) {
        position.meta.entryLineId = await chart.createShape(
            { price: position.entryPrice, time: position.entryTime },
            lineProperties);
        lineShape = L.getShapeById(position.meta.entryLineId, chart);
    }

    lineShape.setPoints([{ price: position.entryPrice, time: position.entryTime }]);
    lineShape.setProperties(lineProperties);
    L.setGeneratedShape(position.meta.entryLineId);

    lineProperties = {
        shape: "horizontal_line",
        disableSelection: true,
        disableSave: true,
        //disableUndo: true, //this leads to the shape being drawn only on 1 chart
        showInObjectsTree: false,
        lineWidth: 1,
        showLabel: true,
        horzLabelsAlign: "right",
        text: `${position.getProfitAtPrice(position.stopPrice())} ${L.session.currencyId} (${position.getProfitPercentage(position.getProfitAtPrice(position.stopPrice(), true))}%)`,
        vertLabelsAlign: position.quantity > 0 ? "top" : "bottom",
        linestyle: 1,
        linecolor: "#FF0000CC",
        textcolor: "#FF0000CC"
    };

    lineShape = L.getShapeById(position.meta.stopLineId, chart, true);
    if (!lineShape) {
        position.meta.stopLineId = await chart.createShape(
            { price: position.stopPrice(), time: position.entryTime },
            lineProperties);
        lineShape = L.getShapeById(position.meta.stopLineId, chart);
    }

    lineShape.setPoints([{ price: position.stopPrice(), time: position.entryTime }]);
    lineShape.setProperties(lineProperties);
    L.setGeneratedShape(position.meta.stopLineId);

    lineProperties = {
        shape: "horizontal_line",
        disableSelection: true,
        disableSave: true,
        //disableUndo: true, //this leads to the shape being drawn only on 1 chart
        showInObjectsTree: false,
        lineWidth: 1,
        showLabel: true,
        horzLabelsAlign: "right",
        text: `${position.getProfitAtPrice(position.targetPrice())} ${L.session.currencyId} (${position.getProfitPercentage(position.getProfitAtPrice(position.targetPrice(), true))}%)`,
        vertLabelsAlign: position.quantity > 0 ? "bottom" : "top",
        linestyle: 1,
        linecolor: "#00FF00CC",
        textcolor: "#00FF00CC"
    };

    lineShape = L.getShapeById(position.meta.targetLineId, chart, true);
    if (!lineShape) {
        position.meta.targetLineId = await chart.createShape(
            { price: position.targetPrice(), time: position.entryTime },
            lineProperties);
        lineShape = L.getShapeById(position.meta.targetLineId, chart);
    }

    lineShape.setPoints([{ price: position.targetPrice(), time: position.entryTime }]);
    lineShape.setProperties(lineProperties);
    L.setGeneratedShape(position.meta.targetLineId);

    lineProperties = {
        shape: "horizontal_line",
        disableSelection: true,
        disableSave: true,
        //disableUndo: true, //this leads to the shape being drawn only on 1 chart
        showInObjectsTree: false,
        lineWidth: 1,
        linestyle: 2,
        linecolor: "#FFFF00CC"
    };

    if(position.bePrice()) {
        lineShape = L.getShapeById(position.meta.beLineId, chart, true);
        if (!lineShape) {
            position.meta.beLineId = await chart.createShape(
                { price: position.bePrice(), time: position.entryTime },
                lineProperties);
            lineShape = L.getShapeById(position.meta.beLineId, chart);
        }

        lineShape.setPoints([{ price: position.bePrice(), time: position.entryTime }]);
        lineShape.setProperties(lineProperties);
        L.setGeneratedShape(position.meta.beLineId);
    }
}

L.onEditField = function (event, position) {
    const element = $(event.currentTarget);
    if (!L.isEditingPositionsList()) {
        if (element.hasClass("V_DRAWDOWNPERCENTAGE") && position.exitTime) {
            L.createInput("number", event, position);
        } else if (element.hasClass("V_RUNUPPERCENTAGE") && position.exitTime) {
            L.createInput("number", event, position);
        } else if (element.hasClass("V_BERUNUPPERCENTAGE") && position.exitTime) {
            L.createInput("number", event, position);
        } else if (element.hasClass("V_DRAWDOWN") && position.exitTime) {
            L.createInput("number", event, position);
        } else if (element.hasClass("V_RUNUP") && position.exitTime) {
            L.createInput("number", event, position);
        } else if (element.hasClass("V_BERUNUP") && position.exitTime) {
            L.createInput("number", event, position);
        } else if (element.hasClass("V_VALUE")) {
            const columnName = $(event.currentTarget).parent().attr("column-name");
            if (!L.isPredefinedColumn(columnName, ["Notes", "Analysis Time", "Lots"])) {
                const column = L.session.sessionColumns.find(c => c.columnName == columnName);
                if (column.columnEnumValues) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    position.columnValue(element.parent().attr("column-name"), event.target.value);
                } else {
                    switch (column.columnType) {
                        case "text":
                        case "date":
                        case "time":
                        case "datetime":
                        case "number": {
                            if(columnName == "Lots" && !(event.shiftKey && event.ctrlKey)) {
                                return;
                            }
                            L.createInput(column.columnType, event, position);
                            break;
                        }
                        case "richtext": {
                            L.createTextAreaInput(event, position);
                            break;
                        }
                        case "bool": {
                            position.columnValue(element.parent().attr("column-name"), event.target.checked);
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

        const inputType = columnType == "datetime" ? "datetime-local" : columnType;

        element.html(`<input type="${inputType}" value="${value}" />`);
        const control = element.children("input");
        control.width(width * 1.5);
        control.height(height);
        control.on("focus", function () { this.select(); }).focus();
        control.focus();
        control.on("blur", (e) => {
            var userValue = e.target.value;

            if (element.hasClass("V_RUNUP")) {
                userValue = Math.abs(userValue);
                position.columnValue("Run-up", userValue);
                element.parents("td").find(".V_RUNUPPERCENTAGE").text(position.getRunUpPercentage());
                position.meta.trackRunUp = false;
            } else if (element.hasClass("V_DRAWDOWN")) {
                userValue = -Math.abs(userValue);
                position.columnValue("Drawdown", userValue);
                element.parents("td").find(".V_DRAWDOWNPERCENTAGE").text(position.getDrawDownPercentage());
                position.meta.trackDrawDown = false;
            } else if (element.hasClass("V_RUNUPPERCENTAGE")) {
                userValue = Math.abs(userValue);
                position.columnValue("Run-up", userValue * position.meta.initialBalance / 100);
                element.parents("td").find(".V_RUNUP").text(position.getRunUp());
                position.meta.trackRunUp = false;
            } else if (element.hasClass("V_DRAWDOWNPERCENTAGE")) {
                userValue = -Math.abs(userValue);
                position.columnValue("Drawdown", userValue * position.meta.initialBalance / 100);
                element.parents("td").find(".V_DRAWDOWN").text(position.getDrawDown());
                position.meta.trackDrawDown = false;
            } else if (element.hasClass("V_BERUNUP")) {
                userValue = Math.abs(userValue);
                position.columnValue("BE Run-up", userValue);
                element.parents("td").find(".V_BERUNUPPERCENTAGE").text(position.getBERunUpPercentage());
                if(position.columnValue("Run-up") < position.getBERunUp()) {
                    position.columnValue("Run-up", position.getBERunUp());
                    element.parents("td").parent().find(".V_RUNUP").text(position.getRunUp());
                    element.parents("td").parent().find(".V_RUNUPPERCENTAGE").text(position.getRunUpPercentage());
                }
                position.meta.trackBeRunUp = false;
            } else if (element.hasClass("V_BERUNUPPERCENTAGE")) {
                userValue = Math.abs(userValue);
                position.columnValue("BE Run-up", userValue * position.meta.initialBalance / 100);
                element.parents("td").find(".V_BERUNUP").text(position.getBERunUp());
                if(position.columnValue("Run-up") < position.getBERunUp()) {
                    position.columnValue("Run-up", position.getBERunUp());
                    element.parents("td").parent().find(".V_RUNUP").text(position.getRunUp());
                    element.parents("td").parent().find(".V_RUNUPPERCENTAGE").text(position.getRunUpPercentage());
                }
                position.meta.trackBeRunUp = false;
            } else if(element.parents("td").attr("column-name") == "Lots") {
                position.quantity = Number(userValue);
                position.risk((position.entryPrice - position.stopPrice()) * position.quantity * position.symbol.meta.contractSize * position.entryCurrencyRate);
                L.dataOps.updatePositionQuantity(position.positionId, position.quantity);
                L.getBalanceAfterPositions(L.session.capital, L.session.positions).then((balance) => { L.session.meta.balance = balance; });

                L.updatePositionUI(position);
            } else {
                position.columnValue(element.parent().attr("column-name"), userValue);
            }

            if (columnType == "date" || columnType == "time" || columnType == "datetime") {
                userValue = userValue.replace("T", " ");
            } else if (columnType == "number") {
                userValue = Number(userValue);
            }

            if (userValue.toString().trim().length == 0) {
                userValue = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'><path fill='currentColor' d='m21.45 7.55-1.8 1.8a.47.47 0 0 1-.67 0L14.65 5a.47.47 0 0 1 0-.66l1.8-1.8a1.88 1.88 0 0 1 2.65 0l2.35 2.35c.73.73.73 1.91 0 2.65ZM13.1 5.9 2.84 16.15l-.83 4.75a.94.94 0 0 0 1.1 1.09l4.74-.84L18.1 10.9a.47.47 0 0 0 0-.67L13.77 5.9a.47.47 0 0 0-.67 0Zm-6.25 9.37a.54.54 0 0 1 0-.77l6.01-6.01a.54.54 0 0 1 .78 0c.21.21.21.55 0 .77l-6.02 6.01a.54.54 0 0 1-.77 0Zm-1.41 3.29H7.3v1.42l-2.52.44-1.21-1.22.44-2.51h1.42v1.87Z'></path></svg>";
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
            position.columnValue(element.parent().attr("column-name"), userValue);
            if (userValue.trim().length == 0) {
                userValue = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'><path fill='currentColor' d='m21.45 7.55-1.8 1.8a.47.47 0 0 1-.67 0L14.65 5a.47.47 0 0 1 0-.66l1.8-1.8a1.88 1.88 0 0 1 2.65 0l2.35 2.35c.73.73.73 1.91 0 2.65ZM13.1 5.9 2.84 16.15l-.83 4.75a.94.94 0 0 0 1.1 1.09l4.74-.84L18.1 10.9a.47.47 0 0 0 0-.67L13.77 5.9a.47.47 0 0 0-.67 0Zm-6.25 9.37a.54.54 0 0 1 0-.77l6.01-6.01a.54.54 0 0 1 .78 0c.21.21.21.55 0 .77l-6.02 6.01a.54.54 0 0 1-.77 0Zm-1.41 3.29H7.3v1.42l-2.52.44-1.21-1.22.44-2.51h1.42v1.87Z'></path></svg>";
            }

            element.html(userValue);
        });
    }
}

L.isEditingPositionsList = function () {
    return $(".testingview-positions-table input:not([type='checkbox'])").length > 0
        || $(".testingview-positions-table textarea").length > 0;
}

L.viewSnapshots = function (event, position) {
    if ($(`tr#ID_${position.positionId}`).hasClass("selected")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    if (!position.positionSnapshots || position.positionSnapshots.length === 0) {
        return;
    }

    var preloadedImages = [];
    
    position.positionSnapshots.forEach((snapshot) => { 
        var img = new Image();
        img.src = `${L.snapshotUrlPrefix}${snapshot.snapshotUrl}`;
        preloadedImages.push(img);
    });

    let currentIndex = 0;
    let currentUrl = `${L.snapshotUrlPrefix}${position.positionSnapshots[currentIndex].snapshotUrl}`;

    function updateSnapshot() {
        currentUrl = `${L.snapshotUrlPrefix}${position.positionSnapshots[currentIndex].snapshotUrl}`;
        if (position.positionSnapshots.length === 0) {
            $(".snapshot-viewer").remove();
        } else {
            $(".snapshot-viewer-image-container img").attr("src", `${currentUrl}`);
        }
        $(".snapshot-viewer-info .snapshot-viewer-counter").text(`${currentIndex + 1} / ${position.positionSnapshots.length}`);
        $(".snapshot-viewer-info .snapshot-viewer-url").text(currentUrl);
        $(".snapshot-viewer-info .snapshot-viewer-time").text(
            L.toTradingViewDateTimeFormat(
                position.positionSnapshots[currentIndex].sessionTime,
                window.TradingViewApi.activeChart().getTimezone()
            )
        );
        $(`#ID_${position.positionId}.V_POSITION`).find(".view-snapshots-button").attr("data-snapshots", position.positionSnapshots.length);
        $(`#ID_${position.positionId}.V_POSITION`).find(".view-snapshots-button").attr("title", `View ${position.positionSnapshots.length > 1 ? position.positionSnapshots.length + " " : ""}snapshot${position.positionSnapshots.length > 1 ? "s" : ""}`);
    }

    const viewer = $(`
        <div class="snapshot-viewer">
            <button class="snapshot-viewer-button snapshot-viewer-close-button lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;" title="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path stroke="currentColor" stroke-width="1.2" d="m1.5 1.5 15 15m0-15-15 15"></path></svg>
            </button>
            <button class="snapshot-viewer-button snapshot-viewer-delete-button lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path></svg>
            </button>
            <div class="snapshot-viewer-image-container">
                <img src="${currentUrl}" alt="Snapshot" />
            </div>
            <button class="snapshot-viewer-button snapshot-viewer-nav-button snapshot-viewer-prev lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;" title="Previous">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.2" d="M17 22.5 6.85 12.35a.5.5 0 0 1 0-.7L17 1.5"></path></svg>
            </button>
            <div class="snapshot-viewer-info">
                <span class="snapshot-viewer-counter">${currentIndex + 1} / ${position.positionSnapshots.length}</span>
                <br />
                <span class="snapshot-viewer-url" contenteditable>${currentUrl}</span>
                <br />
                <span class="snapshot-viewer-time">${L.toTradingViewDateTimeFormat(position.positionSnapshots[currentIndex].sessionTime, window.TradingViewApi.activeChart().getTimezone())}</span>
            </div>
            <button class="snapshot-viewer-button snapshot-viewer-nav-button snapshot-viewer-next lightButton secondary xsmall typography-regular14px" style="--ui-lib-light-button-content-max-lines: 1;" title="Next">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none"><g transform="scale(-1,1) translate(-24,0)"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.2" d="M17 22.5 6.85 12.35a.5.5 0 0 1 0-.7L17 1.5"></path></g></svg>
            </button>
        </div>
    `);

    viewer.on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        viewer.find(".snapshot-viewer-close-button").click();
    });

    viewer.find(".snapshot-viewer-close-button").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        viewer.remove();
        $(document).off("keydown.snapshotViewer"); // Remove keydown listener when viewer is closed
    });

    viewer.find(".snapshot-viewer-delete-button").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        position.positionSnapshots.splice(currentIndex, 1);
        L.dataOps.setPositionSnapshots(position.positionId, position.positionSnapshots);

        if (position.positionSnapshots.length === 0) {
            viewer.remove();
            $(document).off("keydown.snapshotViewer"); // Remove keydown listener when viewer is closed
        } else {
            currentIndex = Math.min(currentIndex, position.positionSnapshots.length - 1);
        }

        updateSnapshot();
    });

    viewer.find(".snapshot-viewer-prev").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = position.positionSnapshots.length - 1; // Cycle to the last snapshot
        }
        updateSnapshot();
    });

    viewer.find(".snapshot-viewer-next").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (currentIndex < position.positionSnapshots.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // Cycle to the first snapshot
        }
        updateSnapshot();
    });

    viewer.find(".snapshot-viewer-url").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    });

    // Add keydown listener for left/right arrow keys
    $(document).on("keydown.snapshotViewer", function (e) {
        if (e.key === "ArrowLeft") {
            viewer.find(".snapshot-viewer-prev").click();
        } else if (e.key === "ArrowRight") {
            viewer.find(".snapshot-viewer-next").click();
        } else if (e.key === "Escape") {
            viewer.find(".snapshot-viewer-close-button").click();
        } else if (e.key === "Delete") {
            viewer.find(".snapshot-viewer-delete-button").click();
        }
    });

    $("body").append(viewer);
}

L.takeSnapshot = async function (event, position) {
    if ($(`tr#ID_${position.positionId}`).hasClass("selected")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    var takeSnapshotButton = $(`#ID_${position.positionId}.V_POSITION`).find(".take-snapshot-button");
    var takeSnapshotLoader = $(`#ID_${position.positionId}.V_POSITION`).find(".take-snapshot-loader");
    takeSnapshotButton.hide();
    takeSnapshotLoader.show();

    setTimeout(async () => {
        const formattedSessionDate = $("#TestingViewCurrentDate").text();
        var infoTextShapeId = null;
        if (event.ctrlKey) {
            infoTextShapeId = await TradingViewApi.activeChart().createAnchoredShape({ x: 0.005, y: 0.93 }, { shape: "anchored_text", text: `TestingView date: ${formattedSessionDate}`, overrides: { color: "white", backgroundColor: "rgb(0,0,0)", backgroundTransparency: 1, fillBackground: true, fontsize: 14 } })
        }
        const snapshotUrl = await window.TradingViewApi.takeScreenshot();
        if(infoTextShapeId) {
            L.removeShapeById(infoTextShapeId);
        }
        position.positionSnapshots.push({ snapshotUrl, sessionTime: L.session.currentDate });
        L.dataOps.setPositionSnapshots(position.positionId, position.positionSnapshots);

        var viewSnapshostButton = $(`#ID_${position.positionId}.V_POSITION`).find(".view-snapshots-button");
        viewSnapshostButton.attr("data-snapshots", position.positionSnapshots.length);
        viewSnapshostButton.attr("title", `View ${position.positionSnapshots.length > 1 ? position.positionSnapshots.length + " " : ""}snapshot${position.positionSnapshots.length > 1 ? "s" : ""}`);

        setTimeout(() => {
            takeSnapshotButton.show();
            takeSnapshotLoader.hide();
        }, 300);
    }, 10);
}

L.isSameSymbol = function(chart, position) {
    return chart.symbol() == position.symbol.symbolName || chart.chartModel().mainSeries().symbolInfo().pro_name == position.symbol.symbolName;
}

L.drawShapeForPosition = function (position) {
    var shapeExists = null;
    return L.applyOnChartsAsync(async (chart) => {
        var shapeId = position.getShape().shapeId;
        var shape = L.getShapeById(shapeId, chart, true);
        if(shapeExists == null) {
            shapeExists = !!shape;
        }

        if (chart && L.isSameSymbol(chart, position)) {
            const firstBarTime = chart.chartModel().mainSeries().firstBar()[0];
            if(position.entryTime >= firstBarTime) {
                const points = [{ price: position.entryPrice, time: position.entryTime }, { price: position.entryPrice, time: position.getShape().endTime }];
                if (!shape) {
                    shapeId = await chart.createShape(
                        points,
                        {
                            shape: position.getShape().name,
                        }
                    );
                    L.setGeneratedShape(shapeId);
                    shape = L.getShapeById(shapeId, chart);
                }

                if (!position.exitTime) {
                    L.createLinesForPosition(position, chart);
                }

                await L.delay(200);
                if(!shapeExists) {
                    shape.setPoints(points);

                    L.syncShapeWithPosition(shape, position);

                    const shapeDataSourceProperties = shape.lineDataSource().properties();

                    shapeDataSourceProperties.targetPrice.setValue(position.getShape().targetPrice);
                    shapeDataSourceProperties.stopPrice.setValue(position.getShape().stopPrice);

                    const shapeProperties = {
                        currency: L.session.currencyId,
                        accountSize: position.meta.initialBalance,
                        lotSize: position.symbol.meta.contractSize,
                        entryPrice: position.entryPrice,
                        risk: position.getRiskPercentage(true),
                        riskDisplayMode: "percents",
                    }

                    L.setPositionShapeSettings(shapeDataSourceProperties, {id: shapeId, ...shapeProperties});

                    shape.setProperties(position.getShape());

                    shapeDataSourceProperties.riskDisplayMode.setValue("percents");
                    shapeDataSourceProperties.risk.setValue(shapeProperties.risk);
                    position.getShape().shapeId = shapeId;
                    position.meta.hasShapeRedraw = true;
                }
            }
        }
        
        return shape;
    }, true, true);
}

L.removeShapeForPosition = function (position, ignoreErrors) {
    if (position.exitTime && position.positionId != position.getShape().shapeId) {
        L.removeShapeById(position.getShape().shapeId, null, ignoreErrors);
        position.meta.hasShapeRedraw = false;
    }
}

/*
--------------------------------------
Performance & stats
--------------------------------------
*/

L.calculateSharpeRatio = function (returns) {
    if (!returns || returns.length === 0) return "N/A";

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - meanReturn, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length);

    return stdDev !== 0 ? (meanReturn / stdDev).toFixed(2) : "N/A";
};

L.getStatsSummary = function () {
    const positions = (L.session.positions || []).map(p => p).sort((a, b) => a.entryTime - b.entryTime).filter(p => p.exitTime);
    const cacheKey = `getStatsSummary-${positions.length}`;

    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const filteredPositions = positions.filter(p => Math.abs(p.getProfit(true)) >= p.getRisk(true) / 10);
    const totalTrades = filteredPositions.length;
    const winningTrades = filteredPositions.filter(p => p.getProfit(true) > 0).length;
    const losingTrades = filteredPositions.filter(p => p.getProfit(true) < 0).length;
    const breakevenTrades = positions.length - winningTrades - losingTrades;

    const totalProfit = filteredPositions.reduce((sum, p) => sum + (p.getProfit(true) > 0 ? p.getProfit(true) : 0), 0);
    const totalLoss = filteredPositions.reduce((sum, p) => sum + (p.getProfit(true) < 0 ? p.getProfit(true) : 0), 0);

    const winrate = totalTrades > 0 ? (((winningTrades / totalTrades) * 100).toFixed(0) + "%") : "N/A";
    const profitFactor = totalLoss !== 0 ? Math.abs((totalProfit / totalLoss).toFixed(2)) : "N/A";

    const avgRiskToReward = (losingTrades != 0 && winningTrades != 0 && totalLoss != 0)
        ? (
            (totalProfit / winningTrades) /
            (Math.abs(totalLoss) / losingTrades)
          ).toFixed(2)
        : "N/A";

    const profits = positions.map(p => p.getProfit(true));
    const sharpeRatio = L.calculateSharpeRatio(profits);

    // Calculate streaks
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let maxConsecutiveBes = 0;
    let currentWins = 0;
    let currentLosses = 0;
    let currentBes = 0;

    let runningBalance = L.session.capital;
    let peak = runningBalance;
    let maxDrawdown = 0;
    let currentDrawdown = 0;

    for (const position of positions) {
        const profit = position.getProfit(true);
        const risk = position.getRisk(true);
        if (profit >= risk / 10) {
            currentWins++;
            currentLosses = 0;
            currentBes = 0;
        } else if (profit <= -risk / 10) {
            currentLosses++;
            currentWins = 0;
            currentBes = 0;
        } else {
            currentBes++;
            currentWins = 0;
            currentLosses = 0;
        }

        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
        maxConsecutiveBes = Math.max(maxConsecutiveBes, currentBes);

        runningBalance += position.getProfit(true);
        
        if (runningBalance > peak) {
            peak = runningBalance;
        } else {
            currentDrawdown = ((peak - runningBalance) / peak) * 100;
            maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
        }            
    }

    function summaryLabel(label) {
        return `\t${label}\n`;
    }

    function summaryValue(value) {
        return value.toString().padStart(8, " ");
    }

    const summary = summaryValue(winrate) + summaryLabel("Winrate") +
                    summaryValue(profitFactor) + summaryLabel("Profit factor") +
                    summaryValue(avgRiskToReward) + summaryLabel("R:R ratio") +
                    summaryValue(sharpeRatio) + summaryLabel("Sharpe ratio") +
                    summaryValue(winningTrades) + summaryLabel("Winning trades") +
                    summaryValue(losingTrades) + summaryLabel("Losing trades") +
                    summaryValue(breakevenTrades) + summaryLabel("BE trades") +
                    summaryValue(maxConsecutiveWins) + summaryLabel("Win streak") +
                    summaryValue(maxConsecutiveLosses) + summaryLabel("Loss streak") +
                    summaryValue(maxConsecutiveBes) + summaryLabel("BE streak") +
                    summaryValue(`${maxDrawdown.toFixed(1)}%`) + summaryLabel("Max drawdown");

    L.cache.set(cacheKey, summary, 3600); // Cache for 1 hour
    return summary;
};

/*
--------------------------------------
Data retrieval
--------------------------------------
*/

L.dataOps.getUserById = function (userId) {
    return L.dataOps.get(`admin/user/${userId}`);
};

L.dataOps.getOrSaveUserId = function (tradingViewUser) {
    return L.dataOps.put(`admin/user`, {...tradingViewUser, settings: null, available_offers: null, session_hash: null, auth_token: null, notification_count: null});
};

L.dataOps.getPermissions = function (planId) {
    return L.dataOps.get(`admin/plans/${planId}/permissions`);
};

L.dataOps.getSessionColumns = function (sessionId) {
    return L.dataOps.get(`journaling/session-columns/${sessionId}`);
}

L.dataOps.saveSessionColumns = function (sessionId, columns) {
    return L.dataOps.post(`journaling/session-columns/${sessionId}`, columns);
}

L.dataOps.getPositionColumns = function (positionId) {
    return L.dataOps.get(`journaling/positions/columns/${positionId}`);
}

L.dataOps.setPositionColumn = function (positionId, column) {
    return L.dataOps.put(`journaling/positions/columns/${positionId}`, column);
}

L.dataOps.getSessions = async function (userId) {
    var sessions = await L.dataOps.get("backtesting/sessions", { userId }).then(s => s || []);
    return sessions.map(session => {
        session.currentDate = new Date(session.currentDate).getTime() / 1000;
        session.lastUpdate = new Date(session.lastUpdate);
        return session;
    });
}

L.dataOps.getSession = async function (sessionId) {
    const session = await L.dataOps.get(`backtesting/sessions/${sessionId}`);
    session.currentDate = new Date(session.currentDate).getTime() / 1000;
    session.lastUpdate = new Date(session.lastUpdate);
    return session;
}

L.dataOps.createSession = function (session) {
    return L.dataOps.post("backtesting/sessions", { ...session, currentDate: new Date(session.currentDate * 1000) });
}

L.dataOps.updateSession = function (session) {
    L.cache.delete(`getSessionPositions-${session.sessionId}`);
    return L.dataOps.put(`backtesting/sessions`, { ...session, currentDate: new Date(session.currentDate * 1000) });
}

L.dataOps.deleteSession = function (sessionId) {
    return L.dataOps.delete(`backtesting/sessions/${sessionId}`);
}

L.dataOps.getSessionParameters = function (sessionId) {
    return L.dataOps.get(`backtesting/sessions/${sessionId}/parameters`);
};

L.dataOps.setSessionParameterValue = function (sessionId, parameterId, parameterValue) {
    return L.dataOps.put(`backtesting/sessions/${sessionId}/parameters/${parameterId}`, parameterValue);
};

L.dataOps.getOrAddSymbol = async function (symbolName, getSymbolInfo) {
    const cacheKey = `getOrAddSymbol-${symbolName}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    } else {
        var symbolData = await L.dataOps.get(`backtesting/symbols/${symbolName}`);

        if (!symbolData) {
            const chartSymbolInfo = getSymbolInfo();
            symbolData = { symbolName: chartSymbolInfo.full_name, symbolType: chartSymbolInfo.type, pricePrecision: chartSymbolInfo.pricescale.toString().length - 1, quantityPrecision: 2, currencyId: chartSymbolInfo.currency_id };
            symbolData = await L.dataOps.post("backtesting/symbols", symbolData);
        }

        L.cache.set(`getOrAddSymbol-${symbolName}`, symbolData, 3600);
        return symbolData;
    }
}

L.dataOps.getSymbolRuleContractSizes = async function (symbolType) {
    const cacheKey = `getSymbolRuleContractSizes-${symbolType}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    } else {
        const contractSizes = await L.dataOps.get(`backtesting/symbol-rule-contract-sizes/${symbolType}`);
        L.cache.set(`getSymbolRuleContractSizes-${symbolType}`, contractSizes, 3600);
        return contractSizes;
    }
}

L.dataOps.getSessionPositions = async function (sessionId) {
    const cacheKey = `getSessionPositions-${sessionId}`;
    const cacheEntry = L.cache.getIfExists(cacheKey);
    if(cacheEntry[0]) {
        return cacheEntry[1];
    }

    const rawPositions = await L.dataOps.get(`backtesting/positions/${sessionId}`);
    const processedPositions = rawPositions.map((position, i) => ({
        ...position,
        index: rawPositions.length - i,
        entryTime: Math.floor(new Date(position.entryTime).getTime() / 1000),
        exitTime: position.exitTime ? new Date(position.exitTime).getTime() / 1000 : null,
        positionShapes: position.positionShapes?.map(shape => ({
            ...shape,
            endTime: Math.floor(new Date(shape.endTime).getTime() / 1000)
        })),
        positionBEs: position.positionBEs?.map(be => ({
            ...be,
            barTime: Math.floor(new Date(be.barTime).getTime() / 1000)
        })),
        positionSLs: position.positionSLs?.map(sl => ({
            ...sl,
            barTime: Math.floor(new Date(sl.barTime).getTime() / 1000)
        })),
        positionTPs: position.positionTPs?.map(tp => ({
            ...tp,
            barTime: Math.floor(new Date(tp.barTime).getTime() / 1000)
        })),
        positionRisks: position.positionRisks?.map(risk => ({
            ...risk,
            barTime: Math.floor(new Date(risk.barTime).getTime() / 1000)
        }))
    }));

    L.cache.set(cacheKey, processedPositions, 300); // Cache for 5 minutes
    return processedPositions;
}

L.dataOps.createPosition = function (position) {
    return L.dataOps.post(`backtesting/positions`,
        {
            ...position,
            sessionId: L.session.sessionId,
            symbolId: position.symbol?.symbolId,
            symbol: null,
            ...{
                entryTime: new Date(position.entryTime * 1000),
                positionShapes: position.positionShapes?.map(shape => ({
                    ...shape,
                    endTime: new Date(shape.endTime * 1000)
                })),
                positionBEs: position.positionBEs?.map(be => ({
                    ...be,
                    barTime: new Date(be.barTime * 1000)
                })),
                positionSLs: position.positionSLs?.map(sl => ({
                    ...sl,
                    barTime: new Date(sl.barTime * 1000)
                })),
                positionTPs: position.positionTPs?.map(tp => ({
                    ...tp,
                    barTime: new Date(tp.barTime * 1000)
                })),
                positionRisks: position.positionRisks?.map(risk => ({
                    ...risk,
                    barTime: new Date(risk.barTime * 1000)
                }))
            }
        });
}

L.dataOps.closePosition = function (position) {
    return L.dataOps.put(`backtesting/positions/close`, { ...position, 
        exitTime: new Date(position.exitTime * 1000), 
        entryTime: undefined, 
        positionShapes: undefined, 
        positionSLs: undefined, 
        positionTPs: undefined, 
        positionBEs: undefined, 
        positionRisks: undefined, 
        positionColumns: undefined, 
        positionSnapshots: undefined,
        symbol: undefined
    });
}

L.dataOps.addPositionBE = function (positionId, be) {
    return L.dataOps.put(`backtesting/positions/be/${positionId}`, { ...be, barTime: new Date(be.barTime * 1000) });
}

L.dataOps.addPositionRisk = function (positionId, risk) {
    return L.dataOps.put(`backtesting/positions/risk/${positionId}`, { ...risk, barTime: new Date(risk.barTime * 1000) });
}

L.dataOps.addPositionSL = function (positionId, sl) {
    return L.dataOps.put(`backtesting/positions/sl/${positionId}`, { ...sl, barTime: new Date(sl.barTime * 1000) });
}

L.dataOps.addPositionTP = function (positionId, tp) {
    return L.dataOps.put(`backtesting/positions/tp/${positionId}`, { ...tp, barTime: new Date(tp.barTime * 1000) });
}

L.dataOps.getPositionShapes = function (positionId) {
    return L.dataOps.get(`backtesting/positions/shapes/${positionId}`);
}

L.dataOps.setPositionShape = function (positionId, positionShape) {
    return L.dataOps.put(`backtesting/positions/shapes/${positionId}`, positionShape);
}

L.dataOps.getPositionSnapshots = async function (positionId) {
    var rawSnapshots = await L.dataOps.get(`journaling/positions/snapshots/${positionId}`);
    return rawSnapshots.map((snapshot) => ({
        ...snapshot, 
        sessionTime: Math.floor(new Date(snapshot.sessionTime).getTime() / 1000) 
    }));
}

L.dataOps.setPositionSnapshots = function (positionId, snapshots) {
    return L.dataOps.put(`journaling/positions/snapshots/${positionId}`, snapshots.map(snapshot => ({ ...snapshot, sessionTime: new Date(snapshot.sessionTime * 1000) })));
};

L.dataOps.deletePosition = function (positionId) {
    return L.dataOps.delete(`backtesting/positions/${positionId}`);
};

L.dataOps.updateLastPrice = function (sessionId, symbolId, lastPrice) {
    return L.dataOps.put(`backtesting/sessions/${sessionId}/symbols/${symbolId}/last-price`, lastPrice);
};

L.dataOps.updatePositionQuantity = function (positionId, quantity) {
    return L.dataOps.put(`backtesting/positions/${positionId}/quantity`, quantity);
};

L.dataOps.exportSessionStatistics = function (sessionName, positionEntries) {
    return L.dataOps.post(`journaling/export/excel/${sessionName}`, positionEntries, "blob");
};

L.dataOps.get = async function (url, params, responseFormat) {
    if (params) {
        url += "?" + new URLSearchParams(params);
    }
    return await fetch(`https://js.testingview.com/${url}`).then(response => {
        if (response.status === 200) {
            return L.dataOps.parseResponse(response, responseFormat);
        }
    });
}

L.dataOps.post = async function (url, data, responseFormat) {
    return await fetch(`https://js.testingview.com/${url}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (response.status === 200) {
            return L.dataOps.parseResponse(response, responseFormat);
        }
    });
}

L.dataOps.put = async function (url, data, responseFormat) {
    return await fetch(`https://js.testingview.com/${url}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (response.status === 200) {
            return L.dataOps.parseResponse(response, responseFormat);
        }
    });
}

L.dataOps.delete = async function (url) {
    return await fetch(`https://js.testingview.com/${url}`, {
        method: "DELETE"
    }).then(response => {
        if (response.status === 200) {
            return response.json();
        }
    });
}

L.dataOps.parseResponse = async function (response, responseFormat) {
    responseFormat = responseFormat || "json";

    if (responseFormat == "blob") {
        const blob = await response.blob();

        // Extract filename from Content-Disposition header
        const disposition = response.headers.get("Content-Disposition");
        let filename = "download.dat";

        if (disposition) {
            const utf8Match = disposition.match(/filename\*\s*=\s*UTF-8''([^;\n]*)/);
            const normalMatch = disposition.match(/filename\s*=\s*"?([^"]+)"?/);

            if (utf8Match) {
                filename = decodeURIComponent(utf8Match[1]);
            } else if (normalMatch) {
                filename = decodeURIComponent(normalMatch[1]);
            }
        }

        // Create and trigger download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return; // Nothing to return after download
    }

    // Other formats
    switch (responseFormat) {
        case "text": return response.text();
        case "json": return response.json();
        case "number": return response.text().then(text => parseFloat(text));
        default: throw new Error("Unsupported response format: " + responseFormat);
    }
};

L.addCss();
L.createToolbarButton();
L.toast("TestingView is ready. Start from the top toolbar when needed.", 3000);

if(user.username == "claudiu-i") {
    $('<script>',{type:'module',src:'//js.testingview.com/js/ext.js',nonce:$('script')[0].nonce}).appendTo('head');
}
