# TestingView Frontend - Copilot Instructions

## Project Overview
This is the frontend for **TestingView**, a TradingView-integrated backtesting application. The codebase runs as a browser extension/injection that enhances TradingView's chart replay functionality with position tracking, journaling, and statistics. It intercepts TradingView's replay mode to provide professional backtesting features.

**No cleanup required** - Everything resets by refreshing the TradingView page. All runtime state lives in memory on the `L` object.

---

## Architecture

### Core Singleton: `L`
All functionality attaches to the global `L` object defined in [testingview.core.js](js/testingview.core.js):
- `L.session` - Current session state (positions, columns, meta)
- `L.user` - User authentication and plan info
- `L.permissions` - Feature flags based on subscription
- `L.t` - TradingView API (`TradingViewApi`)
- `L.r` - Replay API (`TradingViewApi.replayApi()`)
- `L.cache` - In-memory TTL cache: `L.cache.set(key, value, ttlSeconds)`, `L.cache.get(key)`, `L.cache.getIfExists(key)` returns `[exists, value]`
- `L.events` - Event arrays: `onSelectDate`, `onFastForward`, `onOpeningPosition`, `onNewReplayResolutions`, `onTimeframeChange`, `onLoad`
- `L.sessionParameterIds` - Constants for session settings (PreventCandlePreviews, EnablePredefinedTimes, ConfirmEntries, AutoSnapshot, etc.)

### String Localization System (CRITICAL)
**For obfuscation**, all user-facing strings use a lookup system with **intentionally random, non-categorized indices**:
- `L.s(sectionIndex, stringIndex, ...args)` - Core strings from [loc.1.raw.json](config/loc.1.raw.json)
- `L.r.s(sectionIndex, stringIndex, ...args)` - Replay strings from [loc.2.raw.json](config/loc.2.raw.json)

**Index rules**: Sections range from `0` to `9` AND `-1` to `-9`. String indices within sections also range `0` to `9` AND `-1` to `-9`. The placement is **random** - there is no semantic grouping.

**Comments are mandatory**: Every localized string call has an inline comment showing the actual value:
```javascript
L.s(0, 6) /* true */
L.r.s(5, 1) /* play-pause-button */
L.s(4, 8, path) /* https://api.testingview.com/{0} */
```
**ALWAYS preserve these comments** when editing. They are the only way to understand what strings mean.

The `L.cs()` function handles string interpolation with `{0}`, `{1}` placeholders.

---

## Complete Module Structure

| File | Purpose |
|------|---------|
| **testingview.core.js** | Defines global `L` object with cache, events, session parameter IDs, plan definitions |
| **testingview.exec.js** | Entry point - calls `L.localize()`, configures globals, creates toolbar button, loads addons |
| **testingview.general.js** | Utility functions: `L.delay()`, `L.waitUntil()`, `L.asyncInterval()`, `L.trigger()`, `L.subscribe()`, `L.s()`, `L.r.s()`, `L.localize()`, `L.selectDate()`, `L.selectDateWithNavigation()`, `L.exit()` |
| **testingview.sessions.js** | `L.startSession()` - loads session, positions, sets up replay mode, creates UI; `L.updateSessionCapitalInfo()` - updates balance/equity display |
| **testingview.positions.js** | `L.openPosition()`, `L.closePosition()`, `L.setPositionFunctions()` - attaches helper methods to position objects, `L.updateActivePositions()`, `L.updatePosition()`, `L.detectExit()`, `L.keepShapeInfoInSync()`, `L.calculateProfit()` |
| **testingview.candles.js** | `L.onCurrentDateChange()` - tracks replay time changes, `L.onBarActivity()` - main update loop, `L.skipTime()` - fast forward logic, `L.stepForward()`, `L.startSkipping()`, `L.stopSkipping()`, `L.stopAtPredefinedTime()` |
| **testingview.candles.monitor.js** | `L.pollBarActivity()` - polls for bar changes, `L.monitorEntryShapes()` - watches for new position shapes, `L.detectEntries()` - detects when price crosses entry level, `L.subscribeToData()` |
| **testingview.charts.js** | `L.c()` - get active chart, `L.getCharts()` - sorted chart list, `L.getPositionChart()`, `L.applyOnCharts()`, `L.applyOnChartsAsync()`, `L.onSymbolChanged()`, `L.onChartIntervalChanged()`, `L.setHistory()` - builds bar/price history arrays |
| **testingview.shapes.js** | `L.getPositionShapes()`, `L.generateEntryShapeCharts()`, `L.showBeLine()`, `L.removeBeLine()`, `L.syncShapeWithPosition()`, `L.createLinesForPosition()` - draws entry/SL/TP/BE lines, `L.drawShapeForPosition()` |
| **testingview.ui.js** | `L.addCss()`, `L.createToolbarButton()`, `L.createReplayControls()` - play/pause/forward buttons, balance display, settings |
| **testingview.data.js** | All API methods: `L.dataOps.get/post/put/delete()`, session CRUD, position CRUD, symbol lookups, parameter storage. Base URL: `https://api.testingview.com/` |
| **testingview.dialogs.js** | `L.showDialog()`, `L.showSessions()`, `L.showSettings()`, `L.showGotoDateDialog()`, `L.monitorDialogs()`, `L.messageBox()`, `L.confirmBox()`, `L.toast()` |
| **testingview.dialogs.sessions.js** | `L.createSessionsUI()` - session list/create dialog |
| **testingview.dialogs.settings.js** | `L.createSettingsUI()` - session settings dialog |
| **testingview.dialogs.gotodate.js** | `L.createGotoDateUI()` - date/time navigation dialog |
| **testingview.dialogs.analysistimes.js** | `L.createAnalysisTimesUI()` - analysis time tracking dialog |
| **testingview.journal.js** | Position list UI: `L.createPositionsListHeader()`, `L.createPositionListCell()`, `L.addToPositionList()`, `L.updatePositionUI()`, `L.updatePositionsList()`, column management |
| **testingview.stats.js** | Statistics: `L.stats.getStatsSummary()`, `L.stats.exportStats()`, `L.stats.getHighLevelStats()`, `L.stats.getStreaks()`, `L.stats.computeMaxDrawdown()`, `L.stats.drawEquityCurve()`, `L.stats.computeOptimalSLSize()` |
| **testingview.snapshots.js** | `L.takeSnapshot()`, `L.viewSnapshots()`, `L.brandSnapshots()` - adds TestingView branding to TradingView screenshots |
| **testingview.datetime.js** | Date/time utilities: `L.toTradingViewDateTimeFormat()`, `L.getDateInTimezone()`, `L.formatLocalTime()`, `L.resolutionToSeconds()` |
| **testingview.brokersync.js** | Broker synchronization features |
| **testingview.sessionchannel.js** | `L.initSessionChannel()` - BroadcastChannel for multi-tab sync |
| **addon.*.js** | Optional feature modules loaded dynamically based on user permissions |

---

## How Candle Monitoring Works

The system tracks bar changes through polling in `L.pollBarActivity()`:

1. **Polling Loop**: `L.asyncInterval(() => L.pollBarActivity(ctx), 10)` runs every 10ms
2. **Change Detection**: Compares `currentBarInfo` (time, open, high, low, close) with `previousBarInfo`
3. **On Change**: Calls `L.onBarActivity(previousBarInfo, currentBarInfo)` which:
   - Updates history arrays via `L.setHistory(chart)` for each chart
   - Calls `L.detectEntries()` to check for new position entries
   - Calls `L.session.assessPositionsTracking()` to manage run-up/drawdown tracking
   - Calls `L.updateActivePositions()` to check SL/TP/BE hits
   - Calls `L.updatePositionsList()` to refresh UI
   - Calls `L.stopAtPredefinedTime()` to check time-based stops

**History Arrays**: Each chart maintains:
- `chart.barsHistoryEntries` - Last 20 bars with OHLC data
- `chart.priceHistoryEntries` - Last 50 price/time pairs for tick-level tracking

---

## How Position Entry Detection Works

In `L.detectEntries()` (testingview.candles.monitor.js):

1. **Shape Discovery**: `L.generateEntryShapeCharts()` finds `long_position` or `short_position` shapes not yet linked to positions
2. **Entry Detection**: For each pending shape, iterates through `priceHistoryEntries` and `barsHistoryEntries`:
   - Checks if price crosses the shape's entry price level
   - For price history: `previousBar.price <= entryPrice <= bar.price`
   - For bar history: Entry price within bar's OHLC range
3. **Position Creation**: When entry detected, calls `L.openPosition()` which:
   - Gets symbol info and contract size
   - Calculates quantity based on risk settings
   - Creates position via API
   - Syncs shape properties with position data
   - Creates entry/SL/TP lines on chart

---

## How Quantity is Calculated

Quantity calculation happens in `L.openPosition()`:

```javascript
position.quantity = shapeDataSourceProperties.qty.value() / position.symbol.meta.contractSize 
                    * (shapeInfo.name == 'long_position' ? 1 : -1);
```

Where:
- `qty` comes from TradingView's position shape (calculated from risk % and stop distance)
- `contractSize` is fetched via `L.getContractSize(symbolName, symbolType)` which looks up `symbolRuleContractSizes` from API based on regex rules
- Sign indicates direction (positive = long, negative = short)
- `entryCurrencyRate` adjusts for currency conversion

The shape's `lotSize` property is set to the contract size so TradingView calculates the correct `qty` from risk percentage.

---

## The Candle Preview Problem and Workaround

**Problem**: When changing timeframes or symbols in TradingView replay mode, the chart briefly shows "future" candles that haven't been reached yet in the replay timeline. This would give users unfair information.

**Workaround** (controlled by `PreventCandlePreviews` session parameter):

In `L.selectDateWithNavigation()`:
1. Instead of jumping directly to target timestamp, calculates `lastWarmupTimeframeClose` - the last complete candle close before target
2. Navigates to that candle close time first
3. Then uses `L.skipTime()` to step forward bar-by-bar to reach exact target
4. This ensures no future candles are ever visible

In `L.onChartIntervalChanged()`:
1. Detects timeframe changes via subscription
2. Stores current `L.replayTo` target
3. After bars reload, if `PreventCandlePreviews` is enabled, uses `L.selectDateWithNavigation()` to replay forward to original time

---

## Position Helper Methods

All position objects have helper methods attached via `L.setPositionFunctions(position)` in testingview.positions.js:

### Core Data Access
| Method | Returns | Description |
|--------|---------|-------------|
| `position.getIndex()` | number | Position sequence number in session |
| `position.getDirection()` | string | `"Long"` or `"Short"` based on quantity sign |
| `position.getStatus()` | string | `"Exit Long/Short"` or `"Open"` |
| `position.getQuantity(abs, noRounding)` | number | Lot size, optionally absolute value |
| `position.getSymbolCurrency()` | string | Symbol's base currency (e.g., "USD") |

### Price Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `position.getEntryPrice(noRounding)` | number | Entry price with symbol precision |
| `position.getExitPrice(noRounding)` | number | Exit price (if closed) |
| `position.getLatestPrice(noRounding)` | number | Current price for open, exit price for closed |
| `position.stopPrice(chart, noRounding, index)` | number | SL price at specified index (default: latest) |
| `position.targetPrice(chart, noRounding, index)` | number | TP price at specified index |
| `position.bePrice(chart, noRounding, index)` | number | Break-even price at specified index |
| `position.risk(chart, noRounding, index)` | number | Dollar risk at specified index |

### Date/Time Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `position.getEntryDate(chart)` | string | Entry time in TradingView format |
| `position.getExitDate(chart)` | string | Exit time or current session date |

### P&L and Risk Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `position.getProfit(noRounding, perLotCost)` | cost deduction | number | Realized/unrealized P&L |
| `position.getProfitAtPrice(price, noRounding, perLotCost)` | target price | number | Hypothetical profit at given price |
| `position.getProfitPercentage(profit, noRounding, perLotCost)` | optional profit | number | Profit as % of initial balance |
| `position.getRisk(noRounding, perLotCost)` | | number | Dollar risk amount |
| `position.getRiskPercentage(noRounding, perLotCost)` | | number | Risk as % of initial balance |
| `position.getRR(noRounding)` | | number | Risk/Reward ratio |
| `position.getOriginalTPProfit(perLotCost)` | | number | Profit if TP was hit (original TP) |
| `position.getLeverage()` | | number | Calculated leverage used |
| `position.isBreakEven(perLotCost)` | | boolean | True if profit < risk/10 |

### Cumulative Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `position.getCumulativeProfit(profit, noRounding, perLotCost)` | number | Initial balance + profit |
| `position.getCumulativeProfitPercentage(profit, noRounding, perLotCost)` | number | Cumulative profit as % of starting capital |

### Run-up/Drawdown Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `position.getRunUp(noRounding, perLotCost)` | number | Maximum favorable excursion (MFE) |
| `position.getRunUpPercentage(noRounding, perLotCost)` | number | Run-up as % of initial balance |
| `position.getDrawDown(noRounding, perLotCost)` | number | Maximum adverse excursion (MAE) - always negative |
| `position.getDrawDownPercentage(noRounding, perLotCost)` | number | Drawdown as % - always negative |
| `position.getBERunUp(noRounding, perLotCost)` | number | Run-up after BE was hit |
| `position.getBERunUpPercentage(noRounding, perLotCost)` | number | BE Run-up as % |
| `position.getVirtualRunUp(noRounding)` | number | Post-exit run-up tracking |
| `position.getVirtualDrawDown(noRounding)` | number | Post-exit drawdown tracking |
| `position.getVirtualBERunUp(noRounding)` | number | Post-exit BE run-up |

### Column Access Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `position.columnValue(name)` | any | Get column value by name |
| `position.columnValue(name, value, dontStore)` | void | Set column value (persists unless dontStore=true) |
| `position.getColumn(name)` | object | Get column definition {columnId, columnName, value} |

### Shape Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `position.getShape(chart)` | object | TradingView shape object for position |

### Parameter Notes
- `noRounding`: When `true`, returns full precision instead of formatted value
- `perLotCost`: Cost per lot to deduct from calculations (for slippage/commission)
- `index`: For history arrays (BEs, SLs, TPs), which index to read (0=original, -1 or undefined=latest)
- `chart`: TradingView chart object, usually from `L.getPositionChart(position)`

---

## How Skipping Candles Works

`L.skipTime(seconds, nonStop)` in testingview.candles.js:

1. **Calculate Target**: Determines `targetTimestamp` based on:
   - If `nonStop=true`: Simply adds seconds to current time
   - If `nonStop=false`: Aligns to chart timeframe boundaries (e.g., skip to next 15-minute mark)

2. **Resolution Selection**: Gets available replay resolutions, sorts by size descending

3. **Skip Loop**: While `currentTimestamp < targetTimestamp`:
   - Finds best resolution that fits remaining time
   - Changes replay resolution if needed via `L.r.changeReplayResolution()`
   - Calls `L.stepForward()` which executes `L.r.doStep()`
   - Updates UI (play/pause buttons)

4. **Restore Resolution**: After skip completes, restores minimum replay resolution

`L.startAutoplay()` / `L.stopAutoPlay()` - continuous stepping with `L.session.meta.autoplayStarted` flag.

---

## How Predefined Times Work

Users can set times like "09:30, 10:00, 15:00" to auto-stop playback.

`L.stopAtPredefinedTime()`:
1. Checks `EnablePredefinedTimes` parameter is `"true"`
2. Gets predefined times from `PredefinedTimes` parameter (comma-separated)
3. For each time, checks if `lastKnownBarTime < time <= latestBarTime`
4. If approaching predefined time:
   - Shows toast: "Auto stopping candle playback at {time}"
   - Calls `L.stopSkipping()`
   - Sets up interval to step forward bar-by-bar until exact time reached
   - Sets `L.session.meta.latestPredefinedTime` to prevent re-triggering

---

## Statistics System

`L.stats` object in testingview.stats.js:

**Core Methods**:
- `L.stats.getClosedPositions()` - Filters positions with exitTime, cached
- `L.stats.getEffectivePositions(perLotCost)` - Excludes break-even trades (profit < risk/10)
- `L.stats.getHighLevelStats(positions, perLotCost)` - Returns {totalTrades, winningTrades, losingTrades, winrate, profitFactor, avgRiskToReward}
- `L.stats.getStreaks(positions, perLotCost)` - Returns {maxConsecutiveWins, maxConsecutiveLosses, maxConsecutiveBes}
- `L.stats.computeMaxDrawdown()` - Calculates maximum equity drawdown
- `L.stats.getStatsSummary()` - Formatted string for tooltip display
- `L.stats.computeCostPerLot()` - Distributes percentage-based costs across positions

**Export**: `L.stats.exportStats()` scrapes journal table HTML to build Excel export via `L.dataOps.exportSessionStatistics()`.

**Visualization**: `L.stats.drawEquityCurve()` renders canvas chart of equity over time.

---

## Snapshots System

Snapshots capture chart state at specific moments during backtesting.

**Taking Snapshots** (`L.takeSnapshot(position, snapshotsPerChart, copyImageToClipboard)`):
1. Calls `L.brandSnapshots()` to inject TestingView branding into TradingView's screenshot metadata
2. For multi-chart: Can take separate snapshots of each timeframe or combined
3. Uses `L.t.takeScreenshot()` (TradingView API) which returns a short URL code
4. Stores in `position.positionSnapshots[]` with `{snapshotUrl, sessionTime}`
5. Saves via `L.dataOps.setPositionSnapshots()`

**Viewing Snapshots** (`L.viewSnapshots(event, position)`):
1. Creates modal overlay with image viewer
2. Preloads all snapshot images
3. Navigation: Arrow keys, prev/next buttons
4. Actions: Delete snapshot, copy URL to clipboard
5. URLs format: `https://tradingview.com/x/{snapshotUrl}`

**Auto-Snapshot**: When `AutoSnapshot` parameter is `"true"`, snapshots are taken automatically on position open, BE hit, and position close.

---

## Journaling System

The journal is a custom table UI in testingview.journal.js that replaces TradingView's trading panel.

**Column Types**:
- Predefined: Trade, Date/Time, Price, Symbol, Lots, RR, Risk, Profit, Cumulative profit, Run-up, Drawdown, BE Run-up, Snapshots, Notes, Analysis Time
- Custom: User-defined columns with types (text, number, bool, date, time, datetime, enum)
- Virtual columns: Virtual Run-up, Virtual Drawdown (track what-if scenarios)

**Position Row Structure**:
- Each row shows entry (bottom) and exit (top) in a "double cell" layout
- Color coding: Green for profit, red for loss
- Action buttons: Take snapshot, view snapshots, show BE line, close position, delete position

**Data Flow**:
- `L.session.sessionColumns[]` defines visible columns
- `position.positionColumns[]` stores custom column values
- `position.columnValue(name, value, dontStore)` - Get/set column values
- Changes persist via `L.dataOps.setPositionColumn()`

---

## Session State Structure

```javascript
L.session = {
    sessionId: "guid",
    name: "Session Name",
    capital: 10000,                    // Starting capital
    currencyId: "USD",                 // Account currency
    currentDate: 1704067200,           // Unix timestamp (seconds)
    positions: [],                     // All Position objects
    sessionColumns: [],                // Column definitions
    
    // Non-enumerable (not persisted)
    meta: {
        balance: 10500,                // Current balance after closed P&L
        equity: 10700,                 // Balance + open P&L
        stats: { costPercent: 0 },     // Stats settings
        isReviewMode: false,           // Playback paused for review
        autoplayStarted: false,
        forceStopPlayback: false,
        entryShapeCharts: [],          // Pending entry shapes
        dateIncrements: [],            // For detecting time jumps
        analysisTimes: [],             // Time tracking data
        // ... many more runtime flags
    }
}
```

---

## Development Workflow

### Building/Compiling
- When a stable release is ready, upload all the files from /js/, /config/ and /css/ folders to the server
- Command to bundle sources:
```bash
curl "https://api.testingview.com/app/compile?debug=true"
```
- This will always have to be done manually whenever a decision is made for a new release

### File Organization
- `/js/` - Core JavaScript modules
- `/css/` - Stylesheets (testingview.raw.css → compiled to testingview.css)
- `/config/` - Localization JSON files (loc.1.raw.json, loc.2.raw.json)
- `/TV/` - TradingView library chunks (DO NOT MODIFY)

### Adding New Functionality
1. Attach to `L` object: `L.myFeature = function() { ... }`
2. Use event hooks: `L.subscribe(L.events.onFastForward, handler)`
3. For new strings: Add to `loc.*.raw.json` in any section (0-9 or -1 to -9), use next available index

### Async Patterns
```javascript
await L.waitUntil(async () => condition, maxRetries=50, delayMs=100);
L.asyncInterval(async () => { /* return -1 to stop */ }, intervalMs, decayFactor);
await L.delay(ms);
L.tryExec(() => riskyCode, suppressError=false);
await L.tryExecAsync(async () => riskyCode, suppressError=false);
```

### TradingView API Access
```javascript
L.c()                                    // Active chart (shorthand)
L.getCharts()                            // All charts sorted by timeframe
L.t.chartsCount()                        // Number of open charts
L.r.currentDate().value()                // Current replay time (Unix seconds)
L.r.isReplayStarted().value()            // Boolean
L.r.doStep()                             // Advance one bar
L.r.selectDate(date)                     // Jump to date
chart.createShape(point, options)        // Create drawing
chart.getShapeById(id)                   // Get shape object
chart.chartModel().mainSeries().bars()   // Bar data access
```
---

## Error Handling Patterns

### `L.tryExec(func, suppressError)`
Synchronous try/catch wrapper for risky operations:
```javascript
L.tryExec(() => riskyOperation(), false);  // Logs warning on error
L.tryExec(() => riskyOperation(), true);   // Silently ignores errors
```

### `L.tryExecAsync(func, suppressError)`
Async try/catch wrapper:
```javascript
await L.tryExecAsync(async () => await riskyAsyncOperation(), false);
```

### Common Usage Patterns
```javascript
// TradingView API calls that may fail due to state
L.tryExec(() => L.r.replayTimingMode().setValue("manual"));
L.tryExec(() => shape.setPoints(points), true);

// Clipboard operations (may fail due to permissions)
await L.tryExecAsync(() => navigator.clipboard.writeText(url), true);

// Replay speed changes
L.tryExec(() => { L.r.changeAutoplayDelay(1000); }, true);
```

### API Response Handling
`L.dataOps.get/post/put/delete` only return data on HTTP 200:
```javascript
L.dataOps.get = function(url) {
    return fetch(url).then(response => {
        if (response.status === 200) {
            return response.json();
        }
        // Returns undefined on error - callers must handle!
    });
}
```

### When to Use `suppressError = true`
- Shape manipulation (shapes may be deleted mid-operation)
- Clipboard API (user may not have granted permission)
- TradingView internal state access (objects may be disposed)
- Cleanup/teardown operations

---

## TradingView API Quirks

### Accessing TradingView Objects
- `L.t` = `TradingViewApi` (main API)
- `L.r` = `TradingViewApi.replayApi()` (replay controller)
- Chart access: `L.c()` (active chart), `L.getCharts()` (all charts sorted by timeframe)

### State Timing Issues
TradingView operations are often async internally. Use `L.waitUntil()` to wait for state changes:
```javascript
chart.changingSymbol = true;
await chart.setSymbol(symbolName);
const ok = await L.waitUntil(async () => !chart.changingSymbol);
if(!ok) {
    chart.changingSymbol = false;
    return false;
}
```

### Shape Manipulation
Always wrap shape operations in `L.tryExec()` - shapes may be deleted mid-operation by TradingView:
```javascript
L.tryExec(() => shape.setPoints(points), true);
L.tryExec(() => chart.removeEntity(shape.id()), true);
```

### Replay Resolution Changes
May trigger chart reloads. The `PreventCandlePreviews` session parameter controls whether to:
- Save current position before resolution change
- Wait for chart reload
- Navigate back to saved position using `L.selectDateWithNavigation()`

### Property Subscription Throttling
TradingView property subscriptions fire rapidly (sometimes multiple times per frame). Use debounce:
```javascript
shapeDataSourceProperties.accountSize.subscribe(null, () => {
    if (shapeDataSourceProperties.accountSize.value() != shapeProperties.accountSize 
        && (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now())) {
        L.session.meta.lastSyncTime = Date.now();
        shapeDataSourceProperties.accountSize.setValue(shapeProperties.accountSize);
    }
});
```

### Symbol Change Tracking
Track in-progress symbol changes to prevent race conditions:
```javascript
chart.changingSymbol = true;
// ... perform change
chart.changingSymbol = false;
```

### Candle Preview Problem
When changing timeframes in replay mode, TradingView briefly shows "future" candles. The workaround:
1. Navigate to last complete candle close BEFORE target time
2. Step forward bar-by-bar using `L.skipTime()` to reach exact target
3. Controlled by `PreventCandlePreviews` session parameter

### Internal API Access Patterns
```javascript
// Access chart model internals (may change between TradingView versions)
chart.chartModel().mainSeries().bars()

// Get replay resolutions
L.r.getAvailableResolutions()
```

---

## Columns System Details

### Predefined Columns
Checked via `L.isPredefinedColumn(columnName, exceptColumns)`:
```javascript
L.isPredefinedColumn = (columnName, exceptColumns) => {
    return (!exceptColumns || !exceptColumns.includes(columnName)) && [
        L.r.s(1, -1) /* Trade */, L.r.s(1, -2) /* Date/Time */, L.r.s(1, -3) /* Price */, 
        L.r.s(1, -4) /* Symbol */, L.r.s(1, -5) /* Lots */, L.r.s(1, -6) /* RR */, 
        L.r.s(1, -7) /* Risk */, L.r.s(1, -8) /* Profit */, L.r.s(1, -9) /* Cumulative profit */, 
        L.r.s(2, -1) /* Run-up */, L.r.s(2, -2) /* Drawdown */, L.r.s(2, -3) /* Snapshots */, 
        L.r.s(2, -4) /* BE Run-up */, L.r.s(2, -5) /* Notes */, L.r.s(2, -6) /* Analysis Time */, 
        L.s(-7, -6) /* Virtual Run-up */, L.s(-7, -7) /* Virtual Drawdown */, 
        L.s(-7, -8) /* Virtual BE Run-up */
    ].includes(columnName);
};
```

### Custom Column Types
| Type | Input Control | Storage |
|------|---------------|---------|
| `text` | `<input type="text">` | String |
| `number` | `<input type="number">` | String (parsed as float) |
| `bool` | `<input type="checkbox">` | "true" / "false" |
| `date` | Date picker | ISO date string |
| `time` | Time picker | ISO time string |
| `datetime` | DateTime picker | ISO datetime string |
| `enum` | `<select>` dropdown | Selected option string |

### Column Data Flow
1. **Session Load**: `L.dataOps.getSessionColumns(sessionId)` → `L.session.sessionColumns[]`
2. **Position Load**: `L.dataOps.getSessionPositions(sessionId)` includes `position.positionColumns[]`
3. **Column Access**: `position.columnValue(name)` searches both predefined and custom columns
4. **Column Update**: `position.columnValue(name, value)` → `L.dataOps.setPositionColumn(positionId, column)`
5. **UI Sync**: `L.updatePositionUI(position)` refreshes journal table row